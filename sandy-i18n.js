/**
 * ============================================================================
 * Sandy — Multi-Language Translation Engine (EN, VI, ES, FR, JA, KO)
 * ============================================================================
 * Lossless live translator for the entire Sandy Website. Remembers original
 * English text so switching between any languages is instant & reversible.
 */
(function () {
  const LANGUAGES = [
    { code: 'en', short: 'EN', name: 'English' },
    { code: 'vi', short: 'VI', name: 'Tiếng Việt' },
    { code: 'es', short: 'ES', name: 'Español' },
    { code: 'fr', short: 'FR', name: 'Français' },
    { code: 'ja', short: 'JA', name: '日本語' },
    { code: 'ko', short: 'KO', name: '한국어' }
  ];

  // Exact phrase dictionary (case-insensitive trimmed lookup + substring fallbacks)
  const DICT = {
    vi: {
      'Home': 'Trang chủ',
      'Live Monitor': 'Giám sát trực tiếp',
      'Result Analyze': 'Phân tích kết quả',
      'AI Chatbot': 'Trợ lý AI',
      'AI Coach': 'Trợ lý AI',
      'AI Coach Chat': 'Trò chuyện AI',
      'Download': 'Tải xuống',
      'Download App': 'Tải ứng dụng',
      'Biofeedback Lab': 'Phòng thí nghiệm',
      'Sign In': 'Đăng nhập',
      'Sign Up': 'Đăng ký',
      'Sign Out': 'Đăng xuất',
      'Profile': 'Hồ sơ',
      'User Profile': 'Hồ sơ người dùng',
      'Settings & Layout': 'Cài đặt & Giao diện',
      'Security & 2FA': 'Bảo mật & 2FA',
      'Statistics': 'Thống kê',
      'AI POSTURE DETECTION': 'NHẬN DIỆN TƯ THẾ AI',
      'Open Live Monitor': 'Mở giám sát trực tiếp',
      'Try Interactive Demo': 'Thử mô phỏng tương tác',
      'Try Web Biofeedback Demo': 'Thử mô phỏng trên web',
      'Try Web Demo': 'Thử bản demo web',
      'Open Web Interface': 'Mở giao diện web',
      'Open Sandy Web Interface': 'Mở giao diện web Sandy',
      'Back to Home': 'Quay về Trang chủ',
      'Back to All Platforms': 'Quay lại tất cả nền tảng',
      'Download Sandy for Your Device': 'Tải Sandy cho thiết bị của bạn',
      'Download Sandy for Windows': 'Tải Sandy cho Windows',
      'Download Sandy for Android': 'Tải Sandy cho Android',
      'Download Sandy for Linux': 'Tải Sandy cho Linux',
      'Download for Windows (.exe)': 'Tải cho Windows (.exe)',
      'Download for Android (.apk)': 'Tải cho Android (.apk)',
      'Download for Linux (.AppImage)': 'Tải cho Linux (.AppImage)',
      'Choose Your Platform': 'Chọn nền tảng của bạn',
      'DOWNLOAD IN PROGRESS': 'ĐANG TẢI XUỐNG',
      'DOWNLOAD STARTED — CHECK YOUR BROWSER': 'ĐÃ BẮT ĐẦU TẢI — KIỂM TRA TRÌNH DUYỆT',
      'Downloading Sandy...': 'Đang tải xuống Sandy...',
      'Downloading Sandy for Windows': 'Đang tải Sandy cho Windows',
      'Downloading Sandy for Android': 'Đang tải Sandy cho Android',
      'Downloading Sandy for Linux': 'Đang tải Sandy cho Linux',
      'Restart Download': 'Tải lại',
      'Open GitHub Releases': 'Mở GitHub Releases',
      "Download didn't start or interrupted?": 'Tải xuống không bắt đầu hoặc bị gián đoạn?',
      'Click here to refresh & restart the download': 'Nhấn vào đây để làm mới & tải lại',
      'Using macOS or iOS (iPhone / iPad)?': 'Bạn đang dùng macOS hoặc iOS (iPhone / iPad)?',
      'Apple devices run Sandy directly in Safari or Chrome on the web — no app installation required!': 'Thiết bị Apple chạy Sandy trực tiếp trên Safari hoặc Chrome — không cần cài ứng dụng!',
      'ACCOUNT REQUIRED': 'YÊU CẦU TÀI KHOẢN',
      'Sign In to Access Sandy': 'Đăng nhập để sử dụng Sandy',
      'Create Account (Sign Up)': 'Tạo tài khoản (Đăng ký)',
      'Create Free Account (Sign Up)': 'Tạo tài khoản miễn phí (Đăng ký)',
      'Daily': 'Hàng ngày',
      'Weekly': 'Hàng tuần',
      'Monthly': 'Hàng tháng',
      'Annually': 'Hàng năm',
      'Yearly': 'Hàng năm',
      'Daily Back Score Report': 'Báo cáo điểm lưng hàng ngày',
      'Weekly Back Score Report': 'Báo cáo điểm lưng hàng tuần',
      'Monthly Back Score Report': 'Báo cáo điểm lưng hàng tháng',
      'Annual Back Score Report': 'Báo cáo điểm lưng hàng năm',
      'Sync YOLO Data': 'Đồng bộ dữ liệu YOLO',
      'Analyze Report': 'Phân tích báo cáo',
      'Sandy AI Report Coach': 'Trợ lý phân tích AI Sandy',
      'Send': 'Gửi',
      'New': 'Mới',
      'GOOD FRAMES': 'KHUNG HÌNH TỐT',
      'SLOUCH ALERTS': 'CẢNH BÁO GÙ LƯNG',
      'YOLO CONF': 'ĐỘ TIN CẬY YOLO',
      'NO DATA': 'CHƯA CÓ DỮ LIỆU',
      'GOOD': 'TỐT',
      'AVERAGE': 'TRUNG BÌNH',
      'BAD': 'XẤU',
      'TODAY': 'HÔM NAY',
      'THIS WEEK': 'TUẦN NÀY',
      'THIS MONTH': 'THÁNG NÀY',
      'THIS YEAR': 'NĂM NAY',
      'No recorded sessions yet': 'Chưa có phiên ghi nào',
      'YOUR ACTIVE CONTEXT': 'NGỮ CẢNH HIỆN TẠI',
      'TODAY BACK SCORE': 'ĐIỂM LƯNG HÔM NAY',
      'PERSONAL GOAL': 'MỤC TIÊU CÁ NHÂN',
      'MEDICAL EXCEPTIONS': 'LƯU Ý Y TẾ',
      'SUGGESTED QUESTIONS': 'CÂU HỎI GỢI Ý',
      'Display Name': 'Tên hiển thị',
      'Username': 'Tên người dùng',
      'Email Address': 'Địa chỉ Email',
      'Date of Birth': 'Ngày sinh',
      'Gender': 'Giới tính',
      'Password': 'Mật khẩu',
      'Confirm Password': 'Xác nhận mật khẩu',
      'Continue with Google': 'Tiếp tục với Google',
      'Sign In with Google': 'Đăng nhập bằng Google',
      'Save Preferences': 'Lưu cài đặt',
      'Save Profile': 'Lưu hồ sơ',
      'Skip': 'Bỏ qua',
      'Next': 'Tiếp theo',
      'Back': 'Quay lại',
      'Verify': 'Xác minh',
      'Refresh': 'Làm mới'
    },
    es: {
      'Home': 'Inicio',
      'Live Monitor': 'Monitor en Vivo',
      'Result Analyze': 'Análisis',
      'AI Chatbot': 'Chat IA',
      'AI Coach': 'Coach IA',
      'AI Coach Chat': 'Chat IA',
      'Download': 'Descargar',
      'Download App': 'Descargar App',
      'Biofeedback Lab': 'Laboratorio',
      'Sign In': 'Iniciar sesión',
      'Sign Up': 'Registrarse',
      'Sign Out': 'Cerrar sesión',
      'Profile': 'Perfil',
      'User Profile': 'Perfil de usuario',
      'Settings & Layout': 'Ajustes y Diseño',
      'Security & 2FA': 'Seguridad y 2FA',
      'Statistics': 'Estadísticas',
      'AI POSTURE DETECTION': 'DETECCIÓN DE POSTURA IA',
      'Open Live Monitor': 'Abrir Monitor en Vivo',
      'Try Interactive Demo': 'Probar Demo Interactiva',
      'Try Web Biofeedback Demo': 'Probar Demo Web',
      'Try Web Demo': 'Probar Demo Web',
      'Open Web Interface': 'Abrir Interfaz Web',
      'Open Sandy Web Interface': 'Abrir Interfaz Web Sandy',
      'Back to Home': 'Volver al Inicio',
      'Back to All Platforms': 'Volver a Plataformas',
      'Download Sandy for Your Device': 'Descarga Sandy para tu Dispositivo',
      'Download Sandy for Windows': 'Descargar Sandy para Windows',
      'Download Sandy for Android': 'Descargar Sandy para Android',
      'Download Sandy for Linux': 'Descargar Sandy para Linux',
      'Download for Windows (.exe)': 'Descargar para Windows (.exe)',
      'Download for Android (.apk)': 'Descargar para Android (.apk)',
      'Download for Linux (.AppImage)': 'Descargar para Linux (.AppImage)',
      'Choose Your Platform': 'Elige tu Plataforma',
      'DOWNLOAD IN PROGRESS': 'DESCARGA EN PROGRESO',
      'DOWNLOAD STARTED — CHECK YOUR BROWSER': 'DESCARGA INICIADA — REVISA TU NAVEGADOR',
      'Downloading Sandy...': 'Descargando Sandy...',
      'Downloading Sandy for Windows': 'Descargando Sandy para Windows',
      'Downloading Sandy for Android': 'Descargando Sandy para Android',
      'Downloading Sandy for Linux': 'Descargando Sandy para Linux',
      'Restart Download': 'Reiniciar Descarga',
      'Open GitHub Releases': 'Abrir GitHub Releases',
      "Download didn't start or interrupted?": '¿La descarga no comenzó o se interrumpió?',
      'Click here to refresh & restart the download': 'Haz clic aquí para reiniciar la descarga',
      'Using macOS or iOS (iPhone / iPad)?': '¿Usas macOS o iOS (iPhone / iPad)?',
      'Apple devices run Sandy directly in Safari or Chrome on the web — no app installation required!': 'Los dispositivos Apple ejecutan Sandy directamente en Safari o Chrome — ¡sin instalar nada!',
      'ACCOUNT REQUIRED': 'CUENTA REQUERIDA',
      'Sign In to Access Sandy': 'Inicia sesión para usar Sandy',
      'Create Account (Sign Up)': 'Crear Cuenta (Registrarse)',
      'Create Free Account (Sign Up)': 'Crear Cuenta Gratis',
      'Daily': 'Diario',
      'Weekly': 'Semanal',
      'Monthly': 'Mensual',
      'Annually': 'Anual',
      'Yearly': 'Anual',
      'Daily Back Score Report': 'Informe Diario de Postura',
      'Weekly Back Score Report': 'Informe Semanal de Postura',
      'Monthly Back Score Report': 'Informe Mensual de Postura',
      'Annual Back Score Report': 'Informe Anual de Postura',
      'Sync YOLO Data': 'Sincronizar YOLO',
      'Analyze Report': 'Analizar Informe',
      'Sandy AI Report Coach': 'Coach de Informes IA Sandy',
      'Send': 'Enviar',
      'New': 'Nuevo',
      'GOOD FRAMES': 'CUADROS BUENOS',
      'SLOUCH ALERTS': 'ALERTAS',
      'YOLO CONF': 'CONF. YOLO',
      'NO DATA': 'SIN DATOS',
      'GOOD': 'BUENA',
      'AVERAGE': 'MEDIA',
      'BAD': 'MALA',
      'TODAY': 'HOY',
      'THIS WEEK': 'ESTA SEMANA',
      'THIS MONTH': 'ESTE MES',
      'THIS YEAR': 'ESTE AÑO',
      'No recorded sessions yet': 'Aún no hay sesiones grabadas',
      'Display Name': 'Nombre visible',
      'Username': 'Usuario',
      'Email Address': 'Correo electrónico',
      'Date of Birth': 'Fecha de nacimiento',
      'Gender': 'Género',
      'Password': 'Contraseña',
      'Confirm Password': 'Confirmar contraseña',
      'Save Preferences': 'Guardar preferencias',
      'Save Profile': 'Guardar perfil',
      'Skip': 'Omitir',
      'Next': 'Siguiente',
      'Back': 'Atrás'
    },
    fr: {
      'Home': 'Accueil',
      'Live Monitor': 'Moniteur Live',
      'Result Analyze': 'Analyse',
      'AI Chatbot': 'Chatbot IA',
      'AI Coach': 'Coach IA',
      'Download': 'Télécharger',
      'Download App': 'Télécharger l’App',
      'Biofeedback Lab': 'Labo Biofeedback',
      'Sign In': 'Connexion',
      'Sign Up': 'Inscription',
      'Sign Out': 'Déconnexion',
      'Profile': 'Profil',
      'User Profile': 'Profil utilisateur',
      'Settings & Layout': 'Paramètres',
      'Security & 2FA': 'Sécurité & 2FA',
      'Statistics': 'Statistiques',
      'AI POSTURE DETECTION': 'DÉTECTION DE POSTURE IA',
      'Download Sandy for Your Device': 'Télécharger Sandy',
      'Download Sandy for Windows': 'Télécharger Sandy pour Windows',
      'Download Sandy for Android': 'Télécharger Sandy pour Android',
      'Download Sandy for Linux': 'Télécharger Sandy pour Linux',
      'Download for Windows (.exe)': 'Télécharger pour Windows (.exe)',
      'Download for Android (.apk)': 'Télécharger pour Android (.apk)',
      'Download for Linux (.AppImage)': 'Télécharger pour Linux (.AppImage)',
      'DOWNLOAD IN PROGRESS': 'TÉLÉCHARGEMENT EN COURS',
      'Restart Download': 'Relancer le téléchargement',
      'Open GitHub Releases': 'Ouvrir GitHub Releases',
      'Back to All Platforms': 'Toutes les plateformes',
      'Back to Home': "Retour à l'accueil",
      'ACCOUNT REQUIRED': 'COMPTE REQUIS',
      'Sign In to Access Sandy': 'Connectez-vous pour accéder à Sandy',
      'Daily': 'Quotidien',
      'Weekly': 'Hebdomadaire',
      'Monthly': 'Mensuel',
      'Annually': 'Annuel',
      'Yearly': 'Annuel',
      'Send': 'Envoyer',
      'NO DATA': 'AUCUNE DONNÉE',
      'GOOD': 'BON',
      'BAD': 'MAUVAIS'
    },
    ja: {
      'Home': 'ホーム',
      'Live Monitor': 'ライブ監視',
      'Result Analyze': '分析レポート',
      'AI Chatbot': 'AIチャット',
      'AI Coach': 'AIコーチ',
      'Download': 'ダウンロード',
      'Download App': 'アプリを入手',
      'Biofeedback Lab': 'デモラボ',
      'Sign In': 'ログイン',
      'Sign Up': '新規登録',
      'Sign Out': 'ログアウト',
      'Profile': 'プロフィール',
      'User Profile': 'ユーザープロフィール',
      'Settings & Layout': '設定とレイアウト',
      'Security & 2FA': 'セキュリティ',
      'Statistics': '統計',
      'AI POSTURE DETECTION': 'AI姿勢検出',
      'Download Sandy for Your Device': 'Sandyをダウンロード',
      'Download Sandy for Windows': 'Windows版 Sandyをダウンロード',
      'Download Sandy for Android': 'Android版 Sandyをダウンロード',
      'Download Sandy for Linux': 'Linux版 Sandyをダウンロード',
      'Download for Windows (.exe)': 'Windows版 (.exe)',
      'Download for Android (.apk)': 'Android版 (.apk)',
      'Download for Linux (.AppImage)': 'Linux版 (.AppImage)',
      'DOWNLOAD IN PROGRESS': 'ダウンロード中',
      'Restart Download': '再ダウンロード',
      'Open GitHub Releases': 'GitHubリリースを開く',
      'Back to All Platforms': 'すべてのプラットフォームへ',
      'Back to Home': 'ホームに戻る',
      'ACCOUNT REQUIRED': 'アカウントが必要です',
      'Sign In to Access Sandy': 'Sandyを使うにはログインしてください',
      'Daily': '日別',
      'Weekly': '週別',
      'Monthly': '月別',
      'Annually': '年別',
      'Yearly': '年別',
      'Send': '送信',
      'NO DATA': 'データなし',
      'GOOD': '良好',
      'BAD': '不良'
    },
    ko: {
      'Home': '홈',
      'Live Monitor': '실시간 모니터',
      'Result Analyze': '결과 분석',
      'AI Chatbot': 'AI 챗봇',
      'AI Coach': 'AI 코치',
      'Download': '다운로드',
      'Download App': '앱 다운로드',
      'Biofeedback Lab': '체험 랩',
      'Sign In': '로그인',
      'Sign Up': '회원가입',
      'Sign Out': '로그아웃',
      'Profile': '프로필',
      'User Profile': '사용자 프로필',
      'Settings & Layout': '설정 및 레이아웃',
      'Security & 2FA': '보안 및 2FA',
      'Statistics': '통계',
      'AI POSTURE DETECTION': 'AI 자세 감지',
      'Download Sandy for Your Device': 'Sandy 다운로드',
      'Download Sandy for Windows': 'Windows용 Sandy 다운로드',
      'Download Sandy for Android': 'Android용 Sandy 다운로드',
      'Download Sandy for Linux': 'Linux용 Sandy 다운로드',
      'Download for Windows (.exe)': 'Windows용 다운로드 (.exe)',
      'Download for Android (.apk)': 'Android용 다운로드 (.apk)',
      'Download for Linux (.AppImage)': 'Linux용 다운로드 (.AppImage)',
      'DOWNLOAD IN PROGRESS': '다운로드 중',
      'Restart Download': '다시 다운로드',
      'Open GitHub Releases': 'GitHub 릴리스 열기',
      'Back to All Platforms': '모든 플랫폼으로 돌아가기',
      'Back to Home': '홈으로 돌아가기',
      'ACCOUNT REQUIRED': '계정 필요',
      'Sign In to Access Sandy': 'Sandy를 사용하려면 로그인하세요',
      'Daily': '일간',
      'Weekly': '주간',
      'Monthly': '월간',
      'Annually': '연간',
      'Yearly': '연간',
      'Send': '보내기',
      'NO DATA': '데이터 없음',
      'GOOD': '좋음',
      'BAD': '나쁨'
    }
  };

  // Build case-insensitive lookup maps per language
  const LOOKUP = {};
  Object.keys(DICT).forEach((lang) => {
    LOOKUP[lang] = {};
    Object.keys(DICT[lang]).forEach((k) => {
      LOOKUP[lang][k.trim().toLowerCase()] = DICT[lang][k];
    });
  });

  function getLang() {
    const saved = (localStorage.getItem('sandy_lang') || 'en').toLowerCase();
    return LANGUAGES.some(l => l.code === saved) ? saved : 'en';
  }

  function translateString(text, lang) {
    if (!text || lang === 'en') return text;
    const map = LOOKUP[lang];
    if (!map) return text;
    const trimmed = text.trim();
    if (!trimmed) return text;
    const hit = map[trimmed.toLowerCase()];
    if (hit) {
      return text.replace(trimmed, hit);
    }
    return text;
  }

  function applyLanguageToDOM(lang) {
    const targetLang = LANGUAGES.some(l => l.code === lang) ? lang : 'en';
    document.documentElement.lang = targetLang;

    // Translate text nodes safely while preserving original English string in parent dataset/map
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
      const parent = node.parentElement;
      if (!parent) continue;
      const tag = parent.tagName;
      if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'CODE' || parent.closest('.sandy-lang-menu')) continue;

      if (typeof node.__sandyOrigText !== 'string') {
        node.__sandyOrigText = node.nodeValue;
      }
      const orig = node.__sandyOrigText;
      if (!orig || !orig.trim()) continue;
      node.nodeValue = targetLang === 'en' ? orig : translateString(orig, targetLang);
    }

    // Update top bar active language badge if present
    const codeEl = document.getElementById('sandyLangCurrentCode');
    if (codeEl) {
      const meta = LANGUAGES.find(l => l.code === targetLang) || LANGUAGES[0];
      codeEl.textContent = meta.short;
    }
    document.querySelectorAll('.sandy-lang-opt').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.lang === targetLang);
    });
  }

  function setLang(lang) {
    const clean = LANGUAGES.some(l => l.code === lang) ? lang : 'en';
    localStorage.setItem('sandy_lang', clean);
    applyLanguageToDOM(clean);
  }

  window.SandyI18n = {
    LANGUAGES,
    getLang,
    setLang,
    t: (str) => translateString(str, getLang()),
    apply: () => applyLanguageToDOM(getLang())
  };
})();
