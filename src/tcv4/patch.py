import re,sys
src=open('/home/claude/profile-cross-section/index.html',encoding='utf8').read()
ORM_SUBS = {
 'ormod.js': [("const area_top_fill = w_tf_m * 0.35 * 0.5;", "const area_top_fill = w_tf_m * (getNum('inp_h_top_fill', 35) / 100) * 0.5;"),
              ("${w_tf_m.toFixed(2)}*0.35*0.5", "${w_tf_m.toFixed(2)}*${(getNum('inp_h_top_fill', 35) / 100).toFixed(2)}*0.5"),
              ("inp_w_top_fill: R.wtf,", "inp_w_top_fill: R.wtf, inp_h_top_fill: R.htf,")],
 'ormod2.js': [("const area_front_emb = 0.5 * D_emb_m * D_emb_m * 0.45;", "const area_front_emb = 0.5 * D_emb_m * D_emb_m * getNum('inp_m_toe', 0.45);"),
               ("+ t_grav_bot + 30) / 100.0;", "+ t_grav_bot + getNum('inp_lap', 30)) / 100.0;"),
               ("const single_weep_len_m = (w_stone_h + w_mid_h + 15) / 100.0;", "const single_weep_len_m = (w_stone_h + w_mid_h + getNum('inp_weep_x', 15)) / 100.0;")],
 'ormod4.js': [("const stepH = 74.0;", "const stepH = getNum('inp_rc_hs', 148) * 0.5;"), ("const boxThick = 42.0;", "const boxThick = getNum('inp_rc_t', 84) * 0.5;"),
               ("formula: `2岸 * (${(rc_B/100).toFixed(2)} * 1.50) * ${Lm.toFixed(1)}m`,", "formula: `2岸 * (${(rc_B/100).toFixed(2)} * ${(getNum('inp_pe_d', 150) / 100).toFixed(2)}) * ${Lm.toFixed(1)}m`,"),
               ("perM: 2 * (rc_B / 100.0) * 1.5,", "perM: 2 * (rc_B / 100.0) * getNum('inp_pe_d', 150) / 100,"), ("total: 2 * (rc_B / 100.0) * 1.5 * Lm,", "total: 2 * (rc_B / 100.0) * getNum('inp_pe_d', 150) / 100 * Lm,")],
}
def rdm(name):
    t = open('/home/claude/tcv4/' + name, encoding='utf8').read()
    for a, b in ORM_SUBS.get(name, []):
        assert a in t, (name, a); t = t.replace(a, b)
    return t
mod=open('/home/claude/tcv4/stmod.js',encoding='utf8').read()+'\n'+open('/home/claude/tcv4/clmod.js',encoding='utf8').read()+'\n'+open('/home/claude/tcv4/rvmod.js',encoding='utf8').read()+'\n'+rdm('ormod.js')+'\n'+open('/home/claude/tcv4/tymod.js',encoding='utf8').read()+'\n'+rdm('ormod2.js')+'\n'+rdm('ormod4.js')+'\n'+open('/home/claude/tcv4/tymod2.js',encoding='utf8').read()+'\n'+open('/home/claude/tcv4/ormod5.js',encoding='utf8').read()+'\n'+open('/home/claude/tcv4/ormod6.js',encoding='utf8').read()+'\n'+open('/home/claude/tcv4/tymod3.js',encoding='utf8').read()+'\n'+open('/home/claude/tcv4/ormodE.js',encoding='utf8').read()+'\n'+open('/home/claude/tcv4/tymodE.js',encoding='utf8').read()+'\n'+open('/home/claude/tcv4/ormod3.js',encoding='utf8').read()+'\n'+open('/home/claude/tcv4/ormod3n1.js',encoding='utf8').read()+'\n'+open('/home/claude/tcv4/ormod7.js',encoding='utf8').read()+'\n'+open('/home/claude/tcv4/ormod8.js',encoding='utf8').read()+'\n'+open('/home/claude/tcv4/ormod9.js',encoding='utf8').read()+'\n'+open('/home/claude/tcv4/sltmod.js',encoding='utf8').read()+'\n'+open('/home/claude/tcv4/ormodF.js',encoding='utf8').read()+'\n'+open('/home/claude/tcv4/st3mod.js',encoding='utf8').read()+'\n'+open('/home/claude/tcv4/dzmod.js',encoding='utf8').read()+'\n'+open('/home/claude/tcv4/catmod.js',encoding='utf8').read()+'\n'+open('/home/claude/tcv4/dnmod.js',encoding='utf8').read()+'\n'+open('/home/claude/tcv4/ormodD.js',encoding='utf8').read()+'\n'+open('/home/claude/tcv4/dn2mod.js',encoding='utf8').read()+'\n'+open('/home/claude/tcv4/frbmod.js',encoding='utf8').read()+'\n'+open('/home/claude/tcv4/biomod.js',encoding='utf8').read()+'\n'+open('/home/claude/tcv4/hymod.js',encoding='utf8').read()+'\n'+open('/home/claude/tcv4/qfixmod.js',encoding='utf8').read()+'\n'+open('/home/claude/tcv4/rulemod.js',encoding='utf8').read()+'\n'+open('/home/claude/tcv4/sbmod.js',encoding='utf8').read()+'\n'+open('/home/claude/tcv4/stamod.js',encoding='utf8').read()+'\n'+open('/home/claude/tcv4/aclmod.js',encoding='utf8').read()+'\n'+open('/home/claude/tcv4/grdmod.js',encoding='utf8').read()+'\n'+open('/home/claude/tcv4/ttmod.js',encoding='utf8').read()+'\n'+open('/home/claude/tcv4/tfrmod.js',encoding='utf8').read()+'\n'+open('/home/claude/tcv4/cldmod.js',encoding='utf8').read()+'\n'+open('/home/claude/tcv4/hlmod.js',encoding='utf8').read()+'\n'+open('/home/claude/tcv4/chkmod.js',encoding='utf8').read()+'\n'+open('/home/claude/tcv4/pkgmod.js',encoding='utf8').read()+'\n'+open('/home/claude/tcv4/asvmod.js',encoding='utf8').read()+'\n'+open('/home/claude/tcv4/prmod.js',encoding='utf8').read()+'\n'+open('/home/claude/tcv4/scmmod.js',encoding='utf8').read()+'\n'+open('/home/claude/tcv4/r2kmod.js',encoding='utf8').read()+'\n'+open('/home/claude/tcv4/ipxmod.js',encoding='utf8').read()+'\n'+open('/home/claude/tcv4/secrotmod.js',encoding='utf8').read()+'\n'+open('/home/claude/tcv4/lymod.js',encoding='utf8').read()+'\n'+open('/home/claude/tcv4/xpmod.js',encoding='utf8').read()+'\n'+open('/home/claude/tcv4/demmod.js',encoding='utf8').read()+'\n'+open('/home/claude/tcv4/uimod.js',encoding='utf8').read()+'\n'+open('/home/claude/tcv4/stzmod.js',encoding='utf8').read()+'\n'+open('/home/claude/tcv4/demnet.js',encoding='utf8').read()+'\n'+open('/home/claude/tcv4/v3dmod.js',encoding='utf8').read()+'\n'+open('/home/claude/tcv4/v83mod.js',encoding='utf8').read()+'\n'+open('/home/claude/tcv4/ctlmod.js',encoding='utf8').read()
def rep(a,b,cnt=1):
    global src
    n=src.count(a)
    if n!=cnt: sys.exit(f"anchor count {n}!={cnt}: {a[:70]!r}")
    src=src.replace(a,b)
rep("function designOffsetZ(off, zc, p, slope, gZ, bk) {","function designOffsetZ_old(off, zc, p, slope, gZ, bk) {")
rep("function spCellHTML(sec, idx, f) {","function spCellHTML_old(sec, idx, f) {")
# 1 module
rep("state.profile = { vips: [], drops: [], calc: [], mode: 'SIMPLE' };","state.profile = { vips: [], drops: [], calc: [], mode: 'SIMPLE' };\n\n"+mod)
# 2 sync drops
rep("function buildProfileModel() {\n  const P = state.profile, al = state.alignment;","function buildProfileModel() {\n  stSyncDrops();\n  const P = state.profile, al = state.alignment;")
# 3 reach
rep("Math.max(params.W / 2 + secExt, reach(params.HL, params.nL)))","Math.max(params.W / 2 + secExt, reach(params.HL, params.nL), stReachAt(s)))")
rep("Math.max(params.W / 2 + secExt, reach(params.HR, params.nR)))","Math.max(params.W / 2 + secExt, reach(params.HR, params.nR), stReachAt(s)))")
# 4 recalc after sections
rep("  state.sections = sections;\n  renderStationMileageTable();\n","  state.sections = sections;\n  renderStationMileageTable();\n  stRecalc();\n")
# 5 crossRange
rep("  sec.samples.forEach(s => { minZ = Math.min(minZ, s.groundZ, s.desZ); maxZ = Math.max(maxZ, s.groundZ, s.desZ); });\n  if (tight)","  sec.samples.forEach(s => { minZ = Math.min(minZ, s.groundZ, s.desZ); maxZ = Math.max(maxZ, s.groundZ, s.desZ); });\n  { const zr = stZRange(sec); if (zr) { minZ = Math.min(minZ, zr[0]); maxZ = Math.max(maxZ, zr[1]); } }\n  if (tight)")
# 6 profile
rep("  PCALC.forEach(v => inc(v.z - dropShiftAt(v.sta, false)));","  PCALC.forEach(v => inc(v.z - dropShiftAt(v.sta, false)));\n  stIncZ(inc);")
rep("    ctx.font = '10px \"JetBrains Mono\"'; ctx.fillText(`${zU.toFixed(2)} → ${zD.toFixed(2)}`, x + 8, yTop + 8);\n  });","    ctx.font = '10px \"JetBrains Mono\"'; ctx.fillText(`${zU.toFixed(2)} → ${zD.toFixed(2)}`, x + 8, yTop + 8);\n  });\n  stDrawProfile(sx, sy, minSta, maxSta);")
# 7 cross
rep("  if (isLarge && sec.gv) {   // 地形線折點標記","  _olDraw();\n  stDrawCross(sec, sx, sy, isLarge);\n  if (isLarge && sec.gv) {   // 地形線折點標記")
# 8 plan
rep("  drawHorizontalAlignmentOnCanvas(showAxis, showRoadEdge, showIpTangents, showCentipede, showCurveCentipede);\n","  drawHorizontalAlignmentOnCanvas(showAxis, showRoadEdge, showIpTangents, showCentipede, showCurveCentipede);\n  stDrawPlan();\n")
rep("  if (state.activeTool === 'ADD_STA' && state.hoveredStationProj) {","  if ((state.activeTool === 'ADD_STA' || state.activeTool === 'ADD_STRUCT') && state.hoveredStationProj) {")
rep("ctx.fillText(`📍 點擊新增樁號: ${formatStation(proj.sta)}`, pc.x + 10, pc.y - 8);","ctx.fillText((state.activeTool === 'ADD_STRUCT' ? '🏗 點擊放置結構物: ' : '📍 點擊新增樁號: ') + formatStation(proj.sta), pc.x + 10, pc.y - 8);")
# 9 dxf
rep("    D.endBlock(); D.insert('PLAN_ALIGNMENT');\n","    D.endBlock(); D.insert('PLAN_ALIGNMENT');\n    stDxfPlan(D);\n")
rep("  PC.forEach(v => inc(v.z - dropShiftAt(v.sta, false)));\n  PF.lines.forEach(ln => { if (ln.vis)","  PC.forEach(v => inc(v.z - dropShiftAt(v.sta, false)));\n  stIncZ(inc);\n  PF.lines.forEach(ln => { if (ln.vis)")
rep("    D.text(X(d.sta) + th * 0.4, Math.max(Y(zU), Y(zD)) + th * 0.3, th * 0.8, `${d.name}  dZ=${d.dz.toFixed(2)} m  (${zU.toFixed(2)} -> ${zD.toFixed(2)})`, 'PROF_DROP', 30);\n  });","    D.text(X(d.sta) + th * 0.4, Math.max(Y(zU), Y(zD)) + th * 0.3, th * 0.8, `${d.name}  dZ=${d.dz.toFixed(2)} m  (${zU.toFixed(2)} -> ${zD.toFixed(2)})`, 'PROF_DROP', 30);\n  });\n  stDxfProfile(D, X, Y, minSta, maxSta, th);")
rep("    D.poly(sec.samples.map(s => [sx(s.offset), sy(s.groundZ)]), 'SEC_GROUND', 7);\n","    D.poly(sec.samples.map(s => [sx(s.offset), sy(s.groundZ)]), 'SEC_GROUND', 7);\n    stDxfCross(D, sec, sx, sy, TH);\n")
rep("  dxfSections(D, bb.x1 + 100, bb.y1);\n  return D.build();","  stDxfQty(D, bb.x1 + 100, bb.y1 + 20);\n  dxfSections(D, bb.x1 + 100, bb.y1);\n  return D.build();")
# 10 reverse / undo / save / load
rep("  P.drops.forEach(d => { d.sta = +(S - d.sta).toFixed(3); d.dz = -d.dz; });","  P.drops.forEach(d => { d.sta = +(S - d.sta).toFixed(3); d.dz = -d.dz; });\n  state.structs.forEach(t => { t.sta = +(S - t.sta).toFixed(3); t.dir = -t.dir; t.dz = -(t.dz || 0); });")
rep("    vips: state.profile.vips, drops: state.profile.drops, sideData: state.pf.sideData,","    vips: state.profile.vips, drops: state.profile.drops, structs: stClean(), sideData: state.pf.sideData,")
rep("    state.profile.vips = snap.vips; state.profile.drops = snap.drops || [];","    stLoad(snap.structs); state.profile.vips = snap.vips; state.profile.drops = snap.drops || [];")
rep("      profile: { vips: state.profile.vips, drops: state.profile.drops },","      profile: { vips: state.profile.vips, drops: state.profile.drops.filter(d => !d.sid) }, structs: stClean(),")
rep("  state.profile.vips = (D.profile && D.profile.vips) || []; state.profile.drops = (D.profile && D.profile.drops) || [];","  stLoad(D.structs); state.profile.vips = (D.profile && D.profile.vips) || []; state.profile.drops = ((D.profile && D.profile.drops) || []).filter(d => !d.sid);")
rep("const PROJ_SKIP = /^(fileInput|projInput|vip_|drp_|ipe_|sd_|seqG$|seqD$|dropSta$)/;","const PROJ_SKIP = /^(fileInput|projInput|vip_|drp_|ipe_|sd_|seqG$|seqD$|dropSta$|stSta$|stType$|stKind$|stDir$)/;")
rep("    : P.drops.map((d, i) => `<tr>\n        <td><input class=\"vip-in\" id=\"drp_${i}_name\" type=\"text\" style=\"text-align:left;\" value=\"${escAttr(d.name)}\" onchange=\"updateDrop(${i},'name',this.value)\"></td>","    : P.drops.map((d, i) => `<tr${d.sid ? ' title=\"結構物連動列：ΔZ／後高＝改有效壩高 h2（水流向依正負）；前高＝於此樁號調整設計線；名稱、樁號、刪除同步到結構物\" style=\"background:rgba(255,159,67,.08);\"' : ''}>\n        <td><input class=\"vip-in\" id=\"drp_${i}_name\" type=\"text\" style=\"text-align:left;\" value=\"${escAttr(d.name)}\" onchange=\"updateDrop(${i},'name',this.value)\"></td>")
# 12 card html
card='''
        <div class="sec-card" id="stCard">
          <div class="sec-title"><span>🏗 標準圖結構物（防砂壩／副壩／固床工）</span><span class="badge-pill" id="stBadge">0 座</span></div>
          <div style="display:flex;gap:4px;flex-wrap:wrap;align-items:center;">
            <select class="input-select" id="stKind" style="width:78px;" title="結構物型式"><option value="dam">防砂壩</option><option value="sub">副壩</option><option value="sill">固床工</option></select>
            <input type="number" class="input-num" id="stSta" placeholder="樁號(m)" style="width:70px;" step="1">
            <select class="input-select" id="stDir" style="width:110px;" title="水流方向（上游→下游）沿中心線里程的方向">
              <option value="0">水流：自動(順下坡)</option><option value="1">水流：里程增加</option><option value="-1">水流：里程減少</option>
            </select>
            <button class="btn amber" onclick="stAddFromInputs()">加入</button>
            <button class="btn magenta" onclick="setViewMode('2D');setTool('ADD_STRUCT');" title="切到平面圖，在中心線上點一下即放置（使用上方水流方向）">圖面點擊放置</button>
          </div>
          <div id="stBox"></div>
          <div style="font-size:10.5px;color:var(--text-muted);margin-top:6px;line-height:1.5;">
            <b>平面圖</b>＝結構物平面圖；<b>縱斷面</b>＝斷面圖(順水流向，含壩翼高)；<b>橫斷面</b>＝立面圖(下游視)。<b>連動</b>：落差 ΔZ＝水流向×h2，壩底高程由固定側設計線推得；改壩底高程、拖曳菱形控點(0.05 m 取整)或在落差表改 ΔZ，該座轉「獨立」。<br>
            <b>自動開挖</b>：開挖底＝基礎底面−10 cm（隨基礎底斜率）；key 處再挖到 key 底−10 cm；外放 km 後以 1:kx 往上斜至地面/設計面較低者，列入數量表與 DXF。
          </div>
        </div>
'''
rep('              <tbody id="staTableBody"></tbody>\n            </table>\n          </div>\n        </div>\n','              <tbody id="staTableBody"></tbody>\n            </table>\n          </div>\n        </div>\n'+card)
# 13 groups
rep("  { name: '樁號表', cards: [10], open: 10 }                // 樁號表                              (縱斷面/橫斷面)\n];","  { name: '樁號表', cards: [10], open: 10 },               // 樁號表                              (縱斷面/橫斷面)\n  { name: '結構物', cards: [11], open: 11 }                // 標準圖結構物（防砂壩）              (縱斷面/橫斷面)\n];")
rep("const VIEW_GROUPS = { PROFILE: [1, 2, 3], CROSS: [0, 3] };","const VIEW_GROUPS = { PROFILE: [1, 2, 3, 4], CROSS: [0, 3, 4] };")
rep("  if (cards.length !== 11) return;","  if (cards.length !== 12) return;")
# 14 tool
rep("      <button class=\"btn\" id=\"toolAddPt\" onclick=\"setTool('ADD_PT')\"","      <button class=\"btn amber\" id=\"toolAddStruct\" onclick=\"setTool('ADD_STRUCT')\" title=\"在中心線上點一下放置標準圖結構物（型式/水流方向取自『縱橫斷與土方→結構物』卡片）\">🏗 放置結構物</button>\n      <button class=\"btn\" id=\"toolAddPt\" onclick=\"setTool('ADD_PT')\"")
rep("['toolPan', 'toolFlip', 'toolAddPt', 'toolDrawAxis', 'toolAddSta'].forEach","['toolPan', 'toolFlip', 'toolAddPt', 'toolDrawAxis', 'toolAddSta', 'toolAddStruct'].forEach")
rep("ADD_STA: 'toolAddSta' };","ADD_STA: 'toolAddSta', ADD_STRUCT: 'toolAddStruct' };")
rep("    FLIP: '🔄【翻轉網格共邊】","    ADD_STRUCT: '🏗【放置結構物】：移動滑鼠至中心線（顯示橘色預覽與里程），點擊左鍵即放置標準圖結構物（型式、水流方向取自「縱橫斷與土方→結構物」卡片），放置後自動回到平移模式。',\n    FLIP: '🔄【翻轉網格共邊】")
# mouse
rep("  // Interactive On-Canvas Add Station (`ADD_STA`)\n  if (state.activeTool === 'ADD_STA') {","  if (state.activeTool === 'ADD_STRUCT') {\n    const proj = projectWorldPointToAlignment(wpt.x, wpt.y);\n    if (!proj) { alert('請先繪製中心線！'); return; }\n    stAdd(proj.sta, (document.getElementById('stKind') || {}).value || 'dam', +document.getElementById('stDir').value);\n    setTool('PAN');\n    return;\n  }\n  // Interactive On-Canvas Add Station (`ADD_STA`)\n  if (state.activeTool === 'ADD_STA') {")
rep("  if (state.activeTool === 'ADD_STA') {\n    state.hoveredStationProj = projectWorldPointToAlignment(wpt.x, wpt.y);","  if (state.activeTool === 'ADD_STA' || state.activeTool === 'ADD_STRUCT') {\n    state.hoveredStationProj = projectWorldPointToAlignment(wpt.x, wpt.y);")
# version
rep("<title>TurboCivil Web CAD v3.27 |","<title>TurboCivil Web CAD v4.5 多中心線（主流／支流）・防砂壩標準圖・各變化段剖面土方 | v3.27 ")
rep("TURBOCIVIL WEB CAD v3.2","TURBOCIVIL WEB CAD v4.5")

