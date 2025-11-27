import { generateId, parseLinks, htmlToText } from '../utils/helpers.js';

/**
 * 節點類別
 * 表示概念地圖中的一個節點
 */
export class Node {
    constructor(data = {}) {
        this.id = data.id || generateId();
        this.x = data.x || 0;
        this.y = data.y || 0;
        this.width = data.width || 180;
        this.height = data.height || 120;
        this.content = data.content || '新節點';
        this.status = data.status || 'normal'; // 'normal', 'complete', 'abandoned'
        this.links = data.links || []; // 富文字中的超連結資訊
    }

    /**
     * 渲染節點到 SVG
     */
    render(svgGroup) {
        // 清除現有內容
        svgGroup.innerHTML = '';
        svgGroup.setAttribute('class', 'node');
        svgGroup.setAttribute('data-id', this.id);
        svgGroup.setAttribute('transform', `translate(${this.x}, ${this.y})`);

        // 節點矩形
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('class', `node-rect status-${this.status}`);
        rect.setAttribute('width', this.width);
        rect.setAttribute('height', this.height);
        svgGroup.appendChild(rect);

        // 狀態圖示（背景浮水印）
        if (this.status !== 'normal') {
            const statusIcon = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            statusIcon.setAttribute('class', 'node-status-icon');
            statusIcon.setAttribute('x', this.width / 2);
            statusIcon.setAttribute('y', this.height / 2 + 20);
            statusIcon.setAttribute('text-anchor', 'middle');
            statusIcon.textContent = this.status === 'complete' ? '✓' : '✗';
            svgGroup.appendChild(statusIcon);
        }

        // 富文字內容（使用 foreignObject）
        const foreignObject = document.createElementNS('http://www.w3.org/2000/svg', 'foreignObject');
        foreignObject.setAttribute('width', this.width);
        foreignObject.setAttribute('height', this.height);

        const contentDiv = document.createElement('div');
        contentDiv.setAttribute('class', 'node-content');
        contentDiv.setAttribute('xmlns', 'http://www.w3.org/1999/xhtml');
        contentDiv.innerHTML = parseLinks(this.content);

        // 處理超連結點擊事件
        contentDiv.querySelectorAll('a.node-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const url = link.getAttribute('data-url');
                this.handleLinkClick(url);
            });
        });

        foreignObject.appendChild(contentDiv);
        svgGroup.appendChild(foreignObject);

        return svgGroup;
    }

    /**
     * 處理連結點擊
     */
    handleLinkClick(url) {
        if (url.startsWith('http://') || url.startsWith('https://')) {
            // 外部連結
            window.open(url, '_blank');
        } else if (url.startsWith('node:')) {
            // 節點內部連結
            const nodeId = url.replace('node:', '');
            window.dispatchEvent(new CustomEvent('navigate-to-node', { detail: { nodeId } }));
        } else if (url.endsWith('.html')) {
            // 其他專案檔案
            window.dispatchEvent(new CustomEvent('open-file', { detail: { filename: url } }));
        }
    }

    /**
     * 檢查點是否在節點內
     */
    containsPoint(x, y) {
        return x >= this.x && x <= this.x + this.width &&
            y >= this.y && y <= this.y + this.height;
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
        this.width = Math.max(100, width);
        this.height = Math.max(60, height);
    }

    /**
     * 更新內容
     */
    updateContent(content) {
        this.content = content;
    }

    /**
     * 更新狀態
     */
    updateStatus(status) {
        if (['normal', 'complete', 'abandoned'].includes(status)) {
            this.status = status;
        }
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
        const cx = this.x + this.width / 2;
        const cy = this.y + this.height / 2;
        const angle = Math.atan2(targetY - cy, targetX - cx);

        // 簡化版本：返回矩形邊緣上最接近目標的點
        const w = this.width / 2;
        const h = this.height / 2;
        const dx = Math.abs(w * Math.cos(angle));
        const dy = Math.abs(h * Math.sin(angle));

        if (w / dx < h / dy) {
            return {
                x: cx + (targetX > cx ? w : -w),
                y: cy + (targetX > cx ? w : -w) * Math.tan(angle)
            };
        } else {
            return {
                x: cx + (targetY > cy ? h : -h) / Math.tan(angle),
                y: cy + (targetY > cy ? h : -h)
            };
        }
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
            content: this.content,
            status: this.status,
            links: this.links
        };
    }

    /**
     * 從 JSON 建立節點
     */
    static fromJSON(data) {
        return new Node(data);
    }
}
