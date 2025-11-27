/**
 * 匯出服務
 * 負責產生和解析包含概念地圖資料的 HTML 檔案
 */
export class ExportService {
    constructor() {
        this.styles = '';
        this.loadStyles();
    }

    /**
     * 載入樣式表內容
     */
    async loadStyles() {
        try {
            const response = await fetch('styles.css');
            this.styles = await response.text();
        } catch (error) {
            console.error('載入樣式失敗:', error);
            // 如果失敗，使用預設樣式或保持空白
        }
    }

    /**
     * 產生 HTML 內容
     */
    generateHTML(data, title = 'Concept Map') {
        const jsonString = JSON.stringify(data, null, 2);
        const safeJsonString = jsonString.replace(/<\/script>/g, '<\\/script>');

        return `<!DOCTYPE html>
<html lang="zh-TW">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        ${this.styles}
        /* 檢視模式的額外樣式 */
        body { overflow: auto; }
        .canvas-container { position: absolute; top: 0; left: 0; width: 100%; height: 100%; }
        .toolbar, .sidebar { display: none; } /* 預設隱藏編輯介面 */
    </style>
</head>
<body>
    <div class="canvas-container">
        <svg id="canvas" class="canvas">
            <defs>
                <marker id="arrowhead" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                    <polygon points="0 0, 10 3, 0 6" fill="#64b5f6"/>
                </marker>
            </defs>
            <g id="frameLayer"></g>
            <g id="connectionLayer"></g>
            <g id="nodeLayer"></g>
        </svg>
    </div>

    <!-- 嵌入資料 -->
    <script id="concept-map-data" type="application/json">
        ${safeJsonString}
    </script>

    <!-- 簡易檢視器腳本 -->
    <script>
        document.addEventListener('DOMContentLoaded', () => {
            try {
                const dataElement = document.getElementById('concept-map-data');
                const data = JSON.parse(dataElement.textContent);
                renderMap(data);
            } catch (e) {
                console.error('渲染地圖失敗:', e);
            }
        });

        function renderMap(data) {
            const svg = document.getElementById('canvas');
            const frameLayer = document.getElementById('frameLayer');
            const connectionLayer = document.getElementById('connectionLayer');
            const nodeLayer = document.getElementById('nodeLayer');

            // 設定畫布大小（根據內容）
            // 這裡簡化處理，實際可能需要計算邊界
            
            // 渲染 Frames
            data.frames.forEach(frame => {
                const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
                g.setAttribute('transform', \`translate(\${frame.x}, \${frame.y})\`);
                g.innerHTML = \`
                    <rect class="frame-rect" width="\${frame.width}" height="\${frame.height}" rx="12" 
                          style="fill: rgba(100, 181, 246, 0.05); stroke: #64b5f6; stroke-width: 2; stroke-dasharray: 8, 4;"/>
                    <text class="frame-label" x="10" y="24" style="fill: #64b5f6; font-size: 16px; font-weight: 600;">\${frame.label}</text>
                \`;
                frameLayer.appendChild(g);
            });

            // 渲染 Nodes
            data.nodes.forEach(node => {
                const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
                g.setAttribute('transform', \`translate(\${node.x}, \${node.y})\`);
                
                let statusIcon = '';
                let statusClass = '';
                if (node.status === 'complete') {
                    statusIcon = '<text x="' + (node.width/2) + '" y="' + (node.height/2 + 20) + '" text-anchor="middle" style="font-size: 48px; opacity: 0.15; pointer-events: none;">✓</text>';
                    statusClass = 'status-complete';
                } else if (node.status === 'abandoned') {
                    statusIcon = '<text x="' + (node.width/2) + '" y="' + (node.height/2 + 20) + '" text-anchor="middle" style="font-size: 48px; opacity: 0.15; pointer-events: none;">✗</text>';
                    statusClass = 'status-abandoned';
                }

                let rectStyle = 'fill: #242424; stroke: #3d3d3d; stroke-width: 2;';
                if (node.status === 'complete') rectStyle = 'fill: #1b5e20; stroke: #81c784; stroke-width: 2;';
                if (node.status === 'abandoned') rectStyle = 'fill: #b71c1c; stroke: #e57373; stroke-width: 2;';

                // 處理連結
                let contentHtml = node.content;
                // 簡單的連結解析
                contentHtml = contentHtml.replace(/\\[([^\\]]+)\\]\\(([^)]+)\\)/g, '<a href="$2" style="color: #64b5f6; text-decoration: underline;">$1</a>');

                g.innerHTML = \`
                    <rect width="\${node.width}" height="\${node.height}" rx="8" style="\${rectStyle}"/>
                    \${statusIcon}
                    <foreignObject width="\${node.width}" height="\${node.height}">
                        <div xmlns="http://www.w3.org/1999/xhtml" style="padding: 12px; font-size: 14px; line-height: 1.4; color: #e0e0e0;">
                            \${contentHtml}
                        </div>
                    </foreignObject>
                \`;
                nodeLayer.appendChild(g);
            });

            // 渲染 Connections
            // 注意：這裡簡化了連接線的渲染，沒有重新計算連接點，而是假設資料中可能已經有了，或者需要簡單計算
            // 為了保持獨立檢視器的簡單性，我們可能需要依賴 app 在儲存前計算好路徑，或者在這裡重複一部分邏輯
            // 這裡我們簡單實作直線連接中心
            data.connections.forEach(conn => {
                const source = data.nodes.find(n => n.id === conn.sourceId) || data.frames.find(f => f.id === conn.sourceId);
                const target = data.nodes.find(n => n.id === conn.targetId) || data.frames.find(f => f.id === conn.targetId);
                
                if (source && target) {
                    const sx = source.x + source.width/2;
                    const sy = source.y + source.height/2;
                    const tx = target.x + target.width/2;
                    const ty = target.y + target.height/2;
                    
                    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                    path.setAttribute('d', \`M \${sx} \${sy} L \${tx} \${ty}\`);
                    path.setAttribute('style', 'fill: none; stroke: #64b5f6; stroke-width: 2;');
                    if (conn.arrowType === 'end' || conn.arrowType === 'both') path.setAttribute('marker-end', 'url(#arrowhead)');
                    
                    connectionLayer.appendChild(path);
                }
            });
        }
    </script>
</body>
</html>`;
    }

    /**
     * 解析 HTML 內容以獲取資料
     */
    parseHTML(htmlContent) {
        try {
            const parser = new DOMParser();
            const doc = parser.parseFromString(htmlContent, 'text/html');
            const script = doc.getElementById('concept-map-data');

            if (script && script.textContent) {
                return JSON.parse(script.textContent);
            }
            throw new Error('找不到資料標籤');
        } catch (error) {
            console.error('解析 HTML 失敗:', error);
            throw error;
        }
    }
}
