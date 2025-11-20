const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../config/database');
const { verifyToken, verifyInstructor } = require('../middleware/auth');

const router = express.Router();

// Configurar multer para subir imágenes de portada
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/courses';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'course-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Solo se permiten imágenes (jpeg, jpg, png, gif, webp)'));
    }
  }
});

// Configurar multer para subir documentos (PDF y Word)
const documentosStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/modulos';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'modulo-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const uploadDocumentos = multer({
  storage: documentosStorage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = file.mimetype === 'application/pdf' || 
                     file.mimetype === 'application/msword' ||
                     file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Solo se permiten documentos PDF o Word (.pdf, .doc, .docx)'));
    }
  }
});

// Ruta pública: Obtener todas las categorías (debe estar ANTES del middleware de autenticación)
router.get('/categorias/list', async (req, res) => {
  try {
    const [categorias] = await db.promise.query(
      'SELECT * FROM categorias ORDER BY nombre ASC'
    );
    res.json(categorias);
  } catch (error) {
    console.error('Error al obtener categorías:', error);
    res.status(500).json({ error: 'Error al obtener categorías' });
  }
});

// Todas las rutas requieren autenticación
router.use(verifyToken);

// Obtener todos los cursos del instructor
router.get('/mis-cursos', verifyInstructor, async (req, res) => {
  try {
    const [cursos] = await db.promise.query(
      `SELECT c.*, cat.nombre as categoria_nombre, 
       COUNT(DISTINCT m.id) as total_modulos,
       COUNT(DISTINCT l.id) as total_lecciones
       FROM cursos c
       LEFT JOIN categorias cat ON c.categoria_id = cat.id
       LEFT JOIN modulos m ON c.id = m.curso_id
       LEFT JOIN lecciones l ON m.id = l.modulo_id
       WHERE c.instructor_id = ?
       GROUP BY c.id
       ORDER BY c.fecha_creacion DESC`,
      [req.user.id]
    );

    // Obtener insignias para cada curso
    for (let curso of cursos) {
      const [insignias] = await db.promise.query(
        `SELECT i.* 
         FROM insignias i
         INNER JOIN curso_insignias ci ON i.id = ci.insignia_id
         WHERE ci.curso_id = ?
         ORDER BY i.nombre ASC`,
        [curso.id]
      );
      curso.insignias = insignias;

      // Convertir ruta de imagen a URL completa
      if (curso.imagen_portada && !curso.imagen_portada.startsWith('http') && !curso.imagen_portada.startsWith('/')) {
        curso.imagen_portada = `/uploads/courses/${curso.imagen_portada}`;
      }
    }

    res.json(cursos);
  } catch (error) {
    console.error('Error al obtener cursos:', error);
    res.status(500).json({ error: 'Error al obtener cursos' });
  }
});

// Obtener un curso por ID
router.get('/:id', verifyInstructor, async (req, res) => {
  try {
    const { id } = req.params;

    const [cursos] = await db.promise.query(
      `SELECT c.*, cat.nombre as categoria_nombre 
       FROM cursos c
       LEFT JOIN categorias cat ON c.categoria_id = cat.id
       WHERE c.id = ? AND c.instructor_id = ?`,
      [id, req.user.id]
    );

    if (cursos.length === 0) {
      return res.status(404).json({ error: 'Curso no encontrado' });
    }

    // Obtener módulos del curso
    const [modulos] = await db.promise.query(
      'SELECT * FROM modulos WHERE curso_id = ? ORDER BY orden ASC',
      [id]
    );

    // Obtener lecciones y exámenes de cada módulo
    for (let modulo of modulos) {
      const [lecciones] = await db.promise.query(
        'SELECT * FROM lecciones WHERE modulo_id = ? ORDER BY orden ASC',
        [modulo.id]
      );
      modulo.lecciones = lecciones;

      // Obtener examen del módulo si existe
      const [examenes] = await db.promise.query(
        'SELECT * FROM examenes WHERE modulo_id = ? LIMIT 1',
        [modulo.id]
      );
      
      if (examenes.length > 0) {
        const examen = examenes[0];
        // Obtener preguntas del examen
        const [preguntas] = await db.promise.query(
          'SELECT * FROM preguntas WHERE examen_id = ? ORDER BY orden ASC',
          [examen.id]
        );
        
        // Obtener opciones de cada pregunta
        for (let pregunta of preguntas) {
          const [opciones] = await db.promise.query(
            'SELECT * FROM opciones_respuesta WHERE pregunta_id = ? ORDER BY orden ASC',
            [pregunta.id]
          );
          pregunta.opciones = opciones;
        }
        
        examen.preguntas = preguntas;
        modulo.examen = examen;
      }
    }

    const curso = cursos[0];
    curso.modulos = modulos;

    // Obtener insignias del curso
    const [insignias] = await db.promise.query(
      `SELECT i.*, ci.fecha_asignacion 
       FROM insignias i
       INNER JOIN curso_insignias ci ON i.id = ci.insignia_id
       WHERE ci.curso_id = ?
       ORDER BY i.nombre ASC`,
      [id]
    );
    curso.insignias = insignias;

    // Convertir ruta de imagen a URL completa
    if (curso.imagen_portada && !curso.imagen_portada.startsWith('http') && !curso.imagen_portada.startsWith('/')) {
      curso.imagen_portada = `/uploads/courses/${curso.imagen_portada}`;
    }

    res.json(curso);
  } catch (error) {
    console.error('Error al obtener curso:', error);
    res.status(500).json({ error: 'Error al obtener curso' });
  }
});

