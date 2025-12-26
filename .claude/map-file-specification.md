# Map 檔完整規範

## 📄 檔案結構

一個完整的 Map 檔是**單一的 HTML 文件**，包含以下部分：

```html
<!DOCTYPE html>
<html lang="zh-TW">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>地圖標題 - Concept Map Viewer</title>

    <!-- 必須：Favicon 引用 -->
    <link rel="icon" type="image/png" href="./concept-crafter_icon.png">

    <!-- 必須：Viewer 樣式 -->
    <style>
        /* Map Viewer CSS */
    </style>

    <!-- 必須：Map 數據 -->
    <script id="map-data" type="application/json">
        {
            "title": "地圖標題",
            "data": {
                "nodes": [],
                "frames": [],
                "connections": []
            }
        }
    </script>
</head>
<body>
    <!-- 必須：標題顯示 -->
    <div id="map-title">地圖標題</div>

    <!-- 必須：容器結構 -->
    <div id="container">
        <svg id="svg-layer"></svg>
        <div id="canvas"></div>
    </div>

    <!-- 必須：Map Viewer 腳本 -->
    <script>
        class MapViewer {
            // Map Viewer 實現
        }

        // 初始化
        new MapViewer();
    </script>
</body>
</html>
```

## 🎨 必要的 CSS

### 關鍵樣式規則

```css
/* 【必須】全局 box-sizing 設定 */
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;  /* 重要！防止連接線深入節點 */
}

body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    overflow: hidden;
    background: #f5f5f5;
}

/* 標題樣式 */
#map-title {
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(255, 255, 255, 0.95);
    padding: 10px 30px;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    font-size: 18px;
    font-weight: 600;
    z-index: 1000;
    pointer-events: none;
}

/* 容器 */
#container {
    width: 100vw;
    height: 100vh;
    position: relative;
    overflow: hidden;
    cursor: grab;
}

#container.panning {
    cursor: grabbing;
}

/* 畫布 */
#canvas {
    position: absolute;
    transform-origin: 0 0;
    width: 100%;
    height: 100%;
}

/* SVG 層（連接線） */
#svg-layer {
    position: absolute;
    top: 0;
    left: 0;
    pointer-events: none;
    overflow: visible;
    z-index: 999;
}

/* 節點樣式 */
.node {
    position: absolute;
    background: white;
    border: 2px solid #3498db;
    border-radius: 8px;
    padding: 15px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    cursor: pointer;
    transition: box-shadow 0.2s;
    overflow-wrap: break-word;
    word-wrap: break-word;
}

.node:hover {
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

/* 狀態徽章 */
.status-badge {
    position: absolute;
    top: -10px;
    right: -10px;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

.status-badge.completed {
    background: #27ae60;
    color: white;
}

.status-badge.abandoned {
    background: #e74c3c;
    color: white;
}

/* 框架樣式 */
.frame {
    position: absolute;
    border: 2px solid #95a5a6;
    border-radius: 4px;
    background: rgba(149, 165, 166, 0.1);
    pointer-events: none;
}

.frame-label {
    position: absolute;
    top: 5px;
    left: 10px;
    font-size: 14px;
    font-weight: 600;
    color: #7f8c8d;
    pointer-events: none;
}

/* 連接線標籤 */
.connection-label {
    font-size: 12px;
    fill: #2c3e50;
    pointer-events: none;
}
```

## 📊 數據格式規範

### JSON 結構

```json
{
  "title": "地圖標題",
  "data": {
    "nodes": [
      {
        "id": "node-1234567890",
        "x": 100,
        "y": 100,
        "width": 200,
        "height": 100,
        "text": "節點內容（支援HTML）",
        "color": "#3498db",
        "textAlign": "center",
        "completed": false,
        "abandoned": false
      }
    ],
    "frames": [
      {
        "id": "frame-1234567890",
        "x": 50,
        "y": 50,
        "width": 500,
        "height": 300,
        "label": "框架標籤",
        "borderColor": "#95a5a6",
        "bgColor": "rgba(149, 165, 166, 0.1)",
        "zIndex": 0,
        "completed": false,
        "abandoned": false
      }
    ],
    "connections": [
      {
        "from": "node-1234567890",
        "to": "node-0987654321",
        "arrowType": "single",
        "label": "連接標籤",
        "color": "#2c3e50"
      }
    ]
  }
}
```

