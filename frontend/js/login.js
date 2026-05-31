/**
 * RAVI GALLERY — LOGIN PAGE SCRIPT
 * Handles form submit, show/hide password, validation, redirect.
 */

(function () {
  'use strict';

  const LOGIN_PAGE = '/login.html';
  const HOME_PAGE  = '/index.html';
  const CREDENTIALS = {
    email:    'ravikumkum@gmail.com',
    password: 'ravikumkum@1207',
  };

  // If already logged in → go home immediately
  if (localStorage.getItem('isLoggedIn') === 'true') {
    window.location.replace(HOME_PAGE);
  }

  document.addEventListener('DOMContentLoaded', () => {
    const form        = document.getElementById('loginForm');
    const emailInput  = document.getElementById('loginEmail');
    const passInput   = document.getElementById('loginPassword');
    const togglePass  = document.getElementById('togglePassword');
    const submitBtn   = document.getElementById('loginBtn');
    const errorBox    = document.getElementById('loginError');
    const errorText   = document.getElementById('loginErrorText');
    const btnText     = document.getElementById('loginBtnText');
    const btnSpinner  = document.getElementById('loginBtnSpinner');

    // ── Show / Hide password ──────────────────────────────────────────────
    togglePass?.addEventListener('click', () => {
      const isText = passInput.type === 'text';
      passInput.type = isText ? 'password' : 'text';
      togglePass.textContent = isText ? '👁️' : '🙈';
      togglePass.setAttribute('aria-label', isText ? 'Show password' : 'Hide password');
    });

    // ── Clear error on input ──────────────────────────────────────────────
    [emailInput, passInput].forEach((el) => {
      el?.addEventListener('input', () => hideError());
    });

    // ── Form submit ───────────────────────────────────────────────────────
    form?.addEventListener('submit', async (e) => {
      e.preventDefault();

      const email    = emailInput.value.trim();
      const password = passInput.value;

      // Basic validation
      if (!email) {
        showError('Please enter your email address.');
        emailInput.focus();
        return;
      }
      if (!isValidEmail(email)) {
        showError('Please enter a valid email address.');
        emailInput.focus();
        return;
      }
      if (!password) {
        showError('Please enter your password.');
        passInput.focus();
        return;
      }

      // Loading state
      setLoading(true);

      // Simulate short network delay for UX (feels real)
      await delay(800);

      // Check credentials
      if (
        email.toLowerCase() === CREDENTIALS.email.toLowerCase() &&
        password === CREDENTIALS.password
      ) {
        // ✅ Success
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('userEmail', CREDENTIALS.email);

        // Flash success
        submitBtn.style.background = 'linear-gradient(135deg,#22c55e,#16a34a)';
        if (btnText) btnText.textContent = 'Welcome back! ✓';

        // Redirect to saved destination or home
        const redirect = sessionStorage.getItem('rg_redirect');
        sessionStorage.removeItem('rg_redirect');

        setTimeout(() => {
          window.location.replace(redirect && !redirect.includes('login') ? redirect : HOME_PAGE);
        }, 600);

      } else {
        // ❌ Wrong credentials
        setLoading(false);

        // Determine which field is wrong for a better message
        const emailMatch = email.toLowerCase() === CREDENTIALS.email.toLowerCase();
        const msg = emailMatch
          ? 'Incorrect password. Please try again.'
          : 'No account found with that email address.';

        showError(msg);

        // Shake animation on card
        const card = document.querySelector('.login-card');
        card?.classList.add('shake');
        setTimeout(() => card?.classList.remove('shake'), 500);

        // Clear password, focus
        passInput.value = '';
        passInput.focus();
      }
    });

    // ── Helpers ───────────────────────────────────────────────────────────

    function showError(msg) {
      if (errorText) errorText.textContent = msg;
      errorBox?.classList.remove('hidden');
      errorBox?.classList.add('show');
    }

    function hideError() {
      errorBox?.classList.remove('show');
      setTimeout(() => errorBox?.classList.add('hidden'), 200);
    }

    function setLoading(on) {
      submitBtn.disabled = on;
      if (btnText)    btnText.textContent = on ? 'Signing in…' : 'Sign In';
      if (btnSpinner) btnSpinner.classList.toggle('hidden', !on);
    }

    function isValidEmail(email) {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    function delay(ms) {
      return new Promise((res) => setTimeout(res, ms));
    }
  });

})();
