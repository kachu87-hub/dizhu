/* ===================== v5.6 固床工原圖移植（自使用者原工具自動抽出，勿手改；改 gen_or3.py） ===================== */
var TCO_S = window.TCO_S || (window.TCO_S = {});
TCO_S['r0607'] = (function () {   // 水保標準圖參數化 CAD — 石樑固床工 (圖號：0607-1)
  const DEF = {"p_W_bed": "900", "p_d_main": "100", "p_r_sub": "0.50", "p_r_minor": "0.25", "p_ang_L": "37.9", "p_ang_pad": "15", "p_H_drop": "35", "p_D_conn": "35", "p_k_gap": "1.0", "p_N_layer": "3", "chkShowRefDxf": false, "chkShowNotes": true, "p_LReq": "1", "p_WhL": "450", "p_WhR": "450", "p_k_sh": "0.68", "p_r_w": "0.85", "p_r_l": "0.90", "p_c_ex": "2.4", "p_c_cw": "1.4", "p_k_cn": "0.78", "p_pad_l": "1.25", "p_pad_t": "0.55", "p_k_pd": "0.75"};
  let RR = null, OPT = {}, O = [];
  const EL = {}, CTX = new Proxy({}, { get: (t, k) => (k in t ? t[k] : () => ({ width: 0 })), set: (t, k, v) => { t[k] = v; return true; } });
  const el = id => EL[id] || (EL[id] = { get value() { const v = RR && RR[id] !== undefined && RR[id] !== null && RR[id] !== '' ? RR[id] : DEF[id]; return v === undefined ? '' : String(v); }, set value(v) {},
    get checked() { return OPT[id] !== undefined ? !!OPT[id] : !!DEF[id]; }, set checked(v) {}, textContent: '', innerHTML: '', style: {}, width: 1600, height: 1000, classList: { add() {}, remove() {}, toggle() {} },
    addEventListener() {}, appendChild() {}, getContext() { return CTX; }, getBoundingClientRect: () => ({ left: 0, top: 0, width: 1600, height: 1000 }), parentElement: { getBoundingClientRect: () => ({ left: 0, top: 0, width: 1600, height: 1000 }) } });
  const document = { getElementById: el, querySelectorAll: () => [], querySelector: () => null, createElement: () => ({ click() {}, style: {}, className: '', innerHTML: '', appendChild() {}, querySelectorAll: () => [], querySelector: () => ({ addEventListener() {}, getAttribute: () => '0', value: '' }) }), body: { appendChild() {}, removeChild() {} } };
  const window = { addEventListener() {}, innerWidth: 1990, innerHeight: 1044, devicePixelRatio: 1 };
  const requestAnimationFrame = () => 0, alert = () => {};

// ============================================================================
// 1. 6-07.dxf 原圖 5 大視圖 De Boor B-Spline 與聚合線頂點庫 (單位：m，渲染時轉 cm)
//    - 已嚴格濾除斷面圖 F9D7~F9F2 共 28 條自然河床斜線孵化
//    - 已嚴格濾除平面圖 FD08, FD09 紫色虛線與沖刷深潭圈範圍
//    - 原檔無混凝土基礎，100% 忠於原檔純石樑結構線條
// ============================================================================
const RAW_DXF_VIEWS = {
  // (A) 斷面圖 (Origin ref: X0=721.403, Y0=926.859 上游河床與力石交點)
  sec: {
    x0: 721.403, y0: 926.859,
    baseD: 2.20,
    splines: [
      { role: 'main_stone', layer: '塊石', closed: true, pts: [[722.41,926.791],[722.193,926.887],[721.844,927.269],[721.852,928.013],[722.385,928.525],[723.131,928.547],[723.799,928.941],[724.598,928.845],[724.862,928.142],[724.889,927.398],[724.109,926.814],[723.242,926.647],[722.592,926.711]] },
      { role: 'pad_stone', layer: '塊石', closed: true, pts: [[725.59,926.843],[725.294,926.611],[724.93,926.67],[724.44,926.859],[724.561,927.156],[724.775,927.341],[725.104,927.29],[725.453,927.274],[725.598,927.047]] },
      { role: 'pad_stone', layer: '塊石', closed: true, pts: [[725.115,927.291],[724.75,927.293],[725.012,928.003],[725.82,927.793],[725.55,927.169],[725.277,927.273]] },
      { role: 'pad_stone', layer: '塊石', closed: true, pts: [[723.636,925.873],[723.308,925.902],[722.939,926.066],[722.928,926.485],[723.279,926.721],[723.715,926.703],[724.128,926.967],[724.583,926.826],[725.032,926.627],[725.154,926.012],[724.704,925.724],[724.193,925.772]] },
      { role: 'tail_stone', layer: '塊石', closed: true, pts: [[721.584,926.624],[721.398,926.744],[721.403,927.138],[721.763,927.182],[722.024,927.1],[722.186,926.883],[722.45,926.801],[722.378,926.483],[722.037,926.556],[721.768,926.509]] },
      { role: 'water_high', layer: '水管', closed: false, pts: [[718.635,929.666],[719.233,929.686],[720.086,929.121],[721.281,929.35],[722.357,929.357],[723.294,929.328],[724.128,929.485],[724.922,929.336],[725.392,928.911],[725.871,928.904],[726.458,928.904]] },
      { role: 'water_low', layer: '水管', closed: false, pts: [[718.916,927.194],[719.385,927.285],[719.816,927.29],[720.561,927.677],[721.644,928.117],[723.186,928.138],[723.7,928.225],[724.257,928.191],[724.944,928.104],[725.177,928.065]] }
    ]
  },

  // (B) 正面圖 (Origin ref: X0=735.40 中央主力石中心, Y0=927.30 墊石底)
  front: {
    x0: 735.40, y0: 927.30,
    baseW: 9.0, baseD: 2.50,
    splines: [
      { role: 'main', closed: true, pts: [[734.86,929.803],[734.999,930.08],[735.046,930.405],[735.369,930.503],[735.891,930.365],[736.115,929.661],[736.462,929.018],[736.316,928.262],[735.623,928.039],[734.934,927.993],[734.501,928.501],[734.451,929.051],[734.655,929.463]] },
      { role: 'sub_L', closed: true, pts: [[731.925,929.751],[732.236,930.058],[732.853,929.874],[732.968,929.18],[733.299,928.569],[732.881,928.096],[732.416,928.24],[731.882,928.194],[731.687,928.756],[731.804,929.234]] },
      { role: 'sub_R', closed: true, pts: [[737.343,929.037],[737.547,929.423],[737.704,929.776],[737.707,930.134],[738.022,930.254],[738.407,930.095],[738.687,929.617],[738.848,929.084],[739.004,928.521],[738.463,928.115],[737.83,928.142],[737.296,928.531]] },
      { role: 'minor_L', closed: true, pts: [[731.341,928.965],[731.499,929.156],[731.718,929.079],[731.716,928.646],[731.43,928.652],[731.256,928.803]] },
      { role: 'minor_L', closed: true, pts: [[730.936,928.707],[731.054,928.8],[731.193,928.846],[731.462,928.638],[731.291,928.384],[730.908,928.377],[730.984,928.6]] },
      { role: 'minor_R', closed: true, pts: [[739.217,929.178],[739.226,928.962],[739.001,928.9],[738.846,929.026],[738.788,929.279],[739.039,929.428],[739.22,929.337]] },
      { role: 'minor_R', closed: true, pts: [[739.348,928.792],[739.208,928.936],[739.204,929.196],[739.507,929.31],[739.652,929.042],[739.585,928.842],[739.456,928.754]] },
      { role: 'conn', closed: false, pts: [[733.73,928.526],[733.565,928.358],[733.193,928.617],[733.021,929.138],[733.059,929.511],[733.381,929.569],[733.626,929.468],[733.652,929.282]] },
      { role: 'conn', closed: false, pts: [[734.176,928.769],[734.093,928.521],[733.694,928.424],[733.508,928.877],[733.602,929.304],[733.888,929.457],[734.174,929.546],[734.22,929.489]] },
      { role: 'conn', closed: false, pts: [[734.532,928.588],[734.387,928.534],[734.214,928.717],[733.993,928.983],[734.113,929.382],[734.362,929.659],[734.598,929.596],[734.689,929.509]] },
      { role: 'conn', closed: false, pts: [[736.349,929.167],[736.402,929.322],[736.565,929.566],[736.76,929.356],[736.811,929.226]] },
      { role: 'conn', closed: false, pts: [[736.846,928.661],[736.733,928.513],[736.479,928.496],[736.407,928.646],[736.382,928.71]] },
      { role: 'conn', closed: false, pts: [[737.331,928.655],[737.183,928.485],[736.892,928.565],[736.704,928.856],[736.771,929.192],[736.963,929.473],[737.321,929.493],[737.438,929.256]] },
      { role: 'pad', closed: false, pts: [[732.273,928.213],[732.225,927.933],[732.007,927.594],[731.453,927.668],[731.267,928.027],[731.217,928.246],[731.414,928.594],[731.751,928.66]] },
      { role: 'pad', closed: false, pts: [[733.011,928.265],[733.301,927.977],[733.333,927.629],[733.022,927.404],[732.428,927.482],[732.329,927.68],[732.187,927.893]] },
      { role: 'pad', closed: false, pts: [[733.657,928.448],[733.853,928.369],[734.02,928.112],[734.006,927.531],[733.61,927.487],[733.307,927.815]] },
      { role: 'pad', closed: false, pts: [[735.087,928.053],[734.936,927.663],[734.692,927.431],[734.367,927.453],[734.156,927.65],[734.008,927.97]] },
      { role: 'pad', closed: false, pts: [[733.934,928.217],[733.961,928.334],[734.271,928.422],[734.6,928.437]] },
      { role: 'pad', closed: false, pts: [[736.051,928.212],[736.13,927.891],[736.105,927.523],[735.741,927.265],[735.291,927.189],[735.028,927.493],[734.905,927.664]] },
      { role: 'pad', closed: false, pts: [[737.072,927.854],[736.972,927.626],[736.684,927.447],[736.356,927.614],[736.202,927.82],[736.105,928.054]] },
      { role: 'pad', closed: false, pts: [[736.767,928.568],[736.947,928.414],[737.043,928.283]] },
      { role: 'pad', closed: false, pts: [[737.821,928.223],[737.855,927.907],[737.782,927.547],[737.375,927.383],[737.216,927.734],[736.938,927.939],[737.027,928.386],[737.429,928.469]] },
      { role: 'pad', closed: false, pts: [[738.601,928.254],[738.753,927.902],[738.902,927.595],[738.664,927.264],[738.193,927.341],[738.011,927.605],[737.825,927.828]] },
      { role: 'pad', closed: false, pts: [[738.885,928.945],[739.243,928.86],[739.524,928.694],[739.714,928.311],[739.829,927.914],[739.457,927.605],[739.092,927.805],[738.715,928.014]] }
    ]
  },

  // (C) 平面圖 (Origin ref: X0=755.80, Y0=924.20，已完全移除紫色虛線與圈範圍)
  plan: {
    x0: 755.80, y0: 924.20,
    centerLines: [
      [[757.137,927.023],[757.997,922.929]],
      [[760.963,926.65],[759.104,922.844]],
      [[752.432,927.858],[755.151,922.592]],
      [[748.371,924.917],[753.407,921.266]]
    ],
    splines: [
      { role: 'main', closed: true, pts: [[755.044,924.213],[753.76,924.779],[753.864,926.211],[754.606,927.058],[754.685,927.989],[755.34,928.717],[756.534,928.338],[756.857,926.955],[757.601,925.781],[757.167,924.672],[756.401,924.25],[755.637,924.094]] },
      { role: 'sub', closed: true, pts: [[760.431,923.252],[759.85,923.956],[760.032,925.157],[761.084,925.888],[761.828,926.46],[762.244,926.979],[762.813,926.825],[762.786,925.749],[762.703,924.675],[762.883,923.423],[762.107,922.492],[761.188,922.933]] },
      { role: 'sub', closed: true, pts: [[750.185,920.583],[749.568,920.59],[748.964,921.629],[748.619,922.632],[748.937,924.08],[749.755,923.699],[750.233,923.308],[750.86,923.151],[751.285,922.732],[751.594,922.276],[751.829,921.61],[751.393,920.867],[750.689,920.816]] },
      { role: 'conn', closed: true, pts: [[757.635,924.922],[757.493,925.616],[757.537,926.252],[758.011,926.947],[758.634,926.51],[758.827,925.882],[758.853,925.199],[758.508,924.673],[758.022,924.631]] },
      { role: 'conn', closed: true, pts: [[759.068,924.873],[758.835,925.118],[758.843,925.583],[759.154,926.019],[759.268,926.615],[759.846,926.707],[760.169,926.314],[760.515,925.884],[760.374,925.338],[760.065,924.993],[759.905,924.539],[759.508,924.516],[759.226,924.63]] },
      { role: 'conn', closed: false, pts: [[750.416,923.283],[750.239,923.652],[749.932,923.983],[749.873,924.727],[750.677,924.686],[751.269,924.771],[751.734,924.437],[752.064,924.003],[752.214,923.499],[752.113,922.771],[751.239,922.76]] },
      { role: 'conn', closed: false, pts: [[750.949,924.724],[750.851,925.011],[750.965,925.44],[751.039,925.944],[751.4,926.152],[751.68,926.029],[751.814,925.776],[752.086,925.76],[752.538,925.215],[752.7,924.781],[752.593,924.053],[751.93,924.166]] },
      { role: 'conn', closed: false, pts: [[752.098,925.714],[751.909,926.033],[751.81,926.634],[752.368,926.625],[752.716,926.803],[753.145,926.788],[753.49,926.432],[753.866,926.272],[753.956,926.057]] },
      { role: 'gap', closed: true, pts: [[750.121,925.067],[750.25,925.231],[750.416,925.333],[750.599,925.271],[750.7,924.908],[750.594,924.72],[750.388,924.676],[750.19,924.729],[750.09,924.896]] },
      { role: 'gap', closed: true, pts: [[750.43,925.342],[750.316,925.522],[750.419,925.769],[750.84,925.916],[750.948,925.643],[750.93,925.391],[750.819,925.297],[750.55,925.288]] },
      { role: 'gap', closed: true, pts: [[749.74,923.734],[749.506,923.791],[749.388,924.02],[749.491,924.267],[749.814,924.393],[749.941,924.157],[749.971,923.849]] },
      { role: 'gap', closed: true, pts: [[751.511,926.098],[751.523,926.414],[751.811,926.448],[751.93,926.36],[751.845,926.079],[751.605,926.06]] },
      { role: 'gap', closed: true, pts: [[753.563,926.687],[753.313,926.669],[753.028,926.803],[753.125,927.166],[753.411,927.345],[753.647,927.148],[753.675,926.925]] },
      { role: 'gap', closed: true, pts: [[753.657,926.917],[753.742,927.238],[753.994,927.315],[754.257,927.343],[754.351,926.95],[754.327,926.713],[754.112,926.594],[753.735,926.677]] },
      { role: 'gap', closed: true, pts: [[757.899,926.731],[757.584,926.771],[757.605,927.032],[757.708,927.249],[758.004,927.211],[758.043,926.948]] },
      { role: 'gap', closed: false, pts: [[758.321,926.711],[758.28,926.883],[758.371,927.112],[758.579,927.213],[758.803,927.219],[758.879,926.852],[758.798,926.609],[758.5,926.555]] },
      { role: 'gap', closed: false, pts: [[759.136,926.104],[758.903,926.108],[758.717,926.195],[758.692,926.472],[759.01,926.839],[759.279,926.556]] },
      { role: 'gap', closed: false, pts: [[760.188,926.288],[760.198,926.588],[760.572,926.814],[760.717,926.714],[760.779,926.355],[760.572,926.151],[760.302,926.14]] },
      { role: 'gap', closed: false, pts: [[761.21,925.993],[760.87,926.104],[760.956,926.592],[761.38,926.786],[761.424,926.155]] },
      { role: 'gap', closed: false, pts: [[761.818,926.495],[761.827,926.994],[762.341,927.227],[762.734,927.165],[763.039,927.017],[763.041,926.654],[762.766,926.59]] },
      { role: 'pad', closed: false, pts: [[748.85,922.064],[748.649,921.755],[748.522,921.364],[748.663,920.926],[748.964,920.616],[749.708,920.529],[749.776,920.629]] },
      { role: 'pad', closed: false, pts: [[750.392,920.65],[750.904,920.537],[751.445,920.502],[752.117,920.715],[752.049,921.182],[751.931,921.477],[751.719,921.601]] },
      { role: 'pad', closed: false, pts: [[751.724,921.781],[752.087,921.758],[752.455,921.958],[752.36,922.334],[752.221,922.616],[752.013,922.803]] },
      { role: 'pad', closed: false, pts: [[748.765,923.104],[748.509,923.054],[748.326,923.282],[748.229,923.688],[748.799,923.887],[749.198,923.976],[749.386,923.856]] },
      { role: 'pad', closed: false, pts: [[753.926,925.097],[753.594,924.843],[753.152,924.799],[752.763,924.924],[752.58,925.07]] },
      { role: 'pad', closed: false, pts: [[753.505,924.851],[753.474,924.405],[753.379,923.711],[754.232,923.692],[754.8,923.677],[755.101,923.999],[755.096,924.199]] },
      { role: 'pad', closed: false, pts: [[755.053,923.981],[755.373,923.726],[755.714,923.526],[756.486,923.417],[756.808,923.753],[756.882,924.147],[756.793,924.493]] },
      { role: 'pad', closed: false, pts: [[756.849,924.13],[757.189,923.937],[757.562,924.183],[757.825,924.432],[757.875,924.721]] },
      { role: 'pad', closed: false, pts: [[762.763,924.481],[763.113,923.978],[763.269,923.325],[763.086,922.565],[762.498,922.084],[761.849,922.037],[761.453,922.217]] },
      { role: 'pad', closed: false, pts: [[761.878,922.706],[761.442,922.116],[760.719,921.928],[759.923,922.038],[759.547,922.57],[759.53,923.046],[759.616,923.355]] },
      { role: 'pad', closed: false, pts: [[759.4,924.567],[759.223,924.196],[759.217,923.787],[759.432,923.293],[759.888,923.352],[760.203,923.479]] }
    ]
  },

  // (D) 石材尺寸圖 (Origin ref: X0=721.40, Y0=919.83 底部基準線)
  size: {
    x0: 721.40, y0: 919.83,
    stones: [
      { role: 'main', label: '主', baseH: 2.2644, cx: 721.38, pts: [[721.284,919.85],[720.493,920.191],[720.482,921.194],[720.856,922.048],[721.535,922.15],[722.041,921.912],[722.026,921.503],[722.152,921.193],[722.22,920.495],[722.223,920.085],[721.808,919.782]] },
      { role: 'sub', label: '副', baseH: 1.6182, cx: 723.36, pts: [[723.208,919.863],[722.733,920.307],[722.742,920.923],[723.085,921.46],[723.606,921.466],[723.9,921.155],[723.86,920.765],[724.002,920.422],[723.95,920.091],[723.725,919.894]] },
      { role: 'minor', label: '從', baseH: 1.0157, cx: 724.88, pts: [[724.822,919.857],[724.477,919.991],[724.532,920.374],[724.54,920.742],[724.834,920.859],[725.105,920.842],[725.195,920.567],[725.26,920.003],[725.038,919.835]] }
    ]
  },

  // (E) 詳細圖：力石與墊石之接合點至少有3點 (Origin ref: X0=734.30, Y0=917.45)
  detail: {
    x0: 734.30, y0: 917.45,
    polys: [
      { role: 'force_stone', closed: false, pts: [[732.703,920.663],[732.307,920.321],[732.222,919.861],[732.33,919.38],[732.544,919.139],[732.735,918.995],[733.163,918.706],[733.538,918.514],[734.083,918.567],[734.736,918.621],[735.239,918.663],[735.611,918.911],[735.782,919.151],[736.05,919.55],[736.181,919.904],[736.084,920.064],[735.881,920.267],[735.421,920.631]] },
      { role: 'pad_L', closed: true, pts: [[731.165,919.206],[731.479,919.4],[731.734,919.534],[731.895,919.527],[732.256,919.286],[732.705,919.005],[732.986,918.517],[733.315,918.296],[733.47,917.944],[733.422,917.713],[733.134,917.646],[732.571,917.713],[731.888,917.78],[731.5,917.707],[731.272,917.921],[731.212,918.262],[731.124,919.106]] },
      { role: 'pad_M', closed: true, pts: [[733.824,917.479],[733.603,917.586],[733.446,917.798],[733.522,918.102],[733.817,918.376],[734.022,918.538],[734.34,918.581],[734.634,918.47],[734.915,918.322],[735.163,918.222],[735.339,918.091],[735.456,917.822],[735.403,917.665],[735.21,917.486],[734.647,917.446],[734.239,917.446]] },
      { role: 'pad_R', closed: true, pts: [[735.565,917.539],[735.478,917.787],[735.331,918.115],[735.378,918.383],[735.659,918.958],[736.007,919.447],[736.342,919.608],[736.757,919.641],[736.951,919.541],[737.206,919.26],[737.447,918.918],[737.4,918.082],[737.4,917.74],[736.965,917.452],[736.308,917.486],[735.799,917.519]] }
    ],
    contacts: [
      { cx: 732.591, cy: 919.119, r: 0.192 },
      { cx: 734.127, cy: 918.598, r: 0.192 },
      { cx: 735.808, cy: 919.105, r: 0.192 },
      { cx: 733.502, cy: 917.869, r: 0.192 },
      { cx: 735.461, cy: 917.945, r: 0.192 }
    ]
  }
};

// ============================================================================
// 2. 讀取介面參數與自動連動計算
// ============================================================================
function getParams() {
  const W_bed = parseFloat(document.getElementById('p_W_bed').value) || 900;
  const d_main = parseFloat(document.getElementById('p_d_main').value) || 100;
  const r_sub = parseFloat(document.getElementById('p_r_sub').value) || 0.5;
  const r_minor = parseFloat(document.getElementById('p_r_minor').value) || 0.25;
  const ang_L = parseFloat(document.getElementById('p_ang_L').value) || 37.9;
  const ang_pad = parseFloat(document.getElementById('p_ang_pad').value) || 15;
  const H_drop = parseFloat(document.getElementById('p_H_drop').value) || 35;

  const N_layer = parseInt(document.getElementById('p_N_layer').value) || 3;
  const D_conn = parseFloat(document.getElementById('p_D_conn').value) || 35;
  const k_gap = parseFloat(document.getElementById('p_k_gap').value) || 1.0;

  const d_sub = +(d_main * r_sub).toFixed(1);
  const d_minor = +(d_main * r_minor).toFixed(1);

  return {
    W_bed, d_main, r_sub, r_minor, d_sub, d_minor, ang_L, ang_pad, H_drop,
    N_layer, D_conn, k_gap
  };
}

// ============================================================================
// 3. 工程數量計算表 (僅針對原圖實際繪製之石樑固床工構件計算)
// ============================================================================
function computeQuantities(P) {
  const rows = [];
  const d_m = P.d_main / 100;
  const d_sub_m = P.d_sub / 100;
  const d_min_m = P.d_minor / 100;
  const W_m = P.W_bed / 100;
  const D_conn_m = P.D_conn / 100;

  // 1. 主力石 (中央 1 顆)
  const v_main = +(0.68 * d_m * (0.85 * d_m) * (0.90 * d_m)).toFixed(3);
  rows.push({
    no: '1', name: '主力石 (中央計畫斷面)', unit: 'm³',
    formula: `1顆 × 0.68 × (${P.d_main}/100) × (0.85×${P.d_main}/100) × (0.90×${P.d_main}/100)`,
    qty: v_main, note: `高 d=${P.d_main}cm (>50cm)`
  });

  // 2. 副力石 (兩側共 2 顆)
  const v_sub = +(2 * 0.68 * d_sub_m * (0.85 * d_sub_m) * (0.90 * d_sub_m)).toFixed(3);
  rows.push({
    no: '2', name: '副力石 (計畫斷面略下游兩側)', unit: 'm³',
    formula: `2顆 × 0.68 × (${P.d_sub}/100) × (0.85×${P.d_sub}/100) × (0.90×${P.d_sub}/100)`,
    qty: v_sub, note: `高 d×${P.r_sub}=${P.d_sub}cm`
  });

  // 3. 從力石 (兩岸法線共 2 顆)
  const v_min = +(2 * 0.68 * d_min_m * (0.85 * d_min_m) * (0.90 * d_min_m)).toFixed(3);
  rows.push({
    no: '3', name: '從力石 (兩岸法線處)', unit: 'm³',
    formula: `2顆 × 0.68 × (${P.d_minor}/100) × (0.85×${P.d_minor}/100) × (0.90×${P.d_minor}/100)`,
    qty: v_min, note: `高 d×${P.r_minor}=${P.d_minor}cm`
  });

  // 4. 連接石與間隙石 (N_layer層, 粒徑 D_conn)
  const effW_conn = Math.max(1.0, +(W_m - 2.4 * d_m).toFixed(2));
  const v_conn = +(effW_conn * (P.N_layer * D_conn_m) * (1.4 * D_conn_m) * 0.78).toFixed(3);
  rows.push({
    no: '4', name: `連接石與間隙石 (${P.N_layer}層疊砌)`, unit: 'm³',
    formula: `(${P.W_bed}/100 - 2.4×${P.d_main}/100) × (${P.N_layer}×${P.D_conn}/100) × (1.4×${P.D_conn}/100) × 0.78`,
    qty: v_conn, note: `粒徑 D=${P.D_conn}cm, 八字夾角 L=${P.ang_L}°`
  });

  // 5. 底部墊石与尾隙石 (石尾朝上游 15° 傾斜配置)
  const cosAng = Math.cos(P.ang_pad * Math.PI / 180);
  const v_pad = +((W_m * (1.25 * d_m) * (0.55 * d_m) * 0.75) / cosAng).toFixed(3);
  rows.push({
    no: '5', name: `底部墊石與尾隙石 (3點以上接合)`, unit: 'm³',
    formula: `(${P.W_bed}/100) × (1.25×${P.d_main}/100) × (0.55×${P.d_main}/100) × 0.75 / cos(${P.ang_pad}°)`,
    qty: v_pad, note: `石尾朝上游傾斜 ${P.ang_pad}°, 河床落差 ${P.H_drop}cm`
  });

  return rows;
}

// ============================================================================
// 4. 規範檢核與側邊欄 UI 更新
// ============================================================================
function updateSidebarUI() {
  const P = getParams();
  document.getElementById('drv_stone_heights').textContent =
    `副力石高 = ${P.d_sub} cm ｜ 從力石高 = ${P.d_minor} cm`;

  const checks = [];
  checks.push({
    ok: P.d_main >= 50,
    msg: `[原則四-1] 主力石高度 d=${P.d_main}cm ${P.d_main >= 50 ? '≥ 50cm (符合)' : '< 50cm (建議大於50cm)'}`
  });
  checks.push({
    ok: Math.abs(P.ang_pad - 15) <= 5,
    msg: `[原則四-2,3] 墊石與連接石向上游傾角 ${P.ang_pad}° (規範約 15°)`
  });
  checks.push({
    ok: P.D_conn >= 20 && P.D_conn <= 50,
    msg: `[原則四-4] 連接石鋪設 ${P.N_layer} 層、直徑 ${P.D_conn}cm ${P.D_conn >= 20 && P.D_conn <= 50 ? '(符合 20~50cm)' : '(超出 20~50cm 建議值)'}`
  });
  checks.push({
    ok: Math.abs(P.r_sub - 0.5) < 0.15 && Math.abs(P.r_minor - 0.25) < 0.15,
    msg: `[原則四-5] 主:副:從力石高比 = 1 : ${P.r_sub} : ${P.r_minor} (規範建議 1 : 1/2 : 1/4)`
  });

  const box = document.getElementById('normCheckList');
  box.innerHTML = checks.map(c =>
    `<div class="check-item ${c.ok ? '' : 'warn'}">${c.ok ? '✔' : '⚠'} ${c.msg}</div>`
  ).join('');
}

// ============================================================================
// 5. Canvas 2D 視埠控制與繪圖輔助函式
// ============================================================================
const canvas = document.getElementById('cadCanvas');
const ctx = canvas.getContext('2d');
let camX = 800, camY = -100, scale = 0.38;
let isDragging = false, dragStartX = 0, dragStartY = 0;
let dxfEntities = [];
let globalBounds = { minX: -200, maxX: 2400, minY: -900, maxY: 700 };

function worldToScreen(wx, wy) {
  const cw = canvas.width || 1100;
  const ch = canvas.height || 750;
  return [
    cw / 2 + (wx - camX) * scale,
    ch / 2 - (wy - camY) * scale
  ];
}
function screenToWorld(sx, sy) {
  const cw = canvas.width || 1100;
  const ch = canvas.height || 750;
  return [
    camX + (sx - cw / 2) / scale,
    camY - (sy - ch / 2) / scale
  ];
}

function drawWorldLine(x1, y1, x2, y2, color = '#ffffff', width = 1.4, dash = [], layer = '0') {
  const [sx1, sy1] = worldToScreen(x1, y1);
  const [sx2, sy2] = worldToScreen(x2, y2);
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.setLineDash(dash);
  ctx.beginPath();
  ctx.moveTo(sx1, sy1);
  ctx.lineTo(sx2, sy2);
  ctx.stroke();
  ctx.restore();
  dxfEntities.push({ type: 'LINE', layer, x1, y1, x2, y2, dash: dash.length > 0 });
}

function drawWorldPoly(pts, closed = true, strokeCol = '#f59e0b', fillCol = null, width = 1.5, dash = [], layer = '塊石') {
  if (!pts || pts.length < 2) return;
  ctx.save();
  ctx.beginPath();
  pts.forEach((p, idx) => {
    const [sx, sy] = worldToScreen(p[0], p[1]);
    if (idx === 0) ctx.moveTo(sx, sy);
    else ctx.lineTo(sx, sy);
  });
  if (closed) ctx.closePath();
  if (fillCol) {
    ctx.fillStyle = fillCol;
    ctx.fill();
  }
  if (strokeCol) {
    ctx.strokeStyle = strokeCol;
    ctx.lineWidth = width;
    ctx.setLineDash(dash);
    ctx.stroke();
  }
  ctx.restore();
  dxfEntities.push({ type: 'POLY', layer, pts, closed, dash: dash.length > 0 });
}

function drawWorldCircle(cx, cy, r, strokeCol = '#22d3ee', fillCol = null, width = 1.3, dash = [], layer = 'DIM') {
  const [sx, sy] = worldToScreen(cx, cy);
  const sr = Math.max(1.5, r * scale);
  ctx.save();
  ctx.beginPath();
  ctx.arc(sx, sy, sr, 0, Math.PI * 2);
  if (fillCol) {
    ctx.fillStyle = fillCol;
    ctx.fill();
  }
  if (strokeCol) {
    ctx.strokeStyle = strokeCol;
    ctx.lineWidth = width;
    ctx.setLineDash(dash);
    ctx.stroke();
  }
  ctx.restore();
  dxfEntities.push({ type: 'CIRCLE', layer, cx, cy, r, dash: dash.length > 0 });
}

function drawWorldText(txt, wx, wy, worldH = 14, color = '#e2e8f0', align = 'center', rotDeg = 0, layer = '字') {
  const [sx, sy] = worldToScreen(wx, wy);
  const px = Math.max(9, Math.min(28, worldH * scale));
  ctx.save();
  ctx.translate(sx, sy);
  if (rotDeg) ctx.rotate(-rotDeg * Math.PI / 180);
  ctx.font = `600 ${px}px "Microsoft JhengHei", "DFKai-SB", sans-serif`;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(txt, 0, 0);
  ctx.restore();
  dxfEntities.push({ type: 'TEXT', layer, txt, x: wx, y: wy, h: worldH, align, rotDeg });
}

function drawWorldLeader(pts, label, color = '#38bdf8', textH = 13) {
  if (!pts || pts.length < 2) return;
  for (let i = 0; i < pts.length - 1; i++) {
    drawWorldLine(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], color, 1.2, [], 'DIM');
  }
  const [x0, y0] = pts[0];
  const [x1, y1] = pts[1];
  const ang = Math.atan2(y1 - y0, x1 - x0);
  const aLen = 8;
  const pA = [x0 + aLen * Math.cos(ang + 0.35), y0 + aLen * Math.sin(ang + 0.35)];
  const pB = [x0 + aLen * Math.cos(ang - 0.35), y0 + aLen * Math.sin(ang - 0.35)];
  drawWorldPoly([[x0, y0], pA, pB], true, color, color, 1, [], 'DIM');

  const last = pts[pts.length - 1];
  const prev = pts[pts.length - 2];
  const isRight = last[0] >= prev[0];
  drawWorldText(label, last[0] + (isRight ? 6 : -6), last[1] + 2, textH, '#67e8f9', isRight ? 'left' : 'right', 0, '!字');
}

function drawFlowArrow(wx, wy, rotDeg = 0, label = '水流方向') {
  const len = 75;
  const rad = rotDeg * Math.PI / 180;
  const xTail = wx - len * Math.cos(rad);
  const yTail = wy - len * Math.sin(rad);
  drawWorldLine(xTail, yTail, wx, wy, '#3b82f6', 2.0, [], '_00400');
  const ah = 20, aw = 6;
  const p1 = [wx - ah * Math.cos(rad) + aw * Math.sin(rad), wy - ah * Math.sin(rad) - aw * Math.cos(rad)];
  const p2 = [wx - ah * Math.cos(rad) - aw * Math.sin(rad), wy - ah * Math.sin(rad) + aw * Math.cos(rad)];
  drawWorldPoly([[wx, wy], p1, p2], true, '#3b82f6', '#3b82f6', 1.2, [], '_00400');
  if (label) {
    drawWorldText(label, (wx + xTail) / 2, (wy + yTail) / 2 + 18, 13, '#60a5fa', 'center', 0, '!字');
  }
}

// 尺寸標註延伸線退縮鐵律 (距離結構物至少退縮 9.5cm 不黏連)
function getDimExtensionCoords(coordObj, dimPos) {
  const dir = dimPos >= coordObj ? 1 : -1;
  const minGapFromObj = 9.5;
  const maxExtLen = 18.0;
  const overshoot = 4.5;
  const dist = Math.abs(dimPos - coordObj);
  const startOffset = Math.max(minGapFromObj, dist - maxExtLen);
  return {
    extStart: coordObj + dir * startOffset,
    extEnd: dimPos + dir * overshoot
  };
}

function drawDimH(x1, x2, yObj1, yObj2, yDim, text) {
  const e1 = getDimExtensionCoords(yObj1, yDim);
  const e2 = getDimExtensionCoords(yObj2, yDim);
  drawWorldLine(x1, e1.extStart, x1, e1.extEnd, '#22d3ee', 1.1, [], 'DIM');
  drawWorldLine(x2, e2.extStart, x2, e2.extEnd, '#22d3ee', 1.1, [], 'DIM');
  drawWorldLine(x1, yDim, x2, yDim, '#22d3ee', 1.3, [], 'DIM');
  const s = Math.min(8, Math.abs(x2 - x1) * 0.18);
  const dir = x2 >= x1 ? 1 : -1;
  drawWorldPoly([[x1, yDim], [x1 + dir * s, yDim + s * 0.35], [x1 + dir * s, yDim - s * 0.35]], true, '#22d3ee', '#22d3ee', 1, [], 'DIM');
  drawWorldPoly([[x2, yDim], [x2 - dir * s, yDim + s * 0.35], [x2 - dir * s, yDim - s * 0.35]], true, '#22d3ee', '#22d3ee', 1, [], 'DIM');
  drawWorldText(text, (x1 + x2) / 2, yDim + 12, 13, '#67e8f9', 'center', 0, 'DIM');
}

function drawDimV(y1, y2, xObj1, xObj2, xDim, text) {
  const e1 = getDimExtensionCoords(xObj1, xDim);
  const e2 = getDimExtensionCoords(xObj2, xDim);
  drawWorldLine(e1.extStart, y1, e1.extEnd, y1, '#22d3ee', 1.1, [], 'DIM');
  drawWorldLine(e2.extStart, y2, e2.extEnd, y2, '#22d3ee', 1.1, [], 'DIM');
  drawWorldLine(xDim, y1, xDim, y2, '#22d3ee', 1.3, [], 'DIM');
  const s = Math.min(8, Math.abs(y2 - y1) * 0.18);
  const dir = y2 >= y1 ? 1 : -1;
  drawWorldPoly([[xDim, y1], [xDim - s * 0.35, y1 + dir * s], [xDim + s * 0.35, y1 + dir * s]], true, '#22d3ee', '#22d3ee', 1, [], 'DIM');
  drawWorldPoly([[xDim, y2], [xDim - s * 0.35, y2 - dir * s], [xDim + s * 0.35, y2 - dir * s]], true, '#22d3ee', '#22d3ee', 1, [], 'DIM');
  drawWorldText(text, xDim + 12, (y1 + y2) / 2, 13, '#67e8f9', 'left', 0, 'DIM');
}

// ============================================================================
// 6. 動態包絡盒相對間距排版引擎 (Dynamic Bounding-Box Relative Layout)
//    當尺寸放大時，各視圖自動推開保持相對間距，絕不重疊！
// ============================================================================
function computeDynamicViewLayout(P) {
  const kSec = P.d_main / (RAW_DXF_VIEWS.sec.baseD * 100);
  const kxFr = P.W_bed / (RAW_DXF_VIEWS.front.baseW * 100);
  const kyMain = P.d_main / 226.4;
  const kxPl = P.W_bed / 900;
  const kyPl = P.d_main / 120 * 0.4 + 0.6;
  const kDet = Math.max(0.85, P.d_main / 140);

  // 各視圖在局部座標 (相对于各自錨點 Ox, Oy) 之包絡範圍 [left, right, bottom, top]
  const secBox = {
    left: -260 * kSec - 130,
    right: 615 * kSec + 170,
    bottom: -Math.max(140 * kSec, P.H_drop + 70) - 90,
    top: 300 * kSec + 60
  };
  const frontBox = {
    left: -500 * kxFr - 80,
    right: 600 * kxFr + 90,
    bottom: -150,
    top: 340 * kyMain + 100
  };
  const sizeScale0 = P.d_main / (2.2644 * 100);
  const sizeSpacing = Math.max(145, 115 * sizeScale0);
  const sizeBox = {
    left: -100 * sizeScale0 - 40,
    right: 2 * sizeSpacing + 280,
    bottom: -120,
    top: P.d_main + 60
  };
  const detailBox = {
    left: -340 * kDet - 60,
    right: 340 * kDet + 80,
    bottom: -120,
    top: 380 * kDet + 60
  };
  const planBox = {
    left: -760 * kxPl - 90,
    right: 760 * kxPl + 90,
    bottom: -390 * kyPl - 120,
    top: 520 * kyPl + 80
  };

  // 動態相對安全間距 (隨參數放大自動拉開間距)
  const gapX = Math.max(190, (P.W_bed * 0.16 + P.d_main * 0.65) * P.k_gap);
  const gapY = Math.max(165, (P.d_main * 1.15 + P.H_drop * 0.5) * P.k_gap);

  // 1. 斷面圖錨點 (左上)
  const secOx = 0, secOy = 300;
  const secWorldRight = secOx + secBox.right;
  const secWorldBottom = secOy + secBox.bottom;

  // 2. 正面圖錨點 (中上：位於斷面圖右側 + gapX)
  const frOx = secWorldRight + gapX - frontBox.left;
  const frOy = secOy;
  const frWorldRight = frOx + frontBox.right;
  const frWorldBottom = frOy + frontBox.bottom;

  // 3. 石材尺寸圖錨點 (左下：位於斷面圖下方 - gapY)
  const szOx = secOx;
  const szOy = Math.min(secWorldBottom, frWorldBottom) - gapY - sizeBox.top;
  const szWorldRight = szOx + sizeBox.right;
  const szWorldBottom = szOy + sizeBox.bottom;

  // 4. 詳細圖錨點 (中下：位於石材尺寸圖右側 + gapX，且與正面圖水平對齊或自動右移防撞)
  const dtOx = Math.max(frOx, szWorldRight + gapX - detailBox.left);
  const dtOy = szOy;
  const dtWorldRight = dtOx + detailBox.right;
  const dtWorldBottom = dtOy + detailBox.bottom;

  // 5. 平面圖錨點 (右側大區：位於正面圖與詳細圖最右緣 + gapX)
  const leftClusterRight = Math.max(frWorldRight, dtWorldRight);
  const plOx = leftClusterRight + gapX - planBox.left;
  const plOy = (secOy + szOy) / 2 + 60;
  const plWorldRight = plOx + planBox.right;
  const plWorldBottom = plOy + planBox.bottom;
  const plWorldTop = plOy + planBox.top;

  // 6. 下方工程數量計算式表與設計說明錨點 (位於所有視圖最底緣 - gapY)
  const allViewsBottom = Math.min(szWorldBottom, dtWorldBottom, plWorldBottom);
  const tableOx = secOx + secBox.left;
  const tableOy = allViewsBottom - gapY * 0.75;

  return {
    kSec, kxFr, kyMain, kxPl, kyPl, kDet, sizeSpacing,
    secOx, secOy, frOx, frOy, szOx, szOy, dtOx, dtOy, plOx, plOy,
    tableOx, tableOy,
    bounds: {
      minX: tableOx - 80,
      maxX: Math.max(plWorldRight, tableOx + 2250) + 80,
      minY: tableOy - 380,
      maxY: Math.max(secOy + secBox.top, frOy + frontBox.top, plWorldTop) + 80
    }
  };
}

// ============================================================================
// 7. 主渲染函式 renderCAD()
// ============================================================================
function renderCAD() {
  const rect = canvas.parentElement.getBoundingClientRect();
  const cw = Math.max(800, rect.width || window.innerWidth - 370);
  const ch = Math.max(550, rect.height || window.innerHeight - 44);
  if (canvas.width !== cw || canvas.height !== ch) {
    canvas.width = cw;
    canvas.height = ch;
  }

  ctx.fillStyle = '#0b111e';
  ctx.fillRect(0, 0, cw, ch);
  dxfEntities = [];

  const P = getParams();
  const L = computeDynamicViewLayout(P);
  globalBounds = L.bounds;

  const showRef = document.getElementById('chkShowRefDxf').checked;
  const showNotes = document.getElementById('chkShowNotes').checked;

  // -------------------------------------------------------------------------
  // 視圖 1：【斷面圖】(左上區)
  // -------------------------------------------------------------------------
  const { secOx, secOy, kSec } = L;
  const rotDeltaRad = (P.ang_pad - 15) * Math.PI / 180;

  if (showRef) {
    RAW_DXF_VIEWS.sec.splines.forEach(sp => {
      const refPts = sp.pts.map(p => [
        secOx + (p[0] - RAW_DXF_VIEWS.sec.x0) * 100,
        secOy + (p[1] - RAW_DXF_VIEWS.sec.y0) * 100
      ]);
      drawWorldPoly(refPts, sp.closed, 'rgba(244,63,94,0.55)', null, 1.1, [5, 4], 'REF_DXF');
    });
  }

  RAW_DXF_VIEWS.sec.splines.forEach(sp => {
    const pts = sp.pts.map(p => {
      let dx = (p[0] - RAW_DXF_VIEWS.sec.x0) * 100 * kSec;
      let dy = (p[1] - RAW_DXF_VIEWS.sec.y0) * 100 * kSec;
      if (sp.role === 'pad_stone' && Math.abs(rotDeltaRad) > 1e-4) {
        const rx = dx * Math.cos(rotDeltaRad) - dy * Math.sin(rotDeltaRad);
        const ry = dx * Math.sin(rotDeltaRad) + dy * Math.cos(rotDeltaRad);
        dx = rx; dy = ry;
      }
      return [secOx + dx, secOy + dy];
    });
    if (sp.layer === '塊石') {
      const fill = sp.role === 'main_stone' ? 'rgba(217,119,6,0.28)' : 'rgba(180,83,9,0.20)';
      drawWorldPoly(pts, sp.closed, '#f59e0b', fill, 1.8, [], '塊石');
    } else {
      drawWorldPoly(pts, false, '#38bdf8', null, 1.5, [], '水管');
    }
  });

  // 上游河床線與下游計畫河床線 (無自然孵化線)
  const upBedX1 = secOx - 260 * kSec, upBedX2 = secOx;
  const upBedY = secOy;
  const dnBedX1 = secOx + 409 * kSec, dnBedX2 = secOx + 615 * kSec;
  const dnBedY = secOy - P.H_drop;
  drawWorldLine(upBedX1, upBedY, upBedX2, upBedY, '#fde047', 2.0, [], '0');
  drawWorldLine(dnBedX1, dnBedY, dnBedX2, dnBedY, '#fde047', 2.0, [], '0');

  drawFlowArrow(secOx + 210 * kSec, secOy + 280 * kSec, 0, '水流方向');
  drawWorldText('力石', secOx + 165 * kSec, secOy + 100 * kSec, 15, '#fef08a', 'center', 0, '!字');
  drawWorldText('墊石', secOx + 195 * kSec, secOy - 45 * kSec, 14, '#fef08a', 'center', 0, '!字');
  drawWorldLeader([[secOx + 318 * kSec, secOy + 150 * kSec], [secOx + 395 * kSec, secOy + 150 * kSec]], '石面', '#22d3ee', 13);
  drawWorldLeader([[secOx + 45 * kSec, secOy - 18 * kSec], [secOx - 55 * kSec, secOy - 75 * kSec]], '尾隙石', '#22d3ee', 13);
  drawWorldLeader([[dnBedX1 + 95 * kSec, dnBedY], [dnBedX1 + 95 * kSec, secOy + 235 * kSec]], '計畫河床', '#22d3ee', 13);

  drawDimV(secOy - 20 * kSec, secOy + 200 * kSec, secOx - 10, secOx - 10, secOx - 115 * kSec - 35, `d=${P.d_main}cm`);
  drawDimV(dnBedY, upBedY, dnBedX2, dnBedX2, dnBedX2 + 45, `落差=${P.H_drop}cm`);

  const secTitleY = Math.min(secOy - 135 * kSec, dnBedY - 60) - 45;
  drawWorldText('斷 面 圖', secOx + 180 * kSec, secTitleY, 20, '#38bdf8', 'center', 0, '字');
  drawWorldLine(secOx + 100 * kSec, secTitleY - 16, secOx + 260 * kSec, secTitleY - 16, '#38bdf8', 2.0, [], '字');

  // -------------------------------------------------------------------------
  // 視圖 2：【正面圖】(中上區 — 純石樑結構，無混凝土基座)
  // -------------------------------------------------------------------------
  const { frOx, frOy, kxFr, kyMain } = L;
  const kySub = P.d_sub / (226.4 * 0.5);
  const kyMin = P.d_minor / (226.4 * 0.25);

  RAW_DXF_VIEWS.front.splines.forEach(sp => {
    let ky = kyMain;
    if (sp.role === 'sub_L' || sp.role === 'sub_R') ky = kySub * 0.65 + kyMain * 0.35;
    else if (sp.role === 'minor_L' || sp.role === 'minor_R') ky = kyMin * 0.65 + kyMain * 0.35;

    const pts = sp.pts.map(p => [
      frOx + __sx((p[0] - RAW_DXF_VIEWS.front.x0) * 100 * kxFr, P),
      frOy + (p[1] - RAW_DXF_VIEWS.front.y0) * 100 * ky
    ]);
    const fill = sp.role === 'main'
      ? 'rgba(234,88,12,0.32)'
      : (sp.role.startsWith('sub') ? 'rgba(217,119,6,0.26)' : 'rgba(180,83,9,0.18)');
    drawWorldPoly(pts, sp.closed, '#f59e0b', fill, 1.5, [], '塊石');
  });

  // 正面圖設計洪水位線與水位三角符號
  const wlY = frOy + 332 * kyMain;
  const wlX1 = frOx - 480 * kxFr, wlX2 = frOx + 585 * kxFr;
  drawWorldLine(wlX1, wlY, wlX2, wlY, '#3b82f6', 1.6, [], '水管');
  const triX = wlX2 - 60;
  drawWorldPoly([[triX, wlY], [triX + 18, wlY + 25], [triX - 18, wlY + 25]], true, '#22d3ee', null, 1.3, [], 'DIM');
  drawWorldLine(triX - 22, wlY - 10, triX + 22, wlY - 10, '#22d3ee', 1.2, [], 'DIM');
  drawWorldLine(triX - 16, wlY - 18, triX + 16, wlY - 18, '#22d3ee', 1.2, [], 'DIM');

  // 正面圖詳圖虛線圓圈 (FBC9) 與部位文字
  const detCx = frOx + 6 * kxFr, detCy = frOy + 98 * kyMain, detR = 115 * Math.min(kxFr, kyMain);
  drawWorldCircle(detCx, detCy, detR, '#22d3ee', null, 1.3, [6, 4], 'DIM');
  drawWorldLeader([[detCx + detR * 0.7, detCy + detR * 0.7], [detCx + 150, wlY + 35], [detCx + 215, wlY + 35]], '詳細圖', '#22d3ee', 13);

  drawWorldText('主力石', frOx - 10, frOy + 165 * kyMain, 13.5, '#fef08a', 'center', 0, '!字');
  drawWorldText('副力石', frOx + 275 * kxFr, frOy + 145 * kyMain, 13.5, '#fef08a', 'center', 0, '!字');
  drawWorldText('從力石', frOx - 470 * kxFr, frOy + 165 * kyMain, 13.5, '#fef08a', 'center', 0, '!字');
  drawWorldText('連結石', frOx - 210 * kxFr, frOy + 255 * kyMain, 13.5, '#67e8f9', 'center', 0, '!字');
  drawWorldText('墊石', frOx + 30, frOy + 45 * kyMain, 13.5, '#cbd5e1', 'center', 0, '!字');

  drawDimH(frOx - P.WhL, frOx, wlY, wlY, wlY + 40, `左半寬 ${P.WhL}`); drawDimH(frOx, frOx + P.WhR, wlY, wlY, wlY + 40, `右半寬 ${P.WhR}`); drawDimH(frOx - P.WhL, frOx + P.WhR, wlY, wlY, wlY + 88, `溪床寬度 W_bed = ${P.W_bed} cm`);
  drawWorldText('正 面 圖', frOx, secTitleY, 20, '#38bdf8', 'center', 0, '字');
  drawWorldLine(frOx - 80, secTitleY - 16, frOx + 80, secTitleY - 16, '#38bdf8', 2.0, [], '字');

  // -------------------------------------------------------------------------
  // 視圖 3：【平面圖】(右側大區 — 已移除紫色線與沖刷深潭圈範圍)
  // -------------------------------------------------------------------------
  const { plOx, plOy, kxPl, kyPl } = L;

  // 八字形拱中心線 (FD4B, FD4C, FD95, FD97)
  RAW_DXF_VIEWS.plan.centerLines.forEach(cl => {
    const p1 = [plOx + __sx((cl[0][0] - RAW_DXF_VIEWS.plan.x0) * 100 * kxPl, P), plOy + (cl[0][1] - RAW_DXF_VIEWS.plan.y0) * 100 * kyPl];
    const p2 = [plOx + __sx((cl[1][0] - RAW_DXF_VIEWS.plan.x0) * 100 * kxPl, P), plOy + (cl[1][1] - RAW_DXF_VIEWS.plan.y0) * 100 * kyPl];
    drawWorldLine(p1[0], p1[1], p2[0], p2[1], '#22c55e', 1.4, [12, 4, 3, 4], '塊石');
  });

  // 平面圖 37 條塊石 SPLINE
  RAW_DXF_VIEWS.plan.splines.forEach(sp => {
    const pts = sp.pts.map(p => [
      plOx + __sx((p[0] - RAW_DXF_VIEWS.plan.x0) * 100 * kxPl, P),
      plOy + (p[1] - RAW_DXF_VIEWS.plan.y0) * 100 * kyPl
    ]);
    const fill = sp.role === 'main'
      ? 'rgba(234,88,12,0.34)'
      : (sp.role === 'sub' ? 'rgba(217,119,6,0.28)' : 'rgba(180,83,9,0.18)');
    drawWorldPoly(pts, sp.closed, '#f59e0b', fill, 1.5, [], '塊石');
  });

  // 平面圖標註、八字拱夾角 L 與水流方向箭頭
  drawFlowArrow(plOx - 490 * kxPl, plOy + 220 * kyPl, -54, '水流方向');
  drawFlowArrow(plOx + 370 * kxPl, plOy + 390 * kyPl, -101, '水流方向');

  drawWorldText(`L = ${P.ang_L}°`, plOx + 335 * kxPl, plOy + 365 * kyPl, 14, '#22d3ee', 'center', 0, 'DIM');
  drawWorldText('主力石', plOx - 160 * kxPl, plOy + 150 * kyPl, 14, '#fef08a', 'center', 0, '!字');
  drawWorldText('副力石', plOx + 360 * kxPl, plOy + 30 * kyPl, 14, '#fef08a', 'center', 0, '!字');
  drawWorldText('從力石', plOx - 680 * kxPl, plOy - 200 * kyPl, 14, '#fef08a', 'center', 0, '!字');
  drawWorldText('連結石', plOx - 360 * kxPl, plOy - 135 * kyPl, 14, '#67e8f9', 'center', 0, '!字');
  drawWorldText('墊石', plOx + 110 * kxPl, plOy - 190 * kyPl, 14, '#cbd5e1', 'center', 0, '!字');
  drawWorldLeader([[plOx - 180 * kxPl, plOy + 285 * kyPl], [plOx - 185 * kxPl, plOy + 440 * kyPl]], '間隙石', '#22d3ee', 13);
  drawWorldLeader([[plOx - 65 * kxPl, plOy - 160 * kyPl], [plOx - 55 * kxPl, plOy - 330 * kyPl]], '主力石間之拱形成八字形', '#22d3ee', 13);

  const plTitleY = plOy - 390 * kyPl - 75;
  drawWorldText('平 面 圖', plOx, plTitleY, 20, '#38bdf8', 'center', 0, '字');
  drawWorldLine(plOx - 80, plTitleY - 16, plOx + 80, plTitleY - 16, '#38bdf8', 2.0, [], '字');

  // -------------------------------------------------------------------------
  // 視圖 4：【石材尺寸圖】(左下區)
  // -------------------------------------------------------------------------
  const { szOx, szOy, sizeSpacing } = L;
  const stones = RAW_DXF_VIEWS.size.stones;
  const targetHeights = [P.d_main, P.d_sub, P.d_minor];
  const dimLabels = [
    `d (${P.d_main}cm)`,
    `d/2 (${P.d_sub}cm)`,
    `d/4 (${P.d_minor}cm)`
  ];

  stones.forEach((st, idx) => {
    const hTarget = targetHeights[idx];
    const scaleSt = hTarget / (st.baseH * 100);
    const offsetX = idx * sizeSpacing;
    const pts = st.pts.map(p => [
      szOx + offsetX + (p[0] - st.cx) * 100 * scaleSt,
      szOy + (p[1] - RAW_DXF_VIEWS.size.y0) * 100 * scaleSt
    ]);
    drawWorldPoly(pts, true, '#f59e0b', 'rgba(217,119,6,0.26)', 1.6, [], '塊石');
    drawWorldText(st.label, szOx + offsetX, szOy + hTarget * 0.48, 14, '#fef08a', 'center', 0, '!字');

    const dimX = szOx + 2 * sizeSpacing + 90 + idx * 95;
    drawDimV(szOy, szOy + hTarget, szOx + offsetX + 45 * scaleSt, szOx + offsetX + 45 * scaleSt, dimX, dimLabels[idx]);
  });

  drawWorldText('石 材 尺 寸', szOx + sizeSpacing, szOy - 85, 18, '#38bdf8', 'center', 0, '字');
  drawWorldLine(szOx + sizeSpacing - 90, szOy - 101, szOx + sizeSpacing + 90, szOy - 101, '#38bdf8', 1.8, [], '字');

  // -------------------------------------------------------------------------
  // 視圖 5：【詳細圖：力石與墊石3點接合】(中下區)
  // -------------------------------------------------------------------------
  const { dtOx, dtOy, kDet } = L;
  RAW_DXF_VIEWS.detail.polys.forEach(pl => {
    const pts = pl.pts.map(p => [
      dtOx + (p[0] - RAW_DXF_VIEWS.detail.x0) * 100 * kDet,
      dtOy + (p[1] - RAW_DXF_VIEWS.detail.y0) * 100 * kDet
    ]);
    const fill = pl.role === 'force_stone' ? 'rgba(234,88,12,0.28)' : 'rgba(180,83,9,0.22)';
    drawWorldPoly(pts, pl.closed, '#f59e0b', fill, 1.6, [], '塊石');
  });

  RAW_DXF_VIEWS.detail.contacts.forEach(c => {
    const cx = dtOx + (c.cx - RAW_DXF_VIEWS.detail.x0) * 100 * kDet;
    const cy = dtOy + (c.cy - RAW_DXF_VIEWS.detail.y0) * 100 * kDet;
    drawWorldCircle(cx, cy, c.r * 100 * kDet, '#22d3ee', 'rgba(34,211,238,0.15)', 1.4, [4, 3], 'DIM');
  });

  drawWorldText('力石', dtOx - 65 * kDet, dtOy + 195 * kDet, 14, '#fef08a', 'center', 0, '!字');
  drawWorldText('墊石', dtOx + 155 * kDet, dtOy + 75 * kDet, 14, '#fef08a', 'center', 0, '!字');
  drawWorldLeader([[dtOx - 140 * kDet, dtOy + 155 * kDet], [dtOx - 90 * kDet, dtOy + 345 * kDet]], '力石與墊石之接合點至少有3點', '#22d3ee', 13);
  drawWorldLeader([[dtOx - 55 * kDet, dtOy + 25 * kDet], [dtOx + 10 * kDet, dtOy - 45 * kDet]], '接合點', '#22d3ee', 13);

  drawWorldText('詳 細 圖', dtOx, dtOy - 85, 18, '#38bdf8', 'center', 0, '字');
  drawWorldLine(dtOx - 70, dtOy - 101, dtOx + 70, dtOy - 101, '#38bdf8', 1.8, [], '字');

  // -------------------------------------------------------------------------
  // 6. 圖面內建「工程數量計算式表」與「原圖五大設計說明」
  // -------------------------------------------------------------------------
  drawQuantityTableOnCanvas(L.tableOx, L.tableOy, P);

  if (showNotes) {
    drawDesignNotesOnCanvas(L.tableOx + 1230, L.tableOy);
  }
}

function drawQuantityTableOnCanvas(tx, ty, P) {
  const rows = computeQuantities(P);
  const colW = [55, 250, 65, 520, 95, 195];
  const totalW = colW.reduce((a, b) => a + b, 0);
  const rowH = 30;
  const headH = 36;

  drawWorldPoly([[tx, ty], [tx + totalW, ty], [tx + totalW, ty - headH], [tx, ty - headH]], true, '#38bdf8', 'rgba(2,132,199,0.28)', 1.5, [], 'TABLE');
  drawWorldText('石樑固床工 (圖號：0607-1) 參數化工程數量計算式總表 (圖面尺寸 100% 對照)', tx + totalW / 2, ty - headH / 2, 14, '#38bdf8', 'center', 0, 'TABLE');

  const headers = ['項次', '工 項 名 稱', '單位', '工程數量計算式 (對應圖面標註尺寸)', '數量', '設計規範備註'];
  let curY = ty - headH;
  drawWorldPoly([[tx, curY], [tx + totalW, curY], [tx + totalW, curY - rowH], [tx, curY - rowH]], true, '#475569', 'rgba(30,41,59,0.85)', 1.2, [], 'TABLE');

  let cx = tx;
  headers.forEach((h, i) => {
    drawWorldText(h, cx + colW[i] / 2, curY - rowH / 2, 12, '#fde047', 'center', 0, 'TABLE');
    cx += colW[i];
    if (i < headers.length - 1) drawWorldLine(cx, ty - headH, cx, curY - rowH * (rows.length + 1), '#334155', 1.0, [], 'TABLE');
  });

  curY -= rowH;
  rows.forEach((r, idx) => {
    const bg = idx % 2 === 0 ? 'rgba(15,23,42,0.75)' : 'rgba(30,41,59,0.55)';
    drawWorldPoly([[tx, curY], [tx + totalW, curY], [tx + totalW, curY - rowH], [tx, curY - rowH]], true, '#334155', bg, 1.0, [], 'TABLE');
    let rx = tx;
    const vals = [r.no, r.name, r.unit, r.formula, String(r.qty), r.note];
    vals.forEach((v, i) => {
      const align = (i === 1 || i === 3 || i === 5) ? 'left' : 'center';
      const px = align === 'left' ? rx + 10 : rx + colW[i] / 2;
      const col = i === 4 ? '#4ade80' : (i === 3 ? '#67e8f9' : '#e2e8f0');
      drawWorldText(v, px, curY - rowH / 2, 11.5, col, align, 0, 'TABLE');
      rx += colW[i];
    });
    curY -= rowH;
  });
}

function drawDesignNotesOnCanvas(nx, ny) {
  const boxW = 980, boxH = 260;
  drawWorldPoly([[nx, ny], [nx + boxW, ny], [nx + boxW, ny - boxH], [nx, ny - boxH]], true, '#475569', 'rgba(15,23,42,0.80)', 1.4, [], '字');
  const lines = [
    '【石樑固床工 (0607-1) 原圖設計說明與規範】',
    '(一) 定義：指人為方式模仿其拱型結構，由不同尺寸的塊石和力石構成一類似拱型結構之固床工。',
    '(二) 目的：1.形成階梯狀溪床降低流速減緩沖刷  2.導引水流遠離溪岸防淘刷  3.與護岸共構形成地樑效應  4.增加曝氣溶氧  5.促進土砂落淤。',
    '(三) 適用範圍：1.參考混凝土固床工  2.坡度少於 6%  3.適用於常流水溪流。',
    '(四) 設計原則：1.力石(副、從)配置於溪流中央及兩岸法線共三處，主力石應大於 50 cm 為佳。',
    '     2.墊石之石尾朝向上游側，並以約 15° 傾斜角配置於溪床；力石與墊石之接合點至少有 3 點。',
    '     3.連接石配置於兩力石間，向流心上游呈約 15° 傾斜，分 2~3 層鋪置，直徑宜介於 20~50 cm 之間。',
    '     4.主力石、副力石、從力石高度比可呈 1 : 1/2 : 1/4 變化；系列固床工適當間距約 7.0 m ~ 25 m。'
  ];
  lines.forEach((ln, i) => {
    const col = i === 0 ? '#38bdf8' : '#cbd5e1';
    drawWorldText(ln, nx + 18, ny - 24 - i * 29, i === 0 ? 13.5 : 11.5, col, 'left', 0, '字');
  });
}

// ============================================================================
// 8. 視角全圖置中 zoomToFit() 與滑鼠平移/縮放事件
// ============================================================================
function zoomToFit() {
  const rect = canvas.parentElement.getBoundingClientRect();
  const cw = Math.max(800, rect.width || window.innerWidth - 370);
  const ch = Math.max(550, rect.height || window.innerHeight - 44);
  canvas.width = cw;
  canvas.height = ch;

  const P = getParams();
  const L = computeDynamicViewLayout(P);
  const { minX, maxX, minY, maxY } = L.bounds;
  camX = (minX + maxX) / 2;
  camY = (minY + maxY) / 2;
  const scaleX = (cw * 0.90) / (maxX - minX);
  const scaleY = (ch * 0.90) / (maxY - minY);
  scale = Math.min(scaleX, scaleY);
  renderCAD();
}

canvas.addEventListener('mousedown', e => {
  if (e.button !== 0) return;
  isDragging = true;
  dragStartX = e.clientX;
  dragStartY = e.clientY;
});
window.addEventListener('mousemove', e => {
  const rect = canvas.getBoundingClientRect();
  const [wx, wy] = screenToWorld(e.clientX - rect.left, e.clientY - rect.top);
  document.getElementById('hud-coords').textContent =
    `世界座標 (cm): X=${wx.toFixed(1)}, Y=${wy.toFixed(1)} | 縮放=${(scale * 100).toFixed(0)}% | 滾輪縮放・左鍵平移・雙擊置中`;
  if (!isDragging) return;
  const dx = e.clientX - dragStartX;
  const dy = e.clientY - dragStartY;
  dragStartX = e.clientX;
  dragStartY = e.clientY;
  camX -= dx / scale;
  camY += dy / scale;
  renderCAD();
});
window.addEventListener('mouseup', () => { isDragging = false; });

canvas.addEventListener('wheel', e => {
  e.preventDefault();
  const rect = canvas.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  const my = e.clientY - rect.top;
  const [wxBefore, wyBefore] = screenToWorld(mx, my);
  const factor = e.deltaY < 0 ? 1.12 : 0.89;
  scale = Math.max(0.05, Math.min(8.0, scale * factor));
  const [wxAfter, wyAfter] = screenToWorld(mx, my);
  camX += (wxBefore - wxAfter);
  camY += (wyBefore - wyAfter);
  renderCAD();
}, { passive: false });

canvas.addEventListener('dblclick', () => zoomToFit());
window.addEventListener('resize', () => renderCAD());

// ============================================================================
// 9. 無彈窗直接下載原生 AutoCAD DXF 與 CSV 數量計算書
// ============================================================================
function toDxfUnicode(str) {
  return String(str).split('').map(ch => {
    const code = ch.charCodeAt(0);
    return code > 127 ? `\\U+${code.toString(16).toUpperCase().padStart(4, '0')}` : ch;
  }).join('');
}

function exportDXF() {
  renderCAD();
  const out = [];
  const push = (c, v) => { out.push(String(c)); out.push(String(v)); };

  push(0, 'SECTION'); push(2, 'HEADER');
  push(9, '$ACADVER'); push(1, 'AC1015');
  push(9, '$INSUNITS'); push(70, 5);
  push(0, 'ENDSEC');

  push(0, 'SECTION'); push(2, 'ENTITIES');
  dxfEntities.forEach(e => {
    const lay = toDxfUnicode(e.layer || '0');
    if (e.type === 'LINE') {
      push(0, 'LINE'); push(8, lay);
      push(10, e.x1.toFixed(3)); push(20, e.y1.toFixed(3)); push(30, '0.0');
      push(11, e.x2.toFixed(3)); push(21, e.y2.toFixed(3)); push(31, '0.0');
    } else if (e.type === 'POLY') {
      push(0, 'LWPOLYLINE'); push(8, lay);
      push(90, e.pts.length);
      push(70, e.closed ? 1 : 0);
      e.pts.forEach(p => {
        push(10, p[0].toFixed(3));
        push(20, p[1].toFixed(3));
      });
    } else if (e.type === 'CIRCLE') {
      push(0, 'CIRCLE'); push(8, lay);
      push(10, e.cx.toFixed(3)); push(20, e.cy.toFixed(3)); push(30, '0.0');
      push(40, e.r.toFixed(3));
    } else if (e.type === 'TEXT') {
      push(0, 'TEXT'); push(8, lay);
      push(10, e.x.toFixed(3)); push(20, e.y.toFixed(3)); push(30, '0.0');
      push(40, (e.h * 0.75).toFixed(2));
      push(1, toDxfUnicode(e.txt));
    }
  });
  push(0, 'ENDSEC');
  push(0, 'EOF');

  const blob = new Blob([out.join('\r\n')], { type: 'application/dxf;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = '0607-1_石樑固床工_參數化標準圖.dxf';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

function exportCSV() {
  const P = getParams();
  const rows = computeQuantities(P);
  const lines = [
    '\uFEFF項次,工項名稱,單位,工程數量計算式(對應圖面尺寸),數量,設計規範備註'
  ];
  rows.forEach(r => {
    lines.push(`${r.no},"${r.name}",${r.unit},"${r.formula}",${r.qty},"${r.note}"`);
  });
  const blob = new Blob([lines.join('\r\n')], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = '0607-1_石樑固床工_工程數量計算表.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// ============================================================================
// 10. 綁定控制項事件 (修改數值時動態重算各視圖相對間距並鎖定當前視角)
// ============================================================================
document.querySelectorAll('#sidebar input, #sidebar select, #top-bar input').forEach(el => {
  el.addEventListener('input', () => {
    updateSidebarUI();
    renderCAD();
  });
  el.addEventListener('change', () => {
    updateSidebarUI();
    renderCAD();
  });
});

document.getElementById('btnPresetStd').addEventListener('click', () => {
  document.getElementById('p_W_bed').value = 900;
  document.getElementById('p_d_main').value = 100;
  document.getElementById('p_r_sub').value = 0.50;
  document.getElementById('p_r_minor').value = 0.25;
  document.getElementById('p_ang_L').value = 37.9;
  document.getElementById('p_ang_pad').value = 15;
  document.getElementById('p_H_drop').value = 35;
  updateSidebarUI();
  zoomToFit();
});

document.getElementById('btnPresetDxf').addEventListener('click', () => {
  document.getElementById('p_W_bed').value = 900;
  document.getElementById('p_d_main').value = 226.4;
  document.getElementById('p_r_sub').value = 0.71;
  document.getElementById('p_r_minor').value = 0.45;
  document.getElementById('p_ang_L').value = 37.9;
  document.getElementById('p_ang_pad').value = 15;
  document.getElementById('p_H_drop').value = 33.8;
  updateSidebarUI();
  zoomToFit();
});

document.getElementById('btnZoomFit').addEventListener('click', () => zoomToFit());
document.getElementById('btnExportDXF').addEventListener('click', () => exportDXF());
document.getElementById('btnExportCSV').addEventListener('click', () => exportCSV());

updateSidebarUI();
requestAnimationFrame(() => zoomToFit());

  // ---- v6.3 數量改由圖形計算＋補標註（or3fix.py）----

  function __A(p) { let s = 0; for (let i = 0; i < p.length; i++) { const a = p[i], b = p[(i + 1) % p.length]; s += a[0] * b[1] - b[0] * a[1]; } return Math.abs(s) / 2; }
  function __C(p) { let x = 0, y = 0; p.forEach(q => { x += q[0]; y += q[1]; }); return [x / p.length, y / p.length]; }
  function __notesWrap(HEADH, ROWH, TH, notes) {
    const __q = drawQuantityTableOnCanvas;
    drawQuantityTableOnCanvas = function (tx, ty, P) { const n0 = O.length; __q(tx, ty, P); let yb = Infinity; for (let i = n0; i < O.length; i++) { const o = O[i]; if (o.p) o.p.forEach(v => { yb = Math.min(yb, v[1]); }); else if (Number.isFinite(o.y)) yb = Math.min(yb, o.y); } if (!Number.isFinite(yb)) yb = ty - HEADH - ROWH * (computeQuantities(P).length + 1); const N = notes(P), y0 = yb - TH * 1.6;
      drawWorldText('數量計算依據（圖上未直接標示的推算值與係數）：', tx, y0, TH, '#fde047', 'left', 0, 'TABLE');
      N.forEach((s, i) => drawWorldText('・' + s, tx + TH, y0 - (i + 1) * TH * 1.7, TH * 0.92, '#fde047', 'left', 0, 'TABLE')); };
  }


  function __sx(dx, P) { return dx < 0 ? dx * P.fL : dx * P.fR; }
  { const __P0 = getParams; getParams = function () { const P = __P0(), g = (id, d) => { const v = parseFloat(document.getElementById(id).value); return Number.isFinite(v) ? v : d; };
    const eq = String(document.getElementById('p_LReq').value) !== '0', WhL = eq ? P.W_bed / 2 : g('p_WhL', P.W_bed / 2), WhR = eq ? WhL : g('p_WhR', P.W_bed / 2), W = eq ? P.W_bed : WhL + WhR;
    return Object.assign(P, { eq, WhL, WhR, W_bed: W, fL: 2 * WhL / W, fR: 2 * WhR / W, k_sh: g('p_k_sh', 0.68), r_w: g('p_r_w', 0.85), r_l: g('p_r_l', 0.90), c_ex: g('p_c_ex', 2.4), c_cw: g('p_c_cw', 1.4), k_cn: g('p_k_cn', 0.78), pad_l: g('p_pad_l', 1.25), pad_t: g('p_pad_t', 0.55), k_pd: g('p_k_pd', 0.75) }); }; }
  computeQuantities = function (P) {
    const rows = [], st = (n, d, nm, no, note) => { const v = n * P.k_sh * (d / 100) * (P.r_w * d / 100) * (P.r_l * d / 100); rows.push({ no, name: nm, unit: 'm³', formula: `${n}顆 × ${P.k_sh} × ${d} × ${(P.r_w * d).toFixed(1)} × ${(P.r_l * d).toFixed(1)} ÷10⁶`, qty: +v.toFixed(3), note }); };
    st(1, P.d_main, '主力石 (中央計畫斷面)', '1', `高 d=${P.d_main}cm`); st(2, P.d_sub, '副力石 (左右各 1)', '2', `高 ${P.d_sub}cm`); st(2, P.d_minor, '從力石 (兩岸法線，左右各 1)', '3', `高 ${P.d_minor}cm`);
    const cw = Math.max(100, P.W_bed - P.c_ex * P.d_main), v4 = cw * (P.N_layer * P.D_conn) * (P.c_cw * P.D_conn) * P.k_cn / 1e6;
    rows.push({ no: '4', name: `連接石與間隙石 (${P.N_layer}層疊砌)`, unit: 'm³', formula: `${cw.toFixed(0)} × ${P.N_layer * P.D_conn} × ${(P.c_cw * P.D_conn).toFixed(0)} × ${P.k_cn} ÷10⁶`, qty: +v4.toFixed(3), note: `連接石區寬＝W_bed ${P.W_bed} − ${P.c_ex}d` });
    const v5 = P.W_bed * (P.pad_l * P.d_main) * (P.pad_t * P.d_main) * P.k_pd / Math.cos(P.ang_pad * Math.PI / 180) / 1e6;
    rows.push({ no: '5', name: '底部墊石與尾隙石', unit: 'm³', formula: `${P.W_bed} × ${(P.pad_l * P.d_main).toFixed(0)} × ${(P.pad_t * P.d_main).toFixed(0)} × ${P.k_pd} ÷ cos${P.ang_pad}° ÷10⁶`, qty: +v5.toFixed(3), note: `石尾朝上游傾斜 ${P.ang_pad}°` });
    return rows;
  };
  __notesWrap(36, 30, 13, P => [
    `力石：高 d × 寬 ${P.r_w}d × 長 ${P.r_l}d × 形狀係數 ${P.k_sh}（主 ${P.d_main}、副 ${P.d_sub}、從 ${P.d_minor} cm）`,
    `連接石區寬＝W_bed − ${P.c_ex}d＝${P.W_bed} − ${(P.c_ex * P.d_main).toFixed(0)}＝${Math.max(100, P.W_bed - P.c_ex * P.d_main).toFixed(0)} cm；層厚 ${P.N_layer}×${P.D_conn}；寬 ${P.c_cw}D＝${(P.c_cw * P.D_conn).toFixed(0)} cm；實積率 ${P.k_cn}`,
    `墊石區：長 ${P.pad_l}d＝${(P.pad_l * P.d_main).toFixed(0)}、厚 ${P.pad_t}d＝${(P.pad_t * P.d_main).toFixed(0)} cm、實積率 ${P.k_pd}`,
    `溪床寬 W_bed＝左半寬 ${P.WhL} ＋ 右半寬 ${P.WhR} cm（正面、平面圖依左右分別縮放）`]);

  // ---- 圖元輸出（覆寫原工具的 Canvas 繪圖函式）----
function drawWorldLine(x1, y1, x2, y2, color = '#ffffff', width = 1.4, dash = [], layer = '0') { O.push({ k: 'L', p: [[x1, y1], [x2, y2]], c: color, w: width, d: dash || [], ly: layer }); }
function drawWorldPoly(pts, closed = true, strokeCol = '#f59e0b', fillCol = null, width = 1.5, dash = [], layer = '塊石') { if (pts && pts.length >= 2) O.push({ k: 'P', p: pts.map(q => [q[0], q[1]]), c: strokeCol, w: width, f: fillCol, cl: !!closed, d: dash || [], ly: layer }); }
function drawWorldCircle(cx, cy, r, strokeCol = '#22d3ee', fillCol = null, width = 1.3, dash = [], layer = 'DIM') { O.push({ k: 'C', x: cx, y: cy, r, c: strokeCol, f: fillCol, w: width, ly: layer }); }
function drawWorldText(txt, wx, wy, worldH = 14, color = '#e2e8f0', align = 'center', rotDeg = 0, layer = '字') { const L = String(txt).split('\n'); L.forEach((s, i) => O.push({ k: 'T', x: wx, y: wy - (i - (L.length - 1) / 2) * worldH * 1.25, s, h: worldH, c: color, al: align, bl: 'middle', rot: (rotDeg || 0) * Math.PI / 180, ly: layer })); }
  let LAST_L = null;   // v5.7：記錄原工具的視圖排版（各視圖原點），供平面／縱橫斷面取用原圖視圖
  { const __f = computeDynamicViewLayout; computeDynamicViewLayout = function (P) { return (LAST_L = __f(P)); }; }
  return {
    DEF, PR: [{"k": "p_W_bed", "nm": "溪床計畫寬度 W_bed (cm)", "def": "900", "g": 0, "st": "50", "min": "300", "max": "3000"}, {"k": "p_d_main", "nm": "主力石高度 d (cm) [規範>50]", "def": "100", "g": 0, "st": "5", "min": "40", "max": "350"}, {"k": "p_r_sub", "nm": "副力石高度比 r_sub (預設 0.50)", "def": "0.50", "g": 0, "st": "0.05", "min": "0.25", "max": "0.90"}, {"k": "p_r_minor", "nm": "從力石高度比 r_minor (預設 0.25)", "def": "0.25", "g": 0, "st": "0.05", "min": "0.15", "max": "0.75"}, {"k": "p_ang_L", "nm": "八字拱夾角 L (°) [原圖 37.9°]", "def": "37.9", "g": 0, "st": "0.5", "min": "15", "max": "75"}, {"k": "p_ang_pad", "nm": "墊石與連接石傾角 θ_pad (°)", "def": "15", "g": 0, "st": "1", "min": "5", "max": "30"}, {"k": "p_H_drop", "nm": "上下游計畫河床落差 ΔH_drop (cm)", "def": "35", "g": 0, "st": "5", "min": "10", "max": "150"}, {"k": "p_N_layer", "nm": "連接石鋪置層數 N_layer (2~3層)", "def": "3", "g": 1, "opt": [["2", "2 層"], ["3", "3 層"]]}, {"k": "p_D_conn", "nm": "連接石平均粒徑 D_conn (20~50cm)", "def": "35", "g": 1, "st": "5", "min": "15", "max": "80"}, {"k": "p_k_gap", "nm": "視圖相對安全間距係數 k_gap", "def": "1.0", "g": 1, "st": "0.1", "min": "0.6", "max": "2.5"}, {"k": "p_LReq", "nm": "左右兩側", "def": "1", "opt": [["1", "左右相同（W_bed 平分）"], ["0", "左右分開"]], "g": 3}, {"k": "p_WhL", "nm": "左半寬 (cm)", "def": "450", "st": "10", "min": "150", "max": "1500", "g": 3}, {"k": "p_WhR", "nm": "右半寬 (cm)", "def": "450", "st": "10", "min": "150", "max": "1500", "g": 3}, {"k": "p_k_sh", "nm": "力石形狀係數", "def": "0.68", "st": "0.01", "min": "0.3", "max": "1", "g": 3}, {"k": "p_r_w", "nm": "力石寬比 (×d)", "def": "0.85", "st": "0.01", "min": "0.5", "max": "1.5", "g": 3}, {"k": "p_r_l", "nm": "力石長比 (×d)", "def": "0.90", "st": "0.01", "min": "0.5", "max": "1.5", "g": 3}, {"k": "p_c_ex", "nm": "連接石區扣除寬 (×d)", "def": "2.4", "st": "0.1", "min": "0", "max": "5", "g": 3}, {"k": "p_c_cw", "nm": "連接石寬 (×D)", "def": "1.4", "st": "0.1", "min": "0.5", "max": "3", "g": 3}, {"k": "p_k_cn", "nm": "連接石實積率", "def": "0.78", "st": "0.01", "min": "0.3", "max": "1", "g": 3}, {"k": "p_pad_l", "nm": "墊石長 (×d)", "def": "1.25", "st": "0.05", "min": "0.5", "max": "3", "g": 3}, {"k": "p_pad_t", "nm": "墊石厚 (×d)", "def": "0.55", "st": "0.05", "min": "0.2", "max": "1.5", "g": 3}, {"k": "p_k_pd", "nm": "墊石實積率", "def": "0.75", "st": "0.01", "min": "0.3", "max": "1", "g": 3}], GT: ["1. 石樑本體與力石尺寸 (cm / °)", "2. 連接石、間隙石與墊石配置", "3. 原圖設計原則自動檢核 (0607-1)", "左右分開與係數"], title: "水保標準圖參數化 CAD — 石樑固床工 (圖號：0607-1)",
    run(R, opt) {
      RR = R || {}; OPT = Object.assign({}, opt || {}); O = [];
      try {
        
        LAST_L = null; const P = getParams(), rows = computeQuantities(P);
        let checks = [];
        try { updateSidebarUI(); const t = el('normCheckList').innerHTML || ''; checks = [...t.matchAll(/<div class="check-item ?(warn)?">([\s\S]*?)<\/div>/g)].map(m => ({ ok: !m[1], text: m[2].replace(/^\s*[✔⚠]\s*/, '').replace(/<[^>]+>/g, '') })); } catch (e) { }
        if (OPT.draw) renderCAD();
        return { P, rows, checks, O, L: LAST_L };
      } finally { RR = null; }
    }
  };
})();
TCO_S['e606'] = (function () {   // 水保標準圖參數化 CAD — 嵌石固床工 (圖號：6-06)
  const DEF = {"p_L": "1338", "p_slope_n": "9.8", "p_W_weir": "877", "p_t_slab": "78", "p_S_stone": "135", "p_h1": "30", "p_psi": "45", "p_B_up": "201", "p_D_up": "207", "p_B_dn": "176", "p_D_dn": "206", "p_L_riprap": "229", "p_k_gap": "1.0", "p_N_bay": "4", "chkShowTable": true, "p_LReq": "1", "p_WhL": "438.5", "p_WhR": "438.5", "p_lip_dn": "137", "p_lip_up": "137", "p_sl_t0": "113", "p_sl_o0": "15", "p_sl_o1": "10", "p_dn_x": "18", "p_dn_r1": "0.62", "p_dn_r2": "0.35", "p_up_rise": "20", "p_up_toe": "24", "p_up_o": "15", "p_rip_d": "175", "p_dstep_r": "0.88", "p_k_step": "0.58", "p_k_cob": "0.62", "p_k_rip": "0.80"};
  let RR = null, OPT = {}, O = [];
  const EL = {}, CTX = new Proxy({}, { get: (t, k) => (k in t ? t[k] : () => ({ width: 0 })), set: (t, k, v) => { t[k] = v; return true; } });
  const el = id => EL[id] || (EL[id] = { get value() { const v = RR && RR[id] !== undefined && RR[id] !== null && RR[id] !== '' ? RR[id] : DEF[id]; return v === undefined ? '' : String(v); }, set value(v) {},
    get checked() { return OPT[id] !== undefined ? !!OPT[id] : !!DEF[id]; }, set checked(v) {}, textContent: '', innerHTML: '', style: {}, width: 1600, height: 1000, classList: { add() {}, remove() {}, toggle() {} },
    addEventListener() {}, appendChild() {}, getContext() { return CTX; }, getBoundingClientRect: () => ({ left: 0, top: 0, width: 1600, height: 1000 }), parentElement: { getBoundingClientRect: () => ({ left: 0, top: 0, width: 1600, height: 1000 }) } });
  const document = { getElementById: el, querySelectorAll: () => [], querySelector: () => null, createElement: () => ({ click() {}, style: {}, className: '', innerHTML: '', appendChild() {}, querySelectorAll: () => [], querySelector: () => ({ addEventListener() {}, getAttribute: () => '0', value: '' }) }), body: { appendChild() {}, removeChild() {} } };
  const window = { addEventListener() {}, innerWidth: 1990, innerHeight: 1044, devicePixelRatio: 1 };
  const requestAnimationFrame = () => 0, alert = () => {};

// ============================================================================
// 1. 原圖 6-06.dxf 塊石多邊形模板庫 (包含 4 圈同心踏步大石 + 不規則滿鋪間隙塊石)
// ============================================================================
const CONCENTRIC_STONE_TEMPLATES = [
  [
    [[-0.46,-0.30],[-0.48,0.18],[-0.16,0.47],[0.26,0.48],[0.47,0.22],[0.43,-0.24],[0.18,-0.47],[-0.20,-0.46]],
    [[-0.35,-0.22],[-0.37,0.14],[-0.11,0.36],[0.20,0.37],[0.36,0.16],[0.32,-0.18],[0.13,-0.36],[-0.15,-0.35]],
    [[-0.24,-0.14],[-0.25,0.09],[-0.07,0.25],[0.14,0.25],[0.25,0.11],[0.22,-0.12],[0.08,-0.25],[-0.10,-0.24]],
    [[-0.13,-0.07],[-0.14,0.05],[-0.03,0.13],[0.07,0.14],[0.13,0.06],[0.11,-0.06],[0.04,-0.13],[-0.05,-0.12]]
  ],
  [
    [[-0.44,0.02],[-0.41,0.37],[-0.10,0.48],[0.36,0.40],[0.48,0.06],[0.42,-0.32],[0.16,-0.48],[-0.28,-0.42]],
    [[-0.34,0.02],[-0.31,0.28],[-0.07,0.37],[0.27,0.30],[0.37,0.04],[0.32,-0.24],[0.12,-0.36],[-0.21,-0.32]],
    [[-0.23,0.01],[-0.21,0.19],[-0.04,0.25],[0.18,0.20],[0.25,0.02],[0.21,-0.16],[0.08,-0.24],[-0.14,-0.21]],
    [[-0.12,0.00],[-0.11,0.10],[-0.02,0.13],[0.09,0.10],[0.13,0.01],[0.11,-0.08],[0.04,-0.12],[-0.07,-0.11]]
  ],
  [
    [[-0.45,-0.16],[-0.46,0.26],[-0.06,0.48],[0.42,0.34],[0.46,-0.05],[0.38,-0.36],[0.08,-0.48],[-0.28,-0.43]],
    [[-0.34,-0.12],[-0.35,0.20],[-0.04,0.36],[0.32,0.26],[0.35,-0.04],[0.29,-0.27],[0.06,-0.36],[-0.21,-0.32]],
    [[-0.23,-0.08],[-0.24,0.13],[-0.02,0.24],[0.21,0.17],[0.24,-0.02],[0.19,-0.18],[0.04,-0.24],[-0.14,-0.21]],
    [[-0.12,-0.04],[-0.12,0.07],[-0.01,0.12],[0.11,0.09],[0.12,-0.01],[0.10,-0.09],[0.02,-0.12],[-0.07,-0.11]]
  ]
];

// 單圈自然不規則塊石模板 (用於平面圖分區內密鋪與斷面圖間隙塊石)
const COBBLE_SHAPES = [
  [[-0.45,-0.25],[-0.48,0.15],[-0.20,0.46],[0.25,0.48],[0.48,0.18],[0.42,-0.28],[0.12,-0.48],[-0.22,-0.45]],
  [[-0.42,-0.32],[-0.46,0.20],[-0.08,0.48],[0.38,0.36],[0.47,-0.06],[0.34,-0.40],[-0.05,-0.47]],
  [[-0.46,0.00],[-0.36,0.40],[0.05,0.48],[0.44,0.28],[0.46,-0.18],[0.20,-0.46],[-0.26,-0.42]]
];

// ============================================================================
// 2. 讀取介面參數與衍生計算 (加寬/加長自動增加塊石顆數，不拉長石頭)
// ============================================================================
function getParams() {
  const L = parseFloat(document.getElementById('p_L').value) || 1338;
  const N_bay = parseInt(document.getElementById('p_N_bay').value) || 4;
  const slope_n = parseFloat(document.getElementById('p_slope_n').value) || 9.8;
  const W_weir = parseFloat(document.getElementById('p_W_weir').value) || 877;
  const t_slab = parseFloat(document.getElementById('p_t_slab').value) || 78;

  const S_stone = parseFloat(document.getElementById('p_S_stone').value) || 135;
  const h1 = parseFloat(document.getElementById('p_h1').value) || 30;
  const psi = parseFloat(document.getElementById('p_psi').value) || 45;

  const B_up = parseFloat(document.getElementById('p_B_up').value) || 201;
  const D_up = parseFloat(document.getElementById('p_D_up').value) || 207;
  const B_dn = parseFloat(document.getElementById('p_B_dn').value) || 176;
  const D_dn = parseFloat(document.getElementById('p_D_dn').value) || 206;
  const L_riprap = parseFloat(document.getElementById('p_L_riprap').value) || 229;
  const k_gap = parseFloat(document.getElementById('p_k_gap').value) || 1.0;

  const L1 = +(L / N_bay).toFixed(1);
  const dH_slope = +(L / slope_n).toFixed(1);
  const topLip_dn = 137;
  const topLip_up = 137;

  // 依據橫向寬度 W_weir 與塊石間距 S_stone 動態計算橫向踏步石顆數 (原圖 W=877, S=135 時為 5 顆，上游巨石為 4 顆)
  // 當 W_weir 加寬時自動增加塊石顆數，不將單顆塊石拉長！
  const stepPitchY = S_stone * (877 / (5 * 135)); // 對應原圖 175.4cm 基準節距
  const nStepRows = Math.max(1, Math.round(W_weir / stepPitchY));
  const upPitchY = S_stone * (877 / (4 * 135));   // 對應原圖上游巨石 219.25cm 基準節距
  const nUpRows = Math.max(1, Math.round(W_weir / upPitchY));

  // 依據單段長 L1 與嵌石粒徑 psi 動態計算每段斷面內的嵌石顆數 (原圖 L1=334.5, psi=45 時為 4 顆)
  const stepR = 44;
  const remSpan = Math.max(40, L1 - stepR * 1.95);
  const cobblePitchX = psi * (248.7 / (4 * 45)); // 對應原圖單顆嵌石水平節距約 62.2cm
  const nCobblesPerBay = Math.max(1, Math.round(remSpan / cobblePitchX));

  return {
    L, N_bay, L1, slope_n, dH_slope, W_weir, t_slab,
    S_stone, h1, psi, B_up, D_up, B_dn, D_dn, L_riprap,
    topLip_dn, topLip_up, k_gap,
    nStepRows, nUpRows, nCobblesPerBay
  };
}

// ============================================================================
// 3. 工程數量計算表 (100% 對應圖面標註尺寸與動態塊石顆數)
// ============================================================================
function computeQuantities(P) {
  const rows = [];
  const L_m = P.L / 100;
  const W_m = P.W_weir / 100;
  const t_m = P.t_slab / 100;
  const psi_m = P.psi / 100;
  const slopeLen_m = +(Math.hypot(L_m, P.dH_slope / 100)).toFixed(3);

  // 1. 踏步臺式大塊石 (每排 nStepRows 顆 × (N_bay + 1) 排 + 上游端牆 nUpRows 顆)
  const nStepStones = P.nStepRows * (P.N_bay + 1) + P.nUpRows;
  const dStep_m = P.S_stone * 0.88 / 100;
  const v_step = +(nStepStones * 0.58 * Math.pow(dStep_m, 3)).toFixed(2);
  rows.push({
    no: '1',
    name: `踏步臺式主塊石 (共${nStepStones}顆, 每排${P.nStepRows}顆)`,
    unit: 'm³',
    formula: `[${P.nStepRows}顆×(${P.N_bay}+1)排 + 上游${P.nUpRows}顆] × 0.58 × (${(dStep_m * 100).toFixed(0)}/100)³`,
    qty: v_step,
    note: `間距 S=${P.S_stone}cm (隨寬度自動增減顆數)`
  });

  // 2. 斜坡面層嵌石 (ψ=30~50cm, 突出 h1≦30cm)
  const v_cobble = +(slopeLen_m * W_m * psi_m * 0.62).toFixed(2);
  rows.push({
    no: '2',
    name: `嵌石固床工面層塊石 (ψ=${P.psi}cm, 每段${P.nCobblesPerBay}排)`,
    unit: 'm³',
    formula: `斜長 ${slopeLen_m}m × 寬(${P.W_weir}/100) × 粒徑(${P.psi}/100) × 0.62`,
    qty: v_cobble,
    note: `ψ=30~50cm, 突出 h1=${P.h1}≦30cm`
  });

  // 3. 斜坡混凝土底板與步臺膠結 (厚 t_slab)
  const v_slab = +(slopeLen_m * W_m * t_m * 0.72).toFixed(2);
  rows.push({
    no: '3',
    name: `混凝土步臺與斜坡底板 (厚${P.t_slab}cm, 坡度1:${P.slope_n})`,
    unit: 'm³',
    formula: `斜長 ${slopeLen_m}m × 寬(${P.W_weir}/100) × 厚(${P.t_slab}/100) × 0.72`,
    qty: v_slab,
    note: `總長 L=${P.L}cm (${P.N_bay}段, L1=${P.L1}cm)`
  });

  // 4. 上下游嵌石固床工混凝土端牆基座
  const v_walls = +(((P.B_up / 100) * (P.D_up / 100) + (P.B_dn / 100) * (P.D_dn / 100)) * W_m * 0.78).toFixed(2);
  rows.push({
    no: '4',
    name: `上下游嵌石固床工混凝土基座`,
    unit: 'm³',
    formula: `[(${P.B_up}×${P.D_up})/10000 + (${P.B_dn}×${P.D_dn})/10000] × 寬(${P.W_weir}/100) × 0.78`,
    qty: v_walls,
    note: `上游 ${P.B_up}×${P.D_up}cm / 下游 ${P.B_dn}×${P.D_dn}cm`
  });

  // 5. 下游回填塊石 (護坦 3 層疊砌)
  const v_riprap = +((P.L_riprap / 100) * (P.D_dn * 0.85 / 100) * W_m * 0.80).toFixed(2);
  rows.push({
    no: '5',
    name: `下游護坦回填塊石 (長${P.L_riprap}cm, 3層疊砌)`,
    unit: 'm³',
    formula: `(${P.L_riprap}/100) × 深(${(P.D_dn * 0.85).toFixed(0)}/100) × 寬(${P.W_weir}/100) × 0.80`,
    qty: v_riprap,
    note: `原圖左側回填塊石區`
  });

  return rows;
}

function updateSidebarUI() {
  const P = getParams();
  document.getElementById('drv_slope_info').textContent =
    `單段長 L1 = ${P.L1} cm (${P.N_bay}段) ｜ 高差 ΔH = ${P.dH_slope} cm`;
  document.getElementById('drv_stone_info').textContent =
    `橫向踏步石 = ${P.nStepRows} 顆/排 ｜ 斷面每段嵌石 = ${P.nCobblesPerBay} 顆`;

  const checks = [
    {
      ok: P.S_stone >= 100 && P.S_stone <= 150,
      msg: `[原圖標註 S] 踏步塊石間距 S=${P.S_stone}cm ${P.S_stone >= 100 && P.S_stone <= 150 ? '(符合 100~150cm)' : '(超出 100~150cm)'}`
    },
    {
      ok: P.h1 <= 30,
      msg: `[原圖標註 h1] 塊石突出高度 h1=${P.h1}cm ${P.h1 <= 30 ? '(符合 h1≦30cm)' : '(超過 30cm 上限)'}`
    },
    {
      ok: P.psi >= 30 && P.psi <= 50,
      msg: `[原圖標註 ψ] 嵌石粒徑 ψ=${P.psi}cm ${P.psi >= 30 && P.psi <= 50 ? '(符合 30~50cm)' : '(超出 30~50cm)'}`
    },
    {
      ok: P.slope_n >= 8,
      msg: `[原圖坡度 1:n] 縱坡 1:${P.slope_n} ${P.slope_n >= 8 ? '(符合 1:8~1:10或更緩)' : '(陡於 1:8)'}`
    }
  ];

  const box = document.getElementById('normCheckList');
  box.innerHTML = checks.map(c =>
    `<div class="check-item ${c.ok ? '' : 'warn'}">${c.ok ? '✔' : '⚠'} ${c.msg}</div>`
  ).join('');
}

// ============================================================================
// 4. Canvas 2D 繪圖核心與世界座標轉換 (單位：cm)
// ============================================================================
const canvas = document.getElementById('cadCanvas');
const ctx = canvas.getContext('2d');
let camX = 650, camY = 450, scale = 0.36;
let isDragging = false, dragStartX = 0, dragStartY = 0;
let dxfEntities = [];

function worldToScreen(wx, wy) {
  const cw = canvas.width || 1100;
  const ch = canvas.height || 750;
  return [
    cw / 2 + (wx - camX) * scale,
    ch / 2 - (wy - camY) * scale
  ];
}
function screenToWorld(sx, sy) {
  const cw = canvas.width || 1100;
  const ch = canvas.height || 750;
  return [
    camX + (sx - cw / 2) / scale,
    camY - (sy - ch / 2) / scale
  ];
}

function drawWorldLine(x1, y1, x2, y2, color = '#ffffff', width = 1.4, dash = [], layer = '0') {
  const [sx1, sy1] = worldToScreen(x1, y1);
  const [sx2, sy2] = worldToScreen(x2, y2);
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.setLineDash(dash);
  ctx.beginPath();
  ctx.moveTo(sx1, sy1);
  ctx.lineTo(sx2, sy2);
  ctx.stroke();
  ctx.restore();
  dxfEntities.push({ type: 'LINE', layer, x1, y1, x2, y2 });
}

function drawWorldPoly(pts, closed = true, strokeCol = '#f97316', fillCol = null, width = 1.4, dash = [], layer = '塊石') {
  if (!pts || pts.length < 2) return;
  ctx.save();
  ctx.beginPath();
  pts.forEach((p, idx) => {
    const [sx, sy] = worldToScreen(p[0], p[1]);
    if (idx === 0) ctx.moveTo(sx, sy);
    else ctx.lineTo(sx, sy);
  });
  if (closed) ctx.closePath();
  if (fillCol) {
    ctx.fillStyle = fillCol;
    ctx.fill();
  }
  if (strokeCol) {
    ctx.strokeStyle = strokeCol;
    ctx.lineWidth = width;
    ctx.setLineDash(dash);
    ctx.stroke();
  }
  ctx.restore();
  dxfEntities.push({ type: 'POLY', layer, pts, closed });
}

function drawWorldText(txt, wx, wy, worldH = 26, color = '#22d3ee', align = 'center', rotDeg = 0, layer = '!字') {
  const [sx, sy] = worldToScreen(wx, wy);
  const px = Math.max(9.5, Math.min(28, worldH * scale));
  ctx.save();
  ctx.translate(sx, sy);
  if (rotDeg) ctx.rotate(-rotDeg * Math.PI / 180);
  ctx.font = `500 ${px}px "DFKai-SB", "Microsoft JhengHei", serif`;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  const lines = String(txt).split('\n');
  lines.forEach((line, idx) => {
    const dy = (idx - (lines.length - 1) / 2) * (px * 1.25);
    ctx.fillText(line, 0, dy);
  });
  ctx.restore();
  dxfEntities.push({ type: 'TEXT', layer, txt: String(txt).replace(/\n/g, ' '), x: wx, y: wy, h: worldH, rotDeg });
}

// 繪製原圖 3~4 圈同心石紋塊石 (用於踏步主石與回填大塊石)
function drawConcentricStone(cx, cy, rx, ry, tplIdx = 0, rotRad = 0, ringsCount = 4) {
  const tpl = CONCENTRIC_STONE_TEMPLATES[tplIdx % CONCENTRIC_STONE_TEMPLATES.length];
  const cosA = Math.cos(rotRad), sinA = Math.sin(rotRad);
  const nRings = Math.min(ringsCount, tpl.length);
  for (let r = 0; r < nRings; r++) {
    const ring = tpl[r];
    const pts = ring.map(uv => {
      const lx = uv[0] * rx * 2.0;
      const ly = uv[1] * ry * 2.0;
      return [
        cx + lx * cosA - ly * sinA,
        cy + lx * sinA + ly * cosA
      ];
    });
    const lw = r === 0 ? 1.55 : 1.1;
    drawWorldPoly(pts, true, '#f97316', null, lw, [], '塊石');
  }
}

// 繪製單圈不規則塊石 (用於平面圖滿鋪區域與斷面圖斜坡嵌石)
function drawSingleCobble(cx, cy, rx, ry, tplIdx = 0, rotRad = 0) {
  const ring = COBBLE_SHAPES[tplIdx % COBBLE_SHAPES.length];
  const cosA = Math.cos(rotRad), sinA = Math.sin(rotRad);
  const pts = ring.map(uv => {
    const lx = uv[0] * rx * 2.0;
    const ly = uv[1] * ry * 2.0;
    return [
      cx + lx * cosA - ly * sinA,
      cy + lx * sinA + ly * cosA
    ];
  });
  drawWorldPoly(pts, true, '#f97316', null, 1.35, [], '塊石');
}

// 在矩形區域 [xMin, xMax, yMin, yMax] 內密鋪原圖風格之不規則塊石 (尺寸固定、隨範圍自動增加塊石顆數，絕不將石頭拉長)
function fillRegionWithCobbles(xMin, xMax, yMin, yMax, targetCobbleX, targetCobbleY, seedOffset = 0) {
  const width = xMax - xMin;
  const height = yMax - yMin;
  if (width <= 20 || height <= 20) return;

  const nCols = Math.max(1, Math.round(width / targetCobbleX));
  const dx = width / nCols;
  const nRows = Math.max(1, Math.round(height / targetCobbleY));
  const dy = height / nRows;

  // 鎖定單顆塊石最大半徑上限，避免極窄或極寬區間把石頭拉扁
  const baseRx = Math.min(dx * 0.46, targetCobbleX * 0.54);
  const baseRy = Math.min(dy * 0.46, targetCobbleY * 0.54);

  for (let c = 0; c < nCols; c++) {
    const isOddCol = (c % 2 === 1);
    for (let r = 0; r < nRows; r++) {
      const hash = Math.sin((c * 17 + r * 31 + seedOffset) * 12.9898) * 43758.5453;
      const frac = hash - Math.floor(hash);
      const frac2 = (hash * 1.7) - Math.floor(hash * 1.7);

      const cx = xMin + (c + 0.5 + (frac - 0.5) * 0.14) * dx;
      let cy = yMin + (r + 0.5 + (isOddCol ? 0.18 : -0.12) + (frac2 - 0.5) * 0.14) * dy;
      cy = Math.max(yMin + baseRy * 0.92, Math.min(yMax - baseRy * 0.92, cy));

      const rx = baseRx * (0.96 + (frac - 0.5) * 0.14);
      const ry = baseRy * (0.96 + (frac2 - 0.5) * 0.14);
      const rot = (frac - 0.5) * 0.65;
      drawSingleCobble(cx, cy, rx, ry, c + r + seedOffset, rot);
    }
  }
}

// 繪製原圖 AR-CONC 混凝土骨材與砂漿點孵化 (對應 A94D, A94E, A94F)
function drawArConcHatch(polyPts) {
  if (!polyPts || polyPts.length < 3) return;
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  polyPts.forEach(p => {
    if (p[0] < minX) minX = p[0];
    if (p[0] > maxX) maxX = p[0];
    if (p[1] < minY) minY = p[1];
    if (p[1] > maxY) maxY = p[1];
  });

  ctx.save();
  ctx.beginPath();
  polyPts.forEach((p, idx) => {
    const [sx, sy] = worldToScreen(p[0], p[1]);
    if (idx === 0) ctx.moveTo(sx, sy);
    else ctx.lineTo(sx, sy);
  });
  ctx.closePath();
  ctx.clip();

  ctx.strokeStyle = 'rgba(148,163,184,0.55)';
  ctx.fillStyle = 'rgba(203,213,225,0.45)';
  ctx.lineWidth = 1.0;

  const step = 42;
  for (let gx = minX; gx < maxX; gx += step) {
    for (let gy = minY; gy < maxY; gy += step) {
      const t1 = [[gx + 8, gy + 10], [gx + 17, gy + 6], [gx + 13, gy + 18]];
      const t2 = [[gx + 26, gy + 24], [gx + 35, gy + 28], [gx + 29, gy + 36]];
      [t1, t2].forEach(tri => {
        ctx.beginPath();
        tri.forEach((pt, i) => {
          const [sx, sy] = worldToScreen(pt[0], pt[1]);
          if (i === 0) ctx.moveTo(sx, sy);
          else ctx.lineTo(sx, sy);
        });
        ctx.closePath();
        ctx.stroke();
      });
      [[gx + 5, gy + 26], [gx + 21, gy + 12], [gx + 34, gy + 9], [gx + 16, gy + 32], [gx + 28, gy + 19]].forEach(dot => {
        const [sx, sy] = worldToScreen(dot[0], dot[1]);
        ctx.fillRect(sx, sy, 1.6, 1.6);
      });
    }
  }
  ctx.restore();
}

// 繪製原圖直角引線 (L型或Z型青色引線 + 箭頭 + 文字)
function drawOrthoLeader(pts, text, textAlign = 'right') {
  if (!pts || pts.length < 2) return;
  for (let i = 0; i < pts.length - 1; i++) {
    drawWorldLine(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], '#22d3ee', 1.25, [], 'DIM');
  }
  const [x0, y0] = pts[0];
  const [x1, y1] = pts[1];
  const ang = Math.atan2(y1 - y0, x1 - x0);
  const aLen = 18;
  const pA = [x0 + aLen * Math.cos(ang + 0.28), y0 + aLen * Math.sin(ang + 0.28)];
  const pB = [x0 + aLen * Math.cos(ang - 0.28), y0 + aLen * Math.sin(ang - 0.28)];
  drawWorldPoly([[x0, y0], pA, pB], true, '#22d3ee', '#22d3ee', 1, [], 'DIM');

  const last = pts[pts.length - 1];
  const offsetX = textAlign === 'right' ? -14 : 14;
  drawWorldText(text, last[0] + offsetX, last[1], 28, '#22d3ee', textAlign, 0, '!字');
}

// 繪製原圖邊界折斷波浪線 (A8D0, A8D1)
function drawBreakLineH(x1, x2, y, breakX) {
  const bw = 28, bh = 22;
  const pts = [
    [x1, y],
    [breakX - bw, y],
    [breakX - bw * 0.35, y + bh],
    [breakX + bw * 0.35, y - bh],
    [breakX + bw, y],
    [x2, y]
  ];
  drawWorldPoly(pts, false, '#22d3ee', null, 1.5, [], 'DIM');
}

// 繪製原圖藍色水流方向箭頭 (Block 19010)
function drawFlowArrowLeft(wx, wy) {
  const len = 210;
  drawWorldLine(wx + len, wy, wx, wy, '#2563eb', 2.2, [], '_00400');
  const ah = 48, aw = 11;
  drawWorldPoly([[wx, wy], [wx + ah, wy + aw], [wx + ah, wy - aw]], true, '#2563eb', '#2563eb', 1.2, [], '_00400');
  drawWorldText('水流方向', wx + len * 0.55, wy + 45, 28, '#22d3ee', 'center', 0, '!字');
}

// 尺寸標註延伸線退縮鐵律 (距離結構物至少退縮 18cm 不黏連)
function getDimExtensionCoords(coordObj, dimPos) {
  const dir = dimPos >= coordObj ? 1 : -1;
  const minGapFromObj = 18.0;
  const overshoot = 18.0;
  return {
    extStart: coordObj + dir * minGapFromObj,
    extEnd: dimPos + dir * overshoot
  };
}

function drawDimH(x1, x2, yObj1, yObj2, yDim, text) {
  const e1 = getDimExtensionCoords(yObj1, yDim);
  const e2 = getDimExtensionCoords(yObj2, yDim);
  drawWorldLine(x1, e1.extStart, x1, e1.extEnd, '#22d3ee', 1.25, [], 'DIM');
  drawWorldLine(x2, e2.extStart, x2, e2.extEnd, '#22d3ee', 1.25, [], 'DIM');
  drawWorldLine(x1, yDim, x2, yDim, '#22d3ee', 1.4, [], 'DIM');
  const s = 26;
  const dir = x2 >= x1 ? 1 : -1;
  drawWorldPoly([[x1, yDim], [x1 + dir * s, yDim + s * 0.25], [x1 + dir * s, yDim - s * 0.25]], true, '#22d3ee', '#22d3ee', 1, [], 'DIM');
  drawWorldPoly([[x2, yDim], [x2 - dir * s, yDim + s * 0.25], [x2 - dir * s, yDim - s * 0.25]], true, '#22d3ee', '#22d3ee', 1, [], 'DIM');
  drawWorldText(text, (x1 + x2) / 2, yDim + 26, 28, '#22d3ee', 'center', 0, 'DIM');
}

function drawDimV(y1, y2, xObj1, xObj2, xDim, text, isRotatedLeft = false) {
  const e1 = getDimExtensionCoords(xObj1, xDim);
  const e2 = getDimExtensionCoords(xObj2, xDim);
  drawWorldLine(e1.extStart, y1, e1.extEnd, y1, '#22d3ee', 1.25, [], 'DIM');
  drawWorldLine(e2.extStart, y2, e2.extEnd, y2, '#22d3ee', 1.25, [], 'DIM');
  if (isRotatedLeft) {
    const yTopExt = y2 + 280;
    drawWorldLine(xDim, y1 - 35, xDim, yTopExt, '#22d3ee', 1.35, [], 'DIM');
    const s = 24;
    drawWorldPoly([[xDim, y1], [xDim - s * 0.25, y1 - s], [xDim + s * 0.25, y1 - s]], true, '#22d3ee', '#22d3ee', 1, [], 'DIM');
    drawWorldPoly([[xDim, y2], [xDim - s * 0.25, y2 + s], [xDim + s * 0.25, y2 + s]], true, '#22d3ee', '#22d3ee', 1, [], 'DIM');
    drawWorldText(text, xDim - 26, y2 + 150, 28, '#22d3ee', 'center', 90, 'DIM');
  } else {
    drawWorldLine(xDim, y1, xDim, y2, '#22d3ee', 1.35, [], 'DIM');
    const s = 24;
    const dir = y2 >= y1 ? 1 : -1;
    drawWorldPoly([[xDim, y1], [xDim - s * 0.25, y1 + dir * s], [xDim + s * 0.25, y1 + dir * s]], true, '#22d3ee', '#22d3ee', 1, [], 'DIM');
    drawWorldPoly([[xDim, y2], [xDim - s * 0.25, y2 - dir * s], [xDim + s * 0.25, y2 - dir * s]], true, '#22d3ee', '#22d3ee', 1, [], 'DIM');
    drawWorldText(text, xDim + 22, (y1 + y2) / 2, 28, '#22d3ee', 'left', 0, 'DIM');
  }
}

// ============================================================================
// 5. 動態包絡盒相對間距排版引擎 (確保放大時上下視圖與數量表自動拉開間距、絕不重疊)
// ============================================================================
function computeDynamicLayout(P) {
  const secMinY = -Math.max(P.D_dn, P.t_slab + 60) - 180;
  const secMaxY = P.dH_slope + P.h1 + 380;

  const gapY = Math.max(480, (P.W_weir * 0.35 + P.dH_slope * 0.8) * P.k_gap);

  const planBotY = secMaxY + gapY;
  const planTopY = planBotY + P.W_weir;

  const tableTopY = secMinY - 220 * P.k_gap;

  const minX = -P.topLip_dn - P.L_riprap - 680;
  const maxX = P.L + P.B_up + 620;

  return {
    secMinY, secMaxY, planBotY, planTopY, tableTopY,
    bounds: {
      minX,
      maxX,
      minY: tableTopY - 320,
      maxY: planTopY + 120
    }
  };
}

// ============================================================================
// 6. 主渲染函式 renderCAD() — 加寬/加長自動增加塊石，不將石頭拉長
// ============================================================================
function renderCAD() {
  const rect = canvas.parentElement.getBoundingClientRect();
  const cw = Math.max(800, rect.width || window.innerWidth - 385);
  const ch = Math.max(550, rect.height || window.innerHeight - 44);
  if (canvas.width !== cw || canvas.height !== ch) {
    canvas.width = cw;
    canvas.height = ch;
  }

  ctx.fillStyle = '#161b24';
  ctx.fillRect(0, 0, cw, ch);
  dxfEntities = [];

  const P = getParams();
  const L = computeDynamicLayout(P);
  const showTable = document.getElementById('chkShowTable').checked;

  const ySlope = (x) => (x / P.L) * P.dH_slope;
  const slopeAngleRad = Math.atan2(P.dH_slope, P.L);

  const xRiprapLeft = -P.topLip_dn - P.L_riprap;
  const xDnWallLeft = -P.topLip_dn;
  const xSlopeStart = 0;
  const xSlopeEnd = P.L;
  const xUpLipStart = P.L + (P.B_up - P.topLip_up);
  const xUpWallRight = P.L + P.B_up;

  const planLeftExt = xRiprapLeft - 215;
  const planRightExt = xUpWallRight + 170;
  const breakX = P.L * 0.43;

  // 依據嵌石粒徑 psi 決定平面密鋪塊石的固定基準節距 (隨 psi 調整，不隨 W_weir 拉長)
  const cobblePitchX = P.psi * (78 / 45);
  const cobblePitchY = P.psi * (86 / 45);

  // =========================================================================
  // (A) 上方視圖：【平面圖】(加寬時自動增加塊石排數，不拉長塊石)
  // =========================================================================
  const { planBotY, planTopY } = L;

  // 1. 上下青色折斷邊界線 (A8D0, A8D1)
  drawBreakLineH(planLeftExt, planRightExt, planTopY, breakX);
  drawBreakLineH(planLeftExt, planRightExt, planBotY, breakX);

  // 2. 垂直分區線 (白線 BASE 與 黃線 0)
  drawWorldLine(xRiprapLeft, planBotY, xRiprapLeft, planTopY, '#ffffff', 1.5, [], 'BASE');
  drawWorldLine(xDnWallLeft, planBotY, xDnWallLeft, planTopY, '#facc15', 1.6, [], '0');
  drawWorldLine(xSlopeStart, planBotY, xSlopeStart, planTopY, '#facc15', 1.6, [], '0');

  for (let k = 1; k < P.N_bay; k++) {
    const xDiv = k * P.L1;
    drawWorldLine(xDiv, planBotY, xDiv, planTopY, '#ffffff', 1.5, [], 'BASE');
  }

  drawWorldLine(xSlopeEnd, planBotY, xSlopeEnd, planTopY, '#facc15', 1.4, [10, 6], '0');
  drawWorldLine(xUpLipStart, planBotY, xUpLipStart, planTopY, '#facc15', 1.6, [], '0');
  drawWorldLine(xUpWallRight, planBotY, xUpWallRight, planTopY, '#facc15', 1.6, [], '0');

  // 3. 繪製下游護坦區 (xRiprapLeft ~ xDnWallLeft) 密鋪回填塊石
  fillRegionWithCobbles(xRiprapLeft + 6, xDnWallLeft - 6, planBotY + 8, planTopY - 8, cobblePitchX * 0.95, cobblePitchY, 10);

  // 4. 繪製下游端牆頂部 nStepRows 顆同心踏步大石 (加寬自動增加顆數，單顆半徑鎖定不拉長)
  const nStepRows = P.nStepRows;
  const stepSpanY = P.W_weir / nStepRows;
  const stepStoneRy = Math.min(stepSpanY * 0.44, P.S_stone * 0.62);
  for (let r = 0; r < nStepRows; r++) {
    const cy = planBotY + (r + 0.5) * stepSpanY;
    const cx = (xDnWallLeft + xSlopeStart) / 2;
    drawConcentricStone(cx, cy, P.topLip_dn * 0.49, stepStoneRy, r, 0.08 * r, 4);
  }

  // 5. 繪製中間 N_bay 個斜坡分區：每區左側 1 排 nStepRows 顆同心踏步石 + 右側區間滿鋪不規則嵌石！
  for (let k = 0; k < P.N_bay; k++) {
    const xBayL = k * P.L1;
    const xBayR = (k + 1) * P.L1;
    const stepColW = Math.min(105, P.L1 * 0.32);
    const bayStepRy = Math.min(stepSpanY * 0.47, P.S_stone * 0.65);

    for (let r = 0; r < nStepRows; r++) {
      const cy = planBotY + (r + 0.5) * stepSpanY;
      const cx = xBayL + stepColW * 0.52;
      drawConcentricStone(cx, cy, stepColW * 0.50, bayStepRy, r + k, -0.1 * r, 3);
    }

    const cobbleRightLimit = (k === P.N_bay - 1) ? xUpLipStart - 6 : xBayR - 6;
    fillRegionWithCobbles(xBayL + stepColW + 4, cobbleRightLimit, planBotY + 6, planTopY - 6, cobblePitchX, cobblePitchY, (k + 1) * 23);
  }

  // 6. 繪製最右側上游端牆頂部 nUpRows 顆大號同心踏步巨石 (加寬自動增加顆數，單顆半徑鎖定不拉長)
  const nUpRows = P.nUpRows;
  const upSpanY = P.W_weir / nUpRows;
  const upStoneRy = Math.min(upSpanY * 0.46, P.S_stone * 0.78);
  const cxUp = (xUpLipStart + xUpWallRight) / 2;
  for (let r = 0; r < nUpRows; r++) {
    const cy = planBotY + (r + 0.5) * upSpanY;
    drawConcentricStone(cxUp, cy, P.topLip_up * 0.50, upStoneRy, r, 0.05 * r, 4);
  }

  // 7. 平面圖引線與標註：
  const pStepBot = [(xDnWallLeft + xSlopeStart) / 2, planBotY + 35];
  drawOrthoLeader([pStepBot, [pStepBot[0], planBotY - 125], [pStepBot[0] - 140, planBotY - 125]], '踏步臺式\n(混凝土步臺)', 'right');

  drawFlowArrowLeft(xUpWallRight + 160, planTopY - 260);
  if (nUpRows >= 2) {
    const rIdxA = Math.max(0, Math.floor(nUpRows / 2) - 1);
    const yDimS1 = planBotY + (rIdxA + 0.5) * upSpanY;
    const yDimS2 = planBotY + (rIdxA + 1.5) * upSpanY;
    drawDimV(yDimS1, yDimS2, xUpWallRight + 20, xUpWallRight + 20, xUpWallRight + 115, `S(約100~150cm)`, false);
  } else {
    drawDimV(planBotY, planTopY, xUpWallRight + 20, xUpWallRight + 20, xUpWallRight + 115, `S(約100~150cm)`, false);
  }

  // =========================================================================
  // (B) 下方視圖：【縱斷面圖】(加長時自動增加每段嵌石顆數，不拉長石頭)
  // =========================================================================
  // 1. 左側下游水平河床線
  drawWorldLine(planLeftExt + 30, 0, xDnWallLeft, 0, '#ffffff', 1.6, [], 'BASE');

  // 2. 下游回填塊石區 (依 L_riprap 動態排布回填塊石，不拉長石頭)
  const nRipCols = Math.max(2, Math.round(P.L_riprap / 80));
  const ripStepX = P.L_riprap / nRipCols;
  const ripRx = Math.min(ripStepX * 0.48, 52);
  for (let layer = 0; layer < Math.max(1, Math.round(P.rip_d / 64)); layer++) {
    const colsInLayer = layer === 0 ? nRipCols : Math.max(1, nRipCols - 1);
    const wy = -32 - layer * 64;
    for (let c = 0; c < colsInLayer; c++) {
      const wx = xDnWallLeft - (c + 0.65 + (layer > 0 ? 0.2 : 0)) * ripStepX;
      drawConcentricStone(wx, wy, ripRx, 35, layer + c, 0.12 * (layer + c), layer === 0 ? 2 : 3);
    }
  }

  // 3. 下游嵌石固床工混凝土基座 (A8D3 + A94D AR-CONC) 與頂部踏步大石 (A8E3~A8E6)
  const dnConcPoly = [
    [xDnWallLeft + P.dn_x, 0],
    [xSlopeStart, 0],
    [xSlopeStart, -P.D_dn],
    [-P.B_dn, -P.D_dn],
    [-P.B_dn, -P.D_dn * P.dn_r1],
    [xDnWallLeft + P.dn_x, -P.D_dn * P.dn_r2]
  ];
  drawArConcHatch(dnConcPoly);
  drawWorldPoly([
    [xSlopeStart, 0],
    [xSlopeStart, -P.D_dn],
    [-P.B_dn, -P.D_dn]
  ], false, '#facc15', null, 1.8, [], '0');

  drawConcentricStone((xDnWallLeft + xSlopeStart) / 2 + 6, 32, 74, 68, 0, -0.08, 4);

  // 4. 中間斜坡混凝土底板 (A8D5 + A94F AR-CONC) 與各段斜坡塊石排布
  const ySlabBotStart = -P.sl_o0 - P.sl_t0;
  const ySlabBotEnd = P.dH_slope - P.t_slab;
  const slopeConcPoly = [
    [xSlopeStart, -P.sl_o0],
    [xSlopeEnd, P.dH_slope - P.sl_o1],
    [xSlopeEnd, ySlabBotEnd],
    [xSlopeStart, ySlabBotStart]
  ];
  drawArConcHatch(slopeConcPoly);
  drawWorldLine(xSlopeStart, ySlabBotStart, xSlopeEnd, ySlabBotEnd, '#facc15', 1.8, [], '0');

  // 繪製 N_bay 段斜坡上的塊石：每段起點 1 顆突出 h1 之同心踏步石 + nCobblesPerBay 顆緊密排列之單圈嵌石 (隨段落長短自動增減顆數，不拉長石頭)
  const stepR = 44;
  for (let k = 0; k < P.N_bay; k++) {
    const xBayStart = k * P.L1;
    const yBaySurf = ySlope(xBayStart);

    if (k > 0) {
      drawWorldLine(xBayStart, yBaySurf - 45, xBayStart, yBaySurf + 10, '#ffffff', 1.5, [], '0');
    }

    const cxStep = xBayStart + stepR * 0.95;
    const cyStep = ySlope(cxStep) + P.h1 - 18;
    drawConcentricStone(cxStep, cyStep, stepR, stepR * 1.25, k, 0.05, 4);

    const nCobbles = P.nCobblesPerBay;
    const remSpan = Math.max(30, P.L1 - stepR * 1.95);
    const cobW = remSpan / nCobbles;
    const cobRx = Math.min(cobW * 0.48, P.psi * 0.72);
    for (let c = 0; c < nCobbles; c++) {
      const cxC = xBayStart + stepR * 1.95 + (c + 0.5) * cobW;
      const cyC = ySlope(cxC) - 6;
      drawSingleCobble(cxC, cyC, cobRx, P.psi * 0.92, k + c, slopeAngleRad);
    }
  }

  // 5. 右側上游嵌石固床工混凝土端牆基座 (A8D2 + A94E AR-CONC) 與頂部巨石 (A8E7~A8EA)
  const yUpTop = P.dH_slope + P.up_rise;
  const yUpBot = yUpTop - P.D_up;
  const xUpToe = P.L - P.up_toe;
  const upConcPoly = [
    [P.L, ySlabBotEnd],
    [xUpToe, yUpBot],
    [xUpWallRight, yUpBot],
    [xUpWallRight, yUpTop],
    [xUpLipStart, yUpTop],
    [P.L, P.dH_slope - P.up_o]
  ];
  drawArConcHatch(upConcPoly);
  drawWorldPoly([
    [P.L, ySlabBotEnd],
    [xUpToe, yUpBot],
    [xUpWallRight, yUpBot],
    [xUpWallRight, yUpTop],
    [xUpLipStart, yUpTop]
  ], false, '#facc15', null, 1.8, [], '0');

  drawConcentricStone(P.L + 12, P.dH_slope + 8, 52, 34, 1, -0.25, 3);
  drawConcentricStone(P.L + 22, P.dH_slope - 36, 48, 38, 2, 0.20, 3);
  drawConcentricStone(cxUp, yUpTop + 22, 66, 78, 0, 0.10, 4);

  drawWorldLine(xUpWallRight, yUpTop, planRightExt + 180, yUpTop, '#ffffff', 1.6, [], 'BASE');

  // 6. 縱斷面圖原圖所有標註與引線：
  drawOrthoLeader([
    [(xDnWallLeft + xSlopeStart) / 2, 95],
    [(xDnWallLeft + xSlopeStart) / 2, 315],
    [(xDnWallLeft + xSlopeStart) / 2 - 210, 315]
  ], '踏步臺式\n(混凝土步臺)', 'right');

  drawOrthoLeader([
    [xDnWallLeft - 145, -5],
    [xDnWallLeft - 145, 130],
    [xDnWallLeft - 340, 130]
  ], '回填塊石', 'right');

  drawOrthoLeader([
    [-P.B_dn * 0.45, -P.D_dn + 35],
    [-P.B_dn * 0.45, -P.D_dn - 105],
    [-P.B_dn * 0.45 - 310, -P.D_dn - 105]
  ], '嵌石固床工', 'right');

  drawOrthoLeader([
    [P.L + P.B_up * 0.55, yUpBot + 35],
    [P.L + P.B_up * 0.55, yUpBot - 105],
    [P.L + P.B_up * 0.55 - 290, yUpBot - 105]
  ], '嵌石固床工', 'right');

  const psiBayIdx = Math.min(P.N_bay - 1, Math.max(0, Math.floor(P.N_bay * 0.5)));
  const xPsiStone = psiBayIdx * P.L1 + 42;
  const yPsiStone = ySlope(xPsiStone) + P.h1 + 8;
  drawOrthoLeader([
    [xPsiStone, yPsiStone],
    [xPsiStone, yPsiStone + 185],
    [xPsiStone - 185, yPsiStone + 185]
  ], 'ψ=30~50cm', 'right');

  const h1BayIdx = Math.min(P.N_bay - 1, 1);
  const xDimH1 = h1BayIdx * P.L1;
  const ySurfH1 = ySlope(xDimH1);
  drawDimV(ySurfH1 - 8, ySurfH1 + P.h1, xDimH1 + 35, xDimH1 + 35, xDimH1 - 75, `h1≦30cm`, true);

  const triX = P.L * 0.48;
  const triY = ySlope(triX) + 75;
  const triW = 170, triH = 21;
  drawWorldPoly([[triX, triY], [triX, triY + triH], [triX + triW, triY + triH]], true, '#94a3b8', null, 1.3, [], 'DIM');
  drawWorldText('1', triX - 18, triY + triH * 0.3, 25, '#22d3ee', 'center', 0, '!字');
  drawWorldText('n', triX + triW * 0.45, triY + triH + 22, 25, '#22d3ee', 'center', 0, '!字');
  drawWorldText(`(1:n=1:8~1:10或更緩)`, triX + 20, triY + triH + 68, 28, '#22d3ee', 'center', 0, '!字');

  drawDimH((P.N_bay - 1) * P.L1, P.L, P.dH_slope + P.h1, P.dH_slope + P.h1, P.dH_slope + 95, `L1`);
  drawDimH(0, P.L, P.h1 + 30, P.dH_slope + P.h1, P.dH_slope + 295, `L`);

  drawFlowArrowLeft(xUpWallRight + 150, yUpTop + 70);

  // =========================================================================
  // (C) 最下方：【工程數量計算式總表】
  // =========================================================================
  if (showTable) {
    drawQuantityTableOnCanvas(planLeftExt, L.tableTopY, P);
  }
}

function drawQuantityTableOnCanvas(tx, ty, P) {
  const rows = computeQuantities(P);
  const colW = [70, 380, 80, 640, 120, 340];
  const totalW = colW.reduce((a, b) => a + b, 0);
  const rowH = 42;
  const headH = 48;

  drawWorldPoly([[tx, ty], [tx + totalW, ty], [tx + totalW, ty - headH], [tx, ty - headH]], true, '#38bdf8', 'rgba(2,132,199,0.28)', 1.5, [], 'TABLE');
  drawWorldText('嵌石固床工 (圖號：6-06) 參數化工程數量計算式總表 (圖面尺寸 100% 對照)', tx + totalW / 2, ty - headH / 2, 18, '#38bdf8', 'center', 0, 'TABLE');

  const headers = ['項次', '工 項 名 稱', '單位', '工程數量計算式 (對應圖面標註 L, L1, S, h1, ψ)', '數量', '設計規範備註'];
  let curY = ty - headH;
  drawWorldPoly([[tx, curY], [tx + totalW, curY], [tx + totalW, curY - rowH], [tx, curY - rowH]], true, '#475569', 'rgba(30,41,59,0.85)', 1.2, [], 'TABLE');

  let cx = tx;
  headers.forEach((h, i) => {
    drawWorldText(h, cx + colW[i] / 2, curY - rowH / 2, 15, '#fde047', 'center', 0, 'TABLE');
    cx += colW[i];
    if (i < headers.length - 1) drawWorldLine(cx, ty - headH, cx, curY - rowH * (rows.length + 1), '#334155', 1.0, [], 'TABLE');
  });

  curY -= rowH;
  rows.forEach((r, idx) => {
    const bg = idx % 2 === 0 ? 'rgba(15,23,42,0.75)' : 'rgba(30,41,59,0.55)';
    drawWorldPoly([[tx, curY], [tx + totalW, curY], [tx + totalW, curY - rowH], [tx, curY - rowH]], true, '#334155', bg, 1.0, [], 'TABLE');
    let rx = tx;
    const vals = [r.no, r.name, r.unit, r.formula, String(r.qty), r.note];
    vals.forEach((v, i) => {
      const align = (i === 1 || i === 3 || i === 5) ? 'left' : 'center';
      const px = align === 'left' ? rx + 14 : rx + colW[i] / 2;
      const col = i === 4 ? '#4ade80' : (i === 3 ? '#67e8f9' : '#e2e8f0');
      drawWorldText(v, px, curY - rowH / 2, 14.5, col, align, 0, 'TABLE');
      rx += colW[i];
    });
    curY -= rowH;
  });
}

// ============================================================================
// 7. 視角置中 zoomToFit() 與滑鼠平移/縮放事件
// ============================================================================
function zoomToFit() {
  const rect = canvas.parentElement.getBoundingClientRect();
  const cw = Math.max(800, rect.width || window.innerWidth - 385);
  const ch = Math.max(550, rect.height || window.innerHeight - 44);
  canvas.width = cw;
  canvas.height = ch;

  const P = getParams();
  const L = computeDynamicLayout(P);
  const { minX, maxX, minY, maxY } = L.bounds;
  camX = (minX + maxX) / 2;
  camY = (minY + maxY) / 2;
  const scaleX = (cw * 0.90) / (maxX - minX);
  const scaleY = (ch * 0.90) / (maxY - minY);
  scale = Math.min(scaleX, scaleY);
  renderCAD();
}

canvas.addEventListener('mousedown', e => {
  if (e.button !== 0) return;
  isDragging = true;
  dragStartX = e.clientX;
  dragStartY = e.clientY;
});
window.addEventListener('mousemove', e => {
  const rect = canvas.getBoundingClientRect();
  const [wx, wy] = screenToWorld(e.clientX - rect.left, e.clientY - rect.top);
  document.getElementById('hud-coords').textContent =
    `世界座標 (cm): X=${wx.toFixed(1)}, Y=${wy.toFixed(1)} | 縮放=${(scale * 100).toFixed(0)}% | 滾輪縮放・左鍵平移・雙擊置中`;
  if (!isDragging) return;
  const dx = e.clientX - dragStartX;
  const dy = e.clientY - dragStartY;
  dragStartX = e.clientX;
  dragStartY = e.clientY;
  camX -= dx / scale;
  camY += dy / scale;
  renderCAD();
});
window.addEventListener('mouseup', () => { isDragging = false; });

canvas.addEventListener('wheel', e => {
  e.preventDefault();
  const rect = canvas.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  const my = e.clientY - rect.top;
  const [wxBefore, wyBefore] = screenToWorld(mx, my);
  const factor = e.deltaY < 0 ? 1.12 : 0.89;
  scale = Math.max(0.04, Math.min(8.0, scale * factor));
  const [wxAfter, wyAfter] = screenToWorld(mx, my);
  camX += (wxBefore - wxAfter);
  camY += (wyBefore - wyAfter);
  renderCAD();
}, { passive: false });

canvas.addEventListener('dblclick', () => zoomToFit());
window.addEventListener('resize', () => renderCAD());

// ============================================================================
// 8. 無彈窗直接下載原生 AutoCAD DXF 與 CSV 數量計算書
// ============================================================================
function toDxfUnicode(str) {
  return String(str).split('').map(ch => {
    const code = ch.charCodeAt(0);
    return code > 127 ? `\\U+${code.toString(16).toUpperCase().padStart(4, '0')}` : ch;
  }).join('');
}

function exportDXF() {
  renderCAD();
  const out = [];
  const push = (c, v) => { out.push(String(c)); out.push(String(v)); };

  push(0, 'SECTION'); push(2, 'HEADER');
  push(9, '$ACADVER'); push(1, 'AC1015');
  push(9, '$INSUNITS'); push(70, 5);
  push(0, 'ENDSEC');

  push(0, 'SECTION'); push(2, 'ENTITIES');
  dxfEntities.forEach(e => {
    const lay = toDxfUnicode(e.layer || '0');
    if (e.type === 'LINE') {
      push(0, 'LINE'); push(8, lay);
      push(10, e.x1.toFixed(3)); push(20, e.y1.toFixed(3)); push(30, '0.0');
      push(11, e.x2.toFixed(3)); push(21, e.y2.toFixed(3)); push(31, '0.0');
    } else if (e.type === 'POLY') {
      push(0, 'LWPOLYLINE'); push(8, lay);
      push(90, e.pts.length);
      push(70, e.closed ? 1 : 0);
      e.pts.forEach(p => {
        push(10, p[0].toFixed(3));
        push(20, p[1].toFixed(3));
      });
    } else if (e.type === 'TEXT') {
      push(0, 'TEXT'); push(8, lay);
      push(10, e.x.toFixed(3)); push(20, e.y.toFixed(3)); push(30, '0.0');
      push(40, (e.h * 0.72).toFixed(2));
      if (e.rotDeg) { push(50, e.rotDeg.toFixed(1)); }
      push(1, toDxfUnicode(e.txt));
    }
  });
  push(0, 'ENDSEC');
  push(0, 'EOF');

  const blob = new Blob([out.join('\r\n')], { type: 'application/dxf;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = '6-06_嵌石固床工_參數化標準圖.dxf';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

function exportCSV() {
  const P = getParams();
  const rows = computeQuantities(P);
  const lines = ['\uFEFF項次,工項名稱,單位,工程數量計算式(對應圖面尺寸),數量,設計規範備註'];
  rows.forEach(r => {
    lines.push(`${r.no},"${r.name}",${r.unit},"${r.formula}",${r.qty},"${r.note}"`);
  });
  const blob = new Blob([lines.join('\r\n')], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = '6-06_嵌石固床工_工程數量計算表.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// ============================================================================
// 9. 事件綁定 (修改參數時鎖定視角不跳動，並自動調整視圖安全間距)
// ============================================================================
document.querySelectorAll('#sidebar input, #sidebar select, #top-bar input').forEach(el => {
  el.addEventListener('input', () => { updateSidebarUI(); renderCAD(); });
  el.addEventListener('change', () => { updateSidebarUI(); renderCAD(); });
});

document.getElementById('btnPresetDxf').addEventListener('click', () => {
  document.getElementById('p_L').value = 1338;
  document.getElementById('p_N_bay').value = 4;
  document.getElementById('p_slope_n').value = 9.8;
  document.getElementById('p_W_weir').value = 877;
  document.getElementById('p_t_slab').value = 78;
  document.getElementById('p_S_stone').value = 135;
  document.getElementById('p_h1').value = 30;
  document.getElementById('p_psi').value = 45;
  document.getElementById('p_B_up').value = 201;
  document.getElementById('p_D_up').value = 207;
  document.getElementById('p_B_dn').value = 176;
  document.getElementById('p_D_dn').value = 206;
  document.getElementById('p_L_riprap').value = 229;
  updateSidebarUI();
  zoomToFit();
});

document.getElementById('btnPreset1200').addEventListener('click', () => {
  document.getElementById('p_L').value = 1200;
  document.getElementById('p_N_bay').value = 4;
  document.getElementById('p_slope_n').value = 10.0;
  document.getElementById('p_W_weir').value = 900;
  document.getElementById('p_t_slab').value = 80;
  document.getElementById('p_S_stone').value = 130;
  document.getElementById('p_h1').value = 30;
  document.getElementById('p_psi').value = 40;
  document.getElementById('p_B_up').value = 200;
  document.getElementById('p_D_up').value = 200;
  document.getElementById('p_B_dn').value = 180;
  document.getElementById('p_D_dn').value = 200;
  document.getElementById('p_L_riprap').value = 230;
  updateSidebarUI();
  zoomToFit();
});

document.getElementById('btnZoomFit').addEventListener('click', () => zoomToFit());
document.getElementById('btnExportDXF').addEventListener('click', () => exportDXF());
document.getElementById('btnExportCSV').addEventListener('click', () => exportCSV());

updateSidebarUI();
requestAnimationFrame(() => zoomToFit());

  // ---- v6.3 數量改由圖形計算＋補標註（or3fix.py）----

  function __A(p) { let s = 0; for (let i = 0; i < p.length; i++) { const a = p[i], b = p[(i + 1) % p.length]; s += a[0] * b[1] - b[0] * a[1]; } return Math.abs(s) / 2; }
  function __C(p) { let x = 0, y = 0; p.forEach(q => { x += q[0]; y += q[1]; }); return [x / p.length, y / p.length]; }
  function __notesWrap(HEADH, ROWH, TH, notes) {
    const __q = drawQuantityTableOnCanvas;
    drawQuantityTableOnCanvas = function (tx, ty, P) { const n0 = O.length; __q(tx, ty, P); let yb = Infinity; for (let i = n0; i < O.length; i++) { const o = O[i]; if (o.p) o.p.forEach(v => { yb = Math.min(yb, v[1]); }); else if (Number.isFinite(o.y)) yb = Math.min(yb, o.y); } if (!Number.isFinite(yb)) yb = ty - HEADH - ROWH * (computeQuantities(P).length + 1); const N = notes(P), y0 = yb - TH * 1.6;
      drawWorldText('數量計算依據（圖上未直接標示的推算值與係數）：', tx, y0, TH, '#fde047', 'left', 0, 'TABLE');
      N.forEach((s, i) => drawWorldText('・' + s, tx + TH, y0 - (i + 1) * TH * 1.7, TH * 0.92, '#fde047', 'left', 0, 'TABLE')); };
  }


  { const __P0 = getParams; getParams = function () { const P = __P0(), g = (id, d) => { const v = parseFloat(document.getElementById(id).value); return Number.isFinite(v) ? v : d; };
    const eq = String(document.getElementById('p_LReq').value) !== '0', WhL = eq ? P.W_weir / 2 : g('p_WhL', P.W_weir / 2), WhR = eq ? WhL : g('p_WhR', P.W_weir / 2);
    Object.assign(P, { eq, WhL, WhR, W_weir: eq ? P.W_weir : WhL + WhR, topLip_dn: g('p_lip_dn', 137), topLip_up: g('p_lip_up', 137), dn_x: g('p_dn_x', 18), dn_r1: g('p_dn_r1', 0.62), dn_r2: g('p_dn_r2', 0.35),
      sl_o0: g('p_sl_o0', 15), sl_t0: g('p_sl_t0', 113), sl_o1: g('p_sl_o1', 10), up_rise: g('p_up_rise', 20), up_toe: g('p_up_toe', 24), up_o: g('p_up_o', 15), rip_d: g('p_rip_d', 175),
      dstep_r: g('p_dstep_r', 0.88), k_step: g('p_k_step', 0.58), k_cob: g('p_k_cob', 0.62), k_rip: g('p_k_rip', 0.80) });
    if (!eq) { const stepPitchY = P.S_stone * (877 / (5 * 135)), upPitchY = P.S_stone * (877 / (4 * 135)); P.nStepRows = Math.max(1, Math.round(P.W_weir / stepPitchY)); P.nUpRows = Math.max(1, Math.round(P.W_weir / upPitchY)); }
    return P; }; }
  function __polys(P) {
    const xDnWallLeft = -P.topLip_dn, xUpLipStart = P.L + (P.B_up - P.topLip_up), xUpWallRight = P.L + P.B_up, ySlabBotEnd = P.dH_slope - P.t_slab, yUpTop = P.dH_slope + P.up_rise, yUpBot = yUpTop - P.D_up;
    return { dn: [[xDnWallLeft + P.dn_x, 0], [0, 0], [0, -P.D_dn], [-P.B_dn, -P.D_dn], [-P.B_dn, -P.D_dn * P.dn_r1], [xDnWallLeft + P.dn_x, -P.D_dn * P.dn_r2]],
      sl: [[0, -P.sl_o0], [P.L, P.dH_slope - P.sl_o1], [P.L, ySlabBotEnd], [0, -P.sl_o0 - P.sl_t0]],
      up: [[P.L, ySlabBotEnd], [P.L - P.up_toe, yUpBot], [xUpWallRight, yUpBot], [xUpWallRight, yUpTop], [xUpLipStart, yUpTop], [P.L, P.dH_slope - P.up_o]], yUpTop, yUpBot, xUpWallRight, xDnWallLeft };
  }
  computeQuantities = function (P) {
    const rows = [], G = __polys(P), W = P.W_weir, Adn = __A(G.dn) / 1e4, Asl = __A(G.sl) / 1e4, Aup = __A(G.up) / 1e4, sl = Math.hypot(P.L, P.dH_slope) / 100;
    const nStep = P.nStepRows * (P.N_bay + 1) + P.nUpRows, d = P.S_stone * P.dstep_r;
    rows.push({ no: '1', name: `踏步臺式主塊石 (共${nStep}顆)`, unit: 'm³', formula: `${nStep}顆 × ${P.k_step} × (${d.toFixed(0)}/100)³`, qty: +(nStep * P.k_step * Math.pow(d / 100, 3)).toFixed(2), note: `每排${P.nStepRows}顆×${P.N_bay + 1}排＋上游${P.nUpRows}顆` });
    rows.push({ no: '2', name: `面層嵌石 (ψ=${P.psi}cm)`, unit: 'm³', formula: `斜長${(sl * 100).toFixed(1)} × 寬${W} × ψ${P.psi} × ${P.k_cob} ÷10⁶`, qty: +(sl * W / 100 * P.psi / 100 * P.k_cob).toFixed(2), note: '縱斷面 斜長；平面 W' });
    rows.push({ no: '3', name: `斜坡混凝土底板 (厚${P.t_slab}cm)`, unit: 'm³', formula: `斷面積 ${Asl.toFixed(3)} m² × 寬${W}/100`, qty: +(Asl * W / 100).toFixed(2), note: '縱斷面 底板 A 標註' });
    rows.push({ no: '4', name: '下游混凝土基座', unit: 'm³', formula: `斷面積 ${Adn.toFixed(3)} m² × 寬${W}/100`, qty: +(Adn * W / 100).toFixed(2), note: `B_dn ${P.B_dn}、D_dn ${P.D_dn}` });
    rows.push({ no: '5', name: '上游混凝土基座', unit: 'm³', formula: `斷面積 ${Aup.toFixed(3)} m² × 寬${W}/100`, qty: +(Aup * W / 100).toFixed(2), note: `B_up ${P.B_up}、D_up ${P.D_up}` });
    const dr = P.rip_d;
    rows.push({ no: '6', name: `下游回填塊石 (${Math.max(1, Math.round(dr / 64))}層疊砌)`, unit: 'm³', formula: `長${P.L_riprap} × 深${dr} × 寬${W} × ${P.k_rip} ÷10⁶`, qty: +(P.L_riprap * dr * W * P.k_rip / 1e6).toFixed(2), note: '縱斷面 回填範圍標註' });
    return rows;
  };
  { const __rc = renderCAD; renderCAD = function () { __rc(); try {
    const P = getParams(), L = computeDynamicLayout(P), G = __polys(P), lab = (poly, s) => { const c = __C(poly); drawWorldText(s, c[0], c[1], 22, '#fde047', 'center', 0, '!字'); };
    lab(G.dn, `A=${(__A(G.dn) / 1e4).toFixed(3)}m²`); lab(G.sl.map(q => [q[0] * 0.5 + P.L * 0.25, q[1]]), `底板 A=${(__A(G.sl) / 1e4).toFixed(3)}m²`); lab(G.up, `A=${(__A(G.up) / 1e4).toFixed(3)}m²`);
    drawDimH(-P.B_dn, 0, -P.D_dn, -P.D_dn, -P.D_dn - 70, `B_dn=${P.B_dn}`);
    drawDimV(-P.D_dn, 0, -P.B_dn, -P.B_dn, -P.B_dn - 60, `D_dn=${P.D_dn}`, true);
    drawDimH(P.L, G.xUpWallRight, G.yUpBot, G.yUpBot, G.yUpBot - 70, `B_up=${P.B_up}`);
    drawDimV(G.yUpBot, G.yUpTop, G.xUpWallRight, G.xUpWallRight, G.xUpWallRight + 70, `D_up=${P.D_up}`, false);
    drawDimV(P.dH_slope - P.t_slab, P.dH_slope - P.sl_o1, P.L - 40, P.L - 40, P.L - 120, `終點厚 ${P.t_slab - P.sl_o1}（t=${P.t_slab}，頂低於嵌石面 ${P.sl_o1}）`, true);
    drawDimV(-P.sl_o0 - P.sl_t0, -P.sl_o0, 30, 30, 110, `起點厚 ${P.sl_t0}（頂低於嵌石面 ${P.sl_o0}）`, false);
    drawDimH(-P.topLip_dn, 0, 120, 120, 175, `下游踏步頂寬 ${P.topLip_dn}`);
    drawDimH(P.L + (P.B_up - P.topLip_up), P.L + P.B_up, G.yUpTop, G.yUpTop, G.yUpTop + 120, `上游踏步頂寬 ${P.topLip_up}`);
    if (!P.eq || true) { drawDimV(L.planBotY, L.planBotY + P.WhL, G.xUpWallRight + 260, G.xUpWallRight + 260, G.xUpWallRight + 330, `左半寬 ${P.WhL}`, true); drawDimV(L.planBotY + P.WhL, L.planTopY, G.xUpWallRight + 260, G.xUpWallRight + 260, G.xUpWallRight + 330, `右半寬 ${P.WhR}`, true); }
    drawWorldText(`L=${P.L}　L1=${P.L1}　落差 L/n=${P.dH_slope}　斜長=${Math.hypot(P.L, P.dH_slope).toFixed(1)}`, P.L / 2, P.dH_slope + 360, 24, '#fde047', 'center', 0, '!字');
    const dr = P.rip_d, xr = G.xDnWallLeft - P.L_riprap;
    drawDimH(xr, G.xDnWallLeft, -dr, -dr, -dr - 60, `L_riprap=${P.L_riprap}`);
    drawDimV(-dr, 0, xr, xr, xr - 60, `回填深 ${dr}`, true);
    drawDimV(L.planBotY, L.planTopY, xr - 215, xr - 215, xr - 300, `W=${P.W_weir}`, true);
  } catch (e) { } }; }
  __notesWrap(36, 30, 18, P => [`主塊石 d＝${P.dstep_r}×S＝${(P.S_stone * P.dstep_r).toFixed(0)} cm，形狀係數 ${P.k_step}`, `面層嵌石實積率 ${P.k_cob}；回填塊石實積率 ${P.k_rip}`, '混凝土量＝縱斷面圖各區 A × 寬 W（W＝左半寬＋右半寬）']);

  // ---- 圖元輸出（覆寫原工具的 Canvas 繪圖函式）----
function drawWorldLine(x1, y1, x2, y2, color = '#ffffff', width = 1.4, dash = [], layer = '0') { O.push({ k: 'L', p: [[x1, y1], [x2, y2]], c: color, w: width, d: dash || [], ly: layer }); }
function drawWorldPoly(pts, closed = true, strokeCol = '#f97316', fillCol = null, width = 1.4, dash = [], layer = '塊石') { if (pts && pts.length >= 2) O.push({ k: 'P', p: pts.map(q => [q[0], q[1]]), c: strokeCol, w: width, f: fillCol, cl: !!closed, d: dash || [], ly: layer }); }
function drawWorldText(txt, wx, wy, worldH = 26, color = '#22d3ee', align = 'center', rotDeg = 0, layer = '!字') { const L = String(txt).split('\n'); L.forEach((s, i) => O.push({ k: 'T', x: wx, y: wy - (i - (L.length - 1) / 2) * worldH * 1.25, s, h: worldH, c: color, al: align, bl: 'middle', rot: (rotDeg || 0) * Math.PI / 180, ly: layer })); }
function drawArConcHatch(polyPts) { __conc(polyPts); }
function __conc(polyPts) {
  if (!polyPts || polyPts.length < 3) return; const xs = polyPts.map(p => p[0]), ys = polyPts.map(p => p[1]), x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  O.push({ k: 'CB', p: polyPts.map(p => [p[0], p[1]]) });
  for (let gx = x0; gx < x1; gx += 42) for (let gy = y0; gy < y1; gy += 42) [[[gx + 8, gy + 10], [gx + 17, gy + 6], [gx + 13, gy + 18]], [[gx + 26, gy + 24], [gx + 35, gy + 28], [gx + 29, gy + 36]]].forEach(t => O.push({ k: 'P', p: t, c: 'rgba(148,163,184,0.55)', w: 1, f: null, cl: true, d: [] }));
  O.push({ k: 'CE' });
}
  let LAST_L = null;   // v5.7：記錄原工具的視圖排版（各視圖原點），供平面／縱橫斷面取用原圖視圖
  { const __f = computeDynamicLayout; computeDynamicLayout = function (P) { return (LAST_L = __f(P)); }; }
  return {
    DEF, PR: [{"k": "p_L", "nm": "斜坡水平總長 L (cm)", "def": "1338", "g": 0, "st": "20", "min": "300", "max": "6000"}, {"k": "p_N_bay", "nm": "分區段數 N_bay (1~10段)", "def": "4", "g": 0, "opt": [["1", "1 段"], ["2", "2 段"], ["3", "3 段"], ["4", "4 段 (原圖)"], ["5", "5 段"], ["6", "6 段"], ["7", "7 段"], ["8", "8 段"], ["9", "9 段"], ["10", "10 段"]]}, {"k": "p_slope_n", "nm": "緩坡坡度分母 n (1:n, 規範 8~10)", "def": "9.8", "g": 0, "st": "0.2", "min": "5", "max": "20"}, {"k": "p_W_weir", "nm": "固床工橫向總寬 W_weir (cm)", "def": "877", "g": 0, "st": "20", "min": "300", "max": "4000"}, {"k": "p_t_slab", "nm": "斜坡混凝土底板厚 t_slab (cm)", "def": "78", "g": 0, "st": "5", "min": "40", "max": "200"}, {"k": "p_S_stone", "nm": "塊石中心間距 S (約100~150cm)", "def": "135", "g": 1, "st": "5", "min": "80", "max": "200"}, {"k": "p_h1", "nm": "塊石突出高度 h1 (≦30cm)", "def": "30", "g": 1, "st": "5", "min": "10", "max": "50"}, {"k": "p_psi", "nm": "嵌石粒徑 ψ (規範 30~50cm)", "def": "45", "g": 1, "st": "5", "min": "25", "max": "80"}, {"k": "p_B_up", "nm": "上游基座底寬 B_up (cm)", "def": "201", "g": 2, "st": "10", "min": "100", "max": "400"}, {"k": "p_D_up", "nm": "上游基座深度 D_up (cm)", "def": "207", "g": 2, "st": "10", "min": "100", "max": "400"}, {"k": "p_B_dn", "nm": "下游基座底寬 B_dn (cm)", "def": "176", "g": 2, "st": "10", "min": "100", "max": "400"}, {"k": "p_D_dn", "nm": "下游基座深度 D_dn (cm)", "def": "206", "g": 2, "st": "10", "min": "100", "max": "400"}, {"k": "p_L_riprap", "nm": "下游回填塊石護坦長 L_riprap (cm)", "def": "229", "g": 2, "st": "10", "min": "100", "max": "500"}, {"k": "p_k_gap", "nm": "視圖相對安全間距係數 k_gap", "def": "1.0", "g": 2, "st": "0.1", "min": "0.6", "max": "2.5"}, {"k": "p_LReq", "nm": "左右兩側", "def": "1", "opt": [["1", "左右相同（W 平分）"], ["0", "左右分開"]], "g": 4}, {"k": "p_WhL", "nm": "左半寬 (cm)", "def": "438.5", "st": "5", "min": "100", "max": "2000", "g": 4}, {"k": "p_WhR", "nm": "右半寬 (cm)", "def": "438.5", "st": "5", "min": "100", "max": "2000", "g": 4}, {"k": "p_lip_dn", "nm": "下游踏步頂寬 (cm)", "def": "137", "st": "1", "min": "50", "max": "300", "g": 4}, {"k": "p_lip_up", "nm": "上游踏步頂寬 (cm)", "def": "137", "st": "1", "min": "50", "max": "300", "g": 4}, {"k": "p_sl_t0", "nm": "底板起點厚 (cm)", "def": "113", "st": "1", "min": "30", "max": "250", "g": 4}, {"k": "p_sl_o0", "nm": "底板起點頂低於嵌石面 (cm)", "def": "15", "st": "1", "min": "0", "max": "60", "g": 4}, {"k": "p_sl_o1", "nm": "底板終點頂低於嵌石面 (cm)", "def": "10", "st": "1", "min": "0", "max": "60", "g": 4}, {"k": "p_dn_x", "nm": "下游基座頂內縮 (cm)", "def": "18", "st": "1", "min": "0", "max": "80", "g": 4}, {"k": "p_dn_r1", "nm": "下游基座斜角高比 (×D_dn)", "def": "0.62", "st": "0.01", "min": "0", "max": "1", "g": 4}, {"k": "p_dn_r2", "nm": "下游基座前緣高比 (×D_dn)", "def": "0.35", "st": "0.01", "min": "0", "max": "1", "g": 4}, {"k": "p_up_rise", "nm": "上游基座頂高出嵌石面 (cm)", "def": "20", "st": "1", "min": "0", "max": "100", "g": 4}, {"k": "p_up_toe", "nm": "上游基座趾部內縮 (cm)", "def": "24", "st": "1", "min": "0", "max": "100", "g": 4}, {"k": "p_up_o", "nm": "上游基座前緣低於嵌石面 (cm)", "def": "15", "st": "1", "min": "0", "max": "60", "g": 4}, {"k": "p_rip_d", "nm": "下游回填塊石深 (cm)", "def": "175", "st": "5", "min": "30", "max": "400", "g": 4}, {"k": "p_dstep_r", "nm": "主塊石徑比 (×S)", "def": "0.88", "st": "0.01", "min": "0.5", "max": "1.2", "g": 4}, {"k": "p_k_step", "nm": "主塊石形狀係數", "def": "0.58", "st": "0.01", "min": "0.3", "max": "1", "g": 4}, {"k": "p_k_cob", "nm": "面層嵌石實積率", "def": "0.62", "st": "0.01", "min": "0.3", "max": "1", "g": 4}, {"k": "p_k_rip", "nm": "回填塊石實積率", "def": "0.80", "st": "0.01", "min": "0.3", "max": "1", "g": 4}], GT: ["1. 斜坡主體與分區幾何 (L / L1 / 1:n)", "2. 踏步塊石與嵌石尺寸 (S / h1 / ψ)", "3. 上下游嵌石固床工基座與回填塊石", "4. 原圖 6-06.dxf 規範自動檢核", "左右分開與細部尺寸"], title: "水保標準圖參數化 CAD — 嵌石固床工 (圖號：6-06)",
    run(R, opt) {
      RR = R || {}; OPT = Object.assign({}, opt || {}); O = [];
      try {
        
        LAST_L = null; const P = getParams(), rows = computeQuantities(P);
        let checks = [];
        try { updateSidebarUI(); const t = el('normCheckList').innerHTML || ''; checks = [...t.matchAll(/<div class="check-item ?(warn)?">([\s\S]*?)<\/div>/g)].map(m => ({ ok: !m[1], text: m[2].replace(/^\s*[✔⚠]\s*/, '').replace(/<[^>]+>/g, '') })); } catch (e) { }
        if (OPT.draw) renderCAD();
        return { P, rows, checks, O, L: LAST_L };
      } finally { RR = null; }
    }
  };
})();
TCO_S['a0608'] = (function () {   // 水保標準圖參數化 CAD — 預鑄拱型固床工 (標準基礎型 0608-1)
  const DEF = {"p_L2": "288", "p_Y2": "48", "p_W0": "100", "p_h_blk": "50", "p_D_fnd": "100", "p_BL": "118", "p_Bf": "75", "p_B_arch": "20", "p_W_top": "40", "p_k_gap": "1.0", "p_N_layer": "2", "chkShowTable": true, "p_LReq": "1", "p_W0C": "100", "p_W0R": "100", "p_L2R": "288", "p_Y2R": "48", "p_nk_d": "13", "p_nk_e": "8", "p_cov": "8", "p_hook": "30", "p_rbk": "85"};
  let RR = null, OPT = {}, O = [];
  const EL = {}, CTX = new Proxy({}, { get: (t, k) => (k in t ? t[k] : () => ({ width: 0 })), set: (t, k, v) => { t[k] = v; return true; } });
  const el = id => EL[id] || (EL[id] = { get value() { const v = RR && RR[id] !== undefined && RR[id] !== null && RR[id] !== '' ? RR[id] : DEF[id]; return v === undefined ? '' : String(v); }, set value(v) {},
    get checked() { return OPT[id] !== undefined ? !!OPT[id] : !!DEF[id]; }, set checked(v) {}, textContent: '', innerHTML: '', style: {}, width: 1600, height: 1000, classList: { add() {}, remove() {}, toggle() {} },
    addEventListener() {}, appendChild() {}, getContext() { return CTX; }, getBoundingClientRect: () => ({ left: 0, top: 0, width: 1600, height: 1000 }), parentElement: { getBoundingClientRect: () => ({ left: 0, top: 0, width: 1600, height: 1000 }) } });
  const document = { getElementById: el, querySelectorAll: () => [], querySelector: () => null, createElement: () => ({ click() {}, style: {}, className: '', innerHTML: '', appendChild() {}, querySelectorAll: () => [], querySelector: () => ({ addEventListener() {}, getAttribute: () => '0', value: '' }) }), body: { appendChild() {}, removeChild() {} } };
  const window = { addEventListener() {}, innerWidth: 1990, innerHeight: 1044, devicePixelRatio: 1 };
  const requestAnimationFrame = () => 0, alert = () => {};

// ============================================================================
// 1. 讀取參數與幾何關係推算 (100% 忠於原圖左側標準圖)
// ============================================================================
function getParams() {
  const L2 = parseFloat(document.getElementById('p_L2').value) || 288;
  const Y2 = parseFloat(document.getElementById('p_Y2').value) || 48;
  const W0 = parseFloat(document.getElementById('p_W0').value) || 100;
  const N_layer = parseInt(document.getElementById('p_N_layer').value) || 2;
  const h_blk = parseFloat(document.getElementById('p_h_blk').value) || 50;

  const D_fnd = parseFloat(document.getElementById('p_D_fnd').value) || 100;
  const BL = parseFloat(document.getElementById('p_BL').value) || 118;
  const Bf = parseFloat(document.getElementById('p_Bf').value) || 75;
  const B_arch = parseFloat(document.getElementById('p_B_arch').value) || 20;
  const W_top = parseFloat(document.getElementById('p_W_top').value) || 40;
  const k_gap = parseFloat(document.getElementById('p_k_gap').value) || 1.0;

  const L_total = +(3 * W0 + 2 * L2).toFixed(1);
  const H_eff = +(N_layer * h_blk).toFixed(1);
  // 圓弧半徑 R_in = (L2^2)/(8*Y2) + Y2/2
  const R_in = +((L2 * L2) / (8 * Y2) + Y2 / 2).toFixed(1);
  const R_mid = +(R_in + B_arch / 2).toFixed(1);
  const R_out = +(R_in + B_arch).toFixed(1);
  const ratioLR = +(L2 / R_in).toFixed(2);
  // 主筋長度公式 (原圖標註：L = 有效高度 + 基礎深度 - 15cm + 30cm)
  const L_rebar = +(H_eff + D_fnd - 15 + 30).toFixed(0);

  return {
    L2, Y2, W0, N_layer, h_blk, D_fnd, BL, Bf, B_arch, W_top, k_gap,
    L_total, H_eff, R_in, R_mid, R_out, ratioLR, L_rebar
  };
}

// ============================================================================
// 2. 工程數量計算表 (完全對應圖面標註尺寸)
// ============================================================================
function computeQuantities(P) {
  const rows = [];
  const L_tot_m = P.L_total / 100;
  const D_fnd_m = P.D_fnd / 100;
  const BL_m = P.BL / 100;
  const W0_m = P.W0 / 100;
  const Bf_m = P.Bf / 100;
  const H_eff_m = P.H_eff / 100;
  const B_arch_m = P.B_arch / 100;

  // 1) 基礎混凝土 (210 kgf/cm²)
  const v_fnd = +(L_tot_m * D_fnd_m * BL_m).toFixed(2);
  rows.push({
    no: '1',
    name: `基礎 210kgf/cm² 混凝土 (長${P.L_total}×深${P.D_fnd}×厚${P.BL}cm)`,
    unit: 'm³',
    formula: `(${P.L_total}/100) × (${P.D_fnd}/100) × (${P.BL}/100)`,
    qty: v_fnd,
    note: `基礎總長 = 3×${P.W0} + 2×${P.L2} = ${P.L_total}cm`
  });

  // 2) 兩岸與中央場鑄基座混凝土 (共 3 座)
  const v_ped = +(3 * W0_m * H_eff_m * Bf_m).toFixed(2);
  rows.push({
    no: '2',
    name: `場鑄基座混凝土 (3座×寬${P.W0}×高${P.H_eff}×厚${P.Bf}cm)`,
    unit: 'm³',
    formula: `3座 × (${P.W0}/100) × (${P.H_eff}/100) × (${P.Bf}/100)`,
    qty: v_ped,
    note: `左岸、中央、右岸共 3 座基座`
  });

  // 3) 雙拱預鑄塊石構件 (A型、B型預鑄塊石與梯形力石)
  const halfAngle = Math.asin(Math.min(0.99, (P.L2 / 2) / P.R_in));
  const arcLen_m = (2 * halfAngle * P.R_mid) / 100;
  const v_precast = +(2 * arcLen_m * B_arch_m * H_eff_m).toFixed(2);
  rows.push({
    no: '3',
    name: `預鑄拱型塊石與力石 (雙拱×${P.N_layer}層, 高${P.H_eff}cm)`,
    unit: 'm³',
    formula: `2拱 × 弧長 ${arcLen_m.toFixed(2)}m × 寬(${P.B_arch}/100) × 高(${P.H_eff}/100)`,
    qty: v_precast,
    note: `內弦長 L2=${P.L2}cm, 內弦高 Y2=${P.Y2}cm`
  });

  // 4) 鋼筋 D19 (基礎 D19@20cm + 基座主筋 D19@10cm, 箍筋 D19@30cm)
  const w_rebar = +((v_fnd + v_ped) * 85).toFixed(1);
  rows.push({
    no: '4',
    name: `基座與基礎鋼筋 D19 (主筋單支長 L=${P.L_rebar}cm)`,
    unit: 'kg',
    formula: `主筋 L=${P.H_eff}+${P.D_fnd}-15+30=${P.L_rebar}cm, 合計 (${v_fnd}+${v_ped})m³ × 85`,
    qty: w_rebar,
    note: `主筋 D19@10cm, 箍筋 D19@30cm, 基礎 D19@20cm`
  });

  return rows;
}

function updateSidebarUI() {
  const P = getParams();
  document.getElementById('drv_arch_info').textContent =
    `基礎總長 = ${P.L_total} cm ｜ 內拱半徑 R = ${P.R_in} cm`;
  document.getElementById('drv_fnd_info').textContent =
    `有效高度 H_eff = ${P.H_eff} cm ｜ 主筋長 L = ${P.L_rebar} cm`;

  const checks = [
    {
      ok: P.ratioLR >= 1.15,
      msg: `[原圖設計原則 2] 弦長 L2 與曲率半徑 R 比值 L/R = ${P.ratioLR} (具備良好拱效應傳遞應力)`
    },
    {
      ok: P.h_blk === 50,
      msg: `[原圖設計原則 4] 單層預鑄塊石高度 = ${P.h_blk}cm ${P.h_blk === 50 ? '(符合標準 50cm 模距)' : '(非標準 50cm)'}`
    },
    {
      ok: P.Bf <= P.BL,
      msg: `[基座穩定檢核] 基座厚度 Bf=${P.Bf}cm ≤ 基礎厚度 BL=${P.BL}cm (符合)`
    }
  ];

  const box = document.getElementById('normCheckList');
  box.innerHTML = checks.map(c =>
    `<div class="check-item ${c.ok ? '' : 'warn'}">${c.ok ? '✔' : '⚠'} ${c.msg}</div>`
  ).join('');
}

// ============================================================================
// 3. Canvas 2D 視埠與基礎繪圖函式
// ============================================================================
const canvas = document.getElementById('cadCanvas');
const ctx = canvas.getContext('2d');
let camX = 500, camY = -100, scale = 0.42;
let isDragging = false, dragStartX = 0, dragStartY = 0;
let dxfEntities = [];

function worldToScreen(wx, wy) {
  const cw = canvas.width || 1100;
  const ch = canvas.height || 750;
  return [cw / 2 + (wx - camX) * scale, ch / 2 - (wy - camY) * scale];
}
function screenToWorld(sx, sy) {
  const cw = canvas.width || 1100;
  const ch = canvas.height || 750;
  return [camX + (sx - cw / 2) / scale, camY - (sy - ch / 2) / scale];
}

function drawWorldLine(x1, y1, x2, y2, color = '#ffffff', width = 1.4, dash = [], layer = '0') {
  const [sx1, sy1] = worldToScreen(x1, y1);
  const [sx2, sy2] = worldToScreen(x2, y2);
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.setLineDash(dash);
  ctx.beginPath();
  ctx.moveTo(sx1, sy1);
  ctx.lineTo(sx2, sy2);
  ctx.stroke();
  ctx.restore();
  dxfEntities.push({ type: 'LINE', layer, x1, y1, x2, y2 });
}

function drawWorldPoly(pts, closed = true, strokeCol = '#ffffff', fillCol = null, width = 1.4, dash = [], layer = '0') {
  if (!pts || pts.length < 2) return;
  ctx.save();
  ctx.beginPath();
  pts.forEach((p, idx) => {
    const [sx, sy] = worldToScreen(p[0], p[1]);
    if (idx === 0) ctx.moveTo(sx, sy);
    else ctx.lineTo(sx, sy);
  });
  if (closed) ctx.closePath();
  if (fillCol) { ctx.fillStyle = fillCol; ctx.fill(); }
  if (strokeCol) {
    ctx.strokeStyle = strokeCol;
    ctx.lineWidth = width;
    ctx.setLineDash(dash);
    ctx.stroke();
  }
  ctx.restore();
  dxfEntities.push({ type: 'POLY', layer, pts, closed });
}

function drawWorldCircle(cx, cy, r, strokeCol = '#ef4444', fillCol = '#3b82f6', width = 1.2, layer = '鋼筋') {
  const [sx, sy] = worldToScreen(cx, cy);
  const sr = Math.max(2.2, r * scale);
  ctx.save();
  ctx.beginPath();
  ctx.arc(sx, sy, sr, 0, Math.PI * 2);
  if (fillCol) { ctx.fillStyle = fillCol; ctx.fill(); }
  if (strokeCol) { ctx.strokeStyle = strokeCol; ctx.lineWidth = width; ctx.stroke(); }
  ctx.restore();
  dxfEntities.push({ type: 'CIRCLE', layer, cx, cy, r });
}

function drawWorldText(txt, wx, wy, worldH = 14, color = '#22d3ee', align = 'center', rotDeg = 0, layer = '文字') {
  const [sx, sy] = worldToScreen(wx, wy);
  const px = Math.max(9.5, Math.min(26, worldH * scale));
  ctx.save();
  ctx.translate(sx, sy);
  if (rotDeg) ctx.rotate(-rotDeg * Math.PI / 180);
  ctx.font = `600 ${px}px "DFKai-SB", "Microsoft JhengHei", sans-serif`;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  const lines = String(txt).split('\n');
  lines.forEach((line, i) => {
    const dy = (i - (lines.length - 1) / 2) * (px * 1.25);
    ctx.fillText(line, 0, dy);
  });
  ctx.restore();
  dxfEntities.push({ type: 'TEXT', layer, txt: String(txt).replace(/\n/g, ' '), x: wx, y: wy, h: worldH, rotDeg });
}

// 尺寸標註延伸線退縮鐵律 (距離結構物至少退縮 10cm 不黏連)
function getDimExtensionCoords(coordObj, dimPos) {
  const dir = dimPos >= coordObj ? 1 : -1;
  const minGapFromObj = 10.0;
  const overshoot = 10.0;
  return {
    extStart: coordObj + dir * minGapFromObj,
    extEnd: dimPos + dir * overshoot
  };
}

function drawDimH(x1, x2, yObj1, yObj2, yDim, text) {
  const e1 = getDimExtensionCoords(yObj1, yDim);
  const e2 = getDimExtensionCoords(yObj2, yDim);
  drawWorldLine(x1, e1.extStart, x1, e1.extEnd, '#22d3ee', 1.15, [], '標註');
  drawWorldLine(x2, e2.extStart, x2, e2.extEnd, '#22d3ee', 1.15, [], '標註');
  drawWorldLine(x1, yDim, x2, yDim, '#22d3ee', 1.3, [], '標註');
  const s = Math.min(12, Math.abs(x2 - x1) * 0.22);
  const dir = x2 >= x1 ? 1 : -1;
  drawWorldPoly([[x1, yDim], [x1 + dir * s, yDim + s * 0.28], [x1 + dir * s, yDim - s * 0.28]], true, '#22d3ee', '#22d3ee', 1, [], '標註');
  drawWorldPoly([[x2, yDim], [x2 - dir * s, yDim + s * 0.28], [x2 - dir * s, yDim - s * 0.28]], true, '#22d3ee', '#22d3ee', 1, [], '標註');
  drawWorldText(text, (x1 + x2) / 2, yDim + 12, 13, '#22d3ee', 'center', 0, '標註');
}

function drawDimV(y1, y2, xObj1, xObj2, xDim, text) {
  const e1 = getDimExtensionCoords(xObj1, xDim);
  const e2 = getDimExtensionCoords(xObj2, xDim);
  drawWorldLine(e1.extStart, y1, e1.extEnd, y1, '#22d3ee', 1.15, [], '標註');
  drawWorldLine(e2.extStart, y2, e2.extEnd, y2, '#22d3ee', 1.15, [], '標註');
  drawWorldLine(xDim, y1, xDim, y2, '#22d3ee', 1.3, [], '標註');
  const s = Math.min(12, Math.abs(y2 - y1) * 0.22);
  const dir = y2 >= y1 ? 1 : -1;
  drawWorldPoly([[xDim, y1], [xDim - s * 0.28, y1 + dir * s], [xDim + s * 0.28, y1 + dir * s]], true, '#22d3ee', '#22d3ee', 1, [], '標註');
  drawWorldPoly([[xDim, y2], [xDim - s * 0.28, y2 - dir * s], [xDim + s * 0.28, y2 - dir * s]], true, '#22d3ee', '#22d3ee', 1, [], '標註');
  drawWorldText(text, xDim - 12, (y1 + y2) / 2, 13, '#22d3ee', 'center', 90, '標註');
}

function drawLeader(x0, y0, x1, y1, text, align = 'left') {
  drawWorldLine(x0, y0, x1, y1, '#22d3ee', 1.2, [], '標註');
  const ang = Math.atan2(y1 - y0, x1 - x0);
  const s = 10;
  drawWorldPoly([
    [x0, y0],
    [x0 + s * Math.cos(ang + 0.28), y0 + s * Math.sin(ang + 0.28)],
    [x0 + s * Math.cos(ang - 0.28), y0 + s * Math.sin(ang - 0.28)]
  ], true, '#22d3ee', '#22d3ee', 1, [], '標註');
  const tx = align === 'left' ? x1 + 8 : x1 - 8;
  drawWorldText(text, tx, y1, 14, '#22d3ee', align, 0, '文字');
}

// ============================================================================
// 4. 動態包絡盒相對間距排版引擎
// ============================================================================
function computeDynamicLayout(P) {
  const gapX = Math.max(240, P.L_total * 0.28 * P.k_gap);
  const gapY = Math.max(190, (P.D_fnd + P.H_eff) * 0.85 * P.k_gap);

  // 1) 左上：正視圖 (原點 X=0, Y=0 為基礎底面左角)
  const frontOx = 0, frontOy = 0;

  // 2) 右上：剖面圖 (左緣與正視圖保持安全間距 gapX，底部高程與正視圖 1:1 對齊)
  const secOx = P.L_total + gapX;
  const secOy = 0;

  // 3) 左中：俯視圖 (平面圖，X 與正視圖 1:1 垂直對齊，位於正視圖下方 gapY 處)
  const planTopY = -85 - gapY * 0.45;
  const planOx = 0;
  const planOy = planTopY - P.BL; // 基礎後緣 Y

  // 4) 下排：3 組基礎與基座配筋詳圖 (位於俯視圖下方 gapY 處)
  const rebarTopY = planOy - 90 - gapY * 0.55;

  // 5) 最下方：工程數量計算式總表與設計原則框
  const tableTopY = rebarTopY - 420 - gapY * 0.45;

  return {
    frontOx, frontOy, secOx, secOy, planOx, planOy, rebarTopY, tableTopY,
    bounds: {
      minX: -180,
      maxX: Math.max(secOx + P.BL + 240, 1550),
      minY: tableTopY - 380,
      maxY: P.D_fnd + P.H_eff + 140
    }
  };
}

// 繪製俯視圖單拱圓弧群與預鑄塊分割線 (100% 還原 11414~11443)
function drawPlanSingleArch(cx, yFndBack, P) {
  // 圓心位於 (cx, yArcCenter)，使內弧 (R_in) 兩端點落在 (cx ± L2/2, yFndBack + 40)
  const yChord = yFndBack + P.W_top;
  const dyCenter = Math.sqrt(Math.max(10, P.R_in * P.R_in - (P.L2 / 2) * (P.L2 / 2)));
  const cyArc = yChord - dyCenter;

  const aStart = Math.atan2(yChord - cyArc, P.L2 / 2);
  const aEnd = Math.PI - aStart;

  const sampleArc = (radius, ang1, ang2, steps = 28) => {
    const pts = [];
    for (let i = 0; i <= steps; i++) {
      const a = ang1 + (ang2 - ang1) * (i / steps);
      pts.push([cx + radius * Math.cos(a), cyArc + radius * Math.sin(a)]);
    }
    return pts;
  };

  // 內弧 R_in、中弧 R_mid、外弧 R_out 及雙線倒角邊緣
  drawWorldPoly(sampleArc(P.R_in, aStart, aEnd), false, '#ffffff', null, 1.5, [], '0');
  drawWorldPoly(sampleArc(P.R_in + 1.2, aStart, aEnd), false, '#94a3b8', null, 0.9, [], '0');
  drawWorldPoly(sampleArc(P.R_mid, aStart, aEnd), false, '#facc15', null, 1.1, [6, 4], '鋼筋');
  drawWorldPoly(sampleArc(P.R_out - 1.2, aStart, aEnd), false, '#94a3b8', null, 0.9, [], '0');
  drawWorldPoly(sampleArc(P.R_out, aStart, aEnd), false, '#ffffff', null, 1.5, [], '0');

  // 拱圈分段徑向接縫與中央梯形力石 (Keystone，位於 76.5°~78.8° 及 101.1°~103.4°)
  const jointAngles = [aStart, 76.5 * Math.PI / 180, 79.2 * Math.PI / 180, 100.8 * Math.PI / 180, 103.5 * Math.PI / 180, aEnd];
  jointAngles.forEach(ang => {
    drawWorldLine(
      cx + P.R_in * Math.cos(ang), cyArc + P.R_in * Math.sin(ang),
      cx + P.R_out * Math.cos(ang), cyArc + P.R_out * Math.sin(ang),
      '#ffffff', 1.3, [], '0'
    );
  });
}

// 繪製正視圖單跨預鑄塊石層 (含 A型、B型與梯形力石接縫 113C0~11413)
function drawFrontArchSpan(xLeft, yBase, P) {
  const span = P.L2;
  const xKey1L = xLeft + span * 0.30;
  const xKey1R = xLeft + span * 0.35;
  const xKey2L = xLeft + span * 0.65;
  const xKey2R = xLeft + span * 0.70;

  for (let lyr = 0; lyr < P.N_layer; lyr++) {
    const y0 = yBase + lyr * P.h_blk;
    const y1 = y0 + P.h_blk;
    // 外框與頂部 2cm 倒角線
    drawWorldPoly([[xLeft, y0], [xLeft + span, y0], [xLeft + span, y1], [xLeft, y1]], true, '#ffffff', 'rgba(56,189,248,0.06)', 1.4, [], '0');
    drawWorldLine(xLeft, y1 - 2, xLeft + span, y1 - 2, '#94a3b8', 1.0, [], '0');

    // 預鑄塊與力石梯形接縫及黃色插銷筋位
    [[xKey1L, xKey1R], [xKey2L, xKey2R]].forEach(([kL, kR]) => {
      drawWorldPoly([[kL, y1], [kL + 2.2, y1 - 5], [kR - 2.2, y1 - 5], [kR, y1]], false, '#ffffff', null, 1.2, [], '0');
      drawWorldPoly([[kL + 2.2, y1 - 5], [kL + 2.2, y1], [kR - 2.2, y1], [kR - 2.2, y1 - 5]], false, '#facc15', null, 1.2, [], '鋼筋');
    });
  }
}

// 繪製基座與基礎配筋詳圖 (100% 還原左下/中下/右下 3 組配筋詳圖 1134E~11502)
function drawRebarDetails(topY, P) {
  // (1) 左下：基礎配筋橫斷面圖 (寬 BL × 高 D_fnd)
  const x1 = 0, y1 = topY - P.D_fnd;
  drawWorldPoly([[x1, y1], [x1 + P.BL, y1], [x1 + P.BL, topY], [x1, topY]], true, '#ffffff', null, 1.5, [], '0');
  const cov = P.cov || 8;
  drawWorldPoly([[x1 + cov, y1 + cov], [x1 + P.BL - cov, y1 + cov], [x1 + P.BL - cov, topY - cov], [x1 + cov, topY - cov]], true, '#ef4444', null, 1.3, [8, 3], '鋼筋');
  for (let i = 0; i <= 5; i++) {
    const rx = x1 + cov + 3 + i * ((P.BL - 2 * cov - 6) / 5);
    drawWorldCircle(rx, y1 + cov + 3, 2.2);
    drawWorldCircle(rx, topY - cov - 3, 2.2);
  }
  for (let j = 1; j <= 3; j++) {
    const ry = y1 + cov + 3 + j * ((P.D_fnd - 2 * cov - 6) / 4);
    drawWorldCircle(x1 + cov + 3, ry, 2.2);
    drawWorldCircle(x1 + P.BL - cov - 3, ry, 2.2);
  }
  drawLeader(x1 + cov, topY - 14, x1 - 35, topY - 14, 'D19@20cm', 'right');
  drawLeader(x1 + P.BL - cov, y1 + 28, x1 + P.BL + 25, y1 + 28, 'D19@20cm', 'left');
  drawWorldText('基礎配筋圖', x1 + P.BL / 2, y1 - 45, 15, '#fb923c', 'center', 0, '輔助線');

  // (2) 中下：兩岸基座配筋詳圖 (單側帶 40° 企口凹槽，寬 Bf × 高 H_eff + 下方基礎段)
  const x2 = 440;
  const y2Top = topY + P.H_eff;
  const y2Mid = topY;
  const y2Bot = topY - P.D_fnd;

  // 上半部基座斷面 (含右下角 40° 企口凹槽 11444)
  drawWorldPoly([
    [x2, y2Mid], [x2, y2Top], [x2 + P.Bf, y2Top], [x2 + P.Bf, y2Mid],
    [x2 + P.Bf - 8, y2Mid], [x2 + P.Bf - 18, y2Mid + 13], [x2 + P.Bf - 35, y2Mid], [x2, y2Mid]
  ], false, '#ffffff', null, 1.5, [], '0');
  // 基座箍筋與主筋點
  drawWorldPoly([
    [x2 + 7.5, y2Top - 7.5], [x2 + 7.5, y2Mid + 7.5], [x2 + P.Bf - 37, y2Mid + 7.5],
    [x2 + P.Bf - 7.5, y2Mid + 30], [x2 + P.Bf - 7.5, y2Top - 7.5]
  ], true, '#ef4444', null, 1.3, [8, 3], '鋼筋');
  for (let j = 0; j <= 6; j++) {
    const ry = y2Mid + 11 + j * ((P.H_eff - 22) / 6);
    drawWorldCircle(x2 + 11, ry, 2.0);
    if (ry > y2Mid + 30) drawWorldCircle(x2 + P.Bf - 11, ry, 2.0);
  }
  drawDimH(x2, x2 + P.Bf, y2Top, y2Top, y2Top + 26, `${P.Bf}`);
  drawDimV(y2Mid, y2Top, x2, x2, x2 - 24, `${P.H_eff}`);
  drawLeader(x2 + P.Bf - 7.5, y2Top - 25, x2 + P.Bf + 28, y2Top - 25, '箍筋-D19@30cm', 'left');
  drawLeader(x2 + P.Bf - 11, y2Mid + 48, x2 + P.Bf + 28, y2Mid + 48, `D19@10cm\nL=有效高度+基礎深度-15cm+30cm`, 'left');

  // 下半部直立主筋延伸入基礎 (11464~1147D)
  const y2RebarBot = y2Bot - 75;
  drawWorldPoly([[x2, y2RebarBot], [x2 + P.BL, y2RebarBot], [x2 + P.BL, y2RebarBot + P.D_fnd], [x2, y2RebarBot + P.D_fnd]], true, '#ffffff', null, 1.4, [], '0');
  for (let i = 0; i < 5; i++) {
    const rx = x2 + 12 + i * ((P.Bf - 24) / 4);
    drawWorldLine(rx, y2Mid - 15, rx, y2RebarBot + 10, '#ef4444', 1.2, [8, 3], '鋼筋');
  }
  // 右側單支主筋彎鉤示意 (11472, 11473, *D26=30)
  const xHook = x2 + P.BL + 75;
  drawWorldPoly([[xHook, y2RebarBot + 80], [xHook, y2RebarBot + 25], [xHook + (P.hook || 30), y2RebarBot + 25]], false, '#ef4444', null, 1.4, [], '鋼筋');
  drawDimH(xHook, xHook + (P.hook || 30), y2RebarBot + 25, y2RebarBot + 25, y2RebarBot + 5, `${P.hook || 30}`);
  drawWorldText('基座(兩側)配筋詳圖', x2 + P.BL / 2, y2RebarBot - 45, 15, '#fb923c', 'center', 0, '輔助線');

  // (3) 右下：中央基座配筋詳圖 (雙側對稱帶 40° 企口凹槽 114B0)
  const x3 = 960;
  drawWorldPoly([
    [x3, y2Mid], [x3, y2Top], [x3 + P.Bf - 35, y2Top], [x3 + P.Bf - 18, y2Top - 13], [x3 + P.Bf, y2Top],
    [x3 + P.Bf, y2Mid], [x3 + P.Bf - 18, y2Mid + 13], [x3 + P.Bf - 35, y2Mid], [x3, y2Mid]
  ], false, '#ffffff', null, 1.5, [], '0');
  drawWorldPoly([
    [x3 + 7.5, y2Top - 7.5], [x3 + 7.5, y2Mid + 7.5], [x3 + P.Bf - 35, y2Mid + 7.5],
    [x3 + P.Bf - 7.5, y2Mid + 28], [x3 + P.Bf - 7.5, y2Top - 28], [x3 + P.Bf - 35, y2Top - 7.5]
  ], true, '#ef4444', null, 1.3, [8, 3], '鋼筋');
  for (let j = 0; j <= 6; j++) {
    const ry = y2Mid + 11 + j * ((P.H_eff - 22) / 6);
    drawWorldCircle(x3 + 11, ry, 2.0);
    if (ry > y2Mid + 26 && ry < y2Top - 26) drawWorldCircle(x3 + P.Bf - 11, ry, 2.0);
  }
  drawDimH(x3, x3 + P.Bf, y2Top, y2Top, y2Top + 26, `${P.Bf}`);
  drawDimV(y2Mid, y2Top, x3, x3, x3 - 24, `${P.H_eff}`);
  drawLeader(x3 + P.Bf - 7.5, y2Top - 25, x3 + P.Bf + 28, y2Top - 25, '箍筋-D19@30cm', 'left');

  // 下半部直立主筋延伸入基礎
  drawWorldPoly([[x3, y2RebarBot], [x3 + P.BL, y2RebarBot], [x3 + P.BL, y2RebarBot + P.D_fnd], [x3, y2RebarBot + P.D_fnd]], true, '#ffffff', null, 1.4, [], '0');
  for (let i = 0; i < 5; i++) {
    const rx = x3 + 12 + i * ((P.Bf - 24) / 4);
    drawWorldLine(rx, y2Mid - 15, rx, y2RebarBot + 10, '#ef4444', 1.2, [8, 3], '鋼筋');
  }
  const xHook2 = x3 + P.BL + 75;
  drawWorldPoly([[xHook2, y2RebarBot + 80], [xHook2, y2RebarBot + 25], [xHook2 + (P.hook || 30), y2RebarBot + 25]], false, '#ef4444', null, 1.4, [], '鋼筋');
  drawDimH(xHook2, xHook2 + (P.hook || 30), y2RebarBot + 25, y2RebarBot + 25, y2RebarBot + 5, `${P.hook || 30}`);
  drawWorldText('基座(中間)配筋詳圖', x3 + P.BL / 2, y2RebarBot - 45, 15, '#fb923c', 'center', 0, '輔助線');
}

// ============================================================================
// 5. 主渲染函式 renderCAD()
// ============================================================================
function renderCAD() {
  const rect = canvas.parentElement.getBoundingClientRect();
  const cw = Math.max(800, rect.width || window.innerWidth - 390);
  const ch = Math.max(550, rect.height || window.innerHeight - 44);
  if (canvas.width !== cw || canvas.height !== ch) {
    canvas.width = cw;
    canvas.height = ch;
  }

  ctx.fillStyle = '#141923';
  ctx.fillRect(0, 0, cw, ch);
  dxfEntities = [];

  const P = getParams();
  const L = computeDynamicLayout(P);
  const showTable = document.getElementById('chkShowTable').checked;

  const x0 = 0;
  const x1 = P.W0;
  const x2 = P.W0 + P.L2;
  const x3 = 2 * P.W0 + P.L2;
  const x4 = 2 * P.W0 + 2 * P.L2;
  const x5 = P.L_total;

  const yFndBot = 0;
  const yFndTop = P.D_fnd;
  const yWeirTop = P.D_fnd + P.H_eff;

  // -------------------------------------------------------------------------
  // 視圖 1：【正視圖 A3-1:60】
  // -------------------------------------------------------------------------
  // 基礎長條矩形 (0 ~ L_total, 0 ~ D_fnd)
  drawWorldPoly([[x0, yFndBot], [x5, yFndBot], [x5, yFndTop], [x0, yFndTop]], true, '#ffffff', 'rgba(148,163,184,0.08)', 1.6, [], '0');

  // 左岸、中央、右岸 3 座場鑄基座
  [[x0, x1], [x2, x3], [x4, x5]].forEach(([xa, xb]) => {
    drawWorldPoly([[xa, yFndTop], [xb, yFndTop], [xb, yWeirTop], [xa, yWeirTop]], true, '#ffffff', 'rgba(148,163,184,0.12)', 1.6, [], '0');
  });

  // 左拱與右拱預鑄塊石層 (A型、B型與梯形力石)
  drawFrontArchSpan(x1, yFndTop, P);
  drawFrontArchSpan(x3, yFndTop, P);

  // 中央對稱中心線 CL (綠色中心線 11380~11382)
  const xCL = P.L_total / 2;
  drawWorldLine(xCL, yFndBot - 15, xCL, yWeirTop + 95, '#22c55e', 1.2, [18, 5, 4, 5], '中心線');
  drawWorldText('C', xCL - 5, yWeirTop + 108, 15, '#22c55e', 'center', 0, '中心線');
  drawWorldText('L', xCL + 4, yWeirTop + 102, 15, '#22c55e', 'center', 0, '中心線');

  // 正視圖尺寸標註 (*D21, *D22, *D9, *D17, *D18, *D10, *D11, *D27, *D28, *D12)
  const yDimTop = yWeirTop + 36;
  drawDimH(x0, x1, yWeirTop, yWeirTop, yDimTop, `W0=${P.W0}`);
  drawDimH(x1, x2, yWeirTop, yWeirTop, yDimTop, `內弦長L2=${P.L2}`);
  drawDimH(x2, x3, yWeirTop, yWeirTop, yDimTop, `W0=${P.W0}`);
  drawDimH(x3, x4, yWeirTop, yWeirTop, yDimTop, `內弦長L2=${P.L2}`);
  drawDimH(x4, x5, yWeirTop, yWeirTop, yDimTop, `W0=${P.W0}`);

  // 左側高度標註
  drawDimV(yFndBot, yFndTop, x0, x0, x0 - 44, `${P.D_fnd}`);
  drawDimV(yFndTop, yWeirTop, x0, x0, x0 - 44, `${P.H_eff}`);
  for (let lyr = 0; lyr < P.N_layer; lyr++) {
    drawDimV(yFndTop + lyr * P.h_blk, yFndTop + (lyr + 1) * P.h_blk, x1, x1, x1 - 16, `${P.h_blk}`);
  }

  // 底部基礎總長標註
  drawDimH(x0, x5, yFndBot, yFndBot, yFndBot - 48, `基礎長度 = ${P.L_total}`);

  // 引線標註：拱型預鑄構件、基座、基礎
  drawLeader(x3 + P.L2 * 0.72, yWeirTop - 25, x3 + P.L2 * 0.85, yWeirTop + 65, '拱型預鑄構件', 'left');
  drawLeader((x4 + x5) / 2, yFndTop + P.H_eff * 0.55, x5 + 38, yFndTop + P.H_eff * 0.65, '基座', 'left');
  drawLeader((x4 + x5) / 2, yFndBot + P.D_fnd * 0.45, x5 + 38, yFndBot + P.D_fnd * 0.55, '基礎', 'left');

  drawWorldText('正視圖 A3-1：60', P.L_total / 2, yFndBot - 82, 16, '#fb923c', 'center', 0, '輔助線');

  // -------------------------------------------------------------------------
  // 視圖 2：【剖面圖 A3-1:60】(位於右上側，高程與正視圖 1:1 對齊)
  // -------------------------------------------------------------------------
  const sx = L.secOx;
  // 基礎矩形 (寬 BL × 高 D_fnd)
  drawWorldPoly([[sx, yFndBot], [sx + P.BL, yFndBot], [sx + P.BL, yFndTop], [sx, yFndTop]], true, '#ffffff', 'rgba(148,163,184,0.08)', 1.6, [], '0');
  // 上部基座與預鑄塊石層剖面 (11387~114AE)
  drawWorldPoly([[sx, yFndTop], [sx + P.W_top, yFndTop], [sx + P.W_top, yWeirTop], [sx, yWeirTop]], true, '#ffffff', 'rgba(148,163,184,0.12)', 1.5, [], '0');
  for (let lyr = 0; lyr < P.N_layer; lyr++) {
    const ya = yFndTop + lyr * P.h_blk;
    const yb = ya + P.h_blk;
    drawWorldPoly([[sx + P.W_top, ya], [sx + P.BL - 10, ya], [sx + P.BL - 10, yb - 2], [sx + P.BL - 12, yb], [sx + P.W_top, yb]], true, '#ffffff', 'rgba(56,189,248,0.06)', 1.4, [], '0');
    drawWorldLine(sx + P.W_top, yb - 2, sx + P.BL - 28, yb - 2, '#94a3b8', 1.0, [], '0');
    drawWorldLine(sx + P.BL - 28, ya, sx + P.BL - 28, yb - 2, '#ffffff', 1.2, [], '0');
  }
  // 基座後緣紅色中心虛線 (1150A)
  drawWorldLine(sx + P.Bf, yFndTop, sx + P.Bf, yWeirTop, '#ef4444', 1.2, [12, 4, 3, 4], '0');

  // 設計溪床線 (左側於基礎頂面 yFndTop 處，含青色折斷符號 11390~11396)
  drawWorldLine(sx - 125, yFndTop, sx, yFndTop, '#facc15', 1.5, [], '0');
  drawWorldText('設計溪床線', sx - 65, yFndTop + 18, 14, '#22d3ee', 'center', 0, '文字');

  // 剖面圖尺寸標註 (*D32=40, *D25=基座厚度(Bf), *D33=基礎厚度(BL), *D19, *D20, *D31)
  drawDimH(sx, sx + P.W_top, yWeirTop, yWeirTop, yWeirTop + 32, `${P.W_top}`);
  drawDimH(sx, sx + P.Bf, yFndTop, yFndTop, yFndTop - 38, `基座厚度(Bf)=${P.Bf}`);
  drawDimH(sx, sx + P.BL, yFndBot, yFndBot, yFndBot - 45, `基礎厚度(BL)=${P.BL}`);
  drawDimV(yFndBot, yFndTop, sx + P.BL, sx + P.BL, sx + P.BL + 38, `${P.D_fnd}`);
  for (let lyr = 0; lyr < P.N_layer; lyr++) {
    drawDimV(yFndTop + lyr * P.h_blk, yFndTop + (lyr + 1) * P.h_blk, sx + P.BL - 10, sx + P.BL - 10, sx + P.BL + 38, `${P.h_blk}`);
  }
  drawLeader(sx + 12, yFndTop + P.H_eff * 0.6, sx - 45, yWeirTop + 28, '210kgf/cm²混凝土', 'right');
  drawWorldText('剖面圖 A3-1：60', sx + P.BL / 2, yFndBot - 82, 16, '#fb923c', 'center', 0, '輔助線');

  // -------------------------------------------------------------------------
  // 視圖 3：【俯視圖 A3-1:60】(位於正視圖正下方，X 座標 1:1 對齊)
  // -------------------------------------------------------------------------
  const pyBot = L.planOy;
  const pyTop = pyBot + P.BL;

  // 基礎外框 (長 L_total × 厚 BL)
  drawWorldPoly([[x0, pyBot], [x5, pyBot], [x5, pyTop], [x0, pyTop]], true, '#ffffff', 'rgba(148,163,184,0.06)', 1.6, [], '0');

  // 左岸基座 (11499)、中央基座 (114AF)、右岸基座 (1149A)：均含 40° 企口凹槽完美銜接首塊預鑄塊石
  // 左岸基座
  drawWorldPoly([
    [x1, pyBot], [x0, pyBot], [x0, pyBot + P.Bf], [x1, pyBot + P.Bf],
    [x1, pyBot + P.Bf - 8], [x1 - 13, pyBot + P.Bf - 18], [x1, pyBot + P.W_top], [x1, pyBot]
  ], false, '#ffffff', 'rgba(148,163,184,0.14)', 1.5, [], '0');

  // 中央基座
  drawWorldPoly([
    [x3, pyBot + P.Bf], [x3, pyBot + P.Bf - 8], [x3 - 13, pyBot + P.Bf - 18], [x3, pyBot + P.W_top],
    [x3, pyBot], [x2, pyBot], [x2, pyBot + P.W_top], [x2 + 13, pyBot + P.Bf - 18],
    [x2, pyBot + P.Bf - 8], [x2, pyBot + P.Bf]
  ], true, '#ffffff', 'rgba(148,163,184,0.14)', 1.5, [], '0');

  // 右岸基座
  drawWorldPoly([
    [x4, pyBot], [x5, pyBot], [x5, pyBot + P.Bf], [x4, pyBot + P.Bf],
    [x4, pyBot + P.Bf - 8], [x4 + 13, pyBot + P.Bf - 18], [x4, pyBot + P.W_top], [x4, pyBot]
  ], false, '#ffffff', 'rgba(148,163,184,0.14)', 1.5, [], '0');

  // 繪製左拱與右拱圓弧預鑄塊石群
  drawPlanSingleArch((x1 + x2) / 2, pyBot, P);
  drawPlanSingleArch((x3 + x4) / 2, pyBot, P);

  // 俯視圖尺寸標註 (*D29=基礎厚度(BL), *D5=基座厚度(Bf), *D6=40, *D24=內弦高Y2, *D13~*D16)
  drawDimV(pyBot, pyTop, x0, x0, x0 - 38, `基礎厚度(BL)=${P.BL}`);
  drawDimV(pyBot, pyBot + P.Bf, x1, x1, x1 - 35, `基座厚度(Bf)=${P.Bf}`);
  drawDimV(pyBot, pyBot + P.W_top, x1, x1, x1 + 22, `${P.W_top}`);
  drawDimV(pyBot + P.W_top, pyBot + P.W_top + P.Y2, (x1 + x2) / 2, (x1 + x2) / 2, (x1 + x2) / 2, `內弦高Y2=${P.Y2}`);

  const pyDimBot = pyBot - 36;
  drawDimH(x0, x1, pyBot, pyBot, pyDimBot, `W0=${P.W0}`);
  drawDimH(x1, x2, pyBot, pyBot, pyDimBot, `內弦長L2=${P.L2}`);
  drawDimH(x2, x3, pyBot, pyBot, pyDimBot, `W0=${P.W0}`);
  drawDimH(x3, x4, pyBot, pyBot, pyDimBot, `內弦長L2=${P.L2}`);
  drawDimH(x4, x5, pyBot, pyBot, pyDimBot, `W0=${P.W0}`);

  drawWorldText('俯視圖 A3-1：60', P.L_total / 2, pyBot - 72, 16, '#fb923c', 'center', 0, '輔助線');

  // -------------------------------------------------------------------------
  // 視圖 4：【基礎與基座配筋詳圖】(位於俯視圖下方)
  // -------------------------------------------------------------------------
  drawRebarDetails(L.rebarTopY, P);

  // -------------------------------------------------------------------------
  // 視圖 5：【工程數量計算式總表】(位於最下方)
  // -------------------------------------------------------------------------
  if (showTable) {
    drawQuantityTableOnCanvas(0, L.tableTopY, P);
  }
}

function drawQuantityTableOnCanvas(tx, ty, P) {
  const rows = computeQuantities(P);
  const colW = [60, 380, 70, 480, 100, 340];
  const totalW = colW.reduce((a, b) => a + b, 0);
  const rowH = 34;
  const headH = 40;

  drawWorldPoly([[tx, ty], [tx + totalW, ty], [tx + totalW, ty - headH], [tx, ty - headH]], true, '#38bdf8', 'rgba(2,132,199,0.28)', 1.5, [], 'TABLE');
  drawWorldText('預鑄拱型固床工 (標準基礎型・無鋼軌樁) — 參數化工程數量計算式總表', tx + totalW / 2, ty - headH / 2, 15, '#38bdf8', 'center', 0, 'TABLE');

  const headers = ['項次', '工 項 名 稱', '單位', '工程數量計算式 (100% 對應圖面標註尺寸)', '數量', '設計規範備註'];
  let curY = ty - headH;
  drawWorldPoly([[tx, curY], [tx + totalW, curY], [tx + totalW, curY - rowH], [tx, curY - rowH]], true, '#475569', 'rgba(30,41,59,0.85)', 1.2, [], 'TABLE');

  let cx = tx;
  headers.forEach((h, i) => {
    drawWorldText(h, cx + colW[i] / 2, curY - rowH / 2, 13, '#fde047', 'center', 0, 'TABLE');
    cx += colW[i];
    if (i < headers.length - 1) drawWorldLine(cx, ty - headH, cx, curY - rowH * (rows.length + 1), '#334155', 1.0, [], 'TABLE');
  });

  curY -= rowH;
  rows.forEach((r, idx) => {
    const bg = idx % 2 === 0 ? 'rgba(15,23,42,0.75)' : 'rgba(30,41,59,0.55)';
    drawWorldPoly([[tx, curY], [tx + totalW, curY], [tx + totalW, curY - rowH], [tx, curY - rowH]], true, '#334155', bg, 1.0, [], 'TABLE');
    let rx = tx;
    const vals = [r.no, r.name, r.unit, r.formula, String(r.qty), r.note];
    vals.forEach((v, i) => {
      const align = (i === 1 || i === 3 || i === 5) ? 'left' : 'center';
      const px = align === 'left' ? rx + 10 : rx + colW[i] / 2;
      const col = i === 4 ? '#4ade80' : (i === 3 ? '#67e8f9' : '#e2e8f0');
      drawWorldText(v, px, curY - rowH / 2, 12.5, col, align, 0, 'TABLE');
      rx += colW[i];
    });
    curY -= rowH;
  });
}

function zoomToFit() {
  const rect = canvas.parentElement.getBoundingClientRect();
  const cw = Math.max(800, rect.width || window.innerWidth - 390);
  const ch = Math.max(550, rect.height || window.innerHeight - 44);
  canvas.width = cw;
  canvas.height = ch;

  const P = getParams();
  const L = computeDynamicLayout(P);
  const { minX, maxX, minY, maxY } = L.bounds;
  camX = (minX + maxX) / 2;
  camY = (minY + maxY) / 2;
  scale = Math.min((cw * 0.90) / (maxX - minX), (ch * 0.90) / (maxY - minY));
  renderCAD();
}

canvas.addEventListener('mousedown', e => {
  if (e.button !== 0) return;
  isDragging = true;
  dragStartX = e.clientX;
  dragStartY = e.clientY;
});
window.addEventListener('mousemove', e => {
  const rect = canvas.getBoundingClientRect();
  const [wx, wy] = screenToWorld(e.clientX - rect.left, e.clientY - rect.top);
  document.getElementById('hud-coords').textContent =
    `世界座標 (cm): X=${wx.toFixed(1)}, Y=${wy.toFixed(1)} | 縮放=${(scale * 100).toFixed(0)}% | 滾輪縮放・左鍵平移・雙擊置中`;
  if (!isDragging) return;
  camX -= (e.clientX - dragStartX) / scale;
  camY += (e.clientY - dragStartY) / scale;
  dragStartX = e.clientX;
  dragStartY = e.clientY;
  renderCAD();
});
window.addEventListener('mouseup', () => { isDragging = false; });

canvas.addEventListener('wheel', e => {
  e.preventDefault();
  const rect = canvas.getBoundingClientRect();
  const mx = e.clientX - rect.left, my = e.clientY - rect.top;
  const [wxB, wyB] = screenToWorld(mx, my);
  scale = Math.max(0.05, Math.min(8.0, scale * (e.deltaY < 0 ? 1.12 : 0.89)));
  const [wxA, wyA] = screenToWorld(mx, my);
  camX += (wxB - wxA);
  camY += (wyB - wyA);
  renderCAD();
}, { passive: false });

canvas.addEventListener('dblclick', () => zoomToFit());
window.addEventListener('resize', () => renderCAD());

function toDxfUnicode(str) {
  return String(str).split('').map(ch => {
    const code = ch.charCodeAt(0);
    return code > 127 ? `\\U+${code.toString(16).toUpperCase().padStart(4, '0')}` : ch;
  }).join('');
}

function exportDXF() {
  renderCAD();
  const out = [];
  const push = (c, v) => { out.push(String(c)); out.push(String(v)); };
  push(0, 'SECTION'); push(2, 'HEADER');
  push(9, '$ACADVER'); push(1, 'AC1015');
  push(9, '$INSUNITS'); push(70, 5);
  push(0, 'ENDSEC');
  push(0, 'SECTION'); push(2, 'ENTITIES');
  dxfEntities.forEach(e => {
    const lay = toDxfUnicode(e.layer || '0');
    if (e.type === 'LINE') {
      push(0, 'LINE'); push(8, lay);
      push(10, e.x1.toFixed(3)); push(20, e.y1.toFixed(3)); push(30, '0.0');
      push(11, e.x2.toFixed(3)); push(21, e.y2.toFixed(3)); push(31, '0.0');
    } else if (e.type === 'POLY') {
      push(0, 'LWPOLYLINE'); push(8, lay);
      push(90, e.pts.length); push(70, e.closed ? 1 : 0);
      e.pts.forEach(p => { push(10, p[0].toFixed(3)); push(20, p[1].toFixed(3)); });
    } else if (e.type === 'CIRCLE') {
      push(0, 'CIRCLE'); push(8, lay);
      push(10, e.cx.toFixed(3)); push(20, e.cy.toFixed(3)); push(30, '0.0');
      push(40, e.r.toFixed(3));
    } else if (e.type === 'TEXT') {
      push(0, 'TEXT'); push(8, lay);
      push(10, e.x.toFixed(3)); push(20, e.y.toFixed(3)); push(30, '0.0');
      push(40, (e.h * 0.72).toFixed(2));
      if (e.rotDeg) push(50, e.rotDeg.toFixed(1));
      push(1, toDxfUnicode(e.txt));
    }
  });
  push(0, 'ENDSEC'); push(0, 'EOF');
  const blob = new Blob([out.join('\r\n')], { type: 'application/dxf;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = '0608-1_預鑄拱型固床工_標準基礎型.dxf';
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
}

function exportCSV() {
  const P = getParams();
  const rows = computeQuantities(P);
  const lines = ['\uFEFF項次,工項名稱,單位,工程數量計算式,數量,設計規範備註'];
  rows.forEach(r => lines.push(`${r.no},"${r.name}",${r.unit},"${r.formula}",${r.qty},"${r.note}"`));
  const blob = new Blob([lines.join('\r\n')], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = '0608-1_預鑄拱型固床工_數量計算表.csv';
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
}

document.querySelectorAll('#sidebar input, #sidebar select, #top-bar input').forEach(el => {
  el.addEventListener('input', () => { updateSidebarUI(); renderCAD(); });
  el.addEventListener('change', () => { updateSidebarUI(); renderCAD(); });
});

document.getElementById('btnPresetDxf').addEventListener('click', () => {
  document.getElementById('p_L2').value = 288;
  document.getElementById('p_Y2').value = 48;
  document.getElementById('p_W0').value = 100;
  document.getElementById('p_N_layer').value = 2;
  document.getElementById('p_h_blk').value = 50;
  document.getElementById('p_D_fnd').value = 100;
  document.getElementById('p_BL').value = 118;
  document.getElementById('p_Bf').value = 75;
  updateSidebarUI(); zoomToFit();
});

document.getElementById('btnPreset3Layer').addEventListener('click', () => {
  document.getElementById('p_N_layer').value = 3;
  updateSidebarUI(); zoomToFit();
});

document.getElementById('btnZoomFit').addEventListener('click', () => zoomToFit());
document.getElementById('btnExportDXF').addEventListener('click', () => exportDXF());
document.getElementById('btnExportCSV').addEventListener('click', () => exportCSV());

updateSidebarUI();
requestAnimationFrame(() => zoomToFit());

  // ---- v6.3 數量改由圖形計算＋補標註（or3fix.py）----

  function __A(p) { let s = 0; for (let i = 0; i < p.length; i++) { const a = p[i], b = p[(i + 1) % p.length]; s += a[0] * b[1] - b[0] * a[1]; } return Math.abs(s) / 2; }
  function __C(p) { let x = 0, y = 0; p.forEach(q => { x += q[0]; y += q[1]; }); return [x / p.length, y / p.length]; }
  function __notesWrap(HEADH, ROWH, TH, notes) {
    const __q = drawQuantityTableOnCanvas;
    drawQuantityTableOnCanvas = function (tx, ty, P) { const n0 = O.length; __q(tx, ty, P); let yb = Infinity; for (let i = n0; i < O.length; i++) { const o = O[i]; if (o.p) o.p.forEach(v => { yb = Math.min(yb, v[1]); }); else if (Number.isFinite(o.y)) yb = Math.min(yb, o.y); } if (!Number.isFinite(yb)) yb = ty - HEADH - ROWH * (computeQuantities(P).length + 1); const N = notes(P), y0 = yb - TH * 1.6;
      drawWorldText('數量計算依據（圖上未直接標示的推算值與係數）：', tx, y0, TH, '#fde047', 'left', 0, 'TABLE');
      N.forEach((s, i) => drawWorldText('・' + s, tx + TH, y0 - (i + 1) * TH * 1.7, TH * 0.92, '#fde047', 'left', 0, 'TABLE')); };
  }


  const __g = (id, d) => { const v = parseFloat(document.getElementById(id).value); return Number.isFinite(v) ? v : d; };
  const __eq = () => String(document.getElementById('p_LReq').value) !== '0';
  const __P0 = getParams;
  getParams = function () {
    const P = __P0(), eq = __eq();
    const W0L = P.W0, W0C = __g('p_W0C', P.W0), W0R = eq ? W0L : __g('p_W0R', P.W0);
    const L2L = P.L2, Y2L = P.Y2, L2R = eq ? L2L : __g('p_L2R', P.L2), Y2R = eq ? Y2L : __g('p_Y2R', P.Y2);
    const arc = (L2, Y2, B) => { const R_in = +((L2 * L2) / (8 * Y2) + Y2 / 2).toFixed(1); return { L2, Y2, R_in, R_mid: +(R_in + B / 2).toFixed(1), R_out: +(R_in + B).toFixed(1), ratioLR: +(L2 / R_in).toFixed(2) }; };
    const AL = arc(L2L, Y2L, P.B_arch), AR = arc(L2R, Y2R, P.B_arch);
    return Object.assign(P, { eq, W0L, W0C, W0R, AL, AR, L_total: +(W0L + L2L + W0C + L2R + W0R).toFixed(1),
      nk_d: __g('p_nk_d', 13), nk_e: __g('p_nk_e', 8), cov: __g('p_cov', 8), rbk: __g('p_rbk', 85), hook: __g('p_hook', 30),
      L2: L2L, Y2: Y2L, R_in: AL.R_in, R_mid: AL.R_mid, R_out: AL.R_out, ratioLR: Math.min(AL.ratioLR, AR.ratioLR) });
  };
  const __xs = P => { const x0 = 0, x1 = P.W0L, x2 = x1 + P.AL.L2, x3 = x2 + P.W0C, x4 = x3 + P.AR.L2, x5 = x4 + P.W0R; return { x0, x1, x2, x3, x4, x5 }; };
  const __notchH = P => Math.max(0, P.Bf - P.nk_e - P.W_top);
  const __arcLen = A => 2 * Math.asin(Math.min(0.99, (A.L2 / 2) / A.R_in)) * A.R_mid;
  computeQuantities = function (P) {
    const rows = [], nA = 0.5 * P.nk_d * __notchH(P), aL = __arcLen(P.AL), aR = __arcLen(P.AR);
    const v_fnd = P.L_total * P.D_fnd * P.BL / 1e6;
    rows.push({ no: '1', name: '基礎 210kgf/cm² 混凝土', unit: 'm³', formula: `長${P.L_total} × 深${P.D_fnd} × 厚${P.BL} ÷10⁶`, qty: +v_fnd.toFixed(2), note: '正視圖 基礎長度、D_fnd；剖面圖 BL' });
    const v_ped = ((P.W0L + P.W0C + P.W0R) * P.Bf - 4 * nA) * P.H_eff / 1e6;
    rows.push({ no: '2', name: '場鑄基座混凝土 (左、中、右 3 座，扣企口)', unit: 'm³', formula: `[(${P.W0L}+${P.W0C}+${P.W0R})×${P.Bf} − 4處×½×${P.nk_d}×${__notchH(P)}] × ${P.H_eff} ÷10⁶`, qty: +v_ped.toFixed(2), note: `俯視圖 W0、Bf、企口 ${P.nk_d}×${__notchH(P)}` });
    const v_pc = (aL + aR) * P.B_arch * P.H_eff / 1e6;
    rows.push({ no: '3', name: `預鑄拱型塊石與力石 (左右雙拱×${P.N_layer}層)`, unit: 'm³', formula: `(左弧長${aL.toFixed(1)} ＋ 右弧長${aR.toFixed(1)}) × 塊寬${P.B_arch} × 高${P.H_eff} ÷10⁶`, qty: +v_pc.toFixed(2), note: `俯視圖 中弧 R 左${P.AL.R_mid}／右${P.AR.R_mid}` });
    rows.push({ no: '4', name: `基座與基礎鋼筋 D19 (主筋 L=${P.L_rebar}cm)`, unit: 'kg', formula: `(${v_fnd.toFixed(2)}+${v_ped.toFixed(2)})m³ × ${P.rbk} kg/m³`, qty: +((v_fnd + v_ped) * P.rbk).toFixed(1), note: `原圖無鋼筋數量表，以 ${P.rbk} kg/m³ 估算` });
    return rows;
  };
  renderCAD = function () {
    dxfEntities = [];
    const P = getParams(), L = computeDynamicLayout(P), showTable = document.getElementById('chkShowTable').checked, X = __xs(P);
    const { x0, x1, x2, x3, x4, x5 } = X, yFndBot = 0, yFndTop = P.D_fnd, yWeirTop = P.D_fnd + P.H_eff, AL = Object.assign({}, P, P.AL), AR = Object.assign({}, P, P.AR);
    // 正視圖
    drawWorldPoly([[x0, yFndBot], [x5, yFndBot], [x5, yFndTop], [x0, yFndTop]], true, '#ffffff', 'rgba(148,163,184,0.08)', 1.6, [], '0');
    [[x0, x1], [x2, x3], [x4, x5]].forEach(([xa, xb]) => drawWorldPoly([[xa, yFndTop], [xb, yFndTop], [xb, yWeirTop], [xa, yWeirTop]], true, '#ffffff', 'rgba(148,163,184,0.12)', 1.6, [], '0'));
    drawFrontArchSpan(x1, yFndTop, AL); drawFrontArchSpan(x3, yFndTop, AR);
    const xCL = (x2 + x3) / 2;
    drawWorldLine(xCL, yFndBot - 15, xCL, yWeirTop + 95, '#22c55e', 1.2, [18, 5, 4, 5], '中心線');
    drawWorldText('C', xCL - 5, yWeirTop + 108, 15, '#22c55e', 'center', 0, '中心線'); drawWorldText('L', xCL + 4, yWeirTop + 102, 15, '#22c55e', 'center', 0, '中心線');
    const yDimTop = yWeirTop + 36;
    drawDimH(x0, x1, yWeirTop, yWeirTop, yDimTop, `左W0=${P.W0L}`); drawDimH(x1, x2, yWeirTop, yWeirTop, yDimTop, `左弦長L2=${P.AL.L2}`);
    drawDimH(x2, x3, yWeirTop, yWeirTop, yDimTop, `中W0=${P.W0C}`); drawDimH(x3, x4, yWeirTop, yWeirTop, yDimTop, `右弦長L2=${P.AR.L2}`); drawDimH(x4, x5, yWeirTop, yWeirTop, yDimTop, `右W0=${P.W0R}`);
    drawDimV(yFndBot, yFndTop, x0, x0, x0 - 44, `${P.D_fnd}`); drawDimV(yFndTop, yWeirTop, x0, x0, x0 - 44, `${P.H_eff}`);
    for (let lyr = 0; lyr < P.N_layer; lyr++) drawDimV(yFndTop + lyr * P.h_blk, yFndTop + (lyr + 1) * P.h_blk, x1, x1, x1 - 16, `${P.h_blk}`);
    drawDimH(x0, x5, yFndBot, yFndBot, yFndBot - 48, `基礎長度 = ${P.L_total}`);
    drawLeader(x3 + P.AR.L2 * 0.72, yWeirTop - 25, x3 + P.AR.L2 * 0.85, yWeirTop + 65, '拱型預鑄構件', 'left');
    drawLeader((x4 + x5) / 2, yFndTop + P.H_eff * 0.55, x5 + 38, yFndTop + P.H_eff * 0.65, '基座', 'left');
    drawLeader((x4 + x5) / 2, yFndBot + P.D_fnd * 0.45, x5 + 38, yFndBot + P.D_fnd * 0.55, '基礎', 'left');
    drawWorldText('正視圖（下游視：左岸在左）', P.L_total / 2, yFndBot - 82, 16, '#fb923c', 'center', 0, '輔助線');
    // 剖面圖
    const sx = L.secOx;
    drawWorldPoly([[sx, yFndBot], [sx + P.BL, yFndBot], [sx + P.BL, yFndTop], [sx, yFndTop]], true, '#ffffff', 'rgba(148,163,184,0.08)', 1.6, [], '0');
    drawWorldPoly([[sx, yFndTop], [sx + P.W_top, yFndTop], [sx + P.W_top, yWeirTop], [sx, yWeirTop]], true, '#ffffff', 'rgba(148,163,184,0.12)', 1.5, [], '0');
    for (let lyr = 0; lyr < P.N_layer; lyr++) { const ya = yFndTop + lyr * P.h_blk, yb = ya + P.h_blk;
      drawWorldPoly([[sx + P.W_top, ya], [sx + P.BL - 10, ya], [sx + P.BL - 10, yb - 2], [sx + P.BL - 12, yb], [sx + P.W_top, yb]], true, '#ffffff', 'rgba(56,189,248,0.06)', 1.4, [], '0');
      drawWorldLine(sx + P.W_top, yb - 2, sx + P.BL - 28, yb - 2, '#94a3b8', 1.0, [], '0'); drawWorldLine(sx + P.BL - 28, ya, sx + P.BL - 28, yb - 2, '#ffffff', 1.2, [], '0'); }
    drawWorldLine(sx + P.Bf, yFndTop, sx + P.Bf, yWeirTop, '#ef4444', 1.2, [12, 4, 3, 4], '0');
    drawWorldLine(sx - 125, yFndTop, sx, yFndTop, '#facc15', 1.5, [], '0'); drawWorldText('設計溪床線', sx - 65, yFndTop + 18, 14, '#22d3ee', 'center', 0, '文字');
    drawDimH(sx, sx + P.W_top, yWeirTop, yWeirTop, yWeirTop + 32, `${P.W_top}`); drawDimH(sx, sx + P.Bf, yFndTop, yFndTop, yFndTop - 38, `基座厚度(Bf)=${P.Bf}`);
    drawDimH(sx, sx + P.BL, yFndBot, yFndBot, yFndBot - 45, `基礎厚度(BL)=${P.BL}`); drawDimV(yFndBot, yFndTop, sx + P.BL, sx + P.BL, sx + P.BL + 38, `${P.D_fnd}`);
    for (let lyr = 0; lyr < P.N_layer; lyr++) drawDimV(yFndTop + lyr * P.h_blk, yFndTop + (lyr + 1) * P.h_blk, sx + P.BL - 10, sx + P.BL - 10, sx + P.BL + 38, `${P.h_blk}`);
    drawLeader(sx + 12, yFndTop + P.H_eff * 0.6, sx - 45, yWeirTop + 28, '210kgf/cm²混凝土', 'right');
    drawWorldText('剖面圖', sx + P.BL / 2, yFndBot - 82, 16, '#fb923c', 'center', 0, '輔助線');
    // 俯視圖（企口：深 nk_d、距背面 nk_e，三角形另一端在 W_top）
    const pyBot = L.planOy, pyTop = pyBot + P.BL, d = P.nk_d, e = P.nk_e, ap = (P.Bf - e + P.W_top) / 2;
    drawWorldPoly([[x0, pyBot], [x5, pyBot], [x5, pyTop], [x0, pyTop]], true, '#ffffff', 'rgba(148,163,184,0.06)', 1.6, [], '0');
    drawWorldPoly([[x1, pyBot], [x0, pyBot], [x0, pyBot + P.Bf], [x1, pyBot + P.Bf], [x1, pyBot + P.Bf - e], [x1 - d, pyBot + ap], [x1, pyBot + P.W_top], [x1, pyBot]], false, '#ffffff', 'rgba(148,163,184,0.14)', 1.5, [], '0');
    drawWorldPoly([[x3, pyBot + P.Bf], [x3, pyBot + P.Bf - e], [x3 - d, pyBot + ap], [x3, pyBot + P.W_top], [x3, pyBot], [x2, pyBot], [x2, pyBot + P.W_top], [x2 + d, pyBot + ap], [x2, pyBot + P.Bf - e], [x2, pyBot + P.Bf]], true, '#ffffff', 'rgba(148,163,184,0.14)', 1.5, [], '0');
    drawWorldPoly([[x4, pyBot], [x5, pyBot], [x5, pyBot + P.Bf], [x4, pyBot + P.Bf], [x4, pyBot + P.Bf - e], [x4 + d, pyBot + ap], [x4, pyBot + P.W_top], [x4, pyBot]], false, '#ffffff', 'rgba(148,163,184,0.14)', 1.5, [], '0');
    drawPlanSingleArch((x1 + x2) / 2, pyBot, AL); drawPlanSingleArch((x3 + x4) / 2, pyBot, AR);
    drawDimV(pyBot, pyTop, x0, x0, x0 - 38, `基礎厚度(BL)=${P.BL}`); drawDimV(pyBot, pyBot + P.Bf, x1, x1, x1 - 35, `基座厚度(Bf)=${P.Bf}`); drawDimV(pyBot, pyBot + P.W_top, x1, x1, x1 + 22, `${P.W_top}`);
    drawDimV(pyBot + P.W_top, pyBot + P.W_top + P.AL.Y2, (x1 + x2) / 2, (x1 + x2) / 2, (x1 + x2) / 2, `左矢高Y2=${P.AL.Y2}`);
    drawDimV(pyBot + P.W_top, pyBot + P.W_top + P.AR.Y2, (x3 + x4) / 2, (x3 + x4) / 2, (x3 + x4) / 2, `右矢高Y2=${P.AR.Y2}`);
    const pyDimBot = pyBot - 36;
    [[x0, x1, `左W0=${P.W0L}`], [x1, x2, `左弦長L2=${P.AL.L2}`], [x2, x3, `中W0=${P.W0C}`], [x3, x4, `右弦長L2=${P.AR.L2}`], [x4, x5, `右W0=${P.W0R}`]].forEach(([a, b, t]) => drawDimH(a, b, pyBot, pyBot, pyDimBot, t));
    drawWorldText('俯視圖', P.L_total / 2, pyBot - 72, 16, '#fb923c', 'center', 0, '輔助線');
    [[x1, x2, P.AL, '左'], [x3, x4, P.AR, '右']].forEach(([a, b, A, nm]) => { const cx = (a + b) / 2, dy = Math.sqrt(Math.max(10, A.R_in * A.R_in - (A.L2 / 2) * (A.L2 / 2))), yT = pyBot + P.W_top - dy + A.R_mid;
      drawLeader(cx + 30, yT - 3, cx + 140, pyTop + 70, `${nm}拱 中弧 R=${A.R_mid}  弧長=${__arcLen(A).toFixed(1)}  塊寬 B=${P.B_arch}`, 'left'); });
    drawLeader(x1 - d / 2, pyBot + ap, x0 + 20, pyBot - 112, `企口三角 深${d}×高${__notchH(P)}（距背面 ${e}；共4處）`, 'left');
    drawRebarDetails(L.rebarTopY, P);
    drawWorldText(`※ 鋼筋量以 ${P.rbk} kg/m³ × (基礎＋基座混凝土) 估算（原圖無鋼筋數量表）`, 0, L.rebarTopY - P.D_fnd - 150, 15, '#fde047', 'left', 0, '文字');
    if (showTable) drawQuantityTableOnCanvas(0, L.tableTopY, P);
  };

  // ---- 圖元輸出（覆寫原工具的 Canvas 繪圖函式）----
function drawWorldLine(x1, y1, x2, y2, color = '#ffffff', width = 1.4, dash = [], layer = '0') { O.push({ k: 'L', p: [[x1, y1], [x2, y2]], c: color, w: width, d: dash || [], ly: layer }); }
function drawWorldPoly(pts, closed = true, strokeCol = '#ffffff', fillCol = null, width = 1.4, dash = [], layer = '0') { if (pts && pts.length >= 2) O.push({ k: 'P', p: pts.map(q => [q[0], q[1]]), c: strokeCol, w: width, f: fillCol, cl: !!closed, d: dash || [], ly: layer }); }
function drawWorldCircle(cx, cy, r, strokeCol = '#ef4444', fillCol = '#3b82f6', width = 1.2, layer = '鋼筋') { O.push({ k: 'C', x: cx, y: cy, r, c: strokeCol, f: fillCol, w: width, ly: layer }); }
function drawWorldText(txt, wx, wy, worldH = 14, color = '#22d3ee', align = 'center', rotDeg = 0, layer = '文字') { const L = String(txt).split('\n'); L.forEach((s, i) => O.push({ k: 'T', x: wx, y: wy - (i - (L.length - 1) / 2) * worldH * 1.25, s, h: worldH, c: color, al: align, bl: 'middle', rot: (rotDeg || 0) * Math.PI / 180, ly: layer })); }
  let LAST_L = null;   // v5.7：記錄原工具的視圖排版（各視圖原點），供平面／縱橫斷面取用原圖視圖
  { const __f = computeDynamicLayout; computeDynamicLayout = function (P) { return (LAST_L = __f(P)); }; }
  return {
    DEF, PR: [{"k": "p_L2", "nm": "左拱內弦長 L2 (cm)", "def": "288", "g": 0, "st": "10", "min": "180", "max": "600"}, {"k": "p_Y2", "nm": "左拱內弦矢高 Y2 (cm)", "def": "48", "g": 0, "st": "2", "min": "25", "max": "150"}, {"k": "p_W0", "nm": "左岸基座寬 W0 (cm)", "def": "100", "g": 0, "st": "10", "min": "60", "max": "250"}, {"k": "p_N_layer", "nm": "預鑄塊石層數 N_layer (層)", "def": "2", "g": 0, "opt": [["1", "1 層 (高50cm)"], ["2", "2 層 (原圖高100cm)"], ["3", "3 層 (高150cm)"]]}, {"k": "p_h_blk", "nm": "單層預鑄塊石高度 h_blk (cm)", "def": "50", "g": 0, "st": "5", "min": "30", "max": "80"}, {"k": "p_D_fnd", "nm": "基礎深度 D_fnd (cm)", "def": "100", "g": 1, "st": "10", "min": "60", "max": "250"}, {"k": "p_BL", "nm": "基礎前後厚度 BL (cm)", "def": "118", "g": 1, "st": "5", "min": "80", "max": "250"}, {"k": "p_Bf", "nm": "基座前後厚度 Bf (cm)", "def": "75", "g": 1, "st": "5", "min": "50", "max": "180"}, {"k": "p_B_arch", "nm": "預鑄塊石斷面寬 B_arch (cm)", "def": "20", "g": 1, "st": "5", "min": "15", "max": "50"}, {"k": "p_W_top", "nm": "基座頂部前緣寬 W_top (cm)", "def": "40", "g": 1, "st": "5", "min": "25", "max": "80"}, {"k": "p_k_gap", "nm": "視圖相對安全間距係數 k_gap", "def": "1.0", "g": 1, "st": "0.1", "min": "0.7", "max": "2.2"}, {"k": "p_LReq", "nm": "左右兩側", "def": "1", "opt": [["1", "左右相同（右側跟左側）"], ["0", "左右分開"]], "g": 3}, {"k": "p_W0C", "nm": "中央基座寬 (cm)", "def": "100", "st": "10", "min": "60", "max": "250", "g": 3}, {"k": "p_W0R", "nm": "右岸基座寬 (cm)", "def": "100", "st": "10", "min": "60", "max": "250", "g": 3}, {"k": "p_L2R", "nm": "右拱內弦長 (cm)", "def": "288", "st": "10", "min": "180", "max": "600", "g": 3}, {"k": "p_Y2R", "nm": "右拱內弦矢高 (cm)", "def": "48", "st": "2", "min": "25", "max": "150", "g": 3}, {"k": "p_nk_d", "nm": "企口深 (cm)", "def": "13", "st": "1", "min": "0", "max": "40", "g": 3}, {"k": "p_nk_e", "nm": "企口距基座背面 (cm)", "def": "8", "st": "1", "min": "0", "max": "40", "g": 3}, {"k": "p_cov", "nm": "鋼筋保護層 (cm)", "def": "8", "st": "0.5", "min": "5", "max": "15", "g": 3}, {"k": "p_hook", "nm": "主筋彎鉤長 (cm)", "def": "30", "st": "5", "min": "10", "max": "60", "g": 3}, {"k": "p_rbk", "nm": "鋼筋估算 (kg/m³)", "def": "85", "st": "5", "min": "30", "max": "200", "g": 3}], GT: ["1. 正視與俯視雙拱幾何參數 (cm)", "2. 基礎與基座斷面尺寸 (cm)", "3. 原圖設計原則自動檢核", "左右分開與細部尺寸"], title: "水保標準圖參數化 CAD — 預鑄拱型固床工 (標準基礎型 0608-1)",
    run(R, opt) {
      RR = R || {}; OPT = Object.assign({}, opt || {}); O = [];
      try {
        
        LAST_L = null; const P = getParams(), rows = computeQuantities(P);
        let checks = [];
        try { updateSidebarUI(); const t = el('normCheckList').innerHTML || ''; checks = [...t.matchAll(/<div class="check-item ?(warn)?">([\s\S]*?)<\/div>/g)].map(m => ({ ok: !m[1], text: m[2].replace(/^\s*[✔⚠]\s*/, '').replace(/<[^>]+>/g, '') })); } catch (e) { }
        if (OPT.draw) renderCAD();
        return { P, rows, checks, O, L: LAST_L };
      } finally { RR = null; }
    }
  };
})();
TCO_S['g604'] = (function () {   // 水保標準圖參數化 CAD — 箱籠固床工 (6-04 各層獨立可調反推平面版)
  const DEF = {"p_W": "1000", "p_B1": "200", "p_H1": "200", "p_t": "80", "p_d_stone": "38", "p_k_gap": "1.0", "p_N_layer": "2", "p_N_bay": "5", "p_front_mode": "inv_step", "p_side_mode": "pair2", "chkShowHoney": true, "chkShowTable": true, "p_LReq": "1", "p_extL": "259", "p_extR": "259", "p_kfill": "0.85"};
  let RR = null, OPT = {}, O = [];
  const EL = {}, CTX = new Proxy({}, { get: (t, k) => (k in t ? t[k] : () => ({ width: 0 })), set: (t, k, v) => { t[k] = v; return true; } });
  const el = id => EL[id] || (EL[id] = { get value() { const v = RR && RR[id] !== undefined && RR[id] !== null && RR[id] !== '' ? RR[id] : DEF[id]; return v === undefined ? '' : String(v); }, set value(v) {},
    get checked() { return OPT[id] !== undefined ? !!OPT[id] : !!DEF[id]; }, set checked(v) {}, textContent: '', innerHTML: '', style: {}, width: 1600, height: 1000, classList: { add() {}, remove() {}, toggle() {} },
    addEventListener() {}, appendChild() {}, getContext() { return CTX; }, getBoundingClientRect: () => ({ left: 0, top: 0, width: 1600, height: 1000 }), parentElement: { getBoundingClientRect: () => ({ left: 0, top: 0, width: 1600, height: 1000 }) } });
  const document = { getElementById: el, querySelectorAll: () => [], querySelector: () => null, createElement: () => ({ click() {}, style: {}, className: '', innerHTML: '', appendChild() {}, querySelectorAll: () => [], querySelector: () => ({ addEventListener() {}, getAttribute: () => '0', value: '' }) }), body: { appendChild() {}, removeChild() {} } };
  const window = { addEventListener() {}, innerWidth: 1990, innerHeight: 1044, devicePixelRatio: 1 };
  const requestAnimationFrame = () => 0, alert = () => {};

// ============================================================================
// 1. 原圖 DXF (3B81~3BB8) 擷取之箱籠內部不規則塊石多邊形頂點庫
// ============================================================================
const GABION_STONE_SHAPES = [
  [[-0.45,-0.28],[-0.48,0.16],[-0.18,0.46],[0.26,0.48],[0.48,0.18],[0.42,-0.26],[0.14,-0.48],[-0.20,-0.46]],
  [[-0.42,-0.32],[-0.46,0.20],[-0.08,0.48],[0.38,0.36],[0.47,-0.06],[0.34,-0.40],[-0.05,-0.47]],
  [[-0.46,0.00],[-0.36,0.40],[0.05,0.48],[0.44,0.28],[0.46,-0.18],[0.20,-0.46],[-0.26,-0.42]],
  [[-0.40,-0.35],[-0.47,0.12],[-0.14,0.45],[0.32,0.42],[0.48,0.04],[0.36,-0.38],[-0.08,-0.48]]
];

let lastChangedSource = 'W';
// 儲存立面圖每一層 (lay=0 底層 ~ lay=N_layer-1 頂層) 的箱籠顆數，支援使用者個別手動微調並反推回平面圖
let customFrontCounts = [4, 5];

// ============================================================================
// 2. 計算預設公式之各層箱籠數，並同步建立「立面各層獨立調整輸入框」
// ============================================================================
function computeAutoFrontLayerBoxCounts(N_layer, N_bay, frontMode) {
  const counts = new Array(N_layer);
  for (let lay = 0; lay < N_layer; lay++) {
    const d = (N_layer - 1) - lay; // d=0 為最頂層, d=1 為次頂層...
    if (frontMode === 'inv_step') {
      // 原圖 6-04：頂層 N_bay(5顆)，下層 N_bay-1(4顆)，奇偶交錯
      counts[lay] = (d % 2 === 0) ? N_bay : Math.max(1, N_bay - 1);
    } else if (frontMode === 'taper_down') {
      // 由頂層往底層逐層減 1 顆 (倒梯形嵌入河床兩岸，每層自然交錯半顆)
      counts[lay] = Math.max(1, N_bay - d);
    } else {
      // 加高底下每 2 層往左右各 +1 顆，且奇偶層差 1 顆交錯
      if (d === 0) counts[lay] = N_bay;
      else if (d === 1) counts[lay] = Math.max(1, N_bay - 1);
      else {
        const pairIdx = Math.floor(d / 2);
        const isOddInPair = (d % 2 === 1);
        counts[lay] = N_bay + pairIdx * 2 - (isOddInPair ? 1 : 0);
      }
    }
  }
  return counts;
}

function computeSideLayerBoxCounts(N_layer, sideMode) {
  const counts = new Array(N_layer);
  if (N_layer === 1) {
    counts[0] = 2;
    return counts;
  }
  for (let lay = 0; lay < N_layer; lay++) {
    const d = (N_layer - 1) - lay;
    if (sideMode === 'pair2') {
      if (d === 0) counts[lay] = 1;
      else if (d === 1) counts[lay] = 2;
      else {
        const extraPairs = Math.floor(d / 2);
        counts[lay] = 2 + extraPairs * 2;
      }
    } else {
      counts[lay] = 1 + d;
    }
  }
  return counts;
}

// 重新產生左側「立面各層箱籠數」獨立調整輸入框 (由頂層排到底層，直覺對應立面圖高度)
function rebuildFrontLayerInputs(recalcFromFormula = false) {
  const N_layer = parseInt(document.getElementById('p_N_layer').value) || 2;
  let W = parseFloat(document.getElementById('p_W').value) || 1000;
  let N_bay = parseInt(document.getElementById('p_N_bay').value) || 5;
  let B1 = parseFloat(document.getElementById('p_B1').value) || 200;
  const frontMode = document.getElementById('p_front_mode').value || 'inv_step';

  if (lastChangedSource === 'N_bay' || lastChangedSource === 'B1') {
    W = +(N_bay * B1).toFixed(0);
    document.getElementById('p_W').value = W;
  } else if (lastChangedSource === 'W') {
    N_bay = Math.max(1, Math.round(W / B1));
    if (N_bay >= 2 && N_bay <= 12) {
      document.getElementById('p_N_bay').value = String(N_bay);
    }
    W = +(N_bay * B1).toFixed(0);
  }

  if (recalcFromFormula || customFrontCounts.length !== N_layer) {
    customFrontCounts = computeAutoFrontLayerBoxCounts(N_layer, N_bay, frontMode);
  }

  const container = document.getElementById('frontLayerInputsContainer');
  container.innerHTML = '';

  // 由頂層 (lay = N_layer - 1) 排到底層 (lay = 0)
  for (let lay = N_layer - 1; lay >= 0; lay--) {
    const tag = (lay === N_layer - 1) ? `第${lay + 1}層(頂)` : (lay === 0 ? `第1層(底)` : `第${lay + 1}層`);
    const cell = document.createElement('div');
    cell.className = 'layer-cell';
    cell.innerHTML = `
      <label>${tag}</label>
      <input type="number" data-lay="${lay}" value="${customFrontCounts[lay]}" min="1" max="30" step="1">
    `;
    const inp = cell.querySelector('input');
    inp.addEventListener('input', (e) => {
      const idx = parseInt(e.target.getAttribute('data-lay'));
      const val = Math.max(1, parseInt(e.target.value) || 1);
      customFrontCounts[idx] = val;
      // 若修改的是最頂層，同步更新頂層寬度 W 與 N_bay 顯示
      if (idx === N_layer - 1) {
        const curB1 = parseFloat(document.getElementById('p_B1').value) || 200;
        document.getElementById('p_W').value = +(val * curB1).toFixed(0);
        if (val >= 2 && val <= 12) document.getElementById('p_N_bay').value = String(val);
      }
      updateSidebarUI();
      renderCAD();
    });
    container.appendChild(cell);
  }
}

function getParams() {
  const N_layer = parseInt(document.getElementById('p_N_layer').value) || 2;
  const B1 = parseFloat(document.getElementById('p_B1').value) || 200;
  const H1 = parseFloat(document.getElementById('p_H1').value) || 200;
  const frontMode = document.getElementById('p_front_mode').value || 'inv_step';
  const sideMode = document.getElementById('p_side_mode').value || 'pair2';
  const t = parseFloat(document.getElementById('p_t').value) || 80;
  const d_stone = parseFloat(document.getElementById('p_d_stone').value) || 38;
  const k_gap = parseFloat(document.getElementById('p_k_gap').value) || 1.0;

  if (customFrontCounts.length !== N_layer) {
    const N_bay_init = parseInt(document.getElementById('p_N_bay').value) || 5;
    customFrontCounts = computeAutoFrontLayerBoxCounts(N_layer, N_bay_init, frontMode);
  }

  const frontCounts = [...customFrontCounts];
  const topBoxes = frontCounts[N_layer - 1];
  const W = +(topBoxes * B1).toFixed(0);
  const H = +(N_layer * H1).toFixed(0);

  const sideCounts = computeSideLayerBoxCounts(N_layer, sideMode);
  const maxFrontBoxes = Math.max(...frontCounts);
  const maxFrontW = +(maxFrontBoxes * B1).toFixed(0);
  const maxSideBoxes = Math.max(...sideCounts);
  const B = +(maxSideBoxes * B1).toFixed(0);

  const stoneColsPerBox = Math.max(2, Math.round(B1 / d_stone));
  const stoneRowsPerBox = Math.max(2, Math.round(H1 / (d_stone * 0.92)));
  const stonesPerBoxFace = stoneColsPerBox * stoneRowsPerBox;

  return {
    W, N_bay: topBoxes, B1, H1, N_layer, H, frontMode, sideMode,
    frontCounts, sideCounts, maxFrontBoxes, maxFrontW, maxSideBoxes, B,
    t, d_stone, k_gap, stoneColsPerBox, stoneRowsPerBox, stonesPerBoxFace
  };
}

// ============================================================================
// 3. 工程數量計算表 (100% 對應立面各層微調後之箱籠數與反推平面尺寸)
// ============================================================================
function computeQuantities(P) {
  const rows = [];
  const B1_m = P.B1 / 100;
  const H1_m = P.H1 / 100;
  const t_m = P.t / 100;
  const singleBoxVol = +(B1_m * B1_m * H1_m).toFixed(2);

  let totalBoxes = 0;
  const layerBoxParts = [];
  for (let lay = P.N_layer - 1; lay >= 0; lay--) {
    const nF = P.frontCounts[lay];
    const nS = P.sideCounts[lay];
    totalBoxes += nF * nS;
    layerBoxParts.push(`${nF}×${nS}`);
  }
  const totalGabionVol = +(totalBoxes * singleBoxVol).toFixed(2);

  rows.push({
    no: '1',
    name: `交錯疊砌箱籠 (${P.N_layer}層, 共${totalBoxes}顆完整箱籠)`,
    unit: 'm³',
    formula: `[頂→底: ${layerBoxParts.join(' + ')}] = ${totalBoxes}籠 × (${P.B1}/100)²×(${P.H1}/100)`,
    qty: totalGabionVol,
    note: `由立面各層顆數反推平面配置`
  });

  const v_stone_fill = +(totalGabionVol * P.kfill).toFixed(2);
  rows.push({
    no: '2',
    name: `箱籠內填塊石 (粒徑 d=${P.d_stone}cm, 單籠面${P.stoneColsPerBox}×${P.stoneRowsPerBox}顆)`,
    unit: 'm³',
    formula: `箱籠總體積 ${totalGabionVol}m³ × ${P.kfill} (共 ${totalBoxes} 籠)`,
    qty: v_stone_fill,
    note: `隨箱籠數自動增減塊石，不拉長變形`
  });

  // RC 基礎台寬度依最底層箱籠寬度 + 兩側翼牆延伸 (259*2=518cm)
  const botLayerW = P.frontCounts[0] * P.B1;
  const rcTotalW_m = (Math.max(P.maxFrontW, botLayerW) + P.extL + P.extR) / 100;
  const B_m = P.B / 100;
  const v_rc_base = +(rcTotalW_m * B_m * t_m).toFixed(2);
  rows.push({
    no: '3',
    name: `RC混凝土基礎台 (底寬B=${P.B}cm × 厚t=${P.t}cm)`,
    unit: 'm³',
    formula: `總長 ${rcTotalW_m.toFixed(2)}m × 寬(${P.B}/100) × 厚(${P.t}/100)`,
    qty: v_rc_base,
    note: `隨底層最大寬度自動擴展`
  });

  return rows;
}

function updateSidebarUI() {
  const P = getParams();
  const frontTopToBot = [...P.frontCounts].reverse();
  const sideTopToBot = [...P.sideCounts].reverse();

  document.getElementById('drv_box_info').textContent =
    `總高 H = ${P.H} cm (${P.N_layer}層) ｜ 立面各層顆數(頂→底): [${frontTopToBot.join(' → ')}] 顆`;
  document.getElementById('drv_base_info').textContent =
    `側面各層顆數(頂→底): [${sideTopToBot.join(' → ')}] 顆 ｜ 底寬 B = ${P.B} cm`;

  // 檢核相鄰層是否有交錯破縫
  let allStaggered = true;
  for (let i = 0; i < P.N_layer - 1; i++) {
    if (P.frontCounts[i] === P.frontCounts[i + 1]) {
      allStaggered = false;
      break;
    }
  }

  const checks = [
    {
      ok: allStaggered,
      msg: allStaggered
        ? `[立面交錯反推平面] 頂→底 [${frontTopToBot.join(', ')}] 顆，相鄰層差奇數顆，垂直縫自然錯開半籠 (${P.B1 / 2}cm)`
        : `[立面自訂配置] 頂→底 [${frontTopToBot.join(', ')}] 顆 (含相同顆數對齊層，已如實反推回平面圖)`
    },
    {
      ok: true,
      msg: `[側面加高左右+1顆] 頂→底各層排數為 [${sideTopToBot.join(', ')}] 顆，底下每2層往左右各多加1顆`
    },
    {
      ok: P.B === P.maxSideBoxes * P.B1,
      msg: `[符號 B / B1] 側面底層總寬 B=${P.B}cm = 底層 ${P.maxSideBoxes} 顆 × B1(${P.B1}cm)`
    },
    {
      ok: P.t >= 50,
      msg: `[符號 t] RC基礎台厚度 t=${P.t}cm ≥ 50cm (符合結構穩定)`
    }
  ];

  const box = document.getElementById('normCheckList');
  box.innerHTML = checks.map(c =>
    `<div class="check-item ${c.ok ? '' : 'warn'}">${c.ok ? '✔' : '⚠'} ${c.msg}</div>`
  ).join('');
}

// ============================================================================
// 4. Canvas 2D 視埠與幾何繪圖引擎 (單位：cm)
// ============================================================================
const canvas = document.getElementById('cadCanvas');
const ctx = canvas.getContext('2d');
let camX = 750, camY = 450, scale = 0.24;
let isDragging = false, dragStartX = 0, dragStartY = 0;
let dxfEntities = [];

function worldToScreen(wx, wy) {
  const cw = canvas.width || 1100;
  const ch = canvas.height || 750;
  return [
    cw / 2 + (wx - camX) * scale,
    ch / 2 - (wy - camY) * scale
  ];
}
function screenToWorld(sx, sy) {
  const cw = canvas.width || 1100;
  const ch = canvas.height || 750;
  return [
    camX + (sx - cw / 2) / scale,
    camY - (sy - ch / 2) / scale
  ];
}

function drawWorldLine(x1, y1, x2, y2, color = '#ffffff', width = 1.4, dash = [], layer = '0') {
  const [sx1, sy1] = worldToScreen(x1, y1);
  const [sx2, sy2] = worldToScreen(x2, y2);
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.setLineDash(dash);
  ctx.beginPath();
  ctx.moveTo(sx1, sy1);
  ctx.lineTo(sx2, sy2);
  ctx.stroke();
  ctx.restore();
  dxfEntities.push({ type: 'LINE', layer, x1, y1, x2, y2 });
}

function drawWorldPoly(pts, closed = true, strokeCol = '#ffffff', fillCol = null, width = 1.5, dash = [], layer = '0') {
  if (!pts || pts.length < 2) return;
  ctx.save();
  ctx.beginPath();
  pts.forEach((p, idx) => {
    const [sx, sy] = worldToScreen(p[0], p[1]);
    if (idx === 0) ctx.moveTo(sx, sy);
    else ctx.lineTo(sx, sy);
  });
  if (closed) ctx.closePath();
  if (fillCol) {
    ctx.fillStyle = fillCol;
    ctx.fill();
  }
  if (strokeCol) {
    ctx.strokeStyle = strokeCol;
    ctx.lineWidth = width;
    ctx.setLineDash(dash);
    ctx.stroke();
  }
  ctx.restore();
  dxfEntities.push({ type: 'POLY', layer, pts, closed });
}

function drawWorldText(txt, wx, wy, worldH = 26, color = '#22d3ee', align = 'center', rotDeg = 0, layer = '!字') {
  const [sx, sy] = worldToScreen(wx, wy);
  const px = Math.max(9.5, Math.min(28, worldH * scale));
  ctx.save();
  ctx.translate(sx, sy);
  if (rotDeg) ctx.rotate(-rotDeg * Math.PI / 180);
  ctx.font = `600 ${px}px "DFKai-SB", "Microsoft JhengHei", serif`;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  const lines = String(txt).split('\n');
  lines.forEach((line, idx) => {
    const dy = (idx - (lines.length - 1) / 2) * (px * 1.25);
    ctx.fillText(line, 0, dy);
  });
  ctx.restore();
  dxfEntities.push({ type: 'TEXT', layer, txt: String(txt).replace(/\n/g, ' '), x: wx, y: wy, h: worldH, rotDeg });
}

// 繪製單一完整箱籠 (xMin, yMin, boxW, boxH) 內部滿鋪不規則塊石 + 縫隙填滿小石
function drawGabionBoxWithStones(xMin, yMin, boxW, boxH, d_stone, boxSeed = 0) {
  const boxPts = [
    [xMin, yMin],
    [xMin + boxW, yMin],
    [xMin + boxW, yMin + boxH],
    [xMin, yMin + boxH]
  ];
  drawWorldPoly(boxPts, true, '#ffffff', 'rgba(217, 70, 239, 0.05)', 1.8, [], '0');

  const nCols = Math.max(1, Math.round(boxW / d_stone));
  const nRows = Math.max(2, Math.round(boxH / (d_stone * 0.92)));
  const cellW = boxW / nCols;
  const cellH = boxH / nRows;

  const maxRx = Math.min(cellW * 0.47, d_stone * 0.56);
  const maxRy = Math.min(cellH * 0.47, d_stone * 0.54);

  for (let r = 0; r < nRows; r++) {
    const isOddRow = (r % 2 === 1);
    for (let c = 0; c < nCols; c++) {
      const hash = Math.sin((c * 19 + r * 37 + boxSeed * 13) * 12.9898) * 43758.5453;
      const f1 = hash - Math.floor(hash);
      const f2 = (hash * 1.73) - Math.floor(hash * 1.73);

      let cx = xMin + (c + 0.5 + (isOddRow ? 0.08 : -0.06) + (f1 - 0.5) * 0.14) * cellW;
      let cy = yMin + (r + 0.5 + (f2 - 0.5) * 0.14) * cellH;
      cx = Math.max(xMin + maxRx * 0.92, Math.min(xMin + boxW - maxRx * 0.92, cx));
      cy = Math.max(yMin + maxRy * 0.92, Math.min(yMin + boxH - maxRy * 0.92, cy));

      const rx = maxRx * (0.92 + (f1 - 0.5) * 0.16);
      const ry = maxRy * (0.92 + (f2 - 0.5) * 0.16);
      const rot = (f1 - 0.5) * 0.7;
      const shape = GABION_STONE_SHAPES[(c + r + boxSeed) % GABION_STONE_SHAPES.length];
      const cosA = Math.cos(rot), sinA = Math.sin(rot);
      const pts = shape.map(uv => {
        const lx = uv[0] * rx * 2.0;
        const ly = uv[1] * ry * 2.0;
        return [cx + lx * cosA - ly * sinA, cy + lx * sinA + ly * cosA];
      });
      drawWorldPoly(pts, true, '#e879f9', 'rgba(217, 70, 239, 0.12)', 1.25, [], 'HATCH');
    }
  }

  for (let r = 0; r < nRows - 1; r++) {
    for (let c = 0; c < nCols - 1; c++) {
      const cx = xMin + (c + 1.0) * cellW;
      const cy = yMin + (r + 1.0) * cellH;
      const sRx = maxRx * 0.34;
      const sRy = maxRy * 0.30;
      const shape = GABION_STONE_SHAPES[(c * 3 + r + boxSeed) % GABION_STONE_SHAPES.length];
      const pts = shape.map(uv => [cx + uv[0] * sRx * 2.0, cy + uv[1] * sRy * 2.0]);
      drawWorldPoly(pts, true, '#d946ef', null, 1.0, [], 'HATCH');
    }
  }
}

// 繪製指定矩形區域 [xMin, yMin, w, h] 之 HONEY 蜂巢正六角鉛絲網孵化
function drawHoneyHatchRect(xMin, yMin, w, h) {
  if (!document.getElementById('chkShowHoney').checked) return;
  ctx.save();
  const [sx0, sy0] = worldToScreen(xMin, yMin + h);
  const [sx1, sy1] = worldToScreen(xMin + w, yMin);
  ctx.beginPath();
  ctx.rect(sx0, sy0, sx1 - sx0, sy1 - sy0);
  ctx.clip();

  ctx.strokeStyle = 'rgba(232, 121, 249, 0.55)';
  ctx.lineWidth = 1.05;

  const hexR = 16;
  const dx = hexR * 1.5;
  const dy = hexR * Math.sqrt(3);

  for (let wx = xMin - hexR; wx <= xMin + w + hexR; wx += dx) {
    const colIdx = Math.round((wx - xMin) / dx);
    const yOff = (colIdx % 2 === 0) ? 0 : dy * 0.5;
    for (let wy = yMin - hexR; wy <= yMin + h + hexR; wy += dy) {
      const cy = wy + yOff;
      const p0 = worldToScreen(wx - hexR * 0.5, cy - dy * 0.5);
      const p1 = worldToScreen(wx + hexR * 0.5, cy - dy * 0.5);
      const p2 = worldToScreen(wx + hexR, cy);
      const p3 = worldToScreen(wx + hexR * 0.5, cy + dy * 0.5);
      ctx.beginPath();
      ctx.moveTo(p0[0], p0[1]);
      ctx.lineTo(p1[0], p1[1]);
      ctx.lineTo(p2[0], p2[1]);
      ctx.lineTo(p3[0], p3[1]);
      ctx.stroke();
    }
  }
  ctx.restore();
}

// 繪製 RC 基礎台內部 AR-CONC 混凝土骨材與砂漿點孵化
function drawArConcHatch(xMin, yMin, w, h) {
  const polyPts = [
    [xMin, yMin],
    [xMin + w, yMin],
    [xMin + w, yMin + h],
    [xMin, yMin + h]
  ];
  ctx.save();
  ctx.beginPath();
  polyPts.forEach((p, idx) => {
    const [sx, sy] = worldToScreen(p[0], p[1]);
    if (idx === 0) ctx.moveTo(sx, sy);
    else ctx.lineTo(sx, sy);
  });
  ctx.closePath();
  ctx.clip();

  ctx.strokeStyle = 'rgba(203, 213, 225, 0.48)';
  ctx.fillStyle = 'rgba(203, 213, 225, 0.42)';
  ctx.lineWidth = 1.0;

  const step = 45;
  for (let gx = xMin; gx < xMin + w; gx += step) {
    for (let gy = yMin; gy < yMin + h; gy += step) {
      const t1 = [[gx + 8, gy + 10], [gx + 18, gy + 6], [gx + 13, gy + 18]];
      const t2 = [[gx + 26, gy + 22], [gx + 36, gy + 26], [gx + 30, gy + 35]];
      [t1, t2].forEach(tri => {
        ctx.beginPath();
        tri.forEach((pt, i) => {
          const [sx, sy] = worldToScreen(pt[0], pt[1]);
          if (i === 0) ctx.moveTo(sx, sy);
          else ctx.lineTo(sx, sy);
        });
        ctx.closePath();
        ctx.stroke();
      });
      [[gx + 5, gy + 24], [gx + 21, gy + 14], [gx + 35, gy + 10], [gx + 16, gy + 30]].forEach(dot => {
        const [sx, sy] = worldToScreen(dot[0], dot[1]);
        ctx.fillRect(sx, sy, 1.6, 1.6);
      });
    }
  }
  ctx.restore();
}

// 尺寸標註延伸線退縮鐵律
function getDimExtensionCoords(coordObj, dimPos) {
  const dir = dimPos >= coordObj ? 1 : -1;
  const minGapFromObj = 24.0;
  const overshoot = 18.0;
  return {
    extStart: coordObj + dir * minGapFromObj,
    extEnd: dimPos + dir * overshoot
  };
}

function drawDimH(x1, x2, yObj1, yObj2, yDim, text, textAbove = true) {
  const e1 = getDimExtensionCoords(yObj1, yDim);
  const e2 = getDimExtensionCoords(yObj2, yDim);
  drawWorldLine(x1, e1.extStart, x1, e1.extEnd, '#22d3ee', 1.25, [], 'DIM');
  drawWorldLine(x2, e2.extStart, x2, e2.extEnd, '#22d3ee', 1.25, [], 'DIM');
  drawWorldLine(x1, yDim, x2, yDim, '#22d3ee', 1.4, [], 'DIM');
  const s = Math.min(26, Math.abs(x2 - x1) * 0.22);
  const dir = x2 >= x1 ? 1 : -1;
  drawWorldPoly([[x1, yDim], [x1 + dir * s, yDim + s * 0.22], [x1 + dir * s, yDim - s * 0.22]], true, '#22d3ee', '#22d3ee', 1, [], 'DIM');
  drawWorldPoly([[x2, yDim], [x2 - dir * s, yDim + s * 0.22], [x2 - dir * s, yDim - s * 0.22]], true, '#22d3ee', '#22d3ee', 1, [], 'DIM');
  const ty = textAbove ? yDim + 24 : yDim - 24;
  drawWorldText(text, (x1 + x2) / 2, ty, 28, '#22d3ee', 'center', 0, 'DIM');
}

function drawDimV(y1, y2, xObj1, xObj2, xDim, text, textLeftOfLine = true) {
  const e1 = getDimExtensionCoords(xObj1, xDim);
  const e2 = getDimExtensionCoords(xObj2, xDim);
  drawWorldLine(e1.extStart, y1, e1.extEnd, y1, '#22d3ee', 1.25, [], 'DIM');
  drawWorldLine(e2.extStart, y2, e2.extEnd, y2, '#22d3ee', 1.25, [], 'DIM');
  drawWorldLine(xDim, y1, xDim, y2, '#22d3ee', 1.4, [], 'DIM');
  const s = Math.min(24, Math.abs(y2 - y1) * 0.22);
  const dir = y2 >= y1 ? 1 : -1;
  drawWorldPoly([[xDim, y1], [xDim - s * 0.22, y1 + dir * s], [xDim + s * 0.22, y1 + dir * s]], true, '#22d3ee', '#22d3ee', 1, [], 'DIM');
  drawWorldPoly([[xDim, y2], [xDim - s * 0.22, y2 - dir * s], [xDim + s * 0.22, y2 - dir * s]], true, '#22d3ee', '#22d3ee', 1, [], 'DIM');
  const tx = textLeftOfLine ? xDim - 22 : xDim + 22;
  drawWorldText(text, tx, (y1 + y2) / 2, 28, '#22d3ee', 'center', 90, 'DIM');
}

// ============================================================================
// 5. 動態包絡盒相對間距排版引擎
// ============================================================================
function computeDynamicLayout(P) {
  const frontCenterX = P.W / 2;
  const frontHalfMax = P.maxFrontW / 2;
  const frontMinX = frontCenterX - frontHalfMax;
  const frontMaxX = frontCenterX + frontHalfMax;

  const gapX = Math.max(780, (P.maxFrontW * 0.35 + P.B * 0.45) * P.k_gap);
  const gapY = Math.max(680, (P.H * 0.55 + P.B * 0.45) * P.k_gap);

  const planBotY = P.H + gapY;
  const planTopY = planBotY + P.B;

  const sideLeftX = frontMaxX + gapX;
  const sideRightX = sideLeftX + P.B;

  const legendX = frontCenterX;
  const legendTopY = -P.t - 220 * P.k_gap;

  const tableTopY = legendTopY - 560;

  return {
    frontCenterX, frontMinX, frontMaxX,
    planBotY, planTopY,
    sideLeftX, sideRightX,
    legendX, legendTopY,
    tableTopY,
    bounds: {
      minX: frontMinX - 480,
      maxX: sideRightX + 300,
      minY: tableTopY - 320,
      maxY: planTopY + 180
    }
  };
}

// ============================================================================
// 6. 由立面圖與側面圖各層箱籠數「反向推算回平面圖」之 2D 遮罩裁剪輔助函式
//    當繪製第 lay 層平面箱籠線條時，若某線段被上方更高層 (u > lay) 的箱籠實體矩形遮擋，則自動裁剪掉被遮蔽段！
// ============================================================================
function drawClippedLine2D(x1, y1, x2, y2, occluderRects, color, width, layer = '0') {
  // 將線段切成微小採樣段或計算 1D 區間差集 (針對水平線或垂直線可精確求區間差集)
  const isHoriz = Math.abs(y1 - y2) < 1e-4;
  const isVert = Math.abs(x1 - x2) < 1e-4;

  if (isHoriz) {
    const y = y1;
    let intervals = [[Math.min(x1, x2), Math.max(x1, x2)]];
    occluderRects.forEach(r => {
      // 嚴格內部遮蔽 (邊界線上不遮蔽，讓重疊邊界正常顯示)
      if (y > r.y1 + 0.5 && y < r.y2 - 0.5) {
        const nextIntervals = [];
        intervals.forEach(([a, b]) => {
          if (r.x2 <= a || r.x1 >= b) {
            nextIntervals.push([a, b]);
          } else {
            if (r.x1 > a) nextIntervals.push([a, r.x1]);
            if (r.x2 < b) nextIntervals.push([r.x2, b]);
          }
        });
        intervals = nextIntervals;
      }
    });
    intervals.forEach(([a, b]) => {
      if (b - a > 1.0) drawWorldLine(a, y, b, y, color, width, [], layer);
    });
  } else if (isVert) {
    const x = x1;
    let intervals = [[Math.min(y1, y2), Math.max(y1, y2)]];
    occluderRects.forEach(r => {
      if (x > r.x1 + 0.5 && x < r.x2 - 0.5) {
        const nextIntervals = [];
        intervals.forEach(([a, b]) => {
          if (r.y2 <= a || r.y1 >= b) {
            nextIntervals.push([a, b]);
          } else {
            if (r.y1 > a) nextIntervals.push([a, r.y1]);
            if (r.y2 < b) nextIntervals.push([r.y2, b]);
          }
        });
        intervals = nextIntervals;
      }
    });
    intervals.forEach(([a, b]) => {
      if (b - a > 1.0) drawWorldLine(x, a, x, b, color, width, [], layer);
    });
  } else {
    drawWorldLine(x1, y1, x2, y2, color, width, [], layer);
  }
}

// ============================================================================
// 7. 主渲染函式 renderCAD() — 立面各層調整直接反向堆疊回平面圖
// ============================================================================
function renderCAD() {
  const rect = canvas.parentElement.getBoundingClientRect();
  const cw = Math.max(800, rect.width || window.innerWidth - 410);
  const ch = Math.max(550, rect.height || window.innerHeight - 44);
  if (canvas.width !== cw || canvas.height !== ch) {
    canvas.width = cw;
    canvas.height = ch;
  }

  ctx.fillStyle = '#141923';
  ctx.fillRect(0, 0, cw, ch);
  dxfEntities = [];

  const P = getParams();
  const L = computeDynamicLayout(P);
  const showTable = document.getElementById('chkShowTable').checked;
  const { frontCenterX, frontMinX, frontMaxX, planBotY, planTopY, sideLeftX, sideRightX } = L;

  // =========================================================================
  // 視圖 1：【上方平面圖】(100% 由立面各層箱籠數 frontCounts[lay] 與側面排數 sideCounts[lay] 反推堆疊！)
  // =========================================================================
  const planCenterY = (planBotY + planTopY) / 2;

  // 先建立每一層 (lay = 0 底層 ~ N_layer-1 頂層) 在平面圖上的真實覆蓋矩形清單
  const planLayerRects = [];
  for (let lay = 0; lay < P.N_layer; lay++) {
    const nFront = P.frontCounts[lay];
    const nSide = P.sideCounts[lay];
    const layW = nFront * P.B1;
    const layB = nSide * P.B1;
    const x1 = frontCenterX - layW / 2;
    const x2 = frontCenterX + layW / 2;
    const y1 = planCenterY - layB / 2;
    const y2 = planCenterY + layB / 2;
    planLayerRects.push({ lay, nFront, nSide, layW, layB, x1, x2, y1, y2 });
  }

  // 對每一層繪製 HONEY 蜂巢鉛絲網孵化 (確保任何突出於外圍的階層都有蜂巢網)
  planLayerRects.forEach(r => {
    drawHoneyHatchRect(r.x1, r.y1, r.layW, r.layB);
  });

  // 由底層 (lay = 0) 往頂層 (lay = N_layer - 1) 依序反推繪製平面箱籠格網
  // 對於第 lay 層，所有位於其上方的層 (u > lay) 都會構成遮蔽矩形 occluders
  for (let lay = 0; lay < P.N_layer; lay++) {
    const cur = planLayerRects[lay];
    const occluders = planLayerRects.slice(lay + 1);
    const isTop = (lay === P.N_layer - 1);
    const col = isTop ? '#ffffff' : '#cbd5e1';
    const lw = isTop ? 1.85 : 1.45;

    // 1) 繪製該層四邊外框線 (自動扣除被上層完全覆蓋的內部段)
    drawClippedLine2D(cur.x1, cur.y1, cur.x2, cur.y1, occluders, col, lw, '0');
    drawClippedLine2D(cur.x1, cur.y2, cur.x2, cur.y2, occluders, col, lw, '0');
    drawClippedLine2D(cur.x1, cur.y1, cur.x1, cur.y2, occluders, col, lw, '0');
    drawClippedLine2D(cur.x2, cur.y1, cur.x2, cur.y2, occluders, col, lw, '0');

    // 2) 繪製該層前後並排的分排水平線 (Y方向，共 nSide - 1 條)
    for (let r = 1; r < cur.nSide; r++) {
      const yRow = cur.y1 + r * P.B1;
      drawClippedLine2D(cur.x1, yRow, cur.x2, yRow, occluders, col, 1.35, '0');
    }

    // 3) 繪製該層橫向箱籠的垂直分格線 (X方向，共 nFront - 1 條，位置直接由立面該層顆數反推！)
    for (let k = 1; k < cur.nFront; k++) {
      const xDiv = cur.x1 + k * P.B1;
      drawClippedLine2D(xDiv, cur.y1, xDiv, cur.y2, occluders, col, lw, '0');
    }
  }

  drawWorldText('平 面 圖 (由立面各層顆數反推疊砌)', frontCenterX, planTopY + 75, 30, '#38bdf8', 'center', 0, '!字');

  // =========================================================================
  // 視圖 2：【左下方正面／立面圖】(直接呈現使用者設定之各層箱籠數 frontCounts[lay] + 黃色階梯嵌入線)
  // =========================================================================
  const rcLeftX = frontMinX - P.extL;
  const rcRightX = frontMaxX + P.extR;
  drawArConcHatch(rcLeftX, -P.t, rcRightX - rcLeftX, P.t);
  drawWorldPoly([
    [rcLeftX, 0],
    [rcRightX, 0],
    [rcRightX, -P.t],
    [rcLeftX, -P.t]
  ], true, '#ffffff', null, 1.7, [], 'BASE');

  const layerLeftXs = [];
  const layerRightXs = [];
  for (let lay = 0; lay < P.N_layer; lay++) {
    const yBoxMin = lay * P.H1;
    const nBoxes = P.frontCounts[lay];
    const layerW = nBoxes * P.B1;
    const xStart = frontCenterX - layerW / 2;
    layerLeftXs.push(xStart);
    layerRightXs.push(xStart + layerW);

    for (let k = 0; k < nBoxes; k++) {
      const xBoxMin = xStart + k * P.B1;
      drawGabionBoxWithStones(xBoxMin, yBoxMin, P.B1, P.H1, P.d_stone, lay * 37 + k * 11);
    }

    // 在立面圖左側標示該層顆數標籤，方便直覺核對
    drawWorldText(
      `L${lay + 1}(${nBoxes}顆)`,
      xStart - 35,
      yBoxMin + P.H1 / 2,
      22,
      '#fde047',
      'right',
      0,
      '!字'
    );
  }

  // 繪製原圖左右兩側黃色階梯外框線與護岸斜坡線
  const bankTopH = P.H + 300;
  const bankSlopeW = 140;
  const topLeftX = layerLeftXs[P.N_layer - 1];
  const topRightX = layerRightXs[P.N_layer - 1];

  const leftStepPts = [[rcLeftX, 0], [layerLeftXs[0], 0]];
  const rightStepPts = [[rcRightX, 0], [layerRightXs[0], 0]];
  for (let lay = 0; lay < P.N_layer; lay++) {
    const yBot = lay * P.H1;
    const yTop = (lay + 1) * P.H1;
    leftStepPts.push([layerLeftXs[lay], yBot]);
    leftStepPts.push([layerLeftXs[lay], yTop]);
    rightStepPts.push([layerRightXs[lay], yBot]);
    rightStepPts.push([layerRightXs[lay], yTop]);
  }
  leftStepPts.push([topLeftX - bankSlopeW, bankTopH]);
  leftStepPts.push([rcLeftX - 95, bankTopH]);
  rightStepPts.push([topRightX + bankSlopeW, bankTopH]);
  rightStepPts.push([rcRightX + 95, bankTopH]);

  drawWorldPoly(leftStepPts, false, '#facc15', null, 1.8, [], '0');
  drawWorldPoly(rightStepPts, false, '#facc15', null, 1.8, [], '0');

  // 原圖頂部引線：「箱籠固床工」
  const pGabionLead0 = [topLeftX + P.B1 * 0.75, P.H];
  const pGabionLead1 = [topLeftX + P.B1 * 0.95, P.H + 95];
  drawWorldLine(pGabionLead0[0], pGabionLead0[1], pGabionLead1[0], pGabionLead1[1], '#22d3ee', 1.35, [], 'DIM');
  drawWorldPoly([
    pGabionLead0,
    [pGabionLead0[0] + 6, pGabionLead0[1] + 20],
    [pGabionLead0[0] + 15, pGabionLead0[1] + 15]
  ], true, '#22d3ee', '#22d3ee', 1, [], 'DIM');
  drawWorldText('箱籠固床工', pGabionLead1[0] + 25, pGabionLead1[1] + 10, 30, '#22d3ee', 'left', 0, 'DIM');

  // 左下引線：RC基礎台
  const pLeadStart = [rcLeftX + 80, -P.t * 0.75];
  const pLeadEnd = [rcLeftX - 5, -P.t - 44];
  drawWorldLine(pLeadStart[0], pLeadStart[1], pLeadEnd[0], pLeadEnd[1], '#22d3ee', 1.3, [], 'DIM');
  drawWorldPoly([
    pLeadStart,
    [pLeadStart[0] - 18, pLeadStart[1] - 8],
    [pLeadStart[0] - 10, pLeadStart[1] - 18]
  ], true, '#22d3ee', '#22d3ee', 1, [], 'DIM');
  drawWorldText('RC基礎台', pLeadEnd[0] - 15, pLeadEnd[1] + 15, 30, '#22d3ee', 'right', 0, 'DIM');

  // *D3 頂層寬度標註：W
  drawDimH(topLeftX, topRightX, P.H + 55, P.H + 55, P.H + 205, `W = ${P.W} cm (頂層${P.frontCounts[P.N_layer - 1]}顆)`, true);

  // *D16 右上單一箱籠寬度標註：B1
  drawDimH(topRightX - P.B1, topRightX, P.H, P.H, P.H + 115, `B1 = ${P.B1} cm`, true);

  // *D18 右側上層單籠高標註：H1
  drawDimV(P.H - P.H1, P.H, topRightX, topRightX, frontMaxX + 95, `H1 = ${P.H1}`, true);

  // *D19 右側固床工總高標註：H
  drawDimV(0, P.H, frontMaxX, topRightX, frontMaxX + 195, `H = ${P.H} (${P.N_layer}層)`, true);

  // *D15 右下混凝土基礎台厚度標註：t
  drawDimV(-P.t, 0, rcRightX, rcRightX, rcRightX + 112, `t = ${P.t}`, true);

  drawWorldText('正 面 圖 (各層箱籠數可調)', frontCenterX, -P.t - 110, 30, '#38bdf8', 'center', 0, '!字');

  // =========================================================================
  // 視圖 3：【右下方側面／縱斷面圖】(加高後底下每 2 層往左右各多加 1 顆，金字塔對稱擴展)
  // =========================================================================
  const sideCenterX = (sideLeftX + sideRightX) / 2;

  drawArConcHatch(sideLeftX, -P.t, P.B, P.t);
  drawWorldPoly([
    [sideLeftX, 0],
    [sideRightX, 0],
    [sideRightX, -P.t],
    [sideLeftX, -P.t]
  ], true, '#ffffff', null, 1.7, [], 'BASE');

  drawWorldPoly([
    [sideLeftX, 0],
    [sideLeftX, bankTopH],
    [sideRightX, bankTopH],
    [sideRightX, 0]
  ], false, '#ffffff', null, 1.4, [], 'BASE');

  for (let lay = 0; lay < P.N_layer; lay++) {
    const yBoxMin = lay * P.H1;
    const nRowsInLayer = P.sideCounts[lay];
    const layerWidth = nRowsInLayer * P.B1;
    const xLayerStart = sideCenterX - layerWidth / 2;

    for (let r = 0; r < nRowsInLayer; r++) {
      const xBoxMin = xLayerStart + r * P.B1;
      drawGabionBoxWithStones(xBoxMin, yBoxMin, P.B1, P.H1, P.d_stone, 100 + lay * 23 + r * 7);
    }
  }

  drawDimH(sideLeftX, sideRightX, -P.t, -P.t, -P.t - 95, `B = ${P.B} cm (底層${P.maxSideBoxes}顆)`, false);

  const topSideW = P.sideCounts[P.N_layer - 1] * P.B1;
  const xTopBoxL = sideCenterX - topSideW / 2;
  drawDimH(xTopBoxL, xTopBoxL + P.B1, P.H, P.H, P.H + 86, `B1 = ${P.B1} cm`, true);

  drawDimV(P.H - P.H1, P.H, sideLeftX, sideLeftX, sideLeftX - 130, `H1 = ${P.H1}`, true);
  drawDimV(0, P.H, sideLeftX, sideLeftX, sideLeftX - 220, `H = ${P.H}`, true);

  drawWorldText('側 面 圖 (底下每2層左右各+1顆)', sideCenterX, -P.t - 180, 30, '#38bdf8', 'center', 0, '!字');

  // =========================================================================
  // 視圖 4：【原圖符號說明 1154D】
  // =========================================================================
  const frontTopToBot = [...P.frontCounts].reverse();
  const sideTopToBot = [...P.sideCounts].reverse();
  const legendLines = [
    '符號說明：',
    `W   固床工寬度 (頂層 ${P.W} cm，立面頂→底 [${frontTopToBot.join('→')}] 顆反推平面)`,
    `B   箱籠排列及基礎台寬度 (底寬 ${P.B} cm，側面頂→底 [${sideTopToBot.join('→')}] 顆)`,
    `B1  單一箱籠寬度 (${P.B1} cm)`,
    `H   固床工高度 (${P.H} cm，共 ${P.N_layer} 層)`,
    `H1  單一箱籠高度 (${P.H1} cm)`,
    `t   混凝土基礎台厚度 (${P.t} cm)`
  ];
  legendLines.forEach((line, idx) => {
    drawWorldText(
      line,
      L.legendX - 250,
      L.legendTopY - idx * 68,
      idx === 0 ? 34 : 28,
      '#22d3ee',
      'left',
      0,
      '!字'
    );
  });

  // =========================================================================
  // 視圖 5：【下方工程數量計算式總表】
  // =========================================================================
  if (showTable) {
    drawQuantityTableOnCanvas(frontMinX - 260, L.tableTopY, P);
  }
}

function drawQuantityTableOnCanvas(tx, ty, P) {
  const rows = computeQuantities(P);
  const colW = [75, 430, 85, 680, 130, 380];
  const totalW = colW.reduce((a, b) => a + b, 0);
  const rowH = 46;
  const headH = 52;

  drawWorldPoly([[tx, ty], [tx + totalW, ty], [tx + totalW, ty - headH], [tx, ty - headH]], true, '#38bdf8', 'rgba(2,132,199,0.28)', 1.5, [], 'TABLE');
  drawWorldText('箱籠固床工 (圖號：6-04) — 參數化工程數量計算式總表 (立面各層可調反推平面對照)', tx + totalW / 2, ty - headH / 2, 20, '#38bdf8', 'center', 0, 'TABLE');

  const headers = ['項次', '工 項 名 稱', '單位', '工程數量計算式 (對應圖面標註 W, B, B1, H, H1, t)', '數量', '設計規範備註'];
  let curY = ty - headH;
  drawWorldPoly([[tx, curY], [tx + totalW, curY], [tx + totalW, curY - rowH], [tx, curY - rowH]], true, '#475569', 'rgba(30,41,59,0.85)', 1.2, [], 'TABLE');

  let cx = tx;
  headers.forEach((h, i) => {
    drawWorldText(h, cx + colW[i] / 2, curY - rowH / 2, 16, '#fde047', 'center', 0, 'TABLE');
    cx += colW[i];
    if (i < headers.length - 1) drawWorldLine(cx, ty - headH, cx, curY - rowH * (rows.length + 1), '#334155', 1.0, [], 'TABLE');
  });

  curY -= rowH;
  rows.forEach((r, idx) => {
    const bg = idx % 2 === 0 ? 'rgba(15,23,42,0.75)' : 'rgba(30,41,59,0.55)';
    drawWorldPoly([[tx, curY], [tx + totalW, curY], [tx + totalW, curY - rowH], [tx, curY - rowH]], true, '#334155', bg, 1.0, [], 'TABLE');
    let rx = tx;
    const vals = [r.no, r.name, r.unit, r.formula, String(r.qty), r.note];
    vals.forEach((v, i) => {
      const align = (i === 1 || i === 3 || i === 5) ? 'left' : 'center';
      const px = align === 'left' ? rx + 14 : rx + colW[i] / 2;
      const col = i === 4 ? '#4ade80' : (i === 3 ? '#67e8f9' : '#e2e8f0');
      drawWorldText(v, px, curY - rowH / 2, 15.5, col, align, 0, 'TABLE');
      rx += colW[i];
    });
    curY -= rowH;
  });
}

// ============================================================================
// 8. 視角置中 zoomToFit() 與滑鼠平移/縮放事件
// ============================================================================
function zoomToFit() {
  const rect = canvas.parentElement.getBoundingClientRect();
  const cw = Math.max(800, rect.width || window.innerWidth - 410);
  const ch = Math.max(550, rect.height || window.innerHeight - 44);
  canvas.width = cw;
  canvas.height = ch;

  const P = getParams();
  const L = computeDynamicLayout(P);
  const { minX, maxX, minY, maxY } = L.bounds;
  camX = (minX + maxX) / 2;
  camY = (minY + maxY) / 2;
  const scaleX = (cw * 0.90) / (maxX - minX);
  const scaleY = (ch * 0.90) / (maxY - minY);
  scale = Math.min(scaleX, scaleY);
  renderCAD();
}

canvas.addEventListener('mousedown', e => {
  if (e.button !== 0) return;
  isDragging = true;
  dragStartX = e.clientX;
  dragStartY = e.clientY;
});
window.addEventListener('mousemove', e => {
  const rect = canvas.getBoundingClientRect();
  const [wx, wy] = screenToWorld(e.clientX - rect.left, e.clientY - rect.top);
  document.getElementById('hud-coords').textContent =
    `世界座標 (cm): X=${wx.toFixed(1)}, Y=${wy.toFixed(1)} | 縮放=${(scale * 100).toFixed(0)}% | 滾輪縮放・左鍵平移・雙擊置中`;
  if (!isDragging) return;
  const dx = e.clientX - dragStartX;
  const dy = e.clientY - dragStartY;
  dragStartX = e.clientX;
  dragStartY = e.clientY;
  camX -= dx / scale;
  camY += dy / scale;
  renderCAD();
});
window.addEventListener('mouseup', () => { isDragging = false; });

canvas.addEventListener('wheel', e => {
  e.preventDefault();
  const rect = canvas.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  const my = e.clientY - rect.top;
  const [wxBefore, wyBefore] = screenToWorld(mx, my);
  const factor = e.deltaY < 0 ? 1.12 : 0.89;
  scale = Math.max(0.02, Math.min(8.0, scale * factor));
  const [wxAfter, wyAfter] = screenToWorld(mx, my);
  camX += (wxBefore - wxAfter);
  camY += (wyBefore - wyAfter);
  renderCAD();
}, { passive: false });

canvas.addEventListener('dblclick', () => zoomToFit());
window.addEventListener('resize', () => renderCAD());

// ============================================================================
// 9. 無彈窗直接下載原生 AutoCAD DXF 與 CSV 數量計算書
// ============================================================================
function toDxfUnicode(str) {
  return String(str).split('').map(ch => {
    const code = ch.charCodeAt(0);
    return code > 127 ? `\\U+${code.toString(16).toUpperCase().padStart(4, '0')}` : ch;
  }).join('');
}

function exportDXF() {
  renderCAD();
  const out = [];
  const push = (c, v) => { out.push(String(c)); out.push(String(v)); };

  push(0, 'SECTION'); push(2, 'HEADER');
  push(9, '$ACADVER'); push(1, 'AC1015');
  push(9, '$INSUNITS'); push(70, 5);
  push(0, 'ENDSEC');

  push(0, 'SECTION'); push(2, 'ENTITIES');
  dxfEntities.forEach(e => {
    const lay = toDxfUnicode(e.layer || '0');
    if (e.type === 'LINE') {
      push(0, 'LINE'); push(8, lay);
      push(10, e.x1.toFixed(3)); push(20, e.y1.toFixed(3)); push(30, '0.0');
      push(11, e.x2.toFixed(3)); push(21, e.y2.toFixed(3)); push(31, '0.0');
    } else if (e.type === 'POLY') {
      push(0, 'LWPOLYLINE'); push(8, lay);
      push(90, e.pts.length);
      push(70, e.closed ? 1 : 0);
      e.pts.forEach(p => {
        push(10, p[0].toFixed(3));
        push(20, p[1].toFixed(3));
      });
    } else if (e.type === 'TEXT') {
      push(0, 'TEXT'); push(8, lay);
      push(10, e.x.toFixed(3)); push(20, e.y.toFixed(3)); push(30, '0.0');
      push(40, (e.h * 0.72).toFixed(2));
      if (e.rotDeg) { push(50, e.rotDeg.toFixed(1)); }
      push(1, toDxfUnicode(e.txt));
    }
  });
  push(0, 'ENDSEC');
  push(0, 'EOF');

  const blob = new Blob([out.join('\r\n')], { type: 'application/dxf;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = '6-04_箱籠固床工_各層可調反推平面標準圖.dxf';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

function exportCSV() {
  const P = getParams();
  const rows = computeQuantities(P);
  const lines = ['\uFEFF項次,工項名稱,單位,工程數量計算式(對應圖面尺寸),數量,設計規範備註'];
  rows.forEach(r => {
    lines.push(`${r.no},"${r.name}",${r.unit},"${r.formula}",${r.qty},"${r.note}"`);
  });
  const blob = new Blob([lines.join('\r\n')], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = '6-04_箱籠固床工_工程數量計算表.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// ============================================================================
// 10. 綁定事件
// ============================================================================
document.getElementById('p_W').addEventListener('input', () => {
  lastChangedSource = 'W';
  rebuildFrontLayerInputs(true);
  updateSidebarUI();
  renderCAD();
});
document.getElementById('p_N_bay').addEventListener('change', () => {
  lastChangedSource = 'N_bay';
  rebuildFrontLayerInputs(true);
  updateSidebarUI();
  renderCAD();
});
document.getElementById('p_B1').addEventListener('input', () => {
  lastChangedSource = 'B1';
  rebuildFrontLayerInputs(false);
  updateSidebarUI();
  renderCAD();
});
document.getElementById('p_N_layer').addEventListener('change', () => {
  rebuildFrontLayerInputs(true);
  updateSidebarUI();
  renderCAD();
});
document.getElementById('p_front_mode').addEventListener('change', () => {
  rebuildFrontLayerInputs(true);
  updateSidebarUI();
  renderCAD();
});
document.getElementById('btnResetFrontAuto').addEventListener('click', () => {
  rebuildFrontLayerInputs(true);
  updateSidebarUI();
  renderCAD();
});

['p_H1', 'p_side_mode', 'p_t', 'p_d_stone', 'p_k_gap', 'chkShowHoney', 'chkShowTable'].forEach(id => {
  const el = document.getElementById(id);
  el.addEventListener('input', () => { updateSidebarUI(); renderCAD(); });
  el.addEventListener('change', () => { updateSidebarUI(); renderCAD(); });
});

document.getElementById('btnPresetDxf').addEventListener('click', () => {
  lastChangedSource = 'N_bay';
  document.getElementById('p_N_layer').value = '2';
  document.getElementById('p_N_bay').value = '5';
  document.getElementById('p_B1').value = 200;
  document.getElementById('p_W').value = 1000;
  document.getElementById('p_H1').value = 200;
  document.getElementById('p_front_mode').value = 'inv_step';
  document.getElementById('p_side_mode').value = 'pair2';
  document.getElementById('p_t').value = 80;
  document.getElementById('p_d_stone').value = 38;
  rebuildFrontLayerInputs(true);
  updateSidebarUI();
  zoomToFit();
});

document.getElementById('btnPreset4Layer').addEventListener('click', () => {
  lastChangedSource = 'N_bay';
  document.getElementById('p_N_layer').value = '4';
  document.getElementById('p_N_bay').value = '6';
  document.getElementById('p_B1').value = 200;
  document.getElementById('p_W').value = 1200;
  document.getElementById('p_H1').value = 200;
  document.getElementById('p_front_mode').value = 'taper_down';
  document.getElementById('p_side_mode').value = 'pair2';
  document.getElementById('p_t').value = 80;
  document.getElementById('p_d_stone').value = 38;
  rebuildFrontLayerInputs(true);
  updateSidebarUI();
  zoomToFit();
});

document.getElementById('btnPreset6Layer').addEventListener('click', () => {
  lastChangedSource = 'N_bay';
  document.getElementById('p_N_layer').value = '6';
  document.getElementById('p_N_bay').value = '5';
  document.getElementById('p_B1').value = 200;
  document.getElementById('p_W').value = 1000;
  document.getElementById('p_H1').value = 200;
  document.getElementById('p_front_mode').value = 'inv_step';
  document.getElementById('p_side_mode').value = 'pair2';
  document.getElementById('p_t').value = 80;
  document.getElementById('p_d_stone').value = 38;
  rebuildFrontLayerInputs(true);
  updateSidebarUI();
  zoomToFit();
});

document.getElementById('btnZoomFit').addEventListener('click', () => zoomToFit());
document.getElementById('btnExportDXF').addEventListener('click', () => exportDXF());
document.getElementById('btnExportCSV').addEventListener('click', () => exportCSV());

rebuildFrontLayerInputs(true);
updateSidebarUI();
requestAnimationFrame(() => zoomToFit());

  // ---- v6.3 數量改由圖形計算＋補標註（or3fix.py）----

  function __A(p) { let s = 0; for (let i = 0; i < p.length; i++) { const a = p[i], b = p[(i + 1) % p.length]; s += a[0] * b[1] - b[0] * a[1]; } return Math.abs(s) / 2; }
  function __C(p) { let x = 0, y = 0; p.forEach(q => { x += q[0]; y += q[1]; }); return [x / p.length, y / p.length]; }
  function __notesWrap(HEADH, ROWH, TH, notes) {
    const __q = drawQuantityTableOnCanvas;
    drawQuantityTableOnCanvas = function (tx, ty, P) { const n0 = O.length; __q(tx, ty, P); let yb = Infinity; for (let i = n0; i < O.length; i++) { const o = O[i]; if (o.p) o.p.forEach(v => { yb = Math.min(yb, v[1]); }); else if (Number.isFinite(o.y)) yb = Math.min(yb, o.y); } if (!Number.isFinite(yb)) yb = ty - HEADH - ROWH * (computeQuantities(P).length + 1); const N = notes(P), y0 = yb - TH * 1.6;
      drawWorldText('數量計算依據（圖上未直接標示的推算值與係數）：', tx, y0, TH, '#fde047', 'left', 0, 'TABLE');
      N.forEach((s, i) => drawWorldText('・' + s, tx + TH, y0 - (i + 1) * TH * 1.7, TH * 0.92, '#fde047', 'left', 0, 'TABLE')); };
  }


  { const __P0 = getParams; getParams = function () { const P = __P0(), g = (id, d) => { const v = parseFloat(document.getElementById(id).value); return Number.isFinite(v) ? v : d; };
    const eq = String(document.getElementById('p_LReq').value) !== '0', extL = g('p_extL', 259); return Object.assign(P, { extL, extR: eq ? extL : g('p_extR', 259), kfill: g('p_kfill', 0.85) }); }; }
  { const __rc = renderCAD; renderCAD = function () { __rc(); try {
    const P = getParams(), L = computeDynamicLayout(P), a = L.frontMinX - P.extL, b = L.frontMaxX + P.extR;
    drawDimH(a, L.frontMinX, -P.t, -P.t, -P.t - 70, `左 ${P.extL}`, false); drawDimH(L.frontMaxX, b, -P.t, -P.t, -P.t - 70, `右 ${P.extR}`, false);
    drawDimH(a, b, -P.t, -P.t, -P.t - 150, `RC基礎台長 ${(b - a).toFixed(0)}（最寬層 ${L.frontMaxX - L.frontMinX} ＋ 左 ${P.extL} ＋ 右 ${P.extR}）`, false);
  } catch (e) { } }; }
  __notesWrap(52, 46, 22, P => [`箱籠內填塊石實積率 ${P.kfill}`, `RC 基礎台長＝最寬層 ${Math.max(P.maxFrontW, P.frontCounts[0] * P.B1)} ＋ 左 ${P.extL} ＋ 右 ${P.extR} cm（立面圖標註）`]);

  // ---- 圖元輸出（覆寫原工具的 Canvas 繪圖函式）----
function drawWorldLine(x1, y1, x2, y2, color = '#ffffff', width = 1.4, dash = [], layer = '0') { O.push({ k: 'L', p: [[x1, y1], [x2, y2]], c: color, w: width, d: dash || [], ly: layer }); }
function drawWorldPoly(pts, closed = true, strokeCol = '#ffffff', fillCol = null, width = 1.5, dash = [], layer = '0') { if (pts && pts.length >= 2) O.push({ k: 'P', p: pts.map(q => [q[0], q[1]]), c: strokeCol, w: width, f: fillCol, cl: !!closed, d: dash || [], ly: layer }); }
function drawWorldText(txt, wx, wy, worldH = 26, color = '#22d3ee', align = 'center', rotDeg = 0, layer = '!字') { const L = String(txt).split('\n'); L.forEach((s, i) => O.push({ k: 'T', x: wx, y: wy - (i - (L.length - 1) / 2) * worldH * 1.25, s, h: worldH, c: color, al: align, bl: 'middle', rot: (rotDeg || 0) * Math.PI / 180, ly: layer })); }
function drawHoneyHatchRect(xMin, yMin, w, h) {
  if (!el('chkShowHoney').checked) return; O.push({ k: 'CB', p: [[xMin, yMin], [xMin + w, yMin], [xMin + w, yMin + h], [xMin, yMin + h]] });
  const hexR = 16, dx = hexR * 1.5, dy = hexR * Math.sqrt(3);
  for (let wx = xMin - hexR; wx <= xMin + w + hexR; wx += dx) { const yOff = (Math.round((wx - xMin) / dx) % 2 === 0) ? 0 : dy * 0.5;
    for (let wy = yMin - hexR; wy <= yMin + h + hexR; wy += dy) { const cy = wy + yOff; O.push({ k: 'P', p: [[wx - hexR * 0.5, cy - dy * 0.5], [wx + hexR * 0.5, cy - dy * 0.5], [wx + hexR, cy], [wx + hexR * 0.5, cy + dy * 0.5]], c: 'rgba(232,121,249,0.55)', w: 1, f: null, cl: false, d: [], ly: 'HONEY' }); } }
  O.push({ k: 'CE' });
}
function drawArConcHatch(xMin, yMin, w, h) { __conc([[xMin, yMin], [xMin + w, yMin], [xMin + w, yMin + h], [xMin, yMin + h]]); }
function __conc(polyPts) {
  if (!polyPts || polyPts.length < 3) return; const xs = polyPts.map(p => p[0]), ys = polyPts.map(p => p[1]), x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  O.push({ k: 'CB', p: polyPts.map(p => [p[0], p[1]]) });
  for (let gx = x0; gx < x1; gx += 42) for (let gy = y0; gy < y1; gy += 42) [[[gx + 8, gy + 10], [gx + 17, gy + 6], [gx + 13, gy + 18]], [[gx + 26, gy + 24], [gx + 35, gy + 28], [gx + 29, gy + 36]]].forEach(t => O.push({ k: 'P', p: t, c: 'rgba(148,163,184,0.55)', w: 1, f: null, cl: true, d: [] }));
  O.push({ k: 'CE' });
}
  let LAST_L = null;   // v5.7：記錄原工具的視圖排版（各視圖原點），供平面／縱橫斷面取用原圖視圖
  { const __f = computeDynamicLayout; computeDynamicLayout = function (P) { return (LAST_L = __f(P)); }; }
  return {
    DEF, PR: [{"k": "p_N_layer", "nm": "箱籠疊砌層數 N_layer (1~10層)", "def": "2", "g": 0, "opt": [["1", "1 層"], ["2", "2 層 (原圖 H=400cm)"], ["3", "3 層"], ["4", "4 層"], ["5", "5 層"], ["6", "6 層"], ["7", "7 層"], ["8", "8 層"], ["9", "9 層"], ["10", "10 層"]]}, {"k": "p_W", "nm": "頂層固床工寬度 W (cm)", "def": "1000", "g": 0, "st": "100", "min": "200", "max": "6000"}, {"k": "p_N_bay", "nm": "頂層基準箱籠數 N_bay (顆)", "def": "5", "g": 0, "opt": [["2", "2 顆"], ["3", "3 顆"], ["4", "4 顆"], ["5", "5 顆 (原圖頂層5顆)"], ["6", "6 顆"], ["7", "7 顆"], ["8", "8 顆"], ["9", "9 顆"], ["10", "10 顆"], ["12", "12 顆"]]}, {"k": "p_B1", "nm": "單一箱籠寬度 B1 (cm)", "def": "200", "g": 0, "st": "20", "min": "100", "max": "400"}, {"k": "p_H1", "nm": "單一箱籠高度 H1 (cm)", "def": "200", "g": 0, "st": "20", "min": "50", "max": "300"}, {"k": "p_front_mode", "nm": "立面預設交錯公式", "def": "inv_step", "g": 0, "opt": [["inv_step", "上寬下窄交錯 (頂N/下N-1)"], ["taper_down", "由頂往底逐層減1顆 (倒梯形)"], ["pyr_expand", "加高底下每2層左右各+1顆"]]}, {"k": "p_side_mode", "nm": "側面加高時左右加寬模式", "def": "pair2", "g": 1, "opt": [["pair2", "底下每2層往左右各+1顆"], ["every1", "每往下一層+1顆交錯"]]}, {"k": "p_t", "nm": "混凝土基礎台厚度 t (cm)", "def": "80", "g": 1, "st": "10", "min": "30", "max": "200"}, {"k": "p_d_stone", "nm": "箱籠內填塊石平均粒徑 d_stone (cm)", "def": "38", "g": 1, "st": "2", "min": "20", "max": "70"}, {"k": "p_k_gap", "nm": "視圖相對安全間距係數 k_gap", "def": "1.0", "g": 1, "st": "0.1", "min": "0.6", "max": "2.5"}, {"k": "p_LReq", "nm": "左右兩側", "def": "1", "opt": [["1", "左右相同（右側跟左側）"], ["0", "左右分開"]], "g": 3}, {"k": "p_extL", "nm": "左側基礎台延伸 (cm)", "def": "259", "st": "10", "min": "0", "max": "600", "g": 3}, {"k": "p_extR", "nm": "右側基礎台延伸 (cm)", "def": "259", "st": "10", "min": "0", "max": "600", "g": 3}, {"k": "p_kfill", "nm": "箱籠填石實積率", "def": "0.85", "st": "0.01", "min": "0.6", "max": "1", "g": 3}], GT: ["1. 疊砌層數與立面各層箱籠數設定", "2. 側面圖加高擴展與 RC 基礎台 (B / t)", "3. 原圖符號說明與設計檢核", "左右分開與係數"], title: "水保標準圖參數化 CAD — 箱籠固床工 (6-04 各層獨立可調反推平面版)",
    run(R, opt) {
      RR = R || {}; OPT = Object.assign({}, opt || {}); O = [];
      try {
        customFrontCounts = Array.isArray(RR.__fc) && RR.__fc.length ? RR.__fc.map(v => Math.max(1, Math.round(+v) || 1)) : []; lastChangedSource = '';
        LAST_L = null; const P = getParams(), rows = computeQuantities(P);
        let checks = [];
        try { updateSidebarUI(); const t = el('normCheckList').innerHTML || ''; checks = [...t.matchAll(/<div class="check-item ?(warn)?">([\s\S]*?)<\/div>/g)].map(m => ({ ok: !m[1], text: m[2].replace(/^\s*[✔⚠]\s*/, '').replace(/<[^>]+>/g, '') })); } catch (e) { }
        if (OPT.draw) renderCAD();
        return { P, rows, checks, O, L: LAST_L };
      } finally { RR = null; }
    }
  };
})();
TCO_S['s0603'] = (function () {   // 水保標準圖參數化 CAD — 踏步式固床工 (圖號：0603-1 完整修復版)
  const DEF = {"p_W1": "1800", "p_N_high": "13", "p_b1": "100", "p_b2": "40", "p_h1": "40", "p_H": "360", "p_B_top": "160", "p_slope_m": "0.30", "p_c_crest": "80", "p_t_pc": "5", "p_k_gap": "1.0", "chkShowFormwork": true, "chkShowRefViews": true, "chkShowTable": true, "p_LReq": "1", "p_eL": "10", "p_eR": "10", "p_nwL": "0.3", "p_nwR": "0.3", "p_pce": "3", "p_tb1": "27", "p_tb2": "15", "p_tcr": "0.53", "p_cov": "20", "p_bs": "60", "p_rbe": "44", "p_rb": "45"};
  let RR = null, OPT = {}, O = [];
  const EL = {}, CTX = new Proxy({}, { get: (t, k) => (k in t ? t[k] : () => ({ width: 0 })), set: (t, k, v) => { t[k] = v; return true; } });
  const el = id => EL[id] || (EL[id] = { get value() { const v = RR && RR[id] !== undefined && RR[id] !== null && RR[id] !== '' ? RR[id] : DEF[id]; return v === undefined ? '' : String(v); }, set value(v) {},
    get checked() { return OPT[id] !== undefined ? !!OPT[id] : !!DEF[id]; }, set checked(v) {}, textContent: '', innerHTML: '', style: {}, width: 1600, height: 1000, classList: { add() {}, remove() {}, toggle() {} },
    addEventListener() {}, appendChild() {}, getContext() { return CTX; }, getBoundingClientRect: () => ({ left: 0, top: 0, width: 1600, height: 1000 }), parentElement: { getBoundingClientRect: () => ({ left: 0, top: 0, width: 1600, height: 1000 }) } });
  const document = { getElementById: el, querySelectorAll: () => [], querySelector: () => null, createElement: () => ({ click() {}, style: {}, className: '', innerHTML: '', appendChild() {}, querySelectorAll: () => [], querySelector: () => ({ addEventListener() {}, getAttribute: () => '0', value: '' }) }), body: { appendChild() {}, removeChild() {} } };
  const window = { addEventListener() {}, innerWidth: 1990, innerHeight: 1044, devicePixelRatio: 1 };
  const requestAnimationFrame = () => 0, alert = () => {};

let lastChanged = 'N_high';

function getParams() {
  let W1 = parseFloat(document.getElementById('p_W1').value) || 1800;
  let N_high = parseInt(document.getElementById('p_N_high').value) || 13;
  const b1 = parseFloat(document.getElementById('p_b1').value) || 100;
  const b2 = parseFloat(document.getElementById('p_b2').value) || 40;
  const h1 = parseFloat(document.getElementById('p_h1').value) || 40;
  const H = parseFloat(document.getElementById('p_H').value) || 360;

  const B_top = parseFloat(document.getElementById('p_B_top').value) || 160;
  const slope_m = parseFloat(document.getElementById('p_slope_m').value) || 0.30;
  const c_crest = parseFloat(document.getElementById('p_c_crest').value) || 80;
  const t_pc = parseFloat(document.getElementById('p_t_pc').value) || 5;
  const k_gap = parseFloat(document.getElementById('p_k_gap').value) || 1.0;

  const pitch = b1 + b2;
  if (lastChanged === 'W1') {
    N_high = Math.max(2, Math.round((W1 - 20 + b2) / pitch));
    document.getElementById('p_N_high').value = N_high;
  }
  const N_low = N_high - 1;
  const endExtra = 10;
  W1 = +(N_high * b1 + N_low * b2 + 2 * endExtra).toFixed(0);
  document.getElementById('p_W1').value = W1;

  const sideWingRun = +(0.30 * H).toFixed(1);
  const W2 = Math.max(100, +(W1 - 2 * sideWingRun).toFixed(0));

  const H_body = Math.max(100, H - 10);
  const B_bot = +(B_top + slope_m * H_body).toFixed(1);
  const B_pc = +(B_bot + 3.0).toFixed(1);

  const nVertBars = Math.max(3, Math.floor((H_body - 30) / 60) + 1);
  const nBotBars = Math.max(2, Math.floor((B_bot - 45) / 60) + 1);

  return {
    W1, W2, sideWingRun, N_high, N_low, b1, b2, endExtra, h1, H, H_body,
    B_top, slope_m, B_bot, B_pc, c_crest, t_pc, k_gap,
    nVertBars, nBotBars
  };
}

function getHighStepIntervals(P) {
  const list = [];
  let curX = 0;
  for (let i = 0; i < P.N_high; i++) {
    const w = P.b1 + (i === 0 ? P.eL : 0) + (i === P.N_high - 1 ? P.eR : 0);
    list.push({ x1: curX, x2: curX + w, w });
    curX += w + P.b2;
  }
  return list;
}

function computeQuantities(P) {
  const rows = [];
  const W_avg_m = ((P.W1 + P.W2) / 2) / 100;
  const H_body_m = P.H_body / 100;
  const B_avg_m = ((P.B_top + P.B_bot) / 2) / 100;

  const areaBody_m2 = +(B_avg_m * H_body_m).toFixed(3);
  const volBody_m3 = +(areaBody_m2 * W_avg_m).toFixed(2);
  rows.push({
    no: '1',
    name: `固床工本體混凝土 (210 kgf/cm², H=${P.H}cm)`,
    unit: 'm³',
    formula: `斷面[(${P.B_top}+${P.B_bot})/200×(${P.H_body}/100)] × 均寬[(${P.W1}+${P.W2})/200]`,
    qty: volBody_m3,
    note: `頂寬W1=${P.W1}cm, 底寬W2=${P.W2}cm`
  });

  const stepBaseL_m = (P.B_top - 32) / 100;
  const stepTopL_m = P.c_crest / 100;
  const stepArea_m2 = +(((stepBaseL_m + stepTopL_m) / 2) * (P.h1 / 100)).toFixed(3);
  const totalStepW_m = (P.N_high * P.b1 + 2 * P.endExtra) / 100;
  const volSteps_m3 = +(stepArea_m2 * totalStepW_m).toFixed(2);
  rows.push({
    no: '2',
    name: `高位踏步齒塊混凝土 (210 kgf/cm², 共${P.N_high}塊)`,
    unit: 'm³',
    formula: `單塊斷面 ${stepArea_m2}m² × 踏步總寬[(${P.N_high}×${P.b1}+20)/100]m`,
    qty: volSteps_m3,
    note: `踏步寬b1=${P.b1}cm, 通道b2=${P.b2}cm, 高h1=${P.h1}cm`
  });

  const volPC_m3 = +((P.B_pc / 100) * (P.t_pc / 100) * (P.W2 / 100)).toFixed(2);
  rows.push({
    no: '3',
    name: `打底混凝土 (140 kgf/cm², 厚 t=${P.t_pc}cm)`,
    unit: 'm³',
    formula: `底寬(${P.B_pc}/100) × 厚(${P.t_pc}/100) × 長(${P.W2}/100)`,
    qty: volPC_m3,
    note: `原圖標註 打底(140kg/cm²混凝土, t=${P.t_pc}cm)`
  });

  const totalConcrete = volBody_m3 + volSteps_m3;
  const rebarWeight_t = +(totalConcrete * 0.045).toFixed(2);
  rows.push({
    no: '4',
    name: `鋼筋加工及組立 (主筋L型與副筋 ${P.nVertBars}+${P.nBotBars}支)`,
    unit: 't',
    formula: `結構混凝土 (${volBody_m3}+${volSteps_m3})m³ × 0.045 t/m³`,
    qty: rebarWeight_t,
    note: `保護層最小厚度 7.5 cm (設計原則6)`
  });

  const formArea_m2 = +(((2 * H_body_m + (P.B_bot / 100)) * W_avg_m) + (P.N_high * 2 * (P.h1 / 100) * stepBaseL_m)).toFixed(2);
  rows.push({
    no: '5',
    name: `基礎模板 (含踏步側模與斜撐)`,
    unit: 'm²',
    formula: `前後立面與踏步側模面積合計`,
    qty: formArea_m2,
    note: `原圖標註 基礎模板`
  });

  return rows;
}

function updateSidebarUI() {
  const P = getParams();
  document.getElementById('drv_weir_info').textContent =
    `固床工底寬 W2 = ${P.W2} cm ｜ 高位踏步 ${P.N_high} 塊 + 低位通道 ${P.N_low} 處`;
  document.getElementById('drv_sec_info').textContent =
    `剖面底寬 B_bot = ${P.B_bot} cm ｜ 副筋分布 = 垂直${P.nVertBars}支 + 底部${P.nBotBars}支`;

  const checks = [
    {
      ok: P.b2 >= 30 && P.b2 <= 50,
      msg: `[設計原則3] 低位固床工通道淨寬 b2=${P.b2}cm ${P.b2 >= 30 && P.b2 <= 50 ? '介於 30～50cm 標準範圍' : '(建議介於 30～50cm)'}`
    },
    {
      ok: P.c_crest >= 50,
      msg: `[設計原則4] 高位固床工水流投影斷面寬 c=${P.c_crest}cm ${P.c_crest >= 50 ? '≧ 50cm (符合規定)' : '< 50cm (應不小於50cm)'}`
    },
    {
      ok: P.W2 < P.W1,
      msg: `[符號 W1 / W2] 頂寬 W1=${P.W1}cm、底寬 W2=${P.W2}cm，隨高度 H=${P.H}cm 維持兩側梯形嵌入`
    },
    {
      ok: P.t_pc >= 5,
      msg: `[打底層 t] 140kg/cm² 混凝土打底厚 t=${P.t_pc}cm (原圖預設 5cm)`
    }
  ];

  const box = document.getElementById('normCheckList');
  box.innerHTML = checks.map(c =>
    `<div class="check-item ${c.ok ? '' : 'warn'}">${c.ok ? '✔' : '⚠'} ${c.msg}</div>`
  ).join('');
}

const canvas = document.getElementById('cadCanvas');
const ctx = canvas.getContext('2d');
let camX = 1800, camY = 300, scale = 0.20;
let isDragging = false, dragStartX = 0, dragStartY = 0;
let dxfEntities = [];

function worldToScreen(wx, wy) {
  const cw = canvas.width || 1100;
  const ch = canvas.height || 750;
  return [
    cw / 2 + (wx - camX) * scale,
    ch / 2 - (wy - camY) * scale
  ];
}
function screenToWorld(sx, sy) {
  const cw = canvas.width || 1100;
  const ch = canvas.height || 750;
  return [
    camX + (sx - cw / 2) / scale,
    camY - (sy - ch / 2) / scale
  ];
}

function drawWorldLine(x1, y1, x2, y2, color = '#ffffff', width = 1.4, dash = [], layer = '0') {
  const [sx1, sy1] = worldToScreen(x1, y1);
  const [sx2, sy2] = worldToScreen(x2, y2);
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.setLineDash(dash);
  ctx.beginPath();
  ctx.moveTo(sx1, sy1);
  ctx.lineTo(sx2, sy2);
  ctx.stroke();
  ctx.restore();
  dxfEntities.push({ type: 'LINE', layer, x1, y1, x2, y2 });
}

function drawWorldPoly(pts, closed = true, strokeCol = '#ffffff', fillCol = null, width = 1.5, dash = [], layer = '0') {
  if (!pts || pts.length < 2) return;
  ctx.save();
  ctx.beginPath();
  pts.forEach((p, idx) => {
    const [sx, sy] = worldToScreen(p[0], p[1]);
    if (idx === 0) ctx.moveTo(sx, sy);
    else ctx.lineTo(sx, sy);
  });
  if (closed) ctx.closePath();
  if (fillCol) {
    ctx.fillStyle = fillCol;
    ctx.fill();
  }
  if (strokeCol) {
    ctx.strokeStyle = strokeCol;
    ctx.lineWidth = width;
    ctx.setLineDash(dash);
    ctx.stroke();
  }
  ctx.restore();
  dxfEntities.push({ type: 'POLY', layer, pts, closed });
}

function drawWorldCircle(cx, cy, r, strokeCol = '#ef4444', fillCol = '#ef4444', width = 1.1, layer = '鋼筋') {
  const [sx, sy] = worldToScreen(cx, cy);
  const sr = Math.max(1.8, r * scale);
  ctx.save();
  ctx.beginPath();
  ctx.arc(sx, sy, sr, 0, Math.PI * 2);
  if (fillCol) {
    ctx.fillStyle = fillCol;
    ctx.fill();
  }
  if (strokeCol) {
    ctx.strokeStyle = strokeCol;
    ctx.lineWidth = width;
    ctx.stroke();
  }
  ctx.restore();
}

function drawWorldText(txt, wx, wy, worldH = 26, color = '#22d3ee', align = 'center', rotDeg = 0, layer = '!字') {
  const [sx, sy] = worldToScreen(wx, wy);
  const px = Math.max(4.5, Math.min(28, worldH * scale));
  ctx.save();
  ctx.translate(sx, sy);
  if (rotDeg) ctx.rotate(-rotDeg * Math.PI / 180);
  ctx.font = `600 ${px}px "DFKai-SB", "Microsoft JhengHei", serif`;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  const lines = String(txt).split('\n');
  lines.forEach((line, idx) => {
    const dy = (idx - (lines.length - 1) / 2) * (px * 1.22);
    ctx.fillText(line, 0, dy);
  });
  ctx.restore();
  dxfEntities.push({ type: 'TEXT', layer, txt: String(txt).replace(/\n/g, ' '), x: wx, y: wy, h: worldH, rotDeg });
}

function drawLeader(pts, text, align = 'left', col = '#22d3ee') {
  for (let i = 0; i < pts.length - 1; i++) {
    drawWorldLine(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], col, 1.2, [], 'DIM');
  }
  const [x0, y0] = pts[0];
  const [x1, y1] = pts[1];
  const ang = Math.atan2(y1 - y0, x1 - x0);
  const aLen = 18;
  drawWorldPoly([
    [x0, y0],
    [x0 + aLen * Math.cos(ang + 0.25), y0 + aLen * Math.sin(ang + 0.25)],
    [x0 + aLen * Math.cos(ang - 0.25), y0 + aLen * Math.sin(ang - 0.25)]
  ], true, col, col, 1.0, [], 'DIM');
  const last = pts[pts.length - 1];
  const dx = align === 'left' ? 10 : -10;
  drawWorldText(text, last[0] + dx, last[1], 22, col, align, 0, 'DIM');
}

function getDimExtensionCoords(coordObj, dimPos) {
  const dir = dimPos >= coordObj ? 1 : -1;
  const minGapFromObj = 18.0;
  const overshoot = 15.0;
  return {
    extStart: coordObj + dir * minGapFromObj,
    extEnd: dimPos + dir * overshoot
  };
}

function drawDimH(x1, x2, yObj1, yObj2, yDim, text, textAbove = true) {
  const e1 = getDimExtensionCoords(yObj1, yDim);
  const e2 = getDimExtensionCoords(yObj2, yDim);
  drawWorldLine(x1, e1.extStart, x1, e1.extEnd, '#22d3ee', 1.2, [], 'DIM');
  drawWorldLine(x2, e2.extStart, x2, e2.extEnd, '#22d3ee', 1.2, [], 'DIM');
  drawWorldLine(x1, yDim, x2, yDim, '#22d3ee', 1.35, [], 'DIM');
  const s = Math.min(22, Math.abs(x2 - x1) * 0.22);
  const dir = x2 >= x1 ? 1 : -1;
  drawWorldPoly([[x1, yDim], [x1 + dir * s, yDim + s * 0.22], [x1 + dir * s, yDim - s * 0.22]], true, '#22d3ee', '#22d3ee', 1, [], 'DIM');
  drawWorldPoly([[x2, yDim], [x2 - dir * s, yDim + s * 0.22], [x2 - dir * s, yDim - s * 0.22]], true, '#22d3ee', '#22d3ee', 1, [], 'DIM');
  drawWorldText(text, (x1 + x2) / 2, textAbove ? yDim + 22 : yDim - 22, 24, '#22d3ee', 'center', 0, 'DIM');
}

function drawDimV(y1, y2, xObj1, xObj2, xDim, text, textLeftOfLine = true) {
  const e1 = getDimExtensionCoords(xObj1, xDim);
  const e2 = getDimExtensionCoords(xObj2, xDim);
  drawWorldLine(e1.extStart, y1, e1.extEnd, y1, '#22d3ee', 1.2, [], 'DIM');
  drawWorldLine(e2.extStart, y2, e2.extEnd, y2, '#22d3ee', 1.2, [], 'DIM');
  drawWorldLine(xDim, y1, xDim, y2, '#22d3ee', 1.35, [], 'DIM');
  const s = Math.min(20, Math.abs(y2 - y1) * 0.22);
  const dir = y2 >= y1 ? 1 : -1;
  drawWorldPoly([[xDim, y1], [xDim - s * 0.22, y1 + dir * s], [xDim + s * 0.22, y1 + dir * s]], true, '#22d3ee', '#22d3ee', 1, [], 'DIM');
  drawWorldPoly([[xDim, y2], [xDim - s * 0.22, y2 - dir * s], [xDim + s * 0.22, y2 - dir * s]], true, '#22d3ee', '#22d3ee', 1, [], 'DIM');
  drawWorldText(text, textLeftOfLine ? xDim - 22 : xDim + 22, (y1 + y2) / 2, 24, '#22d3ee', 'center', 90, 'DIM');
}

function drawArConcPolygon(polyPts) {
  ctx.save();
  ctx.beginPath();
  polyPts.forEach((p, idx) => {
    const [sx, sy] = worldToScreen(p[0], p[1]);
    if (idx === 0) ctx.moveTo(sx, sy);
    else ctx.lineTo(sx, sy);
  });
  ctx.closePath();
  ctx.clip();

  const xs = polyPts.map(p => p[0]);
  const ys = polyPts.map(p => p[1]);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);

  ctx.strokeStyle = 'rgba(148, 163, 184, 0.55)';
  ctx.fillStyle = 'rgba(148, 163, 184, 0.48)';
  ctx.lineWidth = 1.0;

  const step = 36;
  for (let gx = minX; gx < maxX; gx += step) {
    for (let gy = minY; gy < maxY; gy += step) {
      const t1 = [[gx + 6, gy + 8], [gx + 15, gy + 5], [gx + 11, gy + 15]];
      ctx.beginPath();
      t1.forEach((pt, i) => {
        const [sx, sy] = worldToScreen(pt[0], pt[1]);
        if (i === 0) ctx.moveTo(sx, sy);
        else ctx.lineTo(sx, sy);
      });
      ctx.closePath();
      ctx.stroke();
      [[gx + 4, gy + 20], [gx + 18, gy + 12], [gx + 26, gy + 24]].forEach(dot => {
        const [sx, sy] = worldToScreen(dot[0], dot[1]);
        ctx.fillRect(sx, sy, 1.5, 1.5);
      });
    }
  }
  ctx.restore();
}

function drawArSandPolygon(polyPts) {
  ctx.save();
  ctx.beginPath();
  polyPts.forEach((p, idx) => {
    const [sx, sy] = worldToScreen(p[0], p[1]);
    if (idx === 0) ctx.moveTo(sx, sy);
    else ctx.lineTo(sx, sy);
  });
  ctx.closePath();
  ctx.clip();

  const xs = polyPts.map(p => p[0]);
  const ys = polyPts.map(p => p[1]);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);

  ctx.fillStyle = 'rgba(250, 204, 21, 0.65)';
  const step = 18;
  for (let gx = minX; gx < maxX; gx += step) {
    for (let gy = minY; gy < maxY; gy += step) {
      [[gx + 3, gy + 4], [gx + 11, gy + 7], [gx + 7, gy + 14], [gx + 14, gy + 15]].forEach(dot => {
        const [sx, sy] = worldToScreen(dot[0], dot[1]);
        ctx.fillRect(sx, sy, 1.5, 1.5);
      });
    }
  }
  ctx.restore();
}

function drawBreakLineH(x1, x2, y) {
  const mid = (x1 + x2) / 2;
  const pts = [
    [x1, y],
    [mid - 35, y],
    [mid - 22, y + 18],
    [mid, y - 22],
    [mid + 22, y + 22],
    [mid + 35, y - 16],
    [mid + 45, y],
    [x2, y]
  ];
  drawWorldPoly(pts, false, '#22d3ee', null, 1.25, [], 'DIM');
}

// ============================================================================
// 4. 動態包絡盒相對間距防重疊排版引擎 (精確計算每一個視圖的左右包絡邊界)
// ============================================================================
function computeDynamicLayout(P, showRefViews) {
  const gapY = Math.max(650, (P.H * 0.9 + P.B_bot * 0.9) * P.k_gap);

  // 1) 左上【平面圖】Y 座標
  const planBotY = P.H + P.h1 + gapY;
  const planMidY = planBotY + (P.B_bot - P.B_top);
  const planTopY = planMidY + P.B_top;

  // 2) 中下【B-B' 剖面圖】：從立面圖右端 P.W1 往右退開安全距離 (預留 h1 標註空間)
  const secBB_X = P.W1 + Math.max(550, 480 * P.k_gap);
  // B-B' 剖面圖包含右側文字引線 ("210kg/cm²混凝土", "打底...") 的真實右邊界約為 secBB_X + P.B_bot + 520
  const secBB_RightBound = secBB_X + P.B_bot + 520;

  // 3) 中下【A-A' 剖面圖】：從 B-B' 剖面圖的右邊界再往右退開安全距離 (預留 A-A' 左上引線空間 380cm)
  const secAA_X = secBB_RightBound + Math.max(460, 420 * P.k_gap);
  const secAA_RightBound = secAA_X + P.B_bot + 520;

  // 4) 右側【設施平面/立面示意圖】：
  // 示意圖本身左半寬度為 (P.W1 * 0.85) / 2 + 護岸外擴 440cm
  const refHalfWidth = (P.W1 * 0.85) / 2 + 440;
  // 因此 refCenterX 必須位於 secAA_RightBound + 450 + refHalfWidth 處，保證 A-A' 剖面圖與藍色護岸示意圖 100% 絕不重疊！
  const refCenterX = secAA_RightBound + Math.max(480, 450 * P.k_gap) + refHalfWidth;
  const refPlanBotY = 180;
  const refElevBotY = -880;
  const refRightBound = refCenterX + refHalfWidth;

  // 5) 最右側【符號說明 (10E57)】位置
  const legendX = showRefViews ? (refRightBound + 260) : (secAA_RightBound + 260);
  const legendY = 580;

  // 6) 下方【工程數量計算式總表】位置
  const tableTopY = showRefViews ? Math.min(-520, refElevBotY - 280) : -520;
  const maxRightX = legendX + 720;

  return {
    planBotY, planMidY, planTopY,
    secBB_X, secAA_X,
    refCenterX, refPlanBotY, refElevBotY,
    legendX, legendY, tableTopY,
    bounds: {
      minX: -320,
      maxX: maxRightX,
      minY: tableTopY - 420,
      maxY: Math.max(planTopY + 300, showRefViews ? refPlanBotY + 2200 : 0)
    }
  };
}

function drawCrossSectionView(ox, P, isSectionAA, showFormwork) {
  const yBaseBot = 0;
  const yDamBot = P.t_pc;
  const yDamTop = P.H;

  const pcPts = [
    [ox, yDamBot],
    [ox, yBaseBot],
    [ox + P.B_pc, yBaseBot],
    [ox + P.B_pc, yDamBot]
  ];
  drawWorldPoly(pcPts, true, '#94a3b8', 'rgba(148,163,184,0.22)', 1.4, [], '0');

  if (showFormwork) {
    const yFormBot = yDamBot + 50;
    const yFormTop = yDamBot + P.H_body * 0.62;
    const wFormBot = P.B_bot - 18;
    const wFormTop = P.B_top + P.slope_m * (yDamTop - (yFormTop - 55)) + 32;

    const sandPoly = [
      [ox, yFormBot],
      [ox + wFormBot, yFormBot],
      [ox + wFormTop, yFormTop - 55],
      [ox + P.B_top * 0.65, yFormTop - 55],
      [ox + P.B_top * 0.35, yFormTop],
      [ox, yFormTop]
    ];
    drawArSandPolygon(sandPoly);
    drawWorldPoly([
      [ox, yFormTop],
      [ox + P.B_top * 0.35, yFormTop],
      [ox + P.B_top * 0.75, yFormTop - 55],
      [ox + wFormTop, yFormTop - 55]
    ], false, '#22d3ee', null, 1.3, [], 'DIM');

    drawWorldLine(ox - 25, yFormBot, ox + wFormBot + 15, yFormBot, '#64748b', 1.0, [6, 4], 'D-NEW');
    drawLeader([[ox + P.B_top + 20, yDamTop - 65], [ox + P.B_top * 0.48, yDamTop + 125]], '基礎模板', 'left');
    drawLeader([[ox + 2, yDamTop - 70], [ox + P.B_top * 0.48, yDamTop + 125]], '', 'left');
  }

  const damPts = [
    [ox + P.B_top, yDamTop],
    [ox, yDamTop],
    [ox, yDamBot],
    [ox + P.B_bot, yDamBot]
  ];
  drawArConcPolygon(damPts);
  drawWorldPoly(damPts, true, '#facc15', null, 1.85, [], '0');

  if (isSectionAA) {
    drawWorldPoly([
      [ox, yDamTop],
      [ox, yDamTop + P.h1],
      [ox + P.B_top, yDamTop + P.h1],
      [ox + P.B_top, yDamTop]
    ], false, '#ffffff', null, 1.3, [8, 5], '0');

    const xToothBot1 = ox + P.tb1;
    const xToothBot2 = ox + P.B_top - P.tb2;
    const xToothTop1 = ox + (P.B_top - P.c_crest) * P.tcr;
    const xToothTop2 = xToothTop1 + P.c_crest;
    const toothPts = [
      [xToothBot1, yDamTop],
      [xToothTop1, yDamTop + P.h1],
      [xToothTop2, yDamTop + P.h1],
      [xToothBot2, yDamTop]
    ];
    drawArConcPolygon(toothPts);
    drawWorldPoly(toothPts, true, '#ffffff', null, 1.65, [], '0');

    drawLeader([[ox + 25, yDamTop + P.h1 * 0.5], [ox - 75, yDamTop + P.h1 + 160]], '210kg/cm²混凝土', 'right');
  }

  const cover = P.cov;
  const rebarPts = [
    [ox + cover, yDamTop - cover],
    [ox + cover, yDamBot + cover + 5],
    [ox + cover + 5, yDamBot + cover],
    [ox + P.B_bot - P.rbe, yDamBot + cover]
  ];
  drawWorldPoly(rebarPts, false, '#ef4444', null, 2.0, [10, 4], '鋼筋');

  const stepVert = (yDamTop - yDamBot - 2 * cover - 6) / Math.max(1, P.nVertBars - 1);
  for (let i = 0; i < P.nVertBars; i++) {
    const ry = yDamBot + cover + 6 + i * stepVert;
    drawWorldCircle(ox + cover + 6, ry, 6.0, '#ef4444', '#ef4444', 1.0, '鋼筋');
  }
  const stepHoriz = (P.B_bot - P.rbe - cover - 6) / Math.max(1, P.nBotBars - 1);
  for (let j = 1; j < P.nBotBars; j++) {
    const rx = ox + cover + 6 + j * stepHoriz;
    drawWorldCircle(rx, yDamBot + cover + 6, 6.0, '#ef4444', '#ef4444', 1.0, '鋼筋');
  }

  const slopeMidX = ox + P.B_top + (P.B_bot - P.B_top) * 0.45 + 32;
  const slopeMidY = yDamBot + P.H_body * 0.62;
  const slopeDeg = -Math.atan2(P.H_body, P.B_bot - P.B_top) * 180 / Math.PI;
  drawWorldText(`1:${P.slope_m}`, slopeMidX, slopeMidY, 26, '#22d3ee', 'center', slopeDeg, 'DIM');

  drawLeader([[ox + cover + 2, yDamTop - 95], [ox + P.B_top + 65, yDamTop - 5]], '主筋', 'left');
  drawLeader([[ox + cover + 6, yDamBot + cover + 6 + stepVert * 2], [ox + P.B_top + 85, yDamTop - 105]], '副筋', 'left');
  drawLeader([[ox + P.B_top * 0.95, yDamBot + P.H_body * 0.25], [ox + P.B_bot + 45, yDamBot + P.H_body * 0.42]], '210kg/cm²混凝土', 'left');
  drawLeader([[ox + 28, yBaseBot], [ox + 65, yBaseBot - 70]], `打底\n(140kg/cm²混凝土，t=${P.t_pc}cm)`, 'left');

  const title = isSectionAA ? "A-A' 剖面圖" : "B-B' 剖面圖";
  drawWorldText(title, ox + P.B_bot * 0.45, yBaseBot - 210, 32, '#38bdf8', 'center', 0, '輔助線');
  drawWorldLine(ox + P.B_bot * 0.45 - 115, yBaseBot - 232, ox + P.B_bot * 0.45 + 115, yBaseBot - 232, '#22d3ee', 1.5, [], '輔助線');
}

function drawFacilitySchematicViews(P, L) {
  const { refCenterX, refPlanBotY, refElevBotY } = L;
  const sc = 0.85;
  const wTop = P.W1 * sc;
  const wBot = P.W2 * sc;
  const xL = refCenterX - wTop / 2;
  const xR = refCenterX + wTop / 2;

  const yDownstream = refPlanBotY;
  const yWeirBot = refPlanBotY + 350;
  const yWeirTop = yWeirBot + 148;
  const yUpstream = refPlanBotY + 1950;

  const bankW = 280;
  drawWorldPoly([[xL - bankW, yDownstream + 160], [xL, yDownstream + 160], [xL, yUpstream - 210], [xL - bankW, yUpstream - 210]], true, '#3b82f6', 'rgba(59,130,246,0.06)', 1.6, [], '0');
  drawWorldPoly([[xR, yDownstream + 160], [xR + bankW, yDownstream + 160], [xR + bankW, yUpstream - 210], [xR, yUpstream - 210]], true, '#3b82f6', 'rgba(59,130,246,0.06)', 1.6, [], '0');

  for (let s = 0; s < 10; s++) {
    const sy = yWeirTop + 80 + s * 70;
    const dx = s * 12;
    drawWorldLine(xL - bankW + 40, sy, xL - 30 - dx, sy, '#3b82f6', 1.2, [], '0');
    drawWorldLine(xR + 30 + dx, sy, xR + bankW - 40, sy, '#3b82f6', 1.2, [], '0');
  }
  drawWorldLine(xL, yDownstream, xL, yUpstream, '#3b82f6', 1.3, [10, 6], '0');
  drawWorldLine(xL + 90, yDownstream, xL + 90, yUpstream, '#3b82f6', 1.3, [10, 6], '0');
  drawWorldLine(xR, yDownstream, xR, yUpstream, '#3b82f6', 1.3, [10, 6], '0');
  drawWorldLine(xR - 90, yDownstream, xR - 90, yUpstream, '#3b82f6', 1.3, [10, 6], '0');

  drawBreakLineH(xL - 210, xL + 130, yDownstream);
  drawBreakLineH(xR - 130, xR + 210, yDownstream);
  drawBreakLineH(xL - 210, xL + 130, yUpstream);
  drawBreakLineH(xR - 130, xR + 210, yUpstream);

  drawWorldLine(xL, yWeirTop, xR, yWeirTop, '#ffffff', 1.7, [], '0');
  drawWorldLine(xL, yWeirBot, xR, yWeirBot, '#ffffff', 1.7, [], '0');
  drawWorldLine(xL + 90, yWeirBot - 170, xR - 90, yWeirBot - 170, '#ffffff', 1.5, [], '0');

  const steps = getHighStepIntervals(P);
  steps.forEach(st => {
    const sx1 = xL + st.x1 * sc;
    const sx2 = xL + st.x2 * sc;
    drawWorldPoly([[sx1, yWeirBot], [sx2, yWeirBot], [sx2, yWeirTop], [sx1, yWeirTop]], true, '#ffffff', 'rgba(255,255,255,0.12)', 1.4, [], '0');
  });

  if (steps.length >= 4) {
    const s2 = steps[2], s3 = steps[3];
    drawDimH(xL + s2.x1 * sc, xL + s2.x2 * sc, yWeirBot, yWeirBot, yWeirBot - 55, 'b1', false);
    drawDimH(xL + s2.x2 * sc, xL + s3.x1 * sc, yWeirBot, yWeirBot, yWeirBot - 55, 'b2', false);
  }

  const arrX = refCenterX + 30, arrY = yWeirTop + 650;
  drawWorldPoly([
    [arrX - 18, arrY + 90], [arrX + 18, arrY + 90],
    [arrX + 18, arrY], [arrX + 36, arrY],
    [arrX, arrY - 85],
    [arrX - 36, arrY], [arrX - 18, arrY]
  ], true, '#22d3ee', 'rgba(34,211,238,0.25)', 1.4, [], 'DIM');
  drawWorldText('流水方向', arrX + 115, arrY + 20, 32, '#22d3ee', 'left', 0, '座標');

  drawLeader([[xL + 60, yWeirTop + 720], [xL + 140, yWeirTop + 880]], '各類型護岸', 'left');
  drawLeader([[refCenterX - 120, (yWeirBot + yWeirTop) / 2], [refCenterX - 30, yWeirTop + 140], [refCenterX + 90, yWeirTop + 140]], '踏步式固床工', 'left');
  drawWorldText('設施平面示意圖', refCenterX, yUpstream + 110, 34, '#38bdf8', 'center', 0, '輔助線');

  const yElevBase = refElevBotY;
  const yElevWeirTop = yElevBase + P.H * sc;
  const yElevStepTop = yElevWeirTop + P.h1 * sc;
  const yElevBankTop = yElevBase + 880;

  const xBotL = xL + P.swL * sc;
  const xBotR = xR - P.swR * sc;

  drawWorldPoly([[xBotL, yElevBase], [xBotR, yElevBase], [xR, yElevWeirTop], [xL, yElevWeirTop]], true, '#ffffff', null, 1.7, [], '0');
  drawWorldLine(xL - 80, yElevWeirTop, xR + 80, yElevWeirTop, '#94a3b8', 1.1, [6, 4], 'PDESIGN_TXT');

  steps.forEach(st => {
    const sx1 = xL + st.x1 * sc;
    const sx2 = xL + st.x2 * sc;
    drawWorldPoly([[sx1, yElevWeirTop], [sx1, yElevStepTop], [sx2, yElevStepTop], [sx2, yElevWeirTop]], false, '#ffffff', 'rgba(255,255,255,0.12)', 1.5, [], '0');
  });
  drawDimV(yElevWeirTop, yElevStepTop, xL + steps[1].x1 * sc, xL + steps[1].x1 * sc, xL + steps[1].x1 * sc - 65, 'h1', true);

  drawWorldPoly([
    [xBotL, yElevBase],
    [xL - bankW - 140, yElevBase],
    [xL - bankW - 140, yElevBankTop],
    [xL - bankW - 60, yElevBankTop],
    [xL - 180, yElevStepTop],
    [xL, yElevStepTop],
    [xBotL, yElevBase]
  ], false, '#3b82f6', null, 1.6, [], '0');
  drawWorldPoly([
    [xBotR, yElevBase],
    [xR + bankW + 140, yElevBase],
    [xR + bankW + 140, yElevBankTop - 80],
    [xR + bankW + 60, yElevBankTop - 80],
    [xR + 180, yElevStepTop],
    [xR, yElevStepTop],
    [xBotR, yElevBase]
  ], false, '#3b82f6', null, 1.6, [], '0');

  const nBankSteps = 12;
  for (let k = 1; k <= nBankSteps; k++) {
    const frac = k / (nBankSteps + 1);
    const by = yElevStepTop + frac * (yElevBankTop - 80 - yElevStepTop);
    const shift = frac * (bankW - 120);
    drawWorldLine(xL - 180 - shift, by, xL - shift, by, '#3b82f6', 1.2, [], '0');
    drawWorldLine(xR + shift, by, xR + 180 + shift, by, '#3b82f6', 1.2, [], '0');
  }

  drawLeader([[xL - 150, yElevStepTop + 260], [xL - 70, yElevStepTop + 420]], '各類型護岸', 'left');
  drawLeader([[refCenterX - 110, yElevStepTop], [refCenterX - 20, yElevStepTop + 160], [refCenterX + 80, yElevStepTop + 160]], '踏步式固床工', 'left');
  drawWorldText('設施立面示意圖 (踏步式固床工圖)', refCenterX, yElevBase - 110, 34, '#38bdf8', 'center', 0, '輔助線');
}

function renderCAD() {
  const rect = canvas.parentElement.getBoundingClientRect();
  const cw = Math.max(800, rect.width || window.innerWidth - 405);
  const ch = Math.max(550, rect.height || window.innerHeight - 44);
  if (canvas.width !== cw || canvas.height !== ch) {
    canvas.width = cw;
    canvas.height = ch;
  }

  ctx.fillStyle = '#141923';
  ctx.fillRect(0, 0, cw, ch);
  dxfEntities = [];

  const P = getParams();
  const showFormwork = document.getElementById('chkShowFormwork').checked;
  const showRefViews = document.getElementById('chkShowRefViews').checked;
  const showTable = document.getElementById('chkShowTable').checked;
  const L = computeDynamicLayout(P, showRefViews);
  const steps = getHighStepIntervals(P);

  const xBot1 = P.swL;
  const xBot2 = P.W1 - P.swR;

  // 1) 左下【立面圖】
  drawWorldPoly([
    [xBot1, 0],
    [xBot2, 0],
    [P.W1, P.H],
    [0, P.H]
  ], true, '#facc15', 'rgba(250, 204, 21, 0.05)', 1.85, [], '0');

  steps.forEach(st => {
    drawWorldPoly([
      [st.x1, P.H],
      [st.x1, P.H + P.h1],
      [st.x2, P.H + P.h1],
      [st.x2, P.H]
    ], false, '#ffffff', 'rgba(255, 255, 255, 0.12)', 1.65, [], '0');
  });

  drawDimV(0, P.H, 0, 0, -125, `H = ${P.H} cm`, true);
  drawDimV(P.H, P.H + P.h1, P.W1, P.W1, P.W1 + 95, `h1 = ${P.h1}`, false);
  drawDimH(0, P.W1, P.H + P.h1, P.H + P.h1, P.H + P.h1 + 120, `W1 = ${P.W1} cm (高位踏步${P.N_high}塊 / 低位通道${P.N_low}處)`, true);
  drawDimH(xBot1, xBot2, 0, 0, -85, `W2 = ${P.W2} cm`, false);

  drawWorldText('立 面 圖', P.W1 / 2, -165, 34, '#38bdf8', 'center', 0, '輔助線');
  drawWorldLine(P.W1 / 2 - 95, -188, P.W1 / 2 + 95, -188, '#22d3ee', 1.5, [], '輔助線');

  // 2) 左上【平面圖】
  const { planBotY, planMidY, planTopY } = L;

  drawWorldPoly([
    [0, planTopY],
    [P.W1, planTopY],
    [P.W1, planMidY],
    [0, planMidY]
  ], true, '#facc15', 'rgba(250, 204, 21, 0.05)', 1.85, [], '0');

  drawWorldPoly([
    [0, planMidY],
    [xBot1, planBotY],
    [xBot2, planBotY],
    [P.W1, planMidY]
  ], false, '#facc15', 'rgba(250, 204, 21, 0.03)', 1.85, [], '0');

  steps.forEach((st, idx) => {
    if (idx > 0) drawWorldLine(st.x1, planMidY, st.x1, planTopY, '#ffffff', 1.5, [], '0');
    if (idx < steps.length - 1) drawWorldLine(st.x2, planMidY, st.x2, planTopY, '#ffffff', 1.5, [], '0');
    else {
      drawWorldLine(st.x1, planMidY, st.x1, planTopY, '#ffffff', 1.5, [], '0');
    }
  });
  if (steps.length > 0) {
    drawWorldLine(steps[0].x2, planMidY, steps[0].x2, planTopY, '#ffffff', 1.5, [], '0');
  }

  const bCutIdx = Math.min(2, P.N_low - 1);
  const xCutBB = steps[bCutIdx].x2 + P.b2 / 2;
  const aCutIdx = Math.min(5, P.N_high - 1);
  const xCutAA = (steps[aCutIdx].x1 + steps[aCutIdx].x2) / 2;

  [
    { x: xCutBB, labelTop: 'B', labelBot: "B'" },
    { x: xCutAA, labelTop: 'A', labelBot: "A'" }
  ].forEach(cut => {
    drawWorldLine(cut.x, planTopY - 25, cut.x, planTopY + 45, '#ef4444', 1.5, [], 'DIM');
    drawWorldLine(cut.x, planBotY - 45, cut.x, planBotY + 35, '#ef4444', 1.5, [], 'DIM');
    drawLeader([[cut.x + 85, planTopY + 45], [cut.x, planTopY + 45]], cut.labelTop, 'left', '#ef4444');
    drawLeader([[cut.x + 85, planBotY - 45], [cut.x, planBotY - 45]], cut.labelBot, 'left', '#ef4444');
  });

  // 將 b1 與 b2 標註錯開在不同高度或相隔兩格，避免字體重疊
  const lastFullIdx = Math.max(1, P.N_high - 2);
  drawDimH(steps[lastFullIdx].x1, steps[lastFullIdx].x2, planTopY, planTopY, planTopY + 60, `b1 = ${P.b1}`, true);
  if (P.N_low >= 2) {
    const chIdx = Math.max(0, P.N_low - 4);
    drawDimH(steps[chIdx].x2, steps[chIdx + 1].x1, planTopY, planTopY, planTopY + 60, `b2 = ${P.b2}`, true);
  }
  drawDimH(0, P.W1, planTopY, planTopY, planTopY + 155, `W1 = ${P.W1} cm`, true);
  drawDimH(xBot1, xBot2, planBotY, planBotY, planBotY - 125, `W2 = ${P.W2} cm`, false);

  drawWorldText('平 面 圖', P.W1 / 2, planBotY - 210, 34, '#38bdf8', 'center', 0, '輔助線');
  drawWorldLine(P.W1 / 2 - 95, planBotY - 232, P.W1 / 2 + 95, planBotY - 232, '#22d3ee', 1.5, [], '輔助線');

  // 3) 中下【B-B' 剖面圖 與 A-A' 剖面圖】
  drawCrossSectionView(L.secBB_X, P, false, showFormwork);
  drawCrossSectionView(L.secAA_X, P, true, showFormwork);

  // 4) 右側【設施平面/立面示意圖】
  if (showRefViews) {
    drawFacilitySchematicViews(P, L);
  }

  // 5) 最右側【符號說明】
  const legendLines = [
    '符號說明：',
    `W1  固床工頂寬 (${P.W1} cm)`,
    `W2  固床工底寬 (${P.W2} cm)`,
    `H   固床工高度 (${P.H} cm)`,
    `h1  踏步高度 (${P.h1} cm)`,
    `b1  踏步寬度 (${P.b1} cm，共 ${P.N_high} 塊)`,
    `b2  踏步淨寬 (${P.b2} cm，共 ${P.N_low} 處低位通道)`
  ];
  legendLines.forEach((line, i) => {
    drawWorldText(
      line,
      L.legendX,
      L.legendY - i * 65,
      i === 0 ? 34 : 28,
      '#22d3ee',
      'left',
      0,
      '!字'
    );
  });

  // 6) 下方【工程數量計算式總表】
  if (showTable) {
    drawQuantityTableOnCanvas(0, L.tableTopY, P);
  }
}

function drawQuantityTableOnCanvas(tx, ty, P) {
  const rows = computeQuantities(P);
  const colW = [95, 520, 105, 820, 155, 480];
  const totalW = colW.reduce((a, b) => a + b, 0);
  const rowH = 62;
  const headH = 70;

  drawWorldPoly([[tx, ty], [tx + totalW, ty], [tx + totalW, ty - headH], [tx, ty - headH]], true, '#38bdf8', 'rgba(2,132,199,0.28)', 1.5, [], 'TABLE');
  drawWorldText('踏步式固床工 (圖號：0603-1) — 參數化工程數量計算式總表 (圖面尺寸 W1, W2, H, h1, b1, b2 100% 對照)', tx + totalW / 2, ty - headH / 2, 26, '#38bdf8', 'center', 0, 'TABLE');

  const headers = ['項次', '工 項 名 稱', '單位', '工程數量計算式 (對應圖面標註 W1, W2, H, h1, b1, b2, t)', '數量', '設計規範備註'];
  let curY = ty - headH;
  drawWorldPoly([[tx, curY], [tx + totalW, curY], [tx + totalW, curY - rowH], [tx, curY - rowH]], true, '#475569', 'rgba(30,41,59,0.85)', 1.2, [], 'TABLE');

  let cx = tx;
  headers.forEach((h, i) => {
    drawWorldText(h, cx + colW[i] / 2, curY - rowH / 2, 22, '#fde047', 'center', 0, 'TABLE');
    cx += colW[i];
    if (i < headers.length - 1) drawWorldLine(cx, ty - headH, cx, curY - rowH * (rows.length + 1), '#334155', 1.0, [], 'TABLE');
  });

  curY -= rowH;
  rows.forEach((r, idx) => {
    const bg = idx % 2 === 0 ? 'rgba(15,23,42,0.75)' : 'rgba(30,41,59,0.55)';
    drawWorldPoly([[tx, curY], [tx + totalW, curY], [tx + totalW, curY - rowH], [tx, curY - rowH]], true, '#334155', bg, 1.0, [], 'TABLE');
    let rx = tx;
    const vals = [r.no, r.name, r.unit, r.formula, String(r.qty), r.note];
    vals.forEach((v, i) => {
      const align = (i === 1 || i === 3 || i === 5) ? 'left' : 'center';
      const px = align === 'left' ? rx + 18 : rx + colW[i] / 2;
      const col = i === 4 ? '#4ade80' : (i === 3 ? '#67e8f9' : '#e2e8f0');
      drawWorldText(v, px, curY - rowH / 2, 20, col, align, 0, 'TABLE');
      rx += colW[i];
    });
    curY -= rowH;
  });
}

function zoomToFit() {
  const rect = canvas.parentElement.getBoundingClientRect();
  const cw = Math.max(800, rect.width || window.innerWidth - 405);
  const ch = Math.max(550, rect.height || window.innerHeight - 44);
  canvas.width = cw;
  canvas.height = ch;

  const P = getParams();
  const showRefViews = document.getElementById('chkShowRefViews').checked;
  const L = computeDynamicLayout(P, showRefViews);
  const { minX, maxX, minY, maxY } = L.bounds;
  camX = (minX + maxX) / 2;
  camY = (minY + maxY) / 2;
  const scaleX = (cw * 0.90) / (maxX - minX);
  const scaleY = (ch * 0.90) / (maxY - minY);
  scale = Math.min(scaleX, scaleY);
  renderCAD();
}

canvas.addEventListener('mousedown', e => {
  if (e.button !== 0) return;
  isDragging = true;
  dragStartX = e.clientX;
  dragStartY = e.clientY;
});
window.addEventListener('mousemove', e => {
  const rect = canvas.getBoundingClientRect();
  const [wx, wy] = screenToWorld(e.clientX - rect.left, e.clientY - rect.top);
  document.getElementById('hud-coords').textContent =
    `世界座標 (cm): X=${wx.toFixed(1)}, Y=${wy.toFixed(1)} | 縮放=${(scale * 100).toFixed(0)}% | 滾輪縮放・左鍵平移・雙擊置中`;
  if (!isDragging) return;
  const dx = e.clientX - dragStartX;
  const dy = e.clientY - dragStartY;
  dragStartX = e.clientX;
  dragStartY = e.clientY;
  camX -= dx / scale;
  camY += dy / scale;
  renderCAD();
});
window.addEventListener('mouseup', () => { isDragging = false; });

canvas.addEventListener('wheel', e => {
  e.preventDefault();
  const rect = canvas.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  const my = e.clientY - rect.top;
  const [wxBefore, wyBefore] = screenToWorld(mx, my);
  const factor = e.deltaY < 0 ? 1.12 : 0.89;
  scale = Math.max(0.015, Math.min(8.0, scale * factor));
  const [wxAfter, wyAfter] = screenToWorld(mx, my);
  camX += (wxBefore - wxAfter);
  camY += (wyBefore - wyAfter);
  renderCAD();
}, { passive: false });

canvas.addEventListener('dblclick', () => zoomToFit());
window.addEventListener('resize', () => renderCAD());

function toDxfUnicode(str) {
  return String(str).split('').map(ch => {
    const code = ch.charCodeAt(0);
    return code > 127 ? `\\U+${code.toString(16).toUpperCase().padStart(4, '0')}` : ch;
  }).join('');
}

function exportDXF() {
  renderCAD();
  const out = [];
  const push = (c, v) => { out.push(String(c)); out.push(String(v)); };

  push(0, 'SECTION'); push(2, 'HEADER');
  push(9, '$ACADVER'); push(1, 'AC1015');
  push(9, '$INSUNITS'); push(70, 5);
  push(0, 'ENDSEC');

  push(0, 'SECTION'); push(2, 'ENTITIES');
  dxfEntities.forEach(e => {
    const lay = toDxfUnicode(e.layer || '0');
    if (e.type === 'LINE') {
      push(0, 'LINE'); push(8, lay);
      push(10, e.x1.toFixed(3)); push(20, e.y1.toFixed(3)); push(30, '0.0');
      push(11, e.x2.toFixed(3)); push(21, e.y2.toFixed(3)); push(31, '0.0');
    } else if (e.type === 'POLY') {
      push(0, 'LWPOLYLINE'); push(8, lay);
      push(90, e.pts.length);
      push(70, e.closed ? 1 : 0);
      e.pts.forEach(p => {
        push(10, p[0].toFixed(3));
        push(20, p[1].toFixed(3));
      });
    } else if (e.type === 'TEXT') {
      push(0, 'TEXT'); push(8, lay);
      push(10, e.x.toFixed(3)); push(20, e.y.toFixed(3)); push(30, '0.0');
      push(40, (e.h * 0.72).toFixed(2));
      if (e.rotDeg) { push(50, e.rotDeg.toFixed(1)); }
      push(1, toDxfUnicode(e.txt));
    }
  });
  push(0, 'ENDSEC');
  push(0, 'EOF');

  const blob = new Blob([out.join('\r\n')], { type: 'application/dxf;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = '0603-1_踏步式固床工_完整修復標準圖.dxf';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

function exportCSV() {
  const P = getParams();
  const rows = computeQuantities(P);
  const lines = ['\uFEFF項次,工項名稱,單位,工程數量計算式(對應圖面尺寸),數量,設計規範備註'];
  rows.forEach(r => {
    lines.push(`${r.no},"${r.name}",${r.unit},"${r.formula}",${r.qty},"${r.note}"`);
  });
  const blob = new Blob([lines.join('\r\n')], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = '0603-1_踏步式固床工_工程數量計算表.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

document.getElementById('p_W1').addEventListener('input', () => {
  lastChanged = 'W1';
  updateSidebarUI();
  renderCAD();
});
document.getElementById('p_N_high').addEventListener('input', () => {
  lastChanged = 'N_high';
  updateSidebarUI();
  renderCAD();
});

['p_b1', 'p_b2', 'p_h1', 'p_H', 'p_B_top', 'p_slope_m', 'p_c_crest', 'p_t_pc', 'p_k_gap', 'chkShowFormwork', 'chkShowRefViews', 'chkShowTable'].forEach(id => {
  const el = document.getElementById(id);
  el.addEventListener('input', () => { updateSidebarUI(); renderCAD(); });
  el.addEventListener('change', () => { updateSidebarUI(); renderCAD(); });
});

document.getElementById('btnPresetDxf').addEventListener('click', () => {
  lastChanged = 'N_high';
  document.getElementById('p_N_high').value = 13;
  document.getElementById('p_b1').value = 100;
  document.getElementById('p_b2').value = 40;
  document.getElementById('p_h1').value = 40;
  document.getElementById('p_H').value = 360;
  document.getElementById('p_B_top').value = 160;
  document.getElementById('p_slope_m').value = 0.30;
  document.getElementById('p_c_crest').value = 80;
  document.getElementById('p_t_pc').value = 5;
  updateSidebarUI();
  zoomToFit();
});

document.getElementById('btnPresetWide').addEventListener('click', () => {
  lastChanged = 'N_high';
  document.getElementById('p_N_high').value = 24;
  document.getElementById('p_b1').value = 100;
  document.getElementById('p_b2').value = 40;
  document.getElementById('p_h1').value = 40;
  document.getElementById('p_H').value = 360;
  document.getElementById('p_B_top').value = 160;
  document.getElementById('p_slope_m').value = 0.30;
  document.getElementById('p_c_crest').value = 80;
  document.getElementById('p_t_pc').value = 5;
  updateSidebarUI();
  zoomToFit();
});

document.getElementById('btnPresetLow').addEventListener('click', () => {
  lastChanged = 'N_high';
  document.getElementById('p_N_high').value = 13;
  document.getElementById('p_b1').value = 100;
  document.getElementById('p_b2').value = 40;
  document.getElementById('p_h1').value = 40;
  document.getElementById('p_H').value = 260;
  document.getElementById('p_B_top').value = 140;
  document.getElementById('p_slope_m').value = 0.30;
  document.getElementById('p_c_crest').value = 80;
  document.getElementById('p_t_pc').value = 5;
  updateSidebarUI();
  zoomToFit();
});

document.getElementById('btnZoomFit').addEventListener('click', () => zoomToFit());
document.getElementById('btnExportDXF').addEventListener('click', () => exportDXF());
document.getElementById('btnExportCSV').addEventListener('click', () => exportCSV());

updateSidebarUI();
requestAnimationFrame(() => zoomToFit());

  // ---- v6.3 數量改由圖形計算＋補標註（or3fix.py）----

  function __A(p) { let s = 0; for (let i = 0; i < p.length; i++) { const a = p[i], b = p[(i + 1) % p.length]; s += a[0] * b[1] - b[0] * a[1]; } return Math.abs(s) / 2; }
  function __C(p) { let x = 0, y = 0; p.forEach(q => { x += q[0]; y += q[1]; }); return [x / p.length, y / p.length]; }
  function __notesWrap(HEADH, ROWH, TH, notes) {
    const __q = drawQuantityTableOnCanvas;
    drawQuantityTableOnCanvas = function (tx, ty, P) { const n0 = O.length; __q(tx, ty, P); let yb = Infinity; for (let i = n0; i < O.length; i++) { const o = O[i]; if (o.p) o.p.forEach(v => { yb = Math.min(yb, v[1]); }); else if (Number.isFinite(o.y)) yb = Math.min(yb, o.y); } if (!Number.isFinite(yb)) yb = ty - HEADH - ROWH * (computeQuantities(P).length + 1); const N = notes(P), y0 = yb - TH * 1.6;
      drawWorldText('數量計算依據（圖上未直接標示的推算值與係數）：', tx, y0, TH, '#fde047', 'left', 0, 'TABLE');
      N.forEach((s, i) => drawWorldText('・' + s, tx + TH, y0 - (i + 1) * TH * 1.7, TH * 0.92, '#fde047', 'left', 0, 'TABLE')); };
  }


  const __g3 = (id, d) => { const v = parseFloat(document.getElementById(id).value); return Number.isFinite(v) ? v : d; };
  getParams = function () {   // v6.3：原工具寫死值改參數（預設＝原圖值）；左右兩端分開
    const W1in = __g3('p_W1', 1800), b1 = __g3('p_b1', 100), b2 = __g3('p_b2', 40), h1 = __g3('p_h1', 40), H = __g3('p_H', 360);
    const B_top = __g3('p_B_top', 160), slope_m = __g3('p_slope_m', 0.3), c_crest = __g3('p_c_crest', 80), t_pc = __g3('p_t_pc', 5), k_gap = __g3('p_k_gap', 1);
    const eq = String(document.getElementById('p_LReq').value) !== '0';
    const eL = __g3('p_eL', 10), eR = eq ? eL : __g3('p_eR', 10), nwL = __g3('p_nwL', 0.3), nwR = eq ? nwL : __g3('p_nwR', 0.3);
    const pitch = b1 + b2; let N_high = Math.max(2, Math.round(__g3('p_N_high', 13)));
    if (lastChanged === 'W1') N_high = Math.max(2, Math.round((W1in - eL - eR + b2) / pitch));
    const N_low = N_high - 1, W1 = +(N_high * b1 + N_low * b2 + eL + eR).toFixed(1);
    const swL = +(nwL * H).toFixed(1), swR = +(nwR * H).toFixed(1), W2 = Math.max(100, +(W1 - swL - swR).toFixed(1));
    const H_body = Math.max(50, H - t_pc), B_bot = +(B_top + slope_m * H_body).toFixed(1), pce = __g3('p_pce', 3), B_pc = +(B_bot + pce).toFixed(1);
    const cov = __g3('p_cov', 20), bs = __g3('p_bs', 60), rbe = __g3('p_rbe', 44);
    const nVertBars = Math.max(3, Math.floor((H_body - cov - 10) / bs) + 1), nBotBars = Math.max(2, Math.floor((B_bot - rbe - 1) / bs) + 1);
    return { W1, W2, sideWingRun: (swL + swR) / 2, swL, swR, nwL, nwR, eq, eL, eR, endExtra: (eL + eR) / 2, N_high, N_low, b1, b2, h1, H, H_body, B_top, slope_m, B_bot, B_pc, pce, c_crest, t_pc, k_gap, nVertBars, nBotBars,
      cov, bs, rbe, tb1: __g3('p_tb1', 27), tb2: __g3('p_tb2', 15), tcr: __g3('p_tcr', 0.53), rb: __g3('p_rb', 45) };
  };
  const __tooth = P => { const x1 = P.tb1, x2 = P.B_top - P.tb2, t1 = (P.B_top - P.c_crest) * P.tcr, t2 = t1 + P.c_crest; return [[x1, 0], [t1, P.h1], [t2, P.h1], [x2, 0]]; };
  const __geo = P => {   // 圖面幾何（cm）：z 自打底底面起算；本體 z＝t_pc～H
    const b = z => P.B_bot - (P.B_bot - P.B_top) * (z - P.t_pc) / P.H_body, w = z => P.W2 + (P.W1 - P.W2) * z / P.H;
    const z0 = P.t_pc, z1 = P.H, zm = (z0 + z1) / 2, V = P.H_body / 6 * (b(z0) * w(z0) + 4 * b(zm) * w(zm) + b(z1) * w(z1));
    const Asec = (P.B_top + P.B_bot) / 2 * P.H_body, Aup = P.H_body * (w(z0) + w(z1)) / 2, T = __tooth(P), at = __A(T), Ws = P.N_high * P.b1 + P.eL + P.eR;
    const e1 = Math.hypot(T[1][0] - T[0][0], T[1][1] - T[0][1]), e2 = Math.hypot(T[3][0] - T[2][0], T[3][1] - T[2][1]);
    return { b, w, V, Asec, Aup, T, at, Ws, e1, e2, wb: w(z0), kS: Math.hypot(1, P.slope_m) };
  };
  computeQuantities = function (P) {
    const G = __geo(P), rows = [], f = (v, n) => (+v).toFixed(n === undefined ? 2 : n);
    const v1 = G.V / 1e6, v2 = G.at * G.Ws / 1e6, v3 = P.B_pc * P.t_pc * P.W2 / 1e6;
    rows.push({ no: '1', name: `固床工本體混凝土 (210 kgf/cm², H=${P.H}cm)`, unit: 'm³', formula: `∫b·w dz：b ${f(G.b(P.t_pc), 1)}→${P.B_top}、w ${f(G.wb, 1)}→${P.W1}、高 ${P.H_body}`, qty: +v1.toFixed(2), note: `斷面積 ${f(G.Asec / 1e4, 3)} m²；本體立面積 ${f(G.Aup / 1e4, 3)} m²` });
    rows.push({ no: '2', name: `高位踏步齒塊混凝土 (210 kgf/cm², 共${P.N_high}塊)`, unit: 'm³', formula: `齒塊斷面 ${f(G.at / 1e4, 4)} m² × 踏步總寬 ${f(G.Ws / 100)} m`, qty: +v2.toFixed(2), note: `踏步寬b1=${P.b1}cm, 通道b2=${P.b2}cm, 高h1=${P.h1}cm` });
    rows.push({ no: '3', name: `打底混凝土 (140 kgf/cm², 厚 t=${P.t_pc}cm)`, unit: 'm³', formula: `底寬 (B_bot ${P.B_bot}+${P.pce})/100 × 厚 ${P.t_pc}/100 × 長 W2 ${P.W2}/100`, qty: +v3.toFixed(2), note: `原圖標註 打底(140kg/cm²混凝土, t=${P.t_pc}cm)` });
    rows.push({ no: '4', name: `鋼筋加工及組立 (主筋L型與副筋 ${P.nVertBars}+${P.nBotBars}支)`, unit: 't', formula: `原圖無鋼筋表 → 結構混凝土 (${f(v1)}+${f(v2)}) m³ × ${P.rb} kg/m³ 估算`, qty: +((v1 + v2) * P.rb / 1000).toFixed(3), note: `保護層最小厚度 7.5 cm (設計原則6)` });
    const fUp = G.Aup / 1e4, fDn = fUp * G.kS, fSt = (2 * P.N_high * G.at + (G.e1 + G.e2) * G.Ws) / 1e4;
    rows.push({ no: '5', name: `基礎模板 (上下游面與踏步模板)`, unit: 'm²', formula: `上游面 ${f(fUp)}＋下游斜面 ${f(fDn)}＋踏步 ${f(fSt)}（明細見註記）`, qty: +(fUp + fDn + fSt).toFixed(2), note: `兩端翼面嵌入護岸不計` });
    return rows;
  };
  { const __rc = renderCAD; renderCAD = function () { __rc(); try {
    const P = getParams(), L = computeDynamicLayout(P, el('chkShowRefViews').checked), G = __geo(P), f = (v, n) => (+v).toFixed(n === undefined ? 2 : n);
    drawDimH(0, P.swL, 0, 0, -60, `${P.swL}`, false); drawDimH(P.W1 - P.swR, P.W1, 0, 0, -60, `${P.swR}`, false);
    drawWorldText(`左翼 1:${P.nwL}`, P.swL / 2 - 30, P.H * 0.45, 22, '#22d3ee', 'right', 0, 'DIM'); drawWorldText(`右翼 1:${P.nwR}`, P.W1 - P.swR / 2 + 30, P.H * 0.45, 22, '#22d3ee', 'left', 0, 'DIM');
    drawWorldText(`本體立面積（z=${P.t_pc}~${P.H}）＝${f(G.Aup / 1e4, 3)} m²；本體體積 V＝${f(G.V / 1e6)} m³`, P.W1 / 2, P.H * 0.5, 24, '#fde047', 'center', 0, 'DIM');
    drawWorldText(`斷面積 A＝(${P.B_top}+${P.B_bot})/2×${P.H_body}＝${f(G.Asec / 1e4, 3)} m²`, L.secBB_X + P.B_bot / 2, -150, 22, '#fde047', 'center', 0, 'DIM');
    drawWorldText(`齒塊斷面積 a＝${f(G.at / 1e4, 4)} m²`, L.secAA_X + P.B_bot / 2, -150, 22, '#fde047', 'center', 0, 'DIM');
    drawDimV(0, P.t_pc, L.secBB_X + P.B_pc, L.secBB_X + P.B_pc, L.secBB_X + P.B_pc + 40, `${P.t_pc}`, false);
  } catch (e) { } }; }
  __notesWrap(48, 40, 20, P => { const G = __geo(P); return [
    `本體體積＝∫斷面寬 b(z)×立面寬 w(z) dz（兩者皆線性，Simpson 公式精確）；踏步總寬＝${P.N_high}×${P.b1}＋左${P.eL}＋右${P.eR}`,
    `本體＝斷面(頂寬 ${P.B_top}、下游坡 1:${P.slope_m})沿立面梯形(頂 W1 ${P.W1}、底 W2 ${P.W2}，左翼 1:${P.nwL}、右翼 1:${P.nwR})積分；本體高 H−t＝${P.H_body} cm`,
    `W1＝${P.N_high}×${P.b1}＋${P.N_low}×${P.b2}＋左端 ${P.eL}＋右端 ${P.eR}；齒塊底內縮 上游 ${P.tb1}、下游 ${P.tb2} cm，頂寬 c 位置比 ${P.tcr}`,
    `模板：上游直立面＝本體立面積；下游斜面＝×√(1+${P.slope_m}²)；踏步＝2×${P.N_high}×齒塊斷面 ${(G.at / 1e4).toFixed(4)}＋(前後斜邊 ${(G.e1 / 100).toFixed(3)}+${(G.e2 / 100).toFixed(3)})×踏步總寬 ${(G.Ws / 100).toFixed(2)}；兩端翼面嵌入護岸不計`,
    `打底寬＝B_bot＋${P.pce} cm；鋼筋：原圖無鋼筋表，以 ${P.rb} kg/m³ 估算（主筋保護層 ${P.cov}、配置間距 ${P.bs} cm）`]; });

  // ---- 圖元輸出（覆寫原工具的 Canvas 繪圖函式）----
function drawWorldLine(x1, y1, x2, y2, color = '#ffffff', width = 1.4, dash = [], layer = '0') { O.push({ k: 'L', p: [[x1, y1], [x2, y2]], c: color, w: width, d: dash || [], ly: layer }); }
function drawWorldPoly(pts, closed = true, strokeCol = '#ffffff', fillCol = null, width = 1.5, dash = [], layer = '0') { if (pts && pts.length >= 2) O.push({ k: 'P', p: pts.map(q => [q[0], q[1]]), c: strokeCol, w: width, f: fillCol, cl: !!closed, d: dash || [], ly: layer }); }
function drawWorldCircle(cx, cy, r, strokeCol = '#ef4444', fillCol = '#ef4444', width = 1.1, layer = '鋼筋') { O.push({ k: 'C', x: cx, y: cy, r, c: strokeCol, f: fillCol, w: width, ly: layer }); }
function drawWorldText(txt, wx, wy, worldH = 26, color = '#22d3ee', align = 'center', rotDeg = 0, layer = '!字') { const L = String(txt).split('\n'); L.forEach((s, i) => O.push({ k: 'T', x: wx, y: wy - (i - (L.length - 1) / 2) * worldH * 1.25, s, h: worldH, c: color, al: align, bl: 'middle', rot: (rotDeg || 0) * Math.PI / 180, ly: layer })); }
function drawArConcPolygon(polyPts) { __conc(polyPts); }
function __conc(polyPts) {
  if (!polyPts || polyPts.length < 3) return; const xs = polyPts.map(p => p[0]), ys = polyPts.map(p => p[1]), x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  O.push({ k: 'CB', p: polyPts.map(p => [p[0], p[1]]) });
  for (let gx = x0; gx < x1; gx += 42) for (let gy = y0; gy < y1; gy += 42) [[[gx + 8, gy + 10], [gx + 17, gy + 6], [gx + 13, gy + 18]], [[gx + 26, gy + 24], [gx + 35, gy + 28], [gx + 29, gy + 36]]].forEach(t => O.push({ k: 'P', p: t, c: 'rgba(148,163,184,0.55)', w: 1, f: null, cl: true, d: [] }));
  O.push({ k: 'CE' });
}
  let LAST_L = null;   // v5.7：記錄原工具的視圖排版（各視圖原點），供平面／縱橫斷面取用原圖視圖
  { const __f = computeDynamicLayout; computeDynamicLayout = function (P) { return (LAST_L = __f(P)); }; }
  return {
    DEF, PR: [{"k": "p_W1", "nm": "固床工頂寬 W1 (cm)", "def": "1800", "g": 0, "st": "140", "min": "500", "max": "8000"}, {"k": "p_N_high", "nm": "高位踏步塊數 N_high (塊)", "def": "13", "g": 0, "st": "1", "min": "2", "max": "60"}, {"k": "p_b1", "nm": "踏步寬度(高位) b1 (cm)", "def": "100", "g": 0, "st": "10", "min": "50", "max": "300"}, {"k": "p_b2", "nm": "踏步淨寬(低位通道) b2 (cm)", "def": "40", "g": 0, "st": "5", "min": "20", "max": "150"}, {"k": "p_h1", "nm": "踏步高度 h1 (cm)", "def": "40", "g": 0, "st": "5", "min": "20", "max": "100"}, {"k": "p_H", "nm": "固床工高度 H (cm)", "def": "360", "g": 0, "st": "20", "min": "150", "max": "800"}, {"k": "p_B_top", "nm": "壩體頂部前後寬 B_top (cm)", "def": "160", "g": 1, "st": "10", "min": "80", "max": "400"}, {"k": "p_slope_m", "nm": "下游面斜率 m (1:m, 原圖 1:0.3)", "def": "0.30", "g": 1, "st": "0.05", "min": "0.10", "max": "0.60"}, {"k": "p_c_crest", "nm": "高位踏步頂寬 c (cm)", "def": "80", "g": 1, "st": "10", "min": "50", "max": "250"}, {"k": "p_t_pc", "nm": "140kg/cm² 打底厚度 t_pc (cm)", "def": "5", "g": 1, "st": "5", "min": "5", "max": "30"}, {"k": "p_k_gap", "nm": "視圖相對安全間距係數 k_gap", "def": "1.0", "g": 1, "st": "0.1", "min": "0.6", "max": "2.5"}, {"k": "p_LReq", "nm": "左右兩側", "def": "1", "opt": [["1", "左右相同（右側跟左側）"], ["0", "左右分開"]], "g": 3}, {"k": "p_eL", "nm": "左端踏步加寬 (cm)", "def": "10", "st": "1", "min": "0", "max": "200", "g": 3}, {"k": "p_eR", "nm": "右端踏步加寬 (cm)", "def": "10", "st": "1", "min": "0", "max": "200", "g": 3}, {"k": "p_nwL", "nm": "左翼坡 1:n", "def": "0.3", "st": "0.05", "min": "0", "max": "1.5", "g": 3}, {"k": "p_nwR", "nm": "右翼坡 1:n", "def": "0.3", "st": "0.05", "min": "0", "max": "1.5", "g": 3}, {"k": "p_pce", "nm": "打底加寬 (cm)", "def": "3", "st": "1", "min": "0", "max": "50", "g": 3}, {"k": "p_tb1", "nm": "齒塊底上游內縮 (cm)", "def": "27", "st": "1", "min": "0", "max": "80", "g": 3}, {"k": "p_tb2", "nm": "齒塊底下游內縮 (cm)", "def": "15", "st": "1", "min": "0", "max": "80", "g": 3}, {"k": "p_tcr", "nm": "齒塊頂位置比", "def": "0.53", "st": "0.01", "min": "0", "max": "1", "g": 3}, {"k": "p_cov", "nm": "主筋保護層 (cm)", "def": "20", "st": "0.5", "min": "7.5", "max": "30", "g": 3}, {"k": "p_bs", "nm": "鋼筋配置間距 (cm)", "def": "60", "st": "5", "min": "15", "max": "100", "g": 3}, {"k": "p_rbe", "nm": "底筋末端距下游趾 (cm)", "def": "44", "st": "1", "min": "10", "max": "100", "g": 3}, {"k": "p_rb", "nm": "鋼筋估算 (kg/m³)", "def": "45", "st": "5", "min": "20", "max": "200", "g": 3}], GT: ["1. 固床工與踏步通道尺寸 (W1 / H / h1 / b1 / b2)", "2. 剖面圖 (A-A' / B-B') 與配筋參數", "3. 原圖符號說明與設計原則檢核", "左右分開與細部尺寸"], title: "水保標準圖參數化 CAD — 踏步式固床工 (圖號：0603-1 完整修復版)",
    run(R, opt) {
      RR = R || {}; OPT = Object.assign({}, opt || {}); O = [];
      try {
        lastChanged = 'N_high';
        LAST_L = null; const P = getParams(), rows = computeQuantities(P);
        let checks = [];
        try { updateSidebarUI(); const t = el('normCheckList').innerHTML || ''; checks = [...t.matchAll(/<div class="check-item ?(warn)?">([\s\S]*?)<\/div>/g)].map(m => ({ ok: !m[1], text: m[2].replace(/^\s*[✔⚠]\s*/, '').replace(/<[^>]+>/g, '') })); } catch (e) { }
        if (OPT.draw) renderCAD();
        return { P, rows, checks, O, L: LAST_L };
      } finally { RR = null; }
    }
  };
})();
TCO_S['f0605'] = (function () {   // 水保標準圖參數化 CAD — 格框式固床工 (圖號：0605-1 / 0605-2 左右獨立調整版)
  const DEF = {"p_N_notch": "2", "p_B_cell": "100", "p_H_cell": "100", "p_B_top": "100", "p_slope_m": "0.20", "p_S_pipe": "20", "p_d_stone": "22", "p_t": "30", "p_k_gap": "1.0", "p_N_layer": "3", "chkShowDetails": true, "chkShowTable": true, "p_LReq": "1", "p_rcL": "25", "p_rcR": "25", "p_rcW": "42", "p_kfill": "0.92", "p_hw": "49.9", "p_kj": "1.15", "p_trs": "2", "p_rb": "85"};
  let RR = null, OPT = {}, O = [];
  const EL = {}, CTX = new Proxy({}, { get: (t, k) => (k in t ? t[k] : () => ({ width: 0 })), set: (t, k, v) => { t[k] = v; return true; } });
  const el = id => EL[id] || (EL[id] = { get value() { const v = RR && RR[id] !== undefined && RR[id] !== null && RR[id] !== '' ? RR[id] : DEF[id]; return v === undefined ? '' : String(v); }, set value(v) {},
    get checked() { return OPT[id] !== undefined ? !!OPT[id] : !!DEF[id]; }, set checked(v) {}, textContent: '', innerHTML: '', style: {}, width: 1600, height: 1000, classList: { add() {}, remove() {}, toggle() {} },
    addEventListener() {}, appendChild() {}, getContext() { return CTX; }, getBoundingClientRect: () => ({ left: 0, top: 0, width: 1600, height: 1000 }), parentElement: { getBoundingClientRect: () => ({ left: 0, top: 0, width: 1600, height: 1000 }) } });
  const document = { getElementById: el, querySelectorAll: () => [], querySelector: () => null, createElement: () => ({ click() {}, style: {}, className: '', innerHTML: '', appendChild() {}, querySelectorAll: () => [], querySelector: () => ({ addEventListener() {}, getAttribute: () => '0', value: '' }) }), body: { appendChild() {}, removeChild() {} } };
  const window = { addEventListener() {}, innerWidth: 1990, innerHeight: 1044, devicePixelRatio: 1 };
  const requestAnimationFrame = () => 0, alert = () => {};

// ============================================================================
// 1. 原圖 6-05.dxf 斷面圖 (HATCH 圖層 50A2~50D8) 真實塊卵石多邊形模板庫
// ============================================================================
const COBBLE_POLY_TEMPLATES = [
  [[-0.45,-0.28],[-0.48,0.16],[-0.18,0.46],[0.26,0.48],[0.48,0.18],[0.42,-0.26],[0.14,-0.48],[-0.20,-0.46]],
  [[-0.42,-0.32],[-0.46,0.20],[-0.08,0.48],[0.38,0.36],[0.47,-0.06],[0.34,-0.40],[-0.05,-0.47]],
  [[-0.46,0.00],[-0.36,0.40],[0.05,0.48],[0.44,0.28],[0.46,-0.18],[0.20,-0.46],[-0.26,-0.42]],
  [[-0.40,-0.35],[-0.47,0.12],[-0.14,0.45],[0.32,0.42],[0.48,0.04],[0.36,-0.38],[-0.08,-0.48]]
];

// 儲存每一層 (lay = 0 底層 ~ lay = N_layer - 1 頂層) 的 { left: 左岸格數, right: 右岸格數 }
// 以 X = 0 (中央基準線) 分界：左側延伸為 [-left * B_cell, 0]，右側延伸為 [0, +right * B_cell]
// 原圖 3 層預設：底層 左2/右2 (共4格)、中層 左3/右3 (共6格)、頂層 左4/右4 (共8格)
let customLayerLR = [
  { left: 2, right: 2 },
  { left: 3, right: 3 },
  { left: 4, right: 4 }
];

// ============================================================================
// 2. 建立左側面板「各層左/右格數獨立調整」輸入框
// ============================================================================
function computeDefaultLR(N_layer) {
  const arr = new Array(N_layer);
  for (let lay = 0; lay < N_layer; lay++) {
    // 原圖底層 左2/右2，每往上一層左、右各 +1 格
    const halfBays = 2 + lay;
    arr[lay] = { left: halfBays, right: halfBays };
  }
  return arr;
}

function rebuildFrontLayerInputs(resetDefault = false) {
  const N_layer = parseInt(document.getElementById('p_N_layer').value) || 3;

  if (resetDefault) {
    customLayerLR = computeDefaultLR(N_layer);
  } else if (customLayerLR.length !== N_layer) {
    // 保留既有層設定，新增層自動往外遞增 1 格
    const nextArr = new Array(N_layer);
    for (let lay = 0; lay < N_layer; lay++) {
      if (lay < customLayerLR.length) {
        nextArr[lay] = { ...customLayerLR[lay] };
      } else {
        const prev = nextArr[lay - 1] || { left: 2, right: 2 };
        nextArr[lay] = { left: prev.left + 1, right: prev.right + 1 };
      }
    }
    customLayerLR = nextArr;
  }

  const container = document.getElementById('frontLayerInputsContainer');
  container.innerHTML = '';

  // 由頂層 (lay = N_layer - 1) 排到底層 (lay = 0)
  for (let lay = N_layer - 1; lay >= 0; lay--) {
    const tag = (lay === N_layer - 1) ? `第${lay + 1}層(頂)` : (lay === 0 ? `第1層(底)` : `第${lay + 1}層`);
    const lr = customLayerLR[lay];
    const row = document.createElement('div');
    row.className = 'layer-lr-row';
    row.innerHTML = `
      <span class="lay-title">${tag}</span>
      <div class="lr-inputs">
        <span>左</span>
        <input type="number" data-lay="${lay}" data-side="left" value="${lr.left}" min="0" max="50" step="1">
        <span>右</span>
        <input type="number" data-lay="${lay}" data-side="right" value="${lr.right}" min="0" max="50" step="1">
      </div>
      <span class="lay-sum" id="laysum_${lay}">共 ${lr.left + lr.right} 格</span>
    `;
    row.querySelectorAll('input').forEach(inp => {
      inp.addEventListener('input', (e) => {
        const idx = parseInt(e.target.getAttribute('data-lay'));
        const side = e.target.getAttribute('data-side');
        const val = Math.max(0, parseInt(e.target.value) || 0);
        customLayerLR[idx][side] = val;
        // 確保單層左+右至少有 1 格
        if (customLayerLR[idx].left + customLayerLR[idx].right < 1) {
          customLayerLR[idx][side] = 1;
          e.target.value = 1;
        }
        const sumEl = document.getElementById(`laysum_${idx}`);
        if (sumEl) {
          sumEl.textContent = `共 ${customLayerLR[idx].left + customLayerLR[idx].right} 格`;
        }
        updateSidebarUI();
        renderCAD();
      });
    });
    container.appendChild(row);
  }
}

function getParams() {
  const N_layer = parseInt(document.getElementById('p_N_layer').value) || 3;
  const B_cell = parseFloat(document.getElementById('p_B_cell').value) || 100;
  const H_cell = parseFloat(document.getElementById('p_H_cell').value) || 100;
  const N_notch = Math.max(0, parseInt(document.getElementById('p_N_notch').value) || 0);

  const B_top = parseFloat(document.getElementById('p_B_top').value) || 100;
  const slope_m = parseFloat(document.getElementById('p_slope_m').value) || 0.20;
  const S_pipe = parseFloat(document.getElementById('p_S_pipe').value) || 20;
  const d_stone = parseFloat(document.getElementById('p_d_stone').value) || 22;
  const t = parseFloat(document.getElementById('p_t').value) || 30;
  const k_gap = parseFloat(document.getElementById('p_k_gap').value) || 1.0;

  if (customLayerLR.length !== N_layer) {
    rebuildFrontLayerInputs(false);
  }

  const layerLR = customLayerLR.map(item => ({ left: item.left, right: item.right, total: item.left + item.right }));
  const maxLeftBays = Math.max(...layerLR.map(d => d.left));
  const maxRightBays = Math.max(...layerLR.map(d => d.right));

  const frontMinX = -(maxLeftBays * B_cell);
  const frontMaxX = +(maxRightBays * B_cell);
  const W_max = frontMaxX - frontMinX;

  const topLR = layerLR[N_layer - 1];
  const W_top = +(topLR.total * B_cell).toFixed(0);
  const H_total = +(N_layer * H_cell).toFixed(0);

  const B_bot = +(B_top + 2 * slope_m * H_total).toFixed(1);
  const B_rc = +(B_bot + 42).toFixed(1);
  const nPipesPerCell = Math.max(1, Math.round(H_cell / S_pipe) - 1);

  return {
    N_layer, B_cell, H_cell, N_notch,
    layerLR, maxLeftBays, maxRightBays, frontMinX, frontMaxX, W_max, W_top, H_total,
    B_top, slope_m, B_bot, B_rc, S_pipe, nPipesPerCell, d_stone, t, k_gap
  };
}

// 計算頂層中央複式低水口在 [ -topLR.left, +topLR.right ] 格座標系中的索引範圍
// 以 X = 0 為中心：左岸格索引 b ∈ [-left, -1]，右岸格索引 b ∈ [0, right - 1]
// (即第 b 格的水平座標為 [b * B_cell, (b + 1) * B_cell])
function getTopNotchConfig(topLR, N_notch) {
  if (N_notch <= 0) return { hasNotch: false };
  // 以 X=0 為中心分配低水口左半格數與右半格數
  const notchLeft = Math.floor(N_notch / 2);
  const notchRight = N_notch - notchLeft;
  const notchStartB = -notchLeft;      // 例如 N_notch=2 -> [-1, 0] 共 2 格
  const notchEndB = notchRight - 1;
  const leftSlopeB = notchStartB - 1;  // 左側 1:1 斜坡格索引 (例如 -2)
  const rightSlopeB = notchEndB + 1;   // 右側 1:1 斜坡格索引 (例如 +1)

  // 檢查頂層左右格數是否足夠容納低水口
  if (-topLR.left > notchStartB || topLR.right <= notchEndB) {
    return { hasNotch: false };
  }
  return {
    hasNotch: true,
    notchStartB,
    notchEndB,
    leftSlopeB: (-topLR.left <= leftSlopeB) ? leftSlopeB : null,
    rightSlopeB: (rightSlopeB < topLR.right) ? rightSlopeB : null
  };
}

// ============================================================================
// 3. 工程數量計算表 (100% 對應各層左/右獨立格數與中央低水口格數)
// ============================================================================
function computeQuantities(P) {
  const rows = [];
  const B_cell_m = P.B_cell / 100;
  const H_cell_m = P.H_cell / 100;
  const topNotch = getTopNotchConfig(P.layerLR[P.N_layer - 1], P.N_notch);

  let totalFullCells = 0;
  const layerDescParts = [];
  for (let lay = P.N_layer - 1; lay >= 0; lay--) {
    const lr = P.layerLR[lay];
    let effBays = lr.total;
    if (lay === P.N_layer - 1 && topNotch.hasNotch) {
      const slopeDeduction = (topNotch.leftSlopeB !== null ? 0.5 : 0) + (topNotch.rightSlopeB !== null ? 0.5 : 0);
      effBays = Math.max(0, effBays - P.N_notch - slopeDeduction);
    }
    totalFullCells += effBays;
    layerDescParts.push(`L${lay + 1}(左${lr.left}+右${lr.right})`);
  }

  // 1. H200x200x8x12mm 主剛框與橫向支撐型鋼
  const hBeamLen_m = +(totalFullCells * (2 * B_cell_m + 2.2 * H_cell_m) * 1.15).toFixed(1);
  const hBeamWeight_t = +(hBeamLen_m * 0.0499).toFixed(2);
  rows.push({
    no: '1',
    name: `H型鋼主剛框與支撐 (H200×200×8×12mm, 鍍鋅)`,
    unit: 't',
    formula: `[${layerDescParts.join(', ')}] 有效${totalFullCells}格 → 總長 ${hBeamLen_m}m × 0.0499 t/m`,
    qty: hBeamWeight_t,
    note: `鍍鋅量≧550g/m², 含接合板與M20螺栓`
  });

  // 2. 口型鋼 (方型鋼管 50x50x3.2mm)
  const totalPipes = Math.round(totalFullCells * P.nPipesPerCell * 2);
  const pipeLen_m = +(totalPipes * B_cell_m).toFixed(1);
  rows.push({
    no: '2',
    name: `方型鋼管格柵 (口50×50×3.2mm @${P.S_pipe}cm, 每層${P.nPipesPerCell}支)`,
    unit: 'm',
    formula: `有效格數 ${totalFullCells}格 × 前後2面 × 每格${P.nPipesPerCell}支 × 單長(${P.B_cell}/100)m`,
    qty: pipeLen_m,
    note: `PL 100×100×3.2mm 滿焊及4-M20接合`
  });

  // 3. 格框內填充塊卵石
  let totalStoneVol = 0;
  for (let lay = 0; lay < P.N_layer; lay++) {
    const y0 = lay * P.H_cell;
    const y1 = (lay + 1) * P.H_cell;
    const b0 = P.B_top + 2 * P.slope_m * (P.H_total - y0);
    const b1 = P.B_top + 2 * P.slope_m * (P.H_total - y1);
    const secArea_m2 = ((b0 + b1) / 200) * H_cell_m;
    let effBays = P.layerLR[lay].total;
    if (lay === P.N_layer - 1 && topNotch.hasNotch) {
      const slopeDeduction = (topNotch.leftSlopeB !== null ? 0.5 : 0) + (topNotch.rightSlopeB !== null ? 0.5 : 0);
      effBays = Math.max(0, effBays - P.N_notch - slopeDeduction);
    }
    totalStoneVol += secArea_m2 * (effBays * B_cell_m);
  }
  totalStoneVol = +(totalStoneVol * 0.92).toFixed(2);
  rows.push({
    no: '3',
    name: `格框內填充塊卵石 (平均粒徑 d=${P.d_stone}cm)`,
    unit: 'm³',
    formula: `各層梯形斷面積 × 各層有效寬度 × 0.92 (頂寬${P.B_top}~底寬${P.B_bot}cm)`,
    qty: totalStoneVol,
    note: `粒徑大於框架間距 ${P.S_pipe}cm 避免流失`
  });

  // 4. RC基礎台
  const botLR = P.layerLR[0];
  const rcLen_m = ((botLR.total * P.B_cell + 50) / 100);
  const v_rc = +(rcLen_m * (P.B_rc / 100) * (P.t / 100)).toFixed(2);
  rows.push({
    no: '4',
    name: `RC混凝土基礎台 (底層左${botLR.left}+右${botLR.right}格, 厚t=${P.t}cm)`,
    unit: 'm³',
    formula: `底層基長 ${rcLen_m.toFixed(2)}m × 基礎寬(${P.B_rc}/100)m × 厚(${P.t}/100)m`,
    qty: v_rc,
    note: `原圖標註 RC基礎台 (t=${P.t}cm)`
  });

  return rows;
}

function updateSidebarUI() {
  const P = getParams();
  const topLR = P.layerLR[P.N_layer - 1];
  const topToBotStr = [...P.layerLR].reverse().map(d => `${d.left}+${d.right}`).join(' → ');

  document.getElementById('drv_frame_info').textContent =
    `頂層寬 W = ${P.W_top} cm (左${topLR.left}+右${topLR.right}格) ｜ 頂→底(左+右): [${topToBotStr}]`;
  document.getElementById('drv_sec_info').textContent =
    `斷面底寬 B_bot = ${P.B_bot} cm ｜ RC台寬 = ${P.B_rc} cm ｜ 每格柵管 = ${P.nPipesPerCell} 支`;

  const topNotch = getTopNotchConfig(topLR, P.N_notch);
  const checks = [
    {
      ok: true,
      msg: `[各層左右獨立微調] 頂→底各層(左+右)格數 [${topToBotStr}]，立面與平面圖 100% 即時非對稱反推`
    },
    {
      ok: P.N_notch === 0 || topNotch.hasNotch,
      msg: P.N_notch === 0
        ? `[中央低水口] 目前設為 0 格 (平頂無低水口)`
        : (topNotch.hasNotch
          ? `[中央低水口] 底部寬 ${P.N_notch} 格 (${P.N_notch * P.B_cell}cm) + 兩側 1:${+(P.B_cell / P.H_cell).toFixed(2)} 斜坡格，符合複式斷面原則`
          : `[警告] 頂層左/右格數 (${topLR.left}/${topLR.right}) 不足容納中央低水口 ${P.N_notch} 格，請增加頂層格數或減少低水口格數！`)
    },
    {
      ok: P.d_stone > P.S_pipe,
      msg: `[原圖注意事項5] 塊卵石粒徑 d=${P.d_stone}cm ${P.d_stone > P.S_pipe ? '>' : '≦'} 方管間距 ${P.S_pipe}cm ${P.d_stone > P.S_pipe ? '(符合防流失規定)' : '(警告：石徑應大於框架間距！)'}`
    },
    {
      ok: P.t >= 30,
      msg: `[原圖標註 t] RC基礎台厚度 t=${P.t}cm (原圖預設 30cm)`
    }
  ];

  const box = document.getElementById('normCheckList');
  box.innerHTML = checks.map(c =>
    `<div class="check-item ${c.ok ? '' : 'warn'}">${c.ok ? '✔' : '⚠'} ${c.msg}</div>`
  ).join('');
}

// ============================================================================
// 4. Canvas 2D 視埠與幾何繪圖引擎 (單位：cm)
// ============================================================================
const canvas = document.getElementById('cadCanvas');
const ctx = canvas.getContext('2d');
let camX = 500, camY = 150, scale = 0.42;
let isDragging = false, dragStartX = 0, dragStartY = 0;
let dxfEntities = [];

function worldToScreen(wx, wy) {
  const cw = canvas.width || 1100;
  const ch = canvas.height || 750;
  return [
    cw / 2 + (wx - camX) * scale,
    ch / 2 - (wy - camY) * scale
  ];
}
function screenToWorld(sx, sy) {
  const cw = canvas.width || 1100;
  const ch = canvas.height || 750;
  return [
    camX + (sx - cw / 2) / scale,
    camY - (sy - ch / 2) / scale
  ];
}

function drawWorldLine(x1, y1, x2, y2, color = '#ffffff', width = 1.4, dash = [], layer = '0') {
  const [sx1, sy1] = worldToScreen(x1, y1);
  const [sx2, sy2] = worldToScreen(x2, y2);
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.setLineDash(dash);
  ctx.beginPath();
  ctx.moveTo(sx1, sy1);
  ctx.lineTo(sx2, sy2);
  ctx.stroke();
  ctx.restore();
  dxfEntities.push({ type: 'LINE', layer, x1, y1, x2, y2 });
}

function drawWorldPoly(pts, closed = true, strokeCol = '#ffffff', fillCol = null, width = 1.5, dash = [], layer = '0') {
  if (!pts || pts.length < 2) return;
  ctx.save();
  ctx.beginPath();
  pts.forEach((p, idx) => {
    const [sx, sy] = worldToScreen(p[0], p[1]);
    if (idx === 0) ctx.moveTo(sx, sy);
    else ctx.lineTo(sx, sy);
  });
  if (closed) ctx.closePath();
  if (fillCol) {
    ctx.fillStyle = fillCol;
    ctx.fill();
  }
  if (strokeCol) {
    ctx.strokeStyle = strokeCol;
    ctx.lineWidth = width;
    ctx.setLineDash(dash);
    ctx.stroke();
  }
  ctx.restore();
  dxfEntities.push({ type: 'POLY', layer, pts, closed });
}

function drawWorldCircle(cx, cy, r, strokeCol = '#94a3b8', fillCol = null, width = 1.1, layer = '2') {
  const [sx, sy] = worldToScreen(cx, cy);
  const sr = Math.max(1.2, r * scale);
  ctx.save();
  ctx.beginPath();
  ctx.arc(sx, sy, sr, 0, Math.PI * 2);
  if (fillCol) {
    ctx.fillStyle = fillCol;
    ctx.fill();
  }
  if (strokeCol) {
    ctx.strokeStyle = strokeCol;
    ctx.lineWidth = width;
    ctx.stroke();
  }
  ctx.restore();
}

function drawWorldText(txt, wx, wy, worldH = 18, color = '#22d3ee', align = 'center', rotDeg = 0, layer = '文字') {
  const [sx, sy] = worldToScreen(wx, wy);
  const px = Math.max(9.0, Math.min(26, worldH * scale));
  ctx.save();
  ctx.translate(sx, sy);
  if (rotDeg) ctx.rotate(-rotDeg * Math.PI / 180);
  ctx.font = `600 ${px}px "DFKai-SB", "Microsoft JhengHei", serif`;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  const lines = String(txt).split('\n');
  lines.forEach((line, idx) => {
    const dy = (idx - (lines.length - 1) / 2) * (px * 1.22);
    ctx.fillText(line, 0, dy);
  });
  ctx.restore();
  dxfEntities.push({ type: 'TEXT', layer, txt: String(txt).replace(/\n/g, ' '), x: wx, y: wy, h: worldH, rotDeg });
}

function drawLeader(pts, text, align = 'left', col = '#22d3ee') {
  for (let i = 0; i < pts.length - 1; i++) {
    drawWorldLine(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], col, 1.2, [], 'DIM');
  }
  const [x0, y0] = pts[0];
  const [x1, y1] = pts[1];
  const ang = Math.atan2(y1 - y0, x1 - x0);
  const aLen = 14;
  drawWorldPoly([
    [x0, y0],
    [x0 + aLen * Math.cos(ang + 0.26), y0 + aLen * Math.sin(ang + 0.26)],
    [x0 + aLen * Math.cos(ang - 0.26), y0 + aLen * Math.sin(ang - 0.26)]
  ], true, col, col, 1.0, [], 'DIM');
  const last = pts[pts.length - 1];
  const dx = align === 'left' ? 8 : -8;
  drawWorldText(text, last[0] + dx, last[1], 17, '#ffffff', align, 0, '文字');
}

function getDimExtensionCoords(coordObj, dimPos) {
  const dir = dimPos >= coordObj ? 1 : -1;
  const minGapFromObj = 14.0;
  const overshoot = 12.0;
  return {
    extStart: coordObj + dir * minGapFromObj,
    extEnd: dimPos + dir * overshoot
  };
}

function drawDimH(x1, x2, yObj1, yObj2, yDim, text, textAbove = true) {
  const e1 = getDimExtensionCoords(yObj1, yDim);
  const e2 = getDimExtensionCoords(yObj2, yDim);
  drawWorldLine(x1, e1.extStart, x1, e1.extEnd, '#22d3ee', 1.15, [], 'DIM');
  drawWorldLine(x2, e2.extStart, x2, e2.extEnd, '#22d3ee', 1.15, [], 'DIM');
  drawWorldLine(x1, yDim, x2, yDim, '#22d3ee', 1.3, [], 'DIM');
  const s = Math.min(18, Math.abs(x2 - x1) * 0.22);
  const dir = x2 >= x1 ? 1 : -1;
  drawWorldPoly([[x1, yDim], [x1 + dir * s, yDim + s * 0.22], [x1 + dir * s, yDim - s * 0.22]], true, '#22d3ee', '#22d3ee', 1, [], 'DIM');
  drawWorldPoly([[x2, yDim], [x2 - dir * s, yDim + s * 0.22], [x2 - dir * s, yDim - s * 0.22]], true, '#22d3ee', '#22d3ee', 1, [], 'DIM');
  drawWorldText(text, (x1 + x2) / 2, textAbove ? yDim + 16 : yDim - 16, 17, '#22d3ee', 'center', 0, 'DIM');
}

function drawDimV(y1, y2, xObj1, xObj2, xDim, text, textLeftOfLine = false) {
  const e1 = getDimExtensionCoords(xObj1, xDim);
  const e2 = getDimExtensionCoords(xObj2, xDim);
  drawWorldLine(e1.extStart, y1, e1.extEnd, y1, '#22d3ee', 1.15, [], 'DIM');
  drawWorldLine(e2.extStart, y2, e2.extEnd, y2, '#22d3ee', 1.15, [], 'DIM');
  drawWorldLine(xDim, y1, xDim, y2, '#22d3ee', 1.3, [], 'DIM');
  const s = Math.min(16, Math.abs(y2 - y1) * 0.22);
  const dir = y2 >= y1 ? 1 : -1;
  drawWorldPoly([[xDim, y1], [xDim - s * 0.22, y1 + dir * s], [xDim + s * 0.22, y1 + dir * s]], true, '#22d3ee', '#22d3ee', 1, [], 'DIM');
  drawWorldPoly([[xDim, y2], [xDim - s * 0.22, y2 - dir * s], [xDim + s * 0.22, y2 - dir * s]], true, '#22d3ee', '#22d3ee', 1, [], 'DIM');
  drawWorldText(text, textLeftOfLine ? xDim - 16 : xDim + 16, (y1 + y2) / 2, 17, '#22d3ee', 'center', 90, 'DIM');
}

function drawHBeamMember(x1, y1, x2, y2, halfW = 5.0) {
  const dx = x2 - x1, dy = y2 - y1;
  const len = Math.hypot(dx, dy);
  if (len < 1) return;
  const nx = -dy / len * halfW;
  const ny = dx / len * halfW;

  drawWorldLine(x1 + nx, y1 + ny, x2 + nx, y2 + ny, '#ef4444', 1.5, [], 'L6');
  drawWorldLine(x1 - nx, y1 - ny, x2 - nx, y2 - ny, '#ef4444', 1.5, [], 'L6');
  drawWorldLine(x1, y1, x2, y2, '#e879f9', 1.0, [5, 4], 'L6');

  const ux = dx / len, uy = dy / len;
  [7, len - 7].forEach(d => {
    if (d > 0 && d < len) {
      drawWorldCircle(x1 + ux * d + nx * 0.5, y1 + uy * d + ny * 0.5, 1.2, '#94a3b8', null, 1.0, '2');
      drawWorldCircle(x1 + ux * d - nx * 0.5, y1 + uy * d - ny * 0.5, 1.2, '#94a3b8', null, 1.0, '2');
    }
  });
}

function drawCellSquarePipes(xMin, yMin, cellW, cellH, S_pipe, cellType = 'full') {
  const halfFlange = 5.0;
  const pipeHalfH = 1.25;
  const nPipes = Math.max(1, Math.round(cellH / S_pipe) - 1);
  const stepY = cellH / (nPipes + 1);

  for (let p = 1; p <= nPipes; p++) {
    const dy = p * stepY;
    const py = yMin + dy;
    let xStart = xMin + halfFlange;
    let xEnd = xMin + cellW - halfFlange;

    if (cellType === 'slope_left') {
      const xDiag = xMin + cellW * (1 - dy / cellH);
      xEnd = xDiag - halfFlange * 0.8;
    } else if (cellType === 'slope_right') {
      const xDiag = xMin + cellW * (dy / cellH);
      xStart = xDiag + halfFlange * 0.8;
    }

    if (xEnd - xStart > 8) {
      drawWorldLine(xStart, py - pipeHalfH, xEnd, py - pipeHalfH, '#e879f9', 1.25, [], 'C1');
      drawWorldLine(xStart, py + pipeHalfH, xEnd, py + pipeHalfH, '#e879f9', 1.25, [], 'C1');
      drawWorldCircle(xStart - 1.8, py, 1.0, '#94a3b8', null, 0.9, '2');
      drawWorldCircle(xEnd + 1.8, py, 1.0, '#94a3b8', null, 0.9, '2');
    }
  }
}

function fillSectionTrapezoidWithCobbles(yMin, yMax, xCenter, bTopAtH, H_total, slope_m, d_stone) {
  const height = yMax - yMin;
  const nRows = Math.max(3, Math.round(height / (d_stone * 0.88)));
  const rowH = height / nRows;

  for (let r = 0; r < nRows; r++) {
    const cy = yMin + (r + 0.5) * rowH;
    const wAtY = bTopAtH + 2 * slope_m * (H_total - cy) - 24;
    if (wAtY <= 15) continue;

    const nCols = Math.max(2, Math.round(wAtY / (d_stone * 0.92)));
    const colW = wAtY / nCols;
    const xLeft = xCenter - wAtY / 2;

    const maxRx = Math.min(colW * 0.46, d_stone * 0.52);
    const maxRy = Math.min(rowH * 0.46, d_stone * 0.50);

    for (let c = 0; c < nCols; c++) {
      const hash = Math.sin((c * 23 + r * 41) * 12.9898) * 43758.5453;
      const f1 = hash - Math.floor(hash);
      const f2 = (hash * 1.7) - Math.floor(hash * 1.7);

      const cx = xLeft + (c + 0.5 + (r % 2 === 1 ? 0.08 : -0.08) + (f1 - 0.5) * 0.14) * colW;
      const rx = maxRx * (0.90 + (f1 - 0.5) * 0.18);
      const ry = maxRy * (0.90 + (f2 - 0.5) * 0.18);
      const rot = (f1 - 0.5) * 0.8;

      const tpl = COBBLE_POLY_TEMPLATES[(c + r) % COBBLE_POLY_TEMPLATES.length];
      const cosA = Math.cos(rot), sinA = Math.sin(rot);
      const pts = tpl.map(uv => [
        cx + (uv[0] * rx * 2) * cosA - (uv[1] * ry * 2) * sinA,
        cy + (uv[0] * rx * 2) * sinA + (uv[1] * ry * 2) * cosA
      ]);
      drawWorldPoly(pts, true, '#e879f9', 'rgba(217, 70, 239, 0.14)', 1.2, [], 'HATCH');
    }
  }
}

function drawArConcHatch(xMin, yMin, w, h) {
  const polyPts = [[xMin, yMin], [xMin + w, yMin], [xMin + w, yMin + h], [xMin, yMin + h]];
  ctx.save();
  ctx.beginPath();
  polyPts.forEach((p, idx) => {
    const [sx, sy] = worldToScreen(p[0], p[1]);
    if (idx === 0) ctx.moveTo(sx, sy);
    else ctx.lineTo(sx, sy);
  });
  ctx.closePath();
  ctx.clip();

  ctx.strokeStyle = 'rgba(232, 121, 249, 0.45)';
  ctx.fillStyle = 'rgba(232, 121, 249, 0.40)';
  ctx.lineWidth = 1.0;

  const step = 32;
  for (let gx = xMin; gx < xMin + w; gx += step) {
    for (let gy = yMin; gy < yMin + h; gy += step) {
      const t1 = [[gx + 6, gy + 7], [gx + 13, gy + 4], [gx + 10, gy + 13]];
      ctx.beginPath();
      t1.forEach((pt, i) => {
        const [sx, sy] = worldToScreen(pt[0], pt[1]);
        if (i === 0) ctx.moveTo(sx, sy);
        else ctx.lineTo(sx, sy);
      });
      ctx.closePath();
      ctx.stroke();
      [[gx + 4, gy + 18], [gx + 16, gy + 10], [gx + 24, gy + 20]].forEach(dot => {
        const [sx, sy] = worldToScreen(dot[0], dot[1]);
        ctx.fillRect(sx, sy, 1.5, 1.5);
      });
    }
  }
  ctx.restore();
}

// ============================================================================
// 5. 動態包絡盒相對間距排版引擎
// ============================================================================
function computeDynamicLayout(P, showDetails) {
  const { frontMinX, frontMaxX } = P;

  const gapY = Math.max(320, (P.H_total * 0.45 + P.B_bot * 0.6) * P.k_gap);
  const gapX = Math.max(420, (P.W_max * 0.25 + P.B_rc * 0.5) * P.k_gap);

  const planCenterY = -P.t - gapY - P.B_bot / 2;
  const planBotY = planCenterY - P.B_bot / 2;
  const planTopY = planCenterY + P.B_bot / 2;

  const secCenterX = frontMaxX + gapX + P.B_rc / 2;
  const detailStartX = secCenterX + P.B_rc / 2 + 380;
  const tableTopY = planBotY - 240 * P.k_gap;

  const maxRightX = showDetails ? (detailStartX + 1450) : Math.max(secCenterX + P.B_rc / 2 + 280, frontMaxX + 1000);

  return {
    frontMinX, frontMaxX,
    planCenterY, planBotY, planTopY,
    secCenterX, detailStartX, tableTopY,
    bounds: {
      minX: frontMinX - 360,
      maxX: maxRightX,
      minY: tableTopY - 320,
      maxY: P.H_total + 240
    }
  };
}

// ============================================================================
// 6. 主渲染函式 renderCAD() — 支援各層左/右獨立調整與自訂中央低水口格數
// ============================================================================
function renderCAD() {
  const rect = canvas.parentElement.getBoundingClientRect();
  const cw = Math.max(800, rect.width || window.innerWidth - 425);
  const ch = Math.max(550, rect.height || window.innerHeight - 44);
  if (canvas.width !== cw || canvas.height !== ch) {
    canvas.width = cw;
    canvas.height = ch;
  }

  ctx.fillStyle = '#141923';
  ctx.fillRect(0, 0, cw, ch);
  dxfEntities = [];

  const P = getParams();
  const showDetails = document.getElementById('chkShowDetails').checked;
  const showTable = document.getElementById('chkShowTable').checked;
  const L = computeDynamicLayout(P, showDetails);

  // =========================================================================
  // 視圖 1：【左上方 — 正視圖 (立面圖)】(以 X = 0 為中央基準線，左岸 [-left*B, 0]、右岸 [0, +right*B])
  // =========================================================================
  // 畫一條淡青色中心基準點劃線 (X = 0)，方便對照左岸與右岸格數
  drawWorldLine(0, -P.t - 35, 0, P.H_total + 45, 'rgba(56, 189, 248, 0.30)', 1.0, [10, 5], '輔助線');

  // 1) 底部 RC 基礎台 (隨底層左/右格數自動非對稱伸縮 + 左右各外伸 25cm，厚 t)
  const botLR = P.layerLR[0];
  const rcLeftX = -botLR.left * P.B_cell - P.rcL;
  const rcRightX = botLR.right * P.B_cell + P.rcR;
  drawArConcHatch(rcLeftX, -P.t, rcRightX - rcLeftX, P.t);
  drawWorldPoly([
    [rcLeftX, 0],
    [rcRightX, 0],
    [rcRightX, -P.t],
    [rcLeftX, -P.t]
  ], true, '#facc15', null, 1.6, [], '0');
  drawDimV(-P.t, 0, rcRightX, rcRightX, rcRightX + 50, `t=${P.t}`, false);

  // 2) 逐層繪製立面 H 型鋼格框與方型鋼管柵條 (lay = 0 底層 ~ N_layer - 1 頂層)
  const topLR = P.layerLR[P.N_layer - 1];
  const topNotch = getTopNotchConfig(topLR, P.N_notch);

  for (let lay = 0; lay < P.N_layer; lay++) {
    const lr = P.layerLR[lay];
    const xStart = -lr.left * P.B_cell;
    const xEnd = lr.right * P.B_cell;
    const y0 = lay * P.H_cell;
    const y1 = (lay + 1) * P.H_cell;
    const isTopLayer = (lay === P.N_layer - 1);
    const hasNotch = isTopLayer && topNotch.hasNotch;

    // 格索引 b 從 -lr.left 到 lr.right - 1 (每格範圍 [b * B_cell, (b+1) * B_cell])
    for (let b = -lr.left; b < lr.right; b++) {
      const bx0 = b * P.B_cell;
      const bx1 = (b + 1) * P.B_cell;

      if (lay === 0) {
        drawHBeamMember(bx0, y0 + 5, bx1, y0 + 5, 5.0);
      }

      if (hasNotch && b >= topNotch.notchStartB && b <= topNotch.notchEndB) {
        // 中央低水口空曠區：僅繪製底面橫樑
        drawHBeamMember(bx0, y0 + 5, bx1, y0 + 5, 5.0);
        continue;
      } else if (hasNotch && b === topNotch.leftSlopeB) {
        // 左側 1:1 斜坡格
        drawCellSquarePipes(bx0, y0, P.B_cell, P.H_cell, P.S_pipe, 'slope_left');
        drawHBeamMember(bx0, y0 + 5, bx1, y0 + 5, 5.0);
        drawHBeamMember(bx0, y1 - 3, bx1, y0 + 3, 5.0);
        drawWorldText(`1:${+(P.B_cell / P.H_cell).toFixed(2)}`, bx0 + P.B_cell * 0.62, y0 + P.H_cell * 0.65, 16, '#22d3ee', 'center', -45, 'DIM');
      } else if (hasNotch && b === topNotch.rightSlopeB) {
        // 右側 1:1 斜坡格
        drawCellSquarePipes(bx0, y0, P.B_cell, P.H_cell, P.S_pipe, 'slope_right');
        drawHBeamMember(bx0, y0 + 5, bx1, y0 + 5, 5.0);
        drawHBeamMember(bx0, y0 + 3, bx1, y1 - 3, 5.0);
        drawWorldText(`1:${+(P.B_cell / P.H_cell).toFixed(2)}`, bx0 + P.B_cell * 0.38, y0 + P.H_cell * 0.65, 16, '#22d3ee', 'center', 45, 'DIM');
      } else {
        // 標準矩形滿格
        drawCellSquarePipes(bx0, y0, P.B_cell, P.H_cell, P.S_pipe, 'full');
        drawHBeamMember(bx0, y0 + 5, bx1, y0 + 5, 5.0);
        drawHBeamMember(bx0, y1 - 5, bx1, y1 - 5, 5.0);
      }
    }

    // 繪製該層的垂直 H 型鋼立柱 (柱索引 c 從 -lr.left 到 +lr.right)
    for (let c = -lr.left; c <= lr.right; c++) {
      if (hasNotch && c >= topNotch.notchStartB && c <= topNotch.notchEndB + 1) {
        continue;
      }
      const cx = c * P.B_cell;
      drawHBeamMember(cx, y0, cx, y1, 5.0);
    }

    // 在立面圖左右兩側標示該層「左格數 / 右格數」標籤
    drawWorldText(`L${lay + 1}(左${lr.left}格)`, xStart - 25, (y0 + y1) / 2, 15.5, '#fde047', 'right', 0, '文字');
    drawWorldText(`(右${lr.right}格)`, xEnd + 25, (y0 + y1) / 2, 15.5, '#fde047', 'left', 0, '文字');
  }

  // 正視圖標註與引線：
  const topLeftX = -topLR.left * P.B_cell;
  const topRightX = topLR.right * P.B_cell;
  drawDimH(topLeftX, topRightX, P.H_total, P.H_total, P.H_total + 95, `頂層總寬 W = ${P.W_top} cm (左${topLR.left}格+右${topLR.right}格 = ${topLR.total}格)`, true);
  if (topNotch.hasNotch) {
    const nX1 = topNotch.notchStartB * P.B_cell;
    const nX2 = (topNotch.notchEndB + 1) * P.B_cell;
    drawDimH(nX1, nX2, P.H_total - P.H_cell, P.H_total - P.H_cell, P.H_total + 25, `低水口 ${P.N_notch}格 (${P.N_notch * P.B_cell}cm)`, true);
  }

  drawLeader([[rcLeftX + P.B_cell * 0.5, P.H_cell * 0.25], [rcLeftX - 40, -65], [rcLeftX - 70, -65]], `方型鋼管@${P.S_pipe}cm`, 'right');
  drawLeader([[0, P.H_cell * 0.2], [50, -75], [85, -75]], `主剛框，H型鋼@${+(P.B_cell * (P.trs || 2) / 100).toFixed(1)}m`, 'left');
  drawLeader([[topLeftX, P.H_total - P.H_cell * 0.5], [topLeftX - 45, P.H_total - P.H_cell * 0.2], [topLeftX - 65, P.H_total - P.H_cell * 0.2]], '嵌入岸壁披覆不透水織布\n或使用混凝土結構。', 'right');

  const centerVisualX = (P.frontMinX + P.frontMaxX) / 2;
  drawWorldText('正 視 圖 (各層左/右格數獨立可調)', centerVisualX, -P.t - 75, 22, '#38bdf8', 'center', 0, '輔助線');
  drawWorldLine(centerVisualX - 140, -P.t - 92, centerVisualX + 140, -P.t - 92, '#22d3ee', 1.4, [], '輔助線');

  // =========================================================================
  // 視圖 2：【左下方 — 平面圖】(100% 由上方正視圖各層左/右格數 P.layerLR[lay] 與低水口反推堆疊！)
  // =========================================================================
  const { planCenterY } = L;
  drawWorldLine(0, L.planBotY - 30, 0, L.planTopY + 30, 'rgba(56, 189, 248, 0.30)', 1.0, [10, 5], '輔助線');

  for (let lay = 0; lay < P.N_layer; lay++) {
    const lr = P.layerLR[lay];
    const xL = -lr.left * P.B_cell;
    const xR = lr.right * P.B_cell;

    const yBotH = lay * P.H_cell;
    const yTopH = (lay + 1) * P.H_cell;
    const bAtBot = P.B_top + 2 * P.slope_m * (P.H_total - yBotH);
    const bAtTop = P.B_top + 2 * P.slope_m * (P.H_total - yTopH);

    const pyBot1 = planCenterY - bAtBot / 2;
    const pyBot2 = planCenterY + bAtBot / 2;
    const pyTop1 = planCenterY - bAtTop / 2;
    const pyTop2 = planCenterY + bAtTop / 2;

    const isTopLayer = (lay === P.N_layer - 1);
    const hasNotch = isTopLayer && topNotch.hasNotch;

    // 繪製該層在平面上的外輪廓框 (紅色 H 型鋼邊框 L6)
    drawWorldPoly([[xL, pyBot1], [xR, pyBot1], [xR, pyBot2], [xL, pyBot2]], true, '#ef4444', null, 1.55, [], 'L6');

    if (!isTopLayer) {
      // 下方各層：自動比對上一層 (lay + 1) 的左、右邊界 [nxL, nxR]，凡露出於上一層左、右之外的格框皆完整繪出！
      const nextLR = P.layerLR[lay + 1];
      const nxL = -nextLR.left * P.B_cell;
      const nxR = nextLR.right * P.B_cell;

      for (let b = -lr.left; b < lr.right; b++) {
        const bx0 = b * P.B_cell;
        const bx1 = (b + 1) * P.B_cell;
        if (bx0 < nxL - 1 || bx1 > nxR + 1) {
          drawHBeamMember(bx0, pyBot1, bx0, pyBot2, 4.0);
          drawHBeamMember(bx1, pyBot1, bx1, pyBot2, 4.0);
          for (let s = 1; s <= P.nPipesPerCell; s++) {
            const frac = s / (P.nPipesPerCell + 1);
            const yPipe1 = pyBot1 + (pyTop1 - pyBot1) * frac;
            const yPipe2 = pyBot2 - (pyBot2 - pyTop2) * frac;
            drawWorldLine(bx0 + 5, yPipe1, bx1 - 5, yPipe1, '#e879f9', 1.1, [], 'C1');
            drawWorldLine(bx0 + 5, yPipe2, bx1 - 5, yPipe2, '#e879f9', 1.1, [], 'C1');
          }
        }
      }
    } else {
      // 最頂層：完整繪製頂面框、各格橫向支撐 H 型鋼、中央低水口斜坡折線與方型鋼管
      for (let b = -lr.left; b < lr.right; b++) {
        const bx0 = b * P.B_cell;
        const bx1 = (b + 1) * P.B_cell;

        drawHBeamMember(bx0, pyBot1, bx0, pyBot2, 4.5);
        if (b === lr.right - 1) drawHBeamMember(bx1, pyBot1, bx1, pyBot2, 4.5);

        if (hasNotch && b >= topNotch.notchStartB && b <= topNotch.notchEndB) {
          for (let p = 1; p <= P.nTop; p++) {
            const py = pyBot1 + (p / (P.nTop + 1)) * (pyBot2 - pyBot1);
            drawWorldLine(bx0 + 5, py - 1.2, bx1 - 5, py - 1.2, '#e879f9', 1.15, [], 'C1');
            drawWorldLine(bx0 + 5, py + 1.2, bx1 - 5, py + 1.2, '#e879f9', 1.15, [], 'C1');
          }
        } else if (hasNotch && b === topNotch.leftSlopeB) {
          drawWorldLine(bx0, pyTop1, bx1, pyBot1, '#ef4444', 1.6, [], 'L6');
          drawWorldLine(bx0, pyTop2, bx1, pyBot2, '#ef4444', 1.6, [], 'L6');
          for (let p = 1; p <= P.nTop; p++) {
            const py = pyTop1 + (p / (P.nTop + 1)) * (pyTop2 - pyTop1);
            drawWorldLine(bx0 + 5, py - 1.2, bx1 - 5, py - 1.2, '#e879f9', 1.15, [], 'C1');
            drawWorldLine(bx0 + 5, py + 1.2, bx1 - 5, py + 1.2, '#e879f9', 1.15, [], 'C1');
          }
        } else if (hasNotch && b === topNotch.rightSlopeB) {
          drawWorldLine(bx0, pyBot1, bx1, pyTop1, '#ef4444', 1.6, [], 'L6');
          drawWorldLine(bx0, pyBot2, bx1, pyTop2, '#ef4444', 1.6, [], 'L6');
          for (let p = 1; p <= P.nTop; p++) {
            const py = pyTop1 + (p / (P.nTop + 1)) * (pyTop2 - pyTop1);
            drawWorldLine(bx0 + 5, py - 1.2, bx1 - 5, py - 1.2, '#e879f9', 1.15, [], 'C1');
            drawWorldLine(bx0 + 5, py + 1.2, bx1 - 5, py + 1.2, '#e879f9', 1.15, [], 'C1');
          }
        } else {
          drawWorldLine(bx0, pyTop1, bx1, pyTop1, '#ef4444', 1.5, [], 'L6');
          drawWorldLine(bx0, pyTop2, bx1, pyTop2, '#ef4444', 1.5, [], 'L6');
          for (let p = 1; p <= P.nTop; p++) {
            const py = pyTop1 + (p / (P.nTop + 1)) * (pyTop2 - pyTop1);
            drawWorldLine(bx0 + 5, py - 1.2, bx1 - 5, py - 1.2, '#e879f9', 1.15, [], 'C1');
            drawWorldLine(bx0 + 5, py + 1.2, bx1 - 5, py + 1.2, '#e879f9', 1.15, [], 'C1');
          }
        }
      }
    }
  }

  drawLeader([[P.frontMinX + P.B_cell * 0.5, L.planBotY + 15], [P.frontMinX + P.B_cell * 0.2, L.planBotY - 55], [P.frontMinX, L.planBotY - 55]], `方型鋼管@${P.S_pipe}cm`, 'right');
  drawLeader([[P.frontMaxX - P.B_cell, L.planBotY + 10], [P.frontMaxX - P.B_cell * 0.4, L.planBotY - 55], [P.frontMaxX, L.planBotY - 55]], `H型鋼`, 'left');
  drawLeader([[P.frontMaxX, planCenterY], [P.frontMaxX + 55, planCenterY - 25], [P.frontMaxX + 80, planCenterY - 25]], `橫向支撐桿件，H型鋼`, 'left');

  drawWorldText('平 面 圖 (由各層左/右格數反推)', centerVisualX, L.planBotY - 105, 22, '#38bdf8', 'center', 0, '輔助線');
  drawWorldLine(centerVisualX - 140, L.planBotY - 122, centerVisualX + 140, L.planBotY - 122, '#22d3ee', 1.4, [], '輔助線');

  // =========================================================================
  // 視圖 3：【中右側 — 斷面圖 (橫斷面圖)】
  // =========================================================================
  const { secCenterX } = L;

  drawArConcHatch(secCenterX - P.B_rc / 2, -P.t, P.B_rc, P.t);
  drawWorldPoly([
    [secCenterX - P.B_rc / 2, 0],
    [secCenterX + P.B_rc / 2, 0],
    [secCenterX + P.B_rc / 2, -P.t],
    [secCenterX - P.B_rc / 2, -P.t]
  ], true, '#facc15', null, 1.6, [], '0');

  const stoneFillTopY = Math.max(P.H_cell * 0.85, P.H_total - P.H_cell * 0.65);
  fillSectionTrapezoidWithCobbles(6, stoneFillTopY, secCenterX, P.B_top, P.H_total, P.slope_m, P.d_stone);

  const xTopL = secCenterX - P.B_top / 2;
  const xTopR = secCenterX + P.B_top / 2;
  const xBotL = secCenterX - P.B_bot / 2;
  const xBotR = secCenterX + P.B_bot / 2;

  drawHBeamMember(xBotL + 4, 0, xTopL + 4, P.H_total, 2.8);
  drawHBeamMember(xBotR - 4, 0, xTopR - 4, P.H_total, 2.8);

  for (let lay = 0; lay <= P.N_layer; lay++) {
    const yL = lay * P.H_cell;
    const halfWAtY = (P.B_top + 2 * P.slope_m * (P.H_total - yL)) / 2;
    const xl = secCenterX - halfWAtY + 5;
    const xr = secCenterX + halfWAtY - 5;
    const yBeam = (lay === 0) ? 4 : (lay === P.N_layer ? P.H_total - 4 : yL);
    drawHBeamMember(xl, yBeam, xr, yBeam, 2.5);

    if (lay < P.N_layer) {
      const stepY = P.H_cell / (P.nPipesPerCell + 1);
      for (let p = 1; p <= P.nPipesPerCell; p++) {
        const py = yL + p * stepY;
        const hw = (P.B_top + 2 * P.slope_m * (P.H_total - py)) / 2;
        drawWorldPoly([
          [secCenterX - hw - 2.5, py - 1.5],
          [secCenterX - hw + 1.5, py - 1.5],
          [secCenterX - hw + 1.5, py + 1.5],
          [secCenterX - hw - 2.5, py + 1.5]
        ], true, '#94a3b8', null, 1.1, [], '2');
        drawWorldPoly([
          [secCenterX + hw - 1.5, py - 1.5],
          [secCenterX + hw + 2.5, py - 1.5],
          [secCenterX + hw + 2.5, py + 1.5],
          [secCenterX + hw - 1.5, py + 1.5]
        ], true, '#94a3b8', null, 1.1, [], '2');
      }
    }
  }

  const triY = P.H_total * 0.52;
  const hwTri = (P.B_top + 2 * P.slope_m * (P.H_total - triY)) / 2;
  const lxTri = secCenterX - hwTri - 18;
  drawWorldPoly([[lxTri, triY], [lxTri, triY + 40], [lxTri + 40 * P.slope_m, triY + 40]], true, '#22d3ee', null, 1.2, [], 'DIM');
  drawWorldText('1', lxTri - 12, triY + 20, 15, '#22d3ee', 'center', 0, 'DIM');
  drawWorldText(String(P.slope_m), lxTri + 4, triY + 52, 15, '#22d3ee', 'center', 0, 'DIM');

  const rxTri = secCenterX + hwTri + 18;
  drawWorldPoly([[rxTri, triY + 40], [rxTri + 40 * P.slope_m, triY + 40], [rxTri + 40 * P.slope_m, triY]], true, '#22d3ee', null, 1.2, [], 'DIM');
  drawWorldText('1', rxTri + 40 * P.slope_m + 12, triY + 20, 15, '#22d3ee', 'center', 0, 'DIM');
  drawWorldText(String(P.slope_m), rxTri + 4, triY + 52, 15, '#22d3ee', 'center', 0, 'DIM');

  drawLeader([[secCenterX - P.B_rc * 0.38, -P.t * 0.5], [secCenterX - P.B_rc * 0.55, -P.t - 35], [secCenterX - P.B_rc * 0.70, -P.t - 35]], 'RC基礎台', 'right');
  drawLeader([[secCenterX + P.B_bot * 0.22, P.H_cell * 0.35], [secCenterX + P.B_rc * 0.52, -P.t - 25], [secCenterX + P.B_rc * 0.68, -P.t - 25]], '填充塊卵石', 'left');
  drawLeader([[secCenterX + hwTri + 2, triY - 20], [secCenterX + P.B_rc * 0.55, triY - 45], [secCenterX + P.B_rc * 0.70, triY - 45]], `方型鋼管@${P.S_pipe}cm`, 'left');
  drawLeader([[xTopR - 4, P.H_total - 15], [secCenterX + P.B_rc * 0.48, P.H_total + 35], [secCenterX + P.B_rc * 0.65, P.H_total + 35]], `主剛框，\nH型鋼@${+(P.B_cell * (P.trs || 2) / 100).toFixed(1)}m`, 'left');
  drawLeader([[secCenterX, P.H_total - 4], [secCenterX - P.B_top * 0.65, P.H_total + 45], [secCenterX - P.B_top * 0.90, P.H_total + 45]], `橫向支撐桿件，H型鋼@${+(P.B_cell * (P.trs || 2) / 100).toFixed(1)}m`, 'right');

  drawDimH(xTopL, xTopR, P.H_total, P.H_total, P.H_total + 95, `頂寬 ${P.B_top} cm`, true);
  drawDimH(xBotL, xBotR, -P.t, -P.t, -P.t - 75, `底寬 ${P.B_bot} cm (RC台 ${P.B_rc} cm)`, false);
  drawDimV(0, P.H_total, xBotR, xTopR, secCenterX + P.B_rc / 2 + 55, `總高 H = ${P.H_total} cm`, false);

  drawWorldText('斷 面 圖', secCenterX, -P.t - 125, 22, '#38bdf8', 'center', 0, '輔助線');
  drawWorldLine(secCenterX - 95, -P.t - 142, secCenterX + 95, -P.t - 142, '#22d3ee', 1.4, [], '輔助線');

  // =========================================================================
  // 視圖 4：【右側 0605-2 — 口型鋼與H型鋼接合詳圖、樑柱連接詳圖與塗裝表】
  // =========================================================================
  if (showDetails) {
    draw0605_2_Details(L.detailStartX, 0);
  }

  // =========================================================================
  // 視圖 5：【下方工程數量計算式總表】
  // =========================================================================
  if (showTable) {
    drawQuantityTableOnCanvas(L.frontMinX - 180, L.tableTopY, P);
  }
}

function draw0605_2_Details(ox, oy) {
  const jx = ox + 120, jy1 = oy + 260, jy2 = oy + 40;
  [
    { y: jy1, title: '口型鋼與H型鋼接合圖(一) (N.T.S)' },
    { y: jy2, title: '口型鋼與H型鋼接合圖(二) (N.T.S)' }
  ].forEach((item, idx) => {
    const cy = item.y;
    drawWorldPoly([[jx - 45, cy - 75], [jx + 45, cy - 75], [jx + 45, cy + 75], [jx - 45, cy + 75]], true, '#ef4444', 'rgba(239,68,68,0.10)', 1.6, [], 'STEEL');
    drawWorldLine(jx - 6, cy - 75, jx - 6, cy + 75, '#ef4444', 1.2, [6, 4], 'STEEL');
    drawWorldLine(jx + 6, cy - 75, jx + 6, cy + 75, '#ef4444', 1.2, [6, 4], 'STEEL');
    const px = idx === 0 ? jx + 45 : jx - 15;
    drawWorldPoly([[px, cy - 28], [px + 30, cy - 28], [px + 30, cy + 28], [px, cy + 28]], true, '#facc15', 'rgba(250,204,21,0.18)', 1.5, [], 'STEEL');
    [[-16, -16], [-16, 16], [16, -16], [16, 16]].forEach(([bx, by]) => {
      drawWorldCircle(px + 15 + bx * 0.45, cy + by, 2.5, '#22d3ee', '#22d3ee', 1.0, 'DIM');
    });
    drawWorldPoly([[px + 30, cy - 14], [px + 155, cy - 14], [px + 155, cy + 14], [px + 30, cy + 14]], true, '#e879f9', 'rgba(232,121,249,0.15)', 1.5, [], 'C1');
    drawLeader([[jx, cy + 55], [jx + 75, cy + 85], [jx + 105, cy + 85]], 'H型鋼 200x200x8x12mm(鍍鋅防銹)', 'left');
    drawLeader([[px + 95, cy], [px + 125, cy + 45], [px + 145, cy + 45]], '口型鋼(50x50x3.2mm)鍍鋅防銹', 'left');
    drawLeader([[px + 15, cy - 28], [px + 55, cy - 55], [px + 85, cy - 55]], 'PL 100x100x3.2mm與口型鋼滿焊處理 (4-M20 H.S.B)', 'left');
    drawWorldText(item.title, jx + 85, cy - 95, 17, '#38bdf8', 'center', 0, '輔助線');
  });

  const bx = ox + 580, by = oy + 60;
  drawWorldPoly([[bx - 35, by - 90], [bx + 35, by - 90], [bx + 35, by + 150], [bx - 35, by + 150]], true, '#ef4444', 'rgba(239,68,68,0.12)', 1.7, [], 'S-COLS-STEL');
  drawWorldPoly([[bx + 35, by - 45], [bx + 210, by - 45], [bx + 210, by + 105], [bx + 35, by + 105]], true, '#facc15', 'rgba(250,204,21,0.08)', 1.6, [], 'S-METL-DECK');
  drawWorldPoly([[bx + 20, by - 35], [bx + 72, by - 35], [bx + 72, by + 95], [bx + 20, by + 95]], true, '#22d3ee', 'rgba(34,211,238,0.15)', 1.5, [], 'STEEL');
  for (let k = 0; k < 5; k++) {
    const ky = by - 22 + k * 26;
    drawWorldCircle(bx + 52, ky, 3.2, '#ef4444', '#ef4444', 1.2, '鋼筋');
  }
  drawDimH(bx + 20, bx + 72, by + 95, by + 95, by + 130, '60', true);
  drawDimV(by - 22, by + 82, bx + 72, bx + 72, bx + 235, '4@30 (5-M20 H.S.B.)', false);
  drawDimV(by + 82, by + 95, bx + 72, bx + 72, bx + 235, '35', false);
  drawDimV(by - 35, by - 22, bx + 72, bx + 72, bx + 235, '35', false);
  drawWorldText('樑與柱連接詳圖 (H200x200x8x12mm / 鈑厚Tw=14mm)', bx + 95, by - 125, 17, '#38bdf8', 'center', 0, '輔助線');

  const tx = ox + 890, ty = oy + 390;
  const notes = [
    '【0605-2 鋼構造施工與防蝕規範】',
    '1. 本工程所有材料均須為新品，先行檢具製造廠商規格、型錄及檢驗合格證書送審。',
    '2. 焊接方式皆以滿焊處理，所有鋼料均應予以鍍鋅防銹處理及油漆。',
    '3. 所有型鋼、鋼管連接板等主要構材之鍍鋅量應 ≧ 550 g/m²；普通螺栓配件 ≧ 440 g/m²。',
    '4. 表面塗裝系統：防銹底塗採「厚塗型無機鋅粉底漆」(700 g/m²/回，乾膜厚 70μm，CNS 4937 K2088)；',
    '   面漆 3 道採「環氧樹脂柏油漆」(315/270/270 g/m²/回，乾膜厚 70/60/60μm，CNS 4938 K2089)。'
  ];
  drawWorldPoly([[tx - 15, ty + 25], [tx + 540, ty + 25], [tx + 540, ty - 165], [tx - 15, ty - 165]], true, '#334155', 'rgba(15,23,42,0.80)', 1.2, [], 'TEXT');
  notes.forEach((line, i) => {
    drawWorldText(line, tx, ty - i * 28, i === 0 ? 17 : 14.5, i === 0 ? '#fde047' : '#e2e8f0', 'left', 0, 'TEXT');
  });
}

function drawQuantityTableOnCanvas(tx, ty, P) {
  const rows = computeQuantities(P);
  const colW = [65, 390, 75, 610, 110, 350];
  const totalW = colW.reduce((a, b) => a + b, 0);
  const rowH = 38;
  const headH = 44;

  drawWorldPoly([[tx, ty], [tx + totalW, ty], [tx + totalW, ty - headH], [tx, ty - headH]], true, '#38bdf8', 'rgba(2,132,199,0.28)', 1.5, [], 'TABLE');
  drawWorldText('格框式固床工 (圖號：0605-1 / 0605-2) — 參數化工程數量計算式總表 (各層左/右獨立可調反推平面)', tx + totalW / 2, ty - headH / 2, 17, '#38bdf8', 'center', 0, 'TABLE');

  const headers = ['項次', '工 項 名 稱', '單位', '工程數量計算式 (對應圖面 H型鋼、方管格柵、塊卵石、RC基礎台)', '數量', '設計規範備註'];
  let curY = ty - headH;
  drawWorldPoly([[tx, curY], [tx + totalW, curY], [tx + totalW, curY - rowH], [tx, curY - rowH]], true, '#475569', 'rgba(30,41,59,0.85)', 1.2, [], 'TABLE');

  let cx = tx;
  headers.forEach((h, i) => {
    drawWorldText(h, cx + colW[i] / 2, curY - rowH / 2, 14.5, '#fde047', 'center', 0, 'TABLE');
    cx += colW[i];
    if (i < headers.length - 1) drawWorldLine(cx, ty - headH, cx, curY - rowH * (rows.length + 1), '#334155', 1.0, [], 'TABLE');
  });

  curY -= rowH;
  rows.forEach((r, idx) => {
    const bg = idx % 2 === 0 ? 'rgba(15,23,42,0.75)' : 'rgba(30,41,59,0.55)';
    drawWorldPoly([[tx, curY], [tx + totalW, curY], [tx + totalW, curY - rowH], [tx, curY - rowH]], true, '#334155', bg, 1.0, [], 'TABLE');
    let rx = tx;
    const vals = [r.no, r.name, r.unit, r.formula, String(r.qty), r.note];
    vals.forEach((v, i) => {
      const align = (i === 1 || i === 3 || i === 5) ? 'left' : 'center';
      const px = align === 'left' ? rx + 12 : rx + colW[i] / 2;
      const col = i === 4 ? '#4ade80' : (i === 3 ? '#67e8f9' : '#e2e8f0');
      drawWorldText(v, px, curY - rowH / 2, 14, col, align, 0, 'TABLE');
      rx += colW[i];
    });
    curY -= rowH;
  });
}

// ============================================================================
// 7. 視角置中 zoomToFit() 與滑鼠平移/縮放事件
// ============================================================================
function zoomToFit() {
  const rect = canvas.parentElement.getBoundingClientRect();
  const cw = Math.max(800, rect.width || window.innerWidth - 425);
  const ch = Math.max(550, rect.height || window.innerHeight - 44);
  canvas.width = cw;
  canvas.height = ch;

  const P = getParams();
  const showDetails = document.getElementById('chkShowDetails').checked;
  const L = computeDynamicLayout(P, showDetails);
  const { minX, maxX, minY, maxY } = L.bounds;
  camX = (minX + maxX) / 2;
  camY = (minY + maxY) / 2;
  const scaleX = (cw * 0.90) / (maxX - minX);
  const scaleY = (ch * 0.90) / (maxY - minY);
  scale = Math.min(scaleX, scaleY);
  renderCAD();
}

canvas.addEventListener('mousedown', e => {
  if (e.button !== 0) return;
  isDragging = true;
  dragStartX = e.clientX;
  dragStartY = e.clientY;
});
window.addEventListener('mousemove', e => {
  const rect = canvas.getBoundingClientRect();
  const [wx, wy] = screenToWorld(e.clientX - rect.left, e.clientY - rect.top);
  document.getElementById('hud-coords').textContent =
    `世界座標 (cm): X=${wx.toFixed(1)}, Y=${wy.toFixed(1)} | 縮放=${(scale * 100).toFixed(0)}% | 滾輪縮放・左鍵平移・雙擊置中`;
  if (!isDragging) return;
  const dx = e.clientX - dragStartX;
  const dy = e.clientY - dragStartY;
  dragStartX = e.clientX;
  dragStartY = e.clientY;
  camX -= dx / scale;
  camY += dy / scale;
  renderCAD();
});
window.addEventListener('mouseup', () => { isDragging = false; });

canvas.addEventListener('wheel', e => {
  e.preventDefault();
  const rect = canvas.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  const my = e.clientY - rect.top;
  const [wxBefore, wyBefore] = screenToWorld(mx, my);
  const factor = e.deltaY < 0 ? 1.12 : 0.89;
  scale = Math.max(0.03, Math.min(8.0, scale * factor));
  const [wxAfter, wyAfter] = screenToWorld(mx, my);
  camX += (wxBefore - wxAfter);
  camY += (wyBefore - wyAfter);
  renderCAD();
}, { passive: false });

canvas.addEventListener('dblclick', () => zoomToFit());
window.addEventListener('resize', () => renderCAD());

// ============================================================================
// 8. 無彈窗直接下載原生 AutoCAD DXF 與 CSV 數量計算書
// ============================================================================
function toDxfUnicode(str) {
  return String(str).split('').map(ch => {
    const code = ch.charCodeAt(0);
    return code > 127 ? `\\U+${code.toString(16).toUpperCase().padStart(4, '0')}` : ch;
  }).join('');
}

function exportDXF() {
  renderCAD();
  const out = [];
  const push = (c, v) => { out.push(String(c)); out.push(String(v)); };

  push(0, 'SECTION'); push(2, 'HEADER');
  push(9, '$ACADVER'); push(1, 'AC1015');
  push(9, '$INSUNITS'); push(70, 5);
  push(0, 'ENDSEC');

  push(0, 'SECTION'); push(2, 'ENTITIES');
  dxfEntities.forEach(e => {
    const lay = toDxfUnicode(e.layer || '0');
    if (e.type === 'LINE') {
      push(0, 'LINE'); push(8, lay);
      push(10, e.x1.toFixed(3)); push(20, e.y1.toFixed(3)); push(30, '0.0');
      push(11, e.x2.toFixed(3)); push(21, e.y2.toFixed(3)); push(31, '0.0');
    } else if (e.type === 'POLY') {
      push(0, 'LWPOLYLINE'); push(8, lay);
      push(90, e.pts.length);
      push(70, e.closed ? 1 : 0);
      e.pts.forEach(p => {
        push(10, p[0].toFixed(3));
        push(20, p[1].toFixed(3));
      });
    } else if (e.type === 'TEXT') {
      push(0, 'TEXT'); push(8, lay);
      push(10, e.x.toFixed(3)); push(20, e.y.toFixed(3)); push(30, '0.0');
      push(40, (e.h * 0.72).toFixed(2));
      if (e.rotDeg) { push(50, e.rotDeg.toFixed(1)); }
      push(1, toDxfUnicode(e.txt));
    }
  });
  push(0, 'ENDSEC');
  push(0, 'EOF');

  const blob = new Blob([out.join('\r\n')], { type: 'application/dxf;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = '6-05_格框式固床工_左右獨立可調標準圖.dxf';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

function exportCSV() {
  const P = getParams();
  const rows = computeQuantities(P);
  const lines = ['\uFEFF項次,工項名稱,單位,工程數量計算式(對應圖面尺寸),數量,設計規範備註'];
  rows.forEach(r => {
    lines.push(`${r.no},"${r.name}",${r.unit},"${r.formula}",${r.qty},"${r.note}"`);
  });
  const blob = new Blob([lines.join('\r\n')], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = '6-05_格框式固床工_工程數量計算表.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// ============================================================================
// 9. 事件綁定
// ============================================================================
document.getElementById('p_N_layer').addEventListener('change', () => {
  rebuildFrontLayerInputs(false);
  updateSidebarUI();
  renderCAD();
});
document.getElementById('btnResetFrontAuto').addEventListener('click', () => {
  rebuildFrontLayerInputs(true);
  updateSidebarUI();
  renderCAD();
});

['p_B_cell', 'p_H_cell', 'p_N_notch', 'p_B_top', 'p_slope_m', 'p_S_pipe', 'p_d_stone', 'p_t', 'p_k_gap', 'chkShowDetails', 'chkShowTable'].forEach(id => {
  const el = document.getElementById(id);
  el.addEventListener('input', () => { updateSidebarUI(); renderCAD(); });
  el.addEventListener('change', () => { updateSidebarUI(); renderCAD(); });
});

document.getElementById('btnPresetDxf').addEventListener('click', () => {
  document.getElementById('p_N_layer').value = '3';
  document.getElementById('p_B_cell').value = 100;
  document.getElementById('p_H_cell').value = 100;
  document.getElementById('p_N_notch').value = 2;
  document.getElementById('p_B_top').value = 100;
  document.getElementById('p_slope_m').value = 0.20;
  document.getElementById('p_S_pipe').value = 20;
  document.getElementById('p_d_stone').value = 22;
  document.getElementById('p_t').value = 30;
  customLayerLR = [
    { left: 2, right: 2 },
    { left: 3, right: 3 },
    { left: 4, right: 4 }
  ];
  rebuildFrontLayerInputs(false);
  updateSidebarUI();
  zoomToFit();
});

document.getElementById('btnPresetAsym').addEventListener('click', () => {
  document.getElementById('p_N_layer').value = '3';
  document.getElementById('p_B_cell').value = 100;
  document.getElementById('p_H_cell').value = 100;
  document.getElementById('p_N_notch').value = 2;
  document.getElementById('p_B_top').value = 100;
  document.getElementById('p_slope_m').value = 0.20;
  document.getElementById('p_S_pipe').value = 20;
  document.getElementById('p_d_stone').value = 22;
  document.getElementById('p_t').value = 30;
  // 彎道凹岸加寬非對稱範例：左岸較長 (3 -> 5 -> 6 格)、右岸較短 (2 -> 3 -> 4 格)
  customLayerLR = [
    { left: 3, right: 2 },
    { left: 5, right: 3 },
    { left: 6, right: 4 }
  ];
  rebuildFrontLayerInputs(false);
  updateSidebarUI();
  zoomToFit();
});

document.getElementById('btnPreset6Layer').addEventListener('click', () => {
  document.getElementById('p_N_layer').value = '6';
  document.getElementById('p_B_cell').value = 100;
  document.getElementById('p_H_cell').value = 100;
  document.getElementById('p_N_notch').value = 3;
  document.getElementById('p_B_top').value = 100;
  document.getElementById('p_slope_m').value = 0.20;
  document.getElementById('p_S_pipe').value = 20;
  document.getElementById('p_d_stone').value = 22;
  document.getElementById('p_t').value = 50;
  rebuildFrontLayerInputs(true);
  updateSidebarUI();
  zoomToFit();
});

document.getElementById('btnZoomFit').addEventListener('click', () => zoomToFit());
document.getElementById('btnExportDXF').addEventListener('click', () => exportDXF());
document.getElementById('btnExportCSV').addEventListener('click', () => exportCSV());

rebuildFrontLayerInputs(false);
updateSidebarUI();
requestAnimationFrame(() => zoomToFit());

  // ---- v6.3 數量改由圖形計算＋補標註（or3fix.py）----

  function __A(p) { let s = 0; for (let i = 0; i < p.length; i++) { const a = p[i], b = p[(i + 1) % p.length]; s += a[0] * b[1] - b[0] * a[1]; } return Math.abs(s) / 2; }
  function __C(p) { let x = 0, y = 0; p.forEach(q => { x += q[0]; y += q[1]; }); return [x / p.length, y / p.length]; }
  function __notesWrap(HEADH, ROWH, TH, notes) {
    const __q = drawQuantityTableOnCanvas;
    drawQuantityTableOnCanvas = function (tx, ty, P) { const n0 = O.length; __q(tx, ty, P); let yb = Infinity; for (let i = n0; i < O.length; i++) { const o = O[i]; if (o.p) o.p.forEach(v => { yb = Math.min(yb, v[1]); }); else if (Number.isFinite(o.y)) yb = Math.min(yb, o.y); } if (!Number.isFinite(yb)) yb = ty - HEADH - ROWH * (computeQuantities(P).length + 1); const N = notes(P), y0 = yb - TH * 1.6;
      drawWorldText('數量計算依據（圖上未直接標示的推算值與係數）：', tx, y0, TH, '#fde047', 'left', 0, 'TABLE');
      N.forEach((s, i) => drawWorldText('・' + s, tx + TH, y0 - (i + 1) * TH * 1.7, TH * 0.92, '#fde047', 'left', 0, 'TABLE')); };
  }


  { const __P0 = getParams; getParams = function () { const P = __P0(), g = (id, d) => { const v = parseFloat(document.getElementById(id).value); return Number.isFinite(v) ? v : d; };
    const eq = String(document.getElementById('p_LReq').value) !== '0', rcL = g('p_rcL', 25), rcW = g('p_rcW', 42);
    return Object.assign(P, { rcL, rcR: eq ? rcL : g('p_rcR', 25), rcW, B_rc: +(P.B_bot + rcW).toFixed(1), kfill: g('p_kfill', 0.92), hw: g('p_hw', 49.9), kj: g('p_kj', 1.15), rb: g('p_rb', 85), trs: Math.max(1, Math.round(g('p_trs', 2))),
      nTop: Math.max(1, Math.round(P.B_top / P.S_pipe) - 1) }); }; }
  const __geo5 = P => {   // 依圖面（正視、平面、斷面）逐格量測（cm）
    const B = P.B_cell, H = P.H_cell, m = P.slope_m, kS = Math.hypot(1, m), N = P.N_layer, tn = getTopNotchConfig(P.layerLR[N - 1], P.N_notch), bw = y => P.B_top + 2 * m * (P.H_total - y);
    const nP = P.nPipesPerCell, G = { hb: 0, col: 0, dg: 0, tr: 0, pf: 0, pt: 0, vs: 0, cells: 0, kS, colL: H * kS, A: [] };
    for (let lay = 0; lay < N; lay++) {
      const lr = P.layerLR[lay], y0 = lay * H, y1 = y0 + H, isTop = lay === N - 1, nt = isTop && tn.hasNotch, Al = (bw(y0) + bw(y1)) / 2 * H; G.A.push(Al);
      for (let b = -lr.left; b < lr.right; b++) {
        const notch = nt && b >= tn.notchStartB && b <= tn.notchEndB, sl = nt && (b === tn.leftSlopeB || b === tn.rightSlopeB);
        if (notch) { G.hb += B; G.pt += P.nTop * B; }
        else if (sl) { G.hb += B; G.dg += Math.hypot(B, H * kS); G.pf += B * nP / 2; G.pt += P.nTop * Math.hypot(B, H); G.vs += Al * B / 2; G.cells += 0.5; }
        else { G.hb += 2 * B; G.pf += nP * B; if (isTop) G.pt += P.nTop * B; G.vs += Al * B; G.cells += 1; }
      }
      for (let c = -lr.left; c <= lr.right; c++) { const skip = nt && c >= tn.notchStartB && c <= tn.notchEndB + 1; if (!skip) G.col += H * kS; }
    }
    G.ntr = 0;   // 橫向支撐：斷面圖各層緣高程一道（N+1 道），沿寬度每 trs 格一處（斷面圖標註「H型鋼@」）
    for (let k = 0; k <= N; k++) { const ls = [P.layerLR[k - 1], P.layerLR[k]].filter(Boolean), lo = -Math.max(...ls.map(o => o.left)), hi = Math.max(...ls.map(o => o.right)), y = k * H, nt = k === N && tn.hasNotch, pos = [];
      for (let c = lo; c <= hi; c += P.trs) pos.push(c); if (pos[pos.length - 1] !== hi) pos.push(hi);
      pos.forEach(c => { if (nt && c > tn.notchStartB && c < tn.notchEndB + 1) return; G.tr += bw(y); G.ntr++; }); }
    G.face = G.hb + G.col + G.dg; G.Lh = 2 * G.face + G.tr; G.Lp = 2 * G.pf + G.pt;
    const bot = P.layerLR[0]; G.rcLen = bot.total * B + P.rcL + P.rcR; G.Vrc = G.rcLen * P.B_rc * P.t; return G;
  };
  computeQuantities = function (P) {
    const G = __geo5(P), rows = [], f = (v, n) => (+v).toFixed(n === undefined ? 2 : n), d = [...P.layerLR].reverse().map((o, i) => `L${P.N_layer - i}(左${o.left}+右${o.right})`).join(', ');
    rows.push({ no: '1', name: `H型鋼主剛框與支撐 (H200×200×8×12mm, 鍍鋅)`, unit: 't', formula: `2面×${f(G.face / 100, 1)}＋橫撐 ${f(G.tr / 100, 1)}＝${f(G.Lh / 100, 1)} m × ${P.hw} kg/m × ${P.kj}（明細見註記）`, qty: +(G.Lh / 100 * P.hw * P.kj / 1000).toFixed(3), note: `[${d}]；鍍鋅量≧550g/m²` });
    rows.push({ no: '2', name: `方型鋼管格柵 (口50×50×3.2mm @${P.S_pipe}cm, 每格${P.nPipesPerCell}支)`, unit: 'm', formula: `正背 2 面×${f(G.pf / 100, 1)} ＋ 頂面/低水口底面 ${P.nTop} 支×格 ${f(G.pt / 100, 1)}`, qty: +(G.Lp / 100).toFixed(1), note: `PL 100×100×3.2mm 滿焊及4-M20接合` });
    rows.push({ no: '3', name: `格框內填充塊卵石 (平均粒徑 d=${P.d_stone}cm)`, unit: 'm³', formula: `Σ 各層斷面積[${G.A.map(a => f(a / 1e4, 3)).join('、')}] m² × 有效寬（斜坡格 ½）× 實積率 ${P.kfill}；有效 ${G.cells} 格`, qty: +(G.vs / 1e6 * P.kfill).toFixed(2), note: `粒徑大於框架間距 ${P.S_pipe}cm 避免流失` });
    rows.push({ no: '4', name: `RC混凝土基礎台 (底層左${P.layerLR[0].left}+右${P.layerLR[0].right}格, 厚t=${P.t}cm)`, unit: 'm³', formula: `基礎台長 (${P.layerLR[0].total}×${P.B_cell}+左${P.rcL}+右${P.rcR})/100＝${f(G.rcLen / 100)} m × 寬 (B_bot ${P.B_bot}+${P.rcW})/100 × 厚 ${P.t}/100`, qty: +(G.Vrc / 1e6).toFixed(2), note: `原圖標註 RC基礎台 (t=${P.t}cm)` });
    rows.push({ no: '5', name: `RC基礎台鋼筋（估算）`, unit: 't', formula: `原圖無鋼筋表 → ${f(G.Vrc / 1e6)} m³ × ${P.rb} kg/m³`, qty: +(G.Vrc / 1e6 * P.rb / 1000).toFixed(3), note: `圖上註明為估算` });
    return rows;
  };
  { const __rc = renderCAD; renderCAD = function () { __rc(); try {
    const P = getParams(), L = computeDynamicLayout(P, el('chkShowDetails').checked), G = __geo5(P), f = (v, n) => (+v).toFixed(n === undefined ? 2 : n), bot = P.layerLR[0], a = -bot.left * P.B_cell, b = bot.right * P.B_cell;
    drawDimH(a - P.rcL, a, -P.t, -P.t, -P.t - 40, `${P.rcL}`, false); drawDimH(b, b + P.rcR, -P.t, -P.t, -P.t - 40, `${P.rcR}`, false);
    drawWorldText(`RC基礎台長 ${f(G.rcLen, 0)} cm（底層 ${bot.total}×${P.B_cell} ＋ 左 ${P.rcL} ＋ 右 ${P.rcR}）`, (a + b) / 2, -P.t - 135, 15, '#fde047', 'center', 0, 'DIM');
    const sx = L.secCenterX + P.B_rc / 2 + 30; drawWorldText(`立柱斜長 ${f(G.colL, 1)}`, sx, P.H_total * 0.8, 15, '#fde047', 'left', 0, 'DIM');
    drawWorldText(`斷面積 A＝(${P.B_top}+${P.B_bot})/2×${P.H_total}＝${f((P.B_top + P.B_bot) / 2 * P.H_total / 1e4, 3)} m²`, L.secCenterX, -P.t - 170, 15, '#fde047', 'center', 0, 'DIM');
    drawWorldText(`RC 台寬 B_rc＝${P.B_bot}＋${P.rcW}＝${P.B_rc}`, L.secCenterX, -P.t - 195, 15, '#fde047', 'center', 0, 'DIM');
  } catch (e) { } }; }
  __notesWrap(44, 38, 15, P => { const G = __geo5(P), f = (v, n) => (+v).toFixed(n === undefined ? 1 : n); return [
    `H型鋼量測：每面橫樑 ${f(G.hb / 100)} m、立柱 ${f(G.col / 100)} m（斜長 ${f(G.colL)} cm＝H√(1+m²)）、低水口斜撐 ${f(G.dg / 100)} m；兩面合計 ×2；橫向支撐 ${G.ntr} 支（${P.N_layer + 1} 道層緣×每 ${P.trs} 格，長＝該高程斷面寬）${f(G.tr / 100)} m`,
    `H型鋼單位重 ${P.hw} kg/m、接合板與螺栓加成 ${P.kj}；方管：每格 ${P.nPipesPerCell} 支×2 面，頂面／低水口底面每格 ${P.nTop} 支（＝B_top/S−1）`,
    `塊卵石實積率 ${P.kfill}；RC 台寬＝B_bot＋${P.rcW}、左右外伸 ${P.rcL}／${P.rcR} cm；RC 鋼筋原圖無表，以 ${P.rb} kg/m³ 估算`]; });
  function __lrInit() { const N = Math.max(1, Math.min(10, parseInt(el('p_N_layer').value) || 3)), D = computeDefaultLR(N), A = Array.isArray(RR.__lr) ? RR.__lr : [];
    customLayerLR = []; D.forEach((d, i) => { const p = customLayerLR[i - 1]; customLayerLR.push(A[i] ? { left: Math.max(0, Math.round(+A[i].left) || 0), right: Math.max(0, Math.round(+A[i].right) || 0) } : (A.length && p ? { left: p.left + 1, right: p.right + 1 } : d)); });   // 新增層：比照原工具，往外各加 1 格
    customLayerLR.forEach(o => { if (o.left + o.right < 1) o.right = 1; }); }

  // ---- 圖元輸出（覆寫原工具的 Canvas 繪圖函式）----
function drawWorldLine(x1, y1, x2, y2, color = '#ffffff', width = 1.4, dash = [], layer = '0') { O.push({ k: 'L', p: [[x1, y1], [x2, y2]], c: color, w: width, d: dash || [], ly: layer }); }
function drawWorldPoly(pts, closed = true, strokeCol = '#ffffff', fillCol = null, width = 1.5, dash = [], layer = '0') { if (pts && pts.length >= 2) O.push({ k: 'P', p: pts.map(q => [q[0], q[1]]), c: strokeCol, w: width, f: fillCol, cl: !!closed, d: dash || [], ly: layer }); }
function drawWorldCircle(cx, cy, r, strokeCol = '#94a3b8', fillCol = null, width = 1.1, layer = '2') { O.push({ k: 'C', x: cx, y: cy, r, c: strokeCol, f: fillCol, w: width, ly: layer }); }
function drawWorldText(txt, wx, wy, worldH = 18, color = '#22d3ee', align = 'center', rotDeg = 0, layer = '文字') { const L = String(txt).split('\n'); L.forEach((s, i) => O.push({ k: 'T', x: wx, y: wy - (i - (L.length - 1) / 2) * worldH * 1.25, s, h: worldH, c: color, al: align, bl: 'middle', rot: (rotDeg || 0) * Math.PI / 180, ly: layer })); }
function drawArConcHatch(xMin, yMin, w, h) { __conc([[xMin, yMin], [xMin + w, yMin], [xMin + w, yMin + h], [xMin, yMin + h]]); }
function __conc(polyPts) {
  if (!polyPts || polyPts.length < 3) return; const xs = polyPts.map(p => p[0]), ys = polyPts.map(p => p[1]), x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  O.push({ k: 'CB', p: polyPts.map(p => [p[0], p[1]]) });
  for (let gx = x0; gx < x1; gx += 42) for (let gy = y0; gy < y1; gy += 42) [[[gx + 8, gy + 10], [gx + 17, gy + 6], [gx + 13, gy + 18]], [[gx + 26, gy + 24], [gx + 35, gy + 28], [gx + 29, gy + 36]]].forEach(t => O.push({ k: 'P', p: t, c: 'rgba(148,163,184,0.55)', w: 1, f: null, cl: true, d: [] }));
  O.push({ k: 'CE' });
}
  let LAST_L = null;   // v5.7：記錄原工具的視圖排版（各視圖原點），供平面／縱橫斷面取用原圖視圖
  { const __f = computeDynamicLayout; computeDynamicLayout = function (P) { return (LAST_L = __f(P)); }; }
  return {
    DEF, PR: [{"k": "p_N_layer", "nm": "格框疊砌層數 N_layer (1~10層)", "def": "3", "g": 0, "opt": [["1", "1 層"], ["2", "2 層"], ["3", "3 層 (原圖 H=300cm)"], ["4", "4 層"], ["5", "5 層"], ["6", "6 層"], ["7", "7 層"], ["8", "8 層"], ["9", "9 層"], ["10", "10 層"]]}, {"k": "p_N_notch", "nm": "中央複式低水口底部格數 N_notch (格)", "def": "2", "g": 0, "st": "1", "min": "0", "max": "50"}, {"k": "p_B_cell", "nm": "單一格框水平跨度 B_cell (cm)", "def": "100", "g": 0, "st": "10", "min": "50", "max": "250"}, {"k": "p_H_cell", "nm": "單一格框垂直層高 H_cell (cm)", "def": "100", "g": 0, "st": "10", "min": "50", "max": "250"}, {"k": "p_B_top", "nm": "斷面頂部前後格寬 B_top (cm)", "def": "100", "g": 1, "st": "10", "min": "60", "max": "300"}, {"k": "p_slope_m", "nm": "上下游坡度 m (1:m, 原圖 1:0.2)", "def": "0.20", "g": 1, "st": "0.05", "min": "0.0", "max": "0.6"}, {"k": "p_S_pipe", "nm": "方型鋼管(50×50)間距 S_pipe (cm)", "def": "20", "g": 1, "st": "5", "min": "10", "max": "50"}, {"k": "p_d_stone", "nm": "填充塊卵石平均粒徑 d_stone (cm)", "def": "22", "g": 1, "st": "2", "min": "12", "max": "50"}, {"k": "p_t", "nm": "RC基礎台厚度 t (原圖 30cm)", "def": "30", "g": 1, "st": "5", "min": "20", "max": "120"}, {"k": "p_k_gap", "nm": "視圖相對安全間距係數 k_gap", "def": "1.0", "g": 1, "st": "0.1", "min": "0.6", "max": "2.5"}, {"k": "p_LReq", "nm": "RC外伸左右", "def": "1", "opt": [["1", "左右相同（右側跟左側）"], ["0", "左右分開"]], "g": 3}, {"k": "p_rcL", "nm": "RC基礎台左外伸 (cm)", "def": "25", "st": "5", "min": "0", "max": "300", "g": 3}, {"k": "p_rcR", "nm": "RC基礎台右外伸 (cm)", "def": "25", "st": "5", "min": "0", "max": "300", "g": 3}, {"k": "p_rcW", "nm": "RC台寬－斷面底寬 (cm)", "def": "42", "st": "2", "min": "0", "max": "200", "g": 3}, {"k": "p_kfill", "nm": "塊卵石實積率", "def": "0.92", "st": "0.01", "min": "0.5", "max": "1", "g": 3}, {"k": "p_hw", "nm": "H型鋼單位重 (kg/m)", "def": "49.9", "st": "0.1", "min": "10", "max": "200", "g": 3}, {"k": "p_kj", "nm": "接合板螺栓加成係數", "def": "1.15", "st": "0.01", "min": "1", "max": "1.5", "g": 3}, {"k": "p_trs", "nm": "橫向支撐間距 (格)", "def": "2", "st": "1", "min": "1", "max": "5", "g": 3}, {"k": "p_rb", "nm": "RC鋼筋估算 (kg/m³)", "def": "85", "st": "5", "min": "30", "max": "200", "g": 3}], GT: ["1. 層數、低水口與各層左/右格數設定", "2. 斷面梯形斜率、鋼管與塊卵石參數", "3. 原圖設計原則與規範自動檢核", "左右分開與係數"], title: "水保標準圖參數化 CAD — 格框式固床工 (圖號：0605-1 / 0605-2 左右獨立調整版)",
    run(R, opt) {
      RR = R || {}; OPT = Object.assign({}, opt || {}); O = [];
      try {
        __lrInit();
        LAST_L = null; const P = getParams(), rows = computeQuantities(P);
        let checks = [];
        try { updateSidebarUI(); const t = el('normCheckList').innerHTML || ''; checks = [...t.matchAll(/<div class="check-item ?(warn)?">([\s\S]*?)<\/div>/g)].map(m => ({ ok: !m[1], text: m[2].replace(/^\s*[✔⚠]\s*/, '').replace(/<[^>]+>/g, '') })); } catch (e) { }
        if (OPT.draw) renderCAD();
        return { P, rows, checks, O, L: LAST_L };
      } finally { RR = null; }
    }
  };
})();
