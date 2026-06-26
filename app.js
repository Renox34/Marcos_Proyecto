// ════════════════════════════════════════════════
//  VESTRY — app.js  (ES2023 module, vanilla JS)
// ════════════════════════════════════════════════

const API = 'http://localhost:3000/api';

const AppState = {
  currentUser: null,
  currentView: 'wardrobe',
  selectedGarments: [],   // para outfit builder
  chatHistory: [],
  garments: [],
  outfits: [],
  calendarEntries: [],
  calendarYear: new Date().getFullYear(),
  calendarMonth: new Date().getMonth(),
  activeStyles: [],
  pendingOutfitDataUrl: null,
  pendingAvatarBlob: null,
};

// ── CATEGORÍAS ────────────────────────────────────
const CATEGORY_LABELS = {
  top: 'Top / Camisa', bottom: 'Bottom / Pantalón', dress: 'Vestido',
  outerwear: 'Abrigo', shoes: 'Calzado', accessory: 'Accesorio'
};

const LAYER_ORDER = ['outerwear', 'dress', 'top', 'bottom', 'accessory', 'shoes'];

const STYLES = [
  { key: 'minimal', name: 'Minimal Chic', icon: '🤍' },
  { key: 'y2k', name: 'Y2K Revival', icon: '💿' },
  { key: 'dark-academia', name: 'Dark Academia', icon: '📚' },
  { key: 'coastal', name: 'Coastal Grandmother', icon: '🌊' },
  { key: 'streetwear', name: 'Streetwear', icon: '🧢' },
  { key: 'office-siren', name: 'Office Siren', icon: '💼' },
  { key: 'cottagecore', name: 'Cottagecore', icon: '🌸' },
  { key: 'old-money', name: 'Old Money', icon: '🏛' },
  { key: 'grunge', name: '90s Grunge', icon: '🎸' },
  { key: 'barbiecore', name: 'Barbiecore', icon: '🩷' },
];

// ── TOAST ─────────────────────────────────────────
function toast(msg, type = 'info') {
  const icons = { success: '✓', error: '✗', info: 'ℹ' };
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `<span>${icons[type] || 'ℹ'}</span> ${msg}`;
  document.getElementById('toast-container').appendChild(el);
  setTimeout(() => el.remove(), 3500);
}

// ── NAVIGATION ────────────────────────────────────
document.querySelectorAll('.nav-item[data-view]').forEach(item => {
  item.addEventListener('click', () => {
    const view = item.dataset.view;
    switchView(view);
  });
});

function switchView(view) {
  AppState.currentView = view;
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById(`view-${view}`)?.classList.add('active');
  document.querySelector(`.nav-item[data-view="${view}"]`)?.classList.add('active');

  if (view === 'wardrobe') renderWardrobe();
  if (view === 'outfit')   renderOutfitBuilder();
  if (view === 'calendar') renderCalendar();
  if (view === 'discover') renderDiscover();
  if (view === 'insights') loadAnalytics();
  if (view === 'capsule')  renderCapsule();
}

// ── ONBOARDING ────────────────────────────────────
function checkUser() {
  const stored = localStorage.getItem('vestry_user');
  if (stored) {
    AppState.currentUser = JSON.parse(stored);
    updateSidebarAvatar();
    loadGarments();
    loadOutfits();
  } else {
    document.getElementById('modal-onboarding').style.display = 'flex';
  }
}

function updateSidebarAvatar() {
  const el = document.getElementById('sidebar-avatar');
  if (AppState.currentUser?.avatar_url) {
    el.innerHTML = `<img src="${AppState.currentUser.avatar_url}" alt="avatar">`;
  } else {
    el.innerHTML = AppState.currentUser?.name?.[0]?.toUpperCase() || '👤';
  }
}

// Avatar upload en onboarding
document.getElementById('avatar-preview-btn').addEventListener('click', () => {
  document.getElementById('avatar-file-input').click();
});

document.getElementById('avatar-file-input').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  document.getElementById('avatar-processing').style.display = 'block';
  document.getElementById('avatar-preview-placeholder').style.display = 'none';

  try {
    const blob = await removeBackground(file);
    AppState.pendingAvatarBlob = blob;
    const url = URL.createObjectURL(blob);
    const img = document.getElementById('avatar-preview-img');
    img.src = url;
    img.style.display = 'block';
    document.getElementById('avatar-preview-placeholder').style.display = 'none';
  } catch (err) {
    console.warn('Background removal failed, using original:', err);
    AppState.pendingAvatarBlob = file;
    const url = URL.createObjectURL(file);
    const img = document.getElementById('avatar-preview-img');
    img.src = url;
    img.style.display = 'block';
  } finally {
    document.getElementById('avatar-processing').style.display = 'none';
  }
});

