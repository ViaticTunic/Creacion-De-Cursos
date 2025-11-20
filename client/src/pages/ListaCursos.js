import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import BadgeDisplay from '../components/BadgeDisplay';
import './ListaCursos.css';

const ListaCursos = () => {
  const [cursos, setCursos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('todos');

  useEffect(() => {
    fetchCursos();
  }, []);

  const fetchCursos = async () => {
    try {
      const response = await axios.get('/api/cursos/mis-cursos');
      setCursos(response.data);
    } catch (error) {
      console.error('Error al obtener cursos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar este curso?')) {
      return;
    }

    try {
      await axios.delete(`/api/cursos/${id}`);
      fetchCursos();
    } catch (error) {
      console.error('Error al eliminar curso:', error);
      alert('Error al eliminar el curso');
    }
  };

  const cursosFiltrados = filtro === 'todos' 
    ? cursos 
    : cursos.filter(c => c.estado === filtro);

  if (loading) {
    return <div className="loading">Cargando...</div>;
  }

  return (
    <div className="container">
      <div className="lista-cursos-header">
        <h1>📚 Mis Cursos</h1>
        <Link to="/cursos/crear" className="btn btn-primary">
          ➕ Crear Nuevo Curso
        </Link>
      </div>

      <div className="filtros">
        <button
          className={`filtro-btn ${filtro === 'todos' ? 'active' : ''}`}
          onClick={() => setFiltro('todos')}
        >
          Todos ({cursos.length})
        </button>
        <button
          className={`filtro-btn ${filtro === 'publicado' ? 'active' : ''}`}
          onClick={() => setFiltro('publicado')}
        >
          Publicados ({cursos.filter(c => c.estado === 'publicado').length})
        </button>
        <button
          className={`filtro-btn ${filtro === 'borrador' ? 'active' : ''}`}
          onClick={() => setFiltro('borrador')}
        >
          Borradores ({cursos.filter(c => c.estado === 'borrador').length})
        </button>
      </div>

      {cursosFiltrados.length === 0 ? (
        <div className="empty-state">
          <p>No hay cursos {filtro !== 'todos' ? `en estado ${filtro}` : ''}.</p>
        </div>
      ) : (
        <div className="cursos-table">
          <table>
            <thead>
              <tr>
                <th>Título</th>
                <th>Categoría</th>
                <th>Nivel</th>
                <th>Precio</th>
                <th>Estado</th>
                <th>Insignias</th>
                <th>Módulos</th>
                <th>Lecciones</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {cursosFiltrados.map(curso => (
                <tr key={curso.id}>
                  <td>
                    <Link to={`/cursos/editar/${curso.id}`} className="curso-link">
                      {curso.titulo}
                    </Link>
                  </td>
                  <td>{curso.categoria_nombre || 'Sin categoría'}</td>
                  <td>
                    <span className="badge badge-nivel">{curso.nivel}</span>
                  </td>
                  <td>${curso.precio}</td>
                  <td>
                    <span className={`badge badge-${curso.estado}`}>
                      {curso.estado}
                    </span>
                  </td>
                  <td>
                    {curso.insignias && curso.insignias.length > 0 ? (
                      <BadgeDisplay insignias={curso.insignias} size="small" />
                    ) : (
                      <span style={{ color: '#999', fontSize: '12px' }}>Sin insignias</span>
                    )}
                  </td>
                  <td>{curso.total_modulos || 0}</td>
                  <td>{curso.total_lecciones || 0}</td>
                  <td>
                    <div className="acciones">
                      <Link
                        to={`/cursos/editar/${curso.id}`}
                        className="btn btn-secondary btn-sm"
                      >
                        Editar
                      </Link>
                      <button
                        onClick={() => handleDelete(curso.id)}
                        className="btn btn-danger btn-sm"
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ListaCursos;

