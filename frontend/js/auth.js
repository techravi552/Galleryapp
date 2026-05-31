/**
 * RAVI GALLERY — AUTH GUARD + LOGOUT
 * Loaded as FIRST script on every protected page.
 * • Immediately redirects to login if not authenticated (no flash)
 * • Injects logout button into desktop nav + mobile drawer
 */

(function () {
  'use strict';

  const LOGIN_PAGE  = '/login.html';
  const HOME_PAGE   = '/index.html';
  const CREDENTIALS = {
    email:    'ravikumkum@gmail.com',
    password: 'ravikumkum@1207',
  };
  const PUBLIC_PAGES = ['/login.html', '/login'];

  /* ── helpers ─────────────────────────────────────────── */

  function isPublicPage() {
    const p = window.location.pathname;
    return PUBLIC_PAGES.some((pub) => p === pub || p.endsWith(pub));
  }

  function isLoggedIn() {
    return localStorage.getItem('isLoggedIn') === 'true';
  }

  function getEmail() {
    return localStorage.getItem('userEmail') || '';
  }

  /* ── LOGOUT ──────────────────────────────────────────── */

  function logout() {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userEmail');
    window.location.href = LOGIN_PAGE;
  }

  /* ── GUARD — runs immediately, before DOM ────────────── */

  if (!isPublicPage() && !isLoggedIn()) {
    sessionStorage.setItem('rg_redirect', window.location.href);
    window.location.replace(LOGIN_PAGE);
    // Stop all further execution on this page
  }

  /* ── INJECT LOGOUT UI — after DOM ready ──────────────── */

  function buildLogoutBtn(forDrawer) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.setAttribute('aria-label', 'Logout');

    if (forDrawer) {
      /* ── Mobile drawer button ── */
      btn.className = 'nav-drawer__link';
      btn.style.cssText = [
        'width:100%',
        'text-align:left',
        'color:#f43f5e',
        'border:none',
        'background:none',
        'cursor:pointer',
        'font-family:inherit',
        'font-size:1.1rem',
        'font-weight:500',
        'display:flex',
        'align-items:center',
        'gap:12px',
        'padding:12px 16px',
        'border-radius:14px',
        'transition:background 150ms',
      ].join(';');
      btn.innerHTML = '<span class="icon" style="font-size:1.3rem;width:28px;text-align:center">🚪</span> Logout';
      btn.addEventListener('mouseenter', () => { btn.style.background = 'rgba(244,63,94,0.1)'; });
      btn.addEventListener('mouseleave', () => { btn.style.background = 'none'; });
    } else {
      /* ── Desktop nav button ── */
      btn.style.cssText = [
        'display:flex',
        'align-items:center',
        'gap:6px',
        'padding:7px 16px',
        'border-radius:9999px',
        'font-size:0.82rem',
        'font-weight:500',
        'font-family:inherit',
        'cursor:pointer',
        'color:#f43f5e',
        'background:rgba(244,63,94,0.08)',
        'border:1px solid rgba(244,63,94,0.25)',
        'transition:background 150ms,transform 150ms',
        'white-space:nowrap',
      ].join(';');
      btn.innerHTML = '🚪&nbsp;Logout';
      btn.addEventListener('mouseenter', () => {
        btn.style.background = 'rgba(244,63,94,0.18)';
        btn.style.transform = 'translateY(-1px)';
      });
      btn.addEventListener('mouseleave', () => {
        btn.style.background = 'rgba(244,63,94,0.08)';
        btn.style.transform = 'translateY(0)';
      });
    }

    btn.addEventListener('click', logout);
    return btn;
  }

  function injectLogoutUI() {
    if (!isLoggedIn()) return;

    /* ── 1. Desktop nav bar ─────────────────────────────── */
    const navActions = document.querySelector('.nav__actions');
    if (navActions && !navActions.querySelector('[data-logout]')) {
      const btn = buildLogoutBtn(false);
      btn.setAttribute('data-logout', 'desktop');

      // Hide on mobile (hamburger handles it), show on desktop
      function syncDesktopVisibility() {
        btn.style.display = window.innerWidth >= 768 ? 'flex' : 'none';
      }
      syncDesktopVisibility();
      window.addEventListener('resize', syncDesktopVisibility);

      // Insert before theme toggle (or before hamburger)
      const themeBtn = document.getElementById('themeToggle');
      if (themeBtn) {
        navActions.insertBefore(btn, themeBtn);
      } else {
        const hamburger = document.getElementById('hamburger');
        hamburger ? navActions.insertBefore(btn, hamburger) : navActions.appendChild(btn);
      }
    }

    /* ── 2. Mobile drawer ───────────────────────────────── */
    const drawer = document.getElementById('navDrawer');
    if (drawer && !drawer.querySelector('[data-logout]')) {
      // Separator
      const hr = document.createElement('div');
      hr.style.cssText = [
        'margin-top:auto',
        'padding-top:16px',
        'border-top:1px solid rgba(255,255,255,0.08)',
      ].join(';');

      // Email label
      const emailLabel = document.createElement('p');
      emailLabel.style.cssText = [
        'font-size:0.72rem',
        'color:rgba(92,89,110,0.9)',
        'padding:0 16px 8px',
        'font-family:monospace',
        'overflow:hidden',
        'text-overflow:ellipsis',
        'white-space:nowrap',
        'letter-spacing:0.02em',
      ].join(';');
      emailLabel.textContent = '👤 ' + getEmail();

      const btn = buildLogoutBtn(true);
      btn.setAttribute('data-logout', 'mobile');

      hr.appendChild(emailLabel);
      hr.appendChild(btn);
      drawer.appendChild(hr);
    }
  }

  /* ── PUBLIC API ──────────────────────────────────────── */

  const Auth = {
    isLoggedIn,
    getEmail,
    logout,

    login(email, password) {
      const match =
        email.trim().toLowerCase() === CREDENTIALS.email.toLowerCase() &&
        password === CREDENTIALS.password;
      if (match) {
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('userEmail', CREDENTIALS.email);
      }
      return match;
    },

    // Called by app.js after Nav.init() so nav DOM exists
    init() {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', injectLogoutUI);
      } else {
        injectLogoutUI();
      }
    },
  };

  window.Auth = Auth;

})();
