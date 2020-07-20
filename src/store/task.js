import {observable, action, configure, autorun, toJS} from 'mobx';
import {saveJobs, addJob,updateJob,allJobs,deleteJob} from '../util/dbUtils'

configure({
    enforceActions: 'always'
});

/**
 * 任务进度配置
 */
class Task {

    constructor() {
        this.initJobs()
    }

    // 主任务
    @observable
    jobs = []

    async saveJobs() {
        saveJobs(toJS(this.jobs), function () {})
    }

    initJobs() {
        const that = this
        allJobs(function (array) {
            if (array.length !== 0) {
                that.setJobs(array)
            }
        });
    }

    getJobs() {
        return this.jobs
    }

    selectById(jobId) {
        return this.getJobs().find(value => value.id === jobId)
    }

    selectValueById(jobId, key) {
        return this.selectById(jobId)[key]
    }

    @action
    setJobs(jobs) {
        this.jobs = jobs
    }

    @action
    addJob(job) {
        //根据状态决定前面插入还是后面插入
        job.state === 'active' ? this.jobs.unshift(job) : this.jobs.push(job)
        addJob(job,function () {})
    }

    @action
    updateStateJob(jobId, state) {
        this.updateJob(jobId, 'state', state);
    }

    @action
    updateJob(jobId, key, obj) {
        this.jobs[this.jobs.findIndex(job => job.id === jobId)][key] = obj
        updateJob(jobId, key, obj,function () {})
    }

    @action
    deleteJob(jobId) {
        const index = this.jobs.findIndex(job => job.id === jobId);
        // 如果下标不存在则会删除最后一个元素, 这里要判断下
        if (index > -1) {
            this.jobs.splice(index, 1);
            deleteJob(jobId,function () {})
        }

    }
}

export default new Task();