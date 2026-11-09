/* ============================================================================
   lymod.js（v7.0）出圖包依案例圖說排版
   - 第 1 張：一般說明及圖目錄（大標題機構＋工程名稱、特別說明／一般說明、圖目錄兩欄表、環境生態保護特別說明）
   - 位置圖：空白圖框，模型空間＝TWD97，標工程位置與座標
   - 全區平面配置圖：工程內容、圖例、控制點座標、IP 資料曲線表、指北針、比例尺條（紙上 mm 疊加）
   - 平面詳圖：沿中心線依比例分張（北朝上），相鄰張畫接續框
   - 縱斷面圖：固定 X／Y 比例，放不下就多分幾張；高程尺＋DATUM ELEV、樁號垂直線、資料表（案例列序）、線別引線
   - 橫斷面詳圖：一張排多個斷面（由下而上樁號遞增），樁號雙底線、挖填方、尺寸（cm）、護岸引線；可選格線版型
   - 黑白出圖（顏色 7）＋圖層線寬；字型 romans.shx＋chineset.shx
   ============================================================================ */
function lyShx() { return !(state.pkg && state.pkg.font === 'ttf'); }
(function () {   // 字型：全部 DXF 輸出共用（R12 寫出器）
  const _mk = makeDXFWriter;
  makeDXFWriter = function () {
    const D = _mk.apply(this, arguments), b = D.build;
    D.build = function () { let s = b.apply(this, arguments); if (lyShx()) s = s.replace('\n3\nkaiu.ttf\n4\n\n', '\n3\nromans.shx\n4\nchineset.shx\n').replace('$ACADVER\n1\nAC1009\n', '$ACADVER\n1\nAC1009\n9\n$DWGCODEPAGE\n3\nANSI_950\n'); return s; };
    return D;
  };
})();

/* ---- 共用：紙上 mm 繪圖、黑白、線寬 ---- */
function lyPM(D, F) {
  const k = F.S / 1000, X = mm => F.x0 + mm * k, Y = mm => F.y0 + mm * k;
  return { k, X, Y,
    L: (a, b, c, d, ly, lt) => D.line(X(a), Y(b), 0, X(c), Y(d), 0, ly || 'PKG_PAPER', 7, lt),
    P: (pts, ly, cl, lt) => D.poly(pts.map(p => [X(p[0]), Y(p[1])]), ly || 'PKG_PAPER', 7, 0, !!cl, lt),
    T: (x, y, h, s, o, ly) => { s = String(s ?? ''); if (s) D.text(X(x), Y(y), h * k, s, ly || 'PKG_PAPER', 7, o || {}); },
    C: (x, y, r, ly) => D.circle(X(x), Y(y), r * k, ly || 'PKG_PAPER', 7) };
}
function lyRecolor(l) { const o = l.slice(); for (let i = 0; i + 1 < o.length; i += 2) if (String(o[i]).trim() === '62' && +o[i + 1] > 0) o[i + 1] = '7'; return o; }
function lyBWe(e) { return e._bw ? e : Object.assign({}, e, { l: lyRecolor(e.l), _bw: 1 }); }
function lyBW(X) {
  if (!X || X._bw) return; X._bw = 1;
  X.layers.forEach((v, k) => X.layers.set(k, v.replace(/(^|\n)62\n(-?)\d+/, '$162\n$27')));
  X.blocks.forEach(b => { b.l = lyRecolor(b.l); });
}
function lyLW(n) {   // 圖層線寬（1/100 mm）
  n = String(n).toUpperCase();
  if (n === 'PKG_FRAME') return 50; if (n === 'PKG_TB') return 25;
  if (/DIM|TEXT|TAG|GRID|TABLE|LEADER|LEGEND|NORTH|^STA_|CONT|INDEX|PAPER|VERTEX|MATCH|NOTE|SEC_CL|PROF_STA|LOC_/.test(n)) return 13;
  if (/GROUND/.test(n)) return 18;
  if (/DESIGN|STRUCT|REV_|WALL|^STD_|DRAIN|^DN|CENTERLINE|PROF_REV|GRD|BIO|FRB/.test(n)) return 35;
  return 18;
}
function lyStdTitle(t) {   // 標準圖標題 → 案例圖名「…詳圖」
  let s = String(t).replace(/\s*S=1:\d+\s*/g, ' ').replace(/（[^）]*）|\([^)]*\)/g, ' ').replace(/參數取本段起點[\s\S]*$/, '').replace(/\d+K\+[\d.]+/g, ' ').replace(/標準斷面|標準圖/g, ' ').replace(/\s+/g, ' ').trim();
  if (!/詳圖$/.test(s)) s += '詳圖'; if (s.length > 30) s = s.slice(0, 29) + '…'; return s;
}
function lyWorksAuto() {   // 工程內容（依工程總表）
  try { const B = ttBuild(false); return B.types.map((T, i) => `${i + 1}. ${T.cat}${T.hasL ? ` 共 ${(+T.L).toFixed(1)} m` : ` 共 ${T.works.length} 處`}`); } catch (e) { return []; }
}
function lyWrap(s, h, w) {   // 依寬度斷行（中文逐字、英數不切字）
  const out = []; String(s).split('\n').forEach(line => {
    const ind = (line.match(/^\s*(\d+\.|[a-z]\.)?\s*/) || [''])[0], pad = ' '.repeat(Math.min(6, ind.length)); let cur = '';
    for (const ch of line) { if (pkgTW(cur + ch, h) > w && cur.trim()) { out.push(cur); cur = pad + (ch === ' ' ? '' : ch); } else cur += ch; }
    out.push(cur);
  });
  return out;
}
function lyNorth(pm, x, y, s) {   // 指北針（x,y＝中心 mm）
  pm.P([[x, y + 9 * s], [x - 3 * s, y - 4 * s], [x, y - 1.5 * s], [x + 3 * s, y - 4 * s]], 'PKG_NORTH', true);
  pm.L(x, y + 9 * s, x, y - 1.5 * s, 'PKG_NORTH'); pm.C(x, y + 1 * s, 4.2 * s, 'PKG_NORTH');
  pm.T(x, y + 10.5 * s, 4.5 * s, 'N', { align: 'c' }, 'PKG_NORTH');
}
function lyScaleBar(pm, x, y, S) {   // 比例尺條（x,y＝左下 mm）
  const nice = [5, 10, 20, 25, 50, 100, 200, 250, 500, 1000, 2000], m = nice.filter(v => v * 1000 / S <= 32).pop() || nice[0], L = m * 1000 / S, h = 1.6;
  pm.P([[x, y], [x + L, y], [x + L, y + h], [x, y + h]], 'PKG_NORTH', true); pm.P([[x, y], [x + L / 2, y], [x + L / 2, y + h], [x, y + h]], 'PKG_NORTH', true);
  for (let i = 0; i < 8; i++) pm.L(x + i * 0.2, y, x + i * 0.2, y + h, 'PKG_NORTH');   // 半段塗黑（細線填）
  for (let t = 0.2; t < L / 2; t += 0.35) pm.L(x + t, y, x + t, y + h, 'PKG_NORTH');
  pm.T(x, y + h + 1.2, 2.6, '0', { align: 'c' }, 'PKG_NORTH'); pm.T(x + L / 2, y + h + 1.2, 2.6, String(m / 2), { align: 'c' }, 'PKG_NORTH'); pm.T(x + L + 1, y + h + 1.2, 2.6, `${m}m`, { align: 'l' }, 'PKG_NORTH');
}
function lyAllAlign(step) {   // 全部中心線取樣點：[{cl, name, pts:[[x,y,s]]}]
  const out = []; clEach(i => { const al = state.alignment; if (!al.segments || !al.segments.length) return; const P = [], st = step || Math.max(2, al.totalLength / 300);
    for (let s = al.startSta; s <= al.endSta + 1e-6; s += st) { const g = getPointAndNormalAtStation(Math.min(s, al.endSta)); if (g) P.push([g.x, g.y, s, g.nx, g.ny]); }
    const g = getPointAndNormalAtStation(al.endSta); if (g) P.push([g.x, g.y, al.endSta, g.nx, g.ny]);
    out.push({ cl: i, name: clName(i), pts: P, half: (parseFloat(clEl('corridorWidth').value) || 14) / 2 }); });
  return out;
}

