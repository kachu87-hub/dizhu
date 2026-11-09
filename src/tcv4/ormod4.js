/* ===================== v5.7 0405-1／0405-2 預鑄舖排式護岸原圖移植（gen_or4.py 自動產生，勿手改） ===================== */
var TCO_T = window.TCO_T || (window.TCO_T = {});
TCO_T['p405'] = (function () {
  const DEF = {"inp_N_stone": "3", "inp_N_soil": "4", "inp_H_blk": "48.7", "inp_B_blk": "34.1", "inp_L_blk": "125.0", "inp_t_wall": "10.0", "inp_h_lip": "15.6", "inp_S_back": "55.9", "inp_cap_a": "46.9", "inp_cap_b": "14.6", "inp_t_cap": "10.0", "inp_B_fnd": "56.8", "inp_N_rc": "2", "inp_rc_B": "120", "inp_rc_L": "360", "inp_m_rc": "0.70", "inp_H_rc_fnd": "200", "inp_B_rc_fnd": "160", "inp_t_grav_top": "20", "inp_t_grav_bot": "20", "inp_t_pc": "5.0", "inp_w_pc": "5.0", "inp_X_key": "15", "inp_R1": "0", "inp_P1": "20", "inp_L_unit": "1000", "sel_dwg_mode": "0405-2", "chkSyncGravelW": true, "chkShowOrigRef": false, "chkShowHatch": true, "chkShowDims": true};
  let RR = null, O = [];
  const EL = {}, CTX = new Proxy({}, { get: (t, k) => (k in t ? t[k] : () => ({ width: 0 })), set: (t, k, v) => { t[k] = v; return true; } });
  const el = id => EL[id] || (EL[id] = { get value() { const v = RR && RR[id] !== undefined && RR[id] !== null && RR[id] !== '' ? RR[id] : DEF[id]; return v === undefined ? '' : String(v); }, set value(v) {},
    get checked() { return !!DEF[id]; }, set checked(v) {}, textContent: '', innerHTML: '', style: {}, width: 1600, height: 1000, clientWidth: 1600, clientHeight: 1000, classList: { add() {}, remove() {}, toggle() {} },
    addEventListener() {}, appendChild() {}, getContext() { return CTX; }, getBoundingClientRect: () => ({ left: 0, top: 0, width: 1600, height: 1000 }) });
  const document = { getElementById: el, querySelectorAll: () => [], querySelector: () => null, createElement: () => ({ click() {}, style: {} }), body: { appendChild() {}, removeChild() {} }, readyState: 'loading', addEventListener() {} };
  const window = { addEventListener() {}, innerWidth: 1990, innerHeight: 1044, devicePixelRatio: 1 };
  const requestAnimationFrame = () => 0, alert = () => {};

// ============================================================================
// 1. 原圖 4-05.dxf 精確萃取之幾何頂點常數庫 (100% 還原 DXF 斷面與詳圖)
// ============================================================================
// (A) 0405-2 護岸斷面圖之單顆預鑄塊與凹槽內 7 顆塊石 / 植生土壤真實頂點 (已轉為實務 cm 座標，相對於第 i 塊左下基準點)
// 原圖每層推進向量: STEP_DX = 24.922 cm, STEP_DY = 48.445 cm
const DXF_0405_2_STEP = { dx: 24.922, dy: 48.445 };

// 原圖基礎板預鑄塊 (Handle 7348~734B, 72E7~72EF) 頂點 (cm)
const DXF_0405_2_FOUNDATION_LINES = [
  [[0.0, 23.0], [11.73, 23.0]],
  [[0.0, 23.0], [0.0, 0.0]],
  [[0.0, 0.0], [56.75, 0.0]],
  [[56.75, 10.54], [56.75, 0.0]],
  [[12.75, 26.89], [10.80, 19.44]],
  [[10.80, 19.44], [44.37, 10.67]],
  [[45.84, 13.39], [44.37, 10.67]],
  [[45.84, 13.39], [56.75, 10.54]]
];

// 原圖護岸斷面中單一預鑄塊外框與內槽線段 (Handle 72E3~72F5, 相對於塊基準點 (10.80, 19.44) cm)
const DXF_0405_2_SLOPE_BLOCK_LINES = [
  [[12.82, 49.05], [0.00, 0.00]],
  [[5.89, 22.55], [17.28, 17.87]],
  [[14.33, 5.72], [1.95, 7.45]],
  [[14.33, 5.72], [15.38, 4.04]],
  [[1.95, 7.45], [0.00, 0.00]],
  [[0.00, 0.00], [33.57, -8.77]],
  [[35.04, -6.05], [45.95, -8.90]],
  [[45.95, -8.90], [70.87, 39.55]],
  [[15.34, 3.95], [37.89, 1.45]],
  [[59.96, 42.40], [37.89, 1.45]],
  [[59.96, 42.40], [70.87, 39.55]],
  [[24.93, 48.45], [58.50, 39.68]],
  [[35.04, -6.05], [33.57, -8.77]],
  [[12.82, 49.05], [19.56, 51.03]],
  [[19.56, 51.03], [25.64, 51.19]],
  [[24.93, 48.45], [21.71, 47.13]],
  [[14.33, 5.72], [21.71, 47.13]],
  [[59.96, 42.40], [58.50, 39.68]]
];

// 原圖護岸斷面凹槽內之 7 顆塊石多邊形 (Handle 73B5~73E5, 相對於塊基準點 (10.80, 19.44) cm)
const DXF_0405_2_POCKET_STONES = [
  [[19.53, 4.19], [15.48, 7.11], [16.58, 11.89], [21.73, 11.54], [23.93, 6.39], [19.53, 4.19]],
  [[24.68, 8.22], [21.73, 12.27], [25.03, 17.04], [30.18, 14.47], [31.28, 9.70], [29.08, 7.87], [24.68, 8.22]],
  [[25.03, 17.04], [20.25, 21.07], [17.68, 17.42], [16.58, 15.19], [16.58, 11.89], [22.10, 12.64], [25.03, 17.04]],
  [[29.83, 8.49], [26.88, 4.54], [29.08, 3.44], [34.20, 3.44], [38.63, 7.11], [39.35, 10.07], [35.33, 13.74], [30.90, 13.37], [29.83, 8.49]],
  [[27.73, 16.59], [26.88, 22.54], [33.48, 25.84], [42.30, 21.44], [37.53, 13.37], [33.10, 13.74], [27.73, 16.59]],
  [[23.93, 22.19], [18.43, 26.22], [19.53, 30.99], [26.13, 31.72], [28.33, 25.12], [27.23, 22.19], [23.93, 22.19]],
  [[38.25, 24.39], [39.73, 30.62], [47.43, 28.42], [48.18, 22.19], [45.60, 20.34], [40.45, 22.92], [38.25, 24.39]],
  [[29.43, 31.72], [32.38, 36.87], [37.15, 33.19], [37.88, 25.49], [32.00, 25.49], [26.13, 30.99], [29.43, 31.72]]
];

// 原圖護岸斷面凹槽內之回填土壤包絡多邊形 (Handle 734D, 734F, 7351, 73FD, 相對於塊基準點 cm)
const DXF_0405_2_POCKET_SOIL_POLY = [
  [24.93, 48.45], [21.71, 47.13], [14.03, 4.10], [37.88, 1.45], [60.68, 43.75], [24.93, 48.45]
];

// 原圖頂端蓋板在護岸斷面圖上之安裝線段 (Handle 7344~7347, 734C, 73FB, 73FC, 相對於第 N 層頂點 (160.34, 310.12) cm)
const DXF_0405_2_SLOPE_CAP_LINES = [
  [[72.91, 58.44], [24.92, 58.44]],
  [[24.92, 58.44], [24.92, 48.44]],
  [[72.91, 43.53], [72.91, 58.44]],
  [[72.91, 43.53], [62.23, 46.62]],
  [[60.68, 43.74], [24.92, 48.44]],
  [[45.94, -8.91], [72.91, 43.53]],
  [[62.23, 46.62], [37.88, 1.44]]
];

// (B) 原圖《預鑄塊斷面圖》40 條精確線段 (Handle 71DD~725C, 以左下角 (2190.20, 2183.67) 為 (0,0), 單位 cm)
const DXF_0405_2_DETAIL_BLOCK_LINES = [
  [[40.17, 36.35], [34.44, 10.70]],
  [[25.91, 43.79], [11.93, 36.35]],
  [[40.17, 36.35], [25.91, 43.79]],
  [[11.52, 8.45], [13.54, 6.03]],
  [[47.33, 56.32], [46.42, 53.56]],
  [[15.84, 53.56], [46.71, 53.56]],
  [[39.67, 11.46], [41.63, 10.13]],
  [[13.84, 7.70], [39.67, 11.46]],
  [[13.54, 6.03], [41.63, 10.13]],
  [[43.81, 50.38], [44.63, 53.56]],
  [[46.19, 51.25], [43.81, 50.38]],
  [[43.81, 50.38], [48.10, 48.95]],
  [[50.49, 49.81], [48.10, 48.95]],
  [[48.10, 48.95], [39.73, 11.42]],
  [[46.19, 51.25], [50.49, 49.81]],
  [[51.92, 56.26], [40.09, 3.21]],
  [[52.95, 56.25], [41.06, 3.00]],
  [[58.56, 56.17], [47.33, 56.32]],
  [[46.19, 51.25], [47.33, 56.32]],
  [[15.84, 53.56], [14.36, 52.45]],
  [[14.55, 56.14], [15.84, 53.56]],
  [[13.07, 55.59], [14.55, 56.14]],
  [[14.36, 52.45], [11.69, 49.88]],
  [[10.00, 54.70], [13.07, 55.59]],
  [[46.70, 3.00], [58.56, 56.17]],
  [[31.64, 3.00], [46.70, 3.00]],
  [[29.79, 0.00], [31.74, 3.16]],
  [[34.10, 0.00], [36.05, 3.16]],
  [[0.00, 0.00], [34.10, 0.00]],
  [[0.00, 7.70], [0.00, 0.00]],
  [[11.52, 8.45], [11.14, 8.91]],
  [[13.86, 7.79], [13.54, 6.03]],
  [[12.41, 9.15], [13.86, 7.79]],
  [[9.98, 49.70], [10.44, 21.89]],
  [[11.69, 49.88], [12.41, 9.15]],
  [[10.95, 21.82], [11.52, 8.45]],
  [[11.69, 49.88], [0.00, 48.70]],
  [[11.69, 49.88], [10.00, 54.70]],
  [[0.00, 48.70], [10.00, 54.70]],
  [[0.00, 48.70], [0.00, 0.00]]
];

// (C) 原圖《頂端蓋板預鑄塊斷面圖》閉合多邊形 (Handle 72CD~72D2, 以左下為 (0, 4.60) cm)
const DXF_0405_2_DETAIL_CAP_POLY = [
  [0.00, 14.60], [46.90, 14.60], [46.90, 0.00], [35.85, 3.19], [34.98, 0.00], [0.00, 4.60]
];

// (D) 原圖《預鑄塊立體圖》64 條等角立體圖線段 (Handle 71D5~7229, 相對於 (2201.70, 2062.14))
const DXF_0405_2_ISO3D_LINES = [
  [[28.69, 50.6], [27.01, 42.81]], [[46.32, 26.07], [48.46, 33.69]], [[32.12, 50.19], [30.03, 40.49]],
  [[27.68, 50.73], [23.7, 46.06]], [[32.12, 50.19], [27.68, 50.73]], [[46.94, 33.88], [43.51, 29.85]],
  [[52.06, 33.25], [46.94, 33.88]], [[48.45, 20.42], [52.06, 33.25]], [[56.74, 42.53], [41.0, 35.75]],
  [[52.05, 46.47], [56.74, 42.53]], [[36.22, 59.74], [30.9, 64.36]], [[41.81, 23.87], [41.81, 3.57]],
  [[46.82, 26.76], [42.51, 24.69]], [[0.47, 58.34], [0.0, 57.36]], [[0.0, 34.0], [0.0, 57.36]],
  [[46.82, 26.76], [39.25, 33.77]], [[46.82, 6.87], [46.82, 26.76]], [[0.0, 34.0], [41.81, 0.0]],
  [[4.89, 60.9], [0.47, 58.34]], [[12.78, 55.65], [4.89, 60.9]], [[24.11, 70.1], [21.15, 60.03]],
  [[36.22, 59.74], [31.75, 38.97]], [[20.62, 52.98], [36.22, 59.74]], [[17.35, 58.34], [30.9, 64.36]],
  [[17.35, 58.34], [19.57, 55.43]], [[14.21, 57.29], [17.35, 58.34]], [[14.21, 57.29], [9.11, 51.42]],
  [[17.59, 54.61], [14.21, 57.29]], [[20.62, 52.98], [18.87, 51.24]], [[19.57, 55.43], [20.62, 52.98]],
  [[17.59, 54.61], [19.57, 55.43]], [[17.94, 51.12], [13.13, 48.21]], [[18.87, 51.24], [17.94, 51.12]],
  [[17.59, 54.61], [18.87, 51.24]], [[13.13, 48.21], [17.59, 54.61]], [[33.16, 37.73], [17.94, 51.12]],
  [[38.55, 40.87], [52.05, 46.47]], [[38.55, 40.87], [40.65, 38.78]], [[34.94, 40.06], [38.55, 40.87]],
  [[34.94, 40.06], [30.52, 34.28]], [[38.2, 37.03], [34.94, 40.06]], [[34.36, 31.21], [38.2, 37.03]],
  [[39.25, 33.77], [34.36, 31.21]], [[41.0, 35.75], [39.25, 33.77]], [[40.65, 38.78], [41.0, 35.75]],
  [[38.2, 37.03], [40.65, 38.78]], [[39.25, 33.77], [38.2, 37.03]], [[42.51, 24.69], [41.81, 23.87]],
  [[0.47, 58.34], [42.51, 24.69]], [[41.81, 23.87], [0.0, 57.36]], [[51.01, 22.12], [46.82, 19.33]],
  [[51.01, 22.12], [56.74, 42.53]], [[59.86, 15.49], [51.01, 22.12]], [[55.2, 6.98], [56.13, 13.16]],
  [[46.82, 6.87], [59.86, 15.49]], [[41.81, 0.0], [41.69, 3.49]], [[54.5, 4.77], [41.81, 0.0]],
  [[55.2, 6.98], [54.5, 4.77]], [[61.49, 9.66], [55.2, 6.98]], [[63.59, 11.76], [61.49, 9.66]],
  [[24.11, 70.1], [24.81, 71.73]], [[59.86, 15.49], [65.92, 37.61]], [[63.59, 11.76], [59.86, 15.49]],
  [[70.92, 39.82], [63.59, 11.76]], [[65.92, 37.61], [24.81, 71.73]], [[70.92, 39.82], [65.92, 37.61]],
  [[29.93, 73.83], [70.92, 39.82]], [[24.81, 71.73], [29.93, 73.83]]
];

// 原圖 AutoCAD GRAVEL 剖面線 41 段晶格定義
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

// ============================================================================
// 2. 視角與狀態管理 (鎖定視角鐵律：修改參數絕不重設 camX/camY/scale)
// ============================================================================
const state = {
  camX: 300,
  camY: 120,
  scale: 0.62,
  isDragging: false,
  lastMouseX: 0,
  lastMouseY: 0,
  showOrigRef: false,
  showHatch: true,
  showDims: true
};

const canvas = document.getElementById('cadCanvas');
const ctx = canvas.getContext('2d');
const container = document.getElementById('canvasContainer');

function worldToScreen(wx, wy) {
  return {
    x: canvas.width / 2 + (wx - state.camX) * state.scale,
    y: canvas.height / 2 - (wy - state.camY) * state.scale
  };
}

function screenToWorld(sx, sy) {
  return {
    x: state.camX + (sx - canvas.width / 2) / state.scale,
    y: state.camY - (sy - canvas.height / 2) / state.scale
  };
}

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

// ============================================================================
// 3. 讀取並推算所有幾何與工程數量模型 (computeModel)
// ============================================================================
function getNum(id, fallback) {
  const el = document.getElementById(id);
  if (!el) return fallback;
  const v = parseFloat(el.value);
  return isNaN(v) ? fallback : v;
}

function computeModel() {
  const dwg_mode = document.getElementById('sel_dwg_mode').value; // '0405-2' or '0405-1'

  const N_stone = Math.max(1, Math.min(8, Math.round(getNum('inp_N_stone', 3))));
  const N_soil = Math.max(0, Math.min(8, Math.round(getNum('inp_N_soil', 4))));
  const N_total = N_stone + N_soil;

  const H_blk = Math.max(25, getNum('inp_H_blk', 48.7));
  const B_blk = Math.max(20, getNum('inp_B_blk', 34.1));
  const L_blk = Math.max(50, getNum('inp_L_blk', 125.0));
  const t_wall = Math.max(5, getNum('inp_t_wall', 10.0));
  const h_lip = Math.max(6, getNum('inp_h_lip', 15.6));
  const h_tenon = 7.7 * (H_blk / 48.7);
  const S_back = Math.max(30, getNum('inp_S_back', 55.9));

  const cap_a = Math.max(20, getNum('inp_cap_a', 46.9));
  const cap_b = Math.max(8, getNum('inp_cap_b', 14.6));
  const t_cap = Math.max(5, getNum('inp_t_cap', 10.0));
  const B_fnd = Math.max(35, getNum('inp_B_fnd', 56.8));

  const t_grav_top = Math.max(0, getNum('inp_t_grav_top', 20));
  const t_grav_bot = Math.max(0, getNum('inp_t_grav_bot', 20));
  const t_pc = Math.max(0, getNum('inp_t_pc', 5.0));
  const w_pc = t_pc > 0 ? Math.max(0, getNum('inp_w_pc', 5.0)) : 0;
  const R1 = Math.max(0, getNum('inp_R1', 0));
  const P1 = Math.max(15, getNum('inp_P1', 20));
  const X_key = Math.max(0, getNum('inp_X_key', 15));
  const L_unit = Math.max(125, getNum('inp_L_unit', 1000));
  const Lm = L_unit / 100.0;

  // 0405-1 參數
  const N_rc = Math.max(1, Math.min(5, Math.round(getNum('inp_N_rc', 2))));
  const rc_B = Math.max(50, getNum('inp_rc_B', 120));
  const rc_L = Math.max(150, getNum('inp_rc_L', 360));
  const m_rc = Math.max(0.4, getNum('inp_m_rc', 0.70));
  const H_rc_fnd = Math.max(50, getNum('inp_H_rc_fnd', 200));
  const B_rc_fnd = Math.max(60, getNum('inp_B_rc_fnd', 160));

  // 比例因子 (相對原圖 H_blk = 48.7 cm, B_blk = 34.1 cm)
  const sx = B_blk / 34.1;
  const sy = H_blk / 48.7;
  const stepDx = DXF_0405_2_STEP.dx * sx;
  const stepDy = DXF_0405_2_STEP.dy * sy;

  // 護岸總高度與等效坡度 1 : m_eff
  const H_revetment = 19.44 * sy + N_total * stepDy + 58.44 * (t_cap / 10.0);
  const W_revetment = 10.80 * sx + N_total * stepDx + 72.91 * (cap_a / 46.9);
  const m_eff = (N_total * stepDx) / Math.max(1, N_total * stepDy); // 水平 / 垂直

  const keySlopeW = R1 / 3.0;
  const keyTopW = R1 > 0 ? (P1 + 2 * keySlopeW) : 0;

  // 工程數量計算 (100% 對應圖面標註尺寸)
  const nColsPerUnit = L_unit / L_blk; // 每單元分段沿溪向塊數 (預設 1000 / 125 = 8 塊/排)
  const totalStdBlocks = nColsPerUnit * N_total;

  // 單一預鑄塊混凝土淨斷面積 (L型底板 + 前趾牆 + 背斜牆，約 0.0885 m² * sx * sy)
  const area_std_blk_m2 = 0.0885 * sx * sy;
  const vol_single_blk_m3 = area_std_blk_m2 * (L_blk / 100.0);
  const vol_all_std_blk_m3 = totalStdBlocks * vol_single_blk_m3;

  // 基礎板預鑄塊與頂端蓋板預鑄塊體積
  const area_fnd_blk_m2 = (B_fnd / 100.0) * 0.168 * sy;
  const area_cap_blk_m2 = ((cap_a / 100.0) * (t_cap / 100.0)) + 0.006;
  const vol_fnd_cap_m3 = (area_fnd_blk_m2 + area_cap_blk_m2) * Lm;

  // 單一預鑄塊凹槽容積 (原圖凹槽面積約 945 cm² = 0.0945 m²)
  const area_pocket_m2 = 0.0945 * sx * sy;
  const area_stone_tot_m2 = N_stone * area_pocket_m2;
  const vol_stone_unit_m3 = area_stone_tot_m2 * Lm;

  const area_soil_tot_m2 = N_soil * area_pocket_m2;
  const vol_soil_unit_m3 = area_soil_tot_m2 * Lm;

  // 背填天然碎石級配濾層體積 (設計原則5)
  const slopeLen_m = Math.hypot(N_total * stepDx, N_total * stepDy) / 100.0;
  const tg_top_m = t_grav_top / 100.0;
  const tg_bot_m = t_grav_bot / 100.0;
  const area_filter_m2 = 0.5 * (tg_top_m + tg_bot_m) * slopeLen_m;
  const vol_filter_m3 = area_filter_m2 * Lm;

  // 210 kgf/cm² 混凝土基礎打底 (設計原則7: 厚約 5.0 cm) + 選配止滑榫
  const B_pc = t_pc > 0 ? (B_fnd + 2 * w_pc) : 0;
  const area_pc_m2 = ((B_pc - keyTopW) / 100.0) * (t_pc / 100.0) + (R1 > 0 ? ((P1 + keyTopW) / 200.0) * (R1 / 100.0) : 0);
  const vol_pc_m3 = area_pc_m2 * Lm;

  // 岸坡整平壓實與基礎開挖
  const area_exc_m2 = (N_total * area_std_blk_m2) + area_fnd_blk_m2 + area_cap_blk_m2 + area_filter_m2 + area_pc_m2;
  const vol_exc_m3 = area_exc_m3_calc(area_exc_m2, Lm);

  function area_exc_m3_calc(a, l) { return a * l; }

  let quantities = [];
  if (dwg_mode === '0405-2') {
    quantities = [
      {
        id: '1',
        name: `245 kgf/cm² 工廠預鑄混凝土塊 (${L_blk}×${H_blk}×${B_blk}cm)`,
        unit: '塊 (m³)',
        formula: `(${N_stone}+${N_soil})層 * (${L_unit}/${L_blk})塊/層 = ${totalStdBlocks.toFixed(1)}塊 (${vol_all_std_blk_m3.toFixed(2)}m³)`,
        perM: totalStdBlocks / Lm,
        total: totalStdBlocks,
        note: `養護≥7+21日；每塊實積約 ${vol_single_blk_m3.toFixed(3)} m³`
      },
      {
        id: '2',
        name: `基礎板預鑄塊 (B=${B_fnd}cm) 及頂端蓋板預鑄塊 (a=${cap_a}cm)`,
        unit: 'm³',
        formula: `(${area_fnd_blk_m2.toFixed(3)} + ${area_cap_blk_m2.toFixed(3)}) * ${Lm.toFixed(1)}`,
        perM: area_fnd_blk_m2 + area_cap_blk_m2,
        total: vol_fnd_cap_m3,
        note: `各 ${nColsPerUnit.toFixed(1)} 塊/單元 (蓋板厚 ${t_cap}cm, b=${cap_b}cm)`
      },
      {
        id: '3',
        name: `洪水位以下凹槽回填塊石 (下部 N_stone=${N_stone} 層裝石頭)`,
        unit: 'm³',
        formula: `${N_stone}層 * ${area_pocket_m2.toFixed(4)} m²/層 * ${Lm.toFixed(1)}m`,
        perM: area_stone_tot_m2,
        total: vol_stone_unit_m3,
        note: `注意事項(五)-1(2)：提高抗沖能力與水流摩阻力`
      },
      {
        id: '4',
        name: `洪水位以上凹槽回填植生沃土 (上部 N_soil=${N_soil} 層裝土壤)`,
        unit: 'm³',
        formula: `${N_soil}層 * ${area_pocket_m2.toFixed(4)} m²/層 * ${Lm.toFixed(1)}m`,
        perM: area_soil_tot_m2,
        total: vol_soil_unit_m3,
        note: `注意事項(五)-1(1)：供草本植栽生長與生態通道`
      },
      {
        id: '5',
        name: `土坡界面天然碎石級配濾層 (頂寬${t_grav_top}/底寬${t_grav_bot}cm)`,
        unit: 'm³',
        formula: `((${tg_top_m.toFixed(2)}+${tg_bot_m.toFixed(2)})/2) * ${slopeLen_m.toFixed(2)} * ${Lm.toFixed(1)}`,
        perM: area_filter_m2,
        total: vol_filter_m3,
        note: `設計原則(四)-5：防止牆後細粒料遭水流吸出`
      },
      {
        id: '6',
        name: `210 kgf/cm² 混凝土基礎打底 (厚 t_pc=${t_pc}cm)`,
        unit: 'm³',
        formula: `(${((B_pc - keyTopW)/100).toFixed(2)} * ${(t_pc/100).toFixed(2)}) * ${Lm.toFixed(1)}`,
        perM: area_pc_m2,
        total: vol_pc_m3,
        note: `設計原則(四)-7：210 kgf/cm² 傳統混凝土打底`
      },
      {
        id: '7',
        name: `岸坡整平壓實及基礎土石方開挖`,
        unit: 'm³',
        formula: `${area_exc_m2.toFixed(3)} m²/m * ${Lm.toFixed(1)}m`,
        perM: area_exc_m2,
        total: vol_exc_m3,
        note: `注意事項(五)-4 & 6：含抓具挖土機吊排作業`
      }
    ];
  } else {
    // 0405-1 雙岸對稱護岸 R.C 箱模式數量表
    const area_rc_box = 2 * N_rc * (1.80 * 1.20); // 雙岸 R.C 箱斷面積
    const area_rc_fnd = 2 * (B_rc_fnd / 100.0) * (H_rc_fnd / 100.0);
    const n_rope16 = Math.ceil(Lm / 2.2) * 2;
    quantities = [
      {
        id: '1',
        name: `雙岸預鑄護岸 R.C 箱體組裝 (單岸 ${N_rc} 階，坡度 1:${m_rc.toFixed(2)})`,
        unit: 'm³',
        formula: `2岸 * ${N_rc}階 * (1.80*1.20) * ${Lm.toFixed(1)}m`,
        perM: area_rc_box,
        total: area_rc_box * Lm,
        note: `0405-1 斷面標註頂寬 B=${rc_B}cm, 單岸寬 L=${rc_L}cm`
      },
      {
        id: '2',
        name: `210 kgf/cm² 混凝土基礎台 (${B_rc_fnd}×${H_rc_fnd}cm 雙岸)`,
        unit: 'm³',
        formula: `2岸 * ${(B_rc_fnd/100).toFixed(2)} * ${(H_rc_fnd/100).toFixed(2)} * ${Lm.toFixed(1)}m`,
        perM: area_rc_fnd,
        total: area_rc_fnd * Lm,
        note: `原圖標註：210 kgf/cm² 混凝土基礎`
      },
      {
        id: '3',
        name: `Ø16mm 鍍鋅鋼絞索 (L=2.6m，附鍍鋅鋼夾扣 4 組/處)`,
        unit: '處',
        formula: `2岸 * ceil(${Lm.toFixed(1)}m / 2.2m間距)`,
        perM: n_rope16 / Lm,
        total: n_rope16,
        note: `平面圖註記：每間距約 2.2m 一處 Ø16mm 鋼絞索`
      },
      {
        id: '4',
        name: `Ø6mm 鍍鋅鋼索穿入吊放筋捆紮固定 (含夾扣 2 組)`,
        unit: '組',
        formula: `2岸 * 3條 * (${Lm.toFixed(1)}m / 10m)`,
        perM: 0.6,
        total: 0.6 * Lm,
        note: `詳圖A：穿入吊放筋後以 12# 包覆 PVC 鍍鋅鐵線固定`
      },
      {
        id: '5',
        name: `兩側護岸背部 PE 土包袋鋪設及回填土`,
        unit: 'm³',
        formula: `2岸 * (${(rc_B/100).toFixed(2)} * 1.50) * ${Lm.toFixed(1)}m`,
        perM: 2 * (rc_B / 100.0) * 1.5,
        total: 2 * (rc_B / 100.0) * 1.5 * Lm,
        note: `註：PE土包袋舖設位置僅兩側護岸，河床底不舖設`
      }
    ];
  }

  return {
    dwg_mode,
    N_stone, N_soil, N_total,
    H_blk, B_blk, L_blk, t_wall, h_lip, h_tenon, S_back,
    cap_a, cap_b, t_cap, B_fnd,
    t_grav_top, t_grav_bot, t_pc, w_pc, B_pc, R1, P1, X_key, keySlopeW, keyTopW,
    L_unit, Lm, nColsPerUnit, totalStdBlocks,
    sx, sy, stepDx, stepDy, H_revetment, W_revetment, m_eff,
    N_rc, rc_B, rc_L, m_rc, H_rc_fnd, B_rc_fnd,
    quantities
  };
}

// ============================================================================
// 4. 更新左側衍生尺寸與第 5 步規範檢核面板 (updateSidebarUI)
// ============================================================================
function updateSidebarUI(m) {
  document.getElementById('card0405_2').style.display = m.dwg_mode === '0405-2' ? 'block' : 'none';
  document.getElementById('card0405_1').style.display = m.dwg_mode === '0405-1' ? 'block' : 'none';
  document.getElementById('badgePage').textContent = m.dwg_mode === '0405-2' ? '頁碼 042' : '頁碼 041';

  const boxMain = document.getElementById('derivedBoxMain');
  if (boxMain) {
    boxMain.innerHTML =
      `• 預鑄塊總層數 <b>N = ${m.N_total} 層</b> (下 <b>${m.N_stone}層裝石頭</b> + 上 <b>${m.N_soil}層裝土壤</b>)<br>` +
      `• 護岸總高度 <b>H = ${m.H_revetment.toFixed(1)} cm</b> (${(m.H_revetment/100).toFixed(2)} m)<br>` +
      `• 鋪排坡度比 <b>1 : ${m.m_eff.toFixed(2)}</b> (每層推進 ΔX=${m.stepDx.toFixed(1)}, ΔY=${m.stepDy.toFixed(1)}cm)<br>` +
      `• 每單元(${m.Lm.toFixed(1)}m) 預鑄塊數：<b>${m.totalStdBlocks.toFixed(1)} 塊</b> (每排 ${m.nColsPerUnit.toFixed(1)} 塊)`;
  }

  const boxBase = document.getElementById('derivedBoxBase');
  boxBase.innerHTML =
    `• 210 混凝土打底總寬 <b>B_pc = ${m.B_pc.toFixed(1)} cm</b> | 厚 <b>t_pc = ${m.t_pc.toFixed(1)} cm</b><br>` +
    `• 背填碎石級配濾層：頂寬 <b>${m.t_grav_top} cm</b> / 底寬 <b>${m.t_grav_bot} cm</b><br>` +
    `• 間隔牆設置間距：每單元 <b>${m.Lm.toFixed(1)} m</b> (規範 10~30 m 設間隔牆)`;

  const checks = [
    {
      ok: m.H_revetment <= 500,
      text: `適用範圍(2) 岸坡高度檢核：H = ${(m.H_revetment/100).toFixed(2)} m ${m.H_revetment <= 500 ? '≤ 5.0 m (符合原則)' : '> 5.0 m (超出 5.0m 原則，須經安定性檢算!)'}`
    },
    {
      ok: true,
      text: `產品規範(2)&(3)：預鑄塊強度 ≥ 245 kgf/cm²，工廠預鑄養護 ≥ 7 日 + 自然養護 21 天`
    },
    {
      ok: m.t_pc >= 5.0,
      text: `設計原則(7) 基礎台打底檢核：t_pc = ${m.t_pc} cm ${m.t_pc >= 5.0 ? '≥ 5.0 cm (符合 210 kgf/cm² 混凝土打底規範)' : '< 5.0 cm (建議採用約 5.0cm 打底)'}`
    },
    {
      ok: m.L_unit >= 1000 && m.L_unit <= 3000,
      text: `設計原則(8) 間隔牆間距：L_unit = ${m.Lm.toFixed(1)} m ${m.L_unit >= 1000 && m.L_unit <= 3000 ? '(符合 10~30m 設置間隔牆規定)' : '(非 10~30m 標準間距)'}`
    },
    {
      ok: m.N_stone >= 1,
      text: `注意事項(1) 凹槽回填配置：洪水位以下 ${m.N_stone} 層裝石頭抗沖、洪水位以上 ${m.N_soil} 層裝土壤植生`
    },
    {
      ok: m.t_grav_top > 0 && m.t_grav_bot > 0,
      text: `設計原則(5) & 注意事項(5)：土坡界面設碎石級配或地工織物濾層 (${m.t_grav_top}cm)，防細粒料吸出`
    }
  ];

  const ul = document.getElementById('checkListRules');
  ul.innerHTML = checks.map(c =>
    `<li class="check-item"><span class="${c.ok ? 'badge-ok' : 'badge-warn'}">${c.ok ? '✔' : '⚠'}</span><span>${c.text}</span></li>`
  ).join('');
}

// ============================================================================
// 5. Canvas 繪圖輔助函式與退縮尺寸標註鐵律
// ============================================================================
function drawWorldLine(x1, y1, x2, y2, color = '#ffffff', lineWidth = 1.5, dash = []) {
  const p1 = worldToScreen(x1, y1);
  const p2 = worldToScreen(x2, y2);
  ctx.save();
  ctx.beginPath();
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.setLineDash(dash);
  ctx.moveTo(p1.x, p1.y);
  ctx.lineTo(p2.x, p2.y);
  ctx.stroke();
  ctx.restore();
}

function drawWorldPoly(pts, strokeColor = '#ffffff', lineWidth = 1.5, fillColor = null, close = true, dash = []) {
  if (!pts || pts.length < 2) return;
  ctx.save();
  ctx.beginPath();
  ctx.setLineDash(dash);
  const p0 = worldToScreen(pts[0][0], pts[0][1]);
  ctx.moveTo(p0.x, p0.y);
  for (let i = 1; i < pts.length; i++) {
    const p = worldToScreen(pts[i][0], pts[i][1]);
    ctx.lineTo(p.x, p.y);
  }
  if (close) ctx.closePath();
  if (fillColor) {
    ctx.fillStyle = fillColor;
    ctx.fill();
  }
  if (strokeColor) {
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
  }
  ctx.restore();
}

function drawWorldCircle(wx, wy, rWorld, strokeColor = '#ffffff', fillColor = null, lineWidth = 1.2) {
  const p = worldToScreen(wx, wy);
  const r = Math.max(1.2, rWorld * state.scale);
  ctx.save();
  ctx.beginPath();
  ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
  if (fillColor) {
    ctx.fillStyle = fillColor;
    ctx.fill();
  }
  if (strokeColor) {
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
  }
  ctx.restore();
}

function drawWorldText(wx, wy, text, heightWorld = 8.5, color = '#ffffff', align = 'center', baseline = 'middle', rotRad = 0) {
  const p = worldToScreen(wx, wy);
  const pxSize = Math.max(8, heightWorld * state.scale);
  ctx.save();
  ctx.translate(p.x, p.y);
  if (rotRad !== 0) ctx.rotate(-rotRad);
  ctx.font = `600 ${pxSize}px "DFKai-SB", "BiauKai", "Microsoft JhengHei", monospace`;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = baseline;
  ctx.fillText(text, 0, 0);
  ctx.restore();
}

function drawDxfGravelRegion(outerPoly, tileSizeWorld = 30.0, strokeColor = '#c084fc') {
  if (!outerPoly || outerPoly.length < 3) return;
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  outerPoly.forEach(p => {
    if (p[0] < minX) minX = p[0];
    if (p[0] > maxX) maxX = p[0];
    if (p[1] < minY) minY = p[1];
    if (p[1] > maxY) maxY = p[1];
  });

  ctx.save();
  ctx.beginPath();
  const p0 = worldToScreen(outerPoly[0][0], outerPoly[0][1]);
  ctx.moveTo(p0.x, p0.y);
  for (let i = 1; i < outerPoly.length; i++) {
    const p = worldToScreen(outerPoly[i][0], outerPoly[i][1]);
    ctx.lineTo(p.x, p.y);
  }
  ctx.closePath();
  ctx.clip();

  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = 1.0;
  ctx.beginPath();

  const txStart = Math.floor(minX / tileSizeWorld) * tileSizeWorld;
  const txEnd = Math.ceil(maxX / tileSizeWorld) * tileSizeWorld;
  const tyStart = Math.floor(minY / tileSizeWorld) * tileSizeWorld;
  const tyEnd = Math.ceil(maxY / tileSizeWorld) * tileSizeWorld;

  for (let tx = txStart; tx < txEnd; tx += tileSizeWorld) {
    for (let ty = tyStart; ty < tyEnd; ty += tileSizeWorld) {
      for (let s = 0; s < GRAVEL_TILE_SEGS.length; s++) {
        const seg = GRAVEL_TILE_SEGS[s];
        const sp1 = worldToScreen(tx + seg[0][0] * tileSizeWorld, ty + seg[0][1] * tileSizeWorld);
        const sp2 = worldToScreen(tx + seg[1][0] * tileSizeWorld, ty + seg[1][1] * tileSizeWorld);
        ctx.moveTo(sp1.x, sp1.y);
        ctx.lineTo(sp2.x, sp2.y);
      }
    }
  }
  ctx.stroke();
  ctx.restore();
}

// 尺寸標註延伸線退縮鐵律
function getDimExtensionCoords(coordObj, dimPos) {
  const minGapFromObj = 5.5;
  const maxInnerTick = 9.0;
  const outerTick = 3.2;
  const dir = dimPos >= coordObj ? 1 : -1;
  const dist = Math.abs(dimPos - coordObj);
  const innerLen = Math.min(maxInnerTick, Math.max(1.5, dist - minGapFromObj));
  const startCoord = dimPos - dir * innerLen;
  const endCoord = dimPos + dir * outerTick;
  return { startCoord, endCoord };
}

function drawHorizDim(x1, yObj1, x2, yObj2, yDim, text, color = '#38bdf8', fontH = 6.5) {
  if (Math.abs(x2 - x1) < 0.05) return;
  const ext1 = getDimExtensionCoords(yObj1, yDim);
  const ext2 = getDimExtensionCoords(yObj2, yDim);
  drawWorldLine(x1, ext1.startCoord, x1, ext1.endCoord, color, 1.1);
  drawWorldLine(x2, ext2.startCoord, x2, ext2.endCoord, color, 1.1);
  drawWorldLine(x1, yDim, x2, yDim, color, 1.2);

  const xa = Math.min(x1, x2), xb = Math.max(x1, x2);
  const arr = Math.min(3.8, Math.abs(xb - xa) * 0.22);
  drawWorldPoly([[xa, yDim], [xa + arr, yDim + arr * 0.35], [xa + arr, yDim - arr * 0.35]], color, 1, color, true);
  drawWorldPoly([[xb, yDim], [xb - arr, yDim + arr * 0.35], [xb - arr, yDim - arr * 0.35]], color, 1, color, true);

  const xm = 0.5 * (x1 + x2);
  const offsetT = yDim >= Math.max(yObj1, yObj2) ? (fontH * 0.75) : -(fontH * 0.75);
  drawWorldText(xm, yDim + offsetT, text, fontH, '#f8fafc', 'center', 'middle');
}

function drawVertDim(xObj1, y1, xObj2, y2, xDim, text, color = '#38bdf8', fontH = 6.5) {
  if (Math.abs(y2 - y1) < 0.05) return;
  const ext1 = getDimExtensionCoords(xObj1, xDim);
  const ext2 = getDimExtensionCoords(xObj2, xDim);
  drawWorldLine(ext1.startCoord, y1, ext1.endCoord, y1, color, 1.1);
  drawWorldLine(ext2.startCoord, y2, ext2.endCoord, y2, color, 1.1);
  drawWorldLine(xDim, y1, xDim, y2, color, 1.2);

  const ya = Math.min(y1, y2), yb = Math.max(y1, y2);
  const arr = Math.min(3.8, Math.abs(yb - ya) * 0.22);
  drawWorldPoly([[xDim, ya], [xDim - arr * 0.35, ya + arr], [xDim + arr * 0.35, ya + arr]], color, 1, color, true);
  drawWorldPoly([[xDim, yb], [xDim - arr * 0.35, yb - arr], [xDim + arr * 0.35, yb - arr]], color, 1, color, true);

  const ym = 0.5 * (y1 + y2);
  const offsetT = xDim <= Math.min(xObj1, xObj2) ? -(fontH * 0.8) : (fontH * 0.8);
  drawWorldText(xDim + offsetT, ym, text, fontH, '#f8fafc', 'center', 'middle', Math.PI / 2);
}

// 繪製原圖圓頭引線 (對應 0405-2 Handle B07B~B0A6 圓頭標註樣式 _Dot)
function drawDotLeader(tipPts, xKnee, yKnee, dirRight, textLines, lineCol = '#38bdf8', txtCol = '#f8fafc', fontH = 7.5) {
  const shelfLen = 42 * (dirRight ? 1 : -1);
  tipPts.forEach(pt => {
    drawWorldLine(pt[0], pt[1], xKnee, yKnee, lineCol, 1.15);
    drawWorldCircle(pt[0], pt[1], 1.6, lineCol, lineCol, 1.0);
  });
  drawWorldLine(xKnee, yKnee, xKnee + shelfLen, yKnee, lineCol, 1.2);
  const tx = xKnee + (dirRight ? 5 : -5);
  const align = dirRight ? 'left' : 'right';
  textLines.forEach((line, idx) => {
    drawWorldText(tx, yKnee + 5 - idx * (fontH * 1.45), line, fontH, txtCol, align, 'middle');
  });
}

// ============================================================================
// 6. 主繪圖引擎 (renderCAD)：支援 0405-2 與 0405-1 完整視圖 + 圖面工程數量表
// ============================================================================
function renderCAD() {
  if (canvas.width < 50 || canvas.height < 50) {
    canvas.width = Math.max(600, container.clientWidth || (window.innerWidth - 435));
    canvas.height = Math.max(500, container.clientHeight || (window.innerHeight - 42));
  }

  const m = computeModel();
  updateSidebarUI(m);

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 背景微細格網
  ctx.save();
  ctx.strokeStyle = '#131c2e';
  ctx.lineWidth = 1;
  const stepGrid = 50;
  const tl = screenToWorld(0, 0);
  const br = screenToWorld(canvas.width, canvas.height);
  const gxStart = Math.floor(tl.x / stepGrid) * stepGrid;
  const gxEnd = Math.ceil(br.x / stepGrid) * stepGrid;
  const gyStart = Math.floor(br.y / stepGrid) * stepGrid;
  const gyEnd = Math.ceil(tl.y / stepGrid) * stepGrid;
  for (let gx = gxStart; gx <= gxEnd; gx += stepGrid) {
    const sx = worldToScreen(gx, 0).x;
    ctx.beginPath(); ctx.moveTo(sx, 0); ctx.lineTo(sx, canvas.height); ctx.stroke();
  }
  for (let gy = gyStart; gy <= gyEnd; gy += stepGrid) {
    const sy = worldToScreen(0, gy).y;
    ctx.beginPath(); ctx.moveTo(0, sy); ctx.lineTo(canvas.width, sy); ctx.stroke();
  }
  ctx.restore();

  if (m.dwg_mode === '0405-2') {
    render0405_2(m);
  } else {
    render0405_1(m);
  }
}

// ----------------------------------------------------------------------------
// 繪製 0405-2《預鑄舖排式護岸(二)》六大視圖 + 下方數量計算表
// ----------------------------------------------------------------------------
function render0405_2(m) {
  const sx = m.sx;
  const sy = m.sy;
  const fndScaleX = m.B_fnd / 56.75;

  // ==========================================================================
  // 視圖 1 (左下主視圖)：【預鑄舖排式護岸(二) 斷面圖 (剖面圖)】(原點 (0,0))
  // 100% 依照 4-05.dxf Handle 72E3~73FD 繪製：基礎板預鑄塊 + N_stone層裝石頭 + N_soil層裝土壤 + 頂端蓋板預鑄塊
  // ==========================================================================
  // 1.1 底部 210 kgf/cm² 混凝土打底層 (t_pc) 與選配 1:3 梯形止滑榫 (R1, P1, X_key)
  if (m.t_pc > 0 || m.R1 > 0) {
    const xPcL = -m.w_pc;
    const xPcR = m.B_fnd + m.w_pc;
    const xKeyTopL = Math.max(0, Math.min(m.X_key, m.B_fnd - m.keyTopW));
    const xKeyTopR = xKeyTopL + m.keyTopW;
    const xKeyBotL = xKeyTopL + m.keySlopeW;
    const xKeyBotR = xKeyTopR - m.keySlopeW;

    const pcPoly = [[xPcL, 0], [xPcR, 0], [xPcR, -m.t_pc]];
    if (m.R1 > 0) {
      pcPoly.push(
        [xKeyTopR, -m.t_pc],
        [xKeyBotR, -(m.t_pc + m.R1)],
        [xKeyBotL, -(m.t_pc + m.R1)],
        [xKeyTopL, -m.t_pc]
      );
    }
    pcPoly.push([xPcL, -m.t_pc]);
    drawWorldPoly(pcPoly, '#22c55e', 1.6, 'rgba(34, 197, 94, 0.15)', true);
  }

  // 1.2 基礎板預鑄塊 (Handle 7348~734B, 72E7~72EF)
  const fndPoly = [
    [0, 0],
    [56.75 * fndScaleX, 0],
    [56.75 * fndScaleX, 10.54 * sy],
    [45.84 * sx, 13.39 * sy],
    [44.37 * sx, 10.67 * sy],
    [10.80 * sx, 19.44 * sy],
    [12.75 * sx, 26.89 * sy],
    [11.73 * sx, 23.00 * sy],
    [0, 23.00 * sy]
  ];
  drawWorldPoly(fndPoly, '#facc15', 2.0, 'rgba(148, 163, 184, 0.20)', true);
  DXF_0405_2_FOUNDATION_LINES.forEach(seg => {
    drawWorldLine(seg[0][0] * fndScaleX, seg[0][1] * sy, seg[1][0] * fndScaleX, seg[1][1] * sy, '#facc15', 1.8);
  });

  // 1.3 背填天然碎石級配濾層 (設計原則5：頂底寬連動)
  const backBotPt = [56.75 * fndScaleX, 10.54 * sy];
  const backTopPt = [10.80 * sx + m.N_total * m.stepDx + 72.91 * (m.cap_a / 46.9), 19.44 * sy + m.N_total * m.stepDy + 43.53 * (m.t_cap / 10.0)];
  if (m.t_grav_top > 0 || m.t_grav_bot > 0) {
    const filterPoly = [
      backBotPt,
      backTopPt,
      [backTopPt[0] + m.t_grav_top, backTopPt[1]],
      [backBotPt[0] + m.t_grav_bot, backBotPt[1]]
    ];
    if (state.showHatch) {
      drawDxfGravelRegion(filterPoly, 26.0, '#c084fc');
    }
    drawWorldPoly(filterPoly, '#c084fc', 1.3, 'rgba(192, 132, 252, 0.10)', true, [5, 3]);
  }

  // 1.4 階梯式連鎖鋪排之 N_total 層標準預鑄塊 (下 N_stone 層裝石頭 + 上 N_soil 層裝土壤)
  const stoneLeaderTips = [];
  const soilLeaderTips = [];
  const stonePocketTips = [];
  const soilPocketTips = [];

  for (let i = 0; i < m.N_total; i++) {
    const bx = 10.80 * sx + i * m.stepDx;
    const by = 19.44 * sy + i * m.stepDy;
    const isStoneLayer = (i < m.N_stone);

    // 預鑄塊混凝土本體外框填充多邊形
    const blkBodyPoly = [
      [bx + 0.00 * sx, by + 0.00 * sy],
      [bx + 33.57 * sx, by - 8.77 * sy],
      [bx + 35.04 * sx, by - 6.05 * sy],
      [bx + 45.95 * sx, by - 8.90 * sy],
      [bx + 70.87 * sx, by + 39.55 * sy],
      [bx + 59.96 * sx, by + 42.40 * sy],
      [bx + 37.89 * sx, by + 1.45 * sy],
      [bx + 15.34 * sx, by + 3.95 * sy],
      [bx + 14.33 * sx, by + 5.72 * sy],
      [bx + 21.71 * sx, by + 47.13 * sy],
      [bx + 24.93 * sx, by + 48.45 * sy],
      [bx + 25.64 * sx, by + 51.19 * sy],
      [bx + 19.56 * sx, by + 51.03 * sy],
      [bx + 12.82 * sx, by + 49.05 * sy]
    ];
    drawWorldPoly(blkBodyPoly, '#facc15', 1.8, 'rgba(148, 163, 184, 0.18)', true);

    // 繪製原圖 DXF 預鑄塊所有細節線段 (含吊放筋斜線 72E4)
    DXF_0405_2_SLOPE_BLOCK_LINES.forEach(seg => {
      drawWorldLine(
        bx + seg[0][0] * sx, by + seg[0][1] * sy,
        bx + seg[1][0] * sx, by + seg[1][1] * sy,
        '#facc15', 1.7
      );
    });

    // 凹槽內回填物：下 N_stone 層「裝石頭」(原圖 73B5~73E5 塊石多邊形)，上 N_soil 層「裝土壤」(原圖 734D~73FD 土壤與植生)
    if (isStoneLayer) {
      if (state.showHatch) {
        DXF_0405_2_POCKET_STONES.forEach(sPoly => {
          const worldStone = sPoly.map(p => [bx + p[0] * sx, by + p[1] * sy]);
          drawWorldPoly(worldStone, '#d946ef', 1.25, 'rgba(217, 70, 239, 0.22)', true);
        });
      }
      stoneLeaderTips.push([bx + 5.5 * sx, by + 28.0 * sy]);
      if (i === 0) stonePocketTips.push([bx + 36.0 * sx, by + 18.0 * sy]);
    } else {
      const worldSoilPoly = DXF_0405_2_POCKET_SOIL_POLY.map(p => [bx + p[0] * sx, by + p[1] * sy]);
      drawWorldPoly(worldSoilPoly, '#a855f7', 1.3, 'rgba(34, 197, 94, 0.16)', true);
      if (state.showHatch) {
        // 繪製原圖 JE-SAND 沃土顆粒點與草本植栽 (plant 圖塊示意)
        for (let k = 0; k < 24; k++) {
          const rx = bx + (15 + seededRand(i * 31 + k * 7) * 42) * sx;
          const ry = by + (3 + seededRand(i * 19 + k * 13) * 42) * sy;
          if (pointInPoly([rx, ry], worldSoilPoly)) {
            drawWorldCircle(rx, ry, 0.7, '#4ade80', '#4ade80');
          }
        }
        // 凹槽表面草本植生叢
        const gx = bx + 22.0 * sx, gy = by + 46.5 * sy;
        drawWorldLine(gx, gy, gx - 3.5, gy + 6.5, '#22c55e', 1.4);
        drawWorldLine(gx, gy, gx - 0.5, gy + 7.5, '#22c55e', 1.4);
        drawWorldLine(gx, gy, gx + 3.0, gy + 5.5, '#22c55e', 1.4);
      }
      soilLeaderTips.push([bx + 5.5 * sx, by + 28.0 * sy]);
      if (i === m.N_stone) soilPocketTips.push([bx + 36.0 * sx, by + 18.0 * sy]);
    }
  }

  // 1.5 頂部「頂端蓋板預鑄塊」(Handle 7344~7347, 734C, 73FB, 73FC)
  const topOriginX = 10.80 * sx + (m.N_total - 1) * m.stepDx;
  const topOriginY = 19.44 * sy + (m.N_total - 1) * m.stepDy;
  const capScaleX = m.cap_a / 46.9;
  const capScaleY = m.t_cap / 10.0;
  const capPolySlope = [
    [topOriginX + 24.92 * sx, topOriginY + 58.44 * sy],
    [topOriginX + (24.92 + 48.0 * capScaleX) * sx, topOriginY + 58.44 * sy],
    [topOriginX + (24.92 + 48.0 * capScaleX) * sx, topOriginY + (58.44 - 14.9 * (m.cap_b / 14.6)) * sy],
    [topOriginX + (24.92 + 37.3 * capScaleX) * sx, topOriginY + (58.44 - 11.8 * (m.cap_b / 14.6)) * sy],
    [topOriginX + (24.92 + 35.8 * capScaleX) * sx, topOriginY + (58.44 - 14.7 * (m.cap_b / 14.6)) * sy],
    [topOriginX + 24.92 * sx, topOriginY + (58.44 - 10.0 * capScaleY) * sy]
  ];
  drawWorldPoly(capPolySlope, '#facc15', 2.0, 'rgba(148, 163, 184, 0.24)', true);

  // 設計洪水位線 (位於第 N_stone 層與第 N_stone+1 層交界處)
  const yFlood = 19.44 * sy + m.N_stone * m.stepDy + 4.0;
  const xFloodStart = 10.80 * sx + m.N_stone * m.stepDx - 65;
  const xFloodEnd = 10.80 * sx + m.N_stone * m.stepDx + 15;
  drawWorldLine(xFloodStart, yFlood, xFloodEnd, yFlood, '#38bdf8', 1.3, [7, 4]);
  drawWorldText(xFloodStart + 4, yFlood + 5.5, '設計洪水位 (50年重現期)', 6.5, '#38bdf8', 'left', 'middle');

  // 1.6 原圖 0405-2 基準比對線 (洋紅虛線，當預設 N_stone=3, N_soil=4 時 100% 重合)
  if (state.showOrigRef) {
    DXF_0405_2_FOUNDATION_LINES.forEach(seg => {
      drawWorldLine(seg[0][0], seg[0][1], seg[1][0], seg[1][1], '#f472b6', 1.4, [4, 4]);
    });
    for (let i = 0; i < 7; i++) {
      const ox = 10.80 + i * DXF_0405_2_STEP.dx;
      const oy = 19.44 + i * DXF_0405_2_STEP.dy;
      DXF_0405_2_SLOPE_BLOCK_LINES.forEach(seg => {
        drawWorldLine(ox + seg[0][0], oy + seg[0][1], ox + seg[1][0], oy + seg[1][1], '#f472b6', 1.4, [4, 4]);
      });
    }
    const tx6 = 10.80 + 6 * DXF_0405_2_STEP.dx;
    const ty6 = 19.44 + 6 * DXF_0405_2_STEP.dy;
    DXF_0405_2_SLOPE_CAP_LINES.forEach(seg => {
      drawWorldLine(tx6 + seg[0][0], ty6 + seg[0][1], tx6 + seg[1][0], ty6 + seg[1][1], '#f472b6', 1.4, [4, 4]);
    });
  }

  // 1.7 斷面圖圓頭引線標註 (100% 還原原圖 Handle B07B~B0A6 及文字 72DF~73F0)
  drawDotLeader([[5.0, 12.0 * sy]], -45, 13.5 * sy, false, ['基礎板預鑄塊']);
  if (stoneLeaderTips.length > 0) {
    drawDotLeader(stoneLeaderTips, -55, 19.44 * sy + (m.N_stone * 0.45) * m.stepDy, false, ['預鑄塊 (洪水位下)']);
  }
  if (soilLeaderTips.length > 0) {
    drawDotLeader(soilLeaderTips, -15, 19.44 * sy + (m.N_stone + m.N_soil * 0.5) * m.stepDy, false, ['預鑄塊 (洪水位上)']);
  }
  drawDotLeader(
    [[topOriginX + 35 * sx, topOriginY + 55 * sy]],
    topOriginX - 55, topOriginY + 50 * sy,
    false, ['頂端蓋板預鑄塊']
  );
  if (stonePocketTips.length > 0) {
    drawDotLeader(
      stonePocketTips,
      stonePocketTips[0][0] + 65, stonePocketTips[0][1],
      true, ['裝石頭 (抗沖刷摩阻層)']
    );
  }
  if (soilPocketTips.length > 0) {
    drawDotLeader(
      soilPocketTips,
      soilPocketTips[0][0] + 65, soilPocketTips[0][1],
      true, ['裝土壤 (草本植栽層)']
    );
  }

  if (state.showDims) {
    drawHorizDim(0, 0, m.B_fnd, 0, -(m.t_pc + m.R1) - 18, `基礎板寬 ${m.B_fnd.toFixed(1)}`, '#38bdf8', 7.0);
    drawVertDim(-5, 0, -5, m.H_revetment, -135, `護岸總高 H=${m.H_revetment.toFixed(1)}cm`, '#38bdf8', 7.5);
  }

  drawWorldText(80, -(m.t_pc + m.R1) - 48, '預 鑄 舖 排 式 護 岸 (二) 斷 面 圖 (剖 面 圖)', 12.5, '#38bdf8', 'center', 'middle');
  drawWorldLine(-10, -(m.t_pc + m.R1) - 56, 170, -(m.t_pc + m.R1) - 56, '#38bdf8', 1.8);
  drawWorldText(80, -(m.t_pc + m.R1) - 68, '註：標示單位除另有註明外，均以 cm 為單位。', 7.5, '#fbbf24', 'center', 'middle');

  // ==========================================================================
  // 視圖 2 (中上區)：【預鑄塊斷面圖】(100% 還原原圖視埠 AF2F & 標註 *D11~*D20)
  // 放置於世界座標 (dxBlk, dyBlk) = (310, 230)，放大 1.6 倍方便清楚檢視細節尺寸
  // ==========================================================================
  const dxBlk = 320, dyBlk = 225, scD = 1.65;
  const mapBlk = (x, y) => [dxBlk + x * sx * scD, dyBlk + y * sy * scD];

  DXF_0405_2_DETAIL_BLOCK_LINES.forEach(seg => {
    const p1 = mapBlk(seg[0][0], seg[0][1]);
    const p2 = mapBlk(seg[1][0], seg[1][1]);
    drawWorldLine(p1[0], p1[1], p2[0], p2[1], '#facc15', 1.7);
  });

  if (state.showDims) {
    const p00 = mapBlk(0, 0);
    const p0Top = mapBlk(0, 48.7);
    const pLipBot = mapBlk(0, 48.7 - 15.6);
    const pTenonTop = mapBlk(0, 7.7);
    const pBotR = mapBlk(34.1, 0);
    const pTopLipR = mapBlk(10.0, 54.7);
    const pBackBot = mapBlk(46.7, 3.0);
    const pBackTop = mapBlk(58.56, 56.17);

    // 左側垂直標註 (*D20: 48.7, *D18: 15.6, *D19: 7.7)
    drawVertDim(p00[0], p00[1], pTenonTop[0], pTenonTop[1], p00[0] - 16, `7.7`, '#38bdf8', 6.5);
    drawVertDim(pLipBot[0], pLipBot[1], p0Top[0], p0Top[1], p00[0] - 16, `${m.h_lip.toFixed(1)}`, '#38bdf8', 6.5);
    drawVertDim(p00[0], p00[1], p0Top[0], p0Top[1], p00[0] - 34, `${m.H_blk.toFixed(1)}`, '#38bdf8', 7.0);

    // 底部水平標註 (*D13: 34.1, *D12: 46.7)
    drawHorizDim(p00[0], p00[1], pBotR[0], pBotR[1], p00[1] - 16, `${m.B_blk.toFixed(1)}`, '#38bdf8', 6.5);
    drawHorizDim(p00[0], p00[1], pBackBot[0], pBackBot[1], p00[1] - 32, `${(46.7 * sx).toFixed(1)}`, '#38bdf8', 6.5);

    // 頂部水平標註 (*D15: 10, *D17: 45, *D16: 11, *D14: 3)
    drawHorizDim(p0Top[0], pBackTop[1], pTopLipR[0], pBackTop[1], pBackTop[1] + 15, `${m.t_wall.toFixed(0)}`, '#38bdf8', 6.5);
    drawHorizDim(pTopLipR[0], pBackTop[1], pBackTop[0] - 18, pBackTop[1], pBackTop[1] + 15, `45`, '#38bdf8', 6.5);
    drawHorizDim(pBackTop[0] - 18, pBackTop[1], pBackTop[0], pBackTop[1], pBackTop[1] + 15, `11 (齒3)`, '#38bdf8', 6.5);

    // 右側斜長標註 (*D11: 55.9)
    drawVertDim(pBackBot[0], pBackBot[1], pBackTop[0], pBackTop[1], pBackTop[0] + 20, `背斜 ${m.S_back.toFixed(1)}`, '#38bdf8', 6.5);
  }

  drawWorldText(dxBlk + 28 * scD, dyBlk - 50, '預 鑄 塊 斷 面 圖', 11.0, '#38bdf8', 'center', 'middle');
  drawWorldLine(dxBlk - 10, dyBlk - 58, dxBlk + 65 * scD, dyBlk - 58, '#38bdf8', 1.6);

  // ==========================================================================
  // 視圖 3 (右上區)：【頂端蓋板預鑄塊斷面圖】(100% 還原視埠 AF1E & 標註 *D32~*D35)
  // ==========================================================================
  const dxCap = 520, dyCap = 245, scCap = 1.65;
  const capW = m.cap_a;
  const capH = m.cap_b;
  const capT = m.t_cap;
  const capPts = [
    [dxCap, dyCap + capH * scCap],
    [dxCap + capW * scCap, dyCap + capH * scCap],
    [dxCap + capW * scCap, dyCap],
    [dxCap + (capW - 11.05) * scCap, dyCap + 3.19 * scCap],
    [dxCap + (capW - 11.92) * scCap, dyCap],
    [dxCap, dyCap + (capH - capT) * scCap]
  ];
  drawWorldPoly(capPts, '#facc15', 2.0, 'rgba(148, 163, 184, 0.22)', true);

  if (state.showDims) {
    drawHorizDim(dxCap, dyCap + capH * scCap, dxCap + capW * scCap, dyCap + capH * scCap, dyCap + capH * scCap + 15, `a = ${capW.toFixed(1)}`, '#38bdf8', 6.5);
    drawVertDim(dxCap, dyCap + (capH - capT) * scCap, dxCap, dyCap + capH * scCap, dxCap - 14, `${capT.toFixed(0)}`, '#38bdf8', 6.5);
    drawVertDim(dxCap + capW * scCap, dyCap, dxCap + capW * scCap, dyCap + capH * scCap, dxCap + capW * scCap + 16, `b = ${capH.toFixed(1)}`, '#38bdf8', 6.5);
    drawWorldText(dxCap + (capW - 11.5) * scCap, dyCap - 9, `卡榫 3cm`, 6.5, '#fbbf24', 'center', 'middle');
  }

  drawWorldText(dxCap + 0.5 * capW * scCap, dyCap - 28, '頂端蓋板預鑄塊斷面圖', 10.5, '#38bdf8', 'center', 'middle');
  drawWorldLine(dxCap - 10, dyCap - 36, dxCap + capW * scCap + 10, dyCap - 36, '#38bdf8', 1.6);

  // ==========================================================================
  // 視圖 4 (中下左區)：【預鑄塊平面圖】(*D21:1, *D22:123, *D23:1, 總長 125cm)
  // ==========================================================================
  const dxPlan = 310, dyPlan = 65;
  const L_p = m.L_blk;
  const W_p = 72.0 * sy;
  // 外框與上下緣倒角
  drawWorldPoly([
    [dxPlan + 1, dyPlan],
    [dxPlan + L_p - 1, dyPlan],
    [dxPlan + L_p, dyPlan + 1],
    [dxPlan + L_p, dyPlan + 9.36],
    [dxPlan + L_p - 1, dyPlan + W_p],
    [dxPlan + 1, dyPlan + W_p],
    [dxPlan, dyPlan + 9.36],
    [dxPlan, dyPlan + 1]
  ], '#facc15', 1.8, 'rgba(30, 41, 59, 0.55)', true);

  drawWorldLine(dxPlan, dyPlan + 9.36, dxPlan + L_p, dyPlan + 9.36, '#facc15', 1.3);
  drawWorldLine(dxPlan + 1, dyPlan + W_p - 8, dxPlan + L_p - 1, dyPlan + W_p - 8, '#facc15', 1.3);

  // 左右雙吊耳肋板與中央方孔 (Handle 71E0~71E6, 726B~7293)
  const rib1X = dxPlan + 26.25 * (L_p / 125.0);
  const rib2X = dxPlan + 88.75 * (L_p / 125.0);
  [rib1X, rib2X].forEach(rx => {
    drawWorldPoly([[rx, dyPlan + 17.36], [rx + 10, dyPlan + 17.36], [rx + 10, dyPlan + W_p - 10], [rx, dyPlan + W_p - 10]], '#facc15', 1.4, 'rgba(250, 204, 21, 0.12)', true);
    drawWorldPoly([[rx + 2, dyPlan + 9.36], [rx + 8, dyPlan + 9.36], [rx + 8, dyPlan + 24.36], [rx + 2, dyPlan + 24.36]], '#38bdf8', 1.2, null, true);
  });
  // 中央方孔 (Handle 71E0~71E6)
  const holeX = dxPlan + 0.5 * L_p - 2.5;
  const holeY = dyPlan + 40.8;
  drawWorldPoly([[holeX, holeY], [holeX + 5, holeY], [holeX + 5, holeY + 6], [holeX, holeY + 6]], '#38bdf8', 1.2, null, true);
  drawWorldLine(holeX, holeY, holeX + 5, holeY + 6, '#38bdf8', 1.0);
  drawWorldLine(holeX, holeY + 6, holeX + 5, holeY, '#38bdf8', 1.0);

  if (state.showDims) {
    drawHorizDim(dxPlan + 1, dyPlan + W_p, dxPlan + L_p - 1, dyPlan + W_p, dyPlan + W_p + 14, `1 + ${(L_p - 2).toFixed(0)} + 1 (總長 ${L_p.toFixed(0)}cm)`, '#38bdf8', 6.5);
  }
  drawWorldText(dxPlan + 0.5 * L_p, dyPlan - 16, '預 鑄 塊 平 面 圖', 10.5, '#38bdf8', 'center', 'middle');
  drawWorldLine(dxPlan + 15, dyPlan - 24, dxPlan + L_p - 15, dyPlan - 24, '#38bdf8', 1.6);

  // ==========================================================================
  // 視圖 5 (中下區)：【預鑄塊正面圖】(*D24~*D31: 長 125=3+119+3, 高 48.7=3+42.7+3)
  // ==========================================================================
  const dxFront = 310, dyFront = -45;
  const H_f = m.H_blk;
  // 外框、中框與內框三層倒角矩形 (Handle 72A5~72C8)
  drawWorldPoly([[dxFront, dyFront], [dxFront + L_p, dyFront], [dxFront + L_p, dyFront + H_f], [dxFront, dyFront + H_f]], '#facc15', 1.8, 'rgba(30, 41, 59, 0.55)', true);
  drawWorldPoly([[dxFront + 1, dyFront + 1], [dxFront + L_p - 1, dyFront + 1], [dxFront + L_p - 1, dyFront + H_f - 1], [dxFront + 1, dyFront + H_f - 1]], '#facc15', 1.1, null, true);
  drawWorldPoly([[dxFront + 3, dyFront + 3], [dxFront + L_p - 3, dyFront + 3], [dxFront + L_p - 3, dyFront + H_f - 3], [dxFront + 3, dyFront + H_f - 3]], '#facc15', 1.4, null, true);

  // 四角倒角斜線
  drawWorldLine(dxFront, dyFront, dxFront + 1, dyFront + 1, '#facc15', 1.1);
  drawWorldLine(dxFront + L_p, dyFront, dxFront + L_p - 1, dyFront + 1, '#facc15', 1.1);
  drawWorldLine(dxFront, dyFront + H_f, dxFront + 1, dyFront + H_f - 1, '#facc15', 1.1);
  drawWorldLine(dxFront + L_p, dyFront + H_f, dxFront + L_p - 1, dyFront + H_f - 1, '#facc15', 1.1);

  // 頂部兩處凸出吊放筋耳 (Handle 72AD~72B6, 72C0~72C4)
  [rib1X + 2, rib2X + 2].forEach(lx => {
    drawWorldPoly([
      [lx - 2, dyFront + H_f],
      [lx - 2, dyFront + H_f + 1.5],
      [lx, dyFront + H_f + 6.0],
      [lx + 6, dyFront + H_f + 6.0],
      [lx + 8, dyFront + H_f + 1.5],
      [lx + 8, dyFront + H_f]
    ], '#facc15', 1.4, null, false);
    drawWorldLine(lx, dyFront + H_f, lx, dyFront + H_f + 6.0, '#facc15', 1.2);
    drawWorldLine(lx + 6, dyFront + H_f, lx + 6, dyFront + H_f + 6.0, '#facc15', 1.2);
  });

  if (state.showDims) {
    drawHorizDim(dxFront, dyFront + H_f + 6, dxFront + L_p, dyFront + H_f + 6, dyFront + H_f + 18, `${L_p.toFixed(0)}`, '#38bdf8', 6.5);
    drawHorizDim(dxFront + 3, dyFront, dxFront + L_p - 3, dyFront, dyFront - 14, `3 + ${(L_p - 6).toFixed(0)} + 3`, '#38bdf8', 6.5);
    drawVertDim(dxFront + L_p, dyFront + 3, dxFront + L_p, dyFront + H_f - 3, dxFront + L_p + 14, `3+${(H_f - 6).toFixed(1)}+3`, '#38bdf8', 6.5);
    drawVertDim(dxFront + L_p, dyFront, dxFront + L_p, dyFront + H_f, dxFront + L_p + 30, `${H_f.toFixed(1)}`, '#38bdf8', 6.5);
  }
  drawWorldText(dxFront + 0.5 * L_p, dyFront - 30, '預 鑄 塊 正 面 圖', 10.5, '#38bdf8', 'center', 'middle');
  drawWorldLine(dxFront + 15, dyFront - 38, dxFront + L_p - 15, dyFront - 38, '#38bdf8', 1.6);

  // ==========================================================================
  // 視圖 6 (右下區)：【預鑄塊 3D 立體圖】與【產品規範框】(100% 還原視埠 AF16 & AFD3)
  // ==========================================================================
  const dxIso = 515, dyIso = 55, scIso = 1.45;
  DXF_0405_2_ISO3D_LINES.forEach(seg => {
    drawWorldLine(
      dxIso + seg[0][0] * scIso, dyIso + seg[0][1] * scIso,
      dxIso + seg[1][0] * scIso, dyIso + seg[1][1] * scIso,
      '#facc15', 1.5
    );
  });
  drawWorldText(dxIso + 35 * scIso, dyIso - 16, '預 鑄 塊 立 體 圖', 10.5, '#38bdf8', 'center', 'middle');
  drawWorldLine(dxIso + 5, dyIso - 24, dxIso + 65 * scIso, dyIso - 24, '#38bdf8', 1.6);

  // 原圖視埠 AFD3「產品規範」框 (Handle AAA5)
  const boxSpecX = 495, boxSpecY = 10;
  drawWorldPoly([[boxSpecX, boxSpecY], [boxSpecX + 195, boxSpecY], [boxSpecX + 195, boxSpecY - 68], [boxSpecX, boxSpecY - 68]], '#38bdf8', 1.3, 'rgba(15, 23, 42, 0.80)', true);
  drawWorldText(boxSpecX + 8, boxSpecY - 12, '【產品規範 (原圖 MTEXT AAA5)】：', 7.2, '#fbbf24', 'left', 'middle');
  drawWorldText(boxSpecX + 8, boxSpecY - 26, '1. 混凝土工程應符合第03310章「結構用混凝土」規定。', 6.4, '#f8fafc', 'left', 'middle');
  drawWorldText(boxSpecX + 8, boxSpecY - 40, '2. 預鑄塊混凝土抗壓強度為 245 kgf/cm² 以上。', 6.4, '#4ade80', 'left', 'middle');
  drawWorldText(boxSpecX + 8, boxSpecY - 54, '3. 須為工廠預鑄且養護7日以上，再自然養護21天。', 6.4, '#f8fafc', 'left', 'middle');

  // ==========================================================================
  // E. 下方區：【圖面內建工程數量計算式表 (On-Canvas & DXF Table)】
  // ==========================================================================
  drawQuantityTableOnCanvas(m, -145, -110);
}

// ----------------------------------------------------------------------------
// 繪製 0405-1《預鑄舖排式護岸(一)》四視圖 (斷面圖、平面圖、立面圖、詳圖A) + 數量表
// ----------------------------------------------------------------------------
function render0405_1(m) {
  // 1. 左上【0405-1 斷面圖 (雙岸對稱護岸 R.C 箱，坡度 1:0.7)】
  const cx = 180, cy = 120;
  const halfBedW = 90;
  const fndW = m.B_rc_fnd * 0.5;
  const fndH = m.H_rc_fnd * 0.5;

  // 渠道中心線 ℄
  drawWorldLine(cx, cy - fndH - 30, cx, cy + 220, '#38bdf8', 1.2, [10, 4, 2, 4]);
  drawWorldText(cx, cy + 232, '℄ 河道中心線', 8.0, '#38bdf8', 'center', 'middle');

  // 左右兩岸對稱繪製
  [-1, 1].forEach(dir => {
    const xToe = cx + dir * halfBedW;
    // 210 kgf/cm² 混凝土基礎台 (Handle 71C8, 71C9)
    const fndPoly = [
      [xToe, cy],
      [xToe - dir * 30, cy],
      [xToe - dir * 30, cy - fndH],
      [xToe + dir * (fndW - 30), cy - fndH],
      [xToe + dir * (fndW - 30), cy - 32]
    ];
    drawWorldPoly(fndPoly, '#facc15', 1.8, 'rgba(148, 163, 184, 0.22)', true);

    // N_rc 階斜向護岸 R.C 箱 (Handle 6ED6, 6ED9, 6EDC, 6EDF, 坡度 1:m_rc)
    const stepH = 74.0;
    const stepW = stepH * m.m_rc;
    const boxThick = 42.0;
    const ang = Math.atan2(stepH, stepW);
    const nx = dir * Math.sin(ang) * boxThick;
    const ny = -Math.cos(ang) * boxThick;

    for (let k = 0; k < m.N_rc; k++) {
      const x1 = xToe + dir * k * stepW;
      const y1 = cy + k * stepH;
      const x2 = xToe + dir * (k + 1) * stepW;
      const y2 = cy + (k + 1) * stepH;
      const boxPoly = [
        [x1, y1],
        [x2, y2],
        [x2 + nx, y2 + ny],
        [x1 + nx, y1 + ny]
      ];
      drawWorldPoly(boxPoly, '#facc15', 2.0, 'rgba(56, 189, 248, 0.14)', true);
      // 內部箱室分隔線与鋼索穿孔圓點 (Handle 6FD1~6FDC)
      drawWorldLine(x1 + 0.2 * nx, y1 + 0.2 * ny, x2 + 0.2 * nx, y2 + 0.2 * ny, '#facc15', 1.1);
      drawWorldCircle(0.5 * (x1 + x2) + 0.5 * nx, 0.5 * (y1 + y2) + 0.5 * ny, 3.2, '#ef4444', '#ef4444');
    }

    // 頂部水平回填段 B 與 PE 土包袋 (Handle 6FCB, 6FCC)
    const xTopInner = xToe + dir * m.N_rc * stepW;
    const yTopInner = cy + m.N_rc * stepH;
    const xTopOuter = xTopInner + dir * (m.rc_B * 0.5);
    drawWorldLine(xTopInner, yTopInner, xTopOuter, yTopInner + 15, '#22c55e', 1.8);
    drawWorldText(xTopInner + dir * 35, yTopInner - 25, '回填土 & PE土包袋', 7.0, '#4ade80', 'center', 'middle');
    drawWorldText(xTopInner - dir * 18, yTopInner - 35, `1:${m.m_rc.toFixed(1)}`, 7.5, '#38bdf8', 'center', 'middle');

    if (state.showDims) {
      drawHorizDim(xTopInner, yTopInner + 15, xTopOuter, yTopInner + 15, yTopInner + 32, `B=${(m.rc_B/100).toFixed(2)}m`, '#38bdf8', 6.8);
      drawHorizDim(cx, yTopInner + 15, xTopOuter, yTopInner + 15, yTopInner + 52, `L=${(m.rc_L/100).toFixed(2)}m`, '#38bdf8', 6.8);
    }
  });

  // 河床原地面高基準線
  drawWorldLine(cx - halfBedW, cy, cx + halfBedW, cy, '#22c55e', 1.6, [6, 4]);
  drawWorldText(cx, cy + 12, '原地面高 (河床底不舖設PE土包袋)', 7.2, '#4ade80', 'center', 'middle');
  drawWorldText(cx - halfBedW - 40, cy - fndH - 12, '210 kgf/cm² 混凝土基礎', 7.2, '#fbbf24', 'center', 'middle');

  drawWorldText(cx, cy - fndH - 42, '0405-1 預鑄舖排式護岸(一) 斷面圖', 12.0, '#38bdf8', 'center', 'middle');

  // 2. 右上【0405-1 平面圖 & 立面圖 & 詳圖 A (鋼絞索夾扣固定大樣)】
  const px = 490, py = 80;
  for (let col = 0; col < 5; col++) {
    const gx = px + col * 42;
    drawWorldPoly([[gx, py], [gx + 40, py], [gx + 40, py + 140], [gx, py + 140]], '#facc15', 1.6, 'rgba(30, 41, 59, 0.55)', true);
    drawWorldLine(gx, py + 70, gx + 40, py + 70, '#facc15', 1.2);
  }
  // 縱橫向鍍鋅鋼絞索紅線
  [py + 25, py + 70, py + 115].forEach(ry => {
    drawWorldLine(px - 10, ry, px + 220, ry, '#ef4444', 1.8);
  });
  drawWorldText(px + 105, py + 165, '每間距約2.2m一處 Ø16mm 鋼絞索 L=2.6m，夾扣4組', 7.2, '#fbbf24', 'center', 'middle');
  drawWorldText(px + 105, py + 150, 'Ø6mm 鍍鋅鋼索穿入吊放筋後以 12# 包覆 PVC 鍍鋅鐵線捆紮固定', 7.0, '#38bdf8', 'center', 'middle');
  drawWorldText(px + 105, py - 22, '0405-1 護岸 R.C 箱平面與立面鋼索配置圖', 11.5, '#38bdf8', 'center', 'middle');

  // 下方工程數量計算表
  drawQuantityTableOnCanvas(m, -145, -110);
}

function drawQuantityTableOnCanvas(m, tblX, tblYTop) {
  const colWidths = [45, 310, 65, 420, 110, 110, 290];
  const tblW = colWidths.reduce((a, b) => a + b, 0);
  const rowH = 22;
  const headerH = 26;
  const titleH = 30;

  drawWorldPoly([
    [tblX, tblYTop],
    [tblX + tblW, tblYTop],
    [tblX + tblW, tblYTop - titleH],
    [tblX, tblYTop - titleH]
  ], '#38bdf8', 1.8, 'rgba(2, 132, 199, 0.22)', true);
  drawWorldText(
    tblX + tblW / 2,
    tblYTop - titleH / 2,
    `預鑄舖排式護岸 (圖號 ${m.dwg_mode}) 工程數量計算式表 【單元長 L=${m.Lm.toFixed(1)}m，總高 H=${(m.H_revetment/100).toFixed(2)}m，下${m.N_stone}層裝石頭 + 上${m.N_soil}層裝土壤】`,
    9.0, '#f8fafc', 'center', 'middle'
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
    drawWorldText(curX + w / 2, yHdrTop - headerH / 2, h, 7.8, '#38bdf8', 'center', 'middle');
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
    drawWorldText(cx + colWidths[0] / 2, rMid, q.id, 7.5, '#cbd5e1', 'center', 'middle'); cx += colWidths[0];
    drawWorldText(cx + 8, rMid, q.name, 7.5, '#f8fafc', 'left', 'middle'); cx += colWidths[1];
    drawWorldText(cx + colWidths[2] / 2, rMid, q.unit, 7.5, '#cbd5e1', 'center', 'middle'); cx += colWidths[2];
    drawWorldText(cx + 8, rMid, q.formula, 7.2, '#fbbf24', 'left', 'middle'); cx += colWidths[3];
    drawWorldText(cx + colWidths[4] - 10, rMid, q.perM.toFixed(3), 7.5, '#38bdf8', 'right', 'middle'); cx += colWidths[4];
    drawWorldText(cx + colWidths[5] - 10, rMid, q.total.toFixed(2), 8.0, '#4ade80', 'right', 'middle'); cx += colWidths[5];
    drawWorldText(cx + 8, rMid, q.note, 7.0, '#94a3b8', 'left', 'middle');
  });

  const yTblBot = yHdrBot - m.quantities.length * rowH;
  drawWorldPoly([
    [tblX, tblYTop],
    [tblX + tblW, tblYTop],
    [tblX + tblW, yTblBot],
    [tblX, yTblBot]
  ], '#38bdf8', 1.8, null, true);
}

// ============================================================================
// 7. 自動計算全圖 Bounding Box 並置中縮放 (zoomToFit)
// ============================================================================
function zoomToFit() {
  canvas.width = Math.max(600, container.clientWidth || (window.innerWidth - 435));
  canvas.height = Math.max(500, container.clientHeight || (window.innerHeight - 42));

  const m = computeModel();
  const minX = -170;
  const maxX = 1230;
  const minY = -110 - 56 - m.quantities.length * 22 - 30;
  const maxY = Math.max(m.H_revetment + 60, 360);

  const worldW = Math.max(100, maxX - minX);
  const worldH = Math.max(100, maxY - minY);
  const pad = 0.90;
  const scaleX = (canvas.width * pad) / worldW;
  const scaleY = (canvas.height * pad) / worldH;
  state.scale = Math.max(0.12, Math.min(scaleX, scaleY));
  state.camX = 0.5 * (minX + maxX);
  state.camY = 0.5 * (minY + maxY);

  document.getElementById('hudScale').textContent = `縮放: ${Math.round(state.scale * 100)}%`;
  renderCAD();
}

// ============================================================================
// 8. 無彈窗直接下載 AutoCAD DXF 與 CSV 計算書
// ============================================================================
function toDxfUnicode(str) {
  let out = '';
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    if (code > 127) {
      out += '\\U+' + code.toString(16).toUpperCase().padStart(4, '0');
    } else {
      out += str[i];
    }
  }
  return out;
}

