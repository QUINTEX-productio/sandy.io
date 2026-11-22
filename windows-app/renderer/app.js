/* ============================================================================
   SANDY WINDOWS DESKTOP APP — COMPLETE APPLICATION ENGINE (ver Alpha)
   ============================================================================ */

const CFG = window.SANDY_CONFIG;

// App Runtime State
let fbAuth = null;
let fbDb = null;
let currentUser = null;
let userProfile = {};
let isGoogleSignUpFlow = false;
let pendingSignUpCredUser = null;

// Survey State
const selectedMedicalSet = new Set();
let selectedSurveyGoal = '';
let selectedSurveyPlan = '';

// Navigation & Scroll State
const SECTIONS = ['menu', 'devices', 'interface', 'chatbot', 'report', 'settings'];
let activeSection = 'menu';
let isProgrammaticScroll = false;

// Devices State
let devicesList = [];
let openDeviceMenuId = null;

// Live Interface & Backend Recording State
let isMonitoring = false;
let cameraStream = null;
let yoloLoopTimer = null;
let espPollTimer = null;
let mediaRecorder = null;
let recordedChunks = [];
let videoClipTimer = null;
let lastSnapshotAt = 0;
let slouchStartAt = null;
let lastChimeAt = 0;
let currentPostureState = 'WAITING'; // GOOD | BAD | WAITING
let activeInterfaceDeviceId = '';

// Chat State
let chatHistory = [];
let isChatBusy = false;

// Report State
let reportTimeframe = 'daily'; // daily | weekly | monthly | yearly
let mediaFilter = 'all';       // all | image | video
let dailyAnalyticsMap = {};    // { 'YYYY-MM-DD': { date, good_frames, bad_frames, slouch_events, back_score, conf_avg } }
let recordedMediaList = [];
let activeLightboxId = null;

// Settings State
let appSettings = {
  theme: 'cyan',
  language: 'en',
  density: 'standard',
  particles: true,
  chime: true,
  autoRecord: true,
  autoWake: true,
  slouchSeconds: 5
};

// Tutorial Steps (shown automatically right after Sign Up + Survey)
const TUTORIAL_STEPS = [
  {
    icon: 'bi-stars',
    title: 'Welcome to Sandy Desktop!',
    body: 'Let’s take a quick 30-second tour of every mechanic in Sandy so you can start tracking your posture right away.'
  },
  {
    icon: 'bi-list-ul',
    title: 'Left Sidebar & Smooth Scroll Circle',
    body: 'Every tool lives on the left icon rail. Click any icon—Menu, Devices, Interface, AI Chatbot, Report, or Settings—and the glowing circle smoothly glides while the app scrolls directly to that workspace.'
  },
  {
    icon: 'bi-grid-1x2-fill',
    title: 'Home Menu Hub',
    body: 'Every time you open Sandy after signing in, you start on the Home Menu. From here you can jump to any module, check Colab AI status, or replay this tutorial anytime.'
  },
  {
    icon: 'bi-bluetooth',
    title: 'Devices Manager',
    body: 'Click the red "Add Device" button to pair Bluetooth posture sensors (or open "How to Add Device" for steps). Each sideways beveled bar shows device status, and its top-left (⋮) menu lets you view Preferences, Rename, or Delete.'
  },
  {
    icon: 'bi-camera-video-fill',
    title: 'Distraction-Free Live Interface',
    body: 'The Interface shows only what matters: your Camera, Live Posture Reading (GOOD / BAD), the center circle start button, and your Bluetooth "Choose device" dropdown. Colab YOLOv5 wake-up, inference, alerts, and recording run silently in the backend.'
  },
  {
    icon: 'bi-chat-dots-fill',
    title: 'Sandy AI Chatbot (Qwen3.6-35B)',
    body: 'Ask posture, stretching, desk ergonomics, or spine wellness questions. Sandy auto-wakes the Colab Qwen GPU and automatically stays strictly on-topic for posture and health.'
  },
  {
    icon: 'bi-bar-chart-line-fill',
    title: 'YOLO → Qwen Reports & Media',
    body: 'Switch between Daily, Weekly, Monthly, and Yearly boxes to inspect recorded images & videos, Day-1 baseline comparisons (even when some days lack data), and AI summaries from YOLOv5 through Qwen3.6. Your profile & Sign Out live in the top-right avatar!'
  }
];
let tutorialIndex = 0;

// ============================================================================
// UTILITY HELPERS
// ============================================================================
function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

function showToast(msg) {
  const existing = document.querySelector('.toast-notice');
  if (existing) existing.remove();
  const div = document.createElement('div');
  div.className = 'toast-notice';
  div.textContent = msg;
  document.body.appendChild(div);
  setTimeout(() => div.remove(), 3400);
}

function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add('hidden');
}

function openModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('hidden');
}

function playSlouchChime() {
  if (!appSettings.chime) return;
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(740, ctx.currentTime);
    gain.gain.setValueAtTime(0.001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.14, ctx.currentTime + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.38);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.40);
  } catch (_) {}
}

// ============================================================================
// BACKGROUND PARTICLE ENGINE
// ============================================================================
function initBackgroundParticles() {
  const canvas = document.getElementById('bgParticles');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let w = 0, h = 0;
  const pts = [];

  function resize() {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  for (let i = 0; i < 42; i++) {
    pts.push({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      r: Math.random() * 1.8 + 0.8
    });
  }

  function frame() {
    if (appSettings.particles) {
      ctx.clearRect(0, 0, w, h);
      const accentRgb = getComputedStyle(document.body).getPropertyValue('--accent-rgb').trim() || '0, 240, 255';
      for (let i = 0; i < pts.length; i++) {
        const p = pts[i];
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${accentRgb}, 0.45)`;
        ctx.fill();

        for (let j = i + 1; j < pts.length; j++) {
          const q = pts[j];
          const dx = p.x - q.x;
          const dy = p.y - q.y;
          const dist = Math.hypot(dx, dy);
          if (dist < 130) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.strokeStyle = `rgba(${accentRgb}, ${(1 - dist / 130) * 0.14})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }
    }
    requestAnimationFrame(frame);
  }
  frame();
}

// ============================================================================
// INITIALIZATION & FIREBASE SETUP
// ============================================================================
function populateDobDropdowns() {
  const daySel = document.getElementById('upDobDay');
  const yearSel = document.getElementById('upDobYear');
  if (daySel && daySel.options.length <= 1) {
    for (let d = 1; d <= 31; d++) {
      const opt = document.createElement('option');
      const v = String(d).padStart(2, '0');
      opt.value = v;
      opt.textContent = v;
      daySel.appendChild(opt);
    }
  }
  if (yearSel && yearSel.options.length <= 1) {
    const currentYear = new Date().getFullYear();
    for (let y = currentYear; y >= 1920; y--) {
      const opt = document.createElement('option');
      opt.value = String(y);
      opt.textContent = String(y);
      yearSel.appendChild(opt);
    }
  }
}

function initFirebase() {
  if (typeof firebase === 'undefined') return;
  if (!firebase.apps.length) {
    firebase.initializeApp(CFG.firebase);
  }
  fbAuth = firebase.auth();
  fbDb = firebase.firestore();

  fbAuth.onAuthStateChanged(async (user) => {
    if (!user) return;
    currentUser = user;

    // Wait if user is currently mid-signup / survey
    if (!document.getElementById('screenSurvey').classList.contains('hidden')) return;
    if (isGoogleSignUpFlow && !document.getElementById('screenAuth').classList.contains('hidden')) return;

    await loadUserProfileFromCloud(user);
    if (!document.getElementById('workspaceShell').classList.contains('hidden')) {
      syncProfileUI();
      return;
    }

    // Auto-enter workspace if already signed in from a previous session
    if (!document.getElementById('screenSplash').classList.contains('hidden')) {
      enterMainWorkspace(false);
    }
  });
}

async function loadUserProfileFromCloud(user) {
  let cached = {};
  try {
    cached = JSON.parse(localStorage.getItem('sandy_desktop_profile') || '{}');
  } catch (_) {}

  let cloud = {};
  if (fbDb && user?.uid) {
    try {
      const snap = await fbDb.collection('users').doc(user.uid).get();
      if (snap.exists) cloud = snap.data() || {};
    } catch (_) {}
  }

  userProfile = {
    uid: user?.uid || cached.uid || 'local',
    displayName: cloud.displayName || user?.displayName || cached.displayName || 'Sandy User',
    username: cloud.username || cached.username || (user?.email ? user.email.split('@')[0] : 'sandy_user'),
    email: cloud.email || user?.email || cached.email || '',
    dob: cloud.dob || cached.dob || '',
    gender: cloud.gender || cached.gender || 'Prefer not to say',
    photoURL: cloud.photoURL || user?.photoURL || cached.photoURL || '',
    medicalConditions: cloud.medicalConditions || cached.medicalConditions || [],
    medicalNotes: cloud.medicalNotes || cached.medicalNotes || '',
    seatHours: cloud.seatHours || cached.seatHours || '6–8 hours',
    deskSetup: cloud.deskSetup || cached.deskSetup || 'Desktop / External Monitor',
    goal: cloud.goal || cached.goal || 'Build Upright Sitting Habit',
    planPath: cloud.planPath || cached.planPath || 'Daily Habit Path'
  };
  localStorage.setItem('sandy_desktop_profile', JSON.stringify(userProfile));
}

// ============================================================================
// SCREEN SWITCHING (SPLASH -> AUTH -> SURVEY -> WORKSPACE + TUTORIAL)
// ============================================================================
function showSplashView() {
  document.getElementById('screenSplash').classList.remove('hidden');
  document.getElementById('screenAuth').classList.add('hidden');
  document.getElementById('screenSurvey').classList.add('hidden');
  document.getElementById('workspaceShell').classList.add('hidden');
  clearAuthError();
}

function showAuthView(mode) {
  document.getElementById('screenSplash').classList.add('hidden');
  document.getElementById('screenAuth').classList.remove('hidden');
  document.getElementById('screenSurvey').classList.add('hidden');
  document.getElementById('workspaceShell').classList.add('hidden');
  clearAuthError();

  if (mode === 'signup') {
    document.getElementById('panelSignIn').classList.add('hidden');
    document.getElementById('panelSignUp').classList.remove('hidden');
  } else {
    document.getElementById('panelSignUp').classList.add('hidden');
    document.getElementById('panelSignIn').classList.remove('hidden');
  }
}

function showAuthError(msg) {
  const el = document.getElementById('authAlert');
  el.textContent = msg;
  el.classList.remove('hidden');
}

function clearAuthError() {
  const el = document.getElementById('authAlert');
  el.classList.add('hidden');
  el.textContent = '';
}

