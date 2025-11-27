import { generateId } from '../utils/helpers.js';

/**
 * 連接線類別
 * 表示節點或 Frame 之間的連接
 */
export class Connection {
    constructor(data = {}) {
        this.id = data.id || generateId();
        this.sourceId = data.sourceId || null;
        this.targetId = data.targetId || null;
        this.label = data.label || '';
        this.arrowType = data.arrowType || 'end'; // 'none', 'start', 'end', 'both'
        this.type = data.type || 'straight'; // 'straight', 'curved'
    }

    /**
     * 渲染連接線到 SVG
     */
    render(svgGroup, sourceElement, targetElement) {
        if (!sourceElement || !targetElement) return;

        // 清除現有內容
        svgGroup.innerHTML = '';
        svgGroup.setAttribute('class', 'connection');
        svgGroup.setAttribute('data-id', this.id);

        // 計算連接點
        const sourceCenter = sourceElement.getCenter();
        const targetCenter = targetElement.getCenter();

        const startPoint = sourceElement.getConnectionPoint(targetCenter.x, targetCenter.y);
        const endPoint = targetElement.getConnectionPoint(sourceCenter.x, sourceCenter.y);

        // 繪製線條
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('class', 'connection-line');

        let d = '';
        if (this.type === 'curved') {
            // 貝茲曲線
            const dx = endPoint.x - startPoint.x;
            const dy = endPoint.y - startPoint.y;
            const controlPoint1 = { x: startPoint.x + dx * 0.5, y: startPoint.y };
            const controlPoint2 = { x: endPoint.x - dx * 0.5, y: endPoint.y };
            d = `M ${startPoint.x} ${startPoint.y} C ${controlPoint1.x} ${controlPoint1.y}, ${controlPoint2.x} ${controlPoint2.y}, ${endPoint.x} ${endPoint.y}`;
        } else {
            // 直線
            d = `M ${startPoint.x} ${startPoint.y} L ${endPoint.x} ${endPoint.y}`;
        }

        path.setAttribute('d', d);

        // 設定箭頭
        if (this.arrowType === 'end' || this.arrowType === 'both') {
            path.setAttribute('marker-end', 'url(#arrowhead)');
        }
        if (this.arrowType === 'start' || this.arrowType === 'both') {
            path.setAttribute('marker-start', 'url(#arrowhead)');
        }

        svgGroup.appendChild(path);

        // 繪製標籤
        if (this.label) {
            const midX = (startPoint.x + endPoint.x) / 2;
            const midY = (startPoint.y + endPoint.y) / 2;

            // 標籤背景
            const textBg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            // 這裡需要先計算文字寬度，暫時用估算值
            const textWidth = this.label.length * 8 + 10;
            textBg.setAttribute('x', midX - textWidth / 2);
            textBg.setAttribute('y', midY - 10);
            textBg.setAttribute('width', textWidth);
            textBg.setAttribute('height', 20);
            textBg.setAttribute('fill', '#242424');
            textBg.setAttribute('rx', 4);
            svgGroup.appendChild(textBg);

            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', midX);
            text.setAttribute('y', midY);
            text.setAttribute('dy', '0.3em');
            text.setAttribute('text-anchor', 'middle');
            text.setAttribute('fill', '#e0e0e0');
            text.setAttribute('font-size', '12px');
            text.textContent = this.label;
            svgGroup.appendChild(text);
        }

        // 隱形點擊區域（增加點擊範圍）
        const hitArea = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        hitArea.setAttribute('d', d);
        hitArea.setAttribute('stroke', 'transparent');
        hitArea.setAttribute('stroke-width', '10');
        hitArea.setAttribute('fill', 'none');
        hitArea.style.cursor = 'pointer';
        svgGroup.appendChild(hitArea);

        return svgGroup;
    }

    /**
     * 更新屬性
     */
    update(data) {
        if (data.label !== undefined) this.label = data.label;
        if (data.arrowType !== undefined) this.arrowType = data.arrowType;
        if (data.type !== undefined) this.type = data.type;
    }

    /**
     * 轉換為 JSON
     */
    toJSON() {
        return {
            id: this.id,
            sourceId: this.sourceId,
            targetId: this.targetId,
            label: this.label,
            arrowType: this.arrowType,
            type: this.type
        };
    }

    /**
     * 從 JSON 建立連接線
     */
    static fromJSON(data) {
        return new Connection(data);
    }
}
