// Canvas renderer: draws the multi-panel cover — graded photo panels,
// gradient title lettering, caption bar and an original licence-plate badge.
import { GRADES, LAYOUTS } from './state.js';

const TITLE_FONT = '"Arial Black", "Segoe UI", system-ui, sans-serif';

function panelRects(state, w, h) {
  return LAYOUTS[state.layout].panels.map((p) => ({
    x: p.x * w, y: p.y * h, w: p.w * w, h: p.h * h,
  }));
}

function drawPhotoPanel(ctx, panel, rect, grade, strength) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  if (panel && panel.image) {
    const img = panel.image;
    const base = Math.max(rect.w / img.naturalWidth, rect.h / img.naturalHeight);
    const scale = base * panel.zoom;
    const dw = img.naturalWidth * scale;
    const dh = img.naturalHeight * scale;
    const dx = rect.x + (rect.w - dw) * panel.offsetX;
    const dy = rect.y + (rect.h - dh) * panel.offsetY;
    ctx.filter = grade.filter;
    ctx.drawImage(img, dx, dy, dw, dh);
    ctx.filter = 'none';
  } else {
    const sky = ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.h);
    sky.addColorStop(0, '#3a1c71');
    sky.addColorStop(0.6, '#d76d77');
    sky.addColorStop(1, '#ffaf7b');
    ctx.fillStyle = sky;
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  }
  // Grade wash: sunset/neon duotone over the photo.
  const wash = ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.h);
  wash.addColorStop(0, grade.top);
  wash.addColorStop(1, grade.bottom);
  ctx.globalAlpha = strength;
  ctx.globalCompositeOperation = 'overlay';
  ctx.fillStyle = wash;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1;
  // Soft vignette so panels read as one poster.
  const vig = ctx.createRadialGradient(
    rect.x + rect.w / 2, rect.y + rect.h / 2, Math.min(rect.w, rect.h) * 0.35,
    rect.x + rect.w / 2, rect.y + rect.h / 2, Math.max(rect.w, rect.h) * 0.75,
  );
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(1, 'rgba(0,0,0,0.35)');
  ctx.fillStyle = vig;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.restore();
}

function drawPanelFrames(ctx, rects) {
  ctx.lineWidth = Math.max(4, rects[0].w * 0.012);
  ctx.strokeStyle = '#0b0618';
  for (const r of rects) ctx.strokeRect(r.x, r.y, r.w, r.h);
}

// Gradient title lettering: sunset gradient fill, heavy dark outline,
// soft drop shadow — drawn with canvas gradients, no font files.
function drawGradientTitle(ctx, text, cx, y, maxWidth, maxSize) {
  let size = Math.min(maxWidth * 0.16, maxSize);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const setFont = (s) => { ctx.font = `900 ${s}px ${TITLE_FONT}`; };
  setFont(size);
  while (ctx.measureText(text).width > maxWidth && size > 24) {
    size -= 4;
    setFont(size);
  }
  const grad = ctx.createLinearGradient(cx, y - size * 0.6, cx, y + size * 0.6);
  grad.addColorStop(0, '#fff6b7');
  grad.addColorStop(0.35, '#ffb03a');
  grad.addColorStop(0.65, '#ff2e88');
  grad.addColorStop(1, '#7b2ff7');
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.65)';
  ctx.shadowBlur = size * 0.12;
  ctx.shadowOffsetY = size * 0.08;
  ctx.lineJoin = 'round';
  ctx.lineWidth = size * 0.22;
  ctx.strokeStyle = '#12041f';
  ctx.strokeText(text, cx, y);
  ctx.shadowBlur = 0;
  ctx.fillStyle = grad;
  ctx.fillText(text, cx, y);
  ctx.restore();
  return size;
}