function triggerDirectDownload(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 300);
}

function exportDXF() {
  const m = computeModel();
  let handleSeed = 0x200;
  const nextH = () => (handleSeed++).toString(16).toUpperCase();
  const entities = [];

  function addDxfLine(x1, y1, x2, y2, layer = 'C2', ltype = 'BYLAYER') {
    entities.push(
      `  0\r\nLINE\r\n  5\r\n${nextH()}\r\n330\r\n1F\r\n100\r\nAcDbEntity\r\n  8\r\n${toDxfUnicode(layer)}\r\n  6\r\n${ltype}\r\n100\r\nAcDbLine\r\n 10\r\n${x1.toFixed(4)}\r\n 20\r\n${y1.toFixed(4)}\r\n 30\r\n0.0\r\n 11\r\n${x2.toFixed(4)}\r\n 21\r\n${y2.toFixed(4)}\r\n 31\r\n0.0`
    );
  }

  function addDxfPoly(pts, layer = 'C2', closed = true, ltype = 'BYLAYER') {
    if (!pts || pts.length < 2) return;
    let s = `  0\r\nLWPOLYLINE\r\n  5\r\n${nextH()}\r\n330\r\n1F\r\n100\r\nAcDbEntity\r\n  8\r\n${toDxfUnicode(layer)}\r\n  6\r\n${ltype}\r\n100\r\nAcDbPolyline\r\n 90\r\n${pts.length}\r\n 70\r\n${closed ? 1 : 0}`;
    pts.forEach(p => {
      s += `\r\n 10\r\n${p[0].toFixed(4)}\r\n 20\r\n${p[1].toFixed(4)}`;
    });
    entities.push(s);
  }

  function addDxfText(x, y, text, height = 7.5, layer = 'TEXT', rotDeg = 0) {
    entities.push(
      `  0\r\nTEXT\r\n  5\r\n${nextH()}\r\n330\r\n1F\r\n100\r\nAcDbEntity\r\n  8\r\n${toDxfUnicode(layer)}\r\n100\r\nAcDbText\r\n 10\r\n${x.toFixed(4)}\r\n 20\r\n${y.toFixed(4)}\r\n 30\r\n0.0\r\n 40\r\n${height.toFixed(4)}\r\n  1\r\n${toDxfUnicode(String(text))}\r\n 50\r\n${rotDeg.toFixed(2)}\r\n  7\r\n${toDxfUnicode('中文標楷體')}\r\n100\r\nAcDbText`
    );
  }

  const sx = m.sx, sy = m.sy, fndScaleX = m.B_fnd / 56.75;

  // 1. 護岸斷面圖寫入 DXF
  DXF_0405_2_FOUNDATION_LINES.forEach(seg => {
    addDxfLine(seg[0][0] * fndScaleX, seg[0][1] * sy, seg[1][0] * fndScaleX, seg[1][1] * sy, 'C2');
  });

  for (let i = 0; i < m.N_total; i++) {
    const bx = 10.80 * sx + i * m.stepDx;
    const by = 19.44 * sy + i * m.stepDy;
    DXF_0405_2_SLOPE_BLOCK_LINES.forEach(seg => {
      addDxfLine(bx + seg[0][0] * sx, by + seg[0][1] * sy, bx + seg[1][0] * sx, by + seg[1][1] * sy, 'C2');
    });
    if (i < m.N_stone) {
      DXF_0405_2_POCKET_STONES.forEach(sPoly => {
        addDxfPoly(sPoly.map(p => [bx + p[0] * sx, by + p[1] * sy]), 'HATCH', true);
      });
    } else {
      addDxfPoly(DXF_0405_2_POCKET_SOIL_POLY.map(p => [bx + p[0] * sx, by + p[1] * sy]), 'HATCH', true);
    }
  }

  const topOriginX = 10.80 * sx + (m.N_total - 1) * m.stepDx;
  const topOriginY = 19.44 * sy + (m.N_total - 1) * m.stepDy;
  DXF_0405_2_SLOPE_CAP_LINES.forEach(seg => {
    addDxfLine(topOriginX + seg[0][0] * sx, topOriginY + seg[0][1] * sy, topOriginX + seg[1][0] * sx, topOriginY + seg[1][1] * sy, 'C2');
  });

  // 2. 預鑄塊斷面圖、蓋板斷面圖、平面圖、正面圖、立體圖寫入 DXF
  const dxBlk = 320, dyBlk = 225, scD = 1.65;
  DXF_0405_2_DETAIL_BLOCK_LINES.forEach(seg => {
    addDxfLine(dxBlk + seg[0][0] * sx * scD, dyBlk + seg[0][1] * sy * scD, dxBlk + seg[1][0] * sx * scD, dyBlk + seg[1][1] * sy * scD, 'C2');
  });

  const dxCap = 520, dyCap = 245, scCap = 1.65;
  addDxfPoly(DXF_0405_2_DETAIL_CAP_POLY.map(p => [dxCap + p[0] * scCap, dyCap + p[1] * scCap]), 'C2', true);

  const dxIso = 515, dyIso = 55, scIso = 1.45;
  DXF_0405_2_ISO3D_LINES.forEach(seg => {
    addDxfLine(dxIso + seg[0][0] * scIso, dyIso + seg[0][1] * scIso, dxIso + seg[1][0] * scIso, dyIso + seg[1][1] * scIso, 'C2');
  });

  // 3. 下方工程數量計算式表寫入 DXF
  const tblX = -145, tblYTop = -110;
  const colWidths = [45, 310, 65, 420, 110, 110, 290];
  const tblW = colWidths.reduce((a, b) => a + b, 0);
  const rowH = 22, headerH = 26, titleH = 30;
  const yHdrTop = tblYTop - titleH, yHdrBot = yHdrTop - headerH;
  const yTblBot = yHdrBot - m.quantities.length * rowH;

  addDxfPoly([[tblX, tblYTop], [tblX + tblW, tblYTop], [tblX + tblW, yTblBot], [tblX, yTblBot]], 'DIM', true);
  addDxfLine(tblX, yHdrTop, tblX + tblW, yHdrTop, 'DIM');
  addDxfLine(tblX, yHdrBot, tblX + tblW, yHdrBot, 'DIM');
  addDxfText(tblX + 260, tblYTop - 20, `預鑄舖排式護岸 (${m.dwg_mode}) 工程數量計算式表 (L=${m.Lm.toFixed(1)}m)`, 9.0, 'TEXT');

  const headers = ['項次', '工程項目名稱', '單位', '數量計算式', '每延公尺', '每單元數量', '備註'];
  let cx = tblX;
  headers.forEach((h, i) => {
    addDxfText(cx + 8, yHdrTop - 18, h, 7.5, 'TEXT');
    if (i > 0) addDxfLine(cx, yHdrTop, cx, yTblBot, 'DIM');
    cx += colWidths[i];
  });

  m.quantities.forEach((q, rIdx) => {
    const rTop = yHdrBot - rIdx * rowH;
    const rBot = rTop - rowH;
    addDxfLine(tblX, rBot, tblX + tblW, rBot, 'DIM');
    let rx = tblX;
    addDxfText(rx + 12, rBot + 7, q.id, 7.0, 'TEXT'); rx += colWidths[0];
    addDxfText(rx + 6, rBot + 7, q.name, 7.0, 'TEXT'); rx += colWidths[1];
    addDxfText(rx + 10, rBot + 7, q.unit, 7.0, 'TEXT'); rx += colWidths[2];
    addDxfText(rx + 6, rBot + 7, q.formula, 6.8, 'TEXT'); rx += colWidths[3];
    addDxfText(rx + 12, rBot + 7, q.perM.toFixed(3), 7.0, 'TEXT'); rx += colWidths[4];
    addDxfText(rx + 12, rBot + 7, q.total.toFixed(2), 7.0, 'TEXT'); rx += colWidths[5];
    addDxfText(rx + 6, rBot + 7, q.note, 6.8, 'TEXT');
  });

  const dxfHeader = [
    '  0', 'SECTION', '  2', 'HEADER',
    '  9', '$ACADVER', '  1', 'AC1015',
    '  9', '$INSUNITS', ' 70', '5',
    '  9', '$MEASUREMENT', ' 70', '1',
    '  0', 'ENDSEC',
    '  0', 'SECTION', '  2', 'TABLES',
    '  0', 'TABLE', '  2', 'LTYPE', '  5', '5', '330', '0', '100', 'AcDbSymbolTable', ' 70', '4',
    '  0', 'LTYPE', '  5', '14', '330', '5', '100', 'AcDbSymbolTableRecord', '100', 'AcDbLinetypeTableRecord', '  2', 'BYBLOCK', ' 70', '0', '  3', '', ' 72', '65', ' 73', '0', ' 40', '0.0',
    '  0', 'LTYPE', '  5', '15', '330', '5', '100', 'AcDbSymbolTableRecord', '100', 'AcDbLinetypeTableRecord', '  2', 'BYLAYER', ' 70', '0', '  3', '', ' 72', '65', ' 73', '0', ' 40', '0.0',
    '  0', 'LTYPE', '  5', '16', '330', '5', '100', 'AcDbSymbolTableRecord', '100', 'AcDbLinetypeTableRecord', '  2', 'CONTINUOUS', ' 70', '0', '  3', 'Solid line', ' 72', '65', ' 73', '0', ' 40', '0.0',
    '  0', 'LTYPE', '  5', '17', '330', '5', '100', 'AcDbSymbolTableRecord', '100', 'AcDbLinetypeTableRecord', '  2', 'DASHED', ' 70', '0', '  3', 'Dashed', ' 72', '65', ' 73', '2', ' 40', '12.0', ' 49', '8.0', ' 74', '0', ' 49', '-4.0', ' 74', '0',
    '  0', 'ENDTAB',
    '  0', 'TABLE', '  2', 'LAYER', '  5', '2', '330', '0', '100', 'AcDbSymbolTable', ' 70', '5',
    '  0', 'LAYER', '  5', '10', '330', '2', '100', 'AcDbSymbolTableRecord', '100', 'AcDbLayerTableRecord', '  2', '0', ' 70', '0', ' 62', '7', '  6', 'CONTINUOUS', '370', '-3', '390', 'F',
    '  0', 'LAYER', '  5', '21', '330', '2', '100', 'AcDbSymbolTableRecord', '100', 'AcDbLayerTableRecord', '  2', 'C2', ' 70', '0', ' 62', '2', '  6', 'CONTINUOUS', '370', '-3', '390', 'F',
    '  0', 'LAYER', '  5', '22', '330', '2', '100', 'AcDbSymbolTableRecord', '100', 'AcDbLayerTableRecord', '  2', 'HATCH', ' 70', '0', ' 62', '6', '  6', 'CONTINUOUS', '370', '-3', '390', 'F',
    '  0', 'LAYER', '  5', '23', '330', '2', '100', 'AcDbSymbolTableRecord', '100', 'AcDbLayerTableRecord', '  2', 'DIM', ' 70', '0', ' 62', '4', '  6', 'CONTINUOUS', '370', '-3', '390', 'F',
    '  0', 'LAYER', '  5', '24', '330', '2', '100', 'AcDbSymbolTableRecord', '100', 'AcDbLayerTableRecord', '  2', 'TEXT', ' 70', '0', ' 62', '7', '  6', 'CONTINUOUS', '370', '-3', '390', 'F',
    '  0', 'ENDTAB',
    '  0', 'TABLE', '  2', 'STYLE', '  5', '3', '330', '0', '100', 'AcDbSymbolTable', ' 70', '2',
    '  0', 'STYLE', '  5', '11', '330', '3', '100', 'AcDbSymbolTableRecord', '100', 'AcDbTextStyleTableRecord', '  2', 'Standard', ' 70', '0', ' 40', '0.0', ' 41', '1.0', ' 50', '0.0', ' 71', '0', ' 42', '2.5', '  3', 'arial.ttf', '  4', '',
    '  0', 'STYLE', '  5', '12', '330', '3', '100', 'AcDbSymbolTableRecord', '100', 'AcDbTextStyleTableRecord', '  2', toDxfUnicode('中文標楷體'), ' 70', '0', ' 40', '0.0', ' 41', '1.0', ' 50', '0.0', ' 71', '0', ' 42', '2.5', '  3', 'kaiu.ttf', '  4', '', '1001', 'ACAD', '1000', 'DFKai-SB', '1071', '34881',
    '  0', 'ENDTAB',
    '  0', 'TABLE', '  2', 'VIEW', '  5', '6', '330', '0', '100', 'AcDbSymbolTable', ' 70', '0', '  0', 'ENDTAB',
    '  0', 'TABLE', '  2', 'UCS', '  5', '7', '330', '0', '100', 'AcDbSymbolTable', ' 70', '0', '  0', 'ENDTAB',
    '  0', 'TABLE', '  2', 'APPID', '  5', '9', '330', '0', '100', 'AcDbSymbolTable', ' 70', '1',
    '  0', 'APPID', '  5', '13', '330', '9', '100', 'AcDbSymbolTableRecord', '100', 'AcDbRegAppTableRecord', '  2', 'ACAD', ' 70', '0',
    '  0', 'ENDTAB',
    '  0', 'TABLE', '  2', 'DIMSTYLE', '  5', 'A', '330', '0', '100', 'AcDbSymbolTable', ' 70', '1', '100', 'AcDbDimStyleTable', ' 71', '0',
    '  0', 'DIMSTYLE', '105', '27', '330', 'A', '100', 'AcDbSymbolTableRecord', '100', 'AcDbDimStyleTableRecord', '  2', 'Standard', ' 70', '0', ' 40', '1.0', '340', '11',
    '  0', 'ENDTAB',
    '  0', 'TABLE', '  2', 'BLOCK_RECORD', '  5', '1', '330', '0', '100', 'AcDbSymbolTable', ' 70', '2',
    '  0', 'BLOCK_RECORD', '  5', '1F', '330', '1', '100', 'AcDbSymbolTableRecord', '100', 'AcDbBlockTableRecord', '  2', '*Model_Space',
    '  0', 'BLOCK_RECORD', '  5', '1E', '330', '1', '100', 'AcDbSymbolTableRecord', '100', 'AcDbBlockTableRecord', '  2', '*Paper_Space',
    '  0', 'ENDTAB',
    '  0', 'ENDSEC',
    '  0', 'SECTION', '  2', 'BLOCKS',
    '  0', 'BLOCK', '  5', '20', '330', '1F', '100', 'AcDbEntity', '  8', '0', '100', 'AcDbBlockBegin', '  2', '*Model_Space', ' 70', '0', ' 10', '0.0', ' 20', '0.0', ' 30', '0.0', '  3', '*Model_Space', '  1', '',
    '  0', 'ENDBLK', '  5', '28', '330', '1F', '100', 'AcDbEntity', '  8', '0', '100', 'AcDbBlockEnd',
    '  0', 'BLOCK', '  5', '29', '330', '1E', '100', 'AcDbEntity', ' 67', '1', '  8', '0', '100', 'AcDbBlockBegin', '  2', '*Paper_Space', ' 70', '0', ' 10', '0.0', ' 20', '0.0', ' 30', '0.0', '  3', '*Paper_Space', '  1', '',
    '  0', 'ENDBLK', '  5', '2A', '330', '1E', '100', 'AcDbEntity', ' 67', '1', '  8', '0', '100', 'AcDbBlockEnd',
    '  0', 'ENDSEC',
    '  0', 'SECTION', '  2', 'ENTITIES'
  ].join('\r\n');

  const dxfFooter = [
    '  0', 'ENDSEC',
    '  0', 'SECTION', '  2', 'OBJECTS',
    '  0', 'DICTIONARY', '  5', 'C', '330', '0', '100', 'AcDbDictionary', '281', '1',
    '  3', 'ACAD_GROUP', '350', 'D',
    '  3', 'ACAD_PLOTSTYLENAME', '350', 'E',
    '  0', 'DICTIONARY', '  5', 'D', '330', 'C', '100', 'AcDbDictionary', '281', '1',
    '  0', 'ACDBDICTIONARYWDFLT', '  5', 'E', '330', 'C', '100', 'AcDbDictionary', '281', '1', '  3', 'Normal', '350', 'F', '100', 'AcDbDictionaryWithDefault', '340', 'F',
    '  0', 'ACDBPLACEHOLDER', '  5', 'F', '330', 'E',
    '  0', 'ENDSEC',
    '  0', 'EOF', ''
  ].join('\r\n');

  const fullDxf = dxfHeader + '\r\n' + entities.join('\r\n') + '\r\n' + dxfFooter;
  triggerDirectDownload(fullDxf, `${m.dwg_mode}_預鑄舖排式護岸_${m.N_total}層.dxf`, 'application/dxf;charset=utf-8');
}

