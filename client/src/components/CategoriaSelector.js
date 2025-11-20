import React, { useState, useRef, useEffect } from 'react';
import './CategoriaSelector.css';

const CategoriaSelector = ({ categorias, value, onChange, name, required = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredCategorias, setFilteredCategorias] = useState(categorias);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    // Filtrar categorías basado en el término de búsqueda
    if (searchTerm.trim() === '') {
      setFilteredCategorias(categorias);
    } else {
      const filtered = categorias.filter(cat =>
        cat.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (cat.descripcion && cat.descripcion.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredCategorias(filtered);
    }
  }, [searchTerm, categorias]);

  useEffect(() => {
    // Cerrar dropdown al hacer clic fuera
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      // Enfocar el input de búsqueda cuando se abre
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 100);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const selectedCategoria = categorias.find(cat => cat.id === parseInt(value));

  const handleSelect = (categoria) => {
    onChange({
      target: {
        name: name,
        value: categoria.id.toString()
      }
    });
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleToggle = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setSearchTerm('');
    }
  };

  return (
    <div className="categoria-selector" ref={dropdownRef}>
      <div 
        className={`categoria-selector-trigger ${isOpen ? 'open' : ''}`}
        onClick={handleToggle}
      >
        <span className="categoria-selector-value">
          {selectedCategoria ? (
            <>
              {selectedCategoria.icono && <span className="categoria-icono">{selectedCategoria.icono}</span>}
              {selectedCategoria.nombre}
            </>
          ) : (
            <span className="categoria-placeholder">Selecciona una categoría</span>
          )}
        </span>
        <span className="categoria-selector-arrow">▼</span>
      </div>

      {isOpen && (
        <div className="categoria-selector-dropdown">
          <div className="categoria-search">
            <span className="search-icon">🔍</span>
            <input
              ref={inputRef}
              type="text"
              placeholder="Buscar categoría..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="categoria-search-input"
            />
          </div>
          
          <div className="categoria-list">
            {filteredCategorias.length > 0 ? (
              filteredCategorias.map(categoria => (
                <div
                  key={categoria.id}
                  className={`categoria-option ${parseInt(value) === categoria.id ? 'selected' : ''}`}
                  onClick={() => handleSelect(categoria)}
                >
                  {categoria.icono && <span className="categoria-icono">{categoria.icono}</span>}
                  <div className="categoria-option-content">
                    <div className="categoria-option-name">{categoria.nombre}</div>
                    {categoria.descripcion && (
                      <div className="categoria-option-desc">{categoria.descripcion}</div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="categoria-no-results">
                No se encontraron categorías
              </div>
            )}
          </div>
        </div>
      )}

      {/* Input oculto para el formulario */}
      <input
        type="hidden"
        name={name}
        value={value || ''}
        required={required}
      />
    </div>
  );
};

export default CategoriaSelector;

