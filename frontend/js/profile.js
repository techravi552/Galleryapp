/**
 * RAVI GALLERY — PROFILE MODULE
 * Load/display profile, inline edit, avatar upload,
 * aggregated photo stats.
 */

const Profile = (() => {
  let profileData = null;

  // ─── Load Profile ─────────────────────────────────────────────────────────

  async function loadProfile() {
    try {
      const res = await ProfileAPI.get();
      profileData = res.data;
      renderProfile(profileData);

      // Load stats from images
      loadStats();
    } catch (err) {
      Toast.error('Failed to load profile.');
    }
  }

  async function loadStats() {
    try {
      // Fetch all images to compute aggregates
      let totalPhotos   = 0;
      let totalLikes    = 0;
      let totalComments = 0;
      let page = 1;
      let hasMore = true;

      // Cap at 5 pages (250 images) for stat aggregation
      while (hasMore && page <= 5) {
        const res = await ImagesAPI.getAll({ page, limit: 50 });
        const images = res.data || [];
        totalPhotos += images.length;
        totalLikes    += images.reduce((sum, img) => sum + (img.likes || 0), 0);
        totalComments += images.reduce((sum, img) => sum + (img.comments?.length || 0), 0);
        hasMore = res.pagination?.hasMore || false;
        page++;
      }

      // Update stats
      const statPhotos   = document.getElementById('statPhotos');
      const statLikes    = document.getElementById('statLikes');
      const statComments = document.getElementById('statComments');
      if (statPhotos)   statPhotos.textContent   = formatNumber(totalPhotos);
      if (statLikes)    statLikes.textContent     = formatNumber(totalLikes);
      if (statComments) statComments.textContent  = formatNumber(totalComments);
    } catch {
      // Non-critical — silently ignore
    }
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  function renderProfile(data) {
    if (!data) return;

    document.getElementById('profileSkeleton')?.classList.add('hidden');
    document.getElementById('profileHeader')?.classList.remove('hidden');

    // Name & Bio
    const nameEl = document.getElementById('profileName');
    const bioEl  = document.getElementById('profileBio');
    if (nameEl) nameEl.textContent = data.name || 'Ravi';
    if (bioEl)  bioEl.textContent  = data.bio  || '';

    // Avatar
    renderAvatar(data.avatar, data.name);

    // Location
    const locEl = document.getElementById('profileLocation');
    if (locEl) {
      if (data.location) {
        locEl.style.display = '';
        locEl.querySelector('span').textContent = data.location;
      } else {
        locEl.style.display = 'none';
      }
    }

    // Website
    const webEl = document.getElementById('profileWebsite');
    if (webEl) {
      if (data.website) {
        webEl.style.display = '';
        webEl.href = data.website;
        webEl.querySelector('span').textContent = data.website.replace(/^https?:\/\//, '');
      } else {
        webEl.style.display = 'none';
      }
    }

    // Social links
    renderSocialLinks(data.socialLinks || {});
  }

  function renderAvatar(avatarUrl, name) {
    const container = document.getElementById('avatarContainer');
    if (!container) return;

    if (avatarUrl) {
      container.innerHTML = `
        <img
          class="avatar"
          src="${escapeHtml(avatarUrl)}"
          alt="Profile avatar"
          loading="lazy"
          decoding="async"
        />
      `;
    } else {
      const initial = (name || 'R')[0].toUpperCase();
      container.innerHTML = `<div class="avatar-placeholder">${initial}</div>`;
    }
  }

  function renderSocialLinks(links) {
    const container = document.getElementById('socialLinks');
    if (!container) return;

    const socials = [
      { key: 'instagram', icon: '📷', label: 'Instagram', base: 'https://instagram.com/' },
      { key: 'twitter',   icon: '🐦', label: 'Twitter',   base: 'https://twitter.com/'   },
      { key: 'linkedin',  icon: '💼', label: 'LinkedIn',  base: ''                        },
    ];

    container.innerHTML = socials
      .filter((s) => links[s.key])
      .map((s) => {
        const href = links[s.key].startsWith('http') ? links[s.key] : `${s.base}${links[s.key]}`;
        return `
          <a
            href="${escapeHtml(href)}"
            target="_blank"
            rel="noopener noreferrer"
            class="btn btn-ghost"
            style="padding:8px 14px;font-size:0.85rem"
            aria-label="${s.label}"
            title="${s.label}"
          >
            ${s.icon} ${escapeHtml(links[s.key])}
          </a>
        `;
      })
      .join('');
  }

  // ─── Edit Form ────────────────────────────────────────────────────────────

  function openEditForm() {
    if (!profileData) return;

    // Populate fields
    const fields = {
      editName:      profileData.name || '',
      editBio:       profileData.bio  || '',
      editLocation:  profileData.location || '',
      editWebsite:   profileData.website  || '',
      editInstagram: profileData.socialLinks?.instagram || '',
      editTwitter:   profileData.socialLinks?.twitter   || '',
      editLinkedin:  profileData.socialLinks?.linkedin  || '',
    };

    Object.entries(fields).forEach(([id, val]) => {
      const el = document.getElementById(id);
      if (el) el.value = val;
    });

    // Bio counter
    const bioCount = document.getElementById('bioCount');
    if (bioCount) bioCount.textContent = `${(profileData.bio || '').length}/300`;

    document.getElementById('editProfileForm')?.classList.remove('hidden');
    document.getElementById('editProfileBtn')?.classList.add('hidden');
    document.getElementById('editName')?.focus();
  }

  function closeEditForm() {
    document.getElementById('editProfileForm')?.classList.add('hidden');
    document.getElementById('editProfileBtn')?.classList.remove('hidden');
  }

  async function submitEditForm(e) {
    e.preventDefault();

    const saveBtn  = document.getElementById('saveProfileBtn');
    const saveIcon = document.getElementById('saveIcon');
    const saveText = document.getElementById('saveText');

    if (saveBtn)  saveBtn.disabled = true;
    if (saveIcon) saveIcon.textContent = '⏳';
    if (saveText) saveText.textContent = 'Saving…';

    try {
      const body = {
        name:     document.getElementById('editName')?.value.trim()     || '',
        bio:      document.getElementById('editBio')?.value.trim()      || '',
        location: document.getElementById('editLocation')?.value.trim() || '',
        website:  document.getElementById('editWebsite')?.value.trim()  || '',
        socialLinks: {
          instagram: document.getElementById('editInstagram')?.value.trim() || '',
          twitter:   document.getElementById('editTwitter')?.value.trim()   || '',
          linkedin:  document.getElementById('editLinkedin')?.value.trim()  || '',
        },
      };

      const res = await ProfileAPI.update(body);
      profileData = res.data;
      renderProfile(profileData);
      closeEditForm();
      Toast.success('Profile updated!');
    } catch (err) {
      Toast.error(err.message || 'Failed to update profile.');
    } finally {
      if (saveBtn)  saveBtn.disabled = false;
      if (saveIcon) saveIcon.textContent = '💾';
      if (saveText) saveText.textContent = 'Save Profile';
    }
  }

  // ─── Avatar Upload ────────────────────────────────────────────────────────

  function initAvatarUpload() {
    const editBtn   = document.getElementById('avatarEditBtn');
    const fileInput = document.getElementById('avatarInput');
    if (!editBtn || !fileInput) return;

    editBtn.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (!file.type.startsWith('image/')) {
        Toast.error('Please select an image file.');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        Toast.error('Avatar must be under 5MB.');
        return;
      }

      // Optimistic preview
      const reader = new FileReader();
      reader.onload = (ev) => {
        const container = document.getElementById('avatarContainer');
        if (container) {
          container.innerHTML = `<img class="avatar" src="${ev.target.result}" alt="Avatar preview" />`;
        }
      };
      reader.readAsDataURL(file);

      const fd = new FormData();
      fd.append('avatar', file);

      try {
        const res = await ProfileAPI.update(fd);
        profileData = res.data;
        renderAvatar(profileData.avatar, profileData.name);
        Toast.success('Avatar updated!');
      } catch (err) {
        Toast.error(err.message || 'Avatar upload failed.');
        // Restore old avatar
        renderAvatar(profileData?.avatar, profileData?.name);
      }

      fileInput.value = '';
    });
  }

  // ─── Bio Counter ──────────────────────────────────────────────────────────

  function initBioCounter() {
    const bioEl  = document.getElementById('editBio');
    const bioCount = document.getElementById('bioCount');
    if (!bioEl || !bioCount) return;
    bioEl.addEventListener('input', () => {
      bioCount.textContent = `${bioEl.value.length}/300`;
    });
  }

  // ─── Init ─────────────────────────────────────────────────────────────────

  function init() {
    loadProfile();
    initAvatarUpload();
    initBioCounter();

    document.getElementById('editProfileBtn')?.addEventListener('click', openEditForm);
    document.getElementById('cancelEditBtn')?.addEventListener('click', closeEditForm);
    document.getElementById('profileForm')?.addEventListener('submit', submitEditForm);
  }

  return { init };
})();

window.Profile = Profile;
