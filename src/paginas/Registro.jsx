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

const ROLES = {
  alumno: { titulo: "Alumno", texto: "Crea tu cuenta para practicar" },
  docente: { titulo: "Docente", texto: "Crea tu cuenta para administrar material" },
};

const FORM_VACIO = {
  nombre: "",
  identificador: "", // matrícula (alumno) o clave (docente)
  correo: "",
  carrera: CARRERAS[0],
  contrasena: "",
  confirmar: "",
  codigo: "",
};

export default function Registro() {
  const [rol, setRol] = useState("alumno");
  const [form, setForm] = useState(FORM_VACIO);
  const [verPassword, setVerPassword] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [exito, setExito] = useState("");

  const esAlumno = rol === "alumno";

  const cambiar = (campo) => (e) => setForm((f) => ({ ...f, [campo]: e.target.value }));

  const cambiarRol = (nuevoRol) => {
    setRol(nuevoRol);
    setForm(FORM_VACIO);
    setError("");
    setExito("");
  };

  // Mismas reglas que el backend, para avisar antes de mandar la petición
  const validar = () => {
    if (!form.nombre.trim()) return "Escribe tu nombre completo.";

    if (esAlumno) {
      if (!/^[0-9]{9}$/.test(form.identificador.trim())) return "La matrícula debe tener 9 dígitos.";
      if (!/^\S+@\S+\.\S+$/.test(form.correo.trim())) return "Escribe un correo válido.";
    } else if (!/^[A-Za-z0-9]{9}$/.test(form.identificador.trim())) {
      return "La clave de docente debe tener 9 letras o números.";
    }

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

    const cuerpo = esAlumno
      ? {
          nombre: form.nombre.trim(),
          matricula: form.identificador.trim(),
          correo: form.correo.trim(),
          carrera: form.carrera,
          contrasena: form.contrasena,
        }
      : {
          nombre: form.nombre.trim(),
          clave: form.identificador.trim(),
          contrasena: form.contrasena,
          codigo: form.codigo.trim(),
        };

    setCargando(true);
    try {
      const datos = await apiFetch(esAlumno ? "/api/alumno" : "/api/docente", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cuerpo),
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
    <main className="login" data-rol={rol}>
      <section className="login__panel">
        <header className="login__header">
          <h1>Crear cuenta</h1>
          <p>Elige qué tipo de cuenta quieres crear</p>
        </header>

        <div className="roles" role="radiogroup" aria-label="Tipo de cuenta">
          {Object.entries(ROLES).map(([clave, datos]) => (
            <button
              key={clave}
              type="button"
              role="radio"
              aria-checked={rol === clave}
              className={`rol rol--${clave} ${rol === clave ? "rol--activo" : ""}`}
              onClick={() => cambiarRol(clave)}
            >
              <span className="rol__titulo">{datos.titulo}</span>
              <span className="rol__texto">{datos.texto}</span>
            </button>
          ))}
        </div>

        <form className="form" onSubmit={handleSubmit} noValidate>
          <div className="campo">
            <label htmlFor="nombre">Nombre completo</label>
            <input id="nombre" type="text" autoComplete="name" value={form.nombre} onChange={cambiar("nombre")} />
          </div>

          <div className="campo">
            <label htmlFor="identificador">{esAlumno ? "Matrícula" : "Clave de docente"}</label>
            <input
              id="identificador"
              type="text"
              autoComplete="username"
              inputMode={esAlumno ? "numeric" : "text"}
              maxLength={9}
              placeholder={esAlumno ? "9 dígitos, ej. 123456789" : "9 caracteres, ej. DOC000001"}
              value={form.identificador}
              onChange={cambiar("identificador")}
            />
          </div>

          {esAlumno && (
            <>
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
            </>
          )}

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

          {!esAlumno && (
            <div className="campo">
              <label htmlFor="codigo">Código de registro (opcional)</label>
              <input id="codigo" type="text" value={form.codigo} onChange={cambiar("codigo")} />
              <p className="campo__ayuda">Solo si tu institución te dio uno.</p>
            </div>
          )}

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
              {cargando ? "Registrando..." : `Crear cuenta de ${rol}`}
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
