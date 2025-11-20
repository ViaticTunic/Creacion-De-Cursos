// Este componente se encarga de gestionar los módulos de un curso
// Un módulo puede tener contenido (videos, PDFs, Word) y un examen opcional
import React, { useState } from 'react';
import ExamenForm from './ExamenForm'; // Componente para crear/editar exámenes
import './ModuloManager.css';

// Recibe dos props (propiedades):
// - modulos: la lista de módulos actuales
// - onModulosChange: función para actualizar la lista de módulos cuando cambian
const ModuloManager = ({ modulos, onModulosChange }) => {
  // Guardamos qué módulo está expandido (para mostrar/ocultar su contenido)
  const [expandedModulo, setExpandedModulo] = useState(null);

  // Función para agregar un nuevo módulo a la lista
  const addModulo = () => {
    // Creamos un objeto con la estructura de un módulo nuevo (vacío)
    const newModulo = {
      id: Date.now(), // Usamos la fecha actual como ID temporal (único)
      titulo: '', // Título vacío, el usuario lo llenará
      descripcion: '', // Descripción vacía
      contenido: [], // Lista vacía de contenido (se agregará después)
      examen: null // No tiene examen por ahora (es opcional)
    };
    // Agregamos el nuevo módulo a la lista existente
    // [...modulos, newModulo] significa: toma todos los módulos actuales y agrega el nuevo
    onModulosChange([...modulos, newModulo]);
    // Expandimos automáticamente el módulo recién creado para que el usuario lo complete
    setExpandedModulo(newModulo.id);
    // Mostramos un mensaje de confirmación
    alert('✅ Módulo creado con éxito. Completa la información del módulo.');
  };

  // Función para eliminar un módulo de la lista
  const removeModulo = (moduloId) => {
    // filter() crea una nueva lista con todos los módulos EXCEPTO el que queremos eliminar
    // m.id !== moduloId significa: "mantén solo los módulos cuyo ID sea diferente al que queremos eliminar"
    onModulosChange(modulos.filter(m => m.id !== moduloId));
    // Si el módulo que eliminamos estaba expandido, lo cerramos
    if (expandedModulo === moduloId) {
      setExpandedModulo(null);
    }
  };

  // Función para actualizar un campo específico de un módulo
  // Por ejemplo: actualizar el título, la descripción, etc.
  const updateModulo = (moduloId, field, value) => {
    // map() recorre todos los módulos y crea una nueva lista
    onModulosChange(modulos.map(m => 
      // Si este módulo es el que queremos actualizar (m.id === moduloId)
      m.id === moduloId 
        ? { ...m, [field]: value } // Crea una copia del módulo pero con el campo actualizado
        : m // Si no es el módulo que buscamos, lo dejamos igual
    ));
  };

  // Función para actualizar el examen de un módulo
  const updateExamen = (moduloId, examenData) => {
    // Solo actualizamos si realmente hay datos de examen
    // Esto evita que se elimine el examen accidentalmente
    if (examenData !== null && examenData !== undefined) {
      // Actualizamos el campo 'examen' del módulo con los nuevos datos
      updateModulo(moduloId, 'examen', examenData);
    }
  };

  // Función para agregar o quitar un examen de un módulo
  // Es como un interruptor: si tiene examen, lo quita; si no tiene, lo agrega
  const toggleExamen = (moduloId) => {
    // Buscamos el módulo en la lista
    const modulo = modulos.find(m => m.id === moduloId);
    if (modulo.examen) {
      // Si ya tiene examen, lo eliminamos (ponemos null)
      updateModulo(moduloId, 'examen', null);
    } else {
      // Si no tiene examen, creamos uno nuevo vacío con valores por defecto
      updateModulo(moduloId, 'examen', {
        titulo: '', // Título vacío
        descripcion: '', // Descripción vacía
        tiempo_limite_minutos: '', // Sin tiempo límite por defecto
        intentos_permitidos: 1, // Solo 1 intento por defecto
        porcentaje_aprobacion: 70, // 70% para aprobar por defecto
        preguntas: [] // Lista vacía de preguntas (se agregarán después)
      });
    }
  };

  const addContenido = (moduloId) => {
    const newContenido = {
      id: Date.now(),
      tipo: 'video', // video, pdf, word
      url: '',
      archivo: null,
      nombre: ''
    };
    const modulo = modulos.find(m => m.id === moduloId);
    updateModulo(moduloId, 'contenido', [
      ...(modulo?.contenido || []),
      newContenido
    ]);
  };

  const removeContenido = (moduloId, contenidoId) => {
    const modulo = modulos.find(m => m.id === moduloId);
    updateModulo(moduloId, 'contenido', 
      modulo.contenido.filter(c => c.id !== contenidoId)
    );
  };

  const updateContenido = (moduloId, contenidoId, field, value) => {
    const modulo = modulos.find(m => m.id === moduloId);
    if (!modulo) return;
    
    const contenido = modulo.contenido.map(c => 
      c.id === contenidoId ? { ...c, [field]: value } : c
    );
    updateModulo(moduloId, 'contenido', contenido);
  };

  const updateContenidoMultiple = (moduloId, contenidoId, updates) => {
    const modulo = modulos.find(m => m.id === moduloId);
    if (!modulo) return;
    
    const contenido = modulo.contenido.map(c => 
      c.id === contenidoId ? { ...c, ...updates } : c
    );
    updateModulo(moduloId, 'contenido', contenido);
  };

  const handleFileChange = (moduloId, contenidoId, file) => {
    if (!file) return;

    // Validar tipo de archivo
    const validTypes = {
      pdf: ['application/pdf'],
      word: [
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ]
    };

    const isPDF = validTypes.pdf.includes(file.type);
    const isWord = validTypes.word.includes(file.type);

    if (!isPDF && !isWord) {
      alert('Solo se permiten archivos PDF o Word (.doc, .docx)');
      return;
    }

    // Validar tamaño (máx 50MB)
    if (file.size > 50 * 1024 * 1024) {
      alert('El archivo no debe superar los 50MB');
      return;
    }

    const tipo = isPDF ? 'pdf' : 'word';
    // Actualizar todos los campos relacionados con el archivo en una sola operación
    updateContenidoMultiple(moduloId, contenidoId, {
      tipo: tipo,
      archivo: file,
      nombre: file.name
    });
  };

  return (
    <div className="modulo-manager">
      <div className="modulo-manager-header">
        <h3>📚 Módulos del Curso</h3>
        <p className="modulo-manager-description">
          Agrega módulos con contenido educativo. Puedes incluir documentos PDF, Word o enlaces de video.
        </p>
        <button
          type="button"
          onClick={addModulo}
          className="btn btn-primary btn-sm"
        >
          ➕ Agregar Módulo
        </button>
      </div>

      {modulos.length === 0 ? (
        <div className="empty-modulos">
          <p>No hay módulos agregados. Haz clic en "Agregar Módulo" para comenzar.</p>
        </div>
      ) : (
        <div className="modulos-list">
          {modulos.map((modulo, index) => (
            <div key={modulo.id} className="modulo-card">
              <div className="modulo-card-header">
                <div className="modulo-number">Módulo {index + 1}</div>
                <button
                  type="button"
                  onClick={() => removeModulo(modulo.id)}
                  className="btn-remove-modulo"
                  title="Eliminar módulo"
                >
                  ✕
                </button>
              </div>

              <div className="modulo-form">
                <div className="form-group">
                  <label>Título del Módulo *</label>
                  <input
                    type="text"
                    value={modulo.titulo}
                    onChange={(e) => updateModulo(modulo.id, 'titulo', e.target.value)}
                    placeholder="Ej: Introducción a React"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Descripción</label>
                  <textarea
                    value={modulo.descripcion}
                    onChange={(e) => updateModulo(modulo.id, 'descripcion', e.target.value)}
                    rows="2"
                    placeholder="Describe el contenido de este módulo..."
                  />
                </div>

                <div className="contenido-section">
                  <div className="contenido-header">
                    <label>Contenido del Módulo *</label>
                    <button
                      type="button"
                      onClick={() => addContenido(modulo.id)}
                      className="btn btn-secondary btn-sm"
                    >
                      ➕ Agregar Contenido
                    </button>
                  </div>

                  {modulo.contenido && modulo.contenido.length > 0 ? (
                    <div className="contenido-list">
                      {modulo.contenido.map((item, itemIndex) => (
                        <div key={item.id} className="contenido-item">
                          <div className="contenido-item-header">
                            <span className="contenido-number">Contenido {itemIndex + 1}</span>
                            <button
                              type="button"
                              onClick={() => removeContenido(modulo.id, item.id)}
                              className="btn-remove-contenido"
                            >
                              ✕
                            </button>
                          </div>

                          <div className="contenido-form">
                            <div className="form-group">
                              <label>Tipo de Contenido *</label>
                              <select
                                value={item.tipo || 'video'}
                                onChange={(e) => {
                                  const nuevoTipo = e.target.value;
                                  // Actualizar tipo y limpiar campos relacionados en una sola operación
                                  if (nuevoTipo === 'video') {
                                    updateContenidoMultiple(modulo.id, item.id, {
                                      tipo: nuevoTipo,
                                      archivo: null,
                                      nombre: '',
                                      url: ''
                                    });
                                  } else {
                                    updateContenidoMultiple(modulo.id, item.id, {
                                      tipo: nuevoTipo,
                                      url: ''
                                    });
                                  }
                                }}
                                required
                              >
                                <option value="video">🔗 Enlace de Video</option>
                                <option value="pdf">📄 Documento PDF</option>
                                <option value="word">📝 Documento Word</option>
                              </select>
                            </div>

                            {item.tipo === 'video' ? (
                              <div className="form-group">
                                <label>URL del Video *</label>
                                <input
                                  type="url"
                                  value={item.url || ''}
                                  onChange={(e) => updateContenido(modulo.id, item.id, 'url', e.target.value)}
                                  placeholder="https://www.youtube.com/watch?v=..."
                                  required
                                />
                                <small>Pega el enlace del video (YouTube, Vimeo, etc.)</small>
                              </div>
                            ) : (
                              <div className="form-group">
                                <label>
                                  {item.tipo === 'pdf' ? 'Documento PDF' : 'Documento Word'} *
                                </label>
                                <input
                                  type="file"
                                  accept={item.tipo === 'pdf' ? '.pdf' : '.doc,.docx'}
                                  onChange={(e) => {
                                    const file = e.target.files[0];
                                    if (file) {
                                      handleFileChange(modulo.id, item.id, file);
                                    }
                                  }}
                                />
                                {item.nombre && (
                                  <div className="file-info">
                                    <span className="file-name">📎 {item.nombre}</span>
                                    {item.archivo && item.archivo instanceof File ? (
                                      <span className="file-size">
                                        ({(item.archivo.size / (1024 * 1024)).toFixed(2)} MB)
                                      </span>
                                    ) : item.urlOriginal ? (
                                      <span className="file-size" style={{ color: '#64748b', fontStyle: 'italic' }}>
                                        (Archivo existente - sube uno nuevo para reemplazarlo)
                                      </span>
                                    ) : null}
                                  </div>
                                )}
                                <small>
                                  Formatos permitidos: {item.tipo === 'pdf' ? 'PDF' : 'Word (.doc, .docx)'} (máx. 50MB)
                                </small>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="empty-contenido">
                      <p style={{ color: '#ef4444', fontWeight: '500' }}>
                        ⚠️ El contenido del módulo es obligatorio. Haz clic en "Agregar Contenido" para comenzar.
                      </p>
                    </div>
                  )}
                </div>

                {/* Sección de Examen */}
                <div className="examen-section">
                  <div className="examen-section-header">
                    <label>Examen del Módulo (Opcional)</label>
                    <button
                      type="button"
                      onClick={() => toggleExamen(modulo.id)}
                      className="btn btn-secondary btn-sm"
                    >
                      {modulo.examen ? '✕ Quitar Examen' : '📝 Agregar Examen'}
                    </button>
                  </div>

                  {modulo.examen && (
                    <ExamenForm
                      moduloId={modulo.id}
                      examenData={modulo.examen}
                      onExamenChange={(examenData) => updateExamen(modulo.id, examenData)}
                    />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ModuloManager;

