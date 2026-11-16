  const prims = m => { const E = __H.scene(Object.assign({}, __H.D0, m.p, { showRefOverlay: false })).map(e => { const o = Object.assign({}, e); if (o.type === 'line') { o.y1 = -o.y1; o.y2 = -o.y2; } else if (o.type === 'poly') o.pts = o.pts.map(q => [q[0], -q[1]]); else if (o.type === 'circle') o.cy = -o.cy; else if (o.type === 'text') { o.y = -o.y; o.rotation = -(o.rot || 0); o.rot = 0; } return o; });
    return G87.O(E, __H.LC, ['REF_OVERLAY']); };
  return { model: R => MODEL(Object.assign({}, R || {})), prims, PR, GT, D0: __H.D0 };