# ---- v4.2 additions ----
# drop table edit -> structure
rep("function updateDrop(i, field, val) {\n  const d = state.profile.drops[i]; if (!d) return;\n","function updateDrop(i, field, val) {\n  const d = state.profile.drops[i]; if (!d) return;\n  if (d.sid) { stDropEdit(d.sid, field, val); return; }\n")
rep("const d = state.profile.drops[i], z = parseFloat(val); if (!d || isNaN(z)) return;\n","const d = state.profile.drops[i], z = parseFloat(val); if (!d || isNaN(z)) return;\n  if (d.sid) { stDropEdit(d.sid, 'zd', val); return; }\n")
rep("function removeDrop(i) { pushUndoSnapshot();","function removeDrop(i) { const d0 = state.profile.drops[i]; if (d0 && d0.sid) { stDelById(d0.sid); return; } pushUndoSnapshot();")
# old card: dam -> structure
rep("function addDropFromInputs() {\n  const el = id => document.getElementById(id);\n  addDrop(parseFloat(el('dropSta').value), parseFloat(el('dropDz').value), el('dropName').value.trim() || '防砂壩');\n  el('dropSta').value = '';\n}",
"""function addDropOrStruct(sta, dz, name) {   // 防砂壩 → 標準圖結構物（h2＝|ΔZ|，水流向依 ΔZ 正負）；其他（固床工等）維持單純落差
  const al = state.alignment;
  if (/防砂壩/.test(name || '') && !isNaN(sta) && !isNaN(dz) && Math.abs(dz) > 1e-9 && al.segments.length && sta > al.startSta + 0.1 && sta <= al.endSta + 1e-6) { stAdd(sta, 'dam', dz >= 0 ? 1 : -1, Math.abs(dz)); return; }
  addDrop(sta, dz, name);
}
function addDropFromInputs() {
  const el = id => document.getElementById(id);
  addDropOrStruct(parseFloat(el('dropSta').value), parseFloat(el('dropDz').value), el('dropName').value.trim() || '防砂壩');
  el('dropSta').value = '';
}""")
rep("if (!isNaN(dz)) addDrop(sta, dz, document.getElementById('dropName').value.trim() || '防砂壩');","if (!isNaN(dz)) addDropOrStruct(sta, dz, document.getElementById('dropName').value.trim() || '防砂壩');")
rep("        <td style=\"color:var(--cad-cyan)\">${getDesignZBefore(d.sta).toFixed(2)}</td>","        <td><input class=\"vip-in\" id=\"drp_${i}_zb\" type=\"text\" inputmode=\"decimal\" style=\"width:64px;color:var(--cad-cyan);\" value=\"${getDesignZBefore(d.sta).toFixed(2)}\" onchange=\"updateDropUp(${i},this.value)\" title=\"直接輸入前(上游側)設計高；於此樁號調整設計線（加/改 VIP）\"></td>")
rep("function removeDrop(i) {","function updateDropUp(i, val) {\n  const d = state.profile.drops[i]; if (!d) return; const z = parseFloat(val); if (isNaN(z)) return;\n  pushUndoSnapshot(); stShiftDesignBefore(d.sta, z); setTimeout(rebuildAlignmentAndSections, 0);\n}\nfunction removeDrop(i) {")
rep("    ctx.fillText(`${d.name}  ΔZ=${d.dz.toFixed(2)} m`, x + 8, yTop - 6);","    if (!d.sid) ctx.fillText(`${d.name}  ΔZ=${d.dz.toFixed(2)} m`, x + 8, yTop - 6);")
rep("    ctx.font = '10px \"JetBrains Mono\"'; ctx.fillText(`${zU.toFixed(2)} → ${zD.toFixed(2)}`, x + 8, yTop + 8);\n  });\n  stDrawProfile","    if (!d.sid) { ctx.font = '10px \"JetBrains Mono\"'; ctx.fillText(`${zU.toFixed(2)} → ${zD.toFixed(2)}`, x + 8, yTop + 8); }\n  });\n  stDrawProfile")
# plan view: structure card
rep("const VIEW_GROUPS = { PROFILE: [1, 2, 3, 4], CROSS: [0, 3, 4] };","const VIEW_GROUPS = { '2D': [4], PROFILE: [1, 2, 3, 4], CROSS: [0, 3, 4] };")
rep("const VIEW_TABS = { '2D': ['tab-data', 'tab-align', 'tab-tin'],","const VIEW_TABS = { '2D': ['tab-data', 'tab-align', 'tab-tin', 'tab-earth'],")
rep("  tabs.forEach(t => { t.style.display = allowed.includes(t.dataset.tab) ? '' : 'none'; });","  tabs.forEach(t => { t.style.display = allowed.includes(t.dataset.tab) ? '' : 'none'; if (t.dataset.tab === 'tab-earth') t.textContent = v === '2D' ? '結構物' : '縱橫斷面'; });")
rep("  if (v === 'PROFILE' || v === 'CROSS') earthApplyView();","  if (v === 'PROFILE' || v === 'CROSS' || v === '2D') earthApplyView();")
# cross: matrix cells, station strip, structure-first
rep("    const maxPerPage = cols * rows;","    state._xcells = [];\n    const maxPerPage = cols * rows;")
rep("      drawSingleCrossSectionBox(secs[sIdx], bx, by, cellW, cellH, false, sIdx === state.selectedStaIdx, sIdx);","      state._xcells.push({ x: bx, y: by, w: cellW, h: cellH, idx: sIdx });\n      drawSingleCrossSectionBox(secs[sIdx], bx, by, cellW, cellH, false, sIdx === state.selectedStaIdx, sIdx);")
rep("      const by0 = d.h <= h - 131 ? 94 + (h - 131 - d.h) / 2 : Math.min(94, h / 2 - (d.P.padT + (d.r.maxZ - zc) * _ppm));","      const by0 = d.h <= h - 131 - ST_STRIP_H ? 94 + (h - 131 - ST_STRIP_H - d.h) / 2 : Math.min(94, h / 2 - (d.P.padT + (d.r.maxZ - zc) * _ppm));")
rep("    } else drawSingleCrossSectionBox(sec, 65, 94, w - 105, h - 131, true);","    } else drawSingleCrossSectionBox(sec, 65, 94, w - 105, h - 131 - ST_STRIP_H, true);\n    state._xcells = [];")
rep("  endCam();\n  ctx.restore();\n}\n\n/* ============================================================================\n   斷面參數","  endCam();\n  if (state.crossDisplayMode === 'SINGLE') stDrawStrip(w, h); else state._strip = null;\n  ctx.restore();\n}\n\n/* ============================================================================\n   斷面參數")
rep("  ctx.save();\n  ctx.fillStyle = isSelected ? 'rgba(0,240,255,0.05)' : '#0b1018';","  const _pr = state.stPrio && stAtSec(sec).length > 0;   // 結構線優先：挖填與地面/設計線退為背景\n  ctx.save();\n  ctx.fillStyle = isSelected ? 'rgba(0,240,255,0.05)' : '#0b1018';")
rep("hatch(cutP, 1, hgap, 'rgba(255,230,0,0.9)', []);","hatch(cutP, 1, hgap, _pr ? 'rgba(255,230,0,0.22)' : 'rgba(255,230,0,0.9)', []);")
rep("hatch(fillP, -1, hgap, 'rgba(255,107,136,0.95)', [4, 3]);","hatch(fillP, -1, hgap, _pr ? 'rgba(255,107,136,0.25)' : 'rgba(255,107,136,0.95)', [4, 3]);")
rep("ctx.strokeStyle = '#3b82f6'; ctx.lineWidth = isLarge ? 1.3 : 1.0; ctx.beginPath();","ctx.strokeStyle = _pr ? 'rgba(59,130,246,0.7)' : '#3b82f6'; ctx.lineWidth = (isLarge ? 1.3 : 1.0) * (_pr ? 0.7 : 1); ctx.beginPath();")
rep("ctx.strokeStyle = '#ffffff'; ctx.lineWidth = isLarge ? 1.1 : 0.9; ctx.beginPath();","ctx.strokeStyle = _pr ? 'rgba(255,255,255,0.75)' : '#ffffff'; ctx.lineWidth = (isLarge ? 1.1 : 0.9) * (_pr ? 0.7 : 1); ctx.beginPath();")
rep('          <button class="btn" onclick="stepStation(1)">下一樁 ▶</button>\n','          <button class="btn" onclick="stepStation(1)">下一樁 ▶</button>\n          <label style="display:flex;gap:4px;align-items:center;font-size:12px;color:#ffd08a;" title="有結構物的斷面：結構線加粗、標註尺寸，挖填斜線與地面/設計線退為背景（DXF 同步）"><input type="checkbox" id="stPrioChk" checked onchange="state.stPrio=this.checked;requestRedraw()"> 結構線優先</label>\n          <span style="color:var(--text-muted);font-size:11px;">矩陣：單擊選取、雙擊放大</span>\n')
rep("  if (isLarge && sec.params) {\n    const p = sec.params, zc = sec.desCenterZ, e = p.W / 2;","  if (isLarge && sec.params && !_pr) {\n    const p = sec.params, zc = sec.desCenterZ, e = p.W / 2;")
rep("  if (isLarge && sec.params && sec.params.D > 0) {   // 基礎高","  if (isLarge && sec.params && sec.params.D > 0 && !_pr) {   // 基礎高")
# cross click / dblclick / strip click
rep("cadCanvas.addEventListener('wheel', (e) => {","""cadCanvas.addEventListener('mousedown', (e) => {   // 橫斷面：矩陣單擊選取斷面；單一圖下方站號條單擊切換
  if (state.viewMode !== 'CROSS' || e.button !== 0 || state.panMode || e.shiftKey || e.altKey) return;
  const rect = cadCanvas.getBoundingClientRect(), mx = e.clientX - rect.left, my = e.clientY - rect.top, T = state.textScale;
  if (state.crossDisplayMode === 'SINGLE') {
    const S = state._strip; if (!S) return; const x = mx / T, y = my / T;
    if (y >= S.y0 - 4 && y <= S.y1 + 4 && x >= S.x0 - 8 && x <= S.x1 + 8) { let best = null, bd = 1e9; S.items.forEach(it => { const d = Math.abs(it.x - x); if (d < bd) { bd = d; best = it; } }); if (best) selectStationIndex(best.idx); }
    return;
  }
  const b = camInv(mx, my), c = (state._xcells || []).find(c => b.x >= c.x && b.x <= c.x + c.w && b.y >= c.y && b.y <= c.y + c.h);
  if (c) { selectStationIndex(c.idx); const st = state.structs.findIndex(s => Math.abs(s.sta - state.sections[c.idx].sta) < 0.03); if (st >= 0) { state.structSel = st; stRenderUI(); } }
});
cadCanvas.addEventListener('dblclick', (e) => {
  if (state.viewMode !== 'CROSS' || state.crossDisplayMode !== 'GRID' || state.panMode) return;
  const rect = cadCanvas.getBoundingClientRect(), b = camInv(e.clientX - rect.left, e.clientY - rect.top), c = (state._xcells || []).find(c => b.x >= c.x && b.x <= c.x + c.w && b.y >= c.y && b.y <= c.y + c.h);
  if (c) { selectStationIndex(c.idx); setCrossDisplayMode('SINGLE'); }
});
cadCanvas.addEventListener('wheel', (e) => {""")
rep("window.addEventListener('resize', resizeCanvases);","window.addEventListener('resize', resizeCanvases);\nif (window.ResizeObserver) new ResizeObserver(() => resizeCanvases()).observe(document.getElementById('viewportWrap'));   // 狀態列換行等造成版面高度改變時，畫布點陣同步更新（否則游標與圖面錯位）")
# 中心線預覽：輕量覆蓋層，不受主畫面重繪延遲影響
rep("        <canvas id=\"cadCanvas\"></canvas>","        <canvas id=\"cadCanvas\"></canvas>\n        <canvas id=\"axisOverlay\" style=\"position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none;z-index:3;\"></canvas>")
rep("    const pm = worldToScreen2D(state.mouseWorld.x, state.mouseWorld.y);\n    ctx.lineTo(pm.x, pm.y);\n    ctx.stroke();","    ctx.stroke();   // 游標側橡皮筋線改由 axisOverlay 即時繪製")
rep("function renderLoop() {\n  if (needsRedraw) {","function renderLoop() {\n  if (window.axisOvDraw) axisOvDraw();\n  if (needsRedraw) {")

