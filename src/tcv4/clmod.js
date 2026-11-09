
/* ============================================================================
   v4.5 階段 C：多中心線（主流＋支流，各自完全獨立）
   - 每條中心線各自擁有：IP、樁號(各自 0K+000 起)、縱斷 VIP／落差、橫斷面設定、結構物、圖面資料框
   - 「目前中心線」決定縱斷面、橫斷面、樁號表、結構物清單；平面圖同時顯示所有中心線（非目前者淡化）
   - 地形（測點、TIN、等高線）共用
   - 支流端點靠近主流時，主流自動加樁「支流○匯入」
   ============================================================================ */
const CL_UI = ['startStationVal', 'regularStaInterval', 'omitNearDist', 'chkGenRegularSta', 'chkGenCurveSta', 'corridorWidth', 'defaultIpRadius',
  'desBaseZ', 'desLongSlope', 'desWidth', 'desBankH', 'desFoundD', 'desBankSlope', 'cutSlope', 'bfDx', 'bfDz', 'bfMaxH', 'bfSlope', 'desSideSlope', 'secExt',
  'pfTitle', 'pfDesignName', 'pfBankH', 'pfFoundD', 'pfRvTL', 'pfRvTR', 'pfRvBL', 'pfRvBR', 'pfOffL', 'pfOffR', 'pfSideManual', 'pfNotes', 'pfRanges', 'pfSpeed'];
const CL_CONF_TOL = 60;          // 支流端點距主流中心線在此距離內 → 判定為匯流 (m)
state.cls = [{ id: 'C0', name: '主流', d: null }]; state.clCur = 0;
let ST_NOPK = false, CL_IN = false;
const clEl = id => document.getElementById(id);
const clMulti = () => !!(state.cls && state.cls.length > 1);
function clName(i) { const c = state.cls[i === undefined ? state.clCur : i]; return c ? c.name : ''; }
function stNm(st) { return (clMulti() && state.clCur > 0 ? clName() + ' ' : '') + st.name; }   // 支流的結構物在標準圖／DXF 標題前加中心線名稱

function clGrab() {   // 目前中心線的即時資料（直接取用物件參照）
  const ui = {}; CL_UI.forEach(id => { const el = clEl(id); if (el) ui[id] = el.type === 'checkbox' ? el.checked : el.value; });
  return { axisNodes: state.axisNodes, customStations: state.customStations, ipTableWorldPos: state.ipTableWorldPos, selectedStaIdx: state.selectedStaIdx, segSelIdx: state.segSelIdx | 0,
    vips: state.profile.vips, drops: state.profile.drops.filter(x => !x.sid), structs: state.structs, structSel: state.structSel, revs: state.revs, rvSel: state.rvSel,
    secParams: state.secParams, splits: state.splits, secGround: state.secGround, secExt: state.secExt, pf: state.pf, ui,
    alignment: state.alignment, sections: state.sections };
}
function clPut(d) {
  state.axisNodes = d.axisNodes || []; state.customStations = d.customStations || []; state.ipTableWorldPos = d.ipTableWorldPos || { x: null, y: null };
  state.selectedStaIdx = d.selectedStaIdx | 0; state.segSelIdx = d.segSelIdx | 0;
  state.profile.vips = d.vips || []; state.profile.drops = (d.drops || []).filter(x => !x.sid);
  state.structs = d.structs || []; state.structSel = state.structs.length ? Math.max(0, Math.min(d.structSel | 0, state.structs.length - 1)) : -1; ST_SIG = '';
  state.revs = d.revs || []; state.rvSel = state.revs.length ? Math.max(0, Math.min(d.rvSel | 0, state.revs.length - 1)) : -1; RV_SIG = '';
  state.secParams = d.secParams || {}; state.splits = d.splits || {}; state.secGround = d.secGround || {}; state.secExt = d.secExt || {};
  state.pf = d.pf; state.pf.lines = state.pf.lines || []; state.pf.sideData = state.pf.sideData || {};
  Object.entries(d.ui || {}).forEach(([id, v]) => { const el = clEl(id); if (!el) return; if (el.type === 'checkbox') el.checked = !!v; else el.value = v; });
  if (clEl('ribbonDefaultR') && clEl('defaultIpRadius')) clEl('ribbonDefaultR').value = clEl('defaultIpRadius').value;
  state.alignment = d.alignment || { ipList: [], segments: [], totalLength: 0, startSta: 0, endSta: 0 };
  state.sections = d.sections || [];
  state.tempAxisNodes = []; state.draggingIPIdx = -1; state.hoveredIPIdx = -1;
}
function clBlank(name) {
  const ui = {}; CL_UI.forEach(id => { const el = clEl(id); if (el) ui[id] = el.type === 'checkbox' ? el.checked : el.value; });
  ui.startStationVal = '0'; ui.pfNotes = ''; ui.pfRanges = ''; if ('pfTitle' in ui) ui.pfTitle = `縱斷面圖（${name}）`;
  const pf = JSON.parse(JSON.stringify(state.pf)); Object.assign(pf, { sideData: {}, notes: [], ranges: [], lines: [], lnIdx: 0, title: ui.pfTitle || pf.title });
  return { axisNodes: [], customStations: [], ipTableWorldPos: { x: null, y: null }, selectedStaIdx: 0, segSelIdx: 0, vips: [], drops: [], structs: [], structSel: -1, revs: [], rvSel: -1,
    secParams: {}, splits: {}, secGround: {}, secExt: {}, pf, ui };
}
function stCleanArr(arr) { const sv = state.structs; state.structs = arr || []; try { return stClean(); } finally { state.structs = sv; } }
function clSer(d) {
  return { axisNodes: d.axisNodes, customStations: d.customStations, ipTableWorldPos: d.ipTableWorldPos, selectedStaIdx: d.selectedStaIdx, vips: d.vips, drops: (d.drops || []).filter(x => !x.sid),
    structs: stCleanArr(d.structs), revs: rvCleanArr(d.revs), secParams: d.secParams, splits: d.splits, secGround: d.secGround, secExt: d.secExt, pf: d.pf, ui: d.ui };
}
function clDeser(o) {
  o = o || {}; const pf = JSON.parse(JSON.stringify(state.pf)); Object.assign(pf, o.pf || {}); pf.sideData = (o.pf && o.pf.sideData) || {}; pf.lines = pf.lines || [];
  const structs = (o.structs || []).map(stNorm), revs = o.revs ? o.revs.map(rvNorm) : rvMigrateFrom(o.ui);
  return { axisNodes: o.axisNodes || [], customStations: o.customStations || [], ipTableWorldPos: o.ipTableWorldPos || { x: null, y: null }, selectedStaIdx: o.selectedStaIdx | 0, segSelIdx: 0,
    vips: o.vips || [], drops: (o.drops || []).filter(x => !x.sid), structs, structSel: structs.length ? 0 : -1, revs, rvSel: revs.length ? 0 : -1, secParams: o.secParams || {}, splits: o.splits || {}, secGround: o.secGround || {}, secExt: o.secExt || {}, pf, ui: o.ui || {} };
}
function clSettle() { for (let k = 0; k < 6 && ST_BUSY; k++) { ST_BUSY = false; rebuildAlignmentAndSections(); } }   // 結構物 r1 自動等迭代：同步做完（切換／匯出時）
function clSwitch(i, o) {
  o = o || {}; i = +i;
  if (!state.cls[i] || i === state.clCur) { clUI(); return; }
  state.cls[state.clCur].d = clGrab();
  const d = state.cls[i].d || clBlank(state.cls[i].name);
  state.clCur = i; state.cls[i].d = null;
  clPut(d);
  if (!o.keepUndo) state.undoStack = [];
  if (!o.silent && state.cams) ['PROFILE', 'CROSS'].forEach(k => { const c = state.cams[k]; if (c) { c.k = 1; c.tx = 0; c.ty = 0; } });
  const sel = d.selectedStaIdx | 0;
  updateCustomStationListUI();
  rebuildAlignmentAndSections(); clSettle();
  state.selectedStaIdx = Math.max(0, Math.min(sel, state.sections.length - 1));
  if (typeof lnRefresh === 'function') lnRefresh();
  renderStationMileageTable(); renderProfileUI();
  const ss = clEl('stationSelect'); if (ss && state.sections.length) ss.value = state.selectedStaIdx;
  if (state.viewMode === 'CROSS' && typeof syncCrossEdit === 'function') syncCrossEdit();
  ST_SIG = ''; stRenderUI(); clUI(); requestRedraw();
  if (!o.silent) { const al = state.alignment; updateStatus(`🔀 目前中心線：${clName()}` + (al.segments.length ? `（長 ${al.totalLength.toFixed(2)} m，${formatStation(al.startSta)}～${formatStation(al.endSta)}，結構物 ${state.structs.length} 座）` : '（尚未繪製中心線：請用「繪中心線」點選 BP→IP→EP）') + '。縱斷面、橫斷面、樁號表、結構物清單已切換到這條線。'); }
}
function clEach(fn) {   // 依序切到每一條中心線執行 fn(i)，最後切回原本那條（不清除復原紀錄）
  const cur = state.clCur, n = state.cls.length;
  if (n < 2) { fn(0); return; }
  try { for (let i = 0; i < n; i++) { clSwitch(i, { silent: true, keepUndo: true }); fn(i); } }
  finally { clSwitch(cur, { silent: true, keepUndo: true }); }
}
function clWarmAll() { if (clMulti()) clEach(() => {}); }

