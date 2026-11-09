/* ============================================================================
   v7.6 結構物調高程（S1～S5、T1～T5）
   T1 拖 ◆頂／◆底＝整座上下移動（h2 不變；連動時設計線跟著動）
   T2 拖曳時游標旁顯示「頂 EL a → b（整座移動）」或「h2 a→b（改高度）」
   T4 Shift＋拖 ◆頂＝改高度（防砂壩／副壩／一般固床工改 h2；箱籠固床工改層數；移植 8 型式不可拖，請在卡片改）
   T5 載入／重算時，移植型式外包 h2 依型式參數重算（sltSync），修正舊版拖錯的專案
   S1 卡片「① 高程」加頂高程輸入＋▲▼（0.05 m；Shift 0.5 m）＋連動提示
   S2 控點加大＋標籤（stmod 內）、滑過控點於狀態列提示
   S3 固定比例縱斷「全圖」縮到整條看得到；點卡片清單結構物 → 縱斷平移到該處、橫斷切單一圖
   S4 橫斷矩陣點到有結構物的格子 → 切單一圖（控點才會出現）
   S5 選取結構物後 ↑↓ 整座移動 0.05 m（Shift 0.5 m），停手 0.4 s 後才重算設計線；Esc 取消
   ============================================================================ */
const STZ = { arm: null, tip: null, last: null, kq: 0, kt: null, kst: null };
function stzIsSlt(st) { return typeof sltOn === 'function' && sltOn(st); }
function stzTopName(st) { return st.type === 'sill' ? '固床工頂' : '溢洪口底'; }
function stzHeightKind(st) {   // Shift＋拖 ◆頂 可改的高度：'h2' | 'layer' | null（移植型式）
  if (stzIsSlt(st)) return st.sty === 'g604' ? 'layer' : null;
  return 'h2';
}
function stzLayers(st) { try { return stzIsSlt(st) && st.sty === 'g604' ? Math.round(+(st.sp.p_N_layer || sltRun(st).P.N_layer)) : null; } catch (e) { return null; } }

/* ---------- T1／T4：拖曳語意 ---------- */
(function () {
  const _a = stApplyDrag;
  stApplyDrag = function (hd, z) {
    const st = hd.st;
    if (st.par && (hd.kind === 'zB' || hd.kind === 'zS')) return;   // 附屬結構物高程跟隨主壩
    if (hd.kind === 'zB' || (hd.kind === 'zS' && !hd.shift)) {
      if (!hd._s) { const pl = stPlace(st), zb = hd.zB0 !== undefined ? hd.zB0 : pl.zB; hd._s = { zB0: zb, zS0: zb + (pl.zS - pl.zB) }; }
      const d = +stSnap(z - (hd.kind === 'zS' ? hd._s.zS0 : hd._s.zB0)).toFixed(3), zb = +(hd._s.zB0 + d).toFixed(3);
      hd._d = d; if (st.link) st._zT = zb; else st.zB = zb; return;
    }
    if (hd.kind === 'zS' && hd.shift && !stzHeightKind(st)) { hd._blocked = true; return; }
    if (hd.kind === 'zS' && hd.shift && stzHeightKind(st) === 'h2') {   // 以拖曳起點為基準取 0.05 m 整數倍（h2 不會出現 0.489 這種零頭）
      if (!hd._s) { const pl = stPlace(st), zb = hd.zB0 !== undefined ? hd.zB0 : pl.zB; hd._s = { zB0: zb, zS0: zb + (pl.zS - pl.zB), h20: st.p.h2 }; }
      st.p.h2 = +Math.max(0.3, hd._s.h20 + stSnap(z - hd._s.zS0)).toFixed(3); if (st.link) st._zT = hd._s.zB0; else st.zB = hd._s.zB0; return;
    }
    return _a(hd, z);
  };
})();

