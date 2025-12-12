import React from 'react';

const JobDescription = ({ mappings, onHover }) => {
  if (!mappings || mappings.length === 0) return null;

  return (
    <div className="mappings-list">
      <h3>Detected Matches</h3>
      <ul>
        {mappings.map((map, index) => (
          <li 
            key={index}
            onMouseEnter={() => onHover(map)}
            onMouseLeave={() => onHover(null)}
            className="mapping-item"
          >
            <strong>JD:</strong> {map.jd_phrase} <br/>
            <span className="arrow">⬇ matches ⬇</span> <br/>
            <strong>Resume:</strong> {map.resume_phrase}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default JobDescription;