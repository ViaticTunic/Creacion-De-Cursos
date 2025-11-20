import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import BadgeDisplay from '../components/BadgeDisplay';
import { getImageUrl, getContentUrl } from '../utils/api';
import './VerCurso.css';

const VerCurso = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [curso, setCurso] = useState(null);
  const [expandedModulo, setExpandedModulo] = useState(null);

  useEffect(() => {
    fetchCurso();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Función para traer la información del curso del servidor
  const fetchCurso = async () => {
    try {
      // Pedimos al servidor la información del curso usando su ID
      const response = await axios.get(`/api/cursos/${id}`);
      // Guardamos la información del curso
      setCurso(response.data);
      // Por defecto, expandimos el primer módulo para que el usuario vea contenido inmediatamente
      if (response.data.modulos && response.data.modulos.length > 0) {
        setExpandedModulo(response.data.modulos[0].id);
      }
    } catch (error) {
      // Si algo sale mal, mostramos un error y volvemos al dashboard
      console.error('Error al obtener curso:', error);
      alert('Error al cargar el curso');
      navigate('/dashboard');
    } finally {
      // Sin importar si salió bien o mal, dejamos de mostrar "Cargando..."
      setLoading(false);
    }
  };


  if (loading) {
    return <div className="loading">Cargando...</div>;
  }

  if (!curso) {
    return <div className="error">Curso no encontrado</div>;
  }

  return (
    <div className="container">
      <div className="ver-curso-header">
        <button onClick={() => navigate('/dashboard')} className="btn btn-secondary">
          ← Volver al Dashboard
        </button>
        <Link to={`/cursos/editar/${id}`} className="btn btn-primary">
          ✏️ Editar Curso
        </Link>
      </div>

      <div className="curso-hero">
        {curso.imagen_portada && (
          <div className="curso-hero-image">
            <img src={getImageUrl(curso.imagen_portada)} alt={curso.titulo} />
          </div>
        )}
        <div className="curso-hero-content">
          <div className="curso-hero-header">
            <h1>{curso.titulo}</h1>
            <span className={`badge badge-${curso.estado}`}>
              {curso.estado}
            </span>
          </div>
          {curso.descripcion && (
            <p className="curso-hero-descripcion">{curso.descripcion}</p>
          )}
          <div className="curso-hero-info">
            <div className="info-item">
              <span className="info-label">📚 Categoría:</span>
              <span className="info-value">{curso.categoria_nombre || 'Sin categoría'}</span>
            </div>
            <div className="info-item">
              <span className="info-label">📊 Nivel:</span>
              <span className="info-value">{curso.nivel}</span>
            </div>
            <div className="info-item">
              <span className="info-label">⏱️ Duración:</span>
              <span className="info-value">{curso.duracion_horas} horas</span>
            </div>
            <div className="info-item">
              <span className="info-label">💰 Precio:</span>
              <span className="info-value">${curso.precio}</span>
            </div>
            <div className="info-item">
              <span className="info-label">🌐 Idioma:</span>
              <span className="info-value">{curso.idioma}</span>
            </div>
          </div>
          {curso.insignias && curso.insignias.length > 0 && (
            <div className="curso-hero-insignias">
              <span className="info-label">🏆 Insignias disponibles:</span>
              <BadgeDisplay insignias={curso.insignias} size="medium" />
            </div>
          )}
        </div>
      </div>

      <div className="modulos-section">
        <h2>📚 Módulos del Curso</h2>
        {!curso.modulos || curso.modulos.length === 0 ? (
          <div className="empty-modulos">
            <div style={{fontSize: '64px', marginBottom: '20px'}}>📦</div>
            <p>Este curso aún no tiene módulos.</p>
          </div>
        ) : (
          <div className="modulos-list">
            {curso.modulos.map((modulo, index) => (
              <div key={modulo.id} className={`modulo-card-view ${expandedModulo === modulo.id ? 'expanded' : ''}`}>
                <div 
                  className="modulo-card-header-view" 
                  onClick={() => setExpandedModulo(expandedModulo === modulo.id ? null : modulo.id)}
                >
                  <div className="modulo-header-content">
                    <div className="modulo-number">Módulo {index + 1}</div>
                    <h3>{modulo.titulo || 'Sin título'}</h3>
                  </div>
                  <div className="modulo-header-actions">
                    {modulo.lecciones && modulo.lecciones.length > 0 && (
                      <span className="modulo-lecciones-count">
                        {modulo.lecciones.length} {modulo.lecciones.length === 1 ? 'lección' : 'lecciones'}
                      </span>
                    )}
                    {modulo.examen && (
                      <span className="modulo-examen-badge">📝 Examen</span>
                    )}
                    <span className="expand-icon">
                      {expandedModulo === modulo.id ? '▼' : '▶'}
                    </span>
                  </div>
                </div>

                {expandedModulo === modulo.id && (
                  <div className="modulo-card-content-view">
                    {modulo.descripcion && (
                      <p className="modulo-descripcion">{modulo.descripcion}</p>
                    )}

                    {modulo.lecciones && modulo.lecciones.length > 0 ? (
                      <div className="lecciones-section">
                        <h4>📖 Contenido del Módulo</h4>
                        <div className="lecciones-list">
                          {modulo.lecciones.map((leccion, lecIndex) => (
                            <div key={leccion.id} className="leccion-item">
                              <div className="leccion-header">
                                <span className="leccion-number">Lección {lecIndex + 1}</span>
                                <h5>{leccion.titulo}</h5>
                              </div>
                              {leccion.descripcion && (
                                <p className="leccion-descripcion">{leccion.descripcion}</p>
                              )}
                              <div className="leccion-content">
                                {leccion.tipo_contenido === 'video' ? (
                                  <div className="leccion-video">
                                    <a 
                                      href={leccion.url_contenido} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="btn btn-primary"
                                    >
                                      ▶️ Ver Video
                                    </a>
                                    <p className="leccion-url">{leccion.url_contenido}</p>
                                  </div>
                                ) : (
                                  <div className="leccion-archivo">
                                    <a 
                                      href={getContentUrl(leccion.url_contenido)} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="btn btn-secondary"
                                    >
                                      📄 {leccion.tipo_contenido === 'pdf' ? 'Ver PDF' : 'Descargar Documento'}
                                    </a>
                                    <p className="leccion-url">
                                      {leccion.url_contenido.split('/').pop()}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="empty-lecciones">
                        <p>Este módulo no tiene contenido aún.</p>
                      </div>
                    )}

                    {modulo.examen && (
                      <div className="examen-section-view">
                        <h4>📝 Examen del Módulo</h4>
                        <div className="examen-info">
                          <p><strong>Título:</strong> {modulo.examen.titulo}</p>
                          {modulo.examen.descripcion && (
                            <p><strong>Descripción:</strong> {modulo.examen.descripcion}</p>
                          )}
                          {modulo.examen.tiempo_limite_minutos && (
                            <p><strong>Tiempo límite:</strong> {modulo.examen.tiempo_limite_minutos} minutos</p>
                          )}
                          <p><strong>Intentos permitidos:</strong> {modulo.examen.intentos_permitidos}</p>
                          <p><strong>Porcentaje de aprobación:</strong> {modulo.examen.porcentaje_aprobacion}%</p>
                          {modulo.examen.preguntas && modulo.examen.preguntas.length > 0 && (
                            <p><strong>Preguntas:</strong> {modulo.examen.preguntas.length}</p>
                          )}
                        </div>
                        <div className="examen-actions">
                          <Link 
                            to={`/examenes/resolver/${modulo.examen.id}`}
                            className="btn btn-primary"
                          >
                            📝 Resolver Examen
                          </Link>
                        </div>
                      </div>
                    )}
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

export default VerCurso;

