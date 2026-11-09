/* ============================================================================
   pkgmod.js（v6.5 一鍵出圖包；v7.0 依案例圖說改版）
   - 圖紙 A3 橫式：外框＋內框雙線、底部標題欄（機構名稱｜主管／技師／校核｜設計／繪圖／日期｜工程名稱／圖名／比例尺｜
     設計單位公司章｜設計單位｜技師執業圖記｜圖序／圖號〔n/N〕）
   - 排序：一般說明及圖目錄 → 位置圖 → 全區平面配置圖 → 平面詳圖 → 縱斷面圖 → 橫斷面詳圖 → 各工項詳圖 → 結構物數量表
   - 縱斷面、橫斷面、位置圖、平面詳圖、第 1 張說明頁的繪製在 lymod.js
   ============================================================================ */
const PKG_TB = 13.5;   // 標題欄高（mm，紙上）
const PKG_SCALES = [50, 100, 150, 200, 250, 300, 400, 500, 600, 800, 1000, 1200, 1500, 2000, 2500, 3000, 4000, 5000, 6000, 8000, 10000, 12000, 15000, 20000, 25000, 30000, 50000];
const PKG_PAPER = { W: 420, H: 297, ox0: 10, oy0: 6, ox1: 410, oy1: 291, ix0: 15, iy0: 11, ix1: 405, iy1: 286 };   // A3；外框、內框（依案例）
const PKG_U = { x0: 17, y0: 11 + PKG_TB + 2, x1: 403, y1: 284 };   // 可用區（內框內、標題欄上方）
const PKG_NOTES = `特別說明：
  本工程施工前，承攬廠商應詳閱招標文件並至現場勘查，自行評估施工能力，確保工程品質。
一般說明：
1. 投標廠商應詳細閱覽招標文件，如有疑問，得於招標文件規定期限內以書面向機關請求釋疑。
2. 承包商應依「公共工程施工綱要規範」及主辦機關施工規範施工。
3. 本工程之尺寸，除里程、高程為公尺（m）及另有註明外，其餘均以公分（cm）為單位。
4. 除另有註明外，鋼筋搭接長度為 40 倍直徑以上，所有鋼筋均以標稱直徑公厘（mm）表示。
5. 承包商於施工前應詳查所有圖上之尺寸，對於設計圖或與合約有差異之疑問應先通知監造單位，並以其解釋為施工依據。
6. 材料：
  a. 混凝土：fc'=210 kg/cm²（圖說另有註明除外）。
  b. 鋼筋（竹節鋼筋）：φ≦16mm，fy=2800 kg/cm²；φ≧19mm，fy=4200 kg/cm²。
  c. 承包商購用之各種材料，均應依照本工程規定之規格購備新品，未訂明規範者應按照 CNS 或經工程司核可者。
7. 鋼筋之保護層除另有註明者外，依下列規定：版、明渠 5.0 cm，擋土牆及其基礎 7.5 cm。
8. 本工程內及邊緣地上下物（如建物、管線等）或農作物如有損壞，承包商應負賠償或修復之責。
9. 工程開工後，承包商應豎立各種交通安全措施，施工期間應保持既有道路暢通，並設置警告（含日夜警示燈）及導引標誌。
10. 基礎開挖時，臨時移排水及擋土支撐等施工時，應採取萬全之安全措施，以防對鄰近構造物產生損害或意外事件。
11. 施工期間，承包商須針對各項工程施作項目建立自主檢查表，由施工人員、工地主任或主任技師查核簽署後送監造單位。
12. 因應現場地形之變化，構造物施作位置須由承包商會同監造單位依現場狀況決定。
13. 如有未盡事宜，依工程合約及施工規範辦理。`;
const PKG_ECO = `環境生態保護特別說明：
1. 施工時期注意保護水質，設置適當之擋排水設施及臨時沉砂池，避免水質濁度大幅提高。
2. 擋抽導排水作業應避免下游水路枯竭造成溪流魚類死亡。
3. 工程施工完成後避免推平溪床，適度營造深槽區，以利地表水流動供生物使用。
4. 工區周邊植生狀態良好，施工時應避免破壞植生，施工期間有疑慮應立即通知監造單位會勘。
5. 以上相關維護費用由擋抽排水、施工便道費用、竣工前工地清理及環保安衛費支付，不另計價。`;
const PKG_DEF = { proj: '', agency: '', company: '', names: { mgr: '', eng: '', chk: '', des: '', drw: '' }, pre: 'DZ-', start: 1, date: '', planS: 0, detS: 500, locS: 10000, locMap: 'EMAP', secS: 300, secPt: false,
  fmt: 'r2000', font: 'shx', bw: true, secStyle: 'auto', works: '', ctrl: '', notes: PKG_NOTES, eco: PKG_ECO, ecoOn: true,
  parts: { index: true, loc: true, plan: true, detail: true, prof: true, sec: true, std: true, qty: true, xlsx: true, merged: true, full: false } };
state.pkg = JSON.parse(JSON.stringify(PKG_DEF));
function pkgNorm(o) {
  const d = JSON.parse(JSON.stringify(PKG_DEF)); o = o || {};
  Object.keys(d).forEach(k => { if (k === 'parts' || k === 'names') Object.assign(d[k], o[k] || {}); else if (o[k] !== undefined) d[k] = o[k]; });
  if (o.org && !o.company) d.company = o.org;   // v6.9 以前的「設計單位」
  return d;
}
function pkgRocDate() { const d = new Date(), z = n => String(n).padStart(2, '0'); return `${d.getFullYear() - 1911}.${z(d.getMonth() + 1)}.${z(d.getDate())}`; }
function pkgBase() { return (typeof projName !== 'undefined' && projName) ? projName.replace(/\.(tcproj|json)$/i, '') : 'DiZhu'; }
function pkgTW(s, h) { return typeof stTextW === 'function' ? stTextW(s, h) : String(s).length * h; }
function pkgSc(S) { return `1/${S}`; }   // 比例尺寫法（案例）

