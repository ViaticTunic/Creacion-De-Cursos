// Componente para que un estudiante resuelva un examen
// Muestra las preguntas, permite responderlas, calcula el puntaje y muestra los resultados
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import './ResolverExamen.css';

const ResolverExamen = () => {
  // Obtenemos el ID del examen de la URL (ej: /examenes/resolver/5)
  const { id } = useParams();
  
  // Función para navegar a otras páginas
  const navigate = useNavigate();
  
  // Indica si estamos cargando el examen del servidor
  const [loading, setLoading] = useState(true);
  
  // Guarda toda la información del examen (preguntas, opciones, etc.)
  const [examen, setExamen] = useState(null);
  
  // Guarda las respuestas del estudiante
  // Es un objeto donde la clave es el ID de la pregunta y el valor es la respuesta
  // Ejemplo: { 1: "opcion_3", 2: "Mi respuesta de texto libre" }
  const [respuestas, setRespuestas] = useState({});
  
  // Tiempo restante en segundos (si el examen tiene tiempo límite)
  const [tiempoRestante, setTiempoRestante] = useState(null);
  
  // Indica si el estudiante ya envió el examen
  const [examenEnviado, setExamenEnviado] = useState(false);
  
  // Guarda el resultado del examen (puntaje, si aprobó, etc.)
  const [resultado, setResultado] = useState(null);

  useEffect(() => {
    fetchExamen();
  }, [id]);

  // Función para calcular cuántos puntos obtuvo el estudiante
  const calcularPuntaje = () => {
    // Si no hay examen o preguntas, devolvemos 0 puntos
    if (!examen || !examen.preguntas) return { total: 0, obtenido: 0 };

    let totalPuntos = 0; // Suma de todos los puntos posibles
    let puntosObtenidos = 0; // Puntos que obtuvo el estudiante

    // Recorremos cada pregunta del examen
    examen.preguntas.forEach((pregunta) => {
      // Sumamos los puntos de esta pregunta al total
      totalPuntos += parseFloat(pregunta.puntos) || 1;
      
      // Obtenemos la respuesta que dio el estudiante para esta pregunta
      const respuesta = respuestas[pregunta.id];

      // Si es una pregunta de opción múltiple
      if (pregunta.tipo_pregunta === 'opcion_multiple') {
        // Buscamos la opción que seleccionó el estudiante
        const opcionSeleccionada = pregunta.opciones.find(
          (op) => op.id === parseInt(respuesta)
        );
        // Si la opción seleccionada es la correcta, le damos los puntos
        if (opcionSeleccionada && opcionSeleccionada.es_correcta) {
          puntosObtenidos += parseFloat(pregunta.puntos) || 1;
        }
      } else if (pregunta.tipo_pregunta === 'texto_libre') {
        // Para preguntas de texto libre, normalmente un profesor las revisa manualmente
        // Por ahora, solo damos puntos si el estudiante escribió algo
        if (respuesta && respuesta.trim() !== '') {
          puntosObtenidos += parseFloat(pregunta.puntos) || 1;
        }
      }
    });

    // Devolvemos el total de puntos y los puntos obtenidos
    return { total: totalPuntos, obtenido: puntosObtenidos };
  };

  useEffect(() => {
    if (examen && examen.tiempo_limite_minutos && !examenEnviado) {
      const tiempoTotal = examen.tiempo_limite_minutos * 60; // Convertir a segundos
      setTiempoRestante(tiempoTotal);

      const interval = setInterval(() => {
        setTiempoRestante((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            // Enviar examen automáticamente cuando se acabe el tiempo
            setExamenEnviado(true);
            const { total, obtenido } = calcularPuntaje();
            const porcentaje = total > 0 ? (obtenido / total) * 100 : 0;
            const aprobado = porcentaje >= examen.porcentaje_aprobacion;
            setResultado({
              total,
              obtenido,
              porcentaje: porcentaje.toFixed(2),
              aprobado
            });
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [examen, examenEnviado, respuestas]);

  const fetchExamen = async () => {
    try {
      const response = await axios.get(`/api/examenes/${id}`);
      setExamen(response.data);
      // Inicializar respuestas vacías
      const respuestasIniciales = {};
      response.data.preguntas.forEach((pregunta) => {
        if (pregunta.tipo_pregunta === 'opcion_multiple') {
          respuestasIniciales[pregunta.id] = null;
        } else {
          respuestasIniciales[pregunta.id] = '';
        }
      });
      setRespuestas(respuestasIniciales);
    } catch (error) {
      console.error('Error al obtener examen:', error);
      alert('Error al cargar el examen');
      navigate(-1);
    } finally {
      setLoading(false);
    }
  };

  const handleRespuestaCambio = (preguntaId, valor) => {
    setRespuestas((prev) => ({
      ...prev,
      [preguntaId]: valor
    }));
  };

  const handleEnviarExamen = () => {
    if (examenEnviado) return;

    // Validar que todas las preguntas tengan respuesta
    const preguntasSinRespuesta = examen.preguntas.filter((pregunta) => {
      const respuesta = respuestas[pregunta.id];
      if (pregunta.tipo_pregunta === 'opcion_multiple') {
        return respuesta === null || respuesta === undefined;
      } else {
        return !respuesta || respuesta.trim() === '';
      }
    });

    if (preguntasSinRespuesta.length > 0) {
      const confirmar = window.confirm(
        `Tienes ${preguntasSinRespuesta.length} pregunta(s) sin responder. ¿Deseas enviar el examen de todas formas?`
      );
      if (!confirmar) return;
    }

    setExamenEnviado(true);
    const { total, obtenido } = calcularPuntaje();
    const porcentaje = (obtenido / total) * 100;
    const aprobado = porcentaje >= examen.porcentaje_aprobacion;

    setResultado({
      total,
      obtenido,
      porcentaje: porcentaje.toFixed(2),
      aprobado
    });
  };

  const formatearTiempo = (segundos) => {
    const minutos = Math.floor(segundos / 60);
    const segs = segundos % 60;
    return `${minutos.toString().padStart(2, '0')}:${segs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return <div className="loading">Cargando examen...</div>;
  }

  if (!examen) {
    return <div className="error">Examen no encontrado</div>;
  }

  return (
    <div className="container">
      <div className="resolver-examen-header">
        <button onClick={() => navigate(-1)} className="btn btn-secondary">
          ← Volver
        </button>
        {tiempoRestante !== null && !examenEnviado && (
          <div className="tiempo-restante">
            ⏱️ Tiempo restante: {formatearTiempo(tiempoRestante)}
          </div>
        )}
      </div>

      <div className="examen-container">
        <div className="examen-header">
          <h1>{examen.titulo}</h1>
          {examen.descripcion && <p className="examen-descripcion">{examen.descripcion}</p>}
          <div className="examen-metadata">
            {examen.tiempo_limite_minutos && (
              <span>⏱️ Tiempo límite: {examen.tiempo_limite_minutos} minutos</span>
            )}
            <span>📝 Preguntas: {examen.preguntas?.length || 0}</span>
            <span>✅ Aprobación: {examen.porcentaje_aprobacion}%</span>
          </div>
        </div>

        {examenEnviado && resultado ? (
          <div className="resultado-examen">
            <div className={`resultado-card ${resultado.aprobado ? 'aprobado' : 'reprobado'}`}>
              <h2>{resultado.aprobado ? '✅ ¡Felicidades! Aprobaste' : '❌ No aprobaste'}</h2>
              <div className="resultado-stats">
                <div className="stat-item">
                  <span className="stat-label">Puntos obtenidos:</span>
                  <span className="stat-value">{resultado.obtenido} / {resultado.total}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Porcentaje:</span>
                  <span className="stat-value">{resultado.porcentaje}%</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Estado:</span>
                  <span className={`stat-value ${resultado.aprobado ? 'aprobado' : 'reprobado'}`}>
                    {resultado.aprobado ? 'Aprobado' : 'Reprobado'}
                  </span>
                </div>
              </div>
              <div className="resultado-actions">
                <button onClick={() => navigate(-1)} className="btn btn-primary">
                  Volver al Curso
                </button>
              </div>
            </div>

            {/* Mostrar respuestas correctas */}
            <div className="respuestas-detalle">
              <h3>📋 Detalle de Respuestas</h3>
              {examen.preguntas.map((pregunta, index) => {
                const respuesta = respuestas[pregunta.id];
                let esCorrecta = false;
                let respuestaCorrecta = '';

                if (pregunta.tipo_pregunta === 'opcion_multiple') {
                  const opcionSeleccionada = pregunta.opciones.find(
                    (op) => op.id === parseInt(respuesta)
                  );
                  const opcionCorrecta = pregunta.opciones.find((op) => op.es_correcta);
                  esCorrecta = opcionSeleccionada?.es_correcta || false;
                  respuestaCorrecta = opcionCorrecta?.texto_opcion || '';
                }

                return (
                  <div
                    key={pregunta.id}
                    className={`pregunta-resultado ${esCorrecta ? 'correcta' : 'incorrecta'}`}
                  >
                    <div className="pregunta-resultado-header">
                      <span className="pregunta-numero">Pregunta {index + 1}</span>
                      <span className={`resultado-badge ${esCorrecta ? 'correcta' : 'incorrecta'}`}>
                        {esCorrecta ? '✓ Correcta' : '✗ Incorrecta'}
                      </span>
                    </div>
                    <p className="pregunta-texto">{pregunta.pregunta}</p>
                    {pregunta.tipo_pregunta === 'opcion_multiple' && (
                      <div className="respuestas-comparacion">
                        <div className="respuesta-item">
                          <strong>Tu respuesta:</strong>
                          <p>
                            {pregunta.opciones.find((op) => op.id === parseInt(respuesta))?.texto_opcion ||
                              'Sin respuesta'}
                          </p>
                        </div>
                        {!esCorrecta && (
                          <div className="respuesta-item correcta">
                            <strong>Respuesta correcta:</strong>
                            <p>{respuestaCorrecta}</p>
                          </div>
                        )}
                      </div>
                    )}
                    {pregunta.tipo_pregunta === 'texto_libre' && (
                      <div className="respuesta-item">
                        <strong>Tu respuesta:</strong>
                        <p>{respuesta || 'Sin respuesta'}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleEnviarExamen();
            }}
            className="examen-form"
          >
            {examen.preguntas && examen.preguntas.length > 0 ? (
              examen.preguntas.map((pregunta, index) => (
                <div key={pregunta.id} className="pregunta-card">
                  <div className="pregunta-header">
                    <span className="pregunta-numero">Pregunta {index + 1}</span>
                    <span className="pregunta-puntos">{pregunta.puntos} puntos</span>
                  </div>
                  <p className="pregunta-texto">{pregunta.pregunta}</p>

                  {pregunta.tipo_pregunta === 'opcion_multiple' && (
                    <div className="opciones-respuesta">
                      {pregunta.opciones && pregunta.opciones.length > 0 ? (
                        pregunta.opciones.map((opcion) => (
                          <label key={opcion.id} className="opcion-label">
                            <input
                              type="radio"
                              name={`pregunta-${pregunta.id}`}
                              value={opcion.id}
                              checked={respuestas[pregunta.id] === opcion.id.toString()}
                              onChange={(e) =>
                                handleRespuestaCambio(pregunta.id, e.target.value)
                              }
                            />
                            <span>{opcion.texto_opcion}</span>
                          </label>
                        ))
                      ) : (
                        <p className="sin-opciones">No hay opciones disponibles</p>
                      )}
                    </div>
                  )}

                  {pregunta.tipo_pregunta === 'texto_libre' && (
                    <div className="respuesta-texto">
                      <textarea
                        value={respuestas[pregunta.id] || ''}
                        onChange={(e) => handleRespuestaCambio(pregunta.id, e.target.value)}
                        placeholder="Escribe tu respuesta aquí..."
                        rows="4"
                        required
                      />
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="sin-preguntas">
                <p>Este examen no tiene preguntas.</p>
              </div>
            )}

            <div className="examen-actions">
              <button type="submit" className="btn btn-primary btn-large">
                📤 Enviar Examen
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ResolverExamen;

