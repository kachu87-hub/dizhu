# v5.6 固床工原圖移植：使用者原工具（0607-1 石樑、6-06 嵌石、0608-1 預鑄拱型）整段程式包成 IIFE，
# 以假的 document／canvas／ctx 執行（不改原程式），drawWorld* 改寫為圖元輸出 → ormod3.js
#   TCO_S[key] = { DEF, run(R, OPT) → { P, rows, checks, O } }
import re, json, sys
sys.path.insert(0, '/home/claude/tcv4'); from or3fix import COMMON, FIX
from or3fix import ADD
ATT = '/mnt/user-data/attachments/99069836-f851-593c-92ab-abb13bf9a61c/'
CFG = [
    dict(key='r0607', file='aa7d4788-_____.html'),
    dict(key='e606', file='f65438fc-_____.html'),
    dict(key='a0608', file='d710689b-_______.html'),
    dict(key='g604', file='839111c5-_____.html', pre="customFrontCounts = Array.isArray(RR.__fc) && RR.__fc.length ? RR.__fc.map(v => Math.max(1, Math.round(+v) || 1)) : []; lastChangedSource = '';"),
    dict(key='s0603', file='0ca4d883-______.html', pre="lastChanged = 'N_high';"),
    dict(key='f0605', file='b257dd29-______.html', pre="__lrInit();"),
]

def sig(s, name):
    i = s.index('function ' + name + '('); j = s.index(') {', i); return s[i + len('function ' + name + '('):j]

out = ['/* ===================== v5.6 固床工原圖移植（自使用者原工具自動抽出，勿手改；改 gen_or3.py） ===================== */',
       'var TCO_S = window.TCO_S || (window.TCO_S = {});']
