/* v8.0 三種結構物原工具移植（gen_st3.py 自動產生，勿手改；改 st3src/*.js 或 gen_st3.py 後重跑） */
TCO_S['comb'] = (function () {   // v8.0 梳子壩（直線型）（原工具沙盒；gen_st3.py 自動產生）
  const GT = ["1. 梳子開口與溢流段（左右分開）", "2. 斜坡翼牆、翼牆與兩岸（左右分開）", "3. 壩身斷面與基礎", "4. 前庭漿砌石槽與護坦（下游）", "5. 鋼筋（原圖無鋼筋表，kg/m³ 估算）與配筋標註"];
  const PR = [{"k": "p_N_pier", "nm": "梳齒墩數 N_pier", "def": "5", "st": "1", "min": "1", "max": "30", "g": 0}, {"k": "p_W_pier", "nm": "梳齒墩寬 W_pier (cm)", "def": "250", "st": "10", "min": "50", "max": "1000", "g": 0}, {"k": "p_W_slot", "nm": "開口淨寬 W_slot (cm)", "def": "150", "st": "10", "min": "30", "max": "1000", "g": 0}, {"k": "p_W_ovf_L", "nm": "左溢流段寬 W_ovf_L (cm)", "def": "2425", "st": "10", "min": "0", "max": "20000", "g": 0}, {"k": "p_W_ovf_R", "nm": "右溢流段寬 W_ovf_R (cm)", "def": "2425", "st": "10", "min": "0", "max": "20000", "g": 0}, {"k": "p_W_slope_L", "nm": "左斜坡翼牆水平寬 (cm)", "def": "500", "st": "10", "min": "50", "max": "3000", "g": 1}, {"k": "p_W_slope_R", "nm": "右斜坡翼牆水平寬 (cm)", "def": "500", "st": "10", "min": "50", "max": "3000", "g": 1}, {"k": "p_W_wing_L", "nm": "左翼牆頂水平長 (cm)", "def": "2200", "st": "10", "min": "100", "max": "10000", "g": 1}, {"k": "p_W_wing_R", "nm": "右翼牆頂水平長 (cm)", "def": "2500", "st": "10", "min": "100", "max": "10000", "g": 1}, {"k": "p_W_cut_L", "nm": "左岸壩底斜坡縮減 (cm)", "def": "1000", "st": "10", "min": "0", "max": "10000", "g": 1}, {"k": "p_W_cut_R", "nm": "右岸壩底斜坡縮減 (cm)", "def": "1200", "st": "10", "min": "0", "max": "10000", "g": 1}, {"k": "p_H_wing_rise", "nm": "翼牆頂端加高 (cm)", "def": "150", "st": "10", "min": "0", "max": "1000", "g": 1}, {"k": "p_H_lower", "nm": "下段壩高（溢流口以下）H_lower (cm)", "def": "600", "st": "10", "min": "100", "max": "3000", "g": 2}, {"k": "p_H_upper", "nm": "上段壩高（翼牆）H_upper (cm)", "def": "500", "st": "10", "min": "50", "max": "3000", "g": 2}, {"k": "p_T_base", "nm": "基礎底版厚 (cm)", "def": "100", "st": "10", "min": "30", "max": "500", "g": 2}, {"k": "p_D_key", "nm": "止滑齒牆深（0＝無）(cm)", "def": "300", "st": "10", "min": "0", "max": "1000", "g": 2}, {"k": "p_B_key_bot", "nm": "止滑齒牆底寬 (cm)", "def": "100", "st": "10", "min": "30", "max": "1000", "g": 2}, {"k": "p_B_wing_top", "nm": "翼牆最高頂寬 (cm)", "def": "150", "st": "10", "min": "50", "max": "1000", "g": 2}, {"k": "p_B_weir_top", "nm": "溢流段頂寬（翼牆底）(cm)", "def": "180", "st": "10", "min": "50", "max": "1000", "g": 2}, {"k": "p_B_mid", "nm": "中段折點寬（溢流口頂寬）(cm)", "def": "280", "st": "10", "min": "50", "max": "2000", "g": 2}, {"k": "p_S_up", "nm": "上游壩面坡 1:S_up", "def": "0.3", "st": "0.05", "min": "0", "max": "2", "g": 2}, {"k": "p_S_dn", "nm": "下游壩面坡 1:S_dn", "def": "0.5", "st": "0.05", "min": "0", "max": "2", "g": 2}, {"k": "p_B_stone_top", "nm": "前庭漿砌石槽頂寬 (cm)", "def": "200", "st": "10", "min": "0", "max": "2000", "g": 3}, {"k": "p_B_stone_bot", "nm": "前庭漿砌石槽底寬 (cm)", "def": "100", "st": "10", "min": "0", "max": "2000", "g": 3}, {"k": "p_D_stone_up", "nm": "前庭漿砌石槽深 (cm)", "def": "400", "st": "10", "min": "0", "max": "2000", "g": 3}, {"k": "p_L_apron_dn", "nm": "護坦長（半橢圓短軸）(cm)", "def": "1500", "st": "10", "min": "0", "max": "10000", "g": 3}, {"k": "p_T_apron_dn", "nm": "護坦厚 (cm)", "def": "100", "st": "10", "min": "0", "max": "500", "g": 3}, {"k": "p_S_apron", "nm": "護坦坡度 (%)", "def": "3.8", "st": "0.1", "min": "0", "max": "30", "g": 3}, {"k": "p_D_rock", "nm": "塊石代表粒徑 (cm)", "def": "100", "st": "10", "min": "20", "max": "300", "g": 3}, {"k": "p_rbk", "nm": "鋼筋估算量 (kg/m³，含損耗)", "def": "4.44", "st": "0.01", "min": "0", "max": "300", "g": 4}, {"k": "p_C_rebar", "nm": "鋼筋保護層 (cm)", "def": "15", "st": "1", "min": "3", "max": "30", "g": 4}, {"k": "p_S_rebar_main", "nm": "主筋間距（標註）(cm)", "def": "30", "st": "5", "min": "10", "max": "100", "g": 4}, {"k": "p_S_rebar_pier", "nm": "墩筋間距（標註）(cm)", "def": "60", "st": "5", "min": "10", "max": "200", "g": 4}];
  const DEF = {}; PR.forEach(q => { DEF[q.k] = q.def; });

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
  const __H = (function () {

/* ============================================================================
 * SWC Parametric Standard Drawing System - Slit Sabo Dam (0K+339.3)
 * Pure ASCII Identifiers | Dynamic Bounding-Box Layout | DXF & CSV Exporter
 * ============================================================================ */

// 1. Default Standard Parameters (100% exact match with P7 & P8 DXF)
const DEFAULT_PARAMS = {
  N_pier: 5,           // 梳齒墩數量 (無上限，預設 5 墩 -> 6 槽)
  pierHeights: [600, 500, 500, 500, 600], // 各座梳齒墩獨立高度 (cm)
  W_pier: 250,         // 梳齒墩單座寬度 (cm)
  W_slot: 150,         // 梳子開口單孔淨寬 (cm)
  W_ovf_L: 2425,       // 左側一般溢流段寬 (cm)
  W_ovf_R: 2425,       // 右側一般溢流段寬 (cm)
  W_slope: 500,        // 溢流口兩側斜坡翼牆水平寬 (cm)
  W_wing_L: 2200,      // 左岸翼牆頂水平長 (cm)
  W_wing_R: 2500,      // 右岸翼牆頂水平長 (cm)
  W_cut_L: 1000,       // 左岸壩底斜坡縮減長 (cm)
  W_cut_R: 1200,       // 右岸壩底斜坡縮減長 (cm)

  H_wing_rise: 150,    // 翼牆頂端高差 (cm)
  H_upper: 500,        // 上段壩身高度 / 預設內側梳齒墩高 (cm)
  H_lower: 600,        // 下段壩身高度 / 預設外側梳齒墩高 (cm)
  T_base: 100,         // 基礎底版厚度 (cm)
  D_key: 300,          // 上游止滑齒牆深度 (cm)

  B_wing_top: 150,     // 翼牆最高頂寬 (cm)
  B_weir_top: 180,     // 溢流段頂寬 (cm)
  B_mid: 280,          // 壩身中段折點寬度 (cm)
  S_up: 0.3,           // 上游壩面坡度 1 : S_up
  S_dn: 0.5,           // 下游壩面坡度 1 : S_dn
  B_key_bot: 100,      // 止滑齒牆底寬 (cm)

  L_apron_dn: 1500,    // 下游消能池漿砌塊石護坦長 (cm)
  T_apron_dn: 100,     // 下游漿砌塊石護坦厚度 (cm)
  S_apron: 3.8,        // 下游護坦坡度 (%)
  D_stone_up: 400,     // 上游前庭漿砌塊石深度 (cm)
  D_rock: 100,         // 漿砌塊石代表粒徑 (cm)

  C_rebar: 15,         // 鋼筋保護層厚度 (cm)
  S_rebar_main: 30,    // 壩身及底版主筋間距 (cm)
  S_rebar_pier: 60     // 梳齒墩配筋間距 (cm)
};

const PRESETS = {
  default: {
    ...DEFAULT_PARAMS,
    pierHeights: [600, 500, 500, 500, 600]
  },
  medium: {
    ...DEFAULT_PARAMS,
    N_pier: 3,
    pierHeights: [450, 380, 450],
    W_pier: 220,
    W_slot: 140,
    W_ovf_L: 1690,
    W_ovf_R: 1690,
    W_slope: 400,
    W_wing_L: 1500,
    W_wing_R: 1600,
    W_cut_L: 700,
    W_cut_R: 800,
    H_wing_rise: 120,
    H_upper: 380,
    H_lower: 450,
    T_base: 100,
    D_key: 200,
    L_apron_dn: 1200
  },
  large: {
    ...DEFAULT_PARAMS,
    N_pier: 7,
    pierHeights: [650, 600, 550, 500, 550, 600, 650],
    W_pier: 250,
    W_slot: 150,
    W_ovf_L: 2525,
    W_ovf_R: 2525,
    W_slope: 550,
    W_wing_L: 2600,
    W_wing_R: 2800,
    W_cut_L: 1100,
    W_cut_R: 1300,
    H_wing_rise: 150,
    H_upper: 550,
    H_lower: 650,
    T_base: 120,
    D_key: 330,
    L_apron_dn: 1800
  }
};

// Active state (Default to 'ALL' so user sees both Structure + Rebar drawings immediately)
let params = { ...DEFAULT_PARAMS, pierHeights: [...DEFAULT_PARAMS.pierHeights] };
let currentViewMode = 'ALL'; // 'ALL' | 'PAGE_07' | 'PAGE_08'
let showRefOverlay = false;
let drawerOpen = true;

// Viewport camera state (Canvas 2D pan & zoom)
let cam = {
  x: 0,
  y: 0,
  scale: 0.055,
  isDragging: false,
  dragStartX: 0,
  dragStartY: 0,
  camStartX: 0,
  camStartY: 0
};

// Geometry primitive accumulator & active target buffer for BBox-measured sub-views
let scenePrimitives = [];
let activeBuffer = scenePrimitives;
let sceneBounds = { minX: 0, minY: 0, maxX: 15000, maxY: 10000 };

// Deterministic pseudo-random generator for natural boulders
function seededRandom(seed) {
  let x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

// Ensure pierHeights array always matches N_pier length
function syncPierHeightsArray(p) {
  const n = Math.max(1, Math.round(p.N_pier));
  p.N_pier = n;
  if (!Array.isArray(p.pierHeights)) {
    p.pierHeights = [];
  }
  while (p.pierHeights.length < n) {
    const idx = p.pierHeights.length;
    const isOuter = (idx === 0 || idx === n - 1);
    p.pierHeights.push(isOuter ? p.H_lower : p.H_upper);
  }
  if (p.pierHeights.length > n) {
    p.pierHeights.length = n;
  }
}

// Render dynamic per-pier height inputs in left sidebar
function renderPierHeightInputs() {
  syncPierHeightsArray(params);
  const container = document.getElementById('pierHeightsContainer');
  if (!container) return;
  let html = '';
  for (let i = 0; i < params.N_pier; i++) {
    const hVal = params.pierHeights[i];
    html += `
      <div class="flex items-center justify-between bg-[#0d1117] px-2 py-1 rounded border border-[#30363d]/80">
        <span class="text-[11px] text-[#8b949e] mono">第${i + 1}墩 H_p${i + 1}</span>
        <input type="number" value="${hVal}" min="100" max="2500" step="10"
          oninput="onPierHeightChange(${i}, this.value)"
          class="cad-input !w-[64px] !py-0.5 !text-[11px]">
      </div>
    `;
  }
  container.innerHTML = html;
}

function stepPierCount(delta) {
  const nextVal = Math.max(1, Math.round(params.N_pier) + delta);
  document.getElementById('inp_N_pier').value = nextVal;
  onPierCountChange(nextVal);
}

function onPierCountChange(rawVal) {
  const n = Math.max(1, Math.round(parseFloat(rawVal) || 1));
  const prevN = params.N_pier;
  params.N_pier = n;

  // Smartly maintain symmetry when adding piers if previously standard
  if (n > prevN) {
    while (params.pierHeights.length < n) {
      if (params.pierHeights.length >= 2) {
        // Insert inner pier before the right-most outer pier
        const rightOuter = params.pierHeights.pop();
        params.pierHeights.push(params.H_upper);
        params.pierHeights.push(rightOuter);
      } else {
        params.pierHeights.push(params.H_lower);
      }
    }
  } else if (n < prevN) {
    params.pierHeights.length = n;
  }

  renderPierHeightInputs();
  updateSidebarUI();
  renderCAD();
}

function onPierHeightChange(idx, rawVal) {
  const val = parseFloat(rawVal);
  if (isNaN(val) || val < 50) return;
  params.pierHeights[idx] = val;
  updateSidebarUI();
  renderCAD();
}

function applyPierHeightPattern(mode) {
  syncPierHeightsArray(params);
  const n = params.N_pier;
  const mid = (n - 1) / 2;
  for (let i = 0; i < n; i++) {
    if (mode === 'std') {
      params.pierHeights[i] = (i === 0 || i === n - 1) ? params.H_lower : params.H_upper;
    } else if (mode === 'uniform') {
      params.pierHeights[i] = params.H_lower;
    } else if (mode === 'step') {
      const distRatio = mid > 0 ? Math.abs(i - mid) / mid : 1;
      params.pierHeights[i] = Math.round((params.H_upper + distRatio * (params.H_lower - params.H_upper)) / 10) * 10;
    }
  }
  renderPierHeightInputs();
  updateSidebarUI();
  renderCAD();
  showToast('已更新各座梳齒墩高度配置');
}

// ============================================================================
// 2. Derived Geometry & Engineering Quantity Calculation Engine (Per-Pier Dynamic)
// ============================================================================
function computeDerivedAndQuantities(p) {   // v8.0：改為依圖面幾何計算（取代原工具校正常數）；鋼筋以 kg/m³ 估算（原圖無鋼筋表）
  syncPierHeightsArray(p);
  const N_pier = p.N_pier, N_slot = N_pier + 1;
  const pierHeights = p.pierHeights.map(h => Math.max(50, Number(h) || p.H_upper));
  const maxPierH = Math.max(...pierHeights, p.H_lower);
  const W_slit = N_pier * p.W_pier + N_slot * p.W_slot;
  const W_weir = p.W_ovf_L + W_slit + p.W_ovf_R;
  const L_total = p.W_wing_L + p.W_slope_L + W_weir + p.W_slope_R + p.W_wing_R;
  const L_base = Math.max(100, L_total - p.W_cut_L - p.W_cut_R);
  const H_total = p.D_key + p.T_base + p.H_lower + p.H_upper + p.H_wing_rise;
  const H_dam_body = p.H_lower + p.H_upper, Hd = H_dam_body;
  const dH_slot = Math.max(0, p.H_lower - p.H_upper);
  const B_base = p.B_mid + p.H_lower * (p.S_up + p.S_dn);
  const B_slot = B_base - p.H_upper * (p.S_up + p.S_dn);
  const B_key_top = p.D_key > 0 ? (p.B_key_bot + p.D_key * p.S_up) : 0;
  const L_heel = B_base - B_key_top;
  const getPierTopWidthCm = (hCm) => Math.max(80, B_base - hCm * (p.S_up + p.S_dn));
  const B_stone_up_top = p.B_stone_top, B_stone_up_bot = p.B_stone_bot;
  const M = v => v / 100, f = (v, d) => (+v).toFixed(d === undefined ? 2 : d);
  // 正視幾何（x 沿壩軸自左端起，z 自底版頂起）
  const xSlitL = p.W_wing_L + p.W_slope_L + p.W_ovf_L, xSlitR = xSlitL + W_slit;
  const endL = z => p.W_cut_L * (1 - z / Hd), endR = z => L_total - p.W_cut_R * (1 - z / Hd);   // 兩岸端面斜線
  const xWeirL = p.W_wing_L + p.W_slope_L, xWeirR = xSlitR + p.W_ovf_R;
  const slpL = z => xWeirL - p.W_slope_L * (z - p.H_lower) / p.H_upper, slpR = z => xWeirR + p.W_slope_R * (z - p.H_lower) / p.H_upper;
  const Llb_L = xSlitL - endL(0), Llt_L = xSlitL - endL(p.H_lower), Llb_R = endR(0) - xSlitR, Llt_R = endR(p.H_lower) - xSlitR;   // 下段壩身底／頂長（溢流段＋斜坡＋翼牆，扣梳子開口）
  const Lub_L = slpL(p.H_lower) - endL(p.H_lower), Lut_L = p.W_wing_L, Lub_R = endR(p.H_lower) - slpR(p.H_lower), Lut_R = p.W_wing_R;   // 上段（翼牆）
  const pz = (H, Bb, Bt, Lb, Lt) => H / 6 * ((2 * Bb + Bt) * Lb + (2 * Bt + Bb) * Lt);   // 擬柱體（寬、長皆隨高線性）
  // 1. 混凝土
  const V_key = p.D_key > 0 ? (B_key_top + p.B_key_bot) / 2 * p.D_key * L_base : 0;
  const V_base_slab = L_base * B_base * p.T_base;
  let V_piers_net = 0; pierHeights.forEach(h => { V_piers_net += (getPierTopWidthCm(h) + B_base) / 2 * h * p.W_pier; });
  const V_lower_wings = pz(p.H_lower, B_base, p.B_mid, Llb_L + Llb_R, Llt_L + Llt_R);
  const V_upper_wings = pz(p.H_upper, p.B_mid, p.B_weir_top, Lub_L + Lub_R, Lut_L + Lut_R);
  const V_top_rise = pz(p.H_wing_rise, p.B_weir_top, p.B_wing_top, p.W_wing_L + p.W_wing_R, 0);
  const V_conc = (V_key + V_base_slab + V_piers_net + V_lower_wings + V_upper_wings + V_top_rise) / 1e6;
  // 2. 模板（依斷面實際坡面長；兩岸端面、壩頂、止滑齒牆底不組模）
  const sfUp = Math.hypot(1, p.S_up), sfDn = Math.hypot(1, p.S_dn);
  const kUpDn = (p.H_upper * p.S_up + p.B_weir_top - p.B_mid) / p.H_upper, kRsDn = p.H_wing_rise > 0 ? (p.H_wing_rise * p.S_up + p.B_wing_top - p.B_weir_top) / p.H_wing_rise : 0;
  const sfUpDn = Math.hypot(1, kUpDn), sfRsDn = Math.hypot(1, kRsDn);
  const A_form_base = L_base * ((p.D_key + p.T_base) + p.T_base);
  let A_form_pier_sides = (p.B_mid + B_base) / 2 * p.H_lower * 2, sumPierFaceArea = 0;
  pierHeights.forEach(h => { A_form_pier_sides += 2 * (getPierTopWidthCm(h) + B_base) / 2 * h; sumPierFaceArea += p.W_pier * h; });
  const A_low_front = (Llb_L + Llt_L) / 2 * p.H_lower + (Llb_R + Llt_R) / 2 * p.H_lower;
  const A_form_lower_faces = (sfDn + sfUp) * (A_low_front + sumPierFaceArea);
  const A_up_front = (Lub_L + Lut_L) / 2 * p.H_upper + (Lub_R + Lut_R) / 2 * p.H_upper, A_rise_front = (p.W_wing_L + p.W_wing_R) * p.H_wing_rise / 2;
  const A_form_upper_faces = (sfUp + sfUpDn) * A_up_front + (sfUp + sfRsDn) * A_rise_front;
  const sLenL = Math.hypot(p.W_slope_L, p.H_upper), sLenR = Math.hypot(p.W_slope_R, p.H_upper);
  const A_form_wing_slopes = (p.B_weir_top + p.B_mid) / 2 * (sLenL + sLenR);
  const A_form = (A_form_base + A_form_pier_sides + A_form_lower_faces + A_form_upper_faces + A_form_wing_slopes) / 1e4;
  // 3. 鋼筋（S5b：原圖無鋼筋表 → kg/m³ 估算）
  const W_rebar = V_conc * p.rbk;
  // 原工具配筋圖標註用（支數、跨距；不再用於計重）
  const m_rebar_span = Number(((L_base - 2 * p.C_rebar) / 100).toFixed(1));
  const n_bays_main = Math.round(m_rebar_span / (p.S_rebar_main / 100));
  const L_outer_u = Number((7.3 * (p.H_lower / 600)).toFixed(1));
  const n_pier_bars = Math.max(2, Math.round((p.W_pier - 30) / p.S_rebar_pier)), n_pier_anc = Math.max(2, n_pier_bars - 1);
  // 4. 漿砌塊石：下游端漿砌石槽（梯形）＋半橢圓護坦
  const A_apron = Math.PI / 4 * W_weir * p.L_apron_dn;
  const A_apron_dn = Number((A_apron / 1e4).toFixed(2));
  const V_stone_up = (B_stone_up_top + B_stone_up_bot) / 2 * p.D_stone_up * L_base / 1e6, V_stone_dn = A_apron * p.T_apron_dn / 1e6, V_stone = V_stone_up + V_stone_dn;
  // 計算式字串（圖上數量表）
  const f_conc_str1 = `止滑齒牆 (${f(M(B_key_top))}+${f(M(p.B_key_bot))})/2×${f(M(p.D_key))}×${f(M(L_base))}＋底版 ${f(M(L_base))}×${f(M(B_base))}×${f(M(p.T_base))}＋梳齒墩 Σ(${N_pier}墩)=${f(V_piers_net / 1e6)}＋下段壩身 ${f(M(p.H_lower))}/6×[(2×${f(M(B_base))}+${f(M(p.B_mid))})×(${f(M(Llb_L))}+${f(M(Llb_R))})+(2×${f(M(p.B_mid))}+${f(M(B_base))})×(${f(M(Llt_L))}+${f(M(Llt_R))})]`;
  const f_conc_str2 = `＋上段翼牆 ${f(M(p.H_upper))}/6×[(2×${f(M(p.B_mid))}+${f(M(p.B_weir_top))})×(${f(M(Lub_L))}+${f(M(Lub_R))})+(2×${f(M(p.B_weir_top))}+${f(M(p.B_mid))})×(${f(M(Lut_L))}+${f(M(Lut_R))})]＋翼牆加高 ${f(M(p.H_wing_rise))}/6×(2×${f(M(p.B_weir_top))}+${f(M(p.B_wing_top))})×${f(M(p.W_wing_L + p.W_wing_R))} = ${f(V_conc)} m3`;
  const f_form_str1 = `底版 ${f(M(L_base))}×(${f(M(p.D_key + p.T_base))}+${f(M(p.T_base))})＋開口側牆 ${f(A_form_pier_sides / 1e4)}＋下段壩面 (${f(sfDn, 3)}+${f(sfUp, 3)})×(${f(A_low_front / 1e4)}+墩面 ${f(sumPierFaceArea / 1e4)})`;
  const f_form_str2 = `＋上段壩面 (${f(sfUp, 3)}+${f(sfUpDn, 3)})×${f(A_up_front / 1e4)}＋加高 (${f(sfUp, 3)}+${f(sfRsDn, 3)})×${f(A_rise_front / 1e4)}＋斜坡翼牆面 ${f(M((p.B_weir_top + p.B_mid) / 2))}×(${f(M(sLenL))}+${f(M(sLenR))}) = ${f(A_form)} m2`;
  const f_rebar_str1 = `原圖無鋼筋表，以 ${p.rbk} kg/m³ 估算（含損耗）`;
  const f_rebar_str2 = `${p.rbk}×混凝土 ${f(V_conc)} m³ = ${f(W_rebar)} kg`;
  const f_stone_str = `(${f(M(B_stone_up_top))}+${f(M(B_stone_up_bot))})/2×${f(M(p.D_stone_up))}×${f(M(L_base))}＋半橢圓護坦 π/4×${f(M(W_weir))}×${f(M(p.L_apron_dn))}=${A_apron_dn}×${f(M(p.T_apron_dn))} = ${f(V_stone)} m3`;
  const uniquePierHeights = []; pierHeights.forEach(h => { if (!uniquePierHeights.some(u => Math.abs(u - h) < 0.5)) uniquePierHeights.push(h); }); uniquePierHeights.sort((a, b) => b - a);
  return { N_pier, N_slot, pierHeights, maxPierH, uniquePierHeights, getPierTopWidthCm, W_slit, W_weir, L_total, L_base, H_total, H_dam_body, dH_slot, B_slot, B_base, B_key_top, L_heel,
    B_stone_up_top, B_stone_up_bot, A_apron_dn, m_rebar_span, n_bays_main, L_outer_u, n_pier_bars, n_pier_anc, V_conc, A_form, W_rebar, V_stone,
    f_conc_str1, f_conc_str2, f_form_str1, f_form_str2, f_rebar_str1, f_rebar_str2, f_stone_str,
    __q: { V_key: V_key / 1e6, V_base_slab: V_base_slab / 1e6, V_piers_net: V_piers_net / 1e6, V_lower_wings: V_lower_wings / 1e6, V_upper_wings: V_upper_wings / 1e6, V_top_rise: V_top_rise / 1e6, V_stone_up, V_stone_dn, xSlitL, xSlitR, xWeirL, xWeirR, Llb_L, Llb_R, Llt_L, Llt_R, Lub_L, Lub_R } };
}

// ============================================================================
// 3. CAD Geometry Builder & Dynamic Bounding-Box Engine (Golden Rule 1)
// ============================================================================
const LAYER_COLORS = {
  STRUCT: '#ffffff',
  STRUCT_SUB: '#9ca3af',
  STONE: '#ffb300',
  REBAR: '#ff5252',
  STIRRUP: '#69f0ae',
  DIM: '#00e5ff',
  TEXT: '#e6edf3',
  CENTER: '#f472b6',
  TABLE: '#cbd5e1',
  REF: '#ff4081'
};

function addLine(x1, y1, x2, y2, layer = 'STRUCT', dashed = false, lineWidth = 1.4) {
  activeBuffer.push({ type: 'LINE', x1, y1, x2, y2, layer, dashed, lineWidth });
}

function addPoly(pts, closed = false, layer = 'STRUCT', dashed = false, lineWidth = 1.4, fill = null) {
  if (!pts || pts.length < 2) return;
  activeBuffer.push({ type: 'POLY', pts, closed, layer, dashed, lineWidth, fill });
}

function addCircle(cx, cy, r, layer = 'REBAR', filled = true) {
  activeBuffer.push({ type: 'CIRCLE', cx, cy, r, layer, filled });
}

function addText(x, y, text, size = 110, layer = 'TEXT', align = 'center', angleDeg = 0) {
  activeBuffer.push({ type: 'TEXT', x, y, text: String(text), size, layer, align, angleDeg });
}

// Measure exact Bounding Box of any primitive array (including text extent!)
function getGroupBBox(prims) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  const inc = (x, y) => {
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  };
  prims.forEach(pr => {
    if (pr.type === 'LINE') {
      inc(pr.x1, pr.y1);
      inc(pr.x2, pr.y2);
    } else if (pr.type === 'POLY') {
      pr.pts.forEach(pt => inc(pt[0], pt[1]));
    } else if (pr.type === 'CIRCLE') {
      inc(pr.cx - pr.r, pr.cy - pr.r);
      inc(pr.cx + pr.r, pr.cy + pr.r);
    } else if (pr.type === 'TEXT') {
      const strLen = String(pr.text || '').length;
      const wEst = Math.max(pr.size, strLen * pr.size * 0.58);
      const hEst = pr.size * 1.25;
      if (Math.abs(pr.angleDeg || 0) > 45) {
        inc(pr.x - hEst, pr.y - wEst * 0.5);
        inc(pr.x + hEst, pr.y + wEst * 0.5);
      } else if (pr.align === 'left') {
        inc(pr.x, pr.y - hEst * 0.6);
        inc(pr.x + wEst, pr.y + hEst * 0.6);
      } else if (pr.align === 'right') {
        inc(pr.x - wEst, pr.y - hEst * 0.6);
        inc(pr.x, pr.y + hEst * 0.6);
      } else {
        inc(pr.x - wEst * 0.5, pr.y - hEst * 0.6);
        inc(pr.x + wEst * 0.5, pr.y + hEst * 0.6);
      }
    }
  });
  if (minX === Infinity) return { minX: 0, minY: 0, maxX: 100, maxY: 100, width: 100, height: 100 };
  return { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY };
}

// Build a sub-view into an isolated primitive list & compute its exact Bounding Box
function captureSubView(buildFn) {
  const prevBuf = activeBuffer;
  const subBuf = [];
  activeBuffer = subBuf;
  buildFn();
  activeBuffer = prevBuf;
  const bbox = getGroupBBox(subBuf);
  return { prims: subBuf, bbox };
}

// Translate and commit a captured sub-view into activeBuffer
function placeSubView(subView, dx = 0, dy = 0) {
  subView.prims.forEach(pr => {
    if (pr.type === 'LINE') {
      activeBuffer.push({ ...pr, x1: pr.x1 + dx, y1: pr.y1 + dy, x2: pr.x2 + dx, y2: pr.y2 + dy });
    } else if (pr.type === 'POLY') {
      activeBuffer.push({ ...pr, pts: pr.pts.map(pt => [pt[0] + dx, pt[1] + dy]) });
    } else if (pr.type === 'CIRCLE') {
      activeBuffer.push({ ...pr, cx: pr.cx + dx, cy: pr.cy + dy });
    } else if (pr.type === 'TEXT') {
      activeBuffer.push({ ...pr, x: pr.x + dx, y: pr.y + dy });
    }
  });
  return {
    minX: subView.bbox.minX + dx,
    maxX: subView.bbox.maxX + dx,
    minY: subView.bbox.minY + dy,
    maxY: subView.bbox.maxY + dy,
    width: subView.bbox.width,
    height: subView.bbox.height
  };
}

// ============================================================================
// 4. PAGE_07 Sub-View Builders (Strict Dynamic BBox Non-Overlapping Layout!)
// ============================================================================
function buildP7PlanSubView(p, d, targetLayerOverride = null) {
  const sL = targetLayerOverride || 'STRUCT';
  const L_total = d.L_total;
  const x0 = 0;
  const xCenter = L_total / 2;
  const xWingL = x0 + p.W_wing_L;
  const xWeirL = xWingL + p.W_slope_L;
  const xSlitL = xWeirL + p.W_ovf_L;
  const xSlitR = xSlitL + d.W_slit;
  const xWeirR = xSlitR + p.W_ovf_R;
  const xWingR = xWeirR + p.W_slope_R;
  const xEnd = xWingR + p.W_wing_R;
  const xBaseL = x0 + p.W_cut_L;
  const xBaseR = xEnd - p.W_cut_R;

  const yPlanDnEdge = 0;
  const yPlanUpEdge = d.B_base;
  const yPlanCrestUp = yPlanUpEdge - (p.H_lower + p.H_upper) * p.S_up;
  const yPlanCrestDn = yPlanCrestUp - p.B_weir_top;
  const yPlanMidUp = yPlanUpEdge - p.H_lower * p.S_up;
  const yPlanMidDn = yPlanMidUp - p.B_mid;

  // Main Dam Plan Footprint Polygon
  addPoly([
    [x0, yPlanCrestUp],
    [xBaseL, yPlanUpEdge],
    [xBaseR, yPlanUpEdge],
    [xEnd, yPlanCrestUp],
    [xEnd, yPlanCrestUp - p.B_wing_top],
    [xBaseR, yPlanDnEdge],
    [xBaseL, yPlanDnEdge],
    [x0, yPlanCrestUp - p.B_wing_top]
  ], true, sL, false, 1.7);

  // Wing wall top lines (left & right wings, plus sloped transition to overflow weir)
  addLine(x0, yPlanCrestUp, xWeirL, yPlanCrestUp, sL, false, 1.3);
  addLine(xWeirR, yPlanCrestUp, xEnd, yPlanCrestUp, sL, false, 1.3);
  addLine(x0, yPlanCrestUp - p.B_wing_top, xWingL, yPlanCrestDn, sL, false, 1.3);
  addLine(xWingL, yPlanCrestDn, xWeirL, yPlanCrestDn, sL, false, 1.3);
  addLine(xWeirR, yPlanCrestDn, xWingR, yPlanCrestDn, sL, false, 1.3);
  addLine(xWingR, yPlanCrestDn, xEnd, yPlanCrestUp - p.B_wing_top, sL, false, 1.3);

  // Left & Right Overflow Weir Crest Lines (ONLY drawn on xWeirL..xSlitL and xSlitR..xWeirR, NOT across slots!)
  addLine(xWeirL, yPlanMidUp, xSlitL, yPlanMidUp, sL, false, 1.5);
  addLine(xWeirL, yPlanMidDn, xSlitL, yPlanMidDn, sL, false, 1.5);
  addLine(xSlitR, yPlanMidUp, xWeirR, yPlanMidUp, sL, false, 1.5);
  addLine(xSlitR, yPlanMidDn, xWeirR, yPlanMidDn, sL, false, 1.5);

  // Vertical break lines at Wing & Weir transitions in Plan View
  [xWingL, xWeirL, xWeirR, xWingR].forEach(xp => {
    addLine(xp, yPlanUpEdge, xp, yPlanDnEdge, sL, false, 1.1);
  });

  // Slit bays (Slots & Piers) in Plan View:
  // Slots (150 cm) are open down to the base slab (no horizontal lines inside slots!).
  // Each Pier (250 cm, 柱子) clearly shows its own top surface upstream/downstream edges & vertical width dimension!
  let curPlanX = xSlitL;
  for (let i = 0; i < d.N_slot; i++) {
    const sL_x = curPlanX;
    const sR_x = sL_x + p.W_slot;
    // Vertical sidewalls of slot extending full base width
    addLine(sL_x, yPlanUpEdge, sL_x, yPlanDnEdge, sL, false, 1.5);
    addLine(sR_x, yPlanUpEdge, sR_x, yPlanDnEdge, sL, false, 1.5);
    curPlanX = sR_x;

    if (i < d.N_pier) {
      const pL_x = curPlanX;
      const pR_x = pL_x + p.W_pier;
      const hPier = d.pierHeights[i];
      const bVal = d.getPierTopWidthCm(hPier);
      const yPierUp = yPlanUpEdge - hPier * p.S_up;
      const yPierDn = yPierUp - bVal;

      // Distinct Pier (柱子) top cap rectangle in Plan View
      addPoly([
        [pL_x, yPierUp],
        [pR_x, yPierUp],
        [pR_x, yPierDn],
        [pL_x, yPierDn]
      ], true, sL, false, 1.75);

      if (!targetLayerOverride) {
        const pMidX = (pL_x + pR_x) / 2;
        // Internal vertical dimension line & arrows for each pier's top width (280 or 360)
        addLine(pMidX + 32, yPierDn, pMidX + 32, yPierUp, 'DIM', false, 0.9);
        addPoly([[pMidX + 20, yPierDn + 32], [pMidX + 32, yPierDn], [pMidX + 44, yPierDn + 32]], false, 'DIM', false, 0.9);
        addPoly([[pMidX + 20, yPierUp - 32], [pMidX + 32, yPierUp], [pMidX + 44, yPierUp - 32]], false, 'DIM', false, 0.9);
        addText(pMidX - 18, (yPierUp + yPierDn) / 2, Math.round(bVal), 74, 'TEXT', 'center', 90);
      }
      curPlanX = pR_x;
    }
  }

  // Masonry Strip & Downstream Semi-Circular Stilling Basin Apron
  const yStripTop = yPlanDnEdge;
  const yStripBot = yStripTop - d.B_stone_up_top;
  addPoly([
    [xBaseL, yStripTop],
    [xBaseR, yStripTop],
    [xBaseR, yStripBot],
    [xBaseL, yStripBot]
  ], true, sL, false, 1.3);

  const archPtsOuter = [];
  const archPtsInner = [];
  const nArchSegs = 40;
  const rxArch = d.W_weir / 2;
  const ryArch = p.L_apron_dn;
  for (let i = 0; i <= nArchSegs; i++) {
    const t = (i / nArchSegs) * Math.PI;
    archPtsOuter.push([xCenter - Math.cos(t) * rxArch, yStripBot - Math.sin(t) * ryArch]);
    archPtsInner.push([xCenter - Math.cos(t) * Math.max(100, rxArch - 120), yStripBot - Math.sin(t) * Math.max(100, ryArch - 120)]);
  }
  addPoly(archPtsOuter, false, sL, false, 1.6);
  addPoly(archPtsInner, false, sL, false, 1.1);

  if (!targetLayerOverride) {
    fillRectWithStones(xBaseL + 20, yStripBot + 15, xBaseR - 20, yStripTop - 15, p.D_rock, 301, 'STONE');

    const pitch = Math.max(70, p.D_rock * 0.95);
    const nCols = Math.max(4, Math.round(d.W_weir / pitch));
    const nRows = Math.max(3, Math.round(Math.max(100, ryArch - 130) / pitch));
    const cW = d.W_weir / nCols;
    const cH = Math.max(100, ryArch - 130) / nRows;

    for (let r = 0; r < nRows; r++) {
      for (let c = 0; c < nCols; c++) {
        const seed = 700 + r * 97 + c * 41;
        const cx = xWeirL + (c + 0.5) * cW + (seededRandom(seed) - 0.5) * cW * 0.2;
        const cy = yStripBot - (r + 0.5) * cH + (seededRandom(seed + 3) - 0.5) * cH * 0.2;
        const nx = (cx - xCenter) / Math.max(100, rxArch - 140);
        const ny = (yStripBot - cy) / Math.max(100, ryArch - 140);
        if (nx * nx + ny * ny <= 0.96) {
          drawNaturalBoulder(cx, cy, Math.min(cW, p.D_rock) * 0.43, Math.min(cH, p.D_rock) * 0.43, seed, 'STONE');
        }
      }
    }

    const yFlowTop = yPlanUpEdge + 1150;
    addText(xCenter - 260, yFlowTop - 220, '水流方向', 100, 'TEXT', 'center', 90);
    addPoly([
      [xCenter - 60, yFlowTop],
      [xCenter + 60, yFlowTop],
      [xCenter + 60, yFlowTop - 320],
      [xCenter + 130, yFlowTop - 320],
      [xCenter, yFlowTop - 480],
      [xCenter - 130, yFlowTop - 320],
      [xCenter - 60, yFlowTop - 320]
    ], true, 'STRUCT', false, 1.2);

    const yPlanDim1 = yPlanUpEdge + 180;
    let cxP = xSlitL;
    drawDimH(xWeirL, xSlitL, yPlanUpEdge, yPlanUpEdge, yPlanDim1, p.W_ovf_L, 80, 25, 20);
    for (let i = 0; i < d.N_slot; i++) {
      drawDimH(cxP, cxP + p.W_slot, yPlanUpEdge, yPlanUpEdge, yPlanDim1, p.W_slot, 68, 25, 20);
      cxP += p.W_slot;
      if (i < d.N_pier) {
        drawDimH(cxP, cxP + p.W_pier, yPlanUpEdge, yPlanUpEdge, yPlanDim1, p.W_pier, 68, 25, 20);
        cxP += p.W_pier;
      }
    }
    drawDimH(xSlitR, xWeirR, yPlanUpEdge, yPlanUpEdge, yPlanDim1, p.W_ovf_R, 80, 25, 20);

    const yPlanDim2 = yPlanUpEdge + 450;
    drawDimH(x0, xWingL, yPlanCrestUp, yPlanUpEdge, yPlanDim2, p.W_wing_L, 90, 35, 25);
    drawDimH(xWingL, xWeirL, yPlanUpEdge, yPlanUpEdge, yPlanDim2, p.W_slope_L, 90, 35, 25);
    drawDimH(xWeirL, xWeirR, yPlanUpEdge, yPlanUpEdge, yPlanDim2, d.W_weir, 90, 35, 25);
    drawDimH(xWeirR, xWingR, yPlanUpEdge, yPlanUpEdge, yPlanDim2, p.W_slope_R, 90, 35, 25);
    drawDimH(xWingR, xEnd, yPlanUpEdge, yPlanCrestUp, yPlanDim2, p.W_wing_R, 90, 35, 25);

    const yPlanDim3 = yPlanUpEdge + 740;
    drawDimH(x0, xEnd, yPlanCrestUp, yPlanCrestUp, yPlanDim3, d.L_total, 105, 45, 30);

    addText(x0 - 90, yPlanCrestUp - p.B_wing_top / 2, p.B_wing_top, 85, 'TEXT', 'center', 90);
    addText(xEnd + 90, yPlanCrestUp - p.B_wing_top / 2, p.B_wing_top, 85, 'TEXT', 'center', 90);
    addText(xWingL - 90, (yPlanCrestUp + yPlanCrestDn) / 2, p.B_weir_top, 80, 'TEXT', 'center', 90);
    addText(xWingR + 90, (yPlanCrestUp + yPlanCrestDn) / 2, p.B_weir_top, 80, 'TEXT', 'center', 90);
    addText(xWeirL + 150, (yPlanMidUp + yPlanMidDn) / 2, p.B_mid, 80, 'TEXT', 'center', 90);
    addText(xWeirR - 150, (yPlanMidUp + yPlanMidDn) / 2, p.B_mid, 80, 'TEXT', 'center', 90);
    drawDimV(yPlanDnEdge, yPlanUpEdge, xEnd, xEnd, xEnd + 360, Math.round(d.B_base), 90, 40, 25);
    drawDimV(yStripBot, yStripTop, xBaseR, xBaseR, xBaseR + 180, d.B_stone_up_top, 80, 25, 20);

    drawDimH(xWeirL, xWeirR, yStripBot, yStripBot, yStripBot - 180, d.W_weir, 95, 20, 20);
    drawDimV(yStripBot - p.L_apron_dn, yStripBot, xCenter, xCenter, xCenter - 150, p.L_apron_dn, 95, 20, 20);
    addText(xCenter + 450, yStripBot - p.L_apron_dn * 0.45, `A=${d.A_apron_dn} m2`, 115, 'TEXT', 'center');

    drawLeader([
      [xBaseR - 600, yStripBot + 100],
      [xBaseR - 450, yStripBot - 180],
      [xBaseR - 100, yStripBot - 180]
    ], `漿塊石(縫隙以280kgf/cm2混凝土填滿) 塊石長徑(${p.D_rock - 20}~${p.D_rock + 20}cm 塊石佔70%以上)-現採`, 80, 'left');

    drawLeader([
      [xCenter + rxArch * 0.65, yStripBot - ryArch * 0.72],
      [xCenter + rxArch * 0.78, yStripBot - ryArch * 0.72]
    ], `漿塊石(縫隙以280kgf/cm2混凝土填滿) 塊石長徑(${p.D_rock - 20}~${p.D_rock + 20}cm 塊石佔70%以上)-現採`, 80, 'left');

    const yTitle = Math.min(yStripBot - 450, yStripBot - ryArch - 220);
    addText(xEnd - 450, yTitle, '梳子壩平面圖', 150, 'TEXT', 'center');
    addLine(xEnd - 950, yTitle - 40, xEnd + 50, yTitle - 40, 'STRUCT', false, 1.2);
    addLine(xEnd - 950, yTitle - 65, xEnd + 50, yTitle - 65, 'STRUCT', false, 0.8);
  }
}

function buildP7FrontSubView(p, d, targetLayerOverride = null) {
  const sL = targetLayerOverride || 'STRUCT';
  const L_total = d.L_total;
  const x0 = 0;
  const xCenter = L_total / 2;
  const xWingL = x0 + p.W_wing_L;
  const xWeirL = xWingL + p.W_slope_L;
  const xSlitL = xWeirL + p.W_ovf_L;
  const xSlitR = xSlitL + d.W_slit;
  const xWeirR = xSlitR + p.W_ovf_R;
  const xWingR = xWeirR + p.W_slope_R;
  const xEnd = xWingR + p.W_wing_R;
  const xBaseL = x0 + p.W_cut_L;
  const xBaseR = xEnd - p.W_cut_R;

  const yKeyBot = 0;
  const yBaseBot = yKeyBot + p.D_key;
  const yBaseTop = yBaseBot + p.T_base;
  const yWeirCrest = yBaseTop + p.H_lower;
  const yUpperTop = yWeirCrest + p.H_upper;
  const yWingPeak = yUpperTop + p.H_wing_rise;
  const yTopMax = Math.max(yWingPeak, yBaseTop + d.maxPierH);

  if (p.D_key > 0) {
    addPoly([
      [xBaseL, yBaseTop],
      [xBaseL, yKeyBot],
      [xBaseR, yKeyBot],
      [xBaseR, yBaseTop]
    ], true, sL, false, 1.6);
    addLine(xBaseL, yBaseBot, xBaseR, yBaseBot, targetLayerOverride || 'STRUCT_SUB', true, 1.1);
  } else {
    addPoly([
      [xBaseL, yBaseTop],
      [xBaseL, yBaseBot],
      [xBaseR, yBaseBot],
      [xBaseR, yBaseTop]
    ], true, sL, false, 1.6);
  }

  // Left Wing & Left Overflow Weir Profile (Stops at xSlitL — NO continuous line across the slit zone!)
  addPoly([
    [xBaseL, yBaseTop],
    [x0, yUpperTop],
    [x0, yWingPeak],
    [xWingL, yUpperTop],
    [xWeirL, yWeirCrest],
    [xSlitL, yWeirCrest],
    [xSlitL, yBaseTop]
  ], false, sL, false, 1.8);

  // Right Overflow Weir & Right Wing Profile (Starts at xSlitR — leaving slit zone sky open!)
  addPoly([
    [xSlitR, yBaseTop],
    [xSlitR, yWeirCrest],
    [xWeirR, yWeirCrest],
    [xWingR, yUpperTop],
    [xEnd, yWingPeak],
    [xEnd, yUpperTop],
    [xBaseR, yBaseTop]
  ], false, sL, false, 1.8);

  // Sloped breast wall inner edge on left & right overflow abutment walls
  const abutChamfer = p.W_pier * 0.15;
  addPoly([
    [xSlitL - abutChamfer, yBaseTop],
    [xSlitL - abutChamfer, yWeirCrest]
  ], false, targetLayerOverride || 'STRUCT_SUB', false, 0.9);
  addPoly([
    [xSlitR + abutChamfer, yBaseTop],
    [xSlitR + abutChamfer, yWeirCrest]
  ], false, targetLayerOverride || 'STRUCT_SUB', false, 0.9);

  // Draw Slit Slots & Piers using each pier's independent height d.pierHeights[i]!
  let curX = xSlitL;
  for (let i = 0; i < d.N_slot; i++) {
    const sLeft = curX;
    const sRight = sLeft + p.W_slot;
    addLine(sLeft, yBaseTop, sRight, yBaseTop, sL, false, 1.5);
    curX = sRight;

    if (i < d.N_pier) {
      const pLeft = curX;
      const pRight = pLeft + p.W_pier;
      const pierH = d.pierHeights[i];
      const pTopY = yBaseTop + pierH;

      addPoly([
        [pLeft, yBaseTop],
        [pLeft, pTopY],
        [pRight, pTopY],
        [pRight, yBaseTop]
      ], false, sL, false, 1.6);

      addLine(pLeft + abutChamfer, yBaseTop, pLeft + abutChamfer, pTopY, targetLayerOverride || 'STRUCT_SUB', false, 0.9);
      addLine(pRight - abutChamfer, yBaseTop, pRight - abutChamfer, pTopY, targetLayerOverride || 'STRUCT_SUB', false, 0.9);

      curX = pRight;
    }
  }

  const xToeL = xBaseL + 450;
  const xToeR = xBaseR - 450;
  addPoly([
    [xWingL, yUpperTop],
    [xToeL, yBaseTop],
    [xToeR, yBaseTop],
    [xWingR, yUpperTop]
  ], false, targetLayerOverride || 'STRUCT_SUB', false, 1.0);

  if (!targetLayerOverride) {
    addLine(xCenter, yKeyBot - 200, xCenter, yTopMax + 950, 'CENTER', true, 1.0);
    addText(xCenter, yTopMax + 1020, '℄', 130, 'CENTER', 'center');

    const yWeirDimBase = Math.max(yWeirCrest, yBaseTop + d.maxPierH);
    const yDim1 = yWeirDimBase + 260;
    let cxDim = xSlitL;
    for (let i = 0; i < d.N_slot; i++) {
      drawDimH(cxDim, cxDim + p.W_slot, yWeirCrest, yWeirCrest, yDim1, p.W_slot, 70, 25, 20);
      cxDim += p.W_slot;
      if (i < d.N_pier) {
        const pierH = d.pierHeights[i];
        const pTopY = yBaseTop + pierH;
        drawDimH(cxDim, cxDim + p.W_pier, pTopY, pTopY, yDim1, p.W_pier, 70, 25, 20);
        // Label every pier's individual height!
        drawDimV(yBaseTop, pTopY, cxDim, cxDim, cxDim - 42, pierH, 68, 12, 12);
        cxDim += p.W_pier;
      }
    }

    const yDim2 = yWeirDimBase + 560;
    drawDimH(xWeirL, xSlitL, yWeirCrest, yWeirCrest, yDim2, p.W_ovf_L, 90, 35, 25);
    drawDimH(xSlitL, xSlitR, yWeirCrest, yWeirCrest, yDim2, d.W_slit, 90, 35, 25);
    drawDimH(xSlitR, xWeirR, yWeirCrest, yWeirCrest, yDim2, p.W_ovf_R, 90, 35, 25);

    const yDim3 = Math.max(yWingPeak, yDim2) + 350;
    drawDimH(x0, xWingL, yWingPeak, yUpperTop, yDim3, p.W_wing_L, 95, 40, 30);
    drawDimH(xWingL, xWeirL, yUpperTop, yWeirCrest, yDim3, p.W_slope_L, 95, 40, 30);
    drawDimH(xWeirL, xWeirR, yWeirCrest, yWeirCrest, yDim3, d.W_weir, 95, 40, 30);
    drawDimH(xWeirR, xWingR, yWeirCrest, yUpperTop, yDim3, p.W_slope_R, 95, 40, 30);
    drawDimH(xWingR, xEnd, yUpperTop, yWingPeak, yDim3, p.W_wing_R, 95, 40, 30);

    const yDim4 = yDim3 + 350;
    drawDimH(x0, xEnd, yWingPeak, yWingPeak, yDim4, d.L_total, 110, 50, 35);

    const yDimBot = yKeyBot - 320;
    drawDimH(x0, xBaseL, yUpperTop, yKeyBot, yDimBot, p.W_cut_L, 95, 40, 30);
    drawDimH(xBaseL, xBaseR, yKeyBot, yKeyBot, yDimBot, d.L_base, 105, 40, 30);
    drawDimH(xBaseR, xEnd, yKeyBot, yUpperTop, yDimBot, p.W_cut_R, 95, 40, 30);

    const xDimR1 = xEnd + 320;
    const xDimR2 = xEnd + 620;
    if (p.D_key > 0) drawDimV(yKeyBot, yBaseBot, xBaseR, xBaseR, xDimR1, p.D_key, 85, 40, 25);
    drawDimV(yBaseBot, yBaseTop, xBaseR, xBaseR, xDimR1, p.T_base, 85, 40, 25);
    drawDimV(yBaseTop, yUpperTop, xBaseR, xEnd, xDimR1, d.H_dam_body, 90, 40, 25);
    drawDimV(yUpperTop, yWingPeak, xEnd, xEnd, xDimR1, p.H_wing_rise, 85, 40, 25);
    drawDimV(yKeyBot, yWingPeak, xBaseR, xEnd, xDimR2, d.H_total, 105, 50, 35);

    addText(xWingL + p.W_slope_L * 0.55, yWeirCrest + p.H_upper * 0.55, `1:${+(p.W_slope_L / p.H_upper).toFixed(2)}`, 85, 'TEXT', 'center', -45);
    addText(xWeirR + p.W_slope_R * 0.45, yWeirCrest + p.H_upper * 0.55, `1:${+(p.W_slope_R / p.H_upper).toFixed(2)}`, 85, 'TEXT', 'center', 45);

    // Dual-arrow "軀體模板" callouts & Elevation 1005.96m callout matching original PAGE_07
    const yCalloutTop = yWeirDimBase + 430;
    const xCallL = xSlitL + d.W_slit * 0.22;
    drawLeader([[xSlitL + p.W_slot + p.W_pier * 0.5, yBaseTop + d.pierHeights[0] * 0.65], [xCallL, yCalloutTop], [xCallL - 180, yCalloutTop]], '軀體模板', 85, 'right');
    if (d.N_pier >= 2) {
      drawLeader([[xSlitL + p.W_slot * 2 + p.W_pier * 1.5, yBaseTop + d.pierHeights[1] * 0.65], [xCallL, yCalloutTop]], '', 85, 'right');
    }

    const xCallR = xSlitR + p.W_ovf_R * 0.55;
    drawLeader([[xCallR + 320, yWeirCrest - p.H_lower * 0.35], [xCallR, yCalloutTop], [xCallR - 180, yCalloutTop]], '軀體模板', 85, 'right');
    drawLeader([[xWeirR + p.W_slope_R * 0.6, yWeirCrest - p.H_lower * 0.4], [xCallR, yCalloutTop]], '', 85, 'right');

    drawLeader([[xBaseL + d.L_base * 0.32, yKeyBot + p.D_key * 0.45], [xBaseL + d.L_base * 0.29, yKeyBot - 520], [xBaseL + d.L_base * 0.27, yKeyBot - 520]], '軀體模板', 85, 'right');

    // Center overflow elevation callout: 高程(1005.96m)
    addCircle(xCenter, yBaseTop, 16, 'STRUCT', true);
    addPoly([[xCenter, yBaseTop], [xCenter, yKeyBot - 520], [xCenter + 140, yKeyBot - 520]], false, 'DIM', false, 1.0);
    addText(xCenter + 165, yKeyBot - 545, '溢流口高程(見縱斷面圖)', 85, 'TEXT', 'left');

    addText(xEnd - 450, yKeyBot - 680, '梳子壩正視圖', 150, 'TEXT', 'center');
    addLine(xEnd - 950, yKeyBot - 720, xEnd + 50, yKeyBot - 720, 'STRUCT', false, 1.2);
    addLine(xEnd - 950, yKeyBot - 745, xEnd + 50, yKeyBot - 745, 'STRUCT', false, 0.8);
  }
}

function buildP7SideSubView(p, d, targetLayerOverride = null) {
  const sL = targetLayerOverride || 'STRUCT';
  const scSide = 1.85;
  const xSideDamUp = 0;
  const ySideBaseBot = 0;

  const sKeyD = p.D_key * scSide;
  const sBaseT = p.T_base * scSide;
  const sHLow = p.H_lower * scSide;
  const sHUp = p.H_upper * scSide;
  const sHRise = p.H_wing_rise * scSide;

  const yS_KeyBot = ySideBaseBot - sKeyD;
  const yS_BaseBot = ySideBaseBot;
  const yS_BaseTop = yS_BaseBot + sBaseT;
  const yS_SlotBot = yS_BaseTop + (p.H_lower - d.dH_slot) * scSide;
  const yS_Mid = yS_BaseTop + sHLow;
  const yS_WeirTop = yS_Mid + sHUp;
  const yS_WingTop = yS_WeirTop + sHRise;

  const xS_BaseUp = xSideDamUp;
  const xS_BaseDn = xS_BaseUp + d.B_base * scSide;
  const xS_MidUp = xS_BaseUp + p.H_lower * p.S_up * scSide;
  const xS_MidDn = xS_MidUp + p.B_mid * scSide;
  const xS_WeirUp = xS_MidUp + p.H_upper * p.S_up * scSide;
  const xS_WeirDn = xS_WeirUp + p.B_weir_top * scSide;
  const xS_WingUp = xS_WeirUp + p.H_wing_rise * p.S_up * scSide;
  const xS_WingDn = xS_WingUp + p.B_wing_top * scSide;

  const xS_KeyBotUp = xS_BaseUp + (d.B_key_top - p.B_key_bot) * 0.5 * scSide;
  const xS_KeyBotDn = xS_KeyBotUp + p.B_key_bot * scSide;
  const xS_KeyTopDn = xS_BaseUp + d.B_key_top * scSide;

  const sideDamPts = [
    [xS_BaseUp, yS_BaseTop],
    [xS_MidUp, yS_Mid],
    [xS_WeirUp, yS_WeirTop],
    [xS_WingUp, yS_WingTop],
    [xS_WingDn, yS_WingTop],
    [xS_WeirDn, yS_WeirTop],
    [xS_MidDn, yS_Mid],
    [xS_BaseDn, yS_BaseTop],
    [xS_BaseDn, yS_BaseBot]
  ];
  if (p.D_key > 0) {
    sideDamPts.push(
      [xS_KeyTopDn, yS_BaseBot],
      [xS_KeyBotDn, yS_KeyBot],
      [xS_KeyBotUp, yS_KeyBot],
      [xS_BaseUp, yS_BaseBot]
    );
  } else {
    sideDamPts.push([xS_BaseUp, yS_BaseBot]);
  }
  addPoly(sideDamPts, true, sL, false, 1.8);

  addLine(xS_BaseUp, yS_BaseTop, xS_BaseDn, yS_BaseTop, sL, false, 1.3);
  addLine(xS_MidUp, yS_Mid, xS_MidDn, yS_Mid, sL, false, 1.3);
  addLine(xS_WeirUp, yS_WeirTop, xS_WeirDn, yS_WeirTop, sL, false, 1.3);

  // Draw break lines for all distinct pier heights in Side View
  d.uniquePierHeights.forEach(hPier => {
    if (hPier < p.H_lower + p.H_upper) {
      const yP = yS_BaseTop + hPier * scSide;
      const xPUp = xS_BaseUp + hPier * p.S_up * scSide;
      const bTop = d.getPierTopWidthCm(hPier);
      const xPDn = xPUp + bTop * scSide;
      addLine(xPUp, yP, xPDn, yP, sL, false, 1.2);
      if (!targetLayerOverride && Math.abs(hPier - p.H_lower) > 5) {
        addText((xPUp + xPDn) / 2, yP + 50, Math.round(bTop), 78, 'TEXT', 'center');
      }
    }
  });

  const sUpStoneTopW = d.B_stone_up_top * scSide;
  const sUpStoneBotW = d.B_stone_up_bot * scSide;
  const sUpStoneD = p.D_stone_up * scSide;
  const xS_UpStoneL_Top = xS_BaseDn + sUpStoneTopW;
  const xS_UpStoneL_Bot = xS_BaseDn + sUpStoneBotW;
  const yS_UpStoneTop = yS_BaseTop;
  const yS_UpStoneBot = yS_UpStoneTop - sUpStoneD;

  addPoly([
    [xS_UpStoneL_Top, yS_UpStoneTop],
    [xS_BaseDn, yS_UpStoneTop],
    [xS_BaseDn, yS_UpStoneBot],
    [xS_UpStoneL_Bot, yS_UpStoneBot]
  ], true, sL, false, 1.4);

  const sApronL = p.L_apron_dn * scSide;
  const sApronT = p.T_apron_dn * scSide;
  const dyApron = sApronL * (p.S_apron / 100);
  const xS_ApronEnd = xS_UpStoneL_Top + sApronL;
  const yS_ApronStartTop = yS_UpStoneTop;
  const yS_ApronEndTop = yS_ApronStartTop - dyApron;

  addPoly([
    [xS_ApronEnd, yS_ApronEndTop],
    [xS_UpStoneL_Top, yS_ApronStartTop],
    [xS_UpStoneL_Top, yS_ApronStartTop - sApronT],
    [xS_ApronEnd, yS_ApronEndTop - sApronT]
  ], true, sL, false, 1.5);

  if (!targetLayerOverride) {
    const nApronStones = Math.max(4, Math.round(p.L_apron_dn / p.D_rock));
    for (let i = 0; i < nApronStones; i++) {
      const t = (i + 0.5) / nApronStones;
      const bx = xS_ApronEnd - t * sApronL;
      const by = (yS_ApronEndTop + t * dyApron) - sApronT * 0.5;
      drawNaturalBoulder(bx, by, (sApronL / nApronStones) * 0.44, sApronT * 0.42, 900 + i * 19, 'STONE');
    }

    const nUpRows = Math.max(2, Math.round(p.D_stone_up / p.D_rock));
    for (let r = 0; r < nUpRows; r++) {
      for (let c = 0; c < 2; c++) {
        const ty = (r + 0.5) / nUpRows;
        const by = yS_UpStoneBot + ty * sUpStoneD;
        const rowW = sUpStoneBotW + ty * (sUpStoneTopW - sUpStoneBotW);
        const bx = xS_BaseDn + (c + 0.5) * (rowW / 2);
        drawNaturalBoulder(bx, by, (rowW / 2) * 0.42, (sUpStoneD / nUpRows) * 0.42, 1100 + r * 31 + c * 17, 'STONE');
      }
    }

    addText((xS_WingUp + xS_WingDn) / 2, yS_WingTop + 90, p.B_wing_top, 85, 'TEXT', 'center');
    addText((xS_WeirUp + xS_WeirDn) / 2, yS_WeirTop + 55, p.B_weir_top, 85, 'TEXT', 'center');
    addText((xS_MidUp + xS_MidDn) / 2, yS_Mid + 55, p.B_mid, 85, 'TEXT', 'center');

    const yBotLow = Math.min(yS_KeyBot, yS_UpStoneBot, yS_ApronEndTop - sApronT);
    if (p.D_key > 0) {
      drawDimH(xS_KeyBotUp, xS_KeyBotDn, yS_KeyBot, yS_KeyBot, yBotLow - 150, p.B_key_bot, 80, 20, 20);
      drawDimH(xS_KeyTopDn, xS_BaseDn, yS_BaseBot, yS_BaseBot, yBotLow - 150, Math.round(d.L_heel), 80, 20, 20);
    }
    drawDimH(xS_BaseUp, xS_BaseDn, yS_KeyBot, yS_BaseBot, yBotLow - 350, Math.round(d.B_base), 90, 30, 25);

    const xSDim1 = xS_BaseUp - 280;
    const xSDim2 = xS_BaseUp - 540;
    if (p.D_key > 0) drawDimV(yS_KeyBot, yS_BaseBot, xS_KeyBotUp, xS_BaseUp, xSDim1, p.D_key, 80, 30, 20);
    drawDimV(yS_BaseBot, yS_BaseTop, xS_BaseUp, xS_BaseUp, xSDim1, p.T_base, 80, 30, 20);
    drawDimV(yS_BaseTop, yS_Mid, xS_BaseUp, xS_MidUp, xSDim1, p.H_lower, 85, 30, 20);
    drawDimV(yS_Mid, yS_WeirTop, xS_MidUp, xS_WeirUp, xSDim1, p.H_upper, 85, 30, 20);
    drawDimV(yS_WeirTop, yS_WingTop, xS_WeirUp, xS_WingUp, xSDim1, p.H_wing_rise, 80, 30, 20);
    drawDimV(yS_KeyBot, yS_WeirTop, xS_BaseUp, xS_WeirUp, xSDim2, p.D_key + p.T_base + p.H_lower + p.H_upper, 95, 40, 25);

    drawDimH(xS_ApronEnd, xS_UpStoneL_Top, yS_ApronEndTop, yS_ApronStartTop, yS_ApronStartTop + 220, p.L_apron_dn, 85, 30, 20);
    addText((xS_ApronEnd + xS_UpStoneL_Top) / 2, (yS_ApronEndTop + yS_ApronStartTop) / 2 + 75, `S=${p.S_apron}%`, 85, 'TEXT', 'center');
    drawDimV(yS_ApronEndTop - sApronT, yS_ApronEndTop, xS_ApronEnd, xS_ApronEnd, xS_ApronEnd + 120, p.T_apron_dn, 80, 20, 20);
    drawDimV(yS_UpStoneBot, yS_UpStoneTop, xS_UpStoneL_Bot, xS_UpStoneL_Top, xS_UpStoneL_Top + 130, p.D_stone_up, 80, 20, 20);

    addText(xS_BaseUp + 120, (yS_BaseTop + yS_Mid) / 2, `1:${p.S_up}`, 80, 'TEXT', 'center', 73);
    addText(xS_MidDn + 260, (yS_BaseTop + yS_Mid) / 2, `1:${p.S_dn}`, 80, 'TEXT', 'center', -63);

    // Side View Formwork ("軀體模板" / "不組模") & Concrete / Stone Callouts matching original PAGE_07
    drawLeader([[xS_MidUp + (xS_WeirUp - xS_MidUp) * 0.4, (yS_Mid + yS_WeirTop) * 0.5], [xS_MidUp - 320, (yS_Mid + yS_WeirTop) * 0.5], [xS_MidUp - 460, (yS_Mid + yS_WeirTop) * 0.5]], '軀體模板', 80, 'right');
    drawLeader([[xS_WeirDn + (xS_MidDn - xS_WeirDn) * 0.5, (yS_Mid + yS_WeirTop) * 0.42], [xS_MidDn + 280, (yS_Mid + yS_WeirTop) * 0.42], [xS_MidDn + 420, (yS_Mid + yS_WeirTop) * 0.42]], '軀體模板', 80, 'left');
    drawLeader([[xS_BaseDn, (yS_BaseBot + yS_BaseTop) * 0.5], [xS_BaseDn - 260, yS_BaseBot - 130], [xS_BaseDn - 380, yS_BaseBot - 130]], '軀體模板', 78, 'right');
    if (p.D_key > 0) {
      drawLeader([[xS_KeyBotDn, (yS_KeyBot + yS_BaseBot) * 0.45], [xS_KeyTopDn + 260, (yS_KeyBot + yS_BaseBot) * 0.45], [xS_KeyTopDn + 380, (yS_KeyBot + yS_BaseBot) * 0.45]], '不組模', 78, 'left');
    }

    drawLeader([[xS_BaseUp + 40, yS_BaseTop + sHLow * 0.35], [xS_BaseUp - 900, yS_BaseTop + sHLow * 1.25], [xS_BaseUp - 1060, yS_BaseTop + sHLow * 1.25]], '280kgf/cm2混凝土', 80, 'right');

    // Station Callout Flag at Crest (also add invisible anchor point at flag tip so BBox encompasses rotated text!)
    addPoly([
      [xS_WingUp, yS_WingTop + 60],
      [xS_WingUp, yS_WingTop + 360],
      [xS_WingUp + 680, yS_WingTop + 980]
    ], false, 'DIM', false, 1.1);
    addText(xS_WingUp + 280, yS_WingTop + 680, '梳子壩', 95, 'TEXT', 'center', 42);
    // Explicit bounding-box padding point above rotated flag text so it NEVER touches Front View above!
    addLine(xS_WingUp + 720, yS_WingTop + 1120, xS_WingUp + 721, yS_WingTop + 1120, 'DIM', false, 0.1);

    addText(xS_BaseDn - 100, yBotLow - 540, '梳子壩側視圖', 150, 'TEXT', 'center');
    addLine(xS_BaseDn - 600, yBotLow - 580, xS_BaseDn + 400, yBotLow - 580, 'STRUCT', false, 1.2);
    addLine(xS_BaseDn - 600, yBotLow - 605, xS_BaseDn + 400, yBotLow - 605, 'STRUCT', false, 0.8);
  }
}

function buildP7TableSubView(p, d) {
  const xTbl = 0;
  const yTblTop = 0;
  const rowH = 210;
  const col1W = 900, col2W = 360, col3W = 820;
  const tblW = col1W + col2W + col3W;

  addText(xTbl, yTblTop + 120, '梳子壩數量表(每座)', 125, 'TEXT', 'left');

  const rows = [
    ['混凝土', 'm3', d.V_conc.toFixed(2)],
    ['軀體模板', 'm2', d.A_form.toFixed(2)],
    ['鋼筋(含損耗)', 'kg', d.W_rebar.toFixed(2)],
    ['漿塊石', 'm3', d.V_stone.toFixed(2)]
  ];

  for (let r = 0; r <= rows.length; r++) {
    const yR = yTblTop - r * rowH;
    addLine(xTbl, yR, xTbl + tblW, yR, 'TABLE', false, 1.2);
  }
  addLine(xTbl, yTblTop, xTbl, yTblTop - rows.length * rowH, 'TABLE', false, 1.2);
  addLine(xTbl + col1W, yTblTop, xTbl + col1W, yTblTop - rows.length * rowH, 'TABLE', false, 1.2);
  addLine(xTbl + col1W + col2W, yTblTop, xTbl + col1W + col2W, yTblTop - rows.length * rowH, 'TABLE', false, 1.2);
  addLine(xTbl + tblW, yTblTop, xTbl + tblW, yTblTop - rows.length * rowH, 'TABLE', false, 1.2);

  rows.forEach((row, idx) => {
    const yText = yTblTop - (idx + 0.66) * rowH;
    addText(xTbl + 50, yText, row[0], 95, 'TEXT', 'left');
    addText(xTbl + col1W + col2W / 2, yText, row[1], 95, 'TEXT', 'center');
    addText(xTbl + tblW - 50, yText, row[2], 100, 'DIM', 'right');
  });

  const xNotes = xTbl + tblW + 240;
  addText(xNotes, yTblTop - 40, '工程說明：', 110, 'TEXT', 'left');
  addText(xNotes, yTblTop - 240, '1. 梳子壩混凝土為 280 kgf/cm2。', 95, 'TEXT', 'left');
  addText(xNotes, yTblTop - 430, '2. 基礎開挖時，須有臨時排水及擋土支撐等設施，以保障人員安全。', 95, 'TEXT', 'left');
  addText(xNotes, yTblTop - 620, `3. 鋼筋保護層為 ${p.C_rebar} ± 0.6 公分。`, 95, 'TEXT', 'left');

  const yFormStart = yTblTop - rows.length * rowH - 240;
  const fSize = 72;
  addText(xTbl, yFormStart, `280kgf/cm2混凝土 : ${d.f_conc_str1}`, fSize, 'TEXT', 'left');
  addText(xTbl + 720, yFormStart - 135, d.f_conc_str2, fSize, 'TEXT', 'left');

  addText(xTbl, yFormStart - 310, `軀體模板       : ${d.f_form_str1}`, fSize, 'TEXT', 'left');
  addText(xTbl + 720, yFormStart - 445, d.f_form_str2, fSize, 'TEXT', 'left');

  addText(xTbl, yFormStart - 620, `鋼筋(含損耗)   : ${d.f_rebar_str1}`, fSize, 'TEXT', 'left');
  addText(xTbl + 720, yFormStart - 755, d.f_rebar_str2, fSize, 'TEXT', 'left');

  addText(xTbl, yFormStart - 930, `漿塊石         : ${d.f_stone_str}`, fSize, 'TEXT', 'left');
}

// Assemble PAGE_07 using Dynamic Bounding-Box Layout (Golden Rule 1: Never Overlaps!)
function buildPage07(p, d, offsetX = 0, offsetY = 0, targetLayerOverride = null) {
  const vFront = captureSubView(() => buildP7FrontSubView(p, d, targetLayerOverride));
  const vPlan = captureSubView(() => buildP7PlanSubView(p, d, targetLayerOverride));
  const vSide = captureSubView(() => buildP7SideSubView(p, d, targetLayerOverride));

  // 1. Place Front Elevation View at reference Y
  const yFrontOrigin = offsetY + 4600;
  const boxFront = placeSubView(vFront, offsetX, yFrontOrigin);

  // 2. Place Plan View strictly above Front Elevation's top-most point + generous dynamic vertical margin!
  // Note: Plan View's X=0..L_total is strictly 1:1 aligned with Front Elevation's X=0..L_total!
  const gapPlanFront = Math.max(1150, vFront.bbox.height * 0.28);
  const dyPlan = (boxFront.maxY + gapPlanFront) - vPlan.bbox.minY;
  const boxPlan = placeSubView(vPlan, offsetX, dyPlan);

  // 3. Place Side View strictly below Front Elevation's bottom-most point - generous dynamic vertical margin!
  const gapFrontBottom = Math.max(1350, vFront.bbox.height * 0.34);
  const targetBottomRowMaxY = boxFront.minY - gapFrontBottom;
  const dxSide = offsetX - vSide.bbox.minX;
  const dySide = targetBottomRowMaxY - vSide.bbox.maxY;
  const boxSide = placeSubView(vSide, dxSide, dySide);

  // 4. Place Quantity Table & Formulas strictly to the right of Side View + dynamic horizontal margin!
  if (!targetLayerOverride) {
    const vTable = captureSubView(() => buildP7TableSubView(p, d));
    const gapSideTable = Math.max(1100, vSide.bbox.width * 0.20);
    const dxTable = (boxSide.maxX + gapSideTable) - vTable.bbox.minX;
    const dyTable = targetBottomRowMaxY - vTable.bbox.maxY - 250;
    placeSubView(vTable, dxTable, dyTable);
  }
}

// ============================================================================
// 5. PAGE_08 Builder: Dynamic Rebar Elevation + Per-Height Rebar Sections + Stirrups
// ============================================================================
function buildP8ElevSubView(p, d, targetLayerOverride = null) {
  const L_total = d.L_total;
  const xCenter = L_total / 2;

  const x0 = 0;
  const xWingL = x0 + p.W_wing_L;
  const xWeirL = xWingL + p.W_slope_L;
  const xSlitL = xWeirL + p.W_ovf_L;
  const xSlitR = xSlitL + d.W_slit;
  const xWeirR = xSlitR + p.W_ovf_R;
  const xWingR = xWeirR + p.W_slope_R;
  const xEnd = xWingR + p.W_wing_R;

  const xBaseL = x0 + p.W_cut_L;
  const xBaseR = xEnd - p.W_cut_R;

  const sL = targetLayerOverride || 'STRUCT';
  const rL = targetLayerOverride || 'REBAR';
  const stL = targetLayerOverride || 'STIRRUP';

  const yKeyBot = 0;
  const yBaseBot = yKeyBot + p.D_key;
  const yBaseTop = yBaseBot + p.T_base;
  const yWeirCrest = yBaseTop + p.H_lower;
  const yUpperTop = yWeirCrest + p.H_upper;
  const yWingPeak = yUpperTop + p.H_wing_rise;
  const yTopMax = Math.max(yWingPeak, yBaseTop + d.maxPierH);

  // Concrete Outline
  addPoly([
    [xBaseL, yBaseTop],
    [xBaseL, yKeyBot],
    [xBaseR, yKeyBot],
    [xBaseR, yBaseTop]
  ], true, sL, false, 1.5);

  // Left Wing & Left Overflow Weir Profile (Stops at xSlitL — NO continuous line across the slit zone!)
  addPoly([
    [xBaseL, yBaseTop],
    [x0, yUpperTop],
    [x0, yWingPeak],
    [xWingL, yUpperTop],
    [xWeirL, yWeirCrest],
    [xSlitL, yWeirCrest],
    [xSlitL, yBaseTop]
  ], false, sL, false, 1.6);

  // Right Overflow Weir & Right Wing Profile (Starts at xSlitR — leaving slit zone sky open!)
  addPoly([
    [xSlitR, yBaseTop],
    [xSlitR, yWeirCrest],
    [xWeirR, yWeirCrest],
    [xWingR, yUpperTop],
    [xEnd, yWingPeak],
    [xEnd, yUpperTop],
    [xBaseR, yBaseTop]
  ], false, sL, false, 1.6);

  // Rebar Mesh inside Base Slab & Cutoff Key
  const cov = p.C_rebar;
  const xMeshL = xBaseL + cov;
  const xMeshR = xBaseR - cov;
  const yMeshBot = yKeyBot + cov;
  const yMeshTop = yBaseTop - cov;

  const nHorizBars = Math.max(4, Math.round((yMeshTop - yMeshBot) / 45));
  for (let i = 0; i <= nHorizBars; i++) {
    const yb = yMeshBot + (i / nHorizBars) * (yMeshTop - yMeshBot);
    addLine(xMeshL, yb, xMeshR, yb, rL, false, 0.95);
  }

  const visualStep = Math.max(35, p.S_rebar_main * 1.5);
  for (let xv = xMeshL; xv <= xMeshR; xv += visualStep) {
    addLine(xv, yMeshBot, xv, yMeshTop, stL, false, 0.75);
  }

  // Slit Piers & Pier Rebar Cages in Elevation (Dynamic height per pier!)
  let curX = xSlitL;
  const sectionCutMap = new Map(); // Map unique height -> first pier center X

  for (let i = 0; i < d.N_slot; i++) {
    const sLeft = curX;
    const sRight = sLeft + p.W_slot;
    addLine(sLeft, yBaseTop, sRight, yBaseTop, sL, false, 1.4);
    curX = sRight;

    if (i < d.N_pier) {
      const pLeft = curX;
      const pRight = pLeft + p.W_pier;
      const pierH = d.pierHeights[i];
      const pTopY = yBaseTop + pierH;

      // Record first pier of each unique height for section cut marks (b-b, c-c, d-d...)
      const matchedKey = d.uniquePierHeights.find(uh => Math.abs(uh - pierH) < 0.5);
      if (matchedKey !== undefined && !sectionCutMap.has(matchedKey)) {
        sectionCutMap.set(matchedKey, (pLeft + pRight) / 2);
      }

      // Pier concrete outline
      addPoly([
        [pLeft, yBaseTop],
        [pLeft, pTopY],
        [pRight, pTopY],
        [pRight, yBaseTop]
      ], false, sL, false, 1.5);

      // Pier Rebar Cage (Ø16mm@60cm vertical & horizontal loops scaled to pierH)
      const pCov = p.C_rebar;
      const nPVert = Math.max(2, Math.round((p.W_pier - 2 * pCov) / p.S_rebar_pier));
      for (let k = 0; k <= nPVert; k++) {
        const xBar = pLeft + pCov + (k / nPVert) * (p.W_pier - 2 * pCov);
        addLine(xBar, yBaseBot + pCov, xBar, pTopY - pCov, rL, false, 1.0);
      }
      const nPHoriz = Math.max(3, Math.round(((pTopY - yBaseTop) - pCov) / p.S_rebar_pier));
      for (let k = 0; k <= nPHoriz; k++) {
        const yBar = yBaseTop + (k / nPHoriz) * (pTopY - yBaseTop - pCov);
        addLine(pLeft + pCov, yBar, pRight - pCov, yBar, stL, false, 0.95);
      }

      if (!targetLayerOverride) {
        drawDimV(yBaseTop, pTopY, pLeft, pLeft, pLeft - 38, pierH, 66, 10, 10);
      }

      curX = pRight;
    }
  }
  addLine(xSlitL, yWeirCrest, xSlitL, yBaseTop, sL, false, 1.5);
  addLine(xSlitR, yWeirCrest, xSlitR, yBaseTop, sL, false, 1.5);

  if (!targetLayerOverride) {
    const yWeirDimBase = Math.max(yWeirCrest, yBaseTop + d.maxPierH);
    const drawSectionCut = (xCut, label) => {
      addLine(xCut, yWeirDimBase + 100, xCut, yWeirDimBase + 260, 'CENTER', false, 1.3);
      addLine(xCut, yWeirDimBase + 260, xCut - 110, yWeirDimBase + 260, 'CENTER', false, 1.3);
      addText(xCut - 140, yWeirDimBase + 240, label, 90, 'TEXT', 'right');

      addLine(xCut, yKeyBot - 120, xCut, yKeyBot - 280, 'CENTER', false, 1.3);
      addLine(xCut, yKeyBot - 280, xCut - 110, yKeyBot - 280, 'CENTER', false, 1.3);
      addText(xCut - 140, yKeyBot - 300, label, 90, 'TEXT', 'right');
    };

    // Centerline ℄ on Rebar Elevation
    addLine(xCenter, yKeyBot - 320, xCenter, yWeirDimBase + 380, 'CENTER', true, 1.0);
    addText(xCenter, yWeirDimBase + 440, '℄', 120, 'CENTER', 'center');

    // Section a-a on overflow weir, plus dynamic b-b, c-c, d-d... on each distinct pier height
    drawSectionCut(xWeirL + p.W_ovf_L * 0.55, 'a');
    const secLetters = ['b', 'c', 'd', 'e', 'f', 'g'];
    d.uniquePierHeights.forEach((uh, idx) => {
      const xCut = sectionCutMap.get(uh);
      if (xCut !== undefined && idx < secLetters.length) {
        drawSectionCut(xCut, secLetters[idx]);
      }
    });

    const yDim2 = yWeirDimBase + 460;
    drawDimH(xWeirL, xSlitL, yWeirCrest, yWeirCrest, yDim2, p.W_ovf_L, 90, 35, 25);
    drawDimH(xSlitL, xSlitR, yWeirCrest, yWeirCrest, yDim2, d.W_slit, 90, 35, 25);
    drawDimH(xSlitR, xWeirR, yWeirCrest, yWeirCrest, yDim2, p.W_ovf_R, 90, 35, 25);

    const yDim3 = Math.max(yWingPeak, yDim2) + 340;
    drawDimH(x0, xWingL, yWingPeak, yUpperTop, yDim3, p.W_wing_L, 95, 40, 30);
    drawDimH(xWingL, xWeirL, yUpperTop, yWeirCrest, yDim3, p.W_slope_L, 95, 40, 30);
    drawDimH(xWeirL, xWeirR, yWeirCrest, yWeirCrest, yDim3, d.W_weir, 95, 40, 30);
    drawDimH(xWeirR, xWingR, yWeirCrest, yUpperTop, yDim3, p.W_slope_R, 95, 40, 30);
    drawDimH(xWingR, xEnd, yUpperTop, yWingPeak, yDim3, p.W_wing_R, 95, 40, 30);

    const yDim4 = yDim3 + 340;
    drawDimH(x0, xEnd, yWingPeak, yWingPeak, yDim4, d.L_total, 110, 50, 35);

    const yDimBot = yKeyBot - 360;
    drawDimH(x0, xBaseL, yUpperTop, yKeyBot, yDimBot, p.W_cut_L, 95, 40, 30);
    drawDimH(xBaseL, xBaseR, yKeyBot, yKeyBot, yDimBot, d.L_base, 105, 40, 30);
    drawDimH(xBaseR, xEnd, yKeyBot, yUpperTop, yDimBot, p.W_cut_R, 95, 40, 30);

    const xDimR1 = xEnd + 320;
    const xDimR2 = xEnd + 620;
    if (p.D_key > 0) drawDimV(yKeyBot, yBaseBot, xBaseR, xBaseR, xDimR1, p.D_key, 85, 40, 25);
    drawDimV(yBaseBot, yBaseTop, xBaseR, xBaseR, xDimR1, p.T_base, 85, 40, 25);
    drawDimV(yBaseTop, yUpperTop, xBaseR, xEnd, xDimR1, d.H_dam_body, 90, 40, 25);
    drawDimV(yUpperTop, yWingPeak, xEnd, xEnd, xDimR1, p.H_wing_rise, 85, 40, 25);
    drawDimV(yKeyBot, yWingPeak, xBaseR, xEnd, xDimR2, d.H_total, 105, 50, 35);

    drawLeader([[xSlitR - p.W_slot - p.W_pier * 0.4, yBaseTop + d.pierHeights[d.N_pier - 1] - 60], [xSlitR + 180, yWeirDimBase + 240], [xSlitR + 360, yWeirDimBase + 240]], `Ø16mm@${p.S_rebar_pier}cm`, 85, 'left');
    drawLeader([[xBaseR - 600, yBaseBot + 40], [xBaseR + 850, yBaseBot + 40]], `Ø13mm@${p.S_rebar_main}cm 箍筋`, 85, 'left');
    drawLeader([[xBaseR - 1100, yKeyBot + 50], [xBaseR - 1100, yKeyBot - 520], [xBaseR - 1300, yKeyBot - 520]], `Ø19mm@${p.S_rebar_main}cm`, 85, 'right');

    const xNotesP8 = xEnd - 2600;
    const yNotesP8 = yDim4 + 850;
    addText(xNotesP8, yNotesP8, '工程說明：', 110, 'TEXT', 'left');
    addText(xNotesP8, yNotesP8 - 180, '1. 梳子壩混凝土為 280 kgf/cm2。', 95, 'TEXT', 'left');
    addText(xNotesP8, yNotesP8 - 360, '2. 基礎開挖時，須有臨時排水及擋土支撐等設施，以保障人員安全。', 95, 'TEXT', 'left');
    addText(xNotesP8, yNotesP8 - 540, `3. 鋼筋保護層為 ${p.C_rebar} ± 0.6 公分。`, 95, 'TEXT', 'left');

    addText(xCenter, yKeyBot - 750, '梳子壩鋼筋配置圖', 155, 'TEXT', 'center');
    addLine(xCenter - 680, yKeyBot - 795, xCenter + 680, yKeyBot - 795, 'STRUCT', false, 1.2);
    addLine(xCenter - 680, yKeyBot - 820, xCenter + 680, yKeyBot - 820, 'STRUCT', false, 0.8);
  }
}

function buildSingleRebarSectionSubView(p, d, isPierSec, H_crest_cm, sectionTitle, targetLayerOverride = null) {
  const sL = targetLayerOverride || 'STRUCT';
  const rL = targetLayerOverride || 'REBAR';
  const stL = targetLayerOverride || 'STIRRUP';
  const scSec = 2.65;

  const sKeyD = p.D_key * scSec;
  const sBaseT = p.T_base * scSec;
  const sCrestH = H_crest_cm * scSec;
  const sCov = p.C_rebar * scSec;

  const yKBot = -sKeyD;
  const yBBot = 0;
  const yBTop = yBBot + sBaseT;
  const yCTop = yBTop + sCrestH;

  const xBUp = 0;
  const xBDn = xBUp + d.B_base * scSec;
  const xCUp = xBUp + H_crest_cm * p.S_up * scSec;
  const bTopCm = d.getPierTopWidthCm(H_crest_cm);
  const xCDn = xCUp + bTopCm * scSec;

  const xKBotUp = xBUp;
  const xKBotDn = xBUp + p.B_key_bot * scSec;
  const xKTopDn = xBUp + d.B_key_top * scSec;

  // 1. Concrete Outer Profile
  const pts = [
    [xBUp, yBTop],
    [xCUp, yCTop],
    [xCDn, yCTop],
    [xBDn, yBTop],
    [xBDn, yBBot]
  ];
  if (p.D_key > 0) {
    pts.push([xKTopDn, yBBot], [xKBotDn, yKBot], [xKBotUp, yKBot]);
  } else {
    pts.push([xBUp, yBBot]);
  }
  addPoly(pts, true, sL, false, 1.7);

  // 2. Base Slab & Cutoff Key Stirrup Cage
  if (p.D_key > 0) {
    addPoly([
      [xBUp + sCov, yBTop - sCov],
      [xBUp + sCov, yKBot + sCov],
      [xKBotDn - sCov, yKBot + sCov],
      [xKTopDn - sCov, yBBot + sCov],
      [xBUp + sCov, yBBot + sCov]
    ], true, stL, false, 1.3);
  }
  addPoly([
    [xBUp + sCov, yBTop - sCov],
    [xBDn - sCov, yBTop - sCov],
    [xBDn - sCov, yBBot + sCov],
    [xBUp + sCov, yBBot + sCov]
  ], true, stL, false, 1.3);

  // 3. Outer U-bar / Face Rebar around Dam Crest & Slopes
  addPoly([
    [xBUp + sCov * 1.2, yBBot + sCov * 1.4],
    [xCUp + sCov * 0.9, yCTop - sCov],
    [xCDn - sCov * 0.9, yCTop - sCov],
    [xBDn - sCov * 1.2, yBBot + sCov * 1.4]
  ], false, rL, false, 1.5);

  const dotR = 14;
  for (let i = 0; i <= 7; i++) {
    const tx = xBUp + sCov * 1.5 + (i / 7) * (d.B_base * scSec - 3 * sCov);
    addCircle(tx, yBTop - sCov * 1.3, dotR, rL, true);
    addCircle(tx, yBBot + sCov * 1.3, dotR, rL, true);
  }
  if (p.D_key > 0) {
    for (let i = 1; i <= 5; i++) {
      const ty = yKBot + sCov * 1.4 + (i / 6) * (sKeyD + sBaseT - 2.8 * sCov);
      addCircle(xBUp + sCov * 1.4, ty, dotR, rL, true);
      const rx = xKBotDn - sCov + ((ty - yKBot) / (sKeyD || 1)) * (d.B_key_top - p.B_key_bot) * scSec;
      if (ty < yBBot) addCircle(rx, ty, dotR, rL, true);
    }
  }

  const n_top_u = Math.max(3, Math.round(9 + ((H_crest_cm - 500) / 100) * 2));
  const L_loop = Number((6.3 + ((H_crest_cm - 500) / 100) * 1.1).toFixed(2));

  if (isPierSec) {
    for (let i = 0; i < n_top_u; i++) {
      const t = i / Math.max(1, n_top_u - 1);
      const bx = xCDn - sCov + t * (xBDn - xCDn);
      const by = yCTop - sCov + t * (yBTop - yCTop);
      addCircle(bx - 18, by - 10, dotR, rL, true);
    }
  }

  if (!targetLayerOverride) {
    addText(xBUp + 90, (yBTop + yCTop) / 2, `1:${p.S_up}`, 90, 'TEXT', 'center', 73);
    addText(xCDn + (xBDn - xCDn) * 0.55 + 110, (yBTop + yCTop) / 2 + 80, `1:${p.S_dn}`, 90, 'TEXT', 'center', -63);
    if (p.D_key > 0) {
      addText(xKTopDn + 90, (yKBot + yBBot) / 2, `1:${p.S_up}`, 85, 'TEXT', 'center', 73);
    }

    if (!isPierSec) {
      drawLeader([[xCUp + (xCDn - xCUp) * 0.4, yCTop - sCov], [xCUp + (xCDn - xCUp) * 0.4, yCTop + 320], [xCUp + (xCDn - xCUp) * 0.4 + 180, yCTop + 320]], `Ø16mm@${p.S_rebar_main}cm L=${d.L_outer_u}m-${d.n_bays_main}支`, 85, 'left');
      drawLeader([[xBDn - 120, yBTop - sCov], [xBDn + 150, yBTop + 260], [xBDn + 300, yBTop + 260]], `箍筋 Ø13mm@${p.S_rebar_main}cm L=3.0m-${d.n_bays_main}支`, 85, 'left');
      drawLeader([[xBDn - 200, yBBot + sCov], [xBDn + 150, yBBot - 80], [xBDn + 300, yBBot - 80]], `Ø19mm@${p.S_rebar_main}cm L=${d.m_rebar_span}m-8支`, 85, 'left');
      drawLeader([[xBUp + 480, yBBot + sCov], [xBUp + 680, yBBot - 450], [xBUp + 820, yBBot - 450]], `Ø16mm@${p.S_rebar_main}cm L=${d.m_rebar_span}m-24支`, 85, 'left');
      drawLeader([[xBUp + sCov, yKBot + 90], [xBUp + 320, yKBot - 280], [xBUp + 480, yKBot - 280]], `Ø19mm@${p.S_rebar_main}cm L=${d.m_rebar_span}m-28支`, 85, 'left');
      drawLeader([[xBUp + sCov, yKBot + sKeyD * 0.5], [xBUp - 180, yKBot + sKeyD * 0.65], [xBUp - 320, yKBot + sKeyD * 0.65]], `箍筋 Ø13mm@${p.S_rebar_main}cm L=9.0m-${d.n_bays_main}支`, 85, 'right');
      drawDimV(yBTop - sCov, yBTop, xBUp, xBUp, xBUp - 120, p.C_rebar, 80, 15, 15);
    } else {
      drawLeader([[xCDn - 40, yCTop - sCov], [xCDn + 380, yCTop + 450], [xCDn + 520, yCTop + 450]], `Ø16mm@${p.S_rebar_pier}cm L=2.2m-${n_top_u}支`, 85, 'left');
      drawLeader([[xCDn + (xBDn - xCDn) * 0.25, yCTop - (yCTop - yBTop) * 0.25], [xCDn + 480, yCTop + 120], [xCDn + 620, yCTop + 120]], `Ø16mm@${p.S_rebar_pier}cm L=${L_loop}m-${d.n_pier_bars}支`, 85, 'left');
      drawLeader([[xCDn + (xBDn - xCDn) * 0.55, yCTop - (yCTop - yBTop) * 0.55], [xCDn + 560, yCTop - 280], [xCDn + 700, yCTop - 280]], `Ø16mm@${p.S_rebar_pier}cm L=2.2m-5支`, 85, 'left');
      drawLeader([[xBDn - 260, yBBot + sCov], [xBDn - 420, yBBot - 450], [xBDn - 260, yBBot - 450]], `Ø16mm@${p.S_rebar_pier}cm L=3.85m-${d.n_pier_anc}支`, 85, 'left');
      addText(xBDn - 280, yBTop + 320, '300', 85, 'TEXT', 'center', -63);
      drawDimV(yBBot + sCov, yBTop + 40, xBDn, xBDn, xBDn + 260, 85, 80, 20, 20);
      drawDimV(yBTop, yCTop, xBUp, xCUp, xBUp - 160, H_crest_cm, 85, 25, 20);
    }

    addText((xBUp + xBDn) / 2, yKBot - 550, sectionTitle, 130, 'TEXT', 'center');
    addLine((xBUp + xBDn) / 2 - 680, yKBot - 595, (xBUp + xBDn) / 2 + 680, yKBot - 595, 'STRUCT', false, 1.2);
    addLine((xBUp + xBDn) / 2 - 680, yKBot - 620, (xBUp + xBDn) / 2 + 680, yKBot - 620, 'STRUCT', false, 0.8);
  }
}

function buildStirrupSubView(p, d, targetLayerOverride = null) {
  const stL = targetLayerOverride || 'STIRRUP';
  const scSec = 2.65;
  const xStir = 0;
  const yStirBot1 = 350;
  const stScale = 4.2;
  const wSt = 70 * stScale;
  const hSt1 = Math.max(70, (p.D_key + p.T_base - 2 * p.C_rebar)) * stScale;
  const hSt2 = Math.max(40, (p.T_base - 2 * p.C_rebar)) * stScale;

  addPoly([
    [xStir, yStirBot1],
    [xStir, yStirBot1 + hSt1],
    [xStir + wSt, yStirBot1 + hSt1],
    [xStir + wSt, yStirBot1]
  ], true, stL, false, 1.6);

  const yStirBot2 = -650;
  addPoly([
    [xStir, yStirBot2],
    [xStir, yStirBot2 + hSt2],
    [xStir + wSt, yStirBot2 + hSt2],
    [xStir + wSt, yStirBot2]
  ], true, stL, false, 1.6);

  if (!targetLayerOverride) {
    addLine(xStir + wSt, yStirBot1 + 60, xStir + wSt - 75, yStirBot1 + 135, stL, false, 1.4);
    addLine(xStir + wSt, yStirBot2 + 60, xStir + wSt - 75, yStirBot2 + 135, stL, false, 1.4);

    drawDimH(xStir, xStir + wSt, yStirBot1 + hSt1, yStirBot1 + hSt1, yStirBot1 + hSt1 + 120, 70, 90, 20, 20);
    drawDimV(yStirBot1, yStirBot1 + hSt1, xStir, xStir, xStir - 110, Math.round(p.D_key + p.T_base - 2 * p.C_rebar), 90, 20, 20);
    addText(xStir + wSt + 150, yStirBot1 + 110, '10', 85, 'TEXT', 'center', -45);
    drawLeader([[xStir, yStirBot1 + hSt1 * 0.72], [xStir - 220, yStirBot1 + hSt1 * 0.85], [xStir - 360, yStirBot1 + hSt1 * 0.85]], '箍筋 Ø13mm', 85, 'right');

    drawDimH(xStir, xStir + wSt, yStirBot2 + hSt2, yStirBot2 + hSt2, yStirBot2 + hSt2 + 120, 70, 90, 20, 20);
    drawDimV(yStirBot2, yStirBot2 + hSt2, xStir, xStir, xStir - 110, Math.round(p.T_base - 2 * p.C_rebar), 90, 20, 20);
    addText(xStir + wSt + 150, yStirBot2 + 110, '10', 85, 'TEXT', 'center', -45);
    drawLeader([[xStir, yStirBot2 + hSt2 * 0.6], [xStir - 220, yStirBot2 + hSt2 * 0.9], [xStir - 360, yStirBot2 + hSt2 * 0.9]], '箍筋 Ø13mm', 85, 'right');

    const yKBotRef = -p.D_key * scSec;
    addText(xStir + wSt / 2, yKBotRef - 550, '箍筋示意圖', 130, 'TEXT', 'center');
    addLine(xStir + wSt / 2 - 480, yKBotRef - 595, xStir + wSt / 2 + 480, yKBotRef - 595, 'STRUCT', false, 1.2);
    addLine(xStir + wSt / 2 - 480, yKBotRef - 620, xStir + wSt / 2 + 480, yKBotRef - 620, 'STRUCT', false, 0.8);
  }
}

// Assemble PAGE_08 using Dynamic Bounding-Box Layout (Never Overlaps!)
function buildPage08(p, d, offsetX = 0, offsetY = 0, targetLayerOverride = null) {
  const vElev = captureSubView(() => buildP8ElevSubView(p, d, targetLayerOverride));

  // Build sub-views for Section a-a, each distinct Pier Height section (b-b, c-c...), and Stirrup detail
  const bottomSubViews = [];
  bottomSubViews.push(captureSubView(() => buildSingleRebarSectionSubView(
    p, d, false, p.H_lower, 'a-a 溢流段鋼筋剖面圖', targetLayerOverride
  )));

  const secLetters = ['b', 'c', 'd', 'e', 'f', 'g'];
  d.uniquePierHeights.forEach((uh, idx) => {
    const lbl = secLetters[idx] || `p${idx + 1}`;
    bottomSubViews.push(captureSubView(() => buildSingleRebarSectionSubView(
      p, d, true, uh, `${lbl}-${lbl} 梳齒墩鋼筋剖面圖 (H=${uh}cm)`, targetLayerOverride
    )));
  });

  bottomSubViews.push(captureSubView(() => buildStirrupSubView(p, d, targetLayerOverride)));

  // 1. Place Rebar Elevation View
  const yElevOrigin = offsetY + 4600;
  const boxElev = placeSubView(vElev, offsetX, yElevOrigin);

  // 2. Place all Rebar Cross-Section Details & Stirrup View in a non-overlapping row strictly below boxElev!
  const maxSecH = Math.max(...bottomSubViews.map(sv => sv.bbox.height));
  const gapElevSec = Math.max(950, vElev.bbox.height * 0.25);
  const targetSecMaxY = boxElev.minY - gapElevSec;

  let curLeftX = offsetX;
  bottomSubViews.forEach((sv, idx) => {
    const dx = curLeftX - sv.bbox.minX;
    // Align base slab bottoms (local Y=0) along the same baseline while ensuring maxY <= targetSecMaxY
    const dy = targetSecMaxY - maxSecH * 0.62;
    const placedBox = placeSubView(sv, dx, dy);
    const gapBetweenSecs = Math.max(650, sv.bbox.width * 0.16);
    curLeftX = placedBox.maxX + gapBetweenSecs;
  });
}

// ============================================================================
// 6. Master Scene Assembly & Dynamic Sheet-Level Bounding-Box Placement
// ============================================================================
function rebuildScene() {
  scenePrimitives = [];
  activeBuffer = scenePrimitives;
  const d = computeDerivedAndQuantities(params);

  // Optional 1:1 Original DXF Reference Overlay
  if (showRefOverlay) {
    const dDef = computeDerivedAndQuantities(DEFAULT_PARAMS);
    if (currentViewMode === 'PAGE_07') {
      buildPage07(DEFAULT_PARAMS, dDef, 0, 0, 'REF');
    } else if (currentViewMode === 'PAGE_08') {
      buildPage08(DEFAULT_PARAMS, dDef, 0, 0, 'REF');
    } else {
      const refP7 = captureSubView(() => buildPage07(DEFAULT_PARAMS, dDef, 0, 0, 'REF'));
      const boxRefP7 = placeSubView(refP7, 0, 0);
      const refP8 = captureSubView(() => buildPage08(DEFAULT_PARAMS, dDef, 0, 0, 'REF'));
      const gapSheets = Math.max(2800, boxRefP7.width * 0.18);
      placeSubView(refP8, boxRefP7.maxX + gapSheets - refP8.bbox.minX, 0);
    }
  }

  // Active Parametric Drawing with Sheet-Level BBox Non-Overlapping Placement
  if (currentViewMode === 'PAGE_07') {
    buildPage07(params, d, 0, 0, null);
  } else if (currentViewMode === 'PAGE_08') {
    buildPage08(params, d, 0, 0, null);
  } else {
    // 'ALL' mode: Measure PAGE_07 BBox first, then place PAGE_08 strictly to its right + dynamic gap!
    const sheetP7 = captureSubView(() => buildPage07(params, d, 0, 0, null));
    const boxP7 = placeSubView(sheetP7, 0, 0);

    const sheetP8 = captureSubView(() => buildPage08(params, d, 0, 0, null));
    const gapSheets = Math.max(2800, boxP7.width * 0.18);
    const dxP8 = (boxP7.maxX + gapSheets) - sheetP8.bbox.minX;
    placeSubView(sheetP8, dxP8, 0);
  }

  sceneBounds = getGroupBBox(scenePrimitives);
}

// Golden Rule 6: Dimension lines with explicit extension gap (extGap) so they NEVER touch structure corners
function drawDimH(x1, x2, yStruct1, yStruct2, yDim, label, size = 95, extGap = 35, extOver = 30, layer = 'DIM') {
  const minX = Math.min(x1, x2);
  const maxX = Math.max(x1, x2);
  const span = maxX - minX;
  if (span < 1e-3) return;

  const dir1 = yDim >= yStruct1 ? 1 : -1;
  const dir2 = yDim >= yStruct2 ? 1 : -1;

  // Extension lines with gap from structure corner
  addLine(x1, yStruct1 + dir1 * extGap, x1, yDim + dir1 * extOver, layer, false, 1.0);
  addLine(x2, yStruct2 + dir2 * extGap, x2, yDim + dir2 * extOver, layer, false, 1.0);

  // Main dimension line
  addLine(minX, yDim, maxX, yDim, layer, false, 1.0);

  // Arrowheads
  const arrL = Math.min(45, span * 0.22);
  const arrW = arrL * 0.32;
  addPoly([[minX + arrL, yDim + arrW], [minX, yDim], [minX + arrL, yDim - arrW]], false, layer, false, 1.1);
  addPoly([[maxX - arrL, yDim + arrW], [maxX, yDim], [maxX - arrL, yDim - arrW]], false, layer, false, 1.1);

  // Dimension text
  addText((minX + maxX) / 2, yDim + size * 0.35, label, size, 'TEXT', 'center', 0);
}

function drawDimV(y1, y2, xStruct1, xStruct2, xDim, label, size = 95, extGap = 35, extOver = 30, layer = 'DIM') {
  const minY = Math.min(y1, y2);
  const maxY = Math.max(y1, y2);
  const span = maxY - minY;
  if (span < 1e-3) return;

  const dir1 = xDim >= xStruct1 ? 1 : -1;
  const dir2 = xDim >= xStruct2 ? 1 : -1;

  addLine(xStruct1 + dir1 * extGap, y1, xDim + dir1 * extOver, y1, layer, false, 1.0);
  addLine(xStruct2 + dir2 * extGap, y2, xDim + dir2 * extOver, y2, layer, false, 1.0);

  addLine(xDim, minY, xDim, maxY, layer, false, 1.0);

  const arrL = Math.min(45, span * 0.22);
  const arrW = arrL * 0.32;
  addPoly([[xDim - arrW, minY + arrL], [xDim, minY], [xDim + arrW, minY + arrL]], false, layer, false, 1.1);
  addPoly([[xDim - arrW, maxY - arrL], [xDim, maxY], [xDim + arrW, maxY - arrL]], false, layer, false, 1.1);

  const textOffset = dir1 >= 0 ? (xDim - size * 0.35) : (xDim - size * 0.35);
  addText(textOffset, (minY + maxY) / 2, label, size, 'TEXT', 'center', 90);
}

function drawLeader(pts, text, size = 90, align = 'left', layer = 'DIM') {
  if (pts.length < 2) return;
  addPoly(pts, false, layer, false, 1.0);
  // Small arrow at pts[0]
  const dx = pts[1][0] - pts[0][0];
  const dy = pts[1][1] - pts[0][1];
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len, uy = dy / len;
  const px = -uy, py = ux;
  const aL = 32, aW = 10;
  addPoly([
    [pts[0][0] + ux * aL + px * aW, pts[0][1] + uy * aL + py * aW],
    [pts[0][0], pts[0][1]],
    [pts[0][0] + ux * aL - px * aW, pts[0][1] + uy * aL - py * aW]
  ], false, layer, false, 1.0);

  const last = pts[pts.length - 1];
  const offsetX = align === 'left' ? 20 : (align === 'right' ? -20 : 0);
  addText(last[0] + offsetX, last[1] - size * 0.3, text, size, 'TEXT', align, 0);
}

// Golden Rule 3: Multi-ring natural boulder generator (Dynamic count, NEVER stretched)
function drawNaturalBoulder(cx, cy, rx, ry, seed, layer = 'STONE') {
  const nVerts = 9;
  const rings = [1.0, 0.66, 0.35];
  for (let rIdx = 0; rIdx < rings.length; rIdx++) {
    const scale = rings[rIdx];
    const pts = [];
    for (let i = 0; i < nVerts; i++) {
      const baseAng = (i / nVerts) * Math.PI * 2;
      const jitterAng = (seededRandom(seed + i * 7 + rIdx * 31) - 0.5) * 0.32;
      const radFactor = scale * (0.78 + 0.26 * seededRandom(seed + i * 13 + rIdx * 17));
      const px = cx + Math.cos(baseAng + jitterAng) * rx * radFactor;
      const py = cy + Math.sin(baseAng + jitterAng) * ry * radFactor;
      pts.push([px, py]);
    }
    addPoly(pts, true, layer, false, rIdx === 0 ? 1.15 : 0.75);
  }
}

// Fill a rectangular strip with dynamic stone count based on D_rock (Golden Rule 3)
function fillRectWithStones(xMin, yMin, xMax, yMax, dRock, seedBase = 100, layer = 'STONE') {
  const width = xMax - xMin;
  const height = yMax - yMin;
  if (width <= 20 || height <= 20) return;

  const pitch = Math.max(60, dRock * 0.92);
  const cols = Math.max(1, Math.round(width / pitch));
  const rows = Math.max(1, Math.round(height / pitch));
  const cellW = width / cols;
  const cellH = height / rows;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const seed = seedBase + r * 137 + c * 53;
      const jx = (seededRandom(seed + 1) - 0.5) * cellW * 0.22;
      const jy = (seededRandom(seed + 2) - 0.5) * cellH * 0.22;
      const cx = xMin + (c + 0.5) * cellW + jx;
      const cy = yMin + (r + 0.5) * cellH + jy;
      const rx = Math.min(cellW, dRock) * 0.43;
      const ry = Math.min(cellH, dRock) * 0.43;
      drawNaturalBoulder(cx, cy, rx, ry, seed, layer);
    }
  }
}

// ============================================================================
// 7. HTML5 2D Canvas Renderer & Viewport Controller
// ============================================================================
const canvas = document.getElementById('cadCanvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
  const container = document.getElementById('canvasContainer');
  const dpr = window.devicePixelRatio || 1;
  canvas.width = container.clientWidth * dpr;
  canvas.height = container.clientHeight * dpr;
  renderCAD();
}

function worldToScreen(wx, wy) {
  const dpr = window.devicePixelRatio || 1;
  const sx = (wx - cam.x) * cam.scale * dpr + canvas.width * 0.5;
  const sy = canvas.height * 0.5 - (wy - cam.y) * cam.scale * dpr;
  return [sx, sy];
}

function screenToWorld(sx, sy) {
  const dpr = window.devicePixelRatio || 1;
  const wx = (sx * dpr - canvas.width * 0.5) / (cam.scale * dpr) + cam.x;
  const wy = (canvas.height * 0.5 - sy * dpr) / (cam.scale * dpr) + cam.y;
  return [wx, wy];
}

function zoomToFit() {
  rebuildScene();
  const container = document.getElementById('canvasContainer');
  const cw = container.clientWidth || 900;
  const ch = container.clientHeight || 650;

  const bw = Math.max(1000, sceneBounds.maxX - sceneBounds.minX);
  const bh = Math.max(1000, sceneBounds.maxY - sceneBounds.minY);

  cam.x = (sceneBounds.minX + sceneBounds.maxX) * 0.5;
  cam.y = (sceneBounds.minY + sceneBounds.maxY) * 0.5;
  cam.scale = Math.min((cw * 0.88) / bw, (ch * 0.86) / bh);

  renderCAD();
}

function renderCAD() {
  rebuildScene();
  const dpr = window.devicePixelRatio || 1;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Subtle CAD coordinate grid
  ctx.save();
  ctx.strokeStyle = '#161b22';
  ctx.lineWidth = 1;
  const gridStepPx = 60 * dpr;
  for (let x = 0; x < canvas.width; x += gridStepPx) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
  }
  for (let y = 0; y < canvas.height; y += gridStepPx) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
  }
  ctx.restore();

  // Render all CAD primitives
  scenePrimitives.forEach(prim => {
    const color = LAYER_COLORS[prim.layer] || '#ffffff';
    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;

    if (prim.layer === 'REF') {
      ctx.setLineDash([6 * dpr, 4 * dpr]);
      ctx.globalAlpha = 0.65;
    } else if (prim.dashed) {
      ctx.setLineDash([8 * dpr, 5 * dpr]);
    }

    if (prim.type === 'LINE') {
      const [x1, y1] = worldToScreen(prim.x1, prim.y1);
      const [x2, y2] = worldToScreen(prim.x2, prim.y2);
      ctx.lineWidth = (prim.lineWidth || 1.2) * dpr;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    } else if (prim.type === 'POLY') {
      ctx.lineWidth = (prim.lineWidth || 1.2) * dpr;
      ctx.beginPath();
      prim.pts.forEach((pt, idx) => {
        const [sx, sy] = worldToScreen(pt[0], pt[1]);
        if (idx === 0) ctx.moveTo(sx, sy);
        else ctx.lineTo(sx, sy);
      });
      if (prim.closed) ctx.closePath();
      if (prim.fill) {
        ctx.fillStyle = prim.fill;
        ctx.fill();
      }
      ctx.stroke();
    } else if (prim.type === 'CIRCLE') {
      const [cx, cy] = worldToScreen(prim.cx, prim.cy);
      const sr = Math.max(1.8 * dpr, prim.r * cam.scale * dpr);
      ctx.beginPath();
      ctx.arc(cx, cy, sr, 0, Math.PI * 2);
      if (prim.filled) ctx.fill();
      else ctx.stroke();
    } else if (prim.type === 'TEXT') {
      const [tx, ty] = worldToScreen(prim.x, prim.y);
      const fontPx = Math.max(8 * dpr, prim.size * cam.scale * dpr);
      if (fontPx > 4.5) {
        ctx.font = `500 ${fontPx.toFixed(1)}px "JetBrains Mono", "Noto Sans TC", sans-serif`;
        ctx.textAlign = prim.align || 'center';
        ctx.textBaseline = 'middle';
        if (prim.angleDeg) {
          ctx.translate(tx, ty);
          ctx.rotate((-prim.angleDeg * Math.PI) / 180);
          ctx.fillText(prim.text, 0, 0);
        } else {
          ctx.fillText(prim.text, tx, ty);
        }
      }
    }
    ctx.restore();
  });

  document.getElementById('hudZoom').textContent = `Zoom: ${Math.round(cam.scale * 1200)}%`;
}

