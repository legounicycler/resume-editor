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
const createEntryHeader = (institution, positionTitle, location, dates) => {
  const headerContent = [];
  headerContent.push(node('institution', {}, parseSmartContent(institution || 'Institution...')));
  if (positionTitle) {headerContent.push(node('positionTitle', {}, parseSmartContent(positionTitle)));}
  headerContent.push(node('location', {}, parseSmartContent(location || 'Location...')));
  headerContent.push(node('date', {}, parseSmartContent(dates || 'Dates...')));
  return node('entryTitleHeader', {}, headerContent);
};

const createPositionHeader = (positionTitle, positionDescription, location, dates) => {
  const headerContent = [];
  
  if (positionTitle) {
      headerContent.push(node('positionTitle', {}, parseSmartContent(positionTitle)));
  }
  if (positionDescription) {
      headerContent.push(node('positionDescription', {}, parseSmartContent(positionDescription)));
  }
  // TODO: Implement this view eventually
  // if (location) {
  //     headerContent.push(node('location', {}, parseSmartContent(location)));
  // }
  // if (dates) {
  //     headerContent.push(node('date', {}, parseSmartContent(dates)));
  // }

  // Return the new BLOCK container
  return node('positionEntryHeader', {}, headerContent);
};

// --- 2. MAIN ADAPTER (JSON -> TIPTAP) ---
export const transformJsonToTiptap = (resumeData) => {
  const docContent = [];

  // 1. Create the Personal Section nodes (Name, Summary, separator, Contacts)
  const personalSectionNodes = [];
  personalSectionNodes.push(
    node('heading', { level: 1 }, parseSmartContent(resumeData.personal.name))
  );
  if (resumeData.personal.summary) {
    personalSectionNodes.push(paragraph(parseSmartContent(resumeData.personal.summary)));
  }
  personalSectionNodes.push(node('separatorLine', {})); 

  const contactDetailNodes = []; 
  const createContactNode = (type, value) => 
    node('contactDetail', { type: type, value: value });

  if (resumeData.personal.email) contactDetailNodes.push(createContactNode('email', resumeData.personal.email));
  if (resumeData.personal.phone) contactDetailNodes.push(createContactNode('phone', resumeData.personal.phone));
  if (resumeData.personal.linkedin) contactDetailNodes.push(createContactNode('linkedin', resumeData.personal.linkedin));
  if (resumeData.personal.website) contactDetailNodes.push(createContactNode('website', resumeData.personal.website));
  
  if (contactDetailNodes.length > 0) {
    personalSectionNodes.push(node('contactRow', {}, contactDetailNodes));
  }
  docContent.push(node('personalSection', {}, personalSectionNodes));

  // 2. Resume Sections
  resumeData.sections.forEach(section => {
    const sectionTitle = section.title;
    const sectionContentNodes = [];

    sectionContentNodes.push(node('sectionTitle', {}, parseSmartContent(sectionTitle)));

    const titleLower = sectionTitle.toLowerCase();

    // A. Skills
    if (titleLower.includes('skills')) {
      const skillsArray = section.entries || []; 
      const skillsString = skillsArray.map(s => typeof s === 'string' ? s : JSON.stringify(s)).join(', ');
      sectionContentNodes.push(node('skillsEntry', {}, [paragraph(parseSmartContent(skillsString))]));
    }
    
    // B. Education
    else if (titleLower.includes('education')) {
      if (section.entries) {
        section.entries.forEach(entry => {
          const degrees = (entry.degrees || []).map(d => {
            const degreeNodes = [];

            const degreeHeaderNode = {type: 'degreeHeader', content: [
              { type: 'degreeType', content: parseSmartContent(d.degreeType) },
              { type: 'major', content: parseSmartContent(d.major) },
              { type: 'gpa', content: parseSmartContent(d.gpa) }
            ]};

            degreeNodes.push(degreeHeaderNode);
            
            if (d.bullets && d.bullets.length > 0) {
              degreeNodes.push({
                type: 'bulletList',
                content: d.bullets.map(b => node('listItem', {}, [paragraph(parseSmartContent(b))]))
              });
            }
            return { type: 'degree', content: degreeNodes };
          });

          sectionContentNodes.push(node('educationEntry', {}, [
            createEntryHeader(entry.school, null, entry.location, entry.dates), 
            ...degrees
          ]));
        });
      }
    }

    // C. Project & Leadership
    else if (titleLower.includes('project') || titleLower.includes('leadership')) {
        const entryType = titleLower.includes('project') ? 'projectEntry' : 'leadershipEntry';
        
        if (section.entries) {
            section.entries.forEach(entry => {
                const paragraphContent = [
                    { type: 'entryTitleSimple', content: parseSmartContent(entry.title) }, 
                    text(' - '), 
                    ...parseSmartContent(entry.description)
                ];

                sectionContentNodes.push(node(entryType, { 
                    title: entry.title,
                    skills: (entryType === 'projectEntry') ? (entry.skills || []) : undefined
                }, [
                    paragraph(paragraphContent)
                ]));
            });
        }
    }

    // D. Work & Research
    else if (titleLower.includes('work') || titleLower.includes('research')) {
      if (section.entries) {
        section.entries.forEach(entry => {
          const entryType = titleLower.includes('work') ? 'workEntry' : 'researchEntry';
          const positions = entry.positions || [];
          const companyName = entry.company || entry.institution || "Institution";

          // --- SCENARIO 1: FLATTENED VIEW (Single Position) ---
          if (positions.length === 1) {
            const pos = positions[0];
            
            sectionContentNodes.push(node(entryType, {}, [
              // Flattened Header: Company, Title, Location, and Date all siblings
              createEntryHeader(companyName, pos.title, pos.location, pos.dates),
              // Bullets follow directly
              node('bulletList', {}, (pos.bullets || []).map(b => 
                node('listItem', {}, [paragraph(parseSmartContent(b))])
              ))
            ]));
          }
          
          // --- SCENARIO 2: NESTED VIEW (Multiple Positions) ---
          else if (positions.length > 1) {
            const allLocations = positions.map(p => p.location).filter(loc => loc && loc.trim());
            const isSameLoc = new Set(allLocations).size === 1;
            
            // A. Construct the ENTRY header node by node
            const entryHeaderContent = [];

            // 1. Add the institution
            entryHeaderContent.push(node('institution', {}, parseSmartContent(companyName)));
            
            // 2. Optionally add the location
            if (allLocations.length > 0) {
              entryHeaderContent.push(node('location', {}, parseSmartContent(isSameLoc ? allLocations[0] : '')));
            }

            

            // 3. Add the dates
            entryHeaderContent.push(node('date', {}, parseSmartContent(positions[0].dates)))
            
            // 4. Construct the final header node
            const headerNode = node('entryTitleHeader', {}, entryHeaderContent);

            // B. Create the positionnon-header nodes
            const positionNodes = positions.map(pos => {
              const positionEntryContent = [];
              
              // 1. Create Header Block
              positionEntryContent.push(
                  createPositionHeader(pos.title, pos.description, pos.location, pos.dates)
              );
              
              // 2. Create List Block
              const bulletList = node('bulletList', {}, (pos.bullets || []).map(b => 
                node('listItem', {}, [paragraph(parseSmartContent(b))])
              ));
              positionEntryContent.push(bulletList);

              // 3. Return Parent Block
              return node('positionEntry', { variant: 'condensed' }, positionEntryContent);
            });

            sectionContentNodes.push(node(entryType, {}, [headerNode, ...positionNodes]));
          }
        });
      }
    }

    docContent.push(node('resumeSection', { sectionType: sectionTitle }, sectionContentNodes));
  });

  return { type: 'doc', content: docContent };
};


