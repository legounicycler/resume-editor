import React, { useContext } from 'react'; // <--- Import useContext
import { NodeViewWrapper, NodeViewContent } from '@tiptap/react';

import { IconContext } from '../context/IconContext';

// --- STYLES CONSTANTS (Matching generateResumeHtml) ---
const BASE_FONT = 'Arial, sans-serif';
const BASE_SIZE = '10pt';
const BASE_LINE_HEIGHT = '1.0';

// Input styles to make them look like text (seamless editing)
const INVISIBLE_INPUT = {
  background: 'transparent',
  border: 'none',
  outline: 'none',
  fontFamily: 'inherit',
  fontSize: 'inherit',
  fontWeight: 'inherit',
  fontStyle: 'inherit',
  textDecoration: 'inherit',
  color: 'inherit',
  padding: 0,
  margin: 0,
  width: 'auto',
  minWidth: '50px' // readable minimum
};

// Structural Visualization Styles (The "Bubbles")
const VISUAL_WRAPPER = {
  position: 'relative',
  transition: 'all 0.2s ease',
  borderRadius: '4px',
};

// We inject a style tag for hover effects since inline styles can't do pseudo-classes easily
const HOVER_STYLES = `
  .resume-node-view:hover {
    outline: 2px dashed #94a3b8; /* Visible on hover */
    background-color: rgba(241, 245, 249, 0.3);
  }
  .resume-node-view:hover::before {
    content: attr(data-label);
    position: absolute;
    top: -10px;
    right: 0;
    background: #94a3b8;
    color: white;
    font-size: 9px;
    padding: 2px 6px;
    border-radius: 4px;
    text-transform: uppercase;
    pointer-events: none;
    font-family: sans-serif;
    z-index: 10;
  }
  /* Fix for Tiptap paragraphs inside NodeViews adding extra margin */
  .resume-node-content p {
    margin: 0 !important;
    line-height: ${BASE_LINE_HEIGHT};
  }
  .resume-node-content ul {
    margin: 0 !important;
    padding-left: 1.5rem !important;
  }
  .resume-node-content li {
    margin: 0 !important;
    line-height: ${BASE_LINE_HEIGHT};
  }
`;


// --- 1. Personal Section (Top Header) ---
export const PersonalSectionView = ({ node, updateAttributes }) => {
  return (
    <NodeViewWrapper
      className="resume-node-view"
      data-label="PERSONAL INFO"
      style={{ ...VISUAL_WRAPPER, textAlign: 'center', marginBottom: '8px' }}
    >
      <NodeViewContent className="resume-node-content" />
    </NodeViewWrapper>
  )
}

// --- 1.1 Contact Detail View ---
export const ContactDetailView = ({ node }) => {
  const icons = useContext(IconContext); // Use Context instead of props
  
  const { type, value } = node.attrs;

  // 1. ICON RENDERING LOGIC
  const IconComponent = () => {
    // This will now automatically re-render when 'icons' updates in App.jsx!
    const base64Src = icons && icons[type];
    
    if (!base64Src) {
        return <span style={{ width: '12px', height: '12px', display: 'inline-block', background: "black"}}></span>; 
    }
    
    return (
      <img 
        src={base64Src} 
        alt={type} 
        className="myicon"
        style={{ verticalAlign: 'middle' }}
      />
    );
  };

  const isLink = ['linkedin', 'website', 'email'].includes(type);
  let link = value;
  if (type === 'email') {
    link = `mailto:${value}`;
  }


  return (
    <NodeViewWrapper 
      data-label={`CONTACT: ${type}`}
      style={{ 
        display: 'inline-block', // Keep inline-block or switch to a flex/grid approach
        flexGrow: 1, // Let it grow to take up space (if parent is flex)
        textAlign: 'center', // Center the content within its space
        minWidth: '20%', // Force minimum width, especially important for centering the content
        margin: '0', // Remove margin from the sides, let parent container handle spacing
        padding: '0 5px', // Add slight padding for visual separation
        fontFamily: BASE_FONT, 
        fontSize: '9pt', 
        lineHeight: BASE_LINE_HEIGHT,
      }}
    >
      <IconComponent />
      <span style={{ whiteSpace: 'pre' }}> </span>
      {isLink ? (
        <a href={link} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'underline', color: 'inherit' }}>
          {value}
        </a>
      ) : (
        <span>{value}</span>
      )}
    </NodeViewWrapper>
  );
};