// Mouse Pan & Wheel Zoom Listeners
canvas.addEventListener('mousedown', e => {
  if (e.button !== 0) return;
  cam.isDragging = true;
  cam.dragStartX = e.clientX;
  cam.dragStartY = e.clientY;
  cam.camStartX = cam.x;
  cam.camStartY = cam.y;
});

window.addEventListener('mousemove', e => {
  const rect = canvas.getBoundingClientRect();
  const [wx, wy] = screenToWorld(e.clientX - rect.left, e.clientY - rect.top);
  document.getElementById('hudCursor').textContent = `X: ${Math.round(wx)}, Y: ${Math.round(wy)} cm`;

  if (!cam.isDragging) return;
  const dx = e.clientX - cam.dragStartX;
  const dy = e.clientY - cam.dragStartY;
  cam.x = cam.camStartX - dx / cam.scale;
  cam.y = cam.camStartY + dy / cam.scale;
  renderCAD();
});

window.addEventListener('mouseup', () => {
  cam.isDragging = false;
});

canvas.addEventListener('wheel', e => {
  e.preventDefault();
  const rect = canvas.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  const my = e.clientY - rect.top;
  const [wxBefore, wyBefore] = screenToWorld(mx, my);

  const zoomFactor = e.deltaY < 0 ? 1.14 : 0.88;
  cam.scale = Math.max(0.008, Math.min(2.5, cam.scale * zoomFactor));

  const [wxAfter, wyAfter] = screenToWorld(mx, my);
  cam.x += (wxBefore - wxAfter);
  cam.y += (wyBefore - wyAfter);
  renderCAD();
}, { passive: false });

