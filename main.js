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
        icon: path.join(__dirname, 'concept-crafter_icon.png')
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

        // 讀取原始 128x128 PNG 文件
        const iconBuffer = await fs.readFile(iconPath);

        // 使用 nativeImage 創建圖像並調整大小為 32x32
        // 這樣既保持原圖質量又大幅減小文件大小
        const { nativeImage } = require('electron');
        const image = nativeImage.createFromBuffer(iconBuffer);
        const resized = image.resize({ width: 32, height: 32 });

        // 轉換為 PNG buffer 並編碼為 base64
        const resizedBuffer = resized.toPNG();
        const base64Data = resizedBuffer.toString('base64');
        const dataURL = `data:image/png;base64,${base64Data}`;

        return dataURL;
    } catch (error) {
        console.error('生成 favicon 失敗:', error);
        // 如果失敗，返回一個內置的小 favicon 作為備用
        const fallbackFavicon = 'iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAA7AAAAOwBeShxvQAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAGNSURBVFiF7ZaxSsNQFIa/k6bBVkEEBwdHJ0cHwUkXX8A36ODo6iO4+ALi4OQTODm4ODk5uDg4CIIgVkFqbY3JdTC9kJCbJE1vA/nhhJzcnPM55/6X3ID/QAvYAY6BK+ABGABDYAR8AJ/ALXAOnAFHwCGwXzWnNYhR5wU4ATqVMDOEDngEusCeJaE5zRL8CGxaklmCW4BPQfBd4MqSzBzcCL6n+HchOPxYAGu2hJQCOIC1X/gqOICNX/hx7wJscR8L3vu4ys2V58AB+0vg6cPjBbI/BNpF8nqADXwHaJnAUwS/FQ1vJcOLVsMWPke0FubwMbAn6a0gI/gEuM7TPgKa+CYziS1a9CzwE3yr6z7Q8N3l+h7wJerPh87h8FNxqDX6JPAh8FN8Y0qmY7gf/8Hb+HbO2iC9wHtAT/AtoQ9U9UKaCLxvSE4F1p3AY5y3VQrW08oW8AZcCt4RdFV8y/UEvLbw3QG7wHYO28Z3xAHgRdD3eXJfBX6qZ0LX+CpZIjZw5UG/AN5k5vcAemOvAAAAAElFTkSuQmCC';
        return `data:image/png;base64,${fallbackFavicon}`;
    }
});