/* ---- 第 1 張：一般說明及圖目錄 ---- */
const LY_COV = { rh: 5.6, hdr: 6, top1: 232, top2: 262, bot: PKG_U.y0 + 3 };
function lyCovEco(P) { return P.ecoOn && String(P.eco || '').trim() ? lyWrap(P.eco, 2.8, 172) : []; }
function lyCovRows(P, pg) {   // 該頁每欄列數
  if (pg) return Math.floor((LY_COV.top2 - LY_COV.hdr - LY_COV.bot) / LY_COV.rh);
  const eco = lyCovEco(P), ecoTop = LY_COV.bot + (eco.length ? eco.length * 4.8 + 6 : 0);
  return Math.max(4, Math.floor((LY_COV.top1 - LY_COV.hdr - ecoTop) / LY_COV.rh));
}
function lyCoverCount(n, P) { P = P || pkgNorm(state.pkg); let k = 1; const cap = k => 2 * lyCovRows(P, 0) + (k - 1) * 2 * lyCovRows(P, 1); while (cap(k) < n + k) k++; return k; }
function lyCoverSheets(P, stubs, sheets) {
  const list = stubs.concat(sheets).map(s => ({ no: s.no, title: s.title })), out = []; let at = 0;
  stubs.forEach((s, pg) => {
    const S = 100, F = { x0: 0, y0: 0, w: 42, h: 29.7, S }, D = makeDXFWriter(), pm = lyPM(D, F), ly = 'PKG_INDEX';
    const rows = lyCovRows(P, pg), x0 = pg ? 40 : 212, cw = pg ? [22, 148] : [18, 76], top = pg ? LY_COV.top2 : LY_COV.top1, W = 2 * (cw[0] + cw[1]);
    if (!pg) {
      const tl = [P.agency, P.proj || pkgBase()].filter(Boolean);
      tl.forEach((t, i) => pm.T(210, 271 - i * 12 - (tl.length === 1 ? 6 : 0), pkgFit(t, 7.5, 360), t, { align: 'c', valign: 'm' }, ly));
      let lines = lyWrap(P.notes || '', 3.0, 162), lh = 5.0, th = 3.0; const avail = 244 - (PKG_U.y0 + 3);
      if (lines.length * lh > avail) { th = 2.6; lh = 4.3; lines = lyWrap(P.notes || '', th, 162); }
      lines.forEach((t, i) => pm.T(22, 244 - i * lh, th, t, { valign: 't' }, ly));
      pm.T(x0 + W / 2, 242, 5.5, '圖　　　目　　　錄', { align: 'c', valign: 'm' }, ly);
      const eco = lyCovEco(P); eco.forEach((t, i) => pm.T(x0 - 2, LY_COV.bot + eco.length * 4.8 + 2 - i * 4.8, i ? 2.8 : 3.2, t, { valign: 't' }, ly));
    } else pm.T(210, 272, 5.5, `圖　　　目　　　錄（續 ${pg + 1}/${stubs.length}）`, { align: 'c', valign: 'm' }, ly);
    const H = LY_COV.hdr + rows * LY_COV.rh, yb = top - H;
    pm.P([[x0, top], [x0 + W, top], [x0 + W, yb], [x0, yb]], ly, true);
    pm.L(x0, top - LY_COV.hdr, x0 + W, top - LY_COV.hdr, ly);
    for (let i = 1; i < rows; i++) pm.L(x0, top - LY_COV.hdr - i * LY_COV.rh, x0 + W, top - LY_COV.hdr - i * LY_COV.rh, ly);
    let x = x0; [0, 1, 0, 1].forEach((c, j) => { if (j) pm.L(x, top, x, yb, ly); pm.T(x + cw[c] / 2, top - LY_COV.hdr / 2, 3.0, c ? '圖　　　名' : '圖　號', { align: 'c', valign: 'm' }, ly); x += cw[c]; });
    for (let col = 0; col < 2; col++) for (let r = 0; r < rows; r++) {
      const it = list[at++]; if (!it) break; const yy = top - LY_COV.hdr - (r + 0.5) * LY_COV.rh, xc = x0 + col * (cw[0] + cw[1]);
      pm.T(xc + cw[0] / 2, yy, 2.8, it.no, { align: 'c', valign: 'm' }, ly); pm.T(xc + cw[0] + 1.5, yy, pkgFit(it.title, 2.8, cw[1] - 3), it.title, { valign: 'm' }, ly);
    }
    out.push(Object.assign(s, { kind: 'index', D, F, scale: '' }));
  });
  return out;
}