// --- 2. Generic Section Container ---
export const SectionView = ({ node, updateAttributes }) => {
  const isListSection = ['projects', 'leadership'].includes(node.attrs.sectionType.toLowerCase());

  return (
    <NodeViewWrapper 
      className="resume-node-view" 
      data-label={`${node.attrs.sectionType} SECTION`}
      style={{ ...VISUAL_WRAPPER, margin: '10px 0' }}
    >
      <style>{HOVER_STYLES}</style>
      
      {/* NEW: Render the Section Header using the attribute data.
        This ensures it's rendered ONCE and styled correctly across the full width.
      */}
      <div style={{ 
        borderBottom: '1px solid black', 
        marginBottom: '4px', 
        marginTop: '12pt',
        textAlign: 'center' 
      }}>
        <input
          value={node.attrs.sectionType}
          onChange={e => updateAttributes({ sectionType: e.target.value })}
          style={{
            ...INVISIBLE_INPUT,
            fontWeight: 'bold',
            fontSize: '10pt',
            textAlign: 'center',
            width: '100%',
            textTransform: 'capitalize' 
          }}
        />
      </div>

      {/* Content Container - This now renders only the entries (workEntry, educationEntry, etc.) */}
      <div style={{ 
        fontFamily: BASE_FONT, 
        fontSize: BASE_SIZE, 
        lineHeight: BASE_LINE_HEIGHT 
      }}>
        <NodeViewContent 
          className="resume-node-content" 
          style={isListSection ? { paddingLeft: '1.5rem', listStyleType: 'disc' } : {}} 
        />
      </div>
    </NodeViewWrapper>
  );
};

// --- 3a. Education Entry ---
export const EducationEntryView = ({ node, updateAttributes }) => {
  return (
    <NodeViewWrapper 
      className="resume-node-view" 
      data-label="EDUCATION ENTRY"
      style={{ ...VISUAL_WRAPPER, marginBottom: '4px' }}
    >
      {/* Header Row (Same as Work) */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        fontFamily: BASE_FONT, 
        fontSize: BASE_SIZE,
        lineHeight: '1.15',
        marginBottom: '0px'
      }}>
        <div style={{ flex: '1' }}>
           <u style={{ display: 'flex', width: '100%' }}>
            <span style={{ fontWeight: 'bold' }}>
              <input 
                value={node.attrs.school}
                onChange={e => updateAttributes({ school: e.target.value })}
                placeholder="School"
                style={{ ...INVISIBLE_INPUT, fontWeight: 'bold' }}
              />
            </span>
            <span style={{ fontStyle: 'italic', display: 'flex' }}>
              <span style={{ whiteSpace: 'pre' }}> - </span>
              <input 
                value={node.attrs.location}
                onChange={e => updateAttributes({ location: e.target.value })}
                placeholder="Location"
                style={{ ...INVISIBLE_INPUT, fontStyle: 'italic' }}
              />
            </span>
          </u>
        </div>
        <div style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
          <span style={{ fontWeight: 'bold' }}>
             <input 
              value={node.attrs.dates}
              onChange={e => updateAttributes({ dates: e.target.value })}
              placeholder="Dates"
              style={{ ...INVISIBLE_INPUT, fontWeight: 'bold', textAlign: 'right' }}
            />
          </span>
        </div>
      </div>

      {/* Content (This will now render the EducationDegree children, which include their own attributes and bullet lists) */}
      <NodeViewContent className="resume-node-content" />
    </NodeViewWrapper>
  );
};

// --- 3b. Education Degree View ---
export const EducationDegreeView = ({ node, updateAttributes }) => {
  return (
    <NodeViewWrapper 
      className="resume-node-view" 
      data-label="EDUCATION DEGREE"
      style={{ 
        ...VISUAL_WRAPPER, 
        fontFamily: BASE_FONT, 
        fontSize: BASE_SIZE, 
        lineHeight: '1.15',
        marginBottom: '2px' // Small margin for visual separation if multiple degrees
      }}
    >
      {/* Sub-Header: Degree, Major, GPA */}
      <div style={{ 
        marginBottom: '2px'
      }}>
        <span style={{ fontWeight: 'bold' }}>
           <input 
             value={node.attrs.degree}
             onChange={e => updateAttributes({ degree: e.target.value })}
             placeholder="Degree"
             style={{ ...INVISIBLE_INPUT, fontWeight: 'bold', display: 'inline', width: 'auto' }}
           />:
        </span>
        <span> </span>
        <input 
           value={node.attrs.major}
           onChange={e => updateAttributes({ major: e.target.value })}
           placeholder="Major"
           style={{ ...INVISIBLE_INPUT, display: 'inline', width: 'auto' }}
        />
        {node.attrs.gpa && (
          <>
            <span style={{ whiteSpace: 'pre' }}>      </span>{/* Gap */}
            <span style={{ fontWeight: 'bold' }}>GPA: </span>
            <input 
               value={node.attrs.gpa}
               onChange={e => updateAttributes({ gpa: e.target.value })}
               placeholder="GPA"
               style={{ ...INVISIBLE_INPUT, display: 'inline', width: 'auto' }}
            />
          </>
        )}
      </div>

      {/* Content (Bullets for this degree) */}
      <NodeViewContent className="resume-node-content" />
    </NodeViewWrapper>
  );
};

