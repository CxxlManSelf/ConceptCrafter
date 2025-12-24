# Favicon 使用指引（給 Claude Projects 使用）

## 📌 核心規範

**Map 檔使用外部 favicon 檔案，不再嵌入 base64。**

### 標準配置
```html
<link rel="icon" type="image/png" href="./concept-crafter_icon.png">
```

---

## ✅ 正確的 Favicon 處理方式

### 方法 1：使用內定圖標（推薦）

**步驟：複製預設 icon 檔案到目標目錄**

1. **Node.js 環境**：
   ```javascript
   const fs = require('fs');
   const path = require('path');

   function setupFavicon(projectDir) {
       const iconSource = '.claude/concept-crafter_icon.png';
       const iconDest = path.join(projectDir, 'concept-crafter_icon.png');
       fs.copyFileSync(iconSource, iconDest);
       console.log(`Icon copied to ${iconDest}`);
   }
   ```

2. **命令列**：
   ```bash
   # Unix/Linux/Mac
   cp .claude/concept-crafter_icon.png ./project-dir/

   # Windows
   copy .claude\concept-crafter_icon.png .\project-dir\
   ```

### 方法 2：使用自訂圖標

若使用者提供圖標檔案：

**處理規則：**
1. 確認是 PNG 格式
2. 重新命名為 `concept-crafter_icon.png`
3. 放置在與 Map 檔相同目錄
4. 尺寸建議 128x128（非強制，瀏覽器會自動縮放）

**實作範例：**
```javascript
const fs = require('fs');
const path = require('path');

function processCustomIcon(userIconPath, projectDir) {
    const destPath = path.join(projectDir, 'concept-crafter_icon.png');

    // 驗證是否為 PNG
    if (!userIconPath.toLowerCase().endsWith('.png')) {
        console.warn('Warning: Icon is not PNG format. Recommended to convert.');
    }

    fs.copyFileSync(userIconPath, destPath);
    console.log(`Custom icon saved as ${destPath}`);
}
```

---

## 📋 完整的 HTML 模板片段

```html
<!DOCTYPE html>
<html lang="zh-TW">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{TITLE}} - Concept Map Viewer</title>

    <!-- ✅ 正確：使用外部 PNG 檔案 -->
    <link rel="icon" type="image/png" href="./concept-crafter_icon.png">
```

---

## 🎯 生成 Map 檔時的檢查清單

**使用內定圖標：**
- [ ] 複製 `.claude/concept-crafter_icon.png` 到目標目錄
- [ ] HTML 中使用 `href="./concept-crafter_icon.png"`
- [ ] 驗證 icon 檔案與 Map 檔在同一目錄

**使用自訂圖標：**
- [ ] 驗證圖標是 PNG 格式
- [ ] 重新命名為 `concept-crafter_icon.png`
- [ ] 複製到與 Map 檔相同目錄
- [ ] HTML 中使用 `href="./concept-crafter_icon.png"`

---

## 🤖 給 Claude Projects 的處理指引

### 情境 1：使用者沒有提供圖標檔案

**直接使用內定圖標**，無需詢問：

```javascript
const fs = require('fs');
const path = require('path');

const iconSource = '.claude/concept-crafter_icon.png';
const iconDest = path.join(projectDir, 'concept-crafter_icon.png');
fs.copyFileSync(iconSource, iconDest);
```

### 情境 2：使用者說「我有圖標」但未上傳檔案

**回應範例：**
```
我注意到您提到有圖標檔案。請提供您的圖標檔案（PNG 格式）。

或者，我可以直接使用內定圖標，讓您的 Map 檔立即可用。您希望如何處理？
```

### 情境 3：使用者已上傳圖標檔案

**處理步驟：**

1. **驗證格式**
   ```javascript
   const path = require('path');
   const ext = path.extname(iconPath).toLowerCase();
   if (ext !== '.png') {
       console.warn('建議使用 PNG 格式以支援透明背景');
   }
   ```

2. **複製並重新命名**
   ```javascript
   const destPath = path.join(projectDir, 'concept-crafter_icon.png');
   fs.copyFileSync(iconPath, destPath);
   ```

3. **告知使用者**
   ```
   您的圖標已處理：
   - 原始檔案：custom-icon.png
   - 儲存為：concept-crafter_icon.png
   - 位置：與 Map 檔相同目錄
   ```

### 情境 4：使用者提供的圖標有問題

**錯誤處理：**

```javascript
try {
    fs.copyFileSync(iconPath, destPath);
} catch (error) {
    console.error(`圖標處理失敗：${error.message}`);
    console.log('改用內定圖標...');
    fs.copyFileSync('.claude/concept-crafter_icon.png', destPath);
}
```

### 決策流程圖

```
使用者請求生成 Map 檔
    ↓
有提供圖標檔案？
    ├─ 否 → 複製內定圖標 (.claude/concept-crafter_icon.png)
    └─ 是 →
        ↓
        檢查是否為 PNG 格式
        ├─ 是 → 重新命名並複製
        └─ 否 → 警告並建議轉換為 PNG，或使用內定圖標
```

---

## 📁 專案結構範例

### 單一 Map 檔專案
```
MyProject/
├── concept-crafter_icon.png
└── project-map.html
```

### 多 Map 檔專案
```
MyProject/
├── concept-crafter_icon.png  # 所有 Map 共用
├── overview.html
├── module-1.html
├── module-2.html
└── README.md
```

---

## 💡 線上分享指引

### GitHub Pages / 網路託管

上傳 Map 檔到網路時：

1. **檔案準備**
   ```
   your-repo/
   ├── concept-crafter_icon.png
   └── index.html  (your map file)
   ```

2. **一起上傳**
   - icon 和 HTML 必須在同一目錄
   - 相對路徑 `./concept-crafter_icon.png` 會自動運作

3. **測試**
   - 開啟線上連結
   - 檢查瀏覽器 tab 是否顯示 icon

### 雲端硬碟分享

分享資料夾而非單一檔案：
```
SharedFolder/
├── concept-crafter_icon.png
└── map.html
```

---

## ⚡ 快速參考

**內定圖標位置：** `.claude/concept-crafter_icon.png`
**檔案名稱要求：** `concept-crafter_icon.png`
**放置位置：** 與 Map 檔同一目錄
**HTML 引用：** `<link rel="icon" type="image/png" href="./concept-crafter_icon.png">`

---

## 🔍 疑難排解

### 問題：瀏覽器沒有顯示 icon

**檢查清單：**
1. 檔案名稱是否正確（`concept-crafter_icon.png`）
2. 檔案是否與 HTML 在同一目錄
3. HTML 中的路徑是否正確（`./concept-crafter_icon.png`）
4. 清除瀏覽器快取並重新載入

### 問題：檔案太大

**解決方案：**
```python
# 使用 Python 縮小圖片
from PIL import Image
img = Image.open('concept-crafter_icon.png')
img_resized = img.resize((128, 128), Image.LANCZOS)
img_resized.save('concept-crafter_icon.png', 'PNG', optimize=True)
```

---

**重點：** 確保 favicon 檔案與 Map 檔在同一目錄，使用相對路徑引用！
