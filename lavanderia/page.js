'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase, correlativo, fechaCorta } from '../../lib/supabaseClient';

export default function Lavanderia() {
  const [sesion, setSesion] = useState(null);
  const [perfil, setPerfil] = useState(null);
  const [listo, setListo] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSesion(data.session);
      setListo(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSesion(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!sesion) return setPerfil(null);
    supabase.from('perfiles').select('*').eq('id', sesion.user.id).single()
      .then(({ data }) => setPerfil(data));
  }, [sesion]);

  if (!listo) return <Centro>Cargando…</Centro>;
  if (!sesion) return <Login />;
  return <Panel perfil={perfil} email={sesion.user.email} />;
}

function Centro({ children }) {
  return <main className="mx-auto max-w-md px-5 py-20 text-center text-slate-600">{children}</main>;
}

function Login() {
  const [email, setEmail] = useState('');
  const [clave, setClave] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  async function entrar() {
    setError('');
    setCargando(true);
    const { error: e } = await supabase.auth.signInWithPassword({ email, password: clave });
    setCargando(false);
    if (e) setError('Usuario o contraseña incorrectos.');
  }

  return (
    <main className="mx-auto max-w-md px-5 py-14">
      <Link href="/" className="text-[15px] font-semibold text-trama">← Inicio</Link>
      <h1 className="mt-3 text-[30px] font-bold text-tinta">Personal de lavandería</h1>
      <p className="mt-2 text-slate-600">Ingresa para revisar y dar el visto bueno a las boletas.</p>

      <div className="mt-7 marco space-y-4 p-5">
        <div>
          <label className="etiqueta" htmlFor="email">Correo</label>
          <input id="email" type="email" autoComplete="username" className="campo"
                 value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <label className="etiqueta" htmlFor="clave">Contraseña</label>
          <input id="clave" type="password" autoComplete="current-password" className="campo"
                 value={clave} onChange={(e) => setClave(e.target.value)}
                 onKeyDown={(e) => e.key === 'Enter' && entrar()} />
        </div>
        {error && <p role="alert" className="border-l-4 border-sello p-2 text-[15px] text-sello">{error}</p>}
        <button onClick={entrar} disabled={cargando} className="boton w-full">
          {cargando ? 'Ingresando…' : 'Entrar'}
        </button>
      </div>
    </main>
  );
}

