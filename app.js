// ════════════════════════════════════════════════
//  VESTRY — app.js
// ════════════════════════════════════════════════

if (!localStorage.getItem('vestry_user')) {
  window.location.href = '/login.html';
  throw new Error('No session');
}

const API = '/api';
const $ = (id) => document.getElementById(id);

const AppState = {
  currentUser:             null,
  currentView:             'recientes',
  selectedGarments:        [],
  chatHistory:             [],
  garments:                [],
  outfits:                 [],
  calendarEntries:         [],
  calendarYear:            new Date().getFullYear(),
  calendarMonth:           new Date().getMonth(),
  activeStyles:            [],
  pendingOutfitDataUrl:    null,
  editingGarmentId:        null,
  editingOutfitId:         null,
  currentGarmentFilter:   'all',
  outfitOccasionFilter:   'all',
  searchQuery:             '',
  outfitSearchQuery:       '',
};

const CATEGORY_LABELS = {
  top: 'Top / Camisa', bottom: 'Bottom / Pantalón', dress: 'Vestido',
  outerwear: 'Abrigo', shoes: 'Calzado', accessory: 'Accesorio',
};
const LAYER_ORDER = ['outerwear', 'dress', 'top', 'bottom', 'accessory', 'shoes'];
const MONTHS_ES   = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
                     'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const DAYS_ES     = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];

const STYLES = [
  { key:'minimal',       name:'Minimal Chic',       icon:'🤍' },
  { key:'y2k',           name:'Y2K Revival',         icon:'💿' },
  { key:'dark-academia', name:'Dark Academia',        icon:'📚' },
  { key:'coastal',       name:'Coastal Grandmother', icon:'🌊' },
  { key:'streetwear',    name:'Streetwear',           icon:'🧢' },
  { key:'office-siren',  name:'Office Siren',         icon:'💼' },
  { key:'cottagecore',   name:'Cottagecore',          icon:'🌸' },
  { key:'old-money',     name:'Old Money',            icon:'🏛️' },
  { key:'grunge',        name:'90s Grunge',           icon:'🎸' },
  { key:'barbiecore',    name:'Barbiecore',           icon:'🩷' },
];

// ── TOAST ─────────────────────────────────────────
function toast(msg, type = 'info') {
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `<span>${type === 'error' ? '✗' : '✓'}</span> ${msg}`;
  $('toast-container').appendChild(el);
  setTimeout(() => el.remove(), 3500);
}

// ════════════════════════════════════════════════
//  SIDEBAR
// ════════════════════════════════════════════════
const sidebar = $('sidebar');

$('btn-sidebar-collapse').addEventListener('click', () => {
  sidebar.classList.toggle('collapsed');
  localStorage.setItem('vestry_sidebar_collapsed', sidebar.classList.contains('collapsed'));
});
if (localStorage.getItem('vestry_sidebar_collapsed') === 'true') {
  sidebar.classList.add('collapsed');
}
document.querySelectorAll('.nav-item[data-view]').forEach(item => {
  const label = item.querySelector('.nav-label');
  if (label) item.setAttribute('data-tooltip', label.textContent.trim());
});

// ════════════════════════════════════════════════
//  NAVEGACIÓN
// ════════════════════════════════════════════════
document.querySelectorAll('.nav-item[data-view]').forEach(item => {
  item.addEventListener('click', () => switchView(item.dataset.view));
});

function switchView(view) {
  AppState.currentView = view;
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  $(`view-${view}`)?.classList.add('active');
  document.querySelector(`.nav-item[data-view="${view}"]`)?.classList.add('active');

  // FABs: mostrar solo en su vista
  $('btn-add-garment').style.display  = view === 'prendas'  ? 'flex' : 'none';
  $('btn-create-outfit').style.display = view === 'outfits' ? 'flex' : 'none';

  if (view === 'recientes')    renderRecientes();
  if (view === 'novedades')    renderNovedades();
  if (view === 'planificador') loadCalendar();
  if (view === 'prendas')      renderPrendas();
  if (view === 'outfits')      renderOutfitsGrid();
  if (view === 'estadisticas') loadAnalytics();
}

// ════════════════════════════════════════════════
//  USUARIO
// ════════════════════════════════════════════════
function initUser() {
  AppState.currentUser = JSON.parse(localStorage.getItem('vestry_user'));
  updateAccountSection();
  loadGarments();
  loadOutfits();
}

function updateAccountSection() {
  const u = AppState.currentUser;
  if (!u) return;
  $('account-name').textContent = u.name || 'Mi cuenta';
  const img = $('account-avatar-img');
  if (u.avatar_url) {
    img.src = u.avatar_url;
    img.onload = () => img.classList.add('loaded');
    $('account-avatar-initials').style.display = 'none';
  } else {
    $('account-avatar-initials').textContent = u.name?.[0]?.toUpperCase() || '?';
  }
}

// ════════════════════════════════════════════════
//  CONTADORES
// ════════════════════════════════════════════════
function updateCounters() {
  $('count-prendas').textContent    = AppState.garments.length;
  $('count-outfits').textContent    = AppState.outfits.length;
  $('prendas-subtitle').textContent = `${AppState.garments.length} prendas guardadas`;
  $('outfits-subtitle').textContent = `${AppState.outfits.length} outfits creados`;
}

// ════════════════════════════════════════════════
//  BACKGROUND REMOVAL
// ════════════════════════════════════════════════
async function removeBackground(file) {
  const { removeBackground: removeBg } = await import(
    'https://cdn.jsdelivr.net/npm/@imgly/background-removal@1.4.5/dist/background-removal.js'
  );
  return removeBg(file, {
    publicPath: 'https://cdn.jsdelivr.net/npm/@imgly/background-removal@1.4.5/dist/'
  });
}

// ════════════════════════════════════════════════
//  PRENDAS — filtros, búsqueda expandible
// ════════════════════════════════════════════════

// Filter popover
$('btn-prendas-filter').addEventListener('click', (e) => {
  e.stopPropagation();
  const pop = $('prendas-filter-popover');
  pop.style.display = pop.style.display === 'none' ? 'flex' : 'none';
});
$('prendas-filter-popover').addEventListener('click', (e) => {
  const btn = e.target.closest('.filter-pop-opt');
  if (!btn) return;
  $('prendas-filter-popover').querySelectorAll('.filter-pop-opt').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  AppState.currentGarmentFilter = btn.dataset.cat;
  $('btn-prendas-filter').classList.toggle('has-filter', btn.dataset.cat !== 'all');
  $('prendas-filter-popover').style.display = 'none';
  renderPrendas();
});