// Crear un nuevo curso
router.post('/', verifyInstructor, upload.single('imagen_portada'), async (req, res) => {
  try {
    const {
      titulo,
      descripcion,
      categoria_id,
      precio,
      nivel,
      duracion_horas,
      idioma,
      estado
    } = req.body;

    if (!titulo) {
      return res.status(400).json({ error: 'El título es requerido' });
    }

    let imagenPortadaPath = null;
    if (req.file) {
      imagenPortadaPath = req.file.filename;
    }

    const [result] = await db.promise.query(
      `INSERT INTO cursos 
       (instructor_id, titulo, descripcion, categoria_id, precio, nivel, duracion_horas, idioma, estado, imagen_portada)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.user.id,
        titulo,
        descripcion || null,
        categoria_id || null,
        precio || 0,
        nivel || 'principiante',
        duracion_horas || 0,
        idioma || 'Español',
        estado || 'borrador',
        imagenPortadaPath
      ]
    );

    res.status(201).json({
      message: 'Curso creado exitosamente',
      cursoId: result.insertId
    });
  } catch (error) {
    console.error('Error al crear curso:', error);
    res.status(500).json({ error: 'Error al crear curso' });
  }
});

// Actualizar un curso
router.put('/:id', verifyInstructor, upload.single('imagen_portada'), async (req, res) => {
  try {
    const { id } = req.params;
    const {
      titulo,
      descripcion,
      categoria_id,
      precio,
      nivel,
      duracion_horas,
      idioma,
      estado
    } = req.body;

    // Verificar que el curso pertenece al instructor
    const [cursos] = await db.promise.query(
      'SELECT id, imagen_portada FROM cursos WHERE id = ? AND instructor_id = ?',
      [id, req.user.id]
    );

    if (cursos.length === 0) {
      return res.status(404).json({ error: 'Curso no encontrado' });
    }

    let imagenPortadaPath = null;
    const updateFields = [];
    const updateValues = [];

    // Si se subió una nueva imagen
    if (req.file) {
      imagenPortadaPath = req.file.filename;
      updateFields.push('imagen_portada = ?');
      updateValues.push(imagenPortadaPath);

      // Eliminar imagen anterior si existe
      if (cursos[0].imagen_portada) {
        const oldImagePath = path.join('uploads/courses', path.basename(cursos[0].imagen_portada));
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
    }

    // Agregar otros campos si están presentes
    if (titulo !== undefined) {
      updateFields.push('titulo = ?');
      updateValues.push(titulo);
    }
    if (descripcion !== undefined) {
      updateFields.push('descripcion = ?');
      updateValues.push(descripcion);
    }
    if (categoria_id !== undefined) {
      updateFields.push('categoria_id = ?');
      updateValues.push(categoria_id);
    }
    if (precio !== undefined) {
      updateFields.push('precio = ?');
      updateValues.push(precio);
    }
    if (nivel !== undefined) {
      updateFields.push('nivel = ?');
      updateValues.push(nivel);
    }
    if (duracion_horas !== undefined) {
      updateFields.push('duracion_horas = ?');
      updateValues.push(duracion_horas);
    }
    if (idioma !== undefined) {
      updateFields.push('idioma = ?');
      updateValues.push(idioma);
    }
    if (estado !== undefined) {
      updateFields.push('estado = ?');
      updateValues.push(estado);
    }

    if (updateFields.length > 0) {
      updateValues.push(id);
      await db.promise.query(
        `UPDATE cursos SET ${updateFields.join(', ')} WHERE id = ?`,
        updateValues
      );
    }

    res.json({ message: 'Curso actualizado exitosamente' });
  } catch (error) {
    console.error('Error al actualizar curso:', error);
    res.status(500).json({ error: 'Error al actualizar curso' });
  }
});

// Eliminar un curso
router.delete('/:id', verifyInstructor, async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar que el curso pertenece al instructor
    const [cursos] = await db.promise.query(
      'SELECT id FROM cursos WHERE id = ? AND instructor_id = ?',
      [id, req.user.id]
    );

    if (cursos.length === 0) {
      return res.status(404).json({ error: 'Curso no encontrado' });
    }

    await db.promise.query('DELETE FROM cursos WHERE id = ?', [id]);

    res.json({ message: 'Curso eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar curso:', error);
    res.status(500).json({ error: 'Error al eliminar curso' });
  }
});

// Crear módulo para un curso
router.post('/:id/modulos', verifyInstructor, async (req, res) => {
  try {
    const { id } = req.params;
    const { titulo, descripcion, orden } = req.body;

    // Verificar que el curso pertenece al instructor
    const [cursos] = await db.promise.query(
      'SELECT id FROM cursos WHERE id = ? AND instructor_id = ?',
      [id, req.user.id]
    );

    if (cursos.length === 0) {
      return res.status(404).json({ error: 'Curso no encontrado' });
    }

    const [result] = await db.promise.query(
      'INSERT INTO modulos (curso_id, titulo, descripcion, orden) VALUES (?, ?, ?, ?)',
      [id, titulo, descripcion || null, orden || 0]
    );

    res.status(201).json({
      message: 'Módulo creado exitosamente',
      moduloId: result.insertId
    });
  } catch (error) {
    console.error('Error al crear módulo:', error);
    res.status(500).json({ error: 'Error al crear módulo' });
  }
});

// Crear lección para un módulo
router.post('/modulos/:moduloId/lecciones', verifyInstructor, async (req, res) => {
  try {
    const { moduloId } = req.params;
    const { titulo, descripcion, tipo_contenido, url_contenido, duracion_minutos, orden } = req.body;

    // Verificar que el módulo pertenece a un curso del instructor
    const [modulos] = await db.promise.query(
      `SELECT m.id FROM modulos m
       INNER JOIN cursos c ON m.curso_id = c.id
       WHERE m.id = ? AND c.instructor_id = ?`,
      [moduloId, req.user.id]
    );

    if (modulos.length === 0) {
      return res.status(404).json({ error: 'Módulo no encontrado' });
    }

    const [result] = await db.promise.query(
      `INSERT INTO lecciones 
       (modulo_id, titulo, descripcion, tipo_contenido, url_contenido, duracion_minutos, orden)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        moduloId,
        titulo,
        descripcion || null,
        tipo_contenido || 'video',
        url_contenido || null,
        duracion_minutos || 0,
        orden || 0
      ]
    );

    res.status(201).json({
      message: 'Lección creada exitosamente',
      leccionId: result.insertId
    });
  } catch (error) {
    console.error('Error al crear lección:', error);
    res.status(500).json({ error: 'Error al crear lección' });
  }
});

