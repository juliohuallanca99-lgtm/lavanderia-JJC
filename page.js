'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { supabase, TIPOS_ROPA, correlativo, fechaCorta } from '../../lib/supabaseClient';

const vacio = () => TIPOS_ROPA.map(() => ({ cantidad: '', descripcion: '' }));

export default function NuevaBoleta() {
  const [datos, setDatos] = useState({
    fecha: new Date().toISOString().slice(0, 10),
    empresa: 'JJC CONTRATISTAS GENERALES S.A.',
    nombres: '',
    dni: '',
    hospedaje: '',
    habitacion: '',
    observaciones: ''
  });
  const [items, setItems] = useState(vacio);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [emitida, setEmitida] = useState(null);

  const totalPrendas = useMemo(
    () => items.reduce((s, i) => s + (parseInt(i.cantidad, 10) || 0), 0),
    [items]
  );

  const campo = (k) => (e) => setDatos({ ...datos, [k]: e.target.value });

  const editarItem = (idx, k, v) => {
    const copia = [...items];
    copia[idx] = { ...copia[idx], [k]: v };
    setItems(copia);
  };

  async function guardar() {
    setError('');

    if (!datos.nombres.trim()) return setError('Escribe tus nombres y apellidos.');
    if (!/^\d{8}$/.test(datos.dni.trim())) return setError('El DNI debe tener 8 dígitos.');
    if (!datos.hospedaje.trim()) return setError('Indica en qué hospedaje te encuentras.');
    if (totalPrendas === 0) return setError('Ingresa la cantidad de al menos una prenda.');

    setGuardando(true);
    try {
      const { data: boleta, error: e1 } = await supabase
        .from('boletas')
        .insert({
          fecha: datos.fecha,
          empresa: datos.empresa.trim(),
          nombres: datos.nombres.trim().toUpperCase(),
          dni: datos.dni.trim(),
          hospedaje: datos.hospedaje.trim().toUpperCase(),
          habitacion: datos.habitacion.trim(),
          observaciones: datos.observaciones.trim() || null,
          total_prendas: totalPrendas
        })
        .select()
        .single();
      if (e1) throw e1;

      const detalle = items
        .map((it, i) => ({
          boleta_id: boleta.id,
          tipo_ropa: TIPOS_ROPA[i],
          cantidad: parseInt(it.cantidad, 10) || 0,
          descripcion: it.descripcion.trim() || null,
          orden: i
        }))
        .filter((it) => it.cantidad > 0);

      const { error: e2 } = await supabase.from('boleta_items').insert(detalle);
      if (e2) throw e2;

      setEmitida({ ...boleta, detalle });
      window.scrollTo({ top: 0 });
    } catch (err) {
      setError('No se pudo guardar la boleta: ' + (err.message || 'revisa tu conexión.'));
    } finally {
      setGuardando(false);
    }
  }

  function otraBoleta() {
    setEmitida(null);
    setItems(vacio());
    setDatos({ ...datos, habitacion: datos.habitacion, observaciones: '' });
  }

  // ---------- Boleta emitida ----------
  if (emitida) {
    return (
      <main className="mx-auto max-w-3xl px-5 py-8">
        <div className="no-print mb-6 border-l-4 border-sello bg-white p-5">
          <h1 className="text-2xl font-bold text-tinta">Boleta registrada</h1>
          <p className="mt-1 text-slate-600">
            Guarda o imprime este comprobante y entrégalo junto con tu ropa en recepción.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <button onClick={() => window.print()} className="boton">Imprimir boleta</button>
            <button onClick={otraBoleta} className="boton-suave">Registrar otra</button>
            <Link href="/" className="boton-suave">Volver al inicio</Link>
          </div>
        </div>

        <article className="hoja marco p-6">
          <div className="flex items-start justify-between border-b border-linea pb-4">
            <p className="font-mono text-2xl font-semibold text-sello">
              Nº {correlativo(emitida.numero)}
            </p>
            <h2 className="rounded-full border-2 border-tinta px-5 py-1.5 text-lg font-bold">
              BOLETA DE LAVANDERÍA
            </h2>
          </div>

          <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 text-[15px]">
            <Dato t="Fecha" v={fechaCorta(emitida.fecha)} />
            <Dato t="Empresa" v={emitida.empresa} />
            <Dato t="Nombres" v={emitida.nombres} />
            <Dato t="DNI" v={emitida.dni} />
            <Dato t="Hospedaje" v={emitida.hospedaje} />
            <Dato t="Nº habitación" v={emitida.habitacion || '—'} />
          </dl>

          <table className="mt-5 w-full border-collapse text-[15px]">
            <thead>
              <tr className="bg-papel text-left text-tinta">
                <th className="border border-linea px-3 py-1.5">Tipo de ropa</th>
                <th className="w-20 border border-linea px-3 py-1.5">Cant.</th>
                <th className="border border-linea px-3 py-1.5">Descripción</th>
              </tr>
            </thead>
            <tbody>
              {emitida.detalle.map((it) => (
                <tr key={it.tipo_ropa}>
                  <td className="border border-linea px-3 py-1.5 font-medium">{it.tipo_ropa}</td>
                  <td className="border border-linea px-3 py-1.5 text-center font-mono">{it.cantidad}</td>
                  <td className="border border-linea px-3 py-1.5 text-slate-700">{it.descripcion || ''}</td>
                </tr>
              ))}
              <tr className="bg-papel font-bold">
                <td className="border border-linea px-3 py-1.5 text-right">TOTAL PRENDAS:</td>
                <td className="border border-linea px-3 py-1.5 text-center font-mono">{emitida.total_prendas}</td>
                <td className="border border-linea px-3 py-1.5 text-slate-500">Total kilos: lo completa lavandería</td>
              </tr>
            </tbody>
          </table>

          <div className="mt-4 border border-linea p-3 text-[15px]">
            <span className="font-semibold text-tinta">Observaciones: </span>
            {emitida.observaciones || '—'}
          </div>

          <p className="mt-5 text-center text-[13px] text-slate-500">
            Pendiente del visto bueno de lavandería al momento del recojo.
          </p>
        </article>
      </main>
    );
  }

  // ---------- Formulario ----------
  return (
    <main className="mx-auto max-w-3xl px-5 py-8">
      <header className="border-b-2 border-tinta pb-5">
        <Link href="/" className="text-[15px] font-semibold text-trama">← Inicio</Link>
        <h1 className="mt-2 text-[30px] font-bold text-tinta">Enviar mi ropa</h1>
        <p className="mt-2 text-slate-600">
          El número de boleta se asigna solo, al momento de guardar.
        </p>
      </header>

      <section className="mt-6 grid gap-4 sm:grid-cols-2">
        <div>
          <label className="etiqueta" htmlFor="fecha">Fecha</label>
          <input id="fecha" type="date" className="campo" value={datos.fecha} onChange={campo('fecha')} />
        </div>
        <div>
          <label className="etiqueta" htmlFor="empresa">Empresa</label>
          <input id="empresa" className="campo" value={datos.empresa} onChange={campo('empresa')} />
        </div>
        <div>
          <label className="etiqueta" htmlFor="nombres">Nombres y apellidos</label>
          <input id="nombres" className="campo" value={datos.nombres} onChange={campo('nombres')}
                 placeholder="Ej. HUALLANCA HUAMANI, JULIO CESAR" />
        </div>
        <div>
          <label className="etiqueta" htmlFor="dni">DNI</label>
          <input id="dni" inputMode="numeric" maxLength={8} className="campo font-mono"
                 value={datos.dni} onChange={campo('dni')} placeholder="8 dígitos" />
        </div>
        <div>
          <label className="etiqueta" htmlFor="hospedaje">Hospedaje</label>
          <input id="hospedaje" className="campo" value={datos.hospedaje} onChange={campo('hospedaje')}
                 placeholder="Nombre del hotel" />
        </div>
        <div>
          <label className="etiqueta" htmlFor="habitacion">Nº habitación</label>
          <input id="habitacion" className="campo" value={datos.habitacion} onChange={campo('habitacion')} />
        </div>
      </section>

      <section className="mt-8">
        <div className="flex items-baseline justify-between border-b border-tinta pb-2">
          <h2 className="text-lg font-bold text-tinta">Prendas que entregas</h2>
          <p className="font-mono text-[15px]">
            Total: <span className="text-sello font-semibold">{totalPrendas}</span>
          </p>
        </div>

        <ul className="mt-3 divide-y divide-linea border border-linea bg-white">
          {TIPOS_ROPA.map((tipo, i) => {
            const activo = (parseInt(items[i].cantidad, 10) || 0) > 0;
            return (
              <li key={tipo} className={`px-3 py-2 ${activo ? 'bg-papel' : ''}`}>
                <div className="flex items-center gap-3">
                  <span className="flex-1 text-[15px] font-medium">{tipo}</span>
                  <input
                    type="number" min="0" inputMode="numeric"
                    aria-label={`Cantidad de ${tipo}`}
                    className="campo w-20 text-center font-mono"
                    value={items[i].cantidad}
                    onChange={(e) => editarItem(i, 'cantidad', e.target.value.replace(/\D/g, ''))}
                  />
                </div>
                {activo && (
                  <input
                    className="campo mt-2"
                    aria-label={`Descripción de ${tipo}`}
                    placeholder="Descripción (color, marca, detalle)"
                    value={items[i].descripcion}
                    onChange={(e) => editarItem(i, 'descripcion', e.target.value)}
                  />
                )}
              </li>
            );
          })}
        </ul>
      </section>

      <section className="mt-6">
        <label className="etiqueta" htmlFor="obs">Observaciones</label>
        <textarea id="obs" rows={3} className="campo" value={datos.observaciones}
                  onChange={campo('observaciones')}
                  placeholder="Manchas, prendas delicadas, indicaciones de lavado…" />
      </section>

      {error && (
        <p role="alert" className="mt-5 border-l-4 border-sello bg-white p-3 text-[15px] text-sello">
          {error}
        </p>
      )}

      <div className="mt-6 flex flex-wrap gap-3 pb-10">
        <button onClick={guardar} disabled={guardando} className="boton">
          {guardando ? 'Guardando…' : 'Guardar y generar número'}
        </button>
        <Link href="/mis-boletas" className="boton-suave">Ver mis boletas</Link>
      </div>
    </main>
  );
}

function Dato({ t, v }) {
  return (
    <div className="border-b border-linea py-1">
      <dt className="text-[13px] font-semibold text-tinta">{t}</dt>
      <dd className="text-slate-800">{v}</dd>
    </div>
  );
}
