# 部署指南

## GitHub Pages 自動部署

此專案已配置 GitHub Actions 自動部署。每次推送代碼到 `main` 分支時，會自動構建並部署到 GitHub Pages。

## 檢查部署狀態

1. 前往 [GitHub Actions](https://github.com/sky770825/dealcrm/actions) 查看部署狀態
2. 確保部署成功後，訪問：https://sky770825.github.io/dealcrm/

## 啟用 GitHub Pages

如果這是第一次部署，需要手動啟用 GitHub Pages：

1. 前往倉庫設置：https://github.com/sky770825/dealcrm/settings/pages
2. 在 "Source" 部分，選擇 "GitHub Actions"
3. 保存設置

## 常見問題排查

### 1. 頁面空白
- 檢查瀏覽器控制台是否有錯誤
- 確認資源路徑是否正確（應該是 `/dealcrm/assets/...`）
- 檢查 GitHub Actions 部署是否成功

### 2. 資源加載失敗（404）
- 確認 base 路徑設置正確（`VITE_BASE_PATH: /dealcrm/`）
- 檢查 `dist` 文件夾中是否有 `assets` 文件夾

### 3. MIME 類型錯誤
- 確認 `_headers` 或 `.htaccess` 文件已包含在部署中
- 檢查服務器配置是否支持自定義 MIME 類型

## 手動部署

如果需要手動部署：

```bash
# 1. 構建專案
npm run build

# 2. 構建後，dist 文件夾包含所有部署文件
# 3. 將 dist 文件夾內容上傳到服務器
```
