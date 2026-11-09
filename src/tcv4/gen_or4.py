# v5.7 0405-1／0405-2 預鑄舖排式護岸：使用者原工具整段程式包成 IIFE，以假 DOM 執行（不改原程式）
#   TCO_T['p405'] = { model(R) → computeModel()、prims(m, OPT) → renderCAD 圖元（cm） }
import re, json
ATT = '/mnt/user-data/attachments/99069836-f851-593c-92ab-abb13bf9a61c/'
h = open(ATT + '6126efbd-_________2_.html', encoding='utf8').read()
DEF = {}
for m in re.finditer(r'<input[^>]*type="number"[^>]*id="([^"]+)"[^>]*value="([^"]*)"', h): DEF[m.group(1)] = m.group(2)
for m in re.finditer(r'<input[^>]*id="([^"]+)"[^>]*type="number"[^>]*value="([^"]*)"', h): DEF.setdefault(m.group(1), m.group(2))
DEF['sel_dwg_mode'] = '0405-2'
for m in re.finditer(r'<input type="checkbox" id="([^"]+)"([^>]*)>', h): DEF[m.group(1)] = 'checked' in m.group(2)
script = h[h.rindex('<script>') + 8:h.rindex('</script>')]
assert not re.findall(r'\bfetch\(|XMLHttpRequest|localStorage', script)
shim = r"""
  function drawWorldLine(x1, y1, x2, y2, color = '#ffffff', lineWidth = 1.5, dash = []) { O.push({ k: 'L', p: [[x1, y1], [x2, y2]], c: color, w: lineWidth, d: dash || [] }); }
  function drawWorldPoly(pts, strokeColor = '#ffffff', lineWidth = 1.5, fillColor = null, close = true, dash = []) { if (pts && pts.length >= 2) O.push({ k: 'P', p: pts.map(q => [q[0], q[1]]), c: strokeColor, w: lineWidth, f: fillColor, cl: close, d: dash || [] }); }
  function drawWorldCircle(wx, wy, rWorld, strokeColor = '#ffffff', fillColor = null, lineWidth = 1.2) { O.push({ k: 'C', x: wx, y: wy, r: rWorld, c: strokeColor, f: fillColor, w: lineWidth }); }
  function drawWorldText(wx, wy, text, heightWorld = 8.5, color = '#ffffff', align = 'center', baseline = 'middle', rotRad = 0) { O.push({ k: 'T', x: wx, y: wy, s: String(text), h: heightWorld, c: color, al: align, bl: baseline, rot: rotRad }); }
  function drawDxfGravelRegion(outerPoly, tileSizeWorld = 30.0, strokeColor = '#c084fc') { if (outerPoly && outerPoly.length >= 3) O.push({ k: 'G', outer: outerPoly, holes: [], tile: tileSizeWorld, c: strokeColor, segs: GRAVEL_TILE_SEGS }); }
"""
out = f"""/* ===================== v5.7 0405-1／0405-2 預鑄舖排式護岸原圖移植（gen_or4.py 自動產生，勿手改） ===================== */
var TCO_T = window.TCO_T || (window.TCO_T = {{}});
TCO_T['p405'] = (function () {{
  const DEF = {json.dumps(DEF, ensure_ascii=False)};
  let RR = null, O = [];
  const EL = {{}}, CTX = new Proxy({{}}, {{ get: (t, k) => (k in t ? t[k] : () => ({{ width: 0 }})), set: (t, k, v) => {{ t[k] = v; return true; }} }});
  const el = id => EL[id] || (EL[id] = {{ get value() {{ const v = RR && RR[id] !== undefined && RR[id] !== null && RR[id] !== '' ? RR[id] : DEF[id]; return v === undefined ? '' : String(v); }}, set value(v) {{}},
    get checked() {{ return !!DEF[id]; }}, set checked(v) {{}}, textContent: '', innerHTML: '', style: {{}}, width: 1600, height: 1000, clientWidth: 1600, clientHeight: 1000, classList: {{ add() {{}}, remove() {{}}, toggle() {{}} }},
    addEventListener() {{}}, appendChild() {{}}, getContext() {{ return CTX; }}, getBoundingClientRect: () => ({{ left: 0, top: 0, width: 1600, height: 1000 }}) }});
  const document = {{ getElementById: el, querySelectorAll: () => [], querySelector: () => null, createElement: () => ({{ click() {{}}, style: {{}} }}), body: {{ appendChild() {{}}, removeChild() {{}} }}, readyState: 'loading', addEventListener() {{}} }};
  const window = {{ addEventListener() {{}}, innerWidth: 1990, innerHeight: 1044, devicePixelRatio: 1 }};
  const requestAnimationFrame = () => 0, alert = () => {{}};
{script}
  // ---- v6.3：模型數量改由圖面多邊形實算（qfixmod.js qfFixModel）；圖面數量表同步 ----
  {{ const __cm = computeModel; computeModel = function () {{ const m = __cm(); try {{ if (typeof qfFixModel === 'function') qfFixModel('p405', m); }} catch (e) {{ }} return m; }}; }}
  // ---- 圖元輸出（覆寫原工具的 Canvas 繪圖函式）----
{shim}
  const toRR = R => {{ const o = {{}}; Object.keys(R || {{}}).forEach(k => {{ o[k.startsWith('sel_') ? k : 'inp_' + k] = R[k]; }}); return o; }};
  return {{
    DEF,
    model(R) {{ RR = toRR(R); try {{ const m = computeModel(); m.__R = Object.assign({{}}, R); return m; }} finally {{ RR = null; }} }},
    prims(m, OPT, part) {{ RR = toRR(m && m.__R); O = []; try {{ renderCAD(); return O; }} finally {{ RR = null; }} }}
  }};
}})();
"""
open('/home/claude/tcv4/ormod4.js', 'w', encoding='utf8').write(out)
print('ormod4.js', len(out))
