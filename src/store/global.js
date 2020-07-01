import {observable, action, configure} from 'mobx';
import {getStorage,setStorage} from "../util/utils";
import config from '../util/config'

const os = window.require('os')

configure({
    enforceActions: 'always'
});

/**
 * 全局配置
 */
class Global {

    // 当前显示的左侧菜单项
    @observable
    mainMenu = 'active'

    // 文件保存目录
    @observable
    savePath = getStorage('savePath') ? getStorage('savePath') : (os.homedir() + config.sep + "Downloads")

    // 最大线程数
    @observable
    maxJobs = getStorage('maxJobs') ? getStorage('maxJobs') : (os.cpus().length / 2)

    // 下载完成播放的提示音
    @observable
    finishAudio = getStorage('finishAudio') ? getStorage('finishAudio') : "5809.mp3"

    @observable
    finishTip = getStorage('finishTip') ? getStorage('finishTip') : true

    @action
    changeMainMenu(mainMenu){
        this.mainMenu = mainMenu
    }

    @action
    changeSavePath(savePath) {
        this.savePath = savePath
        setStorage('savePath',savePath)
    }

    @action
    changeMaxJobs(maxJobs) {
        this.maxJobs = maxJobs
        setStorage('maxJobs',maxJobs)
    }

    @action
    changeFinishAudio(finishAudio) {
        this.finishAudio = finishAudio
        setStorage('finishAudio',finishAudio)
    }

    @action
    changeFinishTip(checked) {
        this.finishTip = checked
        setStorage('finishTip',checked)
    }
}

export default new Global();