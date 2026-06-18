# 🚀 MundialScope 2026

Dashboard interactivo y adaptativo desarrollado como actividad práctica de integración de APIs externas, enfocado en el Mundial 2026.

## 📌 Descripción del Proyecto

MundialScope 2026 será una aplicación web relacionada con el Mundial 2026. Su objetivo es permitir que el usuario consulte partidos, selecciones, grupos, resultados, datos de países participantes y clima de las ciudades sede. Además, el proyecto incluirá una sección de pronósticos y simulación para proyectar posibles resultados y un campeón del torneo.

La aplicación integrará datos obtenidos desde tres proveedores externos mediante APIs, aplicando una arquitectura con frontend y backend para proteger correctamente las claves de acceso.

## 🛠️ Arquitectura del Proyecto

La aplicación estará dividida en dos partes principales:

* **Frontend:** interfaz visual desarrollada con HTML, CSS y JavaScript.
* **Backend:** funciones API desplegadas en Vercel para consumir servicios externos que requieren clave privada, como API-Sports.

El frontend no llamará directamente a API-Sports, ya que esa API utiliza una clave privada. En su lugar, el frontend se comunicará con una ruta interna del backend, y el backend será el encargado de llamar a API-Sports usando una variable de entorno.

```txt
   [ Usuario interactúa con la interfaz ]
                     |
                     v
              [ APP FRONTEND ]
                     |
                     v
          [ BACKEND / API EN VERCEL ]
         /             |             \
        v              v              v
 [ API-Sports ] [ REST Countries ] [ Open-Meteo ]
```

## 🔌 APIs Utilizadas en la Aplicación

1. **API-Sports / API-Football**
   Obtiene información relacionada con el Mundial 2026, como partidos, selecciones, grupos, resultados y estadísticas.

2. **REST Countries API**
   Muestra datos del país de cada selección, como bandera, capital, población, idioma, moneda y región.

3. **Open-Meteo API**
   Muestra el clima actual o pronosticado de la ciudad sede donde se jugará un partido.

## 🔐 Manejo de API Keys

La clave de API-Sports no se colocará directamente dentro del código JavaScript del frontend ni se subirá a GitHub.

Para protegerla, se usará una variable de entorno en Vercel:

```txt
API_FOOTBALL_KEY=tu_clave_privada
```

Esta variable se configurará desde el panel de Vercel en:

```txt
Project Settings → Environment Variables
```

De esta manera, el repositorio de GitHub tendrá el código del proyecto, pero no tendrá la clave privada.

## 📁 Estructura Planeada del Proyecto

```txt
mundialscope-2026/
│
├── index.html
├── styles.css
├── app.js
│
├── api/
│   ├── partidos.js
│   ├── grupos.js
│   └── pronostico.js
│
├── README.md
└── .gitignore
```

## ⚙️ Configuración Local e Instalación

1. Clonar el repositorio:

```bash
git clone https://github.com/pinela5202/mundialscope-2026.git
```

2. Entrar a la carpeta del proyecto:

```bash
cd mundialscope-2026
```

3. Crear un archivo `.env` para trabajar localmente:

```txt
API_FOOTBALL_KEY=tu_clave_privada
```

4. Agregar `.env` al archivo `.gitignore` para evitar subir claves privadas:

```txt
.env
```

5. Ejecutar el proyecto localmente usando Vercel CLI o una configuración compatible con funciones backend.

## 🌐 Despliegue

El proyecto será subido a GitHub como repositorio público, pero será desplegado en Vercel porque necesita backend para proteger la clave de API-Sports.

GitHub se usará para almacenar el código fuente y Vercel se usará para publicar la aplicación en línea.

## 🎯 Funcionalidades Previstas

* Consultar partidos del Mundial 2026.
* Ver selecciones participantes.
* Mostrar grupos y resultados.
* Consultar datos del país de cada selección.
* Mostrar clima de la ciudad sede.
* Realizar pronósticos básicos de partidos.
* Simular posibles clasificados y campeón del torneo.
* Mostrar una interfaz moderna, responsive y organizada.

## ✅ Objetivo Académico

El objetivo del proyecto es demostrar el consumo e integración de múltiples APIs externas dentro de una aplicación web, aplicando buenas prácticas como separación entre frontend y backend, manejo de variables de entorno y protección de claves privadas.
