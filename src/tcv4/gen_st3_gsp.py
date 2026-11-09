# v8.0 固床工＋80φ基樁（orig_st3/gs.html）→ TCO_S['gsp']；由 gen_st3.py 呼叫
import os

GSP_TAIL = r'''
  ;return { draw(P) { __P = P; currentMode = 'ALL'; rebuildScene(); return cadEntities; }, params(P) { __P = P; return getParams(); }, comp(P) { __P = P; const p = getParams(); return { p, q: calcQuantities(p), piles: getPilePositions(p), sec: __gsSec(p), Y: __gsY(p), plan: __gsPlan(p), crest: __gsCrest(p), top: X => __gsTop(p, X), bot: X => __gsBot(p, X) }; } };
'''

PLAN_NEW = r'''  // v8.0 平面外框依幾何（最大斷面依正視頂緣、底緣裁切後的上下游範圍）
  const S8 = __gsSec(p);
  r.poly(__gsPlan(p), true, '#ffffff', 2.0);
  r.line(0, S8.xTopR, L, S8.xTopR, '#e2e8f0', 1.4);
  r.poly(__gsCrest(p), false, '#e2e8f0', 1.4);
  const wN = S8.xTopR - (S8.xMidL - p.H_notch * p.m_mid);
  r.text(-70, S8.xTopR - p.B_top / 2, String(p.B_top), 58, '#f8fafc', 'center', Math.PI / 2);
  r.text(x1 - 60, S8.xTopR - p.B_weir / 2, String(Math.round(p.B_weir)), 58, '#f8fafc', 'center', Math.PI / 2);
  r.text(x2 - 60, S8.xTopR - p.B_mid / 2, String(Math.round(p.B_mid)), 58, '#f8fafc', 'center', Math.PI / 2);
  r.text(xC - 60, S8.xTopR - wN / 2, String(Math.round(wN)), 58, '#f8fafc', 'center', Math.PI / 2);
  r.text(x3 + 60, S8.xTopR - p.B_mid / 2, String(Math.round(p.B_mid)), 58, '#f8fafc', 'center', Math.PI / 2);
  r.text(x4 + 60, S8.xTopR - p.B_weir / 2, String(Math.round(p.B_weir)), 58, '#f8fafc', 'center', Math.PI / 2);
  r.text(L + 160, S8.xTopR - p.B_top / 2, String(p.B_top), 58, '#f8fafc', 'center', Math.PI / 2);
'''

