/**
 * ============================================================================
 * Sandy — Shared Profile Avatar Dropdown, Auth Sync & Layout Preferences Engine
 * ============================================================================
 * Replaces Sign In / Sign Up buttons with a circular Profile Picture (PFP)
 * dropdown menu across all pages (index.html, Interface.html, example.html,
 * profile.html) and applies user-chosen layout & theme preferences.
 */
(function () {
  // 1. Inject Cyberpunk Night City Profile Dropdown CSS
  const style = document.createElement('style');
  style.textContent = `
    .sandy-pfp-wrap {
      position: relative;
      display: inline-flex;
      align-items: center;
    }
    .sandy-pfp-btn {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      padding: 0;
      border: 2px solid rgba(0, 240, 255, 0.72);
      background: linear-gradient(135deg, rgba(0, 240, 255, 0.22), rgba(255, 0, 127, 0.22));
      color: #F8FAFC;
      font-family: 'Rajdhani', sans-serif;
      font-weight: 700;
      font-size: 1rem;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      cursor: pointer;
      box-shadow: 0 0 16px rgba(0, 240, 255, 0.28);
      transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
    }
    .sandy-pfp-btn:hover {
      transform: scale(1.06);
      border-color: #00F0FF;
      box-shadow: 0 0 22px rgba(0, 240, 255, 0.52);
    }
    .sandy-pfp-btn img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }
    .sandy-pfp-menu {
      position: absolute;
      top: calc(100% + 10px);
      right: 0;
      min-width: 245px;
      background: rgba(10, 15, 30, 0.96);
      backdrop-filter: blur(22px) saturate(180%);
      -webkit-backdrop-filter: blur(22px) saturate(180%);
      border: 1px solid rgba(0, 240, 255, 0.32);
      border-radius: 16px;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.8), 0 0 24px rgba(0, 240, 255, 0.14);
      padding: 0.55rem;
      z-index: 10000;
      display: none;
    }
    .sandy-pfp-menu.open {
      display: block;
      animation: sandyDropIn 0.18s cubic-bezier(0.22, 1, 0.36, 1);
    }
    @keyframes sandyDropIn {
      from { opacity: 0; transform: translateY(-6px) scale(0.97); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }
    .sandy-pfp-header {
      padding: 0.55rem 0.7rem 0.65rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      margin-bottom: 0.35rem;
    }
    .sandy-pfp-name {
      color: #F8FAFC;
      font-weight: 700;
      font-size: 0.92rem;
      line-height: 1.25;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .sandy-pfp-handle {
      color: #00F0FF;
      font-family: 'Share Tech Mono', monospace;
      font-size: 0.74rem;
    }
    .sandy-pfp-item {
      display: flex;
      align-items: center;
      gap: 0.65rem;
      width: 100%;
      padding: 0.55rem 0.75rem;
      border-radius: 10px;
      color: #E2E8F0 !important;
      text-decoration: none !important;
      font-size: 0.85rem;
      font-weight: 500;
      background: transparent;
      border: none;
      cursor: pointer;
      text-align: left;
      transition: background 0.16s ease, color 0.16s ease;
    }
    .sandy-pfp-item:hover {
      background: rgba(0, 240, 255, 0.12);
      color: #FFFFFF !important;
    }
    .sandy-pfp-item i {
      font-size: 1rem;
      width: 18px;
      text-align: center;
      color: #00F0FF;
    }
    .sandy-pfp-divider {
      height: 1px;
      background: rgba(255, 255, 255, 0.1);
      margin: 0.4rem 0.3rem;
    }
    .sandy-pfp-signout {
      color: #FF2A6D !important;
      font-weight: 600;
    }
    .sandy-pfp-signout i {
      color: #FF2A6D !important;
    }
    .sandy-pfp-signout:hover {
      background: rgba(255, 42, 109, 0.16) !important;
      color: #FF5C8D !important;
    }

    /* User-Configurable Web Layout Preferences */
    body.sandy-layout-compact main {
      max-width: 1180px;
      margin-inline: auto;
    }
    body.sandy-layout-wide main {
      max-width: 100%;
    }
    body.sandy-accent-magenta {
      --cyber-cyan: #FF007F;
      --cyan: #FF007F;
    }
    body.sandy-accent-gold {
      --cyber-cyan: #FFE600;
      --cyan: #FFE600;
    }
    body.sandy-no-particles #particleRodCanvas,
    body.sandy-no-particles #bgCanvas {
      display: none !important;
    }
  `;
  document.head.appendChild(style);

  // 2. Apply Saved Web Layout & Accent Preferences
  function applyLayoutPreferences() {
    try {
      const prefs = JSON.parse(localStorage.getItem('sandy_layout_prefs') || '{}');
      document.body.classList.remove(
        'sandy-layout-compact',
        'sandy-layout-wide',
        'sandy-accent-magenta',
        'sandy-accent-gold',
        'sandy-no-particles'
      );
      if (prefs.density === 'compact') document.body.classList.add('sandy-layout-compact');
      if (prefs.density === 'wide') document.body.classList.add('sandy-layout-wide');
      if (prefs.accent === 'magenta') document.body.classList.add('sandy-accent-magenta');
      if (prefs.accent === 'gold') document.body.classList.add('sandy-accent-gold');
      if (prefs.particles === false) document.body.classList.add('sandy-no-particles');
    } catch (_) {}
  }

  function getCachedProfile() {
    try {
      return JSON.parse(localStorage.getItem('sandy_user_profile') || '{}');
    } catch (_) {
      return {};
    }
  }

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function sanitizeImageUrl(url) {
    const s = String(url || '').trim();
    if (!s) return '';
    if (s.startsWith('https://') || s.startsWith('http://') || s.startsWith('data:image/')) {
      return escapeHtml(s);
    }
    return '';
  }

  function buildProfileDropdown(user, profileData) {
    const rawDisplay = (profileData && profileData.displayName) || (user && user.displayName) || (user && user.email ? user.email.split('@')[0] : 'Sandy User');
    const rawUser = (profileData && profileData.username) || (user && user.email ? user.email.split('@')[0] : 'user');
    const displayName = escapeHtml(rawDisplay);
    const username = escapeHtml(rawUser.startsWith('@') ? rawUser : '@' + rawUser);
    const photoUrl = sanitizeImageUrl((profileData && profileData.photoURL) || (user && user.photoURL) || '');
    const initials = escapeHtml(rawDisplay.trim().slice(0, 2).toUpperCase() || 'SY');

    const wrap = document.createElement('div');
    wrap.className = 'sandy-pfp-wrap';
    wrap.id = 'sandyPfpMenuWrap';

    wrap.innerHTML = `
      <button type="button" class="sandy-pfp-btn" id="sandyPfpToggleBtn" aria-label="Open profile menu" title="${displayName}">
        ${photoUrl ? `<img src="${photoUrl}" alt="${displayName}" />` : `<span>${initials}</span>`}
      </button>
      <div class="sandy-pfp-menu" id="sandyPfpDropdown" role="menu">
        <div class="sandy-pfp-header">
          <div class="sandy-pfp-name">${displayName}</div>
          <div class="sandy-pfp-handle">${username}</div>
        </div>
        <a href="profile.html#profile" class="sandy-pfp-item" role="menuitem">
          <i class="bi bi-person-circle"></i>
          <span>Profile</span>
        </a>
        <a href="analytics.html" class="sandy-pfp-item" role="menuitem">
          <i class="bi bi-pie-chart-fill"></i>
          <span>Result Analyze</span>
        </a>
        <a href="ai-chat.html" class="sandy-pfp-item" role="menuitem">
          <i class="bi bi-stars"></i>
          <span>AI Coach Chat</span>
        </a>
        <a href="profile.html#statistics" class="sandy-pfp-item" role="menuitem">
          <i class="bi bi-bar-chart-line"></i>
          <span>Statistics</span>
        </a>
        <a href="profile.html#settings" class="sandy-pfp-item" role="menuitem">
          <i class="bi bi-sliders"></i>
          <span>Settings &amp; Layout</span>
        </a>
        <a href="profile.html#security" class="sandy-pfp-item" role="menuitem">
          <i class="bi bi-shield-lock"></i>
          <span>Security &amp; 2FA</span>
        </a>
        <div class="sandy-pfp-divider"></div>
        <button type="button" class="sandy-pfp-item sandy-pfp-signout" id="sandyDropdownSignOutBtn" role="menuitem">
          <i class="bi bi-box-arrow-right"></i>
          <span>Sign Out</span>
        </button>
      </div>
    `;

    const toggleBtn = wrap.querySelector('#sandyPfpToggleBtn');
    const menu = wrap.querySelector('#sandyPfpDropdown');
    const signOutBtn = wrap.querySelector('#sandyDropdownSignOutBtn');

    toggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      menu.classList.toggle('open');
    });

    document.addEventListener('click', (e) => {
      if (!wrap.contains(e.target)) {
        menu.classList.remove('open');
      }
    });

    signOutBtn.addEventListener('click', async () => {
      try {
        if (typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length) {
          await firebase.auth().signOut();
        }
      } catch (_) {}
      localStorage.removeItem('sandy_user_profile');
      window.location.href = 'index.html';
    });

    return wrap;
  }

  // 1B. OS Detection (Apple iOS/macOS allowed on Web; Windows/Android/Linux use Native App)
  function detectOS() {
    const ua = navigator.userAgent || '';
    const platform = navigator.platform || '';
    if (/android/i.test(ua)) return 'android';
    if (/iPad|iPhone|iPod/.test(ua) || (platform === 'MacIntel' && navigator.maxTouchPoints > 1)) return 'ios';
    if (/Mac/i.test(platform) || /Macintosh|Mac OS X/i.test(ua)) return 'macos';
    if (/Win/i.test(platform) || /Windows/i.test(ua)) return 'windows';
    return 'linux';
  }

  function isWebInterfaceAllowed() {
    // Allowed if running inside our native Windows/Android/Linux app shell OR on Apple iOS/macOS web
    if (window.SandyDesktop || window.SandyNativeApp) return true;
    const os = detectOS();
    return os === 'ios' || os === 'macos';
  }

  function enforcePlatformAppGate() {
    if (isWebInterfaceAllowed()) return;
    const page = (window.location.pathname || '').split('/').pop().toLowerCase();
    const webAppOnlyPages = ['interface.html', 'analytics.html', 'ai-chat.html'];
    if (!webAppOnlyPages.includes(page)) return;

    const os = detectOS();
    const osLabel = os === 'windows' ? 'Windows' : os === 'android' ? 'Android' : 'Linux';
    const osIcon = os === 'windows' ? 'bi-windows' : os === 'android' ? 'bi-android2' : 'bi-terminal';

    if (document.getElementById('sandyOsGateOverlay')) return;
    const gate = document.createElement('div');
    gate.id = 'sandyOsGateOverlay';
    gate.style.cssText = 'position:fixed; inset:0; z-index:10001; background:rgba(3,5,8,0.96); backdrop-filter:blur(16px); display:flex; align-items:center; justify-content:center; padding:1.25rem;';
    gate.innerHTML = `
      <div class="glass-card p-4 p-sm-5 text-center" style="max-width:500px; width:100%; border:1px solid rgba(0,240,255,0.5); box-shadow:0 24px 60px rgba(0,0,0,0.9);">
        <div class="mb-3">
          <span class="flow-badge flow-badge-cyan font-mono">
            <i class="bi ${osIcon}"></i>
            <span>${osLabel.toUpperCase()} DETECTED</span>
          </span>
        </div>
        <h3 class="fw-bold text-hi font-display mb-2">Use the Sandy App on ${osLabel}</h3>
        <p class="text-body-88 small mb-4">
          The web interface is reserved for Apple (iOS &amp; macOS) devices. On <strong>${osLabel}</strong>, please download the native Sandy app for full ESP32-S3, YOLOv5, and AI Coach performance!
        </p>
        <div class="d-grid gap-2">
          <a href="download.html" class="btn-neon-primary py-2 text-decoration-none">
            <i class="bi ${osIcon} me-1"></i>
            <span>Download Sandy for ${osLabel}</span>
          </a>
          <a href="example.html" class="btn-glass-secondary py-2 text-decoration-none">
            <i class="bi bi-activity text-neon-pink me-1"></i>
            <span>Try Web Biofeedback Demo</span>
          </a>
          <a href="index.html" class="btn-glass-subtle py-2 text-decoration-none small">
            <i class="bi bi-house-door me-1"></i>
            <span>Back to Home</span>
          </a>
        </div>
      </div>
    `;
    document.body.appendChild(gate);
    const mainEl = document.querySelector('main');
    if (mainEl) mainEl.style.display = 'none';
  }

  function updateInterfaceVisibilityForGuests(isSignedIn) {
    const canUseWebInterface = isWebInterfaceAllowed();
    // Hide Live Monitor / Result Analyze / AI Coach on non-Apple browsers OR when signed out
    document.querySelectorAll('a[href="Interface.html"], a[href*="Interface.html"], a[href="analytics.html"], a[href="ai-chat.html"]').forEach((link) => {
      const href = link.getAttribute('href') || '';
      if (href.startsWith('signin.html') || href.startsWith('signup.html')) return;
      link.style.display = (isSignedIn && canUseWebInterface) ? '' : 'none';
    });

    // Always highlight Download button on Windows / Android / Linux browsers
    document.querySelectorAll('a[href="download.html"]').forEach((dl) => {
      if (window.SandyDesktop || window.SandyNativeApp) {
        dl.style.display = 'none';
      } else {
        dl.style.display = '';
      }
    });
  }

  function renderNavAvatar(user, profileData) {
    updateInterfaceVisibilityForGuests(Boolean(user));

    // Support all page nav containers (index.html, Interface.html, example.html, profile.html)
    const slot =
      document.getElementById('sandyNavAuthSlot') ||
      document.getElementById('authSection') ||
      document.getElementById('navGuest');

    if (!slot) return;

    // Remove existing PFP dropdown if already mounted
    const existing = document.getElementById('sandyPfpMenuWrap');
    if (existing) existing.remove();

    const signedOutGroup = document.getElementById('navSignedOutGroup');
    const legacyAuthBtn = document.getElementById('btnOpenAuth');
    const indexNavGuest = document.getElementById('navGuest');
    const indexNavUser = document.getElementById('navUser');

    if (user) {
      if (signedOutGroup) {
        signedOutGroup.classList.add('d-none');
        signedOutGroup.classList.remove('d-flex');
      }
      if (legacyAuthBtn) legacyAuthBtn.classList.add('d-none');
      if (indexNavGuest) indexNavGuest.style.display = 'none';
      if (indexNavUser) indexNavUser.style.display = 'none';

      const dropdown = buildProfileDropdown(user, profileData);
      if (slot.id === 'navGuest' && slot.parentNode) {
        slot.parentNode.insertBefore(dropdown, slot);
      } else {
        slot.appendChild(dropdown);
      }
    } else {
      if (signedOutGroup) {
        signedOutGroup.classList.remove('d-none');
        signedOutGroup.classList.add('d-flex');
      }
      if (indexNavGuest) indexNavGuest.style.display = 'contents';
      if (indexNavUser) indexNavUser.style.display = 'none';
    }
  }

  function initSandyNav() {
    applyLayoutPreferences();
    enforcePlatformAppGate();
    // Hide Interface.html links by default until Firebase confirms a signed-in account
    updateInterfaceVisibilityForGuests(false);

    if (typeof firebase === 'undefined') return;
    try {
      if (!firebase.apps.length && window.DEFAULT_FIREBASE_CONFIG) {
        firebase.initializeApp(window.DEFAULT_FIREBASE_CONFIG);
      }
      if (!firebase.apps.length) return;

      const auth = firebase.auth();
      const db = firebase.firestore();

      auth.onAuthStateChanged(async (user) => {
        if (!user) {
          renderNavAvatar(null, null);
          return;
        }
        let profileData = getCachedProfile();
        renderNavAvatar(user, profileData);

        try {
          const doc = await db.collection('users').doc(user.uid).get();
          if (doc.exists) {
            profileData = { ...profileData, ...doc.data() };
            localStorage.setItem('sandy_user_profile', JSON.stringify(profileData));
            renderNavAvatar(user, profileData);
          }
        } catch (_) {}
      });
    } catch (_) {}
  }

  window.SandyNav = {
    detectOS,
    isWebInterfaceAllowed,
    applyLayoutPreferences,
    refreshAvatar: renderNavAvatar
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSandyNav);
  } else {
    initSandyNav();
  }
})();
