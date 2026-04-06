<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# My Pet Journal

This contains everything you need to run your app locally and deploy it online as a beautiful tracking tool.

## Run Locally

**Prerequisites:**  Node.js

1. 安裝環境依賴 (Install dependencies):
   `npm install`
2. 將 `.env.local` 檔案配置建立，並設定 `GEMINI_API_KEY`:
   `GEMINI_API_KEY=your_gemini_api_key`
3. 啟動本機伺服器 (Run the app):
   `npm run dev`
4. 本機預覽 (Preview production build):
   `npm run build` & `npm run preview`

## 開發紀錄 (Changelog / Setup)

專案已完成下列基礎設定：
1. **套件設定 (package.json)**
   * `npm install` 已經將 `react`, `lucide-react`, `recharts`, `vite` 等核心套件安裝妥當，並完成了代碼 Syntax 修正，能順利運行。
2. **自動化部署 (GitHub Action)**
   * 已經撰寫 `.github/workflows/deploy.yml`。只要 Push 到 `main` 分支，GitHub Actions 就會自動呼叫 Vite 進行 Build，並發佈至 GitHub Pages。
   * (備註：在發佈前，請至 GitHub repo `Settings -> Pages -> Build and deployment` 選擇 Github Actions 以便讓 workflow 生效)。
3. **隱私與忽略檔 (.gitignore)**
   * 加入了環境變數 (`.env`, `.env.*`) 以及其他常見的 IDE, MacOS 系統檔案排除，避免金鑰或隱私資訊外洩。