document.getElementById('btn-onboarding-submit').addEventListener('click', async () => {
  const name = document.getElementById('onboarding-name').value.trim();
  const email = document.getElementById('onboarding-email').value.trim();
  if (!name || !email) { toast('Completa nombre y email', 'error'); return; }

  const formData = new FormData();
  formData.append('name', name);
  formData.append('email', email);
  if (AppState.pendingAvatarBlob) {
    formData.append('avatar', AppState.pendingAvatarBlob, 'avatar.png');
  }

  try {
    const res = await fetch(`${API}/users/register`, { method: 'POST', body: formData });
    const data = await res.json();
    if (data.user) {
      AppState.currentUser = data.user;
      localStorage.setItem('vestry_user', JSON.stringify(data.user));
      document.getElementById('modal-onboarding').style.display = 'none';
      updateSidebarAvatar();
      loadGarments();
      loadOutfits();
      toast(`¡Bienvenida, ${data.user.name}! ✨`, 'success');
    }
  } catch (err) {
    toast('Error al crear perfil. ¿Está el servidor corriendo?', 'error');
  }
});

// ── BACKGROUND REMOVAL ────────────────────────────
async function removeBackground(file) {
  const { removeBackground: removeBg } = await import(
    'https://cdn.jsdelivr.net/npm/@imgly/background-removal@1.4.5/dist/background-removal.js'
  );
  const blob = await removeBg(file, {
    publicPath: 'https://cdn.jsdelivr.net/npm/@imgly/background-removal@1.4.5/dist/'
  });
  return blob;
}

// ── GARMENTS ──────────────────────────────────────
async function loadGarments() {
  if (!AppState.currentUser) return;
  try {
    const res = await fetch(`${API}/garments?userId=${AppState.currentUser.id}`);
    AppState.garments = await res.json();
    renderWardrobe();
    renderOutfitBuilder();
  } catch (err) {
    console.error('Error cargando prendas:', err);
  }
}

let currentWardrobeFilter = 'all';

function renderWardrobe() {
  const grid = document.getElementById('garments-grid');
  const empty = document.getElementById('wardrobe-empty');
  const garments = currentWardrobeFilter === 'all'
    ? AppState.garments
    : AppState.garments.filter(g => g.category === currentWardrobeFilter);

  if (garments.length === 0) {
    grid.innerHTML = '';
    grid.appendChild(empty);
    empty.style.display = 'flex';
    return;
  }
  empty.style.display = 'none';
  grid.innerHTML = garments.map(g => `
    <div class="garment-card" data-id="${g.id}">
      <img src="http://localhost:3000${g.image_url}" alt="${g.name}" loading="lazy">
      <div class="garment-card-name">${g.name}</div>
      <div class="garment-card-cat">${CATEGORY_LABELS[g.category] || g.category}</div>
      <div class="garment-card-delete" data-delete="${g.id}">🗑</div>
    </div>
  `).join('');

  grid.querySelectorAll('.garment-card-delete').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      deleteGarment(btn.dataset.delete);
    });
  });
}

// Filtros del guardarropa
document.getElementById('wardrobe-filters').addEventListener('click', (e) => {
  const chip = e.target.closest('.chip');
  if (!chip) return;
  document.querySelectorAll('#wardrobe-filters .chip').forEach(c => c.classList.remove('active'));
  chip.classList.add('active');
  currentWardrobeFilter = chip.dataset.cat;
  renderWardrobe();
});

async function deleteGarment(id) {
  if (!confirm('¿Eliminar esta prenda?')) return;
  try {
    await fetch(`${API}/garments/${id}`, { method: 'DELETE' });
    AppState.garments = AppState.garments.filter(g => g.id != id);
    AppState.selectedGarments = AppState.selectedGarments.filter(g => g.id != id);
    renderWardrobe();
    renderOutfitBuilder();
    renderSelectedList();
    toast('Prenda eliminada', 'success');
  } catch (err) {
    toast('Error eliminando prenda', 'error');
  }
}

// ── AGREGAR PRENDA ────────────────────────────────
let pendingGarmentBlob = null;

document.getElementById('btn-add-garment').addEventListener('click', openAddGarment);
document.getElementById('btn-add-garment-empty')?.addEventListener('click', openAddGarment);
document.getElementById('close-add-garment').addEventListener('click', closeAddGarment);

function openAddGarment() {
  pendingGarmentBlob = null;
  document.getElementById('garment-processing').style.display = 'none';
  document.getElementById('garment-preview-area').style.display = 'none';
  document.getElementById('garment-form').style.display = 'none';
  document.getElementById('garment-upload-zone').style.display = 'flex';
  document.getElementById('modal-add-garment').style.display = 'flex';
}

function closeAddGarment() {
  document.getElementById('modal-add-garment').style.display = 'none';
}

const uploadZone = document.getElementById('garment-upload-zone');
uploadZone.addEventListener('click', () => document.getElementById('garment-file-input').click());
uploadZone.addEventListener('dragover', (e) => { e.preventDefault(); uploadZone.classList.add('drag-over'); });
uploadZone.addEventListener('dragleave', () => uploadZone.classList.remove('drag-over'));
uploadZone.addEventListener('drop', (e) => {
  e.preventDefault();
  uploadZone.classList.remove('drag-over');
  const file = e.dataTransfer.files[0];
  if (file) processGarmentImage(file);
});
document.getElementById('garment-file-input').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) processGarmentImage(file);
});

