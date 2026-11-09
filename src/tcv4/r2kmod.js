/* ============================================================================
   v6.6 DXF R2000（AC1015）＋A3 配置（Layout）寫出器 (r2kmod)
   ・輸入：pkgParse 切好的 R12 實體塊（LINE／POLYLINE＋VERTEX／TEXT／CIRCLE／ARC／INSERT）
   ・模型空間：圖面內容（實際座標）；圖紙空間：每張圖一個配置，A3 圖框與標題欄以 mm 1:1 繪製，
     另加一個鎖定比例的視埠（VIEWPORT）以該張比例顯示模型空間
   ・POLYLINE 轉 LWPOLYLINE；文字沿用 \U+XXXX 跳脫；線型 DASHED 以紙上 mm 定義（$PSLTSCALE=1）
   ============================================================================ */
const R2K_A3 = { paper: 'ISO_full_bleed_A3_(420.00_x_297.00_MM)', dev: 'DWG To PDF.pc3' };
function r2kEsc(s) { return String(s).replace(/[^\x20-\x7e]/g, ch => '\\U+' + ch.charCodeAt(0).toString(16).toUpperCase().padStart(4, '0')); }
const r2kF = v => { const n = +v; return Number.isFinite(n) ? String(Math.round(n * 1e6) / 1e6) : '0'; };
/* R12 實體塊（行陣列）→ 群組碼配對 */
function r2kPairs(l) { const P = []; for (let i = 0; i + 1 < l.length; i += 2) P.push([String(l[i]).trim(), l[i + 1]]); return P; }
/* 一個 R12 實體 → R2000 文字（陣列）；H＝取新 handle；own＝擁有者 block record；ps＝圖紙空間 */
function r2kEnt(l, H, own, ps, out) {
  const P = r2kPairs(l); if (!P.length) return;
  const t = P[0][1], k = P.findIndex((p, i) => i > 0 && p[0] === '0'), hd = k < 0 ? P.slice(1) : P.slice(1, k);
  const g = c => { const p = hd.find(x => x[0] === c); return p ? p[1] : undefined; };
  const head = T => { const o = ['0', T, '5', H(), '330', own, '100', 'AcDbEntity']; if (ps) o.push('67', '1'); o.push('8', r2kEsc(g('8') || '0')); if (g('6')) { o.push('6', g('6')); if (r2kEnt.lt) r2kEnt.lt.add(g('6')); } if (g('62') !== undefined) o.push('62', g('62')); return o; };
  const xyz = (a, b, c) => [a, r2kF(g(a) || 0), b, r2kF(g(b) || 0), c, r2kF(g(c) || 0)];
  let o;
  if (t === 'LINE') o = head('LINE').concat(['100', 'AcDbLine'], xyz('10', '20', '30'), xyz('11', '21', '31'));
  else if (t === 'POLYLINE') {
    const V = []; let cur = null;
    P.slice(k < 0 ? P.length : k).forEach(p => { if (p[0] === '0') { cur = p[1] === 'VERTEX' ? {} : null; if (cur) V.push(cur); } else if (cur && (p[0] === '10' || p[0] === '20')) cur[p[0]] = p[1]; });
    const pts = V.filter(v => v['10'] !== undefined && v['20'] !== undefined); if (pts.length < 2) return;
    const el = +(g('30') || 0);
    o = head('LWPOLYLINE').concat(['100', 'AcDbPolyline', '90', String(pts.length), '70', String((+g('70') || 0) & 1)]);
    if (el) o.push('38', r2kF(el));
    pts.forEach(v => o.push('10', r2kF(v['10']), '20', r2kF(v['20'])));
  }
  else if (t === 'TEXT') {
    o = head('TEXT').concat(['100', 'AcDbText'], xyz('10', '20', '30'), ['40', r2kF(g('40') || 1), '1', g('1') || ' ']);
    if (g('50')) o.push('50', r2kF(g('50')));
    o.push('7', g('7') || 'Standard');
    const h72 = +(g('72') || 0), v73 = +(g('73') || 0);
    if (h72) o.push('72', String(h72));
    if (h72 || v73) o.push(...xyz('11', '21', '31'));
    o.push('100', 'AcDbText'); if (v73) o.push('73', String(v73));
  }
  else if (t === 'CIRCLE') o = head('CIRCLE').concat(['100', 'AcDbCircle'], xyz('10', '20', '30'), ['40', r2kF(g('40'))]);
  else if (t === 'ARC') o = head('ARC').concat(['100', 'AcDbCircle'], xyz('10', '20', '30'), ['40', r2kF(g('40')), '100', 'AcDbArc', '50', r2kF(g('50')), '51', r2kF(g('51'))]);
  else if (t === 'INSERT') { o = head('INSERT').concat(['100', 'AcDbBlockReference', '2', r2kEsc(g('2'))], xyz('10', '20', '30')); ['41', '42', '43'].forEach(c => { if (g(c)) o.push(c, r2kF(g(c))); }); if (g('50')) o.push('50', r2kF(g('50'))); }
  else return;
  out.push(o.join('\n'));
}
/* R12 圖層塊文字 → {name, c, f}；R12 圖塊 → {name, ents:[行陣列]} */
function r2kLayer(txt) { const P = r2kPairs(String(txt).split('\n')), g = c => { const p = P.find(x => x[0] === c); return p ? p[1] : undefined; }; return { name: g('2') || '0', c: +(g('62') || 7), f: +(g('70') || 0) }; }
function r2kBlockEnts(lines) {   // BLOCK…ENDBLK 行陣列 → 內部實體行陣列
  const out = []; let cur = null, inPoly = false;
  for (let i = 0; i + 1 < lines.length; i += 2) {
    const c = String(lines[i]).trim(), v = lines[i + 1];
    if (c === '0') {
      if (inPoly && (v === 'VERTEX' || v === 'SEQEND')) { cur.push(lines[i], v); if (v === 'SEQEND') { out.push(cur); cur = null; inPoly = false; } continue; }
      if (cur) out.push(cur); cur = null; inPoly = false;
      if (v === 'BLOCK' || v === 'ENDBLK') continue;
      cur = [lines[i], v]; inPoly = v === 'POLYLINE'; continue;
    }
    if (cur) cur.push(lines[i], v);
  }
  if (cur) out.push(cur); return out;
}
/* 產生 R2000 文件
   o = { layers:Map(name→{c,f,np}), blocks:[{name, ents:[行陣列]}], model:[行陣列], sheets:[{name, paper:[行陣列], vp:{x0,y0,x1,y1 (mm), cx,cy (模型), k (模型單位/mm)}}], units, ext:{x0,y0,x1,y1} } */
