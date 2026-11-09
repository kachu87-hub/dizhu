/* ===================== v5.5 原圖移植（自使用者原工具自動抽出，勿手改；改 gen_or2.py） ===================== */
var TCO_T = window.TCO_T || (window.TCO_T = {});
TCO_T['g404'] = (function () {   // 水保標準圖 0404-1 土石籠護岸
const CNS560_REBAR = {
  NONE: { d: 0, unitW: 0 },
  D10: { d: 0.953, unitW: 0.560 },
  D13: { d: 1.270, unitW: 0.995 },
  D16: { d: 1.590, unitW: 1.560 },
  D19: { d: 1.910, unitW: 2.250 },
  D22: { d: 2.220, unitW: 3.040 }
};

// 原圖 DXF 表層塊石整面正規化頂點 ([-0.5,0.5]x[-0.5,0.5])
const DXF_STONE_SHAPES = [
  [[0.056, -0.465], [0.418, -0.340], [0.500, 0.066], [0.193, 0.500], [-0.411, 0.453], [-0.500, -0.016], [-0.325, -0.422], [0.056, -0.465]],
  [[-0.098, -0.500], [0.397, -0.385], [0.500, 0.125], [0.309, 0.500], [-0.409, 0.420], [-0.500, 0.053], [-0.358, -0.346], [-0.098, -0.500]],
  [[-0.180, -0.500], [0.464, -0.273], [0.500, -0.015], [0.381, 0.440], [0.059, 0.500], [-0.399, 0.394], [-0.500, -0.197], [-0.180, -0.500]],
  [[-0.091, -0.500], [0.390, -0.373], [0.500, 0.167], [0.352, 0.484], [-0.369, 0.500], [-0.500, 0.087], [-0.351, -0.326], [-0.091, -0.500]],
  [[-0.141, -0.500], [0.411, -0.414], [0.500, 0.086], [0.291, 0.500], [-0.306, 0.500], [-0.500, 0.000], [-0.410, -0.431], [-0.141, -0.500]],
  [[-0.294, -0.500], [0.406, -0.318], [0.500, 0.045], [0.409, 0.500], [-0.368, 0.409], [-0.500, 0.136], [-0.409, -0.300], [-0.294, -0.500]],
  [[-0.055, -0.500], [0.437, -0.421], [0.500, 0.119], [0.369, 0.500], [-0.221, 0.468], [-0.500, 0.214], [-0.434, -0.294], [-0.055, -0.500]],
  [[-0.038, -0.500], [0.395, -0.399], [0.500, -0.095], [0.360, 0.500], [-0.241, 0.487], [-0.500, 0.064], [-0.365, -0.348], [-0.038, -0.500]]
];

// 原圖 AutoCAD GRAVEL 剖面線 41 段晶格定義 ([0,1]x[0,1])
const GRAVEL_TILE_SEGS = [
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

// 原圖 4-04.dxf 基準幾何線 (以原圖基礎台左頂角 (3.9223, 393.7568) 為原點 (0,0)，可隨比例縮放比對)
const ORIG_0404_RAW = {
  base: [[0, 0], [119.5434, 10.4587], [120.8507, -4.4842], [1.3073, -14.9429]],
  boxes: [
    [[0, 0], [39.8478, 3.4862], [36.3616, 43.3340], [-3.4862, 39.8478]],
    [[39.8478, 3.4862], [79.6956, 6.9725], [76.2093, 46.8202], [36.3616, 43.3340]],
    [[79.6956, 6.9725], [119.5434, 10.4587], [116.0571, 50.3065], [76.2093, 46.8202]],
    [[16.4377, 41.5909], [56.2855, 45.0771], [52.7992, 84.9249], [12.9514, 81.4387]],
    [[56.2855, 45.0771], [96.1332, 48.5634], [92.6470, 88.4111], [52.7992, 84.9249]],
    [[32.8753, 83.1818], [72.7231, 86.6680], [69.2369, 126.5158], [29.3891, 123.0296]]
  ],
  topSand: [[69.2369, 126.5158], [43.9667, 124.3050], [-9.5477, 133.7410], [-89.5477, 133.7410], [-89.5477, 140.4077], [-9.5477, 140.4077]]
};

// ============================================================================
// 2. 視角與狀態管理 (鎖定視角鐵律：修改參數絕不重設 camX/camY/scale)
// ============================================================================

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
function generateDxfStonePolysInRect(x1, y1, x2, y2, stoneSizeNom = 28.0, seedBase = 1) {
  const w = Math.abs(x2 - x1);
  const h = Math.abs(y2 - y1);
  const nCols = Math.max(2, Math.round(w / stoneSizeNom));
  const nRows = Math.max(2, Math.round(h / (stoneSizeNom * 0.82)));
  const cw = w / nCols;
  const ch = h / nRows;
  const polys = [];

  for (let r = 0; r < nRows; r++) {
    for (let c = 0; c < nCols; c++) {
      const shape = DXF_STONE_SHAPES[(r * 3 + c * 5 + seedBase) % DXF_STONE_SHAPES.length];
      const flipX = ((r + c) % 2 === 0) ? 1 : -1;
      const xm = Math.min(x1, x2) + (c + 0.5) * cw;
      const ym = Math.min(y1, y2) + (r + 0.5) * ch;
      const poly = shape.map(uv => [
        xm + uv[0] * flipX * cw * 0.90,
        ym + uv[1] * ch * 0.88
      ]);
      polys.push(poly);
    }
  }
  return polys;
}

let RR = null;
const getNum = (id, fb) => tcoIn(RR, id, fb);
function computeModel() {
  const step_type = tcoSel(RR, 'sel_step_type', 'sym'); // 'sym' or 'single'
  const fill_mat = tcoSel(RR, 'sel_fill_mat', 'river'); // 'river' or 'ac'
  const fill_mat_name = fill_mat === 'river' ? '現況河床粒料' : '瀝青刨除料';

  const N_layer = Math.max(1, Math.min(6, Math.round(getNum('inp_N_layer', 3))));
  const N_bot = Math.max(1, Math.min(6, Math.round(getNum('inp_N_bot', 3))));
  const B1 = Math.max(20, getNum('inp_B1', 100));
  const H1 = Math.max(20, getNum('inp_H1', 100));
  const L_gab = Math.max(50, getNum('inp_L_gab', 200));
  const B2 = Math.max(0, getNum('inp_B2', 50));
  const alpha_deg = Math.max(0, Math.min(20, getNum('inp_alpha', 5.0)));
  const bag_w = Math.max(40, getNum('inp_bag_w', 105));
  const bag_h = Math.max(40, getNum('inp_bag_h', 110));
  const L_unit = Math.max(100, getNum('inp_L_unit', 1000));

  const df = Math.max(10, getNum('inp_df', 85));
  const k_df = Math.max(0.1, getNum('inp_k_df', 0.50));
  const t_top_sand = Math.max(0, getNum('inp_t_top_sand', 18));
  const w_top_fill = Math.max(30, getNum('inp_w_top_fill', 160));
  const t_grav_top = Math.max(0, getNum('inp_t_grav_top', 30));
  const t_grav_bot = Math.max(0, getNum('inp_t_grav_bot', 30));
  const exc_mode = tcoSel(RR, 'sel_exc_mode', 'full');

  const t_base = Math.max(10, getNum('inp_t_base', 50));
  const B_toe = Math.max(0, getNum('inp_B_toe', 0));
  const B_heel = Math.max(0, getNum('inp_B_heel', 0));
  const R1 = Math.max(0, getNum('inp_R1', 0));
  const P1 = Math.max(15, getNum('inp_P1', 30));
  const t_pc = Math.max(0, getNum('inp_t_pc', 0));
  const w_pc = t_pc > 0 ? Math.max(0, getNum('inp_w_pc', 10)) : 0;

  const rebar_main_key = tcoSel(RR, 'sel_rebar_main', 'NONE');
  const rebar_sub_key = tcoSel(RR, 'sel_rebar_sub', 'D13');
  const S_rebar = 20;

  // 局部旋轉座標系 (對應原圖 UCS 1-1: u 軸向右上方傾斜 alpha，v 軸向左上方傾斜 alpha)
  const alpha_rad = alpha_deg * Math.PI / 180.0;
  const cosA = Math.cos(alpha_rad);
  const sinA = Math.sin(alpha_rad);
  const uvToWorld = (u, v) => [u * cosA - v * sinA, u * sinA + v * cosA];

  const H_total = N_layer * H1;
  const W_bot_gab = N_bot * B1;
  const B_base = B_heel + W_bot_gab + B_toe;

  const layersInfo = [];
  const gabionBoxes = [];
  let sumGabionArea_cm2 = 0;

  for (let r = 0; r < N_layer; r++) {
    const vBot = r * H1;
    const vTop = (r + 1) * H1;
    let uLeft = 0;
    let uRight = W_bot_gab;
    if (step_type === 'sym') {
      uLeft = r * B2;
      uRight = W_bot_gab - r * B2;
    } else {
      uLeft = 0;
      uRight = W_bot_gab - r * B2;
    }
    if (uRight - uLeft < B1 * 0.5) {
      uRight = uLeft + B1;
    }
    const wLayer = uRight - uLeft;
    sumGabionArea_cm2 += wLayer * H1;

    const nCells = Math.max(1, Math.round(wLayer / B1));
    const cellW = wLayer / nCells;

    for (let c = 0; c < nCells; c++) {
      const uc1 = uLeft + c * cellW;
      const uc2 = uLeft + (c + 1) * cellW;
      const poly = [
        uvToWorld(uc1, vBot),
        uvToWorld(uc2, vBot),
        uvToWorld(uc2, vTop),
        uvToWorld(uc1, vTop)
      ];
      const bagInset = Math.min(3.0, cellW * 0.045);
      const bagPoly = [
        uvToWorld(uc1 + bagInset, vBot + bagInset),
        uvToWorld(uc2 - bagInset, vBot + bagInset),
        uvToWorld(uc2 - bagInset, vTop - bagInset),
        uvToWorld(uc1 + bagInset, vTop - bagInset)
      ];
      // 【嚴格執行】：僅每一層最外側臨水面那顆 (c === nCells - 1) 有塊石整面；後面內排箱籠沒有塊石整面
      const isSurfaceBox = (c === nCells - 1);
      gabionBoxes.push({
        row: r,
        col: c,
        nCells,
        u1: uc1, u2: uc2, v1: vBot, v2: vTop,
        w: cellW, h: H1,
        isSurfaceBox,
        poly,
        bagPoly
      });
    }

    layersInfo.push({
      row: r,
      uLeft, uRight, vBot, vTop, wLayer, nCells, cellW,
      ptBackBot: uvToWorld(uLeft, vBot),
      ptBackTop: uvToWorld(uLeft, vTop),
      ptFrontBot: uvToWorld(uRight, vBot),
      ptFrontTop: uvToWorld(uRight, vTop),
      ptFrontCellBackTop: uvToWorld(uRight - cellW, vTop)
    });
  }

  // 混凝土基礎台多邊形 (含選配底部 1:3 梯形止滑榫)
  const uBaseL = -B_heel;
  const uBaseR = W_bot_gab + B_toe;
  const keySlopeW = R1 / 3.0;
  const keyTopW = R1 > 0 ? (P1 + 2 * keySlopeW) : 0;
  let X_key = getNum('inp_X_key', 40);
  if (R1 > 0) {
    X_key = Math.max(0, Math.min(X_key, Math.max(0, B_base - keyTopW)));
  }
  const uKeyTopR = uBaseR - X_key;
  const uKeyTopL = uKeyTopR - keyTopW;
  const uKeyBotR = uKeyTopR - keySlopeW;
  const uKeyBotL = uKeyTopL + keySlopeW;

  const basePoly = [
    uvToWorld(uBaseL, 0),
    uvToWorld(uBaseR, 0),
    uvToWorld(uBaseR, -t_base)
  ];
  if (R1 > 0) {
    basePoly.push(
      uvToWorld(uKeyTopR, -t_base),
      uvToWorld(uKeyBotR, -(t_base + R1)),
      uvToWorld(uKeyBotL, -(t_base + R1)),
      uvToWorld(uKeyTopL, -t_base)
    );
  }
  basePoly.push(uvToWorld(uBaseL, -t_base));

  // 背部透水層多邊形 (頂底寬同步連動)
  const gravelFrontPts = [];
  for (let r = N_layer - 1; r >= 0; r--) {
    const li = layersInfo[r];
    gravelFrontPts.push(uvToWorld(li.uLeft, li.vTop), uvToWorld(li.uLeft, li.vBot));
  }
  const topBox = layersInfo[N_layer - 1];
  const botBox = layersInfo[0];
  const topBackPt = topBox.ptBackTop;
  const botBackPt = botBox.ptBackBot;
  const gravTopLeft = [topBackPt[0] - t_grav_top, topBackPt[1]];
  const gravBotLeft = [botBackPt[0] - t_grav_bot, botBackPt[1]];
  const gravelPoly = (t_grav_top > 0 || t_grav_bot > 0)
    ? [...gravelFrontPts, gravBotLeft, gravTopLeft]
    : [];

  // 坡頂覆土層 (對應原圖 0404-1 Handle 1BF8 AR-SAND 與 1BF7, 1C3E)
  const topRightPt = topBox.ptFrontTop;
  const ptCoverJoin = uvToWorld(topBox.uRight - topBox.cellW * 0.63, topBox.vTop);
  const slopeCapPt = [gravTopLeft[0] - 22 * (B1 / 100), topRightPt[1] + 34.7 * (B1 / 100)];
  const horizCapLeftPt = [slopeCapPt[0] - w_top_fill, slopeCapPt[1]];
  const topSandPoly = [
    topRightPt,
    ptCoverJoin,
    [slopeCapPt[0], slopeCapPt[1] - t_top_sand],
    [horizCapLeftPt[0], horizCapLeftPt[1] - t_top_sand],
    horizCapLeftPt,
    slopeCapPt
  ];

  // 右側河床基準線、預期沖刷深度 df 與 0.2~0.5df 標註座標
  const d_extra = k_df * df;
  const D_embed = df + d_extra;
  const ptBaseFrontBot = uvToWorld(uBaseR, -t_base);
  const y_bed = ptBaseFrontBot[1] + D_embed;
  const y_scour = y_bed - df;
  const y_water = layersInfo[Math.min(1, N_layer - 1)].ptFrontTop[1] - 0.15 * H1;

  // 臨水面等效坡度比 1 : n_eff
  const dxSlope = topRightPt[0] - layersInfo[0].ptFrontBot[0];
  const dySlope = Math.max(1, topRightPt[1] - layersInfo[0].ptFrontBot[1]);
  const n_eff = Math.abs(dxSlope / dySlope);

  const B_pc = t_pc > 0 ? (B_base + 2 * w_pc) : 0;

  // 工程數量計算 (以 m 為單位，100% 對應圖面標註尺寸)
  const Lm = L_unit / 100.0;
  const H1_m = H1 / 100.0;
  const B1_m = B1 / 100.0;
  const B_base_m = B_base / 100.0;
  const t_base_m = t_base / 100.0;
  const H_tot_m = H_total / 100.0;

  // 1. 箱型土石籠鋼絲網體積
  const layerWidthsStr = layersInfo.map(l => (l.wLayer / 100).toFixed(2)).join('+');
  const area_gab = sumGabionArea_cm2 / 10000.0;
  const vol_gab_unit = area_gab * Lm;
  const f_gab = `(${layerWidthsStr}) * ${H1_m.toFixed(2)} * ${Lm.toFixed(1)}`;
  const singleGabVol = (B1_m * H1_m * (L_gab / 100.0));
  const numGabBoxes = vol_gab_unit / Math.max(0.01, singleGabVol);

  // 2. 內襯土石籠織布(或不織布)袋 (每 1 m³ 單元籠體裝設 1 只)
  const bags_per_m = area_gab * 1.0;
  const bags_unit = vol_gab_unit * 1.0;
  const f_bag = `${area_gab.toFixed(2)} m³/m * 1.0 只/m³ * ${Lm.toFixed(1)}m`;

  // 3. 織布袋內拋填現況河床土石粒料 (或瀝青刨除料)
  const f_fill = `${area_gab.toFixed(2)} * ${Lm.toFixed(1)} (機械拋填${fill_mat_name})`;

  // 4. 表面及臨水面塊石人工整面面積 (僅計最外側臨水面表層土石籠)
  const topExposedW_m = (topBox.cellW + (N_layer - 1) * B2) / 100.0;
  const perim_face_m = topExposedW_m + N_layer * H1_m;
  const area_face_unit = perim_face_m * Lm;
  const f_face = `(${topExposedW_m.toFixed(2)} + ${N_layer}*${H1_m.toFixed(2)}) * ${Lm.toFixed(1)}`;

  // 5. 210 kgf/cm² 混凝土基礎台
  const P1_m = P1 / 100.0;
  const R1_m = R1 / 100.0;
  const keyTopW_m = keyTopW / 100.0;
  const area_conc = B_base_m * t_base_m + (R1 > 0 ? ((P1_m + keyTopW_m) / 2.0) * R1_m : 0);
  const vol_conc_unit = area_conc * Lm;
  const f_conc = R1 > 0
    ? `(${B_base_m.toFixed(2)}*${t_base_m.toFixed(2)} + ((${P1_m.toFixed(2)}+${keyTopW_m.toFixed(2)})/2)*${R1_m.toFixed(2)}) * ${Lm.toFixed(1)}`
    : `${B_base_m.toFixed(2)} * ${t_base_m.toFixed(2)} * ${Lm.toFixed(1)}`;

  // 6. 背部透水層與坡頂覆土回填
  const tg_top_m = t_grav_top / 100.0;
  const tg_bot_m = t_grav_bot / 100.0;
  const area_gravel = ((tg_top_m + tg_bot_m) / 2.0) * H_tot_m;
  const area_top_sand = (w_top_fill / 100.0) * (t_top_sand / 100.0);
  const area_back_tot = area_gravel + area_top_sand;
  const vol_back_unit = area_back_tot * Lm;
  const f_back = `(((${tg_top_m.toFixed(2)}+${tg_bot_m.toFixed(2)})/2)*${H_tot_m.toFixed(2)} + ${(w_top_fill/100).toFixed(2)}*${(t_top_sand/100).toFixed(2)}) * ${Lm.toFixed(1)}`;

  // 7. 結構土石方開挖
  const D_emb_m = D_embed / 100.0;
  let area_exc = 0;
  let f_exc = '';
  if (exc_mode === 'full') {
    const area_front_emb = 0.5 * D_emb_m * D_emb_m * 0.45;
    area_exc = area_gab + area_conc + area_gravel + area_front_emb;
    f_exc = `(${area_gab.toFixed(2)} + ${area_conc.toFixed(2)} + ${area_gravel.toFixed(2)} + ${area_front_emb.toFixed(2)}) * ${Lm.toFixed(1)}`;
  } else {
    const w_emb_top = B_base_m + 2 * 0.3 * D_emb_m;
    area_exc = ((B_base_m + w_emb_top) / 2.0) * D_emb_m;
    f_exc = `((${B_base_m.toFixed(2)}+${w_emb_top.toFixed(2)})/2) * ${D_emb_m.toFixed(2)} * ${Lm.toFixed(1)}`;
  }
  const vol_exc_unit = area_exc * Lm;

  const quantities = [
    { id: '1', name: '鍍鋅/PVC低碳鋼線箱型土石籠網 (線徑≥3.5mm)', unit: 'm³', formula: f_gab, perM: area_gab, total: vol_gab_unit, note: `折合單籠(${(L_gab/100).toFixed(1)}x${B1_m.toFixed(1)}x${H1_m.toFixed(1)}m) 約 ${numGabBoxes.toFixed(1)} 組` },
    { id: '2', name: `內襯土石籠織布(或不織布)袋 (${bag_w}×${bag_w}×${bag_h}cm)`, unit: '只', formula: f_bag, perM: bags_per_m, total: bags_unit, note: `每1m³單元籠體內裝1袋 (回摺≥10cm, 黏扣帶5cm)` },
    { id: '3', name: `袋內拋填${fill_mat_name} (機械投料填實)`, unit: 'm³', formula: f_fill, perM: area_gab, total: vol_gab_unit, note: `挖土機拋填滿平後密封3邊並固定上蓋` },
    { id: '4', name: '護岸表層及臨水面塊石人工整面', unit: 'm²', formula: f_face, perM: perim_face_m, total: area_face_unit, note: `僅計最外側臨水面表層土石籠外露面` },
    { id: '5', name: '210 kgf/cm² 混凝土基礎台', unit: 'm³', formula: f_conc, perM: area_conc, total: vol_conc_unit, note: `基礎台寬 B=${B_base}cm, 厚 t=${t_base}cm` },
    { id: '6', name: '背部透水層與坡頂覆土回填', unit: 'm³', formula: f_back, perM: area_back_tot, total: vol_back_unit, note: `透水層頂${t_grav_top}/底${t_grav_bot}cm, 覆土厚${t_top_sand}cm` },
    { id: '7', name: '結構土石方開挖', unit: 'm³', formula: f_exc, perM: area_exc, total: vol_exc_unit, note: `總埋深 D_embed=${D_embed.toFixed(1)}cm (df=${df}cm)` }
  ];

  if (t_pc > 0) {
    const B_pc_m = B_pc / 100.0;
    const t_pc_m = t_pc / 100.0;
    const area_pc = ((B_pc - keyTopW) / 100.0) * t_pc_m;
    quantities.push({
      id: String(quantities.length + 1),
      name: '分段水平 PC 打底混凝土',
      unit: 'm³',
      formula: `(${B_pc_m.toFixed(2)} - ${keyTopW_m.toFixed(2)}) * ${t_pc_m.toFixed(2)} * ${Lm.toFixed(1)}`,
      perM: area_pc,
      total: area_pc * Lm,
      note: `厚 t_pc=${t_pc}cm (扣除止滑榫開口)`
    });
  }

  if (rebar_main_key !== 'NONE') {
    const mainSpec = CNS560_REBAR[rebar_main_key];
    const subSpec = CNS560_REBAR[rebar_sub_key];
    const c_base = 7.5;
    const n_main_sets = Math.floor(L_unit / S_rebar) + 1;
    const len_stirrup_m = (2 * ((B_base - 2 * c_base) + Math.max(10, t_base - 2 * c_base)) + 20) / 100.0;
    const len_key_v_m = R1 > 0 ? (P1 + 2 * R1 * Math.sqrt(1 + 1 / 9) + 60) / 100.0 : 0;
    const w_main = n_main_sets * (len_stirrup_m + len_key_v_m) * mainSpec.unitW;
    const n_sub_dots = Math.max(4, Math.floor((B_base - 2 * c_base) / S_rebar) + 1) * 2 + (R1 > 0 ? 4 : 0);
    const w_sub = n_sub_dots * Lm * subSpec.unitW;
    const weight_rebar = w_main + w_sub;
    quantities.push({
      id: String(quantities.length + 1),
      name: `基礎台與止滑榫竹節鋼筋 (${rebar_main_key}/${rebar_sub_key})`,
      unit: 'kg',
      formula: `主筋${rebar_main_key}:${n_main_sets}組*${(len_stirrup_m+len_key_v_m).toFixed(2)}m*${mainSpec.unitW} + 副筋${rebar_sub_key}:${n_sub_dots}支*${Lm.toFixed(1)}m*${subSpec.unitW}`,
      perM: weight_rebar / Lm,
      total: weight_rebar,
      note: `CNS 560 圓點總數 ${n_sub_dots} 顆`
    });
  }

  return {
    step_type, fill_mat, fill_mat_name, N_layer, N_bot, B1, H1, L_gab, B2, alpha_deg, alpha_rad, cosA, sinA, uvToWorld,
    bag_w, bag_h, L_unit, Lm, df, k_df, d_extra, D_embed, t_top_sand, w_top_fill, t_grav_top, t_grav_bot, exc_mode,
    t_base, B_toe, B_heel, B_base, W_bot_gab, H_total,
    X_key, R1, P1, keySlopeW, keyTopW, t_pc, w_pc, B_pc,
    uBaseL, uBaseR, uKeyTopL, uKeyTopR, uKeyBotL, uKeyBotR,
    rebar_main_key, rebar_sub_key, S_rebar,
    layersInfo, gabionBoxes, basePoly, gravelPoly, topSandPoly,
    gravTopLeft, gravBotLeft, topRightPt, slopeCapPt, horizCapLeftPt,
    ptBaseFrontBot, y_bed, y_scour, y_water, n_eff,
    quantities
  };
}

function prims(m, OPT, part) {
  OPT = Object.assign({ hatch: true, dims: true }, OPT || {}); const O = [];
  const drawWorldLine = (x1, y1, x2, y2, color = '#ffffff', lineWidth = 1.5, dash = []) => O.push({ k: 'L', p: [[x1, y1], [x2, y2]], c: color, w: lineWidth, d: dash });
  const drawWorldPoly = (pts, strokeColor = '#ffffff', lineWidth = 1.5, fillColor = null, close = true, dash = []) => { if (pts && pts.length >= 2) O.push({ k: 'P', p: pts.map(q => [q[0], q[1]]), c: strokeColor, w: lineWidth, f: fillColor, cl: close, d: dash }); };
  const drawWorldCircle = (wx, wy, rWorld, strokeColor = '#ffffff', fillColor = null, lineWidth = 1.2) => O.push({ k: 'C', x: wx, y: wy, r: rWorld, c: strokeColor, f: fillColor, w: lineWidth });
  const drawWorldText = (wx, wy, text, heightWorld = 10, color = '#ffffff', align = 'center', baseline = 'middle', rotRad = 0) => O.push({ k: 'T', x: wx, y: wy, s: String(text), h: heightWorld, c: color, al: align, bl: baseline, rot: rotRad });
  const drawDxfGravelRegion = (outerPoly, tileSizeWorld = 45.0, strokeColor = '#c084fc') => { if (outerPoly && outerPoly.length >= 3) O.push({ k: 'G', outer: outerPoly, holes: [], tile: tileSizeWorld, c: strokeColor, segs: GRAVEL_TILE_SEGS }); };
  const drawDxfHoneyMeshRegion = (outerPoly, cellRadiusWorld = 8.5, strokeColor = 'rgba(217, 70, 239, 0.55)') => { if (outerPoly && outerPoly.length >= 3) O.push({ k: 'H', outer: outerPoly, r: cellRadiusWorld, c: strokeColor }); };
  const drawDxfEarthHatchRegion = (outerPoly, cellWorld = 18.0, strokeColor = 'rgba(148, 163, 184, 0.50)') => { if (outerPoly && outerPoly.length >= 3) O.push({ k: 'E', outer: outerPoly, cell: cellWorld, c: strokeColor }); };
function getDimExtensionCoords(coordObj, dimPos) {
  const minGapFromObj = 9.5;
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
function drawLeader(xTip, yTip, xKnee, yKnee, dirRight, textLines, lineCol = '#38bdf8', txtCol = '#f8fafc') {
  const shelfLen = 64 * (dirRight ? 1 : -1);
  drawWorldLine(xTip, yTip, xKnee, yKnee, lineCol, 1.2);
  drawWorldLine(xKnee, yKnee, xKnee + shelfLen, yKnee, lineCol, 1.2);
  const dx = xKnee - xTip, dy = yKnee - yTip;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len, uy = dy / len;
  const px = -uy, py = ux;
  const arr = 6.0;
  drawWorldPoly([
    [xTip, yTip],
    [xTip + ux * arr + px * arr * 0.32, yTip + uy * arr + py * arr * 0.32],
    [xTip + ux * arr - px * arr * 0.32, yTip + uy * arr - py * arr * 0.32]
  ], lineCol, 1, lineCol, true);

  const tx = xKnee + (dirRight ? 6 : -6);
  const align = dirRight ? 'left' : 'right';
  textLines.forEach((line, idx) => {
    drawWorldText(tx, yKnee + 6 - idx * 12.5, line, 8.5, txtCol, align, 'middle');
  });
}

  if (part === 'sec') {
// A. 左上主視區：【標準斷面圖 (Cross-Section View)】(不畫自然地形線)
  // --------------------------------------------------------------------------
  // 1. 背部透水層 (GRAVEL 填充) 與坡頂覆土層 (AR-SAND 填充，對應原圖 1BF8)
  if (m.gravelPoly.length >= 3) {
    if (OPT.hatch) {
      drawDxfGravelRegion(m.gravelPoly, Math.max(25, m.B1 * 0.48), '#c084fc');
    }
    drawWorldPoly(m.gravelPoly, '#c084fc', 1.3, 'rgba(192, 132, 252, 0.08)', true);
  }
  if (m.t_top_sand > 0) {
    drawWorldPoly(m.topSandPoly, '#facc15', 1.5, 'rgba(250, 204, 21, 0.10)', true);
    if (OPT.hatch) {
      for (let s = 0; s < 26; s++) {
        const rx = m.horizCapLeftPt[0] + seededRand(s * 13 + 1) * (m.topRightPt[0] - m.horizCapLeftPt[0]);
        const ry = m.horizCapLeftPt[1] - seededRand(s * 29 + 7) * (m.t_top_sand * 1.4);
        if (pointInPoly([rx, ry], m.topSandPoly)) {
          drawWorldCircle(rx, ry, 0.8, '#fbbf24', '#fbbf24');
        }
      }
    }
  } else {
    drawWorldPoly([m.topRightPt, m.slopeCapPt, m.horizCapLeftPt], '#facc15', 1.8, null, false);
  }

  // 2. 混凝土基礎台 (AR-CONC 填充) + 選配 1:3 梯形止滑榫 + 分段水平 PC 打底 + 配筋
  drawWorldPoly(m.basePoly, '#facc15', 2.2, 'rgba(148, 163, 184, 0.16)', true);

  if (OPT.hatch) {
    const nConc = Math.max(6, Math.floor(m.B_base / 28));
    for (let k = 0; k < nConc; k++) {
      const u = m.uBaseL + ((k + 0.5) / nConc) * m.B_base;
      const v = -0.5 * m.t_base + (seededRand(k * 17 + 3) - 0.5) * 0.45 * m.t_base;
      const pt = m.uvToWorld(u, v);
      const rTri = Math.max(2.5, m.t_base * 0.09);
      drawWorldPoly([
        [pt[0] - rTri, pt[1] - rTri * 0.6],
        [pt[0] + rTri, pt[1] - rTri * 0.4],
        [pt[0], pt[1] + rTri]
      ], '#94a3b8', 1.0, null, true);
      drawWorldCircle(pt[0] + rTri * 1.4, pt[1], 0.9, '#94a3b8', '#94a3b8');
    }
  }

  // 分段水平 PC 打底層
  if (m.t_pc > 0) {
    const uPcL = m.uBaseL - m.w_pc;
    const uPcR = m.uBaseR + m.w_pc;
    if (m.R1 > 0) {
      if (m.uKeyTopL > uPcL) {
        drawWorldPoly([
          m.uvToWorld(uPcL, -m.t_base),
          m.uvToWorld(m.uKeyTopL, -m.t_base),
          m.uvToWorld(m.uKeyTopL + m.t_pc / 3, -(m.t_base + m.t_pc)),
          m.uvToWorld(uPcL, -(m.t_base + m.t_pc))
        ], '#22c55e', 1.6, 'rgba(34, 197, 94, 0.15)', true);
      }
      if (uPcR > m.uKeyTopR) {
        drawWorldPoly([
          m.uvToWorld(m.uKeyTopR, -m.t_base),
          m.uvToWorld(uPcR, -m.t_base),
          m.uvToWorld(uPcR, -(m.t_base + m.t_pc)),
          m.uvToWorld(m.uKeyTopR - m.t_pc / 3, -(m.t_base + m.t_pc))
        ], '#22c55e', 1.6, 'rgba(34, 197, 94, 0.15)', true);
      }
    } else {
      drawWorldPoly([
        m.uvToWorld(uPcL, -m.t_base),
        m.uvToWorld(uPcR, -m.t_base),
        m.uvToWorld(uPcR, -(m.t_base + m.t_pc)),
        m.uvToWorld(uPcL, -(m.t_base + m.t_pc))
      ], '#22c55e', 1.6, 'rgba(34, 197, 94, 0.15)', true);
    }
  }

  // 基礎台與止滑榫 CNS 560 鋼筋
  if (m.rebar_main_key !== 'NONE') {
    const c = Math.min(6.0, m.t_base * 0.2);
    drawWorldPoly([
      m.uvToWorld(m.uBaseL + c, -c),
      m.uvToWorld(m.uBaseR - c, -c),
      m.uvToWorld(m.uBaseR - c, -m.t_base + c),
      m.uvToWorld(m.uBaseL + c, -m.t_base + c)
    ], '#ef4444', 1.8, null, true);

    const nDots = Math.max(3, Math.floor((m.B_base - 2 * c) / m.S_rebar) + 1);
    for (let k = 0; k < nDots; k++) {
      const u = m.uBaseL + c + (k / Math.max(1, nDots - 1)) * (m.B_base - 2 * c);
      const pTop = m.uvToWorld(u, -c - 1.8);
      const pBot = m.uvToWorld(u, -m.t_base + c + 1.8);
      drawWorldCircle(pTop[0], pTop[1], 2.0, '#ef4444', '#ef4444');
      drawWorldCircle(pBot[0], pBot[1], 2.0, '#ef4444', '#ef4444');
    }
  }

  // 3. 繪製各層土石籠單元：
  // 每個土石籠均繪製原圖 HONEY 六角石籠格網 + EARTH 現地土石粒料雙重剖面紋理 + 內襯織布袋虛線框；
  // 且僅每一層最外側臨水面那顆 (box.isSurfaceBox, 即 c === nCells - 1) 右側臨水面排列塊石整面！
  m.gabionBoxes.forEach((box, bIdx) => {
    if (OPT.hatch) {
      drawDxfEarthHatchRegion(box.poly, Math.max(14, m.B1 * 0.18), 'rgba(148, 163, 184, 0.48)');
      drawDxfHoneyMeshRegion(box.poly, Math.max(4.5, m.B1 * 0.085), 'rgba(217, 70, 239, 0.58)');

      if (box.isSurfaceBox) {
        const nEdgeStones = 4;
        for (let s = 0; s < nEdgeStones; s++) {
          const shape = DXF_STONE_SHAPES[(bIdx + s) % DXF_STONE_SHAPES.length];
          const uCenterR = box.u2 - box.w * 0.11;
          const vCenterR = box.v1 + ((s + 0.5) / nEdgeStones) * box.h;
          const sPolyR = shape.map(uv => m.uvToWorld(uCenterR + uv[0] * box.w * 0.19, vCenterR + uv[1] * (box.h / nEdgeStones) * 0.88));
          drawWorldPoly(sPolyR, '#fb923c', 1.2, 'rgba(251, 146, 60, 0.24)', true);
        }
      }
    }
    drawWorldPoly(box.bagPoly, '#22c55e', 1.2, null, true, [5, 3]);
    drawWorldPoly(box.poly, '#facc15', 2.0, 'rgba(250, 204, 21, 0.06)', true);
  });

  
    return O;
  }


  // --------------------------------------------------------------------------
  // A. 左上主視區：【標準斷面圖 (Cross-Section View)】(不畫自然地形線)
  // --------------------------------------------------------------------------
  // 1. 背部透水層 (GRAVEL 填充) 與坡頂覆土層 (AR-SAND 填充，對應原圖 1BF8)
  if (m.gravelPoly.length >= 3) {
    if (OPT.hatch) {
      drawDxfGravelRegion(m.gravelPoly, Math.max(25, m.B1 * 0.48), '#c084fc');
    }
    drawWorldPoly(m.gravelPoly, '#c084fc', 1.3, 'rgba(192, 132, 252, 0.08)', true);
  }
  if (m.t_top_sand > 0) {
    drawWorldPoly(m.topSandPoly, '#facc15', 1.5, 'rgba(250, 204, 21, 0.10)', true);
    if (OPT.hatch) {
      for (let s = 0; s < 26; s++) {
        const rx = m.horizCapLeftPt[0] + seededRand(s * 13 + 1) * (m.topRightPt[0] - m.horizCapLeftPt[0]);
        const ry = m.horizCapLeftPt[1] - seededRand(s * 29 + 7) * (m.t_top_sand * 1.4);
        if (pointInPoly([rx, ry], m.topSandPoly)) {
          drawWorldCircle(rx, ry, 0.8, '#fbbf24', '#fbbf24');
        }
      }
    }
  } else {
    drawWorldPoly([m.topRightPt, m.slopeCapPt, m.horizCapLeftPt], '#facc15', 1.8, null, false);
  }

  // 2. 混凝土基礎台 (AR-CONC 填充) + 選配 1:3 梯形止滑榫 + 分段水平 PC 打底 + 配筋
  drawWorldPoly(m.basePoly, '#facc15', 2.2, 'rgba(148, 163, 184, 0.16)', true);

  if (OPT.hatch) {
    const nConc = Math.max(6, Math.floor(m.B_base / 28));
    for (let k = 0; k < nConc; k++) {
      const u = m.uBaseL + ((k + 0.5) / nConc) * m.B_base;
      const v = -0.5 * m.t_base + (seededRand(k * 17 + 3) - 0.5) * 0.45 * m.t_base;
      const pt = m.uvToWorld(u, v);
      const rTri = Math.max(2.5, m.t_base * 0.09);
      drawWorldPoly([
        [pt[0] - rTri, pt[1] - rTri * 0.6],
        [pt[0] + rTri, pt[1] - rTri * 0.4],
        [pt[0], pt[1] + rTri]
      ], '#94a3b8', 1.0, null, true);
      drawWorldCircle(pt[0] + rTri * 1.4, pt[1], 0.9, '#94a3b8', '#94a3b8');
    }
  }

  // 分段水平 PC 打底層
  if (m.t_pc > 0) {
    const uPcL = m.uBaseL - m.w_pc;
    const uPcR = m.uBaseR + m.w_pc;
    if (m.R1 > 0) {
      if (m.uKeyTopL > uPcL) {
        drawWorldPoly([
          m.uvToWorld(uPcL, -m.t_base),
          m.uvToWorld(m.uKeyTopL, -m.t_base),
          m.uvToWorld(m.uKeyTopL + m.t_pc / 3, -(m.t_base + m.t_pc)),
          m.uvToWorld(uPcL, -(m.t_base + m.t_pc))
        ], '#22c55e', 1.6, 'rgba(34, 197, 94, 0.15)', true);
      }
      if (uPcR > m.uKeyTopR) {
        drawWorldPoly([
          m.uvToWorld(m.uKeyTopR, -m.t_base),
          m.uvToWorld(uPcR, -m.t_base),
          m.uvToWorld(uPcR, -(m.t_base + m.t_pc)),
          m.uvToWorld(m.uKeyTopR - m.t_pc / 3, -(m.t_base + m.t_pc))
        ], '#22c55e', 1.6, 'rgba(34, 197, 94, 0.15)', true);
      }
    } else {
      drawWorldPoly([
        m.uvToWorld(uPcL, -m.t_base),
        m.uvToWorld(uPcR, -m.t_base),
        m.uvToWorld(uPcR, -(m.t_base + m.t_pc)),
        m.uvToWorld(uPcL, -(m.t_base + m.t_pc))
      ], '#22c55e', 1.6, 'rgba(34, 197, 94, 0.15)', true);
    }
  }

  // 基礎台與止滑榫 CNS 560 鋼筋
  if (m.rebar_main_key !== 'NONE') {
    const c = Math.min(6.0, m.t_base * 0.2);
    drawWorldPoly([
      m.uvToWorld(m.uBaseL + c, -c),
      m.uvToWorld(m.uBaseR - c, -c),
      m.uvToWorld(m.uBaseR - c, -m.t_base + c),
      m.uvToWorld(m.uBaseL + c, -m.t_base + c)
    ], '#ef4444', 1.8, null, true);

    const nDots = Math.max(3, Math.floor((m.B_base - 2 * c) / m.S_rebar) + 1);
    for (let k = 0; k < nDots; k++) {
      const u = m.uBaseL + c + (k / Math.max(1, nDots - 1)) * (m.B_base - 2 * c);
      const pTop = m.uvToWorld(u, -c - 1.8);
      const pBot = m.uvToWorld(u, -m.t_base + c + 1.8);
      drawWorldCircle(pTop[0], pTop[1], 2.0, '#ef4444', '#ef4444');
      drawWorldCircle(pBot[0], pBot[1], 2.0, '#ef4444', '#ef4444');
    }
  }

  // 3. 繪製各層土石籠單元：
  // 每個土石籠均繪製原圖 HONEY 六角石籠格網 + EARTH 現地土石粒料雙重剖面紋理 + 內襯織布袋虛線框；
  // 且僅每一層最外側臨水面那顆 (box.isSurfaceBox, 即 c === nCells - 1) 右側臨水面排列塊石整面！
  m.gabionBoxes.forEach((box, bIdx) => {
    if (OPT.hatch) {
      drawDxfEarthHatchRegion(box.poly, Math.max(14, m.B1 * 0.18), 'rgba(148, 163, 184, 0.48)');
      drawDxfHoneyMeshRegion(box.poly, Math.max(4.5, m.B1 * 0.085), 'rgba(217, 70, 239, 0.58)');

      if (box.isSurfaceBox) {
        const nEdgeStones = 4;
        for (let s = 0; s < nEdgeStones; s++) {
          const shape = DXF_STONE_SHAPES[(bIdx + s) % DXF_STONE_SHAPES.length];
          const uCenterR = box.u2 - box.w * 0.11;
          const vCenterR = box.v1 + ((s + 0.5) / nEdgeStones) * box.h;
          const sPolyR = shape.map(uv => m.uvToWorld(uCenterR + uv[0] * box.w * 0.19, vCenterR + uv[1] * (box.h / nEdgeStones) * 0.88));
          drawWorldPoly(sPolyR, '#fb923c', 1.2, 'rgba(251, 146, 60, 0.24)', true);
        }
      }
    }
    drawWorldPoly(box.bagPoly, '#22c55e', 1.2, null, true, [5, 3]);
    drawWorldPoly(box.poly, '#facc15', 2.0, 'rgba(250, 204, 21, 0.06)', true);
  });

  // 4. 右側河床水平基準線、預期沖刷線、設計水位線
  const xBedStart = m.ptBaseFrontBot[0] - 5;
  const xBedEnd = xBedStart + Math.max(115, m.B1 * 1.35);
  drawWorldLine(xBedStart, m.y_bed, xBedEnd, m.y_bed, '#facc15', 1.8);
  drawWorldText(xBedStart + 22, m.y_bed + 8, '河床基準線', 8.5, '#38bdf8', 'left', 'middle');
  drawWorldLine(xBedStart, m.y_scour, xBedEnd, m.y_scour, '#38bdf8', 1.2, [6, 4]);
  drawWorldLine(xBedStart, m.ptBaseFrontBot[1], xBedEnd, m.ptBaseFrontBot[1], '#facc15', 1.2, [4, 4]);

  // 設計水位線與水波三角符號 (對應原圖 1C04 & BLK_05)
  const xWaterStart = m.layersInfo[Math.min(1, m.N_layer - 1)].ptFrontTop[0];
  const xWaterEnd = xBedEnd - 10;
  drawWorldLine(xWaterStart, m.y_water, xWaterEnd, m.y_water, '#38bdf8', 1.4);
  const xTriW = xWaterEnd - 18;
  drawWorldPoly([[xTriW, m.y_water], [xTriW + 4, m.y_water + 7], [xTriW - 4, m.y_water + 7]], '#38bdf8', 1.2, null, true);
  drawWorldLine(xTriW - 6, m.y_water - 3, xTriW + 6, m.y_water - 3, '#38bdf8', 1.0);
  drawWorldLine(xTriW - 3, m.y_water - 6, xTriW + 3, m.y_water - 6, '#38bdf8', 1.0);

  // 臨水面坡度標示 1 : n (對應原圖 1C0D)
  const ptSlopeMid = m.layersInfo[Math.min(1, m.N_layer - 1)].ptFrontBot;
  const triX = ptSlopeMid[0] + 22;
  const triY = ptSlopeMid[1] + 15;
  const triH = Math.max(18, m.H1 * 0.35);
  const triW = Math.max(8, triH * m.n_eff * 0.45);
  drawWorldPoly([[triX, triY], [triX, triY + triH], [triX - triW, triY + triH]], '#94a3b8', 1.2, null, false);
  drawWorldText(triX + 6, triY + 0.5 * triH, '1', 8.0, '#38bdf8', 'left', 'middle');
  drawWorldText(triX - 0.5 * triW, triY + triH + 7, `n=${m.n_eff.toFixed(2)}`, 8.0, '#38bdf8', 'center', 'middle');

  // 5. 原圖 0404-1 基準比對線疊加
  if (false) {
    const sRef = m.B1 / 40.0;
    const scalePoly = pts => pts.map(p => [p[0] * sRef, p[1] * sRef]);
    drawWorldPoly(scalePoly(ORIG_0404_RAW.base), '#f472b6', 1.5, null, true, [4, 4]);
    ORIG_0404_RAW.boxes.forEach(b => drawWorldPoly(scalePoly(b), '#f472b6', 1.5, null, true, [4, 4]));
    drawWorldPoly(scalePoly(ORIG_0404_RAW.topSand), '#f472b6', 1.5, null, true, [4, 4]);
  }

  // 6. 斷面圖引線標註
  const topBox = m.layersInfo[m.N_layer - 1];
  const ptTopFrontStone = m.uvToWorld(topBox.uRight - topBox.cellW * 0.11, topBox.vTop - m.H1 * 0.15);
  const ptTopInnerFill = m.uvToWorld(topBox.uRight - topBox.cellW * 0.45, topBox.vBot + m.H1 * 0.65);

  drawLeader(
    ptTopFrontStone[0], ptTopFrontStone[1],
    topBox.ptBackTop[0] - 25, topBox.ptFrontTop[1] + 45,
    false, ['表面以塊石整面']
  );
  drawLeader(
    ptTopInnerFill[0], ptTopInnerFill[1],
    topBox.ptFrontTop[0] + 35, topBox.ptFrontTop[1] + 15,
    true, [`採用${m.fill_mat_name}為填充料`, '(或瀝青刨除料)']
  );
  if (m.N_layer >= 2) {
    const midBox = m.layersInfo[1];
    drawLeader(
      midBox.ptFrontTop[0] - 8, midBox.ptFrontTop[1] - 10,
      midBox.ptFrontTop[0] + 25, midBox.ptFrontTop[1] + 16,
      true, ['箱型土石籠 (內襯織布袋)']
    );
  }
  const ptBaseMid = m.uvToWorld(0.75 * m.W_bot_gab, -0.5 * m.t_base);
  drawLeader(
    ptBaseMid[0], ptBaseMid[1],
    ptBaseMid[0] + 38, ptBaseMid[1] - 18,
    true, [`混凝土基礎台 (t=${m.t_base}cm, α=${m.alpha_deg}°)`]
  );

  // 7. 斷面圖分層退縮尺寸標註
  if (OPT.dims) {
    const yTopDim = Math.max(m.slopeCapPt[1], topBox.ptFrontTop[1]) + 22;
    if (topBox.nCells > 1) {
      drawHorizDim(topBox.ptBackTop[0], topBox.ptBackTop[1], topBox.ptFrontCellBackTop[0], topBox.ptFrontCellBackTop[1], yTopDim, `${topBox.nCells - 1}×B1=${((topBox.nCells - 1) * m.B1).toFixed(0)}`);
    }
    drawHorizDim(topBox.ptFrontCellBackTop[0], topBox.ptFrontCellBackTop[1], topBox.ptFrontTop[0], topBox.ptFrontTop[1], yTopDim, `B1=${m.B1}`);

    if (m.N_layer >= 2) {
      const belowTop = m.layersInfo[m.N_layer - 2];
      drawHorizDim(topBox.ptFrontTop[0], topBox.ptFrontTop[1], belowTop.ptFrontTop[0], belowTop.ptFrontTop[1], yTopDim, `B2=${m.B2}`);
    }
    if (m.t_grav_top > 0) {
      drawHorizDim(m.gravTopLeft[0], m.gravTopLeft[1], topBox.ptBackTop[0], topBox.ptBackTop[1], yTopDim, `透水層頂 ${m.t_grav_top}`);
    }

    const xLeftDim1 = m.horizCapLeftPt[0] - 25;
    const xLeftDim2 = xLeftDim1 - 30;
    drawVertDim(topBox.ptBackBot[0], topBox.ptBackBot[1], topBox.ptBackTop[0], topBox.ptBackTop[1], xLeftDim1, `H1=${m.H1}`);
    drawVertDim(0, 0, m.uvToWorld(0, -m.t_base)[0], m.uvToWorld(0, -m.t_base)[1], xLeftDim1, `t=${m.t_base}`);
    drawVertDim(0, 0, topBox.ptBackTop[0], topBox.ptBackTop[1], xLeftDim2, `土石籠總高 H=${m.H_total}`);

    const yBotBase = Math.min(m.uvToWorld(0, -(m.t_base + m.R1 + m.t_pc))[1], m.ptBaseFrontBot[1]);
    const yDimBot1 = yBotBase - 28;
    const yDimBot2 = yBotBase - 54;
    if (m.t_grav_bot > 0) {
      drawHorizDim(m.gravBotLeft[0], m.gravBotLeft[1], 0, 0, yDimBot1, `透水層底 ${m.t_grav_bot}`);
    }
    drawHorizDim(m.uvToWorld(m.uBaseL, -m.t_base)[0], m.uvToWorld(m.uBaseL, -m.t_base)[1], m.ptBaseFrontBot[0], m.ptBaseFrontBot[1], yDimBot1, `基礎台寬 B=${m.B_base}`);

    if (m.R1 > 0) {
      const pKeyL = m.uvToWorld(m.uKeyBotL, -(m.t_base + m.R1));
      const pKeyR = m.uvToWorld(m.uKeyBotR, -(m.t_base + m.R1));
      drawHorizDim(pKeyL[0], pKeyL[1], pKeyR[0], pKeyR[1], yDimBot2, `止滑榫 P1=${m.P1}, R1=${m.R1}`);
    }

    const xRightDim = xBedEnd + 15;
    drawVertDim(xBedEnd, m.y_scour, xBedEnd, m.y_bed, xRightDim, `df=${m.df} (預期沖刷深度≥30cm)`);
    drawVertDim(xBedEnd, m.ptBaseFrontBot[1], xBedEnd, m.y_scour, xRightDim, `${m.k_df.toFixed(2)}df=${m.d_extra.toFixed(1)}`);
  }

  const ySecNote = Math.min(m.uvToWorld(0, -(m.t_base + m.R1 + m.t_pc))[1], m.ptBaseFrontBot[1]) - 82;
  drawWorldText(40, ySecNote, '註：箱籠之組立造型應依設計需求而定，可採對稱型或單側階梯型。', 8.5, '#fbbf24', 'center', 'middle');
  drawWorldText(40, ySecNote - 18, '土 石 籠 護 岸 斷 面 圖', 14.5, '#38bdf8', 'center', 'middle');
  drawWorldLine(-55, ySecNote - 28, 135, ySecNote - 28, '#38bdf8', 2.0);

  // --------------------------------------------------------------------------
  // B1. 左下副視區 1：【土石籠織布(或不織布)袋 示意圖】(100% 還原原圖視埠 4877 等角立體圖)
  // --------------------------------------------------------------------------
  const bagCx = -115;
  const bagCy = ySecNote - 195;
  const isoW = 46;
  const isoDx = isoW * Math.cos(Math.PI / 6);
  const isoDy = isoW * Math.sin(Math.PI / 6);
  const isoH = 42;

  const pBot = [bagCx, bagCy];
  const pLeftBot = [bagCx - isoDx, bagCy + isoDy];
  const pRightBot = [bagCx + isoDx, bagCy + isoDy];
  const pBackBot = [bagCx, bagCy + 2 * isoDy];

  const pFrontTop = [bagCx, bagCy + isoH];
  const pLeftTop = [bagCx - isoDx, bagCy + isoDy + isoH];
  const pRightTop = [bagCx + isoDx, bagCy + isoDy + isoH];
  const pBackTop = [bagCx, bagCy + 2 * isoDy + isoH];

  const pFlapBack = [pBackTop[0] - 28, pBackTop[1] + 34];
  const pFlapLeft = [pLeftTop[0] - 28, pLeftTop[1] + 34];

  const leftFace = [pBot, pFrontTop, pLeftTop, pLeftBot];
  const rightFace = [pBot, pRightBot, pRightTop, pFrontTop];
  const topOpenFace = [pFrontTop, pRightTop, pBackTop, pLeftTop];
  const flapFace = [pLeftTop, pBackTop, pFlapBack, pFlapLeft];

  if (OPT.hatch) {
    drawDxfEarthHatchRegion(leftFace, 13.0, 'rgba(148, 163, 184, 0.42)');
    drawDxfEarthHatchRegion(rightFace, 13.0, 'rgba(148, 163, 184, 0.42)');
    drawDxfEarthHatchRegion(topOpenFace, 13.0, 'rgba(56, 189, 248, 0.35)');
    drawDxfEarthHatchRegion(flapFace, 13.0, 'rgba(148, 163, 184, 0.35)');
  }

  drawWorldPoly(leftFace, '#22c55e', 1.8, 'rgba(34, 197, 94, 0.10)', true);
  drawWorldPoly(rightFace, '#22c55e', 1.8, 'rgba(34, 197, 94, 0.14)', true);
  drawWorldPoly(topOpenFace, '#22c55e', 1.8, 'rgba(15, 23, 42, 0.45)', true);
  drawWorldPoly(flapFace, '#22c55e', 1.8, 'rgba(34, 197, 94, 0.16)', true);
  drawWorldPoly([pLeftBot, pBackBot, pRightBot], '#22c55e', 1.1, null, false, [4, 4]);
  drawWorldLine(pBackBot[0], pBackBot[1], pBackTop[0], pBackTop[1], '#22c55e', 1.1, [4, 4]);

  // 5cm 黏扣帶邊緣雙紅線
  drawWorldLine(pBot[0], pBot[1] + isoH - 3.5, pLeftTop[0], pLeftTop[1] - 3.5, '#ef4444', 1.6);
  drawWorldLine(pBot[0], pBot[1] + isoH - 3.5, pRightTop[0], pRightTop[1] - 3.5, '#ef4444', 1.6);
  drawLeader(pRightTop[0] - 8, pRightTop[1] - 4, pRightTop[0] + 14, pRightTop[1] + 10, true, ['黏扣帶 5cm', '(邊緣回摺≥10cm)']);

  // 織布袋三向尺寸標註 (*D9: 110cm, *D10: 105cm, *D11: 105cm)
  drawVertDim(pLeftBot[0], pLeftBot[1], pLeftTop[0], pLeftTop[1], pLeftBot[0] - 16, `${m.bag_h}cm`);
  drawWorldLine(pLeftBot[0] - 6, pLeftBot[1] - 10, pBot[0] - 6, pBot[1] - 10, '#38bdf8', 1.2);
  drawWorldText(0.5 * (pLeftBot[0] + pBot[0]) - 8, 0.5 * (pLeftBot[1] + pBot[1]) - 15, `${m.bag_w}cm`, 8.5, '#f8fafc', 'center', 'middle', -Math.PI / 6);
  drawWorldLine(pBot[0] + 6, pBot[1] - 10, pRightBot[0] + 6, pRightBot[1] - 10, '#38bdf8', 1.2);
  drawWorldText(0.5 * (pBot[0] + pRightBot[0]) + 8, 0.5 * (pBot[1] + pRightBot[1]) - 15, `${m.bag_w}cm`, 8.5, '#f8fafc', 'center', 'middle', Math.PI / 6);

  drawWorldText(bagCx, bagCy - 36, '土石籠織布(或不織布)袋 示意圖', 12.5, '#38bdf8', 'center', 'middle');
  drawWorldLine(bagCx - 95, bagCy - 45, bagCx + 95, bagCy - 45, '#38bdf8', 1.8);

  // --------------------------------------------------------------------------
  // B2. 中下副視區 2：【土石籠施工示意圖】(100% 還原原圖視埠 50E1 等角施工投料圖)
  // --------------------------------------------------------------------------
  const conCx = 135;
  const conCy = ySecNote - 195;
  const cellIsoW = 24;
  const cDx = cellIsoW * Math.cos(Math.PI / 6);
  const cDy = cellIsoW * Math.sin(Math.PI / 6);
  const cH = 22;

  for (let idx = 0; idx < 4; idx++) {
    const ox = conCx - 45 + idx * cDx;
    const oy = conCy - 10 + idx * cDy;
    const b0 = [ox, oy];
    const bR = [ox + cDx, oy + cDy];
    const bL = [ox - cDx, oy + cDy];
    const bBack = [ox, oy + 2 * cDy];

    const t0 = [b0[0], b0[1] + cH];
    const tR = [bR[0], bR[1] + cH];
    const tL = [bL[0], bL[1] + cH];
    const tBack = [bBack[0], bBack[1] + cH];

    const fFrontR = [b0, bR, tR, t0];
    const fFrontL = [b0, t0, tL, bL];
    const fTop = [t0, tR, tBack, tL];
    const fLid = [tL, tBack, [tBack[0] - 12, tBack[1] + 22], [tL[0] - 12, tL[1] + 22]];

    if (OPT.hatch) {
      drawDxfHoneyMeshRegion(fFrontR, 4.5, 'rgba(217, 70, 239, 0.55)');
      drawDxfEarthHatchRegion(fTop, 8.0, 'rgba(148, 163, 184, 0.45)');
      drawDxfEarthHatchRegion(fLid, 8.0, 'rgba(34, 197, 94, 0.40)');
    }
    drawWorldPoly(fFrontL, '#f8fafc', 1.2, 'rgba(30, 41, 59, 0.65)', true);
    drawWorldPoly(fFrontR, '#f8fafc', 1.3, 'rgba(30, 41, 59, 0.55)', true);
    drawWorldPoly(fTop, '#22c55e', 1.4, 'rgba(34, 197, 94, 0.15)', true);
    drawWorldPoly(fLid, '#22c55e', 1.3, 'rgba(34, 197, 94, 0.12)', true);
  }

  // 繪製上方挖土機怪手臂、抓斗與落下之土石料
  const bucketX = conCx - 18;
  const bucketY = conCy + 64;
  drawWorldLine(bucketX - 38, bucketY + 10, bucketX, bucketY, '#94a3b8', 2.0);
  drawWorldLine(bucketX - 35, bucketY + 18, bucketX + 2, bucketY + 7, '#94a3b8', 2.0);
  drawWorldPoly([
    [bucketX, bucketY],
    [bucketX + 14, bucketY + 2],
    [bucketX + 6, bucketY - 18],
    [bucketX - 4, bucketY - 12]
  ], '#facc15', 1.8, 'rgba(250, 204, 21, 0.22)', true);
  drawWorldCircle(bucketX + 1, bucketY + 3, 2.8, '#f8fafc', '#0f172a', 1.4);

  for (let s = 0; s < 12; s++) {
    const sx = bucketX - 4 + (seededRand(s * 19 + 5) - 0.4) * 14;
    const sy = bucketY - 16 - (s / 12) * 28;
    const sr = 2.0 + seededRand(s * 7) * 1.8;
    drawWorldPoly([
      [sx - sr, sy - sr * 0.6],
      [sx + sr, sy - sr * 0.4],
      [sx + sr * 0.7, sy + sr],
      [sx - sr * 0.8, sy + sr * 0.5]
    ], '#d946ef', 1.2, 'rgba(217, 70, 239, 0.28)', true);
  }

  drawLeader(bucketX - 2, bucketY - 28, bucketX - 24, bucketY - 26, false, ['土石料 (或刨除料)']);
  drawLeader(conCx + 15, conCy + 35, conCx + 36, conCy + 56, true, ['土石籠織布袋', '(或不織布)']);
  drawLeader(conCx + 28, conCy + 20, conCx + 46, conCy + 32, true, ['石籠 (六角鋼絲網)']);

  drawWorldText(conCx, conCy - 36, '土 石 籠 施 工 示 意 圖', 12.5, '#38bdf8', 'center', 'middle');
  drawWorldLine(conCx - 75, conCy - 45, conCx + 75, conCy - 45, '#38bdf8', 1.8);

  // --------------------------------------------------------------------------
  // C. 右下區：【正視 (立面) 圖 (Front Elevation View)】(上下籠身錯縫 + DXF塊石 + 織布袋 + 六角格網)
  // --------------------------------------------------------------------------
  const xElevL = Math.max(440, xBedEnd + 150);
  const xElevR = xElevL + m.L_unit;

  const yElevBaseTop = 0;
  const yElevBaseBot = -m.t_base;
  drawWorldPoly([
    [xElevL, yElevBaseBot],
    [xElevR, yElevBaseBot],
    [xElevR, yElevBaseTop],
    [xElevL, yElevBaseTop]
  ], '#facc15', 2.0, 'rgba(148, 163, 184, 0.16)', true);

  if (m.R1 > 0) {
    drawWorldPoly([
      [xElevL, yElevBaseBot],
      [xElevR, yElevBaseBot],
      [xElevR, -(m.t_base + m.R1)],
      [xElevL, -(m.t_base + m.R1)]
    ], '#facc15', 1.4, 'rgba(250, 204, 21, 0.08)', true, [6, 4]);
  }
  if (m.t_pc > 0) {
    drawWorldPoly([
      [xElevL - m.w_pc, yElevBaseBot],
      [xElevR + m.w_pc, yElevBaseBot],
      [xElevR + m.w_pc, yElevBaseBot - m.t_pc],
      [xElevL - m.w_pc, yElevBaseBot - m.t_pc]
    ], '#22c55e', 1.5, 'rgba(34, 197, 94, 0.14)', true);
  }

  for (let r = 0; r < m.N_layer; r++) {
    const y1 = r * m.H1;
    const y2 = (r + 1) * m.H1;
    const staggerOffset = (r % 2 === 1) ? 0.5 * m.L_gab : 0;
    const nSegs = Math.ceil(m.L_unit / m.L_gab) + 1;

    for (let k = -1; k < nSegs; k++) {
      const gx1 = Math.max(xElevL, xElevL + k * m.L_gab + staggerOffset);
      const gx2 = Math.min(xElevR, xElevL + (k + 1) * m.L_gab + staggerOffset);
      if (gx2 - gx1 < 8) continue;

      const cellPoly = [[gx1, y1], [gx2, y1], [gx2, y2], [gx1, y2]];
      if (OPT.hatch) {
        const stonePolys = generateDxfStonePolysInRect(gx1 + 3, y1 + 3, gx2 - 3, y2 - 3, Math.max(22, m.H1 * 0.28), r * 100 + k * 17 + 5);
        stonePolys.forEach(sp => drawWorldPoly(sp, '#eab308', 1.1, 'rgba(250, 204, 21, 0.13)', true));
        drawDxfHoneyMeshRegion(cellPoly, Math.max(8, m.H1 * 0.12), 'rgba(56, 189, 248, 0.32)');
      }
      const nBagsInBox = Math.max(1, Math.round((gx2 - gx1) / m.B1));
      const bagStepW = (gx2 - gx1) / nBagsInBox;
      for (let b = 0; b < nBagsInBox; b++) {
        const bx1 = gx1 + b * bagStepW + 2.5;
        const bx2 = gx1 + (b + 1) * bagStepW - 2.5;
        if (bx2 > bx1) {
          drawWorldPoly([[bx1, y1 + 2.5], [bx2, y1 + 2.5], [bx2, y2 - 2.5], [bx1, y2 - 2.5]], '#22c55e', 1.0, null, true, [4, 3]);
        }
      }
      drawWorldPoly(cellPoly, '#facc15', 2.0, null, true);
    }
  }

  drawWorldLine(xElevL - 15, m.y_bed, xElevR + 15, m.y_bed, '#facc15', 1.6, [10, 5]);
  drawWorldLine(xElevL - 15, m.y_scour, xElevR + 15, m.y_scour, '#38bdf8', 1.2, [6, 4]);
  drawWorldText(xElevR + 20, m.y_bed, `河床基準線`, 8.5, '#facc15', 'left', 'middle');
  drawWorldText(xElevR + 20, m.y_scour, `預期沖刷線 (-df=${m.df}cm)`, 8.5, '#38bdf8', 'left', 'middle');

  if (OPT.dims) {
    drawHorizDim(xElevL, m.H_total, Math.min(xElevR, xElevL + m.L_gab), m.H_total, m.H_total + 25, `單籠長 L_gab=${m.L_gab} (內裝織布袋)`);
    drawHorizDim(xElevL, -(m.t_base + m.R1 + m.t_pc), xElevR, -(m.t_base + m.R1 + m.t_pc), -(m.t_base + m.R1 + m.t_pc) - 35, `單一分段標準長度 L_unit = ${m.L_unit} cm (${m.Lm.toFixed(1)} m)`);
  }

  drawWorldText(0.5 * (xElevL + xElevR), ySecNote - 18, '土 石 籠 護 岸 正 視 (立 面) 圖 (上下籠身交錯接縫 & 內襯織布袋)', 14.5, '#38bdf8', 'center', 'middle');
  drawWorldLine(0.5 * (xElevL + xElevR) - 240, ySecNote - 28, 0.5 * (xElevL + xElevR) + 240, ySecNote - 28, '#38bdf8', 2.0);

  // --------------------------------------------------------------------------
  // D. 右上區：【平面圖 (Plan View)】
  // --------------------------------------------------------------------------
  const yPlanToe = m.H_total + 110;
  let curYPlan = yPlanToe;

  for (let r = 0; r < m.N_layer; r++) {
    const isTopLayer = (r === m.N_layer - 1);
    const bandW = isTopLayer ? m.layersInfo[r].wLayer : Math.max(15, m.B2);
    const yBand1 = curYPlan;
    const yBand2 = curYPlan + bandW;
    const staggerOffset = (r % 2 === 1) ? 0.5 * m.L_gab : 0;
    const nSegs = Math.ceil(m.L_unit / m.L_gab) + 1;

    for (let k = -1; k < nSegs; k++) {
      const gx1 = Math.max(xElevL, xElevL + k * m.L_gab + staggerOffset);
      const gx2 = Math.min(xElevR, xElevL + (k + 1) * m.L_gab + staggerOffset);
      if (gx2 - gx1 < 8) continue;
      const cellPoly = [[gx1, yBand1], [gx2, yBand1], [gx2, yBand2], [gx1, yBand2]];
      if (OPT.hatch) {
        const sPolys = generateDxfStonePolysInRect(gx1 + 3, yBand1 + 3, gx2 - 3, yBand2 - 3, Math.max(20, bandW * 0.42), r * 70 + k * 13 + 9);
        sPolys.forEach(sp => drawWorldPoly(sp, '#eab308', 1.0, 'rgba(250, 204, 21, 0.14)', true));
        drawDxfHoneyMeshRegion(cellPoly, Math.max(8, m.B1 * 0.11), 'rgba(56, 189, 248, 0.28)');
      }
      drawWorldPoly(cellPoly, '#facc15', 1.8, null, true);
    }
    curYPlan = yBand2;
  }

  if (m.t_grav_top > 0) {
    const yPlanGravTop = curYPlan + m.t_grav_top;
    const planGravPoly = [[xElevL, curYPlan], [xElevR, curYPlan], [xElevR, yPlanGravTop], [xElevL, yPlanGravTop]];
    if (OPT.hatch) {
      drawDxfGravelRegion(planGravPoly, Math.max(25, m.B1 * 0.45), '#c084fc');
    }
    drawWorldPoly(planGravPoly, '#c084fc', 1.4, 'rgba(192, 132, 252, 0.10)', true);
    curYPlan = yPlanGravTop;
  }

  if (OPT.dims) {
    const xPlanDim = xElevR + 35;
    drawVertDim(xElevR, yPlanToe, xElevR, curYPlan, xPlanDim, `平面總投影寬`);
  }

  drawWorldText(0.5 * (xElevL + xElevR), yPlanToe - 26, '土 石 籠 護 岸 平 面 圖', 14.5, '#38bdf8', 'center', 'middle');
  drawWorldLine(0.5 * (xElevL + xElevR) - 110, yPlanToe - 36, 0.5 * (xElevL + xElevR) + 110, yPlanToe - 36, '#38bdf8', 2.0);

  // --------------------------------------------------------------------------
  // E. 最下方區：【圖面內建工程數量計算式表 (On-Canvas & DXF Table)】
  // --------------------------------------------------------------------------
  const tblX = -215;
  const tblYTop = bagCy - 80;
  const colWidths = [55, 370, 65, 545, 135, 135, 375];
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
    `土石籠護岸 (圖號 0404-1) 工程數量計算式表 【單元長 L=${m.Lm.toFixed(1)}m，層數=${m.N_layer}層，總高 H=${(m.H_total/100).toFixed(2)}m，基礎台 B=${(m.B_base/100).toFixed(2)}m×t=${(m.t_base/100).toFixed(2)}m】`,
    11.0, '#f8fafc', 'center', 'middle'
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
    drawWorldText(cx + 10, rMid, q.formula, 8.6, '#fbbf24', 'left', 'middle'); cx += colWidths[3];
    drawWorldText(cx + colWidths[4] - 12, rMid, q.perM.toFixed(3), 9.0, '#38bdf8', 'right', 'middle'); cx += colWidths[4];
    drawWorldText(cx + colWidths[5] - 12, rMid, q.total.toFixed(2), 9.5, '#4ade80', 'right', 'middle'); cx += colWidths[5];
    drawWorldText(cx + 10, rMid, q.note, 8.4, '#94a3b8', 'left', 'middle');
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
return { model(R) { RR = R; try { return computeModel(); } finally { RR = null; } }, prims, SEL: {'sel_step_type': 'sym', 'sel_fill_mat': 'river', 'sel_exc_mode': 'full', 'sel_rebar_main': 'NONE', 'sel_rebar_sub': 'D13'} };
})();
TCO_T['b403'] = (function () {   // 水保標準圖 0403-1 箱籠護岸 (v2)
const CNS560_REBAR = {
  NONE: { d: 0, unitW: 0 },
  D10: { d: 0.953, unitW: 0.560 },
  D13: { d: 1.270, unitW: 0.995 },
  D16: { d: 1.590, unitW: 1.560 },
  D19: { d: 1.910, unitW: 2.250 },
  D22: { d: 2.220, unitW: 3.040 }
};

// 原圖 4-03.dxf Handle 1B36 ~ 1B41 表層箱籠外表面塊石 SPLINE 正規化頂點 ([-0.5,0.5]x[-0.5,0.5])
const DXF_STONE_SHAPES = [
  [[0.056, -0.465], [0.418, -0.340], [0.500, 0.066], [0.193, 0.500], [-0.411, 0.453], [-0.500, -0.016], [-0.325, -0.422], [0.056, -0.465]],
  [[-0.098, -0.500], [0.397, -0.385], [0.500, 0.125], [0.309, 0.500], [-0.409, 0.420], [-0.500, 0.053], [-0.358, -0.346], [-0.098, -0.500]],
  [[-0.180, -0.500], [0.464, -0.273], [0.500, -0.015], [0.381, 0.440], [0.059, 0.500], [-0.399, 0.394], [-0.500, -0.197], [-0.180, -0.500]],
  [[-0.091, -0.500], [0.390, -0.373], [0.500, 0.167], [0.352, 0.484], [-0.369, 0.500], [-0.500, 0.087], [-0.351, -0.326], [-0.091, -0.500]],
  [[-0.141, -0.500], [0.411, -0.414], [0.500, 0.086], [0.291, 0.500], [-0.306, 0.500], [-0.500, 0.000], [-0.410, -0.431], [-0.141, -0.500]],
  [[-0.294, -0.500], [0.406, -0.318], [0.500, 0.045], [0.409, 0.500], [-0.368, 0.409], [-0.500, 0.136], [-0.409, -0.300], [-0.294, -0.500]],
  [[-0.055, -0.500], [0.437, -0.421], [0.500, 0.119], [0.369, 0.500], [-0.221, 0.468], [-0.500, 0.214], [-0.434, -0.294], [-0.055, -0.500]],
  [[-0.038, -0.500], [0.395, -0.399], [0.500, -0.095], [0.360, 0.500], [-0.241, 0.487], [-0.500, 0.064], [-0.365, -0.348], [-0.038, -0.500]]
];

// 原圖 AutoCAD GRAVEL 剖面線 41 段晶格定義 ([0,1]x[0,1])
const GRAVEL_TILE_SEGS = [
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

// 原圖 4-03.dxf 基準幾何線 (以原圖基礎台左頂角 (3.9223, 393.7568) 為原點 (0,0)，可隨比例縮放比對)
const ORIG_0403_RAW = {
  base: [[0, 0], [119.5434, 10.4587], [120.8507, -4.4842], [1.3073, -14.9429]],
  boxes: [
    [[0, 0], [39.8478, 3.4862], [36.3616, 43.3340], [-3.4862, 39.8478]],
    [[39.8478, 3.4862], [79.6956, 6.9725], [76.2093, 46.8202], [36.3616, 43.3340]],
    [[79.6956, 6.9725], [119.5434, 10.4587], [116.0571, 50.3065], [76.2093, 46.8202]],
    [[16.4377, 41.5909], [56.2855, 45.0771], [52.7992, 84.9249], [12.9514, 81.4387]],
    [[56.2855, 45.0771], [96.1332, 48.5634], [92.6470, 88.4111], [52.7992, 84.9249]],
    [[32.8753, 83.1818], [72.7231, 86.6680], [69.2369, 126.5158], [29.3891, 123.0296]]
  ],
  geotextile: [[28.8474, 123.4841], [32.3337, 83.6363], [12.4098, 81.8932], [15.8960, 42.0454], [-4.0279, 40.3023], [-0.4981, -0.0436]],
  topFill: [[69.2369, 126.5158], [-9.5477, 140.4077], [-89.5477, 140.4077]]
};

// ============================================================================
// 2. 視角與狀態管理 (鎖定視角鐵律：修改參數絕不重設 camX/camY/scale)
// ============================================================================

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
function generateDxfStonePolysInRect(x1, y1, x2, y2, stoneSizeNom = 28.0, seedBase = 1) {
  const w = Math.abs(x2 - x1);
  const h = Math.abs(y2 - y1);
  const nCols = Math.max(2, Math.round(w / stoneSizeNom));
  const nRows = Math.max(2, Math.round(h / (stoneSizeNom * 0.82)));
  const cw = w / nCols;
  const ch = h / nRows;
  const polys = [];

  for (let r = 0; r < nRows; r++) {
    for (let c = 0; c < nCols; c++) {
      const shape = DXF_STONE_SHAPES[(r * 3 + c * 5 + seedBase) % DXF_STONE_SHAPES.length];
      const flipX = ((r + c) % 2 === 0) ? 1 : -1;
      const xm = Math.min(x1, x2) + (c + 0.5) * cw;
      const ym = Math.min(y1, y2) + (r + 0.5) * ch;
      const poly = shape.map(uv => [
        xm + uv[0] * flipX * cw * 0.90,
        ym + uv[1] * ch * 0.88
      ]);
      polys.push(poly);
    }
  }
  return polys;
}

let RR = null;
const getNum = (id, fb) => tcoIn(RR, id, fb);
function computeModel() {
  const step_type = tcoSel(RR, 'sel_step_type', 'sym'); // 'sym' or 'single'
  const N_layer = Math.max(1, Math.min(6, Math.round(getNum('inp_N_layer', 3))));
  const N_bot = Math.max(1, Math.min(6, Math.round(getNum('inp_N_bot', 3))));
  const B1 = Math.max(20, getNum('inp_B1', 100));
  const H1 = Math.max(20, getNum('inp_H1', 100));
  const L_gab = Math.max(50, getNum('inp_L_gab', 200));
  const B2 = Math.max(0, getNum('inp_B2', 50));
  const alpha_deg = Math.max(0, Math.min(20, getNum('inp_alpha', 5.0)));
  const L_unit = Math.max(100, getNum('inp_L_unit', 1000));

  const df = Math.max(10, getNum('inp_df', 85));
  const k_df = Math.max(0.1, getNum('inp_k_df', 0.50));
  const t_grav_top = Math.max(5, getNum('inp_t_grav_top', 30));
  const t_grav_bot = Math.max(5, getNum('inp_t_grav_bot', 30));
  const w_top_fill = Math.max(30, getNum('inp_w_top_fill', 150));
  const exc_mode = tcoSel(RR, 'sel_exc_mode', 'full');

  const t_base = Math.max(10, getNum('inp_t_base', 50));
  const B_toe = Math.max(0, getNum('inp_B_toe', 0));
  const B_heel = Math.max(0, getNum('inp_B_heel', 0));
  const R1 = Math.max(0, getNum('inp_R1', 0));
  const P1 = Math.max(15, getNum('inp_P1', 30));
  const t_pc = Math.max(0, getNum('inp_t_pc', 0));
  const w_pc = t_pc > 0 ? Math.max(0, getNum('inp_w_pc', 10)) : 0;

  const rebar_main_key = tcoSel(RR, 'sel_rebar_main', 'NONE');
  const rebar_sub_key = tcoSel(RR, 'sel_rebar_sub', 'D13');
  const S_rebar = 20;

  // 局部旋轉座標系 (對應原圖 UCS 1-1: u 軸向右上方傾斜 alpha，v 軸向左上方傾斜 alpha)
  const alpha_rad = alpha_deg * Math.PI / 180.0;
  const cosA = Math.cos(alpha_rad);
  const sinA = Math.sin(alpha_rad);
  const uvToWorld = (u, v) => [u * cosA - v * sinA, u * sinA + v * cosA];

  // 基本衍生尺寸
  const H_total = N_layer * H1; // 箱籠堆疊總高度 H
  const W_bot_gab = N_bot * B1; // 底層箱籠總寬
  const B_base = B_heel + W_bot_gab + B_toe; // 混凝土基礎台總寬 B

  // 計算各層箱籠局部 (u, v) 範圍與個別箱籠單元多邊形
  const layersInfo = [];
  const gabionBoxes = [];
  let sumGabionArea_cm2 = 0;

  for (let r = 0; r < N_layer; r++) {
    const vBot = r * H1;
    const vTop = (r + 1) * H1;
    let uLeft = 0;
    let uRight = W_bot_gab;
    if (step_type === 'sym') {
      uLeft = r * B2;
      uRight = W_bot_gab - r * B2;
    } else {
      uLeft = 0;
      uRight = W_bot_gab - r * B2;
    }
    if (uRight - uLeft < B1 * 0.5) {
      uRight = uLeft + B1;
    }
    const wLayer = uRight - uLeft;
    sumGabionArea_cm2 += wLayer * H1;

    // 該層可切分為幾個箱籠格
    const nCells = Math.max(1, Math.round(wLayer / B1));
    const cellW = wLayer / nCells;

    for (let c = 0; c < nCells; c++) {
      const uc1 = uLeft + c * cellW;
      const uc2 = uLeft + (c + 1) * cellW;
      const poly = [
        uvToWorld(uc1, vBot),
        uvToWorld(uc2, vBot),
        uvToWorld(uc2, vTop),
        uvToWorld(uc1, vTop)
      ];
      // 【關鍵修正】：只有每一層最外側臨水面那顆箱籠 (c === nCells - 1) 才是「護岸表層箱籠 (GRAVEL + 塊石整面)」！
      // 當頂層往外有多顆並排時，後面 (內側 c < nCells - 1) 那顆箱籠上方被覆土掩蓋且右側緊鄰前籠，沒有塊石整面，應採用 HONEY 六角格網！
      const isSurfaceBox = (c === nCells - 1);
      gabionBoxes.push({
        row: r,
        col: c,
        nCells,
        u1: uc1, u2: uc2, v1: vBot, v2: vTop,
        w: cellW, h: H1,
        isSurfaceBox,
        poly
      });
    }

    layersInfo.push({
      row: r,
      uLeft, uRight, vBot, vTop, wLayer, nCells, cellW,
      ptBackBot: uvToWorld(uLeft, vBot),
      ptBackTop: uvToWorld(uLeft, vTop),
      ptFrontBot: uvToWorld(uRight, vBot),
      ptFrontTop: uvToWorld(uRight, vTop),
      ptFrontCellBackTop: uvToWorld(uRight - cellW, vTop)
    });
  }

  // 混凝土基礎台多邊形 (含選配底部 1:3 梯形止滑榫)
  const uBaseL = -B_heel;
  const uBaseR = W_bot_gab + B_toe;
  const keySlopeW = R1 / 3.0;
  const keyTopW = R1 > 0 ? (P1 + 2 * keySlopeW) : 0;
  let X_key = getNum('inp_X_key', 40);
  if (R1 > 0) {
    X_key = Math.max(0, Math.min(X_key, Math.max(0, B_base - keyTopW)));
  }
  const uKeyTopR = uBaseR - X_key;
  const uKeyTopL = uKeyTopR - keyTopW;
  const uKeyBotR = uKeyTopR - keySlopeW;
  const uKeyBotL = uKeyTopL + keySlopeW;

  const basePoly = [
    uvToWorld(uBaseL, 0),
    uvToWorld(uBaseR, 0),
    uvToWorld(uBaseR, -t_base)
  ];
  if (R1 > 0) {
    basePoly.push(
      uvToWorld(uKeyTopR, -t_base),
      uvToWorld(uKeyBotR, -(t_base + R1)),
      uvToWorld(uKeyBotL, -(t_base + R1)),
      uvToWorld(uKeyTopL, -t_base)
    );
  }
  basePoly.push(uvToWorld(uBaseL, -t_base));

  // 地工不織布折線 (貼合箱籠背面階梯與基礎台頂面) & 背部透水層多邊形 (頂底寬同步連動)
  const geotextilePts = [];
  const gravelFrontPts = [];

  for (let r = N_layer - 1; r >= 0; r--) {
    const li = layersInfo[r];
    const pTop = uvToWorld(li.uLeft - 1.2, li.vTop);
    const pBot = uvToWorld(li.uLeft - 1.2, li.vBot);
    geotextilePts.push(pTop, pBot);
    gravelFrontPts.push(uvToWorld(li.uLeft, li.vTop), uvToWorld(li.uLeft, li.vBot));
  }
  const topBackPt = layersInfo[N_layer - 1].ptBackTop;
  const botBackPt = layersInfo[0].ptBackBot;
  const gravTopLeft = [topBackPt[0] - t_grav_top, topBackPt[1]];
  const gravBotLeft = [botBackPt[0] - t_grav_bot, botBackPt[1]];
  const gravelPoly = [
    ...gravelFrontPts,
    gravBotLeft,
    gravTopLeft
  ];

  // 坡頂回填線 (對應原圖 1BF7 & 1C3E)
  const topRightPt = layersInfo[N_layer - 1].ptFrontTop;
  const slopeCapPt = [gravTopLeft[0] - 18, topRightPt[1] + 28 * (B1 / 100)];
  const horizCapLeftPt = [slopeCapPt[0] - w_top_fill, slopeCapPt[1]];

  // 右側河床基準線、預期沖刷深度 df 與 0.2~0.5df 標註座標
  const d_extra = k_df * df;
  const D_embed = df + d_extra;
  const ptBaseFrontBot = uvToWorld(uBaseR, -t_base);
  const y_bed = ptBaseFrontBot[1] + D_embed;
  const y_scour = y_bed - df;
  const y_water = layersInfo[Math.min(1, N_layer - 1)].ptFrontTop[1] - 0.15 * H1;

  // 臨水面等效坡度比 1 : n_eff
  const dxSlope = topRightPt[0] - layersInfo[0].ptFrontBot[0];
  const dySlope = Math.max(1, topRightPt[1] - layersInfo[0].ptFrontBot[1]);
  const n_eff = Math.abs(dxSlope / dySlope);

  // PC 打底寬度
  const B_pc = t_pc > 0 ? (B_base + 2 * w_pc) : 0;
  const B_pc_net = t_pc > 0 ? Math.max(0, B_pc - keyTopW) : 0;

  // 工程數量計算 (以 m 為單位，100% 對應圖面標註尺寸)
  const Lm = L_unit / 100.0;
  const H1_m = H1 / 100.0;
  const B1_m = B1 / 100.0;
  const B_base_m = B_base / 100.0;
  const t_base_m = t_base / 100.0;
  const H_tot_m = H_total / 100.0;

  // 1. 箱型石籠與內填塊卵石總體積
  const layerWidthsStr = layersInfo.map(l => (l.wLayer / 100).toFixed(2)).join('+');
  const area_gab = sumGabionArea_cm2 / 10000.0;
  const vol_gab_unit = area_gab * Lm;
  const f_gab = `(${layerWidthsStr}) * ${H1_m.toFixed(2)} * ${Lm.toFixed(1)}`;
  const singleGabVol = (B1_m * H1_m * (L_gab / 100.0));
  const numGabBoxes = vol_gab_unit / Math.max(0.01, singleGabVol);

  // 2. 籠內塊卵石填充料 (80% 22~35cm, 15% 10~22cm, 5% <10cm)
  const vol_stone_80 = vol_gab_unit * 0.80;
  const vol_stone_15 = vol_gab_unit * 0.15;
  const vol_stone_05 = vol_gab_unit * 0.05;
  const f_stone = `${vol_gab_unit.toFixed(2)} * (80%主石 + 15%填充石 + 5%填縫卵石)`;

  // 3. 表面及臨水面塊石人工整面面積 (僅計外露臨水面與各階踏面/最外籠頂面，扣除頂層後側覆土箱籠頂面)
  const topExposedW_m = (layersInfo[N_layer - 1].cellW + (N_layer - 1) * B2) / 100.0;
  const perim_face_m = topExposedW_m + N_layer * H1_m;
  const area_face_unit = perim_face_m * Lm;
  const f_face = `(${topExposedW_m.toFixed(2)} + ${N_layer}*${H1_m.toFixed(2)}) * ${Lm.toFixed(1)}`;

  // 4. 210 kgf/cm² 混凝土基礎台 (含選配止滑榫)
  const P1_m = P1 / 100.0;
  const R1_m = R1 / 100.0;
  const keyTopW_m = keyTopW / 100.0;
  const area_conc = B_base_m * t_base_m + (R1 > 0 ? ((P1_m + keyTopW_m) / 2.0) * R1_m : 0);
  const vol_conc_unit = area_conc * Lm;
  const f_conc = R1 > 0
    ? `(${B_base_m.toFixed(2)}*${t_base_m.toFixed(2)} + ((${P1_m.toFixed(2)}+${keyTopW_m.toFixed(2)})/2)*${R1_m.toFixed(2)}) * ${Lm.toFixed(1)}`
    : `${B_base_m.toFixed(2)} * ${t_base_m.toFixed(2)} * ${Lm.toFixed(1)}`;

  // 5. 背部碎石級配透水層
  const tg_top_m = t_grav_top / 100.0;
  const tg_bot_m = t_grav_bot / 100.0;
  const area_gravel = ((tg_top_m + tg_bot_m) / 2.0) * H_tot_m;
  const vol_gravel_unit = area_gravel * Lm;
  const f_gravel = `((${tg_top_m.toFixed(2)}+${tg_bot_m.toFixed(2)})/2) * ${H_tot_m.toFixed(2)} * ${Lm.toFixed(1)}`;

  // 6. 地工不織布鋪設面積
  const backStepSum_m = ((layersInfo[N_layer - 1].uLeft - layersInfo[0].uLeft) + t_grav_bot + 30) / 100.0;
  const len_geo_m = H_tot_m + backStepSum_m;
  const area_geo_unit = len_geo_m * Lm;
  const f_geo = `(${H_tot_m.toFixed(2)} + ${backStepSum_m.toFixed(2)}) * ${Lm.toFixed(1)}`;

  // 7. 結構土石方開挖
  const D_emb_m = D_embed / 100.0;
  let area_exc = 0;
  let f_exc = '';
  if (exc_mode === 'full') {
    const area_front_emb = 0.5 * D_emb_m * D_emb_m * 0.45;
    area_exc = area_gab + area_conc + area_gravel + area_front_emb;
    f_exc = `(${area_gab.toFixed(2)} + ${area_conc.toFixed(2)} + ${area_gravel.toFixed(2)} + ${area_front_emb.toFixed(2)}) * ${Lm.toFixed(1)}`;
  } else {
    const w_emb_top = B_base_m + 2 * 0.3 * D_emb_m;
    area_exc = ((B_base_m + w_emb_top) / 2.0) * D_emb_m;
    f_exc = `((${B_base_m.toFixed(2)}+${w_emb_top.toFixed(2)})/2) * ${D_emb_m.toFixed(2)} * ${Lm.toFixed(1)}`;
  }
  const vol_exc_unit = area_exc * Lm;

  const quantities = [
    { id: '1', name: '鍍鋅/PVC低碳鋼線箱型石籠 (線徑≥3.5mm)', unit: 'm³', formula: f_gab, perM: area_gab, total: vol_gab_unit, note: `折合單籠(${(L_gab/100).toFixed(1)}x${B1_m.toFixed(1)}x${H1_m.toFixed(1)}m) 約 ${numGabBoxes.toFixed(1)} 組` },
    { id: '2', name: '箱籠內填塊卵石 (80%主石/15%填充/5%填縫)', unit: 'm³', formula: f_stone, perM: area_gab, total: vol_gab_unit, note: `22~35cm:${vol_stone_80.toFixed(1)} / 10~22cm:${vol_stone_15.toFixed(1)} / <10cm:${vol_stone_05.toFixed(1)} m³` },
    { id: '3', name: '護岸表層及臨水面塊石人工整面', unit: 'm²', formula: f_face, perM: perim_face_m, total: area_face_unit, note: `僅計最外側臨水面表層箱籠外露面` },
    { id: '4', name: '210 kgf/cm² 混凝土基礎台', unit: 'm³', formula: f_conc, perM: area_conc, total: vol_conc_unit, note: `基礎台寬 B=${B_base}cm, 厚 t=${t_base}cm` },
    { id: '5', name: '背部碎石級配透水層', unit: 'm³', formula: f_gravel, perM: area_gravel, total: vol_gravel_unit, note: `頂寬 ${t_grav_top}cm / 底寬 ${t_grav_bot}cm` },
    { id: '6', name: '地工織布或不織布鋪設 (防細粒料析出)', unit: 'm²', formula: f_geo, perM: len_geo_m, total: area_geo_unit, note: `貼合箱籠背面階梯與基底搭接` },
    { id: '7', name: '結構土石方開挖', unit: 'm³', formula: f_exc, perM: area_exc, total: vol_exc_unit, note: `總埋深 D_embed=${D_embed.toFixed(1)}cm (df=${df}cm)` }
  ];

  if (t_pc > 0) {
    const B_pc_m = B_pc / 100.0;
    const t_pc_m = t_pc / 100.0;
    const area_pc = ((B_pc - keyTopW) / 100.0) * t_pc_m;
    quantities.push({
      id: String(quantities.length + 1),
      name: '分段水平 PC 打底混凝土',
      unit: 'm³',
      formula: `(${B_pc_m.toFixed(2)} - ${keyTopW_m.toFixed(2)}) * ${t_pc_m.toFixed(2)} * ${Lm.toFixed(1)}`,
      perM: area_pc,
      total: area_pc * Lm,
      note: `厚 t_pc=${t_pc}cm (扣除止滑榫開口)`
    });
  }

  let n_sub_dots = 0;
  if (rebar_main_key !== 'NONE') {
    const mainSpec = CNS560_REBAR[rebar_main_key];
    const subSpec = CNS560_REBAR[rebar_sub_key];
    const c_base = 7.5;
    const n_main_sets = Math.floor(L_unit / S_rebar) + 1;
    const len_stirrup_m = (2 * ((B_base - 2 * c_base) + Math.max(10, t_base - 2 * c_base)) + 20) / 100.0;
    const len_key_v_m = R1 > 0 ? (P1 + 2 * R1 * Math.sqrt(1 + 1 / 9) + 60) / 100.0 : 0;
    const w_main = n_main_sets * (len_stirrup_m + len_key_v_m) * mainSpec.unitW;
    n_sub_dots = Math.max(4, Math.floor((B_base - 2 * c_base) / S_rebar) + 1) * 2 + (R1 > 0 ? 4 : 0);
    const w_sub = n_sub_dots * Lm * subSpec.unitW;
    const weight_rebar = w_main + w_sub;
    quantities.push({
      id: String(quantities.length + 1),
      name: `基礎台與止滑榫竹節鋼筋 (${rebar_main_key}/${rebar_sub_key})`,
      unit: 'kg',
      formula: `主筋${rebar_main_key}:${n_main_sets}組*${(len_stirrup_m+len_key_v_m).toFixed(2)}m*${mainSpec.unitW} + 副筋${rebar_sub_key}:${n_sub_dots}支*${Lm.toFixed(1)}m*${subSpec.unitW}`,
      perM: weight_rebar / Lm,
      total: weight_rebar,
      note: `CNS 560 圓點總數 ${n_sub_dots} 顆`
    });
  }

  return {
    step_type, N_layer, N_bot, B1, H1, L_gab, B2, alpha_deg, alpha_rad, cosA, sinA, uvToWorld,
    L_unit, Lm, df, k_df, d_extra, D_embed, t_grav_top, t_grav_bot, w_top_fill, exc_mode,
    t_base, B_toe, B_heel, B_base, W_bot_gab, H_total,
    X_key, R1, P1, keySlopeW, keyTopW, t_pc, w_pc, B_pc, B_pc_net,
    uBaseL, uBaseR, uKeyTopL, uKeyTopR, uKeyBotL, uKeyBotR,
    rebar_main_key, rebar_sub_key, S_rebar, n_sub_dots,
    layersInfo, gabionBoxes, basePoly, geotextilePts, gravelPoly,
    gravTopLeft, gravBotLeft, topRightPt, slopeCapPt, horizCapLeftPt,
    ptBaseFrontBot, y_bed, y_scour, y_water, n_eff,
    quantities
  };
}

function prims(m, OPT, part) {
  OPT = Object.assign({ hatch: true, dims: true }, OPT || {}); const O = [];
  const drawWorldLine = (x1, y1, x2, y2, color = '#ffffff', lineWidth = 1.5, dash = []) => O.push({ k: 'L', p: [[x1, y1], [x2, y2]], c: color, w: lineWidth, d: dash });
  const drawWorldPoly = (pts, strokeColor = '#ffffff', lineWidth = 1.5, fillColor = null, close = true, dash = []) => { if (pts && pts.length >= 2) O.push({ k: 'P', p: pts.map(q => [q[0], q[1]]), c: strokeColor, w: lineWidth, f: fillColor, cl: close, d: dash }); };
  const drawWorldCircle = (wx, wy, rWorld, strokeColor = '#ffffff', fillColor = null, lineWidth = 1.2) => O.push({ k: 'C', x: wx, y: wy, r: rWorld, c: strokeColor, f: fillColor, w: lineWidth });
  const drawWorldText = (wx, wy, text, heightWorld = 10, color = '#ffffff', align = 'center', baseline = 'middle', rotRad = 0) => O.push({ k: 'T', x: wx, y: wy, s: String(text), h: heightWorld, c: color, al: align, bl: baseline, rot: rotRad });
  const drawDxfGravelRegion = (outerPoly, tileSizeWorld = 45.0, strokeColor = '#d946ef') => { if (outerPoly && outerPoly.length >= 3) O.push({ k: 'G', outer: outerPoly, holes: [], tile: tileSizeWorld, c: strokeColor, segs: GRAVEL_TILE_SEGS }); };
  const drawDxfHoneyMeshRegion = (outerPoly, cellRadiusWorld = 9.0, strokeColor = 'rgba(217, 70, 239, 0.55)') => { if (outerPoly && outerPoly.length >= 3) O.push({ k: 'H', outer: outerPoly, r: cellRadiusWorld, c: strokeColor }); };
function getDimExtensionCoords(coordObj, dimPos) {
  const minGapFromObj = 9.0;
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
function drawLeader(xTip, yTip, xKnee, yKnee, dirRight, textLines, lineCol = '#38bdf8', txtCol = '#f8fafc') {
  const shelfLen = 62 * (dirRight ? 1 : -1);
  drawWorldLine(xTip, yTip, xKnee, yKnee, lineCol, 1.2);
  drawWorldLine(xKnee, yKnee, xKnee + shelfLen, yKnee, lineCol, 1.2);
  const dx = xKnee - xTip, dy = yKnee - yTip;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len, uy = dy / len;
  const px = -uy, py = ux;
  const arr = 6.0;
  drawWorldPoly([
    [xTip, yTip],
    [xTip + ux * arr + px * arr * 0.32, yTip + uy * arr + py * arr * 0.32],
    [xTip + ux * arr - px * arr * 0.32, yTip + uy * arr - py * arr * 0.32]
  ], lineCol, 1, lineCol, true);

  const tx = xKnee + (dirRight ? 6 : -6);
  const align = dirRight ? 'left' : 'right';
  textLines.forEach((line, idx) => {
    drawWorldText(tx, yKnee + 6 - idx * 12.5, line, 8.5, txtCol, align, 'middle');
  });
}

  if (part === 'sec') {
// A. 左上主視區：【標準斷面圖 (Cross-Section View)】(不畫自然地形線)
  // --------------------------------------------------------------------------
  // 1. 背部透水層 (GRAVEL 填充) 與紅色虛線地工不織布
  if (OPT.hatch) {
    drawDxfGravelRegion(m.gravelPoly, Math.max(25, m.B1 * 0.48), '#c084fc');
  }
  drawWorldPoly(m.gravelPoly, '#c084fc', 1.3, 'rgba(192, 132, 252, 0.08)', true);
  drawWorldPoly(m.geotextilePts, '#ef4444', 1.8, null, false, [7, 4]);

  // 坡頂回填頂面線 (對應原圖 1BF7, 1C3E)
  drawWorldPoly([m.topRightPt, m.slopeCapPt, m.horizCapLeftPt], '#facc15', 1.8, null, false);

  // 2. 混凝土基礎台 (AR-CONC 填充) + 選配 1:3 梯形止滑榫 + 分段水平 PC 打底 + 配筋
  drawWorldPoly(m.basePoly, '#facc15', 2.2, 'rgba(148, 163, 184, 0.16)', true);

  if (OPT.hatch) {
    const nConc = Math.max(6, Math.floor(m.B_base / 28));
    for (let k = 0; k < nConc; k++) {
      const u = m.uBaseL + ((k + 0.5) / nConc) * m.B_base;
      const v = -0.5 * m.t_base + (seededRand(k * 17 + 3) - 0.5) * 0.45 * m.t_base;
      const pt = m.uvToWorld(u, v);
      const rTri = Math.max(2.5, m.t_base * 0.09);
      drawWorldPoly([
        [pt[0] - rTri, pt[1] - rTri * 0.6],
        [pt[0] + rTri, pt[1] - rTri * 0.4],
        [pt[0], pt[1] + rTri]
      ], '#94a3b8', 1.0, null, true);
      drawWorldCircle(pt[0] + rTri * 1.4, pt[1], 0.9, '#94a3b8', '#94a3b8');
    }
  }

  // 分段水平 PC 打底層
  if (m.t_pc > 0) {
    const uPcL = m.uBaseL - m.w_pc;
    const uPcR = m.uBaseR + m.w_pc;
    if (m.R1 > 0) {
      if (m.uKeyTopL > uPcL) {
        drawWorldPoly([
          m.uvToWorld(uPcL, -m.t_base),
          m.uvToWorld(m.uKeyTopL, -m.t_base),
          m.uvToWorld(m.uKeyTopL + m.t_pc / 3, -(m.t_base + m.t_pc)),
          m.uvToWorld(uPcL, -(m.t_base + m.t_pc))
        ], '#22c55e', 1.6, 'rgba(34, 197, 94, 0.15)', true);
      }
      if (uPcR > m.uKeyTopR) {
        drawWorldPoly([
          m.uvToWorld(m.uKeyTopR, -m.t_base),
          m.uvToWorld(uPcR, -m.t_base),
          m.uvToWorld(uPcR, -(m.t_base + m.t_pc)),
          m.uvToWorld(m.uKeyTopR - m.t_pc / 3, -(m.t_base + m.t_pc))
        ], '#22c55e', 1.6, 'rgba(34, 197, 94, 0.15)', true);
      }
    } else {
      drawWorldPoly([
        m.uvToWorld(uPcL, -m.t_base),
        m.uvToWorld(uPcR, -m.t_base),
        m.uvToWorld(uPcR, -(m.t_base + m.t_pc)),
        m.uvToWorld(uPcL, -(m.t_base + m.t_pc))
      ], '#22c55e', 1.6, 'rgba(34, 197, 94, 0.15)', true);
    }
  }

  // 基礎台與止滑榫 CNS 560 鋼筋
  if (m.rebar_main_key !== 'NONE') {
    const c = Math.min(6.0, m.t_base * 0.2);
    drawWorldPoly([
      m.uvToWorld(m.uBaseL + c, -c),
      m.uvToWorld(m.uBaseR - c, -c),
      m.uvToWorld(m.uBaseR - c, -m.t_base + c),
      m.uvToWorld(m.uBaseL + c, -m.t_base + c)
    ], '#ef4444', 1.8, null, true);

    const nDots = Math.max(3, Math.floor((m.B_base - 2 * c) / m.S_rebar) + 1);
    for (let k = 0; k < nDots; k++) {
      const u = m.uBaseL + c + (k / Math.max(1, nDots - 1)) * (m.B_base - 2 * c);
      const pTop = m.uvToWorld(u, -c - 1.8);
      const pBot = m.uvToWorld(u, -m.t_base + c + 1.8);
      drawWorldCircle(pTop[0], pTop[1], 2.0, '#ef4444', '#ef4444');
      drawWorldCircle(pBot[0], pBot[1], 2.0, '#ef4444', '#ef4444');
    }
  }

  // 3. 繪製各層箱籠單元：
  // 僅每一層最外側臨水面那顆 (box.isSurfaceBox, 即 c === nCells - 1) 繪製 GRAVEL 與臨水面塊石整面；
  // 頂層或下層往內側的後排箱籠 (c < nCells - 1) 一律採用 HONEY 六角格網，且沒有塊石整面！
  m.gabionBoxes.forEach((box, bIdx) => {
    if (OPT.hatch) {
      if (box.isSurfaceBox) {
        drawDxfGravelRegion(box.poly, Math.max(22, m.B1 * 0.42), '#d946ef');
        // 最外側箱籠之右側臨水面排列 4 顆 DXF 塊石整面
        const nEdgeStones = 4;
        for (let s = 0; s < nEdgeStones; s++) {
          const shape = DXF_STONE_SHAPES[(bIdx + s) % DXF_STONE_SHAPES.length];
          const uCenterR = box.u2 - box.w * 0.12;
          const vCenterR = box.v1 + ((s + 0.5) / nEdgeStones) * box.h;
          const sPolyR = shape.map(uv => m.uvToWorld(uCenterR + uv[0] * box.w * 0.20, vCenterR + uv[1] * (box.h / nEdgeStones) * 0.88));
          drawWorldPoly(sPolyR, '#fb923c', 1.2, 'rgba(251, 146, 60, 0.22)', true);
        }
      } else {
        drawDxfHoneyMeshRegion(box.poly, Math.max(4.5, m.B1 * 0.085), '#d946ef');
      }
    }
    drawWorldPoly(box.poly, '#facc15', 2.0, 'rgba(250, 204, 21, 0.07)', true);
  });

  
    return O;
  }


  // --------------------------------------------------------------------------
  // A. 左上主視區：【標準斷面圖 (Cross-Section View)】(不畫自然地形線)
  // --------------------------------------------------------------------------
  // 1. 背部透水層 (GRAVEL 填充) 與紅色虛線地工不織布
  if (OPT.hatch) {
    drawDxfGravelRegion(m.gravelPoly, Math.max(25, m.B1 * 0.48), '#c084fc');
  }
  drawWorldPoly(m.gravelPoly, '#c084fc', 1.3, 'rgba(192, 132, 252, 0.08)', true);
  drawWorldPoly(m.geotextilePts, '#ef4444', 1.8, null, false, [7, 4]);

  // 坡頂回填頂面線 (對應原圖 1BF7, 1C3E)
  drawWorldPoly([m.topRightPt, m.slopeCapPt, m.horizCapLeftPt], '#facc15', 1.8, null, false);

  // 2. 混凝土基礎台 (AR-CONC 填充) + 選配 1:3 梯形止滑榫 + 分段水平 PC 打底 + 配筋
  drawWorldPoly(m.basePoly, '#facc15', 2.2, 'rgba(148, 163, 184, 0.16)', true);

  if (OPT.hatch) {
    const nConc = Math.max(6, Math.floor(m.B_base / 28));
    for (let k = 0; k < nConc; k++) {
      const u = m.uBaseL + ((k + 0.5) / nConc) * m.B_base;
      const v = -0.5 * m.t_base + (seededRand(k * 17 + 3) - 0.5) * 0.45 * m.t_base;
      const pt = m.uvToWorld(u, v);
      const rTri = Math.max(2.5, m.t_base * 0.09);
      drawWorldPoly([
        [pt[0] - rTri, pt[1] - rTri * 0.6],
        [pt[0] + rTri, pt[1] - rTri * 0.4],
        [pt[0], pt[1] + rTri]
      ], '#94a3b8', 1.0, null, true);
      drawWorldCircle(pt[0] + rTri * 1.4, pt[1], 0.9, '#94a3b8', '#94a3b8');
    }
  }

  // 分段水平 PC 打底層
  if (m.t_pc > 0) {
    const uPcL = m.uBaseL - m.w_pc;
    const uPcR = m.uBaseR + m.w_pc;
    if (m.R1 > 0) {
      if (m.uKeyTopL > uPcL) {
        drawWorldPoly([
          m.uvToWorld(uPcL, -m.t_base),
          m.uvToWorld(m.uKeyTopL, -m.t_base),
          m.uvToWorld(m.uKeyTopL + m.t_pc / 3, -(m.t_base + m.t_pc)),
          m.uvToWorld(uPcL, -(m.t_base + m.t_pc))
        ], '#22c55e', 1.6, 'rgba(34, 197, 94, 0.15)', true);
      }
      if (uPcR > m.uKeyTopR) {
        drawWorldPoly([
          m.uvToWorld(m.uKeyTopR, -m.t_base),
          m.uvToWorld(uPcR, -m.t_base),
          m.uvToWorld(uPcR, -(m.t_base + m.t_pc)),
          m.uvToWorld(m.uKeyTopR - m.t_pc / 3, -(m.t_base + m.t_pc))
        ], '#22c55e', 1.6, 'rgba(34, 197, 94, 0.15)', true);
      }
    } else {
      drawWorldPoly([
        m.uvToWorld(uPcL, -m.t_base),
        m.uvToWorld(uPcR, -m.t_base),
        m.uvToWorld(uPcR, -(m.t_base + m.t_pc)),
        m.uvToWorld(uPcL, -(m.t_base + m.t_pc))
      ], '#22c55e', 1.6, 'rgba(34, 197, 94, 0.15)', true);
    }
  }

  // 基礎台與止滑榫 CNS 560 鋼筋
  if (m.rebar_main_key !== 'NONE') {
    const c = Math.min(6.0, m.t_base * 0.2);
    drawWorldPoly([
      m.uvToWorld(m.uBaseL + c, -c),
      m.uvToWorld(m.uBaseR - c, -c),
      m.uvToWorld(m.uBaseR - c, -m.t_base + c),
      m.uvToWorld(m.uBaseL + c, -m.t_base + c)
    ], '#ef4444', 1.8, null, true);

    const nDots = Math.max(3, Math.floor((m.B_base - 2 * c) / m.S_rebar) + 1);
    for (let k = 0; k < nDots; k++) {
      const u = m.uBaseL + c + (k / Math.max(1, nDots - 1)) * (m.B_base - 2 * c);
      const pTop = m.uvToWorld(u, -c - 1.8);
      const pBot = m.uvToWorld(u, -m.t_base + c + 1.8);
      drawWorldCircle(pTop[0], pTop[1], 2.0, '#ef4444', '#ef4444');
      drawWorldCircle(pBot[0], pBot[1], 2.0, '#ef4444', '#ef4444');
    }
  }

  // 3. 繪製各層箱籠單元：
  // 僅每一層最外側臨水面那顆 (box.isSurfaceBox, 即 c === nCells - 1) 繪製 GRAVEL 與臨水面塊石整面；
  // 頂層或下層往內側的後排箱籠 (c < nCells - 1) 一律採用 HONEY 六角格網，且沒有塊石整面！
  m.gabionBoxes.forEach((box, bIdx) => {
    if (OPT.hatch) {
      if (box.isSurfaceBox) {
        drawDxfGravelRegion(box.poly, Math.max(22, m.B1 * 0.42), '#d946ef');
        // 最外側箱籠之右側臨水面排列 4 顆 DXF 塊石整面
        const nEdgeStones = 4;
        for (let s = 0; s < nEdgeStones; s++) {
          const shape = DXF_STONE_SHAPES[(bIdx + s) % DXF_STONE_SHAPES.length];
          const uCenterR = box.u2 - box.w * 0.12;
          const vCenterR = box.v1 + ((s + 0.5) / nEdgeStones) * box.h;
          const sPolyR = shape.map(uv => m.uvToWorld(uCenterR + uv[0] * box.w * 0.20, vCenterR + uv[1] * (box.h / nEdgeStones) * 0.88));
          drawWorldPoly(sPolyR, '#fb923c', 1.2, 'rgba(251, 146, 60, 0.22)', true);
        }
      } else {
        drawDxfHoneyMeshRegion(box.poly, Math.max(4.5, m.B1 * 0.085), '#d946ef');
      }
    }
    drawWorldPoly(box.poly, '#facc15', 2.0, 'rgba(250, 204, 21, 0.07)', true);
  });

  // 4. 右側河床水平基準線、預期沖刷線、設計水位線 (不含自然地形孵化符號)
  const xBedStart = m.ptBaseFrontBot[0] - 5;
  const xBedEnd = xBedStart + Math.max(95, m.B1 * 1.15);
  drawWorldLine(xBedStart, m.y_bed, xBedEnd, m.y_bed, '#facc15', 1.8);
  drawWorldText(xBedStart + 25, m.y_bed + 8, '河床基準線', 8.5, '#d946ef', 'left', 'middle');
  drawWorldLine(xBedStart, m.y_scour, xBedEnd, m.y_scour, '#38bdf8', 1.2, [6, 4]);
  drawWorldLine(xBedStart, m.ptBaseFrontBot[1], xBedEnd, m.ptBaseFrontBot[1], '#facc15', 1.2, [4, 4]);

  // 設計水位線與水波三角符號 (對應原圖 1C04 & BLK_05)
  const xWaterStart = m.layersInfo[Math.min(1, m.N_layer - 1)].ptFrontTop[0];
  const xWaterEnd = xBedEnd - 10;
  drawWorldLine(xWaterStart, m.y_water, xWaterEnd, m.y_water, '#38bdf8', 1.4);
  const xTriW = xWaterEnd - 18;
  drawWorldPoly([[xTriW, m.y_water], [xTriW + 4, m.y_water + 7], [xTriW - 4, m.y_water + 7]], '#38bdf8', 1.2, null, true);
  drawWorldLine(xTriW - 6, m.y_water - 3, xTriW + 6, m.y_water - 3, '#38bdf8', 1.0);
  drawWorldLine(xTriW - 3, m.y_water - 6, xTriW + 3, m.y_water - 6, '#38bdf8', 1.0);

  // 臨水面坡度標示 1 : n (對應原圖 1C0D)
  const ptSlopeMid = m.layersInfo[Math.min(1, m.N_layer - 1)].ptFrontBot;
  const triX = ptSlopeMid[0] + 22;
  const triY = ptSlopeMid[1] + 15;
  const triH = Math.max(18, m.H1 * 0.35);
  const triW = Math.max(8, triH * m.n_eff * 0.45);
  drawWorldPoly([[triX, triY], [triX, triY + triH], [triX - triW, triY + triH]], '#94a3b8', 1.2, null, false);
  drawWorldText(triX + 6, triY + 0.5 * triH, '1', 8.0, '#38bdf8', 'left', 'middle');
  drawWorldText(triX - 0.5 * triW, triY + triH + 7, `n=${m.n_eff.toFixed(2)}`, 8.0, '#38bdf8', 'center', 'middle');

  // 5. 原圖 0403-1 基準比對線疊加
  if (false) {
    const sRef = m.B1 / 40.0;
    const scalePoly = pts => pts.map(p => [p[0] * sRef, p[1] * sRef]);
    drawWorldPoly(scalePoly(ORIG_0403_RAW.base), '#f472b6', 1.5, null, true, [4, 4]);
    ORIG_0403_RAW.boxes.forEach(b => drawWorldPoly(scalePoly(b), '#f472b6', 1.5, null, true, [4, 4]));
    drawWorldPoly(scalePoly(ORIG_0403_RAW.geotextile), '#f472b6', 1.5, null, false, [4, 4]);
    drawWorldPoly(scalePoly(ORIG_0403_RAW.topFill), '#f472b6', 1.5, null, false, [4, 4]);
  }

  // 6. 斷面圖引線標註 (指向最外側表層箱籠之塊石整面與內部小石材)
  const topBox = m.layersInfo[m.N_layer - 1];
  const ptTopFrontStone = m.uvToWorld(topBox.uRight - topBox.cellW * 0.12, topBox.vTop - m.H1 * 0.18);
  const ptTopInnerGravel = m.uvToWorld(topBox.uRight - topBox.cellW * 0.58, topBox.vBot + m.H1 * 0.50);

  drawLeader(
    ptTopFrontStone[0], ptTopFrontStone[1],
    topBox.ptBackTop[0] - 25, topBox.ptFrontTop[1] + 32,
    false, ['表面以塊石整面']
  );
  drawLeader(
    ptTopInnerGravel[0], ptTopInnerGravel[1],
    topBox.ptBackBot[0] - 50, ptTopInnerGravel[1] - 8,
    false, ['內部可採用較小石材']
  );
  if (m.N_layer >= 2) {
    const midBox = m.layersInfo[1];
    drawLeader(
      midBox.ptFrontTop[0] - 8, midBox.ptFrontTop[1] - 6,
      midBox.ptFrontTop[0] + 22, midBox.ptFrontTop[1] + 22,
      true, ['護岸表層箱籠']
    );
  }
  drawLeader(
    m.layersInfo[0].ptBackTop[0] + 15, m.layersInfo[0].ptBackTop[1] + 12,
    m.layersInfo[0].ptBackTop[0] - 55, m.layersInfo[0].ptBackTop[1] + 5,
    false, ['箱型石籠 (六角格網)']
  );
  drawLeader(
    m.gravBotLeft[0] + 0.5 * m.t_grav_bot, m.gravBotLeft[1] + 20,
    m.gravBotLeft[0] - 25, m.gravBotLeft[1] + 28,
    false, [`背部舖透水層(頂${m.t_grav_top}/底${m.t_grav_bot}cm)及不織布`]
  );
  const ptBaseMid = m.uvToWorld(0.75 * m.W_bot_gab, -0.5 * m.t_base);
  drawLeader(
    ptBaseMid[0], ptBaseMid[1],
    ptBaseMid[0] + 38, ptBaseMid[1] - 18,
    true, [`混凝土基礎台 (t=${m.t_base}cm, α=${m.alpha_deg}°)`]
  );

  // 7. 斷面圖分層退縮尺寸標註 (頂部 B1 精準標註單一最外箱籠寬度，若有多籠則同時標出頂層後籠寬)
  if (OPT.dims) {
    const yTopDim = Math.max(m.slopeCapPt[1], topBox.ptFrontTop[1]) + 24;
    // 若頂層有多於 1 顆箱籠，標出後側箱籠與最外側箱籠 B1
    if (topBox.nCells > 1) {
      drawHorizDim(topBox.ptBackTop[0], topBox.ptBackTop[1], topBox.ptFrontCellBackTop[0], topBox.ptFrontCellBackTop[1], yTopDim, `${topBox.nCells - 1}×B1=${((topBox.nCells - 1) * m.B1).toFixed(0)}`);
    }
    drawHorizDim(topBox.ptFrontCellBackTop[0], topBox.ptFrontCellBackTop[1], topBox.ptFrontTop[0], topBox.ptFrontTop[1], yTopDim, `B1=${m.B1}`);

    if (m.N_layer >= 2) {
      const belowTop = m.layersInfo[m.N_layer - 2];
      drawHorizDim(topBox.ptFrontTop[0], topBox.ptFrontTop[1], belowTop.ptFrontTop[0], belowTop.ptFrontTop[1], yTopDim, `B2=${m.B2}`);
    }
    drawHorizDim(m.gravTopLeft[0], m.gravTopLeft[1], topBox.ptBackTop[0], topBox.ptBackTop[1], yTopDim, `透水層頂 ${m.t_grav_top}`);

    // 左側標註單層高 H1、總高 H 與基礎台厚 t
    const xLeftDim1 = m.horizCapLeftPt[0] - 25;
    const xLeftDim2 = xLeftDim1 - 30;
    drawVertDim(topBox.ptBackBot[0], topBox.ptBackBot[1], topBox.ptBackTop[0], topBox.ptBackTop[1], xLeftDim1, `H1=${m.H1}`);
    drawVertDim(0, 0, m.uvToWorld(0, -m.t_base)[0], m.uvToWorld(0, -m.t_base)[1], xLeftDim1, `t=${m.t_base}`);
    drawVertDim(0, 0, topBox.ptBackTop[0], topBox.ptBackTop[1], xLeftDim2, `箱籠總高 H=${m.H_total}`);

    // 底部標註基礎台寬度 B 與透水層底寬
    const yBotBase = Math.min(m.uvToWorld(0, -(m.t_base + m.R1 + m.t_pc))[1], m.ptBaseFrontBot[1]);
    const yDimBot1 = yBotBase - 28;
    const yDimBot2 = yBotBase - 54;
    drawHorizDim(m.gravBotLeft[0], m.gravBotLeft[1], 0, 0, yDimBot1, `透水層底 ${m.t_grav_bot}`);
    drawHorizDim(m.uvToWorld(m.uBaseL, -m.t_base)[0], m.uvToWorld(m.uBaseL, -m.t_base)[1], m.ptBaseFrontBot[0], m.ptBaseFrontBot[1], yDimBot1, `基礎台寬 B=${m.B_base}`);

    if (m.R1 > 0) {
      const pKeyL = m.uvToWorld(m.uKeyBotL, -(m.t_base + m.R1));
      const pKeyR = m.uvToWorld(m.uKeyBotR, -(m.t_base + m.R1));
      drawHorizDim(pKeyL[0], pKeyL[1], pKeyR[0], pKeyR[1], yDimBot2, `止滑榫 P1=${m.P1}, R1=${m.R1}`);
    }

    // 右側標註沖刷深度 df 與 0.2~0.5df
    const xRightDim = xBedEnd + 15;
    drawVertDim(xBedEnd, m.y_scour, xBedEnd, m.y_bed, xRightDim, `df=${m.df}`);
    drawVertDim(xBedEnd, m.ptBaseFrontBot[1], xBedEnd, m.y_scour, xRightDim, `${m.k_df.toFixed(2)}df=${m.d_extra.toFixed(1)}`);
  }

  // 斷面圖註記與標題
  const ySecNote = Math.min(m.uvToWorld(0, -(m.t_base + m.R1 + m.t_pc))[1], m.ptBaseFrontBot[1]) - 82;
  drawWorldText(40, ySecNote, '註：箱籠之組立造型應依設計需求而定，可採對稱型或單側階梯型。', 8.5, '#fbbf24', 'center', 'middle');
  drawWorldText(40, ySecNote - 18, '箱 籠 護 岸 斷 面 圖', 14.5, '#38bdf8', 'center', 'middle');
  drawWorldLine(-55, ySecNote - 28, 135, ySecNote - 28, '#38bdf8', 2.0);

  // --------------------------------------------------------------------------
  // B. 左下副視區：【護岸表層箱籠放大示意圖 (Surface Gabion Detail View)】(對應原圖視埠 4877)
  // --------------------------------------------------------------------------
  const detX = -110;
  const detY = ySecNote - 220;
  const detW = 140;
  const detH = 140;
  const detStoneBelt = 28;

  const detOuter = [[detX, detY], [detX + detW, detY], [detX + detW, detY + detH], [detX, detY + detH]];
  drawWorldPoly(detOuter, '#facc15', 2.2, 'rgba(30, 41, 59, 0.55)', true);

  const xSep = detX + detW - detStoneBelt;
  const ySep = detY + detH - detStoneBelt;
  drawWorldLine(detX, ySep, xSep, ySep, '#f8fafc', 1.3);
  drawWorldLine(detX, ySep + 2.2, xSep + 2.2, ySep + 2.2, '#f8fafc', 1.3);
  drawWorldLine(xSep, detY, xSep, ySep, '#f8fafc', 1.3);
  drawWorldLine(xSep + 2.2, detY, xSep + 2.2, ySep + 2.2, '#f8fafc', 1.3);

  if (OPT.hatch) {
    for (let k = 0; k < 6; k++) {
      const shape = DXF_STONE_SHAPES[k % DXF_STONE_SHAPES.length];
      const sw = (detW - 4) / 6;
      const sh = detStoneBelt - 4;
      const cx = detX + 2 + (k + 0.5) * sw;
      const cy = ySep + 2 + 0.5 * sh;
      const sPoly = shape.map(uv => [cx + uv[0] * sw * 0.92, cy + uv[1] * sh * 0.90]);
      drawWorldPoly(sPoly, '#fb923c', 1.5, 'rgba(251, 146, 60, 0.25)', true);
    }
    for (let k = 0; k < 5; k++) {
      const shape = DXF_STONE_SHAPES[(k + 3) % DXF_STONE_SHAPES.length];
      const sw = detStoneBelt - 4;
      const sh = (detH - detStoneBelt - 2) / 5;
      const cx = xSep + 2 + 0.5 * sw;
      const cy = detY + 2 + (k + 0.5) * sh;
      const sPoly = shape.map(uv => [cx + uv[0] * sw * 0.90, cy + uv[1] * sh * 0.92]);
      drawWorldPoly(sPoly, '#fb923c', 1.5, 'rgba(251, 146, 60, 0.25)', true);
    }
    const innerPolys = generateDxfStonePolysInRect(detX + 6, detY + 6, xSep - 6, ySep - 6, 20.0, 77);
    innerPolys.forEach(p => drawWorldPoly(p, '#d946ef', 1.1, 'rgba(217, 70, 239, 0.12)', true));
  }

  drawWorldPoly([[detX - 3, detY + detH], [detX - 3, detY - 3], [detX + detW, detY - 3]], '#ef4444', 1.8, null, false, [6, 4]);

  drawLeader(detX + detW * 0.65, detY + detH, detX + detW * 0.45, detY + detH + 18, false, ['箱籠格網']);
  drawLeader(detX + detW - 10, detY + detH * 0.55, detX + detW + 18, detY + detH * 0.72, true, ['外表面舖設較大石材', '(22~35cm佔80%)']);
  drawLeader(detX + 18, detY + detH * 0.52, detX - 18, detY + detH * 0.52, false, ['級配料或礫石土', '(如當地石材不足，內部可以礫石土填充)']);
  drawLeader(detX + detW * 0.55, detY - 3, detX + detW * 0.42, detY - 20, false, ['地工不織布']);

  drawWorldText(detX + detW * 0.5, detY - 42, '護 岸 表 層 箱 籠 示 意 圖', 13.5, '#38bdf8', 'center', 'middle');
  drawWorldLine(detX - 10, detY - 51, detX + detW + 10, detY - 51, '#38bdf8', 1.8);

  // --------------------------------------------------------------------------
  // C. 右下區：【正視 (立面) 圖 (Front Elevation View)】(上下籠身錯縫 + DXF塊石 + 六角格網)
  // --------------------------------------------------------------------------
  const xElevL = Math.max(420, xBedEnd + 130);
  const xElevR = xElevL + m.L_unit;

  const yElevBaseTop = 0;
  const yElevBaseBot = -m.t_base;
  drawWorldPoly([
    [xElevL, yElevBaseBot],
    [xElevR, yElevBaseBot],
    [xElevR, yElevBaseTop],
    [xElevL, yElevBaseTop]
  ], '#facc15', 2.0, 'rgba(148, 163, 184, 0.16)', true);

  if (m.R1 > 0) {
    drawWorldPoly([
      [xElevL, yElevBaseBot],
      [xElevR, yElevBaseBot],
      [xElevR, -(m.t_base + m.R1)],
      [xElevL, -(m.t_base + m.R1)]
    ], '#facc15', 1.4, 'rgba(250, 204, 21, 0.08)', true, [6, 4]);
  }
  if (m.t_pc > 0) {
    drawWorldPoly([
      [xElevL - m.w_pc, yElevBaseBot],
      [xElevR + m.w_pc, yElevBaseBot],
      [xElevR + m.w_pc, yElevBaseBot - m.t_pc],
      [xElevL - m.w_pc, yElevBaseBot - m.t_pc]
    ], '#22c55e', 1.5, 'rgba(34, 197, 94, 0.14)', true);
  }

  for (let r = 0; r < m.N_layer; r++) {
    const y1 = r * m.H1;
    const y2 = (r + 1) * m.H1;
    const staggerOffset = (r % 2 === 1) ? 0.5 * m.L_gab : 0;
    const nSegs = Math.ceil(m.L_unit / m.L_gab) + 1;

    for (let k = -1; k < nSegs; k++) {
      const gx1 = Math.max(xElevL, xElevL + k * m.L_gab + staggerOffset);
      const gx2 = Math.min(xElevR, xElevL + (k + 1) * m.L_gab + staggerOffset);
      if (gx2 - gx1 < 8) continue;

      const cellPoly = [[gx1, y1], [gx2, y1], [gx2, y2], [gx1, y2]];
      if (OPT.hatch) {
        const stonePolys = generateDxfStonePolysInRect(gx1 + 3, y1 + 3, gx2 - 3, y2 - 3, Math.max(22, m.H1 * 0.28), r * 100 + k * 17 + 5);
        stonePolys.forEach(sp => drawWorldPoly(sp, '#eab308', 1.1, 'rgba(250, 204, 21, 0.13)', true));
        drawDxfHoneyMeshRegion(cellPoly, Math.max(8, m.H1 * 0.12), 'rgba(56, 189, 248, 0.32)');
      }
      drawWorldPoly(cellPoly, '#facc15', 2.0, null, true);
    }
  }

  drawWorldLine(xElevL - 15, m.y_bed, xElevR + 15, m.y_bed, '#facc15', 1.6, [10, 5]);
  drawWorldLine(xElevL - 15, m.y_scour, xElevR + 15, m.y_scour, '#38bdf8', 1.2, [6, 4]);
  drawWorldText(xElevR + 20, m.y_bed, `河床基準線`, 8.5, '#facc15', 'left', 'middle');
  drawWorldText(xElevR + 20, m.y_scour, `預期沖刷線 (-df=${m.df}cm)`, 8.5, '#38bdf8', 'left', 'middle');

  if (OPT.dims) {
    drawHorizDim(xElevL, m.H_total, Math.min(xElevR, xElevL + m.L_gab), m.H_total, m.H_total + 25, `單籠長 L_gab=${m.L_gab}`);
    drawHorizDim(xElevL, -(m.t_base + m.R1 + m.t_pc), xElevR, -(m.t_base + m.R1 + m.t_pc), -(m.t_base + m.R1 + m.t_pc) - 35, `單一分段標準長度 L_unit = ${m.L_unit} cm (${m.Lm.toFixed(1)} m)`);
  }

  drawWorldText(0.5 * (xElevL + xElevR), ySecNote - 18, '箱 籠 護 岸 正 視 (立 面) 圖 (上下籠身交錯接縫 & DXF塊石填塞)', 14.5, '#38bdf8', 'center', 'middle');
  drawWorldLine(0.5 * (xElevL + xElevR) - 230, ySecNote - 28, 0.5 * (xElevL + xElevR) + 230, ySecNote - 28, '#38bdf8', 2.0);

  // --------------------------------------------------------------------------
  // D. 右上區：【平面圖 (Plan View)】
  // --------------------------------------------------------------------------
  const yPlanToe = m.H_total + 110;
  let curYPlan = yPlanToe;

  for (let r = 0; r < m.N_layer; r++) {
    const isTopLayer = (r === m.N_layer - 1);
    const bandW = isTopLayer ? m.layersInfo[r].wLayer : Math.max(15, m.B2);
    const yBand1 = curYPlan;
    const yBand2 = curYPlan + bandW;
    const staggerOffset = (r % 2 === 1) ? 0.5 * m.L_gab : 0;
    const nSegs = Math.ceil(m.L_unit / m.L_gab) + 1;

    for (let k = -1; k < nSegs; k++) {
      const gx1 = Math.max(xElevL, xElevL + k * m.L_gab + staggerOffset);
      const gx2 = Math.min(xElevR, xElevL + (k + 1) * m.L_gab + staggerOffset);
      if (gx2 - gx1 < 8) continue;
      const cellPoly = [[gx1, yBand1], [gx2, yBand1], [gx2, yBand2], [gx1, yBand2]];
      if (OPT.hatch) {
        const sPolys = generateDxfStonePolysInRect(gx1 + 3, yBand1 + 3, gx2 - 3, yBand2 - 3, Math.max(20, bandW * 0.42), r * 70 + k * 13 + 9);
        sPolys.forEach(sp => drawWorldPoly(sp, '#eab308', 1.0, 'rgba(250, 204, 21, 0.14)', true));
        drawDxfHoneyMeshRegion(cellPoly, Math.max(8, m.B1 * 0.11), 'rgba(56, 189, 248, 0.28)');
      }
      drawWorldPoly(cellPoly, '#facc15', 1.8, null, true);
    }
    curYPlan = yBand2;
  }

  const yPlanGravTop = curYPlan + m.t_grav_top;
  const planGravPoly = [[xElevL, curYPlan], [xElevR, curYPlan], [xElevR, yPlanGravTop], [xElevL, yPlanGravTop]];
  if (OPT.hatch) {
    drawDxfGravelRegion(planGravPoly, Math.max(25, m.B1 * 0.45), '#c084fc');
  }
  drawWorldPoly(planGravPoly, '#c084fc', 1.4, 'rgba(192, 132, 252, 0.10)', true);
  drawWorldLine(xElevL, curYPlan, xElevR, curYPlan, '#ef4444', 1.8, [7, 4]);

  if (OPT.dims) {
    const xPlanDim = xElevR + 35;
    drawVertDim(xElevR, yPlanToe, xElevR, curYPlan, xPlanDim, `箱籠水平投影寬`);
    drawVertDim(xElevR, curYPlan, xElevR, yPlanGravTop, xPlanDim + 28, `透水層頂寬 ${m.t_grav_top}`);
  }

  drawWorldText(0.5 * (xElevL + xElevR), yPlanToe - 26, '箱 籠 護 岸 平 面 圖', 14.5, '#38bdf8', 'center', 'middle');
  drawWorldLine(0.5 * (xElevL + xElevR) - 105, yPlanToe - 36, 0.5 * (xElevL + xElevR) + 105, yPlanToe - 36, '#38bdf8', 2.0);

  // --------------------------------------------------------------------------
  // E. 最下方區：【圖面內建工程數量計算式表 (On-Canvas & DXF Table)】
  // --------------------------------------------------------------------------
  const tblX = -150;
  const tblYTop = detY - 85;
  const colWidths = [60, 355, 70, 540, 140, 140, 360];
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
    `箱籠護岸 (圖號 0403-1) 工程數量計算式表 【單元長 L=${m.Lm.toFixed(1)}m，層數=${m.N_layer}層，總高 H=${(m.H_total/100).toFixed(2)}m，基礎台 B=${(m.B_base/100).toFixed(2)}m×t=${(m.t_base/100).toFixed(2)}m】`,
    11.0, '#f8fafc', 'center', 'middle'
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
    drawWorldText(cx + 10, rMid, q.formula, 8.6, '#fbbf24', 'left', 'middle'); cx += colWidths[3];
    drawWorldText(cx + colWidths[4] - 12, rMid, q.perM.toFixed(3), 9.0, '#38bdf8', 'right', 'middle'); cx += colWidths[4];
    drawWorldText(cx + colWidths[5] - 12, rMid, q.total.toFixed(2), 9.5, '#4ade80', 'right', 'middle'); cx += colWidths[5];
    drawWorldText(cx + 10, rMid, q.note, 8.4, '#94a3b8', 'left', 'middle');
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
return { model(R) { RR = R; try { return computeModel(); } finally { RR = null; } }, prims, SEL: {'sel_step_type': 'sym', 'sel_exc_mode': 'full', 'sel_rebar_main': 'NONE', 'sel_rebar_sub': 'D13'} };
})();
TCO_T['s406'] = (function () {   // 水保標準圖 0406-1 三明治砌石護岸
const CNS560_REBAR = {
  NONE: { d: 0, unitW: 0 },
  D10: { d: 0.953, unitW: 0.560 },
  D13: { d: 1.270, unitW: 0.995 },
  D16: { d: 1.590, unitW: 1.560 },
  D19: { d: 1.910, unitW: 2.250 },
  D22: { d: 2.220, unitW: 3.040 }
};

// 原圖 DXF 塊石正規化頂點 ([-0.5,0.5]x[-0.5,0.5])
const DXF_STONE_SHAPES = [
  [[0.056, -0.465], [0.418, -0.340], [0.500, 0.066], [0.193, 0.500], [-0.411, 0.453], [-0.500, -0.016], [-0.325, -0.422], [0.056, -0.465]],
  [[-0.098, -0.500], [0.397, -0.385], [0.500, 0.125], [0.309, 0.500], [-0.409, 0.420], [-0.500, 0.053], [-0.358, -0.346], [-0.098, -0.500]],
  [[-0.180, -0.500], [0.464, -0.273], [0.500, -0.015], [0.381, 0.440], [0.059, 0.500], [-0.399, 0.394], [-0.500, -0.197], [-0.180, -0.500]],
  [[-0.091, -0.500], [0.390, -0.373], [0.500, 0.167], [0.352, 0.484], [-0.369, 0.500], [-0.500, 0.087], [-0.351, -0.326], [-0.091, -0.500]],
  [[-0.141, -0.500], [0.411, -0.414], [0.500, 0.086], [0.291, 0.500], [-0.306, 0.500], [-0.500, 0.000], [-0.410, -0.431], [-0.141, -0.500]],
  [[-0.294, -0.500], [0.406, -0.318], [0.500, 0.045], [0.409, 0.500], [-0.368, 0.409], [-0.500, 0.136], [-0.409, -0.300], [-0.294, -0.500]],
  [[-0.055, -0.500], [0.437, -0.421], [0.500, 0.119], [0.369, 0.500], [-0.221, 0.468], [-0.500, 0.214], [-0.434, -0.294], [-0.055, -0.500]],
  [[-0.038, -0.500], [0.395, -0.399], [0.500, -0.095], [0.360, 0.500], [-0.241, 0.487], [-0.500, 0.064], [-0.365, -0.348], [-0.038, -0.500]]
];

// 原圖 AutoCAD GRAVEL 剖面線 41 段晶格定義 ([0,1]x[0,1])
const GRAVEL_TILE_SEGS = [
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

// 原圖 4-06.dxf 基準幾何線
const ORIG_0406_CM = {
  base: [[125.92, 0.0], [0.0, 0.0], [-114.32, -75.57], [-114.17, -420.0], [125.92, -420.0]],
  stonePoly: [[0.0, 0.0], [-334.86, 607.54], [-412.09, 608.56], [-56.20, -37.15]],
  midConcPoly: [[-56.20, -37.15], [-412.09, 608.56], [-466.84, 609.29], [-114.32, -75.57]],
  gravelPoly: [[-114.32, -75.57], [-466.84, 609.29], [-529.46, 633.25], [-114.23, -290.79]]
};

// ============================================================================
// 2. 視角與狀態管理 (鎖定視角鐵律：修改參數絕不重設 camX/camY/scale)
// ============================================================================

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
function polygonArea(pts) {
  if (!pts || pts.length < 3) return 0;
  let a = 0;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    a += (pts[j][0] + pts[i][0]) * (pts[j][1] - pts[i][1]);
  }
  return Math.abs(a) * 0.5;
}
function face_area_m_str(slopeLen_m, Lm) {
  return `${slopeLen_m.toFixed(2)}*${Lm.toFixed(1)}`;
}
function buildSectionHexStonePolys(m) {
  const slopeLen = m.H_wall * m.slopeFactor;
  const tx = -m.n_slope / m.slopeFactor;
  const ty = 1.0 / m.slopeFactor;
  const nx = m.nx;
  const ny = m.ny;
  const uvToW = (u, v) => [u * tx + v * nx, u * ty + v * ny];

  // 將砌石層厚度方向排設 2~3 排六角梅花交錯塊石，形成與正視圖完全一致的 5/6 圍砌圖案
  const nCols = Math.max(2, Math.round(m.t_stone / 20.0));
  const dv = (m.t_stone - 3.0) / nCols;
  const du = Math.max(20.0, dv * 1.18);
  const nRows = Math.ceil((slopeLen + 15) / du);
  const items = [];

  for (let r = 0; r < nRows; r++) {
    const isOdd = (r % 2 === 1);
    const colsInR = isOdd ? nCols : nCols;
    for (let c = 0; c < colsInR; c++) {
      const seed = r * 31 + c * 17 + 11;
      let vC = 1.5 + (c + (isOdd ? 0.65 : 0.35)) * dv;
      let uC = (r + (isOdd ? 0.75 : 0.25)) * du - 4.0;
      vC = Math.max(dv * 0.45, Math.min(m.t_stone - dv * 0.45, vC));

      const rv = dv * 0.46;
      const ru = du * 0.46;
      const shape = DXF_STONE_SHAPES[seed % DXF_STONE_SHAPES.length];
      const flip = (seed % 2 === 0) ? 1 : -1;
      const rot = (seededRand(seed + 5) - 0.5) * 0.32;
      const cosR = Math.cos(rot), sinR = Math.sin(rot);

      const poly = shape.map(uv => {
        const pu = uv[0] * flip * ru * 1.85;
        const pv = uv[1] * rv * 1.85;
        const uPt = uC + (pu * cosR - pv * sinR);
        const vPt = Math.max(1.8, Math.min(m.t_stone - 1.8, vC + (pu * sinR + pv * cosR)));
        return uvToW(uPt, vPt);
      });

      // 檢查塊石中心點是否位於砌石層 Y 範圍 (yStoneBot ~ H_wall) 內
      const centerW = uvToW(uC, vC);
      if (centerW[1] <= m.H_wall - 4.0 && centerW[1] >= m.ptStoneBackBot[1] + 4.0) {
        items.push({ poly, isMain: ((r + c) % 2 === 0), isPin: false });
      }
    }
  }

  // 三石孔隙嵌塞小間石
  for (let r = 0; r < nRows - 1; r++) {
    const uPin = (r + 0.75) * du - 4.0;
    const vPin = 0.5 * m.t_stone;
    const centerW = uvToW(uPin, vPin);
    if (centerW[1] <= m.H_wall - 8.0 && centerW[1] >= 6.0) {
      const shape = DXF_STONE_SHAPES[(r * 7 + 3) % DXF_STONE_SHAPES.length];
      const pinPoly = shape.map(uv => uvToW(uPin + uv[0] * du * 0.25, vPin + uv[1] * dv * 0.25));
      items.push({ poly: pinPoly, isMain: false, isPin: true });
    }
  }

  return items;
}
function generateHexSurroundingStonesInRect(x1, y1, x2, y2, stonePitchX = 42.0, seedBase = 7) {
  const minX = Math.min(x1, x2), maxX = Math.max(x1, x2);
  const minY = Math.min(y1, y2), maxY = Math.max(y1, y2);
  const w = maxX - minX;
  const h = maxY - minY;
  const nCols = Math.max(3, Math.round(w / stonePitchX));
  const dx = w / nCols;
  const dy = dx * 0.78;
  const nRows = Math.max(2, Math.round(h / dy));
  const rowStep = h / nRows;
  const polys = [];

  for (let r = 0; r < nRows; r++) {
    const isOddRow = (r % 2 === 1);
    const colsInRow = isOddRow ? nCols + 1 : nCols;
    for (let c = 0; c < colsInRow; c++) {
      const seed = (r * 31 + c * 17 + seedBase);
      let cx = minX + (c + (isOddRow ? 0.0 : 0.5)) * dx;
      let cy = minY + (r + 0.5) * rowStep;

      const jx = (seededRand(seed + 1) - 0.5) * dx * 0.14;
      const jy = (seededRand(seed + 2) - 0.5) * rowStep * 0.14;
      cx += jx;
      cy += jy;

      let rx = dx * (0.48 + (seededRand(seed + 3) - 0.5) * 0.08);
      let ry = rowStep * (0.52 + (seededRand(seed + 4) - 0.5) * 0.08);

      const shape = DXF_STONE_SHAPES[seed % DXF_STONE_SHAPES.length];
      const flipX = (seed % 2 === 0) ? 1 : -1;
      const rot = (seededRand(seed + 5) - 0.5) * 0.38;
      const cosR = Math.cos(rot), sinR = Math.sin(rot);

      const poly = [];
      shape.forEach(uv => {
        let px = uv[0] * flipX * rx * 1.92;
        let py = uv[1] * ry * 1.88;
        let wx = cx + (px * cosR - py * sinR);
        let wy = cy + (px * sinR + py * cosR);
        wx = Math.max(minX + 2.5, Math.min(maxX - 2.5, wx));
        wy = Math.max(minY + 2.5, Math.min(maxY - 2.5, wy));
        poly.push([wx, wy]);
      });

      if (polygonArea(poly) > (dx * rowStep * 0.12)) {
        polys.push({ poly, isMain: ((r % 2 === 1) && (c % 2 === 1)) });
      }
    }
  }

  for (let r = 0; r < nRows - 1; r++) {
    const isOddRow = (r % 2 === 1);
    for (let c = 0; c < nCols; c++) {
      if ((r + c) % 2 !== 0) continue;
      const cx = minX + (c + (isOddRow ? 0.5 : 0.0)) * dx;
      const cy = minY + (r + 1.0) * rowStep;
      if (cx > minX + 12 && cx < maxX - 12 && cy > minY + 10 && cy < maxY - 10) {
        const shape = DXF_STONE_SHAPES[(r * 7 + c * 13) % DXF_STONE_SHAPES.length];
        const pinPoly = shape.map(uv => [
          cx + uv[0] * dx * 0.24,
          cy + uv[1] * rowStep * 0.24
        ]);
        polys.push({ poly: pinPoly, isPin: true });
      }
    }
  }
  return polys;
}
function generateStaggeredPlanStonesInRect(x1, y1, x2, y2, stoneSizeNom = 34.0, seedBase = 19) {
  const minX = Math.min(x1, x2), maxX = Math.max(x1, x2);
  const minY = Math.min(y1, y2), maxY = Math.max(y1, y2);
  const w = maxX - minX;
  const h = maxY - minY;
  const nCols = Math.max(3, Math.round(w / stoneSizeNom));
  const nRows = Math.max(2, Math.round(h / (stoneSizeNom * 0.65)));
  const cw = w / nCols;
  const ch = h / nRows;
  const polys = [];

  for (let r = 0; r < nRows; r++) {
    const isOdd = (r % 2 === 1);
    const totalC = isOdd ? nCols + 1 : nCols;
    for (let c = 0; c < totalC; c++) {
      const seed = r * 19 + c * 11 + seedBase;
      const shape = DXF_STONE_SHAPES[seed % DXF_STONE_SHAPES.length];
      const flipX = ((r + c) % 2 === 0) ? 1 : -1;
      const xm = minX + (c + (isOdd ? 0.0 : 0.5)) * cw;
      const ym = minY + (r + 0.5) * ch;
      const poly = shape.map(uv => {
        let wx = xm + uv[0] * flipX * cw * 0.88;
        let wy = ym + uv[1] * ch * 0.85;
        wx = Math.max(minX + 2.0, Math.min(maxX - 2.0, wx));
        wy = Math.max(minY + 1.8, Math.min(maxY - 1.8, wy));
        return [wx, wy];
      });
      if (polygonArea(poly) > cw * ch * 0.14) {
        polys.push(poly);
      }
    }
  }
  return polys;
}

let RR = null;
const getNum = (id, fb) => tcoIn(RR, id, fb);
function computeModel() {
  const H_wall = Math.max(80, getNum('inp_H_wall', 300));
  const n_slope = Math.max(0.15, getNum('inp_n_slope', 0.55));
  const t_stone = Math.max(15, getNum('inp_t_stone', 45));
  const t_mid_conc = Math.max(10, getNum('inp_t_mid_conc', 20));
  const t_grav_top = Math.max(0, getNum('inp_t_grav_top', 20));
  const t_grav_bot = Math.max(0, getNum('inp_t_grav_bot', 20));
  const S_weep = Math.max(80, getNum('inp_S_weep', 200));
  const has_filter_box = tcoSel(RR, 'sel_filter_box', 'YES') === 'YES';
  const L_unit = Math.max(200, getNum('inp_L_unit', 1000));

  const B_base = Math.max(80, getNum('inp_B_base', 160));
  const B_front = Math.max(15, Math.min(B_base * 0.80, getNum('inp_B_front', 100)));
  const H_base = Math.max(40, getNum('inp_H_base', 120));
  const D_embed = Math.max(20, getNum('inp_D_embed', 80));

  const rebar_main_key = tcoSel(RR, 'sel_rebar_main', 'D16');
  const rebar_sub_key = tcoSel(RR, 'sel_rebar_sub', 'D13');
  const S_rebar = Math.max(10, getNum('inp_S_rebar', 20));

  const R1 = Math.max(0, getNum('inp_R1', 0));
  const P1 = Math.max(15, getNum('inp_P1', 30));
  const t_pc = Math.max(0, getNum('inp_t_pc', 10));
  const w_pc = t_pc > 0 ? Math.max(0, getNum('inp_w_pc', 10)) : 0;
  const exc_mode = tcoSel(RR, 'sel_exc_mode', 'full');

  const dxWall = n_slope * H_wall;
  const slopeFactor = Math.sqrt(1 + n_slope * n_slope);
  const nx = -1.0 / slopeFactor;
  const ny = -n_slope / slopeFactor;

  const w_stone_h = t_stone * slopeFactor;
  const w_mid_h = t_mid_conc * slopeFactor;
  const w_grav_top_h = t_grav_top * slopeFactor;
  const w_grav_bot_h = t_grav_bot * slopeFactor;

  const B_back = B_base - B_front;
  const ptFrontToe = [0, 0];
  const ptFrontTop = [-dxWall, H_wall];

  // 第 1 層 (外層混凝土砌塊/卵石)
  const ptStoneBackTop = [-dxWall - w_stone_h, H_wall];
  const ptStoneBackBot = [nx * t_stone, ny * t_stone];
  const stoneLayerPoly = [ptFrontToe, ptFrontTop, ptStoneBackTop, ptStoneBackBot];

  // 第 2 層 (中層 20cm厚 210kg/cm² 混凝土)
  const ptMidBackTop = [-dxWall - w_stone_h - w_mid_h, H_wall];
  const yShoulder = ny * (t_stone + t_mid_conc) * 1.15;
  const ptMidBackBot = [-B_back, yShoulder];
  const midConcPoly = [ptStoneBackBot, ptStoneBackTop, ptMidBackTop, ptMidBackBot];

  // 第 3 層 (內層 背填卵礫石或級配，順時針封閉環防止自交)
  const ptGravBackTop = [ptMidBackTop[0] - w_grav_top_h, H_wall];
  const yGravBot = Math.max(-H_base + 18, yShoulder - H_base * 0.42);
  const ptGravBackBot = [-B_back - w_grav_bot_h, yGravBot];
  const gravelPoly = (t_grav_top > 0 || t_grav_bot > 0)
    ? [ptMidBackBot, ptMidBackTop, ptGravBackTop, ptGravBackBot, [-B_back, yGravBot]]
    : [];

  // 底部五邊形混凝土基礎座多邊形 (含選配底部 1:3 梯形止滑榫)
  const keySlopeW = R1 / 3.0;
  const keyTopW = R1 > 0 ? (P1 + 2 * keySlopeW) : 0;
  let X_key = Math.max(0, Math.min(getNum('inp_X_key', 40), Math.max(0, B_base - keyTopW)));
  const xBaseR = B_front;
  const xBaseL = -B_back;
  const xKeyTopR = xBaseR - X_key;
  const xKeyTopL = xKeyTopR - keyTopW;
  const xKeyBotR = xKeyTopR - keySlopeW;
  const xKeyBotL = xKeyTopL + keySlopeW;

  const basePoly = [
    [xBaseR, 0],
    [0, 0],
    ptStoneBackBot,
    ptMidBackBot,
    [xBaseL, -H_base]
  ];
  if (R1 > 0) {
    basePoly.push(
      [xKeyTopL, -H_base],
      [xKeyBotL, -(H_base + R1)],
      [xKeyBotR, -(H_base + R1)],
      [xKeyTopR, -H_base]
    );
  }
  basePoly.push([xBaseR, -H_base]);

  // 基礎與中層混凝土 CNS 560 鋼筋幾何座標與長度推算
  const c_base = 7.5;
  const baseStirrupPts = [
    [xBaseR - c_base, -c_base],
    [0, -c_base],
    [ptMidBackBot[0] + c_base, ptMidBackBot[1] - c_base * 0.6],
    [xBaseL + c_base, -H_base + c_base],
    [xBaseR - c_base, -H_base + c_base]
  ];
  const midSlopeRebarPts = [
    [0.5 * (ptStoneBackTop[0] + ptMidBackTop[0]), H_wall - 6.0],
    [0.5 * (ptStoneBackBot[0] + ptMidBackBot[0]), 0.5 * (ptStoneBackBot[1] + ptMidBackBot[1])],
    [ptMidBackBot[0] + 18, -H_base + c_base + 4.0],
    [ptMidBackBot[0] + 48, -H_base + c_base + 4.0]
  ];
  const keyRebarPts = R1 > 0 ? [
    [Math.max(xBaseL + c_base, xKeyTopL - 25), -c_base - 2],
    [xKeyTopL + 3, -H_base + c_base],
    [xKeyBotL + 3, -(H_base + R1) + c_base],
    [xKeyBotR - 3, -(H_base + R1) + c_base],
    [xKeyTopR - 3, -H_base + c_base],
    [Math.min(xBaseR - c_base, xKeyTopR + 25), -c_base - 2]
  ] : [];

  const rebarDots = [];
  if (rebar_main_key !== 'NONE') {
    const nBotDots = Math.max(3, Math.floor((B_base - 2 * c_base) / S_rebar) + 1);
    for (let i = 0; i < nBotDots; i++) {
      const rx = xBaseL + c_base + (i / Math.max(1, nBotDots - 1)) * (B_base - 2 * c_base);
      rebarDots.push([rx, -H_base + c_base + 2.2]);
    }
    const nTopFrontDots = Math.max(2, Math.floor((B_front - c_base) / S_rebar) + 1);
    for (let i = 0; i < nTopFrontDots; i++) {
      const rx = (i / Math.max(1, nTopFrontDots - 1)) * (B_front - c_base);
      rebarDots.push([rx, -c_base - 2.2]);
    }
    const nVertDots = Math.max(2, Math.floor((H_base - 2 * c_base) / S_rebar) - 1);
    for (let i = 1; i <= nVertDots; i++) {
      const ry = -c_base - (i / (nVertDots + 1)) * (H_base - 2 * c_base);
      rebarDots.push([xBaseR - c_base - 2.2, ry]);
      if (ry < ptMidBackBot[1] - c_base) {
        rebarDots.push([xBaseL + c_base + 2.2, ry]);
      }
    }
    const nSlopeDots = Math.max(4, Math.floor((H_wall * slopeFactor) / S_rebar));
    for (let i = 1; i <= nSlopeDots; i++) {
      const r = i / (nSlopeDots + 1);
      const sx = (1 - r) * midSlopeRebarPts[1][0] + r * midSlopeRebarPts[0][0];
      const sy = (1 - r) * midSlopeRebarPts[1][1] + r * midSlopeRebarPts[0][1];
      rebarDots.push([sx + 2.0, sy]);
    }
    if (R1 > 0) {
      rebarDots.push(
        [xKeyBotL + 4, -(H_base + R1) + c_base + 2.2],
        [xKeyBotR - 4, -(H_base + R1) + c_base + 2.2],
        [0.5 * (xKeyTopL + xKeyBotL) + 3, -(H_base + 0.5 * R1)],
        [0.5 * (xKeyTopR + xKeyBotR) - 3, -(H_base + 0.5 * R1)]
      );
    }
  }

  const y_bed = -H_base + D_embed;
  const y_water = H_wall * 0.76;

  const excPolyPts = [
    [xBaseR + 25, y_bed],
    [xBaseR, -H_base - R1 - t_pc],
    [xBaseL - w_grav_bot_h, -H_base - R1 - t_pc],
    ptGravBackBot,
    ptGravBackTop
  ];

  const weepPipes = [0.22, 0.72].map(r => {
    const wyOut = r * H_wall;
    const wxOut = -n_slope * wyOut;
    const totalThickH = w_stone_h + w_mid_h + 0.5 * (w_grav_top_h + w_grav_bot_h);
    const wxIn = wxOut - totalThickH;
    const wyIn = wyOut + totalThickH * 0.10;
    return { wxOut, wyOut, wxIn, wyIn };
  });

  const B_pc = t_pc > 0 ? (B_base + 2 * w_pc) : 0;

  // 工程數量計算 (100% 對應圖面標註尺寸)
  const Lm = L_unit / 100.0;
  const H_wall_m = H_wall / 100.0;
  const w_stone_m = w_stone_h / 100.0;
  const w_mid_m = w_mid_h / 100.0;
  const slopeLen_m = (H_wall * slopeFactor) / 100.0;

  const area_stone = polygonArea(stoneLayerPoly) / 10000.0;
  const vol_stone_unit = area_stone * Lm;
  const f_stone = `${w_stone_m.toFixed(2)} * ${H_wall_m.toFixed(2)} * ${Lm.toFixed(1)} (法線厚${t_stone}cm, 五六圍砌)`;

  const area_mid = polygonArea(midConcPoly) / 10000.0;
  const vol_mid_unit = area_mid * Lm;
  const f_mid = `${w_mid_m.toFixed(2)} * ${H_wall_m.toFixed(2)} * ${Lm.toFixed(1)} (厚${t_mid_conc}cm)`;

  const tg_top_m = t_grav_top / 100.0;
  const tg_bot_m = t_grav_bot / 100.0;
  const len_grav_m = Math.hypot(ptGravBackTop[0] - ptGravBackBot[0], ptGravBackTop[1] - ptGravBackBot[1]) / 100.0;
  const area_grav = polygonArea(gravelPoly) / 10000.0;
  const vol_grav_unit = area_grav * Lm;
  const f_grav = `((${tg_top_m.toFixed(2)}+${tg_bot_m.toFixed(2)})/2) * ${len_grav_m.toFixed(2)} * ${Lm.toFixed(1)} (斷面${area_grav.toFixed(2)}m²)`;

  const area_base = polygonArea(basePoly) / 10000.0;
  const vol_base_unit = area_base * Lm;
  const f_base = `五邊形基礎斷面積 ${area_base.toFixed(2)} m² * ${Lm.toFixed(1)}m (寬${(B_base/100).toFixed(2)}*深${(H_base/100).toFixed(2)}m)`;

  const face_area_unit = slopeLen_m * Lm;
  const n_weeps = Math.max(4, Math.ceil(face_area_unit / 2.0));
  const single_weep_len_m = (w_stone_h + w_mid_h + 15) / 100.0;
  const tot_weep_len_m = n_weeps * single_weep_len_m;
  const f_weep = `ceil(${face_area_m_str(slopeLen_m, Lm)} / 2.0m²) = ${n_weeps}支 * ${single_weep_len_m.toFixed(2)}m`;

  const D_emb_m = D_embed / 100.0;
  const B_base_m = B_base / 100.0;
  let area_exc = 0;
  let f_exc = '';
  if (exc_mode === 'full') {
    area_exc = area_stone + area_mid + area_grav + area_base;
    f_exc = `(${area_stone.toFixed(2)} + ${area_mid.toFixed(2)} + ${area_grav.toFixed(2)} + ${area_base.toFixed(2)}) * ${Lm.toFixed(1)}`;
  } else {
    area_exc = (B_base_m + 0.3 * D_emb_m) * D_emb_m;
    f_exc = `(${B_base_m.toFixed(2)} + 0.3*${D_emb_m.toFixed(2)}) * ${D_emb_m.toFixed(2)} * ${Lm.toFixed(1)}`;
  }

  const area_joint = area_stone + area_mid + area_base;

  const quantities = [
    { id: '1', name: `第1層(外層)：臨水面混凝土砌塊(卵)石 (厚${t_stone}cm)`, unit: 'm³', formula: f_stone, perM: area_stone, total: vol_stone_unit, note: `斷面與正視皆採五六圍砌，平面交錯疊砌` },
    { id: '2', name: `第2層(中層)：${t_mid_conc}cm厚 210 kgf/cm² 混凝土襯砌`, unit: 'm³', formula: f_mid, perM: area_mid, total: vol_mid_unit, note: `三明治夾心混凝土層 (fc'≥210 kgf/cm²)` },
    { id: '3', name: `第3層(內層)：背填卵礫石或級配 (頂${t_grav_top}/底${t_grav_bot}cm)`, unit: 'm³', formula: f_grav, perM: area_grav, total: vol_grav_unit, note: `原圖規範 10~25cm 厚背填卵礫石或級配` },
    { id: '4', name: `底部五邊形 210 kgf/cm² 混凝土基礎座`, unit: 'm³', formula: f_base, perM: area_base, total: vol_base_unit, note: `基礎總寬 B=${B_base}cm, 總深 H_base=${H_base}cm` }
  ];

  let totalRebarKg = 0;
  if (rebar_main_key !== 'NONE') {
    const mainSpec = CNS560_REBAR[rebar_main_key];
    const subSpec = CNS560_REBAR[rebar_sub_key];
    const n_sets = Math.floor(L_unit / S_rebar) + 1;
    let len_stirrup_cm = 0;
    for (let i = 0; i < baseStirrupPts.length; i++) {
      const p1 = baseStirrupPts[i];
      const p2 = baseStirrupPts[(i + 1) % baseStirrupPts.length];
      len_stirrup_cm += Math.hypot(p2[0] - p1[0], p2[1] - p1[1]);
    }
    len_stirrup_cm += 24;
    let len_slope_cm = 0;
    for (let i = 0; i < midSlopeRebarPts.length - 1; i++) {
      len_slope_cm += Math.hypot(midSlopeRebarPts[i+1][0] - midSlopeRebarPts[i][0], midSlopeRebarPts[i+1][1] - midSlopeRebarPts[i][1]);
    }
    let len_key_cm = 0;
    for (let i = 0; i < keyRebarPts.length - 1; i++) {
      len_key_cm += Math.hypot(keyRebarPts[i+1][0] - keyRebarPts[i][0], keyRebarPts[i+1][1] - keyRebarPts[i][1]);
    }
    const single_main_m = (len_stirrup_cm + len_slope_cm + len_key_cm) / 100.0;
    const w_main_kg = n_sets * single_main_m * mainSpec.unitW;
    const n_dots = rebarDots.length;
    const w_sub_kg = n_dots * Lm * subSpec.unitW;
    totalRebarKg = w_main_kg + w_sub_kg;

    quantities.push({
      id: String(quantities.length + 1),
      name: `五邊形基礎座與斜牆竹節鋼筋 (主筋${rebar_main_key}/副筋${rebar_sub_key}@${S_rebar}cm)`,
      unit: 'kg',
      formula: `主筋${rebar_main_key}:${n_sets}組*${single_main_m.toFixed(2)}m*${mainSpec.unitW} + 副筋${rebar_sub_key}:${n_dots}支*${Lm.toFixed(1)}m*${subSpec.unitW}`,
      perM: totalRebarKg / Lm,
      total: totalRebarKg,
      note: `主筋單組長 ${single_main_m.toFixed(2)}m，副筋圓點共 ${n_dots} 支`
    });
  }

  quantities.push(
    { id: String(quantities.length + 1), name: `∮3" PVC-B 排水管 (@2m² 梅花型交錯，外斜1:10)`, unit: 'm', formula: f_weep, perM: tot_weep_len_m / Lm, total: tot_weep_len_m, note: `共 ${n_weeps} 支${has_filter_box ? ' (附10×24cm薄型透水濾層盒)' : ''}` },
    { id: String(quantities.length + 1), name: `結構土石方開挖`, unit: 'm³', formula: f_exc, perM: area_exc, total: area_exc * Lm, note: `河床面下埋深 D_embed=${D_embed}cm (規範≥60cm)` },
    { id: String(quantities.length + 1), name: `1.5cm 垂直伸縮縫兼施工縫及外露面 3cm 倒角處理`, unit: 'm²', formula: `斷面總和 (${area_stone.toFixed(2)}+${area_mid.toFixed(2)}+${area_base.toFixed(2)}) * (${Lm.toFixed(0)}m/10m)`, perM: area_joint / 10.0, total: area_joint * (Lm / 10.0), note: `每隔 10m 設一道 1.5cm 伸縮縫；外露面 3cm 倒角` }
  );

  if (t_pc > 0) {
    const area_pc = ((B_pc - keyTopW) / 100.0) * (t_pc / 100.0);
    quantities.push({
      id: String(quantities.length + 1),
      name: '分段水平 PC 打底混凝土',
      unit: 'm³',
      formula: `(${(B_pc/100).toFixed(2)} - ${(keyTopW/100).toFixed(2)}) * ${(t_pc/100).toFixed(2)} * ${Lm.toFixed(1)}`,
      perM: area_pc,
      total: area_pc * Lm,
      note: `厚 t_pc=${t_pc}cm (外推 w_pc=${w_pc}cm)`
    });
  }

  return {
    H_wall, n_slope, dxWall, slopeFactor, nx, ny, t_stone, t_mid_conc, t_grav_top, t_grav_bot,
    w_stone_h, w_mid_h, w_grav_top_h, w_grav_bot_h,
    S_weep, has_filter_box, L_unit, Lm,
    B_base, B_front, B_back, H_base, D_embed, yShoulder, yGravBot,
    X_key, R1, P1, keySlopeW, keyTopW, t_pc, w_pc, B_pc,
    xBaseR, xBaseL, xKeyTopL, xKeyTopR, xKeyBotL, xKeyBotR,
    ptFrontToe, ptFrontTop, ptStoneBackTop, ptStoneBackBot, ptMidBackTop, ptMidBackBot, ptGravBackTop, ptGravBackBot,
    stoneLayerPoly, midConcPoly, gravelPoly, basePoly, excPolyPts,
    y_bed, y_water, weepPipes, n_weeps,
    rebar_main_key, rebar_sub_key, S_rebar, baseStirrupPts, midSlopeRebarPts, keyRebarPts, rebarDots, totalRebarKg,
    quantities
  };
}

function prims(m, OPT, part) {
  OPT = Object.assign({ hatch: true, dims: true }, OPT || {}); const O = [];
  const drawWorldLine = (x1, y1, x2, y2, color = '#ffffff', lineWidth = 1.5, dash = []) => O.push({ k: 'L', p: [[x1, y1], [x2, y2]], c: color, w: lineWidth, d: dash });
  const drawWorldPoly = (pts, strokeColor = '#ffffff', lineWidth = 1.5, fillColor = null, close = true, dash = []) => { if (pts && pts.length >= 2) O.push({ k: 'P', p: pts.map(q => [q[0], q[1]]), c: strokeColor, w: lineWidth, f: fillColor, cl: close, d: dash }); };
  const drawWorldCircle = (wx, wy, rWorld, strokeColor = '#ffffff', fillColor = null, lineWidth = 1.2) => O.push({ k: 'C', x: wx, y: wy, r: rWorld, c: strokeColor, f: fillColor, w: lineWidth });
  const drawWorldText = (wx, wy, text, heightWorld = 10, color = '#ffffff', align = 'center', baseline = 'middle', rotRad = 0) => O.push({ k: 'T', x: wx, y: wy, s: String(text), h: heightWorld, c: color, al: align, bl: baseline, rot: rotRad });
  const drawDxfGravelRegion = (outerPoly, tileSizeWorld = 36.0, strokeColor = '#c084fc') => { if (outerPoly && outerPoly.length >= 3) O.push({ k: 'G', outer: outerPoly, holes: [], tile: tileSizeWorld, c: strokeColor, segs: GRAVEL_TILE_SEGS }); };
function getDimExtensionCoords(coordObj, dimPos) {
  const minGapFromObj = 9.5;
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
  drawWorldText(xm, yDim + offsetT, text, 8.2, '#f8fafc', 'center', 'middle');
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
  drawWorldText(xDim + offsetT, ym, text, 8.2, '#f8fafc', 'center', 'middle', Math.PI / 2);
}
function drawLeader(xTip, yTip, xKnee, yKnee, dirRight, textLines, lineCol = '#ef4444', txtCol = '#f8fafc', isDot = true) {
  const shelfLen = 68 * (dirRight ? 1 : -1);
  drawWorldLine(xTip, yTip, xKnee, yKnee, lineCol, 1.2);
  drawWorldLine(xKnee, yKnee, xKnee + shelfLen, yKnee, lineCol, 1.2);
  if (isDot) {
    drawWorldCircle(xTip, yTip, 2.2, lineCol, lineCol);
  } else {
    const dx = xKnee - xTip, dy = yKnee - yTip;
    const len = Math.hypot(dx, dy) || 1;
    const ux = dx / len, uy = dy / len;
    const px = -uy, py = ux;
    const arr = 6.0;
    drawWorldPoly([
      [xTip, yTip],
      [xTip + ux * arr + px * arr * 0.32, yTip + uy * arr + py * arr * 0.32],
      [xTip + ux * arr - px * arr * 0.32, yTip + uy * arr - py * arr * 0.32]
    ], lineCol, 1, lineCol, true);
  }
  const tx = xKnee + (dirRight ? 6 : -6);
  const align = dirRight ? 'left' : 'right';
  textLines.forEach((line, idx) => {
    drawWorldText(tx, yKnee + 6 - idx * 12.0, line, 8.2, txtCol, align, 'middle');
  });
}

  if (part === 'sec') {
// A. 左下區：【混凝土砌石護岸(三明治式) 斷面圖】
    // ------------------------------------------------------------------------
    // 1. 第 3 層 (最內側)：背填卵礫石或級配層
    if (m.gravelPoly.length >= 3) {
      if (OPT.hatch) {
        drawDxfGravelRegion(m.gravelPoly, 36.0, '#c084fc');
      }
      drawWorldPoly(m.gravelPoly, '#c084fc', 1.6, 'rgba(192, 132, 252, 0.10)', true);
    }

    // 2. 第 2 層 (中間夾心層)：20cm 厚 210 kgf/cm² 混凝土襯砌層
    drawWorldPoly(m.midConcPoly, '#38bdf8', 1.8, 'rgba(56, 189, 248, 0.14)', true);
    if (OPT.hatch) {
      const nSand = Math.max(18, Math.floor(m.H_wall / 12));
      for (let s = 0; s < nSand; s++) {
        const ratio = (s + 0.5) / nSand;
        const xm = (1 - ratio) * 0.5 * (m.ptStoneBackBot[0] + m.ptMidBackBot[0]) + ratio * 0.5 * (m.ptStoneBackTop[0] + m.ptMidBackTop[0]);
        const ym = (1 - ratio) * 0.5 * (m.ptStoneBackBot[1] + m.ptMidBackBot[1]) + ratio * m.H_wall;
        const jitter = (seededRand(s * 17 + 3) - 0.5) * m.t_mid_conc * 0.45;
        drawWorldCircle(xm + jitter, ym, 0.9, '#38bdf8', '#38bdf8');
      }
    }

    // 3. 第 1 層 (最外側臨水面)：混凝土砌塊(卵)石層 — 使用 Canvas 原生 ctx.clip() + 立面圖同款五六圍砌塊石！
    drawWorldPoly(m.stoneLayerPoly, '#facc15', 2.0, 'rgba(250, 204, 21, 0.06)', true);
    if (OPT.hatch) {
      O.push({ k: 'CB', p: m.stoneLayerPoly });

      const secHexStones = buildSectionHexStonePolys(m);
      secHexStones.forEach(item => {
        if (item.isPin) {
          drawWorldPoly(item.poly, '#f59e0b', 1.0, 'rgba(245, 158, 11, 0.28)', true);
        } else if (item.isMain) {
          drawWorldPoly(item.poly, '#fb923c', 1.35, 'rgba(251, 146, 60, 0.25)', true);
        } else {
          drawWorldPoly(item.poly, '#ea580c', 1.15, 'rgba(234, 88, 12, 0.18)', true);
        }
      });
      O.push({ k: 'CE' });
      drawWorldPoly(m.stoneLayerPoly, '#facc15', 2.0, null, true);
    }

    // 4. 底部五邊形 210 kgf/cm² 混凝土基礎座 + 分段水平 PC 打底 + CNS 560 鋼筋
    drawWorldPoly(m.basePoly, '#facc15', 2.2, 'rgba(148, 163, 184, 0.20)', true);
    if (OPT.hatch) {
      for (let k = 0; k < 14; k++) {
        const rx = m.xBaseL + 15 + seededRand(k * 23 + 5) * (m.B_base - 30);
        const ry = -18 - seededRand(k * 31 + 9) * (m.H_base - 32);
        const rTri = 3.5;
        drawWorldPoly([[rx - rTri, ry - rTri * 0.6], [rx + rTri, ry - rTri * 0.4], [rx, ry + rTri]], '#94a3b8', 1.0, null, true);
        drawWorldCircle(rx + 4.5, ry, 1.0, '#94a3b8', '#94a3b8');
      }
    }

    if (m.t_pc > 0) {
      const xPcL = m.xBaseL - m.w_pc;
      const xPcR = m.xBaseR + m.w_pc;
      const yPcTop = -m.H_base;
      const yPcBot = -(m.H_base + m.t_pc);
      if (m.R1 > 0) {
        if (m.xKeyTopL > xPcL) {
          drawWorldPoly([[xPcL, yPcTop], [m.xKeyTopL, yPcTop], [m.xKeyTopL + m.t_pc / 3, yPcBot], [xPcL, yPcBot]], '#22c55e', 1.6, 'rgba(34, 197, 94, 0.16)', true);
        }
        if (xPcR > m.xKeyTopR) {
          drawWorldPoly([[m.xKeyTopR, yPcTop], [xPcR, yPcTop], [xPcR, yPcBot], [m.xKeyTopR - m.t_pc / 3, yPcBot]], '#22c55e', 1.6, 'rgba(34, 197, 94, 0.16)', true);
        }
      } else {
        drawWorldPoly([[xPcL, yPcTop], [xPcR, yPcTop], [xPcR, yPcBot], [xPcL, yPcBot]], '#22c55e', 1.6, 'rgba(34, 197, 94, 0.16)', true);
      }
    }

    // 繪製五邊形基礎座閉合主筋 + 中層斜牆錨定主筋 + 止滑榫V筋 + 縱向水平副筋紅圓點
    if (m.rebar_main_key !== 'NONE') {
      drawWorldPoly(m.baseStirrupPts, '#ef4444', 2.0, null, true);
      drawWorldPoly(m.midSlopeRebarPts, '#ef4444', 1.8, null, false);
      if (m.keyRebarPts.length > 0) {
        drawWorldPoly(m.keyRebarPts, '#ef4444', 1.8, null, false);
      }
      m.rebarDots.forEach(pt => {
        drawWorldCircle(pt[0], pt[1], 2.1, '#ef4444', '#ef4444');
      });
    }

    // 5. 雙層 ∮3" PVC-B 排水管 + 薄型獨立濾層盒 (10×24cm)
    m.weepPipes.forEach(wp => {
      drawWorldLine(wp.wxIn, wp.wyIn + 3.8, wp.wxOut, wp.wyOut + 3.8, '#3b82f6', 1.3, [5, 3]);
      drawWorldLine(wp.wxIn, wp.wyIn - 3.8, wp.wxOut, wp.wyOut - 3.8, '#3b82f6', 1.3, [5, 3]);
      if (m.has_filter_box) {
        drawWorldPoly([
          [wp.wxIn - 10, wp.wyIn - 12],
          [wp.wxIn, wp.wyIn - 12],
          [wp.wxIn, wp.wyIn + 12],
          [wp.wxIn - 10, wp.wyIn + 12]
        ], '#22c55e', 1.3, 'rgba(34, 197, 94, 0.22)', true);
      }
    });

    
    return O;
  }


    // ------------------------------------------------------------------------
    // A. 左下區：【混凝土砌石護岸(三明治式) 斷面圖】
    // ------------------------------------------------------------------------
    // 1. 第 3 層 (最內側)：背填卵礫石或級配層
    if (m.gravelPoly.length >= 3) {
      if (OPT.hatch) {
        drawDxfGravelRegion(m.gravelPoly, 36.0, '#c084fc');
      }
      drawWorldPoly(m.gravelPoly, '#c084fc', 1.6, 'rgba(192, 132, 252, 0.10)', true);
    }

    // 2. 第 2 層 (中間夾心層)：20cm 厚 210 kgf/cm² 混凝土襯砌層
    drawWorldPoly(m.midConcPoly, '#38bdf8', 1.8, 'rgba(56, 189, 248, 0.14)', true);
    if (OPT.hatch) {
      const nSand = Math.max(18, Math.floor(m.H_wall / 12));
      for (let s = 0; s < nSand; s++) {
        const ratio = (s + 0.5) / nSand;
        const xm = (1 - ratio) * 0.5 * (m.ptStoneBackBot[0] + m.ptMidBackBot[0]) + ratio * 0.5 * (m.ptStoneBackTop[0] + m.ptMidBackTop[0]);
        const ym = (1 - ratio) * 0.5 * (m.ptStoneBackBot[1] + m.ptMidBackBot[1]) + ratio * m.H_wall;
        const jitter = (seededRand(s * 17 + 3) - 0.5) * m.t_mid_conc * 0.45;
        drawWorldCircle(xm + jitter, ym, 0.9, '#38bdf8', '#38bdf8');
      }
    }

    // 3. 第 1 層 (最外側臨水面)：混凝土砌塊(卵)石層 — 使用 Canvas 原生 ctx.clip() + 立面圖同款五六圍砌塊石！
    drawWorldPoly(m.stoneLayerPoly, '#facc15', 2.0, 'rgba(250, 204, 21, 0.06)', true);
    if (OPT.hatch) {
      O.push({ k: 'CB', p: m.stoneLayerPoly });

      const secHexStones = buildSectionHexStonePolys(m);
      secHexStones.forEach(item => {
        if (item.isPin) {
          drawWorldPoly(item.poly, '#f59e0b', 1.0, 'rgba(245, 158, 11, 0.28)', true);
        } else if (item.isMain) {
          drawWorldPoly(item.poly, '#fb923c', 1.35, 'rgba(251, 146, 60, 0.25)', true);
        } else {
          drawWorldPoly(item.poly, '#ea580c', 1.15, 'rgba(234, 88, 12, 0.18)', true);
        }
      });
      O.push({ k: 'CE' });
      drawWorldPoly(m.stoneLayerPoly, '#facc15', 2.0, null, true);
    }

    // 4. 底部五邊形 210 kgf/cm² 混凝土基礎座 + 分段水平 PC 打底 + CNS 560 鋼筋
    drawWorldPoly(m.basePoly, '#facc15', 2.2, 'rgba(148, 163, 184, 0.20)', true);
    if (OPT.hatch) {
      for (let k = 0; k < 14; k++) {
        const rx = m.xBaseL + 15 + seededRand(k * 23 + 5) * (m.B_base - 30);
        const ry = -18 - seededRand(k * 31 + 9) * (m.H_base - 32);
        const rTri = 3.5;
        drawWorldPoly([[rx - rTri, ry - rTri * 0.6], [rx + rTri, ry - rTri * 0.4], [rx, ry + rTri]], '#94a3b8', 1.0, null, true);
        drawWorldCircle(rx + 4.5, ry, 1.0, '#94a3b8', '#94a3b8');
      }
    }

    if (m.t_pc > 0) {
      const xPcL = m.xBaseL - m.w_pc;
      const xPcR = m.xBaseR + m.w_pc;
      const yPcTop = -m.H_base;
      const yPcBot = -(m.H_base + m.t_pc);
      if (m.R1 > 0) {
        if (m.xKeyTopL > xPcL) {
          drawWorldPoly([[xPcL, yPcTop], [m.xKeyTopL, yPcTop], [m.xKeyTopL + m.t_pc / 3, yPcBot], [xPcL, yPcBot]], '#22c55e', 1.6, 'rgba(34, 197, 94, 0.16)', true);
        }
        if (xPcR > m.xKeyTopR) {
          drawWorldPoly([[m.xKeyTopR, yPcTop], [xPcR, yPcTop], [xPcR, yPcBot], [m.xKeyTopR - m.t_pc / 3, yPcBot]], '#22c55e', 1.6, 'rgba(34, 197, 94, 0.16)', true);
        }
      } else {
        drawWorldPoly([[xPcL, yPcTop], [xPcR, yPcTop], [xPcR, yPcBot], [xPcL, yPcBot]], '#22c55e', 1.6, 'rgba(34, 197, 94, 0.16)', true);
      }
    }

    // 繪製五邊形基礎座閉合主筋 + 中層斜牆錨定主筋 + 止滑榫V筋 + 縱向水平副筋紅圓點
    if (m.rebar_main_key !== 'NONE') {
      drawWorldPoly(m.baseStirrupPts, '#ef4444', 2.0, null, true);
      drawWorldPoly(m.midSlopeRebarPts, '#ef4444', 1.8, null, false);
      if (m.keyRebarPts.length > 0) {
        drawWorldPoly(m.keyRebarPts, '#ef4444', 1.8, null, false);
      }
      m.rebarDots.forEach(pt => {
        drawWorldCircle(pt[0], pt[1], 2.1, '#ef4444', '#ef4444');
      });
    }

    // 5. 雙層 ∮3" PVC-B 排水管 + 薄型獨立濾層盒 (10×24cm)
    m.weepPipes.forEach(wp => {
      drawWorldLine(wp.wxIn, wp.wyIn + 3.8, wp.wxOut, wp.wyOut + 3.8, '#3b82f6', 1.3, [5, 3]);
      drawWorldLine(wp.wxIn, wp.wyIn - 3.8, wp.wxOut, wp.wyOut - 3.8, '#3b82f6', 1.3, [5, 3]);
      if (m.has_filter_box) {
        drawWorldPoly([
          [wp.wxIn - 10, wp.wyIn - 12],
          [wp.wxIn, wp.wyIn - 12],
          [wp.wxIn, wp.wyIn + 12],
          [wp.wxIn - 10, wp.wyIn + 12]
        ], '#22c55e', 1.3, 'rgba(34, 197, 94, 0.22)', true);
      }
    });

    // 6. 標準開挖虛線 (HIDDEN)、河床水平基準線、設計洪水位線與坡度符號 1:n
    drawWorldPoly(m.excPolyPts, '#f8fafc', 1.3, null, false, [8, 5]);
    const xBedEnd = m.xBaseR + 185;
    drawWorldLine(m.xBaseR, m.y_bed, xBedEnd, m.y_bed, '#facc15', 1.8);
    drawWorldText(xBedEnd - 45, m.y_bed + 9, '河床水平基準線', 8.0, '#facc15', 'center', 'middle');

    const xWaterStart = -m.n_slope * m.y_water;
    drawWorldLine(xWaterStart, m.y_water, xBedEnd, m.y_water, '#38bdf8', 1.4);
    const xTri = xBedEnd - 35;
    drawWorldPoly([[xTri, m.y_water], [xTri + 5, m.y_water + 8.5], [xTri - 5, m.y_water + 8.5]], '#38bdf8', 1.3, null, true);
    drawWorldLine(xTri - 8, m.y_water - 4, xTri + 8, m.y_water - 4, '#38bdf8', 1.1);
    drawWorldLine(xTri - 4, m.y_water - 8, xTri + 4, m.y_water - 8, '#38bdf8', 1.1);

    const ySlopeSym = m.H_wall * 0.58;
    const xSlopeSym = -m.n_slope * ySlopeSym + 24;
    const symH = 26;
    const symW = symH * m.n_slope;
    drawWorldPoly([[xSlopeSym, ySlopeSym], [xSlopeSym - symW, ySlopeSym + symH], [xSlopeSym, ySlopeSym + symH]], '#94a3b8', 1.3, null, true);
    drawWorldText(xSlopeSym + 7, ySlopeSym + 0.5 * symH, '1', 8.2, '#f8fafc', 'left', 'middle');
    drawWorldText(xSlopeSym - 0.5 * symW, ySlopeSym + symH + 8, `n=${m.n_slope.toFixed(2)}`, 8.2, '#f8fafc', 'center', 'middle');

    // 7. 原圖 0406-1 基準比對線疊加
    if (false) {
      drawWorldPoly(ORIG_0406_CM.base, '#f472b6', 1.6, null, true, [5, 4]);
      drawWorldPoly(ORIG_0406_CM.stonePoly, '#f472b6', 1.6, null, true, [5, 4]);
      drawWorldPoly(ORIG_0406_CM.midConcPoly, '#f472b6', 1.6, null, true, [5, 4]);
      drawWorldPoly(ORIG_0406_CM.gravelPoly, '#f472b6', 1.6, null, true, [5, 4]);
    }

    // 8. 原圖全數引線標註完整還原
    const rTopLead = 0.72;
    drawLeader(
      -m.dxWall * rTopLead - m.w_stone_h * 0.4, m.H_wall * rTopLead,
      30, m.H_wall * 0.68,
      true, [`混凝土砌石 (厚${m.t_stone}cm, 五六圍砌)`], '#ef4444', '#f8fafc', true
    );
    drawLeader(
      -m.dxWall * 0.80 - m.w_stone_h - m.w_mid_h * 0.5, m.H_wall * 0.80,
      18, m.H_wall * 0.92,
      true, [`${m.t_mid_conc}cm厚210kg/cm²混凝土`], '#ef4444', '#f8fafc', true
    );
    drawLeader(
      m.ptGravBackTop[0] + 10, m.H_wall * 0.88,
      -5, m.H_wall + 42,
      true, [`10~25cm厚背填卵礫石或級配 (頂${m.t_grav_top}/底${m.t_grav_bot}cm)`], '#ef4444', '#f8fafc', true
    );
    if (m.weepPipes.length > 0) {
      const wp0 = m.weepPipes[0];
      drawLeader(
        wp0.wxOut - 8, wp0.wyOut,
        55, wp0.wyOut + 32,
        true, [`∮3"PVC-B管@2m² (外斜1:10)`], '#ef4444', '#f8fafc', false
      );
    }
    drawLeader(
      m.xBaseR * 0.45, -m.H_base * 0.48,
      75, -m.H_base * 0.65,
      true, [`210kg/cm²混凝土基礎座 (${m.rebar_main_key !== 'NONE' ? `配筋${m.rebar_main_key}/${m.rebar_sub_key}` : '無筋'})`], '#ef4444', '#f8fafc', false
    );
    drawLeader(
      m.ptGravBackBot[0], m.ptGravBackBot[1] + 15,
      m.ptGravBackBot[0] - 36, m.ptGravBackBot[1] - 12,
      false, [`開挖線`], '#ef4444', '#f8fafc', false
    );

    // 9. 分層退縮尺寸標註
    if (OPT.dims) {
      const yTopDim1 = m.H_wall + 24;
      const yTopDim2 = m.H_wall + 48;
      drawHorizDim(m.ptGravBackTop[0], m.ptGravBackTop[1], m.ptMidBackTop[0], m.ptMidBackTop[1], yTopDim2, `礫石頂 ${m.t_grav_top}`);
      drawHorizDim(m.ptMidBackTop[0], m.ptMidBackTop[1], m.ptStoneBackTop[0], m.ptStoneBackTop[1], yTopDim1, `混凝土 ${m.t_mid_conc}`);
      drawHorizDim(m.ptStoneBackTop[0], m.ptStoneBackTop[1], m.ptFrontTop[0], m.ptFrontTop[1], yTopDim2, `砌石 ${m.t_stone}`);

      const xLeftDim = Math.min(m.ptGravBackTop[0], m.ptGravBackBot[0]) - 38;
      drawVertDim(m.ptFrontToe[0], 0, m.ptFrontTop[0], m.H_wall, xLeftDim, `牆高 H_wall=${m.H_wall}`);
      drawVertDim(m.xBaseL, -m.H_base, m.ptFrontToe[0], 0, xLeftDim, `基礎深 H_base=${m.H_base}`);

      const yBotBase = -(m.H_base + m.R1 + m.t_pc);
      if (m.t_grav_bot > 0) {
        drawHorizDim(m.ptGravBackBot[0], m.ptGravBackBot[1], m.xBaseL, yBotBase, yBotBase - 25, `礫石底 ${m.t_grav_bot}`);
      }
      drawHorizDim(m.xBaseL, yBotBase, 0, 0, yBotBase - 25, `後斜肩寬 ${m.B_back}`);
      drawHorizDim(0, 0, m.xBaseR, yBotBase, yBotBase - 25, `前承台 ${m.B_front}`);
      drawHorizDim(m.xBaseL, yBotBase, m.xBaseR, yBotBase, yBotBase - 50, `基礎總寬 B_base=${m.B_base}`);

      if (m.t_pc > 0) {
        drawHorizDim(m.xBaseL - m.w_pc, yBotBase, m.xBaseR + m.w_pc, yBotBase, yBotBase - 75, `PC打底總寬 B_pc=${m.B_pc}`);
      }

      drawVertDim(xBedEnd, -m.H_base, xBedEnd, m.y_bed, xBedEnd + 18, `埋深 D_embed=${m.D_embed}`);
    }

    const ySecNote = -(m.H_base + m.R1 + m.t_pc) - 102;
    drawWorldText(-60, ySecNote, '混凝土砌石護岸(三明治式)剖面圖', 14.0, '#d946ef', 'center', 'middle');
    drawWorldLine(-175, ySecNote - 9, 55, ySecNote - 9, '#d946ef', 1.8);
    drawWorldText(-60, ySecNote - 24, '註:本工程所有外露面皆以3cm倒角處理.', 9.0, '#fbbf24', 'center', 'middle');

    // ------------------------------------------------------------------------
    // B. 右下區：【正視 (立面) 圖 (Front Elevation View)】(5或6圍1 梅花蜂巢圍砌 + 伸縮縫 + 排水孔)
    // ------------------------------------------------------------------------
    const xElevL = Math.max(360, xBedEnd + 110);
    const xElevR = xElevL + m.L_unit;

    drawWorldPoly([[xElevL, -m.H_base], [xElevR, -m.H_base], [xElevR, 0], [xElevL, 0]], '#facc15', 2.0, 'rgba(148, 163, 184, 0.18)', true);
    if (m.R1 > 0) {
      drawWorldPoly([[xElevL, -m.H_base], [xElevR, -m.H_base], [xElevR, -(m.H_base + m.R1)], [xElevL, -(m.H_base + m.R1)]], '#facc15', 1.4, null, true, [6, 4]);
    }
    if (m.t_pc > 0) {
      drawWorldPoly([[xElevL - m.w_pc, -m.H_base], [xElevR + m.w_pc, -m.H_base], [xElevR + m.w_pc, -(m.H_base + m.t_pc)], [xElevL - m.w_pc, -(m.H_base + m.t_pc)]], '#22c55e', 1.5, 'rgba(34, 197, 94, 0.14)', true);
    }

    drawWorldPoly([[xElevL, 0], [xElevR, 0], [xElevR, m.H_wall], [xElevL, m.H_wall]], '#facc15', 2.2, 'rgba(250, 204, 21, 0.05)', true);
    if (OPT.hatch) {
      const hexStones = generateHexSurroundingStonesInRect(xElevL, 0, xElevR, m.H_wall, 44.0, 7);
      hexStones.forEach(item => {
        if (item.isPin) {
          drawWorldPoly(item.poly, '#f59e0b', 1.0, 'rgba(245, 158, 11, 0.25)', true);
        } else if (item.isMain) {
          drawWorldPoly(item.poly, '#fb923c', 1.35, 'rgba(251, 146, 60, 0.24)', true);
        } else {
          drawWorldPoly(item.poly, '#ea580c', 1.15, 'rgba(234, 88, 12, 0.16)', true);
        }
      });
    }

    for (let xJ = xElevL; xJ <= xElevR; xJ += 1000) {
      drawWorldLine(xJ - 0.75, -m.H_base, xJ - 0.75, m.H_wall, '#ef4444', 1.5);
      drawWorldLine(xJ + 0.75, -m.H_base, xJ + 0.75, m.H_wall, '#ef4444', 1.5);
    }

    const nColsWeep = Math.max(3, Math.floor(m.L_unit / m.S_weep));
    const stepXWeep = m.L_unit / nColsWeep;
    m.weepPipes.forEach((wp, rIdx) => {
      for (let c = 0; c < nColsWeep; c++) {
        const shift = (rIdx % 2 === 1) ? 0.5 * stepXWeep : 0;
        const wx = xElevL + (c + 0.35) * stepXWeep + shift;
        if (wx > xElevL + 15 && wx < xElevR - 15) {
          drawWorldCircle(wx, wp.wyOut, 4.2, '#38bdf8', '#090d16', 1.8);
        }
      }
    });

    drawWorldLine(xElevL - 15, m.y_bed, xElevR + 15, m.y_bed, '#facc15', 1.6, [10, 5]);
    drawWorldLine(xElevL - 15, m.y_water, xElevR + 15, m.y_water, '#38bdf8', 1.3, [6, 4]);

    if (OPT.dims) {
      drawHorizDim(xElevL, -(m.H_base + m.R1 + m.t_pc), xElevR, -(m.H_base + m.R1 + m.t_pc), -(m.H_base + m.R1 + m.t_pc) - 32, `單一分段標準長度 L_unit = ${m.L_unit} cm (${m.Lm.toFixed(1)}m，兩端設 1.5cm 伸縮縫)`);
    }

    drawWorldText(0.5 * (xElevL + xElevR), ySecNote, '三 明 治 砌 石 護 岸 正 視 (立 面) 圖 (5或6圍1 梅花圍砌)', 14.0, '#38bdf8', 'center', 'middle');
    drawWorldLine(0.5 * (xElevL + xElevR) - 210, ySecNote - 9, 0.5 * (xElevL + xElevR) + 210, ySecNote - 9, '#38bdf8', 1.8);

    // ------------------------------------------------------------------------
    // C. 右上區：【平面圖 (Plan View)】(坡頂塊石採奇偶排交錯疊砌)
    // ------------------------------------------------------------------------
    const yPlanBaseToe = m.H_wall + 100;
    const yPlanSlopeToe = yPlanBaseToe + m.B_front;
    const yPlanSlopeTop = yPlanSlopeToe + m.dxWall;
    const yPlanStoneBack = yPlanSlopeTop + m.w_stone_h;
    const yPlanMidBack = yPlanStoneBack + m.w_mid_h;
    const yPlanGravBack = yPlanMidBack + m.w_grav_top_h;

    drawWorldPoly([[xElevL, yPlanBaseToe], [xElevR, yPlanBaseToe], [xElevR, yPlanSlopeToe], [xElevL, yPlanSlopeToe]], '#facc15', 1.8, 'rgba(148, 163, 184, 0.16)', true);

    drawWorldPoly([[xElevL, yPlanSlopeToe], [xElevR, yPlanSlopeToe], [xElevR, yPlanSlopeTop], [xElevL, yPlanSlopeTop]], '#facc15', 1.8, 'rgba(250, 204, 21, 0.06)', true);
    const nTicks = Math.max(10, Math.floor(m.L_unit / 45));
    for (let i = 1; i < nTicks; i++) {
      const tx = xElevL + (i / nTicks) * m.L_unit;
      const isLong = (i % 2 === 0);
      const tyEnd = yPlanSlopeTop - (isLong ? 0.75 : 0.38) * m.dxWall;
      drawWorldLine(tx, yPlanSlopeTop, tx, tyEnd, '#94a3b8', 1.0);
    }

    drawWorldPoly([[xElevL, yPlanSlopeTop], [xElevR, yPlanSlopeTop], [xElevR, yPlanStoneBack], [xElevL, yPlanStoneBack]], '#fb923c', 1.8, 'rgba(251, 146, 60, 0.14)', true);
    if (OPT.hatch) {
      const topStones = generateStaggeredPlanStonesInRect(xElevL, yPlanSlopeTop, xElevR, yPlanStoneBack, Math.max(28, m.w_stone_h * 0.70), 19);
      topStones.forEach(sp => drawWorldPoly(sp, '#fb923c', 1.1, 'rgba(251, 146, 60, 0.22)', true));
    }

    drawWorldPoly([[xElevL, yPlanStoneBack], [xElevR, yPlanStoneBack], [xElevR, yPlanMidBack], [xElevL, yPlanMidBack]], '#38bdf8', 1.8, 'rgba(56, 189, 248, 0.18)', true);

    if (m.t_grav_top > 0) {
      const planGravPoly = [[xElevL, yPlanMidBack], [xElevR, yPlanMidBack], [xElevR, yPlanGravBack], [xElevL, yPlanGravBack]];
      if (OPT.hatch) {
        drawDxfGravelRegion(planGravPoly, 32.0, '#c084fc');
      }
      drawWorldPoly(planGravPoly, '#c084fc', 1.5, 'rgba(192, 132, 252, 0.12)', true);
    }

    if (OPT.dims) {
      drawVertDim(xElevR, yPlanBaseToe, xElevR, yPlanGravBack, xElevR + 32, `平面總寬 ${(yPlanGravBack - yPlanBaseToe).toFixed(1)}`);
    }

    drawWorldText(0.5 * (xElevL + xElevR), yPlanBaseToe - 24, '三 明 治 砌 石 護 岸 平 面 圖 (塊石交錯疊砌)', 14.0, '#38bdf8', 'center', 'middle');
    drawWorldLine(0.5 * (xElevL + xElevR) - 170, yPlanBaseToe - 33, 0.5 * (xElevL + xElevR) + 170, yPlanBaseToe - 33, '#38bdf8', 1.8);

    // ------------------------------------------------------------------------
    // D. 最下方區：【圖面內建工程數量計算式表 (On-Canvas & DXF Table)】
    // ------------------------------------------------------------------------
    const tblX = -260;
    const tblYTop = ySecNote - 58;
    const colWidths = [55, 390, 65, 535, 135, 135, 385];
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
      `三明治砌石護岸 (圖號 0406-1) 工程數量計算式表 【單元長 L=${m.Lm.toFixed(1)}m，牆高 H_wall=${(m.H_wall/100).toFixed(2)}m，坡度 1:${m.n_slope.toFixed(2)}，三層厚=${m.t_stone}+${m.t_mid_conc}+${m.t_grav_top}/${m.t_grav_bot}cm】`,
      10.5, '#f8fafc', 'center', 'middle'
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
      drawWorldText(curX + w / 2, yHdrTop - headerH / 2, h, 9.2, '#38bdf8', 'center', 'middle');
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
      drawWorldText(cx + colWidths[0] / 2, rMid, q.id, 8.8, '#cbd5e1', 'center', 'middle'); cx += colWidths[0];
      drawWorldText(cx + 10, rMid, q.name, 8.8, '#f8fafc', 'left', 'middle'); cx += colWidths[1];
      drawWorldText(cx + colWidths[2] / 2, rMid, q.unit, 8.8, '#cbd5e1', 'center', 'middle'); cx += colWidths[2];
      drawWorldText(cx + 10, rMid, q.formula, 8.3, '#fbbf24', 'left', 'middle'); cx += colWidths[3];
      drawWorldText(cx + colWidths[4] - 12, rMid, q.perM.toFixed(3), 8.8, '#38bdf8', 'right', 'middle'); cx += colWidths[4];
      drawWorldText(cx + colWidths[5] - 12, rMid, q.total.toFixed(2), 9.2, '#4ade80', 'right', 'middle'); cx += colWidths[5];
      drawWorldText(cx + 10, rMid, q.note, 8.2, '#94a3b8', 'left', 'middle');
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
return { model(R) { RR = R; try { return computeModel(); } finally { RR = null; } }, prims, SEL: {'sel_filter_box': 'YES', 'sel_rebar_main': 'D16', 'sel_rebar_sub': 'D13', 'sel_exc_mode': 'full'} };
})();