rep("    ctx.fillText(`VIP${i}` + (v.L > 1e-6 ? `  L=${v.L.toFixed(1)}` : '  折坡'), x, y - 14);\n    if (PF.showA) {","    if (!stNearVip(v.sta)) ctx.fillText(`VIP${i}` + (v.L > 1e-6 ? `  L=${v.L.toFixed(1)}` : '  折坡'), x, y - 14);\n    if (PF.showA && !stNearVip(v.sta)) {")
rep("    D.text(x, y + th * 1.0, th * 0.8, `VIP${i}`","    if (!stNearVip(v.sta)) D.text(x, y + th * 1.0, th * 0.8, `VIP${i}`")
rep("    if (PF.showA) D.text(x, y + th * 2.0","    if (PF.showA && !stNearVip(v.sta)) D.text(x, y + th * 2.0")

rep("  stDxfQty(D, bb.x1 + 100, bb.y1 + 20);","  stDxfQty(D, bb.x1 + 100, bb.y1 + 20);\n  stDxfStdAll(D, bb.x0 - 60, bb.y1);")
rep("    ctx.fillStyle = 'rgba(255,122,26,0.30)'; ctx.fillRect(x - 5, yTop, 10, Math.abs(yD - yU));\n    ctx.strokeStyle = '#ff7a1a'; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(x, yU); ctx.lineTo(x, yD); ctx.stroke();","    if (!d.sid) { ctx.fillStyle = 'rgba(255,122,26,0.30)'; ctx.fillRect(x - 5, yTop, 10, Math.abs(yD - yU));\n    ctx.strokeStyle = '#ff7a1a'; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(x, yU); ctx.lineTo(x, yD); ctx.stroke(); }")
rep("  hatch(cutP, 1, hgap, _pr ? 'rgba(255,230,0,0.22)' : 'rgba(255,230,0,0.9)', []);\n  hatch(fillP, -1, hgap, _pr ? 'rgba(255,107,136,0.25)' : 'rgba(255,107,136,0.95)', [4, 3]);","  const _olDraw = () => { const ol = (polys, col, dash) => { ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = isLarge ? 1.2 : 0.9; ctx.setLineDash(dash); ctx.beginPath(); polys.forEach(p => { if (Math.abs(p[0][1] - p[3][1]) + Math.abs(p[1][1] - p[2][1]) < 0.5) return; ctx.moveTo(p[0][0], p[0][1]); ctx.lineTo(p[1][0], p[1][1]); ctx.moveTo(p[2][0], p[2][1]); ctx.lineTo(p[3][0], p[3][1]); }); ctx.stroke(); ctx.restore(); };   // 挖填不填滿：以不同虛線外框表示\n    ol(cutP, _pr ? 'rgba(255,230,0,0.35)' : 'rgba(255,230,0,0.95)', [10, 4]); ol(fillP, _pr ? 'rgba(255,107,136,0.35)' : 'rgba(255,107,136,0.95)', [3, 3]); }; void hgap;")
rep("    for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.moveTo(lx + k * 5, ly + 11); ctx.lineTo(lx + k * 5 + 9, ly + 2); ctx.stroke(); }","    ctx.lineWidth = 1.2; ctx.setLineDash([10, 4]); ctx.beginPath(); ctx.moveTo(lx, ly + 7); ctx.lineTo(lx + 24, ly + 7); ctx.stroke(); ctx.setLineDash([]);")
rep("    ctx.strokeStyle = 'rgba(255,107,136,0.95)'; ctx.setLineDash([3, 2]);\n    for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.moveTo(lx + 66 + k * 5, ly + 2); ctx.lineTo(lx + 66 + k * 5 + 9, ly + 11); ctx.stroke(); }","    ctx.strokeStyle = 'rgba(255,107,136,0.95)'; ctx.lineWidth = 1.2; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(lx + 66, ly + 7); ctx.lineTo(lx + 90, ly + 7); ctx.stroke();")
rep("    hatchSegments(cutP, 1, 0.3).forEach(s => D.line(s[0], s[1], 0, s[2], s[3], 0, 'SEC_CUT', 2));\n    hatchSegments(fillP, -1, 0.3).forEach(s => D.line(s[0], s[1], 0, s[2], s[3], 0, 'SEC_FILL', 1, 'DASHED'));","    [[cutP, 'SEC_CUT', 2, 'DASHED'], [fillP, 'SEC_FILL', 1, 'DASHED2']].forEach(([P, ly, c, lt]) => P.forEach(pg => { if (Math.abs(pg[0][1] - pg[3][1]) + Math.abs(pg[1][1] - pg[2][1]) < 1e-4) return; D.line(pg[0][0], pg[0][1], 0, pg[1][0], pg[1][1], 0, ly, c, lt); D.line(pg[2][0], pg[2][1], 0, pg[3][0], pg[3][1], 0, ly, c, lt); }));   // 挖填不填滿：沿地面線與設計線以虛線表示（挖方長虛線、填方短虛線）")
rep("    for (let k = 0; k < 4; k++) D.line(lx + k * 0.3, ly, 0, lx + k * 0.3 + 0.5, ly + 0.5, 0, 'SEC_CUT', 2);","    D.line(lx, ly + 0.3, 0, lx + 1.4, ly + 0.3, 0, 'SEC_CUT', 2, 'DASHED');")
rep("    for (let k = 0; k < 4; k++) D.line(lx + 4.4 + k * 0.3, ly + 0.5, 0, lx + 4.4 + k * 0.3 + 0.5, ly, 0, 'SEC_FILL', 1, 'DASHED');","    D.line(lx + 4.4, ly + 0.3, 0, lx + 5.8, ly + 0.3, 0, 'SEC_FILL', 1, 'DASHED2');")
rep("LTYPE\\n70\\n2\\n0\\nLTYPE\\n2\\nCONTINUOUS","LTYPE\\n70\\n3\\n0\\nLTYPE\\n2\\nCONTINUOUS")
rep("49\\n0.3\\n49\\n-0.2\\n0\\nENDTAB","49\\n0.3\\n49\\n-0.2\\n0\\nLTYPE\\n2\\nDASHED2\\n70\\n0\\n3\\nShort dash _ _ _\\n72\\n65\\n73\\n2\\n40\\n0.2\\n49\\n0.1\\n49\\n-0.1\\n0\\nENDTAB")
rep("    for (const cs of state.customStations) {\n      if (cs.s >= align.startSta && cs.s <= align.endSta) {\n        keyStations.push({ s: cs.s, ptName: cs.name, priority: 4, isCurveTick: false });\n      }\n    }","    for (const cs of state.customStations) {\n      if (cs.s >= align.startSta && cs.s <= align.endSta) {\n        keyStations.push({ s: cs.s, ptName: cs.name, priority: 4, isCurveTick: false });\n      }\n    }\n    if (typeof stKeyStations === 'function') stKeyStations().forEach(k => { if (k.s > align.startSta && k.s < align.endSta) keyStations.push(k); });")
rep("  document.getElementById('stationSelect').value = state.selectedStaIdx;\n  syncCrossEdit();\n  requestRedraw();\n}","  document.getElementById('stationSelect').value = state.selectedStaIdx;\n  syncCrossEdit();\n  if (typeof stOnStation === 'function') stOnStation(state.selectedStaIdx);\n  requestRedraw();\n}")

# ---- v4.4 stage A ----
rep("  ctx.strokeStyle = '#3b82f6'; ctx.lineWidth = 1.4; ctx.beginPath();\n  sampleDesignProfile(","  ctx.strokeStyle = '#3b82f6'; ctx.lineWidth = 0.9; ctx.beginPath();\n  sampleDesignProfile(")
rep("  ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.1; ctx.beginPath();\n  if (state.gmProfile","  ctx.strokeStyle = '#fff'; ctx.lineWidth = 0.8; ctx.beginPath();\n  if (state.gmProfile")
rep("      ctx.strokeStyle = col; ctx.lineWidth = 1.0; ctx.beginPath(); let f = true, lx = null, ly = null;","      ctx.strokeStyle = col; ctx.lineWidth = 0.7; ctx.beginPath(); let f = true, lx = null, ly = null;")
rep("    ctx.strokeStyle = ln.color; ctx.lineWidth = 1.8; ctx.setLineDash([7, 3]); ctx.beginPath();","    ctx.strokeStyle = ln.color; ctx.lineWidth = 1.0; ctx.setLineDash([7, 3]); ctx.beginPath();")
rep("  drawHorizontalAlignmentOnCanvas(showAxis, showRoadEdge, showIpTangents, showCentipede, showCurveCentipede);\n  stDrawPlan();\n","  drawHorizontalAlignmentOnCanvas(showAxis, showRoadEdge, showIpTangents, showCentipede, showCurveCentipede);\n  stDrawPlan();\n  stDrawNorth();\n")
rep("    D.endBlock(); D.insert('PLAN_ALIGNMENT');\n    stDxfPlan(D);\n","    D.endBlock(); D.insert('PLAN_ALIGNMENT');\n    stDxfPlan(D);\n    stDxfPlanDeco(D, bb);\n")
rep("  dxfSections(D, bb.x1 + 100, bb.y1);\n  return D.build();","  stDxfIndex(D, bb);\n  dxfSections(D, bb.x1 + 100, bb.y1);\n  return D.build();")

# ---- v4.4 stage B ----
rep("  .panel-tab { white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }\n</style>","  .panel-tab { white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }\n"+'\n  /* ===== v4.4 白底介面：頂部列＋左側面板改白底黑字、強調色加深；圖面（畫布）與圖面上的浮動工具維持黑底 ===== */\n  .top-ribbon, .side-panel {\n    --bg-panel:#ffffff; --bg-panel-alt:#f8fafc; --bg-header:#ffffff; --border-dim:#d7dde6; --border-bright:#aab4c4;\n    --text-main:#1e293b; --text-muted:#64748b;\n    --cad-cyan:#0e7490; --cad-amber:#c2660a; --cad-yellow:#a16207; --cad-red:#dc2626; --cad-green:#059669; --cad-blue:#2563eb; --cad-magenta:#c026d3;\n    color:var(--text-main);\n  }\n  .top-ribbon { background:#ffffff; border-bottom:1px solid #d7dde6; box-shadow:0 1px 3px rgba(15,23,42,.08); }\n  .side-panel { background:#ffffff; border-right:1px solid #d7dde6; }\n  .top-ribbon .brand-title { color:#1e293b; }\n  .top-ribbon .brand-logo { background:#f1f5f9; border-color:#aab4c4; color:#0e7490; box-shadow:none; }\n  .top-ribbon .toolbar-group { background:#f8fafc; border-color:#d7dde6; }\n  .top-ribbon .btn, .side-panel .btn, .top-ribbon .btn.amber, .side-panel .btn.amber, .top-ribbon .btn.magenta, .side-panel .btn.magenta, .top-ribbon .btn.green, .side-panel .btn.green, .top-ribbon .btn.cyan-strong, .side-panel .btn.cyan-strong { background:#ffffff; color:#1e293b; border:1px solid #aab4c4; }\n  .top-ribbon .btn:hover, .side-panel .btn:hover, .top-ribbon .btn.amber:hover, .side-panel .btn.amber:hover, .top-ribbon .btn.magenta:hover, .side-panel .btn.magenta:hover, .top-ribbon .btn.green:hover, .side-panel .btn.green:hover, .top-ribbon .btn.cyan-strong:hover, .side-panel .btn.cyan-strong:hover { background:#f1f5f9; color:#0f172a; border-color:#0e7490; }\n  .top-ribbon .btn.active, .side-panel .btn.active, .top-ribbon .btn.amber.active, .side-panel .btn.amber.active, .top-ribbon .btn.magenta.active, .side-panel .btn.magenta.active, .top-ribbon .btn.green.active, .side-panel .btn.green.active, .top-ribbon .btn.cyan-strong.active, .side-panel .btn.cyan-strong.active { background:#059669; color:#ffffff; border-color:#059669; font-weight:700; box-shadow:none; }\n  .top-ribbon .btn.primary, .side-panel .btn.primary { background:#0e7490; color:#ffffff; border-color:#0e7490; font-weight:700; }\n  .top-ribbon .btn.primary:hover, .side-panel .btn.primary:hover { background:#155e75; color:#ffffff; }\n  .top-ribbon .btn.danger, .side-panel .btn.danger { color:#dc2626; border-color:rgba(220,38,38,.5); }\n  .top-ribbon .btn.danger:hover, .side-panel .btn.danger:hover { background:rgba(220,38,38,.08); color:#b91c1c; border-color:#dc2626; }\n  .top-ribbon .ts-label { color:#0e7490; }\n  .side-panel .panel-tabs { background:#f8fafc; }\n  .side-panel .panel-tab:hover { color:#0f172a; }\n  .side-panel .panel-tab.active { background:#ffffff; }\n  .side-panel .sec-card { background:#f8fafc; }\n  .side-panel #earthSubTabs { background:#ffffff; }\n  .side-panel #earthSubTabs button.st { background:#ffffff; color:#475569; border-color:#d7dde6; }\n  .side-panel #earthSubTabs button.st:hover { color:#0f172a; border-color:#0e7490; }\n  .side-panel #earthSubTabs button.st.on { background:#059669; color:#ffffff; border-color:#059669; }\n  .side-panel .input-num, .side-panel .input-select, .side-panel .input-text, .side-panel .vip-in, .side-panel .pf-ta { background:#ffffff; color:#1e293b; border-color:#aab4c4; }\n  .side-panel .input-num:disabled, .side-panel .vip-in:disabled { background:#f1f5f9; }\n  .side-panel select option { background:#ffffff; color:#1e293b; }\n  .side-panel .pt-table-wrap { background:#ffffff; }\n  .side-panel table.pt-table th { background:#e8ecf2; color:#0e7490; border-bottom-color:#aab4c4; }\n  .side-panel table.pt-table td { border-bottom-color:#e5e9f0; }\n  .side-panel table.pt-table tr:hover td { background:rgba(14,116,144,.08); }\n  .side-panel .ip-r-input { background:#ffffff; color:#a16207; }\n  .side-panel .dxf-diag-box { background:#f8fafc; color:#334155; }\n  .side-panel .kpi-box { background:#ffffff; }\n  .side-panel .badge-pill { background:rgba(14,116,144,.10); }\n  .side-panel .gv-sel td { background:rgba(14,116,144,.12); }\n  .side-panel .op-add { color:#0e7490; background:rgba(14,116,144,.10); }\n  .side-panel .op-drag { color:#047857; background:rgba(5,150,105,.10); }\n  .side-panel .op-del { color:#be123c; background:rgba(190,18,60,.08); }\n  .side-panel .op-drop { color:#b45309; background:rgba(180,83,9,.10); }\n  .side-panel .op-zoom { color:#6d28d9; background:rgba(109,40,217,.08); }\n  .side-panel .op-pan { color:#a16207; background:rgba(161,98,7,.10); }\n  .side-panel .op-sel { color:#0369a1; background:rgba(3,105,161,.08); }\n  .side-panel .panel-body::-webkit-scrollbar-thumb { background:#cbd5e1; }\n  /* 面板內原為深底設計的淺色字：改為白底可讀的深色 */\n  .side-panel [style*="color:#fff"], .side-panel [style*="color: #fff"], .top-ribbon [style*="color:#fff"], .side-panel [style*="color:#e2e8f0"], .side-panel [style*="color:#cbd5e1"], .side-panel [style*="color: rgb(203, 213, 225)"] { color:#0f172a !important; }\n  .side-panel [style*="color:#ffd08a"], .side-panel [style*="color:#ffd166"], .side-panel [style*="color:#ffaa00"], .side-panel [style*="color: rgb(255, 208, 138)"] { color:#b45309 !important; }\n  .side-panel [style*="color:#7dd3fc"], .side-panel [style*="color: rgb(125, 211, 252)"], .side-panel [style*="color:#93c5fd"] { color:#0369a1 !important; }\n  .side-panel [style*="color:#38bdf8"] { color:#0284c7 !important; }\n  .side-panel [style*="color:#ffb066"], .side-panel [style*="color: rgb(255, 176, 102)"] { color:#c2410c !important; }\n  .side-panel [style*="color:#ff7ae0"], .side-panel [style*="color:#ff4fd8"] { color:#a21caf !important; }\n  .side-panel [style*="color:#ffe600"], .side-panel [style*="color: rgb(255, 230, 0)"] { color:#a16207 !important; }\n  .side-panel [style*="color:#ff7b92"], .side-panel [style*="color:#ff6b88"], .side-panel [style*="color: rgb(255, 123, 146)"] { color:#be123c !important; }\n  .side-panel [style*="color:#8b9bb4"], .side-panel [style*="color: rgb(139, 155, 180)"] { color:#64748b !important; }\n  .side-panel [style*="color:#00e676"], .side-panel [style*="color:#00f0ff"] { color:#047857 !important; }\n  .side-panel [style*="#233146"], .side-panel [style*="#131c2b"] { border-color:#d7dde6 !important; }\n'+"</style>")
rep("function renderLoop() {\n  if (window.axisOvDraw) axisOvDraw();\n  if (needsRedraw) {","function renderLoop() {\n  if (window.axisOvDraw) axisOvDraw();\n  if (needsRedraw) {\n    ST_PK = [];")

