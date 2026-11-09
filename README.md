# 砥柱 DiZhu v8.6

單檔 HTML 的 CAD 工具，提供平面、縱斷面、橫斷面設計並輸出 DXF，主要用於水土保持與野溪治理工程（防砂壩、梳子壩、固床工、護岸、護坡、排水溝、整地與土方、崩塌地整治）。

## 使用方式

- **線上**：開啟 <https://kachu87-hub.github.io/dizhu/>（需 repo 公開並開啟 GitHub Pages）。
- **離線**：下載 `index.html`，用瀏覽器（建議 Chrome／Edge）直接開啟。

所有計算都在瀏覽器內完成，不需安裝、不需伺服器。專案存成 `.tcproj` 檔，存在你自己的電腦上，不會上傳。

基本流程：匯入測量點（或 DEM）→ 畫中心線 → 縱斷面設計 → 橫斷面與結構物 → 檢核 → 出圖（DXF）與數量表。

## 主要功能（截至 v8.6）

- 平面：中心線鎖點與 IP、加樁管理、平面膠囊工具列、位置圖底圖（EMAP）、控制點（自動找出點錯的點）；改中心線時物件保持平面位置。
- 縱斷面：設計點（VIP）、開挖、結構物高程調整。
- 橫斷面：偏角、依案例排版出圖、字高可調。
- 結構物：防砂壩、梳子壩、固床工＋基樁、護岸多種型式、護坡基礎補強、自由梁護坡、排水溝、生物通道。
- 地形：內政部 DEM 匯入、線上 DEM（Terrarium）。
- 3D 檢視：設計後地形（高程色＋地形線）、護岸防呆、縱斷面設計點與地面差異檢核。
- 出圖：A3 圖框與標題欄、數量表、全圖 DXF。

各版細節見 `docs/` 內的變更說明（最新：`docs/29_v8.6_變更說明.md`）。

## Repo 內容

| 路徑 | 說明 |
|---|---|
| `index.html` | 網站本體（＝ DiZhu_v8.6.html） |
| `src/tcv4/` | 原始模組（*mod.js）、建置腳本 `patch.py`、產生器 gen_*.py |
| `src/profile-cross-section/` | 母版 index.html（唯讀） |
| `src/tests/` | Playwright 回歸測試 |
| `docs/` | 專案指示、待辦清單、各版變更說明 |

## 建置

```bash
cp -r src/tcv4 /home/claude/tcv4
cp -r src/profile-cross-section /home/claude/profile-cross-section
cd /home/claude/tcv4 && python3 patch.py && cp tc_v42.html DiZhu_v8.6.html
```

（patch.py 內路徑寫死為 /home/claude/...）

- `gen_*.py` 是從原工具 HTML 產生 `ormod*.js` 的產生器；原工具檔不在 repo 內，請直接使用現有的 `ormod*.js`。
- 回歸測試需要一份參考專案 `/home/claude/u.tcproj`。參考專案含實際案場測量資料，未放進公開 repo，請改用你自己的專案檔。

## 授權

尚未訂定授權條款。在作者公布授權前，使用、修改或散布請先聯繫作者。

## 免責

本工具計算結果僅供設計參考，正式設計與數量請由專業技師核對。
