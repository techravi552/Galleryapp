/**
 * RAVI GALLERY — LIGHTBOX
 * Fullscreen image viewer with:
 *   - Swipe navigation (touch)
 *   - Double-tap zoom
 *   - Keyboard navigation
 *   - Like / Comment / Download / Share
 */

const Lightbox = (() => {
  let images    = [];
  let current   = 0;
  let isOpen    = false;
  let scale     = 1;
  let lastTap   = 0;

  // Touch state
  let touchStartX = 0;
  let touchStartY = 0;
  let touchDist   = 0;

  // Elements
  const lb         = () => document.getElementById('lightbox');
  const lbImg      = () => document.getElementById('lbImg');
  const lbTitle    = () => document.getElementById('lbTitle');
  const lbStage    = () => document.getElementById('lbStage');
  const lbLikeBtn  = () => document.getElementById('lbLike');
  const lbClose    = () => document.getElementById('lbClose');
  const lbPrev     = () => document.getElementById('lbPrev');
  const lbNext     = () => document.getElementById('lbNext');
  const lbDownload = () => document.getElementById('lbDownload');
  const lbShare    = () => document.getElementById('lbShare');
  const lbComment  = () => document.getElementById('lbComment');
  const lbDelete   = () => document.getElementById('lbDelete');

  function currentImage() { return images[current]; }

  function open(imageArray, startIndex = 0) {
    images  = imageArray;
    current = startIndex;
    isOpen  = true;

    lb().classList.add('open');
    document.body.style.overflow = 'hidden';

    render();
  }

  function close() {
    isOpen = false;
    lb().classList.remove('open');
    document.body.style.overflow = '';
    resetZoom();
  }

  function next() {
    if (images.length <= 1) return;
    current = (current + 1) % images.length;
    render();
  }

  function prev() {
    if (images.length <= 1) return;
    current = (current - 1 + images.length) % images.length;
    render();
  }

  function render() {
    const img = currentImage();
    if (!img) return;

    resetZoom();

    // Image
    const el = lbImg();
    el.style.opacity = '0';
    el.src = img.imageUrl;
    el.alt = img.title || 'Gallery photo';
    el.onload = () => { el.style.opacity = '1'; el.style.transition = 'opacity 0.3s'; };

    // Title
    const titleEl = lbTitle();
    if (titleEl) titleEl.textContent = img.title || formatDate(img.createdAt) || 'Photo';

    // Like button state
    updateLikeBtn(img._id, img.likes || 0);

    // Show/hide nav
    const showNav = images.length > 1;
    if (lbPrev()) lbPrev().style.display = showNav ? '' : 'none';
    if (lbNext()) lbNext().style.display = showNav ? '' : 'none';
  }

  function updateLikeBtn(id, count) {
    const btn = lbLikeBtn();
    if (!btn) return;
    const liked = LikeStore.isLiked(id);
    btn.textContent = liked ? '❤️' : '♡';
    btn.title = `${count} like${count !== 1 ? 's' : ''}`;
    btn.classList.toggle('liked', liked);
  }

  function resetZoom() {
    scale = 1;
    const el = lbImg();
    if (el) el.style.transform = 'scale(1)';
  }

  function applyZoom() {
    const el = lbImg();
    if (el) el.style.transform = `scale(${scale})`;
  }

  // ─── Touch Handlers ────────────────────────────────────────────────────

  function onTouchStart(e) {
    if (e.touches.length === 1) {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;

      // Double-tap zoom
      const now = Date.now();
      if (now - lastTap < 300) {
        scale = scale === 1 ? 2.5 : 1;
        applyZoom();
        e.preventDefault();
      }
      lastTap = now;
    } else if (e.touches.length === 2) {
      // Pinch zoom start
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      touchDist = Math.hypot(dx, dy);
    }
  }

  function onTouchEnd(e) {
    if (e.changedTouches.length === 1 && scale === 1) {
      const dx = e.changedTouches[0].clientX - touchStartX;
      const dy = e.changedTouches[0].clientY - touchStartY;
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 50) {
        dx < 0 ? next() : prev();
      }
    }
  }

  function onTouchMove(e) {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      const delta = dist / touchDist;
      scale = Math.min(5, Math.max(1, scale * delta));
      touchDist = dist;
      applyZoom();
      e.preventDefault();
    }
  }

  // ─── Init ──────────────────────────────────────────────────────────────

  function init() {
    // Close
    lbClose()?.addEventListener('click', close);

    // Nav
    lbPrev()?.addEventListener('click', prev);
    lbNext()?.addEventListener('click', next);

    // Keyboard
    document.addEventListener('keydown', (e) => {
      if (!isOpen) return;
      switch (e.key) {
        case 'Escape':     close(); break;
        case 'ArrowRight': next();  break;
        case 'ArrowLeft':  prev();  break;
      }
    });

    // Click outside (stage backdrop)
    lb()?.addEventListener('click', (e) => {
      if (e.target === lb()) close();
    });

    // Touch on stage
    const stage = lbStage();
    stage?.addEventListener('touchstart', onTouchStart, { passive: false });
    stage?.addEventListener('touchend',   onTouchEnd,   { passive: true  });
    stage?.addEventListener('touchmove',  onTouchMove,  { passive: false });

    // Like
    lbLikeBtn()?.addEventListener('click', async () => {
      const img = currentImage();
      if (!img) return;

      // Optimistic update
      const nowLiked = LikeStore.toggle(img._id);
      const newCount = (img.likes || 0) + (nowLiked ? 1 : -1);
      img.likes = Math.max(0, newCount);
      updateLikeBtn(img._id, img.likes);

      // Update card in grid
      const card = document.querySelector(`.gallery-item[data-id="${img._id}"]`);
      if (card) {
        const likeCountEl = card.querySelector('.like-count');
        if (likeCountEl) likeCountEl.textContent = img.likes;
        const likeBtn = card.querySelector('.btn-like');
        if (likeBtn) {
          likeBtn.classList.toggle('liked', nowLiked);
          likeBtn.textContent = nowLiked ? '❤️' : '♡';
        }
      }

      try {
        const res = await ImagesAPI.like(img._id);
        img.likes = res.data.likes;
        updateLikeBtn(img._id, img.likes);
      } catch {
        // Revert
        LikeStore.toggle(img._id);
        img.likes = Math.max(0, img.likes - (nowLiked ? 1 : -1));
        updateLikeBtn(img._id, img.likes);
      }
    });

    // Download
    lbDownload()?.addEventListener('click', async () => {
      const img = currentImage();
      if (!img) return;
      try {
        await ImagesAPI.recordDownload(img._id);
      } catch {}
      const title = img.title || 'ravi-gallery-photo';
      downloadImage(img.imageUrl, title.replace(/\s+/g, '-').toLowerCase() + '.jpg');
      Toast.success('Download started!');
    });

    // Share
    lbShare()?.addEventListener('click', async () => {
      const img = currentImage();
      if (!img) return;
      const shareData = {
        title: img.title || 'Check out this photo on Ravi Gallery',
        text:  img.description || 'Beautiful photo shared from Ravi Gallery',
        url:   img.imageUrl,
      };
      try {
        if (navigator.share && navigator.canShare?.(shareData)) {
          await navigator.share(shareData);
        } else {
          await copyToClipboard(img.imageUrl);
          Toast.success('Image URL copied to clipboard!');
        }
      } catch {}
    });

    // Comment — open modal
    lbComment()?.addEventListener('click', () => {
      const img = currentImage();
      if (!img) return;
      CommentModal.open(img);
    });

    // Delete (gallery.html only)
    lbDelete()?.addEventListener('click', () => {
      const img = currentImage();
      if (!img) return;
      DeleteModal.open(img._id, () => {
        // Remove from array + close or go next
        images.splice(current, 1);
        if (images.length === 0) {
          close();
          // Remove card from grid
          window.Gallery?.removeCard?.(img._id);
        } else {
          current = Math.min(current, images.length - 1);
          render();
          window.Gallery?.removeCard?.(img._id);
        }
      });
    });
  }

  return { init, open, close, next, prev, updateLikeBtn, currentImage: () => currentImage() };
})();