async function processGarmentImage(file) {
  uploadZone.style.display = 'none';
  const proc = document.getElementById('garment-processing');
  const procText = document.getElementById('garment-processing-text');
  proc.style.display = 'block';
  procText.textContent = 'Removiendo fondo...';

  try {
    const blob = await removeBackground(file);
    pendingGarmentBlob = blob;
    const url = URL.createObjectURL(blob);
    document.getElementById('garment-preview-img').src = url;
    document.getElementById('garment-preview-area').style.display = 'block';
    document.getElementById('garment-form').style.display = 'block';
  } catch (err) {
    console.warn('BG removal failed, using original:', err);
    pendingGarmentBlob = file;
    const url = URL.createObjectURL(file);
    document.getElementById('garment-preview-img').src = url;
    document.getElementById('garment-preview-area').style.display = 'block';
    document.getElementById('garment-form').style.display = 'block';
  } finally {
    proc.style.display = 'none';
  }
}

document.getElementById('btn-save-garment').addEventListener('click', async () => {
  if (!pendingGarmentBlob) { toast('Selecciona una imagen primero', 'error'); return; }
  if (!AppState.currentUser) { toast('Inicia sesión primero', 'error'); return; }

  const formData = new FormData();
  formData.append('userId', AppState.currentUser.id);
  formData.append('name', document.getElementById('g-name').value || 'Sin nombre');
  formData.append('category', document.getElementById('g-category').value);
  formData.append('color', document.getElementById('g-color').value);
  formData.append('brand', document.getElementById('g-brand').value);
  formData.append('price', document.getElementById('g-price').value || 0);
  formData.append('image', pendingGarmentBlob, 'garment.png');

  try {
    const res = await fetch(`${API}/garments`, { method: 'POST', body: formData });
    const garment = await res.json();
    AppState.garments.unshift(garment);
    renderWardrobe();
    renderOutfitBuilder();
    closeAddGarment();
    toast('Prenda agregada al armario ✨', 'success');
    // Reset form
    ['g-name','g-color','g-brand','g-price'].forEach(id => document.getElementById(id).value = '');
    document.getElementById('garment-file-input').value = '';
  } catch (err) {
    toast('Error guardando prenda', 'error');
  }
});

// ── OUTFIT BUILDER ────────────────────────────────
let outfitCatFilter = 'all';

function renderOutfitBuilder() {
  const grid = document.getElementById('outfit-garments-grid');
  const garments = outfitCatFilter === 'all'
    ? AppState.garments
    : AppState.garments.filter(g => g.category === outfitCatFilter);

  grid.innerHTML = garments.map(g => `
    <div class="garment-card ${AppState.selectedGarments.find(s => s.id === g.id) ? 'selected' : ''}"
         data-id="${g.id}" style="aspect-ratio:1;min-height:unset;padding:8px;">
      <img src="http://localhost:3000${g.image_url}" alt="${g.name}" loading="lazy" style="max-height:60%;">
      <div class="garment-card-name" style="font-size:10px;">${g.name}</div>
    </div>
  `).join('');

  grid.querySelectorAll('.garment-card').forEach(card => {
    card.addEventListener('click', () => toggleGarmentSelection(parseInt(card.dataset.id)));
  });
}

document.getElementById('outfit-filters').addEventListener('click', (e) => {
  const chip = e.target.closest('.chip');
  if (!chip) return;
  document.querySelectorAll('#outfit-filters .chip').forEach(c => c.classList.remove('active'));
  chip.classList.add('active');
  outfitCatFilter = chip.dataset.cat;
  renderOutfitBuilder();
});

function toggleGarmentSelection(id) {
  const g = AppState.garments.find(g => g.id === id);
  if (!g) return;
  const idx = AppState.selectedGarments.findIndex(s => s.id === id);
  if (idx === -1) {
    AppState.selectedGarments.push(g);
  } else {
    AppState.selectedGarments.splice(idx, 1);
  }
  renderOutfitBuilder();
  renderSelectedList();
  updateCanvasPlaceholder();
}

function renderSelectedList() {
  const list = document.getElementById('selected-list');
  list.innerHTML = AppState.selectedGarments.map(g => `
    <div class="selected-item">
      <img src="http://localhost:3000${g.image_url}" alt="${g.name}">
      <div class="selected-item-info">
        <div class="selected-item-name">${g.name}</div>
        <div class="selected-item-cat">${CATEGORY_LABELS[g.category] || g.category}</div>
      </div>
      <span class="selected-item-remove" data-id="${g.id}">×</span>
    </div>
  `).join('');

  list.querySelectorAll('.selected-item-remove').forEach(btn => {
    btn.addEventListener('click', () => toggleGarmentSelection(parseInt(btn.dataset.id)));
  });
}

function updateCanvasPlaceholder() {
  const placeholder = document.getElementById('canvas-placeholder');
  const previewImg = document.getElementById('outfit-preview-img');
  if (AppState.selectedGarments.length === 0) {
    placeholder.style.display = 'flex';
    previewImg.style.display = 'none';
    AppState.pendingOutfitDataUrl = null;
  }
}

document.getElementById('btn-generate-look').addEventListener('click', generateOutfitPreview);

