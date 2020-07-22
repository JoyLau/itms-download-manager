import {action, observable, autorun,computed, toJS} from 'mobx';
import {saveProcess,updateProcess,updateProcessItem,deleteProcess,allProcess} from '../util/dbUtils';

/**
 * 任务进度
 */
class JobProcess {

    constructor() {
        this.initProcess()
    }

    // 下载任务的进度
    @observable
    process = {}

    initProcess(){
        allProcess()
            .then(process => this.setProcess(process))
            .then(() => console.info("JobProcess 初始化完成!"));
    }

    getProcess(key){
        return this.process[key]
    }

    @action
    setProcess(process){
        this.process = process
    }

    @action
    updateProcess(id, obj) {
        this.process[id] = obj;
        updateProcess(id,obj)
    }

    @action
    updateProcessItem(id, key, obj) {
        this.process[id][key] = obj;
        updateProcessItem(id,key,obj)
    }

    @action
    deleteProcess(id){
        delete this.process[id]
        deleteProcess(id)
    }

    async saveProcess() {
        saveProcess(toJS(this.process))
    }

}
export default new JobProcess();