// Search expand — prendas
$('prendas-search-wrap').addEventListener('click', (e) => {
  if (e.target.closest('#btn-close-prendas-search')) return;
  const wrap = $('prendas-search-wrap');
  if (!wrap.classList.contains('expanded')) {
    wrap.classList.add('expanded');
    setTimeout(() => $('prendas-search-input').focus(), 220);
  }
});
$('btn-close-prendas-search').addEventListener('click', (e) => {
  e.stopPropagation();
  $('prendas-search-wrap').classList.remove('expanded');
  $('prendas-search-input').value = '';
  AppState.searchQuery = '';
  renderPrendas();
});
$('prendas-search-input').addEventListener('click', e => e.stopPropagation());
$('prendas-search-input').addEventListener('input', e => {
  AppState.searchQuery = e.target.value.toLowerCase();
  renderPrendas();
});

// View toggle genérico (prendas + outfits)
document.querySelectorAll('.view-toggle').forEach(btn => {
  btn.addEventListener('click', () => {
    const group = btn.closest('.toolbar-btn-group');
    group.querySelectorAll('.view-toggle').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const grid = $(btn.dataset.target);
    if (grid) {
      grid.classList.remove('grid-medium', 'grid-small');
      grid.classList.add(`grid-${btn.dataset.grid}`);
    }
  });
});

// ════════════════════════════════════════════════
//  PRENDAS — carga y render
// ════════════════════════════════════════════════
async function loadGarments() {
  try {
    const res = await fetch(`${API}/garments?userId=${AppState.currentUser.id}`);
    AppState.garments = await res.json();
    updateCounters();
    if (AppState.currentView === 'prendas')   renderPrendas();
    if (AppState.currentView === 'recientes') renderRecientes();
  } catch (err) { console.error('Error cargando prendas:', err); }
}

function getFilteredGarments() {
  let list = [...AppState.garments];
  if (AppState.currentGarmentFilter !== 'all')
    list = list.filter(g => g.category === AppState.currentGarmentFilter);
  if (AppState.searchQuery)
    list = list.filter(g =>
      g.name?.toLowerCase().includes(AppState.searchQuery) ||
      g.color?.toLowerCase().includes(AppState.searchQuery) ||
      g.brand?.toLowerCase().includes(AppState.searchQuery)
    );
  return list;
}

function renderPrendas() {
  const grid  = $('garments-grid');
  const empty = $('wardrobe-empty');
  const garments = getFilteredGarments();
  if (!garments.length) {
    grid.innerHTML = '';
    empty.classList.add('full-width');
    grid.appendChild(empty);
    return;
  }
  grid.innerHTML = garments.map(garmentCardHTML).join('');
  bindGarmentCards(grid);
}

function renderRecientes() {
  const grid  = $('recientes-grid');
  const empty = $('recientes-empty');
  const recent = [...AppState.garments]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 24);
  if (!recent.length) { grid.innerHTML = ''; grid.appendChild(empty); return; }
  grid.innerHTML = recent.map(garmentCardHTML).join('');
  bindGarmentCards(grid);
}

function garmentCardHTML(g) {
  return `
    <div class="garment-card" data-id="${g.id}">
      <img src="${g.image_url}" alt="${g.name}" loading="lazy">
      <div class="garment-card-name">${g.name}</div>
      <div class="garment-card-cat">${CATEGORY_LABELS[g.category] || g.category}</div>
      <button class="garment-card-edit" data-edit="${g.id}" title="Editar">✏️</button>
      <button class="garment-card-delete" data-delete="${g.id}" title="Eliminar">🗑</button>
    </div>`;
}

function bindGarmentCards(container) {
  container.querySelectorAll('.garment-card-delete').forEach(btn => {
    btn.addEventListener('click', e => { e.stopPropagation(); deleteGarment(btn.dataset.delete); });
  });
  container.querySelectorAll('.garment-card-edit').forEach(btn => {
    btn.addEventListener('click', e => { e.stopPropagation(); openEditGarment(btn.dataset.edit); });
  });
}

async function deleteGarment(id) {
  if (!confirm('¿Eliminar esta prenda?')) return;
  try {
    await fetch(`${API}/garments/${id}`, { method: 'DELETE' });
    AppState.garments = AppState.garments.filter(g => g.id != id);
    AppState.selectedGarments = AppState.selectedGarments.filter(g => g.id != id);
    updateCounters();
    renderPrendas();
    renderRecientes();
    renderOutfitBuilder();
    renderSelectedList();
    toast('Prenda eliminada', 'success');
  } catch { toast('Error eliminando prenda', 'error'); }
}

// ── Agregar / Editar prenda ────────────────────────────────
let pendingGarmentBlob = null;
$('btn-add-garment').addEventListener('click', openAddGarment);
$('close-add-garment').addEventListener('click', closeAddGarment);

function openAddGarment() {
  AppState.editingGarmentId = null;
  pendingGarmentBlob = null;
  $('garment-processing').style.display   = 'none';
  $('vera-analyzing').style.display       = 'none';
  $('garment-preview-area').style.display = 'none';
  $('garment-form').style.display         = 'none';
  $('garment-upload-zone').style.display  = 'flex';
  $('garment-preview-wrap').classList.remove('editable');
  $('add-garment-title').textContent    = 'Agregar Prenda';
  $('add-garment-subtitle').textContent = 'Sube una foto — removemos el fondo y VERA identifica la prenda';
  $('btn-save-garment').textContent     = '✔ Guardar prenda';
  $('modal-add-garment').style.display  = 'flex';
}

function openEditGarment(id) {
  const g = AppState.garments.find(g => String(g.id) === String(id));
  if (!g) return;
  AppState.editingGarmentId = id;
  pendingGarmentBlob = null;

  $('garment-processing').style.display   = 'none';
  $('vera-analyzing').style.display       = 'none';
  $('garment-upload-zone').style.display  = 'none';
  $('garment-form').style.display         = 'block';

  $('g-name').value     = g.name || '';
  $('g-category').value = g.category || 'top';
  $('g-color').value    = g.color || '';
  $('g-brand').value    = g.brand || '';
  $('g-price').value    = g.price || '';

  $('garment-preview-wrap').classList.add('editable');
  showGarmentPreview(g.image_url);

  $('add-garment-title').textContent    = 'Editar Prenda';
  $('add-garment-subtitle').textContent = 'Toca la imagen para cambiarla';
  $('btn-save-garment').textContent     = '✔ Actualizar prenda';
  $('modal-add-garment').style.display  = 'flex';
}

