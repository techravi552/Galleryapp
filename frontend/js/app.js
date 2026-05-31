/**
 * RAVI GALLERY — APP ENTRY POINT
 * Detects current page and initializes the correct modules.
 * Loaded last on every page.
 */

(function () {
  'use strict';

  const path = window.location.pathname;

  function isPage(...slugs) {
    return slugs.some(
      (slug) =>
        path === slug ||
        path === slug + '.html' ||
        (slug === '/' && (path === '/' || path === '/index.html' || path === ''))
    );
  }

  document.addEventListener('DOMContentLoaded', () => {
    // ── Always ──────────────────────────────────────────────────────────────
    Theme.init();
    Nav.init();
    Toast.init();
    PWA.init();
    // Inject logout UI — Auth.init waits for DOM, Nav.init already ran
    if (window.Auth) {
      Auth.init();
      // Retry once after 300ms in case of slow DOM painting
      setTimeout(() => Auth.init(), 300);
    }

    // ── Page-specific ────────────────────────────────────────────────────────

    if (isPage('/', '/index')) {
      LazyLoad.init();
      Gallery.init();
      Lightbox.init();
      CommentModal.init();
    }

    if (isPage('/gallery')) {
      LazyLoad.init();
      Gallery.init();
      Lightbox.init();
      CommentModal.init();
      DeleteModal.init();
    }

    if (isPage('/upload')) {
      Upload.init();
    }

    if (isPage('/profile')) {
      LazyLoad.init();
      Profile.init();
      Lightbox.init();
      CommentModal.init();
      initProfileGallery();
    }
  });

  // ── Reload gallery on back-navigation (bfcache) ────────────────────────
  // This fires when user navigates back/forward via browser history.
  // Forces a fresh API fetch so newly uploaded images appear immediately.
  window.addEventListener('pageshow', (e) => {
    if (e.persisted) {
      // Page was restored from bfcache — force gallery reload
      if (isPage('/', '/index', '/gallery')) {
        if (window.Gallery) Gallery.load(true);
      }
    }
  });

  // ── Also reload gallery if URL has ?refresh=1 (set by upload success) ──
  if ((isPage('/', '/index', '/gallery')) &&
      new URLSearchParams(window.location.search).get('refresh') === '1') {
    // Clean the URL without reloading
    const cleanUrl = window.location.pathname + (
      new URLSearchParams(window.location.search).get('search')
        ? '?search=' + new URLSearchParams(window.location.search).get('search')
        : ''
    );
    window.history.replaceState({}, '', cleanUrl);
    // Gallery.init() will run via DOMContentLoaded above and load fresh
  }

  // ─── Profile Gallery ──────────────────────────────────────────────────────

  async function initProfileGallery() {
    const grid     = document.getElementById('profileGallery');
    const skeleton = document.getElementById('skeletonGrid');
    const empty    = document.getElementById('emptyState');
    if (!grid) return;

    try {
      const res = await ImagesAPI.getAll({ page: 1, limit: 8, sort: 'newest' });
      const images = res.data || [];

      skeleton?.classList.add('hidden');

      if (images.length === 0) {
        grid.classList.add('hidden');
        empty?.classList.remove('hidden');
        return;
      }

      grid.classList.remove('hidden');
      const fragment = document.createDocumentFragment();
      images.forEach((img, i) => {
        const card = CardBuilder.build(img, i);
        fragment.appendChild(card);
      });
      grid.appendChild(fragment);

      // Lightbox
      grid.addEventListener('click', (e) => {
        const card = e.target.closest('.gallery-item');
        if (!card) return;
        if (e.target.closest('.btn-like') || e.target.closest('.btn-comment') || e.target.closest('.btn-download')) return;
        const id  = card.dataset.id;
        const idx = images.findIndex((img) => img._id === id);
        if (idx !== -1) Lightbox.open(images, idx);
      });

      // Like delegation
      grid.addEventListener('click', async (e) => {
        const likeBtn = e.target.closest('.btn-like');
        if (!likeBtn) return;
        e.stopPropagation();
        const id = likeBtn.dataset.id;
        const img = images.find((i) => i._id === id);
        if (!img) return;
        const card = likeBtn.closest('.gallery-item');
        const nowLiked = LikeStore.toggle(id);
        img.likes = Math.max(0, (img.likes || 0) + (nowLiked ? 1 : -1));
        likeBtn.classList.toggle('liked', nowLiked);
        likeBtn.textContent = nowLiked ? '❤️' : '♡';
        const lc = card?.querySelector('.like-count');
        if (lc) lc.textContent = img.likes;
        try {
          const r = await ImagesAPI.like(id);
          img.likes = r.data.likes;
          if (lc) lc.textContent = img.likes;
        } catch {}
      });

      // Download delegation
      grid.addEventListener('click', async (e) => {
        const dlBtn = e.target.closest('.btn-download');
        if (!dlBtn) return;
        e.stopPropagation();
        const id  = dlBtn.dataset.id;
        const url = dlBtn.dataset.url;
        try { await ImagesAPI.recordDownload(id); } catch {}
        downloadImage(url, 'ravi-gallery-photo');
        Toast.success('Download started!');
      });

      // Comment delegation
      grid.addEventListener('click', (e) => {
        const cmtBtn = e.target.closest('.btn-comment');
        if (!cmtBtn) return;
        e.stopPropagation();
        const id  = cmtBtn.dataset.id;
        const img = images.find((i) => i._id === id);
        if (img) CommentModal.open(img);
      });

    } catch {
      skeleton?.classList.add('hidden');
      empty?.classList.remove('hidden');
    }
  }

})();