function updatePasswordStrength(pw) {
  let score = 0;
  if (pw.length >= 6) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (pw.length >= 10) score++;
  const colors = ['#FF2A6D', '#FFE600', '#00F0FF', '#00FF66'];
  for (let i = 1; i <= 4; i++) {
    const bar = document.getElementById(`pwBar${i}`);
    if (bar) bar.style.background = i <= score ? colors[Math.max(0, score - 1)] : 'rgba(255,255,255,0.12)';
  }
}

// Normal Email Sign In (connects via Sandy Website Firebase Bridge + Firebase Auth)
async function handleEmailSignIn(e) {
  e.preventDefault();
  clearAuthError();
  const email = document.getElementById('inEmail').value.trim();
  const password = document.getElementById('inPassword').value;
  const btn = document.getElementById('btnSignInSubmit');
  btn.disabled = true;

  try {
    // Sync through Sandy website Firebase bridge in background
    if (window.sandyAPI && typeof window.sandyAPI.openWebsiteBridge === 'function') {
      window.sandyAPI.openWebsiteBridge({ mode: 'signin', visible: false }).catch(() => {});
    }

    const cred = await fbAuth.signInWithEmailAndPassword(email, password);
    currentUser = cred.user;
    await loadUserProfileFromCloud(currentUser);
    showToast('Signed in & synced with Sandy Firebase!');
    enterMainWorkspace(false);
  } catch (err) {
    showAuthError(err.message || 'Sign in failed. Check your email and password.');
  } finally {
    btn.disabled = false;
  }
}

// Normal Email Sign Up (connects via Sandy Website Firebase Bridge + Firebase Auth -> 3-Step Survey -> Tutorial)
async function handleEmailSignUp(e) {
  e.preventDefault();
  clearAuthError();

  const displayName = document.getElementById('upDisplayName').value.trim();
  const username = document.getElementById('upUsername').value.trim().replace(/^@/, '');
  const email = document.getElementById('upEmail').value.trim();
  const dobM = document.getElementById('upDobMonth').value;
  const dobD = document.getElementById('upDobDay').value;
  const dobY = document.getElementById('upDobYear').value;
  const gender = document.getElementById('upGender').value;
  const tos = document.getElementById('upTos').checked;

  if (!dobM || !dobD || !dobY) {
    showAuthError('Please select Month, Day, and Year of birth.');
    return;
  }
  if (!tos) {
    showAuthError('Please accept the Terms of Service.');
    return;
  }

  const dob = `${dobY}-${dobM}-${dobD}`;
  const btn = document.getElementById('btnSignUpSubmit');
  btn.disabled = true;

  try {
    let user = pendingSignUpCredUser;

    if (!isGoogleSignUpFlow) {
      const pw = document.getElementById('upPassword').value;
      const pw2 = document.getElementById('upConfirmPassword').value;
      if (pw.length < 6) {
        showAuthError('Password must be at least 6 characters.');
        btn.disabled = false;
        return;
      }
      if (pw !== pw2) {
        showAuthError('Passwords do not match.');
        btn.disabled = false;
        return;
      }

      // Connect through Sandy website Firebase bridge
      if (window.sandyAPI && typeof window.sandyAPI.openWebsiteBridge === 'function') {
        window.sandyAPI.openWebsiteBridge({ mode: 'signup', visible: false }).catch(() => {});
      }

      const cred = await fbAuth.createUserWithEmailAndPassword(email, pw);
      user = cred.user;
      await user.updateProfile({ displayName }).catch(() => {});
      user.sendEmailVerification().catch(() => {});
    }

    currentUser = user;
    userProfile = {
      uid: user.uid,
      displayName,
      username,
      email,
      dob,
      gender,
      photoURL: user.photoURL || '',
      medicalConditions: [],
      medicalNotes: '',
      seatHours: '6–8 hours',
      deskSetup: 'Desktop / External Monitor',
      goal: 'Build Upright Sitting Habit',
      planPath: 'Daily Habit Path',
      createdAt: new Date().toISOString()
    };

    if (fbDb) {
      await fbDb.collection('users').doc(user.uid).set(userProfile, { merge: true });
    }
    localStorage.setItem('sandy_desktop_profile', JSON.stringify(userProfile));

    // Proceed to 3-Step Personalization Survey
    document.getElementById('screenAuth').classList.add('hidden');
    document.getElementById('screenSurvey').classList.remove('hidden');
    goSurveyStep(1);
  } catch (err) {
    showAuthError(err.message || 'Sign up failed. Please try again.');
  } finally {
    btn.disabled = false;
  }
}

// Google / Gmail Sign In (standard Firebase GoogleAuthProvider)
async function handleGoogleAuth(mode) {
  clearAuthError();
  try {
    const provider = new firebase.auth.GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    const result = await fbAuth.signInWithPopup(provider);
    const user = result.user;

    if (mode === 'signup') {
      isGoogleSignUpFlow = true;
      pendingSignUpCredUser = user;
      document.getElementById('upEmail').value = user.email || '';
      document.getElementById('upEmail').readOnly = true;
      if (user.displayName) document.getElementById('upDisplayName').value = user.displayName;
      if (user.email) document.getElementById('upUsername').value = user.email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '');

      document.getElementById('upPasswordWrap').classList.add('hidden');
      document.getElementById('upPassword').required = false;
      document.getElementById('upConfirmPassword').required = false;
      document.getElementById('googleSignUpWrap').classList.add('hidden');
      document.getElementById('googlePrefillNote').classList.remove('hidden');
      document.getElementById('btnSignUpLabel').textContent = 'Continue to Personalization Survey';
      return;
    }

    // Regular Google Sign-In
    currentUser = user;
    await loadUserProfileFromCloud(user);
    showToast(`Welcome back, ${userProfile.displayName}!`);
    enterMainWorkspace(false);
  } catch (err) {
    // Fallback to external browser Sandy website Google Auth bridge if popup is restricted
    if (err.code === 'auth/popup-blocked' || err.code === 'auth/operation-not-supported-in-this-environment') {
      showAuthError('Opening Google Sign-In in your browser via Sandy Website...');
      if (window.sandyAPI?.openWebsiteBridge) {
        window.sandyAPI.openWebsiteBridge({ mode, useExternalBrowser: true });
      }
      return;
    }
    showAuthError(err.message || 'Google sign-in was cancelled or failed.');
  }
}

// ============================================================================
// 3-STEP ONBOARDING SURVEY
// ============================================================================
function toggleMedPill(btn, label) {
  if (label === 'None') {
    selectedMedicalSet.clear();
    document.querySelectorAll('#medicalPillsWrap .survey-pill').forEach(p => p.classList.remove('selected'));
    btn.classList.add('selected');
    selectedMedicalSet.add('None');
    return;
  }
  selectedMedicalSet.delete('None');
  document.querySelectorAll('#medicalPillsWrap .survey-pill').forEach(p => {
    if (p.textContent.trim() === 'None') p.classList.remove('selected');
  });
  if (selectedMedicalSet.has(label)) {
    selectedMedicalSet.delete(label);
    btn.classList.remove('selected');
  } else {
    selectedMedicalSet.add(label);
    btn.classList.add('selected');
  }
}

function goSurveyStep(step) {
  document.getElementById('surveyStep1').classList.toggle('hidden', step !== 1);
  document.getElementById('surveyStep2').classList.toggle('hidden', step !== 2);
  document.getElementById('surveyStep3').classList.toggle('hidden', step !== 3);

  const meta = {
    1: { tag: 'STEP 1 OF 3 • OPTIONAL', head: 'Medical Background', sub: 'Tell Sandy about any spine or back conditions so AI coaching stays safe.' },
    2: { tag: 'STEP 2 OF 3 • OPTIONAL', head: 'Daily Desk Routine', sub: 'Help Sandy calibrate slouch alerts to your normal sitting schedule.' },
    3: { tag: 'STEP 3 OF 3 • REQUIRED', head: 'Choose Your Primary Goal', sub: 'Select your main posture goal so Sandy can build your personalized plan.' }
  }[step];

  document.getElementById('surveyStepTag').textContent = meta.tag;
  document.getElementById('surveyHeading').textContent = meta.head;
  document.getElementById('surveySubtext').textContent = meta.sub;
}

function selectSurveyGoal(card, goal, planPath) {
  document.querySelectorAll('#surveyStep3 .goal-card').forEach(c => c.classList.remove('selected'));
  card.classList.add('selected');
  selectedSurveyGoal = goal;
  selectedSurveyPlan = planPath;
  document.getElementById('surveyGoalErr').classList.add('hidden');
}

async function submitOnboardingSurvey() {
  if (!selectedSurveyGoal) {
    document.getElementById('surveyGoalErr').classList.remove('hidden');
    return;
  }

  userProfile.medicalConditions = Array.from(selectedMedicalSet);
  userProfile.medicalNotes = document.getElementById('surveyMedNotes').value.trim();
  userProfile.seatHours = document.getElementById('surveySeatHours').value;
  userProfile.deskSetup = document.getElementById('surveyDeskSetup').value;
  userProfile.goal = selectedSurveyGoal;
  userProfile.planPath = selectedSurveyPlan;

  localStorage.setItem('sandy_desktop_profile', JSON.stringify(userProfile));
  if (fbDb && currentUser?.uid) {
    try {
      await fbDb.collection('users').doc(currentUser.uid).set(userProfile, { merge: true });
    } catch (_) {}
  }

  isGoogleSignUpFlow = false;
  pendingSignUpCredUser = null;

  // Launch directly into Workspace (Menu first) + Interactive Tutorial!
  enterMainWorkspace(true);
}

// ============================================================================
// WORKSPACE ENTRY, PROFILE DROPDOWN & TUTORIAL
// ============================================================================
async function enterMainWorkspace(showTutorialAfterSignUp) {
  document.getElementById('screenSplash').classList.add('hidden');
  document.getElementById('screenAuth').classList.add('hidden');
  document.getElementById('screenSurvey').classList.add('hidden');
  document.getElementById('workspaceShell').classList.remove('hidden');

  syncProfileUI();
  loadDevicesFromStorage();
  renderDevicesList();
  refreshInterfaceDeviceDropdown();
  resetChatConversation();
  await refreshReportData(false);

  // First launch starts on Menu and positions the left sidebar circle on Menu
  requestAnimationFrame(() => {
    navigateToSection('menu', true);
    setupScrollObserver();
  });

  if (appSettings.autoWake) {
    wakeColabServices('all');
  }

  if (showTutorialAfterSignUp) {
    openTutorialModal(0);
  }
}