## 🔧 Map Viewer 類規範

### 必要屬性

```javascript
class MapViewer {
    constructor() {
        // DOM 元素
        this.container = document.getElementById('container');
        this.canvas = document.getElementById('canvas');
        this.svgLayer = document.getElementById('svg-layer');

        // 數據
        this.data = JSON.parse(
            document.getElementById('map-data').textContent
        );
        this.nodes = this.data.data.nodes || [];
        this.frames = this.data.data.frames || [];
        this.connections = this.data.data.connections || [];

        // 視圖狀態
        this.scale = 1;
        this.offsetX = 0;
        this.offsetY = 0;
        this.isPanning = false;
        this.panStart = { x: 0, y: 0 };

        // 初始化
        this.init();
    }
}
```

### 必要方法

```javascript
class MapViewer {
    // 初始化
    init() {
        this.updateSVGSize();
        this.render();
        this.updateConnections();
        this.setupEventListeners();
    }

    // 設置事件監聽
    setupEventListeners() {
        // 平移
        this.container.addEventListener('mousedown', this.handleMouseDown.bind(this));
        window.addEventListener('mousemove', this.handleMouseMove.bind(this));
        window.addEventListener('mouseup', this.handleMouseUp.bind(this));

        // 縮放
        this.container.addEventListener('wheel', this.handleWheel.bind(this));

        // 視窗大小變化
        window.addEventListener('resize', this.handleResize.bind(this));
    }

    // 渲染所有元素
    render() {
        this.canvas.innerHTML = '';

        // 按 zIndex 排序並渲染框架
        const sortedFrames = [...this.frames].sort((a, b) =>
            (a.zIndex || 0) - (b.zIndex || 0)
        );
        sortedFrames.forEach(frame => this.renderFrame(frame));

        // 渲染節點
        this.nodes.forEach(node => this.renderNode(node));
    }

    // 渲染節點
    renderNode(node) {
        const nodeEl = document.createElement('div');
        nodeEl.className = 'node';
        nodeEl.style.left = node.x + 'px';
        nodeEl.style.top = node.y + 'px';
        nodeEl.style.width = node.width + 'px';
        nodeEl.style.height = node.height + 'px';
        nodeEl.style.background = node.color || '#3498db';
        nodeEl.style.textAlign = node.textAlign || 'center';
        nodeEl.innerHTML = node.text || '';

        // 狀態徽章
        if (node.completed || node.abandoned) {
            const badge = document.createElement('div');
            badge.className = `status-badge ${node.completed ? 'completed' : 'abandoned'}`;
            badge.textContent = node.completed ? '✓' : '✗';
            nodeEl.appendChild(badge);
        }

        this.canvas.appendChild(nodeEl);
    }

    // 渲染框架
    renderFrame(frame) {
        const frameEl = document.createElement('div');
        frameEl.className = 'frame';
        frameEl.style.left = frame.x + 'px';
        frameEl.style.top = frame.y + 'px';
        frameEl.style.width = frame.width + 'px';
        frameEl.style.height = frame.height + 'px';
        frameEl.style.borderColor = frame.borderColor || '#95a5a6';
        frameEl.style.background = frame.bgColor || 'rgba(149, 165, 166, 0.1)';
        frameEl.style.zIndex = frame.zIndex || 0;

        if (frame.label) {
            const label = document.createElement('div');
            label.className = 'frame-label';
            label.textContent = frame.label;
            frameEl.appendChild(label);
        }

        this.canvas.appendChild(frameEl);
    }

    // 更新連接線
    updateConnections() {
        this.svgLayer.innerHTML = '';

        // 定義箭頭標記
        const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        const markerSize = 6 * this.scale;

        // 收集所有使用的顏色
        const colors = new Set(['#2c3e50']);
        this.connections.forEach(conn => {
            if (conn.color) colors.add(conn.color);
        });

        // 為每種顏色創建箭頭
        const createMarker = (id, d, refX, color) => {
            const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
            marker.setAttribute('id', id);
            marker.setAttribute('viewBox', '0 0 10 10');
            marker.setAttribute('refX', refX);
            marker.setAttribute('refY', '5');
            marker.setAttribute('markerWidth', markerSize);
            marker.setAttribute('markerHeight', markerSize);
            marker.setAttribute('orient', 'auto');
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('d', d);
            path.setAttribute('fill', color);
            marker.appendChild(path);
            return marker;
        };

        colors.forEach(color => {
            const colorId = color.replace('#', '');
            defs.appendChild(createMarker(`arrowhead-${colorId}`, 'M 0 0 L 10 5 L 0 10 z', '9', color));
            defs.appendChild(createMarker(`arrowhead-double-${colorId}`, 'M 10 0 L 0 5 L 10 10 z', '1', color));
        });

        this.svgLayer.appendChild(defs);

        // 繪製每條連接線
        this.connections.forEach(conn => {
            const fromNode = this.nodes.find(n => n.id === conn.from);
            const toNode = this.nodes.find(n => n.id === conn.to);

            if (!fromNode || !toNode) return;

            // 計算節點中心（原始座標）
            const fromCenter = {
                x: fromNode.x + fromNode.width / 2,
                y: fromNode.y + fromNode.height / 2
            };
            const toCenter = {
                x: toNode.x + toNode.width / 2,
                y: toNode.y + toNode.height / 2
            };

            // 計算與節點邊界的交點
            const getIntersection = (center, target, rect) => {
                const dx = target.x - center.x;
                const dy = target.y - center.y;
                if (dx === 0 && dy === 0) return center;

                const hw = rect.width / 2;
                const hh = rect.height / 2;

                if (Math.abs(dx) / hw > Math.abs(dy) / hh) {
                    return {
                        x: center.x + (dx > 0 ? hw : -hw),
                        y: center.y + (dy / dx) * (dx > 0 ? hw : -hw)
                    };
                } else {
                    return {
                        x: center.x + (dx / dy) * (dy > 0 ? hh : -hh),
                        y: center.y + (dy > 0 ? hh : -hh)
                    };
                }
            };

            const start = getIntersection(fromCenter, toCenter, fromNode);
            const end = getIntersection(toCenter, fromCenter, toNode);

            // 轉換為視口座標（應用縮放和偏移）
            // 重要：SVG 層不應用 transform，而是手動計算座標
            const x1 = start.x * this.scale + this.offsetX;
            const y1 = start.y * this.scale + this.offsetY;
            const x2 = end.x * this.scale + this.offsetX;
            const y2 = end.y * this.scale + this.offsetY;

            // 創建路徑
            const pathEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            pathEl.setAttribute('d', `M ${x1} ${y1} L ${x2} ${y2}`);

            const lineColor = conn.color || '#2c3e50';
            pathEl.setAttribute('stroke', lineColor);
            pathEl.setAttribute('stroke-width', '2');
            pathEl.setAttribute('fill', 'none');

            // 箭頭類型（使用對應顏色的marker）
            const colorId = lineColor.replace('#', '');
            if (conn.arrowType === 'single') {
                pathEl.setAttribute('marker-end', `url(#arrowhead-${colorId})`);
            } else if (conn.arrowType === 'double') {
                pathEl.setAttribute('marker-start', `url(#arrowhead-double-${colorId})`);
                pathEl.setAttribute('marker-end', `url(#arrowhead-${colorId})`);
            }

            this.svgLayer.appendChild(pathEl);

            // 標籤
            if (conn.label) {
                const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                text.setAttribute('x', (x1 + x2) / 2);
                text.setAttribute('y', (y1 + y2) / 2 - 5);
                text.setAttribute('text-anchor', 'middle');
                text.setAttribute('font-size', 12 * this.scale);
                text.setAttribute('class', 'connection-label');
                text.textContent = conn.label;
                this.svgLayer.appendChild(text);
            }
        });
    }

    // 應用變換
    applyTransform() {
        this.canvas.style.transform =
            `translate(${this.offsetX}px, ${this.offsetY}px) scale(${this.scale})`;
        this.updateSVGSize();
        this.updateConnections();
    }

    // 更新 SVG 尺寸
    updateSVGSize() {
        const containerRect = this.container.getBoundingClientRect();
        this.svgLayer.setAttribute('width', containerRect.width);
        this.svgLayer.setAttribute('height', containerRect.height);
    }

    // 處理滾輪縮放
    handleWheel(e) {
        e.preventDefault();

        const rect = this.container.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const oldScale = this.scale;
        const zoomSpeed = 0.001;
        this.scale *= (1 - e.deltaY * zoomSpeed);
        this.scale = Math.max(0.1, Math.min(5, this.scale));

        // 以滑鼠位置為中心縮放
        const scaleChange = this.scale / oldScale;
        this.offsetX = mouseX - (mouseX - this.offsetX) * scaleChange;
        this.offsetY = mouseY - (mouseY - this.offsetY) * scaleChange;

        this.applyTransform();
    }

    // 平移處理
    handleMouseDown(e) {
        this.isPanning = true;
        this.panStart = { x: e.clientX - this.offsetX, y: e.clientY - this.offsetY };
        this.container.classList.add('panning');
    }

    handleMouseMove(e) {
        if (!this.isPanning) return;
        this.offsetX = e.clientX - this.panStart.x;
        this.offsetY = e.clientY - this.panStart.y;
        this.applyTransform();
    }

    handleMouseUp() {
        this.isPanning = false;
        this.container.classList.remove('panning');
    }

    // 視窗調整
    handleResize() {
        this.updateSVGSize();
        this.updateConnections();
    }
}
```

## 🖼️ Favicon 引用規範

### 標準配置

Map 檔使用外部 favicon 檔案引用：

```html
<link rel="icon" type="image/png" href="./concept-crafter_icon.png">
```

### 檔案要求

| 項目 | 要求 |
|------|------|
| 檔案名稱 | `concept-crafter_icon.png` |
| 檔案位置 | 與 Map 檔在同一目錄 |
| 檔案格式 | PNG |
| 建議尺寸 | 128x128 像素 |
| 來源 | `.claude/concept-crafter_icon.png` |

### 使用內定圖標

```javascript
// Node.js: 複製內定圖標到專案目錄
const fs = require('fs');
const path = require('path');

