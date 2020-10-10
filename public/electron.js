const {app, BrowserWindow, Menu, shell, Tray, globalShortcut, ipcMain,nativeImage} = require('electron')
const path = require('path');
const os = require('os');

let win;
let tray;
const gotTheLock = app.requestSingleInstanceLock()
const winTitle = "管控平台文件下载器"
const PROTOCOL = "itms-download-manager"
let protocolData = null;

// 创建浏览器窗口
function createWindow() {
    // 隐藏菜单栏
    Menu.setApplicationMenu(null);
    win = new BrowserWindow({
        width: 920,
        height: 550,
        minWidth: 800,
        minHeight: 400,
        center: true,
        titleBarStyle: 'hiddenInset',
        show: false,
        frame: process.platform === 'darwin', // 无边框窗口
        title: winTitle,
        backgroundColor: '#2e2c29',
        webPreferences: {
            webSecurity: false,
            enableRemoteModule: true,
            nodeIntegration: true,
            nodeIntegrationInWorker: true,
        }
    })

    if (app.isPackaged) {
        win.loadURL(`file://${__dirname}/index.html`);
    } else {
        win.loadURL('http://localhost:3000');
    }

    //当页面在窗口中直接加载时，用户会看到未完成的页面，这不是一个好的原生应用的体验。为了让画面显示时没有视觉闪烁,使用以下解决方案
    //在加载页面时，渲染进程第一次完成绘制时，如果窗口还没有被显示，渲染进程会发出 ready-to-show 事件 。 在此事件后显示窗口将没有视觉闪烁
    win.once('ready-to-show', () => {
        win.show();

        // 参数最后一项包含自定义协议的
        let argv = process.argv;
        if (argv[argv.length - 1].indexOf(PROTOCOL + "://") > -1) {
            processSend(process.argv);
        }

        if (protocolData){
            processSend(protocolData);
            protocolData = null
        }
    })
}

function creatTray() {
    if (process.platform === 'darwin') {
        const image = nativeImage.createFromPath(path.join(__dirname, 'icons/tray@2x.png'));
        image.setTemplateImage(true)
        tray = new Tray(image);
    } else {
        tray = new Tray(path.join(__dirname, 'icons/win.ico'));
    }

    tray.setToolTip(winTitle);

    let contextMenu = Menu.buildFromTemplate([
        {
            label: '关于',
            click: function () {
                let aboutWin = new BrowserWindow({
                    width: 600,
                    height: 400,
                    titleBarStyle: 'hiddenInset',
                    center: true,
                    resizable: false,
                    title: '关于',
                    parent: win
                });
                aboutWin.loadURL(`file://${__dirname}/about.html`)
            },
        },
        {
            type: 'separator'
        },
        {
            role: 'quit',
            label: '退出'
        }
    ]);

    tray.on('right-click', () => {
        tray.popUpContextMenu(contextMenu)
    })

    tray.on('click', () => {
        if (win === null) {
            createWindow()
        } else {
            if (win.isVisible() && !win.isFocused()) {
                win.focus();
            } else {
                win.isVisible() ? win.hide() : win.show();
            }
        }
    });
}


if (!gotTheLock) {
    app.quit()
} else {

    // 添加 arg 参数为当前目录只为对 Windows 环境下生效
    app.setAsDefaultProtocolClient(PROTOCOL, process.execPath, [`${__dirname}`]);

    // 当运行第二个实例时
    app.on('second-instance', (event, commandLine, workingDirectory) => {
        if (win) {
            if (win.isMinimized()) win.restore()
            //显示并聚焦于窗口
            win.show();
            processSend(commandLine)
        }
    })

    // macOS 下使用协议打开应用
    app.on('open-url', (event, urlStr) => {
        if (win) {
            if (win.isMinimized()) win.restore()
            //显示并聚焦于窗口
            win.show();
            processSend(urlStr);
        } else {
            protocolData = urlStr
        }
    });

    app.whenReady()
        .then(createWindow)
        .then(creatTray)
        .then(() => {
            globalShortcut.register('CommandOrControl+Alt+Shift+F12', () => {
                // 打开控制台
                win.webContents.isDevToolsOpened() ? win.webContents.closeDevTools() : win.webContents.openDevTools();
            })
            globalShortcut.register('CommandOrControl+Alt+Shift+T', () => {
                // 打开临时目录
                shell.showItemInFolder(os.tmpdir() + path.sep + PROTOCOL)
            })
        })

    //当所有窗口都被关闭后退出
    app.on('window-all-closed', () => {
        app.quit();
    })

    app.on('activate', () => {
        // 在macOS上，当单击dock图标并且没有其他窗口打开时，
        // 通常在应用程序中重新创建一个窗口。
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow()
        }
        win.show() || win.isFocused() || win.focus();
    })
}


function processSend(message) {
    win.webContents.send('open-protocol', message);
}