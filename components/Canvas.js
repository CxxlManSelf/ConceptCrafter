import { screenToSVG, getResizeHandles, rectsOverlap } from '../utils/helpers.js';
import { Node } from '../models/Node.js';
import { Connection } from '../models/Connection.js';
import { Frame } from '../models/Frame.js';

/**
 * 畫布元件
 * 負責處理 SVG 繪圖和使用者互動
 */
export class Canvas {
    constructor(svgElement, containerElement) {
        this.svg = svgElement;
        this.container = containerElement;

        // 圖層
        this.frameLayer = svgElement.getElementById('frameLayer');
        this.connectionLayer = svgElement.getElementById('connectionLayer');
        this.nodeLayer = svgElement.getElementById('nodeLayer');
        this.selectionLayer = svgElement.getElementById('selectionLayer');

        // 狀態
        this.scale = 1;
        this.panX = 0;
        this.panY = 0;
        this.isPanning = false;
        this.isDragging = false;
        this.isResizing = false;
        this.isConnecting = false;

        this.startPoint = { x: 0, y: 0 };
        this.lastPoint = { x: 0, y: 0 };

        this.selectedElements = [];
        this.hoveredElement = null;
        this.resizeHandle = null;

        this.currentTool = 'select'; // select, node, connection, frame

        // 資料
        this.nodes = [];
        this.connections = [];
        this.frames = [];

        // 事件回調
        this.onSelectionChange = null;
        this.onDataChange = null;

        this.initEvents();
        this.updateTransform();
    }

    /**
     * 初始化事件監聽
     */
    initEvents() {
        // 滑鼠事件
        this.container.addEventListener('mousedown', this.handleMouseDown.bind(this));
        window.addEventListener('mousemove', this.handleMouseMove.bind(this));
        window.addEventListener('mouseup', this.handleMouseUp.bind(this));

        // 滾輪縮放
        this.container.addEventListener('wheel', this.handleWheel.bind(this), { passive: false });

        // 鍵盤事件（刪除、平移）
        window.addEventListener('keydown', this.handleKeyDown.bind(this));
        window.addEventListener('keyup', this.handleKeyUp.bind(this));
    }

    /**
     * 載入資料
     */
    loadData(data) {
        this.nodes = data.nodes.map(n => Node.fromJSON(n));
        this.connections = data.connections.map(c => Connection.fromJSON(c));
        this.frames = data.frames.map(f => Frame.fromJSON(f));
        this.render();
    }

    /**
     * 獲取資料
     */
    getData() {
        return {
            nodes: this.nodes.map(n => n.toJSON()),
            connections: this.connections.map(c => c.toJSON()),
            frames: this.frames.map(f => f.toJSON())
        };
    }

    /**
     * 渲染所有內容
     */
    render() {
        // 渲染 Frames
        this.frameLayer.innerHTML = '';
        this.frames.forEach(frame => {
            const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            frame.render(g);
            this.frameLayer.appendChild(g);
        });

        // 渲染 Nodes
        this.nodeLayer.innerHTML = '';
        this.nodes.forEach(node => {
            const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            node.render(g);
            this.nodeLayer.appendChild(g);
        });

        // 渲染 Connections
        this.connectionLayer.innerHTML = '';
        this.connections.forEach(conn => {
            const source = this.getElement(conn.sourceId);
            const target = this.getElement(conn.targetId);
            if (source && target) {
                const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
                conn.render(g, source, target);
                this.connectionLayer.appendChild(g);
            }
        });

        this.updateSelectionUI();
    }

    /**
     * 獲取元素（Node 或 Frame）
     */
    getElement(id) {
        return this.nodes.find(n => n.id === id) || this.frames.find(f => f.id === id);
    }

    /**
     * 更新變換（縮放和平移）
     */
    updateTransform() {
        // 更新網格背景
        const pattern = this.svg.querySelector('#grid');
        if (pattern) {
            pattern.setAttribute('x', this.panX);
            pattern.setAttribute('y', this.panY);
            pattern.setAttribute('width', 20 * this.scale);
            pattern.setAttribute('height', 20 * this.scale);
            pattern.querySelector('path').setAttribute('d', `M ${20 * this.scale} 0 L 0 0 0 ${20 * this.scale}`);
        }

        // 應用變換到圖層
        const transform = `translate(${this.panX}, ${this.panY}) scale(${this.scale})`;
        this.frameLayer.setAttribute('transform', transform);
        this.connectionLayer.setAttribute('transform', transform);
        this.nodeLayer.setAttribute('transform', transform);
        this.selectionLayer.setAttribute('transform', transform);
    }

