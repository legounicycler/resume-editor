import { useState, useRef, useEffect } from 'react';
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
  const [icons, setIcons] = useState({}); // Store loaded icons here


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

  useEffect(() => {
    // Function to fetch icons
    const fetchIcons = async () => {
      try {
        const res = await axios.get('http://localhost:5000/get-icons-png');
        setIcons(res.data);
        console.log('Icons loaded:', res.data);
      } catch (err) {
        setToast({ message: 'Failed to load icons from server.', type: 'error' });
      }
    };
    
    fetchIcons();
    handleLoadStructuredData(); // Load data after fetching icons (or alongside)
  }, []);

  const generateResumeHtml = (data) => {
    // Defined Base Styles
    const BASE_FONT = "font-family: Arial, sans-serif;"
    const BASE_FONT_SIZE = "font-size: 10pt;"
    const BASE_LINE_HEIGHT = "line-height: 1.0;"
    const BASE_MARGIN = "margin: 0;"
    const BASE_EVERYTHING = `${BASE_FONT} ${BASE_FONT_SIZE} ${BASE_LINE_HEIGHT} ${BASE_MARGIN}`;
    
    // Helper to generate the img tag for an icon
    const getIcon = (type) => {
      const base64Src = icons[type]; 
      if (!base64Src) return ''; 
      return `<img src="${base64Src}">`;
    };

    // Construct entry header
    function constructEntryHeader(title, location, dates) {
      return `
      <table style="width: 100%; border-collapse: collapse; margin: 0; padding: 0; table-layout: fixed;">
        <tbody>
          <tr>
            <td style="vertical-align: middle; box-sizing: border-box;" data-col-width="80%">
              <p style="${BASE_FONT} ${BASE_MARGIN} ${BASE_FONT_SIZE} line-height: 1.15;">
                <u style="text-decoration: underline;">
                  <span style="font-weight: bold;">${title}</span>
                  <span style="font-style: italic;"> - ${location}</span>
                </u>
              </p>
            </td>
            <td style="vertical-align: middle; white-space: nowrap; box-sizing: border-box;" data-col-width="20%">
              <p style="${BASE_FONT} ${BASE_MARGIN} ${BASE_FONT_SIZE} line-height: 1.15; text-align: right;">
                <span style="font-weight: bold; display: inline-block;">${dates}</span>
              </p>
            </td>
          </tr>
        </tbody>
      </table>
      `;
    }

    // Construct bulleted list
    function constructBulletedList(bullets) {
      let listHtml = `<ul style="padding-left: 1.5rem; list-style-type: disc;">`;
      bullets.forEach(bullet => {
        listHtml += `<li style="${BASE_EVERYTHING}">`;
        listHtml += `
          <p style="${BASE_FONT} ${BASE_MARGIN} ${BASE_FONT_SIZE} line-height: 1.0;">
            ${bullet}
          </p>
        `
        listHtml += `</li>`;
      });
      listHtml += `</ul>`;
      return listHtml;
    }

    let html = '';

    // A. NAME/CONTACT HEADER
    html += `<h1 style="${BASE_FONT} ${BASE_LINE_HEIGHT} text-align: center; text-decoration: underline;">${data.personal.name}</h1>`;
    html += `<p style="${BASE_FONT} ${BASE_FONT_SIZE} ${BASE_LINE_HEIGHT} margin-top: 3px; margin-bottom: 3px; text-align: left;"><strong><u>Summary:</u></strong> ${data.personal.summary}</p>`;
    html += `<\hr>`
    html += `
    <p style="${BASE_FONT} line-height: 1.5; font-size: 9pt; margin-bottom: 3px; text-align: center;">
      ${getIcon('email')} <a href="mailto:${data.personal.email}" style="text-decoration: none; color: inherit;">${data.personal.email}</a> | 
      ${getIcon('phone')} <span>${data.personal.phone}</span> | 
      ${getIcon('linkedin')} <a href="${data.personal.linkedin}" target="_blank" style="text-decoration: none; color: inherit;">${data.personal.linkedin}</a> | 
      ${getIcon('website')} <a href="${data.personal.website}" target="_blank" style="text-decoration: none; color: inherit;">${data.personal.website}</a>
    </p>`;

    // B. SECTIONS
    data.sections.forEach(section => {
      html += `<h2 style="${BASE_FONT} text-align: center;">${section.title}</h2>`;

      // --- Education section ---
      if (section.title.toLowerCase().includes('education')) {
        section.entries.forEach(entry => {

          // 1. School title (i.e. company name + location + dates)
          html += constructEntryHeader(entry.school, entry.location, entry.dates);

          // 2. Degree, Major, GPA
          html += `<ul style="padding-left: 1.5rem; list-style-type: disc;">`;
          entry.degrees.forEach(degreeEntry => {
            html += `<li style="${BASE_EVERYTHING}">`;
            html += `
              <p style="${BASE_FONT} ${BASE_MARGIN} ${BASE_FONT_SIZE} line-height: 1.15;">
                <strong>${degreeEntry.degree}:</strong> ${degreeEntry.major}&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp<strong>GPA:</strong> <span display: inline-block;">${degreeEntry.gpa}</span>
              </p>
            `
            html += `</li>`;
            if (degreeEntry.bullets && degreeEntry.bullets.length > 0) {
              // 3. Bullets
              html += constructBulletedList(degreeEntry.bullets);
            }
          });
          html += `</ul>`;
        });
      }

      // --- Work Experience section ---
      if (section.title.toLowerCase().includes('work experience')) {
        section.entries.forEach(entry => {
          // 1. Section Title (i.e. company name + location + dates)
          html += constructEntryHeader(entry.company, entry.location, entry.dates);

          // 2. Bullets
          html += constructBulletedList(entry.bullets);
          // html += `<p><p/>`; // Extra space after section
        });
      }

      // --- Research section ---
      if (section.title.toLowerCase().includes('research')) {
        section.entries.forEach(entry => {
          // 1. Section Title (i.e. company name + location + dates)
          html += constructEntryHeader(entry.company, entry.location, entry.dates);

          // 2. Bullets
          html += constructBulletedList(entry.bullets);
        });
      }

      // --- Projects section ---
      if (section.title.toLowerCase().includes('projects')) {
        html += `<ul style="padding-left: 1.5rem;">`;
        section.entries.forEach(entry => {
          html += `<li style="${BASE_EVERYTHING}">`;
          html += `
            <p style="${BASE_EVERYTHING}">
              <u><strong>${entry.title}</strong></u> - ${entry.description}
            </p>
          `
          html += `</li>`;
        });
        html += `</ul>`;
      }

      // --- Leadership section ---
      if (section.title.toLowerCase().includes('leadership')) {
        html += `<ul style="padding-left: 1.5rem; list-style-type: disc;">`;
        section.entries.forEach(entry => {
          html += `<li style="${BASE_EVERYTHING}">`;
          html += `
            <p style="${BASE_FONT} ${BASE_MARGIN} ${BASE_FONT_SIZE}">
              <u><strong>${entry.title}</strong></u> - ${entry.description})
            </p>
          `
          html += `</li>`;
        });
        html += `</ul>`;
      }

      // --- Skills section ---
      if (section.title.toLowerCase().includes('skills')) {
        html += `<p style="${BASE_FONT} ${BASE_LINE_HEIGHT} ${BASE_MARGIN} font-size: 9pt; text-align: center;">`;
        section.entries.forEach(entry => {
          html += `${entry}, `;
        });
        html = html.slice(0, -2); // Remove trailing comma and space
        html += `</p>`;
        return; // Skip the rest of the loop for skills
      }
    
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