function exportCSV() {
  const m = computeModel();
  const rows = [
    [`水土保持標準圖 ${m.dwg_mode} 預鑄舖排式護岸 — 工程數量計算書`],
    ['設計參數摘要', `總層數=${m.N_total}層(下${m.N_stone}層裝石頭+上${m.N_soil}層裝土壤)`, `護岸總高H=${m.H_revetment.toFixed(1)}cm`, `預鑄塊=${m.L_blk}x${m.H_blk}x${m.B_blk}cm`, `蓋板a=${m.cap_a}xb=${m.cap_b}cm`, `分段長L=${m.Lm.toFixed(1)}m`],
    [],
    ['項次', '工程項目名稱', '單位', '數量計算式 (對應圖面尺寸)', '每延公尺數量', `每單元數量 (${m.Lm.toFixed(1)}m)`, '設計規範與備註']
  ];
  m.quantities.forEach(q => {
    rows.push([q.id, q.name, q.unit, q.formula, q.perM.toFixed(3), q.total.toFixed(2), q.note]);
  });

  const csvContent = '\uFEFF' + rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\r\n');
  triggerDirectDownload(csvContent, `${m.dwg_mode}_預鑄舖排式護岸_數量計算書.csv`, 'text/csv;charset=utf-8');
}

// ============================================================================
// 9. 事件綁定與初始化
// ============================================================================
function initApp() {
  const resizeCanvas = () => {
    canvas.width = Math.max(600, container.clientWidth || (window.innerWidth - 435));
    canvas.height = Math.max(500, container.clientHeight || (window.innerHeight - 42));
    renderCAD();
  };
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  const inpGravTop = document.getElementById('inp_t_grav_top');
  const inpGravBot = document.getElementById('inp_t_grav_bot');
  const chkSyncGravelW = document.getElementById('chkSyncGravelW');

  const syncGravelTopToBot = () => {
    if (chkSyncGravelW.checked) {
      inpGravBot.value = inpGravTop.value;
    }
    renderCAD();
  };
  inpGravTop.addEventListener('input', syncGravelTopToBot);
  inpGravTop.addEventListener('change', syncGravelTopToBot);

  inpGravBot.addEventListener('input', () => {
    if (inpGravBot.value !== inpGravTop.value) {
      chkSyncGravelW.checked = false;
    }
    renderCAD();
  });

  chkSyncGravelW.addEventListener('change', () => {
    if (chkSyncGravelW.checked) {
      inpGravBot.value = inpGravTop.value;
      renderCAD();
    }
  });

  const inputs = document.querySelectorAll('.sidebar input:not(#inp_t_grav_top):not(#inp_t_grav_bot):not(#chkSyncGravelW), .sidebar select');
  inputs.forEach(el => {
    el.addEventListener('input', () => renderCAD());
    el.addEventListener('change', () => renderCAD());
  });

  document.getElementById('chkShowOrigRef').addEventListener('change', e => {
    state.showOrigRef = e.target.checked;
    renderCAD();
  });
  document.getElementById('chkShowHatch').addEventListener('change', e => {
    state.showHatch = e.target.checked;
    renderCAD();
  });
  document.getElementById('chkShowDims').addEventListener('change', e => {
    state.showDims = e.target.checked;
    renderCAD();
  });

  document.getElementById('btnToggleOrigOverlay').addEventListener('click', () => {
    const chk = document.getElementById('chkShowOrigRef');
    chk.checked = !chk.checked;
    state.showOrigRef = chk.checked;
    renderCAD();
  });

  document.getElementById('btnToggleSpec').addEventListener('click', () => {
    const drawer = document.getElementById('specDrawer');
    drawer.style.display = drawer.style.display === 'block' ? 'none' : 'block';
  });

  document.getElementById('btnExportDXF').addEventListener('click', exportDXF);
  document.getElementById('btnExportCSV').addEventListener('click', exportCSV);
  document.getElementById('btnZoomFit').addEventListener('click', zoomToFit);

  document.getElementById('btnResetDefault').addEventListener('click', () => {
    document.getElementById('sel_dwg_mode').value = '0405-2';
    document.getElementById('inp_N_stone').value = 3;
    document.getElementById('inp_N_soil').value = 4;
    document.getElementById('inp_H_blk').value = 48.7;
    document.getElementById('inp_B_blk').value = 34.1;
    document.getElementById('inp_L_blk').value = 125.0;
    document.getElementById('inp_t_wall').value = 10.0;
    document.getElementById('inp_h_lip').value = 15.6;
    document.getElementById('inp_S_back').value = 55.9;
    document.getElementById('inp_cap_a').value = 46.9;
    document.getElementById('inp_cap_b').value = 14.6;
    document.getElementById('inp_t_cap').value = 10.0;
    document.getElementById('inp_B_fnd').value = 56.8;
    chkSyncGravelW.checked = true;
    document.getElementById('inp_t_grav_top').value = 20;
    document.getElementById('inp_t_grav_bot').value = 20;
    document.getElementById('inp_t_pc').value = 5.0;
    document.getElementById('inp_w_pc').value = 5.0;
    document.getElementById('inp_R1').value = 0;
    document.getElementById('inp_L_unit').value = 1000;
    zoomToFit();
  });

  canvas.addEventListener('mousedown', e => {
    if (e.button === 0) {
      state.isDragging = true;
      state.lastMouseX = e.clientX;
      state.lastMouseY = e.clientY;
    }
  });
  window.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    const wPos = screenToWorld(e.clientX - rect.left, e.clientY - rect.top);
    document.getElementById('hudCoords').textContent = `X: ${wPos.x.toFixed(1)}, Y: ${wPos.y.toFixed(1)} cm`;

    if (state.isDragging) {
      const dx = e.clientX - state.lastMouseX;
      const dy = e.clientY - state.lastMouseY;
      state.camX -= dx / state.scale;
      state.camY += dy / state.scale;
      state.lastMouseX = e.clientX;
      state.lastMouseY = e.clientY;
      renderCAD();
    }
  });
  window.addEventListener('mouseup', () => { state.isDragging = false; });

  canvas.addEventListener('wheel', e => {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const before = screenToWorld(mx, my);
    const factor = e.deltaY < 0 ? 1.12 : 0.89;
    state.scale = Math.max(0.08, Math.min(8.0, state.scale * factor));
    const after = screenToWorld(mx, my);
    state.camX += (before.x - after.x);
    state.camY += (before.y - after.y);
    document.getElementById('hudScale').textContent = `縮放: ${Math.round(state.scale * 100)}%`;
    renderCAD();
  }, { passive: false });

  canvas.addEventListener('dblclick', zoomToFit);

  requestAnimationFrame(() => {
    zoomToFit();
  });
}

