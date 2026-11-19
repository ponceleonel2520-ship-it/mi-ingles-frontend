import { useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../api";
import "./Login.css";

const CARRERAS = [
  "Ingeniería en Sistemas Computacionales",
  "Ingeniería Industrial",
  "Licenciatura en Lenguas",
  "Administración de Empresas",
];

const FORM_VACIO = {
  nombre: "",
  matricula: "",
  correo: "",
  carrera: CARRERAS[0],
  contrasena: "",
  confirmar: "",
};

export default function Registro() {
  const [form, setForm] = useState(FORM_VACIO);
  const [verPassword, setVerPassword] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [exito, setExito] = useState("");

  const cambiar = (campo) => (e) => setForm((f) => ({ ...f, [campo]: e.target.value }));

  // Mismas reglas que el backend, para avisar antes de mandar la petición
  const validar = () => {
    if (!form.nombre.trim()) return "Escribe tu nombre completo.";
    if (!/^[0-9]{9}$/.test(form.matricula.trim())) return "La matrícula debe tener 9 dígitos.";
    if (!/^\S+@\S+\.\S+$/.test(form.correo.trim())) return "Escribe un correo válido.";
    if (form.contrasena.length < 6) return "La contraseña debe tener al menos 6 caracteres.";
    if (form.contrasena !== form.confirmar) return "Las contraseñas no coinciden.";
    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setExito("");

    const mensaje = validar();
    if (mensaje) {
      setError(mensaje);
      return;
    }

    setCargando(true);
    try {
      const datos = await apiFetch("/api/alumno", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: form.nombre.trim(),
          matricula: form.matricula.trim(),
          correo: form.correo.trim(),
          carrera: form.carrera,
          contrasena: form.contrasena,
        }),
      });
      setExito(datos?.message || "Registro exitoso. Ya puedes iniciar sesión.");
      setForm(FORM_VACIO);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  };

  return (
    <main className="login" data-rol="alumno">
      <section className="login__panel">
        <header className="login__header">
          <h1>Crear cuenta de alumno</h1>
          <p>Regístrate para practicar vocabulario en inglés</p>
        </header>

        <form className="form" onSubmit={handleSubmit} noValidate>
          <div className="campo">
            <label htmlFor="nombre">Nombre completo</label>
            <input id="nombre" type="text" autoComplete="name" value={form.nombre} onChange={cambiar("nombre")} />
          </div>

          <div className="campo">
            <label htmlFor="matricula">Matrícula</label>
            <input
              id="matricula"
              type="text"
              autoComplete="username"
              inputMode="numeric"
              maxLength={9}
              placeholder="9 dígitos, ej. 123456789"
              value={form.matricula}
              onChange={cambiar("matricula")}
            />
          </div>

          <div className="campo">
            <label htmlFor="correo">Correo</label>
            <input id="correo" type="email" autoComplete="email" value={form.correo} onChange={cambiar("correo")} />
          </div>

          <div className="campo">
            <label htmlFor="carrera">Carrera</label>
            <select id="carrera" value={form.carrera} onChange={cambiar("carrera")}>
              {CARRERAS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="campo">
            <label htmlFor="contrasena">Contraseña</label>
            <div className="campo__password">
              <input
                id="contrasena"
                type={verPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Mínimo 6 caracteres"
                value={form.contrasena}
                onChange={cambiar("contrasena")}
              />
              <button
                type="button"
                className="campo__ver"
                onClick={() => setVerPassword((v) => !v)}
                aria-pressed={verPassword}
              >
                {verPassword ? "Ocultar" : "Mostrar"}
              </button>
            </div>
          </div>

          <div className="campo">
            <label htmlFor="confirmar">Confirmar contraseña</label>
            <input
              id="confirmar"
              type={verPassword ? "text" : "password"}
              autoComplete="new-password"
              value={form.confirmar}
              onChange={cambiar("confirmar")}
            />
          </div>

          {error && (
            <p className="form__error" role="alert">
              {error}
            </p>
          )}

          {exito && (
            <p className="form__ok" role="status">
              {exito}
            </p>
          )}

          {exito ? (
            <Link to="/" className="form__enviar form__enviar--enlace">
              Ir a iniciar sesión
            </Link>
          ) : (
            <button type="submit" className="form__enviar" disabled={cargando}>
              {cargando ? "Registrando..." : "Crear cuenta"}
            </button>
          )}
        </form>

        <p className="login__pie">
          ¿Ya tienes cuenta? <Link to="/">Inicia sesión</Link>
        </p>
      </section>
    </main>
  );
}