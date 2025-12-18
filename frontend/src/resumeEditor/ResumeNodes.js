import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { 
  SectionView, 
  StandardEntryView,
  PositionEntryView,
  SkillsEntryView,
  ContactDetailView,
  PersonalSectionView,
  InlineNodeView
} from './ResumeNodeViews';

// ----- ROOT NODE (Level 1)-----

// ResumeDocument (The main node containing all other nodes)
export const ResumeDocumentNode = Node.create({
  name: 'doc',
  topNode: true,
  content: 'personalSection resumeSection+', // Root must have Personal info, then 1+ Sections
});

// ----- SECTION NODES (Level 2) -----

// Personal Section Node
export const PersonalSectionNode = Node.create({
  name: 'personalSection',
  group: 'block',
  content: 'heading paragraph+ separatorLine contactRow', // Name, Summary, Divider, Contact Info
  parseHTML() { return [{ tag: 'div[data-type="personal-section"]' }] },
  renderHTML({ HTMLAttributes }) {
    return ['div', { 'data-type': 'personal-section', ...HTMLAttributes }, 0];
  },
  addNodeView() { return ReactNodeViewRenderer(PersonalSectionView);}
});

// ResumeSection Node (Generic section container with SectionTitle node and Entry Nodes)
export const ResumeSectionNode = Node.create({
  name: 'resumeSection',
  group: 'block',
  content: 'sectionTitle (educationEntry|workEntry|researchEntry|projectEntry|leadershipEntry|skillsEntry)+',
  addAttributes() { return { sectionType: { default: 'generic' } }; }, // Keep attribute for logic, but display comes from node
  renderHTML({ HTMLAttributes }) {
    return ['section', mergeAttributes(HTMLAttributes), 0];
  },
  addNodeView() { return ReactNodeViewRenderer(SectionView); }
});

// Section Title Node (First node in ResumeSection, holds the section title)
export const SectionTitleNode = Node.create({
  name: 'sectionTitle',
  group: 'block',
  content: 'text*', // It holds text
  parseHTML() { return [{ tag: 'h2[data-type="section-title"]' }]; },
  renderHTML({ HTMLAttributes }) {
    return ['h2', mergeAttributes(HTMLAttributes, { 'data-type': 'section-title', class: 'resume-section-title' }), 0];
  }
});

// ----- ENTRY NODES (Level 3) -----

// Education Entry Node (Represents all degrees earned at a single school)
export const EducationEntryNode = Node.create({
  name: 'educationEntry',
  group: 'block',
  content: 'entryTitleHeader degree+', // Education entry now contains one or more specific degrees
  addAttributes() {
    return {
      school: { default: 'School...' },
      location: { default: 'Location...' },
      dates: { default: 'Dates...' },
    };
  },
  parseHTML() { return [{ tag: 'div[data-type="education-entry"]' }] },
  renderHTML({ HTMLAttributes }) {
    return ['div', { 'data-type': 'education-entry', ...HTMLAttributes }, 0];
  }
});

// Work Entry Node (Represents all work experiences at a single company)
export const WorkEntryNode = Node.create({
  name: 'workEntry',
  group: 'block',
  content: 'entryTitleHeader (bulletList | positionEntry+)', // The user edits the bullets. The Header is handled by attributes.
  // addAttributes() {
  //   return {
  //     company: { default: 'Company Name' },
  //   };
  // },
  parseHTML() { return [{ tag: 'div[data-type="work-entry"]' }] },
  renderHTML({ HTMLAttributes }) {
    return ['div', { 'data-type': 'work-entry', ...HTMLAttributes }, 0];
  },
  addNodeView() {
    return ReactNodeViewRenderer(StandardEntryView);
  },
});