    /**
     * 處理滑鼠按下
     */
    handleMouseDown(e) {
        // 檢查是否點擊了連結
        if (e.target.tagName === 'A' || e.target.closest('a')) return;

        const pt = screenToSVG(this.svg, e.clientX, e.clientY);
        // 轉換為世界座標（考慮平移和縮放）
        const worldX = (pt.x - this.panX) / this.scale;
        const worldY = (pt.y - this.panY) / this.scale;

        this.startPoint = { x: e.clientX, y: e.clientY };
        this.lastPoint = { x: e.clientX, y: e.clientY };

        // 空白鍵平移
        if (e.code === 'Space' || e.button === 1 || (this.currentTool === 'select' && e.target === this.svg)) {
            this.isPanning = true;
            this.container.style.cursor = 'grabbing';
            return;
        }

        // 工具處理
        if (this.currentTool === 'node') {
            this.createNode(worldX, worldY);
            this.setTool('select'); // 建立後切換回選擇工具
            return;
        } else if (this.currentTool === 'frame') {
            this.createFrame(worldX, worldY);
            this.setTool('select');
            return;
        }

        // 點擊元素檢測
        const clickedElement = this.hitTest(worldX, worldY);

        // 調整大小控制點檢測
        if (this.selectedElements.length === 1 && !this.isConnecting) {
            const handle = this.hitTestResizeHandles(worldX, worldY, this.selectedElements[0]);
            if (handle) {
                this.isResizing = true;
                this.resizeHandle = handle;
                this.container.style.cursor = handle.cursor;
                return;
            }
        }

        if (clickedElement) {
            if (this.currentTool === 'connection') {
                this.isConnecting = true;
                this.connectionStart = clickedElement;
                this.tempConnectionLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                this.tempConnectionLine.setAttribute('stroke', '#64b5f6');
                this.tempConnectionLine.setAttribute('stroke-width', '2');
                this.tempConnectionLine.setAttribute('stroke-dasharray', '5,5');
                this.selectionLayer.appendChild(this.tempConnectionLine);
            } else {
                // 選擇邏輯
                if (!e.ctrlKey) {
                    if (!this.selectedElements.includes(clickedElement)) {
                        this.select(clickedElement);
                    }
                } else {
                    this.toggleSelect(clickedElement);
                }

                this.isDragging = true;
                this.container.style.cursor = 'move';
            }
        } else {
            // 點擊空白處，清除選擇
            if (!e.ctrlKey) {
                this.deselectAll();
            }
            // 可以實作框選功能，這裡暫時省略
            if (this.currentTool === 'select') {
                this.isPanning = true; // 點擊空白處預設為平移
                this.container.style.cursor = 'grabbing';
            }
        }
    }

    /**
     * 處理滑鼠移動
     */
    handleMouseMove(e) {
        const dx = e.clientX - this.lastPoint.x;
        const dy = e.clientY - this.lastPoint.y;
        this.lastPoint = { x: e.clientX, y: e.clientY };

        if (this.isPanning) {
            this.panX += dx;
            this.panY += dy;
            this.updateTransform();
            return;
        }

        const pt = screenToSVG(this.svg, e.clientX, e.clientY);
        const worldX = (pt.x - this.panX) / this.scale;
        const worldY = (pt.y - this.panY) / this.scale;

        if (this.isDragging) {
            // 移動選中的元素
            this.selectedElements.forEach(el => {
                el.moveTo(el.x + dx / this.scale, el.y + dy / this.scale);

                // 如果是 Frame，同時移動內部的節點
                if (el instanceof Frame) {
                    el.nodes.forEach(nodeId => {
                        const node = this.nodes.find(n => n.id === nodeId);
                        if (node && !this.selectedElements.includes(node)) {
                            node.moveTo(node.x + dx / this.scale, node.y + dy / this.scale);
                        }
                    });
                }
            });
            this.render(); // 重新渲染以更新連接線
        } else if (this.isResizing && this.selectedElements.length === 1) {
            // 調整大小
            const el = this.selectedElements[0];
            const handle = this.resizeHandle;

            let newX = el.x;
            let newY = el.y;
            let newW = el.width;
            let newH = el.height;

            const deltaX = dx / this.scale;
            const deltaY = dy / this.scale;

            if (handle.type.includes('e')) newW += deltaX;
            if (handle.type.includes('w')) { newX += deltaX; newW -= deltaX; }
            if (handle.type.includes('s')) newH += deltaY;
            if (handle.type.includes('n')) { newY += deltaY; newH -= deltaY; }

            if (newW >= 50 && newH >= 50) {
                el.x = newX;
                el.y = newY;
                el.resize(newW, newH);
                this.render();
            }
        } else if (this.isConnecting) {
            // 更新臨時連接線
            const startCenter = this.connectionStart.getCenter();
            this.tempConnectionLine.setAttribute('x1', startCenter.x);
            this.tempConnectionLine.setAttribute('y1', startCenter.y);
            this.tempConnectionLine.setAttribute('x2', worldX);
            this.tempConnectionLine.setAttribute('y2', worldY);
        }
    }

