// Importamos las herramientas que necesitamos de React y otras librerías
// useState: para guardar información que puede cambiar (como los cursos)
// useEffect: para hacer cosas cuando la página se carga (como traer los cursos del servidor)
// useContext: para saber si el usuario está logueado
import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom'; // Para crear enlaces entre páginas
import axios from 'axios'; // Para hacer peticiones al servidor (traer datos, enviar datos)
import { AuthContext } from '../context/AuthContext'; // Para saber si el usuario está autenticado
import BadgeDisplay from '../components/BadgeDisplay'; // Componente para mostrar las insignias
import { getImageUrl } from '../utils/api'; // Función para construir URLs de imágenes
import './Dashboard.css'; // Los estilos de esta página

// Este es el componente principal del Dashboard (la página principal del instructor)
const Dashboard = () => {
  // Obtenemos del contexto si el usuario está cargando o si está autenticado
  const { loading: authLoading, isAuthenticated } = useContext(AuthContext);
  
  // Guardamos la lista de cursos que tiene el instructor
  const [cursos, setCursos] = useState([]);
  
  // Indica si estamos cargando los datos (mostrar "Cargando...")
  const [loading, setLoading] = useState(true);
  
  // Guardamos las estadísticas: cuántos cursos hay en total, cuántos publicados, cuántos borradores
  const [stats, setStats] = useState({
    total: 0,
    publicados: 0,
    borradores: 0
  });

  // Este useEffect se ejecuta cuando la página se carga o cuando cambia el estado de autenticación
  // Es como decir: "Cuando la página cargue, haz esto..."
  useEffect(() => {
    // Primero esperamos a que termine de verificar si el usuario está logueado
    // Si ya terminó de cargar Y el usuario está autenticado, entonces traemos los cursos
    if (!authLoading && isAuthenticated) {
      fetchCursos();
    } else if (!authLoading && !isAuthenticated) {
      // Si no está autenticado, dejamos de mostrar "Cargando..."
      setLoading(false);
    }
  }, [authLoading, isAuthenticated]); // Se ejecuta cuando cambian estos valores

  // Esta función va al servidor y pide todos los cursos del instructor
  const fetchCursos = async () => {
    try {
      // Hacemos una petición GET al servidor para traer los cursos
      // El servidor sabe qué cursos traer porque usa el token del usuario logueado
      const response = await axios.get('/api/cursos/mis-cursos');
      
      // Guardamos los cursos que nos devolvió el servidor
      setCursos(response.data);
      
      // Contamos cuántos cursos están publicados (estado === 'publicado')
      const publicados = response.data.filter(c => c.estado === 'publicado').length;
      
      // Contamos cuántos son borradores (estado === 'borrador')
      const borradores = response.data.filter(c => c.estado === 'borrador').length;
      
      // Guardamos las estadísticas para mostrarlas en las tarjetas de arriba
      setStats({
        total: response.data.length, // Total de cursos
        publicados, // Cuántos publicados
        borradores // Cuántos borradores
      });
    } catch (error) {
      // Si algo sale mal (servidor caído, error de red, etc.), mostramos un error
      console.error('Error al obtener cursos:', error);
      alert('Error al cargar los cursos. Verifica que el servidor esté corriendo.');
    } finally {
      // Sin importar si salió bien o mal, dejamos de mostrar "Cargando..."
      setLoading(false);
    }
  };

  // Si todavía estamos cargando los datos, mostramos un mensaje de "Cargando..."
  if (loading) {
    return <div className="loading">Cargando...</div>;
  }

  // Esto es lo que se muestra en la pantalla (el HTML/JSX)
  return (
    <div className="container">
      {/* Encabezado del dashboard con el título y botón para crear curso */}
      <div className="dashboard-header">
        <h1>🎯 Dashboard - Instructor</h1>
        {/* Link es como un <a> pero de React Router, navega sin recargar la página */}
        <Link to="/cursos/crear" className="btn btn-primary">
          ➕ Crear Nuevo Curso
        </Link>
      </div>

      {/* Tarjetas con estadísticas: Total, Publicados, Borradores */}
      <div className="stats-grid">
        <div className="stat-card">
          <h3>📚 Total de Cursos</h3>
          {/* Mostramos el número total de cursos */}
          <p className="stat-number">{stats.total}</p>
        </div>
        <div className="stat-card">
          <h3>✅ Cursos Publicados</h3>
          {/* Mostramos cuántos cursos están publicados */}
          <p className="stat-number">{stats.publicados}</p>
        </div>
        <div className="stat-card">
          <h3>📝 Borradores</h3>
          {/* Mostramos cuántos cursos son borradores */}
          <p className="stat-number">{stats.borradores}</p>
        </div>
      </div>

      {/* Sección donde se muestran los cursos */}
      <div className="cursos-section">
        <h2>🎓 Mis Cursos Recientes</h2>
        
        {/* Si no hay cursos, mostramos un mensaje invitando a crear uno */}
        {cursos.length === 0 ? (
          <div className="empty-state">
            <div style={{fontSize: '64px', marginBottom: '20px'}}>📚</div>
            <p>No tienes cursos aún. ¡Crea tu primer curso!</p>
            <Link to="/cursos/crear" className="btn btn-primary">
              ➕ Crear Curso
            </Link>
          </div>
        ) : (
          /* Si hay cursos, los mostramos en una grilla (grid) */
          <div className="cursos-grid">
            {/* 
              map() recorre cada curso y crea una tarjeta para cada uno
              slice(0, 6) solo toma los primeros 6 cursos para no saturar la pantalla
            */}
            {cursos.slice(0, 6).map(curso => (
              <div key={curso.id} className="curso-card">
                {/* Al hacer clic en la tarjeta, va a la página de visualización del curso */}
                <Link to={`/cursos/ver/${curso.id}`} className="curso-card-link">
                  {/* Si el curso tiene imagen de portada, la mostramos */}
                  {curso.imagen_portada && (
                    <div className="curso-image">
                      {/* 
                        Construimos la URL de la imagen:
                        - Si ya es una URL completa (empieza con http), la usamos tal cual
                        - Si empieza con /, le agregamos localhost:5000
                        - Si no, asumimos que está en la carpeta uploads/courses
                      */}
                      <img 
                        src={getImageUrl(curso.imagen_portada, 'courses')} 
                        alt={curso.titulo}
                      />
                    </div>
                  )}
                  {/* Encabezado de la tarjeta con título y estado (publicado/borrador) */}
                  <div className="curso-header">
                    <h3>{curso.titulo}</h3>
                    {/* Badge que cambia de color según el estado del curso */}
                    <span className={`badge badge-${curso.estado}`}>
                      {curso.estado}
                    </span>
                  </div>
                  {/* Descripción del curso, o "Sin descripción" si no tiene */}
                  <p className="curso-descripcion">
                    {curso.descripcion || 'Sin descripción'}
                  </p>
                  {/* Información adicional: nivel y precio */}
                  <div className="curso-info">
                    <span>Nivel: {curso.nivel}</span>
                    <span>Precio: ${curso.precio}</span>
                  </div>
                  {/* Si el curso tiene insignias, las mostramos */}
                  {curso.insignias && curso.insignias.length > 0 && (
                    <div className="curso-insignias">
                      <BadgeDisplay insignias={curso.insignias} size="small" />
                    </div>
                  )}
                </Link>
                {/* Botón para editar el curso */}
                <div className="curso-actions">
                  {/* stopPropagation evita que al hacer clic en "Editar" también se active el link de la tarjeta */}
                  <Link to={`/cursos/editar/${curso.id}`} className="btn btn-secondary" onClick={(e) => e.stopPropagation()}>
                    Editar
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Exportamos el componente para que pueda ser usado en otras partes de la aplicación
export default Dashboard;

