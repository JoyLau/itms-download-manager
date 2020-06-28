import {observable, action} from 'mobx';
import {getStorage,setStorage} from "../util/utils";

const os = window.require('os')


// 初始化配置项
// db.prepare("INSERT INTO config (key, value) VALUES (?, ?)").run('savePath',os.homedir() + (os.platform() === "win32" ? "\\" : "/" ) + "Downloads")
// db.prepare("INSERT INTO config (key, value) VALUES (?, ?)").run('maxJobs',os.cpus().length / 2)


/**
 * 全局配置
 */
class Global {

    // 主菜单
    @observable
    mainMenu = 'active'

    // 文件保存目录
    @observable
    savePath = getStorage('savePath') ? getStorage('savePath') : (os.homedir() + (os.platform() === "win32" ? "\\" : "/" ) + "Downloads")

    // 最大线程数
    @observable
    maxJobs = getStorage('maxJobs') ? getStorage('maxJobs') : (os.cpus().length / 2)

    // 下载完成播放的提示音
    @observable
    finishAudio = getStorage('finishAudio') ? getStorage('finishAudio') : "5809.mp3"

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
}

export default new Global();