/* ---- 匯流：支流 BP/EP 中最靠近主流者，距離 ≤ CL_CONF_TOL → 主流加樁「支流○匯入」 ---- */
function clConfluences() {
  if (state.clCur !== 0 || !state.cls) return false;
  const al = state.alignment, add = [];
  if (al.segments && al.segments.length && state.cls.length > 1) {
    const step = Math.max(0.25, al.totalLength / 4000), P = [];
    for (let s = al.startSta; s <= al.endSta + 1e-6; s += step) { const q = Math.min(s, al.endSta), g = getPointAndNormalAtStation(q); if (g) P.push([g.x, g.y, q]); }
    state.cls.forEach((c, i) => {
      c.conf = null; c.confNear = null; if (!i || !c.d) return; const N = c.d.axisNodes || []; if (N.length < 2) return;
      let best = null;
      [N[0], N[N.length - 1]].forEach((e, k) => P.forEach(p => { const dd = Math.hypot(p[0] - e.x, p[1] - e.y); if (!best || dd < best.d) best = { d: dd, s: p[2], end: k ? 'EP' : 'BP' }; }));
      c.confNear = best;
      if (best && best.d <= CL_CONF_TOL) { c.conf = best; add.push({ s: +best.s.toFixed(3), name: `${c.name}匯入`, cf: c.id }); }
    });
  }
  const old = JSON.stringify(state.customStations.filter(c => c.cf).map(c => [c.s, c.name, c.cf]));
  state.customStations = state.customStations.filter(c => !c.cf).concat(add).sort((a, b) => a.s - b.s);
  return old !== JSON.stringify(add.map(c => [c.s, c.name, c.cf]));
}

/* ---- 既有函式包裝：重建、專案存讀 ---- */
{
  const _rb = rebuildAlignmentAndSections;
  rebuildAlignmentAndSections = function () {
    _rb.apply(this, arguments);
    if (CL_IN || !state.cls) return;
    CL_IN = true;
    try {
      let again = false;
      if (state.clCur === 0 && clConfluences()) { updateCustomStationListUI(); again = true; }
      const c = state.cls[state.clCur], secs = state.sections;
      if (c && c.needBase && secs.length >= 2 && !state.profile.vips.length) {   // 新支流第一次有中心線：設計基準高程／縱坡取自地面
        const za = secInterp(secs[0], 0, 'groundZ'), zb = secInterp(secs[secs.length - 1], 0, 'groundZ'), L = secs[secs.length - 1].sta - secs[0].sta;
        c.needBase = false;
        if (Number.isFinite(za)) { clEl('desBaseZ').value = za.toFixed(2); if (Number.isFinite(zb) && L > 1) clEl('desLongSlope').value = ((zb - za) / L * 100).toFixed(2); again = true;
          updateStatus(`ℹ️ 「${c.name}」設計基準高程取 BP 地面 ${za.toFixed(2)}、縱坡取 BP→EP 地面平均坡度；可於縱坡設計修改或加 VIP。`); }
      }
      if (again) _rb.apply(this, arguments);
    } finally { CL_IN = false; }
    clUI();
  };
  const _cp = collectProject;
  collectProject = function () {
    const o = _cp();
    o.version = 'v6.3'; o.data.tcPrio = state.tcPrio || {}; o.data.rvCatShow = state.rvCatShow; o.data.crossCrop = state.crossCrop;
    if (clMulti()) { const live = clGrab(); o.data.cls = state.cls.map((c, i) => ({ id: c.id, name: c.name, d: clSer(i === state.clCur ? live : c.d) })); o.data.clCur = state.clCur; }
    else o.data.cls = [{ id: state.cls[0].id, name: state.cls[0].name }];
    return o;
  };
  const _ap = applyProject;
  applyProject = function (obj, fname) {
    state.cls = [{ id: 'C0', name: '主流', d: null }]; state.clCur = 0;
    const D = (obj && obj.data) || {};
    if (Array.isArray(D.cls) && D.cls.length > 1) {   // 先把目前中心線放在 0 號以外的位置也沒關係：頂層資料＝目前中心線
      const cur = Math.max(0, Math.min(D.cls.length - 1, D.clCur | 0));
      state.cls = D.cls.map((c, i) => ({ id: c.id || ('C' + i), name: c.name || (i ? '支流' + i : '主流'), d: null })); state.clCur = cur;
    } else if (Array.isArray(D.cls) && D.cls[0] && D.cls[0].name) state.cls[0].name = D.cls[0].name;
    state.tcPrio = D.tcPrio && typeof D.tcPrio === 'object' ? D.tcPrio : {}; state.rvCatShow = Object.assign({ rev: true, wall: true }, D.rvCatShow || {}); RV_ZDIRTY = true; state.crossCrop = Object.assign({ on: true, m: 10 }, D.crossCrop || {}); crossCropUI();
    _ap(obj, fname);
    if (!D.revs) { state.revs = rvMigrateFrom({ pfBankH: clEl('pfBankH').value, pfFoundD: clEl('pfFoundD').value, desBankSlope: clEl('desBankSlope').value, bfDx: clEl('bfDx').value, bfDz: clEl('bfDz').value }); state.rvSel = state.revs.length ? 0 : -1; RV_SIG = ''; if (state.revs.length) setTimeout(() => { rebuildAlignmentAndSections(); updateStatus('ℹ 舊專案：全線護岸斷面樣板已轉成「兩岸各一段全線護岸」（頂寬 0、預留沉陷沿用舊護岸頂斜線）；逐樁護岸高 HL/HR 的手動值不再使用，請於「護岸」卡片改以加高區段設定。'); }, 0); }
    if (Array.isArray(D.cls) && D.cls.length > 1) {
      D.cls.forEach((c, i) => { if (i !== state.clCur) state.cls[i].d = clDeser(c.d); });
      clWarmAll();
      if (state.clCur !== 0) { /* 主流匯流樁號：暖機時已於主流計算 */ }
      updateStatus(`📥 已載入專案「${fname}」：中心線 ${state.cls.length} 條（${state.cls.map(c => c.name).join('、')}），目前為「${clName()}」。`);
    }
    clUI();
  };
}

/* ---- 平面圖：非目前中心線（淡化）＋各中心線名稱 ---- */
function clDrawOthers() {
  if (!clMulti() || state.viewMode !== '2D') return;
  const sv = { al: state.alignment, sec: state.sections, sts: state.structs, sel: state.structSel, rv: state.revs, rvs: state.rvSel };
  state.cls.forEach((c, i) => {
    if (i === state.clCur || !c.d || !c.d.alignment || !c.d.alignment.segments || !c.d.alignment.segments.length) return;
    ctx.save(); ctx.globalAlpha = 0.55;
    try {
      state.alignment = c.d.alignment; state.sections = c.d.sections || []; state.structs = c.d.structs || []; state.structSel = -1; state.revs = c.d.revs || []; state.rvSel = -1; ST_NOPK = true;
      const al = state.alignment, step = Math.max(0.5, al.totalLength / 800);
      ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 1; ctx.beginPath();
      state.sections.forEach(sec => { if (sec.lx === undefined) return; const a = worldToScreen2D(sec.lx, sec.ly), b = worldToScreen2D(sec.rx, sec.ry); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); });
      ctx.stroke();
      ctx.strokeStyle = '#ff2a2a'; ctx.lineWidth = 2.2; ctx.setLineDash([12, 5]); ctx.beginPath();
      for (let s = al.startSta, k = 0; s <= al.endSta + 1e-6; s += step, k++) { const g = getPointAndNormalAtStation(Math.min(s, al.endSta)); if (!g) continue; const p = worldToScreen2D(g.x, g.y); k ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y); }
      ctx.stroke(); ctx.setLineDash([]);
      stDrawPlan(); rvDrawPlan();
    } catch (e) { console.error('clDrawOthers', e); }
    finally { state.alignment = sv.al; state.sections = sv.sec; state.structs = sv.sts; state.structSel = sv.sel; state.revs = sv.rv; state.rvSel = sv.rvs; ST_NOPK = false; ctx.restore(); }
    clLabel(c.d.alignment, c.name, false);
  });
  clLabel(state.alignment, clName(), true);
}
function clLabel(al, name, cur) {   // 中心線名稱：標於 BP 旁
  if (!al || !al.ipList || al.ipList.length < 2) return;
  const a = al.ipList[0], b = al.ipList[1], P = worldToScreen2D(a.x, a.y), Q = worldToScreen2D(b.x, b.y), dx = P.x - Q.x, dy = P.y - Q.y, d = Math.hypot(dx, dy) || 1;
  const x = P.x + dx / d * 40, y = P.y + dy / d * 40, t = name + (cur ? '（目前）' : '');
  ctx.save(); ctx.font = 'bold 13px "Noto Sans TC"'; const w = ctx.measureText(t).width;
  ctx.fillStyle = cur ? 'rgba(127,29,29,.85)' : 'rgba(30,41,59,.75)'; ctx.fillRect(x - w / 2 - 5, y - 10, w + 10, 20);
  ctx.strokeStyle = cur ? '#ff2a2a' : '#94a3b8'; ctx.lineWidth = 1; ctx.strokeRect(x - w / 2 - 5, y - 10, w + 10, 20);
  ctx.fillStyle = cur ? '#ffffff' : '#cbd5e1'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(t, x, y); ctx.restore();
}

