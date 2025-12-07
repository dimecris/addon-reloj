// Reloj p5 para el add-on (p5.js v2.x, con cargas asíncronas)

// ------------------------
// Variables globales
// ------------------------
let f, f_bold;

// Recupero colores desde las variables CSS del :root
function getColorFromCSS(varName) {
  return getComputedStyle(document.documentElement)
    .getPropertyValue(varName).trim();
}

// Paleta de colores del proyecto
const P = {
  white: getColorFromCSS('--color-white'),
  whiteSemi: getColorFromCSS('--color-white'),
  black: getColorFromCSS('--color-black'),
  greyDark: getColorFromCSS('--color-grey-dark'),
  red: getColorFromCSS('--color-red'),
  green: getColorFromCSS('--color-green')
};

// Variables para el layout principal
let margin,
  bloqueX1,
  bloqueX2,
  baseY,
  lineH;

// Número de segmentos por línea (para la ondulación)
const SEGMENTS = 24;
let lineOffsets = [];

// A qué hora el sol toca el suelo (18:00 = 6 PM)
const HOURS_GROUND = 18;

// Hora manual (null = usar hora del sistema)
let manualHour = null;
let manualMinute = null;

// Dimensiones del sol
const d_sol = 20;
const r_sol = d_sol / 2;

// Modo oscuro (guardo en localStorage con p5.storage)
let modoOscuro;

// Propiedades del botón de modo oscuro
const btnMoon = {
  x: 0,
  y: 0,
  d: 32
};

// ------------------------
// Funciones auxiliares
// ------------------------

// Convierte horas del día a píxeles verticales (escala de 24h sobre 60 líneas)
function hoursToPixels(h) {
  const hoursFromSix = hourToIndex(h);
  return map(hoursFromSix, 0, 24, 0, lineH * 60);
}

// Mapeo de hora real (0-23) a índice con 06:00 arriba
function hourToIndex(h) {
  return (h - 6 + 24) % 24;
}

// ------------------------
// setup (asíncrono en p5)
// ------------------------
async function setup() {
  const canvas = createCanvas(300, 150);
  canvas.parent("canvas-container");

  // Cargo la fuente custom de forma asíncrona
  try {
    f = await loadFont("assets/Barlow/Barlow-Regular.ttf");
    textFont(f);
    f_bold = await loadFont("assets/Barlow/Barlow-Bold.ttf");
    textFont(f_bold);
  } catch (err) {
    console.error("Error cargando Barlow-Bold:", err);
  }

  // Leo el estado del modo oscuro desde localStorage
  try {
    modoOscuro = getItem("modoOscuro");
  } catch (e) {
    modoOscuro = null;
  }
  if (modoOscuro === null || modoOscuro === undefined) {
    modoOscuro = false;
  }

  noStroke();
  computeLayout();

  // Genero offsets aleatorios fijos para las 60 líneas
  randomSeed(12345);
  lineOffsets = new Array(60);
  for (let i = 0; i < 60; i++) {
    const row = new Float32Array(SEGMENTS + 1);
    for (let j = 0; j <= SEGMENTS; j++) {
      row[j] = random(-1.6, 1.6);
    }
    lineOffsets[i] = row;
  }
}

// ------------------------
// draw (bucle principal)
// ------------------------
function draw() {
  // Cambio el fondo según el modo
  if (modoOscuro) {
    background(P.black);
    fill(P.white);
  } else {
    background(P.white);
    fill(P.black);
  }

  // Obtengo la hora actual o la manual si está definida
  const sysH = hour();
  const sysM = minute();
  const h = manualHour ?? sysH;
  const m = manualMinute ?? sysM;
  const s = second();

  // Dibujo todos los elementos del reloj
  drawFooterBase();
  drawHorasSun(h);
  drawMinutosLinea(m, s);
  drawHeaderTime(h, m, s);
  drawHeaderTitle("ANAGNÓRISIS", "2 NOV 1917");
  drawElapsedSince("1917-11-02T05:30:25", h, m, s);
  drawDarkModeButton();
}

// ------------------------
// Cálculo del layout
// ------------------------
function computeLayout() {
  margin = 10;
  const containerW = width - margin * 2;
  const containerX1 = (width - containerW) / 2;
  const containerX2 = containerX1 + containerW;

  bloqueX1 = containerX1 + margin * 4;
  bloqueX2 = containerX2 - margin * 4;

  const bloqueH = height * 0.7;
  baseY = height - margin;
  lineH = bloqueH / 60;

  // Posiciono el botón de modo oscuro
  btnMoon.d = 36;
  btnMoon.x = width - margin - btnMoon.d * 0.2 - 2;
  btnMoon.y = height - margin - btnMoon.d * 0.4 - 2;
}

