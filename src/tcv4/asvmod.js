/* ============================================================================
   v6.6 自動存檔與當機復原 (asvmod)
   ・每 30 秒檢查專案內容；有變更才寫入瀏覽器 IndexedDB（不寫硬碟、不影響 .tcproj）
   ・切到背景／關閉分頁時再補存一次
   ・手動「另存／Ctrl+S」成功或「載入專案」後，視為已存檔，刪除本分頁的自動備份
   ・開啟時若有其他分頁留下、且已關閉的備份（＝上次未存檔就關閉或當機），跳出復原提示
   ・最多保留 5 份；狀態列右側「🛟」可隨時開啟備份清單
   ============================================================================ */
const ASV = { db: null, ok: true, sid: 's' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7), base: null, last: '', t: 0, busy: false, err: '', MAX: 5, TICK: 30000, HB: 10000 };
function asvOpen() {
  if (ASV.db) return Promise.resolve(ASV.db);
  return new Promise((res, rej) => {
    try {
      const rq = indexedDB.open('DiZhuAutosave', 1);
      rq.onupgradeneeded = () => { const d = rq.result; if (!d.objectStoreNames.contains('snaps')) d.createObjectStore('snaps', { keyPath: 'id' }); };
      rq.onsuccess = () => { ASV.db = rq.result; res(ASV.db); };
      rq.onerror = () => rej(rq.error);
    } catch (e) { rej(e); }
  });
}
function asvTx(mode, fn) {
  return asvOpen().then(db => new Promise((res, rej) => {
    const tx = db.transaction('snaps', mode), st = tx.objectStore('snaps'); let out;
    const r = fn(st); if (r) r.onsuccess = () => { out = r.result; };
    tx.oncomplete = () => res(out); tx.onerror = () => rej(tx.error); tx.onabort = () => rej(tx.error);
  }));
}
const asvAll = () => asvTx('readonly', st => st.getAll()).then(a => (a || []).sort((x, y) => y.t - x.t));
const asvDel = id => asvTx('readwrite', st => st.delete(id));
/* 專案內容簽章：去掉儲存時間、視角、選取樁號等不算「修改」的欄位 */
function asvJson() {
  const o = collectProject(); o.savedAt = '';
  const D = o.data || {}; const keep = { cam2D: D.cam2D, sel: D.selectedStaIdx };
  delete D.cam2D; delete D.selectedStaIdx;
  const sig = JSON.stringify(o);
  D.cam2D = keep.cam2D; D.selectedStaIdx = keep.sel; o.savedAt = new Date().toISOString();
  return { sig, obj: o };
}
const asvEmpty = () => !(state.points && state.points.length) && !(state.axisNodes && state.axisNodes.length);
function asvDirty() { if (asvEmpty()) return false; try { return asvJson().sig !== ASV.base; } catch (e) { return false; } }
/* 以目前內容作為「已存檔」基準 */
function asvMarkClean(delay) {
  const f = () => { try { ASV.base = asvJson().sig; ASV.last = ASV.base; } catch (e) { } asvDel(ASV.sid).catch(() => { }); asvBadge(); };
  if (delay) setTimeout(f, delay); else f();
}
async function asvSave(force) {
  if (!ASV.ok || ASV.busy) return false;
  if (asvEmpty()) return false;
  let J; try { J = asvJson(); } catch (e) { return false; }
  if (!force && (J.sig === ASV.last || J.sig === ASV.base)) return false;
  ASV.busy = true;
  try {
    const json = JSON.stringify(J.obj), t = Date.now();
    await asvTx('readwrite', st => st.put({ id: ASV.sid, t, name: projName || '', size: json.length, pts: state.points.length, ip: state.axisNodes.length, json }));
    ASV.last = J.sig; ASV.t = t; ASV.err = '';
    const all = await asvAll(); for (const r of all.slice(ASV.MAX)) await asvDel(r.id);
    asvBadge(); return true;
  } catch (e) { ASV.err = (e && e.message) || String(e); console.warn('自動存檔失敗', e); asvBadge(); return false; }
  finally { ASV.busy = false; }
}
/* 心跳：分頁仍開著的備份不算「當機遺留」 */
function asvHb() { try { localStorage.setItem('dizhu_asv_hb_' + ASV.sid, String(Date.now())); } catch (e) { } }
function asvAlive(id) { try { const v = +localStorage.getItem('dizhu_asv_hb_' + id); return v && Date.now() - v < ASV.HB * 2.5; } catch (e) { return false; } }
function asvHbClean() { try { for (let i = localStorage.length - 1; i >= 0; i--) { const k = localStorage.key(i); if (/^dizhu_asv_hb_/.test(k) && Date.now() - (+localStorage.getItem(k) || 0) > 86400000) localStorage.removeItem(k); } } catch (e) { } }
const asvFmt = t => { const d = new Date(t), z = n => String(n).padStart(2, '0'); return `${d.getFullYear()}/${z(d.getMonth() + 1)}/${z(d.getDate())} ${z(d.getHours())}:${z(d.getMinutes())}`; };
const asvAgo = t => { const m = Math.round((Date.now() - t) / 60000); return m < 1 ? '剛剛' : m < 60 ? `${m} 分鐘前` : m < 1440 ? `${Math.round(m / 60)} 小時前` : `${Math.round(m / 1440)} 天前`; };
function asvBadge() {
  const b = document.getElementById('asvBadge'); if (!b) return;
  if (!ASV.ok) { b.textContent = '🛟 自動存檔不可用'; b.className = 'asv-badge bad'; b.title = '瀏覽器不允許 IndexedDB（例如無痕模式），請記得手動存檔。' + (ASV.err ? '\n' + ASV.err : ''); return; }
  if (ASV.err) { b.textContent = '🛟 自動存檔失敗'; b.className = 'asv-badge bad'; b.title = ASV.err + '\n請手動存檔（Ctrl+S）。'; return; }
  const dirty = ASV.base !== null && ASV.last !== ASV.base;
  b.className = 'asv-badge' + (dirty ? ' dirty' : '');
  b.textContent = ASV.t && dirty ? `🛟 自動存檔 ${asvFmt(ASV.t).slice(11)}` : '🛟 自動存檔';
  b.title = (dirty ? '有尚未存成 .tcproj 的修改；已暫存在瀏覽器，當機或誤關可復原。\n' : '目前內容與最後一次存檔／載入相同。\n') + '每 30 秒檢查一次，有修改才備份（最多保留 5 份）。點一下查看備份清單。';
}
/* 備份清單／復原提示 */
async function asvDlg(on, auto) {
  let el = document.getElementById('asvDlg'); if (on === false) { if (el) el.remove(); return; }
  let L = []; try { L = await asvAll(); } catch (e) { ASV.ok = false; ASV.err = (e && e.message) || String(e); asvBadge(); }
  const others = L.filter(r => r.id !== ASV.sid && !asvAlive(r.id));
  if (auto && !others.length) return;
  if (!el) { el = document.createElement('div'); el.id = 'asvDlg'; document.body.appendChild(el); }
  const e = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const row = r => {
    const mine = r.id === ASV.sid, busy = !mine && asvAlive(r.id);
    return `<div class="asv-row${mine ? ' mine' : ''}"><div class="asv-l"><b>${e(r.name || '（未命名專案）')}</b>${mine ? '<i>本分頁</i>' : busy ? '<i>另一個分頁開啟中</i>' : ''}<br>
      <span>${asvFmt(r.t)}（${asvAgo(r.t)}）・測點 ${r.pts ?? '-'}・IP ${r.ip ?? '-'}・${(r.size / 1024).toFixed(0)} KB</span></div>
      <div class="asv-b">${mine ? '' : `<button class="btn green" onclick="asvRestore('${r.id}')">還原</button>`}<button class="btn" onclick="asvDown('${r.id}')">存成檔案</button>${mine ? '' : `<button class="btn" onclick="asvDrop('${r.id}')">捨棄</button>`}</div></div>`;
  };
  const show = auto ? others : L;
  el.innerHTML = `<div class="asv-box"><div class="asv-hd"><b>${auto ? '⚠ 發現未存檔的自動備份' : '🛟 自動存檔備份'}</b><span style="flex:1"></span><button class="btn" onclick="asvDlg(false)">✕</button></div>
    <div class="asv-bd">${auto ? '<p>上次關閉前有修改尚未存成 .tcproj（可能是當機、誤關分頁或瀏覽器重開）。要還原嗎？還原前目前畫面的內容會被取代。</p>' : '<p>備份只存在這台電腦的這個瀏覽器，不會上傳。手動存檔或載入專案後，本分頁的備份會自動清除。</p>'}
    ${show.length ? show.map(row).join('') : '<div class="asv-none">目前沒有自動備份。</div>'}</div>
    <div class="asv-ft">${auto ? `<button class="btn" onclick="asvDropAll()">全部捨棄</button><button class="btn" onclick="asvDlg(false)">稍後再說</button>` : `<button class="btn" onclick="asvSave(true).then(()=>asvDlg(true))">立即備份</button><button class="btn" onclick="asvDlg(false)">關閉</button>`}</div></div>`;
}
async function asvGet(id) { return asvTx('readonly', st => st.get(id)); }
async function asvRestore(id) {
  const r = await asvGet(id); if (!r) { alert('找不到這份備份。'); return asvDlg(true); }
  if (!asvEmpty() && asvDirty() && !confirm('目前畫面有尚未存檔的修改，還原會取代它（目前內容仍會先自動備份一份）。確定還原？')) return;
  if (!asvEmpty() && asvDirty()) await asvSave(true);
  try {
    applyProject(JSON.parse(r.json), r.name || '自動備份');
    projName = r.name || ''; projHandle = null;
    await asvDel(id);
    setTimeout(() => { ASV.base = '(restored)'; ASV.last = ''; asvSave(true); }, 1600);   // 還原內容尚未存成檔案：保持「未存檔」並立刻改存在本分頁名下
    asvDlg(false);
    updateStatus(`🛟 已還原自動備份「${r.name || '未命名'}」(${asvFmt(r.t)})。請記得按 Ctrl+S 存成 .tcproj。`);
  } catch (err) { console.error(err); alert('還原失敗：' + err.message); }
}
async function asvDown(id) {
  const r = await asvGet(id); if (!r) return;
  const d = new Date(r.t), z = n => String(n).padStart(2, '0');
  const nm = (r.name || '未命名').replace(/\.tcproj$/i, '') + `_自動備份_${d.getFullYear()}${z(d.getMonth() + 1)}${z(d.getDate())}_${z(d.getHours())}${z(d.getMinutes())}.tcproj`;
  downloadBlob(r.json, nm, 'application/json');
}
async function asvDrop(id) { if (!confirm('捨棄這份自動備份？捨棄後無法復原。')) return; const auto = !!document.querySelector('#asvDlg [onclick^="asvDropAll"]'); await asvDel(id); if (auto) { asvDlg(false); asvDlg(true, true); } else asvDlg(true); }
async function asvDropAll() { if (!confirm('捨棄所有已關閉分頁留下的自動備份？')) return; for (const r of await asvAll()) if (r.id !== ASV.sid && !asvAlive(r.id)) await asvDel(r.id); asvDlg(false); }
(function () {
  const s = document.createElement('style');
  s.textContent = `.asv-badge { cursor:pointer; font-size:calc(11px * var(--ts, 1)); color:#64748b; padding:2px 6px; border-radius:4px; white-space:nowrap; user-select:none; }
  .asv-badge:hover { background:#f1f5f9; } .asv-badge.dirty { color:#0369a1; } .asv-badge.bad { color:#b91c1c; font-weight:700; }
  #asvDlg { position:fixed; inset:0; background:rgba(15,23,42,.35); z-index:9000; display:flex; align-items:flex-start; justify-content:center; padding-top:8vh; }
  #asvDlg .asv-box { background:#fff; color:#0f172a; width:min(620px, 94vw); max-height:80vh; display:flex; flex-direction:column; border-radius:8px; box-shadow:0 10px 30px rgba(0,0,0,.25); font-size:calc(13px * var(--ts, 1)); }
  #asvDlg .asv-hd { display:flex; align-items:center; gap:8px; padding:8px 12px; border-bottom:1px solid #e2e8f0; }
  #asvDlg .asv-bd { padding:8px 12px; overflow:auto; } #asvDlg .asv-bd p { margin:0 0 8px; color:#475569; line-height:1.6; }
  #asvDlg .asv-row { display:flex; gap:8px; align-items:center; padding:6px 8px; border:1px solid #e2e8f0; border-radius:6px; margin-bottom:6px; }
  #asvDlg .asv-row.mine { background:#f8fafc; } #asvDlg .asv-row i { margin-left:6px; font-style:normal; font-size:.85em; color:#0369a1; }
  #asvDlg .asv-row span { font-size:.88em; color:#64748b; } #asvDlg .asv-l { flex:1; min-width:0; } #asvDlg .asv-b { display:flex; gap:4px; flex-wrap:wrap; }
  #asvDlg .asv-none { color:#94a3b8; padding:12px 0; text-align:center; }
  #asvDlg .asv-ft { display:flex; justify-content:flex-end; gap:8px; padding:8px 12px; border-top:1px solid #e2e8f0; }`;
  document.head.appendChild(s);
  /* 手動存檔成功（兩種路徑都會顯示「💾 專案已…」）→ 視為已存檔 */
  const _us = updateStatus; updateStatus = function (msg) { const r = _us.apply(this, arguments); if (typeof msg === 'string' && /^💾 專案已(儲存|下載)/.test(msg)) asvMarkClean(0); return r; };
  /* 載入專案 → 以載入後內容為基準（等各模組重建完成） */
  const _ap = applyProject; applyProject = function () { const r = _ap.apply(this, arguments); ASV.base = null; asvMarkClean(1500); return r; };
  window.addEventListener('load', () => setTimeout(async () => {
    const ref = document.getElementById('btnPkg') || document.getElementById('btnChk');
    if (ref && !document.getElementById('asvBadge')) { const b = document.createElement('span'); b.id = 'asvBadge'; b.className = 'asv-badge'; b.onclick = () => asvDlg(true); ref.parentNode.insertBefore(b, ref.nextSibling); }
    try { if (!window.indexedDB) throw new Error('no indexedDB'); await asvOpen(); } catch (e) { ASV.ok = false; ASV.err = (e && e.message) || String(e); }
    try { ASV.base = asvJson().sig; ASV.last = ASV.base; } catch (e) { ASV.base = ''; }
    asvHb(); asvHbClean(); setInterval(asvHb, ASV.HB);
    setInterval(() => asvSave(false), ASV.TICK);
    asvBadge();
    if (ASV.ok) asvDlg(true, true);
  }, 400));
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') asvSave(false); });
  window.addEventListener('pagehide', () => { asvSave(false); try { localStorage.removeItem('dizhu_asv_hb_' + ASV.sid); } catch (e) { } });
  window.addEventListener('beforeunload', ev => { if (ASV.base !== null && asvDirty()) { asvSave(false); ev.preventDefault(); ev.returnValue = ''; } });
})();