/* ---- 介面：頂部「中心線」選單＋平面工具頁「中心線」卡片 ---- */
function clInfo(i) {
  const d = i === state.clCur ? { alignment: state.alignment, structs: state.structs } : (state.cls[i].d || {});
  const al = d.alignment; return { len: al && al.segments && al.segments.length ? al.totalLength : 0, s0: al ? al.startSta : 0, s1: al ? al.endSta : 0, nSt: (d.structs || []).length, drawn: !!(al && al.segments && al.segments.length) };
}
function clUI() {
  const sel = clEl('clSel');
  if (sel) { const h = state.cls.map((c, i) => `<option value="${i}"${i === state.clCur ? ' selected' : ''}>${escAttr(c.name)}</option>`).join(''); if (sel.innerHTML !== h) sel.innerHTML = h; sel.value = state.clCur; }
  const bd = clEl('clBadge'); if (bd) bd.textContent = `${state.cls.length} 條・目前：${clName()}`;
  const box = clEl('clBox'); if (!box) return;
  if (box.contains(document.activeElement) && document.activeElement.tagName === 'INPUT') return;   // 正在改名時不重繪
  const rows = state.cls.map((c, i) => {
    const f = clInfo(i), cur = i === state.clCur;
    return `<tr onclick="clSwitch(${i})" style="cursor:pointer;${cur ? 'background:rgba(185,28,28,.10);' : ''}" title="${cur ? '目前中心線' : '點選切換到這條中心線'}">
      <td style="text-align:center;color:${cur ? '#b91c1c' : 'var(--text-muted)'};">${cur ? '●' : '○'}</td>
      <td><input class="input-text" style="width:62px;" value="${escAttr(c.name)}" onclick="event.stopPropagation()" onchange="clRename(${i},this.value)"></td>
      <td style="text-align:right;">${f.drawn ? f.len.toFixed(1) : '—'}</td><td style="font-size:10.5px;" title="${f.drawn ? formatStation(f.s0) + '～' + formatStation(f.s1) : ''}">${f.drawn ? formatStation(f.s1) : '未繪製'}</td>
      <td style="text-align:center;">${f.nSt}</td>
      <td>${i ? `<button class="btn" style="padding:1px 6px;" onclick="event.stopPropagation();clDel(${i})" title="刪除這條支流">✕</button>` : ''}</td></tr>`;
  }).join('');
  const conf = state.cls.slice(1).map(c => {
    const near = c.confNear, N = (c === state.cls[state.clCur] ? state.axisNodes : (c.d && c.d.axisNodes)) || [];
    if (N.length < 2) return `<div>・${escAttr(c.name)}：尚未繪製中心線</div>`;
    if (!near) return `<div>・${escAttr(c.name)}：切換到主流時判定匯流樁號</div>`;
    return c.conf ? `<div>・${escAttr(c.name)}：${near.end} 匯入主流 <b style="color:#b91c1c;">${formatStation(near.s)}</b>（端點距主流 ${near.d.toFixed(1)} m，主流已自動加樁）</div>`
      : `<div>・${escAttr(c.name)}：端點距主流最近 ${near.d.toFixed(1)} m（> ${CL_CONF_TOL} m），未判定匯流</div>`;
  }).join('');
  box.innerHTML = `<div class="pt-table-wrap" style="max-height:170px;margin-top:4px;"><table class="pt-table"><thead><tr><th></th><th>名稱</th><th>長度(m)</th><th>終點樁號</th><th>結構物</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>
    <div class="clbtns"><button class="btn primary" onclick="clAdd()" title="新增一條獨立的支流中心線，並直接進入繪製模式（BP→IP→EP）">＋ 新增支流並繪製</button><button class="btn" onclick="clRedraw()" title="重新繪製目前中心線（原 IP 會被取代）">重繪目前中心線</button></div>
    <div class="clbtns"><button class="btn amber" onclick="aclStart()" title="在平面圖點起點、迄點，依溪流附近平均低點自動產生建議中心線（虛線），確認後才套用；地形資料不足處以周圍高程平均補值">🧭 自動建議中心線</button><button class="btn" onclick="dzPickAxis()" title="在平面圖點選已匯入 DXF 的一條聚合線（LWPOLYLINE／POLYLINE），其頂點依序轉成目前中心線的 BP→IP…→EP（曲線半徑先設 0，之後可逐點改）">📐 由 DXF 線轉中心線</button><button class="btn" onclick="dzAxisReverse()" title="BP、EP 對調，樁號改由另一端起算（已放置的結構物、護岸樁號不會跟著換算）">⇄ 反轉方向</button><label style="display:flex;align-items:center;gap:4px;font-size:11px;cursor:pointer;" title="繪中心線時，游標靠近 DXF 線頂點、測點或既有 IP（10 像素內）自動吸附；按住 Alt 暫時取消"><input type="checkbox" ${state.dzSnap !== false ? 'checked' : ''} onchange="state.dzSnap=this.checked"> 繪線鎖點</label></div>
    <div id="aclBox"></div>
    <div style="font-size:10.5px;color:var(--text-muted);line-height:1.5;margin-top:3px;">繪中心線時按 <b>Backspace</b> 或 <b>Ctrl+Z</b> 退回上一點；Esc 取消。</div>
    <div style="font-size:10.5px;color:var(--text-muted);line-height:1.6;margin-top:5px;">每條中心線各自擁有 IP、樁號（各自 0K+000 起算）、縱斷設計、橫斷面與結構物；地形共用。平面圖淡化顯示其他中心線。${conf ? '<div style="margin-top:3px;color:var(--text-main,#111);">' + conf + '</div>' : ''}</div>`;
}
function clRename(i, v) {
  const c = state.cls[i]; if (!c) return; v = String(v || '').trim() || c.name;
  if (state.cls.some((q, k) => k !== i && q.name === v)) { alert(`已有名稱「${v}」的中心線，請換一個名稱。`); clUI(); return; }
  c.name = v;
  if (i && c.d && c.d.ui && /^縱斷面圖（.*）$/.test(c.d.ui.pfTitle || '')) { c.d.ui.pfTitle = `縱斷面圖（${v}）`; if (c.d.pf) c.d.pf.title = c.d.ui.pfTitle; }
  if (state.clCur === 0) rebuildAlignmentAndSections(); clUI(); requestRedraw();
}
function clAdd() {
  let k = 1; while (state.cls.some(c => c.name === '支流' + k)) k++;
  const name = '支流' + k, id = 'C' + Date.now().toString(36);
  state.cls.push({ id, name, d: null, needBase: true });
  clSwitch(state.cls.length - 1);
  if (state.viewMode !== '2D') setViewMode('2D');
  setTool('DRAW_AXIS');
  updateStatus(`➕ 已新增「${name}」（獨立中心線）。請在平面圖依序點選 BP → IP… → EP，按右鍵／Enter／雙擊結束；完成後端點若靠近主流，主流會自動加樁「${name}匯入」。`);
}
function clRedraw() { if (state.viewMode !== '2D') setViewMode('2D'); setTool('DRAW_AXIS'); updateStatus(`📏 重繪「${clName()}」中心線：依序點選 BP → IP… → EP，完成後取代原中心線。`); }
function clDel(i) {
  const c = state.cls[i]; if (!i || !c) return;
  const n = i === state.clCur ? state.structs.length : ((c.d && c.d.structs) || []).length;
  if (!confirm(`刪除「${c.name}」？\n其中心線、縱斷設計、橫斷面設定${n ? `與 ${n} 座結構物` : ''}都會一併刪除，且無法復原。`)) return;
  if (i === state.clCur) clSwitch(0);
  state.cls.splice(i, 1); if (state.clCur > i) state.clCur--;
  if (state.clCur === 0) rebuildAlignmentAndSections();
  clUI(); requestRedraw(); updateStatus(`🗑 已刪除「${c.name}」。`);
}
function clInitUI() {
  // 頂部：中心線選單（緊接在四個視圖按鍵之後）
  const v2 = clEl('btnView2D'), grp = v2 && v2.closest('.toolbar-group');
  if (grp && !clEl('clGroup')) {
    const g = document.createElement('div'); g.className = 'toolbar-group'; g.id = 'clGroup';
    g.innerHTML = '<span style="font-size:12px;font-weight:700;">中心線</span><select class="input-select" id="clSel" style="min-width:96px;" onchange="clSwitch(this.value)" title="目前中心線：縱斷面、橫斷面、樁號表、結構物清單都跟著切換"></select>';
    grp.parentNode.insertBefore(g, grp.nextSibling);
  }
  // 匯出群組：數量表 Excel
  const dx = [...document.querySelectorAll('button')].find(b => /exportFullDXF\(\)/.test(b.getAttribute('onclick') || ''));
  if (dx && !clEl('btnXlsx')) { const b = document.createElement('button'); b.className = 'btn'; b.id = 'btnXlsx'; b.textContent = '匯出數量表(.xlsx)'; b.title = '結構物數量表（Excel）：總表、數量明細、開挖剖面、壩體分段，每類一個工作表；包含全部中心線'; b.onclick = () => stExportXlsx(); dx.parentNode.insertBefore(b, dx); }
  // 平面工具頁：中心線卡片（放在「平面工具」之後）
  const align = clEl('tab-align');
  if (align && !clEl('clCard')) {
    const card = document.createElement('div'); card.className = 'sec-card'; card.id = 'clCard';
    card.innerHTML = '<div class="sec-title"><span>中心線（主流／支流）</span><span class="badge-pill" id="clBadge"></span></div><div id="clBox"></div>';
    const pt = clEl('planToolsCard'); align.insertBefore(card, pt ? pt.nextSibling : align.firstChild);
  }
  // 平面工具按鍵：兩欄對齊排列，R 與「純折線」合為一格
  const tools = clEl('planToolsGroup');
  if (tools && !clEl('ptRgrp')) {
    tools.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:6px;border:none;padding:0;background:transparent;align-items:stretch;';
    const r = clEl('ribbonDefaultR'), lab = r && r.previousElementSibling, flat = [...tools.querySelectorAll('button')].find(b => /setAllIPRadius\(0\)/.test(b.getAttribute('onclick') || ''));
    const rg = document.createElement('div'); rg.id = 'ptRgrp'; rg.title = '新 IP 的預設圓曲線半徑；「純折線」＝全部 IP 改 R=0';
    if (lab && lab.tagName === 'SPAN') rg.appendChild(lab); if (r) rg.appendChild(r); if (flat) rg.appendChild(flat);
    tools.appendChild(rg);
    [...tools.querySelectorAll(':scope > button')].forEach(b => b.classList.add('ptbtn'));
  }
  clUI();
}
/* ---- 左側各頁籤圖卡：手風琴摺疊（同時展開一張；Ctrl/Shift 點標題可多開） ---- */
function clAccInit() {
  ['tab-data', 'tab-align', 'tab-tin'].forEach(tid => {
    const tab = clEl(tid); if (!tab) return;
    const cards = [...tab.children].filter(e => e.classList.contains('sec-card'));
    let opened = false;
    cards.forEach(c => {
      const t = c.querySelector(':scope > .sec-title'); if (!t || c.classList.contains('acc')) return;
      c.classList.add('acc');
      if (c.dataset.views) { /* 只在特定視圖出現的卡片（3D 顯示）預設展開 */ }
      else c.classList.add('folded');   // v6.3：所有卡片預設收合
      t.title = t.title || '點擊展開／收合（Ctrl 或 Shift＋點擊可同時展開多張）';
      t.addEventListener('click', e => { if (e.target.closest('button, input, select, a, textarea')) return; clAccToggle(tab, c, e.ctrlKey || e.shiftKey || e.metaKey); });
    });
  });
}
function clAccToggle(tab, card, multi) {
  const f = card.classList.contains('folded');
  if (f && !multi) [...tab.children].forEach(c => { if (c !== card && c.classList.contains('acc') && !c.dataset.views) c.classList.add('folded'); });
  card.classList.toggle('folded', !f);
}
function clAccOpen(id) { const c = clEl(id); if (!c || !c.classList.contains('folded')) return; clAccToggle(c.parentNode, c, false); }
(function () {
  const s = document.createElement('style');
  s.textContent = `
  .side-panel .panel-body > .sec-card.acc > .sec-title { cursor:pointer; user-select:none; }
  .side-panel .panel-body > .sec-card.acc > .sec-title > span:first-child::before { content:'▾ '; color:var(--text-muted); }
  .side-panel .panel-body > .sec-card.acc.folded > .sec-title > span:first-child::before { content:'▸ '; }
  .side-panel .panel-body > .sec-card.acc.folded > .sec-title { margin-bottom:0; }
  .side-panel .panel-body > .sec-card.acc.folded > :not(.sec-title) { display:none !important; }
  #planToolsGroup > button.ptbtn { width:100%; justify-content:center; text-align:center; margin:0; }
  #ptRgrp { display:flex; align-items:center; gap:4px; border:1px solid var(--border-dim); border-radius:4px; padding:2px 4px; }
  #ptRgrp > input { width:46px !important; }
  #ptRgrp > button { flex:1; margin:0; }
  .clbtns { display:grid; grid-template-columns:1fr 1fr; gap:6px; margin-top:6px; }
  .clbtns > button { width:100%; margin:0; }
  #clGroup select { font-weight:700; }
  .stlr { display:grid; grid-template-columns:minmax(0,1fr) 84px 84px; gap:3px 6px; align-items:center; margin-top:3px; }
  .stlr-h { font-weight:700; font-size:11px; color:#0369a1; text-align:center; border-bottom:1px solid var(--border-dim); padding-bottom:2px; }
  .stlr-h0 { border-bottom:1px solid var(--border-dim); }
  .stlr-one { grid-column:2 / span 2; justify-content:flex-start; padding-left:11px; }
  .stlr-l { font-size:10.5px; color:var(--text-muted); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; cursor:help; }
  .stlr-c { display:flex; justify-content:center; }
  .stlab.stin { justify-content:center; padding:0; gap:2px; }
  .sthere { display:flex; flex-wrap:wrap; gap:4px; align-items:center; margin-top:6px; padding:5px 6px; border:1px solid #fdba74; background:rgba(251,146,60,.08); border-radius:4px; }
  .sthere-t { font-size:11px; font-weight:700; color:#c2410c; margin-right:4px; cursor:help; }
  .sthere .btn { padding:2px 8px; font-size:11px; }
  .sthere .btn.on { background:#c2410c; color:#fff; border-color:#c2410c; }
  `;
  document.head.appendChild(s);
})();
window.addEventListener('load', () => setTimeout(() => { clInitUI(); clAccInit(); }, 0));