// ------------------------
// Líneas de minutos
// ------------------------
function drawMinutosLinea(minutoActual, segundoActual) {
  for (let i = 0; i < 60; i++) {
    const y = baseY - i * lineH;

    // Minutos completados
    if (i < minutoActual) {
      stroke(P.greyDark);
      strokeWeight(3);
      drawHandLine(i, bloqueX1, y, bloqueX2, 1);
    } 
    // Minuto actual progresando
    else if (i === minutoActual) {
      const portion = constrain(segundoActual / 59, 0, 1);
      stroke(P.red);
      strokeWeight(1);
      drawHandLine(i, bloqueX1, y - 2, bloqueX2, portion);
    }
  }
  noStroke();
}

// Dibujo de una línea ondulada con progreso parcial
function drawHandLine(lineIndex, x1, y1, x2, portion) {
  const lastSeg = floor(SEGMENTS * portion);
  noFill();

  strokeWeight(0.8);
  beginShape();
  for (let k = 0; k <= lastSeg; k++) {
    const t = k / SEGMENTS;
    const x = lerp(x1, x2, t);
    const oy = lineOffsets[lineIndex][k];
    vertex(x, y1 + oy);
  }
  endShape();
}

// ------------------------
// Suelo y sol
// ------------------------

// Calcula el rectángulo del suelo (verde)
function getGroundRect() {
  const sunsetY = baseY - hoursToPixels(HOURS_GROUND) + r_sol;
  const h = height - sunsetY;
  const stackW = bloqueX2 - bloqueX1;
  const w = stackW / 1.1;
  const cx = (bloqueX1 + bloqueX2) / 2;
  const x = cx - w / 2;

  return { x, y: sunsetY, w, h };
}

// Dibuja el rectángulo del suelo
function drawFooterBase() {
  const { x, y, w, h } = getGroundRect();
  noStroke();
  fill(P.green);
  rect(x, y, w, h);
}

// Dibuja el sol descendiendo según la hora
function drawHorasSun(horaActual) {
  push();
  const idx = hourToIndex(horaActual);
  const y = map(idx, 0, 23, baseY - lineH * 60, baseY);
  const x = (bloqueX1 + bloqueX2) * 0.5;

  // Sol rojo completo
  noStroke();
  fill(P.red);
  circle(x, y, d_sol);

  const { x: gx, y: gy, w: gw, h: gh } = getGroundRect();

  // Si el sol toca el suelo, recorto la parte inferior con clip
  if (y + r_sol > gy && y - r_sol < gy + gh) {
    const ctx = drawingContext;
    ctx.save();
    ctx.beginPath();
    ctx.rect(gx, gy, gw, gh);
    ctx.clip();

    noStroke();
    fill(P.whiteSemi);
    circle(x, y, d_sol);

    ctx.restore();
  }

  pop();
}

// ------------------------
// Cabecera y contador
// ------------------------

// Muestra la hora digital en el centro inferior
function drawHeaderTime(h, m, s) {
  push();
  translate(width / 2, height - 25);

  fill(P.white);
  textAlign(CENTER, CENTER);
  textFont(f_bold);
  textSize(22);
  text(nf(h, 2) + ":" + nf(m, 2) + ":" + nf(s, 2), 0, 0);
  pop();
}

// Título principal arriba a la derecha
function drawHeaderTitle(h1, fechaInicio) {
  fill(modoOscuro ? P.white : P.black);
  textAlign(RIGHT, TOP);
  textFont(f);
  textSize(12);

  const txt = h1.toLocaleUpperCase() + "\n desde " + `${fechaInicio}`;
  text(txt, width - margin, margin);
}