function closeAddGarment() {
  $('modal-add-garment').style.display = 'none';
  AppState.editingGarmentId = null;
  pendingGarmentBlob = null;
  $('garment-preview-wrap').classList.remove('editable');
  $('garment-file-input').value = '';
}

const uploadZone = $('garment-upload-zone');
uploadZone.addEventListener('click', () => $('garment-file-input').click());

// En modo edición, tocar la imagen del preview abre el file picker
$('garment-preview-wrap').addEventListener('click', () => {
  if (AppState.editingGarmentId) $('garment-file-input').click();
});
uploadZone.addEventListener('dragover',  e => { e.preventDefault(); uploadZone.classList.add('drag-over'); });
uploadZone.addEventListener('dragleave', () => uploadZone.classList.remove('drag-over'));
uploadZone.addEventListener('drop', e => {
  e.preventDefault(); uploadZone.classList.remove('drag-over');
  const file = e.dataTransfer.files[0];
  if (file) processGarmentImage(file);
});
$('garment-file-input').addEventListener('change', e => {
  if (e.target.files[0]) processGarmentImage(e.target.files[0]);
});

async function processGarmentImage(file) {
  uploadZone.style.display = 'none';
  $('garment-processing').style.display = 'block';

  // 1. Remover fondo
  let blob = file;
  $('garment-processing-text').textContent = 'Removiendo fondo...';
  try { blob = await removeBackground(file); } catch { /* keep original */ }
  pendingGarmentBlob = blob;
  showGarmentPreview(URL.createObjectURL(blob));
  $('garment-processing').style.display = 'none';

  // 2. VERA analiza (si está disponible)
  $('vera-analyzing').style.display = 'block';
  try {
    const b64   = await blobToBase64(blob);
    const res   = await fetch(`${API}/garments/analyze`, {
      method: 'POST', headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ image: b64, mimeType: blob.type || 'image/png' })
    });
    if (res.ok) {
      const data = await res.json();
      if (data.name)     $('g-name').value     = data.name;
      if (data.category) $('g-category').value = data.category;
      if (data.color)    $('g-color').value    = data.color;
      toast('VERA identificó la prenda ✨', 'success');
    }
  } catch { /* el usuario llena manualmente */ }
  finally { $('vera-analyzing').style.display = 'none'; }
}

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result.split(',')[1]);
    reader.onerror  = reject;
    reader.readAsDataURL(blob);
  });
}

function showGarmentPreview(url) {
  $('garment-preview-img').src = url;
  $('garment-preview-area').style.display = 'block';
  $('garment-form').style.display         = 'block';
}

$('btn-save-garment').addEventListener('click', async () => {
  if (AppState.editingGarmentId) {
    await updateGarment(AppState.editingGarmentId);
  } else {
    await createGarment();
  }
});

async function createGarment() {
  if (!pendingGarmentBlob) { toast('Selecciona una imagen', 'error'); return; }
  const fd = new FormData();
  fd.append('userId',   AppState.currentUser.id);
  fd.append('name',     $('g-name').value || 'Sin nombre');
  fd.append('category', $('g-category').value);
  fd.append('color',    $('g-color').value);
  fd.append('brand',    $('g-brand').value);
  fd.append('price',    $('g-price').value || 0);
  fd.append('image',    pendingGarmentBlob, 'garment.png');
  try {
    const res     = await fetch(`${API}/garments`, { method: 'POST', body: fd });
    const garment = await res.json();
    AppState.garments.unshift(garment);
    updateCounters(); renderPrendas(); renderRecientes(); renderOutfitBuilder();
    closeAddGarment();
    toast('Prenda agregada ✨', 'success');
    ['g-name','g-color','g-brand','g-price'].forEach(id => $(id).value = '');
  } catch { toast('Error guardando prenda', 'error'); }
}

async function updateGarment(id) {
  const fd = new FormData();
  fd.append('name',     $('g-name').value || 'Sin nombre');
  fd.append('category', $('g-category').value);
  fd.append('color',    $('g-color').value);
  fd.append('brand',    $('g-brand').value);
  fd.append('price',    $('g-price').value || 0);
  if (pendingGarmentBlob) fd.append('image', pendingGarmentBlob, 'garment.png');
  try {
    const res     = await fetch(`${API}/garments/${id}`, { method: 'PATCH', body: fd });
    const garment = await res.json();
    const idx = AppState.garments.findIndex(g => String(g.id) === String(id));
    if (idx !== -1) AppState.garments[idx] = garment;
    updateCounters(); renderPrendas(); renderRecientes(); renderOutfitBuilder();
    closeAddGarment();
    toast('Prenda actualizada ✨', 'success');
  } catch { toast('Error actualizando prenda', 'error'); }
}

// ════════════════════════════════════════════════
//  OUTFITS — grid de outfits guardados
// ════════════════════════════════════════════════
async function loadOutfits() {
  try {
    const res = await fetch(`${API}/outfits?userId=${AppState.currentUser.id}`);
    AppState.outfits = await res.json();
    updateCounters();
    if (AppState.currentView === 'outfits') renderOutfitsGrid();
  } catch { console.error('Error cargando outfits'); }
}

function getFilteredOutfits() {
  let list = [...AppState.outfits];
  if (AppState.outfitOccasionFilter !== 'all')
    list = list.filter(o => o.occasion === AppState.outfitOccasionFilter);
  if (AppState.outfitSearchQuery)
    list = list.filter(o =>
      o.name?.toLowerCase().includes(AppState.outfitSearchQuery) ||
      o.occasion?.toLowerCase().includes(AppState.outfitSearchQuery)
    );
  return list;
}

function renderOutfitsGrid() {
  const grid  = $('outfits-grid');
  const empty = $('outfits-empty');
  const outfits = getFilteredOutfits();
  if (!outfits.length) {
    grid.innerHTML = '';
    empty.classList.add('full-width');
    grid.appendChild(empty);
    return;
  }
  grid.innerHTML = outfits.map(outfitCardHTML).join('');
  grid.querySelectorAll('.outfit-card-delete').forEach(btn => {
    btn.addEventListener('click', e => { e.stopPropagation(); deleteOutfit(btn.dataset.delete); });
  });
  grid.querySelectorAll('.outfit-card-edit').forEach(btn => {
    btn.addEventListener('click', e => { e.stopPropagation(); openOutfitDetail(btn.dataset.edit); });
  });
}