/* ---- DXF 解析／重組（D.build() 輸出的 R12 文字） ---- */
function pkgParse(txt) {
  const L = txt.split('\n'); if (L[L.length - 1] === '') L.pop();
  const secAt = nm => { for (let i = 0; i + 3 < L.length; i += 2) if (L[i].trim() === '0' && L[i + 1] === 'SECTION' && L[i + 3] === nm) return i; return -1; };
  const endAt = i0 => { for (let i = i0; i + 1 < L.length; i += 2) if (L[i].trim() === '0' && L[i + 1] === 'ENDSEC') return i; return L.length; };
  const iH = secAt('HEADER'), iT = secAt('TABLES'), iB = secAt('BLOCKS'), iE = secAt('ENTITIES');
  const header = L.slice(iH, endAt(iH) + 2).join('\n'), tLines = L.slice(iT, endAt(iT) + 2);
  // 圖層表
  const layers = new Map(); { let i0 = -1; for (let i = 0; i + 1 < tLines.length; i += 2) { if (tLines[i].trim() === '0') { if (i0 >= 0) { const c = tLines.slice(i0, i); layers.set(c[3], c.join('\n')); i0 = -1; } if (tLines[i + 1] === 'LAYER' && tLines[i - 1] !== 'TABLE') i0 = i; } } }
  const tables = tLines.join('\n');
  const chunk = (a, b) => {   // 實體切塊：POLYLINE 併入 VERTEX…SEQEND
    const out = []; let cur = null;
    for (let i = a; i + 1 < b; i += 2) {
      const c = L[i].trim(), v = L[i + 1];
      if (c === '0') {
        if (cur && cur.t === 'POLYLINE' && (v === 'VERTEX' || v === 'SEQEND')) { cur.l.push(L[i], v); if (v === 'VERTEX') cur.inV = true; if (v === 'SEQEND') { out.push(cur); cur = null; } continue; }
        if (cur) out.push(cur); cur = { t: v, l: [L[i], v], ly: '0', x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity };
        continue;
      }
      if (!cur) continue; cur.l.push(L[i], v);
      if (c === '8' && !cur.inV) cur.ly = v;
      else if (c === '2' && cur.t === 'INSERT') cur.blk = v;
      else if (c === '1' && cur.t === 'TEXT') cur.s = v.replace(/\\U\+([0-9A-Fa-f]{4})/g, (m, h) => String.fromCharCode(parseInt(h, 16)));
      else if ((c === '10' || c === '11') && !(cur.t === 'POLYLINE' && !cur.inV)) cur._x = +v;
      else if ((c === '20' || c === '21') && cur._x !== undefined) { const y = +v, x = cur._x; cur._x = undefined; if (Number.isFinite(x) && Number.isFinite(y)) { cur.x0 = Math.min(cur.x0, x); cur.x1 = Math.max(cur.x1, x); cur.y0 = Math.min(cur.y0, y); cur.y1 = Math.max(cur.y1, y); } }
      else if (c === '40' && (cur.t === 'CIRCLE' || cur.t === 'ARC') && Number.isFinite(cur.x0)) { const r = +v; cur.x0 -= r; cur.y0 -= r; cur.x1 += r; cur.y1 += r; }
    }
    if (cur) out.push(cur); return out;
  };
  const ents = iE >= 0 ? chunk(iE + 4, endAt(iE)).filter(e => e.t !== 'ENDSEC') : [];
  const blocks = new Map();
  if (iB >= 0) { const B = chunk(iB + 4, endAt(iB)); let cur = null; B.forEach(e => { if (e.t === 'BLOCK') { cur = { name: e.l[e.l.findIndex((x, j) => j % 2 === 0 && x.trim() === '2') + 1], l: [...e.l], x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity }; return; } if (!cur) return; cur.l.push(...e.l); if (e.t === 'ENDBLK') { blocks.set(cur.name, cur); cur = null; return; } if (Number.isFinite(e.x0)) { cur.x0 = Math.min(cur.x0, e.x0); cur.y0 = Math.min(cur.y0, e.y0); cur.x1 = Math.max(cur.x1, e.x1); cur.y1 = Math.max(cur.y1, e.y1); } }); }
  ents.forEach(e => { if (e.t === 'INSERT' && blocks.has(e.blk)) { const b = blocks.get(e.blk); e.x0 = b.x0; e.y0 = b.y0; e.x1 = b.x1; e.y1 = b.y1; } delete e.inV; delete e._x; });
  return { header, tables, layers, blocks, ents };
}
function pkgBB(ents, skip) { const b = { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity }; ents.forEach(e => { if (!Number.isFinite(e.x0) || (skip && skip(e))) return; b.x0 = Math.min(b.x0, e.x0); b.y0 = Math.min(b.y0, e.y0); b.x1 = Math.max(b.x1, e.x1); b.y1 = Math.max(b.y1, e.y1); }); return Number.isFinite(b.x0) ? b : null; }
function pkgShift(lines, dx, dy) { if (!dx && !dy) return lines; const o = lines.slice(); for (let i = 0; i + 1 < o.length; i += 2) { const c = o[i].trim(); if (c === '10' || c === '11') o[i + 1] = (+o[i + 1] + dx).toFixed(4); else if (c === '20' || c === '21') o[i + 1] = (+o[i + 1] + dy).toFixed(4); } return o; }
function pkgXf(lines, u, dx, dy) {   // v6.6：先縮放 u（標準圖 m→cm 用 100）再平移
  if (!u || u === 1) return pkgShift(lines, dx, dy);
  const o = lines.slice(); let t = '';
  for (let i = 0; i + 1 < o.length; i += 2) { const c = String(o[i]).trim();
    if (c === '0') { t = o[i + 1]; continue; }
    if (c === '10' || c === '11') o[i + 1] = (+o[i + 1] * u + (dx || 0)).toFixed(4); else if (c === '20' || c === '21') o[i + 1] = (+o[i + 1] * u + (dy || 0)).toFixed(4);
    else if (c === '30' || c === '31') o[i + 1] = (+o[i + 1] * u).toFixed(4);
    else if (c === '40' && (t === 'TEXT' || t === 'CIRCLE' || t === 'ARC')) o[i + 1] = (+o[i + 1] * u).toFixed(4); }
  if (o[1] === 'INSERT') o.push('41', String(u), '42', String(u), '43', String(u));
  return o;
}
/* parts：[{ X(解析結果), ents, dx, dy, u }]；ext：圖面範圍 */
function pkgCompose(parts, ext) {
  const base = parts[0].X, lay = new Map(), blk = new Map(), body = [];
  parts.forEach(p => { p.X.layers.forEach((v, k) => { if (!lay.has(k)) lay.set(k, v); });
    p.ents.forEach(e => { if (e.t === 'INSERT' && p.X.blocks.has(e.blk)) blk.set(e.blk, p.X.blocks.get(e.blk)); body.push(pkgXf(e.l, p.u || 1, p.dx || 0, p.dy || 0).join('\n')); }); });
  const f = v => (+v).toFixed(4);
  const header = base.header.replace(/(\$EXTMIN\n10\n)[^\n]*(\n20\n)[^\n]*/, `$1${f(ext.x0)}$2${f(ext.y0)}`).replace(/(\$EXTMAX\n10\n)[^\n]*(\n20\n)[^\n]*/, `$1${f(ext.x1)}$2${f(ext.y1)}`)
    .replace(/(\$LIMMIN\n10\n)[^\n]*(\n20\n)[^\n]*/, `$1${f(ext.x0)}$2${f(ext.y0)}`).replace(/(\$LIMMAX\n10\n)[^\n]*(\n20\n)[^\n]*/, `$1${f(ext.x1)}$2${f(ext.y1)}`);
  const lt = `0\nTABLE\n2\nLAYER\n70\n${lay.size}\n` + [...lay.values()].join('\n') + '\n0\nENDTAB';
  const tables = base.tables.replace(/0\nTABLE\n2\nLAYER\n70\n\d+\n[\s\S]*?\n0\nENDTAB/, lt);
  let bl = '0\nSECTION\n2\nBLOCKS'; blk.forEach(b => { bl += '\n' + b.l.join('\n'); }); bl += '\n0\nENDSEC';
  return [header, tables, bl, '0\nSECTION\n2\nENTITIES', ...body, '0\nENDSEC\n0\nEOF'].join('\n') + '\n';
}