async function generateOutfitPreview() {
  if (AppState.selectedGarments.length === 0) {
    toast('Selecciona al menos una prenda', 'error');
    return;
  }

  const canvas = document.createElement('canvas');
  canvas.width = 400;
  canvas.height = 600;
  const ctx = canvas.getContext('2d');

  // Fondo transparente / degradado sutil
  ctx.fillStyle = 'rgba(18,18,26,0)';
  ctx.fillRect(0, 0, 400, 600);

  // Dibujar avatar si existe
  if (AppState.currentUser?.avatar_url) {
    try {
      const avatar = await loadImage(`http://localhost:3000${AppState.currentUser.avatar_url}`);
      ctx.drawImage(avatar, 50, 20, 300, 560);
    } catch (e) { /* sin avatar */ }
  }

  // Posiciones por categoría
  const positions = {
    outerwear: { x: 60, y: 60, w: 280, h: 220 },
    dress:     { x: 80, y: 100, w: 240, h: 320 },
    top:       { x: 80, y: 80, w: 240, h: 180 },
    bottom:    { x: 80, y: 260, w: 240, h: 200 },
    shoes:     { x: 120, y: 470, w: 160, h: 100 },
    accessory: { x: 20, y: 20, w: 80, h: 80 },
  };

  for (const cat of LAYER_ORDER) {
    const g = AppState.selectedGarments.find(s => s.category === cat);
    if (!g) continue;
    try {
      const img = await loadImage(`http://localhost:3000${g.image_url}`);
      const p = positions[cat];
      ctx.drawImage(img, p.x, p.y, p.w, p.h);
    } catch (e) { console.warn('No se pudo cargar imagen:', g.name); }
  }

  const dataUrl = canvas.toDataURL('image/png');
  AppState.pendingOutfitDataUrl = dataUrl;

  // Mostrar en panel
  const previewImg = document.getElementById('outfit-preview-img');
  previewImg.src = dataUrl;
  previewImg.style.display = 'block';
  document.getElementById('canvas-placeholder').style.display = 'none';

  // Abrir modal de guardar
  document.getElementById('modal-outfit-img').src = dataUrl;
  document.getElementById('modal-outfit-name').value = document.getElementById('outfit-name').value;
  document.getElementById('modal-outfit-occasion').value = document.getElementById('outfit-occasion').value;
  document.getElementById('modal-outfit-preview').style.display = 'flex';
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

document.getElementById('close-outfit-preview').addEventListener('click', () => {
  document.getElementById('modal-outfit-preview').style.display = 'none';
});

document.getElementById('btn-confirm-save-outfit').addEventListener('click', saveOutfit);
document.getElementById('btn-save-outfit').addEventListener('click', () => {
  if (AppState.selectedGarments.length === 0) { toast('Selecciona prendas primero', 'error'); return; }
  generateOutfitPreview();
});

async function saveOutfit() {
  if (!AppState.currentUser) return;
  const name = document.getElementById('modal-outfit-name').value || 'Mi Outfit';
  const occasion = document.getElementById('modal-outfit-occasion').value;

  const formData = new FormData();
  formData.append('userId', AppState.currentUser.id);
  formData.append('name', name);
  formData.append('occasion', occasion);
  formData.append('garmentIds', JSON.stringify(AppState.selectedGarments.map(g => g.id)));

  if (AppState.pendingOutfitDataUrl) {
    const blob = await (await fetch(AppState.pendingOutfitDataUrl)).blob();
    formData.append('thumbnail', blob, 'outfit.png');
  }

  try {
    const res = await fetch(`${API}/outfits`, { method: 'POST', body: formData });
    const outfit = await res.json();
    AppState.outfits.unshift(outfit);
    document.getElementById('modal-outfit-preview').style.display = 'none';
    AppState.selectedGarments = [];
    AppState.pendingOutfitDataUrl = null;
    renderOutfitBuilder();
    renderSelectedList();
    updateCanvasPlaceholder();
    toast(`Outfit "${name}" guardado ✨`, 'success');
  } catch (err) {
    toast('Error guardando outfit', 'error');
  }
}

async function loadOutfits() {
  if (!AppState.currentUser) return;
  try {
    const res = await fetch(`${API}/outfits?userId=${AppState.currentUser.id}`);
    AppState.outfits = await res.json();
  } catch (err) { console.error('Error cargando outfits'); }
}

// ── CALENDARIO ────────────────────────────────────
const MONTHS_ES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const DAYS_ES = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];

document.getElementById('cal-prev').addEventListener('click', () => {
  AppState.calendarMonth--;
  if (AppState.calendarMonth < 0) { AppState.calendarMonth = 11; AppState.calendarYear--; }
  loadCalendar();
});
document.getElementById('cal-next').addEventListener('click', () => {
  AppState.calendarMonth++;
  if (AppState.calendarMonth > 11) { AppState.calendarMonth = 0; AppState.calendarYear++; }
  loadCalendar();
});