function syncProfileUI() {
  const name = userProfile.displayName || 'Sandy User';
  const handle = `@${(userProfile.username || 'sandy_user').replace(/^@/, '')}`;
  const initials = name.split(/\s+/).map(p => p[0] || '').join('').toUpperCase().slice(0, 2) || 'S';

  document.getElementById('pfpMenuName').textContent = name;
  document.getElementById('pfpMenuHandle').textContent = handle;
  document.getElementById('menuGreeting').textContent = `Welcome back, ${name}`;
  document.getElementById('menuPlanName').textContent = userProfile.goal || 'Build Upright Sitting Habit';

  const avatarEl = document.getElementById('pfpAvatarContent');
  if (userProfile.photoURL) {
    avatarEl.innerHTML = `<img src="${escapeHtml(userProfile.photoURL)}" alt="PFP" />`;
  } else {
    avatarEl.textContent = initials;
  }

  // Sync AI chat sidebar context
  document.getElementById('chatCtxGoal').textContent = userProfile.goal || 'Build Upright Sitting Habit';
  const medText = [
    Array.isArray(userProfile.medicalConditions) ? userProfile.medicalConditions.join(', ') : '',
    userProfile.medicalNotes || ''
  ].filter(Boolean).join(' — ') || 'None reported';
  document.getElementById('chatCtxMedical').textContent = medText;
}

function toggleProfileDropdown() {
  document.getElementById('pfpDropdownMenu').classList.toggle('open');
}

function openProfileModal() {
  document.getElementById('pfpDropdownMenu').classList.remove('open');
  document.getElementById('profModalName').textContent = userProfile.displayName || 'Sandy User';
  document.getElementById('profModalHandle').textContent = `@${(userProfile.username || 'sandy_user').replace(/^@/, '')}`;
  document.getElementById('profDisplayName').value = userProfile.displayName || '';
  document.getElementById('profUsername').value = userProfile.username || '';
  document.getElementById('profEmail').value = userProfile.email || '';
  document.getElementById('profGender').value = userProfile.gender || 'Prefer not to say';
  document.getElementById('profDob').value = userProfile.dob || '';
  document.getElementById('profGoal').value = userProfile.goal || 'Build Upright Sitting Habit';
  document.getElementById('profMedical').value = userProfile.medicalNotes || '';

  const modalAv = document.getElementById('profModalAvatar');
  if (userProfile.photoURL) {
    modalAv.innerHTML = `<img src="${escapeHtml(userProfile.photoURL)}" alt="PFP" />`;
  } else {
    modalAv.textContent = (userProfile.displayName || 'S').slice(0, 1).toUpperCase();
  }
  openModal('modalProfile');
}

function handleProfilePhotoUpload(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const size = 256;
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      const minSide = Math.min(img.width, img.height);
      const sx = (img.width - minSide) / 2;
      const sy = (img.height - minSide) / 2;
      ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, size, size);
      const compressed = canvas.toDataURL('image/jpeg', 0.78);
      userProfile.photoURL = compressed;
      document.getElementById('profModalAvatar').innerHTML = `<img src="${compressed}" alt="PFP" />`;
      syncProfileUI();
      if (fbDb && currentUser?.uid) {
        fbDb.collection('users').doc(currentUser.uid).set({ photoURL: compressed }, { merge: true }).catch(() => {});
      }
      localStorage.setItem('sandy_desktop_profile', JSON.stringify(userProfile));
      showToast('Profile photo updated!');
    };
    img.src = reader.result;
  };
  reader.readAsDataURL(file);
}

async function saveUserProfileChanges(e) {
  e.preventDefault();
  userProfile.displayName = document.getElementById('profDisplayName').value.trim();
  userProfile.username = document.getElementById('profUsername').value.trim().replace(/^@/, '');
  userProfile.gender = document.getElementById('profGender').value;
  userProfile.dob = document.getElementById('profDob').value.trim();
  userProfile.goal = document.getElementById('profGoal').value;
  userProfile.medicalNotes = document.getElementById('profMedical').value.trim();

  localStorage.setItem('sandy_desktop_profile', JSON.stringify(userProfile));
  if (fbDb && currentUser?.uid) {
    try {
      await fbDb.collection('users').doc(currentUser.uid).set(userProfile, { merge: true });
    } catch (_) {}
  }
  syncProfileUI();
  closeModal('modalProfile');
  showToast('Profile saved & synced to Firestore!');
}

async function handleSignOut() {
  document.getElementById('pfpDropdownMenu').classList.remove('open');
  stopLiveMonitor();
  try {
    if (fbAuth) await fbAuth.signOut();
  } catch (_) {}
  currentUser = null;
  showSplashView();
  showToast('Signed out of Sandy.');
}

// Interactive Tutorial Controls
function openTutorialModal(startIndex = 0) {
  tutorialIndex = startIndex;
  renderTutorialStep();
  openModal('modalTutorial');
}

function closeTutorialModal() {
  closeModal('modalTutorial');
  navigateToSection('menu');
}

function stepTutorial(delta) {
  const next = tutorialIndex + delta;
  if (next < 0) return;
  if (next >= TUTORIAL_STEPS.length) {
    closeTutorialModal();
    showToast('Tutorial complete! Welcome to Sandy.');
    return;
  }
  tutorialIndex = next;
  renderTutorialStep();
}

function renderTutorialStep() {
  const step = TUTORIAL_STEPS[tutorialIndex];
  document.getElementById('tutStepCounter').textContent = `TUTORIAL ${tutorialIndex + 1} OF ${TUTORIAL_STEPS.length}`;
  document.getElementById('tutIconWrap').innerHTML = `<i class="bi ${step.icon}"></i>`;
  document.getElementById('tutTitle').textContent = step.title;
  document.getElementById('tutBody').textContent = step.body;

  const dots = document.getElementById('tutDots');
  dots.innerHTML = TUTORIAL_STEPS.map((_, idx) => `<span class="${idx === tutorialIndex ? 'active' : ''}"></span>`).join('');

  document.getElementById('btnTutPrev').style.visibility = tutorialIndex === 0 ? 'hidden' : 'visible';
  document.getElementById('btnTutNext').innerHTML =
    tutorialIndex === TUTORIAL_STEPS.length - 1
      ? 'Start Using Sandy <i class="bi bi-check2-circle"></i>'
      : 'Next <i class="bi bi-arrow-right"></i>';
}

// ============================================================================
// LEFT SIDEBAR RAIL WITH ANIMATED CIRCLE + SMOOTH VERTICAL SCROLL
// ============================================================================
function moveSidebarCircleTo(sectionId) {
  activeSection = sectionId;
  const nav = document.getElementById('railNav');
  const circle = document.getElementById('railCircle');
  const buttons = Array.from(nav.querySelectorAll('.rail-btn'));
  const targetBtn = buttons.find(b => b.dataset.section === sectionId);
  if (!targetBtn || !circle) return;

  buttons.forEach(b => b.classList.toggle('active', b === targetBtn));
  const offsetY = targetBtn.offsetTop;
  circle.style.transform = `translate(-50%, ${offsetY}px)`;
}

function navigateToSection(sectionId, instant = false) {
  moveSidebarCircleTo(sectionId);
  const targetEl = document.getElementById(`sec-${sectionId}`);
  const viewport = document.getElementById('mainViewport');
  if (!targetEl || !viewport) return;

  isProgrammaticScroll = true;
  viewport.scrollTo({
    top: targetEl.offsetTop,
    behavior: instant ? 'auto' : 'smooth'
  });
  setTimeout(() => { isProgrammaticScroll = false; }, 650);

  // Auto-wake Colab services when entering Interface, Chatbot, or Report
  if (appSettings.autoWake) {
    if (sectionId === 'interface') wakeColabServices('yolo');
    if (sectionId === 'chatbot' || sectionId === 'report') wakeColabServices('qwen');
  }
  if (sectionId === 'report') {
    refreshReportData(false);
  }
}

function setupScrollObserver() {
  const viewport = document.getElementById('mainViewport');
  if (!viewport) return;

  const observer = new IntersectionObserver(
    (entries) => {
      if (isProgrammaticScroll) return;
      let best = null;
      for (const entry of entries) {
        if (entry.isIntersecting && (!best || entry.intersectionRatio > best.intersectionRatio)) {
          best = entry;
        }
      }
      if (best?.target?.dataset?.section) {
        moveSidebarCircleTo(best.target.dataset.section);
      }
    },
    { root: viewport, threshold: [0.45, 0.65] }
  );

  document.querySelectorAll('.app-section').forEach(sec => observer.observe(sec));
}

// ============================================================================
// DEVICES TAB (SIDEWAYS BEVELED LIST + TOP-LEFT 3-DOT MENU + RED ADD DEVICE)
// ============================================================================
function getDevicesStorageKey() {
  return `sandy_devices_${userProfile.uid || 'local'}`;
}

function loadDevicesFromStorage() {
  try {
    const raw = localStorage.getItem(getDevicesStorageKey());
    devicesList = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(devicesList)) devicesList = [];
  } catch (_) {
    devicesList = [];
  }
}

function saveDevicesToStorage() {
  localStorage.setItem(getDevicesStorageKey(), JSON.stringify(devicesList));
  refreshInterfaceDeviceDropdown();
  updateMenuConnectedDeviceSummary();
}

function updateMenuConnectedDeviceSummary() {
  const connected = devicesList.filter(d => d.status === 'Connected');
  const el = document.getElementById('menuActiveDeviceText');
  if (!el) return;
  if (connected.length === 0) {
    el.textContent = 'Connected Bluetooth Device: None';
  } else {
    el.textContent = `Connected Bluetooth Device: ${connected.map(d => d.name).join(', ')}`;
  }
}

