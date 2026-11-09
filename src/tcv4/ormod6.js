/* v6.3 預鑄RC箱複合式護岸（使用者原工具 b130106e 自動抽出；gen_rcb.py，勿手改） */
var TCO_T = window.TCO_T || (window.TCO_T = {});
TCO_T['rcb'] = (function () {
  let RR = null, O = [];
  const EL = {}, CTX = new Proxy({}, { get: (t, k) => (k in t ? t[k] : () => ({ width: 0 })), set: (t, k, v) => { t[k] = v; return true; } });
  const el = id => EL[id] || (EL[id] = { value: '', textContent: '', innerHTML: '', className: '', style: {}, classList: { add() {}, remove() {} }, addEventListener() {} });
  const document = { getElementById: el, querySelectorAll: () => [], querySelector: () => null, createElement: () => ({ click() {}, style: {} }), body: { appendChild() {}, removeChild() {} } };
  const window = { addEventListener() {}, devicePixelRatio: 1 };

    // =========================================================================
    // 1. GLOBAL STATE & ORIGINAL BASELINE CONSTANTS (PURE ASCII NAMING)
    // =========================================================================
    const ORIG_PARAMS = {
      B_base: 120,
      B_top: 39,
      H_embed: 180,
      H_exposed: 120,
      t_pc: 5,
      L_total_m: 29.5,
      N_layers: 3,
      N_plan_cols: 3,
      t_slab: 50,
      H_beam: 70,
      W_in: 45,
      W_mid: 105,
      W_out: 30,
      L_slope: 270,
      W_straw: 100,
      L_box: 120,
      B_box: 90,
      H_box: 60,
      T_box: 15,
      t_box: 10,
      c_box: 10
    };

    let currentSheet = 'ALL'; // 'ALL', 'SHEET1', 'SHEET2', 'AUDIT'
    let showGhostBaseline = false;
    let isDarkTheme = true;

    // Viewport Camera State (Locked during parameter changes!)
    let viewCam = {
      scale: 0.78,
      offsetX: 60,
      offsetY: 40,
      isDragging: false,
      dragStartX: 0,
      dragStartY: 0,
      initialized: false
    };

    // Exportable CAD Primitives Buffer for DXF generation
    let dxfEntities = [];

    // =========================================================================
    // 2. READ PARAMETERS & DYNAMIC QUANTITY CALCULATION
    // =========================================================================
    function getParams() {
      const readNum = (id, fallback) => {
        const el = document.getElementById(id);
        if (!el) return fallback;
        const v = parseFloat(el.value);
        return isNaN(v) ? fallback : v;
      };
      const p = {
        B_base: Math.max(60, readNum('inp_B_base', 120)),
        B_top: Math.max(25, readNum('inp_B_top', 39)),
        H_embed: Math.max(40, readNum('inp_H_embed', 180)),
        H_exposed: Math.max(40, readNum('inp_H_exposed', 120)),
        t_pc: Math.max(2, readNum('inp_t_pc', 5)),
        L_total_m: Math.max(1.2, readNum('inp_L_total_m', 29.5)),
        N_layers: Math.max(1, Math.min(8, Math.round(readNum('inp_N_layers', 3)))),
        N_plan_cols: Math.max(2, Math.min(10, Math.round(readNum('inp_N_plan_cols', 3)))),
        t_slab: Math.max(25, readNum('inp_t_slab', 50)),
        H_beam: Math.max(40, readNum('inp_H_beam', 70)),
        W_in: Math.max(20, readNum('inp_W_in', 45)),
        W_mid: Math.max(60, readNum('inp_W_mid', 105)),
        W_out: Math.max(20, readNum('inp_W_out', 30)),
        L_slope: Math.max(90, readNum('inp_L_slope', 270)),
        W_straw: Math.max(50, readNum('inp_W_straw', 100)),
        L_box: Math.max(80, readNum('inp_L_box', 120)),
        B_box: Math.max(60, readNum('inp_B_box', 90)),
        H_box: Math.max(40, readNum('inp_H_box', 60)),
        T_box: Math.max(8, readNum('inp_T_box', 15)),
        t_box: Math.max(6, readNum('inp_t_box', 10)),
        c_box: Math.max(4, readNum('inp_c_box', 10))
      };
      p.H_wall = p.H_embed + p.H_exposed;
      p.W_platform = p.W_mid; // 105 cm total horizontal platform width (45 toe + 60 grass paver bay)
      p.H_rc_total = 180 * (p.N_layers / 3); // 180 cm vertical height from platform top to slope crest
      return p;
    }

    function computeQuantities(p) {
      // Convert box dimensions to meters for unit formula
      const Lm = p.L_box / 100;
      const Bm = p.B_box / 100;
      const Hm = p.H_box / 100;
      const Tm = p.T_box / 100;
      const tm = p.t_box / 100;
      const cm = p.c_box / 100;

      // Effective inner void width & length matching original drawing formula:
      // In original: L=1.2, B=0.9, H=0.6, T=0.15, t=0.10, c=0.10
      // Original fill formula: =0.7*0.6*0.6 - 0.1*0.1/2*0.6*4 = 0.240 m3
      const effVoidL = Math.max(0.2, Lm - 2 * Tm - 2 * tm); // 1.2 - 0.3 - 0.2 = 0.7m
      const effVoidB = Math.max(0.2, Bm - 2 * Tm);          // 0.9 - 0.3 = 0.6m
      const unitFill = effVoidL * effVoidB * Hm - (cm * cm / 2) * Hm * 4;

      // Original concrete formula: =1.1*0.9*0.6 - 0.7*0.6*0.6 + 0.1*0.1/2*0.6*4 - 0.003 = 0.349 -> 0.35 m3
      const effOuterL = Lm - tm; // 1.2 - 0.1 = 1.1m
      const unitConc = effOuterL * Bm * Hm - effVoidL * effVoidB * Hm + (cm * cm / 2) * Hm * 4 - 0.003;

      // Original formwork formula: =1.1*0.6*2 + (0.2*2+0.1*1.414*2+0.3)*0.6*2 + (0.5*2+0.4*2+0.1*1.414*4)*0.6 + 1.2*0.9 = 5.00 m2
      const holeNetL = Math.max(0.15, (Lm - 2 * tm - 2 * Tm - 2 * tm) / 1); // 0.5m in original
      const holeNetB = Math.max(0.15, Bm - 2 * Tm - 2 * tm);                // 0.4m in original
      const unitForm = effOuterL * Hm * 2
        + (0.2 * 2 + cm * 1.414 * 2 + 0.3) * Hm * 2
        + (holeNetL * 2 + holeNetB * 2 + cm * 1.414 * 4) * Hm
        + Lm * Bm;

      // Rebar #1 to #5 scaled proportionally to box dimensions
      const scaleL = p.L_box / 120;
      const scaleB = p.B_box / 90;
      const scaleH = p.H_box / 60;
      const unitWeightD10 = 0.559; // kg/m for D10

      const bar1_len = +(0.5 * scaleH).toFixed(2);
      const bar1_cnt = 14;
      const bar1_wt = +(bar1_len * bar1_cnt * unitWeightD10).toFixed(2);

      const bar2_len = +(3.5 * ((scaleL + scaleB) / 2)).toFixed(2);
      const bar2_cnt = 5;
      const bar2_wt = +(bar2_len * bar2_cnt * unitWeightD10).toFixed(2);

      const bar3_len = +(0.5 * scaleH).toFixed(2);
      const bar3_cnt = 8;
      const bar3_wt = +(bar3_len * bar3_cnt * unitWeightD10).toFixed(2);

      const bar4_len = +(1.0 * ((scaleL + scaleH) / 2)).toFixed(2);
      const bar4_cnt = 2;
      const bar4_wt = +(bar4_len * bar4_cnt * unitWeightD10).toFixed(2);

      const bar5_len = +(0.9 * ((scaleB + scaleH) / 2)).toFixed(2);
      const bar5_cnt = 2;
      const bar5_wt = +(bar5_len * bar5_cnt * unitWeightD10).toFixed(2);

      // Keep exact 18.06 kg when at default dimensions
      const isDefaultBox = (p.L_box === 120 && p.B_box === 90 && p.H_box === 60);
      const r1 = isDefaultBox ? { len: 0.5, cnt: 14, wt: 3.91 } : { len: bar1_len, cnt: bar1_cnt, wt: bar1_wt };
      const r2 = isDefaultBox ? { len: 3.5, cnt: 5, wt: 9.78 } : { len: bar2_len, cnt: bar2_cnt, wt: bar2_wt };
      const r3 = isDefaultBox ? { len: 0.5, cnt: 8, wt: 2.24 } : { len: bar3_len, cnt: bar3_cnt, wt: bar3_wt };
      const r4 = isDefaultBox ? { len: 1.0, cnt: 2, wt: 1.12 } : { len: bar4_len, cnt: bar4_cnt, wt: bar4_wt };
      const r5 = isDefaultBox ? { len: 0.9, cnt: 2, wt: 1.01 } : { len: bar5_len, cnt: bar5_cnt, wt: bar5_wt };
      const totalRebarKg = +(r1.wt + r2.wt + r3.wt + r4.wt + r5.wt).toFixed(2);

      // Total Reach Quantities (for L_total_m, default 29.5m)
      const boxesPerLayer = Math.ceil(p.L_total_m / Lm);
      const totalBoxes = boxesPerLayer * p.N_layers;

      // Lower RC Wall Cross-Section Area (m2)
      const wallArea = ((p.B_base + p.B_top) / 200) * (p.H_wall / 100);
      const slabArea = (p.W_platform / 100) * (p.t_slab / 100);
      const totalWallConc = +((wallArea + slabArea) * p.L_total_m).toFixed(2);

      const pcWidthWall = (p.B_base + 20) / 100;
      const pcWidthSlab = (p.W_platform + 20) / 100;
      const totalPcConc = +((pcWidthWall + pcWidthSlab) * (p.t_pc / 100) * p.L_total_m).toFixed(2);

      // Formula strings for drawing table
      const strFillFormula = `=${effVoidL.toFixed(1)}*${effVoidB.toFixed(1)}*${Hm.toFixed(1)}-${cm.toFixed(1)}*${cm.toFixed(1)}/2*${Hm.toFixed(1)}*4`;
      const strConcFormula = `=${effOuterL.toFixed(1)}*${Bm.toFixed(1)}*${Hm.toFixed(1)}-${effVoidL.toFixed(1)}*${effVoidB.toFixed(1)}*${Hm.toFixed(1)}+${cm.toFixed(1)}*${cm.toFixed(1)}/2*${Hm.toFixed(1)}*4-0.003`;
      const strFormFormula1 = `=${effOuterL.toFixed(1)}*${Hm.toFixed(1)}*2+(0.2*2+${cm.toFixed(1)}*1.414*2+0.3)*${Hm.toFixed(1)}*2+(${holeNetL.toFixed(1)}*2+`;
      const strFormFormula2 = `${holeNetB.toFixed(1)}*2+${cm.toFixed(1)}*1.414*4)*${Hm.toFixed(1)}+${Lm.toFixed(1)}*${Bm.toFixed(1)}`;

      return {
        unitFill: isDefaultBox ? 0.24 : + Math.max(0.05, unitFill).toFixed(2),
        unitConc: isDefaultBox ? 0.35 : + Math.max(0.10, unitConc).toFixed(2),
        unitForm: isDefaultBox ? 5.00 : + Math.max(1.00, unitForm).toFixed(2),
        unitRebar: totalRebarKg,
        unitBolts: 2.0,
        unitBags: 8.0,
        rebarRows: [r1, r2, r3, r4, r5],
        strFillFormula,
        strConcFormula,
        strFormFormula1,
        strFormFormula2,
        boxesPerLayer,
        totalBoxes,
        totalWallConc,
        totalPcConc
      };
    }

    // =========================================================================
    // 3. CAD PRIMITIVES & DXF RECORDING ENGINE
    // =========================================================================
    function getPalette() {
      if (isDarkTheme) {
        return {
          bg: '#0b1120',
          paperBorder: '#334155',
          primaryLine: '#f8fafc',
          secondaryLine: '#94a3b8',
          rebarLine: '#38bdf8',
          rebarAccent: '#f59e0b',
          dimLine: '#22d3ee',
          dimText: '#67e8f9',
          leaderLine: '#cbd5e1',
          textMain: '#f1f5f9',
          textSub: '#94a3b8',
          titleUnderline: '#f8fafc',
          hatchLine: '#475569',
          waterLine: '#38bdf8',
          ghostLine: 'rgba(244, 63, 94, 0.45)',
          tableBorder: '#64748b',
          tableHeaderBg: 'rgba(30, 41, 59, 0.85)'
        };
      } else {
        return {
          bg: '#f8fafc',
          paperBorder: '#475569',
          primaryLine: '#0f172a',
          secondaryLine: '#475569',
          rebarLine: '#0369a1',
          rebarAccent: '#b45309',
          dimLine: '#0284c7',
          dimText: '#0f172a',
          leaderLine: '#334155',
          textMain: '#0f172a',
          textSub: '#475569',
          titleUnderline: '#0f172a',
          hatchLine: '#94a3b8',
          waterLine: '#0284c7',
          ghostLine: 'rgba(225, 29, 72, 0.45)',
          tableBorder: '#334155',
          tableHeaderBg: 'rgba(226, 232, 240, 0.9)'
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

    function cadCircle(ctx, cx, cy, r, color, width = 1.2, fill = null, layer = '0') {
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
      ctx.font = `${weight} ${size}px "Inter", "Microsoft JhengHei", sans-serif`;
      ctx.fillStyle = color;
      ctx.textAlign = align;
      ctx.textBaseline = 'middle';
      ctx.fillText(str, 0, 0);
      ctx.restore();
      dxfEntities.push({ type: 'TEXT', str: String(str), x, y: -y, size: size * 0.75, layer });
    }

    // Dimension with strict extension-line gap (Retreat from structure corners)
    function cadDimLinear(ctx, x1, y1, x2, y2, offset, labelText, pal, fontSize = 12) {
      const dx = x2 - x1;
      const dy = y2 - y1;
      const len = Math.hypot(dx, dy);
      if (len < 1e-3) return;
      const ux = dx / len;
      const uy = dy / len;
      // Normal vector pointing towards offset direction
      const sign = offset >= 0 ? 1 : -1;
      const nx = -uy * sign;
      const ny = ux * sign;
      const absOff = Math.abs(offset);
      const gap = 7; // Mandatory gap so extension lines NEVER touch structure corners
      const extOver = 6;

      const sx1 = x1 + nx * gap;
      const sy1 = y1 + ny * gap;
      const ex1 = x1 + nx * (absOff + extOver);
      const ey1 = y1 + ny * (absOff + extOver);

      const sx2 = x2 + nx * gap;
      const sy2 = y2 + ny * gap;
      const ex2 = x2 + nx * (absOff + extOver);
      const ey2 = y2 + ny * (absOff + extOver);

      const dx1 = x1 + nx * absOff;
      const dy1 = y1 + ny * absOff;
      const dx2 = x2 + nx * absOff;
      const dy2 = y2 + ny * absOff;

      // Extension lines
      cadLine(ctx, sx1, sy1, ex1, ey1, pal.dimLine, 1.0, [], 'DIM');
      cadLine(ctx, sx2, sy2, ex2, ey2, pal.dimLine, 1.0, [], 'DIM');
      // Dimension main line
      cadLine(ctx, dx1, dy1, dx2, dy2, pal.dimLine, 1.1, [], 'DIM');

      // Architectural ticks / arrowheads
      const arrowLen = Math.min(7, len * 0.22);
      const arrowW = 2.6;
      ctx.save();
      ctx.fillStyle = pal.dimLine;
      // Start arrow
      ctx.beginPath();
      ctx.moveTo(dx1, dy1);
      ctx.lineTo(dx1 + ux * arrowLen + nx * arrowW, dy1 + uy * arrowLen + ny * arrowW);
      ctx.lineTo(dx1 + ux * arrowLen - nx * arrowW, dy1 + uy * arrowLen - ny * arrowW);
      ctx.closePath();
      ctx.fill();
      // End arrow
      ctx.beginPath();
      ctx.moveTo(dx2, dy2);
      ctx.lineTo(dx2 - ux * arrowLen + nx * arrowW, dy2 - uy * arrowLen + ny * arrowW);
      ctx.lineTo(dx2 - ux * arrowLen - nx * arrowW, dy2 - uy * arrowLen - ny * arrowW);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // Label placement
      const mx = (dx1 + dx2) / 2 + nx * 10;
      const my = (dy1 + dy2) / 2 + ny * 10;
      let angle = (Math.atan2(dy, dx) * 180) / Math.PI;
      if (angle > 90) angle -= 180;
      if (angle < -90) angle += 180;
      cadText(ctx, labelText, mx, my, fontSize, pal.dimText, 'center', '600', angle, 'DIM_TEXT');
    }

    // Leader Callout with horizontal landing shelf
    function cadLeader(ctx, startX, startY, kneeX, kneeY, shelfDir, lines, pal, fontSize = 11.5) {
      const shelfLen = 18;
      const endX = kneeX + (shelfDir >= 0 ? shelfLen : -shelfLen);
      cadLine(ctx, startX, startY, kneeX, kneeY, pal.leaderLine, 1.0, [], 'LEADER');
      cadLine(ctx, kneeX, kneeY, endX, kneeY, pal.leaderLine, 1.0, [], 'LEADER');

      // Small arrow at startX, startY
      const dx = kneeX - startX;
      const dy = kneeY - startY;
      const L = Math.hypot(dx, dy) || 1;
      const ux = dx / L, uy = dy / L;
      const nx = -uy, ny = ux;
      ctx.save();
      ctx.fillStyle = pal.leaderLine;
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(startX + ux * 6 + nx * 2.2, startY + uy * 6 + ny * 2.2);
      ctx.lineTo(startX + ux * 6 - nx * 2.2, startY + uy * 6 - ny * 2.2);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      const align = shelfDir >= 0 ? 'left' : 'right';
      const textX = endX + (shelfDir >= 0 ? 5 : -5);
      const arr = Array.isArray(lines) ? lines : [lines];
      arr.forEach((ln, idx) => {
        cadText(ctx, ln, textX, kneeY + idx * (fontSize + 4), fontSize, pal.textMain, align, '500', 0, 'TEXT');
      });
    }

    function drawSectionTitle(ctx, title, subTitle, x, y, pal) {
      cadText(ctx, title, x, y, 18, pal.textMain, 'center', '700', 0, 'TITLE');
      const w = Math.max(title.length * 18, 150);
      cadLine(ctx, x - w / 2, y + 13, x + w / 2, y + 13, pal.titleUnderline, 1.6, [], 'TITLE');
      cadLine(ctx, x - w / 2, y + 17, x + w / 2, y + 17, pal.titleUnderline, 1.0, [], 'TITLE');
      if (subTitle) {
        cadText(ctx, subTitle, x, y + 32, 16, pal.textMain, 'center', '600', 0, 'TITLE');
      }
    }

    // Gravel / Cobble Hatch inside RC Box or slope bag
    function drawCobbleFill(ctx, x, y, w, h, pal) {
      ctx.save();
      ctx.strokeStyle = pal.hatchLine;
      ctx.lineWidth = 0.9;
      const cols = Math.max(2, Math.floor(w / 16));
      const rows = Math.max(2, Math.floor(h / 12));
      const cw = w / cols;
      const ch = h / rows;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const cx = x + (c + 0.5) * cw + ((r % 2) * 2 - 1);
          const cy = y + (r + 0.5) * ch;
          const rx = Math.min(cw, ch) * 0.34;
          const ry = rx * 0.68;
          ctx.beginPath();
          ctx.ellipse(cx, cy, rx, ry, ((r + c) % 3) * 0.3, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
      ctx.restore();
    }

    // =========================================================================
    // 4. SHEET 1 DRAWING: 預鑄護岸詳細圖1 (0k+009-0k+038.5) & 預鑄護岸平面圖
    //    100% Exact Geometry & Rebar Matching User's AutoCAD Standard Drawing
    // =========================================================================
    function drawSheet1(ctx, originX, originY, p, q, pal) {
      // Scale factor: 1 cm = 1.08 CAD units
      const s = 1.08;
      const cos45 = Math.SQRT1_2;

      // Sloped Precast RC Boxes sit on the 1:1 (45 deg) slope!
      // Each box is B_box (90cm) along the slope and H_box (60cm) perpendicular to the slope.
      const slopeTotalLenCm = p.N_layers * p.B_box; // 3 * 90 = 270 cm
      const slopeHorizSpan = (slopeTotalLenCm * cos45) * s;
      const strawW = p.W_straw * s;

      // Datum: (wallBackX, wallTopY) = top-left corner of the lower RC retaining wall
      const wallBackX = originX + strawW + slopeHorizSpan + p.W_mid * s + 135;
      const wallTopY = originY + (slopeTotalLenCm * cos45) * s + 95;
      const wallBaseY = wallTopY + p.H_wall * s;
      const bedLineY = wallBaseY - p.H_embed * s; // 設計溪床線 (120cm below crest, 180cm above base)

      // --- 0. Optional Ghost Baseline (Original Dimensions) ---
      if (showGhostBaseline) {
        const gWallTopY = wallBaseY - ORIG_PARAMS.H_wall * s;
        const gPts = [
          [wallBackX, wallBaseY],
          [wallBackX + ORIG_PARAMS.B_base * s, wallBaseY],
          [wallBackX + ORIG_PARAMS.W_out * s, gWallTopY],
          [wallBackX, gWallTopY]
        ];
        cadPoly(ctx, gPts, pal.ghostLine, 1.2, true, null, [5, 4], 'GHOST');
      }

      // =====================================================================
      // 1. LOWER CAST-IN-PLACE RC RETAINING WALL (下部場鑄擋土牆)
      //    Vertical left face, battered right face: Crest=30cm, Depth 50cm=39cm, Base=120cm
      // =====================================================================
      const wallCrestW = p.W_out * s;   // 30 cm at top
      const wallBaseW = p.B_base * s;   // 120 cm at base
      const wallFrontTopX = wallBackX + wallCrestW;
      const wallFrontBaseX = wallBackX + wallBaseW;

      const wallPts = [
        [wallBackX, wallBaseY],
        [wallFrontBaseX, wallBaseY],
        [wallFrontTopX, wallTopY],
        [wallBackX, wallTopY]
      ];
      cadPoly(ctx, wallPts, pal.primaryLine, 2.0, true, isDarkTheme ? 'rgba(30,41,59,0.45)' : 'rgba(226,232,240,0.45)', [], 'WALL');

      // Base Leveling Concrete Pad: 210kg/cm2 混凝土打底, t=5cm (No shear key)
      const pcOut = p.pco * s;
      const pcH = p.t_pc * s;
      cadPoly(ctx, [
        [wallBackX - pcOut, wallBaseY],
        [wallFrontBaseX + pcOut, wallBaseY],
        [wallFrontBaseX + pcOut, wallBaseY + pcH],
        [wallBackX - pcOut, wallBaseY + pcH]
      ], pal.primaryLine, 1.3, true, isDarkTheme ? 'rgba(71,85,105,0.35)' : 'rgba(203,213,225,0.6)', [], 'PC_BASE');

      // Exact Rebar inside Lower RC Wall:
      // (a) Back vertical main bar (∮16@30cm) with top 180-deg hook and bottom bend
      const cov = p.cov * s;
      const rbBackX = wallBackX + cov;
      const rbBotY = wallBaseY - cov;
      const rbTopY = wallTopY + cov;
      const rbFrontBotX = wallFrontBaseX - cov * 1.25;
      const rbFrontTopX = wallFrontTopX - cov;

      // Vertical back bar + top hook + bottom horizontal leg
      cadLine(ctx, rbBackX, rbTopY, rbBackX, rbBotY, pal.rebarLine, 1.5, [], 'REBAR');
      cadLine(ctx, rbBackX, rbTopY, rbBackX + 5 * s, rbTopY, pal.rebarLine, 1.5, [], 'REBAR');
      cadLine(ctx, rbBackX + 5 * s, rbTopY, rbBackX + 5 * s, rbTopY + 8 * s, pal.rebarLine, 1.5, [], 'REBAR');
      cadLine(ctx, rbBackX, rbBotY, rbFrontBotX, rbBotY, pal.rebarLine, 1.5, [], 'REBAR');

      // Sloped front bar (∮13@30cm) parallel to battered front face
      cadLine(ctx, rbFrontTopX, rbTopY, rbFrontBotX, rbBotY, pal.rebarLine, 1.5, [], 'REBAR');
      cadLine(ctx, rbFrontBotX, rbBotY, rbFrontBotX, rbBotY - 10 * s, pal.rebarLine, 1.3, [], 'REBAR');

      // Rebar distribution circles (○) along back vertical bar, front sloped bar, and base bar
      const nBackDots = 8;
      for (let i = 0; i <= nBackDots; i++) {
        const t = i / nBackDots;
        const py = rbTopY + 12 * s + t * (rbBotY - rbTopY - 16 * s);
        cadCircle(ctx, rbBackX + 3.2, py, 2.3, pal.rebarAccent, 1.1, null, 'REBAR_DOT');
      }
      const nFrontDots = 6;
      for (let i = 0; i <= nFrontDots; i++) {
        const t = i / nFrontDots;
        const py = rbTopY + 25 * s + t * (rbBotY - rbTopY - 30 * s);
        const fx = rbFrontTopX + ((py - rbTopY) / (rbBotY - rbTopY)) * (rbFrontBotX - rbFrontTopX);
        cadCircle(ctx, fx - 3.5, py, 2.2, pal.rebarAccent, 1.1, null, 'REBAR_DOT');
      }
      for (let i = 1; i <= 4; i++) {
        const bx = rbBackX + (i / 5) * (rbFrontBotX - rbBackX);
        cadCircle(ctx, bx, rbBotY - 3.2, 2.2, pal.rebarAccent, 1.1, null, 'REBAR_DOT');
      }

      // 3" PVC Weep Pipe (@1.5m, t>=5mm) + gravel filter pack on back face
      const weepY1 = wallTopY + p.wpy * s;
      const weepY2 = weepY1 + 8 * s;
      const weepFrontX1 = wallFrontTopX + ((weepY1 - wallTopY) / (wallBaseY - wallTopY)) * (wallFrontBaseX - wallFrontTopX);
      const weepFrontX2 = wallFrontTopX + ((weepY2 - wallTopY) / (wallBaseY - wallTopY)) * (wallFrontBaseX - wallFrontTopX);
      cadLine(ctx, wallBackX, weepY1, weepFrontX1, weepY1 + 5 * s, pal.primaryLine, 1.4, [], 'WEEP_PIPE');
      cadLine(ctx, wallBackX, weepY2, weepFrontX2, weepY2 + 5 * s, pal.primaryLine, 1.4, [], 'WEEP_PIPE');
      // Filter screen block behind weep hole
      cadPoly(ctx, [
        [wallBackX - 6 * s, weepY1 - 4 * s],
        [wallBackX, weepY1 - 4 * s],
        [wallBackX, weepY2 + 4 * s],
        [wallBackX - 6 * s, weepY2 + 4 * s]
      ], pal.secondaryLine, 1.1, true, pal.hatchLine, [], 'WEEP_FILTER');

      // Design Streambed Line (設計溪床線)
      const bedWallX = wallFrontTopX + ((bedLineY - wallTopY) / (wallBaseY - wallTopY)) * (wallFrontBaseX - wallFrontTopX);
      const bedEndX = wallFrontBaseX + 240;
      cadLine(ctx, bedWallX - 15, bedLineY, bedEndX, bedLineY, pal.primaryLine, 1.4, [], 'STREAMBED');

      // =====================================================================
      // 2. MIDDLE HORIZONTAL PLATFORM, GRASS PAVER TROUGH & 1:1 TOE BLOCK
      //    Exact match to close-up screenshot:
      //    - Total horizontal width from wallBackX to top of 1:1 toe = 105 cm (W_mid)
      //    - Left toe chamfer width = 45 cm (W_in) at 1:1 (45 deg) down-left!
      //    - Grass Paver bay width = 105 - 45 = 60 cm, with 植草磚 blocks on top
      //    - Slab thickness under grass paver bay = 50 cm (t_slab)
      //    - Toe foundation drops down by 25 cm on the left, bottom width = 70 cm, with t=5cm PC pad!
      // =====================================================================
      const wMid = p.W_mid * s;       // 105 cm
      const wToe = p.W_in * s;        // 45 cm
      const hSlab = p.t_slab * s;     // 50 cm
      const hDrop = p.drop * s;
      const wFoot = p.H_beam * s;     // 70 cm bottom footing width

      const toeKneeX = wallBackX - wMid;         // Top inflection point between horizontal platform and 45-deg toe chamfer
      const toeKneeY = wallTopY;
      const toeTipX = toeKneeX - wToe;           // Bottom-left tip of the 45-deg chamfer (45cm left, 45cm down)
      const toeTipY = wallTopY + wToe;
      // Short perpendicular lip at bottom of toe where 60cm thick sloped RC box rests:
      // Perpendicular to 1:1 slope is (+cos45, +cos45). Total thickness of RC box = H_box (60cm).
      // Since (toeKneeX, toeKneeY) -> (toeTipX, toeTipY) has length 45*sqrt(2) = 63.64 cm (slightly > 60cm),
      // the bottom of the toe steps vertically down to wallTopY + hSlab + hDrop (50 + 25 = 75 cm).
      const footBotY = wallTopY + hSlab + hDrop; // 75 cm below wallTopY
      const slabBotY = wallTopY + hSlab;         // 50 cm below wallTopY
      const footLeftX = toeTipX;
      const footRightX = footLeftX + wFoot;      // 70 cm wide bottom pad

      // Grass paver recess (植草磚, 8cm deep across the 60cm bay from toeKneeX to wallBackX)
      const paverDepth = p.pvd * s;
      const paverLeftX = toeKneeX + p.pvo * s;
      const paverRightX = wallBackX;

      // Draw main concrete outline of the horizontal platform & stepped toe block
      const platPts = [
        [toeTipX, toeTipY],
        [toeKneeX, toeKneeY],
        [paverLeftX, toeKneeY],
        [paverLeftX, toeKneeY + paverDepth],
        [paverRightX, toeKneeY + paverDepth],
        [wallBackX, slabBotY],
        [footRightX, slabBotY],
        [footRightX, footBotY],
        [footLeftX, footBotY]
      ];
      cadPoly(ctx, platPts, pal.primaryLine, 1.9, true, isDarkTheme ? 'rgba(30,41,59,0.45)' : 'rgba(226,232,240,0.45)', [], 'PLATFORM');

      // Draw individual Grass Paver blocks (植草磚) inside the recessed trough
      const nPavers = 5;
      const pw = (paverRightX - paverLeftX) / nPavers;
      for (let i = 0; i < nPavers; i++) {
        const px = paverLeftX + i * pw;
        cadPoly(ctx, [
          [px, toeKneeY],
          [px + pw, toeKneeY],
          [px + pw, toeKneeY + paverDepth],
          [px, toeKneeY + paverDepth]
        ], pal.primaryLine, 1.2, true, null, [], 'GRASS_PAVER');
      }

      // Vertical lines inside the 50cm slab indicating cross-beam (間格樑 t=30cm@3m)
      cadPoly(ctx, [[footRightX, slabBotY], [footRightX, slabBotY + p.bmD * s], [wallBackX, slabBotY + p.bmD * s], [wallBackX, slabBotY]], pal.secondaryLine, 1.2, false, null, [8, 5], 'BEAM_LINE');
      cadDimLinear(ctx, wallBackX - 8 * s, slabBotY, wallBackX - 8 * s, slabBotY + p.bmD * s, -30, `${p.bmD}`, pal, 11);

      // PC Leveling Concrete Pad under the 70cm stepped toe base (210kg/cm2 混凝土打底, t=5cm)
      cadPoly(ctx, [
        [footLeftX - p.pcl * s, footBotY],
        [footRightX + p.pcr * s, footBotY],
        [footRightX + p.pcr * s, footBotY + pcH],
        [footLeftX - p.pcl * s, footBotY + pcH]
      ], pal.primaryLine, 1.2, true, isDarkTheme ? 'rgba(71,85,105,0.35)' : 'rgba(203,213,225,0.6)', [], 'PC_SLAB');

      // Exact Rebar inside Horizontal Platform & Toe Block (∮13@30cm):
      // Matching close-up screenshot: top horizontal bar, bottom horizontal bar, sloped chamfer bar, vertical stirrup legs, and corner rebar circles
      const rTopY = toeKneeY + paverDepth + 5 * s;
      const rBotY = slabBotY - 5 * s;
      const rFootBotY = footBotY - 5 * s;
      // Top & bottom bars in 50cm slab
      cadLine(ctx, toeKneeX + 2 * s, rTopY, wallBackX - 4 * s, rTopY, pal.rebarLine, 1.4, [], 'REBAR_PLAT');
      cadLine(ctx, footLeftX + 6 * s, rBotY, wallBackX - 4 * s, rBotY, pal.rebarLine, 1.4, [], 'REBAR_PLAT');
      // Chamfer diagonal bar & stepped toe loop
      cadLine(ctx, toeKneeX + 2 * s, rTopY, footLeftX + 6 * s, toeTipY + 4 * s, pal.rebarLine, 1.4, [], 'REBAR_PLAT');
      cadLine(ctx, footLeftX + 6 * s, toeTipY + 4 * s, footLeftX + 6 * s, rFootBotY, pal.rebarLine, 1.4, [], 'REBAR_PLAT');
      cadLine(ctx, footLeftX + 6 * s, rFootBotY, footRightX - 5 * s, rFootBotY, pal.rebarLine, 1.4, [], 'REBAR_PLAT');
      cadLine(ctx, footRightX - 5 * s, rFootBotY, footRightX - 5 * s, rtopY_clamp(rTopY), pal.rebarLine, 1.4, [], 'REBAR_PLAT');

      function rtopY_clamp(v) { return v; }

      // Rebar circles (○) inside platform & toe block
      const platCircles = [
        [toeKneeX + 5 * s, rTopY + 3],
        [footRightX - 8 * s, rTopY + 3],
        [footRightX - 8 * s, rBotY - 3],
        [footLeftX + 11 * s, rBotY - 3],
        [footLeftX + 11 * s, rFootBotY - 3],
        [footLeftX + 18 * s, rFootBotY - 3]
      ];
      platCircles.forEach(([cx, cy]) => {
        cadCircle(ctx, cx, cy, 2.5, pal.rebarAccent, 1.2, null, 'REBAR_DOT');
      });

      // =====================================================================
      // 3. UPPER 1:1 SLOPED PRECAST RC BOX REVETMENT (270 cm along 1:1 slope!)
      //    Exact match to user's close-up screenshot:
      //    - 3 Precast RC Boxes (each 90cm along slope x 60cm thick) sit directly on the 1:1 chamfered toe!
      //    - Slope unit vector up-left: u = (-cos45, -cos45)
      //    - Normal unit vector towards outer face (up-right): n = (+cos45, -cos45)
      //    - Bottom-inner corner of Box 1 starts at (sBaseX, sBaseY) on the 45-deg toe seat
      // =====================================================================
      const boxSlopeL = p.B_box * s; // 90 cm along slope
      const boxThick = p.H_box * s;  // 60 cm perpendicular to slope
      const ux = -cos45, uy = -cos45; // Along slope (up-left)
      const nx = cos45, ny = -cos45;  // Outer normal (up-right, so sBase + boxThick*n = toeKnee!)

      // Anchor so the outer face of the sloped RC boxes aligns cleanly with (toeKneeX, toeKneeY)
      const sBaseX = toeKneeX - nx * boxThick;
      const sBaseY = toeKneeY - ny * boxThick;

      // Helper to map (distAlongSlope, distFromInnerFace) -> (X, Y)
      const slopePt = (dAlong, dNorm) => [
        sBaseX + ux * dAlong + nx * dNorm,
        sBaseY + uy * dAlong + ny * dNorm
      ];

      // Geotextile line (織布鋪設) along the bottom/inner face of the 1:1 slope
      const totalSlopeLen = p.N_layers * boxSlopeL;
      const [geo0x, geo0y] = slopePt(-8 * s, -2.5);
      const [geo1x, geo1y] = slopePt(totalSlopeLen, -2.5);
      cadLine(ctx, geo0x, geo0y, geo1x, geo1y, pal.primaryLine, 1.5, [8, 4], 'GEOTEXTILE');

      // Draw each of the N_layers (3) Precast RC Boxes along the 1:1 slope
      const wallT = p.T_box * s; // 15 cm end wall thickness
      const bagLayerThick = p.bagT * s; // Thickness of the 2 layers of cross-hatched burlap bags on outer face

      for (let i = 0; i < p.N_layers; i++) {
        const d0 = i * boxSlopeL;
        const d1 = (i + 1) * boxSlopeL;

        // Outer rectangle of Box i
        const bCorners = [
          slopePt(d0, 0),
          slopePt(d1, 0),
          slopePt(d1, boxThick),
          slopePt(d0, boxThick)
        ];
        cadPoly(ctx, bCorners, pal.primaryLine, 1.9, true, isDarkTheme ? 'rgba(15,23,42,0.75)' : 'rgba(241,245,249,0.85)', [], 'SLOPED_RC_BOX');

        // Internal 15cm end-walls at d0 + wallT and d1 - wallT
        const [iw1a, iw1b] = [slopePt(d0 + wallT, 0), slopePt(d0 + wallT, boxThick)];
        const [iw2a, iw2b] = [slopePt(d1 - wallT, 0), slopePt(d1 - wallT, boxThick)];
        cadLine(ctx, iw1a[0], iw1a[1], iw1b[0], iw1b[1], pal.primaryLine, 1.3, [], 'BOX_WALL');
        cadLine(ctx, iw2a[0], iw2a[1], iw2b[0], iw2b[1], pal.primaryLine, 1.3, [], 'BOX_WALL');

        // M22 Bolt tie axis lines through the 15cm end walls
        const [bt1a, bt1b] = [slopePt(d0 - 3 * s, boxThick * 0.45), slopePt(d0 + wallT + 3 * s, boxThick * 0.45)];
        const [bt2a, bt2b] = [slopePt(d1 - wallT - 3 * s, boxThick * 0.45), slopePt(d1 + 3 * s, boxThick * 0.45)];
        cadLine(ctx, bt1a[0], bt1a[1], bt1b[0], bt1b[1], pal.rebarAccent, 1.5, [], 'M22_BOLT');
        cadLine(ctx, bt2a[0], bt2a[1], bt2b[0], bt2b[1], pal.rebarAccent, 1.5, [], 'M22_BOLT');

        // Inside the cavity (from d0 + wallT to d1 - wallT):
        // Lower/inner zone (0 .. boxThick - bagLayerThick): rounded cobbles (回填現場溪床料)
        // Upper/outer zone (boxThick - bagLayerThick .. boxThick): 2 layers of cross-hatched burlap bags (鋪設8包麻布袋)
        const cavStart = d0 + wallT;
        const cavEnd = d1 - wallT;
        const cavMidNorm = boxThick - bagLayerThick;

        // Divider line between cobbles and outer burlap bag layers
        const [divA, divB] = [slopePt(cavStart, cavMidNorm), slopePt(cavEnd, cavMidNorm)];
        cadLine(ctx, divA[0], divA[1], divB[0], divB[1], pal.primaryLine, 1.2, [], 'BAG_DIVIDER');

        // Draw 2 layers of cross-hatched burlap bags in outer zone (cavMidNorm .. boxThick)
        drawSlopedBurlapBags(ctx, slopePt, cavStart, cavEnd, cavMidNorm, boxThick, pal);

        // Draw cobble stones in inner zone (0 .. cavMidNorm)
        drawSlopedCobbles(ctx, slopePt, cavStart, cavEnd, 4 * s, cavMidNorm - 3 * s, pal);
      }

      // Top-left crest of the 3rd sloped RC box:
      // 2 stacked horizontal coffee burlap bags (咖啡麻布袋堆疊2層) at the top corner + horizontal ground line + straw mat (鋪設稻草蓆 W>=1.0m)
      const [topOuterX, topOuterY] = slopePt(totalSlopeLen, boxThick);
      const bagW = 28 * s;
      const bagH = p.bagH * s;
      // Two stacked horizontal burlap bags at top crest
      for (let b = 0; b < 2; b++) {
        const bx = topOuterX - bagW + (b * 4 * s);
        const by = topOuterY - (b + 1) * bagH;
        drawHorizontalCrossHatchBag(ctx, bx, by, bagW, bagH, pal);
      }

      // Horizontal ground bank line extending to the left from top of stacked bags
      const bankTopY = topOuterY - 2 * bagH;
      const bankRightX = topOuterX - bagW + 4 * s;
      const bankLeftX = bankRightX - strawW - 85;
      cadLine(ctx, bankLeftX, bankTopY, bankRightX, bankTopY, pal.primaryLine, 1.6, [], 'GROUND_LINE');

      // Straw mat indicator along top bank edge
      cadLine(ctx, bankRightX - strawW, bankTopY - 3, bankRightX, bankTopY - 3, pal.rebarAccent, 1.8, [6, 3], 'STRAW_MAT');

      // =====================================================================
      // 4. ALL DIMENSIONS FOR FIGURE 1 (100% Matching Original Layout)
      // =====================================================================
      // Sloped 270 dimension along outer face of the 3 sloped RC boxes + "1:1" label
      const [sDim0x, sDim0y] = slopePt(0, boxThick);
      const [sDim1x, sDim1y] = slopePt(totalSlopeLen, boxThick);
      cadDimLinear(ctx, sDim1x, sDim1y, sDim0x, sDim0y, -38, `${slopeTotalLenCm}`, pal, 13.5);
      const [lbl11x, lbl11y] = slopePt(totalSlopeLen * 0.45, boxThick + 18 * s);
      cadText(ctx, '1:1', lbl11x, lbl11y, 13.5, pal.textMain, 'center', '700', 45);

      // Horizontal platform dimensions: 105 | 30 on upper tier, 45 on lower tier
      cadDimLinear(ctx, toeKneeX, wallTopY, wallBackX, wallTopY, -28, `${p.W_mid}`, pal, 13);
      cadDimLinear(ctx, wallBackX, wallTopY, wallFrontTopX, wallTopY, -28, `${p.W_out}`, pal, 13);
      cadDimLinear(ctx, toeTipX, wallTopY, toeKneeX, wallTopY, -12, `${p.W_in}`, pal, 12.5);

      // Platform slab thickness 50, toe drop 25, bottom pad width 70, wall thickness 39 at slab soffit
      cadDimLinear(ctx, wallBackX - 22 * s, wallTopY, wallBackX - 22 * s, slabBotY, 16, `${p.t_slab}`, pal, 12);
      cadDimLinear(ctx, footLeftX, slabBotY, footLeftX, footBotY, -18, `${p.drop}`, pal, 12);
      cadDimLinear(ctx, footLeftX, footBotY + pcH, footRightX, footBotY + pcH, 22, `${p.H_beam}`, pal, 12.5);

      // Sloped 39 width dimension across the upper wall at slab soffit
      const wallSoffitFrontX = wallFrontTopX + (hSlab / (wallBaseY - wallTopY)) * (wallFrontBaseX - wallFrontTopX);
      cadText(ctx, `${+((wallSoffitFrontX - wallBackX) / s).toFixed(1)}`, (wallBackX + wallSoffitFrontX) / 2 + 12, slabBotY - 12, 12.5, pal.dimText, 'center', '700');

      // Right-side vertical height chain: 180 (slope crest to platform top) | 120 (platform top to streambed) | 180 (streambed to wall base)
      const vDimX1 = wallFrontTopX + 42 * s;
      const vDimX2 = wallFrontBaseX + 35 * s;
      cadDimLinear(ctx, vDimX1, bankTopY, vDimX1, wallTopY, 18, `${+((wallTopY - bankTopY) / s).toFixed(1)}`, pal, 13);
      cadDimLinear(ctx, vDimX2, wallTopY, vDimX2, bedLineY, 18, `${p.H_exposed}`, pal, 13);
      cadDimLinear(ctx, vDimX2, bedLineY, vDimX2, wallBaseY, 18, `${p.H_embed}`, pal, 13);

      // Lower wall base width 120
      cadDimLinear(ctx, wallBackX, wallBaseY + pcH, wallFrontBaseX, wallBaseY + pcH, 26, `${p.B_base}`, pal, 13);

      // =====================================================================
      // 5. ALL LEADER CALLOUTS FOR FIGURE 1 (100% Matching Original Text & Positions)
      // =====================================================================
      cadLeader(ctx, bankRightX - 18 * s, bankTopY - 2, bankRightX - 12 * s, bankTopY - 68, 1, [
        `鋪設稻草蓆 W≧${(p.W_straw / 100).toFixed(1)}m`,
        '可依現況調整鋪設寬度'
      ], pal);

      cadLeader(ctx, topOuterX - bagW * 0.8, topOuterY - bagH * 0.6, topOuterX - bagW - 45, topOuterY + 35, -1, [
        '咖啡麻布袋堆疊2層'
      ], pal);

      const [bagMidX, bagMidY] = slopePt(boxSlopeL * 2.35, boxThick - bagLayerThick * 0.5);
      cadLeader(ctx, bagMidX, bagMidY, sDim1x + 95, bankTopY - 10, 1, [
        '回填現場溪床料，整平後鋪設8包麻布袋'
      ], pal);

      const [geoMidX, geoMidY] = slopePt(boxSlopeL * 1.45, 0);
      cadLeader(ctx, geoMidX, geoMidY, geoMidX - 55, geoMidY + 35, -1, ['織布鋪設'], pal);

      cadLeader(ctx, (paverLeftX + paverRightX) / 2, toeKneeY + 3, paverLeftX + 10, toeKneeY - 58, 1, ['植草磚'], pal);

      // Platform & toe rebar/concrete callouts on left side
      cadLeader(ctx, footLeftX + 12 * s, rBotY, footLeftX - 95, rBotY, -1, ['∮13@30cm'], pal);
      cadLeader(ctx, footLeftX + 2 * s, footBotY - 3, footLeftX - 55, footBotY + 12, -1, ['普通模板'], pal);
      cadLeader(ctx, footLeftX + 15 * s, footBotY - 8, footLeftX - 55, footBotY + 34, -1, ['210kg/cm2 混凝土'], pal);
      cadLeader(ctx, footLeftX + 10 * s, footBotY + pcH * 0.6, footLeftX - 55, footBotY + 54, -1, [`210kg/cm2 混凝土打底,t=${p.t_pc}cm`], pal);
      cadLeader(ctx, (footRightX + wallBackX) / 2, slabBotY + p.bmD / 2 * s, footLeftX - 40, footBotY + 86, -1, [`間格樑 t=${p.bmT}cm@${p.bmS / 100}m（虛線，版底下深 ${p.bmD}）`, `承載版厚 ${p.t_slab}cm`], pal);

      // Lower RC Wall left-side callouts
      const wallMidY = wallTopY + p.H_wall * s * 0.58;
      cadLeader(ctx, rbBackX, wallMidY - 22, wallBackX - 80, wallMidY - 22, -1, ['∮16@30cm'], pal);
      cadLeader(ctx, rbBackX + 3, wallMidY + 18, wallBackX - 80, wallMidY + 18, -1, ['∮13@30cm'], pal);
      cadLeader(ctx, wallBackX, wallBaseY - 22, wallBackX - 65, wallBaseY - 8, -1, ['普通模板'], pal);
      cadLeader(ctx, wallBackX - 3, wallBaseY + pcH * 0.5, wallBackX - 65, wallBaseY + 26, -1, [`210kg/cm2 混凝土打底,t=${p.t_pc}cm`], pal);

      // Lower RC Wall right-side callouts
      cadLeader(ctx, wallFrontTopX + 14 * s, wallTopY + 38 * s, wallFrontTopX + 68, wallTopY - 22, 1, ['造型模板'], pal);
      cadLeader(ctx, weepFrontX1, weepY1 + 4, wallFrontTopX + 68, wallTopY + 8, 1, ['3"PVC管@1.5m', '(t≧5mm)'], pal);
      cadLeader(ctx, bedEndX - 65, bedLineY, bedEndX - 25, bedLineY - 48, 1, ['設計溪床線'], pal);
      cadLeader(ctx, wallFrontBaseX - 25, wallBaseY - 12, wallFrontBaseX + 35, wallBaseY + 16, 1, ['210kg/cm2 混凝土'], pal);

      // Section Title 1
      const sec1CenterX = (toeTipX + wallFrontBaseX) / 2 + 30;
      const sec1TitleY = wallBaseY + 72;
      drawSectionTitle(ctx, '預鑄護岸詳細圖1', p.__rng || '', sec1CenterX, sec1TitleY, pal);

      // =====================================================================
      // 6. RIGHT SIDE OF SHEET 1: 預鑄護岸平面圖 (100% Matching Close-Up Screenshot!)
      //    - Left & Right full-height vertical strip borders (間格樑/邊牆)
      //    - 3 rows of Precast RC Boxes:
      //      Row 0 (Top) & Row 2 (Bottom): nCols full boxes (each with 1 central octagon + 2 half-octagon ends)
      //      Row 1 (Middle): staggered by 0.5 box! (0.5 box on left + (nCols-1) full boxes + 0.5 box on right)
      //    - Top/bottom walls have ☒ bolt pockets; vertical joints have == M22 bolt pairs!
      // =====================================================================
      const planStartX = bedEndX + 175;
      const planTopY = originY + 25;
      const planScale = 0.85;
      const pBoxL = p.L_box * planScale; // 120 * 0.85 = 102
      const pBoxB = p.B_box * planScale; // 90 * 0.85 = 76.5
      const nCols = p.N_plan_cols;
      const totalPlanW = nCols * pBoxL;
      const totalPlanRowsH = 3 * pBoxB;
      const wallPlanH = 165;
      const wingW = 20;

      // Left & Right full-height side strip walls
      cadPoly(ctx, [
        [planStartX - wingW, planTopY],
        [planStartX, planTopY],
        [planStartX, planTopY + totalPlanRowsH + wallPlanH],
        [planStartX - wingW, planTopY + totalPlanRowsH + wallPlanH]
      ], pal.primaryLine, 1.6, true, null, [], 'PLAN_BORDER');

      cadPoly(ctx, [
        [planStartX + totalPlanW, planTopY],
        [planStartX + totalPlanW + wingW, planTopY],
        [planStartX + totalPlanW + wingW, planTopY + totalPlanRowsH + wallPlanH],
        [planStartX + totalPlanW, planTopY + totalPlanRowsH + wallPlanH]
      ], pal.primaryLine, 1.6, true, null, [], 'PLAN_BORDER');

      // Draw 3 rows of Precast RC Boxes (Row 1 is staggered by half a box!)
      for (let r = 0; r < 3; r++) {
        const ry = planTopY + r * pBoxB;
        const isStaggered = (r % 2 === 1);

        if (!isStaggered) {
          for (let c = 0; c < nCols; c++) {
            const rx = planStartX + c * pBoxL;
            drawExactPlanBoxUnit(ctx, rx, ry, pBoxL, pBoxB, 'FULL', pal);
          }
        } else {
          // Left half-box
          drawExactPlanBoxUnit(ctx, planStartX, ry, pBoxL * 0.5, pBoxB, 'LEFT_HALF', pal);
          // Middle (nCols - 1) full boxes
          for (let c = 0; c < nCols - 1; c++) {
            const rx = planStartX + (c + 0.5) * pBoxL;
            drawExactPlanBoxUnit(ctx, rx, ry, pBoxL, pBoxB, 'FULL', pal);
          }
          // Right half-box
          drawExactPlanBoxUnit(ctx, planStartX + (nCols - 0.5) * pBoxL, ry, pBoxL * 0.5, pBoxB, 'RIGHT_HALF', pal);
        }
      }

      // Lower Platform & Battered Wall lines in Plan View
      const wallCrestY = planTopY + totalPlanRowsH;
      cadLine(ctx, planStartX, wallCrestY, planStartX + totalPlanW, wallCrestY, pal.primaryLine, 1.6, [], 'PLAN_WALL');
      cadLine(ctx, planStartX, wallCrestY + 58, planStartX + totalPlanW, wallCrestY + 58, pal.primaryLine, 1.3, [], 'PLAN_WALL');
      cadLine(ctx, planStartX, wallCrestY + wallPlanH, planStartX + totalPlanW, wallCrestY + wallPlanH, pal.primaryLine, 1.6, [], 'PLAN_WALL');

      // Flow direction arrow (<--- 流向)
      const flowX = planStartX + totalPlanW / 2;
      const flowY = wallCrestY + 42;
      cadLine(ctx, flowX + 32, flowY, flowX - 32, flowY, pal.primaryLine, 1.6, [], 'FLOW');
      cadLine(ctx, flowX - 32, flowY, flowX - 21, flowY - 4.5, pal.primaryLine, 1.6, [], 'FLOW');
      cadLine(ctx, flowX - 32, flowY, flowX - 21, flowY + 4.5, pal.primaryLine, 1.6, [], 'FLOW');
      cadText(ctx, '流向', flowX, flowY - 11, 12.5, pal.textMain, 'center', '600');

      // Plan View Multi-branch Callouts (100% Matching Screenshot)
      // 1) "RC箱上下層需交錯排列" pointing to Row 1 and Row 2 centers
      const stgKneeX = planStartX - 36;
      const stgKneeY = planTopY + pBoxB * 0.95;
      cadLine(ctx, planStartX + pBoxL * 1.0, planTopY + pBoxB * 1.55, stgKneeX, stgKneeY, pal.leaderLine, 1.1, [], 'LEADER');
      cadLine(ctx, planStartX + pBoxL * 1.5, planTopY + pBoxB * 2.55, stgKneeX, stgKneeY, pal.leaderLine, 1.1, [], 'LEADER');
      cadLine(ctx, stgKneeX, stgKneeY, stgKneeX - 16, stgKneeY, pal.leaderLine, 1.1, [], 'LEADER');
      cadText(ctx, 'RC箱上下層需交錯排列', stgKneeX - 22, stgKneeY, 12, pal.textMain, 'right', '500');

      // 2) "每兩個RC箱以兩組M22螺桿結合..." pointing to two M22 bolt pairs
      const bltKneeX = planStartX + totalPlanW + 32;
      const bltKneeY = planTopY + pBoxB * 1.35;
      const bTargetX = planStartX + (nCols - 1) * pBoxL;
      cadLine(ctx, bTargetX, planTopY + pBoxB * 0.42, bltKneeX, bltKneeY, pal.leaderLine, 1.1, [], 'LEADER');
      cadLine(ctx, bTargetX, planTopY + pBoxB * 0.58, bltKneeX, bltKneeY, pal.leaderLine, 1.1, [], 'LEADER');
      cadLine(ctx, bltKneeX, bltKneeY, bltKneeX + 16, bltKneeY, pal.leaderLine, 1.1, [], 'LEADER');
      cadText(ctx, '每兩個RC箱以兩組M22螺桿結合', bltKneeX + 22, bltKneeY - 8, 11.5, pal.textMain, 'left', '500');
      cadText(ctx, '(每組2根55cm及4組鋼片螺帽固定)', bltKneeX + 22, bltKneeY + 10, 11.5, pal.textMain, 'left', '500');

      // Plan View Title
      drawSectionTitle(ctx, '預鑄護岸平面圖', '', planStartX + totalPlanW / 2, wallCrestY + wallPlanH + 48, pal);

      // =====================================================================
      // 7. BOTTOM OF SHEET 1: 施工說明 (1~9) & 織布材料規格說明表 (CNS 13300/13298)
      // =====================================================================
      const notesTopY = sec1TitleY + 65;
      const notesLeftX = originX + 40;
      cadText(ctx, '施工說明：', notesLeftX, notesTopY, 13, pal.textMain, 'left', '700');
      const notesList = [
        '1. RC箱組立前，須依圖斜率完成整坡夯實且查驗合格後方可組立RC箱。',
        '2. RC箱須依圖交錯排列，並先試作排列經查驗合格後，方可大量組立RC箱。',
        '3. 每兩個RC箱以二組M22螺桿結合(每組2根55cm及4組鋼片螺帽固定)螺桿連',
        '   結須採用人工配合拴緊設備器具，並經機關或監造單位查驗。',
        '4. RC箱、M22螺桿組立完成且查驗合格後，方可回填溪床料。',
        '5. 溪床粒料(須先行篩選)需覆蓋整個RC箱，最上層利用機具壓實。',
        '6. 上兩層RC箱回填溪床料壓實後，每個RC箱外層鋪滿8個碎石客土袋。',
        '7. 本工程連結RC箱之螺栓、螺帽及鋼片材質為鍍鋅材料。',
        '8. RC箱、M22螺桿須經查驗合格。',
        '9. 織布鋪設須重疊至少20cm(含)以上，並每平方公尺以1支鐵絲或鋼筋固定。'
      ];
      notesList.forEach((line, i) => {
        cadText(ctx, line, notesLeftX + 10, notesTopY + 22 + i * 19, 12, pal.textSub, 'left', '500');
      });

      const geoTableX = notesLeftX + 530;
      const geoTableY = notesTopY + 10;
      cadText(ctx, '織布材料規格說明：', geoTableX, geoTableY - 12, 12.5, pal.textMain, 'left', '700');

      const colWidths = [70, 60, 75, 105];
      const rowH = 22;
      const geoRows = [
        ['項目', '單位', '結果', '試驗方法'],
        ['抗拉強度', 'kgf/m', '>2,800', 'CNS 13300'],
        ['伸長率', '%', '<30', 'CNS 13300'],
        ['透水率', '1/S', '>0.1', 'CNS 13298']
      ];
      drawCadTable(ctx, geoTableX, geoTableY, colWidths, rowH, geoRows, pal);

      const geoNotes = [
        '註1：織布為聚乙烯纖維、聚丙烯纖維或聚酯纖維等',
        '     編織而成之織布。',
        '註2：承包商需於材料施工前檢附樣品及兩年內試驗',
        '     報告供業主、監造單位審核。',
        '註3：驗收時需檢附工廠出廠及材料數量証明之文件。'
      ];
      geoNotes.forEach((gn, idx) => {
        cadText(ctx, gn, geoTableX, geoTableY + 4 * rowH + 16 + idx * 18, 11.5, pal.textSub, 'left', '500');
      });

      const maxRight = Math.max(planStartX + totalPlanW + 270, geoTableX + 360);
      const maxBottom = notesTopY + 235;
      return { width: maxRight - originX, height: maxBottom - originY };
    }

    // Helper: Draw 2 layers of cross-hatched burlap bags inside the outer zone of a sloped RC Box
    function drawSlopedBurlapBags(ctx, slopePt, dStart, dEnd, nInner, nOuter, pal) {
      const nMid = (nInner + nOuter) / 2;
      const nBags = 4; // 4 bags per layer x 2 layers = 8 bags!
      const stepD = (dEnd - dStart) / nBags;

      // Middle layer line
      const [m0, m1] = [slopePt(dStart, nMid), slopePt(dEnd, nMid)];
      cadLine(ctx, m0[0], m0[1], m1[0], m1[1], pal.secondaryLine, 1.0, [], 'BAG_LAYER');

      for (let layer = 0; layer < 2; layer++) {
        const na = layer === 0 ? nInner : nMid;
        const nb = layer === 0 ? nMid : nOuter;
        for (let k = 0; k < nBags; k++) {
          const da = dStart + k * stepD;
          const db = da + stepD;
          const p00 = slopePt(da, na);
          const p10 = slopePt(db, na);
          const p11 = slopePt(db, nb);
          const p01 = slopePt(da, nb);
          cadPoly(ctx, [p00, p10, p11, p01], pal.primaryLine, 0.9, true, null, [], 'BURLAP_BAG');
          // Cross-hatch diagonals inside each bag
          cadLine(ctx, p00[0], p00[1], p11[0], p11[1], pal.hatchLine, 0.8, [], 'BURLAP_HATCH');
          cadLine(ctx, p10[0], p10[1], p01[0], p01[1], pal.hatchLine, 0.8, [], 'BURLAP_HATCH');
        }
      }
    }

    // Helper: Draw irregular rounded cobbles inside the inner zone of a sloped RC Box
    function drawSlopedCobbles(ctx, slopePt, dStart, dEnd, nInner, nOuter, pal) {
      const rows = 2;
      const cols = 3;
      const dStep = (dEnd - dStart) / cols;
      const nStep = (nOuter - nInner) / rows;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const dc = dStart + (c + 0.5) * dStep;
          const nc = nInner + (r + 0.5) * nStep;
          const [cx, cy] = slopePt(dc, nc);
          const rad = Math.min(dStep, nStep) * 0.36;
          ctx.save();
          ctx.strokeStyle = pal.secondaryLine;
          ctx.lineWidth = 1.1;
          ctx.beginPath();
          ctx.ellipse(cx, cy, rad * 1.15, rad * 0.78, -Math.PI / 4 + (r - c) * 0.2, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }
      }
    }

    // Helper: Draw horizontal cross-hatched burlap bag at top bank crest
    function drawHorizontalCrossHatchBag(ctx, x, y, w, h, pal) {
      cadPoly(ctx, [
        [x, y],
        [x + w, y],
        [x + w, y + h],
        [x, y + h]
      ], pal.primaryLine, 1.2, true, isDarkTheme ? 'rgba(30,41,59,0.7)' : 'rgba(226,232,240,0.8)', [], 'TOP_BAG');
      const segs = 4;
      const sw = w / segs;
      for (let i = 0; i < segs; i++) {
        const sx = x + i * sw;
        cadLine(ctx, sx, y, sx + sw, y + h, pal.hatchLine, 0.85, [], 'TOP_BAG_HATCH');
        cadLine(ctx, sx + sw, y, sx, y + h, pal.hatchLine, 0.85, [], 'TOP_BAG_HATCH');
      }
    }

    // Helper: Draw a single Precast RC Box (Full, Left-Half, or Right-Half) in Plan View
    // 100% Matching Screenshot: 1 central octagon + 2 side half-octagons + 4 ☒ pockets on top/bottom walls + == M22 bolts on vertical joints
    function drawExactPlanBoxUnit(ctx, rx, ry, w, h, mode, pal) {
      // Outer boundary
      cadPoly(ctx, [
        [rx, ry],
        [rx + w, ry],
        [rx + w, ry + h],
        [rx, ry + h]
      ], pal.primaryLine, 1.5, true, null, [], 'PLAN_BOX');

      const wallY = h * (__P.T_box / __P.B_box);
      const chY = h * (__P.c_box / __P.B_box);
      const flatY = h * ((__P.B_box - 2 * __P.T_box - 2 * __P.c_box) / __P.B_box);
      const yTop1 = ry + wallY;
      const yTop2 = yTop1 + chY;
      const yBot2 = yTop2 + flatY;
      const yBot1 = ry + h - wallY;

      if (mode === 'FULL') {
        const chX = w * (__P.c_box / __P.L_box);
        const endRecessX = w * (2 * __P.t_box / __P.L_box);
        const wallX = w * (__P.T_box / __P.L_box);

        // 1. Center full octagonal opening (from x = 35/120 to 85/120)
        const cx1 = rx + endRecessX + wallX;
        const cx2 = cx1 + chX;
        const cx3 = rx + w - endRecessX - wallX - chX;
        const cx4 = rx + w - endRecessX - wallX;
        cadPoly(ctx, [
          [cx2, yTop1],
          [cx3, yTop1],
          [cx4, yTop2],
          [cx4, yBot2],
          [cx3, yBot1],
          [cx2, yBot1],
          [cx1, yBot2],
          [cx1, yTop2]
        ], pal.primaryLine, 1.35, true, null, [], 'PLAN_OCT_CENTER');

        // 2. Left half-octagonal recess (from rx to rx + 20/120)
        const lx1 = rx + chX;
        const lx2 = rx + endRecessX;
        cadPoly(ctx, [
          [rx, yTop1],
          [lx1, yTop1],
          [lx2, yTop2],
          [lx2, yBot2],
          [lx1, yBot1],
          [rx, yBot1]
        ], pal.primaryLine, 1.35, false, null, [], 'PLAN_OCT_LEFT');

        // 3. Right half-octagonal recess (from rx + w - 20/120 to rx + w)
        const rx2 = rx + w - endRecessX;
        const rx1 = rx + w - chX;
        cadPoly(ctx, [
          [rx + w, yTop1],
          [rx1, yTop1],
          [rx2, yTop2],
          [rx2, yBot2],
          [rx1, yBot1],
          [rx + w, yBot1]
        ], pal.primaryLine, 1.35, false, null, [], 'PLAN_OCT_RIGHT');

        // 4. Four ☒ bolt slots along top wall and bottom wall
        const xSlots = [
          rx + w * (16 / 120),
          rx + w * (42 / 120),
          rx + w * (78 / 120),
          rx + w * (104 / 120)
        ];
        const slotW = w * 0.045;
        xSlots.forEach(sx => {
          drawCrossSlotBox(ctx, sx - slotW / 2, ry, slotW, wallY, pal);
          drawCrossSlotBox(ctx, sx - slotW / 2, ry + h - wallY, slotW, wallY, pal);
        });

        // 5. Horizontal M22 bolt pairs (==) across left & right end walls
        const by1 = ry + h * 0.42;
        const by2 = ry + h * 0.58;
        [by1, by2].forEach(by => {
          cadLine(ctx, rx - 5, by, cx1 + 2, by, pal.primaryLine, 1.5, [], 'M22_TIE');
          cadLine(ctx, cx4 - 2, by, rx + w + 5, by, pal.primaryLine, 1.5, [], 'M22_TIE');
        });
      } else if (mode === 'LEFT_HALF') {
        // Half-box on left end of staggered row (w is 60cm scaled)
        const chX = w * (__P.c_box / (__P.L_box / 2));
        const wallX = w * (__P.T_box / (__P.L_box / 2));
        const rx2 = rx + w - wallX - chX;
        const rx1 = rx + w - chX;
        // Right half-octagon opening
        cadPoly(ctx, [
          [rx + w, yTop1],
          [rx1, yTop1],
          [rx2, yTop2],
          [rx2, yBot2],
          [rx1, yBot1],
          [rx + w, yBot1]
        ], pal.primaryLine, 1.35, false, null, [], 'PLAN_OCT_HALF');
        // Left part of center octagon at left border
        const lx2 = rx + w * ((__P.L_box / 2 - 2 * __P.t_box - __P.T_box) / (__P.L_box / 2));
        const lx1 = lx2 - chX;
        cadPoly(ctx, [
          [rx, yTop1],
          [lx1, yTop1],
          [lx2, yTop2],
          [lx2, yBot2],
          [lx1, yBot1],
          [rx, yBot1]
        ], pal.primaryLine, 1.35, false, null, [], 'PLAN_OCT_HALF');
        // 2 ☒ slots on top & bottom
        const slotW = w * 0.09;
        [rx + w * 0.32, rx + w * 0.72].forEach(sx => {
          drawCrossSlotBox(ctx, sx - slotW / 2, ry, slotW, wallY, pal);
          drawCrossSlotBox(ctx, sx - slotW / 2, ry + h - wallY, slotW, wallY, pal);
        });
      } else if (mode === 'RIGHT_HALF') {
        // Half-box on right end of staggered row
        const chX = w * (__P.c_box / (__P.L_box / 2));
        const endRecessX = w * (2 * __P.t_box / (__P.L_box / 2));
        const lx1 = rx + chX;
        const lx2 = rx + endRecessX;
        cadPoly(ctx, [
          [rx, yTop1],
          [lx1, yTop1],
          [lx2, yTop2],
          [lx2, yBot2],
          [lx1, yBot1],
          [rx, yBot1]
        ], pal.primaryLine, 1.35, false, null, [], 'PLAN_OCT_HALF');
        const rx2 = rx + w - w * ((__P.L_box / 2 - 2 * __P.t_box - __P.T_box) / (__P.L_box / 2));
        const rx1 = rx2 + chX;
        cadPoly(ctx, [
          [rx + w, yTop1],
          [rx1, yTop1],
          [rx2, yTop2],
          [rx2, yBot2],
          [rx1, yBot1],
          [rx + w, yBot1]
        ], pal.primaryLine, 1.35, false, null, [], 'PLAN_OCT_HALF');
        const slotW = w * 0.09;
        [rx + w * 0.28, rx + w * 0.68].forEach(sx => {
          drawCrossSlotBox(ctx, sx - slotW / 2, ry, slotW, wallY, pal);
          drawCrossSlotBox(ctx, sx - slotW / 2, ry + h - wallY, slotW, wallY, pal);
        });
      }
    }

    // Helper: Draw a small rectangular pocket with an 'X' inside (☒)
    function drawCrossSlotBox(ctx, x, y, w, h, pal) {
      cadPoly(ctx, [
        [x, y],
        [x + w, y],
        [x + w, y + h],
        [x, y + h]
      ], pal.primaryLine, 1.0, true, null, [], 'SLOT_BOX');
      cadLine(ctx, x, y, x + w, y + h, pal.primaryLine, 0.9, [], 'SLOT_X');
      cadLine(ctx, x + w, y, x, y + h, pal.primaryLine, 0.9, [], 'SLOT_X');
    }

    // =========================================================================
    // 5. SHEET 2 DRAWING: 預鑄 R.C 箱 (C型) 三視圖、鍍鋅鋼片、配筋表、數量計算表
    //    100% Faithful to Original Drawing 2 (Side, Front, Plan, Rebar #1~#5)
    // =========================================================================
    function drawSheet2(ctx, originX, originY, p, q, pal) {
      const s = 1.85;
      const L = p.L_box * s; // 120 * s
      const B = p.B_box * s; // 90 * s
      const H = p.H_box * s; // 60 * s
      const T = p.T_box * s; // 15 * s
      const t = p.t_box * s; // 10 * s
      const c = p.c_box * s; // 10 * s

      const holeNetL_cm = Math.max(20, p.L_box - 2 * p.t_box - 2 * p.T_box - 2 * p.c_box); // 50 cm
      const holeNetB_cm = Math.max(20, p.B_box - 2 * p.T_box - 2 * p.c_box);               // 40 cm

      const sideX = originX + 225;
      const sideY = originY + 90;

      const frontX = sideX + L + 310;
      const frontY = sideY;

      const plateX = frontX + B + 215;
      const plateY = sideY + 25;

      const planX = sideX;
      const planY = sideY + H + 155;

      // ---------------------------------------------------------------------
      // VIEW 1: 側剖圖 (Side Section: L=120 x H=60)
      //    Internal vertical lines at x = 10, 20, 35, 45 and 75, 85, 100, 110
      // ---------------------------------------------------------------------
      cadPoly(ctx, [
        [sideX, sideY],
        [sideX + L, sideY],
        [sideX + L, sideY + H],
        [sideX, sideY + H]
      ], pal.primaryLine, 2.0, true, isDarkTheme ? 'rgba(30,41,59,0.45)' : 'rgba(226,232,240,0.45)', [], 'BOX_SIDE');

      const sx10 = sideX + t;
      const sx20 = sideX + 2 * t;
      const sx35 = sx20 + T;
      const sx45 = sx35 + c;
      const sx75 = sideX + L - 2 * t - T - c;
      const sx85 = sideX + L - 2 * t - T;
      const sx100 = sideX + L - 2 * t;
      const sx110 = sideX + L - t;

      [sx10, sx20, sx35, sx45, sx75, sx85, sx100, sx110].forEach(xv => {
        cadLine(ctx, xv, sideY, xv, sideY + H, pal.secondaryLine, 1.0, [], 'BOX_SIDE_INT');
      });

      // Horizontal rebar lines in Side Section (5 layers matching 15 | 15 | 8.75 | 8.75 | 12.5)
      const ryLevels = [
        sideY + 6 * s,
        sideY + (6 + 8.75) * s,
        sideY + (6 + 17.5) * s,
        sideY + (6 + 17.5 + 15) * s,
        sideY + H - 6 * s
      ];
      ryLevels.forEach(ry => {
        cadLine(ctx, sx20, ry, sx100, ry, pal.rebarLine, 1.15, [], 'REBAR_HORIZ');
        // Rebar section dots at sx25 & sx95
        cadCircle(ctx, sx20 + 4 * s, ry, 2.1, pal.rebarAccent, 1.0, null, 'REBAR_DOT');
        cadCircle(ctx, sx100 - 4 * s, ry, 2.1, pal.rebarAccent, 1.0, null, 'REBAR_DOT');
      });

      // Two ∮3" holes on side wall
      const holeY = sideY + H * 0.52;
      const holeR = 3.8 * s;
      const h1x = sideX + L * 0.39;
      const h2x = sideX + L * 0.61;
      cadCircle(ctx, h1x, holeY, holeR, pal.primaryLine, 1.3, null, 'HOLE_3IN');
      cadCircle(ctx, h2x, holeY, holeR, pal.primaryLine, 1.3, null, 'HOLE_3IN');

      // Rebar 4 (Outer X-shaped diagonal cross bars across central bay)
      cadLine(ctx, sx35, ryLevels[0], sx85, ryLevels[4], pal.rebarLine, 1.35, [], 'REBAR_4');
      cadLine(ctx, sx35, ryLevels[4], sx85, ryLevels[0], pal.rebarLine, 1.35, [], 'REBAR_4');

      // Left M22 Bolt pairs (2 bolts with steel plates & nuts)
      const m22Y1 = sideY + H * 0.38;
      const m22Y2 = sideY + H * 0.64;
      [m22Y1, m22Y2].forEach(by => {
        cadLine(ctx, sideX - 8, by, sx35 + 4, by, pal.rebarAccent, 2.0, [], 'M22_BOLT');
      });

      // Top Dimensions on Side Section:
      // Outer: 120
      // Middle: 15 (over 20..35) and 15 (over 85..100)
      // Inner: 10 | 10 | 50 | 10 | 10
      cadDimLinear(ctx, sideX, sideY, sideX + L, sideY, -54, `${p.L_box}`, pal, 12.5);
      cadDimLinear(ctx, sx10, sideY, sx20 + T * 0.5, sideY, -34, `${p.T_box}`, pal, 11);
      cadDimLinear(ctx, sx85 + T * 0.5, sideY, sx110, sideY, -34, `${p.T_box}`, pal, 11);

      cadDimLinear(ctx, sideX, sideY, sx10, sideY, -16, `${p.t_box}`, pal, 10.5);
      cadDimLinear(ctx, sx10, sideY, sx20, sideY, -16, `${p.t_box}`, pal, 10.5);
      cadDimLinear(ctx, sx35, sideY, sx75, sideY, -16, `${holeNetL_cm}`, pal, 11);
      cadDimLinear(ctx, sx100, sideY, sx110, sideY, -16, `${p.t_box}`, pal, 10.5);
      cadDimLinear(ctx, sx110, sideY, sideX + L, sideY, -16, `${p.t_box}`, pal, 10.5);

      // Left Height Dimension: 60
      cadDimLinear(ctx, sideX, sideY, sideX, sideY + H, -26, `${p.H_box}`, pal, 12);

      // Right Vertical Sub-dimensions: 8.75 | 8.75 | 15 | 15
      const rDimX = sideX + L;
      cadDimLinear(ctx, rDimX, ryLevels[0], rDimX, ryLevels[1], 20, `8.75`, pal, 10);
      cadDimLinear(ctx, rDimX, ryLevels[1], rDimX, ryLevels[2], 20, `8.75`, pal, 10);
      cadDimLinear(ctx, rDimX, ryLevels[2], rDimX, ryLevels[3], 20, `15`, pal, 10.5);
      cadDimLinear(ctx, rDimX, ryLevels[3], rDimX, ryLevels[4], 20, `15`, pal, 10.5);

      // Callouts on Side Section
      cadLeader(ctx, sideX - 2, m22Y1, sideX - 42, sideY + 22, -1, [
        '每兩個RC箱以兩組M22螺桿結合',
        '(每組2根55cm及4組鋼片螺帽固定)'
      ], pal, 11);
      cadLeader(ctx, h1x, holeY + holeR, sideX + 5, sideY + H + 34, -1, ['∮3"孔2個2側@(間格)相等'], pal, 11);
      cadLeader(ctx, sideX + L * 0.56, sideY + H * 0.55, sideX + L * 0.65, sideY + H + 34, 1, ['鋼筋 4(外層)'], pal, 11);
      cadLeader(ctx, sx100 - 4 * s, ryLevels[0], sideX + L + 52, sideY + 2, 1, ['鋼筋 3(中層)'], pal, 11);
      cadLeader(ctx, sx100 - 4 * s, ryLevels[4], sideX + L + 52, sideY + H + 10, 1, ['鋼筋 2(內層)'], pal, 11);

      // ---------------------------------------------------------------------
      // VIEW 2: 正剖圖 (Front Section: B=90 x H=60)
      //    Top dims: 90 overall, 15 | 10 | 40 | 10 | 15
      // ---------------------------------------------------------------------
      cadPoly(ctx, [
        [frontX, frontY],
        [frontX + B, frontY],
        [frontX + B, frontY + H],
        [frontX, frontY + H]
      ], pal.primaryLine, 2.0, true, isDarkTheme ? 'rgba(30,41,59,0.45)' : 'rgba(226,232,240,0.45)', [], 'BOX_FRONT');

      const fx15 = frontX + T;
      const fx25 = fx15 + c;
      const fx65 = frontX + B - T - c;
      const fx75 = frontX + B - T;
      [fx15, fx25, fx65, fx75].forEach(xv => {
        cadLine(ctx, xv, frontY, xv, frontY + H, pal.secondaryLine, 1.0, [], 'BOX_FRONT_INT');
      });

      // Horizontal rebar lines in Front Section
      ryLevels.forEach(ry => {
        cadLine(ctx, fx15 - 4 * s, ry, fx75 + 4 * s, ry, pal.rebarLine, 1.15, [], 'REBAR_FRONT');
        cadCircle(ctx, fx15 + 3 * s, ry, 2.1, pal.rebarAccent, 1.0, null, 'REBAR_DOT');
        cadCircle(ctx, fx75 - 3 * s, ry, 2.1, pal.rebarAccent, 1.0, null, 'REBAR_DOT');
      });

      // Diagonal Rebar 5 (Outer X-brace across central opening)
      cadLine(ctx, fx15, ryLevels[0], fx75, ryLevels[4], pal.rebarLine, 1.35, [], 'REBAR_5');
      cadLine(ctx, fx15, ryLevels[4], fx75, ryLevels[0], pal.rebarLine, 1.35, [], 'REBAR_5');

      // 4 Center M22 Bolt ☒ Washers & Side Wall ☒ Pockets in Front Section
      const midFrontX = frontX + B / 2;
      const pSq = 11;
      [[-12, m22Y1], [12, m22Y1], [-12, m22Y2], [12, m22Y2]].forEach(([dx, py]) => {
        drawCrossSlotBox(ctx, midFrontX + dx - pSq / 2, py - pSq / 2, pSq, pSq, pal);
      });
      // Left & Right 15cm wall bolt pockets
      [m22Y1, m22Y2].forEach(py => {
        drawCrossSlotBox(ctx, frontX + 2, py - 5, T - 4, 10, pal);
        drawCrossSlotBox(ctx, fx75 + 2, py - 5, T - 4, 10, pal);
      });

      // Front Section Dimensions (Top: 90 overall, 15 | 10 | 40 | 10 | 15)
      cadDimLinear(ctx, frontX, frontY, frontX + B, frontY, -46, `${p.B_box}`, pal, 12.5);
      cadDimLinear(ctx, frontX, frontY, fx15, frontY, -16, `${p.T_box}`, pal, 11);
      cadDimLinear(ctx, fx15, frontY, fx25, frontY, -28, `${p.c_box}`, pal, 10.5);
      cadDimLinear(ctx, fx25, frontY, fx65, frontY, -28, `${holeNetB_cm}`, pal, 11);
      cadDimLinear(ctx, fx65, frontY, fx75, frontY, -28, `${p.c_box}`, pal, 10.5);
      cadDimLinear(ctx, fx75, frontY, frontX + B, frontY, -16, `${p.T_box}`, pal, 11);
      cadDimLinear(ctx, frontX, frontY, frontX, frontY + H, -24, `${p.H_box}`, pal, 12);

      // Right Vertical Sub-dimensions on Front Section: 8.75 | 8.75 | 15 | 15
      const fDimX = frontX + B;
      cadDimLinear(ctx, fDimX, ryLevels[0], fDimX, ryLevels[1], 20, `8.75`, pal, 10);
      cadDimLinear(ctx, fDimX, ryLevels[1], fDimX, ryLevels[2], 20, `8.75`, pal, 10);
      cadDimLinear(ctx, fDimX, ryLevels[2], fDimX, ryLevels[3], 20, `15`, pal, 10.5);
      cadDimLinear(ctx, fDimX, ryLevels[3], fDimX, ryLevels[4], 20, `15`, pal, 10.5);

      // Callouts on Front Section
      cadLeader(ctx, fx65 - 10, frontY + 20, frontX + B + 46, frontY - 10, 1, ['鋼筋 5(外層)'], pal, 11);
      cadLeader(ctx, fx75 - 3 * s, ryLevels[0], frontX + B + 46, frontY + 12, 1, ['鋼筋 2(內層)'], pal, 11);
      cadLeader(ctx, fx75 - 3 * s, ryLevels[3], frontX + B + 46, frontY + H - 10, 1, ['鋼筋 1(中層)'], pal, 11);
      cadLeader(ctx, midFrontX + 12, m22Y2 + 5, frontX + B + 16, frontY + H + 34, 1, [
        '1.每2個RC箱以2組鍍鋅螺桿固定',
        '  (每組含2根直徑M22螺桿及4組鋼片與螺帽固定)。',
        '2.M22螺桿固定須以兩側螺帽拴緊，並通知監造單',
        '  位做檢驗停留點檢查。'
      ], pal, 11);

      // ---------------------------------------------------------------------
      // VIEW 3: 鍍鋅鋼片示意圖 (9x9cm, ∮30mm孔, 註:板厚5mm)
      // ---------------------------------------------------------------------
      const pSize = 9 * s * 2.1;
      cadPoly(ctx, [
        [plateX, plateY],
        [plateX + pSize, plateY],
        [plateX + pSize, plateY + pSize],
        [plateX, plateY + pSize]
      ], pal.primaryLine, 1.8, true, isDarkTheme ? 'rgba(30,41,59,0.55)' : 'rgba(226,232,240,0.6)', [], 'STEEL_PLATE');
      cadCircle(ctx, plateX + pSize / 2, plateY + pSize / 2, pSize * 0.18, pal.dimLine, 1.4, null, 'HOLE_30MM');

      cadDimLinear(ctx, plateX, plateY, plateX + pSize, plateY, -16, '9', pal, 11);
      cadDimLinear(ctx, plateX + pSize, plateY, plateX + pSize, plateY + pSize, 16, '9', pal, 11);
      cadLeader(ctx, plateX + pSize / 2 - 4, plateY + pSize / 2 + 4, plateX - 15, plateY + pSize + 15, -1, ['∮30mm孔'], pal, 11);
      cadText(ctx, '註:板厚5mm', plateX + pSize / 2, plateY + pSize + 36, 12, pal.textMain, 'center', '600');
      cadText(ctx, '鍍鋅鋼片示意圖', plateX + pSize / 2, plateY + pSize + 54, 12.5, pal.textMain, 'center', '700');

      // ---------------------------------------------------------------------
      // VIEW 4: 平面圖 (Plan View of Single C-Type Box: L=120 x B=90)
      //    Exact match to Original Drawing 2:
      //    - 1 Central Octagonal Cavity (50x60 with 10x10 chamfers)
      //    - Left & Right Half-Octagonal Recesses (20cm deep)
      //    - 4 ☒ bolt pockets on top and bottom walls
      //    - Internal rebar loops & dots (鋼筋 3, 鋼筋 2, 鋼筋 1)
      // ---------------------------------------------------------------------
      const chOut = 4;
      cadPoly(ctx, [
        [planX + chOut, planY],
        [planX + L - chOut, planY],
        [planX + L, planY + chOut],
        [planX + L, planY + B - chOut],
        [planX + L - chOut, planY + B],
        [planX + chOut, planY + B],
        [planX, planY + B - chOut],
        [planX, planY + chOut]
      ], pal.primaryLine, 2.0, true, isDarkTheme ? 'rgba(30,41,59,0.45)' : 'rgba(226,232,240,0.45)', [], 'BOX_PLAN');

      // Y-coordinates for octagonal opening: 15 | 10 | 40 | 10 | 15
      const py15 = planY + T;
      const py25 = py15 + c;
      const py65 = planY + B - T - c;
      const py75 = planY + B - T;

      // X-coordinates for central octagon & side half-octagons:
      // Left half-octagon: planX .. planX + 20cm (with 10cm chamfer)
      // Left 15cm wall: planX + 20cm .. planX + 35cm
      // Center octagon: planX + 35cm .. planX + 85cm (with 10cm chamfers at 45cm & 75cm)
      // Right 15cm wall: planX + 85cm .. planX + 100cm
      // Right half-octagon: planX + 100cm .. planX + 120cm
      const px10 = planX + t;
      const px20 = planX + 2 * t;
      const px35 = px20 + T;
      const px45 = px35 + c;
      const px75 = planX + L - 2 * t - T - c;
      const px85 = planX + L - 2 * t - T;
      const px100 = planX + L - 2 * t;
      const px110 = planX + L - t;

      // Center Octagonal Opening
      cadPoly(ctx, [
        [px45, py15],
        [px75, py15],
        [px85, py25],
        [px85, py65],
        [px75, py75],
        [px45, py75],
        [px35, py65],
        [px35, py25]
      ], pal.primaryLine, 1.7, true, isDarkTheme ? '#0b1120' : '#f8fafc', [], 'BOX_VOID_CENTER');

      // Left Half-Octagonal Recess
      cadPoly(ctx, [
        [planX, py15],
        [px10, py15],
        [px20, py25],
        [px20, py65],
        [px10, py75],
        [planX, py75]
      ], pal.primaryLine, 1.7, false, isDarkTheme ? '#0b1120' : '#f8fafc', [], 'BOX_VOID_LEFT');

      // Right Half-Octagonal Recess
      cadPoly(ctx, [
        [planX + L, py15],
        [px110, py15],
        [px100, py25],
        [px100, py65],
        [px110, py75],
        [planX + L, py75]
      ], pal.primaryLine, 1.7, false, isDarkTheme ? '#0b1120' : '#f8fafc', [], 'BOX_VOID_RIGHT');

      // 4 ☒ bolt pockets on top wall and bottom wall
      const pSlotW = 10;
      [planX + L * 0.14, planX + L * 0.34, planX + L * 0.66, planX + L * 0.86].forEach(sx => {
        drawCrossSlotBox(ctx, sx - pSlotW / 2, planY + 1, pSlotW, T - 2, pal);
        drawCrossSlotBox(ctx, sx - pSlotW / 2, py75 + 1, pSlotW, T - 2, pal);
      });

      // Internal Rebar #2 loop & Rebar #1/#3 cross bars + dots inside Plan Walls
      const rbOff = 5 * s;
      cadLine(ctx, px10, planY + rbOff, px110, planY + rbOff, pal.rebarLine, 1.25, [], 'REBAR_PLAN');
      cadLine(ctx, px10, planY + B - rbOff, px110, planY + B - rbOff, pal.rebarLine, 1.25, [], 'REBAR_PLAN');
      cadLine(ctx, px20 + T * 0.5, planY + rbOff, px20 + T * 0.5, planY + B - rbOff, pal.rebarLine, 1.25, [], 'REBAR_PLAN');
      cadLine(ctx, px85 + T * 0.5, planY + rbOff, px85 + T * 0.5, planY + B - rbOff, pal.rebarLine, 1.25, [], 'REBAR_PLAN');

      // Rebar vertical stirrup ticks & dots along top and bottom walls
      for (let i = 0; i < 6; i++) {
        const rxDot = px35 + (i / 5) * (px85 - px35);
        cadCircle(ctx, rxDot, planY + rbOff + 3, 2.2, pal.rebarAccent, 1.0, null, 'REBAR_DOT');
        cadCircle(ctx, rxDot, planY + B - rbOff - 3, 2.2, pal.rebarAccent, 1.0, null, 'REBAR_DOT');
      }

      // Left M22 Bolt pair on Plan View (at y = 20+10 = 30 and y = 60)
      const slotY1 = planY + 30 * s;
      const slotY2 = planY + 60 * s;
      [slotY1, slotY2].forEach(sy => {
        cadLine(ctx, planX - 8, sy, px35 + 4, sy, pal.rebarAccent, 2.0, [], 'M22_SLOT');
      });

      // Top Dimensions on Plan View: 15 & 15, and 10 | 10 | 50 | 10 | 10
      cadDimLinear(ctx, px10, planY, px20 + T * 0.5, planY, -34, `${p.T_box}`, pal, 11);
      cadDimLinear(ctx, px85 + T * 0.5, planY, px110, planY, -34, `${p.T_box}`, pal, 11);
      cadDimLinear(ctx, planX, planY, px10, planY, -16, `${p.t_box}`, pal, 10.5);
      cadDimLinear(ctx, px10, planY, px20, planY, -16, `${p.t_box}`, pal, 10.5);
      cadDimLinear(ctx, px35, planY, px75, planY, -16, `${holeNetL_cm}`, pal, 11);
      cadDimLinear(ctx, px100, planY, px110, planY, -16, `${p.t_box}`, pal, 10.5);
      cadDimLinear(ctx, px110, planY, planX + L, planY, -16, `${p.t_box}`, pal, 10.5);

      // Bottom & Right Overall Dimensions on Plan View: 120 & 90
      cadDimLinear(ctx, planX, planY + B, planX + L, planY + B, 32, `${p.L_box}`, pal, 12.5);
      cadDimLinear(ctx, planX + L, planY, planX + L, planY + B, 32, `${p.B_box}`, pal, 12.5);

      // Left vertical breakdown on Plan View: 20 | 10 | 30 | 10 | 20
      const py20 = planY + 20 * s;
      const py30 = planY + 30 * s;
      const py60 = planY + 60 * s;
      const py70 = planY + 70 * s;
      cadDimLinear(ctx, planX, planY, planX, py20, -22, '20', pal, 10.5);
      cadDimLinear(ctx, planX, py20, planX, py30, -22, '10', pal, 10.5);
      cadDimLinear(ctx, planX, py30, planX, py60, -22, '30', pal, 10.5);
      cadDimLinear(ctx, planX, py60, planX, py70, -22, '10', pal, 10.5);
      cadDimLinear(ctx, planX, py70, planX, planY + B, -22, '20', pal, 10.5);

      // Internal vertical dimensions inside Center Octagon: 15 | 10 | 40 | 10 | 15
      const intDimX = planX + L * 0.5;
      cadDimLinear(ctx, intDimX, planY, intDimX, py15, -14, `${p.T_box}`, pal, 10);
      cadDimLinear(ctx, intDimX, py15, intDimX, py25, -14, `${p.c_box}`, pal, 10);
      cadDimLinear(ctx, intDimX, py25, intDimX, py65, -14, `${holeNetB_cm}`, pal, 10.5);
      cadDimLinear(ctx, intDimX, py65, intDimX, py75, -14, `${p.c_box}`, pal, 10);
      cadDimLinear(ctx, intDimX, py75, intDimX, planY + B, -14, `${p.T_box}`, pal, 10);

      // Callouts on Plan View
      cadLeader(ctx, planX - 2, slotY1, planX - 42, planY + B * 0.44, -1, [
        '每兩個RC箱以兩組M22螺桿結合',
        '(每組2根55cm及4組鋼片螺帽固定)'
      ], pal, 11);
      cadLeader(ctx, planX + 2, planY + B - 2, planX - 35, planY + B + 28, -1, [
        '本箱外角四角全部',
        '大於等於2*2cm隅角處理'
      ], pal, 11);
      cadLeader(ctx, px85 + T * 0.5, planY + 22, planX + L + 52, planY + 22, 1, ['鋼筋 3(中層)'], pal, 11);
      cadLeader(ctx, px85 + T * 0.5, planY + B * 0.65, planX + L + 52, planY + B * 0.65, 1, ['鋼筋 2(內層)'], pal, 11);
      cadLeader(ctx, px75, planY + B - rbOff, planX + L + 45, planY + B + 18, 1, ['鋼筋 1(中層)'], pal, 11);

      // Cross Axis Legend between Side, Front, and Plan Views (側剖圖 | 正剖圖 / 平面圖)
      const crossX = sideX + L + 140;
      const crossY = sideY + H + 76;
      cadLine(ctx, crossX - 68, crossY, crossX + 68, crossY, pal.primaryLine, 1.3, [], 'AXIS_LEGEND');
      cadLine(ctx, crossX, crossY - 40, crossX, crossY + 40, pal.primaryLine, 1.3, [], 'AXIS_LEGEND');
      cadText(ctx, '側剖圖', crossX - 35, crossY - 16, 12.5, pal.textMain, 'center', '700');
      cadText(ctx, '正剖圖', crossX + 35, crossY - 16, 12.5, pal.textMain, 'center', '700');
      cadText(ctx, '平面圖', crossX - 35, crossY + 18, 12.5, pal.textMain, 'center', '700');

      // ---------------------------------------------------------------------
      // VIEW 5: 預鑄R.C箱施工說明 (1~11)
      // ---------------------------------------------------------------------
      const notes2X = frontX - 20;
      const notes2Y = crossY + 25;
      cadText(ctx, '預鑄R.C箱施工說明：', notes2X, notes2Y, 12.5, pal.textMain, 'left', '700');
      const rcBoxNotes = [
        '1. 開工後須於工區鄰近自行租用空地預鑄，並先試做查驗 並做環境保護相關規定，須將相關之文件報請甲方備查。',
        '2. R.C預鑄箱須隔日拆模後二日方可吊移擺放高度不可高出四排，並養護一週後運至工地安全處堆疊查驗後組立。',
        '3. 底部須有鋼模鎖定，不可漏漿、澆置時間及搗實須依規範施作，不可有冷縫情形，並編號及編制施作日期，經養',
        '   護後報請甲方查驗合格試壓後運至工地，並檢附相關混凝土廠合法証明及圓柱試驗合格証明。',
        '4. 配筋為牆及底板中間，頂端保護層5cm，加工費含墊塊固定筋，配筋鉛絲捆綁。',
        '5. 護岸RC箱之鋼筋配筋加工尺寸先試做一組，並配合鋼模組合後函請甲方查驗。',
        '6. 查驗合格後方可大量加工組立鋼筋，若因預留孔而使鋼筋保護層不足，可申報修正配筋尺寸。',
        '7. 配筋尺寸得配合鋼模預留孔申報修正，配筋尺寸間隔另詳配筋尺寸圖。',
        '8. 鋼筋加工組立及鋼模查驗合格後方可澆置210kg/cm2混凝土共10組，混凝土澆置前須先函送配比表審查合格。',
        '9. 10組澆置完成拆模後，函請甲方查驗合格後方大量生產RC箱塊。',
        '10. 頂面澆置後粉平並查驗，試做粉平合格後全部比照施工。',
        '11. 製作時臨時吊放須防止崩角，俟強度達14天後方可吊排施作。'
      ];
      rcBoxNotes.forEach((ln, idx) => {
        cadText(ctx, ln, notes2X, notes2Y + 20 + idx * 17.5, 11, pal.textSub, 'left', '500');
      });

      // ---------------------------------------------------------------------
      // VIEW 6: 預鑄R.C箱型規格表 & 預鑄RC箱 數量計算表(每塊)
      // ---------------------------------------------------------------------
      const specTableX = originX + 55;
      const specTableY = planY + B + 68;
      cadText(ctx, '預鑄R.C箱型規格', specTableX + 60, specTableY - 12, 12.5, pal.textMain, 'center', '700');
      const specCols = [58, 58, 58, 58, 58, 58];
      const specRows = [
        ['型號\\尺寸', 'L(cm)', 'B(cm)', 'H(cm)', 'T(cm)', 't(cm)'],
        ['C', `${p.L_box}`, `${p.B_box}`, `${p.H_box}`, `${p.T_box}`, `${p.t_box}`]
      ];
      drawCadTable(ctx, specTableX, specTableY, specCols, 24, specRows, pal);

      // Quantity Table per Block (預鑄RC箱 數量計算表 (每塊))
      const qtyTableX = specTableX - 25;
      const qtyTableY = specTableY + 80;
      cadText(ctx, '預鑄RC箱 數量計算表 (每塊)', qtyTableX + 95, qtyTableY - 12, 12.5, pal.textMain, 'center', '700');
      drawUnitQuantityTable(ctx, qtyTableX, qtyTableY, q, pal);

      // ---------------------------------------------------------------------
      // VIEW 7: 預鑄R.C箱型鋼筋表 (#1~#5, 合計 18.06 kg)
      // ---------------------------------------------------------------------
      const rebarTableX = notes2X;
      const rebarTableY = specTableY + 35;
      cadText(ctx, `預鑄R.C箱型鋼筋 L=${p.L_box}cm  B=${p.B_box}cm  H=${p.H_box}cm`, rebarTableX, rebarTableY - 26, 12, pal.textMain, 'left', '700');
      cadText(ctx, '配筋間距配合預留孔由廠商繪施工大樣圖送甲方核定調整並先組合一定數量查驗', rebarTableX, rebarTableY - 10, 11.5, pal.textSub, 'left', '500');
      drawRebarScheduleTable(ctx, rebarTableX, rebarTableY, q, pal);

      return {
        width: (plateX + pSize + 120) - originX,
        height: (qtyTableY + 195) - originY
      };
    }

    // Helper: Generic CAD Table
    function drawCadTable(ctx, x, y, colWidths, rowH, rows, pal) {
      const totalW = colWidths.reduce((a, b) => a + b, 0);
      const totalH = rows.length * rowH;

      // Header background
      ctx.save();
      ctx.fillStyle = pal.tableHeaderBg;
      ctx.fillRect(x, y, totalW, rowH);
      ctx.restore();

      // Outer box
      cadPoly(ctx, [
        [x, y],
        [x + totalW, y],
        [x + totalW, y + totalH],
        [x, y + totalH]
      ], pal.primaryLine, 1.4, true, null, [], 'TABLE');

      // Horizontal lines
      for (let r = 1; r < rows.length; r++) {
        const ry = y + r * rowH;
        cadLine(ctx, x, ry, x + totalW, ry, pal.tableBorder, 1.0, [], 'TABLE');
      }

      // Vertical lines
      let cx = x;
      for (let c = 0; c < colWidths.length - 1; c++) {
        cx += colWidths[c];
        cadLine(ctx, cx, y, cx, y + totalH, pal.tableBorder, 1.0, [], 'TABLE');
      }

      // Cell Texts
      for (let r = 0; r < rows.length; r++) {
        let cellX = x;
        const cy = y + (r + 0.5) * rowH;
        for (let c = 0; c < colWidths.length; c++) {
          const cw = colWidths[c];
          const txt = rows[r][c] !== undefined ? String(rows[r][c]) : '';
          cadText(ctx, txt, cellX + cw / 2, cy, 11.5, r === 0 ? pal.textMain : pal.textSub, 'center', r === 0 ? '700' : '500', 0, 'TABLE_TEXT');
          cellX += cw;
        }
      }
    }

    // Helper: Unit Quantity Calculation Table (預鑄RC箱 數量計算表 (每塊))
    function drawUnitQuantityTable(ctx, x, y, q, pal) {
      const colW = [115, 48, 295];
      const rowHeights = [24, 24, 38, 24, 24, 24];
      const totalW = colW[0] + colW[1] + colW[2];
      const totalH = rowHeights.reduce((a, b) => a + b, 0);

      cadPoly(ctx, [
        [x, y],
        [x + totalW, y],
        [x + totalW, y + totalH],
        [x, y + totalH]
      ], pal.primaryLine, 1.4, true, null, [], 'QTY_TABLE');

      let curY = y;
      const data = [
        ['填方', q.unitFill.toFixed(2), [q.strFillFormula]],
        ['210kg/cm2混凝土(m3)', q.unitConc.toFixed(2), [q.strConcFormula]],
        ['鋼模(m2)', q.unitForm.toFixed(2), [q.strFormFormula1, q.strFormFormula2]],
        ['鋼筋(kg )', q.unitRebar.toFixed(2), ['詳圖數量表']],
        ['鍍鋅螺桿(組)', q.unitBolts.toFixed(1), ['']],
        ['碎石客土袋(袋)', q.unitBags.toFixed(1), ['']]
      ];

      for (let i = 0; i < data.length; i++) {
        const rh = rowHeights[i];
        if (i > 0) {
          cadLine(ctx, x, curY, x + totalW, curY, pal.tableBorder, 1.0, [], 'QTY_TABLE');
        }
        const [item, val, formulas] = data[i];
        cadText(ctx, item, x + 6, curY + rh / 2, 11, pal.textMain, 'left', '600');
        cadText(ctx, val, x + colW[0] + colW[1] / 2, curY + rh / 2, 11.5, pal.dimText, 'center', '700');

        if (formulas.length === 1) {
          cadText(ctx, formulas[0], x + colW[0] + colW[1] + 6, curY + rh / 2, 10.5, pal.textSub, 'left', '500');
        } else if (formulas.length === 2) {
          cadText(ctx, formulas[0], x + colW[0] + colW[1] + 6, curY + rh * 0.32, 10, pal.textSub, 'left', '500');
          cadText(ctx, formulas[1], x + colW[0] + colW[1] + 6, curY + rh * 0.72, 10, pal.textSub, 'left', '500');
        }
        curY += rh;
      }

      // Vertical dividers
      cadLine(ctx, x + colW[0], y, x + colW[0], y + totalH, pal.tableBorder, 1.0, [], 'QTY_TABLE');
      cadLine(ctx, x + colW[0] + colW[1], y, x + colW[0] + colW[1], y + totalH, pal.tableBorder, 1.0, [], 'QTY_TABLE');
    }

    // Helper: Rebar Schedule Table (#1 ~ #5 with graphical bar shape diagrams)
    function drawRebarScheduleTable(ctx, x, y, q, pal) {
      const colW = [52, 65, 76, 65, 58, 58, 65, 92, 96];
      const headerH = 26;
      const rowH = 30;
      const totalW = colW.reduce((a, b) => a + b, 0);
      const totalH = headerH + 6 * rowH;

      ctx.save();
      ctx.fillStyle = pal.tableHeaderBg;
      ctx.fillRect(x, y, totalW, headerH);
      ctx.restore();

      cadPoly(ctx, [
        [x, y],
        [x + totalW, y],
        [x + totalW, y + totalH],
        [x, y + totalH]
      ], pal.primaryLine, 1.4, true, null, [], 'REBAR_TABLE');

      // Diagonal split in first header cell (編號 \ 規格)
      cadLine(ctx, x, y, x + colW[0], y + headerH, pal.tableBorder, 1.0, [], 'REBAR_TABLE');

      const headers = ['編號\\規格', '直徑D(cm)', '單位重(kg/m)', '間距(cm)', '長度(m)', '支數(支)', '重量(kg)', '型  式', '備  註'];
      let hx = x;
      for (let c = 0; c < colW.length; c++) {
        if (c > 0) cadLine(ctx, hx, y, hx, y + totalH, pal.tableBorder, 1.0, [], 'REBAR_TABLE');
        cadText(ctx, headers[c], hx + colW[c] / 2, y + headerH / 2, 10.5, pal.textMain, 'center', '700');
        hx += colW[c];
      }

      const rowsData = [
        ['1', '10', `${__P.wD10}`, '約14,10', q.rebarRows[0].len.toFixed(1), `${q.rebarRows[0].cnt}`, q.rebarRows[0].wt.toFixed(2), 'SHAPE_1', ['']],
        ['2', '10', `${__P.wD10}`, '約12.5', q.rebarRows[1].len.toFixed(1), `${q.rebarRows[1].cnt}`, q.rebarRows[1].wt.toFixed(2), 'SHAPE_2', ['鋼筋搭接', '長30cm須錯縫']],
        ['3', '10', `${__P.wD10}`, '約15', q.rebarRows[2].len.toFixed(1), `${q.rebarRows[2].cnt}`, q.rebarRows[2].wt.toFixed(2), 'SHAPE_3', ['']],
        ['4', '10', `${__P.wD10}`, '', q.rebarRows[3].len.toFixed(1), `${q.rebarRows[3].cnt}`, q.rebarRows[3].wt.toFixed(2), 'SHAPE_4', ['y對角斜鋼筋', '兩側各一支']],
        ['5', '10', `${__P.wD10}`, '', q.rebarRows[4].len.toFixed(1), `${q.rebarRows[4].cnt}`, q.rebarRows[4].wt.toFixed(2), 'SHAPE_5', ['x對角斜鋼筋', '兩側各一支']],
        ['合計', '', '', '', '', '', q.unitRebar.toFixed(2), '', ['']]
      ];

      for (let r = 0; r < rowsData.length; r++) {
        const ry = y + headerH + r * rowH;
        cadLine(ctx, x, ry, x + totalW, ry, pal.tableBorder, 1.0, [], 'REBAR_TABLE');

        let cx = x;
        const row = rowsData[r];
        for (let c = 0; c < colW.length; c++) {
          const cw = colW[c];
          const midX = cx + cw / 2;
          const midY = ry + rowH / 2;

          if (c === 7) {
            // Draw Rebar Shape Diagram inside cell
            const sh = row[7];
            if (sh === 'SHAPE_1') {
              cadPoly(ctx, [[midX - 18, midY - 7], [midX - 18, midY + 7], [midX + 12, midY + 7], [midX + 12, midY - 7]], pal.rebarLine, 1.4, false);
              cadText(ctx, '10', midX - 26, midY, 9, pal.textSub, 'center');
              cadText(ctx, '15', midX + 24, midY + 3, 9, pal.textSub, 'center');
            } else if (sh === 'SHAPE_2') {
              cadPoly(ctx, [[midX - 20, midY - 8], [midX + 14, midY - 8], [midX + 14, midY + 8], [midX - 20, midY + 8]], pal.rebarLine, 1.4, true);
              cadText(ctx, '15', midX - 28, midY, 9, pal.textSub, 'center');
              cadText(ctx, '17', midX + 26, midY - 4, 9, pal.textSub, 'center');
              cadText(ctx, '6', midX + 26, midY + 6, 9, pal.textSub, 'center');
            } else if (sh === 'SHAPE_3') {
              cadPoly(ctx, [[midX - 18, midY - 7], [midX - 18, midY + 7], [midX + 12, midY + 7], [midX + 12, midY - 7]], pal.rebarLine, 1.4, false);
              cadText(ctx, '10', midX - 26, midY, 9, pal.textSub, 'center');
              cadText(ctx, '17', midX + 24, midY + 3, 9, pal.textSub, 'center');
            } else if (sh === 'SHAPE_4' || sh === 'SHAPE_5') {
              cadLine(ctx, midX - 24, midY, midX + 24, midY, pal.rebarLine, 1.5);
            }
          } else if (c === 8) {
            const notes = row[8];
            if (notes.length === 1 && notes[0]) {
              cadText(ctx, notes[0], midX, midY, 9.5, pal.textSub, 'center');
            } else if (notes.length === 2) {
              cadText(ctx, notes[0], midX, ry + rowH * 0.34, 9.5, pal.textSub, 'center');
              cadText(ctx, notes[1], midX, ry + rowH * 0.72, 9.5, pal.textSub, 'center');
            }
          } else {
            const isTotal = (r === 5 && c === 6);
            cadText(ctx, row[c], midX, midY, isTotal ? 12 : 11, isTotal ? pal.dimText : pal.textMain, 'center', isTotal ? '700' : '500');
          }
          cx += cw;
        }
      }
    }

    // =========================================================================
    // 6. MAIN RENDER LOOP & DYNAMIC BOUNDING-BOX LAYOUT
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
      const q = computeQuantities(p);

      // Update Sidebar Summary Cards
      document.getElementById('stat_unit_conc').textContent = `${q.unitConc.toFixed(2)} m³`;
      document.getElementById('stat_unit_rebar').textContent = `${q.unitRebar.toFixed(2)} kg`;
      document.getElementById('stat_unit_fill').textContent = `${q.unitFill.toFixed(2)} m³`;
      document.getElementById('stat_total_boxes').textContent = `${q.totalBoxes} 塊`;
      document.getElementById('stat_wall_conc').textContent = `${q.totalWallConc.toFixed(2)} m³`;
      document.getElementById('zoom-indicator').textContent = `${Math.round(viewCam.scale * 100)}%`;

      // Reset DXF Buffer
      dxfEntities = [];

      // Clear background
      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.fillStyle = pal.bg;
      ctx.fillRect(0, 0, rect.width, rect.height);

      // Apply Pan & Zoom camera transform
      ctx.translate(viewCam.offsetX, viewCam.offsetY);
      ctx.scale(viewCam.scale, viewCam.scale);

      if (currentSheet === 'SHEET1') {
        drawSheet1(ctx, 40, 30, p, q, pal);
      } else if (currentSheet === 'SHEET2') {
        drawSheet2(ctx, 40, 30, p, q, pal);
      } else {
        // 'ALL': Draw Sheet 1 on top/left and Sheet 2 below with dynamic bounding-box safe gap!
        const b1 = drawSheet1(ctx, 40, 30, p, q, pal);
        const sheet2StartY = 30 + b1.height + 110;
        // Separator Banner between Sheet 1 and Sheet 2
        cadLine(ctx, 40, sheet2StartY - 55, 1380, sheet2StartY - 55, pal.paperBorder, 1.5, [10, 6], 'SHEET_SEP');
        drawSheet2(ctx, 40, sheet2StartY, p, q, pal);
      }

      ctx.restore();
    }

    // =========================================================================
    // 7. UI ACTIONS, PRESETS, VIEWPORT CAMERA & DXF / CSV EXPORTERS
    // =========================================================================
    function onParamChange() {
      // Strictly re-render without resetting camera zoom/pan!
      renderAll();
    }

    function switchSheet(sheet) {
      currentSheet = sheet;
      const auditEl = document.getElementById('auditPanel');
      const tabs = {
        ALL: document.getElementById('tab-all'),
        SHEET1: document.getElementById('tab-sheet1'),
        SHEET2: document.getElementById('tab-sheet2'),
        AUDIT: document.getElementById('tab-audit')
      };
      Object.keys(tabs).forEach(k => {
        if (!tabs[k]) return;
        if (k === sheet) {
          tabs[k].className = 'px-3 py-1.5 rounded-md text-xs font-semibold transition-all bg-sky-600 text-white shadow';
        } else {
          tabs[k].className = 'px-3 py-1.5 rounded-md text-xs font-medium transition-all text-slate-400 hover:text-white';
        }
      });

      if (sheet === 'AUDIT') {
        auditEl.classList.remove('hidden');
      } else {
        auditEl.classList.add('hidden');
        fitViewToScreen();
      }
    }

    function applyPreset(mode) {
      const target = mode === 'ORIGINAL' ? ORIG_PARAMS : {
        ...ORIG_PARAMS,
        B_base: 140,
        H_embed: 210,
        H_exposed: 150,
        N_layers: 4,
        L_slope: 360
      };
      Object.keys(target).forEach(k => {
        const el = document.getElementById('inp_' + k);
        if (el) el.value = target[k];
      });
      renderAll();
    }

    function resetToOriginal() {
      applyPreset('ORIGINAL');
    }

    function toggleGhostOverlay() {
      showGhostBaseline = !showGhostBaseline;
      const btn = document.getElementById('btn-ghost');
      if (showGhostBaseline) {
        btn.className = 'px-2.5 py-1 rounded bg-sky-950/90 border border-sky-600/60 text-xs text-sky-300 flex items-center gap-1 transition';
        btn.innerHTML = '<span>📏</span> <span>原圖基準虛線: 開啟</span>';
      } else {
        btn.className = 'px-2.5 py-1 rounded bg-slate-800 border border-slate-700 text-xs text-slate-400 flex items-center gap-1 transition';
        btn.innerHTML = '<span>📏</span> <span>原圖基準虛線: 關閉</span>';
      }
      renderAll();
    }

    function toggleCadTheme() {
      isDarkTheme = !isDarkTheme;
      document.getElementById('theme-label').textContent = isDarkTheme ? '深色 CAD 藍圖' : '白底工程出圖';
      renderAll();
    }

    function fitViewToScreen() {
      const canvas = document.getElementById('cadCanvas');
      if (!canvas) return;
      const rect = canvas.parentElement.getBoundingClientRect();
      if (currentSheet === 'SHEET1') {
        viewCam.scale = Math.min(rect.width / 1450, rect.height / 980) * 0.92;
        viewCam.offsetX = 35;
        viewCam.offsetY = 30;
      } else if (currentSheet === 'SHEET2') {
        viewCam.scale = Math.min(rect.width / 1420, rect.height / 920) * 0.92;
        viewCam.offsetX = 35;
        viewCam.offsetY = 30;
      } else {
        viewCam.scale = Math.min(rect.width / 1480, rect.height / 1880) * 0.94;
        viewCam.offsetX = Math.max(30, (rect.width - 1420 * viewCam.scale) / 2);
        viewCam.offsetY = 20;
      }
      renderAll();
    }

    function zoomByButton(factor) {
      const canvas = document.getElementById('cadCanvas');
      const rect = canvas.parentElement.getBoundingClientRect();
      const cx = rect.width / 2;
      const cy = rect.height / 2;
      const nextScale = Math.max(0.2, Math.min(3.5, viewCam.scale * factor));
      viewCam.offsetX = cx - (cx - viewCam.offsetX) * (nextScale / viewCam.scale);
      viewCam.offsetY = cy - (cy - viewCam.offsetY) * (nextScale / viewCam.scale);
      viewCam.scale = nextScale;
      renderAll();
    }

    // Direct Download DXF (AutoCAD R12/LT2 Compatible ASCII DXF)
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
      a.download = `預鑄RC箱複合式護岸標準圖_0k009_0k038.5.dxf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }

    // Direct Download CSV Quantity Takeoff Book
    function exportCSV() {
      const p = getParams();
      const q = computeQuantities(p);
      const rows = [
        ['預鑄RC箱複合式護岸參數化標準圖 - 工程數量計算書 (0k+009 ~ 0k+038.5)'],
        ['類別 / 項目', '數值 / 規格', '單位', '計算式與備註說明'],
        ['下部場鑄RC擋土牆底寬 B_base', p.B_base, 'cm', '原圖標準 120cm'],
        ['下部場鑄RC擋土牆頂寬 B_top', p.B_top, 'cm', '原圖標準 39cm'],
        ['下部擋土牆總高 H_wall', p.H_wall, 'cm', `埋深 ${p.H_embed}cm + 出水高 ${p.H_exposed}cm`],
        ['中部預鑄RC箱疊砌層數 N_layers', p.N_layers, '層', '原圖標準 3層 (180cm)'],
        ['預鑄RC箱(C型)單體尺寸 L×B×H', `${p.L_box}×${p.B_box}×${p.H_box}`, 'cm', '外框厚 T=' + p.T_box + 'cm, 內厚 t=' + p.t_box + 'cm'],
        ['護岸施工總長度 L_total', p.L_total_m, 'm', '0k+009 ~ 0k+038.5 (29.5m)'],
        [],
        ['【二、預鑄RC箱(每塊)單價數量計算表】', '單塊數量', '單位', '計算式說明'],
        ['填方 (m3)', q.unitFill.toFixed(2), 'm3/塊', `'${q.strFillFormula}`],
        ['210kg/cm2混凝土 (m3)', q.unitConc.toFixed(2), 'm3/塊', `'${q.strConcFormula}`],
        ['鋼模 (m2)', q.unitForm.toFixed(2), 'm2/塊', `'${q.strFormFormula1}${q.strFormFormula2}`],
        ['鋼筋 (kg)', q.unitRebar.toFixed(2), 'kg/塊', '詳鋼筋計算表 (#1~#5 合計)'],
        ['鍍鋅螺桿 (組)', q.unitBolts.toFixed(1), '組/塊', '每組含2根M22螺桿(55cm)及4組9x9cm鍍鋅鋼片螺帽'],
        ['碎石客土袋 (袋)', q.unitBags.toFixed(1), '袋/塊', '每個RC箱外層鋪滿8個碎石客土袋'],
        [],
        ['【三、預鑄R.C箱型鋼筋明細表 (每塊)】', '直徑(mm)', '單位重(kg/m)', '單支長(m)', '支數(支)', '重量(kg)', '備註'],
        ['編號 1 (中層ㄇ型筋)', 10, 0.559, q.rebarRows[0].len, q.rebarRows[0].cnt, q.rebarRows[0].wt, '約14,10cm間距'],
        ['編號 2 (內層閉合筋)', 10, 0.559, q.rebarRows[1].len, q.rebarRows[1].cnt, q.rebarRows[1].wt, '搭接長30cm須錯縫'],
        ['編號 3 (中層ㄇ型筋)', 10, 0.559, q.rebarRows[2].len, q.rebarRows[2].cnt, q.rebarRows[2].wt, '約15cm間距'],
        ['編號 4 (外層y對角斜筋)', 10, 0.559, q.rebarRows[3].len, q.rebarRows[3].cnt, q.rebarRows[3].wt, 'y對角斜鋼筋兩側各一支'],
        ['編號 5 (外層x對角斜筋)', 10, 0.559, q.rebarRows[4].len, q.rebarRows[4].cnt, q.rebarRows[4].wt, 'x對角斜鋼筋兩側各一支'],
        [],
        ['【四、全段護岸工程總數量彙整 (' + p.L_total_m + 'm)】', '全段總數量', '單位', '計算基準'],
        ['預鑄RC箱總塊數', q.totalBoxes, '塊', `${p.N_layers}層 × 每層 ${q.boxesPerLayer}塊`],
        ['預鑄RC箱總混凝土量', (q.totalBoxes * q.unitConc).toFixed(2), 'm3', `${q.totalBoxes}塊 × ${q.unitConc.toFixed(2)} m3`],
        ['預鑄RC箱總鋼筋量', (q.totalBoxes * q.unitRebar).toFixed(2), 'kg', `${q.totalBoxes}塊 × ${q.unitRebar.toFixed(2)} kg`],
        ['下部場鑄RC擋土牆+承載版混凝土', q.totalWallConc.toFixed(2), 'm3', '210kg/cm2 場鑄混凝土'],
        ['210kg/cm2 混凝土打底 (t=' + p.t_pc + 'cm)', q.totalPcConc.toFixed(2), 'm3', '牆底與承載版底打底']
      ];

      const csvContent = '\uFEFF' + rows.map(r => r.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `預鑄RC箱複合式護岸數量計算書_0k009_0k038.5.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }

    // =========================================================================
    // 8. CANVAS MOUSE PAN & WHEEL ZOOM LISTENERS
    // =========================================================================
    function initCanvasInteractions() {
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
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const zoomFactor = e.deltaY < 0 ? 1.12 : 1 / 1.12;
        const nextScale = Math.max(0.2, Math.min(3.5, viewCam.scale * zoomFactor));
        viewCam.offsetX = mouseX - (mouseX - viewCam.offsetX) * (nextScale / viewCam.scale);
        viewCam.offsetY = mouseY - (mouseY - viewCam.offsetY) * (nextScale / viewCam.scale);
        viewCam.scale = nextScale;
        renderAll();
      }, { passive: false });

      window.addEventListener('resize', () => {
        renderAll();
      });
    }

    window.onload = function () {
      initCanvasInteractions();
      fitViewToScreen();
    };
  

  let __P = null; const PAL = getPalette();
  const __n = (k, d) => { const v = parseFloat(RR ? RR[k] : undefined); return Number.isFinite(v) ? v : d; };
  computeQuantities = function (p) {   // 依圖面幾何（預鑄 RC 箱平面：外框－中央八角孔－兩端半八角凹口；cm）
    const L = p.L_box, B = p.B_box, H = p.H_box, T = p.T_box, t = p.t_box, c = p.c_box, rec = 2 * t, Bi = B - 2 * T, Lo = L - 2 * rec - 2 * T, r2 = Math.SQRT2;
    const Aoct = Lo * Bi - 2 * c * c, Arec = rec * Bi - c * c, As = L * B - Aoct - 2 * Arec, holes = 2 * Math.PI * p.hr * p.hr * T;
    const conc = (As * H - holes) / 1e6, voidA = L * B - As, fill = voidA * Math.max(0, H - p.bagT) / 1e6;
    const endOut = 2 * T + 2 * c + 2 * c * r2 + (Bi - 2 * c), perO = 2 * L + 2 * endOut, perH = 2 * (Lo - 2 * c) + 2 * (Bi - 2 * c) + 4 * c * r2, form = ((perO + perH) * H + As) / 1e4;
    const rows = [1, 2, 3, 4, 5].map(i => { const len = p['rb' + i + 'l'], cnt = p['rb' + i + 'n']; return { len, cnt, wt: +(len * cnt * p.wD10).toFixed(2) }; }), rebar = rows.reduce((a, r) => a + r.wt, 0);
    const f = v => (+v).toFixed(1);
    return { unitFill: +fill.toFixed(3), unitConc: +conc.toFixed(3), unitForm: +form.toFixed(2), unitRebar: +rebar.toFixed(2), unitBolts: p.nBolt, unitBags: p.nBag, rebarRows: rows,
      strFillFormula: `=(${f(L)}×${f(B)}−實體 ${f(As)})×(${H}−袋層 ${p.bagT})÷10⁶`, strConcFormula: `=實體 ${f(As)} cm²×${H}−∮3"孔 ${f(holes)} cm³（八角孔 ${f(Aoct)}、凹口 2×${f(Arec)}）`,
      strFormFormula1: `=(外周 ${f(perO)}＋孔周 ${f(perH)})×${H}`, strFormFormula2: `＋底面 ${f(As)} cm²`, As, Aoct, Arec, holes, perO, perH };
  };
  function model(R) {
    RR = R || {};
    const g = __n, p = { B_base: g('B_base', 120), W_out: g('W_out', 30), H_embed: g('H_embed', 180), H_exposed: g('H_exposed', 120), t_pc: g('t_pc', 5), N_layers: Math.max(1, Math.min(8, Math.round(g('N_layers', 3)))),
      N_plan_cols: Math.max(2, Math.min(10, Math.round(g('N_plan_cols', 3)))), t_slab: g('t_slab', 50), H_beam: g('H_beam', 70), W_in: g('W_in', 45), W_mid: g('W_mid', 105), L_slope: 0, W_straw: g('W_straw', 100),
      L_box: g('L_box', 120), B_box: g('B_box', 90), H_box: g('H_box', 60), T_box: g('T_box', 15), t_box: g('t_box', 10), c_box: g('c_box', 10), L_total_m: g('L_tot', 10),
      cov: g('cov', 5.5), pco: g('pco', 6), wpy: g('wpy', 76), drop: g('drop', 25), pvd: g('pvd', 8), pvo: g('pvo', 12), pcl: g('pcl', 5), pcr: g('pcr', 18), bagT: g('bagT', 16), bagH: g('bagH', 7.5),
      hr: g('hr', 3.8), bmT: g('bmT', 30), bmS: g('bmS', 300), bmD: g('bmD', 70), nBolt: g('nBolt', 2), nBag: g('nBag', 8), wD10: g('wD10', 0.56), sp: g('sp', 30), w16: g('w16', 1.56), w13: g('w13', 0.995), wsp: g('wsp', 150),
      rb1l: g('rb1l', 0.5), rb1n: g('rb1n', 14), rb2l: g('rb2l', 3.5), rb2n: g('rb2n', 5), rb3l: g('rb3l', 0.5), rb3n: g('rb3n', 8), rb4l: g('rb4l', 1.0), rb4n: g('rb4n', 2), rb5l: g('rb5l', 0.9), rb5n: g('rb5n', 2), __rng: RR.__rng || '' };
    p.H_wall = p.H_embed + p.H_exposed; p.W_platform = p.W_mid; p.L_slope = p.N_layers * p.B_box; p.B_top = +(p.W_out + (p.B_base - p.W_out) * p.t_slab / p.H_wall).toFixed(1);
    __P = p; const q = computeQuantities(p);
    // 斷面（cm，原工具座標 s＝1：牆背頂＝(0,0)，x 向河道，y 向下）
    const c45 = Math.SQRT1_2, Hw = p.H_wall, Bb = p.B_base, Wo = p.W_out, Wm = p.W_mid, Wi = p.W_in, ts = p.t_slab, fb = ts + p.drop, fl = -Wm - Wi, fr = fl + p.H_beam;
    const wall = [[0, Hw], [Bb, Hw], [Wo, 0], [0, 0]], pcw = [[-p.pco, Hw], [Bb + p.pco, Hw], [Bb + p.pco, Hw + p.t_pc], [-p.pco, Hw + p.t_pc]];
    const plat = [[fl, Wi], [-Wm, 0], [-Wm + p.pvo, 0], [-Wm + p.pvo, p.pvd], [0, p.pvd], [0, ts], [fr, ts], [fr, fb], [fl, fb]], pcs = [[fl - p.pcl, fb], [fr + p.pcr, fb], [fr + p.pcr, fb + p.t_pc], [fl - p.pcl, fb + p.t_pc]];
    const Hb = p.H_box, sB = [-Wm - Hb * c45, Hb * c45], sp = (d, k) => [sB[0] - c45 * d + c45 * k, sB[1] - c45 * d - c45 * k], boxes = [];
    for (let i = 0; i < p.N_layers; i++) boxes.push([sp(i * p.B_box, 0), sp((i + 1) * p.B_box, 0), sp((i + 1) * p.B_box, Hb), sp(i * p.B_box, Hb)]);
    const top = sp(p.L_slope, Hb), bankY = top[1] - 2 * p.bagH, bankX = top[0] - 28 + 4, yBed = Hw - p.H_embed, xBed = Wo + (Bb - Wo) * yBed / Hw;
    // 每公尺數量
    const A = P => __A(P) / 1e4, nBox = p.N_layers * 100 / p.L_box, hyp = Math.hypot;
    const wFront = hyp(Bb - Wo, Hw) / 100, cv = p.cov, nps = 100 / p.sp;
    const L16 = ((Hw - 2 * cv) + 5 + 8 + (Bb - cv - 1.25 * cv)) / 100 * nps, L13w = (hyp((Bb - 1.25 * cv) - (Wo - cv), Hw - 2 * cv) + 10) / 100 * nps + 20;
    const L13p = ((Wm - 6) + (Wm + Wi - 10) + hyp(Wi - 4, Wi + 4 - p.pvd - 5) + (fb - 5 - (Wi + 4)) + (p.H_beam - 11) + (fb - p.pvd - 10)) / 100 * nps + 6;
    const weep = (Wo + (Bb - Wo) * (p.wpy + 4) / Hw) / 100 * 2 * 100 / p.wsp;
    const beam = Math.max(0, -fr) * p.bmD / 1e4 * p.bmT / p.bmS;
    const Q = { beam, wall: A(wall), plat: A(plat) + beam, pc: A(pcw) + A(pcs), nBox, bconc: nBox * q.unitConc, bfill: nBox * q.unitFill, bform: nBox * q.unitForm, brebar: nBox * q.unitRebar, bolt: nBox * p.nBolt, bag: nBox * p.nBag,
      r16: L16 * p.w16, r13: (L13w + L13p) * p.w13, formS: wFront, formN: (Hw + (fb - Wi)) / 100, geo: (p.L_slope + 8) / 100, straw: p.W_straw / 100, paver: (Wm - p.pvo) / 100, weep };
    RR = null; return { p, q, Q, wall, pcw, plat, pcs, boxes, top, bankY, bankX, yBed, xBed, Hw, Bb, fl, fr, fb, L16, L13w, L13p };
  }
  function prims(m) {
    O = []; const p = m.p, q = m.q, s = 1.08, sc = 1 / s; __P = p;
    const b1 = drawSheet1(CTX, 40, 30, p, q, PAL), y2 = 30 + b1.height + 110;
    cadLine(CTX, 40, y2 - 55, 1380, y2 - 55, PAL.paperBorder || '#64748b', 1.5, [10, 6], 'SHEET_SEP');
    const b2 = drawSheet2(CTX, 40, y2, p, q, PAL);
    const Q = m.Q, f = (v, n) => (+v).toFixed(n === undefined ? 3 : n), ty = y2 + b2.height + 30, N = [
      `每公尺量測（單岸）：下部 RC 牆斷面 ${f(Q.wall)} m²（頂 ${p.W_out}、底 ${p.B_base}、高 ${m.Hw}；承台底處牆厚 ${p.B_top}）；平台與前趾斷面 ${f(Q.plat - Q.beam)} m²＋間格樑 ${f(Q.beam)} m³/m（${p.bmT}/${p.bmS}×寬 ${f(-m.fr, 0)}×版底下深 ${p.bmD}）；打底 ${f(Q.pc)} m²`,
      `RC 箱：每公尺 ${f(Q.nBox, 2)} 塊（${p.N_layers} 層 × 100/${p.L_box}）；單塊 混凝土 ${f(q.unitConc)} m³、回填 ${f(q.unitFill)} m³、鋼模 ${f(q.unitForm, 2)} m²、鋼筋 ${f(q.unitRebar, 2)} kg（依配筋表）`,
      `牆鋼筋（依圖配筋）：∮16@${p.sp} 主筋每支 ${f(m.L16 / (100 / p.sp), 2)} m；∮13 斜筋＋分布筋 ${f(m.L13w, 1)} m/m；平台 ∮13 ${f(m.L13p, 1)} m/m`,
      `造型模板＝牆前斜面 ${f(Q.formS)} m²/m；普通模板＝牆背直立＋前趾直立 ${f(Q.formN)} m²/m；織布＝斜坡 ${p.L_slope}＋8 cm；植草磚寬 ${p.W_mid - p.pvo} cm；PVC 排水管 @${p.wsp} cm`];
    N.forEach((t, i) => cadText(CTX, t, 60, ty + i * 20, 12, '#fde047', 'left', '600', 0, 'NOTE'));
    return O.map(o => { const r = Object.assign({}, o); if (r.p) r.p = r.p.map(([x, y]) => [x * sc, y * sc]); if (r.x !== undefined) { r.x *= sc; r.y *= sc; } if (r.r) r.r *= sc; if (r.h) r.h *= sc; return r; });
  }
  function __A(p) { let s = 0; for (let i = 0; i < p.length; i++) { const a = p[i], b = p[(i + 1) % p.length]; s += a[0] * b[1] - b[0] * a[1]; } return Math.abs(s) / 2; }


  function cadLine(ctx, x1, y1, x2, y2, color, width, dash, layer) { O.push({ k: 'L', p: [[x1, -y1], [x2, -y2]], c: color, w: width || 1.5, d: dash || [], ly: layer || '0' }); }
  function cadPoly(ctx, pts, color, width, close, fill, dash, layer) { if (!pts || pts.length < 2) return; O.push({ k: 'P', p: pts.map(q => [q[0], -q[1]]), c: color, w: width || 1.6, f: fill || null, cl: close !== false, d: dash || [], ly: layer || '0' }); }
  function cadCircle(ctx, cx, cy, r, color, width, fill, layer) { O.push({ k: 'C', x: cx, y: -cy, r, c: color, f: fill || null, w: width || 1.2, ly: layer || '0' }); }
  function cadText(ctx, str, x, y, size, color, align, weight, angleDeg, layer) { O.push({ k: 'T', x, y: -y, s: String(str), h: (size || 12) * 1.05, c: color || '#f8fafc', al: align || 'left', bl: 'middle', rot: -(angleDeg || 0) * Math.PI / 180, ly: layer || 'TEXT' }); }

  return { model, prims };
})();