/* ---- DXF：所有中心線一次輸出（平面合併；IP 表／縱斷面往下排；橫斷面、標準圖各中心線一欄） ---- */
function buildFullDXF() {   // v6.5：參數 opt.only＝只輸出部分（plan／ip／deco／index／prof／qty／sec／std），opt.hook(D, bb) 於 build 前呼叫（出圖包用）；不帶參數＝全圖
  const opt = arguments[0], W = k => !opt || !opt.only || opt.only.includes(k);
  const D = makeDXFWriter(), bb = { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity };
  const ext = (x, y) => { if (isFinite(x) && isFinite(y)) { bb.x0 = Math.min(bb.x0, x); bb.y0 = Math.min(bb.y0, y); bb.x1 = Math.max(bb.x1, x); bb.y1 = Math.max(bb.y1, y); } };
  state.contoursMinor.forEach(s => { ext(s.x1, s.y1); ext(s.x2, s.y2); }); state.contoursMajor.forEach(s => { ext(s.x1, s.y1); ext(s.x2, s.y2); });
  state.points.forEach(p => ext(p.x, p.y));
  state.cls.forEach((c, i) => ((i === state.clCur ? state.axisNodes : (c.d && c.d.axisNodes)) || []).forEach(n => ext(n.x, n.y)));
  if (!isFinite(bb.x0)) { bb.x0 = 0; bb.y0 = 0; bb.x1 = 100; bb.y1 = 100; }
  if (W('plan')) {
  for (const s of state.contoursMinor) D.line(s.x1, s.y1, s.z, s.x2, s.y2, s.z, 'CONT1', 4);
  for (const s of state.contoursMajor) D.line(s.x1, s.y1, s.z, s.x2, s.y2, s.z, 'CONT5', 2);
  D.lock('CONT1'); D.lock('CONT5');
  }
  const multi = clMulti(), infos = [];
  let belowY = bb.y0 - 40, secX = bb.x1 + 100, stdX = bb.x0 - 60;
  clEach(li => {
    const nm = clName(li), sfx = li ? '_' + li : '', tag = multi ? `（${nm}）` : '', align = state.alignment;
    if (align.segments.length > 0) {
      if (W('plan')) {
      D.beginBlock('PLAN_ALIGNMENT' + sfx);
      D.poly(state.axisNodes.map(n => [n.x, n.y]), 'IP_TANGENTS', 30);
      const centerPts = [], leftEdgePts = [], rightEdgePts = [];
      const halfRoadW = (parseFloat(clEl('corridorWidth').value) || 14.0) / 2, step = Math.max(1.0, align.totalLength / 240);
      for (let s = align.startSta; s <= align.endSta + 1e-4; s += step) {
        const g = getPointAndNormalAtStation(Math.min(s, align.endSta)); if (!g) continue;
        centerPts.push([g.x, g.y]); leftEdgePts.push([g.x - g.nx * halfRoadW, g.y - g.ny * halfRoadW]); rightEdgePts.push([g.x + g.nx * halfRoadW, g.y + g.ny * halfRoadW]);
      }
      { const g = getPointAndNormalAtStation(align.endSta); if (g) centerPts.push([g.x, g.y]); }
      D.poly(centerPts, 'CENTERLINE_CURVE', 1);
      D.poly(leftEdgePts, 'ROAD_EDGE', 5); D.poly(rightEdgePts, 'ROAD_EDGE', 5);
      for (const sec of state.sections) D.line(sec.lx, sec.ly, 0, sec.rx, sec.ry, 0, 'CROSS_STATIONS', sec.ptName ? 6 : 2);
      const thL = Math.max(1.6, Math.min(6, Math.max(bb.x1 - bb.x0, bb.y1 - bb.y0) / 220)), cwL = thL * 0.62;
      layoutStationLabelsWorld(state.sections.map(s => ({ sec: s, prio: s.ptName ? 2 : 1 })), thL, cwL, s => s.staLabel).forEach(L => {
        const sec = L.sec, col = sec.ptName ? 6 : 2;
        D.line(sec.cx, sec.cy, 0, sec.cx + L.ux * L.len, sec.cy + L.uy * L.len, 0, 'STA_LEADER', col);
        const ex = L.flip ? -L.ux : L.ux, ey = L.flip ? -L.uy : L.uy, tx = sec.cx + L.ux * (L.len + thL * 0.4), ty = sec.cy + L.uy * (L.len + thL * 0.4);
        D.text(tx, ty, thL, L.text, 'STA_TEXT', col, { rot: Math.atan2(ey, ex) * 180 / Math.PI, align: L.flip ? 'r' : 'l', valign: 'm' });
      });
      if (multi && align.ipList.length > 1) {   // 中心線名稱：標於 BP 外側
        const a = align.ipList[0], b = align.ipList[1], dx = a.x - b.x, dy = a.y - b.y, d = Math.hypot(dx, dy) || 1;
        D.text(a.x + dx / d * thL * 4, a.y + dy / d * thL * 4, thL * 1.5, nm, 'CL_NAME', 1, { align: 'c', valign: 'm' });
      }
      D.endBlock(); D.insert('PLAN_ALIGNMENT' + sfx);
      stDxfPlan(D); rvDxfPlan(D); dzDxfPlan(D);
      }
      // IP 資料曲線表
      const tx0 = bb.x0, ty0 = belowY, colW = 18.0, rowH = 4.2;
      const rowLabels = ['編號', 'N 縱坐標', 'E 橫坐標', '偏角 θ', '距離 D', '半徑 R', '切線長 TL', '曲線長 CL', '矢距 SL', 'BC 樁號', 'MC 樁號', 'EC 樁號'];
      const totalW = (align.ipList.length + 1) * colW, totalH = (rowLabels.length + 1) * rowH;
      if (W('ip')) {
      D.beginBlock('IP_TABLE' + sfx);
      D.poly([[tx0, ty0], [tx0 + totalW, ty0], [tx0 + totalW, ty0 - totalH], [tx0, ty0 - totalH]], 'IP_TABLE', 5, 0, true);
      D.text(tx0 + totalW * 0.32, ty0 - rowH * 0.75, 2.0, 'IP 資料曲線表' + tag, 'IP_TABLE_TEXT', 4);
      for (let r = 0; r < rowLabels.length; r++) { const ry = ty0 - (r + 1) * rowH; D.line(tx0, ry, 0, tx0 + totalW, ry, 0, 'IP_TABLE', 5); D.text(tx0 + 1.2, ry - rowH * 0.72, 1.35, rowLabels[r], 'IP_TABLE_TEXT', 4); }
      align.ipList.forEach((ip, c) => {
        const cx = tx0 + (c + 1) * colW, isEnd = (c === 0 || c === align.ipList.length - 1);
        D.line(cx, ty0 - rowH, 0, cx, ty0 - totalH, 0, 'IP_TABLE', 5);
        const vals = [ip.label, ip.y.toFixed(3), ip.x.toFixed(3), c === align.ipList.length - 1 ? '0' : ip.deflDMS, c === align.ipList.length - 1 ? '0' : ip.distToNext.toFixed(3),
          isEnd ? '0' : ip.r.toFixed(3), isEnd ? '0' : ip.tl.toFixed(3), isEnd ? '0' : ip.cl.toFixed(3), isEnd ? '0' : ip.sl.toFixed(3),
          isEnd ? '-' : formatStation(ip.bcSta), formatStation(ip.mcSta), isEnd ? '-' : formatStation(ip.ecSta)];
        vals.forEach((v, r) => D.text(cx + 1.5, ty0 - (r + 1) * rowH - rowH * 0.72, 1.35, String(v), 'IP_TABLE_TEXT', r === 0 ? 2 : 7));
      });
      D.endBlock(); D.insert('IP_TABLE' + sfx);
      }
      belowY = ty0 - totalH - 60;
    }
    // 縱斷面：往下排
    D.sub(); if (W('prof')) dxfProfile(D, bb.x0, belowY); const pb = D.subEnd(); if (pb) belowY = pb.y0 - 60;
    // 數量表＋橫斷面：各中心線一欄，往右排
    D.sub(); if (W('qty')) stDxfQty(D, secX, bb.y1 + 20); if (W('sec')) dxfSections(D, secX, bb.y1); const sb = D.subEnd();
    if (sb && multi) D.text(secX, sb.y1 + 12, 6, `${nm}　橫斷面設計圖`, 'CL_NAME', 1);
    if (sb) secX = sb.x1 + 80;
    // 標準圖：各中心線一欄，往左排
    D.sub(); if (W('std')) { const yy = stDxfStdAll(D, stdX, bb.y1); rvDxfStdAll(D, stdX, yy === undefined ? bb.y1 : yy); } const tb = D.subEnd();
    if (tb && multi) D.text(tb.x0, tb.y1 + 12, 6, `${nm}　結構物標準圖`, 'CL_NAME', 1);
    if (tb) stdX = tb.x0 - 60;
    const secs = state.sections;
    infos.push({ name: nm, nSec: secs.length, s0: secs.length ? secs[0].sta : 0, s1: secs.length ? secs[secs.length - 1].sta : 0, hasPf: secs.length >= 2,
      sts: state.structs.filter(s => s._q).flatMap(s => [`${stNm(s)}（${stAbbr(s)}，${formatStation(s.sta)}）標準圖：平面／立面／各變化段剖面／數量`].concat(stAccList(s).map(k => `${stAccName(s, k)}（${stAccLabel(s, k)}，附屬於 ${s.name}）標準圖：平面／順水流剖面／橫斷面／數量`))).concat(state.revs.filter(r => r._q).map(r => `${rvName(r)}（${formatStation(rvLim(r).a)}～${formatStation(rvLim(r).b)}，實長 ${rvF(r._q.lenB, 1)} m）標準圖：典型斷面／數量`)) });
  });
  if (W('deco')) stDxfPlanDeco(D, bb);
  if (W('index')) stDxfIndex(D, bb, infos);
  if (opt && opt.hook) opt.hook(D, bb, infos);
  return D.build();
}

