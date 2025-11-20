const express = require('express');
const db = require('../config/database');
const { verifyToken, verifyInstructor } = require('../middleware/auth');

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(verifyToken);
router.use(verifyInstructor);

// Obtener todos los exámenes de un curso
router.get('/curso/:cursoId', async (req, res) => {
  try {
    const { cursoId } = req.params;

    // Verificar que el curso pertenece al instructor
    const [cursos] = await db.promise.query(
      'SELECT id FROM cursos WHERE id = ? AND instructor_id = ?',
      [cursoId, req.user.id]
    );

    if (cursos.length === 0) {
      return res.status(404).json({ error: 'Curso no encontrado' });
    }

    const [examenes] = await db.promise.query(
      'SELECT * FROM examenes WHERE curso_id = ? ORDER BY fecha_creacion DESC',
      [cursoId]
    );

    res.json(examenes);
  } catch (error) {
    console.error('Error al obtener exámenes:', error);
    res.status(500).json({ error: 'Error al obtener exámenes' });
  }
});

// Obtener un examen por ID con sus preguntas
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Obtener examen
    const [examenes] = await db.promise.query(
      `SELECT e.*, c.titulo as curso_titulo 
       FROM examenes e
       INNER JOIN cursos c ON e.curso_id = c.id
       WHERE e.id = ? AND c.instructor_id = ?`,
      [id, req.user.id]
    );

    if (examenes.length === 0) {
      return res.status(404).json({ error: 'Examen no encontrado' });
    }

    const examen = examenes[0];

    // Obtener preguntas del examen
    const [preguntas] = await db.promise.query(
      'SELECT * FROM preguntas WHERE examen_id = ? ORDER BY orden ASC',
      [id]
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

    res.json(examen);
  } catch (error) {
    console.error('Error al obtener examen:', error);
    res.status(500).json({ error: 'Error al obtener examen' });
  }
});

