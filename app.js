import { ProjectManager } from './services/ProjectManager.js';
import { ExportService } from './services/ExportService.js';
import { Canvas } from './components/Canvas.js';
import { Toolbar } from './components/Toolbar.js';
import { Sidebar } from './components/Sidebar.js';
import { Node } from './models/Node.js';

class App {
    constructor() {
        this.projectManager = new ProjectManager();
        this.exportService = new ExportService();

        this.canvas = new Canvas(
            document.getElementById('canvas'),
            document.getElementById('canvasContainer')
        );

        this.toolbar = new Toolbar(
            document.querySelector('.toolbar'),
            this
        );

        this.sidebar = new Sidebar(
            document.getElementById('sidebar'),
            this
        );

        this.contextMenu = document.getElementById('contextMenu');
        this.dialogContainer = document.getElementById('dialogContainer');

        this.initEvents();
        this.checkBrowserSupport();
    }

    initEvents() {
        // 畫布事件監聽
        this.canvas.onSelectionChange = (elements) => {
            this.sidebar.showProperties(elements);
        };

        this.canvas.onDataChange = () => {
            // 資料變更時，可以自動儲存或標記為未儲存
            // 這裡暫時只更新標題或其他 UI
        };

        // 導航事件
        window.addEventListener('navigate-to-node', (e) => {
            const nodeId = e.detail.nodeId;
            const node = this.canvas.nodes.find(n => n.id === nodeId);
            if (node) {
                this.canvas.select(node);
                // 平移到節點位置
                const center = node.getCenter();
                this.canvas.zoom(0, center.x, center.y); // 保持縮放，只平移
                // 這裡需要計算平移量使節點居中，暫時簡化
            }
        });

        window.addEventListener('open-file', (e) => {
            this.loadFile(e.detail.filename);
        });

        // 右鍵選單
        document.getElementById('canvasContainer').addEventListener('contextmenu', (e) => {
            e.preventDefault();
            if (this.canvas.selectedElements.length > 0) {
                this.showContextMenu(e.clientX, e.clientY);
            }
        });

        document.addEventListener('click', (e) => {
            if (!e.target.closest('.context-menu')) {
                this.hideContextMenu();
            }
        });

        // 右鍵選單動作
        this.contextMenu.querySelectorAll('.context-menu-item').forEach(item => {
            item.addEventListener('click', () => {
                const action = item.dataset.action;
                this.handleContextMenuAction(action);
                this.hideContextMenu();
            });
        });

        // 視窗關閉前提示
        window.addEventListener('beforeunload', (e) => {
            // 如果有未儲存的更改，可以提示
            // e.preventDefault();
            // e.returnValue = '';
        });
    }

    checkBrowserSupport() {
        if (!this.projectManager.isSupported()) {
            alert('您的瀏覽器不支援 File System Access API，請使用 Chrome 或 Edge 以獲得完整體驗。');
        }
    }

    async openProjectFolder() {
        try {
            const project = await this.projectManager.openProjectFolder();
            this.sidebar.updateProjectInfo(project.name, project.files, null);
            this.toolbar.updateFileButtons(false);

            // 如果有檔案，自動開啟第一個
            if (project.files.length > 0) {
                await this.loadFile(project.files[0]);
            } else {
                // 如果是空資料夾，建立一個新檔案
                await this.createNewFile('新概念地圖');
            }
        } catch (error) {
            if (error.name !== 'AbortError') {
                alert('開啟資料夾失敗: ' + error.message);
            }
        }
    }

    async loadFile(filename) {
        try {
            const content = await this.projectManager.readFile(filename);
            const data = this.exportService.parseHTML(content);

            this.canvas.loadData(data);
            this.sidebar.updateProjectInfo(
                this.projectManager.getProjectName(),
                this.projectManager.projectFiles,
                filename
            );
            this.toolbar.updateFileButtons(true);
            document.title = `${filename} - Concept Crafter`;
        } catch (error) {
            console.error('載入檔案失敗:', error);
            alert('載入檔案失敗: ' + error.message);
        }
    }

    async saveCurrentFile() {
        try {
            const data = this.canvas.getData();
            const filename = this.projectManager.getCurrentFileName();
            const htmlContent = this.exportService.generateHTML(data, filename.replace('.html', ''));

            await this.projectManager.saveCurrentFile(htmlContent);

            // 視覺回饋
            const saveBtn = document.getElementById('saveBtn');
            const originalText = saveBtn.textContent;
            saveBtn.textContent = '已儲存!';
            setTimeout(() => saveBtn.textContent = originalText, 2000);
        } catch (error) {
            console.error('儲存檔案失敗:', error);
            alert('儲存檔案失敗: ' + error.message);
        }
    }

    async createNewFile(defaultName = '未命名') {
        const filename = prompt('請輸入新檔案名稱:', defaultName);
        if (!filename) return;

        try {
            const emptyData = { nodes: [], connections: [], frames: [] };
            const htmlContent = this.exportService.generateHTML(emptyData, filename);

            const newFilename = await this.projectManager.createNewFile(filename, htmlContent);
            await this.loadFile(newFilename);
        } catch (error) {
            console.error('建立檔案失敗:', error);
            alert('建立檔案失敗: ' + error.message);
        }
    }

    showContextMenu(x, y) {
        this.contextMenu.style.display = 'block';
        this.contextMenu.style.left = `${x}px`;
        this.contextMenu.style.top = `${y}px`;

        // 根據選中元素調整選單項目
        const selected = this.canvas.selectedElements[0];
        const isNode = selected instanceof Node;

        this.contextMenu.querySelectorAll('[data-action^="status-"]').forEach(el => {
            el.style.display = isNode ? 'block' : 'none';
        });

        this.contextMenu.querySelector('[data-action="link"]').style.display = isNode ? 'block' : 'none';
    }

    hideContextMenu() {
        this.contextMenu.style.display = 'none';
    }

    handleContextMenuAction(action) {
        const selected = this.canvas.selectedElements;
        if (selected.length === 0) return;

        switch (action) {
            case 'delete':
                this.canvas.deleteSelected();
                break;
            case 'edit':
                // 觸發側邊欄編輯
                this.sidebar.showProperties(selected);
                // 如果是節點，聚焦到編輯器
                if (selected[0] instanceof Node) {
                    const editor = document.querySelector('.rich-text-editor');
                    if (editor) editor.focus();
                }
                break;
            case 'link':
                // 提示使用者在側邊欄設定連結
                alert('請在右側屬性面板中選取文字並設定連結');
                this.sidebar.showProperties(selected);
                break;
            case 'status-normal':
            case 'status-complete':
            case 'status-abandoned':
                const status = action.replace('status-', '');
                selected.forEach(el => {
                    if (el instanceof Node) el.updateStatus(status);
                });
                this.canvas.render();
                this.canvas.notifyDataChange();
                // 同步更新側邊欄
                this.sidebar.showProperties(selected);
                break;
        }
    }
}

// 啟動應用程式
try {
    window.app = new App();
} catch (e) {
    console.error('App 初始化失敗:', e);
    alert('App 初始化失敗: ' + e.message);
}