async function loadCalendar() {
  if (!AppState.currentUser) return;
  const monthStr = `${AppState.calendarYear}-${String(AppState.calendarMonth + 1).padStart(2, '0')}`;
  try {
    const res = await fetch(`${API}/calendar?userId=${AppState.currentUser.id}&month=${monthStr}`);
    AppState.calendarEntries = await res.json();
    renderCalendar();
  } catch (err) {
    renderCalendar();
  }
}

let selectedCalDate = null;

function openCalendarDayModal(dateStr) {
  selectedCalDate = dateStr;
  const [y, m, d] = dateStr.split('-');
  document.getElementById('modal-cal-title').textContent = `${d} de ${MONTHS_ES[parseInt(m)-1]} de ${y}`;

  const list = document.getElementById('calendar-outfit-list');
  const entry = AppState.calendarEntries.find(e => e.date?.startsWith(dateStr));

  list.innerHTML = AppState.outfits.map(o => `
    <div class="selected-item ${entry?.outfit_id === o.id ? 'active' : ''}"
         style="cursor:pointer;${entry?.outfit_id === o.id ? 'border-color:var(--accent-primary);' : ''}"
         data-outfit-id="${o.id}">
      ${o.thumbnail_url
        ? `<img src="http://localhost:3000${o.thumbnail_url}" alt="${o.name}" style="width:40px;height:40px;object-fit:contain;">`
        : `<span style="font-size:24px;">✨</span>`}
      <div class="selected-item-info">
        <div class="selected-item-name">${o.name}</div>
        <div class="selected-item-cat">${o.occasion || ''}</div>
      </div>
      ${entry?.outfit_id === o.id ? '<span style="color:var(--accent-primary);">✓</span>' : ''}
    </div>
  `).join('') || '<p style="color:var(--text-muted);text-align:center;padding:20px;">No tienes outfits guardados aún</p>';

  list.querySelectorAll('[data-outfit-id]').forEach(item => {
    item.addEventListener('click', () => assignOutfitToDay(parseInt(item.dataset.outfitId)));
  });

  document.getElementById('modal-calendar-day').style.display = 'flex';
}

document.getElementById('close-calendar-day').addEventListener('click', () => {
  document.getElementById('modal-calendar-day').style.display = 'none';
});

document.getElementById('btn-clear-cal-day').addEventListener('click', async () => {
  const entry = AppState.calendarEntries.find(e => e.date?.startsWith(selectedCalDate));
  if (!entry) { document.getElementById('modal-calendar-day').style.display = 'none'; return; }
  try {
    await fetch(`${API}/calendar/${entry.id}`, { method: 'DELETE' });
    AppState.calendarEntries = AppState.calendarEntries.filter(e => e.id !== entry.id);
    renderCalendar();
    document.getElementById('modal-calendar-day').style.display = 'none';
    toast('Outfit eliminado del día', 'success');
  } catch (err) { toast('Error', 'error'); }
});

async function assignOutfitToDay(outfitId) {
  if (!AppState.currentUser || !selectedCalDate) return;
  try {
    const res = await fetch(`${API}/calendar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: AppState.currentUser.id, outfitId, date: selectedCalDate })
    });
    const entry = await res.json();
    const outfit = AppState.outfits.find(o => o.id === outfitId);
    const fullEntry = { ...entry, thumbnail_url: outfit?.thumbnail_url, outfit_name: outfit?.name };
    const idx = AppState.calendarEntries.findIndex(e => e.date?.startsWith(selectedCalDate));
    if (idx === -1) AppState.calendarEntries.push(fullEntry);
    else AppState.calendarEntries[idx] = fullEntry;
    renderCalendar();
    document.getElementById('modal-calendar-day').style.display = 'none';
    toast('Outfit asignado al día ✨', 'success');
  } catch (err) { toast('Error asignando outfit', 'error'); }
}

function renderCalendar() {
  if (!AppState.currentUser) return;
  const label = document.getElementById('cal-month-label');
  label.textContent = `${MONTHS_ES[AppState.calendarMonth]} ${AppState.calendarYear}`;

  const grid = document.getElementById('calendar-grid');
  const today = new Date();
  const firstDay = new Date(AppState.calendarYear, AppState.calendarMonth, 1).getDay();
  const daysInMonth = new Date(AppState.calendarYear, AppState.calendarMonth + 1, 0).getDate();

  let html = DAYS_ES.map(d => `<div class="calendar-day-header">${d}</div>`).join('');
  for (let i = 0; i < firstDay; i++) html += `<div class="calendar-day empty"></div>`;

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${AppState.calendarYear}-${String(AppState.calendarMonth + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const isToday = d === today.getDate() && AppState.calendarMonth === today.getMonth() && AppState.calendarYear === today.getFullYear();
    const entry = AppState.calendarEntries.find(e => e.date && e.date.startsWith(dateStr));

    html += `
      <div class="calendar-day ${isToday ? 'today' : ''}" data-date="${dateStr}">
        <span class="day-number">${d}</span>
        <div class="day-outfit">
          ${entry?.thumbnail_url
            ? `<img src="http://localhost:3000${entry.thumbnail_url}" alt="">`
            : entry ? `<span style="font-size:18px;">✨</span>` : ''
          }
        </div>
      </div>`;
  }

  grid.innerHTML = html;
  grid.querySelectorAll('.calendar-day:not(.empty)').forEach(day => {
    day.addEventListener('click', () => openCalendarDayModal(day.dataset.date));
  });
}

// ── CHAT ──────────────────────────────────────────
document.getElementById('btn-send-chat').addEventListener('click', sendChat);
document.getElementById('chat-input').addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChat(); }
});
document.getElementById('chat-suggestions').addEventListener('click', (e) => {
  const chip = e.target.closest('.suggestion-chip');
  if (!chip) return;
  document.getElementById('chat-input').value = chip.textContent;
  sendChat();
});

async function sendChat() {
  const input = document.getElementById('chat-input');
  const msg = input.value.trim();
  if (!msg || !AppState.currentUser) return;
  input.value = '';

  appendBubble(msg, 'user');
  AppState.chatHistory.push({ role: 'user', content: msg });

  // Typing indicator
  const typingId = appendTyping();

  try {
    const res = await fetch(`${API}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: msg,
        userId: AppState.currentUser.id,
        conversationHistory: AppState.chatHistory.slice(-10)
      })
    });
    const data = await res.json();
    removeTyping(typingId);

    if (data.reply) {
      // Parsear IDs sugeridos del JSON embebido
      const jsonMatch = data.reply.match(/```json\s*([\s\S]*?)```/);
      let displayText = data.reply.replace(/```json[\s\S]*?```/g, '').trim();
      let suggestedIds = [];
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[1]);
          suggestedIds = parsed.suggested_garment_ids || [];
        } catch (e) {}
      }

      AppState.chatHistory.push({ role: 'assistant', content: data.reply });
      appendBubble(displayText, 'assistant');

      if (suggestedIds.length > 0) highlightSuggestedGarments(suggestedIds);
    }
  } catch (err) {
    removeTyping(typingId);
    appendBubble('Lo siento, no pude conectarme con el servidor. ¿Está corriendo en localhost:3000?', 'assistant');
  }
}

