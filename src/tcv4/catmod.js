/* ============================================================================
   v5.7 結構物名冊：依「功能」分類，卡片附剖面線稿縮圖（由標準圖自動產生）、名稱、圖號、材質標籤；
   可搜尋、加星號置頂（本機記住）、勾選 2～3 種並排比較；選定後即作為新增型式
   新增型式時只要在 catItems() 補一筆（結構物／固床工型式／護岸型式皆自動列入）
   ============================================================================ */
// v5.9 分類改用「表 2-4 國有林工程構造物種類」編號（不列 29 路面、30 橋梁、32 步道、33 觀景平台、34 修復與補強、35 改建）＋蓄水與沉砂
const CAT_GROUPS = [['1', '防砂設施（防砂壩、潛壩、節制壩）'], ['2', '固床工'], ['3', '護坦與水墊', '附屬於防砂壩，在壩的附屬設施設定'], ['4', '丁壩'], ['5', '土壩'], ['6', '護岸'], ['7', '堤防'], ['8', '護坡'], ['9', '拋石與鋪石'], ['10', '鼎塊'],
  ['11', '擋土牆'], ['12', '基樁'], ['13', '防落石護欄'], ['14', '防落石網'], ['15', '排水溝、洩槽'], ['16', '暗渠'], ['17', '跌水'], ['18', '集水井'], ['19', '地錨'], ['20', '橫向集水管'], ['21', '坡面噴凝土工'],
  ['22', '邊坡植生', '只計面積數量'], ['23', '掛網植生', '只計面積數量'], ['24', '打格編柵', '只計面積數量'], ['25', '格框植生', '只計面積數量'], ['26', '坡面整理', '只計面積數量'], ['27', '清疏'], ['28', '地盤改良'], ['31', '過水路面'], ['36', '生物通道'], ['37', '其他'], ['S', '蓄水與沉砂（滯洪池、沉砂池、農塘）']]
  .map(([k, t, n]) => ({ k, t, n: n || '' }));
