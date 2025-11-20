// Importamos las herramientas necesarias
// useRef: para referenciar elementos del DOM (como el input de archivo)
// useNavigate: para navegar a otras páginas después de crear el curso
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import ImageCropper from '../components/ImageCropper'; // Componente para recortar la imagen de portada
import CategoriaSelector from '../components/CategoriaSelector'; // Selector de categorías
import ModuloManager from '../components/ModuloManager'; // Gestor de módulos del curso
import './CrearCurso.css';

// Componente para crear un nuevo curso
const CrearCurso = () => {
  // Función para navegar a otras páginas (por ejemplo, después de crear el curso)
  const navigate = useNavigate();
  
  // Guardamos la lista de categorías disponibles (para el selector)
  const [categorias, setCategorias] = useState([]);
  
  // Indica si estamos guardando el curso (para mostrar "Guardando...")
  const [loading, setLoading] = useState(false);
  
  // URL de la imagen que se muestra como preview (antes de subirla)
  const [imagenPreview, setImagenPreview] = useState(null);
  
  // Indica si debemos mostrar el componente para recortar la imagen
  const [showCropper, setShowCropper] = useState(false);
  
  // La imagen que se va a recortar (en formato base64)
  const [imageToCrop, setImageToCrop] = useState(null);
  
  // La imagen ya recortada (en formato Blob, lista para enviar al servidor)
  const [croppedImageBlob, setCroppedImageBlob] = useState(null);
  
  // Referencia al input de archivo (para poder limpiarlo después de cancelar)
  const fileInputRef = useRef(null);
  
  // Lista de módulos que tendrá el curso
  const [modulos, setModulos] = useState([]);
  
  // Todos los datos del formulario (título, descripción, precio, etc.)
  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    categoria_id: '',
    precio: '',
    nivel: '',
    duracion_horas: '',
    idioma: '',
    estado: ''
  });

  // Cuando la página se carga, traemos las categorías del servidor
  useEffect(() => {
    fetchCategorias();
  }, []); // El array vacío [] significa que solo se ejecuta una vez al cargar

  // Función para traer las categorías del servidor
  const fetchCategorias = async () => {
    try {
      // Pedimos al servidor la lista de categorías
      const response = await axios.get('/api/cursos/categorias/list');
      // Guardamos las categorías para mostrarlas en el selector
      setCategorias(response.data);
    } catch (error) {
      // Si algo sale mal, lo mostramos en la consola
      console.error('Error al obtener categorías:', error);
    }
  };

  // Esta función se ejecuta cada vez que el usuario escribe en un campo del formulario
  const handleChange = (e) => {
    // Obtenemos el nombre del campo (ej: "titulo", "precio") y el valor que escribió
    const { name, value } = e.target;
    
    // Algunos campos son números (precio, duración, categoría), otros son texto
    const isNumericField = name === 'precio' || name === 'duracion_horas' || name === 'categoria_id';
    
    // Actualizamos el formData con el nuevo valor
    setFormData(prev => ({
      ...prev, // Mantenemos los valores anteriores
      [name]: isNumericField
        // Si es un campo numérico, lo convertimos a número (parseInt o parseFloat)
        ? (value === '' ? '' : (name === 'categoria_id' ? parseInt(value) : parseFloat(value)))
        // Si es texto, lo guardamos tal cual (sin quitar espacios mientras escribe)
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
    
    // Validar que todos los campos estén completos (aplicar trim solo al validar)
    if (!formData.titulo || !formData.titulo.trim()) {
      alert('El título del curso es obligatorio');
      return;
    }
    if (!formData.descripcion || !formData.descripcion.trim()) {
      alert('La descripción del curso es obligatoria');
      return;
    }
    if (!formData.categoria_id) {
      alert('La categoría es obligatoria');
      return;
    }
    if (!formData.nivel) {
      alert('El nivel es obligatorio');
      return;
    }
    if (formData.precio === '' || formData.precio === null || formData.precio === undefined) {
      alert('El precio es obligatorio');
      return;
    }
    if (formData.duracion_horas === '' || formData.duracion_horas === null || formData.duracion_horas === undefined) {
      alert('La duración en horas es obligatoria');
      return;
    }
    if (!formData.idioma || !formData.idioma.trim()) {
      alert('El idioma es obligatorio');
      return;
    }
    if (!formData.estado) {
      alert('El estado es obligatorio');
      return;
    }
    if (!croppedImageBlob && !fileInputRef.current?.files[0]) {
      alert('La portada del curso es obligatoria');
      return;
    }

    // Validar módulos si se agregaron
    if (modulos.length > 0) {
      for (let i = 0; i < modulos.length; i++) {
        const modulo = modulos[i];
        if (!modulo.titulo || !modulo.titulo.trim()) {
          alert(`El título del módulo ${i + 1} es obligatorio`);
          return;
        }
        if (!modulo.contenido || modulo.contenido.length === 0) {
          alert(`El módulo "${modulo.titulo}" debe tener al menos un contenido (video, PDF o Word)`);
          return;
        }
        // Validar cada contenido
        for (let j = 0; j < modulo.contenido.length; j++) {
          const item = modulo.contenido[j];
          if (item.tipo === 'video') {
            if (!item.url || !item.url.trim()) {
              alert(`El contenido ${j + 1} del módulo "${modulo.titulo}" debe tener una URL de video`);
              return;
            }
          } else if (item.tipo === 'pdf' || item.tipo === 'word') {
            // Verificar que el archivo existe
            if (!item.archivo) {
              console.error('Contenido sin archivo:', item);
              console.error('Estado completo del módulo:', modulo);
              alert(`El contenido ${j + 1} del módulo "${modulo.titulo}" debe tener un archivo seleccionado`);
              return;
            }
            // Verificar que es un File válido
            if (!(item.archivo instanceof File)) {
              console.error('Archivo no es una instancia de File:', item.archivo);
              console.error('Tipo del archivo:', typeof item.archivo);
              alert(`El contenido ${j + 1} del módulo "${modulo.titulo}" debe tener un archivo válido seleccionado`);
              return;
            }
          }
        }
      }
    }

    setLoading(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('titulo', formData.titulo.trim()); // Aplicar trim solo al enviar
      formDataToSend.append('descripcion', formData.descripcion.trim()); // Aplicar trim solo al enviar
      formDataToSend.append('categoria_id', formData.categoria_id);
      formDataToSend.append('precio', parseFloat(formData.precio));
      formDataToSend.append('nivel', formData.nivel);
      formDataToSend.append('duracion_horas', parseInt(formData.duracion_horas));
      formDataToSend.append('idioma', formData.idioma.trim()); // Aplicar trim solo al enviar
      formDataToSend.append('estado', formData.estado);

      // Si hay una imagen recortada, usar esa; si no, usar el archivo original
      if (croppedImageBlob) {
        formDataToSend.append('imagen_portada', croppedImageBlob, 'course-cover.jpg');
      } else if (fileInputRef.current?.files[0]) {
        formDataToSend.append('imagen_portada', fileInputRef.current.files[0]);
      }

      const response = await axios.post('/api/cursos', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      const cursoId = response.data.cursoId;

      // Crear módulos y su contenido
      if (modulos.length > 0) {
        try {
          for (let i = 0; i < modulos.length; i++) {
            const modulo = modulos[i];
            
            // Crear el módulo
            const moduloResponse = await axios.post(`/api/cursos/${cursoId}/modulos`, {
              titulo: modulo.titulo,
              descripcion: modulo.descripcion || '',
              orden: i
            });

            const moduloId = moduloResponse.data.moduloId;

            // Crear el examen del módulo si existe
            if (modulo.examen && modulo.examen.preguntas && modulo.examen.preguntas.length > 0) {
              try {
                const examenResponse = await axios.post('/api/examenes', {
                  curso_id: cursoId,
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
                // No bloqueamos la creación del módulo si falla el examen
              }
            }

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
                  // Subir archivo y crear lección
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
                }
              }
            }
          }
        } catch (error) {
          console.error('Error al crear módulos:', error);
          alert('Curso creado, pero hubo un error al crear algunos módulos. Puedes editarlos después.');
        }
      }

      alert('Curso creado exitosamente');
      navigate(`/cursos/editar/${cursoId}`);
    } catch (error) {
      console.error('Error al crear curso:', error);
      alert(error.response?.data?.error || 'Error al crear el curso');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="form-header">
        <h1>➕ Crear Nuevo Curso</h1>
        <button onClick={() => navigate('/cursos')} className="btn btn-secondary">
          Cancelar
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
              placeholder="Ej: Introducción a React"
            />
          </div>

          <div className="form-group">
            <label>Categoría *</label>
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
          <label>Descripción *</label>
          <textarea
            name="descripcion"
            value={formData.descripcion}
            onChange={handleChange}
            rows="5"
            required
            placeholder="Describe el contenido y objetivos del curso..."
          />
        </div>

        <div className="form-group">
          <label>Portada del Curso *</label>
          <div className="image-upload-container">
            {imagenPreview ? (
              <div className="image-preview">
                <img src={imagenPreview} alt="Preview" />
                <button
                  type="button"
                  className="btn-remove-image"
                  onClick={() => {
                    setImagenPreview(null);
                    setCroppedImageBlob(null);
                    if (fileInputRef.current) {
                      fileInputRef.current.value = '';
                    }
                    if (imagenPreview && imagenPreview.startsWith('blob:')) {
                      URL.revokeObjectURL(imagenPreview);
                    }
                  }}
                >
                  ✕ Eliminar
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
                  <span>Haz clic para subir una imagen de portada</span>
                  <small>Formatos: JPG, PNG, GIF, WEBP (máx. 10MB)</small>
                </div>
              </label>
            )}
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Nivel *</label>
            <select
              name="nivel"
              value={formData.nivel}
              onChange={handleChange}
              required
            >
              <option value="">Seleccionar nivel</option>
              <option value="principiante">Principiante</option>
              <option value="intermedio">Intermedio</option>
              <option value="avanzado">Avanzado</option>
            </select>
          </div>

          <div className="form-group">
            <label>Precio (USD) *</label>
            <input
              type="number"
              name="precio"
              value={formData.precio}
              onChange={handleChange}
              min="0"
              step="0.01"
              required
              placeholder="0.00"
            />
          </div>

          <div className="form-group">
            <label>Duración (horas) *</label>
            <input
              type="number"
              name="duracion_horas"
              value={formData.duracion_horas}
              onChange={handleChange}
              min="1"
              required
              placeholder="0"
            />
          </div>

          <div className="form-group">
            <label>Idioma *</label>
            <input
              type="text"
              name="idioma"
              value={formData.idioma}
              onChange={handleChange}
              required
              placeholder="Ej: Español"
            />
          </div>
        </div>

        <div className="form-group">
          <label>Estado *</label>
          <select
            name="estado"
            value={formData.estado}
            onChange={handleChange}
            required
          >
            <option value="">Seleccionar estado</option>
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
            disabled={loading}
          >
            {loading ? 'Creando...' : 'Crear Curso'}
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

export default CrearCurso;