function appendBubble(text, role) {
  const messages = document.getElementById('chat-messages');
  const div = document.createElement('div');
  div.className = `chat-bubble ${role}`;
  const avatarContent = role === 'assistant'
    ? (AppState.currentUser?.avatar_url ? `<img src="http://localhost:3000${AppState.currentUser.avatar_url}">` : '👤')
    : '✨';
  div.innerHTML = `
    <div class="bubble-avatar">${avatarContent}</div>
    <div class="bubble-content">${text.replace(/\n/g, '<br>')}</div>
  `;
  messages.appendChild(div);
  messages.scrollTop = messages.scrollHeight;
}

function appendTyping() {
  const id = 'typing-' + Date.now();
  const messages = document.getElementById('chat-messages');
  const div = document.createElement('div');
  div.className = 'chat-bubble';
  div.id = id;
  div.innerHTML = `
    <div class="bubble-avatar">✨</div>
    <div class="bubble-content">
      <div class="typing-indicator">
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
      </div>
    </div>`;
  messages.appendChild(div);
  messages.scrollTop = messages.scrollHeight;
  return id;
}

function removeTyping(id) {
  document.getElementById(id)?.remove();
}

function highlightSuggestedGarments(ids) {
  // Resaltar prendas en el guardarropa
  document.querySelectorAll('.garment-card').forEach(card => {
    if (ids.includes(parseInt(card.dataset.id))) {
      card.style.boxShadow = '0 0 24px rgba(200,169,110,0.6), 0 0 0 2px var(--accent-primary)';
      setTimeout(() => card.style.boxShadow = '', 5000);
    }
  });
}

// ── DESCUBRIR ─────────────────────────────────────
function renderDiscover() {
  const grid = document.getElementById('styles-grid');
  const activeStyles = AppState.currentUser?.style_preferences || [];

  grid.innerHTML = STYLES.map(s => `
    <div class="style-card ${activeStyles.includes(s.key) ? 'active' : ''}" data-style="${s.key}">
      <div class="style-icon">${s.icon}</div>
      <div class="style-name">${s.name}</div>
    </div>
  `).join('');

  grid.querySelectorAll('.style-card').forEach(card => {
    card.addEventListener('click', () => {
      card.classList.toggle('active');
      AppState.activeStyles = [...document.querySelectorAll('.style-card.active')].map(c => c.dataset.style);
    });
  });

  AppState.activeStyles = activeStyles;
}