    /**
     * 處理滑鼠放開
     */
    handleMouseUp(e) {
        if (this.isPanning) {
            this.isPanning = false;
            this.container.style.cursor = 'default';
        } else if (this.isDragging) {
            this.isDragging = false;
            this.container.style.cursor = 'default';
            this.notifyDataChange();

            // 檢查節點是否被拖入 Frame
            this.checkFrameInclusion();
        } else if (this.isResizing) {
            this.isResizing = false;
            this.resizeHandle = null;
            this.container.style.cursor = 'default';
            this.notifyDataChange();
        } else if (this.isConnecting) {
            this.isConnecting = false;
            this.selectionLayer.removeChild(this.tempConnectionLine);
            this.tempConnectionLine = null;

            const pt = screenToSVG(this.svg, e.clientX, e.clientY);
            const worldX = (pt.x - this.panX) / this.scale;
            const worldY = (pt.y - this.panY) / this.scale;
            const target = this.hitTest(worldX, worldY);

            if (target && target !== this.connectionStart) {
                this.createConnection(this.connectionStart, target);
                this.setTool('select');
            }
        }
    }

    /**
     * 處理滾輪縮放
     */
    handleWheel(e) {
        if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            const delta = -Math.sign(e.deltaY) * 0.1;
            this.zoom(delta, e.clientX, e.clientY);
        } else {
            // 一般滾動平移
            e.preventDefault();
            this.panX -= e.deltaX;
            this.panY -= e.deltaY;
            this.updateTransform();
        }
    }

    /**
     * 縮放功能
     */
    zoom(delta, centerX, centerY) {
        const oldScale = this.scale;
        let newScale = oldScale + delta;
        newScale = Math.max(0.1, Math.min(5, newScale)); // 限制縮放範圍

        // 以滑鼠為中心縮放
        if (centerX !== undefined && centerY !== undefined) {
            const pt = screenToSVG(this.svg, centerX, centerY);
            this.panX = pt.x - (pt.x - this.panX) * (newScale / oldScale);
            this.panY = pt.y - (pt.y - this.panY) * (newScale / oldScale);
        }

        this.scale = newScale;
        this.updateTransform();

        // 發送縮放事件
        window.dispatchEvent(new CustomEvent('zoom-change', { detail: { scale: this.scale } }));
    }

    /**
     * 鍵盤事件
     */
    handleKeyDown(e) {
        if (e.key === 'Delete' || e.key === 'Backspace') {
            if (document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
                this.deleteSelected();
            }
        } else if (e.code === 'Space') {
            if (!this.isDragging && !this.isResizing) {
                this.container.style.cursor = 'grab';
            }
        }
    }

    handleKeyUp(e) {
        if (e.code === 'Space') {
            if (!this.isPanning) {
                this.container.style.cursor = 'default';
            }
        }
    }

    /**
     * 點擊測試
     */
    hitTest(x, y) {
        // 反向遍歷，先檢查最上層的元素
        // Nodes
        for (let i = this.nodes.length - 1; i >= 0; i--) {
            if (this.nodes[i].containsPoint(x, y)) return this.nodes[i];
        }
        // Frames
        for (let i = this.frames.length - 1; i >= 0; i--) {
            if (this.frames[i].containsPoint(x, y)) return this.frames[i];
        }
        // Connections (可以增加點擊檢測)
        return null;
    }

    /**
     * 調整大小控制點測試
     */
    hitTestResizeHandles(x, y, element) {
        const handles = getResizeHandles(element.x, element.y, element.width, element.height);
        const handleSize = 10 / this.scale; // 根據縮放調整點擊範圍

        for (const [key, handle] of Object.entries(handles)) {
            if (x >= handle.x && x <= handle.x + handleSize &&
                y >= handle.y && y <= handle.y + handleSize) {
                return { type: key, cursor: handle.cursor };
            }
        }
        return null;
    }

    /**
     * 選擇功能
     */
    select(element) {
        this.selectedElements = [element];
        this.updateSelectionUI();
        if (this.onSelectionChange) this.onSelectionChange(this.selectedElements);
    }

    toggleSelect(element) {
        const index = this.selectedElements.indexOf(element);
        if (index >= 0) {
            this.selectedElements.splice(index, 1);
        } else {
            this.selectedElements.push(element);
        }
        this.updateSelectionUI();
        if (this.onSelectionChange) this.onSelectionChange(this.selectedElements);
    }

    deselectAll() {
        this.selectedElements = [];
        this.updateSelectionUI();
        if (this.onSelectionChange) this.onSelectionChange([]);
    }

    /**
     * 更新選擇 UI
     */
    updateSelectionUI() {
        this.selectionLayer.innerHTML = '';

        // 更新元素本身的選中狀態
        this.svg.querySelectorAll('.selected').forEach(el => el.classList.remove('selected'));

        this.selectedElements.forEach(el => {
            const elNode = this.svg.querySelector(`[data-id="${el.id}"]`);
            if (elNode) {
                const rect = elNode.querySelector('rect, path');
                if (rect) rect.classList.add('selected');
            }

            // 繪製調整大小控制點
            if (this.selectedElements.length === 1 && (el instanceof Node || el instanceof Frame)) {
                const handles = getResizeHandles(el.x, el.y, el.width, el.height);
                const handleSize = 8 / this.scale;

                for (const handle of Object.values(handles)) {
                    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                    rect.setAttribute('x', handle.x);
                    rect.setAttribute('y', handle.y);
                    rect.setAttribute('width', handleSize);
                    rect.setAttribute('height', handleSize);
                    rect.setAttribute('fill', '#fff');
                    rect.setAttribute('stroke', '#64b5f6');
                    rect.setAttribute('stroke-width', 1 / this.scale);
                    this.selectionLayer.appendChild(rect);
                }
            }
        });
    }

    /**
     * 建立節點
     */
    createNode(x, y) {
        const node = new Node({ x: x - 90, y: y - 60 });
        this.nodes.push(node);
        this.render();
        this.select(node);
        this.notifyDataChange();

        // 檢查是否在 Frame 內
        this.checkFrameInclusion();
    }

    /**
     * 建立 Frame
     */
    createFrame(x, y) {
        const frame = new Frame({ x: x - 150, y: y - 100 });
        this.frames.push(frame);
        this.render();
        this.select(frame);
        this.notifyDataChange();

        // 檢查包含的節點
        this.checkFrameInclusion();
    }

    /**
     * 建立連接
     */
    createConnection(source, target) {
        const connection = new Connection({
            sourceId: source.id,
            targetId: target.id
        });
        this.connections.push(connection);
        this.render();
        this.notifyDataChange();
    }

    /**
     * 刪除選中項目
     */
    deleteSelected() {
        if (this.selectedElements.length === 0) return;

        this.selectedElements.forEach(el => {
            if (el instanceof Node) {
                this.nodes = this.nodes.filter(n => n.id !== el.id);
                // 刪除相關連接
                this.connections = this.connections.filter(c => c.sourceId !== el.id && c.targetId !== el.id);
                // 從 Frame 中移除
                this.frames.forEach(f => {
                    f.nodes = f.nodes.filter(nid => nid !== el.id);
                });
            } else if (el instanceof Frame) {
                this.frames = this.frames.filter(f => f.id !== el.id);
                // 刪除相關連接
                this.connections = this.connections.filter(c => c.sourceId !== el.id && c.targetId !== el.id);
            } else if (el instanceof Connection) {
                this.connections = this.connections.filter(c => c.id !== el.id);
            }
        });

        this.deselectAll();
        this.render();
        this.notifyDataChange();
    }

    /**
     * 檢查 Frame 包含關係
     */
    checkFrameInclusion() {
        let changed = false;
        this.frames.forEach(frame => {
            const oldNodes = [...frame.nodes];
            frame.nodes = [];

            this.nodes.forEach(node => {
                const nodeBounds = node.getBounds();
                if (frame.containsRect(nodeBounds)) {
                    frame.nodes.push(node.id);
                }
            });

            if (JSON.stringify(oldNodes.sort()) !== JSON.stringify(frame.nodes.sort())) {
                changed = true;
            }
        });

        if (changed) {
            this.notifyDataChange();
        }
    }

    /**
     * 設定工具
     */
    setTool(tool) {
        this.currentTool = tool;
        this.container.style.cursor = tool === 'select' ? 'default' : 'crosshair';

        // 更新 UI 狀態
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tool === tool);
        });
    }

    /**
     * 通知資料變更
     */
    notifyDataChange() {
        if (this.onDataChange) this.onDataChange();
    }
}