canvas.addEventListener('dblclick', () => {
  zoomToFit();
});

window.addEventListener('resize', resizeCanvas);

// ============================================================================
// 8. Sidebar UI & Live Formula Synchronization (Golden Rule 4: No zoomToFit on input)
// ============================================================================
function updateSidebarUI() {
  const d = computeDerivedAndQuantities(params);

  // Update KPI Cards
  document.getElementById('kpiConc').textContent = d.V_conc.toFixed(2);
  document.getElementById('kpiForm').textContent = d.A_form.toFixed(2);
  document.getElementById('kpiRebar').textContent = d.W_rebar.toFixed(2);
  document.getElementById('kpiStone').textContent = d.V_stone.toFixed(2);

  // Update Derived Badges
  document.getElementById('drv_W_slit').textContent = `${d.W_slit} cm (${d.N_pier}墩${d.N_slot}槽)`;
  document.getElementById('drv_W_weir').textContent = `${d.W_weir} cm`;
  document.getElementById('drv_L_total').textContent = `${d.L_total} cm`;
  document.getElementById('drv_L_base').textContent = `${d.L_base} cm`;
  document.getElementById('drv_H_total').textContent = `${d.H_total} cm`;
  document.getElementById('drv_B_slot').textContent = `${Math.round(d.B_slot)} cm`;
  document.getElementById('drv_B_base').textContent = `${Math.round(d.B_base)} cm`;
  document.getElementById('drv_B_key_heel').textContent = `${Math.round(d.B_key_top)} / ${Math.round(d.L_heel)} cm`;
  document.getElementById('drv_A_apron').textContent = `${d.A_apron_dn.toFixed(2)} m²`;

  // Update Bottom Live Formula Inspection Drawer
  const fBox = document.getElementById('formulaContent');
  fBox.innerHTML = `
    <div class="p-1.5 rounded bg-[#0d1117] border border-[#30363d]/80">
      <span class="text-[#00e5ff] font-bold">1. 280kgf/cm² 混凝土 (${d.V_conc.toFixed(2)} m³)：</span>
      <span class="text-[#e6edf3]">${d.f_conc_str1} ${d.f_conc_str2}</span>
    </div>
    <div class="p-1.5 rounded bg-[#0d1117] border border-[#30363d]/80">
      <span class="text-[#ffb300] font-bold">2. 軀體模板 (${d.A_form.toFixed(2)} m²)：</span>
      <span class="text-[#e6edf3]">${d.f_form_str1} ${d.f_form_str2}</span>
    </div>
    <div class="p-1.5 rounded bg-[#0d1117] border border-[#30363d]/80">
      <span class="text-[#ff7b72] font-bold">3. 鋼筋(含損耗 5%) (${d.W_rebar.toFixed(2)} kg)：</span>
      <span class="text-[#e6edf3]">${d.f_rebar_str1} ${d.f_rebar_str2}</span>
    </div>
    <div class="p-1.5 rounded bg-[#0d1117] border border-[#30363d]/80">
      <span class="text-[#3fb950] font-bold">4. 漿砌塊石 (${d.V_stone.toFixed(2)} m³)：</span>
      <span class="text-[#e6edf3]">${d.f_stone_str}</span>
    </div>
  `;
}

