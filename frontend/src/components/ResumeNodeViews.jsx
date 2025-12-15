import React, { useContext, useEffect, useRef } from 'react';
import { NodeViewWrapper, NodeViewContent } from '@tiptap/react';
import { IconContext } from '../context/IconContext';

// --- STYLES CONSTANTS ---
const BASE_FONT = 'Arial, sans-serif';
const BASE_SIZE = '10pt';
const BASE_LINE_HEIGHT = '1.0';

const VISUAL_WRAPPER = {
  position: 'relative',
  transition: 'all 0.2s ease',
  borderRadius: '4px',
};

const HOVER_STYLES = `
  .resume-node-view:hover {
    outline: 2px dashed #94a3b8; 
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
  .resume-node-content p, .resume-node-content ul, .resume-node-content li {
    margin: 0 !important;
    line-height: ${BASE_LINE_HEIGHT};
  }
  .resume-node-content ul {
    padding-left: 1.5rem !important;
  }
`;

// --- HELPER: Inline Input for remaining legacy views (Projects/Degrees) ---
const InlineInput = ({ value, updateValue, placeholder, className, style, bold, italic }) => {
  const spanRef = useRef(null);
  useEffect(() => {
    if (spanRef.current && spanRef.current.innerText !== value) {
      spanRef.current.innerText = value;
    }
  }, [value]);

  return (
    <span
      ref={spanRef}
      className={`inline-input ${className || ''}`}
      contentEditable
      suppressContentEditableWarning
      data-placeholder={placeholder}
      onInput={(e) => updateValue(e.currentTarget.innerText)}
      onMouseDown={(e) => e.stopPropagation()} 
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          e.currentTarget.blur();
        }
      }}
      style={{
        display: 'inline-block',
        minWidth: '10px', 
        outline: 'none',
        whiteSpace: 'pre-wrap', 
        fontWeight: bold ? 'bold' : 'inherit',
        fontStyle: italic ? 'italic' : 'inherit',
        cursor: 'text',
        ...style
      }}
    />
  );
};

// THE UNIVERSAL VIEW
// Use this for: EducationEntry, WorkEntry, ResearchEntry, ProjectEntry, LeadershipEntry, EducationDegree
export const StandardEntryView = ({ node }) => {
  return (
    <NodeViewWrapper className="resume-node-view" data-label={node.type.name} style={{ ...VISUAL_WRAPPER, marginBottom: '4px' }}>
      <NodeViewContent className="resume-node-content" />
    </NodeViewWrapper>
  );
};

// SECTION VIEW (Simplified)
export const SectionView = ({ node }) => {
  return (
    <NodeViewWrapper className="resume-node-view" data-label="SECTION" style={{ ...VISUAL_WRAPPER, margin: '15px 0 5px 0' }}>
       {/* Tiptap renders the 'sectionTitle' node first, then the entries. No manual Input needed. */}
      <NodeViewContent className="resume-node-content" />
    </NodeViewWrapper>
  );
};

// --- 1. Personal Section ---
export const PersonalSectionView = ({ node }) => {
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

// --- 1.1 Contact Detail ---
export const ContactDetailView = ({ node }) => {
  const icons = useContext(IconContext); 
  const { type, value } = node.attrs;

  const IconComponent = () => {
    const base64Src = icons && icons[type];
    if (!base64Src) return <span style={{ width: '12px', height: '12px', display: 'inline-block', background: "black"}}></span>; 
    return <img src={base64Src} alt={type} className="myicon" style={{ verticalAlign: 'middle' }} />;
  };

  const isLink = ['linkedin', 'website', 'email'].includes(type);
  const link = type === 'email' ? `mailto:${value}` : value;

  return (
    <NodeViewWrapper 
      data-label={`CONTACT: ${type}`}
      style={{ 
        display: 'inline-block', 
        textAlign: 'center', 
        minWidth: '20%', 
        padding: '0 5px', 
        fontFamily: BASE_FONT, 
        fontSize: '9pt', 
        lineHeight: BASE_LINE_HEIGHT,
      }}
    >
      <IconComponent />
      <span style={{ whiteSpace: 'pre' }}> </span>
      {isLink ? (
        <a href={link} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'underline', color: 'inherit' }}>{value}</a>
      ) : (
        <span>{value}</span>
      )}
    </NodeViewWrapper>
  );
};

