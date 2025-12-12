import React, { useEffect, useRef, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Highlight from '@tiptap/extension-highlight';
import { TextAlign } from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableHeader } from '@tiptap/extension-table-header';
import { CustomTableCell } from './extensions/CustomTableCell';
import { LineHeight } from './extensions/LineHeight';
import { FontSize } from './extensions/FontSize';
import { ParagraphSpacing } from './extensions/ParagraphSpacing';
import tippy from 'tippy.js';
import 'tippy.js/dist/tippy.css';

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
  const editor = useEditor({
    extensions: [
      StarterKit,
      TextStyle,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      AiHighlight.configure({ multipart: true }),
      Table.configure({ resizable: true }),
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

  useEffect(() => {
    if (editor && content && content !== editor.getHTML()) {
      // Normalize pasted/generated tables that use "min-width" (commonly from Word)
      // into explicit "width" styles so the browser/tiptap honors column sizing.
      const normalized = content.replace(/min-width\s*:\s*([^;"]+)(;)?/gi, 'width:$1');
      editor.commands.setContent(normalized);
      setTimeout(attachTooltips, 100);
    }
  }, [content, editor]);

  useEffect(() => {
    if (!editor) return;
    
    const updateLineHeight = () => {
      const { $from } = editor.state.selection;
      const nodeType = $from.node().type.name;
      const attrs = editor.getAttributes(nodeType);
      setCurrentLineHeight(attrs.lineHeight || '1.0');
    };
    
    updateLineHeight();
    editor.on('selectionUpdate', updateLineHeight);
    editor.on('update', updateLineHeight);
    
    return () => {
      editor.off('selectionUpdate', updateLineHeight);
      editor.off('update', updateLineHeight);
    };
  }, [editor]);

  // Handle Search Highlighting
  useEffect(() => {
    if (!editor || !hoveredMapping) return;
    editor.commands.unsetHighlight();
    const text = hoveredMapping.resume_phrase;
  }, [hoveredMapping, editor]);

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

        {/* Bold & Underline */}
        <div className="control-group">
          <button className={`icon-btn ${editor.isActive('bold') ? 'active' : ''}`} onClick={() => editor.chain().focus().toggleBold().run()}>B</button>
          <button className={`icon-btn ${editor.isActive('underline') ? 'active' : ''}`} onClick={() => editor.chain().focus().toggleUnderline().run()}>U</button>
        </div>

        <div className="separator"></div>

        {/* Line Height */}
        <select
          value={currentLineHeight}
          onChange={e => {
            editor.chain().focus().setLineHeight(e.target.value).run();
            setCurrentLineHeight(e.target.value);
          }}
        >
          <option value="1.0">1.0</option>
          <option value="1.15">1.15</option>
          <option value="1.5">1.5</option>
          <option value="2.0">2.0</option>
        </select>

      </div>

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