// Golden Rule 4: Editing parameters ONLY updates UI & renders CAD without resetting camera zoom!
function onParamChange(key, rawVal) {
  const val = parseFloat(rawVal);
  if (isNaN(val)) return;
  params[key] = val;
  updateSidebarUI();
  renderCAD();
}

function switchViewMode(mode) {
  currentViewMode = mode;
  document.getElementById('btnViewP7').classList.toggle('active', mode === 'PAGE_07');
  document.getElementById('btnViewP8').classList.toggle('active', mode === 'PAGE_08');
  document.getElementById('btnViewAll').classList.toggle('active', mode === 'ALL');

  const titles = {
    PAGE_07: 'PAGE_07：梳子壩一般構造圖與數量表 (平面 / 正視 / 側視 / 算式)',
    PAGE_08: 'PAGE_08：梳子壩鋼筋配置圖与剖面大樣 (a-a / b-b / c-c / 箍筋)',
    ALL: 'ALL：雙圖同屏總覽 (PAGE_07 構造圖 + PAGE_08 鋼筋配置圖)'
  };
  document.getElementById('hudViewTitle').textContent = titles[mode];
  zoomToFit();
}

function toggleRefOverlay(checked) {
  showRefOverlay = checked;
  renderCAD();
}

function applyPreset(presetKey) {
  const pSet = PRESETS[presetKey] || PRESETS.default;
  params = { ...pSet, pierHeights: [...(pSet.pierHeights || DEFAULT_PARAMS.pierHeights)] };

  // Sync all DOM inputs
  Object.keys(params).forEach(k => {
    const el = document.getElementById('inp_' + k);
    if (el) el.value = params[k];
  });

  renderPierHeightInputs();
  updateSidebarUI();
  zoomToFit();
  showToast(`已套用預設尺寸組態：${document.getElementById('presetSelect').selectedOptions[0].text}`);
}

function toggleFormulaDrawer() {
  const drawer = document.getElementById('formulaDrawer');
  const btn = document.getElementById('btnToggleDrawer');
  drawerOpen = !drawerOpen;
  if (drawerOpen) {
    drawer.style.height = '155px';
    btn.textContent = '▼ 收合明細';
  } else {
    drawer.style.height = '32px';
    btn.textContent = '▲ 展開算式明細';
  }
  setTimeout(resizeCanvas, 210);
}

function showToast(msg) {
  const box = document.getElementById('toastBox');
  box.textContent = msg;
  box.classList.add('show');
  setTimeout(() => box.classList.remove('show'), 2800);
}