/* ---------- 控點命中（與 stInitDrag 相同規則） ---------- */
function stzHit(e) {
  const cv = cadCanvas; if (!cv || (state.viewMode !== 'PROFILE' && state.viewMode !== 'CROSS')) return null;
  const r = cv.getBoundingClientRect(), b = camInv(e.clientX - r.left, e.clientY - r.top); let best = null, bd = 9;
  ST_H.forEach(h => { if (h.view !== state.viewMode) return; const d = Math.hypot(b.x - h.x, b.y - h.y); if (d < bd) { bd = d; best = h; } });
  return best;
}
function stzSnap0(st) { const pl = stPlace(st); return { zB: pl.zB, zS: pl.zS, h2: st.p.h2, h1: st.p.h1, N: stzLayers(st) }; }
function stzTipEl() {
  if (STZ.tip) return STZ.tip;
  const d = document.createElement('div'); d.id = 'stzTip';
  d.style.cssText = 'position:fixed;z-index:9500;pointer-events:none;display:none;background:rgba(8,12,18,.92);color:#fde68a;border:1px solid #f59e0b;border-radius:4px;padding:3px 7px;font:bold 12px "JetBrains Mono","Microsoft JhengHei",monospace;white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,.5);';
  document.body.appendChild(d); STZ.tip = d; return d;
}
function stzTipText(hd) {   // T2
  const st = hd.st, a = hd._t0; if (!a) return '';
  if (st.par && (hd.kind === 'zB' || hd.kind === 'zS')) return '附屬結構物：高程跟隨主壩';
  const ln = st.link ? '・設計線跟著動' : '・只動結構物';
  if (hd.kind === 'zB' || (hd.kind === 'zS' && !hd.shift)) {
    const d = hd._d || 0;
    return hd.kind === 'zS' ? `頂 EL ${stf(a.zS)} → ${stf(a.zS + d)}（整座移動${ln}）` : `底 EL ${stf(a.zB)} → ${stf(a.zB + d)}（整座移動${ln}）`;
  }
  if (hd.kind === 'zS') {
    if (hd._blocked) return `${stTypeLabel(st.type)}（${(SLT[st.sty] || {}).label || st.sty}）高度由型式參數決定，請在卡片改`;
    const k = stzHeightKind(st);
    if (k === 'layer') return `層數 ${a.N} → ${stzLayers(st)}（改高度）`;
    return `h2 ${stf(a.h2)} → ${stf(st.p.h2)}（改高度）`;
  }
  if (hd.kind === 'h1') return `h1 ${stf(a.h1)} → ${stf(st.p.h1)}`;
  const sd = hd.kind === 'wL' ? 'L' : 'R', pl = stPlace(st); return `翼頂 ${sd === 'L' ? '左' : '右'} EL ${stf(sd === 'L' ? pl.zWL : pl.zWR)}`;
}
function stzHoverHint(h) {   // S2
  const st = h.st, nm = `「${st.name}」`;
  if (h.kind === 'zS' || h.kind === 'zB') {
    if (st.par) return `${nm}為附屬結構物，高程跟隨主壩。`;
    const k = stzHeightKind(st), sh = k === 'h2' ? 'Shift＋拖曳 ◆頂＝改高度 h2' : k === 'layer' ? 'Shift＋拖曳 ◆頂＝增減箱籠層數' : '此型式高度請在卡片改型式參數';
    return `◆${h.kind === 'zS' ? '頂' : '底'} ${nm}：拖曳＝整座上下移動（${st.link ? '設計線會跟著動' : '只動結構物'}）；${sh}；點一下後可按 ↑↓ 微調（Shift 0.5 m），Esc 取消。`;
  }
  if (h.kind === 'h1') return `◆ ${nm}：拖曳改溢洪口深 h1。`;
  return `◆ ${nm}：拖曳改翼頂高（r1）。`;
}
function stzArm(st, quiet) {
  STZ.arm = st || null;
  if (st && !st.par && !quiet && (state.viewMode === 'PROFILE' || state.viewMode === 'CROSS')) updateStatus(`已選取「${st.name}」：按 ↑↓ 整座上下移動 0.05 m（Shift 0.5 m）${st.link ? '，設計線會跟著動' : '，只動結構物'}；Esc 取消選取。`);
}

