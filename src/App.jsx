import { BrowserRouter, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import { getRol, haySesion } from './api';
import Home from './paginas/Home';
import SubirMaterial from './paginas/SubirMaterial';
import VerPuntuaciones from './paginas/VerPuntuaciones';
import ListaAlumnos from './paginas/ListaAlumnos';
import ListaMaterial from './paginas/ListaMaterial';
import Categorias from './paginas/Categorias';
import Login from './paginas/Login';
import Registro from './paginas/Registro';

import './App.css';

// Sin sesión te manda al login; si el rol no tiene permiso, te regresa al menú
function Protegida({ roles, children }) {
  if (!haySesion()) return <Navigate to="/" replace />;
  if (roles && !roles.includes(getRol())) return <Navigate to="/inicio" replace />;
  return children;
}

function MainLayout() {
  const location = useLocation();

  return (
    <div
      className={`app-container ${['/', '/registro'].includes(location.pathname) ? 'app-container--libre' : ''}`}
      style={{ maxWidth: '100%', width: '100%' }}
    >
      {/* El botón de volver no se muestra en el login, el registro ni el menú de inicio */}
      {!['/', '/registro', '/inicio'].includes(location.pathname) && (
        <Link to="/inicio" className="btn-volver">
          ← Volver al Inicio
        </Link>
      )}

      <Routes>
        {/* Públicas */}
        <Route path="/" element={<Login />} />
        <Route path="/registro" element={<Registro />} />

        {/* Con sesión: alumno o docente */}
        <Route path="/inicio" element={<Protegida><Home /></Protegida>} />
        <Route path="/puntuaciones" element={<Protegida><VerPuntuaciones /></Protegida>} />
        <Route path="/material" element={<Protegida><ListaMaterial /></Protegida>} />

        {/* Solo docente */}
        <Route path="/subir-material" element={<Protegida roles={['docente']}><SubirMaterial /></Protegida>} />
        <Route path="/categorias" element={<Protegida roles={['docente']}><Categorias /></Protegida>} />
        <Route path="/alumnos" element={<Protegida roles={['docente']}><ListaAlumnos /></Protegida>} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <MainLayout />
    </BrowserRouter>
  );
}

export default App;