if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

  // ---- v6.3：模型數量改由圖面多邊形實算（qfixmod.js qfFixModel）；圖面數量表同步 ----
  { const __cm = computeModel; computeModel = function () { const m = __cm(); try { if (typeof qfFixModel === 'function') qfFixModel('p405', m); } catch (e) { } return m; }; }
  // ---- 圖元輸出（覆寫原工具的 Canvas 繪圖函式）----

  function drawWorldLine(x1, y1, x2, y2, color = '#ffffff', lineWidth = 1.5, dash = []) { O.push({ k: 'L', p: [[x1, y1], [x2, y2]], c: color, w: lineWidth, d: dash || [] }); }
  function drawWorldPoly(pts, strokeColor = '#ffffff', lineWidth = 1.5, fillColor = null, close = true, dash = []) { if (pts && pts.length >= 2) O.push({ k: 'P', p: pts.map(q => [q[0], q[1]]), c: strokeColor, w: lineWidth, f: fillColor, cl: close, d: dash || [] }); }
  function drawWorldCircle(wx, wy, rWorld, strokeColor = '#ffffff', fillColor = null, lineWidth = 1.2) { O.push({ k: 'C', x: wx, y: wy, r: rWorld, c: strokeColor, f: fillColor, w: lineWidth }); }
  function drawWorldText(wx, wy, text, heightWorld = 8.5, color = '#ffffff', align = 'center', baseline = 'middle', rotRad = 0) { O.push({ k: 'T', x: wx, y: wy, s: String(text), h: heightWorld, c: color, al: align, bl: baseline, rot: rotRad }); }
  function drawDxfGravelRegion(outerPoly, tileSizeWorld = 30.0, strokeColor = '#c084fc') { if (outerPoly && outerPoly.length >= 3) O.push({ k: 'G', outer: outerPoly, holes: [], tile: tileSizeWorld, c: strokeColor, segs: GRAVEL_TILE_SEGS }); }

  const toRR = R => { const o = {}; Object.keys(R || {}).forEach(k => { o[k.startsWith('sel_') ? k : 'inp_' + k] = R[k]; }); return o; };
  return {
    DEF,
    model(R) { RR = toRR(R); try { const m = computeModel(); m.__R = Object.assign({}, R); return m; } finally { RR = null; } },
    prims(m, OPT, part) { RR = toRR(m && m.__R); O = []; try { renderCAD(); return O; } finally { RR = null; } }
  };
})();
