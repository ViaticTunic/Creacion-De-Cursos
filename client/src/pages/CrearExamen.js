import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './CrearExamen.css';

const CrearExamen = () => {
  const { cursoId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [modulos, setModulos] = useState([]);
  const [preguntas, setPreguntas] = useState([]);
  const [showPreguntaForm, setShowPreguntaForm] = useState(false);
  const [formData, setFormData] = useState({
    curso_id: cursoId,
    modulo_id: '',
    titulo: '',
    descripcion: '',
    tiempo_limite_minutos: '',
    intentos_permitidos: 1,
    porcentaje_aprobacion: 70
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

  const fetchModulos = useCallback(async () => {
    try {
      const response = await axios.get(`/api/cursos/${cursoId}`);
      setModulos(response.data.modulos || []);
    } catch (error) {
      console.error('Error al obtener módulos:', error);
    }
  }, [cursoId]);

  useEffect(() => {
    fetchModulos();
  }, [fetchModulos]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'tiempo_limite_minutos' || name === 'intentos_permitidos' || name === 'porcentaje_aprobacion' || name === 'modulo_id'
        ? (value === '' ? '' : parseInt(value))
        : value
    }));
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
      const opcionesValidas = opciones.filter(o => o.texto_opcion.trim() !== '');
      if (opcionesValidas.length < 2) {
        alert('Debe agregar al menos 2 opciones de respuesta');
        return;
      }
      if (opcionesValidas.filter(o => o.es_correcta).length === 0) {
        alert('Debe seleccionar al menos una opción correcta');
        return;
      }
    }

    const nuevaPregunta = {
      id: Date.now(), // ID temporal para la lista
      pregunta: preguntaForm.pregunta.trim(),
      tipo_pregunta: preguntaForm.tipo_pregunta,
      puntos: parseFloat(preguntaForm.puntos) || 1,
      orden: preguntas.length,
      opciones: preguntaForm.tipo_pregunta === 'opcion_multiple' 
        ? opciones.filter(o => o.texto_opcion.trim() !== '').map((o, idx) => ({
            ...o,
            orden: idx
          }))
        : []
    };

    setPreguntas([...preguntas, nuevaPregunta]);
    setShowPreguntaForm(false);
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
  };

  const handleEliminarPregunta = (index) => {
    if (window.confirm('¿Estás seguro de eliminar esta pregunta?')) {
      setPreguntas(preguntas.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (preguntas.length === 0) {
      alert('Debe agregar al menos una pregunta al examen');
      return;
    }

    setLoading(true);

    try {
      // Crear el examen
      const response = await axios.post('/api/examenes', formData);
      const examenId = response.data.examenId;

      // Crear todas las preguntas con sus opciones
      for (const pregunta of preguntas) {
        const preguntaResponse = await axios.post(`/api/examenes/${examenId}/preguntas`, {
          pregunta: pregunta.pregunta,
          tipo_pregunta: pregunta.tipo_pregunta,
          puntos: pregunta.puntos,
          orden: pregunta.orden
        });
        const preguntaId = preguntaResponse.data.preguntaId;

        // Si es opción múltiple, crear las opciones
        if (pregunta.tipo_pregunta === 'opcion_multiple' && pregunta.opciones.length > 0) {
          await axios.post(`/api/examenes/preguntas/${preguntaId}/opciones`, {
            opciones: pregunta.opciones
          });
        }
      }

      alert('Examen creado exitosamente con ' + preguntas.length + ' pregunta(s)');
      navigate(`/examenes/editar/${examenId}`);
    } catch (error) {
      console.error('Error al crear examen:', error);
      alert(error.response?.data?.error || 'Error al crear el examen');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="form-header">
        <h1>📝 Crear Nuevo Examen</h1>
        <button onClick={() => navigate(`/cursos/editar/${cursoId}`)} className="btn btn-secondary">
          Cancelar
        </button>
      </div>

      <form onSubmit={handleSubmit} className="examen-form">
        <div className="form-group">
          <label>Título del Examen *</label>
          <input
            type="text"
            name="titulo"
            value={formData.titulo}
            onChange={handleChange}
            required
            placeholder="Ej: Examen Final - Módulo 1"
          />
        </div>

        <div className="form-group">
          <label>Descripción</label>
          <textarea
            name="descripcion"
            value={formData.descripcion}
            onChange={handleChange}
            rows="3"
            placeholder="Describe el contenido del examen..."
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Módulo (Opcional)</label>
            <select
              name="modulo_id"
              value={formData.modulo_id}
              onChange={handleChange}
            >
              <option value="">Sin módulo específico</option>
              {modulos.map(modulo => (
                <option key={modulo.id} value={modulo.id}>
                  {modulo.titulo}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Tiempo Límite (minutos)</label>
            <input
              type="number"
              name="tiempo_limite_minutos"
              value={formData.tiempo_limite_minutos}
              onChange={handleChange}
              min="1"
              placeholder="Opcional"
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
            <label>Porcentaje de Aprobación (%)</label>
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

        <div className="form-actions">
          <button
            type="button"
            onClick={() => navigate(`/cursos/editar/${cursoId}`)}
            className="btn btn-secondary"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? 'Creando...' : 'Crear Examen'}
          </button>
        </div>
      </form>

      <div className="preguntas-section">
        <div className="preguntas-header">
          <h2>❓ Preguntas ({preguntas.length})</h2>
          <button
            onClick={() => setShowPreguntaForm(!showPreguntaForm)}
            className="btn btn-primary"
          >
            {showPreguntaForm ? 'Cancelar' : 'Agregar Pregunta'}
          </button>
        </div>

        {showPreguntaForm && (
          <form onSubmit={handleAgregarPregunta} className="pregunta-form">
            <div className="form-group">
              <label>Pregunta *</label>
              <textarea
                name="pregunta"
                value={preguntaForm.pregunta}
                onChange={handlePreguntaChange}
                required
                rows="3"
                placeholder="Escribe la pregunta aquí..."
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
                  <option value="texto_libre">Respuesta Abierta</option>
                </select>
              </div>

              <div className="form-group">
                <label>Puntos *</label>
                <input
                  type="number"
                  name="puntos"
                  value={preguntaForm.puntos}
                  onChange={handlePreguntaChange}
                  min="0"
                  step="0.5"
                  required
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
                    <label>
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
                        className="btn btn-danger btn-sm"
                      >
                        Eliminar
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addOpcion}
                  className="btn btn-secondary btn-sm"
                  style={{ marginTop: '10px' }}
                >
                  Agregar Opción
                </button>
              </div>
            )}

            {preguntaForm.tipo_pregunta === 'texto_libre' && (
              <div className="info-box">
                <p>💡 Esta pregunta permitirá respuestas abiertas que deberán ser revisadas manualmente.</p>
              </div>
            )}

            <div style={{ marginTop: '30px', paddingTop: '20px', borderTop: '2px solid #e2e8f0' }}>
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                Agregar Pregunta
              </button>
            </div>
          </form>
        )}

        {preguntas.length === 0 ? (
          <div className="empty-state">
            <p>No hay preguntas en este examen. Agrega al menos una pregunta antes de crear el examen.</p>
          </div>
        ) : (
          <div className="preguntas-list">
            {preguntas.map((pregunta, index) => (
              <div key={pregunta.id} className="pregunta-card">
                <div className="pregunta-header">
                  <h3>Pregunta {index + 1} ({pregunta.puntos} puntos) - {pregunta.tipo_pregunta === 'opcion_multiple' ? 'Opción Múltiple' : 'Respuesta Abierta'}</h3>
                  <button
                    onClick={() => handleEliminarPregunta(index)}
                    className="btn btn-danger btn-sm"
                  >
                    Eliminar
                  </button>
                </div>
                <p className="pregunta-texto">{pregunta.pregunta}</p>
                {pregunta.opciones && pregunta.opciones.length > 0 && (
                  <div className="opciones-list">
                    {pregunta.opciones.map((opcion, opIndex) => (
                      <div
                        key={opIndex}
                        className={`opcion-item ${opcion.es_correcta ? 'correcta' : ''}`}
                      >
                        {opcion.texto_opcion}
                        {opcion.es_correcta && <span className="badge-correcta">✓ Correcta</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CrearExamen;

