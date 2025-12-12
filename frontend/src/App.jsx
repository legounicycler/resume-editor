import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import ResumeEditor from './ResumeEditor';
import JobDescription from './JobDescription';
import './App.css';

const Toast = ({ message, type, stack, onClose }) => {
  const [showStack, setShowStack] = useState(false);
  if (!message) return null;
  return (
    <div className={`toast-container ${type}`}>
      <div className="toast-content">
        <span>{message}</span>
        {stack && <button className="text-link" style={{ background: 'none', border: 'none', color: 'white', textDecoration: 'underline', marginLeft: '10px', cursor: 'pointer' }} onClick={() => setShowStack(!showStack)}>Details</button>}
      </div>
      <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}>✕</button>
      {showStack && stack && <pre className="stack-trace">{stack}</pre>}
    </div>
  );
};

function App() {
  const [resumeHtml, setResumeHtml] = useState('<p>Upload a resume...</p>');
  const [jobDesc, setJobDesc] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mappings, setMappings] = useState([]);
  const [toast, setToast] = useState({ message: '', type: '', stack: '' });
  const [leftWidth, setLeftWidth] = useState(60);
  const [resumeZoom, setResumeZoom] = useState(0.8);
  const [jdZoom, setJdZoom] = useState(1.0);
  const isDragging = useRef(false);
  const handleDragStart = () => { isDragging.current = true; };
  const handleDrag = (e) => {
    if (!isDragging.current) return;
    const newLeftWidth = (e.clientX / window.innerWidth) * 100;
    if (newLeftWidth > 20 && newLeftWidth < 80) setLeftWidth(newLeftWidth);
  };
  const handleDragEnd = () => { isDragging.current = false; };

  useEffect(() => {
    window.addEventListener('mousemove', handleDrag);
    window.addEventListener('mouseup', handleDragEnd);
    return () => {
      window.removeEventListener('mousemove', handleDrag);
      window.removeEventListener('mouseup', handleDragEnd);
    };
  }, []);

  const generateResumeHtml = (data) => {
    // Defined Base Styles
    const BASE_FONT = "font-family: Arial, sans-serif;"
    const BASE_FONT_SIZE = "font-size: 10pt;"
    const BASE_LINE_HEIGHT = "line-height: 1.0;"
    const BASE_MARGIN = "margin: 0;"
    const BASE_EVERYTHING = `${BASE_FONT} ${BASE_FONT_SIZE} ${BASE_LINE_HEIGHT} ${BASE_MARGIN}`;

    let html = '';

    // A. NAME/CONTACT HEADER
    html += `<h1 style="${BASE_FONT} ${BASE_LINE_HEIGHT} font-size: 14pt; text-align: center; text-decoration: underline; margin-bottom: 2pt;">${data.personal.name}</h1>`;
    html += `<p style="${BASE_FONT} ${BASE_FONT_SIZE} ${BASE_LINE_HEIGHT} text-align: center; margin-bottom: 2pt;">${data.personal.summary}</p>`;
    html += `<p style="${BASE_FONT} ${BASE_LINE_HEIGHT} font-size: 8pt; text-align: center; margin-bottom: 10pt;">${data.personal.contact_info}</p>`;

    // B. SECTIONS
    data.sections.forEach(section => {
      html += `<h2 style="${BASE_FONT} font-weight: bold; text-align: center; border-bottom: 1px solid black; margin-top: 10pt; margin-bottom: 4pt;">${section.title}</h2>`;

      section.entries.forEach(entry => {
        // OPEN wrapper for the whole entry (fix: was missing — previously only had a closing </div>)
        html += `<div style="${BASE_FONT} margin-bottom:4pt;">`;

        if (entry.company && entry.dates && entry.location) {
          html += `
            <table style="width: 100%; border-collapse: collapse; margin: 0; padding: 0; table-layout: fixed;">
              <tbody>
                <tr>
                  <td style="vertical-align: middle; box-sizing: border-box;" data-col-width="80%">
                    <p style="${BASE_FONT} ${BASE_MARGIN} ${BASE_FONT_SIZE} line-height: 1.15;">
                      <u style="text-decoration: underline;">
                        <span style="font-weight: bold;">${entry.company}</span>
                        <span style="font-style: italic;"> - ${entry.location}</span>
                      </u>
                    </p>
                  </td>
                  <td style="vertical-align: middle; white-space: nowrap; box-sizing: border-box;" data-col-width="20%">
                    <p style="${BASE_FONT} ${BASE_MARGIN} ${BASE_FONT_SIZE} line-height: 1.15; text-align: right;">
                      <span style="font-weight: bold; display: inline-block;">${entry.dates}</span>
                    </p>
                  </td>
                </tr>
              </tbody>
            </table>
          `;
        }

        // Description
        if (entry.description) {
           html += `<p style="${BASE_EVERYTHING}">${entry.description}</p>`;
        }
        // Bullets
        if (entry.bullets && entry.bullets.length > 0) {
          html += `<ul style="margin: 0; padding-left: 1.5rem; list-style-type: disc;">`;
          entry.bullets.forEach(bullet => {
            html += `<li style="${BASE_EVERYTHING}">${bullet}</li>`;
          });
          html += `</ul>`;
        }

        // CLOSE wrapper for the entry (matches the opening DIV above)
        html += `</div>`;
      });
    });

    return html;
  };

  const handleLoadStructuredData = async () => {
    try {
      const response = await axios.get('http://localhost:5000/get-data');
      const structuredData = response.data;
      const structuredHtml = generateResumeHtml(structuredData);
      setResumeHtml(structuredHtml);
      setToast({ message: 'Data loaded and styled!', type: 'success' });
    } catch (err) {
      const serverMsg = err.response?.data?.error || err.message;
      setToast({ message: `Load Error: ${serverMsg}. Check your Flask server/JSON file.`, type: 'error', stack: err.stack });
    }
  };

  const handleGenerate = async () => {
    if (!jobDesc.trim()) return setToast({ message: 'Paste a JD first', type: 'error' });
    setIsLoading(true);
    try {
      const res = await axios.post('http://localhost:5000/analyze', {
        resumeHtml,
        jobDescription: jobDesc
      });
      setResumeHtml(res.data.html);
      setMappings(res.data.mappings);
      setToast({ message: 'Optimized!', type: 'success' });
    } catch (err) {
      setToast({ message: 'Error', type: 'error', stack: err.response?.data?.stack || err.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app-container">
      <Toast {...toast} onClose={() => setToast({ message: '' })} />

      <header className="toolbar">
        <h1>Resume AI Editor</h1>
        <div className="toolbar-actions">
          <button className="optimize-btn" onClick={handleGenerate} disabled={isLoading}>
            {isLoading ? <><div className="spinner"></div> Processing...</> : '✨ Auto-Optimize'}
          </button>
        </div>
      </header>

      <div className="main-split">
        <div className="panel-container" style={{ width: `${leftWidth}%` }}>
          <ResumeEditor
            content={resumeHtml}
            zoom={resumeZoom}
            onLoadData={() => handleLoadStructuredData()}
            setZoom={setResumeZoom}
          />
        </div>

        <div className="resize-handle" onMouseDown={handleDragStart}>||</div>

        <div className="panel-container" style={{ width: `${100 - leftWidth}%` }}>
          <div className="panel-toolbar">
            <span style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>Job Description</span>
            <div className="separator"></div>
            <button className="icon-btn" onClick={() => setJdZoom(z => Math.max(0.5, z - 0.1))}>A−</button>
            <span style={{ fontSize: '0.85rem' }}>{Math.round(jdZoom * 100)}%</span>
            <button className="icon-btn" onClick={() => setJdZoom(z => Math.min(2.0, z + 0.1))}>A+</button>
          </div>

          <div className="right-panel-content">
            <div
              className="jd-input-rich"
              contentEditable
              onInput={(e) => setJobDesc(e.currentTarget.innerHTML)}
              style={{ fontSize: `${jdZoom}rem` }}
              placeholder="Paste Job Description here..."
            />
            <JobDescription mappings={mappings} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;