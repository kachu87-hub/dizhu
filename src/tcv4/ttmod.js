/* ============================================================================
   v6.3 工程總表：各結構物、護岸、排水溝、生物通道、整地、崩塌地各自數量 → 加總
   一、工作項目（名稱、樁號範圍、長度）　二、各類型小計　三、材料總表（混凝土依強度分列、鋼筋總量、模板、其他材料）　四、土方
   混凝土未標示強度者採 210 kgf/cm²（標註「預設」並於圖面註記）；鋼筋屬 kg/m³ 估算者標註「概估」
   介面：上方「工程總表」按鈕開啟總表頁；匯出數量表時列為第一個工作表；平面圖加「工作內容表」（畫面與 DXF）
   ============================================================================ */
const TT_DEF_STR = 210;
const ttF = (v, d) => (Number.isFinite(v) ? v : 0).toLocaleString('zh-TW', { minimumFractionDigits: d === undefined ? 2 : d, maximumFractionDigits: d === undefined ? 2 : d });
const ttStrip = t => String(t || '').replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim();
function ttClass(it, u) {   // → {k:'skip'|'ex'|'bf'|'rebar'|'form'|'conc'|'mat', ...}
  const t = ttStrip(it), uu = String(u || '').trim();
  if (!t || /^[　\s]|^（參考）|^\(參考\)|^其中|扣除/.test(String(it || '').replace(/<[^>]+>/g, ''))) return { k: 'skip' };
  if (/開挖|挖方/.test(t) && /m³|m3/.test(uu)) return { k: 'ex', t };
  if (/回填|背填|填方/.test(t) && /m³|m3/.test(uu)) return { k: 'bf', t };
  if (/鋼筋/.test(t) && /^(kg|公斤|t|噸)$/i.test(uu)) return { k: 'rebar', t, f: /^(t|噸)$/i.test(uu) ? 1000 : 1, est: /估/.test(t) };
  if (/模板/.test(t) && /m²|m2/.test(uu)) return { k: 'form', t };
  if (/混凝土|砼/.test(t) && /m³|m3/.test(uu) && !/混凝土塊|鼎塊|預鑄/.test(t)) { const m = t.match(/(\d{3})\s*kg/i); return { k: 'conc', t, str: m ? +m[1] : TT_DEF_STR, def: !m }; }
  const base = t.replace(/\s*[（(][^（）()]*[）)]\s*$/, '').trim() || t; return { k: 'mat', t: base, u: uu };
}
/* v6.6 數量來源：每一列數量是怎麼來的（幾何計算／kg/m³ 估算／計數／地形） */
const TT_SRC_EST = 'kg/m³ 估算';
function ttSrcKind(it, u, fx, ck) {
  const t = ttStrip(it), f = ttStrip(fx), uu = String(u || '').trim(), k = ck || ttClass(it, u).k;
  if (k === 'rebar') return (/估/.test(t) || /kg\s*\/\s*m(³|3)/i.test(f) || /原圖無鋼筋表/.test(f)) ? TT_SRC_EST : '幾何計算（配筋）';
  if (k === 'ex' || k === 'bf') return '地形＋幾何（平均斷面法）';
  if (/^(處|支|座|孔|塊|組|個|根|只)$/.test(uu)) return '計數（依配置／間距）';
  if (/^(式|項)$/.test(uu)) return '一式（輸入值）';
  return '幾何計算';
}
const ttKinds = m => [...(m.kinds || [])].join('＋');
const ttKindsEst = m => { const K = ttKinds(m); if (!m.kinds || m.kinds.size < 2 || !m.kinds.has(TT_SRC_EST)) return K; const e = m.src.filter(s => s.k === TT_SRC_EST).map(s => s.n); return `${K}（估算：${e.join('、')}）`; };
function ttWorks(curOnly) {   // 全部工作項目（含各自數量列）；curOnly＝只取目前中心線（畫面繪製時不切換中心線）
  const W = [], seenDn = new Set(), add = o => W.push(o);
  const each = fn => { if (!curOnly && typeof clEach === 'function') clEach(fn); else fn(state.clCur || 0); };
  each(i => {
    const cl = typeof clName === 'function' ? clName(i) : '', multi = (state.cls || []).length > 1, tag = multi ? `（${cl}）` : '';
    (state.structs || []).forEach(s => { if (!s._q) return; const lbl = s.type === 'sill' && s.sty && typeof SLT !== 'undefined' && SLT[s.sty] ? SLT[s.sty].label : stTypeLabel(s.type);
      const cat = s.type === 'sill' ? (s.sty === 'cdam' ? '曲型副壩' : s.sty === 'bcul' ? '場鑄箱涵' : '固床工') : stTypeLabel(s.type);
      add({ cat, name: s.name + tag, sub: lbl, a: s.sta, b: null, L: null, rows: s._q.rows || [] });
      (typeof stAccList === 'function' ? stAccList(s) : []).forEach(k => { const Q = (s._accQ || {})[k]; if (!Q) return; add({ cat: '防砂壩附屬（護坦／側牆／尾檻）', name: stAccName(s, k) + tag, sub: stAccLabel(s, k) + '（附屬於 ' + s.name + '）', a: s.sta + s.dir * (Q.u0 || 0), b: null, L: null, rows: Q.rows || [] }); });
    });
    (state.revs || []).forEach(rv => { const q = rv._q; if (!q) return; const T = typeof tcType === 'function' ? tcType(rv.type) : { label: '' };
      add({ cat: '護岸', name: rvName(rv) + tag, sub: T.label, a: q.a, b: q.b, L: Math.abs(q.b - q.a), rows: (q.rows || []).filter(r => r.k !== 'bioX') });
      (rv.bios || []).forEach(b => { let g; try { g = bioGeo(rv, b); } catch (e) { return; } const E = (typeof BIO_EW !== 'undefined' && BIO_EW[b.name]) || null;
        const rows = [{ it: '210kgf/cm² 混凝土', u: 'm³', v: g.conc }, { it: '軀體模板', u: 'm²', v: g.form }]; try { const RB = bioRebar(g, b); RB.bars.forEach(k => rows.push({ it: `鋼筋 ${k}`, u: 'kg', v: RB.kg(k) })); } catch (e) { } if (E) { rows.push({ it: '通道開挖', u: 'm³', v: E.x }, { it: '通道回填', u: 'm³', v: E.k }); }
        add({ cat: '生物通道', name: b.name + tag, sub: `附掛於${rvName(rv)}`, a: g.a, b: g.b, L: g.b - g.a, rows }); });
    });
    (state.dns || []).forEach(d => { if (seenDn.has(d.id) || (typeof dnOn === 'function' && !dnOn(d))) return; seenDn.add(d.id); let c, rows; try { c = dnCalc(d); rows = dnRows(d); } catch (e) { return; }
      add({ cat: '排水溝', name: d.name, sub: (DN_TYPES[d.type] || {}).label || '', a: d.mode === 'A' ? Math.min(d.s0, d.s1) : null, b: d.mode === 'A' ? Math.max(d.s0, d.s1) : null, L: c.L, rows: rows.filter(r => r.u !== 'm' || !/長度/.test(r.it)) }); });
  });
  (state.grades || []).forEach(G => { let r; try { r = grdRes(G); } catch (e) { return; } const R = r.R; if (!R.length) return; const a = R[0].st.sta, b = R[R.length - 1].st.sta;
    add({ cat: '整地', name: G.name, sub: G.src === 'cl' ? '沿中心線' : `沿${(grdCase(G) || {}).name || ''}基準線`, a: G.src === 'cl' ? a : null, b: G.src === 'cl' ? b : null, L: Math.abs(b - a), rows: [{ it: '整地挖方', u: 'm³', v: r.Vc }, { it: '整地填方', u: 'm³', v: r.Vf }] }); });
  (state.dzCases || []).forEach(c => { let A = null; try { A = dzCaseCalc(c); } catch (e) { } const rows = []; if (A) rows.push({ it: '整治區斜面積', u: 'm²', v: A.As });
    const L = (c.bl || []).length > 1 && typeof dzPolyLen === 'function' ? dzPolyLen(c.bl) : null; if (!rows.length && !L) return;
    add({ cat: '崩塌地整治', name: c.name, sub: '整治區', a: null, b: null, L, rows });
    (c.walls || []).forEach(w => add({ cat: '崩塌地整治', name: `${c.name} ${w.name || '擋土牆'}`, sub: '擋土牆（沿基準線）', a: null, b: null, L: Math.abs(w.s1 - w.s0), rows: [] })); });
  return W;
}
function ttBuild(curOnly) {
  const W = ttWorks(curOnly), types = new Map(), mats = new Map(), earth = new Map(); let anyDef = false, anyEst = false;
  const put = (M, key, o, src, v, kd) => { let m = M.get(key); if (!m) { m = Object.assign({ v: 0, src: [], kinds: new Set() }, o); M.set(key, m); } m.v += v; if (kd) m.kinds.add(kd); const s = m.src.find(x => x.n === src); if (s) { s.v += v; if (kd && s.k !== kd) s.k = s.k ? (s.k === TT_SRC_EST || kd === TT_SRC_EST ? TT_SRC_EST : s.k) : kd; } else m.src.push({ n: src, v, k: kd }); return m; };
  W.forEach(w => {
    const T = types.get(w.cat) || { cat: w.cat, works: [], L: 0, hasL: false, items: new Map() }; types.set(w.cat, T); T.works.push(w); if (Number.isFinite(w.L) && w.L > 0) { T.L += w.L; T.hasL = true; }
    w.rows.forEach(r => { const v = +r.v; if (!Number.isFinite(v) || Math.abs(v) < 1e-12) return; const c = ttClass(r.it, r.u); if (c.k === 'skip') return; const kd = ttSrcKind(r.it, r.u, r.fx || r.formula, c.k);
      const ik = ttStrip(r.it) + '|' + r.u; put(T.items, ik, { it: ttStrip(r.it), u: r.u }, w.name, v, kd);
      if (c.k === 'conc') { const m = put(mats, 'conc|' + c.str, { ord: 0, it: `混凝土 ${c.str} kgf/cm²`, u: 'm³', str: c.str }, w.name, v, kd); if (c.def) { m.def = true; anyDef = true; } }
      else if (c.k === 'rebar') { const m = put(mats, 'rebar', { ord: 1, it: '鋼筋（總量）', u: 'kg' }, w.name, v * c.f, kd); if (c.est || kd === TT_SRC_EST) { m.est = true; anyEst = true; } }
      else if (c.k === 'form') put(mats, 'form', { ord: 2, it: '模板', u: 'm²' }, w.name, v, kd);
      else if (c.k === 'mat') put(mats, 'm|' + c.t + '|' + c.u, { ord: 3, it: c.t, u: c.u }, w.name, v, kd);
      else if (c.k === 'ex' || c.k === 'bf') put(earth, c.k + '|' + w.cat, { ord: c.k === 'ex' ? 0 : 1, it: `${w.cat}${c.k === 'ex' ? '開挖' : '回填'}`, u: 'm³', k: c.k }, w.name, v, kd);
    });
  });
  try {   // 全線橫斷面法土方（目前中心線）
    const E = typeof dzEwTot === 'function' ? dzEwTot() : null, T = E && E.T;
    if (T) { if (T.cc) put(earth, 'ex|河道', { ord: 0, it: '河道挖方（全線橫斷面法）', u: 'm³', k: 'ex' }, '全線土方', T.cc, '地形（全線橫斷面法）'); if (T.cf) put(earth, 'bf|河道', { ord: 1, it: '河道填方（全線橫斷面法）', u: 'm³', k: 'bf' }, '全線土方', T.cf, '地形（全線橫斷面法）');
      if (T.cx) put(earth, 'ex|護岸', { ord: 0, it: '護岸基礎開挖（全線橫斷面法）', u: 'm³', k: 'ex' }, '全線土方', T.cx, '地形（全線橫斷面法）'); if (T.ck) put(earth, 'bf|護岸', { ord: 1, it: '護岸背填回填（全線橫斷面法）', u: 'm³', k: 'bf' }, '全線土方', T.ck, '地形（全線橫斷面法）'); }
  } catch (e) { console.error('ttEarth', e); }
  const M = [...mats.values()].sort((a, b) => a.ord - b.ord || (a.str || 0) - (b.str || 0) || a.it.localeCompare(b.it, 'zh-Hant')), E = [...earth.values()].sort((a, b) => a.ord - b.ord);
  const ex = E.filter(e => e.k === 'ex').reduce((s, e) => s + e.v, 0), bf = E.filter(e => e.k === 'bf').reduce((s, e) => s + e.v, 0);
  return { W, types: [...types.values()], M, E, ex, bf, anyDef, anyEst };
}
function ttRange(w) { return w.a !== null && w.b !== null && Number.isFinite(w.a) && Number.isFinite(w.b) ? `${formatStation(w.a)}～${formatStation(w.b)}` : (w.a !== null && Number.isFinite(w.a) ? formatStation(w.a) : ''); }
function ttWorkLine(w) { const r = ttRange(w); return `${w.name}${r ? '　' + r : ''}${Number.isFinite(w.L) && w.L > 0 ? `　L=${ttF(w.L, 1)} m` : ''}`; }
const TT_NOTE = `註：未標示強度者，混凝土均採 ${TT_DEF_STR} kgf/cm²。`;
/* ---- 總表頁 ---- */
let TT_TAB = 0;
function ttOpen() {
  let d = document.getElementById('ttDlg'); if (!d) { d = document.createElement('div'); d.id = 'ttDlg'; document.body.appendChild(d); }
  d.style.cssText = 'position:fixed;inset:0;z-index:9000;background:rgba(15,23,42,.55);display:flex;align-items:center;justify-content:center;'; ttRender();
}
function ttClose() { const d = document.getElementById('ttDlg'); if (d) d.style.display = 'none'; }
function ttRender() {
  const d = document.getElementById('ttDlg'); if (!d) return; let B; try { B = ttBuild(); } catch (e) { console.error('ttBuild', e); d.innerHTML = '<div style="background:#fff;padding:20px;">總表計算錯誤：' + escAttr(e.message) + '</div>'; return; }
  const th = 'style="text-align:left;padding:4px 6px;background:#e2e8f0;color:#0f172a;font-size:12px;position:sticky;top:0;"', td = 'style="padding:3px 6px;border-bottom:1px solid #e2e8f0;font-size:12px;vertical-align:top;"', tn = 'style="padding:3px 6px;border-bottom:1px solid #e2e8f0;font-size:12px;text-align:right;white-space:nowrap;"';
  const src = m => m.src.length > 1 || m.src[0].n !== m.it ? `<details><summary style="cursor:pointer;color:#0369a1;font-size:11px;">${m.src.length} 處</summary>${m.src.map(s => `<div style="font-size:11px;color:#475569;">${escAttr(s.n)}：${ttF(s.v)}</div>`).join('')}</details>` : '';
  const ksp = m => { const K = ttKindsEst(m); return K ? `<span style="font-size:11px;${m.kinds && m.kinds.has(TT_SRC_EST) ? 'color:#b45309;font-weight:700;' : 'color:#334155;'}">${escAttr(K)}</span>` : ''; };
  const tabs = ['工作項目與小計', '材料總表', '土方'];
  let body = '';
  if (TT_TAB === 0) body = B.types.length ? B.types.map(T => `<div style="margin:10px 0 4px;font-weight:700;color:#0369a1;font-size:13px;">${escAttr(T.cat)}　<span style="font-weight:400;color:#475569;font-size:12px;">${T.works.length} 處${T.hasL ? `，合計長 ${ttF(T.L, 1)} m` : ''}</span></div>
      <table style="border-collapse:collapse;width:100%;"><thead><tr><th ${th}>名稱</th><th ${th}>型式／說明</th><th ${th}>樁號範圍</th><th ${th}>長度 (m)</th></tr></thead><tbody>${T.works.map(w => `<tr><td ${td}>${escAttr(w.name)}</td><td ${td}>${escAttr(w.sub || '')}</td><td ${td}>${ttRange(w)}</td><td ${tn}>${Number.isFinite(w.L) && w.L > 0 ? ttF(w.L, 1) : ''}</td></tr>`).join('')}</tbody></table>
      ${T.items.size ? `<table style="border-collapse:collapse;width:100%;margin-top:4px;"><thead><tr><th ${th}>${escAttr(T.cat)} 小計項目</th><th ${th}>單位</th><th ${th} style="text-align:right;">數量</th><th ${th}>數量來源</th><th ${th}>出處</th></tr></thead><tbody>${[...T.items.values()].map(m => `<tr><td ${td}>${escAttr(m.it)}</td><td ${td}>${escAttr(m.u)}</td><td ${tn}>${ttF(m.v)}</td><td ${td}>${ksp(m)}</td><td ${td}>${src(m)}</td></tr>`).join('')}</tbody></table>` : ''}`).join('') : '<div style="padding:20px;color:#64748b;">目前沒有可計算數量的項目。</div>';
  else if (TT_TAB === 1) body = `<table style="border-collapse:collapse;width:100%;"><thead><tr><th ${th}>材料</th><th ${th}>單位</th><th ${th} style="text-align:right;">數量</th><th ${th}>數量來源</th><th ${th}>備註</th><th ${th}>出處</th></tr></thead><tbody>${B.M.map(m => `<tr><td ${td}><b>${escAttr(m.it)}</b></td><td ${td}>${m.u}</td><td ${tn}><b>${ttF(m.v)}</b></td><td ${td}>${ksp(m)}</td><td ${td}>${m.def ? '<span style="color:#b45309;">含未標示強度（預設 210）</span>' : ''}${m.est ? '<span style="color:#b45309;">含概估（kg/m³）</span>' : ''}</td><td ${td}>${src(m)}</td></tr>`).join('')}</tbody></table>
      ${B.anyDef ? `<div style="margin-top:6px;color:#b45309;font-size:12px;">${TT_NOTE}</div>` : ''}<div style="margin-top:4px;color:#64748b;font-size:11.5px;">鋼筋列總量（不分號數）；開挖、回填列於「土方」。</div>`;
  else body = `<table style="border-collapse:collapse;width:100%;"><thead><tr><th ${th}>項目</th><th ${th}>單位</th><th ${th} style="text-align:right;">數量</th><th ${th}>數量來源</th><th ${th}>出處</th></tr></thead><tbody>${B.E.map(m => `<tr><td ${td}>${escAttr(m.it)}</td><td ${td}>m³</td><td ${tn}>${ttF(m.v)}</td><td ${td}>${ksp(m)}</td><td ${td}>${src(m)}</td></tr>`).join('')}
      <tr><td ${td}><b>開挖合計</b></td><td ${td}>m³</td><td ${tn}><b>${ttF(B.ex)}</b></td><td ${td}></td><td ${td}></td></tr><tr><td ${td}><b>回填（填方）合計</b></td><td ${td}>m³</td><td ${tn}><b>${ttF(B.bf)}</b></td><td ${td}></td><td ${td}></td></tr>
      <tr><td ${td}><b>餘土（開挖−回填）</b></td><td ${td}>m³</td><td ${tn}><b style="color:${B.ex - B.bf >= 0 ? '#0f172a' : '#b91c1c'};">${ttF(B.ex - B.bf)}</b></td><td ${td}></td><td ${td}>${B.ex - B.bf < 0 ? '<span style="color:#b91c1c;">不足，須借土</span>' : '須外運或場內利用'}</td></tr></tbody></table>
      <div style="margin-top:4px;color:#64748b;font-size:11.5px;">全線橫斷面法土方取目前中心線；結構物開挖範圍已自全線土方扣除，不重複計算。</div>`;
  d.innerHTML = `<div style="background:#fff;width:min(1100px,96vw);max-height:92vh;border-radius:10px;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 20px 50px rgba(0,0,0,.4);">
    <div style="display:flex;align-items:center;gap:8px;padding:10px 14px;background:#0f172a;color:#fff;"><b style="font-size:15px;">📋 工程總表</b><span style="font-size:11.5px;color:#94a3b8;">只計數量；各項自各結構物、護岸、排水溝、生物通道、整地、崩塌地數量加總</span>
      <button class="btn" style="margin-left:auto;" onclick="stExportXlsx()">匯出 Excel</button><button class="btn" onclick="ttClose()">關閉 ✕</button></div>
    <div style="display:flex;gap:4px;padding:8px 14px 0;">${tabs.map((t, i) => `<button class="btn${i === TT_TAB ? ' primary' : ''}" onclick="TT_TAB=${i};ttRender();">${t}</button>`).join('')}</div>
    <div style="overflow:auto;padding:4px 14px 14px;color:#0f172a;">${body}</div></div>`;
}
/* ---- Excel：工程總表（第一個工作表） ---- */
function ttSheet() {
  const B = ttBuild(); if (!B.W.length) return null; const H = a => a.map(v => ({ v, s: 1 })), r3 = v => Math.round(v * 1000) / 1000;
  const rows = [[{ v: '工程總表（數量）', s: 5 }], [`專案：${(typeof projName !== 'undefined' && projName) ? projName : '（未存檔）'}　匯出：${new Date().toLocaleString()}`], []];
  rows.push([{ v: '一、工作項目', s: 5 }], H(['類型', '名稱', '型式／說明', '樁號範圍', '長度 (m)']));
  B.types.forEach(T => { T.works.forEach(w => rows.push([{ v: T.cat, s: 2 }, { v: w.name, s: 2 }, { v: w.sub || '', s: 2 }, { v: ttRange(w), s: 2 }, Number.isFinite(w.L) && w.L > 0 ? { v: r3(w.L), s: 3 } : { v: '' }])); if (T.hasL) rows.push([{ v: `${T.cat} 合計`, s: 6 }, { v: `${T.works.length} 處`, s: 6 }, { v: '', s: 6 }, { v: '', s: 6 }, { v: r3(T.L), s: 7 }]); });
  rows.push([], [{ v: '二、各類型小計', s: 5 }], H(['類型', '項目', '單位', '數量', '出處', '數量來源']));
  B.types.forEach(T => [...T.items.values()].forEach(m => rows.push([{ v: T.cat, s: 2 }, { v: m.it, s: 2 }, { v: m.u, s: 2 }, { v: r3(m.v), s: 3 }, { v: m.src.map(s => `${s.n} ${r3(s.v)}`).join('；'), s: 10 }, { v: ttKindsEst(m), s: 10 }])));
  rows.push([], [{ v: '三、材料總表', s: 5 }], H(['材料', '單位', '數量', '備註', '出處', '數量來源']));
  B.M.forEach(m => rows.push([{ v: m.it, s: 2 }, { v: m.u, s: 2 }, { v: r3(m.v), s: 3 }, { v: (m.def ? '含未標示強度（預設 210）' : '') + (m.est ? '含概估（kg/m³）' : ''), s: 2 }, { v: m.src.map(s => `${s.n} ${r3(s.v)}`).join('；'), s: 10 }, { v: ttKindsEst(m), s: 10 }]));
  if (B.anyDef) rows.push([{ v: TT_NOTE }]);
  rows.push([], [{ v: '四、土方', s: 5 }], H(['項目', '單位', '數量', '', '出處', '數量來源']));
  B.E.forEach(m => rows.push([{ v: m.it, s: 2 }, { v: 'm³', s: 2 }, { v: r3(m.v), s: 3 }, { v: '' }, { v: m.src.map(s => `${s.n} ${r3(s.v)}`).join('；'), s: 10 }, { v: ttKindsEst(m), s: 10 }]));
  rows.push([{ v: '開挖合計', s: 8 }, { v: 'm³', s: 8 }, { v: r3(B.ex), s: 9 }], [{ v: '回填（填方）合計', s: 8 }, { v: 'm³', s: 8 }, { v: r3(B.bf), s: 9 }], [{ v: '餘土（開挖−回填）', s: 8 }, { v: 'm³', s: 8 }, { v: r3(B.ex - B.bf), s: 9 }]);
  return { name: '工程總表', cols: [26, 34, 10, 22, 70, 30], rows: rows.concat([[], [{ v: '數量來源說明：幾何計算＝依設計斷面／尺寸計算；幾何計算（配筋）＝依配筋規則計算鋼筋長度與重量；kg/m³ 估算＝原圖無鋼筋表，以混凝土量×單位用量概估；計數＝依配置或間距取整數；地形＝依地形與設計斷面以平均斷面法計算。' }]]), freeze: 3, merges: ['A1:F1'] };
}
/* ---- 平面圖：工作內容表 ---- */
function ttPlanLines() { const B = ttBuild(true), L = B.W.map(ttWorkLine); return { L, def: B.anyDef }; }
let TT_PC = { k: '', v: null };
function ttPlanCached() { const k = JSON.stringify([state.structs.map(s => [s.name, s.sta]), (state.revs || []).map(r => [r._q && r._q.a, r._q && r._q.b, (r.bios || []).map(b => b.sta)]), (state.dns || []).map(d => [d.name, d.s0, d.s1, d.mode, (d.pts || []).length]), state.clCur, (state.grades || []).map(g => [g.name, g.s0, g.s1, g.src]), (state.dzCases || []).map(c => [c.name, (c.bl || []).length]), RV_SIG]);
  if (TT_PC.k !== k) { try { TT_PC = { k, v: ttPlanLines() }; } catch (e) { TT_PC = { k, v: { L: [], def: false } }; } } return TT_PC.v; }
