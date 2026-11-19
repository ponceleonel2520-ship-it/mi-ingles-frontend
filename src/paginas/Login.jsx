import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiFetch } from "../api";
import "./Login.css";

const ROLES = {
  alumno: {
    titulo: "Alumno",
    descripcion: "Practica vocabulario y revisa tus calificaciones",
    campoLabel: "Matrícula",
    campoPlaceholder: "Ej. 123456789",
    inputMode: "numeric",
    icono: (
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <path d="M24 8 4 18l20 10 20-10L24 8Z" />
        <path d="M12 23v10c0 3 5.4 7 12 7s12-4 12-7V23" />
        <path d="M44 18v12" />
      </svg>
    ),
  },
  docente: {
    titulo: "Docente",
    descripcion: "Administra materiales, categorías y grupos",
    campoLabel: "Clave de docente",
    campoPlaceholder: "Ej. DOC000001",
    inputMode: "text",
    icono: (
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <rect x="5" y="8" width="38" height="26" rx="3" />
        <path d="M14 17h20M14 24h12" />
        <path d="M17 42l7-8 7 8" />
      </svg>
    ),
  },
};

export default function Login({ onLogin }) {
  const navigate = useNavigate();
  const [rol, setRol] = useState("alumno");
  const [usuario, setUsuario] = useState("");
  const [password, setPassword] = useState("");
  const [verPassword, setVerPassword] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  const rolActual = ROLES[rol];

  const cambiarRol = (nuevoRol) => {
    setRol(nuevoRol);
    setUsuario("");
    setPassword("");
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!usuario.trim() || !password) {
      setError(`Escribe tu ${rolActual.campoLabel.toLowerCase()} y tu contraseña.`);
      return;
    }

    setCargando(true);
    try {
      const body = new URLSearchParams({
        username: usuario.trim(),
        password,
        tipo: rol,
      });

      const datos = await apiFetch("/auth/login", {
        method: "POST",
        body,
      });

      if (!datos || !datos.token) {
        setError("El servidor no devolvió un token. Revisa el backend.");
        return;
      }

      localStorage.setItem("token", datos.token);
      localStorage.setItem("rol", rol);
      if (onLogin) onLogin({ token: datos.token, rol });
      navigate("/inicio", { replace: true });
    } catch (e) {
      setError(e.message);
    } finally {
      setCargando(false);
    }
  };

  return (
    <main className="auth" data-rol={rol}>
      <section className="auth__tarjeta">
        <aside className="auth__lado">
          <h1>Bienvenido a English Cards</h1>
          <p>Elige cómo quieres ingresar</p>

          <div className="roles" role="radiogroup" aria-label="Tipo de usuario">
            {Object.entries(ROLES).map(([clave, datos]) => (
              <button
                key={clave}
                type="button"
                role="radio"
                aria-checked={rol === clave}
                className={`rol rol--${clave} ${rol === clave ? "rol--activo" : ""}`}
                onClick={() => cambiarRol(clave)}
              >
                <span className="rol__icono">{datos.icono}</span>
                <span className="rol__titulo">{datos.titulo}</span>
                <span className="rol__texto">{datos.descripcion}</span>
              </button>
            ))}
          </div>
        </aside>

        <div className="auth__form">
          <form className="form" onSubmit={handleSubmit} noValidate>
            <div className="campo">
              <label htmlFor="usuario">{rolActual.campoLabel}</label>
              <div className="campo__entrada">
                <span className="campo__icono" aria-hidden="true">
                  <svg viewBox="0 0 24 24">
                    <rect x="2.5" y="5" width="19" height="14" rx="2.5" />
                    <circle cx="8.5" cy="11" r="2" />
                    <path d="M5.5 16c.6-1.5 1.8-2.2 3-2.2s2.4.7 3 2.2" />
                    <path d="M14.5 10h4M14.5 13.5h4" />
                  </svg>
                </span>
                <input
                  id="usuario"
                  type="text"
                  inputMode={rolActual.inputMode}
                  autoComplete="username"
                  placeholder={rolActual.campoPlaceholder}
                  value={usuario}
                  onChange={(e) => setUsuario(e.target.value)}
                />
              </div>
            </div>

            <div className="campo">
              <label htmlFor="password">Contraseña</label>
              <div className="campo__password">
                <input
                  id="password"
                  type={verPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Tu contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="campo__ver"
                  onClick={() => setVerPassword((v) => !v)}
                  aria-pressed={verPassword}
                >
                  {verPassword ? "Ocultar" : "Mostrar"}
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
                    <circle cx="12" cy="12" r="3" />
                    {verPassword && <path d="M3 3l18 18" />}
                  </svg>
                </button>
              </div>
            </div>

            {error && (
              <p className="form__error" role="alert">
                {error}
              </p>
            )}

            <button type="submit" className="form__enviar" disabled={cargando}>
              {cargando ? "Ingresando..." : `Ingresar como ${rolActual.titulo.toLowerCase()}`}
            </button>
          </form>

          {rol === "alumno" && (
            <p className="login__pie">
              ¿Aún no tienes cuenta? <Link to="/registro">Regístrate</Link>
            </p>
          )}
        </div>
      </section>
    </main>
  );
}