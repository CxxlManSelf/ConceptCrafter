/**
 * 工具列元件
 * 負責處理工具切換和檔案操作
 */
export class Toolbar {
    constructor(container, app) {
        this.container = container;
        this.app = app;

        this.initEvents();
    }

    initEvents() {
        // 工具按鈕
        this.container.querySelectorAll('.tool-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const tool = btn.dataset.tool;
                this.app.canvas.setTool(tool);
            });
        });

        // 檔案操作
        document.getElementById('openFolderBtn').addEventListener('click', () => {
            this.app.openProjectFolder();
        });
        document.getElementById('saveBtn').addEventListener('click', () => this.app.saveCurrentFile());
        document.getElementById('newFileBtn').addEventListener('click', () => this.app.createNewFile());

        // 縮放控制
        document.getElementById('zoomInBtn').addEventListener('click', () => this.app.canvas.zoom(0.1));
        document.getElementById('zoomOutBtn').addEventListener('click', () => this.app.canvas.zoom(-0.1));
        document.getElementById('zoomResetBtn').addEventListener('click', () => {
            this.app.canvas.scale = 1;
            this.app.canvas.panX = 0;
            this.app.canvas.panY = 0;
            this.app.canvas.updateTransform();
            this.updateZoomDisplay(1);
        });

        // 監聽縮放變更
        window.addEventListener('zoom-change', (e) => {
            this.updateZoomDisplay(e.detail.scale);
        });

        // 鍵盤快捷鍵
        window.addEventListener('keydown', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

            switch (e.key.toLowerCase()) {
                case 'v': this.app.canvas.setTool('select'); break;
                case 'n': this.app.canvas.setTool('node'); break;
                case 'c': this.app.canvas.setTool('connection'); break;
                case 'f': this.app.canvas.setTool('frame'); break;
                case 's':
                    if (e.ctrlKey) {
                        e.preventDefault();
                        this.app.saveCurrentFile();
                    }
                    break;
            }
        });
    }

    updateZoomDisplay(scale) {
        document.getElementById('zoomDisplay').textContent = `${Math.round(scale * 100)}%`;
    }

    updateFileButtons(hasFile) {
        document.getElementById('saveBtn').disabled = !hasFile;
        document.getElementById('newFileBtn').disabled = false; // 開啟資料夾後總是允許建立新檔
    }
}