function renderDevicesList() {
  const wrap = document.getElementById('devicesListContainer');
  if (!wrap) return;

  updateMenuConnectedDeviceSummary();

  if (devicesList.length === 0) {
    wrap.innerHTML = `
      <div class="no-device-state">
        <i class="bi bi-bluetooth"></i>
        <div class="font-display" style="font-size:1.5rem; font-weight:700; color:var(--text-hi);">No device</div>
        <div style="font-size:0.86rem; color:var(--text-soft); max-width:360px;">
          No posture detection device has been connected yet or history was cleared. Click the red <strong>Add Device</strong> button above to pair one.
        </div>
      </div>
    `;
    return;
  }

  wrap.innerHTML = devicesList.map(dev => {
    const statusLower = String(dev.status || 'Disconnected').toLowerCase();
    const stateClass = statusLower === 'connected' ? 'is-connected' : statusLower === 'pairing' ? 'is-pairing' : 'is-disconnected';
    const badgeClass = statusLower === 'connected' ? 'good' : statusLower === 'pairing' ? 'warn' : 'bad';
    const toggleBtnText = statusLower === 'connected' ? 'Disconnect' : statusLower === 'pairing' ? 'Pairing...' : 'Connect';
    const isMenuOpen = openDeviceMenuId === dev.id;

    return `
      <div class="device-bevel-wrap">
        <!-- TOP-LEFT 3-DOT BUTTON -->
        <button type="button" class="device-dots-btn" onclick="toggleDeviceDotsMenu(event, '${escapeHtml(dev.id)}')" title="Device Options">
          <i class="bi bi-three-dots-vertical"></i>
        </button>

        <!-- DROPDOWN MENU: Preferences, Rename, Delete -->
        <div class="device-dots-menu ${isMenuOpen ? 'open' : ''}" id="devMenu_${escapeHtml(dev.id)}">
          <button type="button" onclick="openDevicePrefsModal('${escapeHtml(dev.id)}')">
            <i class="bi bi-sliders2"></i> Preferences
          </button>
          <button type="button" onclick="openRenameDeviceModal('${escapeHtml(dev.id)}')">
            <i class="bi bi-pencil-square"></i> Rename
          </button>
          <button type="button" class="danger" onclick="deleteDeviceById('${escapeHtml(dev.id)}')">
            <i class="bi bi-trash3"></i> Delete
          </button>
        </div>

        <!-- SIDEWAYS BEVELED BAR -->
        <div class="device-bevel-box ${stateClass}">
          <div class="device-main-info">
            <div class="device-icon-badge">
              <i class="bi bi-cpu-fill"></i>
            </div>
            <div class="device-fields">
              <div>
                <div class="device-field-label">DEVICE NAME</div>
                <div class="device-field-value">${escapeHtml(dev.name)}</div>
              </div>
              <div>
                <div class="device-field-label">MODEL</div>
                <div class="device-field-value" style="font-weight:500; color:#CBD5E1;">${escapeHtml(dev.model)}</div>
              </div>
              <div>
                <div class="device-field-label">CONNECTION</div>
                <div style="margin-top:3px;">
                  <span class="status-pill ${badgeClass}">
                    <i class="bi bi-circle-fill" style="font-size:0.48rem;"></i>
                    ${escapeHtml(dev.status)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <button type="button" class="btn-glass" style="padding:8px 15px; font-size:0.80rem; flex-shrink:0;"
            onclick="toggleDeviceConnection('${escapeHtml(dev.id)}')" ${statusLower === 'pairing' ? 'disabled' : ''}>
            ${toggleBtnText}
          </button>
        </div>
      </div>
    `;
  }).join('');
}

function toggleDeviceDotsMenu(event, id) {
  event.stopPropagation();
  openDeviceMenuId = openDeviceMenuId === id ? null : id;
  renderDevicesList();
}

function openAddDeviceModal() {
  document.getElementById('bleScanResults').classList.add('hidden');
  document.getElementById('bleScanResults').innerHTML = '';
  openModal('modalAddDevice');
}

function openHowToAddModal() {
  openModal('modalHowToAdd');
}

async function scanBluetoothDevices() {
  const resultsEl = document.getElementById('bleScanResults');
  resultsEl.classList.remove('hidden');
  resultsEl.innerHTML = `<div class="font-mono" style="font-size:0.80rem; color:var(--accent);"><i class="bi bi-broadcast"></i> Scanning for nearby Bluetooth posture sensors...</div>`;

  if (!navigator.bluetooth) {
    resultsEl.innerHTML = `<div style="font-size:0.82rem; color:var(--neon-amber);">Web Bluetooth adapter unavailable on this system. You can still pair your device manually below.</div>`;
    return;
  }

  try {
    const bleDevice = await navigator.bluetooth.requestDevice({
      acceptAllDevices: true,
      optionalServices: ['battery_service', 'device_information']
    });

    const newDev = {
      id: `dev_${Date.now()}`,
      name: bleDevice.name || 'Sandy Posture Sensor',
      model: 'ESP32-S3-WROOM-1-N16R8',
      dateMade: '2026-10',
      firmware: 'v2.4.0-sandy',
      protocol: 'Bluetooth LE 5.0',
      hardwareId: bleDevice.id || `BLE-${Math.random().toString(16).slice(2, 10).toUpperCase()}`,
      streamUrl: '',
      status: 'Pairing',
      lastConnected: new Date().toLocaleString()
    };

    devicesList.unshift(newDev);
    saveDevicesToStorage();
    renderDevicesList();
    closeModal('modalAddDevice');
    showToast(`Pairing ${newDev.name} via Bluetooth...`);

    try {
      if (bleDevice.gatt) await bleDevice.gatt.connect();
    } catch (_) {}

    setTimeout(() => {
      newDev.status = 'Connected';
      newDev.lastConnected = new Date().toLocaleString();
      saveDevicesToStorage();
      renderDevicesList();
      showToast(`${newDev.name} connected! Now available in Live Interface.`);
    }, 1100);
  } catch (err) {
    resultsEl.innerHTML = `<div style="font-size:0.82rem; color:var(--text-soft);">Scan stopped (${escapeHtml(err.message || 'cancelled')}). You can select a discovered device above or register manually below.</div>`;
  }
}

function handleManualAddDevice(e) {
  e.preventDefault();
  const name = document.getElementById('addDevName').value.trim();
  const model = document.getElementById('addDevModel').value.trim() || 'ESP32-S3-WROOM-1-N16R8';
  const dateMade = document.getElementById('addDevMade').value.trim() || '2026-10';
  const streamUrl = document.getElementById('addDevStream').value.trim();

  const newDev = {
    id: `dev_${Date.now()}`,
    name,
    model,
    dateMade,
    firmware: 'v2.4.0-sandy',
    protocol: 'Bluetooth LE 5.0 + Wi-Fi',
    hardwareId: `SND-${Math.random().toString(16).slice(2, 10).toUpperCase()}`,
    streamUrl,
    status: 'Pairing',
    lastConnected: new Date().toLocaleString()
  };

  devicesList.unshift(newDev);
  saveDevicesToStorage();
  renderDevicesList();
  closeModal('modalAddDevice');
  document.getElementById('addDevName').value = '';
  document.getElementById('addDevStream').value = '';
  showToast(`Pairing ${name}...`);

  setTimeout(() => {
    newDev.status = 'Connected';
    newDev.lastConnected = new Date().toLocaleString();
    saveDevicesToStorage();
    renderDevicesList();
    showToast(`${name} is now Connected!`);
  }, 1300);
}

function toggleDeviceConnection(id) {
  const dev = devicesList.find(d => d.id === id);
  if (!dev) return;

  if (dev.status === 'Connected') {
    dev.status = 'Disconnected';
    if (activeInterfaceDeviceId === id && isMonitoring) stopLiveMonitor();
    saveDevicesToStorage();
    renderDevicesList();
    showToast(`${dev.name} disconnected.`);
  } else {
    dev.status = 'Pairing';
    renderDevicesList();
    setTimeout(() => {
      dev.status = 'Connected';
      dev.lastConnected = new Date().toLocaleString();
      saveDevicesToStorage();
      renderDevicesList();
      showToast(`${dev.name} connected!`);
    }, 1000);
  }
}

function openDevicePrefsModal(id) {
  openDeviceMenuId = null;
  renderDevicesList();
  const dev = devicesList.find(d => d.id === id);
  if (!dev) return;

  const rows = [
    ['Device Name', dev.name],
    ['Model Type', dev.model],
    ['Date Made', dev.dateMade || '2026-10'],
    ['Firmware Version', dev.firmware || 'v2.4.0-sandy'],
    ['Connection Protocol', dev.protocol || 'Bluetooth LE 5.0'],
    ['Hardware / Serial ID', dev.hardwareId || 'N/A'],
    ['Current Status', dev.status],
    ['Last Connected', dev.lastConnected || 'Never'],
    ['Camera Stream Endpoint', dev.streamUrl || 'Paired Windows Camera / BLE Feed']
  ];

  document.getElementById('devicePrefsBody').innerHTML = rows.map(([k, v]) => `
    <div class="glass-sub" style="padding:11px 14px; display:flex; justify-content:space-between; gap:12px;">
      <span class="font-mono" style="font-size:0.76rem; color:var(--text-soft);">${escapeHtml(k)}</span>
      <span style="font-size:0.84rem; font-weight:600; color:var(--text-hi); text-align:right;">${escapeHtml(v)}</span>
    </div>
  `).join('');

  openModal('modalDevicePrefs');
}

function openRenameDeviceModal(id) {
  openDeviceMenuId = null;
  renderDevicesList();
  const dev = devicesList.find(d => d.id === id);
  if (!dev) return;
  document.getElementById('renameDevId').value = dev.id;
  document.getElementById('renameDevInput').value = dev.name;
  openModal('modalRenameDevice');
}

function submitRenameDevice(e) {
  e.preventDefault();
  const id = document.getElementById('renameDevId').value;
  const newName = document.getElementById('renameDevInput').value.trim();
  const dev = devicesList.find(d => d.id === id);
  if (dev && newName) {
    dev.name = newName;
    saveDevicesToStorage();
    renderDevicesList();
    showToast(`Renamed device to "${newName}".`);
  }
  closeModal('modalRenameDevice');
}

function deleteDeviceById(id) {
  openDeviceMenuId = null;
  if (activeInterfaceDeviceId === id && isMonitoring) stopLiveMonitor();
  devicesList = devicesList.filter(d => d.id !== id);
  saveDevicesToStorage();
  renderDevicesList();
  showToast('Device removed from history.');
}

// ============================================================================
// LIVE INTERFACE (MINIMAL FRONT + BACKEND COLAB YOLOv5 & AUTO-RECORDING)
// ============================================================================
function refreshInterfaceDeviceDropdown() {
  const select = document.getElementById('interfaceDeviceSelect');
  if (!select) return;

  const connectedDevices = devicesList.filter(d => d.status === 'Connected');
  if (connectedDevices.length === 0) {
    select.innerHTML = `<option value="">No Bluetooth device connected (Pair in Devices tab)</option>`;
    activeInterfaceDeviceId = '';
    return;
  }

  select.innerHTML = connectedDevices.map(d =>
    `<option value="${escapeHtml(d.id)}">${escapeHtml(d.name)} (${escapeHtml(d.model)})</option>`
  ).join('');

  if (!connectedDevices.some(d => d.id === activeInterfaceDeviceId)) {
    activeInterfaceDeviceId = connectedDevices[0].id;
  }
  select.value = activeInterfaceDeviceId;
}

function handleInterfaceDeviceChange(devId) {
  activeInterfaceDeviceId = devId;
  if (isMonitoring) {
    stopLiveMonitor();
    startLiveMonitor();
  }
}

function setLiveReadingUI(state) {
  currentPostureState = state;
  const bar = document.getElementById('liveReadingBar');
  const txt = document.getElementById('liveReadingText');
  const box = document.getElementById('cameraFrameBox');

  bar.classList.remove('good', 'bad');
  box.classList.remove('state-good', 'state-bad');

  if (state === 'GOOD') {
    bar.classList.add('good');
    box.classList.add('state-good');
    txt.textContent = 'GOOD';
  } else if (state === 'BAD') {
    bar.classList.add('bad');
    box.classList.add('state-bad');
    txt.textContent = 'BAD';
  } else {
    txt.textContent = 'WAITING';
  }
}

