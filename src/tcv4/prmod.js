/* ============================================================================
   v6.6 參數合理範圍提示 (prmod)
   ・目的：抓「打錯字／單位錯」（例如 h2 打成 60、頂寬 0.45 打成 4.5），不是規範檢核
     （規範值另由 rulemod「手冊規定」提示）
   ・超出常用範圍：輸入框標黃色＋滑鼠提示；並列入檢核清單（⚠ 警告、黃色），不阻擋任何操作
   ・範圍表 PR_RNG 可自行增修：[下限, 上限]；單位同畫面（排水溝斷面尺寸畫面為 cm，表內一律用 m）
   ============================================================================ */
const PR_RNG = {
  st: {   // 結構物 st.p.*、st.w.L/R.*、st.a.群組.*
    'p.w': [1, 60], 'p.h1': [0, 6], 'p.d1': [0.3, 6], 'p.s1': [0, 2], 'p.h2': [0.3, 20], 'p.h3': [0.3, 6], 'p.hq': [0, 3],
    'p.k': [0, 5], 'p.k1': [0, 5], 'p.s2': [0, 1], 'p.s3': [0, 2], 'p.s4': [0, 2], 'p.s5': [0, 2], 'p.nh': [0, 60],
    'p.hb': [0, 5], 'p.hwx': [0, 60], 'p.kx': [0, 3], 'p.km': [0, 3], 'p.off': [-50, 50],
    'w.r1': [0, 80], 'w.rs': [0, 50], 'w.r2': [0, 80], 'w.r3': [0, 5], 'w.r4': [0, 30], 'w.r5': [0, 30], 'w.ns': [0, 5], 'w.wh': [0.3, 30],
    'a.apron.cL': [1, 5], 'a.apron.tp': [0.2, 3], 'a.apron.kd': [0, 5], 'a.apron.kw': [0, 5], 'a.apron.L0': [0.3, 60], 'a.apron.R0': [0.3, 60], 'a.apron.L1': [0.3, 60], 'a.apron.R1': [0.3, 60],
    'a.tail.ht': [0.2, 5], 'a.tail.hn': [0, 3], 'a.tail.wn': [0.3, 60], 'a.tail.ts': [0.3, 5], 'a.tail.sd': [0, 2],
    'a.wall.tw': [0.2, 2], 'a.wall.si': [0, 2], 'a.wall.so': [0, 2], 'a.wall.hE': [0.3, 15], 'a.wall.dh': [0.02, 0.3], 'a.wall.da': [0.5, 10],
    'a.sill.a': [0, 200], 'a.sill.sp': [1, 200], 'a.sill.n': [1, 20], 'a.sub.r': [0.1, 1], 'a.sub.L': [1, 200]
  },
  stSill: { 'p.d1': [0.3, 15], 'p.h2': [0.3, 3] },   // 固床工：頂寬（順流向）可較寬
  rv: {   // 護岸 rv.p.*
    'p.H': [0.5, 10], 'p.b': [0.2, 2], 'p.n': [0, 1.5], 'p.D': [0.3, 5], 'p.ww': [0, 3], 'p.ec': [0, 3],
    'p.sdx': [0, 2], 'p.sdz': [-1, 2], 'p.g': [-0.5, 0.5], 'p.pdia': [0.03, 0.3], 'p.psp': [0.5, 10], 'p.pz': [0, 5], 'p.psl': [0, 1], 'p.jsp': [3, 30]
  },
  dn: {   // 排水溝 d.p.*、d.ec（m）
    'p.B': [0.2, 3], 'p.H': [0.2, 3], 'p.t': [0.05, 0.5], 'p.tb': [0.05, 0.5], 'p.pad': [0, 0.5], 'p.m': [0, 3], 'ec': [0, 3]
  }
};
const PR_CM = { 'p.B': 1, 'p.H': 1, 'p.t': 1, 'p.tb': 1, 'p.pad': 1 };   // 排水溝畫面以 cm 輸入
const PR_DN_N = { 'p.B': '內寬／底寬 B', 'p.H': '內高／溝深 H', 'p.t': '側壁／襯砌厚 t', 'p.tb': '底板厚', 'p.pad': '碎石墊層厚', 'p.m': '側坡 1:m', 'ec': '開挖坡 1:n' };
/* 結構物路徑 → 範圍鍵（w.L.r1 → w.r1） */
const prStKey = path => /^w\.[LR]\./.test(path) ? 'w.' + path.split('.')[2] : path;
function prName(kind, path) {
  try {
    if (kind === 'st') { const i = typeof ST_INFO !== 'undefined' && ST_INFO[/^p\./.test(path) ? path.slice(2) : /^w\.[LR]\./.test(path) ? path.split('.')[2] + path.split('.')[1] : path]; if (i) return i.n; }
    if (kind === 'rv') { const q = (typeof RV_P !== 'undefined' ? RV_P : []).concat(typeof RV_PIPE !== 'undefined' ? RV_PIPE.map(x => [x[0], '排水管' + x[1]]) : []).find(x => 'p.' + x[0] === path); if (q) return q[1].replace(/\s*\(.*$/, ''); }
    if (kind === 'dn') return PR_DN_N[path] || path;
  } catch (e) { }
  return path;
}
const prFmt = v => (+v).toFixed(3).replace(/\.?0+$/, '');
/* 檢查單一數值：回傳 null（正常）或 {lo,hi} */
function prTest(kind, path, v, sub) {
  const key = kind === 'st' ? prStKey(path) : path, R = (sub && PR_RNG[sub] && PR_RNG[sub][key]) || (PR_RNG[kind] && PR_RNG[kind][key]);
  if (!R || v === null || v === undefined || v === '' || !Number.isFinite(+v)) return null;
  return (+v < R[0] - 1e-9 || +v > R[1] + 1e-9) ? { lo: R[0], hi: R[1] } : null;
}
function prMsg(kind, path, v, r) {
  const cm = kind === 'dn' && PR_CM[path], u = cm ? ' cm' : (/斜率|坡|1:|比/.test(prName(kind, path)) ? '' : ' m'), k = cm ? 100 : 1;
  return `參數範圍：${prName(kind, path)} = ${prFmt(v * k)}${u}，超出常用範圍 ${prFmt(r.lo * k)}～${prFmt(r.hi * k)}${u}（請確認是否輸入錯誤，不影響計算）`;
}
/* 全專案掃描 */
function prScan() {
  const out = [];
  (state.structs || []).forEach((st, i) => {
    if (st.par) return;   // 跟隨主壩的副壩／固床工：參數由主壩決定
    const nm = st.name || `結構物${i + 1}`, go = { tab: 'tab-earth', card: 'stCard', sel: () => stSelect(i), sta: st.sta, view: '2D' };
    const chk = (path, v) => { const r = prTest('st', path, v, st.type === 'sill' ? 'stSill' : null); if (r) out.push({ cat: '結構物', obj: nm, msg: prMsg('st', path, v, r), go }); };
    Object.keys(st.p || {}).forEach(k => { if (st.type === 'sill' && k === 'h1') return; chk('p.' + k, st.p[k]); });
    ['L', 'R'].forEach(sd => { const g = st.w && st.w[sd]; if (g && !g.auto) Object.keys(g).forEach(k => chk(`w.${sd}.${k}`, g[k])); });
    Object.keys(st.a || {}).forEach(gk => { const g = st.a[gk]; if (!g || g.on === false) return; Object.keys(g).forEach(k => { if (g[k] !== null && typeof g[k] !== 'boolean') chk(`a.${gk}.${k}`, g[k]); }); });
  });
  (state.revs || []).forEach((rv, i) => {
    const nm = typeof rvName === 'function' ? rvName(rv) : `護岸${i + 1}`, L = typeof rvLim === 'function' ? rvLim(rv) : { a: rv.s0, b: rv.s1 };
    const go = { tab: 'tab-earth', card: 'rvCard', sel: () => rvSel(i), sta: (L.a + L.b) / 2, view: '2D' };
    Object.keys(rv.p || {}).forEach(k => { const r = prTest('rv', 'p.' + k, rv.p[k]); if (r) out.push({ cat: '護岸', obj: nm, msg: prMsg('rv', 'p.' + k, rv.p[k], r), go }); });
  });
  (state.dns || []).forEach((d, i) => {
    if (typeof DN_TYPES !== 'undefined' && DN_TYPES[d.type] && DN_TYPES[d.type].orig) return;   // 其他型式（DN2）欄位不同，不套用
    const nm = d.name || `排水溝${i + 1}`, pt = d.pts && d.pts.length ? d.pts[Math.floor(d.pts.length / 2)] : null;
    const go = { tab: 'tab-dn', sel: () => { state.dnSel = i; dnPanelUI(); }, xy: pt ? [pt[0] ?? pt.x, pt[1] ?? pt.y] : null, view: '2D' };
    const chk = (path, v) => { if (d.type !== 'trap' && path === 'p.m') return; const r = prTest('dn', path, v); if (r) out.push({ cat: '排水', obj: nm, msg: prMsg('dn', path, v, r), go }); };
    Object.keys(d.p || {}).forEach(k => chk('p.' + k, d.p[k])); chk('ec', d.ec);
  });
  return out;
}
/* 併入檢核清單（警告），依類別排在原有項目之後 */
if (typeof chkCollect === 'function') {
  const _cc = chkCollect;
  chkCollect = function () {
    const out = _cc.apply(this, arguments);
    try { prScan().forEach(x => out.push({ sev: 'warn', cat: x.cat, obj: x.obj, msg: x.msg, go: x.go, pr: true })); } catch (e) { console.warn('prScan', e); }
    const ci = c => { const k = CHK_CATS.indexOf(c); return k < 0 ? 99 : k; };
    return out.map((x, k) => [x, k]).sort((a, b) => ci(a[0].cat) - ci(b[0].cat) || a[1] - b[1]).map(a => a[0]);
  };
}
/* 輸入框標黃：依欄位路徑＋畫面數值判斷（不需知道是哪個物件） */
function prMarkEl(el) {
  let kind = null, path = null, v = el.value;
  if (el.dataset.path && el.closest('#stBox, #stCard, .stlab')) { kind = 'st'; path = el.dataset.path; }
  else if (el.dataset.rv && !el.dataset.rvi) { kind = 'rv'; path = el.dataset.rv; }
  else { const m = /dnSet\('([^']+)'/.exec(el.getAttribute('onchange') || ''); if (m) { kind = 'dn'; path = m[1]; if (PR_CM[path] && v !== '') v = +v / 100; } }
  let sub = null; if (kind === 'st') { try { const st = (state.structs || [])[state.structSel]; if (st && st.type === 'sill') sub = 'stSill'; } catch (e) { } }
  const r = kind ? prTest(kind, path, v, sub) : null;
  if (r) { el.classList.add('pr-out'); el.title = prMsg(kind, path, +v, r).replace(/^參數範圍：/, '⚠ '); el.dataset.prOut = '1'; }
  else if (el.dataset.prOut) { el.classList.remove('pr-out'); el.removeAttribute('title'); delete el.dataset.prOut; }
}
function prMarkAll() { document.querySelectorAll('input.input-num[data-path], input.input-num[data-rv], input.input-num[onchange^="dnSet("]').forEach(prMarkEl); }
(function () {
  const s = document.createElement('style');
  s.textContent = `input.input-num.pr-out { background:#fef08a !important; color:#713f12 !important; outline:2px solid #f59e0b; outline-offset:-1px; }`;
  document.head.appendChild(s);
  let q = 0; const sched = () => { if (q) return; q = requestAnimationFrame(() => { q = 0; try { prMarkAll(); } catch (e) { } }); };
  document.addEventListener('input', ev => { if (ev.target && ev.target.classList && ev.target.classList.contains('input-num')) prMarkEl(ev.target); }, true);
  window.addEventListener('load', () => { try { new MutationObserver(sched).observe(document.body, { childList: true, subtree: true }); } catch (e) { } sched(); });
})();
