import React from 'react'
import {inject, observer} from "mobx-react";
import config from "../../util/config"
import {eventBus} from '../../util/utils'

const {ipcRenderer} = window.require('electron')

@inject('global')
@inject('task')
@observer
class Connecter extends React.Component {

    componentDidMount() {
        // 监听到通过自定义协议打开的操作
        ipcRenderer.on('open-protocol', (event, arg) => {
            this.props.global.changeMainMenu("active")
            const data = this.handleArg(arg);
            console.info("收到协议带过来的数据:", data)

            const job = {
                id: new Date().getTime(), // id
                name: data.searchData.currentUserName + "_" + data.searchData.passTimeStart.split(' ')[0] + "_" + data.searchData.passTimeEnd.split(' ')[0] + '过车数据.zip', // 任务名称
                url: data.url, // 下载地址
                state: 'active', // 任务状态
                percent: 0, // 下载百分比
                speed: 0, // 下载速度
                size: {
                    transferred: 0 // 已下载大小
                },
                time: {
                    elapsed: 0, // 已消耗时间
                    remaining: null // 剩余时间
                },
                item: data.params, // 资源项
                searchData: data.searchData // 查询条件
            }
            // 添加任务
            this.props.task.addJob(job)

            eventBus.emit('new-task', job)
        })
    }

    // 协议数据处理
    handleArg = arg => {
        let urlObj = [];
        if (Array.isArray(arg)) {
            urlObj = arg[arg.length - 1].replace(config.PROTOCOL + "://", "").split(config.separator);
        } else {
            urlObj = arg.replace(config.PROTOCOL + "://", "").split(config.separator);
        }

        const data = JSON.parse(decodeURIComponent(urlObj[1]));
        return {
            url: urlObj[0],
            params: data.params,
            searchData: data.searchData
        }
    }


    render() {
        return (
            <div>
                {this.props.children}
            </div>
        )
    }
}

export default Connecter

