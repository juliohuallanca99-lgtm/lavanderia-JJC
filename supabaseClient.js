import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Las 21 filas del formato físico Nº 003068, en el mismo orden
export const TIPOS_ROPA = [
  'CAMISA MANGA CORTA',
  'CAMISA MANGA LARGA',
  'POLO MANGA CORTA',
  'POLO MANGA LARGA',
  'CHOMPA DE LANA',
  'PANTALÓN JEANS',
  'PANTALÓN DRILL',
  'OVEROL SIMPLE',
  'OVEROL TÉRMICO',
  'CASACA TÉRMICA',
  'CHALECO',
  'BIVIDÍ',
  'TOALLA',
  'CORTA VIENTO',
  'SHORT',
  'CALZONCILLO',
  'MEDIAS',
  'POLERAS',
  'PANTALÓN BUZO',
  'PIJAMA',
  'OTROS'
];

export const correlativo = (n) => String(n).padStart(5, '0');

export const fechaCorta = (iso) => {
  if (!iso) return '';
  const [a, m, d] = iso.slice(0, 10).split('-');
  return `${d}/${m}/${a}`;
};
