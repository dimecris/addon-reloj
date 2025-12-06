import zipfile

readme_content = """# Reloj p5.js (Firefox Add-on, MV3)

## Descripción

Este proyecto implementa un reloj animado creado con p5.js (versión 2.x) y empaquetado como un add-on para Firefox bajo Manifest V3.  
El reloj muestra:

- La progresión de minutos mediante líneas onduladas.
- Un sol que desciende según la hora del día.
- Un contador del tiempo transcurrido desde una fecha histórica. 

(Declaración Balfour (2 de noviembre): El gobierno británico emitió una declaración pública prometiendo su apoyo al establecimiento de un hogar nacional para el pueblo judío en Palestina, una región habitada mayoritariamente por árabes.

La Declaración Balfour es vista como el origen del conflicto palestino-israelí, un “acto de traición” para muchos árabes que habían colaborado con los británicos.
)
- El título y la hora actual.
- Un modo oscuro persistente, almacenado mediante las funciones de p5.js (storeItem() y getItem()).

El proyecto demuestra:

- Uso de cargas asíncronas en p5.js v2 (sin preload()).
- Persistencia de datos con p5.storage.
- Integración en un popup de extensión respetando la CSP de MV3.
- Un diseño visual propio basado en un lienzo de 300x150 px.

---

## Estructura del proyecto

/
├── manifest.json
├── index.html
├── reloj.js
├── assets/
│   ├── icon.png
│   └── Barlow/
│       ├── Barlow-Bold.ttf
│       └── Barlow-Medium.ttf (opcional)
└── p5/
    ├── p5.min.js
    └── addons/
        └── p5.dom.min.js

Nota: p5.sound no se utiliza y no es necesario incluirlo.

---

## Instalación (modo desarrollo)

1. Abrir Firefox y acceder a: about:debugging  
2. Seleccionar: This Firefox  
3. Clic en: Load Temporary Add-on…  
4. Seleccionar manifest.json o cualquier archivo del proyecto  

El reloj aparecerá en el popup de la extensión tras hacer clic en su icono.

---

## Tecnologías utilizadas

### p5.js v2.x
- Uso de async setup() para cargas asíncronas.
- Carga de fuentes con await loadFont().
- Eliminación de preload().

### p5.storage
Utilizado para persistir el modo oscuro entre sesiones:

storeItem("modoOscuro", modoOscuro);
modoOscuro = getItem("modoOscuro") ?? false;

### WebExtensions Manifest V3 (Firefox)
El popup se declara mediante:

"action": {
  "default_popup": "index.html"
}

Y se incluye el permiso requerido por el enunciado académico:

"permissions": ["storage"]

### CSP estricta

"content_security_policy": {
  "extension_pages": "script-src 'self'; object-src 'self'"
}

Esto requiere que todos los scripts (p5.js y el sketch) se carguen desde archivos locales.

---

## Persistencia del modo oscuro

El usuario puede alternar entre modo claro y oscuro mediante un botón circular dibujado directamente en el canvas.  
La preferencia queda guardada mediante p5.storage y se recupera al volver a abrir el popup.

---

## Funcionalidades del reloj

### Minutos
Representados mediante 60 líneas onduladas generadas con offsets aleatorios precalculados.

### Segundos
La línea correspondiente al minuto actual se va completando gradualmente.

### Horas
Un sol desciende desde el amanecer (06:00) hasta tocar el suelo a las 18:00.

### Tiempo transcurrido desde una fecha
El sketch muestra un contador en formato:

123 d 4 h 56 m 12 s

### Ajuste manual de hora y minuto
- Flechas ↑ ↓ permiten ajustar la hora.
- Flechas ← → permiten ajustar los minutos.
- Doble clic restaura la hora del sistema.

---

## Detalles técnicos relevantes

### Layout dinámico
El diseño del reloj se adapta al área del canvas mediante la función computeLayout().

### Recorte del sol con el suelo
Se utiliza clipping con el contexto 2D:

ctx.clip();
circle(x, y, d_sol);


## Licencia

Creative Commons Attribution 4.0 International (CC BY 4.0)

---

## Autora

Kris Darias  
Extensión desarrollada con p5.js v2 y Firefox Manifest V3.

