import {observable, action} from 'mobx';
import {getStorage, setStorage} from "../util/utils";

/**
 * 任务进度配置
 */
class Task {

    // 主任务
    @observable
    jobs = getStorage('jobs') ? getStorage('jobs') : []

    selectById(jobId){
        return this.jobs.find(value => value.id === jobId)
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
    updateJob(job) {
        this.jobs = this.jobs.map(value => {
            if (value.id === job.id) {
                value = job
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