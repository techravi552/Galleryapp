/**
 * RAVI GALLERY — GALLERY MODULE
 * Masonry grid, infinite scroll, search, sort/tag filters,
 * card event delegation (like, comment, download, open lightbox).
 */

const Gallery = (() => {
  // State
  let page        = 1;
  const limit     = 12;
  let sort        = 'newest';
  let search      = '';
  let activeTag   = '';
  let loading     = false;
  let hasMore     = true;
  let allImages   = [];  // current page's images (for lightbox)
  let observer    = null;

  // DOM
  const grid       = () => document.getElementById('galleryGrid');
  const skeleton   = () => document.getElementById('skeletonGrid');
  const empty      = () => document.getElementById('emptyState');
  const countEl    = () => document.getElementById('imageCount');
  const spinner    = () => document.getElementById('loadSpinner');
  const sentinel   = () => document.getElementById('loadSentinel');

  // ─── Fetch & Render ─────────────────────────────────────────────────────

  async function load(reset = false) {
    if (loading || (!hasMore && !reset)) return;

    if (reset) {
      page     = 1;
      hasMore  = true;
      allImages = [];
      grid()?.replaceChildren();
      showSkeleton(true);
    }

    loading = true;
    spinner()?.classList.remove('hidden');

    try {
      const res = await ImagesAPI.getAll({ page, limit, sort, search, tag: activeTag });
      const images = res.data || [];
      const pagination = res.pagination || {};

      hasMore = pagination.hasMore || false;
      page++;

      // Update count label (only on first page)
      if (page === 2) {
        const total = pagination.total || 0;
        if (countEl()) countEl().textContent = `${total} photo${total !== 1 ? 's' : ''}`;
      }

      showSkeleton(false);

      if (images.length === 0 && allImages.length === 0) {
        grid()?.classList.add('hidden');
        empty()?.classList.remove('hidden');
      } else {
        grid()?.classList.remove('hidden');
        empty()?.classList.add('hidden');

        const startIdx = allImages.length;
        allImages.push(...images);
        appendCards(images, startIdx);
      }
    } catch (err) {
      showSkeleton(false);
      Toast.error(err.message || 'Failed to load images.');
    } finally {
      loading = false;
      spinner()?.classList.add('hidden');
    }
  }

  function appendCards(images, startIdx = 0) {
    const g = grid();
    if (!g) return;
    const fragment = document.createDocumentFragment();
    images.forEach((img, i) => {
      const card = CardBuilder.build(img, startIdx + i);
      fragment.appendChild(card);
    });
    g.appendChild(fragment);
  }

  function removeCard(id) {
    const card = grid()?.querySelector(`.gallery-item[data-id="${id}"]`);
    card?.remove();
    allImages = allImages.filter((img) => img._id !== id);
    // Update count
    const total = allImages.length;
    if (countEl()) countEl().textContent = `${total} photo${total !== 1 ? 's' : ''}`;
    if (total === 0) {
      grid()?.classList.add('hidden');
      empty()?.classList.remove('hidden');
    }
  }

  // ─── Skeleton ────────────────────────────────────────────────────────────

  function showSkeleton(show) {
    skeleton()?.classList.toggle('hidden', !show);
    if (show) {
      grid()?.classList.add('hidden');
      empty()?.classList.add('hidden');
    }
  }

  // ─── Infinite Scroll ─────────────────────────────────────────────────────

  function initInfiniteScroll() {
    if (!('IntersectionObserver' in window)) return;
    const sen = sentinel();
    if (!sen) return;

    observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          load();
        }
      },
      { rootMargin: '300px 0px' }
    );
    observer.observe(sen);
  }

  // ─── Search ──────────────────────────────────────────────────────────────

  function initSearch() {
    const input   = document.getElementById('searchInput');
    const clearBtn = document.getElementById('clearSearch');
    if (!input) return;

    const debouncedSearch = debounce((val) => {
      search = val.trim();
      activeTag = '';
      // Deactivate tag pills
      document.querySelectorAll('.pill[data-tag]').forEach((p) => p.classList.remove('active'));
      load(true);
    }, 400);

    input.addEventListener('input', (e) => {
      const val = e.target.value;
      if (clearBtn) clearBtn.style.display = val ? '' : 'none';
      debouncedSearch(val);
    });

    // Index.html search submit
    const searchBtn = document.getElementById('searchBtn');
    searchBtn?.addEventListener('click', () => {
      search = input.value.trim();
      if (window.location.pathname === '/' || window.location.pathname === '/index.html') {
        window.location.href = `/gallery.html?search=${encodeURIComponent(search)}`;
      } else {
        load(true);
      }
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        search = input.value.trim();
        if (window.location.pathname === '/' || window.location.pathname === '/index.html') {
          window.location.href = `/gallery.html?search=${encodeURIComponent(search)}`;
        } else {
          load(true);
        }
      }
    });

    clearBtn?.addEventListener('click', () => {
      input.value = '';
      clearBtn.style.display = 'none';
      search = '';
      load(true);
    });

    // Pre-fill from URL param (gallery.html)
    const urlSearch = new URLSearchParams(window.location.search).get('search');
    if (urlSearch) {
      input.value = urlSearch;
      search = urlSearch;
      if (clearBtn) clearBtn.style.display = '';
    }
  }

  // ─── Sort / Tag Pills ─────────────────────────────────────────────────────

  function initFilters() {
    document.querySelectorAll('.pill[data-sort]').forEach((pill) => {
      pill.addEventListener('click', () => {
        document.querySelectorAll('.pill[data-sort]').forEach((p) => p.classList.remove('active'));
        pill.classList.add('active');
        sort = pill.dataset.sort;
        load(true);
      });
    });

    document.querySelectorAll('.pill[data-tag]').forEach((pill) => {
      pill.addEventListener('click', () => {
        const tag = pill.dataset.tag;
        const alreadyActive = pill.classList.contains('active');

        document.querySelectorAll('.pill[data-tag]').forEach((p) => p.classList.remove('active'));
        const searchInput = document.getElementById('searchInput');
        if (alreadyActive) {
          activeTag = '';
        } else {
          pill.classList.add('active');
          activeTag = tag;
          if (searchInput) searchInput.value = '';
          search = '';
        }
        load(true);
      });
    });

    // Clear filters button (empty state)
    document.getElementById('clearFilters')?.addEventListener('click', () => {
      sort = 'newest';
      search = '';
      activeTag = '';
      document.querySelectorAll('.pill').forEach((p) => p.classList.remove('active'));
      document.querySelector('.pill[data-sort="newest"]')?.classList.add('active');
      const input = document.getElementById('searchInput');
      if (input) input.value = '';
      load(true);
    });
  }

  // ─── Card Event Delegation ────────────────────────────────────────────────

  function initCardEvents() {
    const g = grid();
    if (!g) return;

    g.addEventListener('click', async (e) => {
      const card = e.target.closest('.gallery-item');
      if (!card) return;
      const id = card.dataset.id;
      const idx = allImages.findIndex((img) => img._id === id);
      if (idx === -1) return;

      // Like button
      if (e.target.closest('.btn-like')) {
        e.stopPropagation();
        await handleLike(id, card, idx);
        return;
      }

      // Comment button
      if (e.target.closest('.btn-comment')) {
        e.stopPropagation();
        CommentModal.open(allImages[idx]);
        return;
      }

      // Download button
      if (e.target.closest('.btn-download')) {
        e.stopPropagation();
        const img = allImages[idx];
        try { await ImagesAPI.recordDownload(id); } catch {}
        downloadImage(img.imageUrl, (img.title || 'photo').replace(/\s+/g, '-').toLowerCase());
        Toast.success('Download started!');
        return;
      }

      // Open lightbox
      Lightbox.open(allImages, idx);
    });
  }

  async function handleLike(id, card, idx) {
    const likeBtn     = card.querySelector('.btn-like');
    const likeCountEl = card.querySelector('.like-count');
    const img         = allImages[idx];
    if (!img) return;

    const nowLiked = LikeStore.toggle(id);
    const newCount = Math.max(0, (img.likes || 0) + (nowLiked ? 1 : -1));
    img.likes = newCount;

    // Optimistic UI
    if (likeBtn) {
      likeBtn.classList.toggle('liked', nowLiked);
      likeBtn.textContent = nowLiked ? '❤️' : '♡';
    }
    if (likeCountEl) likeCountEl.textContent = newCount;

    try {
      const res = await ImagesAPI.like(id);
      img.likes = res.data.likes;
      if (likeCountEl) likeCountEl.textContent = img.likes;
    } catch {
      // Revert
      LikeStore.toggle(id);
      img.likes = Math.max(0, img.likes - (nowLiked ? 1 : -1));
      if (likeBtn) {
        likeBtn.classList.toggle('liked', !nowLiked);
        likeBtn.textContent = !nowLiked ? '❤️' : '♡';
      }
      if (likeCountEl) likeCountEl.textContent = img.likes;
    }
  }

  // ─── View Toggle (2-col compact) ────────────────────────────────────────

  function initViewToggle() {
    const btn = document.getElementById('viewToggle');
    if (!btn) return;
    let compact = false;
    btn.addEventListener('click', () => {
      compact = !compact;
      const g = grid();
      if (g) g.style.columns = compact ? '3' : '';
      btn.textContent = compact ? '⊟' : '⊞';
    });
  }

  // ─── Init ────────────────────────────────────────────────────────────────

  function init() {
    LazyLoad.init();
    initSearch();
    initFilters();
    initCardEvents();
    initViewToggle();
    initInfiniteScroll();
    load(true);
  }

  return { init, load, removeCard, getAllImages: () => allImages };
})();

window.Gallery = Gallery;
