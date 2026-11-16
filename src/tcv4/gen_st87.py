# v8.7 八種原工具移植 → ormodG.js
#   橫向（固床工型式 TCO_S）：橫向截水溝＋TGB 格柵板（tgb）、攔石工（rockc）、透過性鋼格框潛壩（steel）、階梯式固床工（stepgs）
#   路面（排水溝框架 TCO_D）：RC 路面（rcrd）、級配複式斷面鋪設路面（gvrd）
#   護岸型式（TCO_T）：植生塊 RC 箱護岸（rcbox）
#   生物通道型式（TCO_B）：RC 護岸開口式動物通道（anim）
# 原工具 HTML 存於 tcv4/orig87/。做法同 gen_st3.py：原工具主程式原封包進沙盒，繪圖沿用（標準圖）；
# 數量計算函式改名 __origQ 保留其餘衍生值，外層換成 st87src/<key>_q.js（依圖面幾何計算，寫死值改參數）。
import re, json, os
D = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(D, 'st87src')

def main_script(fn):
    h = open(os.path.join(D, 'orig87', fn), encoding='utf8').read()
    scr = re.findall(r'<script(?: [^>]*)?>(.*?)</script>', h, re.S)
    return max(scr, key=len)

def rename_fn(s, name, new):
    i = s.index('function ' + name + '(')
    return s[:i] + 'function ' + new + '(' + s[i + len('function ' + name + '('):]

def subs(s, L, tag=''):
    for a, b, *n in L:
        cnt = n[0] if n else 1
        assert s.count(a) == cnt, (tag, a[:80], s.count(a), cnt)
        s = s.replace(a, b)
    return s

def rd(fn): return open(os.path.join(SRC, fn), encoding='utf8').read()
def js(o): return json.dumps(o, ensure_ascii=False)

SANDBOX = r'''
  const __EL = {}, __CTX = new Proxy({}, { get: (t, k) => (k in t ? t[k] : () => ({ width: 0 })), set: (t, k, v) => { t[k] = v; return true; } });
  const __mk = id => ({ id, value: '', textContent: '', innerHTML: '', innerText: '', className: '', style: {}, dataset: {}, checked: false, disabled: false, width: 800, height: 600, clientWidth: 800, clientHeight: 600, offsetWidth: 800, offsetHeight: 600, options: [], children: [], childNodes: [],
    parentElement: { clientWidth: 800, clientHeight: 600, getBoundingClientRect: () => ({ left: 0, top: 0, width: 800, height: 600 }) },
    classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } }, addEventListener() {}, removeEventListener() {}, setAttribute() {}, getAttribute() { return null; }, removeAttribute() {},
    appendChild() {}, removeChild() {}, insertAdjacentHTML() {}, querySelector() { return null; }, querySelectorAll() { return []; }, getContext() { return __CTX; }, closest() { return null; },
    getBoundingClientRect() { return { left: 0, top: 0, width: 800, height: 600 }; }, click() {}, focus() {}, blur() {} });
  const document = { getElementById: id => __EL[id] || (__EL[id] = __mk(id)), querySelector: () => __mk('q'), querySelectorAll: () => [], createElement: () => __mk('c'), body: __mk('body'), documentElement: __mk('html'), addEventListener() {} };
  const window = { addEventListener() {}, removeEventListener() {}, devicePixelRatio: 1, innerWidth: 800, innerHeight: 600, matchMedia: () => ({ matches: false, addEventListener() {} }) };
  const requestAnimationFrame = () => 0, cancelAnimationFrame = () => {}, alert = () => {}, ResizeObserver = class { observe() {} disconnect() {} };
  const lucide = { createIcons() {} }, navigator = { clipboard: { writeText: () => Promise.resolve() } }, Blob = class {}, URL = { createObjectURL: () => '', revokeObjectURL() {} };
'''

def pr_list(rows):
    out = []
    for r in rows:
        if r[0] == 'opt':
            _, k, nm, d, opts, g = r; out.append({'k': k, 'nm': nm, 'def': str(d), 'opt': opts, 'g': g})
        else:
            k, nm, d, st, mn, mx, g = r; out.append({'k': k, 'nm': nm, 'def': str(d), 'st': str(st), 'min': str(mn), 'max': str(mx), 'g': g})
    return out

# ---------------- ViewBuilder 引擎（rcroad、gvroad、tgb、rockc、steel、stepgs 共用） ----------------
def vb_tool(key, fn, defName, qfn, modeLines, sub=None, extraTail=''):
    s = main_script(fn)
    s = subs(s, [('window.onload = function () {', 'const __onload_unused = function () {')], key)
    if sub: s = subs(s, sub, key)
    s = rename_fn(s, qfn, '__origQ')
    s += '\n' + rd(key + '_q.js') + '\n'
    tail = ('\n  ;return { draw(PP) { P = Object.assign({}, ' + defName + ', PP); ' + modeLines + ' showGhostOverlay = false; rebuildAllCADGeometry(); return cadEntities; },\n'
            '    comp: PP => ' + qfn + '(Object.assign({}, ' + defName + ', PP)), LC: layers, D0: ' + defName + ' };\n' + extraTail)
    return s, tail

