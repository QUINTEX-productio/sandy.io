/**
 * PostureAI — Cyberpunk Night City & iOS Glassmorphism Motion Engine
 * ----------------------------------------------------------------------------
 * 1. Netlify Drop-Style Subtle Fluid Mesh Background:
 *    - Smooth, understated 2D spring-wave fluid mesh + dual damped radial
 *      gradient warps following the mouse cursor in restrained Electric Cyan
 *      (#00F0FF) and Cyberpunk Magenta (#FF007F).
 * 2. Bidirectional Ergonomic Posture Engine (-90° to +90°):
 *    - -90° to -30° : `lying_down`     — Electric Cyan (#00F0FF), ZERO warnings
 *    - -29° to +15° : `sitting_good`   — Electric Cyan (#00F0FF), ZERO warnings
 *    - +16° to +35° : `caution_slouch` — Hazard Yellow (#FFE600), caution HUD
 *    - +36° to +90° : `sitting_bad`    — Glitch Red (#FF2A6D), critical HUD
 * 3. Strict Trigonometric Fixed Bone-Length Human Silhouette:
 *    - Pure polar forward kinematics guarantees every segment (lumbar, thoracic,
 *      cervical, thigh, calf, foot, upper arm, forearm, chair/platform) maintains
 *      100% constant length across the entire -90° to +90° continuum.
 * 4. Anime-Style Glitch Jitter & Head-Anchored Exclamation Marks (`!`):
 *    - Triggered strictly in severe slouch (+36° to +90°), anchored live to
 *      the figure's head coordinates.
 */

