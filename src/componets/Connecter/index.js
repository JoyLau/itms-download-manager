import React from 'react'
import {inject, observer} from "mobx-react";
import config from "../../util/config"
import {message} from 'antd';
import PassVeh from './passVeh'
import {eventBus} from "../../util/utils";
import Tips from "../Tips";
import IllegalVeh from "./illegalVeh";
import axios from "axios";

const {ipcRenderer} = window.require('electron')
const fse = window.require('fs-extra');

@inject('global', 'task')
@observer
class Connecter extends React.Component {

    componentDidMount() {
        // 监听到通过自定义协议打开的操作
        ipcRenderer.on('open-protocol', (event, arg) => {
            this.resolveTask(arg)
        })

        eventBus.on('add-task',(arg) => this.resolveTask(arg))

        // 删除正在运行的任务和等待
        ipcRenderer.on('del-active-task', (event) => {
            const that = this;
            this.props.task.getJobs().forEach(job => {
                if (job.state !== 'complete') {
                    that.props.task.deleteJob(job.id)
                }
            })
        })

        // 向主进程发送配置信息
        ipcRenderer.send("setting",this.props.global)

        // 确保下载目录是否存在, 不存在则创建他
        fse.ensureDirSync(this.props.global.savePath)

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
                    message.error('任务创建失败, 请检查传输参数格式!');
                });
        } catch (error) {
            console.error(error)
            message.error('任务创建失败, 请检查传输参数格式!');
        }
    }

    validateRules = (data) => {
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
            // 如果当前没有正在运行的任务,则新建任务
            if (this.props.task.getJobs().filter(job => job.state === 'active').length > 0) {
                message.warning('当前任务正在下载中,请稍后再试.');
            } else {
                eventBus.emit(data.extra.name + '-' + data.extra.type, data)
            }


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