def wrap(store, key, title, s, tail, G, PR, body):
    return (f"{store}['{key}'] = (function () {{   // v8.7 {title}（原工具沙盒；gen_st87.py 自動產生）\n"
            f"  const GT = {js(G)};\n  const PR = {js(PR)};\n  const DEF = {{}}; PR.forEach(q => {{ DEF[q.k] = q.def; }});\n"
            "  const __D87 = {}; PR.forEach(q => { __D87[q.k.slice(2)] = q.opt ? q.def : +q.def; });\n"
            + SANDBOX + (rd(key + '_m.js') if os.path.exists(os.path.join(SRC, key + '_m.js')) else '') + "  const __H = (function () {\n" + s + tail + "  })();\n" + body + "\n})();\n")

TOOLS = []
def tool(**k): TOOLS.append(k)

# ====== RC 路面 ======
tool(store='TCO_D', key='rcrd', title='RC 路面鋪設', fn='rcroad.html', defName='STD_PARAMS', qfn='computeQuantities', modes='', sub=[('const wireUnitKgPerM = +(0.006165 * p.d_wire * p.d_wire).toFixed(4);', 'const wireUnitKgPerM = +((p.kw ?? 0.006165) * p.d_wire * p.d_wire).toFixed(4);')])
# ====== 級配複式斷面鋪設路面 ======
tool(store='TCO_D', key='gvrd', title='級配複式斷面鋪設路面', fn='gvroad.html', defName='STD_PARAMS', qfn='computeQuantities', modes="viewMode = 'ALL';", sub=[
    ('const L_gravel_cm = Math.max(50, p.L_unit - p.B_tie);', 'const L_gravel_cm = Math.max(0, p.L_unit - p.B_tie);'),
    ('const wireUnitKgPerM = +(0.006165 * p.d_wire * p.d_wire).toFixed(4);', 'const wireUnitKgPerM = +((p.kw ?? 0.006165) * p.d_wire * p.d_wire).toFixed(4);')])

# ====== 橫向截水溝及 TGB 型鍍鋅格柵板 ======
tool(store='TCO_S', key='tgb', title='橫向截水溝及 TGB 型鍍鋅格柵板', fn='tgb.html', defName='STD_PARAMS', qfn='computeDerivedQuantities', modes="viewMode = 'ALL';", sub=[
    ("['鋼筋(含損耗)', 'kg', q.W_rebar_site.toFixed(2)],", "['鋼筋(含損耗,估算)', 'kg', q.W_rebar_site.toFixed(2)],"),
    ('const nGrates = Math.max(1, Math.round(p.L_top / 100));', 'const nGrates = Math.max(1, Math.round(p.L_top / (p.S_grate || 100)));'),
    ('const grateWeightEach = 86.0;', 'const grateWeightEach = (p.w_cover ?? 72) + (p.w_frame ?? 14);'),
    ('const xStep1 = p.t_wall + Math.round((p.L_pit - p.t_wall) * 0.375);', 'const xStep1 = p.t_wall + Math.round((p.L_pit - p.t_wall) * (p.k_step ?? 0.375));')],
  G=['1. 截水溝（橫越路面）', '2. 集水井與塊狀護欄', '3. TGB 格柵板', '4. 材料、鋼筋（原圖無鋼筋表，kg/m³ 估算）與開挖'],
  R=[('p_L_top', '格柵板段總長 L_top (cm)', 400, 10, 100, 3000, 0), ('p_L_bot', '溝內淨長（路寬）L_bot (cm)', 350, 10, 50, 3000, 0), ('p_B_ch', '溝內淨寬 B_ch (cm)', 50, 5, 20, 200, 0),
     ('p_H_chL', '溝深（集水井端）H_chL (cm)', 70, 5, 20, 300, 0), ('p_H_chR', '溝深（末端）H_chR (cm)', 60, 5, 20, 300, 0), ('p_t_wall', '側壁厚 t_wall (cm)', 20, 1, 10, 60, 0), ('p_t_bot', '底版厚 t_bot (cm)', 20, 1, 10, 60, 0), ('p_t_end', '末端壁厚 t_end (cm)', 20, 1, 10, 60, 0),
     ('p_H_pit', '集水井總高（含護欄）H_pit (cm)', 170, 5, 60, 500, 1), ('p_L_pit', '集水井底版長 L_pit (cm)', 100, 5, 40, 500, 1), ('p_L_neck', '集水井過渡段長 L_neck (cm)', 60, 5, 0, 300, 1), ('p_W_pit', '集水井內淨寬 W_pit (cm)', 160, 5, 40, 500, 1),
     ('p_k_step', '井內消能階位置比（×(L_pit−t)）', 0.375, 0.005, 0, 1, 1), ('p_H_curb', '塊狀護欄高 H_curb (cm)', 50, 5, 0, 200, 1), ('p_t_curb', '塊狀護欄厚 t_curb (cm)', 30, 1, 10, 100, 1),
     ('p_L_pav', '前後混凝土路面銜接長（圖示）(cm)', 300, 10, 0, 2000, 1), ('p_t_pav', '前後混凝土路面厚（圖示）(cm)', 20, 1, 5, 60, 1),
     ('p_L_grate_mm', 'TGB-60 單塊蓋長 (mm)', 995, 5, 300, 2000, 2), ('p_S_grate', '每組格柵配置長 (cm)', 100, 5, 30, 300, 2), ('p_w_cover', '格柵蓋重 (kg/組)', 72, 0.1, 0, 500, 2), ('p_w_frame', '格柵框重 (kg/組)', 14, 0.1, 0, 200, 2),
     ('p_fc', '混凝土強度 (kgf/cm²)', 210, 70, 140, 420, 3), ('p_rbk', '鋼筋估算量 (kg/m³，含損耗)', 26.67, 0.1, 0, 300, 3), ('p_b_ex', '開挖工作寬（每側）(cm)', 10, 5, 0, 200, 3)])

