# v8.0 三種結構物原工具移植（梳子壩、固床工＋80φ基樁、護坡基礎補強）→ ormodF.js
# 原工具 HTML 存於 tcv4/orig_st3/（comb.html、gs.html、slope.html）。
# 做法：原工具主程式碼原封包進沙盒（假 document／window），繪圖程式沿用（標準圖），
#       數量計算函式整個換成 st3src/*_q.js（依圖面幾何計算），其餘寫死數值以 SUBS 改為參數。
import re, json, os
D = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(D, 'st3src')

def main_script(fn):
    h = open(os.path.join(D, 'orig_st3', fn), encoding='utf8').read()
    scr = re.findall(r'<script(?: [^>]*)?>(.*?)</script>', h, re.S)
    return max(scr, key=len)

def replace_fn(s, name, new):
    i = s.index('function ' + name + '(')
    j = s.index('{', i); d = 0; k = j
    while True:
        c = s[k]
        if c == '{': d += 1
        elif c == '}':
            d -= 1
            if d == 0: break
        k += 1
    return s[:i] + new.strip() + s[k + 1:]

def subs(s, L):
    for a, b, *n in L:
        cnt = n[0] if n else 1
        assert s.count(a) == cnt, (a, s.count(a), cnt)
        s = s.replace(a, b)
    return s

SANDBOX = r'''
  const __EL = {}, __CTX = new Proxy({}, { get: (t, k) => (k in t ? t[k] : () => ({ width: 0 })), set: (t, k, v) => { t[k] = v; return true; } });
  const __mk = id => ({ id, value: '', textContent: '', innerHTML: '', innerText: '', className: '', style: {}, dataset: {}, checked: false, width: 800, height: 600, clientWidth: 800, clientHeight: 600, offsetWidth: 800, offsetHeight: 600,
    parentElement: { clientWidth: 800, clientHeight: 600, getBoundingClientRect: () => ({ left: 0, top: 0, width: 800, height: 600 }) },
    classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } }, addEventListener() {}, removeEventListener() {}, setAttribute() {}, getAttribute() { return null; },
    appendChild() {}, removeChild() {}, querySelector() { return null; }, querySelectorAll() { return []; }, getContext() { return __CTX; },
    getBoundingClientRect() { return { left: 0, top: 0, width: 800, height: 600 }; }, click() {}, focus() {} });
  const document = { getElementById: id => __EL[id] || (__EL[id] = __mk(id)), querySelector: () => __mk('q'), querySelectorAll: () => [], createElement: () => __mk('c'), body: __mk('body'), addEventListener() {} };
  const window = { addEventListener() {}, removeEventListener() {}, devicePixelRatio: 1, innerWidth: 800, innerHeight: 600 };
  const requestAnimationFrame = () => 0, cancelAnimationFrame = () => {}, alert = () => {}, ResizeObserver = class { observe() {} disconnect() {} };
  const lucide = { createIcons() {} }, navigator = { clipboard: { writeText: () => Promise.resolve() } }, Blob = class {}, URL = { createObjectURL: () => '', revokeObjectURL() {} };
'''

def js(o): return json.dumps(o, ensure_ascii=False)

def pr_list(rows):
    out = []
    for r in rows:
        if r[0] == 'opt':
            _, k, nm, d, opts, g = r; out.append({'k': k, 'nm': nm, 'def': str(d), 'opt': opts, 'g': g})
        else:
            k, nm, d, st, mn, mx, g = r; out.append({'k': k, 'nm': nm, 'def': str(d), 'st': str(st), 'min': str(mn), 'max': str(mx), 'g': g})
    return out

