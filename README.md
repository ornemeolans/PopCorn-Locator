# PopCorn-Locator 🍿

**PopCorn-Locator** es una aplicación web diseñada para ayudar a los usuarios a encontrar sus películas favoritas y descubrir en qué plataformas de streaming están disponibles. Es una solución práctica para el dilema de "qué ver hoy" y "dónde encontrarlo".

## 🚀 Funcionalidades
- **Búsqueda Dinámica**: Encuentra películas por título en tiempo real.
- **Información Detallada**: Muestra sinopsis, valoraciones y pósteres oficiales.
- **Localizador de Streaming**: Identifica las plataformas donde se puede ver el contenido (Netflix, Disney+, HBO Max, etc.).
- **Interfaz Fluida**: Diseño minimalista y responsive enfocado en la experiencia del usuario.

## 🛠️ Tecnologías Utilizadas
El proyecto destaca por la implementación de lógica asíncrona y el manejo de servicios externos:

- **HTML5 & CSS3**: Estructura y diseño visual personalizado.
- **JavaScript (ES6+)**: Lógica de la aplicación, organizada en módulos (`api.js`, `ui.js`, `app.js`) para una mejor mantenibilidad.
- **Fetch API**: Consumo de APIs externas para obtener datos de películas y proveedores en tiempo real.
- **Arquitectura Modular**: Separación de responsabilidades entre la interfaz, la configuración y el manejo de datos.

## ⚙️ Instalación y Ejecución Local

1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/ornemeolans/popcorn-locator.git
2. **Navegar al directorio:**
   ```bash
   cd popcorn-locator
3. **Configuración de API:**
  Asegúrate de configurar tus credenciales en el archivo js/config.js si es necesario para el acceso a la base de datos de películas.
4. **Ejecución:**
  Obligatorio: Al utilizar módulos de JavaScript (type="module"), el navegador bloquea la ejecución si se abre el archivo directamente.
  Debes usar un servidor local (ej. Live Server o `npx serve`).

## 📂 Estructura del Proyecto
```text
/
├── css/            # Estilos de la aplicación
├── js/             # Lógica modular
│   ├── api.js      # Peticiones a servicios externos
│   ├── app.js      # Orquestador de la aplicación
│   ├── config.js   # Variables de configuración
│   ├── ui.js       # Manipulación del DOM e interfaz
│   └── utils.js    # Funciones de ayuda
└── index.html      # Punto de entrada principal