function outfitCardHTML(o) {
  return `
    <div class="outfit-card" data-id="${o.id}">
      ${o.thumbnail_url
        ? `<img src="${o.thumbnail_url}" alt="${o.name}">`
        : `<div class="outfit-card-placeholder">✨</div>`}
      <div class="outfit-card-name">${o.name}</div>
      <div class="outfit-card-occasion">${o.occasion || ''}</div>
      <button class="outfit-card-edit"   data-edit="${o.id}"   title="Editar">✏️</button>
      <button class="outfit-card-delete" data-delete="${o.id}" title="Eliminar">🗑</button>
    </div>`;
}

// ── Detalle / edición de outfit ─────────────────────
$('close-outfit-detail').addEventListener('click', () => { $('modal-outfit-detail').style.display = 'none'; });

function openOutfitDetail(id) {
  const o = AppState.outfits.find(o => String(o.id) === String(id));
  if (!o) return;
  AppState.editingOutfitId = id;

  $('outfit-detail-thumb').innerHTML = o.thumbnail_url
    ? `<img src="${o.thumbnail_url}" style="max-height:220px;object-fit:contain;border-radius:14px;">`
    : `<div style="font-size:52px;padding:16px;text-align:center;">✨</div>`;

  $('outfit-detail-name').value     = o.name || '';
  $('outfit-detail-occasion').value = o.occasion || '';

  const garmentIds = Array.isArray(o.garment_ids) ? o.garment_ids : [];
  const detailGarments = garmentIds.map(gid => AppState.garments.find(g => g.id == gid)).filter(Boolean);
  $('outfit-detail-garments').innerHTML = detailGarments.length
    ? detailGarments.map(g => `
        <div title="${g.name}">
          <img class="outfit-detail-garment-thumb" src="${g.image_url}" alt="${g.name}">
        </div>`).join('')
    : '<span style="color:var(--text-muted);font-size:13px;">Sin prendas registradas</span>';

  const days = AppState.calendarEntries.filter(e => String(e.outfit_id) === String(id));
  const daysWrap = $('outfit-detail-days-wrap');
  if (days.length) {
    daysWrap.style.display = 'block';
    $('outfit-detail-days').innerHTML = days.map(e => {
      const ds = (e.date || '').split('T')[0];
      const [y, m, d] = ds.split('-');
      return `<span style="padding:4px 10px;border-radius:20px;background:var(--glass-bg);border:1px solid var(--glass-border);font-size:12px;">${d}/${m}/${y}</span>`;
    }).join('');
  } else {
    daysWrap.style.display = 'none';
  }

  $('modal-outfit-detail').style.display = 'flex';
}

$('btn-save-outfit-detail').addEventListener('click', async () => {
  const id      = AppState.editingOutfitId;
  const name    = $('outfit-detail-name').value.trim() || 'Mi Outfit';
  const occasion = $('outfit-detail-occasion').value;
  try {
    const res     = await fetch(`${API}/outfits/${id}`, {
      method: 'PATCH', headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ name, occasion })
    });
    const updated = await res.json();
    const idx = AppState.outfits.findIndex(o => String(o.id) === String(id));
    if (idx !== -1) AppState.outfits[idx] = { ...AppState.outfits[idx], ...updated };
    renderOutfitsGrid();
    $('modal-outfit-detail').style.display = 'none';
    toast('Outfit actualizado ✨', 'success');
  } catch { toast('Error actualizando outfit', 'error'); }
});

async function deleteOutfit(id) {
  if (!confirm('¿Eliminar este outfit?')) return;
  try {
    await fetch(`${API}/outfits/${id}`, { method: 'DELETE' });
    AppState.outfits = AppState.outfits.filter(o => o.id != id);
    updateCounters();
    renderOutfitsGrid();
    toast('Outfit eliminado', 'success');
  } catch { toast('Error eliminando outfit', 'error'); }
}

// ── Filter popover outfits ─────────────────────
$('btn-outfits-filter').addEventListener('click', (e) => {
  e.stopPropagation();
  const pop = $('outfits-filter-popover');
  pop.style.display = pop.style.display === 'none' ? 'flex' : 'none';
});
$('outfits-filter-popover').addEventListener('click', (e) => {
  const btn = e.target.closest('.filter-pop-opt');
  if (!btn) return;
  $('outfits-filter-popover').querySelectorAll('.filter-pop-opt').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  AppState.outfitOccasionFilter = btn.dataset.occasion;
  $('btn-outfits-filter').classList.toggle('has-filter', btn.dataset.occasion !== 'all');
  $('outfits-filter-popover').style.display = 'none';
  renderOutfitsGrid();
});

// ── Búsqueda outfits ───────────────────────────
$('outfits-search-wrap').addEventListener('click', (e) => {
  if (e.target.closest('#btn-close-outfits-search')) return;
  const wrap = $('outfits-search-wrap');
  if (!wrap.classList.contains('expanded')) {
    wrap.classList.add('expanded');
    setTimeout(() => $('outfits-search-input').focus(), 220);
  }
});
$('btn-close-outfits-search').addEventListener('click', (e) => {
  e.stopPropagation();
  $('outfits-search-wrap').classList.remove('expanded');
  $('outfits-search-input').value = '';
  AppState.outfitSearchQuery = '';
  renderOutfitsGrid();
});
$('outfits-search-input').addEventListener('click', e => e.stopPropagation());
$('outfits-search-input').addEventListener('input', e => {
  AppState.outfitSearchQuery = e.target.value.toLowerCase();
  renderOutfitsGrid();
});

// Cerrar popovers al hacer clic fuera
document.addEventListener('click', () => {
  $('prendas-filter-popover').style.display = 'none';
  $('outfits-filter-popover').style.display = 'none';
});

// ════════════════════════════════════════════════
//  OUTFIT BUILDER — modal
// ════════════════════════════════════════════════
let outfitCatFilter = 'all';

$('btn-create-outfit').addEventListener('click', openOutfitBuilder);
$('close-outfit-builder').addEventListener('click', closeOutfitBuilder);

function openOutfitBuilder() {
  AppState.selectedGarments    = [];
  AppState.pendingOutfitDataUrl = null;
  $('outfit-name').value       = '';
  $('selected-list').innerHTML = '';
  $('outfit-preview-img').style.display   = 'none';
  $('canvas-placeholder').style.display   = 'flex';
  outfitCatFilter = 'all';
  document.querySelectorAll('.builder-filter-btn').forEach(b => b.classList.remove('active'));
  document.querySelector('.builder-filter-btn[data-cat="all"]')?.classList.add('active');
  renderOutfitBuilder();
  $('modal-outfit-builder').style.display = 'flex';
}

function closeOutfitBuilder() {
  $('modal-outfit-builder').style.display = 'none';
}