function Panel({ perfil, email }) {
  const [filtro, setFiltro] = useState('enviada');
  const [boletas, setBoletas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [abierta, setAbierta] = useState(null);

  async function cargar() {
    setCargando(true);
    let q = supabase.from('boletas').select('*').order('numero', { ascending: false }).limit(200);
    if (filtro !== 'todas') q = q.eq('estado', filtro);
    const { data } = await q;
    setBoletas(data || []);
    setCargando(false);
  }

  useEffect(() => { cargar(); /* eslint-disable-next-line */ }, [filtro]);

  if (abierta) {
    return (
      <Detalle
        boleta={abierta}
        perfil={perfil}
        onCerrar={() => setAbierta(null)}
        onValidada={() => { setAbierta(null); cargar(); }}
      />
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-5 py-8">
      <header className="flex flex-wrap items-start justify-between gap-3 border-b-2 border-tinta pb-5">
        <div>
          <h1 className="text-[30px] font-bold text-tinta">Boletas por recoger</h1>
          <p className="mt-1 text-slate-600">{perfil?.nombre || email}</p>
        </div>
        <button onClick={() => supabase.auth.signOut()} className="boton-suave">Salir</button>
      </header>

      <div className="mt-5 flex gap-2">
        {[['enviada', 'Pendientes'], ['validada', 'Validadas'], ['todas', 'Todas']].map(([v, t]) => (
          <button key={v} onClick={() => setFiltro(v)}
            className={`px-4 py-2 text-[15px] font-semibold border ${
              filtro === v ? 'bg-tinta text-white border-tinta' : 'border-linea text-tinta hover:bg-papel'
            }`}>
            {t}
          </button>
        ))}
      </div>

      {cargando && <p className="mt-8 text-slate-600">Cargando boletas…</p>}

      {!cargando && boletas.length === 0 && (
        <p className="mt-8 marco p-6 text-slate-600">
          No hay boletas en esta vista. Cuando el personal registre su ropa aparecerá aquí.
        </p>
      )}

      <ul className="mt-6 space-y-3 pb-10">
        {boletas.map((b) => (
          <li key={b.id}>
            <button onClick={() => setAbierta(b)}
                    className="marco w-full p-4 text-left hover:bg-papel transition-colors">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="font-mono text-lg font-semibold text-sello">Nº {correlativo(b.numero)}</span>
                <span className={`px-3 py-1 text-[13px] font-semibold ${
                  b.estado === 'validada' ? 'bg-tinta text-white' : 'border border-tinta text-tinta'
                }`}>
                  {b.estado === 'validada' ? 'Validada' : 'Pendiente'}
                </span>
              </div>
              <p className="mt-2 font-semibold">{b.nombres}</p>
              <p className="text-[15px] text-slate-700">
                {b.hospedaje}{b.habitacion ? ` — Hab. ${b.habitacion}` : ''} · {fechaCorta(b.fecha)} ·{' '}
                {b.total_prendas} prendas
              </p>
            </button>
          </li>
        ))}
      </ul>
    </main>
  );
}

function Detalle({ boleta, perfil, onCerrar, onValidada }) {
  const [items, setItems] = useState([]);
  const [kilos, setKilos] = useState(boleta.total_kilos ?? '');
  const [obs, setObs] = useState(boleta.obs_lavanderia ?? '');
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);
  const bloqueada = boleta.estado === 'validada';

  useEffect(() => {
    supabase.from('boleta_items').select('*').eq('boleta_id', boleta.id).order('orden')
      .then(({ data }) => setItems((data || []).map((i) => ({
        ...i, cantidad_confirmada: i.cantidad_confirmada ?? i.cantidad
      }))));
  }, [boleta.id]);

  const cambiar = (id, v) =>
    setItems(items.map((i) => (i.id === id ? { ...i, cantidad_confirmada: v } : i)));

  const totalContado = items.reduce((s, i) => s + (parseInt(i.cantidad_confirmada, 10) || 0), 0);
  const hayDiferencia = totalContado !== boleta.total_prendas;

  async function validar() {
    setError('');
    if (kilos === '' || isNaN(parseFloat(kilos))) return setError('Registra el total de kilos.');
    if (hayDiferencia && !obs.trim())
      return setError('Las cantidades no coinciden con lo declarado. Explica la diferencia en observaciones.');

    setGuardando(true);
    try {
      for (const i of items) {
        const { error: e } = await supabase.from('boleta_items')
          .update({ cantidad_confirmada: parseInt(i.cantidad_confirmada, 10) || 0 })
          .eq('id', i.id);
        if (e) throw e;
      }
      const { error: e2 } = await supabase.from('boletas').update({
        estado: 'validada',
        total_kilos: parseFloat(kilos),
        obs_lavanderia: obs.trim() || null,
        validado_por: (await supabase.auth.getUser()).data.user.id,
        validado_por_nombre: perfil?.nombre || null,
        validado_en: new Date().toISOString()
      }).eq('id', boleta.id);
      if (e2) throw e2;
      onValidada();
    } catch (err) {
      setError('No se pudo validar: ' + (err.message || 'intenta de nuevo.'));
      setGuardando(false);
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-5 py-8">
      <button onClick={onCerrar} className="text-[15px] font-semibold text-trama">← Volver a la lista</button>

      <div className="mt-4 marco p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-linea pb-3">
          <p className="font-mono text-2xl font-semibold text-sello">Nº {correlativo(boleta.numero)}</p>
          <p className="text-[15px] text-slate-600">{fechaCorta(boleta.fecha)}</p>
        </div>
        <p className="mt-3 text-lg font-bold">{boleta.nombres}</p>
        <p className="text-[15px] text-slate-700">
          DNI {boleta.dni} · {boleta.empresa}
        </p>
        <p className="text-[15px] text-slate-700">
          {boleta.hospedaje}{boleta.habitacion ? ` — Hab. ${boleta.habitacion}` : ''}
        </p>
        {boleta.observaciones && (
          <p className="mt-3 border-l-4 border-linea pl-3 text-[15px] text-slate-700">
            Indicación del trabajador: {boleta.observaciones}
          </p>
        )}
      </div>

      <h2 className="mt-7 border-b border-tinta pb-2 text-lg font-bold text-tinta">
        Conteo de prendas
      </h2>
      <table className="mt-3 w-full border-collapse text-[15px]">
        <thead>
          <tr className="bg-papel text-left">
            <th className="border border-linea px-3 py-1.5">Prenda</th>
            <th className="w-20 border border-linea px-2 py-1.5 text-center">Declarado</th>
            <th className="w-24 border border-linea px-2 py-1.5 text-center">Contado</th>
          </tr>
        </thead>
        <tbody>
          {items.map((i) => {
            const dif = (parseInt(i.cantidad_confirmada, 10) || 0) !== i.cantidad;
            return (
              <tr key={i.id} className={dif ? 'bg-sello/5' : 'bg-white'}>
                <td className="border border-linea px-3 py-1.5">
                  {i.tipo_ropa}
                  {i.descripcion && <span className="block text-[13px] text-slate-500">{i.descripcion}</span>}
                </td>
                <td className="border border-linea px-2 py-1.5 text-center font-mono">{i.cantidad}</td>
                <td className="border border-linea px-2 py-1.5">
                  <input type="number" min="0" disabled={bloqueada}
                         aria-label={`Cantidad contada de ${i.tipo_ropa}`}
                         className="campo w-full text-center font-mono disabled:bg-papel"
                         value={i.cantidad_confirmada}
                         onChange={(e) => cambiar(i.id, e.target.value.replace(/\D/g, ''))} />
                </td>
              </tr>
            );
          })}
          <tr className="bg-papel font-bold">
            <td className="border border-linea px-3 py-1.5 text-right">Totales</td>
            <td className="border border-linea px-2 py-1.5 text-center font-mono">{boleta.total_prendas}</td>
            <td className={`border border-linea px-2 py-1.5 text-center font-mono ${hayDiferencia ? 'text-sello' : ''}`}>
              {totalContado}
            </td>
          </tr>
        </tbody>
      </table>

      {hayDiferencia && !bloqueada && (
        <p className="mt-3 border-l-4 border-sello bg-white p-3 text-[15px] text-sello">
          El conteo no coincide con lo declarado. Anota el motivo antes de dar el visto bueno.
        </p>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-[10rem_1fr]">
        <div>
          <label className="etiqueta" htmlFor="kilos">Total kilos</label>
          <input id="kilos" type="number" step="0.01" min="0" disabled={bloqueada}
                 className="campo font-mono disabled:bg-papel"
                 value={kilos} onChange={(e) => setKilos(e.target.value)} />
        </div>
        <div>
          <label className="etiqueta" htmlFor="obs">Observaciones de lavandería</label>
          <input id="obs" className="campo disabled:bg-papel" disabled={bloqueada}
                 value={obs} onChange={(e) => setObs(e.target.value)}
                 placeholder="Prendas faltantes, manchas, detalles del recojo…" />
        </div>
      </div>

      {error && <p role="alert" className="mt-4 border-l-4 border-sello bg-white p-3 text-sello">{error}</p>}

      <div className="mt-6 pb-10">
        {bloqueada ? (
          <p className="marco p-4 text-[15px]">
            <span className="font-bold text-tinta">Visto bueno registrado</span> por{' '}
            {boleta.validado_por_nombre || 'lavandería'} el{' '}
            {new Date(boleta.validado_en).toLocaleString('es-PE')}. Esta boleta ya no se puede modificar.
          </p>
        ) : (
          <button onClick={validar} disabled={guardando} className="boton">
            {guardando ? 'Registrando…' : 'Dar visto bueno'}
          </button>
        )}
      </div>
    </main>
  );
}
