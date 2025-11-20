import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import ImageCropper from '../components/ImageCropper';
import CategoriaSelector from '../components/CategoriaSelector';
import ModuloManager from '../components/ModuloManager';
import { getImageUrl } from '../utils/api';
import './EditarCurso.css';

const EditarCurso = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [categorias, setCategorias] = useState([]);
  const [imagenPreview, setImagenPreview] = useState(null);
  const [imagenActual, setImagenActual] = useState(null);
  const [showCropper, setShowCropper] = useState(false);
  const [imageToCrop, setImageToCrop] = useState(null);
  const [croppedImageBlob, setCroppedImageBlob] = useState(null);
  const fileInputRef = useRef(null);
  const [modulos, setModulos] = useState([]);
  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    categoria_id: '',
    precio: 0,
    nivel: 'principiante',
    duracion_horas: 0,
    idioma: 'Español',
    estado: 'borrador'
  });

  const fetchCategorias = async () => {
    try {
      const response = await axios.get('/api/cursos/categorias/list');
      setCategorias(response.data);
    } catch (error) {
      console.error('Error al obtener categorías:', error);
    }
  };

  const fetchCurso = useCallback(async () => {
    try {
      const response = await axios.get(`/api/cursos/${id}`);
      const curso = response.data;
      setFormData({
        titulo: curso.titulo || '',
        descripcion: curso.descripcion || '',
        categoria_id: curso.categoria_id || '',
        precio: curso.precio || 0,
        nivel: curso.nivel || 'principiante',
        duracion_horas: curso.duracion_horas || 0,
        idioma: curso.idioma || 'Español',
        estado: curso.estado || 'borrador'
      });
      
      // Si el curso tiene una imagen de portada, la cargamos y mostramos
      if (curso.imagen_portada) {
        // Construimos la URL completa de la imagen
        // Construimos la URL de la imagen usando la función helper
        const imageUrl = getImageUrl(curso.imagen_portada, 'courses');
        setImagenActual(imageUrl);
        setImagenPreview(imageUrl);
      }

      // Convertimos los módulos que vienen del servidor al formato que espera ModuloManager
      // Esto es necesario porque el formato de la base de datos es diferente al formato del componente
      if (curso.modulos && curso.modulos.length > 0) {
        const modulosFormateados = curso.modulos.map((modulo, index) => {
          // Convertimos cada lección del módulo a un objeto de contenido
          const contenido = (modulo.lecciones || []).map((leccion, lecIndex) => {
            if (leccion.tipo_contenido === 'video') {
              // Si es un video, guardamos la URL del video
              return {
                id: `lec-${leccion.id}`, // ID temporal para el componente
                tipo: 'video',
                url: leccion.url_contenido || '',
                archivo: null, // Los videos no tienen archivo, solo URL
                nombre: '',
                leccionId: leccion.id // ID real de la lección en la base de datos
              };
            } else {
              // Si es un archivo (PDF o Word)
              const url = leccion.url_contenido || '';
              // Verificamos si es PDF o Word mirando la extensión del archivo
              const esPDF = url.toLowerCase().endsWith('.pdf');
              return {
                id: `lec-${leccion.id}`, // ID temporal
                tipo: esPDF ? 'pdf' : 'word', // Tipo según la extensión
                url: url, // Guardamos la URL completa para poder recrearla después
                archivo: null, // No podemos cargar el archivo desde el servidor, solo tenemos la URL
                nombre: url.split('/').pop() || '', // Extraemos el nombre del archivo de la URL
                leccionId: leccion.id, // ID real en la base de datos
                urlOriginal: url // URL original para poder recrearla si no se sube un archivo nuevo
              };
            }
          });

          // Si el módulo tiene un examen, también lo convertimos al formato del componente
          let examen = null;
          if (modulo.examen) {
            examen = {
              titulo: modulo.examen.titulo || '',
              descripcion: modulo.examen.descripcion || '',
              tiempo_limite_minutos: modulo.examen.tiempo_limite_minutos || '',
              intentos_permitidos: modulo.examen.intentos_permitidos || 1,
              porcentaje_aprobacion: modulo.examen.porcentaje_aprobacion || 70,
              preguntas: (modulo.examen.preguntas || []).map((pregunta, pregIndex) => ({
                id: `preg-${pregunta.id}`,
                pregunta: pregunta.pregunta,
                tipo_pregunta: pregunta.tipo_pregunta,
                puntos: pregunta.puntos,
                orden: pregunta.orden,
                opciones: pregunta.opciones || [],
                preguntaId: pregunta.id // Para identificar si es existente
              }))
            };
          }

          return {
            id: `mod-${modulo.id}`, // ID temporal para ModuloManager
            moduloId: modulo.id, // ID real del módulo en BD
            titulo: modulo.titulo || '',
            descripcion: modulo.descripcion || '',
            contenido: contenido,
            examen: examen
          };
        });
        setModulos(modulosFormateados);
      }

    } catch (error) {
      console.error('Error al obtener curso:', error);
      alert('Error al cargar el curso');
      navigate('/cursos');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    fetchCategorias();
    fetchCurso();
  }, [fetchCurso]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'precio' || name === 'duracion_horas' || name === 'categoria_id'
        ? (value === '' ? '' : (name === 'categoria_id' ? parseInt(value) : parseFloat(value)))
        : value
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validar tipo de archivo
      if (!file.type.startsWith('image/')) {
        alert('Por favor selecciona una imagen válida');
        return;
      }

      // Validar tamaño (máx 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('La imagen no debe superar los 10MB');
        return;
      }

      // Crear preview y abrir cropper
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageToCrop(reader.result);
        setShowCropper(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCropComplete = (blob, imageUrl) => {
    setCroppedImageBlob(blob);
    setImagenPreview(imageUrl);
    setShowCropper(false);
    setImageToCrop(null);
  };

  const handleCancelCrop = () => {
    setShowCropper(false);
    setImageToCrop(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    // Validar módulos si se agregaron
    if (modulos.length > 0) {
      for (let i = 0; i < modulos.length; i++) {
        const modulo = modulos[i];
        if (!modulo.titulo || !modulo.titulo.trim()) {
          alert(`El título del módulo ${i + 1} es obligatorio`);
          setSaving(false);
          return;
        }
        if (!modulo.contenido || modulo.contenido.length === 0) {
          alert(`El módulo "${modulo.titulo || `Módulo ${i + 1}`}" debe tener al menos un contenido (video, PDF o Word)`);
          setSaving(false);
          return;
        }
        // Validar cada contenido
        for (let j = 0; j < modulo.contenido.length; j++) {
          const item = modulo.contenido[j];
          if (item.tipo === 'video') {
            if (!item.url || !item.url.trim()) {
              alert(`El contenido ${j + 1} del módulo "${modulo.titulo || `Módulo ${i + 1}`}" debe tener una URL de video`);
              setSaving(false);
              return;
            }
          } else if (item.tipo === 'pdf' || item.tipo === 'word') {
            // Verificar que el archivo existe o que hay una URL original (archivo existente)
            if (!item.archivo && !item.urlOriginal) {
              console.error('Contenido sin archivo:', item);
              alert(`El contenido ${j + 1} del módulo "${modulo.titulo || `Módulo ${i + 1}`}" debe tener un archivo seleccionado`);
              setSaving(false);
              return;
            }
            // Si hay un archivo nuevo, verificar que es un File válido
            if (item.archivo && !(item.archivo instanceof File)) {
              console.error('Archivo no es una instancia de File:', item.archivo);
              alert(`El contenido ${j + 1} del módulo "${modulo.titulo || `Módulo ${i + 1}`}" debe tener un archivo válido seleccionado`);
              setSaving(false);
              return;
            }
          }
        }
      }
    }

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('titulo', formData.titulo);
      formDataToSend.append('descripcion', formData.descripcion);
      formDataToSend.append('categoria_id', formData.categoria_id || '');
      formDataToSend.append('precio', formData.precio);
      formDataToSend.append('nivel', formData.nivel);
      formDataToSend.append('duracion_horas', formData.duracion_horas);
      formDataToSend.append('idioma', formData.idioma);
      formDataToSend.append('estado', formData.estado);

      // Si hay una imagen recortada, usar esa; si no, usar el archivo original
      if (croppedImageBlob) {
        formDataToSend.append('imagen_portada', croppedImageBlob, 'course-cover.jpg');
      } else if (fileInputRef.current?.files[0]) {
        formDataToSend.append('imagen_portada', fileInputRef.current.files[0]);
      }

      await axios.put(`/api/cursos/${id}`, formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      // Actualizar módulos y su contenido
      // Estrategia: Eliminar todos los módulos existentes y recrearlos
      // Esto simplifica la lógica y evita problemas de sincronización
      if (modulos.length > 0) {
        try {
          // Obtener módulos existentes y eliminarlos (esto también eliminará lecciones y exámenes por CASCADE)
          const cursoActual = await axios.get(`/api/cursos/${id}`);
          if (cursoActual.data.modulos && cursoActual.data.modulos.length > 0) {
            for (const moduloExistente of cursoActual.data.modulos) {
              try {
                await axios.delete(`/api/cursos/modulos/${moduloExistente.id}`);
              } catch (error) {
                console.error('Error al eliminar módulo existente:', error);
              }
            }
          }

          // Crear todos los módulos desde cero
          for (let i = 0; i < modulos.length; i++) {
            const modulo = modulos[i];
            
            // Crear el módulo
            const moduloResponse = await axios.post(`/api/cursos/${id}/modulos`, {
              titulo: modulo.titulo,
              descripcion: modulo.descripcion || '',
              orden: i
            });

            const moduloId = moduloResponse.data.moduloId;

            // Crear el contenido del módulo
            if (modulo.contenido && modulo.contenido.length > 0) {
              for (let j = 0; j < modulo.contenido.length; j++) {
                const item = modulo.contenido[j];
                
                if (item.tipo === 'video') {
                  // Crear lección con enlace de video
                  await axios.post(`/api/cursos/modulos/${moduloId}/lecciones`, {
                    titulo: `Contenido ${j + 1}`,
                    descripcion: '',
                    tipo_contenido: 'video',
                    url_contenido: item.url,
                    duracion_minutos: 0,
                    orden: j
                  });
                } else if (item.tipo === 'pdf' || item.tipo === 'word') {
                  // Si hay un archivo nuevo, subirlo
                  if (item.archivo && item.archivo instanceof File) {
                    const contenidoFormData = new FormData();
                    contenidoFormData.append('archivo', item.archivo);
                    contenidoFormData.append('titulo', `Contenido ${j + 1}`);
                    contenidoFormData.append('descripcion', '');
                    contenidoFormData.append('tipo_contenido', item.tipo);
                    contenidoFormData.append('orden', j);

                    await axios.post(`/api/cursos/modulos/${moduloId}/contenido`, contenidoFormData, {
                      headers: {
                        'Content-Type': 'multipart/form-data'
                      }
                    });
                  } else if (item.urlOriginal) {
                    // Si no hay archivo nuevo pero hay urlOriginal, significa que es un archivo existente
                    // En este caso, recreamos la lección con la misma URL
                    await axios.post(`/api/cursos/modulos/${moduloId}/lecciones`, {
                      titulo: `Contenido ${j + 1}`,
                      descripcion: '',
                      tipo_contenido: 'recurso',
                      url_contenido: item.urlOriginal,
                      duracion_minutos: 0,
                      orden: j
                    });
                  }
                }
              }
            }

            // Crear el examen del módulo si existe
            if (modulo.examen && modulo.examen.preguntas && modulo.examen.preguntas.length > 0) {
              try {
                const examenResponse = await axios.post('/api/examenes', {
                  curso_id: id,
                  modulo_id: moduloId,
                  titulo: modulo.examen.titulo || `Examen - ${modulo.titulo}`,
                  descripcion: modulo.examen.descripcion || '',
                  tiempo_limite_minutos: modulo.examen.tiempo_limite_minutos || null,
                  intentos_permitidos: modulo.examen.intentos_permitidos || 1,
                  porcentaje_aprobacion: modulo.examen.porcentaje_aprobacion || 70
                });

                const examenId = examenResponse.data.examenId;

                // Crear todas las preguntas del examen
                for (const pregunta of modulo.examen.preguntas) {
                  const preguntaResponse = await axios.post(`/api/examenes/${examenId}/preguntas`, {
                    pregunta: pregunta.pregunta,
                    tipo_pregunta: pregunta.tipo_pregunta,
                    puntos: pregunta.puntos,
                    orden: pregunta.orden
                  });
                  const preguntaId = preguntaResponse.data.preguntaId;

                  // Si es opción múltiple, crear las opciones
                  if (pregunta.tipo_pregunta === 'opcion_multiple' && pregunta.opciones && pregunta.opciones.length > 0) {
                    await axios.post(`/api/examenes/preguntas/${preguntaId}/opciones`, {
                      opciones: pregunta.opciones
                    });
                  }
                }
              } catch (error) {
                console.error('Error al crear examen del módulo:', error);
                // No bloqueamos la actualización del módulo si falla el examen
              }
            }
          }
        } catch (error) {
          console.error('Error al actualizar módulos:', error);
          alert('Curso actualizado, pero hubo un error al actualizar algunos módulos. Puedes editarlos después.');
        }
      } else {
        // Si no hay módulos, eliminar todos los existentes
        try {
          const cursoActual = await axios.get(`/api/cursos/${id}`);
          if (cursoActual.data.modulos && cursoActual.data.modulos.length > 0) {
            for (const moduloExistente of cursoActual.data.modulos) {
              try {
                await axios.delete(`/api/cursos/modulos/${moduloExistente.id}`);
              } catch (error) {
                console.error('Error al eliminar módulo:', error);
              }
            }
          }
        } catch (error) {
          console.error('Error al eliminar módulos:', error);
        }
      }

      alert('Curso actualizado exitosamente');
      fetchCurso();
    } catch (error) {
      console.error('Error al actualizar curso:', error);
      alert(error.response?.data?.error || 'Error al actualizar el curso');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="loading">Cargando...</div>;
  }

  return (
    <div className="container">
      <div className="form-header">
        <h1>✏️ Editar Curso</h1>
        <button onClick={() => navigate('/cursos')} className="btn btn-secondary">
          Volver
        </button>
      </div>

      <form onSubmit={handleSubmit} className="curso-form">
        <div className="form-row">
          <div className="form-group">
            <label>Título del Curso *</label>
            <input
              type="text"
              name="titulo"
              value={formData.titulo}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Categoría</label>
            <CategoriaSelector
              categorias={categorias}
              value={formData.categoria_id}
              onChange={handleChange}
              name="categoria_id"
              required
            />
          </div>
        </div>

          <div className="form-group">
            <label>Descripción</label>
            <textarea
              name="descripcion"
              value={formData.descripcion}
              onChange={handleChange}
              rows="5"
            />
          </div>

          <div className="form-group">
            <label>Portada del Curso</label>
            <div className="image-upload-container">
              {imagenPreview ? (
                <div className="image-preview">
                  <img src={imagenPreview} alt="Preview" />
                  <button
                    type="button"
                    className="btn-remove-image"
                    onClick={() => {
                      setImagenPreview(imagenActual);
                      setCroppedImageBlob(null);
                      if (fileInputRef.current) {
                        fileInputRef.current.value = '';
                      }
                      if (imagenPreview && imagenPreview.startsWith('blob:')) {
                        URL.revokeObjectURL(imagenPreview);
                      }
                    }}
                  >
                    ✕ Cancelar cambio
                  </button>
                </div>
              ) : (
                <label className="image-upload-label">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    style={{ display: 'none' }}
                  />
                  <div className="image-upload-placeholder">
                    <span className="upload-icon">📷</span>
                    <span>Haz clic para cambiar la imagen de portada</span>
                    <small>Formatos: JPG, PNG, GIF, WEBP (máx. 10MB)</small>
                  </div>
                </label>
              )}
            </div>
          </div>

        <div className="form-row">
          <div className="form-group">
            <label>Nivel</label>
            <select
              name="nivel"
              value={formData.nivel}
              onChange={handleChange}
            >
              <option value="principiante">Principiante</option>
              <option value="intermedio">Intermedio</option>
              <option value="avanzado">Avanzado</option>
            </select>
          </div>

          <div className="form-group">
            <label>Precio (USD)</label>
            <input
              type="number"
              name="precio"
              value={formData.precio}
              onChange={handleChange}
              min="0"
              step="0.01"
            />
          </div>

          <div className="form-group">
            <label>Duración (horas)</label>
            <input
              type="number"
              name="duracion_horas"
              value={formData.duracion_horas}
              onChange={handleChange}
              min="0"
            />
          </div>

          <div className="form-group">
            <label>Idioma</label>
            <input
              type="text"
              name="idioma"
              value={formData.idioma}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="form-group">
          <label>Estado</label>
          <select
            name="estado"
            value={formData.estado}
            onChange={handleChange}
          >
            <option value="borrador">Borrador</option>
            <option value="publicado">Publicado</option>
            <option value="archivado">Archivado</option>
          </select>
        </div>

        <ModuloManager
          modulos={modulos}
          onModulosChange={setModulos}
        />

        <div className="form-actions">
          <button
            type="button"
            onClick={() => navigate('/cursos')}
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
      {showCropper && imageToCrop && (
        <ImageCropper
          imageSrc={imageToCrop}
          aspect={16/9}
          onCropComplete={handleCropComplete}
          onCancel={handleCancelCrop}
        />
      )}
    </div>
  );
};

export default EditarCurso;

