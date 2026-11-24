import { Link, useNavigate } from 'react-router-dom';
import { cerrarSesion, getRol } from '../api';
import './Home.css';

export default function Home() {
  const navigate = useNavigate();
  const esDocente = getRol() === 'docente';

  const salir = () => {
    cerrarSesion();
    navigate('/', { replace: true });
  };

  return (
    <div className="home-container">
      <h1>Portal de Inglés</h1>
      <p className="home-subtitulo">Elige una sección para continuar</p>

      {esDocente && (
        <div className="home-grupo">
          <h2>Material y Categorías</h2>
          <div className="bloques-container">
            <Link to="/categorias" className="bloque-link">
              <strong>Categorías</strong>
              <span>Gestionar niveles y temas</span>
            </Link>

            <Link to="/material" className="bloque-link">
              <strong>Lista de Material</strong>
              <span>Ver palabras por categoría</span>
            </Link>

            <Link to="/subir-material" className="bloque-link">
              <strong>Subir Material</strong>
              <span>Agregar nuevo vocabulario</span>
            </Link>
          </div>
        </div>
      )}

      <div className="home-grupo">
        <h2>{esDocente ? 'Alumnos y Calificaciones' : 'Mi Avance'}</h2>
        <div className="bloques-container">
          {esDocente && (
            <Link to="/alumnos" className="bloque-link">
              <strong>Lista de Alumnos</strong>
              <span>Niveles y permisos</span>
            </Link>
          )}

          <Link to="/puntuaciones" className="bloque-link">
            <strong>Ver Puntuaciones</strong>
            <span>{esDocente ? 'Historial y notas finales' : 'Mis calificaciones'}</span>
          </Link>

          {!esDocente && (
            <Link to="/material" className="bloque-link">
              <strong>Lista de Material</strong>
              <span>Repasar vocabulario</span>
            </Link>
          )}
        </div>
      </div>

      <button type="button" className="btn-salir" onClick={salir}>
        Cerrar sesión
      </button>
    </div>
  );
}