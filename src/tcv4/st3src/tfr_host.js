  let RR = null;
  const g = k => { const v = RR && RR[k] !== undefined && RR[k] !== null && RR[k] !== '' ? RR[k] : DEF[k]; return v; }, n = k => { const v = parseFloat(g(k)); return Number.isFinite(v) ? v : parseFloat(DEF[k]); };
  function getParams() { const P = Object.assign({}, __H.DP); PR.forEach(q => { P[q.k.slice(2)] = n(q.k); }); P.N_col = Math.max(1, Math.round(P.N_col)); P.N_row = Math.max(1, Math.round(P.N_row)); return P; }
  function toO(prims, LC) {
    const O = [], col = l => LC[l] || '#ffffff', dsh = b => (b ? [14, 9] : []);
    prims.forEach(o => {
      if (o.type === 'LINE') O.push({ k: 'L', p: [[o.x1, o.y1], [o.x2, o.y2]], c: col(o.layer), w: o.lineWidth || 1.4, d: dsh(o.dashed), ly: o.layer });
      else if (o.type === 'POLY') O.push({ k: 'P', p: o.pts.map(q => [q[0], q[1]]), c: col(o.layer), w: o.lineWidth || 1.4, f: o.fill || null, cl: !!o.closed, d: dsh(o.dashed), ly: o.layer });
      else if (o.type === 'CIRCLE') O.push({ k: 'C', x: o.cx, y: o.cy, r: o.r, c: col(o.layer), f: o.filled ? col(o.layer) : null, w: 1, ly: o.layer });
      else if (o.type === 'TEXT') O.push({ k: 'T', x: o.x, y: o.y, s: String(o.text), h: o.size, c: col(o.layer), al: o.align || 'center', bl: 'middle', rot: (o.angleDeg || 0) * Math.PI / 180, ly: '文字' });
    });
    return O;
  }
  return {
    DEF, PR, GT, title: '既有護坡基礎補強標準圖',
    getParams: R => { RR = R || {}; try { return getParams(); } finally { RR = null; } },
    run(R, opt) {
      RR = R || {};
      try {
        const P = getParams(), d = __H.comp(P), f = v => (+v).toFixed(2);
        const rows = [
          { no: '1', name: '210kgf/cm²混凝土', unit: 'm³', qty: +d.V_conc.toFixed(2), formula: d.f_conc_str, note: '依圖面幾何（扣角隅）' },
          { no: '2', name: '普通模板', unit: 'm²', qty: +d.A_form.toFixed(2), formula: d.f_form_str, note: '內模依角隅斜邊實長' },
          { no: '3', name: '鋼筋（含損耗，估算）', unit: 'kg', qty: +d.W_rebar.toFixed(2), formula: d.f_rebar_str, note: '原圖無鋼筋表，以 kg/m³ 估算' },
          { no: '4', name: '漿砌塊石', unit: 'm³', qty: +d.V_stone.toFixed(2), formula: d.f_stone_str, note: +P.K_embed ? '格室內，深＝格樑深＋嵌槽深' : '格室內，深＝格樑深' }];
        Object.assign(P, { W_total: d.W_total, L_total: d.L_total, N_cells: d.N_cells, __d: d });
        const O = opt && opt.draw ? toO(__H.draw(Object.assign({}, P)), __H.LC) : [];
        return { P, rows, checks: [{ ok: p2ok(P), text: `每座 ${f(d.m_L_total)} m（順水流）× ${f(d.m_W_total)} m（垂直水流），${d.N_row}×${d.N_col} 格` }], O };
      } finally { RR = null; }
    }
  };
  function p2ok(P) { return P.L_chamfer * 2 < Math.min(P.W_cell, P.L_cell); }
