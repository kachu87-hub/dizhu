/* ============================================================================
   v8.7.1
   1. 畫中心線途中按「✋ 平移」：不結束繪製、不清掉已點的點，改為暫時左鍵拖曳平移；再按一次（或按「繪中心線」）回到繼續點選
   2. 平面工具列：繪線鎖點（鎖點、端點、中點、長度吸附）常駐工具列，不收進「更多」；補高程點、翻網格、尋找地形、純折線放回左側「平面工具」
   3. 護岸卡片：型式選單下方顯示斷面示意小圖（隨型式、尺寸更新）；平面圖例加列護岸
   （4. 型錄縮圖：見 catmod.js 與 v871thumb.js）
   ============================================================================ */

/* ---- 1. 繪製中平移 ---- */
state.v871Pan = false;
function v871Drawing() { return state.viewMode === '2D' && state.activeTool === 'DRAW_AXIS' && (state.tempAxisNodes || []).length > 0; }
function v871PanSet(on) {
  state.v871Pan = !!on; state.v871Drag = null;
  const tp = document.getElementById('toolPan'), td = document.getElementById('toolDrawAxis');
  if (tp) tp.classList.toggle('active', state.v871Pan || state.activeTool === 'PAN');
  if (td) td.classList.toggle('active', state.activeTool === 'DRAW_AXIS' && !state.v871Pan);
  if (typeof cadCanvas !== 'undefined') cadCanvas.style.cursor = state.v871Pan ? 'grab' : '';
  const vp = document.getElementById('vcPan'); if (vp) vp.classList.toggle('on', state.v871Pan || state.activeTool === 'PAN');
  const n = (state.tempAxisNodes || []).length;
  updateStatus(state.v871Pan ? `✋ 繪製中平移：左鍵拖曳移動圖面，已點的 ${n} 點保留。再按一次「平移」或按「繪中心線」繼續點選。` : `📏 繼續繪製中心線（已點 ${n} 點）。右鍵、Enter 或雙擊結束。`);
  requestRedraw();
}
function v871PanBtn() {   // 平面工具列「平移／改 IP」與右側「平移」鈕
  if (state.v871Pan) { v871PanSet(false); return; }
  if (v871Drawing()) { v871PanSet(true); return; }
  setTool('PAN');
}
{ const _st = setTool; setTool = function (t) {
  if (t === 'DRAW_AXIS' && state.activeTool === 'DRAW_AXIS' && state.v871Pan) { v871PanSet(false); return; }   // 從平移回到繪製：保留已點的點
  state.v871Pan = false; state.v871Drag = null; if (typeof cadCanvas !== 'undefined') cadCanvas.style.cursor = '';
  return _st.apply(this, arguments);
}; }
{ const _vp = viewPanToggle; viewPanToggle = function () {
  if (state.viewMode === '2D' && (state.v871Pan || v871Drawing())) { v871PanSet(!state.v871Pan); return; }
  return _vp.apply(this, arguments);
}; }
/* 左鍵拖曳平移的 mousedown 攔截放在 v871early.js（需比其他模組的視窗攔截先註冊） */
window.addEventListener('mouseup', () => { if (state.v871Drag) { state.v871Drag = null; cadCanvas.style.cursor = state.v871Pan ? 'grab' : ''; } });
window.addEventListener('dblclick', e => { if (state.v871Pan && e.target === cadCanvas) { e.stopImmediatePropagation(); } }, true);   // 平移中雙擊不結束繪製
window.addEventListener('keydown', e => { if (e.key === 'Escape' && state.v871Pan) { state.v871Pan = false; state.v871Drag = null; cadCanvas.style.cursor = ''; } }, true);

