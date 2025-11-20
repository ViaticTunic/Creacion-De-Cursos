const jwt = require('jsonwebtoken');

// Middleware para verificar token JWT
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ 
      error: 'Token no proporcionado. Acceso denegado.' 
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'tu_secreto_jwt_muy_seguro_aqui');
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ 
      error: 'Token inválido o expirado.' 
    });
  }
};

// Middleware para verificar que el usuario es instructor
const verifyInstructor = (req, res, next) => {
  if (req.user.tipo_usuario !== 'instructor' && req.user.tipo_usuario !== 'admin') {
    return res.status(403).json({ 
      error: 'Acceso denegado. Solo instructores pueden realizar esta acción.' 
    });
  }
  next();
};

module.exports = {
  verifyToken,
  verifyInstructor
};

