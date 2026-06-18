# BarberFlow Vercel

Versión de BarberFlow lista para desplegar en Vercel con frontend estático, Vercel Functions en Node.js y Supabase Postgres como base de datos.

## Tecnologías

- HTML5
- CSS3
- JavaScript puro
- Node.js Vercel Functions
- Supabase
- APIs REST

## APIs externas

- Nager.Date: feriados de Ecuador.
- Open-Meteo: clima actual de Guayaquil.
- QRServer: QR de confirmación de cita.

## Base de datos

La base de datos usa Supabase Postgres con estas tablas:

- `services`
- `staff`
- `appointments`
- `appointment_services`

## Configurar Supabase

1. Crear un proyecto en Supabase.
2. Abrir el SQL Editor.
3. Ejecutar `database/schema.sql`.
4. Copiar `SUPABASE_URL`.
5. Copiar `SUPABASE_SERVICE_ROLE_KEY`.

La `SUPABASE_SERVICE_ROLE_KEY` solo se usa en Vercel Functions. No se expone en el frontend.

## Configurar variables

Crear variables de entorno en Vercel:

```env
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
OWNER_PASSWORD=admin123
APP_USER_AGENT=BarberFlow/1.0
```

Para local, copiar `.env.example` como `.env` y completar los valores.

## Ejecutar local

```bash
npm install
vercel dev
```

Abrir:

```text
http://localhost:3000/
```

## Desplegar en Vercel

1. Subir este proyecto a GitHub.
2. Importar el repositorio en Vercel.
3. Agregar las variables de entorno.
4. Desplegar.

## Panel del dueño

El menú público no muestra Admin.

Acceso manual:

```text
/admin-login.html
```

La clave inicial es:

```text
admin123
```

## Flujo de citas

- El cliente elige varios servicios.
- Se calcula precio y duración total.
- Se recomienda trabajador según categorías y skills.
- Se consultan horarios disponibles con duración real.
- Se bloquean domingos, feriados, solapamientos y citas que terminen después de las 18:00.
- La cita se guarda en Supabase.
- La confirmación muestra QR.

## Autor

Wilson Cristóbal Pinela León

## Curso

3ero Bachillerato Técnico "B"
