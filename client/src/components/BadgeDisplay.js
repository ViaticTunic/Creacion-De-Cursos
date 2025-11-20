import React from 'react';
import './BadgeDisplay.css';

const BadgeDisplay = ({ insignias, showDescription = false, size = 'medium' }) => {
  if (!insignias || insignias.length === 0) {
    return null;
  }

  return (
    <div className={`badge-display badge-display-${size}`}>
      {insignias.map((insignia) => (
        <div
          key={insignia.id}
          className="badge-item"
          style={{ '--badge-color': insignia.color }}
          title={insignia.descripcion}
        >
          <div className="badge-icon">{insignia.icono}</div>
          <div className="badge-content">
            <div className="badge-name">{insignia.nombre}</div>
            {showDescription && (
              <div className="badge-description">{insignia.descripcion}</div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default BadgeDisplay;