# ---- v4.5 stage C + 7 items ----
_k = src.rindex("function buildFullDXF() {\n  const D = makeDXFWriter(),"); assert src.count("function buildFullDXF() {")==2
src = src[:_k] + "function buildFullDXF_v44() {   // v4.5 起改用多中心線版 buildFullDXF（clmod）" + src[_k+len("function buildFullDXF() {"):]
rep("  const touch = (x, y) => { if (isFinite(x) && isFinite(y)) { B.x0 = Math.min(B.x0, x); B.y0 = Math.min(B.y0, y); B.x1 = Math.max(B.x1, x); B.y1 = Math.max(B.y1, y); } };",
    "  let S = null;   // sub()/subEnd()：量測一段輸出的範圍（多中心線排版用）\n  const touch = (x, y) => { if (isFinite(x) && isFinite(y)) { B.x0 = Math.min(B.x0, x); B.y0 = Math.min(B.y0, y); B.x1 = Math.max(B.x1, x); B.y1 = Math.max(B.y1, y); if (S) { S.x0 = Math.min(S.x0, x); S.y0 = Math.min(S.y0, y); S.x1 = Math.max(S.x1, x); S.y1 = Math.max(S.y1, y); } } };")
rep("    lock(n) { locked.add(n); },", "    lock(n) { locked.add(n); },\n    sub() { S = { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity }; },\n    subEnd() { const r = S; S = null; return r && isFinite(r.x0) ? r : null; },")
rep("const PROJ_SKIP = /^(fileInput|projInput|", "const PROJ_SKIP = /^(cl[A-Z]|fileInput|projInput|")
rep("  drawHorizontalAlignmentOnCanvas(showAxis, showRoadEdge, showIpTangents, showCentipede, showCurveCentipede);\n  stDrawPlan();", "  clDrawOthers();\n  drawHorizontalAlignmentOnCanvas(showAxis, showRoadEdge, showIpTangents, showCentipede, showCurveCentipede);\n  stDrawPlan();")

rep("      if (!isFinite(x) || !isFinite(y) || !(h > 0)) return;\n      lay(layer, color); touch(x, y);",
    "      if (!isFinite(x) || !isFinite(y) || !(h > 0)) return;\n      lay(layer, color); touch(x, y);\n      if (!o.rot) { let w = 0; for (const ch of String(str)) w += /[\\u2E80-\\uFFFF]/.test(ch) ? h : h * 0.62; const xa = o.align === 'c' ? x - w / 2 : (o.align === 'r' ? x - w : x); touch(xa, y); touch(xa + w, y + h); }   // 文字寬度計入範圍")

# ---- v4.6 護岸（左右岸各自：起迄樁號、偏移、高度、型式參數、加高） ----
rep("      const params = spAll(s, item.side || '', SPG);\n","      const params = spAll(s, item.side || '', SPG); rvParams(params, s, item.side);\n")
rep("      const reach = (H, n) => (H > 0 ? params.W / 2 + Math.max(n * H, 0.001) + BF.dx + BF.maxH + 2 : 0);","      const reach = (H, n, sd) => rvReach(params, H, n, sd);")
rep("Math.max(params.W / 2 + secExt, reach(params.HL, params.nL), stReachAt(s))","Math.max(params.eL + secExt, reach(params.HL, params.nL, 'L'), stReachAt(s))")
rep("Math.max(params.W / 2 + secExt, reach(params.HR, params.nR), stReachAt(s))","Math.max(params.eR + secExt, reach(params.HR, params.nR, 'R'), stReachAt(s))")
_a = src.index("      const bk = {};\n      [[-1, params.HL, params.nL], [1, params.HR, params.nR]].forEach(")
_b = src.index("      offs.sort((u, v) => u - v);\n      const offU")
assert 0 < _a < _b
src = src[:_a] + """      const bk = {};
      [[-1, 'L'], [1, 'R']].forEach(([sg, sd]) => {   // 河床邊緣、護岸/背填各轉折點皆為採樣轉折點；無護岸＝地形線
        const e = sg < 0 ? params.eL : params.eR, hS = sg < 0 ? halfL : halfR; offs.push(sg * e);
        const r = rvBank(params.rv && params.rv[sd], e, desCenterZ, hS, a => groundAtOff(sg * a), BF);
        bk[sg] = r.B; r.pts.forEach(a => offs.push(sg * a));
      });
""" + src[_b:]
rep("bkInfo: { L: bk[-1] ? { mode: bk[-1].mode, aX: bk[-1].aX } : null, R: bk[1] ? { mode: bk[1].mode, aX: bk[1].aX } : null }, cutN: CUT,","bkInfo: { L: bk[-1] || null, R: bk[1] || null }, cutN: CUT,")
rep("    if (typeof stKeyStations === 'function') stKeyStations().forEach(k => { if (k.s > align.startSta && k.s < align.endSta) keyStations.push(k); });","    if (typeof stKeyStations === 'function') stKeyStations().forEach(k => { if (k.s > align.startSta && k.s < align.endSta) keyStations.push(k); });\n    rvKeyStations().forEach(k => { if (k.s > align.startSta && k.s < align.endSta) keyStations.push(k); });")
rep("  state.sections = sections;\n  renderStationMileageTable();\n  stRecalc();\n","  state.sections = sections;\n  renderStationMileageTable();\n  stRecalc();\n  rvRecalc();\n")
rep("  _olDraw();\n  stDrawCross(sec, sx, sy, isLarge);\n","  _olDraw();\n  stDrawCross(sec, sx, sy, isLarge);\n  rvDrawCross(sec, sx, sy, isLarge);\n")
rep("  if (isLarge && sec.params && !_pr) {\n    const p = sec.params, zc = sec.desCenterZ, e = p.W / 2;","  if (false && isLarge && sec.params && !_pr) {\n    const p = sec.params, zc = sec.desCenterZ, e = p.W / 2;")
rep("  if (isLarge && sec.params && sec.params.D > 0 && !_pr) {   // 基礎高","  if (false && isLarge && sec.params && sec.params.D > 0 && !_pr) {   // 基礎高")
rep("{ const zr = stZRange(sec); if (zr) { minZ = Math.min(minZ, zr[0]); maxZ = Math.max(maxZ, zr[1]); } }","{ const zr = stZRange(sec); if (zr) { minZ = Math.min(minZ, zr[0]); maxZ = Math.max(maxZ, zr[1]); } const zr2 = rvZRange(sec); if (zr2) { minZ = Math.min(minZ, zr2[0]); maxZ = Math.max(maxZ, zr2[1]); } }")
rep("  stIncZ(inc);\n","  stIncZ(inc); rvIncZ(inc);\n",2)
rep("  stDrawProfile(sx, sy, minSta, maxSta);","  stDrawProfile(sx, sy, minSta, maxSta);\n  rvDrawProfile(sx, sy, minSta, maxSta);")
rep("  stDxfProfile(D, X, Y, minSta, maxSta, th);","  stDxfProfile(D, X, Y, minSta, maxSta, th);\n  rvDxfProfile(D, X, Y, minSta, maxSta, th);")
import re as _re
_n0 = src.count("case 'bank':"); 
src, _c1 = _re.subn(r"case 'bank': \{ const p = s\.params, a = .*?'#cbd5e1'\]; \}", "case 'bank': return [rvRowBank(s), '#cbd5e1'];", src); assert _c1 == 1, _c1
src, _c2 = _re.subn(r"case 'bank': \{ const p = s\.params, a = .*?, 8\]; \}", "case 'bank': return [rvRowBank(s), 8];", src); assert _c2 == 1, _c2
rep("case 'found': return [(s.desCenterZ - s.params.D).toFixed(2), '#cbd5e1'];","case 'found': return [rvRowFound(s), '#cbd5e1'];")
rep("case 'found': return [(s.desCenterZ - s.params.D).toFixed(2), 8];","case 'found': return [rvRowFound(s), 8];")
rep("  stDrawPlan();\n  stDrawNorth();\n","  stDrawPlan();\n  rvDrawPlan();\n  stDrawNorth();\n")
rep("    stDxfCross(D, sec, sx, sy, TH);\n","    stDxfCross(D, sec, sx, sy, TH);\n    rvDxfCross(D, sec, sx, sy, TH);\n")
rep("    if (sec.params) {\n      const p = sec.params, zc = sec.desCenterZ, e = p.W / 2, yW = sy(zc) - 1.05;","    if (false && sec.params) {\n      const p = sec.params, zc = sec.desCenterZ, e = p.W / 2, yW = sy(zc) - 1.05;")
rep("structs: stClean(), sideData: state.pf.sideData,","structs: stClean(), revs: rvClean(), sideData: state.pf.sideData,")
rep("    stLoad(snap.structs); state.profile.vips = snap.vips;","    stLoad(snap.structs); rvLoad(snap.revs); state.profile.vips = snap.vips;")
rep("drops: state.profile.drops.filter(d => !d.sid) }, structs: stClean(), secParams:","drops: state.profile.drops.filter(d => !d.sid) }, structs: stClean(), revs: rvClean(), secParams:")
rep("  stLoad(D.structs); state.profile.vips = (D.profile","  stLoad(D.structs); if (D.revs) rvLoad(D.revs); else { state.revs = []; state.rvSel = -1; RV_SIG = ''; } state.profile.vips = (D.profile")
rep("  state.structs.forEach(t => { t.sta = +(S - t.sta).toFixed(3); t.dir = -t.dir; t.dz = -(t.dz || 0); });","  state.structs.forEach(t => { t.sta = +(S - t.sta).toFixed(3); t.dir = -t.dir; t.dz = -(t.dz || 0); });\n  rvReverse(S);")
rv_card = """        <div class="sec-card" id="rvCard">
          <div class="sec-title"><span>🧱 護岸（左右岸各自設定）</span><span class="badge-pill" id="rvBadge">0 段</span></div>
          <div id="rvBox"></div>
          <div style="font-size:10.5px;color:var(--text-muted);margin-top:6px;line-height:1.5;">
            每段護岸＝一岸＋起迄樁號（中心線樁號）；左右岸各自設定，曲線段兩岸實長不同，數量以<b>護岸實長</b>（沿偏移曲線）計。<b>無護岸（也無結構物）路段設計線＝地形線</b>，不產生背填；背填只出現在護岸範圍。<br>
            範本型式：重力式混凝土（背側直立、水側 1:n、矩形根入基礎、預留沉陷、開挖線、PVC 排水管）。兩段相接＝直接換型式（伸縮縫）。
          </div>
        </div>
"""
rep("外放 km 後以 1:kx 往上斜至地面/設計面較低者，列入數量表與 DXF。\n          </div>\n        </div>\n","外放 km 後以 1:kx 往上斜至地面/設計面較低者，列入數量表與 DXF。\n          </div>\n        </div>\n"+rv_card)
rep("  { name: '結構物', cards: [11], open: 11 }                // 標準圖結構物（防砂壩）              (縱斷面/橫斷面)\n];","  { name: '結構物', cards: [11], open: 11 },               // 標準圖結構物（防砂壩）              (縱斷面/橫斷面)\n  { name: '護岸', cards: [12], open: 12 }                  // 護岸（左右岸各自）                  (縱斷面/橫斷面)\n];")
rep("const VIEW_GROUPS = { '2D': [4], PROFILE: [1, 2, 3, 4], CROSS: [0, 3, 4] };","const VIEW_GROUPS = { '2D': [4, 5], PROFILE: [1, 2, 3, 4, 5], CROSS: [0, 3, 4, 5] };")
rep("  if (cards.length !== 12) return;","  if (cards.length !== 13) return;")
rep("t.textContent = v === '2D' ? '結構物' : '縱橫斷面'","t.textContent = v === '2D' ? '結構物' : '縱橫斷面'")
rep("      <button class=\"btn\" id=\"toolAddPt\" onclick=\"setTool('ADD_PT')\"","      <button class=\"btn amber\" id=\"toolAddRev\" onclick=\"state.rvMode='rev';setTool('ADD_REV')\" title=\"在中心線上依序點起點、迄點放置一段護岸（側別取『縱橫斷與土方→護岸』卡片的圖面點選側別）\">🧱 放置護岸</button>\n      <button class=\"btn\" id=\"toolAddPt\" onclick=\"setTool('ADD_PT')\"")
rep("['toolPan', 'toolFlip', 'toolAddPt', 'toolDrawAxis', 'toolAddSta', 'toolAddStruct'].forEach","['toolPan', 'toolFlip', 'toolAddPt', 'toolDrawAxis', 'toolAddSta', 'toolAddStruct', 'toolAddRev'].forEach")
rep("ADD_STA: 'toolAddSta', ADD_STRUCT: 'toolAddStruct' };","ADD_STA: 'toolAddSta', ADD_STRUCT: 'toolAddStruct', ADD_REV: 'toolAddRev' };")
rep("    ADD_STRUCT: '🏗【放置結構物】","    ADD_REV: '🧱【放置護岸】：在中心線上依序點擊「起點」與「迄點」（側別取「護岸」卡片的圖面點選側別），放置後自動回到平移模式。',\n    ADD_STRUCT: '🏗【放置結構物】")
rep("  if (state.activeTool === 'ADD_STRUCT') {\n    const proj = projectWorldPointToAlignment(wpt.x, wpt.y);","  if (state.activeTool === 'ADD_REV') {\n    const proj = projectWorldPointToAlignment(wpt.x, wpt.y);\n    if (!proj) { alert('請先繪製中心線！'); return; }\n    rvPick(proj.sta, wpt, proj);\n    return;\n  }\n  if (state.activeTool === 'ADD_STRUCT') {\n    const proj = projectWorldPointToAlignment(wpt.x, wpt.y);")
rep("  if (state.activeTool === 'ADD_STA' || state.activeTool === 'ADD_STRUCT') {\n    state.hoveredStationProj","  if (state.activeTool === 'ADD_STA' || state.activeTool === 'ADD_STRUCT' || state.activeTool === 'ADD_REV') {\n    state.hoveredStationProj")
rep("  if ((state.activeTool === 'ADD_STA' || state.activeTool === 'ADD_STRUCT') && state.hoveredStationProj) {","  if ((state.activeTool === 'ADD_STA' || state.activeTool === 'ADD_STRUCT' || state.activeTool === 'ADD_REV') && state.hoveredStationProj) {")
rep("ctx.fillText((state.activeTool === 'ADD_STRUCT' ? '🏗 點擊放置結構物: ' : '📍 點擊新增樁號: ') + formatStation(proj.sta)","ctx.fillText((state.activeTool === 'ADD_REV' ? (state.rvMode === 'raise' ? (state.rvPend ? '⬆ 點擊加高迄點: ' : '⬆ 點擊加高起點: ') : state.rvMode === 'widen' ? (state.rvPend ? '↔ 點擊拉寬迄點: ' : '↔ 點擊拉寬起點: ') : (state.rvPend ? '🧱 點擊護岸迄點: ' : '🧱 點擊護岸起點: ')) : state.activeTool === 'ADD_STRUCT' ? '🏗 點擊放置結構物: ' : '📍 點擊新增樁號: ') + formatStation(proj.sta)")
rep("<title>TurboCivil Web CAD v4.5 多中心線（主流／支流）・防砂壩標準圖・各變化段剖面土方 | v3.27 ","<title>TurboCivil Web CAD v5.5 護岸（左右岸各自・起迄樁號）・多中心線・防砂壩標準圖 | v3.27 ")
rep("TURBOCIVIL WEB CAD v4.5","TURBOCIVIL WEB CAD v5.5")

