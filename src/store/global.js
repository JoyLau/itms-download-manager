import {observable, action, configure} from 'mobx';
import {getStorage,setStorage} from "../util/utils";
import config from '../util/config'

const os = window.require('os')

// configure({
//     enforceActions: 'always'
// });

/**
 * 全局配置
 */
class Global {

    // 当前显示的左侧菜单项
    @observable
    mainMenu = 'active'

    // 开机启动
    @observable
    powerOn = getStorage('powerOn') ? getStorage('powerOn') : true

    //启动后自动开始未完成的任务
    @observable
    autoStart = getStorage('autoStart') ? getStorage('autoStart') : true

    // 文件保存目录
    @observable
    savePath = getStorage('savePath') ? getStorage('savePath') : (os.homedir() + config.sep + "Downloads")

    //自动修改为上次使用的目录
    @observable
    latestPath = getStorage('latestPath') ? getStorage('latestPath') : true

    // 接管剪切板
    @observable
    onClipboard = getStorage('onClipboard') ? getStorage('onClipboard') : true

    // 最大线程数
    @observable
    maxJobs = getStorage('maxJobs') ? getStorage('maxJobs') : (os.cpus().length / 2)

    // 下载完成自动打开
    @observable
    finishOpen = getStorage('finishOpen') ? getStorage('finishOpen') : true

    // 自动删除 "文件不存在" 的任务
    @observable
    delNotExist = getStorage('delNotExist') ? getStorage('delNotExist') : false

    // 下载完成播放的提示音
    @observable
    playFinishAudio = getStorage('playFinishAudio') ? getStorage('playFinishAudio') : true

    // 下载完成播放的提示音
    @observable
    finishAudio = getStorage('finishAudio') ? getStorage('finishAudio') : "5809.mp3"

    // 下载完成后弹窗提示
    @observable
    finishTip = getStorage('finishTip') ? getStorage('finishTip') : true

    // 下载失败时弹窗提示
    @observable
    errorTip = getStorage('errorTip') ? getStorage('errorTip') : true

    // 显示悬浮窗
    @observable
    floatWin = getStorage('floatWin') ? getStorage('floatWin') : true

    // 压缩类型
    @observable
    compressType = getStorage('compressType') ? getStorage('compressType') : '.zip'

    @action
    changeMainMenu(mainMenu){
        this.mainMenu = mainMenu
    }

    @action
    changePowerOn(powerOn){
        this.powerOn = powerOn
        setStorage('powerOn',powerOn)
    }

    @action
    changeAutoStart(autoStart){
        this.autoStart = autoStart
        setStorage('autoStart',autoStart)
    }

    @action
    changeSavePath(savePath) {
        this.savePath = savePath
        setStorage('savePath',savePath)
    }

    @action
    changeLatestPath(latestPath) {
        this.latestPath = latestPath
        setStorage('latestPath',latestPath)
    }

    @action
    changeOnClipboard(onClipboard) {
        this.onClipboard = onClipboard
        setStorage('onClipboard',onClipboard)
    }

    @action
    changeMaxJobs(maxJobs) {
        this.maxJobs = maxJobs
        setStorage('maxJobs',maxJobs)
    }

    @action
    changeFinishOpen(finishOpen) {
        this.finishOpen = finishOpen
        setStorage('finishOpen',finishOpen)
    }

    @action
    changeDelNotExist(delNotExist) {
        this.delNotExist = delNotExist
        setStorage('delNotExist',delNotExist)
    }

    @action
    changePlayFinishAudio(playFinishAudio) {
        this.playFinishAudio = playFinishAudio
        setStorage('playFinishAudio',playFinishAudio)
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

    @action
    changeErrorTip(errorTip) {
        this.errorTip = errorTip
        setStorage('errorTip',errorTip)
    }

    @action
    changeFloatWin(floatWin) {
        this.floatWin = floatWin
        setStorage('floatWin',floatWin)
    }

    @action
    changeCompressType(compressType) {
        this.compressType = compressType
        setStorage('compressType',compressType)
    }
}

export default new Global();