/* ---- 位置圖：空白圖框，依 TWD97 座標放置 ---- */
function lyLocFrame(P) {   // 位置圖中心與圖框（專案座標）
  const A = lyAllAlign(); if (!A.length) return null;
  const S = +P.locS || 10000; let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  A.forEach(a => a.pts.forEach(p => { x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); }));
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2; return { A, S, cx, cy, F: pkgFrameAt({ x0: cx, x1: cx, y0: cy, y1: cy }, S) };
}
function lyGeo() { return typeof dzGeo === 'function' ? dzGeo() : { ok: false, f: (x, y) => ({ E: x, N: y }), g: (E, N) => ({ x: E, y: N }) }; }
function lyLocSheets(P) {
  const L = lyLocFrame(P); if (!L) return [];
  const { A, S, cx, cy, F } = L, k = S / 1000, D = makeDXFWriter(), r = 3.5 * k, tw = lyGeo().f(cx, cy);
  A.forEach(a => D.poly(a.pts.map(p => [p[0], p[1]]), 'LOC_ALIGN', 1));
  D.circle(cx, cy, r, 'LOC_MARK', 1); D.circle(cx, cy, r * 0.25, 'LOC_MARK', 1); D.line(cx - r * 1.8, cy, 0, cx + r * 1.8, cy, 0, 'LOC_MARK', 1); D.line(cx, cy - r * 1.8, 0, cx, cy + r * 1.8, 0, 'LOC_MARK', 1);
  D.line(cx + r * 0.7, cy + r * 0.7, 0, cx + 12 * k, cy + 9 * k, 0, 'LOC_TEXT', 7); D.line(cx + 12 * k, cy + 9 * k, 0, cx + 40 * k, cy + 9 * k, 0, 'LOC_TEXT', 7);
  D.text(cx + 13 * k, cy + 10 * k, 4 * k, '工程位置', 'LOC_TEXT', 7);
  D.text(cx + 13 * k, cy + 4 * k, 2.8 * k, `GPS 座標（TWD97）：X=${tw.E.toFixed(2)}，Y=${tw.N.toFixed(2)}`, 'LOC_TEXT', 7);
  const X = pkgParse(D.build()), M = window.LY_EMAP && window.LY_EMAP.ok ? window.LY_EMAP : null;
  return [{ kind: 'loc', title: '位置圖', X, ents: X.ents, F, scale: pkgSc(S), unit: '公尺', warn: '', img: M ? M.img : null,
    extra: (FD, FF) => { const pm = lyPM(FD, FF); lyNorth(pm, 392, 266, 1); lyScaleBar(pm, 360, PKG_U.y0 + 4, S); if (M) pm.T(PKG_U.x0 + 1, PKG_U.y0 + 1, 2.0, `底圖：內政部國土測繪中心 ${M.name}`, {}, 'PKG_TB_TEXT'); } }];
}
/* ---- 位置圖底圖：出圖時向國土測繪中心 WMTS 抓圖磚，拼成北朝上、對齊 TWD97 的影像 ---- */
const LY_MAPS = [['EMAP', '臺灣通用電子地圖', 'png'], ['EMAP5', '通用電子地圖（套疊等高線）', 'png'], ['PHOTO2', '正射影像', 'jpg'], ['none', '不套底圖（空白圖框）', '']];
async function lyEmapFetch(P, opt) {
  opt = opt || {}; window.LY_EMAP = null; const lay = P.locMap || 'EMAP'; if (lay === 'none' || !P.parts.loc) return null;
  const L = lyLocFrame(P); if (!L) return null;
  const meta = LY_MAPS.find(m => m[0] === lay) || [lay, lay, 'png'], G = lyGeo(), k = L.S / 1000, A = PKG_PAPER;
  const fail = why => (window.LY_EMAP = { ok: false, why, name: meta[1] });
  // 圖框內框（標題欄以上）→ TWD97 範圍
  const cor = [[A.ix0, A.iy0 + PKG_TB], [A.ix1, A.iy0 + PKG_TB], [A.ix0, A.iy1], [A.ix1, A.iy1]].map(([x, y]) => G.f(L.F.x0 + x * k, L.F.y0 + y * k));
  const E0 = Math.min(...cor.map(c => c.E)), E1 = Math.max(...cor.map(c => c.E)), N0 = Math.min(...cor.map(c => c.N)), N1 = Math.max(...cor.map(c => c.N));
  const ll0 = DZ_TM.inv((E0 + E1) / 2, (N0 + N1) / 2); if (!(ll0.lat > 20.5 && ll0.lat < 27 && ll0.lon > 117.5 && ll0.lon < 123.5)) return fail('座標不在台灣範圍（專案座標不是 TWD97，請在「整治/底圖」設定兩個控制點）');
  const want = 0.25 * k, cosl = Math.cos(ll0.lat * Math.PI / 180); let z = Math.ceil(Math.log2(156543.034 * cosl / want)); z = Math.max(10, Math.min(17, z));
  const n = 2 ** z, tx = lon => (lon + 180) / 360 * n, ty = lat => { const q = lat * Math.PI / 180; return (1 - Math.log(Math.tan(q) + 1 / Math.cos(q)) / Math.PI) / 2 * n; };
  const LL = [[E0, N0], [E1, N0], [E0, N1], [E1, N1]].map(([e, nn]) => DZ_TM.inv(e, nn));
  const X0 = Math.floor(Math.min(...LL.map(c => tx(c.lon)))), X1 = Math.floor(Math.max(...LL.map(c => tx(c.lon)))), Y0 = Math.floor(Math.min(...LL.map(c => ty(c.lat)))), Y1 = Math.floor(Math.max(...LL.map(c => ty(c.lat))));
  if ((X1 - X0 + 1) * (Y1 - Y0 + 1) > 600) return fail('圖磚太多（比例太小）');
  const res = 156543.034 * cosl / n, W = Math.min(8000, Math.ceil((E1 - E0) / res)), H = Math.min(8000, Math.ceil((N1 - N0) / res)), r2 = Math.max((E1 - E0) / W, (N1 - N0) / H);
  const load = (X, Y) => new Promise(ok => { const im = new Image(), t = setTimeout(() => ok(null), opt.timeout || 12000); im.crossOrigin = 'anonymous';
    im.onload = () => { clearTimeout(t); ok(im); }; im.onerror = () => { clearTimeout(t); ok(null); };
    im.src = (opt.url || ((L2, z2, x2, y2) => `https://wmts.nlsc.gov.tw/wmts/${encodeURIComponent(L2)}/default/GoogleMapsCompatible/${z2}/${y2}/${x2}`))(lay, z, X, Y); });
  const jobs = []; for (let X = X0; X <= X1; X++) for (let Y = Y0; Y <= Y1; Y++) jobs.push(load(X, Y).then(im => ({ X, Y, im })));
  const T = await Promise.all(jobs), got = T.filter(t => t.im).length;
  if (!got || got < T.length * 0.5) return fail(`圖磚下載失敗（${got}/${T.length}，請確認網路可連到 wmts.nlsc.gov.tw）`);
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const ctx = cv.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H); ctx.imageSmoothingEnabled = true;
  const px = (X, Y) => { const lon = X / n * 360 - 180, lat = Math.atan(Math.sinh(Math.PI * (1 - 2 * Y / n))) * 180 / Math.PI, t = DZ_TM.fwd(lat, lon); return { x: (t.E - E0) / r2, y: (N1 - t.N) / r2 }; };
  T.forEach(({ X, Y, im }) => { if (!im) return; const a = px(X, Y), b = px(X + 1, Y), c = px(X, Y + 1);
    ctx.setTransform((b.x - a.x) / 256, (b.y - a.y) / 256, (c.x - a.x) / 256, (c.y - a.y) / 256, a.x, a.y); ctx.drawImage(im, 0, 0, 256, 256); });
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  let bytes; try { const bl = await new Promise((ok, no) => cv.toBlob(b => b ? ok(b) : no(new Error('toBlob')), meta[2] === 'jpg' ? 'image/jpeg' : 'image/png', 0.9)); bytes = new Uint8Array(await bl.arrayBuffer()); }
  catch (e) { return fail('瀏覽器不允許輸出圖磚影像（跨網域限制）'); }
  // 影像在專案座標的位置（左下角＋每像素 U、V 向量；有控制點時含旋轉）
  const Eb = E0, Nb = N1 - H * r2, o = G.g(Eb, Nb), u = G.g(Eb + r2, Nb), v = G.g(Eb, Nb + r2), file = `LOC_${lay}.${meta[2]}`;
  const pgw = [r2, 0, 0, -r2, E0 + r2 / 2, N1 - r2 / 2].map(x => x.toFixed(6)).join('\r\n') + '\r\n';
  window.LY_EMAP = { ok: true, name: meta[1], z, tiles: T.length, got, img: { file, x: o.x, y: o.y, ux: u.x - o.x, uy: u.y - o.y, vx: v.x - o.x, vy: v.y - o.y, px: W, py: H, ly: 'LOC_MAP' },
    files: [{ name: file, data: bytes }, { name: file.replace(/\.(png|jpg)$/, m => m === '.png' ? '.pgw' : '.jgw'), data: pgw }] };
  return window.LY_EMAP;
}

