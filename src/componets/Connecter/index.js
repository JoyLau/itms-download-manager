import React from 'react'
import {inject, observer} from "mobx-react";
import config from "../../util/config"
import {eventBus} from '../../util/utils'
import {message, Spin} from 'antd';
import axios from 'axios';
import progress from "request-progress";
import request from "request";

const {ipcRenderer} = window.require('electron')
const fs = window.require('fs')

@inject('global')
@inject('task')
@observer
class Connecter extends React.Component {

    state = {
        loading: false
    }

    componentDidMount() {
        // 监听到通过自定义协议打开的操作
        ipcRenderer.on('open-protocol', (event, arg) => {
            try {
                this.props.global.changeMainMenu("active")

                // 如果当前有正在下载的任务, 则将任务置为等待中
                let jobState = 'active'
                if (this.props.task.jobs.filter(item => item.state === 'active').length > 0) {
                    jobState = 'waiting'
                }

                const data = this.handleArg(arg);
                console.info("收到协议带过来的数据:", data)

                if (data.extra.type === "选择导出") {
                    this.processSelectData(data, jobState);
                } else if (data.extra.type === "全部导出") {
                    this.processAllData(data, jobState);
                }
            } catch (e) {
                console.error(e)
                message.error('任务创建失败, 请检查参数传输!');
            }


        })
    }

    // 导出选中数据
    processSelectData = (data,jobState) => {
        let that = this;
        // 展示 loading
        that.setState({
            loading: true
        })
        // 超时时间按 10000 条 1 分钟的时间来算
        const timeout = Math.ceil(data.extra.total / 10000) * 60 * 1000;
        axios({
            method: data.method,
            url: data.url,
            data: data.params.ids,
            timeout: timeout
        })
            .then(function (response) {
                that.setState({
                    loading: false
                })
                console.log("查询数据返回:",response);
                that.addJob(data,response.data,jobState)
            })
            .catch(function (error) {
                that.setState({
                    loading: false
                })
                console.error(error)
                message.error('任务创建失败, 请检查参数传输!');
            });
    }


    // 导出全部数据
    processAllData = (data,jobState) => {
        // let that = this;
        //
        // const req = request(data.url/*,{
        //     method: data.method,
        //     json: true,
        //     headers: {
        //         "content-type": "application/json",
        //     },
        //     body: JSON.stringify(data.params.inputBean)
        // }*/)
        //
        // console.info(req)
        // // 下载数据文件
        // progress(request(data.url), {
        //     // throttle: 2000,                    // Throttle the progress event to 2000ms, defaults to 1000ms
        //     // delay: 1000,                       // Only start to emit after 1000ms delay, defaults to 0ms
        //     // lengthHeader: 'x-transfer-length'  // Length header to use, defaults to content-length
        // })
        //     .on('progress', function (state) {
        //         console.info(state)
        //         // The state is an object that looks like this:
        //         // {
        //         //     percent: 0.5,               // Overall percent (between 0 to 1)
        //         //     speed: 554732,              // The download speed in bytes/sec
        //         //     size: {
        //         //         total: 90044871,        // The total payload size in bytes
        //         //         transferred: 27610959   // The transferred payload size in bytes
        //         //     },
        //         //     time: {
        //         //         elapsed: 36.235,        // The total elapsed seconds since the start (3 decimals)
        //         //         remaining: 81.403       // The remaining seconds to finish (3 decimals)
        //         //     }
        //         // }
        //     })
        //     .on('error', function (err) {
        //         console.info(err)
        //     })
        //     .on('end', function () {
        //         console.info("end")
        //     })
        //     .pipe(fs.createWriteStream(this.props.global.savePath + "/dd990" ));

    }


    addJob = (protocolData,resultData,jobState) => {
        // 任务名称
        const taskName = "[过车数据_" + protocolData.extra.type + "] "
            + protocolData.extra.searchData.currentUserName
            + "_"
            + protocolData.extra.searchData.passTimeStart.split(' ')[0]
            + "_"
            + protocolData.extra.searchData.passTimeEnd.split(' ')[0]
            + '.zip';
        const job = {
            id: new Date().getTime(), // id
            name: taskName,
            url: protocolData.extra.downloadUrl, // 下载地址
            state: jobState, // 任务状态
            process: {
                total: resultData.length,
                finishCount: 0,
                percent: 0,
                finishSize: 0,
                remainingTime: ''
            },
            item: resultData, // 资源项
            searchData: protocolData.extra.searchData // 查询条件
        }
        // 添加任务
        this.props.task.addJob(job)

        eventBus.emit('new-task', job)
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
                <Spin tip="数据获取中,请稍等..." spinning={this.state.loading}>
                    {this.props.children}
                </Spin>
            </div>
        )
    }
}

export default Connecter

