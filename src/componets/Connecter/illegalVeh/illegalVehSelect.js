/**
 * 违法导出_选择导出
 */
import React,{Component} from 'react'
import {inject, observer} from "mobx-react";
import {message, notification} from "antd";
import progress from "request-progress";
import request from "request";
import {
    eventBus,
    md5Sign,
    zip,
    updateNotification,
    closeNotification,
    waitMoment, formatDate_,
} from "../../../util/utils";
import Bagpipe from "../../Bagpipe/bagpipe";
import config from '../../../util/config'
import axios from "axios";
import {toJS} from "mobx";


const fs = window.require('fs');
const ExcelJS = window.require('exceljs')

@inject('global', "task", 'sysCode','jobProcess')
@observer
class IllegalVehSelect extends Component {

    state = {
        finishCount: 0,
        job: {
            item: [], // 资源项
            protocolData: {}, // 协议传输数据
        }
    }

    downloadBagpipe = new Bagpipe(this.props.global.maxJobs, {});

    componentDidMount() {
        eventBus.on('illegalVeh-select', this.processSelectData)

        eventBus.on('pause', () => this.downloadBagpipe.pause())

        eventBus.on('resume', () => this.downloadBagpipe.resume())

        eventBus.on('stop', (info) => {
            this.downloadBagpipe.stop()
            this.saveAndReset(info.taskId);
        })
    }


    // 导出选中数据
    processSelectData = async (data) => {
        let that = this;
        console.info("监听到 [违法导出] - [选择任务] ...")

        data.id = md5Sign(new Date().getTime().toString())

        updateNotification(notification, {
            key: data.id,
            message: '资源准备中',
            description: '请稍等',
        })

        try {
            await that.addJob(data)

        } catch (e) {
            console.error(e)
            message.error('任务创建失败, 请检查参数及接口是否可用!');
            closeNotification(notification,data.id)
        }
    }



    /**
     * 添加任务
     */
    addJob = async (protocolData) => {
        // 任务名称
        const taskName = "[违法数据_选择导出]"
            + protocolData.extra.searchData.currentUserName
            + "_"
            + formatDate_(new Date().getTime())
            + '.zip';

        const process = {
            total: protocolData.data.length,
            finishCount: 0,
            percent: 0,
            finishSize: 0,
            remainingTime: ''
        }

        this.props.jobProcess.process = process;

        const job = {
            id: protocolData.id, // id
            name: taskName,
            avatar: '违法/选择',
            url: protocolData.extra.downloadUrl, // 下载地址
            state: this.props.task.getJobs().filter(item => item.state === 'active').length > 0 ? 'waiting' : 'active', // 任务状态, 如果当前有正在下载的任务, 则将任务置为等待中
            process: process,
            isNew: true,
        }

        //数据存放
        this.setState({
            job: {
                item: protocolData.data, // 资源项
                protocolData: protocolData, // 协议传输数据
            }
        })

        // 等一会,否则太快看不到提示
        await waitMoment(2000)
        closeNotification(notification, protocolData.id)

        // 添加任务
        this.props.task.addJob(job)
        // 开始处理
        this.process()

    }


    process = () => {
        const activeTask = toJS(this.props.task.getJobs().filter(item => item.state === 'active')[0])

        // 存放的值再赋值进去
        activeTask.item = this.state.job.item;
        activeTask.protocolData = this.state.job.protocolData;
        console.info("active 任务信息:", activeTask)

        this.downloadTask(activeTask)
    }

