import {action, observable} from 'mobx';

/**
 * 任务进度
 */
class JobProcess {

    // 下载任务的进度
    @observable
    process = {}

}

export default new JobProcess();