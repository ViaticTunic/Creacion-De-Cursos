import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './BadgeSelector.css';

const BadgeSelector = ({ cursoId, selectedInsignias = [], onSelectionChange }) => {
  const [insignias, setInsignias] = useState([]);
  const [selected, setSelected] = useState(new Set(selectedInsignias.map(i => i.id || i)));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInsignias();
  }, []);

  useEffect(() => {
    if (selectedInsignias.length > 0) {
      setSelected(new Set(selectedInsignias.map(i => i.id || i)));
    }
  }, [selectedInsignias]);

  const fetchInsignias = async () => {
    try {
      const response = await axios.get('/api/cursos/insignias/list');
      setInsignias(response.data);
    } catch (error) {
      console.error('Error al obtener insignias:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (insigniaId) => {
    const newSelected = new Set(selected);
    if (newSelected.has(insigniaId)) {
      newSelected.delete(insigniaId);
    } else {
      newSelected.add(insigniaId);
    }
    setSelected(newSelected);
    
    if (onSelectionChange) {
      const selectedArray = Array.from(newSelected);
      onSelectionChange(selectedArray);
    }
  };

  if (loading) {
    return <div className="badge-selector-loading">Cargando insignias...</div>;
  }

  return (
    <div className="badge-selector">
      <h3 className="badge-selector-title">🏆 Insignias Disponibles</h3>
      <p className="badge-selector-subtitle">
        Selecciona las insignias que los estudiantes pueden ganar en este curso
      </p>
      <div className="badge-selector-grid">
        {insignias.map((insignia) => {
          const isSelected = selected.has(insignia.id);
          return (
            <div
              key={insignia.id}
              className={`badge-selector-item ${isSelected ? 'selected' : ''}`}
              style={{ '--badge-color': insignia.color }}
              onClick={() => handleToggle(insignia.id)}
            >
              <div className="badge-selector-checkbox">
                {isSelected && <span className="checkmark">✓</span>}
              </div>
              <div className="badge-selector-icon">{insignia.icono}</div>
              <div className="badge-selector-content">
                <div className="badge-selector-name">{insignia.nombre}</div>
                <div className="badge-selector-description">{insignia.descripcion}</div>
              </div>
            </div>
          );
        })}
      </div>
      {selected.size > 0 && (
        <div className="badge-selector-summary">
          {selected.size} insignia{selected.size !== 1 ? 's' : ''} seleccionada{selected.size !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
};

export default BadgeSelector;

