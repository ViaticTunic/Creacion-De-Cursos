import React, { useState } from 'react';
import './ExamenForm.css';

const ExamenForm = ({ moduloId, onExamenChange, examenData = null }) => {
  const [preguntas, setPreguntas] = useState(examenData?.preguntas || []);
  const [showPreguntaForm, setShowPreguntaForm] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [formData, setFormData] = useState({
    titulo: examenData?.titulo || '',
    descripcion: examenData?.descripcion || '',
    tiempo_limite_minutos: examenData?.tiempo_limite_minutos || '',
    intentos_permitidos: examenData?.intentos_permitidos || 1,
    porcentaje_aprobacion: examenData?.porcentaje_aprobacion || 70
  });
  const [preguntaForm, setPreguntaForm] = useState({
    pregunta: '',
    tipo_pregunta: 'opcion_multiple',
    puntos: 1,
    orden: 0
  });
  const [opciones, setOpciones] = useState([
    { texto_opcion: '', es_correcta: false, orden: 0 },
    { texto_opcion: '', es_correcta: false, orden: 1 }
  ]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'tiempo_limite_minutos' || name === 'intentos_permitidos' || name === 'porcentaje_aprobacion'
        ? (value === '' ? '' : parseInt(value))
        : value
    }));
    // Solo notificamos cambios al componente padre después de que todo esté inicializado
    // Esto evita que se envíen datos incompletos al principio
    if (isInitialized) {
      notifyChange();
    }
  };

  // Función para avisar al componente padre (ModuloManager) que el examen cambió
  // Esto permite que ModuloManager sepa qué datos tiene el examen en todo momento
  const notifyChange = () => {
    if (onExamenChange) {
      // Enviamos todos los datos del examen: título, descripción, preguntas, etc.
      onExamenChange({
        ...formData, // Todos los campos del formulario (título, descripción, etc.)
        preguntas: preguntas || [] // La lista de preguntas
      });
    }
  };

  const handlePreguntaChange = (e) => {
    const { name, value } = e.target;
    setPreguntaForm(prev => ({
      ...prev,
      [name]: name === 'puntos' || name === 'orden' ? parseFloat(value) : value
    }));
    
    // Si el usuario cambia el tipo de pregunta, ajustamos las opciones
    // Si cambia a "texto libre", no necesita opciones, así que las eliminamos
    if (name === 'tipo_pregunta' && value === 'texto_libre') {
      setOpciones([]); // Vaciamos la lista de opciones
    } else if (name === 'tipo_pregunta' && value === 'opcion_multiple' && opciones.length === 0) {
      // Si cambia a "opción múltiple" y no hay opciones, creamos 2 opciones vacías por defecto
      setOpciones([
        { texto_opcion: '', es_correcta: false, orden: 0 },
        { texto_opcion: '', es_correcta: false, orden: 1 }
      ]);
    }
  };

  const handleOpcionChange = (index, field, value) => {
    const newOpciones = [...opciones];
    newOpciones[index] = {
      ...newOpciones[index],
      [field]: field === 'es_correcta' ? value : value
    };
    setOpciones(newOpciones);
  };

  const addOpcion = () => {
    setOpciones([...opciones, { texto_opcion: '', es_correcta: false, orden: opciones.length }]);
  };

  const removeOpcion = (index) => {
    if (opciones.length > 2) {
      setOpciones(opciones.filter((_, i) => i !== index));
    }
  };

  const handleAgregarPregunta = (e) => {
    e.preventDefault();
    
    if (!preguntaForm.pregunta.trim()) {
      alert('La pregunta es obligatoria');
      return;
    }

    if (preguntaForm.tipo_pregunta === 'opcion_multiple') {
      if (opciones.length < 2) {
        alert('Debe haber al menos 2 opciones para una pregunta de opción múltiple');
        return;
      }
      const opcionesValidas = opciones.filter(o => o.texto_opcion.trim() !== '');
      if (opcionesValidas.length < 2) {
        alert('Debe haber al menos 2 opciones con texto para una pregunta de opción múltiple');
        return;
      }
      const tieneCorrecta = opcionesValidas.some(o => o.es_correcta);
      if (!tieneCorrecta) {
        alert('Debe marcar al menos una opción como correcta');
        return;
      }
    }

    const nuevaPregunta = {
      id: Date.now(),
      pregunta: preguntaForm.pregunta.trim(),
      tipo_pregunta: preguntaForm.tipo_pregunta,
      puntos: preguntaForm.puntos,
      orden: preguntas.length,
      opciones: preguntaForm.tipo_pregunta === 'opcion_multiple' ? [...opciones] : []
    };

    setPreguntas([...preguntas, nuevaPregunta]);
    setPreguntaForm({
      pregunta: '',
      tipo_pregunta: 'opcion_multiple',
      puntos: 1,
      orden: 0
    });
    setOpciones([
      { texto_opcion: '', es_correcta: false, orden: 0 },
      { texto_opcion: '', es_correcta: false, orden: 1 }
    ]);
    setShowPreguntaForm(false);
    notifyChange();
  };

  const handleEliminarPregunta = (index) => {
    const nuevasPreguntas = preguntas.filter((_, i) => i !== index);
    setPreguntas(nuevasPreguntas);
    notifyChange();
  };

  // Marcar como inicializado después del primer render
  React.useEffect(() => {
    setIsInitialized(true);
  }, []);

  // Notificar cambios cuando cambian las preguntas o formData, solo después de inicializar
  React.useEffect(() => {
    if (isInitialized) {
      notifyChange();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preguntas, formData, isInitialized]);

  return (
    <div className="examen-form-container">
      <div className="examen-form-header">
        <h4>📝 Examen del Módulo</h4>
        <p className="examen-form-description">
          Agrega un examen opcional para evaluar el conocimiento del módulo.
        </p>
      </div>

      <div className="examen-form-fields">
        <div className="form-group">
          <label>Título del Examen</label>
          <input
            type="text"
            name="titulo"
            value={formData.titulo}
            onChange={handleChange}
            placeholder="Ej: Examen de Evaluación - Módulo 1"
          />
        </div>

        <div className="form-group">
          <label>Descripción</label>
          <textarea
            name="descripcion"
            value={formData.descripcion}
            onChange={handleChange}
            rows="2"
            placeholder="Describe el examen..."
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Tiempo Límite (minutos)</label>
            <input
              type="number"
              name="tiempo_limite_minutos"
              value={formData.tiempo_limite_minutos}
              onChange={handleChange}
              min="1"
              placeholder="Sin límite"
            />
          </div>

          <div className="form-group">
            <label>Intentos Permitidos</label>
            <input
              type="number"
              name="intentos_permitidos"
              value={formData.intentos_permitidos}
              onChange={handleChange}
              min="1"
            />
          </div>

          <div className="form-group">
            <label>% Aprobación</label>
            <input
              type="number"
              name="porcentaje_aprobacion"
              value={formData.porcentaje_aprobacion}
              onChange={handleChange}
              min="0"
              max="100"
            />
          </div>
        </div>
      </div>

      <div className="preguntas-section">
        <div className="preguntas-header">
          <label>Preguntas del Examen</label>
          <button
            type="button"
            onClick={() => setShowPreguntaForm(!showPreguntaForm)}
            className="btn btn-secondary btn-sm"
          >
            {showPreguntaForm ? '✕ Cancelar' : '➕ Agregar Pregunta'}
          </button>
        </div>

        {showPreguntaForm && (
          <div className="pregunta-form">
            <div className="form-group">
              <label>Pregunta *</label>
              <textarea
                name="pregunta"
                value={preguntaForm.pregunta}
                onChange={handlePreguntaChange}
                rows="2"
                placeholder="Escribe la pregunta..."
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Tipo de Pregunta *</label>
                <select
                  name="tipo_pregunta"
                  value={preguntaForm.tipo_pregunta}
                  onChange={handlePreguntaChange}
                  required
                >
                  <option value="opcion_multiple">Opción Múltiple</option>
                  <option value="texto_libre">Texto Libre</option>
                </select>
              </div>

              <div className="form-group">
                <label>Puntos</label>
                <input
                  type="number"
                  name="puntos"
                  value={preguntaForm.puntos}
                  onChange={handlePreguntaChange}
                  min="0.5"
                  step="0.5"
                />
              </div>
            </div>

            {preguntaForm.tipo_pregunta === 'opcion_multiple' && (
              <div className="opciones-section">
                <label>Opciones de Respuesta *</label>
                {opciones.map((opcion, index) => (
                  <div key={index} className="opcion-item">
                    <input
                      type="text"
                      value={opcion.texto_opcion}
                      onChange={(e) => handleOpcionChange(index, 'texto_opcion', e.target.value)}
                      placeholder={`Opción ${index + 1}`}
                      required
                    />
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={opcion.es_correcta}
                        onChange={(e) => handleOpcionChange(index, 'es_correcta', e.target.checked)}
                      />
                      Correcta
                    </label>
                    {opciones.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removeOpcion(index)}
                        className="btn-remove-opcion"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addOpcion}
                  className="btn btn-secondary btn-sm"
                >
                  ➕ Agregar Opción
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={handleAgregarPregunta}
              className="btn btn-primary"
            >
              Agregar Pregunta
            </button>
          </div>
        )}

        {preguntas.length > 0 ? (
          <div className="preguntas-list">
            {preguntas.map((pregunta, index) => (
              <div key={pregunta.id} className="pregunta-card">
                <div className="pregunta-card-header">
                  <span className="pregunta-number">Pregunta {index + 1}</span>
                  <button
                    type="button"
                    onClick={() => handleEliminarPregunta(index)}
                    className="btn-remove-pregunta"
                  >
                    ✕
                  </button>
                </div>
                <div className="pregunta-content">
                  <p><strong>{pregunta.pregunta}</strong></p>
                  <div className="pregunta-meta">
                    <span className="badge-tipo">{pregunta.tipo_pregunta === 'opcion_multiple' ? 'Opción Múltiple' : 'Texto Libre'}</span>
                    <span className="badge-puntos">{pregunta.puntos} puntos</span>
                  </div>
                  {pregunta.tipo_pregunta === 'opcion_multiple' && pregunta.opciones && pregunta.opciones.length > 0 && (
                    <div className="pregunta-opciones">
                      {pregunta.opciones.map((opcion, opIndex) => (
                        <div key={opIndex} className={`opcion-display ${opcion.es_correcta ? 'correcta' : ''}`}>
                          {opcion.texto_opcion}
                          {opcion.es_correcta && <span className="badge-correcta">✓ Correcta</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p>No hay preguntas agregadas. Haz clic en "Agregar Pregunta" para comenzar.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExamenForm;

