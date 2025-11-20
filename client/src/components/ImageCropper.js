import React, { useState, useRef, useEffect } from 'react';
import './ImageCropper.css';

const ImageCropper = ({ imageSrc, aspect, onCropComplete, onCancel }) => {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const imgRef = useRef(null);
  const containerRef = useRef(null);

  // Cuando cambia la imagen, reseteamos el zoom y la posición
  // Esto hace que cada imagen nueva empiece desde el principio
  useEffect(() => {
    setScale(1); // Zoom al 100%
    setPosition({ x: 0, y: 0 }); // Posición centrada
  }, [imageSrc]);

  // Esta función se ejecuta cuando el usuario hace scroll con la rueda del mouse
  // Permite hacer zoom in (acercar) y zoom out (alejar) la imagen
  const handleWheel = (e) => {
    e.preventDefault(); // Evitamos que la página haga scroll
    // Si el scroll es hacia abajo (deltaY > 0), reducimos el zoom (0.9)
    // Si el scroll es hacia arriba (deltaY < 0), aumentamos el zoom (1.1)
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setScale(prev => {
      // Calculamos el nuevo zoom, pero lo limitamos entre 1 (100%) y 5 (500%)
      const newScale = Math.max(1, Math.min(prev * delta, 5));
      return newScale;
    });
  };

  // Esta función se ejecuta cuando el usuario presiona el botón del mouse sobre la imagen
  const handleMouseDown = (e) => {
    if (e.button === 0) { // Solo reaccionamos al botón izquierdo del mouse
      e.preventDefault(); // Evitamos comportamientos por defecto
      e.stopPropagation(); // Evitamos que el evento se propague a otros elementos
      // Guardamos la posición inicial del mouse para calcular cuánto se movió después
      dragStartRef.current = {
        x: e.clientX - position.x, // Posición X del mouse menos la posición actual de la imagen
        y: e.clientY - position.y  // Posición Y del mouse menos la posición actual de la imagen
      };
      setIsDragging(true); // Marcamos que el usuario está arrastrando
    }
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y
    });
  };

  const handleMouseUp = (e) => {
    if (isDragging) {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
    }
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleGlobalMouseMove = (e) => {
      setPosition({
        x: e.clientX - dragStartRef.current.x,
        y: e.clientY - dragStartRef.current.y
      });
    };

    const handleGlobalMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleGlobalMouseMove);
    document.addEventListener('mouseup', handleGlobalMouseUp);
    // Si el mouse sale de la ventana del navegador, también soltamos el arrastre
    document.addEventListener('mouseleave', handleGlobalMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
      document.removeEventListener('mouseleave', handleGlobalMouseUp);
    };
  }, [isDragging]);

  const getCroppedImg = (image, scale, position) => {
    if (!image || !containerRef.current) {
      return Promise.reject(new Error('Imagen o contenedor no válidos'));
    }

    const canvas = document.createElement('canvas');
    const container = containerRef.current;
    // Obtenemos el tamaño y posición del contenedor en la pantalla
    const containerRect = container.getBoundingClientRect();
    
    // El contenedor tiene el aspect ratio (proporción) requerido
    // Por ejemplo, si aspect es 16/9, el contenedor será más ancho que alto
    const containerWidth = containerRect.width;
    const containerHeight = containerWidth / (aspect || 1);

    // Calculamos la relación entre el tamaño real de la imagen y el tamaño mostrado
    // Esto es necesario porque la imagen puede estar escalada (zoom)
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    // Obtenemos la densidad de píxeles de la pantalla (para pantallas Retina, etc.)
    const pixelRatio = window.devicePixelRatio || 1;

    // Las dimensiones del área que vamos a recortar son siempre el tamaño del contenedor
    // Multiplicamos por scaleX y scaleY para obtener el tamaño en píxeles reales de la imagen
    const cropWidth = containerWidth * scaleX;
    const cropHeight = containerHeight * scaleY;

    // Calcular el offset en píxeles naturales de la imagen
    // El desplazamiento en píxeles del contenedor se convierte a píxeles de la imagen
    // Consideramos el zoom: cuando hay zoom, el desplazamiento se reduce proporcionalmente
    const offsetX = (position.x / containerWidth) * image.naturalWidth / scale;
    const offsetY = (position.y / containerHeight) * image.naturalHeight / scale;

    // Calcular el punto de inicio del crop en la imagen original
    // La imagen está centrada en el contenedor, así que calculamos desde el centro
    const centerX = image.naturalWidth / 2;
    const centerY = image.naturalHeight / 2;
    
    const sourceX = centerX - (cropWidth / 2) - offsetX;
    const sourceY = centerY - (cropHeight / 2) - offsetY;

    canvas.width = cropWidth * pixelRatio;
    canvas.height = cropHeight * pixelRatio;

    const ctx = canvas.getContext('2d');
    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    ctx.imageSmoothingQuality = 'high';

    // Asegurar que no salgamos de los límites de la imagen
    const finalSourceX = Math.max(0, Math.min(sourceX, image.naturalWidth - cropWidth));
    const finalSourceY = Math.max(0, Math.min(sourceY, image.naturalHeight - cropHeight));
    const finalCropWidth = Math.min(cropWidth, image.naturalWidth - finalSourceX);
    const finalCropHeight = Math.min(cropHeight, image.naturalHeight - finalSourceY);

    ctx.drawImage(
      image,
      finalSourceX,
      finalSourceY,
      finalCropWidth,
      finalCropHeight,
      0,
      0,
      cropWidth,
      cropHeight
    );

    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Canvas is empty'));
            return;
          }
          resolve(blob);
        },
        'image/jpeg',
        0.95
      );
    });
  };

  const handleCropComplete = async () => {
    if (!imgRef.current) {
      return;
    }

    try {
      const croppedImageBlob = await getCroppedImg(imgRef.current, scale, position);
      const croppedImageUrl = URL.createObjectURL(croppedImageBlob);
      onCropComplete(croppedImageBlob, croppedImageUrl);
    } catch (error) {
      console.error('Error al recortar imagen:', error);
      alert('Error al recortar la imagen');
    }
  };

  const handleZoomIn = () => {
    setScale(prev => Math.min(5, prev + 0.1));
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(1, prev - 0.1));
  };

  const handleReset = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleOverlayClick = (e) => {
    // Solo cerrar si se hace clic directamente en el overlay, no en el modal
    if (e.target === e.currentTarget) {
      onCancel();
    }
  };

  const handleModalClick = (e) => {
    // Prevenir que los clics dentro del modal se propaguen al overlay
    e.stopPropagation();
  };

  return (
    <div className="image-cropper-overlay" onClick={handleOverlayClick}>
      <div className="image-cropper-modal" onClick={handleModalClick}>
        <div className="cropper-header">
          <h3>Ajustar Encuadre</h3>
          <p>Arrastra la imagen para moverla y usa la rueda del mouse o los botones para hacer zoom. El encuadre mantiene las proporciones requeridas.</p>
        </div>

        <div 
          className="cropper-content" 
          ref={containerRef}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onClick={(e) => e.stopPropagation()}
          style={{ 
            aspectRatio: aspect || 1,
            cursor: isDragging ? 'grabbing' : 'grab'
          }}
        >
          {imageSrc && (
            <div
              className="cropper-image-wrapper"
              style={{
                transform: `translate(calc(-50% + ${position.x}px), calc(-50% + ${position.y}px)) scale(${scale})`,
                transformOrigin: 'center center',
                transition: isDragging ? 'none' : 'transform 0.1s ease-out',
              }}
            >
              <img
                ref={imgRef}
                src={imageSrc}
                alt="Ajustar encuadre"
                style={{ 
                  display: 'block',
                  maxWidth: 'none',
                  userSelect: 'none',
                  pointerEvents: 'none'
                }}
                draggable={false}
              />
            </div>
          )}
        </div>

        <div className="cropper-controls" onClick={(e) => e.stopPropagation()}>
          <div className="zoom-controls">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleZoomOut();
              }}
              className="zoom-btn"
              disabled={scale <= 1}
            >
              −
            </button>
            <span className="zoom-value">{Math.round(scale * 100)}%</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleZoomIn();
              }}
              className="zoom-btn"
              disabled={scale >= 5}
            >
              +
            </button>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleReset();
            }}
            className="btn btn-secondary btn-sm"
          >
            Resetear
          </button>
        </div>

        <div className="cropper-actions" onClick={(e) => e.stopPropagation()}>
          <button 
            type="button" 
            onClick={(e) => {
              e.stopPropagation();
              onCancel();
            }} 
            className="btn btn-secondary"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleCropComplete();
            }}
            className="btn btn-primary"
          >
            Aplicar Encuadre
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImageCropper;
