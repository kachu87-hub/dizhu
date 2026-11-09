/* ============================================================================
   rulemod.js（v6.2）手冊規定檢核提示：水土保持手冊(2017)、單元叢書01/02/03
   只提示、不擋輸入。條文出處寫在每條訊息尾端。
   ============================================================================ */
function ruleStruct(st) {
  const w = [], p = st.p || {}, A = st.a || {}, num = v => Number.isFinite(+v), add = (m, ref) => w.push(`${m}（${ref}）`);
  if (st.type === 'sill') {
    if (num(p.h2) && p.h2 > 1.0 + 1e-9) add(`固床工有效高度 ${(+p.h2).toFixed(2)} m 超過 1.0 m，應改用防砂壩`, '手冊2.3');
    return w;
  }
  const H = +p.h2, hasSpill = num(p.h1) && p.h1 > 1e-6;
  if (H >= 5) {
    const lo = H >= 10 ? 2.0 : 1.5, hi = H >= 10 ? 3.0 : 2.0;
    if (num(p.d1) && (p.d1 < lo - 1e-9 || p.d1 > hi + 1e-9)) add(`壩頂厚 ${(+p.d1).toFixed(2)} m 不在 ${lo}～${hi} m（壩高 ${H} m）；土石流區 3～4 m`, '表3-5');
    if (num(p.h3) && p.h3 < 1.0 - 1e-9) add(`基礎深 ${(+p.h3).toFixed(2)} m 小於 1.0 m`, '3.11');
  }
  if (num(p.s2) && p.s2 >= 0.3 - 1e-9) add(`下游面斜率 1:${p.s2} 未陡於 1:0.3`, '3.9(3)');
  if (hasSpill) {
    const ov = p.h1 - (p.hq || 0);
    if (num(p.hq) && p.hq < 0.6 - 1e-9) add(`出水高 hq ${(+p.hq).toFixed(2)} m 小於 0.6 m`, '表3-4');
    if (ov > 4 + 1e-9) add(`溢流水深約 ${ov.toFixed(2)} m 超過 4.0 m`, '3.8(3)');
    else if (ov > 3 + 1e-9) add(`溢流水深約 ${ov.toFixed(2)} m 超過 3.0 m（僅良好岩盤基礎可到 4.0 m）`, '3.8(3)');
  }
  if (num(p.hsp) && (p.hsp < 2 - 1e-9 || p.hsp > 3 + 1e-9)) add(`排水孔間距 ${p.hsp} m 不在 2～3 m`, '3.9-4');
  if (num(p.hcl) && p.hcl > 0 && (p.hcl < 1.5 - 1e-9 || p.hcl > 2 + 1e-9)) add(`排水孔頂層距溢洪口底 ${p.hcl} m 不在 1.5～2 m`, '3.9-4');
  if (num(p.dh) && p.dh > 0 && (p.dh < 0.2 - 1e-9 || p.dh > 0.6 + 1e-9)) add(`排水孔徑 ${p.dh} m 不在 0.2～0.6 m`, '3.9-4');
  ['L', 'R'].forEach(sd => {
    const g = st.w && st.w[sd]; if (!g || g.auto) return; const nm = sd === 'L' ? '左' : '右';
    if (num(g.r1) && g.r1 > 0 && g.r1 < 5 - 1e-9) add(`${nm}壩翼上斜長 ${g.r1} m 小於 5 m`, '3.10-4');
    if (num(g.rs) && g.rs > 0 && g.rs < 10 - 1e-9 && g.rs >= 0) add(`${nm}壩翼斜率 1:${g.rs} 陡於 1:10（宜 1:10，超過 20 m 部分最緩 1:20）`, '3.10-4');
    if (num(g.r3) && g.r3 > 0 && g.r3 < 1.5 - 1e-9) add(`${nm}壩翼嵌入深 ${g.r3} m 小於 1.5 m（砂礫地質需大於 2 m）`, '3.10-3');
  });
  if (A.apron && A.apron.on && typeof stAccV === 'function') {
    try {
      if (num(A.apron.cL) && A.apron.cL < 2 - 1e-9) add(`護坦／水墊長度係數 cL＝${A.apron.cL} 小於 2.0`, '式3-98/3-100');
      const kd = stAccV(st, 'apron', 'kd'); if (num(kd) && kd > 0 && kd < 1.0 - 1e-9) add(`截水牆嵌入深 ${(+kd).toFixed(2)} m 小於 1.0 m（土砂 ≥2.0、軟岩 ≥1.0、硬岩 ≥0.5）`, '表3-17');
      if (A.tail && A.tail.on && num(A.tail.ht) && H > 0) { const r = A.tail.ht / H; if (r < 0.1 - 1e-9 || r > 0.2 + 1e-9) add(`尾檻高 ${A.tail.ht} m 為主壩高的 ${(r * 100).toFixed(0)}%，宜 10～20%`, '3.12(4)'); }
    } catch (e) { }
  }
  if (A.sill && A.sill.on && typeof stAccV === 'function') {
    try { const sp = stAccV(st, 'sill', 'sp'); if (num(sp) && (sp < 7 - 1e-9 || sp > 25 + 1e-9) && (A.sill.n || 1) > 1) add(`固床工間距 ${(+sp).toFixed(1)} m 不在 7～25 m`, '手冊2.3.5'); } catch (e) { }
  }
  return w;
}
function ruleRev(rv) {
  const w = [], p = rv.p || {}, num = v => Number.isFinite(+v);
  if (rv.type === 'grav' || !rv.type) {
    if (num(p.D) && p.D < 1.0 - 1e-9) w.push(`根入深 ${(+p.D).toFixed(2)} m 小於 1.0 m（建議 1.0～2.0 m 或 H 的 1/3～1/4）（手冊2.6）`);
    if (num(p.n) && (p.n < 0.2 - 1e-9 || p.n > 0.3 + 1e-9)) w.push(`水側坡 1:${p.n} 不在混凝土護岸常用 1:0.2～0.3（手冊2.6）`);
  }
  return w;
}
function ruleAll() {
  const out = [];
  (state.structs || []).forEach(st => { try { ruleStruct(st).forEach(m => out.push(`${st.name}：${m}`)); } catch (e) { } });
  (state.revs || []).forEach(rv => { try { ruleRev(rv).forEach(m => out.push(`${typeof rvName === 'function' ? rvName(rv) : '護岸'}：${m}`)); } catch (e) { } });
  return out;
}
function ruleRender() {
  const box = document.getElementById('stBox'); if (!box || !box.parentNode) return;
  let el = document.getElementById('ruleBox'); if (!el) { el = document.createElement('div'); el.id = 'ruleBox'; box.parentNode.insertBefore(el, box); }
  const L = ruleAll();
  el.innerHTML = L.length ? `<div style="margin:6px 0;padding:6px 8px;border:1px solid #f59e0b;border-radius:4px;background:rgba(245,158,11,.10);font-size:11px;line-height:1.55;"><b style="color:#b45309;">⚠ 與水保手冊不符（${L.length}）</b>　<span style="color:var(--text-muted);">僅提示，不影響繪圖</span><br>${L.map(m => '• ' + escAttr(m)).join('<br>')}</div>` : '';
}
(function () {
  if (typeof stRenderUI === 'function') { const _r = stRenderUI; stRenderUI = function (...a) { const r = _r.apply(this, a); try { ruleRender(); } catch (e) { } return r; }; }
  if (typeof stRecalc === 'function') { const _c = stRecalc; stRecalc = function (...a) { const r = _c.apply(this, a); try { ruleRender(); } catch (e) { } return r; }; }
})();
/* v6.3：縱橫斷面／結構物等分頁的卡片一律預設收合（不自動展開任何一張） */
window.addEventListener('DOMContentLoaded', () => { setTimeout(() => { try { EARTH_GROUPS.forEach(g => { g.open = -1; }); earthCards().forEach(c => c.classList.add('folded')); } catch (e) { } }, 0); });
