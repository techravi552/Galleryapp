/**
 * RAVI GALLERY — UPLOAD MODULE
 * Handles: drag-drop, file preview, tag chip input,
 * character counters, form validation, XHR upload with progress.
 */

const Upload = (() => {
  let selectedFile = null;
  let tags         = [];

  // DOM refs
  const zone        = () => document.getElementById('uploadZone');
  const fileInput   = () => document.getElementById('fileInput');
  const previewWrap = () => document.getElementById('previewWrap');
  const previewImg  = () => document.getElementById('previewImg');
  const fileNameEl  = () => document.getElementById('fileName');
  const fileSizeEl  = () => document.getElementById('fileSize');
  const submitBtn   = () => document.getElementById('submitBtn');
  const submitIcon  = () => document.getElementById('submitBtnIcon');
  const submitText  = () => document.getElementById('submitBtnText');
  const progressWrap= () => document.getElementById('progressWrap');
  const progressBar = () => document.getElementById('progressBar');
  const progressText= () => document.getElementById('progressText');
  const tagsHidden  = () => document.getElementById('tagsHidden');
  const tagChips    = () => document.getElementById('tagChips');
  const tagInput    = () => document.getElementById('tagInput');
  const titleInput  = () => document.getElementById('titleInput');
  const descInput   = () => document.getElementById('descInput');
  const titleCount  = () => document.getElementById('titleCount');
  const descCount   = () => document.getElementById('descCount');

  // ─── File Handling ──────────────────────────────────────────────────────

  function setFile(file) {
    if (!file) return;

    const allowed = ['image/jpeg','image/jpg','image/png','image/webp','image/gif','image/avif'];
    if (!allowed.includes(file.type)) {
      Toast.error('Invalid file type. Use JPEG, PNG, WebP, GIF, or AVIF.');
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      Toast.error('File too large. Maximum size is 15MB.');
      return;
    }

    selectedFile = file;

    // Preview
    const reader = new FileReader();
    reader.onload = (e) => {
      previewImg().src = e.target.result;
    };
    reader.readAsDataURL(file);

    zone()?.classList.add('hidden');
    previewWrap()?.classList.remove('hidden');

    if (fileNameEl()) fileNameEl().textContent = file.name;
    if (fileSizeEl()) fileSizeEl().textContent = formatFileSize(file.size);

    enableSubmit(true);
  }

  function clearFile() {
    selectedFile = null;
    if (previewImg()) previewImg().src = '';
    if (fileInput()) fileInput().value = '';
    previewWrap()?.classList.add('hidden');
    zone()?.classList.remove('hidden');
    enableSubmit(false);
  }

  function enableSubmit(enabled) {
    const btn = submitBtn();
    if (!btn) return;
    btn.disabled = !enabled;
    btn.style.opacity = enabled ? '1' : '0.5';
  }

  // ─── Drag & Drop ─────────────────────────────────────────────────────────

  function initDragDrop() {
    const z = zone();
    if (!z) return;

    // Click to open file picker
    z.addEventListener('click', () => fileInput()?.click());
    z.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') fileInput()?.click();
    });

    z.addEventListener('dragenter', (e) => { e.preventDefault(); z.classList.add('drag-over'); });
    z.addEventListener('dragover',  (e) => { e.preventDefault(); z.classList.add('drag-over'); });
    z.addEventListener('dragleave', (e) => {
      if (!z.contains(e.relatedTarget)) z.classList.remove('drag-over');
    });
    z.addEventListener('drop', (e) => {
      e.preventDefault();
      z.classList.remove('drag-over');
      const file = e.dataTransfer?.files?.[0];
      if (file) setFile(file);
    });

    fileInput()?.addEventListener('change', (e) => {
      const file = e.target.files?.[0];
      if (file) setFile(file);
    });

    document.getElementById('removeFile')?.addEventListener('click', clearFile);
  }

  // ─── Tag Chips ───────────────────────────────────────────────────────────

  function addTag(raw) {
    const value = raw.trim().toLowerCase().replace(/[^a-z0-9\-_]/g, '').slice(0, 30);
    if (!value || tags.includes(value) || tags.length >= 10) return;
    tags.push(value);
    renderChips();
    syncTagsHidden();
  }

  function removeTag(value) {
    tags = tags.filter((t) => t !== value);
    renderChips();
    syncTagsHidden();
  }

  function renderChips() {
    const container = tagChips();
    if (!container) return;
    container.innerHTML = tags.map((t) => `
      <span class="tag-chip">
        #${escapeHtml(t)}
        <button type="button" data-tag="${escapeHtml(t)}" aria-label="Remove tag ${t}">×</button>
      </span>
    `).join('');

    container.querySelectorAll('button[data-tag]').forEach((btn) => {
      btn.addEventListener('click', () => removeTag(btn.dataset.tag));
    });
  }

  function syncTagsHidden() {
    const el = tagsHidden();
    if (el) el.value = tags.join(',');
  }

  function initTagInput() {
    const input = tagInput();
    if (!input) return;

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ',') {
        e.preventDefault();
        addTag(input.value);
        input.value = '';
      } else if (e.key === 'Backspace' && input.value === '' && tags.length > 0) {
        removeTag(tags[tags.length - 1]);
      }
    });

    input.addEventListener('blur', () => {
      if (input.value.trim()) {
        addTag(input.value);
        input.value = '';
      }
    });
  }

  // ─── Character Counters ───────────────────────────────────────────────────

  function initCounters() {
    const title = titleInput();
    const desc  = descInput();
    const tc    = titleCount();
    const dc    = descCount();

    title?.addEventListener('input', () => {
      if (tc) tc.textContent = `${title.value.length}/100`;
    });
    desc?.addEventListener('input', () => {
      if (dc) dc.textContent = `${desc.value.length}/500`;
    });
  }

  // ─── XHR Upload with Progress ─────────────────────────────────────────────

  function uploadWithProgress(formData) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (e) => {
        if (!e.lengthComputable) return;
        const pct = Math.round((e.loaded / e.total) * 90);
        setProgress(pct, `Uploading… ${pct}%`);
      });

      xhr.addEventListener('load', () => {
        setProgress(100, 'Processing…');
        try {
          const data = JSON.parse(xhr.responseText);
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(data);
          } else {
            reject(new Error(data.message || `Upload failed (${xhr.status})`));
          }
        } catch {
          reject(new Error('Invalid server response.'));
        }
      });

      xhr.addEventListener('error', () => reject(new Error('Network error during upload.')));
      xhr.addEventListener('abort', () => reject(new Error('Upload cancelled.')));

      xhr.open('POST', `${window.API_BASE}/images/upload`);
      xhr.send(formData);
    });
  }

  function setProgress(pct, text) {
    const bar  = progressBar();
    const txt  = progressText();
    if (bar) bar.style.width = `${pct}%`;
    if (txt) txt.textContent = text;
  }

  // ─── Form Submit ─────────────────────────────────────────────────────────

  function initForm() {
    const form = document.getElementById('uploadForm');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      if (!selectedFile) {
        Toast.error('Please select an image to upload.');
        return;
      }

      // Build FormData
      const fd = new FormData();
      fd.append('image', selectedFile);
      fd.append('title',       (titleInput()?.value || '').trim().slice(0, 100));
      fd.append('description', (descInput()?.value  || '').trim().slice(0, 500));
      fd.append('tags',        tags.join(','));

      // UI: uploading state
      enableSubmit(false);
      if (submitIcon()) submitIcon().textContent = '⏳';
      if (submitText()) submitText().textContent = 'Uploading…';
      progressWrap()?.classList.remove('hidden');
      setProgress(0, 'Starting upload…');

      try {
        await uploadWithProgress(fd);

        setProgress(100, 'Upload complete!');
        setTimeout(() => {
          document.getElementById('successOverlay')?.classList.add('open');
        }, 500);

      } catch (err) {
        Toast.error(err.message || 'Upload failed. Please try again.');
        progressWrap()?.classList.add('hidden');
        enableSubmit(true);
        if (submitIcon()) submitIcon().textContent = '📤';
        if (submitText()) submitText().textContent = 'Upload Photo';
      }
    });

    // Reset button
    document.getElementById('resetBtn')?.addEventListener('click', resetForm);

    // Upload Another (success overlay)
    document.getElementById('uploadAnother')?.addEventListener('click', () => {
      document.getElementById('successOverlay')?.classList.remove('open');
      resetForm();
    });
  }

  function resetForm() {
    clearFile();
    tags = [];
    renderChips();
    syncTagsHidden();
    progressWrap()?.classList.add('hidden');
    setProgress(0, '');
    if (titleInput()) titleInput().value = '';
    if (descInput())  descInput().value  = '';
    if (tagInput())   tagInput().value   = '';
    if (titleCount()) titleCount().textContent = '0/100';
    if (descCount())  descCount().textContent  = '0/500';
    if (submitIcon()) submitIcon().textContent = '📤';
    if (submitText()) submitText().textContent = 'Upload Photo';
  }

  // ─── Init ─────────────────────────────────────────────────────────────────

  function init() {
    initDragDrop();
    initTagInput();
    initCounters();
    initForm();

    // Paste image
    document.addEventListener('paste', (e) => {
      const file = Array.from(e.clipboardData?.items || [])
        .find((item) => item.type.startsWith('image/'))
        ?.getAsFile();
      if (file) setFile(file);
    });
  }

  return { init };
})();

window.Upload = Upload;
