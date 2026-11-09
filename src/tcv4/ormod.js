/* ===================== 原圖移植：0402-1 乾砌石護岸（自使用者原工具 v2 自動抽出，勿手改；改 gen_or.py） =====================
   tcoDry402Model(R)  ＝原 computeModel（cm）
   tcoDry402Prims(m, OPT, part)  ＝原 renderCAD 繪圖（part='all' 三視圖＋數量表；'sec' 斷面細部），輸出原圖座標（cm，y 向上）圖元：
     {k:'L',p:[[x,y],[x,y]],c,w,d} {k:'P',p,c,w,f,cl,d} {k:'C',x,y,r,c,f,w} {k:'T',x,y,s,h,c,al,bl,rot} {k:'G',outer,holes,tile,c}
*/
const TCO_CNS560_REBAR = {
  D10: { d: 0.953, unitW: 0.560 },
  D13: { d: 1.270, unitW: 0.995 },
  D16: { d: 1.590, unitW: 1.560 },
  D19: { d: 1.910, unitW: 2.250 },
  D22: { d: 2.220, unitW: 3.040 },
  D25: { d: 2.540, unitW: 3.980 },
  D29: { d: 2.870, unitW: 5.040 },
  D32: { d: 3.220, unitW: 6.390 }
};
const TCO_GRAVEL_TILE_SEGS = [
  [[0.72, 1.0], [0.63, 0.9]], [[0.63, 0.9], [0.4, 0.88]], [[0.4, 0.88], [0.29, 1.0]],
  [[0.01, 0.63], [0.0, 0.42]], [[0.0, 0.42], [0.08, 0.23]], [[0.08, 0.23], [0.29, 0.22]],
  [[0.29, 0.22], [0.51, 0.39]], [[0.51, 0.39], [0.59, 0.64]], [[0.59, 0.64], [0.48, 0.82]],
  [[0.48, 0.82], [0.24, 0.84]], [[0.24, 0.84], [0.01, 0.63]], [[1.0, 0.62], [0.92, 0.69]],
  [[0.92, 0.69], [0.72, 0.72]], [[0.72, 0.72], [0.62, 0.62]], [[0.65, 0.84], [0.58, 0.81]],
  [[0.58, 0.81], [0.62, 0.71]], [[0.62, 0.71], [0.77, 0.8]], [[0.77, 0.8], [0.65, 0.84]],
  [[0.0, 0.81], [0.17, 0.86]], [[0.17, 0.86], [0.22, 1.0]], [[0.77, 1.0], [0.83, 0.86]],
  [[0.83, 0.86], [1.0, 0.81]], [[0.0, 0.19], [0.16, 0.13]], [[0.16, 0.13], [0.22, 0.0]],
  [[0.78, 0.0], [0.84, 0.14]], [[0.84, 0.14], [1.0, 0.19]], [[0.29, 0.0], [0.32, 0.08]],
  [[0.72, 0.0], [0.71, 0.05]], [[0.71, 0.05], [0.51, 0.1]], [[0.51, 0.1], [0.32, 0.08]],
  [[0.62, 0.62], [0.7, 0.5]], [[0.7, 0.5], [0.95, 0.47]], [[0.95, 0.47], [1.0, 0.56]],
  [[1.0, 0.56], [1.0, 0.62]], [[0.49, 0.13], [0.42, 0.25]], [[0.42, 0.25], [0.6, 0.45]],
  [[0.6, 0.45], [0.86, 0.45]], [[0.86, 0.45], [0.99, 0.36]], [[0.99, 0.36], [0.95, 0.22]],
  [[0.95, 0.22], [0.74, 0.11]], [[0.74, 0.11], [0.49, 0.13]]
];
const TCO_NORM_BOULDER_SHAPES = [
  [[-0.3409, 0.3511], [-0.4368, 0.2424], [-0.5, -0.1523], [-0.3182, -0.423], [-0.0954, -0.4819], [0.0588, -0.4535], [0.2924, -0.3712], [0.5, -0.0928], [0.4847, 0.1618], [0.3543, 0.4408], [-0.0156, 0.5], [-0.2804, 0.413]],
  [[0.0729, 0.5], [-0.1243, 0.4914], [-0.3563, 0.3802], [-0.5, 0.2007], [-0.4648, -0.2647], [-0.2584, -0.467], [-0.0649, -0.5], [0.1972, -0.4659], [0.4028, -0.3578], [0.5, -0.1973], [0.4227, 0.2063], [0.2395, 0.4494], [0.0688, 0.4439], [-0.0496, 0.3627]],
  [[-0.0882, 0.4488], [-0.4292, 0.2528], [-0.5, 0.0585], [-0.4317, -0.1846], [-0.1235, -0.5], [0.239, -0.4979], [0.5, -0.2547], [0.4126, 0.2974], [0.1112, 0.5], [-0.1591, 0.4252]],
  [[-0.145, 0.4664], [-0.3822, 0.3886], [-0.5, 0.1072], [-0.4573, -0.1897], [-0.3037, -0.4234], [-0.0369, -0.5], [0.2738, -0.4366], [0.4398, -0.2927], [0.5, -0.167], [0.4998, 0.1173], [0.3396, 0.4416], [0.0872, 0.5], [-0.1277, 0.4449]],
  [[-0.1494, 0.5], [-0.2784, 0.4508], [-0.5, 0.205], [-0.4981, -0.1753], [-0.2535, -0.4918], [0.1095, -0.5], [0.4765, -0.2116], [0.5, 0.2054], [0.3249, 0.435], [0.0308, 0.4945], [-0.1144, 0.4622]],
  [[-0.145, 0.5], [-0.2739, 0.4509], [-0.5, 0.2069], [-0.5, -0.1732], [-0.2575, -0.4892], [0.1045, -0.5], [0.4728, -0.2139], [0.5, 0.2028], [0.3266, 0.4328], [0.0332, 0.494], [-0.1016, 0.4667]],
  [[-0.1518, 0.5], [-0.2817, 0.4384], [-0.5, 0.1636], [-0.4783, -0.2201], [-0.1971, -0.4978], [0.1675, -0.5], [0.5, -0.1835], [0.4601, 0.2286], [0.271, 0.4417], [-0.0297, 0.4932], [-0.1642, 0.4535]],
  [[-0.1489, 0.5], [-0.2789, 0.4488], [-0.5, 0.2016], [-0.4987, -0.1783], [-0.2546, -0.4935], [0.1072, -0.5], [0.4733, -0.2102], [0.5, 0.2063], [0.3263, 0.4356], [0.033, 0.4961], [-0.1194, 0.4631]]
];
function seededRand(seed) {
  let x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function pointInPoly(pt, vs) {
  let x = pt[0], y = pt[1];
  let inside = false;
  for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
    let xi = vs[i][0], yi = vs[i][1];
    let xj = vs[j][0], yj = vs[j][1];
    let intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / ((yj - yi) || 1e-9) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

function tcoDry402In(R, id, fb) {   // 原工具輸入欄 → 護岸參數（H、D 為 m，其餘 cm）
  const M = { inp_H1: R.H * 100, inp_Df: R.D * 100, inp_n_slope: R.n, inp_N_layer: R.NL, inp_L_top: R.Ltop, inp_L_bot: R.Lbot, inp_R_boulder: R.Rb, inp_L_unit: (R.jsp || 10) * 100,
    inp_t_grav_top: R.tgt, inp_t_grav_bot: R.tgb, inp_w_exc_front: R.wef, inp_m_exc: R.ec, inp_w_top_fill: R.wtf, inp_H2: R.H2, inp_B_toe: R.Btoe, inp_B_heel: R.Bheel,
    inp_R1: R.R1, inp_P1: R.P1, inp_t_pc: R.tpc, inp_w_pc: R.wpc, inp_X_key: R.Xkey, inp_S_rebar: R.Srb };
  const v = parseFloat(M[id]); return isNaN(v) ? fb : Math.round(v * 1e6) / 1e6;   // 去除 m→cm 換算的浮點尾數
}
function tcoDry402Model(R) {   // ＝原工具 computeModel()，輸入改由護岸參數 R 提供
  const getNum = (id, fb) => tcoDry402In(R, id, fb);
  const H1 = Math.max(40, getNum('inp_H1', 220));
  const Df = Math.max(30, getNum('inp_Df', 130));
  const n_slope = Math.max(0.1, getNum('inp_n_slope', 0.45));
  const N_layer = Math.max(3, Math.min(20, Math.round(getNum('inp_N_layer', 8))));
  const L_top = Math.max(30, getNum('inp_L_top', 55));
  const L_bot = Math.max(35, getNum('inp_L_bot', 80));
  const R_boulder = Math.max(50, Math.min(100, getNum('inp_R_boulder', 85)));
  const L_unit = Math.max(100, getNum('inp_L_unit', 1000));

  const t_grav_top = Math.max(0, getNum('inp_t_grav_top', 30));
  const t_grav_bot = Math.max(0, getNum('inp_t_grav_bot', 30));
  const w_exc_front = Math.max(0, getNum('inp_w_exc_front', 30));
  const m_exc = Math.max(0.05, getNum('inp_m_exc', 0.45));
  const w_top_fill = Math.max(20, getNum('inp_w_top_fill', 125));
  const exc_mode = (R.excMode || 'full');

  const H2 = Math.max(0, getNum('inp_H2', 0));
  const B_toe = H2 > 0 ? Math.max(0, getNum('inp_B_toe', 20)) : 0;
  const B_heel = H2 > 0 ? Math.max(0, getNum('inp_B_heel', 20)) : 0;
  const R1 = Math.max(0, getNum('inp_R1', 0));
  const P1 = Math.max(15, getNum('inp_P1', 30));
  const t_pc = Math.max(0, getNum('inp_t_pc', 0));
  const w_pc = t_pc > 0 ? Math.max(0, getNum('inp_w_pc', 10)) : 0;

  const rebar_main_key = (R.rbm || 'D16');
  const rebar_sub_key = (R.rbs || 'D13');
  const S_rebar = Math.max(10, getNum('inp_S_rebar', 20));

  // 基本衍生幾何
  const H_total = H1 + Df;
  const slopeFactor = Math.sqrt(1 + n_slope * n_slope);
  const L_slope = H_total * slopeFactor;
  const W_batter = H_total * n_slope;

  // 臨水面單位切向量 (由下往上沿坡面) 與外法向量 (指向右側臨水面)
  const Tx = -n_slope / slopeFactor;
  const Ty = 1.0 / slopeFactor;
  const Nx = 1.0 / slopeFactor;
  const Ny = n_slope / slopeFactor;

  // 頂層與底層塊石水平投影寬
  const B1 = L_top * slopeFactor;
  const B2 = L_bot * slopeFactor;
  const h_layer = H_total / N_layer;
  const d_short = L_slope / N_layer;

  // 座標系定義：
  // 令開挖底面左角 (背填底部後角) 為 X = 0, Y = 0
  // 底層塊石後角在 X = t_grav_bot，底層塊石前趾在 X = t_grav_bot + B2
  // 確保調整 t_grav_top 或 t_grav_bot 時，塊石與開挖線 100% 即時連動！
  const x_grav_bot_left = 0;
  const x_stone_bot_back = t_grav_bot;
  const x_stone_bot_front = t_grav_bot + B2;
  const x_stone_top_front = x_stone_bot_front - W_batter;
  const x_stone_top_back = x_stone_top_front - B1;
  const x_grav_top_left = x_stone_top_back - t_grav_top;

  // 生成各層乾砌大塊石多邊形 (全數採用 DXF 塊石頂點，並隨 t_grav_bot/t_grav_top 即時連動平移)
  const boulders = [];
  let maxHeightToLongAxisRatio = 0;
  let minLongToShortRatio = 999;
  let maxLongToShortRatio = 0;

  for (let i = 0; i < N_layer; i++) {
    const frac = N_layer > 1 ? i / (N_layer - 1) : 0;
    const L_i = L_bot - frac * (L_bot - L_top);
    const B_i = L_i * slopeFactor;
    const y_mid = (i + 0.5) * h_layer;
    // 該層前緣中心點 (在臨水面斜坡線上，隨 x_stone_bot_front 動態移動)
    const x_front_i = x_stone_bot_front - (y_mid / H_total) * W_batter;
    // 該層中心點：自前緣沿法向量往內退 0.5 * L_i
    const xc = x_front_i - 0.5 * L_i * Nx;
    const yc = y_mid - 0.5 * L_i * Ny + 0.12 * h_layer;

    const H_above = H_total - i * h_layer;
    const ratio5x = H_above / L_i;
    if (ratio5x > maxHeightToLongAxisRatio) maxHeightToLongAxisRatio = ratio5x;

    const lsRatio = L_i / d_short;
    if (lsRatio < minLongToShortRatio) minLongToShortRatio = lsRatio;
    if (lsRatio > maxLongToShortRatio) maxLongToShortRatio = lsRatio;

    const shapeTemplate = TCO_NORM_BOULDER_SHAPES[i % TCO_NORM_BOULDER_SHAPES.length];
    const du = L_i * 1.02;
    const dv = d_short * 1.04;
    const poly = shapeTemplate.map(uv => {
      const u = uv[0] * du;
      const v = uv[1] * dv;
      return [
        xc + u * Nx + v * Tx,
        yc + u * Ny + v * Ty
      ];
    });

    boulders.push({
      index: i + 1,
      L_i,
      B_i,
      d_short,
      H_above,
      ratio5x,
      lsRatio,
      poly
    });
  }

  // 基礎與止滑榫幾何
  const x_base_left = H2 > 0 ? -B_heel : 0;
  const x_base_right = H2 > 0 ? (x_stone_bot_front + B_toe) : (x_stone_bot_front + w_exc_front);
  const B3 = x_base_right - x_base_left;
  const B_bot = B3;

  // 止滑榫 (兩側固定 1:3 斜率)
  const keySlopeW = R1 / 3.0;
  const keyTopW = R1 > 0 ? (P1 + 2.0 * keySlopeW) : 0;
  let X_key = getNum('inp_X_key', 30);
  if (R1 > 0) {
    X_key = Math.max(0, Math.min(X_key, Math.max(0, B3 - keyTopW)));
  }
  const x_key_top_right = x_base_right - X_key;
  const x_key_top_left = x_key_top_right - keyTopW;
  const x_key_bot_right = x_key_top_right - keySlopeW;
  const x_key_bot_left = x_key_top_left + keySlopeW;
  const y_base_bot = -H2;
  const y_key_bot = -(H2 + R1);

  // PC 打底寬度
  const B_pc = t_pc > 0 ? (B3 + 2 * w_pc) : 0;
  const B_pc_net = t_pc > 0 ? Math.max(0, B_pc - keyTopW) : 0;

  // 開挖線頂點：頂部左角對齊坡頂背填左緣 x_grav_top_left，底部左角對齊 x_exc_bot_left
  // 如此當調整 t_grav_top 與 t_grav_bot 時，頂部與底部礫石區寬度皆 100% 即時伸縮！
  const x_exc_bot_left = x_base_left;
  const x_exc_bot_right = H2 > 0 ? Math.max(x_base_right, x_stone_bot_front + w_exc_front) : (x_stone_bot_front + w_exc_front);
  const B_exc_bot = x_exc_bot_right - x_exc_bot_left;
  const y_exc_bot = y_base_bot - t_pc;
  const y_exc_top_left = H_total - 12;
  const x_exc_top_left = x_grav_top_left;
  const H_exc_front = Df - y_exc_bot;
  const x_exc_top_right = x_exc_bot_right + H_exc_front * m_exc;
  const y_exc_top_right = Df;

  // 生成正視(立面)圖與平面圖之 DXF 塊石多邊形陣列 (取代原本的六角形，全數使用 DXF 塊石圖案)
  const xElevL = 320;
  const xElevR = xElevL + L_unit;
  const elevBoulders = [];
  const elevChinks = [];

  for (let r = 0; r < N_layer; r++) {
    const yBotR = r * h_layer;
    const yTopR = (r + 1) * h_layer;
    const ymR = 0.5 * (yBotR + yTopR);
    const wStoneNom = Math.max(44, d_short * 1.18);
    const nCols = Math.max(3, Math.round(L_unit / wStoneNom));
    const colW = L_unit / nCols;
    const offsetStagger = (r % 2 === 1) ? 0.45 * colW : 0;

    for (let c = -1; c <= nCols; c++) {
      const xc1 = Math.max(xElevL + 2, xElevL + c * colW + offsetStagger);
      const xc2 = Math.min(xElevR - 2, xElevL + (c + 1) * colW + offsetStagger);
      const wCell = xc2 - xc1;
      if (wCell < 16) continue;

      const xm = 0.5 * (xc1 + xc2);
      const shapeIdx = (r * 3 + c * 5 + 80) % TCO_NORM_BOULDER_SHAPES.length;
      const shape = TCO_NORM_BOULDER_SHAPES[shapeIdx];
      const flipX = ((r + c) % 2 === 0) ? 1 : -1;
      const flipY = (c % 3 === 0) ? -1 : 1;
      const rotSmall = (seededRand(r * 71 + c * 19) - 0.5) * 0.14;
      const cosA = Math.cos(rotSmall), sinA = Math.sin(rotSmall);

      const poly = shape.map(uv => {
        const ux = uv[0] * flipX * wCell * 0.96;
        const vy = uv[1] * flipY * h_layer * 0.95;
        return [
          xm + ux * cosA - vy * sinA,
          ymR + ux * sinA + vy * cosA
        ];
      });
      elevBoulders.push(poly);

      // 塊石縫隙嵌塞小塊石 (亦採用縮小版 DXF 塊石多邊形)
      if (xc2 < xElevR - 10 && r < N_layer - 1) {
        const chinkShape = TCO_NORM_BOULDER_SHAPES[(r + c + 3) % TCO_NORM_BOULDER_SHAPES.length];
        const chinkPoly = chinkShape.map(uv => [
          xc2 + uv[0] * 11.0,
          yTopR + uv[1] * 8.5
        ]);
        elevChinks.push(chinkPoly);
      }
    }
  }

  // 平面圖坡頂塊石多邊形 (使用 DXF 塊石圖案排列於坡頂帶)
  const yPlanToe = H_total + 150;
  const yPlanCrestFront = yPlanToe + W_batter;
  const yPlanCrestBack = yPlanCrestFront + B1;
  const yPlanGravBack = yPlanCrestBack + t_grav_top;
  const planCapBoulders = [];
  const nCapCols = Math.max(4, Math.round(L_unit / 62));
  const capColW = L_unit / nCapCols;
  for (let c = 0; c < nCapCols; c++) {
    const xm = xElevL + (c + 0.5) * capColW;
    const ym = 0.5 * (yPlanCrestFront + yPlanCrestBack);
    const shape = TCO_NORM_BOULDER_SHAPES[(c * 3 + 2) % TCO_NORM_BOULDER_SHAPES.length];
    const flipX = (c % 2 === 0) ? 1 : -1;
    const poly = shape.map(uv => [
      xm + uv[0] * flipX * capColW * 0.95,
      ym + uv[1] * B1 * 0.94
    ]);
    planCapBoulders.push(poly);
  }

  // 工程數量計算
  const Lm = L_unit / 100.0;
  const H_tot_m = H_total / 100.0;
  const L_slope_m = L_slope / 100.0;
  const B1_m = B1 / 100.0;
  const B2_m = B2 / 100.0;

  // 1. 乾砌大塊石體積
  const area_stone = ((B1_m + B2_m) / 2.0) * H_tot_m;
  const vol_stone_unit = area_stone * Lm;
  const f_stone = `((${B1_m.toFixed(2)}+${B2_m.toFixed(2)})/2) * ${H_tot_m.toFixed(2)} * ${Lm.toFixed(1)}`;

  // 2. 背填卵礫石或級配濾層 (頂寬 t_grav_top 與底寬 t_grav_bot 平均值 * H_total)
  const tg_top_m = t_grav_top / 100.0;
  const tg_bot_m = t_grav_bot / 100.0;
  const area_gravel = ((tg_top_m + tg_bot_m) / 2.0) * H_tot_m;
  const vol_gravel_unit = area_gravel * Lm;
  const f_gravel = `((${tg_top_m.toFixed(2)}+${tg_bot_m.toFixed(2)})/2) * ${H_tot_m.toFixed(2)} * ${Lm.toFixed(1)}`;

  // 3. 臨水面砌石整平及卵石填縫面積
  const area_face_m = L_slope_m;
  const area_face_unit = area_face_m * Lm;
  const f_face = `${L_slope_m.toFixed(2)} * ${Lm.toFixed(1)}`;

  // 4. 結構土石方開挖
  const Df_m = Df / 100.0;
  const w_ef_m = w_exc_front / 100.0;
  const area_exc_front = (w_ef_m + 0.5 * Df_m * (n_slope + m_exc)) * Df_m;
  const area_exc_base = (B_exc_bot / 100.0) * ((H2 + t_pc) / 100.0) + (R1 > 0 ? ((P1 + keyTopW) / 200.0) * (R1 / 100.0) : 0);
  let area_exc = 0;
  let f_exc = '';
  if (exc_mode === 'full') {
    area_exc = area_stone + area_gravel + area_exc_front + area_exc_base;
    f_exc = `(${area_stone.toFixed(2)}+${area_gravel.toFixed(2)}+${area_exc_front.toFixed(2)}${area_exc_base > 0 ? '+' + area_exc_base.toFixed(2) : ''}) * ${Lm.toFixed(1)}`;
  } else {
    const B_emb_bot = B_exc_bot / 100.0;
    const H_emb = (Df + H2 + t_pc) / 100.0;
    const B_emb_top = B_emb_bot + 2 * m_exc * H_emb;
    area_exc = ((B_emb_bot + B_emb_top) / 2.0) * H_emb;
    f_exc = `((${B_emb_bot.toFixed(2)}+${B_emb_top.toFixed(2)})/2) * ${H_emb.toFixed(2)} * ${Lm.toFixed(1)}`;
  }
  const vol_exc_unit = area_exc * Lm;

  // 5. 前趾與坡頂回填土石方
  const w_tf_m = w_top_fill / 100.0;
  const area_top_fill = w_tf_m * 0.35 * 0.5;
  const area_backfill = area_exc_front + area_top_fill;
  const vol_backfill_unit = area_backfill * Lm;
  const f_backfill = `(${area_exc_front.toFixed(2)} + ${w_tf_m.toFixed(2)}*0.35*0.5) * ${Lm.toFixed(1)}`;

  // 6. 坡頂植生綠化及砌石縫扦插活枝條
  const area_veg_m = w_tf_m;
  const area_veg_unit = area_veg_m * Lm;
  const f_veg = `${w_tf_m.toFixed(2)} * ${Lm.toFixed(1)}`;

  // 7. 選配：底部混凝土基礎 + 止滑榫、PC打底、模板、鋼筋
  const B3_m = B3 / 100.0;
  const H2_m = H2 / 100.0;
  const R1_m = R1 / 100.0;
  const P1_m = P1 / 100.0;
  const keyTopW_m = keyTopW / 100.0;
  const area_conc_base = B3_m * H2_m;
  const area_conc_key = R1 > 0 ? ((P1_m + keyTopW_m) / 2.0) * R1_m : 0;
  const area_conc = area_conc_base + area_conc_key;
  const vol_conc_unit = area_conc * Lm;
  const f_conc = H2 > 0 || R1 > 0
    ? `(${B3_m.toFixed(2)}*${H2_m.toFixed(2)} + ((${P1_m.toFixed(2)}+${keyTopW_m.toFixed(2)})/2)*${R1_m.toFixed(2)}) * ${Lm.toFixed(1)}`
    : `0 (純乾砌石基腳無混凝土基礎)`;

  const B_pc_m = B_pc / 100.0;
  const t_pc_m = t_pc / 100.0;
  const area_pc = t_pc > 0 ? ((B_pc - keyTopW) / 100.0) * t_pc_m : 0;
  const vol_pc_unit = area_pc * Lm;
  const f_pc = t_pc > 0
    ? `(${B_pc_m.toFixed(2)} - ${keyTopW_m.toFixed(2)}) * ${t_pc_m.toFixed(2)} * ${Lm.toFixed(1)}`
    : `0 (未設置 PC 打底)`;

  const mainSpec = TCO_CNS560_REBAR[rebar_main_key];
  const subSpec = TCO_CNS560_REBAR[rebar_sub_key];
  const c_base = 7.5;
  let weight_rebar_unit = 0;
  let n_main_sets = Math.floor(L_unit / S_rebar) + 1;
  let n_sub_dots = 0;
  let f_rebar = `0 (純乾砌石模式無鋼筋)`;
  if (H2 > 0) {
    const len_stirrup_m = (2 * ((B3 - 2 * c_base) + Math.max(10, H2 - 2 * c_base)) + 20) / 100.0;
    const len_key_v_m = R1 > 0 ? (P1 + 2 * R1 * Math.sqrt(1 + 1 / 9) + 60) / 100.0 : 0;
    const w_main = n_main_sets * (len_stirrup_m + len_key_v_m) * mainSpec.unitW;

    const n_top_bot = Math.max(4, Math.floor((B3 - 2 * c_base) / S_rebar) + 1) * 2;
    const n_key_dots = R1 > 0 ? 4 : 0;
    n_sub_dots = n_top_bot + n_key_dots;
    const w_sub = n_sub_dots * Lm * subSpec.unitW;
    weight_rebar_unit = w_main + w_sub;
    f_rebar = `主筋${rebar_main_key}:${n_main_sets}組*${(len_stirrup_m + len_key_v_m).toFixed(2)}m*${mainSpec.unitW} + 副筋${rebar_sub_key}:${n_sub_dots}支*${Lm.toFixed(1)}m*${subSpec.unitW}`;
  }

  const quantities = [
    { id: '1', name: `乾砌∮41~80cm大塊石(大塊石佔${R_boulder}%)`, unit: 'm³', formula: f_stone, perM: area_stone, total: vol_stone_unit, note: `主塊石 ${(vol_stone_unit * R_boulder / 100).toFixed(2)} m³ / 填縫卵石 ${(vol_stone_unit * (100 - R_boulder) / 100).toFixed(2)} m³` },
    { id: '2', name: '背填卵礫石或級配濾層', unit: 'm³', formula: f_gravel, perM: area_gravel, total: vol_gravel_unit, note: `頂寬 ${t_grav_top}cm / 底寬 ${t_grav_bot}cm` },
    { id: '3', name: '乾砌石臨水面整平及五/六圍砌填縫', unit: 'm²', formula: f_face, perM: area_face_m, total: area_face_unit, note: `坡度 1:${n_slope}，斜面長 ${L_slope.toFixed(1)}cm` },
    { id: '4', name: '結構土石方開挖', unit: 'm³', formula: f_exc, perM: area_exc, total: vol_exc_unit, note: exc_mode === 'full' ? `開挖線全斷面` : `地面線 Df=${Df}cm 以下` },
    { id: '5', name: '溪床前趾與坡頂土石方回填', unit: 'm³', formula: f_backfill, perM: area_backfill, total: vol_backfill_unit, note: `前趾埋深 ${Df}cm 回填 + 坡頂回填` },
    { id: '6', name: '坡頂植生綠化及石縫扦插活枝條', unit: 'm²', formula: f_veg, perM: area_veg_m, total: area_veg_unit, note: `坡頂回填寬 ${w_top_fill}cm 植生護坡` }
  ];

  if (H2 > 0 || R1 > 0 || t_pc > 0) {
    quantities.push(
      { id: '7', name: '底部基礎與止滑榫結構混凝土', unit: 'm³', formula: f_conc, perM: area_conc, total: vol_conc_unit, note: `基礎厚 H2=${H2}cm, 止滑榫 R1=${R1}cm` },
      { id: '8', name: '分段水平 PC 打底混凝土', unit: 'm³', formula: f_pc, perM: area_pc, total: vol_pc_unit, note: `厚 t_pc=${t_pc}cm (扣除止滑榫開口)` },
      { id: '9', name: `基礎與止滑榫竹節鋼筋 (${rebar_main_key}/${rebar_sub_key})`, unit: 'kg', formula: f_rebar, perM: weight_rebar_unit / Lm, total: weight_rebar_unit, note: `CNS 560 圓點總數 ${n_sub_dots} 顆` }
    );
  }

  return {
    H1, Df, H_total, n_slope, N_layer, L_top, L_bot, R_boulder, L_unit, Lm,
    t_grav_top, t_grav_bot, w_exc_front, m_exc, w_top_fill, exc_mode,
    H2, B_toe, B_heel, X_key, R1, P1, keySlopeW, keyTopW, t_pc, w_pc,
    rebar_main_key, rebar_sub_key, S_rebar, n_sub_dots,
    slopeFactor, L_slope, W_batter, Tx, Ty, Nx, Ny,
    B1, B2, B3, B_bot, B_pc, B_pc_net, h_layer, d_short,
    x_grav_bot_left, x_stone_bot_back, x_stone_bot_front,
    x_stone_top_front, x_stone_top_back, x_grav_top_left,
    x_base_left, x_base_right,
    x_key_top_left, x_key_top_right, x_key_bot_left, x_key_bot_right,
    y_base_bot, y_key_bot,
    x_exc_bot_left, x_exc_bot_right, B_exc_bot, y_exc_bot,
    x_exc_top_left, y_exc_top_left, x_exc_top_right, y_exc_top_right,
    boulders, elevBoulders, elevChinks, planCapBoulders,
    yPlanToe, yPlanCrestFront, yPlanCrestBack, yPlanGravBack,
    maxHeightToLongAxisRatio, minLongToShortRatio, maxLongToShortRatio,
    quantities
  };
}
function tcoDry402Prims(m, OPT, part) {
  OPT = Object.assign({ gravel: true, dims: true }, OPT || {}); const O = [];
  const drawWorldLine = (x1, y1, x2, y2, color = '#ffffff', lineWidth = 1.5, dash = []) => O.push({ k: 'L', p: [[x1, y1], [x2, y2]], c: color, w: lineWidth, d: dash });
  const drawWorldPoly = (pts, strokeColor = '#ffffff', lineWidth = 1.5, fillColor = null, close = true, dash = []) => { if (pts && pts.length >= 2) O.push({ k: 'P', p: pts.map(q => [q[0], q[1]]), c: strokeColor, w: lineWidth, f: fillColor, cl: close, d: dash }); };
  const drawWorldCircle = (wx, wy, rWorld, strokeColor = '#ffffff', fillColor = null, lineWidth = 1.2) => O.push({ k: 'C', x: wx, y: wy, r: rWorld, c: strokeColor, f: fillColor, w: lineWidth });
  const drawWorldText = (wx, wy, text, heightWorld = 10, color = '#ffffff', align = 'center', baseline = 'middle', rotRad = 0) => O.push({ k: 'T', x: wx, y: wy, s: String(text), h: heightWorld, c: color, al: align, bl: baseline, rot: rotRad });
  const drawGravel = (outerPoly, holePolys = [], tileSizeWorld = 52.0, strokeColor = '#d946ef') => { if (outerPoly && outerPoly.length >= 3) O.push({ k: 'G', outer: outerPoly, holes: holePolys, tile: tileSizeWorld, c: strokeColor }); };
function getDimExtensionCoords(coordObj, dimPos) {
  const minGapFromObj = 10.0;
  const maxInnerTick = 12.0;
  const outerTick = 4.5;
  const dir = dimPos >= coordObj ? 1 : -1;
  const dist = Math.abs(dimPos - coordObj);
  const innerLen = Math.min(maxInnerTick, Math.max(2.0, dist - minGapFromObj));
  const startCoord = dimPos - dir * innerLen;
  const endCoord = dimPos + dir * outerTick;
  return { startCoord, endCoord };
}
function drawHorizDim(x1, yObj1, x2, yObj2, yDim, text, color = '#38bdf8') {
  if (Math.abs(x2 - x1) < 0.05) return;
  const ext1 = getDimExtensionCoords(yObj1, yDim);
  const ext2 = getDimExtensionCoords(yObj2, yDim);
  drawWorldLine(x1, ext1.startCoord, x1, ext1.endCoord, color, 1.1);
  drawWorldLine(x2, ext2.startCoord, x2, ext2.endCoord, color, 1.1);
  drawWorldLine(x1, yDim, x2, yDim, color, 1.2);

  const xa = Math.min(x1, x2), xb = Math.max(x1, x2);
  const arr = Math.min(5.0, Math.abs(xb - xa) * 0.22);
  drawWorldPoly([[xa, yDim], [xa + arr, yDim + arr * 0.35], [xa + arr, yDim - arr * 0.35]], color, 1, color, true);
  drawWorldPoly([[xb, yDim], [xb - arr, yDim + arr * 0.35], [xb - arr, yDim - arr * 0.35]], color, 1, color, true);

  const xm = 0.5 * (x1 + x2);
  const offsetT = yDim >= Math.max(yObj1, yObj2) ? 7.5 : -7.5;
  drawWorldText(xm, yDim + offsetT, text, 8.5, '#f8fafc', 'center', 'middle');
}
function drawVertDim(xObj1, y1, xObj2, y2, xDim, text, color = '#38bdf8') {
  if (Math.abs(y2 - y1) < 0.05) return;
  const ext1 = getDimExtensionCoords(xObj1, xDim);
  const ext2 = getDimExtensionCoords(xObj2, xDim);
  drawWorldLine(ext1.startCoord, y1, ext1.endCoord, y1, color, 1.1);
  drawWorldLine(ext2.startCoord, y2, ext2.endCoord, y2, color, 1.1);
  drawWorldLine(xDim, y1, xDim, y2, color, 1.2);

  const ya = Math.min(y1, y2), yb = Math.max(y1, y2);
  const arr = Math.min(5.0, Math.abs(yb - ya) * 0.22);
  drawWorldPoly([[xDim, ya], [xDim - arr * 0.35, ya + arr], [xDim + arr * 0.35, ya + arr]], color, 1, color, true);
  drawWorldPoly([[xDim, yb], [xDim - arr * 0.35, yb - arr], [xDim + arr * 0.35, yb - arr]], color, 1, color, true);

  const ym = 0.5 * (y1 + y2);
  const offsetT = xDim <= Math.min(xObj1, xObj2) ? -8.5 : 8.5;
  drawWorldText(xDim + offsetT, ym, text, 8.5, '#f8fafc', 'center', 'middle', Math.PI / 2);
}
function drawLeader(xTip, yTip, xKnee, yKnee, dirRight, textLines, lineCol = '#ef4444', txtCol = '#38bdf8') {
  const shelfLen = 65 * (dirRight ? 1 : -1);
  drawWorldLine(xTip, yTip, xKnee, yKnee, lineCol, 1.3);
  drawWorldLine(xKnee, yKnee, xKnee + shelfLen, yKnee, lineCol, 1.3);
  const dx = xKnee - xTip, dy = yKnee - yTip;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len, uy = dy / len;
  const px = -uy, py = ux;
  const arr = 6.5;
  drawWorldPoly([
    [xTip, yTip],
    [xTip + ux * arr + px * arr * 0.32, yTip + uy * arr + py * arr * 0.32],
    [xTip + ux * arr - px * arr * 0.32, yTip + uy * arr - py * arr * 0.32]
  ], lineCol, 1, lineCol, true);

  const tx = xKnee + (dirRight ? 6 : -6);
  const align = dirRight ? 'left' : 'right';
  textLines.forEach((line, idx) => {
    drawWorldText(tx, yKnee + 7 - idx * 13, line, 9.0, txtCol, align, 'middle');
  });
}

  if (part === 'sec') {
  // 2. 選配：底部水平混凝土基礎、1:3 梯形止滑榫、分段水平 PC 打底、CNS 560 鋼筋
  if (m.H2 > 0 || m.R1 > 0) {
    const basePoly = [
      [m.x_base_left, 0],
      [m.x_base_right, 0],
      [m.x_base_right, m.y_base_bot]
    ];
    if (m.R1 > 0) {
      basePoly.push(
        [m.x_key_top_right, m.y_base_bot],
        [m.x_key_bot_right, m.y_key_bot],
        [m.x_key_bot_left, m.y_key_bot],
        [m.x_key_top_left, m.y_base_bot]
      );
    }
    basePoly.push([m.x_base_left, m.y_base_bot]);
    drawWorldPoly(basePoly, '#facc15', 2.0, 'rgba(250, 204, 21, 0.12)', true);

    if (m.R1 > 0) {
      const sx = m.x_key_top_right - m.keySlopeW * 0.5;
      const sy = m.y_base_bot - m.R1 * 0.5;
      drawWorldPoly([[sx, sy], [sx + 5, sy], [sx + 5, sy - 15]], '#38bdf8', 1.1, null, true);
      drawWorldText(sx + 10, sy - 4, '1', 6.5, '#38bdf8', 'left', 'middle');
      drawWorldText(sx + 2.5, sy + 4, '3', 6.5, '#38bdf8', 'center', 'middle');
    }

    if (m.H2 > 0) {
      const c = 6.0;
      const stirrup = [
        [m.x_base_left + c, -c],
        [m.x_base_right - c, -c],
        [m.x_base_right - c, m.y_base_bot + c],
        [m.x_base_left + c, m.y_base_bot + c]
      ];
      drawWorldPoly(stirrup, '#ef4444', 1.8, null, true);

      if (m.R1 > 0) {
        const vBar = [
          [Math.max(m.x_base_left + c, m.x_key_top_left - 25), -c - 2],
          [m.x_key_top_left + 3, -c - 2],
          [m.x_key_bot_left + 3, m.y_key_bot + c],
          [m.x_key_bot_right - 3, m.y_key_bot + c],
          [m.x_key_top_right - 3, -c - 2],
          [Math.min(m.x_base_right - c, m.x_key_top_right + 25), -c - 2]
        ];
        drawWorldPoly(vBar, '#ef4444', 1.8, null, false);
        drawWorldCircle(m.x_key_bot_left + 5, m.y_key_bot + c + 2, 2.2, '#ef4444', '#ef4444');
        drawWorldCircle(m.x_key_bot_right - 5, m.y_key_bot + c + 2, 2.2, '#ef4444', '#ef4444');
        drawWorldCircle(0.5 * (m.x_key_top_left + m.x_key_bot_left) + 3, 0.5 * (m.y_base_bot + m.y_key_bot), 2.2, '#ef4444', '#ef4444');
        drawWorldCircle(0.5 * (m.x_key_top_right + m.x_key_bot_right) - 3, 0.5 * (m.y_base_bot + m.y_key_bot), 2.2, '#ef4444', '#ef4444');
      }

      const nDots = Math.max(2, Math.floor((m.B3 - 2 * c) / m.S_rebar) + 1);
      const stepD = (m.B3 - 2 * c - 6) / Math.max(1, nDots - 1);
      for (let k = 0; k < nDots; k++) {
        const dx = m.x_base_left + c + 3 + k * stepD;
        drawWorldCircle(dx, -c - 2.2, 2.2, '#ef4444', '#ef4444');
        drawWorldCircle(dx, m.y_base_bot + c + 2.2, 2.2, '#ef4444', '#ef4444');
      }
    }
  }

  // 分段水平 PC 打底層
  if (m.t_pc > 0) {
    const x_pc_L = m.x_base_left - m.w_pc;
    const x_pc_R = m.x_base_right + m.w_pc;
    const y_pc_top = m.y_base_bot;
    const y_pc_bot = m.y_base_bot - m.t_pc;
    if (m.R1 > 0) {
      if (m.x_key_top_left > x_pc_L) {
        drawWorldPoly([
          [x_pc_L, y_pc_top],
          [m.x_key_top_left, y_pc_top],
          [m.x_key_top_left + m.t_pc / 3.0, y_pc_bot],
          [x_pc_L, y_pc_bot]
        ], '#22c55e', 1.6, 'rgba(34, 197, 94, 0.15)', true);
      }
      if (x_pc_R > m.x_key_top_right) {
        drawWorldPoly([
          [m.x_key_top_right, y_pc_top],
          [x_pc_R, y_pc_top],
          [x_pc_R, y_pc_bot],
          [m.x_key_top_right - m.t_pc / 3.0, y_pc_bot]
        ], '#22c55e', 1.6, 'rgba(34, 197, 94, 0.15)', true);
      }
    } else {
      drawWorldPoly([
        [x_pc_L, y_pc_top],
        [x_pc_R, y_pc_top],
        [x_pc_R, y_pc_bot],
        [x_pc_L, y_pc_bot]
      ], '#22c55e', 1.6, 'rgba(34, 197, 94, 0.15)', true);
    }
  }

  // 3. 繪製乾砌大塊石剖面 (圖層 0，黃色實線)
  m.boulders.forEach(b => {
    drawWorldPoly(b.poly, '#facc15', 2.2, 'rgba(250, 204, 21, 0.18)', true);
  });


    return O;
  }
  const x_top_fill_left = m.x_grav_top_left - m.w_top_fill;
  const y_top_fill_left = m.H_total + 9.0;
  const x_toe_slope = m.x_stone_bot_front - (m.Df / m.H_total) * m.W_batter;

  // 1. 原圖 DXF GRAVEL 剖面填充區 (包含：坡頂回填區、牆背卵礫石濾層區、前趾回填區，並自動扣除塊石內部)
  const fullGravelOuterPoly = [
    [x_top_fill_left, y_top_fill_left],
    [m.x_stone_top_front, m.H_total],
    [x_toe_slope, m.Df],
    [m.x_exc_top_right, m.y_exc_top_right],
    [m.x_exc_bot_right, 0],
    [0, 0],
    [m.x_exc_top_left, m.y_exc_top_left]
  ];
  const boulderHolePolys = m.boulders.map(b => b.poly);

  if (OPT.gravel) {
    drawGravel(fullGravelOuterPoly, boulderHolePolys, 52.0, '#d946ef');
  }

  // 背填卵礫石濾層與回填區分界輔助線
  drawWorldLine(m.x_exc_top_left, m.y_exc_top_left, m.x_stone_top_back, m.H_total, '#c084fc', 1.1, [4, 4]);

  // 2. 選配：底部水平混凝土基礎、1:3 梯形止滑榫、分段水平 PC 打底、CNS 560 鋼筋
  if (m.H2 > 0 || m.R1 > 0) {
    const basePoly = [
      [m.x_base_left, 0],
      [m.x_base_right, 0],
      [m.x_base_right, m.y_base_bot]
    ];
    if (m.R1 > 0) {
      basePoly.push(
        [m.x_key_top_right, m.y_base_bot],
        [m.x_key_bot_right, m.y_key_bot],
        [m.x_key_bot_left, m.y_key_bot],
        [m.x_key_top_left, m.y_base_bot]
      );
    }
    basePoly.push([m.x_base_left, m.y_base_bot]);
    drawWorldPoly(basePoly, '#facc15', 2.0, 'rgba(250, 204, 21, 0.12)', true);

    if (m.R1 > 0) {
      const sx = m.x_key_top_right - m.keySlopeW * 0.5;
      const sy = m.y_base_bot - m.R1 * 0.5;
      drawWorldPoly([[sx, sy], [sx + 5, sy], [sx + 5, sy - 15]], '#38bdf8', 1.1, null, true);
      drawWorldText(sx + 10, sy - 4, '1', 6.5, '#38bdf8', 'left', 'middle');
      drawWorldText(sx + 2.5, sy + 4, '3', 6.5, '#38bdf8', 'center', 'middle');
    }

    if (m.H2 > 0) {
      const c = 6.0;
      const stirrup = [
        [m.x_base_left + c, -c],
        [m.x_base_right - c, -c],
        [m.x_base_right - c, m.y_base_bot + c],
        [m.x_base_left + c, m.y_base_bot + c]
      ];
      drawWorldPoly(stirrup, '#ef4444', 1.8, null, true);

      if (m.R1 > 0) {
        const vBar = [
          [Math.max(m.x_base_left + c, m.x_key_top_left - 25), -c - 2],
          [m.x_key_top_left + 3, -c - 2],
          [m.x_key_bot_left + 3, m.y_key_bot + c],
          [m.x_key_bot_right - 3, m.y_key_bot + c],
          [m.x_key_top_right - 3, -c - 2],
          [Math.min(m.x_base_right - c, m.x_key_top_right + 25), -c - 2]
        ];
        drawWorldPoly(vBar, '#ef4444', 1.8, null, false);
        drawWorldCircle(m.x_key_bot_left + 5, m.y_key_bot + c + 2, 2.2, '#ef4444', '#ef4444');
        drawWorldCircle(m.x_key_bot_right - 5, m.y_key_bot + c + 2, 2.2, '#ef4444', '#ef4444');
        drawWorldCircle(0.5 * (m.x_key_top_left + m.x_key_bot_left) + 3, 0.5 * (m.y_base_bot + m.y_key_bot), 2.2, '#ef4444', '#ef4444');
        drawWorldCircle(0.5 * (m.x_key_top_right + m.x_key_bot_right) - 3, 0.5 * (m.y_base_bot + m.y_key_bot), 2.2, '#ef4444', '#ef4444');
      }

      const nDots = Math.max(2, Math.floor((m.B3 - 2 * c) / m.S_rebar) + 1);
      const stepD = (m.B3 - 2 * c - 6) / Math.max(1, nDots - 1);
      for (let k = 0; k < nDots; k++) {
        const dx = m.x_base_left + c + 3 + k * stepD;
        drawWorldCircle(dx, -c - 2.2, 2.2, '#ef4444', '#ef4444');
        drawWorldCircle(dx, m.y_base_bot + c + 2.2, 2.2, '#ef4444', '#ef4444');
      }
    }
  }

  // 分段水平 PC 打底層
  if (m.t_pc > 0) {
    const x_pc_L = m.x_base_left - m.w_pc;
    const x_pc_R = m.x_base_right + m.w_pc;
    const y_pc_top = m.y_base_bot;
    const y_pc_bot = m.y_base_bot - m.t_pc;
    if (m.R1 > 0) {
      if (m.x_key_top_left > x_pc_L) {
        drawWorldPoly([
          [x_pc_L, y_pc_top],
          [m.x_key_top_left, y_pc_top],
          [m.x_key_top_left + m.t_pc / 3.0, y_pc_bot],
          [x_pc_L, y_pc_bot]
        ], '#22c55e', 1.6, 'rgba(34, 197, 94, 0.15)', true);
      }
      if (x_pc_R > m.x_key_top_right) {
        drawWorldPoly([
          [m.x_key_top_right, y_pc_top],
          [x_pc_R, y_pc_top],
          [x_pc_R, y_pc_bot],
          [m.x_key_top_right - m.t_pc / 3.0, y_pc_bot]
        ], '#22c55e', 1.6, 'rgba(34, 197, 94, 0.15)', true);
      }
    } else {
      drawWorldPoly([
        [x_pc_L, y_pc_top],
        [x_pc_R, y_pc_top],
        [x_pc_R, y_pc_bot],
        [x_pc_L, y_pc_bot]
      ], '#22c55e', 1.6, 'rgba(34, 197, 94, 0.15)', true);
    }
  }

  // 3. 繪製乾砌大塊石剖面 (圖層 0，黃色實線)
  m.boulders.forEach(b => {
    drawWorldPoly(b.poly, '#facc15', 2.2, 'rgba(250, 204, 21, 0.18)', true);
  });

  // 4. 開挖線 (圖層 BASE, HIDDEN 白色虛線)
  const excPoly = [
    [x_top_fill_left, y_top_fill_left],
    [m.x_exc_top_left, m.y_exc_top_left],
    [m.x_exc_bot_left, m.y_exc_bot],
    [m.x_exc_bot_right, m.y_exc_bot],
    [m.x_exc_top_right, m.y_exc_top_right]
  ];
  drawWorldPoly(excPoly, '#e2e8f0', 1.5, null, false, [8, 5]);

  // 5. 坡頂回填頂面線 (Handle 161D) + 植生草皮符號 + 牆前水平埋深基準線 (不畫不規則自然地形線)
  drawWorldLine(m.x_stone_top_front, m.H_total, x_top_fill_left, y_top_fill_left, '#f8fafc', 1.8);
  drawWorldLine(x_toe_slope, m.Df, m.x_exc_top_right, m.Df, '#f8fafc', 1.5);

  // 坡頂植生草皮符號 (對應原圖 1623~1630)
  for (let g = 0; g < 4; g++) {
    const t = 0.22 + g * 0.18;
    const gx = m.x_stone_top_front * (1 - t) + x_top_fill_left * t;
    const gy = m.H_total * (1 - t) + y_top_fill_left * t;
    drawWorldLine(gx, gy, gx - 4.5, gy + 5.5, '#94a3b8', 1.2);
    drawWorldLine(gx + 2, gy, gx - 2.5, gy + 5.5, '#94a3b8', 1.2);
    drawWorldLine(gx + 4, gy, gx + 8.5, gy + 4.5, '#94a3b8', 1.2);
  }

  // 6. 臨水面坡度標示直角三角形 (1 : n) (對應原圖 1620, 1621, 1622)
  const yTriTop = m.Df + 0.58 * m.H1;
  const xTriSlope = m.x_stone_bot_front - (yTriTop / m.H_total) * m.W_batter;
  const triX1 = xTriSlope + 32;
  const triH = 26;
  const triW = triH * m.n_slope;
  drawWorldPoly([
    [triX1, yTriTop],
    [triX1 + triW, yTriTop],
    [triX1 + triW, yTriTop - triH]
  ], '#94a3b8', 1.3, null, true);
  drawWorldText(triX1 + 0.5 * triW, yTriTop + 6, `n=${m.n_slope}`, 8.0, '#38bdf8', 'center', 'middle');
  drawWorldText(triX1 + triW + 6, yTriTop - 0.5 * triH, '1', 8.0, '#38bdf8', 'left', 'middle');

  // 7. 原圖 0402-1 基準比對線疊加 (不含地形線)
  if (false) {
    ORIG_REF_DATA.boulders.forEach(b => {
      drawWorldPoly(b, '#f472b6', 1.4, null, true, [4, 4]);
    });
    drawWorldPoly(ORIG_REF_DATA.exc, '#f472b6', 1.4, null, false, [4, 4]);
    drawWorldPoly(ORIG_REF_DATA.topFill, '#f472b6', 1.4, null, false, [4, 4]);
  }

  // 8. 斷面圖青色引線標註 (已移除地盤線引線)
  drawLeader(
    m.x_stone_bot_front - 0.65 * m.W_batter - 12, m.Df + 0.52 * m.H1,
    m.x_stone_bot_front + 25, m.Df + 0.72 * m.H1,
    true,
    [`乾砌∮41~80cm大塊石(佔${m.R_boulder}%以上)`, `頂石長徑 ${m.L_top}cm / 底石長徑 ${m.L_bot}cm`]
  );
  drawLeader(
    0.5 * (m.x_stone_top_front + x_top_fill_left), 0.5 * (m.H_total + y_top_fill_left),
    m.x_stone_top_front + 22, m.H_total + 34,
    true,
    ['回填 (坡頂植生綠化)']
  );
  drawLeader(
    0.5 * (m.x_exc_top_left + m.x_stone_top_back), 0.55 * m.H_total,
    m.x_exc_top_left - 25, 0.55 * m.H_total - 20,
    false,
    [`背填卵礫石或級配 (頂寬${m.t_grav_top}/底寬${m.t_grav_bot}cm)`]
  );
  drawLeader(
    0.5 * (m.x_exc_top_left + m.x_exc_bot_left), 0.25 * m.H_total,
    m.x_exc_top_left - 25, 0.25 * m.H_total - 20,
    false,
    [`開挖線`]
  );

  if (m.H2 > 0 || m.R1 > 0) {
    drawLeader(
      m.x_key_bot_right, m.y_key_bot,
      m.x_base_right + 30, m.y_key_bot - 10,
      true,
      [`混凝土基礎 H2=${m.H2}cm + 1:3止滑榫(R1=${m.R1}, P1=${m.P1}cm)`]
    );
  }

  const ySecTitle = m.y_key_bot - m.t_pc - 125;
  drawWorldText(-20, ySecTitle, '乾 砌 石 護 岸 斷 面 圖', 15, '#38bdf8', 'center', 'middle');
  drawWorldLine(-115, ySecTitle - 11, 75, ySecTitle - 11, '#38bdf8', 2.0);
  drawWorldLine(-115, ySecTitle - 14.5, 75, ySecTitle - 14.5, '#38bdf8', 1.0);
  drawWorldText(-20, ySecTitle - 26, '註：本工程所有外露面皆以 3cm 偶角處理，塊石長徑應與臨水面垂直。', 8.5, '#fbbf24', 'center', 'middle');

  // 9. 斷面圖分層退縮尺寸標註
  if (OPT.dims) {
    const xLeftDim1 = Math.min(x_top_fill_left, m.x_exc_top_left) - 45;
    const xLeftDim2 = xLeftDim1 - 32;
    drawVertDim(m.x_stone_top_front, m.H_total, x_toe_slope, m.Df, xLeftDim1, `有效高 H1=${m.H1}`);
    drawVertDim(x_toe_slope, m.Df, m.x_stone_bot_back, 0, xLeftDim1, `基礎深 Df=${m.Df}`);
    if (m.H2 > 0) {
      drawVertDim(m.x_base_left, 0, m.x_base_left, m.y_base_bot, xLeftDim1, `基礎 H2=${m.H2}`);
    }
    if (m.R1 > 0) {
      drawVertDim(m.x_key_bot_left, m.y_base_bot, m.x_key_bot_left, m.y_key_bot, xLeftDim1, `止滑榫 R1=${m.R1}`);
    }
    drawVertDim(m.x_stone_top_front, m.H_total, m.x_stone_bot_back, 0, xLeftDim2, `護岸總高 H=${m.H_total}`);

    // 頂部水平標註 (含回填寬、背填頂寬 t_grav_top、頂石水平寬 B1)
    const yTopDim1 = y_top_fill_left + 32;
    drawHorizDim(x_top_fill_left, y_top_fill_left, m.x_grav_top_left, m.y_exc_top_left, yTopDim1, `回填 ${m.w_top_fill}`);
    drawHorizDim(m.x_grav_top_left, m.y_exc_top_left, m.x_stone_top_back, m.H_total, yTopDim1, `礫石頂寬 ${m.t_grav_top}`);
    drawHorizDim(m.x_stone_top_back, m.H_total, m.x_stone_top_front, m.H_total, yTopDim1, `頂石寬 B1=${m.B1.toFixed(1)}`);

    // 底部水平標註
    const yBotBase = m.y_key_bot - m.t_pc;
    const yDimL0 = yBotBase - 25;
    const yDimL1 = yBotBase - 50;
    const yDimL2 = yBotBase - 75;
    const yDimL3 = yBotBase - 100;

    if (m.R1 > 0) {
      drawHorizDim(m.x_key_bot_left, m.y_key_bot, m.x_key_bot_right, m.y_key_bot, yDimL0, `P1=${m.P1}`);
      drawHorizDim(m.x_key_top_right, m.y_base_bot, m.x_base_right, m.y_base_bot, yDimL0, `X_key=${m.X_key}`);
    }

    drawHorizDim(0, 0, m.x_stone_bot_back, 0, yDimL1, `礫石底寬 ${m.t_grav_bot}`);
    drawHorizDim(m.x_stone_bot_back, 0, m.x_stone_bot_front, 0, yDimL1, `底石寬 B2=${m.B2.toFixed(1)}`);
    drawHorizDim(m.x_stone_bot_front, 0, m.x_exc_bot_right, 0, yDimL1, `前趾餘寬 ${m.w_exc_front}`);

    drawHorizDim(m.x_exc_bot_left, m.y_exc_bot, m.x_exc_bot_right, m.y_exc_bot, yDimL2, `基底總寬 B3=${m.B_exc_bot.toFixed(1)}`);

    if (m.t_pc > 0) {
      const x_pc_L = m.x_base_left - m.w_pc;
      const x_pc_R = m.x_base_right + m.w_pc;
      drawHorizDim(x_pc_L, m.y_base_bot - m.t_pc, x_pc_R, m.y_base_bot - m.t_pc, yDimL3, `PC打底總寬 B_pc=${m.B_pc.toFixed(1)}`);
    }
  }

  // --------------------------------------------------------------------------
  // B. 右下區：【正視 (立面) 圖 (Front Elevation View)】(使用原圖 DXF 塊石多邊形呈現)
  // --------------------------------------------------------------------------
  const xElevL = 320;
  const xElevR = xElevL + m.L_unit;

  // 高程對齊引導虛線
  drawWorldLine(m.x_stone_top_front, m.H_total, xElevL, m.H_total, '#334155', 1.0, [5, 5]);
  drawWorldLine(m.x_exc_top_right, m.Df, xElevL, m.Df, '#334155', 1.0, [5, 5]);
  drawWorldLine(m.x_exc_bot_right, 0, xElevL, 0, '#334155', 1.0, [5, 5]);

  // 立面圖外框
  drawWorldPoly([
    [xElevL, 0],
    [xElevR, 0],
    [xElevR, m.H_total],
    [xElevL, m.H_total]
  ], '#facc15', 2.0, 'rgba(250, 204, 21, 0.04)', true);

  // 繪製立面圖 DXF 大塊石圖案與縫隙嵌塞小塊石 (100% 採用 4-02.dxf 塊石多邊形)
  m.elevBoulders.forEach(poly => {
    drawWorldPoly(poly, '#eab308', 1.4, 'rgba(250, 204, 21, 0.14)', true);
  });
  m.elevChinks.forEach(cPoly => {
    drawWorldPoly(cPoly, '#fde047', 1.0, 'rgba(253, 224, 71, 0.28)', true);
  });

  // 基礎埋深基準虛線 (不含自然地形線)
  drawWorldLine(xElevL, m.Df, xElevR, m.Df, '#38bdf8', 1.4, [8, 5]);
  drawWorldText(xElevR + 20, m.Df, `基礎埋深界線 (Df=${m.Df}cm)`, 8.5, '#38bdf8', 'left', 'middle');
  drawWorldText(xElevR + 20, m.H_total, `護岸坡頂線 (H=${m.H_total}cm)`, 8.5, '#38bdf8', 'left', 'middle');
  drawWorldText(xElevR + 20, 0, `基腳底面線 (EL.0.0cm)`, 8.5, '#facc15', 'left', 'middle');

  // 選配：立面圖底部混凝土基礎、止滑榫與 PC 打底
  if (m.H2 > 0) {
    drawWorldPoly([
      [xElevL, 0], [xElevR, 0], [xElevR, m.y_base_bot], [xElevL, m.y_base_bot]
    ], '#facc15', 1.6, 'rgba(250, 204, 21, 0.1)', true);
  }
  if (m.R1 > 0) {
    drawWorldPoly([
      [xElevL, m.y_base_bot], [xElevR, m.y_base_bot], [xElevR, m.y_key_bot], [xElevL, m.y_key_bot]
    ], '#facc15', 1.4, 'rgba(250, 204, 21, 0.08)', true, [6, 4]);
  }
  if (m.t_pc > 0) {
    drawWorldPoly([
      [xElevL - m.w_pc, m.y_base_bot],
      [xElevR + m.w_pc, m.y_base_bot],
      [xElevR + m.w_pc, m.y_base_bot - m.t_pc],
      [xElevL - m.w_pc, m.y_base_bot - m.t_pc]
    ], '#22c55e', 1.4, 'rgba(34, 197, 94, 0.12)', true);
  }

  if (OPT.dims) {
    drawHorizDim(xElevL, m.y_key_bot - m.t_pc, xElevR, m.y_key_bot - m.t_pc, m.y_key_bot - m.t_pc - 50, `單一分段標準長度 L_unit = ${m.L_unit} cm (${m.Lm.toFixed(1)} m)`);
  }
  drawWorldText(0.5 * (xElevL + xElevR), ySecTitle, '乾 砌 石 護 岸 正 視 (立 面) 圖 (DXF塊石疊砌圖案)', 15, '#38bdf8', 'center', 'middle');
  drawWorldLine(0.5 * (xElevL + xElevR) - 210, ySecTitle - 11, 0.5 * (xElevL + xElevR) + 210, ySecTitle - 11, '#38bdf8', 2.0);
  drawWorldLine(0.5 * (xElevL + xElevR) - 210, ySecTitle - 14.5, 0.5 * (xElevL + xElevR) + 210, ySecTitle - 14.5, '#38bdf8', 1.0);

  // --------------------------------------------------------------------------
  // C. 右上區：【平面圖 (Plan View)】(含 DXF 坡頂塊石圖案與背填 GRAVEL 填充)
  // --------------------------------------------------------------------------
  const yPlanToe = m.yPlanToe;
  const yPlanCrestFront = m.yPlanCrestFront;
  const yPlanCrestBack = m.yPlanCrestBack;
  const yPlanGravBack = m.yPlanGravBack;

  // 1. 臨水面斜坡區域
  drawWorldPoly([
    [xElevL, yPlanToe],
    [xElevR, yPlanToe],
    [xElevR, yPlanCrestFront],
    [xElevL, yPlanCrestFront]
  ], '#facc15', 1.8, 'rgba(250, 204, 21, 0.06)', true);

  // 臨水面長短相間標準示坡線
  const nTicks = Math.max(10, Math.floor(m.L_unit / 35));
  const stepTick = m.L_unit / nTicks;
  for (let t = 1; t < nTicks; t++) {
    const tx = xElevL + t * stepTick;
    const isLong = (t % 2 === 1);
    const tickLen = isLong ? m.W_batter * 0.78 : m.W_batter * 0.38;
    drawWorldLine(tx, yPlanCrestFront, tx, yPlanCrestFront - tickLen, '#eab308', 1.0);
  }

  // 2. 坡頂塊石頂面帶 (繪製 DXF 塊石頂面圖案)
  drawWorldPoly([
    [xElevL, yPlanCrestFront],
    [xElevR, yPlanCrestFront],
    [xElevR, yPlanCrestBack],
    [xElevL, yPlanCrestBack]
  ], '#facc15', 2.0, 'rgba(250, 204, 21, 0.12)', true);

  m.planCapBoulders.forEach(poly => {
    drawWorldPoly(poly, '#facc15', 1.3, 'rgba(250, 204, 21, 0.16)', true);
  });

  // 3. 坡頂背填卵礫石濾層帶 (同步鋪設 DXF GRAVEL 剖面圖案)
  const planGravelPoly = [
    [xElevL, yPlanCrestBack],
    [xElevR, yPlanCrestBack],
    [xElevR, yPlanGravBack],
    [xElevL, yPlanGravBack]
  ];
  if (OPT.gravel && m.t_grav_top > 0) {
    drawGravel(planGravelPoly, [], 52.0, '#d946ef');
  }
  drawWorldPoly(planGravelPoly, '#c084fc', 1.4, null, true);

  if (m.t_pc > 0) {
    drawWorldPoly([
      [xElevL - m.w_pc, yPlanToe - m.B_toe - m.w_pc],
      [xElevR + m.w_pc, yPlanToe - m.B_toe - m.w_pc],
      [xElevR + m.w_pc, yPlanGravBack + m.B_heel + m.w_pc],
      [xElevL - m.w_pc, yPlanGravBack + m.B_heel + m.w_pc]
    ], '#22c55e', 1.2, null, true, [6, 4]);
  }

  if (OPT.dims) {
    const xPlanDim = xElevR + 40;
    drawVertDim(xElevR, yPlanToe, xElevR, yPlanCrestFront, xPlanDim, `坡面水平投影 ${m.W_batter.toFixed(1)}`);
    drawVertDim(xElevR, yPlanCrestFront, xElevR, yPlanCrestBack, xPlanDim, `頂石寬 B1=${m.B1.toFixed(1)}`);
    drawVertDim(xElevR, yPlanCrestBack, xElevR, yPlanGravBack, xPlanDim + 28, `礫石頂寬 ${m.t_grav_top}`);
  }

  drawWorldText(0.5 * (xElevL + xElevR), yPlanToe - 32, '乾 砌 石 護 岸 平 面 圖', 15, '#38bdf8', 'center', 'middle');
  drawWorldLine(0.5 * (xElevL + xElevR) - 105, yPlanToe - 43, 0.5 * (xElevL + xElevR) + 105, yPlanToe - 43, '#38bdf8', 2.0);

  // --------------------------------------------------------------------------
  // D. 下方區：【圖面內建工程數量計算式表 (On-Canvas & DXF Table)】
  // --------------------------------------------------------------------------
  const tblX = -210;
  const tblYTop = ySecTitle - 60;
  const colWidths = [65, 360, 75, 550, 145, 145, 340];
  const tblW = colWidths.reduce((a, b) => a + b, 0);
  const rowH = 28;
  const headerH = 34;
  const titleH = 38;

  drawWorldPoly([
    [tblX, tblYTop],
    [tblX + tblW, tblYTop],
    [tblX + tblW, tblYTop - titleH],
    [tblX, tblYTop - titleH]
  ], '#38bdf8', 1.8, 'rgba(2, 132, 199, 0.22)', true);
  drawWorldText(
    tblX + tblW / 2,
    tblYTop - titleH / 2,
    `乾砌石護岸 (圖號 0402-1) 工程數量計算式表 【單一分段長度 L = ${m.Lm.toFixed(2)} m，有效高 H1 = ${(m.H1 / 100).toFixed(2)} m，基礎深 Df = ${(m.Df / 100).toFixed(2)} m】`,
    11.5, '#f8fafc', 'center', 'middle'
  );

  const yHdrTop = tblYTop - titleH;
  const yHdrBot = yHdrTop - headerH;
  drawWorldPoly([
    [tblX, yHdrTop],
    [tblX + tblW, yHdrTop],
    [tblX + tblW, yHdrBot],
    [tblX, yHdrBot]
  ], '#38bdf8', 1.5, 'rgba(30, 41, 59, 0.85)', true);

  const headers = ['項次', '工 程 項 目 名 稱', '單位', '數 量 計 算 式 (100% 對應圖面標註尺寸)', '每延公尺數量', `每單元數量(${m.Lm.toFixed(0)}m)`, '設 計 規 範 與 備 註'];
  let curX = tblX;
  headers.forEach((h, i) => {
    const w = colWidths[i];
    drawWorldText(curX + w / 2, yHdrTop - headerH / 2, h, 9.5, '#38bdf8', 'center', 'middle');
    if (i > 0) drawWorldLine(curX, yHdrTop, curX, yHdrBot - m.quantities.length * rowH, '#334155', 1.0);
    curX += w;
  });

  m.quantities.forEach((q, rIdx) => {
    const rTop = yHdrBot - rIdx * rowH;
    const rBot = rTop - rowH;
    const rMid = 0.5 * (rTop + rBot);
    drawWorldPoly([
      [tblX, rTop],
      [tblX + tblW, rTop],
      [tblX + tblW, rBot],
      [tblX, rBot]
    ], '#334155', 1.0, rIdx % 2 === 0 ? 'rgba(15, 23, 42, 0.65)' : 'rgba(30, 41, 59, 0.45)', true);

    let cx = tblX;
    drawWorldText(cx + colWidths[0] / 2, rMid, q.id, 9.0, '#cbd5e1', 'center', 'middle'); cx += colWidths[0];
    drawWorldText(cx + 10, rMid, q.name, 9.0, '#f8fafc', 'left', 'middle'); cx += colWidths[1];
    drawWorldText(cx + colWidths[2] / 2, rMid, q.unit, 9.0, '#cbd5e1', 'center', 'middle'); cx += colWidths[2];
    drawWorldText(cx + 10, rMid, q.formula, 8.8, '#fbbf24', 'left', 'middle'); cx += colWidths[3];
    drawWorldText(cx + colWidths[4] - 12, rMid, q.perM.toFixed(3), 9.0, '#38bdf8', 'right', 'middle'); cx += colWidths[4];
    drawWorldText(cx + colWidths[5] - 12, rMid, q.total.toFixed(2), 9.5, '#4ade80', 'right', 'middle'); cx += colWidths[5];
    drawWorldText(cx + 10, rMid, q.note, 8.5, '#94a3b8', 'left', 'middle');
  });

  const yTblBot = yHdrBot - m.quantities.length * rowH;
  drawWorldPoly([
    [tblX, tblYTop],
    [tblX + tblW, tblYTop],
    [tblX + tblW, yTblBot],
    [tblX, yTblBot]
  ], '#38bdf8', 1.8, null, true);

  return O;
}
