const {
    app, BrowserWindow, Menu, shell,
    Tray, globalShortcut, ipcMain
} = require('electron')

const config = require('../src/util/config')

let win
const gotTheLock = app.requestSingleInstanceLock()
const winTitle = config.winTitle
const PROTOCOL = config.PROTOCOL

// 创建浏览器窗口
function createWindow() {
    win = new BrowserWindow({
        width: 900,
        height: 600,
        minWidth: 900,
        minHeight: 600,
        center: true,
        titleBarStyle: 'hiddenInset',
        show: false,
        frame: process.platform === 'darwin', // 无边框窗口
        title: winTitle,
        backgroundColor: '#2e2c29',
        webPreferences: {
            nodeIntegration: true,
            nodeIntegrationInWorker: true
        }
    })

    if (app.isPackaged) {
        win.loadURL(`file://${__dirname}/build/index.html`);
    } else {
        win.loadURL('http://localhost:3000');
    }

    //当页面在窗口中直接加载时，用户会看到未完成的页面，这不是一个好的原生应用的体验。为了让画面显示时没有视觉闪烁,使用一下解决方案
    //在加载页面时，渲染进程第一次完成绘制时，如果窗口还没有被显示，渲染进程会发出 ready-to-show 事件 。 在此事件后显示窗口将没有视觉闪烁
    win.once('ready-to-show', () => {
        win.show()
    })
}


if (!gotTheLock) {
    app.quit()
} else {

    // 添加 arg 参数为当前目录只为对 Windows 环境下生效
    app.setAsDefaultProtocolClient(PROTOCOL, process.execPath, [`${__dirname}`]);

    // Windows
    app.on('second-instance', (event, commandLine, workingDirectory) => {
        // 当运行第二个实例时,将会聚焦到myWindow这个窗口
        if (win) {
            if (win.isMinimized()) win.restore()
            win.focus();
            win.show();
            processSend(commandLine)
        }
    })

    // macOS
    app.on('open-url', (event, urlStr) => {
        if (app.isPackaged){
            if (win) {
                win.showInactive();
            }
        } else {
            win.showInactive();
        }
        processSend(urlStr);
    });

    app.whenReady().then(createWindow)
        .then(() => {
            globalShortcut.register('CommandOrControl+Alt+Shift+F12', () => {
                // 打开控制台
                win.webContents.isDevToolsOpened() ? win.webContents.closeDevTools() : win.webContents.openDevTools();
            })
        })

    //当所有窗口都被关闭后退出
    app.on('window-all-closed', () => {
        // 在 macOS 上，除非用户用 Cmd + Q 确定地退出，
        // 否则绝大部分应用及其菜单栏会保持激活。
        if (process.platform !== 'darwin') {
            app.quit()
        }
    })

    app.on('activate', () => {
        // 在macOS上，当单击dock图标并且没有其他窗口打开时，
        // 通常在应用程序中重新创建一个窗口。
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow()
        }
    })
}


function processSend(message) {
    win.webContents.send('open-protocol', message);
}


