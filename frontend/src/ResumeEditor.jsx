import React, { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Highlight from '@tiptap/extension-highlight';
import { TextAlign } from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import { FontFamily } from '@tiptap/extension-font-family';
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

const ResumeEditor = ({ content, hoveredMapping, zoom, setZoom, onUpload }) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      TextStyle,
      FontFamily,
      LineHeight,
      FontSize,
      ParagraphSpacing,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      AiHighlight.configure({ multipart: true }),
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
      editor.commands.setContent(content);
      setTimeout(attachTooltips, 100);
    }
  }, [content, editor]);

  // Handle Search Highlighting
  useEffect(() => {
    if (!editor || !hoveredMapping) return;
    editor.commands.unsetHighlight();
    const text = hoveredMapping.resume_phrase;
    // Simple text search implementation
    // (You can enhance this with exact node matching later)
  }, [hoveredMapping, editor]);

  if (!editor) return null;

  return (
    <div className="resume-panel-wrapper">
      
      {/* --- TOOLBAR --- */}
      <div className="panel-toolbar">
        {/* Upload Button */}
        <label className="upload-label">
          <span>📂 Open</span>
          <input type="file" accept=".docx" onChange={onUpload} />
        </label>
        
        <div className="separator"></div>
        
        {/* Zoom Controls (Integrated here) */}
        <button className="icon-btn" onClick={() => setZoom(z => Math.max(0.3, z - 0.1))}>−</button>
        <span style={{fontSize:'0.8rem', minWidth:'40px', textAlign:'center'}}>{Math.round(zoom * 100)}%</span>
        <button className="icon-btn" onClick={() => setZoom(z => Math.min(1.5, z + 0.1))}>+</button>

        <div className="separator"></div>

        {/* Font Family */}
        <div className="control-group">
          <select 
            className="format-select"
            style={{width: '100px'}}
            onChange={(e) => editor.chain().focus().setFontFamily(e.target.value).run()}
            value={editor.getAttributes('textStyle').fontFamily || 'Times New Roman'}
          >
            <option value="Times New Roman">Times New Roman</option>
            <option value="Arial">Arial</option>
            <option value="Calibri">Calibri</option>
            <option value="Inter">Inter</option>
          </select>
        </div>

        {/* Font Size */}
        <div className="control-group">
          <span className="control-label">Size</span>
          <input 
            type="number" 
            className="format-input" 
            placeholder="11"
            onChange={(e) => editor.chain().focus().setFontSize(e.target.value).run()}
          />
        </div>

        <div className="separator"></div>

        {/* Alignment */}
        <div className="control-group">
          <button className={`icon-btn ${editor.isActive({ textAlign: 'left' }) ? 'active' : ''}`} onClick={() => editor.chain().focus().setTextAlign('left').run()}>L</button>
          <button className={`icon-btn ${editor.isActive({ textAlign: 'center' }) ? 'active' : ''}`} onClick={() => editor.chain().focus().setTextAlign('center').run()}>C</button>
          <button className={`icon-btn ${editor.isActive({ textAlign: 'right' }) ? 'active' : ''}`} onClick={() => editor.chain().focus().setTextAlign('right').run()}>R</button>
          <button className={`icon-btn ${editor.isActive({ textAlign: 'justify' }) ? 'active' : ''}`} onClick={() => editor.chain().focus().setTextAlign('justify').run()}>J</button>
        </div>

        <div className="separator"></div>

        {/* Spacing Controls */}
        <div className="control-group">
          <span className="control-label">Line</span>
          <select className="format-select" onChange={(e) => editor.chain().focus().setLineHeight(e.target.value).run()}>
            <option value="1.0">1.0</option>
            <option value="1.15">1.15</option>
            <option value="1.5">1.5</option>
          </select>
        </div>

        <div className="control-group">
          <span className="control-label" title="Space Before Paragraph">Pre</span>
          <input 
            type="number" 
            className="format-input" 
            placeholder="0"
            onChange={(e) => editor.chain().focus().setMarginTop(e.target.value).run()}
          />
        </div>

        <div className="control-group">
          <span className="control-label" title="Space After Paragraph">Post</span>
          <input 
            type="number" 
            className="format-input" 
            placeholder="0"
            onChange={(e) => editor.chain().focus().setMarginBottom(e.target.value).run()}
          />
        </div>
      </div>

      {/* --- SCROLL AREA (Now properly filling space) --- */}
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