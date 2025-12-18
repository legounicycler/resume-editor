import React, { useContext } from 'react';
import { NodeViewWrapper, NodeViewContent } from '@tiptap/react';
import { IconContext } from "../context/IconContext"

// --- HELPER: Map Node Types to CSS Classes ---
// This bridges the gap between Tiptap Nodes and your App.css
const getNodeClass = (nodeType) => {
  const map = {
    institution: 'resume-institution',
    positionTitle: 'resume-position-title',
    positionDescription: 'resume-position-description',
    location: 'resume-location',
    date: 'resume-date',
    degreeType: 'resume-degree-type',
    major: 'resume-major',
    gpa: 'resume-gpa',
    entryTitleSimple: 'entry-title-simple'
  };
  return map[nodeType] || '';
};

// --- NEW: GENERIC INLINE NODE VIEW ---
export const InlineNodeView = ({ node, HTMLAttributes }) => {
  // 1. Get the Semantic Class (restores bold, alignment, etc.)
  const semanticClass = getNodeClass(node.type.name);
  
  // 2. Generate Label
  const label = node.attrs.displayName || node.type.name.toUpperCase().replace('NODE', '').replace('SIMPLE', '');

  return (
    <NodeViewWrapper 
      as="span" // Render as a span to behave inline naturally
      className={`resume-node-view ${semanticClass}`} // Combine editor class + semantic class
      data-label={label}
      {...HTMLAttributes} // Pass other dynamic attributes (like inline styles from marks)
      style={{
        display: 'inline-block', // Required for width/margin calculations (like Date alignment)
        verticalAlign: 'bottom', // Aligns better with text
        padding: '0 2px',
        cursor: 'text',
        ...HTMLAttributes.style // Preserves font-size/color edits
      }}
    >
      <NodeViewContent as="span" /> 
    </NodeViewWrapper>
  );
};

// --- THE UNIVERSAL VIEW (Work/Project/Research/Leadership) ---
export const StandardEntryView = ({ node }) => {
  const label = node.attrs.displayName || node.type.name.toUpperCase();
  return (
    <NodeViewWrapper 
      className="resume-node-view" 
      data-label={label} 
      style={{ marginBottom: '10px' }}
    >
      <NodeViewContent className="resume-node-content" />
    </NodeViewWrapper>
  );
};

// --- SECTION VIEW ---
export const SectionView = ({ node }) => {
  return (
    <NodeViewWrapper className="resume-node-view" data-label="SECTION" style={{ margin: '15px 0 5px 0' }}>
      <NodeViewContent className="resume-node-content" />
    </NodeViewWrapper>
  );
};

// --- PERSONAL SECTION VIEW ---
export const PersonalSectionView = ({ node }) => {
  return (
    <NodeViewWrapper
      className="resume-node-view"
      data-label="PERSONAL INFO"
      style={{ textAlign: 'center', marginBottom: '8px' }}
    >
      <div className="personal-content-wrapper"> 
        <NodeViewContent /> 
      </div>
    </NodeViewWrapper>
  )
}

// --- CONTACT DETAIL VIEW ---
export const ContactDetailView = ({ node }) => {
  const icons = useContext(IconContext); 
  const { type, value } = node.attrs;

  // FIX: Safety check for type
  const safeType = type ? type.toUpperCase() : 'UNKNOWN';

  const IconComponent = () => {
    const base64Src = icons && icons[type];
    if (!base64Src) return <span style={{ width: '12px', height: '12px', display: 'inline-block', background: "black"}}></span>; 
    return <img src={base64Src} alt={type} className="myicon" style={{ verticalAlign: 'middle' }} />;
  };

  const isLink = ['linkedin', 'website', 'email', 'github'].includes(type);
  const link = type === 'email' ? `mailto:${value}` : value;

  return (
    <NodeViewWrapper 
      className="resume-node-view" 
      data-label={`CONTACT: ${safeType}`}
      style={{ 
        display: 'inline-block', 
        textAlign: 'center', 
        minWidth: '20%', 
        padding: '0px 4px', 
        fontSize: '9pt', 
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

// --- SKILLS ENTRY VIEW ---
export const SkillsEntryView = ({ node }) => {
  return (
    <NodeViewWrapper 
      className="resume-node-view" 
      data-label="SKILLS ENTRY" 
      style={{ marginBottom: '4px' }}
    >
      <NodeViewContent className="resume-node-content" />
    </NodeViewWrapper>
  );
}

// --- NEW: PROJECT SKILLS VIEW ---
export const ProjectSkillsView = ({ node }) => {
  return (
    <NodeViewWrapper 
      as="div" // Keep as div to allow the list-item behavior (new line)
      className="resume-node-view project-skills-view" 
      data-label="PROJECT SKILLS"
      style={{ fontSize: '9pt', marginTop: '2px' }}
    >
      <span contentEditable={false} style={{ fontWeight: 'bold', marginRight: '4px' }}>
        Skills: 
      </span>
      {/* Force as="span" here to fight the internal div creation */}
      <NodeViewContent as="span" className="project-skills-content" />
    </NodeViewWrapper>
  );
}

// --- POSITION ENTRY VIEW ---
export const PositionEntryView = ({ node }) => {
  const { displayName, title, location, date, description, variant } = node.attrs;

  // SCENARIO 2A: Condensed View
  // Title & Description inline, no date/loc (inherited from parent)
  if (variant === 'condensed') {
    return (
      <NodeViewWrapper className="resume-node-view position-entry" data-label={displayName}>
        <NodeViewContent className="resume-node-content" /> {/* The Bullets */}
      </NodeViewWrapper>
    );
  }

  // SCENARIO 2B: Full View
  // Looks like a mini EntryHeader (Title - Location ... Date)
  return (
    <NodeViewWrapper className="resume-node-view position-entry" data-label={displayName}>
      <NodeViewContent className="resume-node-content" /> {/* The Bullets */}
    </NodeViewWrapper>
  );
};