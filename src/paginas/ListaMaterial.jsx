import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getRol, useApi } from '/src/api.js';
import './ListaMaterial.css';

function ListaMaterial() {
  const {
    datos: materiales,
    cargando,
    error,
  } = useApi('/api/materiales');

  const { datos: categoriasApi } = useApi('/api/categorias');
  const esDocente = getRol() === 'docente';

  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('TODAS');
  const [busqueda, setBusqueda] = useState('');

  const opcionesCategorias = useMemo(() => {
    const mapa = new Map();

    (categoriasApi || []).forEach((c) => {
      if (c?.nombre) {
        mapa.set(c.nombre, c.nivel ? `${c.nombre} (${c.nivel})` : c.nombre);
      }
    });

    (materiales || []).forEach((m) => {
      const cat = m.categoria || 'Sin categoría';
      if (!mapa.has(cat)) {
        mapa.set(cat, cat);
      }
    });

    return Array.from(mapa.entries()).map(([valor, etiqueta]) => ({
      valor,
      etiqueta,
    }));
  }, [categoriasApi, materiales]);

  const gruposPorCategoria = useMemo(() => {
    const lista = materiales || [];
    const q = busqueda.trim().toLowerCase();

    const filtrados = lista.filter((m) => {
      const cat = m.categoria || 'Sin categoría';
      const coincideCat =
        categoriaSeleccionada === 'TODAS' || cat === categoriaSeleccionada;

      const texto = `${m.nombre || ''} ${m.traduccion || ''} ${cat}`.toLowerCase();
      const coincideTexto = !q || texto.includes(q);

      return coincideCat && coincideTexto;
    });

    const grupos = {};
    filtrados.forEach((m) => {
      const cat = m.categoria || 'Sin categoría';
      if (!grupos[cat]) grupos[cat] = [];
      grupos[cat].push(m);
    });

    return Object.entries(grupos);
  }, [materiales, categoriaSeleccionada, busqueda]);

  return (
    <div className="contenido-pagina">
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '20px',
        }}
      >
        <div>
          <h2 style={{ margin: 0 }}>Lista de Materiales de Estudio</h2>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '0.9rem' }}>
            Agrupados por categoría · Se recomiendan al menos 4 materiales por categoría para los tests.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          <select
            aria-label="Filtrar por categoría"
            value={categoriaSeleccionada}
            onChange={(e) => setCategoriaSeleccionada(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              background: '#fff',
              minWidth: '210px',
            }}
          >
            <option value="TODAS">Todas las categorías</option>
            {opcionesCategorias.map((op) => (
              <option key={op.valor} value={op.valor}>
                {op.etiqueta}
              </option>
            ))}
          </select>

          <input
            type="search"
            placeholder="Buscar palabra o traducción..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              minWidth: '220px',
            }}
          />

          {esDocente && (
            <Link
              to="/subir-material"
              style={{
                padding: '9px 16px',
                borderRadius: '8px',
                background: '#1d4ed8',
                color: '#fff',
                fontWeight: 600,
                textDecoration: 'none',
                whiteSpace: 'nowrap',
              }}
            >
              + Subir Material
            </Link>
          )}
        </div>
      </div>

      {cargando && (
        <p className="sinMaterial">
          Cargando materiales desde la base de datos...
        </p>
      )}

      {error && (
        <p className="sinMaterial" style={{ color: 'red' }}>
          Error: {error}
        </p>
      )}

      {!cargando &&
        !error &&
        (!materiales || materiales.length === 0) && (
          <p className="sinMaterial">
            Aún no hay materiales subidos.
          </p>
        )}

      {!cargando &&
        !error &&
        materiales?.length > 0 &&
        gruposPorCategoria.length === 0 && (
          <p className="sinMaterial">
            No hay materiales que coincidan con el filtro seleccionado.
          </p>
        )}

      {!cargando &&
        !error &&
        gruposPorCategoria.map(([categoriaNombre, items]) => {
          const faltan = items.length < 4;

          return (
            <section
              key={categoriaNombre}
              style={{
                marginBottom: '28px',
                padding: '16px',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                background: '#f8fafc',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '8px',
                  marginBottom: '14px',
                  paddingBottom: '10px',
                  borderBottom: '1px solid #e2e8f0',
                }}
              >
                <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#0f172a' }}>
                  {categoriaNombre}
                </h3>

                <span
                  style={{
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    padding: '4px 10px',
                    borderRadius: '999px',
                    background: faltan ? '#fef3c7' : '#dcfce7',
                    color: faltan ? '#92400e' : '#166534',
                  }}
                >
                  {items.length} {items.length === 1 ? 'material' : 'materiales'}
                  {faltan ? ` · Faltan ${4 - items.length} para test completo` : ' · Lista para test'}
                </span>
              </div>

              <div className="gridMateriales">
                {items.map((material) => {
                  const archivo = material.imagen || material.archivo;

                  const esImagen =
                    archivo &&
                    /\.(jpg|jpeg|png|gif|webp|svg|bmp)(\?.*)?$/i.test(archivo);

                  return (
                    <div key={material.id} className="tarjeta">
                      <span className="etiquetaNivel">
                        {material.categoria}
                      </span>

                      <h3>{material.nombre}</h3>

                      {material.traduccion && (
                        <p style={{ margin: '0 0 8px', color: '#475569', fontSize: '0.9rem' }}>
                          {material.traduccion}
                        </p>
                      )}

                      {archivo ? (
                        <div className="contenidoArchivo">
                          {esImagen && (
                            <a
                              href={archivo}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <img
                                src={archivo}
                                alt={material.nombre}
                                className="imagenMaterial"
                              />
                            </a>
                          )}

                          <a
                            href={archivo}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="enlaceArchivo"
                          >
                            {esImagen
                              ? 'Ver imagen completa'
                              : 'Abrir material'}
                          </a>
                        </div>
                      ) : (
                        <p className="sinMaterial">
                          No hay ningún archivo disponible.
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
    </div>
  );
}

export default ListaMaterial;