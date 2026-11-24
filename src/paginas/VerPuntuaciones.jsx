import { useMemo, useState } from 'react';
import { apiFetch, useApi } from '../api';
import './Tabla.css';
import './ListaAlumnos.css';

const formatearFechaHora = (valor) => {
  if (!valor) return 'Sin actividad';
  const fecha = new Date(String(valor).replace(' ', 'T'));
  if (Number.isNaN(fecha.getTime())) return valor;
  return fecha.toLocaleString('es-MX', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

export default function VerPuntuaciones() {
  const { datos: alumnos, cargando, error } = useApi('/api/alumnos');
  const { datos: calificaciones } = useApi('/api/calificaciones');

  const [busqueda, setBusqueda] = useState('');
  const [alumnoSeleccionado, setAlumnoSeleccionado] = useState(null);
  const [nivelActual, setNivelActual] = useState('');
  const [categorias, setCategorias] = useState([]);
  const [historial, setHistorial] = useState([]);
  const [marcadas, setMarcadas] = useState([]);
  const [notasPorCategoria, setNotasPorCategoria] = useState({});
  const [cargandoDetalle, setCargandoDetalle] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState({ texto: '', tipo: '' });

  // Agrupa los intentos por alumno_id para mostrar 1 sola fila por usuario
  const resumenPorAlumno = useMemo(() => {
    const mapa = {};
    (calificaciones || []).forEach((c) => {
      const id = Number(c.alumno_id);
      if (!mapa[id]) {
        mapa[id] = { totalTests: 0, ultimaFecha: c.created_at || null };
      }
      mapa[id].totalTests += 1;
      if (c.created_at && (!mapa[id].ultimaFecha || c.created_at > mapa[id].ultimaFecha)) {
        mapa[id].ultimaFecha = c.created_at;
      }
    });
    return mapa;
  }, [calificaciones]);

  const alumnosFiltrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return alumnos || [];
    return (alumnos || []).filter((a) =>
      `${a.nombre_completo} ${a.matricula}`.toLowerCase().includes(q)
    );
  }, [alumnos, busqueda]);

  const abrirEvaluacion = async (alumno) => {
    if (!alumno) return;
    setAlumnoSeleccionado(alumno);
    setCategorias([]);
    setHistorial([]);
    setMarcadas([]);
    setNotasPorCategoria({});
    setMensaje({ texto: '', tipo: '' });
    setCargandoDetalle(true);

    try {
      const res = await apiFetch(`/api/alumnos/${alumno.id}/progreso`);
      const lista = res?.data ?? [];
      setNivelActual(res?.nivel || alumno.nivel || 'A1');
      setCategorias(lista);
      setHistorial(res?.historial ?? []);
      setMarcadas(lista.filter((c) => c.habilitada).map((c) => c.id));

      const mapaNotas = {};
      lista.forEach((c) => {
        mapaNotas[c.id] =
          c.calificacion_cerrada !== null && c.calificacion_cerrada !== undefined
            ? String(c.calificacion_cerrada)
            : '';
      });
      setNotasPorCategoria(mapaNotas);
    } catch (err) {
      setMensaje({
        texto: err.message || 'No se pudo cargar el progreso del alumno.',
        tipo: 'error',
      });
    } finally {
      setCargandoDetalle(false);
    }
  };

  const alternarCategoria = (id) =>
    setMarcadas((actuales) =>
      actuales.includes(id) ? actuales.filter((x) => x !== id) : [...actuales, id]
    );

  const cambiarNota = (catId, valor) =>
    setNotasPorCategoria((prev) => ({
      ...prev,
      [catId]: valor,
    }));

  const guardarEvaluacionYCategorias = async () => {
    if (!alumnoSeleccionado) return;
    setGuardando(true);
    setMensaje({ texto: '', tipo: '' });

    try {
      const listaNotas = categorias.map((c) => {
        const raw = (notasPorCategoria[c.id] ?? '').trim();
        if (raw === '') {
          return { categoria_id: c.id, calificacion: null };
        }
        const num = Number(raw);
        if (Number.isNaN(num) || num < 0 || num > 10) {
          throw new Error(`La calificación de "${c.nombre}" debe estar entre 0 y 10.`);
        }
        return { categoria_id: c.id, calificacion: num };
      });

      await apiFetch(`/api/alumnos/${alumnoSeleccionado.id}/categorias`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categorias: marcadas }),
      });

      await apiFetch(`/api/alumnos/${alumnoSeleccionado.id}/calificacion-final`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ calificaciones: listaNotas }),
      });

      setMensaje({
        texto: 'Calificaciones cerradas y categorías guardadas correctamente.',
        tipo: 'ok',
      });
    } catch (err) {
      setMensaje({
        texto: err.message || 'No se pudieron guardar los cambios.',
        tipo: 'error',
      });
    } finally {
      setGuardando(false);
    }
  };

  const colorEstado = (estado) => {
    if (estado === 'Aprobada') return '#15803d';
    if (estado === 'Reprobada') return '#b91c1c';
    return '#6b7280';
  };

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '16px',
        }}
      >
        <div>
          <h2 style={{ margin: 0 }}>Puntuaciones por Alumno</h2>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '0.92rem' }}>
            Selecciona un alumno para ver sus tests realizados, fechas con hora y asignar calificaciones cerradas.
          </p>
        </div>

        <input
          type="search"
          placeholder="Buscar por nombre o matrícula..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          style={{
            padding: '8px 12px',
            borderRadius: '8px',
            border: '1px solid #cbd5e1',
            minWidth: '250px',
          }}
        />
      </div>

      {cargando && <p>Cargando alumnos...</p>}
      {error && <p role="alert">{error}</p>}
      {!cargando && !error && alumnosFiltrados.length === 0 && (
        <p>No se encontraron alumnos.</p>
      )}

      {alumnosFiltrados.length > 0 && (
        <div className="tabla-contenedor">
          <table className="tabla">
            <thead>
              <tr>
                <th>Alumno</th>
                <th>Matrícula</th>
                <th>Nivel</th>
                <th>Tests realizados</th>
                <th>Última actividad</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {alumnosFiltrados.map((a) => {
                const info = resumenPorAlumno[Number(a.id)];
                return (
                  <tr
                    key={a.id}
                    onClick={() => abrirEvaluacion(a)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td>
                      <strong>{a.nombre_completo}</strong>
                    </td>
                    <td>{a.matricula}</td>
                    <td>{a.nivel}</td>
                    <td>{info ? `${info.totalTests} intentos` : 'Sin intentos'}</td>
                    <td>{info ? formatearFechaHora(info.ultimaFecha) : 'Sin actividad'}</td>
                    <td>
                      <button
                        type="button"
                        className="btn btn--primario"
                        onClick={(e) => {
                          e.stopPropagation();
                          abrirEvaluacion(a);
                        }}
                      >
                        Ver detalle y evaluar
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {alumnoSeleccionado && (
        <div className="cajon" role="dialog" aria-modal="true">
          <div className="cajon__fondo" onClick={() => setAlumnoSeleccionado(null)} />

          <aside className="cajon__panel">
            <header className="cajon__cabecera">
              <div>
                <h3>{alumnoSeleccionado.nombre_completo}</h3>
                <p>
                  {alumnoSeleccionado.matricula} · Nivel {nivelActual}
                </p>
              </div>
              <button
                type="button"
                className="cajon__cerrar"
                aria-label="Cerrar"
                onClick={() => setAlumnoSeleccionado(null)}
              >
                ×
              </button>
            </header>

            <div className="cajon__cuerpo">
              {cargandoDetalle && <p className="alumnos__vacio">Cargando detalle...</p>}

              {!cargandoDetalle && (
                <>
                  <h4 style={{ margin: '0 0 8px', fontSize: '0.95rem', color: '#0f172a' }}>
                    Categorías y calificación cerrada (0.0 a 10.0)
                  </h4>

                  {categorias.map((c) => (
                    <div
                      key={c.id}
                      style={{
                        padding: '10px 12px',
                        marginBottom: '10px',
                        borderRadius: '10px',
                        border: '1px solid #e2e8f0',
                        background: '#f8fafc',
                      }}
                    >
                      <label
                        className="opcion"
                        style={{
                          alignItems: 'center',
                          marginBottom: '8px',
                          padding: 0,
                          border: 'none',
                          background: 'transparent',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={marcadas.includes(c.id)}
                          onChange={() => alternarCategoria(c.id)}
                        />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600 }}>{c.nombre}</div>
                          <small style={{ color: colorEstado(c.estado_test), fontWeight: 600 }}>
                            {c.estado_test}
                            {c.calificacion_test !== null ? ` (${c.calificacion_test}%)` : ''}
                          </small>
                        </div>
                        <span className="opcion__interruptor" aria-hidden="true" />
                      </label>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '0.82rem', color: '#334155', fontWeight: 600 }}>
                          Calificación cerrada:
                        </span>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          max="10"
                          placeholder="Ej. 8.5"
                          value={notasPorCategoria[c.id] ?? ''}
                          onChange={(e) => cambiarNota(c.id, e.target.value)}
                          style={{
                            width: '95px',
                            padding: '6px 8px',
                            borderRadius: '6px',
                            border: '1px solid #cbd5e1',
                            background: '#fff',
                          }}
                        />
                      </div>
                    </div>
                  ))}

                  <h4 style={{ margin: '18px 0 8px', fontSize: '0.95rem', color: '#0f172a' }}>
                    Historial de tests realizados
                  </h4>

                  {historial.length === 0 ? (
                    <p style={{ fontSize: '0.88rem', color: '#64748b' }}>
                      Este alumno aún no ha presentado ningún test.
                    </p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {historial.map((h) => (
                        <div
                          key={h.id}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '8px 12px',
                            borderRadius: '8px',
                            border: '1px solid #e2e8f0',
                            background: '#fff',
                          }}
                        >
                          <div>
                            <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                              {h.categoria_nombre || `Nivel ${h.nivel}`}
                            </div>
                            <small style={{ color: '#64748b' }}>
                              {formatearFechaHora(h.created_at)}
                            </small>
                          </div>
                          <strong style={{ color: Number(h.puntuacion) >= 80 ? '#15803d' : '#b91c1c' }}>
                            {Number(h.puntuacion).toFixed(0)}%
                          </strong>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
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

              <button
                type="button"
                className="btn btn--primario"
                onClick={guardarEvaluacionYCategorias}
                disabled={guardando}
              >
                {guardando ? 'Guardando...' : 'Guardar calificaciones y liberar'}
              </button>

              <button
                type="button"
                className="btn btn--suave"
                onClick={() => setAlumnoSeleccionado(null)}
              >
                Cerrar
              </button>
            </footer>
          </aside>
        </div>
      )}
    </div>
  );
}