// Filtros del picker en el builder
$('builder-picker-filter').addEventListener('click', e => {
  const btn = e.target.closest('.builder-filter-btn');
  if (!btn) return;
  document.querySelectorAll('.builder-filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  outfitCatFilter = btn.dataset.cat;
  renderOutfitBuilder();
});

function renderOutfitBuilder() {
  const grid = $('outfit-garments-grid');
  const garments = outfitCatFilter === 'all'
    ? AppState.garments
    : AppState.garments.filter(g => g.category === outfitCatFilter);

  grid.innerHTML = garments.map(g => `
    <div class="garment-card ${AppState.selectedGarments.find(s => s.id === g.id) ? 'selected' : ''}"
         data-id="${g.id}" style="min-height:unset;padding:8px;border-radius:12px;">
      <img src="${g.image_url}" alt="${g.name}" loading="lazy" style="max-height:60%;">
      <div class="garment-card-name" style="font-size:10px;">${g.name}</div>
    </div>`).join('');

  grid.querySelectorAll('.garment-card').forEach(card => {
    card.addEventListener('click', () => toggleGarmentSelection(parseInt(card.dataset.id)));
  });
}

function toggleGarmentSelection(id) {
  const g   = AppState.garments.find(g => g.id === id);
  if (!g) return;
  const idx = AppState.selectedGarments.findIndex(s => s.id === id);
  if (idx === -1) AppState.selectedGarments.push(g);
  else AppState.selectedGarments.splice(idx, 1);
  renderOutfitBuilder();
  renderSelectedList();
  if (!AppState.selectedGarments.length) {
    $('outfit-preview-img').style.display = 'none';
    $('canvas-placeholder').style.display = 'flex';
  }
}

function renderSelectedList() {
  const list = $('selected-list');
  list.innerHTML = AppState.selectedGarments.map(g => `
    <div class="selected-item">
      <img src="${g.image_url}" alt="${g.name}">
      <div class="selected-item-info">
        <div class="selected-item-name">${g.name}</div>
        <div class="selected-item-cat">${CATEGORY_LABELS[g.category] || g.category}</div>
      </div>
      <span class="selected-item-remove" data-id="${g.id}">×</span>
    </div>`).join('');
  list.querySelectorAll('.selected-item-remove').forEach(btn => {
    btn.addEventListener('click', () => toggleGarmentSelection(parseInt(btn.dataset.id)));
  });
}

$('btn-generate-look').addEventListener('click', generateOutfitPreview);

// Layout de collage: posiciones deterministas según cantidad de prendas
function getCollageLayout(n, W, H) {
  const s = Math.min(W, H);
  const presets = {
    1: [{ cx:W/2,    cy:H/2,    sz:s*0.74, a:0   }],
    2: [{ cx:W*0.36, cy:H*0.5,  sz:s*0.62, a:-7  },
        { cx:W*0.64, cy:H*0.5,  sz:s*0.62, a: 6  }],
    3: [{ cx:W*0.30, cy:H*0.36, sz:s*0.53, a:-8  },
        { cx:W*0.70, cy:H*0.34, sz:s*0.53, a: 7  },
        { cx:W*0.50, cy:H*0.72, sz:s*0.53, a:-2  }],
    4: [{ cx:W*0.28, cy:H*0.30, sz:s*0.47, a:-6  },
        { cx:W*0.72, cy:H*0.28, sz:s*0.47, a: 5  },
        { cx:W*0.26, cy:H*0.70, sz:s*0.47, a: 4  },
        { cx:W*0.74, cy:H*0.72, sz:s*0.47, a:-4  }],
  };
  if (presets[n]) return presets[n];
  // 5+ items: usar layout de 4 + elementos pequeños centrados
  const base   = presets[4];
  const angles = [-10, 0, 10];
  for (let i = 4; i < Math.min(n, 7); i++) {
    base.push({ cx:W*0.5 + (i-5)*55, cy:H*0.5, sz:s*0.30, a:angles[(i-4)%3] });
  }
  return base;
}

async function generateOutfitPreview() {
  if (!AppState.selectedGarments.length) { toast('Selecciona al menos una prenda', 'error'); return; }

  const W = 480, H = 480;
  const canvas = document.createElement('canvas');
  canvas.width  = W; canvas.height = H;
  const ctx     = canvas.getContext('2d');

  // Cargar todas las imágenes
  const garments = [...AppState.selectedGarments];
  const images   = await Promise.all(
    garments.map(g => loadImage(g.image_url).catch(() => null))
  );

  const layout = getCollageLayout(garments.length, W, H);

  for (let i = 0; i < garments.length; i++) {
    const img = images[i];
    if (!img) continue;
    const { cx, cy, sz, a } = layout[i] || layout[layout.length - 1];

    const scale = Math.min(sz / img.width, sz / img.height);
    const dw    = img.width  * scale;
    const dh    = img.height * scale;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(a * Math.PI / 180);
    ctx.shadowColor    = 'rgba(0,0,0,0.40)';
    ctx.shadowBlur     = 18;
    ctx.shadowOffsetX  = 4;
    ctx.shadowOffsetY  = 6;
    ctx.drawImage(img, -dw / 2, -dh / 2, dw, dh);
    ctx.restore();
  }

  const dataUrl             = canvas.toDataURL('image/png');
  AppState.pendingOutfitDataUrl = dataUrl;
  const prevImg             = $('outfit-preview-img');
  prevImg.src               = dataUrl;
  prevImg.style.display     = 'block';
  $('canvas-placeholder').style.display = 'none';
}

function loadImage(src) {
  return new Promise((res, rej) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload  = () => res(img);
    img.onerror = rej;
    img.src = src;
  });
}

$('btn-save-outfit').addEventListener('click', saveOutfit);

async function saveOutfit() {
  if (!AppState.selectedGarments.length) { toast('Selecciona prendas primero', 'error'); return; }
  if (!AppState.pendingOutfitDataUrl) await generateOutfitPreview();

  const name     = $('outfit-name').value || 'Mi Outfit';
  const occasion = $('outfit-occasion').value;
  const fd       = new FormData();
  fd.append('userId',     AppState.currentUser.id);
  fd.append('name',       name);
  fd.append('occasion',   occasion);
  fd.append('garmentIds', JSON.stringify(AppState.selectedGarments.map(g => g.id)));
  if (AppState.pendingOutfitDataUrl) {
    const blob = await (await fetch(AppState.pendingOutfitDataUrl)).blob();
    fd.append('thumbnail', blob, 'outfit.png');
  }
  try {
    const res    = await fetch(`${API}/outfits`, { method: 'POST', body: fd });
    const outfit = await res.json();
    AppState.outfits.unshift(outfit);
    updateCounters();
    renderOutfitsGrid();
    closeOutfitBuilder();
    AppState.selectedGarments    = [];
    AppState.pendingOutfitDataUrl = null;
    toast(`Outfit "${name}" guardado ✨`, 'success');
  } catch { toast('Error guardando outfit', 'error'); }
}

