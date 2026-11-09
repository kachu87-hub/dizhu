/* ============================================================================
   chkmod.js（v6.5）全專案檢核清單
   - 頂部「✔ 檢核」按鈕＋徽章（✗ 錯誤數／⚠ 警告數）；點開浮動清單，依類別分組
   - 每列可點：切換視圖／頁籤、選取物件、平面圖置中並閃示位置（橫斷面則跳到該樁）
   - 只提示、不擋輸入；檢核範圍＝目前中心線（多中心線時於清單標明）
   - 來源：既有檢核（手冊規定 ruleStruct/ruleRev、安定檢核 sbCalc、通水檢核 dnHydCheck、
     水面線出水高 hyBad、整地 grdWarn、護岸 _warn）＋本模組新增的完整性檢查
   ============================================================================ */
const CHK = { items: [], open: false, flt: { err: true, warn: true, info: true }, flash: null, t: 0, sig: '' };
const CHK_SEV = { err: ['✗', '#dc2626', '錯誤'], warn: ['⚠', '#d97706', '警告'], info: ['ℹ', '#64748b', '提示'] };
const CHK_CATS = ['基本資料', '縱斷面', '橫斷面', '結構物', '護岸', '排水', '水力', '整地', '崩塌地', '數量'];
const chkF = (v, d = 2) => (Number.isFinite(+v) ? (+v).toFixed(d) : '—');
const chkSta = s => (typeof formatStation === 'function' && Number.isFinite(s) ? formatStation(s) : chkF(s));
const chkEsc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/* ---- 收集 ---- */
function chkCollect() {
  const out = [], add = (sev, cat, obj, msg, go) => out.push({ sev, cat, obj: obj || '', msg, go: go || null });
  const al = state.alignment || { segments: [] }, secs = state.sections || [], hasAl = al.segments && al.segments.length > 0;
  const inAl = s => hasAl && s >= al.startSta - 1e-6 && s <= al.endSta + 1e-6;
  // 1 基本資料
  const hasTerr = (state.points || []).length > 0 || (state.triangles || []).length > 0 || !!state.dzDem;
  if (!hasTerr) add('err', '基本資料', '地形', '尚未匯入地形資料（測點／三角網／DEM），橫斷面與土方無法計算', { tab: 'tab-data', view: '2D' });
  if (!hasAl) add('err', '基本資料', '中心線', '尚未建立中心線（IP 定線）', { tab: 'tab-align', view: '2D' });
  else if (secs.length < 2) add('warn', '基本資料', '樁號', `斷面樁只有 ${secs.length} 處，無法計算縱斷面與土方`, { tab: 'tab-align', view: '2D' });
  // 2 縱斷面
  if (hasAl && secs.length >= 2) {
    const PC = (state.profile && state.profile.calc) || [];
    if (PC.length < 2) add('warn', '縱斷面', '設計線', '尚未設定縱斷面設計線（VIP）', { view: 'PROFILE', tab: 'tab-earth' });
  }
  // 3 橫斷面：地面或設計高程取不到
  if (hasTerr) {
    const badG = secs.filter(s => !Number.isFinite(s.groundCenter)), badD = secs.filter(s => Number.isFinite(s.groundCenter) && !Number.isFinite(s.desCenterZ));
    badG.forEach(s => add('err', '橫斷面', s.staLabel, '中心點地面高程取不到（超出地形範圍？）', { view: 'CROSS', sta: s.sta }));
    badD.forEach(s => add('warn', '橫斷面', s.staLabel, '中心點設計高程無法計算', { view: 'CROSS', sta: s.sta }));
  }
  // 4 結構物
  (state.structs || []).forEach((st, i) => {
    const nm = st.name || `結構物${i + 1}`, go = { tab: 'tab-earth', card: 'stCard', sel: () => stSelect(i), sta: st.sta, view: '2D' };
    if (hasAl && !inAl(st.sta)) add('err', '結構物', nm, `樁號 ${chkSta(st.sta)} 不在中心線範圍（${chkSta(al.startSta)}～${chkSta(al.endSta)}）內`, go);
    if (hasAl && inAl(st.sta) && !st._q && !st.par) add('warn', '結構物', nm, '數量無法計算（請確認地形與縱斷面設計線）', go);
    try { if (typeof ruleStruct === 'function') ruleStruct(st).forEach(m => add('warn', '結構物', nm, '手冊規定：' + m, go)); } catch (e) { }
    try {
      if (typeof sbCalc === 'function' && (st.type || 'dam') === 'dam' && st.p && st.p.h1 > 0) {
        const R = sbCalc(st);
        if (R && !R.pass) {
          const bad = (R.cs || []).filter(c => !c.pass).map(c => c.nm), fl = R.inp && R.inp.fl && !R.inp.fl.ok ? ['溢洪口通洪'] : [];
          add('err', '結構物', nm, `安定檢核未通過：${bad.concat(fl).join('、') || '請檢視安定檢核表'}`, go);
        }
      }
    } catch (e) { }
  });
  { const L = (state.structs || []).filter(st => !st.par).slice().sort((a, b) => a.sta - b.sta);
    for (let k = 1; k < L.length; k++) if (Math.abs(L[k].sta - L[k - 1].sta) < 1.0) { const i = state.structs.indexOf(L[k]);
      add('warn', '結構物', `${L[k - 1].name}／${L[k].name}`, `兩座結構物樁號相距 ${chkF(Math.abs(L[k].sta - L[k - 1].sta))} m（小於 1 m），可能重複放置`, { tab: 'tab-earth', card: 'stCard', sel: () => stSelect(i), sta: L[k].sta, view: '2D' }); } }
  // 5 護岸
  (state.revs || []).forEach((rv, i) => {
    const nm = typeof rvName === 'function' ? rvName(rv) : `護岸${i + 1}`, L = typeof rvLim === 'function' ? rvLim(rv) : { a: rv.s0, b: rv.s1 };
    const go = { tab: 'tab-earth', card: 'rvCard', sel: () => rvSel(i), sta: (L.a + L.b) / 2, view: '2D' };
    if (rv._warn) add('err', '護岸', nm, rv._warn, go);
    try { if (typeof ruleRev === 'function') ruleRev(rv).forEach(m => add('warn', '護岸', nm, '手冊規定：' + m, go)); } catch (e) { }
    const rows = (rv._q && rv._q.rows) || [];
    const nan = rows.filter(r => r && r.v !== undefined && r.v !== '' && r.v !== null && !Number.isFinite(+r.v));
    if (nan.length) add('err', '數量', nm, `數量表有 ${nan.length} 項無法計算（${nan.slice(0, 3).map(r => String(r.it || '').slice(0, 14)).join('、')}${nan.length > 3 ? '…' : ''}）`, go);
  });
  ['L', 'R'].forEach(sd => {
    const R = (state.revs || []).map((rv, i) => ({ rv, i, L: rvLim(rv) })).filter(o => o.rv.side === sd).sort((a, b) => a.L.a - b.L.a);
    for (let k = 1; k < R.length; k++) { const ov = Math.min(R[k - 1].L.b, R[k].L.b) - R[k].L.a; if (ov > 0.5)
      add('warn', '護岸', `${rvName(R[k - 1].rv)}／${rvName(R[k].rv)}`, `${sd === 'L' ? '左' : '右'}岸兩段護岸範圍重疊 ${chkF(ov)} m（${chkSta(R[k].L.a)}～${chkSta(Math.min(R[k - 1].L.b, R[k].L.b))}），數量會重複計算`, { tab: 'tab-earth', card: 'rvCard', sel: () => rvSel(R[k].i), sta: R[k].L.a + ov / 2, view: '2D' }); }
  });
  // 6 排水
  (state.dns || []).forEach((d, i) => {
    const nm = d.name || `排水溝${i + 1}`, pt = d.pts && d.pts.length ? d.pts[Math.floor(d.pts.length / 2)] : null;
    const go = { tab: 'tab-dn', sel: () => { state.dnSel = i; dnPanelUI(); }, xy: pt ? [pt[0] ?? pt.x, pt[1] ?? pt.y] : null, view: '2D' };
    if (!d.pts || d.pts.length < 2) { if (d.mode !== 'A') add('warn', '排水', nm, '基線未繪製（至少 2 點）', go); }
    if (typeof DN2 !== 'undefined' && DN2[d.type] && DN2[d.type].sub) return;   // 地下排水（盲溝）不做通水檢核
    let c = null; try { c = dnCalc(d); } catch (e) { }
    if (!c) return;
    if (!(d.q > 0)) { add('info', '排水', nm, '未輸入設計流量 Q，未做通水檢核', go); return; }
    let h = null; try { h = dnHydCheck(d); } catch (e) { }
    if (h && !h.ok) h.msg.forEach(m => add(/不足|無法/.test(m) ? 'err' : 'warn', '排水', nm, '通水檢核：' + m, go));
  });
  // 7 水力
  if (state.hyRes) {
    if (state.hyStale) add('warn', '水力', '水面線', '輸入或斷面已變更，水面線結果已過期，請重新「計算水面線」', { tab: 'tab-hy', view: 'PROFILE' });
    try { (typeof hyBad === 'function' ? hyBad() : []).forEach(b => add('err', '水力', `Q${b.k} ${b.sd === 'L' ? '左' : '右'}岸`, `樁號 ${chkSta(b.sta)} 出水高不足（${chkF(b.fb)} m）`, { tab: 'tab-hy', view: 'CROSS', sta: b.sta })); } catch (e) { }
  } else if ((state.revs || []).length || (state.structs || []).length) add('info', '水力', '水面線', '尚未計算水面線，護岸／壩體出水高未檢核', { tab: 'tab-hy', view: 'PROFILE' });
  // 8 整地
  (state.grades || []).forEach(G => {
    let W = null; try { W = grdWarn(G); } catch (e) { return; }
    const go = { tab: 'tab-earth', card: 'grdCard', sel: () => { GRD_SEL = G.id; grdRefresh(false); }, sta: G.src === 'cl' ? (G.s0 + G.s1) / 2 : null, view: '2D' };
    if (W.over.length) add('warn', '整地', G.name, `${W.over.length} 處斷面超出實測地形範圍（${W.over.slice(0, 4).join('、')}${W.over.length > 4 ? '…' : ''}），坡頂位置以外插估計`, go);
    if (W.jump.length) add('warn', '整地', G.name, `坡頂位置突變（>5 m）：${W.jump.slice(0, 3).join('、')}${W.jump.length > 3 ? '…' : ''}`, go);
  });
  // 9 崩塌地
  (state.dzCases || []).forEach((c, i) => {
    const z = c.zone || [], cx = z.length ? z.reduce((s, p) => s + p[0], 0) / z.length : null, cy = z.length ? z.reduce((s, p) => s + p[1], 0) / z.length : null;
    const go = { tab: 'tab-dz', sel: () => { state.dzSel = i; dzPanelUI(); }, xy: cx !== null ? [cx, cy] : null, view: '2D' };
    if (z.length < 3) add('warn', '崩塌地', c.name, '整治區範圍未圈定（至少 3 點）', go);
    if ((c.walls || []).length && (c.bl || []).length < 2) add('warn', '崩塌地', c.name, '有擋土牆但基準線未繪製', go);
  });
  return out;
}