# ---- v4.7 ----
rep("""            <label class="chk-item"><input type="checkbox" id="pfShowA" checked onchange="pfRead()"> 標示縱坡交高差 A%</label>""","""            <label class="chk-item"><input type="checkbox" id="pfShowA" checked onchange="pfRead()"> 標示縱坡交高差 A%</label>
            <div style="grid-column:1 / -1;display:grid;grid-template-columns:1fr 1fr;gap:4px 8px;width:100%;">
            <label class="chk-item"><input type="checkbox" id="pfRvTL" onchange="pfRead()"> 左護岸頂線</label>
            <label class="chk-item"><input type="checkbox" id="pfRvTR" onchange="pfRead()"> 右護岸頂線</label>
            <label class="chk-item"><input type="checkbox" id="pfRvBL" onchange="pfRead()"> 左基礎底線</label>
            <label class="chk-item"><input type="checkbox" id="pfRvBR" onchange="pfRead()"> 右基礎底線</label></div>""")

rep("  if (state.activeTool === 'PAN' && state.hoveredIPIdx >= 0) {\n    pushUndoSnapshot();","  if (state.activeTool === 'PAN' && state.hoveredIPIdx < 0 && rvMouseDown(mx, my, wpt)) return;\n  if (state.activeTool === 'PAN' && state.hoveredIPIdx >= 0) {\n    pushUndoSnapshot();")
rep("  if (state.draggingIPIdx >= 0) {\n    state.axisNodes[state.draggingIPIdx].x","  if (state.rvDrag) { rvDragMove(wpt, e.shiftKey); return; }\n  if (state.draggingIPIdx >= 0) {\n    state.axisNodes[state.draggingIPIdx].x")
rep("window.addEventListener('mouseup', () => {\n  if (state.draggingIPIdx >= 0) {","window.addEventListener('mouseup', () => {\n  rvDragEnd();\n  if (state.draggingIPIdx >= 0) {")

rep("  if (isDragging && (state.activeTool === 'PAN' || e.buttons === 4)) {","  if (!isDragging && state.activeTool === 'PAN' && !state.rvDrag) rvHover(wpt);\n  if (isDragging && (state.activeTool === 'PAN' || e.buttons === 4)) {")

# ---- v5.0 ----
rep("  const minOff = sec.samples[0].offset, maxOff = sec.samples[sec.samples.length - 1].offset;\n  let minZ = Infinity, maxZ = -Infinity;\n  sec.samples.forEach(s => { minZ = Math.min(minZ, s.groundZ, s.desZ); maxZ = Math.max(maxZ, s.groundZ, s.desZ); });",
    "  const [minOff, maxOff] = crossCropRange(sec);   // 顯示範圍（結構物／護岸外側 + m；或全寬）\n  let minZ = Infinity, maxZ = -Infinity;\n  secCropSamples(sec, minOff, maxOff).forEach(s => { minZ = Math.min(minZ, s.groundZ, s.desZ); maxZ = Math.max(maxZ, s.groundZ, s.desZ); });")
rep("function drawSingleCrossSectionBox(sec, bx, by, bw, bh, isLarge, isSelected = false, _idx = 0, ppm = 0) {",
    "function drawSingleCrossSectionBox(sec, bx, by, bw, bh, ...rest) {   // 裁切於框內（顯示範圍外的地形線不畫出框）\n  ctx.save(); ctx.beginPath(); ctx.rect(bx - 1, by - 1, bw + 2, bh + 2); ctx.clip(); window.CXL = [];   // 本框標註避讓登記\n  const full = sec.samples, cr = crossCropRange(sec); if (cr[0] > full[0].offset + 1e-6 || cr[1] < full[full.length - 1].offset - 1e-6) sec.samples = secCropSamples(sec, cr[0], cr[1]);\n  try { return drawSingleCrossSectionBox_raw(sec, bx, by, bw, bh, ...rest); } finally { sec.samples = full; ctx.restore(); }\n}\nfunction drawSingleCrossSectionBox_raw(sec, bx, by, bw, bh, isLarge, isSelected = false, _idx = 0, ppm = 0) {")
rep("    const cutP = [], fillP = [], mk = (oa, ga, da, ob, gb, db) => [[sx(oa), sy(ga)], [sx(ob), sy(gb)], [sx(ob), sy(db)], [sx(oa), sy(da)]];\n    for (let i = 0; i < sec.samples.length - 1; i++) {\n      const s1 = sec.samples[i], s2 = sec.samples[i + 1],",
    "    const SS = secCropSamples(sec, r.minOff, r.maxOff);   // 顯示範圍\n    const cutP = [], fillP = [], mk = (oa, ga, da, ob, gb, db) => [[sx(oa), sy(ga)], [sx(ob), sy(gb)], [sx(ob), sy(db)], [sx(oa), sy(da)]];\n    for (let i = 0; i < SS.length - 1; i++) {\n      const s1 = SS[i], s2 = SS[i + 1],")
rep("    D.poly(sec.samples.map(s => [sx(s.offset), sy(s.desZ)]), 'SEC_DESIGN', 5);\n    D.poly(sec.samples.map(s => [sx(s.offset), sy(s.groundZ)]), 'SEC_GROUND', 7);",
    "    D.poly(SS.map(s => [sx(s.offset), sy(s.desZ)]), 'SEC_DESIGN', 5);\n    D.poly(SS.map(s => [sx(s.offset), sy(s.groundZ)]), 'SEC_GROUND', 7);")
rep('          <label style="display:flex;gap:4px;align-items:center;font-size:12px;color:#ffd08a;" title="有結構物的斷面',
    '          <label style="display:flex;gap:4px;align-items:center;font-size:12px;color:#cbd5e1;" title="顯示範圍：結構物／護岸（含開挖線）及設計異於地形處，再往外 m 公尺；全寬＝取樣全寬（DXF 同步）">顯示範圍 <select id="ccMode" class="input-num" style="width:auto;padding:1px 3px;" onchange="crossCropSet(this.value===\'crop\',null)"><option value="crop">結構物/護岸外 +</option><option value="full">全寬</option></select><input id="ccM" class="input-num" type="number" step="1" min="0" value="10" style="width:46px;padding:1px 3px;" onchange="crossCropSet(null,this.value)">m</label>\n          <label style="display:flex;gap:4px;align-items:center;font-size:12px;color:#ffd08a;" title="有結構物的斷面')
rep("state.rvMode === 'raise' ? (state.rvPend ? '⬆ 點擊加高迄點: ' : '⬆ 點擊加高起點: ')","state.rvMode === 'end' ? (state.rvPickWh === 's1' ? '📌 點擊取迄點樁號: ' : '📌 點擊取起點樁號: ') : state.rvMode === 'raise' ? (state.rvPend ? '⬆ 點擊加高迄點: ' : '⬆ 點擊加高起點: ')")

# ---- v5.1 VIP ----
rep("""    const padL = 95, padR = 45;
    const graphW = Math.max(100, rect.width / state.textScale - padL - padR);
    const _b = camInv(mx, my);
    const ratio = Math.max(0, Math.min(1, (_b.x - padL) / graphW));
    const minSta = state.sections[0].sta, maxSta = state.sections[state.sections.length - 1].sta;
    const targetSta = minSta + ratio * (maxSta - minSta);
    const pv = state.profileView;""","""    const pv = state.profileView, _b = camInv(mx, my);   // v5.1：以縱斷面圖實際繪圖範圍換算（水平比例／範圍不同時才不會偏）
    const padL = pv ? pv.padL : 95, graphW = pv ? pv.graphW : Math.max(100, rect.width / state.textScale - padL - 45);
    const ratio = Math.max(0, Math.min(1, (_b.x - padL) / graphW));
    const minSta = pv ? pv.minSta : state.sections[0].sta, maxSta = pv ? pv.maxSta : state.sections[state.sections.length - 1].sta;
    const targetSta = minSta + ratio * (maxSta - minSta);""")
rep("  state.profile.vips.push({ sta, z, L: 20 });","  state.profile.vips.push({ sta, z, L: 0 });")
rep("預設豎曲線 L=20 m，可於左側表格修改。","折線（L=0；需要豎曲線時於左側表格填 L）。")
rep("  state.profile.vips.push({ sta: +sta.toFixed(3), z: +(ref.z + g / 100 * d).toFixed(3), L: 20 });","  state.profile.vips.push({ sta: +sta.toFixed(3), z: +(ref.z + g / 100 * d).toFixed(3), L: 0 });")
rep("""          <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;margin-bottom:6px;">
            <button class="btn cyan-strong" style="justify-content:center;" onclick="addVip()">＋ 新增 VIP</button>
            <button class="btn" style="justify-content:center;" onclick="initVipsFromSimple()">單坡 → VIP</button>
            <button class="btn" style="justify-content:center;" onclick="clearVips()">清除回單坡</button>
          </div>""","""          <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;margin-bottom:6px;">
            <button class="btn cyan-strong" style="justify-content:center;" onclick="addVip()">＋ 新增 VIP</button>
            <button class="btn" style="justify-content:center;" onclick="initVipsFromSimple()">單坡 → VIP</button>
            <button class="btn" style="justify-content:center;" onclick="clearVips()">清除回單坡</button>
            <button class="btn" style="justify-content:center;grid-column:1 / span 3;" onclick="vipAllPolyline()" title="所有 VIP 的豎曲線長 L 設為 0（縱斷面設計線改為折線）">全部改成折線（L＝0）</button>
          </div>""")
rep("function addVip(sta, z) {","""function vipAllPolyline() {
  const V = state.profile.vips; if (!V.length) { updateStatus('目前沒有 VIP。'); return; }
  const n = V.filter(v => (+v.L || 0) > 0).length; if (!n) { updateStatus('所有 VIP 已是折線（L＝0）。'); return; }
  pushUndoSnapshot(); V.forEach(v => { v.L = 0; }); rebuildAlignmentAndSections(); updateStatus(`📈 已將 ${n} 個 VIP 的豎曲線改為折線（L＝0）。`);
}
function addVip(sta, z) {""")

# ---- v5.2 ----
rep("  tag(gZ, '#ffffff', gUp); tag(dZ, '#7db4ff', !gUp);","  tag(gZ, '#ffffff', gUp); if (!stAtSec(sec).some(st => Math.abs(stPlace(st).zS - dZ) < 0.02)) tag(dZ, '#7db4ff', !gUp);   // 設計高＝結構物頂者不重複標")
rep("    tag(gZ, 7, gZ >= dZ); tag(dZ, 5, !(gZ >= dZ));","    tag(gZ, 7, gZ >= dZ); if (!stAtSec(sec).some(st => Math.abs(stPlace(st).zS - dZ) < 0.02)) tag(dZ, 5, !(gZ >= dZ));")

# ---- v5.2 縱斷面 DXF A3 分張 ----
rep("""function dxfProfile(D, X0, yTop) {
  const secs = state.sections, PF = state.pf, PC = state.profile.calc;
  if (secs.length < 2 || !PC.length) return yTop;
  const minSta = secs[0].sta, maxSta = secs[secs.length - 1].sta, L = (maxSta - minSta) || 1;""","""function dxfProfile(D, X0, yTop) {   // v5.2：超過 A3 時依水平比例（自動＝1:500）分張，相鄰重疊 10 m，畫接續線與 A3 圖框
  const PF = state.pf, S = state.sections; if (S.length < 2 || !state.profile.calc.length) return yTop;
  const a = S[0].sta, b = S[S.length - 1].sta, Hs = PF.hScale > 0 ? PF.hScale : 500, w0 = 0.38 * Hs, th0 = Math.max(0.25, 0.0025 * Hs), span = Math.max(30, w0 - 16 * th0)   /* 分張字高＝紙上 2.5 mm */, OV = 10;
  if (!window.DXF_PKG && (PF.a3 === false || b - a <= span + 1e-6)) return dxfProfileOne(D, X0, yTop, null, null);
  const R = []; for (let s0 = a; ; ) { const e = Math.min(b, s0 + span); R.push([s0, e]); if (e >= b - 1e-6) break; s0 = e - OV; }
  const n = R.length, ML = R.slice(0, -1).map(r => r[1] - OV / 2); let y = yTop;
  R.forEach((r, k) => { const yy = dxfProfileOne(D, X0, y, r, { k: k + 1, n, ml: ML, Hs, th: th0 }); y = Math.min(yy, y - 0.297 * Hs) - 0.04 * Hs; });
  return y;
}
function dxfProfileOne(D, X0, yTop, R0, SH) {
  const ALL = state.sections, PF = state.pf, PC = state.profile.calc;
  if (ALL.length < 2 || !PC.length) return yTop;
  const minSta = R0 ? R0[0] : ALL[0].sta, maxSta = R0 ? R0[1] : ALL[ALL.length - 1].sta, L = (maxSta - minSta) || 1;
  const secs = R0 ? ALL.filter(s => s.sta >= minSta - 1e-6 && s.sta <= maxSta + 1e-6) : ALL;""")
