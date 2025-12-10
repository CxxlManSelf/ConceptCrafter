const { app, BrowserWindow, dialog, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs').promises;

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false
        },
        icon: path.join(__dirname, 'icon.png')
    });

    mainWindow.loadFile('concept-crafter.html');

    // 開發模式下開啟開發者工具
    // mainWindow.webContents.openDevTools();

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

// 當 Electron 完成初始化時
app.whenReady().then(createWindow);

// 當所有視窗都關閉時
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// 在 macOS 上點擊 dock 圖示時重新建立視窗
app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

// ==================== IPC 處理器 ====================

// 取得應用程式所在目錄
ipcMain.handle('get-app-path', () => {
    return __dirname;
});

// 選擇專案資料夾
ipcMain.handle('select-folder', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openDirectory'],
        title: '選擇專案資料夾'
    });

    if (result.canceled) {
        return null;
    }

    return result.filePaths[0];
});

// 讀取資料夾內的檔案列表
ipcMain.handle('read-folder', async (event, folderPath) => {
    try {
        const files = await fs.readdir(folderPath);
        // 只返回 .html 檔案
        return files.filter(f => f.endsWith('.html') || f.endsWith('.htm'));
    } catch (err) {
        console.error('讀取資料夾失敗:', err);
        return [];
    }
});

// 讀取檔案內容
ipcMain.handle('read-file', async (event, filePath) => {
    try {
        return await fs.readFile(filePath, 'utf-8');
    } catch (err) {
        console.error('讀取檔案失敗:', err);
        throw err;
    }
});

// 寫入檔案
ipcMain.handle('write-file', async (event, filePath, content) => {
    try {
        await fs.writeFile(filePath, content, 'utf-8');
        return { success: true };
    } catch (err) {
        console.error('寫入檔案失敗:', err);
        return { success: false, error: err.message };
    }
});

// 刪除檔案
ipcMain.handle('delete-file', async (event, filePath) => {
    try {
        await fs.unlink(filePath);
        return { success: true };
    } catch (err) {
        console.error('刪除檔案失敗:', err);
        return { success: false, error: err.message };
    }
});

// 檢查檔案是否存在
ipcMain.handle('file-exists', async (event, filePath) => {
    try {
        await fs.access(filePath);
        return true;
    } catch {
        return false;
    }
});

// 取得檔案路徑分隔符號
ipcMain.handle('get-path-separator', () => {
    return path.sep;
});

// 選擇單一檔案
ipcMain.handle('select-file', async (event, options = {}) => {
    const dialogOptions = {
        properties: ['openFile'],
        filters: options.filters || [
            { name: 'HTML Files', extensions: ['html', 'htm'] }
        ],
        title: options.title || '選擇檔案'
    };

    // 如果提供了 defaultPath，設定預設路徑
    if (options.defaultPath) {
        dialogOptions.defaultPath = options.defaultPath;
    }

    const result = await dialog.showOpenDialog(mainWindow, dialogOptions);

    if (result.canceled) {
        return null;
    }

    return result.filePaths[0];
});

// 另存新檔對話框
ipcMain.handle('save-file-dialog', async (event, defaultPath) => {
    const result = await dialog.showSaveDialog(mainWindow, {
        defaultPath: defaultPath,
        filters: [
            { name: 'HTML Files', extensions: ['html'] }
        ],
        title: '另存新檔'
    });

    if (result.canceled) {
        return null;
    }

    return result.filePath;
});

// 生成 favicon data URL (128x128)
// 註：這裡直接使用原始 PNG 文件，不調整大小
// 瀏覽器會自動縮放 favicon 到合適的大小
ipcMain.handle('generate-favicon', async () => {
    try {
        const iconPath = path.join(__dirname, 'concept-crafter_icon.png');

        // 讀取 PNG 文件
        const iconBuffer = await fs.readFile(iconPath);

        // 轉換為 base64 data URL
        const base64Data = iconBuffer.toString('base64');
        const dataURL = `data:image/png;base64,${base64Data}`;

        return dataURL;
    } catch (error) {
        console.error('生成 favicon 失敗:', error);
        return null;
    }
});
