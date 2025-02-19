import Dexie from "dexie";
import _ from 'lodash'

const db_codes = new Dexie("sysCodes");
db_codes.version(1).stores({code: ''});
export const t_code = db_codes.table('code')


const db_jobs = new Dexie("jobs");
db_jobs.version(1).stores({
    job: 'id,state',
    process: '',
    metaData: ''
});
export const t_job = db_jobs.table('job')
export const t_process = db_jobs.table('process')
export const t_metaData = db_jobs.table('metaData')


export async function updateSysCodes(key, value) {
    await t_code.put(value, key)
}

export async function getCodeName(type, code) {
    let text = code
    await t_code.get(type).then(val => {
        const sysCode = val.find(path => path.value === code);
        if (sysCode) {
            text = sysCode.text
        }
    })
        .catch(error => {
            console.error(error)
        })
    return text
}

export function saveJobs(jobs, callback) {
    t_job.bulkPut(jobs)
        .then(lastKey => callback(lastKey))
        .catch(error => {console.error(error)})
}

export async function allJobs() {
    // 按创建时间进行排序
    return _.orderBy(await t_job.toArray(), ['creatTime'], ['desc'])
}

export function addJob(job, callback) {
    t_job.add(job)
        .then(id => callback(id))
        .catch(error => {console.error(error)})
}

export function updateJob(jobId, key, obj, callback) {
    t_job.where('id')
        .equals(jobId)
        .modify({[key]: obj})
        .then(number => callback(number))
        .catch(error => {console.error(error)})
}

export function deleteJob(jobId, callback) {
    t_job.delete(jobId)
        .then(() => callback())
        .catch(error => {console.error(error)})
}

export async function allProcess() {
    const keys = await t_process.toCollection().primaryKeys();
    const process = {};
    for (const key of keys) {
        process[key] = await t_process.get(key)
    }
    return process
}


export function saveProcess(process) {
    Object.keys(process).forEach(key => {
        t_process.put(process[key], key).catch(e => console.error(e));
    })
}

export function updateProcess(id,process) {
    t_process.put(process,id).catch(e => console.error(e));
}

export function updateProcessItem(id,key,obj) {
    t_process.get(id)
        .then(value => {
            value[key] = obj;
            updateProcess(id, value)
        })
}

export function deleteProcess(id) {
    t_process.delete(id).catch(e => console.error(e));
}


export function saveAllMetaData(metaData, jobId, callback) {
    // 按每一万条分割存储
    t_metaData.put(_.chunk(metaData, 10000), jobId)
        .then(key => callback(key))
        .catch(error => {console.error(error)})
}


export function deleteMetaData(jobId) {
    t_metaData.delete(jobId).catch(e => console.error(e));
}

export async function allMetaData(jobId) {
    // 将所有数据递归为一维数组
    return _.flattenDeep(await t_metaData.get(jobId));
}

export function cleanMetaData() {
    t_metaData.clear().catch(e => console.error(e));
}