rep("  const th = Math.max(1.2, Math.min(4, L / 160)), ch = th * 0.8;       // 標題/標籤字高、資料框字高 (m)","  const th = SH ? SH.th : Math.max(1.2, Math.min(4, L / 160)), ch = th * 0.8;       // 標題/標籤字高、資料框字高 (m)")
rep("  D.text(X0, yTop - 1.6 * th, th * 1.6, PF.title || '縱斷面圖', 'PROF_TEXT', 7);","  D.text(X0, yTop - 1.6 * th, th * 1.6, (PF.title || '縱斷面圖') + (SH ? `（第 ${SH.k}／${SH.n} 張）　${formatStation(minSta)}～${formatStation(maxSta)}　A3 比例 1:${SH.Hs}` : ''), 'PROF_TEXT', 7);")
rep("""  PC.forEach((v, i) => {
    if (i === 0 || i === PC.length - 1) return;
    const x = X(v.sta), y = Y(v.z - dropShiftAt(v.sta, false)), r = th * 0.5;""","""  PC.forEach((v, i) => {
    if (i === 0 || i === PC.length - 1 || v.sta < minSta - 1e-6 || v.sta > maxSta + 1e-6) return;
    const x = X(v.sta), y = Y(v.z - dropShiftAt(v.sta, false)), r = th * 0.5;""")
rep("""      PC.forEach((v, i) => {
        if (i === 0 || i === PC.length - 1) return;
        const x = X(v.sta); D.circle(x, mid, th * 3.3, 'PROF_TABLE', 7);""","""      PC.forEach((v, i) => {
        if (i === 0 || i === PC.length - 1 || v.sta < minSta - 1e-6 || v.sta > maxSta + 1e-6) return;
        const x = X(v.sta); D.circle(x, mid, th * 3.3, 'PROF_TABLE', 7);""")
rep("""    const a = ln.pts[0].sta, bq = ln.pts[ln.pts.length - 1].sta, pts = [];""","""    const a = Math.max(minSta, ln.pts[0].sta), bq = Math.min(maxSta, ln.pts[ln.pts.length - 1].sta), pts = []; if (!(bq > a)) return;""")
rep("""      IPS.forEach((ip, i) => { if (i === 0 || i === IPS.length - 1) return; const yo = ip.ccw ? yb + off : yb - off; pts.push([X(ip.bcSta), yb], [X(ip.bcSta), yo], [X(ip.ecSta), yo], [X(ip.ecSta), yb]); mids.push(ip); });""","""      const Xc = s => X(Math.max(minSta, Math.min(maxSta, s)));
      IPS.forEach((ip, i) => { if (i === 0 || i === IPS.length - 1 || ip.ecSta < minSta || ip.bcSta > maxSta) return; const yo = ip.ccw ? yb + off : yb - off; pts.push([Xc(ip.bcSta), yb], [Xc(ip.bcSta), yo], [Xc(ip.ecSta), yo], [Xc(ip.ecSta), yb]); if (ip.mcSta >= minSta && ip.mcSta <= maxSta) mids.push(ip); });""")
rep("""  D.line(X0 - labelW, bandTop, 0, X0 - labelW, yy, 0, 'PROF_TABLE', 7); D.line(xR, bandTop, 0, xR, yy, 0, 'PROF_TABLE', 7);
  return yy;
}""","""  D.line(X0 - labelW, bandTop, 0, X0 - labelW, yy, 0, 'PROF_TABLE', 7); D.line(xR, bandTop, 0, xR, yy, 0, 'PROF_TABLE', 7);
  if (SH) {   // 接續線＋A3 圖框
    SH.ml.forEach((m, j) => { if (m < minSta - 1e-6 || m > maxSta + 1e-6) return; const to = m >= maxSta - 10 ? SH.k + 1 : SH.k - 1;
      D.line(X(m), yy, 0, X(m), yBase + H, 0, 'PROF_MATCH', 1, 'DASHED'); D.text(X(m), yBase + H + th * 0.4, th * 0.8, `接續線 ${formatStation(m)}（接第 ${to} 張）`, 'PROF_MATCH', 1, { align: m >= maxSta - 10 ? 'r' : 'l' }); });
    const fx0 = X0 - labelW - 2 * th, fy1 = yTop + th, fw = 0.42 * SH.Hs, fh = 0.297 * SH.Hs;
    D.poly([[fx0, fy1], [fx0 + fw, fy1], [fx0 + fw, fy1 - fh], [fx0, fy1 - fh]], 'PROF_SHEET', 8, 0, true);
    if (yy < fy1 - fh + (window.DXF_TB_MM || 0) * SH.Hs / 1000) D.text(fx0 + th, fy1 - fh + th, th * 0.8, '※ 本張高度超出 A3（請調整垂直誇大或水平比例）', 'PROF_SHEET', 1);
  }
  return yy;
}""")
rep("  P.hScale = Math.max(0, parseFloat(g('pfHScale').value) || 0);","  P.a3 = !g('pfA3') || g('pfA3').checked; P.hScale = Math.max(0, parseFloat(g('pfHScale').value) || 0);")

# ---- v5.2 橫斷面 DXF A3 分頁 ----
rep("""  const cw = Math.max(...dims.map(d => d.w)) + GAP, chh = Math.max(...dims.map(d => d.h)) + GAP;
  secs.forEach((sec, idx) => {
    const { r, w, h } = dims[idx], col = idx % COLS, row = Math.floor(idx / COLS), bx = X0 + col * cw, by = Ytop - row * chh - h;""","""  const cw = Math.max(...dims.map(d => d.w)) + GAP, chh = Math.max(...dims.map(d => d.h)) + GAP;
  const a3 = !document.getElementById('cxA3') || document.getElementById('cxA3').checked || !!window.DXF_PKG, POS = [], SHEETS = [];
  if (a3) {   // v5.2：依比例排入 A3 圖框（左 25 mm、其他 10 mm 邊界，上方留標題列）；單一斷面超出 A3 者獨占一頁並註記
    const FW = 0.42 * S0, FH = 0.297 * S0, mL = 0.025 * S0, mO = 0.01 * S0, tH = 0.012 * S0, UW = FW - mL - mO, UH = FH - 2 * mO - tH - (window.DXF_TB_MM || 0) * S0 / 1000, SG = 0.03 * S0;
    let sh = null, cx = 0, cy = 0, rowH = 0;
    const newSheet = () => { const k = SHEETS.length; sh = { k, x0: X0 + (k % 5) * (FW + SG), y1: Ytop - Math.floor(k / 5) * (FH + SG), FW, FH, mL, mO, tH, ids: [], over: false }; SHEETS.push(sh); cx = 0; cy = 0; rowH = 0; };
    dims.forEach((d, idx) => {
      const w = d.w + GAP, h = d.h + GAP; if (!sh) newSheet();
      if (d.w > UW || d.h > UH) { if (sh.ids.length) newSheet(); sh.over = true; POS[idx] = [sh.x0 + mL, sh.y1 - mO - tH - d.h]; sh.ids.push(idx); sh = null; return; }
      if (cx > 0 && cx + d.w > UW) { cx = 0; cy += rowH; rowH = 0; }
      if (cy + d.h > UH) { newSheet(); }
      POS[idx] = [sh.x0 + mL + cx, sh.y1 - mO - tH - cy - d.h]; sh.ids.push(idx); cx += w; rowH = Math.max(rowH, h);
    });
    SHEETS.forEach((S, k) => { const a = secs[S.ids[0]], b = secs[S.ids[S.ids.length - 1]]; D.poly([[S.x0, S.y1], [S.x0 + S.FW, S.y1], [S.x0 + S.FW, S.y1 - S.FH], [S.x0, S.y1 - S.FH]], 'SEC_SHEET', 8, 0, true);
      D.text(S.x0 + S.mL, S.y1 - S.mO - S.tH * 0.7, S.tH * 0.32, `橫斷面圖（第 ${k + 1}／${SHEETS.length} 頁）　${a.shortStaLabel}～${b.shortStaLabel}　比例 1:${S0}` + (S.over ? '　※ 斷面超出 A3（獨立一頁）' : ''), 'SEC_SHEET', S.over ? 1 : 7); });
  }
  secs.forEach((sec, idx) => {
    const { r, w, h } = dims[idx], col = idx % COLS, row = Math.floor(idx / COLS), bx = a3 ? POS[idx][0] : X0 + col * cw, by = a3 ? POS[idx][1] : Ytop - row * chh - h;""")
rep("""            <input type="number" class="input-num" id="crossScale" value="200" min="0" step="50" onchange="requestRedraw()" title="單一樁號放大圖的真實比例(橫縱同比例，以96dpi換算)"></div>""","""            <input type="number" class="input-num" id="crossScale" value="200" min="0" step="50" onchange="requestRedraw()" title="單一樁號放大圖的真實比例(橫縱同比例，以96dpi換算)"></div>
          <div class="form-row"><label class="chk-item" title="匯出 DXF 時，橫斷面依上方比例排入 A3 圖框，排滿換頁（0＝1:200）"><input type="checkbox" id="cxA3" checked> DXF 橫斷面依 A3 分頁</label></div>""")
rep("""<input type="number" class="input-num" id="pfHScale" value="0" min="0" step="100" onchange="pfRead()" title="例：1000 表示 1:1000；以 96dpi 螢幕換算，數值愈小圖愈長"></div>""","""<input type="number" class="input-num" id="pfHScale" value="0" min="0" step="100" onchange="pfRead()" title="例：1000 表示 1:1000；以 96dpi 螢幕換算，數值愈小圖愈長"></div>
          <div class="form-row"><label class="chk-item" title="DXF 縱斷面超過 A3 寬度時自動分張：比例取橫向比例（0＝1:500），相鄰兩張重疊 10 m，並畫接續線與 A3 圖框"><input type="checkbox" id="pfA3" checked onchange="pfRead()"> DXF 超過 A3 自動分張（重疊 10 m）</label></div>""")

rep("""  const ex = (state.profileView && state.profileView.effEx > 0) ? state.profileView.effEx : 5;   // 沿用畫面上的垂直誇大倍率""","""  let ex = (state.profileView && state.profileView.effEx > 0) ? state.profileView.effEx : 5;   // 沿用畫面上的垂直誇大倍率
  if (SH) {   // A3 分張：縱向比例有設定者依設定；否則縮小垂直誇大使圖＋資料框放進 A3 高度
    const nR = PF.rows.length, tblH = nR * 6 * th + (PF.rows.includes('grade') ? 3.5 * th : 0) + (PF.rows.includes('curve') ? 4.5 * th : 0) + (PF.rows.includes('note') ? 4 * th : 0);
    const avail = 0.297 * SH.Hs - 0.02 * SH.Hs - 9 * th - tblH - 2 * th - (window.DXF_TB_MM || 0) * SH.Hs / 1000;
    ex = PF.vScale > 0 ? SH.Hs / PF.vScale : Math.max(1, Math.min(ex, avail / Math.max(1, maxZ - minZ)));
  }""")

# ---- v5.3 ----
rep("      if (inR(v.sta)) keyStations.push({ s: v.sta, ptName: 'VIP' + i, priority: 2, isCurveTick: false });","      if (inR(v.sta) && !(state.structs || []).some(st => Math.abs(st.sta - v.sta) < 1.0)) keyStations.push({ s: v.sta, ptName: 'VIP' + i, priority: 2, isCurveTick: false });   // 變坡點距結構物 1 m 內：併入結構物樁號，不另生斷面")

# ---- v5.4 縱斷面 A3 分張：每張只依該段高程範圍（縱向截斷），各張共用垂直誇大；表格貼近圖 ----
rep("""function dxfProfile(D, X0, yTop) {   // v5.2""","""function pfZRangeIn(a, b, wantL, wantR) {   // v5.4：某樁號範圍內的高程範圍（分張用，含少量上下留白）
  let lo = Infinity, hi = -Infinity; const inc = z => { if (z == null || !Number.isFinite(z)) return; lo = Math.min(lo, z); hi = Math.max(hi, z); };
  state.sections.forEach(s => { if (s.sta < a - 1e-6 || s.sta > b + 1e-6) return; inc(s.groundCenter); inc(s.desCenterZ); if (wantL) inc(secSideZ(s, 'l')); if (wantR) inc(secSideZ(s, 'r')); });
  const n = Math.max(20, Math.ceil((b - a) / 2)); for (let i = 0; i <= n; i++) inc(getDesignZ(a + (b - a) * i / n));
  state.profile.calc.forEach(v => { if (v.sta >= a - 1e-6 && v.sta <= b + 1e-6) inc(v.z - dropShiftAt(v.sta, false)); });
  stIncZ(inc, a, b); rvIncZ(inc, a, b);
  state.pf.lines.forEach(ln => { if (!ln.vis || ln.pts.length < 2) return; const p0 = Math.max(a, ln.pts[0].sta), p1 = Math.min(b, ln.pts[ln.pts.length - 1].sta); for (let k = 0; k <= 20 && p1 >= p0; k++) inc(lineZ(ln, p0 + (p1 - p0) * k / 20)); });
  if (!Number.isFinite(lo)) return null;
  const zr = Math.max(2, hi - lo); return { lo: Math.floor((lo - Math.max(0.5, zr * 0.04)) * 2) / 2, hi: Math.ceil((hi + Math.max(1.5, zr * 0.10)) * 2) / 2 };
}
function dxfProfile(D, X0, yTop) {   // v5.2""")
rep("""  R.forEach((r, k) => { const yy = dxfProfileOne(D, X0, y, r, { k: k + 1, n, ml: ML, Hs, th: th0 }); y = Math.min(yy, y - 0.297 * Hs) - 0.04 * Hs; });""","""  const wL = PF.rows.includes('lt'), wR = PF.rows.includes('rt'), ZR = R.map(r => pfZRangeIn(r[0], r[1], wL, wR));
  const nR = PF.rows.length, tblH = nR * 6 * th0 + (PF.rows.includes('grade') ? 3.5 * th0 : 0) + (PF.rows.includes('curve') ? 4.5 * th0 : 0) + (PF.rows.includes('note') ? 4 * th0 : 0), avail = 0.297 * Hs - 0.02 * Hs - 9 * th0 - tblH - 2 * th0 - (window.DXF_TB_MM || 0) * Hs / 1000;
  let ex = (state.profileView && state.profileView.effEx > 0) ? state.profileView.effEx : 5;   // 各張共用同一垂直誇大（取最高那張可放進 A3 者）
  ex = PF.vScale > 0 ? Hs / PF.vScale : Math.max(1, Math.min(ex, ...ZR.map(z => z ? avail / Math.max(1, z.hi - z.lo) : Infinity)));
  R.forEach((r, k) => { const yy = dxfProfileOne(D, X0, y, r, { k: k + 1, n, ml: ML, Hs, th: th0, zr: ZR[k], ex }); y = Math.min(yy, y - 0.297 * Hs) - 0.04 * Hs; });""")
rep("""  const zr0 = Math.max(4, maxZ - minZ); minZ = Math.floor(minZ - zr0 * 0.15); maxZ = Math.ceil(maxZ + zr0 * 0.15);""","""  const zr0 = Math.max(4, maxZ - minZ); minZ = Math.floor(minZ - zr0 * 0.15); maxZ = Math.ceil(maxZ + zr0 * 0.15);
  if (SH && SH.zr) { minZ = SH.zr.lo; maxZ = SH.zr.hi; }   // v5.4：分張時縱向只取本張範圍（截斷），圖底貼近曲線、表格隨之上移""")
