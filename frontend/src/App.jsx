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

  useEffect(() => {
    window.addEventListener('mousemove', handleDrag);
    window.addEventListener('mouseup', handleDragEnd);
    return () => {
      window.removeEventListener('mousemove', handleDrag);
      window.removeEventListener('mouseup', handleDragEnd);
    };
  }, []);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await axios.post('http://localhost:5000/upload', formData);
      setResumeHtml(res.data.html);
      setToast({ message: 'Upload Successful', type: 'success' });
    } catch (err) { setToast({ message: 'Upload Failed', type: 'error' }); }
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
            onUpload={handleFileUpload}
            setZoom={setResumeZoom} // Pass zoom setter down
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