import { useState } from 'react';
import { apiFetch, useApi } from '../api';
import './SubirMaterial.css';
import './Tabla.css';

const NIVELES = ['A1', 'A2', 'B1', 'B2', 'C1'];

export default function Categorias() {
  const [nombre, setNombre] = useState('');
  const [nivel, setNivel] = useState('A1');
  const [orden, setOrden] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [mensaje, setMensaje] = useState({ texto: '', tipo: '' });
  const [version, setVersion] = useState(0);

  // El parámetro "v" solo sirve para volver a cargar la lista después de crear una categoría
  const { datos: categorias, cargando, error } = useApi(`/api/categorias?v=${version}`);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setEnviando(true);
    setMensaje({ texto: '', tipo: '' });

    try {
      const cuerpo = { nombre: nombre.trim(), nivel };
      if (orden !== '') cuerpo.orden = Number(orden);

      await apiFetch('/api/categorias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cuerpo),
      });

      setMensaje({ texto: 'Categoría creada correctamente.', tipo: 'ok' });
      setNombre('');
      setNivel('A1');
      setOrden('');
      setVersion((v) => v + 1);
    } catch (err) {
      setMensaje({
        texto: err.message || 'No se pudo crear la categoría.',
        tipo: 'error',
      });
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div style={{ textAlign: 'center' }}>
      <h2>Categorías</h2>
      <p>Crea las categorías de vocabulario y elige a qué nivel pertenecen.</p>

      <div className="contenedorFormulario">
        <form onSubmit={handleSubmit}>
          <div className="grupo">
            <label htmlFor="nombre">Nombre de la categoría:</label>
            <input
              id="nombre"
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej. Casa (House)"
              required
            />
          </div>

          <div className="grupo">
            <label htmlFor="nivel">Nivel:</label>
            <select id="nivel" value={nivel} onChange={(e) => setNivel(e.target.value)}>
              {NIVELES.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>

          <div className="grupo">
            <label htmlFor="orden">Orden (opcional):</label>
            <input
              id="orden"
              type="number"
              min="1"
              value={orden}
              onChange={(e) => setOrden(e.target.value)}
              placeholder="Si lo dejas vacío, va al final"
            />
          </div>

          {mensaje.texto && (
            <p
              role={mensaje.tipo === 'error' ? 'alert' : 'status'}
              className={`mensaje mensaje--${mensaje.tipo}`}
            >
              {mensaje.texto}
            </p>
          )}

          <button type="submit" className="botonSubir" disabled={enviando}>
            {enviando ? 'Guardando...' : 'Crear categoría'}
          </button>
        </form>
      </div>

      <h3>Categorías existentes</h3>

      {cargando && <p>Cargando categorías...</p>}
      {error && <p role="alert">{error}</p>}

      {categorias.length > 0 && (
        <div className="tabla-contenedor">
          <table className="tabla">
            <thead>
              <tr>
                <th>Orden</th>
                <th>Nombre</th>
                <th>Nivel</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {categorias.map((c) => (
                <tr key={c.id}>
                  <td>{c.orden}</td>
                  <td>{c.nombre}</td>
                  <td>{c.nivel}</td>
                  <td>{c.estado === 1 ? 'Activa' : 'Inactiva'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}