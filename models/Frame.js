import { generateId, getClosestPointOnRect } from '../utils/helpers.js';

/**
 * Frame 類別
 * 用於群組節點的容器
 */
export class Frame {
    constructor(data = {}) {
        this.id = data.id || generateId();
        this.x = data.x || 0;
        this.y = data.y || 0;
        this.width = data.width || 300;
        this.height = data.height || 200;
        this.label = data.label || '新群組';
        this.nodes = data.nodes || []; // 包含的節點 ID 列表
    }

    /**
     * 渲染 Frame 到 SVG
     */
    render(svgGroup) {
        // 清除現有內容
        svgGroup.innerHTML = '';
        svgGroup.setAttribute('class', 'frame');
        svgGroup.setAttribute('data-id', this.id);
        svgGroup.setAttribute('transform', `translate(${this.x}, ${this.y})`);

        // Frame 矩形
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('class', 'frame-rect');
        rect.setAttribute('width', this.width);
        rect.setAttribute('height', this.height);
        svgGroup.appendChild(rect);

        // 標籤
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('class', 'frame-label');
        text.setAttribute('x', 10);
        text.setAttribute('y', 24);
        text.textContent = this.label;
        svgGroup.appendChild(text);

        return svgGroup;
    }

    /**
     * 檢查點是否在 Frame 內
     */
    containsPoint(x, y) {
        return x >= this.x && x <= this.x + this.width &&
            y >= this.y && y <= this.y + this.height;
    }

    /**
     * 檢查矩形是否完全在 Frame 內
     */
    containsRect(rect) {
        return rect.x >= this.x &&
            rect.x + rect.width <= this.x + this.width &&
            rect.y >= this.y &&
            rect.y + rect.height <= this.y + this.height;
    }

    /**
     * 更新位置
     */
    moveTo(x, y) {
        this.x = x;
        this.y = y;
    }

    /**
     * 調整大小
     */
    resize(width, height) {
        this.width = Math.max(200, width);
        this.height = Math.max(100, height);
    }

    /**
     * 更新標籤
     */
    updateLabel(label) {
        this.label = label;
    }

    /**
     * 獲取中心點
     */
    getCenter() {
        return {
            x: this.x + this.width / 2,
            y: this.y + this.height / 2
        };
    }

    /**
     * 獲取邊界框
     */
    getBounds() {
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height
        };
    }

    /**
     * 取得連接點（用於連接線）
     */
    getConnectionPoint(targetX, targetY) {
        // 使用輔助函數計算矩形邊緣上的最近點
        return getClosestPointOnRect(targetX, targetY, this.x, this.y, this.width, this.height);
    }

    /**
     * 轉換為 JSON
     */
    toJSON() {
        return {
            id: this.id,
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height,
            label: this.label,
            nodes: this.nodes
        };
    }

    /**
     * 從 JSON 建立 Frame
     */
    static fromJSON(data) {
        return new Frame(data);
    }
}