// Actualizar módulo
router.put('/modulos/:id', verifyInstructor, async (req, res) => {
  try {
    const { id } = req.params;
    const { titulo, descripcion, orden } = req.body;

    // Verificar que el módulo pertenece a un curso del instructor
    const [modulos] = await db.promise.query(
      `SELECT m.id FROM modulos m
       INNER JOIN cursos c ON m.curso_id = c.id
       WHERE m.id = ? AND c.instructor_id = ?`,
      [id, req.user.id]
    );

    if (modulos.length === 0) {
      return res.status(404).json({ error: 'Módulo no encontrado' });
    }

    await db.promise.query(
      'UPDATE modulos SET titulo = ?, descripcion = ?, orden = ? WHERE id = ?',
      [titulo, descripcion || null, orden || 0, id]
    );

    res.json({ message: 'Módulo actualizado exitosamente' });
  } catch (error) {
    console.error('Error al actualizar módulo:', error);
    res.status(500).json({ error: 'Error al actualizar módulo' });
  }
});

// Eliminar módulo
router.delete('/modulos/:id', verifyInstructor, async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar que el módulo pertenece a un curso del instructor
    const [modulos] = await db.promise.query(
      `SELECT m.id FROM modulos m
       INNER JOIN cursos c ON m.curso_id = c.id
       WHERE m.id = ? AND c.instructor_id = ?`,
      [id, req.user.id]
    );

    if (modulos.length === 0) {
      return res.status(404).json({ error: 'Módulo no encontrado' });
    }

    await db.promise.query('DELETE FROM modulos WHERE id = ?', [id]);

    res.json({ message: 'Módulo eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar módulo:', error);
    res.status(500).json({ error: 'Error al eliminar módulo' });
  }
});