//
// const {
//     ConsoleLogger,
//     DownloadEvent,
//     DownloadStatus,
//     DownloadTask,
//     DownloadTaskGroup,
//     FileDescriptor,
//     Logger,
//     requestMethodHeadFileInformationDescriptor,
//     CommonUtils
// } = require ('node-parallel-downloader');
// const crypto = require('crypto');
//
// // 设置不禁用log
// Logger.setDisabled(false);
// // 设置Logger的代理类
// Logger.setProxy(new ConsoleLogger());
//
//
// /**
//  * 正常下载流程
//  */
// async function example() {
//     // Logger.printStackTrace();
//     const taskGroup = await new DownloadTaskGroup()
//         .configConfigDir('./temp_info')
//         .configMaxWorkerCount(5)
//         .configProgressTicktockMillis(500)
//         .configTaskIdGenerator(async (downloadUrl, storageDir, filename) => {
//             return crypto.createHash('md5').update(downloadUrl).digest('hex');
//         })
//         .configFileInfoDescriptor(requestMethodHeadFileInformationDescriptor)
//         .configHttpRequestOptionsBuilder((requestOptions, taskId, index, from, to, progress) => {
//             return requestOptions;
//         })
//         .configRetryTimes(10000)
//         .configHttpTimeout(30000)
//         .loadFromConfigDir();
//
//     const task = await taskGroup.newTask(
//         'https://mirrors.aliyun.com/deepin-cd/15.11/deepin-15.11-amd64.iso',
//         '/Users/joylau/Desktop',
//         'CentOS-7-x86_64-Everything-1908.iso'
//     );
//
//     task.on(DownloadEvent.INITIALIZED, (descriptor) => {
//         Logger.debug('+++DownloadEvent.INITIALIZED:', task.getStatus(), '任务创建直到完成, 只会调用一次');
//     }).on(DownloadEvent.STARTED, (descriptor) => {
//         Logger.debug('+++DownloadEvent.STARTED:', task.getStatus());
//     }).on(DownloadEvent.DOWNLOADING, (descriptor) => {
//         Logger.debug('+++DownloadEvent.DOWNLOADING:', task.getStatus());
//     }).on(DownloadEvent.STOPPED, (descriptor) => {
//         Logger.debug('+++DownloadEvent.STOPPED:', task.getStatus());
//     }).on(DownloadEvent.PROGRESS, (descriptor, progress) => {
//         const ticktock = progress.ticktock;
//         const beautified = CommonUtils.beautifyProgress(progress, ticktock);
//         const chunks = [];
//         progress.chunks.forEach((chunkProgress) => {
//             const beautifiedChunk = CommonUtils.beautifyProgress(chunkProgress, ticktock);
//             beautifiedChunk.noResp = chunkProgress.noResp;
//             beautifiedChunk.retry = chunkProgress.retry;
//             chunks.push(beautifiedChunk);
//         });
//         beautified.chunks = chunks;
//         Logger.debug('+++DownloadEvent.PROGRESS:', JSON.stringify(beautified));
//     }).on(DownloadEvent.MERGE, (descriptor) => {
//         Logger.debug('+++DownloadEvent.MERGE:', descriptor, task.getStatus());
//     }).on(DownloadEvent.FINISHED, (descriptor) => {
//         Logger.debug('+++DownloadEvent.FINISHED:', descriptor, task.getStatus());
//     }).on(DownloadEvent.ERROR, (descriptor, errorMessage) => {
//         Logger.error('+++DownloadEvent.ERROR:', descriptor, errorMessage, task.getStatus());
//     }).on(DownloadEvent.CANCELED, (descriptor) => {
//         Logger.warn('+++DownloadEvent.CANCELED:', descriptor, task.getStatus());
//     });
//     const started = await task.start();
//     Logger.assert(started);
//     return task;
// }
// example();










// ipcMain.on('start-download',function () {
//     download()
// })
//
// function download() {
//     const DownloadManager = require("electron-download-manager");
//
//     DownloadManager.register({
//         downloadFolder: "/Users/joylau/Desktop"
//     });
//     var links = [
//         "https://mirrors.aliyun.com/centos/7.7.1908/isos/x86_64/CentOS-7-x86_64-Everything-1908.iso",
//         "https://mirrors.aliyun.com/deepin-cd/15.11/deepin-15.11-amd64.iso"
//     ];
//     //Single file download
//     DownloadManager.bulkDownload({
//         urls: links,
//         onResult: (finishedCount, errorsCount, itemUrl) => {
//             console.info(finishedCount,errorsCount,itemUrl)
//         }
//     }, function (error, finished, failed) {
//         if (error) {
//             console.log(error);
//             return;
//         }
//
//         console.log("DONE: " + finished,finished);
//     });
// }