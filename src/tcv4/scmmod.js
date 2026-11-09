/* ============================================================================
   v6.6 標準圖統一單位 cm (scmmod)
   ・標註：標準圖的尺寸標註（STD_DIM）與參數說明文字（STD_TEXT 中「h2=0.50」「管徑 0.07」這類未註單位的公尺值）改為 cm
     不改：高程（EL，m）、面積／體積（已註 m²／m³）、斜率（1:n）、樁號、數量表、圖名
     原圖移植的標準圖（tco*）與護岸封牆詳圖本來就是 cm，不再轉換
   ・圖面單位：單張標準圖 DXF 與出圖包的標準圖以 1 單位＝1 cm 輸出（座標×100）
     全圖 DXF 的標準圖與平面圖共用模型空間，座標仍為 m（標註已是 cm）
   ============================================================================ */
const STD_DIMLESS = /^(n|m|s\d?|rs|kx|ns|ec|cL|r|psl|g|i|sl|nh|N\w*|ex)$/;
function stdCmNum(v) { const c = v * 100; return Math.abs(c - Math.round(c)) < 0.05 ? String(Math.round(c)) : c.toFixed(1); }
/* strict＝說明文字：只轉兩位小數、且前面不是斜率／高程等 */
function stdCmText(s, strict) {
  let n = 0;
  const out = String(s).replace(/(^|[^\d.:+A-Za-z\-])(-?\d+\.\d+)(?![\d.])(?!\s*(?:m²|m³|m2|m3|cm|mm|m|%|°|kg|‰|t\b|座|孔|處|支|層))/g, (all, p, v, off, str) => {
    const pre = str.slice(0, off) + p;
    if (strict && !/^-?\d+\.\d{2}$/.test(v)) return all;
    if (/EL\s*$/i.test(pre) || /1\s*[:：]\s*[A-Za-z]?\s*$/.test(pre) || /(坡|斜率|坡度|比|倍|誇大)\s*[A-Za-z]?\s*[=＝]?\s*$/.test(pre)) return all;
    if (/[A-Za-z]\s*[=＝]\s*$/.test(pre) && /A\s*[=＝]\s*$/.test(pre) && strict) return all;   // 面積 A=（未註單位時保守不轉）
    const k = /([A-Za-z][A-Za-z0-9]*)\s*[=＝ ]\s*$/.exec(pre); if (k && STD_DIMLESS.test(k[1])) return all;
    n++; return p + stdCmNum(+v);
  });
  return { s: out, n };
}
/* 轉換一組標準圖圖元（就地）；回傳轉換數 */
function stdCmPrims(P) {
  let n = 0;
  (P || []).forEach(o => {
    if (o.t !== 't' || o._cm || o._cmDone) return;
    if (o.ly === 'STD_DIM') { const r = stdCmText(o.s, false); o.s = r.s; n += r.n; }
    else if (o.ly === 'STD_TEXT') { const r = stdCmText(o.s, true); o.s = r.s; n += r.n; }
    o._cmDone = true;
  });
  return n;
}
function stdCmNote(r) {   // 圖面左下加「單位：cm」
  if (!r || !r.P || !r.bb) return r;
  const hs = r.P.filter(o => o.t === 't' && o.ly === 'STD_DIM').map(o => +o.h || 0).sort((a, b) => a - b), h = hs.length ? hs[hs.length >> 1] : 0.2;
  const y = r.bb.y0 - h * 1.8; r.P.push({ t: 't', x: r.bb.x0, y, h, s: '註：尺寸單位 cm；高程 EL 單位 m；面積、體積依所註單位。', c: '#94a3b8', a: 8, ly: 'STD_TEXT', al: 'l', va: 'b', _cmDone: true });
  r.bb.y0 = Math.min(r.bb.y0, y - h * 0.3); return r;
}
(function () {
  const tag = fn => function () { const P = fn.apply(this, arguments); (P || []).forEach(o => { o._cm = true; }); return P; };
  if (typeof tcoStdPrims === 'function') tcoStdPrims = tag(tcoStdPrims);
  if (typeof rvCapStdPrims === 'function') rvCapStdPrims = tag(rvCapStdPrims);
  const wrap = name => { if (typeof window[name] !== 'function') return; const f = window[name]; window[name] = function () { const r = f.apply(this, arguments); try { if (r && r.P && stdCmPrims(r.P) > 0) stdCmNote(r); } catch (e) { console.warn('stdCm', name, e); } return r; }; };
  ['stStdPrims', 'stAccStdPrims', 'rvStdPrims', 'sltStdPrims', 'bioStdPrims', 'dn2StdPrims', 'frbStdPrims'].forEach(wrap);
  /* 單張標準圖 DXF：座標×100（1 單位＝1 cm） */
  if (typeof stStdDxf === 'function') stStdDxf = function () {
    if (!ST_STD) return; const D = makeDXFWriter(), k = 100;
    ST_STD.P.forEach(o => {
      if (o.t === 'f') return;
      if (o.t === 'l') { D.poly(o.p.map(v => [v[0] * k, v[1] * k]), o.ly, o.a, 0, o.cl, o.d ? 'DASHED' : undefined); return; }
      D.text(o.x * k, o.y * k, o.h * k, o.s, o.ly, o.a, { align: o.al, valign: o.va, rot: o.rot });
    });
    downloadBlob(D.build(), `${ST_STD.st.name}_標準圖.dxf`, 'application/dxf');
    updateStatus(`💾 已匯出「${ST_STD.st.name}」標準圖 DXF（圖面單位 cm：1 單位＝1 cm；尺寸標註 cm，S=1:100）。`);
  };
})();