(function stzInitMouse() {
  window.addEventListener('mousedown', e => {   // 在 stInitDrag 之後執行（同為 window capture）
    if (e.target !== cadCanvas || e.button !== 0) return;
    if (ST_DRAG) {   // 一般拖曳（stInitDrag 已建立）
      delete ST_DRAG._s; delete ST_DRAG._d; ST_DRAG.shift = false; ST_DRAG._blocked = false; ST_DRAG._t0 = stzSnap0(ST_DRAG.st); stzArm(ST_DRAG.st, true);
      if (ST_DRAG.kind === 'zB' || ST_DRAG.kind === 'zS') STZ.hcT = Date.now(); return;
    }
    if (state.panMode || e.altKey) return;
    if (!e.shiftKey) { if (state.viewMode === 'PROFILE' || state.viewMode === 'CROSS') STZ.arm = null; return; }
    const h = stzHit(e); if (!h) return;   // T4：Shift＋按控點（stInitDrag 不處理 Shift）
    pushUndoSnapshot(); ST_DRAG = h; ST_HCLICK = h; h.zB0 = stPlace(h.st).zB; delete h._s; delete h._d; h.shift = true; h._blocked = false; h._t0 = stzSnap0(h.st);
    STZ.hcT = Date.now(); state.structSel = state.structs.indexOf(h.st); state.stHL = { focus: ({ zB: 'zB', zS: 'h2', h1: 'h1', wL: 'r1L', wR: 'r1R' })[h.kind] }; stzArm(h.st, true);
    if (h.kind === 'zS' && !stzHeightKind(h.st)) updateStatus(`⚠「${h.st.name}」為移植型式，高度由型式參數決定，無法用拖曳改；請在卡片「型式參數」修改（不按 Shift 拖曳＝整座移動）。`);
    e.stopPropagation(); e.preventDefault();
  }, true);
  window.addEventListener('mousemove', e => {
    const T = stzTipEl();
    if (ST_DRAG) { const s = stzTipText(ST_DRAG); if (s) { T.textContent = s; T.style.left = (e.clientX + 16) + 'px'; T.style.top = (e.clientY + 14) + 'px'; T.style.display = 'block'; } return; }
    if (T.style.display !== 'none') T.style.display = 'none';
    if (e.target !== cadCanvas || state.panDrag) { STZ.last = null; return; }
    const h = stzHit(e), key = h ? h.st.id + '|' + h.kind : null;
    if (key && key !== STZ.last) updateStatus(stzHoverHint(h));
    STZ.last = key;
  });
  window.addEventListener('mouseup', () => {
    if (STZ.tip) STZ.tip.style.display = 'none';
    if (STZ.arm && (state.viewMode === 'PROFILE' || state.viewMode === 'CROSS')) setTimeout(() => { const st = STZ.arm; if (st && state.structs.includes(st) && !st.par) updateStatus(`「${st.name}」${stzTopName(st)} EL ${stf(stPlace(st).zS)}、底 EL ${stf(stPlace(st).zB)}${st.link ? '（設計線已跟著動）' : ''}。可按 ↑↓ 微調（Shift 0.5 m），Esc 取消。`); }, 30);
  });
})();

/* 點 ◆頂／◆底 後不把游標停在 zB／h2 欄位（否則 ↑↓ 會變成改欄位值），↑↓ 留給 S5 整座移動 */
(function () {
  const _l = stLocate;
  stLocate = function (st, path) {
    const out = _l.apply(this, arguments);
    if ((path === 'zB' || path === 'p.h2') && STZ.hcT && Date.now() - STZ.hcT < 1500) {
      STZ.hcT = 0; const id = stIdOf(path), bl = () => { const a = document.activeElement; if (a && a.id === id) a.blur(); };
      setTimeout(bl, 20); setTimeout(bl, 160); stzArm(st);
    }
    return out;
  };
})();

