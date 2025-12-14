import { useEffect, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';

// Tiptap Extensions
import Highlight from '@tiptap/extension-highlight';
import { TextAlign } from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableHeader } from '@tiptap/extension-table-header';
import { Image } from '@tiptap/extension-image';

// Other extensions?
import tippy from 'tippy.js';
import 'tippy.js/dist/tippy.css';

// Custom Extensions
import { CustomTableCell } from './extensions/CustomTableCell';
import { LineHeight } from './extensions/LineHeight';
import { FontSize } from './extensions/FontSize';
import { ParagraphSpacing } from './extensions/ParagraphSpacing';

// Resume nodes
import { 
  ResumeDocument, 
  PersonalSection, 
  ResumeSection, 
  WorkEntry, 
  EducationEntry, 
  ProjectEntry,
  ResearchEntry,
  LeadershipEntry,
  SkillsEntry,
  EducationDegree
} from './extensions/ResumeNodes';

const AiHighlight = Highlight.extend({
  addAttributes() {
    return {
      'data-reason': { default: null },
      'data-type': { default: null },
    };
  },
  renderHTML({ HTMLAttributes }) {
    return ['mark', HTMLAttributes, 0];
  },
});

const ResumeEditor = ({ content, hoveredMapping, zoom, setZoom, onLoadData}) => {
  const [currentLineHeight, setCurrentLineHeight] = useState('1.0');
  const [currentFontSize, setCurrentFontSize] = useState('10');
  const [currentMarginBottom, setCurrentMarginBottom] = useState('0'); // New state for margin bottom
  const [currentMarginTop, setCurrentMarginTop] = useState('0');     // New state for margin top
  
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ document: false }), // DISABLE default Document to use ours
      ResumeDocument, // Custom Root
      PersonalSection, // Custom top level node
      ResumeSection, // Custom top level node
      WorkEntry, 
      EducationEntry, 
      ProjectEntry,
      ResearchEntry,
      LeadershipEntry,
      SkillsEntry,
      EducationDegree,
      TextStyle,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      AiHighlight.configure({ multipart: true }),
      Table.configure({ resizable: true }),
      Image.configure({ inline: true, allowBase64: true, HTMLAttributes: { class: 'myicon' } }),
      TableRow,
      TableHeader,
      CustomTableCell,
      LineHeight,
      FontSize,
      ParagraphSpacing,
    ],
    content: content,
    onUpdate: ({ editor }) => attachTooltips(),
  });

  const attachTooltips = () => {
    const marks = document.querySelectorAll('mark[data-reason]');
    marks.forEach((mark) => {
      if (!mark._tippy) {
        tippy(mark, { content: mark.getAttribute('data-reason'), placement: 'top' });
      }
    });
  };

  // useEffect(() => {
  //   if (editor && content && content !== editor.getHTML()) {
  //     // Normalize pasted/generated tables that use "min-width" (commonly from Word)
  //     // into explicit "width" styles so the browser/tiptap honors column sizing.
  //     const normalized = content.replace(/min-width\s*:\s*([^;"]+)(;)?/gi, 'width:$1');
  //     editor.commands.setContent(normalized);
  //     setTimeout(attachTooltips, 100);
  //   }
  // }, [content, editor]);

  // Handle line height edits
  useEffect(() => {
    if (!editor) return;
    
    const updateLineHeight = () => {
      const { $from } = editor.state.selection;
      const nodeType = $from.node().type.name;
      const attrs = editor.getAttributes(nodeType);
      setCurrentLineHeight(attrs.lineHeight || '1.0');
    };
    
    const updateFontSize = () => {
      let foundFontSize = '10'; // Default fallback

      // 1. Check for inline style (Mark) - Highest priority
      const markAttrs = editor.getAttributes('textStyle');
      if (markAttrs.fontSize) {
        foundFontSize = markAttrs.fontSize;
        setCurrentFontSize(foundFontSize);
        return;
      }

      // 2. Check for block level style (Node) - Fallback
      // We check common block types that support fontSize
      const blockTypes = ['paragraph', 'heading', 'listItem', 'tableCell', 'tableHeader'];
      for (const type of blockTypes) {
        if (editor.isActive(type)) {
          const nodeAttrs = editor.getAttributes(type);
          if (nodeAttrs.fontSize) {
            foundFontSize = markAttrs.fontSize;
            setCurrentFontSize(foundFontSize);
            return;
          }
        }
      }

      // 3. Default fallback if no specific font size is found
      setCurrentFontSize(foundFontSize);
    };
    
    const updateMarginSpacing = () => {
      const { $from } = editor.state.selection;
      // Get attributes for the current node or its parent if it's an inline node within a block
      const node = $from.node();
      const parent = $from.parent;
      let attrs = {};
      // If the selection is inside text (e.g., a word in a paragraph), get parent's attributes.
      // Otherwise, get the attributes of the current node.
      if (node.type.name === 'text' && parent) {
        attrs = editor.getAttributes(parent.type.name);
      } else {
        attrs = editor.getAttributes(node.type.name);
      }

      setCurrentMarginBottom(attrs.marginBottom || '0');
      setCurrentMarginTop(attrs.marginTop || '0');
    };

    updateLineHeight();
    updateFontSize();
    updateMarginSpacing(); // Initialize margin spacing
    editor.on('selectionUpdate', () => {
      updateLineHeight();
      updateFontSize();
      updateMarginSpacing(); // Update margin spacing on selection change
    });
    editor.on('update', () => {
      updateLineHeight();
      updateFontSize();
      updateMarginSpacing(); // Update margin spacing on editor content change
    });
    
    return () => {
      editor.off('selectionUpdate', updateLineHeight);
      editor.off('selectionUpdate', updateFontSize);
      editor.off('selectionUpdate', updateMarginSpacing); // Cleanup for margin spacing
      editor.off('update', updateLineHeight);
      editor.off('update', updateFontSize);
      editor.off('update', updateMarginSpacing); // Cleanup for margin spacing
    };
  }, [editor]);

  // Handle Search Highlighting
  useEffect(() => {
    if (!editor || !hoveredMapping) return;
    editor.commands.unsetHighlight();
    const text = hoveredMapping.resume_phrase;
  }, [hoveredMapping, editor]);

  useEffect(() => {
    if (editor && content) {
      // Check if content is different to prevent loops
      // (For JSON comparison, a simple check might be tricky, so we just set it for now 
      // or compare if you want to be strict. Tiptap handles setContent smartly.)
      
      // This command replaces the entire document with your new JSON
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  if (!editor) return null;

  return (
    <div className="resume-panel-wrapper">
      
      {/* --- TOOLBAR --- */}
      <div className="panel-toolbar">
        <button className="upload-label" onClick={onLoadData}>
          <span>📋 Load Resume Data</span>
        </button>

        <div className="separator"></div>
        
        {/* Zoom */}
        <button className="icon-btn" onClick={() => setZoom(z => Math.max(0.3, z - 0.1))}>−</button>
        <span style={{fontSize:'0.8rem', minWidth:'40px', textAlign:'center'}}>{Math.round(zoom * 100)}%</span>
        <button className="icon-btn" onClick={() => setZoom(z => Math.min(1.5, z + 0.1))}>+</button>

        <div className="separator"></div>

        {/* Alignment */}
        <div className="control-group">
          <button className={`icon-btn ${editor.isActive({ textAlign: 'left' }) ? 'active' : ''}`} onClick={() => editor.chain().focus().setTextAlign('left').run()}>L</button>
          <button className={`icon-btn ${editor.isActive({ textAlign: 'center' }) ? 'active' : ''}`} onClick={() => editor.chain().focus().setTextAlign('center').run()}>C</button>
          <button className={`icon-btn ${editor.isActive({ textAlign: 'right' }) ? 'active' : ''}`} onClick={() => editor.chain().focus().setTextAlign('right').run()}>R</button>
          <button className={`icon-btn ${editor.isActive({ textAlign: 'justify' }) ? 'active' : ''}`} onClick={() => editor.chain().focus().setTextAlign('justify').run()}>J</button>
        </div>

        <div className="separator"></div>

        {/* Line Height */}
        <div className="control-group"> {/* Added control-group for better alignment with label */}
          <label htmlFor="line-height-select" style={{ fontSize: '0.8rem', marginRight: '5px' }}>Line Height:</label>
          <select
            id="line-height-select" // Added ID for label association
            value={currentLineHeight}
            onChange={e => {
              editor.chain().focus().setLineHeight(e.target.value).run();
              setCurrentLineHeight(e.target.value);
            }}
            style={{ background: 'white', color: 'black', border: '1px solid #ccc', padding: '2px 5px', borderRadius: '3px' }} // Light theme styles
          >
            <option value="1.0">1.0</option>
            <option value="1.15">1.15</option>
            <option value="1.5">1.5</option>
            <option value="2.0">2.0</option>
          </select>
        </div>

        <div className="separator"></div>

        {/* Font Size */}
        <div className="control-group">
          <button className="icon-btn" onClick={() => editor.chain().focus().setFontSize(Math.max(8, parseInt(currentFontSize) - 1)).run()}>A−</button>
          <input 
            type="number" 
            min="8" 
            max="72" 
            value={currentFontSize}
            onChange={e => {
              const size = e.target.value;
              setCurrentFontSize(size);
              if (size) editor.chain().focus().setFontSize(size).run();
            }}
            style={{width: '40px', padding: '2px', textAlign: 'center', background: 'white', color: 'black', border: '1px solid #ccc', borderRadius: '3px'}} // Light theme styles
          />
          <button className="icon-btn" onClick={() => editor.chain().focus().setFontSize(Math.min(72, parseInt(currentFontSize) + 1)).run()}>A+</button>
        </div>

        <div className="separator"></div>

        {/* Paragraph Spacing */}
        <div className="control-group">
          <label htmlFor="margin-top" style={{fontSize: '0.8rem'}}>MT:</label>
          <input
            id="margin-top"
            type="number"
            min="0"
            max="100"
            value={currentMarginTop}
            onChange={e => {
              const size = e.target.value;
              setCurrentMarginTop(size);
              editor.chain().focus().setMarginTop(size).run();
            }}
            style={{width: '40px', padding: '2px', textAlign: 'center', background: 'white', color: 'black', border: '1px solid #ccc', borderRadius: '3px'}} // Light theme styles
          />
          <label htmlFor="margin-bottom" style={{fontSize: '0.8rem', marginLeft: '10px'}}>MB:</label>
          <input
            id="margin-bottom"
            type="number"
            min="0"
            max="100"
            value={currentMarginBottom}
            onChange={e => {
              const size = e.target.value;
              setCurrentMarginBottom(size);
              editor.chain().focus().setMarginBottom(size).run();
            }}
            style={{width: '40px', padding: '2px', textAlign: 'center', background: 'white', color: 'black', border: '1px solid #ccc', borderRadius: '3px'}} // Light theme styles
          />
        </div>

      </div> {/* End of panel-toolbar */}

      <div className="editor-scroll-area">
        <div 
          className="zoom-frame" 
          style={{ transform: `scale(${zoom})` }}
        >
          <EditorContent editor={editor} className="editor-content" />
        </div>
      </div>
    </div>
  );
};

export default ResumeEditor;