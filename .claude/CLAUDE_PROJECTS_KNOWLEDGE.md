# Concept Crafter Map 檔 - 完整知識庫

> 此文檔整合了所有關鍵資訊，供 Claude Projects 參考使用

---

## 🚨 重要：Favicon 引用規範（必讀）

**規範：** Map 檔使用外部 favicon 檔案，不再嵌入 base64。

### 標準配置
```html
<link rel="icon" type="image/png" href="./concept-crafter_icon.png">
```

### 檔案放置要求
- **檔案名稱**: `concept-crafter_icon.png`
- **檔案位置**: 與 Map 檔在同一目錄
- **建議尺寸**: 128x128 像素
- **格式**: PNG (支援透明背景)

### 使用者自訂 Icon
若使用者提供自訂圖標：
1. 檔案名稱必須是 `concept-crafter_icon.png`
2. 放置在與 Map 檔相同目錄
3. 建議尺寸 128x128（瀏覽器會自動縮放其他尺寸）
4. 必須是 PNG 格式

---

## ⚠️ 重要：ID 格式規範（必須遵守）

**所有 ID 必須使用字符串格式，這是與 Concept Crafter 相容的關鍵！**

```javascript
// ✅ 正確的 ID 格式
node.id = 'node-' + Date.now()        // "node-1734176400001"
frame.id = 'frame-' + Date.now()      // "frame-1734176400002"
connection.id = 'conn-' + Date.now()  // "conn-1734176400003"

// ❌ 錯誤的 ID 格式
node.id = Date.now()                  // 1734176400001 (數字)
node.id = "node_123"                  // 使用底線而非連字號
```

**為什麼必須使用字符串 ID？**
1. **語義化**：一眼看出元素類型
2. **避免衝突**：不同類型的元素永不衝突
3. **調試友善**：更容易追蹤和理解
4. **相容性**：與 Concept Crafter 完全相容
5. **擴展性**：未來可輕鬆改用 UUID

---

## 📚 目錄

