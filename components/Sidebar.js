import { Node } from '../models/Node.js';
import { Connection } from '../models/Connection.js';
import { Frame } from '../models/Frame.js';

/**
 * 側邊欄元件
 * 負責顯示專案資訊和屬性編輯
 */
export class Sidebar {
    constructor(container, app) {
        this.container = container;
        this.app = app;

        this.projectInfo = document.getElementById('projectInfo');
        this.fileList = document.getElementById('fileList');
        this.propertiesPanel = document.getElementById('propertiesPanel');
        this.propertiesContent = document.getElementById('propertiesContent');
    }

    /**
     * 更新專案資訊
     */
    updateProjectInfo(projectName, files, currentFile) {
        this.projectInfo.innerHTML = `
            <div class="project-path" title="${projectName}">📂 ${projectName}</div>
        `;

        this.fileList.innerHTML = '';
        files.forEach(file => {
            const item = document.createElement('div');
            item.className = `file-item ${file === currentFile ? 'active' : ''}`;
            item.textContent = file.replace('.html', '');
            item.title = file;
            item.addEventListener('click', () => {
                if (file !== currentFile) {
                    this.app.loadFile(file);
                }
            });
            this.fileList.appendChild(item);
        });
    }

    /**
     * 顯示屬性編輯器
     */
    showProperties(elements) {
        if (!elements || elements.length === 0) {
            this.propertiesPanel.style.display = 'none';
            return;
        }

        this.propertiesPanel.style.display = 'block';
        this.propertiesContent.innerHTML = '';

        if (elements.length > 1) {
            this.propertiesContent.innerHTML = '<p class="hint">已選擇多個物件</p>';
            return;
        }

        const element = elements[0];

        if (element instanceof Node) {
            this.renderNodeProperties(element);
        } else if (element instanceof Connection) {
            this.renderConnectionProperties(element);
        } else if (element instanceof Frame) {
            this.renderFrameProperties(element);
        }
    }

    /**
     * 渲染節點屬性
     */
    renderNodeProperties(node) {
        // 狀態選擇
        const statusGroup = this.createFormGroup('狀態');
        const statusSelect = document.createElement('select');
        statusSelect.innerHTML = `
            <option value="normal" ${node.status === 'normal' ? 'selected' : ''}>⭕ 正常</option>
            <option value="complete" ${node.status === 'complete' ? 'selected' : ''}>✅ 已完成</option>
            <option value="abandoned" ${node.status === 'abandoned' ? 'selected' : ''}>❌ 已放棄</option>
        `;
        statusSelect.addEventListener('change', (e) => {
            node.updateStatus(e.target.value);
            this.app.canvas.render();
            this.app.canvas.notifyDataChange();
        });
        statusGroup.appendChild(statusSelect);
        this.propertiesContent.appendChild(statusGroup);

        // 內容編輯 (Rich Text)
        const contentGroup = this.createFormGroup('內容');

        // 工具列
        const toolbar = document.createElement('div');
        toolbar.style.marginBottom = '4px';
        toolbar.style.display = 'flex';
        toolbar.style.gap = '4px';

        const linkBtn = document.createElement('button');
        linkBtn.className = 'btn btn-icon';
        linkBtn.style.width = '24px';
        linkBtn.style.height = '24px';
        linkBtn.style.fontSize = '12px';
        linkBtn.innerHTML = '🔗';
        linkBtn.title = '插入連結';
        toolbar.appendChild(linkBtn);

        contentGroup.appendChild(toolbar);

        // 編輯區
        const editor = document.createElement('div');
        editor.className = 'rich-text-editor';
        editor.contentEditable = true;
        editor.style.minHeight = '100px';
        editor.style.background = 'var(--bg-tertiary)';
        editor.style.border = '1px solid var(--border-color)';
        editor.style.borderRadius = '6px';
        editor.style.padding = '8px';
        editor.style.fontSize = '14px';
        editor.style.color = 'var(--text-primary)';
        editor.innerHTML = node.content; // 這裡可能需要處理 HTML 安全性，但在本地應用中暫時信任

        // 處理輸入
        editor.addEventListener('input', () => {
            node.updateContent(editor.innerHTML);
            this.app.canvas.render(); // 即時更新
            this.app.canvas.notifyDataChange();
        });

        // 處理連結插入
        linkBtn.addEventListener('click', () => {
            const selection = window.getSelection();
            if (selection.rangeCount > 0 && editor.contains(selection.anchorNode)) {
                const url = prompt('請輸入連結網址 (http://..., node:ID, filename.html):', 'http://');
                if (url) {
                    document.execCommand('createLink', false, url);
                    // 為新建立的連結添加 class
                    const links = editor.querySelectorAll('a:not(.node-link)');
                    links.forEach(link => {
                        link.classList.add('node-link');
                        link.setAttribute('data-url', url);
                    });
                    node.updateContent(editor.innerHTML);
                    this.app.canvas.render();
                    this.app.canvas.notifyDataChange();
                }
            } else {
                alert('請先選取要設定連結的文字');
            }
        });

        contentGroup.appendChild(editor);
        this.propertiesContent.appendChild(contentGroup);

        // 尺寸資訊 (唯讀)
        const sizeInfo = document.createElement('div');
        sizeInfo.className = 'hint';
        sizeInfo.style.marginTop = '8px';
        sizeInfo.textContent = `尺寸: ${Math.round(node.width)} x ${Math.round(node.height)}`;
        this.propertiesContent.appendChild(sizeInfo);
    }

