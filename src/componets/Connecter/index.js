import React from 'react'
import {inject, observer} from "mobx-react";
import config from "../../util/config"
import {message} from 'antd';
import PassVeh from './passVeh'
import {eventBus,tmpdir} from "../../util/utils";
import {listenClipboard,unListenClipboard,openLogin} from '../../util/settingUtils'
import Tips from "../Tips";
import IllegalVeh from "./illegalVeh";
import axios from "axios";
import {toJS} from "mobx";

const {ipcRenderer} = window.require('electron')
const {BrowserWindow} = window.require('electron').remote;
const fse = window.require('fs-extra');

@inject('global', 'task',"jobProcess")
@observer
class Connecter extends React.Component {

    componentDidMount() {
        // 监听到通过自定义协议打开的操作
        ipcRenderer.on('open-protocol', (event, arg) => this.resolveTask(arg))

        eventBus.on('add-task',(arg) => this.resolveTask(arg))

        eventBus.on('job-downloaded',this.onJobDownload)

        // 确保下载目录是否存在, 不存在则创建他
        fse.ensureDirSync(this.props.global.savePath)

        // 确保临时目录存在, 不存在则创建他
        fse.ensureDirSync(tmpdir)

        // 初始化配置
        this.initSetting()
    }

    componentWillMount() {
        // 拦截判断是否离开当前页面
        window.addEventListener('beforeunload', this.beforeunload);
    }

    componentWillUnmount() {
        // 销毁拦截判断是否离开当前页面
        window.removeEventListener('beforeunload', this.beforeunload);
    }

    beforeunload(e) {
    }


    resolveTask = (arg) => {
        let that = this;
        try {
            // 切换到正在下载页
            this.props.global.changeMainMenu("active")
            const data = this.handleArg(arg);
            console.info("收到协议数据:", data)

            axios.get(data.url)
                .then(function (response) {
                    console.info("获取到参数信息:", response.data)
                    that.validateRules(response.data)
                })
                .catch(function (error) {
                    console.error(error)
                    message.error('任务创建失败, 请检查接口是否可用!');
                });
        } catch (error) {
            console.error(error)
            message.error('任务创建失败, 请检查传输参数格式!');
        }
    }

    validateRules = (data) => {
        if (!data) {
            message.error('任务已过期!');
            return;
        }
        try { // 合法性判断
            if (!data.extra || !data.extra.name) {
                message.warn('任务名称不存在! 可选值: passVeh, illegalVeh');
                return;
            }

            if (!data.extra || !data.extra.type) {
                message.warn('任务类型不存在! 可选值: all, select');
                return;
            }

            if (data.extra.name === 'passVeh' && data.extra.type === 'all') {
                if (!data.extra.vehPassByIds) {
                    message.warn('参数 extra.vehPassByIds 不存在, 请检查!');
                    return;
                }
            }
            // 发送通知
            eventBus.emit(data.extra.name + '-' + data.extra.type, data)
            // 发送更新软件通知
            if (data.update) {
                eventBus.emit('update-soft', data.update)
            }
        } catch (e) {
            console.error(e)
            message.error('任务创建失败, 请检查传输参数格式!');
        }
    }


    // 协议数据处理
    handleArg = arg => {
        console.info("arg 原始数据为:",arg)
        let argStr;
        if (Array.isArray(arg)) {
            argStr = arg[arg.length - 1].replace(config.PROTOCOL + "://", "");
            // windows 下最后一项会带上 "/"
            if (argStr.charAt(argStr.length-1) === '/') {
                argStr = argStr.substring(0,argStr.length -1)
            }
        } else {
            argStr = arg.replace(config.PROTOCOL + "://", "");
        }

        return JSON.parse(decodeURIComponent(argStr));
    }


    onJobDownload = () => {
        // 如果有等待的任务, 则开启一个最先等待的任务
        const waitingJobs = this.props.task.getJobs().filter(value => value.state === 'waiting');
        if (waitingJobs.length > 0) {
            const waitingJob = toJS(waitingJobs[0])
            // 更改状态为激活状态
            waitingJob.state = 'active';
            this.props.task.updateStateJob(waitingJob.id, "active");
            // 发出通知
            eventBus.emit(waitingJob.type + '-waiting-to-active',waitingJob);
        }
    }


    initSetting = () => {
        const that = this;
        // 剪切板设置
        this.props.global.onClipboard ? listenClipboard() : unListenClipboard()

        // 开机启动
        this.props.global.powerOn ? openLogin(true) : openLogin(false)

        //启动后自动开始未完成的任务
        if (this.props.global.autoStart) {
            setTimeout(function () {
                that.onJobDownload()
            },3000)
        }
    }

    render() {
        return (
            <div>
                {this.props.children}
                <div>
                    <Tips/>
                    <PassVeh/>
                    <IllegalVeh/>
                </div>

            </div>
        )
    }
}

export default Connecter