async function toggleLiveMonitor() {
  if (isMonitoring) {
    stopLiveMonitor();
  } else {
    await startLiveMonitor();
  }
}

async function startLiveMonitor() {
  const selectedId = document.getElementById('interfaceDeviceSelect').value;
  if (!selectedId) {
    showToast('Connect a Bluetooth device in the Devices tab first.');
    navigateToSection('devices');
    return;
  }
  const dev = devicesList.find(d => d.id === selectedId);
  if (!dev) return;

  // Auto-wake Colab YOLOv5 silently in backend
  if (appSettings.autoWake) wakeColabServices('yolo');

  const video = document.getElementById('liveCameraVideo');
  const espImg = document.getElementById('liveEspImg');
  const placeholder = document.getElementById('cameraPlaceholder');

  isMonitoring = true;
  document.getElementById('btnInterfaceCircle').classList.add('running');
  document.getElementById('interfaceCircleIcon').className = 'bi bi-stop-fill';
  setLiveReadingUI('WAITING');

  if (dev.streamUrl) {
    // ESP32 HTTP Snapshot Stream mode
    video.style.display = 'none';
    espImg.style.display = 'block';
    placeholder.classList.add('hidden');
    espPollTimer = setInterval(() => {
      espImg.src = `${dev.streamUrl}${dev.streamUrl.includes('?') ? '&' : '?'}t=${Date.now()}`;
    }, 650);
  } else {
    // Paired Desktop Camera Stream mode
    try {
      cameraStream = await navigator.mediaDevices.getUserMedia({ video: { width: 1280, height: 720 }, audio: false });
      video.srcObject = cameraStream;
      await video.play();
      espImg.style.display = 'none';
      video.style.display = 'block';
      placeholder.classList.add('hidden');

      if (appSettings.autoRecord) {
        startBackgroundVideoClips(cameraStream, dev.name);
      }
    } catch (err) {
      showToast(`Camera access failed: ${err.message}`);
      stopLiveMonitor();
      return;
    }
  }

  // Silent backend YOLOv5 inference loop
  yoloLoopTimer = setInterval(() => runBackendYoloCycle(dev), 1300);
}

function stopLiveMonitor() {
  isMonitoring = false;
  clearInterval(yoloLoopTimer);
  clearInterval(espPollTimer);
  clearInterval(videoClipTimer);
  yoloLoopTimer = null;
  espPollTimer = null;
  videoClipTimer = null;

  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    try { mediaRecorder.stop(); } catch (_) {}
  }
  mediaRecorder = null;

  if (cameraStream) {
    cameraStream.getTracks().forEach(t => t.stop());
    cameraStream = null;
  }

  const video = document.getElementById('liveCameraVideo');
  const espImg = document.getElementById('liveEspImg');
  const overlay = document.getElementById('liveCameraOverlay');
  if (video) { video.srcObject = null; video.style.display = 'none'; }
  if (espImg) espImg.style.display = 'none';
  if (overlay) {
    const ctx = overlay.getContext('2d');
    ctx.clearRect(0, 0, overlay.width, overlay.height);
  }
  document.getElementById('cameraPlaceholder').classList.remove('hidden');
  document.getElementById('btnInterfaceCircle').classList.remove('running');
  document.getElementById('interfaceCircleIcon').className = 'bi bi-person-standing';
  setLiveReadingUI('WAITING');
  slouchStartAt = null;
}

// Background automatic short video clip recorder (saved locally for Report tab)
function startBackgroundVideoClips(stream, deviceName) {
  const startOneClip = () => {
    if (!isMonitoring || !stream || !window.MediaRecorder) return;
    try {
      recordedChunks = [];
      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp8') ? 'video/webm;codecs=vp8' : 'video/webm';
      mediaRecorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 650000 });
      mediaRecorder.ondataavailable = (ev) => {
        if (ev.data && ev.data.size > 0) recordedChunks.push(ev.data);
      };
      mediaRecorder.onstop = async () => {
        if (!recordedChunks.length || !window.sandyAPI?.saveRecording) return;
        const blob = new Blob(recordedChunks, { type: 'video/webm' });
        const reader = new FileReader();
        reader.onloadend = async () => {
          await window.sandyAPI.saveRecording({
            mediaType: 'video',
            dataUrl: reader.result,
            posture: currentPostureState === 'BAD' ? 'BAD' : 'GOOD',
            confidence: 0.90,
            deviceName,
            durationSec: 6,
            uid: userProfile.uid || 'local'
          });
        };
        reader.readAsDataURL(blob);
      };
      mediaRecorder.start();
      setTimeout(() => {
        if (mediaRecorder && mediaRecorder.state === 'recording') {
          try { mediaRecorder.stop(); } catch (_) {}
        }
      }, 6000);
    } catch (_) {}
  };

  // Capture a 6-second posture video clip every 45 seconds silently
  setTimeout(startOneClip, 4000);
  videoClipTimer = setInterval(startOneClip, 45000);
}

async function runBackendYoloCycle(dev) {
  if (!isMonitoring) return;
  const video = document.getElementById('liveCameraVideo');
  const espImg = document.getElementById('liveEspImg');
  const sourceEl = dev.streamUrl ? espImg : video;
  if (!sourceEl) return;

  const vw = dev.streamUrl ? espImg.naturalWidth : video.videoWidth;
  const vh = dev.streamUrl ? espImg.naturalHeight : video.videoHeight;
  if (!vw || !vh) return;

  const captureCanvas = document.createElement('canvas');
  captureCanvas.width = 480;
  captureCanvas.height = Math.round((vh / vw) * 480);
  const cctx = captureCanvas.getContext('2d');
  cctx.drawImage(sourceEl, 0, 0, captureCanvas.width, captureCanvas.height);

  let isBad = false;
  let confidence = 0.0;
  let detections = [];
  let classified = false;

  const yoloUrl = (CFG.colabApiUrl || '').trim().replace(/\/$/, '');
  if (yoloUrl && !yoloUrl.includes('xxxx.ngrok')) {
    try {
      const blob = await new Promise(res => captureCanvas.toBlob(res, 'image/jpeg', 0.72));
      const fd = new FormData();
      fd.append('file', blob, 'frame.jpg');
      const resp = await fetch(`${yoloUrl}/infer`, {
        method: 'POST',
        headers: { 'ngrok-skip-browser-warning': 'true' },
        body: fd
      });
      if (resp.ok) {
        const data = await resp.json();
        document.getElementById('pillYoloStatus').innerHTML = `<i class="bi bi-cpu"></i> YOLOv5: Online`;
        document.getElementById('pillYoloStatus').className = 'status-pill good';
        detections = Array.isArray(data.detections) ? data.detections : [];
        if (data.class_id === 1 || data.class_name === 'sitting_bad') {
          isBad = true;
          confidence = Number(data.confidence || 0.85);
          classified = true;
        } else if (data.class_id === 0 || data.class_name === 'sitting_good') {
          isBad = false;
          confidence = Number(data.confidence || 0.88);
          classified = true;
        }
      }
    } catch (_) {}
  }

  // Draw bounding boxes cleanly onto the camera overlay
  drawDetectionsOverlay(detections, captureCanvas.width, captureCanvas.height);

  if (!classified) return;

  const newState = isBad ? 'BAD' : 'GOOD';
  setLiveReadingUI(newState);

  let slouchTriggered = false;
  if (isBad) {
    if (!slouchStartAt) slouchStartAt = Date.now();
    const elapsedSec = (Date.now() - slouchStartAt) / 1000;
    if (elapsedSec >= appSettings.slouchSeconds && Date.now() - lastChimeAt > 12000) {
      playSlouchChime();
      lastChimeAt = Date.now();
      slouchTriggered = true;
    }
  } else {
    slouchStartAt = null;
  }

  // Record daily YOLOv5 telemetry silently in backend (local + Firestore)
  recordDailyMetric(isBad, confidence, slouchTriggered);

  // Auto-save posture snapshot image periodically or whenever slouch triggers
  const now = Date.now();
  if (appSettings.autoRecord && (slouchTriggered || now - lastSnapshotAt > 18000)) {
    lastSnapshotAt = now;
    if (window.sandyAPI?.saveRecording) {
      const snapUrl = captureCanvas.toDataURL('image/jpeg', 0.78);
      window.sandyAPI.saveRecording({
        mediaType: 'image',
        dataUrl: snapUrl,
        posture: newState,
        confidence,
        deviceName: dev.name,
        uid: userProfile.uid || 'local'
      }).catch(() => {});
    }
  }
}

function drawDetectionsOverlay(detections, srcW, srcH) {
  const overlay = document.getElementById('liveCameraOverlay');
  if (!overlay) return;
  overlay.width = overlay.clientWidth || 640;
  overlay.height = overlay.clientHeight || 360;
  const ctx = overlay.getContext('2d');
  ctx.clearRect(0, 0, overlay.width, overlay.height);
  if (!detections.length) return;

  const sx = overlay.width / srcW;
  const sy = overlay.height / srcH;

  detections.forEach(d => {
    const [x1, y1, x2, y2] = d.bbox || [0, 0, 0, 0];
    const isBad = d.class_id === 1 || d.class_name === 'sitting_bad';
    ctx.strokeStyle = isBad ? '#FF2A6D' : '#00FF66';
    ctx.lineWidth = 3;
    ctx.strokeRect(x1 * sx, y1 * sy, (x2 - x1) * sx, (y2 - y1) * sy);
  });
}

function recordDailyMetric(isBad, conf, slouchEvent) {
  const key = getTodayKey();
  const cur = dailyAnalyticsMap[key] || {
    date: key,
    good_frames: 0,
    bad_frames: 0,
    slouch_events: 0,
    conf_sum: 0,
    total_classified: 0,
    back_score: 0
  };
  if (isBad) cur.bad_frames += 1;
  else cur.good_frames += 1;
  if (slouchEvent) cur.slouch_events += 1;
  cur.conf_sum += conf;
  cur.total_classified += 1;
  cur.back_score = Math.round((cur.good_frames / Math.max(1, cur.total_classified)) * 100);
  dailyAnalyticsMap[key] = cur;

  localStorage.setItem(`sandy_analytics_${userProfile.uid || 'local'}`, JSON.stringify(dailyAnalyticsMap));
  document.getElementById('chatCtxScore').textContent = `${cur.back_score} / 100`;

  if (fbDb && currentUser?.uid) {
    fbDb
      .collection('posture_analytics')
      .doc(currentUser.uid)
      .collection('daily')
      .doc(key)
      .set(cur, { merge: true })
      .catch(() => {});
  }
}