// Contador del tiempo transcurrido desde una fecha
function drawElapsedSince(isoDate, currentH, currentM, currentS) {
  const since = new Date(isoDate);
  
  // Creo la fecha "actual" usando la hora manual o del sistema
  const now = new Date();
  now.setHours(currentH);
  now.setMinutes(currentM);
  now.setSeconds(currentS);
  
  let deltaMs = now - since;
  if (isNaN(deltaMs)) return;

  const msPerHour = 1000 * 60 * 60;
  const msPerDay = msPerHour * 24;

  // Calculo días, horas, minutos y segundos
  const days = Math.floor(deltaMs / msPerDay);
  deltaMs -= days * msPerDay;
  const hours = Math.floor(deltaMs / msPerHour);
  deltaMs -= hours * msPerHour;
  const minutes = Math.floor(deltaMs / (1000 * 60));
  deltaMs -= minutes * (1000 * 60);
  const seconds = Math.floor(deltaMs / 1000);

  const txt = `${days.toLocaleString('es-ES')} d ${hours} h ${minutes} m ${seconds} s`;

  push();
  textAlign(LEFT, TOP);
  textSize(11);
  fill(modoOscuro ? P.white : P.green);
  text(txt, margin, margin);
  pop();
}

// Alternar modo oscuro y guardar la preferencia
function cambiarModoColor() {
  modoOscuro = !modoOscuro;
  try {
    storeItem("modoOscuro", modoOscuro);
  } catch (e) {
    console.warn("No se pudo guardar modoOscuro:", e);
  }
  console.log(`Modo oscuro: ${modoOscuro}`);
}

// Dibujo del botón de modo oscuro (luna)
function drawDarkModeButton() {
  push();
  const bg = modoOscuro ? P.black : P.white;
  const fg = modoOscuro ? P.white : P.black;

  // Círculo de fondo del botón
  noStroke();
  fill(bg === P.black ? P.white : P.black);
  circle(btnMoon.x, btnMoon.y, btnMoon.d);

  // Luna (círculo con mordida)
  noStroke();
  fill(fg);
  const r = btnMoon.d * 0.28;
  circle(btnMoon.x, btnMoon.y, r * 2);
  fill(bg);
  circle(btnMoon.x + r * 0.95, btnMoon.y, r * 2.5);
  pop();
}

// Detecto clic sobre el botón de modo oscuro
function mousePressed() {
  const dx = mouseX - btnMoon.x;
  const dy = mouseY - btnMoon.y;

  if (dx * dx + dy * dy <= (btnMoon.d * 0.5) ** 2) {
    cambiarModoColor();
  }
}

// ------------------------
// Setup del modal de info
// ------------------------
function modalSetup() {
  const modal = document.getElementById("info-modal");
  const infoButton = document.getElementById("info-button");
  const closeButton = document.querySelector(".close-button");

  infoButton.onclick = function() {
    modal.style.display = "block";
  };

  closeButton.onclick = function() {
    modal.style.display = "none";
  };

  // Cierra el modal si hago clic fuera
  window.onclick = function(event) {
    if (event.target == modal) {
      modal.style.display = "none";
    }
  };
}

// ------------------------
// Setup del slider de hora
// ------------------------
function timeSliderSetup() {
  const timeButton = document.getElementById('time-button');
  const container = document.getElementById('time-slider-container');
  const hourSlider = document.getElementById('hour-slider');
  const minuteSlider = document.getElementById('minute-slider');
  const hourDisplay = document.getElementById('hour-display');
  const minuteDisplay = document.getElementById('minute-display');
  const resetButton = document.getElementById('reset-time');

  if (!timeButton || !container || !hourSlider || !minuteSlider) return;

  // Muestro/oculto el slider al hacer clic en el botón
  timeButton.addEventListener('click', function() {
    container.style.display = container.style.display === 'none' ? 'block' : 'none';
  });

  // Slider de horas
  hourSlider.addEventListener('input', function(e) {
    const hour = parseInt(e.target.value);
    hourDisplay.textContent = hour.toString().padStart(2, '0');
    manualHour = hour;
  });

  // Slider de minutos
  minuteSlider.addEventListener('input', function(e) {
    const minute = parseInt(e.target.value);
    minuteDisplay.textContent = minute.toString().padStart(2, '0');
    manualMinute = minute;
  });

  // Botón reset vuelve a la hora del sistema
  resetButton.addEventListener('click', function() {
    manualHour = null;
    manualMinute = null;
    hourSlider.value = new Date().getHours();
    minuteSlider.value = new Date().getMinutes();
    hourDisplay.textContent = new Date().getHours().toString().padStart(2, '0');
    minuteDisplay.textContent = new Date().getMinutes().toString().padStart(2, '0');
  });
}

// Inicializo todo cuando el DOM esté listo
window.addEventListener('load', () => {
  modalSetup();
  timeSliderSetup();
});
