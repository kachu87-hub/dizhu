/* ============================================================================
   sbmod.js（v6.2）防砂壩安定檢核
   依據：水土保持單元叢書01《非透過性防砂壩》3.9 重力式壩體設計、第4章設計例（表3-6～3-13、式3-26～3-87）
   斷面＝溢洪口處單位寬（1 m）主壩體梯形：
     H＝壩高＝h2＋h3（含基礎埋入）、He＝有效壩高＝h2、b＝壩頂（溢洪口）厚 d1、m1＝下游坡 s2、m2＝上游坡 s3
     L＝b＋(m1＋m2)H；力矩中心＝壩趾（下游底角），x 由壩趾往上游為正
   不計：key（止滑榫）、壩翼、護坦；土石流流體／巨礫撞擊（土石流區另行檢討）
   四種情況（同第4章設計例）：
     (1) 未淤滿＋地震＋普通流量   (2) 未淤滿＋最大流量   (3) 淤滿＋最大流量   (4) 淤滿＋地震＋普通流量
   ============================================================================ */
const SB_FOUND = [   // [名稱, 摩擦係數 f1(表3-11), 浮力係數 CB(表3-8), 容許承載力 t/m²(表3-13)]
  ['軟粘土', 0.30, 0.6, 10], ['普通粘土', 0.30, 0.5, 20], ['硬粘土', 0.30, 0.4, 40],
  ['鬆細砂', 0.35, 0.7, 10], ['壓實細砂', 0.45, 0.6, 30], ['鬆粗砂', 0.45, 0.7, 30],
  ['鬆砂石混合物或卵石', 0.55, 0.6, 40], ['壓實砂石混合物或卵石', 0.60, 0.5, 50],
  ['強硬頁岩', 0.70, 0.25, 100], ['硬岩（堅固岩盤）', 0.70, 0.3, 100]
];
const SB_DEF = { fd: 7, f: null, cb: null, qa: null, gc: 2.3, gw: 1.1, gsub: 1.04, phi: 30, dl: 20, kh: 0.165, hm: null, s0: null, qd: null, up: null, fso: 1.2, fss: null };
// 欄位：[鍵, 名稱, 單位, 說明]
const SB_F = [
  ['gc', '混凝土單位重 γc', 't/m³', '一般 2.3～2.4（式3-36）'],
  ['gw', '水（含砂）單位重 γw', 't/m³', '設計例採 1.1'],
  ['gsub', '淤砂浸水單位重 γsub', 't/m³', 'γd−(1−ne)γw，設計例 1.04'],
  ['phi', '淤砂內摩擦角 φ', '°', '表3-7：砂 27～45、卵石夾泥砂 34～48'],
  ['dl', '壩與土壤摩擦角 δ', '°', '0～2φ/3，設計例 20'],
  ['kh', '水平地震係數 Kh', '', '表3-9：甲區 0.165、乙區 0.115；Kv＝2Kh/3'],
  ['hm', '未淤滿淤砂深 Hm', 'm', '空白＝H/2（設計例自行設定）'],
  ['s0', '原溪床坡度 S0', '%', '空白＝由設計線上游 5～45 m 自動估；淤砂坡 Se＝2/3·S0（3.14）'],
  ['qd', '設計洪峰 Qd', 'm³/s', '空白＝取「水力」頁籤此樁號的 Q50×(1+α)'],
  ['fso', '傾倒安全係數要求', '', '式3-79：一般 1.1～1.3'],
  ['fss', '滑動安全係數要求', '', '空白＝壩高 ≤10 m 取 1.1、>10 m 取 1.15（式3-83 範圍下限）']
];
state.sb = {};
const sbD2R = d => d * Math.PI / 180;
function sbP(st) { const o = Object.assign({}, SB_DEF, state.sb[st.id] || {}); const F = SB_FOUND[o.fd] || SB_FOUND[7]; o.fdN = F[0]; o.fE = o.f ?? F[1]; o.cbE = o.cb ?? F[2]; o.qaE = o.qa ?? F[3]; return o; }
/* Rankine 主動土壓力係數（式3-56） */
function sbKar(a, phi) { const ca = Math.cos(a), cp = Math.cos(phi), r = Math.sqrt(Math.max(0, ca * ca - cp * cp)); return ca * (ca - r) / (ca + r); }
/* Mononobe-Okabe 地震時主動土壓力係數（式3-67） */
function sbKae(phi, eb, th, dl, a) {
  const n = Math.pow(Math.cos(phi - eb - th), 2), s = Math.sin(phi + dl) * Math.sin(phi - a - th) / (Math.cos(dl + eb + th) * Math.cos(eb - a));
  return n / (Math.cos(th) * Math.pow(Math.cos(eb), 2) * Math.cos(dl + eb + th) * Math.pow(1 + Math.sqrt(Math.max(0, s)), 2));
}
function sbAutoS0(st) {
  try { if (typeof getDesignZ !== 'function') return null; const d = st.dir || 1, z1 = getDesignZ(st.sta - d * 5), z2 = getDesignZ(st.sta - d * 45); if (!Number.isFinite(z1) || !Number.isFinite(z2)) return null; return Math.max(0, (z2 - z1) / 40 * 100); } catch (e) { return null; }
}
function sbAutoQ(st) { try { return typeof hyQAt === 'function' ? hyQAt(st.sta, 50) : 0; } catch (e) { return 0; } }
/* 主計算：回傳各情況的力表與檢核 */
function sbCalc(st) {
  const P = sbP(st), p = st.p, H = p.h2 + p.h3, He = p.h2, b = p.d1, m1 = Math.max(0, p.s2), m2 = Math.max(0, p.s3), L = b + (m1 + m2) * H;
  const gc = P.gc, gw = P.gw, gs = P.gsub, phi = sbD2R(P.phi), dl = sbD2R(P.dl), Kh = P.kh, Kv = 2 * Kh / 3, th = Math.atan(Kh / (1 - Kv)), eb = Math.atan(m2), CB = P.cbE, f = P.fE;
  const Hm = Math.min(H, P.hm ?? H / 2), S0a = sbAutoS0(st), S0 = P.s0 ?? S0a ?? 0, ta = 2 / 3 * S0 / 100, al = Math.atan(ta);
  const up = P.up ?? (H >= 7), fss = P.fss ?? (H > 10 ? 1.15 : 1.1);
  const QdA = sbAutoQ(st), Qd = P.qd ?? (QdA > 0 ? QdA : null);
  const inp = { H, He, b, m1, m2, L, Kv, th: th * 180 / Math.PI, eb: eb * 180 / Math.PI, Hm, S0, S0a, al: al * 180 / Math.PI, up, fss, Qd, QdA, CB, f, P };
  // 洪水量相關：溢流水深 h（式3-26）、臨界水深 hc、跌水緣水深 hck、下游水躍、壩前（下游）壅水 df
  let fl = null;
  if (Qd > 0 && p.h1 > 0) {
    const h = typeof hyWeirH === 'function' ? hyWeirH(st, Qd) : NaN, bo = p.w, bu = p.w + 2 * Math.max(0, p.s1) * p.h1;
    const hc = Math.cbrt(Qd * Qd / 9.8 * 8 * bu / Math.pow(bo + bu, 3)), hck = 0.75 * hc;
    const d1 = He * 0.54 * Math.pow(hc / He, 1.275), d2 = d1 * 3.07 / Math.pow(hc / He, 0.465), df = hc * Math.sqrt(Math.max(0, Math.pow(d1 / d2, 2) + 2 * hc / d1 - 3));
    const hf = typeof hyFbStd === 'function' ? hyFbStd(Qd) : 0.6;
    fl = { h, bo, bu, hc, hck, d1, d2, df, hf, need: h + hf, ok: h + hf <= p.h1 + 1e-9 };
  }
  inp.fl = fl;
  const V = (nm, fx, Rv, arm) => ({ nm, fx, Rv, Rh: 0, arm, M: Rv * arm });
  const Hz = (nm, fx, Rh, y) => ({ nm, fx, Rv: 0, Rh, arm: y, M: -Rh * y });
  const body = () => [V('W1 壩體自重(下游三角)', '0.5γc·m1·H²', 0.5 * gc * m1 * H * H, 2 * m1 * H / 3), V('W2 壩體自重(頂寬矩形)', 'γc·b·H', gc * b * H, m1 * H + b / 2), V('W3 壩體自重(上游三角)', '0.5γc·m2·H²', 0.5 * gc * m2 * H * H, m1 * H + b + m2 * H / 3)];
  const quake = () => [Hz('D1 地震慣性力', 'Kh·W1', Kh * 0.5 * gc * m1 * H * H, H / 3), Hz('D2 地震慣性力', 'Kh·W2', Kh * gc * b * H, H / 2), Hz('D3 地震慣性力', 'Kh·W3', Kh * 0.5 * gc * m2 * H * H, H / 3)];
  const flood = () => {
    const { h, hc, hck, df } = fl, a = [];
    a.push(V('Pwv1 水重', '0.5γw·m2·H²', 0.5 * gw * m2 * H * H, L - m2 * H / 3), V('Pwv2 水重', 'hck·b·γw', hck * b * gw, m1 * H + b / 2), V('Pwv3 水重', '0.5γw(hc−hck)b', 0.5 * gw * (hc - hck) * b, m1 * H + 2 * b / 3),
      V('Pwv4 水重', 'hc·m2·H·γw', hc * m2 * H * gw, m1 * H + b + m2 * H / 2), V('Pwv5 水重', '0.5γw·m2·H(h−hc)', 0.5 * gw * m2 * H * (h - hc), L - m2 * H / 3), V('Pwv6 下游水重', '0.5γw·m1·df²', 0.5 * gw * m1 * df * df, m1 * df / 3),
      Hz('Pwh1 下游靜水壓', '0.5γw·df²', -0.5 * gw * df * df, (H - He) + df / 3), Hz('Pwh2 上游靜水壓', '0.5γw·H²(1+2h/H)', 0.5 * gw * H * H * (1 + 2 * h / H), H / 3 * (H + 3 * h) / (H + 2 * h)));
    if (up) a.push(V('U1 上揚力(下游)', 'CB·L·γw(df+H−He)/2', -CB * L * gw * (df + H - He) / 2, L / 3), V('U2 上揚力(上游)', 'CB·L·γw(H+h)/2', -CB * L * gw * (H + h) / 2, 2 * L / 3));
    return a;
  };
  const cs = [];
  // (1) 未淤滿＋地震＋普通流量
  { const K = sbKae(phi, eb, th, dl, 0), Pae = 0.5 * (1 - Kv) * K * gs * Hm * Hm, F = body();
    F.push(V('W4 土砂重', '0.5γsub·m2·Hm²', 0.5 * gs * m2 * Hm * Hm, L - m2 * Hm / 3), Hz('Pwh 靜水壓', '0.5γw·H²', 0.5 * gw * H * H, H / 3), V('Pwv 水重', '0.5γw·m2·H²', 0.5 * gw * m2 * H * H, L - m2 * H / 3));
    if (up) F.push(V('U 上揚力', 'CB·L·γw·H/2', -CB * L * gw * H / 2, 2 * L / 3));
    F.push(...quake(), Hz('Paeh 地震時土壓(水平)', `0.5(1−Kv)Kae·γsub·Hm²·cos(δ+ε̄)，Kae=${K.toFixed(4)}`, Pae * Math.cos(dl + eb), Hm / 3), V('Paev 地震時土壓(垂直)', 'Pae·sin(δ+ε̄)', Pae * Math.sin(dl + eb), L - m2 * Hm / 3));
    cs.push({ k: 1, nm: '(1) 未淤滿＋地震＋普通流量', F, K }); }
  // (2) 未淤滿＋最大流量
  if (fl) { const K = sbKar(0, phi), F = body(); F.push(V('W4 土砂重', '0.5γsub·m2·Hm²', 0.5 * gs * m2 * Hm * Hm, L - m2 * Hm / 3), Hz('Pa 土砂壓力', `0.5Kar·γsub·Hm²，Kar=${K.toFixed(3)}`, 0.5 * K * gs * Hm * Hm, Hm / 3), ...flood()); cs.push({ k: 2, nm: '(2) 未淤滿＋最大流量', F, K }); }
  // (3) 淤滿＋最大流量
  const Ht = H + m2 * H * ta;
  if (fl) { const K = sbKar(al, phi), Pa = 0.5 * K * gs * Ht * Ht, F = body(); F.push(V('W4 土砂重', '0.5γsub·m2·H(m2·H·tanα+H)', 0.5 * gs * m2 * H * Ht, L - m2 * H / 3), Hz('Pah 土砂壓力(水平)', `0.5Kar·γsub·Ht²·cosα，Kar=${K.toFixed(3)}`, Pa * Math.cos(al), Ht / 3), V('Pav 土砂壓力(垂直)', 'Pa·sinα', Pa * Math.sin(al), L - m2 * H / 3), ...flood()); cs.push({ k: 3, nm: '(3) 淤滿＋最大流量', F, K }); }
  // (4) 淤滿＋地震＋普通流量
  { const K = sbKae(phi, eb, th, dl, al), Pae = 0.5 * (1 - Kv) * K * gs * Ht * Ht, F = body(), t = m2 * H * ta;
    F.push(V('W4 土砂重', '0.5γsub·m2·H(m2·H·tanα+H)', 0.5 * gs * m2 * H * Ht, L - m2 * H / 3), Hz('Paeh 地震時土壓(水平)', `0.5(1−Kv)Kae·γsub·Ht²·cos(δ+ε̄)，Kae=${K.toFixed(4)}`, Pae * Math.cos(dl + eb), Ht / 3), V('Paev 地震時土壓(垂直)', 'Pae·sin(δ+ε̄)', Pae * Math.sin(dl + eb), L - m2 * H / 3),
      V('Pwv1 水重', '0.5γw·m2·H²', 0.5 * gw * m2 * H * H, L - m2 * H / 3), V('Pwv2 水重', '0.5γw·tanα(m2H)²', 0.5 * gw * ta * Math.pow(m2 * H, 2), L - m2 * H / 3), Hz('Pwh 靜水壓', '0.5γw(H+m2·H·tanα)H', 0.5 * gw * Ht * H, H / 3 * (H + 3 * t) / (H + 2 * t)));
    if (up) F.push(V('U 上揚力', 'CB·L·γw(m2·H·tanα+H)/2', -CB * L * gw * Ht / 2, 2 * L / 3));
    F.push(...quake()); cs.push({ k: 4, nm: '(4) 淤滿＋地震＋普通流量', F, K }); }
  cs.forEach(c => {
    let Rv = 0, Rh = 0, Mp = 0, Mn = 0; c.F.forEach(q => { Rv += q.Rv; Rh += q.Rh; if (q.M >= 0) Mp += q.M; else Mn -= q.M; });
    const x = (Mp - Mn) / Rv, e = L / 2 - x, Bpu = Rv / L * (1 - 6 * e / L), Bpd = Rv / L * (1 + 6 * e / L), FSo = Mn > 0 ? Mp / Mn : Infinity, FSs = Rh > 0 ? f * Rv / Rh : Infinity, Bmax = Math.max(Bpu, Bpd);
    Object.assign(c, { Rv, Rh, Mp, Mn, x, e, Bpu, Bpd, FSo, FSs, Bmax,
      ok: { o: FSo >= P.fso - 1e-9, mid: x >= L / 3 - 1e-9 && x <= 2 * L / 3 + 1e-9, s: FSs >= fss - 1e-9, b: Bmax <= P.qaE + 1e-9 && Math.min(Bpu, Bpd) >= -1e-9 } });
    c.pass = c.ok.o && c.ok.mid && c.ok.s && c.ok.b;
  });
  return { inp, cs, pass: cs.every(c => c.pass) && (!fl || fl.ok) };
}
const sbF = (v, d = 2) => (Number.isFinite(v) ? v.toFixed(d) : (v === Infinity ? '∞' : '—'));
function sbSet(id, k, v) {
  pushUndoSnapshot(); const o = state.sb[id] = state.sb[id] || {};
  if (k === 'fd') { o.fd = +v; delete o.f; delete o.cb; delete o.qa; }
  else if (k === 'up') { o.up = v === 'auto' ? null : v === '1'; }
  else { const x = parseFloat(v); o[k] = Number.isFinite(x) ? x : null; }
  sbRender();
}
function sbHTML(st) {
  let R; try { R = sbCalc(st); } catch (e) { console.error('sbCalc', e); return ''; }
  const I = R.inp, P = I.P, id = st.id, inp = (k, v, ph, w) => `<input type="number" class="input-num" style="width:${w || 62}px;" step="any" value="${(state.sb[id] || {})[k] ?? ''}" placeholder="${ph}" onchange="sbSet('${id}','${k}',this.value)">`;
  const lab = (t, h, tip) => `<label style="display:flex;justify-content:space-between;align-items:center;gap:6px;font-size:11px;" title="${escAttr(tip || '')}"><span>${t}</span>${h}</label>`;
  const cv = (b, t) => `<b style="color:${b ? '#16a34a' : '#dc2626'};">${t}${b ? '' : ' ✗'}</b>`;
  const ok = b => b ? '<b style="color:#16a34a;">O.K.</b>' : '<b style="color:#dc2626;">N.G.</b>';
  const fields = SB_F.map(q => { const k = q[0], dv = { hm: sbF(I.H / 2), s0: I.S0a === null ? '無設計線' : sbF(I.S0a, 1) + '（自動）', qd: I.QdA > 0 ? sbF(I.QdA) + '（Q50）' : '未輸入', fss: sbF(I.fss) }[k] ?? P[k]; return lab(`${q[1]}${q[2] ? ` (${q[2]})` : ''}`, inp(k, null, dv), q[3]); });
  const fsel = `<select class="input-select" style="width:150px;" onchange="sbSet('${id}','fd',this.value)">${SB_FOUND.map((q, i) => `<option value="${i}"${i === P.fd ? ' selected' : ''}>${q[0]}</option>`).join('')}</select>`;
  const upSel = `<select class="input-select" style="width:110px;" onchange="sbSet('${id}','up',this.value)"><option value="auto"${P.up === null ? ' selected' : ''}>自動（H≥7 計入）</option><option value="1"${P.up === true ? ' selected' : ''}>計入</option><option value="0"${P.up === false ? ' selected' : ''}>不計</option></select>`;
  const fl = I.fl, flH = fl ? `<div style="margin-top:4px;">溢洪口通洪（式3-26、表3-4）：Qd ${sbF(I.Qd)} m³/s → 溢流水深 h ${sbF(fl.h)} m＋出水高 ${sbF(fl.hf, 1)} m＝${sbF(fl.need)} m ${fl.ok ? '≤' : '＞'} 溢洪口高 h1 ${sbF(st.p.h1)} m ${ok(fl.ok)}${fl.h > 3 ? '　<b style="color:#b45309;">溢流水深 >3 m</b>' : ''}<br><span style="color:var(--text-muted);">hc ${sbF(fl.hc, 3)}、hck ${sbF(fl.hck, 3)}、水躍 d1 ${sbF(fl.d1, 3)}／d2 ${sbF(fl.d2, 3)}、下游壅水 df ${sbF(fl.df, 3)} m</span></div>` : `<div style="margin-top:4px;color:#b45309;">未設定設計洪峰 Qd（或無溢洪口），只計算情況 (1)(4)；請在「水力」頁籤輸入 Q50 或於上方填 Qd。</div>`;
  const rows = R.cs.map(c => `<tr><td colspan="4" style="text-align:left;font-weight:700;background:rgba(14,116,144,.06);">${c.nm} ${c.pass ? ok(true) : ok(false)}</td></tr><tr><td>${cv(c.ok.o, sbF(c.FSo))}</td><td>${cv(c.ok.mid, sbF(c.x))}</td><td>${cv(c.ok.s, sbF(c.FSs))}</td><td>${cv(c.ok.b, sbF(c.Bpu, 1) + '／' + sbF(c.Bpd, 1))}</td></tr>`).join('');
  const det = R.cs.map(c => `<details style="margin-top:3px;"><summary style="cursor:pointer;font-size:11px;">${c.nm} 荷重表</summary><div class="pt-table-wrap"><table class="pt-table" style="font-size:10.5px;"><thead><tr><th>作用力</th><th>Rv t</th><th>Rh t</th><th>力臂 m</th><th>力矩 t·m</th></tr></thead><tbody>${c.F.map(q => `<tr title="${escAttr(q.fx)}"><td style="text-align:left;">${escAttr(q.nm)}</td><td>${q.Rv ? sbF(q.Rv, 3) : ''}</td><td>${q.Rh ? sbF(q.Rh, 3) : ''}</td><td>${sbF(q.arm, 3)}</td><td>${sbF(q.M, 3)}</td></tr>`).join('')}<tr style="font-weight:700;"><td>合計</td><td>${sbF(c.Rv, 3)}</td><td>${sbF(c.Rh, 3)}</td><td></td><td>+${sbF(c.Mp, 2)}／−${sbF(c.Mn, 2)}</td></tr></tbody></table></div><div style="font-size:10.5px;color:var(--text-muted);">x＝ΣM/Rv＝${sbF(c.x, 3)} m，e＝L/2−x＝${sbF(c.e, 3)} m（L/6＝${sbF(I.L / 6, 3)}）；滑動 f·Rv/Rh＝${sbF(I.f)}×${sbF(c.Rv, 2)}/${sbF(c.Rh, 2)}</div></details>`).join('');
  return `<div style="margin:6px 0;padding:6px 8px;border:1px solid ${R.pass ? '#16a34a' : '#dc2626'};border-radius:4px;background:${R.pass ? 'rgba(22,163,74,.06)' : 'rgba(220,38,38,.06)'};font-size:11px;line-height:1.55;">
    <b style="color:${R.pass ? '#16a34a' : '#dc2626'};">${R.pass ? '✔' : '✗'} ${escAttr(st.name)} 安定檢核</b>　<span style="color:var(--text-muted);">叢書01 §3.9、第4章（單位寬 1 m，重力式）</span>
    <div style="color:var(--text-muted);">壩高 H＝h2+h3＝${sbF(I.H)} m、有效壩高 He＝${sbF(I.He)} m、壩頂厚 b＝${sbF(I.b)}、下游 1:${I.m1}、上游 1:${I.m2}、壩底寬 L＝${sbF(I.L)} m；ε̄＝${sbF(I.eb, 2)}°、θ＝${sbF(I.th, 2)}°、淤砂坡 α＝${sbF(I.al, 3)}°（S0 ${sbF(I.S0, 1)}%）；上揚力${I.up ? '計入' : '不計'}；f＝${I.f}、CB＝${I.CB}、容許承載力 ${P.qaE} t/m²</div>
    <div class="pt-table-wrap" style="margin-top:3px;"><table class="pt-table" style="font-size:10.5px;table-layout:fixed;width:100%;"><thead><tr><th>傾倒 F.S.</th><th>合力 x (m)</th><th>滑動 F.S.</th><th>Bpu／Bpd</th></tr></thead><tbody>${rows}</tbody></table></div><div style="font-size:10px;color:var(--text-muted);">要求：傾倒 ≥${P.fso}（式3-79）；x 在 ${sbF(I.L / 3)}～${sbF(2 * I.L / 3)} m（中央 1/3，式3-80）；滑動 ≥${sbF(I.fss)}（式3-83）；壩趾／壩踵應力 0～${P.qaE} t/m²（表3-13）</div>
    ${flH}
    <details style="margin-top:4px;"><summary style="cursor:pointer;">參數（空白＝預設）</summary><div style="display:grid;grid-template-columns:1fr;gap:2px;margin-top:3px;">
      ${lab('基礎類型', fsel, '帶入 摩擦係數(表3-11)、浮力係數(表3-8)、容許承載力(表3-13)')}
      ${lab('摩擦係數 f1', inp('f', null, P.fE), '表3-11')}${lab('浮力係數 CB', inp('cb', null, P.cbE), '表3-8')}${lab('容許承載力 (t/m²)', inp('qa', null, P.qaE), '表3-13')}
      ${lab('上揚力', upSel, '表3-6：壩高 <7 m 可不計上揚力；第4章設計例(H=6)有計入')}${fields.join('')}</div></details>
    ${det}
    <div style="font-size:10px;color:var(--text-muted);margin-top:3px;">未計：止滑榫（key）、壩翼、護坦、被動土壓力（偏安全）；土石流區另需計流體與巨礫撞擊力（式3-71、3-78）。</div></div>`;
}
function sbRender() {
  const box = document.getElementById('stBox'); if (!box || !box.parentNode) return;
  let el = document.getElementById('sbBox'); if (!el) { el = document.createElement('div'); el.id = 'sbBox'; const rb = document.getElementById('ruleBox'); box.parentNode.insertBefore(el, rb ? rb.nextSibling : box); }
  const st = state.structs && state.structs[state.structSel];
  if (!st || state.stAccSel || (st.type || 'dam') !== 'dam' || !(st.p.h1 > 0)) { el.innerHTML = ''; return; }
  if (el.contains(document.activeElement) && ['INPUT', 'SELECT'].includes(document.activeElement.tagName)) return;
  const op = el.querySelector('details[open]') ? [...el.querySelectorAll('details')].map(d => d.open) : null;
  el.innerHTML = sbHTML(st);
  if (op) [...el.querySelectorAll('details')].forEach((d, i) => { d.open = !!op[i]; });
}
function sbSheet() {
  const L = (state.structs || []).filter(st => (st.type || 'dam') === 'dam' && st.p.h1 > 0); if (!L.length) return null;
  const rows = [[{ v: '防砂壩安定檢核（叢書01 §3.9、第4章；單位寬 1 m）', s: 5 }], []], H = a => a.map(v => ({ v, s: 1 })), r = v => (Number.isFinite(v) ? Math.round(v * 1000) / 1000 : '');
  L.forEach(st => {
    const R = sbCalc(st), I = R.inp, P = I.P;
    rows.push([{ v: `${st.name}（樁號 ${typeof formatStation === 'function' ? formatStation(st.sta) : st.sta}）　${R.pass ? '全部 O.K.' : '有 N.G.'}`, s: 1 }]);
    rows.push([`H=${r(I.H)} He=${r(I.He)} b=${r(I.b)} m1=${I.m1} m2=${I.m2} L=${r(I.L)}；γc=${P.gc} γw=${P.gw} γsub=${P.gsub} φ=${P.phi}° δ=${P.dl}° Kh=${P.kh} α=${r(I.al)}°；基礎=${P.fdN} f=${I.f} CB=${I.CB} qa=${P.qaE}；上揚力${I.up ? '計入' : '不計'}`]);
    if (I.fl) rows.push([`Qd=${r(I.Qd)} h=${r(I.fl.h)} hc=${r(I.fl.hc)} hck=${r(I.fl.hck)} df=${r(I.fl.df)}；h+出水高 ${r(I.fl.need)} ${I.fl.ok ? '≤' : '>'} h1 ${r(st.p.h1)}`]);
    R.cs.forEach(c => {
      rows.push([{ v: c.nm, s: 1 }]); rows.push(H(['作用力', '計算式', 'Rv (t)', 'Rh (t)', '力臂 (m)', '力矩 (t·m)']));
      c.F.forEach(q => rows.push([q.nm, q.fx, q.Rv ? r(q.Rv) : '', q.Rh ? r(q.Rh) : '', r(q.arm), r(q.M)]));
      rows.push(['合計', '', r(c.Rv), r(c.Rh), '', `+${r(c.Mp)} / −${r(c.Mn)}`]);
      rows.push([`傾倒 F.S.=${r(c.FSo)}（≥${P.fso}）${c.ok.o ? 'O.K.' : 'N.G.'}；x=${r(c.x)}（${r(I.L / 3)}～${r(2 * I.L / 3)}）${c.ok.mid ? 'O.K.' : 'N.G.'}；滑動 F.S.=${r(c.FSs)}（≥${I.fss}）${c.ok.s ? 'O.K.' : 'N.G.'}；Bpu=${r(c.Bpu)} Bpd=${r(c.Bpd)}（≤${P.qaE}）${c.ok.b ? 'O.K.' : 'N.G.'}`]);
      rows.push([]);
    });
  });
  return { name: '安定檢核', cols: [26, 40, 11, 11, 11, 16], rows, freeze: 1, merges: ['A1:F1'] };
}
(function () {
  if (typeof stRenderUI === 'function') { const _r = stRenderUI; stRenderUI = function (...a) { const x = _r.apply(this, a); try { sbRender(); } catch (e) { console.error('sbRender', e); } return x; }; }
  if (typeof stRecalc === 'function') { const _c = stRecalc; stRecalc = function (...a) { const x = _c.apply(this, a); try { sbRender(); } catch (e) { } return x; }; }
  const _cp = collectProject; collectProject = function () { const o = _cp(); o.data.sb = JSON.parse(JSON.stringify(state.sb || {})); return o; };
  const _ap = applyProject; applyProject = function (obj, fname) { state.sb = (obj && obj.data && obj.data.sb) || {}; _ap(obj, fname); try { sbRender(); } catch (e) { } };
  const _pu = pushUndoSnapshot; pushUndoSnapshot = function () { _pu(); try { const n = state.undoStack.length - 1, o = JSON.parse(state.undoStack[n]); o.sb = JSON.parse(JSON.stringify(state.sb || {})); state.undoStack[n] = JSON.stringify(o); } catch (e) { } };
  const _un = undoLastAction; undoLastAction = function () { let sb = null; try { const t = state.undoStack[state.undoStack.length - 1]; sb = t ? JSON.parse(t).sb : null; } catch (e) { } _un(); if (sb) { state.sb = sb; try { sbRender(); } catch (e) { } } };
  const _bk = stQtyBook; stQtyBook = function () { const B = _bk(); let s = null; try { s = sbSheet(); } catch (e) { console.error('sbSheet', e); } if (s) { B.sheets.push(s); B.n += 1; } return B; };
})();