// Actualizar lección
router.put('/lecciones/:id', verifyInstructor, async (req, res) => {
  try {
    const { id } = req.params;
    const { titulo, descripcion, tipo_contenido, url_contenido, duracion_minutos, orden } = req.body;

    // Verificar que la lección pertenece a un módulo de un curso del instructor
    const [lecciones] = await db.promise.query(
      `SELECT l.id FROM lecciones l
       INNER JOIN modulos m ON l.modulo_id = m.id
       INNER JOIN cursos c ON m.curso_id = c.id
       WHERE l.id = ? AND c.instructor_id = ?`,
      [id, req.user.id]
    );

    if (lecciones.length === 0) {
      return res.status(404).json({ error: 'Lección no encontrada' });
    }

    await db.promise.query(
      `UPDATE lecciones 
       SET titulo = ?, descripcion = ?, tipo_contenido = ?, url_contenido = ?, duracion_minutos = ?, orden = ?
       WHERE id = ?`,
      [titulo, descripcion || null, tipo_contenido || 'video', url_contenido || null, duracion_minutos || 0, orden || 0, id]
    );

    res.json({ message: 'Lección actualizada exitosamente' });
  } catch (error) {
    console.error('Error al actualizar lección:', error);
    res.status(500).json({ error: 'Error al actualizar lección' });
  }
});

// Eliminar lección
router.delete('/lecciones/:id', verifyInstructor, async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar que la lección pertenece a un módulo de un curso del instructor
    const [lecciones] = await db.promise.query(
      `SELECT l.id, l.url_contenido FROM lecciones l
       INNER JOIN modulos m ON l.modulo_id = m.id
       INNER JOIN cursos c ON m.curso_id = c.id
       WHERE l.id = ? AND c.instructor_id = ?`,
      [id, req.user.id]
    );

    if (lecciones.length === 0) {
      return res.status(404).json({ error: 'Lección no encontrada' });
    }

    // Si la lección tiene un archivo, eliminarlo
    const leccion = lecciones[0];
    if (leccion.url_contenido && leccion.url_contenido.startsWith('/uploads/modulos/')) {
      const filePath = leccion.url_contenido.replace('/uploads/modulos/', 'uploads/modulos/');
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (error) {
          console.error('Error al eliminar archivo:', error);
        }
      }
    }

    await db.promise.query('DELETE FROM lecciones WHERE id = ?', [id]);

    res.json({ message: 'Lección eliminada exitosamente' });
  } catch (error) {
    console.error('Error al eliminar lección:', error);
    res.status(500).json({ error: 'Error al eliminar lección' });
  }
});

