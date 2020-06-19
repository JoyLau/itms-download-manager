import EventEmitter from 'event-emitter'

export function getStorage(key) {
    let val = localStorage.getItem(key);
    try {
        if (val) {
            val = JSON.parse(val)
        }
    } catch (e) {
        val = null
    }
    return val
}

export function setStorage(key, value) {
    localStorage.setItem(key, JSON.stringify(value))
}

export const db = window.require('better-sqlite3')('db.db',{ verbose: console.log });

export const eventBus = new EventEmitter();


export const statusText = {
    'paused': '暂停',
    'waiting': '等待中',
    'active': '下载中',
    'complete': '已完成',
    'error': '下载出错'
};

export function getStatusText(status) {
    return statusText[status] || status
}

export function getFileExt(file) {
    if (!file || file.indexOf('.') === -1) return '';
    return file.substr(file.lastIndexOf('.') + 1)
}

export function bytesToSize(bytes) {
    bytes = Number(bytes);
    if (bytes === 0 || !bytes || isNaN(bytes)) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return (bytes / Math.pow(k, i)).toPrecision(3) + ' ' + sizes[i];
}