// ─── Comment Modal ──────────────────────────────────────────────────────────

const CommentModal = (() => {
  let activeImageId = null;

  function open(image) {
    activeImageId = image._id;
    const overlay  = document.getElementById('commentModal');
    const list     = document.getElementById('commentModalList');
    if (!overlay || !list) return;

    renderComments(image.comments || []);
    overlay.classList.add('open');
    document.getElementById('commentTextInput')?.focus();
  }

  function close() {
    activeImageId = null;
    document.getElementById('commentModal')?.classList.remove('open');
  }

  function renderComments(comments) {
    const list = document.getElementById('commentModalList');
    if (!list) return;

    if (!comments || comments.length === 0) {
      list.innerHTML = `<p class="text-center text-muted text-sm py-lg">No comments yet. Be the first!</p>`;
      return;
    }

    list.innerHTML = comments.map((c) => `
      <div class="comment-item">
        <div class="comment-avatar">${(c.author || 'A')[0].toUpperCase()}</div>
        <div class="comment-content">
          <div class="comment-author">${escapeHtml(c.author || 'Anonymous')}</div>
          <div class="comment-text">${escapeHtml(c.text)}</div>
          <div class="comment-time">${formatDate(c.createdAt)}</div>
        </div>
      </div>
    `).join('');
  }

  function init() {
    document.getElementById('closeCommentModal')?.addEventListener('click', close);
    document.getElementById('commentModal')?.addEventListener('click', (e) => {
      if (e.target === document.getElementById('commentModal')) close();
    });

    document.getElementById('submitComment')?.addEventListener('click', submit);
    document.getElementById('commentTextInput')?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); }
    });
  }

  async function submit() {
    const textInput   = document.getElementById('commentTextInput');
    const authorInput = document.getElementById('commentAuthorInput');
    if (!textInput) return;

    const text   = textInput.value.trim();
    const author = authorInput?.value.trim() || 'Anonymous';

    if (!text || !activeImageId) return;

    const btn = document.getElementById('submitComment');
    if (btn) { btn.textContent = '…'; btn.disabled = true; }

    try {
      const res = await ImagesAPI.comment(activeImageId, text, author);
      textInput.value = '';

      // Update UI with new comment at top
      const list = document.getElementById('commentModalList');
      if (list) {
        const existing = list.querySelector('p');
        if (existing) list.innerHTML = '';

        const newComment = document.createElement('div');
        newComment.className = 'comment-item';
        newComment.innerHTML = `
          <div class="comment-avatar">${author[0].toUpperCase()}</div>
          <div class="comment-content">
            <div class="comment-author">${escapeHtml(author)}</div>
            <div class="comment-text">${escapeHtml(text)}</div>
            <div class="comment-time">Just now</div>
          </div>
        `;
        list.prepend(newComment);
      }

      // Update image in lightbox
      const current = Lightbox.currentImage();
      if (current && current._id === activeImageId) {
        current.comments = current.comments || [];
        current.comments.unshift(res.data.comment);
      }

      Toast.success('Comment added!');
    } catch (err) {
      Toast.error(err.message || 'Failed to add comment.');
    } finally {
      if (btn) { btn.textContent = '↑'; btn.disabled = false; }
    }
  }

  return { init, open, close };
})();