// ── VERA: crear outfit automáticamente ──────────
$('btn-vera-outfit').addEventListener('click', veraAutoOutfit);

async function veraAutoOutfit() {
  const btn      = $('btn-vera-outfit');
  const origHTML = btn.innerHTML;
  btn.innerHTML  = '<div class="processing-spinner" style="width:15px;height:15px;border-width:2px;"></div> Creando...';
  btn.disabled   = true;
  try {
    const res  = await fetch(`${API}/chat`, {
      method: 'POST', headers: {'Content-Type':'application/json'},
      body: JSON.stringify({
        message: 'Crea el mejor outfit posible para una ocasión casual combinando mis prendas. Elige entre 3 y 5 prendas que armonicen bien.',
        userId: AppState.currentUser.id,
        conversationHistory: [],
      })
    });
    const data = await res.json();
    const jsonMatch = data.reply?.match(/```json\s*([\s\S]*?)```/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[1]);
        const ids    = parsed.suggested_garment_ids || [];
        if (ids.length) {
          AppState.selectedGarments = AppState.garments.filter(g => ids.includes(g.id));
          renderOutfitBuilder();
          renderSelectedList();
          await generateOutfitPreview();
          toast('¡VERA creó tu outfit! ✨', 'success');
        } else {
          toast('VERA no encontró combinaciones', 'error');
        }
      } catch { toast('No se pudo parsear la sugerencia de VERA', 'error'); }
    } else {
      toast('VERA respondió sin selección de prendas', 'error');
    }
  } catch { toast('Error conectando con VERA', 'error'); }
  finally {
    btn.innerHTML = origHTML;
    btn.disabled  = false;
  }
}

// ════════════════════════════════════════════════
//  PLANIFICADOR
// ════════════════════════════════════════════════
$('cal-prev').addEventListener('click', () => {
  AppState.calendarMonth--;
  if (AppState.calendarMonth < 0) { AppState.calendarMonth = 11; AppState.calendarYear--; }
  loadCalendar();
});
$('cal-next').addEventListener('click', () => {
  AppState.calendarMonth++;
  if (AppState.calendarMonth > 11) { AppState.calendarMonth = 0; AppState.calendarYear++; }
  loadCalendar();
});

async function loadCalendar() {
  const m = `${AppState.calendarYear}-${String(AppState.calendarMonth + 1).padStart(2, '0')}`;
  try {
    const res = await fetch(`${API}/calendar?userId=${AppState.currentUser.id}&month=${m}`);
    AppState.calendarEntries = await res.json();
  } catch { AppState.calendarEntries = []; }
  renderCalendar();
}