/* ---- 2. 平面工具列 ---- */
V86_PT.splice(V86_PT.findIndex(x => x[0] === 'toolAddPt'));   // 補高程點、翻網格、尋找地形、純折線留在左側「平面工具」
function v871PlanFix() {
  const tp = document.getElementById('toolPan'); if (tp) tp.setAttribute('onclick', 'v871PanBtn()');
  const ir = document.getElementById('ipxRow'); if (ir) { const l = [...ir.querySelectorAll('.lbl')].find(x => /長度吸附/.test(x.textContent)); if (l) { l.textContent = '吸附'; l.style.marginLeft = '4px'; } }
  const ph = document.getElementById('v86PlanPh');
  if (ph && !ph.dataset.v871) { ph.dataset.v871 = 1; ph.innerHTML = '常用的平面工具（平移、繪中心線、插入 IP、延長、加樁、結構物、護岸、繪線鎖點）在<b>平面圖上方的工具列</b>；較少用的補高程點、翻網格、尋找地形、純折線在下方。'; }
  const grp = document.getElementById('planToolsGroup');
  if (grp && !grp.querySelector('.v871-more')) {
    const B = ['toolAddPt', 'toolFlip'].map(id => document.getElementById(id)).concat([...grp.querySelectorAll('button')].filter(b => /focusMainCluster|setAllIPRadius\(0\)/.test(b.getAttribute('onclick') || '')));
    const w = document.createElement('div'); w.className = 'v871-more'; B.forEach(b => { if (b && b.closest('#planToolsGroup')) w.appendChild(b); });
    if (w.children.length) (ph && ph.parentElement === grp ? ph.after(w) : grp.prepend(w));
  }
}
(function () {
  const s = document.createElement('style');
  s.textContent = `.v871-more { grid-column:1 / -1; display:flex; flex-wrap:wrap; gap:4px; margin:4px 0 6px; }
  #planToolsGroup #v86PlanPh { grid-column:1 / -1; }
  .v871-more .btn { padding:3px 8px; font-size:11.5px; }
  #v86PlanBar #ipxRow { flex-shrink:0; gap:2px !important; padding:0 4px !important; margin-left:2px; border-left:1px solid #3b4a63 !important; border-radius:0 !important; }
  #v86PlanBar #ipxRow > .lbl:first-child { display:none; }
  #v86PlanBar #ipxRow .btn { padding:2px 6px !important; }
  #v86PlanBar #ipxRow select { width:70px; }
  #v86PlanBar > .btn.v871-nl .v83-lb { display:none; }
  #v86PlanBar > .btn.v871-nl { padding-left:7px !important; padding-right:7px !important; }
  .v871-rvcv { display:block; width:100%; max-width:320px; height:auto; margin-top:4px; border:1px solid var(--border-dim, #334155); border-radius:4px; background:#0b1018; }`;
  document.head.appendChild(s);
})();
v86FitPlan = function () {   // 同 v86：排不下時從右邊收進「更多」，但繪線鎖點（#ipxRow）一律留在工具列
  const bar = v86El('v86PlanBar'); if (!bar || getComputedStyle(bar).display === 'none') return;
  const m = bar.querySelector(':scope > .v83-more'); if (!m) return; const pop = m.lastElementChild;
  [...pop.children].sort((a, b) => a.dataset.v83o - b.dataset.v83o).forEach(c => bar.insertBefore(c, m));
  const P = bar.parentElement.getBoundingClientRect(), cn = v86El('uimCorner'), cr = cn && cn.offsetParent ? cn.getBoundingClientRect() : null;
  const right = cr && cr.width ? cr.left - 8 : P.right - 70;
  const ts = uimTs(); bar.style.setProperty('left', ((right - P.left) / 2 + 2) / ts + 'px', 'important');
  bar.style.maxWidth = Math.max(200, (right - P.left - 12) / ts) + 'px';
  m.classList.add('v83-off'); bar.classList.remove('v871-ic'); bar.querySelectorAll('.v871-nl').forEach(c => c.classList.remove('v871-nl'));
  const lim = () => { const r = bar.getBoundingClientRect(); return r.right > right || r.left < P.left + 4 || bar.scrollWidth > bar.clientWidth + 1; };
  if (!lim()) return;
  // 先由右往左把按鈕縮成只剩圖示（滑鼠停留顯示名稱；平移、繪中心線最後才縮），仍放不下才收進「更多」
  const NL = [...bar.querySelectorAll(':scope > .btn')].filter(c => c.querySelector('.v83-lb')).reverse();
  for (const c of NL) { c.classList.add('v871-nl'); if (!lim()) return; }
  m.classList.remove('v83-off');
  const L = [...bar.children].filter(c => c !== m && c.id !== 'ipxRow' && !c.classList.contains('v83-ttl') && !c.classList.contains('v83-hide') && c.dataset.v83o !== undefined);
  while (lim() && L.length > 1) { const c = L.pop(); pop.insertBefore(c, pop.firstChild); }
};
window.addEventListener('load', () => { let n = 0; const t = setInterval(() => { v871PlanFix(); if (document.getElementById('v86PlanBar') || ++n > 40) { v871PlanFix(); clearInterval(t); try { v86FitPlan(); } catch (e) { } } }, 150); });

/* ---- 3. 護岸卡片斷面示意小圖、平面圖例 ---- */
{ const _r = rvRenderUI; rvRenderUI = function () {
  const r = _r.apply(this, arguments);
  try {
    const box = document.getElementById('rvBox'), rv = state.revs[state.rvSel], sel = box && box.querySelector('select[data-rv="type"]');
    if (sel && rv) {
      let cv = box.querySelector('canvas.v871-rvcv');
      if (!cv) { cv = document.createElement('canvas'); cv.className = 'v871-rvcv'; cv.width = 320; cv.height = 190; cv.title = '型式斷面示意（單岸、示意地形）；詳細尺寸請開標準圖'; const note = sel.parentElement.nextElementSibling; (note || sel.parentElement).after(cv); }
      rvWizDraw(cv, rv.type, rv.p, null, false);
    }
  } catch (e) { console.warn('v871 rv schematic', e); }
  return r;
}; }
function v871Legend() {
  const lg = document.getElementById('hudLegend'); if (!lg || lg.querySelector('.v871-lg')) return;
  const row = (st, t) => `<div class="legend-row v871-lg"><span class="legend-line" style="${st}"></span> ${t}</div>`;
  lg.insertAdjacentHTML('beforeend', row('background:#ffffff;height:1.5px;', '護岸 水側趾線／岸頂線')
    + row('border-top:1.5px dashed #ffffff;height:0;background:none;', '護岸 背側線')
    + row('background:rgba(34,211,238,0.35);height:6px;border:1px solid #22d3ee;', '選取中的護岸'));
}
window.addEventListener('load', () => setTimeout(v871Legend, 0));