function setupFavicon(targetDir) {
    const source = '.claude/concept-crafter_icon.png';
    const dest = path.join(targetDir, 'concept-crafter_icon.png');
    fs.copyFileSync(source, dest);
    console.log(`Icon copied to ${dest}`);
}

// 使用範例
setupFavicon('./my-project');
```

### 使用自訂圖標

若使用者提供自訂圖標：

**處理流程：**
1. 確認是 PNG 格式
2. 重新命名為 `concept-crafter_icon.png`
3. 放置在與 Map 檔相同目錄
4. 建議（非強制）調整為 128x128 像素

**實作範例：**
```javascript
function processCustomIcon(userIconPath, targetDir) {
    const fs = require('fs');
    const path = require('path');

    const dest = path.join(targetDir, 'concept-crafter_icon.png');

    // 驗證格式
    if (!userIconPath.endsWith('.png')) {
        console.warn('建議使用 PNG 格式以支援透明背景');
    }

    // 複製檔案
    fs.copyFileSync(userIconPath, dest);
    console.log(`Custom icon saved as ${dest}`);
}
```

### 可選：圖片縮放

若圖片過大，可選擇性縮放：

```python
# Python + Pillow
from PIL import Image

def resize_icon(icon_path, size=128):
    img = Image.open(icon_path)
    img_resized = img.resize((size, size), Image.LANCZOS)
    img_resized.save(icon_path, 'PNG', optimize=True)

resize_icon('concept-crafter_icon.png')
```

**注意：** 縮放非必需，瀏覽器會自動調整 favicon 尺寸。

## ✅ 驗證清單

生成的 Map 檔必須滿足：

- [ ] 是單一的 HTML 檔案
- [ ] 包含完整的 CSS（含 `box-sizing: border-box`）
- [ ] 包含 base64 編碼的 favicon
- [ ] 包含 `<script id="map-data">` 數據區塊
- [ ] 包含完整的 MapViewer 類實現
- [ ] 可在瀏覽器中獨立運行
- [ ] 支援平移和縮放
- [ ] 正確渲染節點、框架、連接線
- [ ] 連接線不會深入節點內部
- [ ] 無 JavaScript 錯誤

## 📏 建議的預設值

```javascript
const DEFAULTS = {
    node: {
        width: 200,
        height: 100,
        color: '#3498db',
        textAlign: 'center'
    },
    frame: {
        borderColor: '#95a5a6',
        bgColor: 'rgba(149, 165, 166, 0.1)',
        zIndex: 0
    },
    connection: {
        color: '#2c3e50',
        arrowType: 'single'
    },
    viewer: {
        scale: 1,
        offsetX: 0,
        offsetY: 0
    }
};
```