    /**
     * 渲染連接線屬性
     */
    renderConnectionProperties(connection) {
        // 標籤
        const labelGroup = this.createFormGroup('標籤');
        const labelInput = document.createElement('input');
        labelInput.type = 'text';
        labelInput.value = connection.label;
        labelInput.addEventListener('input', (e) => {
            connection.update({ label: e.target.value });
            this.app.canvas.render();
            this.app.canvas.notifyDataChange();
        });
        labelGroup.appendChild(labelInput);
        this.propertiesContent.appendChild(labelGroup);

        // 箭頭類型
        const arrowGroup = this.createFormGroup('箭頭樣式');
        const arrowSelect = document.createElement('select');
        arrowSelect.innerHTML = `
            <option value="none" ${connection.arrowType === 'none' ? 'selected' : ''}>無箭頭</option>
            <option value="end" ${connection.arrowType === 'end' ? 'selected' : ''}>單向 (終點)</option>
            <option value="start" ${connection.arrowType === 'start' ? 'selected' : ''}>單向 (起點)</option>
            <option value="both" ${connection.arrowType === 'both' ? 'selected' : ''}>雙向</option>
        `;
        arrowSelect.addEventListener('change', (e) => {
            connection.update({ arrowType: e.target.value });
            this.app.canvas.render();
            this.app.canvas.notifyDataChange();
        });
        arrowGroup.appendChild(arrowSelect);
        this.propertiesContent.appendChild(arrowGroup);

        // 線條類型
        const typeGroup = this.createFormGroup('線條類型');
        const typeSelect = document.createElement('select');
        typeSelect.innerHTML = `
            <option value="straight" ${connection.type === 'straight' ? 'selected' : ''}>直線</option>
            <option value="curved" ${connection.type === 'curved' ? 'selected' : ''}>曲線</option>
        `;
        typeSelect.addEventListener('change', (e) => {
            connection.update({ type: e.target.value });
            this.app.canvas.render();
            this.app.canvas.notifyDataChange();
        });
        typeGroup.appendChild(typeSelect);
        this.propertiesContent.appendChild(typeGroup);
    }

    /**
     * 渲染 Frame 屬性
     */
    renderFrameProperties(frame) {
        // 標籤
        const labelGroup = this.createFormGroup('標籤');
        const labelInput = document.createElement('input');
        labelInput.type = 'text';
        labelInput.value = frame.label;
        labelInput.addEventListener('input', (e) => {
            frame.updateLabel(e.target.value);
            this.app.canvas.render();
            this.app.canvas.notifyDataChange();
        });
        labelGroup.appendChild(labelInput);
        this.propertiesContent.appendChild(labelGroup);
    }

    /**
     * 建立表單群組
     */
    createFormGroup(label) {
        const group = document.createElement('div');
        group.className = 'form-group';
        const labelEl = document.createElement('label');
        labelEl.textContent = label;
        group.appendChild(labelEl);
        return group;
    }
}