rep("""    ex = PF.vScale > 0 ? SH.Hs / PF.vScale : Math.max(1, Math.min(ex, avail / Math.max(1, maxZ - minZ)));
  }""","""    ex = PF.vScale > 0 ? SH.Hs / PF.vScale : Math.max(1, Math.min(ex, avail / Math.max(1, maxZ - minZ)));
    if (SH.ex) ex = SH.ex;
  }""")
rep("""  let yy = yBase - 2 * th;
  const bandTop = yy;""","""  let yy = yBase - (SH ? 0.8 : 2) * th;
  const bandTop = yy;""")


# ---- v5.6：網頁標誌（砥柱 DiZhu 圖標，取代 TC 字樣；favicon 一併加上） ----
DIZHU_MARK_B64 = "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"
rep('''<link rel="preconnect" href="https://fonts.googleapis.com">''', f'''<link rel="icon" type="image/png" href="data:image/png;base64,{DIZHU_MARK_B64}">
<link rel="preconnect" href="https://fonts.googleapis.com">''')
rep('''<div class="brand-logo">TC</div>''', f'''<img class="brand-logo" src="data:image/png;base64,{DIZHU_MARK_B64}" alt="砥柱 DiZhu">''')
rep('''  .brand-logo {
    width: 28px; height: 28px;
    background: linear-gradient(135deg, #00f0ff22, #ffaa0022);
    border: 1px solid var(--cad-cyan);
    display: grid;
    place-items: center;
    font-family: var(--font-mono);
    font-weight: 700;
    color: var(--cad-cyan);
    font-size: 13px;
    box-shadow: 0 0 10px rgba(0, 240, 255, 0.25);
  }''', '''  .brand-logo {
    width: 30px; height: 30px;
    object-fit: cover;
    border-radius: 7px;
    flex-shrink: 0;
    box-shadow: 0 0 10px rgba(217, 155, 59, 0.3);
  }''')

# ---- v5.6：移除「TurboCivil」文字，改用「砥柱 DiZhu」品牌名（舊 .tcproj 專案檔仍可讀取） ----
rep("TurboCivil Web CAD v3.2", "砥柱 DiZhu")
rep("TurboCivil Web CAD v5.5", "砥柱 DiZhu v5.5")
rep("TURBOCIVIL WEB CAD v5.5", "砥柱 DiZhu CAD v5.5")
rep("app: 'TurboCivil', schema: 1, version:", "app: 'DiZhu', schema: 1, version:")
rep("obj.app !== 'TurboCivil'", "!['TurboCivil', 'DiZhu'].includes(obj.app)")
rep("TurboCivil專案_", "砥柱專案_")
rep("TurboCivil 專案檔", "砥柱 DiZhu 專案檔", 2)
rep("TurboCivil_Alignment_And_Stations.csv", "DiZhu_Alignment_And_Stations.csv")
rep("TurboCivil_Alignment_And_Sections.dxf", "DiZhu_Alignment_And_Sections.dxf", 2)

# ---- v5.6b：品牌字改中英文上下兩排（砥柱／DiZhu），比照標誌排法 ----
rep("""  .brand-title { font-family: var(--font-display); font-weight: 700; font-size: 14px; color: #fff; }""",
    """  .brand-title { font-family: var(--font-display); font-weight: 700; font-size: 15px; color: #fff; display: block; line-height: 1.15; letter-spacing: 1px; }
  .brand-title-en { font-family: var(--font-mono); font-weight: 600; font-size: 10px; letter-spacing: 3px; color: var(--cad-amber); display: block; line-height: 1.3; }""")
rep("""<span class="brand-title">砥柱 DiZhu CAD v5.5</span>""",
    """<span class="brand-title">砥柱</span><span class="brand-title-en">DiZhu CAD v5.5</span>""")

# ---- v5.6c：品牌字中英文同寬、拿掉「CAD」 ----
rep("""  .brand-title { font-family: var(--font-display); font-weight: 700; font-size: 15px; color: #fff; display: block; line-height: 1.15; letter-spacing: 1px; }
  .brand-title-en { font-family: var(--font-mono); font-weight: 600; font-size: 10px; letter-spacing: 3px; color: var(--cad-amber); display: block; line-height: 1.3; }""",
    """  .brand-titlewrap { display: flex; flex-direction: column; width: 56px; }
  .brand-title { font-family: var(--font-display); font-weight: 700; font-size: 16px; color: #fff; display: block; line-height: 1.15; white-space: nowrap; }
  .brand-title-en { font-family: var(--font-mono); font-weight: 600; font-size: 10px; color: var(--cad-amber); display: block; line-height: 1.3; white-space: nowrap; text-align: justify; text-align-last: justify; }""")
rep("""<span class="brand-title">砥柱</span><span class="brand-title-en">DiZhu CAD v5.5</span>""",
    """<div class="brand-titlewrap"><span class="brand-title">砥柱</span><span class="brand-title-en">DiZhu v5.5</span></div>""")

# ==== v5.6：底圖、整治區、土方表、DEM、固床工型式 ====
rep("  drawCADGrid(w, h);\n", "  drawCADGrid(w, h);\n  dzDrawBasemap(w, h);\n")
rep("  rvDrawPlan();\n  stDrawNorth();\n", "  rvDrawPlan();\n  dzDrawPlan();\n  stDrawNorth();\n")
rep("  if (state.points.length === 0) return null;\n  let b1 = null, b2 = null, b3 = null;", "  { const dz = typeof dzDemZ === 'function' ? dzDemZ(x, y) : null; if (dz !== null) return dz; }   // v5.6：三角網以外以 DEM 補注\n  if (state.points.length === 0) return null;\n  let b1 = null, b2 = null, b3 = null;")
rep("  renderStationMileageTable();\n  stRecalc();\n", "  renderStationMileageTable();\n  stRecalc();\n  if (typeof dzAfterSections === 'function') dzAfterSections();\n")
rep("""            <button class="btn amber" style="justify-content:center;" onclick="setViewMode('CROSS')">📊 看全螢幕橫斷面</button>\n          </div>""", """            <button class="btn amber" style="justify-content:center;" onclick="setViewMode('CROSS')">📊 看全螢幕橫斷面</button>\n          </div>\n          <div id="dzEwBox"></div>""")
rep("""        <div class="panel-tab" onclick="switchSideTab('tab-earth', this)" data-tab="tab-earth">縱橫斷面</div>""", """        <div class="panel-tab" onclick="switchSideTab('tab-earth', this)" data-tab="tab-earth">縱橫斷面</div>\n        <div class="panel-tab" onclick="switchSideTab('tab-dz', this);dzPanelUI();" data-tab="tab-dz">崩塌地</div>""")
rep("""      <div class="panel-body" id="tab-earth" style="display:none;">""", """      <div class="panel-body" id="tab-dz" style="display:none;"><div id="dzPanel"></div></div>\n      <div class="panel-body" id="tab-earth" style="display:none;">""")
rep("  ['tab-data', 'tab-align', 'tab-tin', 'tab-earth'].forEach(id => {", "  ['tab-data', 'tab-align', 'tab-tin', 'tab-earth', 'tab-dz'].forEach(id => {")
rep("const VIEW_TABS = { '2D': ['tab-data', 'tab-align', 'tab-tin', 'tab-earth'],", "const VIEW_TABS = { '2D': ['tab-data', 'tab-align', 'tab-tin', 'tab-earth', 'tab-dz'],")
rep("DiZhu v5.5", "DiZhu v8.5", 2)
rep("  state.profileView = { padL, padT, graphW, graphH, minSta, maxSta, minZ, maxZ, effEx };", "  state.profileView = { padL, padT, padB, graphW, graphH, minSta, maxSta, minZ, maxZ, effEx };")
src = re.sub(r'<title>[^<]*</title>', '<title>砥柱 DiZhu v8.5 — 水保構造物縱橫斷面 CAD（結構物・護岸・土方・崩塌地整治）</title>', src, count=1)
n0 = len(re.findall(r' ?[\(（](?:手冊)?第[0-9.~～、\-]+[章節條][\)）]', src)); src = re.sub(r' ?[\(（](?:手冊)?第[0-9.~～、\-]+[章節條][\)）]', '', src)
if n0 != 4: sys.exit(f'chapter refs {n0}')

# ==== v5.7：開挖整併（橫斷面只標加總挖填；結構物開挖另計） ====
rep("挖:${sec.cutArea.toFixed(1)}㎡  填:${sec.fillArea.toFixed(1)}㎡`", "${dzSecCFtxt(sec, '㎡')}`")
rep("挖:${sec.cutArea.toFixed(1)}m2  填:${sec.fillArea.toFixed(1)}m2`", "${dzSecCFtxt(sec, 'm2')}`")
rep('''      <td style="color:var(--cad-yellow)">${sec.cutArea.toFixed(1)}</td>
      <td style="color:var(--cad-red)">${sec.fillArea.toFixed(1)}</td>''', '''      ${(q => q.ex ? `<td colspan="2" style="color:#fb923c;font-size:10px;">${q.ex.name}另計</td>` : `<td style="color:var(--cad-yellow)">${q.cut.toFixed(1)}</td><td style="color:var(--cad-red)">${q.fill.toFixed(1)}</td>`)(dzSecCF(sec))}''')
rep("${s.cutArea.toFixed(2)},${s.fillArea.toFixed(2)}\\n`", "${(q => q.ex ? '另計,另計' : q.cut.toFixed(2) + ',' + q.fill.toFixed(2))(dzSecCF(s))}\\n`")
rep('''  for (let i = 0; i < sections.length - 1; i++) {
    const L = sections[i+1].sta - sections[i].sta;
    secCutVol += 0.5 * (sections[i].cutArea + sections[i+1].cutArea) * L;
    secFillVol += 0.5 * (sections[i].fillArea + sections[i+1].fillArea) * L;
  }''', '''  { const T = dzEwTot(); secCutVol = T.c; secFillVol = T.f; }   // v5.7：全線土方表（河道＋護岸基礎＋背填；結構物另計）''')
# ==== v5.7：結構物名冊（新增型式改由名冊選） ====
rep("""<select class="input-select" id="stKind" style="width:78px;" title="結構物型式"><option value="dam">防砂壩</option><option value="sub">副壩</option><option value="sill">固床工</option></select>""",
    """<select class="input-select" id="stKind" style="display:none;"><option value="dam">防砂壩</option><option value="sub">副壩</option><option value="sill">固床工</option></select><button class="btn amber" id="stKindBtn" style="max-width:190px;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;" onclick="catOpen('add')" title="開啟結構物名冊選型式（依功能分類、附縮圖，可搜尋、比較）">📚 防砂壩 ▾</button>""")
# ==== v5.7：崩塌地頁籤；底圖／控制點／DEM 移到「圖層/等高線」 ====
rep("""      <div class="panel-body" id="tab-tin" style="display:none;">""", """      <div class="panel-body" id="tab-tin" style="display:none;">\n        <div id="dzMapBox"></div>""")
rep("""onclick="switchSideTab('tab-tin', this)" data-tab="tab-tin">圖層/等高線</div>""", """onclick="switchSideTab('tab-tin', this);dzMapUI();" data-tab="tab-tin">圖層/等高線</div>""")
# ==== v5.8：開啟網頁不自動載入示範地形（空白啟動＋提示） ====
rep("""  resizeCanvases();
  loadDemoTerrain();
  requestAnimationFrame(renderLoop);""", """  resizeCanvases();
  dzStartHint();
  requestAnimationFrame(renderLoop);""")
rep("""        <canvas id="cadCanvas"></canvas>""", """        <canvas id="cadCanvas"></canvas>
        <div id="dzStartHint" style="display:none;position:absolute;left:50%;top:42%;transform:translate(-50%,-50%);text-align:center;color:#94a3b8;font-size:15px;line-height:1.9;pointer-events:none;z-index:5;background:rgba(15,23,42,.55);padding:14px 22px;border:1px dashed #475569;border-radius:8px;">尚未載入地形<br>請按上方「開啟 AutoCAD (.DXF/.CSV)」匯入測量檔、「載入專案」開啟既有專案，<br>或到「圖層/等高線」按「⛰ 載入示範河道地形」試用</div>""")
rep("""<span class="badge-pill" id="ipCountBadge">4 IP</span>""", """<span class="badge-pill" id="ipCountBadge">0 IP</span>""")
# ==== v5.9：排水頁籤 ====
rep("""        <div class="panel-tab" onclick="switchSideTab('tab-dz', this);dzPanelUI();" data-tab="tab-dz">崩塌地</div>""", """        <div class="panel-tab" onclick="switchSideTab('tab-dz', this);dzPanelUI();" data-tab="tab-dz">崩塌地</div>\n        <div class="panel-tab" onclick="switchSideTab('tab-dn', this);dnPanelUI();" data-tab="tab-dn">排水</div>""")
rep("""      <div class="panel-body" id="tab-dz" style="display:none;"><div id="dzPanel"></div></div>""", """      <div class="panel-body" id="tab-dz" style="display:none;"><div id="dzPanel"></div></div>\n      <div class="panel-body" id="tab-dn" style="display:none;"><div id="dnPanel"></div></div>""")
rep("  ['tab-data', 'tab-align', 'tab-tin', 'tab-earth', 'tab-dz'].forEach(id => {", "  ['tab-data', 'tab-align', 'tab-tin', 'tab-earth', 'tab-dz', 'tab-dn'].forEach(id => {")
rep("const VIEW_TABS = { '2D': ['tab-data', 'tab-align', 'tab-tin', 'tab-earth', 'tab-dz'],", "const VIEW_TABS = { '2D': ['tab-data', 'tab-align', 'tab-tin', 'tab-earth', 'tab-dz', 'tab-dn'],")

# ==== v6.0：水力頁籤 ====
rep("""        <div class="panel-tab" onclick="switchSideTab('tab-dn', this);dnPanelUI();" data-tab="tab-dn">排水</div>""", """        <div class="panel-tab" onclick="switchSideTab('tab-dn', this);dnPanelUI();" data-tab="tab-dn">排水</div>\n        <div class="panel-tab" onclick="switchSideTab('tab-hy', this);hyPanelUI();" data-tab="tab-hy">水力</div>""")
rep("""      <div class="panel-body" id="tab-dn" style="display:none;"><div id="dnPanel"></div></div>""", """      <div class="panel-body" id="tab-dn" style="display:none;"><div id="dnPanel"></div></div>\n      <div class="panel-body" id="tab-hy" style="display:none;"><div id="hyPanel"></div></div>""")
rep("  ['tab-data', 'tab-align', 'tab-tin', 'tab-earth', 'tab-dz', 'tab-dn'].forEach(id => {", "  ['tab-data', 'tab-align', 'tab-tin', 'tab-earth', 'tab-dz', 'tab-dn', 'tab-hy'].forEach(id => {")
rep("const VIEW_TABS = { '2D': ['tab-data', 'tab-align', 'tab-tin', 'tab-earth', 'tab-dz', 'tab-dn'],", "const VIEW_TABS = { '2D': ['tab-data', 'tab-align', 'tab-tin', 'tab-earth', 'tab-dz', 'tab-dn', 'tab-hy'],")

# ==== v6.3：頁籤樣式（方案B）====
rep("</style>\n</head>", open('/home/claude/tcv4/tabs_v62.css',encoding='utf8').read()+"</style>\n</head>")

# ==== v6.3：樁號引線改短刻度 ====
rep("""      const pl = worldToScreen2D(sec.lx, sec.ly);
      const pr = worldToScreen2D(sec.rx, sec.ry);""", """      const _te = staTickEnds(sec, isSel), pl = worldToScreen2D(_te[0], _te[1]);
      const pr = worldToScreen2D(_te[2], _te[3]);""")
