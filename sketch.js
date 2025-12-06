// Reloj p5 para el add-on. Mantengo todo en modo global para simplificar.

let f_bold;

// Paleta rápida para no repetir hex
const P = {
  white: "#ffffff",
  whiteSemi: "#ffffff88",
  black: "#111111",
  greyDark: "#292929ff",
  red: "#e4312b",
  green: "#149954"
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

// Sol sencillo para el visor
const d_sol = 20;
const r_sol = d_sol / 2;

// Estado de modo oscuro
let modoOscuro;

// Convierte una hora del día al desplazamiento vertical (escala 24h sobre 60 líneas)
function hoursToPixels(h) {
  const hoursFromSix = hourToIndex(h);
  return map(hoursFromSix, 0, 24, 0, lineH * 60);
}

// Mapea hora real (0-23) a índice con 06:00 en la parte superior
function hourToIndex(h) {
  return (h - 6 + 24) % 24;
}

function preload() {
  f_bold = loadFont("assets/Barlow/Barlow-Bold.ttf");
}

function setup() {
  const canvas = createCanvas(300, 150);
  canvas.parent("canvas-container");

  // Recupero el estado del toggle de color
  modoOscuro = getItem("modoOscuro") ?? false;
  select("#color-toggle");

  noStroke();
  textFont(f_bold);
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

function draw() {
  // Fondo según modo
  if (modoOscuro) {
    background(20);
    fill(230);
  } else {
    background(240);
    fill(30);
  }

  // Hora del sistema o la que fijo con el teclado
  const sysH = hour();
  const sysM = minute();
  const h = manualHour ?? sysH;
  const m = manualMinute ?? sysM;
  const s = second();

  drawFooterBase();
  drawHorasSun(h, s);
  drawMinutosLinea(m, s);
  drawHeaderTime(h, m, s);
  drawHeaderTitle("ANAGNÓRISIS", "11 NOV 1917");
  drawElapsedSince("1917-11-02T05:30:25");
}

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
}

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

// Rectángulo del suelo: lo reutilizo para dibujar y para recortar el sol
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

// Sol que cae: usa la escala de horas y se recorta con el suelo
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
  fill(P.black);
  textAlign(RIGHT, TOP);
  textSize(12);

  const txt = h1.toLocaleUpperCase() + "\n desde " + `${fechaInicio}`;
  text(txt, width - margin, margin);
}

function drawElapsedSince(isoDate) {
  const since = new Date(isoDate);
  const now = new Date();
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

  const txt = `${days} d ${hours} h ${minutes} m ${seconds} s`;

  push();
  textAlign(LEFT, TOP);
  textSize(11);
  fill(P.green);
  text(txt, margin, margin);
  pop();
}

// Control rápido con flechas para ajustar hora/minuto
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
  storeItem("modoOscuro", modoOscuro);
  console.log(`Modo oscuro cambiado a: ${modoOscuro}. Guardado en storage.`);
}