/* ---- 結構物數量表 Excel（.xlsx）：總表／數量明細／開挖剖面／壩體分段，各一工作表；含全部中心線 ---- */
const XL_CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
function xlCrc(b) { let c = 0xFFFFFFFF; for (let i = 0; i < b.length; i++) c = XL_CRC[(c ^ b[i]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }
function xlZip(files) {   // 無壓縮 ZIP（STORE），檔名 UTF-8
  const enc = new TextEncoder(), parts = [], cen = []; let off = 0;
  const u16 = v => [v & 255, (v >>> 8) & 255], u32 = v => [v & 255, (v >>> 8) & 255, (v >>> 16) & 255, (v >>> 24) & 255];
  files.forEach(f => {
    const nm = enc.encode(f.name), data = typeof f.data === 'string' ? enc.encode(f.data) : f.data, crc = xlCrc(data);
    const lh = new Uint8Array([...u32(0x04034b50), ...u16(20), ...u16(0x0800), ...u16(0), ...u16(0), ...u16(0x21), ...u32(crc), ...u32(data.length), ...u32(data.length), ...u16(nm.length), ...u16(0)]);
    parts.push(lh, nm, data);
    cen.push(new Uint8Array([...u32(0x02014b50), ...u16(20), ...u16(20), ...u16(0x0800), ...u16(0), ...u16(0), ...u16(0x21), ...u32(crc), ...u32(data.length), ...u32(data.length), ...u16(nm.length), ...u16(0), ...u16(0), ...u16(0), ...u16(0), ...u32(0), ...u32(off)]), nm);
    off += lh.length + nm.length + data.length;
  });
  const cenLen = cen.reduce((a, b) => a + b.length, 0);
  const end = new Uint8Array([...u32(0x06054b50), ...u16(0), ...u16(0), ...u16(files.length), ...u16(files.length), ...u32(cenLen), ...u32(off), ...u16(0)]);
  const all = parts.concat(cen, [end]), out = new Uint8Array(all.reduce((a, b) => a + b.length, 0)); let p = 0; all.forEach(b => { out.set(b, p); p += b.length; });
  return out;
}
const xlEsc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g, '');
function xlCol(i) { let s = ''; i++; while (i > 0) { const m = (i - 1) % 26; s = String.fromCharCode(65 + m) + s; i = Math.floor((i - 1) / 26); } return s; }
/* 樣式：0 一般 1 表頭 2 文字框 3 數值0.00 4 整數 5 標題 6 小計文字 7 小計數值 8 合計文字 9 合計數值 10 說明(換行) 11 數值0.000 */
const XL_STYLES = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><numFmts count="2"><numFmt numFmtId="164" formatCode="#,##0.00"/><numFmt numFmtId="165" formatCode="0.000"/></numFmts>
<fonts count="3"><font><sz val="11"/><name val="微軟正黑體"/><family val="2"/></font><font><b/><sz val="11"/><name val="微軟正黑體"/><family val="2"/></font><font><b/><sz val="14"/><name val="微軟正黑體"/><family val="2"/></font></fonts>
<fills count="5"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FFDCE6F1"/><bgColor indexed="64"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFF2F2F2"/><bgColor indexed="64"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFFFF2CC"/><bgColor indexed="64"/></patternFill></fill></fills>
<borders count="2"><border><left/><right/><top/><bottom/><diagonal/></border><border><left style="thin"><color rgb="FF999999"/></left><right style="thin"><color rgb="FF999999"/></right><top style="thin"><color rgb="FF999999"/></top><bottom style="thin"><color rgb="FF999999"/></bottom><diagonal/></border></borders>
<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
<cellXfs count="12"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
<xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>
<xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1"><alignment vertical="center"/></xf>
<xf numFmtId="164" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1"/>
<xf numFmtId="1" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1"/>
<xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1"/>
<xf numFmtId="0" fontId="1" fillId="3" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1"/>
<xf numFmtId="164" fontId="1" fillId="3" borderId="1" xfId="0" applyNumberFormat="1" applyFont="1" applyFill="1" applyBorder="1"/>
<xf numFmtId="0" fontId="1" fillId="4" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1"/>
<xf numFmtId="164" fontId="1" fillId="4" borderId="1" xfId="0" applyNumberFormat="1" applyFont="1" applyFill="1" applyBorder="1"/>
<xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf>
<xf numFmtId="165" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1"/></cellXfs>
<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`;
function xlSheetXml(sh) {
  let x = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheetPr><pageSetUpPr fitToPage="1"/></sheetPr>';
  x += '<sheetViews><sheetView workbookViewId="0">' + (sh.freeze ? `<pane ySplit="${sh.freeze}" topLeftCell="A${sh.freeze + 1}" activePane="bottomLeft" state="frozen"/>` : '') + '</sheetView></sheetViews><sheetFormatPr defaultRowHeight="16.5"/>';
  if (sh.cols) x += '<cols>' + sh.cols.map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`).join('') + '</cols>';
  x += '<sheetData>';
  sh.rows.forEach((r, ri) => {
    if (!r || !r.length) return; x += `<row r="${ri + 1}">`;
    r.forEach((c, ci) => {
      if (c === null || c === undefined || c === '') return;
      const o = (typeof c === 'object') ? c : { v: c }, ref = xlCol(ci) + (ri + 1), s = o.s !== undefined ? ` s="${o.s}"` : '';
      if (o.f !== undefined) x += `<c r="${ref}"${s}><f>${xlEsc(o.f)}</f>${Number.isFinite(o.v) ? `<v>${o.v}</v>` : ''}</c>`;
      else if (typeof o.v === 'number') x += Number.isFinite(o.v) ? `<c r="${ref}"${s}><v>${o.v}</v></c>` : `<c r="${ref}"${s}/>`;
      else if (o.v === undefined || o.v === null || o.v === '') x += `<c r="${ref}"${s}/>`;
      else x += `<c r="${ref}"${s} t="inlineStr"><is><t xml:space="preserve">${xlEsc(o.v)}</t></is></c>`;
    });
    x += '</row>';
  });
  x += '</sheetData>';
  if (sh.merges && sh.merges.length) x += `<mergeCells count="${sh.merges.length}">` + sh.merges.map(m => `<mergeCell ref="${m}"/>`).join('') + '</mergeCells>';
  return x + '<pageMargins left="0.5" right="0.5" top="0.6" bottom="0.6" header="0.3" footer="0.3"/><pageSetup paperSize="9" orientation="landscape" fitToWidth="1" fitToHeight="0"/></worksheet>';
}
function xlBook(sheets) {
  const n = sheets.length, ws = sheets.map((s, i) => ({ name: `xl/worksheets/sheet${i + 1}.xml`, data: xlSheetXml(s) }));
  const ct = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' +
    sheets.map((s, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('') + '<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/><Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/></Types>';
  const rels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/></Relationships>';
  const wb = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><bookViews><workbookView/></bookViews><sheets>' +
    sheets.map((s, i) => `<sheet name="${xlEsc(s.name)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join('') + '</sheets><calcPr calcId="191029" fullCalcOnLoad="1"/></workbook>';
  const wbr = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
    sheets.map((s, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join('') + `<Relationship Id="rId${n + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`;
  const now = new Date().toISOString().replace(/\.\d+Z$/, 'Z');
  const core = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>結構物數量表</dc:title><dc:creator>DiZhu</dc:creator><dcterms:created xsi:type="dcterms:W3CDTF">${now}</dcterms:created><dcterms:modified xsi:type="dcterms:W3CDTF">${now}</dcterms:modified></cp:coreProperties>`;
  const app = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties"><Application>DiZhu</Application></Properties>';
  return xlZip([{ name: '[Content_Types].xml', data: ct }, { name: '_rels/.rels', data: rels }, { name: 'docProps/core.xml', data: core }, { name: 'docProps/app.xml', data: app },
    { name: 'xl/workbook.xml', data: wb }, { name: 'xl/_rels/workbook.xml.rels', data: wbr }, { name: 'xl/styles.xml', data: XL_STYLES }, ...ws]);
}
function stQtyBook() {   // 整理全部中心線的結構物數量 → 工作表資料
  const lines = []; clEach(i => lines.push({ name: clName(i), sts: state.structs.filter(s => s._q).flatMap(s => [{ st: s, q: s._q, ex: s._exD || s._ex, abbr: stAbbr(s), g: stGeo(s) }].concat(stAccList(s).filter(k => (s._accQ || {})[k]).map(k => { const Q = s._accQ[k]; return { st: { name: stAccName(s, k), type: k, sta: s.sta + s.dir * Q.u0 }, lbl: stAccLabel(s, k) + '（附屬於 ' + s.name + '）', q: { V: 0, Vacc: Q.V, F: 0, wear: 0, ex: Q.ex, rows: Q.rows, segs: [] }, ex: null, abbr: '', g: { holes: [] } }; }))), rvs: (state.revs || []).filter(r => r._q).map(r => ({ rv: r, q: r._q, nm: rvName(r), sd: r.side === 'L' ? '左岸' : '右岸', a: formatStation(r._q.a), b: formatStation(r._q.b) })) }));
  const multi = lines.length > 1, r2 = v => Math.round(v * 1e6) / 1e6, strip = t => String(t || '').replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ');
  const title = (t, n) => [{ v: t, s: 5 }].concat(Array(Math.max(0, n - 1)).fill(null));
  const stamp = `專案：${(typeof projName !== 'undefined' && projName) ? projName.replace(/\.tcproj$/i, '') : '（未存檔）'}　匯出：${new Date().toLocaleString()}　中心線 ${lines.length} 條`;
  const H = a => a.map(v => ({ v, s: 1 }));
  // ---- 1 總表 ----
  const T = [title('結構物數量總表', 11), [stamp], [], H(['中心線', '結構物', '型式', '樁號', '壩體混凝土 (m³)', '附屬構造混凝土 (m³)', '混凝土合計 (m³)', '壩體模板 (m²)', '溢洪口抗磨損 (m²)', '排水孔 (處)', '結構物開挖 (m³)'])];
  const NC = ['E', 'F', 'G', 'H', 'I', 'J', 'K'], dataRanges = [], subRows = [];
  lines.forEach(L => {
    if (!L.sts.length) return; const r0 = T.length + 1;
    L.sts.forEach(o => { const q = o.q, r = T.length + 1; T.push([{ v: L.name, s: 2 }, { v: o.st.name, s: 2 }, { v: o.lbl || stTypeLabel(o.st.type), s: 2 }, { v: formatStation(o.st.sta), s: 2 },
      { v: r2(q.V), s: 3 }, { v: r2(q.Vacc || 0), s: 3 }, { f: `E${r}+F${r}`, v: r2(q.V + (q.Vacc || 0)), s: 3 }, { v: r2(q.F), s: 3 }, { v: r2(q.wear), s: 3 }, { v: o.g.holes.length, s: 4 }, { v: r2(q.ex), s: 3 }]); });
    const r1 = T.length; dataRanges.push([r0, r1]);
    if (multi) { const rs = T.length + 1, sum = c => L.sts.reduce((a, o) => a + ({ E: o.q.V, F: o.q.Vacc || 0, G: o.q.V + (o.q.Vacc || 0), H: o.q.F, I: o.q.wear, J: o.g.holes.length, K: o.q.ex })[c], 0);
      T.push([{ v: L.name + ' 小計', s: 6 }, { v: '', s: 6 }, { v: '', s: 6 }, { v: '', s: 6 }].concat(NC.map(c => ({ f: `SUM(${c}${r0}:${c}${r1})`, v: r2(sum(c)), s: 7 })))); subRows.push(rs); }
  });
  if (dataRanges.length) {
    const all = lines.flatMap(L => L.sts), tot = c => all.reduce((a, o) => a + ({ E: o.q.V, F: o.q.Vacc || 0, G: o.q.V + (o.q.Vacc || 0), H: o.q.F, I: o.q.wear, J: o.g.holes.length, K: o.q.ex })[c], 0);
    T.push([{ v: '合計', s: 8 }, { v: `${all.length} 座`, s: 8 }, { v: '', s: 8 }, { v: '', s: 8 }].concat(NC.map(c => ({ f: 'SUM(' + dataRanges.map(([a, b]) => `${c}${a}:${c}${b}`).join(',') + ')', v: r2(tot(c)), s: 9 }))));
  } else T.push([{ v: '（尚未放置結構物）' }]);
  T.push([], [{ v: '註：壩體混凝土＝切頭公式（含 key）扣除排水孔；附屬構造＝護坦／水墊（含截水牆）、側牆、尾檻，各為獨立結構物列出；開挖＝各變化段剖面平均斷面法（設計面以下，含邊坡、key）；附屬構造基坑開挖＝壩址整體開挖−壩體開挖，列於護坦。各項算式見「數量明細」。' }]);
  // ---- 2 數量明細 ----
  const M = [title('結構物數量明細', 8), [stamp], [], H(['中心線', '結構物', '樁號', '項目', '單位', '數量', '數量來源', '算式說明'])];
  lines.forEach(L => L.sts.forEach(o => { o.q.rows.forEach(r => M.push([{ v: L.name, s: 2 }, { v: o.st.name, s: 2 }, { v: formatStation(o.st.sta), s: 2 }, { v: strip(r.it).trim(), s: 10 }, { v: r.u, s: 2 }, { v: r.u === '處' ? Math.round(r.v) : r2(r.v), s: r.u === '處' ? 4 : 3 }, { v: typeof ttSrcKind === 'function' ? ttSrcKind(r.it, r.u, r.fx) : '', s: 2 }, { v: strip(r.fx), s: 10 }])); M.push([]); }));
  // ---- 3 開挖剖面 ----
  const E = [title('結構物開挖：各變化段剖面（平均斷面法）', 10), [stamp + '　切面標示＝結構物簡稱-累距（自圖左翼端起算）'], [], H(['中心線', '結構物', '剖面區間', '累距起 (m)', '累距迄 (m)', 'Δx (m)', 'A1 (m²)', 'A2 (m²)', '平均 A (m²)', 'V (m³)'])];
  const eSub = [];
  lines.forEach(L => L.sts.forEach(o => {
    const ex = o.ex; if (!ex || !ex.ok || !ex.vrows || !ex.vrows.length) return; const r0 = E.length + 1;
    ex.vrows.forEach(v => { const r = E.length + 1; E.push([{ v: L.name, s: 2 }, { v: `${o.st.name}（${o.abbr}-${formatStation(o.st.sta)}）`, s: 2 }, { v: `${v.a}～${v.b}`, s: 2 }, { v: r2(v.accA), s: 3 }, { v: r2(v.accB), s: 3 },
      { f: `E${r}-D${r}`, v: r2(v.L), s: 3 }, { v: r2(v.Aa), s: 11 }, { v: r2(v.Ab), s: 11 }, { f: `(G${r}+H${r})/2`, v: r2((v.Aa + v.Ab) / 2), s: 11 }, { f: `F${r}*I${r}`, v: r2(v.V), s: 3 }]); });
    const r1 = E.length, rs = r1 + 1; E.push([{ v: '', s: 6 }, { v: `${o.st.name} 小計`, s: 6 }, { v: '', s: 6 }, { v: '', s: 6 }, { v: '', s: 6 }, { v: '', s: 6 }, { v: '', s: 6 }, { v: '', s: 6 }, { v: '', s: 6 }, { f: `SUM(J${r0}:J${r1})`, v: r2(ex.V), s: 7 }]); eSub.push(rs); E.push([]);
  }));
  if (eSub.length) E.push([{ v: '合計', s: 8 }, { v: '', s: 8 }, { v: '', s: 8 }, { v: '', s: 8 }, { v: '', s: 8 }, { v: '', s: 8 }, { v: '', s: 8 }, { v: '', s: 8 }, { v: '', s: 8 }, { f: eSub.map(r => `J${r}`).join('+'), v: r2(lines.flatMap(L => L.sts).reduce((a, o) => a + (o.ex && o.ex.ok ? o.ex.V : 0), 0)), s: 9 }]);
  // ---- 4 壩體分段（切頭公式） ----
  const S = [title('壩體混凝土：各斷面分段切頭公式', 12), [stamp + '　V＝L/3×(A1+A2+√(A1×A2))'], [], H(['中心線', '結構物', '區段', 'x 起 (m)', 'x 迄 (m)', 'L (m)', 'A1 (m²)', 'A2 (m²)', 'V 切頭 (m³)', 'V Simpson (m³)', '模板 (m²)', 'key'])];
  lines.forEach(L => L.sts.forEach(o => {
    const sg = o.q.segs || []; if (!sg.length) return; const r0 = S.length + 1;
    sg.forEach((v, k) => { const r = S.length + 1; S.push([{ v: L.name, s: 2 }, { v: o.st.name, s: 2 }, { v: k + 1, s: 4 }, { v: r2(v.x0), s: 3 }, { v: r2(v.x1), s: 3 }, { f: `E${r}-D${r}`, v: r2(v.L), s: 3 }, { v: r2(v.A1), s: 11 }, { v: r2(v.A2), s: 11 },
      { f: `F${r}/3*(G${r}+H${r}+SQRT(G${r}*H${r}))`, v: r2(v.V), s: 11 }, { v: r2(v.Vs), s: 11 }, { v: r2(v.F), s: 3 }, { v: v.key ? '含 key' : '', s: 2 }]); });
    const r1 = S.length; S.push([{ v: '', s: 6 }, { v: `${o.st.name} 小計`, s: 6 }, { v: '', s: 6 }, { v: '', s: 6 }, { v: '', s: 6 }, { v: '', s: 6 }, { v: '', s: 6 }, { v: '', s: 6 },
      { f: `SUM(I${r0}:I${r1})`, v: r2(sg.reduce((a, v) => a + v.V, 0)), s: 7 }, { f: `SUM(J${r0}:J${r1})`, v: r2(sg.reduce((a, v) => a + v.Vs, 0)), s: 7 }, { f: `SUM(K${r0}:K${r1})`, v: r2(sg.reduce((a, v) => a + v.F, 0)), s: 7 }, { v: '', s: 6 }]);
    S.push([{ v: '' }, { v: '（扣排水孔前；扣除後＝總表壩體混凝土）' }]); S.push([]);
  }));
  // ---- 5 護岸／擋土牆（沿岸結構物；欄位依型式數量項目動態產生） ----
  const colL = n => { let s = ''; n++; while (n > 0) { const m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = Math.floor((n - 1) / 26); } return s; };
  const rvAllO = lines.flatMap(L => L.rvs), ik = [];
  rvAllO.forEach(o => o.q.rows.forEach(x => { if (!ik.some(k => k.k === x.k && k.u === x.u)) ik.push({ k: x.k, it: x.it.replace(/ PVC.*$/, ''), u: x.u }); }));
  const base = ['中心線', '名稱', '側別', '類別', '型式', '起', '迄', '中心線長 (m)', '護岸實長 (m)', 'H 最大 (m)'], NB = base.length, ncol = NB + ik.length;
  const RS = [title('護岸／擋土牆數量總表', ncol), [stamp + '　實長＝該岸偏移線長（曲線段左右不同）；中心線長＝中心線樁號差；開挖回填依地形'], [], H(base.concat(ik.map(k => `${k.it} (${k.u})`)))];
  const rowV = (o, k) => { const r = o.q.rows.find(x => x.k === k.k && x.u === k.u); return r ? r.v : 0; };
  const rvRow = (L, o) => { const r = RS.length + 1, q = o.q, Hm = Math.max(...q.segs.map(g => Math.max(g.H1, g.H2))), T = tcType(o.rv.type);
    RS.push([{ v: L.name, s: 2 }, { v: o.nm, s: 2 }, { v: o.sd, s: 2 }, { v: (TC_CATS.find(c => c.id === T.cat) || {}).label || '', s: 2 }, { v: T.label, s: 2 }, { v: o.a, s: 2 }, { v: o.b, s: 2 }, { v: r2(q.lenC), s: 3 }, { v: r2(q.lenB), s: 3 }, { v: r2(Hm), s: 3 }]
      .concat(ik.map(k => { const v = rowV(o, k), cnt = ['處', '支', '座'].includes(k.u); return { v: cnt ? Math.round(v) : r2(v), s: cnt ? 4 : 3 }; }))); return r; };
  const sumRow = (label, rows, st) => { const tx = st === 'tot' ? 8 : 6, nm = st === 'tot' ? 9 : 7, F = c => 'SUM(' + rows.map(o => `${c}${o._r}`).join(',') + ')';
    RS.push([{ v: label, s: tx }].concat(Array(6).fill({ v: '', s: tx }), [7, 8].map(ci => ({ f: F(colL(ci)), v: r2(rows.reduce((a, o) => a + (ci === 7 ? o.q.lenC : o.q.lenB), 0)), s: nm })), [{ v: '', s: tx }], ik.map((k, ii) => ({ f: F(colL(NB + ii)), v: r2(rows.reduce((a, o) => a + rowV(o, k), 0)), s: nm })))); };
  lines.forEach(L => { ['左岸', '右岸'].forEach(sd => { const arr = L.rvs.filter(o => o.sd === sd); if (!arr.length) return; arr.forEach(o => { o._r = rvRow(L, o); }); sumRow(`${L.name} ${sd}小計`, arr, 'sub'); }); });
  if (rvAllO.length) sumRow('合計', rvAllO, 'tot'); else RS.push([{ v: '（尚未設定護岸）' }]);
  RS.push([], [{ v: '註：各型式數量依型式定義（混凝土、砌石、濾層、鋼筋…）以平均斷面法×實長計；開挖、回填依地形；排水管數＝⌊實長/間距⌋+1；伸縮縫＝⌊實長/間距⌋＋接壩／側牆端各 1 處；收頭封牆另列（混凝土、模板、鋼筋）。被壩體／側牆截斷的路段不計。各區間見「護岸分段」。' }]);
  // ---- 6 護岸分段 ----
  const RG = [title('護岸／擋土牆：各斷面區間（平均斷面法）', 12), [stamp + '　A＝該型式主材每公尺面積（重力式＝混凝土、乾砌石＝塊石）'], [], H(['中心線', '名稱', '起樁號', '迄樁號', '中心線長 (m)', '護岸實長 (m)', 'A1 (m²)', 'A2 (m²)', '主材 V (m³)', '主材', '開挖 (m³)', '回填 (m³)'])];
  lines.forEach(L => L.rvs.forEach(o => { const r0 = RG.length + 1, T = tcType(o.rv.type), pn = (T.items.find(x => x.k === T.prim) || {}).it || '';
    o.q.segs.forEach(g => { const r = RG.length + 1; RG.push([{ v: L.name, s: 2 }, { v: o.nm, s: 2 }, { v: formatStation(g.a), s: 2 }, { v: formatStation(g.b), s: 2 }, { v: r2(g.ds), s: 3 }, { v: r2(g.Lb), s: 3 }, { v: r2(g.A1), s: 11 }, { v: r2(g.A2), s: 11 },
      { f: `(G${r}+H${r})/2*F${r}`, v: r2(g.v), s: 11 }, { v: pn, s: 2 }, { v: r2(g.ex), s: 3 }, { v: r2(g.bf), s: 3 }]); });
    const r1 = RG.length, sm = c => o.q.segs.reduce((a, g) => a + ({ E: g.ds, F: g.Lb, I: g.v, K: g.ex, L: g.bf })[c], 0);
    RG.push([{ v: '', s: 6 }, { v: `${o.nm} 小計`, s: 6 }, { v: '', s: 6 }, { v: '', s: 6 }].concat(['E', 'F'].map(c => ({ f: `SUM(${c}${r0}:${c}${r1})`, v: r2(sm(c)), s: 7 })), [{ v: '', s: 6 }, { v: '', s: 6 }], [{ f: `SUM(I${r0}:I${r1})`, v: r2(sm('I')), s: 7 }, { v: '', s: 6 }], ['K', 'L'].map(c => ({ f: `SUM(${c}${r0}:${c}${r1})`, v: r2(sm(c)), s: 7 })))); RG.push([]); }));
  const nRv = lines.reduce((a, L) => a + L.rvs.length, 0);
  return { n: lines.reduce((a, L) => a + L.sts.length, 0) + nRv, nSt: lines.reduce((a, L) => a + L.sts.length, 0), nRv, sheets: [
    ...(lines.some(L => L.sts.length) || !nRv ? [
    { name: '總表', cols: [10, 14, 9, 13, 15, 17, 15, 14, 15, 11, 16], rows: T, freeze: 4, merges: ['A1:K1'] },
    { name: '數量明細', cols: [10, 14, 13, 38, 7, 13, 20, 90], rows: M, freeze: 4, merges: ['A1:H1'] },
    { name: '開挖剖面', cols: [10, 26, 12, 11, 11, 10, 11, 11, 12, 13], rows: E, freeze: 4, merges: ['A1:J1'] },
    { name: '壩體分段', cols: [10, 14, 7, 10, 10, 10, 11, 11, 13, 14, 12, 8], rows: S, freeze: 4, merges: ['A1:L1'] }] : []),
    ...(nRv ? [
    { name: '護岸', cols: [10, 12, 7, 8, 22, 11, 11, 12, 12, 10].concat(ik.map(() => 14)), rows: RS, freeze: 4, merges: [`A1:${colL(ncol - 1)}1`] },
    { name: '護岸分段', cols: [10, 14, 11, 11, 12, 12, 10, 10, 13, 18, 11, 11], rows: RG, freeze: 4, merges: ['A1:L1'] }] : [])] };
}
function stExportXlsx() {
  const B = stQtyBook();
  if (!B.n) { alert('目前沒有可計算數量的結構物或護岸。'); return; }
  const bytes = xlBook(B.sheets), base = (typeof projName !== 'undefined' && projName) ? projName.replace(/\.tcproj$/i, '') : 'DiZhu';
  const nm = `${base}_結構物數量表.xlsx`, blob = new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), url = URL.createObjectURL(blob), a = document.createElement('a');
  a.href = url; a.download = nm; document.body.appendChild(a); a.click(); document.body.removeChild(a); setTimeout(() => URL.revokeObjectURL(url), 2000);
  updateStatus(`💾 已匯出 ${nm}：${B.sheets.map(x => x.name).join('、')} ${B.sheets.length} 個工作表（結構物 ${B.nSt} 座、護岸 ${B.nRv} 段；${state.cls.length} 條中心線）。`);
  return B;
}
