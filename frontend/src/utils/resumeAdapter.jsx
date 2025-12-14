// Helper to create a Tiptap Node JSON object
const node = (type, attrs = {}, content = []) => ({ type, attrs, content });
const text = (text, marks = []) => ({ type: 'text', text, marks });
const paragraph = (content = []) => node('paragraph', {}, content);

// HTML String -> Tiptap Content Array (Simplification: relying on Tiptap to parse HTML strings inside the editor if needed, 
// but here we are constructing the JSON tree manually).
// For simplicity in this step, we will assume bullets are HTML strings that we wrap in a generic list structure.
// NOTE: Tiptap is smart. If we give it HTML string content in a `setContent`, it parses. 
// But here we are building a specific Node Tree.

export const transformJsonToTiptap = (resumeData) => {
  const docContent = [];

  // 1. Personal Section
  const personalContentNodes = [
    node('heading', { level: 1 }, [text(resumeData.personal.name)]),
  ];
  if (resumeData.personal.summary) {
    personalContentNodes.push(paragraph([text(resumeData.personal.summary)]));
  }

  // Combine contact info into one paragraph
  const contactInfoParts = [];
  if (resumeData.personal.email) contactInfoParts.push(resumeData.personal.email);
  if (resumeData.personal.phone) contactInfoParts.push(resumeData.personal.phone);
  if (resumeData.personal.linkedin) contactInfoParts.push(resumeData.personal.linkedin);
  if (resumeData.personal.website) contactInfoParts.push(resumeData.personal.website);

  if (contactInfoParts.length > 0) {
    personalContentNodes.push(paragraph([text(contactInfoParts.join(' | '))]));
  }
  docContent.push(node('personalSection', {}, personalContentNodes));

  // 2. Sections
  resumeData.sections.forEach(section => {
    const sectionTitle = section.title;
    const sectionContentNodes = []; // Collects heading + entries for this section

    // -- Heading --
    sectionContentNodes.push(node('heading', { level: 2 }, [text(sectionTitle)]));

    // --- Special handling for Skills section (as it's a single entry with different structure) ---
    if (sectionTitle.toLowerCase().includes('skills')) {
      const skillsArray = section.entries || []; // `section.entries` is directly an array of strings for skills
      const skillsString = skillsArray.join(', ');
      sectionContentNodes.push(
        node('skillsEntry', {}, [
          paragraph([text(skillsString)])
        ])
      );
    } 
    // --- Handle other sections with multiple distinct entries ---
    else if (section.entries) {
      section.entries.forEach(entry => {
        
        // Education Mapping
        if (sectionTitle.toLowerCase().includes('education')) {
          const educationDegreeNodes = entry.degrees.map(degree => {
            // Content of EducationDegree is a bulletList
            const bulletListContent = (degree.bullets && degree.bullets.length > 0)
              ? [node('bulletList', {}, degree.bullets.map(b =>
                  node('listItem', {}, [paragraph([text(b)])])
                ))]
              : [];

            return node('educationDegree', {
              degree: degree.degree,
              major: degree.major,
              gpa: degree.gpa || '', // Ensure GPA is always a string or empty string
            }, bulletListContent);
          });

          sectionContentNodes.push(node('educationEntry', {
            school: entry.school,
            location: entry.location,
            dates: entry.dates,
          }, educationDegreeNodes)); // Content of educationEntry is an array of educationDegree nodes
        }

        // Work Experience Mapping
        else if (sectionTitle.toLowerCase().includes('work')) {
          sectionContentNodes.push(node('workEntry', {
            company: entry.company,
            location: entry.location,
            dates: entry.dates,
          }, [
            node('bulletList', {}, entry.bullets.map(b => 
              node('listItem', {}, [paragraph([text(b)])])
            ))
          ]));
        }

        // Research mapping
        else if (sectionTitle.toLowerCase().includes('research')) {
          sectionContentNodes.push(node('researchEntry', {
            institution: entry.institution,
            location: entry.location,
            dates: entry.dates,
          }, [
            node('bulletList', {}, entry.bullets.map(b => 
              node('listItem', {}, [paragraph([text(b)])])
            ))
          ]));
        }

        // Project Mapping
        else if (sectionTitle.toLowerCase().includes('project')) {
            sectionContentNodes.push(node('projectEntry', { 
                title: entry.title,
                skills: entry.skills || [] // Add skills attribute
            }, [
                paragraph([text(entry.description)])
            ]));
        }

        // Leadership Mapping
        else if (sectionTitle.toLowerCase().includes('leadership')) {
          sectionContentNodes.push(node('leadershipEntry', { title: entry.title }, [
              paragraph([text(entry.description)])
          ]));
        }
      });
    }

    // Add the section to doc
    docContent.push(node('resumeSection', { sectionType: sectionTitle }, sectionContentNodes));
  });

  return {
    type: 'doc',
    content: docContent
  };
};

export const transformTiptapToJson = (tiptapJson) => {
    // This function reverses the process
    // It loops through doc.content, finds 'resumeSection', extracts attributes, etc.
    // We will implement this in the 'Saving' phase fully.
    console.log("Saving Tiptap JSON:", tiptapJson);
    return {}; // Placeholder
};