// Research Entry Node (Represents all research experiences at a single institution)
export const ResearchEntryNode = Node.create({
  name: 'researchEntry',
  group: 'block',
  content: 'entryTitleHeader (bulletList | positionEntry+)', // The user edits the bullets. The Header is handled by attributes.
  // addAttributes() {
  //   return {
  //     institution: { default: 'Institution Name' },
  //   };
  // },
  parseHTML() { return [{ tag: 'div[data-type="research-entry"]' }] },
  renderHTML({ HTMLAttributes }) {
    return ['div', { 'data-type': 'research-entry', ...HTMLAttributes }, 0];
  },
  addNodeView() {
    return ReactNodeViewRenderer(StandardEntryView);
  },
});

// Project Entry Node (Represents a single project with title and description)
export const ProjectEntryNode = Node.create({
  name: 'projectEntry',
  group: 'block',
  // Content: A paragraph that contains the title node AND the text description
  // This is the best way to ensure they stay on one line
  content: 'paragraph', 
  renderHTML({ HTMLAttributes }) {
    return ['div', { 'data-type': 'project-entry', ...HTMLAttributes }, 0];
  },
  addNodeView() { return ReactNodeViewRenderer(StandardEntryView); },
  // NEW: Add keyboard shortcuts for splitting
  addKeyboardShortcuts() {
    return {
      // Execute the "split list item" command on the custom node type
      'Enter': ({ editor }) => {
        // Find the ProjectEntry node around the selection
        const { $from } = editor.state.selection;
        const parent = $from.node($from.depth - 1); // Get the node containing the paragraph
        
        // Ensure we are inside this node and try to split it
        if (parent.type.name === this.name) {
          // splitListItem works well here to split the parent node (projectEntry)
          return editor.chain().focus().splitListItem(this.type).run();
        }
        return false;
      },
      'Tab': () => {
         return true; // Return true to say "we handled this", effectively doing nothing but keeping focus.
      }
    };
  }
});

// Leadership Entry Node (Represents a single leadership role with title and description)
export const LeadershipEntryNode = Node.create({
  name: 'leadershipEntry',
  group: 'block',
  content: 'paragraph',
  renderHTML({ HTMLAttributes }) {
    return ['div', { 'data-type': 'leadership-entry', ...HTMLAttributes }, 0];
  },
  addNodeView() { return ReactNodeViewRenderer(StandardEntryView); },
  // NEW: Add keyboard shortcuts for splitting
  addKeyboardShortcuts() {
    return {
      'Enter': ({ editor }) => {
        const { $from } = editor.state.selection;
        const parent = $from.node($from.depth - 1);
        
        if (parent.type.name === this.name) {
          return editor.chain().focus().splitListItem(this.type).run();
        }
        return false;
      },
      'Tab': () => {
         return true; // Return true to say "we handled this", effectively doing nothing but keeping focus.
      }
    };
  },
});

// Skills Entry Node (Represents all skills as a comma separated list in paragraph form)
export const SkillsEntryNode = Node.create({
  name: 'skillsEntry',
  group: 'block',
  content: 'paragraph', // Skills are displayed as a single paragraph of text
  addAttributes() {
    // title attribute removed as the skill itself is the paragraph content
    return {}; 
  },
  renderHTML({ HTMLAttributes }) {
    return ['div', { 'data-type': 'skills-entry', ...HTMLAttributes }, 0];
  },
  addNodeView() {
    return ReactNodeViewRenderer(SkillsEntryView);
  },
});

// ----- POSITION NODE ----

// Position Entry Node (Lives within Work Entry or Research Entry)
export const PositionEntryNode = Node.create({
  name: 'positionEntry',
  group: 'block',
  // FIX: Content is now strictly Block + Block
  content: 'positionEntryHeader bulletList', 
  addAttributes() {
    return {
      title: { default: '' },
      location: { default: '' },
      date: { default: '' },
      description: { default: '' },
      variant: { default: 'condensed' } 
    };
  },
  parseHTML() { return [{ tag: 'div[class="position-entry"]' }]; },
  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { class: 'position-entry' }), 0];
  },
  addNodeView() {
    return ReactNodeViewRenderer(PositionEntryView);
  }
});

