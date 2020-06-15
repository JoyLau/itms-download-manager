const { app, BrowserWindow, Menu, shell,
    Tray, globalShortcut, ipcMain } = require('electron')

function createWindow () {
    // 创建浏览器窗口
    let win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true
        }
    })

    // 加载index.html文件
    win.loadURL('http://127.0.0.1:3000')
    win.webContents.openDevTools()
}

app.whenReady().then(createWindow)