# ====== 攔石工（H 型鋼＋疏伐木） ======
tool(store='TCO_S', key='rockc', title='攔石工（H 型鋼＋疏伐木）', fn='rockc.html', defName='STD_NO1', qfn='calcBarrierSpec', modes="sheetMode = 'ALL';", sub=[
    ("const titlePrefix = q.sClear === 70 ? '#1攔石工立面圖' : '#2、#3攔石工立面圖';", "const titlePrefix = '攔石工立面圖';"),
    ("const v = new ViewBuilder(`#1攔石工${secType}剖面圖`);", "const v = new ViewBuilder(`攔石工${secType}剖面圖`);"),
    ("v.addText(W / 2, yPcBot + 125, `#1攔石工${secType}剖面圖`, 19, 'TEXT', 'center');", "v.addText(W / 2, yPcBot + 125, `攔石工${secType}剖面圖`, 19, 'TEXT', 'center');"),
    ("const endY1 = drawSingleTable(0, '#1攔石工每座數量表', q1);", "const endY1 = drawSingleTable(0, '攔石工每座數量表（依圖面幾何）', q1);"),
    ("const endY2 = drawSingleTable(endY1 + 42, '#2、#3攔石工每座數量表', q23);", "const endY2 = endY1;"),
    ("const vTim23 = buildTimberInstallDetailView(P, 100, '1.2', '#2、#3攔石工疏伐木設置詳圖');", "const vTim23 = buildTimberInstallDetailView(P, P.S_clear, ((P.S_clear + (P.L_log_add ?? 20)) / 100).toFixed(1), '攔石工疏伐木設置詳圖');"),
    ("const vTim1 = buildTimberInstallDetailView(P, 70, '0.9', '#1攔石工疏伐木設置詳圖');", ""),
    ("const pTim1 = placeViewWithOriginAt(vTim1, s2BaseX + 80, pTim23.maxY + 260);", "const pTim1 = pTim23;")],
  G=['1. 壩長與溢流段（左右分開）', '2. 混凝土基礎', '3. H 型鋼與 L 型角鐵', '4. 疏伐木', '5. 鋼筋（原圖計算式）'],
  R=[('p_L_wingL', '左翼水平段長 (cm)', 1035, 5, 0, 10000, 0), ('p_L_wingR', '右翼水平段長 (cm)', 1035, 5, 0, 10000, 0), ('p_L_slpL', '左斜坡過渡段水平長 (cm)', 100, 5, 0, 1000, 0), ('p_L_slpR', '右斜坡過渡段水平長 (cm)', 100, 5, 0, 1000, 0),
     ('p_L_mid', '中央溢流段水平長 (cm)', 730, 5, 100, 10000, 0), ('p_H_drop', '中央溢流段下切高差 (cm)', 100, 5, 0, 500, 0),
     ('p_W_base', '混凝土基礎寬 (cm)', 130, 5, 50, 500, 1), ('p_H_base', '混凝土基礎高 (cm)', 135, 5, 50, 500, 1), ('p_t_pc', '打底厚 (cm)', 5, 1, 0, 30, 1),
     ('p_S_clear', 'H型鋼柱間淨距 (cm)', 70, 5, 20, 300, 2), ('p_B_H', 'H型鋼寬 (cm)', 30, 1, 10, 60, 2), ('p_H_exp', 'H型鋼露明高 (cm)', 200, 10, 50, 600, 2), ('p_H_emb', 'H型鋼埋入基礎深 (cm)', 100, 5, 30, 300, 2),
     ('p_w_H', 'H型鋼單位重 (kg/m)', 93, 0.1, 10, 300, 2), ('p_L_ang_mm', 'L型角鐵長 (mm)', 250, 10, 50, 1000, 2), ('p_w_ang', 'L型角鐵單位重 (kg/m)', 9.59, 0.01, 1, 50, 2), ('p_n_ang', '每格角鐵支數', 4, 1, 0, 12, 2),
     ('p_H_log1', '一般格疏伐木堆疊高 (cm)', 80, 5, 0, 400, 3), ('p_H_log2', '斜坡轉折格堆疊高 (cm)', 120, 5, 0, 400, 3), ('p_H_log3', '兩端格堆疊高 (cm)', 60, 5, 0, 400, 3), ('p_D_log', '疏伐木計算徑 (cm)', 20, 1, 10, 50, 3),
     ('p_L_log_add', '疏伐木長＝淨距＋搭接 (cm)', 20, 1, 0, 100, 3), ('p_L_log_std', '原木基準長 (m)', 3.6, 0.1, 1, 12, 3),
     ('p_s_bar', '鋼筋間距 (cm)', 30, 5, 10, 60, 4), ('p_w16', '#16 單位重 (kg/m)', 1.56, 0.01, 0, 10, 4), ('p_w13', '#13 單位重 (kg/m)', 0.994, 0.001, 0, 10, 4)])