rep("for (const sec of state.sections) D.line(sec.lx, sec.ly, 0, sec.rx, sec.ry, 0, 'CROSS_STATIONS', sec.ptName ? 6 : 2);", "for (const sec of state.sections) { const _te = staTickEnds(sec, false); D.line(_te[0], _te[1], 0, _te[2], _te[3], 0, 'CROSS_STATIONS', sec.ptName ? 6 : 2); }")
rep("""            <label class="chk-item"><input type="checkbox" id="lyrCurveCentipede" onchange="requestRedraw()"> 曲線樁(BC/MC/EC)剖線</label>""", """            <label class="chk-item"><input type="checkbox" id="lyrCurveCentipede" onchange="requestRedraw()"> 曲線樁(BC/MC/EC)剖線</label>
            <div class="chk-item" style="gap:4px;flex-wrap:wrap;" title="樁號線：刻度＝中心線上只畫短刻度，引線單側越過河寬邊線或護岸外緣再＋N m（預設）；邊線外＝刻度與引線都越過河寬邊線；短刻度＝兩側 ±L；全寬＝舊樣式。選取中的樁號一律畫全寬。">樁號線 <select id="staTickMode" class="input-select" style="width:76px;" onchange="staTickSet('mode',this.value)"><option value="tick" selected>刻度</option><option value="edge">邊線外</option><option value="short">短刻度</option><option value="full">全寬</option></select> 刻度±<input id="staTickTk" type="number" class="input-num" style="width:56px;" step="0.5" min="0.1" value="1" onchange="staTickSet('tk',this.value)"> m<br>±L<input id="staTickLen" type="number" class="input-num" style="width:56px;" step="1" min="1" value="8" onchange="staTickSet('len',this.value)"> m　外+<input id="staTickOut" type="number" class="input-num" style="width:56px;" step="1" min="0" value="2" onchange="staTickSet('out',this.value)"> m<br>引線 <select id="staTickSide" class="input-select" style="width:70px;" onchange="staTickSet('side',this.value)"><option value="auto" selected>自動側</option><option value="L">固定左</option><option value="R">固定右</option></select><br>字高×<input id="staTickTsz" type="number" class="input-num" style="width:56px;" step="0.25" min="0.5" max="6" value="1" onchange="staTickSet('tsz',this.value)"><br>變坡點加樁 <select id="staTickVip" class="input-select" style="width:92px;" onchange="staTickSet('vip',this.value)"><option value="sta" selected>只標樁號</option><option value="hide">不標</option><option value="full">含(VIP)名</option></select></div>
            <label class="chk-item" title="平面圖右下角列出各工作項目（名稱、樁號範圍、長度）；DXF 置於平面圖右側"><input type="checkbox" id="lyrWorkTbl" checked onchange="requestRedraw()"> 工作內容表</label>""")

# ==== v6.3：整地卡片（縱橫斷面／結構物頁籤第 7 個子頁籤）====
_i = src.index('<div class="sec-card" id="rvCard">'); _d = 0; _j = _i
for _m in re.finditer(r'<div\b|</div>', src[_i:]):
    _d += 1 if _m.group(0) == '<div' else -1
    if _d == 0: _j = _i + _m.end(); break
src = src[:_j] + """
        <div class="sec-card" id="grdCard">
          <div class="sec-title"><span>⛰ 整地／崩塌地整治</span><span class="badge-pill" id="grdBadge">0 處</span></div>
          <div id="grdBox"></div>
          <div style="font-size:10.5px;color:var(--text-muted);margin-top:6px;line-height:1.5;">
            不設結構物、只整地：斷面＝基準高底面 → 1:N 邊坡（挖方／填方各自坡比）→ 每階高 h 設平台 w → 再 1:N 至地面（預設依水土保持手冊：階高 5 m、平台寬 2 m）。起點、迄點各一標準斷面，中間內插，可逐斷面覆寫；「自動挖填平衡」整體調整基準高。平面圖顯示坡趾（綠）、平台（黃虛線）、坡頂／坡腳（粉紅），範圍內原地形淡化。可沿中心線或崩塌地基準線。兩側整地範圍內，全線土方的河道挖填改由整地計算（護岸基礎開挖、背填照算）。
          </div>
        </div>""" + src[_j:]
rep("  if (cards.length !== 13) return;", "  if (cards.length !== 14) return;")
rep("  { name: '護岸', cards: [12], open: 12 }                  // 護岸（左右岸各自）                  (縱斷面/橫斷面)", "  { name: '護岸', cards: [12], open: 12 },                 // 護岸（左右岸各自）                  (縱斷面/橫斷面)\n  { name: '整地', cards: [13], open: 13 }                  // v6.3 整地／崩塌地整治")
rep("const VIEW_GROUPS = { '2D': [4, 5], PROFILE: [1, 2, 3, 4, 5], CROSS: [0, 3, 4, 5] };", "const VIEW_GROUPS = { '2D': [4, 5, 6], PROFILE: [1, 2, 3, 4, 5, 6], CROSS: [0, 3, 4, 5, 6] };")

# ==== v6.3g：樁號字高倍率、字底襯 ====
rep("const T = state.textScale, fb = 11, fs = fb * T;\n  ctx.font = fb + 'px \"JetBrains Mono\"';\n  const cwid", "const T = state.textScale, fb = 11 * staTxtK(), fs = fb * T;\n  ctx.font = fb + 'px \"JetBrains Mono\"';\n  const cwid")
rep("    if (L.flip) { ctx.textAlign = 'right'; ctx.fillText(sec.staLabel, -4 * T, fs * 0.35); }\n    else { ctx.textAlign = 'left'; ctx.fillText(sec.staLabel, 4 * T, fs * 0.35); }", "    ctx.lineJoin = 'round'; ctx.lineWidth = 3.2; ctx.strokeStyle = 'rgba(8,12,18,0.88)';\n    if (L.flip) { ctx.textAlign = 'right'; ctx.strokeText(L.text, -4 * T, fs * 0.35); ctx.fillText(L.text, -4 * T, fs * 0.35); }\n    else { ctx.textAlign = 'left'; ctx.strokeText(L.text, 4 * T, fs * 0.35); ctx.fillText(L.text, 4 * T, fs * 0.35); }")
rep("const thL = Math.max(1.6, Math.min(6, Math.max(bb.x1 - bb.x0, bb.y1 - bb.y0) / 220)), cwL = thL * 0.62;", "const thL = Math.max(1.6, Math.min(6, Math.max(bb.x1 - bb.x0, bb.y1 - bb.y0) / 220)) * staTxtK(), cwL = thL * 0.62;", 2)

# ==== v6.3i：樁號引線自刻度端起、變坡點字小一級 ====
rep("    const a = worldToScreen2D(sec.cx, sec.cy), b = worldToScreen2D(sec.cx + L.ux * L.len, sec.cy + L.uy * L.len);", "    const _s0 = L.s0 || 0, a = worldToScreen2D(sec.cx + L.ux * _s0, sec.cy + L.uy * _s0), b = worldToScreen2D(sec.cx + L.ux * L.len, sec.cy + L.uy * L.len);")
rep("ctx.font = ((isSel || sec.ptName) ? 'bold ' : '') + fb * T + 'px", "ctx.font = ((isSel || (sec.ptName && !/VIP/.test(sec.ptName))) ? 'bold ' : '') + fb * T * (L.k || 1) + 'px")
rep("D.line(sec.cx, sec.cy, 0, sec.cx + L.ux * L.len, sec.cy + L.uy * L.len, 0, 'STA_LEADER', col);", "D.line(sec.cx + L.ux * (L.s0 || 0), sec.cy + L.uy * (L.s0 || 0), 0, sec.cx + L.ux * L.len, sec.cy + L.uy * L.len, 0, 'STA_LEADER', col);", 2)
rep("D.text(tx, ty, thL, L.text, 'STA_TEXT', col,", "D.text(tx, ty, thL * (L.k || 1), L.text, 'STA_TEXT', col,", 2)
# v6.3i：自行加樁號列加「📍 圖面點擊加樁」
rep('<div style="display:flex;gap:4px;">\n              <input type="number" class="input-num" id="customStaVal"', '<div style="display:flex;gap:4px;flex-wrap:wrap;">\n              <input type="number" class="input-num" id="customStaVal"')
rep("""<button class="btn amber" onclick="addCustomStation()">加入</button>
              <button class="btn" onclick="clearCustomStations()">清空</button>""","""<button class="btn amber" onclick="addCustomStation()">加入</button>
              <button class="btn" onclick="clearCustomStations()">清空</button>
              <button class="btn magenta" onclick="staPickAdd()" title="在平面圖中心線附近點擊，自動投影算出里程並加樁">📍 圖面點擊加樁</button>""")
# v6.3i：中心線繪製輔助設定
rep("""onchange="document.getElementById('ribbonDefaultR').value=this.value;">
          </div>""","""onchange="document.getElementById('ribbonDefaultR').value=this.value;">
          </div>
          <div class="form-row" title="繪中心線時，段長取整到此間距（方向不變）；按住 Shift＝不吸附。也可直接鍵入長度：25＝沿游標方向 25 m；25<30＝方位角 30° 方向 25 m">
            <span class="form-label">繪線長度吸附</span>
            <select class="input-select" id="cldSnap" onchange="cldSet('snap',this.value)"><option value="0">不吸附</option><option value="0.5" selected>0.5 m</option><option value="1">1 m</option></select>
          </div>
          <div class="form-row"><label style="font-size:11px;"><input type="checkbox" id="cldSeg" onchange="cldSet('seg',this.checked)"> 平面圖標示各段長度與方位角（含 DXF）</label></div>""")
# v6.4：地形線透明度
rep("  if (showRawDXF && state.rawCadPolys.length > 0) {\n    ctx.lineWidth = 1.05;","  ctx.globalAlpha = dzTerrAlpha();\n  if (showRawDXF && state.rawCadPolys.length > 0) {\n    ctx.lineWidth = 1.05;")
rep("  clDrawOthers();\n  drawHorizontalAlignmentOnCanvas(showAxis","  ctx.globalAlpha = 1;\n  clDrawOthers();\n  drawHorizontalAlignmentOnCanvas(showAxis")
rep("  ctx.font = '10px \"JetBrains Mono\"'; ctx.textAlign = 'left';\n\n  for (let i = 0; i < state.points.length; i++) {","  ctx.font = '10px \"JetBrains Mono\"'; ctx.textAlign = 'left';\n  ctx.globalAlpha = dzTerrAlpha();\n\n  for (let i = 0; i < state.points.length; i++) {")
rep("  if (showCadIpTable && state.alignment.ipList.length >= 2) {\n    drawDraggableCadIpTable();","  ctx.globalAlpha = 1;\n  if (showCadIpTable && state.alignment.ipList.length >= 2) {\n    drawDraggableCadIpTable();")
rep('<label class="chk-item"><input type="checkbox" id="lyrCont1" checked onchange="requestRedraw()"> 首曲線 (CONT1)</label>','<div class="chk-item" style="gap:6px;flex-wrap:wrap;" title="只影響平面圖畫面（等高線、DXF 底線、TIN、測點），不影響 DXF 輸出；移位或編輯結構物時可調淡。">地形線透明度 <input type="range" id="terrOp" min="0.05" max="1" step="0.05" value="1" style="width:110px;" oninput="state.dzBm.tOp=+this.value;requestRedraw();"> <label style="font-size:11px;"><input type="checkbox" id="terrFade" onchange="state.dzBm.tFade=this.checked;requestRedraw();"> 淡化</label></div>\n            <label class="chk-item"><input type="checkbox" id="lyrCont1" checked onchange="requestRedraw()"> 首曲線 (CONT1)</label>')
# ==== v6.9：橫斷面偏角（secrotmod.js） ====
rep("      const { x: cx, y: cy, nx, ny, normalAz } = geom;", "      const { x: cx, y: cy, nx, ny, normalAz } = secRotGeom(geom, s);   // v6.9：個別樁號斷面偏角")
rep("        normalAzDMS: formatDMS(normalAz),", "        normalAzDMS: formatDMS(normalAz), rot: secRotOf(s),")
rep("ctx.strokeStyle = isSel ? '#00f0ff' : (sec.ptName ? 'rgba(232, 121, 249, 0.7)' : 'rgba(255, 230, 0, 0.45)');", "ctx.strokeStyle = isSel ? '#00f0ff' : (sec.rot ? 'rgba(251, 146, 60, 0.95)' : (sec.ptName ? 'rgba(232, 121, 249, 0.7)' : 'rgba(255, 230, 0, 0.45)'));")
rep("    D.text(bx + 0.4, by + h - 0.95, TH * 1.15, `樁號: ${sec.staLabel}`, 'SEC_TEXT', 2);\n    D.text(bx + 0.4 + (`樁號: ${sec.staLabel}`.length", "    D.text(bx + 0.4, by + h - 0.95, TH * 1.15, `樁號: ${sec.staLabel}${secRotTxt(sec)}`, 'SEC_TEXT', 2);\n    D.text(bx + 0.4 + (`樁號: ${sec.staLabel}${secRotTxt(sec)}`.length")
rep("  if (ppm) { ctx.textAlign = 'left'; ctx.fillText(info, bx + 8 + lw + 24, by + 16); } else { ctx.textAlign = 'right'; ctx.fillText(info, bx + bw - 8, by + 16); }\n", "  if (ppm) { ctx.textAlign = 'left'; ctx.fillText(info, bx + 8 + lw + 24, by + 16); } else { ctx.textAlign = 'right'; ctx.fillText(info, bx + bw - 8, by + 16); }\n  if (sec.rot) { const rt = `斜交 ${secRotFmt(sec.rot)}`, iw = ctx.measureText(info).width; ctx.font = isLarge ? 'bold 13px \"JetBrains Mono\"' : 'bold 11px \"JetBrains Mono\"'; ctx.fillStyle = '#fb923c'; ctx.textAlign = 'left'; const rw = ctx.measureText(rt).width;   // v6.9 斜交標註\n    if (ppm) ctx.fillText(rt, bx + 8 + lw + 24 + iw + 24, by + 16); else if (lw + rw + iw + 36 < bw) ctx.fillText(rt, bx + 8 + lw + 12, by + 16); else { ctx.fillStyle = 'rgba(11,16,24,0.9)'; ctx.fillRect(bx + 5, by + 27, rw + 6, isLarge ? 17 : 15); ctx.fillStyle = '#fb923c'; ctx.fillText(rt, bx + 8, by + 39); } }\n")
# ==== v7.0：縱斷面預設 X 1:500、Y 1:200；下部資料框預設不勾左右側高（護岸頂／基礎線勾選框預設不勾見 v4.7 段） ====
rep("  hScale: 0, vScale: 0, rows: ['grade', 'cutfill', 'design', 'ground', 'lt', 'rt', 'sta', 'curve'],", "  hScale: 500, vScale: 200, rows: ['grade', 'cutfill', 'design', 'ground', 'sta', 'curve'],")
rep('id="pfHScale" value="0"', 'id="pfHScale" value="500"')
rep('id="pfVScale" value="0"', 'id="pfVScale" value="200"')
# ==== v7.3：內政部 DEM（demmod.js）：畫面橫斷面地面線 DEM 段橘色虛線 ====
rep("  sec.samples.forEach((s, i) => { i ? ctx.lineTo(sx(s.offset), sy(s.groundZ)) : ctx.moveTo(sx(s.offset), sy(s.groundZ)); }); ctx.stroke();\n\n  _olDraw();", "  demStrokeGround(ctx, sec.samples, sx, sy);   // v7.3：DEM 段橘色虛線\n\n  _olDraw();")
open('/home/claude/tcv4/tc_v42.html','w',encoding='utf8').write(src)
print("ok",len(src))