function drawCaptionBar(ctx, caption, w, h, titleY, titleSize) {
  const barH = h * 0.055;
  const barY = titleY + titleSize * 0.85;
  ctx.fillStyle = 'rgba(8, 4, 20, 0.82)';
  ctx.fillRect(w * 0.08, barY, w * 0.84, barH);
  ctx.fillStyle = '#19d3ff';
  ctx.fillRect(w * 0.08, barY, w * 0.84, Math.max(3, barH * 0.08));
  ctx.font = `700 ${barH * 0.52}px ${TITLE_FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#fff7ea';
  ctx.fillText(caption, w / 2, barY + barH / 2 + 1);
}

// Original licence-plate style badge: rounded plate, screw dots, state
// strip and big plate letters. No game logo or wordmark anywhere.
function drawPlateBadge(ctx, text, cx, cy, plateW) {
  const plateH = plateW * 0.52;
  const x = cx - plateW / 2;
  const y = cy - plateH / 2;
  const r = plateH * 0.16;
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.55)';
  ctx.shadowBlur = plateW * 0.04;
  ctx.shadowOffsetY = plateW * 0.02;
  ctx.beginPath();
  ctx.roundRect(x, y, plateW, plateH, r);
  ctx.fillStyle = '#fdf6e3';
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.lineWidth = plateW * 0.02;
  ctx.strokeStyle = '#1b2a6b';
  ctx.stroke();
  ctx.beginPath();
  ctx.roundRect(x + plateW * 0.03, y + plateH * 0.06, plateW * 0.94, plateH * 0.88, r * 0.7);
  ctx.strokeStyle = '#ff2e88';
  ctx.lineWidth = plateW * 0.012;
  ctx.stroke();
  // State strip across the top.
  ctx.fillStyle = '#1b2a6b';
  ctx.font = `700 ${plateH * 0.16}px ${TITLE_FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('VICE STATE', cx, y + plateH * 0.2);
  // Plate letters.
  ctx.fillStyle = '#12235c';
  ctx.font = `900 ${plateH * 0.44}px ${TITLE_FONT}`;
  ctx.fillText(text || 'VI', cx, y + plateH * 0.62);
  // Screw dots in the corners.
  ctx.fillStyle = '#8a93a6';
  for (const [sx, sy] of [[0.08, 0.14], [0.92, 0.14], [0.08, 0.86], [0.92, 0.86]]) {
    ctx.beginPath();
    ctx.arc(x + plateW * sx, y + plateH * sy, plateW * 0.018, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

export function renderCover(ctx, state, w, h, highlightIndex = -1) {
  const grade = GRADES[state.grade];
  ctx.fillStyle = '#0b0618';
  ctx.fillRect(0, 0, w, h);
  const rects = panelRects(state, w, h);
  rects.forEach((rect, i) => drawPhotoPanel(ctx, state.panels[i], rect, grade, state.gradeStrength));
  drawPanelFrames(ctx, rects);
  if (highlightIndex >= 0 && rects[highlightIndex]) {
    const r = rects[highlightIndex];
    ctx.strokeStyle = '#19d3ff';
    ctx.lineWidth = Math.max(3, w * 0.004);
    ctx.setLineDash([w * 0.012, w * 0.008]);
    ctx.strokeRect(r.x + 4, r.y + 4, r.w - 8, r.h - 8);
    ctx.setLineDash([]);
  }
  // Title block lives in the bottom band under the panels.
  const bandY = h * 0.78;
  const titleY = bandY + h * 0.085;
  const titleSize = drawGradientTitle(ctx, state.title || 'NEON VICE', w / 2, titleY, w * 0.92, h * 0.085);
  drawCaptionBar(ctx, state.caption || '', w, h, titleY, titleSize);
  if (state.showPlate) {
    drawPlateBadge(ctx, state.plateText, w * 0.86, h * 0.9, w * 0.2);
  }
}

export function panelIndexAt(state, w, h, px, py) {
  const rects = panelRects(state, w, h);
  for (let i = 0; i < rects.length; i++) {
    const r = rects[i];
    if (px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h) return i;
  }
  return -1;
}