/* ---- 全區平面配置圖 ---- */
function lyPlanBB(PX, A, pad) {
  let b = { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity }; const t = (x, y) => { b.x0 = Math.min(b.x0, x); b.x1 = Math.max(b.x1, x); b.y0 = Math.min(b.y0, y); b.y1 = Math.max(b.y1, y); };
  A.forEach(a => a.pts.forEach(p => { t(p[0] - p[3] * (a.half + 15), p[1] - p[4] * (a.half + 15)); t(p[0] + p[3] * (a.half + 15), p[1] + p[4] * (a.half + 15)); }));
  if (!Number.isFinite(b.x0)) b = pkgBB(PX.ents, e => /^CONT/.test(e.ly)) || b;
  const m = Math.max(b.x1 - b.x0, b.y1 - b.y0) * (pad || 0.04); return { x0: b.x0 - m, y0: b.y0 - m, x1: b.x1 + m, y1: b.y1 + m };
}
function lyClip(ents, R, m) { return ents.filter(e => e.t === 'INSERT' || !Number.isFinite(e.x0) || (e.x1 >= R.x0 - m && e.x0 <= R.x1 + m && e.y1 >= R.y0 - m && e.y0 <= R.y1 + m)); }
function lyIpData() {   // 各中心線 IP 表資料
  const out = []; clEach(i => { const L = state.alignment.ipList || []; if (L.length < 2) return; const n = L.length;
    out.push({ name: clName(i), cols: L.map((ip, c) => { const end = c === 0 || c === n - 1; return [c === 0 ? 'BP' : c === n - 1 ? 'EP' : ip.label, end ? '' : `${ip.deflDMS}${ip.ccw ? 'L' : 'R'}`, end ? '' : (+ip.r).toFixed(0), c ? (+L[c - 1].distToNext).toFixed(2) : '0.00',
      end ? '' : (+ip.tl).toFixed(2), end ? '' : (+ip.cl).toFixed(2), end ? '' : (+ip.sl).toFixed(2), end ? '' : formatStation(ip.bcSta), end ? '' : formatStation(ip.mcSta), end ? '' : formatStation(ip.ecSta)]; }) }); });
  return out;
}
function lyPlanSheet(P, PX) {
  const A = lyAllAlign(); if (!A.length) return null;
  const works = String(P.works || '').trim() ? String(P.works).split('\n').filter(s => s.trim()) : lyWorksAuto();
  const ctrl = String(P.ctrl || '').split('\n').map(s => s.split(/[,，\t]+/).map(v => v.trim())).filter(r => r.length >= 3 && r[0]);
  const IP = lyIpData(), per = 5, chunks = []; IP.forEach(t => { for (let i = 0; i < t.cols.length; i += per) chunks.push({ name: t.name, cols: t.cols.slice(i, i + per), first: i === 0 }); });
  const IPR = ['IPNO', 'I', 'R', 'D', 'TL', 'CL', 'SL', 'BC', 'MC', 'EC'], rh = 4.0, cw0 = 12, cw = 17.4, chH = c => (c.first ? 6 : 0) + rh * IPR.length + 2;
  const leftW = 104, Up = { x0: PKG_U.x0 + leftW + 2, y0: PKG_U.y0, x1: PKG_U.x1, y1: PKG_U.y1 - 26 };
  const bb = lyPlanBB(PX, A), f = pkgFitScale(bb, +P.planS || 0, Up), F = pkgFrameAt(bb, f.S, Up), k = f.S / 1000;
  const R = { x0: F.x0 + PKG_PAPER.ix0 * k, y0: F.y0 + PKG_PAPER.iy0 * k, x1: F.x0 + PKG_PAPER.ix1 * k, y1: F.y0 + PKG_PAPER.iy1 * k };
  const extra = (FD, FF) => {
    const pm = lyPM(FD, FF), x0 = PKG_U.x0 + 2; let y = PKG_U.y1 - 4;
    // 工程內容
    if (works.length) { pm.T(x0, y, 5.5, '工程內容：', { valign: 't' }, 'PKG_NOTE'); y -= 9; works.forEach(t => lyWrap(t, 3.2, leftW - 4).forEach((s, i) => { pm.T(x0 + (i ? 4 : 1), y, 3.2, s.trim(), { valign: 't' }, 'PKG_NOTE'); y -= 5.2; })); y -= 3; }
    // 圖例
    const LG = [['cont', '地形等高線'], ['cl', '中心線'], ['rv', '護岸'], ['st', '結構物（壩、固床工）'], ['sta', '橫斷面樁號線']], lw1 = 26, lw2 = 46;
    pm.T(x0, y, 3.5, '圖例', { valign: 't' }, 'PKG_LEGEND'); y -= 6;
    const yl = y; pm.P([[x0, yl], [x0 + lw1 + lw2, yl], [x0 + lw1 + lw2, yl - LG.length * 5], [x0, yl - LG.length * 5]], 'PKG_LEGEND', true); pm.L(x0 + lw1, yl, x0 + lw1, yl - LG.length * 5, 'PKG_LEGEND');
    LG.forEach(([kd, t], i) => { const ym = yl - (i + 0.5) * 5, xa = x0 + 3, xb = x0 + lw1 - 3; if (i) pm.L(x0, yl - i * 5, x0 + lw1 + lw2, yl - i * 5, 'PKG_LEGEND');
      if (kd === 'cont') { pm.P([[xa, ym - 1], [xa + 6, ym + 0.8], [xa + 13, ym - 0.6], [xb, ym + 1]], 'PKG_LEGEND'); }
      else if (kd === 'cl') { pm.L(xa, ym, xa + 6, ym, 'PKG_LEGEND'); pm.L(xa + 7.5, ym, xa + 8.5, ym, 'PKG_LEGEND'); pm.L(xa + 10, ym, xb, ym, 'PKG_LEGEND'); }
      else if (kd === 'rv') { pm.L(xa, ym + 1, xb, ym + 1, 'PKG_LEGEND'); pm.L(xa, ym - 1, xb, ym - 1, 'PKG_LEGEND'); for (let q = xa; q < xb; q += 2) pm.L(q, ym - 1, q + 1, ym + 1, 'PKG_LEGEND'); }
      else if (kd === 'st') { pm.P([[xa, ym - 1.2], [xb, ym - 1.2], [xb, ym + 1.2], [xa, ym + 1.2]], 'PKG_LEGEND', true); }
      else { pm.L((xa + xb) / 2, ym - 2, (xa + xb) / 2, ym + 2, 'PKG_LEGEND'); pm.L(xa, ym, xb, ym, 'PKG_LEGEND', 'DASHED'); }
      pm.T(x0 + lw1 + 2, ym, 2.8, t, { valign: 'm' }, 'PKG_LEGEND'); });
    y = yl - LG.length * 5 - 6;
    // 控制點座標及高程
    if (ctrl.length) { const cc = [12, 28, 28, 18]; pm.T(x0, y, 3.5, '控制點座標及高程：', { valign: 't' }, 'PKG_TABLE'); y -= 6; const yt = y, W = cc.reduce((a, b) => a + b, 0), rows = [['點號', 'X', 'Y', 'Z']].concat(ctrl);
      pm.P([[x0, yt], [x0 + W, yt], [x0 + W, yt - rows.length * 4.2], [x0, yt - rows.length * 4.2]], 'PKG_TABLE', true);
      rows.forEach((r, i) => { if (i) pm.L(x0, yt - i * 4.2, x0 + W, yt - i * 4.2, 'PKG_TABLE'); let xx = x0; cc.forEach((w, j) => { if (j && !i) pm.L(xx, yt, xx, yt - rows.length * 4.2, 'PKG_TABLE'); pm.T(xx + w / 2, yt - (i + 0.5) * 4.2, 2.4, r[j] || '', { align: 'c', valign: 'm' }, 'PKG_TABLE'); xx += w; }); });
      y = yt - rows.length * 4.2 - 5; }
    // IP 資料曲線表（由下往上堆）
    let yb = PKG_U.y0 + 2; chunks.slice().reverse().forEach(c => {
      const h = rh * IPR.length, W = cw0 + cw * c.cols.length, yt = yb + h;
      if (c.first) pm.T(x0, yt + 1.5, 3.2, 'IP資料曲線表' + (IP.length > 1 ? `（${c.name}）` : ''), {}, 'PKG_TABLE');
      pm.P([[x0, yt], [x0 + W, yt], [x0 + W, yb], [x0, yb]], 'PKG_TABLE', true);
      IPR.forEach((t, i) => { if (i) pm.L(x0, yt - i * rh, x0 + W, yt - i * rh, 'PKG_TABLE'); pm.T(x0 + cw0 / 2, yt - (i + 0.5) * rh, 2.1, t, { align: 'c', valign: 'm' }, 'PKG_TABLE'); });
      c.cols.forEach((col, j) => { const xx = x0 + cw0 + j * cw; pm.L(xx, yt, xx, yb, 'PKG_TABLE'); col.forEach((v, i) => pm.T(xx + cw / 2, yt - (i + 0.5) * rh, pkgFit(v, 2.0, cw - 1), v, { align: 'c', valign: 'm' }, 'PKG_TABLE')); });
      yb = yt + (c.first ? 7 : 2);
    });
    // 指北針＋比例尺條
    lyNorth(pm, 392, 266, 1); lyScaleBar(pm, 352, PKG_U.y1 - 22, f.S);
  };
  return { kind: 'plan', title: '全區平面配置圖', X: PX, ents: lyClip(PX.ents, R, 0), F, scale: pkgSc(f.S), unit: '公尺', warn: f.over ? '※ 內容超出圖框，請改用較小比例' : '', extra };
}

/* ---- 平面詳圖：沿中心線分張 ---- */
function lyDetailSheets(P, PX) {
  const S = +P.detS || 500, k = S / 1000, U = PKG_U, w = (U.x1 - U.x0 - 6) * k, h = (U.y1 - U.y0 - 6) * k, out = [];
  lyAllAlign(Math.max(1, S / 250)).forEach(a => {
    const W = []; let b = null, prev = null;
    const fits = q => q.x1 - q.x0 <= w * 0.94 && q.y1 - q.y0 <= h * 0.94;
    a.pts.forEach(p => {
      const e = a.half + 8, Q = [[p[0], p[1]], [p[0] - p[3] * e, p[1] - p[4] * e], [p[0] + p[3] * e, p[1] + p[4] * e]];
      const nb = b ? Object.assign({}, b) : { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity }; Q.forEach(([x, y]) => { nb.x0 = Math.min(nb.x0, x); nb.x1 = Math.max(nb.x1, x); nb.y0 = Math.min(nb.y0, y); nb.y1 = Math.max(nb.y1, y); });
      if (b && !fits(nb)) { W.push(b); b = { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity }; (prev || []).concat(Q).forEach(([x, y]) => { b.x0 = Math.min(b.x0, x); b.x1 = Math.max(b.x1, x); b.y0 = Math.min(b.y0, y); b.y1 = Math.max(b.y1, y); }); }
      else b = nb; prev = Q;
    });
    if (b) W.push(b);
    const rects = W.map(q => { const cx = (q.x0 + q.x1) / 2, cy = (q.y0 + q.y1) / 2; return { x0: cx - w / 2, x1: cx + w / 2, y0: cy - h / 2, y1: cy + h / 2, cx, cy }; });
    rects.forEach((r, i) => {
      const D = makeDXFWriter();
      [i - 1, i + 1].forEach(j => { const q = rects[j]; if (!q) return; D.poly([[q.x0, q.y0], [q.x1, q.y0], [q.x1, q.y1], [q.x0, q.y1]], 'PKG_MATCH', 1, 0, true, 'DASHED');
        const ix0 = Math.max(r.x0, q.x0), ix1 = Math.min(r.x1, q.x1), iy0 = Math.max(r.y0, q.y0), iy1 = Math.min(r.y1, q.y1);
        if (ix1 > ix0 && iy1 > iy0) D.text((ix0 + ix1) / 2, (iy0 + iy1) / 2, 3 * k, `接續第 ${j + 1} 張`, 'PKG_MATCH', 1, { align: 'c', valign: 'm' }); });
      const MX = pkgParse(D.build()), F = pkgFrameAt({ x0: r.cx, x1: r.cx, y0: r.cy, y1: r.cy }, S);
      out.push({ kind: 'detail', title: `平面詳圖(${i + 1}/${rects.length})${A_suffix(a)}`, parts: [{ X: PX, ents: lyClip(PX.ents, r, 2 * k) }, { X: MX, ents: MX.ents }], F, scale: pkgSc(S), unit: '公尺', warn: '',
        extra: (FD, FF) => { const pm = lyPM(FD, FF); lyNorth(pm, 394, 268, 0.8); lyScaleBar(pm, 352, PKG_U.y1 - 9, S); } });
    });
  });
  function A_suffix(a) { return typeof clMulti === 'function' && clMulti() ? '－' + a.name : ''; }
  return out;
}

