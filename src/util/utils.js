import React from 'react'
import {LoadingOutlined} from "@ant-design/icons";
import Dexie from "dexie";

const EventEmitter = window.require('events').EventEmitter

const crypto = window.require('crypto');

const compressing = window.require('compressing');

const fse = window.require('fs-extra');

const publicKey = "itms-download-manager";

const db = new Dexie("metaDB");
db.version(1).stores({ meta: 'taskId'});

export const metaDB = db.table('meta')


export const statusText = {
    'paused': '暂停',
    'waiting': '等待中',
    'active': '下载中',
    'complete': '已完成',
    'remove': '已删除',
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

export function setStorage(key, value) {
    localStorage.setItem(key, JSON.stringify(value))
}

export const eventBus = new EventEmitter();


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

export function md5Sign(data) {
    return crypto.createHash('md5').update(data).digest('hex')
}

/**
 * AES 加密
 */
export function aesEncrypt(data) {
    let cipher = crypto.createCipher('aes192', publicKey);
    let crypted = cipher.update(data, 'utf8', 'hex');
    crypted += cipher.final('hex');
    return crypted;
}

/**
 * AES 解密
 */
export function aesDecrypt(encrypted) {
    const decipher = crypto.createDecipher('aes192', publicKey);
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

    if (second < 10) { second = '0' + second;}
    if (min < 10) { min = '0' + min;}

    return hour? (hour + ':' + newMin + ':' + second) : (min + ':' + second);
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
    return YY + MM + DD +" "+hh + mm + ss;
}

export function getCodeName(type,code) {
    const sysCodes = getStorage('sysCodes');
    if (sysCodes) {
        const sysCode = sysCodes[type].find(val => val.value === code)
        return sysCode ? sysCode.text : ''
    } else {
        return ''
    }
}


/**
 * 将浏览器地址栏信息转化为对象
 * @param query
 * @returns {{}}
 */
export function parseURLQueryString(query){
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
export async function zip(source,dest,clean) {
    await compressing.zip.compressDir(source, dest)
        .then(() => {
            if (clean){
                fse.removeSync(source)
            }

        })

}

/**
 * 解压缩
 */
export async function unzip(source,dest,clean) {
    await compressing.zip.uncompress(source, dest)
        .then(() => {
            if (clean){
                fse.removeSync(source)
            }
        })
}

export function updateNotification(notification,options) {
    notification.open({
        key: options.key,
        message: options.message,
        description:options.description,
        icon: <LoadingOutlined style={{ color: '#108ee9' }} spin={true}/>,
    });
}

export function closeNotification(notification,key) {
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