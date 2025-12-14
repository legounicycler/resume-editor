import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { 
  SectionView, 
  EducationEntryView, 
  WorkEntryView, 
  ResearchEntryView, 
  ProjectEntryView, 
  LeadershipEntryView, 
  SkillsEntryView,
  EducationDegreeView
} from '../components/ResumeNodeViews';

// 1. The Root Document (Strict Locking)
export const ResumeDocument = Node.create({
  name: 'doc',
  topNode: true,
  content: 'personalSection resumeSection+', // Root must have Personal info, then 1+ Sections
});

// 2. The Personal Section (Hardcoded structure)
export const PersonalSection = Node.create({
  name: 'personalSection',
  group: 'block',
  content: 'heading paragraph block+', // Name, Summary, Divider, Contact Info
  parseHTML() { return [{ tag: 'div[data-type="personal-section"]' }] },
  renderHTML({ HTMLAttributes }) {
    return ['div', { 'data-type': 'personal-section', ...HTMLAttributes }, 0];
  },
});

// 3. Generic Section Container (e.g., "Work Experience", "Education", "Skills", etc.)
export const ResumeSection = Node.create({
  name: 'resumeSection',
  group: 'block',
  content: 'heading (educationEntry|workEntry|researchEntry|projectEntry|leadershipEntry|skillsEntry)+', // Title + List of entries
  addAttributes() {
    return {
      sectionType: { default: 'generic' }, // 'education', 'work', 'projects', etc.
    };
  },
  parseHTML() { return [{ tag: 'section' }] },
  renderHTML({ HTMLAttributes }) {
    return ['section', mergeAttributes(HTMLAttributes), 0];
  },
  addNodeView() {
    return ReactNodeViewRenderer(SectionView);
  },
});

// 5. Education Entry
export const EducationEntry = Node.create({
  name: 'educationEntry',
  group: 'block',
  content: 'educationDegree+', // Education entry now contains one or more specific degrees
  addAttributes() {
    return {
      school: { default: 'School' },
      location: { default: 'Location' },
      dates: { default: 'Dates' },
    };
  },
  parseHTML() { return [{ tag: 'div[data-type="education-entry"]' }] },
  renderHTML({ HTMLAttributes }) {
    return ['div', { 'data-type': 'education-entry', ...HTMLAttributes }, 0];
  },
  addNodeView() {
    return ReactNodeViewRenderer(EducationEntryView);
  },
});

// NEW: Education Degree Node (e.g., Bachelor's, Master's within an Education Entry)
export const EducationDegree = Node.create({
  name: 'educationDegree',
  group: 'block', // Can be a block within an EducationEntry
  content: 'bulletList?', // Bullets specific to this degree
  addAttributes() {
    return {
      degree: { default: 'Bachelors...' },
      major: { default: 'Major...' },
      gpa: { default: '' }
    };
  },
  renderHTML({ HTMLAttributes }) {
    // Render as a simple div. The complex styling is handled by the parent EducationEntryView.
    return ['div', { 'data-type': 'education-degree', ...HTMLAttributes }, 0];
  },
  // Optional: Add NodeView for visualization (Recommended)
  addNodeView() {
      return ReactNodeViewRenderer(EducationDegreeView); // Use the view you created
  }
});


// 4. Work Entry (Company, Locaiton, Dates, Bullets)
export const WorkEntry = Node.create({
  name: 'workEntry',
  group: 'block',
  content: 'bulletList', // The user edits the bullets. The Header is handled by attributes.
  addAttributes() {
    return {
      company: { default: 'Company Name' },
      location: { default: 'Location' },
      dates: { default: 'Dates' },
    };
  },
  parseHTML() { return [{ tag: 'div[data-type="work-entry"]' }] },
  renderHTML({ HTMLAttributes }) {
    return ['div', { 'data-type': 'work-entry', ...HTMLAttributes }, 0];
  },
  addNodeView() {
    return ReactNodeViewRenderer(WorkEntryView);
  },
});

// 5. Research Entry (Institution, Locaiton, Dates, Bullets)
export const ResearchEntry = Node.create({
  name: 'researchEntry',
  group: 'block',
  content: 'bulletList', // The user edits the bullets. The Header is handled by attributes.
  addAttributes() {
    return {
      institution: { default: 'Institution Name' },
      location: { default: 'Location' },
      dates: { default: 'Dates' },
    };
  },
  parseHTML() { return [{ tag: 'div[data-type="research-entry"]' }] },
  renderHTML({ HTMLAttributes }) {
    return ['div', { 'data-type': 'research-entry', ...HTMLAttributes }, 0];
  },
  addNodeView() {
    return ReactNodeViewRenderer(ResearchEntryView);
  },
});

// 6. Project Entry
export const ProjectEntry = Node.create({
  name: 'projectEntry',
  group: 'block',
  content: 'paragraph', // Description is a single paragraph
  addAttributes() {
    return {
      title: { default: 'Title' },
      skills: { default: [] } // Skills are an array attribute
    };
  },
  renderHTML({ HTMLAttributes }) {
    return ['div', { 'data-type': 'project-entry', ...HTMLAttributes }, 0];
  },
  addNodeView() {
    return ReactNodeViewRenderer(ProjectEntryView);
  },
});

// 6. Leadership Entry
export const LeadershipEntry = Node.create({
  name: 'leadershipEntry',
  group: 'block',
  content: 'paragraph', // Description is a single paragraph
  addAttributes() {
    return {
      title: { default: 'Title' },
    };
  },
  renderHTML({ HTMLAttributes }) {
    return ['div', { 'data-type': 'leadership-entry', ...HTMLAttributes }, 0];
  },
  addNodeView() {
    return ReactNodeViewRenderer(LeadershipEntryView);
  },
});

// 7. Skills Entry
export const SkillsEntry = Node.create({
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