/* ---- 縱斷面圖（案例版面） ---- */
function lyProfRows(PF, hasRv) {
  const R = [['grade', '溪床坡度'], ['tot', '構造物總高'], ['cutfill', '挖填'], ['bank', '構造物頂高'], ['design', ''], ['ground', '原地形高'], ['found', '構造物基礎高'], ['lt', '左側高'], ['rt', '右側高'], ['name', '點名'], ['dist', '單距'], ['sta', '樁號'], ['curve', '曲線'], ['note', '備註']];
  const dn = PF.designName && PF.designName !== '設計溪床高' ? PF.designName : '計畫溪床高';
  return R.filter(([k]) => (['tot', 'bank', 'found'].includes(k) ? hasRv : ['lt', 'rt', 'name', 'note'].includes(k) ? PF.rows.includes(k) : true)).map(([k, l]) => ({ key: k, label: k === 'design' ? dn : l }));
}
function lyNum(s) { const m = String(s ?? '').match(/-?\d+(\.\d+)?/); return m ? +m[0] : null; }
function lyProfSheets(P) {
  const PF = state.pf, ALL = state.sections, PC = state.profile.calc; if (ALL.length < 2 || !PC.length) return [];
  const Hs = PF.hScale > 0 ? PF.hScale : 500, Vs = PF.vScale > 0 ? PF.vScale : 200, ex = Hs / Vs, kH = Hs / 1000;
  const hasRv = (state.revs || []).length > 0 || (state.structs || []).length > 0, rows = lyProfRows(PF, hasRv);
  const RH = { grade: 9, curve: 11, sta: 14, note: 16 }, rh = r => RH[r.key] || 11.5, tblH = rows.reduce((a, r) => a + rh(r), 0);
  const xL = PKG_U.x0 + 1, xLab = 26, xP0 = xL + xLab + 8, xP1 = PKG_U.x1 - 3, yT0 = PKG_U.y0 + 1, yBase = yT0 + tblH + 6, yTop = PKG_U.y1 - 3;
  const spanMax = (xP1 - xP0) * Hs / 1000, availZ = (yTop - yBase - 16) * Vs / 1000, wL = PF.rows.includes('lt'), wR = PF.rows.includes('rt');
  const a0 = ALL[0].sta, b0 = ALL[ALL.length - 1].sta, RG = [];
  for (let s0 = a0; s0 < b0 - 1e-6;) {
    let s1 = Math.min(b0, s0 + spanMax); if (b0 - s1 < 2) s1 = b0; let zr = pfZRangeIn(s0, s1, wL, wR);
    while (zr && zr.hi - zr.lo > availZ && s1 - s0 > 25) { s1 = s0 + (s1 - s0) * 0.85; zr = pfZRangeIn(s0, s1, wL, wR); }
    RG.push([s0, s1, zr]); s0 = s1;
  }
  const G = state.gmProfile, gAt = s => { if (G && G.list.length > 1) return gmEval(G.list, s, state.gm.interval, G.tinSta); let p = null; for (const q of ALL) { if (q.sta >= s) { if (!p) return q.groundCenter; const t = (s - p.sta) / ((q.sta - p.sta) || 1); return p.groundCenter + t * (q.groundCenter - p.groundCenter); } p = q; } return p ? p.groundCenter : null; };
  const top = s => { const v = lyNum(rvRowBank(s)); return v; }, fnd = s => lyNum(rvRowFound(s));
  return RG.map(([s0, s1, zr], kk) => {
    const D = makeDXFWriter(), F = { x0: 0, y0: 0, w: 420 * kH, h: 297 * kH, S: Hs }, pm = lyPM(D, F), th = 2.6 * kH;
    const lo = zr ? zr.lo : Math.min(...ALL.map(s => s.desCenterZ)), hi = zr ? zr.hi : lo + 10, zStep = [1, 2, 5, 10, 20].find(v => (hi - lo) / v <= 14) || 50, datum = Math.floor(lo / zStep) * zStep;
    const xm = s => xP0 + (s - s0) * 1000 / Hs, ym = z => yBase + (z - datum) * 1000 / Vs, X = s => F.x0 + xm(s) * kH, Y = z => F.y0 + ym(z) * kH;
    const secs = ALL.filter(s => s.sta >= s0 - 1e-6 && s.sta <= s1 + 1e-6);
    // 高程尺、基準線
    const zT = Math.ceil(hi / zStep) * zStep; pm.L(xP0 - 3, yBase, xP0 - 3, ym(zT), 'PROF_AXIS'); pm.L(xP0 - 3, yBase, xm(s1), yBase, 'PROF_AXIS');
    for (let z = datum; z <= zT + 1e-9; z += zStep) { pm.L(xP0 - 4.5, ym(z), xP0 - 3, ym(z), 'PROF_AXIS'); if (z > datum) pm.T(xP0 - 5.5, ym(z), 2.8, String(+z.toFixed(2)), { align: 'r', valign: 'm' }, 'PROF_AXIS'); }
    pm.T(xL, yBase + 1, 3.0, 'DATUM ELEV', {}, 'PROF_AXIS'); pm.L(xL, yBase + 0.3, xP0 - 3, yBase + 0.3, 'PROF_AXIS'); pm.T(xL + 4, yBase - 1.2, 3.0, datum.toFixed(2), { valign: 't' }, 'PROF_AXIS');
    // 樁號垂直線
    secs.forEach(s => { const zt = Math.max(s.groundCenter, s.desCenterZ, top(s) ?? -Infinity); D.line(X(s.sta), Y(datum), 0, X(s.sta), Y(zt), 0, 'PROF_STA', 7); });
    // 設計線、地面線、左右側高、其他設計線、落差
    D.poly(sampleDesignProfile(s0, s1, 300).map(p => [X(p[0]), Y(p[1])]), 'PROF_DESIGN', 5);
    const gp = []; for (let i = 0, n = Math.max(20, Math.ceil((s1 - s0) / 1)); i <= n; i++) { const s = s0 + (s1 - s0) * i / n, z = gAt(s); if (Number.isFinite(z)) gp.push([X(s), Y(z)]); } D.poly(gp, 'PROF_GROUND', 7);
    [['l', wL, '左側高'], ['r', wR, '右側高']].forEach(([sd, on, nm]) => { if (!on) return; const pts = secs.map(s => [s.sta, secSideZ(s, sd)]).filter(p => p[1] != null); D.poly(pts.map(p => [X(p[0]), Y(p[1])]), sd === 'l' ? 'PROF_LEFT' : 'PROF_RIGHT', 7, 0, false, 'DASHED2');
      if (pts.length) D.text(X(pts[pts.length - 1][0]) - th * 0.3, Y(pts[pts.length - 1][1]) + th * 0.4, th * 0.9, nm, 'PROF_TEXT', 7, { align: 'r' }); });
    PF.lines.forEach(ln => { if (!ln.vis || ln.pts.length < 2) return; const a = Math.max(s0, ln.pts[0].sta), b = Math.min(s1, ln.pts[ln.pts.length - 1].sta); if (!(b > a)) return; const pts = []; for (let q = 0; q <= 60; q++) { const s = a + (b - a) * q / 60; pts.push([X(s), Y(lineZ(ln, s))]); } D.poly(pts, 'PROF_OTHER', 7); D.text(X(b) + th * 0.3, Y(lineZ(ln, b)), th * 0.9, `${ln.code} ${ln.name}`, 'PROF_TEXT', 7); });
    state.profile.drops.forEach(d => { if (d.sta < s0 || d.sta > s1) return; D.line(X(d.sta), Y(getDesignZBefore(d.sta)), 0, X(d.sta), Y(getDesignZ(d.sta)), 0, 'PROF_DESIGN', 5); });
    stDxfProfile(D, X, Y, s0, s1, th); rvDxfProfile(D, X, Y, s0, s1, th);
    // 護岸起訖點引線
    (state.revs || []).forEach((rv, ri) => { const Lm = rvLim(rv); [[Lm.a, '起點', 1], [Lm.b, '迄點', -1]].forEach(([s, t, dir]) => { if (s < s0 - 1e-6 || s > s1 + 1e-6) return;
      const sec = ALL.reduce((b, q) => (Math.abs(q.sta - s) < Math.abs(b.sta - s) ? q : b), ALL[0]), R = sec.params && sec.params.rv && sec.params.rv[rv.side]; if (!R) return;
      const x = xm(s), y = ym(sec.desCenterZ + R.H), x2 = x + dir * 9, y2 = y + 12 + (ri % 4) * 9, t1 = `${rvName(rv)} ${t}`, t2 = `(${formatStation(Lm.a)}～${formatStation(Lm.b)})`, w = Math.max(pkgTW(t1, 2.6), pkgTW(t2, 2.4)) + 1;
      pm.P([[x, y], [x2, y2], [x2 + dir * w, y2]], 'PROF_LEADER'); pm.T(dir > 0 ? x2 + 0.5 : x2 - w + 0.5, y2 + 0.8, 2.6, t1, {}, 'PROF_LEADER'); pm.T(dir > 0 ? x2 + 0.5 : x2 - w + 0.5, y2 - 0.8, 2.4, t2, { valign: 't' }, 'PROF_LEADER'); }); });
    // 線別引線（計畫岸頂高／原地形高／計畫溪床高／計畫基礎高）
    { const sL = s0 + (s1 - s0) * 0.42, sec = ALL.reduce((b, q) => (Math.abs(q.sta - sL) < Math.abs(b.sta - sL) ? q : b), ALL[0]), s = Math.max(s0, Math.min(s1, sec.sta));
      const on = k => (typeof rvPfOn === 'function' ? rvPfOn(k) : true), tp = top(sec), fd = fnd(sec), dn = rows.find(r => r.key === 'design').label;
      const pts = [[gAt(s), '原地形高'], [getDesignZ(s), dn]]; if (tp != null && (on('TL') || on('TR'))) pts.push([tp, '計畫岸頂高']); if (fd != null && (on('BL') || on('BR'))) pts.push([fd, '計畫基礎高']);
      const P2 = pts.filter(p => Number.isFinite(p[0])).sort((a, b) => b[0] - a[0]);
      if (P2.length) { const x = xm(s), yHi = Math.max(...P2.map(p => ym(p[0]))), y0 = Math.min(yTop - 1, Math.max(yHi + 8 + P2.length * 5, ym(hi) + 2)), yLo = Math.min(...P2.map(p => ym(p[0])));
        pm.L(x, yLo, x, y0, 'PROF_LEADER'); P2.forEach((p, i) => { const yy = y0 - i * 5; pm.C(x, ym(p[0]), 0.5, 'PROF_LEADER'); pm.L(x, yy, x + 3, yy, 'PROF_LEADER'); pm.T(x + 3.6, yy, 3.0, p[1], { valign: 'm' }, 'PROF_LEADER'); }); } }
    // ---- 下部資料表 ----
    const xo = s => xm(s.sta) + ((s.side === 'pre' || s.side === 'up') ? -1.2 : (s.side === 'post' || s.side === 'dn') ? 1.2 : 0), show = [];
    secs.forEach((s, i) => { const last = show.length ? show[show.length - 1] : -1; if (last < 0 || xo(s) - xo(secs[last]) >= 3.4) show.push(i); else if (s.ptName && !secs[last].ptName) show[show.length - 1] = i; });
    const cell = (key, s, i) => { const dh = s.groundCenter - s.desCenterZ, t = top(s), f = fnd(s), gi = ALL.indexOf(s);
      switch (key) {
        case 'tot': return t != null && f != null ? (t - f).toFixed(2) : '';
        case 'cutfill': { const v = -dh; return (v >= 0 ? '+' : '') + v.toFixed(2); }
        case 'bank': return t != null ? rvRowBank(s) : '';
        case 'found': return f != null ? rvRowFound(s) : '';
        case 'design': return s.desCenterZ.toFixed(2);
        case 'ground': return s.groundCenter.toFixed(2);
        case 'lt': case 'rt': { const z = secSideZ(s, key === 'lt' ? 'l' : 'r'); return z == null ? '' : z.toFixed(2); }
        case 'name': return s.ptName || '';
        case 'dist': return gi > 0 && s.sta - ALL[gi - 1].sta > 1e-6 ? (s.sta - ALL[gi - 1].sta).toFixed(2) : '0.00';
        case 'sta': return s.shortStaLabel;
      } return ''; };
    let yy = yT0 + tblH; const xD0 = xL + xLab + 1.5;
    rows.forEach(r => {
      const h = rh(r), yt = yy, yb = yy - h, ymid = (yt + yb) / 2;
      pm.P([[xL, yt - 0.6], [xL + xLab, yt - 0.6], [xL + xLab, yb + 0.6], [xL, yb + 0.6]], 'PROF_TABLE', true); pm.T(xL + xLab / 2, ymid, pkgFit(r.label, 3.2, xLab - 2), r.label, { align: 'c', valign: 'm' }, 'PROF_TABLE');
      pm.P([[xD0, yt - 0.6], [xP1, yt - 0.6], [xP1, yb + 0.6], [xD0, yb + 0.6]], 'PROF_TABLE', true);
      if (r.key === 'grade') {
        PC.forEach((v, i) => { if (i >= PC.length - 1) return; const xa = xm(Math.max(s0, v.sta)), xb = xm(Math.min(s1, PC[i + 1].sta)); if (xb <= xa) return; pm.L(xa, ymid, xb, ymid, 'PROF_TABLE'); const tS = 'S=' + fmtGrade(v.gOut); if (xb - xa < pkgTW(tS, 2.4) * 1.2 + 8) return;
          pm.T((xa + xb) / 2, ymid + 0.8, 2.4, 'S=' + fmtGrade(v.gOut), { align: 'c' }, 'PROF_TABLE'); pm.T((xa + xb) / 2, ymid - 0.8, 2.4, `L=${((Math.min(s1, PC[i + 1].sta) - Math.max(s0, v.sta))).toFixed(2)}m`, { align: 'c', valign: 't' }, 'PROF_TABLE'); });
        PC.forEach((v, i) => { if (i === PC.length - 1 || v.sta < s0 - 1e-6 || v.sta > s1 + 1e-6) return; const x = xm(v.sta); pm.C(x, ymid, 3.6, 'PROF_TABLE'); pm.L(x - 3.6, ymid, x + 3.6, ymid, 'PROF_TABLE');
          pm.T(x, ymid + 0.6, 1.8, (v.z - dropShiftAt(v.sta, false)).toFixed(2), { align: 'c' }, 'PROF_TABLE'); pm.T(x, ymid - 0.6, 1.8, '+' + formatStation(v.sta).split('+')[1], { align: 'c', valign: 't' }, 'PROF_TABLE'); });
      } else if (r.key === 'curve') {
        const IPS = state.alignment.ipList, yb2 = ymid + 1.5, off = 1.6, pts = [[xD0, yb2]]; let lastR = -1e9;
        IPS.forEach((ip, i) => { if (i === 0 || i === IPS.length - 1 || ip.ecSta < s0 || ip.bcSta > s1) return; const yo = ip.ccw ? yb2 + off : yb2 - off, xa = xm(Math.max(s0, ip.bcSta)), xb = xm(Math.min(s1, ip.ecSta)); pts.push([xa, yb2], [xa, yo], [xb, yo], [xb, yb2]);
          if (ip.mcSta >= s0 && ip.mcSta <= s1) { const t = [`${ip.label}  ${ip.deflDMS}${ip.ccw ? 'L' : 'R'}`, `R=${(+ip.r).toFixed(0)}  CL=${(+ip.cl).toFixed(2)}`, `TL=${(+ip.tl).toFixed(2)}  SL=${(+ip.sl).toFixed(2)}`], tw = Math.max(...t.map(q => pkgTW(q, 1.9))), x0 = Math.min(xP1 - tw - 1, xm(ip.mcSta) - tw / 2);
            if (x0 > lastR + 1) { t.forEach((q, j) => pm.T(x0, yt - 1.4 - j * 2.5, 1.9, q, { valign: 't' }, 'PROF_TABLE')); lastR = x0 + tw; } } });
        pts.push([xP1, yb2]); pm.P(pts, 'PROF_TABLE');
      } else if (r.key === 'note') {
        PF.notes.forEach(n => { if (n.sta >= s0 && n.sta <= s1) pm.T(xm(n.sta) + 1, yb + 1.2, 2.2, n.text, { rot: 90 }, 'PROF_TABLE'); });
      } else show.forEach(i => { const s = secs[i], v = cell(r.key, s, i); if (v) pm.T(xo(s) + 1.0, yb + 1.2, pkgFit(v, 2.2, h - 2.4), v, { rot: 90 }, 'PROF_TABLE'); });
      yy = yb;
    });
    // 接續註記
    if (kk > 0) pm.T(xP0, yTop - 1, 2.4, `接第 ${kk} 張 ${formatStation(s0)}`, { valign: 't' }, 'PROF_TEXT');
    if (kk < RG.length - 1) pm.T(xm(s1), yTop - 1, 2.4, `接第 ${kk + 2} 張 ${formatStation(s1)}`, { align: 'r', valign: 't' }, 'PROF_TEXT');
    const over = zr && zr.hi - zr.lo > availZ + 1e-6;
    const X0 = pkgParse(D.build());
    return { kind: 'prof', title: '', X: X0, ents: X0.ents, F, scale: { x: pkgSc(Hs), y: pkgSc(Vs) }, warn: over ? '※ 本張高程範圍超出圖面，請調整縱向比例 Y' : '' };
  });
}