(function () {
  'use strict';

  const prefersReducedMotion =
    window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      // =========================================================================
    // 1. CYBERNETIC PARTICLE ROD & 360-DEGREE SPARK MATRIX CANVAS ENGINE
    //    (Omnidirectional 360Â° sparks firing out across 5 Cyberpunk Night City
    //     neon colors with active luminescence/glow via shadowBlur:
    //     1. Electric Cyan:    #00F0FF (0, 240, 255)
    //     2. Neon Pink/Magenta:#FF007F (255, 0, 127)
    //     3. Deep Violet:      #7000FF (112, 0, 255)
    //     4. Electric Yellow:  #FFE600 (255, 230, 0)
    //     5. Acid Green:       #00FF66 (0, 255, 102)
    //     Strictly decreased output rate & gentle physical spark deceleration)
    // =========================================================================
    function initParticleRodBackground() {
      let canvas =
        document.getElementById('particleRodCanvas') ||
        document.getElementById('ambientBgCanvas') ||
        document.getElementById('netlifyFluidCanvas');

      if (!canvas) {
        canvas = document.createElement('canvas');
        canvas.id = 'ambientBgCanvas';
        canvas.setAttribute('aria-hidden', 'true');
        document.body.prepend(canvas);
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      let width = (canvas.width = window.innerWidth);
      let height = (canvas.height = window.innerHeight);

      // Authentic 5-Color Cyberpunk Night City Palette
      const CYBER_PALETTE = [
        { name: 'cyan',    hex: '#00F0FF', rgb: '0, 240, 255' },
        { name: 'magenta', hex: '#FF007F', rgb: '255, 0, 127' },
        { name: 'violet',  hex: '#7000FF', rgb: '112, 0, 255' },
        { name: 'yellow',  hex: '#FFE600', rgb: '255, 230, 0' },
        { name: 'green',   hex: '#00FF66', rgb: '0, 255, 102' }
      ];

      // Floating ambient cybernetic particles across the 5 Night City colors
      const PARTICLE_COUNT = 40;
      const particles = [];
      for (let p = 0; p < PARTICLE_COUNT; p++) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.30,
          vy: -0.12 - Math.random() * 0.28,
          radius: 0.7 + Math.random() * 1.3,
          baseAlpha: 0.12 + Math.random() * 0.16,
          pulseSpeed: 0.012 + Math.random() * 0.020,
          pulsePhase: Math.random() * Math.PI * 2,
          colorIdx: Math.floor(Math.random() * CYBER_PALETTE.length)
        });
      }

                  // 360-Degree Restrained Omnidirectional Sparks (pool-capped, sleek cursor trail)
      const sparks = [];
      const MAX_SPARKS = 24;

      const cursor = {
        x: -9999,
        y: -9999,
        lastX: null,
        lastY: null,
        baseGlow: 0,
        distAcc: 0
      };

      function handleResize() {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
      }
      window.addEventListener('resize', handleResize, { passive: true });

      // Spawns sleek scintillating electric sparks across 360° with restrained particle count
      function spawnOmnidirectionalRods(x, y, dx, dy) {
        if (prefersReducedMotion) return;

        while (sparks.length + 2 > MAX_SPARKS) {
          sparks.shift();
        }

        const speed = Math.hypot(dx, dy);
        const count = speed > 18 ? 2 : 1;

        for (let k = 0; k < count; k++) {
          const angle = Math.random() * Math.PI * 2;
          const cosA = Math.cos(angle);
          const sinA = Math.sin(angle);
          const offset = 1.0 + Math.random() * 4;
          const col = CYBER_PALETTE[Math.floor(Math.random() * CYBER_PALETTE.length)];
          const rodSpeed = 2.0 + Math.random() * 2.8;

          sparks.push({
            x: x + cosA * offset,
            y: y + sinA * offset,
            ang: angle,
            cosA: cosA,
            sinA: sinA,
            speed: rodSpeed,
            maxLength: 9 + Math.random() * 13,
            currentLength: 2.0,
            growRate: 0.45 + Math.random() * 0.20,
            width: 0.85 + Math.random() * 0.50,
            life: 1.0,
            decay: 0.038 + Math.random() * 0.024,
            color: col,
            sparklePhase: Math.random() * Math.PI * 2,
            sparkleFreq: 24 + Math.random() * 26,
            flutter: (Math.random() - 0.5) * 0.05
          });
        }

        cursor.baseGlow = Math.min(1, cursor.baseGlow + 0.14);
      }

      window.addEventListener('pointermove', (e) => {
        const x = e.clientX;
        const y = e.clientY;
        if (cursor.lastX !== null && cursor.lastY !== null) {
          const dx = x - cursor.lastX;
          const dy = y - cursor.lastY;
          const dist = Math.hypot(dx, dy);
          cursor.x = x;
          cursor.y = y;

          cursor.distAcc += dist;
          if (cursor.distAcc >= 26) {
            spawnOmnidirectionalRods(x, y, dx, dy);
            cursor.distAcc = 0;
          }
        }
        cursor.lastX = x;
        cursor.lastY = y;
      }, { passive: true });

      window.addEventListener('pointerleave', () => {
        cursor.lastX = null;
        cursor.lastY = null;
      }, { passive: true });

      function renderMotionBg() {
        ctx.clearRect(0, 0, width, height);

        ctx.save();
        ctx.globalCompositeOperation = 'lighter';

        // 1. Cursor ambient horizon emitter
        if (cursor.baseGlow > 0.005) {
          ctx.shadowBlur = 0;
          const emitter = ctx.createRadialGradient(cursor.x, cursor.y, 0, cursor.x, cursor.y, 70);
          emitter.addColorStop(0, `rgba(0, 240, 255, ${(cursor.baseGlow * 0.035).toFixed(3)})`);
          emitter.addColorStop(0.35, `rgba(255, 0, 127, ${(cursor.baseGlow * 0.020).toFixed(3)})`);
          emitter.addColorStop(0.70, `rgba(112, 0, 255, ${(cursor.baseGlow * 0.012).toFixed(3)})`);
          emitter.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx.fillStyle = emitter;
          ctx.beginPath();
          ctx.arc(cursor.x, cursor.y, 70, 0, Math.PI * 2);
          ctx.fill();
        }

        // 2. 360-Degree Scintillating Sparks with active luminescence & micro-starbursts
        ctx.lineCap = 'round';

        for (let i = sparks.length - 1; i >= 0; i--) {
          const r = sparks[i];
          r.currentLength += (r.maxLength - r.currentLength) * r.growRate;
          r.ang += r.flutter;
          r.flutter += (Math.random() - 0.5) * 0.04;
          r.cosA = Math.cos(r.ang);
          r.sinA = Math.sin(r.ang);
          r.x += r.cosA * r.speed;
          r.y += r.sinA * r.speed;
          r.speed *= 0.925;
          r.life -= r.decay;
          r.sparklePhase += r.sparkleFreq * 0.06;

          if (r.life <= 0.01) {
            sparks.splice(i, 1);
            continue;
          }

          const rawScint = 0.72 + 0.48 * Math.sin(r.sparklePhase) + (Math.random() - 0.5) * 0.28;
          const scint = Math.max(0.35, Math.min(1.5, rawScint));
          const alpha = Math.min(1, r.life * r.life * scint);

          const tipX = r.x + r.cosA * r.currentLength;
          const tipY = r.y + r.sinA * r.currentLength;
          const tailX = r.x;
          const tailY = r.y;
          const col = r.color;

          const grad = ctx.createLinearGradient(tailX, tailY, tipX, tipY);
          grad.addColorStop(0, `rgba(${col.rgb}, 0)`);
          grad.addColorStop(0.35, `rgba(${col.rgb}, ${(alpha * 0.42).toFixed(3)})`);
          grad.addColorStop(0.75, `rgba(${col.rgb}, ${(alpha * 0.95).toFixed(3)})`);
          grad.addColorStop(1, `rgba(255, 255, 255, ${Math.min(1, alpha * 1.05).toFixed(3)})`);

          ctx.shadowColor = col.hex;
          ctx.shadowBlur = Math.round(10 + scint * 8);
          ctx.strokeStyle = grad;

          // Pass 1: Luminous neon ambient halo with micro-flicker
          ctx.lineWidth = r.width * (2.4 + scint * 0.8);
          ctx.beginPath();
          ctx.moveTo(tailX, tailY);
          ctx.lineTo(tipX, tipY);
          ctx.stroke();

          // Pass 2: Razor-thin incandescent core
          ctx.lineWidth = r.width * 0.95;
          ctx.stroke();

          // Scintillating White-Hot Specular Tip
          const tipR = r.width * (1.0 + scint * 0.45);
          ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(1, alpha * 1.1).toFixed(3)})`;
          ctx.beginPath();
          ctx.arc(tipX, tipY, tipR, 0, Math.PI * 2);
          ctx.fill();

          // Scintillating 4-Point Specular Starburst Twinkle (Glint)
          if (scint > 0.85) {
            const glintLen = r.width * (2.2 + scint * 2.8);
            ctx.lineWidth = 0.9;
            ctx.strokeStyle = `rgba(255, 255, 255, ${Math.min(1, alpha * (scint - 0.5) * 1.2).toFixed(3)})`;
            ctx.beginPath();
            ctx.moveTo(tipX - glintLen, tipY);
            ctx.lineTo(tipX + glintLen, tipY);
            ctx.moveTo(tipX, tipY - glintLen);
            ctx.lineTo(tipX, tipY + glintLen);
            ctx.stroke();
          }

          // Secondary trailing scintillation micro-ember flecks
          if (scint > 1.05 && r.currentLength > 5) {
            const midT = 0.45 + (Math.sin(r.sparklePhase * 1.3) * 0.25);
            const mx = tailX + (tipX - tailX) * midT + (Math.random() - 0.5) * 1.8;
            const my = tailY + (tipY - tailY) * midT + (Math.random() - 0.5) * 1.8;
            ctx.fillStyle = `rgba(255, 255, 255, ${(alpha * 0.85).toFixed(3)})`;
            ctx.beginPath();
            ctx.arc(mx, my, r.width * 0.65, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        ctx.restore();
        cursor.baseGlow *= 0.88;

        if (!prefersReducedMotion) {
          requestAnimationFrame(renderMotionBg);
        }
      }

      renderMotionBg();
    }

    const initNetlifyFluidMeshBackground = initParticleRodBackground;

  // =========================================================================
  // 2. iOS Glass Card Specular Spotlight Tracking
  // =========================================================================
  function initGlassHoverSpotlights() {
    document.addEventListener('pointermove', (e) => {
      const cards = document.querySelectorAll('.glass-card');
      for (let i = 0; i < cards.length; i++) {
        const card = cards[i];
        const rect = card.getBoundingClientRect();
        if (
          e.clientX >= rect.left - 60 &&
          e.clientX <= rect.right + 60 &&
          e.clientY >= rect.top - 60 &&
          e.clientY <= rect.bottom + 60
        ) {
          card.style.setProperty('--glow-x', `${(e.clientX - rect.left).toFixed(0)}px`);
          card.style.setProperty('--glow-y', `${(e.clientY - rect.top).toFixed(0)}px`);
          const inside =
            e.clientX >= rect.left &&
            e.clientX <= rect.right &&
            e.clientY >= rect.top &&
            e.clientY <= rect.bottom;
          card.style.setProperty('--glow-alpha', inside ? '1' : '0.28');
        } else {
          card.style.setProperty('--glow-alpha', '0');
        }
      }
    }, { passive: true });
  }

  // =========================================================================
  // 3. Bidirectional -90° to +90° Posture Verification Engine
  //    - -90° to -30° : `lying_down`      (Electric Cyan #00F0FF, ZERO warnings)
  //    - -29° to +15° : `sitting_good`    (Electric Cyan #00F0FF, ZERO warnings)
  //    - +16° to +35° : `sitting_caution` (Hazard Yellow #FFE600, caution HUD)
  //    - +36° to +90° : `sitting_bad`     (Glitch Red #FF2A6D, critical alert)
  // =========================================================================
  function evaluatePostureDegrees(rawDegrees) {
    const deg = Math.max(-90, Math.min(90, Math.round(Number(rawDegrees) || 0)));
    const tiltDisplay = deg > 0 ? `+${deg}°` : `${deg}°`;

    // Zone 1: -90° to -30° Lying Down / Reclined (Electric Cyan — Zero Warnings)
    if (deg <= -30) {
      const flatRatio = (-deg - 30) / 60; // 0 at -30°, 1 at -90°
      const conf = Math.round(96 + flatRatio * 3);
      return {
        degrees: deg,
        tiltDisplay,
        modeLabel: deg <= -75 ? 'LYING FLAT' : 'LYING DOWN',
        reclineDeg: 90 - deg,
        classification: 'lying_down',
        stateLabel: 'lying_down',
        severity: 'optimal',
        isAlert: false,
        badgeClass: 'flow-badge-cyan',
        dotClass: 'status-dot-cyan',
        accentColor: '#00F0FF',
        confidence: conf,
        hudStateClass: 'hud-state-calm',
        hudSubStatus: 'NEURAL REST PROTOCOL // ZERO SPINAL STRAIN',
        hudMainText: 'NEURAL RECHARGE IN PROGRESS // RECLINED REST MODE ACTIVE',
        hudCode: 'LYING_DOWN',
        summary: `Lying Down / Reclined (${tiltDisplay}) — Spine unloaded on platform; zero posture alerts.`
      };
    }

    // Zone 2: -29° to +15° Optimal Upright (Electric Cyan — Zero Warnings)
    if (deg <= 15) {
      const distFromZero = Math.abs(deg);
      const conf = Math.round(99 - (distFromZero / 29) * 4);
      return {
        degrees: deg,
        tiltDisplay,
        modeLabel: 'OPTIMAL',
        reclineDeg: 90 - deg,
        classification: 'sitting_good',
        stateLabel: 'sitting_good',
        severity: 'optimal',
        isAlert: false,
        badgeClass: 'flow-badge-good',
        dotClass: 'status-dot-good',
        accentColor: '#00F0FF',
        confidence: conf,
        hudStateClass: 'hud-state-calm',
        hudSubStatus: 'NIGHT CITY BIOMONITOR // TELEMETRY NOMINAL',
        hudMainText: 'SPINAL VECTOR ALIGNED // NOMINAL BIOMETRICS ENFORCED',
        hudCode: 'SITTING_GOOD',
        summary: `Optimal Upright (${tiltDisplay}) — Neutral spine, 90° knees & grounded feet; zero alerts.`
      };
    }

    // Zone 3: +16° to +35° Caution Slouch (Hazard Yellow)
    if (deg <= 35) {
      const warnRatio = (deg - 16) / 19;
      const conf = Math.round(88 + warnRatio * 5);
      return {
        degrees: deg,
        tiltDisplay,
        modeLabel: 'CAUTION',
        reclineDeg: 90 - deg,
        classification: 'sitting_caution',
        stateLabel: 'sitting_caution',
        severity: 'warning',
        isAlert: false,
        badgeClass: 'flow-badge-yellow',
        dotClass: 'status-dot-yellow',
        accentColor: '#FFE600',
        confidence: conf,
        hudStateClass: 'hud-state-warn',
        hudSubStatus: 'ERGONOMIC ADVISORY // DEBOUNCE BUFFER ACTIVE',
        hudMainText: 'POSTURAL DRIFT DETECTED // CERVICAL STRAIN ELEVATING',
        hudCode: 'SITTING_CAUTION',
        summary: `Caution Slouch (${tiltDisplay}) — Postural drift detected; 3-frame debounce monitoring.`
      };
    }

    // Zone 4: +36° to +90° Severe Forward Slouch (Glitch Red + Anime Jitter & `!`)
    const sevRatio = (deg - 36) / 54;
    const conf = Math.round(93 + sevRatio * 6);
    return {
      degrees: deg,
      tiltDisplay,
      modeLabel: 'SLOUCH ALERT',
      reclineDeg: 90 - deg,
      classification: 'sitting_bad',
      stateLabel: 'sitting_bad',
      severity: 'severe',
      isAlert: true,
      badgeClass: 'flow-badge-bad',
      dotClass: 'status-dot-bad',
      accentColor: '#FF2A6D',
      confidence: conf,
      hudStateClass: 'hud-state-critical',
      hudSubStatus: 'ARASAKA BIOMON // TRAUMA TEAM CRITICAL ALERT',
      hudMainText: '[ ⚠️ CRITICAL ERROR: CYBERPSYCHOSIS THRESHOLD EXCEEDED // NEURAL STABILITY COMPROMISED ]',
      hudCode: 'SITTING_BAD',
      summary: `Severe Forward Slouch (${tiltDisplay}) — Cyberpsychosis threshold exceeded; 740 Hz alert active!`
    };
  }

  // =========================================================================
  // 4. Smooth Tabular Counter Micro-Interaction
  // =========================================================================
  function animateCounter(el, targetValue, options = {}) {
    if (!el) return;
    const target = Number(targetValue);
    if (!Number.isFinite(target)) {
      el.textContent = String(targetValue);
      return;
    }

    const prefix = options.prefix || '';
    const suffix = options.suffix || '';
    const decimals = options.decimals || 0;
    const durationMs = prefersReducedMotion ? 0 : (options.durationMs || 420);

    const prevRaw = parseFloat(
      el.dataset.numericValue !== undefined
        ? el.dataset.numericValue
        : String(el.textContent).replace(/[^0-9.-]/g, '')
    );
    const start = Number.isFinite(prevRaw) ? prevRaw : 0;
    el.dataset.numericValue = String(target);

    if (durationMs <= 0 || Math.abs(target - start) < 0.05) {
      el.textContent = `${prefix}${target.toFixed(decimals)}${suffix}`;
      return;
    }

    if (el._rafId) cancelAnimationFrame(el._rafId);
    const startTime = performance.now();

    function tick(now) {
      const t = Math.min(1, (now - startTime) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3);
      const val = start + (target - start) * eased;
      el.textContent = `${prefix}${val.toFixed(decimals)}${suffix}`;
      if (t < 1) {
        el._rafId = requestAnimationFrame(tick);
      } else {
        el.textContent = `${prefix}${target.toFixed(decimals)}${suffix}`;
        el._rafId = null;
      }
    }

    el._rafId = requestAnimationFrame(tick);
  }

  // =========================================================================
  // 5. Strict Trigonometric Fixed Bone-Length Human Kinematics (-90° to +90°)
  // =========================================================================
  const SVG_NS = 'http://www.w3.org/2000/svg';

  function createSvgEl(tag, attrs = {}) {
    const el = document.createElementNS(SVG_NS, tag);
    for (const [k, v] of Object.entries(attrs)) {
      el.setAttribute(k, String(v));
    }
    return el;
  }

  function smoothStep(t) {
    const c = Math.max(0, Math.min(1, t));
    return c * c * (3 - 2 * c);
  }

  // Invariant anatomical segment lengths (in SVG viewBox units)
  const BONE_LENGTHS = Object.freeze({
    lumbar: 30,       // pelvis -> l3
    thoracicLow: 30,  // l3 -> t8
    thoracicUp: 28,   // t8 -> t1 (Total spine arc = 88.000)
    neck: 18,         // t1 -> c4
    headOffset: 8,    // c4 -> cranium center (Total neck->head = 26.000)
    shoulderDrop: 6,  // t1 -> shoulder joint along upper thoracic axis
    shoulderFwd: 3,   // clavicle perpendicular forward offset
    upperArm: 38,     // shoulder -> elbow
    forearm: 34,      // elbow -> wrist
    thigh: 64,        // pelvis -> knee
    calf: 64,         // knee -> ankle
    chairBack: 116,   // chairPivot -> chairBackTop
    chairSeat: 68,    // chairPivot -> seatFront
    chairLegrest: 66  // seatFront -> legrestEnd
  });

  // Anatomical arm keyframes (0 = up, 90 = forward, 180 = down)
  const ARM_KEYFRAMES = Object.freeze([
    { d: -90, ua: 90,  flex: 8 },
    { d: -45, ua: 134, flex: 29 },
    { d: 0,   ua: 167, flex: 72 },
    { d: 25,  ua: 180, flex: 80 },
    { d: 55,  ua: 176, flex: 50 },
    { d: 90,  ua: 178, flex: 40 }
  ]);

  function solveMotionArmPose(d, aThorUp, breathDeg = 0) {
    const k = ARM_KEYFRAMES;
    let i = 0;
    while (i < k.length - 2 && d > k[i + 1].d) i++;
    const a = k[i];
    const b = k[i + 1];
    const t = Math.max(0, Math.min(1, (d - a.d) / (b.d - a.d)));
    const st = t * t * (3 - 2 * t);
    const uaBase = a.ua + (b.ua - a.ua) * st;
    const flexBase = Math.max(5, Math.min(140, a.flex + (b.flex - a.flex) * st));

    let nearUa = breathDeg * 0.7;
    let nearFlex = 0;
    let wristTick = 0;

    if (d <= -15) {
      nearUa += breathDeg * 0.8;
      nearFlex += breathDeg * 1.2;
    } else if (d <= 20) {
      nearFlex += Math.sin(d * 0.1) * 2;
      wristTick = 2.0;
    } else if (d <= 35) {
      wristTick = 1.4;
    } else {
      wristTick = 2.8;
    }

    const ua = Math.max(70, Math.min(195, uaBase + nearUa));
    const flex = Math.max(5, Math.min(140, flexBase + nearFlex));

    return {
      upperArm: ua,
      forearm: ua - flex,
      wristTick
    };
  }

  /**
   * Exact polar forward-kinematics step from `origin` with fixed Euclidean length.
   * `degClockwiseFromUp`: 0° = straight up (0, -1), +90° = right (+1, 0), -90° = left (-1, 0).
   */
  function stepFromUp(origin, length, degClockwiseFromUp) {
    const rad = (degClockwiseFromUp * Math.PI) / 180;
    return {
      x: origin.x + length * Math.sin(rad),
      y: origin.y - length * Math.cos(rad)
    };
  }

  /**
   * Rigid Euclidean foot triangle (preserves exact ankle->heel, ankle->toe, and sole lengths).
   * `soleDegFromUp`: +90° = horizontal sole flat on floor; 0° = sole vertical (toes pointing up).
   */
  function computeRigidFoot(ankle, soleDegFromUp) {
    const rad = (soleDegFromUp * Math.PI) / 180;
    // Unit tangent along sole (heel -> toe)
    const ux = Math.sin(rad);
    const uy = -Math.cos(rad);
    // Unit normal from ankle down to sole (90° clockwise from u)
    const nx = -uy;
    const ny = ux;

    const soleDrop = 12.5;
    return {
      heel: {
        x: ankle.x - ux * 10.0 + nx * soleDrop,
        y: ankle.y - uy * 10.0 + ny * soleDrop
      },
      toe: {
        x: ankle.x + ux * 24.0 + nx * soleDrop,
        y: ankle.y + uy * 24.0 + ny * soleDrop
      }
    };
  }

  /**
   * Computes full-body & chair joint coordinates for any angle in [-90°, +90°]
   * using strictly invariant trigonometric bone lengths.
   */
  function computeRigidPoseAtDegrees(rawDeg, breathDeg = 0) {
    const d = Math.max(-90, Math.min(90, rawDeg));
    const pelvis = { x: 208, y: 194 };
    const farHip = { x: pelvis.x + 5, y: pelvis.y - 2.5 };

    let aLumbar;
    let aThorLow;
    let aThorUp;
    let aNeck;
    let headPitch;
    let aUpperArm;
    let aForearm;
    let aThigh;
    let aCalf;
    let aFarThigh;
    let aFarCalf;
    let aChairBack;
    let aLegrest;

    if (d <= 0) {
      // Continuous Backward Recline: 0° (upright) -> -90° (completely flat supine)
      const r = -d / 90; // 0 -> 1
      const legLift = smoothStep(Math.max(0, (-d - 6) / 84));

      aLumbar = d - 4 * (1 - r);
      aThorLow = d + 2 * (1 - r) + breathDeg * 0.5;
      aThorUp = d + 3 * (1 - r) + breathDeg;
      aNeck = d + 2 * (1 - r) + 4 * r;
      headPitch = d + 3 * r;

      aThigh = 93 - 3 * legLift;         // 93° -> 90° horizontal
      aCalf = 178 - 88 * legLift;        // 178° (vertical floor) -> 90° (horizontal legrest)
      aFarThigh = 91.5 - 1.5 * legLift;
      aFarCalf = 176 - 86 * legLift;

      aChairBack = -4 * (1 - r) + (-90) * r;
      aLegrest = 176 - 86 * legLift;
    } else {
      // Continuous Forward Flexion / Slouch: 0° (upright) -> +90° (severe forward fold)
      const s = d / 90; // 0 -> 1

      aLumbar = -4 * (1 - s) + d * 0.68;
      aThorLow = 2 * (1 - s) + d * 0.96 + breathDeg * 0.5;
      aThorUp = 3 * (1 - s) + d * 1.18 + breathDeg;
      aNeck = 2 * (1 - s) + d * 1.22;
      headPitch = d * 0.76;

      aThigh = 93 + s * 1.8;
      aCalf = 178 + s * 8.0;
      aFarThigh = 91.5 + s * 1.8;
      aFarCalf = 176 + s * 7.5;

      // Chair stays upright while user slouches forward away from backrest
      aChairBack = -4;
      aLegrest = 176;
    }

    // Spine & Head chain (100% invariant segment lengths)
    const l3 = stepFromUp(pelvis, BONE_LENGTHS.lumbar, aLumbar);
    const t8 = stepFromUp(l3, BONE_LENGTHS.thoracicLow, aThorLow);
    const t1 = stepFromUp(t8, BONE_LENGTHS.thoracicUp, aThorUp);
    const c4 = stepFromUp(t1, BONE_LENGTHS.neck, aNeck);
    const head = stepFromUp(c4, BONE_LENGTHS.headOffset, aNeck);

    // Arm chain anchored to T1 with forward clavicle offset (No skewing, no detaching)
    const shoulderBase = stepFromUp(t1, BONE_LENGTHS.shoulderDrop, aThorUp + 180);
    const shoulder = stepFromUp(shoulderBase, BONE_LENGTHS.shoulderFwd, aThorUp + 90);

    const arm = solveMotionArmPose(d, aThorUp, breathDeg);
    aUpperArm = arm.upperArm;
    aForearm = arm.forearm;
    const elbow = stepFromUp(shoulder, BONE_LENGTHS.upperArm, aUpperArm);
    const wrist = stepFromUp(elbow, BONE_LENGTHS.forearm, aForearm);

    // Foreground & Far-side Leg chains (100% invariant segment lengths)
    const knee = stepFromUp(pelvis, BONE_LENGTHS.thigh, aThigh);
    const ankle = stepFromUp(knee, BONE_LENGTHS.calf, aCalf);
    const soleDeg = d < -6 ? (aCalf - 88) : 90;
    const nearFoot = computeRigidFoot(ankle, soleDeg);

    const farKnee = stepFromUp(farHip, BONE_LENGTHS.thigh, aFarThigh);
    const farAnkle = stepFromUp(farKnee, BONE_LENGTHS.calf, aFarCalf);
    const farSoleDeg = d < -6 ? (aFarCalf - 86) : 90;
    const farFoot = computeRigidFoot(farAnkle, farSoleDeg);

    // Transforming Ergonomic Chair / Supine Platform (100% invariant segment lengths)
    const chairPivot = { x: 195, y: 206 };
    const chairBackTop = stepFromUp(chairPivot, BONE_LENGTHS.chairBack, aChairBack);
    const seatFront = stepFromUp(chairPivot, BONE_LENGTHS.chairSeat, 90);
    const legrestEnd = stepFromUp(seatFront, BONE_LENGTHS.chairLegrest, aLegrest);

    // Dynamic Vision Bounding Box around live figure
    const keyPts = [head, pelvis, t8, t1, knee, ankle, nearFoot.heel, nearFoot.toe, elbow, wrist];
    let xmin = Infinity;
    let ymin = Infinity;
    let xmax = -Infinity;
    let ymax = -Infinity;
    for (let i = 0; i < keyPts.length; i++) {
      const p = keyPts[i];
      if (p.x < xmin) xmin = p.x;
      if (p.y < ymin) ymin = p.y;
      if (p.x > xmax) xmax = p.x;
      if (p.y > ymax) ymax = p.y;
    }

    return {
      pelvis,
      farHip,
      l3,
      t8,
      t1,
      c4,
      head,
      headPitch,
      shoulder,
      elbow,
      wrist,
      knee,
      ankle,
      heel: nearFoot.heel,
      toe: nearFoot.toe,
      farKnee,
      farAnkle,
      farHeel: farFoot.heel,
      farToe: farFoot.toe,
      chairPivot,
      chairBackTop,
      seatFront,
      legrestEnd,
      bbox: {
        xmin: Math.max(18, xmin - 22),
        ymin: Math.max(16, ymin - 24),
        xmax: Math.min(374, xmax + 18),
        ymax: Math.min(280, ymax + 8)
      }
    };
  }

  // Sculpted anatomical limb segment with muscle belly curvature & rounded joint caps
  function buildSculptedLimbPath(a, b, rA, rB, bulgeTop = 0, bulgeBot = 0) {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = Math.max(1, Math.hypot(dx, dy));
    const ux = dx / len;
    const uy = dy / len;
    const nx = uy;
    const ny = -ux;

    const aTopX = a.x + nx * rA;
    const aTopY = a.y + ny * rA;
    const aBotX = a.x - nx * rA;
    const aBotY = a.y - ny * rA;

    const bTopX = b.x + nx * rB;
    const bTopY = b.y + ny * rB;
    const bBotX = b.x - nx * rB;
    const bBotY = b.y - ny * rB;

    const midX = (a.x + b.x) * 0.5;
    const midY = (a.y + b.y) * 0.5;
    const rMid = (rA + rB) * 0.5;

    const ctrlTopX = midX + nx * (rMid + bulgeTop);
    const ctrlTopY = midY + ny * (rMid + bulgeTop);
    const ctrlBotX = midX - nx * (rMid + bulgeBot);
    const ctrlBotY = midY - ny * (rMid + bulgeBot);

    return [
      `M ${aTopX.toFixed(1)} ${aTopY.toFixed(1)}`,
      `Q ${ctrlTopX.toFixed(1)} ${ctrlTopY.toFixed(1)} ${bTopX.toFixed(1)} ${bTopY.toFixed(1)}`,
      `A ${rB.toFixed(1)} ${rB.toFixed(1)} 0 0 1 ${bBotX.toFixed(1)} ${bBotY.toFixed(1)}`,
      `Q ${ctrlBotX.toFixed(1)} ${ctrlBotY.toFixed(1)} ${aBotX.toFixed(1)} ${aBotY.toFixed(1)}`,
      `A ${rA.toFixed(1)} ${rA.toFixed(1)} 0 0 1 ${aTopX.toFixed(1)} ${aTopY.toFixed(1)}`,
      'Z'
    ].join(' ');
  }

  // Sculpted multi-station human torso silhouette along fixed-length spinal stations
  function buildAnatomicalTorsoPath(pelvis, l3, t8, t1) {
    const stations = [
      { p: pelvis, rFront: 13.0, rBack: 14.5 },
      { p: l3,     rFront: 12.2, rBack: 12.5 },
      { p: t8,     rFront: 16.8, rBack: 14.5 },
      { p: t1,     rFront: 12.8, rBack: 12.8 }
    ];

    const frontPts = [];
    const backPts = [];

    for (let i = 0; i < stations.length; i++) {
      const prev = stations[Math.max(0, i - 1)].p;
      const next = stations[Math.min(stations.length - 1, i + 1)].p;
      const tx = next.x - prev.x;
      const ty = next.y - prev.y;
      const tLen = Math.max(1, Math.hypot(tx, ty));
      const fnx = -ty / tLen;
      const fny = tx / tLen;
      const st = stations[i];

      frontPts.push({
        x: st.p.x + fnx * st.rFront,
        y: st.p.y + fny * st.rFront
      });
      backPts.push({
        x: st.p.x - fnx * st.rBack,
        y: st.p.y - fny * st.rBack
      });
    }

    const rTop = 12.8;
    const rPelvis = 13.8;
    let d = `M ${frontPts[0].x.toFixed(1)} ${frontPts[0].y.toFixed(1)}`;
    for (let i = 1; i < frontPts.length - 1; i++) {
      const mx = (frontPts[i].x + frontPts[i + 1].x) * 0.5;
      const my = (frontPts[i].y + frontPts[i + 1].y) * 0.5;
      d += ` Q ${frontPts[i].x.toFixed(1)} ${frontPts[i].y.toFixed(1)} ${mx.toFixed(1)} ${my.toFixed(1)}`;
    }
    const fLast = frontPts[frontPts.length - 1];
    const bLast = backPts[backPts.length - 1];
    d += ` T ${fLast.x.toFixed(1)} ${fLast.y.toFixed(1)}`;
    d += ` A ${rTop} ${rTop} 0 0 0 ${bLast.x.toFixed(1)} ${bLast.y.toFixed(1)}`;
    for (let i = backPts.length - 2; i >= 1; i--) {
      const mx = (backPts[i].x + backPts[i - 1].x) * 0.5;
      const my = (backPts[i].y + backPts[i - 1].y) * 0.5;
      d += ` Q ${backPts[i].x.toFixed(1)} ${backPts[i].y.toFixed(1)} ${mx.toFixed(1)} ${my.toFixed(1)}`;
    }
    d += ` T ${backPts[0].x.toFixed(1)} ${backPts[0].y.toFixed(1)}`;
    d += ` A ${rPelvis} ${rPelvis} 0 0 0 ${frontPts[0].x.toFixed(1)} ${frontPts[0].y.toFixed(1)} Z`;
    return d;
  }

  // Sculpted anatomical human foot profile from rigid (ankle, heel, toe) triangle
  function buildAnatomicalFootPath(ankle, heel, toe) {
    const sx = toe.x - heel.x;
    const sy = toe.y - heel.y;
    const sLen = Math.max(1, Math.hypot(sx, sy));
    const ux = sx / sLen;
    const uy = sy / sLen;
    const nx = uy;
    const ny = -ux;

    const heelBackX = heel.x - ux * 3.2 + nx * 2.4;
    const heelBackY = heel.y - uy * 3.2 + ny * 2.4;
    const heelSoleX = heel.x + ux * 2.0 - nx * 1.2;
    const heelSoleY = heel.y + uy * 2.0 - ny * 1.2;
    const archX = heel.x + sx * 0.45 + nx * 1.0;
    const archY = heel.y + sy * 0.45 + ny * 1.0;
    const toeSoleX = toe.x - ux * 2.4 - nx * 1.0;
    const toeSoleY = toe.y - uy * 2.4 - ny * 1.0;
    const toeTipX = toe.x + ux * 2.8 + nx * 2.6;
    const toeTipY = toe.y + uy * 2.8 + ny * 2.6;
    const instepX = ankle.x + ux * 7.2 + nx * 1.4;
    const instepY = ankle.y + uy * 7.2 + ny * 1.4;
    const achillesX = ankle.x - ux * 5.0;
    const achillesY = ankle.y - uy * 5.0;

    return [
      `M ${achillesX.toFixed(1)} ${achillesY.toFixed(1)}`,
      `Q ${heelBackX.toFixed(1)} ${heelBackY.toFixed(1)} ${heelSoleX.toFixed(1)} ${heelSoleY.toFixed(1)}`,
      `Q ${archX.toFixed(1)} ${archY.toFixed(1)} ${toeSoleX.toFixed(1)} ${toeSoleY.toFixed(1)}`,
      `Q ${toeTipX.toFixed(1)} ${toeTipY.toFixed(1)} ${(toe.x - ux * 4 + nx * 5.5).toFixed(1)} ${(toe.y - uy * 4 + ny * 5.5).toFixed(1)}`,
      `Q ${instepX.toFixed(1)} ${instepY.toFixed(1)} ${(ankle.x + ux * 4.2).toFixed(1)} ${(ankle.y + uy * 4.2).toFixed(1)}`,
      'Z'
    ].join(' ');
  }

  // =========================================================================
  // 6. Articulated Posture Visualizer + Anime Glitch Jitter & Head `!` Marks
  // =========================================================================
  class PostureSkeletonModel {
    constructor(containerEl, options = {}) {
      this.container = typeof containerEl === 'string'
        ? document.querySelector(containerEl)
        : containerEl;
      if (!this.container) return;

      this.compact = Boolean(options.compact);
      this.onAngleUpdate = options.onAngleUpdate || null;

      this.degrees = 0; // Default 0° Optimal Upright Seated
      this.targetDegrees = 0;
      this.vel = 0;
      this.mode = 'sitting_good';
      this.time = 0;

      this._buildSvg();
      this._animate = this._animate.bind(this);
      requestAnimationFrame(this._animate);
    }

    _buildSvg() {
      this.container.innerHTML = '';
      const svg = createSvgEl('svg', {
        viewBox: '0 0 460 295',
        width: '100%',
        style: `max-height: ${this.compact ? '242px' : '284px'}; display: block;`
      });

      const uid = Math.random().toString(36).slice(2, 7);
      const defs = createSvgEl('defs');
      defs.innerHTML = `
        <pattern id="cyberGrid_${uid}" width="24" height="24" patternUnits="userSpaceOnUse">
          <path d="M 24 0 L 0 0 0 24" fill="none" stroke="rgba(0, 240, 255, 0.045)" stroke-width="1"/>
        </pattern>
        <filter id="spineNeonGlow_${uid}" x="-35%" y="-35%" width="170%" height="170%">
          <feGaussianBlur stdDeviation="2.6" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      `;
      this.glowFilterId = `spineNeonGlow_${uid}`;
      svg.appendChild(defs);

      // Subtle Stage Grid
      svg.appendChild(createSvgEl('rect', {
        x: 0, y: 0, width: 460, height: 295, rx: 12,
        fill: `url(#cyberGrid_${uid})`
      }));

      // Environment Layer: Floor Datum, Transforming -90°..+90° Chair/Platform & Desk
      const env = createSvgEl('g', { opacity: '0.92' });

      env.appendChild(createSvgEl('line', {
        x1: 16, y1: 274, x2: 444, y2: 274,
        stroke: 'rgba(0, 240, 255, 0.24)', 'stroke-width': 1.4
      }));
      for (let tx = 32; tx <= 432; tx += 40) {
        env.appendChild(createSvgEl('line', {
          x1: tx, y1: 274, x2: tx, y2: 279,
          stroke: 'rgba(0, 240, 255, 0.18)', 'stroke-width': 1
        }));
      }

      // Chair Pedestal & Casters
      env.appendChild(createSvgEl('line', {
        x1: 218, y1: 206, x2: 218, y2: 258,
        stroke: 'rgba(148, 163, 184, 0.36)', 'stroke-width': 6, 'stroke-linecap': 'round'
      }));
      env.appendChild(createSvgEl('path', {
        d: 'M 172 268 L 218 258 L 264 268 M 218 258 L 218 268',
        fill: 'none', stroke: 'rgba(148, 163, 184, 0.34)', 'stroke-width': 3.5,
        'stroke-linecap': 'round', 'stroke-linejoin': 'round'
      }));
      [172, 218, 264].forEach((cx) => {
        env.appendChild(createSvgEl('circle', {
          cx, cy: 270.5, r: 3.3,
          fill: '#030508', stroke: 'rgba(0, 240, 255, 0.38)', 'stroke-width': 1.3
        }));
      });

      // Rigid-Length Transforming Platform (Backrest + Seat Pan + Hinged Legrest)
      this.platformCushion = createSvgEl('path', {
        d: '',
        fill: 'none',
        stroke: 'rgba(30, 41, 59, 0.92)',
        'stroke-width': 10,
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round'
      });
      this.platformNeonEdge = createSvgEl('path', {
        d: '',
        fill: 'none',
        stroke: 'rgba(0, 240, 255, 0.42)',
        'stroke-width': 2.0,
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round'
      });
      this.headrestPad = createSvgEl('circle', {
        cx: 187, cy: 90, r: 6,
        fill: '#0A0F1E', stroke: 'rgba(0, 240, 255, 0.5)', 'stroke-width': 1.5
      });
      env.appendChild(this.platformCushion);
      env.appendChild(this.platformNeonEdge);
      env.appendChild(this.headrestPad);

      // Workstation Desk, Monitor & Perched ESP32-S3 Sensor (Right Side x=382..446)
      env.appendChild(createSvgEl('rect', {
        x: 380, y: 163, width: 66, height: 6, rx: 3,
        fill: 'rgba(148, 163, 184, 0.32)'
      }));
      env.appendChild(createSvgEl('line', {
        x1: 428, y1: 169, x2: 428, y2: 274,
        stroke: 'rgba(148, 163, 184, 0.25)', 'stroke-width': 4
      }));
      env.appendChild(createSvgEl('line', {
        x1: 412, y1: 84, x2: 412, y2: 163,
        stroke: 'rgba(148, 163, 184, 0.34)', 'stroke-width': 5, 'stroke-linecap': 'round'
      }));
      env.appendChild(createSvgEl('rect', {
        x: 394, y: 159, width: 36, height: 4, rx: 2,
        fill: 'rgba(148, 163, 184, 0.32)'
      }));
      env.appendChild(createSvgEl('rect', {
        x: 396, y: 58, width: 24, height: 62, rx: 5,
        fill: '#050811', stroke: 'rgba(0, 240, 255, 0.40)', 'stroke-width': 1.5
      }));

      this.fovBeam = createSvgEl('polygon', {
        points: '392,52 44,24 44,270',
        fill: 'rgba(0, 240, 255, 0.025)'
      });
      this.deviceSensorDot = createSvgEl('circle', {
        cx: 394, cy: 52, r: 4, fill: '#00F0FF'
      });
      svg.appendChild(this.fovBeam);
      svg.appendChild(env);
      svg.appendChild(this.deviceSensorDot);

      // Vertical Plumb Reference & Bidirectional Angle Sector Arc
      this.plumbLine = createSvgEl('line', {
        x1: 208, y1: 24, x2: 208, y2: 206,
        stroke: 'rgba(0, 240, 255, 0.24)',
        'stroke-width': 1.2,
        'stroke-dasharray': '4 4'
      });
      this.tiltArc = createSvgEl('path', {
        d: '',
        fill: 'rgba(0, 240, 255, 0.12)',
        stroke: 'rgba(0, 240, 255, 0.65)',
        'stroke-width': 1.5
      });
      svg.appendChild(this.plumbLine);
      svg.appendChild(this.tiltArc);

      // Vision AI Bounding Box + Sightline
      this.bboxRect = createSvgEl('rect', {
        x: 170, y: 50, width: 140, height: 226, rx: 8,
        fill: 'none', stroke: 'rgba(0, 240, 255, 0.16)',
        'stroke-width': 1.1, 'stroke-dasharray': '5 5'
      });
      this.bboxCorners = createSvgEl('path', {
        d: '', fill: 'none', stroke: '#00F0FF',
        'stroke-width': 2.1, 'stroke-linecap': 'round'
      });
      this.gazeLine = createSvgEl('line', {
        x1: 224, y1: 78, x2: 392, y2: 78,
        stroke: 'rgba(0, 240, 255, 0.30)',
        'stroke-width': 1.2, 'stroke-dasharray': '3 4'
      });
      svg.appendChild(this.bboxRect);
      svg.appendChild(this.bboxCorners);
      svg.appendChild(this.gazeLine);

      // Concentric Biofeedback Ripples (ONLY active during +36°..+90° severe slouch)
      this.ripples = [0, 1, 2].map(() => {
        const ring = createSvgEl('circle', {
          cx: 208, cy: 84, r: 8,
          fill: 'none', stroke: '#FF2A6D', 'stroke-width': 1.8, opacity: '0'
        });
        svg.appendChild(ring);
        return ring;
      });

      // Anime Chromatic Glitch Ghost Outline (active during +36°..+90° jitter)
      this.glitchGhostTorso = createSvgEl('path', {
        d: '',
        fill: 'none',
        stroke: '#00F0FF',
        'stroke-width': 1.8,
        opacity: '0'
      });
      svg.appendChild(this.glitchGhostTorso);

      // =====================================================================
      // Rigid Character Rig Group (Receives Anime High-Speed Jitter as a Whole)
      // =====================================================================
      this.characterRigGroup = createSvgEl('g');

      // Layer A: Far-Side Leg
      const farLegGroup = createSvgEl('g', { opacity: '0.54' });
      this.farThighMesh = createSvgEl('path', {
        d: '', fill: 'rgba(8, 14, 28, 0.90)',
        stroke: 'rgba(0, 240, 255, 0.36)', 'stroke-width': 1.3
      });
      this.farCalfMesh = createSvgEl('path', {
        d: '', fill: 'rgba(8, 14, 28, 0.90)',
        stroke: 'rgba(0, 240, 255, 0.36)', 'stroke-width': 1.3
      });
      this.farFootMesh = createSvgEl('path', {
        d: '', fill: 'rgba(8, 14, 28, 0.92)',
        stroke: 'rgba(0, 240, 255, 0.42)', 'stroke-width': 1.3
      });
      farLegGroup.appendChild(this.farThighMesh);
      farLegGroup.appendChild(this.farCalfMesh);
      farLegGroup.appendChild(this.farFootMesh);
      this.characterRigGroup.appendChild(farLegGroup);

      // Layer B: Sculpted Neck, Torso & Cranium/Visor Head
      const bodyGroup = createSvgEl('g');
      this.neckMesh = createSvgEl('path', {
        d: '', fill: 'rgba(10, 18, 34, 0.92)',
        stroke: '#00F0FF', 'stroke-width': 1.5
      });
      this.torsoMesh = createSvgEl('path', {
        d: '', fill: 'rgba(10, 18, 34, 0.88)',
        stroke: '#00F0FF', 'stroke-width': 1.8
      });

      this.headGroup = createSvgEl('g');
      this.headSilhouette = createSvgEl('path', {
        d: 'M -15 -4 C -16 -18, 12 -20, 16 -6 C 18 -1, 18 5, 14 11 C 10 15, 3 15, -2 12 C -8 10, -14 5, -15 -4 Z',
        fill: '#070D1B',
        stroke: '#00F0FF',
        'stroke-width': 2.0
      });
      this.headVisor = createSvgEl('path', {
        d: 'M 4 -6 L 17 -4 L 16 2 L 4 0 Z',
        fill: '#00F0FF',
        opacity: '0.88'
      });
      this.headEarNode = createSvgEl('circle', {
        cx: -2, cy: 1, r: 3.0,
        fill: '#030508', stroke: '#00F0FF', 'stroke-width': 1.4
      });
      this.headGroup.appendChild(this.headSilhouette);
      this.headGroup.appendChild(this.headVisor);
      this.headGroup.appendChild(this.headEarNode);

      bodyGroup.appendChild(this.neckMesh);
      bodyGroup.appendChild(this.torsoMesh);
      bodyGroup.appendChild(this.headGroup);
      this.characterRigGroup.appendChild(bodyGroup);

      // Layer C: Foreground Leg (Thigh, Knee, Calf, Ankle, Foot)
      const nearLegGroup = createSvgEl('g');
      this.nearThighMesh = createSvgEl('path', {
        d: '', fill: 'rgba(10, 18, 34, 0.92)',
        stroke: '#00F0FF', 'stroke-width': 2.0
      });
      this.nearCalfMesh = createSvgEl('path', {
        d: '', fill: 'rgba(10, 18, 34, 0.92)',
        stroke: '#00F0FF', 'stroke-width': 2.0
      });
      this.nearFootMesh = createSvgEl('path', {
        d: '', fill: 'rgba(10, 18, 34, 0.95)',
        stroke: '#00F0FF', 'stroke-width': 2.0
      });
      nearLegGroup.appendChild(this.nearThighMesh);
      nearLegGroup.appendChild(this.nearCalfMesh);
      nearLegGroup.appendChild(this.nearFootMesh);
      this.characterRigGroup.appendChild(nearLegGroup);

      // Layer D: Internal X-Ray Biomonitor Spine & Limb Axis
      const spineOverlayGroup = createSvgEl('g', { filter: `url(#${this.glowFilterId})` });
      this.spineCore = createSvgEl('path', {
        d: '', fill: 'none', stroke: '#00F0FF',
        'stroke-width': 3.0, 'stroke-linecap': 'round'
      });
      this.legBoneBus = createSvgEl('path', {
        d: '', fill: 'none', stroke: 'rgba(0, 240, 255, 0.48)',
        'stroke-width': 1.6, 'stroke-dasharray': '3 3', 'stroke-linecap': 'round'
      });
      spineOverlayGroup.appendChild(this.spineCore);
      spineOverlayGroup.appendChild(this.legBoneBus);
      this.characterRigGroup.appendChild(spineOverlayGroup);

      // Layer E: Sculpted Arm (Upper Arm + Forearm + Hand)
      const armGroup = createSvgEl('g');
      this.upperArmMesh = createSvgEl('path', {
        d: '', fill: 'rgba(12, 20, 38, 0.92)',
        stroke: 'rgba(226, 232, 240, 0.68)', 'stroke-width': 1.6
      });
      this.forearmMesh = createSvgEl('path', {
        d: '', fill: 'rgba(12, 20, 38, 0.92)',
        stroke: 'rgba(226, 232, 240, 0.68)', 'stroke-width': 1.6
      });
      this.handNode = createSvgEl('ellipse', {
        cx: 280, cy: 170, rx: 6.2, ry: 4.0,
        fill: '#0A1222', stroke: 'rgba(226, 232, 240, 0.72)', 'stroke-width': 1.5
      });
      armGroup.appendChild(this.upperArmMesh);
      armGroup.appendChild(this.forearmMesh);
      armGroup.appendChild(this.handNode);
      this.characterRigGroup.appendChild(armGroup);

      // Layer F: Joint Reticles
      const jointsGroup = createSvgEl('g');
      this.jointNodes = {};
      ['pelvis', 'l3', 't8', 't1', 'c4', 'knee', 'ankle'].forEach((k) => {
        const isAlertNode = k === 'c4';
        const r = isAlertNode ? 4.8 : (k === 'pelvis' || k === 'knee' ? 4.2 : 3.4);
        const node = createSvgEl('circle', {
          cx: 208,
          cy: 194,
          r,
          fill: isAlertNode ? '#00F0FF' : '#030508',
          stroke: '#00F0FF',
          'stroke-width': isAlertNode ? 2.2 : 1.7
        });
        jointsGroup.appendChild(node);
        this.jointNodes[k] = node;
      });
      this.characterRigGroup.appendChild(jointsGroup);

      svg.appendChild(this.characterRigGroup);

      // =====================================================================
      // Layer G: Floating Anime-Style Exclamation Marks (`!`) Anchored to Head
      //          (Strictly visible ONLY in +36° to +90° Severe Slouch Zone)
      // =====================================================================
      this.animeExclamGroup = createSvgEl('g', {
        opacity: '0',
        filter: `url(#${this.glowFilterId})`
      });

      // Comic radial shock lines around crown of head
      this.animeShockSpikes = createSvgEl('path', {
        d: 'M -24 -16 L -31 -23 M -8 -24 L -10 -34 M 12 -24 L 16 -33 M 24 -14 L 33 -19',
        fill: 'none',
        stroke: '#FFE600',
        'stroke-width': 2.0,
        'stroke-linecap': 'round'
      });
      this.animeExclamGroup.appendChild(this.animeShockSpikes);

      // 3 Floating Anime `!` Glyphs around the head
      const markSpecs = [
        { baseX: -18, baseY: -30, baseRot: -16, scale: 1.05, color: '#FF2A6D' },
        { baseX: 4,   baseY: -36, baseRot: 3,   scale: 1.24, color: '#FFE600' },
        { baseX: 25,  baseY: -27, baseRot: 18,  scale: 0.98, color: '#FF2A6D' }
      ];

      this.animeMarks = markSpecs.map((spec) => {
        const g = createSvgEl('g');
        // Bold tapered anime exclamation stem
        const stem = createSvgEl('path', {
          d: 'M -3.4 -18 L 3.4 -18 L 1.7 -4.2 L -1.7 -4.2 Z',
          fill: spec.color,
          stroke: '#030508',
          'stroke-width': 1.4,
          'stroke-linejoin': 'round'
        });
        // Crisp exclamation dot
        const dot = createSvgEl('circle', {
          cx: 0, cy: 1.6, r: 2.6,
          fill: spec.color,
          stroke: '#030508',
          'stroke-width': 1.4
        });
        g.appendChild(stem);
        g.appendChild(dot);
        this.animeExclamGroup.appendChild(g);
        return { el: g, stem, dot, ...spec };
      });

      svg.appendChild(this.animeExclamGroup);

      this.svg = svg;
      this.container.appendChild(svg);
    }

    setDegrees(deg, useSpring = true) {
      const clamped = Math.max(-90, Math.min(90, Number(deg) || 0));
      this.targetDegrees = clamped;
      const info = evaluatePostureDegrees(clamped);
      this.mode = info.classification;

      if (window.gsap && !prefersReducedMotion) {
        window.gsap.killTweensOf(this, 'degrees');
        window.gsap.to(this, {
          degrees: clamped,
          duration: useSpring ? 0.82 : 0.20,
          ease: useSpring ? 'elastic.out(1, 0.72)' : 'power3.out'
        });
      } else if (!useSpring) {
        this.degrees = clamped;
      }
    }

    setState(stateName) {
      if (stateName === 'idle' || stateName === 'no_target') {
        this.setDegrees(0, true);
        this.mode = 'idle';
        return;
      }
      if (stateName === 'lying_down') {
        this.setDegrees(-75, true);
      } else if (stateName === 'sitting_caution' || stateName === 'caution_slouch') {
        this.setDegrees(25, true);
      } else if (stateName === 'sitting_bad') {
        this.setDegrees(58, true);
      } else {
        this.setDegrees(0, true);
      }
      this.mode = stateName;
    }

    setSlouchProgress(progress01) {
      const p = Math.max(0, Math.min(1, Number(progress01) || 0));
      this.setDegrees(-90 + p * 180, false);
    }

    _animate() {
      this.time += 0.035;

      if (!window.gsap || prefersReducedMotion) {
        const k = 0.095;
        const damp = 0.76;
        this.vel = (this.vel + (this.targetDegrees - this.degrees) * k) * damp;
        this.degrees += this.vel;
      }

      const d = Math.max(-90, Math.min(90, this.degrees));
      const isIdle = this.mode === 'idle';
      const evalInfo = evaluatePostureDegrees(d);

      // Subtle angular ribcage breathing (preserves 100% invariant bone lengths!)
      const breathDeg = prefersReducedMotion ? 0 : Math.sin(this.time * 1.4) * 0.55;
      const pts = computeRigidPoseAtDegrees(d, breathDeg);

      // Accurate Warning Triggers: ONLY +36°..+90° is `isBad`, ONLY +16°..+35° is `isWarn`
      const isBad = evalInfo.classification === 'sitting_bad' && !isIdle;
      const isWarn = evalInfo.severity === 'warning' && !isIdle;

      const primaryColor = isIdle
        ? '#94A3B8'
        : isBad
          ? '#FF2A6D'
          : isWarn
            ? '#FFE600'
            : '#00F0FF';

      const secondaryGlow = isIdle
        ? 'rgba(148, 163, 184, 0.24)'
        : isBad
          ? 'rgba(255, 42, 109, 0.36)'
          : isWarn
            ? 'rgba(255, 230, 0, 0.32)'
            : 'rgba(0, 240, 255, 0.30)';

      const bodyTintFill = isIdle
        ? 'rgba(15, 23, 42, 0.88)'
        : isBad
          ? 'rgba(28, 8, 18, 0.90)'
          : isWarn
            ? 'rgba(24, 20, 8, 0.90)'
            : 'rgba(7, 18, 30, 0.90)';

      // 1. Transforming Ergonomic Chair / Flat Platform (Rigid Segments)
      const platD = `M ${pts.chairBackTop.x.toFixed(1)} ${pts.chairBackTop.y.toFixed(1)} L ${pts.chairPivot.x.toFixed(1)} ${pts.chairPivot.y.toFixed(1)} L ${pts.seatFront.x.toFixed(1)} ${pts.seatFront.y.toFixed(1)} L ${pts.legrestEnd.x.toFixed(1)} ${pts.legrestEnd.y.toFixed(1)}`;
      this.platformCushion.setAttribute('d', platD);
      this.platformNeonEdge.setAttribute('d', platD);
      this.platformNeonEdge.setAttribute('stroke', secondaryGlow);
      this.headrestPad.setAttribute('cx', pts.chairBackTop.x.toFixed(1));
      this.headrestPad.setAttribute('cy', pts.chairBackTop.y.toFixed(1));
      this.headrestPad.setAttribute('stroke', primaryColor);

      // 2. Plumb Datum & Bidirectional Pelvis Angle Sector Arc
      this.plumbLine.setAttribute('x1', pts.pelvis.x.toFixed(1));
      this.plumbLine.setAttribute('x2', pts.pelvis.x.toFixed(1));

      const arcR = 30;
      const vx = pts.t1.x - pts.pelvis.x;
      const vy = pts.t1.y - pts.pelvis.y;
      const mag = Math.max(1, Math.hypot(vx, vy));
      const ex = pts.pelvis.x + (vx / mag) * arcR;
      const ey = pts.pelvis.y + (vy / mag) * arcR;
      const sweep = vx >= 0 ? 1 : 0;
      this.tiltArc.setAttribute(
        'd',
        `M ${pts.pelvis.x.toFixed(1)} ${pts.pelvis.y.toFixed(1)} L ${pts.pelvis.x.toFixed(1)} ${(pts.pelvis.y - arcR).toFixed(1)} A ${arcR} ${arcR} 0 0 ${sweep} ${ex.toFixed(1)} ${ey.toFixed(1)} Z`
      );
      this.tiltArc.setAttribute('stroke', primaryColor);
      this.tiltArc.setAttribute('fill', secondaryGlow);

      // 3. Far-Side Leg (Rigid Fixed Bone Lengths)
      this.farThighMesh.setAttribute('d', buildSculptedLimbPath(pts.farHip, pts.farKnee, 13.0, 9.0, 2.4, 1.4));
      this.farCalfMesh.setAttribute('d', buildSculptedLimbPath(pts.farKnee, pts.farAnkle, 8.8, 5.4, 0.8, 3.0));
      this.farFootMesh.setAttribute('d', buildAnatomicalFootPath(pts.farAnkle, pts.farHeel, pts.farToe));
      this.farThighMesh.setAttribute('stroke', secondaryGlow);
      this.farCalfMesh.setAttribute('stroke', secondaryGlow);
      this.farFootMesh.setAttribute('stroke', secondaryGlow);

      // 4. Sculpted Neck, Torso & Head Human Silhouette (Rigid Fixed Bone Lengths)
      const torsoD = buildAnatomicalTorsoPath(pts.pelvis, pts.l3, pts.t8, pts.t1);
      this.neckMesh.setAttribute('d', buildSculptedLimbPath(pts.t1, pts.head, 8.0, 6.6, 0.4, 0.4));
      this.neckMesh.setAttribute('fill', bodyTintFill);
      this.neckMesh.setAttribute('stroke', primaryColor);

      this.torsoMesh.setAttribute('d', torsoD);
      this.torsoMesh.setAttribute('fill', bodyTintFill);
      this.torsoMesh.setAttribute('stroke', primaryColor);

      this.headGroup.setAttribute(
        'transform',
        `translate(${pts.head.x.toFixed(1)}, ${pts.head.y.toFixed(1)}) rotate(${pts.headPitch.toFixed(1)})`
      );
      this.headSilhouette.setAttribute('fill', bodyTintFill);
      this.headSilhouette.setAttribute('stroke', primaryColor);
      this.headVisor.setAttribute('fill', primaryColor);
      this.headEarNode.setAttribute('stroke', primaryColor);

      // 5. Foreground Leg (Rigid Fixed Bone Lengths)
      this.nearThighMesh.setAttribute('d', buildSculptedLimbPath(pts.pelvis, pts.knee, 14.5, 9.8, 2.8, 1.6));
      this.nearThighMesh.setAttribute('fill', bodyTintFill);
      this.nearThighMesh.setAttribute('stroke', primaryColor);

      this.nearCalfMesh.setAttribute('d', buildSculptedLimbPath(pts.knee, pts.ankle, 9.5, 5.8, 0.8, 3.5));
      this.nearCalfMesh.setAttribute('fill', bodyTintFill);
      this.nearCalfMesh.setAttribute('stroke', primaryColor);

      this.nearFootMesh.setAttribute('d', buildAnatomicalFootPath(pts.ankle, pts.heel, pts.toe));
      this.nearFootMesh.setAttribute('fill', bodyTintFill);
      this.nearFootMesh.setAttribute('stroke', primaryColor);

      // 6. Internal Biomonitor Spine & Limb Axis
      const spineD = `M ${pts.pelvis.x.toFixed(1)} ${pts.pelvis.y.toFixed(1)} Q ${pts.l3.x.toFixed(1)} ${pts.l3.y.toFixed(1)} ${((pts.l3.x + pts.t8.x) * 0.5).toFixed(1)} ${((pts.l3.y + pts.t8.y) * 0.5).toFixed(1)} T ${pts.t1.x.toFixed(1)} ${pts.t1.y.toFixed(1)} L ${pts.c4.x.toFixed(1)} ${pts.c4.y.toFixed(1)}`;
      this.spineCore.setAttribute('d', spineD);
      this.spineCore.setAttribute('stroke', primaryColor);

      const legBusD = `M ${pts.pelvis.x.toFixed(1)} ${pts.pelvis.y.toFixed(1)} L ${pts.knee.x.toFixed(1)} ${pts.knee.y.toFixed(1)} L ${pts.ankle.x.toFixed(1)} ${pts.ankle.y.toFixed(1)}`;
      this.legBoneBus.setAttribute('d', legBusD);
      this.legBoneBus.setAttribute('stroke', secondaryGlow);

      // 7. Foreground Arm (Rigid Fixed Bone Lengths)
      this.upperArmMesh.setAttribute('d', buildSculptedLimbPath(pts.shoulder, pts.elbow, 8.8, 6.6, 1.5, 1.1));
      this.forearmMesh.setAttribute('d', buildSculptedLimbPath(pts.elbow, pts.wrist, 6.4, 4.4, 1.1, 0.8));
      const forearmAngle = (Math.atan2(pts.wrist.y - pts.elbow.y, pts.wrist.x - pts.elbow.x) * 180) / Math.PI;
      const handCx = pts.wrist.x + Math.cos((forearmAngle * Math.PI) / 180) * 4;
      const handCy = pts.wrist.y + Math.sin((forearmAngle * Math.PI) / 180) * 4;
      this.handNode.setAttribute('cx', handCx.toFixed(1));
      this.handNode.setAttribute('cy', handCy.toFixed(1));
      this.handNode.setAttribute('transform', `rotate(${forearmAngle.toFixed(1)} ${handCx.toFixed(1)} ${handCy.toFixed(1)})`);

      // 8. Joint Reticles
      Object.keys(this.jointNodes).forEach((k) => {
        const node = this.jointNodes[k];
        node.setAttribute('cx', pts[k].x.toFixed(1));
        node.setAttribute('cy', pts[k].y.toFixed(1));
        if (k === 'c4') {
          node.setAttribute('fill', primaryColor);
          node.setAttribute('stroke', isBad ? '#FFE600' : '#FFFFFF');
        } else {
          node.setAttribute('stroke', primaryColor);
        }
      });

      // 9. Gaze Sightline, Sensor Cone & Dynamic Bounding Box
      const radPitch = (pts.headPitch * Math.PI) / 180;
      const visorX = pts.head.x + Math.cos(radPitch) * 16;
      const visorY = pts.head.y + Math.sin(radPitch) * 16;
      const gazeTargetX = d < -35 ? visorX + Math.cos(radPitch) * 85 : 392;
      const gazeTargetY = d < -35 ? Math.max(14, visorY + Math.sin(radPitch) * 85) : 78;

      this.gazeLine.setAttribute('x1', visorX.toFixed(1));
      this.gazeLine.setAttribute('y1', visorY.toFixed(1));
      this.gazeLine.setAttribute('x2', gazeTargetX.toFixed(1));
      this.gazeLine.setAttribute('y2', gazeTargetY.toFixed(1));
      this.gazeLine.setAttribute('stroke', secondaryGlow);

      this.deviceSensorDot.setAttribute('fill', primaryColor);
      this.fovBeam.setAttribute('fill', isBad ? 'rgba(255, 42, 109, 0.042)' : 'rgba(0, 240, 255, 0.024)');

      const { xmin: bx1, ymin: by1, xmax: bx2, ymax: by2 } = pts.bbox;
      const cLen = 15;
      this.bboxRect.setAttribute('x', bx1.toFixed(1));
      this.bboxRect.setAttribute('y', by1.toFixed(1));
      this.bboxRect.setAttribute('width', (bx2 - bx1).toFixed(1));
      this.bboxRect.setAttribute('height', (by2 - by1).toFixed(1));
      this.bboxRect.setAttribute('stroke', secondaryGlow);

      this.bboxCorners.setAttribute(
        'd',
        [
          `M ${bx1} ${by1 + cLen} L ${bx1} ${by1} L ${bx1 + cLen} ${by1}`,
          `M ${bx2 - cLen} ${by1} L ${bx2} ${by1} L ${bx2} ${by1 + cLen}`,
          `M ${bx1} ${by2 - cLen} L ${bx1} ${by2} L ${bx1 + cLen} ${by2}`,
          `M ${bx2 - cLen} ${by2} L ${bx2} ${by2} L ${bx2} ${by2 - cLen}`
        ].join(' ')
      );
      this.bboxCorners.setAttribute('stroke', primaryColor);

      // 10. Anime High-Speed Glitch Jitter & Head-Anchored Exclamation Marks (`!`)
      //     (Strictly active ONLY during Severe Forward Slouch +36° to +90°)
      if (isBad && !prefersReducedMotion) {
        const sevStrength = 0.55 + 0.45 * Math.min(1, Math.max(0, (d - 36) / 54));
        const glitchBurst = Math.sin(this.time * 19) > 0.72 ? 2.4 : 1.0;
        const jx = Math.sin(this.time * 47) * 1.9 * sevStrength * glitchBurst;
        const jy = Math.cos(this.time * 59) * 1.3 * sevStrength;

        this.characterRigGroup.setAttribute('transform', `translate(${jx.toFixed(2)}, ${jy.toFixed(2)})`);

        // Chromatic anime glitch echo on torso silhouette during burst frames
        this.glitchGhostTorso.setAttribute('d', torsoD);
        this.glitchGhostTorso.setAttribute(
          'transform',
          `translate(${(-jx * 1.8).toFixed(2)}, ${(-jy * 1.2).toFixed(2)})`
        );
        this.glitchGhostTorso.setAttribute('stroke', glitchBurst > 1.5 ? '#00F0FF' : '#FF007F');
        this.glitchGhostTorso.setAttribute('opacity', glitchBurst > 1.5 ? '0.62' : '0.26');

        // Anchor floating anime `!` marks directly to live head coordinates
        const anchorX = pts.head.x + jx * 0.6;
        const anchorY = pts.head.y + jy * 0.6;
        this.animeExclamGroup.setAttribute(
          'transform',
          `translate(${anchorX.toFixed(1)}, ${anchorY.toFixed(1)})`
        );
        this.animeExclamGroup.setAttribute('opacity', '1');

        const spikeFlicker = 0.55 + 0.45 * Math.abs(Math.sin(this.time * 28));
        this.animeShockSpikes.setAttribute('opacity', spikeFlicker.toFixed(2));

        for (let i = 0; i < this.animeMarks.length; i++) {
          const m = this.animeMarks[i];
          const floatWave = Math.sin(this.time * 6.5 + i * 2.1);
          const rapidTrembleX = Math.sin(this.time * 52 + i * 3.7) * 1.4;
          const rapidTrembleY = Math.cos(this.time * 61 + i * 2.3) * 1.1;
          const bobY = m.baseY - Math.abs(floatWave) * 6.5 + rapidTrembleY;
          const bobX = m.baseX + rapidTrembleX;
          const popScale = m.scale * (0.94 + 0.14 * Math.abs(Math.cos(this.time * 8 + i)));
          const flashAlt = Math.sin(this.time * 24 + i * 1.9) > 0.55;
          const activeColor = flashAlt ? (m.color === '#FF2A6D' ? '#FFE600' : '#FF2A6D') : m.color;

          m.stem.setAttribute('fill', activeColor);
          m.dot.setAttribute('fill', activeColor);
          m.el.setAttribute(
            'transform',
            `translate(${bobX.toFixed(1)}, ${bobY.toFixed(1)}) rotate(${m.baseRot}) scale(${popScale.toFixed(2)})`
          );
        }
      } else {
        this.characterRigGroup.setAttribute('transform', 'translate(0, 0)');
        this.glitchGhostTorso.setAttribute('opacity', '0');
        this.animeExclamGroup.setAttribute('opacity', '0');
      }

      // 11. Concentric Alert Ripple Rings (Strictly ONLY in +36°..+90° Severe Slouch)
      const alertPower = isBad ? 0.90 : 0;
      for (let i = 0; i < this.ripples.length; i++) {
        const ring = this.ripples[i];
        if (alertPower > 0) {
          const phase = ((this.time * 0.72) + i / 3) % 1;
          const radius = 8 + phase * 50;
          const alpha = (1 - phase) * 0.82 * alertPower;
          ring.setAttribute('cx', pts.head.x.toFixed(1));
          ring.setAttribute('cy', pts.head.y.toFixed(1));
          ring.setAttribute('r', radius.toFixed(1));
          ring.setAttribute('stroke', i % 2 === 0 ? '#FF2A6D' : '#FFE600');
          ring.setAttribute('opacity', alpha.toFixed(3));
        } else {
          ring.setAttribute('opacity', '0');
        }
      }

      if (this.onAngleUpdate) {
        this.onAngleUpdate(evalInfo);
      }

      if (!prefersReducedMotion) {
        requestAnimationFrame(this._animate);
      }
    }
  }

  // =========================================================================
  // 7. Animated 740 Hz Acoustic Biofeedback Waveform
  // =========================================================================
  class FrequencyWaveform740 {
    constructor(canvasEl) {
      this.canvas = typeof canvasEl === 'string'
        ? document.querySelector(canvasEl)
        : canvasEl;
      if (!this.canvas) return;
      this.ctx = this.canvas.getContext('2d');
      this.mode = 'good'; // 'good' | 'warn' | 'bad'
      this.amp = 0.09;
      this.phase = 0;

      this._resize = this._resize.bind(this);
      this._render = this._render.bind(this);
      this._resize();
      window.addEventListener('resize', this._resize, { passive: true });
      requestAnimationFrame(this._render);
    }

    _resize() {
      if (!this.canvas) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = this.canvas.getBoundingClientRect();
      const w = Math.max(180, rect.width || 280);
      const h = Math.max(38, rect.height || 44);
      this.canvas.width = Math.round(w * dpr);
      this.canvas.height = Math.round(h * dpr);
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      this.w = w;
      this.h = h;
    }

    setAlertActive(isBad, isWarning = false) {
      if (isBad) this.mode = 'bad';
      else if (isWarning) this.mode = 'warn';
      else this.mode = 'good';
    }

    _render() {
      if (!this.ctx) return;
      const w = this.w;
      const h = this.h;
      const midY = h / 2;

      const isBad = this.mode === 'bad';
      const isWarn = this.mode === 'warn';
      const cadence = isBad ? (0.62 + 0.38 * Math.abs(Math.sin(this.phase * 0.09))) : 1;
      const targetAmp = isBad ? 0.84 * cadence : isWarn ? 0.28 : 0.09;

      this.amp += (targetAmp - this.amp) * 0.09;
      this.phase += isBad ? 0.25 : isWarn ? 0.12 : 0.06;

      this.ctx.clearRect(0, 0, w, h);

      this.ctx.beginPath();
      this.ctx.moveTo(0, midY);
      this.ctx.lineTo(w, midY);
      this.ctx.strokeStyle = 'rgba(0, 240, 255, 0.12)';
      this.ctx.lineWidth = 1;
      this.ctx.stroke();

      this.ctx.beginPath();
      for (let x = 0; x <= w; x += 2) {
        const norm = x / w;
        const env = Math.sin(norm * Math.PI);
        const y = midY + Math.sin(norm * 26 - this.phase * 1.35) * (midY - 5) * this.amp * 0.52 * env;
        if (x === 0) this.ctx.moveTo(x, y);
        else this.ctx.lineTo(x, y);
      }
      this.ctx.strokeStyle = isBad
        ? 'rgba(255, 230, 0, 0.65)'
        : isWarn
          ? 'rgba(255, 0, 127, 0.45)'
          : 'rgba(255, 0, 127, 0.32)';
      this.ctx.lineWidth = 1.4;
      this.ctx.stroke();

      this.ctx.beginPath();
      for (let x = 0; x <= w; x += 2) {
        const norm = x / w;
        const env = Math.pow(Math.sin(norm * Math.PI), 0.85);
        const y = midY + Math.sin(norm * 18 - this.phase) * (midY - 4) * this.amp * env;
        if (x === 0) this.ctx.moveTo(x, y);
        else this.ctx.lineTo(x, y);
      }
      this.ctx.strokeStyle = isBad ? '#FF2A6D' : isWarn ? '#FFE600' : '#00F0FF';
      this.ctx.lineWidth = 2.3;
      this.ctx.stroke();

      if (!prefersReducedMotion) {
        requestAnimationFrame(this._render);
      }
    }
  }

  window.PostureMotion = {
    initParticleRodBackground,
    initNetlifyFluidMeshBackground,
    initReactorControlRodEngine: initNetlifyFluidMeshBackground,
    initCursorRodBackground: initNetlifyFluidMeshBackground,
    initCursorParticleBackground: initNetlifyFluidMeshBackground,
    initGlassHoverSpotlights,
    evaluatePostureDegrees,
    computeRigidPoseAtDegrees,
    BONE_LENGTHS,
    animateCounter,
    PostureSkeletonModel,
    FrequencyWaveform740,
    setGlobalAlertMood() {}
  };

  window.addEventListener('DOMContentLoaded', () => {
    initNetlifyFluidMeshBackground();
    initGlassHoverSpotlights();
  });
})();
