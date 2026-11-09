  /* ---- 本系統介面：參數、圖元轉換、視圖（m）、數量表 ---- */
  const ROW_U = [-3750, -2250, -1250, -500, 0, 500, 1000, 1500, 2250, 3250, 4250], ROW_D = [-3250, -1750, -750, -250, 250, 750, 1250, 1750, 2750, 3750, 4750];   // 原圖 22 支（距溢流口中心 cm）
  let RR = null;
  const g = k => { const v = RR && RR[k] !== undefined && RR[k] !== null && RR[k] !== '' ? RR[k] : DEF[k]; return v; }, n = k => { const v = parseFloat(g(k)); return Number.isFinite(v) ? v : parseFloat(DEF[k]); };
  function getParams() {
    const P = {}; PR.forEach(q => { P[q.k.slice(2)] = q.opt ? String(g(q.k)) : n(q.k); });
    const L = a => (Array.isArray(a) ? a.map(Number).filter(Number.isFinite) : null);
    P.rowU = L(RR && RR.__pu) || ROW_U.slice(); P.rowD = L(RR && RR.__pd) || ROW_D.slice();
    return P;
  }
  function toO(E) {
    const O = [], dsh = d => (d && d.length ? [14, 9] : []);
    E.forEach(o => {
      if (o.type === 'line') O.push({ k: 'L', p: [[o.x1, o.y1], [o.x2, o.y2]], c: o.col || '#ffffff', w: o.lw || 1.4, d: dsh(o.dash), ly: o.lyr || '0' });
      else if (o.type === 'poly') O.push({ k: 'P', p: o.pts.map(q => [q[0], q[1]]), c: o.col || '#ffffff', w: o.lw || 1.4, f: o.fill || null, cl: o.closed !== false, d: dsh(o.dash), ly: o.lyr || '0' });
      else if (o.type === 'circle') O.push({ k: 'C', x: o.cx, y: o.cy, r: o.r, c: o.col || '#ffffff', f: o.fill || null, w: o.lw || 1, ly: o.lyr || '0' });
      else if (o.type === 'text') O.push({ k: 'T', x: o.x, y: o.y, s: String(o.str), h: o.size, c: o.col || '#ffffff', al: o.align || 'center', bl: 'middle', rot: o.rot || 0, ly: '文字' });
    });
    return O;
  }
  function hostViews(C) {
    const p = C.p, Y = C.Y, S = C.sec, B = p.B_base, xC = p.W_wing_L + p.W_slope_L + p.W_weir / 2, out = { plan: [], sect: [], elev: [] };
    const X = x => (x - xC) / 100, Z = z => (z - Y.y4) / 100, U = s => (B / 2 - s) / 100, Wc = '#ffffff', Pc = '#f59e0b', Gy = '#94a3b8';
    const zT = Y.y1 + p.L_embed, zB = zT - p.L_pile, rP = p.D_pile / 2, rowY = r => B - p.Dy_edge - r * p.Dy_pile;
    // 正視
    const top = [], bot = [], BR = [0, p.L_ret_L, p.W_wing_L, p.W_wing_L + p.W_slope_L, xC, p.W_wing_L + p.W_slope_L + p.W_weir, p.L_total - p.W_wing_R, p.L_total - p.L_ret_R, p.L_total].sort((a, b) => a - b);
    BR.forEach(x => { top.push([X(x), Z(C.top(x))]); bot.push([X(x), Z(C.bot(x))]); });
    out.elev.push({ p: bot.concat(top.slice().reverse()), cl: true, c: Wc, f: 'rgba(255,255,255,0.05)', d: false });
    [Y.y1, Y.y2].forEach(z => { const xl = p.L_ret_L * (1 - (z - Y.y0) / (Y.y5 - Y.y0)), xr = p.L_total - p.L_ret_R * (1 - (z - Y.y0) / (Y.y5 - Y.y0)); out.elev.push({ p: [[X(xl), Z(z)], [X(xr), Z(z)]], cl: false, c: Gy, f: null, d: false }); });
    C.piles.forEach(q => out.elev.push({ p: [[X(q.x - rP), Z(zT)], [X(q.x + rP), Z(zT)], [X(q.x + rP), Z(zB)], [X(q.x - rP), Z(zB)]], cl: true, c: Pc, f: 'rgba(245,158,11,0.12)', d: false }));
    // 順水流斷面
    out.sect.push({ p: S.poly.map(([x, z]) => [U(x), Z(z)]), cl: true, c: Wc, f: 'rgba(255,255,255,0.05)', d: false });
    [0, 1].forEach(r => { const s = rowY(r); out.sect.push({ p: [[U(s - rP), Z(zT)], [U(s + rP), Z(zT)], [U(s + rP), Z(zB)], [U(s - rP), Z(zB)]], cl: true, c: Pc, f: 'rgba(245,158,11,0.12)', d: false }); });
    // 平面
    out.plan.push({ p: C.plan.map(([x, s]) => [U(s), X(x)]), cl: true, c: Wc, f: 'rgba(255,255,255,0.05)', d: false });
    out.plan.push({ p: [[U(S.xTopR), X(0)], [U(S.xTopR), X(p.L_total)]], cl: false, c: Gy, f: null, d: false });
    out.plan.push({ p: C.crest.map(([x, s]) => [U(s), X(x)]), cl: false, c: Gy, f: null, d: false });
    C.piles.forEach(q => { const s = rowY(q.row); out.plan.push({ p: Array.from({ length: 16 }, (_, i) => [U(s + rP * Math.sin(i * Math.PI / 8)), X(q.x + rP * Math.cos(i * Math.PI / 8))]), cl: true, c: Pc, f: 'rgba(245,158,11,0.35)', d: false }); });
    return out;
  }
  function computeQuantities(C) {
    const p = C.p, q = C.q, N = q.nP, rows = [], f = (v, k) => (+v).toFixed(k === undefined ? 2 : k);
    const r = (no, name, unit, qty, formula, note) => rows.push({ no: String(no), name, unit, qty: unit === '支' ? Math.round(qty) : +(+qty).toFixed(2), formula, note: note || '' });
    r(1, '固床工 280kgf/cm²混凝土', 'm³', q.sillConc, `∫斷面積 dx ${f(q.Vg)}（最大斷面依正視頂緣、兩端斜退底緣裁切，分段 Simpson）－基樁錨入 ${N}×π×${f(p.D_pile / 200, 2)}²×${f(p.L_embed / 100)} = ${f(q.Vemb)}`);
    r(2, '固床工軀體模板', 'm²', q.sillForm, '上下游面（含基礎版側面）沿全長積分；兩端側邊、止滑齒、頂面不組模');
    r(3, '固床工鋼筋（估算）', 'kg', q.sillRebar, `${p.rbk} kg/m³ × ${f(q.sillConc)} m³`, '原圖無鋼筋表，以 kg/m³ 估算');
    r(4, `${p.D_pile}φcm 基樁`, '支', N, p.pmode === 'AUTO' ? `自動排樁：密排 ${p.xd0}～${p.xd1}（每排 @${p.S_dense}）、一般區至 ${p.xs0}～${p.xs1}（每排 @${p.S_sparse}）` : `樁位清單 上排 ${p.rowU.length}＋下排 ${p.rowD.length}`);
    r(5, '基樁 210kgf/cm²水中混凝土', 'm³', q.pileConc * N, `π×${f(p.D_pile / 200)}²×${f(p.L_pile / 100)}＝${f(q.pileConc)} m³/支 × ${N}`);
    r(6, '基樁鋼筋 32φ（含損耗）', 'kg', q.loss32 * N, `${p.N_main}×${f(q.mainLen)}×${p.w32}×${p.k32}＝${f(q.loss32)} kg/支 × ${N}`, '依配筋逐支計算');
    r(7, '基樁鋼筋 16φ（含損耗）', 'kg', q.loss16 * N, `(② ${q.nHoop2}×${f(q.lenHoop2)}＋③ ${q.nHoop3}×${f(q.lenHoop3)})×${p.w16}×${p.k16}＝${f(q.loss16)} kg/支 × ${N}`, '依配筋逐支計算');
    r(8, '基樁鑽掘', 'm', q.drill * N, `(${f(p.L_pile / 100)}－錨入 ${f(p.L_embed / 100)})×${N}`);
    return rows;
  }
  return {
    DEF, PR, GT, title: '固床工＋基樁標準圖', ROW_U, ROW_D,
    getParams: R => { RR = R || {}; try { return __H.params(getParams()); } finally { RR = null; } },
    run(R, opt) {
      RR = R || {};
      try {
        const C = __H.comp(getParams()), P = C.p, rows = computeQuantities(C);
        Object.assign(P, { xC: P.W_wing_L + P.W_slope_L + P.W_weir / 2, piles: C.piles, __q: C.q });
        let O = [], L = null;
        if (opt && opt.draw) { O = toO(__H.draw(getParams())); L = { V: hostViews(C) }; }
        const S = C.sec, out = C.piles.filter(q => q.x < P.L_ret_L || q.x > P.L_total - P.L_ret_R);
        const checks = [
          { ok: S.xBack >= S.xTopR && S.xApronL >= 0, text: `斷面：頂寬 ${P.B_top}、溢流處 ${Math.round(P.B_mid)}、基礎頂 ${P.B_apron}、底寬 ${P.B_base} cm（上游階 ${Math.round(S.xBack - S.xTopR)} cm）` },
          { ok: P.Dy_edge + P.Dy_pile + P.D_pile / 2 <= P.B_base, text: `樁排：距上游緣 ${P.Dy_edge}、前後排距 ${P.Dy_pile} cm（底寬 ${P.B_base}）` },
          { ok: !out.length, text: out.length ? `${out.length} 支樁落在兩端斜退區外` : `基樁 ${C.piles.length} 支，均在基礎底版範圍內` }];
        return { P, rows, checks, O, L };
      } finally { RR = null; }
    }
  };