/* ---- 圖框＋標題欄 ---- */
function pkgFitScale(bb, fixed, U) {
  U = U || PKG_U; const uw = U.x1 - U.x0 - 6, uh = U.y1 - U.y0 - 6, w = bb.x1 - bb.x0, h = bb.y1 - bb.y0;
  if (fixed > 0) return { S: fixed, over: w * 1000 / fixed > uw + 6 || h * 1000 / fixed > uh + 6 };
  const S = PKG_SCALES.find(s => w * 1000 / s <= uw && h * 1000 / s <= uh); return S ? { S, over: false } : { S: PKG_SCALES[PKG_SCALES.length - 1], over: true };
}
function pkgFrameAt(bb, S, U) {   // 內容置中於可用區 U（紙上 mm）
  U = U || PKG_U; const A = PKG_PAPER, k = S / 1000, cxp = (U.x0 + U.x1) / 2, cyp = (U.y0 + U.y1) / 2, cx = (bb.x0 + bb.x1) / 2, cy = (bb.y0 + bb.y1) / 2;
  return { x0: cx - cxp * k, y0: cy - cyp * k, w: A.W * k, h: A.H * k, S };
}
function pkgFit(s, h, w) { let hh = h; const tw = pkgTW(s, 1) * 1.2; if (tw * hh > w) hh = Math.max(h * 0.45, w / tw); return hh; }   // 1.1：字寬保守估計
/* 圖框＋標題欄（依案例）：F＝{x0,y0（紙左下角之模型座標）, S}；info＝{agency, proj, title, scale｜{x,y}, unit, no, seq, names, company, date, warn} */
function pkgDrawFrame(D, F, info) {
  const k = F.S / 1000, A = PKG_PAPER, X = mm => F.x0 + mm * k, Y = mm => F.y0 + mm * k;
  const R = (a, b, c, d, ly) => D.poly([[X(a), Y(b)], [X(c), Y(b)], [X(c), Y(d)], [X(a), Y(d)]], ly, 7, 0, true);
  const L = (a, b, c, d, ly) => D.line(X(a), Y(b), 0, X(c), Y(d), 0, ly || 'PKG_TB', 7);
  const T = (x, y, h, s, o) => { s = String(s ?? ''); if (s) D.text(X(x), Y(y), h * k, s, 'PKG_TB_TEXT', 7, Object.assign({ valign: 'm' }, o || {})); };
  R(A.ox0, A.oy0, A.ox1, A.oy1, 'PKG_FRAME'); R(A.ix0, A.iy0, A.ix1, A.iy1, 'PKG_FRAME');
  const y0 = A.iy0, y3 = y0 + PKG_TB, rh = PKG_TB / 3, ym = y0 + PKG_TB / 2, x = [A.ix0, 101.5, 143, 184.5, 280.5, 311.5, 332.5, 370.5, A.ix1];
  L(A.ix0, y3, A.ix1, y3);
  x.slice(1, -1).forEach(v => L(v, y0, v, y3));
  const nm = info.names || {}, h = 2.4;
  // 機構名稱
  T((x[0] + x[1]) / 2, ym, pkgFit(info.agency, 3.5, x[1] - x[0] - 3), info.agency, { align: 'c' });
  // 主管／技師／校核、設計／繪圖／日期（三列）
  [1, 2].forEach(c => { L(x[c], y0 + rh, x[c + 1], y0 + rh); L(x[c], y0 + 2 * rh, x[c + 1], y0 + 2 * rh); });
  const lab = [['主　管：', nm.mgr], ['技　師：', nm.eng], ['校　核：', nm.chk]], lab2 = [['設　計：', nm.des], ['繪　圖：', nm.drw], ['日　期：', info.date]];
  [lab, lab2].forEach((LB, c) => LB.forEach(([t, v], r) => { const yy = y3 - rh * (r + 0.5), xa = x[c + 1] + 1.2; T(xa, yy, h, t, { align: 'l' }); if (v) T(xa + pkgTW(t, h) + 0.6, yy, pkgFit(v, h, x[c + 2] - xa - pkgTW(t, h) - 2), v, { align: 'l' }); }));
  // 工程名稱（上半）／圖名＋比例尺（下半）；平面類另有「單位」格
  const xs = 252.5; L(x[3], ym, x[4], ym); L(xs, y0, xs, ym);
  if (info.unit) { L(xs, ym, xs, y3); T(xs + 1.2, (ym + y3) / 2, h, '單位：' + info.unit, { align: 'l' }); }
  const pj = '工程名稱：' + (info.proj || ''); T(x[3] + 1.2, (ym + y3) / 2, pkgFit(pj, 2.4, (info.unit ? xs : x[4]) - x[3] - 2.5), pj, { align: 'l' });
  const tn = '圖名：' + (info.title || ''); T(x[3] + 1.2, (y0 + ym) / 2, pkgFit(tn, 2.6, xs - x[3] - 2.5), tn, { align: 'l' });
  T(xs + 1.2, (y0 + ym) / 2, h, '比例尺：', { align: 'l' });
  const sx = xs + 1.2 + pkgTW('比例尺：', h) + 0.4, sw = x[4] - sx - 1;
  if (info.scale && typeof info.scale === 'object') { T(sx, (y0 + ym) / 2 + 1.6, pkgFit(`X=${info.scale.x}`, 2.0, sw), `X=${info.scale.x}`, { align: 'l' }); T(sx, (y0 + ym) / 2 - 1.6, pkgFit(`Y=${info.scale.y}`, 2.0, sw), `Y=${info.scale.y}`, { align: 'l' }); }
  else if (info.scale) T(sx, (y0 + ym) / 2, pkgFit(info.scale, h, sw), info.scale, { align: 'l' });
  // 設計單位公司章／設計單位／技師執業圖記（上列標題、下方空白）
  [[4, '設計單位公司章'], [5, '設計單位'], [6, '技師執業圖記']].forEach(([c, t]) => { L(x[c], y3 - rh, x[c + 1], y3 - rh); T((x[c] + x[c + 1]) / 2, y3 - rh / 2, pkgFit(t, 2.2, x[c + 1] - x[c] - 1.5), t, { align: 'c' }); });
  if (info.company) { const w = x[6] - x[5] - 1.5, n = Math.ceil(info.company.length / 2), parts = pkgTW(info.company, 2.2) > w ? [info.company.slice(0, n), info.company.slice(n)] : [info.company];
    parts.forEach((s, i) => T((x[5] + x[6]) / 2, y0 + (y3 - rh - y0) / 2 + (parts.length > 1 ? (0.5 - i) * 2.6 : 0), pkgFit(s, 2.0, w), s, { align: 'c' })); }
  // 圖序／圖號
  L(x[7], ym, x[8], ym);
  T(x[7] + 1.2, (ym + y3) / 2, h, '圖序〔', { align: 'l' }); T(x[8] - 1.5, (ym + y3) / 2, h, '〕', { align: 'r' });
  if (info.seq) T((x[7] + x[8]) / 2 + 3, (ym + y3) / 2, h, info.seq, { align: 'c' });
  T(x[7] + 1.2, (y0 + ym) / 2, h, '圖號〔', { align: 'l' }); T(x[8] - 1.5, (y0 + ym) / 2, h, '〕', { align: 'r' });
  if (info.no) T((x[7] + x[8]) / 2 + 3, (y0 + ym) / 2, pkgFit(info.no, 2.8, 18), info.no, { align: 'c' });
  if (info.warn) D.text(X(PKG_U.x0 + 1), Y(y3 + 1.2), 2.2 * k, info.warn, 'PKG_TB_TEXT', 1);
}

/* ---- 量測一段輸出的範圍（不動 D.sub，避免打亂多中心線排版） ---- */
function pkgMeasure(D, fn) {
  const b = { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity }, t = (x, y) => { if (Number.isFinite(x) && Number.isFinite(y)) { b.x0 = Math.min(b.x0, x); b.y0 = Math.min(b.y0, y); b.x1 = Math.max(b.x1, x); b.y1 = Math.max(b.y1, y); } };
  const o = { line: D.line, poly: D.poly, text: D.text, circle: D.circle, arc: D.arc };
  D.line = function (x1, y1, z1, x2, y2) { t(x1, y1); t(x2, y2); return o.line.apply(this, arguments); };
  D.poly = function (P) { (P || []).forEach(p => t(p[0], p[1])); return o.poly.apply(this, arguments); };
  D.text = function (x, y, h, s) { t(x, y); t(x + pkgTW(s, h), y + h); return o.text.apply(this, arguments); };
  D.circle = function (x, y, r) { t(x - r, y - r); t(x + r, y + r); return o.circle.apply(this, arguments); };
  D.arc = function (x, y, r) { t(x - r, y - r); t(x + r, y + r); return o.arc.apply(this, arguments); };
  let r; try { r = fn(); } finally { Object.assign(D, o); } return { r, bb: Number.isFinite(b.x0) ? b : null };
}
function pkgSwap(map, fn) { const old = {}; Object.keys(map).forEach(k => { old[k] = window[k]; window[k] = map[k](old[k]); }); try { return fn(); } finally { Object.keys(old).forEach(k => { window[k] = old[k]; }); } }
function pkgClTag() { return typeof clMulti === 'function' && clMulti() ? clName() + '　' : ''; }
function pkgAssign(ents, rects) {   // 依實體中心落在哪個框分配；框外者給最近的框
  const G = rects.map(() => []);
  ents.forEach(e => { if (!rects.length) return; const cx = Number.isFinite(e.x0) ? (e.x0 + e.x1) / 2 : NaN, cy = Number.isFinite(e.y0) ? (e.y0 + e.y1) / 2 : NaN;
    if (!Number.isFinite(cx)) { G[0].push(e); return; }
    let k = rects.findIndex(r => cx >= r.x0 - 1e-6 && cx <= r.x1 + 1e-6 && cy >= r.y0 - 1e-6 && cy <= r.y1 + 1e-6);
    if (k < 0) { let d = Infinity; rects.forEach((r, j) => { const dd = Math.hypot(Math.max(r.x0 - cx, 0, cx - r.x1), Math.max(r.y0 - cy, 0, cy - r.y1)); if (dd < d) { d = dd; k = j; } }); }
    G[k].push(e); });
  return G;
}

/* ---- 產生各張圖 ---- */

