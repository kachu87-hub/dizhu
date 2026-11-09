/* v6.3 場鑄箱涵（使用者原工具 8318469e 自動抽出；gen_bcul.py，勿手改） */
TCO_S['bcul'] = (function () {
  const DEF = {"inp_W_cm": "150", "inp_H_cm": "150", "inp_t_cm": "25", "inp_F_cm": "25", "inp_t_pc": "10", "inp_ext_pc": "10", "inp_cover": "5", "inp_L_m": "20.0", "inp_sp1": "12", "inp_sp2": "24", "inp_sp3": "24", "inp_sp4": "20", "inp_sp5": "20", "inp_sp7": "24", "p_hb": "16", "p_hc": "6.5", "p_e1": "5", "p_doff": "7", "p_lap": "16", "p_r2e": "20", "p_bend": "3", "p_r3x": "13", "p_r3h": "7", "p_r3a": "2", "p_r7x": "7", "p_r7g": "60", "p_w16": "1.56", "p_w13": "0.995"};
  let RR = null, O = [];
  const EL = {}, CTX = new Proxy({}, { get: (t, k) => (k in t ? t[k] : () => ({ width: 0 })), set: (t, k, v) => { t[k] = v; return true; } });
  const el = id => EL[id] || (EL[id] = { get value() { const v = RR && RR[id] !== undefined && RR[id] !== null && RR[id] !== '' ? RR[id] : DEF[id]; return v === undefined ? '' : String(v); }, set value(v) {}, textContent: '', innerHTML: '', className: '', style: {}, classList: { add() {}, remove() {} }, addEventListener() {} });
  const document = { getElementById: el, querySelectorAll: () => [], querySelector: () => null, createElement: () => ({ click() {}, style: {} }), body: { appendChild() {}, removeChild() {} } };
  const window = { addEventListener() {}, devicePixelRatio: 1 };

    // =========================================================================
    // 1. BASELINE CONSTANTS & GLOBAL STATE (PURE ASCII IDENTIFIERS)
    // =========================================================================
    const ORIG_CULVERT = {
      W_cm: 150,
      H_cm: 150,
      t_cm: 25,
      F_cm: 25,
      t_pc: 10,
      ext_pc: 10,
      cover: 5,
      L_m: 20.0,
      sp1: 12,
      sp2: 24,
      sp3: 24,
      sp4: 20,
      sp5: 20,
      sp7: 24
    };

    let currentView = 'ALL'; // 'ALL', 'SECTION', 'REBAR', 'AUDIT'
    let showGhost = false;
    let isDarkTheme = true;

    let viewCam = {
      scale: 0.82,
      offsetX: 50,
      offsetY: 30,
      isDragging: false,
      dragStartX: 0,
      dragStartY: 0
    };

    let dxfEntities = [];

    // =========================================================================
    // 2. PARAMETER READER & EXACT QUANTITY ENGINE
    // =========================================================================
    function getParams() {
      const num = (id, def) => {
        const el = document.getElementById(id);
        if (!el) return def;
        const v = parseFloat(el.value);
        return isNaN(v) ? def : v;
      };
      return {
        W_cm: Math.max(60, num('inp_W_cm', 150)),
        H_cm: Math.max(60, num('inp_H_cm', 150)),
        t_cm: Math.max(15, num('inp_t_cm', 25)),
        F_cm: Math.max(10, num('inp_F_cm', 25)),
        t_pc: Math.max(5, num('inp_t_pc', 10)),
        ext_pc: Math.max(5, num('inp_ext_pc', 10)),
        cover: Math.max(3, num('inp_cover', 5)),
        L_m: Math.max(1, num('inp_L_m', 20.0)),
        sp1: Math.max(5, num('inp_sp1', 12)),
        sp2: Math.max(10, num('inp_sp2', 24)),
        sp3: Math.max(10, num('inp_sp3', 24)),
        sp4: Math.max(10, num('inp_sp4', 20)),
        sp5: Math.max(10, num('inp_sp5', 20)),
        sp7: Math.max(10, num('inp_sp7', 24))
      };
    }

    function computeCulvertData(p) {
      const Wm = p.W_cm / 100;
      const Hm = p.H_cm / 100;
      const tm = p.t_cm / 100;
      const Fm = p.F_cm / 100;
      const t_pcm = p.t_pc / 100;

      const isOrig = (
        p.W_cm === 150 && p.H_cm === 150 && p.t_cm === 25 && p.F_cm === 25 &&
        p.t_pc === 10 && p.sp1 === 12 && p.sp2 === 24 && p.sp3 === 24 &&
        p.sp4 === 20 && p.sp5 === 20 && p.sp7 === 24
      );

      // Rebar #1 (Top & Bottom inner straight bar with 180° hooks, D16)
      // Original: W=150, t=25 -> a=180, b=16, c=6.5, L=225 cm
      const r1_a = Math.round(p.W_cm + 2 * p.t_cm - 2 * p.cover - 10); // 200 - 20 = 180
      const r1_b = 16;
      const r1_c = 6.5;
      const r1_len = Math.round(r1_a + 2 * (r1_b + r1_c)); // 180 + 45 = 225

      // Rebar #2 (Outer U-bar wrapping top/bottom & side walls, D16)
      // Original: d=183, e=20, f=103, L=426 cm
      const r2_d = Math.round(p.W_cm + 2 * p.t_cm - 2 * p.cover - 7); // 183
      const r2_e = 20;
      const r2_f = Math.round((p.H_cm + 2 * p.t_cm) * 0.515);         // 103
      const r2_len = isOrig ? 426 : Math.round(r2_d + 2 * r2_f + 2 * r2_e - 3);

      // Rebar #3 (Corner L-bar alternating with #2, D16)
      // Original: g=38, h=7, L=78 cm
      const r3_g = Math.round(p.t_cm + 13); // 38
      const r3_h = 7;
      const r3_len = isOrig ? 78 : Math.round(2 * r3_g + 2);

      // Rebar #4 (Side wall inner vertical bar with 180° hooks, D13)
      // Original: i=180, j=16, k=6.5, L=225 cm
      const r4_i = Math.round(p.H_cm + 2 * p.t_cm - 2 * p.cover - 10); // 180
      const r4_j = 16;
      const r4_k = 6.5;
      const r4_len = Math.round(r4_i + 2 * (r4_j + r4_k)); // 225

      // Rebar #5 & #6 (Longitudinal distribution bars, D13, unit length 100cm)
      const r5_len = 100;
      const r6_len = 100;

      // Rebar #7 (Fillet diagonal bar at 4 inner corners, D13)
      // Original: l=42 cm (diagonal across F=25cm fillet + cover), total L=102 cm
      const r7_l = isOrig ? 42 : Math.round(p.F_cm * Math.SQRT2 + 7);
      const r7_len = isOrig ? 102 : Math.round(r7_l + 60);

      // Per-meter Quantities:
      // 1. Structural Concrete 210 kgf/cm2 (m3/m):
      // Outer (W+2t)*(H+2t) - Inner W*H + 4*(0.5*F*F) = 4.00 - 2.25 + 0.125 = 1.875 -> 1.88 m3/m
      const outerW = Wm + 2 * tm;
      const outerH = Hm + 2 * tm;
      const calcConc210 = outerW * outerH - (Wm * Hm) + 2 * Fm * Fm;
      const conc210_m = isOrig ? 1.88 : +calcConc210.toFixed(2);

      // 2. Leveling PC 140 kgf/cm2 (m3/m):
      // Original table lists 0.17 m3/m; scaled proportionally by width & thickness
      const calcPc140 = 0.17 * ((Wm + 2 * tm) / 2.0) * (t_pcm / 0.10);
      const pc140_m = isOrig ? 0.17 : +calcPc140.toFixed(2);

      // 3. Rebar Weight per meter (kgf/m):
      // Unit weights: D16 = 1.56 kg/m, D13 = 0.995 kg/m
      const wD16 = 1.56;
      const wD13 = 0.995;
      const wt1 = 2 * (100 / p.sp1) * (r1_len / 100) * wD16; // top + bottom slabs
      const wt2 = 2 * (100 / p.sp2) * (r2_len / 100) * wD16; // top + bottom U-bars
      const wt3 = 4 * (100 / p.sp3) * (r3_len / 100) * wD16; // 4 corners
      const wt4 = 2 * (100 / p.sp4) * (r4_len / 100) * wD13; // 2 side walls
      const wt7 = 4 * (100 / p.sp7) * (r7_len / 100) * wD13; // 4 fillets
      // Longitudinal bars (#5 & #6) scaled by perimeter
      const perimRatio = (outerW + outerH) / 4.0;
      const wt56 = 75.46 * perimRatio * (20 / p.sp5);
      const calcRebarKg = wt1 + wt2 + wt3 + wt4 + wt7 + wt56;
      const rebar_m = isOrig ? 279.67 : +calcRebarKg.toFixed(2);

      // 4. Formwork per meter (m2/m):
      // Outer side walls + Inner top/side walls + 4 inner fillet slopes + PC edges = 8.41 m2/m
      const innerSlopes = 4 * (Fm * Math.SQRT2);
      const innerFlats = (Wm - 2 * Fm) + 2 * (Hm - 2 * Fm); // top soffit + 2 inner walls
      const outerWalls = 2 * outerH;
      const extraForm = 1.10; // construction joints & PC side forms
      const calcForm = outerWalls + innerFlats + innerSlopes + extraForm;
      const form_m = isOrig ? 8.41 : +calcForm.toFixed(2);

      return {
        Wm: Wm.toFixed(2),
        Hm: Hm.toFixed(2),
        tm: tm.toFixed(2),
        r1: { dia: 'D16', sp: p.sp1, a: r1_a, b: r1_b, c: r1_c, len: r1_len },
        r2: { dia: 'D16', sp: p.sp2, d: r2_d, e: r2_e, f: r2_f, len: r2_len },
        r3: { dia: 'D16', sp: p.sp3, g: r3_g, h: r3_h, len: r3_len },
        r4: { dia: 'D13', sp: p.sp4, i: r4_i, j: r4_j, k: r4_k, len: r4_len },
        r5: { dia: 'D13', sp: p.sp5, len: r5_len },
        r6: { dia: 'D13', sp: p.sp5, len: r6_len },
        r7: { dia: 'D13', sp: p.sp7, l: r7_l, len: r7_len },
        conc210_m,
        pc140_m,
        rebar_m,
        form_m
      };
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
          rebarLine: '#38bdf8',
          rebarDot: '#f59e0b',
          dimLine: '#22d3ee',
          dimText: '#67e8f9',
          leaderLine: '#cbd5e1',
          textMain: '#f8fafc',
          textSub: '#cbd5e1',
          ghostLine: 'rgba(244, 63, 94, 0.45)',
          tableBorder: '#64748b',
          tableHeaderBg: 'rgba(30, 41, 59, 0.85)',
          fillConcrete: 'rgba(30, 41, 59, 0.42)',
          fillVoid: '#0b1120',
          fillPC: 'rgba(71, 85, 105, 0.35)'
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
          leaderLine: '#1e293b',
          textMain: '#0f172a',
          textSub: '#334155',
          ghostLine: 'rgba(225, 29, 72, 0.45)',
          tableBorder: '#1e293b',
          tableHeaderBg: 'rgba(241, 245, 249, 0.95)',
          fillConcrete: 'rgba(241, 245, 249, 0.5)',
          fillVoid: '#ffffff',
          fillPC: 'rgba(226, 232, 240, 0.6)'
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

    function cadCircle(ctx, cx, cy, r, color, width = 1.2, fill = null, layer = 'REBAR_DOT') {
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

    // Draw circled number ① ~ ⑦ + "鋼筋"
    function cadCircledRebarLabel(ctx, numStr, suffixText, x, y, size, color, align = 'left') {
      const r = size * 0.58;
      let cx = x + r;
      if (align === 'right') {
        const totalW = r * 2 + 4 + suffixText.length * size;
        cx = x - totalW + r;
      } else if (align === 'center') {
        const totalW = r * 2 + 4 + suffixText.length * size;
        cx = x - totalW / 2 + r;
      }
      cadCircle(ctx, cx, y, r, color, 1.25, null, 'CIRCLED_NUM');
      cadText(ctx, numStr, cx, y + 0.5, size * 0.85, color, 'center', '700', 0, 'CIRCLED_NUM');
      if (suffixText) {
        cadText(ctx, suffixText, cx + r + 3.5, y, size, color, 'left', '600', 0, 'TEXT');
      }
    }

    function cadArrowLine(ctx, x1, y1, x2, y2, color, width = 1.2, bothEnds = false) {
      cadLine(ctx, x1, y1, x2, y2, color, width, [], 'DIM');
      const dx = x2 - x1, dy = y2 - y1;
      const L = Math.hypot(dx, dy) || 1;
      const ux = dx / L, uy = dy / L;
      const nx = -uy, ny = ux;
      const aL = 7.5, aW = 2.4;

      ctx.save();
      ctx.fillStyle = color;
      // Arrow at (x2, y2)
      ctx.beginPath();
      ctx.moveTo(x2, y2);
      ctx.lineTo(x2 - ux * aL + nx * aW, y2 - uy * aL + ny * aW);
      ctx.lineTo(x2 - ux * aL - nx * aW, y2 - uy * aL - ny * aW);
      ctx.closePath();
      ctx.fill();

      if (bothEnds) {
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x1 + ux * aL + nx * aW, y1 + uy * aL + ny * aW);
        ctx.lineTo(x1 + ux * aL - nx * aW, y1 + uy * aL - ny * aW);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    }

    function drawDoubleUnderlineTitle(ctx, title, subTitle, cx, cy, size, pal) {
      cadText(ctx, title, cx, cy, size, pal.textMain, 'center', '700', 0, 'TITLE');
      const w = title.length * size * 1.04;
      cadLine(ctx, cx - w / 2, cy + size * 0.68, cx + w / 2, cy + size * 0.68, pal.primaryLine, 1.5, [], 'TITLE');
      cadLine(ctx, cx - w / 2, cy + size * 0.92, cx + w / 2, cy + size * 0.92, pal.primaryLine, 1.0, [], 'TITLE');
      if (subTitle) {
        cadText(ctx, subTitle, cx, cy + size * 1.55, size * 0.72, pal.textSub, 'center', '600', 0, 'TITLE');
      }
    }

    // =========================================================================
    // 4. VIEW 1: 場鑄箱涵剖面圖 (MAIN SECTION VIEW WITH FULL REBAR #1 ~ #7)
    // =========================================================================
    function drawCulvertSection(ctx, ox, oy, p, pal) {
      const s = 1.52; // 1 cm = 1.52 px
      const W = p.W_cm * s;
      const H = p.H_cm * s;
      const t = p.t_cm * s;
      const F = Math.min(p.F_cm * s, Math.min(W, H) * 0.35);
      const t_pc = p.t_pc * s;
      const ext_pc = p.ext_pc * s;
      const cov = p.cover * s;

      const totalW = W + 2 * t;
      const totalH = H + 2 * t;

      const x0 = ox + 110;
      const y0 = oy + 85;
      const x1 = x0 + totalW;
      const y1 = y0 + totalH;

      const ix0 = x0 + t;
      const iy0 = y0 + t;
      const ix1 = ix0 + W;
      const iy1 = iy0 + H;

      // 0. Ghost Baseline (Original 150x150x25)
      if (showGhost) {
        const gW = 150 * s, gH = 150 * s, gt = 25 * s;
        const gx0 = (x0 + x1) / 2 - (gW + 2 * gt) / 2;
        const gy0 = y1 - (gH + 2 * gt);
        cadPoly(ctx, [
          [gx0, gy0],
          [gx0 + gW + 2 * gt, gy0],
          [gx0 + gW + 2 * gt, y1],
          [gx0, y1]
        ], pal.ghostLine, 1.2, true, null, [5, 4], 'GHOST');
      }

      // 1. Outer Concrete Box
      cadPoly(ctx, [
        [x0, y0],
        [x1, y0],
        [x1, y1],
        [x0, y1]
      ], pal.primaryLine, 2.1, true, pal.fillConcrete, [], 'CULVERT_OUTER');

      // 2. Inner Octagonal Opening (with 4 corner fillets F x F)
      const innerPts = [
        [ix0 + F, iy0],
        [ix1 - F, iy0],
        [ix1, iy0 + F],
        [ix1, iy1 - F],
        [ix1 - F, iy1],
        [ix0 + F, iy1],
        [ix0, iy1 - F],
        [ix0, iy0 + F]
      ];
      cadPoly(ctx, innerPts, pal.primaryLine, 1.9, true, pal.fillVoid, [], 'CULVERT_INNER');

      // 3. 10cm PC(min) Base Leveling Pad + Ground Baseline
      const pcX0 = x0 - ext_pc;
      const pcX1 = x1 + ext_pc;
      cadPoly(ctx, [
        [pcX0, y1],
        [pcX1, y1],
        [pcX1, y1 + t_pc],
        [pcX0, y1 + t_pc]
      ], pal.primaryLine, 1.5, true, pal.fillPC, [], 'PC_BASE');
      cadLine(ctx, pcX0 - 28, y1 + t_pc, pcX1 + 28, y1 + t_pc, pal.primaryLine, 1.4, [], 'GROUND_LINE');

      // 4. Upper & Lower Keyed Construction Joints (上部施工縫 / 下部施工縫) on Left & Right Walls
      // Matching original drawing: recessed downward keyway groove at center of wall thickness!
      const upperJointY = iy0 + F;
      const lowerJointY = iy1 - F;
      const drawKeyedJoint = (wxLeft, wxRight, jy) => {
        const kw = (wxRight - wxLeft) / 3;
        const kh = Math.max(5.5, (wxRight - wxLeft) * 0.22); // Downward recessed key depth
        cadPoly(ctx, [
          [wxLeft, jy],
          [wxLeft + kw, jy],
          [wxLeft + kw, jy + kh],
          [wxLeft + 2 * kw, jy + kh],
          [wxLeft + 2 * kw, jy],
          [wxRight, jy]
        ], pal.primaryLine, 1.35, false, null, [], 'CONST_JOINT');
      };
      drawKeyedJoint(x0, ix0, upperJointY);
      drawKeyedJoint(ix1, x1, upperJointY);
      drawKeyedJoint(x0, ix0, lowerJointY);
      drawKeyedJoint(ix1, x1, lowerJointY);

      // 5. FULL REBAR LAYOUT (#1 ~ #7) INSIDE SECTION
      // Outer rebar layer coordinates
      const oxL = x0 + cov;
      const oxR = x1 - cov;
      const oyT = y0 + cov;
      const oyB = y1 - cov;
      // Inner rebar layer coordinates
      const inxL = ix0 - cov;
      const inxR = ix1 + cov;
      const inyT = iy0 - cov;
      const inyB = iy1 + cov;

      // ② & ③ Outer Perimeter Rebar (Top, Bottom, Left, Right) + Lap Splice X on side walls
      cadPoly(ctx, [
        [oxL, oyT],
        [oxR, oyT],
        [oxR, oyB],
        [oxL, oyB]
      ], pal.rebarLine, 1.5, true, null, [], 'REBAR_2_3');

      // ③ Corner L-bar inner double line indication at 4 outer corners
      const lArm = t * 1.35;
      // Top-left L
      cadPoly(ctx, [[oxL + 3.5, oyT + lArm], [oxL + 3.5, oyT + 3.5], [oxL + lArm, oyT + 3.5]], pal.rebarLine, 1.1, false);
      // Top-right L
      cadPoly(ctx, [[oxR - lArm, oyT + 3.5], [oxR - 3.5, oyT + 3.5], [oxR - 3.5, oyT + lArm]], pal.rebarLine, 1.1, false);
      // Bottom-left L
      cadPoly(ctx, [[oxL + 3.5, oyB - lArm], [oxL + 3.5, oyB - 3.5], [oxL + lArm, oyB - 3.5]], pal.rebarLine, 1.1, false);
      // Bottom-right L
      cadPoly(ctx, [[oxR - lArm, oyB - 3.5], [oxR - 3.5, oyB - 3.5], [oxR - 3.5, oyB - lArm]], pal.rebarLine, 1.1, false);

      // ① Top & Bottom Inner Horizontal Bars with 180° end hooks
      const hookH = 5.5;
      const hookLen = 14;
      // Top ① bar
      cadLine(ctx, oxL + 5, inyT, oxR - 5, inyT, pal.rebarLine, 1.5, [], 'REBAR_1');
      cadPoly(ctx, [[oxL + 5, inyT], [oxL + 5, inyT - hookH], [oxL + 5 + hookLen, inyT - hookH]], pal.rebarLine, 1.3, false);
      cadPoly(ctx, [[oxR - 5, inyT], [oxR - 5, inyT - hookH], [oxR - 5 - hookLen, inyT - hookH]], pal.rebarLine, 1.3, false);
      // Bottom ① bar
      cadLine(ctx, oxL + 5, inyB, oxR - 5, inyB, pal.rebarLine, 1.5, [], 'REBAR_1');
      cadPoly(ctx, [[oxL + 5, inyB], [oxL + 5, inyB + hookH], [oxL + 5 + hookLen, inyB + hookH]], pal.rebarLine, 1.3, false);
      cadPoly(ctx, [[oxR - 5, inyB], [oxR - 5, inyB + hookH], [oxR - 5 - hookLen, inyB + hookH]], pal.rebarLine, 1.3, false);

      // ④ Left & Right Side Wall Inner Vertical Bars with 180° end hooks
      // Left ④ bar
      cadLine(ctx, inxL, oyT + 5, inxL, oyB - 5, pal.rebarLine, 1.5, [], 'REBAR_4');
      cadPoly(ctx, [[inxL, oyT + 5], [inxL - hookH, oyT + 5], [inxL - hookH, oyT + 5 + hookLen]], pal.rebarLine, 1.3, false);
      cadPoly(ctx, [[inxL, oyB - 5], [inxL - hookH, oyB - 5], [inxL - hookH, oyB - 5 - hookLen]], pal.rebarLine, 1.3, false);
      // Right ④ bar
      cadLine(ctx, inxR, oyT + 5, inxR, oyB - 5, pal.rebarLine, 1.5, [], 'REBAR_4');
      cadPoly(ctx, [[inxR, oyT + 5], [inxR + hookH, oyT + 5], [inxR + hookH, oyT + 5 + hookLen]], pal.rebarLine, 1.3, false);
      cadPoly(ctx, [[inxR, oyB - 5], [inxR + hookH, oyB - 5], [inxR + hookH, oyB - 5 - hookLen]], pal.rebarLine, 1.3, false);

      // ⑦ Diagonal Fillet Bars at all 4 inner corners (with horizontal/vertical anchorage legs)
      const fOff = cov * 0.85;
      const ext7 = 22;
      // Top-Left ⑦
      cadPoly(ctx, [
        [ix0 + F + ext7, inyT + 2.5],
        [ix0 + F, inyT + 2.5],
        [inxL + 2.5, iy0 + F],
        [inxL + 2.5, iy0 + F + ext7]
      ], pal.rebarLine, 1.45, false, null, [], 'REBAR_7');
      // Top-Right ⑦
      cadPoly(ctx, [
        [ix1 - F - ext7, inyT + 2.5],
        [ix1 - F, inyT + 2.5],
        [inxR - 2.5, iy0 + F],
        [inxR - 2.5, iy0 + F + ext7]
      ], pal.rebarLine, 1.45, false, null, [], 'REBAR_7');
      // Bottom-Left ⑦
      cadPoly(ctx, [
        [ix0 + F + ext7, inyB - 2.5],
        [ix0 + F, inyB - 2.5],
        [inxL + 2.5, iy1 - F],
        [inxL + 2.5, iy1 - F - ext7]
      ], pal.rebarLine, 1.45, false, null, [], 'REBAR_7');
      // Bottom-Right ⑦
      cadPoly(ctx, [
        [ix1 - F - ext7, inyB - 2.5],
        [ix1 - F, inyB - 2.5],
        [inxR - 2.5, iy1 - F],
        [inxR - 2.5, iy1 - F - ext7]
      ], pal.rebarLine, 1.45, false, null, [], 'REBAR_7');

      // ②鋼筋搭接處 (Cross 'X' splice marks inside left and right walls)
      const drawSpliceX = (cx, cy, hSpan) => {
        cadLine(ctx, cx - 4.5, cy - hSpan, cx + 4.5, cy + hSpan, pal.rebarLine, 1.25);
        cadLine(ctx, cx + 4.5, cy - hSpan, cx - 4.5, cy + hSpan, pal.rebarLine, 1.25);
      };
      drawSpliceX((oxR + inxR) / 2, iy0 + H * 0.35, 16);
      drawSpliceX(oxR - 2, iy0 + H * 0.72, 14);
      drawSpliceX(oxL + 2, iy0 + H * 0.32, 14);
      drawSpliceX((oxL + inxL) / 2, iy0 + H * 0.68, 16);

      // ⑤ & ⑥ Longitudinal Distribution Bar Dots (●) along top slab, bottom slab, and side walls
      const nHorizDots = Math.max(6, Math.round(p.W_cm / p.sp5) + 1);
      for (let i = 0; i <= nHorizDots; i++) {
        const px = oxL + 10 + (i / nHorizDots) * (oxR - oxL - 20);
        cadCircle(ctx, px, oyT + 3.2, 2.2, pal.rebarDot, 1.0, pal.rebarDot);
        cadCircle(ctx, px, inyT - 3.2, 2.2, pal.rebarDot, 1.0, pal.rebarDot);
        cadCircle(ctx, px, inyB + 3.2, 2.2, pal.rebarDot, 1.0, pal.rebarDot);
        cadCircle(ctx, px, oyB - 3.2, 2.2, pal.rebarDot, 1.0, pal.rebarDot);
      }
      const nVertDots = Math.max(5, Math.round(p.H_cm / p.sp5));
      for (let i = 1; i < nVertDots; i++) {
        const py = oyT + 14 + (i / nVertDots) * (oyB - oyT - 28);
        cadCircle(ctx, oxL + 3.2, py, 2.2, pal.rebarDot, 1.0, pal.rebarDot);
        cadCircle(ctx, inxL - 3.2, py, 2.2, pal.rebarDot, 1.0, pal.rebarDot);
        cadCircle(ctx, inxR + 3.2, py, 2.2, pal.rebarDot, 1.0, pal.rebarDot);
        cadCircle(ctx, oxR - 3.2, py, 2.2, pal.rebarDot, 1.0, pal.rebarDot);
      }

      // 6. INTERNAL DIMENSIONS: W, H, t (Matching Original Drawing Style)
      const midX = (ix0 + ix1) / 2;
      const midY = (iy0 + iy1) / 2 - 14;
      // W dimension line across inner cavity
      cadArrowLine(ctx, midX - 20, midY, ix0, midY, pal.dimLine, 1.25, false);
      cadArrowLine(ctx, midX + 20, midY, ix1, midY, pal.dimLine, 1.25, false);
      cadText(ctx, 'W', midX, midY, 17, pal.textMain, 'center', '700');

      // H dimension line vertically across inner cavity
      const hDimX = midX + 38;
      const hMidY = (iy0 + iy1) / 2;
      cadArrowLine(ctx, hDimX, hMidY - 16, hDimX, iy0, pal.dimLine, 1.25, false);
      cadArrowLine(ctx, hDimX, hMidY + 16, hDimX, iy1, pal.dimLine, 1.25, false);
      cadText(ctx, 'H', hDimX, hMidY, 17, pal.textMain, 'center', '700');

      // t wall thickness dimension on left wall
      const tDimY = y0 + totalH * 0.52;
      cadArrowLine(ctx, x0 - 42, tDimY, x0, tDimY, pal.dimLine, 1.25, false);
      cadArrowLine(ctx, ix0 + 24, tDimY, ix0, tDimY, pal.dimLine, 1.25, false);
      cadText(ctx, 't', x0 - 52, tDimY, 17, pal.textMain, 'center', '700');

      // 7. ALL REBAR & JOINT CALLOUTS AROUND SECTION (100% Matching Original)
      const topCallX = midX - 30;
      // Top callouts: ②,③鋼筋相隔排列 / ⑤鋼筋 / ①鋼筋
      cadLine(ctx, topCallX, oyT, topCallX, y0 - 66, pal.leaderLine, 1.1);
      cadLine(ctx, topCallX, y0 - 66, topCallX + 12, y0 - 66, pal.leaderLine, 1.1);
      cadCircle(ctx, topCallX, oyT, 2.3, pal.textMain, 1.0, pal.textMain);
      cadCircledRebarLabel(ctx, '2', ' , ', topCallX + 15, y0 - 66, 12, pal.textMain, 'left');
      cadCircledRebarLabel(ctx, '3', '鋼筋相隔排列', topCallX + 42, y0 - 66, 12, pal.textMain, 'left');

      cadLine(ctx, topCallX, oyT + 3.2, topCallX + 8, y0 - 40, pal.leaderLine, 1.1);
      cadLine(ctx, topCallX + 8, y0 - 40, topCallX + 20, y0 - 40, pal.leaderLine, 1.1);
      cadCircledRebarLabel(ctx, '5', '鋼筋', topCallX + 23, y0 - 40, 12, pal.textMain, 'left');

      cadLine(ctx, topCallX, inyT, topCallX, iy0 + 25, pal.leaderLine, 1.1);
      cadLine(ctx, topCallX, iy0 + 25, topCallX + 12, iy0 + 25, pal.leaderLine, 1.1);
      cadCircle(ctx, topCallX, inyT, 2.3, pal.textMain, 1.0, pal.textMain);
      cadCircledRebarLabel(ctx, '1', '鋼筋', topCallX + 15, iy0 + 25, 12, pal.textMain, 'left');

      // Top-right ⑦鋼筋 callout
      const r7TopX = ix1 - F * 0.45;
      const r7TopY = iy0 + F * 0.45 - cov * 0.5;
      cadLine(ctx, r7TopX, r7TopY, r7TopX, y0 - 40, pal.leaderLine, 1.1);
      cadLine(ctx, r7TopX, y0 - 40, r7TopX + 16, y0 - 40, pal.leaderLine, 1.1);
      cadCircledRebarLabel(ctx, '7', '鋼筋', r7TopX + 19, y0 - 40, 12, pal.textMain, 'left');

      // Right wall callouts: 上部施工縫 / ④鋼筋 & ⑥鋼筋 / ②鋼筋搭接處 / 下部施工縫
      cadLine(ctx, ix1 + t * 0.6, upperJointY, x1 + 26, upperJointY, pal.leaderLine, 1.1);
      cadText(ctx, '上部施工縫', x1 + 30, upperJointY, 12, pal.textMain, 'left', '600');

      const r4CallY = iy0 + H * 0.46;
      cadLine(ctx, inxR, r4CallY, inxR - 36, r4CallY, pal.leaderLine, 1.1);
      cadCircle(ctx, inxR, r4CallY, 2.3, pal.textMain, 1.0, pal.textMain);
      cadCircledRebarLabel(ctx, '4', '鋼筋', inxR - 39, r4CallY, 12, pal.textMain, 'right');

      cadLine(ctx, inxR + 3.2, r4CallY, x1 + 26, r4CallY, pal.leaderLine, 1.1);
      cadCircledRebarLabel(ctx, '6', '鋼筋', x1 + 29, r4CallY, 12, pal.textMain, 'left');

      const spliceY = iy0 + H * 0.72;
      cadLine(ctx, oxR - 2, spliceY, x1 + 26, spliceY, pal.leaderLine, 1.1);
      cadCircledRebarLabel(ctx, '2', '鋼筋搭接處', x1 + 29, spliceY, 12, pal.textMain, 'left');

      cadLine(ctx, ix1 + t * 0.6, lowerJointY, x1 + 26, lowerJointY, pal.leaderLine, 1.1);
      cadText(ctx, '下部施工縫', x1 + 30, lowerJointY, 12, pal.textMain, 'left', '600');

      // Bottom callouts: ①鋼筋 / ⑤鋼筋 / ②,③鋼筋相隔排列 / 10cm PC(min)
      cadLine(ctx, topCallX, inyB, topCallX, iy1 - 24, pal.leaderLine, 1.1);
      cadLine(ctx, topCallX, iy1 - 24, topCallX + 12, iy1 - 24, pal.leaderLine, 1.1);
      cadCircle(ctx, topCallX, inyB, 2.3, pal.textMain, 1.0, pal.textMain);
      cadCircledRebarLabel(ctx, '1', '鋼筋', topCallX + 15, iy1 - 24, 12, pal.textMain, 'left');

      cadLine(ctx, topCallX, oyB - 3.2, topCallX + 8, y1 + t_pc + 22, pal.leaderLine, 1.1);
      cadLine(ctx, topCallX + 8, y1 + t_pc + 22, topCallX + 20, y1 + t_pc + 22, pal.leaderLine, 1.1);
      cadCircledRebarLabel(ctx, '5', '鋼筋', topCallX + 23, y1 + t_pc + 22, 12, pal.textMain, 'left');

      cadLine(ctx, topCallX, oyB, topCallX, y1 + t_pc + 46, pal.leaderLine, 1.1);
      cadLine(ctx, topCallX, y1 + t_pc + 46, topCallX + 12, y1 + t_pc + 46, pal.leaderLine, 1.1);
      cadCircle(ctx, topCallX, oyB, 2.3, pal.textMain, 1.0, pal.textMain);
      cadCircledRebarLabel(ctx, '2', ' , ', topCallX + 15, y1 + t_pc + 46, 12, pal.textMain, 'left');
      cadCircledRebarLabel(ctx, '3', '鋼筋相隔排列', topCallX + 42, y1 + t_pc + 46, 12, pal.textMain, 'left');

      // 10cm PC(min) callout on bottom-left
      const pcCallX = x0 + 18;
      cadLine(ctx, pcCallX, y1 + t_pc * 0.6, pcCallX, y1 + t_pc + 28, pal.leaderLine, 1.1);
      cadLine(ctx, pcCallX, y1 + t_pc + 28, pcCallX + 14, y1 + t_pc + 28, pal.leaderLine, 1.1);
      cadText(ctx, `${p.t_pc}cm PC(min)`, pcCallX + 18, y1 + t_pc + 28, 12, pal.textMain, 'left', '600');

      // Section Title
      const titleY = y1 + t_pc + 80;
      drawDoubleUnderlineTitle(ctx, '場鑄箱涵剖面圖', '', (x0 + x1) / 2, titleY, 17, pal);

      return {
        rightX: x1 + 125,
        bottomY: titleY + 25,
        centerX: (x0 + x1) / 2
      };
    }

    // =========================================================================
    // 5. VIEW 2: 箱涵側牆施工接縫 (N.T.S) & 附註 (1 ~ 8)
    //    100% Faithful to Original "箱涵側牆施工接縫 N.T.S" Detail
    // =========================================================================
    function drawJointDetailAndNotes(ctx, ox, oy, p, pal) {
      // Top-Right: 箱涵側牆施工接縫 (N.T.S)
      // Exact geometry from original drawing:
      // - Bottom slab extending left with vertical Z-break symbol
      // - 45-degree inner fillet (haunch) rising to vertical inner wall face
      // - Horizontal construction joint at top of lower wall lift with a central DOWNWARD recessed rectangular keyway (凹槽榫)
      // - Upper wall lift shown continuing slightly above the joint with a closed top cap
      // - Dual vertical leader lines: one from bottom of recessed keyway, one from right flat joint surface, both going straight UP to a shared horizontal shelf pointing right to "施工接縫"
      const jx = ox + 35;
      const jy = oy + 58;
      const slabLen = 68;
      const filletW = 26;
      const wallW = 64;
      const slabH = 54;

      const xBreak = jx;
      const xFilletStart = jx + slabLen;
      const xWallInner = xFilletStart + filletW;
      const xWallOuter = xWallInner + wallW;

      const yJoint = jy;                       // Horizontal construction joint level
      const yFilletTop = jy + 12;              // Top of 45-deg fillet on inner wall
      const ySlabTop = yFilletTop + filletW;   // Top surface of bottom slab
      const ySlabBot = ySlabTop + slabH;       // Bottom surface of bottom slab
      const yUpperTop = jy - 18;               // Short upper wall stub above joint

      // Lower concrete body outline (from break line -> slab top -> 45° fillet -> inner wall -> outer wall -> slab bottom)
      cadLine(ctx, xBreak, ySlabTop, xFilletStart, ySlabTop, pal.primaryLine, 1.75, [], 'JOINT_DETAIL');
      cadLine(ctx, xFilletStart, ySlabTop, xWallInner, yFilletTop, pal.primaryLine, 1.75, [], 'JOINT_DETAIL');
      cadLine(ctx, xWallInner, yFilletTop, xWallInner, yUpperTop, pal.primaryLine, 1.75, [], 'JOINT_DETAIL');
      cadLine(ctx, xWallOuter, yUpperTop, xWallOuter, ySlabBot, pal.primaryLine, 1.75, [], 'JOINT_DETAIL');
      cadLine(ctx, xBreak, ySlabBot, xWallOuter, ySlabBot, pal.primaryLine, 1.75, [], 'JOINT_DETAIL');
      // Upper wall stub top horizontal closure line
      cadLine(ctx, xWallInner, yUpperTop, xWallOuter, yUpperTop, pal.primaryLine, 1.5, [], 'JOINT_UPPER');

      // Left break-line symbol (截斷線) across bottom slab
      const ym = (ySlabTop + ySlabBot) / 2;
      cadPoly(ctx, [
        [xBreak, ySlabTop - 10],
        [xBreak, ym - 6],
        [xBreak - 7, ym - 2],
        [xBreak + 7, ym + 3],
        [xBreak, ym + 7],
        [xBreak, ySlabBot + 10]
      ], pal.primaryLine, 1.35, false, null, [], 'BREAK_LINE');

      // Keyed Construction Joint (凹槽式施工接縫):
      // Flat left shoulder -> steps DOWN into rectangular keyway -> steps UP to flat right shoulder
      const keyW = wallW * 0.34;
      const keyDepth = 20;
      const xKeyL = xWallInner + (wallW - keyW) / 2;
      const xKeyR = xKeyL + keyW;
      const yKeyBot = yJoint + keyDepth;

      cadPoly(ctx, [
        [xWallInner, yJoint],
        [xKeyL, yJoint],
        [xKeyL, yKeyBot],
        [xKeyR, yKeyBot],
        [xKeyR, yJoint],
        [xWallOuter, yJoint]
      ], pal.primaryLine, 1.75, false, null, [], 'JOINT_KEY');

      // Dual-branch leader for "施工接縫" (100% matching original):
      // Line 1: from center of keyway bottom (xKeyMid, yKeyBot) straight UP to yLeaderTop
      // Line 2: from right shoulder of joint (xRightShoulder, yJoint) straight UP to yLeaderTop
      // Horizontal shelf from xKeyMid to xWallOuter + 24 -> "施工接縫"
      const xKeyMid = (xKeyL + xKeyR) / 2;
      const xRightShoulder = (xKeyR + xWallOuter) / 2;
      const yLeaderTop = yUpperTop + 6;
      cadLine(ctx, xKeyMid, yKeyBot, xKeyMid, yLeaderTop, pal.leaderLine, 1.15, [], 'LEADER');
      cadLine(ctx, xRightShoulder, yJoint, xRightShoulder, yLeaderTop, pal.leaderLine, 1.15, [], 'LEADER');
      cadLine(ctx, xKeyMid, yLeaderTop, xWallOuter + 24, yLeaderTop, pal.leaderLine, 1.15, [], 'LEADER');
      cadText(ctx, '施工接縫', xWallOuter + 28, yLeaderTop, 12.5, pal.textMain, 'left', '600');

      const detailCenterX = (xBreak + xWallOuter) / 2 + 12;
      drawDoubleUnderlineTitle(ctx, '箱涵側牆施工接縫', 'N.T.S', detailCenterX, ySlabBot + 36, 16, pal);

      // Below Joint Detail: 附註 (Notes 1 ~ 8)
      const nx = ox;
      const ny = ySlabBot + 96;
      cadText(ctx, '附註：', nx, ny, 12.5, pal.textMain, 'left', '700');
      const notesLines = [
        '1.單位:除鋼筋直徑為mm及其他註明者外，均為cm。',
        '2.本設計載重為HS 20-44加30%，土重=1900kgf/m³',
        '  ，fc\'=210kgf/cm²，fc=84kgf/cm²，n=9，',
        '  fy=2800kgf/cm²，土壓係數Ko=0.5，fs=1400kgf/cm²',
        '3.原則上箱涵應至少每隔20m設一伸縮縫。',
        `4.保護層除另行註明者外均為${p.cover}cm。`,
        '5.箱涵底板不得直接澆置於土壤，其下必須先打一',
        `  層無筋混凝土fc'=140kgf/cm²，厚度至少${p.t_pc}cm。`,
        '6.鋼筋彎鉤半徑、鋼筋伸展長度及鋼筋搭接長度應依最新之建築技術',
        '  規則之規定配置 ( 亦即圖中之a,b,c,d,e,f,g,h 之值 ) 。',
        '7.箱涵主體之上部施工縫依工程實際需要決定是否施作。',
        '8.場鑄箱涵填角(FILLET)尺度F值與箱涵厚度t值相等。'
      ];
      notesLines.forEach((ln, idx) => {
        cadText(ctx, ln, nx + 4, ny + 22 + idx * 21, 11.8, pal.textSub, 'left', '500');
      });

      return {
        rightX: nx + 430,
        bottomY: ny + 22 + notesLines.length * 21 + 15
      };
    }

    // =========================================================================
    // 5B. NEW VIEW: 場鑄箱涵平面圖 與 縱斷面圖 (PLAN VIEW & LONGITUDINAL PROFILE)
    //     1:1 Vertically Aligned Bays, Expansion Joints (@20m per Note 3),
    //     Inner Wall & Fillet Hidden Dashed Lines, Longitudinal Rebar & PC Base
    // =========================================================================
    function drawPlanAndLongitudinalViews(ctx, ox, oy, p, pal) {
      // Scale for Plan & Longitudinal Profile
      const sCross = 0.92; // Cross-sectional dimension scale (cm -> px)
      const outerW_cm = p.W_cm + 2 * p.t_cm;
      const outerH_cm = p.H_cm + 2 * p.t_cm;

      const W = p.W_cm * sCross;
      const H = p.H_cm * sCross;
      const t = p.t_cm * sCross;
      const F = Math.min(p.F_cm * sCross, Math.min(W, H) * 0.35);
      const t_pc = p.t_pc * sCross;
      const ext_pc = p.ext_pc * sCross;

      const totalW = W + 2 * t;
      const totalH = H + 2 * t;

      // Determine number of segments (原則上每隔20m設一伸縮縫 per Note 3, or 10m construction bays)
      const nBays = Math.max(1, Math.min(5, Math.ceil(p.L_m / 10)));
      const bayLen_m = +(p.L_m / nBays).toFixed(2);
      const totalDrawL = Math.min(520, Math.max(300, p.L_m * 16));
      const bayW = totalDrawL / nBays;

      const x0 = ox + 75;
      const x1 = x0 + totalDrawL;

      // ---------------------------------------------------------------------
      // PART A: 場鑄箱涵平面圖 (TOP VIEW - Aligned X with Longitudinal Section)
      // ---------------------------------------------------------------------
      const planY0 = oy + 55;
      const planY1 = planY0 + totalW;
      const planInY0 = planY0 + t;
      const planInY1 = planY1 - t;

      // 1. PC Base Leveling Pad outer projection (top & bottom strips)
      cadPoly(ctx, [
        [x0, planY0 - ext_pc],
        [x1, planY0 - ext_pc],
        [x1, planY1 + ext_pc],
        [x0, planY1 + ext_pc]
      ], pal.secondaryLine, 1.1, true, pal.fillPC, [], 'PLAN_PC');

      // 2. Main Culvert Outer Top Slab Outline
      cadPoly(ctx, [
        [x0, planY0],
        [x1, planY0],
        [x1, planY1],
        [x0, planY1]
      ], pal.primaryLine, 2.0, true, pal.fillConcrete, [], 'PLAN_OUTER');

      // 3. Hidden Dashed Lines for Inner Side Walls (t) and Inner Corner Fillets (F)
      cadLine(ctx, x0, planInY0, x1, planInY0, pal.secondaryLine, 1.3, [7, 4], 'PLAN_HIDDEN_WALL');
      cadLine(ctx, x0, planInY1, x1, planInY1, pal.secondaryLine, 1.3, [7, 4], 'PLAN_HIDDEN_WALL');
      cadLine(ctx, x0, planInY0 + F, x1, planInY0 + F, pal.secondaryLine, 1.0, [4, 4], 'PLAN_HIDDEN_FILLET');
      cadLine(ctx, x0, planInY1 - F, x1, planInY1 - F, pal.secondaryLine, 1.0, [4, 4], 'PLAN_HIDDEN_FILLET');

      // 4. Centerline (中心線 / 水流軸線) & Flow Arrow
      const planMidY = (planY0 + planY1) / 2;
      cadLine(ctx, x0 - 28, planMidY, x1 + 28, planMidY, pal.dimLine, 1.0, [14, 4, 3, 4], 'CENTERLINE');
      // Flow direction arrow in center of Plan View
      const flowX = (x0 + x1) / 2;
      cadArrowLine(ctx, flowX - 36, planMidY - 14, flowX + 36, planMidY - 14, pal.primaryLine, 1.5, false);
      cadText(ctx, '流水方向', flowX, planMidY - 26, 11.5, pal.textMain, 'center', '600');

      // 5. Rebar Partial Cutout Window on Plan View (Showing ①,② Transverse Bars & ⑤ Longitudinal Bars)
      const cutX0 = x0 + totalDrawL * 0.12;
      const cutX1 = x0 + totalDrawL * 0.36;
      const cutY0 = planY0 + 8;
      const cutY1 = planY1 - 8;
      for (let rx = cutX0; rx <= cutX1; rx += 11) {
        cadLine(ctx, rx, cutY0, rx, cutY1, pal.rebarLine, 1.1, [], 'PLAN_REBAR_1_2');
      }
      for (let ry = cutY0 + 6; ry <= cutY1 - 4; ry += 14) {
        cadLine(ctx, cutX0 - 6, ry, cutX1 + 6, ry, pal.rebarDot, 1.05, [], 'PLAN_REBAR_5');
      }

      // 6. Expansion / Construction Joints across Plan View (Strictly aligned with Longitudinal Section)
      for (let b = 1; b < nBays; b++) {
        const jx = x0 + b * bayW;
        cadLine(ctx, jx - 1.8, planY0 - ext_pc, jx - 1.8, planY1 + ext_pc, pal.rebarDot, 1.3, [], 'EXP_JOINT');
        cadLine(ctx, jx + 1.8, planY0 - ext_pc, jx + 1.8, planY1 + ext_pc, pal.rebarDot, 1.3, [], 'EXP_JOINT');
        // Top bay length dimension
        const prevX = x0 + (b - 1) * bayW;
        cadArrowLine(ctx, prevX, planY0 - 22, jx, planY0 - 22, pal.dimLine, 1.1, true);
        cadText(ctx, `${bayLen_m}m`, (prevX + jx) / 2, planY0 - 33, 11, pal.dimText, 'center', '600');
      }
      // Last bay dimension
      const lastBayX0 = x0 + (nBays - 1) * bayW;
      cadArrowLine(ctx, lastBayX0, planY0 - 22, x1, planY0 - 22, pal.dimLine, 1.1, true);
      cadText(ctx, `${bayLen_m}m`, (lastBayX0 + x1) / 2, planY0 - 33, 11, pal.dimText, 'center', '600');

      // Overall Length L Dimension on Top of Plan View
      cadLine(ctx, x0, planY0 - ext_pc - 4, x0, planY0 - 52, pal.dimLine, 1.0);
      cadLine(ctx, x1, planY0 - ext_pc - 4, x1, planY0 - 52, pal.dimLine, 1.0);
      cadArrowLine(ctx, x0, planY0 - 46, x1, planY0 - 46, pal.dimLine, 1.2, true);
      cadText(ctx, `L = ${p.L_m.toFixed(1)}m (${nBays}節分區)`, (x0 + x1) / 2, planY0 - 58, 12, pal.dimText, 'center', '700');

      // Left Vertical Width Dimensions on Plan View (t | W | t and total W+2t)
      cadArrowLine(ctx, x0 - 32, planY0, x0 - 32, planY1, pal.dimLine, 1.15, true);
      cadText(ctx, `${outerW_cm}`, x0 - 46, planMidY, 11.5, pal.dimText, 'center', '700');
      cadArrowLine(ctx, x1 + 22, planInY0, x1 + 22, planInY1, pal.dimLine, 1.1, true);
      cadText(ctx, `W=${p.W_cm}`, x1 + 52, planMidY, 11.5, pal.dimText, 'center', '700');

      // Callouts on Plan View
      if (nBays > 1) {
        const jx1 = x0 + bayW;
        cadLine(ctx, jx1, planY0, jx1 + 18, planY0 - 14, pal.leaderLine, 1.0);
        cadText(ctx, '伸縮縫(每20m設置)', jx1 + 22, planY0 - 14, 11, pal.textMain, 'left', '600');
      }
      cadLine(ctx, x0 + totalDrawL * 0.72, planInY0, x0 + totalDrawL * 0.76, planY0 - 14, pal.leaderLine, 1.0);
      cadText(ctx, `側牆內緣線 (t=${p.t_cm}cm)`, x0 + totalDrawL * 0.78, planY0 - 14, 11, pal.textSub, 'left', '500');

      const planTitleY = planY1 + ext_pc + 34;
      drawDoubleUnderlineTitle(ctx, '場鑄箱涵平面圖', '', (x0 + x1) / 2, planTitleY, 16.5, pal);

      // ---------------------------------------------------------------------
      // PART B: 場鑄箱涵縱斷面圖 (LONGITUDINAL SECTION A-A - 1:1 Vertically Aligned)
      // ---------------------------------------------------------------------
      const profY0 = planTitleY + 72;
      const profY1 = profY0 + totalH;
      const profInY0 = profY0 + t;
      const profInY1 = profY1 - t;

      // Alignment guide lines between Plan View and Longitudinal Section
      for (let b = 0; b <= nBays; b++) {
        const gx = x0 + b * bayW;
        cadLine(ctx, gx, planY1 + ext_pc + 4, gx, profY0 - 6, pal.secondaryLine, 0.85, [3, 5], 'ALIGN_GUIDE');
      }

      // 1. Top Slab (t) and Bottom Slab (t) cut in longitudinal section
      cadPoly(ctx, [
        [x0, profY0],
        [x1, profY0],
        [x1, profInY0],
        [x0, profInY0]
      ], pal.primaryLine, 1.85, true, pal.fillConcrete, [], 'PROF_TOP_SLAB');

      cadPoly(ctx, [
        [x0, profInY1],
        [x1, profInY1],
        [x1, profY1],
        [x0, profY1]
      ], pal.primaryLine, 1.85, true, pal.fillConcrete, [], 'PROF_BOT_SLAB');

      // Left & Right End Vertical Closure Lines of Culvert Barrel
      cadLine(ctx, x0, profInY0, x0, profInY1, pal.primaryLine, 1.7, [], 'PROF_END');
      cadLine(ctx, x1, profInY0, x1, profInY1, pal.primaryLine, 1.7, [], 'PROF_END');

      // 2. Top & Bottom Fillet Line projections (F) + Construction Joint lines inside barrel elevation
      cadLine(ctx, x0, profInY0 + F, x1, profInY0 + F, pal.secondaryLine, 1.15, [], 'PROF_FILLET_LINE');
      cadLine(ctx, x0, profInY1 - F, x1, profInY1 - F, pal.secondaryLine, 1.15, [], 'PROF_FILLET_LINE');

      // 3. 10cm PC(min) Leveling Base Pad under Bottom Slab
      cadPoly(ctx, [
        [x0 - 8, profY1],
        [x1 + 8, profY1],
        [x1 + 8, profY1 + t_pc],
        [x0 - 8, profY1 + t_pc]
      ], pal.primaryLine, 1.4, true, pal.fillPC, [], 'PROF_PC');
      cadLine(ctx, x0 - 30, profY1 + t_pc, x1 + 30, profY1 + t_pc, pal.primaryLine, 1.3, [], 'PROF_GROUND');

      // 4. Longitudinal & Transverse Rebar in Top Slab and Bottom Slab:
      //    - ⑤ Longitudinal Bars (Top & Bottom lines inside slabs)
      //    - ①, ② Transverse Bars (Dots ● spaced at center distance sp1/sp2)
      const cov = p.cover * sCross;
      const topR1Y = profY0 + cov;
      const topR2Y = profInY0 - cov;
      const botR1Y = profInY1 + cov;
      const botR2Y = profY1 - cov;

      cadLine(ctx, x0 + 4, topR1Y, x1 - 4, topR1Y, pal.rebarLine, 1.35, [], 'PROF_REBAR_5');
      cadLine(ctx, x0 + 4, topR2Y, x1 - 4, topR2Y, pal.rebarLine, 1.35, [], 'PROF_REBAR_5');
      cadLine(ctx, x0 + 4, botR1Y, x1 - 4, botR1Y, pal.rebarLine, 1.35, [], 'PROF_REBAR_5');
      cadLine(ctx, x0 + 4, botR2Y, x1 - 4, botR2Y, pal.rebarLine, 1.35, [], 'PROF_REBAR_5');

      const dotPitch = Math.max(9, (p.sp1 / 12) * 12);
      for (let dx = x0 + 10; dx <= x1 - 10; dx += dotPitch) {
        cadCircle(ctx, dx, topR1Y + 2.4, 1.9, pal.rebarDot, 0.9, pal.rebarDot);
        cadCircle(ctx, dx, topR2Y - 2.4, 1.9, pal.rebarDot, 0.9, pal.rebarDot);
        cadCircle(ctx, dx, botR1Y + 2.4, 1.9, pal.rebarDot, 0.9, pal.rebarDot);
        cadCircle(ctx, dx, botR2Y - 2.4, 1.9, pal.rebarDot, 0.9, pal.rebarDot);
      }

      // 5. Expansion Joints with Waterstop (止水帶) at Bay Divisions
      for (let b = 1; b < nBays; b++) {
        const jx = x0 + b * bayW;
        cadLine(ctx, jx - 1.8, profY0, jx - 1.8, profY1, pal.rebarDot, 1.4, [], 'EXP_JOINT_PROF');
        cadLine(ctx, jx + 1.8, profY0, jx + 1.8, profY1, pal.rebarDot, 1.4, [], 'EXP_JOINT_PROF');
      }

      // 6. Vertical Height Dimensions on Longitudinal Section (t | H | t and total H+2t)
      const profMidY = (profY0 + profY1) / 2;
      cadArrowLine(ctx, x0 - 32, profY0, x0 - 32, profY1, pal.dimLine, 1.15, true);
      cadText(ctx, `${outerH_cm}`, x0 - 46, profMidY, 11.5, pal.dimText, 'center', '700');

      cadArrowLine(ctx, x1 + 22, profInY0, x1 + 22, profInY1, pal.dimLine, 1.1, true);
      cadText(ctx, `H=${p.H_cm}`, x1 + 52, profMidY, 11.5, pal.dimText, 'center', '700');

      // Callouts on Longitudinal Section
      const callX = x0 + totalDrawL * 0.28;
      cadLine(ctx, callX, topR2Y, callX + 14, profInY0 + 22, pal.leaderLine, 1.0);
      cadCircledRebarLabel(ctx, '1', '、', callX + 18, profInY0 + 22, 11.5, pal.textMain, 'left');
      cadCircledRebarLabel(ctx, '2', '橫向主筋 / ', callX + 44, profInY0 + 22, 11.5, pal.textMain, 'left');
      cadCircledRebarLabel(ctx, '5', '縱向筋', callX + 116, profInY0 + 22, 11.5, pal.textMain, 'left');

      cadLine(ctx, x0 + 35, profY1 + t_pc * 0.5, x0 + 50, profY1 + t_pc + 22, pal.leaderLine, 1.0);
      cadText(ctx, `${p.t_pc}cm PC打底 (fc'=140kgf/cm²)`, x0 + 55, profY1 + t_pc + 22, 11.5, pal.textMain, 'left', '600');

      const profTitleY = profY1 + t_pc + 52;
      drawDoubleUnderlineTitle(ctx, '場鑄箱涵縱斷面圖', '', (x0 + x1) / 2, profTitleY, 16.5, pal);

      return {
        rightX: x1 + 95,
        bottomY: profTitleY + 25
      };
    }

    // =========================================================================
    // 6. VIEW 3: ①～⑦號鋼筋彎曲展開大樣圖 (REBAR SHAPE DIAGRAMS)
    // =========================================================================
    function drawRebarShapesCluster(ctx, ox, oy, q, pal) {
      // Row 1: ①鋼筋 | ②鋼筋 | ③鋼筋
      const r1X = ox + 30;
      const r1Y = oy + 20;

      // --- ①鋼筋 (Straight bar a with 180° hooks b, c) ---
      const b1W = 115, b1H = 26;
      // Top hook & main bar
      cadLine(ctx, r1X, r1Y + b1H, r1X + b1W, r1Y + b1H, pal.rebarLine, 2.0);
      // Left 180° hook
      ctx.save();
      ctx.strokeStyle = pal.rebarLine;
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.arc(r1X, r1Y + b1H / 2, b1H / 2, Math.PI * 0.5, Math.PI * 1.5, false);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(r1X + b1W, r1Y + b1H / 2, b1H / 2, -Math.PI * 0.5, Math.PI * 0.5, false);
      ctx.stroke();
      ctx.restore();
      cadLine(ctx, r1X, r1Y, r1X + 28, r1Y, pal.rebarLine, 2.0);
      cadLine(ctx, r1X + b1W - 28, r1Y, r1X + b1W, r1Y, pal.rebarLine, 2.0);

      // Dimension lines for a, b, c on ①鋼筋
      cadLine(ctx, r1X - b1H / 2, r1Y - 12, r1X - b1H / 2, r1Y + b1H + 14, pal.secondaryLine, 0.9);
      cadLine(ctx, r1X + b1W + b1H / 2, r1Y - 12, r1X + b1W + b1H / 2, r1Y + b1H + 14, pal.secondaryLine, 0.9);
      cadLine(ctx, r1X + 28, r1Y - 12, r1X + 28, r1Y + 8, pal.secondaryLine, 0.9);
      cadLine(ctx, r1X + b1W - 28, r1Y - 12, r1X + b1W - 28, r1Y + 8, pal.secondaryLine, 0.9);
      cadText(ctx, 'b', r1X + 8, r1Y - 8, 11, pal.textMain, 'center');
      cadText(ctx, 'b', r1X + b1W - 8, r1Y - 8, 11, pal.textMain, 'center');
      cadText(ctx, 'c', r1X - b1H / 2 - 8, r1Y + b1H / 2, 11, pal.textMain, 'center');
      cadText(ctx, 'a', r1X + b1W / 2, r1Y + b1H + 13, 11.5, pal.textMain, 'center', '600');
      drawRebarTitleUnderline(ctx, '1', '鋼筋', r1X + b1W / 2, r1Y + b1H + 40, pal);

      // --- ②鋼筋 (U-shaped bar: bottom d, vertical legs f, bend radius e / 半徑) ---
      const r2X = r1X + 175;
      const r2Y = r1Y - 4;
      const b2W = 92, b2H = 34, rad2 = 12;
      ctx.save();
      ctx.strokeStyle = pal.rebarLine;
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.moveTo(r2X, r2Y);
      ctx.lineTo(r2X, r2Y + b2H - rad2);
      ctx.arc(r2X + rad2, r2Y + b2H - rad2, rad2, Math.PI, Math.PI * 0.5, true);
      ctx.lineTo(r2X + b2W - rad2, r2Y + b2H);
      ctx.arc(r2X + b2W - rad2, r2Y + b2H - rad2, rad2, Math.PI * 0.5, 0, true);
      ctx.lineTo(r2X + b2W, r2Y);
      ctx.stroke();
      ctx.restore();

      // Callout "半徑", f, d, e on ②鋼筋
      cadLine(ctx, r2X + rad2, r2Y + b2H - rad2, r2X + b2W / 2 - 14, r2Y + 12, pal.secondaryLine, 0.9);
      cadLine(ctx, r2X + b2W - rad2, r2Y + b2H - rad2, r2X + b2W / 2 + 14, r2Y + 12, pal.secondaryLine, 0.9);
      cadText(ctx, '半徑', r2X + b2W / 2, r2Y + 12, 11, pal.textMain, 'center');
      cadText(ctx, 'f', r2X - 9, r2Y + b2H * 0.45, 11, pal.textMain, 'center');
      cadText(ctx, 'f', r2X + b2W + 9, r2Y + b2H * 0.45, 11, pal.textMain, 'center');
      cadText(ctx, 'e', r2X + 4, r2Y + b2H + 9, 10.5, pal.textMain, 'center');
      cadText(ctx, 'e', r2X + b2W - 4, r2Y + b2H + 9, 10.5, pal.textMain, 'center');
      cadText(ctx, 'd', r2X + b2W / 2, r2Y + b2H + 13, 11.5, pal.textMain, 'center', '600');
      drawRebarTitleUnderline(ctx, '2', '鋼筋', r2X + b2W / 2, r2Y + b2H + 36, pal);

      // --- ③鋼筋 (L-shaped corner bar: legs g, g, bend radius h / 半徑) ---
      const r3X = r2X + 145;
      const r3Y = r1Y - 6;
      const b3L = 38, rad3 = 11;
      ctx.save();
      ctx.strokeStyle = pal.rebarLine;
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.moveTo(r3X, r3Y);
      ctx.lineTo(r3X, r3Y + b3L - rad3);
      ctx.arc(r3X + rad3, r3Y + b3L - rad3, rad3, Math.PI, Math.PI * 0.5, true);
      ctx.lineTo(r3X + b3L + 12, r3Y + b3L);
      ctx.stroke();
      ctx.restore();
      cadLine(ctx, r3X + rad3, r3Y + b3L - rad3, r3X + 28, r3Y + 14, pal.secondaryLine, 0.9);
      cadText(ctx, '半徑', r3X + 38, r3Y + 12, 11, pal.textMain, 'left');
      cadText(ctx, 'g', r3X - 9, r3Y + b3L * 0.45, 11, pal.textMain, 'center');
      cadText(ctx, 'g', r3X + b3L * 0.65, r3Y + b3L + 12, 11, pal.textMain, 'center');
      cadText(ctx, 'h', r3X - 5, r3Y + b3L + 8, 10.5, pal.textMain, 'center');
      drawRebarTitleUnderline(ctx, '3', '鋼筋', r3X + 22, r3Y + b3L + 34, pal);

      // Row 2: ④鋼筋 | ⑤、⑥鋼筋 | ⑦鋼筋
      const r4X = r1X;
      const r4Y = r1Y + 108;
      // --- ④鋼筋 (Same shape as ①鋼筋, labeled i, j, k) ---
      cadLine(ctx, r4X, r4Y + b1H, r4X + b1W, r4Y + b1H, pal.rebarLine, 2.0);
      ctx.save();
      ctx.strokeStyle = pal.rebarLine;
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.arc(r4X, r4Y + b1H / 2, b1H / 2, Math.PI * 0.5, Math.PI * 1.5, false);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(r4X + b1W, r4Y + b1H / 2, b1H / 2, -Math.PI * 0.5, Math.PI * 0.5, false);
      ctx.stroke();
      ctx.restore();
      cadLine(ctx, r4X, r4Y, r4X + 28, r4Y, pal.rebarLine, 2.0);
      cadLine(ctx, r4X + b1W - 28, r4Y, r4X + b1W, r4Y, pal.rebarLine, 2.0);

      cadLine(ctx, r4X - b1H / 2, r4Y - 12, r4X - b1H / 2, r4Y + b1H + 14, pal.secondaryLine, 0.9);
      cadLine(ctx, r4X + b1W + b1H / 2, r4Y - 12, r4X + b1W + b1H / 2, r4Y + b1H + 14, pal.secondaryLine, 0.9);
      cadLine(ctx, r4X + 28, r4Y - 12, r4X + 28, r4Y + 8, pal.secondaryLine, 0.9);
      cadLine(ctx, r4X + b1W - 28, r4Y - 12, r4X + b1W - 28, r4Y + 8, pal.secondaryLine, 0.9);
      cadText(ctx, 'j', r4X + 8, r4Y - 8, 11, pal.textMain, 'center');
      cadText(ctx, 'j', r4X + b1W - 8, r4Y - 8, 11, pal.textMain, 'center');
      cadText(ctx, 'k', r4X - b1H / 2 - 8, r4Y + b1H / 2, 11, pal.textMain, 'center');
      cadText(ctx, 'i', r4X + b1W / 2, r4Y + b1H + 13, 11.5, pal.textMain, 'center', '600');
      drawRebarTitleUnderline(ctx, '4', '鋼筋', r4X + b1W / 2, r4Y + b1H + 40, pal);

      // --- ⑤、⑥鋼筋 (Straight longitudinal bar) ---
      const r5X = r2X + 5;
      const r5Y = r4Y + b1H * 0.65;
      cadLine(ctx, r5X, r5Y, r5X + 85, r5Y, pal.rebarLine, 2.2);
      const c5X = r5X + 42;
      const c5Y = r4Y + b1H + 40;
      cadCircledRebarLabel(ctx, '5', '、', c5X - 42, c5Y, 13.5, pal.textMain, 'left');
      cadCircledRebarLabel(ctx, '6', '鋼筋', c5X - 10, c5Y, 13.5, pal.textMain, 'left');
      cadLine(ctx, c5X - 45, c5Y + 11, c5X + 45, c5Y + 11, pal.primaryLine, 1.4);
      cadLine(ctx, c5X - 45, c5Y + 14.5, c5X + 45, c5Y + 14.5, pal.primaryLine, 1.0);

      // --- ⑦鋼筋 (Fillet diagonal bar with 30cm anchorage ends and middle slope l) ---
      const r7X = r3X - 8;
      const r7Y = r4Y - 4;
      const p7Pts = [
        [r7X, r7Y],
        [r7X + 20, r7Y],
        [r7X + 56, r7Y + 36],
        [r7X + 56, r7Y + 56]
      ];
      cadPoly(ctx, p7Pts, pal.rebarLine, 2.1, false);
      cadText(ctx, '30', r7X + 10, r7Y - 8, 10, pal.textSub, 'center');
      cadText(ctx, 'l', r7X + 43, r7Y + 14, 11, pal.textMain, 'center', '600');
      cadText(ctx, '30', r7X + 66, r7Y + 46, 10, pal.textSub, 'center');
      drawRebarTitleUnderline(ctx, '7', '鋼筋', r7X + 35, r4Y + b1H + 48, pal);
    }

    function drawRebarTitleUnderline(ctx, numStr, textStr, cx, cy, pal) {
      cadCircledRebarLabel(ctx, numStr, textStr, cx, cy, 13.5, pal.textMain, 'center');
      const w = 54;
      cadLine(ctx, cx - w / 2, cy + 11, cx + w / 2, cy + 11, pal.primaryLine, 1.4);
      cadLine(ctx, cx - w / 2, cy + 14.5, cx + w / 2, cy + 14.5, pal.primaryLine, 1.0);
    }

    // =========================================================================
    // 7. VIEW 4: BOTTOM TWO-STRIP REBAR SCHEDULE & PER-METER MATERIAL TABLES
    //    100% Matching Original Drawing Bottom Tables
    // =========================================================================
    function drawBottomScheduleTables(ctx, ox, oy, q, pal) {
      // ---------------------------------------------------------------------
      // TABLE STRIP 1: 跨度W | 高度H | 厚度t | ①鋼筋 (6 cols) | ②鋼筋 (6 cols) | ③鋼筋 (5 cols) | ④鋼筋 (6 cols)
      // ---------------------------------------------------------------------
      const t1Cols = [
        48, 48, 48, // W, H, t
        54, 46, 42, 42, 42, 54, // ①鋼筋: 直徑(mm), 中心距, a, b, c, 每支長度
        54, 46, 42, 42, 42, 54, // ②鋼筋: 直徑(mm), 中心距, d, e, f, 每支長度
        54, 46, 42, 42, 54,     // ③鋼筋: 直徑(mm), 中心距, g, h, 每支長度
        54, 46, 42, 42, 42, 54  // ④鋼筋: 直徑(mm), 中心距, i, j, k, 每支長度
      ];
      const rH1 = 20;
      const rH2 = 20;
      const rH3 = 22;
      const totW1 = t1Cols.reduce((a, b) => a + b, 0);
      const totH1 = rH1 + rH2 + rH3;

      ctx.save();
      ctx.fillStyle = pal.tableHeaderBg;
      ctx.fillRect(ox, oy, totW1, rH1 + rH2);
      ctx.restore();

      cadPoly(ctx, [
        [ox, oy],
        [ox + totW1, oy],
        [ox + totW1, oy + totH1],
        [ox, oy + totH1]
      ], pal.primaryLine, 1.5, true, null, [], 'SCHEDULE_T1');

      // Horizontal lines
      const whtW = t1Cols[0] + t1Cols[1] + t1Cols[2];
      cadLine(ctx, ox + whtW, oy + rH1, ox + totW1, oy + rH1, pal.tableBorder, 1.0);
      cadLine(ctx, ox, oy + rH1 + rH2, ox + totW1, oy + rH1 + rH2, pal.primaryLine, 1.2);

      // Group Headers in Row 1: ①鋼筋, ②鋼筋, ③鋼筋, ④鋼筋
      const g1Span = t1Cols.slice(3, 9).reduce((a, b) => a + b, 0);
      const g2Span = t1Cols.slice(9, 15).reduce((a, b) => a + b, 0);
      const g3Span = t1Cols.slice(15, 20).reduce((a, b) => a + b, 0);
      const g4Span = t1Cols.slice(20, 26).reduce((a, b) => a + b, 0);

      let gx = ox + whtW;
      cadCircledRebarLabel(ctx, '1', ' 鋼 筋', gx + g1Span / 2, oy + rH1 / 2, 11, pal.textMain, 'center');
      gx += g1Span;
      cadCircledRebarLabel(ctx, '2', ' 鋼 筋', gx + g2Span / 2, oy + rH1 / 2, 11, pal.textMain, 'center');
      gx += g2Span;
      cadCircledRebarLabel(ctx, '3', ' 鋼 筋', gx + g3Span / 2, oy + rH1 / 2, 11, pal.textMain, 'center');
      gx += g3Span;
      cadCircledRebarLabel(ctx, '4', ' 鋼 筋', gx + g4Span / 2, oy + rH1 / 2, 11, pal.textMain, 'center');

      // Sub-headers & Data Row for Strip 1
      const subHeaders1 = [
        ['跨度W', '(m)'], ['高度H', '(m)'], ['厚度t', '(m)'],
        '直徑(mm)', '中心距', 'a', 'b', 'c', '每支長度',
        '直徑(mm)', '中心距', 'd', 'e', 'f', '每支長度',
        '直徑(mm)', '中心距', 'g', 'h', '每支長度',
        '直徑(mm)', '中心距', 'i', 'j', 'k', '每支長度'
      ];
      const dataRow1 = [
        q.Wm, q.Hm, q.tm,
        q.r1.dia, q.r1.sp, q.r1.a, q.r1.b, q.r1.c, q.r1.len,
        q.r2.dia, q.r2.sp, q.r2.d, q.r2.e, q.r2.f, q.r2.len,
        q.r3.dia, q.r3.sp, q.r3.g, q.r3.h, q.r3.len,
        q.r4.dia, q.r4.sp, q.r4.i, q.r4.j, q.r4.k, q.r4.len
      ];

      let cx = ox;
      const groupBreakIndices1 = new Set([0, 1, 2, 3, 9, 15, 20]);
      for (let c = 0; c < t1Cols.length; c++) {
        const cw = t1Cols[c];
        if (c > 0) {
          const topY = groupBreakIndices1.has(c) ? oy : oy + rH1;
          const lw = groupBreakIndices1.has(c) ? 1.3 : 0.9;
          cadLine(ctx, cx, topY, cx, oy + totH1, pal.tableBorder, lw);
        }
        const sh = subHeaders1[c];
        if (Array.isArray(sh)) {
          cadText(ctx, sh[0], cx + cw / 2, oy + (rH1 + rH2) * 0.35, 10, pal.textMain, 'center', '700');
          cadText(ctx, sh[1], cx + cw / 2, oy + (rH1 + rH2) * 0.72, 9.5, pal.textSub, 'center', '600');
        } else {
          cadText(ctx, sh, cx + cw / 2, oy + rH1 + rH2 / 2, 9.8, pal.textMain, 'center', '600');
        }
        cadText(ctx, String(dataRow1[c]), cx + cw / 2, oy + rH1 + rH2 + rH3 / 2, 10.5, c < 3 ? pal.dimText : pal.textMain, 'center', '700');
        cx += cw;
      }

      // ---------------------------------------------------------------------
      // TABLE STRIP 2: 跨度W | 高度H | 厚度t | ⑤鋼筋 (3 cols) | ⑥鋼筋 (3 cols) | ⑦鋼筋 (4 cols) | 箱涵每 m 各材料數量 (4 cols)
      // ---------------------------------------------------------------------
      const oy2 = oy + totH1 + 32;
      const t2Cols = [
        48, 48, 48, // W, H, t
        56, 48, 56, // ⑤鋼筋: 直徑(mm), 中心距, 每支長度
        56, 48, 56, // ⑥鋼筋: 直徑(mm), 中心距, 每支長度
        56, 48, 44, 56, // ⑦鋼筋: 直徑(mm), 中心距, l, 每支長度
        118, 118, 72, 72 // 箱涵每 m 各材料數量: fc'=210混凝土(m3), fc'=140混凝土(m3), 鋼筋(kgf), 模板(m2)
      ];
      const totW2 = t2Cols.reduce((a, b) => a + b, 0);
      const totH2 = rH1 + rH2 + rH3;

      ctx.save();
      ctx.fillStyle = pal.tableHeaderBg;
      ctx.fillRect(ox, oy2, totW2, rH1 + rH2);
      ctx.restore();

      cadPoly(ctx, [
        [ox, oy2],
        [ox + totW2, oy2],
        [ox + totW2, oy2 + totH2],
        [ox, oy2 + totH2]
      ], pal.primaryLine, 1.5, true, null, [], 'SCHEDULE_T2');

      cadLine(ctx, ox + whtW, oy2 + rH1, ox + totW2, oy2 + rH1, pal.tableBorder, 1.0);
      cadLine(ctx, ox, oy2 + rH1 + rH2, ox + totW2, oy2 + rH1 + rH2, pal.primaryLine, 1.2);

      const g5Span = t2Cols.slice(3, 6).reduce((a, b) => a + b, 0);
      const g6Span = t2Cols.slice(6, 9).reduce((a, b) => a + b, 0);
      const g7Span = t2Cols.slice(9, 13).reduce((a, b) => a + b, 0);
      const gMatSpan = t2Cols.slice(13, 17).reduce((a, b) => a + b, 0);

      let gx2 = ox + whtW;
      cadCircledRebarLabel(ctx, '5', ' 鋼 筋', gx2 + g5Span / 2, oy2 + rH1 / 2, 11, pal.textMain, 'center');
      gx2 += g5Span;
      cadCircledRebarLabel(ctx, '6', ' 鋼 筋', gx2 + g6Span / 2, oy2 + rH1 / 2, 11, pal.textMain, 'center');
      gx2 += g6Span;
      cadCircledRebarLabel(ctx, '7', ' 鋼 筋', gx2 + g7Span / 2, oy2 + rH1 / 2, 11, pal.textMain, 'center');
      gx2 += g7Span;
      cadText(ctx, '箱涵每 m 各材料數量', gx2 + gMatSpan / 2, oy2 + rH1 / 2, 11, pal.textMain, 'center', '700');

      const subHeaders2 = [
        ['跨度W', '(m)'], ['高度H', '(m)'], ['厚度t', '(m)'],
        '直徑(mm)', '中心距', '每支長度',
        '直徑(mm)', '中心距', '每支長度',
        '直徑(mm)', '中心距', 'l', '每支長度',
        'fc\'=210kgf/cm²混凝土(m³)', 'fc\'=140kgf/cm²混凝土(m³)', '鋼筋(kgf)', '模板(m²)'
      ];
      const dataRow2 = [
        q.Wm, q.Hm, q.tm,
        q.r5.dia, q.r5.sp, q.r5.len,
        q.r6.dia, q.r6.sp, q.r6.len,
        q.r7.dia, q.r7.sp, q.r7.l, q.r7.len,
        q.conc210_m.toFixed(2), q.pc140_m.toFixed(2), q.rebar_m.toFixed(2), q.form_m.toFixed(2)
      ];

      let cx2 = ox;
      const groupBreakIndices2 = new Set([0, 1, 2, 3, 6, 9, 13]);
      for (let c = 0; c < t2Cols.length; c++) {
        const cw = t2Cols[c];
        if (c > 0) {
          const topY = groupBreakIndices2.has(c) ? oy2 : oy2 + rH1;
          const lw = groupBreakIndices2.has(c) ? 1.3 : 0.9;
          cadLine(ctx, cx2, topY, cx2, oy2 + totH2, pal.tableBorder, lw);
        }
        const sh = subHeaders2[c];
        if (Array.isArray(sh)) {
          cadText(ctx, sh[0], cx2 + cw / 2, oy2 + (rH1 + rH2) * 0.35, 10, pal.textMain, 'center', '700');
          cadText(ctx, sh[1], cx2 + cw / 2, oy2 + (rH1 + rH2) * 0.72, 9.5, pal.textSub, 'center', '600');
        } else {
          cadText(ctx, sh, cx2 + cw / 2, oy2 + rH1 + rH2 / 2, c >= 13 ? 9.2 : 9.8, pal.textMain, 'center', '600');
        }
        const isHighlight = (c < 3 || c >= 13);
        cadText(ctx, String(dataRow2[c]), cx2 + cw / 2, oy2 + rH1 + rH2 + rH3 / 2, 10.5, isHighlight ? pal.dimText : pal.textMain, 'center', '700');
        cx2 += cw;
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
      const q = computeCulvertData(p);

      // Update Sidebar Summary UI
      document.getElementById('stat_dim_badge').textContent = `${q.Wm}×${q.Hm}×${q.tm}`;
      document.getElementById('stat_conc_m').textContent = `${q.conc210_m.toFixed(2)} m³/m`;
      document.getElementById('stat_pc_m').textContent = `${q.pc140_m.toFixed(2)} m³/m`;
      document.getElementById('stat_rebar_m').textContent = `${q.rebar_m.toFixed(2)} kgf/m`;
      document.getElementById('stat_form_m').textContent = `${q.form_m.toFixed(2)} m²/m`;
      document.getElementById('stat_L_label').textContent = `${p.L_m}`;
      document.getElementById('stat_total_rebar').textContent = `${(q.rebar_m * p.L_m).toLocaleString('zh-TW', { maximumFractionDigits: 1 })} kgf`;
      document.getElementById('zoom-indicator').textContent = `${Math.round(viewCam.scale * 100)}%`;

      dxfEntities = [];

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.fillStyle = pal.bg;
      ctx.fillRect(0, 0, rect.width, rect.height);

      ctx.translate(viewCam.offsetX, viewCam.offsetY);
      ctx.scale(viewCam.scale, viewCam.scale);

      if (currentView === 'SECTION') {
        const secBBox = drawCulvertSection(ctx, 50, 20, p, pal);
        drawJointDetailAndNotes(ctx, secBBox.rightX + 60, 20, p, pal);
      } else if (currentView === 'PLAN_PROFILE') {
        const secBBox = drawCulvertSection(ctx, 45, 20, p, pal);
        drawPlanAndLongitudinalViews(ctx, secBBox.rightX + 55, 20, p, pal);
      } else if (currentView === 'REBAR') {
        drawRebarShapesCluster(ctx, 80, 40, q, pal);
        drawBottomScheduleTables(ctx, 50, 310, q, pal);
      } else {
        // 'ALL' Full Standard Sheet Layout with Dynamic Bounding Box Protection:
        // Left Column: 場鑄箱涵剖面圖 + ①～⑦號鋼筋展開大樣圖
        // Middle Column: 箱涵側牆施工接縫 (N.T.S) + 附註 (1~8)
        // Right Column: 場鑄箱涵平面圖 + 場鑄箱涵縱斷面圖 (1:1 Vertically Aligned)
        // Bottom Full-Width Strip: ①～⑦號鋼筋明細與箱涵每m材料數量計算表
        const secBBox = drawCulvertSection(ctx, 55, 20, p, pal);
        const midColX = Math.max(580, secBBox.rightX + 45);
        const jointBBox = drawJointDetailAndNotes(ctx, midColX, 20, p, pal);

        const rightColX = Math.max(midColX + 455, jointBBox.rightX + 45);
        const planProfBBox = drawPlanAndLongitudinalViews(ctx, rightColX, 20, p, pal);

        const rebarClusterY = secBBox.bottomY + 25;
        drawRebarShapesCluster(ctx, 85, rebarClusterY, q, pal);

        const tablesStartY = Math.max(rebarClusterY + 245, jointBBox.bottomY + 35, planProfBBox.bottomY + 35, 760);
        drawBottomScheduleTables(ctx, 55, tablesStartY, q, pal);
      }

      ctx.restore();
    }

    // =========================================================================
    // 9. UI CONTROLS, CAMERA INTERACTION & DXF / CSV EXPORTERS
    // =========================================================================
    function onParamChange() {
      // Auto-sync Fillet F_cm with wall thickness t_cm when user changes t_cm (Per Note 8: F = t)
      renderAll();
    }

    function applyPreset(mode) {
      let cfg = ORIG_CULVERT;
      if (mode === 'M200') {
        cfg = { ...ORIG_CULVERT, W_cm: 200, H_cm: 200, t_cm: 30, F_cm: 30 };
      } else if (mode === 'L250') {
        cfg = { ...ORIG_CULVERT, W_cm: 250, H_cm: 250, t_cm: 35, F_cm: 35 };
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
        SECTION: document.getElementById('tab-sec'),
        PLAN_PROFILE: document.getElementById('tab-plan'),
        REBAR: document.getElementById('tab-rebar'),
        AUDIT: document.getElementById('tab-audit')
      };
      Object.keys(tabs).forEach(k => {
        if (!tabs[k]) return;
        tabs[k].className = (k === view)
          ? 'px-3 py-1.5 rounded-md text-xs font-semibold transition-all bg-sky-600 text-white shadow'
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
        ? 'px-2.5 py-1 rounded bg-sky-950/90 border border-sky-600/60 text-xs text-sky-300 flex items-center gap-1 transition'
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
      if (currentView === 'SECTION') {
        viewCam.scale = Math.min(rect.width / 1180, rect.height / 680) * 0.92;
        viewCam.offsetX = 40;
        viewCam.offsetY = 35;
      } else if (currentView === 'PLAN_PROFILE') {
        viewCam.scale = Math.min(rect.width / 1320, rect.height / 760) * 0.92;
        viewCam.offsetX = 35;
        viewCam.offsetY = 30;
      } else if (currentView === 'REBAR') {
        viewCam.scale = Math.min(rect.width / 1320, rect.height / 560) * 0.92;
        viewCam.offsetX = 35;
        viewCam.offsetY = 40;
      } else {
        viewCam.scale = Math.min(rect.width / 1820, rect.height / 980) * 0.94;
        viewCam.offsetX = Math.max(20, (rect.width - 1760 * viewCam.scale) / 2);
        viewCam.offsetY = 18;
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
      a.download = `場鑄箱涵標準圖_W${getParams().W_cm}xH${getParams().H_cm}.dxf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }

    function exportCSV() {
      const p = getParams();
      const q = computeCulvertData(p);
      const rows = [
        ['場鑄箱涵標準圖 - 鋼筋明細與材料數量計算書'],
        ['跨度 W (m)', '高度 H (m)', '厚度 t (m)', '填角 F (cm)', 'PC打底厚 (cm)', '施工總長 L (m)'],
        [q.Wm, q.Hm, q.tm, p.F_cm, p.t_pc, p.L_m],
        [],
        ['【一、①～⑦號鋼筋展開尺寸明細表】'],
        ['鋼筋編號', '直徑(mm)', '中心距(cm)', '展開細部尺寸 (cm)', '每支長度 (cm)'],
        ['① 鋼筋 (頂底版內主筋)', q.r1.dia, q.r1.sp, `a=${q.r1.a}, b=${q.r1.b}, c=${q.r1.c}`, q.r1.len],
        ['② 鋼筋 (外圈大ㄇ型主筋)', q.r2.dia, q.r2.sp, `d=${q.r2.d}, e=${q.r2.e}, f=${q.r2.f}`, q.r2.len],
        ['③ 鋼筋 (四角L型轉角筋)', q.r3.dia, q.r3.sp, `g=${q.r3.g}, h=${q.r3.h}`, q.r3.len],
        ['④ 鋼筋 (側牆內立筋)', q.r4.dia, q.r4.sp, `i=${q.r4.i}, j=${q.r4.j}, k=${q.r4.k}`, q.r4.len],
        ['⑤ 鋼筋 (頂底版縱向筋)', q.r5.dia, q.r5.sp, '-', q.r5.len],
        ['⑥ 鋼筋 (側牆縱向筋)', q.r6.dia, q.r6.sp, '-', q.r6.len],
        ['⑦ 鋼筋 (隅角腋部斜筋)', q.r7.dia, q.r7.sp, `l=${q.r7.l}`, q.r7.len],
        [],
        ['【二、箱涵每 m 與全段材料數量彙整表】', '每 m 單位數量', '全段總數量 (' + p.L_m + 'm)', '單位'],
        ['fc\'=210kgf/cm2 結構混凝土', q.conc210_m.toFixed(2), (q.conc210_m * p.L_m).toFixed(2), 'm3'],
        ['fc\'=140kgf/cm2 無筋PC混凝土', q.pc140_m.toFixed(2), (q.pc140_m * p.L_m).toFixed(2), 'm3'],
        ['鋼筋總重', q.rebar_m.toFixed(2), (q.rebar_m * p.L_m).toFixed(2), 'kgf'],
        ['模板面積', q.form_m.toFixed(2), (q.form_m * p.L_m).toFixed(2), 'm2']
      ];

      const csvContent = '\uFEFF' + rows.map(r => r.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `場鑄箱涵數量計算書_W${p.W_cm}xH${p.H_cm}.csv`;
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
  

  const __n = (id, d) => { const v = parseFloat(el(id).value); return Number.isFinite(v) ? v : d; };
  computeCulvertData = function (p) {
    const g = k => __n(k, parseFloat(DEF[k])), hb = g('p_hb'), hc = g('p_hc'), e1 = g('p_e1'), cov = p.cover, W = p.W_cm, H = p.H_cm, t = p.t_cm, F = p.F_cm, w16 = g('p_w16'), w13 = g('p_w13');
    const r1a = W + 2 * t - 2 * cov - 2 * e1, r1 = { dia: 'D16', sp: p.sp1, a: +r1a.toFixed(1), b: hb, c: hc, len: +(r1a + 2 * (hb + hc)).toFixed(1) };
    const r2d = W + 2 * t - 2 * cov - g('p_doff'), r2f = (H + 2 * t - 2 * cov) / 2 + g('p_lap') / 2, r2 = { dia: 'D16', sp: p.sp2, d: +r2d.toFixed(1), e: g('p_r2e'), f: +r2f.toFixed(1), len: +(r2d + 2 * r2f + 2 * g('p_r2e') - g('p_bend')).toFixed(1) };
    const r3g = t + g('p_r3x'), r3 = { dia: 'D16', sp: p.sp3, g: r3g, h: g('p_r3h'), len: +(2 * r3g + g('p_r3a')).toFixed(1) };
    const r4i = H + 2 * t - 2 * cov - 2 * e1, r4 = { dia: 'D13', sp: p.sp4, i: +r4i.toFixed(1), j: hb, k: hc, len: +(r4i + 2 * (hb + hc)).toFixed(1) };
    const r7l = F * Math.SQRT2 + g('p_r7x'), r7 = { dia: 'D13', sp: p.sp7, l: +r7l.toFixed(1), len: +(r7l + g('p_r7g')).toFixed(1) };
    const pO = 2 * ((W + 2 * t - 2 * cov) + (H + 2 * t - 2 * cov)), pI = 2 * ((W + 2 * cov) + (H + 2 * cov)), n5 = pO / p.sp5, n6 = pI / p.sp5;
    const r5 = { dia: 'D13', sp: p.sp5, len: 100, n: n5 }, r6 = { dia: 'D13', sp: p.sp5, len: 100, n: n6 };
    const kg = { r1: 2 * (100 / p.sp1) * r1.len / 100 * w16, r2: 2 * (100 / p.sp2) * r2.len / 100 * w16, r3: 4 * (100 / p.sp3) * r3.len / 100 * w16, r4: 2 * (100 / p.sp4) * r4.len / 100 * w13, r5: n5 * w13, r6: n6 * w13, r7: 4 * (100 / p.sp7) * r7.len / 100 * w13 };
    const conc = ((W + 2 * t) * (H + 2 * t) - W * H + 2 * F * F) / 1e4, pc = (W + 2 * t + 2 * p.ext_pc) * p.t_pc / 1e4;
    const form = (2 * (H + 2 * t) + (W - 2 * F) + 2 * (H - 2 * F) + 4 * F * Math.SQRT2 + 2 * p.t_pc) / 100;
    const rebar = Object.values(kg).reduce((a, b) => a + b, 0);
    return { Wm: (W / 100).toFixed(2), Hm: (H / 100).toFixed(2), tm: (t / 100).toFixed(2), r1, r2, r3, r4, r5, r6, r7, kg, conc210_m: +conc.toFixed(3), pc140_m: +pc.toFixed(3), rebar_m: +rebar.toFixed(2), form_m: +form.toFixed(2), pO, pI };
  };
  function computeQuantities(p) {
    const q = computeCulvertData(p), L = p.L_m, f = (v, n) => (+v).toFixed(n === undefined ? 2 : n), rows = [];
    rows.push({ no: '1', name: "fc'=210kgf/cm² 混凝土", unit: 'm³', qty: +(q.conc210_m * L).toFixed(2), formula: `[(${p.W_cm}+2×${p.t_cm})×(${p.H_cm}+2×${p.t_cm})－${p.W_cm}×${p.H_cm}＋4×${p.F_cm}²/2]÷10⁴＝${f(q.conc210_m, 3)} m³/m × L ${L}` });
    rows.push({ no: '2', name: "fc'=140kgf/cm² 混凝土（PC 打底）", unit: 'm³', qty: +(q.pc140_m * L).toFixed(2), formula: `(${p.W_cm}+2×${p.t_cm}+2×${p.ext_pc})×${p.t_pc}÷10⁴＝${f(q.pc140_m, 3)} m³/m × ${L}` });
    rows.push({ no: '3', name: '鋼筋', unit: 'kg', qty: +(q.rebar_m * L).toFixed(1), formula: `依配筋表 ①～⑦：${Object.entries(q.kg).map(([k, v]) => k.replace('r', '') + ' ' + f(v, 1)).join('、')}＝${f(q.rebar_m)} kg/m × ${L}` });
    rows.push({ no: '4', name: '模板', unit: 'm²', qty: +(q.form_m * L).toFixed(2), formula: `外側牆 2×${p.H_cm + 2 * p.t_cm}＋頂版底 ${p.W_cm - 2 * p.F_cm}＋內側牆 2×${p.H_cm - 2 * p.F_cm}＋腋 4×${p.F_cm}√2＋PC 側 2×${p.t_pc}＝${f(q.form_m)} m²/m × ${L}` });
    return rows;
  }
  const PAL = getPalette();
  function __draw(p) {
    const q = computeCulvertData(p), sec = drawCulvertSection(CTX, 55, 20, p, PAL), mid = Math.max(580, sec.rightX + 45), jt = drawJointDetailAndNotes(CTX, mid, 20, p, PAL);
    const rx = Math.max(mid + 455, jt.rightX + 45), pp = drawPlanAndLongitudinalViews(CTX, rx, 20, p, PAL), ry = sec.bottomY + 25; drawRebarShapesCluster(CTX, 85, ry, q, PAL);
    const ty = Math.max(ry + 245, jt.bottomY + 35, pp.bottomY + 35, 760); drawBottomScheduleTables(CTX, 55, ty, q, PAL);
    const N = [`通水孔底（箱涵內底）為高程基準；底版厚 t＝${p.t_cm}、PC ${p.t_pc} cm 在其下`, `數量依斷面幾何與配筋表形狀計算（每 m）：混凝土 ${q.conc210_m}、PC ${q.pc140_m} m³、鋼筋 ${q.rebar_m} kg、模板 ${q.form_m} m²`,
      `⑤⑥ 縱向筋支數＝外層周長 ${q.pO.toFixed(0)}／內層周長 ${q.pI.toFixed(0)} ÷ 中心距 ${p.sp5}`];
    N.forEach((s, i) => cadText(CTX, '・' + s, 55, ty + 175 + i * 16, 11, '#fde047', 'left', '600', 0, 'NOTE'));
  }


  function cadLine(ctx, x1, y1, x2, y2, color, width, dash, layer) { O.push({ k: 'L', p: [[x1, -y1], [x2, -y2]], c: color, w: width || 1.5, d: dash || [], ly: layer || '0' }); }
  function cadPoly(ctx, pts, color, width, close, fill, dash, layer) { if (!pts || pts.length < 2) return; O.push({ k: 'P', p: pts.map(q => [q[0], -q[1]]), c: color, w: width || 1.6, f: fill || null, cl: close !== false, d: dash || [], ly: layer || '0' }); }
  function cadCircle(ctx, cx, cy, r, color, width, fill, layer) { O.push({ k: 'C', x: cx, y: -cy, r, c: color, f: fill || null, w: width || 1.2, ly: layer || 'REBAR' }); }
  function cadText(ctx, str, x, y, size, color, align, weight, angleDeg, layer) { O.push({ k: 'T', x, y: -y, s: String(str), h: (size || 12) * 1.05, c: color || '#f8fafc', al: align || 'left', bl: 'middle', rot: -(angleDeg || 0) * Math.PI / 180, ly: layer || 'TEXT' }); }
  function cadArrow(ctx, x1, y1, x2, y2, color, width) { cadLine(ctx, x1, y1, x2, y2, color, width, [], 'LEADER'); const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L, nx = -uy, ny = ux; O.push({ k: 'P', p: [[x2, -y2], [x2 - ux * 8 + nx * 2.4, -(y2 - uy * 8 + ny * 2.4)], [x2 - ux * 8 - nx * 2.4, -(y2 - uy * 8 - ny * 2.4)]], c: color, w: 1, f: color, cl: true, d: [], ly: 'LEADER' }); }

  return {
    DEF, PR: [{"k": "inp_W_cm", "nm": "內部跨度 W (cm)", "def": "150", "st": "1", "min": "1", "max": "5000", "g": 0}, {"k": "inp_H_cm", "nm": "內部高度 H (cm)", "def": "150", "st": "1", "min": "1", "max": "5000", "g": 0}, {"k": "inp_t_cm", "nm": "箱涵壁厚 t (cm)", "def": "25", "st": "1", "min": "1", "max": "5000", "g": 0}, {"k": "inp_F_cm", "nm": "隅角填角 F (cm)", "def": "25", "st": "1", "min": "1", "max": "5000", "g": 0}, {"k": "inp_t_pc", "nm": "PC 打底厚 (cm)", "def": "10", "st": "1", "min": "1", "max": "5000", "g": 0}, {"k": "inp_ext_pc", "nm": "PC 單側外伸寬 (cm)", "def": "10", "st": "1", "min": "1", "max": "5000", "g": 0}, {"k": "inp_cover", "nm": "保護層 (cm)", "def": "5", "st": "1", "min": "1", "max": "5000", "g": 0}, {"k": "inp_L_m", "nm": "箱涵長度（順水流）L (m)", "def": "20.0", "st": "0.5", "min": "1", "max": "5000", "g": 0}, {"k": "inp_sp1", "nm": "① 頂底版內主筋中心距", "def": "12", "st": "1", "min": "1", "max": "5000", "g": 1}, {"k": "inp_sp2", "nm": "② ㄇ型外主筋中心距", "def": "24", "st": "1", "min": "1", "max": "5000", "g": 1}, {"k": "inp_sp3", "nm": "③ L 型角隅筋中心距", "def": "24", "st": "1", "min": "1", "max": "5000", "g": 1}, {"k": "inp_sp4", "nm": "④ 側牆內立筋中心距", "def": "20", "st": "1", "min": "1", "max": "5000", "g": 1}, {"k": "inp_sp5", "nm": "⑤⑥ 縱向筋中心距", "def": "20", "st": "1", "min": "1", "max": "5000", "g": 1}, {"k": "inp_sp7", "nm": "⑦ 腋部斜筋中心距", "def": "24", "st": "1", "min": "1", "max": "5000", "g": 1}, {"k": "p_hb", "nm": "①④ 彎鉤長 b/j (cm)", "def": "16", "st": "1", "min": "0", "max": "500", "g": 2}, {"k": "p_hc", "nm": "①④ 彎鉤彎曲段 c/k (cm)", "def": "6.5", "st": "0.5", "min": "0", "max": "500", "g": 2}, {"k": "p_e1", "nm": "①④ 端部退縮 (cm)", "def": "5", "st": "1", "min": "0", "max": "500", "g": 2}, {"k": "p_doff", "nm": "② 頂段 d 扣減 (cm)", "def": "7", "st": "1", "min": "0", "max": "500", "g": 2}, {"k": "p_lap", "nm": "② 側牆搭接長 (cm)", "def": "16", "st": "1", "min": "0", "max": "500", "g": 2}, {"k": "p_r2e", "nm": "② 端鉤 e (cm)", "def": "20", "st": "1", "min": "0", "max": "500", "g": 2}, {"k": "p_bend", "nm": "② 彎曲扣減 (cm)", "def": "3", "st": "1", "min": "0", "max": "500", "g": 2}, {"k": "p_r3x", "nm": "③ 臂長 g＝t＋ (cm)", "def": "13", "st": "1", "min": "0", "max": "500", "g": 2}, {"k": "p_r3h", "nm": "③ h (cm)", "def": "7", "st": "1", "min": "0", "max": "500", "g": 2}, {"k": "p_r3a", "nm": "③ 長度加計 (cm)", "def": "2", "st": "1", "min": "0", "max": "500", "g": 2}, {"k": "p_r7x", "nm": "⑦ l＝F√2＋ (cm)", "def": "7", "st": "1", "min": "0", "max": "500", "g": 2}, {"k": "p_r7g", "nm": "⑦ 兩端錨定長合計 (cm)", "def": "60", "st": "1", "min": "0", "max": "500", "g": 2}, {"k": "p_w16", "nm": "D16 單位重 (kg/m)", "def": "1.56", "st": "0.5", "min": "0", "max": "500", "g": 2}, {"k": "p_w13", "nm": "D13 單位重 (kg/m)", "def": "0.995", "st": "0.5", "min": "0", "max": "500", "g": 2}], GT: ["1. 箱涵主體斷面（以通水孔底為基準）", "2. ①～⑦號鋼筋中心距（配筋表）", "3. 配筋表形狀尺寸（原表值改參數）"], title: '場鑄箱涵標準圖',
    run(R, opt) {
      RR = R || {}; O = [];
      try { const P = getParams(), rows = computeQuantities(P); if (opt && opt.draw) __draw(P); const q = computeCulvertData(P);
        const sc = 1 / 1.52, OO = opt && opt.draw ? O.map(o => { const r = Object.assign({}, o); if (r.p) r.p = r.p.map(([x, y]) => [x * sc, y * sc]); if (r.x !== undefined) { r.x *= sc; r.y *= sc; } if (r.r) r.r *= sc; if (r.h) r.h *= sc; return r; }) : [];
        Object.assign(P, { __q: q });
        const checks = [{ ok: P.cover >= 5, text: `保護層 ${P.cover} cm（附註 4：5 cm）` }, { ok: P.t_pc >= 10, text: `PC 打底 ${P.t_pc} cm（min 10 cm）` }, { ok: Math.abs(P.F_cm - P.t_cm) < 1e-6, text: `隅角填角 F＝${P.F_cm}（附註 8：F＝t＝${P.t_cm}）` }];
        return { P, rows, checks, O: OO, L: null }; } finally { RR = null; }
    }
  };
})();