# ============================== 梳子壩 ==============================
def build_comb():
    s = main_script('comb.html')
    s = replace_fn(s, 'computeDerivedAndQuantities', open(os.path.join(SRC, 'comb_q.js'), encoding='utf8').read())
    S = [
        ('const xWeirL = xWingL + p.W_slope;', 'const xWeirL = xWingL + p.W_slope_L;', 3),
        ('const xWingR = xWeirR + p.W_slope;', 'const xWingR = xWeirR + p.W_slope_R;', 3),
        ('drawDimH(xWingL, xWeirL, yPlanUpEdge, yPlanUpEdge, yPlanDim2, p.W_slope,', 'drawDimH(xWingL, xWeirL, yPlanUpEdge, yPlanUpEdge, yPlanDim2, p.W_slope_L,'),
        ('drawDimH(xWeirR, xWingR, yPlanUpEdge, yPlanUpEdge, yPlanDim2, p.W_slope,', 'drawDimH(xWeirR, xWingR, yPlanUpEdge, yPlanUpEdge, yPlanDim2, p.W_slope_R,'),
        ('drawDimH(xWingL, xWeirL, yUpperTop, yWeirCrest, yDim3, p.W_slope,', 'drawDimH(xWingL, xWeirL, yUpperTop, yWeirCrest, yDim3, p.W_slope_L,', 2),
        ('drawDimH(xWeirR, xWingR, yWeirCrest, yUpperTop, yDim3, p.W_slope,', 'drawDimH(xWeirR, xWingR, yWeirCrest, yUpperTop, yDim3, p.W_slope_R,', 2),
        ("addText(xWingL + p.W_slope * 0.55, yWeirCrest + p.H_upper * 0.55, '1:1',", "addText(xWingL + p.W_slope_L * 0.55, yWeirCrest + p.H_upper * 0.55, `1:${+(p.W_slope_L / p.H_upper).toFixed(2)}`,"),
        ("addText(xWeirR + p.W_slope * 0.45, yWeirCrest + p.H_upper * 0.55, '1:1',", "addText(xWeirR + p.W_slope_R * 0.45, yWeirCrest + p.H_upper * 0.55, `1:${+(p.W_slope_R / p.H_upper).toFixed(2)}`,"),
        ('xWeirR + p.W_slope * 0.6', 'xWeirR + p.W_slope_R * 0.6'),
        ("'高程(1005.96m)'", "'溢流口高程(見縱斷面圖)'"),
        ("'梳子壩(0K+339.3)'", "'梳子壩'"),
        # 側視圖：前庭漿砌石槽與護坦移到下游側（與平面圖、水流方向一致；原工具側視圖畫在上游側）
        ('const xS_UpStoneL_Top = xS_BaseUp - sUpStoneTopW;', 'const xS_UpStoneL_Top = xS_BaseDn + sUpStoneTopW;'),
        ('const xS_UpStoneL_Bot = xS_BaseUp - sUpStoneBotW;', 'const xS_UpStoneL_Bot = xS_BaseDn + sUpStoneBotW;'),
        ('const yS_UpStoneTop = yS_BaseTop + 180;', 'const yS_UpStoneTop = yS_BaseTop;'),
        ('    [xS_BaseUp + 60, yS_UpStoneTop],\n    [xS_BaseUp, yS_UpStoneBot],', '    [xS_BaseDn, yS_UpStoneTop],\n    [xS_BaseDn, yS_UpStoneBot],'),
        ('const xS_ApronEnd = xS_UpStoneL_Top - sApronL;', 'const xS_ApronEnd = xS_UpStoneL_Top + sApronL;'),
        ('const yS_ApronStartTop = yS_UpStoneTop - 160;', 'const yS_ApronStartTop = yS_UpStoneTop;'),
        ('const sApronL = p.L_apron_dn * scSide * 0.72;', 'const sApronL = p.L_apron_dn * scSide;'),
        ('const bx = xS_ApronEnd + t * sApronL;', 'const bx = xS_ApronEnd - t * sApronL;'),
        ('const bx = xS_BaseUp - (c + 0.5) * (rowW / 2);', 'const bx = xS_BaseDn + (c + 0.5) * (rowW / 2);'),
        ('drawDimV(yS_ApronEndTop - sApronT, yS_ApronEndTop, xS_ApronEnd, xS_ApronEnd, xS_ApronEnd - 120,', 'drawDimV(yS_ApronEndTop - sApronT, yS_ApronEndTop, xS_ApronEnd, xS_ApronEnd, xS_ApronEnd + 120,'),
        ('drawDimV(yS_UpStoneBot, yS_UpStoneTop, xS_UpStoneL_Bot, xS_UpStoneL_Top, xS_UpStoneL_Top - 130,', 'drawDimV(yS_UpStoneBot, yS_UpStoneTop, xS_UpStoneL_Bot, xS_UpStoneL_Top, xS_UpStoneL_Top + 130,'),
        # 壩高尺寸移到上游側（下游側已有漿砌石槽與護坦）
        ('const xSDim1 = xS_BaseDn + 280;\n    const xSDim2 = xS_BaseDn + 540;', 'const xSDim1 = xS_BaseUp - 280;\n    const xSDim2 = xS_BaseUp - 540;'),
        ('drawDimV(yS_KeyBot, yS_BaseBot, xS_KeyBotDn, xS_BaseDn, xSDim1,', 'drawDimV(yS_KeyBot, yS_BaseBot, xS_KeyBotUp, xS_BaseUp, xSDim1,'),
        ('drawDimV(yS_BaseBot, yS_BaseTop, xS_BaseDn, xS_BaseDn, xSDim1,', 'drawDimV(yS_BaseBot, yS_BaseTop, xS_BaseUp, xS_BaseUp, xSDim1,'),
        ('drawDimV(yS_BaseTop, yS_Mid, xS_BaseDn, xS_MidDn, xSDim1,', 'drawDimV(yS_BaseTop, yS_Mid, xS_BaseUp, xS_MidUp, xSDim1,'),
        ('drawDimV(yS_Mid, yS_WeirTop, xS_MidDn, xS_WeirDn, xSDim1,', 'drawDimV(yS_Mid, yS_WeirTop, xS_MidUp, xS_WeirUp, xSDim1,'),
        ('drawDimV(yS_WeirTop, yS_WingTop, xS_WeirDn, xS_WingDn, xSDim1,', 'drawDimV(yS_WeirTop, yS_WingTop, xS_WeirUp, xS_WingUp, xSDim1,'),
        ('drawDimV(yS_KeyBot, yS_WeirTop, xS_BaseDn, xS_WeirDn, xSDim2,', 'drawDimV(yS_KeyBot, yS_WeirTop, xS_BaseUp, xS_WeirUp, xSDim2,'),
        ("[xS_BaseUp - 520, yS_BaseTop + sHLow * 0.55], [xS_BaseUp - 680, yS_BaseTop + sHLow * 0.55]], '280kgf/cm2混凝土'", "[xS_BaseUp - 900, yS_BaseTop + sHLow * 1.25], [xS_BaseUp - 1060, yS_BaseTop + sHLow * 1.25]], '280kgf/cm2混凝土'"),
    ]
    s = subs(s, S)
    left = [m.start() for m in re.finditer(r'p\.W_slope\b', s)]
    assert not left, [s[i - 60:i + 30] for i in left]
    G = ['1. 梳子開口與溢流段（左右分開）', '2. 斜坡翼牆、翼牆與兩岸（左右分開）', '3. 壩身斷面與基礎', '4. 前庭漿砌石槽與護坦（下游）', '5. 鋼筋（原圖無鋼筋表，kg/m³ 估算）與配筋標註']
    R = [
        ('p_N_pier', '梳齒墩數 N_pier', 5, 1, 1, 30, 0), ('p_W_pier', '梳齒墩寬 W_pier (cm)', 250, 10, 50, 1000, 0), ('p_W_slot', '開口淨寬 W_slot (cm)', 150, 10, 30, 1000, 0),
        ('p_W_ovf_L', '左溢流段寬 W_ovf_L (cm)', 2425, 10, 0, 20000, 0), ('p_W_ovf_R', '右溢流段寬 W_ovf_R (cm)', 2425, 10, 0, 20000, 0),
        ('p_W_slope_L', '左斜坡翼牆水平寬 (cm)', 500, 10, 50, 3000, 1), ('p_W_slope_R', '右斜坡翼牆水平寬 (cm)', 500, 10, 50, 3000, 1),
        ('p_W_wing_L', '左翼牆頂水平長 (cm)', 2200, 10, 100, 10000, 1), ('p_W_wing_R', '右翼牆頂水平長 (cm)', 2500, 10, 100, 10000, 1),
        ('p_W_cut_L', '左岸壩底斜坡縮減 (cm)', 1000, 10, 0, 10000, 1), ('p_W_cut_R', '右岸壩底斜坡縮減 (cm)', 1200, 10, 0, 10000, 1), ('p_H_wing_rise', '翼牆頂端加高 (cm)', 150, 10, 0, 1000, 1),
        ('p_H_lower', '下段壩高（溢流口以下）H_lower (cm)', 600, 10, 100, 3000, 2), ('p_H_upper', '上段壩高（翼牆）H_upper (cm)', 500, 10, 50, 3000, 2),
        ('p_T_base', '基礎底版厚 (cm)', 100, 10, 30, 500, 2), ('p_D_key', '止滑齒牆深（0＝無）(cm)', 300, 10, 0, 1000, 2), ('p_B_key_bot', '止滑齒牆底寬 (cm)', 100, 10, 30, 1000, 2),
        ('p_B_wing_top', '翼牆最高頂寬 (cm)', 150, 10, 50, 1000, 2), ('p_B_weir_top', '溢流段頂寬（翼牆底）(cm)', 180, 10, 50, 1000, 2), ('p_B_mid', '中段折點寬（溢流口頂寬）(cm)', 280, 10, 50, 2000, 2),
        ('p_S_up', '上游壩面坡 1:S_up', 0.3, 0.05, 0, 2, 2), ('p_S_dn', '下游壩面坡 1:S_dn', 0.5, 0.05, 0, 2, 2),
        ('p_B_stone_top', '前庭漿砌石槽頂寬 (cm)', 200, 10, 0, 2000, 3), ('p_B_stone_bot', '前庭漿砌石槽底寬 (cm)', 100, 10, 0, 2000, 3), ('p_D_stone_up', '前庭漿砌石槽深 (cm)', 400, 10, 0, 2000, 3),
        ('p_L_apron_dn', '護坦長（半橢圓短軸）(cm)', 1500, 10, 0, 10000, 3), ('p_T_apron_dn', '護坦厚 (cm)', 100, 10, 0, 500, 3), ('p_S_apron', '護坦坡度 (%)', 3.8, 0.1, 0, 30, 3), ('p_D_rock', '塊石代表粒徑 (cm)', 100, 10, 20, 300, 3),
        ('p_rbk', '鋼筋估算量 (kg/m³，含損耗)', 4.44, 0.01, 0, 300, 4), ('p_C_rebar', '鋼筋保護層 (cm)', 15, 1, 3, 30, 4), ('p_S_rebar_main', '主筋間距（標註）(cm)', 30, 5, 10, 100, 4), ('p_S_rebar_pier', '墩筋間距（標註）(cm)', 60, 5, 10, 200, 4),
    ]
    PR = pr_list(R)
    return s, G, PR