# ====== 透過性鋼格框潛壩 ======
tool(store='TCO_S', key='steel', title='透過性鋼格框潛壩', fn='steel.html', defName='STD_PARAMS', qfn='computeDamSpec', modes="viewMode = 'ALL';", sub=[
    ('const dxCribSlp = Math.round(p.H_crib * 0.3);', 'const dxCribSlp = Math.round(p.H_crib * (p.k_crib ?? 0.3));'),
    ('const xRefCenter = p.L_wL + L_mid_bot * 0.5 + 80;', 'const xRefCenter = p.L_wL + L_mid_bot * 0.5 + (p.dx_fnd ?? 80);')],
  G=['1. 溢流口、鋼格框與翼牆（左右分開）', '2. 高度（左右分開）', '3. 斷面寬度', '4. 下部基礎', '5. 型鋼與塊石'],
  R=[('p_L_wL', '左翼水平頂長 (cm)', 400, 10, 0, 10000, 0), ('p_L_wR', '右翼水平頂長 (cm)', 600, 10, 0, 10000, 0), ('p_L_slpL', '左溢流口斜坡水平寬 (cm)', 120, 5, 0, 2000, 0), ('p_L_slpR', '右溢流口斜坡水平寬 (cm)', 120, 5, 0, 2000, 0),
     ('p_L_cribL', '左鋼格框過水口淨寬 (cm)', 400, 10, 50, 3000, 0), ('p_L_cribR', '右鋼格框過水口淨寬 (cm)', 400, 10, 50, 3000, 0), ('p_W_pier', '中央混凝土隔墩寬 (cm)', 200, 10, 50, 1000, 0), ('p_k_crib', '格框開口側牆斜率 1:k', 0.3, 0.05, 0, 2, 0),
     ('p_H_crestL', '左翼冠部垂直高 (cm)', 50, 5, 0, 500, 1), ('p_H_crestR', '右翼冠部垂直高 (cm)', 50, 5, 0, 500, 1), ('p_H_upperL', '左上段溢流翼牆高 (cm)', 400, 10, 0, 2000, 1), ('p_H_upperR', '右上段溢流翼牆高 (cm)', 400, 10, 0, 2000, 1), ('p_H_crib', '透過性鋼格框段高 (cm)', 300, 10, 50, 2000, 1),
     ('p_B_top1', '壩頂冠寬 (cm)', 110, 5, 30, 1000, 2), ('p_B_top2', '冠部下 H_crest 處寬 (cm)', 120, 5, 30, 1000, 2), ('p_B_mid1', '鋼格框頂部總寬 (cm)', 200, 5, 50, 2000, 2), ('p_B_mid2', '鋼格框底部總寬 (cm)', 380, 5, 50, 2000, 2), ('p_c_emb', 'H型鋼往內埋距離 (cm)', 30, 1, 0, 100, 2),
     ('p_L_fndL', '下部基礎自基準往左長 (cm)', 750, 10, 0, 10000, 3), ('p_L_fndR', '下部基礎自基準往右長 (cm)', 750, 10, 0, 10000, 3), ('p_dx_fnd', '基礎基準距溢流中心右偏 (cm)', 80, 5, -2000, 2000, 3),
     ('p_H_f1', '下部基礎上段斜坡高 (cm)', 200, 10, 0, 1000, 3), ('p_H_f2', '下部基礎底層高 (cm)', 100, 10, 0, 1000, 3), ('p_B_toe', '基礎下游前趾階寬 (cm)', 50, 5, 0, 500, 3), ('p_B_fslp_D', '基礎上層下游外展寬 (cm)', 50, 5, 0, 500, 3), ('p_B_fnd_body', '基礎本體底寬 (cm)', 430, 10, 100, 3000, 3),
     ('p_N_beam', 'H型鋼總支數', 32, 1, 0, 500, 4), ('p_L_beam', 'H型鋼每支長 (m)', 6.0, 0.1, 1, 20, 4), ('p_L_emb', '型鋼兩側埋入長 (cm)', 100, 5, 0, 300, 4), ('p_w_beam', 'H200 單位重 (kg/m)', 49.9, 0.01, 1, 300, 4), ('p_a_paint', '單位塗刷面積 (m²/m)', 1.184, 0.001, 0, 10, 4),
     ('p_k_loss', '型鋼損耗率 (%)', 5, 0.5, 0, 30, 4), ('p_psi_stone', '填充塊石平均粒徑 (cm)', 45, 5, 10, 150, 4)])

