/**
 * RAVI GALLERY — UI UTILITIES
 * Shared UI helpers: toasts, nav, theme, skeleton, misc.
 */

// ─── Toast System ───────────────────────────────────────────────────────────

const Toast = {
  container: null,

  init() {
    this.container = document.getElementById('toastContainer');
  },

  show(message, type = 'info', duration = 3500) {
    if (!this.container) this.init();
    if (!this.container) return;

    const icons = { success: '✓', error: '✕', info: 'ℹ' };
    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    toast.innerHTML = `<span style="font-size:1rem">${icons[type] || icons.info}</span><span>${message}</span>`;
    this.container.appendChild(toast);

    const remove = () => {
      toast.classList.add('out');
      toast.addEventListener('animationend', () => toast.remove(), { once: true });
    };

    const timer = setTimeout(remove, duration);
    toast.addEventListener('click', () => { clearTimeout(timer); remove(); });
  },

  success(msg, dur) { this.show(msg, 'success', dur); },
  error(msg, dur)   { this.show(msg, 'error', dur); },
  info(msg, dur)    { this.show(msg, 'info', dur); },
};

// ─── Theme Toggle ───────────────────────────────────────────────────────────

const Theme = {
  KEY: 'rg_theme',

  init() {
    const saved = localStorage.getItem(this.KEY) || 'dark';
    this.apply(saved);
    const btn = document.getElementById('themeToggle');
    if (btn) btn.addEventListener('click', () => this.toggle());
  },

  apply(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    const btn = document.getElementById('themeToggle');
    if (btn) btn.textContent = theme === 'dark' ? '🌙' : '☀️';
    localStorage.setItem(this.KEY, theme);
  },

  toggle() {
    const current = document.documentElement.getAttribute('data-theme') || 'dark';
    this.apply(current === 'dark' ? 'light' : 'dark');
  },
};

// ─── Navigation Drawer ──────────────────────────────────────────────────────

const Nav = {
  init() {
    const hamburger = document.getElementById('hamburger');
    const drawer    = document.getElementById('navDrawer');
    const overlay   = document.getElementById('navOverlay');

    if (!hamburger || !drawer) return;

    const open  = () => {
      drawer.classList.add('open');
      overlay.classList.add('show');
      hamburger.classList.add('open');
      hamburger.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
    };

    const close = () => {
      drawer.classList.remove('open');
      overlay.classList.remove('show');
      hamburger.classList.remove('open');
      hamburger.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    };

    hamburger.addEventListener('click', () => {
      drawer.classList.contains('open') ? close() : open();
    });

    overlay.addEventListener('click', close);

    // Close on nav link click
    drawer.querySelectorAll('.nav-drawer__link').forEach((link) => {
      link.addEventListener('click', close);
    });

    // Close on Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && drawer.classList.contains('open')) close();
    });
  },
};

// ─── Lazy Image Loading ─────────────────────────────────────────────────────

const LazyLoad = {
  observer: null,

  init() {
    if (!('IntersectionObserver' in window)) return;

    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target;
            const src = img.dataset.src;
            if (src) {
              img.src = src;
              img.removeAttribute('data-src');
              img.addEventListener('load', () => img.classList.add('loaded'), { once: true });
              this.observer.unobserve(img);
            }
          }
        });
      },
      { rootMargin: '200px 0px' }
    );
  },

  observe(img) {
    if (this.observer) this.observer.observe(img);
    else if (img.dataset.src) { img.src = img.dataset.src; img.removeAttribute('data-src'); }
  },
};

// ─── Gallery Card Builder ───────────────────────────────────────────────────