1. [專案核心概念](#專案核心概念)
2. [Map 檔規範](#map-檔規範)
3. [數據結構定義](#數據結構定義)
4. [創建專案指南](#創建專案指南)
5. [完整模板](#完整模板)

---

## 專案核心概念

### 🎯 核心目標
**讓 AI 能夠自主創建包含概念圖 Map 檔的專案資料夾**

### Map 檔是什麼？
- **獨立的 HTML 文件**，包含完整的查看器和數據
- **自包含式**：無需外部依賴，可直接在瀏覽器開啟
- **自帶 icon**：每個 map 檔都嵌入了自己的 favicon
- **三大元素**：節點（Nodes）、框架（Frames）、連接線（Connections）

### Concept Crafter.html 的角色
- **僅作為工具**：用於編輯和生成 map 檔
- **非必需**：AI 可直接生成符合規範的 map 檔
- **與 Electron 無關**：Map 檔是純 HTML/CSS/JavaScript

### 三大核心元素

#### 1. Nodes（節點）
- 概念圖中的核心內容單元
- 支援富文本（HTML）內容
- 可設置顏色、對齊方式
- 可標記為「完成」或「放棄」

#### 2. Frames（框架）
- 用於分組和組織節點
- 作為背景容器
- 支援標籤、邊框顏色、背景色
- 具有層級（z-index）

#### 3. Connections（連接線）
- 連接節點或框架，表達關係
- 支援單向箭頭、雙向箭頭、無箭頭
- 可設置標籤和顏色
- 使用 SVG 繪製

### 🔧 關鍵技術要點

**1. Box-sizing 設定（必須）**
```css
* {
    box-sizing: border-box;
}
```
否則連接線會深入節點內部

**2. Favicon 必須包含**
- 檔案名稱：`concept-crafter_icon.png`
- 放置位置：與 Map 檔在同一目錄
- 建議尺寸：128x128 PNG
- 使用內定圖標：複製 `.claude/concept-crafter_icon.png` 到專案目錄
- 使用者提供自訂圖標：重新命名為 `concept-crafter_icon.png` 並放在同一目錄

```html
<link rel="icon" type="image/png" href="./concept-crafter_icon.png">
```

**3. 數據嵌入方式**
```html
<script id="map-data" type="application/json">
{
  "title": "Map Title",
  "data": {
    "nodes": [...],
    "frames": [...],
    "connections": [...]
  }
}
</script>
```

---

## Map 檔規範

### 檔案結構

```html
<!DOCTYPE html>
<html lang="zh-TW">
<head>
    <meta charset="UTF-8">
    <title>{{TITLE}} - Concept Map Viewer</title>

    <!-- 必須：Favicon 引用 -->
    <link rel="icon" type="image/png" href="./concept-crafter_icon.png">

    <!-- 必須：Viewer 樣式 -->
    <style>/* Map Viewer CSS */</style>

    <!-- 必須：Map 數據 -->
    <script id="map-data" type="application/json">
    {{MAP_DATA_JSON}}
    </script>
</head>
<body>
    <div id="map-title">{{TITLE}}</div>
    <div id="container">
        <svg id="svg-layer"></svg>
        <div id="canvas"></div>
    </div>
    <script>/* Map Viewer 腳本 */</script>
</body>
</html>
```

### 必要的 CSS（關鍵規則）

```css
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;  /* 重要！防止連接線深入節點 */
}

body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    overflow: hidden;
    background: #f0f0f0;
}

#container {
    width: 100vw;
    height: 100vh;
    overflow: hidden;
    position: relative;
    cursor: grab;
}

#container.grabbing {
    cursor: grabbing;
}

#canvas {
    width: 100%;
    height: 100%;
    transform-origin: 0 0;
    position: relative;
}

svg {
    position: absolute;
    top: 0;
    left: 0;
    pointer-events: none;
    z-index: 50;
    overflow: visible;
}

.node {
    position: absolute;
    background: #3498db;
    color: white;
    padding: 15px;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    user-select: none;
}

.frame {
    position: absolute;
    border: 2px dashed #95a5a6;
    background: rgba(149, 165, 166, 0.1);
    border-radius: 4px;
}

.node-status-badge {
    position: absolute;
    top: 8px;
    right: 8px;
    font-size: 16px;
    font-weight: bold;
    padding: 4px 8px;
    border-radius: 4px;
    display: flex;
    gap: 5px;
}

.status-completed {
    background: #27ae60;
    color: white;
}

.status-abandoned {
    background: #e74c3c;
    color: white;
}
```

### MapViewer 類核心結構

```javascript
class MapViewer {
    constructor() {
        this.container = document.getElementById('container');
        this.canvas = document.getElementById('canvas');
        this.svgLayer = document.getElementById('svg-layer');
        this.data = JSON.parse(document.getElementById('map-data').textContent);

        this.nodes = this.data.data.nodes || [];
        this.frames = this.data.data.frames || [];
        this.connections = this.data.data.connections || [];

        this.scale = 1;
        this.offsetX = 0;
        this.offsetY = 0;
        this.isPanning = false;

        this.init();
    }

    init() {
        this.updateSVGSize();
        this.setupEventListeners();
        this.render();
    }

    setupEventListeners() {
        // 平移
        this.container.addEventListener('mousedown', (e) => {
            this.isPanning = true;
            this.panStart = { x: e.clientX, y: e.clientY };
        });

        window.addEventListener('mousemove', (e) => {
            if (this.isPanning) {
                this.offsetX += e.clientX - this.panStart.x;
                this.offsetY += e.clientY - this.panStart.y;
                this.panStart = { x: e.clientX, y: e.clientY };
                this.render();
            }
        });

        window.addEventListener('mouseup', () => {
            this.isPanning = false;
        });

        // 縮放
        this.container.addEventListener('wheel', (e) => {
            e.preventDefault();
            const delta = e.deltaY > 0 ? 0.9 : 1.1;
            const rect = this.container.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            this.offsetX = mouseX - (mouseX - this.offsetX) * delta;
            this.offsetY = mouseY - (mouseY - this.offsetY) * delta;
            this.scale *= delta;
            this.scale = Math.max(0.1, Math.min(5, this.scale));
            this.render();
        });
    }

    render() {
        this.canvas.innerHTML = '';
        this.svgLayer.innerHTML = '';

        // 創建 SVG 箭頭標記
        // 渲染框架（按 zIndex 排序）
        // 渲染節點
        // 渲染連接線

        this.canvas.style.transform =
            `translate(${this.offsetX}px, ${this.offsetY}px) scale(${this.scale})`;
    }
}

new MapViewer();
```

---

## 數據結構定義

### TypeScript 定義

```typescript
interface MapData {
    title: string;
    data: {
        nodes: Node[];
        frames: Frame[];
        connections: Connection[];
    };
}

interface Node {
    id: string;                 // ⚠️ 必須：'node-' + Date.now() （字符串格式）
    x: number;
    y: number;
    width: number;
    height: number;
    text: string;               // 支援 HTML
    color: string;              // CSS 顏色值
    textAlign: 'left' | 'center' | 'right';
    completed?: boolean;
    abandoned?: boolean;
}

interface Frame {
    id: string;                 // ⚠️ 必須：'frame-' + Date.now() （字符串格式）
    x: number;
    y: number;
    width: number;
    height: number;
    label: string;
    borderColor: string;
    bgColor: string;            // 建議使用 rgba
    zIndex: number;
    completed?: boolean;
    abandoned?: boolean;
}

interface Connection {
    id: string;                 // ⚠️ 必須：'conn-' + Date.now() （字符串格式）
    from: string;               // Node 或 Frame 的 ID（字符串）
    to: string;                 // Node 或 Frame 的 ID（字符串）
    arrowType: 'single' | 'double' | 'none';
    label: string;
    color: string;
}
```

### 完整範例

```json
{
  "title": "範例概念圖",
  "data": {
    "nodes": [
      {
        "id": "node-1702345678901",
        "x": 150,
        "y": 100,
        "width": 200,
        "height": 100,
        "text": "<b>核心概念</b><br>這是主要的想法",
        "color": "#3498db",
        "textAlign": "center",
        "completed": false
      },
      {
        "id": "node-1702345678902",
        "x": 450,
        "y": 100,
        "width": 200,
        "height": 100,
        "text": "延伸概念",
        "color": "#2ecc71",
        "textAlign": "center",
        "completed": true
      }
    ],
    "frames": [
      {
        "id": "frame-1702345678901",
        "x": 100,
        "y": 50,
        "width": 600,
        "height": 200,
        "label": "主要區塊",
        "borderColor": "#95a5a6",
        "bgColor": "rgba(149, 165, 166, 0.1)",
        "zIndex": 0
      }
    ],
    "connections": [
      {
        "from": "node-1702345678901",
        "to": "node-1702345678902",
        "arrowType": "single",
        "label": "導致",
        "color": "#2c3e50"
      }
    ]
  }
}
```

### 常用顏色

```javascript
const NODE_COLORS = {
    blue: '#3498db',      // 一般資訊
    green: '#2ecc71',     // 正面/完成
    red: '#e74c3c',       // 警告/重要
    yellow: '#f39c12',    // 注意
    purple: '#9b59b6',    // 特殊
    gray: '#95a5a6',      // 次要
};
```

---

## 創建專案指南

### 步驟流程

#### 1. 理解需求
- 專案主題是什麼？
- 需要幾個概念圖？
- 每個 Map 應該包含什麼資訊？

#### 2. 設計專案結構
```
ProjectName/
├── overview.html        # 總覽圖
├── module-1.html        # 模組 1
├── module-2.html        # 模組 2
└── README.md            # 專案說明
```

#### 3. 圖標處理

**使用內定圖標**（推薦）：
```javascript
// 複製內定圖標到專案目錄
const fs = require('fs');
const path = require('path');

function copyDefaultIcon(targetDir) {
    const iconSource = '.claude/concept-crafter_icon.png';
    const iconDest = path.join(targetDir, 'concept-crafter_icon.png');

    fs.copyFileSync(iconSource, iconDest);
    console.log(`Icon copied to ${iconDest}`);
}
```

**使用者提供自訂圖標**：
```javascript
const fs = require('fs');
const path = require('path');

function processCustomIcon(iconPath, targetDir) {
    const iconDest = path.join(targetDir, 'concept-crafter_icon.png');

    // 重新命名並複製到目標目錄
    fs.copyFileSync(iconPath, iconDest);
    console.log(`Custom icon saved as ${iconDest}`);
}
```

#### 4. 輔助函數

**生成 ID**（必須使用此格式）：
```javascript
// ✅ 標準 ID 生成方式
function generateNodeId() {
    return 'node-' + Date.now();
}

function generateFrameId() {
    return 'frame-' + Date.now();
}

function generateConnectionId() {
    return 'conn-' + Date.now();
}

// ✅ 通用 ID 生成函數
function generateId(prefix) {
    return prefix + '-' + Date.now();
}

// 使用範例
const nodeId = generateId('node');       // "node-1734176400001"
const frameId = generateId('frame');     // "frame-1734176400002"
const connId = generateId('conn');       // "conn-1734176400003"
```

**網格布局**：
```javascript
function createGridLayout(items, columns = 3, spacingX = 250, spacingY = 180) {
    return items.map((item, index) => ({
        ...item,
        id: generateId('node'),
        x: 150 + (index % columns) * spacingX,
        y: 150 + Math.floor(index / columns) * spacingY,
        width: 200,
        height: 100
    }));
}
```

**自動生成連接線**：
```javascript
function createSequentialConnections(nodeIds) {
    const connections = [];
    for (let i = 0; i < nodeIds.length - 1; i++) {
        connections.push({
            from: nodeIds[i],
            to: nodeIds[i + 1],
            arrowType: 'single',
            color: '#2c3e50',
            label: ''
        });
    }
    return connections;
}
```

### 驗證清單

創建 Map 檔後確認：
- [ ] 是獨立的 HTML 文件
- [ ] 包含 base64 favicon
- [ ] 可在瀏覽器中開啟
- [ ] 支援平移和縮放
- [ ] 連接線不會深入節點內部
- [ ] 無 JavaScript 錯誤

---

## 完整模板

### 內定圖標使用方式

**重要：** 直接讀取 `.claude/favicon-base64-reference.txt` 檔案取得完整的 Data URL。

**讀取方式**：
```javascript
const fs = require('fs');
const faviconFile = fs.readFileSync('.claude/favicon-base64-reference.txt', 'utf-8');
const lines = faviconFile.split('\n');
const faviconDataUrl = lines.find(line => line.startsWith('data:image/png;base64,')).trim();
```

**自訂圖標處理規則**：
使用者若提供自訂圖標，必須：
1. **轉換為 PNG 格式**（即使原檔是 JPG、WebP、GIF 等）
2. **尺寸處理**：
   - 若圖片 > 128x128：縮小到 128x128
   - 若圖片 ≤ 128x128：保持原尺寸（不放大）
3. **轉換為 base64** 格式嵌入 HTML
4. **驗證**：Data URL 必須以 `data:image/png;base64,iVBORw0KGgo` 開頭

### （舊）預設 Favicon Base64（藍色方塊，已棄用）
```
iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAA7AAAAOwBeShxvQAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAGNSURBVFiF7ZaxSsNQFIa/k6bBVkEEBwdHJ0cHwUkXX8A36ODo6iO4+ALi4OQTODm4ODk5uDg4CIIgVkFqbY3JdTC9kJCbJE1vA/nhhJzcnPM55/6X3ID/QAvYAY6BK+ABGABDYAR8AJ/ALXAOnAFHwCGwXzWnNYhR5wU4ATqVMDOEDngEusCeJaE5zRL8CGxaklmCW4BPQfBd4MqSzBzcCL6n+HchOPxYAGu2hJQCOIC1X/gqOICNX/hx7wJscR8L3vu4ys2V58AB+0vg6cPjBbI/BNpF8nqADXwHaJnAUwS/FQ1vJcOLVsMWPke0FubwMbAn6a0gI/gEuM7TPgKa+CYziS1a9CzwE3yr6z7Q8N3l+h7wJerPh87h8FNxqDX6JPAh8FN8Y0qmY7gf/8Hb+HbO2iC9wHtAT/AtoQ9U9UKaCLxvSE4F1p3AY5y3VQrW08oW8AZcCt4RdFV8y/UEvLbw3QG7wHYO28Z3xAHgRdD3eXJfBX6qZ0LX+CpZIjZw5UG/AN5k5vcAemOvAAAAAElFTkSuQmCC
```

### 最小 Map 檔範例

參考完整模板位置：`.claude/templates/map-viewer-template.html`

完整範例位置：`.claude/examples/sample-project-map.html`

---

## 🚨 重要提醒

1. **Box-sizing 必須設置**
   ```css
   * { box-sizing: border-box; }
   ```

2. **每個專案目錄都要有 Favicon**
   ```html
   <link rel="icon" type="image/png" href="./concept-crafter_icon.png">
   ```
   - `concept-crafter_icon.png` 必須與 Map 檔在同一目錄
   - 複製自 `.claude/concept-crafter_icon.png`

3. **Map 檔可在瀏覽器開啟**
   - 不依賴 Concept Crafter.html
   - 不依賴 Electron
   - 可直接在任何瀏覽器開啟
   - 需要 `concept-crafter_icon.png` 檔案在同一目錄

4. **數據驗證**
   - 確保所有 ID 唯一
   - 連接線的 from/to 必須存在於 nodes 或 frames 中
   - 顏色值必須是有效的 CSS 顏色

5. **無限畫布**
   - v2.5.5+ 已移除畫布邊界限制
   - 支援任意位置的節點

---

## 📚 參考位置

`.claude/` 資料夾結構：
- `CLAUDE_PROJECTS_KNOWLEDGE.md` - **本文件**：完整知識庫（主要參考）
- `FAVICON-GUIDE-FOR-CLAUDE.md` - **Favicon 使用指引**（圖標處理方式）
- `concept-crafter_icon.png` - **內定圖標 PNG 檔案**（128x128，19KB）
- `map-file-specification.md` - Map 檔詳細技術規範
- `templates/map-viewer-template.html` - Map 檔模板
- `examples/sample-project-map.html` - 完整範例（已使用正確圖標）

---

## 📋 專案結構範例

### 單一 Map 檔專案
```
MyProject/
├── concept-crafter_icon.png  # 必須
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

## 💡 分享注意事項

**分享 Map 檔時：**
- 必須同時提供 `concept-crafter_icon.png`
- 建議將 Map 檔和 icon 放在同一資料夾中一起分享
- 上傳到網路（如 GitHub Pages）時，兩個檔案都要上傳

**線上託管範例：**
```
your-repo/
├── concept-crafter_icon.png
├── index.html  (your map)
└── README.md
```