/* ---- 產生各張圖 ---- */
function pkgSheets(P) {
  const out = [], push = o => out.push(o), suf = () => (typeof clMulti === 'function' && clMulti() ? '－' + clName() : '');
  if (!state.alignment || !state.alignment.segments.length) return out;
  window.DXF_PKG = true; window.DXF_TB_MM = PKG_TB + 2;
  try {
    // 位置圖（空白圖框，依 TWD97 座標）
    if (P.parts.loc) lyLocSheets(P).forEach(push);
    // 全區平面配置圖＋平面詳圖（共用同一份平面圖內容）
    let PX = null; const planX = () => PX || (PX = pkgParse(pkgSwap({ dzDxfProfiles: () => () => { } }, () => buildFullDXF({ only: ['plan'] }))));
    if (P.parts.plan) {
      const s = lyPlanSheet(P, planX()); if (s) push(s);
      if (typeof dzDxfProfiles === 'function' && (state.dzCases || []).some(c => (c.secs || []).length)) {
        const D = makeDXFWriter(); dzDxfProfiles(D); const Y = pkgParse(D.build()), b2 = pkgBB(Y.ents);
        if (b2) { const f = pkgFitScale(b2, 0); push({ kind: 'dz', title: '崩塌地坡面剖面圖', X: Y, ents: Y.ents, F: pkgFrameAt(b2, f.S), scale: pkgSc(f.S), warn: f.over ? '※ 內容超出圖框' : '' }); }
      }
    }
    if (P.parts.detail) lyDetailSheets(P, planX()).forEach(push);
    // 縱斷面圖、橫斷面詳圖（各中心線）
    if (P.parts.prof) clEach(() => { const L = lyProfSheets(P); L.forEach((s, k) => { s.title = `縱斷面圖(${k + 1}/${L.length})${suf()}`; push(s); }); });
    if (P.parts.sec) clEach(() => { const L = lySecSheets(P); L.forEach((s, k) => { s.title = `橫斷面詳圖(${k + 1}/${L.length})${suf()}`; push(s); }); });
    // 各工項詳圖（結構物、附屬構造、護岸、排水溝、生物通道…：每張標準圖一張）
    if (P.parts.std) {
      const rec = [];
      const X = pkgParse(pkgSwap({ stStdEmit: o => function (D, Q, dx, dy) { const m = pkgMeasure(D, () => o.apply(this, arguments)); const t = (Q || []).find(q => q.t !== 'l' && q.t !== 'f' && q.ly === 'STD_TITLE');
        if (m.bb) rec.push({ cl: suf(), bb: m.bb, title: t ? String(t.s) : '', Q, dx, dy }); return m.r; } }, () => buildFullDXF({ only: ['std'] })));
      const G = pkgAssign(X.ents, rec.map(r => r.bb));
      rec.forEach((r, j) => { if (!G[j].length) return; const bb = pkgBB(G[j]) || r.bb, f = pkgFitScale(bb, 0), nm = lyStdTitle(r.title || `標準圖 ${j + 1}`);
        const sp = f.S > 200 ? pkgStdSplit(r, X, G[j]) : null;
        if (sp && sp.length > 1) sp.forEach((q, k) => push(Object.assign(q, { kind: 'std', title: `${nm}(${k + 1}/${sp.length})${r.cl}` })));
        else push({ kind: 'std', title: nm + r.cl, X, ents: G[j], F: pkgFrameAt(bb, f.S), scale: pkgSc(f.S), warn: f.over ? '※ 內容超出圖框' : '' }); });
    }
    // 結構物數量表（最後）
    if (P.parts.qty) {
      const rec = [];
      const X = pkgParse(pkgSwap({ stDxfQty: o => function (D) { const a = arguments, m = pkgMeasure(D, () => o.apply(this, a)); if (m.bb) rec.push({ cl: suf(), bb: m.bb }); return m.r; } }, () => buildFullDXF({ only: ['qty'] })));
      const G = pkgAssign(X.ents, rec.map(r => r.bb));
      rec.forEach((r, j) => { if (!G[j].length) return; const bb = pkgBB(G[j]) || r.bb, f = pkgFitScale(bb, 0); push({ kind: 'qty', title: `結構物數量表${r.cl}`, X, ents: G[j], F: pkgFrameAt(bb, f.S), scale: pkgSc(f.S), warn: f.over ? '※ 內容超出圖框' : '' }); });
    }
  } finally { window.DXF_PKG = false; window.DXF_TB_MM = 0; }
  return out;
}
/* ---- 標準圖拆張：整張要縮到小於 1:200 時，依區塊（視圖／剖面／表格）拆成多張 A3 ----
   比例＝依中位字高讓紙上字高 ≥ 1.8 mm，限 1:100～1:250；區塊＝間距 4 m 內相連的圖元；
   同一橫列放得下就整列搬（保持原相對位置，表格欄距不變），放不下才逐區塊排；區塊依「左右大欄 → 由上而下 → 由左而右」順序排入 */
function pkgClu(items, g) {
  const n = items.length, p = [...Array(n).keys()], f = i => (p[i] === i ? i : (p[i] = f(p[i]))), ord = [...Array(n).keys()].sort((a, b) => items[a].x0 - items[b].x0);
  for (let a = 0; a < n; a++) { const A = items[ord[a]]; for (let c = a + 1; c < n; c++) { const B = items[ord[c]]; if (B.x0 > A.x1 + g) break; if (B.y0 <= A.y1 + g && A.y0 <= B.y1 + g) p[f(ord[a])] = f(ord[c]); } }
  const m = new Map(); items.forEach((it, i) => { const k = f(i); if (!m.has(k)) m.set(k, { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity }); const c = m.get(k); c.x0 = Math.min(c.x0, it.x0); c.y0 = Math.min(c.y0, it.y0); c.x1 = Math.max(c.x1, it.x1); c.y1 = Math.max(c.y1, it.y1); });
  return [...m.values()];
}
function pkgBands(L, ax, tol) {   // 依 x（ax='x'）或 y 區間重疊合併成帶
  const k0 = ax + '0', k1 = ax + '1', S = L.slice().sort((a, b) => (ax === 'x' ? a[k0] - b[k0] : b[k1] - a[k1])), out = [];
  S.forEach(c => { const b = out[out.length - 1]; if (b && (ax === 'x' ? c[k0] <= b.hi + tol : c[k1] >= b.lo - tol)) { b.L.push(c); if (ax === 'x') b.hi = Math.max(b.hi, c[k1]); else b.lo = Math.min(b.lo, c[k0]); } else out.push({ L: [c], lo: c[k0], hi: c[k1] }); });
  return out;
}
function pkgRows(L) {   // 依頂緣分列：頂緣與該列首件相差不到兩者較高者的一半 → 同一列
  const S = L.slice().sort((a, b) => b.y1 - a.y1), out = [];
  S.forEach(c => { const r = out[out.length - 1]; if (r && c.y1 >= r.top - 0.5 * Math.max(r.h, c.y1 - c.y0)) r.L.push(c); else out.push({ L: [c], top: c.y1, h: c.y1 - c.y0 }); });
  return out;
}
function pkgStdSplit(r, X, ents) {
  const items = (r.Q || []).filter(o => o.t !== 'f').map(o => { let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity; const t = (x, y) => { x0 = Math.min(x0, x + r.dx); y0 = Math.min(y0, y + r.dy); x1 = Math.max(x1, x + r.dx); y1 = Math.max(y1, y + r.dy); };
    if (o.t === 'l') o.p.forEach(v => t(v[0], v[1])); else { t(o.x, o.y); t(o.x + pkgTW(o.s, o.h), o.y + o.h); } return { x0, y0, x1, y1, h: o.t === 'l' ? 0 : +o.h || 0 }; }).filter(i => Number.isFinite(i.x0));
  if (items.length < 2) return null;
  const hs = items.filter(i => i.h > 0).map(i => i.h).sort((a, b) => a - b), hm = hs.length ? hs[hs.length >> 1] : 0.25;
  const S = PKG_SCALES.filter(s => s >= 100 && s <= 250 && s <= Math.max(100, hm * 1000 / 1.8)).pop() || 100, k = S / 1000, A = PKG_PAPER, U = PKG_U;
  const ux0 = (U.x0 + 3) * k, ux1 = (U.x1 - 3) * k, uy0 = (U.y0 + 3) * k, uy1 = (U.y1 - 3) * k, UW = ux1 - ux0, UH = uy1 - uy0, gap = 6 * k;
  const cl = pkgClu(items, 4); cl.forEach(c => { c.E = []; });
  pkgAssign(ents, cl).forEach((E, i) => { cl[i].E = E; });
  // 區塊：依標題（STD_TITLE）分組——每個圖元歸給「左上方、水平最接近」的標題；沒有標題者自成一組
  const T0 = (r.Q || []).filter(o => o.t !== 'l' && o.t !== 'f' && o.ly === 'STD_TITLE'), hT = Math.max(0, ...T0.map(o => +o.h || 0));
  const T = T0.filter(o => (+o.h || 0) >= hT * 0.75).map(o => ({ x0: o.x + r.dx, y0: o.y + r.dy }));   // 只取大標題（各剖面的小標題不算）
  const grp = T.map(() => []), misc = [];
  cl.forEach(c => { const C = T.map((t, i) => ({ t, i })).filter(({ t }) => t.y0 >= c.y1 - 2 - (c.y1 - c.y0) && t.x0 <= c.x0 + 2)
      .sort((a, b) => (Math.round(b.t.x0 / 2) - Math.round(a.t.x0 / 2)) || (Math.abs(a.t.y0 - c.y1) - Math.abs(b.t.y0 - c.y1)));
    (C.length ? grp[C[0].i] : misc).push(c); });
  const units = [];   // { x0,y0,x1,y1, cs:[cluster] }
  [misc].concat(grp).filter(g => g.length).forEach(G => pkgRows(G).forEach(row => {
    const L = row.L.slice().sort((a, b) => a.x0 - b.x0), bb = { x0: Math.min(...L.map(c => c.x0)), x1: Math.max(...L.map(c => c.x1)), y0: Math.min(...L.map(c => c.y0)), y1: Math.max(...L.map(c => c.y1)) };
    if (bb.x1 - bb.x0 <= UW) units.push(Object.assign(bb, { cs: L }));
    else { let cur = null; L.forEach(c => { if (cur && c.x1 - cur.x0 <= UW) { cur.cs.push(c); cur.x1 = Math.max(cur.x1, c.x1); cur.y0 = Math.min(cur.y0, c.y0); cur.y1 = Math.max(cur.y1, c.y1); } else { cur = { x0: c.x0, x1: c.x1, y0: c.y0, y1: c.y1, cs: [c] }; units.push(cur); } }); }
  }));
  const sheets = []; let sh = null, cx = 0, cy = 0, rowH = 0;
  const newSheet = (S2) => { sh = { S: S2 || S, parts: [] }; sheets.push(sh); cx = ux0; cy = uy1; rowH = 0; };
  units.forEach(u => {
    const w = u.x1 - u.x0, h = u.y1 - u.y0;
    if (w > UW + 1e-6 || h > UH + 1e-6) {   // 單一區塊放不下：獨立一張、取放得下的比例
      const f = pkgFitScale(u, 0), F = pkgFrameAt(u, f.S); sheets.push({ S: f.S, F, parts: u.cs.map(c => ({ X, ents: c.E, dx: 0, dy: 0 })), own: true }); sh = null; return; }
    if (!sh) newSheet();
    if (cx > ux0 && cx + w > ux1 + 1e-6) { cx = ux0; cy -= rowH + gap; rowH = 0; }
    if (cy - h < uy0 - 1e-6) { newSheet(); }
    const dx = cx - u.x0, dy = cy - u.y1; u.cs.forEach(c => sh.parts.push({ X, ents: c.E, dx, dy })); cx += w + gap; rowH = Math.max(rowH, h);
  });
  return sheets.filter(q => q.parts.some(p => p.ents.length)).map(q => ({ X, ents: [], parts: q.parts, F: q.F || { x0: 0, y0: 0, w: A.W * q.S / 1000, h: A.H * q.S / 1000, S: q.S }, scale: pkgSc(q.S), warn: '' }));
}