# ====== 階梯式固床工 ======
tool(store='TCO_S', key='stepgs', title='階梯式固床工', fn='stepgs.html', defName='STD_PARAMS', qfn='computeDerivedQuantities', modes="sheetMode = 'ALL';", sub=[
    ("  outerPts.push([topWallX + p.t_top, yTop]); // (102, 390)", "  outerPts.push([topWallX + p.t_top, yTop]); if (yTop > p.H_back) outerPts.push([p.B_slp, p.H_back]);"),
    ("    const yPoolFloor = yTopLip - 100;", "    const yPoolFloor = yTopLip - (p.D_pool ?? 100);"),
    ("200 + 165", "200 + (p.W_swTop ?? 165)", 6),
    ("v.addDimH(200, -hTot, 365, -hTot, -40, `165`);", "v.addDimH(200, -hTot, 200 + (p.W_swTop ?? 165), -hTot, -40, `${p.W_swTop ?? 165}`);")],
  G=['1. 階梯本體', '2. 隔牆、側牆與連接榫', '3. A~F 式隔板（1/8 原則）', '4. 漿排塊石護坦（左右分開）', '5. 材料、模板與鋼筋（原圖無鋼筋表，kg/m³ 估算）'],
  R=[('p_N_tiers', '階梯層數', 3, 1, 2, 6, 0), ('p_W_base', '基礎底寬 W_base (cm)', 242, 1, 150, 600, 0), ('p_S_w', '每階踏步寬 S_w (cm)', 100, 5, 50, 300, 0), ('p_t_top', '頂部胸牆厚 (cm)', 35, 1, 20, 100, 0),
     ('p_H_s1', '第 1 階高 (cm)', 110, 5, 50, 300, 0), ('p_H_s2', '第 2 階高 (cm)', 80, 5, 40, 300, 0), ('p_H_s3', '第 3 階以上每階高 (cm)', 80, 5, 40, 300, 0), ('p_H_top', '頂部胸牆高 (cm)', 120, 5, 50, 300, 0),
     ('p_H_back', '既有固床工結合斜坡高 (cm)', 340, 5, 100, 1000, 0), ('p_B_slp', '既有固床工斜坡水平寬 (cm)', 102, 1, 0, 500, 0), ('p_D_pool', '靜水池深（隔牆缺口）(cm)', 100, 5, 30, 200, 0),
     ('p_N_bay', '橫向分格數', 4, 1, 3, 10, 1), ('p_L_net', '本體淨寬 L_net (cm)', 1200, 10, 300, 5000, 1), ('p_t_wall', '隔牆／側牆／隔板厚 (cm)', 30, 1, 15, 60, 1),
     ('p_H_sw1', '側牆下部高 (cm)', 250, 5, 50, 600, 1), ('p_H_sw2', '側牆上部高（3 層時）(cm)', 160, 5, 0, 600, 1), ('p_k_sw', '側牆下部外展斜率', 0.30, 0.01, 0, 1, 1), ('p_W_swTop', '側牆頂寬 (cm)', 165, 5, 30, 500, 1),
     ('p_N_key', '連接榫數', 6, 1, 0, 30, 1), ('p_key_a', '連接榫長邊 (cm)', 115, 1, 0, 300, 1), ('p_key_b', '連接榫中邊 (cm)', 80, 1, 0, 300, 1), ('p_key_c', '連接榫短邊 (cm)', 50, 1, 0, 300, 1),
     ('p_key_h', '連接榫梯形高 (cm)', 50, 1, 0, 200, 1), ('p_key_t', '連接榫頂部厚 (cm)', 20, 1, 0, 100, 1), ('p_key_w', '連接榫寬（每處）(cm)', 100, 5, 0, 300, 1), ('p_key_f', '連接榫端面模板高 (cm)', 70, 1, 0, 200, 1),
     ('p_slope_inv', '隔板頂斜率 1/n', 8, 1, 2, 20, 2), ('p_w_baf', 'A~C 隔板寬 (cm)', 70, 1, 20, 200, 2), ('p_h_bA', 'A／D 隔板高 (cm)', 100, 5, 20, 300, 2), ('p_h_bB', 'B／E 隔板高 (cm)', 80, 5, 20, 300, 2), ('p_h_bC', 'C／F 隔板高 (cm)', 60, 5, 20, 300, 2),
     ('p_w_bafB', 'D~F 隔板底寬 (cm)', 58, 1, 20, 200, 2), ('p_k_notch', 'D~F 隔板頂寬增量（×高）', 0.30, 0.01, 0, 1, 2), ('p_dh_D', 'D 隔板高差 (cm，1/8 時)', 13, 1, 0, 50, 2), ('p_dh_E', 'E 隔板高差 (cm)', 12, 1, 0, 50, 2), ('p_dh_F', 'F 隔板高差 (cm)', 11, 1, 0, 50, 2),
     ('p_W_stL_up', '左岸護坦上游寬 (cm)', 300, 10, 0, 2000, 3), ('p_W_stL', '左岸護坦下游寬 (cm)', 330, 10, 0, 2000, 3), ('p_W_stR_up', '右岸護坦上游寬 (cm)', 300, 10, 0, 2000, 3), ('p_W_stR', '右岸護坦下游寬 (cm)', 260, 10, 0, 2000, 3),
     ('p_L_apron', '護坦縱向總長 (cm)', 544, 10, 0, 3000, 3), ('p_k_apL', '左岸護坦斜面長度係數', 1.0806, 0.0001, 1, 2, 3), ('p_k_apR', '右岸護坦斜面長度係數', 1.0823, 0.0001, 1, 2, 3), ('p_psi_stone', '塊石平均粒徑 (cm)', 90, 5, 30, 150, 3), ('p_t_pc', '漿排塊石底層混凝土厚 (cm)', 50, 5, 0, 100, 3),
     ('p_fc', '混凝土強度 (kgf/cm²)', 280, 70, 140, 420, 4), ('p_f_art1', '造型模板階梯面高 1（3 層時）(cm)', 150, 5, 0, 500, 4), ('p_f_art2', '造型模板階梯面高 2（3 層時）(cm)', 125, 5, 0, 500, 4),
     ('p_rbk', '鋼筋估算量 (kg/m³)', 29.55, 0.01, 0, 300, 4), ('p_s_bar', '鋼筋／植筋間距 (cm)', 30, 5, 10, 60, 4), ('p_n_dowel', '每斷面植筋支數', 16, 1, 0, 60, 4)])

