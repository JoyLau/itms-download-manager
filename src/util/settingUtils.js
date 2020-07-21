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
    BrowserWindow.getFocusedWindow().addListener('focus', clipboardListener)
}

/**
 * 取消监听剪切板
 */
export const unListenClipboard = () => {
    BrowserWindow.getFocusedWindow().removeListener('focus', clipboardListener)
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
    console.info("口令解密后的数据:",originalText);
    if (originalText === '' || originalText.indexOf(config.PROTOCOL) < 0) {
        return;
    }
    global.changeMainMenu('active')
    eventBus.emit('clipboard-task',clipboardText)
    clipboard.clear();
}