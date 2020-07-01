import {observable, action, configure,autorun,reaction, toJS} from 'mobx';
import {getStorage, setStorage} from "../util/utils";

configure({
    enforceActions: 'always'
});
/**
 * 任务进度配置
 */
class Task {

    constructor() {
        console.info("constructor")
        this.initJobs()
    }

    // 主任务
    @observable
    jobs = []

    change = autorun(
        () => {}
    )

    @action
    initJobs() {
        if (getStorage('jobs')) {
            this.jobs = getStorage('jobs')
        }
    }

    getJobs(){
        return toJS(this.jobs)
    }

    selectById(jobId){
        return this.getJobs().find(value => value.id === jobId)
    }

    selectValueById(jobId, key){
        return this.selectById(jobId)[key]
    }

    @action
    addJob(job) {
        this.jobs = this.jobs.concat(job)
        setStorage("jobs", this.jobs)
    }

    @action
    updateStateJob(jobId, state) {
        this.jobs = this.jobs.map(value => {
            if (value.id === jobId) {
                value.state = state
            }
            return value;
        })
        setStorage("jobs",this.jobs)
    }

    @action
    updateJob(jobId, key, obj) {
        this.jobs = this.jobs.map(value => {
            if (value.id === jobId) {
                value[key] = obj
            }
            return value;
        })
        setStorage("jobs",this.jobs)
    }

    @action
    deleteJob(jobId) {
        this.jobs = this.jobs.filter(value => value.id !== jobId)
        setStorage("jobs", this.jobs)
    }
}

export default new Task();