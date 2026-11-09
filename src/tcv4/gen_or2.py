# v5.5 原圖移植（一般化）：由使用者原工具 HTML 自動抽出 computeModel 與 renderCAD 繪圖程式，產生 ormod2.js
# 每個型式包成一個 IIFE（常數、純函式各自獨立，不互相衝突）：TCO_T[key] = { model(R), prims(m, OPT, part) }
#   輸入：getNum('inp_x') → tcoIn(R, 'inp_x')；document.getElementById('sel_x').value → tcoSel(R, 'sel_x', 預設)
#   輸出：drawWorld* / drawDxf*Region → 圖元陣列 {k:'L'|'P'|'C'|'T'|'G'|'H'|'E'|'CB'|'CE'}
import re
ATT = '/mnt/user-data/attachments/99069836-f851-593c-92ab-abb13bf9a61c/'
CFG = [
    dict(key='g404', file='07846153-_____.html', sec=('// A. 左上主視區', '// 4. 右側河床水平基準線')),
    dict(key='b403', file='77bc70ce-____.html', sec=('// A. 左上主視區', '// 4. 右側河床水平基準線')),
    dict(key='s406', file='ff3ff402-_____.html', sec=('// A. 左下區', '// 6. 標準開挖虛線')),
]

def fnblock(s, name):
    i = s.index('function ' + name + '('); j = s.index('\n}\n', i); return s[i:j + 3]

def sig_defaults(s, name):
    i = s.index('function ' + name + '('); j = s.index(') {', i); return s[i + len('function ' + name + '('):j]

out = ['/* ===================== v5.5 原圖移植（自使用者原工具自動抽出，勿手改；改 gen_or2.py） ===================== */',
       'var TCO_T = window.TCO_T || (window.TCO_T = {});']
