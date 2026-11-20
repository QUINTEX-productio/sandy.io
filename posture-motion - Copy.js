/**
 * PostureAI — Cyberpunk + iOS Liquid Glass Motion & Biomechanical Engine
 * ---------------------------------------------------------------------------
 * 1. Cursor-bound interactive particle background (completely hidden at rest;
 *    instantiates glowing #00F0FF cyan & #FF007F magenta particles only under
 *    and around active mouse movement, dispersing cleanly into void).
 * 2. Ergonomic Posture Verification Engine (0°–45°+ Trunk/Cervical Tilt &
 *    100°–110° Optimal Recline medical reference standards).
 * 3. Real-time morphing Vector Silhouette + Articulated Spine Visualizer.
 * 4. 740 Hz Biofeedback Oscilloscope & Zero-Shift Tabular Counters.
 */
(function () {
  'use strict';

  const prefersReducedMotion = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // =========================================================================
  // 1. Cursor-Bound Interactive Particle Background (Hidden By Default)
  // =========================================================================
  function initCursorParticleBackground() {
    let canvas = document.getElementById('ambientBgCanvas');
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.id = 'ambientBgCanvas';
      canvas.setAttribute('aria-hidden', 'true');
      document.body.prepend(canvas);
    }

    const ctx = canvas.getContext('2d');
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Particles array starts COMPLETELY EMPTY — nothing visible by default!
    const particles = [];
    const MAX_PARTICLES = 130;

    const cursor = {
      x: -9999,
      y: -9999,
      lastX: null,
      lastY: null,
      glowAlpha: 0
    };

    let animRunning = false;

    window.addEventListener('resize', () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    }, { passive: true });

    function spawnCursorParticles(x, y, dx, dy) {
      if (prefersReducedMotion) return;
      const speed = Math.hypot(dx, dy);
      if (speed < 0.4) return;

      // Spawn 2 to 5 particles depending on cursor velocity
      const count = Math.min(5, Math.max(2, Math.floor(speed * 0.16)));

      for (let i = 0; i < count; i++) {
        if (particles.length >= MAX_PARTICLES) {
          particles.shift();
        }

        const angle = Math.random() * Math.PI * 2;
        const spread = Math.random() * 14;
        const disperseSpeed = 0.45 + Math.random() * 1.85;
        const isCyan = Math.random() > 0.44; // Mix of #00F0FF Cyan & #FF007F Magenta

        particles.push({
          x: x + Math.cos(angle) * spread,
          y: y + Math.sin(angle) * spread,
          vx: Math.cos(angle) * disperseSpeed + dx * 0.055,
          vy: Math.sin(angle) * disperseSpeed + dy * 0.055 - 0.15,
          size: 1.5 + Math.random() * 2.6,
          life: 1.0,
          decay: 0.014 + Math.random() * 0.016,
          isCyan: isCyan
        });
      }

      cursor.glowAlpha = Math.min(1, cursor.glowAlpha + 0.28);

      if (!animRunning) {
        animRunning = true;
        requestAnimationFrame(renderParticles);
      }
    }

    window.addEventListener('pointermove', (e) => {
      const x = e.clientX;
      const y = e.clientY;
      if (cursor.lastX !== null && cursor.lastY !== null) {
        const dx = x - cursor.lastX;
        const dy = y - cursor.lastY;
        cursor.x = x;
        cursor.y = y;
        spawnCursorParticles(x, y, dx, dy);
      }
      cursor.lastX = x;
      cursor.lastY = y;
    }, { passive: true });

    window.addEventListener('pointerleave', () => {
      cursor.lastX = null;
      cursor.lastY = null;
    }, { passive: true });

    function renderParticles() {
      ctx.clearRect(0, 0, width, height);

      cursor.glowAlpha *= 0.91;

      ctx.save();
      ctx.globalCompositeOperation = 'lighter';

      // Subtle localized cursor halo ONLY while moving (fades to 0 at rest)
      if (cursor.glowAlpha > 0.008) {
        const halo = ctx.createRadialGradient(cursor.x, cursor.y, 0, cursor.x, cursor.y, 155);
        halo.addColorStop(0, `rgba(0, 240, 255, ${(cursor.glowAlpha * 0.11).toFixed(3)})`);
        halo.addColorStop(0.48, `rgba(255, 0, 127, ${(cursor.glowAlpha * 0.065).toFixed(3)})`);
        halo.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(cursor.x, cursor.y, 155, 0, Math.PI * 2);
        ctx.fill();
      }

      // Update & draw dispersing cursor-spawned particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.962;
        p.vy *= 0.962;
        p.life -= p.decay;

        if (p.life <= 0.01) {
          particles.splice(i, 1);
          continue;
        }

        const alpha = p.life * p.life;
        const r = p.size * (0.65 + p.life * 0.55);

        // Soft outer neon glow
        const glowR = r * 4.2;
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, glowR);
        if (p.isCyan) {
          grad.addColorStop(0, `rgba(0, 240, 255, ${(alpha * 0.88).toFixed(3)})`);
          grad.addColorStop(0.4, `rgba(0, 240, 255, ${(alpha * 0.28).toFixed(3)})`);
          grad.addColorStop(1, 'rgba(0, 240, 255, 0)');
        } else {
          grad.addColorStop(0, `rgba(255, 0, 127, ${(alpha * 0.88).toFixed(3)})`);
          grad.addColorStop(0.4, `rgba(255, 0, 127, ${(alpha * 0.28).toFixed(3)})`);
          grad.addColorStop(1, 'rgba(255, 0, 127, 0)');
        }

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, glowR, 0, Math.PI * 2);
        ctx.fill();

        // Crisp hot white-neon core
        ctx.fillStyle = `rgba(255, 255, 255, ${(alpha * 0.85).toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, r * 0.55, 0, Math.PI * 2);
        ctx.fill();

        // Delicate transient filaments between nearby active cursor particles
        for (let j = i - 1; j >= Math.max(0, i - 10); j--) {
          const q = particles[j];
          if (!q) continue;
          const dist = Math.hypot(p.x - q.x, p.y - q.y);
          if (dist < 62) {
            const lineAlpha = (1 - dist / 62) * Math.min(alpha, q.life * q.life) * 0.26;
            ctx.strokeStyle = p.isCyan
              ? `rgba(0, 240, 255, ${lineAlpha.toFixed(3)})`
              : `rgba(255, 0, 127, ${lineAlpha.toFixed(3)})`;
            ctx.lineWidth = 0.85;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.stroke();
          }
        }
      }

      ctx.restore();

      // Sleep cleanly when all particles disperse & fade out (100% hidden at rest)
      if (particles.length > 0 || cursor.glowAlpha > 0.008) {
        requestAnimationFrame(renderParticles);
      } else {
        ctx.clearRect(0, 0, width, height);
        animRunning = false;
      }
    }
  }

  // =========================================================================
  // 2. Liquid Glass Card Specular Spotlight Tracking
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
          card.style.setProperty('--glow-alpha', inside ? '1' : '0.3');
        } else {
          card.style.setProperty('--glow-alpha', '0');
        }
      }
    }, { passive: true });
  }

  // =========================================================================
  // 3. Verified Ergonomic Medical Reference Engine (0° to 45°+ Tilt)
  // =========================================================================
  function evaluatePostureDegrees(rawDegrees) {
    const deg = Math.max(0, Math.min(50, Number(rawDegrees) || 0));
    // Recline angle: 0° forward tilt = 110° relaxed ergonomic recline,
    // 10° tilt = 100° upright optimal, 20°+ tilt = <90° forward flexion
    const reclineDeg = Math.round(110 - deg);
    const tiltDisplay = deg >= 45 ? `${Math.round(deg)}°+` : `${Math.round(deg)}°`;

    // Optimal Range: 0°–10° Forward Trunk Tilt (100°–110° Recline) -> sitting_good
    if (deg <= 10) {
      const conf = Math.round(99 - (deg / 10) * 5); // 99% -> 94%
      return {
        degrees: deg,
        tiltDisplay,
        reclineDeg,
        classification: 'sitting_good',
        severity: 'optimal',
        badgeClass: 'flow-badge-good',
        dotClass: 'status-dot-good',
        accentColor: '#00F0FF',
        confidence: conf,
        summary: `Optimal Range (${reclineDeg}° Recline • ${Math.round(deg)}° Tilt) — Neutral lumbar lordosis & aligned cervical spine.`
      };
    }

    // Transitional Biofeedback Warning Zone: 11°–19° Mild Forward Lean -> High-Vis Yellow
    if (deg < 20) {
      const conf = Math.round(85 + ((deg - 11) / 8) * 6); // 85% -> 91%
      return {
        degrees: deg,
        tiltDisplay,
        reclineDeg,
        classification: 'sitting_good',
        severity: 'warning',
        badgeClass: 'flow-badge-yellow',
        dotClass: 'status-dot-yellow',
        accentColor: '#FFE600',
        confidence: conf,
        summary: `Caution Threshold (${Math.round(deg)}° Forward Lean) — Approaching 20° slouch flexion limit.`
      };
    }

    // Slouch Range: 20°–45°+ Forward Flexion & Thoracic Kyphosis -> sitting_bad
    const normBad = Math.min(1, (deg - 20) / 25);
    const conf = Math.round(90 + normBad * 9); // 90% -> 99%
    const isSevere = deg >= 32;
    return {
      degrees: deg,
      tiltDisplay,
      reclineDeg,
      classification: 'sitting_bad',
      severity: isSevere ? 'severe' : 'slouch',
      badgeClass: 'flow-badge-bad',
      dotClass: 'status-dot-bad',
      accentColor: isSevere ? '#FF2A6D' : '#FFE600',
      confidence: conf,
      summary: isSevere
        ? `Severe Slouch (${tiltDisplay} Flexion & Kyphosis) — High cervical disc load; 740 Hz hardware alert active!`
        : `Slouch Detected (${Math.round(deg)}° Forward Flexion) — Exceeds 20° threshold; straighten thoracic spine.`
    };
  }

  // =========================================================================
  // 4. Smooth Tabular Counter Micro-Interaction
  // =========================================================================
  const counterMap = new WeakMap();

  function animateCounter(el, targetValue, opts = {}) {
    if (!el) return;
    const prefix = opts.prefix || '';
    const suffix = opts.suffix || '';
    const decimals = typeof opts.decimals === 'number' ? opts.decimals : 0;
    const durationMs = opts.durationMs || 420;

    const endVal = Number(targetValue);
    if (Number.isNaN(endVal)) {
      el.textContent = `${prefix}${targetValue}${suffix}`;
      return;
    }

    const prevState = counterMap.get(el) || { val: endVal };
    if (prevState.rafId) cancelAnimationFrame(prevState.rafId);

    if (window.gsap && !prefersReducedMotion) {
      window.gsap.killTweensOf(prevState);
      window.gsap.to(prevState, {
        val: endVal,
        duration: durationMs / 1000,
        ease: 'power3.out',
        onUpdate: () => {
          el.textContent = `${prefix}${prevState.val.toFixed(decimals)}${suffix}`;
        }
      });
      counterMap.set(el, prevState);
      return;
    }

    const startVal = prevState.val;
    const startTime = performance.now();

    function step(now) {
      const t = Math.min(1, (now - startTime) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3);
      const current = startVal + (endVal - startVal) * eased;
      prevState.val = current;
      el.textContent = `${prefix}${current.toFixed(decimals)}${suffix}`;
      if (t < 1) {
        prevState.rafId = requestAnimationFrame(step);
      }
    }

    prevState.rafId = requestAnimationFrame(step);
    counterMap.set(el, prevState);
  }

  // =========================================================================
  // 5. Real-Time Morphing Vector Silhouette & Articulated Spine Visualizer
  //    Supports continuous 0°–50° (45°+) degrees AND discrete state calls!
  // =========================================================================
  const SVG_NS = 'http://www.w3.org/2000/svg';

  function createSvgEl(tag, attrs = {}) {
    const el = document.createElementNS(SVG_NS, tag);
    for (const [k, v] of Object.entries(attrs)) {
      el.setAttribute(k, String(v));
    }
    return el;
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  // Keyframe 0: 0° Forward Tilt (110° Ergonomic Recline — Optimal sitting_good)
  const POSE_0_DEG = {
    knee:     { x: 244, y: 210 },
    pelvis:   { x: 168, y: 208 },
    l4:       { x: 163, y: 184 }, // Healthy inward lumbar lordosis
    l1:       { x: 160, y: 159 },
    t9:       { x: 156, y: 135 },
    t5:       { x: 154, y: 111 },
    t1:       { x: 156, y: 87  }, // Neutral shoulder/cervical base
    c4:       { x: 158, y: 68  },
    c1:       { x: 160, y: 52  },
    head:     { x: 163, y: 37  },
    shoulder: { x: 163, y: 94  },
    elbow:    { x: 192, y: 144 },
    wrist:    { x: 254, y: 150 },
    bbox:     { xmin: 118, ymin: 11, xmax: 222, ymax: 224 }
  };

  // Keyframe 1: 45°+ Forward Flexion & Thoracic Kyphosis (Severe sitting_bad)
  const POSE_45_DEG = {
    knee:     { x: 244, y: 210 },
    pelvis:   { x: 162, y: 210 },
    l4:       { x: 154, y: 188 }, // Flattened/rounded lumbar flexion
    l1:       { x: 158, y: 164 },
    t9:       { x: 173, y: 141 }, // Pronounced thoracic kyphosis hump
    t5:       { x: 196, y: 120 },
    t1:       { x: 222, y: 103 },
    c4:       { x: 244, y: 89  }, // Forward cervical crane
    c1:       { x: 261, y: 78  },
    head:     { x: 271, y: 66  }, // Severe forward head posture
    shoulder: { x: 225, y: 111 },
    elbow:    { x: 238, y: 150 },
    wrist:    { x: 282, y: 150 },
    bbox:     { xmin: 124, ymin: 34, xmax: 304, ymax: 224 }
  };

  class PostureSkeletonModel {
    constructor(containerEl, options = {}) {
      this.container = typeof containerEl === 'string'
        ? document.querySelector(containerEl)
        : containerEl;
      if (!this.container) return;

      this.compact = Boolean(options.compact);
      this.onAngleUpdate = options.onAngleUpdate || null;

      this.degrees = 4; // Default 4° tilt (106° recline — right inside Optimal 0°–10°)
      this.targetDegrees = 4;
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
        viewBox: '0 0 420 250',
        width: '100%',
        style: `max-height: ${this.compact ? '205px' : '248px'}; display: block;`
      });

      const uid = Math.random().toString(36).slice(2, 7);
      const defs = createSvgEl('defs');
      defs.innerHTML = `
        <pattern id="cyberGrid_${uid}" width="26" height="26" patternUnits="userSpaceOnUse">
          <path d="M 26 0 L 0 0 0 26" fill="none" stroke="rgba(0, 240, 255, 0.045)" stroke-width="1"/>
        </pattern>
        <filter id="spineNeonGlow_${uid}" x="-35%" y="-35%" width="170%" height="170%">
          <feGaussianBlur stdDeviation="3.4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      `;
      this.glowFilterId = `spineNeonGlow_${uid}`;
      svg.appendChild(defs);

      // Subtle viewport grid
      svg.appendChild(createSvgEl('rect', {
        x: 0, y: 0, width: 420, height: 250, rx: 14,
        fill: `url(#cyberGrid_${uid})`
      }));

      // Desk, Chair & Perched PostureAI Sensor Context
      const env = createSvgEl('g', { opacity: '0.82' });
      // Ergonomic reclined chair back + seat
      env.appendChild(createSvgEl('path', {
        d: 'M 122 108 L 136 214 L 210 214',
        fill: 'none', stroke: 'rgba(148, 163, 184, 0.28)', 'stroke-width': 6,
        'stroke-linecap': 'round', 'stroke-linejoin': 'round'
      }));
      env.appendChild(createSvgEl('line', {
        x1: 170, y1: 214, x2: 170, y2: 238,
        stroke: 'rgba(148, 163, 184, 0.25)', 'stroke-width': 5, 'stroke-linecap': 'round'
      }));
      // Desk + Monitor
      env.appendChild(createSvgEl('rect', {
        x: 248, y: 156, width: 148, height: 6, rx: 3,
        fill: 'rgba(148, 163, 184, 0.28)'
      }));
      env.appendChild(createSvgEl('line', {
        x1: 356, y1: 72, x2: 356, y2: 156,
        stroke: 'rgba(148, 163, 184, 0.34)', 'stroke-width': 5, 'stroke-linecap': 'round'
      }));
      env.appendChild(createSvgEl('rect', {
        x: 338, y: 50, width: 32, height: 62, rx: 6,
        fill: 'rgba(10, 14, 23, 0.9)', stroke: 'rgba(0, 240, 255, 0.35)', 'stroke-width': 1.5
      }));

      this.fovBeam = createSvgEl('polygon', {
        points: '334,44 114,14 114,226',
        fill: 'rgba(0, 240, 255, 0.04)'
      });
      this.deviceSensorDot = createSvgEl('circle', {
        cx: 336, cy: 44, r: 4.2, fill: '#00F0FF'
      });
      env.appendChild(this.fovBeam);
      env.appendChild(createSvgEl('rect', {
        x: 330, y: 38, width: 22, height: 12, rx: 3,
        fill: '#05070B', stroke: 'rgba(255, 255, 255, 0.3)', 'stroke-width': 1.2
      }));
      env.appendChild(this.deviceSensorDot);
      svg.appendChild(env);

      // Optimal 0°–10° Reference Cone / Vertical Plumb Axis from Pelvis
      this.optimalZoneWedge = createSvgEl('path', {
        d: '',
        fill: 'rgba(0, 240, 255, 0.055)',
        stroke: 'none'
      });
      this.plumbLine = createSvgEl('line', {
        x1: 168, y1: 18, x2: 168, y2: 220,
        stroke: 'rgba(0, 240, 255, 0.30)',
        'stroke-width': 1.3,
        'stroke-dasharray': '4,4'
      });
      svg.appendChild(this.optimalZoneWedge);
      svg.appendChild(this.plumbLine);

      // Dynamic Trunk Tilt Wedge Arc
      this.tiltArc = createSvgEl('path', {
        d: '',
        fill: 'rgba(0, 240, 255, 0.14)',
        stroke: '#00F0FF',
        'stroke-width': 1.6
      });
      svg.appendChild(this.tiltArc);

      // Morphing Translucent Vector Body Silhouette (Torso + Thigh)
      this.thighBar = createSvgEl('line', {
        x1: 168, y1: 208, x2: 244, y2: 210,
        stroke: 'rgba(148, 163, 184, 0.35)',
        'stroke-width': 16,
        'stroke-linecap': 'round'
      });
      this.torsoSilhouette = createSvgEl('path', {
        d: '',
        fill: 'none',
        stroke: 'rgba(0, 240, 255, 0.13)',
        'stroke-width': 32,
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round'
      });
      svg.appendChild(this.thighBar);
      svg.appendChild(this.torsoSilhouette);

      // Concentric Biofeedback Ripple Rings at C4/T1 Alert Node
      this.rippleGroup = createSvgEl('g');
      this.ripples = [0, 1, 2].map(() => {
        const ring = createSvgEl('circle', {
          cx: 224, cy: 89, r: 8,
          fill: 'none',
          stroke: '#FF2A6D',
          'stroke-width': 2,
          opacity: 0
        });
        this.rippleGroup.appendChild(ring);
        return ring;
      });
      svg.appendChild(this.rippleGroup);

      // YOLOv5 Vision Bounding Frame & Corner Brackets
      this.bboxRect = createSvgEl('rect', {
        x: 118, y: 11, width: 104, height: 213, rx: 8,
        fill: 'none',
        stroke: 'rgba(0, 240, 255, 0.22)',
        'stroke-width': 1.2,
        'stroke-dasharray': '6,4'
      });
      this.bboxCorners = createSvgEl('path', {
        d: '',
        fill: 'none',
        stroke: '#00F0FF',
        'stroke-width': 2.6,
        'stroke-linecap': 'round'
      });
      svg.appendChild(this.bboxRect);
      svg.appendChild(this.bboxCorners);

      // Pelvis & Ribcage Wireframes
      this.pelvisEllipse = createSvgEl('ellipse', {
        cx: 168, cy: 208, rx: 17, ry: 7.5,
        fill: 'rgba(0, 240, 255, 0.08)',
        stroke: '#00F0FF',
        'stroke-width': 1.7
      });
      this.ribCageUpper = createSvgEl('ellipse', {
        cx: 159, cy: 111, rx: 19, ry: 11.5,
        fill: 'rgba(0, 240, 255, 0.06)',
        stroke: 'rgba(0, 240, 255, 0.45)',
        'stroke-width': 1.4
      });
      svg.appendChild(this.pelvisEllipse);
      svg.appendChild(this.ribCageUpper);

      // Articulated Spine Glow & Core Curve
      this.spineGlow = createSvgEl('path', {
        d: '',
        fill: 'none',
        stroke: 'rgba(0, 240, 255, 0.28)',
        'stroke-width': 10,
        'stroke-linecap': 'round'
      });
      this.spineCore = createSvgEl('path', {
        d: '',
        fill: 'none',
        stroke: '#00F0FF',
        'stroke-width': 3.6,
        'stroke-linecap': 'round',
        filter: `url(#${this.glowFilterId})`
      });
      svg.appendChild(this.spineGlow);
      svg.appendChild(this.spineCore);

      // Arm Linkage
      this.armPath = createSvgEl('path', {
        d: '',
        fill: 'none',
        stroke: 'rgba(241, 245, 249, 0.78)',
        'stroke-width': 3.2,
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round'
      });
      svg.appendChild(this.armPath);

      // Head Silhouette, Wireframe Orbit & Gaze Vector
      this.gazeLine = createSvgEl('line', {
        x1: 180, y1: 37, x2: 334, y2: 72,
        stroke: 'rgba(0, 240, 255, 0.36)',
        'stroke-width': 1.4,
        'stroke-dasharray': '3,4'
      });
      this.headCircle = createSvgEl('circle', {
        cx: 163, cy: 37, r: 17,
        fill: 'rgba(8, 12, 20, 0.88)',
        stroke: '#00F0FF',
        'stroke-width': 2.4
      });
      this.headOrbit = createSvgEl('ellipse', {
        cx: 163, cy: 37, rx: 17, ry: 5.8,
        fill: 'none',
        stroke: 'rgba(0, 240, 255, 0.36)',
        'stroke-width': 1.1
      });
      this.eyeDot = createSvgEl('circle', {
        cx: 176, cy: 37, r: 2.6,
        fill: '#00F0FF'
      });
      svg.appendChild(this.gazeLine);
      svg.appendChild(this.headCircle);
      svg.appendChild(this.headOrbit);
      svg.appendChild(this.eyeDot);

      // Vertebral & Limb Joint Nodes
      const jointKeys = ['pelvis', 'l4', 'l1', 't9', 't5', 't1', 'c4', 'c1', 'shoulder', 'elbow', 'wrist'];
      this.jointNodes = {};
      jointKeys.forEach((k) => {
        const isAlert = k === 'c4';
        const r = isAlert ? 5.2 : (k === 'pelvis' || k === 't1' ? 4.2 : 3.3);
        const node = createSvgEl('circle', {
          cx: POSE_0_DEG[k].x,
          cy: POSE_0_DEG[k].y,
          r,
          fill: isAlert ? '#00F0FF' : '#05070B',
          stroke: '#00F0FF',
          'stroke-width': isAlert ? 2.4 : 2
        });
        svg.appendChild(node);
        this.jointNodes[k] = node;
      });

      this.svg = svg;
      this.container.appendChild(svg);
    }

    setDegrees(deg, useSpring = true) {
      const clamped = Math.max(0, Math.min(50, Number(deg) || 0));
      this.targetDegrees = clamped;
      this.mode = clamped >= 20 ? 'sitting_bad' : 'sitting_good';

      if (window.gsap && !prefersReducedMotion) {
        window.gsap.killTweensOf(this, 'degrees');
        window.gsap.to(this, {
          degrees: clamped,
          duration: useSpring ? 0.85 : 0.30,
          ease: useSpring ? 'elastic.out(1, 0.62)' : 'power3.out'
        });
      } else if (!useSpring) {
        this.degrees = clamped;
      }
    }

    setState(stateName) {
      if (stateName === 'idle' || stateName === 'no_target') {
        this.mode = 'idle';
        this.setDegrees(5, true);
        return;
      }
      this.mode = stateName;
      if (stateName === 'sitting_bad') {
        this.setDegrees(34, true);
      } else {
        this.setDegrees(4, true);
      }
    }

    setSlouchProgress(progress01) {
      const p = Math.max(0, Math.min(1, Number(progress01) || 0));
      this.setDegrees(p * 48, false);
    }

    _animate() {
      this.time += 0.032;

      if (!window.gsap || prefersReducedMotion) {
        const k = 0.09;
        const damp = 0.76;
        this.vel = (this.vel + (this.targetDegrees - this.degrees) * k) * damp;
        this.degrees += this.vel;
      }

      const d = Math.max(0, Math.min(50, this.degrees));
      const s = Math.min(1.08, d / 45); // Normalized morph factor (0 at 0°, 1 at 45°)
      const isIdle = this.mode === 'idle';
      const evalInfo = evaluatePostureDegrees(d);

      const primaryColor = isIdle
        ? '#94A3B8'
        : (evalInfo.severity === 'severe' ? '#FF2A6D'
          : evalInfo.severity === 'slouch' ? '#FF2A6D'
          : evalInfo.severity === 'warning' ? '#FFE600'
          : '#00F0FF');

      const secondaryGlow = isIdle
        ? 'rgba(148, 163, 184, 0.25)'
        : (d >= 20 ? 'rgba(255, 42, 109, 0.34)'
          : d > 10 ? 'rgba(255, 230, 0, 0.30)'
          : 'rgba(0, 240, 255, 0.30)');

      const highlightAccent = isIdle
        ? '#CBD5E1'
        : (d >= 20 ? '#FFE600' : d > 10 ? '#FFE600' : '#FF007F');

      const breath = prefersReducedMotion ? 0 : Math.sin(this.time * 1.45) * 1.4;

      const pts = {};
      const keys = ['knee', 'pelvis', 'l4', 'l1', 't9', 't5', 't1', 'c4', 'c1', 'head', 'shoulder', 'elbow', 'wrist'];
      for (let i = 0; i < keys.length; i++) {
        const k = keys[i];
        const bx = (k === 't5' || k === 't1' || k === 'shoulder') ? breath * 0.5 : 0;
        const by = (k === 'head' || k === 'c1' || k === 't1') ? -breath * 0.4 : 0;
        pts[k] = {
          x: lerp(POSE_0_DEG[k].x, POSE_45_DEG[k].x, s) + bx,
          y: lerp(POSE_0_DEG[k].y, POSE_45_DEG[k].y, s) + by
        };
      }

      // Optimal 100°–110° Recline / 0°–10° Tilt Reference Wedge from Pelvis
      const wedgeH = 155;
      const rad10 = (10 * Math.PI) / 180;
      const wxLeft = pts.pelvis.x - Math.sin(rad10 * 0.8) * wedgeH;
      const wyTop = pts.pelvis.y - wedgeH;
      const wxRight = pts.pelvis.x + Math.sin(rad10) * wedgeH;
      this.optimalZoneWedge.setAttribute(
        'd',
        `M ${pts.pelvis.x.toFixed(1)} ${pts.pelvis.y.toFixed(1)} L ${wxLeft.toFixed(1)} ${wyTop.toFixed(1)} L ${wxRight.toFixed(1)} ${wyTop.toFixed(1)} Z`
      );
      this.plumbLine.setAttribute('x1', pts.pelvis.x.toFixed(1));
      this.plumbLine.setAttribute('x2', pts.pelvis.x.toFixed(1));

      // Thigh & Morphing Torso Silhouette
      this.thighBar.setAttribute('x1', pts.pelvis.x.toFixed(1));
      this.thighBar.setAttribute('y1', pts.pelvis.y.toFixed(1));

      const spineVerts = [pts.pelvis, pts.l4, pts.l1, pts.t9, pts.t5, pts.t1, pts.c4, pts.c1];
      let dSpine = `M ${spineVerts[0].x.toFixed(1)} ${spineVerts[0].y.toFixed(1)}`;
      for (let i = 1; i < spineVerts.length - 1; i++) {
        const xc = (spineVerts[i].x + spineVerts[i + 1].x) / 2;
        const yc = (spineVerts[i].y + spineVerts[i + 1].y) / 2;
        dSpine += ` Q ${spineVerts[i].x.toFixed(1)} ${spineVerts[i].y.toFixed(1)}, ${xc.toFixed(1)} ${yc.toFixed(1)}`;
      }
      const lastV = spineVerts[spineVerts.length - 1];
      dSpine += ` T ${lastV.x.toFixed(1)} ${lastV.y.toFixed(1)}`;

      this.torsoSilhouette.setAttribute('d', dSpine);
      this.torsoSilhouette.setAttribute(
        'stroke',
        isIdle ? 'rgba(148,163,184,0.12)' : (d >= 20 ? 'rgba(255, 42, 109, 0.15)' : d > 10 ? 'rgba(255, 230, 0, 0.13)' : 'rgba(0, 240, 255, 0.13)')
      );

      this.spineGlow.setAttribute('d', dSpine);
      this.spineGlow.setAttribute('stroke', secondaryGlow);
      this.spineCore.setAttribute('d', dSpine);
      this.spineCore.setAttribute('stroke', primaryColor);

      // Pelvis & Ribcage
      this.pelvisEllipse.setAttribute('cx', pts.pelvis.x.toFixed(1));
      this.pelvisEllipse.setAttribute('cy', pts.pelvis.y.toFixed(1));
      this.pelvisEllipse.setAttribute('stroke', primaryColor);

      const ribRot = s * 25;
      this.ribCageUpper.setAttribute('cx', (pts.t5.x + 5).toFixed(1));
      this.ribCageUpper.setAttribute('cy', (pts.t5.y + 2).toFixed(1));
      this.ribCageUpper.setAttribute('transform', `rotate(${ribRot.toFixed(1)} ${(pts.t5.x + 5).toFixed(1)} ${(pts.t5.y + 2).toFixed(1)})`);
      this.ribCageUpper.setAttribute('stroke', secondaryGlow);

      // Arm Linkage
      this.armPath.setAttribute(
        'd',
        `M ${pts.shoulder.x.toFixed(1)} ${pts.shoulder.y.toFixed(1)} L ${pts.elbow.x.toFixed(1)} ${pts.elbow.y.toFixed(1)} L ${pts.wrist.x.toFixed(1)} ${pts.wrist.y.toFixed(1)}`
      );

      // Head & Gaze Sightline
      const headRot = s * 20;
      this.headCircle.setAttribute('cx', pts.head.x.toFixed(1));
      this.headCircle.setAttribute('cy', pts.head.y.toFixed(1));
      this.headCircle.setAttribute('stroke', primaryColor);

      this.headOrbit.setAttribute('cx', pts.head.x.toFixed(1));
      this.headOrbit.setAttribute('cy', pts.head.y.toFixed(1));
      this.headOrbit.setAttribute('transform', `rotate(${headRot.toFixed(1)} ${pts.head.x.toFixed(1)} ${pts.head.y.toFixed(1)})`);
      this.headOrbit.setAttribute('stroke', secondaryGlow);

      this.eyeDot.setAttribute('cx', (pts.head.x + 13).toFixed(1));
      this.eyeDot.setAttribute('cy', (pts.head.y + s * 5).toFixed(1));
      this.eyeDot.setAttribute('fill', primaryColor);

      this.gazeLine.setAttribute('x1', (pts.head.x + 15).toFixed(1));
      this.gazeLine.setAttribute('y1', (pts.head.y + s * 5).toFixed(1));
      this.gazeLine.setAttribute('x2', '334');
      this.gazeLine.setAttribute('y2', (72 + s * 16).toFixed(1));
      this.gazeLine.setAttribute('stroke', secondaryGlow);

      // Joint Nodes
      Object.keys(this.jointNodes).forEach((k) => {
        const node = this.jointNodes[k];
        node.setAttribute('cx', pts[k].x.toFixed(1));
        node.setAttribute('cy', pts[k].y.toFixed(1));
        if (k === 'c4') {
          node.setAttribute('fill', primaryColor);
          node.setAttribute('stroke', d >= 20 ? '#FFE600' : '#FFFFFF');
        } else {
          node.setAttribute('stroke', primaryColor);
        }
      });

      // Trunk/Cervical Tilt Arc from Pelvis/T1 Plumb
      const arcR = 34;
      const vx = pts.head.x - pts.pelvis.x;
      const vy = pts.head.y - pts.pelvis.y;
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

      // Sensor Cone & Dot
      this.deviceSensorDot.setAttribute('fill', primaryColor);
      this.fovBeam.setAttribute('fill', d >= 20 ? 'rgba(255, 42, 109, 0.06)' : 'rgba(0, 240, 255, 0.04)');

      // Bounding Frame
      const bx1 = lerp(POSE_0_DEG.bbox.xmin, POSE_45_DEG.bbox.xmin, s);
      const by1 = lerp(POSE_0_DEG.bbox.ymin, POSE_45_DEG.bbox.ymin, s);
      const bx2 = lerp(POSE_0_DEG.bbox.xmax, POSE_45_DEG.bbox.xmax, s);
      const by2 = lerp(POSE_0_DEG.bbox.ymax, POSE_45_DEG.bbox.ymax, s);
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
      this.bboxCorners.setAttribute('stroke', d <= 10 && !isIdle ? '#00F0FF' : primaryColor);

      // Ripple Rings when in Slouch Range (20°–45°+)
      const slouchPower = d >= 20 && !isIdle ? Math.min(1, (d - 18) / 22) : 0;
      for (let i = 0; i < this.ripples.length; i++) {
        const ring = this.ripples[i];
        if (slouchPower > 0.02) {
          const speedMult = d >= 32 ? 0.72 : 0.50;
          const phase = ((this.time * speedMult) + i / 3) % 1;
          const radius = 8 + phase * (46 + slouchPower * 20);
          const alpha = (1 - phase) * 0.82 * slouchPower;
          ring.setAttribute('cx', pts.c4.x.toFixed(1));
          ring.setAttribute('cy', pts.c4.y.toFixed(1));
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
  // 6. Animated 740 Hz Acoustic Biofeedback Waveform
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

      // Center baseline
      this.ctx.beginPath();
      this.ctx.moveTo(0, midY);
      this.ctx.lineTo(w, midY);
      this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      this.ctx.lineWidth = 1;
      this.ctx.stroke();

      // Secondary harmonic shimmer
      this.ctx.beginPath();
      for (let x = 0; x <= w; x += 2) {
        const norm = x / w;
        const env = Math.sin(norm * Math.PI);
        const y = midY + Math.sin(norm * 26 - this.phase * 1.35) * (midY - 5) * this.amp * 0.52 * env;
        if (x === 0) this.ctx.moveTo(x, y);
        else this.ctx.lineTo(x, y);
      }
      this.ctx.strokeStyle = isBad
        ? 'rgba(255, 230, 0, 0.62)'
        : isWarn
          ? 'rgba(255, 0, 127, 0.42)'
          : 'rgba(255, 0, 127, 0.30)';
      this.ctx.lineWidth = 1.4;
      this.ctx.stroke();

      // Primary 740 Hz Carrier Wave
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
    initCursorParticleBackground,
    initGlassHoverSpotlights,
    evaluatePostureDegrees,
    animateCounter,
    PostureSkeletonModel,
    FrequencyWaveform740,
    setGlobalAlertMood() {}
  };

  window.addEventListener('DOMContentLoaded', () => {
    initCursorParticleBackground();
    initGlassHoverSpotlights();
  });
})();
