import React from 'react'
import {LoadingOutlined} from "@ant-design/icons";
import config from "./config";

const path = window.require('path')

const os = window.require('os')

// mac 下是按 1000 算的
const precision = os.platform() === 'darwin' ? 1000 : 1024;

const EventEmitter = window.require('events').EventEmitter

const crypto = window.require('crypto');

const compressing = window.require('compressing');

const fse = window.require('fs-extra');

export const eventBus = new EventEmitter();

export const tmpdir = os.tmpdir() + config.sep + config.PROTOCOL;

/**
 * 获取路径的最后一个 / 后面的名称
 * @param p
 * @returns {string}
 */
export function basename(p) {
    return path.posix.basename(p)
}

/**
 * 获取路径的中的文件名(不带后缀名)
 * @param f
 * @returns {string}
 */
export function filename(f) {
    return path.posix.basename(f,path.extname(f))
}

export const statusText = {
    'paused': '暂停',
    'waiting': '等待中',
    'active': '下载中',
    'complete': '已完成',
    'error': '下载出错'
};

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

export async function setStorage(key, value) {
    localStorage.setItem(key, JSON.stringify(value))
}

export function getSessionStorage(key) {
    let val = sessionStorage.getItem(key);
    try {
        if (val) {
            val = JSON.parse(val)
        }
    } catch (e) {
        val = null
    }
    return val
}

export function setSessionStorage(key, value) {
    sessionStorage.setItem(key, JSON.stringify(value))
}

export function getFileExt(file) {
    if (!file || file.indexOf('.') === -1) return '';
    return file.substr(file.lastIndexOf('.') + 1)
}

export function bytesToSize(bytes) {
    bytes = Number(bytes);
    if (bytes === 0 || !bytes || isNaN(bytes)) return '0 B';
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(precision));
    return parseFloat((bytes / Math.pow(precision, i)).toFixed(2)) + ' ' + sizes[i];
}

export function md5Sign(data) {
    return crypto.createHash('md5').update(data).digest('hex')
}

/**
 * AES 加密
 */
export function aesEncrypt(data) {
    let cipher = crypto.createCipher('aes192', config.PROTOCOL);
    let crypted = cipher.update(data, 'utf8', 'hex');
    crypted += cipher.final('hex');
    return crypted;
}

/**
 * AES 解密
 */
export function aesDecrypt(encrypted) {
    const decipher = crypto.createDecipher('aes192', config.PROTOCOL);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
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

    if (second < 10) {
        second = '0' + second;
    }
    if (min < 10) {
        min = '0' + min;
    }

    return hour ? (hour + ':' + newMin + ':' + second) : (min + ':' + second);
}

/**
 * 时间戳转化为时间
 * @param time
 * @returns {string}
 */
export function formatDate(time) {
    const date = new Date(time);
    const YY = date.getFullYear() + '-';
    const MM = (date.getMonth() + 1 < 10 ? '0' + (date.getMonth() + 1) : date.getMonth() + 1) + '-';
    const DD = (date.getDate() < 10 ? '0' + (date.getDate()) : date.getDate());
    const hh = (date.getHours() < 10 ? '0' + date.getHours() : date.getHours()) + ':';
    const mm = (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes()) + ':';
    const ss = (date.getSeconds() < 10 ? '0' + date.getSeconds() : date.getSeconds());
    return YY + MM + DD + " " + hh + mm + ss;
}

export function formatDate_(time) {
    return formatDate(time).replace(/ /g, "_").replace(/:/g, "-");
}

/**
 * 将浏览器地址栏信息转化为对象
 * @param query
 * @returns {{}}
 */
export function parseURLQueryString(query) {
    let theRequest = {};
    if (query.indexOf("?") !== -1) {
        let str = query.substr(1);
        let strs = str.split("&");
        for (let i = 0; i < strs.length; i++) {
            theRequest[strs[i].split("=")[0]] = (strs[i].split("=")[1]);
        }
    }
    return theRequest;
}


/**
 * 压缩
 */
export async function zip(source, dest, clean) {
    await compressing.zip.compressDir(source, dest)
        .then(() => {
            if (clean) {
                fse.remove(source)
            }
        })
        .catch(error => {
            console.error(error)
        })
}

/**
 * 解压缩
 */
export async function unzip(source, dest, clean) {
    await compressing.zip.uncompress(source, dest)
        .then(() => {
            if (clean) {
                fse.remove(source)
            }
        })
        .catch(error => {
            console.error(error)
        })
}

export function updateNotification(notification, options) {
    notification.open({
        key: options.key,
        message: options.message,
        description: options.description,
        icon: <LoadingOutlined style={{color: '#108ee9'}} spin={true}/>,
    });
}


export function fileExists(path) {
    return fse.pathExistsSync(path)
}

export function closeNotification(notification, key) {
    notification.close(key);
}

/**
 * 原地等待指定毫秒数
 * @param millis
 * @returns {Promise<unknown>}
 */
export async function waitMoment(millis) {
    return new Promise(resolve => setTimeout(resolve, millis));
}