// --- 4. Work Entry ---
export const WorkEntryView = ({ node, updateAttributes }) => {
  return (
    <NodeViewWrapper 
      className="resume-node-view" 
      data-label="WORK ENTRY"
      style={{ ...VISUAL_WRAPPER, marginBottom: '0px' }}
    >
      {/* Header Row: Title/Location (Left) vs Dates (Right) */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        fontFamily: BASE_FONT, 
        fontSize: BASE_SIZE,
        lineHeight: '1.15', // Slightly looser for header
        marginBottom: '2px'
      }}>
        {/* Left Column (80%) */}
        <div style={{ flex: '1', display: 'flex', alignItems: 'center' }}>
          <u style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
            {/* Company (Bold) */}
            <span style={{ fontWeight: 'bold' }}>
              <input 
                value={node.attrs.company}
                onChange={e => updateAttributes({ company: e.target.value })}
                placeholder="Company Name"
                style={{ ...INVISIBLE_INPUT, fontWeight: 'bold' }}
              />
            </span>
            
            {/* Location (Italic) */}
            <span style={{ fontStyle: 'italic', display: 'flex' }}>
              <span style={{ whiteSpace: 'pre' }}> - </span>
              <input 
                value={node.attrs.location}
                onChange={e => updateAttributes({ location: e.target.value })}
                placeholder="Location"
                style={{ ...INVISIBLE_INPUT, fontStyle: 'italic' }}
              />
            </span>
          </u>
        </div>

        {/* Right Column (Dates) */}
        <div style={{ textAlign: 'right', whiteSpace: 'nowrap', marginLeft: '10px' }}>
          <span style={{ fontWeight: 'bold' }}>
            <input 
              value={node.attrs.dates}
              onChange={e => updateAttributes({ dates: e.target.value })}
              placeholder="Dates"
              style={{ ...INVISIBLE_INPUT, fontWeight: 'bold', textAlign: 'right' }}
            />
          </span>
        </div>
      </div>

      {/* Content (Bullets) */}
      <NodeViewContent className="resume-node-content" />
    </NodeViewWrapper>
  );
};

// --- 5. Research Entry ---
export const ResearchEntryView = ({ node, updateAttributes }) => {
  return (
    <NodeViewWrapper 
      className="resume-node-view" 
      data-label="RESEARCH ENTRY" // Corrected label
      style={{ ...VISUAL_WRAPPER, marginBottom: '0px' }}
    >
      {/* Header Row: Title/Location (Left) vs Dates (Right) */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        fontFamily: BASE_FONT, 
        fontSize: BASE_SIZE,
        lineHeight: '1.15', // Slightly looser for header
        marginBottom: '2px'
      }}>
        {/* Left Column (80%) */}
        <div style={{ flex: '1', display: 'flex', alignItems: 'center' }}>
          <u style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
            {/* Institution (Bold) */}
            <span style={{ fontWeight: 'bold' }}>
              <input 
                value={node.attrs.institution}
                onChange={e => updateAttributes({ institution: e.target.value })}
                placeholder="Institution Name"
                style={{ ...INVISIBLE_INPUT, fontWeight: 'bold' }}
              />
            </span>
            
            {/* Location (Italic) */}
            <span style={{ fontStyle: 'italic', display: 'flex' }}>
              <span style={{ whiteSpace: 'pre' }}> - </span>
              <input 
                value={node.attrs.location}
                onChange={e => updateAttributes({ location: e.target.value })}
                placeholder="Location"
                style={{ ...INVISIBLE_INPUT, fontStyle: 'italic' }}
              />
            </span>
          </u>
        </div>

        {/* Right Column (Dates) */}
        <div style={{ textAlign: 'right', whiteSpace: 'nowrap', marginLeft: '10px' }}>
          <span style={{ fontWeight: 'bold' }}>
            <input 
              value={node.attrs.dates}
              onChange={e => updateAttributes({ dates: e.target.value })}
              placeholder="Dates"
              style={{ ...INVISIBLE_INPUT, fontWeight: 'bold', textAlign: 'right' }}
            />
          </span>
        </div>
      </div>

      {/* Content (Bullets) */}
      <NodeViewContent className="resume-node-content" />
    </NodeViewWrapper>
  );
}