/* ---- 介面 ---- */
function chkRun(bg) {
  try { CHK.items = chkCollect(); } catch (e) { console.error('chkCollect', e); CHK.items = []; }
  const sig = JSON.stringify(CHK.items.map(x => [x.sev, x.cat, x.obj, x.msg])), ch = sig !== CHK.sig; CHK.sig = sig; CHK.t = Date.now(); chkBadge();
  if (CHK.open && (!bg || ch)) chkRender(); return CHK.items;
}
function chkCount() { const n = { err: 0, warn: 0, info: 0 }; CHK.items.forEach(x => n[x.sev]++); return n; }
function chkBadge() {
  const b = document.getElementById('btnChk'); if (!b) return; const n = chkCount();
  b.innerHTML = `✔ 檢核${n.err ? ` <span class="chk-pill" style="background:#dc2626;">✗${n.err}</span>` : ''}${n.warn ? ` <span class="chk-pill" style="background:#d97706;">⚠${n.warn}</span>` : ''}${!n.err && !n.warn ? ' <span class="chk-pill" style="background:#16a34a;">OK</span>' : ''}`;
  b.title = `全專案檢核：錯誤 ${n.err}、警告 ${n.warn}、提示 ${n.info}（點開清單，點任一列跳到位置）`;
}
function chkToggle(on) {
  CHK.open = on === undefined ? !CHK.open : !!on; let el = document.getElementById('chkPanel');
  if (!CHK.open) { if (el) el.style.display = 'none'; return; }
  if (!el) { el = document.createElement('div'); el.id = 'chkPanel'; document.body.appendChild(el); }
  el.style.display = 'flex'; chkRun();
}
function chkFlt(k) { CHK.flt[k] = !CHK.flt[k]; chkRender(); }
function chkRender() {
  const el = document.getElementById('chkPanel'); if (!el) return; const sb = el.querySelector('.chk-body'), sTop = sb ? sb.scrollTop : 0; const n = chkCount(), multi = typeof clMulti === 'function' && clMulti();
  const vis = CHK.items.map((x, i) => [x, i]).filter(([x]) => CHK.flt[x.sev]);
  const groups = CHK_CATS.map(c => [c, vis.filter(([x]) => x.cat === c)]).filter(g => g[1].length);
  const fb = k => `<button class="btn chk-f${CHK.flt[k] ? ' on' : ''}" onclick="chkFlt('${k}')" style="--c:${CHK_SEV[k][1]}">${CHK_SEV[k][0]} ${CHK_SEV[k][2]} ${n[k]}</button>`;
  el.innerHTML = `<div class="chk-hd"><b>✔ 全專案檢核清單</b><span style="flex:1"></span><button class="btn" onclick="chkRun()" title="重新執行全部檢核">↻ 重新檢核</button><button class="btn" onclick="chkToggle(false)" title="關閉">✕</button></div>
    <div class="chk-fl">${fb('err')}${fb('warn')}${fb('info')}</div>
    <div class="chk-note">點任一列：切到相關視圖與頁籤、選取該物件，平面圖置中閃示位置。只提示、不擋輸入。${multi ? `<br>多中心線：本清單檢核目前中心線「${chkEsc(clName())}」，其他中心線請切換後再檢核。` : ''}</div>
    <div class="chk-body">${groups.length ? groups.map(([c, L]) => `<div class="chk-g"><div class="chk-gt">${c}<span>${L.length}</span></div>${L.map(([x, i]) => `<div class="chk-row${x.go ? ' go' : ''}" ${x.go ? `onclick="chkGo(${i})"` : ''} title="${x.go ? '點一下跳到位置' : ''}"><span class="chk-ic" style="color:${CHK_SEV[x.sev][1]}">${CHK_SEV[x.sev][0]}</span><span class="chk-tx"><b>${chkEsc(x.obj)}</b>　${chkEsc(x.msg)}</span>${x.go ? '<span class="chk-ar">➜</span>' : ''}</div>`).join('')}</div>`).join('')
      : `<div class="chk-ok">${CHK.items.length ? '目前篩選條件下沒有項目。' : '✔ 沒有發現問題。'}</div>`}</div>
    <div class="chk-ft">檢核時間 ${new Date(CHK.t).toLocaleTimeString()}　共 ${CHK.items.length} 項</div>`;
  const nb = el.querySelector('.chk-body'); if (nb) nb.scrollTop = sTop;
}
function chkSecIdx(sta) { const S = state.sections || []; let k = -1, d = Infinity; S.forEach((s, i) => { const e = Math.abs(s.sta - sta); if (e < d) { d = e; k = i; } }); return k; }
function chkGo(i) {
  const x = CHK.items[i]; if (!x || !x.go) return; const g = x.go;
  try {
    if (g.view && state.viewMode !== g.view) setViewMode(g.view);
    if (g.tab) { const t = document.querySelector(`.panel-tab[data-tab="${g.tab}"]`) || [...document.querySelectorAll('.panel-tab')].find(e => (e.getAttribute('onclick') || '').includes(`'${g.tab}'`)); if (t && t.style.display !== 'none') t.click(); else if (typeof switchSideTab === 'function') switchSideTab(g.tab, t); }
    if (g.sel) g.sel();
    if (g.card) { const c = document.getElementById(g.card); if (c && typeof earthShowCard === 'function' && c.dataset.grp !== undefined) earthShowCard(c); else if (c) { c.classList.remove('folded'); c.scrollIntoView({ block: 'start', behavior: 'smooth' }); } }
    let p = null;
    if (Number.isFinite(g.sta)) {
      const k = chkSecIdx(g.sta); if (k >= 0 && (g.view === 'CROSS' || state.viewMode === 'CROSS')) selectStationIndex(k);
      const q = getPointAndNormalAtStation(Math.max(state.alignment.startSta, Math.min(state.alignment.endSta, g.sta))); if (q) p = [q.x, q.y];
    } else if (g.xy && g.xy.every(Number.isFinite)) p = g.xy;
    if (p && state.viewMode === '2D') { state.cam2D.cx = p[0]; state.cam2D.cy = p[1]; if (state.cam2D.scale < 2) state.cam2D.scale = 2.5; CHK.flash = { x: p[0], y: p[1], t: Date.now() }; chkAnim(); }
    updateStatus(`🔎 檢核：${x.obj}　${x.msg}`);
  } catch (e) { console.error('chkGo', e); }
  document.querySelectorAll('#chkPanel .chk-row').forEach(r => r.classList.toggle('cur', r.getAttribute('onclick') === `chkGo(${i})`));
  requestRedraw();
}
function chkAnim() { if (!CHK.flash) return; if (Date.now() - CHK.flash.t > 2400) { CHK.flash = null; requestRedraw(); return; } requestRedraw(); setTimeout(chkAnim, 60); }
function chkDrawFlash() {
  const f = CHK.flash; if (!f || state.viewMode !== '2D') return; const a = (Date.now() - f.t) / 2400; if (a > 1) return;
  const s = worldToScreen2D(f.x, f.y); ctx.save(); ctx.setLineDash([]);
  for (let k = 0; k < 2; k++) { const r = 10 + ((a * 3 + k * 0.5) % 1) * 34; ctx.strokeStyle = `rgba(239,68,68,${(1 - a) * (1 - ((a * 3 + k * 0.5) % 1))})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(s.x, s.y, r, 0, Math.PI * 2); ctx.stroke(); }
  ctx.fillStyle = `rgba(239,68,68,${1 - a})`; ctx.beginPath(); ctx.arc(s.x, s.y, 4, 0, Math.PI * 2); ctx.fill(); ctx.restore();
}
(function () {
  const s = document.createElement('style');
  s.textContent = `
  #btnChk { font-weight:700; white-space:nowrap; }
  .chk-pill { display:inline-block; color:#fff; border-radius:9px; padding:0 6px; font-size:11px; line-height:16px; margin-left:2px; }
  #chkPanel { position:fixed; right:18px; top:118px; width:min(calc(340px * var(--ts, 1)), calc(100vw - 36px)); max-height:calc(100vh - 170px); z-index:9000; display:none; flex-direction:column;
    background:var(--bg-panel,#fff); color:var(--text-main,#111); border:1px solid var(--border-bright,#94a3b8); border-radius:8px; box-shadow:0 10px 30px rgba(0,0,0,.35); font-size:calc(9px * var(--ts, 1)); }
  #chkPanel .chk-hd { display:flex; align-items:center; gap:6px; padding:8px 10px; border-bottom:1px solid var(--border-dim,#ddd); font-size:1.1em; }
  #chkPanel .chk-hd .btn { padding:1px 8px; }
  #chkPanel .chk-fl { display:flex; gap:6px; padding:6px 10px 0; flex-wrap:wrap; }
  #chkPanel .chk-f { padding:1px 8px; font-size:.95em; opacity:.45; border-color:var(--c); color:var(--c); }
  #chkPanel .chk-f.on { opacity:1; background:color-mix(in srgb, var(--c) 12%, transparent); }
  #chkPanel .chk-note { padding:5px 10px; font-size:.9em; color:var(--text-muted,#666); line-height:1.5; }
  #chkPanel .chk-body { overflow:auto; padding:0 6px 6px; flex:1; }
  #chkPanel .chk-gt { display:flex; justify-content:space-between; font-weight:700; font-size:1em; color:#38bdf8; padding:6px 4px 2px; border-bottom:1px solid var(--border-dim,#ddd); }
  #chkPanel .chk-gt span { color:var(--text-muted,#666); font-weight:400; }
  #chkPanel .chk-row { display:flex; gap:6px; align-items:flex-start; padding:4px 4px; border-radius:4px; line-height:1.5; }
  #chkPanel .chk-row.go { cursor:pointer; }
  #chkPanel .chk-row.go:hover { background:rgba(14,165,233,.10); }
  #chkPanel .chk-row.cur { background:rgba(14,165,233,.18); }
  #chkPanel .chk-ic { font-weight:700; width:14px; flex:none; text-align:center; }
  #chkPanel .chk-tx { flex:1; min-width:0; word-break:break-word; }
  #chkPanel .chk-ar { color:var(--text-muted,#666); flex:none; }
  #chkPanel .chk-ok { padding:18px; text-align:center; color:#16a34a; font-weight:700; }
  #chkPanel .chk-ft { padding:4px 10px 6px; font-size:.9em; color:var(--text-muted,#666); border-top:1px solid var(--border-dim,#ddd); }`;
  document.head.appendChild(s);
  const _r = render2DCAD; render2DCAD = function () { _r.apply(this, arguments); try { chkDrawFlash(); } catch (e) { } };
  const _ap = applyProject; applyProject = function () { const r = _ap.apply(this, arguments); setTimeout(chkRun, 300); return r; };
  window.addEventListener('load', () => setTimeout(() => {
    const dx = document.getElementById('btnXlsx') || [...document.querySelectorAll('button')].find(b => /exportFullDXF\(\)/.test(b.getAttribute('onclick') || ''));
    if (dx && !document.getElementById('btnChk')) { const b = document.createElement('button'); b.className = 'btn'; b.id = 'btnChk'; b.onclick = () => chkToggle(); dx.parentNode.insertBefore(b, dx); }
    chkRun();
    setInterval(() => { if (document.hidden) return; if (Date.now() - CHK.t > 2500) chkRun(true); }, 3000);   // 背景每 3 秒更新徽章（清單開著時一併更新）
  }, 50));
})();