/* ---------- S1／S5：整座移動 ---------- */
function stzSetZB(st, zb) { if (st.link) st._zT = +zb.toFixed(3); else st.zB = +zb.toFixed(3); }
function stzMove(dz, st) {
  st = st || state.structs[state.structSel]; if (!st || st.par || !Number.isFinite(dz) || Math.abs(dz) < 1e-6) return;
  pushUndoSnapshot(); stzSetZB(st, stPlace(st).zB + dz); stCommitMove(st); st._it = 0; st._boost = 0; ST_SIG = ''; rebuildAlignmentAndSections();
  const pl = stPlace(st); updateStatus(`「${st.name}」整座${dz > 0 ? '上移' : '下移'} ${stf(Math.abs(dz))} m：${stzTopName(st)} EL ${stf(pl.zS)}、底 EL ${stf(pl.zB)}${st.link ? '（設計線已跟著動）' : '（只動結構物）'}。`);
}
function stzSetTop(v) {
  const st = state.structs[state.structSel]; v = parseFloat(v); if (!st || !Number.isFinite(v)) return;
  stzMove(+(v - stPlace(st).zS).toFixed(3), st);
}
function stzBtn(e, s) { stzMove(s * (e && e.shiftKey ? 0.5 : 0.05)); }
function stzRowHTML(st) {
  const pl = stPlace(st);
  return `<span style="color:var(--cad-amber);font-weight:bold;">整座${stzTopName(st)} EL</span>
    <input id="stzTop" type="number" step="0.05" value="${(+pl.zS).toFixed(2)}" style="width:80px;" onchange="stzSetTop(this.value)" onkeydown="if(event.key==='Enter'){this.blur();}" title="輸入頂高程＝整座上下移動（h2 不變）">
    <button class="btn" style="padding:1px 7px;" onclick="stzBtn(event,1)" title="整座上移 0.05 m（Shift 0.5 m）">▲</button><button class="btn" style="padding:1px 7px;" onclick="stzBtn(event,-1)" title="整座下移 0.05 m（Shift 0.5 m）">▼</button>
    <span id="stzLinkHint" style="font-size:10.5px;color:${st.link ? '#0369a1' : '#c2410c'};">${st.link ? '連動：設計線會跟著動' : '獨立：只動結構物'}</span>`;
}
(function () {
  const _r = stRenderUI;
  stRenderUI = function () {
    const out = _r.apply(this, arguments);
    try {
      const e = document.getElementById('stElev'), st = state.structs[state.structSel];
      if (e && st && !st.par && !state.stAccSel) {
        let r = document.getElementById('stzRow');
        if (!r) { r = document.createElement('div'); r.id = 'stzRow'; r.style.cssText = 'display:flex;gap:5px;align-items:center;flex-wrap:wrap;margin-top:4px;font-size:11px;'; e.parentNode.insertBefore(r, e); }
        r.innerHTML = stzRowHTML(st);
      }
    } catch (err) { console.error('stzRow', err); }
    return out;
  };
  const _u = stUpdDyn;
  stUpdDyn = function () {
    const out = _u.apply(this, arguments);
    const i = document.getElementById('stzTop'), st = state.structs[state.structSel];
    if (i && st && document.activeElement !== i) i.value = (+stPlace(st).zS).toFixed(2);
    return out;
  };
})();

/* ---------- S5：↑↓ 鍵 ---------- */
function stzKeyCommit() {
  const st = STZ.kst; STZ.kt = null; STZ.kst = null; const q = STZ.kq; STZ.kq = 0; if (!st || !state.structs.includes(st)) return;
  stCommitMove(st); st._it = 0; st._boost = 0; ST_SIG = ''; rebuildAlignmentAndSections();
  const pl = stPlace(st); updateStatus(`「${st.name}」整座${q > 0 ? '上移' : '下移'} ${stf(Math.abs(q))} m：${stzTopName(st)} EL ${stf(pl.zS)}、底 EL ${stf(pl.zB)}${st.link ? '（設計線已跟著動）' : '（只動結構物）'}。↑↓ 繼續，Esc 取消。`);
}
window.addEventListener('keydown', e => {
  const v = state.viewMode; if (v !== 'PROFILE' && v !== 'CROSS') return;
  if (e.target && /INPUT|SELECT|TEXTAREA/.test(e.target.tagName)) return;
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  const st = STZ.arm; if (!st || !state.structs.includes(st) || st.par) { STZ.arm = null; return; }
  if (e.key === 'Escape') { if (STZ.kt) { clearTimeout(STZ.kt); stzKeyCommit(); } STZ.arm = null; updateStatus(`已取消選取「${st.name}」（↑↓ 不再移動結構物）。`); return; }
  if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
  e.preventDefault(); e.stopImmediatePropagation();
  const d = (e.key === 'ArrowUp' ? 1 : -1) * (e.shiftKey ? 0.5 : 0.05);
  if (!STZ.kt) { pushUndoSnapshot(); STZ.kst = st; STZ.kq = 0; } else clearTimeout(STZ.kt);
  STZ.kq = +(STZ.kq + d).toFixed(3); stzSetZB(st, stPlace(st).zB + d); stRecalc(true); requestRedraw();
  const pl = stPlace(st); updateStatus(`「${st.name}」${stzTopName(st)} EL ${stf(pl.zS)}、底 EL ${stf(pl.zB)}（累計 ${STZ.kq > 0 ? '+' : ''}${stf(STZ.kq)} m，停手後重算設計線）`);
  STZ.kt = setTimeout(stzKeyCommit, 400);
}, true);

