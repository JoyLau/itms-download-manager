import {observable, action} from 'mobx';
import {getStorage,setStorage} from "../util/utils";

/**
 * 任务进度配置
 */
class Task {

    // 主任务
    @observable
    main = {}

    @action
    changeMain(obj) {
        this.main = obj
    }
}

export default new Task();