# ====== 植生塊（RC 箱）護岸（分層疊砌） ======
def build_rcbox():
    s = main_script('rcbox.html')
    s = subs(s, [("if (document.readyState === 'loading') {\n  document.addEventListener('DOMContentLoaded', initCADApp);\n} else {\n  initCADApp();\n}", ''),
                 ('const xCurbTopR = xCurbBotR - 9;', 'const xCurbTopR = xCurbBotR - (p.dx_curb ?? 9);'),
                 ('  const pcThick = 5;\n  const pcExt = 4;', '  const pcThick = p.pc_t ?? 5;\n  const pcExt = p.pc_ext ?? 4;')], 'rcbox')
    s = rename_fn(s, 'computeDerived', '__origQ')
    s += '\n' + rd('rcbox_q.js') + '\n'
    tail = "\n  ;return { scene(PP) { const p = Object.assign({}, DEFAULT_PARAMS, PP); return buildFullScene(p, computeDerived(p)).entities; }, LC: LAYER_COLORS, D0: DEFAULT_PARAMS };\n"
    return s, tail
tool(store='TCO_T', key='rcbox', title='植生塊（RC 箱）護岸', engine='custom', build=build_rcbox,
  G=['1. 植生塊（RC 箱）疊砌', '2. 單一植生塊尺寸', '3. 下部 L 型懸臂基礎', '4. 鋼筋（原圖鋼筋表）與附屬'],
  R=[('p_N_layer', '疊砌層數', 4, 1, 1, 10, 0), ('p_W_step', '每層退縮寬 (cm)', 30, 1, 0, 100, 0), ('p_tiltDeg', '植生塊後傾角 (°)', 5.7, 0.1, 0, 20, 0), ('p_N_col', '平面圖示列數', 4, 1, 1, 20, 0),
     ('p_B_box', '植生塊長（沿護岸）B (cm)', 120, 5, 60, 300, 1), ('p_gap_box', '植生塊計算長扣除（接縫）(cm)', 10, 1, 0, 30, 1), ('p_W_box', '植生塊寬 W (cm)', 90, 5, 40, 200, 1), ('p_H_box', '植生塊高 H (cm)', 60, 5, 30, 150, 1),
     ('p_t_wall_L', '長向壁厚 (cm)', 20, 1, 8, 40, 1), ('p_t_wall_W', '寬向壁厚 (cm)', 15, 1, 8, 40, 1), ('p_c_in', '內角導角 (cm)', 10, 1, 0, 30, 1),
     ('p_W_stem_bot', '基礎主柱寬 (cm)', 75, 5, 30, 300, 2), ('p_H_fnd_sub', '基礎深（河床以下）(cm)', 150, 5, 50, 400, 2), ('p_H_lower_stem', '懸臂下主柱高 (cm)', 95, 5, 0, 300, 2), ('p_H_ledge', '懸臂承托台厚 (cm)', 50.5, 0.5, 10, 200, 2),
     ('p_W_ledge', '懸臂承托台寬 (cm)', 90, 5, 0, 300, 2), ('p_W_toe_berm', '前趾平台寬 (cm)', 30, 1, 0, 100, 2), ('p_H_curb', '擋坎高 (cm)', 30, 1, 0, 100, 2), ('p_W_curb_top', '擋坎頂寬 (cm)', 36, 1, 10, 100, 2), ('p_dx_curb', '擋坎前面斜退 (cm)', 9, 1, 0, 50, 2),
     ('p_pc_t', 'PC 打底厚 (cm)', 5, 1, 0, 20, 2), ('p_pc_ext', 'PC 打底每側外伸 (cm)', 4, 1, 0, 30, 2), ('p_rbk_fnd', '基礎鋼筋估算量 (kg/m³)', 40, 1, 0, 200, 2),
     ('opt', 'p_d_rebar', '植生塊鋼筋號數 D', '10', ['10', '13', '16'], 3), ('p_w10', 'D10 單位重 (kg/m)', 0.559, 0.001, 0, 5, 3), ('p_w13', 'D13 單位重 (kg/m)', 0.995, 0.001, 0, 5, 3), ('p_w16', 'D16 單位重 (kg/m)', 1.56, 0.001, 0, 5, 3),
     ('p_rb_l1', '①ㄇ型筋長（標準尺寸）(m)', 0.5, 0.01, 0, 5, 3), ('p_rb_n1', '①支數', 14, 1, 0, 60, 3), ('p_rb_l2', '②環箍長 (m)', 3.5, 0.01, 0, 10, 3), ('p_rb_n2', '②支數', 5, 1, 0, 60, 3),
     ('p_rb_l3', '③ㄇ型筋長 (m)', 0.5, 0.01, 0, 5, 3), ('p_rb_n3', '③支數', 8, 1, 0, 60, 3), ('p_rb_l4', '④斜筋長 (m)', 1.0, 0.01, 0, 5, 3), ('p_rb_n4', '④支數', 2, 1, 0, 20, 3), ('p_rb_l5', '⑤斜筋長 (m)', 0.9, 0.01, 0, 5, 3), ('p_rb_n5', '⑤支數', 2, 1, 0, 20, 3),
     ('p_n_bolt', '每塊 M22 螺桿組數', 2, 1, 0, 10, 3), ('p_n_bag', '太空包（每公尺）', 6, 1, 0, 30, 3)])