// Position Entry Header (lives within PositionEntry)
export const PositionEntryHeaderNode = Node.create({
  name: 'positionEntryHeader',
  group: 'block',
  content: 'positionTitle positionDescription? location? date?', // All inline children
  parseHTML() { return [{ tag: 'div[class="position-entry-header"]' }]; },
  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { class: 'position-entry-header' }), 0];
  }
});

// Institution Node (Second node within EntryHeader)
export const PositionTitleNode = Node.create({
  name: 'positionTitle',
  group: 'inline',   // Behaves like a <span>
  inline: true,
  content: 'text*',  // Contains editable text
  parseHTML() { return [{ tag: 'span[data-type="position-title"]' }]; },
  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(HTMLAttributes, { 'data-type': 'position-title', class: 'resume-position-title' }), 0];
  },
  addNodeView() {
    return ReactNodeViewRenderer(InlineNodeView);
  }
});

export const PositionDescriptionNode = Node.create({
  name: 'positionDescription',
  group: 'inline',
  inline: true,
  content: 'text*',
  parseHTML() { return [{ tag: 'span[data-type="position-description"]' }]; },
  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(HTMLAttributes, { 'data-type': 'position-description', class: 'resume-position-description' }), 0];
  },
  addNodeView() {
    return ReactNodeViewRenderer(InlineNodeView);
  }
});

// ----- ENTRY NODE TITLES -----

// Entry Title Node (First node within ProjectEntry, LeadershipEntry)
//   - Contains the title to be displayed inline with the description
export const EntryTitleSimpleNode = Node.create({
  name: 'entryTitleSimple',
  group: 'inline',
  inline: true,
  content: 'text*',
  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(HTMLAttributes, { 'data-type': 'entry-title-simple', class: 'entry-title-simple' }), 0];
  },
  addNodeView() {
    return ReactNodeViewRenderer(InlineNodeView);
  }
});

// Entry Header Node (First node within in WorkEntry, EducationEntry, ResearchEntry)
//   - Displays institution, location, and dates in a single line
export const EntryTitleHeaderNode = Node.create({
  name: 'entryTitleHeader',
  group: 'block',
  content: 'institution positionTitle? location? date', // Optional positionTitle
  parseHTML() { return [{ tag: 'div[class="entry-title-header"]' }]; },
  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { class: 'entry-title-header' }), 0];
  }
});

// ----- ENTRY HEADER SUB-NODES (Level 5) -----

// Institution Node (First node within EntryTitleHeader)
export const InstitutionNode = Node.create({
  name: 'institution',
  group: 'inline',   // Behaves like a <span>
  inline: true,
  content: 'text*',  // Contains editable text
  parseHTML() { return [{ tag: 'span[data-type="institution"]' }]; },
  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(HTMLAttributes, { 'data-type': 'institution', class: 'resume-institution' }), 0];
  },
  addNodeView() {
    return ReactNodeViewRenderer(InlineNodeView);
  }
});

// Location Node (Second node within EntryTitleHeader)
export const LocationNode = Node.create({
  name: 'location',
  group: 'inline',
  inline: true,
  content: 'text*',
  parseHTML() { return [{ tag: 'span[data-type="location"]' }]; },
  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(HTMLAttributes, { 'data-type': 'location', class: 'resume-location' }), 0];
  },
  addNodeView() {
    return ReactNodeViewRenderer(InlineNodeView);
  }
});

// Date Node (Third node within EntryTitleHeader)
export const DateNode = Node.create({
  name: 'date',
  group: 'inline',
  inline: true,
  content: 'text*',
  parseHTML() { return [{ tag: 'span[data-type="date"]' }]; },
  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(HTMLAttributes, { 'data-type': 'date', class: 'resume-date' }), 0];
  },
  addNodeView() {
    return ReactNodeViewRenderer(InlineNodeView);
  }
});