function ttDrawPlan() {
  const cb = document.getElementById('lyrWorkTbl'); if (state.viewMode !== '2D' || (cb && !cb.checked)) return; const P = ttPlanCached(); if (!P.L.length) return;
  const dpr = window.devicePixelRatio || 1, cw = cadCanvas.width / dpr, ch = cadCanvas.height / dpr, T = state.textScale || 1, fs = 11.5 * T, lh = fs * 1.55;
  ctx.save(); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.font = `${fs}px "Noto Sans TC",sans-serif`;
  const lines = ['工作內容'].concat(P.L).concat(P.def ? [TT_NOTE] : []), w = Math.max(...lines.map(s => ctx.measureText(s).width)) + 20, h = lines.length * lh + 10, x = cw - w - 80, y = ch - h - 16;
  ctx.fillStyle = 'rgba(11,16,24,0.88)'; ctx.strokeStyle = '#a3e635'; ctx.lineWidth = 1; ctx.fillRect(x, y, w, h); ctx.strokeRect(x, y, w, h);
  lines.forEach((s, i) => { ctx.fillStyle = i === 0 ? '#a3e635' : (P.def && i === lines.length - 1 ? '#fbbf24' : '#e2e8f0'); ctx.font = `${i === 0 ? 'bold ' : ''}${fs}px "Noto Sans TC",sans-serif`; ctx.textAlign = 'left'; ctx.fillText(s, x + 10, y + 8 + lh * (i + 0.72)); if (i === 0) { ctx.strokeStyle = 'rgba(163,230,53,.5)'; ctx.beginPath(); ctx.moveTo(x, y + 8 + lh); ctx.lineTo(x + w, y + 8 + lh); ctx.stroke(); } });
  ctx.restore();
}
function ttDxfPlan(D) {
  if (D._tt) return; D._tt = true; const cb = document.getElementById('lyrWorkTbl'); if (cb && !cb.checked) return; const P = ttPlanCached(); if (!P.L.length) return;
  const xs = [], ys = []; (state.points || []).forEach(p => { xs.push(p.x); ys.push(p.y); }); (state.axisNodes || []).forEach(p => { xs.push(p.x); ys.push(p.y); }); if (!xs.length) return;
  const x1 = Math.max(...xs), y1 = Math.max(...ys), y0 = Math.min(...ys), TH = Math.max(1.2, Math.min(5, (y1 - y0) / 60)), lh = TH * 1.7, lines = ['工作內容'].concat(P.L).concat(P.def ? [TT_NOTE] : []);
  const X = x1 + TH * 8, w = Math.max(...lines.map(s => s.length)) * TH * 0.95 + TH * 2, h = lines.length * lh + TH;
  D.poly([[X, y1], [X + w, y1], [X + w, y1 - h], [X, y1 - h]], 'WORK_TABLE', 3, 0, true); D.line(X, y1 - lh - TH * 0.3, 0, X + w, y1 - lh - TH * 0.3, 0, 'WORK_TABLE', 3);
  lines.forEach((s, i) => D.text(X + TH, y1 - TH * 0.6 - lh * (i + 0.6), TH, s, 'WORK_TABLE', i === 0 ? 3 : (P.def && i === lines.length - 1 ? 2 : 7), { align: 'l', valign: 'm' }));
}
(function () {
  const _bk = stQtyBook; stQtyBook = function () { const B = _bk(); B.sheets.forEach(s => { if (s.name === '總表') s.name = '結構物總表'; }); let s = null; try { s = ttSheet(); } catch (e) { console.error('ttSheet', e); } if (s) { B.sheets.unshift(s); B.n = Math.max(B.n, 1); } return B; };
  const _r2 = render2DCAD; render2DCAD = function () { _r2.apply(this, arguments); try { ttDrawPlan(); } catch (e) { console.error('ttDrawPlan', e); } };
  const _xp = rvDxfPlan; rvDxfPlan = function (D) { _xp(D); try { ttDxfPlan(D); } catch (e) { console.error('ttDxfPlan', e); } };
  window.addEventListener('DOMContentLoaded', () => setTimeout(() => { const x = document.getElementById('btnXlsx'); if (x && !document.getElementById('btnTT')) { const b = document.createElement('button'); b.className = 'btn'; b.id = 'btnTT'; b.textContent = '工程總表'; b.title = '開啟工程總表頁：工作項目與各類型小計、材料總表（混凝土依強度分列、鋼筋總量）、土方'; b.onclick = () => ttOpen(); x.parentNode.insertBefore(b, x); } }, 300));
})();
