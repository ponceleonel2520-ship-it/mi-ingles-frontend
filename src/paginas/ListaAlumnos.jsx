import { useState } from 'react';
import { apiFetch, useApi } from '../api';
import './ListaAlumnos.css';

const iniciales = (nombre) =>
  nombre
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase();

export default function ListaAlumnos() {
  const { datos: alumnos, cargando, error } = useApi('/api/alumnos');

  const [busqueda, setBusqueda] = useState('');
  const [niveles, setNiveles] = useState({}); // niveles nuevos después de promover
  const [promoviendo, setPromoviendo] = useState(null);
  const [aviso, setAviso] = useState({ texto: '', tipo: '' });

  const [seleccionado, setSeleccionado] = useState(null);
  const [categorias, setCategorias] = useState([]);
  const [marcadas, setMarcadas] = useState([]);
  const [cargandoPanel, setCargandoPanel] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState({ texto: '', tipo: '' });

  const nivelDe = (alumno) => niveles[alumno.id] ?? alumno.nivel;

  const texto = busqueda.trim().toLowerCase();
  const visibles = alumnos.filter((a) =>
    `${a.nombre_completo} ${a.matricula}`.toLowerCase().includes(texto)
  );

  const abrirCategorias = async (alumno) => {
    setSeleccionado(alumno);
    setCategorias([]);
    setMarcadas([]);
    setMensaje({ texto: '', tipo: '' });
    setCargandoPanel(true);

    try {
      const respuesta = await apiFetch(`/api/alumnos/${alumno.id}/categorias`);
      const lista = respuesta?.data ?? [];
      setCategorias(lista);
      setMarcadas(lista.filter((c) => c.habilitada).map((c) => c.id));
    } catch (err) {
      setMensaje({
        texto: err.message || 'No se pudieron cargar las categorías.',
        tipo: 'error',
      });
    } finally {
      setCargandoPanel(false);
    }
  };

  const alternar = (id) =>
    setMarcadas((actuales) =>
      actuales.includes(id) ? actuales.filter((x) => x !== id) : [...actuales, id]
    );

  const guardar = async () => {
    setGuardando(true);
    setMensaje({ texto: '', tipo: '' });

    try {
      await apiFetch(`/api/alumnos/${seleccionado.id}/categorias`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categorias: marcadas }),
      });
      setMensaje({ texto: 'Categorías actualizadas.', tipo: 'ok' });
    } catch (err) {
      setMensaje({
        texto: err.message || 'No se pudieron guardar las categorías.',
        tipo: 'error',
      });
    } finally {
      setGuardando(false);
    }
  };

  const promover = async (alumno) => {
    const confirmado = window.confirm(
      `¿Subir de nivel a ${alumno.nombre_completo}? Hoy está en ${nivelDe(alumno)}.`
    );
    if (!confirmado) return;

    setPromoviendo(alumno.id);
    setAviso({ texto: '', tipo: '' });

    try {
      const respuesta = await apiFetch(`/api/alumnos/${alumno.id}/promover`, {
        method: 'POST',
      });

      const nuevo = respuesta?.data?.nivel;
      if (nuevo) setNiveles((n) => ({ ...n, [alumno.id]: nuevo }));

      setAviso({ texto: respuesta?.message || 'Nivel actualizado.', tipo: 'ok' });
    } catch (err) {
      setAviso({ texto: err.message || 'No se pudo subir de nivel.', tipo: 'error' });
    } finally {
      setPromoviendo(null);
    }
  };

  return (
    <div className="alumnos">
      <header className="alumnos__cabecera">
        <div>
          <h2>Alumnos</h2>
          <p>Administra el nivel y las categorías de cada alumno.</p>
        </div>
        <div className="alumnos__resumen">
          <strong>{alumnos.length}</strong>
          <span>inscritos</span>
        </div>
      </header>

      <div className="alumnos__buscar">
        <input
          type="search"
          placeholder="Buscar por nombre o matrícula"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </div>

      {aviso.texto && (
        <p
          role={aviso.tipo === 'error' ? 'alert' : 'status'}
          className={`msg msg--${aviso.tipo}`}
          style={{ marginBottom: '16px' }}
        >
          {aviso.texto}
        </p>
      )}

      {cargando && <p className="alumnos__vacio">Cargando alumnos...</p>}
      {error && (
        <p className="alumnos__vacio" role="alert">
          {error}
        </p>
      )}
      {!cargando && !error && alumnos.length === 0 && (
        <p className="alumnos__vacio">Todavía no hay alumnos registrados.</p>
      )}
      {!cargando && alumnos.length > 0 && visibles.length === 0 && (
        <p className="alumnos__vacio">Ningún alumno coincide con la búsqueda.</p>
      )}

      <div className="alumnos__lista">
        {visibles.map((a) => (
          <article key={a.id} className="alumno">
            <div className="alumno__avatar">{iniciales(a.nombre_completo)}</div>

            <div className="alumno__datos">
              <h3>{a.nombre_completo}</h3>
              <p>
                {a.matricula} · {a.carrera}
              </p>
              <p>{a.correo}</p>
            </div>

            <span className="nivel">{nivelDe(a)}</span>

            <div className="alumno__acciones">
              <button type="button" className="btn btn--primario" onClick={() => abrirCategorias(a)}>
                Categorías
              </button>
              <button
                type="button"
                className="btn btn--suave"
                onClick={() => promover(a)}
                disabled={promoviendo === a.id || nivelDe(a) === 'C1'}
              >
                {nivelDe(a) === 'C1'
                  ? 'Nivel máximo'
                  : promoviendo === a.id
                  ? 'Subiendo...'
                  : 'Subir de nivel'}
              </button>
            </div>
          </article>
        ))}
      </div>

      {seleccionado && (
        <div className="cajon" role="dialog" aria-modal="true">
          <div className="cajon__fondo" onClick={() => setSeleccionado(null)} />

          <aside className="cajon__panel">
            <header className="cajon__cabecera">
              <div>
                <h3>Categorías</h3>
                <p>
                  {seleccionado.nombre_completo} · nivel {nivelDe(seleccionado)}
                </p>
              </div>
              <button
                type="button"
                className="cajon__cerrar"
                aria-label="Cerrar"
                onClick={() => setSeleccionado(null)}
              >
                ×
              </button>
            </header>

            <div className="cajon__cuerpo">
              {cargandoPanel && <p className="alumnos__vacio">Cargando categorías...</p>}

              {!cargandoPanel && categorias.length === 0 && !mensaje.texto && (
                <p className="alumnos__vacio">
                  No hay categorías activas para el nivel {nivelDe(seleccionado)}. Créalas desde Categorías.
                </p>
              )}

              {categorias.map((c) => (
                <label key={c.id} className="opcion">
                  <input
                    type="checkbox"
                    checked={marcadas.includes(c.id)}
                    onChange={() => alternar(c.id)}
                  />
                  <span>{c.nombre}</span>
                  <span className="opcion__interruptor" aria-hidden="true" />
                </label>
              ))}
            </div>

            <footer className="cajon__pie">
              {mensaje.texto && (
                <p
                  role={mensaje.tipo === 'error' ? 'alert' : 'status'}
                  className={`msg msg--${mensaje.tipo}`}
                >
                  {mensaje.texto}
                </p>
              )}

              {categorias.length > 0 && (
                <button type="button" className="btn btn--primario" onClick={guardar} disabled={guardando}>
                  {guardando ? 'Guardando...' : 'Guardar categorías'}
                </button>
              )}

              <button type="button" className="btn btn--suave" onClick={() => setSeleccionado(null)}>
                Cerrar
              </button>
            </footer>
          </aside>
        </div>
      )}
    </div>
  );
}