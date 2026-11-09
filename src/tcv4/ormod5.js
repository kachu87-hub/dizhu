/* v6.3 B型生態複合式砌石護岸（使用者原工具 c4dc930e 自動抽出；gen_bty.py，勿手改） */
var TCO_T = window.TCO_T || (window.TCO_T = {});
TCO_T['bty'] = (function () {
  let RR = null, O = [];
  const EL = {}, CTX = new Proxy({}, { get: (t, k) => (k in t ? t[k] : () => ({ width: 0 })), set: (t, k, v) => { t[k] = v; return true; } });
  const el = id => EL[id] || (EL[id] = { value: '', textContent: '', innerHTML: '', className: '', style: {}, classList: { add() {}, remove() {} }, addEventListener() {} });
  const document = { getElementById: el, querySelectorAll: () => [], querySelector: () => null, createElement: () => ({ click() {}, style: {} }), body: { appendChild() {}, removeChild() {} } };
  const window = { addEventListener() {}, devicePixelRatio: 1 };

    // =========================================================================
    // 1. BASELINE CONSTANTS & GLOBAL STATE (PURE ASCII IDENTIFIERS)
    // =========================================================================
    const ORIG_REVETMENT_B = {
      H_up: 300,
      H_low: 200,
      H_back_vert: 140,
      D_bed_sub: 50,
      m_up: 1.0,
      m_low: 0.3,
      B_base_L: 220,
      B_base_R: 185,
      W_stone_low: 50,
      W_berm_tot: 125,
      W_bed: 760,
      L_total_m: 32.10,
      L_draw_cm: 600,
      N_bay: 3,
      L_stake: 100
    };

    let currentView = 'ALL'; // 'ALL', 'SECTION_ONLY', 'PLAN_ELEV', 'AUDIT'
    let showGhost = false;
    let isDarkTheme = true;

    let viewCam = {
      scale: 0.72,
      offsetX: 45,
      offsetY: 20,
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

      const p = {
        H_up: Math.max(80, num('inp_H_up', 300)),
        H_low: Math.max(80, num('inp_H_low', 200)),
        H_back_vert: Math.max(40, num('inp_H_back_vert', 140)),
        D_bed_sub: Math.max(25, num('inp_D_bed_sub', 50)),
        m_up: Math.max(0.3, num('inp_m_up', 1.0)),
        m_low: Math.max(0.1, num('inp_m_low', 0.3)),
        B_base_L: Math.max(100, num('inp_B_base_L', 220)),
        B_base_R: Math.max(100, num('inp_B_base_R', 185)),
        W_stone_low: Math.max(30, num('inp_W_stone_low', 50)),
        W_berm_tot: Math.max(70, num('inp_W_berm_tot', 125)),
        W_bed: Math.max(200, num('inp_W_bed', 760)),
        L_total_m: Math.max(1, num('inp_L_total_m', 32.10)),
        L_draw_cm: Math.max(200, num('inp_L_draw_cm', 600)),
        N_bay: Math.max(1, Math.min(10, Math.round(num('inp_N_bay', 3)))),
        L_stake: Math.max(60, num('inp_L_stake', 100))
      };

      // Clamp H_back_vert so it does not exceed H_low - 20
      p.H_back_vert = Math.min(p.H_low - 20, p.H_back_vert);
      p.H_shoulder = p.H_low - p.H_back_vert; // 200 - 140 = 60 cm
      p.H_total_cm = p.H_up + p.H_low;         // 300 + 200 = 500 cm
      p.H_total_m = +(p.H_total_cm / 100).toFixed(2); // 5.00 m

      // Berm sub-dimensions on right side: 15 (front lip) + 110 (sloped shoulder horizontal projection) = 125 cm
      p.W_berm_lip = 15;
      p.W_berm_slope = Math.max(40, p.W_berm_tot - p.W_berm_lip); // 110 cm

      const isOrig = (
        p.H_up === 300 && p.H_low === 200 && p.H_back_vert === 140 &&
        Math.abs(p.m_up - 1.0) < 1e-3 && Math.abs(p.m_low - 0.3) < 1e-3 &&
        p.B_base_L === 220 && p.B_base_R === 185 && p.W_stone_low === 50 &&
        p.W_berm_tot === 125
      );

      // Per-meter Quantities (Single Side) matching original table:
      // 1. 乾砌石 (長徑40~110cm): H_up/100 * sqrt(1 + m_up^2) -> 3.00 * 1.4142 = 4.24 M2
      const calcDryArea = (p.H_up / 100) * Math.hypot(1, p.m_up);
      p.q_dry_stone = isOrig ? 4.24 : +calcDryArea.toFixed(2);

      // 2. 混凝土砌石 (長徑60cm以上): H_low/100 * sqrt(1 + m_low^2) -> 2.00 * 1.044 = 2.09 M2
      const calcWetArea = (p.H_low / 100) * Math.hypot(1, p.m_low);
      p.q_wet_stone = isOrig ? 2.09 : +calcWetArea.toFixed(2);

      // 3. 場鑄結構混凝土用模板 (金屬模板, 背撐鋼板): H_back_vert / 100 -> 1.40 M2
      p.q_formwork = isOrig ? 1.40 : +(p.H_back_vert / 100).toFixed(2);

      // 4. 乾砌排石 (長徑70~90cm): 0.80 M2
      p.q_pitched_stone = isOrig ? 0.80 : +(0.80 * (p.W_berm_tot / 125)).toFixed(2);

      // 5. 結構用混凝土 機拌 210 kgf/cm2: 2.77 M3
      const avgBaseM = (p.B_base_L + p.B_base_R) / 200; // 2.025m
      const scaleConc = ((p.H_low / 200) * (avgBaseM / 2.025));
      p.q_concrete = isOrig ? 2.77 : +(2.77 * scaleConc).toFixed(2);

      // 6. 生態護坡 (疏伐木利用): 1.00 M
      p.q_eco_stake = 1.00;

      // Dynamic Stone Counts (STRICT RULE: Add/remove stones when dimensions change, NEVER stretch stones!)
      const slopeLenUp_cm = p.H_up * Math.hypot(1, p.m_up); // ~424.3 cm
      p.nDryStonesPerSide = Math.max(3, Math.round(slopeLenUp_cm / 47)); // 9 stones in original drawing!

      const slopeLenLow_cm = p.H_low * Math.hypot(1, p.m_low); // ~208.8 cm
      p.nWetStonesPerSide = Math.max(2, Math.round(slopeLenLow_cm / 35)); // 6 stones in original drawing!

      p.nBedBoulders = Math.max(5, Math.round(p.W_bed / 44)); // ~17 boulders across bed in original drawing!

      return p;
    }

    // =========================================================================
    // 3. CAD PRIMITIVES, IRREGULAR STONE GENERATOR & DXF ENGINE
    // =========================================================================
    function getPalette() {
      if (isDarkTheme) {
        return {
          bg: '#0b1120',
          primaryLine: '#f8fafc',
          secondaryLine: '#94a3b8',
          stoneLine: '#e2e8f0',
          stoneInner: '#64748b',
          stakeFill: 'rgba(180, 83, 9, 0.35)',
          stakeLine: '#fbbf24',
          grassColor: '#34d399',
          dimLine: '#38bdf8',
          dimText: '#7dd3fc',
          leaderLine: '#cbd5e1',
          textMain: '#f8fafc',
          textSub: '#cbd5e1',
          ghostLine: 'rgba(244, 63, 94, 0.42)',
          tableBorder: '#94a3b8',
          tableHeaderBg: 'rgba(30, 41, 59, 0.82)',
          fillConcrete: 'rgba(30, 41, 59, 0.45)',
          fillStone: 'rgba(51, 65, 85, 0.45)',
          waterLine: '#38bdf8'
        };
      } else {
        return {
          bg: '#ffffff',
          primaryLine: '#0f172a',
          secondaryLine: '#475569',
          stoneLine: '#0f172a',
          stoneInner: '#64748b',
          stakeFill: 'rgba(217, 119, 6, 0.2)',
          stakeLine: '#78350f',
          grassColor: '#15803d',
          dimLine: '#0f172a',
          dimText: '#0f172a',
          leaderLine: '#1e293b',
          textMain: '#0f172a',
          textSub: '#334155',
          ghostLine: 'rgba(225, 29, 72, 0.42)',
          tableBorder: '#0f172a',
          tableHeaderBg: 'rgba(241, 245, 249, 0.92)',
          fillConcrete: 'rgba(241, 245, 249, 0.5)',
          fillStone: 'rgba(226, 232, 240, 0.45)',
          waterLine: '#0284c7'
        };
      }
    }

    function cadLine(ctx, x1, y1, x2, y2, color, width = 1.3, dash = [], layer = '0') {
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

    function cadPoly(ctx, pts, color, width = 1.5, close = true, fill = null, dash = [], layer = '0') {
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

    // Draw natural rounded boulder block (with concentric stone contour rings) oriented along (ux, uy) and normal (nx, ny)
    function drawOrientedBoulder(ctx, cx, cy, rx, ry, ux, uy, nx, ny, seed, pal, withRings = false, layer = 'STONE') {
      const nVerts = 10;
      const outerPts = [];
      const innerPts = [];
      for (let i = 0; i < nVerts; i++) {
        const ang = (i / nVerts) * Math.PI * 2;
        // Deterministic natural stone irregularity without stretching
        const jitter = 0.92 + 0.14 * Math.sin(seed * 3.7 + i * 2.3);
        const ca = Math.cos(ang) * rx * jitter;
        const sa = Math.sin(ang) * ry * jitter;
        const px = cx + ux * ca + nx * sa;
        const py = cy + uy * ca + ny * sa;
        outerPts.push([px, py]);
        if (withRings) {
          innerPts.push([
            cx + (px - cx) * 0.62,
            cy + (py - cy) * 0.62
          ]);
        }
      }
      cadPoly(ctx, outerPts, pal.stoneLine, 1.35, true, pal.fillStone, [], layer);
      if (withRings) {
        cadPoly(ctx, innerPts, pal.stoneInner, 0.85, true, null, [], layer + '_RING');
      }
    }

    // Draw grass tuft symbol (當地草種植生) along bank slope
    function drawGrassTuft(ctx, x, y, pal) {
      cadLine(ctx, x - 6, y, x + 6, y, pal.grassColor, 1.2, [], 'GRASS');
      cadLine(ctx, x, y, x - 5, y - 8, pal.grassColor, 1.2, [], 'GRASS');
      cadLine(ctx, x, y, x, y - 10, pal.grassColor, 1.2, [], 'GRASS');
      cadLine(ctx, x, y, x + 5, y - 8, pal.grassColor, 1.2, [], 'GRASS');
    }

    // Draw thinning wood stake (疏伐木立椿 10~30cmø L=80~120cm)
    function drawWoodStake(ctx, xCenter, yTop, w, h, pal) {
      const xL = xCenter - w / 2;
      const xR = xCenter + w / 2;
      const yTip = yTop + h;
      const yShoulder = yTop + h * 0.82;
      cadPoly(ctx, [
        [xL, yTop],
        [xR, yTop],
        [xR, yShoulder],
        [xCenter, yTip],
        [xL, yShoulder]
      ], pal.stakeLine, 1.4, true, pal.stakeFill, [], 'WOOD_STAKE');
      // Wood grain vertical lines
      cadLine(ctx, xCenter - w * 0.2, yTop + 2, xCenter - w * 0.15, yShoulder, pal.stakeLine, 0.85, [], 'WOOD_STAKE');
      cadLine(ctx, xCenter + w * 0.2, yTop + 2, xCenter + w * 0.15, yShoulder, pal.stakeLine, 0.85, [], 'WOOD_STAKE');
    }

    // Standard CAD Dimension with strict extension-line gap
    function cadDim(ctx, x1, y1, x2, y2, offset, labelStr, pal, fontSize = 11.5) {
      const dx = x2 - x1, dy = y2 - y1;
      const L = Math.hypot(dx, dy);
      if (L < 1e-3) return;
      const ux = dx / L, uy = dy / L;
      const sign = offset >= 0 ? 1 : -1;
      const nx = -uy * sign, ny = ux * sign;
      const absOff = Math.abs(offset);
      const gap = 6; // Strict gap from structure corners
      const extOver = 5;

      const sx1 = x1 + nx * gap, sy1 = y1 + ny * gap;
      const ex1 = x1 + nx * (absOff + extOver), ey1 = y1 + ny * (absOff + extOver);
      const sx2 = x2 + nx * gap, sy2 = y2 + ny * gap;
      const ex2 = x2 + nx * (absOff + extOver), ey2 = y2 + ny * (absOff + extOver);

      const dx1 = x1 + nx * absOff, dy1 = y1 + ny * absOff;
      const dx2 = x2 + nx * absOff, dy2 = y2 + ny * absOff;

      if (absOff > 3) {
        cadLine(ctx, sx1, sy1, ex1, ey1, pal.dimLine, 1.0, [], 'DIM');
        cadLine(ctx, sx2, sy2, ex2, ey2, pal.dimLine, 1.0, [], 'DIM');
      }
      cadLine(ctx, dx1, dy1, dx2, dy2, pal.dimLine, 1.05, [], 'DIM');

      // Architectural ticks at ends
      const tk = 3.5;
      cadLine(ctx, dx1 - (ux - nx) * tk, dy1 - (uy - ny) * tk, dx1 + (ux - nx) * tk, dy1 + (uy - ny) * tk, pal.dimLine, 1.2, [], 'DIM');
      cadLine(ctx, dx2 - (ux - nx) * tk, dy2 - (uy - ny) * tk, dx2 + (ux - nx) * tk, dy2 + (uy - ny) * tk, pal.dimLine, 1.2, [], 'DIM');

      const mx = (dx1 + dx2) / 2 + nx * 9;
      const my = (dy1 + dy2) / 2 + ny * 9;
      let angle = (Math.atan2(dy, dx) * 180) / Math.PI;
      if (angle > 90) angle -= 180;
      if (angle < -90) angle += 180;
      cadText(ctx, labelStr, mx, my, fontSize, pal.dimText, 'center', '600', angle, 'DIM_TEXT');
    }

    function drawDoubleUnderlineTitle(ctx, title, cx, cy, size, pal) {
      cadText(ctx, title, cx, cy, size, pal.textMain, 'center', '700', 0, 'TITLE');
      const w = title.length * size * 0.98;
      cadLine(ctx, cx - w / 2, cy + size * 0.65, cx + w / 2, cy + size * 0.65, pal.primaryLine, 1.5, [], 'TITLE');
      cadLine(ctx, cx - w / 2, cy + size * 0.90, cx + w / 2, cy + size * 0.90, pal.primaryLine, 1.0, [], 'TITLE');
    }

    // =========================================================================
    // 4. VIEW 1: B 型護岸橫斷面施工詳圖 (CROSS-SECTION VIEW - TOP)
    //    100% Faithful to Uploaded Drawing:
    //    - Centerline CL, Design Water Level ▽ at top of lower wall (H_low = 200)
    //    - Channel Bed: full-width pitched boulders (長徑30~70cm) on top of 210kg/cm2 concrete slab (total bed sub-depth = 50)
    //    - Lower Walls (Left & Right): Height = 200 (140 vertical back + 60 sloped shoulder), front slope 1:0.3, stone facing width 50, base widths 220 (Left) & 185 (Right), berm width 125 (15 + 110)
    //    - Upper Dry Stone Slopes (Left & Right): Height = 300, slope 1:1, 9 natural stones along each slope
    //    - Top Eco-Protection: Thinning wood stakes (疏伐木立椿 10~30cmø L=80~120cm) + Local grass seeding (當地草種植生)
    // =========================================================================
    function drawCrossSectionView(ctx, cx, topY, s, p, pal) {
      const H_up = p.H_up * s;               // 300 * s
      const H_low = p.H_low * s;             // 200 * s
      const H_vert = p.H_back_vert * s;      // 140 * s
      const H_sh = p.H_shoulder * s;         // 60 * s
      const D_bed = p.D_bed_sub * s;         // 50 * s (28 boulder + 22 concrete)
      const D_boulder = D_bed * p.kbd;
      const D_conc = D_bed - D_boulder;

      const W_bed = p.W_bed * s;             // Channel bed width between left & right toes
      const B_L = p.B_base_L * s;            // 220 * s
      const B_R = p.B_base_R * s;            // 185 * s
      const W_st_low = p.W_stone_low * s;    // 50 * s
      const W_lip = p.W_berm_lip * s;        // 15 * s
      const W_sh_slope = p.W_berm_slope * s; // 110 * s
      const W_berm = p.W_berm_tot * s;       // 125 * s

      const dx_low = (p.H_low * p.m_low) * s; // 200 * 0.3 = 60 * s
      const dx_up = (p.H_up * p.m_up) * s;    // 300 * 1.0 = 300 * s

      // Key Y elevations
      const yCrestUp = topY + 95;            // Top of 300cm dry stone slope
      const yBerm = yCrestUp + H_up;         // Top of 200cm lower wall / Water level
      const yShoulderBot = yBerm + H_sh;     // 60cm below yBerm (140cm above base)
      const yBase = yBerm + H_low;           // Bottom of 200cm lower wall
      const yBedTop = yBase - D_bed;         // Top of channel bed boulders (50cm above yBase)
      const yBedConcTop = yBase - D_conc;    // Top of 210kg/cm2 concrete bed slab

      // Key X coordinates (Left & Right of Centerline cx)
      // Left Wall:
      const xToeBot_L = cx - W_bed / 2;                    // Bottom inner toe of left concrete-stone wall
      const xBack_L = xToeBot_L - B_L;          // Left vertical back face (total base width = B_L = 220)
      const xFaceTop_L = xToeBot_L - dx_low;               // Top-inner edge of 1:0.3 lower stone wall
      const xStoneBackTop_L = xFaceTop_L - W_st_low;       // 50cm horizontal top width of lower stone wall
      const xStoneBackBot_L = xToeBot_L - W_st_low;

      // Right Wall:
      const xToeBot_R = cx + W_bed / 2;                    // Bottom inner toe of right concrete-stone wall
      const xBack_R = xToeBot_R + B_R;          // Right vertical back face (total base width = B_R = 185)
      const xFaceTop_R = xToeBot_R + dx_low;               // Top-inner edge of 1:0.3 lower stone wall
      const xStoneBackTop_R = xFaceTop_R + W_st_low;       // 50cm horizontal top width of lower stone wall
      const xStoneBackBot_R = xToeBot_R + W_st_low;

      // 1. Centerline (CL) & Design Water Level (▽)
      cadLine(ctx, cx, yCrestUp - 55, cx, yBase + 45, pal.primaryLine, 1.1, [18, 6, 4, 6], 'CENTERLINE');
      cadText(ctx, 'C', cx - 2, yCrestUp - 66, 13, pal.textMain, 'center', '600');
      cadText(ctx, 'L', cx + 2, yCrestUp - 60, 13, pal.textMain, 'center', '600');

      // Water surface line at yBerm across channel + Water Triangle ▽
      cadLine(ctx, xFaceTop_L, yBerm, xFaceTop_R, yBerm, pal.waterLine, 1.25, [], 'WATER_LEVEL');
      const wx = cx - W_bed * 0.28;
      cadPoly(ctx, [[wx - 8, yBerm - 11], [wx + 8, yBerm - 11], [wx, yBerm]], pal.waterLine, 1.2, true, null, [], 'WATER_SYM');
      cadLine(ctx, wx - 11, yBerm + 3, wx + 11, yBerm + 3, pal.waterLine, 1.0, [], 'WATER_SYM');
      cadLine(ctx, wx - 6, yBerm + 6.5, wx + 6, yBerm + 6.5, pal.waterLine, 1.0, [], 'WATER_SYM');

      // 2. Lower Concrete Foundation Backing Blocks (Left & Right) + Channel Bed Concrete Base
      // Left Concrete Backing Block (with 140cm vertical back & 60cm sloped shoulder)
      cadPoly(ctx, [
        [xBack_L, yBase],
        [xToeBot_L, yBase],
        [xFaceTop_L, yBerm],
        [xToeBot_L - W_berm, yBerm],
        [xBack_L, yShoulderBot]
      ], pal.primaryLine, 1.7, true, pal.fillConcrete, [], 'CONC_WALL_L');

      // Right Concrete Backing Block
      cadPoly(ctx, [
        [xToeBot_R, yBase],
        [xBack_R, yBase],
        [xBack_R, yShoulderBot],
        [xToeBot_R + W_berm, yBerm],
        [xFaceTop_R, yBerm]
      ], pal.primaryLine, 1.7, true, pal.fillConcrete, [], 'CONC_WALL_R');

      // Channel Bed Concrete Base Slab (between left & right walls)
      cadPoly(ctx, [
        [xToeBot_L - p.m_low * D_conc, yBedConcTop],
        [xToeBot_R + p.m_low * D_conc, yBedConcTop],
        [xToeBot_R, yBase],
        [xToeBot_L, yBase]
      ], pal.primaryLine, 1.5, true, pal.fillConcrete, [], 'CONC_BED');

      // 3. Lower 1:0.3 Concrete-Grouted Stone Facing (混凝土砌石 長徑60cm以上, 50cm wide band)
      // Left 6 stones along 1:0.3 slope
      const nWet = p.nWetStonesPerSide;
      const wetLen = Math.hypot(dx_low, H_low);
      const uLx = (xToeBot_L - xFaceTop_L) / wetLen;
      const uLy = (yBase - yBerm) / wetLen;
      const nLx = -uLy, nLy = uLx;

      for (let i = 0; i < nWet; i++) {
        const t0 = i / nWet, t1 = (i + 1) / nWet;
        const tm = (t0 + t1) / 2;
        const cxStone = (xFaceTop_L - W_st_low * 0.5) + tm * dx_low;
        const cyStone = yBerm + tm * H_low;
        drawOrientedBoulder(ctx, cxStone, cyStone, (wetLen / nWet) * 0.48, W_st_low * 0.46, uLx, uLy, nLx, nLy, i + 1, pal, false, 'WET_STONE_L');
      }
      // Boundary lines of Left 50cm stone facing
      cadLine(ctx, xStoneBackTop_L, yBerm, xStoneBackBot_L, yBase, pal.primaryLine, 1.35, [], 'WET_STONE_BOUND');

      // Right 6 stones along 1:0.3 slope
      const uRx = (xToeBot_R - xFaceTop_R) / wetLen;
      const uRy = (yBase - yBerm) / wetLen;
      const nRx = -uRy, nRy = uRx;
      for (let i = 0; i < nWet; i++) {
        const tm = (i + 0.5) / nWet;
        const cxStone = (xFaceTop_R + W_st_low * 0.5) - tm * dx_low;
        const cyStone = yBerm + tm * H_low;
        drawOrientedBoulder(ctx, cxStone, cyStone, (wetLen / nWet) * 0.48, W_st_low * 0.46, uRx, uRy, nRx, nRy, i + 11, pal, false, 'WET_STONE_R');
      }
      cadLine(ctx, xStoneBackTop_R, yBerm, xStoneBackBot_R, yBase, pal.primaryLine, 1.35, [], 'WET_STONE_BOUND');

      // 4. Channel Bed Full-Width Pitched Boulders (拋石 塊石 長徑30~70cm)
      const bedSpan = (xToeBot_R - 8 * s) - (xToeBot_L + 8 * s);
      const nBed = p.nBedBoulders;
      const bPitch = bedSpan / nBed;
      cadLine(ctx, xToeBot_L - 10 * s, yBedTop, xToeBot_R + 10 * s, yBedTop, pal.primaryLine, 1.3, [], 'BED_TOP_LINE');
      for (let i = 0; i < nBed; i++) {
        const bx = (xToeBot_L + 8 * s) + (i + 0.5) * bPitch;
        const by = (yBedTop + yBedConcTop) / 2;
        drawOrientedBoulder(ctx, bx, by, bPitch * 0.47, D_boulder * 0.47, 1, 0, 0, 1, i + 25, pal, false, 'BED_BOULDER');
      }

      // 5. Upper 1:1 Dry Stone Revetment (乾砌石 塊石 長徑40~110cm, H_up = 300cm)
      // Left 1:1 Slope: starts from the sloped shoulder of Left Lower Wall and rises up-left by (dx_up, H_up)
      const dryThick = p.dt * s;
      const xDryToeOut_L = xToeBot_L - W_berm;
      const yDryToeOut_L = yBerm;
      const xDryTopOut_L = xDryToeOut_L - dx_up;
      const yDryTopOut_L = yCrestUp;

      const dryLen = Math.hypot(dx_up, H_up);
      const udLx = (xDryTopOut_L - xDryToeOut_L) / dryLen; // (-cos45)
      const udLy = (yDryTopOut_L - yDryToeOut_L) / dryLen; // (-sin45)
      const ndLx = udLy, ndLy = -udLx;                     // Down-left normal into bank

      // Back bedding line of Left 1:1 dry stone
      cadLine(
        ctx,
        xDryToeOut_L + ndLx * dryThick, yDryToeOut_L + ndLy * dryThick,
        xDryTopOut_L + ndLx * (dryThick * p.dtr), yDryTopOut_L + ndLy * (dryThick * p.dtr),
        pal.primaryLine, 1.35, [], 'DRY_BACK_L'
      );

      const nDry = p.nDryStonesPerSide;
      for (let i = 0; i < nDry; i++) {
        const tm = (i + 0.5) / nDry;
        const taper = 1.0 - tm * (1 - p.dtr);
        const curThick = dryThick * taper;
        const sx = xDryToeOut_L + tm * (xDryTopOut_L - xDryToeOut_L) + ndLx * (curThick * 0.5);
        const sy = yDryToeOut_L + tm * (yDryTopOut_L - yDryToeOut_L) + ndLy * (curThick * 0.5);
        drawOrientedBoulder(ctx, sx, sy, (dryLen / nDry) * 0.48, curThick * 0.46, udLx, udLy, ndLx, ndLy, i + 50, pal, false, 'DRY_STONE_L');
      }

      // Right 1:1 Slope: starts from (xStoneBackTop_R + W_lip, yBerm) and rises up-right by (dx_up, H_up)
      const xDryToeOut_R = xToeBot_R + W_berm;
      const yDryToeOut_R = yBerm;
      const xDryTopOut_R = xDryToeOut_R + dx_up;
      const yDryTopOut_R = yCrestUp;

      const udRx = (xDryTopOut_R - xDryToeOut_R) / dryLen; // (+cos45)
      const udRy = (yDryTopOut_R - yDryToeOut_R) / dryLen; // (-sin45)
      const ndRx = -udRy, ndRy = udRx;                     // Down-right normal into bank

      cadLine(
        ctx,
        xDryToeOut_R + ndRx * dryThick, yDryToeOut_R + ndRy * dryThick,
        xDryTopOut_R + ndRx * (dryThick * p.dtr), yDryTopOut_R + ndRy * (dryThick * p.dtr),
        pal.primaryLine, 1.35, [], 'DRY_BACK_R'
      );

      for (let i = 0; i < nDry; i++) {
        const tm = (i + 0.5) / nDry;
        const taper = 1.0 - tm * (1 - p.dtr);
        const curThick = dryThick * taper;
        const sx = xDryToeOut_R + tm * (xDryTopOut_R - xDryToeOut_R) + ndRx * (curThick * 0.5);
        const sy = yDryToeOut_R + tm * (yDryTopOut_R - yDryToeOut_R) + ndRy * (curThick * 0.5);
        drawOrientedBoulder(ctx, sx, sy, (dryLen / nDry) * 0.48, curThick * 0.46, udRx, udRy, ndRx, ndRy, i + 80, pal, false, 'DRY_STONE_R');
      }

      // 6. Top Eco-Protection: Thinning Wood Stakes (疏伐木立椿) & Local Grass Seeding (當地草種植生)
      const stakeW = 14 * s;
      const stakeH = p.L_stake * s * 0.65;
      // Left Stake & Top Bank Slope
      const xStake_L = xDryTopOut_L - 42 * s;
      const yStake_L = yCrestUp - 16 * s;
      cadLine(ctx, xDryTopOut_L, yCrestUp, xStake_L + stakeW / 2, yCrestUp, pal.primaryLine, 1.3);
      drawGrassTuft(ctx, (xDryTopOut_L + xStake_L) / 2, yCrestUp, pal);
      drawWoodStake(ctx, xStake_L, yStake_L, stakeW, stakeH, pal);

      const xBankEnd_L = xStake_L - 175 * s;
      const yBankEnd_L = yStake_L - 22 * s;
      cadLine(ctx, xStake_L - stakeW / 2, yStake_L + 4, xBankEnd_L, yBankEnd_L, pal.primaryLine, 1.35, [], 'TOP_BANK_L');
      drawGrassTuft(ctx, xStake_L - 35 * s, yStake_L, pal);
      drawGrassTuft(ctx, xStake_L - 78 * s, yStake_L - 6 * s, pal);
      drawGrassTuft(ctx, xStake_L - 122 * s, yStake_L - 12 * s, pal);

      // Right Stake & Top Bank Slope
      const xStake_R = xDryTopOut_R + 42 * s;
      const yStake_R = yCrestUp - 16 * s;
      cadLine(ctx, xDryTopOut_R, yCrestUp, xStake_R - stakeW / 2, yCrestUp, pal.primaryLine, 1.3);
      drawGrassTuft(ctx, (xDryTopOut_R + xStake_R) / 2, yCrestUp, pal);
      drawWoodStake(ctx, xStake_R, yStake_R, stakeW, stakeH, pal);

      const xBankEnd_R = xStake_R + 175 * s;
      const yBankEnd_R = yStake_R - 22 * s;
      cadLine(ctx, xStake_R + stakeW / 2, yStake_R + 4, xBankEnd_R, yBankEnd_R, pal.primaryLine, 1.35, [], 'TOP_BANK_R');
      drawGrassTuft(ctx, xStake_R + 35 * s, yStake_R, pal);
      drawGrassTuft(ctx, xStake_R + 78 * s, yStake_R - 6 * s, pal);
      drawGrassTuft(ctx, xStake_R + 122 * s, yStake_R - 12 * s, pal);

      // =====================================================================
      // 7. ALL DIMENSIONS ON CROSS-SECTION (100% Matching Original Layout)
      // =====================================================================
      // Left Vertical Height Chain: 300 (upper) | 200 (lower)
      const xDimLeft = xStake_L - 24 * s;
      cadLine(ctx, xStake_L - 4, yCrestUp, xDimLeft - 8, yCrestUp, pal.dimLine, 1.0);
      cadLine(ctx, xBack_L - 8, yBerm, xDimLeft - 8, yBerm, pal.dimLine, 1.0);
      cadLine(ctx, xBack_L - 8, yBase, xDimLeft - 8, yBase, pal.dimLine, 1.0);
      cadDim(ctx, xDimLeft, yCrestUp, xDimLeft, yBerm, 0, `${p.H_up}`, pal, 12);
      cadDim(ctx, xDimLeft, yBerm, xDimLeft, yBase, 0, `${p.H_low}`, pal, 12);

      // Left Wall: top 50, base 220, bed depth 50, slopes 1:1 & 1:0.3
      cadDim(ctx, xStoneBackTop_L, yBerm, xFaceTop_L, yBerm, -14, `${p.W_stone_low}`, pal, 11);
      cadDim(ctx, xBack_L, yBase, xToeBot_L, yBase, 22, `${p.B_base_L}`, pal, 11.5);
      cadDim(ctx, xToeBot_L + 38 * s, yBedTop, xToeBot_L + 38 * s, yBase, 14, `${p.D_bed_sub}`, pal, 10.5);

      const angUp = (Math.atan2(H_up, dx_up) * 180) / Math.PI;
      cadText(ctx, `1:${p.m_up}`, (xDryToeOut_L + xDryTopOut_L) / 2 + 12, (yDryToeOut_L + yDryTopOut_L) / 2 - 10, 11.5, pal.textMain, 'center', '700', angUp);
      const angLow = (Math.atan2(H_low, dx_low) * 180) / Math.PI;
      cadText(ctx, `1:${p.m_low}`, (xFaceTop_L + xToeBot_L) / 2 + 13, (yBerm + yBase) / 2 - 8, 11, pal.textMain, 'center', '600', angLow);

      // Right Wall: 125 (15 + 110), base 185, vertical 60 | 140, outer 300 | 200, slopes 1:1 & 1:0.3
      cadDim(ctx, xToeBot_R, yBerm, xToeBot_R + W_berm, yBerm, -28, `${p.W_berm_tot}`, pal, 11);
      cadDim(ctx, xToeBot_R, yBerm, xStoneBackTop_R, yBerm, -12, `${+(p.W_stone_low + p.H_low * p.m_low).toFixed(1)}`, pal, 10);
      cadDim(ctx, xStoneBackTop_R, yBerm, xToeBot_R + W_berm, yBerm, -12, `${+p.W_berm_lip.toFixed(1)}`, pal, 10.5);

      cadDim(ctx, xToeBot_R, yBase, xBack_R, yBase, 22, `${p.B_base_R}`, pal, 11.5);

      const xDimRightInner = xBack_R + 28 * s;
      cadLine(ctx, xBack_R + 4, yBerm, xDimRightInner + 8, yBerm, pal.dimLine, 1.0);
      cadLine(ctx, xBack_R + 4, yShoulderBot, xDimRightInner + 8, yShoulderBot, pal.dimLine, 1.0);
      cadLine(ctx, xBack_R + 4, yBase, xDimRightInner + 8, yBase, pal.dimLine, 1.0);
      cadDim(ctx, xDimRightInner, yBerm, xDimRightInner, yShoulderBot, 0, `${p.H_shoulder}`, pal, 11);
      cadDim(ctx, xDimRightInner, yShoulderBot, xDimRightInner, yBase, 0, `${p.H_back_vert}`, pal, 11);

      const xDimRightOuter = xStake_R + 22 * s;
      cadLine(ctx, xStake_R + 4, yCrestUp, xDimRightOuter + 8, yCrestUp, pal.dimLine, 1.0);
      cadLine(ctx, xDimRightInner + 8, yBerm, xDimRightOuter + 8, yBerm, pal.dimLine, 1.0);
      cadLine(ctx, xDimRightInner + 8, yBase, xDimRightOuter + 8, yBase, pal.dimLine, 1.0);
      cadDim(ctx, xDimRightOuter, yCrestUp, xDimRightOuter, yBerm, 0, `${p.H_up}`, pal, 12);
      cadDim(ctx, xDimRightOuter, yBerm, xDimRightOuter, yBase, 0, `${p.H_low}`, pal, 12);

      cadText(ctx, `1:${p.m_up}`, (xDryToeOut_R + xDryTopOut_R) / 2 - 12, (yDryToeOut_R + yDryTopOut_R) / 2 - 10, 11.5, pal.textMain, 'center', '700', -angUp);
      cadText(ctx, `1:${p.m_low}`, (xFaceTop_R + xToeBot_R) / 2 - 13, (yBerm + yBase) / 2 - 8, 11, pal.textMain, 'center', '600', -angLow);

      // =====================================================================
      // 8. ALL CALLOUT LEADERS ON CROSS-SECTION (100% Matching Original)
      // =====================================================================
      // (a) Top-Left: 當地草種植生
      const gTargetX = xStake_L - 82 * s;
      const gTargetY = yStake_L - 7 * s;
      cadLine(ctx, gTargetX, gTargetY, gTargetX + 6, gTargetY - 46, pal.leaderLine, 1.1);
      cadLine(ctx, gTargetX + 6, gTargetY - 46, gTargetX + 86, gTargetY - 46, pal.leaderLine, 1.1);
      cadText(ctx, '當地草種植生', gTargetX + 46, gTargetY - 56, 12, pal.textMain, 'center', '600');

      // (b) Left Slope: 乾砌石 塊石(長徑40~110cm) (佔70%以上)
      const dTargetX = (xDryToeOut_L + xDryTopOut_L) / 2 + 12;
      const dTargetY = (yDryToeOut_L + yDryTopOut_L) / 2;
      const dKneeX = dTargetX + 26;
      const dKneeY = dTargetY - 42;
      cadLine(ctx, dTargetX, dTargetY, dKneeX, dKneeY, pal.leaderLine, 1.1);
      cadLine(ctx, dKneeX, dKneeY, dKneeX + 148, dKneeY, pal.leaderLine, 1.1);
      cadText(ctx, '乾砌石', dKneeX + 22, dKneeY - 22, 12, pal.textMain, 'left', '600');
      cadText(ctx, '塊石(長徑40~110cm)', dKneeX + 74, dKneeY - 8, 11.5, pal.textMain, 'center', '600');
      cadText(ctx, '(佔70%以上)', dKneeX + 74, dKneeY + 12, 11.5, pal.textSub, 'center', '500');

      // (c) Top-Right: 疏伐木 立椿 10~30cmø L=80~120cm (就地取材)
      const sKneeX = xStake_R - 22;
      const sKneeY = yStake_R - 48;
      cadLine(ctx, xStake_R, yStake_R, sKneeX, sKneeY, pal.leaderLine, 1.1);
      cadLine(ctx, sKneeX, sKneeY, sKneeX - 135, sKneeY, pal.leaderLine, 1.1);
      cadText(ctx, '疏伐木', sKneeX - 132, sKneeY - 24, 12, pal.textMain, 'left', '600');
      cadText(ctx, '立椿 10~30cmø L=80~120cm', sKneeX - 132, sKneeY - 8, 11.5, pal.textMain, 'left', '600');
      cadText(ctx, '(就地取材)', sKneeX - 132, sKneeY + 12, 11.5, pal.textSub, 'left', '500');

      // (d) Middle-Right: 混凝土砌石 塊石(長徑:60cm以上) (佔70%以上)
      const wTargetX = xFaceTop_R + W_st_low * 0.45;
      const wTargetY = yBerm + 28 * s;
      const wKneeX = wTargetX - 24;
      const wKneeY = yBerm - 52;
      cadLine(ctx, wTargetX, wTargetY, wKneeX, wKneeY, pal.leaderLine, 1.1);
      cadLine(ctx, wKneeX, wKneeY, wKneeX - 145, wKneeY, pal.leaderLine, 1.1);
      cadText(ctx, '混凝土砌石', wKneeX - 142, wKneeY - 22, 12, pal.textMain, 'left', '600');
      cadText(ctx, '塊石 (長徑:60cm以上)', wKneeX - 72, wKneeY - 8, 11.5, pal.textMain, 'center', '600');
      cadText(ctx, '(佔70%以上)', wKneeX - 72, wKneeY + 12, 11.5, pal.textSub, 'center', '500');

      // (e) Bottom-Center-Left: 拋石 塊石 (長徑:30~70cm) (就地取材)(佔70%以上)
      const bTargetX = cx - 42 * s;
      const bTargetY = (yBedTop + yBedConcTop) / 2;
      const bKneeX = bTargetX - 24;
      const bKneeY = yBase + 56;
      cadLine(ctx, bTargetX, bTargetY, bKneeX, bKneeY, pal.leaderLine, 1.1);
      cadLine(ctx, bKneeX, bKneeY, bKneeX - 148, bKneeY, pal.leaderLine, 1.1);
      cadText(ctx, '拋石 塊石 (長徑:30~70cm)', bKneeX - 74, bKneeY - 9, 11.5, pal.textMain, 'center', '600');
      cadText(ctx, '(就地取材)(佔70%以上)', bKneeX - 74, bKneeY + 11, 11.5, pal.textSub, 'center', '500');

      // (f) Bottom-Right: 210Kg/cm² 機拌混凝土 (dual leader pointing to bed concrete slab & right wall concrete backing)
      const cTarget1X = cx + W_bed * 0.34;
      const cTarget1Y = (yBedConcTop + yBase) / 2;
      const cTarget2X = xToeBot_R + B_R * 0.45;
      const cTarget2Y = yBase - 18 * s;
      const cKneeX = cx + W_bed * 0.38;
      const cKneeY = yBase + 62;
      cadLine(ctx, cTarget1X, cTarget1Y, cKneeX, cKneeY, pal.leaderLine, 1.1);
      cadLine(ctx, cTarget2X, cTarget2Y, cKneeX, cKneeY, pal.leaderLine, 1.1);
      cadLine(ctx, cKneeX, cKneeY, cKneeX + 145, cKneeY, pal.leaderLine, 1.1);
      cadText(ctx, '210Kg/cm² 機拌混凝土', cKneeX + 72, cKneeY - 9, 12, pal.textMain, 'center', '600');

      // Section Title & Bottom Note
      const titleY = yBase + 108;
      drawDoubleUnderlineTitle(ctx, 'B 型護岸橫斷面施工詳圖', cx, titleY, 19, pal);
      cadText(ctx, '註：本工程渠底拋石，以滿鋪為原則再進行表面修飾以求平整。', cx, titleY + 34, 12.5, pal.textSub, 'center', '500');

      return {
        leftX: xBankEnd_L - 20,
        rightX: xBankEnd_R + 20,
        yBase,
        bottomY: titleY + 52
      };
    }

    // =========================================================================
    // 5. VIEW 2: TABLES ON CROSS-SECTION SHEET
    //    - Bottom-Left: B 型護岸工程 (高度 5.00 | 施工長度(左右側合計) 32.10)
    //    - Middle-Right: B 型護岸每公尺工作數量 (單側)
    // =========================================================================
    function drawSectionTables(ctx, leftTableX, leftTableY, rightTableX, rightTableY, p, pal) {
      // 1. Left Table: B 型護岸工程：
      cadText(ctx, 'B 型護岸工程：', leftTableX, leftTableY - 14, 15, pal.textMain, 'left', '700');
      const lColW = [105, 130];
      const lRowH1 = 46;
      const lRowH2 = 34;
      const lTotW = lColW[0] + lColW[1];
      const lTotH = lRowH1 + lRowH2;

      cadPoly(ctx, [
        [leftTableX, leftTableY],
        [leftTableX + lTotW, leftTableY],
        [leftTableX + lTotW, leftTableY + lTotH],
        [leftTableX, leftTableY + lTotH]
      ], pal.primaryLine, 1.4, true, pal.tableHeaderBg, [], 'LEFT_TABLE');

      cadLine(ctx, leftTableX, leftTableY + lRowH1, leftTableX + lTotW, leftTableY + lRowH1, pal.primaryLine, 1.1);
      cadLine(ctx, leftTableX + lColW[0], leftTableY, leftTableX + lColW[0], leftTableY + lTotH, pal.primaryLine, 1.1);

      cadText(ctx, '高 度', leftTableX + lColW[0] / 2, leftTableY + lRowH1 / 2, 14, pal.textMain, 'center', '600');
      cadText(ctx, '施工長度', leftTableX + lColW[0] + lColW[1] / 2, leftTableY + lRowH1 * 0.35, 14, pal.textMain, 'center', '600');
      cadText(ctx, '(左右側合計)', leftTableX + lColW[0] + lColW[1] / 2, leftTableY + lRowH1 * 0.74, 11.5, pal.textSub, 'center', '500');

      cadText(ctx, p.H_total_m.toFixed(2), leftTableX + lColW[0] / 2, leftTableY + lRowH1 + lRowH2 / 2, 14, pal.dimText, 'center', '700');
      cadText(ctx, p.L_total_m.toFixed(2), leftTableX + lColW[0] + lColW[1] / 2, leftTableY + lRowH1 + lRowH2 / 2, 14, pal.dimText, 'center', '700');

      // 2. Right Table: B 型護岸每公尺工作數量 (單側)
      cadText(ctx, 'B 型護岸每公尺工作數量 (單側)', rightTableX, rightTableY - 16, 15.5, pal.textMain, 'left', '700');
      const rColW = [115, 28, 86];
      const rRowH = 36;
      const rTotW = rColW[0] + rColW[1] + rColW[2];
      const nRows = 7;
      const rTotH = nRows * rRowH;

      cadPoly(ctx, [
        [rightTableX, rightTableY],
        [rightTableX + rTotW, rightTableY],
        [rightTableX + rTotW, rightTableY + rTotH],
        [rightTableX, rightTableY + rTotH]
      ], pal.primaryLine, 1.4, true, pal.tableHeaderBg, [], 'RIGHT_TABLE');

      // Diagonal split in top-left header cell (項目 \ 高度 H)
      const firstSpanW = rColW[0] + rColW[1];
      cadLine(ctx, rightTableX, rightTableY, rightTableX + firstSpanW, rightTableY + rRowH, pal.primaryLine, 1.0);
      cadText(ctx, '高 度 H', rightTableX + firstSpanW * 0.68, rightTableY + rRowH * 0.30, 11, pal.textMain, 'center', '600');
      cadText(ctx, '項  目', rightTableX + firstSpanW * 0.28, rightTableY + rRowH * 0.72, 11, pal.textMain, 'center', '600');
      cadText(ctx, p.H_total_m.toFixed(2), rightTableX + firstSpanW + rColW[2] / 2, rightTableY + rRowH / 2, 13.5, pal.dimText, 'center', '700');

      // Vertical dividers
      cadLine(ctx, rightTableX + rColW[0], rightTableY + rRowH, rightTableX + rColW[0], rightTableY + rTotH, pal.primaryLine, 1.0);
      cadLine(ctx, rightTableX + firstSpanW, rightTableY, rightTableX + firstSpanW, rightTableY + rTotH, pal.primaryLine, 1.1);

      const items = [
        [['結構用混凝土', '機拌210 kgf/cm²'], 'M³', p.q_concrete.toFixed(2)],
        [['場鑄結構混凝土用模板', '金屬模板,背撐鋼板'], 'M²', p.q_formwork.toFixed(2)],
        [['乾砌排石', '(長徑70~90cm)'], 'M²', p.q_pitched_stone.toFixed(2)],
        [['乾砌石', '(長徑40~110cm)'], 'M²', p.q_dry_stone.toFixed(2)],
        [['混凝土砌石', '(長徑60cm以上)'], 'M²', p.q_wet_stone.toFixed(2)],
        [['生態護坡', '(疏伐木利用)'], 'M', p.q_eco_stake.toFixed(2)]
      ];

      for (let i = 0; i < items.length; i++) {
        const ry = rightTableY + (i + 1) * rRowH;
        cadLine(ctx, rightTableX, ry, rightTableX + rTotW, ry, pal.primaryLine, 1.0);
        const [lines, unitStr, valStr] = items[i];
        cadText(ctx, lines[0], rightTableX + rColW[0] / 2, ry + rRowH * 0.34, 10, pal.textMain, 'center', '600');
        cadText(ctx, lines[1], rightTableX + rColW[0] / 2, ry + rRowH * 0.72, 9.5, pal.textSub, 'center', '500');
        cadText(ctx, unitStr, rightTableX + rColW[0] + rColW[1] / 2, ry + rRowH / 2, 10.5, pal.textMain, 'center', '600');
        cadText(ctx, valStr, rightTableX + firstSpanW + rColW[2] / 2, ry + rRowH / 2, 13, pal.dimText, 'center', '700');
      }
    }

    // =========================================================================
    // 6. VIEW 3: B 型護岸平面圖 與 B 型護岸立面展開圖 (1:1 VERTICALLY ALIGNED!)
    //    Strictly follows SWC Parametric Rules:
    //    - Plan View and Elevation View are 1:1 aligned along the longitudinal X axis
    //    - Supports 1 ~ 10 bays (N_bay), L1 = L_draw_cm / N_bay
    //    - Stones automatically increase/decrease in count when dimensions change (NEVER stretched!)
    //    - Hexagonal/Polygonal interlocking stone masonry pattern (五六圍砌無通縫) with concentric stone rings
    // =========================================================================
    function drawPlanAndElevationViews(ctx, ox, topY, p, pal) {
      const s = 0.46;
      const L_tot_cm = p.L_draw_cm;
      const N_bay = p.N_bay;
      const L_bay_cm = +(L_tot_cm / N_bay).toFixed(1);

      const L_draw = L_tot_cm * s;
      const bayW = L_draw / N_bay;

      const x0 = ox + 115;
      const x1 = x0 + L_draw;

      // ---------------------------------------------------------------------
      // PART A: B 型護岸平面圖 (PLAN VIEW - SINGLE SIDE + CHANNEL BED BOULDERS)
      //    Bands from top (Outer Bank) to bottom (Channel Bed):
      //    1. Top Grass & Thinning Wood Stakes row (疏伐木立椿 @45cm + 當地草種植生)
      //    2. Upper 1:1 Dry Stone Slope horizontal projection (dx_up = H_up * m_up = 300cm)
      //    3. Berm / Crest of Lower Wall (15 + 50 = 65cm)
      //    4. Lower 1:0.3 Concrete-Grouted Stone Slope horizontal projection (dx_low = 200 * 0.3 = 60cm)
      //    5. Channel Bed Full-Width Pitched Boulders strip (拋石滿鋪)
      // ---------------------------------------------------------------------
      const wBankStrip = 55 * s;
      const wDryHoriz = (p.H_up * p.m_up) * s;    // 300 * s
      const wCrestLow = (p.W_berm_tot - p.H_low * p.m_low) * s;
      const wWetHoriz = (p.H_low * p.m_low) * s;  // 60 * s
      const wBedStrip = 175 * s;                  // Representative channel bed strip with boulders

      const yPlan0 = topY + 50;                   // Outer bank edge
      const yStakeLine = yPlan0 + wBankStrip;     // Wood stake line & top of 1:1 dry stone
      const yDryBot = yStakeLine + wDryHoriz;     // Bottom of 1:1 dry stone / Top of lower wall
      const yWetTop = yDryBot + wCrestLow;        // Inner crest of 1:0.3 lower stone wall
      const yToeLine = yWetTop + wWetHoriz;       // Toe of lower stone wall / Edge of channel bed
      const yPlanBot = yToeLine + wBedStrip;      // Channel centerline / bed strip bottom

      // Outer Plan Boundary
      cadPoly(ctx, [
        [x0, yPlan0],
        [x1, yPlan0],
        [x1, yPlanBot],
        [x0, yPlanBot]
      ], pal.primaryLine, 1.6, true, pal.fillConcrete, [], 'PLAN_OUTLINE');

      // Horizontal Zone Dividing Lines
      cadLine(ctx, x0, yStakeLine, x1, yStakeLine, pal.primaryLine, 1.5, [], 'PLAN_ZONE');
      cadLine(ctx, x0, yDryBot, x1, yDryBot, pal.primaryLine, 1.4, [], 'PLAN_ZONE');
      cadLine(ctx, x0, yWetTop, x1, yWetTop, pal.primaryLine, 1.4, [], 'PLAN_ZONE');
      cadLine(ctx, x0, yToeLine, x1, yToeLine, pal.primaryLine, 1.6, [], 'PLAN_ZONE');

      // 1) Top Strip: Grass tufts & row of circular wood stake heads (疏伐木立椿 ø10~30cm)
      const stakePitch = p.stake_sp * s;
      const nStakes = Math.max(4, Math.floor(L_draw / stakePitch));
      for (let i = 0; i < nStakes; i++) {
        const sx = x0 + (i + 0.5) * (L_draw / nStakes);
        // Circular top of wood stake right on yStakeLine
        cadCircle(ctx, sx, yStakeLine - 5, 5.2, pal.stakeLine, 1.2, pal.stakeFill, 'WOOD_STAKE');
        if (i % 2 === 0) {
          drawGrassTuft(ctx, sx, yPlan0 + wBankStrip * 0.48, pal);
        }
      }

      // 2) Upper 1:1 Dry Stone Zone in Plan View (Staggered interlocking stone grid, auto-adjusting count!)
      drawStaggeredStoneZone(ctx, x0, yStakeLine, L_draw, wDryHoriz, 52 * s, 42 * s, pal, true, 'PLAN_DRY_STONE');

      // 3) Lower 1:0.3 Concrete-Stone Zone in Plan View
      drawStaggeredStoneZone(ctx, x0, yDryBot, L_draw, wCrestLow + wWetHoriz, 56 * s, 36 * s, pal, false, 'PLAN_WET_STONE');

      // 4) Channel Bed Pitched Boulders Zone in Plan View
      drawStaggeredStoneZone(ctx, x0, yToeLine, L_draw, wBedStrip, 46 * s, 42 * s, pal, false, 'PLAN_BED_STONE');

      // Flow Arrow in Channel Bed
      const flowX = (x0 + x1) / 2;
      const flowY = yToeLine + wBedStrip * 0.52;
      cadLine(ctx, flowX - 45, flowY, flowX + 45, flowY, pal.waterLine, 1.8, [], 'FLOW_ARROW');
      cadLine(ctx, flowX + 45, flowY, flowX + 33, flowY - 5, pal.waterLine, 1.8, [], 'FLOW_ARROW');
      cadLine(ctx, flowX + 45, flowY, flowX + 33, flowY + 5, pal.waterLine, 1.8, [], 'FLOW_ARROW');
      cadText(ctx, '水流方向', flowX, flowY - 12, 12, pal.dimText, 'center', '700');

      // Bay Division Lines & Top Dimensions on Plan View
      for (let b = 0; b < N_bay; b++) {
        const bxL = x0 + b * bayW;
        const bxR = bxL + bayW;
        if (b > 0) {
          cadLine(ctx, bxL, yPlan0, bxL, yPlanBot, pal.dimLine, 1.3, [8, 4], 'BAY_JOINT');
        }
        cadDim(ctx, bxL, yPlan0, bxR, yPlan0, -18, `${L_bay_cm}`, pal, 11);
      }
      cadDim(ctx, x0, yPlan0, x1, yPlan0, -38, `L = ${L_tot_cm} cm (${N_bay}段分區)`, pal, 11.5);

      // Left Vertical Zone Dimensions on Plan View
      cadDim(ctx, x0, yStakeLine, x0, yDryBot, -22, `${Math.round(p.H_up * p.m_up)}`, pal, 10.5);
      cadDim(ctx, x0, yDryBot, x0, yToeLine, -22, `${p.W_berm_tot}`, pal, 10.5);
      cadDim(ctx, x0, yToeLine, x0, yPlanBot, -22, `渠底拋石`, pal, 10);

      // Right Side Zone Labels on Plan View
      cadText(ctx, '← 疏伐木立椿 & 植生帶', x1 + 12, (yPlan0 + yStakeLine) / 2, 11, pal.textMain, 'left', '600');
      cadText(ctx, `← 1:${p.m_up} 乾砌石護坡`, x1 + 12, (yStakeLine + yDryBot) / 2, 11, pal.textMain, 'left', '600');
      cadText(ctx, `← 1:${p.m_low} 混凝土砌石護腳`, x1 + 12, (yDryBot + yToeLine) / 2, 11, pal.textMain, 'left', '600');
      cadText(ctx, '← 渠底滿鋪拋石 (30~70cm)', x1 + 12, (yToeLine + yPlanBot) / 2, 11, pal.textMain, 'left', '600');

      const planTitleY = yPlanBot + 32;
      drawDoubleUnderlineTitle(ctx, 'B 型護岸平面圖', (x0 + x1) / 2, planTitleY, 17, pal);

      // ---------------------------------------------------------------------
      // PART B: B 型護岸立面展開圖 (FRONT ELEVATION - 1:1 ALIGNED WITH PLAN VIEW!)
      //    Vertical Bands from top to bottom:
      //    1. Top Grass & Thinning Wood Stakes row (疏伐木立椿 L=80~120cm)
      //    2. Upper Dry Stone Masonry Elevation (H_up = 300cm, 五六圍砌無通縫)
      //    3. Lower Concrete-Grouted Stone Elevation (H_low = 200cm, 長徑60cm以上)
      //       with Channel Bed Pitched Boulders & Concrete Base at bottom (D_bed_sub = 50cm)
      // ---------------------------------------------------------------------
      const yElevTop = planTitleY + 62;
      const hUpElev = p.H_up * s;        // 300 * s
      const hLowElev = p.H_low * s;      // 200 * s
      const hBedElev = p.D_bed_sub * s;  // 50 * s

      const yElevBerm = yElevTop + hUpElev;
      const yElevBase = yElevBerm + hLowElev;
      const yElevBedTop = yElevBase - hBedElev;

      // 1:1 Vertical Alignment Guide Lines between Plan View and Elevation View
      for (let b = 0; b <= N_bay; b++) {
        const gx = x0 + b * bayW;
        cadLine(ctx, gx, yPlanBot + 4, gx, yElevTop - 6, pal.secondaryLine, 0.85, [4, 5], 'ALIGN_GUIDE');
      }

      // Main Elevation Outer Box
      cadPoly(ctx, [
        [x0, yElevTop],
        [x1, yElevTop],
        [x1, yElevBase],
        [x0, yElevBase]
      ], pal.primaryLine, 1.75, true, pal.fillConcrete, [], 'ELEV_OUTLINE');

      // Berm Line (separating 300cm Upper Dry Stone and 200cm Lower Concrete-Stone)
      cadLine(ctx, x0, yElevBerm, x1, yElevBerm, pal.primaryLine, 1.6, [], 'ELEV_BERM');

      // 1) Top Row of Wood Stakes & Grass along yElevTop
      for (let i = 0; i < nStakes; i++) {
        const sx = x0 + (i + 0.5) * (L_draw / nStakes);
        drawWoodStake(ctx, sx, yElevTop - 16 * s, 9 * s, 32 * s, pal);
        if (i % 2 === 1) {
          drawGrassTuft(ctx, sx, yElevTop - 16 * s, pal);
        }
      }

      // 2) Upper 300cm Dry Stone Masonry Face (五六圍砌無通縫, with concentric stone rings)
      drawStaggeredStoneZone(ctx, x0, yElevTop, L_draw, hUpElev, 54 * s, 44 * s, pal, true, 'ELEV_DRY_STONE');

      // 3) Lower 200cm Concrete-Grouted Stone Face (from yElevBerm down to yElevBedTop)
      drawStaggeredStoneZone(ctx, x0, yElevBerm, L_draw, hLowElev - hBedElev, 64 * s, 46 * s, pal, true, 'ELEV_WET_STONE');

      // 4) Bottom 50cm Channel Bed Section in Front of Elevation (Boulder layer + Concrete bed slab)
      const yElevConcTop = yElevBase - hBedElev * (1 - p.kbd);
      cadLine(ctx, x0, yElevBedTop, x1, yElevBedTop, pal.primaryLine, 1.4, [], 'ELEV_BED_TOP');
      cadLine(ctx, x0, yElevConcTop, x1, yElevConcTop, pal.primaryLine, 1.2, [], 'ELEV_CONC_TOP');
      const nElevBedStones = Math.max(6, Math.round(L_tot_cm / 45));
      const ebStep = L_draw / nElevBedStones;
      for (let i = 0; i < nElevBedStones; i++) {
        const bx = x0 + (i + 0.5) * ebStep;
        const by = (yElevBedTop + yElevConcTop) / 2;
        drawOrientedBoulder(ctx, bx, by, ebStep * 0.46, (yElevConcTop - yElevBedTop) * 0.45, 1, 0, 0, 1, i + 120, pal, false, 'ELEV_BED_BOULDER');
      }

      // Vertical Construction / Expansion Bay Joints across Elevation View
      for (let b = 1; b < N_bay; b++) {
        const jx = x0 + b * bayW;
        cadLine(ctx, jx, yElevTop, jx, yElevBase, pal.dimLine, 1.4, [], 'ELEV_BAY_JOINT');
      }

      // Left Vertical Height Dimensions on Elevation View: 300 | 200 (and total H = 500)
      cadDim(ctx, x0, yElevTop, x0, yElevBerm, -22, `${p.H_up}`, pal, 11.5);
      cadDim(ctx, x0, yElevBerm, x0, yElevBase, -22, `${p.H_low}`, pal, 11.5);
      cadDim(ctx, x0 - 26, yElevTop, x0 - 26, yElevBase, -22, `H=${p.H_total_cm}`, pal, 11.5);

      // Right Vertical Bed Depth Dimension: 50
      cadDim(ctx, x1, yElevBedTop, x1, yElevBase, 20, `${p.D_bed_sub}`, pal, 11);

      // Right Side Labels on Elevation View
      cadText(ctx, `← 乾砌石立面 (H=${p.H_up}cm, 五六圍砌)`, x1 + 14, (yElevTop + yElevBerm) / 2, 11, pal.textMain, 'left', '600');
      cadText(ctx, `← 混凝土砌石立面 (H=${p.H_low}cm)`, x1 + 14, (yElevBerm + yElevBedTop) / 2, 11, pal.textMain, 'left', '600');

      const elevTitleY = yElevBase + 36;
      drawDoubleUnderlineTitle(ctx, 'B 型護岸立面展開圖', (x0 + x1) / 2, elevTitleY, 17, pal);

      return {
        rightX: x1 + 230,
        bottomY: elevTitleY + 28
      };
    }

    // Helper: Fill a rectangular region with staggered natural polygonal boulders (五六圍砌無通縫)
    // Strictly calculates column & row counts from fixed stone pitch so stones NEVER stretch!
    function drawStaggeredStoneZone(ctx, x, y, w, h, pitchX, pitchY, pal, withRings, layer) {
      const nRows = Math.max(1, Math.round(h / pitchY));
      const rowH = h / nRows;
      const nColsBase = Math.max(2, Math.round(w / pitchX));
      const colW = w / nColsBase;

      for (let r = 0; r < nRows; r++) {
        const isOdd = (r % 2 === 1);
        const cy = y + (r + 0.5) * rowH;
        const nCols = isOdd ? nColsBase + 1 : nColsBase;

        for (let c = 0; c < nCols; c++) {
          let cx = isOdd ? x + c * colW : x + (c + 0.5) * colW;
          let rx = colW * 0.46;
          // Clamp edge stones on odd rows so they stay strictly inside [x, x+w]
          if (isOdd && c === 0) {
            cx = x + colW * 0.25;
            rx = colW * 0.23;
          } else if (isOdd && c === nCols - 1) {
            cx = x + w - colW * 0.25;
            rx = colW * 0.23;
          }
          const ry = rowH * 0.45;
          drawOrientedBoulder(ctx, cx, cy, rx, ry, 1, 0, 0, 1, r * 31 + c * 17 + 3, pal, withRings, layer);
        }
      }
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

      // Update Sidebar Live Summary
      document.getElementById('stat_H_badge').textContent = `H = ${p.H_total_m.toFixed(2)} m`;
      document.getElementById('stat_conc_m').textContent = `${p.q_concrete.toFixed(2)} M³/m`;
      document.getElementById('stat_form_m').textContent = `${p.q_formwork.toFixed(2)} M²/m`;
      document.getElementById('stat_dry_m').textContent = `${p.q_dry_stone.toFixed(2)} M²/m`;
      document.getElementById('stat_wet_m').textContent = `${p.q_wet_stone.toFixed(2)} M²/m`;
      document.getElementById('stat_L_tot').textContent = p.L_total_m.toFixed(2);
      document.getElementById('stat_total_conc').textContent = `${(p.q_concrete * p.L_total_m).toFixed(2)} M³`;
      document.getElementById('zoom-indicator').textContent = `${Math.round(viewCam.scale * 100)}%`;

      dxfEntities = [];

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.fillStyle = pal.bg;
      ctx.fillRect(0, 0, rect.width, rect.height);

      ctx.translate(viewCam.offsetX, viewCam.offsetY);
      ctx.scale(viewCam.scale, viewCam.scale);

      const sSec = 0.46; // Base scale for Cross-Section view

      if (currentView === 'SECTION_ONLY') {
        const secCenterX = 640;
        const bSec = drawCrossSectionView(ctx, secCenterX, 20, sSec, p, pal);
        const leftTblX = Math.max(30, bSec.leftX);
        const rightTblX = bSec.rightX + 35;
        drawSectionTables(ctx, leftTblX, bSec.yBase + 65, rightTblX, 115, p, pal);
      } else if (currentView === 'PLAN_ELEV') {
        drawPlanAndElevationViews(ctx, 40, 20, p, pal);
      } else {
        // 'ALL': Top = Cross-Section View + Left/Right Tables; Bottom = 1:1 Aligned Plan View & Elevation View
        const secCenterX = 640;
        const bSec = drawCrossSectionView(ctx, secCenterX, 15, sSec, p, pal);
        const leftTblX = Math.max(30, bSec.leftX);
        const rightTblX = bSec.rightX + 35;
        drawSectionTables(ctx, leftTblX, bSec.yBase + 65, rightTblX, 110, p, pal);

        const planElevStartY = bSec.bottomY + 65;
        // Divider dashed line between Sheet Part 1 (Cross-Section) and Sheet Part 2 (Plan & Elevation)
        cadLine(ctx, 30, planElevStartY - 25, rightTblX + 240, planElevStartY - 25, pal.secondaryLine, 1.1, [10, 6], 'SHEET_DIV');
        drawPlanAndElevationViews(ctx, 210, planElevStartY, p, pal);
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

    function resetToOrig() {
      Object.keys(ORIG_REVETMENT_B).forEach(k => {
        const el = document.getElementById('inp_' + k);
        if (el) el.value = ORIG_REVETMENT_B[k];
      });
      renderAll();
    }

    function switchView(view) {
      currentView = view;
      const auditEl = document.getElementById('auditPanel');
      const tabs = {
        ALL: document.getElementById('tab-all'),
        SECTION_ONLY: document.getElementById('tab-sec'),
        PLAN_ELEV: document.getElementById('tab-plan-elev'),
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
      if (currentView === 'SECTION_ONLY') {
        viewCam.scale = Math.min(rect.width / 1480, rect.height / 540) * 0.93;
        viewCam.offsetX = Math.max(20, (rect.width - 1420 * viewCam.scale) / 2);
        viewCam.offsetY = 35;
      } else if (currentView === 'PLAN_ELEV') {
        viewCam.scale = Math.min(rect.width / 920, rect.height / 760) * 0.92;
        viewCam.offsetX = Math.max(30, (rect.width - 780 * viewCam.scale) / 2);
        viewCam.offsetY = 20;
      } else {
        viewCam.scale = Math.min(rect.width / 1500, rect.height / 1260) * 0.94;
        viewCam.offsetX = Math.max(20, (rect.width - 1440 * viewCam.scale) / 2);
        viewCam.offsetY = 15;
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
      a.download = `B型護岸標準圖_H${p.H_total_m.toFixed(2)}m_L${p.L_total_m.toFixed(2)}m.dxf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }

    function exportCSV() {
      const p = getParams();
      const rows = [
        ['B 型護岸橫斷面、平面圖、立面圖 - 參數化尺寸與工作數量計算書'],
        ['參數項目', '設定/推算數值', '單位', '備註說明'],
        ['護岸總高度 H', p.H_total_m.toFixed(2), 'm', `上部乾砌石 ${p.H_up}cm + 下部混凝土砌石 ${p.H_low}cm`],
        ['施工長度 (左右側合計)', p.L_total_m.toFixed(2), 'm', '原圖標準 32.10m'],
        ['左側基座底寬 B_left', p.B_base_L, 'cm', '原圖標準 220cm'],
        ['右側基座底寬 B_right', p.B_base_R, 'cm', '原圖標準 185cm'],
        ['腰部平台寬 (15+110)', p.W_berm_tot, 'cm', '原圖標準 125cm'],
        ['下部背側垂直牆高', p.H_back_vert, 'cm', '原圖標準 140cm (斜肩高 60cm)'],
        ['渠底拋石基盤總深', p.D_bed_sub, 'cm', '原圖標準 50cm (含拋石 30~70cm 與 210 混凝土基座)'],
        [],
        ['【B 型護岸每公尺工作數量 (單側)】', '單位', '每公尺數量 (H=' + p.H_total_m.toFixed(2) + 'm)', `全案總數量 (L=${p.L_total_m.toFixed(2)}m)`],
        ['結構用混凝土 (機拌210 kgf/cm²)', 'M³', p.q_concrete.toFixed(2), (p.q_concrete * p.L_total_m).toFixed(2)],
        ['場鑄結構混凝土用模板 (金屬模板,背撐鋼板)', 'M²', p.q_formwork.toFixed(2), (p.q_formwork * p.L_total_m).toFixed(2)],
        ['乾砌排石 (長徑70~90cm)', 'M²', p.q_pitched_stone.toFixed(2), (p.q_pitched_stone * p.L_total_m).toFixed(2)],
        ['乾砌石 (長徑40~110cm)', 'M²', p.q_dry_stone.toFixed(2), (p.q_dry_stone * p.L_total_m).toFixed(2)],
        ['混凝土砌石 (長徑60cm以上)', 'M²', p.q_wet_stone.toFixed(2), (p.q_wet_stone * p.L_total_m).toFixed(2)],
        ['生態護坡 (疏伐木利用)', 'M', p.q_eco_stake.toFixed(2), (p.q_eco_stake * p.L_total_m).toFixed(2)],
        [],
        ['註：本工程渠底拋石，以滿鋪為原則再進行表面修飾以求平整。']
      ];

      const csvContent = '\uFEFF' + rows.map(r => r.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `B型護岸工作數量計算書_H${p.H_total_m.toFixed(2)}m.csv`;
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
  function cadCircle(ctx, cx, cy, r, color, width, fill, layer) { O.push({ k: 'C', x: cx, y: -cy, r, c: color, f: fill || null, w: width || 1.2, ly: layer || '0' }); }
  const __n = (k, d) => { const v = parseFloat(RR ? RR[k] : undefined); return Number.isFinite(v) ? v : d; };
  function model(R) {
    RR = R || {};
    const H_low = Math.max(80, __n('H_low', 200)), D_bed = Math.max(20, __n('D_bed_sub', 50)), Hm = __n('H', 4.5), H_up = Math.max(30, Math.round((Hm * 100 - H_low + D_bed) * 10) / 10);
    const m_up = Math.max(0.3, __n('m_up', 1)), m_low = Math.max(0.05, __n('m_low', 0.3)), W_st = Math.max(20, __n('W_stone_low', 50)), dxl = H_low * m_low, dxu = H_up * m_up;
    const W_berm = Math.max(dxl + W_st, __n('W_berm_tot', 125)), B = Math.max(W_berm + 1, __n('B_base', 220)), Hv = Math.min(H_low - 10, Math.max(20, __n('H_back_vert', 140)));
    const kbd = Math.min(0.95, Math.max(0.05, __n('kbd', 0.54))), dt = __n('dt', 52), dtr = __n('dtr', 0.65), e = Math.max(0, __n('e', 3.8)) * 100;
    const p = { H_up, H_low, H_back_vert: Hv, D_bed_sub: D_bed, m_up, m_low, B_base_L: B, B_base_R: B, W_stone_low: W_st, W_berm_tot: W_berm, W_bed: Math.max(200, Math.min(1600, 2 * e)), L_total_m: __n('L_tot', 10),
      L_draw_cm: Math.max(200, __n('L_draw', 600)), N_bay: Math.max(1, Math.min(10, Math.round(__n('N_bay', 3)))), L_stake: __n('L_stake', 100), kbd, dt, dtr, stake_sp: __n('stake_sp', 38) };
    p.H_shoulder = H_low - Hv; p.H_total_cm = H_up + H_low; p.H_total_m = +(p.H_total_cm / 100).toFixed(2); p.W_berm_lip = W_berm - dxl - W_st; p.W_berm_slope = B - W_berm;
    p.nDryStonesPerSide = Math.max(3, Math.round(H_up * Math.hypot(1, m_up) / __n('sd_dry', 47))); p.nWetStonesPerSide = Math.max(2, Math.round(H_low * Math.hypot(1, m_low) / __n('sd_wet', 35))); p.nBedBoulders = Math.max(5, Math.round(p.W_bed / __n('sd_bed', 44)));
    // 單側斷面（cm）：x＝自牆腳底往岸側，z＝自牆底向上
    const band = [[0, 0], [W_st, 0], [dxl + W_st, H_low], [dxl, H_low]], conc = [[W_st, 0], [B, 0], [B, Hv], [W_berm, H_low], [dxl + W_st, H_low]];
    const kS = Math.hypot(1, m_up), t0 = dt * kS, t1 = dt * dtr * kS, dry = [[W_berm, H_low], [W_berm + dxu, H_low + H_up], [W_berm + dxu + t1, H_low + H_up], [W_berm + t0, H_low]];
    const Dc = D_bed * (1 - kbd), slab = [[-e, 0], [0, 0], [m_low * Dc, Dc], [-e, Dc]], rip = [[-e, Dc], [m_low * Dc, Dc], [m_low * D_bed, D_bed], [-e, D_bed]];
    const A = q => __A(q) / 1e4, bed = String(__n('bed', 1)) !== '0';
    const Q = { conc: A(conc), form: Hv / 100, pitch: __n('q_pitch', 0.8), dry: H_up * kS / 100, wet: H_low * Math.hypot(1, m_low) / 100, eco: 1, slab: bed ? A(slab) : 0, rip: bed ? A(rip) : 0, Acb: A(band), Adry: A(dry) };
    Object.assign(p, { q_concrete: Q.conc, q_formwork: Q.form, q_pitched_stone: Q.pitch, q_dry_stone: Q.dry, q_wet_stone: Q.wet, q_eco_stake: Q.eco });
    RR = null; return { p, band, conc, dry, slab, rip, Q, e, dxl, dxu, W_berm, B, Hv, H_low, H_up, D_bed, Dc, m_low, m_up, bed, t0, t1 };
  }
  function prims(m) {
    O = []; const p = m.p, s = 0.46, sc = 1 / s;
    const bSec = drawCrossSectionView(CTX, 640, 15, s, p, PAL), lx = Math.max(30, bSec.leftX), rx = bSec.rightX + 35;
    drawSectionTables(CTX, lx, bSec.bottomY + 20, rx, 110, p, PAL);
    const y0 = bSec.bottomY + 20 + 80 + 70; cadLine(CTX, 30, y0 - 25, rx + 240, y0 - 25, PAL.secondaryLine, 1.1, [10, 6], 'SHEET_DIV');
    const bP = drawPlanAndElevationViews(CTX, 210, y0, p, PAL);
    // 補標註：量測值（斷面積、斜長）
    const Q = m.Q, f = (v, n) => (+v).toFixed(n === undefined ? 2 : n), ty = y0 + 20, nx = bP.rightX + 20;
    const N = [`本系統依本段參數繪製（兩岸同尺寸）；斷面量測（單側，每公尺）：`, `背側混凝土斷面積 ${f(Q.conc, 3)} m²（扣臨水面 ${p.W_stone_low} cm 混凝土砌石帶 ${f(Q.Acb, 3)} m²）`,
      `乾砌石斜長 ${f(Q.dry, 3)} m＝${f(p.H_up / 100)}×√(1+${p.m_up}²)；混凝土砌石斜長 ${f(Q.wet, 3)} m＝${f(p.H_low / 100)}×√(1+${p.m_low}²)；背側模板＝直立段 ${f(m.Hv / 100)} m`,
      `乾砌石斷面積 ${f(Q.Adry, 3)} m²（厚 ${p.dt}→${f(p.dt * p.dtr, 1)} cm）；乾砌排石 ${f(Q.pitch)} m²/m 為原圖數量表值（圖面未繪位置）`,
      `渠底拋石（厚 ${f(m.D_bed - m.Dc, 1)} cm）與 210 混凝土底版（厚 ${f(m.Dc, 1)} cm）：圖面照原圖示意，不計入護岸數量（另計）`];
    N.forEach((t, i) => cadText(CTX, t, nx, ty + i * 20, 11.5, '#fde047', 'left', '600', 0, 'NOTE'));
    return O.map(o => { const q = Object.assign({}, o); if (q.p) q.p = q.p.map(([x, y]) => [x * sc, y * sc]); if (q.x !== undefined) { q.x *= sc; q.y *= sc; } if (q.r) q.r *= sc; if (q.h) q.h *= sc; return q; });
  }
  function __A(p) { let s = 0; for (let i = 0; i < p.length; i++) { const a = p[i], b = p[(i + 1) % p.length]; s += a[0] * b[1] - b[0] * a[1]; } return Math.abs(s) / 2; }


  function cadLine(ctx, x1, y1, x2, y2, color, width, dash, layer) { O.push({ k: 'L', p: [[x1, -y1], [x2, -y2]], c: color, w: width || 1.3, d: dash || [], ly: layer || '0' }); }
  function cadPoly(ctx, pts, color, width, close, fill, dash, layer) { if (!pts || pts.length < 2) return; O.push({ k: 'P', p: pts.map(q => [q[0], -q[1]]), c: color, w: width || 1.5, f: fill || null, cl: close !== false, d: dash || [], ly: layer || '0' }); }
  function cadText(ctx, str, x, y, size, color, align, weight, angleDeg, layer) { O.push({ k: 'T', x, y: -y, s: String(str), h: (size || 12) * 1.05, c: color || '#f8fafc', al: align || 'left', bl: 'middle', rot: -(angleDeg || 0) * Math.PI / 180, ly: layer || 'TEXT' }); }

  return { model, prims };
})();
