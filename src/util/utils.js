const EventEmitter = window.require('events').EventEmitter

const crypto = window.require('crypto');


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

export const eventBus = new EventEmitter();


export const statusText = {
    'paused': '暂停',
    'waiting': '等待中',
    'active': '下载中',
    'complete': '已完成',
    'remove': '已删除',
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
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function genFileName(downloadUrl) {
    return crypto.createHash('md5').update(downloadUrl).digest('hex')
}

/*
 * 将秒数格式化时间
 * @param {Number} seconds: 整数类型的秒数
 * @return {String} time: 格式化之后的时间
 */
export function formatTime(seconds) {
    seconds = Math.floor(seconds);
    let min = Math.floor(seconds / 60),
        second = seconds % 60,
        hour, newMin;

    if (min > 60) {
        hour = Math.floor(min / 60);
        newMin = min % 60;
    }

    if (second < 10) { second = '0' + second;}
    if (min < 10) { min = '0' + min;}

    return hour? (hour + ':' + newMin + ':' + second) : (min + ':' + second);
}