import {observable, action} from 'mobx';

const os = window.require('os')

class GlobalStore {
    @observable
    savePath = os.homedir() + (os.platform() === "win32" ? "\\" : "/" ) + "Downloads";

    @observable
    maxJobs = os.cpus().length;

    @action
    changeSavePath(savePath) {
        this.savePath = savePath;
    }

    @action
    changeMaxJobs(maxJobs) {
        this.maxJobs = maxJobs;
    }
}

export default new GlobalStore();