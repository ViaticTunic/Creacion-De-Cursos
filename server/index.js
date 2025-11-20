const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const db = require('./config/database');

// Importar rutas
const authRoutes = require('./routes/auth');
const cursoRoutes = require('./routes/cursos');
const examenRoutes = require('./routes/examenes');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos (imágenes de perfil, cursos y módulos)
app.use('/uploads', express.static('uploads'));

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/cursos', cursoRoutes);
app.use('/api/examenes', examenRoutes);

// Ruta de prueba
app.get('/api/test', (req, res) => {
  res.json({ message: 'API funcionando correctamente' });
});

// Inicializar servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
  
  // Probar conexión a la base de datos
  if (process.env.DATABASE_URL) {
    // PostgreSQL (Supabase)
    db.query('SELECT NOW()', (err, result) => {
      if (err) {
        console.error('Error conectando a PostgreSQL:', err);
      } else {
        console.log('✅ Conexión a PostgreSQL (Supabase) establecida correctamente');
      }
    });
  } else {
    // MySQL (local)
    db.getConnection((err, connection) => {
      if (err) {
        console.error('Error conectando a la base de datos:', err);
      } else {
        console.log('✅ Conexión a MySQL establecida correctamente');
        connection.release();
      }
    });
  }
});

