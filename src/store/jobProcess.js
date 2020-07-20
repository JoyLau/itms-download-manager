import {action, observable, autorun,computed, toJS} from 'mobx';
import {saveProcess,deleteProcess} from '../util/dbUtils';

/**
 * 任务进度
 */
class JobProcess {

    // 下载任务的进度
    @observable
    process = {}

    @action
    updateProcess(id, obj) {
        this.process[id] = obj;
        this.saveProcess();
    }

    @action
    updateProcessItem(id, key, obj) {
        this.process[id][key] = obj;
        this.saveProcess();
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