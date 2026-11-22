/**
 * ============================================================================
 * Sandy — Unified Top Bar, Smooth Page Transitions, Apple-Only OS Gate & Account Gate
 * ============================================================================
 * 1. Injects ONE identical Cyberpunk Glass top navigation bar on EVERY page so
 *    all pages share the exact same layout & bar style.
 * 2. Smooth fade+slide transitions every time the user switches tabs/pages.
 * 3. Reads the real browser OS (userAgentData + userAgent + platform):
 *    - ONLY Apple (iOS / iPadOS / macOS) browsers (or native desktop/mobile app shells)
 *      may access Interface.html, analytics.html, and ai-chat.html on the web.
 *    - Windows, Android, and Linux browsers are ALWAYS directed to download.html.
 * 4. Strict Account-Required Gate:
 *    - Signed-out guests can NEVER access Interface.html, ai-chat.html, analytics.html,
 *      or profile.html (blocked immediately before Firebase resolves).
 */
(function () {
  const PROTECTED_WEB_APP_PAGES = ['interface.html', 'interface', 'analytics.html', 'analytics', 'ai-chat.html', 'ai-chat'];
  const PROTECTED_ACCOUNT_PAGES = [...PROTECTED_WEB_APP_PAGES, 'profile.html', 'profile'];

  function getCurrentPageKey() {
    const seg = (window.location.pathname || '').split('/').pop().toLowerCase();
    return seg || 'index.html';
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

  function getCachedProfile() {
    try {
      return JSON.parse(localStorage.getItem('sandy_user_profile') || '{}');
    } catch (_) {
      return {};
    }
  }

  // --------------------------------------------------------------------------
  // 1. STRICT BROWSER OS DETECTION
  // --------------------------------------------------------------------------
  function detectOS() {
    // 1. Modern Chromium Client Hints (most reliable on Chrome/Edge/Brave/Opera)
    try {
      const uad = navigator.userAgentData;
      if (uad && typeof uad.platform === 'string' && uad.platform.trim()) {
        const p = uad.platform.toLowerCase();
        if (p.includes('win')) return 'windows';
        if (p.includes('android')) return 'android';
        if (p.includes('linux') || p.includes('cros')) return 'linux';
        if (p.includes('ios') || p.includes('iphone') || p.includes('ipad')) return 'ios';
        if (p.includes('mac')) {
          if (navigator.maxTouchPoints > 1) return 'ios';
          return 'macos';
        }
      }
    } catch (_) {}

    // 2. Fallback to User-Agent & navigator.platform (Windows/Android/Linux checked first!)
    const ua = navigator.userAgent || '';
    const plat = navigator.platform || '';
    if (/Windows|Win32|Win64|WOW64/i.test(ua) || /Win/i.test(plat)) return 'windows';
    if (/Android/i.test(ua)) return 'android';
    if (/iPad|iPhone|iPod/i.test(ua) || (plat === 'MacIntel' && navigator.maxTouchPoints > 1)) return 'ios';
    if (/Macintosh|Mac OS X/i.test(ua) || /Mac/i.test(plat)) return 'macos';
    if (/Linux|X11|CrOS/i.test(ua) || /Linux/i.test(plat)) return 'linux';
    return 'windows'; // Default non-Apple if unknown
  }

  function isWebInterfaceAllowed() {
    if (window.SandyDesktop || window.SandyNativeApp) return true;
    const os = detectOS();
    return os === 'ios' || os === 'macos';
  }

  // --------------------------------------------------------------------------
  // 2. INJECT UNIFIED TOP BAR, SMOOTH PAGE TRANSITION & DROPDOWN CSS
  // --------------------------------------------------------------------------
  const style = document.createElement('style');
  style.textContent = `
    /* Smooth Page Enter & Exit Transitions on Every Tab Switch */
    @keyframes sandyPageEnter {
      from { opacity: 0; transform: translateY(8px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    body {
      animation: sandyPageEnter 0.28s cubic-bezier(0.22, 1, 0.36, 1) both;
      transition: opacity 0.18s ease, transform 0.18s ease;
    }
    body.sandy-page-leaving {
      opacity: 0 !important;
      transform: translateY(-6px) !important;
      pointer-events: none;
    }

    /* Unified Shared Top Navigation Bar (Identical Across Every Page) */
    .sandy-unified-header {
      position: sticky;
      top: 0;
      z-index: 900;
      width: 100%;
      min-height: 68px;
      background: rgba(6, 10, 22, 0.86) !important;
      backdrop-filter: blur(22px) saturate(170%);
      -webkit-backdrop-filter: blur(22px) saturate(170%);
      border-bottom: 1px solid rgba(0, 240, 255, 0.20);
      box-shadow: 0 10px 34px rgba(0, 0, 0, 0.52);
      padding: 0.55rem 1.25rem;
      margin-bottom: 1.25rem;
      font-family: 'Inter', system-ui, sans-serif;
    }
    .sandy-unified-inner {
      max-width: 1380px;
      margin: 0 auto;
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 0.75rem;
    }
    .sandy-brand-link {
      display: inline-flex;
      align-items: center;
      gap: 0.7rem;
      text-decoration: none !important;
      color: #F8FAFC !important;
    }
    .sandy-brand-icon {
      width: 38px;
      height: 38px;
      border-radius: 11px;
      background: linear-gradient(135deg, rgba(0, 240, 255, 0.22), rgba(255, 0, 127, 0.20));
      border: 1.5px solid rgba(0, 240, 255, 0.65);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      color: #00F0FF;
      font-size: 1.15rem;
      box-shadow: 0 0 16px rgba(0, 240, 255, 0.24);
    }
    .sandy-brand-title {
      font-family: 'Rajdhani', sans-serif;
      font-weight: 700;
      font-size: 1.35rem;
      letter-spacing: 0.08em;
      color: #F8FAFC;
      line-height: 1;
    }
    .sandy-brand-sub {
      font-family: 'Share Tech Mono', monospace;
      font-size: 0.66rem;
      color: #94A3B8;
      letter-spacing: 0.05em;
    }
    .sandy-unified-nav {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 0.45rem;
    }
    .sandy-nav-pill {
      display: inline-flex;
      align-items: center;
      gap: 0.42rem;
      padding: 0.42rem 0.85rem;
      border-radius: 999px;
      font-size: 0.84rem;
      font-weight: 600;
      color: #CBD5E1 !important;
      text-decoration: none !important;
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(255, 255, 255, 0.10);
      transition: background 0.18s ease, border-color 0.18s ease, color 0.18s ease, transform 0.16s ease, box-shadow 0.18s ease;
    }
    .sandy-nav-pill:hover {
      color: #FFFFFF !important;
      background: rgba(0, 240, 255, 0.12);
      border-color: rgba(0, 240, 255, 0.45);
      transform: translateY(-1px);
    }
    .sandy-nav-pill.active {
      color: #FFFFFF !important;
      background: rgba(0, 240, 255, 0.16);
      border-color: #00F0FF;
      box-shadow: 0 0 18px rgba(0, 240, 255, 0.25);
    }
    .sandy-nav-pill i {
      color: #00F0FF;
      font-size: 0.92rem;
    }
    .sandy-nav-pill.pill-pink i {
      color: #FF007F;
    }
    .sandy-nav-auth {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
    }
    .sandy-auth-btn-outline {
      padding: 0.42rem 0.95rem;
      border-radius: 999px;
      font-size: 0.83rem;
      font-weight: 600;
      color: #F8FAFC !important;
      text-decoration: none !important;
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid rgba(0, 240, 255, 0.36);
      transition: all 0.16s ease;
    }
    .sandy-auth-btn-outline:hover {
      background: rgba(0, 240, 255, 0.15);
      border-color: #00F0FF;
    }
    .sandy-auth-btn-solid {
      padding: 0.42rem 1rem;
      border-radius: 999px;
      font-size: 0.83rem;
      font-weight: 700;
      color: #030508 !important;
      text-decoration: none !important;
      background: linear-gradient(135deg, #00F0FF, #00C8FF);
      border: 1px solid #00F0FF;
      box-shadow: 0 0 16px rgba(0, 240, 255, 0.34);
      transition: all 0.16s ease;
    }
    .sandy-auth-btn-solid:hover {
      filter: brightness(1.08);
      transform: translateY(-1px);
    }

    /* Profile Avatar Dropdown */
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
      border: 2px solid rgba(0, 240, 255, 0.78);
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
      border: 1px solid rgba(0, 240, 255, 0.34);
      border-radius: 16px;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.8), 0 0 24px rgba(0, 240, 255, 0.14);
      padding: 0.55rem;
      z-index: 10050;
      display: none;
    }
    .sandy-pfp-menu.open {
      display: block;
      animation: sandyDropIn 0.18s cubic-bezier(0.22, 1, 0.36, 1);
    }
    @keyframes sandyDropIn {
      from { opacity: 0; transform: translateY(-6px) scale(0.97); }
      to   { opacity: 1; transform: translateY(0) scale(1); }
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

    /* User-Configurable Layout Preferences */
    body.sandy-layout-compact main { max-width: 1180px; margin-inline: auto; }
    body.sandy-layout-wide main { max-width: 100%; }
    body.sandy-accent-magenta { --cyber-cyan: #FF007F; --cyan: #FF007F; }
    body.sandy-accent-gold { --cyber-cyan: #FFE600; --cyan: #FFE600; }
    body.sandy-no-particles #particleRodCanvas,
    body.sandy-no-particles #bgCanvas { display: none !important; }
  `;
  document.head.appendChild(style);

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

  // --------------------------------------------------------------------------
  // 3. UNIFIED IDENTICAL TOP BAR ACROSS ALL PAGES
  // --------------------------------------------------------------------------
  function mountUnifiedTopBar() {
    const page = getCurrentPageKey();
    const isActive = (target) => {
      const cleanPage = page.replace(/\.html$/, '');
      const cleanTarget = target.toLowerCase().replace(/\.html$/, '');
      return cleanPage === cleanTarget || (cleanPage === '' && cleanTarget === 'index');
    };

    const nextParam = encodeURIComponent(page || 'index.html');
    const header = document.createElement('header');
    header.id = 'sandyUnifiedHeader';
    header.className = 'sandy-unified-header';
    header.innerHTML = `
      <div class="sandy-unified-inner">
        <a href="index.html" class="sandy-brand-link">
          <span class="sandy-brand-icon"><i class="bi bi-person-standing"></i></span>
          <div>
            <div class="sandy-brand-title">SANDY</div>
            <div class="sandy-brand-sub">AI POSTURE DETECTION</div>
          </div>
        </a>

        <nav class="sandy-unified-nav" aria-label="Primary Navigation">
          <a href="index.html" class="sandy-nav-pill ${isActive('index.html') ? 'active' : ''}">
            <i class="bi bi-house-door"></i><span>Home</span>
          </a>
          <a href="Interface.html" class="sandy-nav-pill sandy-apple-auth-only ${isActive('Interface.html') ? 'active' : ''}">
            <i class="bi bi-camera-video"></i><span>Live Monitor</span>
          </a>
          <a href="analytics.html" class="sandy-nav-pill sandy-apple-auth-only ${isActive('analytics.html') ? 'active' : ''}">
            <i class="bi bi-pie-chart-fill"></i><span>Result Analyze</span>
          </a>
          <a href="ai-chat.html" class="sandy-nav-pill sandy-apple-auth-only ${isActive('ai-chat.html') ? 'active' : ''}">
            <i class="bi bi-stars"></i><span>AI Chatbot</span>
          </a>
          <a href="download.html" class="sandy-nav-pill ${isActive('download.html') ? 'active' : ''}">
            <i class="bi bi-download"></i><span>Download</span>
          </a>
          <a href="example.html" class="sandy-nav-pill pill-pink ${isActive('example.html') ? 'active' : ''}">
            <i class="bi bi-activity"></i><span>Biofeedback Lab</span>
          </a>
        </nav>

        <div id="sandyUnifiedAuthSlot" class="sandy-nav-auth">
          <div id="sandyUnifiedSignedOut" class="sandy-nav-auth">
            <a href="signin.html?next=${nextParam}" class="sandy-auth-btn-outline">Sign In</a>
            <a href="signup.html?next=${nextParam}" class="sandy-auth-btn-solid">Sign Up</a>
          </div>
        </div>
      </div>
    `;

    // Replace existing page-specific top header/navbar so every page shares ONE identical bar
    const existingHeader = document.querySelector('header#stickyNav, header.nav, header.glass-nav, header.navbar, nav.navbar');
    if (existingHeader && existingHeader.parentNode) {
      existingHeader.parentNode.replaceChild(header, existingHeader);
    } else {
      document.body.insertBefore(header, document.body.firstChild);
    }
  }

  // --------------------------------------------------------------------------
  // 4. SMOOTH PAGE TRANSITIONS + NON-APPLE INTERCEPTOR
  // --------------------------------------------------------------------------
  function initSmoothPageTransitions() {
    document.addEventListener('click', (e) => {
      const link = e.target.closest('a[href]');
      if (!link) return;
      if (link.target === '_blank' || link.hasAttribute('download')) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

      const href = (link.getAttribute('href') || '').trim();
      if (!href || href.startsWith('#') || href.startsWith('http://') || href.startsWith('https://') || href.startsWith('mailto:') || href.startsWith('javascript:')) {
        return;
      }

      // Block Windows/Android/Linux clicks to web-app pages and send straight to download.html
      const targetPage = href.split('?')[0].split('#')[0].split('/').pop().toLowerCase();
      if (!isWebInterfaceAllowed() && PROTECTED_WEB_APP_PAGES.includes(targetPage)) {
        e.preventDefault();
        document.body.classList.add('sandy-page-leaving');
        setTimeout(() => { window.location.href = 'download.html'; }, 170);
        return;
      }

      e.preventDefault();
      document.body.classList.add('sandy-page-leaving');
      setTimeout(() => { window.location.href = href; }, 170);
    });
  }

  // --------------------------------------------------------------------------
  // 5. APPLE-ONLY WEB INTERFACE OS GATE
  // --------------------------------------------------------------------------
  function enforcePlatformAppGate() {
    if (isWebInterfaceAllowed()) return false;
    const page = getCurrentPageKey();
    if (!PROTECTED_WEB_APP_PAGES.includes(page)) return false;

    const os = detectOS();
    const osLabel = os === 'windows' ? 'Windows' : os === 'android' ? 'Android' : 'Linux';
    const osIcon = os === 'windows' ? 'bi-windows' : os === 'android' ? 'bi-android2' : 'bi-terminal';

    const mainEl = document.querySelector('main');
    if (mainEl) mainEl.style.display = 'none';

    if (document.getElementById('sandyOsGateOverlay')) return true;
    const gate = document.createElement('div');
    gate.id = 'sandyOsGateOverlay';
    gate.style.cssText = 'position:fixed; inset:0; z-index:10020; background:rgba(3,5,8,0.97); backdrop-filter:blur(18px); display:flex; align-items:center; justify-content:center; padding:1.25rem;';
    gate.innerHTML = `
      <div class="glass-card p-4 p-sm-5 text-center" style="max-width:500px; width:100%; border:1px solid rgba(0,240,255,0.55); box-shadow:0 24px 60px rgba(0,0,0,0.92);">
        <div class="mb-3">
          <span class="flow-badge flow-badge-cyan font-mono">
            <i class="bi ${osIcon}"></i>
            <span>${osLabel.toUpperCase()} BROWSER DETECTED</span>
          </span>
        </div>
        <h3 class="fw-bold text-hi font-display mb-2">Download the Sandy App for ${osLabel}</h3>
        <p class="text-body-88 small mb-4">
          The Sandy Web Interface &amp; AI Chatbot are only available in-browser on <strong>Apple (iOS &amp; macOS)</strong> devices.
          Because you are using <strong>${osLabel}</strong>, please download and install the native Sandy app instead.
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
    return true;
  }

  // --------------------------------------------------------------------------
  // 6. STRICT ACCOUNT-REQUIRED GATE (BLOCKS GUESTS FROM INTERFACE & AI CHATBOT)
  // --------------------------------------------------------------------------
  function enforceAccountRequiredGate(isSignedIn) {
    const page = getCurrentPageKey();
    if (!PROTECTED_ACCOUNT_PAGES.includes(page)) return;
    if (document.getElementById('sandyOsGateOverlay')) return;

    const mainEl = document.querySelector('main');
    const existingGate = document.getElementById('sandyAuthGateOverlay');

    if (isSignedIn) {
      if (existingGate) existingGate.remove();
      if (mainEl) mainEl.style.display = '';
      return;
    }

    if (mainEl) mainEl.style.display = 'none';
    if (existingGate) return;

    const nextParam = encodeURIComponent(page || 'Interface.html');
    const gate = document.createElement('div');
    gate.id = 'sandyAuthGateOverlay';
    gate.style.cssText = 'position:fixed; inset:0; z-index:10010; background:rgba(3,5,8,0.97); backdrop-filter:blur(18px); display:flex; align-items:center; justify-content:center; padding:1.25rem;';
    gate.innerHTML = `
      <div class="glass-card p-4 p-sm-5 text-center" style="max-width:480px; width:100%; border:1px solid rgba(0,240,255,0.48); box-shadow:0 24px 60px rgba(0,0,0,0.92);">
        <div class="mb-3">
          <span class="flow-badge flow-badge-cyan font-mono">
            <i class="bi bi-shield-lock-fill"></i>
            <span>ACCOUNT REQUIRED</span>
          </span>
        </div>
        <h3 class="fw-bold text-hi font-display mb-2">Sign In to Access Sandy</h3>
        <p class="text-body-88 small mb-4">
          Users without an account cannot access the <strong>Live Posture Interface</strong>, <strong>AI Chatbot</strong>, or <strong>Posture Reports</strong>. Sign in or create an account to continue.
        </p>
        <div class="d-grid gap-2">
          <a href="signin.html?next=${nextParam}" class="btn-neon-primary py-2 text-decoration-none">
            <i class="bi bi-box-arrow-in-right me-1"></i><span>Sign In</span>
          </a>
          <a href="signup.html?next=${nextParam}" class="btn-glass-secondary py-2 text-decoration-none">
            <i class="bi bi-person-plus me-1"></i><span>Create Account (Sign Up)</span>
          </a>
          <a href="index.html" class="btn-glass-subtle py-2 text-decoration-none small">
            <i class="bi bi-house-door me-1"></i><span>Back to Home</span>
          </a>
        </div>
      </div>
    `;
    document.body.appendChild(gate);
  }

  function updateLinkVisibility(isSignedIn) {
    const appleAllowed = isWebInterfaceAllowed();
    // Hide Interface / Analytics / AI Coach links for signed-out guests OR non-Apple browsers
    document.querySelectorAll('.sandy-apple-auth-only, a[href="Interface.html"], a[href*="Interface.html"], a[href="analytics.html"], a[href="ai-chat.html"]').forEach((link) => {
      const href = link.getAttribute('href') || '';
      if (href.startsWith('signin.html') || href.startsWith('signup.html')) return;
      link.style.display = (isSignedIn && appleAllowed) ? '' : 'none';
    });

    // Always show Download on web browsers (hide only inside native desktop/mobile shell)
    document.querySelectorAll('a[href="download.html"]').forEach((dl) => {
      dl.style.display = (window.SandyDesktop || window.SandyNativeApp) ? 'none' : '';
    });
  }

  // --------------------------------------------------------------------------
  // 7. PROFILE AVATAR DROPDOWN
  // --------------------------------------------------------------------------
  function buildProfileDropdown(user, profileData) {
    const rawDisplay = (profileData && profileData.displayName) || (user && user.displayName) || (user && user.email ? user.email.split('@')[0] : 'Sandy User');
    const rawUser = (profileData && profileData.username) || (user && user.email ? user.email.split('@')[0] : 'user');
    const displayName = escapeHtml(rawDisplay);
    const username = escapeHtml(rawUser.startsWith('@') ? rawUser : '@' + rawUser);
    const photoUrl = sanitizeImageUrl((profileData && profileData.photoURL) || (user && user.photoURL) || '');
    const initials = escapeHtml(rawDisplay.trim().slice(0, 2).toUpperCase() || 'SY');
    const appleAllowed = isWebInterfaceAllowed();

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
          <i class="bi bi-person-circle"></i><span>Profile</span>
        </a>
        ${appleAllowed ? `
        <a href="analytics.html" class="sandy-pfp-item" role="menuitem">
          <i class="bi bi-pie-chart-fill"></i><span>Result Analyze</span>
        </a>
        <a href="ai-chat.html" class="sandy-pfp-item" role="menuitem">
          <i class="bi bi-stars"></i><span>AI Chatbot</span>
        </a>` : `
        <a href="download.html" class="sandy-pfp-item" role="menuitem">
          <i class="bi bi-download"></i><span>Download App</span>
        </a>`}
        <a href="profile.html#settings" class="sandy-pfp-item" role="menuitem">
          <i class="bi bi-sliders"></i><span>Settings &amp; Layout</span>
        </a>
        <a href="profile.html#security" class="sandy-pfp-item" role="menuitem">
          <i class="bi bi-shield-lock"></i><span>Security &amp; 2FA</span>
        </a>
        <div class="sandy-pfp-divider"></div>
        <button type="button" class="sandy-pfp-item sandy-pfp-signout" id="sandyDropdownSignOutBtn" role="menuitem">
          <i class="bi bi-box-arrow-right"></i><span>Sign Out</span>
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
      if (!wrap.contains(e.target)) menu.classList.remove('open');
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

  function renderNavAvatar(user, profileData) {
    const isSignedIn = Boolean(user);
    updateLinkVisibility(isSignedIn);
    enforceAccountRequiredGate(isSignedIn);

    const slot = document.getElementById('sandyUnifiedAuthSlot');
    const signedOutGroup = document.getElementById('sandyUnifiedSignedOut');
    if (!slot) return;

    const existing = document.getElementById('sandyPfpMenuWrap');
    if (existing) existing.remove();

    if (user) {
      if (signedOutGroup) signedOutGroup.style.display = 'none';
      slot.appendChild(buildProfileDropdown(user, profileData));
    } else {
      if (signedOutGroup) signedOutGroup.style.display = 'inline-flex';
    }
  }

  function initSandyNav() {
    applyLayoutPreferences();
    mountUnifiedTopBar();
    initSmoothPageTransitions();

    // Enforce OS Gate FIRST (blocks Windows/Android/Linux immediately), then Account Gate
    enforcePlatformAppGate();
    updateLinkVisibility(false);
    enforceAccountRequiredGate(false);

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
