/* v6.3 生物通道標準圖（使用者原工具 9e42c77d 自動抽出；gen_bio.py，勿手改） */
var TCO_B = window.TCO_B || (window.TCO_B = {});
TCO_B['bio'] = (function () {
  let O = [];
  const EL = {}, CTX = new Proxy({}, { get: (t, k) => (k in t ? t[k] : () => ({ width: 0 })), set: (t, k, v) => { t[k] = v; return true; } });
  const el = id => EL[id] || (EL[id] = { value: '', textContent: '', innerHTML: '', className: '', style: {}, classList: { add() {}, remove() {} }, addEventListener() {} });
  const document = { getElementById: el, querySelectorAll: () => [], querySelector: () => null, createElement: () => ({ click() {}, style: {} }), body: { appendChild() {}, removeChild() {} } };
  const window = { addEventListener() {}, devicePixelRatio: 1 };

    // =========================================================================
    // 1. BASELINE CONSTANTS & GLOBAL STATE (PURE ASCII IDENTIFIERS)
    // =========================================================================
    const ORIG_CORRIDOR = {
      H_total: 150,
      H_base: 30,
      W_ramp: 40,
      t_wall: 20,
      L_ramp: 240,
      L_land: 40,
      m_side: 0.3,
      h_exp: 20,
      title_tag: '#3-#10',
      N_units: 8
    };

    let currentView = 'ALL'; // 'ALL', 'SIDE_FRONT', 'PLAN_TABLE', 'AUDIT'
    let showGhost = false;
    let isDarkTheme = true;

    let viewCam = {
      scale: 0.92,
      offsetX: 80,
      offsetY: 25,
      isDragging: false,
      dragStartX: 0,
      dragStartY: 0
    };

    let dxfEntities = [];

    // =========================================================================
    // 2. PARAMETER READER & QUANTITY / GEOMETRY ENGINE
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
        return (el && el.value.trim()) ? el.value.trim() : def;
      };

      const p = {
        H_total: Math.max(60, num('inp_H_total', 150)),
        H_base: Math.max(10, num('inp_H_base', 30)),
        W_ramp: Math.max(20, num('inp_W_ramp', 40)),
        t_wall: Math.max(10, num('inp_t_wall', 20)),
        L_ramp: Math.max(80, num('inp_L_ramp', 240)),
        L_land: Math.max(20, num('inp_L_land', 40)),
        m_side: Math.max(0.05, num('inp_m_side', 0.3)),
        h_exp: Math.max(5, num('inp_h_exp', 20)),
        title_tag: str('inp_title_tag', '#3-#10'),
        N_units: Math.max(1, Math.round(num('inp_N_units', 8)))
      };

      // Derived geometric values matching original drawing
      p.H_net = Math.max(30, p.H_total - p.H_base); // 150 - 30 = 120 cm
      p.L_total = p.t_wall + p.L_ramp + p.L_land + p.t_wall; // 20 + 240 + 40 + 20 = 320 cm
      p.W_horiz_shift = Math.round(p.H_net * p.m_side);      // 120 * 0.3 = 36 cm

      const isOrig = (
        p.H_total === 150 && p.H_base === 30 && p.W_ramp === 40 &&
        p.t_wall === 20 && p.L_ramp === 240 && p.L_land === 40 &&
        Math.abs(p.m_side - 0.3) < 1e-4
      );

      // Plan view sloped span label: 259 in original drawing
      p.L_plan_diag = isOrig ? 259 : Math.round(p.L_ramp * (259 / 240));
      p.slopeRatioStr = isOrig ? '1:2' : `1:${+(p.L_ramp / p.H_net).toFixed(1)}`;
      p.sideSlopeStr = `1:${p.m_side}`;

      // Quantity Table Formulas (生物坡道每座數量表)
      // Original:
      // 210kgf/cm2混凝土 | 1.68*0.4 | = | 0.67 | m3
      // 軀體模板         | 0.4*1.2*4 | = | 1.92 | m2
      const Wm = +(p.W_ramp / 100).toFixed(2); // 0.4
      const Hm_net = +(p.H_net / 100).toFixed(2); // 1.2
      const Lm_ramp = +(p.L_ramp / 100).toFixed(2); // 2.4
      const Lm_land = +(p.L_land / 100).toFixed(2); // 0.4

      const areaFactor = isOrig ? 1.68 : +(0.5 * Lm_ramp * Hm_net + Lm_land * (Hm_net * 0.5)).toFixed(2);
      const concVal = isOrig ? 0.67 : +(areaFactor * Wm).toFixed(2);
      const formVal = isOrig ? 1.92 : +(Wm * Hm_net * 4).toFixed(2);

      p.concFormulaStr = `${areaFactor.toFixed(2)}*${Wm}`;
      p.concValStr = concVal.toFixed(2);
      p.formFormulaStr = `${Wm}*${Hm_net}*4`;
      p.formValStr = formVal.toFixed(2);
      p.concValNum = concVal;
      p.formValNum = formVal;

      return p;
    }

    // =========================================================================
    // 3. CAD PRIMITIVES & DXF RECORDING HELPERS
    // =========================================================================
    function getPalette() {
      if (isDarkTheme) {
        return {
          bg: '#0b1120',
          primaryLine: '#f8fafc',
          secondaryLine: '#94a3b8',
          dimLine: '#38bdf8',
          dimText: '#7dd3fc',
          leaderLine: '#e2e8f0',
          textMain: '#f8fafc',
          textSub: '#cbd5e1',
          ghostLine: 'rgba(244, 63, 94, 0.45)',
          tableBorder: '#94a3b8',
          tableHeaderBg: 'rgba(30, 41, 59, 0.75)',
          fillWall: 'rgba(30, 41, 59, 0.45)',
          fillRamp: 'rgba(16, 185, 129, 0.14)'
        };
      } else {
        return {
          bg: '#ffffff',
          primaryLine: '#0f172a',
          secondaryLine: '#475569',
          dimLine: '#0f172a',
          dimText: '#0f172a',
          leaderLine: '#0f172a',
          textMain: '#0f172a',
          textSub: '#1e293b',
          ghostLine: 'rgba(225, 29, 72, 0.45)',
          tableBorder: '#0f172a',
          tableHeaderBg: 'rgba(241, 245, 249, 0.9)',
          fillWall: 'rgba(241, 245, 249, 0.55)',
          fillRamp: 'rgba(226, 232, 240, 0.5)'
        };
      }
    }

    function cadLine(ctx, x1, y1, x2, y2, color, width = 1.4, dash = [], layer = '0') {
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

    function cadPoly(ctx, pts, color, width = 1.6, close = true, fill = null, dash = [], layer = '0') {
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

    function cadArrow(ctx, x1, y1, x2, y2, color, width = 1.25) {
      cadLine(ctx, x1, y1, x2, y2, color, width, [], 'LEADER');
      const dx = x2 - x1, dy = y2 - y1;
      const L = Math.hypot(dx, dy) || 1;
      const ux = dx / L, uy = dy / L;
      const nx = -uy, ny = ux;
      const aL = 7.5, aW = 2.3;
      ctx.save();
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(x2, y2);
      ctx.lineTo(x2 - ux * aL + nx * aW, y2 - uy * aL + ny * aW);
      ctx.lineTo(x2 - ux * aL - nx * aW, y2 - uy * aL - ny * aW);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    // Standard CAD Linear Dimension with gap from object corners and centered text break
    function cadDim(ctx, x1, y1, x2, y2, offset, labelStr, pal, fontSize = 11.5) {
      const dx = x2 - x1, dy = y2 - y1;
      const L = Math.hypot(dx, dy);
      if (L < 1e-3) return;
      const ux = dx / L, uy = dy / L;
      const sign = offset >= 0 ? 1 : -1;
      const nx = -uy * sign, ny = ux * sign;
      const absOff = Math.abs(offset);
      const gap = 6;
      const extOver = 5.5;

      const sx1 = x1 + nx * gap, sy1 = y1 + ny * gap;
      const ex1 = x1 + nx * (absOff + extOver), ey1 = y1 + ny * (absOff + extOver);
      const sx2 = x2 + nx * gap, sy2 = y2 + ny * gap;
      const ex2 = x2 + nx * (absOff + extOver), ey2 = y2 + ny * (absOff + extOver);

      const dx1 = x1 + nx * absOff, dy1 = y1 + ny * absOff;
      const dx2 = x2 + nx * absOff, dy2 = y2 + ny * absOff;

      // Extension lines
      cadLine(ctx, sx1, sy1, ex1, ey1, pal.dimLine, 1.05, [], 'DIM');
      cadLine(ctx, sx2, sy2, ex2, ey2, pal.dimLine, 1.05, [], 'DIM');

      const mx = (dx1 + dx2) / 2, my = (dy1 + dy2) / 2;
      const textGap = Math.max(labelStr.length * fontSize * 0.62 + 8, 20);

      if (L > textGap + 12) {
        cadLine(ctx, dx1, dy1, mx - ux * (textGap / 2), my - uy * (textGap / 2), pal.dimLine, 1.05, [], 'DIM');
        cadLine(ctx, mx + ux * (textGap / 2), my + uy * (textGap / 2), dx2, dy2, pal.dimLine, 1.05, [], 'DIM');
      } else {
        cadLine(ctx, dx1, dy1, dx2, dy2, pal.dimLine, 1.05, [], 'DIM');
      }

      // Small arrowheads at dx1, dy1 and dx2, dy2
      const aL = Math.min(6, L * 0.25), aW = 2.0;
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
      cadText(ctx, labelStr, mx, my, fontSize, pal.dimText, 'center', '600', angle, 'DIM_TEXT');
    }

    function drawDoubleUnderlineTitle(ctx, title, cx, cy, size, pal) {
      cadText(ctx, title, cx, cy, size, pal.textMain, 'center', '700', 0, 'TITLE');
      const w = title.length * size * 0.96;
      cadLine(ctx, cx - w / 2, cy + size * 0.65, cx + w / 2, cy + size * 0.65, pal.primaryLine, 1.5, [], 'TITLE');
      cadLine(ctx, cx - w / 2, cy + size * 0.88, cx + w / 2, cy + size * 0.88, pal.primaryLine, 1.0, [], 'TITLE');
    }

    // =========================================================================
    // 4. VIEW 1: #3-#10生物通道側視圖 (SIDE VIEW - TOP)
    //    100% Faithful to Original Top View:
    //    - U-shaped channel cross-section (total height 150, bottom slab 30)
    //    - Left wall top width 20, Ramp top width 40, sloped at 1:0.3 down to base
    //    - Horizontal line across the ramp at the top of the 30cm bottom slab
    //    - Right bank wall rising symmetrically on the right side
    // =========================================================================
    function drawSideView(ctx, cx, topY, p, pal) {
      const s = 0.85; // 1 cm = 0.85 px
      const H_tot = p.H_total * s;       // 150 * s
      const H_base = p.H_base * s;       // 30 * s
      const H_net = H_tot - H_base;      // 120 * s
      const t_w = p.t_wall * s;          // 20 * s
      const W_r = p.W_ramp * s;          // 40 * s
      const dx_net = p.W_horiz_shift * s; // 36 * s (120 * 0.3)
      const dx_tot = (p.H_total * p.m_side) * s; // 45 * s (150 * 0.3)

      const channelInnerBotW = p.cb * s;
      const rightTopW = p.rt * s;
      const totalWidth = t_w + dx_net + channelInnerBotW + dx_net + rightTopW;

      const x0 = cx - totalWidth / 2;
      const y0 = topY + 38;
      const ySlabTop = y0 + H_net;
      const yBot = y0 + H_tot;

      // Key X coordinates on Side View
      const xLeftOuter = x0;
      const xRampTopL = x0 + t_w;
      const xRampTopR = xRampTopL + W_r;

      const xRampMidL = xRampTopL + dx_net;
      const xRampMidR = xRampTopR + dx_net;

      const xRampBotL = xRampTopL + dx_tot;
      const xRampBotR = xRampTopR + dx_tot;

      const xRightBotInner = xRampMidR + channelInnerBotW * 0.65;
      const xRightTopInner = xRightBotInner + dx_net;
      const xRightOuter = xRightTopInner + rightTopW;

      // 0. Ghost Baseline
      if (showGhost) {
        cadPoly(ctx, [
          [xLeftOuter, y0],
          [xRampTopR, y0],
          [xRampMidR, ySlabTop],
          [xRightBotInner, ySlabTop],
          [xRightTopInner, y0],
          [xRightOuter, y0],
          [xRightOuter, yBot],
          [xLeftOuter, yBot]
        ], pal.ghostLine, 1.1, true, null, [4, 4], 'GHOST_SIDE');
      }

      // 1. Main U-shaped Channel & Ramp Outer Boundary
      cadPoly(ctx, [
        [xLeftOuter, y0],
        [xRampTopR, y0],
        [xRampMidR, ySlabTop],
        [xRightBotInner, ySlabTop],
        [xRightTopInner, y0],
        [xRightOuter, y0],
        [xRightOuter, yBot],
        [xLeftOuter, yBot]
      ], pal.primaryLine, 1.75, true, pal.fillWall, [], 'SIDE_OUTLINE');

      // 2. Sloped Ramp Band (Left & Right parallel sloped lines at 1:0.3 from top down to bottom base)
      cadPoly(ctx, [
        [xRampTopL, y0],
        [xRampTopR, y0],
        [xRampBotR, yBot],
        [xRampBotL, yBot]
      ], pal.primaryLine, 1.9, true, pal.fillRamp, [], 'SIDE_RAMP');

      // Horizontal line across the sloped ramp at the top of the 30cm bottom slab
      cadLine(ctx, xRampMidL, ySlabTop, xRampMidR, ySlabTop, pal.primaryLine, 1.5, [], 'SIDE_SLAB_LINE');

      // 3. Dimensions on Side View:
      // Top: |20| 40 |
      cadDim(ctx, xLeftOuter, y0, xRampTopL, y0, -18, `${p.t_wall}`, pal, 11);
      cadDim(ctx, xRampTopL, y0, xRampTopR, y0, -18, `${p.W_ramp}`, pal, 11);

      // Left vertical height: 150
      cadDim(ctx, xLeftOuter, y0, xLeftOuter, yBot, -24, `${p.H_total}`, pal, 11.5);

      // Sloped label "1:0.3" along the right edge of the ramp
      const slopeAng = (Math.atan2(H_net, dx_net) * 180) / Math.PI;
      const sxMid = (xRampTopR + xRampMidR) / 2 + 10;
      const syMid = (y0 + ySlabTop) / 2;
      cadText(ctx, p.sideSlopeStr, sxMid, syMid, 12, pal.textMain, 'center', '700', slopeAng, 'SLOPE_TEXT');

      // Title below Side View
      const titleY = yBot + 28;
      drawDoubleUnderlineTitle(ctx, `${p.title_tag}生物通道側視圖`, cx, titleY, 17, pal);

      return {
        bottomY: titleY + 25
      };
    }

    // =========================================================================
    // 5. VIEW 2: #3-#10生物通道正視圖 (FRONT ELEVATION VIEW - MIDDLE)
    //    100% Faithful to Original Middle View:
    //    - Top horizontal dimension chain: |20| --- 240 --- | 40 |20|
    //    - Left vertical height: 150
    //    - Bottom overall width: 320
    //    - Right bottom heights: 30 (slab thickness) and 20 (exposed height above bed)
    //    - Ramp diagonal from (x0+20, yTop) to (x0+260, ySlabTop) with "1:2" label
    //    - Callouts: 造型模板(淺槽), 表面刷毛處理, 軀體模板, 210kgf/cm²混凝土, 水流方向 --->
    // =========================================================================
    function drawFrontView(ctx, cx, topY, p, pal) {
      const s = 0.85; // 1 cm = 0.85 px (1:1 aligned with Plan View below!)
      const t_w = p.t_wall * s;     // 20 * s
      const L_r = p.L_ramp * s;     // 240 * s
      const L_l = p.L_land * s;     // 40 * s
      const L_tot = p.L_total * s;  // 320 * s

      const H_tot = p.H_total * s;  // 150 * s
      const H_base = p.H_base * s;  // 30 * s
      const H_net = H_tot - H_base; // 120 * s
      const h_exp = p.h_exp * s;    // 20 * s

      const x0 = cx - L_tot / 2;
      const x1 = x0 + t_w;          // +20
      const x2 = x1 + L_r;          // +260
      const x3 = x2 + L_l;          // +300
      const x4 = x3 + t_w;          // +320

      const yTop = topY + 62;
      const ySlabTop = yTop + H_net;
      const yBed = ySlabTop + h_exp;
      const yBot = yTop + H_tot;

      // 0. Ghost Baseline
      if (showGhost) {
        const gL = 320 * s, gH = 150 * s;
        const gx0 = cx - gL / 2;
        cadPoly(ctx, [
          [gx0, yTop],
          [gx0 + gL, yTop],
          [gx0 + gL, yTop + gH],
          [gx0, yTop + gH]
        ], pal.ghostLine, 1.1, true, null, [4, 4], 'GHOST_FRONT');
      }

      // 1. Continuous Revetment Wall & Streambed Extension Lines (Left & Right)
      const extW = 55;
      cadLine(ctx, x0 - extW, yTop, x0, yTop, pal.primaryLine, 1.4, [], 'WALL_EXT');
      cadLine(ctx, x0 - extW, ySlabTop, x0, ySlabTop, pal.primaryLine, 1.3, [], 'WALL_EXT');
      cadLine(ctx, x0 - extW, yBot, x0, yBot, pal.primaryLine, 1.4, [], 'WALL_EXT');

      cadLine(ctx, x4, ySlabTop, x4 + extW + 25, ySlabTop, pal.primaryLine, 1.3, [], 'WALL_EXT');
      cadLine(ctx, x4, yBot, x4 + extW + 25, yBot, pal.primaryLine, 1.4, [], 'WALL_EXT');

      // 2. Main Corridor Structure Outline (320 x 150)
      cadPoly(ctx, [
        [x0, yTop],
        [x4, yTop],
        [x4, yBot],
        [x0, yBot]
      ], pal.primaryLine, 1.85, true, pal.fillWall, [], 'FRONT_OUTLINE');

      // 3. Bottom Slab Top Line (from x0 to x3) and Right End-Wall Vertical Inner Line (at x3)
      cadLine(ctx, x0, ySlabTop, x3, ySlabTop, pal.primaryLine, 1.5, [], 'FRONT_SLAB_TOP');
      cadLine(ctx, x3, yTop, x3, ySlabTop, pal.primaryLine, 1.5, [], 'FRONT_END_WALL');

      // 4. 1:2 Sloped Ramp Line from (x1, yTop) down to (x2, ySlabTop)
      cadPoly(ctx, [
        [x0, yTop],
        [x1, yTop],
        [x2, ySlabTop],
        [x0, ySlabTop]
      ], pal.primaryLine, 1.75, true, pal.fillRamp, [], 'FRONT_RAMP');

      // "1:2" label along the sloped ramp line
      const rampAngle = (Math.atan2(H_net, L_r) * 180) / Math.PI;
      const rMidX = (x1 + x2) / 2 + 6;
      const rMidY = (yTop + ySlabTop) / 2 - 9;
      cadText(ctx, p.slopeRatioStr, rMidX, rMidY, 12.5, pal.textMain, 'center', '700', rampAngle, 'SLOPE_1_2');

      // 5. Top Dimension Chain: |20| --- 240 --- | 40 |20|
      cadDim(ctx, x0, yTop, x1, yTop, -18, `${p.t_wall}`, pal, 11);
      cadDim(ctx, x1, yTop, x2, yTop, -18, `${p.L_ramp}`, pal, 11.5);
      cadDim(ctx, x2, yTop, x3, yTop, -18, `${p.L_land}`, pal, 11);
      cadDim(ctx, x3, yTop, x4, yTop, -18, `${p.t_wall}`, pal, 11);

      // Left Vertical Height: 150
      cadDim(ctx, x0, yTop, x0, yBot, -24, `${p.H_total}`, pal, 11.5);

      // Bottom Overall Width: 320
      cadDim(ctx, x0, yBot, x4, yBot, 22, `${p.L_total}`, pal, 11.5);

      // Right Bottom Vertical Dimensions: 30 and 20
      cadDim(ctx, x4, ySlabTop, x4, yBot, 22, `${p.H_base}`, pal, 10.5);
      cadDim(ctx, x4 + 22, ySlabTop, x4 + 22, yBed, 18, `${p.h_exp}`, pal, 10.5);
      cadLine(ctx, x4 + 14, yBed, x4 + 48, yBed, pal.primaryLine, 1.1);

      // 6. All Callout Leaders on Front View (100% Matching Original)
      // (a) 造型模板(淺槽) -> dual arrows pointing to upper wall & lower ramp triangle
      const fMoldKneeX = x0 + 62;
      const fMoldKneeY = yTop - 42;
      cadLine(ctx, fMoldKneeX - 18, fMoldKneeY, fMoldKneeX, fMoldKneeY, pal.leaderLine, 1.15);
      cadArrow(ctx, fMoldKneeX, fMoldKneeY, x0 + 82, yTop + 32, pal.leaderLine, 1.15);
      cadArrow(ctx, fMoldKneeX, fMoldKneeY, x0 + 60, yTop + 66, pal.leaderLine, 1.15);
      cadText(ctx, '造型模板(淺槽)', fMoldKneeX - 22, fMoldKneeY, 13, pal.textMain, 'right', '600');

      // (b) 表面刷毛處理 -> arrow pointing directly to the 1:2 sloped ramp surface
      const brushKneeX = x1 + L_r * 0.56;
      const brushKneeY = yTop - 28;
      const brushEndX = brushKneeX + 108;
      cadLine(ctx, brushKneeX, brushKneeY, brushEndX, brushKneeY, pal.leaderLine, 1.2);
      cadArrow(ctx, brushKneeX, brushKneeY, x1 + L_r * 0.36, yTop + H_net * 0.42, pal.leaderLine, 1.2);
      cadText(ctx, '表面刷毛處理', (brushKneeX + brushEndX) / 2, brushKneeY - 9, 13, pal.textMain, 'center', '600');

      // (c) 軀體模板 -> dual arrows pointing to right vertical wall & inner face
      const bodyKneeX = x4 + 54;
      const bodyKneeY = yTop + 12;
      cadLine(ctx, bodyKneeX, bodyKneeY, bodyKneeX + 68, bodyKneeY, pal.leaderLine, 1.15);
      cadArrow(ctx, bodyKneeX, bodyKneeY, x4, yTop + 18, pal.leaderLine, 1.15);
      cadArrow(ctx, bodyKneeX, bodyKneeY, x3, yTop + H_net * 0.72, pal.leaderLine, 1.15);
      cadText(ctx, '軀體模板', bodyKneeX + 34, bodyKneeY - 8, 13, pal.textMain, 'center', '600');

      // (d) 210kgf/cm²混凝土 -> arrow pointing up into lower ramp body
      const concKneeX = x0 + 78;
      const concKneeY = yBot + 38;
      cadLine(ctx, concKneeX - 18, concKneeY, concKneeX, concKneeY, pal.leaderLine, 1.15);
      cadArrow(ctx, concKneeX, concKneeY, x0 + 86, ySlabTop - 16, pal.leaderLine, 1.15);
      cadText(ctx, '210kgf/cm²混凝土', concKneeX - 22, concKneeY, 13, pal.textMain, 'right', '600');

      // (e) 水流方向 ---> (pointing RIGHT on Front View)
      const flowY = yBot + 36;
      const flowX1 = cx - 42;
      const flowX2 = cx + 52;
      cadArrow(ctx, flowX1, flowY, flowX2, flowY, pal.primaryLine, 1.4);
      cadText(ctx, '水流方向', (flowX1 + flowX2) / 2 - 4, flowY + 14, 13, pal.textMain, 'center', '600');

      // Title below Front View
      const titleY = flowY + 38;
      drawDoubleUnderlineTitle(ctx, `${p.title_tag}生物通道正視圖`, cx, titleY, 17, pal);

      return {
        x0,
        x4,
        bottomY: titleY + 26
      };
    }

    // =========================================================================
    // 6. VIEW 3: #3-#10生物通道平面圖 (PLAN VIEW - BOTTOM, 1:1 ALIGNED WITH FRONT VIEW)
    //    100% Faithful to Original Plan View:
    //    - Top dimension chain: |20| --- 259 --- | 40 |20|
    //    - Left vertical dimension chain: 20 | 40 | 36
    //    - Diagonal ramp strip (width 40) running from top-left (x1) to bottom-right (x2)
    //    - Internal width callouts: 40 (across ramp near bottom) and 40 (landing length)
    //    - Flow direction arrow: <--- 水流方向 (pointing LEFT on Plan View, matching original!)
    // =========================================================================
    function drawPlanViewAndTable(ctx, cx, topY, p, pal) {
      const s = 0.85; // Strictly 1:1 aligned with Front View
      const t_w = p.t_wall * s;          // 20 * s
      const L_r = p.L_ramp * s;          // 240 * s
      const L_l = p.L_land * s;          // 40 * s
      const L_tot = p.L_total * s;       // 320 * s

      const W_r = p.W_ramp * s;          // 40 * s
      const W_shift = p.W_horiz_shift * s; // 36 * s

      const x0 = cx - L_tot / 2;
      const x1 = x0 + t_w;
      const x2 = x1 + L_r;
      const x3 = x2 + L_l;
      const x4 = x3 + t_w;

      const y0 = topY + 42;             // Top outer edge of back wall
      const y1 = y0 + t_w;              // Inner edge of 20cm back wall
      const y2 = y1 + W_r;              // +40cm
      const y3 = y2 + W_shift;          // +36cm (Front toe edge of corridor)

      // 1. Left & Right Revetment Slope Continuity Lines
      const extW = 55;
      cadLine(ctx, x0 - extW, y2 - 12, x0, y2 - 12, pal.primaryLine, 1.35, [], 'PLAN_EXT');
      cadLine(ctx, x0 - extW, y2, x0, y2, pal.primaryLine, 1.35, [], 'PLAN_EXT');
      cadLine(ctx, x0 - extW, y3, x0, y3, pal.primaryLine, 1.4, [], 'PLAN_EXT');

      cadLine(ctx, x4, y2 - 12, x4 + extW, y2 - 12, pal.primaryLine, 1.35, [], 'PLAN_EXT');
      cadLine(ctx, x4, y2, x4 + extW, y2, pal.primaryLine, 1.35, [], 'PLAN_EXT');
      cadLine(ctx, x4, y3, x4 + extW, y3, pal.primaryLine, 1.4, [], 'PLAN_EXT');

      // 2. Outer U-Frame of the Wildlife Corridor in Plan View (Left end wall, top back wall, right end wall)
      cadPoly(ctx, [
        [x0, y0],
        [x4, y0],
        [x4, y2],
        [x3, y2],
        [x3, y1],
        [x1, y1],
        [x1, y2],
        [x0, y2]
      ], pal.primaryLine, 1.75, true, pal.fillWall, [], 'PLAN_FRAME');

      // Lower front rectangle boundary (from y2 to y3 across x0..x3)
      cadPoly(ctx, [
        [x0, y2],
        [x3, y2],
        [x3, y3],
        [x0, y3]
      ], pal.primaryLine, 1.6, true, null, [], 'PLAN_FRONT_TOE');

      // 3. Diagonal Sloped Ramp Strip in Plan View:
      // Starts at left wall x1 spanning [y1, y2] (width 40),
      // Slopes down-right to x2 spanning [y3 - W_r, y3] (width 40),
      // Followed by flat landing [x2..x3] at the bottom
      cadPoly(ctx, [
        [x1, y1],
        [x2, y3 - W_r],
        [x2, y3],
        [x1, y2]
      ], pal.primaryLine, 1.85, true, pal.fillRamp, [], 'PLAN_RAMP_STRIP');

      // Landing block [x2..x3] at bottom [y3 - W_r .. y3]
      cadPoly(ctx, [
        [x2, y3 - W_r],
        [x3, y3 - W_r],
        [x3, y3],
        [x2, y3]
      ], pal.primaryLine, 1.6, true, null, [], 'PLAN_LANDING');

      // 4. Top Dimension Chain on Plan View: |20| --- 259 --- | 40 |20|
      cadDim(ctx, x0, y0, x1, y0, -18, `${p.t_wall}`, pal, 11);
      cadDim(ctx, x1, y0, x2, y0, -18, `${p.L_plan_diag}`, pal, 11.5);
      cadDim(ctx, x2, y0, x3, y0, -18, `${p.L_land}`, pal, 11);
      cadDim(ctx, x3, y0, x4, y0, -18, `${p.t_wall}`, pal, 11);

      // 5. Left Vertical Dimension Chain on Plan View: 20 | 40 | 36
      cadDim(ctx, x0, y0, x0, y1, -18, `${p.t_wall}`, pal, 10.5);
      cadDim(ctx, x0, y1, x0, y2, -18, `${p.W_ramp}`, pal, 10.5);
      cadDim(ctx, x0, y2, x0, y3, -18, `${p.W_horiz_shift}`, pal, 10.5);

      // 6. Internal "40" Dimensions inside Plan View (Matching Original):
      // (a) Horizontal 40 across the landing bay [x2 .. x3]
      const inY = (y1 + y3 - W_r) / 2 + 2;
      cadLine(ctx, x2, y1 + 4, x2, inY + 5, pal.dimLine, 1.0);
      cadDim(ctx, x2, inY, x3, inY, 0, `${p.L_land}`, pal, 10.5);

      // (b) Vertical 40 across the ramp width near x2
      const inX = x2 - 14;
      cadDim(ctx, inX, y3 - W_r, inX, y3, 0, `${p.W_ramp}`, pal, 10.5);

      // 7. Flow Direction Arrow below Plan View: <--- 水流方向 (Pointing LEFT as in Original Plan View)
      const flowY = y3 + 22;
      const flowX1 = cx + 42;
      const flowX2 = cx - 52;
      cadArrow(ctx, flowX1, flowY, flowX2, flowY, pal.primaryLine, 1.4);
      cadText(ctx, '水流方向', (flowX1 + flowX2) / 2 + 4, flowY + 14, 13, pal.textMain, 'center', '600');

      // Title below Plan View
      const planTitleY = flowY + 38;
      drawDoubleUnderlineTitle(ctx, `${p.title_tag}生物通道平面圖`, cx, planTitleY, 17, pal);

      // =====================================================================
      // 8. BOTTOM QUANTITY TABLE: 生物坡道每座數量表 & 註1
      //    Exact match to Original Table:
      //    生物坡道每座數量表
      //    | 210kgf/cm²混凝土 | 1.68*0.4  | = | 0.67 | m³ |
      //    | 軀體模板         | 0.4*1.2*4 | = | 1.92 | m² |
      // =====================================================================
      const tblX = x0 - 10;
      const tblY = planTitleY + 46;
      cadText(ctx, '生物坡道每座數量表', tblX, tblY - 11, 13, pal.textMain, 'left', '600');

      const colW = [132, 106, 22, 54, 30];
      const rowH = 26;
      const totW = colW.reduce((a, b) => a + b, 0);
      const totH = rowH * 2;

      cadPoly(ctx, [
        [tblX, tblY],
        [tblX + totW, tblY],
        [tblX + totW, tblY + totH],
        [tblX, tblY + totH]
      ], pal.primaryLine, 1.5, true, pal.tableHeaderBg, [], 'QTY_TABLE');

      // Middle horizontal divider
      cadLine(ctx, tblX, tblY + rowH, tblX + totW, tblY + rowH, pal.primaryLine, 1.2, [], 'QTY_TABLE');

      // Vertical column dividers
      let vx = tblX;
      for (let i = 0; i < colW.length - 1; i++) {
        vx += colW[i];
        cadLine(ctx, vx, tblY, vx, tblY + totH, pal.primaryLine, 1.2, [], 'QTY_TABLE');
      }

      // Row 1 Content: 210kgf/cm²混凝土 | 1.68*0.4 | = | 0.67 | m³
      const r1Y = tblY + rowH / 2;
      cadText(ctx, '210kgf/cm²混凝土', tblX + 5, r1Y, 13, pal.textMain, 'left', '600');
      cadText(ctx, p.concFormulaStr, tblX + colW[0] + 8, r1Y, 13.5, pal.textMain, 'left', '600');
      cadText(ctx, '=', tblX + colW[0] + colW[1] + colW[2] / 2, r1Y, 13, pal.textMain, 'center', '700');
      cadText(ctx, p.concValStr, tblX + colW[0] + colW[1] + colW[2] + colW[3] / 2, r1Y, 13.5, pal.dimText, 'center', '700');
      cadText(ctx, 'm³', tblX + totW - colW[4] / 2, r1Y, 12.5, pal.textMain, 'center', '600');

      // Row 2 Content: 軀體模板 | 0.4*1.2*4 | = | 1.92 | m²
      const r2Y = tblY + rowH * 1.5;
      cadText(ctx, '軀體模板', tblX + 5, r2Y, 13, pal.textMain, 'left', '600');
      cadText(ctx, p.formFormulaStr, tblX + colW[0] + 8, r2Y, 13.5, pal.textMain, 'left', '600');
      cadText(ctx, '=', tblX + colW[0] + colW[1] + colW[2] / 2, r2Y, 13, pal.textMain, 'center', '700');
      cadText(ctx, p.formValStr, tblX + colW[0] + colW[1] + colW[2] + colW[3] / 2, r2Y, 13.5, pal.dimText, 'center', '700');
      cadText(ctx, 'm²', tblX + totW - colW[4] / 2, r2Y, 12.5, pal.textMain, 'center', '600');

      // Note 1 below Table (註1)
      const noteY = tblY + totH + 26;
      cadText(ctx, `註1：${p.title_tag}生物通道施作位置，得依生態調查`, tblX, noteY, 14.5, pal.textMain, 'left', '600');
      cadText(ctx, '資料評估調整施設位置及斜坡道方向。', tblX + 62, noteY + 23, 14.5, pal.textMain, 'left', '600');

      return {
        bottomY: noteY + 45
      };
    }

    // =========================================================================
    // 7. MAIN RENDER ENGINE & DYNAMIC BOUNDING-BOX ANTI-OVERLAP LAYOUT
    // =========================================================================
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

      // Update Sidebar Summary UI
      document.getElementById('stat_tag_badge').textContent = `${p.title_tag} (${p.N_units}座)`;
      document.getElementById('stat_conc_unit').textContent = `${p.concValStr} m³`;
      document.getElementById('stat_conc_formula').textContent = `${p.concFormulaStr} = ${p.concValStr}`;
      document.getElementById('stat_form_unit').textContent = `${p.formValStr} m²`;
      document.getElementById('stat_form_formula').textContent = `${p.formFormulaStr} = ${p.formValStr}`;
      document.getElementById('stat_L_plan').textContent = `${p.L_plan_diag} cm`;
      document.getElementById('stat_W_horiz').textContent = `${p.W_horiz_shift} cm`;
      document.getElementById('stat_N_label').textContent = `${p.N_units}`;
      document.getElementById('stat_total_all').textContent =
        `混凝土 ${(p.concValNum * p.N_units).toFixed(2)} m³ / 模板 ${(p.formValNum * p.N_units).toFixed(2)} m²`;
      document.getElementById('zoom-indicator').textContent = `${Math.round(viewCam.scale * 100)}%`;

      dxfEntities = [];

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.fillStyle = pal.bg;
      ctx.fillRect(0, 0, rect.width, rect.height);

      ctx.translate(viewCam.offsetX, viewCam.offsetY);
      ctx.scale(viewCam.scale, viewCam.scale);

      const centerAxisX = 360;

      if (currentView === 'SIDE_FRONT') {
        const bSide = drawSideView(ctx, centerAxisX, 15, p, pal);
        drawFrontView(ctx, centerAxisX, bSide.bottomY + 20, p, pal);
      } else if (currentView === 'PLAN_TABLE') {
        drawPlanViewAndTable(ctx, centerAxisX, 25, p, pal);
      } else {
        // 'ALL' Vertical Stack matching Original Drawing 100%:
        // 1. Top: #3-#10生物通道側視圖
        // 2. Middle: #3-#10生物通道正視圖
        // 3. Bottom: #3-#10生物通道平面圖 + 生物坡道每座數量表 + 註1
        const bSide = drawSideView(ctx, centerAxisX, 12, p, pal);
        const bFront = drawFrontView(ctx, centerAxisX, bSide.bottomY + 18, p, pal);
        drawPlanViewAndTable(ctx, centerAxisX, bFront.bottomY + 14, p, pal);
      }

      ctx.restore();
    }

    // =========================================================================
    // 8. UI CONTROLS, CAMERA INTERACTION & DXF / CSV EXPORTERS
    // =========================================================================
    function onParamChange() {
      // Lock camera view when editing parameters!
      renderAll();
    }

    function applyPreset(mode) {
      let cfg = ORIG_CORRIDOR;
      if (mode === 'GENTLE') {
        cfg = { ...ORIG_CORRIDOR, L_ramp: 300 };
      } else if (mode === 'HIGH') {
        cfg = { ...ORIG_CORRIDOR, H_total: 180, W_ramp: 50, L_ramp: 300 };
      }
      Object.keys(cfg).forEach(k => {
        const el = document.getElementById('inp_' + k);
        if (el) el.value = cfg[k];
      });
      renderAll();
    }

    function switchView(view) {
      currentView = view;
      const auditEl = document.getElementById('auditPanel');
      const tabs = {
        ALL: document.getElementById('tab-all'),
        SIDE_FRONT: document.getElementById('tab-side'),
        PLAN_TABLE: document.getElementById('tab-plan'),
        AUDIT: document.getElementById('tab-audit')
      };
      Object.keys(tabs).forEach(k => {
        if (!tabs[k]) return;
        tabs[k].className = (k === view)
          ? 'px-3 py-1.5 rounded-md text-xs font-semibold transition-all bg-emerald-600 text-white shadow'
          : 'px-3 py-1.5 rounded-md text-xs font-medium transition-all text-slate-400 hover:text-white';
      });
      if (view === 'AUDIT') {
        auditEl.classList.remove('hidden');
      } else {
        auditEl.classList.add('hidden');
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
      if (currentView === 'SIDE_FRONT') {
        viewCam.scale = Math.min(rect.width / 760, rect.height / 640) * 0.92;
        viewCam.offsetX = (rect.width - 720 * viewCam.scale) / 2;
        viewCam.offsetY = 24;
      } else if (currentView === 'PLAN_TABLE') {
        viewCam.scale = Math.min(rect.width / 760, rect.height / 520) * 0.92;
        viewCam.offsetX = (rect.width - 720 * viewCam.scale) / 2;
        viewCam.offsetY = 30;
      } else {
        viewCam.scale = Math.min(rect.width / 760, rect.height / 980) * 0.94;
        viewCam.offsetX = Math.max(30, (rect.width - 720 * viewCam.scale) / 2);
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
      a.download = `生物通道標準圖_${p.title_tag}_H${p.H_total}xL${p.L_total}.dxf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }

    function exportCSV() {
      const p = getParams();
      const rows = [
        [`${p.title_tag} 生物通道（生態斜坡道）標準圖 - 工程數量計算書`],
        ['參數項目', '設定數值', '單位', '備註說明'],
        ['總高度 H_total', p.H_total, 'cm', '原圖標準 150cm'],
        ['底版基礎厚 H_base', p.H_base, 'cm', '原圖標準 30cm (外露 20cm)'],
        ['生物坡道寬 W_ramp', p.W_ramp, 'cm', '原圖標準 40cm'],
        ['正視圖坡道水平長 L_ramp', p.L_ramp, 'cm', `原圖標準 240cm (縱坡 ${p.slopeRatioStr})`],
        ['平面圖斜向展開長', p.L_plan_diag, 'cm', '原圖標準 259cm'],
        ['護岸邊坡斜率', p.sideSlopeStr, '-', `側向水平退縮 ${p.W_horiz_shift}cm`],
        ['施作總座數 N', p.N_units, '座', `${p.title_tag} 共 ${p.N_units} 座`],
        [],
        ['【生物坡道每座數量表】', '計算式', '每座數量', '單位', `全案合計 (${p.N_units}座)`],
        ['210kgf/cm²混凝土', `'${p.concFormulaStr}`, p.concValStr, 'm³', (p.concValNum * p.N_units).toFixed(2)],
        ['軀體模板', `'${p.formFormulaStr}`, p.formValStr, 'm²', (p.formValNum * p.N_units).toFixed(2)],
        [],
        ['註1：#3-#10生物通道施作位置，得依生態調查資料評估調整施設位置及斜坡道方向。']
      ];

      const csvContent = '\uFEFF' + rows.map(r => r.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `生物通道數量計算表_${p.title_tag}.csv`;
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
  

  const PAL = getPalette();
  function run(G) {   // G：{ name, H_total, H_base, W_ramp, t_wall, L_ramp, L_land, m_side, h_exp, cb, rt, conc, form, A, Hn, nf }
    O = []; const p = Object.assign({}, G); p.H_net = G.Hn; p.L_total = 2 * p.t_wall + p.L_ramp + p.L_land; p.W_horiz_shift = +(p.H_net * p.m_side).toFixed(1);
    p.L_plan_diag = +p.L_ramp.toFixed(1); p.slopeRatioStr = `1:${+(p.L_ramp / p.H_net).toFixed(2)}`; p.sideSlopeStr = `1:${p.m_side}`; p.title_tag = String(G.name || '').replace(/生物通道/g, ''); p.N_units = 1;
    const Wm = p.W_ramp / 100, Hm = p.H_net / 100;
    p.concFormulaStr = `${(G.A / 1e4).toFixed(3)}*${Wm}`; p.concValStr = G.conc.toFixed(3); p.formFormulaStr = `${Wm}*${Hm.toFixed(2)}*${G.nf}`; p.formValStr = G.form.toFixed(2); p.concValNum = G.conc; p.formValNum = G.form;
    const cx = 420, bS = drawSideView(CTX, cx, 12, p, PAL), bF = drawFrontView(CTX, cx, bS.bottomY + 18, p, PAL), bP = drawPlanViewAndTable(CTX, cx, bF.bottomY + 14, p, PAL);
    const N = [`坡道混凝土斷面＝(2×端牆 ${p.t_wall}＋坡長 ${p.L_ramp.toFixed(0)})/2×淨高 ${p.H_net.toFixed(0)}＝${(G.A / 1e4).toFixed(3)} m²（正視圖坡道多邊形）`,
      `淨高＝護岸高 ${(p.H_net + p.h_exp).toFixed(0)}−基礎外露 ${p.h_exp}；坡長＝${p.slopeRatioStr.replace('1:', '')}×淨高；坡面斜長 ${Math.hypot(p.L_ramp, p.H_net).toFixed(1)}；平面坡道斜長 ${Math.hypot(p.L_ramp, p.W_horiz_shift).toFixed(1)}`,
      `軀體模板＝兩端牆內外 ${G.nf} 面×坡道寬×淨高；側視圖右側渠道寬 ${p.cb}、牆頂 ${p.rt} 為示意`];
    N.forEach((s, i) => cadText(CTX, '・' + s, cx - 300, bP.bottomY + 18 + i * 18, 11.5, '#fde047', 'left', '600', 0, 'NOTE'));
    const sc = 1 / 0.85; return O.map(o => { const r = Object.assign({}, o); if (r.p) r.p = r.p.map(([x, y]) => [x * sc, y * sc]); if (r.x !== undefined) { r.x *= sc; r.y *= sc; } if (r.r) r.r *= sc; if (r.h) r.h *= sc; return r; });
  }


  function cadLine(ctx, x1, y1, x2, y2, color, width, dash, layer) { O.push({ k: 'L', p: [[x1, -y1], [x2, -y2]], c: color, w: width || 1.5, d: dash || [], ly: layer || '0' }); }
  function cadPoly(ctx, pts, color, width, close, fill, dash, layer) { if (!pts || pts.length < 2) return; O.push({ k: 'P', p: pts.map(q => [q[0], -q[1]]), c: color, w: width || 1.6, f: fill || null, cl: close !== false, d: dash || [], ly: layer || '0' }); }
  function cadCircle(ctx, cx, cy, r, color, width, fill, layer) { O.push({ k: 'C', x: cx, y: -cy, r, c: color, f: fill || null, w: width || 1.2, ly: layer || 'REBAR' }); }
  function cadText(ctx, str, x, y, size, color, align, weight, angleDeg, layer) { O.push({ k: 'T', x, y: -y, s: String(str), h: (size || 12) * 1.1, c: color || '#f8fafc', al: align || 'left', bl: 'middle', rot: -(angleDeg || 0) * Math.PI / 180, ly: layer || 'TEXT' }); }
  function cadArrow(ctx, x1, y1, x2, y2, color, width) { cadLine(ctx, x1, y1, x2, y2, color, width, [], 'LEADER'); const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L, nx = -uy, ny = ux; O.push({ k: 'P', p: [[x2, -y2], [x2 - ux * 8 + nx * 2.4, -(y2 - uy * 8 + ny * 2.4)], [x2 - ux * 8 - nx * 2.4, -(y2 - uy * 8 - ny * 2.4)]], c: color, w: 1, f: color, cl: true, d: [], ly: 'LEADER' }); }

  return { run };
})();