// ============================================================================
// 9. One-Click Direct DXF & CSV Exporters (Golden Rule 8: No Modals, Valid DXF)
// ============================================================================
function exportDXF() {
  rebuildScene();
  const dxfLines = [];
  const push = (code, val) => {
    dxfLines.push(String(code));
    dxfLines.push(String(val));
  };

  // Minimal valid AutoCAD R12/LT2 DXF Header & Tables with Chinese font support
  push(0, 'SECTION');
  push(2, 'HEADER');
  push(9, '$ACADVER');
  push(1, 'AC1009');
  push(0, 'ENDSEC');

  push(0, 'SECTION');
  push(2, 'TABLES');
  push(0, 'TABLE');
  push(2, 'STYLE');
  push(70, 1);
  push(0, 'STYLE');
  push(2, 'STANDARD');
  push(70, 0);
  push(40, 0.0);
  push(41, 1.0);
  push(50, 0.0);
  push(71, 0);
  push(42, 100.0);
  push(3, 'kaiu.ttf');
  push(4, '');
  push(0, 'ENDTAB');
  push(0, 'ENDSEC');

  push(0, 'SECTION');
  push(2, 'ENTITIES');

  const layerColorACI = {
    STRUCT: 7,
    STRUCT_SUB: 8,
    STONE: 2,
    REBAR: 1,
    STIRRUP: 3,
    DIM: 4,
    TEXT: 7,
    CENTER: 6,
    TABLE: 7,
    REF: 6
  };

  const emitLine = (x1, y1, x2, y2, layer) => {
    push(0, 'LINE');
    push(8, layer);
    push(62, layerColorACI[layer] || 7);
    push(10, x1.toFixed(2));
    push(20, y1.toFixed(2));
    push(30, '0.0');
    push(11, x2.toFixed(2));
    push(21, y2.toFixed(2));
    push(31, '0.0');
  };

  scenePrimitives.forEach(prim => {
    const lyr = prim.layer || 'STRUCT';
    if (prim.type === 'LINE') {
      emitLine(prim.x1, prim.y1, prim.x2, prim.y2, lyr);
    } else if (prim.type === 'POLY') {
      for (let i = 0; i < prim.pts.length - 1; i++) {
        emitLine(prim.pts[i][0], prim.pts[i][1], prim.pts[i + 1][0], prim.pts[i + 1][1], lyr);
      }
      if (prim.closed && prim.pts.length > 2) {
        const last = prim.pts[prim.pts.length - 1];
        emitLine(last[0], last[1], prim.pts[0][0], prim.pts[0][1], lyr);
      }
    } else if (prim.type === 'CIRCLE') {
      push(0, 'CIRCLE');
      push(8, lyr);
      push(62, layerColorACI[lyr] || 1);
      push(10, prim.cx.toFixed(2));
      push(20, prim.cy.toFixed(2));
      push(30, '0.0');
      push(40, prim.r.toFixed(2));
    } else if (prim.type === 'TEXT') {
      push(0, 'TEXT');
      push(8, lyr);
      push(62, layerColorACI[lyr] || 7);
      push(10, prim.x.toFixed(2));
      push(20, prim.y.toFixed(2));
      push(30, '0.0');
      push(40, (prim.size * 0.72).toFixed(2));
      push(1, prim.text);
      push(50, (prim.angleDeg || 0).toFixed(1));
      push(7, 'STANDARD');
    }
  });

  push(0, 'ENDSEC');
  push(0, 'EOF');

  const dxfContent = dxfLines.join('\r\n');
  const blob = new Blob([dxfContent], { type: 'application/dxf;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `梳子壩標準圖_0K+339.3_${currentViewMode}_${params.N_pier}墩.dxf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast('✅ 已直接匯出 AutoCAD 標準圖檔 (.DXF)');
}

function exportCSV() {
  const d = computeDerivedAndQuantities(params);
  const rows = [
    ['匹亞桑溪下游整治工程 — 梳子壩 (0K+339.3) 參數化工程數量計算表 (每座)'],
    ['匯出視圖模式', currentViewMode, '壩頂總長(m)', (d.L_total / 100).toFixed(2), '結構總高(m)', (d.H_total / 100).toFixed(2)],
    [],
    ['項次', '工項名稱', '單位', '計算數量', '圖面明文計算式'],
    ['1', '280kgf/cm2 混凝土', 'm3', d.V_conc.toFixed(2), `${d.f_conc_str1} ${d.f_conc_str2}`],
    ['2', '軀體模板', 'm2', d.A_form.toFixed(2), `${d.f_form_str1} ${d.f_form_str2}`],
    ['3', '鋼筋 (含損耗 5%)', 'kg', d.W_rebar.toFixed(2), `${d.f_rebar_str1} ${d.f_rebar_str2}`],
    ['4', '漿塊石 (現採)', 'm3', d.V_stone.toFixed(2), d.f_stone_str],
    [],
    ['主要幾何參數明細', '數值', '單位', '推算部位名稱', '數值', '單位'],
    ['梳齒墩數量 (N_pier)', d.N_pier, '墩', '梳子開口槽數 (N_slot)', d.N_slot, '槽'],
    ['梳齒墩單座寬 (W_pier)', params.W_pier, 'cm', '梳子開口淨寬 (W_slot)', params.W_slot, 'cm'],
    ['中央梳子區總寬 (W_slit)', d.W_slit, 'cm', '溢流口底部總寬 (W_weir)', d.W_weir, 'cm'],
    ['壩頂總長度 (L_total)', d.L_total, 'cm', '壩底基礎總長 (L_base)', d.L_base, 'cm'],
    ['上段壩高/內墩高 (H_upper)', params.H_upper, 'cm', '下段壩高/外墩高 (H_lower)', params.H_lower, 'cm'],
    ['基礎底版厚度 (T_base)', params.T_base, 'cm', '止滑齒牆深度 (D_key)', params.D_key, 'cm'],
    ['中段折點寬度 (B_mid)', params.B_mid, 'cm', '壩底基礎總寬 (B_base)', Math.round(d.B_base), 'cm'],
    ['下游消能護坦長 (L_apron_dn)', params.L_apron_dn, 'cm', '下游護坦面積 (A_apron)', d.A_apron_dn.toFixed(2), 'm2']
  ];

  const csvContent = '\uFEFF' + rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `梳子壩工程數量計算書_0K+339.3_${d.L_total / 100}mx${d.H_total / 100}m.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast('📊 已直接匯出工程數量計算表 (.CSV)');
}

// Initialize on load
window.onload = function () {
  renderPierHeightInputs();
  updateSidebarUI();
  resizeCanvas();
  zoomToFit();
};

  ;return { draw(P) { params = P; currentViewMode = 'ALL'; showRefOverlay = false; rebuildScene(); return scenePrimitives; }, comp: P => computeDerivedAndQuantities(P), LC: LAYER_COLORS };
  })();
  /* ---- 本系統介面：參數、圖元轉換、視圖（m）、數量表 ---- */
  let RR = null;
  const g = k => { const v = RR && RR[k] !== undefined && RR[k] !== null && RR[k] !== '' ? RR[k] : DEF[k]; return v; }, n = k => { const v = parseFloat(g(k)); return Number.isFinite(v) ? v : parseFloat(DEF[k]); };
  function getParams() {
    const P = {}; PR.forEach(q => { if (!q.opt) P[q.k.slice(2)] = n(q.k); });
    P.N_pier = Math.max(1, Math.round(P.N_pier));
    const ph = RR && Array.isArray(RR.__ph) ? RR.__ph.map(Number).filter(v => v > 0) : [];
    P.pierHeights = Array.from({ length: P.N_pier }, (_, i) => ph[i] !== undefined ? ph[i] : (i === 0 || i === P.N_pier - 1 ? P.H_lower : P.H_upper));
    if (P.N_pier === 1 && ph[0] === undefined) P.pierHeights = [P.H_lower];
    return P;
  }
  function toO(prims, LC) {
    const O = [], col = l => LC[l] || '#ffffff', dsh = b => (b ? [14, 9] : []);
    prims.forEach(o => {
      if (o.type === 'LINE') O.push({ k: 'L', p: [[o.x1, o.y1], [o.x2, o.y2]], c: col(o.layer), w: o.lineWidth || 1.4, d: dsh(o.dashed), ly: o.layer });
      else if (o.type === 'POLY') O.push({ k: 'P', p: o.pts.map(q => [q[0], q[1]]), c: col(o.layer), w: o.lineWidth || 1.4, f: o.fill || null, cl: !!o.closed, d: dsh(o.dashed), ly: o.layer });
      else if (o.type === 'CIRCLE') O.push({ k: 'C', x: o.cx, y: o.cy, r: o.r, c: col(o.layer), f: o.filled ? col(o.layer) : null, w: 1, ly: o.layer });
      else if (o.type === 'TEXT') O.push({ k: 'T', x: o.x, y: o.y, s: String(o.text), h: o.size, c: col(o.layer), al: o.align || 'center', bl: 'middle', rot: (o.angleDeg || 0) * Math.PI / 180, ly: '文字' });
    });
    return O;
  }
  function hostViews(P, d) {
    const q = d.__q, Hd = P.H_lower + P.H_upper, r = P.H_wing_rise, B = d.B_base, xC = q.xWeirL + d.W_weir / 2, L = d.L_total;
    const X = x => (x - xC) / 100, Zf = z => (z - P.H_lower) / 100, U = s => (s - B / 2) / 100;
    const out = { plan: [], sect: [], elev: [] }, W = '#ffffff', Gy = '#94a3b8', St = '#fbbf24';
    const poly = (A, p, c, f, dd, cl) => A.push({ p, cl: cl !== false, c: c || W, f: f === undefined ? 'rgba(255,255,255,0.05)' : f, d: !!dd });
    const xBL = P.W_cut_L, xBR = L - P.W_cut_R, xWgL = P.W_wing_L, xWgR = L - P.W_wing_R;
    // 正視（x, z）
    const E = (x, z) => [X(x), Zf(z)];
    poly(out.elev, [E(xBL, 0), E(xBR, 0), E(xBR, -P.T_base - P.D_key), E(xBL, -P.T_base - P.D_key)]);
    if (P.D_key > 0) out.elev.push({ p: [E(xBL, -P.T_base), E(xBR, -P.T_base)], cl: false, c: Gy, f: null, d: true });
    poly(out.elev, [E(xBL, 0), E(0, Hd), E(0, Hd + r), E(xWgL, Hd), E(q.xWeirL, P.H_lower), E(q.xSlitL, P.H_lower), E(q.xSlitL, 0)]);
    poly(out.elev, [E(q.xSlitR, 0), E(q.xSlitR, P.H_lower), E(q.xWeirR, P.H_lower), E(xWgR, Hd), E(L, Hd + r), E(L, Hd), E(xBR, 0)]);
    let cx = q.xSlitL; d.pierHeights.forEach(h => { cx += P.W_slot; poly(out.elev, [E(cx, 0), E(cx + P.W_pier, 0), E(cx + P.W_pier, h), E(cx, h)]); cx += P.W_pier; });
    // 順水流斷面（u, z）：s＝距上游底緣
    const S = (s, z) => [U(s), Zf(z)], sU = z => z * P.S_up;
    const kt = d.B_key_top, kbU = (kt - P.B_key_bot) / 2;
    poly(out.sect, [S(0, 0), S(B, 0), S(B, -P.T_base), S(kt, -P.T_base)].concat(P.D_key > 0 ? [S(kbU + P.B_key_bot, -P.T_base - P.D_key), S(kbU, -P.T_base - P.D_key)] : [S(0, -P.T_base)]).concat([S(0, -P.T_base)]));
    poly(out.sect, [S(0, 0), S(B, 0), S(B - P.H_lower * P.S_dn, P.H_lower), S(sU(P.H_lower), P.H_lower)]);
    out.sect.push({ p: [S(sU(P.H_lower), P.H_lower), S(sU(Hd), Hd), S(sU(Hd + r), Hd + r), S(sU(Hd + r) + P.B_wing_top, Hd + r), S(sU(Hd) + P.B_weir_top, Hd), S(B - P.H_lower * P.S_dn, P.H_lower)], cl: false, c: Gy, f: null, d: true });
    const s0 = B, s1 = B + P.B_stone_top;
    if (P.D_stone_up > 0 && P.B_stone_top > 0) poly(out.sect, [S(s0, 0), S(s1, 0), S(s0 + P.B_stone_bot, -P.D_stone_up), S(s0, -P.D_stone_up)], St, 'rgba(251,191,36,0.08)');
    if (P.L_apron_dn > 0 && P.T_apron_dn > 0) { const dz = P.L_apron_dn * P.S_apron / 100; poly(out.sect, [S(s1, 0), S(s1 + P.L_apron_dn, -dz), S(s1 + P.L_apron_dn, -dz - P.T_apron_dn), S(s1, -P.T_apron_dn)], St, 'rgba(251,191,36,0.08)'); }
    // 平面（u, x）
    const Pn = (s, x) => [U(s), X(x)], sCr = sU(Hd + r);
    poly(out.plan, [Pn(sCr, 0), Pn(0, xBL), Pn(0, xBR), Pn(sCr, L), Pn(sCr + P.B_wing_top, L), Pn(B, xBR), Pn(B, xBL), Pn(sCr + P.B_wing_top, 0)]);
    [[sU(P.H_lower), q.xWeirL, q.xSlitL], [B - P.H_lower * P.S_dn, q.xWeirL, q.xSlitL], [sU(P.H_lower), q.xSlitR, q.xWeirR], [B - P.H_lower * P.S_dn, q.xSlitR, q.xWeirR], [sU(Hd), 0, q.xWeirL], [sU(Hd), q.xWeirR, L]].forEach(([s, a, b]) => out.plan.push({ p: [Pn(s, a), Pn(s, b)], cl: false, c: Gy, f: null, d: false }));
    cx = q.xSlitL; d.pierHeights.forEach(h => { cx += P.W_slot; const bt = d.getPierTopWidthCm(h), su = sU(h); poly(out.plan, [Pn(su, cx), Pn(su, cx + P.W_pier), Pn(su + bt, cx + P.W_pier), Pn(su + bt, cx)], W, 'rgba(255,255,255,0.12)'); cx += P.W_pier; });
    if (P.B_stone_top > 0) poly(out.plan, [Pn(s0, xBL), Pn(s0, xBR), Pn(s1, xBR), Pn(s1, xBL)], St, 'rgba(251,191,36,0.06)');
    if (P.L_apron_dn > 0) out.plan.push({ p: Array.from({ length: 41 }, (_, i) => { const t = i / 40 * Math.PI; return Pn(s1 + Math.sin(t) * P.L_apron_dn, xC - Math.cos(t) * d.W_weir / 2); }), cl: true, c: St, f: 'rgba(251,191,36,0.05)', d: false });
    return out;
  }
  function computeQuantities(P, d) {
    const rows = [], f = (v, k) => (+v).toFixed(k === undefined ? 2 : k);
    const r = (no, name, unit, qty, formula, note) => rows.push({ no: String(no), name, unit, qty: +(+qty).toFixed(2), formula, note: note || '' });
    r(1, '280kgf/cm²混凝土', 'm³', d.V_conc, d.f_conc_str1 + d.f_conc_str2, '依圖面幾何（擬柱體公式）');
    r(2, '軀體模板', 'm²', d.A_form, d.f_form_str1 + d.f_form_str2, '兩岸端面、壩頂、止滑齒牆底不組模');
    r(3, '鋼筋（含損耗，估算）', 'kg', d.W_rebar, d.f_rebar_str2, '原圖無鋼筋表，以 kg/m³ 估算');
    r(4, '漿砌塊石', 'm³', d.V_stone, d.f_stone_str, '前庭漿砌石槽＋半橢圓護坦');
    return rows;
  }
  return {
    DEF, PR, GT, title: '梳子壩標準圖',
    getParams: R => { RR = R || {}; try { return getParams(); } finally { RR = null; } },
    run(R, opt) {
      RR = R || {};
      try {
        const P = getParams(), d = __H.comp(Object.assign({}, P, { pierHeights: P.pierHeights.slice() })), rows = computeQuantities(P, d);
        Object.assign(P, { L_total: d.L_total, L_base: d.L_base, B_base: d.B_base, W_weir: d.W_weir, W_slit: d.W_slit, xC: d.__q.xWeirL + d.W_weir / 2, __d: d });
        let O = [], L = null;
        if (opt && opt.draw) { O = toO(__H.draw(Object.assign({}, P, { pierHeights: P.pierHeights.slice() })), __H.LC); L = { V: hostViews(P, d) }; }
        const bt = Math.min(...P.pierHeights.map(h => d.B_base - h * (P.S_up + P.S_dn)));
        const checks = [
          { ok: bt >= 80, text: `梳齒墩頂寬最小 ${f0(bt)} cm（≥80 cm；不足時以 80 cm 計）` },
          { ok: P.B_weir_top <= P.B_mid && P.B_wing_top <= P.B_weir_top + 1e-6, text: `壩頂寬：中段 ${P.B_mid} ≥ 溢流段頂 ${P.B_weir_top} ≥ 翼牆頂 ${P.B_wing_top} cm` },
          { ok: d.L_base > 0 && P.W_cut_L + P.W_cut_R < d.L_total, text: `壩長 ${f0(d.L_total)} cm、底版長 ${f0(d.L_base)} cm、溢流寬 ${f0(d.W_weir)} cm（開口 ${P.N_pier + 1} 孔）` }];
        return { P, rows, checks, O, L };
      } finally { RR = null; }
    }
  };
  function f0(v) { return (+v).toFixed(0); }

})();

TCO_S['gsp'] = (function () {   // v8.0 固床工＋80φ基樁（原工具沙盒；gen_st3.py 自動產生）
  const GT = ["1. 正視橫向尺寸（左右分開，以溢流口中心為界）", "2. 高度", "3. 側視斷面（寬度與坡度）", "4. 基樁與樁位", "5. 基樁配筋（依配筋逐支計算）", "6. 固床工鋼筋（原圖無鋼筋表，kg/m³ 估算）"];
  const PR = [{"k": "p_W_wing_L", "nm": "左翼牆頂水平段 (cm)", "def": "2200", "st": "10", "min": "0", "max": "20000", "g": 0}, {"k": "p_W_slope_L", "nm": "左斜坡翼牆水平 (cm)", "def": "500", "st": "10", "min": "0", "max": "5000", "g": 0}, {"k": "p_W_weir", "nm": "中央溢流口總寬 (cm)", "def": "7000", "st": "10", "min": "100", "max": "50000", "g": 0}, {"k": "p_W_slope_R", "nm": "右斜坡翼牆水平 (cm)", "def": "500", "st": "10", "min": "0", "max": "5000", "g": 0}, {"k": "p_W_wing_R", "nm": "右翼牆頂水平段 (cm)", "def": "1300", "st": "10", "min": "0", "max": "20000", "g": 0}, {"k": "p_L_ret_L", "nm": "左岸基礎斜退長 (cm)", "def": "1000", "st": "10", "min": "0", "max": "10000", "g": 0}, {"k": "p_L_ret_R", "nm": "右岸基礎斜退長 (cm)", "def": "800", "st": "10", "min": "0", "max": "10000", "g": 0}, {"k": "p_H_wing_drop", "nm": "翼牆頂高差 (cm)", "def": "150", "st": "10", "min": "0", "max": "1000", "g": 1}, {"k": "p_H_upper", "nm": "上段翼牆高 (cm)", "def": "500", "st": "10", "min": "0", "max": "2000", "g": 1}, {"k": "p_H_mid", "nm": "中段（護坦頂至溢流口）(cm)", "def": "180", "st": "10", "min": "10", "max": "1000", "g": 1}, {"k": "p_H_notch", "nm": "中央低水深槽差 (cm)", "def": "50", "st": "5", "min": "0", "max": "300", "g": 1}, {"k": "p_H_lower", "nm": "下段基礎版厚 (cm)", "def": "250", "st": "10", "min": "30", "max": "1000", "g": 1}, {"k": "p_H_key", "nm": "止滑齒深 (cm)", "def": "200", "st": "10", "min": "0", "max": "1000", "g": 1}, {"k": "p_B_top", "nm": "翼牆最高頂寬 (cm)", "def": "95", "st": "5", "min": "30", "max": "500", "g": 2}, {"k": "p_m_up", "nm": "下游面上段坡 1:m", "def": "0.1", "st": "0.05", "min": "0", "max": "2", "g": 2}, {"k": "p_m_mid", "nm": "下游面中段坡 1:m", "def": "0.3", "st": "0.05", "min": "0", "max": "2", "g": 2}, {"k": "p_B_apron", "nm": "基礎頂面寬 (cm)", "def": "304", "st": "2", "min": "50", "max": "2000", "g": 2}, {"k": "p_B_base", "nm": "固床工總底寬 (cm)", "def": "544", "st": "2", "min": "100", "max": "3000", "g": 2}, {"k": "p_B_key", "nm": "止滑齒底寬 (cm)", "def": "80", "st": "5", "min": "20", "max": "500", "g": 2}, {"k": "p_m_key", "nm": "止滑齒坡 1:m", "def": "0.3", "st": "0.05", "min": "0", "max": "2", "g": 2}, {"k": "p_D_pile", "nm": "基樁直徑 (cm)", "def": "80", "st": "5", "min": "30", "max": "300", "g": 3}, {"k": "p_L_pile", "nm": "基樁總長 (cm)", "def": "1200", "st": "50", "min": "200", "max": "6000", "g": 3}, {"k": "p_L_embed", "nm": "錨入固床工長 (cm)", "def": "100", "st": "10", "min": "0", "max": "500", "g": 3}, {"k": "p_Dy_pile", "nm": "前後排距 (cm)", "def": "180", "st": "10", "min": "0", "max": "1000", "g": 3}, {"k": "p_Dy_edge", "nm": "上游排距上游緣 (cm)", "def": "170", "st": "10", "min": "30", "max": "1000", "g": 3}, {"k": "p_pmode", "nm": "樁位", "def": "LIST", "opt": [["LIST", "依樁位清單（預設＝原圖 22 支）"], ["AUTO", "依樁距自動排樁"]], "g": 3}, {"k": "p_S_dense", "nm": "密排區每排樁距 (cm)", "def": "500", "st": "10", "min": "100", "max": "5000", "g": 3}, {"k": "p_S_sparse", "nm": "一般區每排樁距 (cm)", "def": "1000", "st": "10", "min": "100", "max": "10000", "g": 3}, {"k": "p_xd0", "nm": "自動：密排區左端（距中心，cm）", "def": "-750", "st": "10", "min": "-50000", "max": "50000", "g": 3}, {"k": "p_xd1", "nm": "自動：密排區右端（距中心，cm）", "def": "1750", "st": "10", "min": "-50000", "max": "50000", "g": 3}, {"k": "p_xs0", "nm": "自動：排樁左界（距中心，cm）", "def": "-3750", "st": "10", "min": "-50000", "max": "50000", "g": 3}, {"k": "p_xs1", "nm": "自動：排樁右界（距中心，cm）", "def": "4750", "st": "10", "min": "-50000", "max": "50000", "g": 3}, {"k": "p_N_main", "nm": "主筋支數（32φ）", "def": "14", "st": "1", "min": "4", "max": "60", "g": 4}, {"k": "p_c_main", "nm": "主筋長扣除 (cm)", "def": "20", "st": "1", "min": "0", "max": "200", "g": 4}, {"k": "p_w32", "nm": "32φ 單位重 (kg/m)", "def": "6.39", "st": "0.01", "min": "1", "max": "20", "g": 4}, {"k": "p_w16", "nm": "16φ 單位重 (kg/m)", "def": "1.56", "st": "0.01", "min": "0.5", "max": "5", "g": 4}, {"k": "p_s_h2", "nm": "② 箍筋間距 (cm)", "def": "15", "st": "1", "min": "5", "max": "100", "g": 4}, {"k": "p_d_h2", "nm": "② 箍筋直徑扣除 (cm)", "def": "17.6", "st": "0.1", "min": "0", "max": "60", "g": 4}, {"k": "p_lap2", "nm": "② 箍筋搭接 (cm)", "def": "77", "st": "1", "min": "0", "max": "200", "g": 4}, {"k": "p_s_h3", "nm": "③ 加勁筋間距 (cm)", "def": "100", "st": "5", "min": "20", "max": "500", "g": 4}, {"k": "p_d_h3", "nm": "③ 加勁筋直徑扣除 (cm)", "def": "30.4", "st": "0.1", "min": "0", "max": "80", "g": 4}, {"k": "p_lap3", "nm": "③ 加勁筋搭接 (cm)", "def": "30", "st": "1", "min": "0", "max": "200", "g": 4}, {"k": "p_k16", "nm": "16φ 損耗係數", "def": "1.08", "st": "0.01", "min": "1", "max": "1.5", "g": 4}, {"k": "p_k32", "nm": "32φ 損耗係數", "def": "1.1", "st": "0.01", "min": "1", "max": "1.5", "g": 4}, {"k": "p_rbk", "nm": "固床工鋼筋估算量 (kg/m³，含損耗)", "def": "2.98", "st": "0.01", "min": "0", "max": "300", "g": 5}];
  const DEF = {}; PR.forEach(q => { DEF[q.k] = q.def; });

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
  const __H = (function () {

let currentMode = 'ALL';
let cam = { x: 0, y: 0, scale: 0.08 };
let isDragging = false;
let dragStart = { x: 0, y: 0 };
let cadEntities = [];

const DEFAULTS = {
  W_wing_L: 2200, W_slope_L: 500, W_weir: 7000, W_slope_R: 500, W_wing_R: 1300,
  L_ret_L: 1000, L_ret_R: 800,
  H_wing_drop: 150, H_upper: 500, H_mid: 180, H_notch: 50, H_lower: 250, H_key: 200,
  B_top: 95, B_weir: 110, B_mid: 160, B_apron: 304, B_base: 544, B_key: 80,
  D_pile: 80, L_pile: 1200, L_embed: 100, N_pile: 22,
  S_dense: 500, S_sparse: 1000, Dy_pile: 180, Dy_edge: 170, N_main: 14
};

/* ---- v8.0 固床工＋基樁：幾何模型（cm）。斷面 x＝自下游趾（止滑齒側）往上游，z＝自止滑齒底往上 ---- */
let __P = {};
function getParams() {
  const p = Object.assign({}, __P);
  p.L_total = p.W_wing_L + p.W_slope_L + p.W_weir + p.W_slope_R + p.W_wing_R;
  p.L_base = p.L_total - p.L_ret_L - p.L_ret_R;
  p.H_total = p.H_wing_drop + p.H_upper + p.H_mid + p.H_notch + p.H_lower + p.H_key;
  p.B_weir = p.B_top + p.H_wing_drop * p.m_up;                    // y5 處寬（由頂寬與下游坡推得）
  p.B_mid = p.B_top + (p.H_wing_drop + p.H_upper) * p.m_up;       // y4 處寬
  p.N_pile = getPilePositions(p).length;
  return p;
}
function __gsY(p) { const y0 = 0, y1 = y0 + p.H_key, y2 = y1 + p.H_lower, y3 = y2 + p.H_mid, y4 = y3 + p.H_notch, y5 = y4 + p.H_upper, y6 = y5 + p.H_wing_drop; return { y0, y1, y2, y3, y4, y5, y6 }; }
function __gsSec(p) {   // 最大斷面（翼牆處）頂點，逆時針
  const { y0, y1, y2, y3, y4, y5, y6 } = __gsY(p), xBack = p.B_base, xApronL = p.B_base - p.B_apron, xMidL = xApronL + (p.H_mid + p.H_notch) * p.m_mid,
    xWeirL = xMidL + p.H_upper * p.m_up, xTopL = xWeirL + p.H_wing_drop * p.m_up, xTopR = xTopL + p.B_top, xKeyBotR = p.B_key, xKeyTopR = p.B_key + p.H_key * p.m_key;
  const poly = [[0, y0], [xKeyBotR, y0], [xKeyTopR, y1], [xBack, y1], [xBack, y2], [xTopR, y3], [xTopR, y6], [xTopL, y6], [xWeirL, y5], [xMidL, y4], [xApronL, y2], [0, y1]];
  const formed = [[[0, y1], [xApronL, y2]], [[xApronL, y2], [xMidL, y4]], [[xMidL, y4], [xWeirL, y5]], [[xWeirL, y5], [xTopL, y6]], [[xTopR, y6], [xTopR, y3]], [[xTopR, y3], [xBack, y2]], [[xBack, y2], [xBack, y1]]];
  return { poly, formed, xBack, xApronL, xMidL, xWeirL, xTopL, xTopR, xKeyBotR, xKeyTopR };
}
function __gsClip(poly, zb, zt) {   // 斷面多邊形取 zb ≤ z ≤ zt
  const cut = (P, z, keepAbove) => { const o = []; for (let i = 0; i < P.length; i++) { const a = P[i], b = P[(i + 1) % P.length], ia = keepAbove ? a[1] >= z : a[1] <= z, ib = keepAbove ? b[1] >= z : b[1] <= z; if (ia) o.push(a); if (ia !== ib) { const t = (z - a[1]) / (b[1] - a[1]); o.push([a[0] + t * (b[0] - a[0]), z]); } } return o; };
  return cut(cut(poly, zb, true), zt, false);
}
function __gsArea(P) { let s = 0; for (let i = 0; i < P.length; i++) { const a = P[i], b = P[(i + 1) % P.length]; s += a[0] * b[1] - b[0] * a[1]; } return Math.abs(s) / 2; }
function __gsTop(p, X) {   // 正視頂緣 z(X)
  const { y3, y4, y5, y6 } = __gsY(p), x1 = p.W_wing_L, x2 = x1 + p.W_slope_L, x3 = x2 + p.W_weir, x4 = x3 + p.W_slope_R, L = p.L_total, xC = (x2 + x3) / 2, li = (xa, za, xb, zb) => za + (zb - za) * (X - xa) / ((xb - xa) || 1);
  if (X <= x1) return li(0, y6, x1, y5); if (X <= x2) return li(x1, y5, x2, y4); if (X <= xC) return li(x2, y4, xC, y3); if (X <= x3) return li(xC, y3, x3, y4); if (X <= x4) return li(x3, y4, x4, y5); return li(x4, y5, L, y6);
}
function __gsBot(p, X) {   // 正視底緣（兩端基礎斜退）
  const { y0, y5 } = __gsY(p), L = p.L_total;
  if (X < p.L_ret_L) return y5 + (y0 - y5) * X / p.L_ret_L; if (X > L - p.L_ret_R) return y5 + (y0 - y5) * (L - X) / p.L_ret_R; return y0;
}
function __gsBreaks(p) { const x1 = p.W_wing_L, x2 = x1 + p.W_slope_L, x3 = x2 + p.W_weir, x4 = x3 + p.W_slope_R, L = p.L_total; return [0, p.L_ret_L, x1, x2, (x2 + x3) / 2, x3, x4, L - p.L_ret_R, L].filter(v => v >= 0 && v <= L).sort((a, b) => a - b); }
function __gsInt(p, fn) {   // ∫ fn(X) dX，各段 Simpson（每段 60 格）
  const B = __gsBreaks(p); let s = 0;
  for (let i = 0; i + 1 < B.length; i++) { const a = B[i], b = B[i + 1]; if (b - a < 1e-9) continue; const n = 60, h = (b - a) / n; let t = fn(a + 1e-7) + fn(b - 1e-7); for (let k = 1; k < n; k++) t += (k % 2 ? 4 : 2) * fn(a + k * h); s += t * h / 3; }
  return s;
}
function __gsPlan(p) {   // 平面外框（x 正視位置, y 斷面位置）
  const S = __gsSec(p), B = __gsBreaks(p), xs = []; for (let i = 0; i + 1 < B.length; i++) for (let k = 0; k < 12; k++) xs.push(B[i] + (B[i + 1] - B[i]) * k / 12); xs.push(p.L_total);
  const lo = [], hi = []; xs.forEach(X => { const c = __gsClip(S.poly, __gsBot(p, X), __gsTop(p, X)); if (c.length < 3) return; let a = Infinity, b = -Infinity; c.forEach(q => { a = Math.min(a, q[0]); b = Math.max(b, q[0]); }); lo.push([X, a]); hi.push([X, b]); });
  return lo.concat(hi.reverse());
}
function __gsCrest(p) {   // 頂面下游緣（y 隨 X）
  const S = __gsSec(p), B = __gsBreaks(p), out = []; for (let i = 0; i + 1 < B.length; i++) for (let k = 0; k <= 12; k++) { const X = B[i] + (B[i + 1] - B[i]) * k / 12, c = __gsClip(S.poly, __gsBot(p, X), __gsTop(p, X)); if (c.length > 2) out.push([X, Math.min(...c.filter(q => Math.abs(q[1] - __gsTop(p, X)) < 1e-6).map(q => q[0]))]); }
  return out.filter(q => Number.isFinite(q[1]));
}
function getPilePositions(p) {   // 回傳 [{x, row}]，x＝正視位置（cm，自左端）
  const xCenter = p.W_wing_L + p.W_slope_L + p.W_weir / 2, out = [];
  if (p.pmode === 'AUTO') {
    const xs = [], hd = p.S_dense / 2, hs = p.S_sparse / 2;
    for (let x = p.xd0; x <= p.xd1 + 1e-6; x += hd) xs.push(x);
    for (let x = p.xd0 - hs; x >= p.xs0 - 1e-6; x -= hs) xs.unshift(x);
    for (let x = p.xd1 + hs; x <= p.xs1 + 1e-6; x += hs) xs.push(x);
    xs.forEach((x, i) => out.push({ x: xCenter + x, row: i % 2 }));
  } else {
    (p.rowU || []).forEach(x => out.push({ x: xCenter + x, row: 0 })); (p.rowD || []).forEach(x => out.push({ x: xCenter + x, row: 1 }));
    out.sort((a, b) => a.x - b.x);
  }
  return out;
}
function calcQuantities(p) {
  const S = __gsSec(p), m = v => v / 100;
  const Vg = __gsInt(p, X => __gsArea(__gsClip(S.poly, __gsBot(p, X), __gsTop(p, X))));
  const segLen = (a, b, zb, zt) => { const lo = Math.max(zb, Math.min(a[1], b[1])), hi = Math.min(zt, Math.max(a[1], b[1])), dz = Math.abs(b[1] - a[1]); if (dz < 1e-9) return 0; return hi > lo ? Math.hypot(b[0] - a[0], dz) * (hi - lo) / dz : 0; };
  const Fg = __gsInt(p, X => { const zb = Math.max(__gsBot(p, X), __gsY(p).y1), zt = __gsTop(p, X); return S.formed.reduce((s, [a, b]) => s + segLen(a, b, zb, zt), 0); });
  const piles = getPilePositions(p), nP = piles.length, Ap = Math.PI * Math.pow(p.D_pile / 2, 2);
  const Vemb = nP * Ap * p.L_embed;
  const sillConc = +((Vg - Vemb) / 1e6).toFixed(2), sillForm = +(Fg / 1e4).toFixed(2), sillRebar = +(sillConc * p.rbk).toFixed(2);
  // 基樁（每支，依配筋逐支計算）
  const mainLen = +((p.L_pile - p.c_main) / 100).toFixed(2);
  const w1 = +(p.N_main * mainLen * p.w32).toFixed(2);
  const nHoop2 = Math.round((p.L_pile - p.L_embed) / p.s_h2);
  const lenHoop2 = +(Math.PI * (p.D_pile - p.d_h2) / 100 + p.lap2 / 100).toFixed(2);
  const w2 = +(nHoop2 * lenHoop2 * p.w16).toFixed(2);
  const nHoop3 = Math.round((p.L_pile - p.L_embed) / p.s_h3);
  const lenHoop3 = +(Math.PI * (p.D_pile - p.d_h3) / 100 + p.lap3 / 100).toFixed(2);
  const w3 = +(nHoop3 * lenHoop3 * p.w16).toFixed(2);
  const sum16 = +(w2 + w3).toFixed(2), loss16 = +(sum16 * p.k16).toFixed(2), loss32 = +(w1 * p.k32).toFixed(2), pileRebarTotal = +(loss16 + loss32).toFixed(2);
  const pileConc = +(Ap / 1e4 * (p.L_pile / 100)).toFixed(2);
  return { sillConc, sillForm, sillRebar, Vg: Vg / 1e6, Vemb: Vemb / 1e6, nP, mainLen, w1, nHoop2, lenHoop2, w2, nHoop3, lenHoop3, w3, sum16, loss16, loss32, pileRebarTotal, pileConc, drill: m(p.L_pile - p.L_embed) };
}



function createRec() {
  const list = [];
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  function touch(x, y) {
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
  return {
    list,
    getBounds() {
      if (minX === Infinity) return { minX: 0, minY: 0, maxX: 100, maxY: 100, width: 100, height: 100 };
      return { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY };
    },
    line(x1, y1, x2, y2, col = '#ffffff', lw = 1.4, dash = null, lyr = 'STRUCT') {
      touch(x1, y1); touch(x2, y2);
      list.push({ type: 'line', x1, y1, x2, y2, col, lw, dash, lyr });
    },
    poly(pts, closed = true, col = '#ffffff', lw = 1.5, fill = null, dash = null, lyr = 'STRUCT') {
      pts.forEach(pt => touch(pt[0], pt[1]));
      list.push({ type: 'poly', pts, closed, col, lw, fill, dash, lyr });
    },
    circle(cx, cy, r, col = '#ffffff', lw = 1.4, fill = null, dash = null, lyr = 'STRUCT') {
      touch(cx - r, cy - r); touch(cx + r, cy + r);
      list.push({ type: 'circle', cx, cy, r, col, lw, fill, dash, lyr });
    },
    text(x, y, str, size = 36, col = '#ffffff', align = 'center', rot = 0, lyr = 'TEXT') {
      const estW = str.length * size * 0.65;
      touch(x - estW / 2, y - size); touch(x + estW / 2, y + size);
      list.push({ type: 'text', x, y, str: String(str), size, col, align, rot, lyr });
    },
    dimH(x1, y1, x2, y2, yDim, label, size = 34, col = '#38bdf8') {
      const dir = yDim >= Math.max(y1, y2) ? 1 : -1;
      const gap = 14 * (size / 34);
      const ext = 22 * (size / 34);
      this.line(x1, y1 + dir * gap, x1, yDim + dir * ext, col, 1.0, null, 'DIM');
      this.line(x2, y2 + dir * gap, x2, yDim + dir * ext, col, 1.0, null, 'DIM');
      this.line(x1, yDim, x2, yDim, col, 1.1, null, 'DIM');
      const ah = 20 * (size / 34);
      this.line(x1, yDim, x1 + ah, yDim + ah * 0.35, col, 1.1, null, 'DIM');
      this.line(x1, yDim, x1 + ah, yDim - ah * 0.35, col, 1.1, null, 'DIM');
      this.line(x2, yDim, x2 - ah, yDim + ah * 0.35, col, 1.1, null, 'DIM');
      this.line(x2, yDim, x2 - ah, yDim - ah * 0.35, col, 1.1, null, 'DIM');
      this.text((x1 + x2) / 2, yDim + size * 0.35, label, size, '#f8fafc', 'center', 0, 'DIM');
    },
    dimV(x1, y1, x2, y2, xDim, label, size = 34, col = '#38bdf8') {
      const dir = xDim >= Math.max(x1, x2) ? 1 : -1;
      const gap = 14 * (size / 34);
      const ext = 22 * (size / 34);
      this.line(x1 + dir * gap, y1, xDim + dir * ext, y1, col, 1.0, null, 'DIM');
      this.line(x2 + dir * gap, y2, xDim + dir * ext, y2, col, 1.0, null, 'DIM');
      this.line(xDim, y1, xDim, y2, col, 1.1, null, 'DIM');
      const ah = 20 * (size / 34);
      const sy = y2 >= y1 ? 1 : -1;
      this.line(xDim, y1, xDim - ah * 0.35, y1 + sy * ah, col, 1.1, null, 'DIM');
      this.line(xDim, y1, xDim + ah * 0.35, y1 + sy * ah, col, 1.1, null, 'DIM');
      this.line(xDim, y2, xDim - ah * 0.35, y2 - sy * ah, col, 1.1, null, 'DIM');
      this.line(xDim, y2, xDim + ah * 0.35, y2 - sy * ah, col, 1.1, null, 'DIM');
      this.text(xDim - size * 0.45 * dir, (y1 + y2) / 2, label, size, '#f8fafc', 'center', Math.PI / 2, 'DIM');
    },
    leader(pts, txt, size = 34, align = 'left', col = '#38bdf8') {
      for (let i = 0; i < pts.length - 1; i++) {
        this.line(pts[i][0], pts[i][1], pts[i+1][0], pts[i+1][1], col, 1.1, null, 'DIM');
      }
      const p0 = pts[0], p1 = pts[1];
      const ang = Math.atan2(p1[1] - p0[1], p1[0] - p0[0]);
      const ah = 22 * (size / 34);
      this.line(p0[0], p0[1], p0[0] + ah * Math.cos(ang + 0.32), p0[1] + ah * Math.sin(ang + 0.32), col, 1.1, null, 'DIM');
      this.line(p0[0], p0[1], p0[0] + ah * Math.cos(ang - 0.32), p0[1] + ah * Math.sin(ang - 0.32), col, 1.1, null, 'DIM');
      const last = pts[pts.length - 1];
      if (txt) {
        this.text(last[0] + (align === 'left' ? 12 : -12), last[1] - size * 0.25, txt, size, '#f8fafc', align, 0, 'TEXT');
      }
    }
  };
}

function buildSillPlan(p) {
  const r = createRec();
  const L = p.L_total;
  const B = p.B_base;
  const x1 = p.W_wing_L;
  const x2 = x1 + p.W_slope_L;
  const x3 = x2 + p.W_weir;
  const x4 = x3 + p.W_slope_R;
  const xC = (x2 + x3) / 2;

  // v8.0 平面外框依幾何（最大斷面依正視頂緣、底緣裁切後的上下游範圍）
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
  r.dimV(L, 0, L, B, L + 340, String(p.B_base), 68);

  // 22 Staggered 80cm piles
  const piles = getPilePositions(p);
  const yRowUp = B - p.Dy_edge;
  const yRowDn = yRowUp - p.Dy_pile;
  piles.forEach(pl => {
    const py = pl.row === 0 ? yRowUp : yRowDn;
    r.circle(pl.x, py, p.D_pile / 2, '#f59e0b', 1.8, 'rgba(245,158,11,0.45)', null, 'PILE');
  });

  // Pile spacing annotations in plan
  r.dimH(xC - 2600, yRowUp, xC - 1600, yRowUp, yRowUp + 75, String(p.S_sparse), 56);
  r.dimH(xC - 500, yRowUp, xC, yRowUp, yRowUp + 75, String(p.S_dense), 56);
  r.dimH(xC + 250, yRowDn, xC + 750, yRowDn, yRowDn + 75, String(p.S_dense), 56);
  r.dimH(xC + 1750, yRowDn, xC + 2750, yRowDn, yRowDn + 75, String(p.S_sparse), 56);

  // Top overall dimensions
  r.dimH(0, B, x1, B, B + 360, String(p.W_wing_L), 68);
  r.dimH(x1, B, x2, B, B + 360, String(p.W_slope_L), 68);
  r.dimH(x2, B, x3, B, B + 360, String(p.W_weir), 68);
  r.dimH(x3, B, x4, B, B + 360, String(p.W_slope_R), 68);
  r.dimH(x4, B, L, B, B + 360, String(p.W_wing_R), 68);
  r.dimH(0, B, L, B, B + 680, String(L), 74);

  // Centerline & Flow arrow
  r.line(xC, -180, xC, B + 280, '#f43f5e', 1.2, [35, 18], 'CENTER');
  r.text(xC, B + 310, '℄', 72, '#f43f5e');
  const fx = xC + 120, fy = B + 1250;
  r.poly([[fx-25, fy], [fx+25, fy], [fx+25, fy-220], [fx+55, fy-220], [fx, fy-330], [fx-55, fy-220], [fx-25, fy-220]], true, '#38bdf8', 1.8);
  r.text(fx - 95, fy - 160, '水流方向', 66, '#f8fafc', 'center', Math.PI / 2);

  // Leader for 22 piles
  r.leader([[xC + 2100, yRowUp], [xC + 3000, B + 920], [xC + 3250, B + 920]],
    `${p.D_pile}φcm基樁，交叉排列，H=${(p.L_pile/100).toFixed(1)}m，鑽孔深${((p.L_pile-p.L_embed)/100).toFixed(1)}m，共${p.N_pile}支`, 58, 'left');
  r.text(xC + 3265, B + 790, '基樁打設位置', 58, '#f8fafc', 'left');

  // Title
  r.text(xC, -320, '固床工平面圖', 95, '#ffffff');
  r.line(xC - 310, -355, xC + 310, -355, '#ffffff', 1.8);
  r.line(xC - 310, -372, xC + 310, -372, '#ffffff', 1.2);
  r.text(xC - 160, -455, 'S=1/400', 60, '#9ca3af');
  return r;
}

function buildSillElevation(p) {
  const r = createRec();
  const L = p.L_total;
  const x1 = p.W_wing_L;
  const x2 = x1 + p.W_slope_L;
  const x3 = x2 + p.W_weir;
  const x4 = x3 + p.W_slope_R;
  const xC = (x2 + x3) / 2;

  const y0 = 0; // Key bottom
  const y1 = y0 + p.H_key; // Base bottom (200)
  const y2 = y1 + p.H_lower; // Apron bottom (450)
  const y3 = y2 + p.H_mid; // Central notch bottom (630)
  const y4 = y3 + p.H_notch; // Weir crest ends (680)
  const y5 = y4 + p.H_upper; // Wing inner top (1180)
  const y6 = y5 + p.H_wing_drop; // Wing outer top (1330)

  // Outer structure elevation contour (clean structure without irregular rock lines)
  r.poly([
    [0, y6],
    [x1, y5],
    [x2, y4],
    [xC, y3],
    [x3, y4],
    [x4, y5],
    [L, y6],
    [L, y5],
    [L - p.L_ret_R, y0],
    [p.L_ret_L, y0],
    [0, y5]
  ], true, '#ffffff', 2.0);

  // Horizontal internal elevation lines
  const dxL1 = p.L_ret_L * ((y5 - y4) / (y5 - y0));
  const dxR1 = p.L_ret_R * ((y5 - y4) / (y5 - y0));
  r.line(dxL1, y4, x2, y4, '#e2e8f0', 1.3);
  r.line(x3, y4, L - dxR1, y4, '#e2e8f0', 1.3);

  const dxL2 = p.L_ret_L * ((y5 - y3) / (y5 - y0));
  const dxR2 = p.L_ret_R * ((y5 - y3) / (y5 - y0));
  r.line(dxL2, y3, L - dxR2, y3, '#e2e8f0', 1.3);

  const dxL3 = p.L_ret_L * ((y5 - y2) / (y5 - y0));
  const dxR3 = p.L_ret_R * ((y5 - y2) / (y5 - y0));
  r.line(dxL3, y2, L - dxR3, y2, '#e2e8f0', 1.3);

  const dxL4 = p.L_ret_L * ((y5 - y1) / (y5 - y0));
  const dxR4 = p.L_ret_R * ((y5 - y1) / (y5 - y0));
  r.line(dxL4, y1, L - dxR4, y1, '#e2e8f0', 1.3);

  // 22 Piles projecting below base
  const piles = getPilePositions(p);
  const pileVisH = 380;
  piles.forEach(pl => {
    const px = pl.x;
    const rP = p.D_pile / 2;
    r.poly([
      [px - rP, y1 + p.L_embed],
      [px + rP, y1 + p.L_embed],
      [px + rP, y0 - pileVisH],
      [px - rP, y0 - pileVisH]
    ], true, '#f59e0b', 1.4, 'rgba(245,158,11,0.12)', null, 'PILE');
  });

  // Top dimensions
  r.dimH(0, y6, x1, y5, y6 + 380, String(p.W_wing_L), 68);
  r.dimH(x1, y5, x2, y4, y6 + 380, String(p.W_slope_L), 68);
  r.dimH(x2, y4, x3, y4, y6 + 380, String(p.W_weir), 68);
  r.dimH(x3, y4, x4, y5, y6 + 380, String(p.W_slope_R), 68);
  r.dimH(x4, y5, L, y6, y6 + 380, String(p.W_wing_R), 68);
  r.dimH(0, y6, L, y6, y6 + 700, String(L), 74);

  // Bottom retreat dimensions (510|235|255 = 1000, 9700, 204|188|408 = 800)
  r.dimH(0, y0, p.L_ret_L, y0, -280, String(p.L_ret_L), 66);
  r.dimH(p.L_ret_L, y0, L - p.L_ret_R, y0, -280, String(p.L_base), 68);
  r.dimH(L - p.L_ret_R, y0, L, y0, -280, String(p.L_ret_R), 66);

  // Left & Right vertical height dimensions
  const xDimL = -260;
  r.dimV(0, y0, 0, y1, xDimL, String(p.H_key), 56);
  r.dimV(0, y1, 0, y2, xDimL, String(p.H_lower), 56);
  r.dimV(0, y2, 0, y3, xDimL, String(p.H_mid), 56);
  r.dimV(0, y3, 0, y4, xDimL, String(p.H_notch), 52);
  r.dimV(0, y4, 0, y5, xDimL, String(p.H_upper), 56);
  r.dimV(0, y5, 0, y6, xDimL, String(p.H_wing_drop), 56);
  r.dimV(0, y0, 0, y6, xDimL - 220, String(p.H_total), 64);

  const xDimR = L + 260;
  r.dimV(L, y0, L, y1, xDimR, String(p.H_key), 56);
  r.dimV(L, y1, L, y2, xDimR, String(p.H_lower), 56);
  r.dimV(L, y2, L, y3, xDimR, String(p.H_mid), 56);
  r.dimV(L, y3, L, y4, xDimR, String(p.H_notch), 52);
  r.dimV(L, y4, L, y5, xDimR, String(p.H_upper), 56);
  r.dimV(L, y5, L, y6, xDimR, String(p.H_wing_drop), 56);
  r.dimV(L, y0, L, y6, xDimR + 220, String(p.H_total), 64);

  // Internal height callouts (230, 50)
  r.dimV(x2, y2, x2, y4, x2 - 80, String(p.H_mid + p.H_notch), 56);
  r.dimV(x3, y2, x3, y4, x3 + 80, String(p.H_mid + p.H_notch), 56);
  r.dimV(xC, y3, xC, y4, xC + 110, String(p.H_notch), 56);

  // Slope & Formwork leaders
  r.text((x1 + x2) / 2 + 60, (y5 + y4) / 2 + 60, '1:1', 58, '#f8fafc', 'center', -Math.PI / 4);
  r.text((x3 + x4) / 2 - 60, (y5 + y4) / 2 + 60, '1:1', 58, '#f8fafc', 'center', Math.PI / 4);
  r.leader([[0, y5 + 75], [-520, y5 + 75]], '側邊不組模', 68, 'right');
  r.leader([[L, y5 + 75], [L + 520, y5 + 75]], '側邊不組模', 68, 'left');
  r.leader([[x2 + 1600, (y2 + y3) / 2], [x2 + 1250, y5 - 80], [x2 + 1000, y5 - 80]], '軀體模板', 62, 'right');
  r.leader([[x2 - 350, (y1 + y2) / 2], [x2 - 700, -450], [x2 - 950, -450]], '軀體模板', 62, 'right');
  r.leader([[L - p.L_ret_R - 600, y0 - 200], [L - p.L_ret_R - 150, y0 - 200]],
    `${p.D_pile}φcm基樁、H=${(p.L_pile/100).toFixed(0)}m，共計${p.N_pile}支`, 58, 'left');

  // Centerline
  r.line(xC, y0 - 420, xC, y6 + 220, '#f43f5e', 1.2, [35, 18], 'CENTER');
  r.text(xC, y5 - 120, '℄', 72, '#f43f5e');

  // Title
  r.text(xC, -680, '固床工正視圖', 95, '#ffffff');
  r.line(xC - 310, -715, xC + 310, -715, '#ffffff', 1.8);
  r.line(xC - 310, -732, xC + 310, -732, '#ffffff', 1.2);
  r.text(xC - 160, -815, 'S=1/400', 60, '#9ca3af');
  return r;
}

function buildSillSideAndRebar(p, q) {
  const r = createRec();
  // Drawn at 2x magnification relative to 1/400 views (since S=1/200)
  const sc = 2.2;
  const y0 = 0;
  const y1 = p.H_key * sc;
  const y2 = (p.H_key + p.H_lower) * sc;
  const y3 = (p.H_key + p.H_lower + p.H_mid) * sc;
  const y4 = (p.H_key + p.H_lower + p.H_mid + p.H_notch) * sc;
  const y5 = (p.H_key + p.H_lower + p.H_mid + p.H_notch + p.H_upper) * sc;
  const y6 = p.H_total * sc;

  const xBack = p.B_base * sc;
  const xKeyBotR = p.B_key * sc;
  const xKeyTopR = (p.B_key + p.H_key * p.m_key) * sc; // 140 * sc
  const xApronL = (p.B_base - p.B_apron) * sc; // 240 * sc
  const xMidL = xApronL + (p.H_mid + p.H_notch) * p.m_mid * sc;
  const xMidR = xMidL + p.B_mid * sc;
  const xWeirL = xMidL + p.H_upper * p.m_up * sc;
  const xWeirR = xWeirL + p.B_weir * sc;
  const xTopL = xWeirL + p.H_wing_drop * p.m_up * sc;
  const xTopR = xTopL + p.B_top * sc;

  // Outer profile of Side View
  r.poly([
    [xTopL, y6],
    [xTopR, y6],
    [xTopR, y3],
    [xBack, y2],
    [xBack, y1],
    [xKeyTopR, y1],
    [xKeyBotR, y0],
    [0, y0],
    [0, y1],
    [xApronL, y2],
    [xMidL, y4],
    [xWeirL, y5]
  ], true, '#ffffff', 2.0, 'rgba(56, 189, 248, 0.05)');

  // Internal break lines
  r.line(xWeirL, y5, xTopR, y5, '#e2e8f0', 1.3);
  r.line(xMidL, y4, xTopR, y4, '#e2e8f0', 1.3);
  r.line(xMidL - p.H_notch * p.m_mid * sc, y3, xTopR, y3, '#e2e8f0', 1.3);
  r.line(xApronL, y2, xBack, y2, '#e2e8f0', 1.3);
  r.line(0, y1, xKeyTopR, y1, '#94a3b8', 1.1, [16, 12]);

  // Two rows of 80cm piles in Side View
  const pX2 = (p.B_base - p.Dy_edge) * sc;
  const pX1 = pX2 - p.Dy_pile * sc;
  const pR = (p.D_pile / 2) * sc;
  const pTopY = y1 + p.L_embed * sc;
  const pBotY = y0 - 240 * sc;
  [pX1, pX2].forEach(px => {
    r.poly([
      [px - pR, pTopY], [px + pR, pTopY],
      [px + pR, pBotY], [px - pR, pBotY]
    ], true, '#f59e0b', 1.6, 'rgba(245,158,11,0.14)', null, 'PILE');
  });

  // Width & Height dimensions on Side View
  r.dimH(xTopL, y6, xTopR, y6, y6 + 90, String(p.B_top), 56);
  r.text((xWeirL + xTopR) / 2, y5 + 25, String(p.B_weir), 54);
  r.text((xMidL + xTopR) / 2, y4 + 25, String(p.B_mid), 54);
  r.text((xApronL + xBack) / 2, y2 + 25, String(p.B_apron), 54);
  r.text((xKeyTopR + xBack) / 2, y1 - 80, String(Math.round(p.B_base - p.B_key - p.H_key * p.m_key)), 52);
  r.dimH(0, y0, xKeyBotR, y0, y0 - 80, String(p.B_key), 52);
  r.dimH(0, y0, xBack, y1, y0 - 220, String(p.B_base), 58);

  const xDimR = xBack + 240;
  r.dimV(xBack, y0, xBack, y1, xDimR, String(p.H_key), 54);
  r.dimV(xBack, y1, xBack, y2, xDimR, String(p.H_lower), 54);
  r.dimV(xBack, y2, xBack, y3, xDimR, String(p.H_mid), 54);
  r.dimV(xBack, y3, xBack, y4, xDimR, String(p.H_notch), 50);
  r.dimV(xBack, y4, xBack, y5, xDimR, String(p.H_upper), 54);
  r.dimV(xBack, y5, xBack, y6, xDimR, String(p.H_wing_drop), 54);
  r.dimV(xBack, y1, xBack, y5, xDimR + 180, String(p.H_lower + p.H_mid + p.H_notch + p.H_upper), 58);

  // Slopes & Notes
  r.text(xWeirL - 70, (y4 + y5) / 2, `1:${p.m_up}`, 52, '#f8fafc', 'center', Math.PI / 2.2);
  r.text(xApronL - 60, (y2 + y3) / 2, `1:${p.m_mid}`, 52, '#f8fafc', 'center', Math.PI / 2.4);
  r.text((xTopR + xBack) / 2 + 55, (y2 + y3) / 2, `1:${((xBack - xTopR) / sc / p.H_mid).toFixed(2)}`, 52, '#f8fafc', 'center', -Math.PI / 3);
  r.text(xKeyTopR + 55, (y0 + y1) / 2, `1:${p.m_key}`, 50, '#f8fafc', 'center', Math.PI / 2.4);
  r.leader([[xApronL + 40, (y2 + y3) / 2], [xApronL - 250, y3 + 60], [xApronL - 420, y3 + 60]], '軀體模板', 54, 'right');
  r.leader([[xApronL + 120, (y1 + y2) / 2], [xApronL - 220, y1 - 30], [xApronL - 420, y1 - 30]], '280kgf/cm2混凝土', 54, 'right');
  r.leader([[xKeyBotR / 2, y0], [xKeyBotR + 120, y0 - 330], [xKeyBotR + 240, y0 - 330]], '不組模', 50, 'left');
  r.leader([[pX2, y0 - 80], [xBack + 360, y0 - 80]], `${p.D_pile}φcm基樁，交叉排列，H=${(p.L_pile/100).toFixed(1)}m，共${p.N_pile}支`, 52, 'left');

  r.text(xBack / 2 - 200, y0 - 520, '固床工側視圖', 88, '#ffffff');
  r.line(xBack / 2 - 480, y0 - 555, xBack / 2 + 80, y0 - 555, '#ffffff', 1.8);
  r.text(xBack / 2 - 360, y0 - 630, 'S=1/200', 56, '#9ca3af');

  // --- Right Sub-view: 鋼筋剖面詳圖 (S=1/200) ---
  const ox = xBack + 2150;
  r.poly([
    [ox + xTopL, y6],
    [ox + xTopR, y6],
    [ox + xTopR, y3],
    [ox + xBack, y1],
    [ox + xKeyTopR, y1],
    [ox + xKeyBotR, y0],
    [ox, y0],
    [ox, y1],
    [ox + xApronL, y2],
    [ox + xMidL, y4],
    [ox + xWeirL, y5]
  ], true, '#ffffff', 2.0);
  r.line(ox + xMidL, y3, ox + xTopR, y3, '#e2e8f0', 1.3);
  r.line(ox + xApronL, y2, ox + xBack - (y2 - y1) * 0.5, y2, '#e2e8f0', 1.3);

  // Rebar line along key inner slope and base bottom (15cm cover)
  const cov = 15 * sc;
  r.poly([
    [ox + xKeyBotR - cov * 0.8, y0 + cov],
    [ox + xKeyTopR - cov * 0.5, y1 + cov],
    [ox + xBack - cov * 1.2, y1 + cov]
  ], false, '#f43f5e', 2.4, null, null, 'REBAR');
  for (let rx = ox + xKeyTopR; rx <= ox + xBack - cov * 1.4; rx += 30 * sc) {
    r.circle(rx, y1 + cov + 10, 6, '#f43f5e', 1.2, '#f43f5e', null, 'REBAR');
  }
  r.dimV(ox + xBack, y1, ox + xBack, y1 + cov, ox + xBack + 160, '15', 52);
  r.leader([[ox + (xKeyTopR + xBack) / 2, y1 + cov], [ox + xBack - 120, y0 - 160], [ox + xBack + 60, y0 - 160]], 'φ16mm@30cm', 68, 'left');
  r.text(ox + xMidL - 90, (y4 + y5) / 2, `1:${p.m_up}`, 56, '#f8fafc', 'center', Math.PI / 2.2);
  r.text(ox + xApronL / 2 - 70, (y1 + y2) / 2, `1:${((p.B_base - p.B_apron) / p.H_lower).toFixed(2)}`, 56, '#f8fafc', 'center', Math.PI / 2.4);
  r.text(ox + (xTopR + xBack) / 2 + 70, (y2 + y3) / 2, `1:${((xBack - xTopR) / sc / p.H_mid).toFixed(2)}`, 56, '#f8fafc', 'center', -Math.PI / 3);

  r.text(ox + xBack / 2 - 100, y0 - 520, '鋼筋剖面詳圖', 88, '#ffffff');
  r.line(ox + xBack / 2 - 380, y0 - 555, ox + xBack / 2 + 180, y0 - 555, '#ffffff', 1.8);
  r.text(ox + xBack / 2 - 260, y0 - 630, 'S=1/200', 56, '#9ca3af');

  // --- Far Right: 固床工數量表(每座) & 工程說明 ---
  const tx = ox + xBack + 1450;
  const ty = y4 + 120;
  const tw = 1480, rh = 145;
  r.text(tx, ty + 75, '固床工數量表(每座)', 68, '#ffffff', 'left');
  const rows = [
    ['混凝土', 'm³', q.sillConc.toFixed(2)],
    ['軀體模板', 'm²', q.sillForm.toFixed(2)],
    ['鋼筋(估算)', 'kg', q.sillRebar.toFixed(2)]
  ];
  rows.forEach((rw, idx) => {
    const yTop = ty - idx * rh;
    const yBot = yTop - rh;
    r.poly([[tx, yTop], [tx + tw, yTop], [tx + tw, yBot], [tx, yBot]], true, '#ffffff', 1.4);
    r.line(tx + 560, yTop, tx + 560, yBot, '#ffffff', 1.2);
    r.line(tx + 820, yTop, tx + 820, yBot, '#ffffff', 1.2);
    r.text(tx + 280, yBot + 48, rw[0], 54, '#f8fafc', 'center');
    r.text(tx + 690, yBot + 48, rw[1], 54, '#38bdf8', 'center');
    r.text(tx + tw - 50, yBot + 48, rw[2], 56, '#10b981', 'right');
  });

  const ny = ty - rows.length * rh - 140;
  r.text(tx, ny, '工程說明：', 60, '#f59e0b', 'left');
  r.text(tx, ny - 110, '1. 固床工混凝土為 280 kgf/cm²。', 52, '#e2e8f0', 'left');
  r.text(tx, ny - 210, '2. 基礎開挖時，須有臨時排水及擋土支撐等設施，以保障人員安全。', 52, '#e2e8f0', 'left');
  r.text(tx, ny - 310, '3. 鋼筋保護層至少 15 公分，鋼筋間隔器間距約 2 m² / 乙處。', 52, '#e2e8f0', 'left');
  r.text(tx, ny - 410, '4. 基樁打設位置可依現地微幅調整，總數量不變。', 52, '#e2e8f0', 'left');
  r.text(tx, ny - 510, `5. 固床工鋼筋：原圖無鋼筋表，以 ${p.rbk} kg/m³ 估算；混凝土已扣除基樁錨入段 ${q.Vemb.toFixed(2)} m³。`, 52, '#f59e0b', 'left');

  return r;
}

function buildPileSheet(p, q) {
  const r = createRec();
  // 1. Left: 80φcm 基樁詳圖 (Vertical column with break symbols)
  const px = 0, py = 0;
  const pw = p.D_pile * 4.2; // Visual width 336
  const ph = 3200; // Visual height for L=1200
  const embedH = ph * (p.L_embed / p.L_pile);

  r.poly([[px, py], [px + pw, py], [px + pw, py + ph], [px, py + ph]], true, '#ffffff', 2.0);
  // Inner main rebar vertical lines
  const cov = 38;
  r.line(px + cov, py + 25, px + cov, py + ph, '#f43f5e', 1.8, null, 'REBAR');
  r.line(px + pw - cov, py + 25, px + pw - cov, py + ph, '#f43f5e', 1.8, null, 'REBAR');
  r.line(px + cov, py + 25, px + pw - cov, py + 25, '#f43f5e', 1.8, null, 'REBAR');

  // Horizontal hoop bars
  for (let y = py + 50; y < py + ph - embedH; y += 42) {
    r.line(px + cov, y, px + pw - cov, y, '#38bdf8', 0.9, null, 'REBAR');
  }
  // Ground / Base bottom line at py + ph - embedH
  const yBaseBot = py + ph - embedH;
  r.line(px - 220, yBaseBot, px + pw + 260, yBaseBot, '#10b981', 1.8);
  r.text(px + pw + 40, yBaseBot - 65, '設計樁頂', 52, '#10b981', 'left');
  r.leader([[px + pw / 2, yBaseBot], [px + pw + 80, yBaseBot + 220], [px + pw + 180, yBaseBot + 220]], '固床工底版面', 52, 'left');
  r.leader([[px + 40, py + ph], [px + 120, py + ph + 280], [px + 220, py + ph + 280]], '機械打除見詳圖 B-B / 計價樁頂', 52, 'left');

  // Left vertical dimensions on Pile
  r.dimV(px, yBaseBot, px, py + ph, px - 260, String(p.L_embed), 54);
  r.dimV(px, py, px, yBaseBot, px - 260, `③ 16φ@${p.s_h3}`, 54);
  r.dimV(px, py, px, yBaseBot, px - 420, `② 16φ@${p.s_h2}`, 54);
  r.dimV(px, py, px, py + ph, px - 580, `L=${p.L_pile}`, 58);

  r.leader([[px + pw - cov, py + ph * 0.72], [px + pw + 180, py + ph * 0.72]], `① ${p.N_main}-32φ`, 54, 'left');
  r.leader([[px + pw - cov, py + ph * 0.14], [px + pw + 180, py + ph * 0.14]], `① ${p.N_main}-32φ`, 54, 'left');
  r.leader([[px + pw - cov, py + ph * 0.28], [px + pw + 180, py + ph * 0.28]], '鋼管', 54, 'left');
  r.text(px + pw + 60, py + 20, '樁底', 54, '#f8fafc', 'left');
  r.text(px + pw / 2, py - 240, `${p.D_pile}φcm 基樁詳圖`, 85, '#ffffff');
  r.line(px - 40, py - 275, px + pw + 40, py - 275, '#ffffff', 1.8);

  // 2. Top-Middle: 斷面 A-A (Circular pile section)
  const cxA = px + 1450, cyA = py + ph - 150, rA = 360;
  r.circle(cxA, cyA, rA, '#ffffff', 2.2);
  r.circle(cxA, cyA, rA - 38, '#38bdf8', 1.6, null, null, 'REBAR');
  r.circle(cxA, cyA, rA - 68, '#10b981', 1.3, null, [18, 12], 'REBAR');
  for (let i = 0; i < p.N_main; i++) {
    const ang = (i / p.N_main) * Math.PI * 2;
    const bx = cxA + (rA - 52) * Math.cos(ang);
    const by = cyA + (rA - 52) * Math.sin(ang);
    r.circle(bx, by, 10, '#f43f5e', 1.4, '#f43f5e', null, 'REBAR');
    if (i % 4 === 0) {
      const tx = cxA + (rA - 88) * Math.cos(ang + 0.15);
      const ty = cyA + (rA - 88) * Math.sin(ang + 0.15);
      r.circle(tx, ty, 14, '#f59e0b', 1.5);
    }
  }
  r.dimH(cxA - rA, cyA + rA, cxA + rA, cyA + rA, cyA + rA + 140, `${p.D_pile}φ`, 60);
  r.leader([[cxA - rA + 52, cyA - 40], [cxA - rA - 180, cyA - 40]], `① ${p.N_main}-32φ`, 54, 'right');
  r.leader([[cxA + rA - 38, cyA + 80], [cxA + rA + 180, cyA + 80]], `② 16φ@${p.s_h2}`, 54, 'left');
  r.leader([[cxA + rA - 88, cyA - 20], [cxA + rA + 180, cyA - 20]], '基樁完整性試驗管每支基樁4支', 52, 'left');
  r.leader([[cxA + 80, cyA - rA + 68], [cxA + 220, cyA - rA - 90], [cxA + 320, cyA - rA - 90]], `③ 16φ@${p.s_h3}`, 54, 'left');
  r.text(cxA, cyA - rA - 240, '斷面A-A', 82, '#ffffff');
  r.line(cxA - 220, cyA - rA - 275, cxA + 220, cyA - rA - 275, '#ffffff', 1.8);

  // 3. Top-Right: 詳圖 B-B & 間格器詳圖
  const bx0 = cxA + 1250, by0 = cyA - 320;
  const bw = 760, bh = 580;
  r.poly([[bx0, by0], [bx0 + bw, by0], [bx0 + bw, by0 + bh], [bx0, by0 + bh]], true, '#ffffff', 1.8);
  r.line(bx0 - 140, by0 + 160, bx0 + bw + 140, by0 + 160, '#10b981', 1.6);
  r.line(bx0 + 110, by0, bx0 + 110, by0 + bh, '#f43f5e', 2.2, null, 'REBAR');
  r.line(bx0 + bw - 110, by0, bx0 + bw - 110, by0 + bh, '#f43f5e', 2.2, null, 'REBAR');
  r.leader([[bx0 + 110, by0 + bh], [bx0 - 40, by0 + bh + 110], [bx0 - 140, by0 + bh + 110]], '樁頭主筋每束均套PE塑膠套', 52, 'right');
  r.leader([[bx0 + bw + 100, by0 + 160], [bx0 + bw + 220, by0 + 160]], '基礎底面', 52, 'left');
  r.text(bx0 + bw / 2, by0 + 210, '① 32φ', 50, '#f43f5e');
  r.text(bx0 + bw / 2, by0 - 240, '詳圖B-B', 82, '#ffffff');
  r.line(bx0 + bw / 2 - 200, by0 - 275, bx0 + bw / 2 + 200, by0 - 275, '#ffffff', 1.8);

  // 間格器詳圖
  const sx0 = bx0 + bw + 950, sy0 = cyA + 120;
  r.circle(sx0, sy0, 175, '#ffffff', 1.8);
  r.circle(sx0, sy0, 32, '#38bdf8', 1.5);
  r.line(sx0 - 16, sy0, sx0 - 16, sy0 + 175, '#ffffff', 1.5);
  r.line(sx0 + 16, sy0, sx0 + 16, sy0 + 175, '#ffffff', 1.5);
  r.dimH(sx0 - 175, sy0 + 175, sx0 + 175, sy0 + 175, sy0 + 260, 'φ17.5', 50);
  r.poly([[sx0 - 175, sy0 - 420], [sx0 + 175, sy0 - 420], [sx0 + 175, sy0 - 340], [sx0 - 175, sy0 - 340]], true, '#ffffff', 1.8);
  r.text(sx0, sy0 - 600, '間格器詳圖', 82, '#ffffff');
  r.line(sx0 - 240, sy0 - 635, sx0 + 240, sy0 - 635, '#ffffff', 1.8);

  // 4. Middle-Center: 基樁配置詳圖 (0K+040-066) & (0K+013-040)
  const gx0 = px + 850, gy1 = py + 1350, gw = 1950, gh = 620;
  r.poly([[gx0, gy1], [gx0 + gw, gy1], [gx0 + gw, gy1 + gh], [gx0, gy1 + gh]], true, '#ffffff', 1.8);
  const yGUp1 = gy1 + gh - 190, yGDn1 = yGUp1 - 210;
  [380, 980, 1580].forEach(dx => r.circle(gx0 + dx, yGUp1, 55, '#f59e0b', 1.8, 'rgba(245,158,11,0.35)'));
  [120, 680, 1280].forEach(dx => r.circle(gx0 + dx, yGDn1, 55, '#f59e0b', 1.8, 'rgba(245,158,11,0.35)'));
  r.dimH(gx0 + 380, yGUp1, gx0 + 980, yGUp1, yGUp1 + 100, String(p.S_dense), 50);
  r.dimH(gx0 + 980, yGUp1, gx0 + 1580, yGUp1, yGUp1 + 100, String(p.S_dense), 50);
  r.dimH(gx0 + 120, yGDn1, gx0 + 680, yGDn1, yGDn1 + 100, String(p.S_dense), 50);
  r.dimV(gx0 + gw, yGUp1, gx0 + gw, gy1 + gh, gx0 + gw + 150, String(p.Dy_edge), 50);
  r.dimV(gx0 + gw, yGDn1, gx0 + gw, yGUp1, gx0 + gw + 150, String(p.Dy_pile), 50);
  r.text(gx0 + gw / 2, gy1 + 50, '趾部', 48, '#9ca3af');
  r.text(gx0 + gw / 2, gy1 - 150, '基樁配置詳圖（密排區）', 76, '#ffffff');
  r.line(gx0 + gw / 2 - 580, gy1 - 185, gx0 + gw / 2 + 580, gy1 - 185, '#ffffff', 1.6);

  // Lower layout (0K+013-040)
  const gy2 = py + 120;
  r.poly([[gx0, gy2], [gx0 + gw, gy2], [gx0 + gw, gy2 + gh], [gx0, gy2 + gh]], true, '#ffffff', 1.8);
  const yGUp2 = gy2 + gh - 190, yGDn2 = yGUp2 - 210;
  [680, 1680].forEach(dx => r.circle(gx0 + dx, yGUp2, 55, '#f59e0b', 1.8, 'rgba(245,158,11,0.35)'));
  [180, 1180].forEach(dx => r.circle(gx0 + dx, yGDn2, 55, '#f59e0b', 1.8, 'rgba(245,158,11,0.35)'));
  r.dimH(gx0 + 680, yGUp2, gx0 + 1680, yGUp2, yGUp2 + 100, String(p.S_sparse), 50);
  r.dimH(gx0 + 180, yGDn2, gx0 + 1180, yGDn2, yGDn2 + 100, String(p.S_sparse), 50);
  r.dimV(gx0 + gw, yGUp2, gx0 + gw, gy2 + gh, gx0 + gw + 150, String(p.Dy_edge), 50);
  r.dimV(gx0 + gw, yGDn2, gx0 + gw, yGUp2, gx0 + gw + 150, String(p.Dy_pile), 50);
  r.text(gx0 + gw / 2, gy2 + 50, '趾部', 48, '#9ca3af');
  r.text(gx0 + gw / 2, gy2 - 150, '基樁配置詳圖（一般區）', 76, '#ffffff');
  r.line(gx0 + gw / 2 - 860, gy2 - 185, gx0 + gw / 2 + 860, gy2 - 185, '#ffffff', 1.6);

  // 5. Bottom-Right: 12m 基樁材料數量表(每支)
  const tx = gx0 + gw + 580, ty = py + 1720;
  const tw = 2100;
  r.text(tx, ty + 80, `${(p.L_pile/100).toFixed(0)}m 基樁材料數量表(每支)`, 72, '#ffffff', 'left');
  r.poly([[tx, ty], [tx + tw, ty], [tx + tw, ty - 1150], [tx, ty - 1150]], true, '#ffffff', 1.8);

  const cols = [0, 180, 410, 650, 880, 1120, 1400, 2100];
  for (let c = 1; c < cols.length - 1; c++) {
    const hLine = c <= 6 ? (c === 6 ? 520 : 520) : 1150;
    r.line(tx + cols[c], ty, tx + cols[c], ty - hLine, '#ffffff', 1.2);
  }
  const headers = ['編號', '直徑(mm)', '單位重', '根數(支)', '長度(M)', '總重(kg)', '鋼筋示意圖'];
  headers.forEach((h, i) => {
    r.text(tx + (cols[i] + cols[i+1]) / 2, ty - 85, h, 46, '#38bdf8', 'center');
  });
  r.line(tx, ty - 130, tx + tw, ty - 130, '#ffffff', 1.4);

  const pRows = [
    ['①', '32φ', p.w32.toFixed(3), String(p.N_main), q.mainLen.toFixed(2), q.w1.toFixed(2), '直 ───────'],
    ['②', '16φ', p.w16.toFixed(3), String(q.nHoop2), q.lenHoop2.toFixed(2), q.w2.toFixed(2), ''],
    ['③', '16φ', p.w16.toFixed(3), String(q.nHoop3), q.lenHoop3.toFixed(2), q.w3.toFixed(2), '']
  ];
  pRows.forEach((pr, idx) => {
    const ry = ty - 130 - (idx + 1) * 130;
    r.line(tx, ry, tx + 1400, ry, '#ffffff', 1.1);
    for (let j = 0; j < 6; j++) {
      r.text(tx + (cols[j] + cols[j+1]) / 2, ry + 45, pr[j], 46, j === 5 ? '#10b981' : '#f8fafc', 'center');
    }
  });

  // Summary inside table bottom
  r.text(tx + 120, ty - 720, `16φ   ${q.sum16.toFixed(2)} × ${p.k16} = ${q.loss16.toFixed(2)}`, 50, '#f8fafc', 'left');
  r.text(tx + 120, ty - 810, `32φ   ${q.w1.toFixed(2)} × ${p.k32} = ${q.loss32.toFixed(2)}`, 50, '#f8fafc', 'left');
  r.line(tx + 100, ty - 845, tx + 960, ty - 845, '#ffffff', 1.4);
  r.text(tx + 420, ty - 920, `總計 ≒ ${q.pileRebarTotal.toFixed(2)} kg`, 54, '#f59e0b', 'left');
  r.text(tx + 120, ty - 1045, `210kgf/cm² 水中混凝土 ${q.pileConc.toFixed(2)} m³`, 54, '#38bdf8', 'left');

  // Hoop diagrams ② and ③ inside right half of table
  r.circle(tx + 1580, ty - 780, 140, '#38bdf8', 1.8);
  r.text(tx + 1580, ty - 760, `R=${((p.D_pile - p.d_h2) / 2).toFixed(1)}`, 44, '#f8fafc');
  r.text(tx + 1580, ty - 840, `② (搭接${p.lap2})`, 42, '#38bdf8');

  r.circle(tx + 1900, ty - 780, 125, '#10b981', 1.8);
  r.text(tx + 1900, ty - 760, `R=${((p.D_pile - p.d_h3) / 2).toFixed(1)}`, 44, '#f8fafc');
  r.text(tx + 1900, ty - 840, `③ (搭接${p.lap3})`, 42, '#10b981');

  // Pile Notes below table
  const pny = ty - 1320;
  r.text(tx, pny, '說明：', 56, '#f59e0b', 'left');
  r.text(tx, pny - 95, '1. 本工程基樁之鋼筋以焊接方式加工及組立，焊接方式須提送方案經工程司認可後施工。', 46, '#e2e8f0', 'left');
  r.text(tx, pny - 180, '2. 本工程場鑄基樁之鋼筋須為可焊鋼筋；基樁完整性試驗管每支基樁 4 支。', 46, '#e2e8f0', 'left');
  r.text(tx, pny - 265, '3. 基樁打設若遇巨石或岩盤無法再鑽入設計深度時，由現場監造技師確認並依實際數量結算。', 46, '#e2e8f0', 'left');

  return r;
}

function appendRec(target, src, dx, dy) {
  src.list.forEach(item => {
    if (item.type === 'line') {
      target.push({ ...item, x1: item.x1 + dx, y1: item.y1 + dy, x2: item.x2 + dx, y2: item.y2 + dy });
    } else if (item.type === 'poly') {
      target.push({ ...item, pts: item.pts.map(pt => [pt[0] + dx, pt[1] + dy]) });
    } else if (item.type === 'circle') {
      target.push({ ...item, cx: item.cx + dx, cy: item.cy + dy });
    } else if (item.type === 'text') {
      target.push({ ...item, x: item.x + dx, y: item.y + dy });
    }
  });
}

function rebuildScene() {
  const p = getParams();
  const q = calcQuantities(p);

  document.getElementById('kpi_sill_conc').textContent = q.sillConc.toFixed(2);
  document.getElementById('kpi_sill_form').textContent = q.sillForm.toFixed(2);
  document.getElementById('kpi_sill_rebar').textContent = q.sillRebar.toFixed(2);
  document.getElementById('kpi_pile_rebar').textContent = q.pileRebarTotal.toFixed(2);

  cadEntities = [];

  const planRec = buildSillPlan(p);
  const elevRec = buildSillElevation(p);
  const sideRec = buildSillSideAndRebar(p, q);
  const pileRec = buildPileSheet(p, q);

  const bPlan = planRec.getBounds();
  const bElev = elevRec.getBounds();
  const bSide = sideRec.getBounds();
  const bPile = pileRec.getBounds();

  // Dynamic Bounding-Box Relative Layout (prevents overlapping when scaled)
  const gapY1 = Math.max(900, bElev.height * 0.35);
  const yPlanOffset = bElev.maxY - bPlan.minY + gapY1;

  const gapY2 = Math.max(950, bSide.height * 0.28);
  const ySideOffset = bElev.minY - bSide.maxY - gapY2;
  const xSideOffset = p.W_wing_L * 0.45;

  if (currentMode === 'SILL' || currentMode === 'ALL') {
    appendRec(cadEntities, planRec, 0, yPlanOffset);
    appendRec(cadEntities, elevRec, 0, 0);
    appendRec(cadEntities, sideRec, xSideOffset, ySideOffset);
  }

  if (currentMode === 'PILE') {
    appendRec(cadEntities, pileRec, 0, 0);
  } else if (currentMode === 'ALL') {
    const sillMaxX = Math.max(bPlan.maxX, bElev.maxX, xSideOffset + bSide.maxX);
    const gapX = Math.max(1800, sillMaxX * 0.16);
    const xPileOffset = sillMaxX - bPile.minX + gapX;
    const yPileOffset = ySideOffset + 400;
    appendRec(cadEntities, pileRec, xPileOffset, yPileOffset);
  }
}

function renderCAD() {
  const canvas = document.getElementById('cadCanvas');
  const ctx = canvas.getContext('2d');
  const w = canvas.width, h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  // Subtle CAD grid
  ctx.save();
  ctx.strokeStyle = 'rgba(55, 65, 81, 0.28)';
  ctx.lineWidth = 1;
  const step = 60;
  for (let x = (cam.x % step); x < w; x += step) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
  }
  for (let y = (cam.y % step); y < h; y += step) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
  }
  ctx.restore();

  ctx.save();
  ctx.translate(cam.x, cam.y);
  ctx.scale(cam.scale, -cam.scale); // CAD Y-up coordinate system

  cadEntities.forEach(e => {
    ctx.save();
    if (e.dash) ctx.setLineDash(e.dash.map(d => d / Math.max(cam.scale, 0.04)));
    ctx.strokeStyle = e.col || '#ffffff';
    ctx.lineWidth = (e.lw || 1.4) / cam.scale;

    if (e.type === 'line') {
      ctx.beginPath();
      ctx.moveTo(e.x1, e.y1);
      ctx.lineTo(e.x2, e.y2);
      ctx.stroke();
    } else if (e.type === 'poly') {
      if (e.pts.length > 0) {
        ctx.beginPath();
        ctx.moveTo(e.pts[0][0], e.pts[0][1]);
        for (let i = 1; i < e.pts.length; i++) ctx.lineTo(e.pts[i][0], e.pts[i][1]);
        if (e.closed) ctx.closePath();
        if (e.fill) { ctx.fillStyle = e.fill; ctx.fill(); }
        ctx.stroke();
      }
    } else if (e.type === 'circle') {
      ctx.beginPath();
      ctx.arc(e.cx, e.cy, e.r, 0, Math.PI * 2);
      if (e.fill) { ctx.fillStyle = e.fill; ctx.fill(); }
      ctx.stroke();
    } else if (e.type === 'text') {
      ctx.scale(1, -1);
      ctx.fillStyle = e.col || '#ffffff';
      ctx.font = `600 ${e.size}px "Microsoft JhengHei", monospace`;
      ctx.textAlign = e.align || 'center';
      ctx.textBaseline = 'middle';
      if (e.rot) {
        ctx.translate(e.x, -e.y);
        ctx.rotate(-e.rot);
        ctx.fillText(e.str, 0, 0);
      } else {
        ctx.fillText(e.str, e.x, -e.y);
      }
    }
    ctx.restore();
  });

  ctx.restore();
}

function getSceneBounds() {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  cadEntities.forEach(e => {
    if (e.type === 'line') {
      minX = Math.min(minX, e.x1, e.x2); maxX = Math.max(maxX, e.x1, e.x2);
      minY = Math.min(minY, e.y1, e.y2); maxY = Math.max(maxY, e.y1, e.y2);
    } else if (e.type === 'poly') {
      e.pts.forEach(pt => {
        minX = Math.min(minX, pt[0]); maxX = Math.max(maxX, pt[0]);
        minY = Math.min(minY, pt[1]); maxY = Math.max(maxY, pt[1]);
      });
    } else if (e.type === 'circle') {
      minX = Math.min(minX, e.cx - e.r); maxX = Math.max(maxX, e.cx + e.r);
      minY = Math.min(minY, e.cy - e.r); maxY = Math.max(maxY, e.cy + e.r);
    } else if (e.type === 'text') {
      minX = Math.min(minX, e.x - 200); maxX = Math.max(maxX, e.x + 200);
      minY = Math.min(minY, e.y - 80); maxY = Math.max(maxY, e.y + 80);
    }
  });
  if (minX === Infinity) return { minX: 0, minY: 0, maxX: 1000, maxY: 1000 };
  return { minX, minY, maxX, maxY };
}

function zoomToFit() {
  const canvas = document.getElementById('cadCanvas');
  const b = getSceneBounds();
  const sw = Math.max(100, b.maxX - b.minX);
  const sh = Math.max(100, b.maxY - b.minY);
  const pad = 0.88;
  cam.scale = Math.min((canvas.width * pad) / sw, (canvas.height * pad) / sh);
  const cx = (b.minX + b.maxX) / 2;
  const cy = (b.minY + b.maxY) / 2;
  cam.x = canvas.width / 2 - cx * cam.scale;
  cam.y = canvas.height / 2 + cy * cam.scale;
  renderCAD();
}

function onParamChange() {
  rebuildScene();
  renderCAD();
}

function switchMode(m) {
  currentMode = m;
  document.getElementById('tabAll').classList.toggle('active', m === 'ALL');
  document.getElementById('tabSill').classList.toggle('active', m === 'SILL');
  document.getElementById('tabPile').classList.toggle('active', m === 'PILE');
  rebuildScene();
  zoomToFit();
}

function resetDefaults() {
  for (const [k, v] of Object.entries(DEFAULTS)) {
    const el = document.getElementById('p_' + k);
    if (el) el.value = v;
  }
  rebuildScene();
  zoomToFit();
}

function toUnicodeDXF(str) {
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

function exportDXF() {
  let dxf = '0\nSECTION\n2\nHEADER\n9\n$ACADVER\n1\nAC1009\n0\nENDSEC\n';
  dxf += '0\nSECTION\n2\nENTITIES\n';
  cadEntities.forEach(e => {
    const lyr = e.lyr || 'STRUCT';
    if (e.type === 'line') {
      dxf += `0\nLINE\n8\n${lyr}\n10\n${e.x1.toFixed(2)}\n20\n${e.y1.toFixed(2)}\n30\n0.0\n11\n${e.x2.toFixed(2)}\n21\n${e.y2.toFixed(2)}\n31\n0.0\n`;
    } else if (e.type === 'poly') {
      for (let i = 0; i < e.pts.length; i++) {
        const p1 = e.pts[i];
        const p2 = e.pts[(i + 1) % e.pts.length];
        if (!e.closed && i === e.pts.length - 1) break;
        dxf += `0\nLINE\n8\n${lyr}\n10\n${p1[0].toFixed(2)}\n20\n${p1[1].toFixed(2)}\n30\n0.0\n11\n${p2[0].toFixed(2)}\n21\n${p2[1].toFixed(2)}\n31\n0.0\n`;
      }
    } else if (e.type === 'circle') {
      dxf += `0\nCIRCLE\n8\n${lyr}\n10\n${e.cx.toFixed(2)}\n20\n${e.cy.toFixed(2)}\n30\n0.0\n40\n${e.r.toFixed(2)}\n`;
    } else if (e.type === 'text') {
      dxf += `0\nTEXT\n8\n${lyr}\n10\n${e.x.toFixed(2)}\n20\n${e.y.toFixed(2)}\n30\n0.0\n40\n${(e.size * 0.75).toFixed(2)}\n1\n${toUnicodeDXF(e.str)}\n`;
    }
  });
  dxf += '0\nENDSEC\n0\nEOF\n';
  const blob = new Blob([dxf], { type: 'application/dxf;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'groundsill_and_80cm_pile_std_drawing.dxf';
  a.click();
}

function exportCSV() {
  const p = getParams();
  const q = calcQuantities(p);
  const rows = [
    ['項目類別', '工項名稱', '單位', '數量', '計算說明'],
    ['固床工(每座)', '280kgf/cm² 混凝土', 'm³', q.sillConc.toFixed(2), `壩頂總長=${p.L_total}cm, 基礎長=${p.L_base}cm, 總高=${p.H_total}cm`],
    ['固床工(每座)', '軀體模板', 'm²', q.sillForm.toFixed(2), '兩側邊及齒牆底不組模'],
    ['固床工(每座)', '鋼筋(含損耗)', 'kg', q.sillRebar.toFixed(2), 'φ16mm@30cm 護面鋼筋網，保護層至少15cm'],
    ['12m基樁(每支)', '① 32φ 主筋', 'kg', q.w1.toFixed(2), `6.390 kg/m × ${p.N_main}支 × ${q.mainLen.toFixed(2)}m`],
    ['12m基樁(每支)', '② 16φ 外圈箍筋@15', 'kg', q.w2.toFixed(2), `1.560 kg/m × ${q.nHoop2}支 × ${q.lenHoop2.toFixed(2)}m`],
    ['12m基樁(每支)', '③ 16φ 內圈加勁箍筋@100', 'kg', q.w3.toFixed(2), `1.560 kg/m × ${q.nHoop3}支 × ${q.lenHoop3.toFixed(2)}m`],
    ['12m基樁(每支)', '單支基樁鋼筋總計(含損耗)', 'kg', q.pileRebarTotal.toFixed(2), `16φ含8%損耗=${q.loss16.toFixed(2)}kg + 32φ含10%損耗=${q.loss32.toFixed(2)}kg`],
    ['12m基樁(每支)', '210kgf/cm² 水中混凝土', 'm³', q.pileConc.toFixed(2), `樁徑=${p.D_pile}cm, 樁長=${(p.L_pile/100).toFixed(1)}m`],
    ['全座基樁合計', `${p.N_pile}支基樁鋼筋總重`, 'kg', (q.pileRebarTotal * p.N_pile).toFixed(2), `每支 ${q.pileRebarTotal.toFixed(2)} kg × ${p.N_pile} 支`],
    ['全座基樁合計', `${p.N_pile}支基樁水中混凝土總量`, 'm³', (q.pileConc * p.N_pile).toFixed(2), `每支 ${q.pileConc.toFixed(2)} m³ × ${p.N_pile} 支`]
  ];
  const csvContent = '\uFEFF' + rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'groundsill_and_pile_quantities.csv';
  a.click();
}

window.addEventListener('DOMContentLoaded', () => {
  const wrap = document.getElementById('canvasWrap');
  const canvas = document.getElementById('cadCanvas');

  function resizeCanvas() {
    canvas.width = wrap.clientWidth || 960;
    canvas.height = wrap.clientHeight || 680;
    renderCAD();
  }
  window.addEventListener('resize', resizeCanvas);

  canvas.addEventListener('mousedown', e => {
    isDragging = true;
    dragStart.x = e.clientX - cam.x;
    dragStart.y = e.clientY - cam.y;
  });
  window.addEventListener('mousemove', e => {
    if (!isDragging) return;
    cam.x = e.clientX - dragStart.x;
    cam.y = e.clientY - dragStart.y;
    renderCAD();
  });
  window.addEventListener('mouseup', () => { isDragging = false; });
  canvas.addEventListener('dblclick', () => zoomToFit());

  canvas.addEventListener('wheel', e => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.12 : 0.89;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    cam.x = mx - (mx - cam.x) * factor;
    cam.y = my - (my - cam.y) * factor;
    cam.scale = Math.max(0.01, Math.min(3.5, cam.scale * factor));
    renderCAD();
  }, { passive: false });

  requestAnimationFrame(() => {
    resizeCanvas();
    rebuildScene();
    zoomToFit();
  });
});

  ;return { draw(P) { __P = P; currentMode = 'ALL'; rebuildScene(); return cadEntities; }, params(P) { __P = P; return getParams(); }, comp(P) { __P = P; const p = getParams(); return { p, q: calcQuantities(p), piles: getPilePositions(p), sec: __gsSec(p), Y: __gsY(p), plan: __gsPlan(p), crest: __gsCrest(p), top: X => __gsTop(p, X), bot: X => __gsBot(p, X) }; } };
  })();
  /* ---- 本系統介面：參數、圖元轉換、視圖（m）、數量表 ---- */
  const ROW_U = [-3750, -2250, -1250, -500, 0, 500, 1000, 1500, 2250, 3250, 4250], ROW_D = [-3250, -1750, -750, -250, 250, 750, 1250, 1750, 2750, 3750, 4750];   // 原圖 22 支（距溢流口中心 cm）
  let RR = null;
  const g = k => { const v = RR && RR[k] !== undefined && RR[k] !== null && RR[k] !== '' ? RR[k] : DEF[k]; return v; }, n = k => { const v = parseFloat(g(k)); return Number.isFinite(v) ? v : parseFloat(DEF[k]); };
  function getParams() {
    const P = {}; PR.forEach(q => { P[q.k.slice(2)] = q.opt ? String(g(q.k)) : n(q.k); });
    const L = a => (Array.isArray(a) ? a.map(Number).filter(Number.isFinite) : null);
    P.rowU = L(RR && RR.__pu) || ROW_U.slice(); P.rowD = L(RR && RR.__pd) || ROW_D.slice();
    return P;
  }
  function toO(E) {
    const O = [], dsh = d => (d && d.length ? [14, 9] : []);
    E.forEach(o => {
      if (o.type === 'line') O.push({ k: 'L', p: [[o.x1, o.y1], [o.x2, o.y2]], c: o.col || '#ffffff', w: o.lw || 1.4, d: dsh(o.dash), ly: o.lyr || '0' });
      else if (o.type === 'poly') O.push({ k: 'P', p: o.pts.map(q => [q[0], q[1]]), c: o.col || '#ffffff', w: o.lw || 1.4, f: o.fill || null, cl: o.closed !== false, d: dsh(o.dash), ly: o.lyr || '0' });
      else if (o.type === 'circle') O.push({ k: 'C', x: o.cx, y: o.cy, r: o.r, c: o.col || '#ffffff', f: o.fill || null, w: o.lw || 1, ly: o.lyr || '0' });
      else if (o.type === 'text') O.push({ k: 'T', x: o.x, y: o.y, s: String(o.str), h: o.size, c: o.col || '#ffffff', al: o.align || 'center', bl: 'middle', rot: o.rot || 0, ly: '文字' });
    });
    return O;
  }
  function hostViews(C) {
    const p = C.p, Y = C.Y, S = C.sec, B = p.B_base, xC = p.W_wing_L + p.W_slope_L + p.W_weir / 2, out = { plan: [], sect: [], elev: [] };
    const X = x => (x - xC) / 100, Z = z => (z - Y.y4) / 100, U = s => (B / 2 - s) / 100, Wc = '#ffffff', Pc = '#f59e0b', Gy = '#94a3b8';
    const zT = Y.y1 + p.L_embed, zB = zT - p.L_pile, rP = p.D_pile / 2, rowY = r => B - p.Dy_edge - r * p.Dy_pile;
    // 正視
    const top = [], bot = [], BR = [0, p.L_ret_L, p.W_wing_L, p.W_wing_L + p.W_slope_L, xC, p.W_wing_L + p.W_slope_L + p.W_weir, p.L_total - p.W_wing_R, p.L_total - p.L_ret_R, p.L_total].sort((a, b) => a - b);
    BR.forEach(x => { top.push([X(x), Z(C.top(x))]); bot.push([X(x), Z(C.bot(x))]); });
    out.elev.push({ p: bot.concat(top.slice().reverse()), cl: true, c: Wc, f: 'rgba(255,255,255,0.05)', d: false });
    [Y.y1, Y.y2].forEach(z => { const xl = p.L_ret_L * (1 - (z - Y.y0) / (Y.y5 - Y.y0)), xr = p.L_total - p.L_ret_R * (1 - (z - Y.y0) / (Y.y5 - Y.y0)); out.elev.push({ p: [[X(xl), Z(z)], [X(xr), Z(z)]], cl: false, c: Gy, f: null, d: false }); });
    C.piles.forEach(q => out.elev.push({ p: [[X(q.x - rP), Z(zT)], [X(q.x + rP), Z(zT)], [X(q.x + rP), Z(zB)], [X(q.x - rP), Z(zB)]], cl: true, c: Pc, f: 'rgba(245,158,11,0.12)', d: false }));
    // 順水流斷面
    out.sect.push({ p: S.poly.map(([x, z]) => [U(x), Z(z)]), cl: true, c: Wc, f: 'rgba(255,255,255,0.05)', d: false });
    [0, 1].forEach(r => { const s = rowY(r); out.sect.push({ p: [[U(s - rP), Z(zT)], [U(s + rP), Z(zT)], [U(s + rP), Z(zB)], [U(s - rP), Z(zB)]], cl: true, c: Pc, f: 'rgba(245,158,11,0.12)', d: false }); });
    // 平面
    out.plan.push({ p: C.plan.map(([x, s]) => [U(s), X(x)]), cl: true, c: Wc, f: 'rgba(255,255,255,0.05)', d: false });
    out.plan.push({ p: [[U(S.xTopR), X(0)], [U(S.xTopR), X(p.L_total)]], cl: false, c: Gy, f: null, d: false });
    out.plan.push({ p: C.crest.map(([x, s]) => [U(s), X(x)]), cl: false, c: Gy, f: null, d: false });
    C.piles.forEach(q => { const s = rowY(q.row); out.plan.push({ p: Array.from({ length: 16 }, (_, i) => [U(s + rP * Math.sin(i * Math.PI / 8)), X(q.x + rP * Math.cos(i * Math.PI / 8))]), cl: true, c: Pc, f: 'rgba(245,158,11,0.35)', d: false }); });
    return out;
  }
  function computeQuantities(C) {
    const p = C.p, q = C.q, N = q.nP, rows = [], f = (v, k) => (+v).toFixed(k === undefined ? 2 : k);
    const r = (no, name, unit, qty, formula, note) => rows.push({ no: String(no), name, unit, qty: unit === '支' ? Math.round(qty) : +(+qty).toFixed(2), formula, note: note || '' });
    r(1, '固床工 280kgf/cm²混凝土', 'm³', q.sillConc, `∫斷面積 dx ${f(q.Vg)}（最大斷面依正視頂緣、兩端斜退底緣裁切，分段 Simpson）－基樁錨入 ${N}×π×${f(p.D_pile / 200, 2)}²×${f(p.L_embed / 100)} = ${f(q.Vemb)}`);
    r(2, '固床工軀體模板', 'm²', q.sillForm, '上下游面（含基礎版側面）沿全長積分；兩端側邊、止滑齒、頂面不組模');
    r(3, '固床工鋼筋（估算）', 'kg', q.sillRebar, `${p.rbk} kg/m³ × ${f(q.sillConc)} m³`, '原圖無鋼筋表，以 kg/m³ 估算');
    r(4, `${p.D_pile}φcm 基樁`, '支', N, p.pmode === 'AUTO' ? `自動排樁：密排 ${p.xd0}～${p.xd1}（每排 @${p.S_dense}）、一般區至 ${p.xs0}～${p.xs1}（每排 @${p.S_sparse}）` : `樁位清單 上排 ${p.rowU.length}＋下排 ${p.rowD.length}`);
    r(5, '基樁 210kgf/cm²水中混凝土', 'm³', q.pileConc * N, `π×${f(p.D_pile / 200)}²×${f(p.L_pile / 100)}＝${f(q.pileConc)} m³/支 × ${N}`);
    r(6, '基樁鋼筋 32φ（含損耗）', 'kg', q.loss32 * N, `${p.N_main}×${f(q.mainLen)}×${p.w32}×${p.k32}＝${f(q.loss32)} kg/支 × ${N}`, '依配筋逐支計算');
    r(7, '基樁鋼筋 16φ（含損耗）', 'kg', q.loss16 * N, `(② ${q.nHoop2}×${f(q.lenHoop2)}＋③ ${q.nHoop3}×${f(q.lenHoop3)})×${p.w16}×${p.k16}＝${f(q.loss16)} kg/支 × ${N}`, '依配筋逐支計算');
    r(8, '基樁鑽掘', 'm', q.drill * N, `(${f(p.L_pile / 100)}－錨入 ${f(p.L_embed / 100)})×${N}`);
    return rows;
  }
  return {
    DEF, PR, GT, title: '固床工＋基樁標準圖', ROW_U, ROW_D,
    getParams: R => { RR = R || {}; try { return __H.params(getParams()); } finally { RR = null; } },
    run(R, opt) {
      RR = R || {};
      try {
        const C = __H.comp(getParams()), P = C.p, rows = computeQuantities(C);
        Object.assign(P, { xC: P.W_wing_L + P.W_slope_L + P.W_weir / 2, piles: C.piles, __q: C.q });
        let O = [], L = null;
        if (opt && opt.draw) { O = toO(__H.draw(getParams())); L = { V: hostViews(C) }; }
        const S = C.sec, out = C.piles.filter(q => q.x < P.L_ret_L || q.x > P.L_total - P.L_ret_R);
        const checks = [
          { ok: S.xBack >= S.xTopR && S.xApronL >= 0, text: `斷面：頂寬 ${P.B_top}、溢流處 ${Math.round(P.B_mid)}、基礎頂 ${P.B_apron}、底寬 ${P.B_base} cm（上游階 ${Math.round(S.xBack - S.xTopR)} cm）` },
          { ok: P.Dy_edge + P.Dy_pile + P.D_pile / 2 <= P.B_base, text: `樁排：距上游緣 ${P.Dy_edge}、前後排距 ${P.Dy_pile} cm（底寬 ${P.B_base}）` },
          { ok: !out.length, text: out.length ? `${out.length} 支樁落在兩端斜退區外` : `基樁 ${C.piles.length} 支，均在基礎底版範圍內` }];
        return { P, rows, checks, O, L };
      } finally { RR = null; }
    }
  };

})();

TCO_S['tfr'] = (function () {   // v8.0 既有護坡基礎補強（原工具沙盒；gen_st3.py 自動產生）
  const GT = ["1. 格框尺寸", "2. 配置（沿護岸牆腳）", "3. 深度與材料", "4. 鋼筋（原圖無鋼筋表，kg/m³ 估算）"];
  const PR = [{"k": "p_N_col", "nm": "橫向分格數（垂直水流）", "def": "2", "st": "1", "min": "1", "max": "10", "g": 0}, {"k": "p_N_row", "nm": "縱向分格數（順水流）", "def": "1", "st": "1", "min": "1", "max": "10", "g": 0}, {"k": "p_W_cell", "nm": "單格橫向淨寬 (cm)", "def": "300", "st": "10", "min": "50", "max": "1000", "g": 0}, {"k": "p_L_cell", "nm": "單格縱向淨長 (cm)", "def": "400", "st": "10", "min": "50", "max": "1000", "g": 0}, {"k": "p_T_wall", "nm": "RC 格樑厚 (cm)", "def": "40", "st": "5", "min": "15", "max": "150", "g": 0}, {"k": "p_L_chamfer", "nm": "內角隅斜角 (cm)", "def": "35", "st": "5", "min": "0", "max": "150", "g": 0}, {"k": "p_S_unit", "nm": "每座縱向間距 (cm)", "def": "180", "st": "10", "min": "0", "max": "2000", "g": 1}, {"k": "p_W_gap_slope", "nm": "距既有護坡（牆腳）間距 (cm)", "def": "100", "st": "10", "min": "0", "max": "1000", "g": 1}, {"k": "p_H_beam", "nm": "格樑深 (cm)", "def": "150", "st": "10", "min": "50", "max": "500", "g": 2}, {"k": "p_D_embed", "nm": "頂層塊石嵌槽深 (cm)", "def": "30", "st": "5", "min": "0", "max": "100", "g": 2}, {"k": "p_K_embed", "nm": "填石深計入嵌槽深（1＝是、0＝否）", "def": "1", "st": "1", "min": "0", "max": "1", "g": 2}, {"k": "p_D_rock", "nm": "塊石代表粒徑 (cm)", "def": "60", "st": "5", "min": "20", "max": "150", "g": 2}, {"k": "p_rbk", "nm": "鋼筋估算量 (kg/m³，含損耗)", "def": "34.94", "st": "0.01", "min": "0", "max": "300", "g": 3}, {"k": "p_S_rebar", "nm": "鋼筋間距（標註）(cm)", "def": "30", "st": "5", "min": "10", "max": "100", "g": 3}, {"k": "p_C_rebar", "nm": "保護層 (cm)", "def": "7.5", "st": "0.5", "min": "3", "max": "20", "g": 3}, {"k": "p_L_rebar_diag", "nm": "開口補強斜筋錨固長 (cm)", "def": "30", "st": "5", "min": "0", "max": "200", "g": 3}];
  const DEF = {}; PR.forEach(q => { DEF[q.k] = q.def; });

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
  const __H = (function () {

/* ============================================================================
 * SWC Parametric Standard Drawing System — Existing Slope Foundation Reinforcement
 * Pure ASCII Identifiers | Dynamic Bounding-Box Layout | DXF & CSV Exporter
 * ============================================================================ */

// 1. Default Standard Parameters (100% exact match with uploaded drawing: 4.8m * 7.2m / 座)
const DEFAULT_PARAMS = {
  N_col: 2,            // 橫向分格數 (垂直水流方向，預設 2 格)
  N_row: 1,            // 縱向分格數 (順水流方向，預設 1 格)
  W_cell: 300,         // 單格橫向淨寬 (cm, 預設 300)
  L_cell: 400,         // 單格縱向淨長 (cm, 預設 400)
  T_wall: 40,          // RC 格樑牆厚 (cm, 預設 40)
  L_chamfer: 35,       // 格框內角隅斜角尺寸 (cm, 預設 35)
  S_unit: 180,         // 每座縱向間距 (cm, 預設 180)
  W_gap_slope: 100,    // 距既有護坡水平間距 (cm, 預設 100)

  H_beam: 150,         // 混凝土格樑深度 (cm, 預設 150)
  D_embed: 30,         // 頂層塊石豎排嵌槽標示深 (cm, 預設 30)
  D_rock: 60,          // 漿塊石代表粒徑 (cm, 40~80cm 預設 60)

  S_rebar: 30,         // 鋼筋配置間距 (cm, 預設 13φ@30cm)
  C_rebar: 7.5,        // 鋼筋保護層厚度 (cm, 預設至少 7.5cm)
  L_rebar_diag: 30     // 開口補強斜筋錨固標示長 (cm, 預設 30)
};

const PRESETS = {
  default: { ...DEFAULT_PARAMS },
  wide3: {
    ...DEFAULT_PARAMS,
    N_col: 3,
    N_row: 1,
    W_cell: 300,
    L_cell: 400,
    T_wall: 40
  },
  grid2x2: {
    ...DEFAULT_PARAMS,
    N_col: 2,
    N_row: 2,
    W_cell: 300,
    L_cell: 400,
    T_wall: 40,
    H_beam: 180
  }
};

let params = { ...DEFAULT_PARAMS };
let currentViewMode = 'ALL'; // 'ALL' | 'PLAN' | 'SECTIONS'
let showSlopeContext = true;
let showRefOverlay = false;
let drawerOpen = true;

// Viewport camera state
let cam = {
  x: 0,
  y: 0,
  scale: 0.22,
  isDragging: false,
  dragStartX: 0,
  dragStartY: 0,
  camStartX: 0,
  camStartY: 0
};

let scenePrimitives = [];
let activeBuffer = scenePrimitives;
let sceneBounds = { minX: 0, minY: 0, maxX: 4000, maxY: 2800 };

function seededRandom(seed) {
  let x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

// ============================================================================
// 2. Derived Geometry & Engineering Quantity Calculation Engine
// ============================================================================
function computeDerivedAndQuantities(p) {   // v8.0：依圖面幾何（格樑扣角隅、格室漿砌石深＝格樑深）；鋼筋原圖無鋼筋表 → kg/m³ 估算
  const N_col = Math.max(1, Math.round(p.N_col)), N_row = Math.max(1, Math.round(p.N_row)), N_cells = N_col * N_row;
  const W_total = N_col * p.W_cell + (N_col + 1) * p.T_wall, L_total = N_row * p.L_cell + (N_row + 1) * p.T_wall;
  const m_W_total = W_total / 100, m_L_total = L_total / 100, m_W_cell = p.W_cell / 100, m_L_cell = p.L_cell / 100, m_H = p.H_beam / 100, c = p.L_chamfer / 100;
  const A_cell_net = Math.max(0.01, m_W_cell * m_L_cell - 4 * 0.5 * c * c), A_cells_total = N_cells * A_cell_net;
  const A_beam_plan = m_W_total * m_L_total - A_cells_total;
  const V_conc = A_beam_plan * m_H;
  const P_outer = 2 * (m_W_total + m_L_total), P_in1 = 2 * (m_W_cell + m_L_cell) - 8 * c + 4 * Math.SQRT2 * c;
  const A_form = (P_outer + N_cells * P_in1) * m_H;
  const W_rebar = V_conc * p.rbk;
  const kE = p.K_embed === undefined ? 1 : (+p.K_embed ? 1 : 0), m_Hs = m_H + kE * p.D_embed / 100;   // v8.1：填石深＝格樑深＋嵌槽深（K_embed＝0 時只算格樑深）
  const V_stone = A_cells_total * m_Hs;
  const f2 = v => (+v).toFixed(2);
  const f_conc_str = `[${f2(m_W_total)}×${f2(m_L_total)} − ${N_cells}×(${f2(m_W_cell)}×${f2(m_L_cell)} − 4×½×${f2(c)}²)] × ${f2(m_H)} = ${f2(V_conc)} m³`;
  const f_form_str = `外模 2×(${f2(m_W_total)}+${f2(m_L_total)})×${f2(m_H)} + 內模 ${N_cells}×[2×(${f2(m_W_cell)}+${f2(m_L_cell)})−8×${f2(c)}+4√2×${f2(c)}]×${f2(m_H)} = ${f2(A_form)} m²`;
  const f_rebar_str = `原圖無鋼筋表，以 ${p.rbk} kg/m³ × ${f2(V_conc)} m³ 估算（含損耗）= ${f2(W_rebar)} kg`;
  const f_stone_str = kE ? `格室淨面積 ${f2(A_cells_total)} m² × 填石深(格樑深 ${f2(m_H)}＋嵌槽深 ${f2(p.D_embed / 100)}) m = ${f2(V_stone)} m³` : `格室淨面積 ${f2(A_cells_total)} m² × 格樑深 ${f2(m_H)} m = ${f2(V_stone)} m³`;
  return { N_col, N_row, N_cells, W_total, L_total, m_W_total, m_L_total, A_cell_net, A_cells_total, V_conc, A_form, W_rebar, V_stone, f_conc_str, f_form_str, f_rebar_str, f_stone_str };
}

// ============================================================================
// 3. CAD Primitive Buffer & Dynamic Bounding-Box Engine
// ============================================================================
const LAYER_COLORS = {
  STRUCT: '#ffffff',
  STRUCT_SUB: '#94a3b8',
  STONE: '#ffb300',
  REBAR: '#ff5252',
  EXCAV: '#69f0ae',
  DIM: '#00e5ff',
  TEXT: '#e6edf3',
  CENTER: '#f472b6',
  TABLE: '#cbd5e1',
  REF: '#ff4081'
};

function addLine(x1, y1, x2, y2, layer = 'STRUCT', dashed = false, lineWidth = 1.4) {
  activeBuffer.push({ type: 'LINE', x1, y1, x2, y2, layer, dashed, lineWidth });
}

function addPoly(pts, closed = false, layer = 'STRUCT', dashed = false, lineWidth = 1.4, fill = null) {
  if (!pts || pts.length < 2) return;
  activeBuffer.push({ type: 'POLY', pts, closed, layer, dashed, lineWidth, fill });
}

function addCircle(cx, cy, r, layer = 'REBAR', filled = true, dashed = false, lineWidth = 1.2) {
  activeBuffer.push({ type: 'CIRCLE', cx, cy, r, layer, filled, dashed, lineWidth });
}

function addText(x, y, text, size = 18, layer = 'TEXT', align = 'center', angleDeg = 0) {
  activeBuffer.push({ type: 'TEXT', x, y, text: String(text), size, layer, align, angleDeg });
}

function getGroupBBox(prims) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  const inc = (x, y) => {
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  };
  prims.forEach(pr => {
    if (pr.type === 'LINE') {
      inc(pr.x1, pr.y1);
      inc(pr.x2, pr.y2);
    } else if (pr.type === 'POLY') {
      pr.pts.forEach(pt => inc(pt[0], pt[1]));
    } else if (pr.type === 'CIRCLE') {
      inc(pr.cx - pr.r, pr.cy - pr.r);
      inc(pr.cx + pr.r, pr.cy + pr.r);
    } else if (pr.type === 'TEXT') {
      const strLen = String(pr.text || '').length;
      const wEst = Math.max(pr.size, strLen * pr.size * 0.62);
      const hEst = pr.size * 1.3;
      if (Math.abs(pr.angleDeg || 0) > 45) {
        inc(pr.x - hEst, pr.y - wEst * 0.5);
        inc(pr.x + hEst, pr.y + wEst * 0.5);
      } else if (pr.align === 'left') {
        inc(pr.x, pr.y - hEst * 0.6);
        inc(pr.x + wEst, pr.y + hEst * 0.6);
      } else if (pr.align === 'right') {
        inc(pr.x - wEst, pr.y - hEst * 0.6);
        inc(pr.x, pr.y + hEst * 0.6);
      } else {
        inc(pr.x - wEst * 0.5, pr.y - hEst * 0.6);
        inc(pr.x + wEst * 0.5, pr.y + hEst * 0.6);
      }
    }
  });
  if (minX === Infinity) return { minX: 0, minY: 0, maxX: 100, maxY: 100, width: 100, height: 100 };
  return { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY };
}

function captureSubView(buildFn) {
  const prevBuf = activeBuffer;
  const subBuf = [];
  activeBuffer = subBuf;
  buildFn();
  activeBuffer = prevBuf;
  const bbox = getGroupBBox(subBuf);
  return { prims: subBuf, bbox };
}

function placeSubView(subView, dx = 0, dy = 0) {
  subView.prims.forEach(pr => {
    if (pr.type === 'LINE') {
      activeBuffer.push({ ...pr, x1: pr.x1 + dx, y1: pr.y1 + dy, x2: pr.x2 + dx, y2: pr.y2 + dy });
    } else if (pr.type === 'POLY') {
      activeBuffer.push({ ...pr, pts: pr.pts.map(pt => [pt[0] + dx, pt[1] + dy]) });
    } else if (pr.type === 'CIRCLE') {
      activeBuffer.push({ ...pr, cx: pr.cx + dx, cy: pr.cy + dy });
    } else if (pr.type === 'TEXT') {
      activeBuffer.push({ ...pr, x: pr.x + dx, y: pr.y + dy });
    }
  });
  return {
    minX: subView.bbox.minX + dx,
    maxX: subView.bbox.maxX + dx,
    minY: subView.bbox.minY + dy,
    maxY: subView.bbox.maxY + dy,
    width: subView.bbox.width,
    height: subView.bbox.height
  };
}

// ============================================================================
// 4. Dimension, Leader & Natural Stone Texture Helpers
// ============================================================================
function drawDimH(x1, x2, yStruct1, yStruct2, yDim, label, size = 18, extGap = 10, extOver = 8, layer = 'DIM') {
  const minX = Math.min(x1, x2);
  const maxX = Math.max(x1, x2);
  const span = maxX - minX;
  if (span < 1e-3) return;

  const dir1 = yDim >= yStruct1 ? 1 : -1;
  const dir2 = yDim >= yStruct2 ? 1 : -1;

  addLine(x1, yStruct1 + dir1 * extGap, x1, yDim + dir1 * extOver, layer, false, 1.0);
  addLine(x2, yStruct2 + dir2 * extGap, x2, yDim + dir2 * extOver, layer, false, 1.0);
  addLine(minX, yDim, maxX, yDim, layer, false, 1.0);

  const arrL = Math.min(12, span * 0.24);
  const arrW = arrL * 0.34;
  addPoly([[minX + arrL, yDim + arrW], [minX, yDim], [minX + arrL, yDim - arrW]], false, layer, false, 1.1);
  addPoly([[maxX - arrL, yDim + arrW], [maxX, yDim], [maxX - arrL, yDim - arrW]], false, layer, false, 1.1);

  addText((minX + maxX) / 2, yDim + size * 0.52, label, size, 'TEXT', 'center', 0);
}

function drawDimV(y1, y2, xStruct1, xStruct2, xDim, label, size = 18, extGap = 10, extOver = 8, layer = 'DIM') {
  const minY = Math.min(y1, y2);
  const maxY = Math.max(y1, y2);
  const span = maxY - minY;
  if (span < 1e-3) return;

  const dir1 = xDim >= xStruct1 ? 1 : -1;
  const dir2 = xDim >= xStruct2 ? 1 : -1;

  addLine(xStruct1 + dir1 * extGap, y1, xDim + dir1 * extOver, y1, layer, false, 1.0);
  addLine(xStruct2 + dir2 * extGap, y2, xDim + dir2 * extOver, y2, layer, false, 1.0);
  addLine(xDim, minY, xDim, maxY, layer, false, 1.0);

  const arrL = Math.min(12, span * 0.24);
  const arrW = arrL * 0.34;
  addPoly([[xDim - arrW, minY + arrL], [xDim, minY], [xDim + arrW, minY + arrL]], false, layer, false, 1.1);
  addPoly([[xDim - arrW, maxY - arrL], [xDim, maxY], [xDim + arrW, maxY - arrL]], false, layer, false, 1.1);

  addText(xDim - size * 0.52, (minY + maxY) / 2, label, size, 'TEXT', 'center', 90);
}

function drawLeader(pts, textLines, size = 16, align = 'left', layer = 'DIM') {
  if (!pts || pts.length < 2) return;
  addPoly(pts, false, layer, false, 1.0);

  const dx = pts[1][0] - pts[0][0];
  const dy = pts[1][1] - pts[0][1];
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len, uy = dy / len;
  const px = -uy, py = ux;
  const aL = 11, aW = 3.8;
  addPoly([
    [pts[0][0] + ux * aL + px * aW, pts[0][1] + uy * aL + py * aW],
    [pts[0][0], pts[0][1]],
    [pts[0][0] + ux * aL - px * aW, pts[0][1] + uy * aL - py * aW]
  ], false, layer, false, 1.0);

  const last = pts[pts.length - 1];
  const lines = Array.isArray(textLines) ? textLines : [textLines];
  const offsetX = align === 'left' ? 6 : (align === 'right' ? -6 : 0);
  lines.forEach((ln, idx) => {
    if (ln) {
      addText(last[0] + offsetX, last[1] + 4 - idx * (size * 1.25), ln, size, 'TEXT', align, 0);
    }
  });
}

// Multi-ring irregular natural stone for Plan View cells (Voronoi-like masonry blocks)
function drawPlanCellMasonry(xMin, yMin, xMax, yMax, dRock, seedBase = 100, layer = 'STONE') {
  const width = xMax - xMin;
  const height = yMax - yMin;
  if (width <= 20 || height <= 20) return;

  const pitch = Math.max(45, dRock * 1.15);
  const cols = Math.max(2, Math.round(width / pitch));
  const rows = Math.max(2, Math.round(height / pitch));
  const cellW = width / cols;
  const cellH = height / rows;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const seed = seedBase + r * 131 + c * 59;
      const cx = xMin + (c + 0.5) * cellW + (seededRandom(seed + 1) - 0.5) * cellW * 0.24;
      const cy = yMin + (r + 0.5) * cellH + (seededRandom(seed + 2) - 0.5) * cellH * 0.24;
      const rx = cellW * 0.44;
      const ry = cellH * 0.44;

      const nVerts = 6 + (seed % 2);
      const outerPts = [];
      const innerPts = [];
      for (let i = 0; i < nVerts; i++) {
        const ang = (i / nVerts) * Math.PI * 2 + (seededRandom(seed + i * 7) - 0.5) * 0.35;
        const rad = 0.78 + 0.26 * seededRandom(seed + i * 13);
        const px = Math.max(xMin + 4, Math.min(xMax - 4, cx + Math.cos(ang) * rx * rad));
        const py = Math.max(yMin + 4, Math.min(yMax - 4, cy + Math.sin(ang) * ry * rad));
        outerPts.push([px, py]);
        innerPts.push([
          cx + (px - cx) * 0.62,
          cy + (py - cy) * 0.62
        ]);
      }
      addPoly(outerPts, true, layer, false, 1.2);
      addPoly(innerPts, true, layer, false, 0.75);
    }
  }
}

// Section View Packed Boulders (Bottom layers horizontal/round + Top layer vertically embedded `豎排`)
function drawSectionPackedStones(xMin, yBot, xMax, yBeamTop, dEmbed, dRock, seedBase = 500, layer = 'STONE') {
  const width = xMax - xMin;
  const hBody = yBeamTop - yBot;
  if (width <= 15 || hBody <= 15) return;

  // Lower layers inside cell (from yBot to yBeamTop - dEmbed*0.7)
  const yLowerTop = yBeamTop - dEmbed * 0.65;
  const lowerH = Math.max(40, yLowerTop - yBot);
  const nRows = Math.max(2, Math.round(lowerH / (dRock * 0.68)));
  const nCols = Math.max(3, Math.round(width / (dRock * 0.82)));
  const cW = width / nCols;
  const rH = lowerH / nRows;

  for (let r = 0; r < nRows; r++) {
    for (let c = 0; c < nCols; c++) {
      const seed = seedBase + r * 97 + c * 37;
      const cx = xMin + (c + 0.5) * cW + (seededRandom(seed) - 0.5) * cW * 0.14;
      const cy = yBot + (r + 0.5) * rH + (seededRandom(seed + 3) - 0.5) * rH * 0.12;
      const rx = cW * 0.47;
      const ry = rH * 0.47;
      const pts = [];
      const nV = 10;
      for (let i = 0; i < nV; i++) {
        const a = (i / nV) * Math.PI * 2;
        const rf = 0.88 + 0.16 * seededRandom(seed + i * 11);
        pts.push([
          Math.max(xMin + 2, Math.min(xMax - 2, cx + Math.cos(a) * rx * rf)),
          Math.max(yBot + 2, Math.min(yLowerTop + 8, cy + Math.sin(a) * ry * rf))
        ]);
      }
      addPoly(pts, true, layer, false, 1.15);
    }
  }

  // Top layer: Vertically oriented boulders (`頂部塊石須豎排(嵌入約1/2φ以上)`) flush with yBeamTop
  const nTopCols = Math.max(4, Math.round(width / (dRock * 0.64)));
  const topW = width / nTopCols;
  const topH = dEmbed * 1.65;
  const cyTop = yBeamTop - topH * 0.5;

  for (let c = 0; c < nTopCols; c++) {
    const seed = seedBase + 800 + c * 43;
    const cx = xMin + (c + 0.5) * topW;
    const rx = topW * 0.46;
    const ry = topH * 0.48;
    const pts = [];
    const nV = 10;
    for (let i = 0; i < nV; i++) {
      const a = (i / nV) * Math.PI * 2;
      const rf = 0.90 + 0.12 * seededRandom(seed + i * 7);
      pts.push([
        Math.max(xMin + 2, Math.min(xMax - 2, cx + Math.cos(a) * rx * rf)),
        Math.min(yBeamTop, cyTop + Math.sin(a) * ry * rf)
      ]);
    }
    addPoly(pts, true, layer, false, 1.25);
  }
}

// Draw standard Riverbed Line symbol (計畫河床線 + 3 ground hatch ticks)
function drawRiverbedSymbol(xStart, xEnd, yBed, label = '計畫河床線') {
  addLine(xStart, yBed, xEnd, yBed, 'EXCAV', false, 1.2);
  addText((xStart + xEnd) / 2, yBed + 14, label, 15, 'TEXT', 'center');
  const xm = (xStart + xEnd) / 2;
  for (let k = -1; k <= 1; k++) {
    const bx = xm + k * 28;
    addLine(bx - 8, yBed, bx - 14, yBed - 10, 'EXCAV', false, 0.9);
    addLine(bx - 3, yBed, bx - 9, yBed - 10, 'EXCAV', false, 0.9);
    addLine(bx + 2, yBed, bx - 4, yBed - 10, 'EXCAV', false, 0.9);
  }
}

// ============================================================================
// 5. Sub-View Builders for All 7 Views in the Standard Drawing
// ============================================================================

// VIEW 1: 既有護坡基礎補強平面圖 (Plan View — Shows 2 units vertically spaced by S_unit = 180cm)
function buildPlanSubView(p, d, targetLayerOverride = null) {
  const sL = targetLayerOverride || 'STRUCT';
  const stL = targetLayerOverride || 'STONE';

  const W_slope_strip = 320;
  const xSlopeL = -p.W_gap_slope - W_slope_strip;
  const xSlopeR = -p.W_gap_slope;
  const xUnitL = 0;
  const xUnitR = d.W_total;

  // Total vertical span of two units + S_unit spacing
  const yUnit1Top = 0;
  const yUnit1Bot = -d.L_total;
  const yUnit2Top = yUnit1Bot - p.S_unit;
  const yUnit2Bot = yUnit2Top - d.L_total;

  // 1. Left Existing Slope Protection Strip (`既有護坡`)
  if (showSlopeContext && !targetLayerOverride) {
    const yStripTop = yUnit1Top + 70;
    const yStripBot = yUnit2Bot - 70;
    addLine(xSlopeL, yStripTop, xSlopeL, yStripBot, 'STRUCT_SUB', false, 1.3);
    addLine(xSlopeR, yStripTop, xSlopeR, yStripBot, 'STRUCT_SUB', false, 1.3);
    addLine(xSlopeR, yUnit1Top, xUnitR + 90, yUnit1Top, 'STRUCT_SUB', false, 0.8);
    addLine(xSlopeR, yUnit2Bot, xUnitR + 90, yUnit2Bot, 'STRUCT_SUB', false, 0.8);

    // Diagonal hatching inside existing slope strip
    const hatchStep = 28;
    for (let yh = yStripBot; yh < yStripTop + W_slope_strip; yh += hatchStep) {
      const y1 = Math.max(yStripBot, Math.min(yStripTop, yh));
      const x1 = xSlopeL + Math.max(0, yh - yStripTop);
      const y2 = Math.max(yStripBot, Math.min(yStripTop, yh - W_slope_strip));
      const x2 = xSlopeR - Math.max(0, yStripBot - (yh - W_slope_strip));
      if (x2 > x1 && y1 > y2) {
        addLine(x1, y1, x2, y2, 'STRUCT_SUB', false, 0.75);
      }
    }
    addText((xSlopeL + xSlopeR) / 2, (yStripTop + yStripBot) / 2, '既 有 護 坡', 28, 'TEXT', 'center', 90);
  }

  // Helper to draw one reinforcement unit at yTop
  const drawOneUnitPlan = (yTop, unitIdx) => {
    const yBot = yTop - d.L_total;
    addPoly([
      [xUnitL, yTop],
      [xUnitR, yTop],
      [xUnitR, yBot],
      [xUnitL, yBot]
    ], true, sL, false, 1.8);

    for (let r = 0; r < d.N_row; r++) {
      const yCellTop = yTop - p.T_wall - r * (p.L_cell + p.T_wall);
      const yCellBot = yCellTop - p.L_cell;

      for (let c = 0; c < d.N_col; c++) {
        const xCellL = xUnitL + p.T_wall + c * (p.W_cell + p.T_wall);
        const xCellR = xCellL + p.W_cell;

        // Cell inner boundary
        addPoly([
          [xCellL, yCellTop],
          [xCellR, yCellTop],
          [xCellR, yCellBot],
          [xCellL, yCellBot]
        ], true, sL, false, 1.5);

        // 45-degree corner chamfer dashed lines (`35`)
        const ch = p.L_chamfer;
        if (ch > 0) {
          // Top-Left corner
          addLine(xCellL, yCellTop - ch, xCellL + ch, yCellTop, sL, true, 1.0);
          // Top-Right corner
          addLine(xCellR - ch, yCellTop, xCellR, yCellTop - ch, sL, true, 1.0);
          // Bottom-Right corner
          addLine(xCellR, yCellBot + ch, xCellR - ch, yCellBot, sL, true, 1.0);
          // Bottom-Left corner
          addLine(xCellL + ch, yCellBot, xCellL, yCellBot + ch, sL, true, 1.0);

          if (!targetLayerOverride && r === d.N_row - 1) {
            // Annotate '35' at bottom-right chamfer of each cell
            addText(xCellR - ch * 0.62, yCellBot + ch * 0.62, p.L_chamfer, 15, 'TEXT', 'center', 45);
          }
        }

        // Fill cell with dynamic natural masonry stones
        if (!targetLayerOverride) {
          drawPlanCellMasonry(
            xCellL + 6, yCellBot + 6,
            xCellR - 6, yCellTop - 6,
            p.D_rock, 100 + unitIdx * 500 + r * 70 + c * 23, stL
          );
        }
      }
    }
  };

  drawOneUnitPlan(yUnit1Top, 0);
  drawOneUnitPlan(yUnit2Top, 1);

  if (!targetLayerOverride) {
    // Top Horizontal Dimensions: 100 | 40 | 300 | 40 | 300 | 40
    const yDimTop = yUnit1Top + 85;
    if (showSlopeContext) {
      drawDimH(xSlopeR, xUnitL, yUnit1Top, yUnit1Top, yDimTop, p.W_gap_slope, 18, 12, 10);
    }
    let curX = xUnitL;
    for (let c = 0; c < d.N_col; c++) {
      drawDimH(curX, curX + p.T_wall, yUnit1Top, yUnit1Top, yDimTop, p.T_wall, 17, 12, 10);
      curX += p.T_wall;
      drawDimH(curX, curX + p.W_cell, yUnit1Top, yUnit1Top, yDimTop, p.W_cell, 18, 12, 10);
      curX += p.W_cell;
    }
    drawDimH(curX, curX + p.T_wall, yUnit1Top, yUnit1Top, yDimTop, p.T_wall, 17, 12, 10);

    // Bottom Total Width Dimension: 720
    drawDimH(xUnitL, xUnitR, yUnit2Bot, yUnit2Bot, yUnit2Bot - 75, d.W_total, 19, 12, 10);

    // Right Vertical Dimensions for Unit 1 & Unit 2: 40 | 400 | 40
    const xDimRight = xUnitR + 65;
    const drawUnitVertDims = (yT) => {
      let cy = yT;
      for (let r = 0; r < d.N_row; r++) {
        drawDimV(cy - p.T_wall, cy, xUnitR, xUnitR, xDimRight, p.T_wall, 17, 10, 8);
        cy -= p.T_wall;
        drawDimV(cy - p.L_cell, cy, xUnitR, xUnitR, xDimRight, p.L_cell, 18, 10, 8);
        cy -= p.L_cell;
      }
      drawDimV(cy - p.T_wall, cy, xUnitR, xUnitR, xDimRight, p.T_wall, 17, 10, 8);
    };
    drawUnitVertDims(yUnit1Top);
    drawUnitVertDims(yUnit2Top);

    // Spacing dimension between Unit 1 and Unit 2: 180
    drawDimV(yUnit2Top, yUnit1Bot, xUnitL + d.W_total * 0.45, xUnitL + d.W_total * 0.45, xUnitL + d.W_total * 0.45, p.S_unit, 18, 4, 4);

    // Section Cut Marks: A-A (through Unit 1 cell center), B-B (through Unit 1 bottom wall)
    const yCutA = yUnit1Top - p.T_wall - p.L_cell * 0.38;
    const yCutB = yUnit1Bot + p.T_wall * 0.5;
    const xCutLeft = showSlopeContext ? (xSlopeL - 55) : (xUnitL - 80);
    const xCutRight = xUnitR + 175;

    // Section A-A marks
    addPoly([[xCutLeft, yCutA + 45], [xCutLeft, yCutA], [xCutLeft + 45, yCutA]], false, 'CENTER', false, 1.4);
    addText(xCutLeft, yCutA + 62, 'A', 20, 'TEXT', 'center');
    addPoly([[xCutRight - 45, yCutA], [xCutRight, yCutA], [xCutRight, yCutA + 45]], false, 'CENTER', false, 1.4);
    addText(xCutRight, yCutA + 62, 'A', 20, 'TEXT', 'center');

    // Section B-B marks
    addPoly([[xCutLeft, yCutB + 45], [xCutLeft, yCutB], [xCutLeft + 45, yCutB]], false, 'CENTER', false, 1.4);
    addText(xCutLeft, yCutB + 62, 'B', 20, 'TEXT', 'center');
    addPoly([[xCutRight - 45, yCutB], [xCutRight, yCutB], [xCutRight, yCutB + 45]], false, 'CENTER', false, 1.4);
    addText(xCutRight, yCutB + 62, 'B', 20, 'TEXT', 'center');

    // Section C-C & D-D marks (on Unit 2 right-most cell and right-most wall)
    const xCutC = xUnitR - p.T_wall - p.W_cell * 0.35;
    const xCutD = xUnitR - p.T_wall * 0.5;
    const yCutTop = yUnit2Top + 65;
    const yCutBot = yUnit2Bot - 115;

    addPoly([[xCutC - 35, yCutTop], [xCutC, yCutTop], [xCutC, yCutTop - 35]], false, 'CENTER', false, 1.4);
    addText(xCutC - 48, yCutTop, 'C', 19, 'TEXT', 'center', 90);
    addPoly([[xCutC - 35, yCutBot], [xCutC, yCutBot], [xCutC, yCutBot + 35]], false, 'CENTER', false, 1.4);
    addText(xCutC - 48, yCutBot, 'C', 19, 'TEXT', 'center', 90);

    addPoly([[xCutD + 35, yCutTop], [xCutD, yCutTop], [xCutD, yCutTop - 35]], false, 'CENTER', false, 1.4);
    addText(xCutD + 48, yCutTop, 'D', 19, 'TEXT', 'center', 90);
    addPoly([[xCutD + 35, yCutBot], [xCutD, yCutBot], [xCutD, yCutBot + 35]], false, 'CENTER', false, 1.4);
    addText(xCutD + 48, yCutBot, 'D', 19, 'TEXT', 'center', 90);

    // Flow Direction Arrow (`水流方向`)
    const xFlow = xUnitR + 170;
    const yFlow = yUnit2Top - 30;
    addPoly([
      [xFlow - 10, yFlow],
      [xFlow + 10, yFlow],
      [xFlow + 10, yFlow - 55],
      [xFlow + 20, yFlow - 55],
      [xFlow, yFlow - 85],
      [xFlow - 20, yFlow - 55],
      [xFlow - 10, yFlow - 55]
    ], true, 'STRUCT', false, 1.2);
    addText(xFlow + 75, yFlow - 42, '水流方向', 18, 'TEXT', 'center');

    // Dual-branch Leader Callout for Stone Masonry in Plan View
    const xCell1Mid = xUnitL + p.T_wall + p.W_cell * 0.45;
    const xCell2Mid = d.N_col >= 2 ? (xUnitL + 2 * p.T_wall + p.W_cell * 1.45) : (xCell1Mid + 50);
    const yCallTarget1 = yUnit1Top - p.T_wall - p.L_cell * 0.32;
    const yCallTarget2 = yUnit1Top - p.T_wall - p.L_cell * 0.55;
    const xCallApex = xUnitL + d.W_total * 0.52;
    const yCallApex = yUnit1Top + 215;

    drawLeader([
      [xCell1Mid, yCallTarget1],
      [xCallApex, yCallApex],
      [xCallApex + 45, yCallApex]
    ], [
      '漿塊石',
      `塊石長徑(${p.D_rock - 20}~${p.D_rock + 20}cm)`,
      '(佔70%以上)－現採'
    ], 17, 'left');
    drawLeader([[xCell2Mid, yCallTarget2], [xCallApex, yCallApex]], '', 17, 'left');

    // View Title
    const yTitle = yUnit2Bot - 185;
    addText((xUnitL + xUnitR) / 2, yTitle, '既有護坡基礎補強平面圖', 26, 'TEXT', 'center');
    addLine((xUnitL + xUnitR) / 2 - 165, yTitle - 18, (xUnitL + xUnitR) / 2 + 165, yTitle - 18, 'STRUCT', false, 1.2);
    addLine((xUnitL + xUnitR) / 2 - 165, yTitle - 24, (xUnitL + xUnitR) / 2 + 165, yTitle - 24, 'STRUCT', false, 0.8);
  }
}

// VIEW 2: 開口補強筋詳圖 (Circular Magnified Corner Rebar Detail View)
function buildOpeningDetailSubView(p, d, targetLayerOverride = null) {
  const sL = targetLayerOverride || 'STRUCT';
  const rL = targetLayerOverride || 'REBAR';
  const sc = 2.4; // Magnified scale for clear rebar detail

  const tw = p.T_wall * sc;
  const ch = p.L_chamfer * sc;
  const cov = p.C_rebar * sc;
  const legL = 135 * sc;
  const R_circle = 115 * sc;

  // Corner outer vertex at (0, 0); vertical wall goes up (+Y), horizontal wall goes left (-X)
  const cx = -tw * 0.85;
  const cy = tw * 0.85;

  // Dashed magnifying circle
  addCircle(cx, cy, R_circle, 'STRUCT_SUB', false, true, 1.1);

  // Outer L-wall lines
  addPoly([
    [-legL, 0],
    [0, 0],
    [0, legL]
  ], false, sL, false, 1.7);

  // Inner L-wall lines with chamfer
  addPoly([
    [-legL, tw],
    [-tw - ch, tw],
    [-tw, tw + ch],
    [-tw, legL]
  ], false, sL, false, 1.7);

  // Dashed inner right-angle corner reference
  addPoly([
    [-tw - ch, tw],
    [-tw, tw],
    [-tw, tw + ch]
  ], false, 'STRUCT_SUB', true, 1.0);

  // Outer & Inner Rebar layers inside the L-wall
  addPoly([
    [-legL + 10, cov],
    [-cov, cov],
    [-cov, legL - 10]
  ], false, rL, false, 1.4);

  addPoly([
    [-legL + 10, tw - cov],
    [-tw + cov, tw - cov],
    [-tw + cov, legL - 10]
  ], false, rL, false, 1.4);

  // 45-degree diagonal corner opening reinforcement bar (`13φ@30cm`)
  const dExt = p.L_rebar_diag * sc;
  const xDiag1 = -tw - ch - dExt * 0.65;
  const yDiag1 = tw - cov * 0.55;
  const xDiag2 = -tw + cov * 0.55;
  const yDiag2 = tw + ch + dExt * 0.65;
  addLine(xDiag1, yDiag1, xDiag2, yDiag2, rL, false, 1.7);

  // Longitudinal rebar dots along the two layers
  const nDots = 6;
  for (let i = 0; i < nDots; i++) {
    const pos = 18 + i * 42;
    if (pos < legL - 15) {
      addCircle(-pos, cov + 4, 3.8, rL, true);
      addCircle(-pos, tw - cov - 4, 3.8, rL, true);
      addCircle(-cov - 4, pos, 3.8, rL, true);
      addCircle(-tw + cov + 4, pos, 3.8, rL, true);
    }
  }

  if (!targetLayerOverride) {
    // Wall thickness dimensions `40` on top and bottom-left
    drawDimH(-tw, 0, legL, legL, legL + 28, p.T_wall, 17, 8, 8);
    drawDimV(0, tw, -legL, -legL, -legL - 28, p.T_wall, 17, 8, 8);

    // Chamfer & anchorage dimensions `35` and `30`
    drawDimH(-tw - ch, -tw, tw, tw, -32, p.L_chamfer, 16, 8, 8);
    drawDimV(tw, tw + ch, -tw, -tw, 32, p.L_rebar_diag, 16, 8, 8);

    drawLeader([
      [(xDiag1 + xDiag2) / 2, (yDiag1 + yDiag2) / 2],
      [cx - R_circle * 0.35, cy + 15],
      [cx - R_circle * 0.48, cy + 15]
    ], [`13φ@${p.S_rebar}cm`], 16, 'right');

    const yTitle = cy - R_circle - 55;
    addText(cx, yTitle, '開口補強筋詳圖', 24, 'TEXT', 'center');
    addLine(cx - 105, yTitle - 16, cx + 105, yTitle - 16, 'STRUCT', false, 1.2);
    addLine(cx - 105, yTitle - 22, cx + 105, yTitle - 22, 'STRUCT', false, 0.8);
  }
}

// Helper to draw existing sloped revetment on the left of Section A-A and Section B-B
function drawExistingSlopeInSection(xUnitL, yTop, p) {
  if (!showSlopeContext) return;
  const xToe = xUnitL - p.W_gap_slope;
  const yToe = yTop;
  const slopeW = 340;
  const slopeH = 220;
  const xCrest = xToe - slopeW;
  const yCrest = yToe + slopeH;

  // Base bedding & sub-layer of existing slope protection
  const nx = slopeH / Math.hypot(slopeW, slopeH);
  const ny = slopeW / Math.hypot(slopeW, slopeH);
  const tSlab = 24;

  addPoly([
    [xCrest, yCrest],
    [xToe, yToe],
    [xToe - nx * tSlab, yToe - ny * tSlab],
    [xCrest - nx * tSlab, yCrest - ny * tSlab]
  ], true, 'STRUCT_SUB', false, 1.3);

  // Boulders on the lower part of existing slope
  const nStones = 8;
  for (let i = 0; i < nStones; i++) {
    const t = (i + 0.5) / (nStones * 1.65);
    const bx = xToe - t * slopeW + nx * 16;
    const by = yToe + t * slopeH + ny * 16;
    addCircle(bx, by, 16, 'STRUCT_SUB', false, false, 1.1);
  }

  drawLeader([
    [xToe - slopeW * 0.35 + nx * 18, yToe + slopeH * 0.35 + ny * 18],
    [xToe - slopeW * 0.18, yToe + slopeH * 0.52],
    [xToe - slopeW * 0.08, yToe + slopeH * 0.52]
  ], ['既有護坡'], 16, 'left');
}

// Helper to draw RC Wall Cross-Section with Rebar Cage (used in A-A and C-C)
function drawWallSectionWithRebar(xL, yBot, w, h, cov, layerStruct, layerRebar) {
  addPoly([
    [xL, yBot],
    [xL + w, yBot],
    [xL + w, yBot + h],
    [xL, yBot + h]
  ], true, layerStruct, false, 1.7);

  // Inner stirrup cage
  const x1 = xL + cov;
  const x2 = xL + w - cov;
  const y1 = yBot + cov;
  const y2 = yBot + h - cov;
  addPoly([[x1, y1], [x2, y1], [x2, y2], [x1, y2]], true, layerRebar, false, 1.15);

  // Longitudinal rebar dots on left & right faces
  const nBars = 5;
  for (let i = 0; i < nBars; i++) {
    const yy = y1 + (i / (nBars - 1)) * (y2 - y1);
    addCircle(x1 + 2.5, yy, 2.8, layerRebar, true);
    addCircle(x2 - 2.5, yy, 2.8, layerRebar, true);
    if (i > 0 && i < nBars - 1) {
      addLine(x1, yy, x2, yy, layerRebar, false, 0.75);
    }
  }
}

// VIEW 3: A-A 剖面圖 (Transverse Section Cutting Through Masonry Cells)
function buildSectionAASubView(p, d, targetLayerOverride = null) {
  const sL = targetLayerOverride || 'STRUCT';
  const rL = targetLayerOverride || 'REBAR';
  const stL = targetLayerOverride || 'STONE';

  const x0 = 0;
  const xEnd = d.W_total;
  const yTop = 0;
  const yBot = -p.H_beam;

  if (!targetLayerOverride) {
    drawExistingSlopeInSection(x0, yTop, p);
  }

  // Bottom slab base line & excavation line
  addLine(x0, yBot, xEnd, yBot, sL, false, 1.5);
  addLine(x0, yTop, xEnd, yTop, sL, false, 1.2);

  if (showSlopeContext && !targetLayerOverride) {
    // Excavation line (`開挖線`)
    addPoly([
      [x0 - 45, yTop],
      [x0 - 12, yBot - 6],
      [xEnd + 12, yBot - 6],
      [xEnd + 45, yTop]
    ], false, 'EXCAV', false, 1.0);
    drawRiverbedSymbol(xEnd + 20, xEnd + 145, yTop, '計畫河床線');
  }

  // Draw RC walls and Stone-filled cells across N_col
  let curX = x0;
  for (let c = 0; c < d.N_col; c++) {
    drawWallSectionWithRebar(curX, yBot, p.T_wall, p.H_beam, p.C_rebar, sL, rL);
    curX += p.T_wall;

    if (!targetLayerOverride) {
      drawSectionPackedStones(curX, yBot, curX + p.W_cell, yTop, p.D_embed, p.D_rock, 1200 + c * 150, stL);
    }
    curX += p.W_cell;
  }
  drawWallSectionWithRebar(curX, yBot, p.T_wall, p.H_beam, p.C_rebar, sL, rL);

  if (!targetLayerOverride) {
    // Top Horizontal Dimensions: 100 | 40 | 300 | 40 | 300 | 40
    const yDim = yTop + 42;
    if (showSlopeContext) {
      drawDimH(-p.W_gap_slope, x0, yTop, yTop, yDim, p.W_gap_slope, 17, 8, 8);
    }
    let dx = x0;
    for (let c = 0; c < d.N_col; c++) {
      drawDimH(dx, dx + p.T_wall, yTop, yTop, yDim, p.T_wall, 16, 8, 8);
      dx += p.T_wall;
      drawDimH(dx, dx + p.W_cell, yTop, yTop, yDim, p.W_cell, 17, 8, 8);
      dx += p.W_cell;
    }
    drawDimH(dx, dx + p.T_wall, yTop, yTop, yDim, p.T_wall, 16, 8, 8);

    // Vertical height dimensions on middle wall (`150` and `30`)
    const xMidWall = x0 + p.T_wall + p.W_cell + p.T_wall * 0.5;
    drawDimV(yBot, yTop, xMidWall, xMidWall, xMidWall - 28, p.H_beam, 16, 4, 4);
    drawDimV(yTop - p.D_embed, yTop, xMidWall, xMidWall, xMidWall - 28, p.D_embed, 15, 4, 4);

    // Engineering Callouts matching original A-A Section
    const xCell1 = x0 + p.T_wall + p.W_cell * 0.35;
    const xCell2 = d.N_col >= 2 ? (x0 + 2 * p.T_wall + p.W_cell * 1.25) : (xCell1 + 40);
    const xTopCall = x0 + d.W_total * 0.38;
    const yTopCall = yTop + 175;
    drawLeader([[xCell1, yTop - 8], [xTopCall, yTopCall], [xTopCall + 35, yTopCall]], ['頂部塊石須豎排(嵌入約1/2φ以上)'], 16, 'left');
    drawLeader([[xCell2, yTop - 8], [xTopCall, yTopCall]], '', 16, 'left');

    const xStoneCall = x0 + d.W_total * 0.72;
    const yStoneCall = yTop + 135;
    drawLeader([
      [x0 + p.T_wall + p.W_cell * 0.65, yBot + p.H_beam * 0.55],
      [xStoneCall, yStoneCall],
      [xStoneCall + 35, yStoneCall]
    ], [
      '漿塊石',
      `塊石長徑(${p.D_rock - 20}~${p.D_rock + 20}cm)`,
      '(佔70%以上)－現採'
    ], 16, 'left');

    drawLeader([[xEnd, yBot + p.H_beam * 0.55], [xEnd + 55, yBot + p.H_beam * 0.55]], ['普通模板'], 16, 'left');
    drawLeader([[xEnd - p.T_wall * 0.35, yBot + p.H_beam * 0.25], [xEnd + 45, yBot + 10], [xEnd + 65, yBot + 10]], [`13φ@${p.S_rebar}cm`], 16, 'left');
    drawLeader([[xMidWall + 8, yBot + 15], [xMidWall + 65, yBot - 55], [xMidWall + 90, yBot - 55]], ['210kgf/cm²混凝土'], 16, 'left');
    drawLeader([[x0 + p.T_wall + p.W_cell * 0.5, yBot], [x0 + p.T_wall + p.W_cell * 0.65, yBot - 55], [x0 + p.T_wall + p.W_cell * 0.75, yBot - 55]], ['底部壓實'], 16, 'left');
    if (showSlopeContext) {
      drawLeader([[x0 - 25, yBot + p.H_beam * 0.45], [x0 - 65, yBot + p.H_beam * 0.45]], ['開挖線'], 16, 'right');
    }

    const yTitle = yBot - 115;
    addText((x0 + xEnd) / 2, yTitle, 'A－A 剖面圖', 25, 'TEXT', 'center');
    addLine((x0 + xEnd) / 2 - 95, yTitle - 16, (x0 + xEnd) / 2 + 95, yTitle - 16, 'STRUCT', false, 1.2);
    addLine((x0 + xEnd) / 2 - 95, yTitle - 22, (x0 + xEnd) / 2 + 95, yTitle - 22, 'STRUCT', false, 0.8);
  }
}

// VIEW 4: B-B 剖面圖 (Transverse Section Cutting Along Concrete Beam Wall)
function buildSectionBBSubView(p, d, targetLayerOverride = null) {
  const sL = targetLayerOverride || 'STRUCT';
  const rL = targetLayerOverride || 'REBAR';

  const x0 = 0;
  const xEnd = d.W_total;
  const yTop = 0;
  const yBot = -p.H_beam;

  if (!targetLayerOverride) {
    drawExistingSlopeInSection(x0, yTop, p);
  }

  // Outer RC Wall Rectangle
  addPoly([
    [x0, yBot],
    [xEnd, yBot],
    [xEnd, yTop],
    [x0, yTop]
  ], true, sL, false, 1.8);

  if (showSlopeContext && !targetLayerOverride) {
    addPoly([
      [x0 - 45, yTop],
      [x0 - 12, yBot - 6],
      [xEnd + 12, yBot - 6],
      [xEnd + 45, yTop]
    ], false, 'EXCAV', false, 1.0);
    drawRiverbedSymbol(xEnd + 20, xEnd + 145, yTop, '計畫河床線');
  }

  // Horizontal & Vertical Rebar Mesh inside Wall B-B
  const cov = p.C_rebar;
  const nHoriz = 5;
  for (let i = 0; i < nHoriz; i++) {
    const yy = (yBot + cov) + (i / (nHoriz - 1)) * (p.H_beam - 2 * cov);
    addLine(x0 + cov, yy, xEnd - cov, yy, rL, false, 1.1);
  }

  const stepV = Math.max(18, p.S_rebar);
  for (let xx = x0 + cov; xx <= xEnd - cov; xx += stepV) {
    addLine(xx, yBot + cov, xx, yTop - cov, rL, false, 0.9);
  }

  // Intersecting longitudinal walls dashed lines & rebar dots
  let curX = x0;
  for (let c = 0; c <= d.N_col; c++) {
    addLine(curX, yBot, curX, yTop, sL, true, 1.1);
    addLine(curX + p.T_wall, yBot, curX + p.T_wall, yTop, sL, true, 1.1);
    if (!targetLayerOverride) {
      drawDimH(curX, curX + p.T_wall, yTop, yTop, yTop + 32, p.T_wall, 16, 6, 6);
    }
    if (c < d.N_col) curX += p.T_wall + p.W_cell;
  }

  if (!targetLayerOverride) {
    if (showSlopeContext) {
      drawDimH(-p.W_gap_slope, x0, yTop, yTop, yTop + 68, p.W_gap_slope, 17, 10, 8);
    }
    drawDimH(x0, xEnd, yTop, yTop, yTop + 68, d.W_total, 18, 10, 8);

    drawDimV(yBot, yTop, xEnd, xEnd, xEnd + 42, p.H_beam, 17, 8, 8);
    drawDimV(yTop - p.D_embed, yTop, xEnd, xEnd, xEnd + 42, p.D_embed, 16, 8, 8);

    drawLeader([[x0 + d.W_total * 0.35, yBot], [x0 + d.W_total * 0.42, yBot - 55], [x0 + d.W_total * 0.48, yBot - 55]], ['底部壓實'], 16, 'left');
    drawLeader([[x0 + d.W_total * 0.58, yBot + p.H_beam * 0.3], [x0 + d.W_total * 0.66, yBot - 55], [x0 + d.W_total * 0.72, yBot - 55]], [`13φ@${p.S_rebar}cm`], 16, 'left');

    const yTitle = yBot - 115;
    addText((x0 + xEnd) / 2, yTitle, 'B－B 剖面圖', 25, 'TEXT', 'center');
    addLine((x0 + xEnd) / 2 - 95, yTitle - 16, (x0 + xEnd) / 2 + 95, yTitle - 16, 'STRUCT', false, 1.2);
    addLine((x0 + xEnd) / 2 - 95, yTitle - 22, (x0 + xEnd) / 2 + 95, yTitle - 22, 'STRUCT', false, 0.8);
  }
}

// VIEW 5: C-C 剖面圖 (Longitudinal Section Cutting Through Masonry Cell: 40 + 400 + 40)
function buildSectionCCSubView(p, d, targetLayerOverride = null) {
  const sL = targetLayerOverride || 'STRUCT';
  const rL = targetLayerOverride || 'REBAR';
  const stL = targetLayerOverride || 'STONE';

  const x0 = 0;
  const xEnd = d.L_total;
  const yTop = 0;
  const yBot = -p.H_beam;

  addLine(x0, yBot, xEnd, yBot, sL, false, 1.5);
  addLine(x0, yTop, xEnd, yTop, sL, false, 1.2);

  if (showSlopeContext && !targetLayerOverride) {
    addPoly([
      [x0 - 45, yTop],
      [x0 - 12, yBot - 6],
      [xEnd + 12, yBot - 6],
      [xEnd + 45, yTop]
    ], false, 'EXCAV', false, 1.0);
    drawRiverbedSymbol(xEnd + 20, xEnd + 145, yTop, '計畫河床線');
  }

  let curX = x0;
  for (let r = 0; r < d.N_row; r++) {
    drawWallSectionWithRebar(curX, yBot, p.T_wall, p.H_beam, p.C_rebar, sL, rL);
    curX += p.T_wall;
    if (!targetLayerOverride) {
      drawSectionPackedStones(curX, yBot, curX + p.L_cell, yTop, p.D_embed, p.D_rock, 2100 + r * 170, stL);
    }
    curX += p.L_cell;
  }
  drawWallSectionWithRebar(curX, yBot, p.T_wall, p.H_beam, p.C_rebar, sL, rL);

  if (!targetLayerOverride) {
    const yDim = yTop + 42;
    let dx = x0;
    for (let r = 0; r < d.N_row; r++) {
      drawDimH(dx, dx + p.T_wall, yTop, yTop, yDim, p.T_wall, 16, 8, 8);
      dx += p.T_wall;
      drawDimH(dx, dx + p.L_cell, yTop, yTop, yDim, p.L_cell, 17, 8, 8);
      dx += p.L_cell;
    }
    drawDimH(dx, dx + p.T_wall, yTop, yTop, yDim, p.T_wall, 16, 8, 8);

    drawDimV(yBot, yTop, xEnd, xEnd, xEnd + 42, p.H_beam, 17, 8, 8);
    drawDimV(yTop - p.D_embed, yTop, xEnd, xEnd, xEnd + 42, p.D_embed, 16, 8, 8);

    const xTopCall = x0 + d.L_total * 0.42;
    const yTopCall = yTop + 165;
    drawLeader([[x0 + p.T_wall + p.L_cell * 0.28, yTop - 8], [xTopCall, yTopCall], [xTopCall + 35, yTopCall]], ['頂部塊石須豎排(嵌入約1/2φ以上)'], 16, 'left');

    const xStoneCall = x0 + d.L_total * 0.62;
    const yStoneCall = yTop + 120;
    drawLeader([
      [x0 + p.T_wall + p.L_cell * 0.55, yBot + p.H_beam * 0.55],
      [xStoneCall, yStoneCall],
      [xStoneCall + 35, yStoneCall]
    ], [
      '漿塊石',
      `塊石長徑(${p.D_rock - 20}~${p.D_rock + 20}cm)`,
      '(佔70%以上)－現採'
    ], 16, 'left');

    if (showSlopeContext) {
      drawLeader([[x0 - 25, yBot + p.H_beam * 0.45], [x0 - 65, yBot + p.H_beam * 0.45]], ['開挖線'], 16, 'right');
    }
    drawLeader([[xEnd, yBot + p.H_beam * 0.45], [xEnd + 65, yBot + p.H_beam * 0.45]], ['普通模板'], 16, 'left');
    drawLeader([[xEnd - p.T_wall * 0.4, yBot + p.H_beam * 0.22], [xEnd + 55, yBot + 5], [xEnd + 75, yBot + 5]], [`13φ@${p.S_rebar}cm`], 16, 'left');
    drawLeader([[x0 + p.T_wall * 0.6, yBot + 15], [x0 + 65, yBot - 55], [x0 + 90, yBot - 55]], ['210kgf/cm²混凝土'], 16, 'left');
    drawLeader([[x0 + d.L_total * 0.55, yBot], [x0 + d.L_total * 0.65, yBot - 55], [x0 + d.L_total * 0.72, yBot - 55]], ['底部壓實'], 16, 'left');

    const yTitle = yBot - 115;
    addText((x0 + xEnd) / 2, yTitle, 'C－C 剖面圖', 25, 'TEXT', 'center');
    addLine((x0 + xEnd) / 2 - 95, yTitle - 16, (x0 + xEnd) / 2 + 95, yTitle - 16, 'STRUCT', false, 1.2);
    addLine((x0 + xEnd) / 2 - 95, yTitle - 22, (x0 + xEnd) / 2 + 95, yTitle - 22, 'STRUCT', false, 0.8);
  }
}

// VIEW 6: D-D 剖面圖 (Longitudinal Section Cutting Along Concrete Wall: 40 + 400 + 40)
function buildSectionDDSubView(p, d, targetLayerOverride = null) {
  const sL = targetLayerOverride || 'STRUCT';
  const rL = targetLayerOverride || 'REBAR';

  const x0 = 0;
  const xEnd = d.L_total;
  const yTop = 0;
  const yBot = -p.H_beam;

  addPoly([
    [x0, yBot],
    [xEnd, yBot],
    [xEnd, yTop],
    [x0, yTop]
  ], true, sL, false, 1.8);

  if (showSlopeContext && !targetLayerOverride) {
    addPoly([
      [x0 - 45, yTop],
      [x0 - 12, yBot - 6],
      [xEnd + 12, yBot - 6],
      [xEnd + 45, yTop]
    ], false, 'EXCAV', false, 1.0);
    drawRiverbedSymbol(xEnd + 20, xEnd + 145, yTop, '計畫河床線');
  }

  const cov = p.C_rebar;
  const nHoriz = 5;
  for (let i = 0; i < nHoriz; i++) {
    const yy = (yBot + cov) + (i / (nHoriz - 1)) * (p.H_beam - 2 * cov);
    addLine(x0 + cov, yy, xEnd - cov, yy, rL, false, 1.1);
  }

  const stepV = Math.max(18, p.S_rebar);
  for (let xx = x0 + cov; xx <= xEnd - cov; xx += stepV) {
    addLine(xx, yBot + cov, xx, yTop - cov, rL, false, 0.9);
  }

  let curX = x0;
  for (let r = 0; r <= d.N_row; r++) {
    addLine(curX, yBot, curX, yTop, sL, true, 1.1);
    addLine(curX + p.T_wall, yBot, curX + p.T_wall, yTop, sL, true, 1.1);
    if (r < d.N_row) curX += p.T_wall + p.L_cell;
  }

  if (!targetLayerOverride) {
    const yDim = yTop + 42;
    let dx = x0;
    for (let r = 0; r < d.N_row; r++) {
      drawDimH(dx, dx + p.T_wall, yTop, yTop, yDim, p.T_wall, 16, 8, 8);
      dx += p.T_wall;
      drawDimH(dx, dx + p.L_cell, yTop, yTop, yDim, p.L_cell, 17, 8, 8);
      dx += p.L_cell;
    }
    drawDimH(dx, dx + p.T_wall, yTop, yTop, yDim, p.T_wall, 16, 8, 8);

    drawDimV(yBot, yTop, xEnd, xEnd, xEnd + 42, p.H_beam, 17, 8, 8);
    drawDimV(yTop - p.D_embed, yTop, xEnd, xEnd, xEnd + 42, p.D_embed, 16, 8, 8);

    drawLeader([[x0 + d.L_total * 0.35, yBot], [x0 + d.L_total * 0.45, yBot - 55], [x0 + d.L_total * 0.52, yBot - 55]], ['底部壓實'], 16, 'left');
    drawLeader([[x0 + d.L_total * 0.62, yBot + p.H_beam * 0.3], [x0 + d.L_total * 0.75, yBot - 55], [x0 + d.L_total * 0.82, yBot - 55]], [`13φ@${p.S_rebar}cm`], 16, 'left');

    const yTitle = yBot - 115;
    addText((x0 + xEnd) / 2, yTitle, 'D－D 剖面圖', 25, 'TEXT', 'center');
    addLine((x0 + xEnd) / 2 - 95, yTitle - 16, (x0 + xEnd) / 2 + 95, yTitle - 16, 'STRUCT', false, 1.2);
    addLine((x0 + xEnd) / 2 - 95, yTitle - 22, (x0 + xEnd) / 2 + 95, yTitle - 22, 'STRUCT', false, 0.8);
  }
}

// VIEW 7: 既有護坡基礎補強數量表與工程說明 (Quantity Table & Engineering Notes)
function buildQuantityTableSubView(p, d) {
  const xTbl = 0;
  const yTblTop = 0;
  const rowH = 54;
  const col1W = 220, col2W = 95, col3W = 210;
  const tblW = col1W + col2W + col3W;

  addText(xTbl, yTblTop + 32, `既有護坡基礎補強(${d.m_L_total.toFixed(1)}m*${d.m_W_total.toFixed(1)}m/座)`, 24, 'TEXT', 'left');

  const rows = [
    ['混凝土', 'm³', d.V_conc.toFixed(2)],
    ['普通模板', 'm²', d.A_form.toFixed(2)],
    ['鋼筋(估算)', 'kg', d.W_rebar.toFixed(2)],
    ['漿塊石', 'm³', d.V_stone.toFixed(2)]
  ];

  for (let r = 0; r <= rows.length; r++) {
    const yR = yTblTop - r * rowH;
    addLine(xTbl, yR, xTbl + tblW, yR, 'TABLE', false, 1.3);
  }
  addLine(xTbl, yTblTop, xTbl, yTblTop - rows.length * rowH, 'TABLE', false, 1.3);
  addLine(xTbl + col1W, yTblTop, xTbl + col1W, yTblTop - rows.length * rowH, 'TABLE', false, 1.3);
  addLine(xTbl + col1W + col2W, yTblTop, xTbl + col1W + col2W, yTblTop - rows.length * rowH, 'TABLE', false, 1.3);
  addLine(xTbl + tblW, yTblTop, xTbl + tblW, yTblTop - rows.length * rowH, 'TABLE', false, 1.3);

  rows.forEach((row, idx) => {
    const yText = yTblTop - (idx + 0.62) * rowH;
    addText(xTbl + 16, yText, row[0], 20, 'TEXT', 'left');
    addText(xTbl + col1W + col2W / 2, yText, row[1], 20, 'TEXT', 'center');
    addText(xTbl + tblW - 18, yText, row[2], 21, 'DIM', 'right');
  });

  const yNotesStart = yTblTop - rows.length * rowH - 45;
  addText(xTbl, yNotesStart, '工程說明：', 18, 'TEXT', 'left');
  addText(xTbl, yNotesStart - 30, '1. 既有護坡基礎補強為210kgf/cm²，主鋼筋直徑為16mm，副鋼筋直徑為13mm', 16.5, 'TEXT', 'left');
  addText(xTbl, yNotesStart - 58, `2. 鋼筋保護層至少${p.C_rebar}公分`, 16.5, 'TEXT', 'left');
  addText(xTbl, yNotesStart - 86, `3. 既有護坡基礎補強每座間距約${(p.S_unit / 100).toFixed(1)}m(可依現地調整)`, 16.5, 'TEXT', 'left');
  addText(xTbl, yNotesStart - 114, '4. 既有護坡基礎補強臨既有護坡之開挖面若遇大石可依現地調整位置，經監造單同意即可施作', 16.5, 'TEXT', 'left');
  addText(xTbl, yNotesStart - 142, `5. 鋼筋：原圖無鋼筋表，以 ${p.rbk} kg/m³ 估算（含損耗）`, 16.5, 'TEXT', 'left');
}

// ============================================================================
// 6. Master Scene Assembly Using Dynamic Bounding-Box Non-Overlapping Engine
// ============================================================================
function buildFullStandardSheet(p, d, targetLayerOverride = null) {
  const vPlan = captureSubView(() => buildPlanSubView(p, d, targetLayerOverride));
  const vDetail = captureSubView(() => buildOpeningDetailSubView(p, d, targetLayerOverride));
  const vAA = captureSubView(() => buildSectionAASubView(p, d, targetLayerOverride));
  const vBB = captureSubView(() => buildSectionBBSubView(p, d, targetLayerOverride));
  const vCC = captureSubView(() => buildSectionCCSubView(p, d, targetLayerOverride));
  const vDD = captureSubView(() => buildSectionDDSubView(p, d, targetLayerOverride));

  if (currentViewMode === 'PLAN') {
    const boxPlan = placeSubView(vPlan, 0, 0);
    const gapX = Math.max(220, boxPlan.width * 0.16);
    placeSubView(vDetail, boxPlan.maxX + gapX - vDetail.bbox.minX, boxPlan.maxY - vDetail.bbox.maxY - 80);
    return;
  }

  if (currentViewMode === 'SECTIONS') {
    const boxAA = placeSubView(vAA, 0, 0);
    const gapY = Math.max(180, boxAA.height * 0.35);
    const dyBB = (boxAA.minY - gapY) - vBB.bbox.maxY;
    const boxBB = placeSubView(vBB, 0, dyBB);

    const dyBottomRow = (boxBB.minY - gapY) - Math.max(vCC.bbox.maxY, vDD.bbox.maxY);
    const boxCC = placeSubView(vCC, 0 - vCC.bbox.minX, dyBottomRow);
    const gapX = Math.max(220, boxCC.width * 0.22);
    placeSubView(vDD, boxCC.maxX + gapX - vDD.bbox.minX, dyBottomRow);
    return;
  }

  // 'ALL' Mode: Exact Standard Drawing Layout with Dynamic Bounding-Box Collision Avoidance
  // 1. Top-Left: Plan View
  const boxPlan = placeSubView(vPlan, 0, 0);

  // 2. Top-Center: Opening Rebar Detail View (placed to the right of Plan View)
  const gapPlanDetail = Math.max(180, boxPlan.width * 0.12);
  const dxDetail = (boxPlan.maxX + gapPlanDetail) - vDetail.bbox.minX;
  const dyDetail = (boxPlan.maxY - 60) - vDetail.bbox.maxY;
  const boxDetail = placeSubView(vDetail, dxDetail, dyDetail);

  // 3. Top-Right: Section A-A (placed to the right of Opening Detail View)
  const gapDetailAA = Math.max(160, boxDetail.width * 0.18);
  const dxAA = (boxDetail.maxX + gapDetailAA) - vAA.bbox.minX;
  const dyAA = boxPlan.maxY - vAA.bbox.maxY;
  const boxAA = placeSubView(vAA, dxAA, dyAA);

  // 4. Middle-Right: Section B-B (aligned vertically under Section A-A's X origin, below A-A & Detail)
  const gapAABB = Math.max(160, boxAA.height * 0.28);
  const dxBB = dxAA;
  const dyBB = (boxAA.minY - gapAABB) - vBB.bbox.maxY;
  const boxBB = placeSubView(vBB, dxBB, dyBB);

  // 5. Bottom Row Y Baseline (strictly below BOTH Plan View and Section B-B!)
  const minUpperY = Math.min(boxPlan.minY, boxBB.minY, boxDetail.minY);
  const gapBottomRow = 180;
  const targetBottomMaxY = minUpperY - gapBottomRow;

  // 6. Bottom-Left: Quantity Table & Engineering Notes
  let boxTable = { maxX: boxPlan.minX + 600 };
  if (!targetLayerOverride) {
    const vTable = captureSubView(() => buildQuantityTableSubView(p, d));
    const dxTbl = boxPlan.minX - vTable.bbox.minX;
    const dyTbl = targetBottomMaxY - vTable.bbox.maxY;
    boxTable = placeSubView(vTable, dxTbl, dyTbl);
  }

  // 7. Bottom-Center: Section C-C (placed to the right of Quantity Table)
  const gapTblCC = Math.max(190, vCC.bbox.width * 0.22);
  const dxCC = (boxTable.maxX + gapTblCC) - vCC.bbox.minX;
  const dyCC = targetBottomMaxY - vCC.bbox.maxY;
  const boxCC = placeSubView(vCC, dxCC, dyCC);

  // 8. Bottom-Right: Section D-D (placed to the right of Section C-C)
  const gapCCDD = Math.max(200, vCC.bbox.width * 0.25);
  const dxDD = Math.max((boxCC.maxX + gapCCDD) - vDD.bbox.minX, dxAA);
  const dyDD = targetBottomMaxY - vDD.bbox.maxY;
  placeSubView(vDD, dxDD, dyDD);
}

function rebuildScene() {
  scenePrimitives = [];
  activeBuffer = scenePrimitives;

  if (showRefOverlay) {
    const dDef = computeDerivedAndQuantities(DEFAULT_PARAMS);
    buildFullStandardSheet(DEFAULT_PARAMS, dDef, 'REF');
  }

  const d = computeDerivedAndQuantities(params);
  buildFullStandardSheet(params, d, null);

  sceneBounds = getGroupBBox(scenePrimitives);
}

// ============================================================================
// 7. HTML5 2D Canvas Renderer & Viewport Controller
// ============================================================================
const canvas = document.getElementById('cadCanvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
  const container = document.getElementById('canvasContainer');
  const dpr = window.devicePixelRatio || 1;
  canvas.width = container.clientWidth * dpr;
  canvas.height = container.clientHeight * dpr;
  renderCAD();
}

function worldToScreen(wx, wy) {
  const dpr = window.devicePixelRatio || 1;
  const sx = (wx - cam.x) * cam.scale * dpr + canvas.width * 0.5;
  const sy = canvas.height * 0.5 - (wy - cam.y) * cam.scale * dpr;
  return [sx, sy];
}

function screenToWorld(sx, sy) {
  const dpr = window.devicePixelRatio || 1;
  const wx = (sx * dpr - canvas.width * 0.5) / (cam.scale * dpr) + cam.x;
  const wy = (canvas.height * 0.5 - sy * dpr) / (cam.scale * dpr) + cam.y;
  return [wx, wy];
}

function zoomToFit() {
  rebuildScene();
  const container = document.getElementById('canvasContainer');
  const cw = container.clientWidth || 900;
  const ch = container.clientHeight || 650;

  const bw = Math.max(400, sceneBounds.maxX - sceneBounds.minX);
  const bh = Math.max(400, sceneBounds.maxY - sceneBounds.minY);

  cam.x = (sceneBounds.minX + sceneBounds.maxX) * 0.5;
  cam.y = (sceneBounds.minY + sceneBounds.maxY) * 0.5;
  cam.scale = Math.min((cw * 0.90) / bw, (ch * 0.88) / bh);

  renderCAD();
}

function renderCAD() {
  rebuildScene();
  const dpr = window.devicePixelRatio || 1;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Subtle CAD Grid
  ctx.save();
  ctx.strokeStyle = '#161b22';
  ctx.lineWidth = 1;
  const gridStepPx = 60 * dpr;
  for (let x = 0; x < canvas.width; x += gridStepPx) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
  }
  for (let y = 0; y < canvas.height; y += gridStepPx) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
  }
  ctx.restore();

  scenePrimitives.forEach(prim => {
    const color = LAYER_COLORS[prim.layer] || '#ffffff';
    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;

    if (prim.layer === 'REF') {
      ctx.setLineDash([6 * dpr, 4 * dpr]);
      ctx.globalAlpha = 0.65;
    } else if (prim.dashed) {
      ctx.setLineDash([6 * dpr, 4 * dpr]);
    }

    if (prim.type === 'LINE') {
      const [x1, y1] = worldToScreen(prim.x1, prim.y1);
      const [x2, y2] = worldToScreen(prim.x2, prim.y2);
      ctx.lineWidth = (prim.lineWidth || 1.2) * dpr;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    } else if (prim.type === 'POLY') {
      ctx.lineWidth = (prim.lineWidth || 1.2) * dpr;
      ctx.beginPath();
      prim.pts.forEach((pt, idx) => {
        const [sx, sy] = worldToScreen(pt[0], pt[1]);
        if (idx === 0) ctx.moveTo(sx, sy);
        else ctx.lineTo(sx, sy);
      });
      if (prim.closed) ctx.closePath();
      if (prim.fill) {
        ctx.fillStyle = prim.fill;
        ctx.fill();
      }
      ctx.stroke();
    } else if (prim.type === 'CIRCLE') {
      const [cx, cy] = worldToScreen(prim.cx, prim.cy);
      const sr = Math.max(1.8 * dpr, prim.r * cam.scale * dpr);
      ctx.lineWidth = (prim.lineWidth || 1.2) * dpr;
      ctx.beginPath();
      ctx.arc(cx, cy, sr, 0, Math.PI * 2);
      if (prim.filled) ctx.fill();
      else ctx.stroke();
    } else if (prim.type === 'TEXT') {
      const [tx, ty] = worldToScreen(prim.x, prim.y);
      const fontPx = Math.max(8.5 * dpr, prim.size * cam.scale * dpr);
      if (fontPx > 4.5) {
        ctx.font = `500 ${fontPx.toFixed(1)}px "JetBrains Mono", "Noto Sans TC", sans-serif`;
        ctx.textAlign = prim.align || 'center';
        ctx.textBaseline = 'middle';
        if (prim.angleDeg) {
          ctx.translate(tx, ty);
          ctx.rotate((-prim.angleDeg * Math.PI) / 180);
          ctx.fillText(prim.text, 0, 0);
        } else {
          ctx.fillText(prim.text, tx, ty);
        }
      }
    }
    ctx.restore();
  });

  document.getElementById('hudZoom').textContent = `Zoom: ${Math.round(cam.scale * 350)}%`;
}

// Mouse Pan & Wheel Zoom
canvas.addEventListener('mousedown', e => {
  if (e.button !== 0) return;
  cam.isDragging = true;
  cam.dragStartX = e.clientX;
  cam.dragStartY = e.clientY;
  cam.camStartX = cam.x;
  cam.camStartY = cam.y;
});

window.addEventListener('mousemove', e => {
  const rect = canvas.getBoundingClientRect();
  const [wx, wy] = screenToWorld(e.clientX - rect.left, e.clientY - rect.top);
  document.getElementById('hudCursor').textContent = `X: ${Math.round(wx)}, Y: ${Math.round(wy)} cm`;

  if (!cam.isDragging) return;
  const dx = e.clientX - cam.dragStartX;
  const dy = e.clientY - cam.dragStartY;
  cam.x = cam.camStartX - dx / cam.scale;
  cam.y = cam.camStartY + dy / cam.scale;
  renderCAD();
});

window.addEventListener('mouseup', () => {
  cam.isDragging = false;
});

canvas.addEventListener('wheel', e => {
  e.preventDefault();
  const rect = canvas.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  const my = e.clientY - rect.top;
  const [wxBefore, wyBefore] = screenToWorld(mx, my);

  const zoomFactor = e.deltaY < 0 ? 1.14 : 0.88;
  cam.scale = Math.max(0.02, Math.min(4.0, cam.scale * zoomFactor));

  const [wxAfter, wyAfter] = screenToWorld(mx, my);
  cam.x += (wxBefore - wxAfter);
  cam.y += (wyBefore - wyAfter);
  renderCAD();
}, { passive: false });

canvas.addEventListener('dblclick', () => {
  zoomToFit();
});

window.addEventListener('resize', resizeCanvas);

// ============================================================================
// 8. Sidebar UI & Live Formula Synchronization
// ============================================================================
function updateSidebarUI() {
  const d = computeDerivedAndQuantities(params);

  document.getElementById('hdrSizeBadge').textContent = `${d.m_L_total.toFixed(1)}m×${d.m_W_total.toFixed(1)}m / 座`;
  document.getElementById('kpiConc').textContent = d.V_conc.toFixed(2);
  document.getElementById('kpiForm').textContent = d.A_form.toFixed(2);
  document.getElementById('kpiRebar').textContent = d.W_rebar.toFixed(2);
  document.getElementById('kpiStone').textContent = d.V_stone.toFixed(2);

  document.getElementById('drv_W_total').textContent = `${d.W_total} cm (${d.m_W_total.toFixed(1)}m)`;
  document.getElementById('drv_L_total').textContent = `${d.L_total} cm (${d.m_L_total.toFixed(1)}m)`;
  document.getElementById('drv_A_cell').textContent = `${d.A_cell_net.toFixed(2)} m²`;
  document.getElementById('drv_Cells_Depth').textContent = `${d.N_cells} 格 / ${params.H_beam + params.D_embed} cm`;

  const fBox = document.getElementById('formulaContent');
  fBox.innerHTML = `
    <div class="p-1.5 rounded bg-[#0d1117] border border-[#30363d]/80">
      <span class="text-[#00e5ff] font-bold">1. 210kgf/cm² 混凝土 (${d.V_conc.toFixed(2)} m³)：</span>
      <span class="text-[#e6edf3]">${d.f_conc_str}</span>
    </div>
    <div class="p-1.5 rounded bg-[#0d1117] border border-[#30363d]/80">
      <span class="text-[#ffb300] font-bold">2. 普通模板 (${d.A_form.toFixed(2)} m²)：</span>
      <span class="text-[#e6edf3]">${d.f_form_str}</span>
    </div>
    <div class="p-1.5 rounded bg-[#0d1117] border border-[#30363d]/80">
      <span class="text-[#ff7b72] font-bold">3. 鋼筋(含損耗) (${d.W_rebar.toFixed(2)} kg)：</span>
      <span class="text-[#e6edf3]">${d.f_rebar_str}</span>
    </div>
    <div class="p-1.5 rounded bg-[#0d1117] border border-[#30363d]/80">
      <span class="text-[#3fb950] font-bold">4. 漿塊石 (${d.V_stone.toFixed(2)} m³)：</span>
      <span class="text-[#e6edf3]">${d.f_stone_str}</span>
    </div>
  `;
}

function stepParam(key, delta, minVal, maxVal) {
  const cur = Number(params[key]) || minVal;
  const next = Math.max(minVal, Math.min(maxVal, cur + delta));
  document.getElementById('inp_' + key).value = next;
  onParamChange(key, next);
}

// Golden Rule 4: Editing parameters ONLY updates UI & renders CAD without resetting camera zoom!
function onParamChange(key, rawVal) {
  const val = parseFloat(rawVal);
  if (isNaN(val)) return;
  params[key] = val;
  updateSidebarUI();
  renderCAD();
}

function switchViewMode(mode) {
  currentViewMode = mode;
  document.getElementById('btnViewAll').classList.toggle('active', mode === 'ALL');
  document.getElementById('btnViewPlan').classList.toggle('active', mode === 'PLAN');
  document.getElementById('btnViewSec').classList.toggle('active', mode === 'SECTIONS');

  const titles = {
    ALL: 'ALL：既有護坡基礎補強標準圖全圖總覽 (平面 / 詳圖 / A-A~D-D 剖面 / 數量表)',
    PLAN: 'PLAN：既有護坡基礎補強平面圖與開口補強筋詳圖',
    SECTIONS: 'SECTIONS：A-A、B-B、C-C、D-D 四大剖面與配筋詳圖'
  };
  document.getElementById('hudViewTitle').textContent = titles[mode];
  zoomToFit();
}

function toggleSlopeContext(checked) {
  showSlopeContext = checked;
  renderCAD();
}

function toggleRefOverlay(checked) {
  showRefOverlay = checked;
  renderCAD();
}

function applyPreset(presetKey) {
  const pSet = PRESETS[presetKey] || PRESETS.default;
  params = { ...pSet };
  Object.keys(params).forEach(k => {
    const el = document.getElementById('inp_' + k);
    if (el) el.value = params[k];
  });
  updateSidebarUI();
  zoomToFit();
  showToast(`已套用預設尺寸組態：${document.getElementById('presetSelect').selectedOptions[0].text}`);
}

function toggleFormulaDrawer() {
  const drawer = document.getElementById('formulaDrawer');
  const btn = document.getElementById('btnToggleDrawer');
  drawerOpen = !drawerOpen;
  if (drawerOpen) {
    drawer.style.height = '150px';
    btn.textContent = '▼ 收合明細';
  } else {
    drawer.style.height = '32px';
    btn.textContent = '▲ 展開算式明細';
  }
  setTimeout(resizeCanvas, 210);
}

function showToast(msg) {
  const box = document.getElementById('toastBox');
  box.textContent = msg;
  box.classList.add('show');
  setTimeout(() => box.classList.remove('show'), 2800);
}

// ============================================================================
// 9. One-Click Direct DXF & CSV Exporters
// ============================================================================
function exportDXF() {
  rebuildScene();
  const d = computeDerivedAndQuantities(params);
  const dxfLines = [];
  const push = (code, val) => {
    dxfLines.push(String(code));
    dxfLines.push(String(val));
  };

  push(0, 'SECTION');
  push(2, 'HEADER');
  push(9, '$ACADVER');
  push(1, 'AC1009');
  push(0, 'ENDSEC');

  push(0, 'SECTION');
  push(2, 'TABLES');
  push(0, 'TABLE');
  push(2, 'STYLE');
  push(70, 1);
  push(0, 'STYLE');
  push(2, 'STANDARD');
  push(70, 0);
  push(40, 0.0);
  push(41, 1.0);
  push(50, 0.0);
  push(71, 0);
  push(42, 20.0);
  push(3, 'kaiu.ttf');
  push(4, '');
  push(0, 'ENDTAB');
  push(0, 'ENDSEC');

  push(0, 'SECTION');
  push(2, 'ENTITIES');

  const layerColorACI = {
    STRUCT: 7,
    STRUCT_SUB: 8,
    STONE: 2,
    REBAR: 1,
    EXCAV: 3,
    DIM: 4,
    TEXT: 7,
    CENTER: 6,
    TABLE: 7,
    REF: 6
  };

  const emitLine = (x1, y1, x2, y2, layer) => {
    push(0, 'LINE');
    push(8, layer);
    push(62, layerColorACI[layer] || 7);
    push(10, x1.toFixed(2));
    push(20, y1.toFixed(2));
    push(30, '0.0');
    push(11, x2.toFixed(2));
    push(21, y2.toFixed(2));
    push(31, '0.0');
  };

  scenePrimitives.forEach(prim => {
    const lyr = prim.layer || 'STRUCT';
    if (prim.type === 'LINE') {
      emitLine(prim.x1, prim.y1, prim.x2, prim.y2, lyr);
    } else if (prim.type === 'POLY') {
      for (let i = 0; i < prim.pts.length - 1; i++) {
        emitLine(prim.pts[i][0], prim.pts[i][1], prim.pts[i + 1][0], prim.pts[i + 1][1], lyr);
      }
      if (prim.closed && prim.pts.length > 2) {
        const last = prim.pts[prim.pts.length - 1];
        emitLine(last[0], last[1], prim.pts[0][0], prim.pts[0][1], lyr);
      }
    } else if (prim.type === 'CIRCLE') {
      push(0, 'CIRCLE');
      push(8, lyr);
      push(62, layerColorACI[lyr] || 1);
      push(10, prim.cx.toFixed(2));
      push(20, prim.cy.toFixed(2));
      push(30, '0.0');
      push(40, prim.r.toFixed(2));
    } else if (prim.type === 'TEXT') {
      push(0, 'TEXT');
      push(8, lyr);
      push(62, layerColorACI[lyr] || 7);
      push(10, prim.x.toFixed(2));
      push(20, prim.y.toFixed(2));
      push(30, '0.0');
      push(40, (prim.size * 0.75).toFixed(2));
      push(1, prim.text);
      push(50, (prim.angleDeg || 0).toFixed(1));
      push(7, 'STANDARD');
    }
  });

  push(0, 'ENDSEC');
  push(0, 'EOF');

  const dxfContent = dxfLines.join('\r\n');
  const blob = new Blob([dxfContent], { type: 'application/dxf;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `既有護坡基礎補強標準圖_${d.m_L_total.toFixed(1)}mx${d.m_W_total.toFixed(1)}m.dxf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast('✅ 已直接匯出 AutoCAD 標準圖檔 (.DXF)');
}

function exportCSV() {
  const d = computeDerivedAndQuantities(params);
  const rows = [
    [`既有護坡基礎補強 (${d.m_L_total.toFixed(1)}m*${d.m_W_total.toFixed(1)}m/座) 工程數量計算書`],
    ['單座總長(m)', d.m_L_total.toFixed(2), '單座總寬(m)', d.m_W_total.toFixed(2), '分格配置', `${d.N_row}排 × ${d.N_col}列 (${d.N_cells}格)`],
    [],
    ['項次', '工項名稱', '單位', '單座數量', '數量計算式明細'],
    ['1', '混凝土 (210kgf/cm2)', 'm3', d.V_conc.toFixed(2), d.f_conc_str],
    ['2', '普通模板', 'm2', d.A_form.toFixed(2), d.f_form_str],
    ['3', '鋼筋(含損耗)', 'kg', d.W_rebar.toFixed(2), d.f_rebar_str],
    ['4', '漿塊石 (塊石長徑40~80cm)', 'm3', d.V_stone.toFixed(2), d.f_stone_str],
    [],
    ['主要設計參數名稱', '數值', '單位', '主要設計參數名稱', '數值', '單位'],
    ['橫向分格數 (N_col)', d.N_col, '格', '縱向分格數 (N_row)', d.N_row, '格'],
    ['單格橫向淨寬 (W_cell)', params.W_cell, 'cm', '單格縱向淨長 (L_cell)', params.L_cell, 'cm'],
    ['RC格樑牆厚 (T_wall)', params.T_wall, 'cm', '內角隅斜角 (L_chamfer)', params.L_chamfer, 'cm'],
    ['格樑深度 (H_beam)', params.H_beam, 'cm', '頂部塊石嵌槽深 (D_embed)', params.D_embed, 'cm'],
    ['鋼筋間距 (S_rebar)', params.S_rebar, 'cm', '鋼筋保護層 (C_rebar)', params.C_rebar, 'cm']
  ];

  const csvContent = '\uFEFF' + rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `既有護坡基礎補強數量表_${d.m_L_total.toFixed(1)}mx${d.m_W_total.toFixed(1)}m.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast('📊 已直接匯出工程數量計算表 (.CSV)');
}

window.onload = function () {
  updateSidebarUI();
  resizeCanvas();
  zoomToFit();
};

  ;return { draw(P) { params = P; showRefOverlay = false; showSlopeContext = true; rebuildScene(); return scenePrimitives; }, comp: P => computeDerivedAndQuantities(P), LC: LAYER_COLORS, DP: DEFAULT_PARAMS };
  })();
  let RR = null;
  const g = k => { const v = RR && RR[k] !== undefined && RR[k] !== null && RR[k] !== '' ? RR[k] : DEF[k]; return v; }, n = k => { const v = parseFloat(g(k)); return Number.isFinite(v) ? v : parseFloat(DEF[k]); };
  function getParams() { const P = Object.assign({}, __H.DP); PR.forEach(q => { P[q.k.slice(2)] = n(q.k); }); P.N_col = Math.max(1, Math.round(P.N_col)); P.N_row = Math.max(1, Math.round(P.N_row)); return P; }
  function toO(prims, LC) {
    const O = [], col = l => LC[l] || '#ffffff', dsh = b => (b ? [14, 9] : []);
    prims.forEach(o => {
      if (o.type === 'LINE') O.push({ k: 'L', p: [[o.x1, o.y1], [o.x2, o.y2]], c: col(o.layer), w: o.lineWidth || 1.4, d: dsh(o.dashed), ly: o.layer });
      else if (o.type === 'POLY') O.push({ k: 'P', p: o.pts.map(q => [q[0], q[1]]), c: col(o.layer), w: o.lineWidth || 1.4, f: o.fill || null, cl: !!o.closed, d: dsh(o.dashed), ly: o.layer });
      else if (o.type === 'CIRCLE') O.push({ k: 'C', x: o.cx, y: o.cy, r: o.r, c: col(o.layer), f: o.filled ? col(o.layer) : null, w: 1, ly: o.layer });
      else if (o.type === 'TEXT') O.push({ k: 'T', x: o.x, y: o.y, s: String(o.text), h: o.size, c: col(o.layer), al: o.align || 'center', bl: 'middle', rot: (o.angleDeg || 0) * Math.PI / 180, ly: '文字' });
    });
    return O;
  }
  return {
    DEF, PR, GT, title: '既有護坡基礎補強標準圖',
    getParams: R => { RR = R || {}; try { return getParams(); } finally { RR = null; } },
    run(R, opt) {
      RR = R || {};
      try {
        const P = getParams(), d = __H.comp(P), f = v => (+v).toFixed(2);
        const rows = [
          { no: '1', name: '210kgf/cm²混凝土', unit: 'm³', qty: +d.V_conc.toFixed(2), formula: d.f_conc_str, note: '依圖面幾何（扣角隅）' },
          { no: '2', name: '普通模板', unit: 'm²', qty: +d.A_form.toFixed(2), formula: d.f_form_str, note: '內模依角隅斜邊實長' },
          { no: '3', name: '鋼筋（含損耗，估算）', unit: 'kg', qty: +d.W_rebar.toFixed(2), formula: d.f_rebar_str, note: '原圖無鋼筋表，以 kg/m³ 估算' },
          { no: '4', name: '漿砌塊石', unit: 'm³', qty: +d.V_stone.toFixed(2), formula: d.f_stone_str, note: +P.K_embed ? '格室內，深＝格樑深＋嵌槽深' : '格室內，深＝格樑深' }];
        Object.assign(P, { W_total: d.W_total, L_total: d.L_total, N_cells: d.N_cells, __d: d });
        const O = opt && opt.draw ? toO(__H.draw(Object.assign({}, P)), __H.LC) : [];
        return { P, rows, checks: [{ ok: p2ok(P), text: `每座 ${f(d.m_L_total)} m（順水流）× ${f(d.m_W_total)} m（垂直水流），${d.N_row}×${d.N_col} 格` }], O };
      } finally { RR = null; }
    }
  };
  function p2ok(P) { return P.L_chamfer * 2 < Math.min(P.W_cell, P.L_cell); }

})();
