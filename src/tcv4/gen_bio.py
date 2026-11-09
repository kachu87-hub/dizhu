# v6.3 生物通道（9e42c77d）標準圖 → TCO_B.bio.run(g)：參數由本系統通道幾何（護岸高、坡比、護岸面坡）帶入
import re
ATT = '/mnt/user-data/attachments/99069836-f851-593c-92ab-abb13bf9a61c/'
h = open(ATT + '9e42c77d-___________.html', encoding='utf8').read()
script = h[h.rindex('<script>') + 8:h.rindex('</script>')]
for o, n in [('let showGhost = true;', 'let showGhost = false;'), ('const channelInnerBotW = 82 * s;', 'const channelInnerBotW = p.cb * s;'), ('const rightTopW = 24 * s;', 'const rightTopW = p.rt * s;')]:
    assert o in script, o; script = script.replace(o, n)
JS = r"""
  const PAL = getPalette();
  function run(G) {   // G：{ name, H_total, H_base, W_ramp, t_wall, L_ramp, L_land, m_side, h_exp, cb, rt, conc, form, A, Hn, nf }
    O = []; const p = Object.assign({}, G); p.H_net = G.Hn; p.L_total = 2 * p.t_wall + p.L_ramp + p.L_land; p.W_horiz_shift = +(p.H_net * p.m_side).toFixed(1);
    p.L_plan_diag = +p.L_ramp.toFixed(1); p.slopeRatioStr = `1:${+(p.L_ramp / p.H_net).toFixed(2)}`; p.sideSlopeStr = `1:${p.m_side}`; p.title_tag = String(G.name || '').replace(/生物通道/g, ''); p.N_units = 1;
    const Wm = p.W_ramp / 100, Hm = p.H_net / 100;
    p.concFormulaStr = `${(G.A / 1e4).toFixed(3)}*${Wm}`; p.concValStr = G.conc.toFixed(3); p.formFormulaStr = `${Wm}*${Hm.toFixed(2)}*${G.nf}`; p.formValStr = G.form.toFixed(2); p.concValNum = G.conc; p.formValNum = G.form;
    const cx = 420, bS = drawSideView(CTX, cx, 12, p, PAL), bF = drawFrontView(CTX, cx, bS.bottomY + 18, p, PAL), bP = drawPlanViewAndTable(CTX, cx, bF.bottomY + 14, p, PAL);
    const N = [`坡道混凝土斷面＝(2×端牆 ${p.t_wall}＋坡長 ${p.L_ramp.toFixed(0)})/2×淨高 ${p.H_net.toFixed(0)}＝${(G.A / 1e4).toFixed(3)} m²（正視圖坡道多邊形）`,
      `淨高＝護岸高 ${(p.H_net + p.h_exp).toFixed(0)}−基礎外露 ${p.h_exp}；坡長＝${p.slopeRatioStr.replace('1:', '')}×淨高；坡面斜長 ${Math.hypot(p.L_ramp, p.H_net).toFixed(1)}；平面坡道斜長 ${Math.hypot(p.L_ramp, p.W_horiz_shift).toFixed(1)}`,
      `軀體模板＝兩端牆內外 ${G.nf} 面×坡道寬×淨高；側視圖右側渠道寬 ${p.cb}、牆頂 ${p.rt} 為示意`];
    N.forEach((s, i) => cadText(CTX, '・' + s, cx - 300, bP.bottomY + 18 + i * 18, 11.5, '#fde047', 'left', '600', 0, 'NOTE'));
    const sc = 1 / 0.85; return O.map(o => { const r = Object.assign({}, o); if (r.p) r.p = r.p.map(([x, y]) => [x * sc, y * sc]); if (r.x !== undefined) { r.x *= sc; r.y *= sc; } if (r.r) r.r *= sc; if (r.h) r.h *= sc; return r; });
  }
"""
SHIM = open('/home/claude/tcv4/gen_n1.py', encoding='utf8').read().split('SHIM = r"""')[1].split('"""')[0]
out = f"""/* v6.3 生物通道標準圖（使用者原工具 9e42c77d 自動抽出；gen_bio.py，勿手改） */
var TCO_B = window.TCO_B || (window.TCO_B = {{}});
TCO_B['bio'] = (function () {{
  let O = [];
  const EL = {{}}, CTX = new Proxy({{}}, {{ get: (t, k) => (k in t ? t[k] : () => ({{ width: 0 }})), set: (t, k, v) => {{ t[k] = v; return true; }} }});
  const el = id => EL[id] || (EL[id] = {{ value: '', textContent: '', innerHTML: '', className: '', style: {{}}, classList: {{ add() {{}}, remove() {{}} }}, addEventListener() {{}} }});
  const document = {{ getElementById: el, querySelectorAll: () => [], querySelector: () => null, createElement: () => ({{ click() {{}}, style: {{}} }}), body: {{ appendChild() {{}}, removeChild() {{}} }} }};
  const window = {{ addEventListener() {{}}, devicePixelRatio: 1 }};
{script}
{JS}
{SHIM}
  return {{ run }};
}})();
"""
open('/home/claude/tcv4/ormod9.js', 'w', encoding='utf8').write(out); print('ormod9.js', len(out))
