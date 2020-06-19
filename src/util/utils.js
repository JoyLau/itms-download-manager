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