// --- 3. SAVER (TIPTAP -> JSON) ---
export const transformTiptapToJson = (tiptapJson) => {
    // if (!tiptapJson || !tiptapJson.content) return {};

    // const semanticJson = { 
    //     personal: {}, 
    //     sections: [] 
    // };

    // // 1. Extract Personal Info
    // const personalSection = tiptapJson.content.find(n => n.type === 'personalSection');
    // if (personalSection) {
    //     const heading = personalSection.content.find(n => n.type === 'heading');
    //     const summary = personalSection.content.find(n => n.type === 'paragraph');
    //     // Extract Name (Rich Text Array)
    //     semanticJson.personal.name = heading ? heading.content : [];
    //     // Extract Summary (Rich Text Array)
    //     semanticJson.personal.summary = summary ? summary.content : [];
        
    //     // Extract Contacts
    //     const contactRow = personalSection.content.find(n => n.type === 'contactRow');
    //     if (contactRow) {
    //         contactRow.content.forEach(c => {
    //             if (c.type === 'contactDetail') {
    //                 semanticJson.personal[c.attrs.type] = c.attrs.value;
    //             }
    //         });
    //     }
    // }

    // // 2. Extract Sections
    // const sections = tiptapJson.content.filter(n => n.type === 'resumeSection');
    // semanticJson.sections = sections.map(secNode => {
    //     const titleNode = secNode.content.find(n => n.type === 'sectionTitle');
    //     const titleContent = titleNode ? titleNode.content : [];
    //     const sectionTitleString = titleNode ? titleNode.content.map(t => t.text || '').join('') : 'Unknown';

    //     const sectionObj = {
    //         title: titleContent,
    //         entries: []
    //     };

    //     const titleLower = sectionTitleString.toLowerCase();

    //     // A. Skills
    //     if (titleLower.includes('skills')) {
    //         const skillsNode = secNode.content.find(n => n.type === 'skillsEntry');
    //         if (skillsNode) {
    //             const p = skillsNode.content.find(n => n.type === 'paragraph');
    //             sectionObj.entries = p ? p.content : [];
    //         }
    //     }

    //     // B. Loop through children for Education, Work, Research, Projects
    //     secNode.content.forEach(child => {
    //         const isWork = secNode.title.toLowerCase().includes('work');
    //         const isResearch = secNode.title.toLowerCase().includes('research');

    //         if (isWork || isResearch) {
    //           const entryType = isWork ? 'workEntry' : 'researchEntry';
    //           const positions = entry.positions || [];
    //           const institution = entry.company || entry.institution || "Institution";

    //           // --- SCENARIO 1: FLATTENED VIEW (Single Position) ---
    //           if (positions.length === 1) {
    //             const pos = positions[0];
                
    //             sectionContentNodes.push(node(entryType, {}, [
    //               // Flattened Header: Company, Title, Location, and Date all siblings
    //               node('entryTitleHeader', {}, [
    //                 node('institution', {}, parseSmartContent(institution)),
    //                 node('positionTitle', {}, parseSmartContent(pos.title)), // Independent node
    //                 node('location', {}, parseSmartContent(pos.location)),
    //                 node('date', {}, parseSmartContent(pos.dates))
    //               ]),
    //               // Bullets follow directly
    //               node('bulletList', {}, (pos.bullets || []).map(b => 
    //                 node('listItem', {}, [paragraph(parseSmartContent(b))])
    //               ))
    //             ]));
    //           }
              
    //           // --- SCENARIO 2: NESTED VIEW (Multiple Positions) ---
    //           else if (positions.length > 1) {
    //             const allLocations = positions.map(p => p.location);
    //             const isSameLoc = new Set(allLocations).size === 1;
                
    //             // Parent Header: Just Company and shared Location
    //             const headerNode = node('entryTitleHeader', {}, [
    //               node('institution', {}, parseSmartContent(companyName)),
    //               node('location', {}, parseSmartContent(isSameLoc ? allLocations[0] : ''))
    //               // Date is omitted here for Scenario 2B, or added as range for 2A
    //             ]);

    //             const positionNodes = positions.map(pos => {
    //               return node('positionEntry', {
    //                 variant: 'condensed' // Toggle based on your preference
    //               }, [
    //                 // Child has its own editable title node
    //                 node('positionTitle', {}, parseSmartContent(pos.title)),
    //                 node('bulletList', {}, (pos.bullets || []).map(b => 
    //                   node('listItem', {}, [paragraph(parseSmartContent(b))])
    //                 ))
    //               ]);
    //             });

    //             sectionContentNodes.push(node(entryType, {}, [headerNode, ...positionNodes]));
    //           }
    //         }
            
    //         // Education
    //         else if (child.type === 'educationEntry') {
    //             const header = child.content.find(n => n.type === 'entryTitleHeader');
    //             const degreeNodes = child.content.filter(n => n.type === 'degree');
                
    //             const entryObj = {
    //                 school: header?.content.find(n => n.type === 'institution')?.content || [],
    //                 location: header?.content.find(n => n.type === 'location')?.content || [],
    //                 dates: header?.content.find(n => n.type === 'date')?.content || [],
    //                 degrees: degreeNodes.map(deg => {
    //                     const degHeader = deg.content.find(n => n.type === 'degreeHeader');
    //                     const bulletList = deg.content.find(n => n.type === 'bulletList');
    //                     return {
    //                         "degreeType": degHeader?.content.find(n => n.type === 'degreeType')?.content || [],
    //                         major: degHeader?.content.find(n => n.type === 'major')?.content || [],
    //                         gpa: degHeader?.content.find(n => n.type === 'gpa')?.content || [],
    //                         bullets: bulletList ? bulletList.content.map(li => li.content[0].content) : []
    //                     };
    //                 })
    //             };
    //             sectionObj.entries.push(entryObj);
    //         }
            
    //         // Project & Leadership
    //         else if (['projectEntry', 'leadershipEntry'].includes(child.type)) {
    //             const p = child.content[0];
    //             let titleContent = [];
    //             let descriptionContent = [];
    //             let foundSeparator = false;
                
    //             if (p && p.content) {
    //                 p.content.forEach(pChild => {
    //                     if (pChild.type === 'entryTitleSimple') {
    //                         titleContent = pChild.content;
    //                     } else if (pChild.type === 'text' && pChild.text === ' - ') {
    //                         foundSeparator = true;
    //                     } else if (foundSeparator) {
    //                         descriptionContent.push(pChild);
    //                     }
    //                 });
    //             }

    //             sectionObj.entries.push({
    //                 title: titleContent,
    //                 description: descriptionContent,
    //                 skills: child.attrs.skills || []
    //             });
    //         }
    //     });

    //     return sectionObj;
    // });

    // return semanticJson;
    return null;
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