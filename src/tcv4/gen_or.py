# 由使用者原工具 0402-1 乾砌石護岸 v2（HTML）自動抽出 computeModel 與 renderCAD 繪圖程式，產生 ormod.js
# 只替換「輸入來源」（getNum → 護岸參數）與「輸出層」（drawWorld* → 圖元陣列），繪圖邏輯原樣保留。
import re, sys
SRC = '/mnt/user-data/attachments/99069836-f851-593c-92ab-abb13bf9a61c/35b344b9-0402-1_____________-v2.html'
s = open(SRC, encoding='utf8').read()

def block(start, end_marker, include_end=False):
    i = s.index(start); j = s.index(end_marker, i)
    return s[i:j + (len(end_marker) if include_end else 0)]

cns = block('const CNS560_REBAR = {', '};', True).replace('const CNS560_REBAR', 'const TCO_CNS560_REBAR')
grav = block('const GRAVEL_TILE_SEGS = [', '];', True).replace('const GRAVEL_TILE_SEGS', 'const TCO_GRAVEL_TILE_SEGS')
shapes = block('const NORM_BOULDER_SHAPES = [', '];', True).replace('const NORM_BOULDER_SHAPES', 'const TCO_NORM_BOULDER_SHAPES')
seeded = block('function seededRand(seed) {', '\n}\n', True)
pip = block('function pointInPoly(pt, vs) {', '\n}\n', True)

cm = block('function computeModel() {', '\n// ====')
cm = cm[:cm.rindex('}') + 1]
cm = cm.replace('function computeModel() {', 'function tcoDry402Model(R) {   // ＝原工具 computeModel()，輸入改由護岸參數 R 提供\n  const getNum = (id, fb) => tcoDry402In(R, id, fb);')
cm = cm.replace("document.getElementById('sel_exc_mode').value", "(R.excMode || 'full')")
cm = cm.replace("document.getElementById('sel_rebar_main').value", "(R.rbm || 'D16')").replace("document.getElementById('sel_rebar_sub').value", "(R.rbs || 'D13')")
cm = cm.replace('NORM_BOULDER_SHAPES', 'TCO_NORM_BOULDER_SHAPES').replace('CNS560_REBAR', 'TCO_CNS560_REBAR')
assert 'document.' not in cm, 'unmapped DOM read in computeModel'

helpers = ''
for nm in ['function getDimExtensionCoords(', 'function drawHorizDim(', 'function drawVertDim(', 'function drawLeader(']:
    helpers += block(nm, '\n}\n', True)

rc = block('function renderCAD() {', '\n// ====')
rc = rc[:rc.rindex('}')]
body_all = rc[rc.index('  const x_top_fill_left = m.x_grav_top_left - m.w_top_fill;'):]
# 斷面細部（各樁號橫斷面用）：選配基礎／止滑榫／PC／鋼筋＋分層大塊石
sec = rc[rc.index('  // 2. 選配：底部水平混凝土基礎'):rc.index('  // 4. 開挖線')]

def fix(t):
    t = t.replace('state.showGravel', 'OPT.gravel').replace('state.showDims', 'OPT.dims').replace('state.showOrigRef', 'false')
    t = t.replace('drawDxfGravelHatchRegion(', 'drawGravel(')
    assert 'ctx.' not in t and 'canvas.' not in t and 'state.' not in t, 'unmapped canvas/state use'
    return t

out = f'''/* ===================== 原圖移植：0402-1 乾砌石護岸（自使用者原工具 v2 自動抽出，勿手改；改 gen_or.py） =====================
   tcoDry402Model(R)  ＝原 computeModel（cm）
   tcoDry402Prims(m, OPT, part)  ＝原 renderCAD 繪圖（part='all' 三視圖＋數量表；'sec' 斷面細部），輸出原圖座標（cm，y 向上）圖元：
     {{k:'L',p:[[x,y],[x,y]],c,w,d}} {{k:'P',p,c,w,f,cl,d}} {{k:'C',x,y,r,c,f,w}} {{k:'T',x,y,s,h,c,al,bl,rot}} {{k:'G',outer,holes,tile,c}}
*/
{cns}
{grav}
{shapes}
{seeded}
{pip}
function tcoDry402In(R, id, fb) {{   // 原工具輸入欄 → 護岸參數（H、D 為 m，其餘 cm）
  const M = {{ inp_H1: R.H * 100, inp_Df: R.D * 100, inp_n_slope: R.n, inp_N_layer: R.NL, inp_L_top: R.Ltop, inp_L_bot: R.Lbot, inp_R_boulder: R.Rb, inp_L_unit: (R.jsp || 10) * 100,
    inp_t_grav_top: R.tgt, inp_t_grav_bot: R.tgb, inp_w_exc_front: R.wef, inp_m_exc: R.ec, inp_w_top_fill: R.wtf, inp_H2: R.H2, inp_B_toe: R.Btoe, inp_B_heel: R.Bheel,
    inp_R1: R.R1, inp_P1: R.P1, inp_t_pc: R.tpc, inp_w_pc: R.wpc, inp_X_key: R.Xkey, inp_S_rebar: R.Srb }};
  const v = parseFloat(M[id]); return isNaN(v) ? fb : Math.round(v * 1e6) / 1e6;   // 去除 m→cm 換算的浮點尾數
}}
{cm}
function tcoDry402Prims(m, OPT, part) {{
  OPT = Object.assign({{ gravel: true, dims: true }}, OPT || {{}}); const O = [];
  const drawWorldLine = (x1, y1, x2, y2, color = '#ffffff', lineWidth = 1.5, dash = []) => O.push({{ k: 'L', p: [[x1, y1], [x2, y2]], c: color, w: lineWidth, d: dash }});
  const drawWorldPoly = (pts, strokeColor = '#ffffff', lineWidth = 1.5, fillColor = null, close = true, dash = []) => {{ if (pts && pts.length >= 2) O.push({{ k: 'P', p: pts.map(q => [q[0], q[1]]), c: strokeColor, w: lineWidth, f: fillColor, cl: close, d: dash }}); }};
  const drawWorldCircle = (wx, wy, rWorld, strokeColor = '#ffffff', fillColor = null, lineWidth = 1.2) => O.push({{ k: 'C', x: wx, y: wy, r: rWorld, c: strokeColor, f: fillColor, w: lineWidth }});
  const drawWorldText = (wx, wy, text, heightWorld = 10, color = '#ffffff', align = 'center', baseline = 'middle', rotRad = 0) => O.push({{ k: 'T', x: wx, y: wy, s: String(text), h: heightWorld, c: color, al: align, bl: baseline, rot: rotRad }});
  const drawGravel = (outerPoly, holePolys = [], tileSizeWorld = 52.0, strokeColor = '#d946ef') => {{ if (outerPoly && outerPoly.length >= 3) O.push({{ k: 'G', outer: outerPoly, holes: holePolys, tile: tileSizeWorld, c: strokeColor }}); }};
{helpers}
  if (part === 'sec') {{
{fix(sec)}
    return O;
  }}
{fix(body_all)}
  return O;
}}
'''
open('/home/claude/tcv4/ormod.js', 'w', encoding='utf8').write(out)
print('ormod.js', len(out))