for c in CFG:
    h = open(ATT + c['file'], encoding='utf8').read()
    DEF = {}
    for m in re.finditer(r'<input[^>]*type="number"[^>]*id="([^"]+)"[^>]*value="([^"]*)"', h): DEF[m.group(1)] = m.group(2)
    for m in re.finditer(r'<input[^>]*id="([^"]+)"[^>]*type="number"[^>]*value="([^"]*)"', h): DEF.setdefault(m.group(1), m.group(2))
    for m in re.finditer(r'<select id="([^"]+)"[^>]*>(.*?)</select>', h, re.S):
        o = re.search(r'<option value="([^"]*)"[^>]*selected', m.group(2)) or re.search(r'<option value="([^"]*)"', m.group(2))
        DEF[m.group(1)] = o.group(1)
    for m in re.finditer(r'<input type="checkbox" id="([^"]+)"([^>]*)>', h): DEF[m.group(1)] = 'checked' in m.group(2)
    # 參數表（標籤、步距、上下限、選項）
    PR = []
    for m in re.finditer(r'<label>([^<]*)</label>\s*<(input|select)([^>]*)id="(p_[^"]+)"([^>]*)>(.*?)(?=</div>)', h, re.S):
        lab, tag, a1, pid, a2, rest = m.groups(); attrs = a1 + a2
        g = lambda k: (re.search(k + r'="([^"]*)"', attrs) or [None, None])[1]
        q = {'k': pid, 'nm': lab.replace('&gt;', '>').replace('&lt;', '<').strip(), 'def': DEF.get(pid), 'g': len(re.findall(r'<div class="group-title">', h[:m.start()])) - 1}
        if tag == 'select': q['opt'] = [[v, t.strip()] for v, t in re.findall(r'<option value="([^"]*)"[^>]*>([^<]*)</option>', rest)]
        else: q['st'] = g('step'); q['min'] = g('min'); q['max'] = g('max')
        PR.append(q)
    # 分組標題
    GT = [t.strip() for t in re.findall(r'<div class="group-title">\s*(?:<span>)?([^<]*)', h)]
    script = h[h.rindex('<script>') + 8:h.rindex('</script>')]
    A = ADD.get(c['key'], {})
    for old, new in A.get('subs', []):
        assert script.count(old) >= 1, (c['key'], old); script = script.replace(old, new)
    for pid, nm in A.get('relabel', {}).items():
        for q in PR:
            if q['k'] == pid: q['nm'] = nm
    for t in A.get('GT', []): GT.append(t)
    for q in A.get('PR', []):
        q = dict(q); gi = q.pop('gt', None)
        if gi is not None: q['g'] = GT.index(gi)
        PR.append(q); DEF[q['k']] = q['def']
    shim = []
    for fn, body in [('drawWorldLine', "O.push({ k: 'L', p: [[x1, y1], [x2, y2]], c: color, w: width, d: dash || [], ly: layer });"),
                     ('drawWorldPoly', "if (pts && pts.length >= 2) O.push({ k: 'P', p: pts.map(q => [q[0], q[1]]), c: strokeCol, w: width, f: fillCol, cl: !!closed, d: dash || [], ly: layer });"),
                     ('drawWorldCircle', "O.push({ k: 'C', x: cx, y: cy, r, c: strokeCol, f: fillCol, w: width, ly: layer });"),
                     ('drawWorldText', "const L = String(txt).split('\\n'); L.forEach((s, i) => O.push({ k: 'T', x: wx, y: wy - (i - (L.length - 1) / 2) * worldH * 1.25, s, h: worldH, c: color, al: align, bl: 'middle', rot: (rotDeg || 0) * Math.PI / 180, ly: layer }));")]:
        if 'function ' + fn + '(' in script:
            shim.append(f"function {fn}({sig(script, fn)}) {{ {body} }}")
    if 'function drawHoneyHatchRect(' in script:   # 6-04 蜂巢鉛絲網（原工具 ctx.clip）→ CB／CE
        shim.append("""function drawHoneyHatchRect(xMin, yMin, w, h) {
  if (!el('chkShowHoney').checked) return; O.push({ k: 'CB', p: [[xMin, yMin], [xMin + w, yMin], [xMin + w, yMin + h], [xMin, yMin + h]] });
  const hexR = 16, dx = hexR * 1.5, dy = hexR * Math.sqrt(3);
  for (let wx = xMin - hexR; wx <= xMin + w + hexR; wx += dx) { const yOff = (Math.round((wx - xMin) / dx) % 2 === 0) ? 0 : dy * 0.5;
    for (let wy = yMin - hexR; wy <= yMin + h + hexR; wy += dy) { const cy = wy + yOff; O.push({ k: 'P', p: [[wx - hexR * 0.5, cy - dy * 0.5], [wx + hexR * 0.5, cy - dy * 0.5], [wx + hexR, cy], [wx + hexR * 0.5, cy + dy * 0.5]], c: 'rgba(232,121,249,0.55)', w: 1, f: null, cl: false, d: [], ly: 'HONEY' }); } }
  O.push({ k: 'CE' });
}""")
    if 'function drawArConcHatch(' in script or 'function drawArConcPolygon(' in script:   # 原工具 ctx.clip 混凝土骨材紋 → CB／CE（兩種簽名：多邊形／矩形）
        if 'function drawArConcPolygon(' in script:
            shim.append("""function drawArConcPolygon(polyPts) { __conc(polyPts); }""")
        if 'function drawArConcHatch(' not in script: pass
        elif re.search(r'function drawArConcHatch\(xMin, yMin, w, h\)', script):
            shim.append("""function drawArConcHatch(xMin, yMin, w, h) { __conc([[xMin, yMin], [xMin + w, yMin], [xMin + w, yMin + h], [xMin, yMin + h]]); }""")
        else:
            shim.append("""function drawArConcHatch(polyPts) { __conc(polyPts); }""")
        shim.append("""function __conc(polyPts) {
  if (!polyPts || polyPts.length < 3) return; const xs = polyPts.map(p => p[0]), ys = polyPts.map(p => p[1]), x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  O.push({ k: 'CB', p: polyPts.map(p => [p[0], p[1]]) });
  for (let gx = x0; gx < x1; gx += 42) for (let gy = y0; gy < y1; gy += 42) [[[gx + 8, gy + 10], [gx + 17, gy + 6], [gx + 13, gy + 18]], [[gx + 26, gy + 24], [gx + 35, gy + 28], [gx + 29, gy + 36]]].forEach(t => O.push({ k: 'P', p: t, c: 'rgba(148,163,184,0.55)', w: 1, f: null, cl: true, d: [] }));
  O.push({ k: 'CE' });
}""")
    bad = re.findall(r'\bfetch\(|XMLHttpRequest|localStorage', script); assert not bad, (c['key'], bad)
    title = re.search(r'<title>([^<]*)', h).group(1)
    lay = '\n'.join(f"  {{ const __f = {fn}; {fn} = function (P) {{ return (LAST_L = __f(P)); }}; }}" for fn in ['computeDynamicLayout', 'computeDynamicViewLayout'] if 'function ' + fn + '(' in script)
    pre = c.get('pre', '')
    out.append(f"""TCO_S['{c['key']}'] = (function () {{   // {title}
  const DEF = {json.dumps(DEF, ensure_ascii=False)};
  let RR = null, OPT = {{}}, O = [];
  const EL = {{}}, CTX = new Proxy({{}}, {{ get: (t, k) => (k in t ? t[k] : () => ({{ width: 0 }})), set: (t, k, v) => {{ t[k] = v; return true; }} }});
  const el = id => EL[id] || (EL[id] = {{ get value() {{ const v = RR && RR[id] !== undefined && RR[id] !== null && RR[id] !== '' ? RR[id] : DEF[id]; return v === undefined ? '' : String(v); }}, set value(v) {{}},
    get checked() {{ return OPT[id] !== undefined ? !!OPT[id] : !!DEF[id]; }}, set checked(v) {{}}, textContent: '', innerHTML: '', style: {{}}, width: 1600, height: 1000, classList: {{ add() {{}}, remove() {{}}, toggle() {{}} }},
    addEventListener() {{}}, appendChild() {{}}, getContext() {{ return CTX; }}, getBoundingClientRect: () => ({{ left: 0, top: 0, width: 1600, height: 1000 }}), parentElement: {{ getBoundingClientRect: () => ({{ left: 0, top: 0, width: 1600, height: 1000 }}) }} }});
  const document = {{ getElementById: el, querySelectorAll: () => [], querySelector: () => null, createElement: () => ({{ click() {{}}, style: {{}}, className: '', innerHTML: '', appendChild() {{}}, querySelectorAll: () => [], querySelector: () => ({{ addEventListener() {{}}, getAttribute: () => '0', value: '' }}) }}), body: {{ appendChild() {{}}, removeChild() {{}} }} }};
  const window = {{ addEventListener() {{}}, innerWidth: 1990, innerHeight: 1044, devicePixelRatio: 1 }};
  const requestAnimationFrame = () => 0, alert = () => {{}};
{script}
  // ---- v6.3 數量改由圖形計算＋補標註（or3fix.py）----
{COMMON}
{FIX.get(c['key'], '')}
  // ---- 圖元輸出（覆寫原工具的 Canvas 繪圖函式）----
{chr(10).join(shim)}
  let LAST_L = null;   // v5.7：記錄原工具的視圖排版（各視圖原點），供平面／縱橫斷面取用原圖視圖
{lay}
  return {{
    DEF, PR: {json.dumps(PR, ensure_ascii=False)}, GT: {json.dumps(GT, ensure_ascii=False)}, title: {json.dumps(title, ensure_ascii=False)},
    run(R, opt) {{
      RR = R || {{}}; OPT = Object.assign({{}}, opt || {{}}); O = [];
      try {{
        {pre}
        LAST_L = null; const P = getParams(), rows = computeQuantities(P);
        let checks = [];
        try {{ updateSidebarUI(); const t = el('normCheckList').innerHTML || ''; checks = [...t.matchAll(/<div class="check-item ?(warn)?">([\\s\\S]*?)<\\/div>/g)].map(m => ({{ ok: !m[1], text: m[2].replace(/^\\s*[✔⚠]\\s*/, '').replace(/<[^>]+>/g, '') }})); }} catch (e) {{ }}
        if (OPT.draw) renderCAD();
        return {{ P, rows, checks, O, L: LAST_L }};
      }} finally {{ RR = null; }}
    }}
  }};
}})();""")
open('/home/claude/tcv4/ormod3.js', 'w', encoding='utf8').write('\n'.join(out) + '\n')
print('ormod3.js', sum(len(x) for x in out))
