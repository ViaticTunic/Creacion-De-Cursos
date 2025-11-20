-- Base de datos para plataforma de cursos - PostgreSQL (Supabase)
-- PASO 1: Ejecuta este archivo completo en Supabase SQL Editor

-- Tabla de usuarios (instructores y estudiantes)
CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    tipo_usuario VARCHAR(20) DEFAULT 'estudiante' CHECK (tipo_usuario IN ('instructor', 'estudiante', 'admin')),
    foto_perfil VARCHAR(255),
    biografia TEXT,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    activo BOOLEAN DEFAULT TRUE
);

-- Tabla de categorías de cursos
CREATE TABLE IF NOT EXISTS categorias (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    icono VARCHAR(50)
);

-- Tabla de cursos
CREATE TABLE IF NOT EXISTS cursos (
    id SERIAL PRIMARY KEY,
    instructor_id INTEGER NOT NULL,
    titulo VARCHAR(200) NOT NULL,
    descripcion TEXT,
    categoria_id INTEGER,
    precio DECIMAL(10, 2) DEFAULT 0.00,
    imagen_portada VARCHAR(255),
    nivel VARCHAR(20) DEFAULT 'principiante' CHECK (nivel IN ('principiante', 'intermedio', 'avanzado')),
    duracion_horas INTEGER DEFAULT 0,
    idioma VARCHAR(50) DEFAULT 'Español',
    estado VARCHAR(20) DEFAULT 'borrador' CHECK (estado IN ('borrador', 'publicado', 'archivado')),
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (instructor_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE SET NULL
);

-- Tabla de módulos/secciones del curso
CREATE TABLE IF NOT EXISTS modulos (
    id SERIAL PRIMARY KEY,
    curso_id INTEGER NOT NULL,
    titulo VARCHAR(200) NOT NULL,
    descripcion TEXT,
    orden INTEGER DEFAULT 0,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (curso_id) REFERENCES cursos(id) ON DELETE CASCADE
);

-- Tabla de lecciones/contenido del curso
CREATE TABLE IF NOT EXISTS lecciones (
    id SERIAL PRIMARY KEY,
    modulo_id INTEGER NOT NULL,
    titulo VARCHAR(200) NOT NULL,
    descripcion TEXT,
    tipo_contenido VARCHAR(20) DEFAULT 'video' CHECK (tipo_contenido IN ('video', 'texto', 'recurso', 'enlace')),
    url_contenido VARCHAR(500),
    duracion_minutos INTEGER DEFAULT 0,
    orden INTEGER DEFAULT 0,
    disponible BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (modulo_id) REFERENCES modulos(id) ON DELETE CASCADE
);

-- Tabla de exámenes/evaluaciones
CREATE TABLE IF NOT EXISTS examenes (
    id SERIAL PRIMARY KEY,
    curso_id INTEGER NOT NULL,
    modulo_id INTEGER,
    titulo VARCHAR(200) NOT NULL,
    descripcion TEXT,
    tiempo_limite_minutos INTEGER,
    intentos_permitidos INTEGER DEFAULT 1,
    porcentaje_aprobacion DECIMAL(5, 2) DEFAULT 70.00,
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (curso_id) REFERENCES cursos(id) ON DELETE CASCADE,
    FOREIGN KEY (modulo_id) REFERENCES modulos(id) ON DELETE SET NULL
);

-- Tabla de preguntas del examen
CREATE TABLE IF NOT EXISTS preguntas (
    id SERIAL PRIMARY KEY,
    examen_id INTEGER NOT NULL,
    pregunta TEXT NOT NULL,
    tipo_pregunta VARCHAR(20) DEFAULT 'opcion_multiple' CHECK (tipo_pregunta IN ('opcion_multiple', 'verdadero_falso', 'texto_libre')),
    puntos DECIMAL(5, 2) DEFAULT 1.00,
    orden INTEGER DEFAULT 0,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (examen_id) REFERENCES examenes(id) ON DELETE CASCADE
);

-- Tabla de opciones de respuesta
CREATE TABLE IF NOT EXISTS opciones_respuesta (
    id SERIAL PRIMARY KEY,
    pregunta_id INTEGER NOT NULL,
    texto_opcion TEXT NOT NULL,
    es_correcta BOOLEAN DEFAULT FALSE,
    orden INTEGER DEFAULT 0,
    FOREIGN KEY (pregunta_id) REFERENCES preguntas(id) ON DELETE CASCADE
);

-- Tabla de recursos del curso (archivos, documentos, etc.)
CREATE TABLE IF NOT EXISTS recursos (
    id SERIAL PRIMARY KEY,
    curso_id INTEGER,
    leccion_id INTEGER,
    nombre VARCHAR(200) NOT NULL,
    tipo_recurso VARCHAR(20) DEFAULT 'archivo' CHECK (tipo_recurso IN ('archivo', 'enlace', 'video')),
    url_recurso VARCHAR(500),
    tamano_archivo INTEGER,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (curso_id) REFERENCES cursos(id) ON DELETE CASCADE,
    FOREIGN KEY (leccion_id) REFERENCES lecciones(id) ON DELETE CASCADE
);

-- Tabla de insignias disponibles
CREATE TABLE IF NOT EXISTS insignias (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT NOT NULL,
    color VARCHAR(50) NOT NULL,
    icono VARCHAR(50),
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de relación curso-insignias (muchos a muchos)
CREATE TABLE IF NOT EXISTS curso_insignias (
    id SERIAL PRIMARY KEY,
    curso_id INTEGER NOT NULL,
    insignia_id INTEGER NOT NULL,
    fecha_asignacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (curso_id) REFERENCES cursos(id) ON DELETE CASCADE,
    FOREIGN KEY (insignia_id) REFERENCES insignias(id) ON DELETE CASCADE,
    UNIQUE (curso_id, insignia_id)
);

-- Insertar categorías
INSERT INTO categorias (nombre, descripcion, icono) VALUES
('Desarrollo de Software Web', 'Desarrollo de aplicaciones web (frontend, backend, fullstack)', '🌐'),
('Desarrollo Móvil', 'Desarrollo de aplicaciones para iOS y Android', '📱'),
('Backend Development', 'Desarrollo de servidores, APIs y arquitectura backend', '⚙️'),
('Frontend Development', 'Desarrollo de interfaces de usuario y experiencia frontend', '🎨'),
('Inteligencia Artificial', 'IA, Machine Learning y algoritmos inteligentes', '🤖'),
('Machine Learning', 'Aprendizaje automático y modelos predictivos', '🧠'),
('Ciencia de Datos', 'Análisis de datos, estadística y visualización', '📊'),
('Big Data', 'Procesamiento y análisis de grandes volúmenes de datos', '💾'),
('Cloud Computing', 'Servicios en la nube (AWS, Azure, GCP)', '☁️'),
('DevOps', 'Desarrollo y operaciones, CI/CD, automatización', '🔄'),
('Infraestructura', 'Infraestructura de TI, servidores y redes', '🏗️'),
('Ciberseguridad', 'Seguridad informática y protección de datos', '🔒'),
('Internet de las Cosas (IoT)', 'Dispositivos conectados y sistemas embebidos', '📡'),
('Robótica', 'Diseño y programación de robots', '🤖'),
('Realidad Aumentada (AR)', 'Desarrollo de aplicaciones de realidad aumentada', '👓'),
('Realidad Virtual (VR)', 'Desarrollo de experiencias de realidad virtual', '🥽'),
('Blockchain', 'Tecnología blockchain y contratos inteligentes', '⛓️'),
('Criptomonedas', 'Trading, inversión y desarrollo con criptomonedas', '₿'),
('Arquitectura de Software', 'Diseño de sistemas y arquitectura de software', '🏛️'),
('Ingeniería de Videojuegos', 'Desarrollo de videojuegos y motores gráficos', '🎮'),
('Sistemas Embebidos', 'Programación de sistemas embebidos y microcontroladores', '🔌'),
('Automatización (RPA)', 'Automatización de procesos robóticos', '⚡'),
('Matemáticas para Programación', 'Álgebra, cálculo y matemáticas aplicadas a la programación', '📐'),
('Física Aplicada', 'Física para simulaciones, robótica y videojuegos', '⚛️'),
('Matemática Discreta', 'Matemáticas discretas y estructuras de datos', '🔢'),
('Teoría de la Computación', 'Algoritmos, complejidad y teoría computacional', '💭'),
('Matemáticas para Data Science', 'Estadística y matemáticas para ciencia de datos', '📈'),
('Diseño UX/UI', 'Experiencia de usuario e interfaces de usuario', '🎨'),
('Diseño Gráfico Digital', 'Diseño gráfico y herramientas digitales', '🖌️'),
('Branding', 'Identidad visual y branding empresarial', '✨'),
('Ilustración Digital', 'Ilustración y arte digital', '🖼️'),
('Animación 2D', 'Animación 2D y motion graphics', '🎬'),
('Animación 3D', 'Modelado y animación 3D', '🎭'),
('Diseño de Productos Digitales', 'Diseño de productos y servicios digitales', '📱'),
('Diseño Web No-Code', 'Diseño web sin código (Webflow, Framer)', '🌐'),
('Fotografía Digital', 'Fotografía y edición de imágenes', '📷'),
('Producción Audiovisual', 'Producción de video, audio y podcast', '🎥'),
('Marketing Digital', 'Estrategias de marketing online y digital', '📢'),
('SEO', 'Optimización para motores de búsqueda', '🔍'),
('Redes Sociales', 'Marketing en redes sociales y community management', '📱'),
('Content Marketing', 'Creación de contenido y estrategias de contenido', '✍️'),
('Publicidad Pagada', 'Paid Media, Google Ads, Facebook Ads', '💰'),
('Analítica Digital', 'Métricas web, Google Analytics y análisis de datos', '📊'),
('Growth Hacking', 'Crecimiento acelerado y marketing de crecimiento', '🚀'),
('Emprendimiento', 'Creación de startups y negocios', '💡'),
('Startups', 'Desarrollo y gestión de startups', '🚀'),
('Modelos de Negocio', 'Diseño y validación de modelos de negocio', '📋'),
('Gestión de Producto', 'Product management y desarrollo de productos', '📦'),
('Ventas', 'Técnicas de ventas y experiencia del cliente', '💼'),
('Innovación Empresarial', 'Innovación y estrategia empresarial', '💡'),
('Finanzas para Startups', 'Finanzas y contabilidad para startups', '💵'),
('Fundraising', 'Levantamiento de capital e inversión', '💸'),
('Habilidades Blandas', 'Comunicación, negociación e inteligencia emocional', '🤝'),
('Liderazgo', 'Liderazgo y gestión de equipos', '👥'),
('Productividad Personal', 'Organización personal y productividad', '⏰'),
('Gestión de Proyectos', 'Metodologías ágiles, Scrum y gestión de proyectos', '📅'),
('Marca Personal', 'Construcción y desarrollo de marca personal', '⭐'),
('Filosofía para Líderes', 'Pensamiento estratégico y filosofía empresarial', '🧘'),
('Diversidad e Inclusión', 'Diversidad e inclusión en el trabajo', '🌈'),
('Inglés Básico', 'Inglés desde nivel básico', '🇬🇧'),
('Inglés Intermedio', 'Inglés nivel intermedio', '🇬🇧'),
('Inglés Avanzado', 'Inglés nivel avanzado y profesional', '🇬🇧'),
('Español', 'Español como idioma extranjero', '🇪🇸'),
('Francés', 'Francés desde básico hasta avanzado', '🇫🇷'),
('Portugués', 'Portugués desde básico hasta avanzado', '🇵🇹'),
('Escritura Profesional', 'Redacción y escritura profesional', '✍️'),
('Oratoria', 'Hablar en público y presentaciones', '🎤'),
('Negociación', 'Negociación y comunicación para negocios', '🤝'),
('Finanzas Personales', 'Gestión de finanzas personales', '💳'),
('Inversión', 'Inversión en bolsa y mercados financieros', '📈'),
('Criptomonedas Trading', 'Trading e inversión en criptomonedas', '₿'),
('Finanzas Corporativas', 'Finanzas empresariales y corporativas', '🏢'),
('Análisis Financiero', 'Análisis y evaluación financiera', '📊'),
('Trading', 'Trading de acciones, forex y derivados', '💹'),
('Planeación Financiera', 'Planeación financiera para el futuro', '📋'),
('Finanzas con IA', 'Aplicación de IA en finanzas', '🤖'),
('Creación de Contenido', 'Creación de contenido para redes sociales', '📱'),
('YouTube', 'Creación y optimización de contenido para YouTube', '▶️'),
('TikTok', 'Creación de contenido para TikTok', '🎵'),
('Instagram', 'Marketing y contenido para Instagram', '📸'),
('Streaming', 'Streaming y transmisiones en vivo', '📺'),
('Podcasting', 'Creación y producción de podcasts', '🎙️'),
('Edición de Video', 'Edición y postproducción de video', '🎬'),
('Guiones para Video', 'Escritura de guiones para video', '📝'),
('Producción Musical', 'Producción y creación de música digital', '🎵'),
('Salud Física', 'Ejercicio, entrenamiento y fitness', '💪'),
('Nutrición', 'Alimentación saludable y nutrición', '🥗'),
('Mindfulness', 'Meditación y mindfulness', '🧘'),
('Salud Mental', 'Bienestar mental y psicológico', '🧠'),
('Primeros Auxilios', 'Primeros auxilios y emergencias', '🆘'),
('Yoga', 'Yoga y prácticas de bienestar', '🧘'),
('Fitness', 'Entrenamiento físico y deporte', '🏋️'),
('Cocina', 'Cocina y gastronomía', '👨‍🍳'),
('Repostería', 'Repostería y panadería', '🍰'),
('Jardinería', 'Jardinería y cultivo', '🌱'),
('Electricidad Básica', 'Electricidad y bricolaje', '⚡'),
('Carpintería', 'Carpintería y trabajo con madera', '🪚'),
('Costura', 'Costura, moda y artesanía', '🧵'),
('Fotografía Analógica', 'Fotografía tradicional y manualidades', '📷'),
('Pintura', 'Pintura y dibujo tradicional', '🖌️'),
('Cerámica', 'Cerámica y alfarería', '🏺'),
('Música', 'Instrumentos musicales y composición', '🎵'),
('Teatro', 'Teatro y actuación', '🎭'),
('Danza', 'Danza y expresión corporal', '💃'),
('Historia del Arte', 'Historia y apreciación del arte', '🖼️'),
('Escritura Creativa', 'Escritura creativa y narrativa', '✍️'),
('Técnicas de Enseñanza', 'Pedagogía y metodologías de enseñanza', '👨‍🏫'),
('Diseño Instruccional', 'Diseño de cursos y materiales educativos', '📚'),
('Tecnología Educativa', 'EdTech y herramientas educativas', '💻'),
('Aprendizaje para Niños', 'Didáctica y juegos educativos para niños', '🧒'),
('Evaluación del Aprendizaje', 'Medición y evaluación educativa', '📊'),
('Energías Renovables', 'Energía solar, eólica y renovables', '☀️'),
('Cambio Climático', 'Cambio climático y sostenibilidad', '🌍'),
('Conservación Ambiental', 'Conservación y protección ambiental', '🌳'),
('Agricultura Sostenible', 'Permacultura y agricultura sostenible', '🌾'),
('Reciclaje', 'Reciclaje y gestión de residuos', '♻️'),
('Seguridad Personal', 'Seguridad personal y autodefensa', '🛡️'),
('Seguridad Web', 'Privacidad y protección de datos online', '🔐'),
('Protección Ambiental', 'Protección del medio ambiente', '🌿'),
('Educación Vial', 'Seguridad vial y conducción', '🚗'),
('Seguridad Doméstica', 'Seguridad en el hogar', '🏠');

-- Crear usuario instructor de ejemplo
-- Email: instructor@demo.com
-- Contraseña: instructor123
INSERT INTO usuarios (nombre, email, password, tipo_usuario, activo) 
VALUES (
  'Instructor Demo', 
  'instructor@demo.com', 
  '$2a$10$9ZDB1rqKcE3SLkZJi9CMW.zC8g0Anw4qcTUOupSbcRYgAVjrjc5ku', 
  'instructor',
  TRUE
);

-- Insertar las 9 insignias disponibles
INSERT INTO insignias (nombre, descripcion, color, icono) VALUES
('CURIOSO', 'Explorar 5 cursos diferentes', '#4A90E2', '🔍'),
('RITMO ESTABLE', 'Completar 10 cursos seguidos', '#50C878', '⏱️'),
('MAESTRO DEL TEMA', 'Puntuación perfecta examen final', '#FFD700', '📖'),
('MENTE BRILLANTE', 'Responde sin equivocarse', '#9B59B6', '💡'),
('VELOCISTA', 'Responde sin dudar', '#E74C3C', '⚡'),
('RACHA PERFECTA', '20 preguntas bien seguidas', '#1ABC9C', '⭐'),
('GENIO EN ASCENSO', 'Mejora nota examen anterior', '#FF8C00', '📈'),
('PRIMER INTENTO, PRIMER LOGRO', 'Pasar examen a la primera', '#95A5A6', '1️⃣'),
('IMPARABLE', '30 días racha perfecta', '#C0392B', '🔥');

