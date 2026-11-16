  /* 標準圖：原工具繪圖＋本段數量表（OV.rows＝本系統依長度計算之數量） */
  function run(R, OV) {
    const O = G87.O(__H.draw(R || {}), __H.LC), rows = OV && OV.rows;
    if (rows && rows.length) { const b = G87.bb(O); O.push(...G87.tbl(rows, b.x0, b.y0 - 40, OV.title || '本段數量表（本系統依圖面幾何×長度計算）', Math.max(8, (b.x1 - b.x0) / 110))); }
    return O;
  }
  return { run, DEF: __H.D0 };