// --- 6. Project Entry (List Item Style) ---
export const ProjectEntryView = ({ node, updateAttributes }) => {
  const skillsString = node.attrs.skills ? node.attrs.skills.join(', ') : '';

  const handleSkillsChange = (e) => {
    // Split by comma, trim whitespace, filter out empty strings
    const newSkills = e.target.value.split(',').map(s => s.trim()).filter(s => s.length > 0);
    updateAttributes({ skills: newSkills });
  };

  return (
    <NodeViewWrapper 
      className="resume-node-view" 
      data-label="PROJECT"
      style={{ 
        ...VISUAL_WRAPPER, 
        display: 'list-item', // Makes the whole wrapper behave like an <li>
        fontFamily: BASE_FONT,
        fontSize: BASE_SIZE,
        lineHeight: BASE_LINE_HEIGHT,
        marginBottom: '2px'
      }}
    >
      {/* Title and Description */}
      <div>
        <u>
          <strong>
            <input 
              value={node.attrs.title}
              onChange={e => updateAttributes({ title: e.target.value })}
              placeholder="Project Title"
              style={{ ...INVISIBLE_INPUT, fontWeight: 'bold', textDecoration: 'underline' }}
            />
          </strong>
        </u>
        <span> - </span>
        {/* Description Content (Inline Paragraph) */}
        <NodeViewContent 
          className="resume-node-content" 
          style={{ display: 'inline' }} 
        />
      </div>

      {/* Skills input */}
      <div style={{ 
        marginLeft: '1rem', // Indent slightly
        fontStyle: 'italic', 
        fontSize: '9pt', // Smaller font for skills
        marginTop: '2px' 
      }}>
        <span style={{ fontWeight: 'bold' }}>Skills: </span>
        <input
          value={skillsString}
          onChange={handleSkillsChange}
          placeholder="e.g., Python, C++, React (comma-separated)"
          style={{ 
            ...INVISIBLE_INPUT, 
            width: '100%', 
            maxWidth: 'calc(100% - 60px)', // Adjust width to fit beside "Skills:" label
            fontSize: 'inherit',
            fontStyle: 'inherit'
          }}
        />
      </div>
    </NodeViewWrapper>
  );
};

// --- 7. Leadership Entry (List Item Style) ---
export const LeadershipEntryView = ({ node, updateAttributes }) => {
  return (
    <NodeViewWrapper 
      className="resume-node-view" 
      data-label="LEADERSHIP ENTRY" // Corrected label
      style={{ 
        ...VISUAL_WRAPPER, 
        display: 'list-item', // Makes the whole wrapper behave like an <li>
        fontFamily: BASE_FONT,
        fontSize: BASE_SIZE,
        lineHeight: BASE_LINE_HEIGHT,
        marginBottom: '2px'
      }}
    >
      {/* Title - Description Line */}
      <div style={{ display: 'inline' }}>
        <u>
          <strong>
            <input 
              value={node.attrs.title}
              onChange={e => updateAttributes({ title: e.target.value })}
              placeholder="Leadership Title"
              style={{ ...INVISIBLE_INPUT, fontWeight: 'bold', textDecoration: 'underline' }}
            />
          </strong>
        </u>
        <span> - </span>
      </div>
      
      {/* Description Content (Inline Paragraph) */}
      <NodeViewContent 
        className="resume-node-content" 
        style={{ display: 'inline' }} 
      />
    </NodeViewWrapper>
  );
};

// --- 8. Skills Entry (Comma separated paragaph of skill entries) ---
export const SkillsEntryView = ({ node, updateAttributes }) => {
  return (
    <NodeViewWrapper 
      className="resume-node-view" 
      data-label="SKILLS ENTRY"
      style={{ 
        ...VISUAL_WRAPPER, 
        fontFamily: BASE_FONT,
        fontSize: BASE_SIZE,
        lineHeight: BASE_LINE_HEIGHT,
        marginBottom: '4px' 
      }}
    >
      {/* The content of SkillsEntry is a single paragraph of text */}
      <NodeViewContent className="resume-node-content" />
    </NodeViewWrapper>
  );
}