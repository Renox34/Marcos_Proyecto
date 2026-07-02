// ─── login.js ────────────────────────────────────
const API = '/api';

// Si ya hay sesión activa CON token válido, ir directo a la app.
// Las sesiones viejas sin token se descartan (deben re-loguearse).
try {
  const stored = JSON.parse(localStorage.getItem('vestry_user') || 'null');
  if (stored?.token) {
    window.location.href = '/';
  } else if (stored) {
    localStorage.removeItem('vestry_user');
  }
} catch { localStorage.removeItem('vestry_user'); }

function toast(msg, type = 'info') {
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `<span>${type === 'error' ? '✗' : '✓'}</span> ${msg}`;
  document.getElementById('toast-container').appendChild(el);
  setTimeout(() => el.remove(), 3500);
}

let pendingAvatarBlob = null;

// Avatar click
document.getElementById('login-avatar-btn').addEventListener('click', () => {
  document.getElementById('login-avatar-file').click();
});

document.getElementById('login-avatar-file').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const proc = document.getElementById('login-processing');
  proc.style.display = 'block';

  try {
    const { removeBackground } = await import(
      'https://cdn.jsdelivr.net/npm/@imgly/background-removal@1.4.5/dist/background-removal.js'
    );
    const blob = await removeBackground(file, {
      publicPath: 'https://cdn.jsdelivr.net/npm/@imgly/background-removal@1.4.5/dist/'
    });
    pendingAvatarBlob = blob;
    showAvatarPreview(URL.createObjectURL(blob));
  } catch {
    pendingAvatarBlob = file;
    showAvatarPreview(URL.createObjectURL(file));
  } finally {
    proc.style.display = 'none';
  }
});

function showAvatarPreview(url) {
  const img = document.getElementById('login-avatar-img');
  img.src = url;
  img.style.display = 'block';
  document.querySelector('.av-icon').style.display = 'none';
}

// Submit
document.getElementById('btn-login-submit').addEventListener('click', async () => {
  const name     = document.getElementById('login-name').value.trim();
  const email    = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  if (!name || !email || !password) { toast('Completa nombre, email y contraseña', 'error'); return; }

  const btn = document.getElementById('btn-login-submit');
  btn.textContent = 'Entrando...';
  btn.disabled = true;

  const fd = new FormData();
  fd.append('name', name);
  fd.append('email', email);
  fd.append('password', password);
  if (pendingAvatarBlob) fd.append('avatar', pendingAvatarBlob, 'avatar.png');

  try {
    const res  = await fetch(`${API}/users/register`, { method: 'POST', body: fd });
    const data = await res.json();
    if (data.user) {
      localStorage.setItem('vestry_user', JSON.stringify({ ...data.user, token: data.token }));
      window.location.href = '/';
    } else {
      toast(data.error || 'Error al acceder', 'error');
      btn.textContent = 'Abrir mi closet →';
      btn.disabled = false;
    }
  } catch {
    toast('No se pudo conectar al servidor. ¿Está corriendo?', 'error');
    btn.textContent = 'Abrir mi closet →';
    btn.disabled = false;
  }
});

// Enter key submit
document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') document.getElementById('btn-login-submit').click();
});
