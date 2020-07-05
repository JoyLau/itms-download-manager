import {observable, action, configure,autorun,reaction, toJS} from 'mobx';
import {getStorage, setStorage} from "../util/utils";

// configure({
//     enforceActions: 'always'
// });
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

    change = autorun(
        () => {
            console.info("autorun")
        }
    )

    saveJobs() {
        setStorage("jobs",this.jobs).then(()=>{
            console.info("jobs 保存完成!")
        })
    }

    @action
    initJobs() {
        if (getStorage('jobs')) {
            this.jobs = getStorage('jobs')
        }
    }

    getJobs(){
        return this.jobs
    }

    selectById(jobId){
        return this.getJobs().find(value => value.id === jobId)
    }

    selectValueById(jobId, key){
        return this.selectById(jobId)[key]
    }

    @action
    addJob(job) {
        //根据状态决定前面插入还是后面插入
        job.state === 'active' ? this.jobs.unshift(job) : this.jobs.push(job)
        this.saveJobs()
    }

    @action
    updateStateJob(jobId, state) {
        this.updateJob(jobId,'state',state);
    }

    @action
    updateJob(jobId, key, obj) {
        this.jobs[this.jobs.findIndex(job => job.id === jobId)][key] = obj
        this.saveJobs()
    }

    @action
    deleteJob(jobId) {
        const index = this.jobs.findIndex(job => job.id === jobId);
        // 如果下标不存在则会删除最后一个元素, 这里要判断下
        if (index > -1) {
            this.jobs.splice(index, 1);
            this.saveJobs()
        }

    }
}

export default new Task();