document.getElementById('btn-get-recs').addEventListener('click', async () => {
  if (!AppState.currentUser) { toast('Inicia sesión primero', 'error'); return; }
  const container = document.getElementById('recs-container');
  container.innerHTML = '<div class="processing-bar"><div class="processing-spinner"></div><span>VERA está analizando tu armario...</span></div>';

  try {
    const res = await fetch(`${API}/recommendations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: AppState.currentUser.id, styles: AppState.activeStyles })
    });
    const data = await res.json();

    if (data.recommendations?.length) {
      container.innerHTML = `
        <h3 style="font-size:13px;text-transform:uppercase;letter-spacing:1px;color:var(--text-muted);margin-bottom:16px;">
          Recomendaciones para ti
        </h3>
        <div class="recs-grid">
          ${data.recommendations.map(r => `
            <div class="rec-card">
              <div class="rec-icon">${getCategoryEmoji(r.category)}</div>
              <div class="rec-name">${r.item_name}</div>
              <div class="rec-reason">${r.reason}</div>
              <div class="rec-price">$${Number(r.estimated_price).toFixed(0)}</div>
              <div class="rec-season">🗓 ${r.best_season_to_buy}</div>
              <div class="rec-links">
                ${r.asos_link ? `<a href="${r.asos_link}" target="_blank" class="rec-link">ASOS ↗</a>` : ''}
                ${r.zara_link ? `<a href="${r.zara_link}" target="_blank" class="rec-link">Zara ↗</a>` : ''}
              </div>
            </div>
          `).join('')}
        </div>`;
    } else {
      container.innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:24px;">No se pudieron generar recomendaciones</p>';
    }
  } catch (err) {
    container.innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:24px;">Error conectando con el servidor</p>';
  }
});

function getCategoryEmoji(cat) {
  const map = { top: '👕', bottom: '👖', dress: '👗', outerwear: '🧥', shoes: '👟', accessory: '💍' };
  return map[cat] || '✨';
}

// ── ANALYTICS ─────────────────────────────────────
async function loadAnalytics() {
  if (!AppState.currentUser) return;
  try {
    const res = await fetch(`${API}/analytics?userId=${AppState.currentUser.id}`);
    const data = await res.json();
    renderAnalytics(data);
  } catch (err) {
    document.getElementById('analytics-grid').innerHTML = '<p style="color:var(--text-muted);">Error cargando análisis</p>';
  }
}

function renderAnalytics(data) {
  const grid = document.getElementById('analytics-grid');
  const maxWorn = Math.max(...(data.topWorn?.map(g => g.times_worn) || [1]), 1);

  // Donut chart por categorías
  const totalCat = data.byCategory?.reduce((s, r) => s + parseInt(r.count), 0) || 1;
  let cumulativePct = 0;
  const catColors = ['#c8a96e','#9b8bb4','#6e9bc8','#6ec8b4','#c86e9b','#c8b46e'];
  const donutGradient = data.byCategory?.map((r, i) => {
    const pct = (parseInt(r.count) / totalCat) * 100;
    const from = cumulativePct;
    cumulativePct += pct;
    return `${catColors[i % catColors.length]} ${from.toFixed(1)}% ${cumulativePct.toFixed(1)}%`;
  }).join(', ') || 'var(--glass-border) 0% 100%';

  grid.innerHTML = `
    <!-- Total -->
    <div class="analytics-card">
      <h3>Total de prendas</h3>
      <div class="stat-number">${data.total || 0}</div>
      <div class="stat-label">en tu armario</div>
      ${data.saturation?.length ? `<div style="margin-top:16px;padding:10px 14px;background:rgba(255,180,0,0.1);border:1px solid rgba(255,180,0,0.3);border-radius:10px;font-size:12px;color:#ffb400;">
        ⚠ Exceso en: ${data.saturation.map(s => s.category).join(', ')}
      </div>` : ''}
    </div>

    <!-- Por categoría (donut) -->
    <div class="analytics-card">
      <h3>Por categoría</h3>
      <div class="donut-wrapper">
        <svg viewBox="0 0 42 42" style="width:100%;height:100%;transform:rotate(-90deg)">
          <circle cx="21" cy="21" r="15.9155" fill="none" stroke="var(--glass-border)" stroke-width="3"/>
          <circle cx="21" cy="21" r="15.9155" fill="none"
            stroke="url(#donut-grad)" stroke-width="3"
            stroke-dasharray="${totalCat > 0 ? '100' : '0'} 100"
            stroke-linecap="round"/>
          <defs>
            <linearGradient id="donut-grad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stop-color="#c8a96e"/>
              <stop offset="100%" stop-color="#9b8bb4"/>
            </linearGradient>
          </defs>
        </svg>
        <div class="donut-center">
          <div class="donut-total">${data.total || 0}</div>
          <div class="donut-text">prendas</div>
        </div>
      </div>
      <div style="display:flex;flex-direction:column;gap:6px;">
        ${(data.byCategory || []).map((r, i) => `
          <div style="display:flex;justify-content:space-between;font-size:12px;">
            <span style="color:var(--text-secondary);display:flex;align-items:center;gap:6px;">
              <span style="width:10px;height:10px;border-radius:50%;background:${catColors[i % catColors.length]};display:inline-block;"></span>
              ${CATEGORY_LABELS[r.category] || r.category}
            </span>
            <span style="font-family:'JetBrains Mono',monospace;color:var(--accent-primary);">${r.count}</span>
          </div>
        `).join('')}
      </div>
    </div>

    <!-- Top prendas usadas -->
    <div class="analytics-card" style="grid-column:1/-1">
      <h3>Prendas más usadas</h3>
      ${data.topWorn?.length ? `
        <div class="bar-chart">
          ${data.topWorn.slice(0,8).map(g => `
            <div class="bar-item">
              <div class="bar-label">
                <span>${g.name}</span>
                <span style="font-family:'JetBrains Mono',monospace;color:var(--accent-primary);">${g.times_worn}×</span>
              </div>
              <div class="bar-track">
                <div class="bar-fill" style="width:${(g.times_worn / maxWorn * 100).toFixed(0)}%"></div>
              </div>
            </div>
          `).join('')}
        </div>
      ` : '<p style="color:var(--text-muted);font-size:13px;">Aún no hay datos de uso. Asigna outfits al calendario.</p>'}
    </div>

    <!-- Paleta de colores -->
    <div class="analytics-card">
      <h3>Paleta del armario</h3>
      <div class="color-swatches">
        ${(data.colors || []).map(c => `
          <div class="color-swatch">
            <div class="swatch-dot" style="background:${colorNameToHex(c.color)};"></div>
            <span>${c.color} (${c.count})</span>
          </div>
        `).join('') || '<p style="color:var(--text-muted);font-size:13px;">Agrega colores a tus prendas para ver la paleta</p>'}
      </div>
    </div>

    <!-- Prendas dormidas -->
    <div class="analytics-card">
      <h3>Prendas sin usar (60+ días)</h3>
      ${data.sleeping?.length ? `
        <div class="sleeping-grid">
          ${data.sleeping.slice(0,8).map(g => `
            <div class="sleeping-card">
              <img src="http://localhost:3000${g.image_url}" alt="${g.name}">
              <div>${g.name}</div>
            </div>
          `).join('')}
        </div>
        <p style="font-size:12px;color:var(--text-muted);margin-top:12px;">${data.sleeping.length} prenda${data.sleeping.length > 1 ? 's' : ''} olvidada${data.sleeping.length > 1 ? 's' : ''}</p>
      ` : '<p style="color:var(--text-muted);font-size:13px;">¡Perfecto! Todas tus prendas están activas 🌟</p>'}
    </div>
  `;

  // Animar barras
  requestAnimationFrame(() => {
    document.querySelectorAll('.bar-fill').forEach(bar => {
      const w = bar.style.width;
      bar.style.width = '0';
      setTimeout(() => bar.style.width = w, 50);
    });
  });
}

function colorNameToHex(name) {
  const map = {
    'negro': '#1a1a1a', 'blanco': '#f5f5f5', 'gris': '#808080', 'azul': '#4a90d9',
    'rojo': '#e74c3c', 'verde': '#27ae60', 'amarillo': '#f1c40f', 'rosa': '#ff69b4',
    'naranja': '#e67e22', 'morado': '#8e44ad', 'café': '#795548', 'beige': '#d4b896',
    'camel': '#c19a6b', 'crema': '#fffdd0', 'dorado': '#c8a96e', 'plateado': '#bdbdbd',
    'blanco crema': '#f8f3ea', 'azul marino': '#1a237e', 'verde oliva': '#808000',
  };
  return map[name?.toLowerCase()] || '#888';
}

// ── CÁPSULA ───────────────────────────────────────
function renderCapsule() {
  document.getElementById('capsule-result').innerHTML = '';
}

document.getElementById('btn-create-capsule').addEventListener('click', async () => {
  if (!AppState.currentUser) return;
  const count = document.getElementById('capsule-count').value;
  const season = document.getElementById('capsule-season').value;
  const style = document.getElementById('capsule-style').value;

  const result = document.getElementById('capsule-result');
  result.innerHTML = '<div class="processing-bar"><div class="processing-spinner"></div><span>VERA está seleccionando las prendas esenciales...</span></div>';

  try {
    const res = await fetch(`${API}/capsule`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: AppState.currentUser.id, count, season, style })
    });
    const data = await res.json();

    if (data.error) { result.innerHTML = `<p style="color:#ff6b6b;">${data.error}</p>`; return; }

    result.innerHTML = `
      <div class="capsule-summary">
        <strong>Tu cápsula de ${data.capsule?.length || 0} prendas</strong><br>
        ${data.summary || ''}<br>
        <br>
        <span style="font-family:'JetBrains Mono',monospace;color:var(--accent-primary);">
          ${data.total_outfits_possible || '?'} combinaciones posibles
        </span>
        ${data.color_palette?.length ? `<br><span style="color:var(--text-secondary);">Paleta: ${data.color_palette.join(', ')}</span>` : ''}
      </div>
      <div class="capsule-grid">
        ${(data.capsule || []).filter(c => c.garment).map(c => `
          <div class="capsule-card">
            <img src="http://localhost:3000${c.garment.image_url}" alt="${c.garment.name}">
            <div class="capsule-card-name">${c.garment.name}</div>
            <div class="capsule-card-reason">${c.reason}</div>
          </div>
        `).join('')}
      </div>
    `;
  } catch (err) {
    result.innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:24px;">Error generando la cápsula</p>';
  }
});

// ── INIT ──────────────────────────────────────────
checkUser();

// Cargar calendario cuando se muestra esa vista
document.querySelector('.nav-item[data-view="calendar"]').addEventListener('click', () => {
  loadCalendar();
});
