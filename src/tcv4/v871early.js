/* v8.7.1：繪製中平移（v871mod.js）的滑鼠按下攔截。放在所有模組最前面註冊，才能先於鎖點、長度吸附等攔截 */
window.addEventListener('mousedown', e => {
  if (!state.v871Pan || e.button !== 0 || state.viewMode !== '2D' || (e.target !== cadCanvas && !(e.target && e.target.id === 'axisOverlay'))) return;
  e.preventDefault(); e.stopImmediatePropagation();
  state.v871Drag = { x: e.clientX, y: e.clientY }; cadCanvas.style.cursor = 'grabbing';
}, true);
window.addEventListener('mousemove', e => {
  const d = state.v871Drag; if (!d) return;
  const c = state.cam2D; c.cx -= (e.clientX - d.x) / c.scale; c.cy += (e.clientY - d.y) / c.scale;
  state.v871Drag = { x: e.clientX, y: e.clientY }; requestRedraw();
});