# ====== RC 護岸開口式動物通道 ======
def build_anim():
    s = main_script('anim.html').strip()
    assert s.startswith('(function() {') and s.endswith('})();')
    s = s[len('(function() {'):-len('})();')]
    s = subs(s, [('  "use strict";', ''),
                 ('  if (document.readyState === "loading") {\n    document.addEventListener("DOMContentLoaded", init);\n  } else {\n    init();\n  }', ''),
                 ('    const revBaseW = d.L_rev_slope + p.L_crest + 15;', '    const revBaseW = d.L_rev_slope + p.L_crest + (p.b_ext ?? 15);'),
                 ('      [sx0 + 38, yBaseTop]', '      [sx0 + (p.x_bk ?? 38), yBaseTop]'),
                 ('`基準 2.98 * ((${d.T_wall_bot}*${d.H_wall_total})/(40*170)) * ((${p.L_ramp}+${p.L_crest})/160)`', '`側視面積×厚 ${d.T_wall_top ?? p.T_wall_top}→${d.T_wall_bot} cm×2 側（依圖面幾何積分）`'),
                 ('`基準 17.39 * (${d.H_wall_total}/170) * ((${p.L_ramp}+${p.L_crest})/160)`', '`2 側×(外側＋內斜面) 側視面積（依圖面幾何）`'),
                 ('`基準 0.58 * (總寬 ${d.W_total}/140) * (高度 ${d.H_wall_total}/170)`', '`護岸斷面積 × 缺口寬 ${d.W_total} cm（依圖面幾何）`')], 'anim')
    s = rename_fn(s, 'computeDerived', '__origQ')
    s += '\n' + rd('anim_q.js') + '\n'
    tail = "\n  ;return { draw(PP) { cadEntities = []; buildAllViews(Object.assign({}, ORIG_PARAMS, PP), null); return cadEntities; }, LC: LAYERS, D0: ORIG_PARAMS };\n"
    return s, tail
