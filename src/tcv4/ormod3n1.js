/* v6.3 #1固床工（使用者原工具 d8b90023 自動抽出；gen_n1.py） */
TCO_S['n1'] = (function () {
  const DEF = {"inp_W_wing_L": "200", "inp_W_wing_R": "200", "inp_W_notch": "240", "inp_B_bot": "352", "inp_D_wing_L": "56", "inp_D_wing_R": "56", "inp_m_notch": "0.3", "inp_H_up": "120", "inp_H_low": "180", "inp_T_top": "30", "inp_m_front": "0.3", "inp_rebar_sp": "30", "inp_N_units": "1", "p_LReq": "1", "p_cov": "5", "p_lge": "7", "p_hkw": "4.5", "p_hkl": "9", "p_w16": "1.56", "p_w13": "0.995", "p_stx": "16", "p_sty": "24"};
  let RR = null, O = [];
  const EL = {}, CTX = new Proxy({}, { get: (t, k) => (k in t ? t[k] : () => ({ width: 0 })), set: (t, k, v) => { t[k] = v; return true; } });
  const el = id => EL[id] || (EL[id] = { get value() { const v = RR && RR[id] !== undefined && RR[id] !== null && RR[id] !== '' ? RR[id] : DEF[id]; return v === undefined ? '' : String(v); }, set value(v) {}, textContent: '', innerHTML: '', className: '', style: {}, classList: { add() {}, remove() {} }, addEventListener() {} });
  const document = { getElementById: el, querySelectorAll: () => [], querySelector: () => null, createElement: () => ({ click() {}, style: {} }), body: { appendChild() {}, removeChild() {} } };
  const window = { addEventListener() {}, devicePixelRatio: 1 };

    // =========================================================================
    // 1. BASELINE CONSTANTS & GLOBAL STATE (PURE ASCII IDENTIFIERS)
    // =========================================================================
    const ORIG_SILL = {
      W_notch: 240,
      W_wing_L: 200,
      W_wing_R: 200,
      B_bot: 352,
      m_notch: 0.3,
      H_up: 120,
      H_low: 180,
      T_top: 30,
      m_front: 0.3,
      D_wing_L: 56,
      D_wing_R: 56,
      rebar_sp: 30,
      N_units: 1,
      title_tag: '#1固床工'
    };

    let currentView = 'ALL'; // 'ALL', 'FRONT_PLAN', 'SIDE_ONLY', 'AUDIT'
    let showGhost = false;
    let isDarkTheme = true;

    let viewCam = {
      scale: 0.85,
      offsetX: 60,
      offsetY: 25,
      isDragging: false,
      dragStartX: 0,
      dragStartY: 0
    };

    let dxfEntities = [];

    // =========================================================================
    // 2. PARAMETER READER & DERIVED GEOMETRY / QUANTITY ENGINE
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
        W_notch: Math.max(80, num('inp_W_notch', 240)),
        W_wing_L: Math.max(40, num('inp_W_wing_L', 200)),
        W_wing_R: Math.max(40, num('inp_W_wing_R', 200)),
        B_bot: Math.max(100, num('inp_B_bot', 352)),
        m_notch: Math.max(0.05, num('inp_m_notch', 0.3)),
        H_up: Math.max(40, num('inp_H_up', 120)),
        H_low: Math.max(60, num('inp_H_low', 180)),
        T_top: Math.max(20, num('inp_T_top', 30)),
        m_front: Math.max(0.05, num('inp_m_front', 0.3)),
        D_wing_L: Math.max(25, num('inp_D_wing_L', 56)),
        D_wing_R: Math.max(25, num('inp_D_wing_R', 56)),
        rebar_sp: Math.max(10, num('inp_rebar_sp', 30)),
        N_units: Math.max(1, Math.round(num('inp_N_units', 1))),
        title_tag: str('inp_title_tag', '#1固床工')
      };

      // Derived Exact Dimensions:
      // 1. Notch horizontal splay on each side: dx_notch = H_up * m_notch (120 * 0.3 = 36 cm)
      p.dx_notch = Math.round(p.H_up * p.m_notch);
      // 2. Top opening width of overflow weir: W_top_notch = W_notch + 2 * dx_notch (240 + 72 = 312 cm)
      p.W_top_notch = p.W_notch + 2 * p.dx_notch;
      // 3. Total top width across left wing + notch + right wing: W_total = W_wing_L + W_top_notch + W_wing_R
      p.W_total = p.W_wing_L + p.W_top_notch + p.W_wing_R;
      // 4. Total height: H_total = H_up + H_low (120 + 180 = 300 cm)
      p.H_total = p.H_up + p.H_low;
      // 5. Thickness at notch invert level: T_mid = T_top + H_up * m_front (30 + 36 = 66 cm)
      p.T_mid = Math.round(p.T_top + p.H_up * p.m_front);
      // 6. Thickness at base level: T_bot = T_mid + H_low * m_front (66 + 54 = 120 cm)
      p.T_bot = Math.round(p.T_top + p.H_total * p.m_front);

      p.notchSlopeStr = `1:${p.m_notch}`;
      p.frontSlopeStr = `1:${p.m_front}`;

      // Engineering Quantities Calculation (Per Unit, supporting asymmetric left/right wings):
      const A_wing_L_m2 = ((p.W_wing_L + p.W_wing_L + p.dx_notch) / 200) * (p.H_up / 100);
      const A_wing_R_m2 = ((p.W_wing_R + p.W_wing_R + p.dx_notch) / 200) * (p.H_up / 100);
      const A_upper_wings_m2 = A_wing_L_m2 + A_wing_R_m2;
      const T_upper_avg_m = ((p.T_top + p.T_mid) / 200);
      const V_upper_m3 = A_upper_wings_m2 * T_upper_avg_m;

      // Lower trapezoid body area (front elevation) = ((W_total + B_bot)/2 * H_low)
      const A_lower_m2 = ((p.W_total + p.B_bot) / 200) * (p.H_low / 100);
      const T_lower_avg_m = ((p.T_mid + p.T_bot) / 200);
      const V_lower_m3 = A_lower_m2 * T_lower_avg_m;

      p.concVol = +(V_upper_m3 + V_lower_m3).toFixed(2);
      p.concFormula = `${A_upper_wings_m2.toFixed(2)}*${T_upper_avg_m.toFixed(2)} + ${A_lower_m2.toFixed(2)}*${T_lower_avg_m.toFixed(2)}`;

      // Formwork Areas (m2):
      const slopeFactor = Math.hypot(1, p.m_front);
      p.formStyled = +((A_upper_wings_m2 + A_lower_m2) * slopeFactor).toFixed(2); // 造型模板 (下游斜坡面)
      p.formBody = +(A_upper_wings_m2 + A_lower_m2).toFixed(2);                  // 軀體模板 (上游垂直面)

      const leftBottomSpan = Math.max(0, (p.W_wing_L + p.W_top_notch / 2) - p.B_bot / 2);
      const rightBottomSpan = Math.max(0, (p.W_wing_R + p.W_top_notch / 2) - p.B_bot / 2);
      const wingSideLenL_m = (p.H_up + Math.hypot(p.H_low, leftBottomSpan)) / 100;
      const wingSideLenR_m = (p.H_up + Math.hypot(p.H_low, rightBottomSpan)) / 100;
      p.formSimple = +((wingSideLenL_m + wingSideLenR_m) * ((p.T_top + p.T_bot) / 200)).toFixed(2); // 簡易模板 (左右兩側端面)
      p.formTotal = +(p.formStyled + p.formBody + p.formSimple).toFixed(2);

      // Rebar Weight (∮16@30cm vertical L-bars & ∮13@30cm horizontal bars):
      const nVertBars = Math.floor(p.W_total / p.rebar_sp) + 1;
      const avgVertLen_m = ((p.H_total + p.T_bot - 15) / 100) * 0.82;
      p.rebar16Kg = +(nVertBars * avgVertLen_m * 1.56).toFixed(1);

      const nHorizRows = Math.floor(p.H_total / p.rebar_sp) + 3;
      const avgHorizLen_m = ((p.W_total + p.B_bot) / 200);
      p.rebar13Kg = +(nHorizRows * avgHorizLen_m * 0.995).toFixed(1);
      p.rebarTotalKg = +(p.rebar16Kg + p.rebar13Kg).toFixed(1);

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
          rebarLine: '#38bdf8',
          rebarDot: '#f59e0b',
          dimLine: '#22d3ee',
          dimText: '#67e8f9',
          leaderLine: '#e2e8f0',
          textMain: '#f8fafc',
          textSub: '#cbd5e1',
          ghostLine: 'rgba(244, 63, 94, 0.45)',
          tableBorder: '#94a3b8',
          tableHeaderBg: 'rgba(30, 41, 59, 0.8)',
          fillConcrete: 'rgba(30, 41, 59, 0.38)',
          fillSlope: 'rgba(15, 23, 42, 0.55)'
        };
      } else {
        return {
          bg: '#ffffff',
          primaryLine: '#0f172a',
          secondaryLine: '#475569',
          rebarLine: '#0f172a',
          rebarDot: '#0f172a',
          dimLine: '#0f172a',
          dimText: '#0f172a',
          leaderLine: '#0f172a',
          textMain: '#0f172a',
          textSub: '#334155',
          ghostLine: 'rgba(225, 29, 72, 0.45)',
          tableBorder: '#0f172a',
          tableHeaderBg: 'rgba(241, 245, 249, 0.95)',
          fillConcrete: 'rgba(241, 245, 249, 0.45)',
          fillSlope: 'rgba(226, 232, 240, 0.35)'
        };
      }
    }

    function cadLine(ctx, x1, y1, x2, y2, color, width = 1.5, dash = [], layer = '0') {
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

    function cadCircle(ctx, cx, cy, r, color, width = 1.2, fill = null, layer = 'REBAR') {
      ctx.save();
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
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

    function cadArrow(ctx, x1, y1, x2, y2, color, width = 1.2) {
      cadLine(ctx, x1, y1, x2, y2, color, width, [], 'LEADER');
      const dx = x2 - x1, dy = y2 - y1;
      const L = Math.hypot(dx, dy) || 1;
      const ux = dx / L, uy = dy / L;
      const nx = -uy, ny = ux;
      const aL = 8.0, aW = 2.4;
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

    // Standard CAD Dimension with strict extension-line gap and centered text break
    function cadDim(ctx, x1, y1, x2, y2, offset, labelStr, pal, fontSize = 12) {
      const dx = x2 - x1, dy = y2 - y1;
      const L = Math.hypot(dx, dy);
      if (L < 1e-3) return;
      const ux = dx / L, uy = dy / L;
      const sign = offset >= 0 ? 1 : -1;
      const nx = -uy * sign, ny = ux * sign;
      const absOff = Math.abs(offset);
      const gap = 8; // Strict retreat from structure corners!
      const extOver = 6;

      const sx1 = x1 + nx * gap, sy1 = y1 + ny * gap;
      const ex1 = x1 + nx * (absOff + extOver), ey1 = y1 + ny * (absOff + extOver);
      const sx2 = x2 + nx * gap, sy2 = y2 + ny * gap;
      const ex2 = x2 + nx * (absOff + extOver), ey2 = y2 + ny * (absOff + extOver);

      const dx1 = x1 + nx * absOff, dy1 = y1 + ny * absOff;
      const dx2 = x2 + nx * absOff, dy2 = y2 + ny * absOff;

      if (absOff > 4) {
        cadLine(ctx, sx1, sy1, ex1, ey1, pal.dimLine, 1.05, [], 'DIM');
        cadLine(ctx, sx2, sy2, ex2, ey2, pal.dimLine, 1.05, [], 'DIM');
      }

      const mx = (dx1 + dx2) / 2, my = (dy1 + dy2) / 2;
      const textGap = Math.max(String(labelStr).length * fontSize * 0.68 + 10, 24);

      if (L > textGap + 14) {
        cadLine(ctx, dx1, dy1, mx - ux * (textGap / 2), my - uy * (textGap / 2), pal.dimLine, 1.05, [], 'DIM');
        cadLine(ctx, mx + ux * (textGap / 2), my + uy * (textGap / 2), dx2, dy2, pal.dimLine, 1.05, [], 'DIM');
      } else {
        cadLine(ctx, dx1, dy1, dx2, dy2, pal.dimLine, 1.05, [], 'DIM');
      }

      const aL = Math.min(6.5, L * 0.25), aW = 2.1;
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
    // 4. VIEW 1: #1固床工正視圖 (FRONT VIEW - TOP LEFT, TERRAIN LINE REMOVED!)
    //    Supports independent Left Wing (W_wing_L) and Right Wing (W_wing_R) anchored on Notch CL
    // =========================================================================
    function drawFrontView(ctx, cx, topY, s, p, pal) {
      const W_wing_L = p.W_wing_L * s;   // Left wing top width
      const W_wing_R = p.W_wing_R * s;   // Right wing top width
      const W_top_n = p.W_top_notch * s; // 312 * s
      const W_bot_n = p.W_notch * s;     // 240 * s
      const dx_n = p.dx_notch * s;       // 36 * s
      const B_bot = p.B_bot * s;         // 352 * s

      const H_up = p.H_up * s;           // 120 * s
      const H_low = p.H_low * s;         // 180 * s
      const H_tot = p.H_total * s;       // 300 * s

      // Key X coordinates anchored on Notch Centerline (cx)
      const xNotchTopL = cx - W_top_n / 2;
      const xNotchTopR = cx + W_top_n / 2;
      const xNotchBotL = cx - W_bot_n / 2;
      const xNotchBotR = cx + W_bot_n / 2;
      const xLeftOuter = xNotchTopL - W_wing_L;
      const xRightOuter = xNotchTopR + W_wing_R;

      const xBotL = cx - B_bot / 2;
      const xBotR = cx + B_bot / 2;

      // Key Y coordinates
      const yTop = topY + 45;
      const yMid = yTop + H_up;
      const yBot = yTop + H_tot;

      // Inner U-shaped step offset around the notch (representing the 1:0.3 front batter projection)
      const stepX = p.stx * s;
      const stepY = p.sty * s;

      // 0. Ghost Baseline (Original Dimensions, NO Terrain Line)
      if (showGhost) {
        const gW_tot = 712 * s, gW_wing = 200 * s, gdx = 36 * s, gB_bot = 352 * s;
        const gH_up = 120 * s, gH_tot = 300 * s;
        const gxL = cx - gW_tot / 2, gxR = cx + gW_tot / 2;
        cadPoly(ctx, [
          [gxL, yTop],
          [gxL + gW_wing, yTop],
          [gxL + gW_wing + gdx, yTop + gH_up],
          [gxR - gW_wing - gdx, yTop + gH_up],
          [gxR - gW_wing, yTop],
          [gxR, yTop],
          [gxR, yTop + gH_up],
          [cx + gB_bot / 2, yTop + gH_tot],
          [cx - gB_bot / 2, yTop + gH_tot],
          [gxL, yTop + gH_up]
        ], pal.ghostLine, 1.15, true, null, [5, 4], 'GHOST_FRONT');
      }

      // 1. Main Ground Sill Outer Polygon (Clean structure only, NO terrain lines!)
      cadPoly(ctx, [
        [xLeftOuter, yTop],
        [xNotchTopL, yTop],
        [xNotchBotL, yMid],
        [xNotchBotR, yMid],
        [xNotchTopR, yTop],
        [xRightOuter, yTop],
        [xRightOuter, yMid],
        [xBotR, yBot],
        [xBotL, yBot],
        [xLeftOuter, yMid]
      ], pal.primaryLine, 1.85, true, pal.fillConcrete, [], 'FRONT_OUTLINE');

      // 2. Inner U-shaped step line around the overflow notch (100% matching original Front View)
      cadPoly(ctx, [
        [xNotchTopL - stepX, yTop],
        [xNotchTopL - stepX, yMid + stepY],
        [xNotchTopR + stepX, yMid + stepY],
        [xNotchTopR + stepX, yTop]
      ], pal.primaryLine, 1.45, false, null, [], 'FRONT_NOTCH_STEP');

      // 3. Centerline (CL) with "℄" symbol in the middle
      const clTopY = yTop + 18;
      const clBotY = yBot - 35;
      cadLine(ctx, cx, clTopY, cx, clBotY, pal.primaryLine, 1.25, [], 'CENTERLINE');
      cadText(ctx, 'C', cx - 1.5, clTopY - 4, 13, pal.textMain, 'center', '600');
      cadText(ctx, 'L', cx + 1.5, clTopY + 1, 13, pal.textMain, 'center', '600');

      // 4. All Dimensions on Front View (Independent Left & Right Wing Labels):
      cadDim(ctx, xLeftOuter, yTop, xNotchTopL, yTop, -18, `${p.W_wing_L}`, pal, 12);
      cadDim(ctx, xNotchTopR, yTop, xRightOuter, yTop, -18, `${p.W_wing_R}`, pal, 12);

      // Notch Bottom Width: 240 (inside notch just above yMid)
      cadLine(ctx, xNotchBotL, yMid - 4, xNotchBotL, yMid - 26, pal.dimLine, 1.0);
      cadLine(ctx, xNotchBotR, yMid - 4, xNotchBotR, yMid - 26, pal.dimLine, 1.0);
      cadDim(ctx, xNotchBotL, yMid - 16, xNotchBotR, yMid - 16, 0, `${p.W_notch}`, pal, 12);

      // Notch Left Side Slope Label: "1:0.3"
      const nAng = (Math.atan2(H_up, dx_n) * 180) / Math.PI;
      cadText(ctx, p.notchSlopeStr, (xNotchTopL + xNotchBotL) / 2 + 12, (yTop + yMid) / 2 - 2, 11.5, pal.textMain, 'center', '600', nAng);

      // Left Vertical Height Chain: 120 | 180
      const vDimX = xLeftOuter - 30;
      cadLine(ctx, xLeftOuter - 18, yTop, xLeftOuter - 42, yTop, pal.dimLine, 1.05);
      cadLine(ctx, xLeftOuter - 18, yMid, xLeftOuter - 42, yMid, pal.dimLine, 1.05);
      cadLine(ctx, xLeftOuter - 18, yBot, xLeftOuter - 42, yBot, pal.dimLine, 1.05);
      cadDim(ctx, vDimX, yTop, vDimX, yMid, 0, `${p.H_up}`, pal, 12);
      cadDim(ctx, vDimX, yMid, vDimX, yBot, 0, `${p.H_low}`, pal, 12);

      // Bottom Width: 352
      cadDim(ctx, xBotL, yBot, xBotR, yBot, 28, `${p.B_bot}`, pal, 12);

      // 5. Right Callout: "簡易模板" pointing to right vertical wing end face
      const smKneeX = xRightOuter + 42;
      const smKneeY = yTop - 2;
      cadLine(ctx, smKneeX, smKneeY, smKneeX + 58, smKneeY, pal.leaderLine, 1.15);
      cadArrow(ctx, smKneeX, smKneeY, xRightOuter, yTop + H_up * 0.52, pal.leaderLine, 1.15);
      cadText(ctx, '簡易模板', smKneeX + 29, smKneeY - 9, 12.5, pal.textMain, 'center', '600');

      // Title below Front View
      const titleY = yBot + 72;
      drawDoubleUnderlineTitle(ctx, `${p.title_tag}正視圖`, cx, titleY, 15.5, pal);

      return {
        xLeftOuter,
        xRightOuter,
        yTop,
        yMid,
        yBot,
        bottomY: titleY + 24
      };
    }

    // =========================================================================
    // 5. VIEW 2: #1固床工俯視圖 (PLAN VIEW - BOTTOM LEFT, 1:1 ALIGNED WITH FRONT VIEW!)
    //    Supports independent Left/Right Wing Widths (W_wing_L / W_wing_R) & Depths (D_wing_L / D_wing_R)
    // =========================================================================
    function drawPlanView(ctx, cx, topY, s, p, pal) {
      const W_wing_L = p.W_wing_L * s;
      const W_wing_R = p.W_wing_R * s;
      const W_top_n = p.W_top_notch * s; // 312 * s
      const W_bot_n = p.W_notch * s;     // 240 * s
      const B_bot = p.B_bot * s;         // 352 * s

      const T_top = p.T_top * s;         // 30 * s
      const T_mid = p.T_mid * s;         // 66 * s
      const T_bot = p.T_bot * s;         // 120 * s
      const D_wing_L = p.D_wing_L * s;   // Left wing depth (56 * s)
      const D_wing_R = p.D_wing_R * s;   // Right wing depth (56 * s)

      // Key X coordinates (Strictly 1:1 aligned with Front View above via Notch Centerline cx!)
      const xNotchTopL = cx - W_top_n / 2;
      const xNotchTopR = cx + W_top_n / 2;
      const xNotchBotL = cx - W_bot_n / 2;
      const xNotchBotR = cx + W_bot_n / 2;
      const xLeftOuter = xNotchTopL - W_wing_L;
      const xRightOuter = xNotchTopR + W_wing_R;

      const xBotL = cx - B_bot / 2;
      const xBotR = cx + B_bot / 2;

      // Key Y coordinates (Upstream vertical face is at top y0, Downstream toe is at yBot = y0 + T_bot)
      const y0 = topY + 42;               // Upstream vertical back face
      const yCrest = y0 + T_top;          // 30cm crest line
      const yWingToeL = y0 + D_wing_L;    // Left outer wing toe
      const yWingToeR = y0 + D_wing_R;    // Right outer wing toe
      const yNotchMid = y0 + T_mid;       // 66cm notch invert downstream edge
      const yBot = y0 + T_bot;            // 120cm bottom base downstream edge

      // 1. Outer Polygon of Plan View
      cadPoly(ctx, [
        [xLeftOuter, y0],
        [xRightOuter, y0],
        [xRightOuter, yWingToeR],
        [xBotR, yBot],
        [xBotL, yBot],
        [xLeftOuter, yWingToeL]
      ], pal.primaryLine, 1.85, true, pal.fillConcrete, [], 'PLAN_OUTLINE');

      // 2. Top Crest Line (width 30cm across full length, stepping down inside notch)
      cadLine(ctx, xLeftOuter, yCrest, xRightOuter, yCrest, pal.primaryLine, 1.5, [], 'PLAN_CREST');

      // 3. Overflow Notch Trapezoid & Sloped Cheek Faces in Plan View:
      cadLine(ctx, xNotchTopL, y0, xNotchTopL, yCrest, pal.primaryLine, 1.5, [], 'PLAN_NOTCH');
      cadLine(ctx, xNotchTopR, y0, xNotchTopR, yCrest, pal.primaryLine, 1.5, [], 'PLAN_NOTCH');

      cadLine(ctx, xNotchBotL, y0, xNotchBotL, yNotchMid, pal.primaryLine, 1.5, [], 'PLAN_NOTCH');
      cadLine(ctx, xNotchBotR, y0, xNotchBotR, yNotchMid, pal.primaryLine, 1.5, [], 'PLAN_NOTCH');

      cadLine(ctx, xNotchTopL, yCrest, xNotchBotL, yNotchMid, pal.primaryLine, 1.5, [], 'PLAN_NOTCH_SLOPE');
      cadLine(ctx, xNotchTopR, yCrest, xNotchBotR, yNotchMid, pal.primaryLine, 1.5, [], 'PLAN_NOTCH_SLOPE');

      cadLine(ctx, xNotchBotL, yNotchMid, xNotchBotR, yNotchMid, pal.primaryLine, 1.5, [], 'PLAN_NOTCH_INV');

      // 4. All Dimensions on Plan View (Independent Left & Right Wings):
      // Top Dimension Chain: | W_wing_L | --- 312 --- | W_wing_R |
      cadDim(ctx, xLeftOuter, y0, xNotchTopL, y0, -18, `${p.W_wing_L}`, pal, 12);
      cadDim(ctx, xNotchTopL, y0, xNotchTopR, y0, -18, `${p.W_top_notch}`, pal, 12);
      cadDim(ctx, xNotchTopR, y0, xRightOuter, y0, -18, `${p.W_wing_R}`, pal, 12);

      // Crest Width Callout "30" on Left Wing
      const c30X = xLeftOuter + W_wing_L * 0.65;
      cadArrow(ctx, c30X, y0 - 16, c30X, y0, pal.dimLine, 1.05);
      cadArrow(ctx, c30X, yCrest + 16, c30X, yCrest, pal.dimLine, 1.05);
      cadText(ctx, `${p.T_top}`, c30X, (y0 + yCrest) / 2, 11, pal.dimText, 'center', '700');

      // Left Vertical Thickness Dimensions: D_wing_L and 120
      cadDim(ctx, xLeftOuter, y0, xLeftOuter, yWingToeL, -22, `${p.D_wing_L}`, pal, 11.5);
      cadDim(ctx, xLeftOuter - 24, y0, xLeftOuter - 24, yBot, -22, `${p.T_bot}`, pal, 11.5);

      // If Right Wing Depth differs from Left Wing Depth, also show D_wing_R on the right end
      if (p.D_wing_R !== p.D_wing_L) {
        cadDim(ctx, xRightOuter, y0, xRightOuter, yWingToeR, 22, `${p.D_wing_R}`, pal, 11.5);
      }

      // Internal Notch Bottom Width: 240
      const dim240Y = yNotchMid + (yBot - yNotchMid) * 0.42;
      cadLine(ctx, xNotchBotL, yNotchMid + 4, xNotchBotL, dim240Y + 6, pal.dimLine, 1.0);
      cadLine(ctx, xNotchBotR, yNotchMid + 4, xNotchBotR, dim240Y + 6, pal.dimLine, 1.0);
      cadDim(ctx, xNotchBotL, dim240Y, xNotchBotR, dim240Y, 0, `${p.W_notch}`, pal, 11.5);

      // Bottom Width: 352
      cadDim(ctx, xBotL, yBot, xBotR, yBot, 24, `${p.B_bot}`, pal, 12);

      // Title below Plan View
      const titleY = yBot + 62;
      drawDoubleUnderlineTitle(ctx, `${p.title_tag}俯視圖`, cx, titleY, 15.5, pal);

      return {
        bottomY: titleY + 25
      };
    }

    // =========================================================================
    // 6. VIEW 3: #1固床工側視圖 (SIDE VIEW - TOP RIGHT, WITH REBAR & CALLOUTS)
    //    100% Faithful to Original Side View:
    //    - Top width: 30, Middle width (at depth 120): 66, Base width (at depth 300): 120
    //    - Left height chain: 120 | 180
    //    - Left battered face: two "1:0.3" slope labels (upper & lower)
    //    - Horizontal line at depth 120 separating upper wing & lower sill body
    //    - Back vertical rebar (∮16@30cm) with top 180° hook and bottom horizontal leg
    //    - Inner distribution rebar dots (∮13@30cm) with circled target callout
    //    - Callouts: 軀體模板, ∮16@30cm, ∮13@30cm, 造型模板, 210kgf/cm²混凝土
    // =========================================================================
    function drawSideView(ctx, ox, topY, s, p, pal) {
      const H_up = p.H_up * s;     // 120 * s
      const H_low = p.H_low * s;   // 180 * s
      const H_tot = p.H_total * s; // 300 * s

      const T_top = p.T_top * s;   // 30 * s
      const T_mid = p.T_mid * s;   // 66 * s
      const T_bot = p.T_bot * s;   // 120 * s

      const yTop = topY + 45;
      const yMid = yTop + H_up;
      const yBot = yTop + H_tot;

      // Vertical back face on the right at xBack, battered front face sloping down-left
      const xBack = ox + T_bot + 75;
      const xTopFront = xBack - T_top;
      const xMidFront = xBack - T_mid;
      const xBotFront = xBack - T_bot;

      // 0. Ghost Baseline
      if (showGhost) {
        const gT_top = 30 * s, gT_bot = 120 * s, gH_tot = 300 * s;
        cadPoly(ctx, [
          [xBack - gT_top, yTop],
          [xBack, yTop],
          [xBack, yTop + gH_tot],
          [xBack - gT_bot, yTop + gH_tot]
        ], pal.ghostLine, 1.15, true, null, [5, 4], 'GHOST_SIDE');
      }

      // 1. Main Side Section Trapezoid Outline
      cadPoly(ctx, [
        [xTopFront, yTop],
        [xBack, yTop],
        [xBack, yBot],
        [xBotFront, yBot]
      ], pal.primaryLine, 1.85, true, pal.fillConcrete, [], 'SIDE_OUTLINE');

      // 2. Horizontal Dividing Line at Notch Invert Level (yMid, width = 66)
      cadLine(ctx, xMidFront, yMid, xBack, yMid, pal.primaryLine, 1.5, [], 'SIDE_MID_LINE');

      // 3. Rebar System inside Side View (100% matching original):
      //    - Vertical L-bar along right back face & bottom base (∮16@30cm) with top 180° hook
      //    - 10 horizontal distribution rebar dots (∮13@30cm) along the vertical bar & base bar
      const cov = p.cov * s;
      const rbX = xBack - cov;
      const rbTopY = yTop + cov;
      const rbBotY = yBot - cov;
      const rbLeftX = xBotFront + p.lge * s;

      // Main L-bar (∮16@30cm)
      cadLine(ctx, rbX, rbTopY, rbX, rbBotY, pal.rebarLine, 1.5, [], 'REBAR_16');
      cadLine(ctx, rbX, rbBotY, rbLeftX, rbBotY, pal.rebarLine, 1.5, [], 'REBAR_16');
      // Top 180-deg hook on left of rbX
      const hkW = p.hkw * s, hkL = p.hkl * s;
      cadPoly(ctx, [
        [rbX, rbTopY],
        [rbX - hkW, rbTopY],
        [rbX - hkW, rbTopY + hkL]
      ], pal.rebarLine, 1.4, false, null, [], 'REBAR_HOOK');

      // Distribution rebar dots (∮13@30cm) along vertical back bar
      const nVertDots = Math.max(6, Math.round(p.H_total / p.rebar_sp) - 1);
      let highlightedDotY = rbTopY + (rbBotY - rbTopY) * 0.68;
      for (let i = 0; i <= nVertDots; i++) {
        const py = rbTopY + 12 * s + (i / nVertDots) * (rbBotY - rbTopY - 18 * s);
        if (i === Math.floor(nVertDots * 0.65)) highlightedDotY = py;
        cadCircle(ctx, rbX - 2.4, py, 1.9, pal.rebarDot, 1.0, pal.rebarDot, 'REBAR_13_DOT');
      }
      // Emphasized double circle around the target ∮13@30cm dot (matching original drawing!)
      cadCircle(ctx, rbX - 2.4, highlightedDotY, 4.8, pal.primaryLine, 1.25, null, 'REBAR_TARGET');

      // Distribution rebar dots along bottom horizontal leg
      for (let i = 1; i <= p.nLeg; i++) {
        const px = rbLeftX + (i / (p.nLeg + 1)) * (rbX - rbLeftX);
        cadCircle(ctx, px, rbBotY - 2.4, 1.9, pal.rebarDot, 1.0, pal.rebarDot, 'REBAR_13_DOT');
      }

      // 4. All Dimensions on Side View:
      // Top Crest Width: 30
      cadLine(ctx, xTopFront, yTop - 4, xTopFront, yTop - 24, pal.dimLine, 1.05);
      cadLine(ctx, xBack, yTop - 4, xBack, yTop - 24, pal.dimLine, 1.05);
      cadArrow(ctx, xTopFront - 18, yTop - 14, xTopFront, yTop - 14, pal.dimLine, 1.05);
      cadArrow(ctx, xBack + 18, yTop - 14, xBack, yTop - 14, pal.dimLine, 1.05);
      cadText(ctx, `${p.T_top}`, (xTopFront + xBack) / 2, yTop - 14, 11.5, pal.dimText, 'center', '700');

      // Middle Width (66) just above yMid
      const dim66Y = yMid - 14;
      cadArrow(ctx, xMidFront - 18, dim66Y, xMidFront, dim66Y, pal.dimLine, 1.05);
      cadArrow(ctx, xBack + 18, dim66Y, xBack, dim66Y, pal.dimLine, 1.05);
      cadText(ctx, `${p.T_mid}`, (xMidFront + xBack) / 2, dim66Y, 11.5, pal.dimText, 'center', '700');

      // Bottom Width: 120
      cadDim(ctx, xBotFront, yBot, xBack, yBot, 28, `${p.T_bot}`, pal, 12);

      // Left Vertical Height Chain: 120 | 180
      const sDimX = xBotFront - 18;
      cadLine(ctx, xBotFront - 6, yTop, sDimX - 10, yTop, pal.dimLine, 1.05);
      cadLine(ctx, xBotFront - 6, yMid, sDimX - 10, yMid, pal.dimLine, 1.05);
      cadLine(ctx, xBotFront - 6, yBot, sDimX - 10, yBot, pal.dimLine, 1.05);
      cadDim(ctx, sDimX, yTop, sDimX, yMid, 0, `${p.H_up}`, pal, 12);
      cadDim(ctx, sDimX, yMid, sDimX, yBot, 0, `${p.H_low}`, pal, 12);

      // Two "1:0.3" Slope Labels along Upper and Lower Front Battered Face
      const fAng = -(Math.atan2(H_up, (T_mid - T_top)) * 180) / Math.PI;
      cadText(ctx, p.frontSlopeStr, (xTopFront + xMidFront) / 2 - 11, (yTop + yMid) / 2 - 2, 11.5, pal.textMain, 'center', '600', fAng);
      cadText(ctx, p.frontSlopeStr, (xMidFront + xBotFront) / 2 - 11, (yMid + yBot) / 2 - 18, 11.5, pal.textMain, 'center', '600', fAng);

      // 5. All Callout Leaders on Side View (100% Matching Original):
      // (a) Left: 造型模板 -> pointing to lower 1:0.3 sloped face
      const stTargetX = xMidFront - (xMidFront - xBotFront) * 0.52;
      const stTargetY = yMid + H_low * 0.52;
      const stKneeX = stTargetX - 26;
      const stKneeY = stTargetY - 16;
      cadLine(ctx, stKneeX - 48, stKneeY, stKneeX, stKneeY, pal.leaderLine, 1.15);
      cadArrow(ctx, stKneeX, stKneeY, stTargetX, stTargetY, pal.leaderLine, 1.15);
      cadText(ctx, '造型模板', stKneeX - 24, stKneeY - 9, 12, pal.textMain, 'center', '600');

      // (b) Bottom-Left: 210kgf/cm²混凝土 -> pointing inside lower concrete body
      const cnTargetX = xBotFront + T_bot * 0.36;
      const cnTargetY = yBot - 38;
      const cnKneeX = xBotFront + 4;
      const cnKneeY = yBot + 15;
      cadLine(ctx, cnKneeX - 18, cnKneeY, cnKneeX, cnKneeY, pal.leaderLine, 1.15);
      cadLine(ctx, cnKneeX, cnKneeY, cnTargetX, cnTargetY, pal.leaderLine, 1.15);
      cadText(ctx, '210kgf/cm²混凝土', cnKneeX - 22, cnKneeY, 12, pal.textMain, 'right', '600');

      // (c) Right 1: 軀體模板 -> pointing to vertical back face
      const bdY = yMid + H_low * 0.16;
      cadArrow(ctx, xBack + 86, bdY, xBack, bdY, pal.leaderLine, 1.15);
      cadText(ctx, '軀體模板', xBack + 84, bdY - 9, 12, pal.textMain, 'right', '600');

      // (d) Right 2: ∮16@30cm -> pointing to vertical rebar line
      const r16Y = yMid + H_low * 0.36;
      const r16KneeX = xBack + 28;
      const r16KneeY = r16Y + 8;
      cadLine(ctx, rbX, r16Y, r16KneeX, r16KneeY, pal.leaderLine, 1.15);
      cadLine(ctx, r16KneeX, r16KneeY, r16KneeX + 62, r16KneeY, pal.leaderLine, 1.15);
      cadText(ctx, `∮16@${p.rebar_sp}cm`, r16KneeX + 31, r16KneeY - 9, 12, pal.textMain, 'center', '600');

      // (e) Right 3: ∮13@30cm -> pointing to the circled distribution rebar dot
      const r13KneeX = xBack + 28;
      const r13KneeY = highlightedDotY + 8;
      cadLine(ctx, rbX - 2.4, highlightedDotY, r13KneeX, r13KneeY, pal.leaderLine, 1.15);
      cadLine(ctx, r13KneeX, r13KneeY, r13KneeX + 62, r13KneeY, pal.leaderLine, 1.15);
      cadText(ctx, `∮13@${p.rebar_sp}cm`, r13KneeX + 31, r13KneeY - 9, 12, pal.textMain, 'center', '600');

      // Title below Side View
      const titleY = yBot + 72;
      drawDoubleUnderlineTitle(ctx, `${p.title_tag}側視圖`, (xBotFront + xBack) / 2, titleY, 15.5, pal);

      return {
        rightX: xBack + 115,
        bottomY: titleY + 24
      };
    }

    // =========================================================================
    // 7. VIEW 4: ON-SHEET QUANTITY SUMMARY TABLE (固床工每座工程數量計算表)
    // =========================================================================
    function drawQuantityTable(ctx, ox, oy, p, pal) {
      cadText(ctx, `${p.title_tag}每座工程數量計算式表`, ox, oy - 12, 13.5, pal.textMain, 'left', '700');

      const colW = [135, 195, 65, 45];
      const rowH = 24;
      const rows = [
        ['工項名稱', '參數連動計算式 (m / m² / kg)', '每座數量', '單位'],
        ['210kgf/cm²混凝土', p.concFormula, p.concVol.toFixed(2), 'm³'],
        ['造型模板 (下游斜坡)', `正面斜坡面積 × √(1+${p.m_front}²)`, p.formStyled.toFixed(2), 'm²'],
        ['軀體模板 (上游垂直)', `上游垂直背面積合計`, p.formBody.toFixed(2), 'm²'],
        ['簡易模板 (兩側翼端)', `兩側端面厚 × 邊長`, p.formSimple.toFixed(2), 'm²'],
        [`鋼筋 ∮16@${p.rebar_sp}cm`, `主筋 L型 × 1.56 kg/m`, p.rebar16Kg.toFixed(1), 'kg'],
        [`鋼筋 ∮13@${p.rebar_sp}cm`, `橫向分布筋 × 0.995 kg/m`, p.rebar13Kg.toFixed(1), 'kg']
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
      ], pal.primaryLine, 1.4, true, null, [], 'QTY_TABLE');

      for (let r = 1; r < rows.length; r++) {
        cadLine(ctx, ox, oy + r * rowH, ox + totW, oy + r * rowH, pal.tableBorder, 0.95, [], 'QTY_TABLE');
      }

      let vx = ox;
      for (let c = 0; c < colW.length - 1; c++) {
        vx += colW[c];
        cadLine(ctx, vx, oy, vx, oy + totH, pal.tableBorder, 0.95, [], 'QTY_TABLE');
      }

      for (let r = 0; r < rows.length; r++) {
        let cx = ox;
        const ry = oy + (r + 0.5) * rowH;
        for (let c = 0; c < colW.length; c++) {
          const cw = colW[c];
          const isHeader = r === 0;
          const align = (c === 0 || c === 1) && !isHeader ? 'left' : 'center';
          const tx = align === 'left' ? cx + 7 : cx + cw / 2;
          const color = isHeader ? pal.textMain : (c === 2 ? pal.dimText : pal.textSub);
          cadText(ctx, rows[r][c], tx, ry, isHeader ? 11.5 : 11, color, align, isHeader || c === 2 ? '700' : '500', 0, 'TABLE_TEXT');
          cx += cw;
        }
      }
    }

    // =========================================================================
    // 8. MAIN RENDER ENGINE & DYNAMIC BOUNDING-BOX ANTI-OVERLAP LAYOUT
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
      document.getElementById('stat_W_top').textContent = `${p.W_top_notch} cm`;
      document.getElementById('stat_T_mid_bot').textContent = `${p.T_mid} / ${p.T_bot} cm`;
      document.getElementById('stat_conc_unit').textContent = `${p.concVol.toFixed(2)} m³`;
      document.getElementById('stat_rebar_unit').textContent = `${p.rebarTotalKg.toFixed(1)} kg`;
      document.getElementById('stat_form_unit').textContent = `${p.formTotal.toFixed(2)} m²`;
      document.getElementById('zoom-indicator').textContent = `${Math.round(viewCam.scale * 100)}%`;

      dxfEntities = [];

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.fillStyle = pal.bg;
      ctx.fillRect(0, 0, rect.width, rect.height);

      ctx.translate(viewCam.offsetX, viewCam.offsetY);
      ctx.scale(viewCam.scale, viewCam.scale);

      const s = 0.72; // Base drawing scale: 1 cm = 0.72 px
      const frontCenterX = 95 + (p.W_wing_L + p.W_top_notch / 2) * s;

      if (currentView === 'FRONT_PLAN') {
        const bFront = drawFrontView(ctx, frontCenterX, 15, s, p, pal);
        drawPlanView(ctx, frontCenterX, bFront.bottomY + 35, s, p, pal);
      } else if (currentView === 'SIDE_ONLY') {
        const bSide = drawSideView(ctx, 180, 20, s * 1.35, p, pal);
        drawQuantityTable(ctx, 560, 65, p, pal);
      } else {
        // 'ALL' Standard Sheet Layout (100% Matching Original Layout, with Dynamic Bounding-Box Margin):
        // - Top-Left: #1固床工正視圖 (Terrain lines removed!)
        // - Bottom-Left (1:1 Vertically Aligned with Front View): #1固床工俯視圖
        // - Top-Right (Aligned horizontally with Front View): #1固床工側視圖
        // - Bottom-Right: 固床工每座工程數量計算式表
        const bFront = drawFrontView(ctx, frontCenterX, 15, s, p, pal);
        const planTopY = bFront.bottomY + 38;
        drawPlanView(ctx, frontCenterX, planTopY, s, p, pal);

        const sideStartX = bFront.xRightOuter + Math.max(155, p.W_total * s * 0.22);
        const bSide = drawSideView(ctx, sideStartX, 15, s, p, pal);

        const tblStartX = sideStartX - 30;
        const tblStartY = Math.max(planTopY + 35, bSide.bottomY + 42);
        drawQuantityTable(ctx, tblStartX, tblStartY, p, pal);
      }

      ctx.restore();
    }

    // =========================================================================
    // 9. UI CONTROLS, CAMERA INTERACTION & DXF / CSV EXPORTERS
    // =========================================================================
    function onParamChange() {
      // Lock camera view when editing parameters!
      renderAll();
    }

    function applyPreset(mode) {
      const cfg = ORIG_SILL;
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
        FRONT_PLAN: document.getElementById('tab-front-plan'),
        SIDE_ONLY: document.getElementById('tab-side'),
        AUDIT: document.getElementById('tab-audit')
      };
      Object.keys(tabs).forEach(k => {
        if (!tabs[k]) return;
        tabs[k].className = (k === view)
          ? 'px-3 py-1.5 rounded-md text-xs font-semibold transition-all bg-cyan-600 text-white shadow'
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
      if (currentView === 'FRONT_PLAN') {
        viewCam.scale = Math.min(rect.width / 820, rect.height / 680) * 0.92;
        viewCam.offsetX = Math.max(30, (rect.width - 720 * viewCam.scale) / 2);
        viewCam.offsetY = 24;
      } else if (currentView === 'SIDE_ONLY') {
        viewCam.scale = Math.min(rect.width / 1080, rect.height / 580) * 0.92;
        viewCam.offsetX = 40;
        viewCam.offsetY = 30;
      } else {
        viewCam.scale = Math.min(rect.width / 1280, rect.height / 690) * 0.93;
        viewCam.offsetX = Math.max(25, (rect.width - 1220 * viewCam.scale) / 2);
        viewCam.offsetY = 20;
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
      a.download = `${p.title_tag}_標準圖_W${p.W_notch}xH${p.H_total}_無地形線.dxf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }

    function exportCSV() {
      const p = getParams();
      const rows = [
        [`${p.title_tag} 標準圖 - 參數化尺寸與工程數量計算書 (已移除自然地形線・支援左右獨立輸入)`],
        ['參數項目', '設定/推算數值', '單位', '備註與幾何關係'],
        ['左側翼牆頂寬 W_wing_L', p.W_wing_L, 'cm', '原圖標準 200cm (可獨立調整)'],
        ['右側翼牆頂寬 W_wing_R', p.W_wing_R, 'cm', '原圖標準 200cm (可獨立調整)'],
        ['溢流口底寬 W_notch', p.W_notch, 'cm', '原圖標準 240cm'],
        ['溢流口頂寬 W_top_notch', p.W_top_notch, 'cm', `自動推算 = ${p.W_notch} + 2×(${p.H_up}×${p.m_notch}) = 312cm`],
        ['固床工頂部總寬 W_total', p.W_total, 'cm', `${p.W_wing_L} + ${p.W_top_notch} + ${p.W_wing_R} = ${p.W_total}cm`],
        ['固床工底部寬 B_bot', p.B_bot, 'cm', '原圖標準 352cm'],
        ['左側翼牆端面折深 D_wing_L', p.D_wing_L, 'cm', '原圖標準 56cm (可獨立調整)'],
        ['右側翼牆端面折深 D_wing_R', p.D_wing_R, 'cm', '原圖標準 56cm (可獨立調整)'],
        ['上部溢流深 H_up', p.H_up, 'cm', '原圖標準 120cm'],
        ['下部基礎深 H_low', p.H_low, 'cm', '原圖標準 180cm'],
        ['頂部冠寬 T_top', p.T_top, 'cm', '原圖標準 30cm'],
        ['溢流口底高程處厚 T_mid', p.T_mid, 'cm', `自動推算 = ${p.T_top} + ${p.H_up}×${p.m_front} = 66cm`],
        ['基底厚度 T_bot', p.T_bot, 'cm', `自動推算 = ${p.T_top} + ${p.H_total}×${p.m_front} = 120cm`],
        [],
        ['【每座工程數量計算表】', '計算式說明', '每座數量', '單位', `全案合計 (${p.N_units}座)`],
        ['210kgf/cm²混凝土', p.concFormula, p.concVol.toFixed(2), 'm³', (p.concVol * p.N_units).toFixed(2)],
        ['造型模板 (下游1:0.3斜坡面)', '正面斜坡面積', p.formStyled.toFixed(2), 'm²', (p.formStyled * p.N_units).toFixed(2)],
        ['軀體模板 (上游垂直背面)', '上游垂直背面積', p.formBody.toFixed(2), 'm²', (p.formBody * p.N_units).toFixed(2)],
        ['簡易模板 (兩側翼端面)', '左右兩側翼牆端面面積', p.formSimple.toFixed(2), 'm²', (p.formSimple * p.N_units).toFixed(2)],
        [`鋼筋 ∮16@${p.rebar_sp}cm`, '上游背側與基底 L型主筋', p.rebar16Kg.toFixed(1), 'kg', (p.rebar16Kg * p.N_units).toFixed(1)],
        [`鋼筋 ∮13@${p.rebar_sp}cm`, '橫向分布點筋', p.rebar13Kg.toFixed(1), 'kg', (p.rebar13Kg * p.N_units).toFixed(1)]
      ];

      const csvContent = '\uFEFF' + rows.map(r => r.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${p.title_tag}_工程數量計算書.csv`;
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
  

  const __num = (id, d) => { const v = parseFloat(el(id).value); return Number.isFinite(v) ? v : d; };
  const __P1 = getParams;
  getParams = function () { if (String(el('p_LReq').value) !== '0') { const L = el('inp_W_wing_L').value, D = el('inp_D_wing_L').value; RR = Object.assign({}, RR, { inp_W_wing_R: L, inp_D_wing_R: D }); }
    const p = __P1(); p.N_units = 1; p.title_tag = RR && RR.__tag ? String(RR.__tag) : '#1固床工';
    Object.assign(p, { cov: __num('p_cov', 5), lge: __num('p_lge', 7), hkw: __num('p_hkw', 4.5), hkl: __num('p_hkl', 9), w16: __num('p_w16', 1.56), w13: __num('p_w13', 0.995), stx: __num('p_stx', 16), sty: __num('p_sty', 24) });
    p.nLeg = Math.max(1, Math.round((p.T_bot - p.cov - p.lge) / p.rebar_sp) - 1); p.nVd = Math.max(6, Math.round(p.H_total / p.rebar_sp) - 1) + 1; return p; };
  function __geo1(p) {   // 依三視圖幾何（cm）：x＝溢流口中心線起算（右岸＋），z＝自頂向下
    const Wt = p.W_top_notch, xLo = -(p.W_wing_L + Wt / 2), xHi = p.W_wing_R + Wt / 2, bL = -p.B_bot / 2, bR = p.B_bot / 2, Hu = p.H_up, Ht = p.H_total, Hl = p.H_low;
    const T = z => p.T_top + (p.T_bot - p.T_top) * z / Ht, hn = z => Wt / 2 - p.dx_notch * z / Hu;
    const Tp = x => x < bL ? p.D_wing_L + (p.T_bot - p.D_wing_L) * (x - xLo) / (bL - xLo) : x > bR ? p.D_wing_R + (p.T_bot - p.D_wing_R) * (xHi - x) / (xHi - bR) : Infinity;
    const dTp = x => x < bL ? (p.T_bot - p.D_wing_L) / (bL - xLo) : x > bR ? (p.T_bot - p.D_wing_R) / (xHi - bR) : 0;
    const xl = z => z <= Hu ? xLo : xLo + (bL - xLo) * (z - Hu) / Hl, xr = z => z <= Hu ? xHi : xHi + (bR - xHi) * (z - Hu) / Hl;
    const inside = (x, z) => x >= xl(z) && x <= xr(z) && !(z < Hu && Math.abs(x) < hn(z));
    const th = (x, z) => Math.min(T(z), Tp(x)), kS = Math.hypot(1, (p.T_bot - p.T_top) / Ht);
    const G = { V: 0, Af: 0, Ads: 0, xLo, xHi, T, Tp, kS };
    const d = 1, nx = Math.ceil((xHi - xLo) / d), nz = Math.ceil(Ht / d);
    for (let j = 0; j < nz; j++) { const z = (j + 0.5) * Ht / nz, dz = Ht / nz;
      for (let i = 0; i < nx; i++) { const x = xLo + (i + 0.5) * (xHi - xLo) / nx, dx = (xHi - xLo) / nx; if (!inside(x, z)) continue;
        const a = dx * dz, t = th(x, z); G.V += a * t; G.Af += a; G.Ads += a * (T(z) <= Tp(x) ? kS : Math.hypot(1, dTp(x))); } }
    // 兩端模板：上段翼端直立面＋下段斜邊（底面不計）
    let Ae = 0; const n = 200;
    [[xLo, bL, 1], [xHi, bR, -1]].forEach(([xo, xb]) => { for (let k = 0; k < n; k++) { const z = (k + 0.5) * Hu / n; Ae += th(xo, z) * Hu / n; }
      const L = Math.hypot(xb - xo, Hl); for (let k = 0; k < n; k++) { const f = (k + 0.5) / n, x = xo + (xb - xo) * f, z = Hu + Hl * f; Ae += th(x, z) * L / n; } });
    G.Ae = Ae;
    // 鋼筋（依側視圖配筋型式，沿正視圖寬度每 sp 一支）
    const c = p.cov, sp = p.rebar_sp; let n16 = 0, L16 = 0;
    for (let x = xLo + c; x <= xHi - c + 1e-6; x += sp) {
      const ax = Math.abs(x), zt = ax <= p.W_notch / 2 ? Hu : ax < Wt / 2 ? (Wt / 2 - ax) * Hu / p.dx_notch : 0;
      const zb = x >= bL && x <= bR ? Ht : x < bL ? Hu + Hl * (x - xLo) / (bL - xLo) : Hu + Hl * (xHi - x) / (xHi - bR);
      const lv = zb - zt - 2 * c; if (lv <= 0) continue; const leg = Math.max(0, th(x, zb) - c - p.lge); n16++; L16 += lv + leg + p.hkw + p.hkl; }
    let L13 = 0; const nV = p.nVd;
    for (let k = 0; k < nV; k++) { const z = c + 12 + k * (Ht - 2 * c - 18) / Math.max(1, nV - 1); let w = xr(z) - xl(z) - 2 * c; if (z < Hu) w -= 2 * hn(z) + 2 * c; L13 += Math.max(0, w); }
    L13 += p.nLeg * Math.max(0, p.B_bot - 2 * c);
    Object.assign(G, { n16, L16, L13, nV }); return G;
  }
  function computeQuantities(p) {
    const G = __geo1(p), f = (v, n) => (+v).toFixed(n === undefined ? 2 : n), rows = [];
    rows.push({ no: '1', name: '210kgf/cm²混凝土', unit: 'm³', formula: `∫∫厚度 dA（厚＝min(側視, 俯視)，見註記）`, qty: +(G.V / 1e6).toFixed(3), note: `冠寬 ${p.T_top}→中 ${p.T_mid}→底 ${p.T_bot} cm` });
    rows.push({ no: '2', name: '造型模板（下游斜坡面）', unit: 'm²', formula: `正視面積 × √(1+m²)（翼牆折角處依俯視斜面）`, qty: +(G.Ads / 1e4).toFixed(2), note: `前坡 1:${p.m_front}` });
    rows.push({ no: '3', name: '軀體模板（上游直立面）', unit: 'm²', formula: `正視圖輪廓面積 ${f(G.Af / 1e4, 3)} m²`, qty: +(G.Af / 1e4).toFixed(2), note: '' });
    rows.push({ no: '4', name: '簡易模板（兩側翼端面）', unit: 'm²', formula: `翼端直立面＋下段斜邊 × 該處厚度（兩側）`, qty: +(G.Ae / 1e4).toFixed(2), note: `折深 左${p.D_wing_L}／右${p.D_wing_R}` });
    rows.push({ no: '5', name: `鋼筋 ∮16@${p.rebar_sp}cm（主筋 L 型）`, unit: 'kg', formula: `${G.n16} 支 共 ${f(G.L16 / 100, 1)} m × ${p.w16} kg/m`, qty: +(G.L16 / 100 * p.w16).toFixed(1), note: '依原圖配筋表' });
    rows.push({ no: '6', name: `鋼筋 ∮13@${p.rebar_sp}cm（橫向分布筋）`, unit: 'kg', formula: `立面 ${G.nV} 列＋底腳 ${p.nLeg} 列 共 ${f(G.L13 / 100, 1)} m × ${p.w13} kg/m`, qty: +(G.L13 / 100 * p.w13).toFixed(1), note: '依原圖配筋表' });
    return rows;
  }
  function updateSidebarUI() { }
  const PAL = getPalette();
  function __draw(p) {
    const rows = computeQuantities(p), G = __geo1(p), f = (v, n) => (+v).toFixed(n === undefined ? 2 : n);
    const bF = drawFrontView(CTX, 0, 0, 1, p, PAL), planTop = bF.bottomY + 38; drawPlanView(CTX, 0, planTop, 1, p, PAL);
    const sideX = bF.xRightOuter + Math.max(155, p.W_total * 0.22); drawSideView(CTX, sideX, 0, 1, p, PAL);
    // 補標註（量測值）
    cadText(CTX, `正視面積 ${f(G.Af / 1e4, 3)} m²；體積 ${f(G.V / 1e6, 3)} m³`, 0, (bF.yMid + bF.yBot) / 2 + 30, 12, '#fde047', 'center', '600', 0, 'DIM_TEXT');
    cadText(CTX, `溢流口頂寬 ${p.W_top_notch}＝${p.W_notch}＋2×${p.dx_notch}`, 0, bF.yTop - 40, 12, '#fde047', 'center', '600', 0, 'DIM_TEXT');
    const xB = sideX + p.T_bot + 75; cadText(CTX, `下游斜面長 ${f(Math.hypot(p.H_total, p.T_bot - p.T_top), 1)}`, xB - p.T_bot - 20, p.H_total + 45 + 50, 12, '#fde047', 'right', '600', 0, 'DIM_TEXT');
    // 數量表
    const tx = sideX - 30, ty = Math.max(planTop + 35, p.H_total + 45 + 120), cw = [190, 330, 70, 45], rh = 24, H = ['工項名稱', '計算式（依圖面幾何）', '數量', '單位'];
    cadText(CTX, `${p.title_tag}每座工程數量計算式表`, tx, ty - 12, 13.5, PAL.textMain, 'left', '700', 0, 'TABLE_TEXT');
    const tw = cw.reduce((a, b) => a + b, 0), all = [H].concat(rows.map(r => [r.name, r.formula, String(r.qty), r.unit]));
    cadPoly(CTX, [[tx, ty], [tx + tw, ty], [tx + tw, ty + all.length * rh], [tx, ty + all.length * rh]], PAL.primaryLine, 1.4, true, null, [], 'QTY_TABLE');
    all.forEach((r, i) => { if (i) cadLine(CTX, tx, ty + i * rh, tx + tw, ty + i * rh, PAL.tableBorder, 0.95, [], 'QTY_TABLE'); let x = tx; r.forEach((v, j) => { cadText(CTX, v, j < 2 && i ? x + 6 : x + cw[j] / 2, ty + (i + 0.5) * rh, i ? 10 : 11.5, i ? (j === 2 ? PAL.dimText : PAL.textSub) : PAL.textMain, j < 2 && i ? 'left' : 'center', '600', 0, 'TABLE_TEXT'); x += cw[j]; }); });
    let x = tx; cw.slice(0, -1).forEach(w => { x += w; cadLine(CTX, x, ty, x, ty + all.length * rh, PAL.tableBorder, 0.95, [], 'QTY_TABLE'); });
    const N = [`混凝土＝正視輪廓（面積 ${f(G.Af / 1e4, 3)} m²）內逐點厚度積分`, `厚度取側視（${p.T_top}→${p.T_bot}，1:${p.m_front}）與俯視翼牆折深（左${p.D_wing_L}／右${p.D_wing_R}→${p.T_bot}）之小值`,
      `主筋 ∮16：沿正視寬每 ${p.rebar_sp} cm 一支，長＝該處高度−2×保護層 ${p.cov}＋底腳＋彎鉤 ${p.hkw}+${p.hkl}`, `分布筋 ∮13：立面 ${G.nV} 列（扣溢流口）＋底腳 ${p.nLeg} 列`];
    N.forEach((s, i) => cadText(CTX, '・' + s, tx, ty + all.length * rh + 18 + i * 17, 10, '#fde047', 'left', '500', 0, 'TABLE_TEXT'));
    return { frontYTop: bF.yTop, frontYMid: bF.yMid, frontYBot: bF.yBot, xLo: bF.xLeftOuter, xHi: bF.xRightOuter, planY0: planTop + 42, sideX, xBack: xB, sideYTop: 45 };
  }


  function cadLine(ctx, x1, y1, x2, y2, color, width, dash, layer) { O.push({ k: 'L', p: [[x1, -y1], [x2, -y2]], c: color, w: width || 1.5, d: dash || [], ly: layer || '0' }); }
  function cadPoly(ctx, pts, color, width, close, fill, dash, layer) { if (!pts || pts.length < 2) return; O.push({ k: 'P', p: pts.map(q => [q[0], -q[1]]), c: color, w: width || 1.6, f: fill || null, cl: close !== false, d: dash || [], ly: layer || '0' }); }
  function cadCircle(ctx, cx, cy, r, color, width, fill, layer) { O.push({ k: 'C', x: cx, y: -cy, r, c: color, f: fill || null, w: width || 1.2, ly: layer || 'REBAR' }); }
  function cadText(ctx, str, x, y, size, color, align, weight, angleDeg, layer) { O.push({ k: 'T', x, y: -y, s: String(str), h: (size || 12) * 1.1, c: color || '#f8fafc', al: align || 'left', bl: 'middle', rot: -(angleDeg || 0) * Math.PI / 180, ly: layer || 'TEXT' }); }
  function cadArrow(ctx, x1, y1, x2, y2, color, width) { cadLine(ctx, x1, y1, x2, y2, color, width, [], 'LEADER'); const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L, nx = -uy, ny = ux; O.push({ k: 'P', p: [[x2, -y2], [x2 - ux * 8 + nx * 2.4, -(y2 - uy * 8 + ny * 2.4)], [x2 - ux * 8 - nx * 2.4, -(y2 - uy * 8 - ny * 2.4)]], c: color, w: 1, f: color, cl: true, d: [], ly: 'LEADER' }); }

  return {
    DEF, PR: [{"k": "p_LReq", "nm": "左右兩側", "def": "1", "opt": [["1", "左右相同（右側跟左側）"], ["0", "左右分開"]], "g": 0}, {"k": "inp_W_wing_L", "nm": "左側翼牆頂寬 W_wing_L (cm)", "def": "200", "st": "10", "min": "40", "max": "1500", "g": 0}, {"k": "inp_W_wing_R", "nm": "右側翼牆頂寬 W_wing_R (cm)", "def": "200", "st": "10", "min": "40", "max": "1500", "g": 0}, {"k": "inp_W_notch", "nm": "溢流口底寬 W_notch (cm)", "def": "240", "st": "10", "min": "80", "max": "2000", "g": 0}, {"k": "inp_B_bot", "nm": "固床工底寬 B_bot (cm)", "def": "352", "st": "10", "min": "100", "max": "3000", "g": 0}, {"k": "inp_D_wing_L", "nm": "左側翼牆折深 D_wing_L (cm)", "def": "56", "st": "2", "min": "25", "max": "300", "g": 0}, {"k": "inp_D_wing_R", "nm": "右側翼牆折深 D_wing_R (cm)", "def": "56", "st": "2", "min": "25", "max": "300", "g": 0}, {"k": "inp_m_notch", "nm": "溢流口邊坡 1:m_n", "def": "0.3", "st": "0.05", "min": "0.05", "max": "2", "g": 0}, {"k": "inp_H_up", "nm": "上部溢流深 H_up (cm)", "def": "120", "st": "10", "min": "40", "max": "400", "g": 1}, {"k": "inp_H_low", "nm": "下部基礎深 H_low (cm)", "def": "180", "st": "10", "min": "60", "max": "500", "g": 1}, {"k": "inp_T_top", "nm": "頂部冠寬 T_top (cm)", "def": "30", "st": "5", "min": "20", "max": "150", "g": 1}, {"k": "inp_m_front", "nm": "前坡面 1:m_f", "def": "0.3", "st": "0.05", "min": "0.05", "max": "1.5", "g": 1}, {"k": "inp_rebar_sp", "nm": "主筋與橫筋間距 (cm)", "def": "30", "st": "5", "min": "10", "max": "60", "g": 2}, {"k": "p_cov", "nm": "鋼筋保護層 (cm)", "def": "5", "st": "0.5", "min": "3", "max": "15", "g": 2}, {"k": "p_lge", "nm": "底腳筋前端保護層 (cm)", "def": "7", "st": "0.5", "min": "3", "max": "30", "g": 2}, {"k": "p_hkw", "nm": "主筋頂部彎鉤寬 (cm)", "def": "4.5", "st": "0.5", "min": "0", "max": "30", "g": 2}, {"k": "p_hkl", "nm": "主筋頂部彎鉤長 (cm)", "def": "9", "st": "0.5", "min": "0", "max": "50", "g": 2}, {"k": "p_w16", "nm": "∮16 單位重 (kg/m)", "def": "1.56", "st": "0.01", "min": "0.5", "max": "5", "g": 2}, {"k": "p_w13", "nm": "∮13 單位重 (kg/m)", "def": "0.995", "st": "0.005", "min": "0.3", "max": "5", "g": 2}, {"k": "p_stx", "nm": "溢流口下游緣線外移 (cm)", "def": "16", "st": "1", "min": "0", "max": "100", "g": 2}, {"k": "p_sty", "nm": "溢流口下游緣線下移 (cm)", "def": "24", "st": "1", "min": "0", "max": "150", "g": 2}], GT: ["1. 正視與俯視橫向尺寸（左右獨立，以溢流口中心線為界）", "2. 側視斷面高度與厚度", "3. 配筋與細部（原圖鋼筋 ∮16／∮13）"], title: '#1固床工標準圖',
    run(R, opt) {
      RR = R || {}; O = [];
      try { const P = getParams(), rows = computeQuantities(P), L = opt && opt.draw ? __draw(P) : null;
        const checks = [{ ok: P.T_top >= 20, text: `頂部冠寬 T_top=${P.T_top} cm` }, { ok: P.B_bot <= P.W_total, text: `底寬 B_bot ${P.B_bot} ≦ 頂全寬 ${P.W_total} cm` }, { ok: P.W_notch >= 80, text: `溢流口底寬 ${P.W_notch} cm、頂寬 ${P.W_top_notch} cm` }];
        return { P, rows, checks, O, L }; } finally { RR = null; }
    }
  };
})();
