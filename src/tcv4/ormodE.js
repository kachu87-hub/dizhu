/* v6.3i 護岸原圖移植：混凝土格籠(框)護岸、展開式蜂巢圍束網格緩坡護岸（gen_revE.py 自動產生，勿手改） */
var TCO_T = window.TCO_T || (window.TCO_T = {});
TCO_T['crib'] = (function () {

  let RR = null, O = [];
  const EL = {}, CTX = new Proxy({}, { get: (t, k) => (k in t ? t[k] : () => ({ width: 0 })), set: (t, k, v) => { t[k] = v; return true; } });
  const el = id => EL[id] || (EL[id] = { value: '', textContent: '', innerHTML: '', className: '', style: {}, classList: { add() {}, remove() {}, toggle() {} }, addEventListener() {}, getContext: () => CTX, parentElement: { getBoundingClientRect: () => ({ width: 100, height: 100 }) } });
  const document = { getElementById: el, querySelectorAll: () => [], querySelector: () => null, createElement: () => ({ click() {}, style: {} }), body: { appendChild() {}, removeChild() {}, classList: { add() {}, remove() {}, toggle() {}, contains: () => false } }, documentElement: { classList: { contains: () => false, add() {}, remove() {}, toggle() {} } }, addEventListener() {} };
  const window = { addEventListener() {}, devicePixelRatio: 1, matchMedia: () => ({ matches: false, addEventListener() {} }) };


    // =========================================================================
    // 1. ORIGINAL DXF BASELINE CONSTANTS & GLOBAL STATE (PURE ASCII IDENTIFIERS)
    // =========================================================================
    const ORIG_CRIB_WALL = {
      N_tiers: 8,
      H_cm: 275,
      df_cm: 150,
      m_tilt: 6.0,
      B_cm: 250,
      B1_cm: 200,
      h1_cm: 60,
      h2_cm: 40,
      h3_cm: 90,
      b1_cm: 200,
      b2_cm: 178,
      b3_cm: 200,
      h_hdr: 25,
      h_str: 20,
      N_bay: 3,
      L_tot_m: 20.0
    };

    let currentView = 'ALL'; // 'ALL', 'SECTION_PLAN_ELEV', 'HEADER_STRETCHER', 'SPEC'
    let showGhost = false;
    let isDarkTheme = true;

    let viewCam = {
      scale: 0.64,
      offsetX: 24,
      offsetY: 14,
      isDragging: false,
      dragStartX: 0,
      dragStartY: 0
    };

    let dxfEntities = [];

    // =========================================================================
    // 2. PARAMETER READER & EXPLICIT FIGURE-NUMBER FORMULA ENGINE
    // =========================================================================
    function getParams() {
      const num = (id, def) => {
        const el = document.getElementById(id);
        if (!el) return def;
        const v = parseFloat(el.value);
        return isNaN(v) ? def : v;
      };

      const p = {
        N_tiers: Math.max(3, Math.min(12, Math.round(num('inp_N_tiers', 8)))),
        H_cm: Math.max(100, Math.min(400, num('inp_H_cm', 275))),
        df_cm: Math.max(100, num('inp_df_cm', 150)),
        m_tilt: Math.max(3.0, num('inp_m_tilt', 6.0)),
        B_cm: Math.max(150, num('inp_B_cm', 250)),
        B1_cm: Math.max(100, num('inp_B1_cm', 200)),
        h1_cm: Math.max(30, num('inp_h1_cm', 60)),
        h2_cm: Math.max(20, num('inp_h2_cm', 40)),
        h3_cm: Math.max(50, num('inp_h3_cm', 90)),
        b1_cm: Math.max(120, num('inp_b1_cm', 200)),
        b2_cm: Math.max(98, num('inp_b2_cm', 178)),
        b3_cm: Math.max(120, num('inp_b3_cm', 200)),
        h_hdr: Math.max(20, num('inp_h_hdr', 25)),
        h_str: Math.max(15, num('inp_h_str', 20)),
        N_bay: Math.max(2, Math.min(6, Math.round(num('inp_N_bay', 3)))),
        L_tot_m: Math.max(2.0, num('inp_L_tot_m', 20.0))
      };

      // Derived Crib Geometry:
      // Each tier consists of 1 Header course (height h_hdr = 25cm) + 1 Stretcher gap (height ~10cm effective step, total pitch ~33.5cm for 8 tiers = 275cm)
      p.N_str_courses = p.N_tiers - 1; // 7 courses of front & back stretchers (plus 2 bottom base blocks = 16 stretcher-equivalents in cross-section)
      p.tiltAngleRad = Math.atan(1 / p.m_tilt); // atan(1/6) = 9.46 deg (DXF uses ~9 deg)
      p.tiltAngleDeg = +(p.tiltAngleRad * 180 / Math.PI).toFixed(1);

      const b1_m = +(p.b1_cm / 100).toFixed(2);
      const b2_m = +(p.b2_cm / 100).toFixed(2);
      const b3_m = +(p.b3_cm / 100).toFixed(2);
      const h_hdr_m = +(p.h_hdr / 100).toFixed(2);
      const h_str_m = +(p.h_str / 100).toFixed(2);
      const B_m = +(p.B_cm / 100).toFixed(2);
      const B1_m = +(p.B1_cm / 100).toFixed(2);
      const h1_m = +(p.h1_cm / 100).toFixed(2);
      const h2_m = +(p.h2_cm / 100).toFixed(2);
      const h3_m = +(p.h3_cm / 100).toFixed(2);
      const H_m = +(p.H_cm / 100).toFixed(2);

      // 1. 預鑄丁條 (Header: b1=200cm, 25×25cm, 內縮13cm段長b2=178cm):
      // Spaced every b3_m (2.00m) along the wall -> (1 / b3_m) stacks per meter, each stack has N_tiers headers
      p.q_hdr_cnt = +(p.N_tiers / b3_m).toFixed(2);
      p.formula_hdr_cnt = `${p.N_tiers}層丁條 / 順條間距(b3=${b3_m.toFixed(2)}m) = ${p.q_hdr_cnt.toFixed(2)} 支/m`;

      // Single Header concrete volume: 2 ends (0.11m * 0.25m * 0.25m) + middle (b2_m * 0.25m * 0.13m)
      p.vol_one_hdr = +(2 * 0.11 * h_hdr_m * h_hdr_m + b2_m * h_hdr_m * (h_hdr_m * 0.52)).toFixed(4);
      p.q_hdr_rc = +(p.q_hdr_cnt * p.vol_one_hdr).toFixed(2);
      p.formula_hdr_rc = `${p.q_hdr_cnt.toFixed(2)}支/m * [2端*(0.11*${h_hdr_m}*${h_hdr_m}) + 中段(${b2_m}*${h_hdr_m}*0.13) = ${p.vol_one_hdr.toFixed(3)}M³/支]`;

      // 2. 預鑄順條 (Stretcher: b3=200cm, 20×20cm):
      // Each tier gap has 2 stretchers (front + back) -> 2 * N_str_courses per bay + 2 bottom bearing stretchers = (2*N_tiers - 2) stretchers per b3_m bay
      const totalStrPerBay = 2 * p.N_tiers - 2;
      p.q_str_cnt = +(totalStrPerBay / b3_m).toFixed(2);
      p.formula_str_cnt = `[前後2排 * (${p.N_tiers}-1)層 = ${totalStrPerBay}支/格] / (b3=${b3_m.toFixed(2)}m) = ${p.q_str_cnt.toFixed(2)} 支/m`;

      p.vol_one_str = +(b3_m * h_str_m * h_str_m).toFixed(4);
      p.q_str_rc = +(p.q_str_cnt * p.vol_one_str).toFixed(2);
      p.formula_str_rc = `${p.q_str_cnt.toFixed(2)}支/m * (長b3=${b3_m.toFixed(2)}m * ${h_str_m}m * ${h_str_m}m = ${p.vol_one_str.toFixed(3)}M³/支)`;

      // 3. 210kgf/cm² 場鑄混凝土基礎台 (含止滑榫 h2 與後踵 lug h3):
      // Main slab: B_m * h1_m; Shear key (止滑榫): avg width 0.25m * h2_m; Heel lug (後踵凸台): 0.25m * (h3_m - h1_m)
      const keyArea = +(0.25 * h2_m).toFixed(3);
      const lugArea = +(0.25 * Math.max(0, h3_m - h1_m)).toFixed(3);
      p.q_base_rc = +((B_m * h1_m + keyArea + lugArea) * 1.0).toFixed(2);
      p.formula_base_rc = `[基礎版(B=${B_m.toFixed(2)}m * h1=${h1_m.toFixed(2)}m) + 止滑榫(0.25 * h2=${h2_m.toFixed(2)}m) + 後踵突台(0.25 * ${(h3_m - h1_m).toFixed(2)}m)] * 1.00m`;

      // 4. 格籠內填卵塊石 & 坡頂客土植生區:
      // Crib inner width = b2_m (1.78m), height = H_m (2.75m), minus precast member volume
      const grossCribVol = +(b1_m * H_m * 1.0).toFixed(2);
      p.q_cobble_vol = Math.max(0.5, +(grossCribVol - p.q_hdr_rc - p.q_str_rc).toFixed(2));
      p.formula_cobble_vol = `[格籠外廓(b1=${b1_m.toFixed(2)}m * H=${H_m.toFixed(2)}m) = ${grossCribVol.toFixed(2)}M³] - 丁條${p.q_hdr_rc.toFixed(2)}M³ - 順條${p.q_str_rc.toFixed(2)}M³`;

      // 5. 預鑄丁條/順條 #3 鋼筋與箍筋 + 基礎台鋼筋 (kg/m):
      // Header: 4 main bars + 9 stirrups (#3, 0.559 kg/m) ≈ 8.2 kg/支
      // Stretcher: 4 main bars + 11 stirrups (#3, 0.559 kg/m) ≈ 7.8 kg/支
      // Base foundation: 17 longitudinal dots + L-bars ≈ 27.2 kg/m
      p.q_rebar_precast = +(p.q_hdr_cnt * 8.20 + p.q_str_cnt * 7.80).toFixed(1);
      p.q_rebar_base = +(B_m * 10.88).toFixed(1);
      p.q_rebar_tot = +(p.q_rebar_precast + p.q_rebar_base).toFixed(1);
      p.formula_rebar = `丁條(${p.q_hdr_cnt.toFixed(1)}支*8.2kg) + 順條(${p.q_str_cnt.toFixed(1)}支*7.8kg) + 基礎台鋼筋(${p.q_rebar_base.toFixed(1)}kg)`;

      return p;
    }

    // =========================================================================
    // 3. CAD PRIMITIVES & DXF RECORDING ENGINE
    // =========================================================================
    function getPalette() {
      if (isDarkTheme) {
        return {
          bg: '#0b1120',
          primaryLine: '#f8fafc',
          secondaryLine: '#94a3b8',
          memberLine: '#facc15',
          memberFill: 'rgba(250, 204, 21, 0.14)',
          rebarLine: '#e879f9',
          rebarDot: '#f43f5e',
          baseLine: '#e2e8f0',
          baseFill: 'rgba(56, 189, 248, 0.14)',
          stoneLine: '#fb923c',
          stoneFill: 'rgba(249, 115, 22, 0.22)',
          sandHatch: '#c084fc',
          plantLine: '#4ade80',
          waterLine: '#38bdf8',
          dimLine: '#22d3ee',
          dimText: '#67e8f9',
          leaderLine: '#38bdf8',
          textMain: '#f8fafc',
          textSub: '#cbd5e1',
          titleCyan: '#22d3ee',
          ghostLine: 'rgba(244, 63, 94, 0.40)',
          tableBorder: '#64748b',
          tableHeaderBg: 'rgba(30, 41, 59, 0.90)'
        };
      } else {
        return {
          bg: '#ffffff',
          primaryLine: '#0f172a',
          secondaryLine: '#475569',
          memberLine: '#854d0e',
          memberFill: 'rgba(250, 204, 21, 0.22)',
          rebarLine: '#a21caf',
          rebarDot: '#e11d48',
          baseLine: '#0f172a',
          baseFill: 'rgba(2, 132, 199, 0.15)',
          stoneLine: '#c2410c',
          stoneFill: 'rgba(253, 186, 116, 0.35)',
          sandHatch: '#7e22ce',
          plantLine: '#15803d',
          waterLine: '#0284c7',
          dimLine: '#0284c7',
          dimText: '#0f172a',
          leaderLine: '#0369a1',
          textMain: '#0f172a',
          textSub: '#334155',
          titleCyan: '#0369a1',
          ghostLine: 'rgba(225, 29, 72, 0.40)',
          tableBorder: '#1e293b',
          tableHeaderBg: 'rgba(241, 245, 249, 0.95)'
        };
      }
    }

    function cadLine(ctx, x1, y1, x2, y2, color, width = 1.35, dash = [], layer = '0') {
      ctx.save();
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.setLineDash(dash);
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      ctx.restore();
      dxfEntities.push({ type: 'LINE', x1, y1: -y1, x2, y2: -y2, layer });
    }

    function cadPoly(ctx, pts, color, width = 1.45, close = true, fill = null, dash = [], layer = '0') {
      if (!pts || pts.length < 2) return;
      ctx.save();
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.setLineDash(dash);
      ctx.beginPath();
      ctx.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < pts.length; i++) {
        ctx.lineTo(pts[i][0], pts[i][1]);
      }
      if (close) ctx.closePath();
      if (fill) {
        ctx.fillStyle = fill;
        ctx.fill();
      }
      ctx.stroke();
      ctx.restore();

      for (let i = 0; i < pts.length - 1; i++) {
        dxfEntities.push({
          type: 'LINE',
          x1: pts[i][0], y1: -pts[i][1],
          x2: pts[i + 1][0], y2: -pts[i + 1][1],
          layer
        });
      }
      if (close) {
        const last = pts[pts.length - 1];
        dxfEntities.push({
          type: 'LINE',
          x1: last[0], y1: -last[1],
          x2: pts[0][0], y2: -pts[0][1],
          layer
        });
      }
    }

    function cadCircle(ctx, cx, cy, r, color, width = 1.3, fill = null, dash = [], layer = '0') {
      ctx.save();
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.setLineDash(dash);
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      if (fill) {
        ctx.fillStyle = fill;
        ctx.fill();
      }
      ctx.stroke();
      ctx.restore();
      dxfEntities.push({ type: 'CIRCLE', cx, cy: -cy, r, layer });
    }

    function cadText(ctx, str, x, y, size = 12, color = '#f8fafc', align = 'left', weight = 'normal', angleDeg = 0, layer = 'TEXT') {
      ctx.save();
      ctx.translate(x, y);
      if (angleDeg !== 0) ctx.rotate((angleDeg * Math.PI) / 180);
      ctx.font = `${weight} ${size}px "Inter", "Microsoft JhengHei", serif`;
      ctx.fillStyle = color;
      ctx.textAlign = align;
      ctx.textBaseline = 'middle';
      ctx.fillText(str, 0, 0);
      ctx.restore();
      dxfEntities.push({ type: 'TEXT', str: String(str), x, y: -y, size: size * 0.75, layer });
    }

    function cadLeaderDot(ctx, tx, ty, kx, ky, ex, ey, lines, pal, useDot = true, fontSize = 11.2) {
      cadLine(ctx, tx, ty, kx, ky, pal.leaderLine, 1.15, [], 'LEADER');
      cadLine(ctx, kx, ky, ex, ey, pal.leaderLine, 1.15, [], 'LEADER');

      if (useDot) {
        cadCircle(ctx, tx, ty, 2.2, pal.leaderLine, 1.0, pal.leaderLine, [], 'LEADER_DOT');
      } else {
        const dx = tx - kx, dy = ty - ky;
        const L = Math.hypot(dx, dy) || 1;
        const ux = dx / L, uy = dy / L;
        const nx = -uy, ny = ux;
        ctx.save();
        ctx.fillStyle = pal.leaderLine;
        ctx.beginPath();
        ctx.moveTo(tx, ty);
        ctx.lineTo(tx - ux * 7 + nx * 2.3, ty - uy * 7 + ny * 2.3);
        ctx.lineTo(tx - ux * 7 - nx * 2.3, ty - uy * 7 - ny * 2.3);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }

      const align = ex >= kx ? 'left' : 'right';
      const pad = ex >= kx ? 5 : -5;
      const arr = Array.isArray(lines) ? lines : [lines];
      arr.forEach((ln, idx) => {
        const yOff = (idx - (arr.length - 1) / 2) * (fontSize + 4);
        cadText(ctx, ln, ex + pad, ey + yOff, fontSize, pal.titleCyan, align, '600', 0, 'TEXT');
      });
    }

    function cadDim(ctx, x1, y1, x2, y2, offset, labelStr, pal, fontSize = 11.2) {
      const dx = x2 - x1, dy = y2 - y1;
      const L = Math.hypot(dx, dy);
      if (L < 1e-3) return;
      const ux = dx / L, uy = dy / L;
      const sign = offset >= 0 ? 1 : -1;
      const nx = -uy * sign, ny = ux * sign;
      const absOff = Math.abs(offset);
      const gap = 4.5;
      const extOver = 5;

      const sx1 = x1 + nx * gap, sy1 = y1 + ny * gap;
      const ex1 = x1 + nx * (absOff + extOver), ey1 = y1 + ny * (absOff + extOver);
      const sx2 = x2 + nx * gap, sy2 = y2 + ny * gap;
      const ex2 = x2 + nx * (absOff + extOver), ey2 = y2 + ny * (absOff + extOver);

      const dx1 = x1 + nx * absOff, dy1 = y1 + ny * absOff;
      const dx2 = x2 + nx * absOff, dy2 = y2 + ny * absOff;

      if (absOff > 3) {
        cadLine(ctx, sx1, sy1, ex1, ey1, pal.dimLine, 0.95, [], 'DIM');
        cadLine(ctx, sx2, sy2, ex2, ey2, pal.dimLine, 0.95, [], 'DIM');
      }

      const mx = (dx1 + dx2) / 2, my = (dy1 + dy2) / 2;
      const textGap = Math.max(String(labelStr).length * fontSize * 0.62 + 8, 20);

      if (L > textGap + 12) {
        cadLine(ctx, dx1, dy1, mx - ux * (textGap / 2), my - uy * (textGap / 2), pal.dimLine, 1.05, [], 'DIM');
        cadLine(ctx, mx + ux * (textGap / 2), my + uy * (textGap / 2), dx2, dy2, pal.dimLine, 1.05, [], 'DIM');
      } else {
        cadLine(ctx, dx1, dy1, dx2, dy2, pal.dimLine, 1.05, [], 'DIM');
      }

      const aL = Math.min(5.8, L * 0.25), aW = 1.85;
      ctx.save();
      ctx.fillStyle = pal.dimLine;
      ctx.beginPath();
      ctx.moveTo(dx1, dy1);
      ctx.lineTo(dx1 + ux * aL + nx * aW, dy1 + uy * aL + ny * aW);
      ctx.lineTo(dx1 + ux * aL - nx * aW, dy1 + uy * aL - ny * aW);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(dx2, dy2);
      ctx.lineTo(dx2 - ux * aL + nx * aW, dy2 - uy * aL + ny * aW);
      ctx.lineTo(dx2 - ux * aL - nx * aW, dy2 - uy * aL - ny * aW);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      let angle = (Math.atan2(dy, dx) * 180) / Math.PI;
      if (angle > 90) angle -= 180;
      if (angle < -90) angle += 180;
      cadText(ctx, labelStr, mx, my - 2, fontSize, pal.dimText, 'center', '600', angle, 'DIM_TEXT');
    }

    function drawCobbleStone(ctx, cx, cy, rx, ry, seed, pal, layer = 'COBBLE') {
      const nV = 7;
      const pts = [];
      for (let i = 0; i < nV; i++) {
        const a = (i / nV) * Math.PI * 2;
        const jit = 0.85 + 0.18 * Math.sin(seed * 3.1 + i * 2.3);
        pts.push([cx + Math.cos(a) * rx * jit, cy + Math.sin(a) * ry * jit]);
      }
      cadPoly(ctx, pts, pal.stoneLine, 1.05, true, pal.stoneFill, [], layer);
    }

    function drawPlantSymbol(ctx, x, y, scale, pal) {
      const s = scale;
      cadPoly(ctx, [[x, y], [x - 5 * s, y - 9 * s], [x - 2 * s, y - 4 * s]], pal.plantLine, 1.05, false, null, [], 'PLANT');
      cadPoly(ctx, [[x, y], [x - 1 * s, y - 13 * s], [x + 1.5 * s, y - 5 * s]], pal.plantLine, 1.05, false, null, [], 'PLANT');
      cadPoly(ctx, [[x, y], [x + 5 * s, y - 10 * s], [x + 2 * s, y - 3 * s]], pal.plantLine, 1.05, false, null, [], 'PLANT');
    }

    // =========================================================================
    // 4. VIEW 1: 斷面圖 (MAIN CROSS-SECTION VIEW OF CONCRETE CRIB WALL REVETMENT)
    //    100% Faithful to Original AutoCAD Screenshot (image_7cfc5e.png):
    //    - Whole Foundation + Crib Wall in orthogonal 1:6 tilted coordinate system (u, v):
    //      * u-axis: along foundation (tilted down-right at 1:6)
    //      * v-axis: along wall height (tilted up-right at 1:6, perpendicular to u-axis)
    //    - Concrete Foundation Base (B=250, B1=200, key 30+20, h1=60, h2=40, rear lug 25x30, h3=90)
    //      with concrete aggregate stipple & red hooked L-rebar + dots
    //    - 8 Notched Headers (丁條 b1=200, b2=178, I-shaped notch profile) interlocking with
    //      front & rear Stretchers (順條 20x20cm) + Top cap stretcher + Cobble fill
    //    - Left Creek Bed Ground Line (yellow + magenta ground hatch), Toe Riprap Boulders,
    //      Vertical dimensions H≦4.0m (不含基礎) and df≧1.5m
    // =========================================================================
    function drawMainCrossSectionView(ctx, ox, topY, p, pal) {
      const s = 0.88; // Scale: 1 cm = 0.88 px

      // 0. Compact Symbol Legend Box at Top-Left (Clear of the Cross-Section)
      const legX = ox + 2;
      const legY = topY + 6;
      cadPoly(ctx, [
        [legX, legY],
        [legX + 168, legY],
        [legX + 168, legY + 184],
        [legX, legY + 184]
      ], pal.tableBorder, 1.0, true, 'rgba(15, 23, 42, 0.88)', [], 'LEGEND_BOX');
      cadText(ctx, '符號說明：', legX + 8, legY + 14, 11, pal.titleCyan, 'left', '700');
      const legItems = [
        `H  單階岸高 (${p.H_cm}cm ≦4.0m)`,
        `h1 混凝土基礎台高 (${p.h1_cm}cm)`,
        `h2 止滑榫高度 (${p.h2_cm}cm)`,
        `h3 後踵高度 (${p.h3_cm}cm)`,
        `B  基礎台總寬 (${p.B_cm}cm)`,
        `B1 後踵寬度 (${p.B1_cm}cm)`,
        `b1 丁條長度 (${p.b1_cm}cm)`,
        `b2 丁條內縮長 (${p.b2_cm}cm)`,
        `b3 順條長度 (${p.b3_cm}cm)`,
        `df 埋入深度 (${p.df_cm}cm ≧1.5m)`
      ];
      legItems.forEach((txt, idx) => {
        cadText(ctx, txt, legX + 10, legY + 31 + idx * 16.0, 9.6, pal.textMain, 'left', '500');
      });

      // 1. Orthogonal 1:m Tilted Coordinate System (u, v) in cm:
      //    Origin (u=0, v=0) = Top-Left Front Toe Corner of Concrete Foundation Base!
      //    +u = down-right along foundation (slope 1:m)
      //    +v = up-right along crib wall (batter 1:m)
      const theta = Math.atan(1 / p.m_tilt); // atan(1/6) = 9.462 deg
      const cosT = Math.cos(theta);
      const sinT = Math.sin(theta);
      const angU_deg = (theta * 180) / Math.PI;

      const B = p.B_cm;                 // 250 cm
      const h1 = p.h1_cm;               // 60 cm
      const h2 = p.h2_cm;               // 40 cm
      const h3 = p.h3_cm;               // 90 cm
      const hLug = Math.max(20, h3 - h1); // 30 cm rear lug height
      const wLug = p.wLug, wFront = p.wFront, wKeyBot = p.wKeyBot, wKeySlope = p.wKeySlope;
      const B1 = Math.max(100, B - wKeyBot - wKeySlope); // 200 cm rear heel width

      // Place (u=0, v=0) so the entire tilted wall & left dimensions have generous clearance
      const wallPitch_cm = (p.H_cm - p.hBot) / p.N_tiers; // ~31.875 cm per tier (8 tiers + bottom 20cm = 275cm)
      const totalV_cm = p.hBot + p.N_tiers * wallPitch_cm; // 275 cm
      const originX = ox + 265;
      const originY = topY + Math.max(285, totalV_cm * s * cosT + 95);

      const pt = (u, v) => [
        originX + (u * cosT + v * sinT) * s,
        originY + (u * sinT - v * cosT) * s
      ];

      // 0b. Optional Ghost Baseline (Original 8-tier Foundation & Wall Envelope)
      if (showGhost) {
        const gPts = [
          pt(0, 0),
          pt(250 - 25, 0),
          pt(250 - 25, 30),
          pt(250, 30),
          pt(250, -60),
          pt(50, -60),
          pt(30, -100),
          pt(0, -100)
        ];
        cadPoly(ctx, gPts, pal.ghostLine, 1.1, true, null, [4, 4], 'GHOST_BASE');
      }

      // =====================================================================
      // 2. CONCRETE FOUNDATION BASE (210kgf/cm² 混凝土基礎, 100% Matching image_7cfc5e.png)
      // =====================================================================
      const uLugL = B - wLug; // 225 cm
      const basePolyPts = [
        pt(0, 0),                 // Top-left front toe corner
        pt(uLugL, 0),             // Top surface before rear lug
        pt(uLugL, hLug),          // Rear lug inner vertical face (up 30cm)
        pt(B, hLug),              // Rear lug top-right corner (width 25cm)
        pt(B, -h1),               // Rear heel bottom-right corner (total height h3 = 30+60 = 90cm)
        pt(wKeyBot + wKeySlope, -h1), // Bottom of main slab before shear key (B1 = 200cm)
        pt(wKeyBot, -(h1 + h2)),  // Shear key bottom-right corner (20cm transition)
        pt(0, -(h1 + h2))         // Shear key bottom-left corner (h1+h2 = 60+40 = 100cm)
      ];
      cadPoly(ctx, basePolyPts, pal.baseLine, 1.65, true, pal.baseFill, [], 'FOUNDATION_BASE');

      // Concrete Aggregate Stipple (AR-CONC triangles & dots inside foundation base)
      for (let u = 12; u < B - 10; u += 22) {
        const vMin = (u < wKeyBot + 8) ? -(h1 + h2 - 12) : -(h1 - 12);
        const vMax = (u > uLugL + 4) ? (hLug - 8) : -8;
        for (let v = vMin; v <= vMax; v += 18) {
          const [cx, cy] = pt(u + ((v * 3) % 7), v);
          cadPoly(ctx, [[cx, cy], [cx + 3.5, cy - 2.5], [cx + 2, cy + 2.5]], pal.secondaryLine, 0.75, true, null, [], 'AR_CONC');
          cadCircle(ctx, cx + 6, cy - 1, 0.7, pal.secondaryLine, 0.7, pal.secondaryLine, [], 'AR_CONC_DOT');
        }
      }

      // Foundation Rebar (基礎鋼筋 - Red L-shaped main bar with hooks into shear key & rear lug + red dots)
      const cov = 7.5;
      const rebarMainPts = [
        pt(cov + 12, -(h1 + h2 - cov)), // Bottom hook inside shear key
        pt(cov, -(h1 + h2 - cov)),
        pt(cov, -(h1 - cov - 6)),       // Step up out of shear key
        pt(B - cov, -(h1 - cov - 6)),   // Main slab bottom bar along B1
        pt(B - cov, hLug - cov),        // Bend up into 25x30 rear lug
        pt(B - cov - 10, hLug - cov)    // Top hook inside rear lug
      ];
      cadPoly(ctx, rebarMainPts, '#ef4444', 1.55, false, null, [], 'BASE_REBAR');

      // Red longitudinal rebar dots along the main bar, shear key, and rear lug
      for (let u = cov + 4; u <= B - cov - 4; u += 16) {
        const [dx, dy] = pt(u, -(h1 - cov - 6) + 3.8);
        cadCircle(ctx, dx, dy, 1.85, '#ef4444', 1.0, '#ef4444', [], 'BASE_REBAR_DOT');
      }
      [-(h1 + h2 * 0.45), -(h1 + h2 - cov - 4)].forEach(vv => {
        const [dx, dy] = pt(cov + 3.8, vv);
        cadCircle(ctx, dx, dy, 1.85, '#ef4444', 1.0, '#ef4444', [], 'BASE_REBAR_DOT');
      });
      [-h1 * 0.4, 2, hLug - cov - 4].forEach(vv => {
        const [dx, dy] = pt(B - cov - 3.8, vv);
        cadCircle(ctx, dx, dy, 1.85, '#ef4444', 1.0, '#ef4444', [], 'BASE_REBAR_DOT');
      });

      // =====================================================================
      // 3. STACKED CRIB WALL: NOTCHED HEADERS (丁條) & STRETCHERS (順條) + COBBLE FILL
      //    Exact match to image_7cfc5e.png:
      //    - Crib spans from u = wFront (36cm) to u = 36 + b1_cm - 11 = 225cm (flush against the 25cm rear lug!)
      //    - Each tier has:
      //      1) Front & Rear Stretcher blocks (順條 20x20cm)
      //      2) Cobble stones packed in the open gap between stretchers
      //      3) I-shaped Notched Header beam (丁條 b1=200, b2=178, ends 25cm high, middle 13cm high)
      //    - Plus 1 Top Cap Stretcher on the front-left of the top tier + Top Soil & Plants on the right!
      // =====================================================================
      const b1 = p.b1_cm;         // 200 cm
      const b2 = p.b2_cm;         // 178 cm
      const nib = (b1 - b2) / 2;  // 11 cm lug at each end (10cm flat + 1cm bevel)
      const hHdr = p.h_hdr;       // 25 cm
      const hNotch = p.hNotch;         // 6 cm notch depth top & bottom -> middle web = 13~14cm
      const wStr = p.h_str;       // 20 cm stretcher width
      const hStr = p.hStrD;            // 20 cm stretcher height

      // Place headers from uHdrL = 25cm to uHdrR = 25 + b1 (225cm), so the middle recessed web
      // starts at u = 25 + 11 = 36cm (matching the "36" dimension!) and ends at u = 225 - 11 = 214cm!
      const uHdrL = wFront - nib;        // 36 - 11 = 25 cm
      const uHdrR = uHdrL + b1;          // 225 cm (flush against rear lug at u = 225!)
      const uWebL = uHdrL + nib;         // 36 cm (front face of stretcher!)
      const uWebR = uHdrR - nib;         // 214 cm (rear face of stretcher!)

      let headerCalloutPt = pt(uHdrR, 150);
      let stretcherCalloutPt = pt(uWebR - wStr * 0.4, 130);

      for (let t = 0; t < p.N_tiers; t++) {
        const vStrBot = t * wallPitch_cm;
        const vStrTop = vStrBot + hStr;

        // (a) Cobble Stones inside the chamber of Course t (between front stretcher uWebL+wStr and rear stretcher uWebR-wStr)
        const uCobL = uWebL + wStr + 2;
        const uCobR = uWebR - wStr - 2;
        const nCob = 8;
        const cobStepU = (uCobR - uCobL) / nCob;
        for (let r = 0; r < 2; r++) {
          for (let c = 0; c < nCob; c++) {
            const cu = uCobL + (c + 0.5 + (r % 2) * 0.15) * cobStepU;
            const cv = vStrBot + (r + 0.5) * (hStr * 0.52);
            const [scx, scy] = pt(cu, cv);
            drawCobbleStone(ctx, scx, scy, cobStepU * 0.46 * s, hStr * 0.25 * s, t * 19 + r * 7 + c, pal, 'CRIB_COBBLE');
          }
        }

        // (b) Front Stretcher (順條 20x20cm at u = [uWebL, uWebL + wStr])
        cadPoly(ctx, [
          pt(uWebL, vStrBot),
          pt(uWebL + wStr, vStrBot),
          pt(uWebL + wStr, vStrTop),
          pt(uWebL, vStrTop)
        ], pal.primaryLine, 1.35, true, 'rgba(15, 23, 42, 0.90)', [], 'SEC_STRETCHER_FRONT');

        // (c) Rear Stretcher (順條 20x20cm at u = [uWebR - wStr, uWebR])
        cadPoly(ctx, [
          pt(uWebR - wStr, vStrBot),
          pt(uWebR, vStrBot),
          pt(uWebR, vStrTop),
          pt(uWebR - wStr, vStrTop)
        ], pal.primaryLine, 1.35, true, 'rgba(15, 23, 42, 0.90)', [], 'SEC_STRETCHER_REAR');

        if (t === p.N_tiers - 2) {
          stretcherCalloutPt = pt(uWebR - wStr * 0.45, (vStrBot + vStrTop) / 2);
        }

        // (d) I-Shaped Notched Header Beam (丁條, sitting on top of the stretchers, with 25cm end lugs interlocking around stretchers)
        const vWebBot = vStrTop;
        const vWebTop = vWebBot + (wallPitch_cm - hStr); // ~13cm middle web height
        const vLugBot = vWebBot - hNotch;
        const vLugTop = vWebTop + hNotch;

        const hdrPts = [
          pt(uHdrL, vLugBot),
          pt(uWebL, vLugBot),
          pt(uWebL, vWebBot),
          pt(uWebR, vWebBot),
          pt(uWebR, vLugBot),
          pt(uHdrR, vLugBot),
          pt(uHdrR, vLugTop),
          pt(uWebR, vLugTop),
          pt(uWebR, vWebTop),
          pt(uWebL, vWebTop),
          pt(uWebL, vLugTop),
          pt(uHdrL, vLugTop)
        ];
        cadPoly(ctx, hdrPts, pal.primaryLine, 1.4, true, 'rgba(30, 41, 59, 0.92)', [], 'SEC_HEADER_NOTCHED');

        if (t === p.N_tiers - 1) {
          headerCalloutPt = pt(uHdrR, (vLugBot + vLugTop) / 2);
        }
      }

      // (e) Top Cap Stretcher on Front-Left of Top Header (matching top-left block in image_7cfc5e.png)
      const vTopWeb = p.N_tiers * wallPitch_cm;
      const vCapTop = vTopWeb + hStr;
      cadPoly(ctx, [
        pt(uWebL, vTopWeb),
        pt(uWebL + wStr, vTopWeb),
        pt(uWebL + wStr, vCapTop),
        pt(uWebL, vCapTop)
      ], pal.primaryLine, 1.4, true, 'rgba(15, 23, 42, 0.92)', [], 'TOP_CAP_STRETCHER');

      // =====================================================================
      // 4. TOP CREST HORIZONTAL VEGETATION ZONE & PLANTS (100% Matching image_7cfc5e.png)
      //    Horizontal yellow ground line starting from the top-right corner of the Top Cap Stretcher!
      // =====================================================================
      const [capTopRightX, capTopRightY] = pt(uWebL + wStr, vCapTop);
      const [topHdrRightX, topHdrRightY] = pt(uHdrR + p.wCrest, vTopWeb);
      const crestEndX = topHdrRightX;

      // Purple/Magenta stippled topsoil zone between horizontal crest line (y = capTopRightY) and tilted top header
      const [hdrTopLeftX, hdrTopLeftY] = pt(uWebL + wStr, vTopWeb);
      const [hdrTopEndX, hdrTopEndY] = pt(uHdrR, vTopWeb + hNotch);
      cadPoly(ctx, [
        [capTopRightX, capTopRightY],
        [crestEndX, capTopRightY],
        [crestEndX, hdrTopEndY + 4],
        [hdrTopEndX, hdrTopEndY],
        [hdrTopLeftX, hdrTopLeftY]
      ], pal.secondaryLine, 1.0, false, 'rgba(192, 38, 211, 0.10)', [], 'TOP_SOIL_ZONE');

      // Magenta stipple dots (AR-SAND) inside top vegetation soil zone
      for (let sx = capTopRightX + 6; sx < crestEndX - 4; sx += 9) {
        const frac = (sx - capTopRightX) / Math.max(1, crestEndX - capTopRightX);
        const yBotLim = hdrTopLeftY + frac * (hdrTopEndY - hdrTopLeftY);
        for (let sy = capTopRightY + 4; sy < yBotLim - 2; sy += 7.5) {
          cadCircle(ctx, sx + ((sy * 3) % 4), sy, 0.85, '#d946ef', 0.8, '#d946ef', [], 'TOP_SOIL_DOT');
        }
      }

      // Horizontal Yellow Crest Line & Row of Plants along top crest
      cadLine(ctx, capTopRightX, capTopRightY, crestEndX, capTopRightY, '#facc15', 1.6, [], 'TOP_CREST_LINE');
      for (let px = capTopRightX + 12; px < crestEndX - 8; px += 19) {
        drawPlantSymbol(ctx, px, capTopRightY, 0.92, pal);
      }

      // =====================================================================
      // 5. STREAMBED GROUND LINE, TOE RIPRAP BOULDERS & SLOPE TRIANGLES (1:6)
      // =====================================================================
      const [baseBotLeftX, baseBotLeftY] = pt(0, -(h1 + h2));
      const [baseTopLeftX, baseTopLeftY] = pt(0, 0);
      const yStreambed = baseBotLeftY - p.df_cm * s * p.kdf; // Streambed level (df >= 1.5m above foundation bottom)
      const xStreambedLeft = baseBotLeftX - 185;
      const xRipSlopeTop = baseTopLeftX - 52;

      // Yellow horizontal streambed ground line + sloped excavation bank line down to foundation bottom-left
      cadLine(ctx, xStreambedLeft, yStreambed, xRipSlopeTop, yStreambed, '#facc15', 1.55, [], 'STREAMBED_LINE');
      cadLine(ctx, xRipSlopeTop, yStreambed, baseBotLeftX, baseBotLeftY, '#facc15', 1.35, [], 'EXCAV_SLOPE');

      // Magenta Ground Hatch Symbol below Streambed Line (matching original image_7cfc5e.png)
      const gx0 = xStreambedLeft + 48;
      for (let i = 0; i < 4; i++) {
        cadLine(ctx, gx0 + i * 5, yStreambed, gx0 + i * 5 - 8, yStreambed + 9, '#d946ef', 1.15);
        cadLine(ctx, gx0 + 12 + i * 5, yStreambed + 9, gx0 + 16 + i * 5, yStreambed + 3, '#d946ef', 1.15);
      }

      // Toe Riprap Boulders packed in the wedge in front of foundation & lower 2 tiers of crib wall
      const [tier2LeftX, tier2LeftY] = pt(uHdrL, wallPitch_cm * 2.2);
      const nRipRows = 7;
      for (let r = 0; r < nRipRows; r++) {
        const fracY = (r + 0.5) / nRipRows;
        const ry = tier2LeftY + fracY * (baseBotLeftY - tier2LeftY - 6);
        // Right boundary of riprap follows crib wall above baseTopLeftY and foundation face below baseTopLeftY
        const xRightLim = (ry < baseTopLeftY)
          ? (baseTopLeftX + ((baseTopLeftY - ry) / (baseTopLeftY - tier2LeftY)) * (tier2LeftX - baseTopLeftX) - 6)
          : (baseTopLeftX - ((ry - baseTopLeftY) / (baseBotLeftY - baseTopLeftY)) * (baseTopLeftX - baseBotLeftX) - 6);
        // Left boundary of riprap slopes down from tier2LeftX - 45 to baseBotLeftX - 4
        const xLeftLim = (ry < yStreambed)
          ? (xRipSlopeTop + ((yStreambed - ry) / (yStreambed - tier2LeftY)) * 28)
          : (xRipSlopeTop + ((ry - yStreambed) / (baseBotLeftY - yStreambed)) * (baseBotLeftX - xRipSlopeTop));

        const spanW = xRightLim - xLeftLim;
        const nCols = Math.max(1, Math.round(spanW / 18));
        for (let c = 0; c < nCols; c++) {
          const rx = xLeftLim + (c + 0.5) * (spanW / nCols);
          drawCobbleStone(ctx, rx, ry, Math.min(10, (spanW / nCols) * 0.46), 7.2, r * 11 + c * 5 + 3, pal, 'TOE_RIPRAP');
        }
      }

      // Two "1 : 6" Slope Triangle Symbols (100% Matching image_7cfc5e.png):
      // (a) Left Wall Batter Triangle (vertical 6, horizontal 1)
      const [midWallLeftX, midWallLeftY] = pt(uHdrL, totalV_cm * 0.62);
      const tri1X = midWallLeftX - 24;
      const tri1Y = midWallLeftY + 22;
      const tri1H = 42;
      const tri1W = tri1H / p.m_tilt;
      cadPoly(ctx, [
        [tri1X, tri1Y],
        [tri1X, tri1Y - tri1H],
        [tri1X + tri1W, tri1Y - tri1H]
      ], pal.secondaryLine, 1.15, true, null, [], 'BATTER_TRI_WALL');
      cadText(ctx, '1', tri1X + tri1W / 2, tri1Y - tri1H - 8, 10.5, pal.titleCyan, 'center', '700');
      cadText(ctx, `${p.m_tilt}`, tri1X - 8, tri1Y - tri1H / 2, 10.5, pal.titleCyan, 'center', '700');

      // (b) Bottom Foundation Slope Triangle (horizontal 6, vertical 1) below B1
      const [midBaseBotX, midBaseBotY] = pt(wKeyBot + wKeySlope + B1 * 0.25, -h1);
      const tri2X = midBaseBotX;
      const tri2Y = midBaseBotY + 18;
      const tri2W = 42;
      const tri2H = tri2W / p.m_tilt;
      cadPoly(ctx, [
        [tri2X, tri2Y],
        [tri2X + tri2W, tri2Y],
        [tri2X, tri2Y - tri2H]
      ], pal.secondaryLine, 1.15, true, null, [], 'BATTER_TRI_BASE');
      cadText(ctx, '1', tri2X - 8, tri2Y - tri2H / 2, 10.5, pal.titleCyan, 'center', '700');
      cadText(ctx, `${p.m_tilt}`, tri2X + tri2W / 2, tri2Y + 9, 10.5, pal.titleCyan, 'center', '700');

      // =====================================================================
      // 6. ALL DIMENSIONS & CALLOUTS (100% Matching Original image_7cfc5e.png)
      // =====================================================================
      // (1) Top tilted dimension: b2 (inner length between header lugs)
      const [pTopWebL_x, pTopWebL_y] = pt(uWebL, vCapTop + 14);
      const [pTopWebR_x, pTopWebR_y] = pt(uWebR, vCapTop + 14);
      cadDim(ctx, pTopWebL_x, pTopWebL_y, pTopWebR_x, pTopWebR_y, -26, `b2 (${p.b2_cm})`, pal, 11);

      // (2) Left Vertical Dimension: H ≦ 4.0m (不含基礎) from foundation top-left (baseTopLeftY) to crest (capTopRightY)
      const xDimH = xRipSlopeTop - 16;
      cadLine(ctx, capTopRightX - 18, capTopRightY, xDimH - 6, capTopRightY, pal.dimLine, 0.95);
      cadLine(ctx, baseTopLeftX - 4, baseTopLeftY, xDimH - 6, baseTopLeftY, pal.dimLine, 0.95);
      cadDim(ctx, xDimH, capTopRightY, xDimH, baseTopLeftY, 0, `H≦4.0m(不含基礎)`, pal, 10.5);

      // (3) Left Vertical Dimension: df ≧ 1.5m from streambed (yStreambed) to foundation bottom (baseBotLeftY)
      const xDimDf = xStreambedLeft + 32;
      cadLine(ctx, baseBotLeftX - 6, baseBotLeftY, xDimDf - 6, baseBotLeftY, pal.dimLine, 0.95);
      cadDim(ctx, xDimDf, yStreambed - 18, xDimDf, baseBotLeftY, 0, `df≧1.5m`, pal, 10.5);

      // (4) Tilted Left Heights on Foundation: h1 (60) and h2 (40)
      const [pBaseTL_x, pBaseTL_y] = pt(0, 0);
      const [pBaseMidL_x, pBaseMidL_y] = pt(0, -h1);
      const [pBaseBL_x, pBaseBL_y] = pt(0, -(h1 + h2));
      cadDim(ctx, pBaseTL_x, pBaseTL_y, pBaseMidL_x, pBaseMidL_y, -38, `h1 (${p.h1_cm})`, pal, 10.5);
      cadDim(ctx, pBaseMidL_x, pBaseMidL_y, pBaseBL_x, pBaseBL_y, -38, `h2 (${p.h2_cm})`, pal, 10.5);

      // (5) Tilted Front Toe Width: 36
      const [pToeR_x, pToeR_y] = pt(wFront, 0);
      cadDim(ctx, pBaseTL_x, pBaseTL_y, pToeR_x, pToeR_y, -18, `${wFront}`, pal, 10);

      // (6) Tilted Bottom Foundation Widths: 30 | 20 | B1 (200) and overall B (250)
      const [pKey1_x, pKey1_y] = pt(wKeyBot, -(h1 + h2));
      const [pKey2_x, pKey2_y] = pt(wKeyBot + wKeySlope, -(h1 + h2));
      const [pBotR_x, pBotR_y] = pt(B, -(h1 + h2));
      cadDim(ctx, pBaseBL_x, pBaseBL_y, pKey1_x, pKey1_y, 22, `${wKeyBot}`, pal, 10);
      cadDim(ctx, pKey1_x, pKey1_y, pKey2_x, pKey2_y, 22, `${wKeySlope}`, pal, 10);
      cadDim(ctx, pKey2_x, pKey2_y, pBotR_x, pBotR_y, 22, `B1 (${B1})`, pal, 10.5);
      cadDim(ctx, pBaseBL_x, pBaseBL_y, pBotR_x, pBotR_y, 44, `B (${p.B_cm})`, pal, 11);

      // (7) Tilted Rear Lug Dimensions on Right: width 25, lug height 30, total rear height h3 (90)
      const [pLugTL_x, pLugTL_y] = pt(uLugL, hLug);
      const [pLugTR_x, pLugTR_y] = pt(B, hLug);
      const [pLugMidR_x, pLugMidR_y] = pt(B, 0);
      const [pLugBR_x, pLugBR_y] = pt(B, -h1);
      cadDim(ctx, pLugTL_x, pLugTL_y, pLugTR_x, pLugTR_y, -18, `${wLug}`, pal, 10);
      cadDim(ctx, pLugTR_x, pLugTR_y, pLugMidR_x, pLugMidR_y, 18, `${hLug}`, pal, 10);
      cadDim(ctx, pLugTR_x, pLugTR_y, pLugBR_x, pLugBR_y, 42, `h3 (${p.h3_cm})`, pal, 10.5);

      // (8) Four Key Callout Leaders (100% Matching image_7cfc5e.png):
      // - 丁條(header)
      cadLeaderDot(
        ctx,
        headerCalloutPt[0], headerCalloutPt[1],
        headerCalloutPt[0] + 38, headerCalloutPt[1],
        headerCalloutPt[0] + 52, headerCalloutPt[1],
        ['丁條(header)'], pal, false, 11.5
      );

      // - 順條(stretcher)
      cadLeaderDot(
        ctx,
        stretcherCalloutPt[0], stretcherCalloutPt[1],
        stretcherCalloutPt[0] + 48, stretcherCalloutPt[1],
        stretcherCalloutPt[0] + 62, stretcherCalloutPt[1],
        ['順條(stretcher)'], pal, false, 11.5
      );

      // - 基礎鋼筋 (pointing up to the red L-rebar inside foundation)
      const [rebCallX, rebCallY] = pt(wKeyBot + wKeySlope + B1 * 0.56, -(h1 - cov - 6));
      cadLeaderDot(
        ctx,
        rebCallX, rebCallY,
        rebCallX, rebCallY + 42,
        rebCallX + 95, rebCallY + 42,
        ['基礎鋼筋'], pal, false, 11.5
      );

      // - 210kgf/cm² 混凝土基礎 (pointing up into the concrete foundation body)
      const [concCallX, concCallY] = pt(wKeyBot + wKeySlope + B1 * 0.44, -h1 * 0.55);
      cadLeaderDot(
        ctx,
        concCallX, concCallY,
        concCallX, rebCallY + 64,
        rebCallX + 65, rebCallY + 64,
        ['210kgf/cm² 混凝土基礎'], pal, false, 11.5
      );

      // Section Title: 斷面圖
      const secTitleX = (pBaseBL_x + pBotR_x) / 2;
      const secTitleY = pBotR_y + 72;
      cadText(ctx, '斷面圖', secTitleX, secTitleY, 17.5, pal.titleCyan, 'center', '700', 0, 'TITLE');
      cadLine(ctx, secTitleX - 38, secTitleY + 11, secTitleX + 38, secTitleY + 11, pal.titleCyan, 1.5);
      cadLine(ctx, secTitleX - 38, secTitleY + 14.5, secTitleX + 38, secTitleY + 14.5, pal.titleCyan, 1.0);

      return {
        rightX: Math.max(crestEndX + 95, rebCallX + 215),
        bottomY: secTitleY + 26
      };
    }

    // =========================================================================
    // 5. VIEW 2 (NEW MANDATORY SKILL RULE): 自動補齊之 1:1 垂直對齊【平面圖】與【立面圖】
    //    Since the original DXF only provided the Cross-Section and Member Details,
    //    we automatically synthesize the 1:1 vertically aligned Plan View & Front Elevation View!
    // =========================================================================
    function drawSynthesizedPlanAndElevationViews(ctx, ox, topY, p, pal) {
      const s = 0.56;
      const N_bay = p.N_bay;
      const bayCm = p.b3_cm; // Each bay is b3 = 200cm
      const totalL_cm = N_bay * bayCm;

      const bayPx = bayCm * s;
      const totalL_px = totalL_cm * s;

      const x0 = ox + 68;
      const x1 = x0 + totalL_px;

      // ---------------------------------------------------------------------
      // PART A: 混凝土格籠(框)護岸【平面圖】 (TOP VIEW - 1:1 ALIGNED)
      // ---------------------------------------------------------------------
      const wToeFront = 36 * s;
      const wCrib = p.b1_cm * s;
      const wStr = p.h_str * s;
      const wHdr = p.h_hdr * s;
      const wBackSlug = 25 * s;

      const yPlan0 = topY + 46;                  // Rear edge of foundation lug
      const yCribBack = yPlan0 + wBackSlug;      // Rear edge of crib headers
      const yCribFront = yCribBack + wCrib;      // Front edge of crib headers
      const yPlanBot = yCribFront + wToeFront;   // Front toe of foundation + riprap

      // 1) Foundation Base Outline in Plan View
      cadPoly(ctx, [
        [x0, yPlan0],
        [x1, yPlan0],
        [x1, yPlanBot],
        [x0, yPlanBot]
      ], pal.baseLine, 1.35, true, pal.baseFill, [], 'PLAN_BASE');

      // 2) Fill Each Crib Cell Bay with Cobble Stones (塊卵塊石填充)
      for (let b = 0; b < N_bay; b++) {
        const bxL = x0 + b * bayPx + wHdr * 0.5;
        const bxR = x0 + (b + 1) * bayPx - wHdr * 0.5;
        const cyTop = yCribBack + wStr;
        const cyBot = yCribFront - wStr;
        const nC = 5, nR = 4;
        for (let r = 0; r < nR; r++) {
          for (let c = 0; c < nC; c++) {
            const sx = bxL + (c + 0.5) * ((bxR - bxL) / nC);
            const sy = cyTop + (r + 0.5) * ((cyBot - cyTop) / nR);
            drawCobbleStone(ctx, sx, sy, ((bxR - bxL) / nC) * 0.44, ((cyBot - cyTop) / nR) * 0.44, b * 23 + r * 7 + c, pal, 'PLAN_CELL_COBBLE');
          }
        }
      }

      // 3) Rear & Front Longitudinal Stretcher Beams (順條 b3=200cm, 寬20cm)
      cadPoly(ctx, [
        [x0, yCribBack],
        [x1, yCribBack],
        [x1, yCribBack + wStr],
        [x0, yCribBack + wStr]
      ], pal.memberLine, 1.4, true, pal.memberFill, [], 'PLAN_REAR_STRETCHER');

      cadPoly(ctx, [
        [x0, yCribFront - wStr],
        [x1, yCribFront - wStr],
        [x1, yCribFront],
        [x0, yCribFront]
      ], pal.memberLine, 1.4, true, pal.memberFill, [], 'PLAN_FRONT_STRETCHER');

      // 4) Transverse Header Beams (丁條 b1=200cm, 寬25cm) at every bay joint b = 0 .. N_bay
      for (let b = 0; b <= N_bay; b++) {
        const hx = x0 + b * bayPx;
        cadPoly(ctx, [
          [hx - wHdr / 2, yCribBack],
          [hx + wHdr / 2, yCribBack],
          [hx + wHdr / 2, yCribFront],
          [hx - wHdr / 2, yCribFront]
        ], pal.memberLine, 1.5, true, 'rgba(30, 41, 59, 0.90)', [], 'PLAN_HEADER');
        // Notch lines at 10cm from ends
        const nibPx = 10 * s;
        cadLine(ctx, hx - wHdr / 2, yCribBack + nibPx, hx + wHdr / 2, yCribBack + nibPx, pal.memberLine, 1.0);
        cadLine(ctx, hx - wHdr / 2, yCribFront - nibPx, hx + wHdr / 2, yCribFront - nibPx, pal.memberLine, 1.0);
      }

      // 5) Stream-Side Toe Riprap Boulders along yPlanBot
      const nRip = N_bay * 6;
      const ripStep = totalL_px / nRip;
      for (let i = 0; i < nRip; i++) {
        drawCobbleStone(ctx, x0 + (i + 0.5) * ripStep, yPlanBot + 8, ripStep * 0.45, 5.5, i + 31, pal, 'PLAN_TOE_RIPRAP');
      }

      // Dimensions on Plan View
      for (let b = 0; b < N_bay; b++) {
        const bxL = x0 + b * bayPx;
        cadDim(ctx, bxL, yPlan0, bxL + bayPx, yPlan0, -15, `b3=${bayCm}`, pal, 10.5);
      }
      cadDim(ctx, x0, yPlan0, x1, yPlan0, -33, `展示長 L = ${totalL_cm}cm (${N_bay}格・單格b3=${bayCm}cm)`, pal, 11);
      cadDim(ctx, x0 - wHdr / 2, yCribBack, x0 - wHdr / 2, yCribFront, -20, `b1=${p.b1_cm}`, pal, 10.5);
      cadDim(ctx, x0 - wHdr / 2, yPlan0, x0 - wHdr / 2, yPlanBot, -42, `B=${p.B_cm}`, pal, 10.5);

      // Right Labels on Plan View
      cadText(ctx, '← 後踵凸台(25cm) + 坡頂植生', x1 + 14, (yPlan0 + yCribBack) / 2, 10.5, pal.textSub, 'left', '500');
      cadText(ctx, `← 丁條(b1=${p.b1_cm})×順條(b3=${p.b3_cm})格籠填石`, x1 + 14, (yCribBack + yCribFront) / 2, 10.5, pal.memberLine, 'left', '600');
      cadText(ctx, '← 基礎前緣(36cm) + 臨水面拋卵塊石', x1 + 14, yPlanBot + 4, 10.5, pal.stoneLine, 'left', '600');

      const planTitleY = yPlanBot + 34;
      cadText(ctx, '平面圖 (自動補齊・1:1垂直對齊)', (x0 + x1) / 2, planTitleY, 15.5, pal.titleCyan, 'center', '700');
      cadLine(ctx, (x0 + x1) / 2 - 110, planTitleY + 10, (x0 + x1) / 2 + 110, planTitleY + 10, pal.titleCyan, 1.3);

      // ---------------------------------------------------------------------
      // PART B: 混凝土格籠(框)護岸【立面圖】 (FRONT ELEVATION - 1:1 ALIGNED)
      // ---------------------------------------------------------------------
      const yElevTop = planTitleY + 46;
      const wallH_px = p.H_cm * s;
      const baseH_px = p.h1_cm * s;
      const keyH_px = p.h2_cm * s;
      const yElevBaseTop = yElevTop + wallH_px;
      const yElevBaseBot = yElevBaseTop + baseH_px;
      const yElevKeyBot = yElevBaseBot + keyH_px;

      // 1:1 Vertical Alignment Dashed Guides between Plan View and Elevation View
      for (let b = 0; b <= N_bay; b++) {
        const gx = x0 + b * bayPx;
        cadLine(ctx, gx, yPlanBot + 14, gx, yElevTop - 6, pal.secondaryLine, 0.85, [4, 4], 'ALIGN_GUIDE');
      }

      // 1) Foundation Base & Shear Key in Elevation View (dashed below streambed)
      cadPoly(ctx, [
        [x0 - wHdr / 2, yElevBaseTop],
        [x1 + wHdr / 2, yElevBaseTop],
        [x1 + wHdr / 2, yElevBaseBot],
        [x0 - wHdr / 2, yElevBaseBot]
      ], pal.baseLine, 1.3, true, pal.baseFill, [5, 3], 'ELEV_BASE');

      cadPoly(ctx, [
        [x0 - wHdr / 2, yElevBaseBot],
        [x1 + wHdr / 2, yElevBaseBot],
        [x1 + wHdr / 2, yElevKeyBot],
        [x0 - wHdr / 2, yElevKeyBot]
      ], pal.baseLine, 1.15, true, 'rgba(30, 41, 59, 0.45)', [4, 4], 'ELEV_KEY');

      // 2) Draw N_tiers Courses of Crib Wall in Elevation View:
      //    - Horizontal Stretcher Beams (順條 20cm high) spanning each bay
      //    - Open 20cm / 14cm Gaps between Stretchers showing Cobble Stones inside the crib!
      //    - Square 25x25cm Header Ends (丁條端頭) at every bay joint b = 0 .. N_bay
      const tierH_px = wallH_px / p.N_tiers;
      const strH_px = tierH_px * 0.56;
      const hdrH_px = tierH_px * 0.72;

      for (let t = 0; t < p.N_tiers; t++) {
        const tyBot = yElevBaseTop - t * tierH_px;
        const tyTop = tyBot - tierH_px;

        // Draw Cobble Stones visible through the crib openings in each bay
        for (let b = 0; b < N_bay; b++) {
          const bxL = x0 + b * bayPx + wHdr / 2;
          const bxR = x0 + (b + 1) * bayPx - wHdr / 2;
          const nStones = 6;
          const stStep = (bxR - bxL) / nStones;
          for (let c = 0; c < nStones; c++) {
            drawCobbleStone(ctx, bxL + (c + 0.5) * stStep, tyTop + tierH_px * 0.35, stStep * 0.46, tierH_px * 0.24, t * 17 + b * 5 + c, pal, 'ELEV_GAP_COBBLE');
          }

          // Horizontal Stretcher Beam (順條) at bottom of tier t
          cadPoly(ctx, [
            [bxL - 2, tyBot - strH_px],
            [bxR + 2, tyBot - strH_px],
            [bxR + 2, tyBot],
            [bxL - 2, tyBot]
          ], pal.memberLine, 1.3, true, pal.memberFill, [], 'ELEV_STRETCHER');
        }

        // Square Header Ends (丁條 25×25cm 端頭) at every column node b = 0 .. N_bay
        for (let b = 0; b <= N_bay; b++) {
          const hx = x0 + b * bayPx;
          const hyMid = tyBot - strH_px * 0.85;
          cadPoly(ctx, [
            [hx - wHdr / 2, hyMid - hdrH_px / 2],
            [hx + wHdr / 2, hyMid - hdrH_px / 2],
            [hx + wHdr / 2, hyMid + hdrH_px / 2],
            [hx - wHdr / 2, hyMid + hdrH_px / 2]
          ], pal.memberLine, 1.45, true, 'rgba(30, 41, 59, 0.92)', [], 'ELEV_HEADER_END');
          // Inner #3 stirrup square dot indication on header end
          cadPoly(ctx, [
            [hx - wHdr * 0.28, hyMid - hdrH_px * 0.28],
            [hx + wHdr * 0.28, hyMid - hdrH_px * 0.28],
            [hx + wHdr * 0.28, hyMid + hdrH_px * 0.28],
            [hx - wHdr * 0.28, hyMid + hdrH_px * 0.28]
          ], pal.rebarLine, 0.85, true, null, [], 'ELEV_HEADER_REBAR');
        }
      }

      // Top Crest Plants along yElevTop
      for (let px = x0 + 18; px < x1 - 12; px += 28) {
        drawPlantSymbol(ctx, px, yElevTop, 0.72, pal);
      }

      // Streambed Line (設計溪床線, df above key bottom) & Toe Riprap Boulders
      const yElevBed = yElevKeyBot - p.df_cm * s;
      cadLine(ctx, x0 - 24, yElevBed, x1 + 24, yElevBed, pal.waterLine, 1.5, [8, 4], 'ELEV_STREAMBED');
      for (let i = 0; i < nRip; i++) {
        drawCobbleStone(ctx, x0 + (i + 0.5) * ripStep, yElevBed - 5, ripStep * 0.45, 5.0, i + 61, pal, 'ELEV_RIPRAP');
      }

      // Dimensions on Elevation View
      cadDim(ctx, x0 - wHdr / 2, yElevTop, x0 - wHdr / 2, yElevBaseTop, -22, `H=${p.H_cm}`, pal, 10.5);
      cadDim(ctx, x0 - wHdr / 2, yElevBaseTop, x0 - wHdr / 2, yElevKeyBot, -22, `h1+h2=${p.h1_cm+p.h2_cm}`, pal, 10);
      cadDim(ctx, x1 + wHdr / 2, yElevBed, x1 + wHdr / 2, yElevKeyBot, 22, `df=${p.df_cm}`, pal, 10.5);

      // Right Labels on Elevation View
      cadText(ctx, `← 丁條端頭(25×25) + 順條(20×20) + 孔隙填石`, x1 + 65, (yElevTop + yElevBed) / 2, 10.5, pal.memberLine, 'left', '600');
      cadText(ctx, `← 設計溪床線 (埋深 df=${p.df_cm}cm ≧1.5m)`, x1 + 65, yElevBed - 8, 10.5, pal.waterLine, 'left', '600');

      const elevTitleY = yElevKeyBot + 28;
      cadText(ctx, '立面圖 (自動補齊・1:1垂直對齊)', (x0 + x1) / 2, elevTitleY, 15.5, pal.titleCyan, 'center', '700');
      cadLine(ctx, (x0 + x1) / 2 - 110, elevTitleY + 10, (x0 + x1) / 2 + 110, elevTitleY + 10, pal.titleCyan, 1.3);

      return {
        rightX: x1 + 295,
        bottomY: elevTitleY + 24
      };
    }

    // =========================================================================
    // 6. VIEW 3 & 4: 丁條大樣圖 (HEADER 3-VIEW DETAIL 1:20) & 順條大樣圖 (STRETCHER 3-VIEW DETAIL)
    //    100% Faithful to DXF Model Space (X ≈ 3018..3325, Y ≈ 1354..1741):
    //    - 丁條大樣圖 (Top Cluster):
    //      * 正視圖 (Front View): b1 (200cm), b2 (178cm), end lugs 10cm, bevel 1cm, height 25cm, #3箍筋 + #3鋼筋保護層3cm
    //      * 上視圖 (Top View): b1 (200cm), b2 (178cm), width 25cm, internal #3 rebar cage
    //      * 側視圖 (Side View): width 25cm, height 25cm = 6cm + 13cm + 6cm, internal #3 hoop with 135° corner hooks
    //    - 順條大樣圖 (Bottom Cluster):
    //      * 正視圖 (Front View): length b3 (200cm), height 20cm, #3箍筋 + #3鋼筋，保護層3cm
    //      * 上視圖 (Top View): length b3 (200cm), width 20cm, 11 stirrups
    //      * 側視圖 (Side View): width 20cm, height 20cm = 3cm + 14cm + 3cm, internal #3 hoop with 135° corner hooks
    // =========================================================================
    function drawHeaderAndStretcherDetails(ctx, ox, topY, p, pal) {
      const s = 1.05; // Scale for 1:20 Member Details
      const b1 = p.b1_cm * s;     // 200 * s
      const b2 = p.b2_cm * s;     // 178 * s
      const hHdr = p.h_hdr * s;   // 25 * s
      const nib = ((p.b1_cm - p.b2_cm - 2) / 2) * s; // 10 * s
      const bev = 1 * s;          // 1 * s
      const hNotch = 6 * s;       // 6 * s

      const x0 = ox + 45;

      // =====================================================================
      // PART 1: 丁條大樣圖 (HEADER BEAM 3-VIEW DETAIL - 比例尺 1:20)
      // =====================================================================
      const yHdrFront0 = topY + 52;
      const yHdrFront1 = yHdrFront0 + hHdr;

      // 1A. 丁條【正視圖】 (Front Elevation of Notched Header, matching DXF 4E9F & 4F16..4F17)
      const hdrFrontPts = [
        [x0, yHdrFront0],
        [x0 + nib, yHdrFront0],
        [x0 + nib + bev, yHdrFront0 + hNotch],
        [x0 + b1 - nib - bev, yHdrFront0 + hNotch],
        [x0 + b1 - nib, yHdrFront0],
        [x0 + b1, yHdrFront0],
        [x0 + b1, yHdrFront1],
        [x0 + b1 - nib, yHdrFront1],
        [x0 + b1 - nib - bev, yHdrFront1 - hNotch],
        [x0 + nib + bev, yHdrFront1 - hNotch],
        [x0 + nib, yHdrFront1],
        [x0, yHdrFront1]
      ];
      cadPoly(ctx, hdrFrontPts, pal.memberLine, 1.55, true, 'rgba(30, 41, 59, 0.70)', [], 'HDR_FRONT_OUTLINE');

      // Internal #3 Longitudinal Rebar (stepped following the notches, cover = 3cm) & 9 #3 Stirrups (matching DXF 4F16, 4F17, 550C..5511)
      const cov = 3 * s;
      cadPoly(ctx, [
        [x0 + cov, yHdrFront1 - cov],
        [x0 + cov, yHdrFront0 + cov],
        [x0 + nib - cov * 0.4, yHdrFront0 + cov],
        [x0 + nib + bev, yHdrFront0 + hNotch + cov * 0.75],
        [x0 + b1 - nib - bev, yHdrFront0 + hNotch + cov * 0.75],
        [x0 + b1 - nib + cov * 0.4, yHdrFront0 + cov],
        [x0 + b1 - cov, yHdrFront0 + cov],
        [x0 + b1 - cov, yHdrFront1 - cov]
      ], pal.rebarLine, 1.2, false, null, [], 'HDR_REBAR_TOP');

      cadPoly(ctx, [
        [x0 + cov, yHdrFront0 + cov],
        [x0 + cov, yHdrFront1 - cov],
        [x0 + nib - cov * 0.4, yHdrFront1 - cov],
        [x0 + nib + bev, yHdrFront1 - hNotch - cov * 0.75],
        [x0 + b1 - nib - bev, yHdrFront1 - hNotch - cov * 0.75],
        [x0 + b1 - nib + cov * 0.4, yHdrFront1 - cov],
        [x0 + b1 - cov, yHdrFront1 - cov]
      ], pal.rebarLine, 1.2, false, null, [], 'HDR_REBAR_BOT');

      // 9 Vertical #3 Stirrup lines across b2
      const nHdrStirrups = 9;
      for (let i = 0; i < nHdrStirrups; i++) {
        const sx = (x0 + nib + bev + 4 * s) + (i / (nHdrStirrups - 1)) * (b2 - 8 * s);
        cadLine(ctx, sx, yHdrFront0 + hNotch + cov * 0.5, sx, yHdrFront1 - hNotch - cov * 0.5, pal.rebarLine, 1.05, [], 'HDR_STIRRUP');
      }

      // Dimensions on Header Front View: b1 (200), b2 (178), 10, 1, 25 (matching DXF *D24, *D25, *D26, *D27, *D28)
      cadDim(ctx, x0, yHdrFront0, x0 + b1, yHdrFront0, -34, `b1 (${p.b1_cm})`, pal, 11);
      cadDim(ctx, x0, yHdrFront0, x0 + nib, yHdrFront0, -16, `${Math.round(nib / s)}`, pal, 10);
      cadDim(ctx, x0 + nib + bev, yHdrFront0 + hNotch, x0 + b1 - nib - bev, yHdrFront0 + hNotch, -(16 + hNotch), `b2 (${p.b2_cm})`, pal, 10.5);
      cadText(ctx, '1', x0 + b1 - nib - bev * 0.5, yHdrFront0 - 16, 9.5, pal.dimText, 'center', '700');
      cadDim(ctx, x0 + b1, yHdrFront0, x0 + b1, yHdrFront1, 18, `${p.h_hdr}`, pal, 10.5);

      // Callouts on Header Front View: #3箍筋 (4F08, 4F0B) & #3鋼筋保護層3cm (4F06, 4F07, 4F0C)
      const st1X = x0 + nib + bev + 4 * s;
      cadLeaderDot(ctx, st1X, (yHdrFront0 + yHdrFront1) / 2, st1X + 14, yHdrFront1 + 22, st1X + 24, yHdrFront1 + 22, ['#3箍筋'], pal, false, 10.8);

      const rbMidX = x0 + b1 * 0.62;
      cadLine(ctx, rbMidX - 6, yHdrFront0 + hNotch + cov * 0.75, rbMidX + 12, yHdrFront1 + 22, pal.leaderLine, 1.05);
      cadLine(ctx, rbMidX - 12, yHdrFront1 - hNotch - cov * 0.75, rbMidX + 12, yHdrFront1 + 22, pal.leaderLine, 1.05);
      cadText(ctx, '#3鋼筋保護層3cm', rbMidX + 16, yHdrFront1 + 22, 10.8, pal.titleCyan, 'left', '600');

      cadText(ctx, '正面圖', x0 + b1 * 0.42, yHdrFront1 + 24, 13, pal.titleCyan, 'center', '700');

      // 1B. 丁條【側視圖】 (Side Section of Header at Right, matching DXF 4EA5, 4ECE, *D30..*D33, *D42)
      const xHdrSide0 = x0 + b1 + 58;
      const xHdrSide1 = xHdrSide0 + hHdr;
      cadPoly(ctx, [
        [xHdrSide0, yHdrFront0],
        [xHdrSide1, yHdrFront0],
        [xHdrSide1, yHdrFront1],
        [xHdrSide0, yHdrFront1]
      ], pal.memberLine, 1.55, true, 'rgba(30, 41, 59, 0.70)', [], 'HDR_SIDE_OUTLINE');

      // Dashed notch lines at 6cm from top and 6cm from bottom (4EA8, 4EA9)
      cadLine(ctx, xHdrSide0, yHdrFront0 + hNotch, xHdrSide1, yHdrFront0 + hNotch, pal.memberLine, 1.1, [5, 3], 'HDR_SIDE_NOTCH');
      cadLine(ctx, xHdrSide0, yHdrFront1 - hNotch, xHdrSide1, yHdrFront1 - hNotch, pal.memberLine, 1.1, [5, 3], 'HDR_SIDE_NOTCH');

      // Inner #3 Stirrup Hoop with 135° corner hooks (4ECE, 4ECF, 4ED0)
      cadPoly(ctx, [
        [xHdrSide0 + cov, yHdrFront0 + hNotch + cov * 0.5],
        [xHdrSide1 - cov, yHdrFront0 + hNotch + cov * 0.5],
        [xHdrSide1 - cov, yHdrFront1 - hNotch - cov * 0.5],
        [xHdrSide0 + cov, yHdrFront1 - hNotch - cov * 0.5]
      ], pal.rebarLine, 1.3, true, null, [], 'HDR_SIDE_HOOP');
      cadLine(ctx, xHdrSide1 - cov, yHdrFront0 + hNotch + cov * 0.5, xHdrSide1 - cov - 4, yHdrFront0 + hNotch + cov * 0.5 + 4, pal.rebarLine, 1.2);

      // Dimensions on Header Side View: Left 25 (*D42), Bottom 25 (*D30), Right 6 | 13 | 6 (*D31, *D32, *D33)
      cadDim(ctx, xHdrSide0, yHdrFront0, xHdrSide0, yHdrFront1, -14, `${p.h_hdr}`, pal, 10);
      cadDim(ctx, xHdrSide0, yHdrFront1, xHdrSide1, yHdrFront1, 16, `${p.h_hdr}`, pal, 10.5);
      cadDim(ctx, xHdrSide1, yHdrFront0, xHdrSide1, yHdrFront0 + hNotch, 16, `6`, pal, 9.5);
      cadDim(ctx, xHdrSide1, yHdrFront0 + hNotch, xHdrSide1, yHdrFront1 - hNotch, 16, `${p.h_hdr - 12}`, pal, 10);
      cadDim(ctx, xHdrSide1, yHdrFront1 - hNotch, xHdrSide1, yHdrFront1, 16, `6`, pal, 9.5);
      cadText(ctx, '側視圖', (xHdrSide0 + xHdrSide1) / 2, yHdrFront1 + 36, 13, pal.titleCyan, 'center', '700');

      // 1C. 丁條【上視圖】 (Top Plan View of Header below Front View, matching DXF 4EAB, 4EB1..4EB4, *D29, *D38)
      const yHdrTop0 = yHdrFront1 + 52;
      const yHdrTop1 = yHdrTop0 + hHdr;
      cadPoly(ctx, [
        [x0, yHdrTop0],
        [x0 + b1, yHdrTop0],
        [x0 + b1, yHdrTop1],
        [x0, yHdrTop1]
      ], pal.memberLine, 1.55, true, 'rgba(30, 41, 59, 0.70)', [], 'HDR_TOP_OUTLINE');

      // Notch vertical lines at nib and nib+bev on left & right ends
      [x0 + nib, x0 + nib + bev, x0 + b1 - nib - bev, x0 + b1 - nib].forEach((nx) => {
        cadLine(ctx, nx, yHdrTop0, nx, yHdrTop1, pal.memberLine, 1.1, [], 'HDR_TOP_NOTCH');
      });

      // Longitudinal & Transverse #3 Rebar in Top View (4ED4..4ED7, 5524..5529)
      cadLine(ctx, x0 + cov, yHdrTop0 + cov, x0 + b1 - cov, yHdrTop0 + cov, pal.rebarLine, 1.15);
      cadLine(ctx, x0 + cov, yHdrTop1 - cov, x0 + b1 - cov, yHdrTop1 - cov, pal.rebarLine, 1.15);
      cadLine(ctx, x0 + cov, (yHdrTop0 + yHdrTop1) / 2, x0 + b1 - cov, (yHdrTop0 + yHdrTop1) / 2, pal.rebarLine, 1.0);
      for (let i = 0; i < nHdrStirrups; i++) {
        const sx = (x0 + nib + bev + 4 * s) + (i / (nHdrStirrups - 1)) * (b2 - 8 * s);
        cadLine(ctx, sx, yHdrTop0 + cov, sx, yHdrTop1 - cov, pal.rebarLine, 1.05);
      }

      cadDim(ctx, x0 + nib + bev, yHdrTop1, x0 + b1 - nib - bev, yHdrTop1, 16, `b2 (${p.b2_cm})`, pal, 10.5);
      cadDim(ctx, x0 + b1, yHdrTop0, x0 + b1, yHdrTop1, 18, `${p.h_hdr}`, pal, 10.5);
      cadText(ctx, '上視圖', x0 + b1 * 0.42, yHdrTop1 + 34, 13, pal.titleCyan, 'center', '700');

      // Section Title: 丁條大樣圖 (比例尺 1:20)
      const hdrTitleY = yHdrTop1 + 54;
      cadText(ctx, '丁條大樣圖 (比例尺 1:20)', x0 + b1 * 0.65, hdrTitleY, 15.5, pal.titleCyan, 'center', '700');
      cadLine(ctx, x0 + b1 * 0.65 - 92, hdrTitleY + 10, x0 + b1 * 0.65 + 92, hdrTitleY + 10, pal.titleCyan, 1.4);

      // =====================================================================
      // PART 2: 順條大樣圖 (STRETCHER BEAM 3-VIEW DETAIL - 比例尺 1:20)
      // =====================================================================
      const b3 = p.b3_cm * s;   // 200 * s
      const hStr = p.h_str * s; // 20 * s
      const covStr = 3 * s;     // 3cm cover

      const yStrFront0 = hdrTitleY + 52;
      const yStrFront1 = yStrFront0 + hStr;

      // 2A. 順條【正視圖】 (Front Elevation of Stretcher, matching DXF 56C3, 4ED8..4EDA, 56C7..56D0, *D34, *D35)
      cadPoly(ctx, [
        [x0, yStrFront0],
        [x0 + b3, yStrFront0],
        [x0 + b3, yStrFront1],
        [x0, yStrFront1]
      ], pal.memberLine, 1.55, true, 'rgba(30, 41, 59, 0.70)', [], 'STR_FRONT_OUTLINE');

      cadLine(ctx, x0 + covStr, yStrFront0 + covStr, x0 + b3 - covStr, yStrFront0 + covStr, pal.rebarLine, 1.2);
      cadLine(ctx, x0 + covStr, yStrFront1 - covStr, x0 + b3 - covStr, yStrFront1 - covStr, pal.rebarLine, 1.2);

      const nStrStirrups = 11;
      for (let i = 0; i < nStrStirrups; i++) {
        const sx = (x0 + 15 * s) + (i / (nStrStirrups - 1)) * (b3 - 30 * s);
        cadLine(ctx, sx, yStrFront0 + covStr * 0.7, sx, yStrFront1 - covStr * 0.7, pal.rebarLine, 1.05);
      }

      cadDim(ctx, x0, yStrFront0, x0 + b3, yStrFront0, -20, `b3 (${p.b3_cm})`, pal, 11);
      cadDim(ctx, x0 + b3, yStrFront0, x0 + b3, yStrFront1, 16, `${p.h_str}`, pal, 10.5);

      // Callouts on Stretcher Front View: #3箍筋 (5844, 5845) & #3鋼筋，保護層3cm (4F0F..4F11)
      cadLeaderDot(ctx, x0 + 15 * s, (yStrFront0 + yStrFront1) / 2, x0 + 28 * s, yStrFront1 + 20, x0 + 38 * s, yStrFront1 + 20, ['#3箍筋'], pal, false, 10.8);
      const strRbX = x0 + b3 * 0.62;
      cadLine(ctx, strRbX - 8, yStrFront0 + covStr, strRbX + 12, yStrFront1 + 20, pal.leaderLine, 1.05);
      cadLine(ctx, strRbX - 14, yStrFront1 - covStr, strRbX + 12, yStrFront1 + 20, pal.leaderLine, 1.05);
      cadText(ctx, '#3鋼筋，保護層3cm', strRbX + 16, yStrFront1 + 20, 10.8, pal.titleCyan, 'left', '600');
      cadText(ctx, '正面圖', x0 + b3 * 0.42, yStrFront1 + 22, 13, pal.titleCyan, 'center', '700');

      // 2B. 順條【側視圖】 (Side Section of Stretcher at Right, matching DXF 56F8, 56F9, *D36, *D37, *D40, *D41, *D43)
      const xStrSide0 = x0 + b3 + 58;
      const xStrSide1 = xStrSide0 + hStr;
      cadPoly(ctx, [
        [xStrSide0, yStrFront0],
        [xStrSide1, yStrFront0],
        [xStrSide1, yStrFront1],
        [xStrSide0, yStrFront1]
      ], pal.memberLine, 1.55, true, 'rgba(30, 41, 59, 0.70)', [], 'STR_SIDE_OUTLINE');

      cadPoly(ctx, [
        [xStrSide0 + covStr, yStrFront0 + covStr],
        [xStrSide1 - covStr, yStrFront0 + covStr],
        [xStrSide1 - covStr, yStrFront1 - covStr],
        [xStrSide0 + covStr, yStrFront1 - covStr]
      ], pal.rebarLine, 1.3, true, null, [], 'STR_SIDE_HOOP');

      // Dimensions on Stretcher Side View: Top 20 (*D36), Left 14 (*D40), Right 3 | 3 (*D37, *D41) and 20 (*D43)
      cadDim(ctx, xStrSide0, yStrFront0, xStrSide1, yStrFront0, -16, `${p.h_str}`, pal, 10.5);
      cadDim(ctx, xStrSide0, yStrFront0 + covStr, xStrSide0, yStrFront1 - covStr, -14, `${p.h_str - 6}`, pal, 10);
      cadDim(ctx, xStrSide1, yStrFront0, xStrSide1, yStrFront0 + covStr, 14, `3`, pal, 9.5);
      cadDim(ctx, xStrSide1, yStrFront1 - covStr, xStrSide1, yStrFront1, 14, `3`, pal, 9.5);
      cadDim(ctx, xStrSide1 + 18, yStrFront0, xStrSide1 + 18, yStrFront1, 14, `${p.h_str}`, pal, 10.5);
      cadText(ctx, '側視圖', (xStrSide0 + xStrSide1) / 2, yStrFront1 + 32, 13, pal.titleCyan, 'center', '700');

      // 2C. 順條【上視圖】 (Top Plan View of Stretcher below Front View, matching DXF 57DA, 57D2..57D9, *D39)
      const yStrTop0 = yStrFront1 + 46;
      const yStrTop1 = yStrTop0 + hStr;
      cadPoly(ctx, [
        [x0, yStrTop0],
        [x0 + b3, yStrTop0],
        [x0 + b3, yStrTop1],
        [x0, yStrTop1]
      ], pal.memberLine, 1.55, true, 'rgba(30, 41, 59, 0.70)', [], 'STR_TOP_OUTLINE');

      cadLine(ctx, x0 + covStr, yStrTop0 + covStr, x0 + b3 - covStr, yStrTop0 + covStr, pal.rebarLine, 1.15);
      cadLine(ctx, x0 + covStr, yStrTop1 - covStr, x0 + b3 - covStr, yStrTop1 - covStr, pal.rebarLine, 1.15);
      for (let i = 0; i < nStrStirrups; i++) {
        const sx = (x0 + 15 * s) + (i / (nStrStirrups - 1)) * (b3 - 30 * s);
        cadLine(ctx, sx, yStrTop0 + covStr * 0.7, sx, yStrTop1 - covStr * 0.7, pal.rebarLine, 1.05);
      }

      cadDim(ctx, x0 + b3, yStrTop0, x0 + b3, yStrTop1, 16, `${p.h_str}`, pal, 10.5);
      cadText(ctx, '上視圖', x0 + b3 * 0.42, yStrTop1 + 26, 13, pal.titleCyan, 'center', '700');

      const strTitleY = yStrTop1 + 48;
      cadText(ctx, '順條大樣圖 (比例尺 1:20)', x0 + b3 * 0.65, strTitleY, 15.5, pal.titleCyan, 'center', '700');
      cadLine(ctx, x0 + b3 * 0.65 - 92, strTitleY + 10, x0 + b3 * 0.65 + 92, strTitleY + 10, pal.titleCyan, 1.4);

      return {
        rightX: xStrSide1 + 55,
        bottomY: strTitleY + 24
      };
    }

    // =========================================================================
    // 7. VIEW 5: EXPLICIT FIGURE-NUMBER QUANTITY TABLE ON CANVAS
    // =========================================================================
    function drawExplicitFormulaTableOnCanvas(ctx, ox, oy, p, pal) {
      cadText(
        ctx,
        `【混凝土格籠(框)護岸 (圖號 0416-1) 每公尺數量計算式表 — 採用圖面標註數字顯式列式 (${p.N_tiers}層丁條・H=${(p.H_cm/100).toFixed(2)}m・全段=${p.L_tot_m.toFixed(1)}m)】`,
        ox, oy - 15, 13.5, pal.dimText, 'left', '700'
      );

      const colW = [220, 465, 82, 92, 52];
      const rowH = 26;
      const rows = [
        ['工程項目名稱 (依DXF圖面標註)', '採用圖面標註數字之顯式計算式 (每公尺單側基準)', '每m數量', `全段(${p.L_tot_m}m)`, '單位'],
        [`預鑄混凝土丁條 (b1=${p.b1_cm}cm, b2=${p.b2_cm}cm, 25×25)`, p.formula_hdr_cnt, p.q_hdr_cnt.toFixed(2), (p.q_hdr_cnt * p.L_tot_m).toFixed(0), '支'],
        [`預鑄丁條 210kgf/cm² 混凝土體積`, p.formula_hdr_rc, p.q_hdr_rc.toFixed(2), (p.q_hdr_rc * p.L_tot_m).toFixed(2), 'M³'],
        [`預鑄混凝土順條 (b3=${p.b3_cm}cm, 20×20cm)`, p.formula_str_cnt, p.q_str_cnt.toFixed(2), (p.q_str_cnt * p.L_tot_m).toFixed(0), '支'],
        [`預鑄順條 210kgf/cm² 混凝土體積`, p.formula_str_rc, p.q_str_rc.toFixed(2), (p.q_str_rc * p.L_tot_m).toFixed(2), 'M³'],
        [`210kgf/cm² 場鑄混凝土基礎台 (B=${p.B_cm}, h1=${p.h1_cm})`, p.formula_base_rc, p.q_base_rc.toFixed(2), (p.q_base_rc * p.L_tot_m).toFixed(2), 'M³'],
        ['格籠內填卵塊石及臨水面坡腳基礎保護塊石', p.formula_cobble_vol, p.q_cobble_vol.toFixed(2), (p.q_cobble_vol * p.L_tot_m).toFixed(2), 'M³'],
        ['預鑄丁條/順條 #3 鋼筋與基礎台鋼筋總重', p.formula_rebar, p.q_rebar_tot.toFixed(1), (p.q_rebar_tot * p.L_tot_m).toFixed(1), 'kg']
      ];

      const totW = colW.reduce((a, b) => a + b, 0);
      const totH = rows.length * rowH;

      ctx.save();
      ctx.fillStyle = pal.tableHeaderBg;
      ctx.fillRect(ox, oy, totW, rowH);
      ctx.restore();

      cadPoly(ctx, [
        [ox, oy],
        [ox + totW, oy],
        [ox + totW, oy + totH],
        [ox, oy + totH]
      ], pal.primaryLine, 1.45, true, null, [], 'FORMULA_TABLE');

      for (let r = 1; r < rows.length; r++) {
        cadLine(ctx, ox, oy + r * rowH, ox + totW, oy + r * rowH, pal.tableBorder, 0.95);
      }

      let vx = ox;
      for (let c = 0; c < colW.length - 1; c++) {
        vx += colW[c];
        cadLine(ctx, vx, oy, vx, oy + totH, pal.tableBorder, 0.95);
      }

      rows.forEach((rData, rIdx) => {
        let cx = ox;
        const ry = oy + (rIdx + 0.5) * rowH;
        const isHeader = rIdx === 0;
        rData.forEach((cellStr, cIdx) => {
          const cw = colW[cIdx];
          const align = ((cIdx === 0 || cIdx === 1) && !isHeader) ? 'left' : 'center';
          const tx = align === 'left' ? cx + 8 : cx + cw / 2;
          const color = isHeader ? pal.textMain : (cIdx === 2 ? pal.dimText : (cIdx === 3 ? pal.memberLine : pal.textSub));
          cadText(ctx, cellStr, tx, ry, isHeader ? 11.2 : 10.6, color, align, (isHeader || cIdx === 2 || cIdx === 3) ? '700' : '500');
          cx += cw;
        });
      });

      return { bottomY: oy + totH };
    }

    // =========================================================================
    // 8. MAIN RENDER ENGINE & LIVE UI UPDATER
    // =========================================================================
    function updateSidebarSummary(p) {
      document.getElementById('stat_tier_tag').textContent = `${p.N_tiers}層・H=${(p.H_cm / 100).toFixed(2)}m`;
      document.getElementById('stat_members_m').textContent = `${p.q_hdr_cnt.toFixed(1)} + ${p.q_str_cnt.toFixed(1)} 支/m`;
      document.getElementById('stat_rc_m').textContent = `${(p.q_hdr_rc + p.q_str_rc).toFixed(2)} + ${p.q_base_rc.toFixed(2)} M³/m`;
      document.getElementById('stat_cobble_m').textContent = `${p.q_cobble_vol.toFixed(2)} M³/m`;
      document.getElementById('stat_rebar_m').textContent = `${p.q_rebar_tot.toFixed(1)} kg/m`;
    }

    function renderAll() {
      const canvas = document.getElementById('cadCanvas');
      if (!canvas) return;
      const rect = canvas.parentElement.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      if (canvas.width !== Math.floor(rect.width * dpr) || canvas.height !== Math.floor(rect.height * dpr)) {
        canvas.width = Math.floor(rect.width * dpr);
        canvas.height = Math.floor(rect.height * dpr);
      }

      const ctx = canvas.getContext('2d');
      const pal = getPalette();
      const p = getParams();

      updateSidebarSummary(p);
      document.getElementById('zoom-indicator').textContent = `${Math.round(viewCam.scale * 100)}%`;

      dxfEntities = [];

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.fillStyle = pal.bg;
      ctx.fillRect(0, 0, rect.width, rect.height);

      ctx.translate(viewCam.offsetX, viewCam.offsetY);
      ctx.scale(viewCam.scale, viewCam.scale);

      if (currentView === 'SECTION_PLAN_ELEV') {
        const bSec = drawMainCrossSectionView(ctx, 40, 15, p, pal);
        const bPE = drawSynthesizedPlanAndElevationViews(ctx, bSec.rightX + 35, 15, p, pal);
        drawExplicitFormulaTableOnCanvas(ctx, 50, Math.max(bSec.bottomY, bPE.bottomY) + 42, p, pal);
      } else if (currentView === 'HEADER_STRETCHER') {
        const bDet = drawHeaderAndStretcherDetails(ctx, 60, 15, p, pal);
        const bSec = drawMainCrossSectionView(ctx, bDet.rightX + 45, 15, p, pal);
        drawExplicitFormulaTableOnCanvas(ctx, 55, Math.max(bDet.bottomY, bSec.bottomY) + 42, p, pal);
      } else {
        // 'ALL' Full Standard Sheet Layout:
        // - Left Column: 斷面圖 (已剔除自然地形線，後傾1:6)
        // - Middle Column: 自動補齊之 1:1 垂直對齊【平面圖】與【立面圖】
        // - Right Column: 丁條大樣圖 (上視/正視/側視 1:20) + 順條大樣圖 (上視/正視/側視 1:20)
        // - Bottom Full-Width: 圖面標註數字顯式計算式表
        const bSec = drawMainCrossSectionView(ctx, 30, 12, p, pal);
        const midColX = bSec.rightX + 25;
        const bPE = drawSynthesizedPlanAndElevationViews(ctx, midColX, 12, p, pal);
        const rightColX = bPE.rightX + 25;
        const bDet = drawHeaderAndStretcherDetails(ctx, rightColX, 12, p, pal);

        const tableY = Math.max(bSec.bottomY, bPE.bottomY, bDet.bottomY) + 45;
        drawExplicitFormulaTableOnCanvas(ctx, 45, tableY, p, pal);
      }

      ctx.restore();
    }

    // =========================================================================
    // 9. UI CONTROLS, AUTO-SYNC & DXF / CSV EXPORTERS
    // =========================================================================
    function onTierChange() {
      const nTiers = parseFloat(document.getElementById('inp_N_tiers').value) || 8;
      const hHdr = parseFloat(document.getElementById('inp_h_hdr').value) || 25;
      // In original DXF: 8 tiers of headers + stretcher gaps = 275cm (~34.375cm per tier)
      document.getElementById('inp_H_cm').value = Math.min(400, Math.round(nTiers * (hHdr + 9.375)));
      renderAll();
    }

    function onHeightInput() {
      const hCm = parseFloat(document.getElementById('inp_H_cm').value) || 275;
      const hHdr = parseFloat(document.getElementById('inp_h_hdr').value) || 25;
      document.getElementById('inp_N_tiers').value = Math.max(3, Math.min(12, Math.round(hCm / (hHdr + 9.375))));
      renderAll();
    }

    function onBaseHeightChange() {
      const h1 = parseFloat(document.getElementById('inp_h1_cm').value) || 60;
      document.getElementById('inp_h3_cm').value = h1 + 30;
      renderAll();
    }

    function onHeaderLenChange() {
      const b1 = parseFloat(document.getElementById('inp_b1_cm').value) || 200;
      document.getElementById('inp_b2_cm').value = Math.max(80, b1 - 22);
      renderAll();
    }

    function onParamChange() {
      renderAll();
    }

    function resetToOrig() {
      Object.keys(ORIG_CRIB_WALL).forEach(k => {
        const el = document.getElementById('inp_' + k);
        if (el) el.value = ORIG_CRIB_WALL[k];
      });
      renderAll();
    }

    function switchView(view) {
      currentView = view;
      const specEl = document.getElementById('specPanel');
      const tabs = {
        ALL: document.getElementById('tab-all'),
        SECTION_PLAN_ELEV: document.getElementById('tab-sec'),
        HEADER_STRETCHER: document.getElementById('tab-det'),
        SPEC: document.getElementById('tab-spec')
      };
      Object.keys(tabs).forEach(k => {
        if (!tabs[k]) return;
        tabs[k].className = (k === view)
          ? 'px-3 py-1.5 rounded-md text-xs font-semibold transition-all bg-amber-600 text-white shadow'
          : 'px-3 py-1.5 rounded-md text-xs font-medium transition-all text-slate-400 hover:text-white';
      });
      if (view === 'SPEC') {
        specEl.classList.remove('hidden');
      } else {
        specEl.classList.add('hidden');
        fitViewToScreen();
      }
    }

    function toggleGhost() {
      showGhost = !showGhost;
      const btn = document.getElementById('btn-ghost');
      btn.className = showGhost
        ? 'px-2.5 py-1 rounded bg-amber-950/90 border border-amber-600/60 text-xs text-amber-300 flex items-center gap-1 transition'
        : 'px-2.5 py-1 rounded bg-slate-800 border border-slate-700 text-xs text-slate-400 flex items-center gap-1 transition';
      btn.innerHTML = showGhost
        ? '<span>📏</span> <span>原圖基準虛線: 開啟</span>'
        : '<span>📏</span> <span>原圖基準虛線: 關閉</span>';
      renderAll();
    }

    function toggleTheme() {
      isDarkTheme = !isDarkTheme;
      document.getElementById('theme-label').textContent = isDarkTheme ? '深色 CAD 藍圖' : '白底工程出圖';
      renderAll();
    }

    function fitViewToScreen() {
      const canvas = document.getElementById('cadCanvas');
      if (!canvas) return;
      const rect = canvas.parentElement.getBoundingClientRect();
      if (currentView === 'SECTION_PLAN_ELEV') {
        viewCam.scale = Math.min(rect.width / 1380, rect.height / 920) * 0.93;
        viewCam.offsetX = Math.max(20, (rect.width - 1300 * viewCam.scale) / 2);
        viewCam.offsetY = 16;
      } else if (currentView === 'HEADER_STRETCHER') {
        viewCam.scale = Math.min(rect.width / 1180, rect.height / 880) * 0.93;
        viewCam.offsetX = Math.max(20, (rect.width - 1100 * viewCam.scale) / 2);
        viewCam.offsetY = 16;
      } else {
        viewCam.scale = Math.min(rect.width / 1860, rect.height / 1080) * 0.94;
        viewCam.offsetX = Math.max(16, (rect.width - 1800 * viewCam.scale) / 2);
        viewCam.offsetY = 14;
      }
      renderAll();
    }

    function zoomByButton(factor) {
      const canvas = document.getElementById('cadCanvas');
      const rect = canvas.parentElement.getBoundingClientRect();
      const cx = rect.width / 2;
      const cy = rect.height / 2;
      const nextScale = Math.max(0.25, Math.min(3.5, viewCam.scale * factor));
      viewCam.offsetX = cx - (cx - viewCam.offsetX) * (nextScale / viewCam.scale);
      viewCam.offsetY = cy - (cy - viewCam.offsetY) * (nextScale / viewCam.scale);
      viewCam.scale = nextScale;
      renderAll();
    }

    function exportDXF() {
      renderAll();
      let dxf = '0\nSECTION\n2\nENTITIES\n';
      for (const e of dxfEntities) {
        if (e.type === 'LINE') {
          dxf += `0\nLINE\n8\n${e.layer || '0'}\n10\n${e.x1.toFixed(3)}\n20\n${e.y1.toFixed(3)}\n30\n0.0\n11\n${e.x2.toFixed(3)}\n21\n${e.y2.toFixed(3)}\n31\n0.0\n`;
        } else if (e.type === 'CIRCLE') {
          dxf += `0\nCIRCLE\n8\n${e.layer || '0'}\n10\n${e.cx.toFixed(3)}\n20\n${e.cy.toFixed(3)}\n30\n0.0\n40\n${e.r.toFixed(3)}\n`;
        } else if (e.type === 'TEXT') {
          dxf += `0\nTEXT\n8\n${e.layer || 'TEXT'}\n10\n${e.x.toFixed(3)}\n20\n${e.y.toFixed(3)}\n30\n0.0\n40\n${(e.size || 10).toFixed(2)}\n1\n${e.str}\n`;
        }
      }
      dxf += '0\nENDSEC\n0\nEOF\n';

      const blob = new Blob([dxf], { type: 'application/dxf;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const p = getParams();
      a.download = `混凝土格籠護岸標準圖_0416-1_${p.N_tiers}層_H${p.H_cm}cm_含補齊平立面.dxf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }

    function exportCSV() {
      const p = getParams();
      const rows = [
        [`混凝土格籠(框)護岸標準圖 (圖號 0416-1 / ${p.N_tiers}層丁條・H=${(p.H_cm/100).toFixed(2)}m) - 圖面標註數字顯式列式數量計算書`],
        ['工程項目名稱', '採用圖面標註數字之顯式計算式 (每公尺單側)', '每公尺數量', `全段數量(${p.L_tot_m}m)`, '單位'],
        [`預鑄混凝土丁條 (b1=${p.b1_cm}cm, b2=${p.b2_cm}cm, 25×25)`, `'${p.formula_hdr_cnt}`, p.q_hdr_cnt.toFixed(2), (p.q_hdr_cnt * p.L_tot_m).toFixed(0), '支'],
        [`預鑄丁條 210kgf/cm² 混凝土體積`, `'${p.formula_hdr_rc}`, p.q_hdr_rc.toFixed(2), (p.q_hdr_rc * p.L_tot_m).toFixed(2), 'M³'],
        [`預鑄混凝土順條 (b3=${p.b3_cm}cm, 20×20cm)`, `'${p.formula_str_cnt}`, p.q_str_cnt.toFixed(2), (p.q_str_cnt * p.L_tot_m).toFixed(0), '支'],
        [`預鑄順條 210kgf/cm² 混凝土體積`, `'${p.formula_str_rc}`, p.q_str_rc.toFixed(2), (p.q_str_rc * p.L_tot_m).toFixed(2), 'M³'],
        [`210kgf/cm² 場鑄混凝土基礎台 (B=${p.B_cm}, h1=${p.h1_cm})`, `'${p.formula_base_rc}`, p.q_base_rc.toFixed(2), (p.q_base_rc * p.L_tot_m).toFixed(2), 'M³'],
        ['格籠內填卵塊石及臨水面坡腳基礎保護塊石', `'${p.formula_cobble_vol}`, p.q_cobble_vol.toFixed(2), (p.q_cobble_vol * p.L_tot_m).toFixed(2), 'M³'],
        ['預鑄丁條/順條 #3 鋼筋與基礎台鋼筋總重', `'${p.formula_rebar}`, p.q_rebar_tot.toFixed(1), (p.q_rebar_tot * p.L_tot_m).toFixed(1), 'kg']
      ];

      const csvContent = '\uFEFF' + rows.map(r => r.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `混凝土格籠護岸顯式列式計算書_0416-1_${p.N_tiers}層.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }

    function initInteractions() {
      const canvas = document.getElementById('cadCanvas');
      if (!canvas) return;

      canvas.addEventListener('mousedown', (e) => {
        if (e.button !== 0) return;
        viewCam.isDragging = true;
        viewCam.dragStartX = e.clientX - viewCam.offsetX;
        viewCam.dragStartY = e.clientY - viewCam.offsetY;
      });

      window.addEventListener('mousemove', (e) => {
        if (!viewCam.isDragging) return;
        viewCam.offsetX = e.clientX - viewCam.dragStartX;
        viewCam.offsetY = e.clientY - viewCam.dragStartY;
        renderAll();
      });

      window.addEventListener('mouseup', () => {
        viewCam.isDragging = false;
      });

      canvas.addEventListener('wheel', (e) => {
        e.preventDefault();
        const rect = canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        const factor = e.deltaY < 0 ? 1.12 : 1 / 1.12;
        const nextScale = Math.max(0.25, Math.min(3.5, viewCam.scale * factor));
        viewCam.offsetX = mx - (mx - viewCam.offsetX) * (nextScale / viewCam.scale);
        viewCam.offsetY = my - (my - viewCam.offsetY) * (nextScale / viewCam.scale);
        viewCam.scale = nextScale;
        renderAll();
      }, { passive: false });

      window.addEventListener('resize', renderAll);
    }

    window.onload = function () {
      initInteractions();
      fitViewToScreen();
    };
  

  function cadLine(ctx, x1, y1, x2, y2, color, width, dash, layer) { O.push({ k: 'L', p: [[x1, -y1], [x2, -y2]], c: color, w: width || 1.3, d: dash || [], ly: layer || '0' }); }
  function cadPoly(ctx, pts, color, width, close, fill, dash, layer) { if (!pts || pts.length < 2) return; O.push({ k: 'P', p: pts.map(q => [q[0], -q[1]]), c: color, w: width || 1.5, f: fill || null, cl: close !== false, d: dash || [], ly: layer || '0' }); }
  function cadCircle(ctx, cx, cy, r, color, width, fill, dash, layer) { O.push({ k: 'C', x: cx, y: -cy, r, c: color, f: fill || null, w: width || 1.2, ly: layer || '0' }); }
  function cadText(ctx, str, x, y, size, color, align, weight, angleDeg, layer) { O.push({ k: 'T', x, y: -y, s: String(str), h: (size || 12) * 1.05, c: color || '#f8fafc', al: align || 'left', bl: 'middle', rot: -(angleDeg || 0) * Math.PI / 180, ly: layer || 'TEXT' }); }


  function __A(p) { let s = 0; for (let i = 0; i < p.length; i++) { const a = p[i], b = p[(i + 1) % p.length]; s += a[0] * b[1] - b[0] * a[1]; } return Math.abs(s) / 2; }
  const __n = (k, d) => { const v = parseFloat(RR ? RR[k] : undefined); return Number.isFinite(v) ? v : d; };
  function setInputs(R, keys) { keys.forEach(k => { if (R && R[k] !== undefined && R[k] !== null && R[k] !== '') el('inp_' + k).value = String(R[k]); else el('inp_' + k).value = ''; }); }
  function sheet(fn, s, m) { O = []; const PAL = getPalette(), p = Object.assign({}, m.p, m.OV); fn(p, PAL); const sc = 1 / s; return O.map(o => { const q = Object.assign({}, o); if (q.p) q.p = q.p.map(([x, y]) => [x * sc, y * sc]); if (q.x !== undefined) { q.x *= sc; q.y *= sc; } if (q.r) q.r *= sc; if (q.h) q.h *= sc; return q; }); }


  const KEYS = ['N_tiers', 'H_cm', 'df_cm', 'm_tilt', 'B_cm', 'B1_cm', 'h1_cm', 'h2_cm', 'h3_cm', 'b1_cm', 'b2_cm', 'b3_cm', 'h_hdr', 'h_str', 'N_bay', 'L_tot_m'];
  function model(R) {
    RR = R || {}; setInputs(R, KEYS);
    try {
      const p = getParams(); ['wLug', 'wFront', 'wKeyBot', 'wKeySlope', 'hBot', 'hNotch', 'hStrD', 'wCrest', 'kdf', 'kgHdr', 'kgStr', 'kgBase'].forEach(k => { p[k] = __n(k, { wLug: 25, wFront: 36, wKeyBot: 30, wKeySlope: 20, hBot: 20, hNotch: 5.5, hStrD: 19, wCrest: 38, kdf: 1, kgHdr: 8.2, kgStr: 7.8, kgBase: 10.88 }[k]); });
      const th = Math.atan(1 / p.m_tilt), cT = Math.cos(th), sT = Math.sin(th), X = (u, v) => [u * cT + v * sT, v * cT - u * sT], P = q => q.map(([u, v]) => X(u, v));
      const B = p.B_cm, h1 = p.h1_cm, h2 = p.h2_cm, hLug = Math.max(20, p.h3_cm - h1), uLugL = B - p.wLug;
      const base = [[0, 0], [uLugL, 0], [uLugL, hLug], [B, hLug], [B, -h1], [p.wKeyBot + p.wKeySlope, -h1], [p.wKeyBot, -(h1 + h2)], [0, -(h1 + h2)]];
      const pitch = (p.H_cm - p.hBot) / p.N_tiers, nib = (p.b1_cm - p.b2_cm) / 2, uHL = p.wFront - nib, uHR = uHL + p.b1_cm, uWL = uHL + nib, uWR = uHR - nib, wS = p.h_str, hS = p.hStrD;
      const strs = [], hdrs = [];
      for (let t = 0; t < p.N_tiers; t++) { const v0 = t * pitch, v1 = v0 + hS, vw0 = v1, vw1 = vw0 + (pitch - hS), vl0 = vw0 - p.hNotch, vl1 = vw1 + p.hNotch;
        strs.push([[uWL, v0], [uWL + wS, v0], [uWL + wS, v1], [uWL, v1]], [[uWR - wS, v0], [uWR, v0], [uWR, v1], [uWR - wS, v1]]);
        hdrs.push([[uHL, vl0], [uWL, vl0], [uWL, vw0], [uWR, vw0], [uWR, vl0], [uHR, vl0], [uHR, vl1], [uWR, vl1], [uWR, vw1], [uWL, vw1], [uWL, vl1], [uHL, vl1]]); }
      const vTop = p.N_tiers * pitch, vCap = vTop + hS; strs.push([[uWL, vTop], [uWL + wS, vTop], [uWL + wS, vCap], [uWL, vCap]]);
      const env = [[uHL, 0], [uHR, 0], [uHR, vTop], [uHL, vTop]];
      // 每公尺數量（全部依斷面幾何）：順條沿牆連續（每公尺體積＝斷面積）；丁條每 b3 一組（每公尺＝層數×斷面積×丁條寬÷b3）
      const As = strs.reduce((a, q) => a + __A(q), 0), Ah1 = __A(hdrs[0]), nS = strs.length, b3 = p.b3_cm;
      const Q = {}; Q.hdrCnt = p.N_tiers * 100 / b3; Q.hdrV = Q.hdrCnt * Ah1 * p.h_hdr / 1e6; Q.strCnt = nS * 100 / b3; Q.strV = As / 1e4; Q.base = __A(base) / 1e4;
      Q.cob = Math.max(0, (__A(env) * 100 - Q.hdrV * 1e6 - As * 100 + (__A(strs[nS - 1]) * 100)) / 1e6);   // 格籠外廓（丁條全長×層高範圍）扣丁條、順條（頂部壓頂順條不在外廓內）
      Q.rbP = Q.hdrCnt * p.kgHdr + Q.strCnt * p.kgStr; Q.rbB = B / 100 * p.kgBase; Q.rb = Q.rbP + Q.rbB;
      // 世界斷面（x 往岸側、z 向上；原點＝基礎前趾頂角）
      const zBot = X(0, -(h1 + h2))[1], zBed = zBot + p.df_cm, crest = X(uWL + wS, vCap), crestEnd = X(uHR + p.wCrest, vTop)[0];
      const front = [X(0, -(h1 + h2)), X(0, 0), X(uHL, 0), X(uHL, vTop), X(uWL, vTop), X(uWL, vCap), crest];
      let xBed = front[0][0]; for (let i = 1; i < front.length; i++) { const a = front[i - 1], b = front[i]; if ((a[1] - zBed) * (b[1] - zBed) <= 0 && Math.abs(b[1] - a[1]) > 1e-9) { xBed = a[0] + (zBed - a[1]) / (b[1] - a[1]) * (b[0] - a[0]); break; } }
      const f = (v, n) => (+v).toFixed(n === undefined ? 2 : n);
      const OV = { q_hdr_cnt: +Q.hdrCnt.toFixed(2), formula_hdr_cnt: `${p.N_tiers} 層 × 100 / 順條長 b3 ${b3} cm（每格一組丁條）`, q_hdr_rc: +Q.hdrV.toFixed(3), formula_hdr_rc: `${f(Q.hdrCnt)} 支/m × 圖面丁條斷面 ${f(Ah1, 0)} cm²（含兩端 ${f(nib, 1)} cm 凸榫、中段凹槽 ${p.hNotch}）× 寬 ${p.h_hdr} cm`,
        q_str_cnt: +Q.strCnt.toFixed(2), formula_str_cnt: `圖面每格 ${nS} 支（每層前後 2 支×${p.N_tiers} 層＋壓頂 1 支）× 100 / ${b3}`, q_str_rc: +Q.strV.toFixed(3), formula_str_rc: `順條沿牆連續：${nS} 支 × 斷面 ${wS}×${hS} cm ＝ ${f(As / 1e4, 4)} m²/m`,
        q_base_rc: +Q.base.toFixed(3), formula_base_rc: `圖面基礎台斷面量測 ${f(Q.base, 4)} m²（B ${B}、h1 ${h1}、止滑榫 ${p.wKeyBot}/${p.wKeySlope}×${h2}、後踵 ${p.wLug}×${f(hLug, 0)}）× 1.00 m`,
        q_cobble_vol: +Q.cob.toFixed(3), formula_cobble_vol: `格籠外廓 b1 ${f(p.b1_cm / 100)} × 籠高 ${f(vTop / 100)}（沿 1:${p.m_tilt} 斜量）－丁條 ${f(Q.hdrV, 3)}－順條 ${f((As - __A(strs[nS - 1])) / 1e4, 3)}`,
        q_rebar_precast: +Q.rbP.toFixed(1), q_rebar_base: +Q.rbB.toFixed(1), q_rebar_tot: +Q.rb.toFixed(1), formula_rebar: `丁條 ${f(Q.hdrCnt, 1)} 支×${p.kgHdr} kg＋順條 ${f(Q.strCnt, 1)} 支×${p.kgStr} kg＋基礎台 B ${f(B / 100)}×${p.kgBase} kg/m（依原圖配筋）` };
      return { p, OV, Q, th, X, P, base, strs, hdrs, env, zBot, zBed, xBed, crest, crestEnd, front, H: crest[1] - zBed, D: zBed - zBot, B, h1, h2, hLug, vTop, uHL, uHR };
    } finally { RR = null; }
  }
  function prims(m) { return sheet((p, PAL) => { const bSec = drawMainCrossSectionView(CTX, 30, 12, p, PAL), bPE = drawSynthesizedPlanAndElevationViews(CTX, bSec.rightX + 25, 12, p, PAL), bDet = drawHeaderAndStretcherDetails(CTX, bPE.rightX + 25, 12, p, PAL); drawExplicitFormulaTableOnCanvas(CTX, 45, Math.max(bSec.bottomY, bPE.bottomY, bDet.bottomY) + 45, p, PAL);
    const Q = m.Q, y = -6; cadText(CTX, `斷面量測（每公尺）：基礎台 ${Q.base.toFixed(3)} m²、順條 ${m.strs.length} 支/格、丁條斷面 ${(__A(m.hdrs[0])).toFixed(0)} cm²、格籠外廓 ${(__A(m.env) / 1e4).toFixed(3)} m²；鋼筋依原圖配筋（丁條 ${p.kgHdr}、順條 ${p.kgStr} kg/支）`, 45, y, 11.5, '#fde047', 'left', '600', 0, 'NOTE'); }, 0.88, m); }

  return { model, prims };
})();
TCO_T['hcell'] = (function () {

  let RR = null, O = [];
  const EL = {}, CTX = new Proxy({}, { get: (t, k) => (k in t ? t[k] : () => ({ width: 0 })), set: (t, k, v) => { t[k] = v; return true; } });
  const el = id => EL[id] || (EL[id] = { value: '', textContent: '', innerHTML: '', className: '', style: {}, classList: { add() {}, remove() {}, toggle() {} }, addEventListener() {}, getContext: () => CTX, parentElement: { getBoundingClientRect: () => ({ width: 100, height: 100 }) } });
  const document = { getElementById: el, querySelectorAll: () => [], querySelector: () => null, createElement: () => ({ click() {}, style: {} }), body: { appendChild() {}, removeChild() {}, classList: { add() {}, remove() {}, toggle() {}, contains: () => false } }, documentElement: { classList: { contains: () => false, add() {}, remove() {}, toggle() {} } }, addEventListener() {} };
  const window = { addEventListener() {}, devicePixelRatio: 1, matchMedia: () => ({ matches: false, addEventListener() {} }) };


    // =========================================================================
    // 1. ORIGINAL DXF BASELINE CONSTANTS & GLOBAL STATE (PURE ASCII IDENTIFIERS)
    // =========================================================================
    const ORIG_EXPANDED_GEOCELL = {
      n_slope: 2.5,
      H_slope: 180,
      D_cell: 10,
      W_cell: 20,
      W_top: 100,
      H_cov: 40,
      W_toe_lap: 80,
      sub_ratio: 45,
      S_pin_slope: 80,
      S_pin_long: 100,
      S_tendon: 73.2,
      L_pin: 60,
      d_pin: 13,
      N_cell_pin: 5,
      B_fdn: 140,
      H_fdn: 140,
      L_draw_cm: 400,
      L_tot_m: 30.0
    };

    let currentView = 'ALL'; // 'ALL', 'SECTION_PLAN_ELEV', 'ISO_DETAILS', 'SPEC'
    let showGhost = false;
    let isDarkTheme = true;

    let viewCam = {
      scale: 0.63,
      offsetX: 22,
      offsetY: 14,
      isDragging: false,
      dragStartX: 0,
      dragStartY: 0
    };

    let dxfEntities = [];

    // =========================================================================
    // 2. PARAMETER READER & EXPLICIT FIGURE-NUMBER FORMULA ENGINE
    // =========================================================================
    function getParams() {
      const num = (id, def) => {
        const el = document.getElementById(id);
        if (!el) return def;
        const v = parseFloat(el.value);
        return isNaN(v) ? def : v;
      };

      const p = {
        n_slope: Math.max(1.0, num('inp_n_slope', 2.5)),
        H_slope: Math.max(80, num('inp_H_slope', 180)),
        D_cell: Math.max(5, num('inp_D_cell', 10)),
        W_cell: Math.max(12, num('inp_W_cell', 20)),
        W_top: Math.max(100, num('inp_W_top', 100)),
        H_cov: Math.max(30, Math.min(50, num('inp_H_cov', 40))),
        W_toe_lap: Math.max(40, num('inp_W_toe_lap', 80)),
        sub_ratio: Math.max(20, Math.min(80, num('inp_sub_ratio', 45))),
        S_pin_slope: Math.max(40, num('inp_S_pin_slope', 80)),
        S_pin_long: Math.max(50, num('inp_S_pin_long', 100)),
        S_tendon: Math.max(30, num('inp_S_tendon', 73.2)),
        L_pin: Math.max(30, num('inp_L_pin', 60)),
        d_pin: Math.max(10, num('inp_d_pin', 13)),
        N_cell_pin: Math.max(2, Math.round(num('inp_N_cell_pin', 5))),
        B_fdn: Math.max(80, num('inp_B_fdn', 140)),
        H_fdn: Math.max(80, num('inp_H_fdn', 140)),
        L_draw_cm: Math.max(200, num('inp_L_draw_cm', 400)),
        L_tot_m: Math.max(2.0, num('inp_L_tot_m', 30.0))
      };

      // Derived Slope & Expanded Geocell Geometry:
      p.W_slope_horiz = Math.round(p.H_slope * p.n_slope); // 180 * 2.5 = 450 cm
      p.L_slope_cm = Math.round(Math.hypot(p.H_slope, p.W_slope_horiz)); // sqrt(180^2 + 450^2) = 485 cm
      p.L_net_cm = p.W_toe_lap + p.L_slope_cm + p.W_top; // 80 + 485 + 100 = 665 cm

      const L_slope_m = +(p.L_slope_cm / 100).toFixed(2);
      const W_top_m = +(p.W_top / 100).toFixed(2);
      const W_toe_m = +(p.W_toe_lap / 100).toFixed(2);
      const L_net_m = +(p.L_net_cm / 100).toFixed(2);
      const D_cell_m = +(p.D_cell / 100).toFixed(2);
      const H_cov_m = +(p.H_cov / 100).toFixed(2);
      const B_fdn_m = +(p.B_fdn / 100).toFixed(2);
      const H_fdn_m = +(p.H_fdn / 100).toFixed(2);

      // 1. 展開式蜂巢圍束網格 (深度10cm) 鋪設面積 (M²/m):
      p.q_geocell_area = +(L_net_m * 1.0).toFixed(2);
      p.formula_geocell_area = `[坡底折入(${W_toe_m}m) + 斜坡長√(${(p.H_slope/100).toFixed(2)}²+${(p.W_slope_horiz/100).toFixed(2)}²=${L_slope_m}m) + 坡頂(${W_top_m}m)] * 1.00m`;

      // 2. J-型錨釘 (Φ13mm, L=60cm, 斜坡間距80cm, 縱向間距100cm):
      p.nPinsAlongSlope = Math.floor(p.L_slope_cm / p.S_pin_slope) + 1; // floor(485/80)+1 = 7 支
      p.nPinsPerRow = p.nPinsAlongSlope + 2; // +1 toe anchor + 1 top anchor = 9 支/排
      p.q_pin_cnt = +(p.nPinsPerRow * (100 / p.S_pin_long)).toFixed(2);
      p.formula_pin_cnt = `[斜坡(${p.L_slope_cm}/${p.S_pin_slope}+1=${p.nPinsAlongSlope}支) + 坡頂/坡底2支] * (100cm / 縱向間距${p.S_pin_long}cm)`;

      // 3. 高強力聚酯腱線 (每隔73.2cm設置一條):
      p.q_tendon_len = +((100 / p.S_tendon) * L_net_m).toFixed(2);
      p.formula_tendon_len = `(100cm / 腱線間距${p.S_tendon}cm) * 網格展開總長${L_net_m.toFixed(2)}m`;

      // 4. 設計水位以下：單尺寸碎石(粒徑約5cm)或混凝土填充蜂巢網格 (M³/m):
      const subSlopeLen_m = +((p.sub_ratio / 100) * L_slope_m + W_toe_m).toFixed(2);
      p.q_sub_gravel = +(subSlopeLen_m * D_cell_m * 1.0).toFixed(2);
      p.formula_sub_gravel = `[浸水段斜長(${p.sub_ratio}%*${L_slope_m}m) + 坡底折入${W_toe_m}m = ${subSlopeLen_m}m] * 蜂巢深${D_cell_m.toFixed(2)}m * 1.00m`;

      // 5. 設計水位以上：表土填充並以草皮覆蓋(或植栽草種) + 坡頂30~50cm覆土植生區 (M³/m & M²/m):
      const expSlopeLen_m = +(((100 - p.sub_ratio) / 100) * L_slope_m + W_top_m).toFixed(2);
      p.q_grass_area = +(expSlopeLen_m * 1.0).toFixed(2);
      p.formula_grass_area = `[出水段斜長(${100-p.sub_ratio}%*${L_slope_m}m) + 坡頂平段${W_top_m}m] * 1.00m`;

      const topTrenchVol = +(0.5 * (W_top_m + W_top_m * 1.6) * H_cov_m).toFixed(2);
      p.q_topsoil_vol = +(expSlopeLen_m * D_cell_m + topTrenchVol).toFixed(2);
      p.formula_topsoil_vol = `[網格內表土(${expSlopeLen_m}m * 深${D_cell_m.toFixed(2)}m)] + [坡頂錨固溝覆土(${W_top_m}m * 高${H_cov_m.toFixed(2)}m * 1.3)]`;

      // 6. 混凝土基礎台 (140×140cm) 210kgf/cm² 混凝土 & 臨水坡面嵌石/坡腳拋塊石:
      const notchRecess = +(W_toe_m * (D_cell_m + 0.08)).toFixed(2);
      p.q_fdn_conc = Math.max(0.5, +(B_fdn_m * H_fdn_m - notchRecess - 0.14).toFixed(2));
      p.formula_fdn_conc = `[基礎台外廓(${B_fdn_m.toFixed(2)}m * ${H_fdn_m.toFixed(2)}m) - 錨固槽(${W_toe_m}m*0.18m) - 臨水嵌石0.14] * 1.00m`;

      p.q_riprap_vol = +(0.38 + 0.14).toFixed(2);
      p.formula_riprap_vol = `[基礎台臨水面嵌塊石(0.14M³) + 坡腳上方保護塊石(0.38M³)] * 1.00m`;

      return p;
    }

    // =========================================================================
    // 3. CAD PRIMITIVES & DXF RECORDING ENGINE
    // =========================================================================
    function getPalette() {
      if (isDarkTheme) {
        return {
          bg: '#0b1120',
          primaryLine: '#f8fafc',
          secondaryLine: '#94a3b8',
          geocellLine: '#facc15',
          geocellFill: 'rgba(250, 204, 21, 0.16)',
          tendonLine: '#e879f9',
          pinLine: '#f43f5e',
          fdnLine: '#e2e8f0',
          fdnFill: 'rgba(56, 189, 248, 0.14)',
          stoneLine: '#fb923c',
          stoneFill: 'rgba(249, 115, 22, 0.22)',
          sandHatch: '#a855f7',
          plantLine: '#4ade80',
          waterLine: '#38bdf8',
          dimLine: '#22d3ee',
          dimText: '#67e8f9',
          leaderLine: '#38bdf8',
          textMain: '#f8fafc',
          textSub: '#cbd5e1',
          titleCyan: '#22d3ee',
          ghostLine: 'rgba(244, 63, 94, 0.40)',
          tableBorder: '#64748b',
          tableHeaderBg: 'rgba(30, 41, 59, 0.90)'
        };
      } else {
        return {
          bg: '#ffffff',
          primaryLine: '#0f172a',
          secondaryLine: '#475569',
          geocellLine: '#854d0e',
          geocellFill: 'rgba(250, 204, 21, 0.24)',
          tendonLine: '#a21caf',
          pinLine: '#e11d48',
          fdnLine: '#0f172a',
          fdnFill: 'rgba(2, 132, 199, 0.15)',
          stoneLine: '#c2410c',
          stoneFill: 'rgba(253, 186, 116, 0.35)',
          sandHatch: '#7e22ce',
          plantLine: '#15803d',
          waterLine: '#0284c7',
          dimLine: '#0284c7',
          dimText: '#0f172a',
          leaderLine: '#0369a1',
          textMain: '#0f172a',
          textSub: '#334155',
          titleCyan: '#0369a1',
          ghostLine: 'rgba(225, 29, 72, 0.40)',
          tableBorder: '#1e293b',
          tableHeaderBg: 'rgba(241, 245, 249, 0.95)'
        };
      }
    }

    function cadLine(ctx, x1, y1, x2, y2, color, width = 1.35, dash = [], layer = '0') {
      ctx.save();
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.setLineDash(dash);
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      ctx.restore();
      dxfEntities.push({ type: 'LINE', x1, y1: -y1, x2, y2: -y2, layer });
    }

    function cadPoly(ctx, pts, color, width = 1.45, close = true, fill = null, dash = [], layer = '0') {
      if (!pts || pts.length < 2) return;
      ctx.save();
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.setLineDash(dash);
      ctx.beginPath();
      ctx.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < pts.length; i++) {
        ctx.lineTo(pts[i][0], pts[i][1]);
      }
      if (close) ctx.closePath();
      if (fill) {
        ctx.fillStyle = fill;
        ctx.fill();
      }
      ctx.stroke();
      ctx.restore();

      for (let i = 0; i < pts.length - 1; i++) {
        dxfEntities.push({
          type: 'LINE',
          x1: pts[i][0], y1: -pts[i][1],
          x2: pts[i + 1][0], y2: -pts[i + 1][1],
          layer
        });
      }
      if (close) {
        const last = pts[pts.length - 1];
        dxfEntities.push({
          type: 'LINE',
          x1: last[0], y1: -last[1],
          x2: pts[0][0], y2: -pts[0][1],
          layer
        });
      }
    }

    function cadCircle(ctx, cx, cy, r, color, width = 1.3, fill = null, dash = [], layer = '0') {
      ctx.save();
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.setLineDash(dash);
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      if (fill) {
        ctx.fillStyle = fill;
        ctx.fill();
      }
      ctx.stroke();
      ctx.restore();
      dxfEntities.push({ type: 'CIRCLE', cx, cy: -cy, r, layer });
    }

    function cadText(ctx, str, x, y, size = 12, color = '#f8fafc', align = 'left', weight = 'normal', angleDeg = 0, layer = 'TEXT') {
      ctx.save();
      ctx.translate(x, y);
      if (angleDeg !== 0) ctx.rotate((angleDeg * Math.PI) / 180);
      ctx.font = `${weight} ${size}px "Inter", "Microsoft JhengHei", serif`;
      ctx.fillStyle = color;
      ctx.textAlign = align;
      ctx.textBaseline = 'middle';
      ctx.fillText(str, 0, 0);
      ctx.restore();
      dxfEntities.push({ type: 'TEXT', str: String(str), x, y: -y, size: size * 0.75, layer });
    }

    function cadLeaderDot(ctx, tx, ty, kx, ky, ex, ey, lines, pal, useDot = true, fontSize = 11.2) {
      cadLine(ctx, tx, ty, kx, ky, pal.leaderLine, 1.15, [], 'LEADER');
      cadLine(ctx, kx, ky, ex, ey, pal.leaderLine, 1.15, [], 'LEADER');

      if (useDot) {
        cadCircle(ctx, tx, ty, 2.3, pal.leaderLine, 1.0, pal.leaderLine, [], 'LEADER_DOT');
      } else {
        const dx = tx - kx, dy = ty - ky;
        const L = Math.hypot(dx, dy) || 1;
        const ux = dx / L, uy = dy / L;
        const nx = -uy, ny = ux;
        ctx.save();
        ctx.fillStyle = pal.leaderLine;
        ctx.beginPath();
        ctx.moveTo(tx, ty);
        ctx.lineTo(tx - ux * 7 + nx * 2.3, ty - uy * 7 + ny * 2.3);
        ctx.lineTo(tx - ux * 7 - nx * 2.3, ty - uy * 7 - ny * 2.3);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }

      const align = ex >= kx ? 'left' : 'right';
      const pad = ex >= kx ? 5 : -5;
      const arr = Array.isArray(lines) ? lines : [lines];
      arr.forEach((ln, idx) => {
        const yOff = (idx - (arr.length - 1) / 2) * (fontSize + 4);
        cadText(ctx, ln, ex + pad, ey + yOff, fontSize, pal.titleCyan, align, '600', 0, 'TEXT');
      });
    }

    function cadDim(ctx, x1, y1, x2, y2, offset, labelStr, pal, fontSize = 11.2) {
      const dx = x2 - x1, dy = y2 - y1;
      const L = Math.hypot(dx, dy);
      if (L < 1e-3) return;
      const ux = dx / L, uy = dy / L;
      const sign = offset >= 0 ? 1 : -1;
      const nx = -uy * sign, ny = ux * sign;
      const absOff = Math.abs(offset);
      const gap = 4.5;
      const extOver = 5;

      const sx1 = x1 + nx * gap, sy1 = y1 + ny * gap;
      const ex1 = x1 + nx * (absOff + extOver), ey1 = y1 + ny * (absOff + extOver);
      const sx2 = x2 + nx * gap, sy2 = y2 + ny * gap;
      const ex2 = x2 + nx * (absOff + extOver), ey2 = y2 + ny * (absOff + extOver);

      const dx1 = x1 + nx * absOff, dy1 = y1 + ny * absOff;
      const dx2 = x2 + nx * absOff, dy2 = y2 + ny * absOff;

      if (absOff > 3) {
        cadLine(ctx, sx1, sy1, ex1, ey1, pal.dimLine, 0.95, [], 'DIM');
        cadLine(ctx, sx2, sy2, ex2, ey2, pal.dimLine, 0.95, [], 'DIM');
      }

      const mx = (dx1 + dx2) / 2, my = (dy1 + dy2) / 2;
      const textGap = Math.max(String(labelStr).length * fontSize * 0.62 + 8, 20);

      if (L > textGap + 12) {
        cadLine(ctx, dx1, dy1, mx - ux * (textGap / 2), my - uy * (textGap / 2), pal.dimLine, 1.05, [], 'DIM');
        cadLine(ctx, mx + ux * (textGap / 2), my + uy * (textGap / 2), dx2, dy2, pal.dimLine, 1.05, [], 'DIM');
      } else {
        cadLine(ctx, dx1, dy1, dx2, dy2, pal.dimLine, 1.05, [], 'DIM');
      }

      const aL = Math.min(5.8, L * 0.25), aW = 1.85;
      ctx.save();
      ctx.fillStyle = pal.dimLine;
      ctx.beginPath();
      ctx.moveTo(dx1, dy1);
      ctx.lineTo(dx1 + ux * aL + nx * aW, dy1 + uy * aL + ny * aW);
      ctx.lineTo(dx1 + ux * aL - nx * aW, dy1 + uy * aL - ny * aW);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(dx2, dy2);
      ctx.lineTo(dx2 - ux * aL + nx * aW, dy2 - uy * aL + ny * aW);
      ctx.lineTo(dx2 - ux * aL - nx * aW, dy2 - uy * aL - ny * aW);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      let angle = (Math.atan2(dy, dx) * 180) / Math.PI;
      if (angle > 90) angle -= 180;
      if (angle < -90) angle += 180;
      cadText(ctx, labelStr, mx, my - 2, fontSize, pal.dimText, 'center', '600', angle, 'DIM_TEXT');
    }

    function drawCobbleStone(ctx, cx, cy, rx, ry, seed, pal, layer = 'STONE') {
      const nV = 7;
      const pts = [];
      for (let i = 0; i < nV; i++) {
        const a = (i / nV) * Math.PI * 2;
        const jit = 0.85 + 0.18 * Math.sin(seed * 3.1 + i * 2.3);
        pts.push([cx + Math.cos(a) * rx * jit, cy + Math.sin(a) * ry * jit]);
      }
      cadPoly(ctx, pts, pal.stoneLine, 1.05, true, pal.stoneFill, [], layer);
    }

    function drawPlantTuft(ctx, x, y, scale, pal) {
      const s = scale;
      cadPoly(ctx, [[x, y], [x - 5 * s, y - 9 * s], [x - 2 * s, y - 4 * s]], pal.plantLine, 1.05, false, null, [], 'PLANT');
      cadPoly(ctx, [[x, y], [x - 1 * s, y - 13 * s], [x + 1.5 * s, y - 5 * s]], pal.plantLine, 1.05, false, null, [], 'PLANT');
      cadPoly(ctx, [[x, y], [x + 5 * s, y - 10 * s], [x + 2 * s, y - 3 * s]], pal.plantLine, 1.05, false, null, [], 'PLANT');
    }

    // =========================================================================
    // 4. VIEW 1: 斷面圖 (MAIN CROSS-SECTION VIEW OF EXPANDED GEOCELL SLOPE REVETMENT)
    //    100% Faithful to DXF Model Space (X ≈ 2263..2347, Y ≈ 1435..1480):
    //    - Natural irregular hillside terrain lines above top trench are 100% STRIPPED!
    //    - Concrete Foundation Base (混凝土基礎台) at bottom-left with embedded boulders along left face
    //    - Expanded Geocell Blanket (depth 10cm, double yellow lines + magenta tendon & cell dividers):
    //      * Toe horizontal anchorage segment (W_toe_lap = 80cm) embedded inside foundation notch
    //      * Sloped segment rising at 1 : n_slope (緩於 1:1, default 1:2.5)
    //      * Top horizontal anchorage segment (至少 100cm) buried under 30~50cm topsoil & grass/stone cover
    //    - J-Shaped Anchor Pins (J-型錨釘, spaced every 80cm along slope) perpendicular to slope
    //    - Toe Riprap Boulders on top of foundation toe & Design Water Level ▽ (525C..525F)
    // =========================================================================
    function drawMainCrossSectionView(ctx, ox, topY, p, pal) {
      const s = 0.85; // 1 cm = 0.85 px

      const B_fdn = p.B_fdn * s;         // 140 * s
      const H_fdn = p.H_fdn * s;         // 140 * s
      const W_toe = p.W_toe_lap * s;     // 80 * s
      const D_cell = p.D_cell * s;       // 10 * s (visual thickness amplified slightly to 14px for crisp CAD legibility)
      const hMat = Math.max(13, D_cell * 1.35);

      const H_slope = p.H_slope * s;     // 180 * s
      const W_slope = p.W_slope_horiz * s; // 450 * s
      const W_top = p.W_top * s;         // 100 * s
      const H_cov = p.H_cov * s;         // 40 * s (30~50cm)

      // Coordinate Anchors:
      // Let (xKneeBot, yKneeBot) be the bottom inflection point where horizontal toe meets 1:n slope
      const xKneeBot = ox + 175;
      const yKneeBot = topY + H_slope + H_cov + 85;

      const xToeLeft = xKneeBot - W_toe;
      const yToeTop = yKneeBot - hMat;

      const xTopKnee = xKneeBot + W_slope;
      const yTopKnee = yKneeBot - H_slope;

      const xTopEnd = xTopKnee + W_top;
      const yTopEnd = yTopKnee;

      // Slope unit vectors
      const L_slope_px = Math.hypot(W_slope, H_slope);
      const ux = W_slope / L_slope_px;
      const uy = -H_slope / L_slope_px; // up-right
      const nx = uy;                    // upward-left normal: (-H_slope/L, -W_slope/L)
      const ny = -ux;

      // 0. Ghost Baseline (Original 1:2.5 Slope & Foundation)
      if (showGhost) {
        const gW_slope = 450 * s, gH_slope = 180 * s;
        cadPoly(ctx, [
          [xKneeBot - 80 * s, yKneeBot],
          [xKneeBot, yKneeBot],
          [xKneeBot + gW_slope, yKneeBot - gH_slope],
          [xKneeBot + gW_slope + 100 * s, yKneeBot - gH_slope]
        ], pal.ghostLine, 1.15, false, null, [4, 4], 'GHOST_SLOPE');
      }

      // =====================================================================
      // 1. CONCRETE FOUNDATION BASE (混凝土基礎台, matching DXF 4E6B & 4E7A)
      //    Spans from xFdnLeft to xKneeBot, and from yFdnTop down to yFdnBot
      // =====================================================================
      const xFdnLeft = xKneeBot - B_fdn;
      const yFdnBot = yKneeBot + (H_fdn - 32 * s);
      const yFdnTop = yToeTop - 16 * s;

      const fdnPts = [
        [xFdnLeft, yFdnBot],
        [xKneeBot, yFdnBot],
        [xKneeBot, yKneeBot],
        [xToeLeft, yKneeBot],
        [xToeLeft, yToeTop],
        [xKneeBot, yToeTop],
        [xKneeBot, yFdnTop],
        [xFdnLeft + 38 * s, yFdnTop - 3 * s],
        [xFdnLeft + 8 * s, yToeTop + 15 * s]
      ];
      cadPoly(ctx, fdnPts, pal.fdnLine, 1.55, true, pal.fdnFill, [], 'CONC_FOUNDATION');

      // Concrete Stipple (AR-CONC triangles & dots inside foundation base)
      for (let fx = xFdnLeft + 18; fx < xKneeBot - 10; fx += 20) {
        for (let fy = yKneeBot + 10; fy < yFdnBot - 8; fy += 18) {
          cadPoly(ctx, [[fx, fy], [fx + 3.5, fy - 2.5], [fx + 2, fy + 2.5]], pal.secondaryLine, 0.75, true, null, [], 'AR_CONC');
          cadCircle(ctx, fx + 7, fy - 1, 0.7, pal.secondaryLine, 0.7, pal.secondaryLine);
        }
      }

      // Embedded Boulders along the left battered face of the Concrete Foundation Base (matching DXF 4E4D..4E6A)
      const nFdnStones = 8;
      for (let i = 0; i < nFdnStones; i++) {
        const frac = (i + 0.5) / nFdnStones;
        const sx = xFdnLeft + frac * 34 * s;
        const sy = yFdnBot - frac * (yFdnBot - yFdnTop);
        drawCobbleStone(ctx, sx, sy, 13 * s, 9.5 * s, i * 11 + 3, pal, 'FDN_FACE_STONE');
        drawCobbleStone(ctx, sx, sy, 8.5 * s, 6.0 * s, i * 11 + 7, pal, 'FDN_FACE_STONE_IN');
      }

      // Left Stream Bed Cross-Hatched Pad (matching DXF 5240..5250)
      const xBedLeft = xFdnLeft - 38 * s;
      const yBedPadTop = yFdnTop + 4 * s;
      const yBedPadBot = yBedPadTop + 11 * s;
      cadPoly(ctx, [
        [xBedLeft, yBedPadTop],
        [xFdnLeft + 14 * s, yBedPadTop],
        [xFdnLeft + 14 * s, yBedPadBot],
        [xBedLeft, yBedPadBot]
      ], pal.secondaryLine, 1.15, true, 'rgba(30, 41, 59, 0.65)', [], 'STREAMBED_PAD');
      for (let hx = xBedLeft + 5; hx < xFdnLeft + 10 * s; hx += 8) {
        cadLine(ctx, hx, yBedPadTop, hx - 5, yBedPadBot, pal.secondaryLine, 0.8);
        cadLine(ctx, hx - 5, yBedPadTop, hx, yBedPadBot, pal.secondaryLine, 0.8);
      }

      // =====================================================================
      // 2. EXPANDED GEOCELL BLANKET (展開式蜂巢圍束網格, 深度10cm, 4E7B..4EDF)
      //    Continuous Z-shaped band: Toe Lap (W_toe) -> 1:n Slope -> Top Crest (W_top)
      // =====================================================================
      const xKneeTop = xKneeBot + nx * hMat;
      const yKneeTop = yKneeBot + ny * hMat;
      const xTopKneeUp = xTopKnee + nx * hMat;
      const yTopKneeUp = yTopKnee + ny * hMat;

      // Outer yellow structural boundary of the expanded geocell blanket
      const geocellOuterPts = [
        [xToeLeft, yToeTop],
        [xKneeBot - 2, yToeTop],
        [xTopKnee, yTopKnee - hMat],
        [xTopEnd, yTopEnd - hMat],
        [xTopEnd, yTopEnd],
        [xTopKnee, yTopKnee],
        [xKneeBot, yKneeBot],
        [xToeLeft, yKneeBot]
      ];
      cadPoly(ctx, geocellOuterPts, pal.geocellLine, 1.65, true, pal.geocellFill, [], 'GEOCELL_BLANKET');

      // Internal Magenta Tendon Lines (腱線 4E85, 4E86) & Cell Wall Dividers (4E90..4EDF)
      const yTendon1 = yKneeBot - hMat * 0.28;
      const yTendon2 = yKneeBot - hMat * 0.72;
      cadPoly(ctx, [
        [xToeLeft + 4, yTendon1],
        [xKneeBot, yTendon1],
        [xTopKnee, yTopKnee - hMat * 0.28],
        [xTopEnd - 4, yTopEnd - hMat * 0.28]
      ], pal.tendonLine, 1.1, false, null, [], 'TENDON_LINE_1');

      cadPoly(ctx, [
        [xToeLeft + 4, yTendon2],
        [xKneeBot, yTendon2],
        [xTopKnee, yTopKnee - hMat * 0.72],
        [xTopEnd - 4, yTopEnd - hMat * 0.72]
      ], pal.tendonLine, 1.1, false, null, [], 'TENDON_LINE_2');

      // Cell dividers along Toe Lap
      const cellW_px = Math.max(12, p.W_cell * s);
      for (let cx = xToeLeft + cellW_px; cx < xKneeBot - 4; cx += cellW_px) {
        cadLine(ctx, cx, yToeTop + 2, cx, yKneeBot - 2, pal.tendonLine, 1.0, [], 'CELL_DIV_TOE');
      }
      // Cell dividers along 1:n Slope
      const nSlopeCells = Math.max(8, Math.round(p.L_slope_cm / p.W_cell));
      for (let i = 1; i < nSlopeCells; i++) {
        const frac = i / nSlopeCells;
        const bx = xKneeBot + frac * W_slope;
        const by = yKneeBot - frac * H_slope;
        cadLine(ctx, bx, by - 1, bx, by - hMat + 1, pal.tendonLine, 1.0, [], 'CELL_DIV_SLOPE');
      }
      // Cell dividers along Top Crest
      for (let cx = xTopKnee + cellW_px; cx < xTopEnd - 4; cx += cellW_px) {
        cadLine(ctx, cx, yTopEnd - hMat + 2, cx, yTopEnd - 2, pal.tendonLine, 1.0, [], 'CELL_DIV_TOP');
      }

      // =====================================================================
      // 3. J-SHAPED ANCHOR PINS (J-型錨釘, spaced every S_pin_slope = 80cm, 4F16..4F24)
      // =====================================================================
      const L_pin_px = p.L_pin * s * 0.85;
      // Normal into the soil bank (down-right perpendicular to slope): (-nx, -ny) = (H_slope/L, W_slope/L)
      const dxPin = -nx * L_pin_px;
      const dyPin = -ny * L_pin_px;

      let pinPositions = [];
      const nPins = p.nPinsAlongSlope;
      for (let i = 0; i < nPins; i++) {
        const dAlong = (18 * s) + i * (p.S_pin_slope * s);
        if (dAlong < L_slope_px - 8 * s) {
          const px0 = xKneeBot + ux * dAlong;
          const py0 = yKneeBot + uy * dAlong - hMat * 0.75;
          const px1 = px0 + dxPin;
          const py1 = py0 + dyPin;
          pinPositions.push({ x0: px0, y0: py0, x1: px1, y1: py1 });
          // Draw J-Anchor Pin shaft + top J-hook
          cadLine(ctx, px0, py0, px1, py1, pal.pinLine, 1.75, [], 'J_ANCHOR_PIN');
          cadPoly(ctx, [
            [px0, py0],
            [px0 + ux * 4 - nx * 2, py0 + uy * 4 - ny * 2],
            [px0 + ux * 5 + nx * 3, py0 + uy * 5 + ny * 3]
          ], pal.pinLine, 1.5, false, null, [], 'J_HOOK');
        }
      }

      // =====================================================================
      // 4. TOE RIPRAP PROTECTION BOULDERS (坡腳拋塊石, 4EF7..5229) & TOP TRENCH (30~50cm, 4EE0..4EF1)
      // =====================================================================
      // Cluster of Riprap Boulders resting on the foundation top & lower geocell knee
      const nRipStones = 11;
      for (let i = 0; i < nRipStones; i++) {
        const frac = i / (nRipStones - 1);
        const rx = (xToeLeft - 10 * s) + frac * (W_toe + 85 * s);
        const ryBase = (rx < xKneeBot)
          ? yToeTop - 5 * s
          : (yKneeBot - hMat - ((rx - xKneeBot) / W_slope) * H_slope - 5 * s);
        const rowOff = (i % 2 === 1) ? -8 * s : 0;
        drawCobbleStone(ctx, rx, ryBase + rowOff, 9.5 * s, 6.5 * s, i * 17 + 5, pal, 'TOE_RIPRAP');
      }

      // Top Anchorage Trench (30~50cm deep, filled with topsoil/stones & topped with plants, 4EE0..4EF6)
      const xTrenchEnd = xTopEnd + 75 * s;
      const yTrenchSurface = yTopEnd - H_cov;
      cadPoly(ctx, [
        [xTopKnee, yTopKnee - hMat],
        [xTopEnd + 22 * s, yTrenchSurface],
        [xTrenchEnd, yTrenchSurface],
        [xTrenchEnd, yTopEnd],
        [xTopKnee, yTopKnee]
      ], pal.primaryLine, 1.35, true, 'rgba(168, 85, 247, 0.12)', [], 'TOP_ANCHOR_TRENCH');

      // AR-SAND stipple inside Top Anchorage Trench & Subgrade Soil Wedge (67BF)
      for (let sx = xTopKnee + 18; sx < xTrenchEnd - 8; sx += 14) {
        for (let sy = yTrenchSurface + 6; sy < yTopEnd - hMat - 3; sy += 11) {
          cadCircle(ctx, sx, sy, 0.85, pal.sandHatch, 0.8, pal.sandHatch);
        }
      }

      // Row of Bush/Grass Plants along Top Anchorage Trench surface (4EE1..4EF1)
      for (let px = xTopKnee + 14; px < xTrenchEnd - 8; px += 19) {
        const py = (px < xTopEnd + 22 * s)
          ? (yTopKnee - hMat - ((px - xTopKnee) / (W_top + 22 * s)) * (H_cov - hMat))
          : yTrenchSurface;
        drawPlantTuft(ctx, px, py, 0.92, pal);
      }

      // Subgrade Soil Wedge below the sloped geocell blanket (matching DXF hatch 67BF & break line 4EF4)
      const ySubBot = yFdnBot;
      cadPoly(ctx, [
        [xKneeBot, yKneeBot],
        [xTopKnee, yTopKnee],
        [xTopEnd, yTopEnd],
        [xTrenchEnd, yTopEnd],
        [xTrenchEnd, ySubBot],
        [xKneeBot, ySubBot]
      ], pal.secondaryLine, 1.1, false, 'rgba(148, 163, 184, 0.06)', [5, 4], 'SUBGRADE_SOIL');

      // Right Vertical Z-Break Line on Cross-Section (matching DXF 4EF4)
      const ymBrk = (yTrenchSurface + ySubBot) / 2;
      cadPoly(ctx, [
        [xTrenchEnd, yTrenchSurface - 8],
        [xTrenchEnd, ymBrk - 6],
        [xTrenchEnd - 6, ymBrk - 2],
        [xTrenchEnd + 6, ymBrk + 2],
        [xTrenchEnd, ymBrk + 6],
        [xTrenchEnd, ySubBot + 8]
      ], pal.dimLine, 1.2, false, null, [], 'SEC_RIGHT_BREAK');

      // =====================================================================
      // 5. DESIGN WATER LEVEL ▽ (設計水位線, matching DXF 525C..525F)
      // =====================================================================
      const yWater = yKneeBot - H_slope * (p.sub_ratio / 100);
      const xWaterRight = xKneeBot + W_slope * (p.sub_ratio / 100) - 8;
      const xWaterLeft = xBedLeft - 10;
      cadLine(ctx, xWaterLeft, yWater, xWaterRight, yWater, pal.waterLine, 1.5, [], 'WATER_LEVEL');
      const wx = xWaterLeft + 38;
      cadPoly(ctx, [[wx - 6, yWater - 9], [wx + 6, yWater - 9], [wx, yWater]], pal.waterLine, 1.25, true, null, [], 'WATER_TRI');
      cadLine(ctx, wx - 8, yWater + 3.5, wx + 8, yWater + 3.5, pal.waterLine, 1.0);
      cadLine(ctx, wx - 5, yWater + 6.5, wx + 5, yWater + 6.5, pal.waterLine, 1.0);

      // =====================================================================
      // 6. SLOPE TRIANGLE (緩於 1 : 1, matching DXF 52DD..52EC)
      // =====================================================================
      const triX = xKneeBot + W_slope * 0.48;
      const triY = yKneeBot - H_slope * 0.48 - hMat - 12;
      const triH = 18;
      const triW = triH * p.n_slope;
      cadPoly(ctx, [
        [triX, triY],
        [triX, triY - triH],
        [triX + triW, triY - triH]
      ], pal.secondaryLine, 1.2, true, null, [], 'SLOPE_TRIANGLE');
      cadText(ctx, '1', triX - 8, triY - triH / 2, 10.5, pal.titleCyan, 'center', '700');
      cadText(ctx, `n (${p.n_slope})`, triX + triW / 2, triY - triH - 8, 10.5, pal.titleCyan, 'center', '700');
      cadText(ctx, '(緩於1：1)', triX + triW / 2 - 4, triY - triH - 22, 10.5, pal.titleCyan, 'center', '600');

      // =====================================================================
      // 7. ALL DIMENSIONS & CALLOUTS ON CROSS-SECTION (100% Matching DXF *D7, *D8, *D9, 518F, 52DB, 52EF, 5206)
      // =====================================================================
      // (1) Aligned 80cm dimension between two J-Anchor Pins (*D7)
      if (pinPositions.length >= 4) {
        const pA = pinPositions[2], pB = pinPositions[3];
        cadDim(ctx, pA.x1, pA.y1, pB.x1, pB.y1, 16, `${p.S_pin_slope}cm`, pal, 11);
      }

      // (2) Top horizontal anchorage width: 至少100cm (*D9)
      cadDim(ctx, xTopKnee, yTrenchSurface - 16, xTopEnd, yTrenchSurface - 16, -12, `至少${p.W_top}cm`, pal, 11);

      // (3) Right vertical topsoil cover depth: 30~50cm (*D8)
      cadDim(ctx, xTrenchEnd + 16, yTrenchSurface, xTrenchEnd + 16, yTopEnd, 14, `30~50cm (${p.H_cov})`, pal, 10.5);

      // (4) Callout: 混凝土基礎台 (518E, 518F)
      cadLeaderDot(
        ctx,
        (xFdnLeft + xKneeBot) / 2, yFdnBot - 16,
        (xFdnLeft + xKneeBot) / 2, yFdnBot + 24,
        (xFdnLeft + xKneeBot) / 2 + 28, yFdnBot + 24,
        [`混凝土基礎台 (${p.B_fdn}×${p.H_fdn}cm)`], pal, true, 11.5
      );

      // (5) Dual-Pin Bracket Callout: J-型錨釘 (5260, 52D8..52DB)
      if (pinPositions.length >= 2) {
        const p0 = pinPositions[0], p1 = pinPositions[1];
        const mx0 = (p0.x0 + p0.x1) / 2, my0 = (p0.y0 + p0.y1) / 2;
        const mx1 = (p1.x0 + p1.x1) / 2, my1 = (p1.y0 + p1.y1) / 2;
        cadLine(ctx, mx0, my0, mx1, my1, pal.dimLine, 1.15);
        cadCircle(ctx, mx0, my0, 2.0, pal.dimLine, 1.0, pal.dimLine);
        cadCircle(ctx, mx1, my1, 2.0, pal.dimLine, 1.0, pal.dimLine);
        const midBrkX = (mx0 + mx1) / 2, midBrkY = (my0 + my1) / 2;
        cadLeaderDot(
          ctx,
          midBrkX, midBrkY,
          midBrkX, midBrkY + 32,
          midBrkX + 18, midBrkY + 32,
          [`J-型錨釘 (Φ${p.d_pin}mm, L=${p.L_pin}cm)`], pal, false, 11.5
        );
      }

      // (6) Callout: 網格內植草或鋪植生毯 (52EE, 52EF)
      const targetSlopeX = xKneeBot + W_slope * 0.72;
      const targetSlopeY = yKneeBot - H_slope * 0.72 - hMat * 0.5;
      cadLeaderDot(
        ctx,
        targetSlopeX, targetSlopeY,
        targetSlopeX, yTrenchSurface - 28,
        targetSlopeX - 24, yTrenchSurface - 28,
        ['網格內植草或鋪植生毯'], pal, true, 11.5
      );

      // (7) Callout: 護岸頂排塊石或覆土植生 (5205, 5206)
      cadLeaderDot(
        ctx,
        xTopEnd + 20, yTopEnd - H_cov * 0.5,
        xTopEnd + 20, yTrenchSurface - 36,
        xTopEnd + 42, yTrenchSurface - 36,
        ['護岸頂排塊石或覆土植生'], pal, true, 11.5
      );

      // Section Title with Double Underline: 斷面圖
      const secTitleX = (xFdnLeft + xTrenchEnd) / 2;
      const secTitleY = yFdnBot + 54;
      cadText(ctx, '斷面圖', secTitleX, secTitleY, 17.5, pal.titleCyan, 'center', '700', 0, 'TITLE');
      cadLine(ctx, secTitleX - 38, secTitleY + 11, secTitleX + 38, secTitleY + 11, pal.titleCyan, 1.5);
      cadLine(ctx, secTitleX - 38, secTitleY + 14.5, secTitleX + 38, secTitleY + 14.5, pal.titleCyan, 1.0);

      return {
        xFdnLeft,
        xToeLeft,
        xKneeBot,
        xTopKnee,
        xTopEnd,
        xTrenchEnd,
        rightX: xTrenchEnd + 95,
        bottomY: secTitleY + 26
      };
    }

    // =========================================================================
    // 5. VIEW 2 (MANDATORY SKILL RULE 1): 自動補齊之 1:1 垂直對齊【平面圖】與【正視立面圖】
    //    - 平面圖 (Top): 呈現坡頂錨固覆土區(至少100cm)、1:n 展開式蜂巢圍束網格斜坡面(菱形/蜂巢網目)、
    //                    每隔73.2cm之縱向腱線、80×100cm間距之J-型錨釘陣列、水位線下碎石區與上植生區、
    //                    坡腳消能塊石帶與混凝土基礎台前緣
    //    - 正視立面圖 (Bottom, 1:1 垂直對齊): 呈現正面展開之蜂巢網格護坡、設計水位線 ▽、
    //                    J-型錨釘分佈、坡頂30~50cm植生覆土帶與底部混凝土基礎台
    // =========================================================================
    function drawSynthesizedPlanAndElevationViews(ctx, ox, topY, p, pal) {
      const s = 0.52;
      const L_draw_cm = p.L_draw_cm; // 400 cm
      const L_px = L_draw_cm * s;

      const x0 = ox + 68;
      const x1 = x0 + L_px;

      // ---------------------------------------------------------------------
      // PART A: 展開式蜂巢圍束網格緩坡護岸【平面圖】 (TOP VIEW)
      // ---------------------------------------------------------------------
      const wTopTrench = p.W_top * s;           // 100 * s
      const wSlopeHoriz = p.W_slope_horiz * s * 0.48; // Compressed horizontal projection for compact sheet fit
      const wToeRiprap = 70 * s;

      const yPlan0 = topY + 46;                 // Rear edge of top anchorage trench
      const ySlopeTop = yPlan0 + wTopTrench;    // Top knee of 1:n slope
      const yWaterPlan = ySlopeTop + wSlopeHoriz * ((100 - p.sub_ratio) / 100); // Design water line in plan
      const ySlopeBot = ySlopeTop + wSlopeHoriz; // Toe of 1:n slope
      const yPlanBot = ySlopeBot + wToeRiprap;  // Front edge of concrete foundation toe

      // 1) Top Anchorage Trench Band (護岸頂排塊石或覆土植生, width = 至少100cm)
      cadPoly(ctx, [
        [x0, yPlan0],
        [x1, yPlan0],
        [x1, ySlopeTop],
        [x0, ySlopeTop]
      ], pal.primaryLine, 1.35, true, 'rgba(168, 85, 247, 0.12)', [], 'PLAN_TOP_TRENCH');

      for (let px = x0 + 18; px < x1 - 12; px += 26) {
        drawPlantTuft(ctx, px, (yPlan0 + ySlopeTop) / 2 + 4, 0.75, pal);
      }

      // 2) Expanded Geocell Slope Band (ySlopeTop .. ySlopeBot)
      // Upper vegetated zone (above water level)
      cadPoly(ctx, [
        [x0, ySlopeTop],
        [x1, ySlopeTop],
        [x1, yWaterPlan],
        [x0, yWaterPlan]
      ], pal.geocellLine, 1.4, true, 'rgba(74, 222, 128, 0.12)', [], 'PLAN_SLOPE_VEG');

      // Lower submerged gravel/concrete zone (below water level)
      cadPoly(ctx, [
        [x0, yWaterPlan],
        [x1, yWaterPlan],
        [x1, ySlopeBot],
        [x0, ySlopeBot]
      ], pal.geocellLine, 1.4, true, pal.geocellFill, [], 'PLAN_SLOPE_SUB');

      // Draw authentic Expanded Honeycomb Diamond Mesh inside Slope Band
      const nColsMesh = Math.max(10, Math.round(L_draw_cm / p.W_cell));
      const meshW = L_px / nColsMesh;
      const nRowsMesh = Math.max(6, Math.round(wSlopeHoriz / (meshW * 0.72)));
      const meshH = wSlopeHoriz / nRowsMesh;

      for (let r = 0; r < nRowsMesh; r++) {
        const ry0 = ySlopeTop + r * meshH;
        const ryMid = ry0 + meshH * 0.5;
        const ry1 = ry0 + meshH;
        for (let c = 0; c < nColsMesh; c++) {
          const cx0 = x0 + c * meshW;
          const cxMid = cx0 + meshW * 0.5;
          const cx1 = cx0 + meshW;
          // Diamond honeycomb cell walls
          cadPoly(ctx, [
            [cxMid, ry0],
            [cx1, ryMid],
            [cxMid, ry1],
            [cx0, ryMid]
          ], pal.geocellLine, 0.85, true, null, [], 'PLAN_HONEYCOMB');
        }
      }

      // Draw Tendon Lines (腱線, spaced every S_tendon = 73.2cm along the wall)
      const tendonStepPx = p.S_tendon * s;
      for (let tx = x0 + tendonStepPx * 0.5; tx < x1 - 4; tx += tendonStepPx) {
        cadLine(ctx, tx, yPlan0 + 4, tx, ySlopeBot + 12, pal.tendonLine, 1.5, [6, 3], 'PLAN_TENDON');
      }

      // Draw J-Anchor Pin Dots (J-型錨釘, spaced every S_pin_long = 100cm horizontally, S_pin_slope = 80cm down slope)
      const pinStepX = p.S_pin_long * s;
      const nPinRows = Math.max(3, Math.floor(p.L_slope_cm / p.S_pin_slope) + 1);
      for (let px = x0 + pinStepX * 0.5; px <= x1 - 6; px += pinStepX) {
        for (let pr = 0; pr <= nPinRows; pr++) {
          const py = yPlan0 + 10 + (pr / nPinRows) * (ySlopeBot - yPlan0 - 14);
          cadCircle(ctx, px, py, 2.4, pal.pinLine, 1.2, pal.pinLine, [], 'PLAN_J_PIN');
        }
      }

      // Design Water Line (設計水位線) across Plan View
      cadLine(ctx, x0 - 12, yWaterPlan, x1 + 12, yWaterPlan, pal.waterLine, 1.5, [8, 4], 'PLAN_WATER_LINE');

      // 3) Toe Riprap Boulders & Concrete Foundation Base Front Strip (ySlopeBot .. yPlanBot)
      cadPoly(ctx, [
        [x0, ySlopeBot],
        [x1, ySlopeBot],
        [x1, yPlanBot],
        [x0, yPlanBot]
      ], pal.fdnLine, 1.4, true, pal.fdnFill, [], 'PLAN_FDN_TOE');

      const nToeStones = Math.max(10, Math.round(L_px / 18));
      const toeStep = L_px / nToeStones;
      for (let i = 0; i < nToeStones; i++) {
        drawCobbleStone(ctx, x0 + (i + 0.5) * toeStep, ySlopeBot + wToeRiprap * 0.42, toeStep * 0.44, 6.0, i + 21, pal, 'PLAN_TOE_STONE');
      }

      // Dimensions on Plan View
      for (let px = x0; px + pinStepX <= x1 + 1; px += pinStepX) {
        cadDim(ctx, px, yPlan0, Math.min(x1, px + pinStepX), yPlan0, -15, `錨釘@${p.S_pin_long}`, pal, 10);
      }
      cadDim(ctx, x0, yPlan0, x1, yPlan0, -33, `展示長 L = ${L_draw_cm}cm (腱線間距 @${p.S_tendon}cm)`, pal, 11);
      cadDim(ctx, x0, yPlan0, x0, ySlopeTop, -22, `≧${p.W_top}`, pal, 10);
      cadDim(ctx, x0, ySlopeTop, x0, ySlopeBot, -22, `緩坡1:${p.n_slope}`, pal, 10);

      // Right Labels on Plan View
      cadText(ctx, `← 坡頂錨固溝 (≧${p.W_top}cm, 覆土${p.H_cov}cm)`, x1 + 14, (yPlan0 + ySlopeTop) / 2, 10.5, pal.textMain, 'left', '600');
      cadText(ctx, `← 水位以上：表土填充植生 (深${p.D_cell}cm)`, x1 + 14, (ySlopeTop + yWaterPlan) / 2, 10.5, pal.plantLine, 'left', '600');
      cadText(ctx, `← 水位以下：5cm碎石或混凝土填充 + 腱線@${p.S_tendon}cm`, x1 + 14, (yWaterPlan + ySlopeBot) / 2, 10.5, pal.geocellLine, 'left', '600');
      cadText(ctx, `← 坡腳消能塊石 + 混凝土基礎台 (${p.B_fdn}×${p.H_fdn}cm)`, x1 + 14, (ySlopeBot + yPlanBot) / 2, 10.5, pal.titleCyan, 'left', '600');

      const planTitleY = yPlanBot + 28;
      cadText(ctx, '平面圖 (自動補齊・1:1垂直對齊)', (x0 + x1) / 2, planTitleY, 15.5, pal.titleCyan, 'center', '700');
      cadLine(ctx, (x0 + x1) / 2 - 110, planTitleY + 10, (x0 + x1) / 2 + 110, planTitleY + 10, pal.titleCyan, 1.3);

      // ---------------------------------------------------------------------
      // PART B: 展開式蜂巢圍束網格緩坡護岸【立面圖】 (FRONT ELEVATION - 1:1 ALIGNED)
      // ---------------------------------------------------------------------
      const yElevTop = planTitleY + 42;
      const hCovPx = p.H_cov * s * 0.65;
      const hSlopePx = p.H_slope * s * 0.72;
      const hFdnPx = p.H_fdn * s * 0.55;

      const yElevSlopeTop = yElevTop + hCovPx;
      const yElevWater = yElevSlopeTop + hSlopePx * ((100 - p.sub_ratio) / 100);
      const yElevSlopeBot = yElevSlopeTop + hSlopePx;
      const yElevFdnBot = yElevSlopeBot + hFdnPx;

      // 1:1 Vertical Alignment Dashed Guides between Plan View and Elevation View
      for (let px = x0; px <= x1 + 1; px += pinStepX) {
        cadLine(ctx, px, yPlanBot + 4, px, yElevTop - 6, pal.secondaryLine, 0.85, [4, 4], 'ALIGN_GUIDE');
      }

      // 1) Top 30~50cm Cover Band in Elevation
      cadPoly(ctx, [
        [x0, yElevTop],
        [x1, yElevTop],
        [x1, yElevSlopeTop],
        [x0, yElevSlopeTop]
      ], pal.primaryLine, 1.3, true, 'rgba(168, 85, 247, 0.12)', [], 'ELEV_TOP_COV');
      for (let px = x0 + 18; px < x1 - 12; px += 26) {
        drawPlantTuft(ctx, px, yElevTop, 0.75, pal);
      }

      // 2) Sloped Honeycomb Geocell Face in Elevation
      cadPoly(ctx, [
        [x0, yElevSlopeTop],
        [x1, yElevSlopeTop],
        [x1, yElevSlopeBot],
        [x0, yElevSlopeBot]
      ], pal.geocellLine, 1.45, true, pal.geocellFill, [], 'ELEV_SLOPE_FACE');

      const nRowsElev = Math.max(5, Math.round(hSlopePx / (meshW * 0.68)));
      const elevRowH = hSlopePx / nRowsElev;
      for (let r = 0; r < nRowsElev; r++) {
        const ry0 = yElevSlopeTop + r * elevRowH;
        const ryMid = ry0 + elevRowH * 0.5;
        const ry1 = ry0 + elevRowH;
        for (let c = 0; c < nColsMesh; c++) {
          const cx0 = x0 + c * meshW;
          const cxMid = cx0 + meshW * 0.5;
          const cx1 = cx0 + meshW;
          cadPoly(ctx, [
            [cxMid, ry0],
            [cx1, ryMid],
            [cxMid, ry1],
            [cx0, ryMid]
          ], pal.geocellLine, 0.85, true, null, [], 'ELEV_HONEYCOMB');
        }
      }

      // Tendon lines & J-Anchor Pins in Elevation View
      for (let tx = x0 + tendonStepPx * 0.5; tx < x1 - 4; tx += tendonStepPx) {
        cadLine(ctx, tx, yElevSlopeTop, tx, yElevSlopeBot, pal.tendonLine, 1.45, [6, 3], 'ELEV_TENDON');
      }
      for (let px = x0 + pinStepX * 0.5; px <= x1 - 6; px += pinStepX) {
        for (let pr = 1; pr < nPinRows; pr++) {
          const py = yElevSlopeTop + (pr / nPinRows) * hSlopePx;
          cadCircle(ctx, px, py, 2.3, pal.pinLine, 1.1, pal.pinLine, [], 'ELEV_J_PIN');
        }
      }

      // Design Water Line ▽ in Elevation View
      cadLine(ctx, x0 - 15, yElevWater, x1 + 15, yElevWater, pal.waterLine, 1.5, [], 'ELEV_WATER');

      // 3) Concrete Foundation Base (dashed below streambed) & Toe Boulders in Elevation View
      cadPoly(ctx, [
        [x0, yElevSlopeBot],
        [x1, yElevSlopeBot],
        [x1, yElevFdnBot],
        [x0, yElevFdnBot]
      ], pal.fdnLine, 1.3, true, pal.fdnFill, [5, 3], 'ELEV_FDN');

      for (let i = 0; i < nToeStones; i++) {
        drawCobbleStone(ctx, x0 + (i + 0.5) * toeStep, yElevSlopeBot - 4, toeStep * 0.44, 5.2, i + 55, pal, 'ELEV_TOE_STONE');
      }

      // Dimensions on Elevation View
      cadDim(ctx, x0, yElevTop, x0, yElevSlopeTop, -22, `${p.H_cov}`, pal, 10);
      cadDim(ctx, x0, yElevSlopeTop, x0, yElevSlopeBot, -22, `H=${p.H_slope}`, pal, 10.5);
      cadDim(ctx, x0, yElevSlopeBot, x0, yElevFdnBot, -22, `基礎${p.H_fdn}`, pal, 10);

      const elevTitleY = yElevFdnBot + 26;
      cadText(ctx, '立面圖 (自動補齊・1:1垂直對齊)', (x0 + x1) / 2, elevTitleY, 15.5, pal.titleCyan, 'center', '700');
      cadLine(ctx, (x0 + x1) / 2 - 110, elevTitleY + 10, (x0 + x1) / 2 + 110, elevTitleY + 10, pal.titleCyan, 1.3);

      return {
        rightX: x1 + 290,
        bottomY: elevTitleY + 24
      };
    }

    // =========================================================================
    // 6. VIEW 3 ~ 7: 原圖 5 大立體詳圖 100% 完整還原
    //    - 詳圖 1: 立體圖 (蜂巢圍束網格 + 腱線 + 單一J-型錨釘穿入網格孔, 5762..57C8)
    //    - 詳圖 2: 錨釘圖 (3格剖面 + 腱線 + J-型錨釘 + 選用回填料 + 蜂巢圍束系統, 57DF..6775)
    //    - 詳圖 3: J-型錨釘配置示意圖 (斜坡立體網格 + 100cm×100cm J-型錨釘陣列, 62FC..64CF)
    //    - 詳圖 4: J-型錨釘配置圖 (100cm×73.2cm 腱線與J-型錨釘立體拉結詳圖, 652F..6760)
    //    - 詳圖 5: 網格植生示意圖 (上層表土填充植生 + 下層蜂巢網格深10cm草皮覆蓋, 54DA..56F4)
    // =========================================================================
    function drawFiveOriginalIsometricDetails(ctx, ox, topY, p, pal) {
      // Helper: Draw a 3D Isometric Honeycomb Geocell Grid Carpet at origin (gx, gy)
      // u-axis: down-right (30°), v-axis: up-right (20°), z-axis: vertical drop
      const drawIsoHoneycombGrid = (gx, gy, nU, nV, cellScale, dropH, fillTopVeg = false, showTendons = false, pinCoords = []) => {
        const uX = 16 * cellScale, uY = -6 * cellScale;
        const vX = 11 * cellScale, vY = 9 * cellScale;

        const isoPt = (u, v, z = 0) => [
          gx + u * uX + v * vX,
          gy + u * uY + v * vY + z
        ];

        // Draw sinusoidal/diamond honeycomb cells from back to front
        for (let v = 0; v < nV; v++) {
          for (let u = nU - 1; u >= 0; u--) {
            const pT = isoPt(u + 0.5, v, 0);
            const pR = isoPt(u + 1.0, v + 0.5, 0);
            const pB = isoPt(u + 0.5, v + 1.0, 0);
            const pL = isoPt(u, v + 0.5, 0);

            const pB_bot = isoPt(u + 0.5, v + 1.0, dropH);
            const pL_bot = isoPt(u, v + 0.5, dropH);
            const pR_bot = isoPt(u + 1.0, v + 0.5, dropH);

            // Front-left & front-right vertical cell walls
            cadPoly(ctx, [pL, pB, pB_bot, pL_bot], pal.primaryLine, 1.05, true, 'rgba(30, 41, 59, 0.72)', [], 'ISO_CELL_WALL');
            cadPoly(ctx, [pB, pR, pR_bot, pB_bot], pal.primaryLine, 1.05, true, 'rgba(51, 65, 85, 0.58)', [], 'ISO_CELL_WALL');

            // Top diamond rim
            const cellFill = fillTopVeg ? 'rgba(74, 222, 128, 0.16)' : 'rgba(15, 23, 42, 0.35)';
            cadPoly(ctx, [pT, pR, pB, pL], pal.primaryLine, 1.2, true, cellFill, [], 'ISO_CELL_RIM');

            if (fillTopVeg && (u + v) % 2 === 0) {
              const [cx, cy] = isoPt(u + 0.5, v + 0.5, -1);
              drawPlantTuft(ctx, cx, cy + 2, 0.45 * cellScale, pal);
            }
          }
        }

        // Optional Magenta Tendon Lines (腱線) running along u-axis
        const tendonEnds = [];
        if (showTendons) {
          [1.0, 2.5].forEach((vIdx) => {
            if (vIdx <= nV) {
              const tStart = isoPt(-0.3, vIdx, dropH * 0.4);
              const tEnd = isoPt(nU + 0.45, vIdx, dropH * 0.4);
              cadLine(ctx, tStart[0], tStart[1], tEnd[0], tEnd[1], pal.tendonLine, 1.65, [], 'ISO_TENDON');
              tendonEnds.push({ start: tStart, end: tEnd });
            }
          });
        }

        // Optional J-Anchor Pins (J-型錨釘) at specified (u, v) coordinates
        const drawnPins = [];
        pinCoords.forEach(([pu, pv, fullDrop]) => {
          const [px, py] = isoPt(pu, pv, 0);
          const pinBotY = py + (fullDrop ? 44 * cellScale : 14 * cellScale);
          // J-hook top + vertical shaft
          cadPoly(ctx, [
            [px - 4, py - 4],
            [px - 4, py - 10],
            [px + 3, py - 10],
            [px + 3, pinBotY]
          ], pal.pinLine, 1.75, false, null, [], 'ISO_J_PIN');
          drawnPins.push({ xTop: px, yTop: py - 10, xBot: px + 3, yBot: pinBotY });
        });

        return { isoPt, tendonEnds, drawnPins };
      };

      // =====================================================================
      // DETAIL 1 (Top-Left of Detail Cluster): 立體圖 (蜂巢圍束網格 + 腱線, 5762..6715)
      // =====================================================================
      const d1X = ox + 30;
      const d1Y = topY + 68;
      const iso1 = drawIsoHoneycombGrid(d1X, d1Y, 4, 3, 1.0, 14, false, true, [[1.5, 1.0, false]]);

      const [c1x, c1y] = iso1.isoPt(2.0, 0.5, 0);
      cadLeaderDot(ctx, c1x, c1y, c1x, c1y - 26, c1x + 18, c1y - 26, ['蜂巢圍束網格'], pal, true, 11);

      if (iso1.drawnPins.length > 0) {
        const p0 = iso1.drawnPins[0];
        cadLeaderDot(ctx, p0.xTop, p0.yTop, p0.xTop, p0.yTop - 18, p0.xTop + 16, p0.yTop - 18, ['腱線 / 錨釘'], pal, true, 11);
      }
      const d1TitleY = d1Y + 64;
      cadText(ctx, '立體圖', d1X + 55, d1TitleY, 14.5, pal.titleCyan, 'center', '700');
      cadLine(ctx, d1X + 28, d1TitleY + 9, d1X + 82, d1TitleY + 9, pal.titleCyan, 1.3);

      // =====================================================================
      // DETAIL 2 (Top-Right of Detail Cluster): 錨釘圖 (57DF..6775)
      //    3 tilted geocell chambers filled with AR-SAND, magenta tendon line passing through
      //    and looping around J-型錨釘, with callouts: 蜂巢圍束系統, 選用回填料, 腱線, J-型錨釘
      // =====================================================================
      const d2X = ox + 265;
      const d2Y = topY + 62;
      const angD2 = -28 * Math.PI / 180;
      const cosA = Math.cos(angD2), sinA = Math.sin(angD2);
      const rotPt = (lx, ly) => [
        d2X + lx * cosA - ly * sinA,
        d2Y + lx * sinA + ly * cosA
      ];

      // 3 adjacent geocell chambers (each 34px wide x 24px high)
      const cW = 34, cH = 24;
      for (let i = 0; i < 3; i++) {
        const xA = i * cW, xB = (i + 1) * cW;
        // Lower filled portion (選用回填料)
        cadPoly(ctx, [
          rotPt(xA, cH * 0.35),
          rotPt(xB, cH * 0.35),
          rotPt(xB, cH),
          rotPt(xA, cH)
        ], pal.secondaryLine, 1.0, true, 'rgba(168, 85, 247, 0.16)', [4, 3], 'ANCHOR_FILL');
        // Full cell frame (蜂巢圍束系統)
        cadPoly(ctx, [
          rotPt(xA, 0),
          rotPt(xB, 0),
          rotPt(xB, cH),
          rotPt(xA, cH)
        ], pal.primaryLine, 1.4, true, null, [], 'ANCHOR_CELL');
      }

      // Magenta Tendon Line (腱線) running through cells and deflecting down to J-Pin hook
      const tPts = [
        rotPt(0, cH * 0.45),
        rotPt(cW, cH * 0.45),
        rotPt(cW * 1.55, cH * 0.88),
        rotPt(cW * 2, cH * 0.45),
        rotPt(cW * 3, cH * 0.45)
      ];
      cadPoly(ctx, tPts, pal.tendonLine, 1.75, false, null, [], 'ANCHOR_TENDON');

      // J-Shaped Anchor Pin (J-型錨釘) hooking the tendon at (cW * 1.55, cH * 0.88)
      const [jhX, jhY] = rotPt(cW * 1.55, cH * 0.88);
      const [jbX, jbY] = rotPt(cW * 1.55, cH + 28);
      cadPoly(ctx, [
        [jhX - 6, jhY + 3],
        [jhX - 3, jhY - 5],
        [jhX + 3, jhY - 3],
        [jbX + 3, jbY]
      ], pal.pinLine, 2.0, false, null, [], 'ANCHOR_PIN_BODY');

      // 4 Callouts on 錨釘圖 (matching DXF 6768, 676B, 6772, 6775):
      const [pSysX, pSysY] = rotPt(cW * 2.5, 0);
      cadLeaderDot(ctx, pSysX, pSysY, pSysX, d2Y - 46, pSysX - 18, d2Y - 46, ['蜂巢圍束系統'], pal, true, 10.8);

      const [pFillX, pFillY] = rotPt(cW * 2.2, cH * 0.65);
      cadLeaderDot(ctx, pFillX, pFillY, pFillX, d2Y - 28, pFillX - 24, d2Y - 28, ['選用回填料'], pal, true, 10.8);

      const [pTenX, pTenY] = rotPt(cW * 1.85, cH * 0.55);
      cadLeaderDot(ctx, pTenX, pTenY, pTenX, d2Y - 10, pTenX - 30, d2Y - 10, ['腱線'], pal, true, 10.8);

      cadLeaderDot(ctx, jbX, jbY - 4, jbX, jbY + 18, jbX - 18, jbY + 18, ['J-型錨釘'], pal, true, 10.8);

      cadText(ctx, '錨釘圖', d2X + 45, d1TitleY, 14.5, pal.titleCyan, 'center', '700');
      cadLine(ctx, d2X + 18, d1TitleY + 9, d2X + 72, d1TitleY + 9, pal.titleCyan, 1.3);

      // =====================================================================
      // DETAIL 3 (Middle-Left): J-型錨釘配置示意圖 (100cm × 100cm, 62FC..64CF)
      // =====================================================================
      const d3X = ox + 35;
      const d3Y = d1TitleY + 62;
      const iso3 = drawIsoHoneycombGrid(d3X, d3Y, 4, 3, 0.95, 12, false, false, [
        [1.0, 0.5, false],
        [3.0, 0.5, false],
        [1.0, 2.5, false],
        [3.0, 2.5, false]
      ]);

      // Top-Right 100cm dimension (*D14) & Left 100cm dimension (*D15)
      if (iso3.drawnPins.length >= 4) {
        const p00 = iso3.drawnPins[0], p10 = iso3.drawnPins[1], p01 = iso3.drawnPins[2];
        cadDim(ctx, p00.xTop, p00.yTop, p10.xTop, p10.yTop, -18, `${p.S_pin_long}cm`, pal, 10.5);
        cadDim(ctx, p00.xTop, p00.yTop, p01.xTop, p01.yTop, -22, `${p.S_pin_long}cm`, pal, 10.5);
      }

      const d3TitleY = d3Y + 64;
      cadText(ctx, 'J-型錨釘配置示意圖', d3X + 65, d3TitleY, 14.5, pal.titleCyan, 'center', '700');
      cadLine(ctx, d3X + 2, d3TitleY + 9, d3X + 128, d3TitleY + 9, pal.titleCyan, 1.3);

      // =====================================================================
      // DETAIL 4 (Middle-Right): 網格植生示意圖 (表土填充植生 + 蜂巢深度10cm草皮覆蓋, 54DA..682B)
      // =====================================================================
      const d4X = ox + 255;
      const d4Y = d1TitleY + 62;

      // Lower honeycomb grid filled with topsoil + Upper vegetated sod layer
      const iso4 = drawIsoHoneycombGrid(d4X, d4Y, 4, 3, 0.95, 12, true, false, []);

      // Callout 1: 蜂巢深度10cm，以表土填充並以草皮覆蓋，或植栽草種 (682B)
      const [vTopX, vTopY] = iso4.isoPt(2.5, 0.5, -4);
      cadLeaderDot(
        ctx,
        vTopX, vTopY,
        vTopX + 16, vTopY - 22,
        vTopX + 26, vTopY - 22,
        [`蜂巢深度${p.D_cell}cm，以表土填`, '充並以草皮覆蓋，或植栽草種'],
        pal, true, 10.5
      );

      // Callout 2: 表土填充植生 (可於底層鋪設粒料濾層) (56F3, 56F4)
      const [vBotX, vBotY] = iso4.isoPt(2.0, 2.5, 8);
      cadLeaderDot(
        ctx,
        vBotX, vBotY,
        vBotX + 18, vBotY + 18,
        vBotX + 28, vBotY + 18,
        ['表土填充植生', '(可於底層鋪設粒料濾層)'],
        pal, true, 10.5
      );

      cadText(ctx, '網格植生示意圖', d4X + 65, d3TitleY, 14.5, pal.titleCyan, 'center', '700');
      cadLine(ctx, d4X + 12, d3TitleY + 9, d4X + 118, d3TitleY + 9, pal.titleCyan, 1.3);

      // =====================================================================
      // DETAIL 5 (Bottom Center of Detail Cluster): J-型錨釘配置圖 (100cm × 73.2cm, 652F..6760)
      //    Shows full-length J-Anchor Pins (60cm) extending below the honeycomb grid,
      //    magenta tendons spaced at 73.2cm (*D16), pin spacing 100cm (*D17),
      //    and callouts: 蜂巢圍束系統, 選用回填料, 腱線, J-型錨釘(每5個網格配置一支)
      // =====================================================================
      const d5X = ox + 115;
      const d5Y = d3TitleY + 66;
      const iso5 = drawIsoHoneycombGrid(d5X, d5Y, 4, 3, 1.05, 13, false, true, [
        [0.8, 1.0, true],
        [2.8, 1.0, true],
        [0.8, 2.5, true],
        [2.8, 2.5, true]
      ]);

      if (iso5.drawnPins.length >= 4) {
        const pA = iso5.drawnPins[0], pB = iso5.drawnPins[1], pC = iso5.drawnPins[2];
        // Left 100cm dimension (*D17)
        cadDim(ctx, pA.xTop, pA.yTop, pB.xTop, pB.yTop, -22, `${p.S_pin_long}cm`, pal, 10.5);
        // Bottom 73.2cm dimension between tendon rows (*D16)
        cadDim(ctx, pA.xBot, pA.yBot, pC.xBot, pC.yBot, 18, `${p.S_tendon}cm`, pal, 10.5);

        // Callout: J-型錨釘 (錨釘配置間距可採用每5個網格配置一支) (675F, 6760)
        const pLast = iso5.drawnPins[3];
        cadLeaderDot(
          ctx,
          pLast.xBot, pLast.yBot - 10,
          pLast.xBot + 24, pLast.yBot - 10,
          pLast.xBot + 36, pLast.yBot - 10,
          ['J-型錨釘 (錨釘配置間距', `可採用每${p.N_cell_pin}個網格配置一支)`],
          pal, true, 10.5
        );
      }

      if (iso5.tendonEnds.length > 0) {
        const te = iso5.tendonEnds[0].end;
        cadLeaderDot(ctx, te[0], te[1], te[0] + 18, te[1], te[0] + 28, te[1], ['腱線'], pal, true, 10.8);
      }

      const [sys5X, sys5Y] = iso5.isoPt(3.2, 0.3, 0);
      cadLeaderDot(ctx, sys5X, sys5Y, sys5X + 18, sys5Y - 20, sys5X + 28, sys5Y - 20, ['蜂巢圍束系統 / 選用回填料'], pal, true, 10.8);

      const d5TitleY = d5Y + 102;
      cadText(ctx, 'J-型錨釘配置圖', d5X + 65, d5TitleY, 14.5, pal.titleCyan, 'center', '700');
      cadLine(ctx, d5X + 12, d5TitleY + 9, d5X + 118, d5TitleY + 9, pal.titleCyan, 1.3);

      return {
        rightX: d4X + 245,
        bottomY: d5TitleY + 24
      };
    }

    // =========================================================================
    // 7. VIEW 8: EXPLICIT FIGURE-NUMBER QUANTITY TABLE ON CANVAS
    // =========================================================================
    function drawExplicitFormulaTableOnCanvas(ctx, ox, oy, p, pal) {
      cadText(
        ctx,
        `【展開式蜂巢圍束網格緩坡護岸 (圖號 0414-1) 每公尺數量計算式表 — 採用圖面標註數字顯式列式 (緩坡1:${p.n_slope}・蜂巢深${p.D_cell}cm・全段=${p.L_tot_m.toFixed(1)}m)】`,
        ox, oy - 15, 13.5, pal.dimText, 'left', '700'
      );

      const colW = [230, 470, 82, 92, 52];
      const rowH = 26;
      const rows = [
        ['工程項目名稱 (依DXF圖面標註)', '採用圖面標註數字之顯式計算式 (每公尺單側基準)', '每m數量', `全段(${p.L_tot_m}m)`, '單位'],
        [`展開式蜂巢圍束網格 (深度${p.D_cell}cm, 緩坡1:${p.n_slope})`, p.formula_geocell_area, p.q_geocell_area.toFixed(2), (p.q_geocell_area * p.L_tot_m).toFixed(1), 'M²'],
        [`J-型錨釘 (Φ${p.d_pin}mm, L=${p.L_pin}cm, @${p.S_pin_slope}×${p.S_pin_long}cm)`, p.formula_pin_cnt, p.q_pin_cnt.toFixed(2), (p.q_pin_cnt * p.L_tot_m).toFixed(0), '支'],
        [`高強聚酯腱線 (每隔${p.S_tendon}cm設置一條)`, p.formula_tendon_len, p.q_tendon_len.toFixed(2), (p.q_tendon_len * p.L_tot_m).toFixed(1), 'M'],
        ['設計水位以下：單尺寸碎石(粒徑約5cm)或混凝土填充', p.formula_sub_gravel, p.q_sub_gravel.toFixed(2), (p.q_sub_gravel * p.L_tot_m).toFixed(2), 'M³'],
        [`設計水位以上：表土填充及坡頂錨固覆土(厚${p.H_cov}cm)`, p.formula_topsoil_vol, p.q_topsoil_vol.toFixed(2), (p.q_topsoil_vol * p.L_tot_m).toFixed(2), 'M³'],
        ['網格內植草、草皮覆蓋或鋪植生毯面積', p.formula_grass_area, p.q_grass_area.toFixed(2), (p.q_grass_area * p.L_tot_m).toFixed(1), 'M²'],
        [`混凝土基礎台 (${p.B_fdn}×${p.H_fdn}cm, 210kgf/cm²)`, p.formula_fdn_conc, p.q_fdn_conc.toFixed(2), (p.q_fdn_conc * p.L_tot_m).toFixed(2), 'M³'],
        ['基礎台臨水面嵌塊石及坡腳保護塊石', p.formula_riprap_vol, p.q_riprap_vol.toFixed(2), (p.q_riprap_vol * p.L_tot_m).toFixed(2), 'M³']
      ];

      const totW = colW.reduce((a, b) => a + b, 0);
      const totH = rows.length * rowH;

      ctx.save();
      ctx.fillStyle = pal.tableHeaderBg;
      ctx.fillRect(ox, oy, totW, rowH);
      ctx.restore();

      cadPoly(ctx, [
        [ox, oy],
        [ox + totW, oy],
        [ox + totW, oy + totH],
        [ox, oy + totH]
      ], pal.primaryLine, 1.45, true, null, [], 'FORMULA_TABLE');

      for (let r = 1; r < rows.length; r++) {
        cadLine(ctx, ox, oy + r * rowH, ox + totW, oy + r * rowH, pal.tableBorder, 0.95);
      }

      let vx = ox;
      for (let c = 0; c < colW.length - 1; c++) {
        vx += colW[c];
        cadLine(ctx, vx, oy, vx, oy + totH, pal.tableBorder, 0.95);
      }

      rows.forEach((rData, rIdx) => {
        let cx = ox;
        const ry = oy + (rIdx + 0.5) * rowH;
        const isHeader = rIdx === 0;
        rData.forEach((cellStr, cIdx) => {
          const cw = colW[cIdx];
          const align = ((cIdx === 0 || cIdx === 1) && !isHeader) ? 'left' : 'center';
          const tx = align === 'left' ? cx + 8 : cx + cw / 2;
          const color = isHeader ? pal.textMain : (cIdx === 2 ? pal.dimText : (cIdx === 3 ? pal.geocellLine : pal.textSub));
          cadText(ctx, cellStr, tx, ry, isHeader ? 11.2 : 10.6, color, align, (isHeader || cIdx === 2 || cIdx === 3) ? '700' : '500');
          cx += cw;
        });
      });

      return { bottomY: oy + totH };
    }

    // =========================================================================
    // 8. MAIN RENDER ENGINE & LIVE UI UPDATER
    // =========================================================================
    function updateSidebarSummary(p) {
      document.getElementById('stat_slope_tag').textContent = `1:${p.n_slope}・深${p.D_cell}cm`;
      document.getElementById('stat_geocell_m').textContent = `${p.q_geocell_area.toFixed(2)} M²/m`;
      document.getElementById('stat_pin_m').textContent = `${p.q_pin_cnt.toFixed(1)}支 + ${p.q_tendon_len.toFixed(1)}m`;
      document.getElementById('stat_fdn_m').textContent = `${p.q_fdn_conc.toFixed(2)} + ${p.q_riprap_vol.toFixed(2)} M³/m`;
      document.getElementById('stat_fill_m').textContent = `${p.q_topsoil_vol.toFixed(2)} + ${p.q_sub_gravel.toFixed(2)} M³/m`;
    }

    function renderAll() {
      const canvas = document.getElementById('cadCanvas');
      if (!canvas) return;
      const rect = canvas.parentElement.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      if (canvas.width !== Math.floor(rect.width * dpr) || canvas.height !== Math.floor(rect.height * dpr)) {
        canvas.width = Math.floor(rect.width * dpr);
        canvas.height = Math.floor(rect.height * dpr);
      }

      const ctx = canvas.getContext('2d');
      const pal = getPalette();
      const p = getParams();

      updateSidebarSummary(p);
      document.getElementById('zoom-indicator').textContent = `${Math.round(viewCam.scale * 100)}%`;

      dxfEntities = [];

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.fillStyle = pal.bg;
      ctx.fillRect(0, 0, rect.width, rect.height);

      ctx.translate(viewCam.offsetX, viewCam.offsetY);
      ctx.scale(viewCam.scale, viewCam.scale);

      if (currentView === 'SECTION_PLAN_ELEV') {
        const bSec = drawMainCrossSectionView(ctx, 35, 15, p, pal);
        const bPE = drawSynthesizedPlanAndElevationViews(ctx, bSec.rightX + 25, 15, p, pal);
        drawExplicitFormulaTableOnCanvas(ctx, 45, Math.max(bSec.bottomY, bPE.bottomY) + 42, p, pal);
      } else if (currentView === 'ISO_DETAILS') {
        const bIso = drawFiveOriginalIsometricDetails(ctx, 50, 15, p, pal);
        const bSec = drawMainCrossSectionView(ctx, bIso.rightX + 35, 15, p, pal);
        drawExplicitFormulaTableOnCanvas(ctx, 50, Math.max(bIso.bottomY, bSec.bottomY) + 42, p, pal);
      } else {
        // 'ALL' Full Standard Sheet Layout:
        // - Left Column: 斷面圖 (已剔除自然地形線，緩於1:1)
        // - Middle Column: 自動補齊之 1:1 垂直對齊【平面圖】與【正視立面圖】
        // - Right Column: 原圖 5 大立體詳圖 (立體圖・錨釘圖・J-型錨釘配置示意圖・網格植生示意圖・J-型錨釘配置圖)
        // - Bottom Full-Width: 圖面標註數字顯式計算式表
        const bSec = drawMainCrossSectionView(ctx, 25, 12, p, pal);
        const midColX = bSec.rightX + 20;
        const bPE = drawSynthesizedPlanAndElevationViews(ctx, midColX, 12, p, pal);
        const rightColX = bPE.rightX + 20;
        const bIso = drawFiveOriginalIsometricDetails(ctx, rightColX, 12, p, pal);

        const tableY = Math.max(bSec.bottomY, bPE.bottomY, bIso.bottomY) + 45;
        drawExplicitFormulaTableOnCanvas(ctx, 40, tableY, p, pal);
      }

      ctx.restore();
    }

    // =========================================================================
    // 9. UI CONTROLS, AUTO-SYNC & DXF / CSV EXPORTERS
    // =========================================================================
    function onParamChange() {
      renderAll();
    }

    function resetToOrig() {
      Object.keys(ORIG_EXPANDED_GEOCELL).forEach(k => {
        const el = document.getElementById('inp_' + k);
        if (el) el.value = ORIG_EXPANDED_GEOCELL[k];
      });
      renderAll();
    }

    function switchView(view) {
      currentView = view;
      const specEl = document.getElementById('specPanel');
      const tabs = {
        ALL: document.getElementById('tab-all'),
        SECTION_PLAN_ELEV: document.getElementById('tab-sec'),
        ISO_DETAILS: document.getElementById('tab-det'),
        SPEC: document.getElementById('tab-spec')
      };
      Object.keys(tabs).forEach(k => {
        if (!tabs[k]) return;
        tabs[k].className = (k === view)
          ? 'px-3 py-1.5 rounded-md text-xs font-semibold transition-all bg-emerald-600 text-white shadow'
          : 'px-3 py-1.5 rounded-md text-xs font-medium transition-all text-slate-400 hover:text-white';
      });
      if (view === 'SPEC') {
        specEl.classList.remove('hidden');
      } else {
        specEl.classList.add('hidden');
        fitViewToScreen();
      }
    }

    function toggleGhost() {
      showGhost = !showGhost;
      const btn = document.getElementById('btn-ghost');
      btn.className = showGhost
        ? 'px-2.5 py-1 rounded bg-emerald-950/90 border border-emerald-600/60 text-xs text-emerald-300 flex items-center gap-1 transition'
        : 'px-2.5 py-1 rounded bg-slate-800 border border-slate-700 text-xs text-slate-400 flex items-center gap-1 transition';
      btn.innerHTML = showGhost
        ? '<span>📏</span> <span>原圖基準虛線: 開啟</span>'
        : '<span>📏</span> <span>原圖基準虛線: 關閉</span>';
      renderAll();
    }

    function toggleTheme() {
      isDarkTheme = !isDarkTheme;
      document.getElementById('theme-label').textContent = isDarkTheme ? '深色 CAD 藍圖' : '白底工程出圖';
      renderAll();
    }

    function fitViewToScreen() {
      const canvas = document.getElementById('cadCanvas');
      if (!canvas) return;
      const rect = canvas.parentElement.getBoundingClientRect();
      if (currentView === 'SECTION_PLAN_ELEV') {
        viewCam.scale = Math.min(rect.width / 1380, rect.height / 920) * 0.93;
        viewCam.offsetX = Math.max(20, (rect.width - 1300 * viewCam.scale) / 2);
        viewCam.offsetY = 16;
      } else if (currentView === 'ISO_DETAILS') {
        viewCam.scale = Math.min(rect.width / 1380, rect.height / 920) * 0.93;
        viewCam.offsetX = Math.max(20, (rect.width - 1300 * viewCam.scale) / 2);
        viewCam.offsetY = 16;
      } else {
        viewCam.scale = Math.min(rect.width / 1920, rect.height / 1120) * 0.94;
        viewCam.offsetX = Math.max(16, (rect.width - 1860 * viewCam.scale) / 2);
        viewCam.offsetY = 14;
      }
      renderAll();
    }

    function zoomByButton(factor) {
      const canvas = document.getElementById('cadCanvas');
      const rect = canvas.parentElement.getBoundingClientRect();
      const cx = rect.width / 2;
      const cy = rect.height / 2;
      const nextScale = Math.max(0.25, Math.min(3.5, viewCam.scale * factor));
      viewCam.offsetX = cx - (cx - viewCam.offsetX) * (nextScale / viewCam.scale);
      viewCam.offsetY = cy - (cy - viewCam.offsetY) * (nextScale / viewCam.scale);
      viewCam.scale = nextScale;
      renderAll();
    }

    function exportDXF() {
      renderAll();
      let dxf = '0\nSECTION\n2\nENTITIES\n';
      for (const e of dxfEntities) {
        if (e.type === 'LINE') {
          dxf += `0\nLINE\n8\n${e.layer || '0'}\n10\n${e.x1.toFixed(3)}\n20\n${e.y1.toFixed(3)}\n30\n0.0\n11\n${e.x2.toFixed(3)}\n21\n${e.y2.toFixed(3)}\n31\n0.0\n`;
        } else if (e.type === 'CIRCLE') {
          dxf += `0\nCIRCLE\n8\n${e.layer || '0'}\n10\n${e.cx.toFixed(3)}\n20\n${e.cy.toFixed(3)}\n30\n0.0\n40\n${e.r.toFixed(3)}\n`;
        } else if (e.type === 'TEXT') {
          dxf += `0\nTEXT\n8\n${e.layer || 'TEXT'}\n10\n${e.x.toFixed(3)}\n20\n${e.y.toFixed(3)}\n30\n0.0\n40\n${(e.size || 10).toFixed(2)}\n1\n${e.str}\n`;
        }
      }
      dxf += '0\nENDSEC\n0\nEOF\n';

      const blob = new Blob([dxf], { type: 'application/dxf;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const p = getParams();
      a.download = `展開式蜂巢圍束網格緩坡護岸_0414-1_1比${p.n_slope}_深${p.D_cell}cm_含補齊平立面.dxf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }

    function exportCSV() {
      const p = getParams();
      const rows = [
        [`展開式蜂巢圍束網格緩坡護岸標準圖 (圖號 0414-1 / 緩坡1:${p.n_slope}・蜂巢深${p.D_cell}cm) - 圖面標註數字顯式列式數量計算書`],
        ['工程項目名稱', '採用圖面標註數字之顯式計算式 (每公尺單側)', '每公尺數量', `全段數量(${p.L_tot_m}m)`, '單位'],
        [`展開式蜂巢圍束網格 (深度${p.D_cell}cm, 緩坡1:${p.n_slope})`, `'${p.formula_geocell_area}`, p.q_geocell_area.toFixed(2), (p.q_geocell_area * p.L_tot_m).toFixed(1), 'M²'],
        [`J-型錨釘 (Φ${p.d_pin}mm, L=${p.L_pin}cm, @${p.S_pin_slope}×${p.S_pin_long}cm)`, `'${p.formula_pin_cnt}`, p.q_pin_cnt.toFixed(2), (p.q_pin_cnt * p.L_tot_m).toFixed(0), '支'],
        [`高強聚酯腱線 (每隔${p.S_tendon}cm設置一條)`, `'${p.formula_tendon_len}`, p.q_tendon_len.toFixed(2), (p.q_tendon_len * p.L_tot_m).toFixed(1), 'M'],
        ['設計水位以下：單尺寸碎石(粒徑約5cm)或混凝土填充', `'${p.formula_sub_gravel}`, p.q_sub_gravel.toFixed(2), (p.q_sub_gravel * p.L_tot_m).toFixed(2), 'M³'],
        [`設計水位以上：表土填充及坡頂錨固覆土(厚${p.H_cov}cm)`, `'${p.formula_topsoil_vol}`, p.q_topsoil_vol.toFixed(2), (p.q_topsoil_vol * p.L_tot_m).toFixed(2), 'M³'],
        ['網格內植草、草皮覆蓋或鋪植生毯面積', `'${p.formula_grass_area}`, p.q_grass_area.toFixed(2), (p.q_grass_area * p.L_tot_m).toFixed(1), 'M²'],
        [`混凝土基礎台 (${p.B_fdn}×${p.H_fdn}cm, 210kgf/cm²)`, `'${p.formula_fdn_conc}`, p.q_fdn_conc.toFixed(2), (p.q_fdn_conc * p.L_tot_m).toFixed(2), 'M³'],
        ['基礎台臨水面嵌塊石及坡腳保護塊石', `'${p.formula_riprap_vol}`, p.q_riprap_vol.toFixed(2), (p.q_riprap_vol * p.L_tot_m).toFixed(2), 'M³']
      ];

      const csvContent = '\uFEFF' + rows.map(r => r.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `展開式蜂巢圍束網格緩坡護岸顯式列式計算書_0414-1.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }

    function initInteractions() {
      const canvas = document.getElementById('cadCanvas');
      if (!canvas) return;

      canvas.addEventListener('mousedown', (e) => {
        if (e.button !== 0) return;
        viewCam.isDragging = true;
        viewCam.dragStartX = e.clientX - viewCam.offsetX;
        viewCam.dragStartY = e.clientY - viewCam.offsetY;
      });

      window.addEventListener('mousemove', (e) => {
        if (!viewCam.isDragging) return;
        viewCam.offsetX = e.clientX - viewCam.dragStartX;
        viewCam.offsetY = e.clientY - viewCam.dragStartY;
        renderAll();
      });

      window.addEventListener('mouseup', () => {
        viewCam.isDragging = false;
      });

      canvas.addEventListener('wheel', (e) => {
        e.preventDefault();
        const rect = canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        const factor = e.deltaY < 0 ? 1.12 : 1 / 1.12;
        const nextScale = Math.max(0.25, Math.min(3.5, viewCam.scale * factor));
        viewCam.offsetX = mx - (mx - viewCam.offsetX) * (nextScale / viewCam.scale);
        viewCam.offsetY = my - (my - viewCam.offsetY) * (nextScale / viewCam.scale);
        viewCam.scale = nextScale;
        renderAll();
      }, { passive: false });

      window.addEventListener('resize', renderAll);
    }

    window.onload = function () {
      initInteractions();
      fitViewToScreen();
    };
  

  function cadLine(ctx, x1, y1, x2, y2, color, width, dash, layer) { O.push({ k: 'L', p: [[x1, -y1], [x2, -y2]], c: color, w: width || 1.3, d: dash || [], ly: layer || '0' }); }
  function cadPoly(ctx, pts, color, width, close, fill, dash, layer) { if (!pts || pts.length < 2) return; O.push({ k: 'P', p: pts.map(q => [q[0], -q[1]]), c: color, w: width || 1.5, f: fill || null, cl: close !== false, d: dash || [], ly: layer || '0' }); }
  function cadCircle(ctx, cx, cy, r, color, width, fill, dash, layer) { O.push({ k: 'C', x: cx, y: -cy, r, c: color, f: fill || null, w: width || 1.2, ly: layer || '0' }); }
  function cadText(ctx, str, x, y, size, color, align, weight, angleDeg, layer) { O.push({ k: 'T', x, y: -y, s: String(str), h: (size || 12) * 1.05, c: color || '#f8fafc', al: align || 'left', bl: 'middle', rot: -(angleDeg || 0) * Math.PI / 180, ly: layer || 'TEXT' }); }


  function __A(p) { let s = 0; for (let i = 0; i < p.length; i++) { const a = p[i], b = p[(i + 1) % p.length]; s += a[0] * b[1] - b[0] * a[1]; } return Math.abs(s) / 2; }
  const __n = (k, d) => { const v = parseFloat(RR ? RR[k] : undefined); return Number.isFinite(v) ? v : d; };
  function setInputs(R, keys) { keys.forEach(k => { if (R && R[k] !== undefined && R[k] !== null && R[k] !== '') el('inp_' + k).value = String(R[k]); else el('inp_' + k).value = ''; }); }
  function sheet(fn, s, m) { O = []; const PAL = getPalette(), p = Object.assign({}, m.p, m.OV); fn(p, PAL); const sc = 1 / s; return O.map(o => { const q = Object.assign({}, o); if (q.p) q.p = q.p.map(([x, y]) => [x * sc, y * sc]); if (q.x !== undefined) { q.x *= sc; q.y *= sc; } if (q.r) q.r *= sc; if (q.h) q.h *= sc; return q; }); }


  const KEYS = ['n_slope', 'H_slope', 'D_cell', 'W_cell', 'W_top', 'H_cov', 'W_toe_lap', 'sub_ratio', 'S_pin_slope', 'S_pin_long', 'S_tendon', 'L_pin', 'd_pin', 'N_cell_pin', 'B_fdn', 'H_fdn', 'L_draw_cm', 'L_tot_m'];
  function model(R) {
    RR = R || {}; setInputs(R, KEYS);
    try {
      const p = getParams(), dk = { hUp: 32, fa: 38, fb: 3, fc: 8, fd: 15, padOff: 4, kTr: 1.6, Vemb: 0.14, Vrip: 0.38 }; Object.keys(dk).forEach(k => { p[k] = __n(k, dk[k]); });
      const n = p.n_slope, Hs = p.H_slope, D = p.D_cell, Ws = Hs * n, Wt = p.W_top, Wl = p.W_toe_lap, B = p.B_fdn, Hf = p.H_fdn, kS = Math.hypot(1, n) / n, Ls = Math.hypot(Hs, Ws);
      // 斷面（cm）：原點＝坡腳轉折點（網格底）；x 往岸側、z 向上
      const fdn = [[-B, -(Hf - p.hUp)], [0, -(Hf - p.hUp)], [0, 0], [-Wl, 0], [-Wl, D], [0, D], [0, p.hUp], [-B + p.fa, p.hUp + p.fb], [-B + p.fc, D - p.fd]];
      const cell = [[-Wl, 0], [0, 0], [Ws, Hs], [Ws + Wt, Hs], [Ws + Wt, Hs + D], [Ws, Hs + D], [D / kS * 0, D], [-Wl, D]];
      const trench = [[Ws, Hs + D], [Ws + Wt, Hs + D], [Ws + Wt * (1 + (p.kTr - 1) / 2), Hs + D + p.H_cov], [Ws - Wt * (p.kTr - 1) / 2, Hs + D + p.H_cov]];
      const Lnet = Wl + Ls + Wt, sub = p.sub_ratio / 100, subL = sub * Ls + Wl, expL = (1 - sub) * Ls + Wt, nRow = Math.floor(Ls / p.S_pin_slope) + 1 + 2;
      const Afdn = __A(fdn) / 1e4, Atr = __A(trench) / 1e4, Q = { geo: Lnet / 100, pin: nRow * 100 / p.S_pin_long, tendon: 100 / p.S_tendon * Lnet / 100, subg: subL * D / 1e4, grass: expL / 100, top: expL * D / 1e4 + Atr, fdn: Math.max(0, Afdn - p.Vemb), rip: p.Vemb + p.Vrip, Afdn, Atr, Lnet, Ls };
      const f = (v, d) => (+v).toFixed(d === undefined ? 2 : d);
      const OV = { q_geocell_area: +Q.geo.toFixed(2), formula_geocell_area: `[坡底折入 ${f(Wl / 100)}＋斜坡長 √(${f(Hs / 100)}²＋${f(Ws / 100)}²)＝${f(Ls / 100)}＋坡頂 ${f(Wt / 100)}] × 1.00 m（圖面展開長）`,
        q_pin_cnt: +Q.pin.toFixed(2), formula_pin_cnt: `[斜坡 ${f(Ls, 0)}/${p.S_pin_slope}＋1＝${nRow - 2} 支＋坡頂／坡底 2 支] × 100/${p.S_pin_long}`,
        q_tendon_len: +Q.tendon.toFixed(2), formula_tendon_len: `(100/${p.S_tendon}) × 網格展開長 ${f(Lnet / 100)} m`,
        q_sub_gravel: +Q.subg.toFixed(3), formula_sub_gravel: `[浸水段斜長 ${p.sub_ratio}%×${f(Ls / 100)}＋坡底折入 ${f(Wl / 100)}＝${f(subL / 100)}] × 網格深 ${f(D / 100)}`,
        q_grass_area: +Q.grass.toFixed(2), formula_grass_area: `[出水段斜長 ${100 - p.sub_ratio}%×${f(Ls / 100)}＋坡頂 ${f(Wt / 100)}] × 1.00 m`,
        q_topsoil_vol: +Q.top.toFixed(3), formula_topsoil_vol: `網格內表土 ${f(expL / 100)}×${f(D / 100)}＋坡頂錨固溝覆土（圖面梯形 底 ${f(Wt / 100)}、頂 ${f(Wt * p.kTr / 100)}、高 ${f(p.H_cov / 100)}）${f(Atr, 3)}`,
        q_fdn_conc: +Q.fdn.toFixed(3), formula_fdn_conc: `圖面基礎台斷面量測 ${f(Afdn, 4)} m²（${B}×${Hf}，含錨固槽）－臨水嵌石 ${f(p.Vemb)}（原圖表值）`,
        q_riprap_vol: +Q.rip.toFixed(2), formula_riprap_vol: `臨水嵌塊石 ${f(p.Vemb)}＋坡腳保護塊石 ${f(p.Vrip)}（原圖數量表值，圖面未完整繪出）`, L_slope_cm: Math.round(Ls), W_slope_horiz: Math.round(Ws), L_net_cm: Math.round(Lnet) };
      const zBed = p.hUp - p.padOff, a = [-B + p.fc, D - p.fd], b = [-B + p.fa, p.hUp + p.fb], xBed = a[0] + (zBed - a[1]) / ((b[1] - a[1]) || 1e-9) * (b[0] - a[0]);
      return { p, OV, Q, fdn, cell, trench, zBed, xBed, zBot: -(Hf - p.hUp), H: Hs + D - zBed, D: zBed + (Hf - p.hUp), Ws, Wt, Hs, Dc: D, B };
    } finally { RR = null; }
  }
  function prims(m) { return sheet((p, PAL) => { const bSec = drawMainCrossSectionView(CTX, 25, 12, p, PAL), bPE = drawSynthesizedPlanAndElevationViews(CTX, bSec.rightX + 20, 12, p, PAL), bIso = drawFiveOriginalIsometricDetails(CTX, bPE.rightX + 20, 12, p, PAL); drawExplicitFormulaTableOnCanvas(CTX, 40, Math.max(bSec.bottomY, bPE.bottomY, bIso.bottomY) + 45, p, PAL);
    const Q = m.Q, y = -6; cadText(CTX, `斷面量測（每公尺）：網格展開長 ${(Q.Lnet / 100).toFixed(2)} m、斜坡長 ${(Q.Ls / 100).toFixed(2)} m、基礎台斷面 ${Q.Afdn.toFixed(3)} m²、坡頂錨固溝 ${Q.Atr.toFixed(3)} m²（網格厚於斷面圖放大繪示）`, 40, y, 11.5, '#fde047', 'left', '600', 0, 'NOTE'); }, 0.85, m); }

  return { model, prims };
})();