    downloadTask = (activeTask) => {
        let that = this;
        try {
            let task = [];
            activeTask.item.forEach(val => {
                if (val.image) {
                    val.image.split(";").forEach(url => {
                        task.push({
                            taskId: activeTask.id,
                            taskName: activeTask.name,
                            plateNum: val.plateNbr,
                            imgUrl: url,
                            downloadUrl: activeTask.url,
                            deviceSysNbr: val.deviceSysNbr, // 设备编号
                            snapNbr: val.snapNbr // 抓拍编号
                        })
                    })
                } else {
                    task.push({
                        taskId: activeTask.id,
                        taskName: activeTask.name,
                        plateNum: val.plateNbr,
                        imgUrl: 'blank_image_url',
                        downloadUrl: activeTask.url,
                        deviceSysNbr: val.deviceSysNbr, // 设备编号
                        snapNbr: val.snapNbr // 抓拍编号
                    })
                }
            })

            if (task.length === 0 ) {
                message.warn("没有资源可供下载!")
                that.props.task.deleteJob(activeTask.id)
                return;
            }

            const nowTime = new Date().getTime();
            task.forEach((item, index) => {
                this.downloadBagpipe.push(that.download, index, item, task.length, nowTime, function () {
                });
            })
        } catch (e) {
            console.error(e)
            // 更改任务状态为 error
            that.props.task.updateStateJob(activeTask.id, "error")
        }
    }

    download = (index, item, total, startTime, callback) => {
        let that = this;
        const taskId = item.taskId;
        const taskName = item.taskName;

        try { // 文件目录不存在则创建目录
            const path = this.props.global.savePath + config.sep + taskId;

            const fileName = item.plateNum + "_" + item.deviceSysNbr + "_" + item.snapNbr + "_" + index + ".jpg";
            const filePath = path + config.sep + fileName;

            if (!fs.existsSync(path)) {
                fs.mkdirSync(path)
            }


            progress(request(item.downloadUrl + "?imgUrl=" + encodeURIComponent(item.imgUrl)), {
                // throttle: 2000,                    // Throttle the progress event to 2000ms, defaults to 1000ms
                // delay: 1000,                       // Only start to emit after 1000ms delay, defaults to 0ms
                // lengthHeader: 'x-transfer-length'  // Length header to use, defaults to content-length
            })
                .on('progress', function (state) {
                    // The state is an object that looks like this:
                    // {
                    //     percent: 0.5,               // Overall percent (between 0 to 1)
                    //     speed: 554732,              // The download speed in bytes/sec
                    //     size: {
                    //         total: 90044871,        // The total payload size in bytes
                    //         transferred: 27610959   // The transferred payload size in bytes
                    //     },
                    //     time: {
                    //         elapsed: 36.235,        // The total elapsed seconds since the start (3 decimals)
                    //         remaining: 81.403       // The remaining seconds to finish (3 decimals)
                    //     }
                    // }
                })
                .on('error', function (err) {
                    console.info(err)
                    // 下载出错删除文件
                    fs.unlinkSync(filePath);

                    // 更改任务状态为 error
                    that.props.task.updateStateJob(taskId, "error")

                })
                .on('end', async function () {
                    that.state.finishCount++

                    // 当前任务目录文件数
                    let finishCount = fs.readdirSync(path).filter(value => fs.statSync(path + config.sep + value).size > 0).length

                    // 当前目录大小
                    let finishSize = 0;

                    fs.readdirSync(path).forEach(value => {
                        finishSize = finishSize + fs.statSync(path + config.sep + value).size
                    })


                    // 更新当前任务
                    that.props.jobProcess.process = {
                        total: total,
                        finishCount: finishCount,
                        percent: Math.round(finishCount * 100 / total),
                        finishSize: finishSize,
                        speed: finishSize / (new Date().getTime() - startTime) * 1000,
                        remainingTime: ((new Date().getTime() - startTime) / finishCount) * (total - finishCount) / 1000
                    }

                    // 如果下载完成
                    if (that.state.finishCount === total) {
                        // 生成 excel
                        await that.creatExcel(that.state.job.item, path);

                        // 生成压缩包
                        const zipFullPath = that.props.global.savePath + config.sep + taskName.replace(".zip", "") + '.zip';
                        await zip(path, zipFullPath, true)


                        // 播放下载完成提示音和通知
                        eventBus.emit('start-tips', taskName, zipFullPath)

                        // 更新状态, 等 1 秒
                        await waitMoment(1000)
                        // 保存路径
                        that.props.task.updateJob(taskId, "localPath",zipFullPath);
                        that.props.task.updateStateJob(taskId, "complete")

                        // 更新导出状态
                        that.updateIllegalVehState(that.state.job.protocolData,that.state.job.item);

                        // 记录并且重置所使用的状态
                        that.saveAndReset(taskId)
                    }

                    // 异步回调
                    callback()
                })
                .pipe(fs.createWriteStream(filePath));
        } catch (e) {
            console.error(e)
            // 更改任务状态为 error
            that.props.task.updateStateJob(taskId, "error")
        }
    }