function r2kDoc(o) {
  let hn = 0x100; const H = () => (hn++).toString(16).toUpperCase(); const LT = new Set(); r2kEnt.lt = LT;
  const J = a => a.join('\n'), f = r2kF;
  const ext = o.ext || { x0: 0, y0: 0, x1: 100, y1: 100 };
  // 圖紙空間 block record／配置
  const SH = (o.sheets || []).map((s, i) => ({ s, br: H(), blk: H(), end: H(), lay: H(), v1: H(), v2: H(), nm: i === 0 ? '*Paper_Space' : `*Paper_Space${i - 1}` }));
  const UB = (o.blocks || []).map(b => ({ b, br: H(), blk: H(), end: H() }));
  // ---- 實體 ----
  // 影像（位置圖底圖）：IMAGE＋IMAGEDEF＋IMAGEDEF_REACTOR，放在模型空間最前面（在向量圖元底下）
  const IM = (o.images || []).map(im => ({ im, h: H(), def: H(), rx: H() })), imDict = IM.length ? H() : null, imVars = IM.length ? H() : null;
  const ms = IM.map(({ im, h, def, rx }) => J(['0', 'IMAGE', '5', h, '330', '17', '100', 'AcDbEntity', '8', r2kEsc(im.ly || 'IMAGE'), '100', 'AcDbRasterImage', '90', '0',
    '10', f(im.x), '20', f(im.y), '30', '0', '11', f(im.ux), '21', f(im.uy), '31', '0', '12', f(im.vx), '22', f(im.vy), '32', '0', '13', String(im.px), '23', String(im.py),
    '340', def, '70', '7', '280', '0', '281', '50', '282', '50', '283', '0', '360', rx, '71', '1', '91', '2', '14', '-0.5', '24', '-0.5', '14', f(im.px - 0.5), '24', f(im.py - 0.5)]));
  (o.model || []).forEach(l => r2kEnt(l, H, '17', false, ms));
  const vpEnt = (S, own) => {
    const v = S.s.vp, w = v.x1 - v.x0, h = v.y1 - v.y0;
    const ov = ['0', 'VIEWPORT', '5', S.v1, '330', own, '100', 'AcDbEntity', '67', '1', '8', 'PKG_VPORT', '100', 'AcDbViewport', '10', '210', '20', '148.5', '30', '0', '40', '462', '41', '326.7', '68', '1', '69', '1',
      '12', '210', '22', '148.5', '13', '0', '23', '0', '14', '10', '24', '10', '15', '10', '25', '10', '16', '0', '26', '0', '36', '1', '17', '0', '27', '0', '37', '0', '42', '50', '43', '0', '44', '0', '45', '326.7',
      '50', '0', '51', '0', '72', '100', '90', '557088', '1', '', '281', '0', '71', '0', '74', '0', '110', '0', '120', '0', '130', '0', '111', '1', '121', '0', '131', '0', '112', '0', '122', '1', '132', '0', '79', '0', '146', '0'];
    const cv = ['0', 'VIEWPORT', '5', S.v2, '330', own, '100', 'AcDbEntity', '67', '1', '8', 'PKG_VPORT', '100', 'AcDbViewport', '10', f((v.x0 + v.x1) / 2), '20', f((v.y0 + v.y1) / 2), '30', '0', '40', f(w), '41', f(h), '68', '2', '69', '2',
      '12', f(v.cx), '22', f(v.cy), '13', '0', '23', '0', '14', '10', '24', '10', '15', '10', '25', '10', '16', '0', '26', '0', '36', '1', '17', '0', '27', '0', '37', '0', '42', '50', '43', '0', '44', '0', '45', f(h * v.k),
      '50', '0', '51', '0', '72', '1000', '90', '16416', '1', '', '281', '0', '71', '1', '74', '0', '110', '0', '120', '0', '130', '0', '111', '1', '121', '0', '131', '0', '112', '0', '122', '1', '132', '0', '79', '0', '146', '0'];
    return [J(ov), J(cv)];
  };
  const psEnts = SH.map(S => { const a = vpEnt(S, S.br); (S.s.paper || []).forEach(l => r2kEnt(l, H, S.br, true, a)); return a; });
  const ubEnts = UB.map(U => { const a = []; U.b.ents.forEach(l => r2kEnt(l, H, U.br, false, a)); return a; }); r2kEnt.lt = null;
  const ltPat = n => /^(BYBLOCK|BYLAYER|CONTINUOUS)$/i.test(n) ? null : /center/i.test(n) ? [8, -1.5, 1.5, -1.5] : /hidden/i.test(n) ? [2, -1] : /phantom/i.test(n) ? [8, -1.5, 1.5, -1.5, 1.5, -1.5] : /dot/i.test(n) ? [0.01, -1.5] : /dash.*2|2$/i.test(n) ? [1.5, -1] : [3, -2];
  const ltExtra = [...new Set([...LT].map(n => n.toUpperCase()))].filter(n => n !== 'DASHED' && ltPat(n));
  // ---- 圖層、線型、字型 ----
  const lays = new Map([['0', { c: 7, f: 0 }]]); (o.layers || new Map()).forEach((v, k) => { if (!lays.has(k)) lays.set(k, v); });
  if (SH.length) { lays.set('PKG_VPORT', { c: 8, f: 0, np: true }); }
  IM.forEach(({ im }) => { if (!lays.has(im.ly || 'IMAGE')) lays.set(im.ly || 'IMAGE', { c: 7, f: 0 }); });
  const layRecs = [...lays.entries()].map(([n, v]) => J(['0', 'LAYER', '5', n === '0' ? '27' : H(), '330', '1', '100', 'AcDbSymbolTableRecord', '100', 'AcDbLayerTableRecord', '2', r2kEsc(n), '70', String(v.f || 0), '62', String(v.c || 7), '6', 'Continuous'].concat(v.np ? ['290', '0'] : [], ['370', String(v.lw ?? -3), '390', '13'])));
  const ltRec = (h, n, d, a) => J(['0', 'LTYPE', '5', h, '330', '2', '100', 'AcDbSymbolTableRecord', '100', 'AcDbLinetypeTableRecord', '2', n, '70', '0', '3', d, '72', '65', '73', String(a.length), '40', f(a.reduce((s, x) => s + Math.abs(x), 0))].concat(...a.map(x => ['49', f(x), '74', '0'])));
  const stRec = (h, n, file, big) => J(['0', 'STYLE', '5', h, '330', '5', '100', 'AcDbSymbolTableRecord', '100', 'AcDbTextStyleTableRecord', '2', n, '70', '0', '40', '0', '41', '1', '50', '0', '71', '0', '42', '2.5', '3', file, '4', big || '']);
  const brRec = (h, n, lay) => J(['0', 'BLOCK_RECORD', '5', h, '330', '9', '100', 'AcDbSymbolTableRecord', '100', 'AcDbBlockTableRecord', '2', n].concat(lay ? ['340', lay] : []));
  const tbl = (h, n, recs, extra) => J(['0', 'TABLE', '2', n, '5', h, '330', '0', '100', 'AcDbSymbolTable', '70', String(recs.length)].concat(extra || [], recs, ['0', 'ENDTAB']));
  const brs = [brRec('17', '*Model_Space', '1A')].concat(SH.map(S => brRec(S.br, S.nm, S.lay)), UB.map(U => brRec(U.br, r2kEsc(U.b.name))));
  if (!SH.length) brs.splice(1, 0, brRec('1B', '*Paper_Space', '1E'));
  const dim = J(['0', 'DIMSTYLE', '105', '2B', '330', '4', '100', 'AcDbSymbolTableRecord', '100', 'AcDbDimStyleTableRecord', '2', 'Standard', '70', '0', '3', '', '4', '', '40', '1', '41', '2.5', '42', '0.625', '43', '3.75', '44', '1.25', '45', '0', '46', '0', '47', '0', '48', '0',
    '140', '2.5', '141', '2.5', '142', '0', '143', '0.03937007874', '144', '1', '145', '0', '146', '1', '147', '0.625', '148', '0', '71', '0', '72', '0', '73', '0', '74', '0', '75', '0', '76', '0', '77', '1', '78', '8', '79', '3',
    '170', '0', '171', '3', '172', '1', '173', '0', '174', '0', '175', '0', '176', '0', '177', '0', '178', '0', '179', '2', '271', '2', '272', '2', '273', '2', '274', '3', '275', '0', '276', '0', '277', '2', '278', '44', '279', '0', '280', '0', '281', '0', '282', '0', '283', '0', '284', '8', '285', '0', '286', '0', '288', '0', '289', '3', '371', '-2', '372', '-2']);
  const vport = J(['0', 'VPORT', '5', '23', '330', '8', '100', 'AcDbSymbolTableRecord', '100', 'AcDbViewportTableRecord', '2', '*Active', '70', '0', '10', '0', '20', '0', '11', '1', '21', '1', '12', f((ext.x0 + ext.x1) / 2), '22', f((ext.y0 + ext.y1) / 2),
    '13', '0', '23', '0', '14', '0.5', '24', '0.5', '15', '0.5', '25', '0.5', '16', '0', '26', '0', '36', '1', '17', '0', '27', '0', '37', '0', '40', f(Math.max(1, (ext.y1 - ext.y0) * 1.1)), '41', '1.414', '42', '50', '43', '0', '44', '0', '50', '0', '51', '0',
    '71', '0', '72', '1000', '73', '1', '74', '3', '75', '0', '76', '0', '77', '0', '78', '0', '281', '0', '65', '0', '146', '0']);
  const tables = J(['0', 'SECTION', '2', 'TABLES',
    tbl('8', 'VPORT', [vport]),
    tbl('2', 'LTYPE', [ltRec('24', 'ByBlock', '', []), ltRec('25', 'ByLayer', '', []), ltRec('26', 'Continuous', 'Solid line', []), ltRec(H(), 'DASHED', 'Dashed __ __ __', [3, -2])].concat(ltExtra.map(n => ltRec(H(), r2kEsc(n), n, ltPat(n))))),
    tbl('1', 'LAYER', layRecs),
    tbl('5', 'STYLE', [stRec('29', 'Standard', 'txt'), (typeof lyShx === 'function' && lyShx() ? stRec(H(), 'CHT', 'romans.shx', 'chineset.shx') : stRec(H(), 'CHT', 'kaiu.ttf'))]),
    tbl('7', 'VIEW', []), tbl('6', 'UCS', []),
    tbl('3', 'APPID', [J(['0', 'APPID', '5', '2A', '330', '3', '100', 'AcDbSymbolTableRecord', '100', 'AcDbRegAppTableRecord', '2', 'ACAD', '70', '0'])]),
    tbl('4', 'DIMSTYLE', [dim], ['100', 'AcDbDimStyleTable']),
    tbl('9', 'BLOCK_RECORD', brs),
    '0', 'ENDSEC']);
  // ---- 圖塊 ----
  const blk = (h, br, n, ps, ents, end) => J(['0', 'BLOCK', '5', h, '330', br, '100', 'AcDbEntity'].concat(ps ? ['67', '1'] : [], ['8', '0', '100', 'AcDbBlockBegin', '2', n, '70', '0', '10', '0', '20', '0', '30', '0', '3', n, '1', ''], ents,
    ['0', 'ENDBLK', '5', end, '330', br, '100', 'AcDbEntity'], ps ? ['67', '1'] : [], ['8', '0', '100', 'AcDbBlockEnd']));
  const blocks = ['0', 'SECTION', '2', 'BLOCKS', blk('18', '17', '*Model_Space', false, [], '19')];
  if (!SH.length) blocks.push(blk('1C', '1B', '*Paper_Space', true, [], '1D'));
  SH.forEach((S, i) => blocks.push(blk(S.blk, S.br, S.nm, true, i === 0 ? [] : psEnts[i], S.end)));
  UB.forEach((U, i) => blocks.push(blk(U.blk, U.br, r2kEsc(U.b.name), false, ubEnts[i], U.end)));
  blocks.push('0', 'ENDSEC');
  // ---- 物件：字典與配置 ----
  const plot = (name, tab, br, std, last) => J(['0', 'LAYOUT', '5', std ? '1A' : name.h, '102', '{ACAD_REACTORS', '330', 'D', '102', '}', '330', 'D', '100', 'AcDbPlotSettings', '1', '', '2', R2K_A3.dev, '4', R2K_A3.paper, '6', '',
    '40', '0', '41', '0', '42', '0', '43', '0', '44', '420', '45', '297', '46', '0', '47', '0', '48', '0', '49', '0', '140', '0', '141', '0', '142', '1', '143', '1', '70', std ? '1712' : '688', '72', '1', '73', '0', '74', std ? '0' : '5', '7', '', '75', '16', '76', '0', '77', '2', '78', '300', '147', '1', '148', '0', '149', '0',
    '100', 'AcDbLayout', '1', std ? 'Model' : r2kEsc(name.n), '70', '1', '71', String(tab), '10', '0', '20', '0', '11', '420', '21', '297', '12', '0', '22', '0', '32', '0', '14', '0', '24', '0', '34', '0', '15', '420', '25', '297', '35', '0', '146', '0',
    '13', '0', '23', '0', '33', '0', '16', '1', '26', '0', '36', '0', '17', '0', '27', '1', '37', '0', '76', '1', '330', br].concat(last ? ['331', last] : []));
  const lyDict = [['Model', '1A']].concat(SH.length ? SH.map(S => [S.s.name, S.lay]) : [['Layout1', '1E']]);
  const objects = J(['0', 'SECTION', '2', 'OBJECTS',
    J(['0', 'DICTIONARY', '5', 'A', '330', '0', '100', 'AcDbDictionary', '281', '1', '3', 'ACAD_GROUP', '350', 'C', '3', 'ACAD_LAYOUT', '350', 'D', '3', 'ACAD_MLINESTYLE', '350', '10', '3', 'ACAD_PLOTSETTINGS', '350', '11', '3', 'ACAD_PLOTSTYLENAME', '350', '12'].concat(imDict ? ['3', 'ACAD_IMAGE_DICT', '350', imDict, '3', 'ACAD_IMAGE_VARS', '350', imVars] : [])),
    J(['0', 'DICTIONARY', '5', 'C', '330', 'A', '100', 'AcDbDictionary', '281', '1']),
    J(['0', 'DICTIONARY', '5', 'D', '330', 'A', '100', 'AcDbDictionary', '281', '1'].concat(...lyDict.map(([n, h]) => ['3', r2kEsc(n), '350', h]))),
    J(['0', 'DICTIONARY', '5', '10', '330', 'A', '100', 'AcDbDictionary', '281', '1', '3', 'Standard', '350', '22']),
    J(['0', 'DICTIONARY', '5', '11', '330', 'A', '100', 'AcDbDictionary', '281', '1']),
    J(['0', 'ACDBDICTIONARYWDFLT', '5', '12', '330', 'A', '100', 'AcDbDictionary', '281', '1', '3', 'Normal', '350', '13', '100', 'AcDbDictionaryWithDefault', '340', '13']),
    ...(imDict ? [J(['0', 'DICTIONARY', '5', imDict, '330', 'A', '100', 'AcDbDictionary', '281', '1'].concat(...IM.map(({ im, def }, i) => ['3', r2kEsc(im.file.replace(/\.[^.]+$/, '') + (i ? '_' + i : '')), '350', def])))] : []),
    ...IM.map(({ im, h, def, rx }) => J(['0', 'IMAGEDEF', '5', def, '102', '{ACAD_REACTORS', '330', imDict, '330', rx, '102', '}', '330', imDict, '100', 'AcDbRasterImageDef', '90', '0', '1', r2kEsc('.\\' + im.file),
      '10', String(im.px), '20', String(im.py), '11', f(Math.hypot(im.ux, im.uy)), '21', f(Math.hypot(im.vx, im.vy)), '280', '1', '281', '0'])),
    ...(imVars ? [J(['0', 'RASTERVARIABLES', '5', imVars, '102', '{ACAD_REACTORS', '330', 'A', '102', '}', '330', 'A', '100', 'AcDbRasterVariables', '90', '0', '70', '0', '71', '1', '72', '1'])] : []),
    ...IM.map(({ h, rx }) => J(['0', 'IMAGEDEF_REACTOR', '5', rx, '330', h, '100', 'AcDbRasterImageDefReactor', '90', '2', '330', h])),
    J(['0', 'ACDBPLACEHOLDER', '5', '13', '102', '{ACAD_REACTORS', '330', '12', '102', '}', '330', '12']),
    plot(null, 0, '17', true, '23'),
    ...(SH.length ? SH.map((S, i) => plot({ h: S.lay, n: S.s.name }, i + 1, S.br, false, S.v1)) : [plot({ h: '1E', n: 'Layout1' }, 1, '1B', false)]),
    J(['0', 'MLINESTYLE', '5', '22', '102', '{ACAD_REACTORS', '330', '10', '102', '}', '330', '10', '100', 'AcDbMlineStyle', '2', 'Standard', '70', '0', '3', '', '62', '256', '51', '90', '52', '90', '71', '2', '49', '0.5', '62', '256', '6', 'BYLAYER', '49', '-0.5', '62', '256', '6', 'BYLAYER']),
    '0', 'ENDSEC']);
  // ---- 表頭（最後產生，才知道 HANDSEED） ----
  const seed = H();
  const header = J(['0', 'SECTION', '2', 'HEADER', '9', '$ACADVER', '1', 'AC1015', '9', '$ACADMAINTVER', '70', '6', '9', '$DWGCODEPAGE', '3', 'ANSI_950',
    '9', '$INSBASE', '10', '0', '20', '0', '30', '0', '9', '$EXTMIN', '10', f(ext.x0), '20', f(ext.y0), '30', '0', '9', '$EXTMAX', '10', f(ext.x1), '20', f(ext.y1), '30', '0',
    '9', '$LIMMIN', '10', f(ext.x0), '20', f(ext.y0), '9', '$LIMMAX', '10', f(ext.x1), '20', f(ext.y1), '9', '$LTSCALE', '40', '1', '9', '$TEXTSTYLE', '7', 'CHT', '9', '$CLAYER', '8', '0',
    '9', '$INSUNITS', '70', String(o.units || 0), '9', '$MEASUREMENT', '70', '1', '9', '$PSLTSCALE', '70', '1', '9', '$TILEMODE', '70', '1', '9', '$LUNITS', '70', '2', '9', '$LUPREC', '70', '4',
    '9', '$PEXTMIN', '10', '0', '20', '0', '30', '0', '9', '$PEXTMAX', '10', '420', '20', '297', '30', '0', '9', '$PLIMMIN', '10', '0', '20', '0', '9', '$PLIMMAX', '10', '420', '20', '297',
    '9', '$HANDSEED', '5', seed, '0', 'ENDSEC']);
  const ents = ['0', 'SECTION', '2', 'ENTITIES', ...ms, ...(psEnts[0] || []), '0', 'ENDSEC'];
  // K1：影像類別物件須在 CLASSES 區段宣告（AutoCAD 才會把 IMAGE 連到 IMAGEDEF；ezdxf 讀檔會自動補，驗證時看不出來）
  const cls = (n, c, fl, ent) => ['0', 'CLASS', '1', n, '2', c, '3', 'ISM', '90', String(fl), '280', '0', '281', ent ? '1' : '0'];
  const classes = IM.length ? J(['0', 'SECTION', '2', 'CLASSES', ...cls('IMAGE', 'AcDbRasterImage', 2175, 1), ...cls('IMAGEDEF', 'AcDbRasterImageDef', 0, 0), ...cls('IMAGEDEF_REACTOR', 'AcDbRasterImageDefReactor', 1, 0), ...cls('RASTERVARIABLES', 'AcDbRasterVariables', 0, 0), '0', 'ENDSEC']) : null;
  return J([header].concat(classes ? [classes] : [], [tables, J(blocks), J(ents), objects, '0', 'EOF'])) + '\n';
}
