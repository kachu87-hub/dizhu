/* ============================================================================
   v6.3i 中心線繪製輔助：即時顯示段長／方位角／偏角／累計長；鍵入長度（25、25<30）；長度吸附（Shift＝不吸附）；
   拖曳 IP 時顯示前後兩段長；平面圖可標示各段長度（含 DXF）
   方位角：自北順時針（N＝0°、E＝90°）；偏角：與前一段方向之差（右偏＋、左偏−）
   ============================================================================ */
state.clDraw = Object.assign({ snap: 0.5, seg: false }, state.clDraw || {});
const CLD = { typing: null };
function cldNorm(o) { o = o || {}; const s = +o.snap; return { snap: [0, 0.5, 1].includes(s) ? s : 0.5, seg: !!o.seg }; }
function cldAz(dx, dy) { let a = Math.atan2(dx, dy) * 180 / Math.PI; if (a < 0) a += 360; return a; }
function cldDMS(a) { a = ((a % 360) + 360) % 360; let d = Math.floor(a), m = Math.floor((a - d) * 60), s = Math.round(((a - d) * 60 - m) * 60); if (s === 60) { s = 0; m++; } if (m === 60) { m = 0; d++; } return `${d}°${String(m).padStart(2, '0')}'${String(s).padStart(2, '0')}"`; }
function cldDefl(a0, a1) { let d = a1 - a0; while (d > 180) d -= 360; while (d < -180) d += 360; return d; }
function cldCum(nodes) { let L = 0; for (let i = 1; i < nodes.length; i++) L += Math.hypot(nodes[i].x - nodes[i - 1].x, nodes[i].y - nodes[i - 1].y); return L; }
/* 游標世界點 → 依長度吸附後的點（方向不變） */
function cldSnapPt(w, shift) {
  const N = state.tempAxisNodes, last = N[N.length - 1]; if (!last) return w;
  const st = state.clDraw.snap; if (shift || !(st > 0)) return w;
  const dx = w.x - last.x, dy = w.y - last.y, L = Math.hypot(dx, dy); if (L < 1e-6) return w;
  const L2 = Math.max(st, Math.round(L / st) * st); return { x: last.x + dx / L * L2, y: last.y + dy / L * L2 };
}
function cldInfo(N, p) {   // N＝已點節點，p＝候選點 → 文字列
  const last = N[N.length - 1]; if (!last) return null;
  const dx = p.x - last.x, dy = p.y - last.y, L = Math.hypot(dx, dy), az = cldAz(dx, dy), o = [`段長 ${L.toFixed(2)} m`, `方位角 ${cldDMS(az)}`];
  if (N.length >= 2) { const q = N[N.length - 2], a0 = cldAz(last.x - q.x, last.y - q.y), d = cldDefl(a0, az); o.push(`偏角 ${d >= 0 ? '右' : '左'} ${cldDMS(Math.abs(d))}`); }
  o.push(`累計 ${(cldCum(N) + L).toFixed(2)} m`); return o;
}
function cldBox(c, x, y, lines, col) {
  c.save(); c.font = '12px "JetBrains Mono","Noto Sans TC"'; const w = Math.max(...lines.map(t => c.measureText(t).width)) + 12, h = lines.length * 16 + 8;
  const bx = x + 16, by = y + 14; c.fillStyle = 'rgba(11,16,24,0.88)'; c.strokeStyle = col || '#00e676'; c.lineWidth = 1; c.fillRect(bx, by, w, h); c.strokeRect(bx, by, w, h);
  c.fillStyle = '#e2e8f0'; c.textAlign = 'left'; c.textBaseline = 'top'; lines.forEach((t, i) => c.fillText(t, bx + 6, by + 5 + i * 16)); c.restore();
}
/* ---- 覆蓋層：橡皮筋資訊 ---- */
(function () {
  const _ao = axisOvDraw; axisOvDraw = function () {
    _ao.apply(this, arguments);
    try {
      if (state.viewMode !== '2D' || state.activeTool !== 'DRAW_AXIS' || !AXOV_LAST) return; const N = state.tempAxisNodes; if (!N.length) return;
      const ov = document.getElementById('axisOverlay'); if (!ov) return; const oc = ov.getContext('2d'), d = window.devicePixelRatio || 1; oc.setTransform(d, 0, 0, d, 0, 0);
      const sn = typeof dzSnapPt === 'function' ? dzSnapPt(AXOV_LAST.x, AXOV_LAST.y) : null, w = sn ? { x: sn.x, y: sn.y } : cldSnapPt(screenToWorld2D(AXOV_LAST.x, AXOV_LAST.y), CLD.shift), s = worldToScreen2D(w.x, w.y);
      if (!sn) { const l = worldToScreen2D(N[N.length - 1].x, N[N.length - 1].y); oc.strokeStyle = '#00e676'; oc.lineWidth = 2.2; oc.beginPath(); oc.moveTo(l.x, l.y); oc.lineTo(s.x, s.y); oc.stroke(); oc.fillStyle = '#00e676'; oc.beginPath(); oc.arc(s.x, s.y, 4, 0, Math.PI * 2); oc.fill(); }
      const L = cldInfo(N, w); if (L) { if (CLD.typing !== null) L.push(`鍵入：${CLD.typing}▏（Enter 確定、Esc 取消）`); else L.push(sn ? '🧲 鎖點' : (state.clDraw.snap > 0 && !CLD.shift ? `長度吸附 ${state.clDraw.snap} m（Shift＝不吸附）` : '不吸附')); L.push('鍵入數字＝定長，如 25 或 25<30（方位角）'); cldBox(oc, s.x, s.y, L); }
    } catch (e) { console.error('cldOv', e); }
  };
  window.addEventListener('keyup', e => { if (e.key === 'Shift') { CLD.shift = false; if (state.activeTool === 'DRAW_AXIS') axisOvDraw(); } }, true);
  // 左鍵點選：無物件鎖點時，套用長度吸附（物件鎖點優先，由原處理）
  window.addEventListener('mousedown', e => {
    if (e.target && e.target.id !== 'cadCanvas' && e.target.id !== 'axisOverlay') return; if (e.button !== 0 || state.viewMode !== '2D' || state.activeTool !== 'DRAW_AXIS') return;
    const r = cadCanvas.getBoundingClientRect(), mx = e.clientX - r.left, my = e.clientY - r.top; if (typeof dzSnapPt === 'function' && dzSnapPt(mx, my)) return;
    const N = state.tempAxisNodes; if (!N.length) return;   // 起點照原處理
    const w = cldSnapPt(screenToWorld2D(mx, my), e.shiftKey), last = N[N.length - 1]; if (Math.hypot(w.x - last.x, w.y - last.y) < 0.05) return;
    e.preventDefault(); e.stopImmediatePropagation(); cldPush(w);
  }, true);
  window.addEventListener('mousemove', e => { CLD.shift = e.shiftKey; }, true);
  // 鍵入長度：數字、小數點、<、Backspace；Enter 確定、Esc 取消
  window.addEventListener('keydown', e => {
    if (state.activeTool !== 'DRAW_AXIS' || state.viewMode !== '2D') return; if (e.target && /INPUT|SELECT|TEXTAREA/.test(e.target.tagName)) return;
    if (e.key === 'Shift') { CLD.shift = true; axisOvDraw(); return; }
    if (!state.tempAxisNodes.length) return;
    const k = e.key;
    if (/^[0-9.]$/.test(k) || (k === '<' && CLD.typing !== null && !CLD.typing.includes('<'))) { CLD.typing = (CLD.typing || '') + k; }
    else if (CLD.typing !== null && k === 'Backspace') { CLD.typing = CLD.typing.slice(0, -1); if (!CLD.typing) CLD.typing = null; }
    else if (CLD.typing !== null && k === 'Escape') { CLD.typing = null; }
    else if (CLD.typing !== null && k === 'Enter') { const t = CLD.typing; CLD.typing = null; cldTyped(t); }
    else return;
    e.preventDefault(); e.stopImmediatePropagation(); axisOvDraw(); updateStatus(CLD.typing !== null ? `⌨ 鍵入：${CLD.typing}（Enter 確定；25＝沿游標方向 25 m；25<30＝方位角 30° 方向 25 m）` : '📏 繪中心線');
  }, true);
})();
function cldPush(w) {
  const defR = Math.max(0, parseFloat((document.getElementById('defaultIpRadius') || {}).value) || 0), N = state.tempAxisNodes; N.push({ x: +w.x.toFixed(3), y: +w.y.toFixed(3), r: defR });
  const I = cldInfo(N.slice(0, -1), w) || []; updateStatus(`📏 已點 [${N.length === 1 ? 'BP' : 'IP' + (N.length - 1)}]　${I.slice(0, 4).join('　')}；繼續點選，右鍵／Enter／雙擊結束；Backspace 退回。`); requestRedraw(); axisOvDraw();
}
function cldTyped(t) {
  const N = state.tempAxisNodes, last = N[N.length - 1]; if (!last) return; const m = String(t).split('<'), L = parseFloat(m[0]); if (!(L > 0)) { updateStatus('⚠ 長度須大於 0。'); return; }
  let az;
  if (m.length > 1 && m[1] !== '') { az = parseFloat(m[1]); if (!Number.isFinite(az)) { updateStatus('⚠ 方位角格式錯誤（例：25<30）。'); return; } }
  else if (AXOV_LAST) { const w = screenToWorld2D(AXOV_LAST.x, AXOV_LAST.y); az = cldAz(w.x - last.x, w.y - last.y); }
  else if (N.length >= 2) { const q = N[N.length - 2]; az = cldAz(last.x - q.x, last.y - q.y); } else az = 0;
  const a = az * Math.PI / 180; cldPush({ x: last.x + L * Math.sin(a), y: last.y + L * Math.cos(a) });
}
/* ---- 平面：拖曳 IP 時的前後段長、各段長度標示 ---- */
function cldSegs() { const N = state.axisNodes || [], o = []; for (let i = 1; i < N.length; i++) { const a = N[i - 1], b = N[i]; o.push({ i, a, b, L: Math.hypot(b.x - a.x, b.y - a.y), az: cldAz(b.x - a.x, b.y - a.y) }); } return o; }
(function () {
  const _ha = drawHorizontalAlignmentOnCanvas; drawHorizontalAlignmentOnCanvas = function () {
    _ha.apply(this, arguments);
    try {
      if (state.viewMode !== '2D') return; const S = cldSegs(); if (!S.length) return; const di = state.draggingIPIdx;
      const lab = (sg, col, big) => { const p = worldToScreen2D((sg.a.x + sg.b.x) / 2, (sg.a.y + sg.b.y) / 2), q = worldToScreen2D(sg.b.x, sg.b.y), q0 = worldToScreen2D(sg.a.x, sg.a.y); let ang = Math.atan2(q.y - q0.y, q.x - q0.x); if (ang > Math.PI / 2) ang -= Math.PI; if (ang < -Math.PI / 2) ang += Math.PI;
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(ang); ctx.font = `${big ? 'bold 13px' : '11px'} "JetBrains Mono","Noto Sans TC"`; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom'; const t = `L=${sg.L.toFixed(2)} m  ${cldDMS(sg.az)}`; ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(7,10,15,0.9)'; ctx.strokeText(t, 0, -4); ctx.fillStyle = col; ctx.fillText(t, 0, -4); ctx.restore(); };
      if (state.clDraw.seg) S.forEach(sg => lab(sg, '#a7f3d0', false));
      if (di >= 0) { S.filter(sg => sg.i === di || sg.i === di + 1).forEach(sg => lab(sg, '#fde047', true)); const N = state.axisNodes, I = N[di], s = worldToScreen2D(I.x, I.y), L = [`IP 拖曳中`];
        if (di >= 1) L.push(`前段 ${Math.hypot(I.x - N[di - 1].x, I.y - N[di - 1].y).toFixed(2)} m`); if (di + 1 < N.length) L.push(`後段 ${Math.hypot(N[di + 1].x - I.x, N[di + 1].y - I.y).toFixed(2)} m`);
        if (di >= 1 && di + 1 < N.length) { const d = cldDefl(cldAz(I.x - N[di - 1].x, I.y - N[di - 1].y), cldAz(N[di + 1].x - I.x, N[di + 1].y - I.y)); L.push(`偏角 ${d >= 0 ? '右' : '左'} ${cldDMS(Math.abs(d))}`); }
        cldBox(ctx, s.x, s.y, L, '#fde047'); }
    } catch (e) { console.error('cldPlan', e); }
  };
  const _xp = rvDxfPlan; rvDxfPlan = function (D) { _xp(D); try { if (!state.clDraw.seg) return; cldSegs().forEach(sg => { const mx = (sg.a.x + sg.b.x) / 2, my = (sg.a.y + sg.b.y) / 2; let r = Math.atan2(sg.b.y - sg.a.y, sg.b.x - sg.a.x) * 180 / Math.PI; if (r > 90) r -= 180; if (r < -90) r += 180; const a = r * Math.PI / 180;
    D.text(mx - Math.sin(a) * 0.6, my + Math.cos(a) * 0.6, 0.8, `L=${sg.L.toFixed(2)} m  ${cldDMS(sg.az)}`, 'AXIS_SEGLEN', 3, { align: 'c', rot: r }); }); } catch (e) { console.error('cldDxf', e); } };
  const _cp = collectProject; collectProject = function () { const o = _cp(); o.data.clDraw = cldNorm(state.clDraw); return o; };
  const _ap = applyProject; applyProject = function (obj, fname) { state.clDraw = cldNorm(obj && obj.data && obj.data.clDraw); _ap(obj, fname); cldUI(); };
})();
function cldSet(k, v) { if (k === 'snap') state.clDraw.snap = +v; else if (k === 'seg') state.clDraw.seg = !!v; requestRedraw(); }
function cldUI() { const a = document.getElementById('cldSnap'), b = document.getElementById('cldSeg'); if (a) a.value = String(state.clDraw.snap); if (b) b.checked = !!state.clDraw.seg; }
