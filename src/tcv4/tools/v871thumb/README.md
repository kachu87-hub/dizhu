# v8.7.1 型錄縮圖（原圖裁切）重建步驟
1. `node ocap.js`（orig87 八種＋orig_st3/gs）、`node ocap3.js`（orig_st3 comb、slope，需強制畫布尺寸）→ 產生 oc/*.png（尺寸、文字圖層已關）
2. 在 oc/ 執行 `python3 crop.py`：依 C 表裁切主要視圖、反白轉淺色底，輸出 t_*.png（440×240）
3. 以 64 色 PNG 轉 base64 寫入 tcv4/v871thumb.js（V871_TH，鍵＝型錄 id）
