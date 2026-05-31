/**
 * RAVI GALLERY — PWA MODULE
 * Service Worker registration + install prompt banner.
 */

const PWA = (() => {
  let deferredPrompt = null;

  function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/service-worker.js')
          .then((reg) => {
            console.log('[PWA] Service Worker registered:', reg.scope);

            // Check for updates
            reg.addEventListener('updatefound', () => {
              const newWorker = reg.installing;
              newWorker?.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  Toast.info('New version available. Refresh to update.');
                }
              });
            });
          })
          .catch((err) => {
            console.warn('[PWA] SW registration failed:', err);
          });
      });
    }
  }

  function initInstallBanner() {
    const banner    = document.getElementById('pwaBanner');
    const installBtn = document.getElementById('pwaInstall');
    const dismissBtn = document.getElementById('pwaDismiss');
    if (!banner) return;

    // Already dismissed
    if (localStorage.getItem('rg_pwa_dismissed') === '1') return;

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;

      // Show banner after 3s
      setTimeout(() => banner.classList.add('show'), 3000);
    });

    installBtn?.addEventListener('click', async () => {
      if (!deferredPrompt) return;
      banner.classList.remove('show');
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log('[PWA] Install outcome:', outcome);
      deferredPrompt = null;
    });

    dismissBtn?.addEventListener('click', () => {
      banner.classList.remove('show');
      localStorage.setItem('rg_pwa_dismissed', '1');
    });

    // If already installed
    window.addEventListener('appinstalled', () => {
      banner.classList.remove('show');
      deferredPrompt = null;
      Toast.success('Ravi Gallery installed!');
    });
  }

  function init() {
    registerServiceWorker();
    initInstallBanner();
  }

  return { init };
})();

window.PWA = PWA;
