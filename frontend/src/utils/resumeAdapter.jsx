// Helper to create a Tiptap Node JSON object
const node = (type, attrs = {}, content = []) => ({ type, attrs, content });
const text = (text, marks = []) => ({ type: 'text', text, marks });
const paragraph = (content = []) => node('paragraph', {}, content);

// Helper to create the new header structure
const createEntryHeader = (institution, location, dates) => {
  return node('entryTitleHeader', {}, [
    node('institution', {}, [text(institution || 'Institution...')]),
    node('location', {}, [text(location || 'Location...')]),
    node('date', {}, [text(dates || 'Dates...')])
  ]);
};

export const transformJsonToTiptap = (resumeData) => {
  
  // 0. Initialize document content array
  const docContent = [];

  // 1. Create PersonalSection Node/Sub-nodes
  const personalContentNodes = [];
  personalContentNodes.push(
    node('heading', { level: 1 }, [text(resumeData.personal.name)])
  );
  if (resumeData.personal.summary) {
    personalContentNodes.push(paragraph([text(resumeData.personal.summary)]));
  }
  personalContentNodes.push(node('separatorLine', {})); 

  const contactDetailNodes = []; 
  const createContactNode = (type, value) => 
    node('contactDetail', { type: type, value: value });

  if (resumeData.personal.email) contactDetailNodes.push(createContactNode('email', resumeData.personal.email));
  if (resumeData.personal.phone) contactDetailNodes.push(createContactNode('phone', resumeData.personal.phone));
  if (resumeData.personal.linkedin) contactDetailNodes.push(createContactNode('linkedin', resumeData.personal.linkedin));
  if (resumeData.personal.website) contactDetailNodes.push(createContactNode('website', resumeData.personal.website));
  
  if (contactDetailNodes.length > 0) {
    personalContentNodes.push(node('contactRow', {}, contactDetailNodes));
  }
  docContent.push(node('personalSection', {}, personalContentNodes));

  // 2. Crete ResumeSection Nodes/Sub-Nodes
  resumeData.sections.forEach(section => {
    const sectionTitle = section.title;
    const sectionContentNodes = [];

    sectionContentNodes.push(node('sectionTitle', {}, [text(sectionTitle)]))

    // a. Create Skills Section Nodes/Sub-nodes
    if (sectionTitle.toLowerCase().includes('skills')) {
      const skillsArray = section.entries || []; 
      const skillsString = skillsArray.join(', ');
      sectionContentNodes.push(node('skillsEntry', {}, [paragraph([text(skillsString)])]));
    }

    else if (section.entries) {
      section.entries.forEach(entry => {
        
        // b. Create Education Section Nodes/Sub-nodes
        if (section.title.toLowerCase().includes('education')) {
          const degrees = entry.degrees.map(d => {
            // Create Degree Header
            const headerContent = [
                { type: 'degree', content: [text(d.degree)] },
                { type: 'major', content: [text(d.major)] }
            ];
            if (d.gpa) {
                headerContent.push({ type: 'gpa', content: [text(d.gpa)] });
            }

            const degreeChildren = [{ type: 'degreeHeader', content: headerContent }];
            
            // Add bullets if they exist
            if (d.bullets && d.bullets.length > 0) {
                 degreeChildren.push({
                     type: 'bulletList',
                     content: d.bullets.map(b => ({ type: 'listItem', content: [paragraph([text(b)])] }))
                 });
            }

            return { type: 'educationDegree', content: degreeChildren };
          });

          sectionContentNodes.push({
            type: 'educationEntry',
            content: [
                createEntryHeader(entry.school, entry.location, entry.dates), // Use helper from previous step
                ...degrees
            ]
          });
        }

        // b. Create Work Experience Section Nodes/Sub-nodes
        else if (sectionTitle.toLowerCase().includes('work')) {
          sectionContentNodes.push(node('workEntry', {}, [
            createEntryHeader(entry.company, entry.location, entry.dates),
            node('bulletList', {}, entry.bullets.map(b => node('listItem', {}, [paragraph([text(b)])])))
          ]));
        }

        // c. Create Research Section Nodes/Sub-nodes
        else if (sectionTitle.toLowerCase().includes('research')) {
          sectionContentNodes.push(node('researchEntry', {}, [
            createEntryHeader(entry.institution, entry.location, entry.dates),
            node('bulletList', {}, entry.bullets.map(b => node('listItem', {}, [paragraph([text(b)])])))
          ]));
        }

        // d. Create Project / Leadership Section Nodes/Sub-nodes
        else if (section.title.toLowerCase().includes('project') || section.title.toLowerCase().includes('leadership')) {
            const entryType = section.title.toLowerCase().includes('project') ? 'projectEntry' : 'leadershipEntry';
            
            // We construct a SINGLE paragraph containing: [TitleNode, Text(" - "), Text(Description)]
            const paragraphContent = [
                { type: 'entryTitleSimple', content: [text(entry.title)] },
                text(' - '), // Separator text
                text(entry.description)
            ];

            sectionContentNodes.push({
                type: entryType,
                content: [paragraph(paragraphContent)]
            });
        }
      });
    }

    // e. Add ResumeSection Node to docContent
    docContent.push(node('resumeSection', { sectionType: sectionTitle }, sectionContentNodes));
  });
  console.log(docContent);
  return { type: 'doc', content: docContent };
};

export const transformTiptapToJson = (tiptapJson) => {
    console.log("Saving Tiptap JSON:", tiptapJson);
    return {}; 
};