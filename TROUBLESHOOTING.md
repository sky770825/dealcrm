# 故障排查指南 - 頁面空白問題

## 🔍 問題診斷

如果網站顯示完全空白，請按以下步驟排查：

### 步驟 1: 檢查 GitHub Actions 部署狀態

1. 前往：https://github.com/sky770825/dealcrm/actions
2. 查看最新的 "Deploy to GitHub Pages" 工作流
3. 確認狀態：
   - ✅ **綠色勾號** = 部署成功
   - ⏳ **黃色圓圈** = 正在運行中
   - ❌ **紅色叉號** = 部署失敗

### 步驟 2: 確認 GitHub Pages 設置

1. 前往：https://github.com/sky770825/dealcrm/settings/pages
2. **必須選擇**: "Source" → **"GitHub Actions"**（不是 "Deploy from a branch"）
3. 如果設置錯誤，請改為 "GitHub Actions" 並保存

### 步驟 3: 檢查部署的 HTML 內容

**正確的構建版本應該包含：**
```html
<script type="module" crossorigin src="/dealcrm/assets/index.xxx.js"></script>
<link rel="stylesheet" crossorigin href="/dealcrm/assets/index.xxx.css">
```

**錯誤的原始版本（會導致空白）：**
```html
<link rel="stylesheet" href="/index.css">
<script type="module" src="/index.tsx"></script>
```

### 步驟 4: 手動觸發部署

如果部署沒有自動觸發：

1. 前往：https://github.com/sky770825/dealcrm/actions
2. 點擊 "Deploy to GitHub Pages" 工作流
3. 點擊右上角 **"Run workflow"** 按鈕
4. 選擇分支 "main"，點擊 "Run workflow"
5. 等待 2-3 分鐘完成

### 步驟 5: 檢查瀏覽器控制台

1. 打開網站：https://sky770825.github.io/dealcrm/
2. 按 **F12** 打開開發者工具
3. 查看 **Console** 標籤的錯誤訊息
4. 查看 **Network** 標籤，確認資源是否成功加載（應該是 200 狀態）

## 🛠️ 常見錯誤及解決方案

### 錯誤 1: 資源返回 404

**原因**: GitHub Pages 還沒有部署構建版本

**解決方案**:
- 確認 GitHub Pages 設置為 "GitHub Actions"
- 手動觸發部署工作流
- 等待部署完成（通常需要 2-3 分鐘）

### 錯誤 2: MIME 類型錯誤

**原因**: JavaScript 文件被識別為錯誤的 MIME 類型

**解決方案**:
- 確認 `_headers` 和 `.htaccess` 文件在 `dist` 文件夾中
- GitHub Pages 會自動使用 `_headers` 文件

### 錯誤 3: 頁面空白但沒有錯誤

**可能原因**:
- React 應用渲染錯誤
- 檢查控制台的 JavaScript 錯誤
- 確認所有依賴都已正確安裝

## ✅ 驗證部署成功

部署成功後，您應該看到：
1. ✅ GitHub Actions 顯示綠色勾號
2. ✅ 網站 HTML 包含 `/dealcrm/assets/...` 路徑
3. ✅ 瀏覽器控制台沒有錯誤
4. ✅ 頁面正常顯示（不是空白）

## 📞 如果問題仍然存在

請提供以下信息：
1. GitHub Actions 的狀態截圖
2. 瀏覽器控制台的錯誤訊息
3. Network 標籤中失敗的資源請求
