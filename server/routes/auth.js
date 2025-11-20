const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../config/database');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// Configurar multer para subir imágenes
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/profiles';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
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

// Registro de usuario
router.post('/register', async (req, res) => {
  try {
    const { nombre, email, password, tipo_usuario } = req.body;

    // Validar campos requeridos
    if (!nombre || !email || !password) {
      return res.status(400).json({ error: 'Todos los campos son requeridos' });
    }

    // Verificar si el email ya existe
    const [existingUser] = await db.promise.query(
      'SELECT id FROM usuarios WHERE email = ?',
      [email]
    );

    if (existingUser.length > 0) {
      return res.status(400).json({ error: 'El email ya está registrado' });
    }

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insertar nuevo usuario
    const [result] = await db.promise.query(
      'INSERT INTO usuarios (nombre, email, password, tipo_usuario) VALUES (?, ?, ?, ?)',
      [nombre, email, hashedPassword, tipo_usuario || 'estudiante']
    );

    res.status(201).json({
      message: 'Usuario registrado exitosamente',
      userId: result.insertId
    });
  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({ error: 'Error al registrar usuario' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña son requeridos' });
    }

    // Buscar usuario (primero sin filtro de activo para debug)
    const [users] = await db.promise.query(
      'SELECT id, nombre, email, password, tipo_usuario, activo FROM usuarios WHERE email = ?',
      [email]
    );

    console.log('Usuario encontrado:', users.length > 0 ? 'Sí' : 'No');
    if (users.length > 0) {
      console.log('Usuario activo:', users[0].activo);
      console.log('Email:', users[0].email);
    }

    if (users.length === 0) {
      console.log('Error: Usuario no encontrado con email:', email);
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const user = users[0];

    if (!user.activo) {
      console.log('Error: Usuario inactivo');
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Verificar contraseña
    console.log('Verificando contraseña...');
    const validPassword = await bcrypt.compare(password, user.password);
    console.log('Contraseña válida:', validPassword);

    if (!validPassword) {
      console.log('Error: Contraseña incorrecta');
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Generar token JWT
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        tipo_usuario: user.tipo_usuario
      },
      process.env.JWT_SECRET || 'tu_secreto_jwt_muy_seguro_aqui',
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login exitoso',
      token,
      user: {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        tipo_usuario: user.tipo_usuario
      }
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
});

// Obtener información del usuario actual
router.get('/me', verifyToken, async (req, res) => {
  try {
    const [users] = await db.promise.query(
      'SELECT id, nombre, email, tipo_usuario, foto_perfil, biografia FROM usuarios WHERE id = ?',
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const user = users[0];
    // Si hay foto_perfil, convertirla a URL completa
    if (user.foto_perfil && !user.foto_perfil.startsWith('http')) {
      user.foto_perfil = `/uploads/profiles/${path.basename(user.foto_perfil)}`;
    }

    res.json(user);
  } catch (error) {
    console.error('Error al obtener usuario:', error);
    res.status(500).json({ error: 'Error al obtener información del usuario' });
  }
});

// Actualizar perfil del usuario
router.put('/profile', verifyToken, upload.single('foto_perfil'), async (req, res) => {
  try {
    const { nombre, biografia } = req.body;
    const userId = req.user.id;

    // Validar nombre
    if (!nombre || nombre.trim().length === 0) {
      return res.status(400).json({ error: 'El nombre es requerido' });
    }

    // Validar biografía (máximo 100 palabras)
    if (biografia) {
      const wordCount = biografia.trim().split(/\s+/).filter(word => word.length > 0).length;
      if (wordCount > 100) {
        return res.status(400).json({ error: 'La biografía no puede exceder 100 palabras' });
      }
    }

    let fotoPerfilPath = null;

    // Si se subió una nueva imagen
    if (req.file) {
      fotoPerfilPath = req.file.filename;

      // Eliminar foto anterior si existe
      const [users] = await db.promise.query(
        'SELECT foto_perfil FROM usuarios WHERE id = ?',
        [userId]
      );

      if (users[0].foto_perfil) {
        const oldPhotoPath = path.join('uploads/profiles', path.basename(users[0].foto_perfil));
        if (fs.existsSync(oldPhotoPath)) {
          fs.unlinkSync(oldPhotoPath);
        }
      }
    }

    // Actualizar usuario
    const updateFields = [];
    const updateValues = [];

    if (nombre) {
      updateFields.push('nombre = ?');
      updateValues.push(nombre);
    }

    if (biografia !== undefined) {
      updateFields.push('biografia = ?');
      updateValues.push(biografia || null);
    }

    if (fotoPerfilPath) {
      updateFields.push('foto_perfil = ?');
      updateValues.push(fotoPerfilPath);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No hay campos para actualizar' });
    }

    updateValues.push(userId);

    await db.promise.query(
      `UPDATE usuarios SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    res.json({ message: 'Perfil actualizado exitosamente' });
  } catch (error) {
    console.error('Error al actualizar perfil:', error);
    res.status(500).json({ error: 'Error al actualizar el perfil' });
  }
});

module.exports = router;

