// Reloj p5 para el add-on (p5.js v2.x, con cargas asíncronas)

// ------------------------
// Variables globales
// ------------------------
let f_bold;

// En sketch.js, después de que el DOM esté listo
function getColorFromCSS(varName) {
  return getComputedStyle(document.documentElement)
    .getPropertyValue(varName).trim();
}

// Luego puedes usarlas:
const P = {
  white: getColorFromCSS('--color-white'),
  whiteSemi: getColorFromCSS('--color-white'),
  black: getColorFromCSS('--color-black'),
  greyDark: getColorFromCSS('--color-grey-dark'),
  red: getColorFromCSS('--color-red'),
  green: getColorFromCSS('--color-green')
};

// Layout y medidas básicas
let margin,
  bloqueX1,
  bloqueX2,
  baseY,
  lineH;

// Ondulación de las líneas de minutos
const SEGMENTS = 24;
let lineOffsets = [];

// Hora a la que el sol toca el suelo
const HOURS_GROUND = 18;

// Ajuste manual de hora/minuto con teclado
let manualHour = null;
let manualMinute = null;

// Sol
const d_sol = 20;
const r_sol = d_sol / 2;

// Estado de modo oscuro
let modoOscuro;

// Botón de modo oscuro
const btnMoon = {
  x: 0,
  y: 0,
  d: 32
};

// ------------------------
// Helpers horas / layout
// ------------------------

// Convierte una hora del día al desplazamiento vertical (escala 24h sobre 60 líneas)
function hoursToPixels(h) {
  const hoursFromSix = hourToIndex(h);
  return map(hoursFromSix, 0, 24, 0, lineH * 60);
}

// Mapea hora real (0-23) a índice con 06:00 en la parte superior
function hourToIndex(h) {
  return (h - 6 + 24) % 24;
}

// ------------------------
// setup asíncrono (p5 v2)
// ------------------------
async function setup() {
  const canvas = createCanvas(300, 150);
  canvas.parent("canvas-container");

  // Carga asíncrona de la fuente
  try {
    f_bold = await loadFont("assets/Barlow/Barlow-Bold.ttf");
    textFont(f_bold);
  } catch (err) {
    console.error("Error cargando la fuente Barlow-Bold:", err);
    // fallback a la fuente por defecto de p5
  }

  // Recupero el estado del toggle de color desde localStorage (p5.storage)
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

  // Offsets fijos para las 60 líneas (reproducibles)
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
// draw
// ------------------------
function draw() {
  // Fondo según modo
  if (modoOscuro) {
    background(P.black);
    fill(P.white);
  } else {
    background(P.white);
    fill(P.black);
  }

  // Hora del sistema o la que fijo con el teclado
  const sysH = hour();
  const sysM = minute();
  const h = manualHour ?? sysH;
  const m = manualMinute ?? sysM;
  const s = second();

  drawFooterBase();
  drawHorasSun(h);
  drawMinutosLinea(m, s);
  drawHeaderTime(h, m, s);
  drawHeaderTitle("ANAGNÓRISIS", "2 NOV 1917");
  drawElapsedSince("1917-11-02T05:30:25", h, m, s);
  drawDarkModeButton();
}

// ------------------------
// Layout
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

  // Botón modo oscuro
  btnMoon.d = 36;
  btnMoon.x = width - margin - btnMoon.d * 0.2 - 2;
  btnMoon.y = height - margin - btnMoon.d * 0.4 - 2;
}

// ------------------------
// Dibujo de líneas minutos
// ------------------------
function drawMinutosLinea(minutoActual, segundoActual) {
  for (let i = 0; i < 60; i++) {
    const y = baseY - i * lineH;

    if (i < minutoActual) {
      stroke(P.greyDark);
      strokeWeight(3);
      drawHandLine(i, bloqueX1, y, bloqueX2, 1);
    } else if (i === minutoActual) {
      const portion = constrain(segundoActual / 59, 0, 1);
      stroke(P.red);
      strokeWeight(1);
      drawHandLine(i, bloqueX1, y - 2, bloqueX2, portion);
    }
  }
  noStroke();
}

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
function getGroundRect() {
  const sunsetY = baseY - hoursToPixels(HOURS_GROUND) + r_sol;
  const h = height - sunsetY;
  const stackW = bloqueX2 - bloqueX1;
  const w = stackW / 1.1;
  const cx = (bloqueX1 + bloqueX2) / 2;
  const x = cx - w / 2;

  return { x, y: sunsetY, w, h };
}

function drawFooterBase() {
  const { x, y, w, h } = getGroundRect();
  noStroke();
  fill(P.green);
  rect(x, y, w, h);
}

