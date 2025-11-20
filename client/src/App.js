import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import CrearCurso from './pages/CrearCurso';
import EditarCurso from './pages/EditarCurso';
import ListaCursos from './pages/ListaCursos';
import VerCurso from './pages/VerCurso';
import ResolverExamen from './pages/ResolverExamen';
import CrearExamen from './pages/CrearExamen';
import EditarExamen from './pages/EditarExamen';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Navbar />
          <Routes>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/cursos" element={<ListaCursos />} />
            <Route path="/cursos/crear" element={<CrearCurso />} />
            <Route path="/cursos/editar/:id" element={<EditarCurso />} />
            <Route path="/cursos/ver/:id" element={<VerCurso />} />
            <Route path="/examenes/resolver/:id" element={<ResolverExamen />} />
            <Route path="/examenes/crear/:cursoId" element={<CrearExamen />} />
            <Route path="/examenes/editar/:id" element={<EditarExamen />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;

