// Editor wiring: load photos locally, place them per panel, drag to
// reposition, tune grade and lettering, and export full-size PNG covers.
import { EXPORT_SIZES, LAYOUTS, freshPanel, initialState, sizeById } from './state.js';
import { panelIndexAt, renderCover } from './render.js';

const state = initialState();
const preview = document.getElementById('preview');
const pctx = preview.getContext('2d');

function redraw() {
  const size = sizeById(state.sizeId);
  preview.width = size.w;
  preview.height = size.h;
  renderCover(pctx, state, size.w, size.h, state.selected);
  syncPanelList();
  const panel = state.panels[state.selected];
  if (panel) document.getElementById('zoomRange').value = Math.round(panel.zoom * 100);
}

function syncPanelList() {
  const list = document.getElementById('panelList');
  const count = LAYOUTS[state.layout].panels.length;
  list.innerHTML = '';
  for (let i = 0; i < count; i++) {
    const btn = document.createElement('button');
    const has = state.panels[i] && state.panels[i].image;
    btn.textContent = `Panel ${i + 1}`;
    const tag = document.createElement('span');
    tag.textContent = has ? 'photo loaded' : 'empty';
    btn.appendChild(tag);
    if (i === state.selected) btn.classList.add('on');
    btn.addEventListener('click', () => { state.selected = i; redraw(); });
    list.appendChild(btn);
  }
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function assignPhoto(img) {
  const count = LAYOUTS[state.layout].panels.length;
  let slot = state.panels.findIndex((p) => !p || !p.image);
  if (slot < 0 || slot >= count) slot = state.selected;
  state.panels[slot] = freshPanel(img);
  state.selected = slot;
  redraw();
}

document.getElementById('photoInput').addEventListener('change', async (event) => {
  for (const file of event.target.files) {
    const url = URL.createObjectURL(file);
    try { assignPhoto(await loadImage(url)); } catch { /* skip unreadable file */ }
  }
});

document.querySelectorAll('[data-sample]').forEach((btn) => {
  btn.addEventListener('click', async () => {
    assignPhoto(await loadImage(btn.dataset.sample));
  });
});

function wireRow(rowId, attr, apply) {
  const row = document.getElementById(rowId);
  row.querySelectorAll('button').forEach((btn) => {
    btn.addEventListener('click', () => {
      row.querySelectorAll('button').forEach((b) => b.classList.remove('on'));
      btn.classList.add('on');
      apply(btn.dataset[attr]);
      redraw();
    });
  });
}

wireRow('layoutRow', 'layout', (v) => { state.layout = v; state.selected = 0; });
wireRow('gradeRow', 'grade', (v) => { state.grade = v; });
wireRow('sizeRow', 'size', (v) => { state.sizeId = v; });

document.getElementById('zoomRange').addEventListener('input', (e) => {
  const panel = state.panels[state.selected];
  if (panel) panel.zoom = Number(e.target.value) / 100;
  redraw();
});
document.getElementById('gradeRange').addEventListener('input', (e) => {
  state.gradeStrength = Number(e.target.value) / 100;
  redraw();
});
document.getElementById('titleInput').addEventListener('input', (e) => { state.title = e.target.value.toUpperCase(); redraw(); });
document.getElementById('captionInput').addEventListener('input', (e) => { state.caption = e.target.value.toUpperCase(); redraw(); });
document.getElementById('plateInput').addEventListener('input', (e) => { state.plateText = e.target.value.toUpperCase(); redraw(); });
document.getElementById('plateToggle').addEventListener('change', (e) => { state.showPlate = e.target.checked; redraw(); });

// Drag to reposition the photo inside the clicked panel.
let dragging = null;
function canvasPoint(event) {
  const rect = preview.getBoundingClientRect();
  return {
    x: (event.clientX - rect.left) * (preview.width / rect.width),
    y: (event.clientY - rect.top) * (preview.height / rect.height),
  };
}
preview.addEventListener('pointerdown', (event) => {
  const pt = canvasPoint(event);
  const idx = panelIndexAt(state, preview.width, preview.height, pt.x, pt.y);
  if (idx >= 0) {
    state.selected = idx;
    dragging = { idx, startX: pt.x, startY: pt.y };
    preview.setPointerCapture(event.pointerId);
    redraw();
  }
});
preview.addEventListener('pointermove', (event) => {
  if (!dragging) return;
  const panel = state.panels[dragging.idx];
  if (!panel || !panel.image) return;
  const pt = canvasPoint(event);
  panel.offsetX = Math.min(1, Math.max(0, panel.offsetX - (pt.x - dragging.startX) / preview.width));
  panel.offsetY = Math.min(1, Math.max(0, panel.offsetY - (pt.y - dragging.startY) / preview.height));
  dragging.startX = pt.x;
  dragging.startY = pt.y;
  redraw();
});
preview.addEventListener('pointerup', () => { dragging = null; });

// Export: render the same cover on an offscreen canvas at full size.
document.getElementById('exportBtn').addEventListener('click', () => {
  const size = sizeById(state.sizeId);
  const out = document.createElement('canvas');
  out.width = size.w;
  out.height = size.h;
  renderCover(out.getContext('2d'), state, size.w, size.h, -1);
  out.toBlob((blob) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `neon-vice-cover-${size.id}.png`;
    a.click();
    URL.revokeObjectURL(a.href);
  }, 'image/png');
});

// Preload the three people samples so the first paint already shows a cover.
(async () => {
  for (const src of ['samples/driver.jpg', 'samples/beach.jpg', 'samples/crew.jpg']) {
    try { assignPhoto(await loadImage(src)); } catch { /* sample missing: panel stays gradient */ }
  }
  state.selected = 0;
  redraw();
})();