COMB_TAIL = r'''
  ;return { draw(P) { params = P; currentViewMode = 'ALL'; showRefOverlay = false; rebuildScene(); return scenePrimitives; }, comp: P => computeDerivedAndQuantities(P), LC: LAYER_COLORS };
'''

def wrap(key, title, s, G, PR, tail, body):
    return (f"TCO_S['{key}'] = (function () {{   // v8.0 {title}（原工具沙盒；gen_st3.py 自動產生）\n"
            f"  const GT = {js(G)};\n  const PR = {js(PR)};\n  const DEF = {{}}; PR.forEach(q => {{ DEF[q.k] = q.def; }});\n"
            + SANDBOX + "  const __H = (function () {\n" + s + tail + "  })();\n" + body + "\n})();\n")

# ============================== 護坡基礎補強 ==============================
TFR_TAIL = r"""
  ;return { draw(P) { params = P; showRefOverlay = false; showSlopeContext = true; rebuildScene(); return scenePrimitives; }, comp: P => computeDerivedAndQuantities(P), LC: LAYER_COLORS, DP: DEFAULT_PARAMS };
"""
def build_tfr():
    s = main_script('slope.html')
    s = replace_fn(s, 'computeDerivedAndQuantities', open(os.path.join(SRC, 'tfr_q.js'), encoding='utf8').read())
    s = subs(s, [("['鋼筋(含損耗)', 'kg', d.W_rebar.toFixed(2)],", "['鋼筋(估算)', 'kg', d.W_rebar.toFixed(2)],", 1),
                 ("'4. 既有護坡基礎補強臨既有護坡之開挖面若遇大石可依現地調整位置，經監造單同意即可施作', 16.5, 'TEXT', 'left');",
                  "'4. 既有護坡基礎補強臨既有護坡之開挖面若遇大石可依現地調整位置，經監造單同意即可施作', 16.5, 'TEXT', 'left');\n  addText(xTbl, yNotesStart - 142, `5. 鋼筋：原圖無鋼筋表，以 ${p.rbk} kg/m³ 估算（含損耗）`, 16.5, 'TEXT', 'left');", 1)])
    G = ['1. 格框尺寸', '2. 配置（沿護岸牆腳）', '3. 深度與材料', '4. 鋼筋（原圖無鋼筋表，kg/m³ 估算）']
    R = [('p_N_col', '橫向分格數（垂直水流）', 2, 1, 1, 10, 0), ('p_N_row', '縱向分格數（順水流）', 1, 1, 1, 10, 0), ('p_W_cell', '單格橫向淨寬 (cm)', 300, 10, 50, 1000, 0),
         ('p_L_cell', '單格縱向淨長 (cm)', 400, 10, 50, 1000, 0), ('p_T_wall', 'RC 格樑厚 (cm)', 40, 5, 15, 150, 0), ('p_L_chamfer', '內角隅斜角 (cm)', 35, 5, 0, 150, 0),
         ('p_S_unit', '每座縱向間距 (cm)', 180, 10, 0, 2000, 1), ('p_W_gap_slope', '距既有護坡（牆腳）間距 (cm)', 100, 10, 0, 1000, 1),
         ('p_H_beam', '格樑深 (cm)', 150, 10, 50, 500, 2), ('p_D_embed', '頂層塊石嵌槽深 (cm)', 30, 5, 0, 100, 2), ('p_K_embed', '填石深計入嵌槽深（1＝是、0＝否）', 1, 1, 0, 1, 2), ('p_D_rock', '塊石代表粒徑 (cm)', 60, 5, 20, 150, 2),
         ('p_rbk', '鋼筋估算量 (kg/m³，含損耗)', 34.94, 0.01, 0, 300, 3), ('p_S_rebar', '鋼筋間距（標註）(cm)', 30, 5, 10, 100, 3), ('p_C_rebar', '保護層 (cm)', 7.5, 0.5, 3, 20, 3), ('p_L_rebar_diag', '開口補強斜筋錨固長 (cm)', 30, 5, 0, 200, 3)]
    return s, G, pr_list(R)

if __name__ == '__main__':
    out = ['/* v8.0 三種結構物原工具移植（gen_st3.py 自動產生，勿手改；改 st3src/*.js 或 gen_st3.py 後重跑） */']
    s, G, PR = build_comb()
    out.append(wrap('comb', '梳子壩（直線型）', s, G, PR, COMB_TAIL, open(os.path.join(SRC, 'comb_host.js'), encoding='utf8').read()))
    if os.path.exists(os.path.join(SRC, 'gsp_host.js')):
        from gen_st3_gsp import build_gsp, GSP_TAIL
        s, G, PR = build_gsp(main_script, replace_fn, subs, pr_list, SRC)
        out.append(wrap('gsp', '固床工＋80φ基樁', s, G, PR, GSP_TAIL, open(os.path.join(SRC, 'gsp_host.js'), encoding='utf8').read()))
    s, G, PR = build_tfr()
    out.append(wrap('tfr', '既有護坡基礎補強', s, G, PR, TFR_TAIL, open(os.path.join(SRC, 'tfr_host.js'), encoding='utf8').read()))
    open(os.path.join(D, 'ormodF.js'), 'w', encoding='utf8').write('\n'.join(out))
    print('ok', sum(len(x) for x in out))