// Crear un nuevo examen
router.post('/', async (req, res) => {
  try {
    const {
      curso_id,
      modulo_id,
      titulo,
      descripcion,
      tiempo_limite_minutos,
      intentos_permitidos,
      porcentaje_aprobacion
    } = req.body;

    if (!curso_id || !titulo) {
      return res.status(400).json({ error: 'Curso ID y título son requeridos' });
    }

    // Si se proporciona modulo_id, verificar que pertenece al curso del instructor
    if (modulo_id) {
      const [modulos] = await db.promise.query(
        `SELECT m.id FROM modulos m
         INNER JOIN cursos c ON m.curso_id = c.id
         WHERE m.id = ? AND c.id = ? AND c.instructor_id = ?`,
        [modulo_id, curso_id, req.user.id]
      );

      if (modulos.length === 0) {
        return res.status(404).json({ error: 'Módulo no encontrado o no pertenece al curso' });
      }
    }

    // Verificar que el curso pertenece al instructor
    const [cursos] = await db.promise.query(
      'SELECT id FROM cursos WHERE id = ? AND instructor_id = ?',
      [curso_id, req.user.id]
    );

    if (cursos.length === 0) {
      return res.status(404).json({ error: 'Curso no encontrado' });
    }

    const [result] = await db.promise.query(
      `INSERT INTO examenes 
       (curso_id, modulo_id, titulo, descripcion, tiempo_limite_minutos, intentos_permitidos, porcentaje_aprobacion)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        curso_id,
        modulo_id || null,
        titulo,
        descripcion || null,
        tiempo_limite_minutos || null,
        intentos_permitidos || 1,
        porcentaje_aprobacion || 70.00
      ]
    );

    res.status(201).json({
      message: 'Examen creado exitosamente',
      examenId: result.insertId
    });
  } catch (error) {
    console.error('Error al crear examen:', error);
    res.status(500).json({ error: 'Error al crear examen' });
  }
});

// Actualizar un examen
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      titulo,
      descripcion,
      tiempo_limite_minutos,
      intentos_permitidos,
      porcentaje_aprobacion,
      activo
    } = req.body;

    // Verificar que el examen pertenece a un curso del instructor
    const [examenes] = await db.promise.query(
      `SELECT e.id FROM examenes e
       INNER JOIN cursos c ON e.curso_id = c.id
       WHERE e.id = ? AND c.instructor_id = ?`,
      [id, req.user.id]
    );

    if (examenes.length === 0) {
      return res.status(404).json({ error: 'Examen no encontrado' });
    }

    await db.promise.query(
      `UPDATE examenes SET
       titulo = COALESCE(?, titulo),
       descripcion = COALESCE(?, descripcion),
       tiempo_limite_minutos = COALESCE(?, tiempo_limite_minutos),
       intentos_permitidos = COALESCE(?, intentos_permitidos),
       porcentaje_aprobacion = COALESCE(?, porcentaje_aprobacion),
       activo = COALESCE(?, activo)
       WHERE id = ?`,
      [
        titulo,
        descripcion,
        tiempo_limite_minutos,
        intentos_permitidos,
        porcentaje_aprobacion,
        activo,
        id
      ]
    );

    res.json({ message: 'Examen actualizado exitosamente' });
  } catch (error) {
    console.error('Error al actualizar examen:', error);
    res.status(500).json({ error: 'Error al actualizar examen' });
  }
});

// Eliminar un examen
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar que el examen pertenece a un curso del instructor
    const [examenes] = await db.promise.query(
      `SELECT e.id FROM examenes e
       INNER JOIN cursos c ON e.curso_id = c.id
       WHERE e.id = ? AND c.instructor_id = ?`,
      [id, req.user.id]
    );

    if (examenes.length === 0) {
      return res.status(404).json({ error: 'Examen no encontrado' });
    }

    await db.promise.query('DELETE FROM examenes WHERE id = ?', [id]);

    res.json({ message: 'Examen eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar examen:', error);
    res.status(500).json({ error: 'Error al eliminar examen' });
  }
});

// Crear una pregunta para un examen
router.post('/:examenId/preguntas', async (req, res) => {
  try {
    const { examenId } = req.params;
    const { pregunta, tipo_pregunta, puntos, orden } = req.body;

    // Verificar que el examen pertenece a un curso del instructor
    const [examenes] = await db.promise.query(
      `SELECT e.id FROM examenes e
       INNER JOIN cursos c ON e.curso_id = c.id
       WHERE e.id = ? AND c.instructor_id = ?`,
      [examenId, req.user.id]
    );

    if (examenes.length === 0) {
      return res.status(404).json({ error: 'Examen no encontrado' });
    }

    const [result] = await db.promise.query(
      `INSERT INTO preguntas 
       (examen_id, pregunta, tipo_pregunta, puntos, orden)
       VALUES (?, ?, ?, ?, ?)`,
      [
        examenId,
        pregunta,
        tipo_pregunta || 'opcion_multiple',
        puntos || 1.00,
        orden || 0
      ]
    );

    res.status(201).json({
      message: 'Pregunta creada exitosamente',
      preguntaId: result.insertId
    });
  } catch (error) {
    console.error('Error al crear pregunta:', error);
    res.status(500).json({ error: 'Error al crear pregunta' });
  }
});

// Crear opciones de respuesta para una pregunta
router.post('/preguntas/:preguntaId/opciones', async (req, res) => {
  try {
    const { preguntaId } = req.params;
    const { opciones } = req.body; // Array de opciones: [{texto_opcion, es_correcta, orden}]

    if (!Array.isArray(opciones) || opciones.length === 0) {
      return res.status(400).json({ error: 'Se requiere un array de opciones' });
    }

    // Verificar que la pregunta pertenece a un examen del instructor
    const [preguntas] = await db.promise.query(
      `SELECT p.id FROM preguntas p
       INNER JOIN examenes e ON p.examen_id = e.id
       INNER JOIN cursos c ON e.curso_id = c.id
       WHERE p.id = ? AND c.instructor_id = ?`,
      [preguntaId, req.user.id]
    );

    if (preguntas.length === 0) {
      return res.status(404).json({ error: 'Pregunta no encontrada' });
    }

    // Insertar todas las opciones
    const values = opciones.map(op => [
      preguntaId,
      op.texto_opcion,
      op.es_correcta || false,
      op.orden || 0
    ]);

    await db.promise.query(
      `INSERT INTO opciones_respuesta 
       (pregunta_id, texto_opcion, es_correcta, orden)
       VALUES ?`,
      [values]
    );

    res.status(201).json({ message: 'Opciones creadas exitosamente' });
  } catch (error) {
    console.error('Error al crear opciones:', error);
    res.status(500).json({ error: 'Error al crear opciones' });
  }
});

// Actualizar una pregunta
router.put('/preguntas/:preguntaId', async (req, res) => {
  try {
    const { preguntaId } = req.params;
    const { pregunta, tipo_pregunta, puntos, orden } = req.body;

    // Verificar que la pregunta pertenece a un examen del instructor
    const [preguntas] = await db.promise.query(
      `SELECT p.id FROM preguntas p
       INNER JOIN examenes e ON p.examen_id = e.id
       INNER JOIN cursos c ON e.curso_id = c.id
       WHERE p.id = ? AND c.instructor_id = ?`,
      [preguntaId, req.user.id]
    );

    if (preguntas.length === 0) {
      return res.status(404).json({ error: 'Pregunta no encontrada' });
    }

    await db.promise.query(
      `UPDATE preguntas SET
       pregunta = COALESCE(?, pregunta),
       tipo_pregunta = COALESCE(?, tipo_pregunta),
       puntos = COALESCE(?, puntos),
       orden = COALESCE(?, orden)
       WHERE id = ?`,
      [pregunta, tipo_pregunta, puntos, orden, preguntaId]
    );

    res.json({ message: 'Pregunta actualizada exitosamente' });
  } catch (error) {
    console.error('Error al actualizar pregunta:', error);
    res.status(500).json({ error: 'Error al actualizar pregunta' });
  }
});

// Eliminar una pregunta
router.delete('/preguntas/:preguntaId', async (req, res) => {
  try {
    const { preguntaId } = req.params;

    // Verificar que la pregunta pertenece a un examen del instructor
    const [preguntas] = await db.promise.query(
      `SELECT p.id FROM preguntas p
       INNER JOIN examenes e ON p.examen_id = e.id
       INNER JOIN cursos c ON e.curso_id = c.id
       WHERE p.id = ? AND c.instructor_id = ?`,
      [preguntaId, req.user.id]
    );

    if (preguntas.length === 0) {
      return res.status(404).json({ error: 'Pregunta no encontrada' });
    }

    await db.promise.query('DELETE FROM preguntas WHERE id = ?', [preguntaId]);

    res.json({ message: 'Pregunta eliminada exitosamente' });
  } catch (error) {
    console.error('Error al eliminar pregunta:', error);
    res.status(500).json({ error: 'Error al eliminar pregunta' });
  }
});

module.exports = router;