for c in CFG:
    s = open(ATT + c['file'], encoding='utf8').read()
    sels = {}
    for sid in re.findall(r'<select id="([^"]+)"', s):
        i = s.index(f'<select id="{sid}"'); blk = s[i:s.index('</select>', i)]
        m = re.search(r'<option[^>]*value="([^"]*)"[^>]*selected', blk) or re.search(r'<option[^>]*value="([^"]*)"', blk)
        sels[sid] = m.group(1)
    consts = s[s.index('const CNS560_REBAR = {'):s.index('const state = {')]
    pure = ''
    for nm in ['seededRand', 'pointInPoly', 'polygonArea', 'face_area_m_str', 'generateDxfStonePolysInRect', 'buildSectionHexStonePolys', 'generateHexSurroundingStonesInRect', 'generateStaggeredPlanStonesInRect']:
        if 'function ' + nm + '(' in s:
            b = fnblock(s, nm); assert not re.search(r'ctx\.|document\.|state\.|drawWorld|worldToScreen', b), nm; pure += b
    cm = fnblock(s, 'computeModel')
    cm = re.sub(r"document\.getElementById\('(sel_\w+)'\)\.value", lambda m: f"tcoSel(RR, '{m.group(1)}', '{sels[m.group(1)]}')", cm)
    assert not re.search(r'document\.|state\.|ctx\.', cm), 'computeModel DOM'
    dims = ''.join(fnblock(s, n) for n in ['getDimExtensionCoords', 'drawHorizDim', 'drawVertDim', 'drawLeader'])
    rc = fnblock(s, 'renderCAD')
    st = rc.index('ctx.restore();') + len('ctx.restore();')
    en = rc.index('} catch (err)') if '} catch (err)' in rc else rc.rindex('}')
    body = rc[st:en]
    # 0406：砌石層 ctx.clip() → 圖元 CB／CE
    body, n = re.subn(r"ctx\.save\(\);\s*ctx\.beginPath\(\);\s*const sp0 = worldToScreen\((m\.\w+)\[0\]\[0\], \1\[0\]\[1\]\);.*?ctx\.clip\(\);", lambda m: f"O.push({{ k: 'CB', p: {m.group(1)} }});", body, flags=re.S)
    if n:
        k = body.index("k: 'CB'"); r = body.index('ctx.restore();', k); body = body[:r] + "O.push({ k: 'CE' });" + body[r + len('ctx.restore();'):]
    fix = lambda t: t.replace('state.showHatch', 'OPT.hatch').replace('state.showGravel', 'OPT.hatch').replace('state.showDims', 'OPT.dims').replace('state.showOrigRef', 'false')
    body = fix(body)
    a = body.index(c['sec'][0]); b = body.index(c['sec'][1]); sec = body[a:b]
    for t in (body, dims):
        bad = re.findall(r'ctx\.\w+|canvas\.\w+|worldToScreen|state\.\w+|document\.\w+', re.sub(r'//[^\n]*', '', t)); assert not bad, (c['key'], bad[:5])
    shim = []
    for fn, kind in [('drawDxfGravelRegion', 'G'), ('drawDxfHoneyMeshRegion', 'H'), ('drawDxfEarthHatchRegion', 'E')]:
        if 'function ' + fn + '(' in s:
            args = sig_defaults(s, fn)
            if kind == 'G': shim.append(f"  const {fn} = ({args}) => {{ if (outerPoly && outerPoly.length >= 3) O.push({{ k: 'G', outer: outerPoly, holes: [], tile: tileSizeWorld, c: strokeColor, segs: GRAVEL_TILE_SEGS }}); }};")
            if kind == 'H': shim.append(f"  const {fn} = ({args}) => {{ if (outerPoly && outerPoly.length >= 3) O.push({{ k: 'H', outer: outerPoly, r: cellRadiusWorld, c: strokeColor }}); }};")
            if kind == 'E': shim.append(f"  const {fn} = ({args}) => {{ if (outerPoly && outerPoly.length >= 3) O.push({{ k: 'E', outer: outerPoly, cell: cellWorld, c: strokeColor }}); }};")
    out.append(f"""TCO_T['{c['key']}'] = (function () {{   // {re.search(r'<title>([^<]*)', s).group(1).split('—')[0].strip()}
{consts}
{pure}
let RR = null;
const getNum = (id, fb) => tcoIn(RR, id, fb);
{cm}
function prims(m, OPT, part) {{
  OPT = Object.assign({{ hatch: true, dims: true }}, OPT || {{}}); const O = [];
  const drawWorldLine = (x1, y1, x2, y2, color = '#ffffff', lineWidth = 1.5, dash = []) => O.push({{ k: 'L', p: [[x1, y1], [x2, y2]], c: color, w: lineWidth, d: dash }});
  const drawWorldPoly = (pts, strokeColor = '#ffffff', lineWidth = 1.5, fillColor = null, close = true, dash = []) => {{ if (pts && pts.length >= 2) O.push({{ k: 'P', p: pts.map(q => [q[0], q[1]]), c: strokeColor, w: lineWidth, f: fillColor, cl: close, d: dash }}); }};
  const drawWorldCircle = (wx, wy, rWorld, strokeColor = '#ffffff', fillColor = null, lineWidth = 1.2) => O.push({{ k: 'C', x: wx, y: wy, r: rWorld, c: strokeColor, f: fillColor, w: lineWidth }});
  const drawWorldText = (wx, wy, text, heightWorld = 10, color = '#ffffff', align = 'center', baseline = 'middle', rotRad = 0) => O.push({{ k: 'T', x: wx, y: wy, s: String(text), h: heightWorld, c: color, al: align, bl: baseline, rot: rotRad }});
{chr(10).join(shim)}
{dims}
  if (part === 'sec') {{
{sec}
    return O;
  }}
{body}
  return O;
}}
return {{ model(R) {{ RR = R; try {{ return computeModel(); }} finally {{ RR = null; }} }}, prims, SEL: {sels!r} }};
}})();""")
open('/home/claude/tcv4/ormod2.js', 'w', encoding='utf8').write('\n'.join(out) + '\n')
print('ormod2.js', sum(len(x) for x in out))