/* ---------- T5：移植型式外包 h2 依型式參數重算 ---------- */
(function () {
  const _r = stRecalc;
  stRecalc = function (noUI) {
    (state.structs || []).forEach(st => { if (!stzIsSlt(st) || st._gDrag) return; try { const h = st.p.h2; sltSync(st); if (Math.abs(st.p.h2 - h) > 1e-6) st._stzFix = 1; } catch (e) { } });
    return _r.apply(this, arguments);
  };
})();

/* ---------- S3：全圖／點清單跳到結構物 ---------- */
function stzViewWH() { const dpr = window.devicePixelRatio || 1, T = state.textScale; return { w: cadCanvas.width / dpr / T, h: cadCanvas.height / dpr / T }; }
(function () {
  const _f = viewFit;
  viewFit = function () {
    const P = state.profileView;
    if (state.viewMode !== 'PROFILE' || !P || !state.cams.PROFILE) return _f.apply(this, arguments);
    const { w, h } = stzViewWH(), W = P.padL + P.graphW + 45, H = P.padT + P.graphH + (P.padB || 0);
    if (W <= w + 1 && H <= h + 1) return _f.apply(this, arguments);
    const k = Math.min(1, w / W, h / H);
    camSave('PROFILE', true); Object.assign(state.cams.PROFILE, { k, tx: (w - W * k) / 2, ty: Math.max(0, (h - H * k) / 2) });
    requestRedraw(); updateStatus(`⛶ 已回到全圖（固定比例，縮放 ${(k * 100).toFixed(0)}%）。`);
  };
  const _s = stSelect;
  stSelect = function (i) {
    const out = _s.apply(this, arguments), st = state.structs[i];
    if (!st) return out;
    if (state.viewMode === 'PROFILE') stzPanTo(st);
    else if (state.viewMode === 'CROSS' && state.crossDisplayMode === 'GRID') setCrossDisplayMode('SINGLE');
    if (state.viewMode === 'PROFILE' || state.viewMode === 'CROSS') stzArm(st);
    return out;
  };
})();
function stzPanTo(st) {
  const P = state.profileView, c = state.cams.PROFILE; if (!P || !c) return;
  const bx = P.padL + (st.sta - P.minSta) / ((P.maxSta - P.minSta) || 1) * P.graphW, pl = stPlace(st), zm = (pl.zB + pl.zS) / 2;
  const by = P.padT + P.graphH - (zm - P.minZ) / ((P.maxZ - P.minZ) || 1) * P.graphH, { w, h } = stzViewWH();
  const sx = bx * c.k + c.tx, sy = by * c.k + c.ty;
  if (sx > w * 0.15 && sx < w * 0.85 && sy > h * 0.1 && sy < h * 0.9) return;
  camSave('PROFILE', true); c.tx = w / 2 - bx * c.k; c.ty = h * 0.42 - by * c.k; requestRedraw();
}

/* ---------- S4：橫斷矩陣點到有結構物的格子 → 切單一圖 ---------- */
window.addEventListener('load', () => cadCanvas.addEventListener('mousedown', e => {
  if (state.viewMode !== 'CROSS' || state.crossDisplayMode !== 'GRID' || e.button !== 0 || state.panMode || e.shiftKey || e.altKey) return;
  const rect = cadCanvas.getBoundingClientRect(), b = camInv(e.clientX - rect.left, e.clientY - rect.top), c = (state._xcells || []).find(c => b.x >= c.x && b.x <= c.x + c.w && b.y >= c.y && b.y <= c.y + c.h);
  if (!c) return; const sec = state.sections[c.idx]; if (!sec) return; const L = stAtSec(sec); if (!L.length) return;
  setTimeout(() => {
    if (state.crossDisplayMode !== 'GRID') return;
    selectStationIndex(c.idx); setCrossDisplayMode('SINGLE'); stzArm(L[0], true);
    updateStatus(`已切到單一橫斷面 ${formatStation(sec.sta)}（${L.map(s => s.name).join('、')}）：拖曳 ◆ 控點或按 ↑↓ 可整座上下移動。`);
  }, 0);
}));
