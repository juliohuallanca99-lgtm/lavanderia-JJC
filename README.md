# Boletas de Lavandería — CC0154

Réplica digital del formato **Boleta de Lavandería** en papel. Mismo stack que el Sistema
de Exámenes CC0174: Next.js 14 + Supabase + Vercel.

## Cómo funciona

- **Trabajador** (`/boleta`): sin cuenta. Escribe DNI y nombres, marca las cantidades de las
  21 prendas del formato, guarda. El número correlativo (00001, 00002, …) lo asigna Postgres,
  así que nunca se repite aunque dos personas registren al mismo tiempo.
- **Consulta** (`/mis-boletas`): con el DNI ve si su ropa ya fue recogida.
- **Lavandería** (`/lavanderia`): entra con correo y contraseña, ve los pendientes, cuenta las
  prendas, registra los kilos y las observaciones, y da el visto bueno. Al validar, la boleta
  queda sellada con usuario y fecha/hora, y un trigger de la base impide modificarla después.

## Puesta en marcha

**1. Supabase**
1. Crea el proyecto (región South America — São Paulo).
2. SQL Editor → pega `supabase-schema.sql` completo → Run.
3. Authentication → Users → Add user: crea el usuario de lavandería (y el tuyo como admin).
4. Copia el UUID de cada usuario y ejecuta los `insert into perfiles` que están comentados
   al final del SQL.

**2. GitHub**
Sube todos los archivos respetando las carpetas (`app/`, `app/boleta/`, `app/mis-boletas/`,
`app/lavanderia/`, `lib/`).

**3. Vercel**
Import del repo → en *Environment Variables* agrega:

| Nombre | Dónde sacarlo |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API → anon public |

Deploy.

## Cambiar el punto de partida del correlativo

Si algún día necesitas continuar desde otro número (por ejemplo el 3069 del talonario físico):

```sql
select setval('boleta_numero_seq', 3068, true);
```
