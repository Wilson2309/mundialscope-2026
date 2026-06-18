# 🚀 MundialScope 2026

Dashboard interactivo y adaptativo desarrollado como actividad práctica de integración de servicios externos en producción.

## 🛠️ Arquitectura del Proyecto
La aplicación consta de un cliente estático (Frontend) desarrollado con HTML5 nativo, estilos de diseño responsivo, e integra un flujo lógico de llamadas Fetch asíncronas para resolver y sincronizar los datos de 3 proveedores externos.

```
   [ Usuario interactúa con la interfaz ]
                     |
                     v
             [ APP FRONTEND ]
         /           |           \
        v            v            v
  [ API Clima ]  [ API Países ]  [ API Imágenes ]
```

## 🔌 APIs Utilizadas en la Aplicación
1. **API-Sports**: Obtiene partidos, selecciones, grupos, resultados y estadísticas del Mundial 2026.
2. **REST Countries API**: Muestra datos del país de cada selección, como bandera, capital, población, idioma y moneda.
3. **Open-Meteo API**: Muestra el clima actual o pronosticado de la ciudad sede donde se jugará un partido.

## 💻 Configuración Local e Instalación
1. Clona este repositorio público:
   ```bash
   git clone https://github.com/tu-usuario/nombre-del-repo.git
   ```
2. Abre el archivo `index.html` de forma directa o ejecuta un servidor en vivo local. No requiere variables de entorno pesadas en el cliente local.