/* ---- 組成出圖包 ---- */
function pkgMake(opt) {
  const P = pkgNorm(Object.assign({}, state.pkg, opt || {})); P.parts = Object.assign({}, state.pkg.parts, (opt && opt.parts) || {}); P.names = Object.assign({}, state.pkg.names, (opt && opt.names) || {});
  if (!P.date) P.date = pkgRocDate();
  const sheets = pkgSheets(P);
  if (!sheets.length && !P.parts.index) return { files: [], sheets: [] };
  // 圖號＝n/N（案例）；檔名與配置名稱＝前綴＋序號
  const nIdx = P.parts.index ? lyCoverCount(sheets.length, P) : 0, N = sheets.length + nIdx, st = Math.max(1, +P.start || 1), safe = s => String(s).replace(/[\\/:*?"<>|]/g, '_').replace(/\s+/g, '_').slice(0, 60);
  const lay = i => `${P.pre || ''}${String(st + i).padStart(2, '0')}`;
  const tag = (s, i) => { s.no = `${st + i}/${st + N - 1}`; s.page = `${i + 1}/${N}`; s.lay = lay(i).replace(/[<>\/\\":;?*|,=`]/g, '_') || `S${i + 1}`; s.file = `${lay(i)}_${safe(s.title)}.dxf`; };
  sheets.forEach((s, i) => tag(s, i + nIdx));
  const stubs = [...Array(nIdx)].map((_, i) => ({ kind: 'index', title: nIdx > 1 ? (i ? `圖目錄(${i + 1}/${nIdx})` : `一般說明及圖目錄(1/${nIdx})`) : '一般說明及圖目錄' }));
  stubs.forEach((s, i) => tag(s, i));
  const idx = nIdx ? lyCoverSheets(P, stubs, sheets) : [];
  const all = idx.concat(sheets), files = [], info = s => ({ agency: P.agency, proj: P.proj || pkgBase(), company: P.company, names: P.names, title: s.title, scale: s.scale, unit: s.unit, no: s.no, date: P.date, warn: s.warn });
  // 每張的內容（模型空間）與單位：標準圖 1 單位＝1 cm（座標×100），其餘 m
  all.forEach(s => {
    if (s.D) { const X = pkgParse(s.D.build()); s.cont = [{ X, ents: X.ents }]; } else s.cont = s.parts ? s.parts : [{ X: s.X, ents: s.ents }];
    s.u = s.kind === 'std' ? 100 : 1; s.Fu = { x0: s.F.x0 * s.u, y0: s.F.y0 * s.u, w: s.F.w * s.u, h: s.F.h * s.u, S: s.F.S * s.u };
    if (P.bw) s.cont.forEach(p => { lyBW(p.X); p.ents = p.ents.map(lyBWe); });
  });
  const R2 = P.fmt !== 'r12', A = PKG_PAPER;
  const paperOn = (FD, s, F) => { pkgDrawFrame(FD, F, info(s)); if (s.extra) s.extra(FD, F); };
  const frameR12 = s => { const FD = makeDXFWriter(); paperOn(FD, s, s.Fu); const FX = pkgParse(FD.build()); return { X: FX, ents: FX.ents }; };
  const frameMM = s => { const FD = makeDXFWriter(); paperOn(FD, s, { x0: 0, y0: 0, w: A.W, h: A.H, S: 1000 }); return pkgParse(FD.build()).ents.map(e => e.l); };
  const isFr = e => e.t === 'POLYLINE' && (e.ly === 'PROF_SHEET' || e.ly === 'SEC_SHEET');
  const contLines = (s, dx, dy) => { const o = []; s.cont.forEach(p => p.ents.forEach(e => { if (R2 && isFr(e)) return; o.push(pkgXf(e.l, s.u, (p.dx || 0) * s.u + dx, (p.dy || 0) * s.u + dy)); })); return o; };
  const vpOf = (s, dx, dy) => { const k = s.Fu.S / 1000, x0 = A.ix0, y0 = A.iy0 + PKG_TB, x1 = A.ix1, y1 = A.iy1;
    return { x0, y0, x1, y1, k, cx: s.Fu.x0 + dx + (x0 + x1) / 2 * k, cy: s.Fu.y0 + dy + (y0 + y1) / 2 * k }; };
  const r2Layers = list => { const L = new Map(); list.forEach(s => s.cont.forEach(p => p.X.layers.forEach((v, k) => { if (!L.has(k)) L.set(k, r2kLayer(v)); })));
    ['PKG_FRAME', 'PKG_TB', 'PKG_TB_TEXT', 'PKG_PAPER'].forEach(k => { if (!L.has(k)) L.set(k, { c: 7, f: 0 }); }); L.forEach((v, k) => { v.lw = lyLW(k); if (P.bw) v.c = 7; }); return L; };
  const r2Blocks = list => { const B = new Map(); list.forEach(s => s.cont.forEach(p => p.ents.forEach(e => { if (e.t === 'INSERT' && p.X.blocks.has(e.blk) && !B.has(e.blk)) B.set(e.blk, { name: e.blk, ents: r2kBlockEnts(p.X.blocks.get(e.blk).l) }); }))); return [...B.values()]; };
  // 各張圖檔
  all.forEach(s => {
    const ext = { x0: s.Fu.x0, y0: s.Fu.y0, x1: s.Fu.x0 + s.Fu.w, y1: s.Fu.y0 + s.Fu.h };
    if (R2) files.push({ name: s.file, data: r2kDoc({ layers: r2Layers([s]), blocks: r2Blocks([s]), model: contLines(s, 0, 0), sheets: [{ name: s.lay, paper: frameMM(s), vp: vpOf(s, 0, 0) }], units: s.u === 100 ? 5 : 6, ext, images: s.img ? [s.img] : [] }) });
    else { const parts = s.cont.map(p => ({ X: p.X, ents: p.ents, u: s.u, dx: (p.dx || 0) * s.u, dy: (p.dy || 0) * s.u })).concat([frameR12(s)]); files.push({ name: s.file, data: pkgCompose(parts, ext) }); }
  });
  // 合併圖紙檔：各張模型內容由左而右排列（平移，座標不再是 TWD97）；R2000 每張一個配置
  if (P.parts.merged && all.length) {
    let x = 0, yMax = 0; const gap = s => Math.max(5, s.Fu.w * 0.05), pos = [];
    all.forEach(s => { pos.push({ dx: x - s.Fu.x0, dy: -s.Fu.y0 }); x += s.Fu.w + gap(s); yMax = Math.max(yMax, s.Fu.h); });
    const nm = `${P.pre || ''}全部圖紙（合併）.dxf`;
    if (R2) { const model = []; all.forEach((s, i) => model.push(...contLines(s, pos[i].dx, pos[i].dy)));
      files.push({ name: nm, data: r2kDoc({ layers: r2Layers(all), blocks: r2Blocks(all), model, sheets: all.map((s, i) => ({ name: s.lay, paper: frameMM(s), vp: vpOf(s, pos[i].dx, pos[i].dy) })), images: all.flatMap((s, i) => s.img ? [Object.assign({}, s.img, { x: s.img.x * s.u + pos[i].dx, y: s.img.y * s.u + pos[i].dy })] : []), units: 0, ext: { x0: 0, y0: 0, x1: x, y1: yMax } }) }); }
    else { const parts = []; all.forEach((s, i) => { const { dx, dy } = pos[i]; s.cont.forEach(p => parts.push({ X: p.X, ents: p.ents, u: s.u, dx: (p.dx || 0) * s.u + dx, dy: (p.dy || 0) * s.u + dy })); const fr = frameR12(s); parts.push({ X: fr.X, ents: fr.ents, dx, dy }); });
      files.push({ name: nm, data: pkgCompose(parts, { x0: 0, y0: 0, x1: x, y1: yMax }) }); }
  }
  const EM = window.LY_EMAP; if (P.parts.loc && EM && EM.ok) { const ls = all.find(s => s.kind === 'loc' && s.img); if (ls) { const ext = EM.img.file.split('.').pop(), base = `${ls.lay}_LOC_${EM.img.file.replace(/^LOC_|\.[^.]+$/g, '')}`, nm = base + '.' + ext;
    files.forEach(f => { if (f.name === ls.file || /全部圖紙/.test(f.name)) f.data = f.data.split(r2kEsc('.\\' + EM.img.file)).join(r2kEsc('.\\' + nm)); }); EM.outFile = nm;
    files.push({ name: nm, data: EM.files[0].data }, { name: base + (ext === 'png' ? '.pgw' : '.jgw'), data: EM.files[1].data });
    // K2／K4：AutoCAD 指令稿（-IMAGE 依座標插入底圖，路徑取 DWGPREFIX＝DXF 所在資料夾）與手動插入數值
    const im = EM.img, q = v => (+v).toFixed(4), wd = im.px * Math.hypot(im.ux, im.uy), rot = Math.atan2(im.uy, im.ux) * 180 / Math.PI;
    EM.man = { file: nm, x: q(im.x), y: q(im.y), s: q(wd), r: rot.toFixed(4), scr: base + '.scr' };
    files.push({ name: EM.man.scr, data: ['TILEMODE', '1', '-LAYER', 'M', 'LOC_MAP', '', '-IMAGE', 'A', `(strcat (getvar "DWGPREFIX") "${nm}")`, `${EM.man.x},${EM.man.y}`, EM.man.s, EM.man.r, 'DRAWORDER', 'L', '', 'B', 'CLAYER', '0', 'ZOOM', 'E', ''].join('\r\n') + '\r\n' }); } }
  if (P.parts.full) files.push({ name: `${pkgBase()}_全圖.dxf`, data: buildFullDXF() });
  if (P.parts.xlsx && typeof stQtyBook === 'function') { try { const B = stQtyBook(); if (B && B.n) files.push({ name: `${pkgBase()}_數量表.xlsx`, data: xlBook(B.sheets) }); } catch (e) { console.error('pkg xlsx', e); } }
  const scTxt = s => (s.scale && typeof s.scale === 'object' ? `X=${s.scale.x} Y=${s.scale.y}` : s.scale);
  const csv = '﻿序,圖號,圖名,比例尺,檔名\n' + all.map((s, i) => [i + 1, s.no, s.title, scTxt(s), s.file].map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n') + '\n';
  files.push({ name: '圖目錄.csv', data: csv });
  let n = { err: 0, warn: 0 }; try { if (typeof chkRun === 'function') { chkRun(); n = chkCount(); } } catch (e) { }
  const note = [`砥柱 DiZhu 出圖包　${new Date().toLocaleString()}`, '※ 請先把 zip「全部解壓縮」到同一個資料夾，再開 DXF（位置圖底圖是外部影像，直接在 zip 裡開會看不到地圖）。', `機構名稱：${P.agency || '（未填）'}`, `工程名稱：${P.proj || pkgBase()}`, `設計單位：${P.company || '（未填）'}`, `日期：${P.date}`, '',
    `圖紙：A3（420×297 mm）橫式，外框＋內框，底部標題欄 ${PKG_TB} mm（依案例圖說格式）。圖號＝第幾張／總張數。`,
    ...(R2 ? ['DXF 版本：R2000（AC1015）。每個檔案的圖紙在「配置（Layout）」頁籤：配置名稱＝檔名前的序號，圖框與標題欄畫在圖紙空間（mm，1:1），',
      '  內含一個已鎖定比例的視埠顯示模型空間；列印時選該配置、比例 1:1（印表機預設 DWG To PDF／ISO full bleed A3）。模型空間只有圖面內容，不含圖框。',
      '  若軟體只能開 R12，可在設定改選「R12（模型空間圖框）」。']
      : ['DXF 版本：R12。圖框依比例放大畫在模型空間：出圖時以「窗選圖框外框」、比例 1:1000÷比例分母（例：1/500 → 1 mm＝0.5 m）或「布滿」列印。']),
    '圖面單位：平面、縱斷面、橫斷面、數量表＝公尺（m）；標準圖＝公分（cm，1 單位＝1 cm）。橫斷面尺寸標註為公分。',
    ...(P.parts.loc ? [EM && EM.ok ? `位置圖：底圖＝內政部國土測繪中心「${EM.name}」（WMTS z${EM.z}，${EM.got}/${EM.tiles} 圖磚），檔案 ${EM.outFile || EM.img.file}＋定位檔（TWD97）。` + (R2 ? '位置圖 DXF 以影像參考插入，請把影像檔和 DXF 放在同一資料夾。' : 'R12 不能放影像：請用 IMAGEATTACH 插入，或依定位檔對位。') + (EM.man ? `\r\n  若 AutoCAD 開啟後只看到外框或 X：①在位置圖 DXF 裡把那個影像框刪掉；②輸入 SCRIPT 選 ${EM.man.scr}（或把 .scr 拖進 AutoCAD 視窗），會自動依座標貼上底圖；` +
      `\r\n  ③或手動：IMAGEATTACH 選 ${EM.man.file}，插入點 X=${EM.man.x}、Y=${EM.man.y}，比例（寬度）=${EM.man.s}，旋轉=${EM.man.r}°，再用 DRAWORDER 移到最後面。` : '')
      : `位置圖：空白圖框${EM && EM.why ? `（底圖未套：${EM.why}）` : ''}，模型空間座標＝TWD97，請把地形圖依 TWD97 座標插入模型空間即自動對位；工程位置點與座標已標在圖上。`] : []),
    '平面詳圖：依平面詳圖比例沿中心線分張（北朝上），R2000 由視埠裁切；R12 模型空間只保留各張範圍附近的圖元。',
    '縱斷面：比例 X 取縱斷面頁「橫向比例 X」、Y 取「縱向比例 Y」（0＝1/500、1/200）；放不進 A3 時分更多張，不縮比例。',
    '橫斷面：比例取橫斷面頁「比例」，一張排多個斷面（由下而上樁號遞增）；挖填方為平均斷面法體積（與土方計算表相同）。',
    P.font === 'shx' ? '字型：CHT 樣式＝romans.shx＋大字體 chineset.shx（$DWGCODEPAGE＝ANSI_950）。若電腦沒有 chineset.shx，可在設定改用標楷體 kaiu.ttf。' : '字型：CHT 樣式對應 kaiu.ttf（標楷體）。',
    P.bw ? '線條：出圖包圖面一律黑白（顏色 7），以線寬區分：設計線／結構物 0.35 mm、地面線 0.18 mm、尺寸／文字 0.13 mm（R2000 圖層線寬）。' : '線條：保留各圖層顏色。',
    '', `檢核清單：錯誤 ${n.err}、警告 ${n.warn}（出圖前建議先處理錯誤）。`, '', '圖目錄：', ...all.map(s => `  ${s.no}　${s.title}　${scTxt(s)}`)].join('\r\n');
  files.push({ name: '出圖說明.txt', data: '﻿' + note });
  return { files, sheets: all.map(s => ({ no: s.no, lay: s.lay, title: s.title, scale: scTxt(s), page: s.page, file: s.file, kind: s.kind, warn: s.warn || '', F: s.F })), P };
}
/* ZIP（瀏覽器支援時以 deflate 壓縮，否則不壓縮） */
async function pkgZip(files) {
  const enc = new TextEncoder(), parts = [], cen = []; let off = 0;
  const u16 = v => [v & 255, (v >>> 8) & 255], u32 = v => [v & 255, (v >>> 8) & 255, (v >>> 16) & 255, (v >>> 24) & 255];
  const canZ = typeof CompressionStream === 'function';
  for (const f of files) {
    const nm = enc.encode(f.name), raw = typeof f.data === 'string' ? enc.encode(f.data) : f.data, crc = xlCrc(raw);
    let data = raw, meth = 0;
    if (canZ && raw.length > 256) { try { const z = new Uint8Array(await new Response(new Blob([raw]).stream().pipeThrough(new CompressionStream('deflate-raw'))).arrayBuffer()); if (z.length < raw.length) { data = z; meth = 8; } } catch (e) { } }
    const lh = [0x50, 0x4b, 0x03, 0x04, ...u16(20), ...u16(0x0800), ...u16(meth), ...u16(0), ...u16(0x21), ...u32(crc), ...u32(data.length), ...u32(raw.length), ...u16(nm.length), ...u16(0)];
    parts.push(new Uint8Array(lh), nm, data);
    cen.push(new Uint8Array([0x50, 0x4b, 0x01, 0x02, ...u16(20), ...u16(20), ...u16(0x0800), ...u16(meth), ...u16(0), ...u16(0x21), ...u32(crc), ...u32(data.length), ...u32(raw.length), ...u16(nm.length), ...u16(0), ...u16(0), ...u16(0), ...u16(0), ...u32(0), ...u32(off)]), nm);
    off += lh.length + nm.length + data.length;
  }
  const cs = cen.reduce((s, a) => s + a.length, 0), end = new Uint8Array([0x50, 0x4b, 0x05, 0x06, 0, 0, 0, 0, ...u16(files.length), ...u16(files.length), ...u32(cs), ...u32(off), 0, 0]);
  return new Blob([...parts, ...cen, end], { type: 'application/zip' });
}
async function pkgExport() {
  pkgRead(); const btn = document.getElementById('pkgGo'); if (btn) { btn.disabled = true; btn.textContent = '產生中…'; }
  updateStatus('📦 出圖包產生中…'); await new Promise(r => setTimeout(r, 30));
  try {
    window.LY_EMAP = null; state.pkg = pkgNorm(state.pkg);
    if (state.pkg.parts.loc && state.pkg.locMap !== 'none' && typeof lyEmapFetch === 'function') { updateStatus('📦 位置圖：下載國土測繪中心底圖…'); try { await lyEmapFetch(state.pkg); } catch (e) { console.error('emap', e); window.LY_EMAP = { ok: false, why: e.message }; } }
    const R = pkgMake(); if (!R.files.length) { alert('目前沒有可出圖的內容（請先建立中心線）。'); return; }
    const blob = await pkgZip(R.files), nm = `${pkgBase()}_出圖包_${(R.P.date || '').replace(/[./]/g, '')}.zip`, url = URL.createObjectURL(blob), a = document.createElement('a');
    a.href = url; a.download = nm; document.body.appendChild(a); a.click(); document.body.removeChild(a); setTimeout(() => URL.revokeObjectURL(url), 4000);
    const EM = window.LY_EMAP; updateStatus(`📦 已匯出 ${nm}：${R.sheets.length} 張圖，共 ${R.files.length} 個檔案、${(blob.size / 1048576).toFixed(1)} MB。請先全部解壓縮再開 DXF。` + (EM && !EM.ok && EM.why ? `　⚠ 位置圖底圖未套：${EM.why}` : ''));
    window.LY_EMAP = null;
    pkgDlg(false);
  } catch (e) { console.error('pkgExport', e); alert('出圖包產生失敗：' + e.message); }
  finally { if (btn) { btn.disabled = false; btn.textContent = '📦 產生出圖包 (.zip)'; } }
}


/* ---- 設定視窗 ---- */
const PKG_PARTS = [['index', '一般說明及圖目錄'], ['loc', '位置圖（套國土測繪中心底圖，依 TWD97 座標）'], ['plan', '全區平面配置圖'], ['detail', '平面詳圖'], ['prof', '縱斷面圖'], ['sec', '橫斷面詳圖'], ['std', '各工項詳圖（結構物／護岸／排水…）'], ['qty', '結構物數量表'], ['xlsx', '數量表 Excel（.xlsx）'], ['merged', '合併圖紙檔（全部圖框在同一檔）'], ['full', '原全圖 DXF（未加圖框）']];
const PKG_NAMES = [['mgr', '主管'], ['eng', '技師'], ['chk', '校核'], ['des', '設計'], ['drw', '繪圖']];
function pkgRead() {
  const el = id => document.getElementById(id); if (!el('pkgProj')) return; const P = state.pkg, v = id => (el(id) ? el(id).value : '');
  P.agency = v('pkgAgency').trim(); P.proj = v('pkgProj').trim(); P.company = v('pkgCompany').trim(); P.pre = v('pkgPre'); P.start = Math.max(1, parseInt(v('pkgStart'), 10) || 1); P.date = v('pkgDate').trim();
  P.planS = +v('pkgPlanS') || 0; P.detS = +v('pkgDetS') || 500; P.locS = +v('pkgLocS') || 10000; if (el('pkgLocMap')) P.locMap = v('pkgLocMap'); if (el('pkgSecS')) P.secS = +v('pkgSecS') || 0; if (el('pkgSecPt')) P.secPt = el('pkgSecPt').checked; if (el('pkgFmt')) P.fmt = v('pkgFmt'); if (el('pkgFont')) P.font = v('pkgFont'); if (el('pkgSecStyle')) P.secStyle = v('pkgSecStyle');
  if (el('pkgBW')) P.bw = el('pkgBW').checked; if (el('pkgEcoOn')) P.ecoOn = el('pkgEcoOn').checked;
  ['works', 'ctrl', 'notes', 'eco'].forEach(k => { const t = el('pkgT_' + k); if (t) P[k] = t.value; });
  P.names = P.names || {}; PKG_NAMES.forEach(([k]) => { if (el('pkgN_' + k)) P.names[k] = el('pkgN_' + k).value.trim(); });
  PKG_PARTS.forEach(([k]) => { const c = el('pkgP_' + k); if (c) P.parts[k] = c.checked; });
}
function pkgDlg(on) {
  let el = document.getElementById('pkgDlg'); if (on === false) { if (el) el.remove(); return; }
  if (el) { el.remove(); return; }
  state.pkg = pkgNorm(state.pkg); const P = state.pkg, e = s => String(s ?? '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
  let n = { err: 0, warn: 0, info: 0 }; try { if (typeof chkRun === 'function') { chkRun(); n = chkCount(); } } catch (x) { }
  const Hs = state.pf && state.pf.hScale > 0 ? state.pf.hScale : 500, Vs = state.pf && state.pf.vScale > 0 ? state.pf.vScale : 200, S0 = parseFloat((document.getElementById('crossScale') || {}).value) || 200;
  const sel = (id, list, cur, t) => `<select id="${id}" class="input-select"${t ? ` title="${e(t)}"` : ''}>${list.map(([v, l]) => `<option value="${v}"${String(cur) === String(v) ? ' selected' : ''}>${l}</option>`).join('')}</select>`;
  el = document.createElement('div'); el.id = 'pkgDlg';
  el.innerHTML = `<div class="pkg-box"><div class="pkg-hd"><b>📦 一鍵出圖包</b><span style="flex:1"></span><button class="btn" onclick="pkgDlg(false)">✕</button></div>
    <div class="pkg-bd">
      <div class="pkg-sec">標題欄（依案例圖框）</div>
      <div class="pkg-row"><label>機構名稱</label><input id="pkgAgency" class="input-num" value="${e(P.agency)}" placeholder="例：○○○林區管理處"></div>
      <div class="pkg-row"><label>工程名稱</label><input id="pkgProj" class="input-num" value="${e(P.proj)}" placeholder="${e(pkgBase())}"></div>
      <div class="pkg-row"><label>設計單位（公司名稱）</label><input id="pkgCompany" class="input-num" value="${e(P.company)}" placeholder="（可空白）"></div>
      <div class="pkg-row"><label>簽名欄（選填）</label><span class="pkg-names">${PKG_NAMES.map(([k, t]) => `<input id="pkgN_${k}" class="input-num" placeholder="${t}" value="${e(P.names && P.names[k])}">`).join('')}</span></div>
      <div class="pkg-row"><label>日期</label><input id="pkgDate" class="input-num" value="${e(P.date)}" placeholder="${pkgRocDate()}（空白＝今天）"></div>
      <div class="pkg-row"><label>檔名前綴／起始號</label><span style="display:flex;gap:6px;"><input id="pkgPre" class="input-num" style="width:90px" value="${e(P.pre)}" title="只用在檔名與配置名稱；標題欄圖號＝第幾張／總張數"><input id="pkgStart" class="input-num" type="number" min="1" style="width:70px" value="${e(P.start)}"></span></div>
      <div class="pkg-sec">比例與樣式</div>
      <div class="pkg-row"><label>全區平面配置圖</label>${sel('pkgPlanS', [[0, '自動（放得進 A3 的最小比例）']].concat(PKG_SCALES.filter(s => s >= 200 && s <= 10000).map(s => [s, '1/' + s])), P.planS)}</div>
      <div class="pkg-row"><label>平面詳圖</label>${sel('pkgDetS', [200, 250, 300, 400, 500, 600, 800, 1000].map(s => [s, '1/' + s]), P.detS)}</div>
      <div class="pkg-row"><label>位置圖</label>${sel('pkgLocS', [5000, 10000, 12000, 15000, 20000, 25000].map(s => [s, '1/' + s]), P.locS)}</div>
      <div class="pkg-row"><label>位置圖底圖</label>${sel('pkgLocMap', LY_MAPS.map(m => [m[0], m[1]]), P.locMap, '出圖時向內政部國土測繪中心 WMTS 下載，依 TWD97 座標貼在位置圖（需網路；專案座標不是 TWD97 時請先設控制點）')}</div>
      <div class="pkg-row"><label>橫斷面比例</label>${sel('pkgSecS', [[0, `同橫斷面頁（1/${S0}）`]].concat([100, 150, 200, 250, 300, 400, 500].map(s => [s, '1/' + s])), P.secS)}</div>
      <div class="pkg-row"><label>橫斷面樁號</label><label style="display:flex;align-items:center;gap:4px;"><input type="checkbox" id="pkgSecPt"${P.secPt ? ' checked' : ''}> 加註點名（VIP、BC、MC…）</label></div>
      <div class="pkg-row"><label>橫斷面版型</label>${sel('pkgSecStyle', [['auto', '自動（主流無格線、支流帶格線）'], ['plain', '無格線'], ['grid', '帶高程／距離格線']], P.secStyle)}</div>
      <div class="pkg-row"><label>字型</label>${sel('pkgFont', [['shx', 'romans.shx＋chineset.shx（案例）'], ['ttf', '標楷體 kaiu.ttf']], P.font, '全部 DXF 輸出共用')}</div>
      <div class="pkg-row"><label>DXF 格式</label>${sel('pkgFmt', [['r2000', 'R2000＋A3 配置（Layout）'], ['r12', 'R12（模型空間圖框，舊）']], P.fmt === 'r12' ? 'r12' : 'r2000', 'R2000：每張圖一個 A3 配置（Layout），圖框在圖紙空間、視埠鎖定比例；R12：舊格式，圖框依比例畫在模型空間')}</div>
      <div class="pkg-row"><label>線條</label><label style="display:flex;align-items:center;gap:4px;"><input type="checkbox" id="pkgBW"${P.bw ? ' checked' : ''}> 黑白出圖（以線寬區分）</label></div>
      <div class="pkg-note">縱斷面 X=1/${Hs}、Y=1/${Vs}（縱斷面頁設定）放不進 A3 時分更多張；橫斷面 1/${+P.secS || S0}，一張排多個斷面（由下而上樁號遞增）；標準圖與數量表自動取比例。</div>
      <div class="pkg-parts">${PKG_PARTS.map(([k, t]) => `<label><input type="checkbox" id="pkgP_${k}"${P.parts[k] ? ' checked' : ''}> ${t}</label>`).join('')}</div>
      <details class="pkg-det"><summary>全區平面配置圖：工程內容、控制點</summary>
        <div class="pkg-note">工程內容空白＝由數量自動帶出（依工程總表）。控制點每行一點：點號, X, Y, Z。</div>
        <textarea id="pkgT_works" rows="5" placeholder="${e(lyWorksAuto().join('\n'))}">${e(P.works)}</textarea>
        <textarea id="pkgT_ctrl" rows="3" placeholder="BM1, 244090.78, 2686867.45, 701.25">${e(P.ctrl)}</textarea></details>
      <details class="pkg-det"><summary>第 1 張：特別說明／一般說明</summary><textarea id="pkgT_notes" rows="10">${e(P.notes)}</textarea></details>
      <details class="pkg-det"><summary>第 1 張：環境生態保護特別說明</summary><label style="display:flex;align-items:center;gap:4px;margin:4px 0;"><input type="checkbox" id="pkgEcoOn"${P.ecoOn ? ' checked' : ''}> 列在第 1 張</label><textarea id="pkgT_eco" rows="6">${e(P.eco)}</textarea></details>
      ${n.err || n.warn ? `<div class="pkg-chk">檢核清單：<b style="color:#dc2626">✗ 錯誤 ${n.err}</b>　<b style="color:#d97706">⚠ 警告 ${n.warn}</b>　<button class="btn" onclick="chkToggle(true)">查看</button><br><span>建議出圖前先處理錯誤（不影響產生出圖包）。</span></div>` : '<div class="pkg-chk ok">✔ 檢核清單沒有錯誤或警告。</div>'}
    </div>
    <div class="pkg-ft"><button class="btn" onclick="pkgDlg(false)">取消</button><button class="btn amber" id="pkgGo" onclick="pkgExport()">📦 產生出圖包 (.zip)</button></div></div>`;
  el.addEventListener('mousedown', ev => { if (ev.target === el) pkgDlg(false); });
  el.addEventListener('change', () => pkgRead()); el.addEventListener('input', () => pkgRead());
  document.body.appendChild(el);
}
(function () {
  const s = document.createElement('style');
  s.textContent = `
  #pkgDlg { position:fixed; inset:0; z-index:9500; background:rgba(0,0,0,.45); display:flex; align-items:center; justify-content:center; }
  #pkgDlg .pkg-box { width:min(calc(470px * var(--ts, 1)), calc(100vw - 32px)); max-height:calc(100vh - 40px); display:flex; flex-direction:column; background:#fff; color:#0f172a; border-radius:8px; box-shadow:0 12px 36px rgba(0,0,0,.4); font-size:calc(9.5px * var(--ts, 1)); }
  #pkgDlg .pkg-hd { display:flex; align-items:center; padding:8px 12px; border-bottom:1px solid #e2e8f0; font-size:1.15em; }
  #pkgDlg .pkg-bd { padding:8px 12px; overflow:auto; }
  #pkgDlg .pkg-sec { font-weight:700; color:#0369a1; margin:6px 0 4px; }
  #pkgDlg .pkg-row { display:grid; grid-template-columns:10em 1fr; align-items:center; gap:6px; margin-bottom:5px; }
  #pkgDlg .pkg-row input:not([type]), #pkgDlg .pkg-row select { width:100%; box-sizing:border-box; }
  #pkgDlg .pkg-names { display:grid; grid-template-columns:repeat(5, 1fr); gap:4px; }
  #pkgDlg input, #pkgDlg select, #pkgDlg textarea { background:#fff !important; color:#0f172a !important; border:1px solid #cbd5e1 !important; text-align:left !important; font-family:inherit; font-size:1em; padding:3px 6px; border-radius:4px; }
  #pkgDlg textarea { width:100%; box-sizing:border-box; margin-top:4px; resize:vertical; }
  #pkgDlg input[type=checkbox] { width:auto; padding:0; }
  #pkgDlg .btn { background:#f1f5f9; color:#0f172a; border:1px solid #cbd5e1; }
  #pkgDlg .btn.amber { background:#d97706; color:#fff; border-color:#b45309; font-weight:700; }
  #pkgDlg .pkg-note { font-size:.88em; color:#475569; line-height:1.55; margin:4px 0 6px; }
  #pkgDlg .pkg-parts { display:grid; grid-template-columns:1fr 1fr; gap:3px 10px; padding:6px 8px; border:1px solid #e2e8f0; border-radius:6px; }
  #pkgDlg .pkg-parts label { display:flex; align-items:center; gap:4px; }
  #pkgDlg .pkg-det { margin-top:6px; border:1px solid #e2e8f0; border-radius:6px; padding:4px 8px; }
  #pkgDlg .pkg-det summary { cursor:pointer; color:#0369a1; }
  #pkgDlg .pkg-chk { margin-top:8px; padding:6px 8px; border:1px solid #fcd34d; background:#fffbeb; border-radius:6px; line-height:1.6; }
  #pkgDlg .pkg-chk span { font-size:.88em; color:#64748b; }
  #pkgDlg .pkg-chk.ok { border-color:#86efac; background:#f0fdf4; color:#15803d; font-weight:700; }
  #pkgDlg .pkg-ft { display:flex; justify-content:flex-end; gap:8px; padding:8px 12px; border-top:1px solid #e2e8f0; }`;
  document.head.appendChild(s);
  const _cp = collectProject; collectProject = function () { const o = _cp.apply(this, arguments); try { o.data.pkg = JSON.parse(JSON.stringify(state.pkg)); } catch (e) { } return o; };
  const _ap = applyProject; applyProject = function (obj) { state.pkg = pkgNorm(obj && obj.data && obj.data.pkg); return _ap.apply(this, arguments); };
  window.addEventListener('load', () => setTimeout(() => {
    const dx = [...document.querySelectorAll('button')].find(b => /exportFullDXF\(\)/.test(b.getAttribute('onclick') || ''));
    if (dx && !document.getElementById('btnPkg')) { const b = document.createElement('button'); b.className = 'btn amber'; b.id = 'btnPkg'; b.textContent = '📦 出圖包'; b.title = '一鍵出圖包：依案例圖框，每張圖一個 DXF（A3、圖號、比例尺、標題欄）＋說明及圖目錄＋數量表，打包成 ZIP'; b.onclick = () => pkgDlg(); dx.parentNode.insertBefore(b, dx.nextSibling); }
  }, 60));
})();