/* ---- 橫斷面詳圖（案例版面） ---- */
function lyDim(D, pm, a, b, y, txt, k, ly) {   // 水平尺寸（a,b,y：mm）
  pm.L(a, y, b, y, ly); [a, b].forEach(x => { pm.L(x, y - 1.2, x, y + 1.2, ly); pm.L(x - 0.7, y - 0.7, x + 0.7, y + 0.7, ly); }); pm.T((a + b) / 2, y + 0.7, 2.2, txt, { align: 'c' }, ly);
}
function lyDimV(D, pm, x, a, b, txt, side, ly) {   // 垂直尺寸（x：mm；a,b：mm；side：字在左 -1／右 1）
  pm.L(x, a, x, b, ly); [a, b].forEach(y => { pm.L(x - 1.2, y, x + 1.2, y, ly); pm.L(x - 0.7, y - 0.7, x + 0.7, y + 0.7, ly); }); pm.T(x + side * 0.9, (a + b) / 2, 2.2, txt, { align: 'c', valign: side < 0 ? 'b' : 't', rot: 90 }, ly);
}
function lySecPads(grid) { return grid ? { l: 11, r: 11, t: 19, b: 23 } : { l: 9, r: 9, t: 21, b: 17 }; }
function lySecSheets(P) {
  const secs = state.sections; if (!secs.length) return [];
  const S0 = +P.secS || parseFloat((document.getElementById('crossScale') || {}).value) || 200; lyDrawSec.P = P; const grid = P.secStyle === 'grid' || (P.secStyle === 'auto' && state.clCur > 0), pad = lySecPads(grid);
  const EW = new Map(); try { dzEwRows().forEach(r => EW.set(r.sta.toFixed(3), r)); } catch (e) { }
  const U = { x0: PKG_U.x0 + 2, y0: PKG_U.y0 + 2, x1: PKG_U.x1 - 2, y1: PKG_U.y1 - (grid ? 16 : 2) }, UW = U.x1 - U.x0, UH = U.y1 - U.y0, gap = 6;
  const dim = (sec, S) => { const r = crossRange(sec, true), q = 1000 / S, xr = Math.max(0, 40 - (Math.max(0, r.maxOff) * q + pad.r)); return { r, w: (r.maxOff - r.minOff) * q + pad.l + pad.r + xr, h: (r.maxZ - r.minZ) * q + pad.t + pad.b }; };   // xr：樁號右側挖填方文字預留
  const sheets = []; let sh = null, cx = 0, cy = 0, colW = 0;
  const newSheet = S => { sh = { S, items: [] }; sheets.push(sh); cx = U.x0; cy = U.y0; colW = 0; };
  secs.forEach(sec => {
    let d = dim(sec, S0);
    if (d.w > UW || d.h > UH) { const S2 = PKG_SCALES.find(s => s > S0 && dim(sec, s).w <= UW && dim(sec, s).h <= UH) || PKG_SCALES[PKG_SCALES.length - 1]; d = dim(sec, S2); sheets.push({ S: S2, items: [{ sec, d, x: U.x0 + (UW - d.w) / 2, y: U.y0 + (UH - d.h) / 2 }], own: true }); sh = null; return; }
    if (!sh) newSheet(S0);
    if (cy + d.h > U.y1 + 1e-6) { if (cx + colW + gap + d.w <= U.x1 + 1e-6 && colW > 0) { cx += colW + gap; cy = U.y0; colW = 0; } else newSheet(S0); }
    sh.items.push({ sec, d, x: cx, y: cy, col: cx }); cy += d.h; colW = Math.max(colW, d.w);
  });
  return sheets.map(s => {
    // 每欄置中，整體水平置中
    if (!s.own) { const cols = [...new Set(s.items.map(i => i.col))], cw = cols.map(c => Math.max(...s.items.filter(i => i.col === c).map(i => i.d.w))), tot = cw.reduce((a, b) => a + b, 0) + gap * (cols.length - 1); let x = U.x0 + (UW - tot) / 2;
      cols.forEach((c, j) => { s.items.filter(i => i.col === c).forEach(i => { i.x = x + (cw[j] - i.d.w) / 2; }); x += cw[j] + gap; }); }
    const S = s.S, k = S / 1000, D = makeDXFWriter(), F = { x0: 0, y0: 0, w: 420 * k, h: 297 * k, S }, pm = lyPM(D, F);
    s.items.forEach(it => lyDrawSec(D, pm, it.sec, it.d, it.x, it.y, S, grid, EW, pad));
    const X0 = pkgParse(D.build());
    return { kind: 'sec', title: '', X: X0, ents: X0.ents, F, scale: pkgSc(S), warn: s.own && S !== S0 ? `※ 斷面在 1/${S0} 放不進 A3，本張改用 1/${S}` : '',
      extra: grid ? (FD, FF) => { const q = lyPM(FD, FF), x = PKG_U.x0 + 4, y = PKG_U.y1 - 5; q.L(x, y, x + 22, y, 'PKG_LEGEND', 'DASHED'); q.T(x + 25, y, 4.2, '原地面線', { valign: 'm' }, 'PKG_LEGEND'); q.L(x, y - 7, x + 22, y - 7, 'PKG_LEGEND'); q.T(x + 25, y - 7, 4.2, '整地線', { valign: 'm' }, 'PKG_LEGEND'); } : null };
  });
}
function lyDrawSec(D, pm, sec, d, bx, by, S, grid, EW, pad) {
  const k = S / 1000, q = 1000 / S, r = d.r, ox = bx + pad.l, oy = by + pad.b, xm = o => ox + (o - r.minOff) * q, ym = z => oy + (z - r.minZ) * q;
  const sx = o => pm.X(xm(o)), sy = z => pm.Y(ym(z)), TH = 2.75 * k, SS = secCropSamples(sec, r.minOff, r.maxOff);
  // 格線版型：高程／距離格線與刻度
  if (grid) {
    const zs = (r.maxZ - r.minZ) > 40 ? 5 : 2, os = (r.maxOff - r.minOff) > 120 ? 20 : 10, xa = xm(r.minOff), xb = xm(r.maxOff), ya = ym(r.minZ), yb = ym(r.maxZ);
    pm.P([[xa, ya], [xb, ya], [xb, yb], [xa, yb]], 'SEC_GRID', true);
    for (let z = Math.ceil(r.minZ / zs) * zs; z <= r.maxZ + 1e-9; z += zs) { pm.L(xa, ym(z), xb, ym(z), 'SEC_GRID'); pm.T(xa - 1, ym(z), 2.0, String(z), { align: 'r', valign: 'm' }, 'SEC_GRID'); pm.T(xb + 1, ym(z), 2.0, String(z), { valign: 'm' }, 'SEC_GRID'); }
    for (let o = Math.ceil(r.minOff / os) * os; o <= r.maxOff + 1e-9; o += os) { pm.L(xm(o), ya, xm(o), yb, 'SEC_GRID'); pm.T(xm(o), ya - 1, 2.0, String(o), { align: 'c', valign: 't' }, 'SEC_GRID'); }
  }
  // 地面線、設計線、結構物、護岸
  D.poly(SS.map(s => [sx(s.offset), sy(s.groundZ)]), 'SEC_GROUND', 7, 0, false, grid ? 'DASHED' : undefined);
  D.poly(SS.map(s => [sx(s.offset), sy(s.desZ)]), 'SEC_DESIGN', 5);
  stDxfCross(D, sec, sx, sy, TH); rvDxfCross(D, sec, sx, sy, TH);
  // 中心線符號
  const c0 = xm(0), zc = sec.desCenterZ, gL = rvGeomSec(sec, 'L'), gR = rvGeomSec(sec, 'R'), zTop = Math.max(gL ? gL.B.zTop : -Infinity, gR ? gR.B.zTop : -Infinity), zT = Number.isFinite(zTop) ? zTop : Math.max(sec.groundCenter, zc);
  { const yc = ym(Math.max(zT, zc)) + 15.5, R = 1.5; pm.P([[c0 - R * 0.2, yc + R], [c0 - R, yc + R * 0.3], [c0 - R, yc - R * 0.3], [c0 - R * 0.2, yc - R]], 'SEC_CL'); pm.L(c0, yc + R * 1.2, c0, yc - R * 1.6, 'SEC_CL'); pm.L(c0, yc - R * 1.6, c0 + R * 1.1, yc - R * 1.6, 'SEC_CL');
    pm.L(c0, yc - R * 2.2, c0, ym(Math.min(zc, sec.groundCenter)), 'SEC_CL', 'DASHED2'); }
  // 尺寸（cm）
  const cm = v => String(Math.round(v * 100)), ly = 'SEC_DIM';
  // 溪寬尺寸只在有護岸時標（依案例）：上列總寬、下列以中心線分段；兩端拉延伸線到護岸頂
  const ext = (x, ya, yb) => { if (yb - ya > 0.8) pm.L(x, ya + 0.8, x, yb + 1.2, ly); };
  if (gL && gR) { const y1 = ym(zT) + 8.5, y2 = ym(zT) + 4.2, xa = xm(-gL.G.a0), xb = xm(gR.G.a0); lyDim(D, pm, xa, xb, y1, cm(gL.G.a0 + gR.G.a0), k, ly); lyDim(D, pm, xa, c0, y2, cm(gL.G.a0), k, ly); lyDim(D, pm, c0, xb, y2, cm(gR.G.a0), k, ly);
    ext(xa, ym(gL.B.zTop), y1); ext(xb, ym(gR.B.zTop), y1); }
  else if (gL || gR) { const g = gL || gR, sg = gL ? -1 : 1, y2 = ym(zT) + 4.2, xa = xm(sg * g.G.a0); lyDim(D, pm, Math.min(xa, c0), Math.max(xa, c0), y2, cm(g.G.a0), k, ly); ext(xa, ym(g.B.zTop), y2); }
  [[gL, -1], [gR, 1]].forEach(([g, sg]) => {
    if (!g) return; const G = g.G, zf = G.zf, aB = Math.max(G.a0b, ...G.polys.flatMap(p => p.pts.map(v => v[0])));
    lyDimV(D, pm, xm(sg * aB) + sg * 3.5, ym(zf), ym(g.B.zTop), cm(g.B.zTop - zf), sg, ly);
    if (zc - zf > 0.05) lyDimV(D, pm, xm(sg * g.R.e) - sg * 2.2, ym(zf), ym(zc), cm(zc - zf), -sg, ly);
    const bot = G.polys.flatMap(p => p.pts).filter(v => v[1] <= zf + 0.05).map(v => v[0]); if (bot.length > 1) { const a = Math.min(...bot), b = Math.max(...bot); if (b - a > 0.05) lyDim(D, pm, xm(sg * a), xm(sg * b), ym(zf) - 3.2, cm(b - a), k, ly); }
    // 護岸型式引線（向河道內側）
    const lab = (g.R.T && g.R.T.label) || '護岸', xa = xm(sg * G.a0), ya = ym(g.B.zTop), x2 = xa - sg * 4, y2 = ya + 7, w = pkgTW(lab, 2.4) + 1;
    pm.P([[xa, ya], [x2, y2], [x2 - sg * w, y2]], 'SEC_LEADER'); pm.T(sg > 0 ? x2 - w + 0.5 : x2 + 0.5, y2 + 0.6, 2.4, lab, {}, 'SEC_LEADER');
  });
  // 樁號（雙底線）、挖填方、護岸起訖說明
  // 樁號只寫樁號＋(前)/(後)＋護岸起/迄（依案例）；點名（VIP、MC…）在出圖包設定可選加註
  const PP = lyDrawSec.P || {}, se = []; (state.revs || []).forEach(rv => { const L = rvLim(rv); if (Math.abs(sec.sta - L.a) < 0.06 && !se.includes('起')) se.push('起'); if (Math.abs(sec.sta - L.b) < 0.06 && !se.includes('迄')) se.push('迄'); });
  const lab = formatStation(sec.sta) + (sec.side === 'pre' || sec.side === 'up' ? '(前)' : sec.side === 'post' || sec.side === 'dn' ? '(後)' : '') + (se.length ? '－' + se.join('／') : '') + (PP.secPt && sec.ptName ? ` ${sec.ptName}` : ''), TH6 = 4, lw = pkgTW(lab, TH6) * 1.15, ly0 = by + (grid ? 9 : 6.5);
  pm.T(c0, ly0, TH6, lab, { align: 'c' }, 'SEC_TEXT'); pm.L(c0 - lw / 2 - 2, ly0 - 1.0, c0 + lw / 2 + 2, ly0 - 1.0, 'SEC_TEXT'); pm.L(c0 - lw / 2 - 2, ly0 - 1.7, c0 + lw / 2 + 2, ly0 - 1.7, 'SEC_TEXT');
  // 挖方／填方：樁號右側兩行、3.5 mm，每個斷面都寫（沒有土方資料＝0）
  const E = EW.get(sec.sta.toFixed(3)), vx = c0 + lw / 2 + 4, v2 = x => (Number.isFinite(x) ? x : 0).toFixed(2);
  if (E && E.ex) pm.T(vx, ly0 + 0.8, 2.5, `挖填：${E.ex}`, {}, 'SEC_TEXT');
  else { pm.T(vx, ly0 + 2.2, 2.5, `挖方：${v2(E ? E.vc + E.vx : 0)}m3`, {}, 'SEC_TEXT'); pm.T(vx, ly0 - 1.2, 2.5, `填方：${v2(E ? E.vf + E.vk : 0)}m3`, {}, 'SEC_TEXT'); }
  const notes = []; (state.revs || []).forEach(rv => { const L = rvLim(rv); [[L.a, '起點'], [L.b, '迄點']].forEach(([s, t]) => { if (Math.abs(sec.sta - s) < 0.06) notes.push(`${rvName(rv)} ${t}（${formatStation(L.a)}～${formatStation(L.b)}）`); }); });
  notes.forEach((t, i) => pm.T(c0 - lw / 2 - 6, ly0 + 3.0 - i * 3.3, 2.4, t, { align: 'r', valign: 'm' }, 'SEC_TEXT'));
}