// Crear contenido (lección con archivo) para un módulo
router.post('/modulos/:moduloId/contenido', verifyInstructor, uploadDocumentos.single('archivo'), async (req, res) => {
  try {
    const { moduloId } = req.params;
    const { titulo, descripcion, tipo_contenido, orden } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: 'No se proporcionó ningún archivo' });
    }

    // Verificar que el módulo pertenece a un curso del instructor
    const [modulos] = await db.promise.query(
      `SELECT m.id FROM modulos m
       INNER JOIN cursos c ON m.curso_id = c.id
       WHERE m.id = ? AND c.instructor_id = ?`,
      [moduloId, req.user.id]
    );

    if (modulos.length === 0) {
      // Eliminar archivo subido si el módulo no existe
      if (req.file.path) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(404).json({ error: 'Módulo no encontrado' });
    }

    // Construir URL del archivo
    const urlContenido = `/uploads/modulos/${req.file.filename}`;

    // Determinar tipo de contenido basado en la extensión
    const fileExt = path.extname(req.file.originalname).toLowerCase();
    let tipoContenidoFinal = tipo_contenido || 'recurso';
    if (fileExt === '.pdf') {
      tipoContenidoFinal = 'recurso';
    } else if (fileExt === '.doc' || fileExt === '.docx') {
      tipoContenidoFinal = 'recurso';
    }

    const [result] = await db.promise.query(
      `INSERT INTO lecciones 
       (modulo_id, titulo, descripcion, tipo_contenido, url_contenido, duracion_minutos, orden)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        moduloId,
        titulo || req.file.originalname,
        descripcion || null,
        tipoContenidoFinal,
        urlContenido,
        0,
        orden || 0
      ]
    );

    res.status(201).json({
      message: 'Contenido creado exitosamente',
      leccionId: result.insertId,
      url: urlContenido
    });
  } catch (error) {
    console.error('Error al crear contenido:', error);
    // Eliminar archivo si hubo error
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkError) {
        console.error('Error al eliminar archivo:', unlinkError);
      }
    }
    res.status(500).json({ error: 'Error al crear contenido' });
  }
});

// Obtener todas las insignias disponibles
router.get('/insignias/list', async (req, res) => {
  try {
    const [insignias] = await db.promise.query(
      'SELECT * FROM insignias ORDER BY nombre ASC'
    );
    res.json(insignias);
  } catch (error) {
    console.error('Error al obtener insignias:', error);
    res.status(500).json({ error: 'Error al obtener insignias' });
  }
});

// Obtener insignias de un curso específico
router.get('/:id/insignias', verifyInstructor, async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar que el curso pertenece al instructor
    const [cursos] = await db.promise.query(
      'SELECT id FROM cursos WHERE id = ? AND instructor_id = ?',
      [id, req.user.id]
    );

    if (cursos.length === 0) {
      return res.status(404).json({ error: 'Curso no encontrado' });
    }

    const [insignias] = await db.promise.query(
      `SELECT i.*, ci.fecha_asignacion 
       FROM insignias i
       INNER JOIN curso_insignias ci ON i.id = ci.insignia_id
       WHERE ci.curso_id = ?
       ORDER BY i.nombre ASC`,
      [id]
    );

    res.json(insignias);
  } catch (error) {
    console.error('Error al obtener insignias del curso:', error);
    res.status(500).json({ error: 'Error al obtener insignias del curso' });
  }
});

// Asignar insignias a un curso
router.post('/:id/insignias', verifyInstructor, async (req, res) => {
  try {
    const { id } = req.params;
    const { insignia_ids } = req.body; // Array de IDs de insignias

    if (!Array.isArray(insignia_ids)) {
      return res.status(400).json({ error: 'insignia_ids debe ser un array' });
    }

    // Verificar que el curso pertenece al instructor
    const [cursos] = await db.promise.query(
      'SELECT id FROM cursos WHERE id = ? AND instructor_id = ?',
      [id, req.user.id]
    );

    if (cursos.length === 0) {
      return res.status(404).json({ error: 'Curso no encontrado' });
    }

    // Eliminar todas las insignias actuales del curso
    await db.promise.query(
      'DELETE FROM curso_insignias WHERE curso_id = ?',
      [id]
    );

    // Insertar las nuevas insignias
    if (insignia_ids.length > 0) {
      const values = insignia_ids.map(insigniaId => [id, insigniaId]);
      await db.promise.query(
        'INSERT INTO curso_insignias (curso_id, insignia_id) VALUES ?',
        [values]
      );
    }

    res.json({ message: 'Insignias asignadas exitosamente' });
  } catch (error) {
    console.error('Error al asignar insignias:', error);
    res.status(500).json({ error: 'Error al asignar insignias' });
  }
});

module.exports = router;

