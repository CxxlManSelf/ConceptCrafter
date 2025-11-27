// ========== 輔助函數 ==========

/**
 * 生成唯一 ID
 */
export function generateId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 座標轉換 - 螢幕座標轉 SVG 座標
 */
export function screenToSVG(svg, screenX, screenY) {
    const pt = svg.createSVGPoint();
    pt.x = screenX;
    pt.y = screenY;
    return pt.matrixTransform(svg.getScreenCTM().inverse());
}

/**
 * 計算兩點之間的距離
 */
export function distance(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

/**
 * 計算點到矩形的最近邊緣點
 */
export function getClosestPointOnRect(px, py, rx, ry, rw, rh) {
    const cx = rx + rw / 2;
    const cy = ry + rh / 2;
    
    // 計算從中心到目標點的角度
    const angle = Math.atan2(py - cy, px - cx);
    
    // 計算矩形邊界點
    const edges = [
        { x: rx + rw, y: cy + Math.tan(angle) * (rw / 2) }, // 右邊
        { x: rx, y: cy - Math.tan(angle) * (rw / 2) },      // 左邊
        { x: cx + (rh / 2) / Math.tan(angle), y: ry + rh }, // 下邊
        { x: cx - (rh / 2) / Math.tan(angle), y: ry }       // 上邊
    ];
    
    // 找出有效且最近的邊緣點
    let closest = null;
    let minDist = Infinity;
    
    edges.forEach(edge => {
        if (edge.x >= rx && edge.x <= rx + rw && edge.y >= ry && edge.y <= ry + rh) {
            const dist = distance(px, py, edge.x, edge.y);
            if (dist < minDist) {
                minDist = dist;
                closest = edge;
            }
        }
    });
    
    return closest || { x: cx, y: cy };
}

/**
 * 檢查矩形是否重疊
 */
export function rectsOverlap(r1, r2) {
    return !(r2.x > r1.x + r1.width ||
             r2.x + r2.width < r1.x ||
             r2.y > r1.y + r1.height ||
             r2.y + r2.height < r1.y);
}

/**
 * 檢查點是否在矩形內
 */
export function pointInRect(px, py, rx, ry, rw, rh) {
    return px >= rx && px <= rx + rw && py >= ry && py <= ry + rh;
}

/**
 * 轉義 HTML
 */
export function escapeHTML(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * 解析連結文字中的超連結
 * 格式: [文字](url)
 */
export function parseLinks(text) {
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    let html = escapeHTML(text);
    html = html.replace(linkRegex, '<a href="$2" class="node-link" data-url="$2">$1</a>');
    return html;
}

/**
 * 將 HTML 轉回帶連結的純文字
 */
export function htmlToText(html) {
    const temp = document.createElement('div');
    temp.innerHTML = html;
    
    // 將 <a> 標籤轉換回 [text](url) 格式
    temp.querySelectorAll('a.node-link').forEach(link => {
        const url = link.getAttribute('data-url') || link.href;
        link.replaceWith(`[${link.textContent}](${url})`);
    });
    
    return temp.textContent;
}

/**
 * 防抖函數
 */
export function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * 限流函數
 */
export function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * 深度複製物件
 */
export function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
}

/**
 * 計算調整大小控制點的位置
 */
export function getResizeHandles(x, y, width, height) {
    const handleSize = 8;
    return {
        nw: { x: x - handleSize/2, y: y - handleSize/2, cursor: 'nwse-resize' },
        n:  { x: x + width/2 - handleSize/2, y: y - handleSize/2, cursor: 'ns-resize' },
        ne: { x: x + width - handleSize/2, y: y - handleSize/2, cursor: 'nesw-resize' },
        e:  { x: x + width - handleSize/2, y: y + height/2 - handleSize/2, cursor: 'ew-resize' },
        se: { x: x + width - handleSize/2, y: y + height - handleSize/2, cursor: 'nwse-resize' },
        s:  { x: x + width/2 - handleSize/2, y: y + height - handleSize/2, cursor: 'ns-resize' },
        sw: { x: x - handleSize/2, y: y + height - handleSize/2, cursor: 'nesw-resize' },
        w:  { x: x - handleSize/2, y: y + height/2 - handleSize/2, cursor: 'ew-resize' }
    };
}
