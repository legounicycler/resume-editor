// Helper to create a Tiptap Node JSON object
const node = (type, attrs = {}, content = []) => ({ type, attrs, content });
const text = (text, marks = []) => ({ type: 'text', text, marks });
const paragraph = (content = []) => node('paragraph', {}, content);

// --- 1. SMART INGESTION HELPER ---
// Detects if the data is already Tiptap JSON (Array) or a String (HTML/Plain)
const parseSmartContent = (data) => {
  // If the data source already provides the Mark array, use it directly.
  if (Array.isArray(data)) {
    return data;
  }
  
  // If it's a string, use DOMParser (This implementation assumes you copied the full function from the previous thought)
  if (typeof data === 'string') {
    if (!data) return [];
    
    const parser = new DOMParser();
    const doc = parser.parseFromString(data, 'text/html');
    const nodes = [];

    const processNode = (domNode, currentMarks = []) => {
      if (domNode.nodeType === Node.TEXT_NODE) {
        if (domNode.textContent) {
          nodes.push({ type: 'text', text: domNode.textContent, marks: currentMarks });
        }
      } else if (domNode.nodeType === Node.ELEMENT_NODE) {
        const newMarks = [...currentMarks];
        if (['STRONG', 'B'].includes(domNode.tagName)) newMarks.push({ type: 'bold' });
        if (['EM', 'I'].includes(domNode.tagName)) newMarks.push({ type: 'italic' });
        if (['U'].includes(domNode.tagName)) newMarks.push({ type: 'textStyle', attrs: { textDecoration: 'underline' } });
        
        domNode.childNodes.forEach(child => processNode(child, newMarks));
      }
    };

    doc.body.childNodes.forEach(node => processNode(node));
    return nodes;
  }
  return [];
};


// Helper to convert Tiptap Content Array back into an HTML string
const convertContentToHtml = (contentArray) => {
    let html = '';
    if (!contentArray) return '';

    contentArray.forEach(node => {
        if (node.type === 'text') {
            let textStr = node.text;
            let marks = node.marks || [];

            // Simple HTML conversion for AI
            marks.forEach(mark => {
                if (mark.type === 'bold') textStr = `<strong>${textStr}</strong>`;
                if (mark.type === 'italic') textStr = `<em>${textStr}</em>`;
                if (mark.type === 'textStyle' && mark.attrs?.textDecoration === 'underline') textStr = `<u>${textStr}</u>`;
                if (mark.type === 'highlight' || mark.type === 'aiHighlight') textStr = `<mark>${textStr}</mark>`;
                // Note: Font size needs to be handled at the block level, not inline text marks
            });
            html += textStr;

        } else if (node.type === 'entryTitleSimple') {
            // Special handling for the title node: treat its content as rich text and wrap it
             html += `<strong><u>${convertContentToHtml(node.content)}</u></strong>`;

        } else if (node.content && node.type !== 'paragraph' && node.type !== 'listItem') {
            html += convertContentToHtml(node.content);
        }
        else if (node.type === 'paragraph' || node.type === 'listItem') {
            // Ignore block wrappers, just get the content
            html += convertContentToHtml(node.content);
        }
    });
    return html;
};


// Helper to extract rich text content from a Tiptap node (e.g., from an entryTitleSimple node)
const extractRichContent = (contentArray) => {
    // We store the content array directly into the semantic JSON field
    return contentArray; 
};

// Helper to create the entry header structure
const createEntryHeader = (institution, location, dates) => {
  return node('entryTitleHeader', {}, [
    node('institution', {}, parseSmartContent(institution || 'Institution...')),
    node('location', {}, parseSmartContent(location || 'Location...')),
    node('date', {}, parseSmartContent(dates || 'Dates...'))
  ]);
};