def build_gsp(main_script, replace_fn, subs, pr_list, SRC):
    s = main_script('gs.html')
    s = replace_fn(s, 'calcQuantities', '')
    s = replace_fn(s, 'getParams', open(os.path.join(SRC, 'gsp_q.js'), encoding='utf8').read())
    # 原 getPilePositions（寫死 22 個座標）移除；新版在 gsp_q.js
    i = s.index('function getPilePositions(p) {\n  const xCenter = p.W_wing_L + p.W_slope_L + p.W_weir / 2;\n  const piles = [];')
    j = s.index('function buildSillPlan')
    s = s[:i] + s[j:]
    a = s.index('  // Outer plan polygon with tapered ends'); b = s.index("  r.dimV(L, 0, L, B, L + 340, String(p.B_base), 68);")
    s = s[:a] + PLAN_NEW + s[b:]
    S = [
        ("r.text(xC + 3265, B + 790, '打設位置固床工(0K+013~093)', 58, '#f8fafc', 'left');", "r.text(xC + 3265, B + 790, '基樁打設位置', 58, '#f8fafc', 'left');"),
        ("  r.text(p.L_ret_L * 0.5, y0 + 85, '510 |235|255', 52, '#cbd5e1');\n", ''),
        ("  r.text(L - p.L_ret_R * 0.5, y0 + 85, '204|188| 408', 52, '#cbd5e1');\n", ''),
        ('const xKeyTopR = (p.B_key + p.H_key * 0.3) * sc;', 'const xKeyTopR = (p.B_key + p.H_key * p.m_key) * sc;'),
        ('const xMidL = xApronL + (p.H_mid + p.H_notch) * 0.3 * sc;', 'const xMidL = xApronL + (p.H_mid + p.H_notch) * p.m_mid * sc;'),
        ('const xWeirL = xMidL + p.H_upper * 0.1 * sc;', 'const xWeirL = xMidL + p.H_upper * p.m_up * sc;'),
        ('const xTopL = xWeirL + p.H_wing_drop * 0.1 * sc;', 'const xTopL = xWeirL + p.H_wing_drop * p.m_up * sc;'),
        ('r.line(xMidL - p.H_notch * 0.3 * sc, y3, xTopR, y3,', 'r.line(xMidL - p.H_notch * p.m_mid * sc, y3, xTopR, y3,'),
        ('String(p.B_base - 140)', 'String(Math.round(p.B_base - p.B_key - p.H_key * p.m_key))'),
        ("r.text(xWeirL - 70, (y4 + y5) / 2, '1:0.1',", "r.text(xWeirL - 70, (y4 + y5) / 2, `1:${p.m_up}`,"),
        ("r.text(xApronL - 60, (y2 + y3) / 2, '1:0.3',", "r.text(xApronL - 60, (y2 + y3) / 2, `1:${p.m_mid}`,"),
        ("r.text((xTopR + xBack) / 2 + 55, (y2 + y3) / 2, '1:0.5',", "r.text((xTopR + xBack) / 2 + 55, (y2 + y3) / 2, `1:${((xBack - xTopR) / sc / p.H_mid).toFixed(2)}`,"),
        ("r.text(xKeyTopR + 55, (y0 + y1) / 2, '1:0.3',", "r.text(xKeyTopR + 55, (y0 + y1) / 2, `1:${p.m_key}`,"),
        ("r.text(ox + xMidL - 90, (y4 + y5) / 2, '1:0.1',", "r.text(ox + xMidL - 90, (y4 + y5) / 2, `1:${p.m_up}`,"),
        ("r.text(ox + xApronL / 2 - 70, (y1 + y2) / 2, '1:0.3',", "r.text(ox + xApronL / 2 - 70, (y1 + y2) / 2, `1:${((p.B_base - p.B_apron) / p.H_lower).toFixed(2)}`,"),
        ("r.text(ox + (xTopR + xBack) / 2 + 70, (y2 + y3) / 2, '1:0.5',", "r.text(ox + (xTopR + xBack) / 2 + 70, (y2 + y3) / 2, `1:${((xBack - xTopR) / sc / p.H_mid).toFixed(2)}`,"),
        ("['鋼筋(含損耗)', 'kg', q.sillRebar.toFixed(2)]", "['鋼筋(估算)', 'kg', q.sillRebar.toFixed(2)]"),
        ("r.text(tx, ny - 410, '4. 基樁打設位置可依現地微幅調整，總數量不變。', 52, '#e2e8f0', 'left');",
         "r.text(tx, ny - 410, '4. 基樁打設位置可依現地微幅調整，總數量不變。', 52, '#e2e8f0', 'left');\n  r.text(tx, ny - 510, `5. 固床工鋼筋：原圖無鋼筋表，以 ${p.rbk} kg/m³ 估算；混凝土已扣除基樁錨入段 ${q.Vemb.toFixed(2)} m³。`, 52, '#f59e0b', 'left');"),
        ('`③ 16φ@100`', '`③ 16φ@${p.s_h3}`'), ('`② 16φ@15`', '`② 16φ@${p.s_h2}`'),
        ("'② 16φ@15'", '`② 16φ@${p.s_h2}`'), ("'③ 16φ@100'", '`③ 16φ@${p.s_h3}`'),
        ("'基樁配置詳圖(0K+040-066)'", "'基樁配置詳圖（密排區）'"), ("'基樁配置詳圖(0K+013-040)、(0K+066-093)'", "'基樁配置詳圖（一般區）'"),
        ("['①', '32φ', '6.390',", "['①', '32φ', p.w32.toFixed(3),"), ("['②', '16φ', '1.560',", "['②', '16φ', p.w16.toFixed(3),"), ("['③', '16φ', '1.560',", "['③', '16φ', p.w16.toFixed(3),"),
        ('× 1.08 =', '× ${p.k16} ='), ('× 1.10 =', '× ${p.k32} ='),
        ("'R=31.2'", '`R=${((p.D_pile - p.d_h2) / 2).toFixed(1)}`'), ("'R=24.8'", '`R=${((p.D_pile - p.d_h3) / 2).toFixed(1)}`'),
        ("'② (搭接77)'", '`② (搭接${p.lap2})`'), ("'③ (搭接30)'", '`③ (搭接${p.lap3})`'),
    ]
    s = subs(s, S)
    G = ['1. 正視橫向尺寸（左右分開，以溢流口中心為界）', '2. 高度', '3. 側視斷面（寬度與坡度）', '4. 基樁與樁位', '5. 基樁配筋（依配筋逐支計算）', '6. 固床工鋼筋（原圖無鋼筋表，kg/m³ 估算）']
    R = [
        ('p_W_wing_L', '左翼牆頂水平段 (cm)', 2200, 10, 0, 20000, 0), ('p_W_slope_L', '左斜坡翼牆水平 (cm)', 500, 10, 0, 5000, 0), ('p_W_weir', '中央溢流口總寬 (cm)', 7000, 10, 100, 50000, 0),
        ('p_W_slope_R', '右斜坡翼牆水平 (cm)', 500, 10, 0, 5000, 0), ('p_W_wing_R', '右翼牆頂水平段 (cm)', 1300, 10, 0, 20000, 0),
        ('p_L_ret_L', '左岸基礎斜退長 (cm)', 1000, 10, 0, 10000, 0), ('p_L_ret_R', '右岸基礎斜退長 (cm)', 800, 10, 0, 10000, 0),
        ('p_H_wing_drop', '翼牆頂高差 (cm)', 150, 10, 0, 1000, 1), ('p_H_upper', '上段翼牆高 (cm)', 500, 10, 0, 2000, 1), ('p_H_mid', '中段（護坦頂至溢流口）(cm)', 180, 10, 10, 1000, 1),
        ('p_H_notch', '中央低水深槽差 (cm)', 50, 5, 0, 300, 1), ('p_H_lower', '下段基礎版厚 (cm)', 250, 10, 30, 1000, 1), ('p_H_key', '止滑齒深 (cm)', 200, 10, 0, 1000, 1),
        ('p_B_top', '翼牆最高頂寬 (cm)', 95, 5, 30, 500, 2), ('p_m_up', '下游面上段坡 1:m', 0.1, 0.05, 0, 2, 2), ('p_m_mid', '下游面中段坡 1:m', 0.3, 0.05, 0, 2, 2),
        ('p_B_apron', '基礎頂面寬 (cm)', 304, 2, 50, 2000, 2), ('p_B_base', '固床工總底寬 (cm)', 544, 2, 100, 3000, 2), ('p_B_key', '止滑齒底寬 (cm)', 80, 5, 20, 500, 2), ('p_m_key', '止滑齒坡 1:m', 0.3, 0.05, 0, 2, 2),
        ('p_D_pile', '基樁直徑 (cm)', 80, 5, 30, 300, 3), ('p_L_pile', '基樁總長 (cm)', 1200, 50, 200, 6000, 3), ('p_L_embed', '錨入固床工長 (cm)', 100, 10, 0, 500, 3),
        ('p_Dy_pile', '前後排距 (cm)', 180, 10, 0, 1000, 3), ('p_Dy_edge', '上游排距上游緣 (cm)', 170, 10, 30, 1000, 3),
        ('opt', 'p_pmode', '樁位', 'LIST', [['LIST', '依樁位清單（預設＝原圖 22 支）'], ['AUTO', '依樁距自動排樁']], 3),
        ('p_S_dense', '密排區每排樁距 (cm)', 500, 10, 100, 5000, 3), ('p_S_sparse', '一般區每排樁距 (cm)', 1000, 10, 100, 10000, 3),
        ('p_xd0', '自動：密排區左端（距中心，cm）', -750, 10, -50000, 50000, 3), ('p_xd1', '自動：密排區右端（距中心，cm）', 1750, 10, -50000, 50000, 3),
        ('p_xs0', '自動：排樁左界（距中心，cm）', -3750, 10, -50000, 50000, 3), ('p_xs1', '自動：排樁右界（距中心，cm）', 4750, 10, -50000, 50000, 3),
        ('p_N_main', '主筋支數（32φ）', 14, 1, 4, 60, 4), ('p_c_main', '主筋長扣除 (cm)', 20, 1, 0, 200, 4), ('p_w32', '32φ 單位重 (kg/m)', 6.39, 0.01, 1, 20, 4), ('p_w16', '16φ 單位重 (kg/m)', 1.56, 0.01, 0.5, 5, 4),
        ('p_s_h2', '② 箍筋間距 (cm)', 15, 1, 5, 100, 4), ('p_d_h2', '② 箍筋直徑扣除 (cm)', 17.6, 0.1, 0, 60, 4), ('p_lap2', '② 箍筋搭接 (cm)', 77, 1, 0, 200, 4),
        ('p_s_h3', '③ 加勁筋間距 (cm)', 100, 5, 20, 500, 4), ('p_d_h3', '③ 加勁筋直徑扣除 (cm)', 30.4, 0.1, 0, 80, 4), ('p_lap3', '③ 加勁筋搭接 (cm)', 30, 1, 0, 200, 4),
        ('p_k16', '16φ 損耗係數', 1.08, 0.01, 1, 1.5, 4), ('p_k32', '32φ 損耗係數', 1.10, 0.01, 1, 1.5, 4),
        ('p_rbk', '固床工鋼筋估算量 (kg/m³，含損耗)', 2.98, 0.01, 0, 300, 5),
    ]
    return s, G, pr_list(R)