const CardBuilder = {
  /**
   * Build a masonry gallery item card
   * @param {Object} image - image document from API
   * @param {number} index - for stagger animation
   * @returns {HTMLElement}
   */
  build(image, index = 0) {
    const item = document.createElement('div');
    item.className = 'gallery-item';
    item.setAttribute('role', 'listitem');
    item.setAttribute('data-id', image._id);
    item.style.animationDelay = `${Math.min(index * 60, 600)}ms`;

    // Use thumbnail for masonry, full for lightbox
    const thumbUrl = image.thumbnailUrl || image.imageUrl;
    const likedIds = LikeStore.getLiked();
    const isLiked  = likedIds.includes(image._id);

    item.innerHTML = `
      <img
        class="gallery-item__img"
        data-src="${thumbUrl}"
        src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1 1'%3E%3C/svg%3E"
        alt="${escapeHtml(image.title || 'Gallery photo')}"
        loading="lazy"
        decoding="async"
        width="400"
        style="min-height:120px;background:var(--bg-card)"
      />
      <div class="gallery-item__overlay">
        <div class="gallery-item__meta">
          <div class="gallery-item__likes">
            <span>${isLiked ? '❤️' : '🤍'}</span>
            <span class="like-count">${image.likes || 0}</span>
          </div>
          ${image.title ? `<span class="truncate text-sm" style="color:rgba(255,255,255,0.8);flex:1">${escapeHtml(image.title)}</span>` : ''}
        </div>
        <div class="gallery-item__actions">
          <button class="action-btn btn-like ${isLiked ? 'liked' : ''}" data-id="${image._id}" aria-label="Like photo" title="Like">
            ${isLiked ? '❤️' : '♡'}
          </button>
          <button class="action-btn btn-comment" data-id="${image._id}" aria-label="Comment" title="Comment">💬</button>
          <button class="action-btn btn-download" data-id="${image._id}" data-url="${image.imageUrl}" aria-label="Download" title="Download">⬇</button>
        </div>
      </div>
    `;

    // Lazy load
    const img = item.querySelector('.gallery-item__img');
    LazyLoad.observe(img);

    return item;
  },
};

// ─── Like Persistence (localStorage) ───────────────────────────────────────

const LikeStore = {
  KEY: 'rg_liked',

  getLiked() {
    try {
      return JSON.parse(localStorage.getItem(this.KEY) || '[]');
    } catch { return []; }
  },

  toggle(id) {
    const liked = this.getLiked();
    const idx = liked.indexOf(id);
    if (idx === -1) liked.push(id);
    else liked.splice(idx, 1);
    try { localStorage.setItem(this.KEY, JSON.stringify(liked)); } catch {}
    return idx === -1; // true = now liked
  },

  isLiked(id) {
    return this.getLiked().includes(id);
  },
};

// ─── Helpers ────────────────────────────────────────────────────────────────

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatDate(isoString) {
  if (!isoString) return '';
  try {
    return new Intl.DateTimeFormat('en-IN', {
      year: 'numeric', month: 'short', day: 'numeric',
    }).format(new Date(isoString));
  } catch { return ''; }
}

function formatNumber(n) {
  if (typeof n !== 'number') return '0';
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return String(n);
}

function formatFileSize(bytes) {
  if (!bytes) return '';
  const units = ['B', 'KB', 'MB', 'GB'];
  let i = 0;
  while (bytes >= 1024 && i < units.length - 1) { bytes /= 1024; i++; }
  return `${bytes.toFixed(1)} ${units[i]}`;
}

function debounce(fn, ms) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

function copyToClipboard(text) {
  if (navigator.clipboard?.writeText) {
    return navigator.clipboard.writeText(text);
  }
  const el = document.createElement('textarea');
  el.value = text;
  el.style.cssText = 'position:fixed;opacity:0';
  document.body.appendChild(el);
  el.select();
  document.execCommand('copy');
  el.remove();
  return Promise.resolve();
}

async function downloadImage(url, filename = 'ravi-gallery-photo') {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(blobUrl);
  } catch {
    window.open(url, '_blank');
  }
}

// Expose globals
window.Toast    = Toast;
window.Theme    = Theme;
window.Nav      = Nav;
window.LazyLoad = LazyLoad;
window.CardBuilder = CardBuilder;
window.LikeStore   = LikeStore;
window.escapeHtml  = escapeHtml;
window.formatDate  = formatDate;
window.formatNumber = formatNumber;
window.formatFileSize = formatFileSize;
window.debounce    = debounce;
window.copyToClipboard = copyToClipboard;
window.downloadImage   = downloadImage;