// --- 2. MAIN ADAPTER (JSON -> TIPTAP) ---
export const transformJsonToTiptap = (resumeData) => {
  const docContent = [];

  // 1. Personal Section (Name, Summary, Contacts)
  const personalContentNodes = [];
  personalContentNodes.push(
    node('heading', { level: 1 }, parseSmartContent(resumeData.personal.name))
  );
  if (resumeData.personal.summary) {
    personalContentNodes.push(paragraph(parseSmartContent(resumeData.personal.summary)));
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

  // 2. Resume Sections
  resumeData.sections.forEach(section => {
    const sectionTitle = section.title;
    const sectionContentNodes = [];

    sectionContentNodes.push(node('sectionTitle', {}, parseSmartContent(sectionTitle)));

    // A. Skills
    if (sectionTitle.toLowerCase().includes('skills')) {
      const skillsArray = section.entries || []; 
      const skillsString = skillsArray.map(s => typeof s === 'string' ? s : JSON.stringify(s)).join(', ');
      sectionContentNodes.push(node('skillsEntry', {}, [paragraph(parseSmartContent(skillsString))]));
    }
    // B. Loop through entries for Education, Work, etc.
    else if (section.entries) {
      section.entries.forEach(entry => {
        
        // Education
        if (section.title.toLowerCase().includes('education')) {
          const degrees = (entry.degrees || []).map(d => {
            const headerContent = [
                { type: 'degreeType', content: parseSmartContent(d['degree-type']) },
                { type: 'major', content: parseSmartContent(d.major) },
                { type: 'gpa', content: parseSmartContent(d.gpa) }
            ];

            const degreeChildren = [{ type: 'degreeHeader', content: headerContent }];
            
            if (d.bullets && d.bullets.length > 0) {
                 degreeChildren.push({
                     type: 'bulletList',
                     content: d.bullets.map(b => node('listItem', {}, [paragraph(parseSmartContent(b))]))
                 });
            }
            return { type: 'degree', content: degreeChildren };
          });

          sectionContentNodes.push(node('educationEntry', {}, [
              createEntryHeader(entry.school, entry.location, entry.dates), 
              ...degrees
          ]));
        }

        // Work & Research
        else if (sectionTitle.toLowerCase().includes('work') || sectionTitle.toLowerCase().includes('research')) {
          const isWork = sectionTitle.toLowerCase().includes('work');
          const entryType = isWork ? 'workEntry' : 'researchEntry';
          const inst = isWork ? entry.company : entry.institution;

          sectionContentNodes.push(node(entryType, {}, [
            createEntryHeader(inst, entry.location, entry.dates),
            node('bulletList', {}, (entry.bullets || []).map(b => 
              node('listItem', {}, [paragraph(parseSmartContent(b))])
            ))
          ]));
        }

        // Project
        else if (section.title.toLowerCase().includes('project')) {
            const paragraphContent = [
                { type: 'entryTitleSimple', content: parseSmartContent(entry.title) }, 
                text(' - '), 
                ...parseSmartContent(entry.description)
            ];
            sectionContentNodes.push(node('projectEntry', { 
                title: entry.title,
                skills: entry.skills || []
            }, [paragraph(paragraphContent)]));
        }

        // Leadership
        else if (section.title.toLowerCase().includes('leadership')) {
            const paragraphContent = [
                { type: 'entryTitleSimple', content: parseSmartContent(entry.title) }, 
                text(' - '), 
                ...parseSmartContent(entry.description)
            ];
            sectionContentNodes.push(node('leadershipEntry', { 
                title: entry.title 
            }, [paragraph(paragraphContent)]));
        }
      });
    }

    docContent.push(node('resumeSection', { sectionType: sectionTitle }, sectionContentNodes));
  });

  return { type: 'doc', content: docContent };
};


// --- 3. SAVER (TIPTAP -> JSON) ---
export const transformTiptapToJson = (tiptapJson) => {
    if (!tiptapJson || !tiptapJson.content) return {};

    const semanticJson = { 
        personal: {}, 
        sections: [] 
    };

    // 1. Extract Personal Info
    const personalSection = tiptapJson.content.find(n => n.type === 'personalSection');
    if (personalSection) {
        const heading = personalSection.content.find(n => n.type === 'heading');
        const summary = personalSection.content.find(n => n.type === 'paragraph');
        // Extract Name (Rich Text Array)
        semanticJson.personal.name = heading ? heading.content : [];
        // Extract Summary (Rich Text Array)
        semanticJson.personal.summary = summary ? summary.content : [];
        
        // Extract Contacts
        const contactRow = personalSection.content.find(n => n.type === 'contactRow');
        if (contactRow) {
            contactRow.content.forEach(c => {
                if (c.type === 'contactDetail') {
                    semanticJson.personal[c.attrs.type] = c.attrs.value;
                }
            });
        }
    }

    // 2. Extract Sections
    const sections = tiptapJson.content.filter(n => n.type === 'resumeSection');
    semanticJson.sections = sections.map(secNode => {
        const titleNode = secNode.content.find(n => n.type === 'sectionTitle');
        const titleContent = titleNode ? titleNode.content : [];
        // Convert title content to string for the "title" field key, but we could store rich text if needed
        // For now, we assume title is simple text for the ID, but user can save rich text if schema allows.
        const sectionTitleString = titleNode ? titleNode.content.map(t => t.text).join('') : 'Unknown';

        const sectionObj = {
            title: titleContent, // Saving as Tiptap Content Array
            entries: []
        };

        // A. Skills
        const skillsNode = secNode.content.find(n => n.type === 'skillsEntry');
        if (skillsNode) {
            // Flatten paragraph back to array/string? For now, save the whole paragraph content.
            const p = skillsNode.content.find(n => n.type === 'paragraph');
            // We'll store it as a single entry for simplicity
            sectionObj.entries = p ? p.content : [];
        }

        // B. Generic Entries (Work/Edu/Research)
        // We look for entry nodes
        secNode.content.forEach(child => {
            if (['workEntry', 'researchEntry'].includes(child.type)) {
                const header = child.content.find(n => n.type === 'entryTitleHeader');
                const bullets = child.content.find(n => n.type === 'bulletList');
                
                const entryObj = {
                    // Extract Header Fields (Rich Text)
                    institution: header.content.find(n => n.type === 'institution')?.content,
                    company: header.content.find(n => n.type === 'institution')?.content, // Map based on type
                    location: header.content.find(n => n.type === 'location')?.content,
                    dates: header.content.find(n => n.type === 'date')?.content,
                    // Extract Bullets (Rich Text Arrays)
                    bullets: bullets ? bullets.content.map(li => li.content[0].content) : []
                };
                sectionObj.entries.push(entryObj);
            }
            
            else if (child.type === 'educationEntry') {
                const header = child.content.find(n => n.type === 'entryTitleHeader');
                const degrees = child.content.filter(n => n.type === 'degree');
                
                const entryObj = {
                    school: header.content.find(n => n.type === 'institution')?.content,
                    location: header.content.find(n => n.type === 'location')?.content,
                    dates: header.content.find(n => n.type === 'date')?.content,
                    degrees: degrees.map(deg => {
                        const degHeader = deg.content.find(n => n.type === 'degreeHeader');
                        const bulletList = deg.content.find(n => n.type === 'bulletList');
                        return {
                            degreeType: degHeader.content.find(n => n.type === 'degreeType')?.content,
                            major: degHeader.content.find(n => n.type === 'major')?.content,
                            gpa: degHeader.content.find(n => n.type === 'gpa')?.content,
                            bullets: bulletList ? bulletList.content.map(li => li.content[0].content) : []
                        };
                    })
                };
                sectionObj.entries.push(entryObj);
            }
            
            // C. Project/Leadership (List Items)
            else if (child.type === 'bulletList' && (sectionTitleString.toLowerCase().includes('project') || sectionTitleString.toLowerCase().includes('leadership'))) {
                child.content.forEach(li => {
                    // Each LI is an entry. Content is in the paragraph.
                    const pContent = li.content[0].content;
                    
                    // We save the ENTIRE line as "description" or "fullContent"
                    // because splitting Title from Description programmatically is risky if user edits separator.
                    sectionObj.entries.push({
                        description: pContent // Saving the full rich text line
                    });
                });
            }
        });

        return sectionObj;
    });

    return semanticJson;
};


// --- 4. AI PARSER (TIPTAP JSON -> HTML STRING) ---
// Use this when you need to send data to the AI model
export const convertRichTextToAiHtml = (tiptapNodes) => {
    if (!tiptapNodes || !Array.isArray(tiptapNodes)) return '';
    
    let html = '';
    
    tiptapNodes.forEach(node => {
        if (node.type === 'text') {
            let textStr = node.text;
            
            if (node.marks) {
                node.marks.forEach(mark => {
                    if (mark.type === 'bold') textStr = `<strong>${textStr}</strong>`;
                    if (mark.type === 'italic') textStr = `<em>${textStr}</em>`;
                    if (mark.type === 'textStyle' && mark.attrs?.textDecoration === 'underline') {
                         textStr = `<u>${textStr}</u>`;
                    }
                    if (mark.type === 'highlight') textStr = `<mark>${textStr}</mark>`;
                    // Add more mappings as needed for AI understanding
                });
            }
            html += textStr;
        } 
        // Handle structural nodes if nested (like paragraphs inside lists)
        else if (node.content) {
             html += convertRichTextToAiHtml(node.content);
        }
    });
    
    return html;
};