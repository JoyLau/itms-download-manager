import {observable, action} from 'mobx';
import {getStorage,setStorage} from "../util/utils";
import config from '../util/config'

const os = window.require('os')

/**
 * 全局配置
 */
class Global {

    // 当前显示的左侧菜单项
    @observable
    mainMenu = 'active'

    // 开机启动
    @observable
    powerOn = this.readStorageOrElse('powerOn',true);

    //启动后自动开始未完成的任务
    @observable
    autoStart = this.readStorageOrElse('autoStart',true);

    // 文件保存目录
    @observable
    savePath = this.readStorageOrElse('savePath',os.homedir() + config.sep + "Downloads")

    //自动修改为上次使用的目录
    @observable
    latestPath = this.readStorageOrElse('latestPath',true)

    // 接管剪切板
    @observable
    onClipboard = this.readStorageOrElse('onClipboard',true)

    // 最大线程数
    @observable
    maxJobs = this.readStorageOrElse('maxJobs',(os.cpus().length / 2).toString());

    // 最大任务数
    @observable
    maxTasks = this.readStorageOrElse('maxTasks',3);

    // 下载完成自动打开
    @observable
    finishOpen = this.readStorageOrElse('finishOpen',true)

    // 自动删除 "文件不存在" 的任务
    @observable
    delNotExist = this.readStorageOrElse('delNotExist',false)

    // 下载完成播放的提示音
    @observable
    playFinishAudio = this.readStorageOrElse('playFinishAudio',true)

    // 下载完成播放的提示音
    @observable
    finishAudio = this.readStorageOrElse('finishAudio',"5809.mp3")

    // 下载完成后弹窗提示
    @observable
    finishTip = this.readStorageOrElse('finishTip',true)

    // 下载失败时弹窗提示
    @observable
    errorTip = this.readStorageOrElse('errorTip',true)

    // 显示悬浮窗
    @observable
    floatWin = this.readStorageOrElse('floatWin',true)

    // 压缩类型
    @observable
    compressType = this.readStorageOrElse('compressType','.zip')

    /**
     * 读取 Storage 值, 否则设置默认值
     * @param key
     * @param other
     * @returns {any}
     */
    readStorageOrElse(key, other){
        return getStorage(key) ? getStorage(key) : other
    }

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
    changeMaxTasks(maxTasks) {
        this.maxTasks = maxTasks
        setStorage('maxTasks',maxTasks)
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