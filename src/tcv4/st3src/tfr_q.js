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