// ============================================================================
// COLAB AUTO-WAKEUP ENGINE (YOLOv5 + QWEN3.6-35B)
// ============================================================================
async function wakeColabServices(target = 'all') {
  const yoloEp = (CFG.colabApiUrl || '').trim().replace(/\/$/, '');
  const qwenEp = (CFG.qwenApiUrl || '').trim().replace(/\/$/, '');

  if ((target === 'all' || target === 'yolo') && yoloEp && !yoloEp.includes('xxxx.ngrok')) {
    fetch(`${yoloEp}/api/wakeup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' },
      body: JSON.stringify({ service: 'yolo' })
    })
      .then(r => {
        if (r.ok) {
          const pill = document.getElementById('pillYoloStatus');
          pill.className = 'status-pill good';
          pill.innerHTML = `<i class="bi bi-cpu"></i> YOLOv5: Ready`;
        }
      })
      .catch(() => {});
  }

  if ((target === 'all' || target === 'qwen') && qwenEp && !qwenEp.includes('xxxx.ngrok')) {
    const label = document.getElementById('chatEngineLabel');
    if (label) label.textContent = 'Waking Colab Qwen3.6-35B...';
    fetch(`${qwenEp}/api/wakeup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' },
      body: JSON.stringify({ service: 'qwen' })
    })
      .then(r => {
        if (r.ok) {
          const pill = document.getElementById('pillQwenStatus');
          pill.className = 'status-pill good';
          pill.innerHTML = `<i class="bi bi-stars"></i> Qwen3.6: Ready`;
          if (label) label.textContent = 'Connected • Qwen3.6-35B-A3B-UD-Q4_K_M.gguf';
        }
      })
      .catch(() => {
        if (label) label.textContent = 'Colab Offline • Strict Posture Guardrail Active';
      });
  }
}

// ============================================================================
// AI CHATBOT TAB (EXACT STRICT OFF-TOPIC GUARDRAIL + QWEN3.6-35B)
// ============================================================================
function resetChatConversation() {
  chatHistory = [];
  const list = document.getElementById('chatMessagesList');
  if (!list) return;
  list.innerHTML = '';
  appendChatBubble(
    'assistant',
    "Hello! I'm Sandy AI, your dedicated posture, ergonomics, and spine wellness assistant powered by Qwen3.6-35B-A3B.\n\nAsk me anything about your back score, desk ergonomics, stretches, or posture-related medical questions!"
  );
}

function appendChatBubble(role, text) {
  const list = document.getElementById('chatMessagesList');
  const row = document.createElement('div');
  row.className = `chat-row ${role}`;

  const av = document.createElement('div');
  av.className = 'chat-avatar';
  av.innerHTML = role === 'assistant' ? '<i class="bi bi-stars"></i>' : (userProfile.displayName || 'U').slice(0, 1).toUpperCase();

  const bubble = document.createElement('div');
  bubble.className = 'chat-bubble selectable';
  bubble.textContent = text;

  row.appendChild(av);
  row.appendChild(bubble);
  list.appendChild(row);
  list.scrollTop = list.scrollHeight;
  return bubble;
}

function isOffTopicPrompt(text) {
  const lower = String(text || '').toLowerCase();
  return !CFG.onTopicKeywords.some(k => lower.includes(k));
}

function sendQuickChat(prompt) {
  document.getElementById('chatPromptInput').value = prompt;
  handleChatSubmit(new Event('submit'));
}

