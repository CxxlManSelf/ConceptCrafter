/**
 * 專案管理服務
 * 負責處理檔案系統操作和專案管理
 */
export class ProjectManager {
    constructor() {
        this.directoryHandle = null;
        this.currentFileHandle = null;
        this.projectFiles = [];
    }

    /**
     * 檢查瀏覽器是否支援 File System Access API
     */
    isSupported() {
        return 'showDirectoryPicker' in window;
    }

    /**
     * 開啟專案資料夾
     */
    async openProjectFolder() {
        try {
            this.directoryHandle = await window.showDirectoryPicker({
                mode: 'readwrite'
            });

            await this.refreshFileList();
            return {
                name: this.directoryHandle.name,
                files: this.projectFiles
            };
        } catch (error) {
            console.error('開啟資料夾失敗:', error);
            throw error;
        }
    }

    /**
     * 重新整理檔案列表
     */
    async refreshFileList() {
        if (!this.directoryHandle) return;

        this.projectFiles = [];
        for await (const entry of this.directoryHandle.values()) {
            if (entry.kind === 'file' && entry.name.endsWith('.html')) {
                this.projectFiles.push(entry.name);
            }
        }
        // 排序檔案列表
        this.projectFiles.sort();
        return this.projectFiles;
    }

    /**
     * 建立新檔案
     */
    async createNewFile(filename, content) {
        if (!this.directoryHandle) throw new Error('未開啟專案資料夾');

        try {
            // 確保檔名以 .html 結尾
            if (!filename.endsWith('.html')) {
                filename += '.html';
            }

            const fileHandle = await this.directoryHandle.getFileHandle(filename, { create: true });
            const writable = await fileHandle.createWritable();
            await writable.write(content);
            await writable.close();

            this.currentFileHandle = fileHandle;
            await this.refreshFileList();
            return filename;
        } catch (error) {
            console.error('建立檔案失敗:', error);
            throw error;
        }
    }

    /**
     * 讀取檔案
     */
    async readFile(filename) {
        if (!this.directoryHandle) throw new Error('未開啟專案資料夾');

        try {
            const fileHandle = await this.directoryHandle.getFileHandle(filename);
            const file = await fileHandle.getFile();
            const content = await file.text();

            this.currentFileHandle = fileHandle;
            return content;
        } catch (error) {
            console.error('讀取檔案失敗:', error);
            throw error;
        }
    }

    /**
     * 儲存當前檔案
     */
    async saveCurrentFile(content) {
        if (!this.currentFileHandle) throw new Error('未開啟檔案');

        try {
            const writable = await this.currentFileHandle.createWritable();
            await writable.write(content);
            await writable.close();
            return true;
        } catch (error) {
            console.error('儲存檔案失敗:', error);
            throw error;
        }
    }

    /**
     * 另存新檔
     */
    async saveAs(filename, content) {
        return this.createNewFile(filename, content);
    }

    /**
     * 獲取當前檔案名稱
     */
    getCurrentFileName() {
        return this.currentFileHandle ? this.currentFileHandle.name : null;
    }

    /**
     * 獲取當前資料夾名稱
     */
    getProjectName() {
        return this.directoryHandle ? this.directoryHandle.name : null;
    }
}