function renderCalendar() {
  $('cal-month-label').textContent = `${MONTHS_ES[AppState.calendarMonth]} ${AppState.calendarYear}`;
  const grid       = $('calendar-grid');
  const today      = new Date();
  const firstDay   = new Date(AppState.calendarYear, AppState.calendarMonth, 1).getDay();
  const daysInMonth= new Date(AppState.calendarYear, AppState.calendarMonth + 1, 0).getDate();

  let html = DAYS_ES.map(d => `<div class="calendar-day-header">${d}</div>`).join('');
  for (let i = 0; i < firstDay; i++) html += `<div class="calendar-day empty"></div>`;
  for (let d = 1; d <= daysInMonth; d++) {
    const ds     = `${AppState.calendarYear}-${String(AppState.calendarMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const isToday= d === today.getDate() && AppState.calendarMonth === today.getMonth() && AppState.calendarYear === today.getFullYear();
    const entry  = AppState.calendarEntries.find(e => e.date?.startsWith(ds));
    html += `
      <div class="calendar-day ${isToday ? 'today' : ''}" data-date="${ds}">
        <span class="day-number">${d}</span>
        <div class="day-outfit">
          ${entry?.thumbnail_url ? `<img src="${entry.thumbnail_url}" alt="">` : entry ? `<span style="font-size:16px">✨</span>` : ''}
        </div>
      </div>`;
  }
  grid.innerHTML = html;
  grid.querySelectorAll('.calendar-day:not(.empty)').forEach(day => {
    day.addEventListener('click', () => openCalendarModal(day.dataset.date));
  });
}

let selectedCalDate = null;

function openCalendarModal(dateStr) {
  selectedCalDate = dateStr;
  const [y, m, d] = dateStr.split('-');
  $('modal-cal-title').textContent = `${d} de ${MONTHS_ES[parseInt(m) - 1]} de ${y}`;

  const entry  = AppState.calendarEntries.find(e => e.date?.startsWith(dateStr));
  const assignedSection = $('cal-assigned-outfit');
  const pickerLabel     = $('cal-picker-label');
  const list            = $('calendar-outfit-list');

  if (entry?.outfit_id) {
    const o = AppState.outfits.find(o => o.id === entry.outfit_id);
    assignedSection.style.display = 'block';
    assignedSection.innerHTML = `
      <div class="cal-outfit-preview">
        ${o?.thumbnail_url
          ? `<img src="${o.thumbnail_url}" alt="${o?.name || ''}">`
          : `<div style="width:90px;height:90px;display:flex;align-items:center;justify-content:center;font-size:36px;flex-shrink:0;">✨</div>`}
        <div class="cal-outfit-preview-info">
          <div class="cal-outfit-preview-name">${o?.name || 'Outfit'}</div>
          <div class="cal-outfit-preview-occ">${o?.occasion || ''}</div>
        </div>
      </div>`;
    pickerLabel.textContent = 'Cambiar outfit';
  } else {
    assignedSection.style.display = 'none';
    pickerLabel.textContent = 'Selecciona un outfit';
  }

  list.innerHTML = AppState.outfits.map(o => `
    <div class="selected-item" style="cursor:pointer;${entry?.outfit_id === o.id ? 'border-color:var(--accent-primary);' : ''}" data-outfit-id="${o.id}">
      ${o.thumbnail_url ? `<img src="${o.thumbnail_url}" alt="" style="width:36px;height:36px;object-fit:contain;">` : `<span style="font-size:22px">✨</span>`}
      <div class="selected-item-info">
        <div class="selected-item-name">${o.name}</div>
        <div class="selected-item-cat">${o.occasion || ''}</div>
      </div>
      ${entry?.outfit_id === o.id ? '<span style="color:var(--accent-primary)">✓</span>' : ''}
    </div>`).join('') || '<p style="color:var(--text-muted);text-align:center;padding:16px;">No tienes outfits guardados aún</p>';
  list.querySelectorAll('[data-outfit-id]').forEach(item => {
    item.addEventListener('click', () => assignOutfitToDay(parseInt(item.dataset.outfitId)));
  });
  $('modal-calendar-day').style.display = 'flex';
}

$('close-calendar-day').addEventListener('click', () => $('modal-calendar-day').style.display = 'none');

$('btn-clear-cal-day').addEventListener('click', async () => {
  const entry = AppState.calendarEntries.find(e => e.date?.startsWith(selectedCalDate));
  if (!entry) { $('modal-calendar-day').style.display = 'none'; return; }
  try {
    await fetch(`${API}/calendar/${entry.id}`, { method: 'DELETE' });
    AppState.calendarEntries = AppState.calendarEntries.filter(e => e.id !== entry.id);
    renderCalendar();
    $('modal-calendar-day').style.display = 'none';
    toast('Outfit eliminado del día', 'success');
  } catch { toast('Error', 'error'); }
});

async function assignOutfitToDay(outfitId) {
  try {
    const res    = await fetch(`${API}/calendar`, {
      method: 'POST', headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ userId: AppState.currentUser.id, outfitId, date: selectedCalDate })
    });
    const entry  = await res.json();
    const outfit = AppState.outfits.find(o => o.id === outfitId);
    const full   = { ...entry, thumbnail_url: outfit?.thumbnail_url, outfit_name: outfit?.name };
    const idx    = AppState.calendarEntries.findIndex(e => e.date?.startsWith(selectedCalDate));
    if (idx === -1) AppState.calendarEntries.push(full);
    else AppState.calendarEntries[idx] = full;
    renderCalendar();
    $('modal-calendar-day').style.display = 'none';
    toast('Outfit asignado ✨', 'success');
  } catch { toast('Error asignando outfit', 'error'); }
}

// ════════════════════════════════════════════════
//  VERA CHAT
// ════════════════════════════════════════════════
$('btn-send-chat').addEventListener('click', sendChat);
$('chat-input').addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChat(); }
});
$('chat-suggestions').addEventListener('click', e => {
  const chip = e.target.closest('.suggestion-chip');
  if (!chip) return;
  $('chat-input').value = chip.textContent;
  sendChat();
});

async function sendChat() {
  const input = $('chat-input');
  const msg   = input.value.trim();
  if (!msg) return;
  input.value = '';
  appendBubble(msg, 'user');
  AppState.chatHistory.push({ role: 'user', content: msg });
  const typingId = appendTyping();
  try {
    const res  = await fetch(`${API}/chat`, {
      method: 'POST', headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ message: msg, userId: AppState.currentUser.id, conversationHistory: AppState.chatHistory.slice(-10) })
    });
    const data = await res.json();
    removeTyping(typingId);
    if (data.reply) {
      const jsonMatch = data.reply.match(/```json\s*([\s\S]*?)```/);
      const display   = data.reply.replace(/```json[\s\S]*?```/g, '').trim();
      let suggestedIds = [];
      if (jsonMatch) {
        try { suggestedIds = JSON.parse(jsonMatch[1]).suggested_garment_ids || []; } catch {}
      }
      AppState.chatHistory.push({ role: 'assistant', content: data.reply });
      appendBubble(display, 'assistant');
      if (suggestedIds.length) highlightSuggestedGarments(suggestedIds);
    }
  } catch {
    removeTyping(typingId);
    appendBubble('No pude conectarme al servidor.', 'assistant');
  }
}

function appendBubble(text, role) {
  const messages = $('chat-messages');
  const div = document.createElement('div');
  div.className = `chat-bubble ${role}`;
  const avHTML = role === 'user'
    ? (AppState.currentUser?.avatar_url ? `<img src="${AppState.currentUser.avatar_url}">` : '👤')
    : '✨';
  div.innerHTML = `
    <div class="bubble-avatar">${avHTML}</div>
    <div class="bubble-content">${text.replace(/\n/g, '<br>')}</div>`;
  messages.appendChild(div);
  messages.scrollTop = messages.scrollHeight;
}

function appendTyping() {
  const id = 'typing-' + Date.now();
  const messages = $('chat-messages');
  const div = document.createElement('div');
  div.className = 'chat-bubble'; div.id = id;
  div.innerHTML = `<div class="bubble-avatar">✨</div><div class="bubble-content"><div class="typing-indicator"><div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div></div></div>`;
  messages.appendChild(div);
  messages.scrollTop = messages.scrollHeight;
  return id;
}
function removeTyping(id) { $(id)?.remove(); }

function highlightSuggestedGarments(ids) {
  document.querySelectorAll('.garment-card').forEach(card => {
    if (ids.includes(parseInt(card.dataset.id))) {
      card.style.boxShadow = '0 0 24px rgba(200,169,110,0.6), 0 0 0 2px var(--accent-primary)';
      setTimeout(() => card.style.boxShadow = '', 5000);
    }
  });
}

// ════════════════════════════════════════════════
//  NOVEDADES
// ════════════════════════════════════════════════
function renderNovedades() {
  const grid   = $('styles-grid');
  const active = AppState.currentUser?.style_preferences || [];
  grid.innerHTML = STYLES.map(s => `
    <div class="style-card ${active.includes(s.key) ? 'active' : ''}" data-style="${s.key}">
      <div class="style-icon">${s.icon}</div>
      <div class="style-name">${s.name}</div>
    </div>`).join('');
  grid.querySelectorAll('.style-card').forEach(card => {
    card.addEventListener('click', () => {
      card.classList.toggle('active');
      AppState.activeStyles = [...document.querySelectorAll('.style-card.active')].map(c => c.dataset.style);
    });
  });
  AppState.activeStyles = active;
}

$('btn-get-recs').addEventListener('click', async () => {
  const container = $('recs-container');
  container.innerHTML = '<div class="processing-bar"><div class="processing-spinner"></div><span>VERA está analizando tu armario...</span></div>';
  try {
    const res  = await fetch(`${API}/recommendations`, {
      method: 'POST', headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ userId: AppState.currentUser.id, styles: AppState.activeStyles })
    });
    const data = await res.json();
    if (data.recommendations?.length) {
      container.innerHTML = `<div class="recs-grid">${data.recommendations.map(r => `
        <div class="rec-card">
          <div class="rec-icon">${getCategoryEmoji(r.category)}</div>
          <div class="rec-name">${r.item_name}</div>
          <div class="rec-reason">${r.reason}</div>
          <div class="rec-price">$${Number(r.estimated_price).toFixed(0)}</div>
          <div class="rec-season">🗓 ${r.best_season_to_buy}</div>
        </div>`).join('')}</div>`;
    } else {
      container.innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:24px;">No se generaron recomendaciones</p>';
    }
  } catch {
    container.innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:24px;">Error conectando con el servidor</p>';
  }
});

function getCategoryEmoji(cat) {
  return {top:'👕',bottom:'👖',dress:'👗',outerwear:'🧥',shoes:'👟',accessory:'💍'}[cat] || '✨';
}

// ════════════════════════════════════════════════
//  ANALYTICS
// ════════════════════════════════════════════════
async function loadAnalytics() {
  try {
    const res  = await fetch(`${API}/analytics?userId=${AppState.currentUser.id}`);
    const data = await res.json();
    renderAnalytics(data);
  } catch {
    $('analytics-grid').innerHTML = '<p style="color:var(--text-muted);">Error cargando análisis</p>';
  }
}

function renderAnalytics(data) {
  const grid    = $('analytics-grid');
  const maxWorn = Math.max(...(data.topWorn?.map(g => g.times_worn) || [1]), 1);
  const catColors = ['#c8a96e','#9b8bb4','#6e9bc8','#6ec8b4','#c86e9b','#c8b46e'];

  grid.innerHTML = `
    <div class="analytics-card">
      <h3>Total de prendas</h3>
      <div class="stat-number">${data.total || 0}</div>
      <div class="stat-label">en tu armario</div>
      ${data.saturation?.length ? `<div style="margin-top:14px;padding:9px 13px;background:rgba(255,180,0,0.1);border:1px solid rgba(255,180,0,0.25);border-radius:10px;font-size:12px;color:#ffb400;">⚠ Exceso en: ${data.saturation.map(s => s.category).join(', ')}</div>` : ''}
    </div>
    <div class="analytics-card">
      <h3>Por categoría</h3>
      <div class="donut-wrapper">
        <svg viewBox="0 0 42 42" style="width:100%;height:100%;transform:rotate(-90deg)">
          <circle cx="21" cy="21" r="15.9155" fill="none" stroke="var(--glass-border)" stroke-width="3"/>
          <circle cx="21" cy="21" r="15.9155" fill="none" stroke="url(#dg)" stroke-width="3"
            stroke-dasharray="${data.total > 0 ? '100' : '0'} 100" stroke-linecap="round"/>
          <defs><linearGradient id="dg" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#c8a96e"/><stop offset="100%" stop-color="#9b8bb4"/>
          </linearGradient></defs>
        </svg>
        <div class="donut-center"><div class="donut-total">${data.total || 0}</div><div class="donut-text">prendas</div></div>
      </div>
      <div style="display:flex;flex-direction:column;gap:5px;">
        ${(data.byCategory || []).map((r, i) => `
          <div style="display:flex;justify-content:space-between;font-size:12px;">
            <span style="color:var(--text-secondary);display:flex;align-items:center;gap:6px;">
              <span style="width:9px;height:9px;border-radius:50%;background:${catColors[i % catColors.length]};display:inline-block;"></span>
              ${CATEGORY_LABELS[r.category] || r.category}
            </span>
            <span style="font-family:'JetBrains Mono',monospace;color:var(--accent-primary);">${r.count}</span>
          </div>`).join('')}
      </div>
    </div>
    <div class="analytics-card" style="grid-column:1/-1">
      <h3>Prendas más usadas</h3>
      ${data.topWorn?.length ? `<div class="bar-chart">${data.topWorn.slice(0, 8).map(g => `
        <div class="bar-item">
          <div class="bar-label"><span>${g.name}</span><span style="font-family:'JetBrains Mono',monospace;color:var(--accent-primary);">${g.times_worn}×</span></div>
          <div class="bar-track"><div class="bar-fill" style="width:${(g.times_worn / maxWorn * 100).toFixed(0)}%"></div></div>
        </div>`).join('')}</div>`
      : '<p style="color:var(--text-muted);font-size:13px;">Asigna outfits al planificador para registrar el uso.</p>'}
    </div>
    <div class="analytics-card">
      <h3>Paleta del armario</h3>
      <div class="color-swatches">
        ${(data.colors || []).map(c => `
          <div class="color-swatch">
            <div class="swatch-dot" style="background:${colorHex(c.color)};"></div>
            <span>${c.color} (${c.count})</span>
          </div>`).join('') || '<p style="color:var(--text-muted);font-size:13px;">Agrega colores a tus prendas</p>'}
      </div>
    </div>
    <div class="analytics-card">
      <h3>Sin usar (60+ días)</h3>
      ${data.sleeping?.length ? `
        <div class="sleeping-grid">${data.sleeping.slice(0, 8).map(g => `
          <div class="sleeping-card"><img src="${g.image_url}" alt="${g.name}"><div>${g.name}</div></div>`).join('')}</div>
        <p style="font-size:12px;color:var(--text-muted);margin-top:10px;">${data.sleeping.length} prenda${data.sleeping.length > 1 ? 's' : ''} olvidada${data.sleeping.length > 1 ? 's' : ''}</p>`
      : '<p style="color:var(--text-muted);font-size:13px;">¡Todas tus prendas están activas 🌟</p>'}
    </div>`;

  requestAnimationFrame(() => {
    document.querySelectorAll('.bar-fill').forEach(b => {
      const w = b.style.width; b.style.width = '0';
      setTimeout(() => b.style.width = w, 50);
    });
  });
}

function colorHex(name) {
  const map = {negro:'#1a1a1a',blanco:'#f5f5f5',gris:'#808080',azul:'#4a90d9',rojo:'#e74c3c',
    verde:'#27ae60',amarillo:'#f1c40f',rosa:'#ff69b4',naranja:'#e67e22',morado:'#8e44ad',
    café:'#795548',beige:'#d4b896',camel:'#c19a6b',crema:'#fffdd0',dorado:'#c8a96e',
    plateado:'#bdbdbd','blanco crema':'#f8f3ea','azul marino':'#1a237e','verde oliva':'#808000'};
  return map[name?.toLowerCase()] || '#888';
}


// ════════════════════════════════════════════════
//  INIT
// ════════════════════════════════════════════════
initUser();
