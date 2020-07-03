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

@inject('global', 'task')
@observer
class Connecter extends React.Component {

    componentDidMount() {
        // 监听到通过自定义协议打开的操作
        ipcRenderer.on('open-protocol', (event, arg) => {
            this.resolveTask(arg)
        })
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
            eventBus.emit(data.extra.name + '-' + data.extra.type, data)
        } catch (e) {
            console.error(e)
            message.error('任务创建失败, 请检查传输参数格式!');
        }
    }


    // 协议数据处理
    handleArg = arg => {
        let argStr;
        if (Array.isArray(arg)) {
            argStr = arg[arg.length - 1].replace(config.PROTOCOL + "://", "");
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

