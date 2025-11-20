import React, { useState, useRef, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import ImageCropper from './ImageCropper';
import { getImageUrl } from '../utils/api';
import './UserProfile.css';

const UserProfile = ({ user, onClose, onUpdate }) => {
  const { fetchUser } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    nombre: user?.nombre || '',
    biografia: user?.biografia || ''
  });
  const [fotoPreview, setFotoPreview] = useState(
    user?.foto_perfil ? getImageUrl(user.foto_perfil, 'profiles') : null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showCropper, setShowCropper] = useState(false);
  const [imageToCrop, setImageToCrop] = useState(null);
  const [croppedImageBlob, setCroppedImageBlob] = useState(null);
  const fileInputRef = useRef(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Verificamos que el archivo sea una imagen (jpg, png, etc.)
      if (!file.type.startsWith('image/')) {
        setError('Por favor selecciona una imagen válida');
        return; // Si no es imagen, salimos de la función
      }

      // Verificamos que la imagen no sea muy grande (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('La imagen no debe superar los 5MB');
        return; // Si es muy grande, salimos
      }

      // Si todo está bien, convertimos la imagen a base64 para poder mostrarla
      // FileReader es una herramienta del navegador para leer archivos
      const reader = new FileReader();
      // Cuando termine de leer el archivo, ejecutamos esto:
      reader.onloadend = () => {
        // Guardamos la imagen en formato base64 para recortarla
        setImageToCrop(reader.result);
        // Mostramos el componente para recortar la imagen
        setShowCropper(true);
      };
      // Leemos el archivo como una URL de datos (base64)
      reader.readAsDataURL(file);
      setError(''); // Limpiamos cualquier error anterior
    }
  };

  // Esta función se ejecuta cuando el usuario termina de recortar la imagen
  const handleCropComplete = (blob, imageUrl) => {
    // Si había una imagen preview anterior creada con URL.createObjectURL (blob:),
    // la eliminamos para liberar memoria
    if (fotoPreview && fotoPreview.startsWith('blob:')) {
      URL.revokeObjectURL(fotoPreview);
    }
    // Guardamos la imagen recortada (en formato Blob, listo para enviar al servidor)
    setCroppedImageBlob(blob);
    // Guardamos la URL de la imagen recortada para mostrarla como preview
    setFotoPreview(imageUrl);
    // Ocultamos el componente de recorte
    setShowCropper(false);
    // Limpiamos la imagen temporal
    setImageToCrop(null);
  };

  // Esta función se ejecuta si el usuario cancela el recorte
  const handleCancelCrop = () => {
    // Ocultamos el componente de recorte
    setShowCropper(false);
    // Limpiamos la imagen temporal
    setImageToCrop(null);
    // Si se había creado una URL temporal (blob:), la eliminamos para liberar memoria
    if (imageToCrop && imageToCrop.startsWith('blob:')) {
      URL.revokeObjectURL(imageToCrop);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Validar palabras en biografía
  const wordCount = formData.biografia ? formData.biografia.trim().split(/\s+/).filter(word => word.length > 0).length : 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validar palabras
    if (wordCount > 100) {
      setError('La biografía no puede exceder 100 palabras');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('nombre', formData.nombre.trim());
      formDataToSend.append('biografia', formData.biografia.trim());
      
      // Si hay una imagen recortada, usar esa; si no, usar el archivo original
      if (croppedImageBlob) {
        formDataToSend.append('foto_perfil', croppedImageBlob, 'profile.jpg');
      } else if (fileInputRef.current?.files[0]) {
        formDataToSend.append('foto_perfil', fileInputRef.current.files[0]);
      }

      await axios.put('/api/auth/profile', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setSuccess('Perfil actualizado exitosamente');
      
      // Limpiar blob después de subir (solo si es un blob URL)
      if (croppedImageBlob && fotoPreview && fotoPreview.startsWith('blob:')) {
        URL.revokeObjectURL(fotoPreview);
        setCroppedImageBlob(null);
      }

      // Actualizar el usuario en el contexto
      if (fetchUser) {
        await fetchUser();
      }
      
      // Llamar callback si existe
      if (onUpdate) {
        onUpdate();
      }

      // Cerrar después de 1 segundo
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (error) {
      console.error('Error al actualizar perfil:', error);
      setError(error.response?.data?.error || 'Error al actualizar el perfil');
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <div className="profile-modal-overlay" onClick={onClose}>
      <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
        <div className="profile-modal-header">
          <h2>Editar Perfil</h2>
          <button className="profile-close-btn" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="profile-form">
          <div className="profile-avatar-section">
            <div className="profile-avatar-container">
              {fotoPreview ? (
                <img 
                  src={fotoPreview.startsWith('data:') || fotoPreview.startsWith('http') || fotoPreview.startsWith('blob:')
                    ? fotoPreview 
                    : fotoPreview.startsWith('/')
                    getImageUrl(fotoPreview, 'profiles')} 
                  alt="Foto de perfil" 
                  className="profile-avatar-image"
                  onError={(e) => {
                    console.error('Error al cargar imagen:', fotoPreview);
                    e.target.style.display = 'none';
                  }}
                />
              ) : (
                <div className="profile-avatar-placeholder">
                  {getInitials(formData.nombre)}
                </div>
              )}
              <label className="profile-avatar-edit">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  style={{ display: 'none' }}
                />
                📷 Cambiar foto
              </label>
            </div>
          </div>

          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          <div className="form-group">
            <label>Nombre</label>
            <input
              type="text"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              required
              placeholder="Tu nombre completo"
            />
          </div>

          <div className="form-group">
            <label>Biografía (máximo 100 palabras)</label>
            <textarea
              name="biografia"
              value={formData.biografia}
              onChange={handleChange}
              rows="4"
              maxLength={500}
              placeholder="Escribe una breve descripción sobre ti..."
            />
            <div className={`word-count ${wordCount > 100 ? 'word-count-error' : ''}`}>
              {wordCount} / 100 palabras
            </div>
          </div>

          <div className="profile-form-actions">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancelar
            </button>
            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={loading || wordCount > 100}
            >
              {loading ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
      {showCropper && imageToCrop && (
        <ImageCropper
          imageSrc={imageToCrop}
          aspect={1}
          onCropComplete={handleCropComplete}
          onCancel={handleCancelCrop}
        />
      )}
    </div>
  );
};

export default UserProfile;