async function handleChatSubmit(e) {
  if (e && e.preventDefault) e.preventDefault();
  if (isChatBusy) return;

  const input = document.getElementById('chatPromptInput');
  const prompt = input.value.trim();
  if (!prompt) return;

  input.value = '';
  isChatBusy = true;
  document.getElementById('btnChatSend').disabled = true;

  appendChatBubble('user', prompt);
  chatHistory.push({ role: 'user', content: prompt });
  const botBubble = appendChatBubble('assistant', 'Thinking...');

  // Enforce strict topic boundary immediately for obvious off-topic requests
  if (isOffTopicPrompt(prompt)) {
    botBubble.textContent = CFG.offTopicRefusal;
    chatHistory.push({ role: 'assistant', content: CFG.offTopicRefusal });
    isChatBusy = false;
    document.getElementById('btnChatSend').disabled = false;
    return;
  }

  const todayData = dailyAnalyticsMap[getTodayKey()];
  const currentScore = todayData ? todayData.back_score : 80;
  const medNotes = [
    Array.isArray(userProfile.medicalConditions) ? userProfile.medicalConditions.join(', ') : '',
    userProfile.medicalNotes || ''
  ].filter(Boolean).join(' — ') || 'None reported';

  const qwenEp = (CFG.qwenApiUrl || CFG.colabApiUrl || '').trim().replace(/\/$/, '');
  if (qwenEp && !qwenEp.includes('xxxx.ngrok')) {
    try {
      const resp = await fetch(`${qwenEp}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' },
        body: JSON.stringify({
          messages: chatHistory.slice(-10),
          system_prompt: CFG.strictSystemPrompt,
          current_score: currentScore,
          user_goal: userProfile.goal || 'Build Upright Sitting Habit',
          medical_notes: medNotes
        })
      });
      if (resp.ok) {
        const data = await resp.json();
        const reply = data.answer || CFG.offTopicRefusal;
        botBubble.textContent = reply;
        chatHistory.push({ role: 'assistant', content: reply });
        if (data.engine) document.getElementById('chatEngineLabel').textContent = data.engine;
        isChatBusy = false;
        document.getElementById('btnChatSend').disabled = false;
        return;
      }
    } catch (_) {}
  }

  const fallback =
    `Based on your current back score (${currentScore}/100) and goal (${userProfile.goal || 'Build Upright Sitting Habit'}):\n\n` +
    `• Keep your ears stacked over your shoulders and the top of your monitor at eye level.\n` +
    `• Take a 60-second chin-tuck and shoulder-blade squeeze every 45 minutes.\n` +
    `• (Start your Colab Qwen3.6-35B notebook to get live deep AI coaching!)`;
  botBubble.textContent = fallback;
  chatHistory.push({ role: 'assistant', content: fallback });
  isChatBusy = false;
  document.getElementById('btnChatSend').disabled = false;
}

// ============================================================================
// REPORT TAB: DAILY/WEEKLY/MONTHLY/YEARLY + LACK-OF-DATA & DAY-1 COMPARISON + YOLO->QWEN + MEDIA GALLERY
// ============================================================================
function selectReportTimeframe(tf) {
  reportTimeframe = tf;
  document.querySelectorAll('#reportTimeframeBoxes .tf-box').forEach(b => {
    b.classList.toggle('active', b.dataset.tf === tf);
  });
  renderReportView();
}

function setMediaFilter(filter) {
  mediaFilter = filter;
  ['all', 'image', 'video'].forEach(f => {
    const btn = document.getElementById(`filter${f.charAt(0).toUpperCase() + f.slice(1)}`);
    if (btn) btn.style.borderColor = f === filter ? 'var(--accent)' : '';
  });
  renderMediaGallery();
}

async function refreshReportData(runAiAfter = false) {
  // 1. Load cached local daily analytics
  try {
    dailyAnalyticsMap = JSON.parse(localStorage.getItem(`sandy_analytics_${userProfile.uid || 'local'}`) || '{}') || {};
  } catch (_) {
    dailyAnalyticsMap = {};
  }

  // 2. Merge Firestore daily analytics
  if (fbDb && currentUser?.uid) {
    try {
      const snap = await fbDb.collection('posture_analytics').doc(currentUser.uid).collection('daily').get();
      snap.forEach(doc => {
        const d = doc.data();
        if (d && doc.id) dailyAnalyticsMap[doc.id] = { ...d, date: doc.id };
      });
    } catch (_) {}
  }

  // 3. Merge live Colab YOLOv5 analytics endpoint
  const yoloEp = (CFG.colabApiUrl || '').trim().replace(/\/$/, '');
  if (yoloEp && !yoloEp.includes('xxxx.ngrok')) {
    try {
      const r = await fetch(`${yoloEp}/api/analytics`, { headers: { 'ngrok-skip-browser-warning': 'true' } });
      if (r.ok) {
        const data = await r.json();
        const days = data.daily || data.days || {};
        Object.keys(days).forEach(k => {
          const v = days[k];
          if (v && typeof v === 'object') {
            const total = (v.good_frames || 0) + (v.bad_frames || 0);
            dailyAnalyticsMap[k] = {
              date: k,
              good_frames: v.good_frames || 0,
              bad_frames: v.bad_frames || 0,
              slouch_events: v.slouch_events || 0,
              total_classified: total,
              back_score: typeof v.back_score === 'number' ? v.back_score : (total > 0 ? Math.round((v.good_frames / total) * 100) : 0)
            };
          }
        });
      }
    } catch (_) {}
  }

  // 4. Load recorded images & videos from local app storage
  if (window.sandyAPI?.listRecordings) {
    try {
      recordedMediaList = await window.sandyAPI.listRecordings(userProfile.uid || 'local');
    } catch (_) {
      recordedMediaList = [];
    }
  }

  const todayRec = dailyAnalyticsMap[getTodayKey()];
  if (todayRec && typeof todayRec.back_score === 'number') {
    document.getElementById('chatCtxScore').textContent = `${todayRec.back_score} / 100`;
  }

  renderReportView();
  if (runAiAfter) {
    await runYoloToQwenReport();
  }
}

function getPeriodSlots(tf) {
  const now = new Date();
  const slots = [];

  if (tf === 'daily') {
    const key = getTodayKey();
    slots.push({ label: 'Today', keys: [key] });
  } else if (tf === 'weekly') {
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const k = d.toISOString().slice(0, 10);
      slots.push({ label: d.toLocaleDateString('en-US', { weekday: 'short' }), keys: [k] });
    }
  } else if (tf === 'monthly') {
    // 4 weeks across the last 28-30 days
    for (let w = 3; w >= 0; w--) {
      const keys = [];
      for (let dOffset = w * 7 + 6; dOffset >= w * 7; dOffset--) {
        const d = new Date(now);
        d.setDate(now.getDate() - dOffset);
        keys.push(d.toISOString().slice(0, 10));
      }
      slots.push({ label: w === 0 ? 'This Wk' : `Wk -${w}`, keys });
    }
  } else {
    // Yearly: 12 months
    for (let m = 11; m >= 0; m--) {
      const d = new Date(now.getFullYear(), now.getMonth() - m, 1);
      const prefix = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const keys = Object.keys(dailyAnalyticsMap).filter(k => k.startsWith(prefix));
      slots.push({
        label: d.toLocaleDateString('en-US', { month: 'short' }),
        keys: keys.length ? keys : [`${prefix}-01`]
      });
    }
  }
  return slots;
}

function computeReportSummary() {
  const slots = getPeriodSlots(reportTimeframe);
  let totalGood = 0, totalBad = 0, totalSlouch = 0;
  let slotsWithData = 0;

  const slotPoints = slots.map(slot => {
    let g = 0, b = 0, s = 0, hasData = false;
    slot.keys.forEach(k => {
      const rec = dailyAnalyticsMap[k];
      if (rec && ((rec.good_frames || 0) + (rec.bad_frames || 0) > 0 || rec.back_score > 0)) {
        hasData = true;
        g += rec.good_frames || 0;
        b += rec.bad_frames || 0;
        s += rec.slouch_events || 0;
      }
    });
    if (hasData) slotsWithData++;
    totalGood += g;
    totalBad += b;
    totalSlouch += s;
    const total = g + b;
    const score = hasData ? (total > 0 ? Math.round((g / total) * 100) : 0) : null;
    return { label: slot.label, score, hasData };
  });

  const totalFrames = totalGood + totalBad;
  const currentScore = totalFrames > 0 ? Math.round((totalGood / totalFrames) * 100) : null;

  // Earliest recorded day (Day 1 Baseline) across entire history
  const allRecordedDates = Object.keys(dailyAnalyticsMap)
    .filter(k => {
      const r = dailyAnalyticsMap[k];
      return r && ((r.good_frames || 0) + (r.bad_frames || 0) > 0);
    })
    .sort();

  const firstDateKey = allRecordedDates[0] || null;
  const firstDayRec = firstDateKey ? dailyAnalyticsMap[firstDateKey] : null;
  const firstDayScore = firstDayRec
    ? Math.round((firstDayRec.good_frames / Math.max(1, firstDayRec.good_frames + firstDayRec.bad_frames)) * 100)
    : null;

  const missingSlots = slots.length - slotsWithData;

  return {
    slots: slotPoints,
    slotsTotal: slots.length,
    slotsWithData,
    missingSlots,
    totalGood,
    totalBad,
    totalSlouch,
    currentScore,
    firstDateKey,
    firstDayScore
  };
}

function getScoreColor(score) {
  if (score === null || typeof score !== 'number') return '#64748B';
  if (score >= 80) return '#00FF66';
  if (score >= 55) return '#FFE600';
  return '#FF2A6D';
}

function renderReportView() {
  const summary = computeReportSummary();
  const tfTitle = reportTimeframe.charAt(0).toUpperCase() + reportTimeframe.slice(1);

  document.getElementById('repHeading').textContent = `${tfTitle} Back Score Report`;
  document.getElementById('repDataCoveragePill').textContent =
    `${summary.slotsWithData} / ${summary.slotsTotal} ${reportTimeframe === 'yearly' ? 'Months' : reportTimeframe === 'monthly' ? 'Weeks' : 'Days'} Logged`;

  // Ring Score
  const arc = document.getElementById('repMainArc');
  const circ = 402.12;
  const color = getScoreColor(summary.currentScore);
  arc.setAttribute('stroke', color);
  if (summary.currentScore === null) {
    arc.setAttribute('stroke-dashoffset', String(circ));
    document.getElementById('repRingScore').textContent = '--';
    document.getElementById('repRingScore').style.color = '#94A3B8';
    document.getElementById('repRingRating').textContent = 'NO DATA';
    document.getElementById('repRingRating').style.color = '#94A3B8';
  } else {
    arc.setAttribute('stroke-dashoffset', String(circ * (1 - summary.currentScore / 100)));
    document.getElementById('repRingScore').textContent = `${summary.currentScore}`;
    document.getElementById('repRingScore').style.color = color;
    const rating = summary.currentScore >= 80 ? 'GOOD' : summary.currentScore >= 55 ? 'AVERAGE' : 'BAD';
    document.getElementById('repRingRating').textContent = rating;
    document.getElementById('repRingRating').style.color = color;
  }

  document.getElementById('repGoodFrames').textContent = String(summary.totalGood);
  document.getElementById('repBadFrames').textContent = String(summary.totalBad);
  document.getElementById('repSlouchAlerts').textContent = String(summary.totalSlouch);

  // Trend Bars (explicitly shows dashed placeholder bars when days lack data)
  const barsWrap = document.getElementById('repTrendBars');
  barsWrap.innerHTML = summary.slots.map(pt => {
    const h = pt.hasData ? Math.max(12, pt.score) : 28;
    const bg = pt.hasData ? getScoreColor(pt.score) : 'transparent';
    return `
      <div class="trend-col" title="${pt.label}: ${pt.hasData ? pt.score + '/100' : 'No data recorded'}">
        <span class="font-mono" style="font-size:0.66rem; color:${pt.hasData ? bg : '#64748B'};">${pt.hasData ? pt.score : '—'}</span>
        <div class="trend-bar-fill ${pt.hasData ? '' : 'missing'}" style="height:${h}%; background:${bg};"></div>
        <span class="font-mono" style="font-size:0.65rem; color:var(--text-soft);">${pt.label}</span>
      </div>
    `;
  }).join('');

  // Lack-of-data notice + First-Day Baseline Comparison Box
  const lackNotice = document.getElementById('repLackDataNotice');
  if (reportTimeframe !== 'daily' && summary.missingSlots > 0) {
    lackNotice.classList.remove('hidden');
    lackNotice.innerHTML = `
      <i class="bi bi-info-circle-fill"></i>
      <strong>Partial ${tfTitle} Data:</strong> ${summary.missingSlots} of ${summary.slotsTotal} periods lack posture logs.
      Showing your <strong>Day-1 Baseline comparison</strong> below so you can still track whether your posture is improving or declining.
    `;
  } else {
    lackNotice.classList.add('hidden');
  }

  const deltaBadge = document.getElementById('repFirstDayDeltaBadge');
  if (summary.firstDayScore !== null && summary.currentScore !== null) {
    const delta = summary.currentScore - summary.firstDayScore;
    document.getElementById('repFirstDayScore').textContent = `${summary.firstDayScore} / 100`;
    document.getElementById('repFirstDayScore').style.color = getScoreColor(summary.firstDayScore);
    document.getElementById('repFirstDayDate').textContent = `First recorded: ${summary.firstDateKey}`;
    document.getElementById('repCurrentCompareScore').textContent = `${summary.currentScore} / 100`;
    document.getElementById('repCurrentCompareScore').style.color = color;

    if (delta > 0) {
      deltaBadge.className = 'status-pill good';
      deltaBadge.textContent = `+${delta}% Better vs Day 1`;
      document.getElementById('repTrendSummary').textContent = 'Posture improved since Day 1';
      document.getElementById('repFirstDayExplain').textContent =
        `Your posture improved by +${delta}% compared to your very first recorded session (${summary.firstDateKey}). Keep maintaining upright breaks!`;
    } else if (delta < 0) {
      deltaBadge.className = 'status-pill bad';
      deltaBadge.textContent = `${delta}% Drop vs Day 1`;
      document.getElementById('repTrendSummary').textContent = 'More slouching than Day 1';
      document.getElementById('repFirstDayExplain').textContent =
        `Your average score dipped ${Math.abs(delta)}% below Day 1 (${summary.firstDateKey}). Check your monitor height and take a short shoulder stretch.`;
    } else {
      deltaBadge.className = 'status-pill cyan';
      deltaBadge.textContent = `0% Same as Day 1`;
      document.getElementById('repTrendSummary').textContent = 'Steady alignment vs Day 1';
      document.getElementById('repFirstDayExplain').textContent =
        `Your ${tfTitle.toLowerCase()} posture score matches your Day 1 baseline (${summary.firstDayScore}/100).`;
    }
  } else {
    deltaBadge.className = 'status-pill warn';
    deltaBadge.textContent = 'Awaiting Day 1 Data';
    document.getElementById('repFirstDayScore').textContent = '--';
    document.getElementById('repFirstDayDate').textContent = 'No session recorded yet';
    document.getElementById('repCurrentCompareScore').textContent = '--';
    document.getElementById('repTrendSummary').textContent = 'Start Live Interface to begin logging';
  }

  renderMediaGallery();
}

// Pipeline: YOLOv5 Data -> Qwen3.6-35B -> Report Box
async function runYoloToQwenReport() {
  const outEl = document.getElementById('repQwenAnalysisText');
  const btn = document.getElementById('btnRunQwenReport');
  btn.disabled = true;
  outEl.textContent = 'Sending YOLOv5 telemetry & Day-1 baseline to Qwen3.6-35B-A3B...';

  const s = computeReportSummary();
  const cur = s.currentScore ?? 0;
  const prev = s.firstDayScore ?? cur;
  const delta = cur - prev;
  const medNotes = [
    Array.isArray(userProfile.medicalConditions) ? userProfile.medicalConditions.join(', ') : '',
    userProfile.medicalNotes || ''
  ].filter(Boolean).join(' — ') || 'None reported';

  const question =
    `Analyze my ${reportTimeframe.toUpperCase()} YOLOv5 posture report. ` +
    `Logged periods: ${s.slotsWithData}/${s.slotsTotal} (${s.missingSlots} lacking data). ` +
    `Compare my current score (${cur}/100) against Day 1 (${prev}/100, change ${delta >= 0 ? '+' : ''}${delta}%), explain how good or bad my posture has been, and give 3 concise action steps.`;

  const qwenEp = (CFG.qwenApiUrl || CFG.colabApiUrl || '').trim().replace(/\/$/, '');
  if (qwenEp && !qwenEp.includes('xxxx.ngrok')) {
    try {
      const resp = await fetch(`${qwenEp}/api/ai-analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' },
        body: JSON.stringify({
          timeframe: reportTimeframe,
          current_score: cur,
          previous_score: prev,
          delta,
          good_frames: s.totalGood,
          bad_frames: s.totalBad,
          slouch_events: s.totalSlouch,
          user_goal: userProfile.goal || 'Build Upright Sitting Habit',
          medical_notes: medNotes,
          question
        })
      });
      if (resp.ok) {
        const data = await resp.json();
        outEl.textContent = data.answer || 'Report analyzed.';
        btn.disabled = false;
        return;
      }
    } catch (_) {}
  }

  // Clean local pipeline summary if Colab Qwen is offline
  const statusWord = s.currentScore === null ? 'No posture frames logged yet' : cur >= 80 ? 'Good (Green)' : cur >= 55 ? 'Average (Yellow)' : 'Needs Attention (Red)';
  outEl.textContent =
    `[YOLOv5 → Qwen3.6 Report Summary — ${reportTimeframe.toUpperCase()}]\n` +
    `• Status: ${statusWord} (${cur}/100) across ${s.slotsWithData}/${s.slotsTotal} logged periods.\n` +
    `• Day-1 Comparison: ${delta >= 0 ? '+' : ''}${delta}% vs first recorded session (${prev}/100).\n` +
    `• Detections: ${s.totalGood} upright frames, ${s.totalBad} slouch frames, ${s.totalSlouch} alerts.\n` +
    `• Tip for "${userProfile.goal || 'Build Upright Sitting Habit'}": Raise screen height to eye level and reset shoulders every 45 min.`;
  btn.disabled = false;
}

