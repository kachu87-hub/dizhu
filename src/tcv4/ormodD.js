/* v6.3 排水溝原圖移植（gen_dn.py 自動產生，勿手改） */
var TCO_D = window.TCO_D || (window.TCO_D = {});
TCO_D['dry'] = (function () {
  let O = [];
  const EL = {}, CTX = new Proxy({}, { get: (t, k) => (k in t ? t[k] : () => ({ width: 0 })), set: (t, k, v) => { t[k] = v; return true; } });
  const el = id => EL[id] || (EL[id] = { value: '', textContent: '', innerHTML: '', className: '', style: {}, classList: { add() {}, remove() {}, toggle() {} }, addEventListener() {}, getContext: () => CTX, parentElement: { getBoundingClientRect: () => ({ width: 100, height: 100 }) } });
  const document = { getElementById: el, querySelectorAll: () => [], querySelector: () => null, createElement: () => ({ click() {}, style: {} }), body: { appendChild() {}, removeChild() {}, classList: { add() {}, remove() {}, toggle() {}, contains: () => false } }, documentElement: { classList: { contains: () => false, add() {}, remove() {}, toggle() {} } }, addEventListener() {} };
  const window = { addEventListener() {}, devicePixelRatio: 1, matchMedia: () => ({ matches: false, addEventListener() {} }) };

    // =========================================================================
    // 1. ORIGINAL DXF BASELINE CONSTANTS & GLOBAL STATE (PURE ASCII IDENTIFIERS)
    // =========================================================================
    const ORIG_DRY_STONE_DITCH = {
      W_cm: 80,
      h2_cm: 55,
      h1_cm: 20,
      H_cm: 75,
      m_slope: 0.3,
      B_cm: 175,
      D_wall: 25,
      D_bed: 35,
      t_gravel: 20,
      use_bed_stone: 1,
      L_draw_cm: 300,
      L_tot_m: 30.0
    };

    let currentView = 'ALL'; // 'ALL', 'SECTION_ONLY', 'PLAN_PROFILE', 'SPEC'
    let showGhost = false;
    let isDarkTheme = true;

    let viewCam = {
      scale: 0.70,
      offsetX: 30,
      offsetY: 16,
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

      const W_cm = Math.max(40, num('inp_W_cm', 80));
      const h2_cm = Math.max(20, num('inp_h2_cm', 55));
      const h1_cm = Math.max(20, num('inp_h1_cm', 20));
      const H_cm = h1_cm + h2_cm; // Total ditch depth H (< 100cm per design rule)
      const m_slope = Math.max(0.2, num('inp_m_slope', 0.3));
      const D_wall = Math.max(20, num('inp_D_wall', 25)); // D20~30cm (avg 25cm)
      const D_bed = Math.max(30, num('inp_D_bed', 35));   // D30~40cm (avg 35cm)
      const t_gravel = Math.max(10, num('inp_t_gravel', 20)); // Backfill gravel thickness ~20cm
      const use_bed_stone = Math.round(num('inp_use_bed_stone', 1));
      const L_draw_cm = Math.max(150, num('inp_L_draw_cm', 300));
      const L_tot_m = Math.max(2.0, num('inp_L_tot_m', 30.0));

      // Top total ditch width B across outer edges of top coping stones:
      // Inner top width = W_cm + 2 * (H_cm * m_slope); plus 2 * D_wall
      const W_inner_top_cm = Math.round(W_cm + 2 * H_cm * m_slope);
      const B_cm = Math.round(W_inner_top_cm + 2 * D_wall);

      const elH = document.getElementById('inp_H_cm');
      if (elH) elH.value = H_cm;
      const elB = document.getElementById('inp_B_cm');
      if (elB) elB.value = B_cm;

      const p = {
        W_cm,
        h2_cm,
        h1_cm,
        H_cm,
        m_slope,
        W_inner_top_cm,
        B_cm,
        D_wall,
        D_bed,
        t_gravel,
        use_bed_stone,
        L_draw_cm,
        L_tot_m
      };

      const W_m = +(W_cm / 100).toFixed(2);
      const H_m = +(H_cm / 100).toFixed(2);
      const h1_m = +(h1_cm / 100).toFixed(2);
      const h2_m = +(h2_cm / 100).toFixed(2);
      const B_m = +(B_cm / 100).toFixed(2);
      const Dwall_m = +(D_wall / 100).toFixed(2);
      const Dbed_m = +(D_bed / 100).toFixed(2);
      const tgrv_m = +(t_gravel / 100).toFixed(2);

      // Slope length of side wall including bottom toe embedment (H_cm + D_bed):
      const slopeFactor = +Math.hypot(1, m_slope).toFixed(3); // sqrt(1 + 0.3^2) = 1.044
      const wallVertH_m = +((H_cm + (use_bed_stone ? D_bed : 15)) / 100).toFixed(2);
      const wallSlopeLen_m = +(wallVertH_m * slopeFactor).toFixed(2);

      // 1. 兩側塊石乾砌，長徑D20~30cm佔90%，其他佔10% (M³/m & M²/m):
      p.q_wall_stone_vol = +(2 * wallSlopeLen_m * Dwall_m * 1.0).toFixed(2);
      p.formula_wall_stone_vol = `2側 * [斜長(${wallVertH_m.toFixed(2)}m*√(1²+${m_slope}²)=${wallSlopeLen_m.toFixed(2)}m) * 均厚(${D_wall}/100=${Dwall_m.toFixed(2)}m)] * 1.00m`;

      p.q_wall_stone_area = +(2 * (H_m * slopeFactor) * 1.0).toFixed(2);
      p.formula_wall_stone_area = `2側 * [溝深H(${H_m.toFixed(2)}m) * √(1²+${m_slope}²)=${(H_m * slopeFactor).toFixed(2)}m] * 1.00m`;

      // 2. 溝底塊石長徑D30~40cm佔90%，其他佔10% (M³/m):
      p.q_bed_stone_vol = use_bed_stone ? +(W_m * Dbed_m * 1.0).toFixed(2) : 0.00;
      p.formula_bed_stone_vol = use_bed_stone
        ? `溝底寬W(${W_m.toFixed(2)}m) * 塊石長徑(${D_bed}/100=${Dbed_m.toFixed(2)}m) * 1.00m`
        : `依現地河床質條件不鋪設溝底塊石 = 0.00`;

      // 3. 背填碎石厚約20cm (10cm以下級配良好石材) (M³/m):
      const grvPerim_m = +(2 * (wallSlopeLen_m + 0.04) + W_m + 2 * Dwall_m * 0.65).toFixed(2);
      p.q_gravel_vol = +(grvPerim_m * tgrv_m * 1.0).toFixed(2);
      p.formula_gravel_vol = `[兩側背填(2*${(wallSlopeLen_m + 0.04).toFixed(2)}m) + 溝底墊層(${(W_m + 2 * Dwall_m * 0.65).toFixed(2)}m) = ${grvPerim_m.toFixed(2)}m] * 厚(${t_gravel}/100=${tgrv_m.toFixed(2)}m)`;

      // 4. 底土土壤壓實 (壓實度應達80%以上) (M²/m):
      p.q_compact_area = +((grvPerim_m + 2 * tgrv_m * 1.65) * 1.0).toFixed(2);
      p.formula_compact_area = `[開挖外廓底寬(${(W_m + 2 * Dwall_m + 2 * tgrv_m).toFixed(2)}m) + 兩側開挖斜邊(2*${(wallSlopeLen_m + 0.25).toFixed(2)}m)] * 1.00m`;

      // Dynamic Stone Counts (Strictly proportional so stones NEVER stretch!)
      p.nWallStonesPerSide = Math.max(3, Math.round((H_cm + D_bed) / 22)); // 5 stones per side in original DXF!
      p.nBedStonesAcross = use_bed_stone ? Math.max(2, Math.round(W_cm / 20)) : 0; // 4 stones across bed in original DXF!

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
          stoneOutline: '#fb923c',
          stoneFill: 'rgba(249, 115, 22, 0.22)',
          bedStoneOutline: '#facc15',
          bedStoneFill: 'rgba(234, 179, 8, 0.20)',
          gravelDot: '#cbd5e1',
          gravelFill: 'rgba(148, 163, 184, 0.12)',
          soilHatch: '#e879f9',
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
          stoneOutline: '#c2410c',
          stoneFill: 'rgba(253, 186, 116, 0.35)',
          bedStoneOutline: '#854d0e',
          bedStoneFill: 'rgba(254, 240, 138, 0.40)',
          gravelDot: '#475569',
          gravelFill: 'rgba(226, 232, 240, 0.45)',
          soilHatch: '#a21caf',
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
        cadCircle(ctx, tx, ty, 2.4, pal.leaderLine, 1.0, pal.leaderLine, [], 'LEADER_DOT');
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

    function cadDim(ctx, x1, y1, x2, y2, offset, labelStr, pal, fontSize = 11.5) {
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

    // Draw an oriented natural boulder (長徑 perpendicular to slope face per 注意事項3!)
    function drawOrientedBoulder(ctx, cx, cy, rLong, rShort, angleRad, seed, strokeCol, fillCol, layer = 'STONE') {
      const nV = 9;
      const cosA = Math.cos(angleRad), sinA = Math.sin(angleRad);
      const pts = [];
      for (let i = 0; i < nV; i++) {
        const a = (i / nV) * Math.PI * 2;
        const jit = 0.88 + 0.14 * Math.sin(seed * 3.7 + i * 2.3);
        const lx = Math.cos(a) * rLong * jit;
        const ly = Math.sin(a) * rShort * jit;
        pts.push([
          cx + lx * cosA - ly * sinA,
          cy + lx * sinA + ly * cosA
        ]);
      }
      cadPoly(ctx, pts, strokeCol, 1.35, true, fillCol, [], layer);
    }

    // =========================================================================
    // 4. VIEW 1: 斷面圖 (MAIN CROSS-SECTION VIEW OF DRY STONE DITCH)
    //    100% Faithful to DXF Model Space (X ≈ 3761..4080, Y ≈ 2042..2205):
    //    - Natural sloped terrain lines (EC3E, ED40) & top grass arcs (ED8F..EEEA) are 100% STRIPPED!
    //    - Trapezoidal Dry Stone Ditch:
    //      * Top width B (*D11), Bottom width W (*D12), Total depth H (*D15) = h1 (*D13) + h2 (*D14)
    //      * Side slope 1 : 0.3 triangle (EFF8..EFFA)
    //      * Water surface line ▽ at depth h1 below top crest (EF3D..EF41)
    //      * Left & Right Dry Stone Walls: boulders with long axis (D20~30cm) perpendicular to 1:0.3 face,
    //        tapering slightly upward per 設計原則6 ("砌石長徑均應依序向上縮減")
    //      * Ditch Bed Boulders: vertical boulders (D30~40cm, FA8E, FA8F, EC5C, EC5D, F009)
    //      * 20cm Graded Gravel Backfill (背填碎石厚約20cm, EB66..EFF7) around outer perimeter
    //      * Compacted Subgrade Soil Hatch (底土土壤壓實, F943..F94E)
    // =========================================================================
    function drawMainCrossSectionView(ctx, ox, topY, p, pal) {
      const s = 1.45; // Scale: 1 cm = 1.45 px

      const W = p.W_cm * s;               // 80 * s
      const h1 = p.h1_cm * s;             // 20 * s
      const h2 = p.h2_cm * s;             // 55 * s
      const H = p.H_cm * s;               // 75 * s
      const m = p.m_slope;                // 0.3
      const dx_slope = H * m;             // 22.5 * s
      const D_wall = p.D_wall * s;        // 25 * s
      const D_bed = p.D_bed * s;          // 35 * s
      const t_grv = p.t_gravel * s;       // 20 * s

      const cx = ox + 305;
      const yTop = topY + 68;             // Top crest of ditch (top of h1)
      const yWater = yTop + h1;           // Design water level (top of h2)
      const yBedTop = yTop + H;           // Ditch invert / top of bed boulders
      const yBedBot = yBedTop + (p.use_bed_stone ? D_bed : p.nb0 * s);
      const yGrvBot = yBedBot + t_grv;    // Bottom of 20cm gravel bedding

      // Key X coordinates symmetric about cx
      const xBedInL = cx - W / 2;
      const xBedInR = cx + W / 2;
      const xTopInL = xBedInL - dx_slope;
      const xTopInR = xBedInR + dx_slope;

      const xTopOutL = xTopInL - D_wall * p.kt;
      const xTopOutR = xTopInR + D_wall * p.kt;

      const xBotOutL = xBedInL - D_wall * p.kb;
      const xBotOutR = xBedInR + D_wall * p.kb;

      const xGrvTopL = xTopOutL - t_grv;
      const xGrvTopR = xTopOutR + t_grv;
      const xGrvBotL = xBotOutL - t_grv;
      const xGrvBotR = xBotOutR + t_grv;

      // 0. Ghost Baseline (Original W=80, H=75, B=175)
      if (showGhost) {
        const gW = 80 * s, gH = 75 * s, gdx = gH * 0.3, gDw = 25 * s;
        cadPoly(ctx, [
          [cx - gW / 2 - gdx - gDw, yTop],
          [cx - gW / 2 - gdx, yTop],
          [cx - gW / 2, yTop + gH],
          [cx + gW / 2, yTop + gH],
          [cx + gW / 2 + gdx, yTop],
          [cx + gW / 2 + gdx + gDw, yTop],
          [cx + gW / 2 + gDw * 1.15, yTop + gH + 35 * s],
          [cx - gW / 2 - gDw * 1.15, yTop + gH + 35 * s]
        ], pal.ghostLine, 1.1, true, null, [4, 4], 'GHOST_DITCH');
      }

      // =====================================================================
      // 1. OUTER EXCAVATION BOUNDARY & 20cm GRADED GRAVEL BACKFILL (背填碎石厚約20cm, EFFC & EB66..EFF7)
      //    Natural hillside terrain lines (EC3E, ED40) are 100% STRIPPED!
      // =====================================================================
      const gravelOuterPts = [
        [xGrvTopL, yTop],
        [xTopOutL, yTop],
        [xBotOutL, yBedBot],
        [xBotOutR, yBedBot],
        [xTopOutR, yTop],
        [xGrvTopR, yTop],
        [xGrvBotR, yGrvBot],
        [xGrvBotL, yGrvBot]
      ];
      cadPoly(ctx, gravelOuterPts, '#ef4444', 1.45, true, pal.gravelFill, [], 'GRAVEL_BACKFILL_BOUND');

      // Fill the 20cm Gravel Backfill Zone with small angular crushed gravel stones (<10cm, matching DXF EB66..EFF7)
      // Left gravel wing
      const nGrvSteps = 14;
      for (let i = 0; i < nGrvSteps; i++) {
        const f = (i + 0.5) / nGrvSteps;
        const lxIn = xTopOutL + f * (xBotOutL - xTopOutL);
        const lxOut = xGrvTopL + f * (xGrvBotL - xGrvTopL);
        const ly = yTop + f * (yGrvBot - yTop);
        drawOrientedBoulder(ctx, (lxIn + lxOut) / 2 - 3, ly, 4.5, 3.2, i * 0.7, i + 11, pal.gravelDot, 'rgba(148,163,184,0.25)', 'GRAVEL_STONE');
        drawOrientedBoulder(ctx, (lxIn + lxOut) / 2 + 4, ly + 3, 3.8, 2.8, -i * 0.5, i + 29, pal.gravelDot, null, 'GRAVEL_STONE');

        const rxIn = xTopOutR + f * (xBotOutR - xTopOutR);
        const rxOut = xGrvTopR + f * (xGrvBotR - xGrvTopR);
        drawOrientedBoulder(ctx, (rxIn + rxOut) / 2 - 3, ly, 4.5, 3.2, -i * 0.7, i + 41, pal.gravelDot, 'rgba(148,163,184,0.25)', 'GRAVEL_STONE');
        drawOrientedBoulder(ctx, (rxIn + rxOut) / 2 + 4, ly + 3, 3.8, 2.8, i * 0.5, i + 59, pal.gravelDot, null, 'GRAVEL_STONE');
      }
      // Bottom gravel bedding under ditch bed
      const nGrvBot = Math.max(10, Math.round((xGrvBotR - xGrvBotL) / 14));
      for (let i = 0; i < nGrvBot; i++) {
        const gx = xGrvBotL + 8 + (i + 0.5) * ((xGrvBotR - xGrvBotL - 16) / nGrvBot);
        const gy = (yBedBot + yGrvBot) / 2;
        drawOrientedBoulder(ctx, gx, gy - 3, 4.8, 3.2, (i % 3) * 0.4, i + 83, pal.gravelDot, 'rgba(148,163,184,0.25)', 'GRAVEL_BED');
        drawOrientedBoulder(ctx, gx + 3, gy + 4, 3.8, 2.6, -(i % 2) * 0.5, i + 101, pal.gravelDot, null, 'GRAVEL_BED');
      }

      // Compacted Subgrade Soil Hatch Symbol (底土土壤壓實, matching DXF F943..F94E)
      const hx0 = cx + W * 0.25;
      const hy0 = yGrvBot;
      for (let k = 0; k < 4; k++) {
        cadLine(ctx, hx0 + k * 5, hy0, hx0 + k * 5 - 7, hy0 + 8, pal.soilHatch, 1.15, [], 'SOIL_COMPACT_HATCH');
        cadLine(ctx, hx0 + 10 + k * 4.5, hy0 + 8, hx0 + 14 + k * 4.5, hy0 + 2, pal.soilHatch, 1.15, [], 'SOIL_COMPACT_HATCH');
      }

      // =====================================================================
      // 2. DITCH BED BOULDERS (溝底塊石長徑 D30~40cm, Vertical orientation per FA8E..F009)
      // =====================================================================
      if (p.use_bed_stone) {
        const nBed = p.nBedStonesAcross;
        const bedStepW = W / nBed;
        for (let i = 0; i < nBed; i++) {
          const bx = xBedInL + (i + 0.5) * bedStepW;
          const by = (yBedTop + yBedBot) / 2;
          drawOrientedBoulder(
            ctx,
            bx, by,
            D_bed * 0.48, bedStepW * 0.47,
            Math.PI / 2 + ((i % 2 === 0 ? 1 : -1) * 0.05),
            i * 17 + 5,
            pal.bedStoneOutline, pal.bedStoneFill,
            'BED_BOULDER_30_40'
          );
        }
      } else {
        cadLine(ctx, xBedInL, yBedTop, xBedInR, yBedTop, pal.primaryLine, 1.6, [6, 4], 'NATURAL_BED');
      }

      // =====================================================================
      // 3. LEFT & RIGHT DRY STONE SIDE WALLS (兩側塊石乾砌 D20~30cm, Long axis ⊥ 1:0.3 wall face!)
      //    Per 設計原則6: "砌石長徑均應依序向上縮減" (Stones taper slightly from bottom to top!)
      // =====================================================================
      const nWall = p.nWallStonesPerSide;
      const wallAngleL = Math.atan2(dx_slope, H); // Angle of 1:0.3 wall from vertical (~16.7 deg)

      for (let i = 0; i < nWall; i++) {
        // i = 0 is bottom stone, i = nWall - 1 is top crest stone
        const frac = (i + 0.5) / nWall;
        const taper = 1.14 - frac * 0.24; // Bottom stones larger (~1.14*D_wall), top stones smaller (~0.90*D_wall)
        const rLong = (D_wall * 0.49) * taper;
        const rShort = ((yBedBot - yTop) / nWall) * 0.47;

        const wy = yBedBot - frac * (yBedBot - yTop);
        // Inner face X at elevation wy
        const lxIn = (wy <= yBedTop)
          ? (xTopInL + ((wy - yTop) / H) * (xBedInL - xTopInL))
          : xBedInL;
        const lxCenter = lxIn - rLong * 0.92;
        drawOrientedBoulder(
          ctx,
          lxCenter, wy,
          rLong, rShort,
          -wallAngleL,
          i * 23 + 7,
          pal.stoneOutline, pal.stoneFill,
          'WALL_BOULDER_L'
        );

        const rxIn = (wy <= yBedTop)
          ? (xTopInR - ((wy - yTop) / H) * (xTopInR - xBedInR))
          : xBedInR;
        const rxCenter = rxIn + rLong * 0.92;
        drawOrientedBoulder(
          ctx,
          rxCenter, wy,
          rLong, rShort,
          wallAngleL,
          i * 23 + 19,
          pal.stoneOutline, pal.stoneFill,
          'WALL_BOULDER_R'
        );
      }

      // =====================================================================
      // 4. DESIGN WATER LEVEL ▽ (水深 h2 / 出水高 h1, matching DXF EF3D..EF41)
      // =====================================================================
      const xWaterL = xTopInL + (h1 / H) * dx_slope;
      const xWaterR = xTopInR - (h1 / H) * dx_slope;
      cadLine(ctx, xWaterL + 4, yWater, xWaterR - 4, yWater, pal.waterLine, 1.55, [], 'WATER_SURFACE');
      const wx = cx + 6;
      cadPoly(ctx, [[wx - 5.5, yWater - 8.5], [wx + 5.5, yWater - 8.5], [wx, yWater]], pal.waterLine, 1.25, true, null, [], 'WATER_TRI');
      cadLine(ctx, wx - 9, yWater + 3.5, wx + 9, yWater + 3.5, pal.waterLine, 1.05);
      cadLine(ctx, wx - 5.5, yWater + 6.5, wx + 5.5, yWater + 6.5, pal.waterLine, 1.05);

      // =====================================================================
      // 5. SLOPE TRIANGLE (1 : 0.3, matching DXF EFF8..EFFA)
      // =====================================================================
      const triX = xGrvBotR + 18;
      const triY = yBedTop - H * 0.25;
      const triH = 22;
      const triW = triH * m;
      cadPoly(ctx, [
        [triX, triY],
        [triX + triW, triY],
        [triX + triW, triY - triH]
      ], pal.secondaryLine, 1.2, true, null, [], 'SLOPE_TRIANGLE');
      cadText(ctx, '1', triX + triW + 7, triY - triH / 2, 11, pal.titleCyan, 'left', '700');
      cadText(ctx, `${m}`, triX + triW / 2, triY + 9, 10.5, pal.titleCyan, 'center', '700');

      // =====================================================================
      // 6. ALL DIMENSIONS & CALLOUTS ON CROSS-SECTION (100% Matching DXF *D11..*D15, F00D, F185, F186, F95E)
      // =====================================================================
      // (1) Top Ditch Width: B (*D11)
      cadDim(ctx, xTopOutL, yTop, xTopOutR, yTop, -28, `B (${p.B_cm}cm)`, pal, 11.5);

      // (2) Bottom Ditch Width: W (*D12)
      cadLine(ctx, xBedInL, yBedBot + 4, xBedInL, yGrvBot + 26, pal.dimLine, 0.95);
      cadLine(ctx, xBedInR, yBedBot + 4, xBedInR, yGrvBot + 26, pal.dimLine, 0.95);
      cadDim(ctx, xBedInL, yGrvBot + 18, xBedInR, yGrvBot + 18, 0, `W (${p.W_cm}cm)`, pal, 11.5);

      // (3) Left Vertical Heights: h1 (出水高) & h2 (水深) (*D13 & *D14)
      const xDimH12 = xGrvTopL - 28;
      cadLine(ctx, xTopOutL - 4, yTop, xDimH12 - 6, yTop, pal.dimLine, 0.95);
      cadLine(ctx, xWaterL - 4, yWater, xDimH12 - 6, yWater, pal.dimLine, 0.95);
      cadLine(ctx, xBedInL - 4, yBedTop, xDimH12 - 6, yBedTop, pal.dimLine, 0.95);
      cadDim(ctx, xDimH12, yTop, xDimH12, yWater, 0, `h1 (${p.h1_cm})`, pal, 10.5);
      cadDim(ctx, xDimH12, yWater, xDimH12, yBedTop, 0, `h2 (${p.h2_cm})`, pal, 11);

      // (4) Outer Left Total Ditch Depth: H = h1 + h2 (<1m) (*D15)
      const xDimH = xDimH12 - 42;
      cadLine(ctx, xDimH12 - 6, yTop, xDimH - 6, yTop, pal.dimLine, 0.95);
      cadLine(ctx, xDimH12 - 6, yBedTop, xDimH - 6, yBedTop, pal.dimLine, 0.95);
      cadDim(ctx, xDimH, yTop, xDimH, yBedTop, 0, `H (${p.H_cm}cm)`, pal, 11.5);

      // (5) Callout 1 (Right Upper): 兩側塊石乾砌，長徑D20~30cm佔90%，其他佔10% (ED8C, F186)
      cadLeaderDot(
        ctx,
        xTopOutR - D_wall * 0.35, yTop + H * 0.38,
        xGrvTopR + 28, yTop + H * 0.38,
        xGrvTopR + 42, yTop + H * 0.38,
        ['兩側塊石乾砌，長徑', `D20~30cm(均${p.D_wall}cm)佔90%，`, '其他佔10%'],
        pal, true, 11
      );

      // (6) Callout 2 (Right Middle): 背填碎石厚約20cm，視當地之地質狀況設計 (ED8A, F185)
      cadLeaderDot(
        ctx,
        xGrvBotR - t_grv * 0.45, yBedBot + t_grv * 0.35,
        xGrvTopR + 28, yBedBot + t_grv * 0.35,
        xGrvTopR + 42, yBedBot + t_grv * 0.35,
        [`背填碎石厚約${p.t_gravel}cm，視當`, '地之地質狀況設計'],
        pal, true, 11
      );

      // (7) Callout 3 (Right Bottom): 底土土壤壓實 (F95D, F95E)
      cadLeaderDot(
        ctx,
        hx0 + 6, hy0 + 4,
        hx0 + 36, hy0 + 28,
        xGrvTopR + 42, hy0 + 28,
        ['底土土壤壓實 (壓實度≧80%)'],
        pal, true, 11
      );

      // (8) Callout 4 (Left Bottom): 溝底塊石長徑D30~40cm佔90%，其他佔10%，溝底是否採用塊石鋪底，可視當地河床質條件而決定之 (ED8E, F00D)
      cadLeaderDot(
        ctx,
        cx - W * 0.25, (yBedTop + yBedBot) / 2,
        xGrvBotL - 18, yGrvBot + 16,
        xGrvBotL - 30, yGrvBot + 16,
        [
          `溝底塊石長徑D30~40cm(${p.D_bed}cm)佔`,
          '90%，其他佔10%，溝底是',
          '否採用塊石鋪底，可視當',
          '地河床質條件而決定之'
        ],
        pal, true, 10.8
      );

      // =====================================================================
      // 7. SYMBOL LEGEND BOX (符號說明：B, W, H, h1, h2, matching DXF FAB4)
      // =====================================================================
      const legX = xGrvTopR + 42;
      const legY = yTop - 52;
      cadPoly(ctx, [
        [legX, legY],
        [legX + 188, legY],
        [legX + 188, legY + 124],
        [legX, legY + 124]
      ], pal.tableBorder, 1.1, true, 'rgba(15, 23, 42, 0.85)', [], 'SYMBOL_LEGEND');
      cadText(ctx, '符號說明：', legX + 10, legY + 16, 11.5, pal.titleCyan, 'left', '700');
      const symLines = [
        `B   溝寬 (${p.B_cm}cm)`,
        `W   溝底寬 (${p.W_cm}cm)`,
        `H   溝深 (<1m, 當前${p.H_cm}cm)`,
        `h1  出水高 (≧20cm, 當前${p.h1_cm}cm)`,
        `h2  水深 (${p.h2_cm}cm)`
      ];
      symLines.forEach((st, idx) => {
        cadText(ctx, st, legX + 14, legY + 36 + idx * 19, 10.5, pal.textMain, 'left', '600');
      });

      // Section Title with Double Underline: 斷面圖 (9AA4, 9AA9, 9AAA)
      const secTitleY = yGrvBot + 58;
      cadText(ctx, '斷面圖 (乾砌石溝)', cx, secTitleY, 17, pal.titleCyan, 'center', '700', 0, 'TITLE');
      cadLine(ctx, cx - 72, secTitleY + 11, cx + 72, secTitleY + 11, pal.titleCyan, 1.5);
      cadLine(ctx, cx - 72, secTitleY + 14.5, cx + 72, secTitleY + 14.5, pal.titleCyan, 1.0);

      return {
        rightX: legX + 205,
        bottomY: secTitleY + 28
      };
    }

    // =========================================================================
    // 5. VIEW 2 (MANDATORY SKILL RULE 1): 自動補齊之 1:1 垂直對齊【俯視平面圖】與【縱斷面展開圖】
    //    - 俯視平面圖 (Top): 呈現全長 L_draw_cm 之梯形乾砌石溝：
    //      * 上下兩側 20cm 背填碎石帶
    //      * 上下兩側 1:0.3 乾砌塊石溝壁 (D20~30cm，五六圍砌交錯排列，顆數隨長度自動增減)
    //      * 中央溝底寬 W 之溝底鋪設塊石 (D30~40cm，緊密排列並以小卵石填縫) 與水流方向箭頭
    //    - 縱斷面展開圖 (Bottom, 1:1 垂直對齊): 呈現石溝中心縱剖面 (坡度 ≦6%)：
    //      * 上部側壁塊石立面分層砌築、設計水位線 ▽ (水深 h2，出水高 h1)
    //      * 溝底塊石層 (D30~40cm)、底部 20cm 碎石墊層與壓實度 ≧80% 底土層
    // =========================================================================
    function drawSynthesizedPlanAndProfileViews(ctx, ox, topY, p, pal) {
      const s = 0.88;
      const L_draw_cm = p.L_draw_cm; // 300 cm
      const L_px = L_draw_cm * s;

      const x0 = ox + 72;
      const x1 = x0 + L_px;

      // ---------------------------------------------------------------------
      // PART A: 乾砌石溝【俯視平面圖】 (TOP PLAN VIEW - 1:1 ALIGNED)
      // ---------------------------------------------------------------------
      const wGrv = p.t_gravel * s;                 // 20 * s
      const wWallHoriz = (p.D_wall + p.H_cm * p.m_slope) * s; // (25 + 22.5) * s
      const wBed = p.W_cm * s;                     // 80 * s

      const yPlan0 = topY + 46;                    // Top outer edge of left gravel backfill
      const yWallTopOut = yPlan0 + wGrv;           // Outer crest of left stone wall
      const yBedTop = yWallTopOut + wWallHoriz;    // Top edge of ditch bed (W)
      const yBedBot = yBedTop + wBed;              // Bottom edge of ditch bed (W)
      const yWallBotOut = yBedBot + wWallHoriz;    // Outer crest of right stone wall
      const yPlanBot = yWallBotOut + wGrv;         // Bottom outer edge of right gravel backfill

      // 1) Top & Bottom 20cm Gravel Backfill Strips in Plan View
      cadPoly(ctx, [[x0, yPlan0], [x1, yPlan0], [x1, yWallTopOut], [x0, yWallTopOut]], '#ef4444', 1.25, true, pal.gravelFill, [], 'PLAN_GRV_TOP');
      cadPoly(ctx, [[x0, yWallBotOut], [x1, yWallBotOut], [x1, yPlanBot], [x0, yPlanBot]], '#ef4444', 1.25, true, pal.gravelFill, [], 'PLAN_GRV_BOT');

      const nGrvPlan = Math.max(12, Math.round(L_draw_cm / 18));
      const grvStep = L_px / nGrvPlan;
      for (let i = 0; i < nGrvPlan; i++) {
        const gx = x0 + (i + 0.5) * grvStep;
        drawOrientedBoulder(ctx, gx, (yPlan0 + yWallTopOut) / 2, grvStep * 0.38, wGrv * 0.35, i * 0.4, i + 15, pal.gravelDot, null, 'PLAN_GRV_STONE');
        drawOrientedBoulder(ctx, gx, (yWallBotOut + yPlanBot) / 2, grvStep * 0.38, wGrv * 0.35, -i * 0.4, i + 35, pal.gravelDot, null, 'PLAN_GRV_STONE');
      }

      // 2) Left & Right Sloped Dry Stone Side Walls in Plan View (D20~30cm, 五六圍砌無通縫)
      cadPoly(ctx, [[x0, yWallTopOut], [x1, yWallTopOut], [x1, yBedTop], [x0, yBedTop]], pal.stoneOutline, 1.4, true, pal.stoneFill, [], 'PLAN_WALL_L');
      cadPoly(ctx, [[x0, yBedBot], [x1, yBedBot], [x1, yWallBotOut], [x0, yWallBotOut]], pal.stoneOutline, 1.4, true, pal.stoneFill, [], 'PLAN_WALL_R');

      const nColsWall = Math.max(8, Math.round(L_draw_cm / p.D_wall));
      const colW_wall = L_px / nColsWall;
      for (let r = 0; r < 2; r++) {
        const stag = (r % 2 === 1) ? colW_wall * 0.45 : 0;
        const wyL = yWallTopOut + (r + 0.5) * (wWallHoriz / 2);
        const wyR = yBedBot + (r + 0.5) * (wWallHoriz / 2);
        for (let c = 0; c < nColsWall; c++) {
          const wx = x0 + (c + 0.5) * colW_wall + stag;
          if (wx + colW_wall * 0.42 <= x1 + 2) {
            drawOrientedBoulder(ctx, wx, wyL, colW_wall * 0.45, (wWallHoriz / 2) * 0.44, (c % 2) * 0.15, r * 19 + c, pal.stoneOutline, pal.stoneFill, 'PLAN_WALL_BOULDER');
            drawOrientedBoulder(ctx, wx, wyR, colW_wall * 0.45, (wWallHoriz / 2) * 0.44, -(c % 2) * 0.15, r * 29 + c, pal.stoneOutline, pal.stoneFill, 'PLAN_WALL_BOULDER');
          }
        }
      }

      // 3) Ditch Bed Boulders in Plan View (溝底塊石 D30~40cm, 緊密排列填縫)
      cadPoly(ctx, [[x0, yBedTop], [x1, yBedTop], [x1, yBedBot], [x0, yBedBot]], pal.bedStoneOutline, 1.45, true, 'rgba(15, 23, 42, 0.65)', [], 'PLAN_BED_ZONE');

      if (p.use_bed_stone) {
        const nColsBed = Math.max(6, Math.round(L_draw_cm / p.D_bed));
        const nRowsBed = Math.max(2, Math.round(p.W_cm / (p.D_bed * 0.85)));
        const colW_bed = L_px / nColsBed;
        const rowH_bed = wBed / nRowsBed;

        for (let r = 0; r < nRowsBed; r++) {
          const stag = (r % 2 === 1) ? colW_bed * 0.35 : 0;
          const by = yBedTop + (r + 0.5) * rowH_bed;
          for (let c = 0; c < nColsBed; c++) {
            const bx = x0 + (c + 0.5) * colW_bed + stag;
            if (bx + colW_bed * 0.42 <= x1 + 2) {
              drawOrientedBoulder(ctx, bx, by, colW_bed * 0.46, rowH_bed * 0.45, ((r + c) % 2) * 0.12, r * 31 + c + 7, pal.bedStoneOutline, pal.bedStoneFill, 'PLAN_BED_BOULDER');
              // Small interstitial chink stone (小石子緊密填縫 per 注意事項2)
              if (c < nColsBed - 1 && r < nRowsBed - 1) {
                cadCircle(ctx, bx + colW_bed * 0.48, by + rowH_bed * 0.48, 2.2, pal.gravelDot, 0.9, pal.gravelDot, [], 'CHINK_PEBBLE');
              }
            }
          }
        }
      }

      // Flow Arrow in Plan View
      const flowX = (x0 + x1) / 2;
      const flowY = (yBedTop + yBedBot) / 2;
      cadLine(ctx, flowX - 38, flowY, flowX + 38, flowY, pal.waterLine, 1.8, [], 'FLOW_ARROW');
      cadLine(ctx, flowX + 38, flowY, flowX + 27, flowY - 4.5, pal.waterLine, 1.8, [], 'FLOW_ARROW');
      cadLine(ctx, flowX + 38, flowY, flowX + 27, flowY + 4.5, pal.waterLine, 1.8, [], 'FLOW_ARROW');
      cadText(ctx, '水流方向 (坡度≦6%)', flowX, flowY - 12, 11, pal.waterLine, 'center', '700');

      // Dimensions on Plan View
      cadDim(ctx, x0, yPlan0, x1, yPlan0, -22, `展示長 L = ${L_draw_cm}cm (五圍砌或六圍砌・卵石緊密填縫)`, pal, 11);
      cadDim(ctx, x0, yBedTop, x0, yBedBot, -22, `W=${p.W_cm}`, pal, 10.5);
      cadDim(ctx, x0 - 24, yWallTopOut, x0 - 24, yWallBotOut, -22, `B=${p.B_cm}`, pal, 10.5);

      // Right Labels on Plan View
      cadText(ctx, `← 背填級配碎石 (厚${p.t_gravel}cm, <10cm石材)`, x1 + 12, (yPlan0 + yWallTopOut) / 2, 10.5, pal.textSub, 'left', '600');
      cadText(ctx, `← 1:${p.m_slope} 乾砌塊石溝壁 (D20~30cm)`, x1 + 12, (yWallTopOut + yBedTop) / 2, 10.5, pal.stoneOutline, 'left', '600');
      cadText(ctx, `← 溝底寬 W=${p.W_cm}cm (D30~40cm塊石鋪底)`, x1 + 12, (yBedTop + yBedBot) / 2, 10.5, pal.bedStoneOutline, 'left', '600');

      const planTitleY = yPlanBot + 28;
      cadText(ctx, '俯視平面圖 (自動補齊・1:1垂直對齊)', (x0 + x1) / 2, planTitleY, 15.5, pal.titleCyan, 'center', '700');
      cadLine(ctx, (x0 + x1) / 2 - 115, planTitleY + 10, (x0 + x1) / 2 + 115, planTitleY + 10, pal.titleCyan, 1.3);

      // ---------------------------------------------------------------------
      // PART B: 乾砌石溝【縱斷面展開圖】 (LONGITUDINAL PROFILE - 1:1 ALIGNED)
      // ---------------------------------------------------------------------
      const yProfTop = planTitleY + 46;
      const h1_px = p.h1_cm * s * 1.15;
      const h2_px = p.h2_cm * s * 1.15;
      const H_px = h1_px + h2_px;
      const dBed_px = (p.use_bed_stone ? p.D_bed : 8) * s * 1.05;
      const tGrv_px = p.t_gravel * s * 1.05;

      const yProfWater = yProfTop + h1_px;
      const yProfBedTop = yProfTop + H_px;
      const yProfBedBot = yProfBedTop + dBed_px;
      const yProfGrvBot = yProfBedBot + tGrv_px;

      // 1:1 Vertical Alignment Dashed Guides between Plan View and Profile View
      cadLine(ctx, x0, yPlanBot + 4, x0, yProfTop - 6, pal.secondaryLine, 0.85, [4, 4], 'ALIGN_GUIDE');
      cadLine(ctx, x1, yPlanBot + 4, x1, yProfTop - 6, pal.secondaryLine, 0.85, [4, 4], 'ALIGN_GUIDE');

      // 1) Side Wall Courssd Dry Stone Elevation in Background of Longitudinal Profile (分層砌築)
      cadPoly(ctx, [[x0, yProfTop], [x1, yProfTop], [x1, yProfBedTop], [x0, yProfBedTop]], pal.stoneOutline, 1.4, true, 'rgba(30, 41, 59, 0.45)', [], 'PROF_WALL_BG');

      const nRowsElev = Math.max(3, Math.round(p.H_cm / 22));
      const rowH_elev = H_px / nRowsElev;
      const nColsElev = Math.max(9, Math.round(L_draw_cm / p.D_wall));
      const colW_elev = L_px / nColsElev;

      for (let r = 0; r < nRowsElev; r++) {
        const stag = (r % 2 === 1) ? colW_elev * 0.48 : 0;
        const ey = yProfTop + (r + 0.5) * rowH_elev;
        for (let c = 0; c < nColsElev; c++) {
          const ex = x0 + (c + 0.5) * colW_elev + stag;
          if (ex + colW_elev * 0.44 <= x1 + 2) {
            drawOrientedBoulder(ctx, ex, ey, colW_elev * 0.46, rowH_elev * 0.45, 0, r * 17 + c + 3, pal.stoneOutline, pal.stoneFill, 'PROF_WALL_STONE');
          }
        }
      }

      // 2) Design Water Line ▽ in Longitudinal Profile (出水高 h1 / 水深 h2)
      cadLine(ctx, x0 - 12, yProfWater, x1 + 12, yProfWater, pal.waterLine, 1.55, [8, 4], 'PROF_WATER');

      // 3) Ditch Bed Boulders Layer (D30~40cm) in Longitudinal Profile
      if (p.use_bed_stone) {
        cadPoly(ctx, [[x0, yProfBedTop], [x1, yProfBedTop], [x1, yProfBedBot], [x0, yProfBedBot]], pal.bedStoneOutline, 1.45, true, pal.bedStoneFill, [], 'PROF_BED_LAYER');
        const nBedProf = Math.max(8, Math.round(L_draw_cm / (p.D_bed * 0.85)));
        const bedProfStep = L_px / nBedProf;
        for (let i = 0; i < nBedProf; i++) {
          drawOrientedBoulder(
            ctx,
            x0 + (i + 0.5) * bedProfStep,
            (yProfBedTop + yProfBedBot) / 2,
            dBed_px * 0.46, bedProfStep * 0.46,
            Math.PI / 2,
            i + 51,
            pal.bedStoneOutline, pal.bedStoneFill,
            'PROF_BED_STONE'
          );
        }
      }

      // 4) Bottom 20cm Gravel Cushion Layer & Compacted Subgrade Soil Hatch
      cadPoly(ctx, [[x0, yProfBedBot], [x1, yProfBedBot], [x1, yProfGrvBot], [x0, yProfGrvBot]], '#ef4444', 1.3, true, pal.gravelFill, [], 'PROF_GRV_LAYER');
      for (let i = 0; i < nGrvPlan; i++) {
        const gx = x0 + (i + 0.5) * grvStep;
        drawOrientedBoulder(ctx, gx, (yProfBedBot + yProfGrvBot) / 2, grvStep * 0.38, tGrv_px * 0.35, i * 0.5, i + 77, pal.gravelDot, null, 'PROF_GRV_STONE');
      }

      // Compacted soil triad hatch along bottom of profile
      for (let sx = x0 + 25; sx < x1 - 20; sx += 55) {
        for (let k = 0; k < 3; k++) {
          cadLine(ctx, sx + k * 4.5, yProfGrvBot, sx + k * 4.5 - 6, yProfGrvBot + 7, pal.soilHatch, 1.05);
        }
      }

      // Dimensions on Longitudinal Profile
      cadDim(ctx, x0, yProfTop, x0, yProfWater, -22, `h1=${p.h1_cm}`, pal, 10);
      cadDim(ctx, x0, yProfWater, x0, yProfBedTop, -22, `h2=${p.h2_cm}`, pal, 10);
      cadDim(ctx, x0 - 24, yProfTop, x0 - 24, yProfBedTop, -22, `H=${p.H_cm}`, pal, 10.5);
      if (p.use_bed_stone) {
        cadDim(ctx, x1, yProfBedTop, x1, yProfBedBot, 20, `底石${p.D_bed}`, pal, 10);
      }
      cadDim(ctx, x1, yProfBedBot, x1, yProfGrvBot, 20, `碎石${p.t_gravel}`, pal, 10);

      const profTitleY = yProfGrvBot + 28;
      cadText(ctx, '縱斷面展開圖 (自動補齊・1:1垂直對齊)', (x0 + x1) / 2, profTitleY, 15.5, pal.titleCyan, 'center', '700');
      cadLine(ctx, (x0 + x1) / 2 - 115, profTitleY + 10, (x0 + x1) / 2 + 115, profTitleY + 10, pal.titleCyan, 1.3);

      return {
        rightX: x1 + 260,
        bottomY: profTitleY + 24
      };
    }

    // =========================================================================
    // 6. VIEW 3: EXPLICIT FIGURE-NUMBER QUANTITY TABLE ON CANVAS
    // =========================================================================
    function drawExplicitFormulaTableOnCanvas(ctx, ox, oy, p, pal) {
      cadText(
        ctx,
        `【乾砌石溝 (圖號 0502-1 / 056) 每公尺數量計算式表 — 採用圖面標註數字顯式列式 (W=${p.W_cm}cm・H=${p.H_cm}cm・B=${p.B_cm}cm・全段=${p.L_tot_m.toFixed(1)}m)】`,
        ox, oy - 15, 13.5, pal.dimText, 'left', '700'
      );

      const colW = [240, 470, 82, 92, 52];
      const rowH = 26;
      const rows = [
        ['工程項目名稱 (依DXF圖面標註)', '採用圖面標註數字之顯式計算式 (每公尺基準)', '每m數量', `全段(${p.L_tot_m}m)`, '單位'],
        [`兩側塊石乾砌 (長徑D20~30cm, 均${p.D_wall}cm)`, p.formula_wall_stone_vol, p.q_wall_stone_vol.toFixed(2), (p.q_wall_stone_vol * p.L_tot_m).toFixed(2), 'M³'],
        [`兩側乾砌石溝面面積 (坡度 1:${p.m_slope})`, p.formula_wall_stone_area, p.q_wall_stone_area.toFixed(2), (p.q_wall_stone_area * p.L_tot_m).toFixed(1), 'M²'],
        [`溝底塊石鋪底 (長徑D30~40cm, 均${p.D_bed}cm)`, p.formula_bed_stone_vol, p.q_bed_stone_vol.toFixed(2), (p.q_bed_stone_vol * p.L_tot_m).toFixed(2), 'M³'],
        [`背填級配碎石 (厚約${p.t_gravel}cm, <10cm石材)`, p.formula_gravel_vol, p.q_gravel_vol.toFixed(2), (p.q_gravel_vol * p.L_tot_m).toFixed(2), 'M³'],
        ['底土土壤壓實 (壓實度應達80%以上)', p.formula_compact_area, p.q_compact_area.toFixed(2), (p.q_compact_area * p.L_tot_m).toFixed(1), 'M²']
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
          const color = isHeader ? pal.textMain : (cIdx === 2 ? pal.dimText : (cIdx === 3 ? pal.bedStoneOutline : pal.textSub));
          cadText(ctx, cellStr, tx, ry, isHeader ? 11.2 : 10.6, color, align, (isHeader || cIdx === 2 || cIdx === 3) ? '700' : '500');
          cx += cw;
        });
      });

      return { bottomY: oy + totH };
    }

    // =========================================================================
    // 7. MAIN RENDER ENGINE & LIVE UI UPDATER
    // =========================================================================
    function updateSidebarSummary(p) {
      document.getElementById('stat_ditch_tag').textContent = `W=${p.W_cm}・H=${p.H_cm}cm`;
      document.getElementById('stat_wall_stone_m').textContent = `${p.q_wall_stone_vol.toFixed(2)} M³/m`;
      document.getElementById('stat_bed_stone_m').textContent = `${p.q_bed_stone_vol.toFixed(2)} M³/m`;
      document.getElementById('stat_gravel_m').textContent = `${p.q_gravel_vol.toFixed(2)} M³/m`;
      document.getElementById('stat_compact_m').textContent = `${p.q_compact_area.toFixed(2)} M²/m`;
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

      if (currentView === 'SECTION_ONLY') {
        const bSec = drawMainCrossSectionView(ctx, 60, 15, p, pal);
        drawExplicitFormulaTableOnCanvas(ctx, 50, bSec.bottomY + 42, p, pal);
      } else if (currentView === 'PLAN_PROFILE') {
        const bPP = drawSynthesizedPlanAndProfileViews(ctx, 60, 15, p, pal);
        drawExplicitFormulaTableOnCanvas(ctx, 50, bPP.bottomY + 42, p, pal);
      } else {
        // 'ALL' Full Standard Sheet Layout:
        // - Left Column: 斷面圖 (已剔除自然地形線與岸頂草皮弧線) + 符號說明 (B, W, H, h1, h2)
        // - Right Column: 自動補齊之 1:1 垂直對齊【俯視平面圖】與【縱斷面展開圖】
        // - Bottom Full-Width: 圖面標註數字顯式計算式表
        const bSec = drawMainCrossSectionView(ctx, 25, 12, p, pal);
        const rightColX = bSec.rightX + 35;
        const bPP = drawSynthesizedPlanAndProfileViews(ctx, rightColX, 12, p, pal);

        const tableY = Math.max(bSec.bottomY, bPP.bottomY) + 45;
        drawExplicitFormulaTableOnCanvas(ctx, 40, tableY, p, pal);
      }

      ctx.restore();
    }

    // =========================================================================
    // 8. UI CONTROLS, AUTO-SYNC & DXF / CSV EXPORTERS
    // =========================================================================
    function onWaterDepthChange() {
      const h2 = parseFloat(document.getElementById('inp_h2_cm').value) || 55;
      // Per 設計原則4: 出水高 h1 依設計水深之 25% 計算之，最小值為 20cm
      const calcH1 = Math.max(20, Math.round(h2 * 0.25));
      document.getElementById('inp_h1_cm').value = calcH1;
      renderAll();
    }

    function onGeomChange() {
      renderAll();
    }

    function resetToOrig() {
      Object.keys(ORIG_DRY_STONE_DITCH).forEach(k => {
        const el = document.getElementById('inp_' + k);
        if (el) el.value = ORIG_DRY_STONE_DITCH[k];
      });
      renderAll();
    }

    function switchView(view) {
      currentView = view;
      const specEl = document.getElementById('specPanel');
      const tabs = {
        ALL: document.getElementById('tab-all'),
        SECTION_ONLY: document.getElementById('tab-sec'),
        PLAN_PROFILE: document.getElementById('tab-plan'),
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
      if (currentView === 'SECTION_ONLY') {
        viewCam.scale = Math.min(rect.width / 1080, rect.height / 760) * 0.93;
        viewCam.offsetX = Math.max(25, (rect.width - 1000 * viewCam.scale) / 2);
        viewCam.offsetY = 16;
      } else if (currentView === 'PLAN_PROFILE') {
        viewCam.scale = Math.min(rect.width / 1080, rect.height / 820) * 0.93;
        viewCam.offsetX = Math.max(25, (rect.width - 1000 * viewCam.scale) / 2);
        viewCam.offsetY = 16;
      } else {
        viewCam.scale = Math.min(rect.width / 1460, rect.height / 860) * 0.94;
        viewCam.offsetX = Math.max(20, (rect.width - 1400 * viewCam.scale) / 2);
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
      a.download = `乾砌石溝標準圖_0502-1_W${p.W_cm}_H${p.H_cm}cm_含補齊平縱面.dxf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }

    function exportCSV() {
      const p = getParams();
      const rows = [
        [`乾砌石溝標準圖 (圖號 0502-1 / 056・溝底寬W=${p.W_cm}cm・溝深H=${p.H_cm}cm・溝寬B=${p.B_cm}cm) - 圖面標註數字顯式列式數量計算書`],
        ['工程項目名稱', '採用圖面標註數字之顯式計算式 (每公尺基準)', '每公尺數量', `全段數量(${p.L_tot_m}m)`, '單位'],
        [`兩側塊石乾砌 (長徑D20~30cm, 均${p.D_wall}cm)`, `'${p.formula_wall_stone_vol}`, p.q_wall_stone_vol.toFixed(2), (p.q_wall_stone_vol * p.L_tot_m).toFixed(2), 'M³'],
        [`兩側乾砌石溝面面積 (坡度 1:${p.m_slope})`, `'${p.formula_wall_stone_area}`, p.q_wall_stone_area.toFixed(2), (p.q_wall_stone_area * p.L_tot_m).toFixed(1), 'M²'],
        [`溝底塊石鋪底 (長徑D30~40cm, 均${p.D_bed}cm)`, `'${p.formula_bed_stone_vol}`, p.q_bed_stone_vol.toFixed(2), (p.q_bed_stone_vol * p.L_tot_m).toFixed(2), 'M³'],
        [`背填級配碎石 (厚約${p.t_gravel}cm, <10cm石材)`, `'${p.formula_gravel_vol}`, p.q_gravel_vol.toFixed(2), (p.q_gravel_vol * p.L_tot_m).toFixed(2), 'M³'],
        ['底土土壤壓實 (壓實度應達80%以上)', `'${p.formula_compact_area}`, p.q_compact_area.toFixed(2), (p.q_compact_area * p.L_tot_m).toFixed(1), 'M²']
      ];

      const csvContent = '\uFEFF' + rows.map(r => r.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `乾砌石溝顯式列式計算書_0502-1_W${p.W_cm}xH${p.H_cm}.csv`;
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

  const STRIP = s => String(s).replace(/\s*[（(]\s*圖號[^）)]*[）)]/g, '').replace(/\s*[（(]\s*\d{4}-\d\s*[/／]\s*\d{3}\s*[）)]/g, '').replace(/\s*圖號\s*[：:]?\s*[0-9A-Za-z#\-／/ ]+/g, ' ');
  function params(R) { Object.keys(R || {}).forEach(k => { el('inp_' + k).value = String(R[k]); }); return getParams(); }
  function run(R, OV) {
    O = []; const PAL = getPalette(), p = params(R); Object.assign(p, R || {}, OV || {});
    const bSec = drawMainCrossSectionView(CTX, 25, 12, p, PAL), bPP = drawSynthesizedPlanAndProfileViews(CTX, bSec.rightX + 35, 12, p, PAL); drawExplicitFormulaTableOnCanvas(CTX, 40, Math.max(bSec.bottomY, bPP.bottomY) + 45, p, PAL);
    
    const sc = 1 / 1.45; return O.map(o => { const r = Object.assign({}, o); if (r.p) r.p = r.p.map(([x, y]) => [x * sc, y * sc]); if (r.x !== undefined) { r.x *= sc; r.y *= sc; } if (r.r) r.r *= sc; if (r.h) r.h *= sc; if (r.s !== undefined && r.k === 'T') r.s = STRIP(r.s); return r; });
  }
  return { run, params };
})();
TCO_D['wet'] = (function () {
  let O = [];
  const EL = {}, CTX = new Proxy({}, { get: (t, k) => (k in t ? t[k] : () => ({ width: 0 })), set: (t, k, v) => { t[k] = v; return true; } });
  const el = id => EL[id] || (EL[id] = { value: '', textContent: '', innerHTML: '', className: '', style: {}, classList: { add() {}, remove() {}, toggle() {} }, addEventListener() {}, getContext: () => CTX, parentElement: { getBoundingClientRect: () => ({ width: 100, height: 100 }) } });
  const document = { getElementById: el, querySelectorAll: () => [], querySelector: () => null, createElement: () => ({ click() {}, style: {} }), body: { appendChild() {}, removeChild() {}, classList: { add() {}, remove() {}, toggle() {}, contains: () => false } }, documentElement: { classList: { contains: () => false, add() {}, remove() {}, toggle() {} } }, addEventListener() {} };
  const window = { addEventListener() {}, devicePixelRatio: 1, matchMedia: () => ({ matches: false, addEventListener() {} }) };

    // =========================================================================
    // 1. ORIGINAL DXF BASELINE CONSTANTS & GLOBAL STATE (PURE ASCII IDENTIFIERS)
    // =========================================================================
    const ORIG_WET_MASONRY_DITCH = {
      N_bed: 4,
      W_cm: 50,
      N_wall: 5,
      H_cm: 70,
      m_in: 0.3,
      B_cm: 125,
      B1_cm: 15,
      B2_cm: 30,
      t_pc_cm: 5,
      D_stone_cm: 25,
      L_draw_cm: 200,
      L_tot_m: 30.0
    };

    let currentView = 'ALL'; // 'ALL', 'PLAN_SEC', 'PROF_ONLY', 'SPEC'
    let showGhost = false;
    let isDarkTheme = true;

    let viewCam = {
      scale: 0.68,
      offsetX: 26,
      offsetY: 16,
      isDragging: false,
      dragStartX: 0,
      dragStartY: 0
    };

    let dxfEntities = [];

    // =========================================================================
    // 2. PARAMETER READER & EXPLICIT FIGURE-NUMBER FORMULA ENGINE
    //    STRICT RULES:
    //    - Stones ALWAYS keep fixed physical dimensions (D_stone_cm long axis x ~14cm short axis)
    //    - Embedded 2/3 into 210kgf/cm2 concrete backing, exposed 1/3 on water face (表面不勾縫!)
    //    - Widening W adds more bed stones (N_bed); deepening H adds more wall stone layers (N_wall)!
    // =========================================================================
    function getParams() {
      const num = (id, def) => {
        const el = document.getElementById(id);
        if (!el) return def;
        const v = parseFloat(el.value);
        return isNaN(v) ? def : v;
      };

      const N_bed = Math.max(2, Math.min(12, Math.round(num('inp_N_bed', 4))));
      const N_wall = Math.max(3, Math.min(12, Math.round(num('inp_N_wall', 5))));
      const m_in = Math.max(0.2, num('inp_m_in', 0.3));
      const B1_cm = Math.max(10, num('inp_B1_cm', 15));
      const B2_cm = Math.max(20, num('inp_B2_cm', 30));
      const t_pc_cm = Math.max(5, num('inp_t_pc_cm', 5));
      const D_stone_cm = Math.max(20, num('inp_D_stone_cm', 25));
      const L_draw_cm = Math.max(100, num('inp_L_draw_cm', 200));
      const L_tot_m = Math.max(2.0, num('inp_L_tot_m', 30.0));

      // Fixed short diameter pitch of each boulder:
      // In original DXF: 4 bed stones span W = 50.76cm (~12.5cm pitch), 5 wall stones span H = 69.46cm (~14cm vertical pitch)
      const bedPitch_cm = num('inp_bedPitch_cm', 12.5);
      const wallVertPitch_cm = num('inp_wallVertPitch_cm', 14.0);

      const W_cm = +(N_bed * bedPitch_cm).toFixed(1);
      const H_cm = +(N_wall * wallVertPitch_cm).toFixed(1);

      // Update inputs if not actively focused
      const elW = document.getElementById('inp_W_cm');
      if (elW && document.activeElement !== elW) elW.value = W_cm;
      const elH = document.getElementById('inp_H_cm');
      if (elH && document.activeElement !== elH) elH.value = H_cm;

      // Top ditch width B across top inner edges of side walls (matching DXF *D15 = 125.2cm when W=50, H=70)
      const B_cm = +(W_cm + 2 * H_cm * m_in + num('inp_bAdd_cm', 33)).toFixed(1);
      const elB = document.getElementById('inp_B_cm');
      if (elB) elB.value = B_cm;

      // Outer concrete base width (matching DXF F579 = 98.4cm when W=50)
      const W_base_out_cm = +(W_cm + 2 * B1_cm + num('inp_baseAdd_cm', 18)).toFixed(1);

      const p = {
        N_bed,
        W_cm,
        N_wall,
        H_cm,
        m_in,
        B_cm,
        W_base_out_cm,
        B1_cm,
        B2_cm,
        t_pc_cm,
        D_stone_cm,
        bedPitch_cm,
        wallVertPitch_cm,
        L_draw_cm,
        L_tot_m
      };

      const W_m = +(W_cm / 100).toFixed(2);
      const H_m = +(H_cm / 100).toFixed(2);
      const B_m = +(B_cm / 100).toFixed(2);
      const B1_m = +(B1_cm / 100).toFixed(2);
      const B2_m = +(B2_cm / 100).toFixed(2);
      const tpc_m = +(t_pc_cm / 100).toFixed(2);
      const Dstone_m = +(D_stone_cm / 100).toFixed(2);
      const Wbase_m = +(W_base_out_cm / 100).toFixed(2);

      // 1. 漿砌塊石，表面不勾縫 (φ=25~30cm佔80%以上，埋入PC 2/3、露出1/3):
      // Total boulders per cross-section = 2 * N_wall + N_bed (e.g. 2*5 + 4 = 14 boulders per cross-section)
      const totStonesPerSec = 2 * N_wall + N_bed;
      const stoneShort_m = +(bedPitch_cm / 100).toFixed(3); // 0.125m
      const singleStoneArea = +(0.7854 * Dstone_m * stoneShort_m).toFixed(4); // ~0.0245 m2
      p.q_stone_vol = +(totStonesPerSec * singleStoneArea * 1.0).toFixed(2);
      p.formula_stone_vol = `[兩側2*${N_wall}顆 + 溝底${N_bed}顆 = ${totStonesPerSec}顆/斷面] * (0.785*長徑${Dstone_m.toFixed(2)}m*短徑${stoneShort_m}m) * 1.00m`;

      // Exposed unpointed masonry face area (M²/m):
      const slopeFactor = +Math.hypot(1, m_in).toFixed(3);
      const sideSlopeLen_m = +(H_m * slopeFactor).toFixed(2);
      p.q_stone_area = +((2 * sideSlopeLen_m + W_m) * 1.0).toFixed(2);
      p.formula_stone_area = `[兩側斜長 2*(H=${H_m.toFixed(2)}m*√(1²+${m_in}²)=${sideSlopeLen_m.toFixed(2)}m) + 溝底寬W(${W_m.toFixed(2)}m)] * 1.00m`;

      // 2. 210kgf/cm² 澆置混凝土 (背澆置混凝土厚 B1, 壁厚 B2, 包覆塊石 2/3 長徑):
      const totalWallAndBedArea = +(2 * sideSlopeLen_m * B2_m + Wbase_m * (B1_m + Dstone_m * 0.67)).toFixed(2);
      const embeddedStoneVol = +(p.q_stone_vol * 0.67).toFixed(2);
      p.q_rc210_vol = Math.max(0.25, +(totalWallAndBedArea - embeddedStoneVol).toFixed(2));
      p.formula_rc210_vol = `[兩側壁(2*${sideSlopeLen_m.toFixed(2)}m*壁厚B2=${B2_m.toFixed(2)}m) + 底版(${Wbase_m.toFixed(2)}m*厚B1=${B1_m.toFixed(2)}m)] - 埋入2/3塊石體積(${embeddedStoneVol.toFixed(2)}M³)`;

      // 3. 140kgf/cm² 打底混凝土 (厚 5cm, 鋪設於溝底基礎下方):
      const pcWidth_m = +(Wbase_m + 0.10).toFixed(2); // +5cm extension each side as in DXF F58D
      p.q_pc140_vol = +(pcWidth_m * tpc_m * 1.0).toFixed(2);
      p.formula_pc140_vol = `打底總寬(${Wbase_m.toFixed(2)}m + 兩側外伸0.10m = ${pcWidth_m.toFixed(2)}m) * 打底厚(${t_pc_cm}cm/100=${tpc_m.toFixed(2)}m) * 1.00m`;

      // 4. 基層土壤壓實 (壓實度應達 80% 以上為原則):
      const outerSlopeLen_m = +Math.hypot(H_m + B1_m, H_m * 0.56).toFixed(2);
      p.q_compact_area = +((pcWidth_m + 2 * outerSlopeLen_m) * 1.0).toFixed(2);
      p.formula_compact_area = `[基底寬(${pcWidth_m.toFixed(2)}m) + 兩側開挖斜邊(2*${outerSlopeLen_m.toFixed(2)}m)] * 1.00m`;

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
          stoneOutline: '#fb923c',
          stoneHatch: '#cbd5e1',
          stoneFill: 'rgba(249, 115, 22, 0.22)',
          concOutline: '#f8fafc',
          concFill: 'rgba(56, 189, 248, 0.13)',
          concDots: '#94a3b8',
          pcOutline: '#e879f9',
          pcFill: 'rgba(232, 121, 249, 0.15)',
          dimLine: '#22d3ee',
          dimText: '#67e8f9',
          leaderLine: '#38bdf8',
          textMain: '#f8fafc',
          textSub: '#cbd5e1',
          titleCyan: '#22d3ee',
          titleOrange: '#fb923c',
          ghostLine: 'rgba(244, 63, 94, 0.40)',
          tableBorder: '#64748b',
          tableHeaderBg: 'rgba(30, 41, 59, 0.90)'
        };
      } else {
        return {
          bg: '#ffffff',
          primaryLine: '#0f172a',
          secondaryLine: '#475569',
          stoneOutline: '#c2410c',
          stoneHatch: '#475569',
          stoneFill: 'rgba(253, 186, 116, 0.38)',
          concOutline: '#0f172a',
          concFill: 'rgba(2, 132, 199, 0.14)',
          concDots: '#475569',
          pcOutline: '#a21caf',
          pcFill: 'rgba(240, 171, 252, 0.30)',
          dimLine: '#0284c7',
          dimText: '#0f172a',
          leaderLine: '#0369a1',
          textMain: '#0f172a',
          textSub: '#334155',
          titleCyan: '#0369a1',
          titleOrange: '#c2410c',
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

    function cadLeaderArrow(ctx, tx, ty, kx, ky, ex, ey, lines, pal, fontSize = 11.5) {
      cadLine(ctx, tx, ty, kx, ky, pal.leaderLine, 1.15, [], 'LEADER');
      if (Math.hypot(ex - kx, ey - ky) > 1) {
        cadLine(ctx, kx, ky, ex, ey, pal.leaderLine, 1.15, [], 'LEADER');
      }

      const dx = tx - kx, dy = ty - ky;
      const L = Math.hypot(dx, dy) || 1;
      const ux = dx / L, uy = dy / L;
      const nx = -uy, ny = ux;
      ctx.save();
      ctx.fillStyle = pal.leaderLine;
      ctx.beginPath();
      ctx.moveTo(tx, ty);
      ctx.lineTo(tx - ux * 7.5 + nx * 2.4, ty - uy * 7.5 + ny * 2.4);
      ctx.lineTo(tx - ux * 7.5 - nx * 2.4, ty - uy * 7.5 - ny * 2.4);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      const align = ex >= kx ? 'left' : 'right';
      const pad = ex >= kx ? 6 : -6;
      const arr = Array.isArray(lines) ? lines : [lines];
      arr.forEach((ln, idx) => {
        const yOff = (idx - (arr.length - 1) / 2) * (fontSize + 4);
        cadText(ctx, ln, ex + pad, ey + yOff, fontSize, pal.textMain, align, '600', 0, 'TEXT');
      });
    }

    function cadDim(ctx, x1, y1, x2, y2, offset, labelStr, pal, fontSize = 11.5) {
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

    // Helper: Draw a single Wet-Masonry Boulder (塊石 F563, F575, F581..F58C) with ANSI33 diagonal solid+dashed hatch!
    // Per 注意事項4: Long axis (2*rLong) is perpendicular to wall/bed face, 2/3 embedded in concrete, 1/3 exposed!
    function drawWetMasonryBoulder(ctx, cx, cy, rLong, rShort, angleRad, seed, pal, withAnsi33Hatch = true, layer = 'BOULDER') {
      const nV = 11;
      const cosA = Math.cos(angleRad), sinA = Math.sin(angleRad);
      const pts = [];
      for (let i = 0; i < nV; i++) {
        const a = (i / nV) * Math.PI * 2;
        const jit = 0.90 + 0.11 * Math.sin(seed * 3.7 + i * 2.1);
        const lx = Math.cos(a) * rLong * jit;
        const ly = Math.sin(a) * rShort * jit;
        pts.push([
          cx + lx * cosA - ly * sinA,
          cy + lx * sinA + ly * cosA
        ]);
      }
      cadPoly(ctx, pts, pal.stoneOutline, 1.4, true, pal.stoneFill, [], layer);

      if (withAnsi33Hatch) {
        // ANSI33 Hatch inside the boulder (alternating solid line and dashed line at 45°, matching DXF F562 & F574!)
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(pts[0][0], pts[0][1]);
        for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
        ctx.closePath();
        ctx.clip();

        const span = Math.max(rLong, rShort) * 1.5;
        const step = 6.5;
        let idx = 0;
        for (let d = -span; d <= span; d += step) {
          const isDashed = (idx % 2 === 1);
          cadLine(
            ctx,
            cx + d - span, cy + span,
            cx + d + span, cy - span,
            pal.stoneHatch, 0.85,
            isDashed ? [4, 3] : [],
            layer + '_ANSI33'
          );
          idx++;
        }
        ctx.restore();
      }
    }

    // Helper: Draw Z-Break Line
    function drawBreakLine(ctx, x1, y1, x2, y2, pal) {
      const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
      const dx = x2 - x1, dy = y2 - y1;
      const L = Math.hypot(dx, dy) || 1;
      const ux = dx / L, uy = dy / L;
      const nx = -uy, ny = ux;
      const zS = 5.5, zA = 5.8;
      cadPoly(ctx, [
        [x1, y1],
        [mx - ux * zS, my - uy * zS],
        [mx - ux * (zS * 0.35) + nx * zA, my - uy * (zS * 0.35) + ny * zA],
        [mx + ux * (zS * 0.35) - nx * zA, my + uy * (zS * 0.35) - ny * zA],
        [mx + ux * zS, my + uy * zS],
        [x2, y2]
      ], pal.dimLine, 1.15, false, null, [], 'BREAK_LINE');
    }

    // =========================================================================
    // 4. VIEW 1 & 2: 自動補齊之【俯視平面圖】 (TOP PLAN VIEW) & 原圖【漿砌塊石溝剖面圖】 (CROSS-SECTION)
    //    Strictly 1:1 Vertically Aligned along Centerline cx!
    //    - Natural G.L. lines (F561, F56A, F56C, F56D) & ground hatches (F57C, F57D) are 100% STRIPPED!
    //    - Boulders ALWAYS keep fixed size (D_stone_cm x bedPitch_cm), embedded 2/3 in 210kgf/cm2 concrete, exposed 1/3!
    // =========================================================================
    function drawPlanAndSectionViews(ctx, ox, topY, p, pal) {
      const s = 1.65; // Scale: 1 cm = 1.65 px

      const W = p.W_cm * s;               // Ditch bottom width (e.g. 50 * s)
      const H = p.H_cm * s;               // Ditch depth (e.g. 70 * s)
      const B = p.B_cm * s;               // Top ditch width (e.g. 125 * s)
      const B1 = p.B1_cm * s;             // Concrete thickness behind stones (15 * s)
      const B2 = p.B2_cm * s;             // Top wall thickness (30 * s)
      const t_pc = p.t_pc_cm * s;         // 140kgf/cm2 PC leveling pad thickness (5 * s)
      const D_stone = p.D_stone_cm * s;   // Boulder long axis (25 * s)
      const rLong = D_stone * 0.50;
      const rShort = (p.bedPitch_cm * 0.48) * s;

      const cx = ox + Math.max(285, (B / 2) + B2 + 95); // Shared 1:1 Centerline X

      // Key X coordinates on Cross-Section symmetric about cx
      const xBedInL = cx - W / 2;
      const xBedInR = cx + W / 2;
      const xTopInL = cx - B / 2;
      const xTopInR = cx + B / 2;
      const xTopOutL = xTopInL - B2;
      const xTopOutR = xTopInR + B2;

      const W_base_out = p.W_base_out_cm * s;
      const xBotOutL = cx - W_base_out / 2;
      const xBotOutR = cx + W_base_out / 2;
      const xPcOutL = xBotOutL - p.pcExt_cm * s;
      const xPcOutR = xBotOutR + p.pcExt_cm * s;

      // =====================================================================
      // PART A: 自動補齊之 1:1 對齊【俯視平面圖】 (TOP PLAN VIEW)
      // =====================================================================
      const yPlanTop = topY + 38;
      const planH = Math.min(265, p.L_draw_cm * 1.15);
      const yPlanBot = yPlanTop + planH;

      // 1) Outer Concrete Wall & 5cm PC Base Projection Strips in Plan View
      cadPoly(ctx, [[xPcOutL, yPlanTop], [xPcOutR, yPlanTop], [xPcOutR, yPlanBot], [xPcOutL, yPlanBot]], pal.pcOutline, 1.0, true, 'rgba(15, 23, 42, 0.40)', [5, 3], 'PLAN_PC_EXT');
      cadPoly(ctx, [[xTopOutL, yPlanTop], [xTopOutR, yPlanTop], [xTopOutR, yPlanBot], [xTopOutL, yPlanBot]], pal.concOutline, 1.45, true, pal.concFill, [], 'PLAN_CONC_OUTER');

      // Top Wall Thickness Lines (B2) & Ditch Bottom Inner Lines (W)
      cadLine(ctx, xTopInL, yPlanTop, xTopInL, yPlanBot, pal.primaryLine, 1.35, [], 'PLAN_TOP_IN_L');
      cadLine(ctx, xTopInR, yPlanTop, xTopInR, yPlanBot, pal.primaryLine, 1.35, [], 'PLAN_TOP_IN_R');
      cadLine(ctx, xBedInL, yPlanTop, xBedInL, yPlanBot, pal.secondaryLine, 1.15, [5, 3], 'PLAN_BED_IN_L');
      cadLine(ctx, xBedInR, yPlanTop, xBedInR, yPlanBot, pal.secondaryLine, 1.15, [5, 3], 'PLAN_BED_IN_R');

      // 2) Unpointed Boulders in Plan View (表面不勾縫, staggered grid of fixed-size boulders along bed & side slopes)
      const nRowsPlan = Math.max(5, Math.round(planH / (rShort * 2.05)));
      const rowStepY = planH / nRowsPlan;

      for (let r = 0; r < nRowsPlan; r++) {
        const ry = yPlanTop + (r + 0.5) * rowStepY;
        const isOdd = (r % 2 === 1);

        // Left & Right sloped wall boulders in Plan View
        const nSideCols = 2;
        const sideSpanL = xBedInL - xTopInL;
        for (let sc = 0; sc < nSideCols; sc++) {
          const sxL = xTopInL + (sc + 0.5) * (sideSpanL / nSideCols);
          const sxR = xBedInR + (sc + 0.5) * (sideSpanL / nSideCols);
          drawWetMasonryBoulder(ctx, sxL, ry, (sideSpanL / nSideCols) * 0.45, rowStepY * 0.44, 0.08 * (r % 2 ? 1 : -1), r * 17 + sc, pal, false, 'PLAN_WALL_STONE');
          drawWetMasonryBoulder(ctx, sxR, ry, (sideSpanL / nSideCols) * 0.45, rowStepY * 0.44, -0.08 * (r % 2 ? 1 : -1), r * 23 + sc, pal, false, 'PLAN_WALL_STONE');
        }

        // Ditch Bed `p.N_bed` Boulders across width W (staggered between rows!)
        const bedStepX = W / p.N_bed;
        for (let c = 0; c < p.N_bed; c++) {
          const bx = xBedInL + (c + 0.5) * bedStepX;
          const by = ry + (isOdd && (c % 2 === 1) ? rowStepY * 0.12 : 0);
          if (by + rowStepY * 0.42 <= yPlanBot) {
            drawWetMasonryBoulder(ctx, bx, by, bedStepX * 0.46, rowStepY * 0.44, ((r + c) % 2 ? 0.06 : -0.06), r * 31 + c + 5, pal, false, 'PLAN_BED_STONE');
          }
        }
      }

      // Concrete Stipple Dots in the left & right B2 top wall strips
      for (let py = yPlanTop + 10; py < yPlanBot - 8; py += 16) {
        cadCircle(ctx, (xTopOutL + xTopInL) / 2 - 4, py, 0.85, pal.concDots, 0.8, pal.concDots);
        cadCircle(ctx, (xTopOutR + xTopInR) / 2 + 4, py, 0.85, pal.concDots, 0.8, pal.concDots);
      }

      // Flow Arrow on Plan View
      const flwY1 = yPlanTop + planH * 0.72;
      const flwY2 = yPlanTop + planH * 0.28;
      cadLine(ctx, cx, flwY1, cx, flwY2, pal.dimLine, 1.6, [], 'FLOW_ARROW');
      cadPoly(ctx, [[cx - 3.5, flwY2 + 7], [cx + 3.5, flwY2 + 7], [cx, flwY2]], pal.dimLine, 1.2, true, pal.dimLine);
      cadText(ctx, '水流方向', cx + 10, (flwY1 + flwY2) / 2, 10.5, pal.titleCyan, 'left', '700');

      // Top & Bottom Z-Break Lines on Plan View
      drawBreakLine(ctx, xPcOutL - 10, yPlanTop, xPcOutR + 10, yPlanTop, pal);
      drawBreakLine(ctx, xPcOutL - 10, yPlanBot, xPcOutR + 10, yPlanBot, pal);

      // Dimensions on Plan View
      cadDim(ctx, xTopOutL, yPlanTop, xTopInL, yPlanTop, -18, `B2 (${p.B2_cm})`, pal, 10.8);
      cadDim(ctx, xTopInL, yPlanTop, xTopInR, yPlanTop, -18, `B (${p.B_cm})`, pal, 11.2);
      cadDim(ctx, xBedInL, yPlanBot, xBedInR, yPlanBot, 16, `W (${p.W_cm}cm・底${p.N_bed}顆塊石)`, pal, 10.8);

      const planTitleY = yPlanBot + 38;
      cadText(ctx, '漿砌塊石溝俯視平面圖 (自動補齊・1:1對齊)', cx, planTitleY, 15, pal.titleCyan, 'center', '700');
      cadLine(ctx, cx - 135, planTitleY + 9, cx + 135, planTitleY + 9, pal.titleCyan, 1.3);

      // =====================================================================
      // PART B: 原圖【漿砌塊石溝剖面圖 Scale: 1/10】 (1:1 ALIGNED BELOW PLAN VIEW!)
      //         100% Faithful to DXF Entities F560..F64D, *D13..*D19, 11A19..11A20
      //         (G.L. natural terrain lines F561, F56A, F56C, F56D are 100% STRIPPED!)
      // =====================================================================
      const ySecTop = planTitleY + 62;                  // Top crest elevation (Y = 2162.8 in DXF)
      const yInvert = ySecTop + H;                      // Ditch invert elevation (top of bed stones, Y = 2093.3 in DXF)
      const yConcBot = yInvert + (D_stone * p.kEmb + B1); // Bottom of 210kgf/cm2 concrete (Y = 2058.3 in DXF)
      const yPcBot = yConcBot + t_pc;                   // Bottom of 140kgf/cm2 5cm PC pad (Y = 2053.3 in DXF)

      // 1:1 Vertical Alignment Dashed Guides between Plan View and Cross-Section View
      [xTopOutL, xTopInL, xBedInL, xBedInR, xTopInR, xTopOutR].forEach((gx) => {
        cadLine(ctx, gx, yPlanBot + 4, gx, ySecTop - 26, pal.secondaryLine, 0.8, [4, 4], 'ALIGN_GUIDE');
      });

      // 0) Ghost Baseline (Original W=50, H=70, B=125)
      if (showGhost) {
        const gB = 125 * s, gB2 = 30 * s, gWbase = 98.4 * s, gHtot = (70 + 35) * s;
        cadPoly(ctx, [
          [cx - gB / 2 - gB2, ySecTop],
          [cx + gB / 2 + gB2, ySecTop],
          [cx + gWbase / 2, ySecTop + gHtot],
          [cx - gWbase / 2, ySecTop + gHtot]
        ], pal.ghostLine, 1.05, true, null, [4, 4], 'GHOST_SEC');
      }

      // 1) 140kgf/cm² Leveling Concrete Pad (打底混凝土 t=5cm, matching DXF F579, F58D, F58E)
      cadPoly(ctx, [
        [xPcOutL, yConcBot],
        [xPcOutR, yConcBot],
        [xPcOutR, yPcBot],
        [xPcOutL, yPcBot]
      ], pal.pcOutline, 1.5, true, pal.pcFill, [], 'PC_140_BASE');

      // Subgrade Soil Compaction Hatch Symbol below 5cm PC Pad (基層土壤壓實 A$C7AB17D64, matching DXF F56E)
      const subHatchX = cx + W * 0.42;
      for (let k = 0; k < 4; k++) {
        cadLine(ctx, subHatchX + k * 5, yPcBot, subHatchX + k * 5 - 7, yPcBot + 8, pal.stoneHatch, 1.1, [], 'SUBGRADE_HATCH');
        cadLine(ctx, subHatchX + 10 + k * 4.5, yPcBot + 8, subHatchX + 14 + k * 4.5, yPcBot + 2, pal.stoneHatch, 1.1, [], 'SUBGRADE_HATCH');
      }

      // 2) 210kgf/cm² Concrete Backing Body (matching DXF F578, F57A, F64D & AR-CONC hatches F560, F56B)
      //    Outer boundary from (xTopOutL, ySecTop) -> (xBotOutL, yConcBot) -> (xBotOutR, yConcBot) -> (xTopOutR, ySecTop)
      const concBodyPts = [
        [xTopOutL, ySecTop],
        [xTopInL, ySecTop],
        [xBedInL, yInvert],
        [xBedInR, yInvert],
        [xTopInR, ySecTop],
        [xTopOutR, ySecTop],
        [xBotOutR, yConcBot],
        [xBotOutL, yConcBot]
      ];
      cadPoly(ctx, concBodyPts, pal.concOutline, 1.55, true, pal.concFill, [], 'CONC_210_BODY');

      // AR-CONC Concrete Aggregate Stipple (triangles & dots inside the 210kgf/cm² concrete backing)
      // Bottom slab concrete stipple (between bed stones and yConcBot)
      const yBedStoneBot = yInvert + D_stone * p.kEmb;
      for (let ax = xBotOutL + 14; ax < xBotOutR - 14; ax += 22) {
        const ay = (yBedStoneBot + yConcBot) / 2;
        cadPoly(ctx, [[ax, ay], [ax + 4, ay - 3], [ax + 2.5, ay + 3]], pal.concDots, 0.85, true, null, [], 'AR_CONC');
        cadCircle(ctx, ax + 9, ay - 1, 0.85, pal.concDots, 0.8, pal.concDots);
      }
      // Left & Right side wall concrete backing stipple
      for (let i = 0; i < p.N_wall; i++) {
        const frac = (i + 0.5) / p.N_wall;
        const wy = ySecTop + frac * (yConcBot - ySecTop);
        const lxOut = xTopOutL + frac * (xBotOutL - xTopOutL);
        const rxOut = xTopOutR + frac * (xBotOutR - xTopOutR);
        cadPoly(ctx, [[lxOut + 8, wy], [lxOut + 12, wy - 3], [lxOut + 10.5, wy + 3]], pal.concDots, 0.85, true, null, [], 'AR_CONC');
        cadCircle(ctx, lxOut + 15, wy + 2, 0.85, pal.concDots, 0.8, pal.concDots);
        cadPoly(ctx, [[rxOut - 12, wy], [rxOut - 8, wy - 3], [rxOut - 9.5, wy + 3]], pal.concDots, 0.85, true, null, [], 'AR_CONC');
        cadCircle(ctx, rxOut - 15, wy + 2, 0.85, pal.concDots, 0.8, pal.concDots);
      }

      // 3) Draw Ditch Bed Boulders (`p.N_bed` vertical boulders, matching DXF F563, F585, F586, F58C)
      //    Long axis (2*rLong = D_stone) is vertical! 2/3 embedded into concrete, 1/3 exposed above yInvert!
      const bedStepX = W / p.N_bed;
      const yBedBoulderCenter = yInvert + rLong * (1 / 3); // So top is at yInvert - 2/3*rLong (exposed 1/3 of 2*rLong) and bottom is at yInvert + 4/3*rLong (embedded 2/3!)
      for (let c = 0; c < p.N_bed; c++) {
        const bx = xBedInL + (c + 0.5) * bedStepX;
        drawWetMasonryBoulder(
          ctx,
          bx,
          yBedBoulderCenter,
          rLong,
          Math.min(rShort, bedStepX * 0.48),
          Math.PI / 2 + ((c % 2 === 0 ? 1 : -1) * 0.04),
          c * 13 + 3,
          pal,
          true,
          'SEC_BED_BOULDER'
        );
      }

      // 4) Draw Left & Right Side Wall Boulders (`p.N_wall` courses per side, matching DXF F575, F581..F584 & F587..F58B)
      //    Per 注意事項4: Long axis is perpendicular to wall face (~30 deg from horizontal), 2/3 embedded in concrete, 1/3 exposed!
      const wallSlopeAngle = Math.atan2(xBedInL - xTopInL, H); // ~30 deg from vertical
      let topRightStonePt = [xTopInR, ySecTop];
      let secondRightStoneBackPt = [xBotOutR, ySecTop + H * 0.3];

      for (let r = 0; r < p.N_wall; r++) {
        // r = 0 is bottom course near invert, r = p.N_wall - 1 is top crest course
        const frac = (r + 0.5) / p.N_wall;
        const wy = yInvert - frac * H;

        // Left wall boulder center (shifted 1/6 * D_stone into concrete so 2/3 is embedded and 1/3 is exposed)
        const lxIn = xBedInL - frac * (xBedInL - xTopInL);
        const lxCenter = lxIn - rLong * 0.34;
        drawWetMasonryBoulder(
          ctx,
          lxCenter,
          wy,
          rLong,
          rShort,
          wallSlopeAngle,
          r * 19 + 11,
          pal,
          true,
          'SEC_WALL_BOULDER_L'
        );

        // Right wall boulder center
        const rxIn = xBedInR + frac * (xTopInR - xBedInR);
        const rxCenter = rxIn + rLong * 0.34;
        drawWetMasonryBoulder(
          ctx,
          rxCenter,
          wy,
          rLong,
          rShort,
          -wallSlopeAngle,
          r * 19 + 29,
          pal,
          true,
          'SEC_WALL_BOULDER_R'
        );

        if (r === p.N_wall - 1) {
          topRightStonePt = [rxCenter + rLong * Math.cos(wallSlopeAngle), wy - rLong * Math.sin(wallSlopeAngle)];
        }
        if (r === p.N_wall - 2) {
          secondRightStoneBackPt = [rxCenter + rLong * Math.cos(wallSlopeAngle), wy - rLong * Math.sin(wallSlopeAngle)];
        }
      }

      // 5) Outer Wall Batter Triangle "1 : 0.3" on Right Side (matching DXF F567, F568, F569)
      const triX = xTopOutR - (xTopOutR - xBotOutR) * 0.32 + 12;
      const triY = ySecTop + (yConcBot - ySecTop) * 0.36;
      const triH = 22;
      const triW = triH * 0.55;
      cadPoly(ctx, [
        [triX, triY - triH],
        [triX, triY],
        [triX - triW, triY]
      ], pal.pcOutline, 1.2, true, null, [], 'SLOPE_TRI');
      cadText(ctx, '1', triX + 7, triY - triH / 2, 11, pal.titleCyan, 'left', '700');
      cadText(ctx, '0.3', triX - triW / 2, triY + 10, 10.5, pal.titleCyan, 'center', '700');

      // =====================================================================
      // 6) ALL DIMENSIONS ON CROSS-SECTION (100% Matching DXF *D13..*D19)
      // =====================================================================
      // (a) Top B2 (壁厚, *D14) & B (溝寬, *D15)
      cadDim(ctx, xTopOutL, ySecTop, xTopInL, ySecTop, -22, `B2 (${p.B2_cm})`, pal, 11.5);
      cadDim(ctx, xTopInL, ySecTop, xTopInR, ySecTop, -22, `B (${p.B_cm})`, pal, 11.5);

      // (b) Inside Ditch Bottom Width W (*D19)
      cadDim(ctx, xBedInL, yInvert - 18, xBedInR, yInvert - 18, -14, `W (${p.W_cm})`, pal, 11.5);

      // (c) Left Vertical Ditch Depth H (*D13)
      const xDimH = xTopOutL - 36;
      cadLine(ctx, xTopOutL - 4, ySecTop, xDimH - 6, ySecTop, pal.dimLine, 0.95);
      cadLine(ctx, xBedInL - rLong, yInvert, xDimH - 6, yInvert, pal.dimLine, 0.95);
      cadDim(ctx, xDimH, ySecTop, xDimH, yInvert, 0, `H (${p.H_cm})`, pal, 11.5);

      // (d) Bottom-Left PC Thickness "5" (*D18)
      cadDim(ctx, xPcOutL, yConcBot, xPcOutL, yPcBot, -20, `${p.t_pc_cm}`, pal, 11);

      // (e) Bottom-Right Concrete Thickness B1 (*D16)
      cadLine(ctx, cx + W / 2 + rLong * 0.5, yBedStoneBot, xBotOutR + 36, yBedStoneBot, pal.dimLine, 0.95);
      cadLine(ctx, xBotOutR + 3, yConcBot, xBotOutR + 36, yConcBot, pal.dimLine, 0.95);
      cadDim(ctx, xBotOutR + 28, yBedStoneBot, xBotOutR + 28, yConcBot, 0, `B1 (${p.B1_cm})`, pal, 11);

      // (f) Top-Right Sloped Concrete Backing Thickness B1 (*D17)
      const xBackR2 = xTopOutR - (xTopOutR - xBotOutR) * 0.22;
      const yBackR2 = ySecTop + (yConcBot - ySecTop) * 0.22;
      cadDim(
        ctx,
        secondRightStoneBackPt[0], secondRightStoneBackPt[1],
        xBackR2, yBackR2,
        -28,
        `B1 (${p.B1_cm})`,
        pal, 11
      );

      // =====================================================================
      // 7) ALL 4 CALLOUT LEADERS ON CROSS-SECTION (100% Matching DXF 11A19..11A20)
      // =====================================================================
      // (1) Top-Right Leader (11A19, 11A1A): 漿砌塊石，表面不勾縫 / φ=25~30cm佔80%以上
      cadLeaderArrow(
        ctx,
        topRightStonePt[0] - 4, ySecTop,
        topRightStonePt[0] + 24, ySecTop - 42,
        topRightStonePt[0] + 36, ySecTop - 42,
        ['漿砌塊石，表面不勾縫', `φ=${p.D_stone_cm}~30cm佔80%以上`],
        pal, 11.5
      );

      // (2) Bottom-Right Leader 1 (11A1B, 11A1C): 210kgf/cm²混凝土
      const leadX = cx + W * 0.28;
      cadLeaderArrow(
        ctx,
        leadX, (yBedStoneBot + yConcBot) / 2,
        leadX, yPcBot + 22,
        leadX + 18, yPcBot + 22,
        ['210kgf/c㎡混凝土'],
        pal, 11.2
      );

      // (3) Bottom-Right Leader 2 (11A1D, 11A1E): 140kgf/cm²打底混凝土
      cadLeaderArrow(
        ctx,
        leadX, (yConcBot + yPcBot) / 2,
        leadX, yPcBot + 44,
        leadX + 18, yPcBot + 44,
        [`140kgf/c㎡打底混凝土 (厚${p.t_pc_cm}cm)`],
        pal, 11.2
      );

      // (4) Bottom-Right Leader 3 (11A1F, 11A20): 基層土壤壓實
      cadLeaderArrow(
        ctx,
        leadX, yPcBot + 3,
        leadX, yPcBot + 66,
        leadX + 18, yPcBot + 66,
        ['基層土壤壓實 (壓實度≧80%)'],
        pal, 11.2
      );

      // Section Titles (matching DXF F572, F573, 9AA4):
      const secTitleY = yPcBot + 86;
      cadText(ctx, '漿砌塊石溝剖面圖 (斷面圖)', cx, secTitleY, 16, pal.titleOrange, 'center', '700');
      cadLine(ctx, cx - 98, secTitleY + 9, cx + 98, secTitleY + 9, pal.titleOrange, 1.4);
      cadText(ctx, 'Scale:  1 / 10', cx + 18, secTitleY + 23, 11.5, pal.titleOrange, 'center', '600');

      return {
        rightX: xTopOutR + 185,
        bottomY: secTitleY + 34
      };
    }

    // =========================================================================
    // 5. VIEW 3 & 4: 自動補齊之【縱斷面展開圖】 (LONGITUDINAL PROFILE) & 原圖【符號說明】 (1009B)
    // =========================================================================
    function drawLongitudinalProfileAndLegend(ctx, ox, topY, p, pal) {
      const s = 1.45;
      const L_draw = Math.min(340, p.L_draw_cm * 1.55);
      const H = p.H_cm * s;
      const D_stone = p.D_stone_cm * s;
      const B1 = p.B1_cm * s;
      const t_pc = p.t_pc_cm * s;

      const x0 = ox + 55;
      const x1 = x0 + L_draw;

      const yTop = topY + 46;                            // Ditch top crest
      const yInvert = yTop + H;                          // Ditch invert (top of bed boulders)
      const yBedStoneBot = yInvert + D_stone * p.kEmb;     // Bottom of 2/3 embedded bed boulders
      const yConcBot = yBedStoneBot + B1;                // Bottom of 210kgf/cm² concrete
      const yPcBot = yConcBot + t_pc;                    // Bottom of 140kgf/cm² PC pad

      // 1) Side Wall Unpointed Boulder Elevation in Background of Longitudinal Profile (表面不勾縫)
      cadPoly(ctx, [[x0, yTop], [x1, yTop], [x1, yInvert], [x0, yInvert]], pal.concOutline, 1.35, true, 'rgba(30, 41, 59, 0.45)', [], 'PROF_WALL_BG');

      const nRowsWall = p.N_wall;
      const rowH = H / nRowsWall;
      const colW = (p.bedPitch_cm * 1.15) * s;
      const nCols = Math.max(6, Math.round(L_draw / colW));
      const actualColW = L_draw / nCols;

      for (let r = 0; r < nRowsWall; r++) {
        const ry = yTop + (r + 0.5) * rowH;
        const stag = (r % 2 === 1) ? actualColW * 0.48 : 0;
        for (let c = 0; c < nCols; c++) {
          const rx = x0 + (c + 0.5) * actualColW + stag;
          if (rx + actualColW * 0.44 <= x1 + 2) {
            drawWetMasonryBoulder(ctx, rx, ry, actualColW * 0.45, rowH * 0.44, 0.05 * ((r + c) % 2 ? 1 : -1), r * 29 + c, pal, false, 'PROF_WALL_STONE');
          }
        }
      }

      // 2) 210kgf/cm² Concrete Base Slab & Embedded Bed Boulders (埋入PC 2/3, 露出 1/3)
      cadPoly(ctx, [[x0, yInvert], [x1, yInvert], [x1, yConcBot], [x0, yConcBot]], pal.concOutline, 1.45, true, pal.concFill, [], 'PROF_CONC_210');

      const yBedCenter = yInvert + (D_stone * 0.5) * (1 / 3);
      for (let c = 0; c < nCols; c++) {
        const bx = x0 + (c + 0.5) * actualColW;
        drawWetMasonryBoulder(ctx, bx, yBedCenter, D_stone * 0.48, actualColW * 0.45, Math.PI / 2, c * 17 + 9, pal, true, 'PROF_BED_STONE');
      }

      // AR-CONC Concrete Stipple in B1 layer below bed boulders
      for (let ax = x0 + 16; ax < x1 - 12; ax += 26) {
        const ay = (yBedStoneBot + yConcBot) / 2;
        cadPoly(ctx, [[ax, ay], [ax + 4, ay - 2.5], [ax + 2.5, ay + 2.5]], pal.concDots, 0.85, true, null, [], 'PROF_AR_CONC');
        cadCircle(ctx, ax + 9, ay, 0.8, pal.concDots, 0.8, pal.concDots);
      }

      // 3) 140kgf/cm² 5cm PC Leveling Pad & Subgrade Compaction Hatch
      cadPoly(ctx, [[x0, yConcBot], [x1, yConcBot], [x1, yPcBot], [x0, yPcBot]], pal.pcOutline, 1.45, true, pal.pcFill, [], 'PROF_PC_140');
      for (let hx = x0 + 28; hx < x1 - 24; hx += 65) {
        for (let k = 0; k < 3; k++) {
          cadLine(ctx, hx + k * 5, yPcBot, hx + k * 5 - 6, yPcBot + 7, pal.stoneHatch, 1.05, [], 'PROF_SUBGRADE');
        }
      }

      // Left & Right Z-Break Lines on Longitudinal Profile
      drawBreakLine(ctx, x0, yTop - 8, x0, yPcBot + 8, pal);
      drawBreakLine(ctx, x1, yTop - 8, x1, yPcBot + 8, pal);

      // Dimensions on Longitudinal Profile
      cadDim(ctx, x0, yTop, x1, yTop, -20, `縱斷面展示長 L = ${p.L_draw_cm}cm (塊石埋入PC 2/3・露出1/3・表面不勾縫)`, pal, 10.8);
      cadDim(ctx, x0, yTop, x0, yInvert, -22, `H (${p.H_cm})`, pal, 11);
      cadDim(ctx, x1, yBedStoneBot, x1, yConcBot, 20, `B1 (${p.B1_cm})`, pal, 10.5);
      cadDim(ctx, x1, yConcBot, x1, yPcBot, 20, `${p.t_pc_cm}`, pal, 10.5);

      const profTitleY = yPcBot + 34;
      cadText(ctx, '漿砌塊石溝縱斷面展開圖 (自動補齊)', (x0 + x1) / 2, profTitleY, 15, pal.titleCyan, 'center', '700');
      cadLine(ctx, (x0 + x1) / 2 - 120, profTitleY + 9, (x0 + x1) / 2 + 120, profTitleY + 9, pal.titleCyan, 1.3);

      // =====================================================================
      // PART B: 原圖【符號說明：B, W, B1, B2, H】 (100% Matching DXF Entity 1009B)
      // =====================================================================
      const legX = x0;
      const legY = profTitleY + 36;
      const legW = L_draw;
      const legH = 142;

      cadPoly(ctx, [
        [legX, legY],
        [legX + legW, legY],
        [legX + legW, legY + legH],
        [legX, legY + legH]
      ], pal.tableBorder, 1.2, true, 'rgba(15, 23, 42, 0.88)', [], 'SYMBOL_LEGEND_1009B');

      cadText(ctx, '符號說明：', legX + 14, legY + 18, 12.5, pal.titleCyan, 'left', '700');
      const symItems = [
        `B    溝寬 (當前 ${p.B_cm} cm)`,
        `W    溝底寬 (當前 ${p.W_cm} cm，橫向 ${p.N_bed} 顆塊石)`,
        `B1   澆置混凝土厚度 (當前 ${p.B1_cm} cm，210kgf/c㎡)`,
        `B2   壁厚 (當前 ${p.B2_cm} cm)`,
        `H    溝深 (當前 ${p.H_cm} cm，單側 ${p.N_wall} 層塊石)`
      ];
      symItems.forEach((st, idx) => {
        cadText(ctx, st, legX + 18, legY + 40 + idx * 20.5, 11, pal.textMain, 'left', '600');
      });

      return {
        rightX: x1 + 65,
        bottomY: legY + legH + 20
      };
    }

    // =========================================================================
    // 6. VIEW 5: EXPLICIT FIGURE-NUMBER QUANTITY TABLE ON CANVAS
    // =========================================================================
    function drawExplicitFormulaTableOnCanvas(ctx, ox, oy, p, pal) {
      cadText(
        ctx,
        `【漿砌石溝 (圖號 0505-1 / 059) 每公尺數量計算式表 — 採用圖面標註數字顯式列式 (W=${p.W_cm}・H=${p.H_cm}・B=${p.B_cm}・B1=${p.B1_cm}・B2=${p.B2_cm}cm・全段=${p.L_tot_m.toFixed(1)}m)】`,
        ox, oy - 15, 13.2, pal.dimText, 'left', '700'
      );

      const colW = [245, 495, 82, 92, 52];
      const rowH = 26;
      const rows = [
        ['工程項目名稱 (依DXF圖面標註)', '採用圖面標註數字之顯式計算式 (每公尺基準)', '每m數量', `全段(${p.L_tot_m}m)`, '單位'],
        [`漿砌塊石，表面不勾縫 (φ=${p.D_stone_cm}~30cm佔80%以上)`, p.formula_stone_vol, p.q_stone_vol.toFixed(2), (p.q_stone_vol * p.L_tot_m).toFixed(2), 'M³'],
        [`臨水面砌石不填縫表面積 (露出1/3・埋入PC 2/3)`, p.formula_stone_area, p.q_stone_area.toFixed(2), (p.q_stone_area * p.L_tot_m).toFixed(1), 'M²'],
        [`210kgf/c㎡ 背澆置混凝土 (厚B1=${p.B1_cm}cm, 壁厚B2=${p.B2_cm}cm)`, p.formula_rc210_vol, p.q_rc210_vol.toFixed(2), (p.q_rc210_vol * p.L_tot_m).toFixed(2), 'M³'],
        [`140kgf/c㎡ 打底混凝土 (厚 ${p.t_pc_cm}cm)`, p.formula_pc140_vol, p.q_pc140_vol.toFixed(2), (p.q_pc140_vol * p.L_tot_m).toFixed(2), 'M³'],
        ['基層土壤壓實 (壓實度應達 80% 以上為原則)', p.formula_compact_area, p.q_compact_area.toFixed(2), (p.q_compact_area * p.L_tot_m).toFixed(1), 'M²']
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
          const color = isHeader ? pal.textMain : (cIdx === 2 ? pal.dimText : (cIdx === 3 ? pal.stoneOutline : pal.textSub));
          cadText(ctx, cellStr, tx, ry, isHeader ? 11.2 : 10.6, color, align, (isHeader || cIdx === 2 || cIdx === 3) ? '700' : '500');
          cx += cw;
        });
      });

      return { bottomY: oy + totH };
    }

    // =========================================================================
    // 7. MAIN RENDER ENGINE & LIVE UI UPDATER
    // =========================================================================
    function updateSidebarSummary(p) {
      document.getElementById('stat_ditch_tag').textContent = `W=${p.W_cm}・H=${p.H_cm}・B=${p.B_cm}cm`;
      document.getElementById('stat_stone_m').textContent = `${p.q_stone_vol.toFixed(2)} M³/m`;
      document.getElementById('stat_rc210_m').textContent = `${p.q_rc210_vol.toFixed(2)} M³/m`;
      document.getElementById('stat_pc140_m').textContent = `${p.q_pc140_vol.toFixed(2)} M³/m`;
      document.getElementById('stat_compact_m').textContent = `${p.q_compact_area.toFixed(2)} M²/m`;
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

      if (currentView === 'PLAN_SEC') {
        const bPS = drawPlanAndSectionViews(ctx, 40, 12, p, pal);
        drawExplicitFormulaTableOnCanvas(ctx, 40, bPS.bottomY + 42, p, pal);
      } else if (currentView === 'PROF_ONLY') {
        const bProf = drawLongitudinalProfileAndLegend(ctx, 60, 12, p, pal);
        drawExplicitFormulaTableOnCanvas(ctx, 50, bProf.bottomY + 42, p, pal);
      } else {
        // 'ALL' Full Standard Sheet Layout (Matching A3 Layout 5-05 of DXF):
        // - Left Column: 自動補齊之俯視平面圖 (Top) + 漿砌塊石溝剖面圖 (Bottom, 1:1 Vertically Aligned, G.L. terrain stripped!)
        // - Right Column: 自動補齊之縱斷面展開圖 (Top) + 原圖符號說明 (B, W, B1, B2, H)
        // - Bottom Full-Width: 圖面標註數字顯式計算式表
        const bPS = drawPlanAndSectionViews(ctx, 20, 10, p, pal);
        const rightColX = bPS.rightX + 25;
        const bProf = drawLongitudinalProfileAndLegend(ctx, rightColX, 10, p, pal);

        const tableY = Math.max(bPS.bottomY, bProf.bottomY) + 42;
        drawExplicitFormulaTableOnCanvas(ctx, 35, tableY, p, pal);
      }

      ctx.restore();
    }

    // =========================================================================
    // 8. UI CONTROLS, AUTO-SYNC & DXF / CSV EXPORTERS
    // =========================================================================
    function stepCount(inputId, delta, callbackFn) {
      const el = document.getElementById(inputId);
      if (!el) return;
      const minV = parseFloat(el.min) || 2;
      const maxV = parseFloat(el.max) || 12;
      const curV = Math.round(parseFloat(el.value) || minV);
      el.value = Math.max(minV, Math.min(maxV, curV + delta));
      if (typeof callbackFn === 'function') callbackFn();
    }

    function onBedCountInput() {
      const nBed = Math.max(2, Math.min(12, Math.round(parseFloat(document.getElementById('inp_N_bed').value) || 4)));
      document.getElementById('inp_W_cm').value = Math.round(nBed * 12.5);
      renderAll();
    }

    function onWidthInput() {
      const wCm = parseFloat(document.getElementById('inp_W_cm').value) || 50;
      const nBed = Math.max(2, Math.min(12, Math.round(wCm / 12.5)));
      document.getElementById('inp_N_bed').value = nBed;
      document.getElementById('inp_W_cm').value = Math.round(nBed * 12.5);
      renderAll();
    }

    function onWallCountInput() {
      const nWall = Math.max(3, Math.min(12, Math.round(parseFloat(document.getElementById('inp_N_wall').value) || 5)));
      document.getElementById('inp_H_cm').value = Math.round(nWall * 14.0);
      renderAll();
    }

    function onHeightInput() {
      const hCm = parseFloat(document.getElementById('inp_H_cm').value) || 70;
      const nWall = Math.max(3, Math.min(12, Math.round(hCm / 14.0)));
      document.getElementById('inp_N_wall').value = nWall;
      document.getElementById('inp_H_cm').value = Math.round(nWall * 14.0);
      renderAll();
    }

    function onB1Change() {
      const b1 = parseFloat(document.getElementById('inp_B1_cm').value) || 15;
      // In original DXF: B2 = 2 * B1 (30.4cm vs 15.1cm)
      document.getElementById('inp_B2_cm').value = Math.round(b1 * 2);
      renderAll();
    }

    function onGeomChange() {
      renderAll();
    }

    function resetToOrig() {
      Object.keys(ORIG_WET_MASONRY_DITCH).forEach(k => {
        const el = document.getElementById('inp_' + k);
        if (el) el.value = ORIG_WET_MASONRY_DITCH[k];
      });
      renderAll();
    }

    function switchView(view) {
      currentView = view;
      const specEl = document.getElementById('specPanel');
      const tabs = {
        ALL: document.getElementById('tab-all'),
        PLAN_SEC: document.getElementById('tab-plan-sec'),
        PROF_ONLY: document.getElementById('tab-prof'),
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
      if (currentView === 'PLAN_SEC') {
        viewCam.scale = Math.min(rect.width / 1040, rect.height / 940) * 0.93;
        viewCam.offsetX = Math.max(25, (rect.width - 980 * viewCam.scale) / 2);
        viewCam.offsetY = 14;
      } else if (currentView === 'PROF_ONLY') {
        viewCam.scale = Math.min(rect.width / 1040, rect.height / 860) * 0.93;
        viewCam.offsetX = Math.max(25, (rect.width - 980 * viewCam.scale) / 2);
        viewCam.offsetY = 14;
      } else {
        viewCam.scale = Math.min(rect.width / 1320, rect.height / 960) * 0.94;
        viewCam.offsetX = Math.max(20, (rect.width - 1260 * viewCam.scale) / 2);
        viewCam.offsetY = 12;
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
      a.download = `漿砌石溝標準圖_0505-1_W${p.W_cm}_H${p.H_cm}cm_含補齊平縱面.dxf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }

    function exportCSV() {
      const p = getParams();
      const rows = [
        [`漿砌石溝標準圖 (圖號 0505-1 / 059・溝底寬W=${p.W_cm}cm・溝深H=${p.H_cm}cm・溝寬B=${p.B_cm}cm・混凝土厚B1=${p.B1_cm}cm・壁厚B2=${p.B2_cm}cm) - 圖面標註數字顯式列式數量計算書`],
        ['工程項目名稱', '採用圖面標註數字之顯式計算式 (每公尺基準)', '每公尺數量', `全段數量(${p.L_tot_m}m)`, '單位'],
        [`漿砌塊石，表面不勾縫 (φ=${p.D_stone_cm}~30cm佔80%以上)`, `'${p.formula_stone_vol}`, p.q_stone_vol.toFixed(2), (p.q_stone_vol * p.L_tot_m).toFixed(2), 'M³'],
        [`臨水面砌石不填縫表面積 (露出1/3・埋入PC 2/3)`, `'${p.formula_stone_area}`, p.q_stone_area.toFixed(2), (p.q_stone_area * p.L_tot_m).toFixed(1), 'M²'],
        [`210kgf/c㎡ 背澆置混凝土 (厚B1=${p.B1_cm}cm, 壁厚B2=${p.B2_cm}cm)`, `'${p.formula_rc210_vol}`, p.q_rc210_vol.toFixed(2), (p.q_rc210_vol * p.L_tot_m).toFixed(2), 'M³'],
        [`140kgf/c㎡ 打底混凝土 (厚 ${p.t_pc_cm}cm)`, `'${p.formula_pc140_vol}`, p.q_pc140_vol.toFixed(2), (p.q_pc140_vol * p.L_tot_m).toFixed(2), 'M³'],
        ['基層土壤壓實 (壓實度應達 80% 以上為原則)', `'${p.formula_compact_area}`, p.q_compact_area.toFixed(2), (p.q_compact_area * p.L_tot_m).toFixed(1), 'M²']
      ];

      const csvContent = '\uFEFF' + rows.map(r => r.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `漿砌石溝顯式列式計算書_0505-1_W${p.W_cm}xH${p.H_cm}.csv`;
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

  const STRIP = s => String(s).replace(/\s*[（(]\s*圖號[^）)]*[）)]/g, '').replace(/\s*[（(]\s*\d{4}-\d\s*[/／]\s*\d{3}\s*[）)]/g, '').replace(/\s*圖號\s*[：:]?\s*[0-9A-Za-z#\-／/ ]+/g, ' ');
  function params(R) { Object.keys(R || {}).forEach(k => { el('inp_' + k).value = String(R[k]); }); return getParams(); }
  function run(R, OV) {
    O = []; const PAL = getPalette(), p = params(R); Object.assign(p, R || {}, OV || {});
    const bPS = drawPlanAndSectionViews(CTX, 20, 10, p, PAL), bProf = drawLongitudinalProfileAndLegend(CTX, bPS.rightX + 25, 10, p, PAL); drawExplicitFormulaTableOnCanvas(CTX, 35, Math.max(bPS.bottomY, bProf.bottomY) + 42, p, PAL);
    
    const sc = 1 / 1.65; return O.map(o => { const r = Object.assign({}, o); if (r.p) r.p = r.p.map(([x, y]) => [x * sc, y * sc]); if (r.x !== undefined) { r.x *= sc; r.y *= sc; } if (r.r) r.r *= sc; if (r.h) r.h *= sc; if (r.s !== undefined && r.k === 'T') r.s = STRIP(r.s); return r; });
  }
  return { run, params };
})();
TCO_D['gab'] = (function () {
  let O = [];
  const EL = {}, CTX = new Proxy({}, { get: (t, k) => (k in t ? t[k] : () => ({ width: 0 })), set: (t, k, v) => { t[k] = v; return true; } });
  const el = id => EL[id] || (EL[id] = { value: '', textContent: '', innerHTML: '', className: '', style: {}, classList: { add() {}, remove() {}, toggle() {} }, addEventListener() {}, getContext: () => CTX, parentElement: { getBoundingClientRect: () => ({ width: 100, height: 100 }) } });
  const document = { getElementById: el, querySelectorAll: () => [], querySelector: () => null, createElement: () => ({ click() {}, style: {} }), body: { appendChild() {}, removeChild() {}, classList: { add() {}, remove() {}, toggle() {}, contains: () => false } }, documentElement: { classList: { contains: () => false, add() {}, remove() {}, toggle() {} } }, addEventListener() {} };
  const window = { addEventListener() {}, devicePixelRatio: 1, matchMedia: () => ({ matches: false, addEventListener() {} }) };

    // =========================================================================
    // 1. ORIGINAL DXF BASELINE CONSTANTS & GLOBAL STATE (PURE ASCII IDENTIFIERS)
    // =========================================================================
    const ORIG_GABION_DITCH = {
      W_cm: 200,
      B1_cm: 150,
      B2_cm: 100,
      B3_cm: 50,
      B4_cm: 100,
      H1_cm: 50,
      N_side: 2,
      H_cm: 100,
      L_pile_cm: 200,
      d_pile_cm: 10,
      geo_up_cm: 60,
      N_rows: 3,
      S_long_pct: 6.8,
      L_tot_m: 30.0
    };

    let currentView = 'ALL'; // 'ALL', 'FRONT_PLAN', 'PROFILE_DETAIL', 'SPEC'
    let showGhost = false;
    let isDarkTheme = true;

    let viewCam = {
      scale: 0.68,
      offsetX: 28,
      offsetY: 16,
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

      const W_cm = Math.max(80, num('inp_W_cm', 200));
      const B1_cm = Math.max(80, num('inp_B1_cm', 150));
      const B2_cm = Math.max(50, num('inp_B2_cm', 100));
      const B3_cm = Math.max(0, num('inp_B3_cm', 50));
      const B4_cm = Math.max(40, num('inp_B4_cm', 100));
      const H1_cm = Math.max(30, num('inp_H1_cm', 50));
      const N_side = Math.max(1, Math.min(5, Math.round(num('inp_N_side', 2))));
      const L_pile_cm = Math.max(100, num('inp_L_pile_cm', 200));
      const d_pile_cm = Math.max(8, num('inp_d_pile_cm', 10));
      const geo_up_cm = Math.max(20, num('inp_geo_up_cm', 60));
      const N_rows = Math.max(2, Math.min(6, Math.round(num('inp_N_rows', 3))));
      const S_long_pct = Math.max(0.5, num('inp_S_long_pct', 6.8));
      const L_tot_m = Math.max(2.0, num('inp_L_tot_m', 30.0));

      const H_cm = N_side * H1_cm; // Ditch depth H = N_side * H1 (2 * 50 = 100cm)
      const W_top_cm = W_cm + 2 * (N_side - 1) * B3_cm; // W + 2 * B3 (200 + 2*50 = 300cm)
      const W_outer_tot_cm = W_top_cm + 2 * B1_cm;      // Total outer span across top gabion wings (300 + 2*150 = 600cm)

      const elH = document.getElementById('inp_H_cm');
      if (elH) elH.value = H_cm;
      const elWtop = document.getElementById('inp_W_top_cm');
      if (elWtop) elWtop.value = W_top_cm;

      const p = {
        W_cm,
        B1_cm,
        B2_cm,
        B3_cm,
        B4_cm,
        H1_cm,
        N_side,
        H_cm,
        W_top_cm,
        W_outer_tot_cm,
        L_pile_cm,
        d_pile_cm,
        geo_up_cm,
        N_rows,
        S_long_pct,
        L_tot_m
      };

      const W_m = +(W_cm / 100).toFixed(2);
      const B1_m = +(B1_cm / 100).toFixed(2);
      const B2_m = +(B2_cm / 100).toFixed(2);
      const B3_m = +(B3_cm / 100).toFixed(2);
      const B4_m = +(B4_cm / 100).toFixed(2);
      const H1_m = +(H1_cm / 100).toFixed(2);
      const H_m = +(H_cm / 100).toFixed(2);
      const Lpile_m = +(L_pile_cm / 100).toFixed(2);
      const geoup_m = +(geo_up_cm / 100).toFixed(2);

      // 1. 兩側階梯箱型石籠 (每側 N_side 層, 單箱 B1×B2×H1) + 溝底箱型石籠/卵塊石層 (厚 H1):
      // Side gabions cross-sectional area = 2 sides * N_side * B1_m * H1_m
      // Bed gabion/cobble layer cross-sectional area = (W_m + 2 * Math.max(0.5, B1_m - B3_m)) * H1_m -> in DXF bottom layer spans 2*B1_m = 3.00m
      const bedSpan_m = +(W_m + 2 * Math.max(0.3, B1_m - B3_m * (N_side - 1) - 0.50)).toFixed(2); // 2.00 + 2*0.50 = 3.00m in original DXF
      const sideGabionArea = +(2 * N_side * B1_m * H1_m).toFixed(2); // 2 * 2 * 1.50 * 0.50 = 3.00 m2
      const bedGabionArea = +(bedSpan_m * H1_m).toFixed(2);          // 3.00 * 0.50 = 1.50 m2

      p.q_gabion_vol = +((sideGabionArea + bedGabionArea) * 1.0).toFixed(2); // 4.50 M3/m
      p.formula_gabion_vol = `[兩側箱籠(2側*${N_side}層*B1(${B1_m.toFixed(2)}m)*H1(${H1_m.toFixed(2)}m)=${sideGabionArea.toFixed(2)}M²) + 溝底層(${bedSpan_m.toFixed(2)}m*H1(${H1_m.toFixed(2)}m)=${bedGabionArea.toFixed(2)}M²)] * 1.00m`;

      // 2. 鍍鋅低碳鋼線箱型石籠網 (線徑≧3.5mm, 六角網孔20×15cm, 單箱 B1×B2×H1):
      const singleBoxVol = +(B1_m * B2_m * H1_m).toFixed(3); // 1.50 * 1.00 * 0.50 = 0.75 m3/組
      const boxesPerRow = 2 * N_side + Math.round(bedSpan_m / B1_m); // 4 side + 1~2 bed = 5~6 組/排
      p.q_mesh_sets = +(p.q_gabion_vol / singleBoxVol).toFixed(2);
      p.formula_mesh_sets = `每公尺石籠總體積 ${p.q_gabion_vol.toFixed(2)}M³ / [單箱 B1(${B1_m.toFixed(2)})*B2(${B2_m.toFixed(2)})*H1(${H1_m.toFixed(2)}) = ${singleBoxVol.toFixed(2)}M³/組]`;

      // 3. 防蝕透水不織布 (鋪設於箱籠底部與階梯背側，含兩側外延與上翻 EF9A, EF9B, E239):
      const geoHoriz_m = +(bedSpan_m + 2 * N_side * B3_m + 2 * 0.55).toFixed(2);
      const geoVert_m = +(2 * (N_side + 1) * H1_m + 2 * geoup_m).toFixed(2);
      p.q_geo_area = +((geoHoriz_m + geoVert_m) * 1.0).toFixed(2);
      p.formula_geo_area = `[水平展開(${ geoHoriz_m.toFixed(2) }m) + 階梯垂直段(2側*${N_side+1}階*${H1_m.toFixed(2)}m) + 兩側外包上翻(2*${geoup_m.toFixed(2)}m)] * 1.00m`;

      // 4. 交錯配置杉木樁 (末徑10cm, 長L=200cm, 間距@B4=100cm, 左右兩側各2排交錯):
      p.q_pile_cnt = +(4 * (100 / B4_cm)).toFixed(2); // 2 sides * 2 staggered rows * (100 / 100) = 4.00 支/m
      p.formula_pile_cnt = `左右2側 * 內外2排交錯 * [100cm / 木樁間距B4(${B4_cm}cm)] = ${p.q_pile_cnt.toFixed(2)} 支/m`;

      p.q_pile_len = +(p.q_pile_cnt * Lpile_m).toFixed(2);
      p.formula_pile_len = `${p.q_pile_cnt.toFixed(2)}支/m * 單支樁長L(${Lpile_m.toFixed(2)}m)`;

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
          gabionOutline: '#f8fafc',
          honeyMesh: '#e879f9',
          cobbleOutline: '#d946ef',
          cobbleFill: 'rgba(217, 70, 239, 0.14)',
          pileOutline: '#facc15',
          pileGrain: '#94a3b8',
          pileFill: 'rgba(250, 204, 21, 0.16)',
          geoLine: '#fde047',
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
          gabionOutline: '#0f172a',
          honeyMesh: '#a21caf',
          cobbleOutline: '#86198f',
          cobbleFill: 'rgba(232, 121, 249, 0.22)',
          pileOutline: '#854d0e',
          pileGrain: '#475569',
          pileFill: 'rgba(254, 240, 138, 0.38)',
          geoLine: '#ca8a04',
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

    // Helper: Draw a Gabion Box filled with either HONEY hexagonal wire mesh or Cobble stones (matching DXF D9FD..DB37)
    function drawGabionBox(ctx, x, y, w, h, angleRad, mode, seed, pal, layer = 'GABION') {
      const cosA = Math.cos(angleRad), sinA = Math.sin(angleRad);
      const toWorld = (lx, ly) => [
        x + lx * cosA - ly * sinA,
        y + lx * sinA + ly * cosA
      ];

      const boxPts = [
        toWorld(0, 0),
        toWorld(w, 0),
        toWorld(w, h),
        toWorld(0, h)
      ];
      cadPoly(ctx, boxPts, pal.gabionOutline, 1.45, true, 'rgba(30, 41, 59, 0.55)', [], layer);

      // Proportional cell/stone counts so stones/mesh NEVER stretch when dimensions change!
      const nCols = Math.max(3, Math.round(w / 14));
      const nRows = Math.max(2, Math.round(h / 11));
      const cw = w / nCols;
      const rh = h / nRows;

      if (mode === 'COBBLE') {
        // Fill with natural rounded cobble stones (matching DXF SPLINEs DA35..DB37)
        for (let r = 0; r < nRows; r++) {
          const stag = (r % 2 === 1) ? 0.16 : -0.10;
          for (let c = 0; c < nCols; c++) {
            const lx = (c + 0.5 + stag) * cw;
            const ly = (r + 0.5) * rh;
            if (lx < cw * 0.35 || lx > w - cw * 0.35) continue;
            const rx = cw * 0.44, ry = rh * 0.43;
            const pts = [];
            for (let k = 0; k < 8; k++) {
              const a = (k / 8) * Math.PI * 2;
              const jit = 0.88 + 0.14 * Math.sin(seed + r * 7.3 + c * 3.7 + k * 2.1);
              pts.push(toWorld(lx + Math.cos(a) * rx * jit, ly + Math.sin(a) * ry * jit));
            }
            cadPoly(ctx, pts, pal.cobbleOutline, 1.05, true, pal.cobbleFill, [], layer + '_STONE');
          }
        }
      } else {
        // Fill with HONEY hexagonal wire mesh pattern (matching DXF HATCH `HONEY` D9FD, DAC1, DAC3, DE38..DE60)
        for (let r = 0; r < nRows; r++) {
          const stag = (r % 2 === 1) ? cw * 0.5 : 0;
          const ly = (r + 0.5) * rh;
          for (let c = 0; c < nCols; c++) {
            const lx = (c + 0.5) * cw + stag;
            if (lx + cw * 0.38 > w) continue;
            const rx = cw * 0.42, ry = rh * 0.44;
            const hexPts = [
              toWorld(lx - rx * 0.5, ly - ry),
              toWorld(lx + rx * 0.5, ly - ry),
              toWorld(lx + rx, ly),
              toWorld(lx + rx * 0.5, ly + ry),
              toWorld(lx - rx * 0.5, ly + ry),
              toWorld(lx - rx, ly)
            ];
            cadPoly(ctx, hexPts, pal.honeyMesh, 0.9, true, null, [], layer + '_HONEY');
          }
        }
      }
    }

    // Helper: Draw a Cedar Timber Pile (杉木樁 末徑10cm 長200cm) in Elevation/Profile with pointed tip & centerline (matching DXF DD46..DD8E & EC8C..ECC6)
    function drawTimberPileElev(ctx, topX, topY, wPile, lenPile, angleRad, hiddenLen, pal) {
      const cosA = Math.cos(angleRad), sinA = Math.sin(angleRad);
      // Local +u is across pile width, local +v is down along pile axis
      const pPt = (u, v) => [
        topX + u * cosA - v * sinA,
        topY + u * sinA + v * cosA
      ];

      const tipH = Math.min(wPile * 2.0, lenPile * 0.12);
      const yShoulder = lenPile - tipH;

      // Upper portion inside gabions (drawn dashed if hiddenLen > 0, as in Longitudinal Profile EC93, EC9B, DF7D)
      if (hiddenLen > 0) {
        cadPoly(ctx, [
          pPt(-wPile / 2, 0),
          pPt(wPile / 2, 0),
          pPt(wPile / 2, hiddenLen),
          pPt(-wPile / 2, hiddenLen)
        ], pal.pileOutline, 1.2, true, null, [5, 3], 'PILE_HIDDEN');
      }

      const vStart = hiddenLen > 0 ? hiddenLen : 0;
      cadPoly(ctx, [
        pPt(-wPile / 2, vStart),
        pPt(wPile / 2, vStart),
        pPt(wPile / 2, yShoulder),
        pPt(0, lenPile),
        pPt(-wPile / 2, yShoulder)
      ], pal.pileOutline, 1.45, true, pal.pileFill, [], 'PILE_BODY');

      // Wavy collar line above pointed tip & wood grain lines (matching DXF DD46, DD49, DD4B)
      cadLine(ctx, ...pPt(-wPile / 2, yShoulder), ...pPt(wPile / 2, yShoulder), pal.pileOutline, 1.1);
      cadLine(ctx, ...pPt(-wPile * 0.26, vStart + 2), ...pPt(-wPile * 0.26, yShoulder), pal.pileGrain, 0.85);
      cadLine(ctx, ...pPt(wPile * 0.26, vStart + 2), ...pPt(wPile * 0.26, yShoulder), pal.pileGrain, 0.85);

      // Centerline along the timber pile (matching DXF CENTER line DD52, ECC5)
      cadLine(ctx, ...pPt(0, -4), ...pPt(0, lenPile + 4), pal.dimLine, 0.85, [10, 3, 2, 3], 'PILE_CL');
    }

    // Helper: Draw a Plan View Timber Pile Head (Concentric circles + cross-hair, matching DXF ED2C..ED43 & DE6B..DEB2)
    function drawTimberPilePlanCircle(ctx, cx, cy, r, pal) {
      cadCircle(ctx, cx, cy, r, pal.pileOutline, 1.35, '#0b1120', [], 'PLAN_PILE');
      cadCircle(ctx, cx, cy, r * 0.78, pal.pileGrain, 0.95, null, [], 'PLAN_PILE_RING');
      cadCircle(ctx, cx, cy, r * 0.52, pal.pileGrain, 0.85, null, [], 'PLAN_PILE_RING');
      cadLine(ctx, cx - r * 0.72, cy - r * 0.65, cx + r * 0.72, cy + r * 0.65, pal.pileGrain, 0.9);
      cadLine(ctx, cx + r * 0.65, cy - r * 0.72, cx - r * 0.65, cy + r * 0.72, pal.pileGrain, 0.9);
    }

    // Helper: Draw Z-Break Line (截斷線, matching DXF DE62, DE64, E085, E9FC)
    function drawBreakLine(ctx, x1, y1, x2, y2, pal) {
      const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
      const dx = x2 - x1, dy = y2 - y1;
      const L = Math.hypot(dx, dy) || 1;
      const ux = dx / L, uy = dy / L;
      const nx = -uy, ny = ux;
      const zS = 5.5, zA = 6.0;
      cadPoly(ctx, [
        [x1, y1],
        [mx - ux * zS, my - uy * zS],
        [mx - ux * (zS * 0.35) + nx * zA, my - uy * (zS * 0.35) + ny * zA],
        [mx + ux * (zS * 0.35) - nx * zA, my + uy * (zS * 0.35) - ny * zA],
        [mx + ux * zS, my + uy * zS],
        [x2, y2]
      ], pal.dimLine, 1.15, false, null, [], 'BREAK_LINE');
    }

    // =========================================================================
    // 4. VIEW 1 & 2: 平面圖 (TOP PLAN VIEW) & 正面圖 (FRONT CROSS-SECTION VIEW)
    //    Strictly 1:1 Vertically Aligned along X-axis (matching DXF Model Space X ≈ 3651..3712)!
    //    - Natural terrain lines on left & right banks (DCBF..DD45) are 100% STRIPPED!
    //    - Plan View (Top):
    //      * N_rows staggered courses of Gabion Boxes (HONEY hatch)
    //      * Staggered Cedar Timber Piles (d_pile = 10cm, spaced at B4 = 100cm)
    //      * Flow direction arrow (水流方向 ↓) & Top/Bottom Z-Break lines
    //      * Left vertical dimension B2 (單一箱籠寬度), Right vertical dimension B4 (木樁間距)
    //    - Front View (Bottom, 1:1 Aligned):
    //      * Stepped Gabion Boxes: Left side (HONEY hatch) & Right side (Cobble stone detail, matching DXF!)
    //      * Yellow dashed Geotextile (不織布) wrapping under and around the stepped gabions (EF9A, EF9B, E239)
    //      * 4 Staggered Cedar Timber Piles (L = 200cm, 末徑10cm) driven through the gabions into subgrade
    //      * Dimensions: B1, W, W+B3*2, B3, H1 | H1 | H1, H, and 1:1.5 slope label
    // =========================================================================
    function drawPlanAndFrontViews(ctx, ox, topY, p, pal) {
      const s = 0.88; // Scale: 1 cm = 0.88 px

      const W = p.W_cm * s;           // 200 * s
      const B1 = p.B1_cm * s;         // 150 * s
      const B2 = p.B2_cm * s;         // 100 * s
      const B3 = p.B3_cm * s;         // 50 * s
      const B4 = p.B4_cm * s;         // 100 * s
      const H1 = p.H1_cm * s;         // 50 * s
      const H = p.H_cm * s;           // 100 * s
      const L_pile = p.L_pile_cm * s; // 200 * s
      const d_pile = p.d_pile_cm * s; // 10 * s
      const geo_up = p.geo_up_cm * s; // 60 * s

      const W_top = p.W_top_cm * s;   // 300 * s
      const cx = ox + 315;            // Ditch Centerline X (Shared 1:1 by Plan View and Front View!)

      // Key X coordinates symmetric about cx
      const xBedInL = cx - W / 2;
      const xBedInR = cx + W / 2;
      const xTopInL = cx - W_top / 2;
      const xTopInR = cx + W_top / 2;
      const xTopOutL = xTopInL - B1;
      const xTopOutR = xTopInR + B1;

      // Timber Pile X positions on Left & Right wings (matching DXF 3662.6, 3669.56, 3677.33 and 3686.39, 3694.17, 3701.12)
      const xPileOutL = xTopOutL + B1 * 0.72;
      const xPileMidL = xBedInL - B3 * 0.46;
      const xPileInL = xBedInL + B1 * 0.36;

      const xPileInR = xBedInR - B1 * 0.36;
      const xPileMidR = xBedInR + B3 * 0.46;
      const xPileOutR = xTopOutR - B1 * 0.72;

      // =====================================================================
      // PART A: 平面圖 (TOP PLAN VIEW - 100% Matching DXF Y ≈ 2053..2084)
      // =====================================================================
      const planH = p.N_rows * B2;
      const yPlanTop = topY + 38;
      const yPlanBot = yPlanTop + planH;

      // Flow Arrow at Top Center of Plan View (水流方向 ↓, matching DXF E3AD, E3AE)
      cadText(ctx, '水流方向', cx, yPlanTop - 22, 11.5, pal.titleCyan, 'center', '700');
      cadLine(ctx, cx - 14, yPlanTop - 11, cx - 14, yPlanTop - 2, pal.WaterLine || pal.dimLine, 1.5);
      cadPoly(ctx, [[cx - 17, yPlanTop - 6], [cx - 11, yPlanTop - 6], [cx - 14, yPlanTop - 1]], pal.dimLine, 1.2, true, pal.dimLine);

      // Draw N_rows courses of staggered Gabion Boxes in Plan View (matching DXF DE38..DE61)
      for (let r = 0; r < p.N_rows; r++) {
        const ry = yPlanTop + r * B2;
        // Left Outer Wing Gabions (width B1, length B2)
        drawGabionBox(ctx, xTopOutL, ry, B1, B2, 0, 'HONEY', r * 11 + 1, pal, 'PLAN_GAB_OUT_L');
        // Right Outer Wing Gabions (width B1, length B2)
        drawGabionBox(ctx, xTopInR, ry, B1, B2, 0, 'HONEY', r * 11 + 2, pal, 'PLAN_GAB_OUT_R');

        // Left & Right Stepped Slope Gabion Strips (width B3, staggered longitudinally by 0.5*B2 as in DXF DE40, DE46, DE48!)
        drawGabionBox(ctx, xTopInL, ry, B3, B2, 0, 'HONEY', r * 11 + 3, pal, 'PLAN_GAB_STEP_L');
        drawGabionBox(ctx, xBedInR, ry, B3, B2, 0, 'HONEY', r * 11 + 4, pal, 'PLAN_GAB_STEP_R');

        // Central Ditch Bed Gabions (width W = 2 boxes of W/2 each, length B2)
        drawGabionBox(ctx, xBedInL, ry, W / 2, B2, 0, 'HONEY', r * 11 + 5, pal, 'PLAN_GAB_BED_L');
        drawGabionBox(ctx, cx, ry, W / 2, B2, 0, 'HONEY', r * 11 + 6, pal, 'PLAN_GAB_BED_R');

        // Staggered Timber Pile Heads in Plan View (spaced at B4 along flow direction, matching DXF DE6B..DEB2)
        const pyMain = ry + B2 * 0.56;
        const pyStag = ry + B2 * 0.06;
        const rP = Math.max(4.2, (d_pile / 2));

        drawTimberPilePlanCircle(ctx, xPileOutL, pyMain, rP, pal);
        drawTimberPilePlanCircle(ctx, xPileInL, pyMain, rP, pal);
        drawTimberPilePlanCircle(ctx, xPileInR, pyMain, rP, pal);
        drawTimberPilePlanCircle(ctx, xPileOutR, pyMain, rP, pal);

        if (r > 0) {
          drawTimberPilePlanCircle(ctx, xPileMidL, pyStag, rP, pal);
          drawTimberPilePlanCircle(ctx, xPileMidR, pyStag, rP, pal);
        }
      }

      // Top & Bottom Z-Break Lines across Plan View (matching DXF DE62 & DE64)
      drawBreakLine(ctx, xTopOutL - 16, yPlanTop, xTopOutR + 16, yPlanTop, pal);
      drawBreakLine(ctx, xTopOutL - 16, yPlanBot, xTopOutR + 16, yPlanBot, pal);

      // Dimensions on Plan View:
      // Left vertical B2 (單一箱籠寬度, *D25)
      cadDim(ctx, xTopOutL, yPlanBot - B2, xTopOutL, yPlanBot, -22, `B2 (${p.B2_cm})`, pal, 11);
      // Right vertical B4 (木樁間距, *D8)
      const yP1 = yPlanTop + B2 * 0.56;
      const yP2 = yPlanTop + B2 * 1.56;
      cadLine(ctx, xPileOutR + 6, yP1, xTopOutR + 28, yP1, pal.dimLine, 0.9);
      cadLine(ctx, xPileOutR + 6, yP2, xTopOutR + 28, yP2, pal.dimLine, 0.9);
      cadDim(ctx, xTopOutR + 22, yP1, xTopOutR + 22, yP2, 0, `B4 (${p.B4_cm})`, pal, 11);

      const planTitleY = yPlanBot + 26;
      cadText(ctx, '平面圖', cx, planTitleY, 16.5, pal.titleCyan, 'center', '700');
      cadLine(ctx, cx - 32, planTitleY + 10, cx + 32, planTitleY + 10, pal.titleCyan, 1.4);
      cadLine(ctx, cx - 32, planTitleY + 13.5, cx + 32, planTitleY + 13.5, pal.titleCyan, 1.0);

      // =====================================================================
      // PART B: 正面圖 (FRONT CROSS-SECTION VIEW - 1:1 ALIGNED BELOW PLAN VIEW!)
      //         100% Matching DXF Y ≈ 2003..2041 (Natural terrain lines stripped!)
      // =====================================================================
      const yFrontTop = planTitleY + 66;          // Top of upper gabion tier
      const yBedTop = yFrontTop + H;              // Top of ditch bed (invert)
      const yBedBot = yBedTop + H1;               // Bottom of bed gabion layer

      // 1:1 Vertical Alignment Dashed Guides between Plan View and Front View
      [xTopOutL, xTopInL, xBedInL, xBedInR, xTopInR, xTopOutR].forEach((gx) => {
        cadLine(ctx, gx, yPlanBot + 3, gx, yFrontTop - 32, pal.secondaryLine, 0.8, [4, 4], 'ALIGN_GUIDE');
      });

      // 0) Ghost Baseline (Original W=200, H=100, B1=150, B3=50)
      if (showGhost) {
        const gW = 200 * s, gB1 = 150 * s, gB3 = 50 * s, gH1 = 50 * s;
        cadPoly(ctx, [
          [cx - gW / 2 - gB3 - gB1, yFrontTop],
          [cx - gW / 2 - gB3, yFrontTop],
          [cx - gW / 2 - gB3, yFrontTop + gH1],
          [cx - gW / 2, yFrontTop + gH1],
          [cx - gW / 2, yFrontTop + 2 * gH1],
          [cx + gW / 2, yFrontTop + 2 * gH1],
          [cx + gW / 2, yFrontTop + gH1],
          [cx + gW / 2 + gB3, yFrontTop + gH1],
          [cx + gW / 2 + gB3, yFrontTop],
          [cx + gW / 2 + gB3 + gB1, yFrontTop]
        ], pal.ghostLine, 1.1, false, null, [4, 4], 'GHOST_FRONT');
      }

      // 1) Draw Staggered Cedar Timber Piles FIRST (so gabions sit on top and pile shafts extend into subgrade, matching DXF DD46..DD8E)
      // Left 3 piles & Right 3 piles
      drawTimberPileElev(ctx, xPileOutL, yFrontTop, d_pile, L_pile, 0, 0, pal);
      drawTimberPileElev(ctx, xPileMidL, yFrontTop + H1, d_pile, L_pile, 0, 0, pal);
      drawTimberPileElev(ctx, xPileInL, yBedTop, d_pile, L_pile, 0, 0, pal);

      drawTimberPileElev(ctx, xPileInR, yBedTop, d_pile, L_pile, 0, 0, pal);
      drawTimberPileElev(ctx, xPileMidR, yFrontTop + H1, d_pile, L_pile, 0, 0, pal);
      drawTimberPileElev(ctx, xPileOutR, yFrontTop, d_pile, L_pile, 0, 0, pal);

      // 2) Draw Stepped Gabion Boxes in Front View:
      //    Exact match to DXF: Left half uses HONEY hexagonal mesh (`D9FD, DAC1, DAC3`),
      //    Right half shows detailed Cobble Stone fill (`DA35..DB37`)!
      //    (a) Bottom Bed Course (from yBedTop to yBedBot, spanning [cx - B1, cx + B1])
      drawGabionBox(ctx, cx - B1, yBedTop, B1, H1, 0, 'HONEY', 101, pal, 'FRONT_BED_L');
      drawGabionBox(ctx, cx, yBedTop, B1, H1, 0, 'COBBLE', 102, pal, 'FRONT_BED_R');

      //    (b) Side Stepped Courses (sIdx = 0 is lowest side course above bed, sIdx = N_side - 1 is top wing course)
      for (let sIdx = 0; sIdx < p.N_side; sIdx++) {
        const sy = yBedTop - (sIdx + 1) * H1;
        const lxIn = xBedInL - sIdx * B3;
        const lxOut = lxIn - B1;
        const rxIn = xBedInR + sIdx * B3;
        const rxOut = rxIn + B1;

        drawGabionBox(ctx, lxOut, sy, B1, H1, 0, 'HONEY', 200 + sIdx * 2, pal, 'FRONT_SIDE_L');
        drawGabionBox(ctx, rxIn, sy, B1, H1, 0, 'COBBLE', 201 + sIdx * 2, pal, 'FRONT_SIDE_R');
      }

      // 3) Yellow Dashed Geotextile Line (不織布, matching DXF EF9A, EF9B, E239)
      //    Wraps around outer edges and steps down under all gabion courses!
      const gOff = 4.5;
      const geoPts = [
        [xTopOutL - gOff, yFrontTop],
        [xTopOutL - gOff, yFrontTop + H1 + gOff]
      ];
      for (let sIdx = p.N_side - 1; sIdx >= 0; sIdx--) {
        const lxOut = (xBedInL - sIdx * B3) - B1;
        const syBot = yBedTop - sIdx * H1;
        geoPts.push([lxOut - gOff, syBot + gOff]);
        if (sIdx > 0) {
          const nextLxOut = (xBedInL - (sIdx - 1) * B3) - B1;
          geoPts.push([nextLxOut - gOff, syBot + gOff]);
          geoPts.push([nextLxOut - gOff, syBot + H1 + gOff]);
        }
      }
      geoPts.push(
        [cx - B1 - gOff, yBedTop + gOff],
        [cx - B1 - gOff, yBedBot + gOff],
        [cx + B1 + gOff, yBedBot + gOff],
        [cx + B1 + gOff, yBedTop + gOff]
      );
      for (let sIdx = 0; sIdx < p.N_side; sIdx++) {
        const rxOut = (xBedInR + sIdx * B3) + B1;
        const syBot = yBedTop - sIdx * H1;
        geoPts.push([rxOut + gOff, syBot + gOff]);
        geoPts.push([rxOut + gOff, syBot - H1]);
      }
      cadPoly(ctx, geoPts, pal.geoLine, 1.65, false, null, [7, 4], 'GEOTEXTILE_FRONT');

      // 4) All Dimensions on Front View (100% Matching DXF *D14..*D24 & E3A3):
      // (a) Top-Left: B1 (單一箱籠長度, *D24)
      cadDim(ctx, xTopOutL, yFrontTop, xTopInL, yFrontTop, -18, `B1 (${p.B1_cm})`, pal, 11);

      // (b) Top-Center: W + B3*2 (*D15) & W (*D14) & B3 (*D21)
      const labelWTop = p.N_side === 2 ? `W+B3*2 (${p.W_top_cm})` : `W+${2*(p.N_side-1)}*B3 (${p.W_top_cm})`;
      cadDim(ctx, xTopInL, yFrontTop, xTopInR, yFrontTop, -32, labelWTop, pal, 11);
      if (p.B3_cm > 0) {
        cadDim(ctx, xTopInR - B3, yFrontTop, xTopInR, yFrontTop, -16, `B3 (${p.B3_cm})`, pal, 10.5);
      }
      cadDim(ctx, xBedInL, yFrontTop + H1, xBedInR, yFrontTop + H1, -16, `W (${p.W_cm})`, pal, 11);

      // (c) Right Vertical Height Chain: H1 | H1 | H1 (*D16, *D17, *D18) & H (*D22)
      const xDimH1 = xTopOutR + 28;
      const xDimH = xDimH1 + 26;
      for (let k = 0; k <= p.N_side; k++) {
        const yk = yFrontTop + k * H1;
        cadLine(ctx, xTopOutR - (k > 1 ? B3 : 0) + 4, yk, xDimH1 + 5, yk, pal.dimLine, 0.9);
        if (k < p.N_side) {
          cadDim(ctx, xDimH1, yk, xDimH1, yk + H1, 0, `H1 (${p.H1_cm})`, pal, 10.5);
        }
      }
      cadLine(ctx, cx + B1 + 4, yBedBot, xDimH1 + 5, yBedBot, pal.dimLine, 0.9);
      cadDim(ctx, xDimH1, yBedTop, xDimH1, yBedBot, 0, `H1 (${p.H1_cm})`, pal, 10.5);
      cadDim(ctx, xDimH, yFrontTop, xDimH, yBedTop, 0, `H (${p.H_cm})`, pal, 11);

      // (d) Right Bank Excavation Slope Label "1:1.5" (E3A3) - Note: Natural hillside lines are stripped!
      cadText(ctx, '1:1.5', xTopOutR + 18, yFrontTop - 14, 10.5, pal.titleCyan, 'left', '600', -33);

      // 5) Callout Leaders on Front View (100% Matching DXF F3BE, E28E, E235):
      // (1) 箱型石籠 (F3BE, F3BF)
      cadLeaderDot(
        ctx,
        xTopInR + B1 * 0.25, yFrontTop + H1 * 0.2,
        xTopInR + B1 * 0.25, yFrontTop - 42,
        xTopInR + B1 * 0.25 + 18, yFrontTop - 42,
        ['箱型石籠'], pal, true, 11.5
      );

      // (2) 不織布 (E28E, E28F)
      const geoBotCallX = cx - B1 * 0.25;
      cadLeaderDot(
        ctx,
        geoBotCallX, yBedBot + gOff,
        geoBotCallX, yBedBot + 26,
        geoBotCallX + 14, yBedBot + 26,
        ['不織布'], pal, true, 11.5
      );

      // (3) 木樁(杉木材 末徑10cm 長200cm) @100cm 交錯配置 (E235, E236)
      const pileCallY = yBedTop + L_pile - 18 * s;
      cadLeaderDot(
        ctx,
        xPileInR + d_pile / 2, pileCallY,
        xPileInR + 36, pileCallY,
        xPileInR + 48, pileCallY,
        [
          `木樁(杉木材 末徑${p.d_pile_cm}cm 長${p.L_pile_cm}cm)`,
          `@${p.B4_cm}cm 交錯配置`
        ],
        pal, true, 11.2
      );

      // Front View Title: 正面圖 (9AA4, 9AA9, 9AAA)
      const frontTitleY = yBedTop + L_pile + 22;
      cadText(ctx, '正面圖', cx, frontTitleY, 16.5, pal.titleCyan, 'center', '700');
      cadLine(ctx, cx - 32, frontTitleY + 10, cx + 32, frontTitleY + 10, pal.titleCyan, 1.4);
      cadLine(ctx, cx - 32, frontTitleY + 13.5, cx + 32, frontTitleY + 13.5, pal.titleCyan, 1.0);

      return {
        rightX: xDimH + 65,
        bottomY: frontTitleY + 26,
        yFrontTop,
        yBedBot
      };
    }

    // =========================================================================
    // 5. VIEW 3 & 4: 縱斷面圖 (LONGITUDINAL PROFILE VIEW) & 符號說明 (SYMBOL LEGEND)
    //    100% Faithful to DXF Model Space (X ≈ 3730..3766, Y ≈ 2003..2041):
    //    - Tilted at longitudinal channel slope S_long_pct (default 6.8% ≈ 3.87° as in DXF UCS `3-3`!)
    //    - Upper courses of Gabions (HONEY mesh) staggered by half-width (50cm) over lower course (Cobble detail)!
    //    - Sloped Cedar Timber Piles (L = 200cm) dashed through gabions and solid below bed
    //    - Left dimensions: H (*D23), H1 | H1 | H1 (*D10, *D11, *D12), L (*D13)
    //    - Top dimension: B2 (*D9)
    //    - Callouts: 箱型石籠 (E88A), 木樁(杉木材 末徑10cm 長200cm) @100cm 交錯配置 (E887), 水流方向 ← (E1EF, E1F0)
    // =========================================================================
    function drawLongitudinalProfileAndLegend(ctx, ox, topY, p, pal) {
      const s = 0.88;
      const B2 = p.B2_cm * s;         // 100 * s
      const H1 = p.H1_cm * s;         // 50 * s
      const H = p.H_cm * s;           // 100 * s
      const B4 = p.B4_cm * s;         // 100 * s
      const L_pile = p.L_pile_cm * s; // 200 * s
      const d_pile = p.d_pile_cm * s; // 10 * s

      const totalProfW = p.N_rows * B2; // 300 * s
      const slopeRad = -Math.atan(p.S_long_pct / 100); // Sloping down to the left (matching Water Flow ← in DXF E1EF!)
      const cosS = Math.cos(slopeRad), sinS = Math.sin(slopeRad);
      const slopeDeg = (slopeRad * 180) / Math.PI;

      // Origin (u=0, v=0) = Top-Left corner of the Longitudinal Profile
      const x0 = ox + 95;
      const y0 = topY + 125;

      const pt = (u, v) => [
        x0 + u * cosS - v * sinS,
        y0 + u * sinS + v * cosS
      ];

      // 1) Draw Staggered Cedar Timber Piles in Longitudinal Profile (matching DXF DF75..DF96 & EC8C..EC9B)
      const nPilesProf = Math.max(2, Math.floor((p.N_rows * p.B2_cm) / p.B4_cm));
      let firstPileTop = pt(42 * s, H);
      let firstPileBot = pt(42 * s, H + L_pile);

      for (let i = 0; i < nPilesProf; i++) {
        // Front row pile (starting from bed invert v = H, extending down to H + L_pile, dashed up to v = 0)
        const uFront = (42 + i * p.B4_cm) * s;
        if (uFront < totalProfW - 10) {
          const [tx1, ty1] = pt(uFront, 0);
          drawTimberPileElev(ctx, tx1, ty1, d_pile, H + L_pile, slopeRad, H + H1, pal);
          if (i === 0) {
            firstPileTop = pt(uFront, H);
            firstPileBot = pt(uFront, H + L_pile);
          }
        }
        // Staggered back row pile (shifted by 0.5 * B4, starting from v = H - H1)
        const uBack = uFront + 0.5 * B4;
        if (uBack < totalProfW - 10) {
          const [tx2, ty2] = pt(uBack, 0);
          drawTimberPileElev(ctx, tx2, ty2, d_pile, H + L_pile - H1 * 0.5, slopeRad, H + H1, pal);
        }
      }

      // 2) Draw Stacked Gabion Courses in Longitudinal Profile (matching DXF E04F..E07D & DFF8..E04E):
      //    - Upper N_side courses: HONEY hexagonal wire mesh, with joints staggered by 0.5 * B2 between courses!
      //    - Bottom bed course (from v = H to v = H + H1): Detailed Cobble Stone fill!
      for (let cIdx = 0; cIdx < p.N_side; cIdx++) {
        const vTop = cIdx * H1;
        const isStaggered = (cIdx % 2 === 0);
        if (isStaggered) {
          // Left half-box (0.15 * B2) + middle full boxes (B2) + right partial box
          const wFirst = B2 * 0.18;
          const [bx0, by0] = pt(0, vTop);
          drawGabionBox(ctx, bx0, by0, wFirst, H1, slopeRad, 'HONEY', 300 + cIdx * 10, pal, 'PROF_GAB_HONEY');
          let curU = wFirst;
          let boxIdx = 1;
          while (curU < totalProfW - 2) {
            const segW = Math.min(B2, totalProfW - curU);
            const [bx, by] = pt(curU, vTop);
            drawGabionBox(ctx, bx, by, segW, H1, slopeRad, 'HONEY', 300 + cIdx * 10 + boxIdx, pal, 'PROF_GAB_HONEY');
            curU += segW;
            boxIdx++;
          }
        } else {
          // Shifted by 0.65 * B2 so vertical joints are strictly staggered (注意事項6: 上、下兩籠身之接縫應錯開擺置)
          const wFirst = B2 * 0.68;
          const [bx0, by0] = pt(0, vTop);
          drawGabionBox(ctx, bx0, by0, wFirst, H1, slopeRad, 'HONEY', 400 + cIdx * 10, pal, 'PROF_GAB_HONEY');
          let curU = wFirst;
          let boxIdx = 1;
          while (curU < totalProfW - 2) {
            const segW = Math.min(B2, totalProfW - curU);
            const [bx, by] = pt(curU, vTop);
            drawGabionBox(ctx, bx, by, segW, H1, slopeRad, 'HONEY', 400 + cIdx * 10 + boxIdx, pal, 'PROF_GAB_HONEY');
            curU += segW;
            boxIdx++;
          }
        }
      }

      // Bottom Bed Gabion Course (v = H to v = H + H1) filled with Cobble Stones (matching DXF DFF8..E04E)
      let curBedU = 0;
      let bedIdx = 0;
      while (curBedU < totalProfW - 2) {
        const segW = Math.min(B2, totalProfW - curBedU);
        const [bx, by] = pt(curBedU, H);
        drawGabionBox(ctx, bx, by, segW, H1, slopeRad, 'COBBLE', 500 + bedIdx, pal, 'PROF_GAB_COBBLE');
        curBedU += segW;
        bedIdx++;
      }

      // Diagonal Subgrade Soil Hatch along the bottom of the Longitudinal Profile (matching DXF DF15..DF5E & E16F..E1CC)
      const [subL_x, subL_y] = pt(0, H + H1);
      const [subR_x, subR_y] = pt(totalProfW, H + H1);
      cadLine(ctx, subL_x, subL_y, subR_x, subR_y, pal.primaryLine, 1.45, [], 'PROF_SUBGRADE');
      for (let u = 8; u < totalProfW - 8; u += 16) {
        const [hx0, hy0] = pt(u, H + H1);
        const [hx1, hy1] = pt(u - 6, H + H1 + 8);
        const [hx2, hy2] = pt(u + 4, H + H1 + 8);
        cadLine(ctx, hx0, hy0, hx1, hy1, pal.secondaryLine, 0.85, [], 'SUBGRADE_HATCH');
        cadLine(ctx, hx1 + 3, hy1 - 3, hx2, hy2, pal.secondaryLine, 0.85, [], 'SUBGRADE_HATCH');
      }

      // Left & Right Z-Break Lines on Longitudinal Profile (matching DXF E085 & E9FC)
      const [brkL1_x, brkL1_y] = pt(0, -8);
      const [brkL2_x, brkL2_y] = pt(0, H + H1 + 14);
      const [brkR1_x, brkR1_y] = pt(totalProfW, -8);
      const [brkR2_x, brkR2_y] = pt(totalProfW, H + H1 + 14);
      drawBreakLine(ctx, brkL1_x, brkL1_y, brkL2_x, brkL2_y, pal);
      drawBreakLine(ctx, brkR1_x, brkR1_y, brkR2_x, brkR2_y, pal);

      // 3) All Dimensions & Callouts on Longitudinal Profile (100% Matching DXF *D9..*D13, *D23, E88A, E887, E1EF):
      // (a) Top B2 dimension (*D9)
      const [pTopB2_A_x, pTopB2_A_y] = pt(B2 * 0.68, 0);
      const [pTopB2_B_x, pTopB2_B_y] = pt(B2 * 1.68, 0);
      cadDim(ctx, pTopB2_A_x, pTopB2_A_y, pTopB2_B_x, pTopB2_B_y, -20, `B2 (${p.B2_cm})`, pal, 11);

      // (b) Left H1 | H1 | H1 chain (*D10, *D11, *D12) & outer H (*D23)
      for (let k = 0; k <= p.N_side; k++) {
        const [pA_x, pA_y] = pt(0, k * H1);
        const [pB_x, pB_y] = pt(0, (k + 1) * H1);
        cadDim(ctx, pA_x, pA_y, pB_x, pB_y, -20, `H1 (${p.H1_cm})`, pal, 10.5);
      }
      const [pH0_x, pH0_y] = pt(0, 0);
      const [pH1_x, pH1_y] = pt(0, H);
      cadDim(ctx, pH0_x, pH0_y, pH1_x, pH1_y, -44, `H (${p.H_cm})`, pal, 11);

      // (c) Left Timber Pile Length L (*D13)
      cadDim(ctx, firstPileTop[0], firstPileTop[1], firstPileBot[0], firstPileBot[1], -22, `L (${p.L_pile_cm})`, pal, 11);

      // (d) Callout: 箱型石籠 (E889, E88A)
      const [gabCallX, gabCallY] = pt(B2 * 0.45, H1 * 0.35);
      cadLeaderDot(
        ctx,
        gabCallX, gabCallY,
        gabCallX, gabCallY - 38,
        gabCallX + 16, gabCallY - 38,
        ['箱型石籠'], pal, true, 11.5
      );

      // (e) Callout: 木樁(杉木材 末徑10cm 長200cm) @100cm 交錯配置 (E886, E887)
      cadLeaderDot(
        ctx,
        firstPileBot[0] + d_pile * 0.4, firstPileBot[1] - 14,
        firstPileBot[0] + 24, firstPileBot[1] - 14,
        firstPileBot[0] + 36, firstPileBot[1] - 14,
        [
          '木樁',
          `(杉木材 末徑${p.d_pile_cm}cm 長${p.L_pile_cm}cm)`,
          `@${p.B4_cm}cm 交錯配置`
        ],
        pal, true, 11
      );

      // (f) Water Flow Direction Arrow (<--- 水流方向, matching DXF E1EF, E1F0)
      const [flwA_x, flwA_y] = pt(totalProfW * 0.85, H + H1 + 22);
      const [flwB_x, flwB_y] = pt(totalProfW * 0.58, H + H1 + 22);
      cadLine(ctx, flwA_x, flwA_y, flwB_x, flwB_y, pal.dimLine, 1.5, [], 'FLOW_PROF');
      cadPoly(ctx, [
        [flwB_x, flwB_y],
        [flwB_x + 7, flwB_y - 2.5],
        [flwB_x + 7, flwB_y + 2.5]
      ], pal.dimLine, 1.2, true, pal.dimLine);
      cadText(ctx, '水流方向', (flwA_x + flwB_x) / 2, (flwA_y + flwB_y) / 2 + 12, 11, pal.titleCyan, 'center', '700', slopeDeg);

      // Longitudinal Profile Title: 縱斷面圖 (E53C, E541, E542)
      const profTitleX = x0 + totalProfW * 0.48;
      const profTitleY = firstPileBot[1] + 42;
      cadText(ctx, '縱斷面圖', profTitleX, profTitleY, 16.5, pal.titleCyan, 'center', '700');
      cadLine(ctx, profTitleX - 42, profTitleY + 10, profTitleX + 42, profTitleY + 10, pal.titleCyan, 1.4);
      cadLine(ctx, profTitleX - 42, profTitleY + 13.5, profTitleX + 42, profTitleY + 13.5, pal.titleCyan, 1.0);

      // 4) Symbol Legend Box below Longitudinal Profile (符號說明：W, B1, B2, B3, B4, H, H1, matching DXF F0ED)
      const legX = x0 - 15;
      const legY = profTitleY + 34;
      const legW = Math.max(265, totalProfW + 25);
      const legH = 166;
      cadPoly(ctx, [
        [legX, legY],
        [legX + legW, legY],
        [legX + legW, legY + legH],
        [legX, legY + legH]
      ], pal.tableBorder, 1.15, true, 'rgba(15, 23, 42, 0.86)', [], 'SYMBOL_LEGEND');

      cadText(ctx, '符號說明：', legX + 12, legY + 18, 12, pal.titleCyan, 'left', '700');
      const symLines = [
        `W   溝寬 (${p.W_cm}cm)`,
        `B1  單一箱籠長度 (${p.B1_cm}cm)`,
        `B2  單一箱籠寬度 (${p.B2_cm}cm)`,
        `B3  箱籠退縮距離 (一般為0~50cm, 當前${p.B3_cm}cm)`,
        `B4  木樁間距 (${p.B4_cm}cm)`,
        `H   溝深 (${p.H_cm}cm)`,
        `H1  單一箱籠高度 (${p.H1_cm}cm)`
      ];
      symLines.forEach((st, idx) => {
        cadText(ctx, st, legX + 16, legY + 38 + idx * 18.5, 10.6, pal.textMain, 'left', '600');
      });

      return {
        rightX: legX + legW + 30,
        bottomY: legY + legH + 18
      };
    }

    // =========================================================================
    // 6. VIEW 5: EXPLICIT FIGURE-NUMBER QUANTITY TABLE ON CANVAS
    // =========================================================================
    function drawExplicitFormulaTableOnCanvas(ctx, ox, oy, p, pal) {
      cadText(
        ctx,
        `【箱籠溝 (圖號 0503-1 / 057) 每公尺數量計算式表 — 採用圖面標註數字顯式列式 (溝寬W=${p.W_cm}cm・溝深H=${p.H_cm}cm・全段=${p.L_tot_m.toFixed(1)}m)】`,
        ox, oy - 15, 13.5, pal.dimText, 'left', '700'
      );

      const colW = [245, 485, 82, 92, 52];
      const rowH = 26;
      const rows = [
        ['工程項目名稱 (依DXF圖面標註)', '採用圖面標註數字之顯式計算式 (每公尺基準)', '每m數量', `全段(${p.L_tot_m}m)`, '單位'],
        [`箱型石籠及溝底卵塊石 (粒徑22~35cm佔80%)`, p.formula_gabion_vol, p.q_gabion_vol.toFixed(2), (p.q_gabion_vol * p.L_tot_m).toFixed(2), 'M³'],
        [`鍍鋅低碳鋼線石籠網 (B1=${p.B1_cm}×B2=${p.B2_cm}×H1=${p.H1_cm}cm)`, p.formula_mesh_sets, p.q_mesh_sets.toFixed(2), (p.q_mesh_sets * p.L_tot_m).toFixed(1), '組'],
        [`防蝕透水不織布 (底床與兩側階梯包覆)`, p.formula_geo_area, p.q_geo_area.toFixed(2), (p.q_geo_area * p.L_tot_m).toFixed(1), 'M²'],
        [`杉木樁支數 (末徑${p.d_pile_cm}cm, @B4=${p.B4_cm}cm 交錯配置)`, p.formula_pile_cnt, p.q_pile_cnt.toFixed(2), (p.q_pile_cnt * p.L_tot_m).toFixed(0), '支'],
        [`杉木樁總長度 (單支長 L=${p.L_pile_cm}cm)`, p.formula_pile_len, p.q_pile_len.toFixed(2), (p.q_pile_len * p.L_tot_m).toFixed(1), 'M']
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
          const color = isHeader ? pal.textMain : (cIdx === 2 ? pal.dimText : (cIdx === 3 ? pal.pileOutline : pal.textSub));
          cadText(ctx, cellStr, tx, ry, isHeader ? 11.2 : 10.6, color, align, (isHeader || cIdx === 2 || cIdx === 3) ? '700' : '500');
          cx += cw;
        });
      });

      return { bottomY: oy + totH };
    }

    // =========================================================================
    // 7. MAIN RENDER ENGINE & LIVE UI UPDATER
    // =========================================================================
    function updateSidebarSummary(p) {
      document.getElementById('stat_ditch_tag').textContent = `W=${p.W_cm}・H=${p.H_cm}cm`;
      document.getElementById('stat_gabion_m').textContent = `${p.q_gabion_vol.toFixed(2)} M³/m`;
      document.getElementById('stat_mesh_m').textContent = `${p.q_mesh_sets.toFixed(2)} 組/m`;
      document.getElementById('stat_geo_m').textContent = `${p.q_geo_area.toFixed(2)} M²/m`;
      document.getElementById('stat_pile_m').textContent = `${p.q_pile_cnt.toFixed(2)} 支/m`;
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

      if (currentView === 'FRONT_PLAN') {
        const bFP = drawPlanAndFrontViews(ctx, 40, 12, p, pal);
        drawExplicitFormulaTableOnCanvas(ctx, 40, bFP.bottomY + 42, p, pal);
      } else if (currentView === 'PROFILE_DETAIL') {
        const bProf = drawLongitudinalProfileAndLegend(ctx, 80, 12, p, pal);
        drawExplicitFormulaTableOnCanvas(ctx, 50, bProf.bottomY + 42, p, pal);
      } else {
        // 'ALL' Full Standard Sheet Layout (Matching A3 Layout 5-03 of DXF):
        // - Left Column: 平面圖 (Top) + 正面圖 (Bottom, 1:1 Vertically Aligned, Natural terrain stripped!)
        // - Right Column: 縱斷面圖 (Top) + 符號說明 (Bottom: W, B1, B2, B3, B4, H, H1)
        // - Bottom Full-Width: 圖面標註數字顯式計算式表
        const bFP = drawPlanAndFrontViews(ctx, 25, 10, p, pal);
        const rightColX = bFP.rightX + 35;
        const bProf = drawLongitudinalProfileAndLegend(ctx, rightColX, 10, p, pal);

        const tableY = Math.max(bFP.bottomY, bProf.bottomY) + 42;
        drawExplicitFormulaTableOnCanvas(ctx, 35, tableY, p, pal);
      }

      ctx.restore();
    }

    // =========================================================================
    // 8. UI CONTROLS, AUTO-SYNC & DXF / CSV EXPORTERS
    // =========================================================================
    function onGeomChange() {
      renderAll();
    }

    function resetToOrig() {
      Object.keys(ORIG_GABION_DITCH).forEach(k => {
        const el = document.getElementById('inp_' + k);
        if (el) el.value = ORIG_GABION_DITCH[k];
      });
      renderAll();
    }

    function switchView(view) {
      currentView = view;
      const specEl = document.getElementById('specPanel');
      const tabs = {
        ALL: document.getElementById('tab-all'),
        FRONT_PLAN: document.getElementById('tab-front-plan'),
        PROFILE_DETAIL: document.getElementById('tab-prof'),
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
      if (currentView === 'FRONT_PLAN') {
        viewCam.scale = Math.min(rect.width / 1080, rect.height / 1020) * 0.93;
        viewCam.offsetX = Math.max(25, (rect.width - 1000 * viewCam.scale) / 2);
        viewCam.offsetY = 14;
      } else if (currentView === 'PROFILE_DETAIL') {
        viewCam.scale = Math.min(rect.width / 1060, rect.height / 920) * 0.93;
        viewCam.offsetX = Math.max(25, (rect.width - 980 * viewCam.scale) / 2);
        viewCam.offsetY = 14;
      } else {
        viewCam.scale = Math.min(rect.width / 1280, rect.height / 1060) * 0.94;
        viewCam.offsetX = Math.max(20, (rect.width - 1220 * viewCam.scale) / 2);
        viewCam.offsetY = 12;
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
      a.download = `箱籠溝標準圖_0503-1_W${p.W_cm}_H${p.H_cm}cm_無地形線.dxf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }

    function exportCSV() {
      const p = getParams();
      const rows = [
        [`箱籠溝標準圖 (圖號 0503-1 / 057・溝寬W=${p.W_cm}cm・溝深H=${p.H_cm}cm・箱籠B1=${p.B1_cm}×B2=${p.B2_cm}×H1=${p.H1_cm}cm) - 圖面標註數字顯式列式數量計算書`],
        ['工程項目名稱', '採用圖面標註數字之顯式計算式 (每公尺基準)', '每公尺數量', `全段數量(${p.L_tot_m}m)`, '單位'],
        [`箱型石籠及溝底卵塊石 (粒徑22~35cm佔80%)`, `'${p.formula_gabion_vol}`, p.q_gabion_vol.toFixed(2), (p.q_gabion_vol * p.L_tot_m).toFixed(2), 'M³'],
        [`鍍鋅低碳鋼線石籠網 (B1=${p.B1_cm}×B2=${p.B2_cm}×H1=${p.H1_cm}cm)`, `'${p.formula_mesh_sets}`, p.q_mesh_sets.toFixed(2), (p.q_mesh_sets * p.L_tot_m).toFixed(1), '組'],
        [`防蝕透水不織布 (底床與兩側階梯包覆)`, `'${p.formula_geo_area}`, p.q_geo_area.toFixed(2), (p.q_geo_area * p.L_tot_m).toFixed(1), 'M²'],
        [`杉木樁支數 (末徑${p.d_pile_cm}cm, @B4=${p.B4_cm}cm 交錯配置)`, `'${p.formula_pile_cnt}`, p.q_pile_cnt.toFixed(2), (p.q_pile_cnt * p.L_tot_m).toFixed(0), '支'],
        [`杉木樁總長度 (單支長 L=${p.L_pile_cm}cm)`, `'${p.formula_pile_len}`, p.q_pile_len.toFixed(2), (p.q_pile_len * p.L_tot_m).toFixed(1), 'M']
      ];

      const csvContent = '\uFEFF' + rows.map(r => r.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `箱籠溝顯式列式計算書_0503-1_W${p.W_cm}xH${p.H_cm}.csv`;
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

  const STRIP = s => String(s).replace(/\s*[（(]\s*圖號[^）)]*[）)]/g, '').replace(/\s*[（(]\s*\d{4}-\d\s*[/／]\s*\d{3}\s*[）)]/g, '').replace(/\s*圖號\s*[：:]?\s*[0-9A-Za-z#\-／/ ]+/g, ' ');
  function params(R) { Object.keys(R || {}).forEach(k => { el('inp_' + k).value = String(R[k]); }); return getParams(); }
  function run(R, OV) {
    O = []; const PAL = getPalette(), p = params(R); Object.assign(p, R || {}, OV || {});
    const bFP = drawPlanAndFrontViews(CTX, 25, 10, p, PAL), bProf = drawLongitudinalProfileAndLegend(CTX, bFP.rightX + 35, 10, p, PAL); drawExplicitFormulaTableOnCanvas(CTX, 35, Math.max(bFP.bottomY, bProf.bottomY) + 42, p, PAL);
    
    const sc = 1 / 0.88; return O.map(o => { const r = Object.assign({}, o); if (r.p) r.p = r.p.map(([x, y]) => [x * sc, y * sc]); if (r.x !== undefined) { r.x *= sc; r.y *= sc; } if (r.r) r.r *= sc; if (r.h) r.h *= sc; if (r.s !== undefined && r.k === 'T') r.s = STRIP(r.s); return r; });
  }
  return { run, params };
})();
TCO_D['bag'] = (function () {
  let O = [];
  const EL = {}, CTX = new Proxy({}, { get: (t, k) => (k in t ? t[k] : () => ({ width: 0 })), set: (t, k, v) => { t[k] = v; return true; } });
  const el = id => EL[id] || (EL[id] = { value: '', textContent: '', innerHTML: '', className: '', style: {}, classList: { add() {}, remove() {}, toggle() {} }, addEventListener() {}, getContext: () => CTX, parentElement: { getBoundingClientRect: () => ({ width: 100, height: 100 }) } });
  const document = { getElementById: el, querySelectorAll: () => [], querySelector: () => null, createElement: () => ({ click() {}, style: {} }), body: { appendChild() {}, removeChild() {}, classList: { add() {}, remove() {}, toggle() {}, contains: () => false } }, documentElement: { classList: { contains: () => false, add() {}, remove() {}, toggle() {} } }, addEventListener() {} };
  const window = { addEventListener() {}, devicePixelRatio: 1, matchMedia: () => ({ matches: false, addEventListener() {} }) };

    // =========================================================================
    // 1. ORIGINAL DXF BASELINE CONSTANTS & GLOBAL STATE (PURE ASCII IDENTIFIERS)
    // =========================================================================
    const ORIG_SOIL_BAG_DITCH = {
      W_cm: 80,
      N_bed_cols: 2,
      H_cm: 30,
      N_side: 3,
      H1_cm: 20,
      N_bed: 2,
      m_slope: 0.3,
      B1_cm: 42,
      B2_cm: 32,
      t_bag_cm: 10,
      lap_cm: 5,
      L_empty_cm: 60,
      W_empty_cm: 40,
      S_stake_m: 2.0,
      N_stake_row: 6,
      N_rows: 6,
      L_tot_m: 30.0
    };

    let currentView = 'ALL'; // 'ALL', 'PLAN_SEC', 'BAG_PROF', 'SPEC'
    let showGhost = false;
    let isDarkTheme = true;

    let viewCam = {
      scale: 0.68,
      offsetX: 28,
      offsetY: 16,
      isDragging: false,
      dragStartX: 0,
      dragStartY: 0
    };

    let dxfEntities = [];

    // =========================================================================
    // 2. PARAMETER READER & EXPLICIT FIGURE-NUMBER FORMULA ENGINE
    //    STRICT RULE:
    //    - Every soil bag ALWAYS keeps its fixed dimensions (B1_cm x B2_cm x t_bag_cm)!
    //    - Widening the ditch (W_cm) adds more soil bags horizontally (N_bed_cols), NEVER stretches bags!
    //    - Deepening the ditch (H_cm / H1_cm) stacks more layers of soil bags (N_side / N_bed), NEVER stretches bag thickness!
    //    - Every layer is stacked in a staggered running-bond pattern (每層交錯疊置)!
    // =========================================================================
    function getParams() {
      const num = (id, def) => {
        const el = document.getElementById(id);
        if (!el) return def;
        const v = parseFloat(el.value);
        return isNaN(v) ? def : v;
      };

      const B1_cm = Math.max(30, num('inp_B1_cm', 42));
      const B2_cm = Math.max(20, num('inp_B2_cm', 32));
      const t_bag_cm = Math.max(8, num('inp_t_bag_cm', 10));
      const lap_cm = Math.max(5, Math.min(B1_cm * 0.4, num('inp_lap_cm', 5)));

      const N_side = Math.max(2, Math.min(8, Math.round(num('inp_N_side', 3))));
      const N_bed = Math.max(1, Math.min(5, Math.round(num('inp_N_bed', 2))));
      const m_slope = Math.max(0.15, num('inp_m_slope', 0.3));

      // Effective horizontal width gained per additional bed bag with overlap `lap_cm`
      const effBagStep_cm = Math.max(18, B1_cm - lap_cm); // 42 - 5 = 37cm
      const N_bed_cols = Math.max(1, Math.min(9, Math.round(num('inp_N_bed_cols', 2))));
      const W_cm = Math.max(35, num('inp_W_cm', 80));

      const L_empty_cm = Math.max(50, num('inp_L_empty_cm', 60));
      const W_empty_cm = Math.max(30, num('inp_W_empty_cm', 40));
      const S_stake_m = Math.max(1.0, num('inp_S_stake_m', 2.0));
      const N_stake_row = Math.max(2, Math.round(num('inp_N_stake_row', 6)));
      const N_rows = Math.max(4, Math.min(10, Math.round(num('inp_N_rows', 6))));
      const L_tot_m = Math.max(2.0, num('inp_L_tot_m', 30.0));

      // Strictly lock heights to integer multiples of single bag thickness t_bag_cm!
      const H_cm = N_side * t_bag_cm;  // e.g. 3 * 10 = 30cm
      const H1_cm = N_bed * t_bag_cm;  // e.g. 2 * 10 = 20cm
      const W_top_cm = Math.round(W_cm + 2 * H_cm * m_slope);

      const elH = document.getElementById('inp_H_cm');
      if (elH && document.activeElement !== elH) elH.value = H_cm;
      const elH1 = document.getElementById('inp_H1_cm');
      if (elH1 && document.activeElement !== elH1) elH1.value = H1_cm;

      const p = {
        W_cm,
        N_bed_cols,
        effBagStep_cm,
        N_side,
        N_bed,
        m_slope,
        H_cm,
        H1_cm,
        W_top_cm,
        B1_cm,
        B2_cm,
        t_bag_cm,
        lap_cm,
        L_empty_cm,
        W_empty_cm,
        S_stake_m,
        N_stake_row,
        N_rows,
        L_tot_m
      };

      const W_m = +(W_cm / 100).toFixed(2);
      const H_m = +(H_cm / 100).toFixed(2);
      const H1_m = +(H1_cm / 100).toFixed(2);
      const B1_m = +(B1_cm / 100).toFixed(2);
      const B2_m = +(B2_cm / 100).toFixed(2);
      const tbag_m = +(t_bag_cm / 100).toFixed(2);

      // 1. 笮式客土植生袋混草種 (隨溝底橫向袋數 N_bed_cols、溝底層數 N_bed、側壁層數 N_side 動態增減!):
      // Left & Right side walls: 2 sides * (N_bed base bags under side wall + N_side sloped bank bags)
      // Ditch bed center: N_bed layers * N_bed_cols bags across width W
      // Total bags per cross-section row = 2*(N_bed + N_side) + N_bed * N_bed_cols
      // (At original default N_bed=2, N_side=3, N_bed_cols=2 -> 2*(2+3) + 2*2 = 14 bags/row; 14 * 3.50 rows/m = 49.0 bags/m!)
      const bagsPerSection = 2 * (N_bed + N_side) + N_bed * N_bed_cols;
      const effPitch_cm = +(B2_cm * (100 / (3.5 * 32))).toFixed(2); // 28.57cm effective longitudinal pitch with overlap
      const rowsPerM = +(100 / effPitch_cm).toFixed(2);
      p.q_bags_cnt = +(bagsPerSection * rowsPerM).toFixed(1);
      p.formula_bags_cnt = `[兩側2*(底${N_bed}+壁${N_side})袋 + 溝底(${N_bed}層*橫向${N_bed_cols}袋) = ${bagsPerSection}袋/排] * (100cm / 進深${effPitch_cm}cm = ${rowsPerM}排/m)`;

      // 2. 植生袋內填充物 (基礎層1~4cm級配礫石 + 上層3:7砂石壤土混草種≧250g/m³):
      const singleBagVol = +(B1_m * B2_m * tbag_m).toFixed(4); // 0.42 * 0.32 * 0.10 = 0.01344 m3/袋
      p.q_bag_fill_vol = +(p.q_bags_cnt * singleBagVol).toFixed(2);
      p.formula_bag_fill_vol = `${p.q_bags_cnt.toFixed(1)}袋/m * [單袋固定尺寸 B1(${B1_m.toFixed(2)})*B2(${B2_m.toFixed(2)})*厚(${tbag_m.toFixed(2)}) = ${singleBagVol.toFixed(4)}M³/袋]`;

      // 3. 固定排樁 / 鋼筋 (每隔 1~3m 加設排樁固定，隨溝底放寬自動增加固定支數):
      p.q_stake_cnt = +(N_stake_row / S_stake_m).toFixed(2);
      p.formula_stake_cnt = `每排 ${N_stake_row}支 / 間距 ${S_stake_m.toFixed(1)}m = ${p.q_stake_cnt.toFixed(2)} 支/m`;

      // 4. 整坡開挖與兩側回填土夯實 (M³/m):
      const totDepth_m = +(H_m + H1_m).toFixed(2);
      p.q_backfill_vol = +(2 * 0.5 * (0.24 + 0.44) * totDepth_m * 1.0).toFixed(2);
      p.formula_backfill_vol = `左右2側 * [0.5 * (底寬0.24m + 頂寬0.44m) * 總深(H+H1=${totDepth_m.toFixed(2)}m)] * 1.00m`;

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
          bagOutline: '#f8fafc',
          bagPlanStroke: '#facc15',
          bagHoundHatch: '#4ade80',
          bagFill: 'rgba(74, 222, 128, 0.13)',
          peMeshStroke: '#fde047',
          peMeshHatch: '#22c55e',
          soilDots: '#94a3b8',
          stakeColor: '#f43f5e',
          excavDash: '#e2e8f0',
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
          bagOutline: '#0f172a',
          bagPlanStroke: '#b45309',
          bagHoundHatch: '#15803d',
          bagFill: 'rgba(34, 197, 94, 0.16)',
          peMeshStroke: '#ca8a04',
          peMeshHatch: '#16a34a',
          soilDots: '#64748b',
          stakeColor: '#e11d48',
          excavDash: '#334155',
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

    function cadDim(ctx, x1, y1, x2, y2, offset, labelStr, pal, fontSize = 11.2, useDotArrow = false) {
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

      if (useDotArrow) {
        cadCircle(ctx, dx1, dy1, 2.2, pal.dimLine, 1.0, pal.dimLine, [], 'DIM_DOT');
        cadCircle(ctx, dx2, dy2, 2.2, pal.dimLine, 1.0, pal.dimLine, [], 'DIM_DOT');
      } else {
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
      }

      let angle = (Math.atan2(dy, dx) * 180) / Math.PI;
      if (angle > 90) angle -= 180;
      if (angle < -90) angle += 180;
      cadText(ctx, labelStr, mx, my - 2, fontSize, pal.dimText, 'center', '600', angle, 'DIM_TEXT');
    }

    // Helper: Draw a Cross-Section Filled Soil Bag (裝填後土包袋, Pillow shape with tied knot ear & HOUND hatch, matching DXF 1205D..12062 & 1039D..10684)
    function drawFilledSoilBagCrossSection(ctx, xCenter, yCenter, wBag, hBag, knotOnRight, pal, layer = 'SOIL_BAG') {
      const hw = wBag / 2;
      const hh = hBag / 2;
      const dir = knotOnRight ? 1 : -1;

      // Pillow-shaped polygon with tapered knot end on `dir` side
      const bagPts = [
        [xCenter - dir * hw * 0.96, yCenter - hh * 0.35],
        [xCenter - dir * hw * 0.80, yCenter - hh * 0.88],
        [xCenter - dir * hw * 0.35, yCenter - hh],
        [xCenter + dir * hw * 0.45, yCenter - hh * 0.94],
        [xCenter + dir * hw * 0.86, yCenter - hh * 0.55],
        [xCenter + dir * hw * 0.98, yCenter],
        [xCenter + dir * hw * 0.84, yCenter + hh * 0.72],
        [xCenter + dir * hw * 0.40, yCenter + hh * 0.95],
        [xCenter - dir * hw * 0.40, yCenter + hh],
        [xCenter - dir * hw * 0.85, yCenter + hh * 0.82]
      ];
      cadPoly(ctx, bagPts, pal.bagOutline, 1.45, true, pal.bagFill, [], layer);

      // Tied Knot Ear (束口耳朵) at `xCenter + dir * hw` (matching DXF arcs 1205F..12062)
      const kx = xCenter + dir * hw * 0.98;
      const ky = yCenter;
      const earW = Math.max(3.5, wBag * 0.09);
      const earH = Math.max(2.5, hBag * 0.32);
      cadPoly(ctx, [
        [kx, ky],
        [kx + dir * earW, ky - earH],
        [kx + dir * earW * 1.15, ky - earH * 0.35],
        [kx, ky],
        [kx + dir * earW * 1.15, ky + earH * 0.35],
        [kx + dir * earW, ky + earH]
      ], pal.bagOutline, 1.15, false, null, [], layer + '_KNOT');

      // Internal HOUND / Woven Cross-Hatch inside the pillow bag
      const nStripes = Math.max(3, Math.round(wBag / 9));
      const stepX = (wBag * 0.76) / nStripes;
      for (let i = 0; i <= nStripes; i++) {
        const sx = (xCenter - hw * 0.76) + i * stepX;
        cadLine(ctx, sx, yCenter - hh * 0.75, sx, yCenter + hh * 0.75, pal.bagHoundHatch, 0.85, [], layer + '_HATCH');
      }
      cadLine(ctx, xCenter - hw * 0.80, yCenter, xCenter + hw * 0.80, yCenter, pal.bagHoundHatch, 0.85, [], layer + '_HATCH');
    }

    // Helper: Draw a Plan-View Soil Bag with Rounded Corners, Stipple Dots & Staggered Hidden Dashed Under-layer (matching DXF 10385..104BA)
    function drawPlanSoilBagRect(ctx, x, y, w, h, isDashed, pal, layer = 'PLAN_BAG') {
      const r = Math.min(3.8, w * 0.12, h * 0.16);
      const pts = [
        [x + r, y],
        [x + w - r, y],
        [x + w, y + r],
        [x + w, y + h - r],
        [x + w - r, y + h],
        [x + r, y + h],
        [x, y + h - r],
        [x, y + r]
      ];
      cadPoly(
        ctx,
        pts,
        isDashed ? pal.bagPlanStroke : pal.bagOutline,
        isDashed ? 1.05 : 1.35,
        true,
        isDashed ? null : 'rgba(30, 41, 59, 0.55)',
        isDashed ? [4, 3] : [],
        layer
      );

      if (!isDashed) {
        // Internal DOTS hatch (matching DXF `DOTS` hatch 10385..10489)
        const nX = Math.max(3, Math.round(w / 9));
        const nY = Math.max(2, Math.round(h / 8));
        for (let ry = 1; ry < nY; ry++) {
          for (let cx = 1; cx < nX; cx++) {
            const dx = x + (cx / nX) * w + ((ry % 2) * 1.5 - 0.75);
            const dy = y + (ry / nY) * h;
            cadCircle(ctx, dx, dy, 0.65, pal.soilDots, 0.7, pal.soilDots, [], 'BAG_DOTS');
          }
        }
      }
    }

    // Helper: Draw a Vertical Anchor Rebar / Stake Pin (排樁/鋼筋固定, matching DXF 10F1D..10F2E)
    function drawAnchorStakePin(ctx, cx, yTop, yBot, pal) {
      const hw = 1.6;
      const tipH = 6.5;
      // Top cap hook/head sitting on top of the soil bag
      cadPoly(ctx, [
        [cx - hw * 1.35, yTop - 2.2],
        [cx + hw * 1.35, yTop - 2.2],
        [cx + hw * 1.1, yTop],
        [cx - hw * 1.1, yTop]
      ], pal.stakeColor, 1.25, true, pal.stakeColor, [], 'STAKE_HEAD');

      // Shaft passing through bags (dashed) and into subgrade (solid pointed tip)
      cadLine(ctx, cx - hw * 0.75, yTop, cx - hw * 0.75, yBot - tipH, pal.stakeColor, 1.15, [4, 3], 'STAKE_SHAFT');
      cadLine(ctx, cx + hw * 0.75, yTop, cx + hw * 0.75, yBot - tipH, pal.stakeColor, 1.15, [4, 3], 'STAKE_SHAFT');
      cadPoly(ctx, [
        [cx - hw * 0.85, yBot - tipH],
        [cx + hw * 0.85, yBot - tipH],
        [cx, yBot]
      ], pal.stakeColor, 1.25, true, pal.stakeColor, [], 'STAKE_TIP');
    }

    // Helper: Draw Z-Break Line (截斷線, matching DXF 103D8 & 104AC)
    function drawBreakLine(ctx, x1, y1, x2, y2, pal) {
      const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
      const dx = x2 - x1, dy = y2 - y1;
      const L = Math.hypot(dx, dy) || 1;
      const ux = dx / L, uy = dy / L;
      const nx = -uy, ny = ux;
      const zS = 5.5, zA = 5.8;
      cadPoly(ctx, [
        [x1, y1],
        [mx - ux * zS, my - uy * zS],
        [mx - ux * (zS * 0.35) + nx * zA, my - uy * (zS * 0.35) + ny * zA],
        [mx + ux * (zS * 0.35) - nx * zA, my + uy * (zS * 0.35) - ny * zA],
        [mx + ux * zS, my + uy * zS],
        [x2, y2]
      ], pal.dimLine, 1.15, false, null, [], 'BREAK_LINE');
    }

    // =========================================================================
    // 4. VIEW 1 & 2: 植生袋溝平面圖 (TOP PLAN VIEW) & 斷面圖 (FRONT CROSS-SECTION)
    //    Strictly 1:1 Vertically Aligned along X-axis!
    //    STRICT RULES ENFORCED:
    //    1. Every soil bag is drawn with FIXED width `B1` (42cm), FIXED length `B2` (32cm), and FIXED thickness `t_bag` (10cm) — NEVER stretched!
    //    2. Widening the ditch `W` places `p.N_bed_cols` fixed-size bags across the ditch bed with overlap `lap_cm`.
    //    3. Deepening the ditch `H` / `H1` stacks `p.N_side` / `p.N_bed` layers of fixed-thickness bags.
    //    4. Every layer is stacked in an alternating STAGGERED (交錯疊置 / 交丁砌築) bond both longitudinally and transversely!
    // =========================================================================
    function drawPlanAndCrossSectionViews(ctx, ox, topY, p, pal) {
      const s = 1.62; // Scale: 1 cm = 1.62 px for crisp detail

      const W = p.W_cm * s;             // Ditch bottom width
      const B1 = p.B1_cm * s;           // Fixed bag long axis = 42 * s (NEVER stretched!)
      const B2 = p.B2_cm * s;           // Fixed bag short axis = 32 * s (NEVER stretched!)
      const t_bag = p.t_bag_cm * s;     // Fixed bag thickness = 10 * s (NEVER stretched!)
      const lap = p.lap_cm * s;         // Overlap >= 5 * s
      const H = p.H_cm * s;             // N_side * t_bag
      const H1 = p.H1_cm * s;           // N_bed * t_bag
      const m = p.m_slope;              // 0.3
      const dx_slope = H * m;

      const cx = ox + Math.max(295, W * 0.5 + B1 + 95); // Shared 1:1 Centerline X of Plan View and Cross-Section View!

      // Key X coordinates symmetric about cx
      const xBedInL = cx - W / 2;
      const xBedInR = cx + W / 2;
      const xTopInL = xBedInL - dx_slope;
      const xTopInR = xBedInR + dx_slope;
      // Outer edge of top bank bag (strictly 1 fixed bag width B1 outside xTopInL / xTopInR)
      const xWallOutL = xTopInL - B1;
      const xWallOutR = xTopInR + B1;

      // Helper to compute exact X centers of fixed-width `B1` bags across the ditch bed for a given layer `layerIdx`
      // Even layers (layerIdx % 2 === 0): `p.N_bed_cols` bags spanning across [xBedInL - lap, xBedInR + lap]
      // Odd layers (layerIdx % 2 === 1): Staggered by half-bag (交錯疊置!) with `p.N_bed_cols + 1` bags so vertical joints NEVER align!
      const getBedLayerBagCenters = (layerIdx) => {
        const isStaggeredLayer = (layerIdx % 2 === 1);
        const centers = [];
        const nCols = p.N_bed_cols;
        if (!isStaggeredLayer) {
          // Layer 0, 2...: Left & Right outer base bags under side walls + `nCols` bed bags across W
          centers.push({ cx: xBedInL - B1 * 0.52, knotRight: false });
          if (nCols === 1) {
            centers.push({ cx: cx, knotRight: true });
          } else {
            const spanLeft = xBedInL + B1 * 0.46 - lap * 0.5;
            const spanRight = xBedInR - B1 * 0.46 + lap * 0.5;
            for (let c = 0; c < nCols; c++) {
              const frac = c / (nCols - 1);
              const bx = spanLeft + frac * (spanRight - spanLeft);
              centers.push({ cx: bx, knotRight: c >= nCols / 2 });
            }
          }
          centers.push({ cx: xBedInR + B1 * 0.52, knotRight: true });
        } else {
          // Layer 1, 3... (橫向交錯層!): Shifted by 0.5 * B1 so every vertical joint is covered by a full bag!
          centers.push({ cx: xBedInL - B1 * 0.62, knotRight: false });
          const nStagCols = nCols + 1;
          const stagLeft = xBedInL - B1 * 0.04;
          const stagRight = xBedInR + B1 * 0.04;
          for (let c = 0; c < nStagCols; c++) {
            const frac = nStagCols === 1 ? 0.5 : c / (nStagCols - 1);
            const bx = stagLeft + frac * (stagRight - stagLeft);
            centers.push({ cx: bx, knotRight: c >= nStagCols / 2 });
          }
          centers.push({ cx: xBedInR + B1 * 0.62, knotRight: true });
        }
        return centers;
      };

      // =====================================================================
      // PART A: 植生袋溝 平面圖 (TOP PLAN VIEW - Staggered Running Bond 交丁砌築)
      // =====================================================================
      const yPlanTop = topY + 56;
      const rowStepY = B2 * 0.88; // Fixed longitudinal bag width B2 with inter-row snug contact
      const planH = p.N_rows * rowStepY;
      const yPlanBot = yPlanTop + planH;

      // 1) Draw Under-Layer Bags (Dashed Yellow/Orange, 下層交錯 1/2 B2 交丁砌築!)
      const underBedCenters = getBedLayerBagCenters(1);
      for (let r = 0; r < p.N_rows; r++) {
        const ry = yPlanTop + (r + 0.5) * rowStepY; // Shifted by 0.5 * rowStepY (1/2 bag staggered!)
        if (ry + rowStepY * 0.90 <= yPlanBot + 2) {
          // Left & Right sloped bank under-layer bags (fixed width B1, dashed)
          drawPlanSoilBagRect(ctx, xWallOutL + 2, ry, B1 * 0.96, rowStepY * 0.90, true, pal, 'PLAN_BAG_UNDER_L');
          drawPlanSoilBagRect(ctx, xTopInR - 2, ry, B1 * 0.96, rowStepY * 0.90, true, pal, 'PLAN_BAG_UNDER_R');
          // Ditch bed under-layer staggered bags (dashed)
          for (let c = 1; c < underBedCenters.length - 1; c++) {
            const bcx = underBedCenters[c].cx;
            drawPlanSoilBagRect(ctx, bcx - B1 * 0.48, ry, B1 * 0.96, rowStepY * 0.90, true, pal, 'PLAN_BAG_UNDER_BED');
          }
        }
      }

      // 2) Draw Upper-Layer Solid Bags (Every bag has fixed width B1 and fixed length B2! Alternating rows stagger horizontally!)
      const evenBedCenters = getBedLayerBagCenters(0);
      for (let r = 0; r < p.N_rows; r++) {
        const ry = yPlanTop + r * rowStepY;
        const bh = rowStepY * 0.95;
        const isOddRow = (r % 2 === 1);

        // Left Bank Bag (Fixed width B1, stepping along 1:0.3 slope)
        const bankShift = isOddRow ? (t_bag * m * 0.5) : 0;
        drawPlanSoilBagRect(ctx, xWallOutL + bankShift, ry, B1 * 0.96, bh, false, pal, 'PLAN_BAG_BANK_L');

        // Ditch Bed Bags: Row r alternates between evenBedCenters and underBedCenters (每排交錯疊置，絕不通縫!)
        const rowCenters = isOddRow ? underBedCenters : evenBedCenters;
        for (let c = 1; c < rowCenters.length - 1; c++) {
          const bcx = rowCenters[c].cx;
          drawPlanSoilBagRect(ctx, bcx - B1 * 0.48, ry, B1 * 0.96, bh, false, pal, 'PLAN_BAG_BED');
        }

        // Right Bank Bag (Fixed width B1)
        drawPlanSoilBagRect(ctx, xTopInR + B1 * 0.04 - bankShift, ry, B1 * 0.96, bh, false, pal, 'PLAN_BAG_BANK_R');
      }

      // Central Overlap Dashed Lines (搭接至少 5cm)
      const xLapL = cx - lap / 2;
      const xLapR = cx + lap / 2;
      cadLine(ctx, xLapL, yPlanTop, xLapL, yPlanBot, pal.dimLine, 0.95, [5, 3], 'LAP_LINE_L');
      cadLine(ctx, xLapR, yPlanTop, xLapR, yPlanBot, pal.dimLine, 0.95, [5, 3], 'LAP_LINE_R');

      // Top & Bottom Z-Break Lines across Plan View
      drawBreakLine(ctx, xWallOutL - 10, yPlanTop, xWallOutR + 10, yPlanTop, pal);
      drawBreakLine(ctx, xWallOutL - 10, yPlanBot, xWallOutR + 10, yPlanBot, pal);

      // 3) Flow Arrows & Internal Labels on Plan View ("水流方向 ↑", "溝底")
      const flwX1 = cx - W * 0.25;
      const flwX2 = cx + W * 0.25;
      const flwY_top1 = yPlanTop + planH * 0.12;
      const flwY_bot1 = yPlanTop + planH * 0.34;
      [flwX1, flwX2].forEach((fx) => {
        cadLine(ctx, fx, flwY_bot1, fx, flwY_top1, pal.dimLine, 1.4, [], 'FLOW_ARROW');
        cadPoly(ctx, [[fx - 3, flwY_top1 + 6], [fx + 3, flwY_top1 + 6], [fx, flwY_top1]], pal.dimLine, 1.1, true, pal.dimLine);
        const fy2_top = yPlanTop + planH * 0.62;
        const fy2_bot = yPlanTop + planH * 0.84;
        cadLine(ctx, fx, fy2_bot, fx, fy2_top, pal.dimLine, 1.4, [], 'FLOW_ARROW');
        cadPoly(ctx, [[fx - 3, fy2_top + 6], [fx + 3, fy2_top + 6], [fx, fy2_top]], pal.dimLine, 1.1, true, pal.dimLine);
      });
      cadText(ctx, '水流方向', flwX1 - 8, (flwY_top1 + flwY_bot1) / 2, 10, pal.titleCyan, 'center', '700', -90);
      cadText(ctx, `溝底 (橫向${p.N_bed_cols}袋交錯)`, cx, yPlanTop + planH * 0.48, 11, pal.titleCyan, 'center', '700');

      // 4) Dimensions & Callouts on Plan View:
      // (a) Top W dimension
      cadDim(ctx, xBedInL, yPlanTop, xBedInR, yPlanTop, -34, `W (${p.W_cm}cm・橫向${p.N_bed_cols}袋)`, pal, 11.2);

      // (b) Top Center Overlap dimension: 搭接至少5cm
      cadDim(ctx, xLapL, yPlanTop, xLapR, yPlanTop, -15, `搭接至少${p.lap_cm}cm`, pal, 10.5);

      // (c) Right Vertical B2 dimension (土包袋短邊)
      const yB2_0 = yPlanTop + rowStepY * 2;
      const yB2_1 = yPlanTop + rowStepY * 3;
      cadDim(ctx, xWallOutR, yB2_0, xWallOutR, yB2_1, 18, `B2 (${p.B2_cm})`, pal, 11);

      // (d) Right Multi-branch Callout: 搭接處
      const lapCallX = xWallOutR + 26;
      const lapCallY = yPlanTop + rowStepY * 1.65;
      cadLine(ctx, cx, yPlanTop + rowStepY * 1.0, lapCallX - 10, lapCallY, pal.leaderLine, 1.05);
      cadLine(ctx, xBedInR, yPlanTop + rowStepY * 1.0, lapCallX - 10, lapCallY, pal.leaderLine, 1.05);
      cadLine(ctx, xBedInR, yPlanTop + rowStepY * 2.0, lapCallX - 10, lapCallY, pal.leaderLine, 1.05);
      cadLine(ctx, lapCallX - 10, lapCallY, lapCallX + 2, lapCallY, pal.leaderLine, 1.05);
      cadText(ctx, '搭接處', lapCallX + 6, lapCallY, 11.2, pal.titleCyan, 'left', '700');

      // (e) Left Dual-branch Callout: 上、下層交錯排列 (交丁砌築)
      const stgCallX = xWallOutL - 18;
      const stgCallY = yPlanTop + rowStepY * 3.4;
      cadLine(ctx, xWallOutL + 12, yPlanTop + rowStepY * 2.8, stgCallX, stgCallY, pal.leaderLine, 1.05);
      cadLine(ctx, xBedInL + 14, yPlanTop + rowStepY * 3.7, stgCallX, stgCallY, pal.leaderLine, 1.05);
      cadLine(ctx, stgCallX, stgCallY, stgCallX - 10, stgCallY, pal.leaderLine, 1.05);
      cadCircle(ctx, xWallOutL + 12, yPlanTop + rowStepY * 2.8, 2.0, pal.leaderLine, 1.0, pal.leaderLine);
      cadCircle(ctx, xBedInL + 14, yPlanTop + rowStepY * 3.7, 2.0, pal.leaderLine, 1.0, pal.leaderLine);
      cadText(ctx, '上、下層交錯排列', stgCallX - 14, stgCallY - 7, 11, pal.titleCyan, 'right', '600');
      cadText(ctx, '(交丁砌築)', stgCallX - 14, stgCallY + 9, 10.8, pal.titleCyan, 'right', '600');

      const planTitleY = yPlanBot + 24;
      cadText(ctx, '植生袋溝  平面圖', cx, planTitleY, 15.5, pal.titleCyan, 'center', '700');
      cadLine(ctx, cx - 68, planTitleY + 10, cx + 68, planTitleY + 10, pal.titleCyan, 1.4);
      cadLine(ctx, cx - 68, planTitleY + 13.5, cx + 68, planTitleY + 13.5, pal.titleCyan, 1.0);

      // =====================================================================
      // PART B: 斷面圖 (FRONT CROSS-SECTION VIEW - 1:1 ALIGNED BELOW PLAN VIEW!)
      //         - Every bag has FIXED width `B1` and FIXED thickness `t_bag`!
      //         - Ditch bed layers (`bIdx = 0 .. N_bed-1`) alternate in a staggered bond (每層交錯疊置)!
      //         - Side bank layers (`sIdx = 0 .. N_side-1`) step outward at 1:m slope with fixed width `B1`!
      // =====================================================================
      const ySecTop = planTitleY + 64;        // Top of upper bank bags
      const yBedTop = ySecTop + H;            // Ditch invert (top of bed bags)
      const yBedBot = yBedTop + H1;           // Bottom of bed bags (excavation base)

      // 1:1 Vertical Alignment Dashed Guides between Plan View and Cross-Section View
      [xWallOutL, xBedInL, cx, xBedInR, xWallOutR].forEach((gx) => {
        cadLine(ctx, gx, yPlanBot + 3, gx, ySecTop - 28, pal.secondaryLine, 0.8, [4, 4], 'ALIGN_GUIDE');
      });

      // 0) Ghost Baseline (Original W=80, H=30, H1=20)
      if (showGhost) {
        const gW = 80 * s, gH = 30 * s, gH1 = 20 * s, gB1 = 42 * s;
        cadPoly(ctx, [
          [cx - gW / 2 - gH * 0.3 - gB1, ySecTop],
          [cx - gW / 2 - gH * 0.3, ySecTop],
          [cx - gW / 2, ySecTop + gH],
          [cx + gW / 2, ySecTop + gH],
          [cx + gW / 2 + gH * 0.3, ySecTop],
          [cx + gW / 2 + gH * 0.3 + gB1, ySecTop],
          [cx + gW / 2 + gB1, ySecTop + gH + gH1],
          [cx - gW / 2 - gB1, ySecTop + gH + gH1]
        ], pal.ghostLine, 1.05, true, null, [4, 4], 'GHOST_SEC');
      }

      // 1) Dashed Structural Excavation & Grading Line (整坡線(開挖線)) and Compacted Backfill Wedges
      const xExcavBotL = xBedInL - B1 - p.ex_cm * s;
      const xExcavTopL = xWallOutL - p.ex_cm * s;
      const xExcavBotR = xBedInR + B1 + p.ex_cm * s;
      const xExcavTopR = xWallOutR + p.ex_cm * s;

      cadPoly(ctx, [
        [xBedInL - B1 * 0.95, yBedBot],
        [xExcavBotL, yBedBot],
        [xExcavTopL, ySecTop]
      ], pal.excavDash, 1.35, false, null, [6, 4], 'EXCAV_LINE_L');
      cadLine(ctx, xExcavTopL, ySecTop, xWallOutL, ySecTop, pal.primaryLine, 1.3, [], 'BACKFILL_TOP_L');

      cadPoly(ctx, [
        [xBedInR + B1 * 0.95, yBedBot],
        [xExcavBotR, yBedBot],
        [xExcavTopR, ySecTop]
      ], pal.excavDash, 1.35, false, null, [6, 4], 'EXCAV_LINE_R');
      cadLine(ctx, xWallOutR, ySecTop, xExcavTopR, ySecTop, pal.primaryLine, 1.3, [], 'BACKFILL_TOP_R');

      // 2) Draw Bottom Base Layers (`bIdx = 0 .. p.N_bed - 1`):
      //    Each layer uses FIXED bag width `B1` and FIXED bag thickness `t_bag`,
      //    and alternates between even/odd staggered positions (每層交錯疊置!)
      for (let bIdx = 0; bIdx < p.N_bed; bIdx++) {
        const byCenter = yBedBot - (bIdx + 0.5) * t_bag;
        const layerCenters = getBedLayerBagCenters(bIdx);
        layerCenters.forEach((bagObj, cIdx) => {
          drawFilledSoilBagCrossSection(
            ctx,
            bagObj.cx,
            byCenter,
            B1 * 0.96,
            t_bag * 0.94,
            bagObj.knotRight,
            pal,
            `SEC_BASE_L${bIdx}_C${cIdx}`
          );
        });
      }

      // 3) Draw Left & Right Sloped Bank Layers (`sIdx = 0 .. p.N_side - 1`):
      //    Every bag has FIXED width `B1` and FIXED thickness `t_bag`, stepping outward along the 1:m slope
      //    with alternating staggered overlap!
      for (let sIdx = 0; sIdx < p.N_side; sIdx++) {
        const syCenter = yBedTop - (sIdx + 0.5) * t_bag;
        // Staggered step offset along 1:m slope
        const stepShift = (sIdx + 0.5) * t_bag * m + ((sIdx % 2 === 1) ? 2.5 * s : 0);

        // Left sloped bank bag (Fixed width B1, knot on left/outer excavation side)
        const lxIn = xBedInL - stepShift;
        const lxCenter = lxIn - B1 * 0.48;
        drawFilledSoilBagCrossSection(ctx, lxCenter, syCenter, B1 * 0.96, t_bag * 0.94, false, pal, 'SEC_BANK_BAG_L');

        // Right sloped bank bag (Fixed width B1, knot on right/outer excavation side)
        const rxIn = xBedInR + stepShift;
        const rxCenter = rxIn + B1 * 0.48;
        drawFilledSoilBagCrossSection(ctx, rxCenter, syCenter, B1 * 0.96, t_bag * 0.94, true, pal, 'SEC_BANK_BAG_R');
      }

      // 4) Draw Vertical Anchor Rebars / Stakes (每隔1~3m加設排樁固定)
      const stakeLen = H1 + 26 * s;
      const topBedLayerCenters = getBedLayerBagCenters(p.N_bed - 1);
      const stakeXs = [
        xBedInL - B1 * 0.32,
        ...topBedLayerCenters.slice(1, -1).map(b => b.cx - B1 * 0.18),
        ...topBedLayerCenters.slice(1, -1).map(b => b.cx + B1 * 0.18),
        xBedInR + B1 * 0.32
      ];
      stakeXs.forEach((sx) => {
        drawAnchorStakePin(ctx, sx, yBedTop - 3, yBedTop + stakeLen, pal);
      });

      // 5) All Dimensions & Callouts on Cross-Section View:
      const xTopBagInR = xBedInR + (p.N_side - 0.5) * t_bag * m;
      const xTopBagOutR = xTopBagInR + B1 * 0.96;
      cadDim(ctx, xTopInL, ySecTop, xTopInR, ySecTop, -32, `W (${p.W_cm}cm)`, pal, 11.5);
      cadDim(ctx, xTopBagInR, ySecTop, xTopBagOutR, ySecTop, -15, `B1 (${p.B1_cm})`, pal, 11);

      const xDimH = xExcavTopL - 18;
      cadLine(ctx, xExcavTopL - 3, ySecTop, xDimH - 6, ySecTop, pal.dimLine, 0.95);
      cadLine(ctx, xBedInL - B1 * 0.85 - 3, yBedTop, xDimH - 6, yBedTop, pal.dimLine, 0.95);
      cadLine(ctx, xExcavBotL - 3, yBedBot, xDimH - 6, yBedBot, pal.dimLine, 0.95);
      cadDim(ctx, xDimH, ySecTop, xDimH, yBedTop, 0, `H=${p.H_cm} (${p.N_side}層)`, pal, 10.8);
      cadDim(ctx, xDimH, yBedTop, xDimH, yBedBot, 0, `H1=${p.H1_cm} (${p.N_bed}層)`, pal, 10.8);

      cadText(ctx, `1：${p.m_slope}`, xBedInL - dx_slope * 0.5 - 12, ySecTop + H * 0.55, 10.5, pal.titleCyan, 'center', '700', -68);

      cadLeaderDot(
        ctx,
        (xTopBagOutR + xExcavTopR) / 2, ySecTop + H * 0.35,
        xExcavTopR + 12, ySecTop - 16,
        xExcavTopR + 22, ySecTop - 16,
        ['回填土夯實'], pal, true, 11.2
      );

      const exMidX = (xExcavBotR + xExcavTopR) / 2;
      const exMidY = (yBedBot + ySecTop) / 2;
      cadLeaderDot(
        ctx,
        exMidX, exMidY,
        xExcavTopR + 14, exMidY,
        xExcavTopR + 24, exMidY,
        ['整坡線(開挖線)'], pal, true, 11.2
      );

      cadLeaderDot(
        ctx,
        xBedInR + B1 * 0.55, yBedTop + t_bag * 0.5,
        xExcavTopR + 14, yBedTop + t_bag * 0.8,
        xExcavTopR + 24, yBedTop + t_bag * 0.8,
        ['笮式客土植生袋混草種 (每層交錯疊置)'], pal, true, 11.2
      );

      const rightStakeX = stakeXs[stakeXs.length - 1];
      cadLeaderDot(
        ctx,
        rightStakeX, yBedTop + stakeLen * 0.78,
        xExcavTopR + 14, yBedTop + stakeLen + 6,
        xExcavTopR + 24, yBedTop + stakeLen + 6,
        ['每隔1~3m加設排樁固定'], pal, true, 11.2
      );

      const step4Y = yBedTop + stakeLen + 28;
      cadText(ctx, `◎步驟四：每${p.S_stake_m.toFixed(0)}m打入${p.N_stake_row}支鋼筋，設置阻流袋。`, cx, step4Y, 12, pal.textMain, 'center', '700');

      const secTitleY = step4Y + 26;
      cadText(ctx, '斷面圖 (每層交錯疊砌・固定袋寬B1)', cx, secTitleY, 16, pal.titleCyan, 'center', '700');
      cadLine(ctx, cx - 115, secTitleY + 10, cx + 115, secTitleY + 10, pal.titleCyan, 1.4);
      cadLine(ctx, cx - 115, secTitleY + 13.5, cx + 115, secTitleY + 13.5, pal.titleCyan, 1.0);

      // 6) Symbol Legend Box on Bottom-Left
      const legX = ox + 10;
      const legY = yBedTop + 18;
      cadPoly(ctx, [
        [legX, legY],
        [legX + 178, legY],
        [legX + 178, legY + 122],
        [legX, legY + 122]
      ], pal.tableBorder, 1.1, true, 'rgba(15, 23, 42, 0.86)', [], 'SYMBOL_LEGEND');
      cadText(ctx, '符號說明：', legX + 10, legY + 16, 11.5, pal.titleCyan, 'left', '700');
      const symLines = [
        `W   溝底寬 (${p.W_cm}cm, 橫向${p.N_bed_cols}袋)`,
        `B1  土包袋長邊 (固定${p.B1_cm}cm)`,
        `B2  土包袋短邊 (固定${p.B2_cm}cm)`,
        `H   溝深 (${p.H_cm}cm = ${p.N_side}層×${p.t_bag_cm}cm)`,
        `H1  堆疊高 (${p.H1_cm}cm = ${p.N_bed}層×${p.t_bag_cm}cm)`
      ];
      symLines.forEach((st, idx) => {
        cadText(ctx, st, legX + 12, legY + 36 + idx * 18.5, 10.0, pal.textMain, 'left', '600');
      });

      return {
        rightX: xExcavTopR + 215,
        bottomY: secTitleY + 24
      };
    }

    // =========================================================================
    // 5. VIEW 3, 4, 5 & 6 (RIGHT COLUMN):
    //    - 詳圖 1: PE土包袋詳圖 N.T.S.(cm) (≧60cm × ≧40cm, ANSI37 網目, 11D0B..11D30)
    //    - 詳圖 2: 裝填後示意圖 N.T.S.(cm) (33±3cm × 10±1cm, 束口, 開挖側, 長軸垂直溝壁 --->, 1205D..12144)
    //    - 詳圖 3: ◎步驟三：疊置兩側客土袋，回填土夯實（含左側 15 / 20 標註與「每 m 平均 49 袋」, 10381..103BD）
    //    - 詳圖 4 (MANDATORY SKILL RULE 1): 自動補齊之 1:1 對應【土袋溝縱斷面展開圖】
    // =========================================================================
    function drawBagDetailsAndLongitudinalProfile(ctx, ox, topY, p, pal) {
      const x0 = ox + 45;
      const y0 = topY + 38;

      // =====================================================================
      // PART 1: PE土包袋 詳圖 N.T.S.(cm) (Top-Left of Right Column, matching DXF 11D0B..11D30)
      // =====================================================================
      const wEmpty = 135;
      const hEmpty = 90;
      cadPoly(ctx, [
        [x0, y0],
        [x0 + wEmpty, y0],
        [x0 + wEmpty, y0 + hEmpty],
        [x0, y0 + hEmpty]
      ], pal.peMeshStroke, 1.55, true, 'rgba(34, 197, 94, 0.10)', [], 'PE_EMPTY_BAG');

      // ANSI37 45-degree & 135-degree Cross-Mesh Hatch inside PE Bag (matching DXF 11D0C)
      ctx.save();
      ctx.beginPath();
      ctx.rect(x0, y0, wEmpty, hEmpty);
      ctx.clip();
      const stepM = 11;
      for (let d = -hEmpty; d < wEmpty + hEmpty; d += stepM) {
        cadLine(ctx, x0 + d, y0, x0 + d + hEmpty, y0 + hEmpty, pal.peMeshHatch, 0.8, [], 'ANSI37_1');
        cadLine(ctx, x0 + d + hEmpty, y0, x0 + d, y0 + hEmpty, pal.peMeshHatch, 0.8, [], 'ANSI37_2');
      }
      ctx.restore();

      // Dimensions with Dot Arrows (_Dot): Left ≧40cm (*D26), Bottom ≧60cm (*D27)
      cadDim(ctx, x0, y0, x0, y0 + hEmpty, -22, `≧${p.W_empty_cm}cm`, pal, 11, true);
      cadDim(ctx, x0, y0 + hEmpty, x0 + wEmpty, y0 + hEmpty, 22, `≧${p.L_empty_cm}cm`, pal, 11, true);

      const bagTitleY = y0 + hEmpty + 46;
      cadText(ctx, 'PE土包袋  詳圖  N.T.S.(cm)', x0 + wEmpty / 2, bagTitleY, 14, pal.titleCyan, 'center', '700');
      cadLine(ctx, x0 + wEmpty / 2 - 92, bagTitleY + 9, x0 + wEmpty / 2 + 92, bagTitleY + 9, pal.titleCyan, 1.3);

      // =====================================================================
      // PART 2: 裝填後 示意圖 N.T.S.(cm) (Top-Right of Right Column, matching DXF 1205D..12144)
      // =====================================================================
      const xFill0 = x0 + wEmpty + 88;
      const wFill = 165;
      const hFill = 42;
      const yFillMid = y0 + hEmpty * 0.56;

      // Arrow above bag: 長軸垂直溝壁 ---> (11D1A, 11D2C, 11D2D)
      const arrY = yFillMid - hFill / 2 - 22;
      cadText(ctx, '長軸垂直溝壁', xFill0 + wFill * 0.44, arrY - 11, 11.5, pal.titleCyan, 'center', '700');
      cadLine(ctx, xFill0 + 18, arrY, xFill0 + wFill * 0.78, arrY, pal.dimLine, 1.6, [], 'AXIS_ARROW');
      cadPoly(ctx, [
        [xFill0 + wFill * 0.78, arrY - 3.5],
        [xFill0 + wFill * 0.88, arrY],
        [xFill0 + wFill * 0.78, arrY + 3.5]
      ], pal.dimLine, 1.2, true, pal.dimLine);

      // Draw Filled Pillow Bag with Tied Knot Ear on Right (1205D..12062)
      drawFilledSoilBagCrossSection(ctx, xFill0 + wFill / 2, yFillMid, wFill, hFill, true, pal, 'DETAIL_FILLED_BAG');

      // Right label: 開挖側 (11D18) & Top-Right leader: 束口 (12143, 12144)
      cadText(ctx, '開挖側', xFill0 + wFill + 22, yFillMid + 2, 11.5, pal.titleCyan, 'left', '700');
      cadLeaderDot(
        ctx,
        xFill0 + wFill + 4, yFillMid - 4,
        xFill0 + wFill + 16, yFillMid - 32,
        xFill0 + wFill + 30, yFillMid - 32,
        ['束口'], pal, true, 11.5
      );

      // Dimensions with Dot Arrows (_Dot): Left 10±1cm (*D24), Bottom 33±3cm (*D25)
      cadDim(ctx, xFill0, yFillMid - hFill / 2, xFill0, yFillMid + hFill / 2, -24, `${p.t_bag_cm}±1cm`, pal, 11, true);
      cadDim(ctx, xFill0, yFillMid + hFill / 2, xFill0 + wFill, yFillMid + hFill / 2, 26, `33±3cm (B1=${p.B1_cm})`, pal, 11, true);

      cadText(ctx, '裝填後  示意圖  N.T.S.(cm)', xFill0 + wFill / 2, bagTitleY, 14, pal.titleCyan, 'center', '700');
      cadLine(ctx, xFill0 + wFill / 2 - 92, bagTitleY + 9, xFill0 + wFill / 2 + 92, bagTitleY + 9, pal.titleCyan, 1.3);

      // =====================================================================
      // PART 3: ◎步驟三：疊置兩側客土袋，回填土夯實 (Middle of Right Column, matching DXF 10381..103BD)
      //         Uses fixed bag width B1 and staggered bed layers!
      // =====================================================================
      const yStep3Top = bagTitleY + 48;
      const s3 = 1.25;
      const w3 = p.W_cm * s3;
      const b1_3 = p.B1_cm * s3;
      const t3 = p.t_bag_cm * s3;
      const lap3 = p.lap_cm * s3;
      const h3 = p.H_cm * s3;
      const h1_3 = p.H1_cm * s3;
      const cx3 = x0 + Math.max(185, w3 * 0.5 + b1_3 + 35);

      const y3BedTop = yStep3Top + h3;
      const y3BedBot = y3BedTop + h1_3;
      const x3BedL = cx3 - w3 / 2;
      const x3BedR = cx3 + w3 / 2;

      // Base bags (`p.N_bed` layers, staggered between even & odd layers, FIXED bag width `b1_3`!)
      for (let bIdx = 0; bIdx < p.N_bed; bIdx++) {
        const byC = y3BedBot - (bIdx + 0.5) * t3;
        const isStag = (bIdx % 2 === 1);
        drawFilledSoilBagCrossSection(ctx, x3BedL - b1_3 * (isStag ? 0.60 : 0.50), byC, b1_3 * 0.95, t3 * 0.92, false, pal, 'STEP3_BASE_LO');
        const nC = isStag ? (p.N_bed_cols + 1) : p.N_bed_cols;
        const sL = isStag ? (x3BedL - b1_3 * 0.04) : (x3BedL + b1_3 * 0.45 - lap3 * 0.5);
        const sR = isStag ? (x3BedR + b1_3 * 0.04) : (x3BedR - b1_3 * 0.45 + lap3 * 0.5);
        for (let c = 0; c < nC; c++) {
          const frac = nC === 1 ? 0.5 : c / (nC - 1);
          const bx = sL + frac * (sR - sL);
          drawFilledSoilBagCrossSection(ctx, bx, byC, b1_3 * 0.95, t3 * 0.92, c >= nC / 2, pal, 'STEP3_BASE_MID');
        }
        drawFilledSoilBagCrossSection(ctx, x3BedR + b1_3 * (isStag ? 0.60 : 0.50), byC, b1_3 * 0.95, t3 * 0.92, true, pal, 'STEP3_BASE_RO');
      }

      // Bank bags (`p.N_side` layers, FIXED bag width `b1_3`!)
      for (let sIdx = 0; sIdx < p.N_side; sIdx++) {
        const syC = y3BedTop - (sIdx + 0.5) * t3;
        const shf = (sIdx + 0.5) * t3 * p.m_slope + ((sIdx % 2 === 1) ? 2.0 * s3 : 0);
        drawFilledSoilBagCrossSection(ctx, x3BedL - shf - b1_3 * 0.48, syC, b1_3 * 0.95, t3 * 0.92, false, pal, 'STEP3_BANK_L');
        drawFilledSoilBagCrossSection(ctx, x3BedR + shf + b1_3 * 0.48, syC, b1_3 * 0.95, t3 * 0.92, true, pal, 'STEP3_BANK_R');
      }

      // Left Vertical Dimensions 15 (*D17) and H1 (*D18) with Dot Arrows
      const x3LeftEdge = x3BedL - b1_3 * 1.12;
      cadDim(ctx, x3LeftEdge, y3BedTop - 15 * s3, x3LeftEdge, y3BedTop, -18, '15', pal, 10.5, true);
      cadDim(ctx, x3LeftEdge, y3BedTop, x3LeftEdge, y3BedBot, -18, `${p.H1_cm}`, pal, 10.5, true);

      // Slope label "1：0.3" & Callouts on Step 3 Diagram (103A7, 103B8, 103B9, 103BB)
      cadText(ctx, `1：${p.m_slope}`, x3BedL + 10, yStep3Top + h3 * 0.45, 10, pal.titleCyan, 'left', '700', -68);

      const x3RightEdge = x3BedR + b1_3 * 1.12;
      cadLeaderDot(
        ctx,
        x3RightEdge - 8, yStep3Top + h3 * 0.5,
        x3RightEdge + 16, yStep3Top + 4,
        x3RightEdge + 26, yStep3Top + 4,
        ['回填土夯實'], pal, true, 10.8
      );

      cadLeaderDot(
        ctx,
        x3RightEdge - 14, y3BedTop + t3 * 0.5,
        x3RightEdge + 16, y3BedTop + t3 * 0.8,
        x3RightEdge + 26, y3BedTop + t3 * 0.8,
        ['笮式客土植生袋混草種', `每 m平均${p.q_bags_cnt.toFixed(0)}袋`],
        pal, true, 10.8
      );

      const step3TitleY = y3BedBot + 22;
      cadText(ctx, '◎步驟三：疊置兩側客土袋，回填土夯實。', cx3, step3TitleY, 12.5, pal.titleCyan, 'center', '700');

      // =====================================================================
      // PART 4 (MANDATORY SKILL RULE 1): 自動補齊之【土袋溝縱斷面展開圖】
      //         Shows longitudinal running-bond staggered soil bag courses (交丁砌築),
      //         2 layers of bed bags (H1=20cm), 3 layers of side wall bags (H=30cm),
      //         and anchor rebars/stakes spaced every S_stake_m (1~3m)!
      // =====================================================================
      const yProfTop = step3TitleY + 46;
      const wProf = 360;
      const hProfSide = p.H_cm * s3;
      const hProfBed = p.H1_cm * s3;
      const yProfBedTop = yProfTop + hProfSide;
      const yProfBedBot = yProfBedTop + hProfBed;

      // 1) Draw N_side Courses of Side Wall Bags in Running-Bond Staggered Pattern (交丁砌築)
      const nBagsHoriz = 6;
      const bagLonW = wProf / nBagsHoriz;

      for (let r = 0; r < p.N_side; r++) {
        const ry0 = yProfBedTop - (r + 1) * t3;
        const isOdd = (r % 2 === 1);
        if (!isOdd) {
          for (let c = 0; c < nBagsHoriz; c++) {
            drawPlanSoilBagRect(ctx, x0 + c * bagLonW, ry0, bagLonW, t3, false, pal, 'PROF_SIDE_BAG');
          }
        } else {
          // Half-bag at ends + full bags in middle (交丁砌築錯縫!)
          drawPlanSoilBagRect(ctx, x0, ry0, bagLonW * 0.5, t3, false, pal, 'PROF_SIDE_HALF');
          for (let c = 0; c < nBagsHoriz - 1; c++) {
            drawPlanSoilBagRect(ctx, x0 + (c + 0.5) * bagLonW, ry0, bagLonW, t3, false, pal, 'PROF_SIDE_BAG');
          }
          drawPlanSoilBagRect(ctx, x0 + (nBagsHoriz - 0.5) * bagLonW, ry0, bagLonW * 0.5, t3, false, pal, 'PROF_SIDE_HALF');
        }
      }

      // 2) Draw N_bed Courses of Ditch Bed Bags (H1 = 20cm) at Bottom of Profile
      for (let r = 0; r < p.N_bed; r++) {
        const ry0 = yProfBedTop + r * t3;
        const stag = (r % 2 === 0) ? 0 : bagLonW * 0.5;
        for (let c = 0; c < nBagsHoriz; c++) {
          const bx = x0 + c * bagLonW + stag;
          const bw = (bx + bagLonW > x0 + wProf) ? (x0 + wProf - bx) : bagLonW;
          if (bw > 6) {
            drawFilledSoilBagCrossSection(ctx, bx + bw / 2, ry0 + t3 / 2, bw * 0.96, t3 * 0.92, true, pal, 'PROF_BED_BAG');
          }
        }
      }

      // 3) Draw Vertical Anchor Stakes / Rebars spaced along Longitudinal Profile (每 1~3m 加設排樁固定)
      const stakePositionsProf = [x0 + wProf * 0.22, x0 + wProf * 0.78];
      stakePositionsProf.forEach((sx) => {
        drawAnchorStakePin(ctx, sx, yProfTop, yProfBedBot + 24, pal);
      });

      // Left & Right Z-Break Lines on Longitudinal Profile
      drawBreakLine(ctx, x0, yProfTop - 6, x0, yProfBedBot + 6, pal);
      drawBreakLine(ctx, x0 + wProf, yProfTop - 6, x0 + wProf, yProfBedBot + 6, pal);

      // Dimensions on Longitudinal Profile
      cadDim(ctx, x0, yProfTop, x0, yProfBedTop, -20, `H=${p.H_cm}`, pal, 10.5);
      cadDim(ctx, x0, yProfBedTop, x0, yProfBedBot, -20, `H1=${p.H1_cm}`, pal, 10.5);
      cadDim(ctx, stakePositionsProf[0], yProfBedBot + 24, stakePositionsProf[1], yProfBedBot + 24, 14, `排樁間距 @${p.S_stake_m.toFixed(1)}m (每排${p.N_stake_row}支鋼筋)`, pal, 10.5);

      const profTitleY = yProfBedBot + 62;
      cadText(ctx, '縱斷面展開圖 (自動補齊・交丁砌築與排樁固定)', x0 + wProf / 2, profTitleY, 15, pal.titleCyan, 'center', '700');
      cadLine(ctx, x0 + wProf / 2 - 145, profTitleY + 10, x0 + wProf / 2 + 145, profTitleY + 10, pal.titleCyan, 1.3);

      return {
        rightX: xFill0 + wFill + 95,
        bottomY: profTitleY + 24
      };
    }

    // =========================================================================
    // 6. VIEW 7: EXPLICIT FIGURE-NUMBER QUANTITY TABLE ON CANVAS
    // =========================================================================
    function drawExplicitFormulaTableOnCanvas(ctx, ox, oy, p, pal) {
      cadText(
        ctx,
        `【土袋溝 (圖號 0504-1 / 058) 每公尺數量計算式表 — 採用圖面標註數字顯式列式 (溝底寬W=${p.W_cm}cm・溝深H=${p.H_cm}cm・全段=${p.L_tot_m.toFixed(1)}m)】`,
        ox, oy - 15, 13.5, pal.dimText, 'left', '700'
      );

      const colW = [245, 485, 82, 92, 52];
      const rowH = 26;
      const rows = [
        ['工程項目名稱 (依DXF圖面標註)', '採用圖面標註數字之顯式計算式 (每公尺基準)', '每m數量', `全段(${p.L_tot_m}m)`, '單位'],
        [`笮式客土植生袋混草種 (PE袋≧${p.L_empty_cm}×${p.W_empty_cm}cm)`, p.formula_bags_cnt, p.q_bags_cnt.toFixed(1), (p.q_bags_cnt * p.L_tot_m).toFixed(0), '袋'],
        [`袋內填充物 (3:7砂石壤土+草種≧250g/m³)`, p.formula_bag_fill_vol, p.q_bag_fill_vol.toFixed(2), (p.q_bag_fill_vol * p.L_tot_m).toFixed(2), 'M³'],
        [`固定排樁 / 鋼筋 (每隔${p.S_stake_m.toFixed(1)}m打入${p.N_stake_row}支)`, p.formula_stake_cnt, p.q_stake_cnt.toFixed(2), (p.q_stake_cnt * p.L_tot_m).toFixed(0), '支'],
        [`整坡開挖與兩側回填土夯實 (坡度1:${p.m_slope})`, p.formula_backfill_vol, p.q_backfill_vol.toFixed(2), (p.q_backfill_vol * p.L_tot_m).toFixed(2), 'M³']
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
          const color = isHeader ? pal.textMain : (cIdx === 2 ? pal.dimText : (cIdx === 3 ? pal.bagHoundHatch : pal.textSub));
          cadText(ctx, cellStr, tx, ry, isHeader ? 11.2 : 10.6, color, align, (isHeader || cIdx === 2 || cIdx === 3) ? '700' : '500');
          cx += cw;
        });
      });

      return { bottomY: oy + totH };
    }

    // =========================================================================
    // 7. MAIN RENDER ENGINE & LIVE UI UPDATER
    // =========================================================================
    function updateSidebarSummary(p) {
      document.getElementById('stat_ditch_tag').textContent = `W=${p.W_cm}・H=${p.H_cm}cm`;
      document.getElementById('stat_bags_m').textContent = `${p.q_bags_cnt.toFixed(1)} 袋/m`;
      document.getElementById('stat_fill_m').textContent = `${p.q_bag_fill_vol.toFixed(2)} M³/m`;
      document.getElementById('stat_stake_m').textContent = `${p.q_stake_cnt.toFixed(2)} 支/m`;
      document.getElementById('stat_backfill_m').textContent = `${p.q_backfill_vol.toFixed(2)} M³/m`;
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

      if (currentView === 'PLAN_SEC') {
        const bPS = drawPlanAndCrossSectionViews(ctx, 40, 12, p, pal);
        drawExplicitFormulaTableOnCanvas(ctx, 40, bPS.bottomY + 42, p, pal);
      } else if (currentView === 'BAG_PROF') {
        const bBP = drawBagDetailsAndLongitudinalProfile(ctx, 50, 12, p, pal);
        drawExplicitFormulaTableOnCanvas(ctx, 50, bBP.bottomY + 42, p, pal);
      } else {
        // 'ALL' Full Standard Sheet Layout (Matching A3 Layout 5-04 of DXF):
        // - Left Column: 植生袋溝平面圖 (Top) + 斷面圖 (Bottom, 1:1 Vertically Aligned, Natural terrain stripped!) + 符號說明
        // - Right Column: PE土包袋詳圖 + 裝填後示意圖 + ◎步驟三剖面詳圖 + 自動補齊之縱斷面展開圖
        // - Bottom Full-Width: 圖面標註數字顯式計算式表
        const bPS = drawPlanAndCrossSectionViews(ctx, 20, 10, p, pal);
        const rightColX = bPS.rightX + 25;
        const bBP = drawBagDetailsAndLongitudinalProfile(ctx, rightColX, 10, p, pal);

        const tableY = Math.max(bPS.bottomY, bBP.bottomY) + 42;
        drawExplicitFormulaTableOnCanvas(ctx, 35, tableY, p, pal);
      }

      ctx.restore();
    }

    // =========================================================================
    // 8. UI CONTROLS, AUTO-SYNC & DXF / CSV EXPORTERS
    //    - Widening `W_cm` automatically calculates the required number of fixed-width bags `N_bed_cols`
    //    - Changing `N_bed_cols` updates `W_cm` based on fixed bag length `B1_cm` and overlap `lap_cm`
    //    - Changing `H_cm` or `H1_cm` automatically calculates stacked bag layers `N_side` or `N_bed`
    // =========================================================================
    function onWidthInput() {
      const wCm = parseFloat(document.getElementById('inp_W_cm').value) || 80;
      const b1Cm = parseFloat(document.getElementById('inp_B1_cm').value) || 42;
      const lapCm = parseFloat(document.getElementById('inp_lap_cm').value) || 5;
      const effStep = Math.max(18, b1Cm - lapCm);
      // Calculate how many fixed-size B1 bags are needed across width W
      const nCols = Math.max(1, Math.min(9, Math.round(wCm / effStep)));
      document.getElementById('inp_N_bed_cols').value = nCols;
      renderAll();
    }

    function onBedColsInput() {
      const nCols = Math.max(1, Math.min(9, Math.round(parseFloat(document.getElementById('inp_N_bed_cols').value) || 2)));
      const b1Cm = parseFloat(document.getElementById('inp_B1_cm').value) || 42;
      const lapCm = parseFloat(document.getElementById('inp_lap_cm').value) || 5;
      const effStep = Math.max(18, b1Cm - lapCm);
      // Compute corresponding ditch bottom width W (for nCols=2, B1=42, lap=5 -> W=80cm standard)
      const calcW = (nCols === 2 && b1Cm === 42 && lapCm === 5) ? 80 : Math.round(nCols * effStep + lapCm);
      document.getElementById('inp_W_cm').value = calcW;
      renderAll();
    }

    function onHeightInput() {
      const hCm = parseFloat(document.getElementById('inp_H_cm').value) || 30;
      const tBag = parseFloat(document.getElementById('inp_t_bag_cm').value) || 10;
      const nSide = Math.max(2, Math.min(8, Math.round(hCm / tBag)));
      document.getElementById('inp_N_side').value = nSide;
      document.getElementById('inp_H_cm').value = nSide * tBag;
      renderAll();
    }

    function onSideLayersInput() {
      const nSide = Math.max(2, Math.min(8, Math.round(parseFloat(document.getElementById('inp_N_side').value) || 3)));
      const tBag = parseFloat(document.getElementById('inp_t_bag_cm').value) || 10;
      document.getElementById('inp_H_cm').value = nSide * tBag;
      renderAll();
    }

    function onBedLayersInput() {
      const nBed = Math.max(1, Math.min(5, Math.round(parseFloat(document.getElementById('inp_N_bed').value) || 2)));
      const tBag = parseFloat(document.getElementById('inp_t_bag_cm').value) || 10;
      document.getElementById('inp_H1_cm').value = nBed * tBag;
      renderAll();
    }

    function onH1Input() {
      const h1Cm = parseFloat(document.getElementById('inp_H1_cm').value) || 20;
      const tBag = parseFloat(document.getElementById('inp_t_bag_cm').value) || 10;
      const nBed = Math.max(1, Math.min(5, Math.round(h1Cm / tBag)));
      document.getElementById('inp_N_bed').value = nBed;
      document.getElementById('inp_H1_cm').value = nBed * tBag;
      renderAll();
    }

    function onGeomChange() {
      const nSide = Math.max(2, Math.min(8, Math.round(parseFloat(document.getElementById('inp_N_side').value) || 3)));
      const nBed = Math.max(1, Math.min(5, Math.round(parseFloat(document.getElementById('inp_N_bed').value) || 2)));
      const tBag = parseFloat(document.getElementById('inp_t_bag_cm').value) || 10;
      document.getElementById('inp_H_cm').value = nSide * tBag;
      document.getElementById('inp_H1_cm').value = nBed * tBag;
      renderAll();
    }

    function resetToOrig() {
      Object.keys(ORIG_SOIL_BAG_DITCH).forEach(k => {
        const el = document.getElementById('inp_' + k);
        if (el) el.value = ORIG_SOIL_BAG_DITCH[k];
      });
      renderAll();
    }

    function switchView(view) {
      currentView = view;
      const specEl = document.getElementById('specPanel');
      const tabs = {
        ALL: document.getElementById('tab-all'),
        PLAN_SEC: document.getElementById('tab-plan-sec'),
        BAG_PROF: document.getElementById('tab-bag-prof'),
        SPEC: document.getElementById('tab-spec')
      };
      Object.keys(tabs).forEach(k => {
        if (!tabs[k]) return;
        tabs[k].className = (k === view)
          ? 'px-3 py-1.5 rounded-md text-xs font-semibold transition-all bg-lime-600 text-white shadow'
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
        ? 'px-2.5 py-1 rounded bg-lime-950/90 border border-lime-600/60 text-xs text-lime-300 flex items-center gap-1 transition'
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
      if (currentView === 'PLAN_SEC') {
        viewCam.scale = Math.min(rect.width / 1040, rect.height / 940) * 0.93;
        viewCam.offsetX = Math.max(25, (rect.width - 980 * viewCam.scale) / 2);
        viewCam.offsetY = 14;
      } else if (currentView === 'BAG_PROF') {
        viewCam.scale = Math.min(rect.width / 1040, rect.height / 920) * 0.93;
        viewCam.offsetX = Math.max(25, (rect.width - 980 * viewCam.scale) / 2);
        viewCam.offsetY = 14;
      } else {
        viewCam.scale = Math.min(rect.width / 1360, rect.height / 980) * 0.94;
        viewCam.offsetX = Math.max(20, (rect.width - 1300 * viewCam.scale) / 2);
        viewCam.offsetY = 12;
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
      a.download = `土袋溝標準圖_0504-1_W${p.W_cm}_H${p.H_cm}cm_含補齊縱斷面.dxf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }

    function exportCSV() {
      const p = getParams();
      const rows = [
        [`土袋溝（植生袋溝）標準圖 (圖號 0504-1 / 058・溝底寬W=${p.W_cm}cm・溝深H=${p.H_cm}cm・土包袋B1=${p.B1_cm}×B2=${p.B2_cm}cm) - 圖面標註數字顯式列式數量計算書`],
        ['工程項目名稱', '採用圖面標註數字之顯式計算式 (每公尺基準)', '每公尺數量', `全段數量(${p.L_tot_m}m)`, '單位'],
        [`笮式客土植生袋混草種 (PE袋≧${p.L_empty_cm}×${p.W_empty_cm}cm)`, `'${p.formula_bags_cnt}`, p.q_bags_cnt.toFixed(1), (p.q_bags_cnt * p.L_tot_m).toFixed(0), '袋'],
        [`袋內填充物 (3:7砂石壤土+草種≧250g/m³)`, `'${p.formula_bag_fill_vol}`, p.q_bag_fill_vol.toFixed(2), (p.q_bag_fill_vol * p.L_tot_m).toFixed(2), 'M³'],
        [`固定排樁 / 鋼筋 (每隔${p.S_stake_m.toFixed(1)}m打入${p.N_stake_row}支)`, `'${p.formula_stake_cnt}`, p.q_stake_cnt.toFixed(2), (p.q_stake_cnt * p.L_tot_m).toFixed(0), '支'],
        [`整坡開挖與兩側回填土夯實 (坡度1:${p.m_slope})`, `'${p.formula_backfill_vol}`, p.q_backfill_vol.toFixed(2), (p.q_backfill_vol * p.L_tot_m).toFixed(2), 'M³']
      ];

      const csvContent = '\uFEFF' + rows.map(r => r.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `土袋溝顯式列式計算書_0504-1_W${p.W_cm}xH${p.H_cm}.csv`;
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

  const STRIP = s => String(s).replace(/\s*[（(]\s*圖號[^）)]*[）)]/g, '').replace(/\s*[（(]\s*\d{4}-\d\s*[/／]\s*\d{3}\s*[）)]/g, '').replace(/\s*圖號\s*[：:]?\s*[0-9A-Za-z#\-／/ ]+/g, ' ');
  function params(R) { Object.keys(R || {}).forEach(k => { el('inp_' + k).value = String(R[k]); }); return getParams(); }
  function run(R, OV) {
    O = []; const PAL = getPalette(), p = params(R); Object.assign(p, R || {}, OV || {});
    const bPS = drawPlanAndCrossSectionViews(CTX, 20, 10, p, PAL), bBP = drawBagDetailsAndLongitudinalProfile(CTX, bPS.rightX + 25, 10, p, PAL); drawExplicitFormulaTableOnCanvas(CTX, 35, Math.max(bPS.bottomY, bBP.bottomY) + 42, p, PAL);
    
    const sc = 1 / 1.62; return O.map(o => { const r = Object.assign({}, o); if (r.p) r.p = r.p.map(([x, y]) => [x * sc, y * sc]); if (r.x !== undefined) { r.x *= sc; r.y *= sc; } if (r.r) r.r *= sc; if (r.h) r.h *= sc; if (r.s !== undefined && r.k === 'T') r.s = STRIP(r.s); return r; });
  }
  return { run, params };
})();
TCO_D['grass'] = (function () {
  let O = [];
  const EL = {}, CTX = new Proxy({}, { get: (t, k) => (k in t ? t[k] : () => ({ width: 0 })), set: (t, k, v) => { t[k] = v; return true; } });
  const el = id => EL[id] || (EL[id] = { value: '', textContent: '', innerHTML: '', className: '', style: {}, classList: { add() {}, remove() {}, toggle() {} }, addEventListener() {}, getContext: () => CTX, parentElement: { getBoundingClientRect: () => ({ width: 100, height: 100 }) } });
  const document = { getElementById: el, querySelectorAll: () => [], querySelector: () => null, createElement: () => ({ click() {}, style: {} }), body: { appendChild() {}, removeChild() {}, classList: { add() {}, remove() {}, toggle() {}, contains: () => false } }, documentElement: { classList: { contains: () => false, add() {}, remove() {}, toggle() {} } }, addEventListener() {} };
  const window = { addEventListener() {}, devicePixelRatio: 1, matchMedia: () => ({ matches: false, addEventListener() {} }) };

    // =========================================================================
    // 1. ORIGINAL DXF BASELINE CONSTANTS & GLOBAL STATE (PURE ASCII IDENTIFIERS)
    // =========================================================================
    const ORIG_GRASSED_WATERWAY = {
      W_cm: 140,
      H_cm: 48,
      f_cm: 10,
      t_soil_cm: 15,
      N_cob: 9,
      D_cob_cm: 10,
      sod_lap_cm: 2,
      S_wall_m: 15.0,
      L_tot_m: 30.0
    };

    let currentView = 'ALL'; // 'ALL', 'SECTIONS', 'PLAN_PROF', 'SPEC'
    let showGhost = false;
    let isDarkTheme = true;

    let viewCam = {
      scale: 0.68,
      offsetX: 26,
      offsetY: 16,
      isDragging: false,
      dragStartX: 0,
      dragStartY: 0
    };

    let dxfEntities = [];

    // =========================================================================
    // 2. PARAMETER READER & EXPLICIT FIGURE-NUMBER FORMULA ENGINE
    //    STRICT RULES:
    //    - Cobbles in Compound Grassed Waterway (複式草溝) ALWAYS keep fixed physical dimensions (D_cob_cm long axis x ~6.5cm short axis)
    //    - Embedded ~1/2 of long axis into parabolic bed (溝底鋪卵石，埋入深度約為長徑1/2)
    //    - Changing N_cob adds/removes cobbles along the parabolic invert without stretching single cobbles!
    // =========================================================================
    function getParams() {
      const num = (id, def) => {
        const el = document.getElementById(id);
        if (!el) return def;
        const v = parseFloat(el.value);
        return isNaN(v) ? def : v;
      };

      const W_cm = Math.max(80, Math.min(400, Math.round(num('inp_W_cm', 140))));
      const H_cm = Math.max(20, Math.min(120, Math.round(num('inp_H_cm', 48))));
      const f_cm = Math.max(5, Math.min(25, Math.round(num('inp_f_cm', 10))));
      const t_soil_cm = Math.max(10, Math.min(30, Math.round(num('inp_t_soil_cm', 15))));
      const N_cob = Math.max(5, Math.min(21, Math.round(num('inp_N_cob', 9))));
      const D_cob_cm = Math.max(5, Math.min(15, Math.round(num('inp_D_cob_cm', 10))));
      const sod_lap_cm = Math.max(1, Math.min(5, Math.round(num('inp_sod_lap_cm', 2))));
      const S_wall_m = Math.max(10.0, Math.min(40.0, num('inp_S_wall_m', 15.0)));
      const L_tot_m = Math.max(5.0, Math.min(100.0, num('inp_L_tot_m', 30.0)));

      // Fixed horizontal pitch per cobble in DXF: 9 cobbles span ~90cm (10cm pitch per cobble)
      const cobPitch_cm = num('inp_cobPitch_cm', 10.0);
      const W_cob_cm = Math.min(W_cm - 20, Math.round(N_cob * cobPitch_cm));
      const elWcob = document.getElementById('inp_W_cob_cm');
      if (elWcob) elWcob.value = W_cob_cm;

      const H_tot_cm = H_cm + f_cm; // Total parabolic depth from bank shoulder to invert (48 + 10 = 58cm)

      const p = {
        W_cm,
        H_cm,
        f_cm,
        H_tot_cm,
        t_soil_cm,
        N_cob,
        W_cob_cm,
        cobPitch_cm,
        D_cob_cm,
        sod_lap_cm,
        S_wall_m,
        L_tot_m
      };

      const W_m = +(W_cm / 100).toFixed(2);
      const H_m = +(H_cm / 100).toFixed(2);
      const f_m = +(f_cm / 100).toFixed(2);
      const Htot_m = +(H_tot_cm / 100).toFixed(2);
      const tsoil_m = +(t_soil_cm / 100).toFixed(2);
      const Wcob_m = +(W_cob_cm / 100).toFixed(2);
      const Dcob_m = +(D_cob_cm / 100).toFixed(2);

      // 1. Parabolic Arc Length (拋物線斷面弧長 P = W + 8*H_tot^2 / (3*W)):
      const arcExtra_m = +((8 * Htot_m * Htot_m) / (3 * W_m)).toFixed(3);
      p.P_arc_m = +(W_m + arcExtra_m).toFixed(2);

      // 一般草溝：匍匐性草皮鋪植面積 (百喜草/類地毯草，含重疊 2cm 接縫加成 1.08):
      p.q_grass_std = +(p.P_arc_m * 1.0).toFixed(2);
      p.formula_grass_std = `[溝頂寬W(${W_m.toFixed(2)}m) + 8*總深(${Htot_m.toFixed(2)}m)²/(3*${W_m.toFixed(2)}m) = ${p.P_arc_m.toFixed(2)}m] * 1.00m`;

      // 2. 複式草溝：溝底鋪卵石 (長徑 D5~10cm，埋入深度約為長徑 1/2) 面積與體積:
      const cobDepthDrop_m = +(Htot_m * Math.pow(Wcob_m / W_m, 2)).toFixed(2);
      const cobArc_m = +(Wcob_m + (8 * cobDepthDrop_m * cobDepthDrop_m) / (3 * Math.max(0.4, Wcob_m))).toFixed(2);
      p.q_cobble_area = +(cobArc_m * 1.0).toFixed(2);
      p.formula_cobble_area = `[溝底橫向${N_cob}顆卵石展開寬(${Wcob_m.toFixed(2)}m) + 弧長修正 = ${cobArc_m.toFixed(2)}m] * 1.00m`;

      p.q_cobble_vol = +(p.q_cobble_area * Dcob_m).toFixed(2);
      p.formula_cobble_vol = `鋪卵石面積(${p.q_cobble_area.toFixed(2)}M²) * 卵石長徑(${D_cob_cm}cm/100=${Dcob_m.toFixed(2)}m, 埋入1/2) * 1.00m`;

      // 複式草溝：兩側邊坡植草面積 (扣除中央卵石帶):
      p.q_grass_comp = Math.max(0.40, +(p.q_grass_std - p.q_cobble_area).toFixed(2));
      p.formula_grass_comp = `全斷面弧長(${p.q_grass_std.toFixed(2)}M²) - 溝底卵石帶面積(${p.q_cobble_area.toFixed(2)}M²)`;

      // 3. 拋物線草溝挖掘土方量 (A = 2/3 * W * H_tot):
      p.q_excav_vol = +((2 / 3) * W_m * Htot_m * 1.0).toFixed(2);
      p.formula_excav_vol = `(2/3) * 溝頂寬W(${W_m.toFixed(2)}m) * 總挖深(H=${H_m.toFixed(2)}+出水高${f_m.toFixed(2)}=${Htot_m.toFixed(2)}m) * 1.00m`;

      // 4. 鋤鬆種植面與客入良好表土 (設計原則6，厚 t_soil_cm):
      p.q_topsoil_vol = +(p.q_grass_std * tsoil_m * 1.0).toFixed(2);
      p.formula_topsoil_vol = `草溝弧長(${p.P_arc_m.toFixed(2)}m) * 客入表土厚(${t_soil_cm}cm/100=${tsoil_m.toFixed(2)}m) * 1.00m`;

      // 5. 底土土壤壓實 (注意事項1：壓實度應達 80% 以上為原則):
      p.q_compact_area = p.q_grass_std;
      p.formula_compact_area = `拋物線開挖底床弧長(${p.P_arc_m.toFixed(2)}m) * 1.00m (壓實度≧80%)`;

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
          grassColor: '#4ade80',
          grassFill: 'rgba(74, 222, 128, 0.14)',
          cobbleOutline: '#fb923c',
          cobbleHatch: '#cbd5e1',
          cobbleFill: 'rgba(249, 115, 22, 0.25)',
          waterLine: '#38bdf8',
          soilFill: 'rgba(168, 85, 247, 0.10)',
          dimLine: '#22d3ee',
          dimText: '#67e8f9',
          leaderLine: '#22d3ee',
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
          grassColor: '#15803d',
          grassFill: 'rgba(34, 197, 94, 0.18)',
          cobbleOutline: '#c2410c',
          cobbleHatch: '#475569',
          cobbleFill: 'rgba(253, 186, 116, 0.40)',
          waterLine: '#0284c7',
          soilFill: 'rgba(147, 51, 234, 0.08)',
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

    function cadCircle(ctx, cx, cy, r, color, width = 1.25, fill = null, dash = [], layer = '0') {
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

    // Leader Callout with solid dot (`_Dot` block in DXF 1303F)
    function cadLeaderDot(ctx, tx, ty, kx, ky, ex, ey, lines, pal, fontSize = 11.5) {
      cadLine(ctx, tx, ty, kx, ky, pal.leaderLine, 1.15, [], 'LEADER');
      if (Math.hypot(ex - kx, ey - ky) > 1) {
        cadLine(ctx, kx, ky, ex, ey, pal.leaderLine, 1.15, [], 'LEADER');
      }
      cadCircle(ctx, tx, ty, 2.3, pal.leaderLine, 1.0, pal.leaderLine, [], 'LEADER_DOT');

      const align = ex >= kx ? 'left' : 'right';
      const pad = ex >= kx ? 6 : -6;
      const arr = Array.isArray(lines) ? lines : [lines];
      arr.forEach((ln, idx) => {
        const yOff = (idx - (arr.length - 1) / 2) * (fontSize + 4);
        const col = idx === 0 ? pal.textMain : pal.titleCyan;
        cadText(ctx, ln, ex + pad, ey + yOff, fontSize, col, align, '600', 0, 'TEXT');
      });
    }

    function cadDim(ctx, x1, y1, x2, y2, offset, labelStr, pal, fontSize = 11.5) {
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

    // Helper: Draw a Single Vertical Cobble (溝底鋪卵石 D5~10cm, 1309B..130C4) with ANSI33 diagonal hatch!
    // Embedded ~1/2 of long axis into the parabolic bed!
    function drawEmbeddedCobble(ctx, cx, cy, rHoriz, rVert, angleRad, seed, pal, withAnsi33 = true, layer = 'COBBLE') {
      const nV = 11;
      const cosA = Math.cos(angleRad), sinA = Math.sin(angleRad);
      const pts = [];
      for (let i = 0; i < nV; i++) {
        const a = (i / nV) * Math.PI * 2;
        const jit = 0.90 + 0.11 * Math.sin(seed * 3.7 + i * 2.1);
        const lx = Math.cos(a) * rHoriz * jit;
        const ly = Math.sin(a) * rVert * jit;
        pts.push([
          cx + lx * cosA - ly * sinA,
          cy + lx * sinA + ly * cosA
        ]);
      }
      cadPoly(ctx, pts, pal.cobbleOutline, 1.35, true, pal.cobbleFill, [], layer);

      if (withAnsi33) {
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(pts[0][0], pts[0][1]);
        for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
        ctx.closePath();
        ctx.clip();

        const span = Math.max(rHoriz, rVert) * 1.45;
        const step = 4.8;
        let idx = 0;
        for (let d = -span; d <= span; d += step) {
          const isDashed = (idx % 2 === 1);
          cadLine(
            ctx,
            cx + d - span, cy + span,
            cx + d + span, cy - span,
            pal.cobbleHatch, 0.8,
            isDashed ? [3, 2.5] : [],
            layer + '_ANSI33'
          );
          idx++;
        }
        ctx.restore();
      }
    }

    // Helper: Draw Creeping Grass Tuft (`plant` block BF4..C1A in DXF: 百喜草/類地毯草) oriented normal to curve
    function drawCreepingGrassTuft(ctx, x, y, normalAngleRad, scale, pal) {
      const s = scale;
      const cosA = Math.cos(normalAngleRad), sinA = Math.sin(normalAngleRad);
      const rot = (lx, ly) => [
        x + (lx * cosA - ly * sinA) * s,
        y + (lx * sinA + ly * cosA) * s
      ];
      // Multi-blade creeping stolon grass fan matching DXF `plant` block
      cadPoly(ctx, [rot(-6.5, 0), rot(-2.5, -6.5), rot(0, 0), rot(0.5, -8.5), rot(2.2, 0), rot(6.2, -6.0)], pal.grassColor, 1.15, false, null, [], 'PLANT_BLADE');
    }

    // Helper: Draw Water Level Triangle Symbol ▽ (`1113D..11140` & `13040..13043` in DXF)
    function drawWaterSymbol(ctx, wx, wy, pal) {
      cadPoly(ctx, [
        [wx, wy],
        [wx + 4.5, wy - 7.5],
        [wx - 4.5, wy - 7.5]
      ], pal.waterLine, 1.25, true, null, [], 'WATER_TRI');
      cadLine(ctx, wx - 11, wy, wx + 11, wy, pal.waterLine, 1.2, [], 'WATER_RIPPLE');
      cadLine(ctx, wx - 7.5, wy + 3.5, wx + 7.5, wy + 3.5, pal.waterLine, 1.05, [], 'WATER_RIPPLE');
      cadLine(ctx, wx - 4.0, wy + 7.0, wx + 4.0, wy + 7.0, pal.waterLine, 0.95, [], 'WATER_RIPPLE');
    }

    // Helper: Sample Parabolic Waterway Curve between [-W/2, +W/2] with rounded shoulder transitions (matching DXF `11079` & `131E1`)
    // NOTE: Natural terrain extensions outside [-W/2, +W/2] are 100% STRIPPED!
    function getParabolicChannelPoints(cx, yShoulder, W_px, H_px, f_px, xMin, xMax, nSeg = 36) {
      const H_tot = H_px + f_px;
      const halfW = W_px / 2;
      const pts = [];
      for (let i = 0; i <= nSeg; i++) {
        const px = xMin + (i / nSeg) * (xMax - xMin);
        const u = (px - cx) / halfW; // -1 .. +1
        // Smooth shoulder-to-parabola profile matching DXF bulge curve
        const depth = H_tot * (1 - u * u);
        const py = yShoulder + depth;
        pts.push([px, py]);
      }
      return pts;
    }

    // =========================================================================
    // 4. VIEW 1 & 2: 原圖【草溝斷面圖】 (TOP) & 原圖【複式草溝斷面圖】 (BOTTOM)
    //    100% Faithful to DXF Viewports 2 (`9AA1`), 3 (`1307D`) & 4 (`13166`):
    //    - Natural sloped terrain wings (`6660.4~6674.8` & `6753.3~6767.7`) are 100% STRIPPED!
    //    - Top: 草溝斷面圖 (Parabolic grassed channel, W, H, water level ▽, creeping grass tufts)
    //    - Bottom (1:1 Aligned): 複式草溝斷面圖 (Parabolic channel with HIDDEN2 dashed original curve,
    //      9 vertical cobbles D5~10cm embedded 1/2 of long axis at the invert, callout `1303D/1303F`)
    // =========================================================================
    function drawBothCrossSections(ctx, ox, topY, p, pal) {
      const s = 1.95; // Scale: 1 cm = 1.95 px

      const W = p.W_cm * s;
      const H = p.H_cm * s;
      const f = p.f_cm * s;
      const H_tot = H + f;
      const t_soil = p.t_soil_cm * s;

      const cx = ox + Math.max(260, W / 2 + 85);
      const xLeft = cx - W / 2;
      const xRight = cx + W / 2;

      // Water surface width at yWater = yShoulder + f:
      // Since depth(u) = H_tot * (1 - u^2), at depth = f: 1 - u_w^2 = f / H_tot => u_w = sqrt(H / H_tot)
      const uWater = Math.sqrt(H / H_tot);
      const xWaterL = cx - (W / 2) * uWater;
      const xWaterR = cx + (W / 2) * uWater;

      // =====================================================================
      // PART A: 草溝斷面圖 (STANDARD PARABOLIC GRASSED WATERWAY - TOP)
      // =====================================================================
      const yTop1 = topY + 52;          // Top shoulder of grassed waterway
      const yWater1 = yTop1 + f;        // Design water level (depth H above invert)
      const yInvert1 = yTop1 + H_tot;   // Parabolic invert bottom

      // 0) Ghost Baseline (Original W=140, H=48, f=10)
      if (showGhost) {
        const gW = 140 * s, gH = 48 * s, gf = 10 * s;
        const gPts = getParabolicChannelPoints(cx, yTop1, gW, gH, gf, cx - gW / 2, cx + gW / 2, 28);
        cadPoly(ctx, gPts, pal.ghostLine, 1.1, false, null, [4, 4], 'GHOST_STD');
      }

      // 1) Topsoil Layer Cushion (客入良好表土厚 t_soil_cm) under Parabolic Curve
      const curvePts1 = getParabolicChannelPoints(cx, yTop1, W, H, f, xLeft, xRight, 40);
      const soilBotPts1 = curvePts1.map(([px, py]) => [px, py + t_soil * 0.55]).reverse();
      cadPoly(ctx, [...curvePts1, ...soilBotPts1], pal.secondaryLine, 0.95, true, pal.soilFill, [4, 3], 'STD_TOPSOIL');

      // Main Parabolic Waterway Profile (`11079` in DXF, stripped of outer natural terrain wings!)
      cadPoly(ctx, curvePts1, pal.primaryLine, 2.0, false, null, [], 'STD_PARABOLA');

      // 2) Creeping Grass Tufts (`plant` blocks `11078..12921`) along full parabolic perimeter
      const nGrass1 = Math.max(14, Math.round(p.W_cm / 8));
      for (let i = 1; i < nGrass1; i++) {
        const u = -0.94 + (i / nGrass1) * 1.88;
        const gx = cx + u * (W / 2);
        const gy = yTop1 + H_tot * (1 - u * u);
        // Slope dy/dx = -2 * H_tot * u / (W/2)
        const dydx = (-2 * H_tot * u) / (W / 2);
        const normalAng = Math.atan2(dydx, 1);
        drawCreepingGrassTuft(ctx, gx, gy, normalAng, 1.05, pal);
      }

      // 3) Design Water Surface Line & Water Triangle Symbol ▽ (`1113D..11141`)
      cadLine(ctx, xWaterL, yWater1, xWaterR, yWater1, pal.waterLine, 1.55, [], 'STD_WATER_LINE');
      drawWaterSymbol(ctx, cx, yWater1, pal);

      // 4) Dimensions on 草溝斷面圖 (`*D15` W & `*D16` H):
      cadDim(ctx, xLeft, yTop1, xRight, yTop1, -24, `W (${p.W_cm}cm)`, pal, 11.5);

      const xDimH1 = xLeft - 28;
      cadLine(ctx, xWaterL - 4, yWater1, xDimH1 - 6, yWater1, pal.dimLine, 0.95);
      cadLine(ctx, cx - 12, yInvert1, xDimH1 - 6, yInvert1, pal.dimLine, 0.95);
      cadDim(ctx, xDimH1, yWater1, xDimH1, yInvert1, 0, `H (${p.H_cm}cm)`, pal, 11.5);

      // Title with Double Underline: 草溝斷面圖 (`F7C0, F7C5, F7C6`)
      const title1Y = yInvert1 + t_soil * 0.55 + 32;
      cadText(ctx, '草溝斷面圖', cx, title1Y, 16, pal.titleCyan, 'center', '700');
      cadLine(ctx, cx - 55, title1Y + 10, cx + 55, title1Y + 10, pal.titleCyan, 1.5);
      cadLine(ctx, cx - 55, title1Y + 13.5, cx + 55, title1Y + 13.5, pal.titleCyan, 1.0);

      // =====================================================================
      // PART B: 複式草溝斷面圖 (COMPOUND GRASSED WATERWAY WITH COBBLES - BOTTOM)
      //         1:1 Aligned with 草溝斷面圖 above!
      //         - Dashed original parabolic curve (`131E1` HIDDEN2) in center cobble zone
      //         - Solid left & right grassed bank arcs (`13027` & `131E4`)
      //         - `p.N_cob` vertical cobbles (`1309B..130C4`, D5~10cm) embedded 1/2 of long axis!
      // =====================================================================
      const yTop2 = title1Y + 68;
      const yWater2 = yTop2 + f;
      const yInvert2 = yTop2 + H_tot;

      // 1:1 Vertical Alignment Guides between Top and Bottom Cross-Sections
      [xLeft, cx, xRight].forEach((gx) => {
        cadLine(ctx, gx, title1Y + 16, gx, yTop2 - 28, pal.secondaryLine, 0.8, [4, 4], 'ALIGN_GUIDE');
      });

      const W_cob = p.W_cob_cm * s;
      const xCobL = cx - W_cob / 2;
      const xCobR = cx + W_cob / 2;

      // 1) Topsoil Layer Cushion under Compound Parabolic Channel
      const fullPts2 = getParabolicChannelPoints(cx, yTop2, W, H, f, xLeft, xRight, 40);
      const soilBotPts2 = fullPts2.map(([px, py]) => [px, py + t_soil * 0.65]).reverse();
      cadPoly(ctx, [...fullPts2, ...soilBotPts2], pal.secondaryLine, 0.95, true, pal.soilFill, [4, 3], 'COMP_TOPSOIL');

      // 2) Left Solid Grassed Bank (`131E4`), Center Dashed Reference Parabola (`131E1`), Right Solid Grassed Bank (`13027`)
      const leftBankPts = getParabolicChannelPoints(cx, yTop2, W, H, f, xLeft, xCobL, 16);
      const midDashedPts = getParabolicChannelPoints(cx, yTop2, W, H, f, xCobL, xCobR, 20);
      const rightBankPts = getParabolicChannelPoints(cx, yTop2, W, H, f, xCobR, xRight, 16);

      cadPoly(ctx, leftBankPts, pal.primaryLine, 2.0, false, null, [], 'COMP_BANK_L');
      cadPoly(ctx, midDashedPts, pal.secondaryLine, 1.35, false, null, [5, 3.5], 'COMP_DASHED_PARABOLA');
      cadPoly(ctx, rightBankPts, pal.primaryLine, 2.0, false, null, [], 'COMP_BANK_R');

      // 3) Creeping Grass Tufts on Left & Right Banks Only (outside the central cobble zone, matching DXF `13026..13073`)
      for (let i = 1; i < nGrass1; i++) {
        const u = -0.94 + (i / nGrass1) * 1.88;
        const gx = cx + u * (W / 2);
        if (gx >= xCobL - 4 && gx <= xCobR + 4) continue;
        const gy = yTop2 + H_tot * (1 - u * u);
        const dydx = (-2 * H_tot * u) / (W / 2);
        const normalAng = Math.atan2(dydx, 1);
        drawCreepingGrassTuft(ctx, gx, gy, normalAng, 1.05, pal);
      }

      // 4) Draw `p.N_cob` Vertical Cobbles (溝底鋪卵石，埋入深度約為長徑1/2，長徑D5~10cm，matching DXF `1309B..130C4`)
      //    Each cobble is centered right on the dashed parabolic bed curve so 1/2 is embedded below the curve and 1/2 protrudes above!
      const rVertCob = (p.D_cob_cm * 0.5) * s;     // Semi-major vertical axis (half of D_cob = 5cm * s)
      const rHorizCob = (p.cobPitch_cm * 0.49) * s; // Semi-minor horizontal axis (~4.9cm * s, fixed size!)
      let rightSecondCobblePt = [cx, yInvert2];

      for (let c = 0; c < p.N_cob; c++) {
        const frac = (c + 0.5) / p.N_cob;
        const bx = xCobL + frac * W_cob;
        const u = (bx - cx) / (W / 2);
        const byCurve = yTop2 + H_tot * (1 - u * u); // Centered on the dashed parabola = 1/2 embedded, 1/2 exposed!
        const tilt = ((c % 2 === 0 ? 1 : -1) * 0.05);
        drawEmbeddedCobble(ctx, bx, byCurve, rHorizCob, rVertCob, tilt, c * 17 + 7, pal, true, 'COMP_BED_COBBLE');
        if (c === p.N_cob - 2) {
          rightSecondCobblePt = [bx, byCurve + rVertCob * 0.55];
        }
      }

      // 5) Design Water Surface Line & Water Triangle Symbol ▽ (`13040..13044`)
      cadLine(ctx, xWaterL, yWater2, xWaterR, yWater2, pal.waterLine, 1.55, [], 'COMP_WATER_LINE');
      drawWaterSymbol(ctx, cx, yWater2, pal);

      // 6) Dimensions on 複式草溝斷面圖 (`*D18` W & `*D19` H):
      cadDim(ctx, xLeft, yTop2, xRight, yTop2, -24, `W (${p.W_cm}cm)`, pal, 11.5);

      const xDimH2 = xLeft - 28;
      cadLine(ctx, xWaterL - 4, yWater2, xDimH2 - 6, yWater2, pal.dimLine, 0.95);
      cadLine(ctx, cx - 12, yInvert2, xDimH2 - 6, yInvert2, pal.dimLine, 0.95);
      cadDim(ctx, xDimH2, yWater2, xDimH2, yInvert2, 0, `H (${p.H_cm}cm)`, pal, 11.5);

      // 7) Callout Leader (`1303D` & `1303F`): 溝底鋪卵石，埋入深度約為長徑1/2 / (長徑D5~10cm)
      cadLeaderDot(
        ctx,
        rightSecondCobblePt[0], rightSecondCobblePt[1],
        rightSecondCobblePt[0] + 16, yInvert2 + rVertCob + 16,
        xRight + 25, yInvert2 + rVertCob + 16,
        ['溝底鋪卵石，埋入深度約為長徑1/2', `(長徑D5~${p.D_cob_cm}cm，當前橫向${p.N_cob}顆)`],
        pal, 11.2
      );

      // 8) Symbol Legend Box (`13103` in DXF: 符號說明：W 溝頂寬 / H 水深)
      const legX = xRight + 24;
      const legY = yTop2 - 12;
      const legW = 195;
      const legH = 74;
      cadPoly(ctx, [
        [legX, legY],
        [legX + legW, legY],
        [legX + legW, legY + legH],
        [legX, legY + legH]
      ], pal.tableBorder, 1.15, true, 'rgba(15, 23, 42, 0.88)', [], 'SYMBOL_LEGEND_13103');
      cadText(ctx, '符號說明：', legX + 12, legY + 18, 12, pal.titleCyan, 'left', '700');
      cadText(ctx, `W   溝頂寬 (當前 ${p.W_cm} cm)`, legX + 16, legY + 40, 11, pal.textMain, 'left', '600');
      cadText(ctx, `H   水深 (當前 ${p.H_cm} cm)`, legX + 16, legY + 60, 11, pal.textMain, 'left', '600');

      // Title with Double Underline: 複式草溝斷面圖 (`13081, 13086, 13087`)
      const title2Y = yInvert2 + rVertCob + 44;
      cadText(ctx, '複式草溝斷面圖', cx, title2Y, 16, pal.titleCyan, 'center', '700');
      cadLine(ctx, cx - 68, title2Y + 10, cx + 68, title2Y + 10, pal.titleCyan, 1.5);
      cadLine(ctx, cx - 68, title2Y + 13.5, cx + 68, title2Y + 13.5, pal.titleCyan, 1.0);

      return {
        rightX: legX + legW + 30,
        bottomY: title2Y + 28
      };
    }

    // =========================================================================
    // 5. VIEW 3 & 4 (MANDATORY SKILL RULE 1): 自動補齊之 1:1 對齊【俯視平面圖】與【縱斷面展開圖】
    //    - 俯視平面圖 (Top): 呈現草溝全寬 W、兩側匍匐性草皮帶狀鋪植 (重疊 2cm 接縫，自下游往上游鋪植)、
    //      中央複式卵石鋪設帶 (寬 W_cob，D5~10cm 卵石緊密排列)、以及每隔 10~40m 軸向略往上之截水牆
    //    - 縱斷面展開圖 (Bottom, 1:1 垂直對齊): 呈現水深 H、出水高 f、溝底埋入 1/2 長徑之卵石層、
    //      客入良好表土層、高於坡面 ≧5cm 之截水牆與壓實度 ≧80% 底土層
    // =========================================================================
    function drawPlanAndLongitudinalViews(ctx, ox, topY, p, pal) {
      const s = 1.15;
      const L_draw_cm = 280;
      const L_draw = L_draw_cm * s;
      const W = p.W_cm * s;
      const W_cob = p.W_cob_cm * s;

      const x0 = ox + 58;
      const x1 = x0 + L_draw;

      // =====================================================================
      // PART A: 複式草溝俯視平面圖 (TOP PLAN VIEW)
      // =====================================================================
      const yPlanTop = topY + 46;
      const yPlanMid = yPlanTop + W / 2;
      const yPlanBot = yPlanTop + W;
      const yCobTop = yPlanMid - W_cob / 2;
      const yCobBot = yPlanMid + W_cob / 2;

      // 1) Outer Parabolic Waterway Top Edges (溝頂兩邊線, 寬 W)
      cadPoly(ctx, [
        [x0, yPlanTop],
        [x1, yPlanTop],
        [x1, yPlanBot],
        [x0, yPlanBot]
      ], pal.primaryLine, 1.5, true, pal.grassFill, [], 'PLAN_OUTER');

      // Sod strip overlap lines (寬 20~25cm 草皮，重疊 2cm 接縫鋪植，設計原則7)
      const sodStripW = 24 * s;
      for (let sx = x0 + sodStripW; sx < x1 - 8; sx += sodStripW) {
        cadLine(ctx, sx, yPlanTop, sx, yCobTop, pal.grassColor, 0.8, [4, 3], 'PLAN_SOD_JOINT');
        cadLine(ctx, sx, yCobBot, sx, yPlanBot, pal.grassColor, 0.8, [4, 3], 'PLAN_SOD_JOINT');
      }

      // Grass tufts in Upper & Lower Side Slope Strips
      for (let gx = x0 + 18; gx < x1 - 14; gx += 34) {
        drawCreepingGrassTuft(ctx, gx, (yPlanTop + yCobTop) / 2 + 4, 0, 0.85, pal);
        drawCreepingGrassTuft(ctx, gx + 14, (yCobBot + yPlanBot) / 2 + 4, 0, 0.85, pal);
      }

      // 2) Central Compound Cobble Band (溝底鋪卵石帶 W_cob)
      cadPoly(ctx, [
        [x0, yCobTop],
        [x1, yCobTop],
        [x1, yCobBot],
        [x0, yCobBot]
      ], pal.cobbleOutline, 1.25, true, 'rgba(15, 23, 42, 0.65)', [5, 3], 'PLAN_COBBLE_ZONE');

      const nRowsCobPlan = Math.max(3, Math.round(p.N_cob * 0.55));
      const nColsCobPlan = Math.max(10, Math.round(L_draw_cm / 18));
      const rowStepY = W_cob / nRowsCobPlan;
      const colStepX = L_draw / nColsCobPlan;

      for (let r = 0; r < nRowsCobPlan; r++) {
        const cy = yCobTop + (r + 0.5) * rowStepY;
        const stag = (r % 2 === 1) ? colStepX * 0.45 : 0;
        for (let c = 0; c < nColsCobPlan; c++) {
          const cx = x0 + (c + 0.5) * colStepX + stag;
          if (cx + colStepX * 0.42 <= x1 - 2) {
            drawEmbeddedCobble(ctx, cx, cy, colStepX * 0.44, rowStepY * 0.43, ((r + c) % 2) * 0.15, r * 29 + c + 3, pal, false, 'PLAN_COBBLE');
          }
        }
      }

      // 3) Cutoff Wall (截水牆，注意事項5：每隔 10~40m 設截水牆一處，高於坡面 5cm 以上，軸向略往上以收集地表水)
      const wallX = x0 + L_draw * 0.68;
      const wallW = 12 * s;
      const vchevron = 10 * s; // Slightly angled upstream ("軸向略往上")
      cadPoly(ctx, [
        [wallX - vchevron, yPlanTop - 4],
        [wallX + wallW - vchevron, yPlanTop - 4],
        [wallX + wallW, yPlanMid],
        [wallX + wallW - vchevron, yPlanBot + 4],
        [wallX - vchevron, yPlanBot + 4],
        [wallX, yPlanMid]
      ], pal.dimLine, 1.5, true, 'rgba(34, 211, 238, 0.22)', [], 'PLAN_CUTOFF_WALL');

      // Flow Arrow on Plan View
      const flwX1 = x0 + 36, flwX2 = x0 + 115;
      cadLine(ctx, flwX1, yPlanMid, flwX2, yPlanMid, pal.waterLine, 1.8, [], 'FLOW_ARROW');
      cadPoly(ctx, [[flwX2 - 7, yPlanMid - 3.5], [flwX2 - 7, yPlanMid + 3.5], [flwX2, yPlanMid]], pal.waterLine, 1.2, true, pal.waterLine);
      cadText(ctx, '水流方向 (坡度≦10%)', (flwX1 + flwX2) / 2, yPlanMid - 12, 10.5, pal.waterLine, 'center', '700');

      // Dimensions on Plan View
      cadDim(ctx, x0, yPlanTop, x1, yPlanTop, -20, `平面展示長 ${L_draw_cm}cm (草溝全長不可超過30m・草皮重疊${p.sod_lap_cm}cm鋪植)`, pal, 10.5);
      cadDim(ctx, x0, yPlanTop, x0, yPlanBot, -22, `W (${p.W_cm})`, pal, 11);
      cadDim(ctx, x1, yCobTop, x1, yCobBot, 20, `卵石帶${p.W_cob_cm}`, pal, 10.5);

      const planTitleY = yPlanBot + 28;
      cadText(ctx, '草溝及複式草溝俯視平面圖 (自動補齊・1:1對齊)', (x0 + x1) / 2, planTitleY, 15, pal.titleCyan, 'center', '700');
      cadLine(ctx, (x0 + x1) / 2 - 145, planTitleY + 9, (x0 + x1) / 2 + 145, planTitleY + 9, pal.titleCyan, 1.3);

      // =====================================================================
      // PART B: 複式草溝縱斷面展開圖 (LONGITUDINAL PROFILE - 1:1 ALIGNED BELOW PLAN)
      // =====================================================================
      const yProfTop = planTitleY + 52;
      const f_px = p.f_cm * s * 1.4;
      const H_px = p.H_cm * s * 1.4;
      const Dcob_px = p.D_cob_cm * s * 1.4;
      const tsoil_px = p.t_soil_cm * s * 1.2;

      const yProfWater = yProfTop + f_px;
      const yProfInvert = yProfWater + H_px; // Parabolic invert line (1/2 of cobble embedded below, 1/2 above!)
      const yProfSoilBot = yProfInvert + Dcob_px * 0.5 + tsoil_px;

      // 1:1 Vertical Alignment Guides between Plan View and Profile View
      [x0, wallX, x1].forEach((gx) => {
        cadLine(ctx, gx, yPlanBot + 4, gx, yProfTop - 8, pal.secondaryLine, 0.8, [4, 4], 'ALIGN_GUIDE');
      });

      // 1) Side Bank Grass Elevation Background
      cadPoly(ctx, [
        [x0, yProfTop],
        [x1, yProfTop],
        [x1, yProfInvert],
        [x0, yProfInvert]
      ], pal.primaryLine, 1.35, true, pal.grassFill, [], 'PROF_BANK_BG');

      // Design Water Surface Line ▽
      cadLine(ctx, x0, yProfWater, x1, yProfWater, pal.waterLine, 1.5, [8, 4], 'PROF_WATER_LINE');
      drawWaterSymbol(ctx, x0 + 65, yProfWater, pal);

      // Dashed Invert Line (埋入 1/2 基準線)
      cadLine(ctx, x0, yProfInvert, x1, yProfInvert, pal.secondaryLine, 1.2, [5, 3], 'PROF_INVERT_LINE');

      // 2) Topsoil Cushion Layer & Subgrade Compaction Hatch (壓實度 ≧80%)
      cadPoly(ctx, [
        [x0, yProfInvert],
        [x1, yProfInvert],
        [x1, yProfSoilBot],
        [x0, yProfSoilBot]
      ], pal.secondaryLine, 1.25, true, pal.soilFill, [], 'PROF_TOPSOIL');

      for (let hx = x0 + 24; hx < x1 - 20; hx += 62) {
        for (let k = 0; k < 3; k++) {
          cadLine(ctx, hx + k * 5, yProfSoilBot, hx + k * 5 - 6, yProfSoilBot + 7, pal.cobbleHatch, 1.05, [], 'PROF_COMPACT_HATCH');
        }
      }

      // 3) Row of Embedded Cobbles along Invert (長徑 D5~10cm，埋入深度約為長徑 1/2)
      const nProfCob = Math.max(12, Math.round(L_draw_cm / 14));
      const profCobStep = L_draw / nProfCob;
      for (let c = 0; c < nProfCob; c++) {
        const bx = x0 + (c + 0.5) * profCobStep;
        if (Math.abs(bx - (wallX + wallW / 2)) < wallW * 0.85) continue;
        drawEmbeddedCobble(ctx, bx, yProfInvert, profCobStep * 0.45, Dcob_px * 0.5, 0.05 * (c % 2 ? 1 : -1), c * 19 + 5, pal, true, 'PROF_COBBLE');
      }

      // 4) Cutoff Wall in Longitudinal Profile (截水牆，高於坡面 5cm 以上，兼具截水與止滑功能)
      const wallProtrude = 7 * s;
      const wallEmbed = yProfSoilBot + 16;
      cadPoly(ctx, [
        [wallX, yProfInvert - wallProtrude],
        [wallX + wallW, yProfInvert - wallProtrude],
        [wallX + wallW, wallEmbed],
        [wallX, wallEmbed]
      ], pal.dimLine, 1.5, true, 'rgba(34, 211, 238, 0.28)', [], 'PROF_CUTOFF_WALL');

      cadLeaderDot(
        ctx,
        wallX + wallW / 2, yProfInvert - wallProtrude,
        wallX + wallW / 2 + 16, yProfTop + 16,
        wallX + wallW / 2 + 28, yProfTop + 16,
        [`截水牆(每隔${p.S_wall_m.toFixed(0)}m設一處，高於坡面≧5cm)`],
        pal, 10.5
      );

      // Dimensions on Longitudinal Profile
      cadDim(ctx, x0, yProfTop, x0, yProfWater, -22, `出水${p.f_cm}`, pal, 10);
      cadDim(ctx, x0, yProfWater, x0, yProfInvert, -22, `H (${p.H_cm})`, pal, 11);
      cadDim(ctx, x1, yProfInvert - Dcob_px * 0.5, x1, yProfInvert + Dcob_px * 0.5, 20, `D=${p.D_cob_cm}`, pal, 10.5);

      const profTitleY = wallEmbed + 28;
      cadText(ctx, '草溝及複式草溝縱斷面展開圖 (自動補齊)', (x0 + x1) / 2, profTitleY, 15, pal.titleCyan, 'center', '700');
      cadLine(ctx, (x0 + x1) / 2 - 130, profTitleY + 9, (x0 + x1) / 2 + 130, profTitleY + 9, pal.titleCyan, 1.3);

      return {
        rightX: x1 + 65,
        bottomY: profTitleY + 24
      };
    }

    // =========================================================================
    // 6. VIEW 5: EXPLICIT FIGURE-NUMBER QUANTITY TABLE ON CANVAS
    // =========================================================================
    function drawExplicitFormulaTableOnCanvas(ctx, ox, oy, p, pal) {
      cadText(
        ctx,
        `【草溝及複式草溝 (圖號 0506-1 / 060) 每公尺數量計算式表 — 採用圖面標註數字顯式列式 (溝頂寬W=${p.W_cm}cm・水深H=${p.H_cm}cm・全段L=${p.L_tot_m.toFixed(1)}m)】`,
        ox, oy - 15, 13.2, pal.dimText, 'left', '700'
      );

      const colW = [250, 490, 82, 92, 52];
      const rowH = 26;
      const rows = [
        ['工程項目名稱 (依DXF圖面標註)', '採用圖面標註數字之顯式計算式 (每公尺基準)', '每m數量', `全段(${p.L_tot_m}m)`, '單位'],
        [`一般草溝：百喜草/類地毯草鋪植 (重疊${p.sod_lap_cm}cm)`, p.formula_grass_std, p.q_grass_std.toFixed(2), (p.q_grass_std * p.L_tot_m).toFixed(1), 'M²'],
        [`複式草溝：溝底鋪卵石面積 (長徑D5~${p.D_cob_cm}cm, 埋入1/2)`, p.formula_cobble_area, p.q_cobble_area.toFixed(2), (p.q_cobble_area * p.L_tot_m).toFixed(1), 'M²'],
        [`複式草溝：溝底卵石體積 (橫向${p.N_cob}顆, D=${p.D_cob_cm}cm)`, p.formula_cobble_vol, p.q_cobble_vol.toFixed(2), (p.q_cobble_vol * p.L_tot_m).toFixed(2), 'M³'],
        ['複式草溝：兩側溝坡植草面積 (扣除中央卵石帶)', p.formula_grass_comp, p.q_grass_comp.toFixed(2), (p.q_grass_comp * p.L_tot_m).toFixed(1), 'M²'],
        [`淺寬拋物線草溝挖掘土方 (W=${p.W_cm}cm, H=${p.H_cm}cm)`, p.formula_excav_vol, p.q_excav_vol.toFixed(2), (p.q_excav_vol * p.L_tot_m).toFixed(2), 'M³'],
        [`鋤鬆種植面與客入良好表土 (厚${p.t_soil_cm}cm, 植溝@10~20cm)`, p.formula_topsoil_vol, p.q_topsoil_vol.toFixed(2), (p.q_topsoil_vol * p.L_tot_m).toFixed(2), 'M³'],
        ['底土土壤壓實 (壓實度應達 80% 以上為原則)', p.formula_compact_area, p.q_compact_area.toFixed(2), (p.q_compact_area * p.L_tot_m).toFixed(1), 'M²']
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
          const color = isHeader ? pal.textMain : (cIdx === 2 ? pal.dimText : (cIdx === 3 ? pal.cobbleOutline : pal.textSub));
          cadText(ctx, cellStr, tx, ry, isHeader ? 11.2 : 10.6, color, align, (isHeader || cIdx === 2 || cIdx === 3) ? '700' : '500');
          cx += cw;
        });
      });

      return { bottomY: oy + totH };
    }

    // =========================================================================
    // 7. MAIN RENDER ENGINE & LIVE UI UPDATER
    // =========================================================================
    function updateSidebarSummary(p) {
      document.getElementById('stat_ditch_tag').textContent = `W=${p.W_cm}・H=${p.H_cm}cm`;
      document.getElementById('stat_grass_std_m').textContent = `${p.q_grass_std.toFixed(2)} M²/m`;
      document.getElementById('stat_cobble_m').textContent = `${p.q_cobble_area.toFixed(2)} M²/m (${p.q_cobble_vol.toFixed(2)}M³)`;
      document.getElementById('stat_excav_m').textContent = `${p.q_excav_vol.toFixed(2)} M³/m`;
      document.getElementById('stat_soil_m').textContent = `${p.q_compact_area.toFixed(2)} M² / ${p.q_topsoil_vol.toFixed(2)} M³`;
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

      if (currentView === 'SECTIONS') {
        const bSec = drawBothCrossSections(ctx, 40, 12, p, pal);
        drawExplicitFormulaTableOnCanvas(ctx, 40, bSec.bottomY + 42, p, pal);
      } else if (currentView === 'PLAN_PROF') {
        const bPP = drawPlanAndLongitudinalViews(ctx, 50, 12, p, pal);
        drawExplicitFormulaTableOnCanvas(ctx, 45, bPP.bottomY + 42, p, pal);
      } else {
        // 'ALL' Full Standard Sheet Layout (Matching A3 Layout 5-06 of DXF):
        // - Left Column: 草溝斷面圖 (Top) + 複式草溝斷面圖 (Bottom, 1:1 Vertically Aligned) + 符號說明 (W, H)
        // - Right Column: 自動補齊之俯視平面圖 (Top) + 縱斷面展開圖 (Bottom, 1:1 Vertically Aligned)
        // - Bottom Full-Width: 圖面標註數字顯式計算式表
        const bSec = drawBothCrossSections(ctx, 20, 10, p, pal);
        const rightColX = bSec.rightX + 25;
        const bPP = drawPlanAndLongitudinalViews(ctx, rightColX, 10, p, pal);

        const tableY = Math.max(bSec.bottomY, bPP.bottomY) + 42;
        drawExplicitFormulaTableOnCanvas(ctx, 35, tableY, p, pal);
      }

      ctx.restore();
    }

    // =========================================================================
    // 8. UI CONTROLS, AUTO-SYNC & DXF / CSV EXPORTERS
    // =========================================================================
    function stepCount(inputId, delta, callbackFn) {
      const el = document.getElementById(inputId);
      if (!el) return;
      const minV = parseFloat(el.min) || 3;
      const maxV = parseFloat(el.max) || 21;
      const curV = Math.round(parseFloat(el.value) || minV);
      el.value = Math.max(minV, Math.min(maxV, curV + delta));
      if (typeof callbackFn === 'function') callbackFn();
    }

    function onCobbleCountInput() {
      const nCob = Math.max(5, Math.min(21, Math.round(parseFloat(document.getElementById('inp_N_cob').value) || 9)));
      const wCm = parseFloat(document.getElementById('inp_W_cm').value) || 140;
      if (nCob * 10 > wCm - 20) {
        document.getElementById('inp_W_cm').value = nCob * 10 + 30;
      }
      renderAll();
    }

    function onGeomChange() {
      renderAll();
    }

    function resetToOrig() {
      Object.keys(ORIG_GRASSED_WATERWAY).forEach(k => {
        const el = document.getElementById('inp_' + k);
        if (el) el.value = ORIG_GRASSED_WATERWAY[k];
      });
      renderAll();
    }

    function switchView(view) {
      currentView = view;
      const specEl = document.getElementById('specPanel');
      const tabs = {
        ALL: document.getElementById('tab-all'),
        SECTIONS: document.getElementById('tab-sec'),
        PLAN_PROF: document.getElementById('tab-plan-prof'),
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
      if (currentView === 'SECTIONS') {
        viewCam.scale = Math.min(rect.width / 1040, rect.height / 920) * 0.93;
        viewCam.offsetX = Math.max(25, (rect.width - 980 * viewCam.scale) / 2);
        viewCam.offsetY = 14;
      } else if (currentView === 'PLAN_PROF') {
        viewCam.scale = Math.min(rect.width / 1040, rect.height / 880) * 0.93;
        viewCam.offsetX = Math.max(25, (rect.width - 980 * viewCam.scale) / 2);
        viewCam.offsetY = 14;
      } else {
        viewCam.scale = Math.min(rect.width / 1340, rect.height / 980) * 0.94;
        viewCam.offsetX = Math.max(20, (rect.width - 1280 * viewCam.scale) / 2);
        viewCam.offsetY = 12;
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
      a.download = `草溝及複式草溝標準圖_0506-1_W${p.W_cm}_H${p.H_cm}cm_含補齊平縱面.dxf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }

    function exportCSV() {
      const p = getParams();
      const rows = [
        [`草溝及複式草溝標準圖 (圖號 0506-1 / 060・溝頂寬W=${p.W_cm}cm・水深H=${p.H_cm}cm・複式卵石橫向${p.N_cob}顆) - 圖面標註數字顯式列式數量計算書`],
        ['工程項目名稱', '採用圖面標註數字之顯式計算式 (每公尺基準)', '每公尺數量', `全段數量(${p.L_tot_m}m)`, '單位'],
        [`一般草溝：百喜草/類地毯草鋪植 (重疊${p.sod_lap_cm}cm)`, `'${p.formula_grass_std}`, p.q_grass_std.toFixed(2), (p.q_grass_std * p.L_tot_m).toFixed(1), 'M²'],
        [`複式草溝：溝底鋪卵石面積 (長徑D5~${p.D_cob_cm}cm, 埋入1/2)`, `'${p.formula_cobble_area}`, p.q_cobble_area.toFixed(2), (p.q_cobble_area * p.L_tot_m).toFixed(1), 'M²'],
        [`複式草溝：溝底卵石體積 (橫向${p.N_cob}顆, D=${p.D_cob_cm}cm)`, `'${p.formula_cobble_vol}`, p.q_cobble_vol.toFixed(2), (p.q_cobble_vol * p.L_tot_m).toFixed(2), 'M³'],
        ['複式草溝：兩側溝坡植草面積 (扣除中央卵石帶)', `'${p.formula_grass_comp}`, p.q_grass_comp.toFixed(2), (p.q_grass_comp * p.L_tot_m).toFixed(1), 'M²'],
        [`淺寬拋物線草溝挖掘土方 (W=${p.W_cm}cm, H=${p.H_cm}cm)`, `'${p.formula_excav_vol}`, p.q_excav_vol.toFixed(2), (p.q_excav_vol * p.L_tot_m).toFixed(2), 'M³'],
        [`鋤鬆種植面與客入良好表土 (厚${p.t_soil_cm}cm, 植溝@10~20cm)`, `'${p.formula_topsoil_vol}`, p.q_topsoil_vol.toFixed(2), (p.q_topsoil_vol * p.L_tot_m).toFixed(2), 'M³'],
        ['底土土壤壓實 (壓實度應達 80% 以上為原則)', `'${p.formula_compact_area}`, p.q_compact_area.toFixed(2), (p.q_compact_area * p.L_tot_m).toFixed(1), 'M²']
      ];

      const csvContent = '\uFEFF' + rows.map(r => r.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `草溝及複式草溝顯式列式計算書_0506-1_W${p.W_cm}xH${p.H_cm}.csv`;
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

  const STRIP = s => String(s).replace(/\s*[（(]\s*圖號[^）)]*[）)]/g, '').replace(/\s*[（(]\s*\d{4}-\d\s*[/／]\s*\d{3}\s*[）)]/g, '').replace(/\s*圖號\s*[：:]?\s*[0-9A-Za-z#\-／/ ]+/g, ' ');
  function params(R) { Object.keys(R || {}).forEach(k => { el('inp_' + k).value = String(R[k]); }); return getParams(); }
  function run(R, OV) {
    O = []; const PAL = getPalette(), p = params(R); Object.assign(p, R || {}, OV || {});
    const bSec = drawBothCrossSections(CTX, 20, 10, p, PAL), bPP = drawPlanAndLongitudinalViews(CTX, bSec.rightX + 25, 10, p, PAL); drawExplicitFormulaTableOnCanvas(CTX, 35, Math.max(bSec.bottomY, bPP.bottomY) + 42, p, PAL);
    
    const sc = 1 / 1.95; return O.map(o => { const r = Object.assign({}, o); if (r.p) r.p = r.p.map(([x, y]) => [x * sc, y * sc]); if (r.x !== undefined) { r.x *= sc; r.y *= sc; } if (r.r) r.r *= sc; if (r.h) r.h *= sc; if (r.s !== undefined && r.k === 'T') r.s = STRIP(r.s); return r; });
  }
  return { run, params };
})();
TCO_D['wave'] = (function () {
  let O = [];
  const EL = {}, CTX = new Proxy({}, { get: (t, k) => (k in t ? t[k] : () => ({ width: 0 })), set: (t, k, v) => { t[k] = v; return true; } });
  const el = id => EL[id] || (EL[id] = { value: '', textContent: '', innerHTML: '', className: '', style: {}, classList: { add() {}, remove() {}, toggle() {} }, addEventListener() {}, getContext: () => CTX, parentElement: { getBoundingClientRect: () => ({ width: 100, height: 100 }) } });
  const document = { getElementById: el, querySelectorAll: () => [], querySelector: () => null, createElement: () => ({ click() {}, style: {} }), body: { appendChild() {}, removeChild() {}, classList: { add() {}, remove() {}, toggle() {}, contains: () => false } }, documentElement: { classList: { contains: () => false, add() {}, remove() {}, toggle() {} } }, addEventListener() {} };
  const window = { addEventListener() {}, devicePixelRatio: 1, matchMedia: () => ({ matches: false, addEventListener() {} }) };

    // =========================================================================
    // 1. ORIGINAL DXF BASELINE CONSTANTS & GLOBAL STATE (PURE ASCII IDENTIFIERS)
    // =========================================================================
    const ORIG_CORRUGATED_DITCH = {
      W_cm: 90,
      H_cm: 100,
      R_cm: 15,
      t_mm: 1.6,
      L_unit_cm: 100,
      S_strut_cm: 100,
      N_waves: 10,
      w_gravel_cm: 20,
      L_tot_m: 30.0
    };

    let currentView = 'ALL'; // 'ALL', 'SEC_DETAILS', 'SIDE_PLAN', 'SPEC'
    let showGhost = false;
    let isDarkTheme = true;

    let viewCam = {
      scale: 0.66,
      offsetX: 22,
      offsetY: 12,
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

      const W_cm = Math.max(50, Math.min(200, Math.round(num('inp_W_cm', 90))));
      const H_cm = Math.max(50, Math.min(200, Math.round(num('inp_H_cm', 100))));
      const R_cm = Math.max(8, Math.min(Math.floor(Math.min(W_cm, H_cm) * 0.35), Math.round(num('inp_R_cm', 15))));
      const t_mm = Math.max(1.2, Math.min(4.0, +num('inp_t_mm', 1.6).toFixed(1)));
      const L_unit_cm = Math.max(80, Math.min(200, Math.round(num('inp_L_unit_cm', 100))));
      const S_strut_cm = Math.max(50, Math.min(200, Math.round(num('inp_S_strut_cm', 100))));
      const N_waves = Math.max(6, Math.min(16, Math.round(num('inp_N_waves', 10))));
      const w_gravel_cm = Math.max(10, Math.min(50, Math.round(num('inp_w_gravel_cm', 20))));
      const L_tot_m = Math.max(5.0, Math.min(200.0, num('inp_L_tot_m', 30.0)));

      const p = {
        W_cm,
        H_cm,
        R_cm,
        t_mm,
        L_unit_cm,
        S_strut_cm,
        N_waves,
        w_gravel_cm,
        L_tot_m
      };

      const W_m = +(W_cm / 100).toFixed(2);
      const H_m = +(H_cm / 100).toFixed(2);
      const R_m = +(R_cm / 100).toFixed(2);
      const Lunit_m = +(L_unit_cm / 100).toFixed(2);
      const Sstrut_m = +(S_strut_cm / 100).toFixed(2);
      const wgrv_m = +(w_gravel_cm / 100).toFixed(2);

      // 1. U型浪型鋼板溝斷面展開周長 P_unwrap_m:
      // 兩側直立牆 2*(H_m - R_m) + 溝底平段 (W_m - 2*R_m) + 2處90°圓弧 (π * R_m) + 兩側頂緣折邊 (2 * 0.05m)
      const sideVert_m = +(H_m - R_m).toFixed(2);
      const botFlat_m = +(W_m - 2 * R_m).toFixed(2);
      const arcLen_m = +(Math.PI * R_m).toFixed(2);
      p.P_unwrap_m = +(2 * sideVert_m + botFlat_m + arcLen_m + 0.07).toFixed(2);

      // 2. 浪型鋼板厚=1.6mm (鍍鋅量至少400g/m²) 鋪設面積 (M²/m):
      // 含單元搭接係數 (L + 3.8cm) / L ≈ 1.038
      const lapRatio = +((L_unit_cm + 3.8) / L_unit_cm).toFixed(3);
      p.q_plate_area = +(p.P_unwrap_m * lapRatio).toFixed(2);
      p.formula_plate_area = `[2側直牆2*(${H_m.toFixed(2)}-${R_m.toFixed(2)}) + 底平段(${W_m.toFixed(2)}-2*${R_m.toFixed(2)}) + 圓弧(π*${R_m.toFixed(2)}) + 折邊0.07 = ${p.P_unwrap_m.toFixed(2)}m] * 搭接(${L_unit_cm}+3.8)/${L_unit_cm}`;

      // 3. 角鋼架與橫支柱 (L:50x50x4mm，單位重 3.06 kg/m，鍍鋅量>400g/m²) 重量 (kg/m):
      // - 兩側縱向壓頂角鋼 (2 支 × 1.00m = 2.00 m/m)
      // - 頂部橫支柱 (每隔 S_strut_cm 1支，單支長 W_m + 0.10m)
      // - 單元搭接處 U型角鋼架 (每隔 L_unit_cm 1組，單組周長 P_unwrap_m)
      const unitWtL50 = 3.06;
      const topRailLen_m = 2.00;
      const strutLenPerM = +((W_m + 0.10) * (100 / S_strut_cm)).toFixed(2);
      const frameLenPerM = +(p.P_unwrap_m * (100 / L_unit_cm)).toFixed(2);
      p.L_angle_tot_m = +(topRailLen_m + strutLenPerM + frameLenPerM).toFixed(2);
      p.q_angle_wt = +(p.L_angle_tot_m * unitWtL50).toFixed(2);
      p.formula_angle_wt = `[縱向壓頂角鋼(2.00m) + 橫支柱((${W_m.toFixed(2)}+0.10)*100/${S_strut_cm}=${strutLenPerM.toFixed(2)}m) + 搭接角鋼架(${p.P_unwrap_m.toFixed(2)}*100/${L_unit_cm}=${frameLenPerM.toFixed(2)}m)] * 3.06kg/m`;

      // 4. 鍍鋅螺栓與墊片:1*50(mm) (鍍鋅量>350g/m²) (組/m):
      // 每個橫支柱兩端各 2 組螺栓 (4組) + 每個搭接角鋼架 5 組螺栓
      p.q_bolt_sets = +(4 * (100 / S_strut_cm) + 5 * (100 / L_unit_cm)).toFixed(1);
      p.formula_bolt_sets = `[橫支柱端頭螺栓 4組*(100/${S_strut_cm}cm)] + [角鋼架搭接螺栓及墊片1*50mm 5組*(100/${L_unit_cm}cm)]`;

      // 5. 兩側回填碎石級配夯實 (注意事項1：兩側需回填碎石級配夯實) (M³/m):
      p.q_gravel_vol = +(2 * wgrv_m * H_m * 1.0).toFixed(2);
      p.formula_gravel_vol = `左右2側 * 回填寬(${wgrv_m.toFixed(2)}m) * 溝深H(${H_m.toFixed(2)}m) * 1.00m`;

      // 6. 小型機械開挖並夯實兩側溝壁及底部 (注意事項5) (M²/m):
      p.q_compact_area = +((2 * H_m + W_m + 2 * wgrv_m) * 1.0).toFixed(2);
      p.formula_compact_area = `[兩側溝壁(2*${H_m.toFixed(2)}m) + 溝底及碎石底寬(${W_m.toFixed(2)} + 2*${wgrv_m.toFixed(2)}m)] * 1.00m`;

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
          steelPlate: '#facc15',
          angleFrame: '#38bdf8',
          angleHatch: '#64748b',
          boltColor: '#e879f9',
          centerLine: '#f43f5e',
          dimLine: '#22d3ee',
          dimText: '#67e8f9',
          leaderLine: '#22d3ee',
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
          steelPlate: '#b45309',
          angleFrame: '#0369a1',
          angleHatch: '#64748b',
          boltColor: '#a21caf',
          centerLine: '#e11d48',
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

    function cadCircle(ctx, cx, cy, r, color, width = 1.25, fill = null, dash = [], layer = '0') {
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

    function cadLeaderArrow(ctx, tx, ty, kx, ky, ex, ey, lines, pal, fontSize = 11.0, useDot = false) {
      cadLine(ctx, tx, ty, kx, ky, pal.leaderLine, 1.15, [], 'LEADER');
      if (Math.hypot(ex - kx, ey - ky) > 1) {
        cadLine(ctx, kx, ky, ex, ey, pal.leaderLine, 1.15, [], 'LEADER');
      }

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
        ctx.lineTo(tx - ux * 7.2 + nx * 2.2, ty - uy * 7.2 + ny * 2.2);
        ctx.lineTo(tx - ux * 7.2 - nx * 2.2, ty - uy * 7.2 - ny * 2.2);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }

      const align = ex >= kx ? 'left' : 'right';
      const pad = ex >= kx ? 6 : -6;
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
      const gap = 4.0;
      const extOver = 4.5;

      const sx1 = x1 + nx * gap, sy1 = y1 + ny * gap;
      const ex1 = x1 + nx * (absOff + extOver), ey1 = y1 + ny * (absOff + extOver);
      const sx2 = x2 + nx * gap, sy2 = y2 + ny * gap;
      const ex2 = x2 + nx * (absOff + extOver), ey2 = y2 + ny * (absOff + extOver);

      const dx1 = x1 + nx * absOff, dy1 = y1 + ny * absOff;
      const dx2 = x2 + nx * absOff, dy2 = y2 + ny * absOff;

      if (absOff > 3) {
        cadLine(ctx, sx1, sy1, ex1, ey1, pal.dimLine, 0.9, [], 'DIM');
        cadLine(ctx, sx2, sy2, ex2, ey2, pal.dimLine, 0.9, [], 'DIM');
      }

      const mx = (dx1 + dx2) / 2, my = (dy1 + dy2) / 2;
      const textGap = Math.max(String(labelStr).length * fontSize * 0.60 + 6, 18);

      if (L > textGap + 10) {
        cadLine(ctx, dx1, dy1, mx - ux * (textGap / 2), my - uy * (textGap / 2), pal.dimLine, 1.0, [], 'DIM');
        cadLine(ctx, mx + ux * (textGap / 2), my + uy * (textGap / 2), dx2, dy2, pal.dimLine, 1.0, [], 'DIM');
      } else {
        cadLine(ctx, dx1, dy1, dx2, dy2, pal.dimLine, 1.0, [], 'DIM');
      }

      const aL = Math.min(5.5, L * 0.25), aW = 1.8;
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

    // Helper: Draw Subgrade Compaction Hatch `B002` (matching DXF block `10F79 / 11834`)
    function drawSubgradeHatchBlock(ctx, x, y, pal) {
      for (let g = 0; g < 3; g++) {
        const gx = x + g * 10;
        for (let k = 0; k < 3; k++) {
          cadLine(ctx, gx + k * 2.8, y, gx + k * 2.8 - 4.2, y + 4.8, pal.angleHatch, 1.0, [], 'B002_HATCH');
          cadLine(ctx, gx + 4.5 + k * 2.5, y + 4.8, gx + 7.5 + k * 2.5, y + 1.5, pal.angleHatch, 1.0, [], 'B002_HATCH');
        }
      }
    }

    // Helper: Draw Bolt Cross-hair Circle `⊕` (matching DXF `11C29..11CB8`)
    function drawBoltSymbol(ctx, cx, cy, r, pal) {
      cadCircle(ctx, cx, cy, r, pal.boltColor, 1.15, null, [], 'BOLT_CIRCLE');
      cadLine(ctx, cx - r * 1.35, cy, cx + r * 1.35, cy, pal.dimLine, 0.9, [2, 1.5], 'BOLT_CROSS');
      cadLine(ctx, cx, cy - r * 1.35, cx, cy + r * 1.35, pal.dimLine, 0.9, [2, 1.5], 'BOLT_CROSS');
    }

    // Helper: Draw Z-Break Line (matching DXF `11AFC, 11EAE, 11EAF, 11D11, 11D12`)
    function drawBreakLine(ctx, x1, y1, x2, y2, pal) {
      const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
      const dx = x2 - x1, dy = y2 - y1;
      const L = Math.hypot(dx, dy) || 1;
      const ux = dx / L, uy = dy / L;
      const nx = -uy, ny = ux;
      const zS = 4.8, zA = 4.5;
      cadPoly(ctx, [
        [x1, y1],
        [mx - ux * zS, my - uy * zS],
        [mx - ux * (zS * 0.35) + nx * zA, my - uy * (zS * 0.35) + ny * zA],
        [mx + ux * (zS * 0.35) - nx * zA, my + uy * (zS * 0.35) - ny * zA],
        [mx + ux * zS, my + uy * zSpan(zS)],
        [x2, y2]
      ], pal.dimLine, 1.1, false, null, [], 'BREAK_LINE');
      function zSpan(v) { return v; }
    }

    // Helper: Sample U-Shaped Ditch with Rounded Bottom Corners (matching DXF `117AE` & `117B6` with bulge = -0.41421356 = 90° arc!)
    function getUShapePoints(cx, yTop, W_px, H_px, R_px) {
      const xL = cx - W_px / 2;
      const xR = cx + W_px / 2;
      const yBot = yTop + H_px;
      const r = Math.min(R_px, W_px * 0.42, H_px * 0.42);

      const pts = [];
      // Left top to left arc start
      pts.push([xL, yTop], [xL, yBot - r]);
      // Bottom-left 90-degree arc (center at xL + r, yBot - r)
      const nArc = 10;
      for (let i = 1; i <= nArc; i++) {
        const ang = Math.PI - (i / nArc) * (Math.PI / 2);
        pts.push([
          (xL + r) + Math.cos(ang) * r,
          (yBot - r) + Math.sin(ang) * r
        ]);
      }
      // Bottom-right 90-degree arc (center at xR - r, yBot - r)
      for (let i = 0; i <= nArc; i++) {
        const ang = (Math.PI / 2) - (i / nArc) * (Math.PI / 2);
        pts.push([
          (xR - r) + Math.cos(ang) * r,
          (yBot - r) + Math.sin(ang) * r
        ]);
      }
      // Right arc end to right top
      pts.push([xR, yTop]);
      return pts;
    }

    // =========================================================================
    // 4. VIEW 1: 原圖【斷面圖】 (CROSS-SECTION VIEW - Viewport 2 `9AA1`)
    //    100% Faithful to DXF Entities `117AE..11AED`:
    //    - Natural terrain lines `1297F` & `12981` and bank hatches `129A5/129A6` are 100% STRIPPED!
    //    - Inner U-channel (`117AE`) & Outer U-frame (`117B6`) with bottom corner radius R = 15cm
    //    - Top Left & Right L-Angle Brackets (`117BE` & `117C1`, ANSI34 hatch `117BF` & `117C0`)
    //    - Top Horizontal Cross-Strut (`117C2` & `117C3`: 橫支柱 L:50x50x4mm)
    //    - Dashed Detail Circle (`11AEB`) at top-left corner pointing to "詳圖B" (`11AED`)
    //    - Dimensions `*D4` (W) and `*D5` (H), plus Symbol Legend Box (`12B36`: W 溝寬 / H 溝深 / L 浪型鋼板單元長度)
    // =========================================================================
    function drawCrossSectionView(ctx, ox, topY, p, pal) {
      const s = 1.65; // Scale: 1 cm = 1.65 px
      const W = p.W_cm * s;
      const H = p.H_cm * s;
      const R = p.R_cm * s;
      const frameThick = 3.6; // Visual thickness between inner plate `117AE` & outer angle frame `117B6`

      const cx = ox + 215;
      const yTop = topY + 66;
      const yBot = yTop + H;
      const xInL = cx - W / 2;
      const xInR = cx + W / 2;
      const xOutL = xInL - frameThick;
      const xOutR = xInR + frameThick;

      // 0) Ghost Baseline (Original W=90, H=100, R=15)
      if (showGhost) {
        const gPts = getUShapePoints(cx, yTop, 90 * s, 100 * s, 15 * s);
        cadPoly(ctx, gPts, pal.ghostLine, 1.1, false, null, [4, 4], 'GHOST_SEC');
      }

      // 1) Inner Corrugated Steel Plate U-Profile (`117AE`) & Outer Angle Frame U-Profile (`117B6`)
      const innerUPts = getUShapePoints(cx, yTop, W, H, R);
      const outerUPts = getUShapePoints(cx, yTop, W + 2 * frameThick, H + frameThick, R + frameThick);

      const fullUChannelPoly = [...innerUPts, ...outerUPts.slice().reverse()];
      cadPoly(ctx, fullUChannelPoly, pal.primaryLine, 1.55, true, 'rgba(56, 189, 248, 0.16)', [], 'U_CHANNEL_BODY');
      cadPoly(ctx, innerUPts, pal.steelPlate, 1.75, false, null, [], 'CORR_STEEL_PLATE');

      // 2) Top Horizontal Cross-Strut (`117C2` & `117C3`: 橫支柱 L:50x50x4mm)
      const strutH = 11.5;
      cadPoly(ctx, [
        [xInL + 2.5, yTop - 2.5],
        [xInR - 2.5, yTop - 2.5],
        [xInR - 2.5, yTop - 2.5 + strutH],
        [xInL + 2.5, yTop - 2.5 + strutH]
      ], pal.primaryLine, 1.4, true, 'rgba(30, 41, 59, 0.75)', [], 'TOP_CROSS_STRUT');

      // 3) Top-Left & Top-Right L-Angle Brackets (`117BE` & `117C1`, with ANSI34 hatch `117BF/117C0`)
      const earOutW = 11.5;
      const earTopT = 3.0;
      const leftAnglePts = [
        [xInL, yTop + strutH - 2.5],
        [xInL, yTop],
        [xInL - earOutW, yTop],
        [xInL - earOutW, yTop - earTopT],
        [xInL + 2.5, yTop - earTopT],
        [xInL + 2.5, yTop + strutH - 2.5]
      ];
      const rightAnglePts = [
        [xInR, yTop + strutH - 2.5],
        [xInR, yTop],
        [xInR + earOutW, yTop],
        [xInR + earOutW, yTop - earTopT],
        [xInR - 2.5, yTop - earTopT],
        [xInR - 2.5, yTop + strutH - 2.5]
      ];
      cadPoly(ctx, leftAnglePts, pal.angleFrame, 1.4, true, 'rgba(148, 163, 184, 0.35)', [], 'ANGLE_BRACKET_L');
      cadPoly(ctx, rightAnglePts, pal.angleFrame, 1.4, true, 'rgba(148, 163, 184, 0.35)', [], 'ANGLE_BRACKET_R');

      // 4) Bottom Subgrade Compaction Hatch (`11834` B002 at bottom center of U-ditch)
      drawSubgradeHatchBlock(ctx, cx - 14, yBot + frameThick + 1, pal);

      // 5) Dashed Detail Circle (`11AEB`) at Top-Left Corner + Callout "詳圖B" (`11AEC` & `11AED`)
      cadCircle(ctx, xInL - 2, yTop + 3, 17, pal.dimLine, 1.25, null, [5, 3], 'DETAIL_B_CIRCLE');
      cadLeaderArrow(
        ctx,
        xInL - 12, yTop - 10,
        xInL - 32, yTop - 32,
        xInL - 46, yTop - 32,
        ['詳圖B'],
        pal, 11.5, false
      );

      // 6) Dimensions `*D4` (W) & `*D5` (H):
      cadDim(ctx, xInL, yTop - earTopT, xInR, yTop - earTopT, -24, `W (${p.W_cm}cm)`, pal, 11.5);
      cadDim(ctx, xOutL, yTop - earTopT, xOutL, yBot, -34, `H (${p.H_cm}cm)`, pal, 11.5);

      // 7) All 3 Right-Side Callouts on Cross-Section (`11843/11846`, `11848/11849`, `1184B/1184C`):
      // (a) Top-Right: 橫支柱 (L:50x50x4mm)
      cadLeaderArrow(
        ctx,
        xInR - 18, yTop - 2.5,
        xOutR + 20, yTop - 34,
        xOutR + 34, yTop - 34,
        ['橫支柱', '(L:50x50x4mm)'],
        pal, 11.0, false
      );

      // (b) Middle-Right: 角鋼架 (L:50x50x4mm)
      cadLeaderArrow(
        ctx,
        xOutR, yTop + 4,
        xOutR + 24, yTop + 32,
        xOutR + 36, yTop + 32,
        ['角鋼架', '(L:50x50x4mm)'],
        pal, 11.0, false
      );

      // (c) Lower-Right: 浪型鋼板厚=1.6mm (鍍鋅量至少400g/m²)
      cadLeaderArrow(
        ctx,
        xOutR, yTop + H * 0.68,
        xOutR + 22, yTop + H * 0.52,
        xOutR + 34, yTop + H * 0.52,
        [`浪型鋼板厚=${p.t_mm}mm`, '(鍍鋅量至少400g/m²)'],
        pal, 11.0, false
      );

      // Section Title (`F7C0, F7C5, F7C6`): 斷面圖
      const secTitleY = yBot + 36;
      cadText(ctx, '斷面圖 (浪型鋼板溝)', cx, secTitleY, 15.5, pal.titleCyan, 'center', '700');
      cadLine(ctx, cx - 72, secTitleY + 9, cx + 72, secTitleY + 9, pal.titleCyan, 1.4);
      cadLine(ctx, cx - 72, secTitleY + 12.5, cx + 72, secTitleY + 12.5, pal.titleCyan, 1.0);

      // 8) Symbol Legend Box (`12B36`: 符號說明：W 溝寬 / H 溝深 / L 浪型鋼板單元長度)
      const legX = ox + 15;
      const legY = secTitleY + 26;
      const legW = 240;
      const legH = 88;
      cadPoly(ctx, [
        [legX, legY],
        [legX + legW, legY],
        [legX + legW, legY + legH],
        [legX, legY + legH]
      ], pal.tableBorder, 1.15, true, 'rgba(15, 23, 42, 0.88)', [], 'SYMBOL_LEGEND_12B36');
      cadText(ctx, '符號說明：', legX + 12, legY + 16, 11.5, pal.titleCyan, 'left', '700');
      cadText(ctx, `W   溝寬 (${p.W_cm} cm)`, legX + 16, legY + 36, 10.6, pal.textMain, 'left', '600');
      cadText(ctx, `H   溝深 (${p.H_cm} cm)`, legX + 16, legY + 55, 10.6, pal.textMain, 'left', '600');
      cadText(ctx, `L   浪型鋼板單元長度 (${p.L_unit_cm} cm)`, legX + 16, legY + 74, 10.6, pal.textMain, 'left', '600');

      // Unit Note (`12531` block `A$C297F2ADA`): 註:標示單位除另有註明外，均以cm為單位。
      cadText(ctx, '註：標示單位除另有註明外，均以cm為單位。', legX + 2, legY + legH + 18, 11, pal.titleCyan, 'left', '600');

      return {
        rightX: xOutR + 175,
        bottomY: legY + legH + 30
      };
    }

    // =========================================================================
    // 5. VIEW 2 & 3: 詳圖A (搭接角鋼座詳圖 `124F7`) & 詳圖B (轉角鎖固詳圖 `1250B`)
    //    100% Faithful to DXF Entities `11EA0..12503` (Detail A) & `11AFB..12469` (Detail B)
    // =========================================================================
    function drawDetailAAndDetailB(ctx, ox, topY, p, pal) {
      // =====================================================================
      // PART A: 詳圖A (TOP-RIGHT - Upstream/Downstream Lap Joint Detail `124F7`)
      //         Exact match to DXF `11EA0..11F45`, `*D15` (5.8), `*D16` (2.9), `*D17` (2.9)
      // =====================================================================
      const ax0 = ox + 110;
      const ay0 = topY + 64;
      const sA = 4.2; // Magnified scale for Detail A (5.8cm -> ~122px)

      const xJointL = ax0;
      const xJointMid = ax0 + 2.9 * sA * 5; // 2.9cm * scale
      const xJointR = ax0 + 5.8 * sA * 5;   // 5.8cm * scale

      const yTopPlate = ay0;
      const yMidPlate = ay0 + 9;
      const yBotPlate = ay0 + 18;
      const yLegBot = ay0 + 115;

      // 1) Upstream Steel Plate (`上游鋼板溝` on left) & Downstream Steel Plate (`下游鋼板溝` on right)
      cadPoly(ctx, [
        [xJointL - 55, yTopPlate],
        [xJointR, yTopPlate],
        [xJointR, yMidPlate],
        [xJointL - 55, yMidPlate]
      ], pal.primaryLine, 1.45, true, 'rgba(56, 189, 248, 0.16)', [], 'DET_A_UP_PLATE');

      cadPoly(ctx, [
        [xJointL, yMidPlate],
        [xJointR + 24, yMidPlate],
        [xJointR + 24, yBotPlate],
        [xJointL, yBotPlate]
      ], pal.steelPlate, 1.45, true, 'rgba(250, 204, 21, 0.15)', [], 'DET_A_DOWN_PLATE');

      // 2) L-Shaped Cross-Strut & Angle Frame Section (`11EA0` with ANSI34 hatch `12558`)
      const xLegL = xJointL + 7;
      const xLegR = xJointL + 16;
      const lAngleAPts = [
        [xLegL, yBotPlate],
        [xJointR - 10, yBotPlate],
        [xJointR - 10, yBotPlate + 9],
        [xLegR, yBotPlate + 9],
        [xLegR, yLegBot],
        [xLegL, yLegBot]
      ];
      cadPoly(ctx, lAngleAPts, pal.angleFrame, 1.5, true, 'rgba(148, 163, 184, 0.35)', [], 'DET_A_ANGLE');

      // 3) Bolt Assembly through the Lap Joint (`11EA1..11EA4`, `11F3F`) & Double-Circle Weld/Rivet (`11F34/11F35`)
      const bW = 11;
      cadPoly(ctx, [[xJointMid - bW, yTopPlate - 10], [xJointMid + bW, yTopPlate - 10], [xJointMid + bW, yTopPlate], [xJointMid - bW, yTopPlate]], pal.primaryLine, 1.25, true, '#1e293b', [], 'DET_A_BOLT_TOP');
      cadPoly(ctx, [[xJointMid - bW, yBotPlate], [xJointMid + bW, yBotPlate], [xJointMid + bW, yBotPlate + 14], [xJointMid - bW, yBotPlate + 14]], pal.primaryLine, 1.25, true, '#1e293b', [], 'DET_A_BOLT_BOT');
      cadLine(ctx, xJointMid, yTopPlate - 14, xJointMid, yBotPlate + 18, pal.centerLine, 1.1, [6, 3], 'DET_A_BOLT_CL');

      // Double concentric circle (`11F34` & `11F35`) below the bolt
      cadCircle(ctx, xJointMid, yBotPlate + 52, 10.5, pal.steelPlate, 1.3);
      cadCircle(ctx, xJointMid, yBotPlate + 52, 7.2, pal.steelPlate, 1.1);

      // Left & Right Vertical Z-Break Lines (`11EAE` & `11EAF`)
      drawBreakLine(ctx, xJointL - 55, yTopPlate - 12, xJointL - 55, yLegBot - 8, pal);
      drawBreakLine(ctx, xJointR + 24, yTopPlate - 12, xJointR + 24, yLegBot - 8, pal);

      // 4) Dimensions on Detail A (`*D15` 5,8 and `*D16` 2,9 | `*D17` 2,9):
      cadDim(ctx, xJointL, yTopPlate, xJointMid, yTopPlate, -22, '2,9', pal, 10.8);
      cadDim(ctx, xJointMid, yTopPlate, xJointR, yTopPlate, -22, '2,9', pal, 10.8);
      cadDim(ctx, xJointL, yTopPlate, xJointR, yTopPlate, -44, '5,8', pal, 11.2);

      // 5) All 5 Callouts on Detail A (`12098..12502`):
      // Top-Left: 上游角鋼架 (L:50x50x4mm)
      cadLeaderArrow(ctx, xJointL - 25, yTopPlate + 4, xJointL - 42, yTopPlate - 32, xJointL - 56, yTopPlate - 32, ['上游角鋼架', '(L:50x50x4mm)'], pal, 10.5, false);
      // Bottom-Left: 上游鋼板溝 (with dot)
      cadLeaderArrow(ctx, xJointL - 22, yLegBot - 15, xJointL - 42, yLegBot + 12, xJointL - 56, yLegBot + 12, ['上游鋼板溝'], pal, 10.5, true);
      // Top-Right: 橫支柱(L:50x50x4mm)
      cadLeaderArrow(ctx, xJointR - 12, yBotPlate + 4, xJointR + 30, yTopPlate - 22, xJointR + 44, yTopPlate - 22, ['橫支柱(L:50x50x4mm)'], pal, 10.5, false);
      // Middle-Right: 下游角鋼架(L:50x50x4mm)
      cadLeaderArrow(ctx, xJointR + 10, yMidPlate + 4, xJointR + 30, yMidPlate + 22, xJointR + 44, yMidPlate + 22, ['下游角鋼架(L:50x50x4mm)'], pal, 10.5, false);
      // Bottom-Right: 下游鋼板溝 (with dot)
      cadLeaderArrow(ctx, xJointR - 6, yLegBot - 15, xJointR + 30, yLegBot + 12, xJointR + 44, yLegBot + 12, ['下游鋼板溝'], pal, 10.5, true);

      const titleAY = yLegBot + 36;
      const cxA = (xJointL + xJointR) / 2;
      cadText(ctx, '詳圖A', cxA, titleAY, 15.5, pal.titleCyan, 'center', '700');
      cadLine(ctx, cxA - 32, titleAY + 9, cxA + 32, titleAY + 9, pal.titleCyan, 1.4);
      cadLine(ctx, cxA - 32, titleAY + 12.5, cxA + 32, titleAY + 12.5, pal.titleCyan, 1.0);

      // =====================================================================
      // PART B: 詳圖B (BOTTOM-RIGHT - Top Corner L50x50x4 Bolted Joint `1250B`)
      //         Exact match to DXF `11AFB..11BF1`, `*D6` (2), `*D7` (3), `*D8` (3,5), `*D18` (1,5)
      // =====================================================================
      const bx0 = ox + 95;
      const by0 = titleAY + 82;
      const sB = 3.8; // Magnified scale for Detail B (1cm = 3.8*5 = 19px)
      const uCm = 4.2 * sB; // ~16px per cm

      const xB_left = bx0;
      const xB_bolt1 = bx0 + 2.0 * uCm;     // 2 cm (`*D6`)
      const xB_corner = bx0 + 5.0 * uCm;    // 2 + 3 = 5 cm (`*D7`)
      const xB_rightBreak = bx0 + 9.5 * uCm;

      const yB_top = by0;
      const yB_bolt2 = by0 + 3.5 * uCm;     // 3,5 cm (`*D8`)
      const yB_strutBot = by0 + 5.0 * uCm;  // 3.5 + 1.5 = 5.0 cm (`*D18`)
      const yB_bot = by0 + 9.8 * uCm;

      // 1) Top Horizontal Strut Leg (`11AFB` & `11B0D`: 橫支柱 L:50x50x4)
      cadPoly(ctx, [
        [xB_left, yB_top - 4],
        [xB_rightBreak, yB_top - 4],
        [xB_rightBreak, yB_top],
        [xB_left, yB_top]
      ], pal.primaryLine, 1.4, true, 'rgba(56, 189, 248, 0.18)', [], 'DET_B_TOP_BAR');

      cadPoly(ctx, [
        [xB_corner, yB_top],
        [xB_rightBreak, yB_top],
        [xB_rightBreak, yB_strutBot],
        [xB_corner, yB_strutBot]
      ], pal.primaryLine, 1.4, true, 'rgba(30, 41, 59, 0.65)', [], 'DET_B_STRUT_WEB');

      // Right Z-Break Line (`11AFC`)
      drawBreakLine(ctx, xB_rightBreak, yB_top - 10, xB_rightBreak, yB_strutBot + 10, pal);

      // 2) L-Angle Frame (`11AFF` with ANSI34 hatch `12559`: 角鋼架 L:50x50x4)
      const tAng = 0.4 * uCm; // 4mm thickness
      cadPoly(ctx, [
        [xB_left, yB_top],
        [xB_corner, yB_top],
        [xB_corner, yB_strutBot + 4],
        [xB_corner - tAng, yB_strutBot + 4],
        [xB_corner - tAng, yB_top + tAng],
        [xB_left, yB_top + tAng]
      ], pal.angleFrame, 1.5, true, 'rgba(148, 163, 184, 0.40)', [], 'DET_B_ANGLE_FRAME');

      // 3) Corrugated Steel Plate (`11AFE`: 板厚:1.6mm) descending vertically down to yB_bot
      const tPlt = 0.22 * uCm;
      cadPoly(ctx, [
        [xB_corner - tAng - tPlt, yB_top + tAng],
        [xB_corner - tAng, yB_top + tAng],
        [xB_corner - tAng, yB_bot],
        [xB_corner - tAng - tPlt, yB_bot]
      ], pal.steelPlate, 1.5, true, 'rgba(250, 204, 21, 0.25)', [], 'DET_B_PLATE_16');

      // 4) Top Vertical Bolt (`11B00..11B03` at xB_bolt1) & Horizontal Side Bolt (`11B08..11B0B` at yB_bolt2)
      cadPoly(ctx, [[xB_bolt1 - 8, yB_top - 14], [xB_bolt1 + 8, yB_top - 14], [xB_bolt1 + 8, yB_top + tAng + 6], [xB_bolt1 - 8, yB_top + tAng + 6]], pal.primaryLine, 1.25, true, 'rgba(15,23,42,0.85)', [], 'DET_B_BOLT_1');
      cadLine(ctx, xB_bolt1, yB_top - 18, xB_bolt1, yB_top + tAng + 12, pal.centerLine, 1.0, [5, 2]);

      cadPoly(ctx, [[xB_corner - tAng - tPlt - 8, yB_bolt2 - 8], [xB_corner + 12, yB_bolt2 - 8], [xB_corner + 12, yB_bolt2 + 8], [xB_corner - tAng - tPlt - 8, yB_bolt2 + 8]], pal.primaryLine, 1.25, true, 'rgba(15,23,42,0.85)', [], 'DET_B_BOLT_2');
      cadLine(ctx, xB_corner - tAng - tPlt - 14, yB_bolt2, xB_rightBreak, yB_bolt2, pal.centerLine, 1.0, [6, 3], 'DET_B_CL_2');

      // 5) All 4 Dimensions on Detail B (`*D6` 2, `*D7` 3, `*D8` 3,5, `*D18` 1,5):
      cadDim(ctx, xB_left, yB_top - 14, xB_bolt1, yB_top - 14, -18, '2', pal, 11);
      cadDim(ctx, xB_bolt1, yB_top - 14, xB_corner, yB_top - 14, -18, '3', pal, 11);
      cadDim(ctx, xB_rightBreak + 10, yB_top, xB_rightBreak + 10, yB_bolt2, 18, '3,5', pal, 11);
      cadDim(ctx, xB_rightBreak - 10, yB_bolt2, xB_rightBreak - 10, yB_strutBot, 14, '1,5', pal, 10.5);

      // 6) All 3 Callouts on Detail B (`11BE3/11BE6`, `11BF0/11BF1`, `11BEB/11BEC`):
      // Top-Right: 角鋼架(L:50x50x4)
      cadLeaderArrow(ctx, xB_corner, yB_top + 6, xB_rightBreak + 24, yB_top - 16, xB_rightBreak + 38, yB_top - 16, ['角鋼架(L:50x50x4)'], pal, 10.8, false);
      // Middle-Right: 橫支柱(L:50x50x4)
      cadLeaderArrow(ctx, xB_rightBreak - 6, yB_bolt2 + 12, xB_rightBreak + 24, yB_strutBot + 16, xB_rightBreak + 38, yB_strutBot + 16, ['橫支柱(L:50x50x4)'], pal, 10.8, false);
      // Bottom-Right: 板厚:1.6mm
      cadLeaderArrow(ctx, xB_corner - tAng, yB_bot - 14, xB_rightBreak + 18, yB_bot + 10, xB_rightBreak + 32, yB_bot + 10, [`板厚:${p.t_mm}mm`], pal, 10.8, false);

      const titleBY = yB_bot + 28;
      const cxB = (xB_left + xB_rightBreak) / 2;
      cadText(ctx, '詳圖B', cxB, titleBY, 15.5, pal.titleCyan, 'center', '700');
      cadLine(ctx, cxB - 32, titleBY + 9, cxB + 32, titleBY + 9, pal.titleCyan, 1.4);
      cadLine(ctx, cxB - 32, titleBY + 12.5, cxB + 32, titleBY + 12.5, pal.titleCyan, 1.0);

      return {
        rightX: xB_rightBreak + 165,
        bottomY: titleBY + 24
      };
    }

    // =========================================================================
    // 6. VIEW 4 & 5: 原圖【側視圖】 (SIDE ELEVATION VIEW `124D6`) & 自動補齊之 1:1 對齊【俯視平面圖】
    //    100% Faithful to DXF Entities `11BF4..11E94`, `*D9..*D14`:
    //    - Side View (Bottom):
    //      * Left Unit L (10 corrugated arches `11C16..11C1E`), Middle broken unit L with Z-break lines (`11D11/11D12`), Right Unit L (`11CAA..11CB2`)
    //      * Top longitudinal angle bar (`11C13` & `11C38`) with bolt symbols `⊕` (`11C29..11CB8`) and L-clips (`11BF4, 11C14, 11C60, 11CA9`)
    //      * Vertical ANSI31 hatched joint angle frames (`11C27/11C28` & `11C6A/11C6B`)
    //      * Dashed circle `11E84` at first joint pointing to "詳圖A" (`11E86`), plus callouts "墊片:1*50(mm)" (`11E89`) & "角鋼架(L:50x50x4cm)" (`124E1`)
    //      * Bottom Dimension Chain: `1.9cm` (`*D13`) | `L` (`*D9`) | `L` (`*D11`) | `L` (`*D10`) | `1.9cm` (`*D14`) and overall `L*n+3.8cm` (`*D12`)
    //    - Top Plan View (Top, 1:1 Aligned with Side View!):
    //      * Shows ditch width W, left & right longitudinal angle frames, cross-struts `橫支柱(L:50x50x4mm)` spaced every S_strut_cm,
    //      * Corrugated bottom plate wave lines, two-side gravel backfill strips, and water flow direction
    // =========================================================================
    function drawSideAndPlanViews(ctx, ox, topY, p, pal) {
      const x0 = ox + 55;
      const nWaves = p.N_waves; // 10 waves per unit L
      const waveW = 13.5;       // Width per corrugation wave in px
      const unitW = nWaves * waveW; // 135 px for full unit L
      const midUnitW = 92;      // Broken middle unit L width
      const endMargin = 4.5;    // 1.9cm end margin

      const xUnit1_0 = x0 + endMargin;
      const xUnit1_1 = xUnit1_0 + unitW;      // Joint 1 (with ANSI31 vertical angle frame & Detail A circle)
      const xUnit2_1 = xUnit1_1 + midUnitW;   // Joint 2 (with ANSI31 vertical angle frame)
      const xUnit3_1 = xUnit2_1 + unitW;      // Right end of 3rd unit
      const xEnd = xUnit3_1 + endMargin;
      const totalSpanW = xEnd - x0;

      const xBreakMid1 = xUnit1_1 + midUnitW * 0.36;
      const xBreakMid2 = xUnit1_1 + midUnitW * 0.42;

      // =====================================================================
      // PART A: 自動補齊之 1:1 對齊【俯視平面圖】 (TOP PLAN VIEW)
      // =====================================================================
      const wDitchPlan = Math.min(115, p.W_cm * 1.15);
      const wGrvPlan = 16;
      const yPlanGrvTop = topY + 36;
      const yPlanTop = yPlanGrvTop + wGrvPlan;
      const yPlanMid = yPlanTop + wDitchPlan / 2;
      const yPlanBot = yPlanTop + wDitchPlan;
      const yPlanGrvBot = yPlanBot + wGrvPlan;

      // 1) Left & Right Gravel Backfill Strips (注意事項1：兩側需回填碎石級配夯實)
      cadPoly(ctx, [[x0, yPlanGrvTop], [xEnd, yPlanGrvTop], [xEnd, yPlanTop], [x0, yPlanTop]], pal.secondaryLine, 1.0, true, 'rgba(148, 163, 184, 0.12)', [4, 3], 'PLAN_GRAVEL_L');
      cadPoly(ctx, [[x0, yPlanBot], [xEnd, yPlanBot], [xEnd, yPlanGrvBot], [x0, yPlanGrvBot]], pal.secondaryLine, 1.0, true, 'rgba(148, 163, 184, 0.12)', [4, 3], 'PLAN_GRAVEL_R');

      // 2) Main Corrugated Steel Ditch Body in Plan View
      cadPoly(ctx, [[x0, yPlanTop], [xEnd, yPlanTop], [xEnd, yPlanBot], [x0, yPlanBot]], pal.primaryLine, 1.5, true, 'rgba(56, 189, 248, 0.12)', [], 'PLAN_DITCH_BODY');
      cadLine(ctx, x0, yPlanTop + 6, xEnd, yPlanTop + 6, pal.angleFrame, 1.25, [], 'PLAN_ANGLE_L');
      cadLine(ctx, x0, yPlanBot - 6, xEnd, yPlanBot - 6, pal.angleFrame, 1.25, [], 'PLAN_ANGLE_R');

      // Corrugation crest/valley lines across Plan View
      const drawPlanWaves = (xStart, xStop) => {
        for (let wx = xStart + waveW; wx < xStop - 2; wx += waveW) {
          if (wx > xBreakMid1 - 3 && wx < xBreakMid2 + 3) continue;
          cadLine(ctx, wx, yPlanTop + 6, wx, yPlanBot - 6, pal.secondaryLine, 0.75, [], 'PLAN_WAVE_CREST');
        }
      };
      drawPlanWaves(xUnit1_0, xUnit1_1);
      drawPlanWaves(xUnit1_1, xUnit2_1);
      drawPlanWaves(xUnit2_1, xUnit3_1);

      // 3) Cross-Struts (`橫支柱 L:50x50x4mm` spaced every L_unit) & Joint Angle Frames in Plan View
      const strutPositionsX = [xUnit1_0 + 4, xUnit1_1, xUnit2_1, xUnit3_1 - 4];
      strutPositionsX.forEach((sx, idx) => {
        const sw = (idx === 1 || idx === 2) ? 8 : 6;
        cadPoly(ctx, [
          [sx - sw / 2, yPlanTop - 3],
          [sx + sw / 2, yPlanTop - 3],
          [sx + sw / 2, yPlanBot + 3],
          [sx - sw / 2, yPlanBot + 3]
        ], pal.angleFrame, 1.4, true, '#1e293b', [], 'PLAN_CROSS_STRUT');
        drawBoltSymbol(ctx, sx, yPlanTop + 3, 2.8, pal);
        drawBoltSymbol(ctx, sx, yPlanBot - 3, 2.8, pal);
      });

      // Middle Z-Break Lines in Plan View (1:1 aligned with Side View below!)
      drawBreakLine(ctx, xBreakMid1, yPlanGrvTop - 6, xBreakMid1, yPlanGrvBot + 6, pal);
      drawBreakLine(ctx, xBreakMid2, yPlanGrvTop - 6, xBreakMid2, yPlanGrvBot + 6, pal);

      // Flow Arrow on Plan View
      const flwX1 = xUnit2_1 + 25, flwX2 = xUnit3_1 - 25;
      cadLine(ctx, flwX1, yPlanMid, flwX2, yPlanMid, pal.dimLine, 1.7, [], 'FLOW_ARROW');
      cadPoly(ctx, [[flwX2 - 7, yPlanMid - 3.5], [flwX2 - 7, yPlanMid + 3.5], [flwX2, yPlanMid]], pal.dimLine, 1.2, true, pal.dimLine);
      cadText(ctx, '水流方向', (flwX1 + flwX2) / 2, yPlanMid - 11, 10.5, pal.titleCyan, 'center', '700');

      cadDim(ctx, x0, yPlanTop, x0, yPlanBot, -22, `W (${p.W_cm})`, pal, 11);

      const planTitleY = yPlanGrvBot + 24;
      cadText(ctx, '俯視平面圖 (自動補齊・與側視圖1:1對齊)', (x0 + xEnd) / 2, planTitleY, 14.5, pal.titleCyan, 'center', '700');
      cadLine(ctx, (x0 + xEnd) / 2 - 135, planTitleY + 9, (x0 + xEnd) / 2 + 135, planTitleY + 9, pal.titleCyan, 1.3);

      // =====================================================================
      // PART B: 原圖【側視圖】 (SIDE ELEVATION VIEW - 1:1 ALIGNED BELOW PLAN VIEW!)
      //         100% Faithful to DXF Entities `11BF4..11E94`, `*D9..*D14`
      // =====================================================================
      const ySideTop = planTitleY + 56;
      const sideH = 115;
      const ySideRailBot = ySideTop + 9;
      const ySideBot = ySideTop + sideH;

      // 1:1 Vertical Alignment Guides between Plan View and Side View
      [x0, xUnit1_1, xUnit2_1, xEnd].forEach((gx) => {
        cadLine(ctx, gx, yPlanGrvBot + 3, gx, ySideTop - 10, pal.secondaryLine, 0.8, [4, 4], 'ALIGN_GUIDE');
      });

      // 1) Top Longitudinal Angle Bar (`11C13` & `11C38`)
      cadLine(ctx, x0, ySideTop, xBreakMid1, ySideTop, pal.primaryLine, 1.45, [], 'SIDE_TOP_RAIL');
      cadLine(ctx, x0, ySideRailBot, xBreakMid1, ySideRailBot, pal.primaryLine, 1.35, [], 'SIDE_TOP_RAIL');
      cadLine(ctx, xBreakMid2, ySideTop, xEnd, ySideTop, pal.primaryLine, 1.45, [], 'SIDE_TOP_RAIL');
      cadLine(ctx, xBreakMid2, ySideRailBot, xEnd, ySideRailBot, pal.primaryLine, 1.35, [], 'SIDE_TOP_RAIL');

      // 2) Helper to draw a Corrugated Unit Segment with vertical wave lines & bottom scalloped arcs (`11C16..11CB2`)
      const drawCorrugatedUnitSide = (xStart, xStop, isBrokenMid) => {
        cadLine(ctx, xStart, ySideTop, xStart, ySideBot, pal.primaryLine, 1.4);
        cadLine(ctx, xStop, ySideTop, xStop, ySideBot, pal.primaryLine, 1.4);

        let curX = xStart;
        while (curX < xStop - 1) {
          const nextX = Math.min(xStop, curX + waveW);
          if (isBrokenMid && nextX > xBreakMid1 && curX < xBreakMid2) {
            curX = nextX;
            continue;
          }
          // Vertical corrugation line
          cadLine(ctx, nextX, ySideRailBot, nextX, ySideBot, pal.secondaryLine, 1.0, [], 'CORR_LINE');
          // Bottom scalloped wave arc (`bulge = 0.513` in DXF `11C16..11CB2`)
          const midWaveX = (curX + nextX) / 2;
          const arcDrop = 3.2;
          cadPoly(ctx, [
            [curX, ySideBot],
            [midWaveX, ySideBot - arcDrop],
            [nextX, ySideBot]
          ], pal.steelPlate, 1.35, false, null, [], 'CORR_WAVE_BOT');
          curX = nextX;
        }
      };

      drawCorrugatedUnitSide(x0, xUnit1_0, false);
      drawCorrugatedUnitSide(xUnit1_0, xUnit1_1, false);
      drawCorrugatedUnitSide(xUnit1_1, xUnit2_1, true);
      drawCorrugatedUnitSide(xUnit2_1, xUnit3_1, false);
      drawCorrugatedUnitSide(xUnit3_1, xEnd, false);

      // 3) Vertical ANSI31 Hatched Joint Angle Frames at xUnit1_1 (`11C27/11C28`) and xUnit2_1 (`11C6A/11C6B`)
      const jointFrameW = 10.5;
      [xUnit1_1, xUnit2_1].forEach((jx) => {
        const jL = jx - jointFrameW / 2;
        const jR = jx + jointFrameW / 2;
        cadPoly(ctx, [
          [jL, ySideTop],
          [jR, ySideTop],
          [jR, ySideBot],
          [jL, ySideBot]
        ], pal.angleFrame, 1.45, true, 'rgba(30, 41, 59, 0.88)', [], 'JOINT_ANGLE_FRAME');
        // ANSI31 45-degree hatch inside vertical joint angle frame
        for (let hy = ySideTop + 6; hy < ySideBot - 4; hy += 9) {
          cadLine(ctx, jL, hy + 4, jR, hy - 4, pal.angleHatch, 0.9, [], 'ANSI31_JOINT');
        }
      });

      // 4) Top Cross-Strut L-Clips (`11BF4, 11C14, 11C60, 11CA9`) & Bolt Cross-hairs `⊕` (`11C29..11CB8`)
      [x0, xUnit1_1 - 12, xUnit2_1 - 12, xEnd - 10].forEach((lx) => {
        cadPoly(ctx, [
          [lx, ySideTop - 3.5],
          [lx + 10, ySideTop - 3.5],
          [lx + 10, ySideTop],
          [lx, ySideTop]
        ], pal.angleFrame, 1.3, true, pal.angleFrame, [], 'TOP_STRUT_CLIP');
      });

      const boltXs = [
        xUnit1_0 + waveW * 0.5,
        xUnit1_0 + waveW * 3.5,
        xUnit1_0 + waveW * 6.5,
        xUnit1_1 + waveW * 2.0,
        xUnit2_1 - waveW * 2.0,
        xUnit2_1 + waveW * 2.5,
        xUnit2_1 + waveW * 5.5,
        xUnit2_1 + waveW * 8.0
      ];
      boltXs.forEach((bx) => {
        drawBoltSymbol(ctx, bx, (ySideTop + ySideRailBot) / 2, 2.8, pal);
      });

      // 5) Middle Z-Break Lines on Side View (`11D11` & `11D12`)
      drawBreakLine(ctx, xBreakMid1, ySideTop - 10, xBreakMid1, ySideBot + 12, pal);
      drawBreakLine(ctx, xBreakMid2, ySideTop - 10, xBreakMid2, ySideBot + 12, pal);

      // 6) Dashed Detail Circle (`11E84`) at Joint 1 Top + All 3 Callouts on Side View (`11E86`, `11E89`, `124E1`):
      cadCircle(ctx, xUnit1_1 - 3, ySideTop + 4, 15, pal.dimLine, 1.25, null, [5, 3], 'DETAIL_A_CIRCLE');
      cadLeaderArrow(
        ctx,
        xUnit1_1 - 12, ySideTop - 8,
        xUnit1_1 - 28, ySideTop - 28,
        xUnit1_1 - 42, ySideTop - 28,
        ['詳圖A'],
        pal, 11.2, false
      );

      // Callout: 墊片:1*50(mm) (`11E88/11E89`)
      cadLeaderArrow(
        ctx,
        xUnit2_1, ySideTop + 4,
        xUnit2_1 + 22, ySideTop - 28,
        xUnit2_1 + 34, ySideTop - 28,
        ['墊片:1*50(mm)'],
        pal, 11.0, false
      );

      // Callout: 角鋼架(L:50x50x4cm) (`11E94/124E1`)
      const lastBoltX = boltXs[boltXs.length - 1];
      cadLeaderArrow(
        ctx,
        lastBoltX, ySideTop + 4,
        lastBoltX + 22, ySideTop - 28,
        lastBoltX + 34, ySideTop - 28,
        ['角鋼架(L:50x50x4mm)'],
        pal, 11.0, false
      );

      // 7) Bottom Dimension Chain on Side View (`*D9..*D14`):
      // Tier 1: 1.9cm | L | L | L | 1.9cm
      const yDimTier1 = ySideBot + 24;
      cadLine(ctx, x0, ySideBot + 3, x0, yDimTier1 + 18, pal.dimLine, 0.9);
      cadLine(ctx, xUnit1_0, ySideBot + 3, xUnit1_0, yDimTier1 + 4, pal.dimLine, 0.9);
      cadLine(ctx, xUnit1_1, ySideBot + 3, xUnit1_1, yDimTier1 + 4, pal.dimLine, 0.9);
      cadLine(ctx, xUnit2_1, ySideBot + 3, xUnit2_1, yDimTier1 + 4, pal.dimLine, 0.9);
      cadLine(ctx, xUnit3_1, ySideBot + 3, xUnit3_1, yDimTier1 + 4, pal.dimLine, 0.9);
      cadLine(ctx, xEnd, ySideBot + 3, xEnd, yDimTier1 + 18, pal.dimLine, 0.9);

      cadDim(ctx, xUnit1_0, yDimTier1, xUnit1_1, yDimTier1, 0, `L (${p.L_unit_cm})`, pal, 11);
      cadDim(ctx, xUnit1_1, yDimTier1, xUnit2_1, yDimTier1, 0, 'L', pal, 11);
      cadDim(ctx, xUnit2_1, yDimTier1, xUnit3_1, yDimTier1, 0, `L (${p.L_unit_cm})`, pal, 11);
      cadText(ctx, '1.9cm', x0 - 18, yDimTier1 - 2, 10.2, pal.dimText, 'center', '600');
      cadLine(ctx, x0 - 32, yDimTier1, xUnit1_0, yDimTier1, pal.dimLine, 0.95);
      cadText(ctx, '1.9cm', xEnd + 20, yDimTier1 - 2, 10.2, pal.dimText, 'center', '600');
      cadLine(ctx, xUnit3_1, yDimTier1, xEnd + 34, yDimTier1, pal.dimLine, 0.95);

      // Tier 2: Overall `L*n+3.8cm` (`*D12`)
      const yDimTier2 = yDimTier1 + 22;
      cadDim(ctx, x0, yDimTier2, xEnd, yDimTier2, 0, `L*n+3.8cm (單單元L=${p.L_unit_cm}cm)`, pal, 11.2);

      // Side View Title (`1253C, 12541, 12542`): 側視圖
      const sideTitleY = yDimTier2 + 28;
      cadText(ctx, '側視圖', (x0 + xEnd) / 2, sideTitleY, 15.5, pal.titleCyan, 'center', '700');
      cadLine(ctx, (x0 + xEnd) / 2 - 36, sideTitleY + 9, (x0 + xEnd) / 2 + 36, sideTitleY + 9, pal.titleCyan, 1.4);
      cadLine(ctx, (x0 + xEnd) / 2 - 36, sideTitleY + 12.5, (x0 + xEnd) / 2 + 36, sideTitleY + 12.5, pal.titleCyan, 1.0);

      return {
        rightX: xEnd + 135,
        bottomY: sideTitleY + 24
      };
    }

    // =========================================================================
    // 7. VIEW 6: EXPLICIT FIGURE-NUMBER QUANTITY TABLE ON CANVAS
    // =========================================================================
    function drawExplicitFormulaTableOnCanvas(ctx, ox, oy, p, pal) {
      cadText(
        ctx,
        `【浪型鋼板溝 (圖號 0509-1 / 063) 每公尺數量計算式表 — 採用圖面標註數字顯式列式 (溝寬W=${p.W_cm}cm・溝深H=${p.H_cm}cm・單元L=${p.L_unit_cm}cm・全段=${p.L_tot_m.toFixed(1)}m)】`,
        ox, oy - 15, 13.0, pal.dimText, 'left', '700'
      );

      const colW = [260, 505, 82, 92, 52];
      const rowH = 26;
      const rows = [
        ['工程項目名稱 (依DXF圖面標註)', '採用圖面標註數字之顯式計算式 (每公尺基準)', '每m數量', `全段(${p.L_tot_m}m)`, '單位'],
        [`浪型鋼板厚=${p.t_mm}mm (鍍鋅量至少400g/m²)`, p.formula_plate_area, p.q_plate_area.toFixed(2), (p.q_plate_area * p.L_tot_m).toFixed(1), 'M²'],
        [`角鋼架與橫支柱 (L:50x50x4mm, 鍍鋅量>400g/m²)`, p.formula_angle_wt, p.q_angle_wt.toFixed(2), (p.q_angle_wt * p.L_tot_m).toFixed(1), 'kg'],
        [`鍍鋅螺栓及墊片:1*50(mm) (鍍鋅量>350g/m²)`, p.formula_bolt_sets, p.q_bolt_sets.toFixed(1), (p.q_bolt_sets * p.L_tot_m).toFixed(0), '組'],
        [`兩側回填碎石級配夯實 (寬${p.w_gravel_cm}cm, 注意事項1)`, p.formula_gravel_vol, p.q_gravel_vol.toFixed(2), (p.q_gravel_vol * p.L_tot_m).toFixed(2), 'M³'],
        ['小型機械開挖並夯實兩側溝壁及底部 (注意事項5)', p.formula_compact_area, p.q_compact_area.toFixed(2), (p.q_compact_area * p.L_tot_m).toFixed(1), 'M²']
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
          const color = isHeader ? pal.textMain : (cIdx === 2 ? pal.dimText : (cIdx === 3 ? pal.steelPlate : pal.textSub));
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
      document.getElementById('stat_ditch_tag').textContent = `W=${p.W_cm}・H=${p.H_cm}cm`;
      document.getElementById('stat_plate_m').textContent = `${p.q_plate_area.toFixed(2)} M²/m`;
      document.getElementById('stat_angle_m').textContent = `${p.q_angle_wt.toFixed(2)} kg/m`;
      document.getElementById('stat_gravel_m').textContent = `${p.q_gravel_vol.toFixed(2)} M³/m`;
      document.getElementById('stat_bolt_m').textContent = `${p.q_bolt_sets.toFixed(1)} 組/m`;
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

      if (currentView === 'SEC_DETAILS') {
        const bSec = drawCrossSectionView(ctx, 25, 12, p, pal);
        const bDet = drawDetailAAndDetailB(ctx, bSec.rightX + 20, 12, p, pal);
        drawExplicitFormulaTableOnCanvas(ctx, 30, Math.max(bSec.bottomY, bDet.bottomY) + 36, p, pal);
      } else if (currentView === 'SIDE_PLAN') {
        const bSP = drawSideAndPlanViews(ctx, 40, 12, p, pal);
        drawExplicitFormulaTableOnCanvas(ctx, 40, bSP.bottomY + 36, p, pal);
      } else {
        // 'ALL' Full Standard Sheet Layout (Matching A3 Layout 5-09 of DXF):
        // - Left Column: 斷面圖 + 符號說明 (W, H, L) + 單位註記
        // - Middle Column: 詳圖A (上下游搭接角鋼架 5.8=2.9+2.9) + 詳圖B (轉角雙螺栓鎖固 2, 3, 3.5, 1.5)
        // - Right Column: 自動補齊之 1:1 對齊【俯視平面圖】 + 原圖【側視圖 (L*n+3.8cm)】
        // - Bottom Full-Width: 圖面標註數字顯式計算式表
        const bSec = drawCrossSectionView(ctx, 15, 10, p, pal);
        const midColX = bSec.rightX + 10;
        const bDet = drawDetailAAndDetailB(ctx, midColX, 10, p, pal);
        const rightColX = bDet.rightX + 20;
        const bSP = drawSideAndPlanViews(ctx, rightColX, 10, p, pal);

        const tableY = Math.max(bSec.bottomY, bDet.bottomY, bSP.bottomY) + 36;
        drawExplicitFormulaTableOnCanvas(ctx, 25, tableY, p, pal);
      }

      ctx.restore();
    }

    // =========================================================================
    // 9. UI CONTROLS, AUTO-SYNC & DXF / CSV EXPORTERS
    // =========================================================================
    function stepVal(inputId, delta) {
      const el = document.getElementById(inputId);
      if (!el) return;
      const minV = parseFloat(el.min) || 6;
      const maxV = parseFloat(el.max) || 16;
      const curV = Math.round(parseFloat(el.value) || minV);
      el.value = Math.max(minV, Math.min(maxV, curV + delta));
      renderAll();
    }

    function onGeomChange() {
      renderAll();
    }

    function resetToOrig() {
      Object.keys(ORIG_CORRUGATED_DITCH).forEach(k => {
        const el = document.getElementById('inp_' + k);
        if (el) el.value = ORIG_CORRUGATED_DITCH[k];
      });
      renderAll();
    }

    function switchView(view) {
      currentView = view;
      const specEl = document.getElementById('specPanel');
      const tabs = {
        ALL: document.getElementById('tab-all'),
        SEC_DETAILS: document.getElementById('tab-sec-det'),
        SIDE_PLAN: document.getElementById('tab-side-plan'),
        SPEC: document.getElementById('tab-spec')
      };
      Object.keys(tabs).forEach(k => {
        if (!tabs[k]) return;
        tabs[k].className = (k === view)
          ? 'px-3 py-1.5 rounded-md text-xs font-semibold transition-all bg-cyan-600 text-white shadow'
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
        ? 'px-2.5 py-1 rounded bg-cyan-950/90 border border-cyan-600/60 text-xs text-cyan-300 flex items-center gap-1 transition'
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
      if (currentView === 'SEC_DETAILS') {
        viewCam.scale = Math.min(rect.width / 1080, rect.height / 860) * 0.93;
        viewCam.offsetX = Math.max(20, (rect.width - 1020 * viewCam.scale) / 2);
        viewCam.offsetY = 14;
      } else if (currentView === 'SIDE_PLAN') {
        viewCam.scale = Math.min(rect.width / 1040, rect.height / 840) * 0.93;
        viewCam.offsetX = Math.max(20, (rect.width - 980 * viewCam.scale) / 2);
        viewCam.offsetY = 14;
      } else {
        viewCam.scale = Math.min(rect.width / 1620, rect.height / 880) * 0.94;
        viewCam.offsetX = Math.max(18, (rect.width - 1560 * viewCam.scale) / 2);
        viewCam.offsetY = 12;
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
      a.download = `浪型鋼板溝標準圖_0509-1_W${p.W_cm}_H${p.H_cm}cm_含補齊平面圖.dxf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }

    function exportCSV() {
      const p = getParams();
      const rows = [
        [`浪型鋼板溝標準圖 (圖號 0509-1 / 063・溝寬W=${p.W_cm}cm・溝深H=${p.H_cm}cm・單元長L=${p.L_unit_cm}cm) - 圖面標註數字顯式列式數量計算書`],
        ['工程項目名稱', '採用圖面標註數字之顯式計算式 (每公尺基準)', '每公尺數量', `全段數量(${p.L_tot_m}m)`, '單位'],
        [`浪型鋼板厚=${p.t_mm}mm (鍍鋅量至少400g/m²)`, `'${p.formula_plate_area}`, p.q_plate_area.toFixed(2), (p.q_plate_area * p.L_tot_m).toFixed(1), 'M²'],
        [`角鋼架與橫支柱 (L:50x50x4mm, 鍍鋅量>400g/m²)`, `'${p.formula_angle_wt}`, p.q_angle_wt.toFixed(2), (p.q_angle_wt * p.L_tot_m).toFixed(1), 'kg'],
        [`鍍鋅螺栓及墊片:1*50(mm) (鍍鋅量>350g/m²)`, `'${p.formula_bolt_sets}`, p.q_bolt_sets.toFixed(1), (p.q_bolt_sets * p.L_tot_m).toFixed(0), '組'],
        [`兩側回填碎石級配夯實 (寬${p.w_gravel_cm}cm, 注意事項1)`, `'${p.formula_gravel_vol}`, p.q_gravel_vol.toFixed(2), (p.q_gravel_vol * p.L_tot_m).toFixed(2), 'M³'],
        ['小型機械開挖並夯實兩側溝壁及底部 (注意事項5)', `'${p.formula_compact_area}`, p.q_compact_area.toFixed(2), (p.q_compact_area * p.L_tot_m).toFixed(1), 'M²']
      ];

      const csvContent = '\uFEFF' + rows.map(r => r.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `浪型鋼板溝顯式列式計算書_0509-1_W${p.W_cm}xH${p.H_cm}.csv`;
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

  const STRIP = s => String(s).replace(/\s*[（(]\s*圖號[^）)]*[）)]/g, '').replace(/\s*[（(]\s*\d{4}-\d\s*[/／]\s*\d{3}\s*[）)]/g, '').replace(/\s*圖號\s*[：:]?\s*[0-9A-Za-z#\-／/ ]+/g, ' ');
  function params(R) { Object.keys(R || {}).forEach(k => { el('inp_' + k).value = String(R[k]); }); return getParams(); }
  function run(R, OV) {
    O = []; const PAL = getPalette(), p = params(R); Object.assign(p, R || {}, OV || {});
    const bSec = drawCrossSectionView(CTX, 15, 10, p, PAL), bDet = drawDetailAAndDetailB(CTX, bSec.rightX + 10, 10, p, PAL), bSP = drawSideAndPlanViews(CTX, bDet.rightX + 20, 10, p, PAL); drawExplicitFormulaTableOnCanvas(CTX, 25, Math.max(bSec.bottomY, bDet.bottomY, bSP.bottomY) + 36, p, PAL);
    
    const sc = 1 / 1.65; return O.map(o => { const r = Object.assign({}, o); if (r.p) r.p = r.p.map(([x, y]) => [x * sc, y * sc]); if (r.x !== undefined) { r.x *= sc; r.y *= sc; } if (r.r) r.r *= sc; if (r.h) r.h *= sc; if (r.s !== undefined && r.k === 'T') r.s = STRIP(r.s); return r; });
  }
  return { run, params };
})();
TCO_D['pat'] = (function () {
  let O = [];
  const EL = {}, CTX = new Proxy({}, { get: (t, k) => (k in t ? t[k] : () => ({ width: 0 })), set: (t, k, v) => { t[k] = v; return true; } });
  const el = id => EL[id] || (EL[id] = { value: '', textContent: '', innerHTML: '', className: '', style: {}, classList: { add() {}, remove() {}, toggle() {} }, addEventListener() {}, getContext: () => CTX, parentElement: { getBoundingClientRect: () => ({ width: 100, height: 100 }) } });
  const document = { getElementById: el, querySelectorAll: () => [], querySelector: () => null, createElement: () => ({ click() {}, style: {} }), body: { appendChild() {}, removeChild() {}, classList: { add() {}, remove() {}, toggle() {}, contains: () => false } }, documentElement: { classList: { contains: () => false, add() {}, remove() {}, toggle() {} } }, addEventListener() {} };
  const window = { addEventListener() {}, devicePixelRatio: 1, matchMedia: () => ({ matches: false, addEventListener() {} }) };

    // =========================================================================
    // 1. ORIGINAL DXF BASELINE CONSTANTS & GLOBAL STATE (PURE ASCII IDENTIFIERS)
    // =========================================================================
    const ORIG_PLASTERED_DITCH = {
      W_cm: 90,
      H_cm: 30,
      t_cm: 15,
      w_gravel_cm: 20,
      N_long_bars: 6,
      N_anchor_sec: 4,
      L_anc_cm: 100,
      S_anc_cm: 100,
      N_mesh_layers: 2,
      L_tot_m: 30.0
    };

    let currentView = 'ALL'; // 'ALL', 'SEC_MESH', 'PLAN_PROF', 'SPEC'
    let showGhost = false;
    let isDarkTheme = true;

    let viewCam = {
      scale: 0.68,
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

      const W_cm = Math.max(50, Math.min(200, Math.round(num('inp_W_cm', 90))));
      const H_cm = Math.max(20, Math.min(80, Math.round(num('inp_H_cm', 30))));
      const t_cm = Math.max(10, Math.min(25, Math.round(num('inp_t_cm', 15))));
      const w_gravel_cm = Math.max(10, Math.min(40, Math.round(num('inp_w_gravel_cm', 20))));
      const N_long_bars = Math.max(4, Math.min(12, Math.round(num('inp_N_long_bars', 6))));
      const N_anchor_sec = Math.max(2, Math.min(8, Math.round(num('inp_N_anchor_sec', 4))));
      const L_anc_cm = Math.max(50, Math.min(150, Math.round(num('inp_L_anc_cm', 100))));
      const S_anc_cm = Math.max(50, Math.min(200, Math.round(num('inp_S_anc_cm', 100))));
      const N_mesh_layers = Math.max(1, Math.min(3, Math.round(num('inp_N_mesh_layers', 2))));
      const L_tot_m = Math.max(5.0, Math.min(50.0, num('inp_L_tot_m', 30.0)));

      const p = {
        W_cm,
        H_cm,
        t_cm,
        w_gravel_cm,
        N_long_bars,
        N_anchor_sec,
        L_anc_cm,
        S_anc_cm,
        N_mesh_layers,
        L_tot_m
      };

      const W_m = +(W_cm / 100).toFixed(2);
      const H_m = +(H_cm / 100).toFixed(2);
      const t_m = +(t_cm / 100).toFixed(2);
      const Lanc_m = +(L_anc_cm / 100).toFixed(2);
      const Sanc_m = +(S_anc_cm / 100).toFixed(2);
      const wgrv_m = +(w_gravel_cm / 100).toFixed(2);

      // 1. 拍漿溝斷面展開弧長 P_arc_m (含兩側圓弧溝肩 0.17m):
      const parabolaArc = +(W_m + (8 * H_m * H_m) / (3 * W_m)).toFixed(2);
      p.P_arc_m = +(parabolaArc + 0.17).toFixed(2);

      // 2. t=15cm 拍漿混凝土體積 (M³/m):
      p.q_conc_vol = +(p.P_arc_m * t_m * 1.0).toFixed(2);
      p.formula_conc_vol = `[溝弧展開(${W_m.toFixed(2)}m + 8*${H_m.toFixed(2)}²/(3*${W_m.toFixed(2)}) + 溝肩0.17m = ${p.P_arc_m.toFixed(2)}m)] * 厚t(${t_m.toFixed(2)}m) * 1.00m`;

      // 3. 二層鍍鋅立體鐵絲網 (網目50×50mm, 高度25±5mm, 線徑∅2mm以上, 鍍鋅量≧245g/m²):
      p.q_mesh_area = +(N_mesh_layers * p.P_arc_m * 1.0).toFixed(2);
      p.formula_mesh_area = `${N_mesh_layers}層鍍鋅立體鐵絲網 * 溝面展開寬(${p.P_arc_m.toFixed(2)}m) * 1.00m`;

      // 4. 鑽孔 ∅3.8cm 內灌 1:3 水泥砂漿，再插 #5 鋼筋，L=約100cm (支/m):
      p.q_anchor_cnt = +(N_anchor_sec * (100 / S_anc_cm)).toFixed(2);
      p.formula_anchor_cnt = `每排 ${N_anchor_sec}孔(∅3.8cm灌1:3水泥砂漿) * [100cm / 縱向間距(${S_anc_cm}cm)] = ${p.q_anchor_cnt.toFixed(1)} 支/m`;

      // 5. #5 鋼筋總重 (6-#5縱向鋼筋 + #5錨筋彎設標準彎鉤，D16 單位重 1.553 kg/m):
      const unitWt5 = 1.553;
      const longBarsLen_m = +(N_long_bars * 1.0).toFixed(2);
      const anchorBarsLen_m = +(p.q_anchor_cnt * Lanc_m).toFixed(2);
      p.q_rebar_wt = +((longBarsLen_m + anchorBarsLen_m) * unitWt5).toFixed(2);
      p.formula_rebar_wt = `[${N_long_bars}-#5縱向筋(${longBarsLen_m.toFixed(1)}m) + #5錨筋(${p.q_anchor_cnt.toFixed(1)}支*L=${Lanc_m.toFixed(2)}m)] * 1.553kg/m`;

      // 6. 溝側回填碎石 (設計原則6：溝側應回填碎石，以免侵蝕而淘空溝側):
      p.q_gravel_vol = +(2 * wgrv_m * (t_m + 0.05) * 1.0).toFixed(2);
      p.formula_gravel_vol = `左右2側 * 寬(${wgrv_m.toFixed(2)}m) * 深(${(t_m + 0.05).toFixed(2)}m) * 1.00m`;

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
          rebarArc: '#facc15',
          rebarDot: '#facc15',
          groutHole: '#e879f9',
          meshWire: '#e2e8f0',
          concHatch: '#64748b',
          concFill: 'rgba(148, 163, 184, 0.14)',
          dimLine: '#22d3ee',
          dimText: '#67e8f9',
          leaderLine: '#22d3ee',
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
          rebarArc: '#b45309',
          rebarDot: '#d97706',
          groutHole: '#a21caf',
          meshWire: '#1e293b',
          concHatch: '#64748b',
          concFill: 'rgba(226, 232, 240, 0.55)',
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

    function cadCircle(ctx, cx, cy, r, color, width = 1.25, fill = null, dash = [], layer = '0') {
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

    function cadLeaderArrow(ctx, tx, ty, kx, ky, ex, ey, lines, pal, fontSize = 11.2) {
      cadLine(ctx, tx, ty, kx, ky, pal.leaderLine, 1.15, [], 'LEADER');
      if (Math.hypot(ex - kx, ey - ky) > 1) {
        cadLine(ctx, kx, ky, ex, ey, pal.leaderLine, 1.15, [], 'LEADER');
      }

      const dx = tx - kx, dy = ty - ky;
      const L = Math.hypot(dx, dy) || 1;
      const ux = dx / L, uy = dy / L;
      const nx = -uy, ny = ux;
      ctx.save();
      ctx.fillStyle = pal.leaderLine;
      ctx.beginPath();
      ctx.moveTo(tx, ty);
      ctx.lineTo(tx - ux * 7.5 + nx * 2.3, ty - uy * 7.5 + ny * 2.3);
      ctx.lineTo(tx - ux * 7.5 - nx * 2.3, ty - uy * 7.5 - ny * 2.3);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      const align = ex >= kx ? 'left' : 'right';
      const pad = ex >= kx ? 6 : -6;
      const arr = Array.isArray(lines) ? lines : [lines];
      arr.forEach((ln, idx) => {
        const yOff = (idx - (arr.length - 1) / 2) * (fontSize + 4);
        cadText(ctx, ln, ex + pad, ey + yOff, fontSize, pal.titleCyan, align, '600', 0, 'TEXT');
      });
    }

    function cadDim(ctx, x1, y1, x2, y2, offset, labelStr, pal, fontSize = 11.5) {
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

    // Helper: Draw a Grouted Drill Hole (鑽孔∅3.8cm 內灌1:3水泥砂漿，再插#5鋼筋，L=約100cm, matching DXF 11254..1147B)
    // Includes wavy borehole walls (magenta), central #5 anchor bar (yellow), and top 180° standard hook resting over a #5 longitudinal bar dot!
    function drawGroutedAnchorBar(ctx, topX, topY, lenPx, hookLeft, hasTargetCircle, pal) {
      const holeR = 3.6;
      const nSegs = 14;
      const stepY = lenPx / nSegs;
      const leftWallPts = [];
      const rightWallPts = [];

      for (let i = 0; i <= nSegs; i++) {
        const py = topY + 6 + i * stepY;
        const jitL = Math.sin(i * 2.1 + topX) * 0.9;
        const jitR = Math.cos(i * 1.9 + topX) * 0.9;
        leftWallPts.push([topX - holeR + jitL, py]);
        rightWallPts.push([topX + holeR + jitR, py]);
      }
      // Wavy borehole walls (matching DXF magenta lines 11254..112A0)
      cadPoly(ctx, leftWallPts, pal.groutHole, 1.05, false, null, [], 'BOREHOLE_WALL');
      cadPoly(ctx, rightWallPts, pal.groutHole, 1.05, false, null, [], 'BOREHOLE_WALL');
      // Bottom rounded tip of borehole (1127A, 112E3)
      cadPoly(ctx, [
        leftWallPts[nSegs],
        [topX, topY + 6 + lenPx + 2.5],
        rightWallPts[nSegs]
      ], pal.groutHole, 1.05, false, null, [], 'BOREHOLE_BOT');

      // Central #5 Anchor Rebar (11277, 112E0, 1132E) + Top Standard 180° Hook (1127D, 112A2, 112E8)
      const dir = hookLeft ? -1 : 1;
      const hookR = 4.2;
      cadLine(ctx, topX, topY - 2, topX, topY + 5 + lenPx, pal.rebarArc, 1.55, [], 'ANCHOR_REBAR');
      cadPoly(ctx, [
        [topX, topY - 2],
        [topX + dir * hookR, topY - 2 - hookR * 0.85],
        [topX + dir * hookR * 2.0, topY - 2],
        [topX + dir * hookR * 2.0, topY + 5]
      ], pal.rebarArc, 1.45, false, null, [], 'ANCHOR_HOOK');

      // Longitudinal #5 Rebar Dot cradled right inside the hook! (註：錨筋必須彎設標準彎鉤架於縱向鋼筋)
      const dotX = topX + dir * hookR * 1.02;
      const dotY = topY - 1.2;
      cadCircle(ctx, dotX, dotY, 2.3, pal.rebarDot, 1.1, pal.rebarDot, [], 'LONG_REBAR_DOT');

      if (hasTargetCircle) {
        cadCircle(ctx, dotX, dotY, 5.8, pal.dimLine, 1.15, null, [], 'REBAR_TARGET_CIRCLE');
      }

      return { dotX, dotY, midHoleX: topX, midHoleY: topY + lenPx * 0.55 };
    }

    // =========================================================================
    // 4. VIEW 1 & 2: 原圖【鍍鋅鐵絲網大樣圖】 (TOP-LEFT) & 原圖【拍漿溝斷面圖】 (BOTTOM-LEFT)
    //    100% Faithful to DXF Viewports 3 (`115A2`) & 2 (`9AA1`):
    //    - Top-Left: 鍍鋅鐵絲網大樣圖 (Exact DXF 3D Crimped Double-Line Woven Wire Mesh `11493..114D5`,
    //      callouts: 網目50mmx50mm (高度25mm±5mm，鍍鋅量不得不小於245g/m²) & 線徑∅2mm以上)
    //    - Bottom-Left: 拍漿溝斷面圖 (Stripped of natural terrain lines `113B7` & `1148C`!
    //      Shows W, H, t=15cm混凝土 with ANSI31 hatch `11336`, 二層鍍鋅立體鐵絲網,
    //      6-#5縱向鋼筋, 4 grouted anchor bars 鑽孔∅3.8cm內灌1:3水泥砂漿再插#5鋼筋L=約100cm,
    //      note: 註：錨筋必須彎設標準彎鉤架於縱向鋼筋, and 符號說明：W 溝寬 / H 溝深)
    // =========================================================================
    function drawWireMeshDetailAndCrossSection(ctx, ox, topY, p, pal) {
      // =====================================================================
      // PART A: 鍍鋅鐵絲網 大樣圖 (TOP-LEFT, 100% Exact DXF Entities 11493..114D9)
      //         Reconstructed from exact DXF coordinates:
      //         - Family 1 (4 double-line strands running bottom-left to top-right):
      //           Each strand goes up-right (+50, -16.5 in screen Y), then makes a 3D
      //           crimp step (+8.3, +5.6 in screen Y) with rounded bends, repeating 3 times!
      //         - Family 2 (4 double-line strands running top-left to bottom-right):
      //           Each strand goes down-right (+36, +22 in screen Y), then makes a 3D
      //           upward crimp step (+7.5, -7.2 in screen Y) at each intersection!
      // =====================================================================
      const meshOriginX = ox + 128;
      const meshOriginY = topY + 62;
      const ms = 1.18; // Scale factor for crisp CAD detail
      const wireThick = 2.3 * ms; // Double-line wire diameter (線徑∅2mm以上)

      // Helper to draw a smooth-cornered double-line 3D crimped wire strand
      const drawDoubleWireStrand = (spinePts, mainCol, subCol, layerName) => {
        if (spinePts.length < 2) return;
        // Compute offset polyline for the second parallel wire edge (representing ∅2mm wire thickness)
        const offsetPts = spinePts.map((pt, idx) => {
          const prev = spinePts[Math.max(0, idx - 1)];
          const next = spinePts[Math.min(spinePts.length - 1, idx + 1)];
          const dx = next[0] - prev[0];
          const dy = next[1] - prev[1];
          const len = Math.hypot(dx, dy) || 1;
          const nx = -dy / len;
          const ny = dx / len;
          return [pt[0] + nx * wireThick, pt[1] + ny * wireThick];
        });

        cadPoly(ctx, spinePts, mainCol, 1.4, false, null, [], layerName);
        cadPoly(ctx, offsetPts, subCol, 1.15, false, null, [], layerName + '_EDGE');
        // End caps of the ∅2mm wire strand
        cadLine(ctx, spinePts[0][0], spinePts[0][1], offsetPts[0][0], offsetPts[0][1], mainCol, 1.2);
        const lastIdx = spinePts.length - 1;
        cadLine(ctx, spinePts[lastIdx][0], spinePts[lastIdx][1], offsetPts[lastIdx][0], offsetPts[lastIdx][1], mainCol, 1.2);
      };

      // 1) Family 1: 4 Stepped/Crimped Double-Line Wire Strands (Bottom-Left to Top-Right, DXF 11493..114A8)
      //    Exact DXF progression per strand:
      //    Seg 1: dx = +46, dy = -15.5 (up-right)
      //    Crimp 1 (25±5mm 3D drop): dx = +8.2, dy = +6.2 (down-right step with rounded knees)
      //    Seg 2: dx = +46, dy = -15.5 (up-right)
      //    Crimp 2 (25±5mm 3D drop): dx = +8.2, dy = +6.2 (down-right step)
      //    Seg 3: dx = +40, dy = -13.5 (up-right)
      const nStrands1 = 4;
      let topMeshCalloutPt = [meshOriginX + 85, meshOriginY - 12];
      let botMeshCalloutPt = [meshOriginX + 75, meshOriginY + 62];

      for (let sIdx = 0; sIdx < nStrands1; sIdx++) {
        // Shift each parallel strand down-right along Family 2 direction
        const sx0 = meshOriginX + sIdx * (31 * ms);
        const sy0 = meshOriginY + sIdx * (21 * ms);

        const p0 = [sx0, sy0];
        const p1a = [sx0 + 42 * ms, sy0 - 14.2 * ms];
        const p1b = [sx0 + 44.5 * ms, sy0 - 14.0 * ms]; // Rounded top knee of crimp 1
        const p2a = [sx0 + 50.5 * ms, sy0 - 8.2 * ms];  // Bottom knee of 25mm 3D crimp 1
        const p2b = [sx0 + 53.0 * ms, sy0 - 8.4 * ms];
        const p3a = [sx0 + 95 * ms, sy0 - 22.6 * ms];
        const p3b = [sx0 + 97.5 * ms, sy0 - 22.4 * ms]; // Rounded top knee of crimp 2
        const p4a = [sx0 + 103.5 * ms, sy0 - 16.6 * ms]; // Bottom knee of 25mm 3D crimp 2
        const p4b = [sx0 + 106.0 * ms, sy0 - 16.8 * ms];
        const p5 = [sx0 + 142 * ms, sy0 - 29.0 * ms];

        const strand1Pts = [p0, p1a, p1b, p2a, p2b, p3a, p3b, p4a, p4b, p5];
        drawDoubleWireStrand(strand1Pts, pal.meshWire, pal.secondaryLine, `DXF_MESH_STRAND_A_${sIdx}`);

        if (sIdx === 0) {
          topMeshCalloutPt = p3a; // Exact target of DXF leader 114D8!
        }
      }

      // 2) Family 2: 4 Crossing Stepped/Crimped Double-Line Wire Strands (Top-Left to Bottom-Right, DXF 114A9..114D5)
      //    Weaving across Family 1 at the crimp knuckles with 3D vertical steps (height 25mm±5mm)!
      const nStrands2 = 4;
      for (let cIdx = 0; cIdx < nStrands2; cIdx++) {
        // Shift each crossing strand up-right along Family 1 direction
        const cx0 = meshOriginX + 14 * ms + cIdx * (44 * ms);
        const cy0 = meshOriginY - 12 * ms - cIdx * (9.5 * ms);

        const q0 = [cx0, cy0];
        const q1a = [cx0 + 26 * ms, cy0 + 18.5 * ms];
        const q1b = [cx0 + 28.2 * ms, cy0 + 18.2 * ms]; // Bottom knee before upward 3D crimp
        const q2a = [cx0 + 33.5 * ms, cy0 + 11.8 * ms]; // Upward 3D crimp step (height 25mm±5mm)
        const q2b = [cx0 + 35.8 * ms, cy0 + 12.2 * ms];
        const q3a = [cx0 + 62 * ms, cy0 + 30.8 * ms];
        const q3b = [cx0 + 64.2 * ms, cy0 + 30.5 * ms];
        const q4a = [cx0 + 69.5 * ms, cy0 + 24.2 * ms]; // Second upward 3D crimp step
        const q4b = [cx0 + 71.8 * ms, cy0 + 24.6 * ms];
        const q5 = [cx0 + 98 * ms, cy0 + 43.2 * ms];

        const strand2Pts = [q0, q1a, q1b, q2a, q2b, q3a, q3b, q4a, q4b, q5];
        drawDoubleWireStrand(strand2Pts, pal.meshWire, pal.dimLine, `DXF_MESH_STRAND_B_${cIdx}`);

        if (cIdx === 1) {
          botMeshCalloutPt = [q5[0] - 8 * ms, q5[1] - 4 * ms]; // Exact target of DXF leader 114D9!
        }
      }

      // Callout 1 on Wire Mesh Detail (`114D6` & `114D8`): 網目50mmx50mm / (高度25mm±5mm，鍍鋅量不得不小於245g/m²)
      cadLeaderArrow(
        ctx,
        topMeshCalloutPt[0], topMeshCalloutPt[1],
        topMeshCalloutPt[0] + 18, topMeshCalloutPt[1] - 22,
        topMeshCalloutPt[0] + 32, topMeshCalloutPt[1] - 22,
        ['網目50mmx50mm', '(高度25mm±5mm，鍍鋅量不得不小於245g/m²)'],
        pal, 11
      );

      // Callout 2 on Wire Mesh Detail (`114D7` & `114D9`): 線徑∅2mm以上
      cadLeaderArrow(
        ctx,
        botMeshCalloutPt[0], botMeshCalloutPt[1],
        botMeshCalloutPt[0] - 18, botMeshCalloutPt[1] + 22,
        botMeshCalloutPt[0] - 32, botMeshCalloutPt[1] + 22,
        ['線徑∅2mm以上'],
        pal, 11.2
      );

      // Title (`9AA4, 9AA9, 9AAA`): 鍍鋅鐵絲網 大樣圖
      const meshTitleY = meshOriginY + 92;
      const meshTitleX = ox + 135;
      cadText(ctx, '鍍鋅鐵絲網 大樣圖', meshTitleX, meshTitleY, 15.5, pal.titleCyan, 'center', '700');
      cadLine(ctx, meshTitleX - 72, meshTitleY + 9, meshTitleX + 72, meshTitleY + 9, pal.titleCyan, 1.4);
      cadLine(ctx, meshTitleX - 72, meshTitleY + 12.5, meshTitleX + 72, meshTitleY + 12.5, pal.titleCyan, 1.0);

      // =====================================================================
      // PART B: 拍漿溝 斷面圖 (BOTTOM-LEFT, 100% Matching DXF Entities 1124B..11EB8)
      //         (Natural terrain lines 113B7 & 1148C are 100% STRIPPED!)
      // =====================================================================
      const s = 1.95; // Scale: 1 cm = 1.95 px
      const W = p.W_cm * s;       // 90 * s
      const H = p.H_cm * s;       // 30 * s
      const t = p.t_cm * s;       // 15 * s
      const L_anc = p.L_anc_cm * s * 0.52; // Visual depth of 100cm anchor bar

      const cx = ox + 265;
      const yTop = meshTitleY + 68;       // Top rim of ditch inner curve
      const yInvert = yTop + H;           // Inner invert of ditch
      const yBotOuter = yInvert + t;      // Outer bottom of t=15cm concrete

      const xInL = cx - W / 2;
      const xInR = cx + W / 2;
      const xOutL = xInL - t * 0.95;
      const xOutR = xInR + t * 0.95;

      // 0) Ghost Baseline (Original W=90, H=30, t=15)
      if (showGhost) {
        const gW = 90 * s, gH = 30 * s;
        const gPts = [];
        for (let i = 0; i <= 24; i++) {
          const u = -1 + (i / 24) * 2;
          gPts.push([cx + u * (gW / 2), yTop + gH * (1 - (1 - u * u))]);
        }
        cadPoly(ctx, gPts, pal.ghostLine, 1.1, false, null, [4, 4], 'GHOST_DITCH');
      }

      // 1) Generate Inner Smooth Bowl Curve, 3D Corrugated Wire Mesh Curves, and Wavy Hand-Tamped Outer Concrete Boundary (`1135A` & `11336` in DXF)
      const nSeg = 48;
      const innerCurvePts = [];
      const meshCurve1Pts = [];
      const meshCurve2Pts = [];
      const mesh3DCrimp1Pts = [];
      const outerWavyPts = [];

      // Left rounded shoulder ear (`113BA`)
      innerCurvePts.push(
        [xOutL - 4, yTop + 6],
        [xOutL + 2, yTop - 2],
        [xInL, yTop]
      );

      for (let i = 0; i <= nSeg; i++) {
        const u = -1 + (i / nSeg) * 2; // -1 .. +1
        // Smooth U-bowl curve matching DXF arcs 1124C, 1124E, 11250, 113E4
        const depth = H * (1 - Math.pow(Math.abs(u), p.nExp));
        const ix = cx + u * (W / 2);
        const iy = yTop + depth;
        innerCurvePts.push([ix, iy]);

        // Normal vector pointing outward into concrete thickness t
        const dydx = (H * p.nExp * Math.pow(Math.abs(u), p.nExp - 1) * (u >= 0 ? -1 : 1)) / (W / 2);
        const nLen = Math.hypot(dydx, 1);
        const nx = dydx / nLen;
        const ny = 1 / nLen;

        // 2-Layer Galvanized 3D Wire Mesh curves (`1124B, 1124D, 1124F, 113ED`) + 3D corrugated crimp wave (25mm±5mm)
        const d1 = t * 0.22;
        const d2 = t * 0.44;
        const dCrimp = (i % 2 === 0) ? d1 : d2;
        meshCurve1Pts.push([ix + nx * d1, iy + ny * d1]);
        meshCurve2Pts.push([ix + nx * d2, iy + ny * d2]);
        mesh3DCrimp1Pts.push([ix + nx * dCrimp, iy + ny * dCrimp]);

        // Outer Wavy Hand-Plastered Concrete Boundary (`1135A` spline in DXF)
        const wave = Math.sin(i * 1.45) * 1.6;
        outerWavyPts.push([ix + nx * (t + wave), iy + ny * (t + wave)]);
      }

      // Right rounded shoulder ear (`1147E`)
      innerCurvePts.push(
        [xOutR - 2, yTop - 2],
        [xOutR + 4, yTop + 6]
      );

      const fullConcretePoly = [
        ...innerCurvePts,
        [xOutR + 8, yTop + 10],
        ...outerWavyPts.slice().reverse(),
        [xOutL - 8, yTop + 10]
      ];
      cadPoly(ctx, fullConcretePoly, pal.primaryLine, 1.65, true, pal.concFill, [], 'CONC_LINING_BODY');

      // ANSI31 45° Diagonal Section Hatch inside `t=15cm混凝土` (`11336` in DXF)
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(fullConcretePoly[0][0], fullConcretePoly[0][1]);
      for (let i = 1; i < fullConcretePoly.length; i++) {
        ctx.lineTo(fullConcretePoly[i][0], fullConcretePoly[i][1]);
      }
      ctx.closePath();
      ctx.clip();

      const hSpan = W + 2 * t + 60;
      for (let d = -hSpan; d <= hSpan; d += 11) {
        cadLine(ctx, cx + d - 120, yBotOuter + 20, cx + d + 120, yTop - 20, pal.concHatch, 0.8, [], 'ANSI31_HATCH');
      }
      ctx.restore();

      // 2) Draw Two Layers of Galvanized 3D Wire Mesh (`二層鍍鋅立體鐵絲網`, yellow bounding arcs + 3D corrugated wave inside concrete)
      cadPoly(ctx, meshCurve1Pts, pal.rebarArc, 1.35, false, null, [], 'WIRE_MESH_LAYER1');
      if (p.N_mesh_layers >= 2) {
        cadPoly(ctx, meshCurve2Pts, pal.rebarArc, 1.25, false, null, [], 'WIRE_MESH_LAYER2');
        cadPoly(ctx, mesh3DCrimp1Pts, pal.rebarArc, 0.9, false, null, [2, 2], 'WIRE_MESH_3D_CRIMP');
      }

      // 3) Draw 4 Grouted Anchor Bars (`鑽孔∅3.8cm 內灌1:3水泥砂漿，再插#5鋼筋，L=約100cm`) & `6-#5縱向鋼筋`
      //    Exact positions from DXF:
      //    - Outer Left Shoulder (`4951.5`), Mid-Slope Left (`4967.1`), Bottom-Left (`4984.2`),
      //    - Bottom-Right (`5016.3`), Mid-Slope Right (`5033.7`), Outer Right Shoulder (`5049.3`)
      const uAnchors = [-0.96, -0.66, -0.32, 0.32, 0.66, 0.96];
      const anchorInfos = [];

      uAnchors.forEach((uVal, idx) => {
        const depth = H * (1 - Math.pow(Math.abs(uVal), p.nExp));
        const ax = cx + uVal * (W / 2);
        const ay = yTop + depth + t * 0.28;
        const hookLeft = (uVal >= 0);
        const hasTarget = (idx === 1 || idx === 4); // Target circles `113AC` & `112E5` in DXF!
        const info = drawGroutedAnchorBar(ctx, ax, ay, L_anc, hookLeft, hasTarget, pal);
        anchorInfos.push(info);
      });

      // If user sets N_long_bars > 6, draw additional longitudinal #5 rebar dots along the curve
      if (p.N_long_bars > 6) {
        const extra = p.N_long_bars - 6;
        for (let k = 0; k < extra; k++) {
          const uEx = -0.15 + (k / Math.max(1, extra - 1)) * 0.30;
          const ex = cx + uEx * (W / 2);
          const ey = yTop + H + t * 0.30;
          cadCircle(ctx, ex, ey, 2.2, pal.rebarDot, 1.0, pal.rebarDot, [], 'EXTRA_LONG_REBAR');
        }
      }

      // 4) Dimensions on Cross-Section (`*D18` W & `*D17` H):
      cadDim(ctx, xInL, yTop, xInR, yTop, -24, `W (${p.W_cm}cm)`, pal, 11.5);

      // Center vertical depth dimension H (`*D17` at X=4994.5 in DXF)
      cadLine(ctx, cx - 18, yTop, cx + 6, yTop, pal.dimLine, 0.95);
      cadLine(ctx, cx - 18, yInvert, cx + 6, yInvert, pal.dimLine, 0.95);
      cadDim(ctx, cx - 10, yTop, cx - 10, yInvert, 0, `H (${p.H_cm})`, pal, 11.5);

      // 5) All 4 Callout Leaders on Cross-Section (100% Matching DXF `1148E, 1148D, 113B0/113B3, 11252/11253`):
      // (a) Top-Left Leader (`1148E` & `113B5`): t=15cm混凝土
      cadLeaderArrow(
        ctx,
        xOutL + 4, yTop + 2,
        xOutL - 22, yTop - 20,
        xOutL - 36, yTop - 20,
        [`t=${p.t_cm}cm混凝土`],
        pal, 11.5
      );

      // (b) Top-Right Leader (`1148D` & `1148F`): 二層鍍鋅立體鐵絲網
      cadLeaderArrow(
        ctx,
        xInR - 8, yTop + 8,
        xOutR + 18, yTop - 24,
        xOutR + 32, yTop - 24,
        [`${p.N_mesh_layers === 2 ? '二' : p.N_mesh_layers}層鍍鋅立體鐵絲網`],
        pal, 11.5
      );

      // (c) Dual-Branch Leader for `6-#5縱向鋼筋` (`113B0, 113B3, 113B1, 113B4` pointing from both target circles `113AC` & `112E5`!)
      const pTargetL = anchorInfos[1];
      const pTargetR = anchorInfos[4];
      const rKneeX = xOutR + 22;
      const rKneeY = yInvert + L_anc * 0.48;
      cadLine(ctx, pTargetL.dotX, pTargetL.dotY, rKneeX, rKneeY, pal.leaderLine, 1.1, [], 'LEADER_6_5_L');
      cadLine(ctx, pTargetR.dotX, pTargetR.dotY, rKneeX, rKneeY, pal.leaderLine, 1.1, [], 'LEADER_6_5_R');
      cadLine(ctx, rKneeX, rKneeY, rKneeX + 16, rKneeY, pal.leaderLine, 1.1, [], 'LEADER_6_5_SHELF');
      cadText(ctx, `${p.N_long_bars}-#5縱向鋼筋`, rKneeX + 22, rKneeY, 11.5, pal.titleCyan, 'left', '700');

      // (d) Dual-Branch Leader for `鑽孔∅3.8cm 內灌1:3水泥砂漿，再插#5鋼筋，L=約100cm` (`11252, 11253, 11251, 11492`)
      const pHoleL = anchorInfos[2];
      const pHoleR = anchorInfos[3];
      const hKneeX = cx + 48;
      const hKneeY = yBotOuter + L_anc + 18;
      cadLeaderArrow(ctx, pHoleL.midHoleX, pHoleL.midHoleY + 10, hKneeX, hKneeY, hKneeX + 16, hKneeY, [], pal);
      cadLeaderArrow(
        ctx,
        pHoleR.midHoleX, pHoleR.midHoleY + 10,
        hKneeX, hKneeY,
        hKneeX + 16, hKneeY,
        [`鑽孔∅3.8cm 內灌1:3水泥砂漿，`, `再插#5鋼筋，L=約${p.L_anc_cm}cm`],
        pal, 11.2
      );

      // (e) Bottom Note (`11633`): 註：錨筋必須彎設標準彎鉤架於縱向鋼筋
      const noteY = hKneeY + 26;
      cadText(ctx, '註：錨筋必須彎設標準彎鉤架於縱向鋼筋', cx + 35, noteY, 11.5, pal.titleCyan, 'center', '700');

      // (f) Symbol Legend Box on Bottom-Left (`11EB8`: 符號說明：W 溝寬 / H 溝深)
      const legX = ox + 10;
      const legY = yBotOuter + 24;
      cadPoly(ctx, [
        [legX, legY],
        [legX + 160, legY],
        [legX + 160, legY + 72],
        [legX, legY + 72]
      ], pal.tableBorder, 1.15, true, 'rgba(15, 23, 42, 0.88)', [], 'SYMBOL_LEGEND_11EB8');
      cadText(ctx, '符號說明：', legX + 12, legY + 18, 11.5, pal.titleCyan, 'left', '700');
      cadText(ctx, `W   溝寬 (${p.W_cm} cm)`, legX + 16, legY + 39, 10.8, pal.textMain, 'left', '600');
      cadText(ctx, `H   溝深 (${p.H_cm} cm)`, legX + 16, legY + 58, 10.8, pal.textMain, 'left', '600');

      // Section Title (`F7C0, F7C5, F7C6`): 斷面圖
      const secTitleY = noteY + 28;
      cadText(ctx, '斷面圖 (拍漿溝)', cx, secTitleY, 16, pal.titleCyan, 'center', '700');
      cadLine(ctx, cx - 62, secTitleY + 9, cx + 62, secTitleY + 9, pal.titleCyan, 1.4);
      cadLine(ctx, cx - 62, secTitleY + 12.5, cx + 62, secTitleY + 12.5, pal.titleCyan, 1.0);

      return {
        rightX: Math.max(rKneeX + 135, hKneeX + 235),
        bottomY: secTitleY + 24
      };
    }

    // =========================================================================
    // 5. VIEW 3 & 4 (MANDATORY SKILL RULE 1): 自動補齊之 1:1 對齊【俯視平面圖】與【縱斷面展開圖】
    //    - 俯視平面圖 (Top): 展示溝寬 W、兩側溝側回填碎石帶 (設計原則6)、二層鍍鋅立體鐵絲網 (50×50mm 網目)、
    //      6-#5 縱向鋼筋虛線、鑽孔 ∅3.8cm 插 #5 錨筋點位與彎鉤、以及水流方向
    //    - 縱斷面展開圖 (Bottom, 1:1 垂直對齊): 展示溝深 H、t=15cm 拍漿混凝土、二層鍍鋅鐵絲網、
    //      #5 縱向鋼筋、每隔 S_anc_cm 打設之鑽孔灌漿 #5 錨筋 (L=約100cm，頂端標準彎鉤架於縱向鋼筋)
    // =========================================================================
    function drawPlanAndLongitudinalViews(ctx, ox, topY, p, pal) {
      const s = 1.22;
      const L_draw_cm = 280;
      const L_draw = L_draw_cm * s;
      const W = p.W_cm * s;
      const t = p.t_cm * s;
      const wGrv = p.w_gravel_cm * s;

      const x0 = ox + 55;
      const x1 = x0 + L_draw;

      // =====================================================================
      // PART A: 拍漿溝俯視平面圖 (TOP PLAN VIEW)
      // =====================================================================
      const yPlanGrvTop = topY + 46;
      const yPlanOutTop = yPlanGrvTop + wGrv;
      const yPlanInTop = yPlanOutTop + t * 0.85;
      const yPlanMid = yPlanInTop + W / 2;
      const yPlanInBot = yPlanInTop + W;
      const yPlanOutBot = yPlanInBot + t * 0.85;
      const yPlanGrvBot = yPlanOutBot + wGrv;

      // 1) Left & Right Gravel Backfill Strips (設計原則6：溝側應回填碎石，以免侵蝕而淘空溝側)
      cadPoly(ctx, [[x0, yPlanGrvTop], [x1, yPlanGrvTop], [x1, yPlanOutTop], [x0, yPlanOutTop]], pal.secondaryLine, 1.1, true, 'rgba(148, 163, 184, 0.12)', [4, 3], 'PLAN_GRAVEL_L');
      cadPoly(ctx, [[x0, yPlanOutBot], [x1, yPlanOutBot], [x1, yPlanGrvBot], [x0, yPlanGrvBot]], pal.secondaryLine, 1.1, true, 'rgba(148, 163, 184, 0.12)', [4, 3], 'PLAN_GRAVEL_R');

      for (let gx = x0 + 12; gx < x1 - 10; gx += 18) {
        cadCircle(ctx, gx, (yPlanGrvTop + yPlanOutTop) / 2, 2.2, pal.secondaryLine, 0.85);
        cadCircle(ctx, gx + 6, (yPlanOutBot + yPlanGrvBot) / 2, 2.2, pal.secondaryLine, 0.85);
      }

      // 2) Main Plastered Concrete Ditch Body in Plan View
      cadPoly(ctx, [[x0, yPlanOutTop], [x1, yPlanOutTop], [x1, yPlanOutBot], [x0, yPlanOutBot]], pal.primaryLine, 1.5, true, pal.concFill, [], 'PLAN_CONC_OUTER');
      cadLine(ctx, x0, yPlanInTop, x1, yPlanInTop, pal.primaryLine, 1.3, [], 'PLAN_IN_TOP');
      cadLine(ctx, x0, yPlanInBot, x1, yPlanInBot, pal.primaryLine, 1.3, [], 'PLAN_IN_BOT');

      // 3) 50x50mm 3D Galvanized Wire Mesh Diamond Window in Plan View
      const meshWinX0 = x0 + L_draw * 0.12;
      const meshWinX1 = x0 + L_draw * 0.44;
      ctx.save();
      ctx.beginPath();
      ctx.rect(meshWinX0, yPlanInTop + 4, meshWinX1 - meshWinX0, W - 8);
      ctx.clip();
      const mStep = 12;
      for (let d = -W; d < (meshWinX1 - meshWinX0) + W; d += mStep) {
        cadLine(ctx, meshWinX0 + d, yPlanInTop, meshWinX0 + d + W, yPlanInBot, pal.meshWire, 0.75, [], 'PLAN_MESH_1');
        cadLine(ctx, meshWinX0 + d + W, yPlanInTop, meshWinX0 + d, yPlanInBot, pal.meshWire, 0.75, [], 'PLAN_MESH_2');
      }
      ctx.restore();

      // 4) `6-#5` Longitudinal Rebar Lines & Grouted `#5` Anchor Dowel Dots (@S_anc_cm)
      const spAncPx = p.S_anc_cm * s;
      const nLong = p.N_long_bars;
      const longYs = [];
      for (let i = 0; i < nLong; i++) {
        const ly = yPlanOutTop + 6 + (i / (nLong - 1)) * (yPlanOutBot - yPlanOutTop - 12);
        longYs.push(ly);
        cadLine(ctx, x0 + 4, ly, x1 - 4, ly, pal.rebarArc, 1.0, [6, 4], 'PLAN_LONG_REBAR');
      }

      for (let ax = x0 + spAncPx * 0.45; ax < x1 - 12; ax += spAncPx) {
        [0, 1, nLong - 2, nLong - 1].forEach((idx) => {
          const ay = longYs[Math.min(longYs.length - 1, idx)];
          // Borehole ∅3.8cm circle (magenta) + #5 anchor hook (yellow)
          cadCircle(ctx, ax, ay, 4.2, pal.groutHole, 1.15, '#0b1120', [], 'PLAN_BOREHOLE');
          cadCircle(ctx, ax, ay, 1.8, pal.rebarDot, 1.0, pal.rebarDot, [], 'PLAN_ANCHOR_BAR');
        });
      }

      // Flow Arrow on Plan View
      const flwX1 = x0 + L_draw * 0.60, flwX2 = x0 + L_draw * 0.84;
      cadLine(ctx, flwX1, yPlanMid, flwX2, yPlanMid, pal.dimLine, 1.7, [], 'FLOW_ARROW');
      cadPoly(ctx, [[flwX2 - 7, yPlanMid - 3.5], [flwX2 - 7, yPlanMid + 3.5], [flwX2, yPlanMid]], pal.dimLine, 1.2, true, pal.dimLine);
      cadText(ctx, '水流方向 (總長<50m)', (flwX1 + flwX2) / 2, yPlanMid - 12, 10.5, pal.titleCyan, 'center', '700');

      // Dimensions on Plan View
      cadDim(ctx, x0, yPlanGrvTop, x1, yPlanGrvTop, -20, `平面展示長 ${L_draw_cm}cm (錨筋間距@${p.S_anc_cm}cm・溝側回填碎石${p.w_gravel_cm}cm)`, pal, 10.5);
      cadDim(ctx, x0, yPlanInTop, x0, yPlanInBot, -22, `W (${p.W_cm})`, pal, 11);

      const planTitleY = yPlanGrvBot + 28;
      cadText(ctx, '拍漿溝俯視平面圖 (自動補齊・1:1對齊)', (x0 + x1) / 2, planTitleY, 15, pal.titleCyan, 'center', '700');
      cadLine(ctx, (x0 + x1) / 2 - 130, planTitleY + 9, (x0 + x1) / 2 + 130, planTitleY + 9, pal.titleCyan, 1.3);

      // =====================================================================
      // PART B: 拍漿溝縱斷面展開圖 (LONGITUDINAL PROFILE - 1:1 ALIGNED BELOW PLAN)
      // =====================================================================
      const yProfTop = planTitleY + 50;
      const H_px = p.H_cm * s * 1.25;
      const t_px = p.t_cm * s * 1.25;
      const Lanc_px = p.L_anc_cm * s * 0.65;

      const yProfInv = yProfTop + H_px;
      const yProfBot = yProfInv + t_px;

      // 1:1 Vertical Alignment Guides between Plan View and Profile View
      [x0, x1].forEach((gx) => {
        cadLine(ctx, gx, yPlanGrvBot + 4, gx, yProfTop - 8, pal.secondaryLine, 0.8, [4, 4], 'ALIGN_GUIDE');
      });

      // 1) Side Wall Elevation Background & Bottom t=15cm Concrete Slab in Longitudinal Profile
      cadPoly(ctx, [[x0, yProfTop], [x1, yProfTop], [x1, yProfInv], [x0, yProfInv]], pal.primaryLine, 1.3, true, 'rgba(30, 41, 59, 0.40)', [], 'PROF_WALL_BG');
      cadPoly(ctx, [[x0, yProfInv], [x1, yProfInv], [x1, yProfBot], [x0, yProfBot]], pal.primaryLine, 1.5, true, pal.concFill, [], 'PROF_SLAB_T');

      // ANSI31 Hatch inside bottom t=15cm concrete slab
      for (let hx = x0 + 12; hx < x1 - 10; hx += 14) {
        cadLine(ctx, hx, yProfBot, hx + t_px * 0.85, yProfInv, pal.concHatch, 0.8, [], 'PROF_ANSI31');
      }

      // 2) Two Layers of Galvanized 3D Wire Mesh & Longitudinal #5 Rebar in Profile
      cadLine(ctx, x0, yProfInv + t_px * 0.28, x1, yProfInv + t_px * 0.28, pal.rebarArc, 1.3, [6, 3], 'PROF_MESH_1');
      cadLine(ctx, x0, yProfInv + t_px * 0.48, x1, yProfInv + t_px * 0.48, pal.rebarArc, 1.15, [3, 3], 'PROF_MESH_2');
      cadLine(ctx, x0, yProfInv + t_px * 0.38, x1, yProfInv + t_px * 0.38, pal.rebarDot, 1.5, [], 'PROF_LONG_BAR');

      // 3) Grouted Boreholes (∅3.8cm) & #5 Anchor Dowels (L=100cm) spaced at S_anc_cm
      for (let ax = x0 + spAncPx * 0.45; ax < x1 - 12; ax += spAncPx) {
        drawGroutedAnchorBar(ctx, ax, yProfInv + t_px * 0.38, Lanc_px, true, false, pal);
      }

      // Dimensions on Longitudinal Profile
      cadDim(ctx, x0, yProfTop, x0, yProfInv, -22, `H (${p.H_cm})`, pal, 10.5);
      cadDim(ctx, x0, yProfInv, x0, yProfBot, -22, `t (${p.t_cm})`, pal, 10.5);
      cadDim(ctx, x1, yProfInv + t_px * 0.38, x1, yProfInv + t_px * 0.38 + Lanc_px, 22, `錨筋L=${p.L_anc_cm}`, pal, 10.5);

      const profTitleY = yProfInv + t_px * 0.38 + Lanc_px + 28;
      cadText(ctx, '拍漿溝縱斷面展開圖 (自動補齊)', (x0 + x1) / 2, profTitleY, 15, pal.titleCyan, 'center', '700');
      cadLine(ctx, (x0 + x1) / 2 - 115, profTitleY + 9, (x0 + x1) / 2 + 115, profTitleY + 9, pal.titleCyan, 1.3);

      return {
        rightX: x1 + 65,
        bottomY: profTitleY + 24
      };
    }

    // =========================================================================
    // 6. VIEW 5: EXPLICIT FIGURE-NUMBER QUANTITY TABLE ON CANVAS
    // =========================================================================
    function drawExplicitFormulaTableOnCanvas(ctx, ox, oy, p, pal) {
      cadText(
        ctx,
        `【拍漿溝 (圖號 0508-1 / 062) 每公尺數量計算式表 — 採用圖面標註數字顯式列式 (溝寬W=${p.W_cm}cm・溝深H=${p.H_cm}cm・t=${p.t_cm}cm・全段=${p.L_tot_m.toFixed(1)}m)】`,
        ox, oy - 15, 13.0, pal.dimText, 'left', '700'
      );

      const colW = [250, 495, 82, 92, 52];
      const rowH = 26;
      const rows = [
        ['工程項目名稱 (依DXF圖面標註)', '採用圖面標註數字之顯式計算式 (每公尺基準)', '每m數量', `全段(${p.L_tot_m}m)`, '單位'],
        [`拍漿混凝土襯砌 (t=${p.t_cm}cm混凝土, 拍附整平)`, p.formula_conc_vol, p.q_conc_vol.toFixed(2), (p.q_conc_vol * p.L_tot_m).toFixed(2), 'M³'],
        [`${p.N_mesh_layers}層鍍鋅立體鐵絲網 (網目50×50mm, ∅2mm以上)`, p.formula_mesh_area, p.q_mesh_area.toFixed(2), (p.q_mesh_area * p.L_tot_m).toFixed(1), 'M²'],
        [`鑽孔∅3.8cm內灌1:3水泥砂漿插#5錨筋 (L=${p.L_anc_cm}cm)`, p.formula_anchor_cnt, p.q_anchor_cnt.toFixed(1), (p.q_anchor_cnt * p.L_tot_m).toFixed(0), '支'],
        [`#5鋼筋加工及組立 (${p.N_long_bars}-#5縱向筋 + #5彎鉤錨筋)`, p.formula_rebar_wt, p.q_rebar_wt.toFixed(2), (p.q_rebar_wt * p.L_tot_m).toFixed(1), 'kg'],
        [`溝側回填碎石 (寬${p.w_gravel_cm}cm, 防淘空溝側)`, p.formula_gravel_vol, p.q_gravel_vol.toFixed(2), (p.q_gravel_vol * p.L_tot_m).toFixed(2), 'M³']
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
          const color = isHeader ? pal.textMain : (cIdx === 2 ? pal.dimText : (cIdx === 3 ? pal.rebarArc : pal.textSub));
          cadText(ctx, cellStr, tx, ry, isHeader ? 11.2 : 10.6, color, align, (isHeader || cIdx === 2 || cIdx === 3) ? '700' : '500');
          cx += cw;
        });
      });

      return { bottomY: oy + totH };
    }

    // =========================================================================
    // 7. MAIN RENDER ENGINE & LIVE UI UPDATER
    // =========================================================================
    function updateSidebarSummary(p) {
      document.getElementById('stat_ditch_tag').textContent = `W=${p.W_cm}・H=${p.H_cm}・t=${p.t_cm}cm`;
      document.getElementById('stat_conc_m').textContent = `${p.q_conc_vol.toFixed(2)} M³/m`;
      document.getElementById('stat_mesh_m').textContent = `${p.q_mesh_area.toFixed(2)} M²/m`;
      document.getElementById('stat_anchor_m').textContent = `${p.q_anchor_cnt.toFixed(1)} 支/m`;
      document.getElementById('stat_rebar_m').textContent = `${p.q_rebar_wt.toFixed(2)} kg/m`;
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

      if (currentView === 'SEC_MESH') {
        const bSM = drawWireMeshDetailAndCrossSection(ctx, 40, 12, p, pal);
        drawExplicitFormulaTableOnCanvas(ctx, 40, bSM.bottomY + 38, p, pal);
      } else if (currentView === 'PLAN_PROF') {
        const bPP = drawPlanAndLongitudinalViews(ctx, 50, 12, p, pal);
        drawExplicitFormulaTableOnCanvas(ctx, 45, bPP.bottomY + 38, p, pal);
      } else {
        // 'ALL' Full Standard Sheet Layout (Matching A3 Layout 5-08 of DXF):
        // - Left Column: 鍍鋅鐵絲網大樣圖 (Top) + 拍漿溝斷面圖 (Bottom) + 符號說明 (W, H)
        // - Right Column: 自動補齊之 1:1 對齊【俯視平面圖】與【縱斷面展開圖】
        // - Bottom Full-Width: 圖面標註數字顯式計算式表
        const bSM = drawWireMeshDetailAndCrossSection(ctx, 20, 10, p, pal);
        const rightColX = bSM.rightX + 30;
        const bPP = drawPlanAndLongitudinalViews(ctx, rightColX, 10, p, pal);

        const tableY = Math.max(bSM.bottomY, bPP.bottomY) + 38;
        drawExplicitFormulaTableOnCanvas(ctx, 30, tableY, p, pal);
      }

      ctx.restore();
    }

    // =========================================================================
    // 8. UI CONTROLS, AUTO-SYNC & DXF / CSV EXPORTERS
    // =========================================================================
    function stepVal(inputId, delta) {
      const el = document.getElementById(inputId);
      if (!el) return;
      const minV = parseFloat(el.min) || 2;
      const maxV = parseFloat(el.max) || 12;
      const curV = Math.round(parseFloat(el.value) || minV);
      el.value = Math.max(minV, Math.min(maxV, curV + delta));
      renderAll();
    }

    function onGeomChange() {
      renderAll();
    }

    function resetToOrig() {
      Object.keys(ORIG_PLASTERED_DITCH).forEach(k => {
        const el = document.getElementById('inp_' + k);
        if (el) el.value = ORIG_PLASTERED_DITCH[k];
      });
      renderAll();
    }

    function switchView(view) {
      currentView = view;
      const specEl = document.getElementById('specPanel');
      const tabs = {
        ALL: document.getElementById('tab-all'),
        SEC_MESH: document.getElementById('tab-sec'),
        PLAN_PROF: document.getElementById('tab-plan-prof'),
        SPEC: document.getElementById('tab-spec')
      };
      Object.keys(tabs).forEach(k => {
        if (!tabs[k]) return;
        tabs[k].className = (k === view)
          ? 'px-3 py-1.5 rounded-md text-xs font-semibold transition-all bg-cyan-600 text-white shadow'
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
        ? 'px-2.5 py-1 rounded bg-cyan-950/90 border border-cyan-600/60 text-xs text-cyan-300 flex items-center gap-1 transition'
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
      if (currentView === 'SEC_MESH') {
        viewCam.scale = Math.min(rect.width / 1060, rect.height / 940) * 0.93;
        viewCam.offsetX = Math.max(25, (rect.width - 1000 * viewCam.scale) / 2);
        viewCam.offsetY = 14;
      } else if (currentView === 'PLAN_PROF') {
        viewCam.scale = Math.min(rect.width / 1040, rect.height / 900) * 0.93;
        viewCam.offsetX = Math.max(25, (rect.width - 980 * viewCam.scale) / 2);
        viewCam.offsetY = 14;
      } else {
        viewCam.scale = Math.min(rect.width / 1460, rect.height / 980) * 0.94;
        viewCam.offsetX = Math.max(20, (rect.width - 1400 * viewCam.scale) / 2);
        viewCam.offsetY = 12;
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
      a.download = `拍漿溝標準圖_0508-1_W${p.W_cm}_H${p.H_cm}cm_含補齊平縱面.dxf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }

    function exportCSV() {
      const p = getParams();
      const rows = [
        [`拍漿溝標準圖 (圖號 0508-1 / 062・溝寬W=${p.W_cm}cm・溝深H=${p.H_cm}cm・混凝土t=${p.t_cm}cm) - 圖面標註數字顯式列式數量計算書`],
        ['工程項目名稱', '採用圖面標註數字之顯式計算式 (每公尺基準)', '每公尺數量', `全段數量(${p.L_tot_m}m)`, '單位'],
        [`拍漿混凝土襯砌 (t=${p.t_cm}cm混凝土, 拍附整平)`, `'${p.formula_conc_vol}`, p.q_conc_vol.toFixed(2), (p.q_conc_vol * p.L_tot_m).toFixed(2), 'M³'],
        [`${p.N_mesh_layers}層鍍鋅立體鐵絲網 (網目50×50mm, ∅2mm以上)`, `'${p.formula_mesh_area}`, p.q_mesh_area.toFixed(2), (p.q_mesh_area * p.L_tot_m).toFixed(1), 'M²'],
        [`鑽孔∅3.8cm內灌1:3水泥砂漿插#5錨筋 (L=${p.L_anc_cm}cm)`, `'${p.formula_anchor_cnt}`, p.q_anchor_cnt.toFixed(1), (p.q_anchor_cnt * p.L_tot_m).toFixed(0), '支'],
        [`#5鋼筋加工及組立 (${p.N_long_bars}-#5縱向筋 + #5彎鉤錨筋)`, `'${p.formula_rebar_wt}`, p.q_rebar_wt.toFixed(2), (p.q_rebar_wt * p.L_tot_m).toFixed(1), 'kg'],
        [`溝側回填碎石 (寬${p.w_gravel_cm}cm, 防淘空溝側)`, `'${p.formula_gravel_vol}`, p.q_gravel_vol.toFixed(2), (p.q_gravel_vol * p.L_tot_m).toFixed(2), 'M³']
      ];

      const csvContent = '\uFEFF' + rows.map(r => r.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `拍漿溝顯式列式計算書_0508-1_W${p.W_cm}xH${p.H_cm}.csv`;
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

  const STRIP = s => String(s).replace(/\s*[（(]\s*圖號[^）)]*[）)]/g, '').replace(/\s*[（(]\s*\d{4}-\d\s*[/／]\s*\d{3}\s*[）)]/g, '').replace(/\s*圖號\s*[：:]?\s*[0-9A-Za-z#\-／/ ]+/g, ' ');
  function params(R) { Object.keys(R || {}).forEach(k => { el('inp_' + k).value = String(R[k]); }); return getParams(); }
  function run(R, OV) {
    O = []; const PAL = getPalette(), p = params(R); Object.assign(p, R || {}, OV || {});
    const bSM = drawWireMeshDetailAndCrossSection(CTX, 20, 10, p, PAL), bPP = drawPlanAndLongitudinalViews(CTX, bSM.rightX + 30, 10, p, PAL); drawExplicitFormulaTableOnCanvas(CTX, 30, Math.max(bSM.bottomY, bPP.bottomY) + 38, p, PAL);
    O = O.filter(o => !['ANSI31_HATCH'].includes(o.ly));
    const sc = 1 / 1.95; return O.map(o => { const r = Object.assign({}, o); if (r.p) r.p = r.p.map(([x, y]) => [x * sc, y * sc]); if (r.x !== undefined) { r.x *= sc; r.y *= sc; } if (r.r) r.r *= sc; if (r.h) r.h *= sc; if (r.s !== undefined && r.k === 'T') r.s = STRIP(r.s); return r; });
  }
  return { run, params };
})();
TCO_D['bl1'] = (function () {
  let O = [];
  const EL = {}, CTX = new Proxy({}, { get: (t, k) => (k in t ? t[k] : () => ({ width: 0 })), set: (t, k, v) => { t[k] = v; return true; } });
  const el = id => EL[id] || (EL[id] = { value: '', textContent: '', innerHTML: '', className: '', style: {}, classList: { add() {}, remove() {}, toggle() {} }, addEventListener() {}, getContext: () => CTX, parentElement: { getBoundingClientRect: () => ({ width: 100, height: 100 }) } });
  const document = { getElementById: el, querySelectorAll: () => [], querySelector: () => null, createElement: () => ({ click() {}, style: {} }), body: { appendChild() {}, removeChild() {}, classList: { add() {}, remove() {}, toggle() {}, contains: () => false } }, documentElement: { classList: { contains: () => false, add() {}, remove() {}, toggle() {} } }, addEventListener() {} };
  const window = { addEventListener() {}, devicePixelRatio: 1, matchMedia: () => ({ matches: false, addEventListener() {} }) };

    // =========================================================================
    // 1. ORIGINAL DXF BASELINE CONSTANTS & GLOBAL STATE (PURE ASCII IDENTIFIERS)
    // =========================================================================
    const ORIG_PLASTIC_BLIND_DITCH = {
      B1_cm: 50,
      B2_cm: 30,
      t1_cm: 10,
      h1_cm: 15,
      h2_cm: 20,
      H_cm: 50,
      W_core_cm: 20,
      slope_pct: 2.0,
      L_prof_cm: 250,
      L_tot_m: 30.0
    };

    let currentView = 'ALL'; // 'ALL', 'SECTIONS', 'PROF_PLAN', 'SPEC'
    let showGhost = false;
    let isDarkTheme = true;

    let viewCam = {
      scale: 0.72,
      offsetX: 28,
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

      const B1_cm = Math.max(35, Math.min(150, Math.round(num('inp_B1_cm', 50))));
      const B2_cm = Math.max(20, Math.min(B1_cm, Math.round(num('inp_B2_cm', 30))));
      const t1_cm = Math.max(5, Math.min(40, Math.round(num('inp_t1_cm', 10))));
      const h1_cm = Math.max(10, Math.min(40, Math.round(num('inp_h1_cm', 15))));
      const h2_cm = Math.max(10, Math.min(60, Math.round(num('inp_h2_cm', 20))));
      const H_cm = 2 * h1_cm + h2_cm; // 15 + 20 + 15 = 50 cm

      const elH = document.getElementById('inp_H_cm');
      if (elH) elH.value = H_cm;

      const W_core_cm = Math.max(12, Math.min(B2_cm - 4, Math.round(num('inp_W_core_cm', 20))));
      const slope_pct = Math.max(1.0, Math.min(15.0, +num('inp_slope_pct', 2.0).toFixed(1)));
      const L_prof_cm = Math.max(150, Math.min(500, Math.round(num('inp_L_prof_cm', 250))));
      const L_tot_m = Math.max(5.0, Math.min(200.0, num('inp_L_tot_m', 30.0)));

      const p = {
        B1_cm,
        B2_cm,
        t1_cm,
        h1_cm,
        h2_cm,
        H_cm,
        W_core_cm,
        slope_pct,
        L_prof_cm,
        L_tot_m
      };

      const B1_m = +(B1_cm / 100).toFixed(2);
      const B2_m = +(B2_cm / 100).toFixed(2);
      const t1_m = +(t1_cm / 100).toFixed(2);
      const h1_m = +(h1_cm / 100).toFixed(2);
      const h2_m = +(h2_cm / 100).toFixed(2);
      const H_m = +(H_cm / 100).toFixed(2);
      const Wcore_m = +(W_core_cm / 100).toFixed(2);

      // 1. 梯形盲溝總開挖土方 (含原土回填層 t1 + 盲溝深 H):
      const H_tot_m = +(H_m + t1_m).toFixed(2);
      const slopeHoriz = +((B1_m - B2_m) / 2).toFixed(2);
      const B_surface_m = +(B1_m + 2 * slopeHoriz * (t1_m / H_m)).toFixed(2);
      p.q_excav_vol = +(((B_surface_m + B2_m) / 2) * H_tot_m * 1.0).toFixed(2);
      p.formula_excav_vol = `[(溝頂B1=${B1_m.toFixed(2)}m + 溝底B2=${B2_m.toFixed(2)}m)/2 * (溝深H=${H_m.toFixed(2)}m + 回填厚t1=${t1_m.toFixed(2)}m)] * 1.00m`;

      // 2. 頂層原土回填 (厚 t1 = 10cm):
      p.q_backfill_vol = +(B1_m * t1_m * 1.0).toFixed(2);
      p.formula_backfill_vol = `溝頂寬B1(${B1_m.toFixed(2)}m) * 原土回填厚t1(${t1_m.toFixed(2)}m) * 1.00m`;

      // 3. 中央不織布土石籠核心卵塊石 (寬 W_core × 高 h2):
      p.q_core_gabion = +(Wcore_m * h2_m * 1.0).toFixed(2);
      p.formula_core_gabion = `中央土石籠寬(${Wcore_m.toFixed(2)}m) * 盲溝厚層h2(${h2_m.toFixed(2)}m) * 1.00m`;

      // 4. 外圍碎石級配濾料 (梯形總斷面扣除中央土石籠核心):
      const trapFilterArea = +(((B1_m + B2_m) / 2) * H_m).toFixed(3); // (0.50+0.30)/2 * 0.50 = 0.200 m2
      p.q_gravel_outer = Math.max(0.05, +(trapFilterArea - p.q_core_gabion).toFixed(2));
      p.formula_gravel_outer = `[梯形斷面(${B1_m.toFixed(2)}+${B2_m.toFixed(2)})/2 * H(${H_m.toFixed(2)}m) = ${trapFilterArea.toFixed(2)}M²] - 中央土石籠(${p.q_core_gabion.toFixed(2)}M²)`;

      // 5. 透水不織布包覆面積 (外圈梯形槽包覆 + 中央土石籠不織布包覆):
      const sideSlope_m = +Math.hypot((B1_m - B2_m) / 2, H_m).toFixed(2);
      const outerGeoPerim = +(B2_m + 2 * sideSlope_m + B1_m).toFixed(2);
      const innerCorePerim = +(2 * (Wcore_m + h2_m) + 0.12).toFixed(2);
      p.q_geo_area = +((outerGeoPerim + innerCorePerim) * 1.0).toFixed(2);
      p.formula_geo_area = `[外槽包覆(B2=${B2_m.toFixed(2)}+兩側斜邊${(2*sideSlope_m).toFixed(2)}+頂${B1_m.toFixed(2)}=${outerGeoPerim.toFixed(2)}m) + 內籠包覆(2*(${Wcore_m.toFixed(2)}+${h2_m.toFixed(2)})+搭接0.12=${innerCorePerim.toFixed(2)}m)] * 1.00m`;

      // 6. 基層土壤壓實 (壓實度應達 80% 以上):
      p.q_compact_area = +(B2_m + 2 * sideSlope_m).toFixed(2);
      p.formula_compact_area = `[溝底寬B2(${B2_m.toFixed(2)}m) + 兩側開挖斜邊(2*${sideSlope_m.toFixed(2)}m)] * 1.00m (壓實度≧80%)`;

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
          structYellow: '#facc15',
          gravelStroke: '#f59e0b',
          gravelFill: 'rgba(245, 158, 11, 0.16)',
          sandDots: '#cbd5e1',
          hboneLine: '#94a3b8',
          pipeMesh: '#22c55e',
          pipeImpervious: '#38bdf8',
          geoDash: '#e879f9',
          dimLine: '#22d3ee',
          dimText: '#67e8f9',
          leaderLine: '#22d3ee',
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
          structYellow: '#b45309',
          gravelStroke: '#c2410c',
          gravelFill: 'rgba(251, 191, 36, 0.25)',
          sandDots: '#475569',
          hboneLine: '#64748b',
          pipeMesh: '#15803d',
          pipeImpervious: '#0284c7',
          geoDash: '#a21caf',
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

    function cadCircle(ctx, cx, cy, r, color, width = 1.25, fill = null, dash = [], layer = '0') {
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

    function cadLeaderArrow(ctx, tx, ty, kx, ky, ex, ey, lines, pal, fontSize = 11.0, useDot = false) {
      cadLine(ctx, tx, ty, kx, ky, pal.leaderLine, 1.15, [], 'LEADER');
      if (Math.hypot(ex - kx, ey - ky) > 1) {
        cadLine(ctx, kx, ky, ex, ey, pal.leaderLine, 1.15, [], 'LEADER');
      }

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
        ctx.lineTo(tx - ux * 7.2 + nx * 2.2, ty - uy * 7.2 + ny * 2.2);
        ctx.lineTo(tx - ux * 7.2 - nx * 2.2, ty - uy * 7.2 - ny * 2.2);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }

      const align = ex >= kx ? 'left' : 'right';
      const pad = ex >= kx ? 6 : -6;
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
      const gap = 4.0;
      const extOver = 4.5;

      const sx1 = x1 + nx * gap, sy1 = y1 + ny * gap;
      const ex1 = x1 + nx * (absOff + extOver), ey1 = y1 + ny * (absOff + extOver);
      const sx2 = x2 + nx * gap, sy2 = y2 + ny * gap;
      const ex2 = x2 + nx * (absOff + extOver), ey2 = y2 + ny * (absOff + extOver);

      const dx1 = x1 + nx * absOff, dy1 = y1 + ny * absOff;
      const dx2 = x2 + nx * absOff, dy2 = y2 + ny * absOff;

      if (absOff > 3) {
        cadLine(ctx, sx1, sy1, ex1, ey1, pal.dimLine, 0.9, [], 'DIM');
        cadLine(ctx, sx2, sy2, ex2, ey2, pal.dimLine, 0.9, [], 'DIM');
      }

      const mx = (dx1 + dx2) / 2, my = (dy1 + dy2) / 2;
      const textGap = Math.max(String(labelStr).length * fontSize * 0.60 + 6, 18);

      if (L > textGap + 10) {
        cadLine(ctx, dx1, dy1, mx - ux * (textGap / 2), my - uy * (textGap / 2), pal.dimLine, 1.0, [], 'DIM');
        cadLine(ctx, mx + ux * (textGap / 2), my + uy * (textGap / 2), dx2, dy2, pal.dimLine, 1.0, [], 'DIM');
      } else {
        cadLine(ctx, dx1, dy1, dx2, dy2, pal.dimLine, 1.0, [], 'DIM');
      }

      const aL = Math.min(5.5, L * 0.25), aW = 1.8;
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

    // Helper: Draw Subgrade Compaction Hatch `B002` (matching DXF block `14F61` / `12086`)
    function drawSubgradeCompactionSymbol(ctx, x, y, pal) {
      for (let g = 0; g < 2; g++) {
        const gx = x + g * 12;
        for (let k = 0; k < 3; k++) {
          cadLine(ctx, gx + k * 2.8, y, gx + k * 2.8 - 4.0, y + 4.5, pal.secondaryLine, 1.0, [], 'B002_HATCH');
          cadLine(ctx, gx + 4.2 + k * 2.5, y + 4.5, gx + 7.2 + k * 2.5, y + 1.4, pal.secondaryLine, 1.0, [], 'B002_HATCH');
        }
      }
    }

    // Helper: Fill Top Backfill Rectangle with `AR-HBONE` Herringbone Hatch + Scalloped Top Sod Line (`15B6F/15B7D`)
    function drawBackfillTopLayer(ctx, xL, xR, yTop, yBot, pal) {
      cadPoly(ctx, [
        [xL, yTop],
        [xR, yTop],
        [xR, yBot],
        [xL, yBot]
      ], pal.primaryLine, 1.45, true, 'rgba(148, 163, 184, 0.14)', [], 'TOP_BACKFILL');

      // AR-HBONE 45°/135° herringbone hatch inside `t1` layer (matching DXF `14F46`, `1509B`, `17678`)
      const stepX = 11;
      for (let hx = xL + 4; hx < xR - 4; hx += stepX) {
        const ym = (yTop + yBot) / 2;
        cadLine(ctx, hx, yTop + 1.5, hx + 4.5, ym, pal.hboneLine, 0.85, [], 'AR_HBONE');
        cadLine(ctx, hx + 4.5, ym, hx, yBot - 1.5, pal.hboneLine, 0.85, [], 'AR_HBONE');
      }
    }

    // Helper: Fill Trapezoid with `AR-SAND` Fine Sand/Crushed Stone Stipple (`15030`, `150AC`)
    function drawArSandTrapezoid(ctx, xTopL, xTopR, xBotL, xBotR, yTop, yBot, pal) {
      cadPoly(ctx, [
        [xTopL, yTop],
        [xTopR, yTop],
        [xBotR, yBot],
        [xBotL, yBot]
      ], pal.structYellow, 1.55, true, 'rgba(56, 189, 248, 0.08)', [], 'TRAPEZOID_TRENCH');

      const nRows = 7;
      for (let r = 1; r < nRows; r++) {
        const f = r / nRows;
        const py = yTop + f * (yBot - yTop);
        const curL = xTopL + f * (xBotL - xTopL) + 5;
        const curR = xTopR + f * (xBotR - xTopR) - 5;
        for (let px = curL; px < curR; px += 9.5) {
          const jx = px + ((r * 7) % 5) - 2;
          const jy = py + ((Math.round(px) * 3) % 5) - 2;
          cadCircle(ctx, jx, jy, 0.75, pal.sandDots, 0.75, pal.sandDots, [], 'AR_SAND_DOT');
        }
      }
    }

    // Helper: Fill a Region with `GRAVEL` Angular Cobble Stones (`14F37`, `15220`, `1766E`, `1766F`)
    function drawGravelStonesInBox(ctx, cx, cy, w, h, isOval, pal) {
      const nCols = Math.max(3, Math.round(w / 11));
      const nRows = Math.max(3, Math.round(h / 10));
      const cellW = w / nCols;
      const cellH = h / nRows;

      for (let r = 0; r < nRows; r++) {
        for (let c = 0; c < nCols; c++) {
          const sx = (cx - w / 2) + (c + 0.5) * cellW;
          const sy = (cy - h / 2) + (r + 0.5) * cellH;
          if (isOval) {
            const dx = (sx - cx) / (w * 0.48);
            const dy = (sy - cy) / (h * 0.48);
            if (dx * dx + dy * dy > 1.0) continue;
          }
          const rx = cellW * 0.38;
          const ry = cellH * 0.36;
          const seed = r * 13 + c * 7 + 3;
          const pts = [];
          for (let k = 0; k < 6; k++) {
            const ang = (k / 6) * Math.PI * 2 + (seed % 3) * 0.2;
            const radX = rx * (0.82 + ((k + seed) % 3) * 0.12);
            const radY = ry * (0.82 + ((k * 2 + seed) % 3) * 0.12);
            pts.push([sx + Math.cos(ang) * radX, sy + Math.sin(ang) * radY]);
          }
          cadPoly(ctx, pts, pal.gravelStroke, 1.0, true, pal.gravelFill, [], 'GRAVEL_STONE');
        }
      }
    }

    // Helper: Draw Z-Break Line (`1767F`, `17679`, `186F3`, `186F4`)
    function drawBreakLine(ctx, x1, y1, x2, y2, pal) {
      const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
      const dx = x2 - x1, dy = y2 - y1;
      const L = Math.hypot(dx, dy) || 1;
      const ux = dx / L, uy = dy / L;
      const nx = -uy, ny = ux;
      const zS = 4.5, zA = 4.5;
      cadPoly(ctx, [
        [x1, y1],
        [mx - ux * zS, my - uy * zS],
        [mx - ux * (zS * 0.35) + nx * zA, my - uy * (zS * 0.35) + ny * zA],
        [mx + ux * (zS * 0.35) - nx * zA, my + uy * (zS * 0.35) - ny * zA],
        [mx + ux * zS, my + uy * zS],
        [x2, y2]
      ], pal.dimLine, 1.1, false, null, [], 'BREAK_LINE');
    }

    // =========================================================================
    // 4. LEFT COLUMN: 原圖【斷面圖】(上：方形不織布土石籠 `14F30`；下：橢圓形不織布包覆盲溝 `15132`) + 符號說明 (`15DBA`)
    //    NOTE: Outer G.L. lines (`14F39`, `14F3A`, `150A0`, `150A1`) are 100% STRIPPED!
    // =========================================================================
    function drawLeftBlindDitchSections(ctx, ox, topY, p, pal) {
      const s = 1.95; // Scale: 1 cm = 1.95 px
      const B1 = p.B1_cm * s;
      const B2 = p.B2_cm * s;
      const t1 = p.t1_cm * s;
      const h1 = p.h1_cm * s;
      const h2 = p.h2_cm * s;
      const H = p.H_cm * s;

      const cx = ox + 150;
      const xTopL = cx - B1 / 2;
      const xTopR = cx + B1 / 2;
      const xBotL = cx - B2 / 2;
      const xBotR = cx + B2 / 2;

      // Helper to draw one of the two left-column blind ditch cross-sections
      const drawSingleBlindSection = (yStart, isOvalCore, titleStr) => {
        const ySurf = yStart;
        const yTrenchTop = ySurf + t1;
        const yCoreTop = yTrenchTop + h1;
        const yCoreBot = yCoreTop + h2;
        const yTrenchBot = yTrenchTop + H;

        // 0) Ghost Baseline (Original B1=50, B2=30, H=50, t1=10)
        if (showGhost) {
          const gB1 = 50 * s, gB2 = 30 * s, gH = 50 * s, gt1 = 10 * s;
          cadPoly(ctx, [
            [cx - gB1 / 2, ySurf + gt1],
            [cx + gB1 / 2, ySurf + gt1],
            [cx + gB2 / 2, ySurf + gt1 + gH],
            [cx - gB2 / 2, ySurf + gt1 + gH]
          ], pal.ghostLine, 1.05, true, null, [4, 4], 'GHOST_TRENCH');
        }

        // 1) Top Original Soil Backfill Layer (`t1`: 原土回填 `AR-HBONE`)
        drawBackfillTopLayer(ctx, xTopL, xTopR, ySurf, yTrenchTop, pal);

        // 2) Trapezoidal Trench (`H`: 2~6cm 清碎石濾料 `AR-SAND`)
        drawArSandTrapezoid(ctx, xTopL, xTopR, xBotL, xBotR, yTrenchTop, yTrenchBot, pal);

        // 3) Center Geotextile Core (`h2`: 上圖為方形「不織布土石籠」`14F30`；下圖為圓角/橢圓形「不織布包覆」`15132`)
        const coreW = Math.min(B2 * 0.85, p.W_core_cm * s);
        const coreCY = (yCoreTop + yCoreBot) / 2;
        if (!isOvalCore) {
          // Square geotextile stone cage (`14F30`)
          cadPoly(ctx, [
            [cx - coreW / 2, yCoreTop],
            [cx + coreW / 2, yCoreTop],
            [cx + coreW / 2, yCoreBot],
            [cx - coreW / 2, yCoreBot]
          ], pal.geoDash, 1.5, true, 'rgba(15, 23, 42, 0.82)', [], 'SQUARE_CORE');
          drawGravelStonesInBox(ctx, cx, coreCY, coreW - 3, h2 - 3, false, pal);
        } else {
          // Rounded spline geotextile wrap (`15132`)
          const nPts = 20;
          const splinePts = [];
          for (let i = 0; i < nPts; i++) {
            const ang = (i / nPts) * Math.PI * 2;
            const jit = 0.94 + 0.06 * Math.sin(i * 3);
            splinePts.push([
              cx + Math.cos(ang) * (coreW * 0.52) * jit,
              coreCY + Math.sin(ang) * (h2 * 0.50) * jit
            ]);
          }
          cadPoly(ctx, splinePts, pal.geoDash, 1.5, true, 'rgba(15, 23, 42, 0.82)', [], 'OVAL_CORE');
          drawGravelStonesInBox(ctx, cx, coreCY, coreW - 2, h2 - 2, true, pal);
        }

        // 4) Subgrade Soil Compaction Symbol (`15065` / `150B6`: 基層土壤壓實)
        drawSubgradeCompactionSymbol(ctx, cx - 12, yTrenchBot + 1, pal);
        cadText(ctx, '基層土壤壓實', xBotR + 8, yTrenchBot + 8, 10.5, pal.titleCyan, 'left', '600');

        // 5) Dimensions (`*D6~*D19`):
        // Top B1
        cadDim(ctx, xTopL, ySurf, xTopR, ySurf, -20, `B1 (${p.B1_cm})`, pal, 11);
        // Bottom B2
        cadDim(ctx, xBotL, yTrenchBot, xBotR, yTrenchBot, 22, `B2 (${p.B2_cm})`, pal, 11);
        // Left t1 & H
        cadDim(ctx, xTopL, ySurf, xTopL, yTrenchTop, -24, `t1 (${p.t1_cm})`, pal, 10.5);
        cadDim(ctx, xTopL, yTrenchTop, xTopL, yTrenchBot, -24, `H (${p.H_cm})`, pal, 11);
        // Right h1 | h2 | h1
        const xDimR = xTopR + 28;
        cadLine(ctx, xTopR + 3, yTrenchTop, xDimR + 4, yTrenchTop, pal.dimLine, 0.9);
        cadLine(ctx, cx + coreW / 2 + 3, yCoreTop, xDimR + 4, yCoreTop, pal.dimLine, 0.9);
        cadLine(ctx, cx + coreW / 2 + 3, yCoreBot, xDimR + 4, yCoreBot, pal.dimLine, 0.9);
        cadLine(ctx, xBotR + 3, yTrenchBot, xDimR + 4, yTrenchBot, pal.dimLine, 0.9);
        cadDim(ctx, xDimR, yTrenchTop, xDimR, yCoreTop, 0, `h1 (${p.h1_cm})`, pal, 10.2);
        cadDim(ctx, xDimR, yCoreTop, xDimR, yCoreBot, 0, `h2 (${p.h2_cm})`, pal, 10.2);
        cadDim(ctx, xDimR, yCoreBot, xDimR, yTrenchBot, 0, `h1 (${p.h1_cm})`, pal, 10.2);

        // 6) Callout Leaders (`15025`, `15038`, `150AB`, `150B0`):
        // Right: 原土回填
        cadLeaderArrow(
          ctx,
          xTopR - 8, (ySurf + yTrenchTop) / 2,
          xDimR + 14, (ySurf + yTrenchTop) / 2,
          xDimR + 24, (ySurf + yTrenchTop) / 2,
          ['原土回填'],
          pal, 10.8
        );
        // Left: 不織布土石籠 / 不織布包覆
        const coreLabel = isOvalCore ? '不織布包覆' : '不織布土石籠';
        cadLeaderArrow(
          ctx,
          cx - coreW / 2, coreCY - 4,
          xTopL - 36, coreCY - 4,
          xTopL - 48, coreCY - 4,
          [coreLabel],
          pal, 10.8
        );

        return { bottomY: yTrenchBot + 34, rightX: xDimR + 95 };
      };

      // Draw Top Section (方形不織布土石籠 `14F30`)
      const sec1 = drawSingleBlindSection(topY + 46, false, '不織布土石籠斷面');

      // Section Title between or below (`18A94`: 斷面圖)
      const midTitleY = sec1.bottomY + 14;
      cadText(ctx, '斷面圖 (不織布土石籠型)', cx, midTitleY, 14.5, pal.titleCyan, 'center', '700');
      cadLine(ctx, cx - 82, midTitleY + 8, cx + 82, midTitleY + 8, pal.titleCyan, 1.3);
      cadLine(ctx, cx - 82, midTitleY + 11, cx + 82, midTitleY + 11, pal.titleCyan, 0.9);

      // Draw Bottom Section (橢圓形不織布包覆 `15132`)
      const sec2 = drawSingleBlindSection(midTitleY + 48, true, '不織布包覆盲溝斷面');
      const sec2TitleY = sec2.bottomY + 14;
      cadText(ctx, '斷面圖 (不織布包覆型)', cx, sec2TitleY, 14.5, pal.titleCyan, 'center', '700');
      cadLine(ctx, cx - 76, sec2TitleY + 8, cx + 76, sec2TitleY + 8, pal.titleCyan, 1.3);
      cadLine(ctx, cx - 76, sec2TitleY + 11, cx + 76, sec2TitleY + 11, pal.titleCyan, 0.9);

      // Symbol Legend Box (`15DBA`: 符號說明：B1, B2, t1, H, h1, h2)
      const legX = ox + 18;
      const legY = sec2TitleY + 26;
      const legW = 265;
      const legH = 132;
      cadPoly(ctx, [
        [legX, legY],
        [legX + legW, legY],
        [legX + legW, legY + legH],
        [legX, legY + legH]
      ], pal.tableBorder, 1.15, true, 'rgba(15, 23, 42, 0.88)', [], 'SYMBOL_LEGEND_15DBA');
      cadText(ctx, '符號說明：', legX + 12, legY + 16, 11.5, pal.titleCyan, 'left', '700');
      const symItems = [
        `B1  溝頂寬 (${p.B1_cm} cm)      B2  溝底寬 (${p.B2_cm} cm)`,
        `t1  原土回填厚 (${p.t1_cm} cm)   H   溝深 (${p.H_cm} cm)`,
        `h1  碎石級配厚度 (${p.h1_cm} cm)`,
        `h2  盲溝厚層 (${p.h2_cm} cm，中央不織布土石籠)`,
        `W_c 土石籠核心寬 (${p.W_core_cm} cm)`
      ];
      symItems.forEach((st, idx) => {
        cadText(ctx, st, legX + 14, legY + 36 + idx * 20, 10.2, pal.textMain, 'left', '600');
      });

      return {
        rightX: Math.max(sec1.rightX, legX + legW + 25),
        bottomY: legY + legH + 15
      };
    }

    // =========================================================================
    // 5. RIGHT COLUMN: 自動補齊之 1:1 對齊【不織布土石籠盲溝俯視平面圖】與【縱剖面圖 (>1%)】
    // =========================================================================
    function drawGabionBlindDitchPlanAndProfile(ctx, ox, topY, p, pal) {
      const s = 1.95;
      const B1 = p.B1_cm * s;
      const B2 = p.B2_cm * s;
      const t1 = p.t1_cm * s;
      const h1 = p.h1_cm * s;
      const h2 = p.h2_cm * s;
      const H = p.H_cm * s;
      const coreW = Math.min(B2 * 0.85, p.W_core_cm * s);

      const xProf0 = ox + 55;
      const wProf = 310;
      const xProf1 = xProf0 + wProf;

      // =====================================================================
      // PART 1: 自動補齊之 1:1 對齊【不織布土石籠盲溝俯視平面圖】 (TOP)
      // =====================================================================
      const yPlanTop = topY + 46;
      const yPlanMid = yPlanTop + B1 / 2;
      const yPlanBot = yPlanTop + B1;

      // Outer Trench Top Width B1 & Bottom Width B2 dashed lines
      cadPoly(ctx, [
        [xProf0, yPlanTop],
        [xProf1, yPlanTop],
        [xProf1, yPlanBot],
        [xProf0, yPlanBot]
      ], pal.primaryLine, 1.45, true, 'rgba(30, 41, 59, 0.55)', [], 'PLAN_TRENCH_B1');

      cadLine(ctx, xProf0, yPlanMid - B2 / 2, xProf1, yPlanMid - B2 / 2, pal.structYellow, 1.1, [6, 3], 'PLAN_TRENCH_B2');
      cadLine(ctx, xProf0, yPlanMid + B2 / 2, xProf1, yPlanMid + B2 / 2, pal.structYellow, 1.1, [6, 3], 'PLAN_TRENCH_B2');

      // AR-SAND fine gravel dots in outer zone
      for (let py = yPlanTop + 6; py < yPlanBot - 6; py += 11) {
        for (let px = xProf0 + 10; px < xProf1 - 10; px += 12) {
          if (Math.abs(py - yPlanMid) > coreW * 0.52) {
            cadCircle(ctx, px, py, 0.8, pal.sandDots, 0.8, pal.sandDots, [], 'PLAN_SAND_DOT');
          }
        }
      }

      // Central Geotextile Stone Cage Core (不織布土石籠 / 不織布包覆) in Plan View
      const yCoreTopP = yPlanMid - coreW / 2;
      const yCoreBotP = yPlanMid + coreW / 2;
      cadPoly(ctx, [
        [xProf0, yCoreTopP],
        [xProf1, yCoreTopP],
        [xProf1, yCoreBotP],
        [xProf0, yCoreBotP]
      ], pal.geoDash, 1.5, true, 'rgba(15, 23, 42, 0.85)', [], 'PLAN_GABION_CORE');

      drawGravelStonesInBox(ctx, (xProf0 + xProf1) / 2, yPlanMid, wProf - 14, coreW - 4, false, pal);

      // Left & Right Z-Break Lines on Plan View
      drawBreakLine(ctx, xProf0, yPlanTop - 6, xProf0, yPlanBot + 6, pal);
      drawBreakLine(ctx, xProf1, yPlanTop - 6, xProf1, yPlanBot + 6, pal);

      // Dimensions on Plan View
      cadDim(ctx, xProf0, yPlanTop, xProf0, yPlanBot, -24, `B1 (${p.B1_cm})`, pal, 10.5);
      cadDim(ctx, xProf1, yCoreTopP, xProf1, yCoreBotP, 22, `W_c (${p.W_core_cm})`, pal, 10.5);
      cadDim(ctx, xProf0, yPlanTop, xProf1, yPlanTop, -22, `展示長 L = ${p.L_prof_cm} cm (中央不織布土石籠+兩側碎石級配)`, pal, 10.8);

      const planTitleY = yPlanBot + 24;
      cadText(ctx, '不織布土石籠盲溝俯視平面圖 (自動補齊・1:1對齊)', (xProf0 + xProf1) / 2, planTitleY, 14, pal.titleCyan, 'center', '700');
      cadLine(ctx, (xProf0 + xProf1) / 2 - 145, planTitleY + 8, (xProf0 + xProf1) / 2 + 145, planTitleY + 8, pal.titleCyan, 1.3);

      // =====================================================================
      // PART 2: 自動補齊之 1:1 對齊【不織布土石籠盲溝縱剖面圖 (縱坡 > 1%)】 (BOTTOM)
      // =====================================================================
      const yProfStart = planTitleY + 42;
      const dropY = wProf * (p.slope_pct / 100) * 1.25;

      // 1:1 Vertical Alignment Guides between Plan View and Longitudinal Profile
      cadLine(ctx, xProf0, yPlanBot + 4, xProf0, yProfStart - 8, pal.secondaryLine, 0.85, [4, 4], 'ALIGN_GUIDE');
      cadLine(ctx, xProf1, yPlanBot + 4, xProf1, yProfStart - 8, pal.secondaryLine, 0.85, [4, 4], 'ALIGN_GUIDE');

      const ySurfL = yProfStart + dropY;
      const ySurfR = yProfStart;
      const yTrTopL = ySurfL + t1;
      const yTrTopR = ySurfR + t1;
      const yCoreTopL = yTrTopL + h1;
      const yCoreTopR = yTrTopR + h1;
      const yCoreBotL = yCoreTopL + h2;
      const yCoreBotR = yCoreTopR + h2;
      const yTrBotL = yCoreBotL + h1;
      const yTrBotR = yCoreBotR + h1;

      // 1) Top Original Soil Backfill Layer (`t1`: 原土回填 + AR-HBONE hatch)
      cadPoly(ctx, [
        [xProf0, ySurfL],
        [xProf1, ySurfR],
        [xProf1, yTrTopR],
        [xProf0, yTrTopL]
      ], pal.primaryLine, 1.4, true, 'rgba(148, 163, 184, 0.14)', [], 'PROF_BACKFILL');

      for (let gx = xProf0 + 12; gx < xProf1 - 10; gx += 15) {
        const f = (gx - xProf0) / wProf;
        const gy = ySurfL + f * (ySurfR - ySurfL);
        cadLine(ctx, gx, gy, gx - 3, gy - 5, pal.pipeMesh, 1.0, [], 'PROF_GRASS');
        cadLine(ctx, gx, gy, gx + 2, gy - 6, pal.pipeMesh, 1.0, [], 'PROF_GRASS');
        cadLine(ctx, gx, gy + 2, gx + 5, gy + t1 - 2, pal.hboneLine, 0.85, [], 'PROF_HBONE');
      }

      // 2) Upper & Lower Crushed Stone Layers (`h1`: 碎石級配厚度 `AR-SAND`)
      cadPoly(ctx, [
        [xProf0, yTrTopL],
        [xProf1, yTrTopR],
        [xProf1, yCoreTopR],
        [xProf0, yCoreTopL]
      ], pal.structYellow, 1.35, true, 'rgba(56, 189, 248, 0.08)', [], 'PROF_H1_UPPER');

      cadPoly(ctx, [
        [xProf0, yCoreBotL],
        [xProf1, yCoreBotR],
        [xProf1, yTrBotR],
        [xProf0, yTrBotL]
      ], pal.structYellow, 1.35, true, 'rgba(56, 189, 248, 0.08)', [], 'PROF_H1_LOWER');

      for (let px = xProf0 + 10; px < xProf1 - 10; px += 12) {
        const f = (px - xProf0) / wProf;
        const yU = yTrTopL + f * (yTrTopR - yTrTopL);
        const yL = yCoreBotL + f * (yCoreBotR - yCoreBotL);
        cadCircle(ctx, px, yU + h1 * 0.35, 0.8, pal.sandDots, 0.8, pal.sandDots);
        cadCircle(ctx, px + 4, yU + h1 * 0.72, 0.8, pal.sandDots, 0.8, pal.sandDots);
        cadCircle(ctx, px, yL + h1 * 0.35, 0.8, pal.sandDots, 0.8, pal.sandDots);
        cadCircle(ctx, px + 4, yL + h1 * 0.72, 0.8, pal.sandDots, 0.8, pal.sandDots);
      }

      // 3) Central Geotextile Stone Cage Core (`h2`: 盲溝厚層 `GRAVEL` cobbles)
      cadPoly(ctx, [
        [xProf0, yCoreTopL],
        [xProf1, yCoreTopR],
        [xProf1, yCoreBotR],
        [xProf0, yCoreBotL]
      ], pal.geoDash, 1.5, true, 'rgba(15, 23, 42, 0.85)', [], 'PROF_H2_CORE');

      drawGravelStonesInBox(ctx, (xProf0 + xProf1) / 2, (yCoreTopL + yCoreBotR) / 2, wProf - 14, h2 - 4, false, pal);

      // Flow Slope Arrow `← >1%` inside core
      const arrX1 = xProf0 + 95, arrX2 = xProf0 + 32;
      const arrY1 = (yCoreTopL + yCoreBotL) / 2 - 2;
      const arrY2 = arrY1 + 2;
      cadLine(ctx, arrX1, arrY1, arrX2, arrY2, pal.dimLine, 1.8, [], 'SLOPE_ARROW');
      cadPoly(ctx, [[arrX2, arrY2], [arrX2 + 8, arrY2 - 3.5], [arrX2 + 8, arrY2 + 2.5]], pal.dimLine, 1.2, true, pal.dimLine);
      cadText(ctx, `縱坡 >${p.slope_pct.toFixed(1)}%`, (arrX1 + arrX2) / 2 + 6, arrY1 - 9, 10.8, pal.titleCyan, 'center', '700');

      // 4) Subgrade Compaction Symbols (`B002`) & Left/Right Z-Break Lines
      drawSubgradeCompactionSymbol(ctx, xProf0 + 35, yTrBotL + 1, pal);
      drawSubgradeCompactionSymbol(ctx, xProf1 - 65, yTrBotR + 1, pal);
      drawBreakLine(ctx, xProf0, ySurfL - 8, xProf0, yTrBotL + 10, pal);
      drawBreakLine(ctx, xProf1, ySurfR - 8, xProf1, yTrBotR + 10, pal);

      // 5) Dimensions (`t1, h1, h2, h1, H`) & Callouts on Longitudinal Profile:
      cadDim(ctx, xProf0, ySurfL, xProf0, yTrTopL, -24, `t1 (${p.t1_cm})`, pal, 10.2);
      cadDim(ctx, xProf0, yTrTopL, xProf0, yTrBotL, -24, `H (${p.H_cm})`, pal, 10.8);

      const xDimProfR = xProf1 + 24;
      cadDim(ctx, xDimProfR, yTrTopR, xDimProfR, yCoreTopR, 0, `h1 (${p.h1_cm})`, pal, 10.2);
      cadDim(ctx, xDimProfR, yCoreTopR, xDimProfR, yCoreBotR, 0, `h2 (${p.h2_cm})`, pal, 10.2);
      cadDim(ctx, xDimProfR, yCoreBotR, xDimProfR, yTrBotR, 0, `h1 (${p.h1_cm})`, pal, 10.2);

      cadLeaderArrow(ctx, xProf1 - 15, (ySurfR + yTrTopR) / 2, xDimProfR + 18, ySurfR + 4, xDimProfR + 28, ySurfR + 4, ['原土回填'], pal, 10.5);
      cadLeaderArrow(ctx, xProf1 - 15, (yCoreTopR + yCoreBotR) / 2, xDimProfR + 18, (yCoreTopR + yCoreBotR) / 2, xDimProfR + 28, (yCoreTopR + yCoreBotR) / 2, ['不織布土石籠(h2)'], pal, 10.5);
      cadLeaderArrow(ctx, xProf1 - 15, yTrBotR + 3, xDimProfR + 18, yTrBotR + 10, xDimProfR + 28, yTrBotR + 10, ['基層土壤壓實'], pal, 10.5);

      const profTitleY = yTrBotL + 36;
      cadText(ctx, '不織布土石籠盲溝縱剖面圖 (自動補齊・1:1對齊)', (xProf0 + xProf1) / 2, profTitleY, 14, pal.titleCyan, 'center', '700');
      cadLine(ctx, (xProf0 + xProf1) / 2 - 145, profTitleY + 8, (xProf0 + xProf1) / 2 + 145, profTitleY + 8, pal.titleCyan, 1.3);

      return {
        rightX: xDimProfR + 135,
        bottomY: profTitleY + 24
      };
    }

    // =========================================================================
    // 6. EXPLICIT FIGURE-NUMBER QUANTITY TABLE ON CANVAS
    // =========================================================================
    function drawExplicitFormulaTableOnCanvas(ctx, ox, oy, p, pal) {
      cadText(
        ctx,
        `【塑料盲溝(一)：不織布土石籠／包覆型盲溝 (0513-1) 每公尺數量計算式表 — 採用圖面標註數字顯式列式 (B1=${p.B1_cm}・B2=${p.B2_cm}・H=${p.H_cm}・h1=${p.h1_cm}・h2=${p.h2_cm}cm・全段=${p.L_tot_m.toFixed(1)}m)】`,
        ox, oy - 15, 13.0, pal.dimText, 'left', '700'
      );

      const colW = [245, 500, 82, 92, 52];
      const rowH = 26;
      const rows = [
        ['工程項目名稱 (依DXF圖面標註)', '採用圖面標註數字之顯式計算式 (每公尺基準)', '每m數量', `全段(${p.L_tot_m}m)`, '單位'],
        [`梯形盲溝開挖土方 (B1=${p.B1_cm}, B2=${p.B2_cm}, 深${p.H_cm+p.t1_cm}cm)`, p.formula_excav_vol, p.q_excav_vol.toFixed(2), (p.q_excav_vol * p.L_tot_m).toFixed(2), 'M³'],
        [`頂層原土回填 (寬B1=${p.B1_cm}cm, 厚t1=${p.t1_cm}cm)`, p.formula_backfill_vol, p.q_backfill_vol.toFixed(2), (p.q_backfill_vol * p.L_tot_m).toFixed(2), 'M³'],
        [`中央不織布土石籠塊石 (寬${p.W_core_cm}×高h2=${p.h2_cm}cm)`, p.formula_core_gabion, p.q_core_gabion.toFixed(2), (p.q_core_gabion * p.L_tot_m).toFixed(2), 'M³'],
        [`外圍碎石級配濾料 (上下厚h1=${p.h1_cm}cm及兩側)`, p.formula_gravel_outer, p.q_gravel_outer.toFixed(2), (p.q_gravel_outer * p.L_tot_m).toFixed(2), 'M³'],
        [`透水不織布包覆 (外槽梯形包覆+中央土石籠包覆)`, p.formula_geo_area, p.q_geo_area.toFixed(2), (p.q_geo_area * p.L_tot_m).toFixed(1), 'M²'],
        ['基層土壤壓實 (壓實度應達 80% 以上為原則)', p.formula_compact_area, p.q_compact_area.toFixed(2), (p.q_compact_area * p.L_tot_m).toFixed(1), 'M²']
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
          const color = isHeader ? pal.textMain : (cIdx === 2 ? pal.dimText : (cIdx === 3 ? pal.structYellow : pal.textSub));
          cadText(ctx, cellStr, tx, ry, isHeader ? 11.2 : 10.5, color, align, (isHeader || cIdx === 2 || cIdx === 3) ? '700' : '500');
          cx += cw;
        });
      });

      return { bottomY: oy + totH };
    }

    // =========================================================================
    // 7. MAIN RENDER ENGINE & LIVE UI UPDATER
    // =========================================================================
    function updateSidebarSummary(p) {
      document.getElementById('stat_ditch_tag').textContent = `B1=${p.B1_cm}・B2=${p.B2_cm}・H=${p.H_cm}cm`;
      document.getElementById('stat_gravel_m').textContent = `${p.q_gravel_outer.toFixed(2)} M³/m`;
      document.getElementById('stat_core_m').textContent = `${p.q_core_gabion.toFixed(2)} M³/m`;
      document.getElementById('stat_geo_m').textContent = `${p.q_geo_area.toFixed(2)} M²/m`;
      document.getElementById('stat_excav_m').textContent = `${p.q_excav_vol.toFixed(2)} + ${p.q_backfill_vol.toFixed(2)} M³`;
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

      if (currentView === 'SECTIONS') {
        const bLeft = drawLeftBlindDitchSections(ctx, 40, 12, p, pal);
        drawExplicitFormulaTableOnCanvas(ctx, 40, bLeft.bottomY + 36, p, pal);
      } else if (currentView === 'PROF_PLAN') {
        const bRight = drawGabionBlindDitchPlanAndProfile(ctx, 50, 12, p, pal);
        drawExplicitFormulaTableOnCanvas(ctx, 45, bRight.bottomY + 36, p, pal);
      } else {
        // 'ALL' Full Standard Sheet Layout for Web Page 1 (不織布土石籠與不織布包覆型盲溝):
        const bLeft = drawLeftBlindDitchSections(ctx, 25, 10, p, pal);
        const rightColX = bLeft.rightX + 35;
        const bRight = drawGabionBlindDitchPlanAndProfile(ctx, rightColX, 10, p, pal);

        const tableY = Math.max(bLeft.bottomY, bRight.bottomY) + 38;
        drawExplicitFormulaTableOnCanvas(ctx, 25, tableY, p, pal);
      }

      ctx.restore();
    }

    // =========================================================================
    // 8. UI CONTROLS, AUTO-SYNC & DXF / CSV EXPORTERS
    // =========================================================================
    function onLayerHeightChange() {
      const h1 = parseFloat(document.getElementById('inp_h1_cm').value) || 15;
      const h2 = parseFloat(document.getElementById('inp_h2_cm').value) || 20;
      document.getElementById('inp_H_cm').value = Math.round(2 * h1 + h2);
      renderAll();
    }

    function onGeomChange() {
      renderAll();
    }

    function resetToOrig() {
      Object.keys(ORIG_PLASTIC_BLIND_DITCH).forEach(k => {
        const el = document.getElementById('inp_' + k);
        if (el) el.value = ORIG_PLASTIC_BLIND_DITCH[k];
      });
      renderAll();
    }

    function switchView(view) {
      currentView = view;
      const specEl = document.getElementById('specPanel');
      const tabs = {
        ALL: document.getElementById('tab-all'),
        SECTIONS: document.getElementById('tab-sec'),
        PROF_PLAN: document.getElementById('tab-prof-plan'),
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
        ? 'px-2.5 py-1 rounded bg-cyan-950/90 border border-cyan-600/60 text-xs text-cyan-300 flex items-center gap-1 transition'
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
      if (currentView === 'SECTIONS' || currentView === 'PROF_PLAN') {
        viewCam.scale = Math.min(rect.width / 1040, rect.height / 920) * 0.93;
        viewCam.offsetX = Math.max(20, (rect.width - 980 * viewCam.scale) / 2);
        viewCam.offsetY = 14;
      } else {
        viewCam.scale = Math.min(rect.width / 1180, rect.height / 960) * 0.94;
        viewCam.offsetX = Math.max(20, (rect.width - 1120 * viewCam.scale) / 2);
        viewCam.offsetY = 12;
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
      a.download = `塑料盲溝_不織布土石籠型_0513-1_B1_${p.B1_cm}_H${p.H_cm}cm.dxf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }

    function exportCSV() {
      const p = getParams();
      const rows = [
        [`塑料盲溝(一)：不織布土石籠／不織布包覆型盲溝 (圖號 0513-1・溝頂寬B1=${p.B1_cm}cm・溝底寬B2=${p.B2_cm}cm・溝深H=${p.H_cm}cm) - 圖面標註數字顯式列式數量計算書`],
        ['工程項目名稱', '採用圖面標註數字之顯式計算式 (每公尺基準)', '每公尺數量', `全段數量(${p.L_tot_m}m)`, '單位'],
        [`梯形盲溝開挖土方 (B1=${p.B1_cm}, B2=${p.B2_cm}, 深${p.H_cm+p.t1_cm}cm)`, `'${p.formula_excav_vol}`, p.q_excav_vol.toFixed(2), (p.q_excav_vol * p.L_tot_m).toFixed(2), 'M³'],
        [`頂層原土回填 (寬B1=${p.B1_cm}cm, 厚t1=${p.t1_cm}cm)`, `'${p.formula_backfill_vol}`, p.q_backfill_vol.toFixed(2), (p.q_backfill_vol * p.L_tot_m).toFixed(2), 'M³'],
        [`中央不織布土石籠塊石 (寬${p.W_core_cm}×高h2=${p.h2_cm}cm)`, `'${p.formula_core_gabion}`, p.q_core_gabion.toFixed(2), (p.q_core_gabion * p.L_tot_m).toFixed(2), 'M³'],
        [`外圍碎石級配濾料 (上下厚h1=${p.h1_cm}cm及兩側)`, `'${p.formula_gravel_outer}`, p.q_gravel_outer.toFixed(2), (p.q_gravel_outer * p.L_tot_m).toFixed(2), 'M³'],
        [`透水不織布包覆 (外槽梯形包覆+中央土石籠包覆)`, `'${p.formula_geo_area}`, p.q_geo_area.toFixed(2), (p.q_geo_area * p.L_tot_m).toFixed(1), 'M²'],
        ['基層土壤壓實 (壓實度應達 80% 以上為原則)', `'${p.formula_compact_area}`, p.q_compact_area.toFixed(2), (p.q_compact_area * p.L_tot_m).toFixed(1), 'M²']
      ];

      const csvContent = '\uFEFF' + rows.map(r => r.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `不織布土石籠盲溝顯式列式計算書_0513-1_B1_${p.B1_cm}xH${p.H_cm}.csv`;
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

  const STRIP = s => String(s).replace(/\s*[（(]\s*圖號[^）)]*[）)]/g, '').replace(/\s*[（(]\s*\d{4}-\d\s*[/／]\s*\d{3}\s*[）)]/g, '').replace(/\s*圖號\s*[：:]?\s*[0-9A-Za-z#\-／/ ]+/g, ' ');
  function params(R) { Object.keys(R || {}).forEach(k => { el('inp_' + k).value = String(R[k]); }); return getParams(); }
  function run(R, OV) {
    O = []; const PAL = getPalette(), p = params(R); Object.assign(p, R || {}, OV || {});
    const bL = drawLeftBlindDitchSections(CTX, 25, 10, p, PAL), bR = drawGabionBlindDitchPlanAndProfile(CTX, bL.rightX + 35, 10, p, PAL); drawExplicitFormulaTableOnCanvas(CTX, 25, Math.max(bL.bottomY, bR.bottomY) + 38, p, PAL);
    
    const sc = 1 / 1.95; return O.map(o => { const r = Object.assign({}, o); if (r.p) r.p = r.p.map(([x, y]) => [x * sc, y * sc]); if (r.x !== undefined) { r.x *= sc; r.y *= sc; } if (r.r) r.r *= sc; if (r.h) r.h *= sc; if (r.s !== undefined && r.k === 'T') r.s = STRIP(r.s); return r; });
  }
  return { run, params };
})();
TCO_D['bl2'] = (function () {
  let O = [];
  const EL = {}, CTX = new Proxy({}, { get: (t, k) => (k in t ? t[k] : () => ({ width: 0 })), set: (t, k, v) => { t[k] = v; return true; } });
  const el = id => EL[id] || (EL[id] = { value: '', textContent: '', innerHTML: '', className: '', style: {}, classList: { add() {}, remove() {}, toggle() {} }, addEventListener() {}, getContext: () => CTX, parentElement: { getBoundingClientRect: () => ({ width: 100, height: 100 }) } });
  const document = { getElementById: el, querySelectorAll: () => [], querySelector: () => null, createElement: () => ({ click() {}, style: {} }), body: { appendChild() {}, removeChild() {}, classList: { add() {}, remove() {}, toggle() {}, contains: () => false } }, documentElement: { classList: { contains: () => false, add() {}, remove() {}, toggle() {} } }, addEventListener() {} };
  const window = { addEventListener() {}, devicePixelRatio: 1, matchMedia: () => ({ matches: false, addEventListener() {} }) };

    // =========================================================================
    // 1. ORIGINAL DXF BASELINE CONSTANTS & GLOBAL STATE (PURE ASCII IDENTIFIERS)
    // =========================================================================
    const ORIG_HDPE_BLIND_DITCH = {
      pipe_model: 150, // 6" (d = 150mm)
      perf_type: 'PARTIAL_120',
      B1_cm: 50,
      B2_cm: 30,
      t_cm: 10,
      H1_cm: 40,
      H_tot_cm: 50,
      slope_pct: 2.0,
      L_prof_cm: 250,
      L_tot_m: 30.0
    };

    const PIPE_SPECS = [
      { inch: '2"', d_mm: 50 },
      { inch: '3"', d_mm: 75 },
      { inch: '4"', d_mm: 100 },
      { inch: '5"', d_mm: 125 },
      { inch: '6"', d_mm: 150 },
      { inch: '8"', d_mm: 200 },
      { inch: '10"', d_mm: 250 }
    ];

    let currentView = 'ALL'; // 'ALL', 'BURIED_VIEWS', 'PIPE_DETAIL', 'SPEC'
    let showGhost = false;
    let isDarkTheme = true;

    let viewCam = {
      scale: 0.72,
      offsetX: 28,
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
      const str = (id, def) => {
        const el = document.getElementById(id);
        return el ? el.value : def;
      };

      const d_mm = Math.round(num('inp_pipe_model', 150));
      const d_cm = +(d_mm / 10).toFixed(1);
      const specObj = PIPE_SPECS.find(s => s.d_mm === d_mm) || PIPE_SPECS[4];
      const perf_type = str('inp_perf_type', 'PARTIAL_120');

      const B1_cm = Math.max(35, Math.min(150, Math.round(num('inp_B1_cm', 50))));
      const B2_cm = Math.max(20, Math.min(B1_cm, Math.round(num('inp_B2_cm', 30))));
      const t_cm = Math.max(5, Math.min(40, Math.round(num('inp_t_cm', 10))));
      const H1_cm = Math.max(25, Math.min(100, Math.round(num('inp_H1_cm', 40))));
      const H_tot_cm = t_cm + H1_cm;

      const elHtot = document.getElementById('inp_H_tot_cm');
      if (elHtot) elHtot.value = H_tot_cm;

      const slope_pct = Math.max(1.0, Math.min(15.0, +num('inp_slope_pct', 2.0).toFixed(1)));
      const L_prof_cm = Math.max(150, Math.min(500, Math.round(num('inp_L_prof_cm', 250))));
      const L_tot_m = Math.max(5.0, Math.min(200.0, num('inp_L_tot_m', 30.0)));

      const p = {
        d_mm,
        d_cm,
        pipe_inch: specObj.inch,
        perf_type,
        B1_cm,
        B2_cm,
        t_cm,
        H1_cm,
        H_tot_cm,
        slope_pct,
        L_prof_cm,
        L_tot_m
      };

      const B1_m = +(B1_cm / 100).toFixed(2);
      const B2_m = +(B2_cm / 100).toFixed(2);
      const t_m = +(t_cm / 100).toFixed(2);
      const H1_m = +(H1_cm / 100).toFixed(2);
      const Htot_m = +(H_tot_cm / 100).toFixed(2);
      const d_m = +(d_mm / 1000).toFixed(3);

      // 1. 梯形盲溝總開挖土方 (總溝深 H = t + H1):
      const slopeHoriz = +((B1_m - B2_m) / 2).toFixed(2);
      const B_surface_m = +(B1_m + 2 * slopeHoriz * (t_m / H1_m)).toFixed(2);
      p.q_excav_vol = +(((B_surface_m + B2_m) / 2) * Htot_m * 1.0).toFixed(2);
      p.formula_excav_vol = `[(溝頂B1=${B1_m.toFixed(2)}m + 溝底B2=${B2_m.toFixed(2)}m)/2 * 總溝深H(${t_m.toFixed(2)}+${H1_m.toFixed(2)}=${Htot_m.toFixed(2)}m)] * 1.00m`;

      // 2. 頂層原土回填 (厚 t = 10cm):
      p.q_backfill_vol = +(B1_m * t_m * 1.0).toFixed(2);
      p.formula_backfill_vol = `溝頂寬B1(${B1_m.toFixed(2)}m) * 原土回填厚t(${t_m.toFixed(2)}m) * 1.00m`;

      // 3. 2~6cm 清碎石濾料 (梯形盲溝深 H1 扣除中央 HDPE 透水網管斷面積):
      const trapFilterArea = +(((B1_m + B2_m) / 2) * H1_m).toFixed(3); // (0.50+0.30)/2 * 0.40 = 0.160 m2
      const pipeArea = +(0.7854 * d_m * d_m).toFixed(3);               // pi/4 * 0.15^2 = 0.018 m2
      p.q_gravel_hdpe = Math.max(0.04, +(trapFilterArea - pipeArea).toFixed(2));
      p.formula_gravel_hdpe = `[梯形斷面(${B1_m.toFixed(2)}+${B2_m.toFixed(2)})/2 * H1(${H1_m.toFixed(2)}m) = ${trapFilterArea.toFixed(3)}M²] - 網管斷面(π/4*${d_m.toFixed(3)}²=${pipeArea.toFixed(3)}M²)`;

      // 4. 透水不織布包覆面積 (外槽梯形包覆 + HDPE網管外包透水不織布濾膜):
      const sideSlope_m = +Math.hypot((B1_m - B2_m) / 2, H1_m).toFixed(2);
      const outerGeoPerim = +(B2_m + 2 * sideSlope_m + B1_m + 0.15).toFixed(2);
      const pipeWrapPerim = +(Math.PI * d_m).toFixed(2);
      p.q_geo_area = +((outerGeoPerim + pipeWrapPerim) * 1.0).toFixed(2);
      p.formula_geo_area = `[外槽包覆(B2=${B2_m.toFixed(2)}+兩側2*${sideSlope_m.toFixed(2)}+頂搭接${(B1_m+0.15).toFixed(2)}=${outerGeoPerim.toFixed(2)}m) + 網管外包濾膜(π*${d_m.toFixed(3)}=${pipeWrapPerim.toFixed(2)}m)] * 1.00m`;

      // 5. HDPE 透水網管 (外包透水不織布，型號 2"~10"):
      p.q_pipe_len = 1.00;
      const perfDesc = perf_type === 'FULL' ? '全透水型(360°開孔)' : (perf_type === 'PARTIAL_120' ? '2/3透水型(底120°不開孔)' : '1/2透水型(底180°不開孔)');
      p.formula_pipe_len = `採用型號 ${p.pipe_inch} (內徑 d=${d_mm}mm) ・ ${perfDesc} ・ 2.0mm熔結絲條(開孔率>50%)`;

      // 6. 基層土壤壓實 (壓實度應達 80% 以上):
      p.q_compact_area = +(B2_m + 2 * sideSlope_m).toFixed(2);
      p.formula_compact_area = `[溝底寬B2(${B2_m.toFixed(2)}m) + 兩側開挖斜邊(2*${sideSlope_m.toFixed(2)}m)] * 1.00m (壓實度≧80%)`;

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
          structYellow: '#facc15',
          gravelStroke: '#f59e0b',
          gravelFill: 'rgba(245, 158, 11, 0.16)',
          sandDots: '#cbd5e1',
          hboneLine: '#94a3b8',
          pipeMesh: '#22c55e',
          pipeImpervious: '#38bdf8',
          geoDash: '#e879f9',
          dimLine: '#22d3ee',
          dimText: '#67e8f9',
          leaderLine: '#22d3ee',
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
          structYellow: '#b45309',
          gravelStroke: '#c2410c',
          gravelFill: 'rgba(251, 191, 36, 0.25)',
          sandDots: '#475569',
          hboneLine: '#64748b',
          pipeMesh: '#15803d',
          pipeImpervious: '#0284c7',
          geoDash: '#a21caf',
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

    function cadCircle(ctx, cx, cy, r, color, width = 1.25, fill = null, dash = [], layer = '0') {
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

    function cadLeaderArrow(ctx, tx, ty, kx, ky, ex, ey, lines, pal, fontSize = 11.0, useDot = false) {
      cadLine(ctx, tx, ty, kx, ky, pal.leaderLine, 1.15, [], 'LEADER');
      if (Math.hypot(ex - kx, ey - ky) > 1) {
        cadLine(ctx, kx, ky, ex, ey, pal.leaderLine, 1.15, [], 'LEADER');
      }

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
        ctx.lineTo(tx - ux * 7.2 + nx * 2.2, ty - uy * 7.2 + ny * 2.2);
        ctx.lineTo(tx - ux * 7.2 - nx * 2.2, ty - uy * 7.2 - ny * 2.2);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }

      const align = ex >= kx ? 'left' : 'right';
      const pad = ex >= kx ? 6 : -6;
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
      const gap = 4.0;
      const extOver = 4.5;

      const sx1 = x1 + nx * gap, sy1 = y1 + ny * gap;
      const ex1 = x1 + nx * (absOff + extOver), ey1 = y1 + ny * (absOff + extOver);
      const sx2 = x2 + nx * gap, sy2 = y2 + ny * gap;
      const ex2 = x2 + nx * (absOff + extOver), ey2 = y2 + ny * (absOff + extOver);

      const dx1 = x1 + nx * absOff, dy1 = y1 + ny * absOff;
      const dx2 = x2 + nx * absOff, dy2 = y2 + ny * absOff;

      if (absOff > 3) {
        cadLine(ctx, sx1, sy1, ex1, ey1, pal.dimLine, 0.9, [], 'DIM');
        cadLine(ctx, sx2, sy2, ex2, ey2, pal.dimLine, 0.9, [], 'DIM');
      }

      const mx = (dx1 + dx2) / 2, my = (dy1 + dy2) / 2;
      const textGap = Math.max(String(labelStr).length * fontSize * 0.60 + 6, 18);

      if (L > textGap + 10) {
        cadLine(ctx, dx1, dy1, mx - ux * (textGap / 2), my - uy * (textGap / 2), pal.dimLine, 1.0, [], 'DIM');
        cadLine(ctx, mx + ux * (textGap / 2), my + uy * (textGap / 2), dx2, dy2, pal.dimLine, 1.0, [], 'DIM');
      } else {
        cadLine(ctx, dx1, dy1, dx2, dy2, pal.dimLine, 1.0, [], 'DIM');
      }

      const aL = Math.min(5.5, L * 0.25), aW = 1.8;
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

    function drawSubgradeCompactionSymbol(ctx, x, y, pal) {
      for (let g = 0; g < 2; g++) {
        const gx = x + g * 12;
        for (let k = 0; k < 3; k++) {
          cadLine(ctx, gx + k * 2.8, y, gx + k * 2.8 - 4.0, y + 4.5, pal.secondaryLine, 1.0, [], 'B002_HATCH');
          cadLine(ctx, gx + 4.2 + k * 2.5, y + 4.5, gx + 7.2 + k * 2.5, y + 1.4, pal.secondaryLine, 1.0, [], 'B002_HATCH');
        }
      }
    }

    function drawBackfillTopLayer(ctx, xL, xR, yTop, yBot, pal) {
      cadPoly(ctx, [
        [xL, yTop],
        [xR, yTop],
        [xR, yBot],
        [xL, yBot]
      ], pal.primaryLine, 1.45, true, 'rgba(148, 163, 184, 0.14)', [], 'TOP_BACKFILL');

      const stepX = 11;
      for (let hx = xL + 4; hx < xR - 4; hx += stepX) {
        const ym = (yTop + yBot) / 2;
        cadLine(ctx, hx, yTop + 1.5, hx + 4.5, ym, pal.hboneLine, 0.85, [], 'AR_HBONE');
        cadLine(ctx, hx + 4.5, ym, hx, yBot - 1.5, pal.hboneLine, 0.85, [], 'AR_HBONE');
      }
    }

    function drawGravelStonesInBox(ctx, cx, cy, w, h, isOval, pal) {
      const nCols = Math.max(3, Math.round(w / 11));
      const nRows = Math.max(3, Math.round(h / 10));
      const cellW = w / nCols;
      const cellH = h / nRows;

      for (let r = 0; r < nRows; r++) {
        for (let c = 0; c < nCols; c++) {
          const sx = (cx - w / 2) + (c + 0.5) * cellW;
          const sy = (cy - h / 2) + (r + 0.5) * cellH;
          if (isOval) {
            const dx = (sx - cx) / (w * 0.48);
            const dy = (sy - cy) / (h * 0.48);
            if (dx * dx + dy * dy > 1.0) continue;
          }
          const rx = cellW * 0.38;
          const ry = cellH * 0.36;
          const seed = r * 13 + c * 7 + 3;
          const pts = [];
          for (let k = 0; k < 6; k++) {
            const ang = (k / 6) * Math.PI * 2 + (seed % 3) * 0.2;
            const radX = rx * (0.82 + ((k + seed) % 3) * 0.12);
            const radY = ry * (0.82 + ((k * 2 + seed) % 3) * 0.12);
            pts.push([sx + Math.cos(ang) * radX, sy + Math.sin(ang) * radY]);
          }
          cadPoly(ctx, pts, pal.gravelStroke, 1.0, true, pal.gravelFill, [], 'GRAVEL_STONE');
        }
      }
    }

    function drawBreakLine(ctx, x1, y1, x2, y2, pal) {
      const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
      const dx = x2 - x1, dy = y2 - y1;
      const L = Math.hypot(dx, dy) || 1;
      const ux = dx / L, uy = dy / L;
      const nx = -uy, ny = ux;
      const zS = 4.5, zA = 4.5;
      cadPoly(ctx, [
        [x1, y1],
        [mx - ux * zS, my - uy * zS],
        [mx - ux * (zS * 0.35) + nx * zA, my - uy * (zS * 0.35) + ny * zA],
        [mx + ux * (zS * 0.35) - nx * zA, my + uy * (zS * 0.35) - ny * zA],
        [mx + ux * zS, my + uy * zS],
        [x2, y2]
      ], pal.dimLine, 1.1, false, null, [], 'BREAK_LINE');
    }

    // =========================================================================
    // 4. LEFT COLUMN:
    //    - 上：HDPE透水網管埋放斷面圖 (`17707`, `*D28~*D32`, `186F6~187A2`)
    //    - 中：自動補齊之 1:1 對齊【HDPE透水網管埋放俯視平面圖】
    //    - 下：原圖【HDPE透水網管埋放縱剖面圖 (`17675`, `>1%`, `*D20, *D21, *D25`)]
    // =========================================================================
    function drawHdpeBuriedThreeViews(ctx, ox, topY, p, pal) {
      const s = 1.95;
      const B1 = p.B1_cm * s;
      const B2 = p.B2_cm * s;
      const t = p.t_cm * s;
      const H1 = p.H1_cm * s;
      const d_px = Math.max(p.dMinPx, (p.d_cm * s) * p.kPipe);

      const cx = ox + 145;
      const xTopL = cx - B1 / 2;
      const xTopR = cx + B1 / 2;
      const xBotL = cx - B2 / 2;
      const xBotR = cx + B2 / 2;

      const ySurf = topY + 46;
      const yTrenchTop = ySurf + t;
      const yTrenchBot = yTrenchTop + H1;

      // 0) Ghost Baseline (Original B1=50, B2=30, t=10, H1=40)
      if (showGhost) {
        const gB1 = 50 * s, gB2 = 30 * s, gt = 10 * s, gH1 = 40 * s;
        cadPoly(ctx, [
          [cx - gB1 / 2, ySurf + gt],
          [cx + gB1 / 2, ySurf + gt],
          [cx + gB2 / 2, ySurf + gt + gH1],
          [cx - gB2 / 2, ySurf + gt + gH1]
        ], pal.ghostLine, 1.05, true, null, [4, 4], 'GHOST_HDPE_TRENCH');
      }

      // 1) Top Original Soil Backfill Layer (`t`: 原土回填)
      drawBackfillTopLayer(ctx, xTopL, xTopR, ySurf, yTrenchTop, pal);

      // 2) Trapezoidal Trench (`H1`: 2~6cm 清碎石 + 外包透水不織布)
      cadPoly(ctx, [
        [xTopL, yTrenchTop],
        [xTopR, yTrenchTop],
        [xBotR, yTrenchBot],
        [xBotL, yTrenchBot]
      ], pal.geoDash, 1.55, true, 'rgba(56, 189, 248, 0.08)', [], 'HDPE_TRENCH_GEO');

      drawGravelStonesInBox(ctx, cx, (yTrenchTop + yTrenchBot) / 2, (B1 + B2) * 0.44, H1 - 6, false, pal);

      // 3) Center Circular HDPE Perforated Net Pipe (`186F9` & `186FE`: 內徑 d)
      const pipeCY = (yTrenchTop + yTrenchBot) / 2 + 2;
      const rOut = d_px / 2 + 3.0;
      const rIn = d_px / 2;
      cadCircle(ctx, cx, pipeCY, rOut, pal.primaryLine, 1.5, '#0b1120', [], 'HDPE_PIPE_OUT');
      cadCircle(ctx, cx, pipeCY, rIn, pal.pipeMesh, 1.35, null, [3, 2], 'HDPE_PIPE_IN');

      if (p.perf_type !== 'FULL') {
        const halfAng = (p.perf_type === 'PARTIAL_120' ? 60 : 90) * (Math.PI / 180);
        ctx.save();
        ctx.strokeStyle = pal.pipeImpervious;
        ctx.lineWidth = 2.8;
        ctx.beginPath();
        ctx.arc(cx, pipeCY, (rIn + rOut) / 2, Math.PI / 2 - halfAng, Math.PI / 2 + halfAng);
        ctx.stroke();
        ctx.restore();
      }

      // 4) Subgrade Soil Compaction Symbol (`17705` / `17706`: 基層土壤壓實)
      drawSubgradeCompactionSymbol(ctx, cx - 12, yTrenchBot + 1, pal);

      // 5) Dimensions on HDPE Buried Cross-Section (`*D28~*D32`):
      cadDim(ctx, xTopL, ySurf, xTopR, ySurf, -20, `B1 (${p.B1_cm})`, pal, 11);
      cadDim(ctx, xBotL, yTrenchBot, xBotR, yTrenchBot, 22, `B2 (${p.B2_cm})`, pal, 11);
      cadDim(ctx, xTopL, ySurf, xTopL, yTrenchTop, -20, `t (${p.t_cm})`, pal, 10.2);
      cadDim(ctx, xTopL, yTrenchTop, xTopL, yTrenchBot, -20, `H1 (${p.H1_cm})`, pal, 10.5);
      cadDim(ctx, xTopL - 22, ySurf, xTopL - 22, yTrenchBot, -20, `H (${p.H_tot_cm})`, pal, 10.8);
      cadDim(ctx, cx, pipeCY - rIn, cx, pipeCY + rIn, 0, `d (${p.d_mm}mm)`, pal, 10.2);

      // 6) All 5 Callout Leaders on HDPE Buried Cross-Section (`18701, 1874F, 18752, 1875B, 187A2`):
      const callX = xTopR + 24;
      cadLeaderArrow(ctx, xTopR - 6, (ySurf + yTrenchTop) / 2, callX, ySurf + 4, callX + 12, ySurf + 4, ['原土回填'], pal, 10.5);
      cadLeaderArrow(ctx, xTopR - 3, yTrenchTop + 8, callX, yTrenchTop + 10, callX + 12, yTrenchTop + 10, ['透水不織布'], pal, 10.5);
      cadLeaderArrow(ctx, cx + rOut, pipeCY - 3, callX, pipeCY - 2, callX + 12, pipeCY - 2, [`HDPE透水網管(${p.pipe_inch})`, '(外包透水不織布)'], pal, 10.5);
      cadLeaderArrow(ctx, cx + rOut * 0.6, yTrenchBot - 8, callX, yTrenchBot - 6, callX + 12, yTrenchBot - 6, ['2~6cm清碎石'], pal, 10.5);
      cadLeaderArrow(ctx, cx + 6, yTrenchBot + 4, callX, yTrenchBot + 16, callX + 12, yTrenchBot + 16, ['基層土壤壓實'], pal, 10.5);

      const hdpeSecTitleY = yTrenchBot + 42;
      cadText(ctx, 'HDPE透水網管埋放斷面圖 (Scale: N.T.S)', cx + 25, hdpeSecTitleY, 14, pal.titleCyan, 'center', '700');
      cadLine(ctx, cx - 105, hdpeSecTitleY + 8, cx + 155, hdpeSecTitleY + 8, pal.titleCyan, 1.3);

      // =====================================================================
      // PART 2: 自動補齊之 1:1 對齊【HDPE透水網管埋放俯視平面圖】 (PLAN VIEW)
      // =====================================================================
      const xProf0 = ox + 50;
      const wProf = 250;
      const xProf1 = xProf0 + wProf;

      const yPlanTop = hdpeSecTitleY + 34;
      const wPlanB1 = B1 * 0.80;
      const wPlanB2 = B2 * 0.80;
      const wPlanPipe = d_px * 0.85;
      const yPlanMid = yPlanTop + wPlanB1 / 2;
      const yPlanBot = yPlanTop + wPlanB1;

      cadPoly(ctx, [
        [xProf0, yPlanTop],
        [xProf1, yPlanTop],
        [xProf1, yPlanBot],
        [xProf0, yPlanBot]
      ], pal.primaryLine, 1.4, true, 'rgba(30, 41, 59, 0.55)', [], 'PLAN_TRENCH_B1');

      cadLine(ctx, xProf0, yPlanMid - wPlanB2 / 2, xProf1, yPlanMid - wPlanB2 / 2, pal.geoDash, 1.0, [5, 3], 'PLAN_TRENCH_B2');
      cadLine(ctx, xProf0, yPlanMid + wPlanB2 / 2, xProf1, yPlanMid + wPlanB2 / 2, pal.geoDash, 1.0, [5, 3], 'PLAN_TRENCH_B2');

      drawGravelStonesInBox(ctx, (xProf0 + xProf1) / 2, yPlanMid, wProf - 16, wPlanB1 - 6, false, pal);

      const yPipeTopP = yPlanMid - wPlanPipe / 2;
      const yPipeBotP = yPlanMid + wPlanPipe / 2;
      cadPoly(ctx, [
        [xProf0, yPipeTopP],
        [xProf1, yPipeTopP],
        [xProf1, yPipeBotP],
        [xProf0, yPipeBotP]
      ], pal.primaryLine, 1.4, true, '#0b1120', [], 'PLAN_HDPE_PIPE');

      for (let mx = xProf0 + 6; mx < xProf1 - 6; mx += 10) {
        cadLine(ctx, mx, yPipeTopP, mx + 6, yPipeBotP, pal.pipeMesh, 0.85, [], 'PLAN_PIPE_MESH');
        cadLine(ctx, mx + 6, yPipeTopP, mx, yPipeBotP, pal.pipeMesh, 0.85, [], 'PLAN_PIPE_MESH');
      }

      drawBreakLine(ctx, xProf0, yPlanTop - 5, xProf0, yPlanBot + 5, pal);
      drawBreakLine(ctx, xProf1, yPlanTop - 5, xProf1, yPlanBot + 5, pal);

      cadDim(ctx, xProf0, yPlanTop, xProf0, yPlanBot, -20, `B1(${p.B1_cm})`, pal, 10.2);
      cadDim(ctx, xProf1, yPipeTopP, xProf1, yPipeBotP, 18, `d(${p.d_mm})`, pal, 10.2);

      const planTitleY = yPlanBot + 20;
      cadText(ctx, 'HDPE透水網管埋放俯視平面圖 (自動補齊・1:1對齊)', (xProf0 + xProf1) / 2, planTitleY, 13.5, pal.titleCyan, 'center', '700');

      // =====================================================================
      // PART 3: 原圖【HDPE透水網管埋放縱剖面圖】 (1:1 ALIGNED BELOW PLAN VIEW!)
      // =====================================================================
      const yProfStart = planTitleY + 34;
      const dropY = wProf * (p.slope_pct / 100) * 1.2;
      const t_prof = t * 0.85;
      const H1_prof = H1 * 0.95;

      cadLine(ctx, xProf0, yPlanBot + 3, xProf0, yProfStart - 6, pal.secondaryLine, 0.8, [4, 4], 'ALIGN_GUIDE');
      cadLine(ctx, xProf1, yPlanBot + 3, xProf1, yProfStart - 6, pal.secondaryLine, 0.8, [4, 4], 'ALIGN_GUIDE');

      const ySurfL = yProfStart + dropY;
      const ySurfR = yProfStart;
      const yTrTopL = ySurfL + t_prof;
      const yTrTopR = ySurfR + t_prof;
      const yTrBotL = yTrTopL + H1_prof;
      const yTrBotR = yTrTopR + H1_prof;

      const yPipeTopL = (yTrTopL + yTrBotL) / 2 - d_px * 0.42;
      const yPipeTopR = (yTrTopR + yTrBotR) / 2 - d_px * 0.42;
      const yPipeBotL = yPipeTopL + d_px * 0.84;
      const yPipeBotR = yPipeTopR + d_px * 0.84;

      cadPoly(ctx, [
        [xProf0, ySurfL],
        [xProf1, ySurfR],
        [xProf1, yTrTopR],
        [xProf0, yTrTopL]
      ], pal.primaryLine, 1.4, true, 'rgba(148, 163, 184, 0.14)', [], 'PROF_BACKFILL');

      for (let gx = xProf0 + 12; gx < xProf1 - 10; gx += 16) {
        const f = (gx - xProf0) / wProf;
        const gy = ySurfL + f * (ySurfR - ySurfL);
        cadLine(ctx, gx, gy, gx - 3, gy - 5, pal.pipeMesh, 1.0, [], 'PROF_GRASS');
        cadLine(ctx, gx, gy, gx + 2, gy - 6, pal.pipeMesh, 1.0, [], 'PROF_GRASS');
        cadLine(ctx, gx, gy + 2, gx + 5, gy + t_prof - 2, pal.hboneLine, 0.8, [], 'PROF_HBONE');
      }

      cadPoly(ctx, [
        [xProf0, yTrTopL],
        [xProf1, yTrTopR],
        [xProf1, yPipeTopR],
        [xProf0, yPipeTopL]
      ], pal.primaryLine, 1.35, true, 'rgba(245, 158, 11, 0.10)', [], 'PROF_GRAVEL_UP');

      cadPoly(ctx, [
        [xProf0, yPipeBotL],
        [xProf1, yPipeBotR],
        [xProf1, yTrBotR],
        [xProf0, yTrBotL]
      ], pal.primaryLine, 1.35, true, 'rgba(245, 158, 11, 0.10)', [], 'PROF_GRAVEL_LOW');

      drawGravelStonesInBox(ctx, (xProf0 + xProf1) / 2, (yTrTopL + yPipeTopR) / 2, wProf - 14, (yPipeTopL - yTrTopL) - 3, false, pal);
      drawGravelStonesInBox(ctx, (xProf0 + xProf1) / 2, (yPipeBotL + yTrBotR) / 2, wProf - 14, (yTrBotL - yPipeBotL) - 3, false, pal);

      cadPoly(ctx, [
        [xProf0, yPipeTopL],
        [xProf1, yPipeTopR],
        [xProf1, yPipeBotR],
        [xProf0, yPipeBotL]
      ], pal.primaryLine, 1.5, true, '#0b1120', [], 'PROF_PIPE_WALL');
      cadLine(ctx, xProf0, yPipeTopL + 2.5, xProf1, yPipeTopR + 2.5, pal.pipeMesh, 1.0, [5, 3], 'PROF_PIPE_INNER_TOP');
      cadLine(ctx, xProf0, yPipeBotL - 2.5, xProf1, yPipeBotR - 2.5, pal.pipeMesh, 1.0, [5, 3], 'PROF_PIPE_INNER_BOT');

      const arrX1 = xProf0 + 75, arrX2 = xProf0 + 24;
      const arrY1 = (yPipeTopL + yPipeBotL) / 2 + 1;
      const arrY2 = arrY1 + 1.5;
      cadLine(ctx, arrX1, arrY1, arrX2, arrY2, pal.dimLine, 1.5, [], 'SLOPE_ARROW');
      cadPoly(ctx, [[arrX2, arrY2], [arrX2 + 7, arrY2 - 3], [arrX2 + 7, arrY2 + 2]], pal.dimLine, 1.1, true, pal.dimLine);
      cadText(ctx, `>${p.slope_pct >= 1 ? p.slope_pct : 1}%`, (arrX1 + arrX2) / 2 + 6, arrY1 - 7, 10.5, pal.titleCyan, 'center', '700');

      drawSubgradeCompactionSymbol(ctx, xProf0 + 28, yTrBotL + 1, pal);
      drawSubgradeCompactionSymbol(ctx, xProf1 - 55, yTrBotR + 1, pal);
      drawBreakLine(ctx, xProf0, ySurfL - 8, xProf0, yTrBotL + 10, pal);
      drawBreakLine(ctx, xProf1, ySurfR - 8, xProf1, yTrBotR + 10, pal);

      cadDim(ctx, xProf0, ySurfL, xProf0, yTrTopL, -26, `t (${p.t_cm})`, pal, 10.2);
      cadDim(ctx, xProf0, yTrTopL, xProf0, yTrBotL, -26, `H1 (${p.H1_cm})`, pal, 10.5);
      cadDim(ctx, xProf0 - 24, yPipeTopL, xProf0 - 24, yPipeBotL, 0, `d (${p.d_mm})`, pal, 10.2);

      cadLeaderArrow(ctx, xProf1 - 12, (ySurfR + yTrTopR) / 2, xProf1 + 16, ySurfR + 4, xProf1 + 26, ySurfR + 4, ['原土回填'], pal, 10.5);
      cadLeaderArrow(ctx, xProf1 - 12, yTrBotR + 3, xProf1 + 16, yTrBotR + 8, xProf1 + 26, yTrBotR + 8, ['基層土壤壓實'], pal, 10.5);

      const profTitleY = yTrBotL + 36;
      cadText(ctx, 'HDPE透水網管埋放縱剖面圖 (Scale: N.T.S)', (xProf0 + xProf1) / 2, profTitleY, 14, pal.titleCyan, 'center', '700');
      cadLine(ctx, (xProf0 + xProf1) / 2 - 125, profTitleY + 8, (xProf0 + xProf1) / 2 + 125, profTitleY + 8, pal.titleCyan, 1.3);

      return {
        rightX: xProf1 + 125,
        bottomY: profTitleY + 24
      };
    }

    // =========================================================================
    // 5. RIGHT COLUMN: 原圖【HDPE透水網管大樣圖】(`17670`) + 雙斷面 (`*D26, *D27`) + 規格表 (`*T23, *T24`) + 符號說明
    // =========================================================================
    function drawRightHdpePipeDetailAndTables(ctx, ox, topY, p, pal) {
      const x0 = ox + 45;
      const y0 = topY + 46;

      const cxSec = x0 + 42;
      const rPipeOut = 25;
      const rPipeIn = 20;

      // Top Circle: 全透水型 (360° permeable mesh ring)
      const cySec1 = y0 + 28;
      cadCircle(ctx, cxSec, cySec1, rPipeOut, pal.primaryLine, 1.4, 'rgba(15, 23, 42, 0.85)', [], 'DETAIL_PIPE_FULL_OUT');
      cadCircle(ctx, cxSec, cySec1, rPipeIn, pal.pipeMesh, 1.2, null, [3, 2], 'DETAIL_PIPE_FULL_IN');
      for (let i = 0; i < 24; i++) {
        const ang = (i / 24) * Math.PI * 2;
        cadLine(
          ctx,
          cxSec + Math.cos(ang) * rPipeIn, cySec1 + Math.sin(ang) * rPipeIn,
          cxSec + Math.cos(ang) * rPipeOut, cySec1 + Math.sin(ang) * rPipeOut,
          pal.pipeMesh, 1.0, [], 'FULL_MESH_TICK'
        );
      }
      cadDim(ctx, cxSec - rPipeOut, cySec1 - rPipeOut, cxSec - rPipeOut, cySec1 + rPipeOut, -20, `d (${p.d_mm})`, pal, 10.5);
      cadText(ctx, '全透水型', cxSec, cySec1 + rPipeOut + 15, 10.8, pal.titleCyan, 'center', '700');

      // Bottom Circle: 2/3透水型 (Bottom 120°/180° unperforated solid arc, matching DXF `1770B`!)
      const cySec2 = cySec1 + 84;
      cadCircle(ctx, cxSec, cySec2, rPipeOut, pal.primaryLine, 1.4, 'rgba(15, 23, 42, 0.85)', [], 'DETAIL_PIPE_PART_OUT');
      cadCircle(ctx, cxSec, cySec2, rPipeIn, pal.pipeMesh, 1.2, null, [3, 2], 'DETAIL_PIPE_PART_IN');

      const impervDeg = (p.perf_type === 'PARTIAL_180') ? 180 : 120;
      for (let i = 0; i < 24; i++) {
        const deg = (i / 24) * 360;
        const isBottomImperv = (deg >= 90 - impervDeg / 2 && deg <= 90 + impervDeg / 2);
        const ang = (deg * Math.PI) / 180;
        if (!isBottomImperv) {
          cadLine(
            ctx,
            cxSec + Math.cos(ang) * rPipeIn, cySec2 + Math.sin(ang) * rPipeIn,
            cxSec + Math.cos(ang) * rPipeOut, cySec2 + Math.sin(ang) * rPipeOut,
            pal.pipeMesh, 1.0, [], 'PART_MESH_TICK'
          );
        }
      }
      const halfRad = (impervDeg / 2) * (Math.PI / 180);
      ctx.save();
      ctx.strokeStyle = pal.pipeImpervious;
      ctx.lineWidth = 4.5;
      ctx.beginPath();
      ctx.arc(cxSec, cySec2, (rPipeIn + rPipeOut) / 2, Math.PI / 2 - halfRad, Math.PI / 2 + halfRad);
      ctx.stroke();
      ctx.restore();

      cadDim(ctx, cxSec - rPipeOut, cySec2 - rPipeOut, cxSec - rPipeOut, cySec2 + rPipeOut, -20, `d (${p.d_mm})`, pal, 10.5);
      cadText(ctx, `2/3透水型 (底${impervDeg}°不開孔)`, cxSec + 8, cySec2 + rPipeOut + 15, 10.8, pal.titleCyan, 'center', '700');

      // 3D Isometric Woven Net Pipe Cylinders (`1770D..186EF`)
      const xCyl0 = cxSec + 68;
      const wCyl = 185;
      const hCyl = 48;

      const draw3DHdpeNetCylinder = (xStart, yCenter, isPartial) => {
        const yT = yCenter - hCyl / 2;
        const yB = yCenter + hCyl / 2;
        const rxEnd = 9.0;

        cadLine(ctx, xStart, yT, xStart + wCyl, yT, pal.primaryLine, 1.5, [], 'CYL_TOP');
        cadLine(ctx, xStart, yB, xStart + wCyl, yB, pal.primaryLine, 1.5, [], 'CYL_BOT');

        ctx.save();
        ctx.strokeStyle = pal.primaryLine;
        ctx.fillStyle = 'rgba(15, 23, 42, 0.90)';
        ctx.lineWidth = 1.45;
        ctx.beginPath();
        ctx.ellipse(xStart, yCenter, rxEnd, hCyl / 2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.beginPath();
        ctx.ellipse(xStart + wCyl, yCenter, rxEnd, hCyl / 2, 0, -Math.PI / 2, Math.PI / 2);
        ctx.stroke();
        ctx.restore();

        const nPitch = 14;
        const pitchX = wCyl / nPitch;
        for (let i = 0; i < nPitch; i++) {
          const px0 = xStart + i * pitchX;
          const pxMid = px0 + pitchX * 0.5;
          const px1 = px0 + pitchX;

          const yLim = isPartial ? (yCenter + hCyl * 0.18) : yB;
          cadLine(ctx, px0, yT + 2, pxMid, yLim - 2, pal.pipeMesh, 1.15, [], 'HDPE_FIBER_1');
          cadLine(ctx, pxMid, yLim - 2, px1, yT + 2, pal.pipeMesh, 1.15, [], 'HDPE_FIBER_2');
          cadLine(ctx, px0, (yT + yLim) / 2, pxMid, yT + 2, pal.pipeMesh, 1.0, [], 'HDPE_FIBER_3');
          cadLine(ctx, pxMid, yT + 2, px1, (yT + yLim) / 2, pal.pipeMesh, 1.0, [], 'HDPE_FIBER_4');

          cadCircle(ctx, pxMid, (yT + yLim) / 2, 1.6, pal.structYellow, 0.9, '#0b1120', [], 'FUSED_NODE');
        }

        const nLongRibs = isPartial ? 3 : 5;
        for (let r = 1; r <= nLongRibs; r++) {
          const ry = yT + (r / (nLongRibs + 1)) * (isPartial ? hCyl * 0.68 : hCyl);
          cadLine(ctx, xStart + rxEnd * 0.5, ry, xStart + wCyl, ry, pal.secondaryLine, 0.85, [], 'HDPE_LONG_RIB');
        }

        if (isPartial) {
          const yImpTop = yCenter + hCyl * 0.18;
          cadPoly(ctx, [
            [xStart + rxEnd * 0.4, yImpTop],
            [xStart + wCyl, yImpTop],
            [xStart + wCyl, yB],
            [xStart + rxEnd * 0.4, yB]
          ], pal.pipeImpervious, 1.35, true, 'rgba(56, 189, 248, 0.20)', [], 'IMPERVIOUS_BAND');
          cadText(ctx, `底部不可開孔範圍 (${impervDeg}°)`, xStart + wCyl / 2, (yImpTop + yB) / 2, 9.8, pal.dimText, 'center', '700');
        }
      };

      draw3DHdpeNetCylinder(xCyl0, cySec1, false);
      draw3DHdpeNetCylinder(xCyl0, cySec2, true);

      const pipeDetailTitleY = cySec2 + rPipeOut + 38;
      const pipeDetailCX = (cxSec + xCyl0 + wCyl) / 2;
      cadText(ctx, 'HDPE透水網管大樣圖 (Scale: N.T.S)', pipeDetailCX, pipeDetailTitleY, 14.5, pal.titleCyan, 'center', '700');
      cadLine(ctx, pipeDetailCX - 115, pipeDetailTitleY + 8, pipeDetailCX + 115, pipeDetailTitleY + 8, pal.titleCyan, 1.35);
      cadLine(ctx, pipeDetailCX - 115, pipeDetailTitleY + 11, pipeDetailCX + 115, pipeDetailTitleY + 11, pal.titleCyan, 0.95);

      // Table 1 (`*T24`): 開孔型式 | 全透水型 | 2/3透水型
      const tblX = ox + 20;
      const tbl1Y = pipeDetailTitleY + 30;
      cadText(ctx, '【表1：HDPE透水網管開孔型式選用表 (原圖 *T24)】', tblX, tbl1Y - 10, 11.2, pal.titleCyan, 'left', '700');
      const t24Cols = [92, 112, 132];
      const t24RowH = 24;
      const t24W = t24Cols[0] + t24Cols[1] + t24Cols[2];
      const t24H = t24RowH * 2;

      cadPoly(ctx, [
        [tblX, tbl1Y],
        [tblX + t24W, tbl1Y],
        [tblX + t24W, tbl1Y + t24H],
        [tblX, tbl1Y + t24H]
      ], pal.primaryLine, 1.35, true, 'rgba(15, 23, 42, 0.88)', [], 'TABLE_T24');

      cadLine(ctx, tblX + t24Cols[0], tbl1Y + t24RowH, tblX + t24W, tbl1Y + t24RowH, pal.tableBorder, 1.0);
      cadLine(ctx, tblX + t24Cols[0], tbl1Y, tblX + t24Cols[0], tbl1Y + t24H, pal.tableBorder, 1.0);
      cadLine(ctx, tblX + t24Cols[0] + t24Cols[1], tbl1Y, tblX + t24Cols[0] + t24Cols[1], tbl1Y + t24H, pal.tableBorder, 1.0);

      cadText(ctx, '開孔型式', tblX + t24Cols[0] / 2, tbl1Y + t24H / 2, 11, pal.textMain, 'center', '700');
      cadText(ctx, '全透水型', tblX + t24Cols[0] + t24Cols[1] / 2, tbl1Y + t24RowH / 2, 10.8, pal.textMain, 'center', '600');
      cadText(ctx, '2/3透水型 (或1/2透水)', tblX + t24Cols[0] + t24Cols[1] + t24Cols[2] / 2, tbl1Y + t24RowH / 2, 10.8, pal.textMain, 'center', '600');

      const isFullPerf = (p.perf_type === 'FULL');
      cadText(ctx, isFullPerf ? '✓ 採用' : '', tblX + t24Cols[0] + t24Cols[1] / 2, tbl1Y + t24RowH * 1.5, 11, pal.structYellow, 'center', '700');
      cadText(ctx, !isFullPerf ? '✓ 採用' : '', tblX + t24Cols[0] + t24Cols[1] + t24Cols[2] / 2, tbl1Y + t24RowH * 1.5, 11, pal.structYellow, 'center', '700');

      // Table 2 (`*T23`): 型號 (2"~10") | 內徑 (50~250) | 採用型式
      const tbl2Y = tbl1Y + t24H + 26;
      cadText(ctx, '【表2：HDPE透水網管管徑規格表 (原圖 *T23，單位：mm)】', tblX, tbl2Y - 10, 11.2, pal.titleCyan, 'left', '700');
      const t23Cols = [72, 38, 38, 38, 38, 38, 38, 40];
      const t23RowH = 24;
      const t23W = t23Cols.reduce((a, b) => a + b, 0);
      const t23H = t23RowH * 3;

      cadPoly(ctx, [
        [tblX, tbl2Y],
        [tblX + t23W, tbl2Y],
        [tblX + t23W, tbl2Y + t23H],
        [tblX, tbl2Y + t23H]
      ], pal.primaryLine, 1.35, true, 'rgba(15, 23, 42, 0.88)', [], 'TABLE_T23');

      cadLine(ctx, tblX, tbl2Y + t23RowH, tblX + t23W, tbl2Y + t23RowH, pal.tableBorder, 1.0);
      cadLine(ctx, tblX, tbl2Y + t23RowH * 2, tblX + t23W, tbl2Y + t23RowH * 2, pal.tableBorder, 1.0);

      const t23Rows = [
        ['型號', '2"', '3"', '4"', '5"', '6"', '8"', '10"'],
        ['內徑 d', '50', '75', '100', '125', '150', '200', '250'],
        ['採用型式', ...PIPE_SPECS.map(sp => sp.d_mm === p.d_mm ? '✓' : '')]
      ];

      let cxCol = tblX;
      for (let c = 0; c < t23Cols.length; c++) {
        const cw = t23Cols[c];
        if (c > 0) {
          cadLine(ctx, cxCol, tbl2Y, cxCol, tbl2Y + t23H, pal.tableBorder, 0.95);
        }
        const isSelectedCol = (c > 0 && PIPE_SPECS[c - 1].d_mm === p.d_mm);
        if (isSelectedCol) {
          ctx.save();
          ctx.fillStyle = 'rgba(34, 211, 238, 0.16)';
          ctx.fillRect(cxCol, tbl2Y, cw, t23H);
          ctx.restore();
        }
        for (let r = 0; r < 3; r++) {
          const ry = tbl2Y + (r + 0.5) * t23RowH;
          const colTxt = isSelectedCol ? pal.structYellow : (c === 0 ? pal.titleCyan : pal.textMain);
          cadText(ctx, t23Rows[r][c], cxCol + cw / 2, ry, 10.6, colTxt, 'center', (c === 0 || isSelectedCol) ? '700' : '500');
          cxCol += 0;
        }
        cxCol += cw;
      }

      // Symbol Legend Box for HDPE Net Pipe Blind Ditch
      const legY = tbl2Y + t23H + 22;
      const legW = t23W;
      const legH = 112;
      cadPoly(ctx, [
        [tblX, legY],
        [tblX + legW, legY],
        [tblX + legW, legY + legH],
        [tblX, legY + legH]
      ], pal.tableBorder, 1.15, true, 'rgba(15, 23, 42, 0.88)', [], 'SYMBOL_LEGEND_HDPE');
      cadText(ctx, '符號說明 (HDPE透水網管盲溝)：', tblX + 12, legY + 16, 11.5, pal.titleCyan, 'left', '700');
      const symItems = [
        `B1  溝頂寬 (${p.B1_cm} cm)        B2  溝底寬 (${p.B2_cm} cm)`,
        `t   原土回填厚 (${p.t_cm} cm)     H1  碎石盲溝深 (${p.H1_cm} cm)`,
        `H   總溝深 (${p.H_tot_cm} cm = t + H1)`,
        `d   HDPE透水網管內徑 (${p.d_mm} mm / 型號 ${p.pipe_inch})`
      ];
      symItems.forEach((st, idx) => {
        cadText(ctx, st, tblX + 14, legY + 38 + idx * 20, 10.2, pal.textMain, 'left', '600');
      });

      return {
        rightX: tblX + t23W + 30,
        bottomY: legY + legH + 16
      };
    }

    // =========================================================================
    // 6. EXPLICIT FIGURE-NUMBER QUANTITY TABLE ON CANVAS
    // =========================================================================
    function drawExplicitFormulaTableOnCanvas(ctx, ox, oy, p, pal) {
      cadText(
        ctx,
        `【塑料盲溝(二)：HDPE透水網管盲溝 (0513-1) 每公尺數量計算式表 — 採用圖面標註數字顯式列式 (B1=${p.B1_cm}・B2=${p.B2_cm}・H=${p.H_tot_cm}・H1=${p.H1_cm}cm・管徑=${p.pipe_inch}/d=${p.d_mm}mm・全段=${p.L_tot_m.toFixed(1)}m)】`,
        ox, oy - 15, 13.0, pal.dimText, 'left', '700'
      );

      const colW = [250, 495, 82, 92, 52];
      const rowH = 26;
      const rows = [
        ['工程項目名稱 (依DXF圖面標註)', '採用圖面標註數字之顯式計算式 (每公尺基準)', '每m數量', `全段(${p.L_tot_m}m)`, '單位'],
        [`HDPE透水網管 (外包透水不織布, 縱坡>${p.slope_pct}%)`, p.formula_pipe_len, p.q_pipe_len.toFixed(2), (p.q_pipe_len * p.L_tot_m).toFixed(1), 'M'],
        [`2~6cm 清碎石濾料 (盲溝深H1=${p.H1_cm}cm, 扣除${p.pipe_inch}網管)`, p.formula_gravel_hdpe, p.q_gravel_hdpe.toFixed(2), (p.q_gravel_hdpe * p.L_tot_m).toFixed(2), 'M³'],
        [`透水不織布包覆 (外槽梯形包覆+網管外包濾膜)`, p.formula_geo_area, p.q_geo_area.toFixed(2), (p.q_geo_area * p.L_tot_m).toFixed(1), 'M²'],
        [`梯形盲溝開挖土方 (B1=${p.B1_cm}, B2=${p.B2_cm}, 總深H=${p.H_tot_cm}cm)`, p.formula_excav_vol, p.q_excav_vol.toFixed(2), (p.q_excav_vol * p.L_tot_m).toFixed(2), 'M³'],
        [`頂層原土回填 (寬B1=${p.B1_cm}cm, 厚t=${p.t_cm}cm)`, p.formula_backfill_vol, p.q_backfill_vol.toFixed(2), (p.q_backfill_vol * p.L_tot_m).toFixed(2), 'M³'],
        ['基層土壤壓實 (壓實度應達 80% 以上為原則)', p.formula_compact_area, p.q_compact_area.toFixed(2), (p.q_compact_area * p.L_tot_m).toFixed(1), 'M²']
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
          const color = isHeader ? pal.textMain : (cIdx === 2 ? pal.dimText : (cIdx === 3 ? pal.structYellow : pal.textSub));
          cadText(ctx, cellStr, tx, ry, isHeader ? 11.2 : 10.5, color, align, (isHeader || cIdx === 2 || cIdx === 3) ? '700' : '500');
          cx += cw;
        });
      });

      return { bottomY: oy + totH };
    }

    // =========================================================================
    // 7. MAIN RENDER ENGINE & LIVE UI UPDATER
    // =========================================================================
    function updateSidebarSummary(p) {
      document.getElementById('stat_ditch_tag').textContent = `${p.pipe_inch} (d=${p.d_mm}mm)・H=${p.H_tot_cm}cm`;
      document.getElementById('stat_pipe_m').textContent = `1.00 M/m (${p.pipe_inch})`;
      document.getElementById('stat_gravel_m').textContent = `${p.q_gravel_hdpe.toFixed(2)} M³/m`;
      document.getElementById('stat_geo_m').textContent = `${p.q_geo_area.toFixed(2)} M²/m`;
      document.getElementById('stat_excav_m').textContent = `${p.q_excav_vol.toFixed(2)} + ${p.q_backfill_vol.toFixed(2)} M³`;
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

      if (currentView === 'BURIED_VIEWS') {
        const bLeft = drawHdpeBuriedThreeViews(ctx, 40, 12, p, pal);
        drawExplicitFormulaTableOnCanvas(ctx, 40, bLeft.bottomY + 36, p, pal);
      } else if (currentView === 'PIPE_DETAIL') {
        const bRight = drawRightHdpePipeDetailAndTables(ctx, 50, 12, p, pal);
        drawExplicitFormulaTableOnCanvas(ctx, 45, bRight.bottomY + 36, p, pal);
      } else {
        // 'ALL' Full Standard Sheet Layout for Web Page 2 (HDPE透水網管盲溝):
        const bLeft = drawHdpeBuriedThreeViews(ctx, 25, 10, p, pal);
        const rightColX = bLeft.rightX + 35;
        const bRight = drawRightHdpePipeDetailAndTables(ctx, rightColX, 10, p, pal);

        const tableY = Math.max(bLeft.bottomY, bRight.bottomY) + 38;
        drawExplicitFormulaTableOnCanvas(ctx, 25, tableY, p, pal);
      }

      ctx.restore();
    }

    // =========================================================================
    // 8. UI CONTROLS, AUTO-SYNC & DXF / CSV EXPORTERS
    // =========================================================================
    function onDepthChange() {
      const t = parseFloat(document.getElementById('inp_t_cm').value) || 10;
      const h1 = parseFloat(document.getElementById('inp_H1_cm').value) || 40;
      document.getElementById('inp_H_tot_cm').value = Math.round(t + h1);
      renderAll();
    }

    function onPipeModelChange() {
      const dMm = parseFloat(document.getElementById('inp_pipe_model').value) || 150;
      const dCm = dMm / 10;
      if (dCm + 22 > parseFloat(document.getElementById('inp_H1_cm').value)) {
        document.getElementById('inp_H1_cm').value = Math.round(dCm + 25);
        onDepthChange();
      }
      if (dCm + 12 > parseFloat(document.getElementById('inp_B2_cm').value)) {
        document.getElementById('inp_B2_cm').value = Math.round(dCm + 15);
        if (parseFloat(document.getElementById('inp_B1_cm').value) < dCm + 30) {
          document.getElementById('inp_B1_cm').value = Math.round(dCm + 35);
        }
      }
      renderAll();
    }

    function onGeomChange() {
      renderAll();
    }

    function resetToOrig() {
      Object.keys(ORIG_HDPE_BLIND_DITCH).forEach(k => {
        const el = document.getElementById('inp_' + k);
        if (el) el.value = ORIG_HDPE_BLIND_DITCH[k];
      });
      renderAll();
    }

    function switchView(view) {
      currentView = view;
      const specEl = document.getElementById('specPanel');
      const tabs = {
        ALL: document.getElementById('tab-all'),
        BURIED_VIEWS: document.getElementById('tab-buried'),
        PIPE_DETAIL: document.getElementById('tab-pipe'),
        SPEC: document.getElementById('tab-spec')
      };
      Object.keys(tabs).forEach(k => {
        if (!tabs[k]) return;
        tabs[k].className = (k === view)
          ? 'px-3 py-1.5 rounded-md text-xs font-semibold transition-all bg-cyan-600 text-white shadow'
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
        ? 'px-2.5 py-1 rounded bg-cyan-950/90 border border-cyan-600/60 text-xs text-cyan-300 flex items-center gap-1 transition'
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
      if (currentView === 'BURIED_VIEWS' || currentView === 'PIPE_DETAIL') {
        viewCam.scale = Math.min(rect.width / 1040, rect.height / 900) * 0.93;
        viewCam.offsetX = Math.max(20, (rect.width - 980 * viewCam.scale) / 2);
        viewCam.offsetY = 14;
      } else {
        viewCam.scale = Math.min(rect.width / 1180, rect.height / 960) * 0.94;
        viewCam.offsetX = Math.max(20, (rect.width - 1120 * viewCam.scale) / 2);
        viewCam.offsetY = 12;
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
      a.download = `塑料盲溝_HDPE透水網管型_0513-1_d${p.d_mm}mm_H${p.H_tot_cm}cm.dxf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }

    function exportCSV() {
      const p = getParams();
      const rows = [
        [`塑料盲溝(二)：HDPE透水網管盲溝 (圖號 0513-1・溝頂寬B1=${p.B1_cm}cm・溝底寬B2=${p.B2_cm}cm・總溝深H=${p.H_tot_cm}cm・網管=${p.pipe_inch}/d=${p.d_mm}mm) - 圖面標註數字顯式列式數量計算書`],
        ['工程項目名稱', '採用圖面標註數字之顯式計算式 (每公尺基準)', '每公尺數量', `全段數量(${p.L_tot_m}m)`, '單位'],
        [`HDPE透水網管 (外包透水不織布, 縱坡>${p.slope_pct}%)`, `'${p.formula_pipe_len}`, p.q_pipe_len.toFixed(2), (p.q_pipe_len * p.L_tot_m).toFixed(1), 'M'],
        [`2~6cm 清碎石濾料 (盲溝深H1=${p.H1_cm}cm, 扣除${p.pipe_inch}網管)`, `'${p.formula_gravel_hdpe}`, p.q_gravel_hdpe.toFixed(2), (p.q_gravel_hdpe * p.L_tot_m).toFixed(2), 'M³'],
        [`透水不織布包覆 (外槽梯形包覆+網管外包濾膜)`, `'${p.formula_geo_area}`, p.q_geo_area.toFixed(2), (p.q_geo_area * p.L_tot_m).toFixed(1), 'M²'],
        [`梯形盲溝開挖土方 (B1=${p.B1_cm}, B2=${p.B2_cm}, 總深H=${p.H_tot_cm}cm)`, `'${p.formula_excav_vol}`, p.q_excav_vol.toFixed(2), (p.q_excav_vol * p.L_tot_m).toFixed(2), 'M³'],
        [`頂層原土回填 (寬B1=${p.B1_cm}cm, 厚t=${p.t_cm}cm)`, `'${p.formula_backfill_vol}`, p.q_backfill_vol.toFixed(2), (p.q_backfill_vol * p.L_tot_m).toFixed(2), 'M³'],
        ['基層土壤壓實 (壓實度應達 80% 以上為原則)', `'${p.formula_compact_area}`, p.q_compact_area.toFixed(2), (p.q_compact_area * p.L_tot_m).toFixed(1), 'M²']
      ];

      const csvContent = '\uFEFF' + rows.map(r => r.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `HDPE透水網管盲溝顯式列式計算書_0513-1_d${p.d_mm}mm.csv`;
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

  const STRIP = s => String(s).replace(/\s*[（(]\s*圖號[^）)]*[）)]/g, '').replace(/\s*[（(]\s*\d{4}-\d\s*[/／]\s*\d{3}\s*[）)]/g, '').replace(/\s*圖號\s*[：:]?\s*[0-9A-Za-z#\-／/ ]+/g, ' ');
  function params(R) { Object.keys(R || {}).forEach(k => { el('inp_' + k).value = String(R[k]); }); return getParams(); }
  function run(R, OV) {
    O = []; const PAL = getPalette(), p = params(R); Object.assign(p, R || {}, OV || {});
    const bL = drawHdpeBuriedThreeViews(CTX, 25, 10, p, PAL), bR = drawRightHdpePipeDetailAndTables(CTX, bL.rightX + 35, 10, p, PAL); drawExplicitFormulaTableOnCanvas(CTX, 25, Math.max(bL.bottomY, bR.bottomY) + 38, p, PAL);
    
    const sc = 1 / 1.95; return O.map(o => { const r = Object.assign({}, o); if (r.p) r.p = r.p.map(([x, y]) => [x * sc, y * sc]); if (r.x !== undefined) { r.x *= sc; r.y *= sc; } if (r.r) r.r *= sc; if (r.h) r.h *= sc; if (r.s !== undefined && r.k === 'T') r.s = STRIP(r.s); return r; });
  }
  return { run, params };
})();
TCO_D['frb'] = (function () {
  let O = [];
  const EL = {}, CTX = new Proxy({}, { get: (t, k) => (k in t ? t[k] : () => ({ width: 0 })), set: (t, k, v) => { t[k] = v; return true; } });
  const el = id => EL[id] || (EL[id] = { value: '', textContent: '', innerHTML: '', className: '', style: {}, classList: { add() {}, remove() {}, toggle() {} }, addEventListener() {}, getContext: () => CTX, parentElement: { getBoundingClientRect: () => ({ width: 100, height: 100 }) } });
  const document = { getElementById: el, querySelectorAll: () => [], querySelector: () => null, createElement: () => ({ click() {}, style: {} }), body: { appendChild() {}, removeChild() {}, classList: { add() {}, remove() {}, toggle() {}, contains: () => false } }, documentElement: { classList: { contains: () => false, add() {}, remove() {}, toggle() {} } }, addEventListener() {} };
  const window = { addEventListener() {}, devicePixelRatio: 1, matchMedia: () => ({ matches: false, addEventListener() {} }) };

    // =========================================================================
    // 1. ORIGINAL DXF BASELINE CONSTANTS & GLOBAL STATE (PURE ASCII IDENTIFIERS)
    // =========================================================================
    const ORIG_FREE_FRAME_SLOPE = {
      B2_cm: 200,
      B3_cm: 30,
      B1_cm: 230,
      H_beam_cm: 15,
      t_sub_cm: 5,
      N_grid: 3,
      L1_cm: 70,
      L2_cm: 120,
      L3_cm: 150,
      hook_cm: 10,
      d_hole_cm: 3.0,
      A_tot_m2: 100.0
    };

    let currentView = 'ALL'; // 'ALL', 'PLAN_SECTION', 'PINS_MESH', 'SPEC'
    let showGhost = false;
    let isDarkTheme = true;

    let viewCam = {
      scale: 0.68,
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

      const B2_cm = Math.max(100, Math.min(400, Math.round(num('inp_B2_cm', 200))));
      const B3_cm = Math.max(20, Math.min(50, Math.round(num('inp_B3_cm', 30))));
      const B1_cm = Math.max(120, Math.min(450, Math.round(num('inp_B1_cm', 230))));
      const H_beam_cm = Math.max(10, Math.min(30, Math.round(num('inp_H_beam_cm', 15))));
      const t_sub_cm = Math.max(3, Math.min(15, Math.round(num('inp_t_sub_cm', 5))));
      const N_grid = Math.max(2, Math.min(5, Math.round(num('inp_N_grid', 3))));

      const L1_cm = Math.max(40, Math.min(150, Math.round(num('inp_L1_cm', 70))));
      const L2_cm = Math.max(60, Math.min(200, Math.round(num('inp_L2_cm', 120))));
      const L3_cm = Math.max(80, Math.min(300, Math.round(num('inp_L3_cm', 150))));
      const hook_cm = Math.max(8, Math.min(20, Math.round(num('inp_hook_cm', 10))));
      const d_hole_cm = Math.max(2.5, Math.min(6.0, +num('inp_d_hole_cm', 3.0).toFixed(1)));
      const A_tot_m2 = Math.max(10.0, Math.min(2000.0, num('inp_A_tot_m2', 100.0)));

      const p = {
        B2_cm,
        B3_cm,
        B1_cm,
        H_beam_cm,
        t_sub_cm,
        N_grid,
        L1_cm,
        L2_cm,
        L3_cm,
        hook_cm,
        d_hole_cm,
        A_tot_m2
      };

      const B2_m = +(B2_cm / 100).toFixed(2);
      const B3_m = +(B3_cm / 100).toFixed(2);
      const pitch_m = +(B2_m + B3_m).toFixed(2); // Center-to-center frame pitch (2.00 + 0.30 = 2.30m)
      const Hbeam_m = +(H_beam_cm / 100).toFixed(2);
      const tsub_m = +(t_sub_cm / 100).toFixed(2);
      const L1_m = +(L1_cm / 100).toFixed(2);
      const L2_m = +(L2_cm / 100).toFixed(2);
      const L3_m = +(L3_cm / 100).toFixed(2);
      const hook_m = +(hook_cm / 100).toFixed(2);

      // Single Grid Module Area A_mod = (B2 + B3)^2 (e.g. 2.30 * 2.30 = 5.29 M2/格)
      p.A_mod_m2 = +(pitch_m * pitch_m).toFixed(2);
      p.N_cells_tot = +(A_tot_m2 / p.A_mod_m2).toFixed(1); // Number of grid cells in A_tot_m2

      // 1. 自由梁噴 1:3 水泥砂漿 (寬 B3±5cm、高 15±5cm 圓弧頂斷面):
      // Cross-sectional area of rounded-top beam ≈ 0.86 * B3_m * Hbeam_m
      const beamSecArea = +(0.86 * B3_m * Hbeam_m).toFixed(4);
      const beamLenPerCell = +(2 * pitch_m - B3_m).toFixed(2); // 2 * 2.30 - 0.30 = 4.30m per cell
      p.q_mortar_cell = +(beamSecArea * beamLenPerCell).toFixed(3);
      p.q_mortar_m2 = +(p.q_mortar_cell / p.A_mod_m2).toFixed(3);
      p.formula_mortar = `[單格梁長(2*${pitch_m.toFixed(2)}-${B3_m.toFixed(2)}=${beamLenPerCell.toFixed(2)}m) * 圓弧梁斷面(0.86*寬B3(${B3_m.toFixed(2)})*高(${Hbeam_m.toFixed(2)})) = ${p.q_mortar_cell.toFixed(3)}M³/格] / 單格面積${p.A_mod_m2.toFixed(2)}M²`;

      // 2. 植生基材 (厚 5cm，鋪設於自由梁框內淨空 B2×B2):
      const vegAreaPerCell = +(B2_m * B2_m).toFixed(2); // 2.00 * 2.00 = 4.00 M2/格
      p.q_sub_area_m2 = +(vegAreaPerCell / p.A_mod_m2).toFixed(2);
      p.q_sub_vol_m2 = +(p.q_sub_area_m2 * tsub_m).toFixed(3);
      p.formula_sub = `框內淨面積[B2(${B2_m.toFixed(2)}m)² = ${vegAreaPerCell.toFixed(2)}M²/格] / 單格模數[(B2+B3)² = ${p.A_mod_m2.toFixed(2)}M²/格] (厚${t_sub_cm}cm)`;

      // 3. 鍍鋅鐵絲網(一層) (網目50×50mm, 高度25±5mm, 線徑∅=2mm以上, 鍍鋅量≧245g/m²):
      p.q_mesh_m2 = 1.05; // 1.00 M2/M2 + 5% overlap
      p.formula_mesh = `全坡面滿鋪一層鍍鋅鐵絲網 (網目50×50mm, 高度25±5mm, 含搭接損耗 1.05 M²/M²)`;

      // 4. 土(岩)釘 (J型#6鋼筋, 長 L3, 鑽孔直徑 3cm 孔內灌注 1:2 水泥漿, 每格交點 1 支):
      p.q_nail_cnt_m2 = +(1 / p.A_mod_m2).toFixed(3);
      const nailBarLen_m = +(L3_m + 0.22).toFixed(2); // L3 + J-hook 22cm
      p.formula_nail = `每格交點1處 [鑽孔∅${d_hole_cm}cm灌1:2水泥漿 + J型#6鋼筋長(L3=${L3_m.toFixed(2)}m+彎鉤0.22m)] / 單格面積${p.A_mod_m2.toFixed(2)}M²`;

      // 5. 主錨釘/大ㄇ型鋼筋 (#5鋼筋, 長 L2+10cm, 每格平均 1 支) & 輔錨釘/小ㄇ型鋼筋 (#4鋼筋, 長 L1+10cm, 每格平均 1 支):
      p.q_pin_pair_m2 = +(1 / p.A_mod_m2).toFixed(3);
      p.formula_pins = `每格平均施作 1支大ㄇ主錨釘(#5, 長L2=${L2_cm}+彎鉤${hook_cm}cm) 與 1支小ㄇ輔錨釘(#4, 長L1=${L1_cm}+彎鉤${hook_cm}cm) / ${p.A_mod_m2.toFixed(2)}M²`;

      // 6. 鋼筋加工及組立總重 (#3自由梁雙向筋 + #4小ㄇ輔錨釘 + #5大ㄇ主錨釘 + #6 J型土岩釘):
      // Unit weights: #3 (D10) = 0.559 kg/m, #4 (D13) = 0.995 kg/m, #5 (D16) = 1.553 kg/m, #6 (D19) = 2.240 kg/m
      const wt3_cell = (2 * 2 * pitch_m) * 0.559;                  // #3鋼筋×2支×雙向 per cell
      const wt4_cell = (L1_m + hook_m) * 0.995;                    // 1支小ㄇ#4 per cell
      const wt5_cell = (L2_m + hook_m) * 1.553;                    // 1支大ㄇ#5 per cell
      const wt6_cell = nailBarLen_m * 2.240;                       // 1支J型#6土岩釘 per cell
      p.q_rebar_cell_kg = +(wt3_cell + wt4_cell + wt5_cell + wt6_cell).toFixed(2);
      p.q_rebar_m2 = +(p.q_rebar_cell_kg / p.A_mod_m2).toFixed(2);
      p.formula_rebar = `[自由梁#3×2支×雙向(${wt3_cell.toFixed(2)}kg) + 小ㄇ#4(${wt4_cell.toFixed(2)}kg) + 大ㄇ#5(${wt5_cell.toFixed(2)}kg) + J型#6土岩釘(${wt6_cell.toFixed(2)}kg) = ${p.q_rebar_cell_kg.toFixed(2)}kg/格] / ${p.A_mod_m2.toFixed(2)}M²`;

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
          frameRed: '#f43f5e',
          rebarYellow: '#facc15',
          meshBlue: '#60a5fa',
          net3Gray: '#64748b',
          grassGreen: '#4ade80',
          mortarSand: '#cbd5e1',
          groutConc: '#c084fc',
          dimLine: '#22d3ee',
          dimText: '#67e8f9',
          leaderLine: '#22d3ee',
          textMain: '#f8fafc',
          textSub: '#cbd5e1',
          titleCyan: '#22d3ee',
          ghostLine: 'rgba(244, 63, 94, 0.38)',
          tableBorder: '#64748b',
          tableHeaderBg: 'rgba(30, 41, 59, 0.90)'
        };
      } else {
        return {
          bg: '#ffffff',
          primaryLine: '#0f172a',
          secondaryLine: '#475569',
          frameRed: '#e11d48',
          rebarYellow: '#b45309',
          meshBlue: '#2563eb',
          net3Gray: '#64748b',
          grassGreen: '#15803d',
          mortarSand: '#475569',
          groutConc: '#7e22ce',
          dimLine: '#0284c7',
          dimText: '#0f172a',
          leaderLine: '#0369a1',
          textMain: '#0f172a',
          textSub: '#334155',
          titleCyan: '#0369a1',
          ghostLine: 'rgba(225, 29, 72, 0.38)',
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

    function cadCircle(ctx, cx, cy, r, color, width = 1.25, fill = null, dash = [], layer = '0') {
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

    function cadLeader(ctx, tx, ty, kx, ky, ex, ey, lines, pal, fontSize = 11.0, useDot = true) {
      cadLine(ctx, tx, ty, kx, ky, pal.leaderLine, 1.15, [], 'LEADER');
      if (Math.hypot(ex - kx, ey - ky) > 1) {
        cadLine(ctx, kx, ky, ex, ey, pal.leaderLine, 1.15, [], 'LEADER');
      }

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
        ctx.lineTo(tx - ux * 7.2 + nx * 2.2, ty - uy * 7.2 + ny * 2.2);
        ctx.lineTo(tx - ux * 7.2 - nx * 2.2, ty - uy * 7.2 - ny * 2.2);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }

      const align = ex >= kx ? 'left' : 'right';
      const pad = ex >= kx ? 6 : -6;
      const arr = Array.isArray(lines) ? lines : [lines];
      arr.forEach((ln, idx) => {
        const yOff = (idx - (arr.length - 1) / 2) * (fontSize + 4);
        cadText(ctx, ln, ex + pad, ey + yOff, fontSize, pal.titleCyan, align, '600', 0, 'TEXT');
      });
    }

    function cadDim(ctx, x1, y1, x2, y2, offset, labelStr, pal, fontSize = 11.2, useDot = false) {
      const dx = x2 - x1, dy = y2 - y1;
      const L = Math.hypot(dx, dy);
      if (L < 1e-3) return;
      const ux = dx / L, uy = dy / L;
      const sign = offset >= 0 ? 1 : -1;
      const nx = -uy * sign, ny = ux * sign;
      const absOff = Math.abs(offset);
      const gap = 4.0;
      const extOver = 4.5;

      const sx1 = x1 + nx * gap, sy1 = y1 + ny * gap;
      const ex1 = x1 + nx * (absOff + extOver), ey1 = y1 + ny * (absOff + extOver);
      const sx2 = x2 + nx * gap, sy2 = y2 + ny * gap;
      const ex2 = x2 + nx * (absOff + extOver), ey2 = y2 + ny * (absOff + extOver);

      const dx1 = x1 + nx * absOff, dy1 = y1 + ny * absOff;
      const dx2 = x2 + nx * absOff, dy2 = y2 + ny * absOff;

      if (absOff > 3) {
        cadLine(ctx, sx1, sy1, ex1, ey1, pal.dimLine, 0.9, [], 'DIM');
        cadLine(ctx, sx2, sy2, ex2, ey2, pal.dimLine, 0.9, [], 'DIM');
      }

      const mx = (dx1 + dx2) / 2, my = (dy1 + dy2) / 2;
      const textGap = Math.max(String(labelStr).length * fontSize * 0.60 + 6, 18);

      if (L > textGap + 10) {
        cadLine(ctx, dx1, dy1, mx - ux * (textGap / 2), my - uy * (textGap / 2), pal.dimLine, 1.0, [], 'DIM');
        cadLine(ctx, mx + ux * (textGap / 2), my + uy * (textGap / 2), dx2, dy2, pal.dimLine, 1.0, [], 'DIM');
      } else {
        cadLine(ctx, dx1, dy1, dx2, dy2, pal.dimLine, 1.0, [], 'DIM');
      }

      if (useDot) {
        cadCircle(ctx, dx1, dy1, 2.2, pal.dimLine, 1.0, pal.dimLine, [], 'DIM_DOT');
        cadCircle(ctx, dx2, dy2, 2.2, pal.dimLine, 1.0, pal.dimLine, [], 'DIM_DOT');
      } else {
        const aL = Math.min(5.5, L * 0.25), aW = 1.8;
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
      }

      let angle = (Math.atan2(dy, dx) * 180) / Math.PI;
      if (angle > 90) angle -= 180;
      if (angle < -90) angle += 180;
      cadText(ctx, labelStr, mx, my - 2, fontSize, pal.dimText, 'center', '600', angle, 'DIM_TEXT');
    }

    function drawDoubleUnderlineTitle(ctx, titleStr, cx, cy, pal, fontSize = 14.5) {
      cadText(ctx, titleStr, cx, cy, fontSize, pal.titleCyan, 'center', '700');
      const halfW = Math.max(45, titleStr.length * fontSize * 0.52);
      cadLine(ctx, cx - halfW, cy + 9, cx + halfW, cy + 9, pal.titleCyan, 1.4);
      cadLine(ctx, cx - halfW, cy + 12.5, cx + halfW, cy + 12.5, pal.titleCyan, 1.0);
    }

    // =========================================================================
    // 4. TOP ROW VIEWS:
    //    - 左上：鋪設網層錨釘固定配置 示意圖 (`D91C` / `5862..58AC`: B1×B1 grid, ○ 主錨釘, × 輔錨釘, 邊界以施作主錨釘為原則)
    //    - 中上1：主錨釘大樣圖 / 大ㄇ型鋼筋大樣圖 (`DBFC`: #5鋼筋, L2, 10cm)
    //    - 中上2：輔錨釘大樣圖 / 小ㄇ型鋼筋大樣圖 (`DC0E`: #4鋼筋, L1, 10cm)
    //    - 右上：鍍鋅鐵絲網大樣圖 (`DBF8`: `5666..56A8` 3D crimped woven wire mesh, 50×50mm, 高度25±5mm, 245g/㎡, 線徑∅=2mm以上)
    // =========================================================================
    function drawTopRowViews(ctx, ox, topY, p, pal) {
      // ---------------------------------------------------------------------
      // VIEW 1 (TOP-LEFT): 鋪設網層錨釘固定配置 示意圖 (DXF Viewport 4 `D91C`)
      // ---------------------------------------------------------------------
      const x1_0 = ox + 85;
      const y1_0 = topY + 52;
      const nBaysPin = 3;
      const cellB1 = 52; // Visual size of B1 grid cell
      const totB1W = nBaysPin * cellB1;

      // Dashed grid lines (4 vertical, 4 horizontal, matching DXF `587F`, `58A1..58A6`, `58A9`)
      for (let i = 0; i <= nBaysPin; i++) {
        const vx = x1_0 + i * cellB1;
        const hy = y1_0 + i * cellB1;
        cadLine(ctx, vx, y1_0 - 12, vx, y1_0 + totB1W + 12, pal.secondaryLine, 1.0, [5, 3], 'PIN_GRID_V');
        cadLine(ctx, x1_0 - 8, hy, x1_0 + totB1W + 14, hy, pal.secondaryLine, 1.0, [5, 3], 'PIN_GRID_H');
      }

      // Draw `○` 主錨釘 along Left Boundary Column (i=0) & inside every cell center (`5862..5865`, `5880..5882`, `589B..58A0`)
      // And `×` 輔錨釘 at interior & right grid intersections (i=1..3, j=0..3) (`5883..589A`)
      const rPin = 3.6;
      for (let r = 0; r <= nBaysPin; r++) {
        const py = y1_0 + r * cellB1;
        // Left boundary column (c=0): Circle `○` 主錨釘
        cadCircle(ctx, x1_0, py, rPin, pal.rebarYellow, 1.35, null, [], 'MAIN_PIN_BOUND');

        // Columns c = 1 .. nBaysPin: Cross `×` 輔錨釘 at grid intersections
        for (let c = 1; c <= nBaysPin; c++) {
          const px = x1_0 + c * cellB1;
          cadLine(ctx, px - rPin, py - rPin, px + rPin, py + rPin, pal.rebarYellow, 1.3, [], 'AUX_PIN_X');
          cadLine(ctx, px + rPin, py - rPin, px - rPin, py + rPin, pal.rebarYellow, 1.3, [], 'AUX_PIN_X');
        }
      }

      // Cell Centers: Circle `○` 主錨釘 at (c + 0.5, r + 0.5)
      for (let r = 0; r < nBaysPin; r++) {
        for (let c = 0; c < nBaysPin; c++) {
          const cxCell = x1_0 + (c + 0.5) * cellB1;
          const cyCell = y1_0 + (r + 0.5) * cellB1;
          cadCircle(ctx, cxCell, cyCell, rPin, pal.rebarYellow, 1.35, null, [], 'MAIN_PIN_CENTER');
        }
      }

      // Dashed Cyan Ellipse around Left Boundary Column (`595B`) + Callout "邊界以施作主錨釘為原則" (`58AB, 58AC`)
      ctx.save();
      ctx.strokeStyle = pal.dimLine;
      ctx.lineWidth = 1.25;
      ctx.setLineDash([5, 3]);
      ctx.beginPath();
      ctx.ellipse(x1_0, y1_0 + totB1W / 2, 16, totB1W * 0.58, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      cadLeader(
        ctx,
        x1_0 - 11, y1_0 + 12,
        x1_0 - 26, y1_0 - 24,
        x1_0 - 38, y1_0 - 24,
        ['邊界以施作', '主錨釘為原則'],
        pal, 10.5, true
      );

      // Top Dimensions: B1 | B1 | B1 (`*D7`, `*D9`, `*D25`) & Left Dimensions: B1 | B1 | B1 (`*D8`, `*D10`, `*D11`)
      for (let i = 0; i < nBaysPin; i++) {
        cadDim(ctx, x1_0 + i * cellB1, y1_0, x1_0 + (i + 1) * cellB1, y1_0, -24, `B1(${p.B1_cm})`, pal, 10.2);
        cadDim(ctx, x1_0, y1_0 + i * cellB1, x1_0, y1_0 + (i + 1) * cellB1, -34, `B1(${p.B1_cm})`, pal, 10.2);
      }

      // Bottom-Left Legend: `○ 主錨釘` / `× 輔錨釘` (`5869..586D`)
      const legPinX = x1_0 - 52;
      const legPinY = y1_0 + totB1W + 20;
      cadCircle(ctx, legPinX, legPinY, rPin, pal.rebarYellow, 1.35);
      cadText(ctx, '主錨釘 (大ㄇ#5)', legPinX + 8, legPinY, 10.5, pal.titleCyan, 'left', '600');

      cadLine(ctx, legPinX - rPin, legPinY + 18 - rPin, legPinX + rPin, legPinY + 18 + rPin, pal.rebarYellow, 1.3);
      cadLine(ctx, legPinX + rPin, legPinY + 18 - rPin, legPinX - rPin, legPinY + 18 + rPin, pal.rebarYellow, 1.3);
      cadText(ctx, '輔錨釘 (小ㄇ#4)', legPinX + 8, legPinY + 18, 10.5, pal.titleCyan, 'left', '600');

      const title1Y = legPinY + 42;
      drawDoubleUnderlineTitle(ctx, '鋪設網層錨釘固定配置 示意圖', x1_0 + totB1W / 2, title1Y, pal, 14);

      // ---------------------------------------------------------------------
      // VIEW 2 (TOP-MIDDLE-LEFT): 主錨釘大樣圖 / 大ㄇ型鋼筋大樣圖 (`DBFC`: #5鋼筋, L2, 10cm)
      // ---------------------------------------------------------------------
      const x2_0 = x1_0 + totB1W + 78;
      const y2_top = y1_0 + 6;
      const wHook2 = 34;
      const hPin2 = Math.min(148, p.L2_cm * 1.18);

      // Inverted L-shaped #5 Rebar (`5A97, 5A98`)
      cadPoly(ctx, [
        [x2_0 + wHook2, y2_top],
        [x2_0, y2_top],
        [x2_0, y2_top + hPin2]
      ], pal.frameRed, 2.2, false, null, [], 'MAIN_PIN_REBAR_5');

      // Dimensions with Dot Arrows (`*D6` 10cm & `*D3` L2)
      cadDim(ctx, x2_0, y2_top, x2_0 + wHook2, y2_top, -20, `${p.hook_cm}cm`, pal, 10.8, true);
      cadDim(ctx, x2_0, y2_top, x2_0, y2_top + hPin2, -26, `L2 (${p.L2_cm})`, pal, 11, true);
      cadText(ctx, '#5鋼筋', x2_0 + 14, y2_top + hPin2 * 0.48, 11.5, pal.titleCyan, 'left', '700');

      drawDoubleUnderlineTitle(ctx, '主錨釘大樣圖 (大ㄇ型)', x2_0 + 18, title1Y, pal, 13.5);

      // ---------------------------------------------------------------------
      // VIEW 3 (TOP-MIDDLE-RIGHT): 輔錨釘大樣圖 / 小ㄇ型鋼筋大樣圖 (`DC0E`: #4鋼筋, L1, 10cm)
      // ---------------------------------------------------------------------
      const x3_0 = x2_0 + 138;
      const y3_top = y1_0 + 26;
      const wHook3 = 34;
      const hPin3 = Math.min(115, p.L1_cm * 1.32);

      // Inverted L-shaped #4 Rebar (`5A8E, 5A8F`)
      cadPoly(ctx, [
        [x3_0 + wHook3, y3_top],
        [x3_0, y3_top],
        [x3_0, y3_top + hPin3]
      ], pal.frameRed, 2.0, false, null, [], 'AUX_PIN_REBAR_4');

      // Dimensions with Dot Arrows (`*D4` 10cm & `*D5` L1)
      cadDim(ctx, x3_0, y3_top, x3_0 + wHook3, y3_top, -20, `${p.hook_cm}cm`, pal, 10.8, true);
      cadDim(ctx, x3_0, y3_top, x3_0, y3_top + hPin3, -26, `L1 (${p.L1_cm})`, pal, 11, true);
      cadText(ctx, '#4鋼筋', x3_0 + 14, y3_top + hPin3 * 0.48, 11.5, pal.titleCyan, 'left', '700');

      drawDoubleUnderlineTitle(ctx, '輔錨釘大樣圖 (小ㄇ型)', x3_0 + 18, title1Y, pal, 13.5);

      // ---------------------------------------------------------------------
      // VIEW 4 (TOP-RIGHT): 鍍鋅鐵絲網大樣圖 (`DBF8`: `5666..56A8` Exact 3D Crimped Wire Mesh)
      // ---------------------------------------------------------------------
      const meshX0 = x3_0 + 115;
      const meshY0 = y1_0 + 78;
      const ms = 1.08;
      const wireT = 2.1 * ms;

      const drawDoubleStrand = (spinePts, col1, col2) => {
        const offPts = spinePts.map((pt, idx) => {
          const prev = spinePts[Math.max(0, idx - 1)];
          const next = spinePts[Math.min(spinePts.length - 1, idx + 1)];
          const dx = next[0] - prev[0], dy = next[1] - prev[1];
          const L = Math.hypot(dx, dy) || 1;
          return [pt[0] - (dy / L) * wireT, pt[1] + (dx / L) * wireT];
        });
        cadPoly(ctx, spinePts, col1, 1.35, false, null, [], 'MESH_WIRE_1');
        cadPoly(ctx, offPts, col2, 1.1, false, null, [], 'MESH_WIRE_2');
      };

      let meshTopPt = [meshX0 + 75, meshY0 - 15];
      let meshBotPt = [meshX0 + 65, meshY0 + 52];

      for (let sIdx = 0; sIdx < 4; sIdx++) {
        const sx = meshX0 + sIdx * (28 * ms);
        const sy = meshY0 + sIdx * (19 * ms);
        const ptsA = [
          [sx, sy],
          [sx + 38 * ms, sy - 13 * ms],
          [sx + 45 * ms, sy - 7.5 * ms],
          [sx + 84 * ms, sy - 20.5 * ms],
          [sx + 91 * ms, sy - 15 * ms],
          [sx + 128 * ms, sy - 26.5 * ms]
        ];
        drawDoubleStrand(ptsA, pal.meshBlue, pal.primaryLine);
        if (sIdx === 0) meshTopPt = ptsA[3];
      }

      for (let cIdx = 0; cIdx < 4; cIdx++) {
        const cx = meshX0 + 12 * ms + cIdx * (39 * ms);
        const cy = meshY0 - 10 * ms - cIdx * (8.5 * ms);
        const ptsB = [
          [cx, cy],
          [cx + 24 * ms, cy + 16.5 * ms],
          [cx + 30 * ms, cy + 10.5 * ms],
          [cx + 56 * ms, cy + 27.5 * ms],
          [cx + 62 * ms, cy + 21.5 * ms],
          [cx + 88 * ms, cy + 38.5 * ms]
        ];
        drawDoubleStrand(ptsB, pal.meshBlue, pal.dimLine);
        if (cIdx === 1) meshBotPt = ptsB[5];
      }

      // Callout 1 (`5653/5656`): 網目50mmx50mm (高度25mm±5mm，鍍鋅量不得少於245g/㎡)
      cadLeader(
        ctx,
        meshTopPt[0], meshTopPt[1],
        meshTopPt[0] - 8, y1_0 - 18,
        meshTopPt[0] - 24, y1_0 - 18,
        ['網目50mmx50mm', '(高度25mm±5mm，鍍鋅量不得少於245g/㎡)'],
        pal, 10.5, true
      );

      // Callout 2 (`5654/5657`): 線徑∅=2mm以上
      cadLeader(
        ctx,
        meshBotPt[0] - 6, meshBotPt[1] - 4,
        meshBotPt[0] - 18, meshBotPt[1] + 18,
        meshBotPt[0] - 32, meshBotPt[1] + 18,
        ['線徑∅=2mm以上'],
        pal, 10.8, true
      );

      drawDoubleUnderlineTitle(ctx, '鍍鋅鐵絲網大樣圖', meshX0 + 85, title1Y, pal, 14);

      return {
        rightX: meshX0 + 235,
        bottomY: title1Y + 26
      };
    }

    // =========================================================================
    // 5. BOTTOM ROW VIEWS:
    //    - 左下：自由梁框平面圖 / 型框植生護坡 平面圖 (`D622`: `7568..75C9`, `F526..F559`)
    //    - 中下：縱、橫剖面圖 (`D62C`: `756E..759D`, `7E9C`, `F184`, `F1E4`, `F216`, `F310`)
    //    - 右下：原圖符號說明 (`F14A`: B1, B2, B3, L1, L2, L3) + 單位註記 (`DF09`)
    // =========================================================================
    function drawPlanAndSectionViews(ctx, ox, topY, p, pal) {
      // ---------------------------------------------------------------------
      // VIEW 5 (BOTTOM-LEFT): 自由梁框平面圖 / 型框植生護坡 平面圖 (DXF Viewport 2 `D622`)
      // ---------------------------------------------------------------------
      const N = p.N_grid; // Default 3x3 cells
      const sPlan = Math.min(0.32, 0.96 / N); // Scale so N_grid cells fit cleanly
      const B2_px = p.B2_cm * sPlan;          // ~64 px per cell clear opening
      const B3_px = Math.max(12, p.B3_cm * sPlan * 1.25); // ~12 px beam width
      const pitchPx = B2_px + B3_px;

      const xPlan0 = ox + 125;
      const yPlan0 = topY + 48;
      const totPlanW = N * pitchPx + B3_px;

      // 1) Draw Magenta Dashed Grid Centerlines along all Horizontal & Vertical Free-Frame Beams (`75AB, 75AC, 75BE, 75BF, 75C3, 75C7..75C9`)
      for (let i = 0; i <= N; i++) {
        const cxBeam = xPlan0 + B3_px / 2 + i * pitchPx;
        const cyBeam = yPlan0 + B3_px / 2 + i * pitchPx;
        cadLine(ctx, cxBeam, yPlan0 - 8, cxBeam, yPlan0 + totPlanW + 8, '#e879f9', 0.95, [6, 3], 'BEAM_CL_V');
        cadLine(ctx, xPlan0 - 8, cyBeam, xPlan0 + totPlanW + 8, cyBeam, '#e879f9', 0.95, [6, 3], 'BEAM_CL_H');
      }

      // 2) Draw Each of the N × N Rounded-Corner Inner Frame Cells (`75A9..75AD, 75BC..75FD` with bulge = -0.41421356 = 90° fillet!)
      //    and fill interior with `NET3` Hexagonal/Diamond Wire Mesh (`7568`) + Creeping Grass Symbol (`gfg`)
      let cell2CenterPt = [xPlan0 + pitchPx * 0.5, yPlan0 + pitchPx * 1.5];

      for (let r = 0; r < N; r++) {
        for (let c = 0; c < N; c++) {
          const cx0 = xPlan0 + B3_px + c * pitchPx;
          const cy0 = yPlan0 + B3_px + r * pitchPx;
          const rad = Math.min(7, B2_px * 0.12);

          // Rounded inner frame cell polygon (red outline `05` in DXF)
          const cellPts = [
            [cx0 + rad, cy0],
            [cx0 + B2_px - rad, cy0],
            [cx0 + B2_px, cy0 + rad],
            [cx0 + B2_px, cy0 + B2_px - rad],
            [cx0 + B2_px - rad, cy0 + B2_px],
            [cx0 + rad, cy0 + B2_px],
            [cx0, cy0 + B2_px - rad],
            [cx0, cy0 + rad]
          ];
          cadPoly(ctx, cellPts, pal.frameRed, 1.5, true, 'rgba(34, 197, 94, 0.08)', [], 'FRAME_CELL_INNER');

          // `NET3` 3-direction Wire Mesh Hatch inside cell (`7568`: 0°, 60°, 120° lines)
          ctx.save();
          ctx.beginPath();
          ctx.moveTo(cellPts[0][0], cellPts[0][1]);
          for (let k = 1; k < cellPts.length; k++) ctx.lineTo(cellPts[k][0], cellPts[k][1]);
          ctx.closePath();
          ctx.clip();

          const stepNet = 11;
          for (let hy = cy0 + 5; hy < cy0 + B2_px; hy += stepNet) {
            cadLine(ctx, cx0, hy, cx0 + B2_px, hy, pal.net3Gray, 0.7, [], 'NET3_0');
          }
          for (let d = -B2_px; d < B2_px * 2; d += stepNet) {
            cadLine(ctx, cx0 + d, cy0 + B2_px, cx0 + d + B2_px * 0.58, cy0, pal.net3Gray, 0.7, [], 'NET3_60');
            cadLine(ctx, cx0 + d, cy0, cx0 + d + B2_px * 0.58, cy0 + B2_px, pal.net3Gray, 0.7, [], 'NET3_120');
          }
          ctx.restore();

          if (r === 1 && c === 0) {
            cell2CenterPt = [cx0 + B2_px * 0.35, cy0 + B2_px * 0.55];
          }
        }
      }

      // 3) Draw Soil/Rock Nail Concentric Circles `◎` at Every Beam Intersection (`F53C..F559`, `759E..75B0`, `F2E8..F2F3`)
      let topLeftNail2Pt = [xPlan0 + B3_px / 2, yPlan0 + B3_px / 2 + pitchPx];
      let detailCircleCenter = [xPlan0 + B3_px / 2 + 2 * pitchPx, yPlan0 + B3_px / 2 + pitchPx];

      for (let r = 0; r <= N; r++) {
        for (let c = 0; c <= N; c++) {
          const nx = xPlan0 + B3_px / 2 + c * pitchPx;
          const ny = yPlan0 + B3_px / 2 + r * pitchPx;
          cadCircle(ctx, nx, ny, 3.6, pal.primaryLine, 1.25, '#0b1120', [], 'NAIL_OUTER');
          cadCircle(ctx, nx, ny, 1.5, pal.rebarYellow, 1.0, pal.rebarYellow, [], 'NAIL_INNER');
          if (r === 1 && c === 0) topLeftNail2Pt = [nx, ny];
          if (r === 1 && c === N - 1) detailCircleCenter = [nx, ny];
        }
      }

      // 4) Dashed Yellow Detail Circle (`75A7`) around intersection (r=1, c=N-1) + Callout "詳縱、橫剖面圖" (`D8EF, D8F0`)
      const detR = B3_px * 1.75;
      cadCircle(ctx, detailCircleCenter[0], detailCircleCenter[1], detR, pal.rebarYellow, 1.35, null, [5, 3], 'DETAIL_SEC_CIRCLE');
      cadLeader(
        ctx,
        detailCircleCenter[0] + detR * 0.65, detailCircleCenter[1] - detR * 0.65,
        xPlan0 + totPlanW + 22, yPlan0 - 16,
        xPlan0 + totPlanW + 34, yPlan0 - 16,
        ['詳縱、橫剖面圖'],
        pal, 10.8, true
      );

      // 5) Left Callouts on Plan View (`E8F5/E8F7` 土(岩)釘 & `7E9F/7EA0` 每格平均施作1支大ㄇ與1支小ㄇ鋼筋):
      cadLeader(
        ctx,
        topLeftNail2Pt[0] - 3, topLeftNail2Pt[1] - 2,
        xPlan0 - 22, topLeftNail2Pt[1] - 18,
        xPlan0 - 34, topLeftNail2Pt[1] - 18,
        ['土(岩)釘'],
        pal, 10.8, false
      );

      cadLeader(
        ctx,
        cell2CenterPt[0], cell2CenterPt[1],
        xPlan0 - 22, cell2CenterPt[1] - 8,
        xPlan0 - 34, cell2CenterPt[1] - 8,
        ['每格平均施作1支大ㄇ', '與1支小ㄇ鋼筋'],
        pal, 10.5, true
      );

      // 6) Top & Right Dimension Chains on Plan View (`*D15..*D24`: B2 | B3 | B2 | B3 | B2):
      for (let i = 0; i < N; i++) {
        const xCellL = xPlan0 + B3_px + i * pitchPx;
        const xCellR = xCellL + B2_px;
        cadDim(ctx, xCellL, yPlan0, xCellR, yPlan0, -24, `B2(${p.B2_cm})`, pal, 10.2);
        if (i < N - 1) {
          cadDim(ctx, xCellR, yPlan0, xCellR + B3_px, yPlan0, -24, `B3(${p.B3_cm})`, pal, 9.8);
        }

        const yCellT = yPlan0 + B3_px + i * pitchPx;
        const yCellB = yCellT + B2_px;
        cadDim(ctx, xPlan0 + totPlanW, yCellT, xPlan0 + totPlanW, yCellB, 24, `B2(${p.B2_cm})`, pal, 10.2);
        if (i < N - 1) {
          cadDim(ctx, xPlan0 + totPlanW, yCellB, xPlan0 + totPlanW, yCellB + B3_px, 24, `B3(${p.B3_cm})`, pal, 9.8);
        }
      }

      const planTitleY = yPlan0 + totPlanW + 26;
      const planCX = xPlan0 + totPlanW / 2;
      drawDoubleUnderlineTitle(ctx, '自由梁框平面圖 (型框植生護坡 平面圖)', planCX, planTitleY, pal, 14);

      // ---------------------------------------------------------------------
      // VIEW 6 (BOTTOM-MIDDLE): 縱、橫剖面圖 (DXF Viewport 3 `D62C` - Magnified Cross-Section!)
      //    Exact match to DXF Entities `756E..759D`, `7E9C`, `F184`, `F1E4`, `F216`, `F310`
      // ---------------------------------------------------------------------
      const xSecCX = xPlan0 + totPlanW + 225;
      const ySecBase = topY + 95; // Slope surface baseline (`7598`)
      const sSec = 3.2;           // Magnified scale for section detail

      const wBeam = p.B3_cm * sSec;        // B3±5cm (~96 px)
      const hBeam = p.H_beam_cm * sSec;    // 15±5cm (~48 px)
      const tSub = p.t_sub_cm * sSec * 2.2; // 5cm substrate layer (~35 px)
      const wWing = 62;
      const xBeamL = xSecCX - wBeam / 2;
      const xBeamR = xSecCX + wBeam / 2;
      const xWingL = xBeamL - wWing;
      const xWingR = xBeamR + wWing;
      const ySubTop = ySecBase - tSub;
      const yBeamTop = ySecBase - hBeam;

      // 1) Slope Surface Baseline (`7598`) & Left/Right 5cm Vegetation Substrate Layers (`植生基材 7599 GRASS`)
      cadLine(ctx, xWingL, ySecBase, xWingR, ySecBase, pal.primaryLine, 1.5, [], 'SLOPE_SURFACE');

      // Left & Right 5cm Vegetation Substrate zones
      cadLine(ctx, xWingL, ySubTop, xBeamL + 4, ySubTop, pal.primaryLine, 1.35, [], 'SUBSTRATE_TOP_L');
      cadLine(ctx, xBeamR - 4, ySubTop, xWingR, ySubTop, pal.primaryLine, 1.35, [], 'SUBSTRATE_TOP_R');

      // GRASS hatch tufts inside left & right 5cm substrate layers (`7599`)
      for (let gx = xWingL + 10; gx < xBeamL - 4; gx += 16) {
        const gy = (ySubTop + ySecBase) / 2 + 3;
        cadLine(ctx, gx, gy, gx - 4, gy - 7, pal.grassGreen, 1.05, [], 'GRASS_TUFT');
        cadLine(ctx, gx, gy, gx, gy - 9, pal.grassGreen, 1.05, [], 'GRASS_TUFT');
        cadLine(ctx, gx, gy, gx + 4, gy - 7, pal.grassGreen, 1.05, [], 'GRASS_TUFT');
      }
      for (let gx = xBeamR + 10; gx < xWingR - 6; gx += 16) {
        const gy = (ySubTop + ySecBase) / 2 + 3;
        cadLine(ctx, gx, gy, gx - 4, gy - 7, pal.grassGreen, 1.05, [], 'GRASS_TUFT');
        cadLine(ctx, gx, gy, gx, gy - 9, pal.grassGreen, 1.05, [], 'GRASS_TUFT');
        cadLine(ctx, gx, gy, gx + 4, gy - 7, pal.grassGreen, 1.05, [], 'GRASS_TUFT');
      }

      // 2) Continuous Zigzag Galvanized Wire Mesh (`758F`: 鍍鋅鐵絲網(一層)) running across substrate & through beam!
      const zigPts = [];
      const yZig = ySubTop + tSub * 0.35;
      const nZigs = 38;
      for (let k = 0; k <= nZigs; k++) {
        const zx = xWingL + (k / nZigs) * (xWingR - xWingL);
        const zy = yZig + (k % 2 === 0 ? -3.2 : 3.2);
        zigPts.push([zx, zy]);
      }
      cadPoly(ctx, zigPts, pal.rebarYellow, 1.25, false, null, [], 'ZIGZAG_WIRE_MESH');

      // 3) Rounded-Top Free-Frame Beam (`7596` ARC: 噴1:3水泥砂漿, B3±5cm x 15±5cm, filled with `AR-SAND` `7597`)
      const nArc = 24;
      const beamArcPts = [];
      for (let i = 0; i <= nArc; i++) {
        const u = -1 + (i / nArc) * 2; // -1 .. +1
        const bx = xSecCX + u * (wBeam / 2);
        const by = ySecBase - hBeam * Math.sqrt(Math.max(0, 1 - u * u * p.kArc));
        beamArcPts.push([bx, by]);
      }
      cadPoly(ctx, beamArcPts, pal.primaryLine, 1.75, true, 'rgba(56, 189, 248, 0.16)', [], 'FREE_BEAM_ARC');

      // AR-SAND Stipple Dots inside Free-Frame Beam (`7597`)
      for (let sx = xBeamL + 8; sx < xBeamR - 8; sx += 9) {
        const u = (sx - xSecCX) / (wBeam / 2);
        const yMax = ySecBase - hBeam * Math.sqrt(Math.max(0, 1 - u * u * p.kArc)) + 5;
        for (let sy = yMax; sy < ySecBase - 4; sy += 8) {
          cadCircle(ctx, sx + ((sy * 3) % 4), sy, 0.75, pal.mortarSand, 0.75, pal.mortarSand, [], 'AR_SAND_DOT');
        }
      }

      // 4) Central Drilled Grout Hole (`F184`: 鑽孔直徑3cm 孔內灌注1:2水泥漿 `F1E4`) & J-Type #6 Soil/Rock Nail (`7E9C`: 土(岩)釘(J型#6鋼筋), 長 L3)
      const holeR = 11;
      const nailLenPx = Math.min(165, p.L3_cm * 1.05);
      const yHoleBot = ySecBase + nailLenPx;
      const leftHolePts = [];
      const rightHolePts = [];
      const nHSeg = 14;
      for (let i = 0; i <= nHSeg; i++) {
        const hy = ySecBase + (i / nHSeg) * nailLenPx;
        const jitL = Math.sin(i * 2.2) * 1.4;
        const jitR = Math.cos(i * 1.9) * 1.4;
        leftHolePts.push([xSecCX - holeR + jitL, hy]);
        rightHolePts.push([xSecCX + holeR + jitR, hy]);
      }
      const groutHolePoly = [
        ...leftHolePts,
        [xSecCX, yHoleBot + 4],
        ...rightHolePts.slice().reverse()
      ];
      cadPoly(ctx, groutHolePoly, pal.secondaryLine, 1.15, true, 'rgba(192, 132, 252, 0.14)', [], 'GROUT_BOREHOLE');

      // AR-CONC Stipple inside Grouted Borehole (`F1E4`)
      for (let gy = ySecBase + 12; gy < yHoleBot - 8; gy += 16) {
        cadPoly(ctx, [[xSecCX - 6, gy], [xSecCX - 3, gy - 3], [xSecCX - 4, gy + 2]], pal.groutConc, 0.8, true);
        cadCircle(ctx, xSecCX + 5, gy + 2, 0.8, pal.groutConc, 0.8, pal.groutConc);
      }

      // J-Shaped #6 Soil/Rock Nail (`7E9C`: double-line J-bar with ANSI32 hatch `F18F`, hooking over the two #3 rebar dots `7592` & `7E61`!)
      const jBarW = 4.2;
      const jHookW = 22;
      const yJTop = ySubTop - 10;
      const jBarPts = [
        [xSecCX - jBarW / 2, yHoleBot],
        [xSecCX - jBarW / 2, yJTop + 6],
        [xSecCX, yJTop],
        [xSecCX + jHookW - 4, yJTop],
        [xSecCX + jHookW, yJTop + 6],
        [xSecCX + jHookW, ySecBase - 4],
        [xSecCX + jHookW - jBarW, ySecBase - 4],
        [xSecCX + jHookW - jBarW, yJTop + 5],
        [xSecCX + jBarW / 2, yJTop + 5],
        [xSecCX + jBarW / 2, yHoleBot]
      ];
      cadPoly(ctx, jBarPts, pal.frameRed, 1.5, true, 'rgba(244, 63, 94, 0.30)', [], 'J_NAIL_REBAR_6');

      // Two `#3鋼筋×2支×雙向` Solid Red Rebar Dots (`7592` & `7E61` with SOLID hatch `8069/806A`) inside the J-hook!
      const dot1X = xSecCX - 6.5;
      const dot2X = xSecCX + 11.5;
      const dotY = ySubTop - 2.5;
      cadCircle(ctx, dot1X, dotY, 3.4, pal.frameRed, 1.2, pal.frameRed, [], 'BEAM_REBAR_3_L');
      cadCircle(ctx, dot2X, dotY, 3.4, pal.frameRed, 1.2, pal.frameRed, [], 'BEAM_REBAR_3_R');

      // 5) All 4 Dimensions on Section View (`*D13 B3±5cm`, `*D14 15±5cm`, `*D12 5cm`, `*D31 L3`):
      cadDim(ctx, xBeamL, yBeamTop, xBeamR, yBeamTop, -24, `B3±5cm (${p.B3_cm})`, pal, 10.8);
      cadDim(ctx, xWingR, yBeamTop, xWingR, ySubTop, 22, `${p.H_beam_cm}±5cm`, pal, 10.5);
      cadDim(ctx, xWingR, ySubTop, xWingR, ySecBase, 22, `${p.t_sub_cm}cm`, pal, 10.5);
      cadDim(ctx, xSecCX - holeR, yJTop, xSecCX - holeR, yHoleBot, -28, `L3 (${p.L3_cm})`, pal, 11);

      // 6) All 6 Callout Leaders on Section View (`7594`, `759C`, `756E`, `7587`, `8151/759A`, `F216`):
      // Top-Left: 噴1:3水泥砂漿 (`7588, 7594`)
      cadLeader(ctx, xSecCX - 14, yBeamTop + 12, xSecCX - 28, yBeamTop - 14, xSecCX - 42, yBeamTop - 14, ['噴1:3水泥砂漿'], pal, 10.8, true);

      // Top-Right: #3鋼筋×2支×雙向 (`7589, 759C`)
      cadLeader(ctx, dot2X + 2, dotY - 2, xSecCX + 48, yBeamTop - 20, xSecCX + 62, yBeamTop - 20, ['#3鋼筋×2支×雙向'], pal, 10.8, false);

      // Middle-Right: 植生基材 (`756E`)
      cadText(ctx, '植生基材', xWingR + 48, (ySubTop + ySecBase) / 2, 10.8, pal.titleCyan, 'left', '700');

      // Lower-Right 1: 鍍鋅鐵絲網(一層) (`758E, 7587`)
      const meshCallX = xBeamR + 24;
      cadLeader(ctx, meshCallX, yZig, meshCallX, ySecBase + 38, meshCallX + 14, ySecBase + 38, ['鍍鋅鐵絲網(一層)'], pal, 10.8, true);

      // Lower-Right 2: 鑽孔直徑3cm / 孔內灌注1:2水泥漿 (`F215, F216`)
      cadLeader(ctx, xSecCX + holeR - 2, ySecBase + nailLenPx * 0.68, xSecCX + 32, ySecBase + nailLenPx * 0.68, xSecCX + 46, ySecBase + nailLenPx * 0.68, [`鑽孔直徑${p.d_hole_cm}cm`, '孔內灌注1:2水泥漿'], pal, 10.8, true);

      // Lower-Left: 土(岩)釘 / (J型#6鋼筋) (`F0B6, 8151, 759A`)
      cadLeader(ctx, xSecCX - 1, ySecBase + nailLenPx * 0.52, xSecCX - 48, ySecBase + nailLenPx * 0.42, xSecCX - 62, ySecBase + nailLenPx * 0.42, ['土(岩)釘', '(J型#6鋼筋)'], pal, 10.8, true);

      const secTitleY = yHoleBot + 28;
      drawDoubleUnderlineTitle(ctx, '縱、橫剖面圖', xSecCX, secTitleY, pal, 14.5);

      // ---------------------------------------------------------------------
      // VIEW 7 (BOTTOM-RIGHT): 原圖【符號說明】 (`F14A`) + 單位註記 (`DF09`)
      // ---------------------------------------------------------------------
      const legX = xSecCX + 185;
      const legY = topY + 62;
      const legW = 240;
      const legH = 165;

      cadPoly(ctx, [
        [legX, legY],
        [legX + legW, legY],
        [legX + legW, legY + legH],
        [legX, legY + legH]
      ], pal.tableBorder, 1.15, true, 'rgba(15, 23, 42, 0.88)', [], 'SYMBOL_LEGEND_F14A');

      cadText(ctx, '符號說明：', legX + 12, legY + 18, 12, pal.titleCyan, 'left', '700');
      const symItems = [
        `B1   錨釘間距 (${p.B1_cm} cm)`,
        `B2   自由梁淨距 (${p.B2_cm} cm)`,
        `B3   自由梁寬度 (${p.B3_cm}±5 cm)`,
        `L1   輔錨釘長度 (${p.L1_cm} cm，小ㄇ#4鋼筋)`,
        `L2   主錨釘長度 (${p.L2_cm} cm，大ㄇ#5鋼筋)`,
        `L3   土(岩)釘長度 (${p.L3_cm} cm，J型#6鋼筋)`
      ];
      symItems.forEach((st, idx) => {
        cadText(ctx, st, legX + 16, legY + 40 + idx * 20, 10.5, pal.textMain, 'left', '600');
      });

      // Unit Note (`DF09` block `A$C469026A3`): 註:標示單位除另有註明外，均以cm為單位。
      cadText(ctx, '註：標示單位除另有註明外，均以cm為單位。', legX + 4, legY + legH + 22, 11, pal.titleCyan, 'left', '600');

      return {
        rightX: legX + legW + 30,
        bottomY: Math.max(planTitleY, secTitleY) + 24
      };
    }

    // =========================================================================
    // 6. EXPLICIT FIGURE-NUMBER QUANTITY TABLE ON CANVAS
    // =========================================================================
    function drawExplicitFormulaTableOnCanvas(ctx, ox, oy, p, pal) {
      cadText(
        ctx,
        `【自由梁護坡 (圖號 0201-1 / 013) 每 M² 與全區數量計算式表 — 採用圖面標註數字顯式列式 (B2=${p.B2_cm}・B3=${p.B3_cm}・L1=${p.L1_cm}・L2=${p.L2_cm}・L3=${p.L3_cm}cm・總面積=${p.A_tot_m2.toFixed(0)}M²)】`,
        ox, oy - 15, 12.8, pal.dimText, 'left', '700'
      );

      const colW = [245, 515, 84, 92, 52];
      const rowH = 26;
      const rows = [
        ['工程項目名稱 (依DXF圖面標註)', '採用圖面標註數字之顯式計算式 (單格模數與每 M² 基準)', '每M²數量', `全區(${p.A_tot_m2}M²)`, '單位'],
        [`自由梁噴 1:3 水泥砂漿 (寬B3=${p.B3_cm}±5, 高${p.H_beam_cm}±5cm)`, p.formula_mortar, p.q_mortar_m2.toFixed(3), (p.q_mortar_m2 * p.A_tot_m2).toFixed(2), 'M³'],
        [`框內噴植生基材 (厚${p.t_sub_cm}cm, 淨寬B2=${p.B2_cm}×${p.B2_cm}cm)`, p.formula_sub, p.q_sub_area_m2.toFixed(2), (p.q_sub_area_m2 * p.A_tot_m2).toFixed(1), 'M²'],
        [`鍍鋅鐵絲網(一層) (網目50×50mm, 高度25±5mm, ≧245g/㎡)`, p.formula_mesh, p.q_mesh_m2.toFixed(2), (p.q_mesh_m2 * p.A_tot_m2).toFixed(1), 'M²'],
        [`土(岩)釘 (鑽孔∅${p.d_hole_cm}cm灌1:2水泥漿, J型#6長L3=${p.L3_cm}cm)`, p.formula_nail, p.q_nail_cnt_m2.toFixed(3), (p.q_nail_cnt_m2 * p.A_tot_m2).toFixed(1), '處'],
        [`主錨釘(大ㄇ#5長L2=${p.L2_cm}cm)與輔錨釘(小ㄇ#4長L1=${p.L1_cm}cm)`, p.formula_pins, p.q_pin_pair_m2.toFixed(3), (p.q_pin_pair_m2 * p.A_tot_m2).toFixed(1), '組'],
        ['鋼筋加工及組立總重 (#3雙向梁筋 + #4輔錨釘 + #5主錨釘 + #6土岩釘)', p.formula_rebar, p.q_rebar_m2.toFixed(2), (p.q_rebar_m2 * p.A_tot_m2).toFixed(1), 'kg']
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
          const color = isHeader ? pal.textMain : (cIdx === 2 ? pal.dimText : (cIdx === 3 ? pal.rebarYellow : pal.textSub));
          cadText(ctx, cellStr, tx, ry, isHeader ? 11.2 : 10.4, color, align, (isHeader || cIdx === 2 || cIdx === 3) ? '700' : '500');
          cx += cw;
        });
      });

      return { bottomY: oy + totH };
    }

    // =========================================================================
    // 7. MAIN RENDER ENGINE & LIVE UI UPDATER
    // =========================================================================
    function updateSidebarSummary(p) {
      document.getElementById('stat_ditch_tag').textContent = `B2=${p.B2_cm}・B3=${p.B3_cm}cm`;
      document.getElementById('stat_mortar_m2').textContent = `${p.q_mortar_m2.toFixed(3)} M³/M²`;
      document.getElementById('stat_sub_m2').textContent = `${p.q_sub_area_m2.toFixed(2)} M²/M²`;
      document.getElementById('stat_mesh_m2').textContent = `${p.q_mesh_m2.toFixed(2)} M²/M²`;
      document.getElementById('stat_rebar_m2').textContent = `${p.q_rebar_m2.toFixed(2)} kg/M²`;
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

      if (currentView === 'PLAN_SECTION') {
        const bBot = drawPlanAndSectionViews(ctx, 25, 12, p, pal);
        drawExplicitFormulaTableOnCanvas(ctx, 30, bBot.bottomY + 36, p, pal);
      } else if (currentView === 'PINS_MESH') {
        const bTop = drawTopRowViews(ctx, 25, 12, p, pal);
        drawExplicitFormulaTableOnCanvas(ctx, 30, bTop.bottomY + 36, p, pal);
      } else {
        // 'ALL' Full Standard Sheet Layout (Matching A3 Layout 2-01 of DXF):
        // - Top Row: 鋪設網層錨釘固定配置示意圖 + 主錨釘大樣圖(L2) + 輔錨釘大樣圖(L1) + 鍍鋅鐵絲網大樣圖
        // - Bottom Row: 自由梁框平面圖(B2,B3) + 縱橫剖面詳圖(L3,15±5cm,5cm) + 符號說明(B1~B3,L1~L3)
        // - Bottom Full-Width: 圖面標註數字顯式計算式表
        const bTop = drawTopRowViews(ctx, 20, 10, p, pal);
        const bBot = drawPlanAndSectionViews(ctx, 20, bTop.bottomY + 12, p, pal);

        const tableY = bBot.bottomY + 38;
        drawExplicitFormulaTableOnCanvas(ctx, 25, tableY, p, pal);
      }

      ctx.restore();
    }

    // =========================================================================
    // 8. UI CONTROLS, AUTO-SYNC & DXF / CSV EXPORTERS
    // =========================================================================
    function stepGrid(delta) {
      const el = document.getElementById('inp_N_grid');
      if (!el) return;
      const cur = Math.round(parseFloat(el.value) || 3);
      el.value = Math.max(2, Math.min(5, cur + delta));
      renderAll();
    }

    function onB2Change() {
      const b2 = parseFloat(document.getElementById('inp_B2_cm').value) || 200;
      const b3 = parseFloat(document.getElementById('inp_B3_cm').value) || 30;
      document.getElementById('inp_B1_cm').value = Math.round(b2 + b3);
      renderAll();
    }

    function onGeomChange() {
      renderAll();
    }

    function resetToOrig() {
      Object.keys(ORIG_FREE_FRAME_SLOPE).forEach(k => {
        const el = document.getElementById('inp_' + k);
        if (el) el.value = ORIG_FREE_FRAME_SLOPE[k];
      });
      renderAll();
    }

    function switchView(view) {
      currentView = view;
      const specEl = document.getElementById('specPanel');
      const tabs = {
        ALL: document.getElementById('tab-all'),
        PLAN_SECTION: document.getElementById('tab-plan-sec'),
        PINS_MESH: document.getElementById('tab-pins-mesh'),
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
      if (currentView === 'PLAN_SECTION' || currentView === 'PINS_MESH') {
        viewCam.scale = Math.min(rect.width / 1120, rect.height / 760) * 0.93;
        viewCam.offsetX = Math.max(20, (rect.width - 1060 * viewCam.scale) / 2);
        viewCam.offsetY = 14;
      } else {
        viewCam.scale = Math.min(rect.width / 1140, rect.height / 980) * 0.94;
        viewCam.offsetX = Math.max(20, (rect.width - 1080 * viewCam.scale) / 2);
        viewCam.offsetY = 12;
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
      a.download = `自由梁護坡標準圖_0201-1_B2_${p.B2_cm}_B3_${p.B3_cm}cm.dxf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }

    function exportCSV() {
      const p = getParams();
      const rows = [
        [`自由梁護坡（型框植生護坡）標準圖 (圖號 0201-1 / 013・自由梁淨距B2=${p.B2_cm}cm・梁寬B3=${p.B3_cm}cm・主錨釘L2=${p.L2_cm}cm・輔錨釘L1=${p.L1_cm}cm・土岩釘L3=${p.L3_cm}cm) - 圖面標註數字顯式列式數量計算書`],
        ['工程項目名稱', '採用圖面標註數字之顯式計算式 (每 M² 基準)', '每 M² 數量', `全區數量(${p.A_tot_m2}M²)`, '單位'],
        [`自由梁噴 1:3 水泥砂漿 (寬B3=${p.B3_cm}±5, 高${p.H_beam_cm}±5cm)`, `'${p.formula_mortar}`, p.q_mortar_m2.toFixed(3), (p.q_mortar_m2 * p.A_tot_m2).toFixed(2), 'M³'],
        [`框內噴植生基材 (厚${p.t_sub_cm}cm, 淨寬B2=${p.B2_cm}×${p.B2_cm}cm)`, `'${p.formula_sub}`, p.q_sub_area_m2.toFixed(2), (p.q_sub_area_m2 * p.A_tot_m2).toFixed(1), 'M²'],
        [`鍍鋅鐵絲網(一層) (網目50×50mm, 高度25±5mm, ≧245g/㎡)`, `'${p.formula_mesh}`, p.q_mesh_m2.toFixed(2), (p.q_mesh_m2 * p.A_tot_m2).toFixed(1), 'M²'],
        [`土(岩)釘 (鑽孔∅${p.d_hole_cm}cm灌1:2水泥漿, J型#6長L3=${p.L3_cm}cm)`, `'${p.formula_nail}`, p.q_nail_cnt_m2.toFixed(3), (p.q_nail_cnt_m2 * p.A_tot_m2).toFixed(1), '處'],
        [`主錨釘(大ㄇ#5長L2=${p.L2_cm}cm)與輔錨釘(小ㄇ#4長L1=${p.L1_cm}cm)`, `'${p.formula_pins}`, p.q_pin_pair_m2.toFixed(3), (p.q_pin_pair_m2 * p.A_tot_m2).toFixed(1), '組'],
        ['鋼筋加工及組立總重 (#3雙向梁筋 + #4輔錨釘 + #5主錨釘 + #6土岩釘)', `'${p.formula_rebar}`, p.q_rebar_m2.toFixed(2), (p.q_rebar_m2 * p.A_tot_m2).toFixed(1), 'kg']
      ];

      const csvContent = '\uFEFF' + rows.map(r => r.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `自由梁護坡顯式列式計算書_0201-1_B2_${p.B2_cm}xB3_${p.B3_cm}.csv`;
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

  const STRIP = s => String(s).replace(/\s*[（(]\s*圖號[^）)]*[）)]/g, '').replace(/\s*[（(]\s*\d{4}-\d\s*[/／]\s*\d{3}\s*[）)]/g, '').replace(/\s*圖號\s*[：:]?\s*[0-9A-Za-z#\-／/ ]+/g, ' ');
  function params(R) { Object.keys(R || {}).forEach(k => { el('inp_' + k).value = String(R[k]); }); return getParams(); }
  function run(R, OV) {
    O = []; const PAL = getPalette(), p = params(R); Object.assign(p, R || {}, OV || {});
    const bTop = drawTopRowViews(CTX, 20, 10, p, PAL), bBot = drawPlanAndSectionViews(CTX, 20, bTop.bottomY + 12, p, PAL); drawExplicitFormulaTableOnCanvas(CTX, 25, bBot.bottomY + 38, p, PAL);
    
    const sc = 1 / 1.0; return O.map(o => { const r = Object.assign({}, o); if (r.p) r.p = r.p.map(([x, y]) => [x * sc, y * sc]); if (r.x !== undefined) { r.x *= sc; r.y *= sc; } if (r.r) r.r *= sc; if (r.h) r.h *= sc; if (r.s !== undefined && r.k === 'T') r.s = STRIP(r.s); return r; });
  }
  return { run, params };
})();
