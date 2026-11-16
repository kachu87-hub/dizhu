  const prims = P => { const E = __H.draw(P).map(e => { const o = Object.assign({}, e); if (o.type === 'LINE') { o.y1 = -o.y1; o.y2 = -o.y2; } else if (o.type === 'CIRCLE') o.cy = -o.cy; else if (o.type === 'TEXT') { o.y = -o.y; o.size = o.height; } return o; }); return G87.O(E, __H.LC, ['REF']); };
  return { model: P => MODEL(P), prims, PR, GT, D0: __H.D0 };