// Recorded Images & Videos Gallery filtered by Daily / Weekly / Monthly / Yearly
function filterMediaByTimeframe(items) {
  const now = Date.now();
  const msDay = 86400000;
  const maxAge =
    reportTimeframe === 'daily' ? msDay :
    reportTimeframe === 'weekly' ? msDay * 7 :
    reportTimeframe === 'monthly' ? msDay * 30 :
    msDay * 365;

  return items.filter(item => {
    const ts = item.timestamp || new Date(item.dateKey || Date.now()).getTime();
    const inPeriod = reportTimeframe === 'daily'
      ? (item.dateKey === getTodayKey())
      : (now - ts <= maxAge);
    const matchesType = mediaFilter === 'all' || item.mediaType === mediaFilter;
    return inPeriod && matchesType;
  });
}

function renderMediaGallery() {
  const grid = document.getElementById('mediaGalleryGrid');
  const filtered = filterMediaByTimeframe(recordedMediaList);
  document.getElementById('repMediaCount').textContent = String(filtered.length);
  document.getElementById('repMediaSub').textContent =
    `Showing ${filtered.length} recorded posture image(s) & video(s) for ${reportTimeframe.toUpperCase()} view.`;

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align:center; padding:32px; color:var(--text-soft); border:1px dashed rgba(255,255,255,0.14); border-radius:14px;">
        <i class="bi bi-film" style="font-size:2rem; display:block; margin-bottom:8px; color:var(--text-dim);"></i>
        No recorded images or videos found for this <strong>${reportTimeframe}</strong> period yet.<br/>
        <span style="font-size:0.78rem;">Start the Live Interface and Sandy will automatically record posture snapshots &amp; video clips here.</span>
      </div>
    `;
    return;
  }

  grid.innerHTML = filtered.map(item => {
    const isVid = item.mediaType === 'video';
    const isBad = item.posture === 'BAD';
    const timeLabel = new Date(item.timestamp || Date.now()).toLocaleString();
    return `
      <div class="media-card" onclick="openMediaLightbox('${escapeHtml(item.id)}')">
        <div class="media-thumb-wrap">
          ${isVid
            ? `<video src="${escapeHtml(item.url)}" muted preload="metadata"></video>`
            : `<img src="${escapeHtml(item.url)}" alt="Posture Snapshot" loading="lazy" />`}
          <span class="media-type-tag">${isVid ? 'VIDEO' : 'IMAGE'}</span>
          <span class="media-posture-tag ${isBad ? 'bad' : 'good'}">${isBad ? 'BAD' : 'GOOD'}</span>
        </div>
        <div style="padding:10px 12px;">
          <div style="font-size:0.80rem; font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${escapeHtml(item.deviceName || 'Sandy Cam')}</div>
          <div class="font-mono" style="font-size:0.68rem; color:var(--text-soft); margin-top:2px;">${escapeHtml(timeLabel)}</div>
        </div>
      </div>
    `;
  }).join('');
}

function openMediaLightbox(id) {
  const item = recordedMediaList.find(r => r.id === id);
  if (!item) return;
  activeLightboxId = id;
  document.getElementById('lightboxTitle').textContent =
    `${item.mediaType === 'video' ? 'Recorded Video' : 'Recorded Snapshot'} • ${item.posture}`;
  document.getElementById('lightboxMediaWrap').innerHTML =
    item.mediaType === 'video'
      ? `<video src="${escapeHtml(item.url)}" controls autoplay style="width:100%; max-height:440px;"></video>`
      : `<img src="${escapeHtml(item.url)}" alt="Snapshot" style="max-width:100%; max-height:440px; object-fit:contain;" />`;
  document.getElementById('lightboxMeta').textContent =
    `${item.deviceName} • ${new Date(item.timestamp).toLocaleString()} • Posture: ${item.posture}`;

  document.getElementById('btnLightboxDelete').onclick = async () => {
    if (window.sandyAPI?.deleteRecording) {
      await window.sandyAPI.deleteRecording(id);
    }
    recordedMediaList = recordedMediaList.filter(r => r.id !== id);
    closeMediaLightbox();
    renderMediaGallery();
    showToast('Recording deleted.');
  };
  openModal('modalMediaLightbox');
}

function closeMediaLightbox() {
  document.getElementById('lightboxMediaWrap').innerHTML = '';
  closeModal('modalMediaLightbox');
}

// ============================================================================
// SETTINGS TAB (VER ALPHA, COLOR THEMES, BIOFEEDBACK & RECORDING)
// ============================================================================
function loadAppSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem('sandy_desktop_settings') || '{}');
    appSettings = { ...appSettings, ...saved };
  } catch (_) {}
  applyAllSettingsToDOM();
}

function applyTheme(themeName) {
  appSettings.theme = themeName;
  saveAppSettings();
}

function saveAppSettings() {
  const langEl = document.getElementById('setLanguage');
  if (langEl) appSettings.language = langEl.value || 'en';
  appSettings.particles = document.getElementById('setParticles').checked;
  appSettings.density = document.getElementById('setDensity').value;
  appSettings.chime = document.getElementById('setChime').checked;
  appSettings.autoRecord = document.getElementById('setAutoRecord').checked;
  appSettings.autoWake = document.getElementById('setAutoWake').checked;
  appSettings.slouchSeconds = Number(document.getElementById('setSlouchSec').value) || 5;

  localStorage.setItem('sandy_desktop_settings', JSON.stringify(appSettings));
  applyAllSettingsToDOM();
}

function applyAllSettingsToDOM() {
  document.body.setAttribute('data-theme', appSettings.theme || 'cyan');
  const langEl = document.getElementById('setLanguage');
  if (langEl) langEl.value = appSettings.language || 'en';
  if (window.SandyDesktopI18n) {
    window.SandyDesktopI18n.apply(appSettings.language || 'en');
  }
  document.body.classList.remove('density-compact', 'density-wide', 'no-particles');
  if (appSettings.density === 'compact') document.body.classList.add('density-compact');
  if (appSettings.density === 'wide') document.body.classList.add('density-wide');
  if (!appSettings.particles) document.body.classList.add('no-particles');

  document.querySelectorAll('.theme-swatch').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.themeChoice === appSettings.theme);
  });

  const pEl = document.getElementById('setParticles');
  if (pEl) pEl.checked = Boolean(appSettings.particles);
  const dEl = document.getElementById('setDensity');
  if (dEl) dEl.value = appSettings.density || 'standard';
  const cEl = document.getElementById('setChime');
  if (cEl) cEl.checked = Boolean(appSettings.chime);
  const rEl = document.getElementById('setAutoRecord');
  if (rEl) rEl.checked = Boolean(appSettings.autoRecord);
  const wEl = document.getElementById('setAutoWake');
  if (wEl) wEl.checked = Boolean(appSettings.autoWake);
  const sEl = document.getElementById('setSlouchSec');
  if (sEl) sEl.value = String(appSettings.slouchSeconds || 5);
}

function openRecordingsFolder() {
  if (window.sandyAPI?.openRecordingsFolder) {
    window.sandyAPI.openRecordingsFolder();
  }
}

// ============================================================================
// BOOTSTRAP ON DOMContentLoaded
// ============================================================================
window.addEventListener('DOMContentLoaded', async () => {
  populateDobDropdowns();
  loadAppSettings();
  initBackgroundParticles();

  // Wire custom frameless window controls
  document.getElementById('btnWinMin')?.addEventListener('click', () => window.sandyAPI?.minimize());
  document.getElementById('btnWinMax')?.addEventListener('click', () => window.sandyAPI?.toggleMaximize());
  document.getElementById('btnWinClose')?.addEventListener('click', () => window.sandyAPI?.close());

  // Close dropdowns on outside click
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.sandy-pfp-wrap')) {
      document.getElementById('pfpDropdownMenu')?.classList.remove('open');
    }
    if (!e.target.closest('.device-dots-btn') && !e.target.closest('.device-dots-menu') && openDeviceMenuId) {
      openDeviceMenuId = null;
      renderDevicesList();
    }
  });

  // Load app version & Electron info
  if (window.sandyAPI?.getAppInfo) {
    const info = await window.sandyAPI.getAppInfo();
    document.getElementById('titlebarVersion').textContent = info.versionLabel || 'ver Alpha';
    document.getElementById('settingVersionBadge').textContent = info.versionLabel || 'ver Alpha';
    document.getElementById('settingRuntimeInfo').textContent =
      `Windows (${info.arch}) • Electron ${info.electron} • Node ${info.node}`;
  }

  // Listen for Electron Web Bluetooth device picker list
  if (window.sandyAPI?.onBluetoothDeviceList) {
    window.sandyAPI.onBluetoothDeviceList((list) => {
      const box = document.getElementById('bleScanResults');
      if (!box) return;
      box.classList.remove('hidden');
      if (!list.length) {
        box.innerHTML = `<div class="font-mono" style="font-size:0.78rem; color:var(--text-soft);">Searching for Bluetooth devices...</div>`;
        return;
      }
      box.innerHTML = `<div class="font-mono" style="font-size:0.72rem; color:var(--accent); margin-bottom:8px;">DISCOVERED BLUETOOTH DEVICES (CLICK TO PAIR):</div>` +
        list.map(d => `
          <button type="button" class="btn-glass" style="width:100%; justify-content:space-between; margin-bottom:6px; padding:8px 12px;"
            onclick="window.sandyAPI.selectBluetoothDevice('${escapeHtml(d.deviceId)}')">
            <span><i class="bi bi-bluetooth" style="color:var(--accent);"></i> ${escapeHtml(d.deviceName)}</span>
            <span class="font-mono" style="font-size:0.70rem; color:var(--neon-green);">Pair</span>
          </button>
        `).join('');
    });
  }

  // Listen for website Firebase auth callback handoff (external browser Google / Email flow)
  if (window.sandyAPI?.onWebsiteAuthCallback) {
    window.sandyAPI.onWebsiteAuthCallback(async (payload) => {
      if (payload && payload.email) {
        userProfile = {
          uid: payload.uid || 'web_synced',
          displayName: payload.displayName || payload.email.split('@')[0],
          username: payload.username || payload.email.split('@')[0],
          email: payload.email,
          goal: payload.goal || 'Build Upright Sitting Habit',
          photoURL: payload.photoURL || ''
        };
        localStorage.setItem('sandy_desktop_profile', JSON.stringify(userProfile));
        showToast('Synced authentication from Sandy Website!');
        enterMainWorkspace(payload.isNewUser === '1');
      }
    });
  }

  initFirebase();
});