const CAT_MAT = { grav: ['混凝土'], dry0402: ['乾砌石'], b403: ['箱籠', '混凝土基礎'], g404: ['土石籠', '混凝土基礎'], s406: ['砌石', '混凝土'], p405: ['預鑄混凝土', '塊石／植生'] };
const CAT_PEND = {};
const CAT_NAMES = {   // 表 2-4「工程管考資訊系統構造物名詞」：各類尚待建置的型式名稱（已建置者自動略過）
  '1': '防砂壩、開口壩、拱壩、透過性壩、梳子壩、潛壩、弧型壩、切口壩、鋼構壩、鋼管壩、鋼柵石籠壩、H型鋼欄石壩、石籠壩、土石籠防砂壩、疊石壩、漿砌塊石壩、木格框欄砂壩、節制壩、石籠節制壩、箱型塊石籠節制壩、節制工、木格柵節制工、木樁節制工、木製節制壩、鋼軌節制工',
  '2': '切口型固床工、拱型固床工、緩坡式砌石固床工、斜坡式固床工、階梯固床工、砌石固床工、塊石固床工、混凝土卵塊石固床工、混凝土塊石固床工、巨石固床工、土石籠固床工、石籠固床工、木柵固床工、木格框固床工、木構固床工、鋼軌固床工',
  '3': '護坦、水墊、消能護坦、植石護坦、排石混凝土護坦、鋪排塊石混凝土護坦、拋石混凝土護坦、塊石混凝土護坦、砌巨石消能工、漿拋石護坦、排石護坦、拋石護坦、石籠護坦、RC護坦、PC護坦、混凝土格框護坦、階梯式護坦、透水性護坦',
  '4': '丁壩', '5': '土壩',
  '6': '整流護岸、半重力式護岸、RC護岸、水泥護岸、鋼筋混凝土護岸、漿砌護岸、砌石護岸、混砌石護岸、漿砌石護岸、背漿排塊石護岸、混凝土砌石護岸、乾砌駁崁、疊塊石護岸、蛇石護岸、石籠護岸、土石籠護岸、格框砌石護岸、人造石護岸、仿岩護岸、造型模板護岸、木構護岸、木樁護岸、木排樁護岸、木製護岸、木製階段護岸、預鑄護岸、預鑄人造石護岸、土石堆置護岸、複式護岸、緩坡護岸、輪胎護岸、擋土柵護岸、型鋼護岸、鋼柵護岸、鋼構護岸、封牆',
  '7': '堤防、堤首工、堤尾工',
  '8': '護坡、土石籠護坡、駁坎護坡、石籠護坡、箱型石籠、乾砌塊石護坡、太空包護坡、太空包堆疊、客土袋護坡、植生袋護坡、土包袋護坡、蜂巢格網護坡、木格框護坡、木格籠護坡、漿砌塊石護坡、砌石護坡、網索護坡、防落石網護坡、生態護坡、木構擋土柵、擋土木柵、擋土木樁、木排樁護坡、鋼軌柵、鋼軌樁護坡',
  '9': '拋填現地塊石、拋石、拋塊石、拋石灌漿、砌排塊石、河床拋石保護、圍砌大塊石深潭、現地塊石回填、密鋪塊石、混凝土鋪石',
  '10': '元鼎塊、鼎型塊、三腳鼎塊、協克塊、混凝土塊、混凝土鼎塊',
  '11': '重力式擋土牆、半重力式擋土牆、懸臂式擋土牆、RC擋土牆、砌石擋土牆、砌塊石擋土牆、乾砌石擋土牆、PC樁擋土牆、基樁擋土牆、排樁擋土牆、鋼軌樁擋土牆、加勁擋土牆、木格框擋土牆、木製堆積式擋土牆、杉木擋土設施、箱型塊擋土牆、景觀式擋土牆、座槽式擋土牆、路基擋土牆、石籠擋土牆、箱型石籠擋土牆、防落石柵擋土牆、L型擋土牆、護牆、端牆、阻隔牆、止滑牆',
  '12': '抗滑樁、排樁、鋼筋樁、混凝土基樁、PC樁、全套管基樁、全套管鑽掘式基樁、鋼板樁、預鑄PC樁、預力混凝土樁、微型樁擋土支撐、H型鋼樁、植入式H型鋼、鋼軌樁、微型樁、注漿樁、阻石樁、帽樑、預力梁、微型樁繫樑、地梁',
  '13': '防落石柵、落石防護柵、攔石柵、型鋼攔石柵、直樁式防落石柵、鋼軌阻石樁', '14': '防落石網、落石防護網',
  '15': '矩型溝、L型溝、矮牆L型溝、U型溝、階梯式排水溝、邊溝、截水溝、截流溝、暗溝、熱浸鍍鋅蓋版截水溝、砌石溝、乾砌石排水溝、卵石溝、漿砌卵石U型溝、漿砌石溝、格柵溝、土包袋溝、土袋截水溝、植生袋溝、客土袋溝、草溝、防沖蝕植生網草溝、生態排水溝、生態渠道、噴漿溝、拍漿溝、噴凝土縱溝、噴漿橫溝、噴漿跌水池、鋪網噴凝土溝、洩槽、蓋版、消能檻、截牆',
  '16': '箱涵、雙孔型箱涵、HDPE管、RCP管、涵管、鋼筋混凝土管、混凝土管、高壓RC管、過路涵管、過路箱涵',
  '17': '跌水工、崁石跌水工、階梯式跌水工、靜水池、噴漿靜水池、格柵靜水池、消能池、梯型跌水工',
  '18': '集水井、集水豎井、匯流井、陰井、匯流池、跌水井、消能集水井、乾砌石集水井、漿砌石集水井、客土袋集水井、木樁集水井',
  '19': '地錨、預力地錨、鋼錨', '20': '橫向集水管、水平集水管', '21': '坡面噴凝土工、噴凝土護坡',
  '22': '邊坡植生、坡面植生、撒播草籽、稻草蓆、灌木植栽、苗木栽植、噴混和草籽', '23': '掛網植生、掛網型框噴植、鋪網客土噴植、鋪網噴植、岩坡穩定菱形網護坡', '24': '打格編柵',
  '25': '格框植生、自由型框噴植、自由型格樑護坡、自由型框掛網噴植植生', '26': '坡面整理、人工整坡、刷坡、危石危木修除、坍方清除、清除雜草、坡面危石鑿除',
  '27': '清疏、河道整理、河道清淤、河道土石疏通、堰塞湖天然壩體降挖', '28': '地盤改良', '31': '過水路面',
  '36': '生態廊道、生態坡道、生態階梯、生態方塊、生態孔、生態池、動物通道、動物攀爬網、魚道、全斷面式魚道、半斷面魚道、塊石魚道、階段式魚道、魚梯',
  '37': '凡未列入之特殊工法、設施或複合性工法', 'S': '滯洪池、沉砂池、農塘'
};
function dzNoCode(s) {   // v6.3：畫面不顯示圖號（內部 code 保留）
  return String(s || '').replace(/[（(]?水保標準圖\s*[0-9A-Za-z#\-－／/~～.]+[，,]?\s*/g, m => /^[（(]/.test(m) ? '（' : '').replace(/（）|（\s*）/g, '').replace(/^（(.*)）$/, '$1').trim();
}
function catItems() {
  const A = [
    { id: 'st:dam', g: '1', name: '防砂壩', sub: '含潛壩、攔砂壩；附屬護坦／側牆／尾檻', code: '標準斷面', mat: ['混凝土'], kind: 'st', type: 'dam' },
    { id: 'st:sub', g: '1', name: '副壩', sub: '主壩下游消能', code: '標準斷面', mat: ['混凝土'], kind: 'st', type: 'sub' }];
  (typeof SLT_ORDER !== 'undefined' ? SLT_ORDER : ['gen']).forEach(k => { const T = SLT[k]; A.push({ id: 'sl:' + k, g: k === 'cdam' ? '1' : '2', alias: k === 'cdam' ? '拱壩 弧型壩 梳子壩 曲型副壩 副壩' : undefined, name: k === 'gen' ? '固床工（一般矩形）' : T.label, sub: k === 'gen' ? '現場混凝土' : '原圖移植', code: T.code || '標準斷面', mat: ({ gen: ['混凝土'], r0607: ['塊石'], e606: ['塊石', '混凝土'], a0608: ['預鑄混凝土', '鋼筋'], g604: ['箱籠', '混凝土基礎'] })[k] || [], kind: 'st', type: 'sill', sty: k }); });
  (typeof TC_ORDER !== 'undefined' ? TC_ORDER : []).forEach(id => { const T = tcType(id); if (T.cat !== 'rev') return; A.push({ id: 'rv:' + id, g: '6', name: T.label, sub: '護岸', code: T.code || '', mat: CAT_MAT[id] || [], kind: 'rv', type: id, note: T.note }); });
  (typeof TC_PEND !== 'undefined' ? TC_PEND : []).forEach(t => A.push({ id: 'pd:' + t.code, g: '11', name: t.label, sub: '擋土牆', code: t.code, mat: ['混凝土'], pend: true }));
  Object.entries(CAT_PEND).forEach(([g, L]) => L.forEach(([n, m]) => A.push({ id: 'pd:' + n, g, name: n, sub: '', code: '', mat: m ? [m] : [], pend: true })));
  A.push({ id: 'bio:1', g: '36', name: '生物通道（動物通道、生態斜坡道）', sub: '附掛於護岸頂線；需先有護岸', code: '#3-#10', mat: ['混凝土'], kind: 'bio', alias: '動物通道 生態坡道 生態斜坡道 生物坡道 動物攀爬' });
  (typeof DN_ORDER !== 'undefined' ? DN_ORDER : []).forEach(k => { const T = DN_TYPES[k]; A.push({ id: 'dn:' + k, g: '15', name: T.label, sub: '排水溝', code: T.code, mat: T.mat, kind: 'dn', type: k, alias: T.alias || '' }); });
  return A;
}
let CAT = null;
const CAT_TH = new Map();
function catFav() { try { return JSON.parse(localStorage.getItem('dz_cat_fav') || '[]'); } catch (e) { return []; } }
function catFavSet(a) { try { localStorage.setItem('dz_cat_fav', JSON.stringify(a)); } catch (e) { } }
function catPrims(it) {   // 縮圖圖元：[{p:[[x,y]...], cl, c}]（y 向上）
  try {
    if (it.kind === 'st' && it.sty && it.sty !== 'gen') { const st = { type: 'sill', sty: it.sty, sp: {} }, V = sltViews(st); return (V && (V.sect && V.sect.length ? V.sect : V.elev)) || []; }
    if (it.kind === 'st') { const st = stNorm({ type: it.type }), g = stGeo(st), L = (g._sltLines || g.lines).sect || [], F = (g.fills && g.fills.sect) || []; return F.map(p => ({ p, cl: true, c: '#c2410c' })).concat(L.map(l => ({ p: l.p, cl: false, c: '#475569' }))); }
    if (it.kind === 'dn') { const S = dnSec(dnNorm({ type: it.type })); return S.polys.map(p => ({ p, cl: true, c: '#0891b2' })); }
    if (it.kind === 'rv') { const p = Object.assign(tcDefaults(it.type), { e: 0 }); p.T = tcType(it.type); const G = tcType(it.type).geo(p, 0); return (G.polys || []).map(q => ({ p: q.pts, cl: true, c: q.m === 'conc' ? '#475569' : q.m === 'stone' ? '#c2410c' : '#a855f7' })).concat(G.face ? [{ p: G.face, cl: false, c: '#0f172a' }] : []); }
  } catch (e) { console.warn('catPrims', it.id, e); }
  return [];
}
function catThumb(it) {
  if (CAT_TH.has(it.id)) return CAT_TH.get(it.id);
  let url = ''; const P = catPrims(it).filter(q => q.p && q.p.length >= 2);
  if (P.length) {
    const c = document.createElement('canvas'); c.width = 220; c.height = 120; const g = c.getContext('2d'); g.fillStyle = '#f8fafc'; g.fillRect(0, 0, 220, 120);
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity; P.forEach(q => q.p.forEach(([x, y]) => { if (!Number.isFinite(x + y)) return; x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }));
    const s = Math.min(200 / ((x1 - x0) || 1), 100 / ((y1 - y0) || 1)), ox = 110 - (x0 + x1) / 2 * s, oy = 60 + (y0 + y1) / 2 * s;
    g.lineWidth = 1; P.forEach(q => { g.beginPath(); q.p.forEach(([x, y], i) => { const X = ox + x * s, Y = oy - y * s; i ? g.lineTo(X, Y) : g.moveTo(X, Y); }); if (q.cl) g.closePath(); g.strokeStyle = /^#f|^#e|^#d|^rgba\((2[0-9]{2}|1[5-9][0-9]),/i.test(q.c || '') ? '#334155' : (q.c || '#334155'); g.stroke(); });
    try { url = c.toDataURL('image/png'); } catch (e) { url = ''; }
  }
  CAT_TH.set(it.id, url); return url;
}
function catOpen(mode) {   // mode：'add'（新增型式）／'swap'（更換目前固床工型式）
  CAT = { mode: mode || 'add', q: '', cmp: [] };
  let d = document.getElementById('catDlg'); if (!d) { d = document.createElement('div'); d.id = 'catDlg'; document.body.appendChild(d); }
  d.style.cssText = 'position:fixed;inset:0;z-index:9000;background:rgba(15,23,42,.55);display:flex;align-items:center;justify-content:center;'; catRender();
}
function catClose() { const d = document.getElementById('catDlg'); if (d) d.style.display = 'none'; CAT = null; }
function catRender() {
  const d = document.getElementById('catDlg'); if (!d || !CAT) return;
  const fav = catFav(), q = CAT.q.trim().toLowerCase(), sel = state.structs[state.structSel];
  const L = catItems().filter(it => !q || [it.name, it.sub, it.alias || '', ...(it.mat || [])].join(' ').toLowerCase().includes(q)).filter(it => CAT.mode !== 'swap' || it.kind === 'st');
  const card = it => { const on = fav.includes(it.id), ck = CAT.cmp.includes(it.id), th = it.pend ? '' : catThumb(it), cur = CAT.mode === 'swap' && sel && it.kind === 'st' && it.type === sel.type && (sel.type !== 'sill' || it.sty === (sel.sty || 'gen'));
    return `<div style="border:1px solid ${cur ? '#c2410c' : '#cbd5e1'};border-radius:8px;background:#fff;padding:6px;display:flex;flex-direction:column;gap:4px;${it.pend ? 'opacity:.55;' : ''}">
      <div style="height:96px;border-radius:5px;background:#f8fafc;display:flex;align-items:center;justify-content:center;overflow:hidden;cursor:${it.pend ? 'default' : 'pointer'};" ${it.pend ? '' : `onclick="catPick('${it.id}')"`}>${th ? `<img src="${th}" style="max-width:100%;max-height:96px;">` : `<span style="font-size:11px;color:#94a3b8;">${it.pend ? '待建置' : '（無縮圖）'}</span>`}</div>
      <div style="display:flex;justify-content:space-between;gap:4px;align-items:flex-start;"><div style="font-size:12.5px;font-weight:700;color:#0f172a;line-height:1.3;">${escAttr(it.name)}${it.sub ? `<div style="font-size:10.5px;font-weight:400;color:#64748b;">${escAttr(it.sub)}</div>` : ''}</div>
        ${it.pend ? '' : `<span title="加星號置頂" style="cursor:pointer;font-size:15px;color:${on ? '#f59e0b' : '#cbd5e1'};" onclick="catStar('${it.id}')">★</span>`}</div>
      <div style="display:flex;gap:3px;flex-wrap:wrap;">${(it.mat || []).map(m => `<span style="font-size:10px;padding:1px 6px;border-radius:9px;background:#e0f2fe;color:#075985;">${escAttr(m)}</span>`).join('')}</div>
      ${it.pend ? '<div style="font-size:10.5px;color:#94a3b8;">尚未建置</div>' : `<div style="display:flex;justify-content:space-between;align-items:center;gap:4px;"><label style="font-size:10.5px;color:#475569;display:flex;gap:3px;align-items:center;"><input type="checkbox" ${ck ? 'checked' : ''} onchange="catCmp('${it.id}',this.checked)">比較</label><button class="btn ${cur ? '' : 'amber'}" style="padding:2px 10px;" onclick="catPick('${it.id}')">${cur ? '目前型式' : '選用'}</button></div>`}
    </div>`; };
  const favL = L.filter(it => fav.includes(it.id));
  const sec = (t, A) => A.length ? `<div style="margin:10px 0 6px;font-size:13px;font-weight:700;color:#0369a1;border-bottom:1px solid #e2e8f0;padding-bottom:3px;">${t}<span style="font-weight:400;color:#94a3b8;font-size:11px;">　${A.filter(x => !x.pend).length} 種${A.some(x => x.pend) ? `＋待建置 ${A.filter(x => x.pend).length}` : ''}</span></div><div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:8px;">${A.map(card).join('')}</div>` : '';
  const cmpL = catItems().filter(it => CAT.cmp.includes(it.id));
  d.innerHTML = `<div style="width:min(1080px,96vw);max-height:92vh;background:#f1f5f9;border-radius:10px;box-shadow:0 20px 50px rgba(0,0,0,.35);display:flex;flex-direction:column;overflow:hidden;font-family:inherit;">
    <div style="display:flex;align-items:center;gap:10px;padding:10px 14px;background:#0f172a;color:#fff;"><b style="font-size:15px;">📚 結構物名冊</b><span style="font-size:11.5px;color:#94a3b8;">${CAT.mode === 'swap' ? '更換「' + escAttr(sel ? sel.name : '') + '」的型式（防砂壩、副壩、固床工可互換）' : '依國有林工程構造物種類分類；點縮圖或「選用」即設為新增型式'}</span>
      <input type="search" placeholder="搜尋名稱、材質…" value="${escAttr(CAT.q)}" oninput="CAT.q=this.value;catRender();this.focus();this.setSelectionRange(this.value.length,this.value.length);" style="margin-left:auto;width:220px;padding:4px 8px;border-radius:5px;border:1px solid #334155;background:#1e293b;color:#fff;" id="catQ">
      <button class="btn" onclick="catClose()">關閉 ✕</button></div>
    <div style="overflow:auto;padding:4px 14px 14px;">
      ${cmpL.length >= 2 ? catCmpHTML(cmpL) : (cmpL.length === 1 ? '<div style="font-size:11px;color:#64748b;margin-top:8px;">再勾選 1～2 種即可並排比較。</div>' : '')}
      ${favL.length ? sec('★ 常用', favL) : ''}
      ${CAT_GROUPS.map(G => { const A = L.filter(it => it.g === G.k), built = A.map(it => it.name + ' ' + (it.alias || '')), P = (CAT_NAMES[G.k] || '').split('、').filter(n => n && !built.some(b => b.includes(n) || n.includes(b.replace(/（.*$/, '').split(' ')[0]))).filter(n => !q || n.toLowerCase().includes(q));
        if (CAT.mode === 'swap' && !A.length) return ''; if (!A.length && !P.length) return '';
        return `<div style="margin:10px 0 6px;font-size:13px;font-weight:700;color:#0369a1;border-bottom:1px solid #e2e8f0;padding-bottom:3px;">${escAttr(G.t)}${G.n ? `<span style="font-weight:400;color:#64748b;font-size:11px;">（${escAttr(G.n)}）</span>` : ''}<span style="font-weight:400;color:#94a3b8;font-size:11px;">　已建置 ${A.filter(x => !x.pend).length} 種${P.length ? `／待建置 ${P.length}` : ''}</span></div>` +
          (A.length ? `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:8px;">${A.map(card).join('')}</div>` : '') +
          (P.length && CAT.mode !== 'swap' ? `<div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:5px;">${P.map(n => `<span title="待建置" style="font-size:10.5px;padding:1px 7px;border-radius:9px;background:#e2e8f0;color:#64748b;">${escAttr(n)}</span>`).join('')}</div>` : ''); }).join('')}
      ${L.length ? '' : '<div style="padding:20px;color:#64748b;">找不到符合的型式。</div>'}
    </div></div>`;
  const qi = document.getElementById('catQ'); if (qi && CAT.q) { qi.focus(); }
}
function catCmpHTML(A) {
  const rows = [['類別', it => (CAT_GROUPS.find(g => g.k === it.g) || {}).t || ''], ['材質', it => (it.mat || []).join('、') || '—'], ['說明', it => dzNoCode(it.note || it.sub || '')],
    ['數量項目', it => { try { if (it.kind === 'rv') return tcType(it.type).items.map(x => x.it).join('、'); if (it.sty && it.sty !== 'gen') return TCO_S[it.sty].run({}).rows.map(r => r.name.replace(/\s*\(.*$/, '')).join('、'); return '混凝土、模板、開挖（依地形）'; } catch (e) { return ''; } }]];
  return `<div style="margin-top:10px;background:#fff;color:#0f172a;border:1px solid #cbd5e1;border-radius:8px;padding:8px;"><div style="display:flex;justify-content:space-between;"><b style="font-size:12.5px;">並排比較（${A.length} 種）</b><a style="cursor:pointer;font-size:11px;color:#0369a1;" onclick="CAT.cmp=[];catRender()">清除</a></div>
    <table style="width:100%;border-collapse:collapse;font-size:11.5px;margin-top:4px;color:#0f172a;"><tr><th style="width:80px;"></th>${A.map(it => `<th style="text-align:left;padding:4px;border-bottom:1px solid #e2e8f0;">${catThumb(it) ? `<img src="${catThumb(it)}" style="height:54px;display:block;">` : ''}${escAttr(it.name)}</th>`).join('')}</tr>
    ${rows.map(([t, f]) => `<tr><td style="color:#64748b;padding:4px;vertical-align:top;">${t}</td>${A.map(it => `<td style="padding:4px;vertical-align:top;border-top:1px solid #f1f5f9;">${escAttr(f(it))}</td>`).join('')}</tr>`).join('')}</table></div>`;
}
function catStar(id) { const f = catFav(), i = f.indexOf(id); if (i >= 0) f.splice(i, 1); else f.push(id); catFavSet(f); catRender(); }
function catCmp(id, on) { CAT.cmp = CAT.cmp.filter(x => x !== id); if (on) { if (CAT.cmp.length >= 3) CAT.cmp.shift(); CAT.cmp.push(id); } catRender(); }
function catPick(id) {
  const it = catItems().find(x => x.id === id); if (!it || it.pend) return; const mode = CAT ? CAT.mode : 'add'; catClose();
  if (mode === 'swap') { const sel = state.structs[state.structSel]; if (sel && sel.type === 'sill' && it.type === 'sill') { sltSetType(it.sty || 'gen'); stRenderUI(); } else stChangeType(state.structSel, it.type, it.sty); return; }
  if (it.kind === 'bio') { const tb = document.querySelector('.panel-tab[data-tab="tab-earth"]'); if (tb) switchSideTab('tab-earth', tb); const sd = (state.revs || []).some(r => r.side === 'L') ? 'L' : ((state.revs || []).some(r => r.side === 'R') ? 'R' : null);
    if (!sd) { updateStatus('⚠ 生物通道附掛於護岸，請先建立護岸（縱橫斷面頁 → 護岸），再從名冊加入。'); try { rvRenderUI(); } catch (e) { } return; }
    try { rvRenderUI(); const bx = document.getElementById('bioBox'); if (bx) bx.scrollIntoView({ block: 'center' }); } catch (e) { } bioPick('new'); return; }   // v6.3：名冊選用 → 圖面點擊放置
  if (it.kind === 'dn') { state.dnPickType = it.type; if (state.viewMode !== '2D') setViewMode('2D'); const tb = document.querySelector('.panel-tab[data-tab="tab-dn"]'); if (tb) { switchSideTab('tab-dn', tb); } dnPanelUI(); updateStatus(`📚 新增型式：${it.name}。按「＋ 沿中心線（A）」或「＋ 畫獨立基線（B）」放置。`); return; }
  if (it.kind === 'rv') { state.rvLastType = it.type; rvWizard(); if (RVW) { RVW.type = it.type; RVW.p = tcDefaults(it.type); rvWizRender(); } return; }
  const k = document.getElementById('stKind'); if (k) k.value = it.type; state.stPick = it; catBtnUI();
  updateStatus(`📚 新增型式：${it.name}。輸入樁號按「加入」，或按「圖面點擊放置」。`);
}
function catBtnUI() { const b = document.getElementById('stKindBtn'); if (!b) return; const it = state.stPick || catItems().find(x => x.id === 'st:' + ((document.getElementById('stKind') || {}).value || 'dam')); const th = it ? catThumb(it) : ''; b.innerHTML = `${th ? `<img src="${th}" style="height:18px;vertical-align:middle;margin-right:4px;background:#fff;border-radius:2px;">` : '📚 '}${escAttr(it ? it.name : '選型式')} ▾`; }
function catCurHTML(st) {   // 結構物卡片最上方：目前型式（縮圖＋名稱）＋更換型式
  if (!st) return ''; const it = st.type === 'sill' ? catItems().find(x => x.id === 'sl:' + (st.sty || 'gen')) : catItems().find(x => x.id === 'st:' + st.type); if (!it) return '';
  const th = catThumb(it);
  return `<div style="display:flex;gap:8px;align-items:center;margin-top:6px;padding:6px;border:1px solid #fdba74;border-radius:6px;background:rgba(251,146,60,.08);">
    ${th ? `<img src="${th}" style="width:96px;height:52px;object-fit:contain;background:#fff;border-radius:4px;border:1px solid #e2e8f0;">` : ''}
    <div style="flex:1;line-height:1.35;"><div style="font-size:10.5px;color:var(--text-muted);">型式</div><b style="font-size:13px;color:var(--cad-amber);">${escAttr(it.name)}</b><div style="font-size:10.5px;color:var(--text-muted);">${(it.mat || []).join('、')}</div></div>
    ${!st.par ? `<button class="btn amber" onclick="catOpen('swap')" title="開啟名冊，更換這座結構物的型式（防砂壩、副壩、固床工可互換；固床工之間互換時原參數保留）">更換型式</button>` : `<button class="btn" onclick="catOpen('add')" title="開啟結構物名冊">名冊</button>`}</div>`;
}
(function () {
  const _a = stAdd; stAdd = function (sta, typeId, dir, h2) { const it = state.stPick; _a(sta, typeId, dir, h2); if (typeId === 'sill' && it && it.type === 'sill' && it.sty && it.sty !== 'gen') { try { sltSetType(it.sty); } catch (e) { console.error(e); } } };
})();

/* v5.9.1 防砂壩、副壩、固床工互換型式（主結構物）；改成非防砂壩時刪除護坦／水墊、側牆、尾檻與附屬副壩、固床工 */
function stChangeType(i, type, sty) {
  const st = state.structs[i]; if (!st || st.par || !ST_TYPES.some(q => q.id === type)) return;
  const lab = type === 'sill' ? ((sty && SLT[sty] && sty !== 'gen') ? SLT[sty].label : '固床工') : stTypeLabel(type);
  const hasAcc = st.type === 'dam' && type !== 'dam' && (['apron', 'wall', 'tail', 'sub', 'sill'].some(k => st.a && st.a[k] && st.a[k].on) || state.structs.some(q => q.par === st.id));
  if (hasAcc && !confirm(`「${st.name}」改為${lab}後，將刪除它的護坦／水墊、側牆、尾檻（及附屬副壩、固床工）。確定要更換嗎？`)) return;
  pushUndoSnapshot();
  const old = st.type, d = stPreset(type); st.type = type; st.p = Object.assign({}, d.p); st.w = JSON.parse(JSON.stringify(d.w)); st.a = JSON.parse(JSON.stringify(d.a));
  if (type === 'sill') { st.sty = 'gen'; st.sp = {}; } else { delete st.sty; delete st.sp; }
  state.structs = state.structs.filter(q => q.par !== st.id);
  if (new RegExp('^' + stTypeLabel(old) + '\\d+$').test(st.name)) { let k = 1; while (state.structs.some(q => q !== st && q.name === stTypeLabel(type) + k)) k++; st.name = stTypeLabel(type) + k; }
  st.zB = null; st.zB = stZBlink(st); st._it = 0; st._boost = 0; ST_SIG = ''; if (typeof RV_ZDIRTY !== 'undefined') RV_ZDIRTY = true;
  state.structSel = state.structs.indexOf(st); rebuildAlignmentAndSections();
  if (type === 'sill' && sty && sty !== 'gen' && SLT[sty]) { state.structSel = state.structs.indexOf(st); sltSetType(sty); }
  if (typeof stRenderUI === 'function') stRenderUI();
  updateStatus(`🔁 ${st.name}：型式由「${stTypeLabel(old)}」改為「${lab}」${hasAcc ? '，已刪除護坦／側牆／尾檻' : ''}；樁號、水流方向不變。`);
}