// ----- EDUCATION ENTRY SUB-NODES (Level 4 and down) -----

// Degree Node (Primary node within EducationEntry)
//   - Represents a single degree earned at a school with a header and optional bullet points
export const DegreeNode = Node.create({
  name: 'degree',
  group: 'block',
  content: 'degreeHeader bulletList?', // Header + optional bullets
  renderHTML({ HTMLAttributes }) {
    return ['div', { 'data-type': 'degree', ...HTMLAttributes }, 0];
  },
  addNodeView() { return ReactNodeViewRenderer(StandardEntryView); }
});

// Degree Header (First node in Degree. Holds degreeType, major, and GPA)
export const DegreeHeaderNode = Node.create({
  name: 'degreeHeader',
  group: 'block',
  content: 'degreeType major gpa', // Strict order
  renderHTML({ HTMLAttributes }) {
    return ['div', { class: 'degree-header' }, 0];
  }
});

// Degree Type Node (Found within DegreeHeader)
export const DegreeTypeNode = Node.create({
  name: 'degreeType',
  group: 'inline',
  inline: true,
  content: 'text*',
  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(HTMLAttributes, { 'data-type': 'degree-type', class: 'resume-degree-type' }), 0];
  },
  addNodeView() {
    return ReactNodeViewRenderer(InlineNodeView);
  }
});

// Major Node (Found within DegreeHeader)
export const MajorNode = Node.create({
  name: 'major',
  group: 'inline',
  inline: true,
  content: 'text*',
  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(HTMLAttributes, { 'data-type': 'major', class: 'resume-major' }), 0];
  },
  addNodeView() {
    return ReactNodeViewRenderer(InlineNodeView);
  }
});

// GPA Node (Found within DegreeHeader)
export const GpaNode = Node.create({
  name: 'gpa',
  group: 'inline',
  inline: true,
  content: 'text*',
  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(HTMLAttributes, { 'data-type': 'gpa', class: 'resume-gpa' }), 0];
  },
  addNodeView() {
    return ReactNodeViewRenderer(InlineNodeView);
  }
});

// ----- PERSONAL SECTION SUB-NODES (Level 3 and down) -----

// Contact Row Node (Used in PersonalSection)
export const ContactRowNode = Node.create({
  name: 'contactRow',
  group: 'block',
  content: 'contactDetail+', // Must contain one or more contactDetail nodes
  inline: false,
  parseHTML() { 
    return [{ tag: 'div[data-type="contact-row"]' }] 
  },
  renderHTML({ HTMLAttributes }) {
    // Render as a div with styling hooks. The actual flex styling will be in App.css.
    return ['div', { 'data-type': 'contact-row', ...HTMLAttributes }, 0];
  },
  // We don't need a NodeView here, as we only need to render the container div.
});

// Contact Detail Node (Used in ContactRow)
export const ContactDetailNode = Node.create({
  name: 'contactDetail',
  group: 'block',
  content: '', // No content, value is stored in attributes
  inline: false, // Renders on its own line
  addAttributes() {
    return {
      type: { default: null }, // 'email', 'phone', 'linkedin', 'website'
      value: { default: null }, // the actual data
    };
  },
  renderHTML({ HTMLAttributes }) {
    // Basic fallback render
    return ['div', { 'data-type': 'contact-detail', ...HTMLAttributes }, 0];
  },
  addNodeView() {
    return ReactNodeViewRenderer(ContactDetailView);
  }
});

// ----- GENERIC NODES -----

// Separator Line Node (Displays a horizontal divider line across the whole page)
export const SeparatorLineNode = Node.create({
  name: 'separatorLine',
  group: 'block',
  content: '', // No content
  inline: false,
  // Renders the HR element directly
  renderHTML() {
    return ['hr', { 'data-type': 'separator-line' }]; 
  },
  // We don't need a React NodeView, the simple renderHTML is enough.
});