    /**
     * 创建 Excel
     */
    creatExcel = async (data, path) => {
        this.props.jobProcess.process.creatingExcel = true;
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('Sheet-1');

        sheet.columns = [
            {header: '号牌号码', key: 'plateNbr', width: 20},
            {header: '号牌种类', key: 'plateType', width: 20},
            {header: '违法时间', key: 'violationTime', width: 20},
            {header: '违法地点', key: 'addressDesc', width: 20},
            {header: '违法类型', key: 'violationType', width: 20},
            {header: '违法代码', key: 'violationCode', width: 20},
            {header: '违法行为', key: 'violationDesc', width: 100},
            {header: '采集机构', key: 'orgCode', width: 20},
            {header: '证据来源', key: 'violationSource', width: 20},
            {header: '证据机构', key: 'statusFlag', width: 20},
            {header: '过车图片链接', key: 'image', width: 20},
        ];

        let wrapData = data.map(val => {
            Object.keys(val).forEach(key => {
                if (!val[key]) {
                    val[key] = '';
                }
            })
            return val;
        })
            .map(item => {
            // 过车图片链接转换
            item.image = item.plateNbr + '|' + item.deviceSysNbr + '|' + item.snapNbr
            return item;
        })

        sheet.addRows(wrapData);

        // 第一行设置背景色
        const row1 = sheet.getRow(1);
        // 设置行高
        row1.height = 20;
        row1.eachCell(cell => {
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: {argb: 'FFA500'},
            }
            cell.font = {
                size: 12,
                bold: true
            }
        })


        // 所有单元格设置边框, 数据单元格设置背景色
        sheet.eachRow((row, rowNumber) => {
            row.eachCell((cell, colNumber) => {
                cell.border = {
                    top: {style: 'thin'},
                    left: {style: 'thin'},
                    bottom: {style: 'thin'},
                    right: {style: 'thin'}
                }
                cell.alignment = {
                    vertical: 'middle',
                    horizontal: 'center'
                }

                if (rowNumber !== 1) {
                    cell.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: {argb: 'FFEBCD'},
                    }
                }

                // 添加超链接
                if (rowNumber !== 1 && colNumber === 11) {
                    const plateNum = cell.value.split('|')[0];
                    const device_nbr = cell.value.split('|')[1];
                    const snap_nbr = cell.value.split('|')[2];
                    const imgName = plateNum + "_" + device_nbr + '_' + snap_nbr + ".jpg"
                    // 适用于图片和 Excel 在同一目录下
                    cell.value = {
                        text: "点击打开:" + plateNum + ".jpg",
                        hyperlink: './' + imgName,
                        tooltip: plateNum + ".jpg",
                    };
                }
            })
        })

        await workbook.xlsx.writeFile(path + config.sep + "[违法图片_选择导出].xlsx");
    }

    /**
     * 更新违法数据的导出状态
     * 结果已经不关心了
     */
    updateIllegalVehState = async (protocolData,jobItem) => {
        try {
            axios({
                method: 'POST',
                url: protocolData.extra.updateExportFlagUrl,
                data: jobItem.map(val => val.violationId + ''),
            })
        } catch (e) {
            console.error(e)
        }
    }

    saveAndReset = (jobId) => {
        this.props.task.updateJob(jobId,'process',this.props.jobProcess.process);

        this.setState({
            finishCount: 0,
            job: {
                item: [], // 资源项
                protocolData: {}, // 协议传输数据
            }
        })

        this.props.jobProcess.process = {}
    }

    render() {
        return (
            <div/>
        )
    }

}

export default IllegalVehSelect