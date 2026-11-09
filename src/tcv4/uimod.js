/* ============================================================================
   uimod：介面改版（三欄式工作台）— 只搬容器與改 CSS，不動計算
   A 頂部列單行：Logo＋中心線｜4 視圖｜開啟・儲存・載入・檢核・匯出▾・⚙▾
   B 左側：窄 Icon 欄＋內容面板（再點目前圖示＝收合；右緣可拖拉寬度）
   F 畫布角落：圖例收成按鈕；左上資訊／提示併入狀態列；工作內容表、雷達圖可收合
   G 介面倍率：未手動調過時依視窗寬度自動決定
   ============================================================================ */
const UIM = { rail: 52, pw: 320, col: false, legend: false, work: true, map: true };
(function () {
  const rd = k => { try { return localStorage.getItem(k); } catch (e) { return null; } };
  const p = parseFloat(rd('tc_uim_pw')); if (p >= 240 && p <= 720) UIM.pw = p;
  try { const f = JSON.parse(rd('tc_uim_f') || '{}'); ['legend', 'work', 'map'].forEach(k => { if (typeof f[k] === 'boolean') UIM[k] = f[k]; }); } catch (e) {}
  // G：沒有手動設定過介面倍率時，依視窗寬度自動決定
  UIM.autoTs = !(parseFloat(rd('tc_ui2')) >= 1);
  document.documentElement.style.setProperty('--uim-pw', UIM.pw + 'px');
})();
function uimSave() { try { localStorage.setItem('tc_uim_f', JSON.stringify({ legend: UIM.legend, work: UIM.work, map: UIM.map })); localStorage.setItem('tc_uim_pw', String(UIM.pw)); } catch (e) {} }
function uimTs() { return parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--ts')) || 1; }
(function () {
  const s = document.createElement('style');
  s.textContent = `
  /* ---- A 頂部列 ---- */
  .top-ribbon.uim { flex-wrap:nowrap !important; overflow:visible !important; justify-content:flex-start; height:auto; min-height:44px; padding-top:3px !important; padding-bottom:3px !important; gap:6px; }
  .top-ribbon.uim .uim-sp { flex:1 1 0; min-width:4px; }
  .top-ribbon.uim .toolbar-group { flex-shrink:0; }
  .top-ribbon.uim .brand-titlewrap { width:auto; }
  .top-ribbon.uim #uimViews .btn { padding-left:10px; padding-right:10px; }
  .top-ribbon.uim .uim-dd { position:relative; }
  .uim-pop { position:fixed; z-index:9500; display:none; flex-direction:column; gap:4px; padding:6px; min-width:180px; background:#ffffff; border:1px solid #aab4c4; border-radius:6px; box-shadow:0 8px 24px rgba(0,0,0,.25); zoom:var(--ts); }
  .uim-pop.on { display:flex; }
  .uim-pop .btn { width:100%; justify-content:flex-start; text-align:left; margin:0; background:#ffffff; color:#1e293b; border-color:#d7dde6; }
  .uim-pop .btn:hover { background:#f1f5f9; color:#0f172a; border-color:#0e7490; }
  .uim-pop .uim-row { display:flex; align-items:center; gap:4px; }
  .uim-pop .uim-row .btn { width:auto; }
  .uim-pop .ts-cap { color:#475569; min-width:30px; }
  .uim-pop .ts-label { color:#0e7490; }
  .uim-pop .uim-hd { font-size:11px; color:#64748b; padding:2px 2px 0; }
  .uim-pop #asvBadge { display:block; padding:4px 6px; }
  /* ---- B 左側：Icon 欄＋內容面板 ---- */
  .side-panel.uim { flex-direction:row !important; width:calc(${UIM.rail}px + var(--uim-pw, 320px)) !important; position:relative; }
  .side-panel.uim.uim-col { width:${UIM.rail}px !important; }
  .side-panel.uim.uim-col > .panel-body, .side-panel.uim.uim-col > #uimContent { display:none !important; }
  .side-panel.uim > .panel-tabs { display:flex !important; flex-direction:column; flex:0 0 ${UIM.rail}px; width:${UIM.rail}px; box-sizing:border-box; padding:6px 4px !important; gap:4px !important; border-bottom:none !important; border-right:1px solid #d7dde6; overflow-y:auto; overflow-x:hidden; }
  .side-panel.uim > .panel-tabs > .panel-tab { min-height:50px !important; font-size:9.5px !important; line-height:1.15; white-space:normal !important; text-overflow:clip; word-break:break-all; padding:5px 1px !important; }
  .side-panel.uim > .panel-body { flex:1 1 auto; min-width:0; }
  .side-panel.uim > #uimContent { flex:1 1 auto; min-width:0; display:flex; flex-direction:column; overflow:hidden; }
  .side-panel.uim > #uimContent > .panel-body { flex:1 1 auto; min-height:0; }
  .side-panel.uim > .panel-tabs > .panel-tab[style*="display: none"], .side-panel.uim > .panel-tabs > .panel-tab[style*="display:none"] { display:none !important; }
  .side-panel.uim > .uim-grip { position:absolute; top:0; right:-3px; width:6px; height:100%; cursor:ew-resize; z-index:30; }
  .side-panel.uim > .uim-grip:hover, .side-panel.uim > .uim-grip.on { background:rgba(14,116,144,.35); }
  .side-panel.uim.uim-col > .uim-grip { display:none; }
  /* ---- F 畫布角落 ---- */
  #uimCorner { position:absolute; top:8px; right:10px; z-index:25; display:none; gap:4px; zoom:var(--ts); }
  body.uim-2d #uimCorner { display:flex; }
  #uimCorner button { font-size:11px; padding:3px 8px; border-radius:12px; background:rgba(11,16,24,.82); color:#cbd5e1; border:1px solid #3b4a63; cursor:pointer; white-space:nowrap; }
  #uimCorner button:hover { color:#fff; border-color:var(--cad-cyan); }
  #uimCorner button.on { color:var(--cad-cyan); border-color:var(--cad-cyan); background:rgba(0,240,255,.12); }
  #hudLegend.uim { top:36px !important; }
  body.uim-noleg #hudLegend { display:none !important; }
  body.uim-nomap #minimapBox { display:none !important; }
  .status-bar #hudTopLeft { position:static !important; zoom:1 !important; display:flex; flex-direction:row; align-items:baseline; gap:14px; flex:1 1 100%; order:5; min-width:0; padding:0; margin:0; background:transparent; border:none; box-shadow:none; pointer-events:auto; }
  .status-bar #hudTopLeft .hud-badge { background:transparent !important; border:none !important; padding:0 !important; margin:0 !important; font-size:11px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; box-shadow:none !important; max-width:100%; }
  .status-bar #hudTopLeft #hudModelInfo { color:#94a3b8; flex:0 0 auto; }
  .status-bar #hudTopLeft #hudToolTip { flex:1 1 0; min-width:0; }
  body:not(.uim-2d) .status-bar #hudTopLeft { display:none !important; }
  `;
  document.head.appendChild(s);
})();

/* ---- A 頂部列 ---- */
function uimPop(id, btn) {
  const p = document.getElementById(id); if (!p) return;
  const on = !p.classList.contains('on');
  document.querySelectorAll('.uim-pop.on').forEach(x => x.classList.remove('on'));
  if (!on) return;
  const r = btn.getBoundingClientRect(), ts = uimTs();
  p.classList.add('on');
  const w = p.getBoundingClientRect().width;
  p.style.top = (r.bottom + 4) / ts + 'px';
  p.style.left = Math.max(4, Math.min(r.right - w, window.innerWidth - w - 6)) / ts + 'px';
}
document.addEventListener('mousedown', e => { if (!e.target.closest('.uim-pop, .uim-dd')) document.querySelectorAll('.uim-pop.on').forEach(x => x.classList.remove('on')); });
window.addEventListener('resize', () => document.querySelectorAll('.uim-pop.on').forEach(x => x.classList.remove('on')));
function uimTop() {
  const rb = document.querySelector('.top-ribbon'); if (!rb || rb.classList.contains('uim')) return true;
  const q = s => document.querySelector(s), byOn = f => [...rb.querySelectorAll('button')].find(b => (b.getAttribute('onclick') || '').includes(f));
  const brand = rb.querySelector('.brand-box'), cl = q('#clGroup'), v2d = q('#btnView2D');
  const bOpen = byOn('triggerFileSelect'), bSave = byOn('saveProject(true)'), bLoad = byOn("projInput').click"), pin = q('#projInput');
  const bCsv = byOn('exportIPTableCSV'), bDxf = byOn('exportFullDXF'), bX = q('#btnXlsx'), bPkg = q('#btnPkg'), bChk = q('#btnChk'), asv = q('#asvBadge');
  const tsGrp = q('#tsUiLabel') && q('#tsUiLabel').closest('.toolbar-group');
  if (!brand || !v2d || !bOpen || !bDxf) return false;
  if (!bChk || !asv || !bPkg || !bX || !cl) return false;   // 其他模組尚未加入按鈕：稍後再試
  const views = v2d.closest('.toolbar-group'); views.id = 'uimViews';
  const SHORT = { btnView2D: ['1. 平面', '1. 平面定線圖'], btnViewProfile: ['2. 縱斷', '2. 縱斷面設計圖'], btnViewCross: ['3. 橫斷', '3. 橫斷面設計圖'], btnView3D: ['4. 3D', '4. 3D 地形模擬'] };
  Object.entries(SHORT).forEach(([id, [s, f]]) => { const b = q('#' + id); if (b) { b.textContent = s; b.title = f; } });
  // 檔案
  const file = document.createElement('div'); file.className = 'toolbar-group'; file.id = 'uimFile';
  bOpen.textContent = '開啟 DXF'; bOpen.title = '開啟 AutoCAD 檔 (.DXF / .CSV)';
  bSave.textContent = '另存專案'; bLoad.textContent = '載入';
  [bOpen, bSave, bLoad, pin].forEach(e => e && file.appendChild(e));
  // 匯出 ▾
  const ex = document.createElement('div'); ex.className = 'toolbar-group uim-dd'; ex.id = 'uimExport';
  ex.innerHTML = '<button class="btn primary" id="uimExportBtn" onclick="uimPop(\'uimExportPop\', this)" title="匯出 DXF、數量表、報表、出圖包">匯出 ▾</button>';
  if (bChk) ex.insertBefore(bChk, ex.firstChild);
  const exPop = document.createElement('div'); exPop.className = 'uim-pop'; exPop.id = 'uimExportPop';
  bDxf.textContent = '匯出全圖 (.DXF)'; bDxf.classList.remove('primary');
  if (bX) bX.textContent = '匯出數量表 (.xlsx)';
  bCsv.textContent = '匯出報表 (.CSV)';
  if (bPkg) bPkg.textContent = '出圖包…';
  [bDxf, bX, bPkg, bCsv].forEach(b => { if (b) { exPop.appendChild(b); b.addEventListener('click', () => exPop.classList.remove('on')); } });
  // ⚙ 設定 ▾（介面／圖面倍率、自動存檔）
  const st = document.createElement('div'); st.className = 'toolbar-group uim-dd'; st.id = 'uimSet';
  st.innerHTML = '<button class="btn" id="uimSetBtn" onclick="uimPop(\'uimSetPop\', this)" title="介面與圖面文字大小、自動存檔">設定 ▾</button>';
  const stPop = document.createElement('div'); stPop.className = 'uim-pop'; stPop.id = 'uimSetPop';
  stPop.innerHTML = '<div class="uim-hd">文字大小</div>';
  if (tsGrp) {
    const kids = [...tsGrp.childNodes].filter(n => n.nodeType === 1);
    let row = null;
    kids.forEach(k => { if (k.classList.contains('ts-cap')) { row = document.createElement('div'); row.className = 'uim-row'; stPop.appendChild(row); } if (row) row.appendChild(k); });
    tsGrp.remove();
  }
  if (asv) { const h = document.createElement('div'); h.className = 'uim-hd'; h.textContent = '自動存檔'; stPop.appendChild(h); stPop.appendChild(asv); }
  document.body.appendChild(exPop); document.body.appendChild(stPop);
  // 重排：Logo＋中心線｜（空）視圖（空）｜檔案・檢核・匯出・設定
  [...rb.children].forEach(c => { if (c.classList.contains('toolbar-group') && !c.children.length) c.remove(); });
  const sp = () => { const d = document.createElement('div'); d.className = 'uim-sp'; return d; };
  rb.replaceChildren(...[brand, cl, sp(), views, sp(), file, ex, st].filter(Boolean));
  rb.classList.add('uim');
  return true;
}

/* ---- B 左側 Icon 欄 ---- */
const UIM_TABS = { 'tab-data': ['匯入', '匯入資料'], 'tab-align': ['平面', '平面工具／曲線'], 'tab-tin': ['圖層', '圖層／等高線'], 'tab-dz': ['崩塌地', '崩塌地'], 'tab-dn': ['排水', '排水'], 'tab-hy': ['水力', '水力'] };
function uimLabels() {
  document.querySelectorAll('.side-panel .panel-tab:not(.uim-eg)').forEach(t => {
    const L = UIM_TABS[t.dataset.tab];
    if (L) { if (t.textContent !== L[0]) t.textContent = L[0]; t.title = L[1] + '（再點一次可收合面板）'; }
    else t.title = t.textContent + '（再點一次可收合面板）';
  });
  if (typeof uimRail === 'function') uimRail();
}
function uimCollapse(c) {
  const sp = document.querySelector('.side-panel.uim'); if (!sp) return;
  UIM.col = !!c; sp.classList.toggle('uim-col', UIM.col);
  uimFixFixed(); requestAnimationFrame(() => resizeCanvases());
}
function uimFixFixed() {   // 原本寫死左邊界的浮動框（IP 要素編輯器）對齊側欄右緣
  const sp = document.querySelector('.side-panel'), ip = document.getElementById('ipEditor'); if (!sp || !ip) return;
  ip.style.left = (sp.getBoundingClientRect().right + 8) / uimTs() + 'px';
}
function uimSide() {
  const sp = document.querySelector('.side-panel'), tabs = sp && sp.querySelector('.panel-tabs'); if (!sp || !tabs || sp.classList.contains('uim')) return;
  sp.classList.add('uim');
  // 點目前的圖示＝收合／展開；收合時點任一圖示＝展開並切換
  tabs.addEventListener('click', e => {
    const t = e.target.closest('.panel-tab'); if (!t) return;
    if (UIM.col) { uimCollapse(false); return; }
    if (t.classList.contains('active')) { e.stopPropagation(); e.preventDefault(); uimCollapse(true); }
  }, true);
  // 右緣拖拉面板寬度
  const g = document.createElement('div'); g.className = 'uim-grip'; g.title = '拖拉調整面板寬度（雙擊恢復預設）'; sp.appendChild(g);
  let d = null;
  g.addEventListener('mousedown', e => { e.preventDefault(); d = { x: e.clientX, w: UIM.pw }; g.classList.add('on'); });
  g.addEventListener('dblclick', () => { UIM.pw = 320; document.documentElement.style.setProperty('--uim-pw', '320px'); uimSave(); uimFixFixed(); resizeCanvases(); });
  window.addEventListener('mousemove', e => {
    if (!d) return; const ts = uimTs();
    UIM.pw = Math.round(Math.max(240, Math.min(720, d.w + (e.clientX - d.x) / ts)));
    document.documentElement.style.setProperty('--uim-pw', UIM.pw + 'px'); uimFixFixed();
  });
  window.addEventListener('mouseup', () => { if (!d) return; d = null; g.classList.remove('on'); uimSave(); resizeCanvases(); });
  uimLabels();
}
// 程式切換頁籤時（例如從檢核、型錄跳過去），面板若收合就自動展開
const _uimSST = switchSideTab;
switchSideTab = function () { const r = _uimSST.apply(this, arguments); if (UIM.col && document.querySelector('.side-panel.uim')) uimCollapse(false); return r; };

/* ---- F 畫布角落 ---- */
function uimApplyF() {
  document.body.classList.toggle('uim-noleg', !UIM.legend);
  document.body.classList.toggle('uim-nomap', !UIM.map);
  const set = (id, on) => { const b = document.getElementById(id); if (b) b.classList.toggle('on', on); };
  set('uimBLeg', UIM.legend); set('uimBWork', UIM.work); set('uimBMap', UIM.map);
}
function uimToggle(k) { UIM[k] = !UIM[k]; uimSave(); uimApplyF(); requestRedraw(); }
function uimCorner() {
  const wrap = document.getElementById('viewportWrap'); if (!wrap || document.getElementById('uimCorner')) return;
  const c = document.createElement('div'); c.id = 'uimCorner';
  c.innerHTML = '<button id="uimBLeg" onclick="uimToggle(\'legend\')" title="顯示／隱藏圖例">🎨 圖例</button>'
    + '<button id="uimBWork" onclick="uimToggle(\'work\')" title="畫面上顯示／隱藏右下「工作內容」表（不影響 DXF；DXF 由圖層頁的「工作內容表」控制）">📋 工作內容</button>'
    + '<button id="uimBMap" onclick="uimToggle(\'map\')" title="顯示／隱藏左下地形導航雷達">🧭 雷達</button>';
  wrap.appendChild(c);
  const lg = document.getElementById('hudLegend'); if (lg) lg.classList.add('uim');
  // 左上資訊＋提示 → 狀態列
  const hud = document.getElementById('hudTopLeft'), sb = document.querySelector('.status-bar');
  if (hud && sb) {
    sb.appendChild(hud);
    const tip = document.getElementById('hudToolTip');
    if (tip && window.MutationObserver) { const f = () => { tip.title = tip.textContent.trim(); }; f(); new MutationObserver(f).observe(tip, { childList: true, subtree: true, characterData: true }); }
  }
  uimApplyF();
}
if (typeof ttDrawPlan === 'function') { const _uimTT = ttDrawPlan; ttDrawPlan = function () { if (!UIM.work) return; return _uimTT.apply(this, arguments); }; }
const _uimSVM = setViewMode;
setViewMode = function (m) { const r = _uimSVM.apply(this, arguments); document.body.classList.toggle('uim-2d', m === '2D'); uimLabels(); return r; };
if (typeof applyViewLayout === 'function') { const _uimAVL = applyViewLayout; applyViewLayout = function () { const r = _uimAVL.apply(this, arguments); uimLabels(); return r; }; }

function uimAutoScale() {   // G：沒有手動調過介面倍率時，依視窗寬度決定
  if (!UIM.autoTs || typeof applyUIScale !== 'function') return;
  const w = window.innerWidth || 1920, v = w >= 1800 ? 1.4 : w >= 1550 ? 1.25 : w >= 1300 ? 1.15 : 1;
  if (Math.abs(v - state.uiScale) > 1e-6) applyUIScale(v, false);
}
function uimInit(n) {
  if (!n) uimAutoScale();
  uimSide(); uimCorner();
  document.body.classList.toggle('uim-2d', (state.viewMode || '2D') === '2D');
  const ok = uimTop();
  if (!ok && (n || 0) < 20) { setTimeout(() => uimInit((n || 0) + 1), 150); return; }
  if (!ok) uimTopForce();
  uimLabels(); uimFixFixed();
  const l = document.getElementById('tsUiLabel'); if (l && typeof _fmtS === 'function') l.textContent = _fmtS(state.uiScale);
  requestAnimationFrame(() => resizeCanvases());
}
function uimTopForce() {   // 某些按鈕不存在時仍照樣整理（容錯）
  const q = s => document.querySelector(s);
  ['#clGroup', '#btnChk', '#asvBadge', '#btnPkg', '#btnXlsx'].forEach(s => { if (!q(s)) { const d = document.createElement('span'); d.id = s.slice(1); d.style.display = 'none'; document.body.appendChild(d); } });
  uimTop();
}
window.addEventListener('resize', () => uimFixFixed());
window.addEventListener('load', () => setTimeout(() => uimInit(0), 0));


/* ============================================================================
   v7.x 第二輪 H1／H2／H3：縱斷、橫斷、平面「結構物」的子頁籤全部搬進左側圖示欄；
   面板頂端加標題列（功能名稱、全部展開／收合、收合面板）
   ============================================================================ */
const UIM_SVG = d => `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'>${d}</svg>`)}")`;
// 依 EARTH_GROUPS 名稱配圖示：斷面編輯、縱坡設計、圖面資料框、樁號表、結構物、護岸、整地
const UIM_EG_ICON = {
  '斷面編輯': ['斷面', '<path d="M2 7l5 3 3 6h4l3-6 5-3"/><path d="M12 3v18" stroke-dasharray="2 2"/>'],
  '縱坡設計': ['縱坡', '<path d="M3 18l6-6 4 3 8-9"/><circle cx="9" cy="12" r="1.6"/><circle cx="13" cy="15" r="1.6"/><path d="M3 21h18"/>'],
  '圖面資料框': ['資料框', '<rect x="3" y="4" width="18" height="16" rx="1"/><path d="M3 14h18M3 17h18M9 14v6M15 14v6"/>'],
  '樁號表': ['樁號表', '<path d="M8 6h13M8 12h13M8 18h13"/><path d="M3 6h1M3 12h1M3 18h1"/>'],
  '結構物': ['結構物', '<path d="M3 21h18M5 21V10l7-5 7 5v11M9 21v-6h6v6"/>'],
  '護岸': ['護岸', '<path d="M4 21V5l6 2v14M10 9h10M10 13h10M10 17h10M14 9v4M18 13v4M14 17v4"/>'],
  '整地': ['整地', '<path d="M2 20h20M2 20v-4h5v-4h5v-4h5v-4h5"/>']
};
(function () {
  const s = document.createElement('style');
  s.textContent = `
  .side-panel.uim > .panel-tabs > .panel-tab[data-tab="tab-earth"] { display:none !important; }
  .side-panel.uim #earthSubTabs { display:none !important; }
  .side-panel.uim > .panel-tabs > .panel-tab.uim-eg.uim-off { display:none !important; }
  .side-panel.uim > .panel-tabs > .uim-sep { flex:0 0 auto; height:1px; background:#d7dde6; margin:2px 4px; }
  .side-panel.uim > .panel-tabs > .uim-sep.uim-off { display:none; }
  #uimHead { flex:0 0 auto; display:flex; align-items:center; gap:4px; padding:7px 8px 6px 12px; border-bottom:1px solid #d7dde6; background:#ffffff; }
  #uimHead .uim-ht { flex:1 1 auto; min-width:0; font-weight:700; font-size:13px; color:#0f172a; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  #uimHead .uim-hv { font-weight:400; font-size:11px; color:#64748b; margin-left:6px; }
  #uimHead button { flex:0 0 auto; width:26px; height:24px; display:flex; align-items:center; justify-content:center; padding:0; border:1px solid #d7dde6; border-radius:5px; background:#ffffff; color:#475569; cursor:pointer; }
  #uimHead button:hover { border-color:#0e7490; color:#0e7490; }
  #uimHead button::before { content:''; width:15px; height:15px; background:currentColor; -webkit-mask:var(--ti) center/contain no-repeat; mask:var(--ti) center/contain no-repeat; }
  #uimHead button.uim-off { display:none; }
  `;
  document.head.appendChild(s);
})();
const UIM_VIEWNAME = { '2D': '平面', PROFILE: '縱斷面', CROSS: '橫斷面', '3D': '3D' };
function uimEgBuild() {
  const tabs = document.querySelector('.side-panel.uim > .panel-tabs'), et = tabs && tabs.querySelector('.panel-tab[data-tab="tab-earth"]');
  if (!tabs || !et || tabs.querySelector('.uim-eg') || typeof EARTH_GROUPS === 'undefined') return;
  const frag = document.createDocumentFragment();
  EARTH_GROUPS.forEach((g, i) => {
    const ic = UIM_EG_ICON[g.name] || [g.name, '<circle cx="12" cy="12" r="7"/>'];
    const b = document.createElement('div'); b.className = 'panel-tab uim-eg'; b.dataset.eg = i;
    b.style.setProperty('--ti', UIM_SVG(ic[1])); b.textContent = ic[0];
    b.addEventListener('click', () => {
      if (b.classList.contains('active') && !UIM.col) return;   // 收合由欄位的 capture 監聽處理
      switchSideTab('tab-earth', et); earthShowGroup(i);
    });
    frag.appendChild(b);
  });
  et.after(frag);
  // 主程式的頁籤與 earth 子頁籤之間加分隔線（縱斷、橫斷時沒有其他頁籤則不顯示）
  const s0 = document.createElement('div'); s0.className = 'uim-sep'; s0.id = 'uimSep0'; et.after(s0);
}
function uimHeadBuild() {
  const sp = document.querySelector('.side-panel.uim'); if (!sp || document.getElementById('uimContent')) return;
  const c = document.createElement('div'); c.id = 'uimContent';
  const h = document.createElement('div'); h.id = 'uimHead';
  h.innerHTML = '<span class="uim-ht" id="uimHeadT"></span>'
    + '<button id="uimHOpen" title="目前分頁卡片全部展開" onclick="uimFoldAll(false)"></button>'
    + '<button id="uimHFold" title="目前分頁卡片全部收合" onclick="uimFoldAll(true)"></button>'
    + '<button id="uimHCol" title="收合左側面板（再點左側目前的圖示也可以）" onclick="uimCollapse(true)"></button>';
  c.appendChild(h);
  [...sp.children].filter(e => e.classList.contains('panel-body')).forEach(b => c.appendChild(b));
  const grip = sp.querySelector('.uim-grip'); sp.insertBefore(c, grip || null);
  document.getElementById('uimHOpen').style.setProperty('--ti', UIM_SVG('<path d="M4 6h16M4 12h16M4 18h16"/><path d="M9 3l3 2 3-2M9 21l3-2 3 2"/>'));
  document.getElementById('uimHFold').style.setProperty('--ti', UIM_SVG('<path d="M4 9h16M4 15h16"/><path d="M9 3l3 3 3-3M9 21l3-3 3 3"/>'));
  document.getElementById('uimHCol').style.setProperty('--ti', UIM_SVG('<path d="M15 5l-7 7 7 7"/><path d="M20 4v16"/>'));
}
function uimCurTab() { return ['tab-data', 'tab-align', 'tab-tin', 'tab-earth', 'tab-dz', 'tab-dn', 'tab-hy'].find(id => { const e = document.getElementById(id); return e && e.style.display !== 'none'; }); }
function uimFoldCards(tab) { return tab ? [...tab.children].filter(c => c.classList.contains('sec-card') && c.classList.contains('acc') && c.style.display !== 'none') : []; }
function uimFoldAll(fold) {
  const id = uimCurTab(); if (!id) return;
  if (id === 'tab-earth' && typeof earthFoldAll === 'function') { earthFoldAll(fold); return; }
  uimFoldCards(document.getElementById(id)).forEach(c => c.classList.toggle('folded', fold));
}
function uimRail() {
  const tabs = document.querySelector('.side-panel.uim > .panel-tabs'); if (!tabs) return;
  uimEgBuild(); uimHeadBuild();
  const v = state.viewMode || '2D', et = tabs.querySelector('.panel-tab[data-tab="tab-earth"]');
  const earthOK = et && et.style.display !== 'none';   // 主程式依視圖決定 tab-earth 是否可用
  const groups = (typeof VIEW_GROUPS !== 'undefined' && VIEW_GROUPS[v]) || [];
  const cur = uimCurTab();
  const eg = [...tabs.querySelectorAll('.uim-eg')];
  eg.forEach(b => {
    const i = +b.dataset.eg, on = earthOK && groups.includes(i);
    b.classList.toggle('uim-off', !on); b.style.display = '';
    b.classList.toggle('active', on && cur === 'tab-earth' && typeof earthGrp !== 'undefined' && earthGrp === i);
  });
  const others = [...tabs.querySelectorAll('.panel-tab:not(.uim-eg)')].some(t => t !== et && t.style.display !== 'none');
  const sep = document.getElementById('uimSep0'); if (sep) sep.classList.add('uim-off');   // 分隔線暫不顯示（9 個圖示同一欄較整齊）
  // 標題列
  const ht = document.getElementById('uimHeadT');
  if (ht) {
    let name = '';
    if (cur === 'tab-earth' && typeof EARTH_GROUPS !== 'undefined' && EARTH_GROUPS[earthGrp]) name = EARTH_GROUPS[earthGrp].name;
    else { const L = UIM_TABS[cur]; name = L ? L[1] : (cur === 'tab-earth' ? '縱橫斷面' : ''); }
    ht.innerHTML = `${name}<span class="uim-hv">${UIM_VIEWNAME[v] || ''}</span>`;
    const tab = cur && document.getElementById(cur), can = cur === 'tab-earth' || uimFoldCards(tab).length > 1;
    ['uimHOpen', 'uimHFold'].forEach(id => { const b = document.getElementById(id); if (b) b.classList.toggle('uim-off', !can); });
  }
}
// 切頁籤、切子頁籤（含其他程式呼叫，例如點樁號跳到樁號表）時同步圖示欄與標題
{ const _f = switchSideTab; switchSideTab = function () { const r = _f.apply(this, arguments); uimRail(); return r; }; }
if (typeof earthShowGroup === 'function') { const _f = earthShowGroup; earthShowGroup = function () { const r = _f.apply(this, arguments); uimRail(); return r; }; }