// ─── Delete Modal (gallery.html) ────────────────────────────────────────────

const DeleteModal = (() => {
  let targetId = null;
  let callback = null;

  function open(id, onDelete) {
    targetId = id;
    callback = onDelete;
    document.getElementById('deleteModal')?.classList.add('open');
  }

  function close() {
    targetId = null;
    callback = null;
    document.getElementById('deleteModal')?.classList.remove('open');
  }

  function init() {
    document.getElementById('closeDeleteModal')?.addEventListener('click', close);
    document.getElementById('cancelDelete')?.addEventListener('click', close);
    document.getElementById('deleteModal')?.addEventListener('click', (e) => {
      if (e.target === document.getElementById('deleteModal')) close();
    });

    document.getElementById('confirmDelete')?.addEventListener('click', async () => {
      if (!targetId) return;
      const btn = document.getElementById('confirmDelete');
      if (btn) { btn.textContent = 'Deleting…'; btn.disabled = true; }

      try {
        await ImagesAPI.delete(targetId);
        Toast.success('Photo deleted.');
        close();
        callback?.();
      } catch (err) {
        Toast.error(err.message || 'Delete failed.');
        if (btn) { btn.textContent = 'Delete'; btn.disabled = false; }
      }
    });
  }

  return { init, open, close };
})();

window.Lightbox     = Lightbox;
window.CommentModal = CommentModal;
window.DeleteModal  = DeleteModal;
