import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './EditarExamen.css';

const EditarExamen = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [examen, setExamen] = useState(null);
  const [preguntas, setPreguntas] = useState([]);
  const [showPreguntaForm, setShowPreguntaForm] = useState(false);
  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    tiempo_limite_minutos: '',
    intentos_permitidos: 1,
    porcentaje_aprobacion: 70,
    activo: true
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

  useEffect(() => {
    fetchExamen();
  }, [id]);

  const fetchExamen = useCallback(async () => {
    try {
      const response = await axios.get(`/api/examenes/${id}`);
      const examenData = response.data;
      setExamen(examenData);
      setPreguntas(examenData.preguntas || []);
      setFormData({
        titulo: examenData.titulo || '',
        descripcion: examenData.descripcion || '',
        tiempo_limite_minutos: examenData.tiempo_limite_minutos || '',
        intentos_permitidos: examenData.intentos_permitidos || 1,
        porcentaje_aprobacion: examenData.porcentaje_aprobacion || 70,
        activo: examenData.activo !== undefined ? examenData.activo : true
      });
    } catch (error) {
      console.error('Error al obtener examen:', error);
      alert('Error al cargar el examen');
      navigate('/cursos');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    fetchExamen();
  }, [fetchExamen]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (name === 'tiempo_limite_minutos' || name === 'intentos_permitidos' || name === 'porcentaje_aprobacion'
        ? (value === '' ? '' : parseInt(value))
        : value)
    }));
  };

  const handlePreguntaChange = (e) => {
    const { name, value } = e.target;
    setPreguntaForm(prev => ({
      ...prev,
      [name]: name === 'puntos' || name === 'orden' ? parseFloat(value) : value
    }));
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      await axios.put(`/api/examenes/${id}`, formData);
      alert('Examen actualizado exitosamente');
      fetchExamen();
    } catch (error) {
      console.error('Error al actualizar examen:', error);
      alert(error.response?.data?.error || 'Error al actualizar el examen');
    } finally {
      setSaving(false);
    }
  };

  const handleCrearPregunta = async (e) => {
    e.preventDefault();
    
    if (preguntaForm.tipo_pregunta === 'opcion_multiple' && opciones.filter(o => o.es_correcta).length === 0) {
      alert('Debe seleccionar al menos una opción correcta');
      return;
    }

    try {
      const preguntaResponse = await axios.post(`/api/examenes/${id}/preguntas`, preguntaForm);
      const preguntaId = preguntaResponse.data.preguntaId;

      if (preguntaForm.tipo_pregunta === 'opcion_multiple' && opciones.length > 0) {
        await axios.post(`/api/examenes/preguntas/${preguntaId}/opciones`, {
          opciones: opciones.filter(o => o.texto_opcion.trim() !== '')
        });
      }

      alert('Pregunta creada exitosamente');
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
      fetchExamen();
    } catch (error) {
      console.error('Error al crear pregunta:', error);
      alert(error.response?.data?.error || 'Error al crear la pregunta');
    }
  };

  const handleEliminarPregunta = async (preguntaId) => {
    if (!window.confirm('¿Estás seguro de eliminar esta pregunta?')) {
      return;
    }

    try {
      await axios.delete(`/api/examenes/preguntas/${preguntaId}`);
      fetchExamen();
    } catch (error) {
      console.error('Error al eliminar pregunta:', error);
      alert('Error al eliminar la pregunta');
    }
  };

  if (loading) {
    return <div className="loading">Cargando...</div>;
  }

  return (
    <div className="container">
      <div className="form-header">
        <h1>✏️ Editar Examen: {examen?.titulo}</h1>
        <button onClick={() => navigate(`/cursos/editar/${examen?.curso_id}`)} className="btn btn-secondary">
          Volver al Curso
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
          />
        </div>

        <div className="form-group">
          <label>Descripción</label>
          <textarea
            name="descripcion"
            value={formData.descripcion}
            onChange={handleChange}
            rows="3"
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

          <div className="form-group">
            <label>
              <input
                type="checkbox"
                name="activo"
                checked={formData.activo}
                onChange={handleChange}
              />
              {' '}Activo
            </label>
          </div>
        </div>

        <div className="form-actions">
          <button
            type="button"
            onClick={() => navigate(`/cursos/editar/${examen?.curso_id}`)}
            className="btn btn-secondary"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={saving}
          >
            {saving ? 'Guardando...' : 'Guardar Cambios'}
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
          <form onSubmit={handleCrearPregunta} className="pregunta-form">
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
                <label>Tipo de Pregunta</label>
                <select
                  name="tipo_pregunta"
                  value={preguntaForm.tipo_pregunta}
                  onChange={handlePreguntaChange}
                >
                  <option value="opcion_multiple">Opción Múltiple</option>
                  <option value="verdadero_falso">Verdadero/Falso</option>
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
                  min="0"
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
                >
                  Agregar Opción
                </button>
              </div>
            )}

            <button type="submit" className="btn btn-primary">
              Crear Pregunta
            </button>
          </form>
        )}

        {preguntas.length === 0 ? (
          <div className="empty-state">
            <p>No hay preguntas en este examen. Agrega la primera pregunta.</p>
          </div>
        ) : (
          <div className="preguntas-list">
            {preguntas.map((pregunta, index) => (
              <div key={pregunta.id} className="pregunta-card">
                <div className="pregunta-header">
                  <h3>Pregunta {index + 1} ({pregunta.puntos} puntos)</h3>
                  <button
                    onClick={() => handleEliminarPregunta(pregunta.id)}
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
                        key={opcion.id}
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

export default EditarExamen;

