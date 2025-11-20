import React, { useContext, useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import UserProfile from './UserProfile';
import './Navbar.css';

const Navbar = () => {
  const { user, fetchUser } = useContext(AuthContext);
  const [showProfile, setShowProfile] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  const handleEditProfile = () => {
    setShowProfile(true);
    setShowDropdown(false);
  };

  const getInitials = (name) => {
    if (!name) return 'I'; // 'I' de Instructor por defecto
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const handleProfileUpdate = async () => {
    if (fetchUser) {
      await fetchUser();
    }
  };

  return (
    <>
      <nav className="navbar">
        <div className="navbar-container">
          <Link to="/dashboard" className="navbar-brand">
            Plataforma de Cursos
          </Link>
          <div className="navbar-menu">
            <Link to="/dashboard" className="navbar-link">
              Dashboard
            </Link>
            <Link to="/cursos" className="navbar-link">
              Mis Cursos
            </Link>
            <Link to="/cursos/crear" className="navbar-link">
              Crear Curso
            </Link>
            {user && (
              <div className="navbar-user" ref={dropdownRef}>
                <div 
                  className="navbar-avatar" 
                  onClick={() => setShowDropdown(!showDropdown)}
                  title={user.nombre || 'Instructor'}
                >
                  {user.foto_perfil ? (
                    <>
                      <img 
                        src={user.foto_perfil.startsWith('http') 
                          ? user.foto_perfil 
                          : user.foto_perfil.startsWith('/')
                          ? `http://localhost:5000${user.foto_perfil}`
                          : `http://localhost:5000/uploads/profiles/${user.foto_perfil}`} 
                        alt={user.nombre || 'Instructor'} 
                        className="avatar-image"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          if (e.target.nextSibling) {
                            e.target.nextSibling.style.display = 'flex';
                          }
                        }}
                      />
                      <div className="avatar-placeholder" style={{display: 'none'}}>
                        {getInitials(user.nombre)}
                      </div>
                    </>
                  ) : (
                    <div className="avatar-placeholder">
                      {getInitials(user.nombre || 'Instructor')}
                    </div>
                  )}
                </div>
                
                {showDropdown && (
                  <div className="user-dropdown">
                    <div className="dropdown-header">
                      <div className="dropdown-user-info">
                        <div className="dropdown-avatar">
                          {user.foto_perfil ? (
                            <img 
                              src={user.foto_perfil.startsWith('http') 
                                ? user.foto_perfil 
                                : user.foto_perfil.startsWith('/')
                                ? `http://localhost:5000${user.foto_perfil}`
                                : `http://localhost:5000/uploads/profiles/${user.foto_perfil}`} 
                              alt={user.nombre || 'Instructor'}
                              onError={(e) => {
                                e.target.style.display = 'none';
                                if (e.target.nextSibling) {
                                  e.target.nextSibling.style.display = 'flex';
                                }
                              }}
                            />
                          ) : null}
                          {!user.foto_perfil && (
                            <div className="dropdown-avatar-placeholder">
                              {getInitials(user.nombre || 'Instructor')}
                            </div>
                          )}
                        </div>
                        <div className="dropdown-user-details">
                          <div className="dropdown-user-name">{user.nombre || 'Instructor'}</div>
                          <div className="dropdown-user-email">{user.email || 'instructor@demo.com'}</div>
                        </div>
                      </div>
                    </div>
                    <div className="dropdown-divider"></div>
                    <div className="dropdown-menu">
                      <button 
                        className="dropdown-item" 
                        onClick={handleEditProfile}
                      >
                        <span className="dropdown-icon">✏️</span>
                        Editar Perfil
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </nav>
      {showProfile && user && (
        <UserProfile
          user={user}
          onClose={() => setShowProfile(false)}
          onUpdate={handleProfileUpdate}
        />
      )}
    </>
  );
};

export default Navbar;