tool(store='TCO_B', key='anim', title='RC 護岸開口式動物通道', engine='custom', build=build_anim,
  G=['1. 通道與側牆', '2. 高度（隨護岸）', '3. 土包袋', '4. 鋼筋（原圖鋼筋表）與缺口扣除'],
  R=[('p_W_ch', '通道淨寬 (cm)', 60, 5, 30, 300, 0), ('p_T_wall_top', '側牆頂厚 (cm)', 30, 1, 15, 80, 0), ('p_T_wall_in', '側牆內斜增厚 (cm)', 10, 1, 0, 50, 0), ('p_L_crest', '護岸頂後段長 (cm)', 30, 1, 0, 200, 0),
     ('p_L_ramp', '坡道段水平長 (cm)', 130, 5, 30, 1000, 0), ('p_L_chamfer', '平面側牆斜角段 (cm)', 9, 1, 0, 50, 0), ('p_b_ext', '護岸基礎背面外伸 (cm)', 15, 1, 0, 100, 0), ('p_x_bk', '既有護岸背面趾距 (cm)', 38, 1, 0, 300, 0),
     ('p_H_base', '護岸基礎高 (cm)', 120, 5, 30, 400, 1), ('p_H_slope', '護岸斜面高 (cm)', 140, 5, 30, 1000, 1), ('p_H_top', '胸牆／側牆頂高 (cm)', 30, 5, 0, 200, 1), ('p_L_base_exp', '護岸斜面水平投影扣斜角段 (cm)', 42, 1, 0, 500, 1),
     ('p_H_bag', '土包袋厚 (cm)', 12, 1, 5, 40, 2), ('p_W_bag', '土包袋寬 (cm)', 30, 1, 10, 100, 2), ('p_k_bag', '土包袋排距係數（×袋寬）', 0.72, 0.01, 0.3, 1.5, 2), ('p_L_top_bag', '上段全寬土包袋長 (cm)', 45, 5, 0, 300, 2), ('p_S_ch', '平面標示坡度 1:', 1.5, 0.1, 0.5, 5, 2),
     ('p_d_bar', '鋼筋號數 D', 19, 1, 10, 32, 3), ('p_uw', '鋼筋單位重 (kg/m)', 2.25, 0.01, 0.5, 7, 3), ('p_S_rebar', '鋼筋間距 (cm)', 30, 5, 10, 60, 3), ('p_L_lap', '搭接長 (cm)', 20, 1, 0, 100, 3), ('p_c_r1', '①號筋扣除長 (cm)', 10, 1, 0, 50, 3), ('p_c_r2', '②號筋扣除長 (cm)', 20, 1, 0, 50, 3),
     ('p_L_dowel_in', '植筋植入深 (cm)', 50, 5, 10, 100, 3), ('p_L_dowel_out', '植筋外露長 (cm)', 30, 5, 10, 100, 3), ('p_rbk_ded', '缺口扣除鋼筋估算量 (kg/m³)', 42.41, 0.01, 0, 200, 3)])

if __name__ == '__main__':
    out = ['/* v8.7 八種原工具移植（gen_st87.py 自動產生，勿手改；改 st87src/*.js 或 gen_st87.py 後重跑） */',
           'var TCO_D = window.TCO_D || (window.TCO_D = {}); var TCO_T = window.TCO_T || (window.TCO_T = {}); var TCO_B = window.TCO_B || (window.TCO_B = {});',
           rd('g87_common.js')]
    for T in TOOLS:
        if T.get('engine', 'vb') == 'vb':
            s, tail = vb_tool(T['key'], T['fn'], T['defName'], T['qfn'], T['modes'], T.get('sub'))
        else:
            s, tail = T['build']()
        G, PR = T.get('G', []), pr_list(T.get('R', []))
        if T['store'] == 'TCO_S': assert G and PR, T['key']
        out.append(wrap(T['store'], T['key'], T['title'], s, tail, G, PR, rd(T['key'] + '_host.js')))
    open(os.path.join(D, 'ormodG.js'), 'w', encoding='utf8').write('\n'.join(out))
    print('ok', sum(len(x) for x in out))
