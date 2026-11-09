#!/usr/bin/env python3
"""內政部 20 m DTM → DiZhu 線上 DEM 圖磚（2 km × 2 km）

用法：
  python3 dem_tiles.py 輸入檔(.tif/.tiff/.csv/.xyz/.txt) 輸出資料夾 [--tile 2000]

輸入：
  - GeoTIFF（TWD97 TM2，EPSG:3826；需 tifffile＋imagecodecs）
  - CSV／XYZ：每行 X,Y,Z（或 N,E,Z，自動判斷；可有標頭行）
輸出（給 GitHub Pages 用）：
  輸出資料夾/meta.json
  輸出資料夾/t/{ix}_{iy}.dzt   ix＝floor(E/tile)、iy＝floor(N/tile)（格中心座標）
圖磚格式（gzip 壓縮）：
  'DZT1'(4) x0 y0 dx dy (float64×4) nx ny (uint32×2) 之後 nx*ny 個 uint16（由南往北、由西往東）
  高程 z＝(v−5000)/10 m，v＝0 為無資料（可表示 −499.9～6053.5 m，解析度 0.1 m）
"""
import sys, os, gzip, json, struct, math, argparse, datetime
import numpy as np


def read_tif(path):
    import tifffile
    with tifffile.TiffFile(path) as tf:
        pg = tf.pages[0]; tags = pg.tags
        sx, sy = tags['ModelPixelScaleTag'].value[:2]
        tp = tags['ModelTiepointTag'].value; i0, j0, X0, Y0 = tp[0], tp[1], tp[3], tp[4]
        nd = None
        if 'GDAL_NODATA' in tags:
            try: nd = float(str(tags['GDAL_NODATA'].value).strip('\x00 '))
            except ValueError: nd = None
        a = pg.asarray(out='memmap') if pg.is_memmappable else pg.asarray()
        if a.ndim == 3: a = a[..., 0]
        H, W = a.shape
        ox, oy = X0 - i0 * sx, Y0 + j0 * sy          # 左上角
        # 每列中心 y（由北往南）
        return dict(arr=a, x0=ox + sx / 2, ytop=oy - sy / 2, dx=sx, dy=sy, nd=nd, W=W, H=H)


def read_xyz(path):
    xs, ys, zs = [], [], []; sw = None
    with open(path, encoding='utf8', errors='ignore') as f:
        for l in f:
            p = l.replace(',', ' ').replace(';', ' ').split()
            if len(p) < 3: continue
            try: x, y, z = float(p[0]), float(p[1]), float(p[2])
            except ValueError: continue
            if sw is None: sw = x > 1e6 and y < 1e6
            if sw: x, y = y, x
            if z < -9000: continue
            xs.append(x); ys.append(y); zs.append(z)
    xs, ys, zs = np.array(xs), np.array(ys), np.array(zs, dtype=np.float32)
    ux, uy = np.unique(np.round(xs, 2)), np.unique(np.round(ys, 2))
    dx = float(np.min(np.diff(ux))); dy = float(np.min(np.diff(uy)))
    x0, y0 = float(ux[0]), float(uy[-1])
    W = int(round((ux[-1] - x0) / dx)) + 1; H = int(round((y0 - uy[0]) / dy)) + 1
    a = np.full((H, W), np.nan, dtype=np.float32)
    a[np.round((y0 - ys) / dy).astype(int), np.round((xs - x0) / dx).astype(int)] = zs
    return dict(arr=a, x0=x0, ytop=y0, dx=dx, dy=dy, nd=None, W=W, H=H)


def main():
    ap = argparse.ArgumentParser(); ap.add_argument('src'); ap.add_argument('out'); ap.add_argument('--tile', type=float, default=2000.0)
    a = ap.parse_args(); T = a.tile
    ext = a.src.lower().rsplit('.', 1)[-1]
    R = read_tif(a.src) if ext in ('tif', 'tiff') else read_xyz(a.src)
    A, x0, ytop, dx, dy, nd, W, H = R['arr'], R['x0'], R['ytop'], R['dx'], R['dy'], R['nd'], R['W'], R['H']
    os.makedirs(os.path.join(a.out, 't'), exist_ok=True)
    xc = x0 + dx * np.arange(W); yc = ytop - dy * np.arange(H)          # 欄、列中心
    ixs = np.floor(xc / T).astype(int); iys = np.floor(yc / T).astype(int)
    n = 0; tot = 0; zmin, zmax = 1e9, -1e9
    for iy in range(iys.min(), iys.max() + 1):
        rows = np.where(iys == iy)[0]
        if not len(rows): continue
        r0, r1 = rows.min(), rows.max() + 1
        band = np.asarray(A[r0:r1, :], dtype=np.float32)
        for ix in range(ixs.min(), ixs.max() + 1):
            cols = np.where(ixs == ix)[0]
            if not len(cols): continue
            c0, c1 = cols.min(), cols.max() + 1
            z = band[:, c0:c1].copy()
            bad = ~np.isfinite(z) | (z < -9000) | (z > 9000)
            if nd is not None: bad |= (z == nd)
            if bad.all(): continue
            v = np.clip(np.round(z * 10 + 5000), 1, 65535).astype('<u2'); v[bad] = 0
            v = v[::-1, :]                                                   # 改為由南往北
            ny_, nx_ = v.shape
            hdr = b'DZT1' + struct.pack('<4d2I', float(xc[c0]), float(yc[r1 - 1]), float(dx), float(dy), nx_, ny_)
            data = gzip.compress(hdr + v.tobytes(), 9)
            with open(os.path.join(a.out, 't', f'{ix}_{iy}.dzt'), 'wb') as f: f.write(data)
            n += 1; tot += len(data); zz = z[~bad]; zmin = min(zmin, float(zz.min())); zmax = max(zmax, float(zz.max()))
        print(f'\r列 {iy}：已寫 {n} 塊，{tot / 1048576:.1f} MB', end='', flush=True)
    meta = dict(fmt='DZT1', tile=T, dx=dx, dy=dy, crs='EPSG:3826 TWD97 TM2', vdatum='TWVD2001', src=os.path.basename(a.src),
                source='內政部 20 公尺網格數值地形模型（DTM），政府資料開放授權條款第 1 版', tiles=n, bytes=tot, zmin=zmin, zmax=zmax,
                made=datetime.date.today().isoformat())
    with open(os.path.join(a.out, 'meta.json'), 'w', encoding='utf8') as f: json.dump(meta, f, ensure_ascii=False, indent=1)
    print(f'\n完成：{n} 塊，{tot / 1048576:.1f} MB，高程 {zmin:.1f}～{zmax:.1f} m')


if __name__ == '__main__':
    main()
