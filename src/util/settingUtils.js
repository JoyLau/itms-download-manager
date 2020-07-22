import {decryptPassphrase, eventBus} from "./utils";
import config from "./config";
import global from '../store/global'

const {clipboard} = window.require('electron')
const {BrowserWindow,app} = window.require('electron').remote;

export const openLogin = (on) => {
    // 设置是否开机启动
    app.setLoginItemSettings({
        openAtLogin: on
    })
}


/**
 * 监听剪切板
 */
export const listenClipboard = () =>{
    try {
        let win = BrowserWindow.getFocusedWindow();
        if (!win) {
            win = BrowserWindow.getAllWindows()[0]
        }
        win.addListener('focus', clipboardListener)
    } catch (e) {
        //
    }
}

/**
 * 取消监听剪切板
 */
export const unListenClipboard = () => {
    try {
        let win = BrowserWindow.getFocusedWindow();
        if (!win) {
            win = BrowserWindow.getAllWindows()[0]
        }
        win.removeListener('focus', clipboardListener)
    } catch (e) {
        //
    }
}

/**
 * 剪切板监听器
 */
function clipboardListener() {
    const clipboardText = clipboard.readText();
    if (clipboardText === '') {
        return;
    }
    const originalText = decryptPassphrase(clipboardText);
    if (originalText === '' || originalText.indexOf(config.PROTOCOL) < 0) {
        return;
    }
    global.changeMainMenu('active')
    eventBus.emit('clipboard-task',clipboardText)
    clipboard.clear();
}