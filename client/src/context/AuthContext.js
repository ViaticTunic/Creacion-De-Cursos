import React, { createContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

axios.defaults.baseURL = API_URL;

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  // Credenciales por defecto para el login automático
  // Como no hay página de login, siempre usamos estas credenciales
  const DEFAULT_EMAIL = 'instructor@demo.com';
  const DEFAULT_PASSWORD = 'instructor123';

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
  }, []);

  const fetchUser = useCallback(async () => {
    try {
      const response = await axios.get('/api/auth/me');
      setUser(response.data);
    } catch (error) {
      console.error('Error al obtener usuario:', error);
      logout();
    } finally {
      setLoading(false);
    }
  }, [logout]);

  const login = useCallback(async (email, password) => {
    try {
      const response = await axios.post('/api/auth/login', { email, password });
      const { token: newToken, user: userData } = response.data;
      
      setToken(newToken);
      setUser(userData);
      localStorage.setItem('token', newToken);
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Error al iniciar sesión'
      };
    }
  }, []);

  // Cuando la aplicación se carga, intentamos hacer login automáticamente
  useEffect(() => {
    const autoLogin = async () => {
      // Primero verificamos si hay un token guardado en el navegador
      const savedToken = localStorage.getItem('token');
      
      // Si hay un token guardado, intentamos usarlo para ver si todavía es válido
      if (savedToken) {
        // Agregamos el token a las peticiones HTTP
        axios.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`;
        try {
          // Intentamos obtener la información del usuario con ese token
          const response = await axios.get('/api/auth/me');
          // Si funciona, guardamos el usuario y el token
          setUser(response.data);
          setToken(savedToken);
          setLoading(false);
          return; // Si el token es válido, no necesitamos hacer login automático
        } catch (error) {
          // Si el token no es válido (expirado, incorrecto, etc.), lo eliminamos
          console.log('Token inválido, iniciando sesión automáticamente...');
          localStorage.removeItem('token');
        }
      }

      // Si no hay token o el token no es válido, hacemos login automático con las credenciales por defecto
      try {
        console.log('Intentando auto-login...');
        const response = await axios.post('/api/auth/login', { 
          email: DEFAULT_EMAIL, 
          password: DEFAULT_PASSWORD 
        });
        const { token: newToken, user: userData } = response.data;
        
        console.log('Auto-login exitoso, token obtenido');
        setToken(newToken);
        setUser(userData);
        localStorage.setItem('token', newToken);
        axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
        setLoading(false);
      } catch (error) {
        console.error('Error en auto-login:', error);
        console.error('Detalles del error:', {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status
        });
        if (error.code === 'ECONNREFUSED' || error.message.includes('Network Error')) {
          console.error('No se pudo conectar al servidor. Verifica que el servidor esté corriendo.');
        }
        setLoading(false);
      }
    };

    autoLogin();
  }, []); // Solo se ejecuta una vez al montar

  const value = {
    user,
    loading,
    login,
    logout,
    fetchUser,
    isAuthenticated: !!token,
    isInstructor: user?.tipo_usuario === 'instructor' || user?.tipo_usuario === 'admin'
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

