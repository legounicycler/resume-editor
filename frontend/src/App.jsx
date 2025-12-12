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
        {stack && <button className="text-link" style={{background:'none', border:'none', color:'white', textDecoration:'underline', marginLeft:'10px', cursor:'pointer'}} onClick={() => setShowStack(!showStack)}>Details</button>}
      </div>
      <button onClick={onClose} style={{background:'none', border:'none', color:'white', fontWeight:'bold', cursor:'pointer'}}>✕</button>
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
  
  // Layout State
  const [leftWidth, setLeftWidth] = useState(60); 
  const [resumeZoom, setResumeZoom] = useState(0.8);
  const [jdZoom, setJdZoom] = useState(1.0); 

  // Dragging Logic
  const isDragging = useRef(false);
  const handleDragStart = () => { isDragging.current = true; };
  const handleDrag = (e) => {
    if (!isDragging.current) return;
    const newLeftWidth = (e.clientX / window.innerWidth) * 100;
    if (newLeftWidth > 20 && newLeftWidth < 80) setLeftWidth(newLeftWidth);
  };
  const handleDragEnd = () => { isDragging.current = false; };

  // NEW State for persistent styles (will hold values fetched from /load-style)
  const [currentStyle, setCurrentStyle] = useState({});

  useEffect(() => {
    window.addEventListener('mousemove', handleDrag);
    window.addEventListener('mouseup', handleDragEnd);
    return () => {
      window.removeEventListener('mousemove', handleDrag);
      window.removeEventListener('mouseup', handleDragEnd);
    };
  }, []);


  const generateResumeHtml = (data) => {
    // This is where we inject the *exact* CSS properties to match your document.
    let html = '';

    // A. NAME/CONTACT HEADER (Centered and Spaced)
    // NOTE: Using a single large p tag for the contact info line will prevent easy editing/re-centering of individual links.
    html += `<p style="text-align: center; font-size: 16pt; font-weight: bold; margin-bottom: 2pt;">${data.personal.name}</p>`;
    html += `<p style="text-align: center; font-size: 11pt; margin-bottom: 8pt;">${data.personal.summary}</p>`;
    html += `<p style="text-align: center; font-size: 10pt; margin-bottom: 12pt;">${data.personal.contact_info}</p>`;
    
    // B. SECTIONS
    data.sections.forEach(section => {
        // Section Title (Bordered Look)
        html += `<h2 style="font-size: 12pt; font-weight: bold; border-bottom: 1px solid black; padding-bottom: 2px; margin-top: 10pt; margin-bottom: 5pt; text-align: center;">${section.title}</h2>`;

        section.entries.forEach(entry => {
            // Two-Column Simulation (using flexbox for clean right-alignment)
            // Inject a style to set the font size for the entire entry
            html += `
                <div style="font-size: 10pt;">
                    <p style="display: flex; justify-content: space-between; margin-bottom: 0pt; margin-top: 5pt;">
                        <span style="font-weight: bold;">${entry.company}</span>
                        <span style="font-style: italic;">${entry.dates}</span>
                    </p>
            `;
            
            if (entry.description) {
                // Description (like the GPA line)
                html += `<p style="margin-top: 0; margin-bottom: 2pt;">${entry.description}</p>`;
            }

            // Bullet Points
            if (entry.bullets && entry.bullets.length > 0) {
                // Lists must be wrapped in a div to properly inherit spacing properties from Tiptap
                html += `<ul style="margin-top: 0; margin-bottom: 5pt; padding-left: 18pt;">`;
                entry.bullets.forEach(bullet => {
                    html += `<li style="margin-bottom: 1pt;">${bullet}</li>`;
                });
                html += `</ul>`;
            }
            
            // Close the entry div
            html += `</div>`;
        });
    });

    return html;
};

  // 2. NEW Asynchronous function to load data from the backend
  const handleLoadStructuredData = async () => {
    try {
        const response = await axios.get('http://localhost:5000/get-data');
        const structuredData = response.data;
        
        const structuredHtml = generateResumeHtml(structuredData);
        setResumeHtml(structuredHtml);
        setToast({ message: 'Data loaded from testResume.json!', type: 'success' });
    } catch (err) {
        const serverMsg = err.response?.data?.error || err.message;
        setToast({ message: `Load Error: ${serverMsg}. Check your Flask server.`, type: 'error', stack: err.stack });
    }
  };

  const handleGenerate = async () => {
    if (!jobDesc.trim()) return setToast({message:'Paste a JD first', type:'error'});
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
        
        {/* LEFT PANEL */}
        <div className="panel-container" style={{ width: `${leftWidth}%` }}>
          <ResumeEditor 
            content={resumeHtml} 
            zoom={resumeZoom} 
            onLoadData={handleLoadStructuredData} // Pass the new async handler
            setZoom={setResumeZoom} 
          />
        </div>

        {/* DRAG HANDLE */}
        <div className="resize-handle" onMouseDown={handleDragStart}>||</div>

        {/* RIGHT PANEL */}
        <div className="panel-container" style={{ width: `${100 - leftWidth}%` }}>
          <div className="panel-toolbar">
            <span style={{fontSize:'0.85rem', fontWeight:'bold'}}>Job Description</span>
            <div className="separator"></div>
            <button className="icon-btn" onClick={() => setJdZoom(z => Math.max(0.5, z - 0.1))}>A−</button>
            <span style={{fontSize:'0.85rem'}}>{Math.round(jdZoom * 100)}%</span>
            <button className="icon-btn" onClick={() => setJdZoom(z => Math.min(2.0, z + 0.1))}>A+</button>
          </div>

          <div className="right-panel-content">
            <div 
              className="jd-input-rich"
              contentEditable
              // Change to innerHTML
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