// // --- 3b. Education Degree ---
// export const EducationDegreeView = ({ node, updateAttributes }) => {
//   return (
//     <NodeViewWrapper className="resume-node-view" data-label="EDUCATION DEGREE" style={{ ...VISUAL_WRAPPER, fontFamily: BASE_FONT, fontSize: BASE_SIZE, lineHeight: '1.15', marginBottom: '2px' }}>
//       <div style={{ marginBottom: '2px' }}>
//         <span style={{ fontWeight: 'bold' }}>
//            <InlineInput value={node.attrs.degree} updateValue={val => updateAttributes({ degree: val })} placeholder="Degree" />:
//         </span>
//         <span> </span>
//         <InlineInput value={node.attrs.major} updateValue={val => updateAttributes({ major: val })} placeholder="Major" />
//         {node.attrs.gpa && (
//           <>
//             <span style={{ whiteSpace: 'pre' }}>      </span>
//             <span style={{ fontWeight: 'bold' }}>GPA: </span>
//             <InlineInput value={node.attrs.gpa} updateValue={val => updateAttributes({ gpa: val })} placeholder="GPA" />
//           </>
//         )}
//       </div>
//       <NodeViewContent className="resume-node-content" />
//     </NodeViewWrapper>
//   );
// };

// // --- 6. Project Entry ---
// export const ProjectEntryView = ({ node, updateAttributes }) => {
//   const skillsString = node.attrs.skills ? node.attrs.skills.join(', ') : '';
//   const handleSkillsChange = (val) => {
//     const newSkills = val.split(',').map(s => s.trim()).filter(s => s.length > 0);
//     updateAttributes({ skills: newSkills });
//   };
//   return (
//     <NodeViewWrapper className="resume-node-view" data-label="PROJECT" style={{ ...VISUAL_WRAPPER, display: 'list-item', fontFamily: BASE_FONT, fontSize: BASE_SIZE, lineHeight: BASE_LINE_HEIGHT, marginBottom: '2px' }}>
//       <div>
//         <u><strong><InlineInput value={node.attrs.title} updateValue={val => updateAttributes({ title: val })} placeholder="Project Title" /></strong></u>
//         <span> - </span>
//         <NodeViewContent className="resume-node-content" style={{ display: 'inline' }} />
//       </div>
//       <div style={{ marginLeft: '1rem', fontStyle: 'italic', fontSize: '9pt', marginTop: '2px' }}>
//         <span style={{ fontWeight: 'bold' }}>Skills: </span>
//         <InlineInput value={skillsString} updateValue={handleSkillsChange} placeholder="e.g., Python" style={{ minWidth: '100px' }} />
//       </div>
//     </NodeViewWrapper>
//   );
// };

// // --- 7. Leadership Entry ---
// export const LeadershipEntryView = ({ node, updateAttributes }) => {
//   return (
//     <NodeViewWrapper className="resume-node-view" data-label="LEADERSHIP ENTRY" style={{ ...VISUAL_WRAPPER, display: 'list-item', fontFamily: BASE_FONT, fontSize: BASE_SIZE, lineHeight: BASE_LINE_HEIGHT, marginBottom: '2px' }}>
//       <div style={{ display: 'inline' }}>
//         <u><strong><InlineInput value={node.attrs.title} updateValue={val => updateAttributes({ title: val })} placeholder="Leadership Title" /></strong></u>
//         <span> - </span>
//       </div>
//       <NodeViewContent className="resume-node-content" style={{ display: 'inline' }} />
//     </NodeViewWrapper>
//   );
// };

// --- 8. Skills Entry ---
export const SkillsEntryView = ({ node }) => {
  return (
    <NodeViewWrapper className="resume-node-view" data-label="SKILLS ENTRY" style={{ ...VISUAL_WRAPPER, fontFamily: BASE_FONT, fontSize: BASE_SIZE, lineHeight: BASE_LINE_HEIGHT, marginBottom: '4px' }}>
      <NodeViewContent className="resume-node-content" />
    </NodeViewWrapper>
  );
}