function drawHorasSun(horaActual) {
  push();
  const idx = hourToIndex(horaActual);
  const y = map(idx, 0, 23, baseY - lineH * 60, baseY);
  const x = (bloqueX1 + bloqueX2) * 0.5;

  noStroke();
  fill(P.red);
  circle(x, y, d_sol);

  const { x: gx, y: gy, w: gw, h: gh } = getGroundRect();

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
function drawHeaderTime(h, m, s) {
  push();
  translate(width / 2, height - 25);

  fill(P.white);
  textAlign(CENTER, CENTER);
  textSize(22);
  text(nf(h, 2) + ":" + nf(m, 2) + ":" + nf(s, 2), 0, 0);
  pop();
}

function drawHeaderTitle(h1, fechaInicio) {
  fill(modoOscuro ? P.white : P.black);
  textAlign(RIGHT, TOP);
  textSize(12);

  const txt = h1.toLocaleUpperCase() + "\n desde " + `${fechaInicio}`;
  text(txt, width - margin, margin);
}

function drawElapsedSince(isoDate, currentH, currentM, currentS) {
  const since = new Date(isoDate);
  
  // Usar hora manual o del sistema
  const now = new Date();
  now.setHours(currentH);
  now.setMinutes(currentM);
  now.setSeconds(currentS);
  
  let deltaMs = now - since;
  if (isNaN(deltaMs)) return;

  const msPerHour = 1000 * 60 * 60;
  const msPerDay = msPerHour * 24;

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

// ------------------------
// Interacción
// ------------------------
function keyPressed() {
  if (keyCode === UP_ARROW) {
    manualHour = (((manualHour ?? hour()) + 1) % 24 + 24) % 24;
  }
  if (keyCode === DOWN_ARROW) {
    manualHour = (((manualHour ?? hour()) - 1) % 24 + 24) % 24;
  }
  if (keyCode === RIGHT_ARROW) {
    manualMinute = (((manualMinute ?? minute()) + 1) % 60 + 60) % 60;
  }
  if (keyCode === LEFT_ARROW) {
    manualMinute = (((manualMinute ?? minute()) - 1) % 60 + 60) % 60;
  }
}

function doubleClicked() {
  manualHour = null;
  manualMinute = null;
}

function cambiarModoColor() {
  modoOscuro = !modoOscuro;
  try {
    storeItem("modoOscuro", modoOscuro);
  } catch (e) {
    console.warn("No se pudo guardar modoOscuro:", e);
  }
  console.log(`Modo oscuro cambiado a: ${modoOscuro}. Guardado en storage.`);
}

function drawDarkModeButton() {
  push();
  const bg = modoOscuro ? P.black : P.white;
  const fg = modoOscuro ? P.white : P.black;

  noStroke();
  fill(bg === P.black ? P.white : P.black);
  circle(btnMoon.x, btnMoon.y, btnMoon.d);

  noStroke();
  fill(fg);
  const r = btnMoon.d * 0.28;
  circle(btnMoon.x, btnMoon.y, r * 2);
  fill(bg);
  circle(btnMoon.x + r * 0.95, btnMoon.y, r * 2.5);
  pop();
}

function mousePressed() {
  const dx = mouseX - btnMoon.x;
  const dy = mouseY - btnMoon.y;

  if (dx * dx + dy * dy <= (btnMoon.d * 0.5) ** 2) {
    cambiarModoColor();
  }
}
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

  window.onclick = function(event) {
    if (event.target == modal) {
      modal.style.display = "none";
    }
  };
}

function timeSliderSetup() {
  const timeButton = document.getElementById('time-button');
  const container = document.getElementById('time-slider-container');
  const hourSlider = document.getElementById('hour-slider');
  const minuteSlider = document.getElementById('minute-slider');
  const hourDisplay = document.getElementById('hour-display');
  const minuteDisplay = document.getElementById('minute-display');
  const resetButton = document.getElementById('reset-time');

  if (!timeButton || !container || !hourSlider || !minuteSlider) return;

  timeButton.addEventListener('click', function() {
    container.style.display = container.style.display === 'none' ? 'block' : 'none';
  });

  hourSlider.addEventListener('input', function(e) {
    const hour = parseInt(e.target.value);
    hourDisplay.textContent = hour.toString().padStart(2, '0');
    manualHour = hour;
  });

  minuteSlider.addEventListener('input', function(e) {
    const minute = parseInt(e.target.value);
    minuteDisplay.textContent = minute.toString().padStart(2, '0');
    manualMinute = minute;
  });

  resetButton.addEventListener('click', function() {
    manualHour = null;
    manualMinute = null;
    hourSlider.value = new Date().getHours();
    minuteSlider.value = new Date().getMinutes();
    hourDisplay.textContent = new Date().getHours().toString().padStart(2, '0');
    minuteDisplay.textContent = new Date().getMinutes().toString().padStart(2, '0');
  });
}

window.addEventListener('load', () => {
  modalSetup();
  timeSliderSetup();
});
