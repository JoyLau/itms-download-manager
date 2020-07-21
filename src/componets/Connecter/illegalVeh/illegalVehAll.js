/**
 * 违法导出_全部导出
 */
import React, {Component} from 'react'
import {inject, observer} from "mobx-react";
import axios from "axios";
import {Button, Divider, message, notification} from "antd";
import progress from "request-progress";
import request from "request";
import {
    eventBus,
    md5Sign,
    zip,
    updateNotification,
    closeNotification,
    waitMoment, formatDate_, formatDate,
} from "../../../util/utils";
import Bagpipe from "../../Bagpipe/bagpipe";
import config from '../../../util/config'
import {toJS} from "mobx";
import {tmpdir,basename,filename} from '../../../util/utils'
import {allMetaData, deleteMetaData, saveAllMetaData} from "../../../util/dbUtils";


const fs = window.require('fs');
const fse = window.require('fs-extra');
const ExcelJS = window.require('exceljs')

@inject('global', "task",'jobProcess')
@observer
class IllegalVehAll extends Component {

    state = {
    }

    componentDidMount() {
        eventBus.on('illegalVeh-all', this.processAllData)

        eventBus.on('pause', (info) => this.state[info.taskId].downloadBagpipe.pause())

        eventBus.on('resume', (info) => this.state[info.taskId].downloadBagpipe.resume())

        eventBus.on('stop', (info) => {
            if (this.state[info.taskId]) {
                this.state[info.taskId].downloadBagpipe.stop()
                this.saveAndReset(info.taskId);
            }
        })

        // 激活一个等待的任务
        eventBus.on('illegalVeh-all-waiting-to-active',(job) => {
            console.info("收到激活等待任务[违法导出-全部任务]信息:",job);
            this.process(job)
        })
    }


    // 导出全部数据
    processAllData = (data) => {

        console.info("监听到[违法导出] - [全部任务]...")

        data.id = md5Sign(new Date().getTime().toString())

        // 将分页数定义为当前最大记录数
        data.params.opCondition.pageSize = data.extra.total

        this.bigDataTips(data, this.goOn, data)

    }

    // 确定继续操作
    goOn = async (data) => {
        let that = this;
        updateNotification(notification, {
            key: data.id,
            message: '资源准备中',
            description: '',
        })

        try {
            updateNotification(notification, {
                key: data.id,
                message: '资源准备中,请稍等',
                description: '正在请求记录数据...',
            })

            await this.getSearchData(data,async function (items) {
                that.addJob(data,items.result.rows)
            })

        } catch (e) {
            console.error(e)
            message.error('任务创建失败, 请检查参数及接口是否可用!');
        }


    }

    getSearchData = async (data,callback) => {
        await axios({
            method: data.method,
            url: data.url,
            data: data.params.opCondition,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            transformRequest: [function (data) {
                let ret = ''
                for (let it in data) {
                    ret += encodeURIComponent(it) + '=' + encodeURIComponent(data[it]) + '&'
                }
                return ret
            }],
        })
            .then(function (response) {
                updateNotification(notification, {
                    key: data.id,
                    message: '资源准备中,请稍等',
                    description: '数据读取中...',
                })
                callback(response.data)
            })
            .catch(function (err) {
                console.info(err)
                message.error('任务创建失败, 请检查参数及接口是否可用!');
                closeNotification(notification,data.id)
            })
    }


    addJob = (protocolData, datas) => {
        const that = this;
        // 任务名称
        const taskName = "[违法数据_全部导出]"
            + protocolData.extra.searchData.currentUserName
            + "_"
            + formatDate_(new Date().getTime())
            + '.zip';

        const process = {
            total: datas.length,
            finishCount: 0,
            percent: 0,
            finishSize: 0,
            remainingTime: ''
        }

        this.props.jobProcess.updateProcess(protocolData.id,process)

        const job = {
            id: protocolData.id, // id
            name: taskName,
            creatTime: formatDate(new Date().getTime()),
            type: protocolData.extra.name + '-' + protocolData.extra.type,
            avatar: '违法/全部',
            url: protocolData.extra.downloadUrl, // 下载地址
            state: this.props.task.getJobs().filter(item => item.state === 'active').length >= this.props.global.maxTasks ? 'waiting' : 'active', // 任务状态, 如果当前有正在下载的任务, 则将任务置为等待中
            process: process,
            isNew: true,
            // protocolData: protocolData.extra.searchData, // 协议传输数据
        }

        //数据存放
        this.state[job.id] = {
            finishCount: 0,
            finishSize: 0,
            job: {
                item: datas, // 资源项
            },
            downloadBagpipe: new Bagpipe(this.props.global.maxJobs, {}) // 任务单独分配线程
        }

        updateNotification(notification, {
            key: job.id,
            message: '资源准备中,请稍等',
            description: '数据缓存中...',
        })

        saveAllMetaData(datas,job.id,async function () {
            // 等一会,否则太快看不到提示
            await waitMoment(2000)
            closeNotification(notification, protocolData.id)
            // 添加任务
            that.props.task.addJob(job)
            // 开始处理
            that.process(job)
        })
    }

    process = job => {
        const that = this;
        if (job.state !== 'active') {
            return;
        }
        const jobId = job.id;

        if (!this.state[jobId]){
            updateNotification(notification, {
                key: jobId,
                message: '资源准备中,请稍等',
                description: '数据读取中...',
            })

            // 获取任务的元数据
            allMetaData(jobId,function (data) {
                that.state[jobId] = {
                    finishCount: 0,
                    finishSize: 0,
                    job: {
                        item: data, // 资源项
                    },
                    downloadBagpipe: new Bagpipe(that.props.global.maxJobs, {}) // 任务单独分配线程
                }
            })
        }
        // 存放的值再赋值进去
        job.item = this.state[jobId].job.item;
        console.info("active 任务信息:", job)
        this.downloadTask(job)
    }

    downloadTask = (activeTask) => {
        let that = this;
        try {
            let task = [];
            activeTask.item.forEach(val => {
                // 如果图片地址不存在, 则放一个空图片地址
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
                this.state[activeTask.id].downloadBagpipe.push(that.download, index, item, task.length, nowTime, function () {});
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
            const path = tmpdir + config.sep + taskId;

            const fileName = item.plateNum + "_" + item.deviceSysNbr + "_" + item.snapNbr + "_" + index + ".jpg";
            const filePath = path + config.sep + fileName;

            fse.ensureDirSync(path)

            progress(request(item.downloadUrl + "?imgUrl=" + encodeURIComponent(item.imgUrl)), {})
                .on('progress', function (state) {
                })
                .on('error', function (err) {
                    console.info(err)
                    // 更改任务状态为 error
                    that.props.task.updateStateJob(taskId, "error")

                })
                .on('end', async function () {
                    that.state[taskId].finishCount++

                    // 当前任务已下载完成的文件数
                    let finishCount = that.state[taskId].finishCount

                    // 本文件大小
                    const fileSize = fs.statSync(filePath).size;

                    // 当前任务已下载的文件大小
                    let finishSize = that.state[taskId].finishSize + fileSize;

                    that.state[taskId].finishSize = finishSize;

                    const process = {
                        total: total,
                        finishCount: finishCount,
                        percent: Math.round(finishCount * 100 / total),
                        finishSize: finishSize,
                        speed: finishSize / (new Date().getTime() - startTime) * 1000,
                        remainingTime: ((new Date().getTime() - startTime) / finishCount) * (total - finishCount) / 1000
                    }

                    // 更新当前任务进度
                    that.props.jobProcess.updateProcess(taskId,process)

                    // 如果下载完成
                    if (that.state[taskId].finishCount === total) {
                        // 生成 excel
                        await that.creatExcel(taskId, that.state[taskId].job.item, path);


                        const zipFullPath = that.props.global.savePath + config.sep + taskName;

                        const newPath = path.replace(basename(path),filename(taskName));
                        // 重命名, 在 Windows 下使用 renameSync 会报错,这里改用 await rename
                        await fse.rename(path, newPath)
                        // 生成压缩包
                        await zip(newPath, zipFullPath, true)


                        // 播放下载完成提示音和通知
                        eventBus.emit('start-tips', taskName, zipFullPath)

                        // 更新状态, 等 1 秒
                        await waitMoment(1000)
                        // 保存路径
                        that.props.task.updateJob(taskId, "localPath",zipFullPath);
                        // 更改状态
                        that.props.task.updateStateJob(taskId, "complete");

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
     * 大于指定数据的数据量进行提示
     */
    bigDataTips = (data, callback, ...args) => {
        if (data.extra && data.extra.total && data.extra.total >= (data.extra.dataLimit ? data.extra.dataLimit : 10000)) {
            const key = data.id;
            const btn = (
                <div>
                    <Button size="small"
                            style={{marginRight: 30}}
                            onClick={() => {
                                // 将分页大小改为 10000
                                args[0].params.opCondition.pageSize = (data.extra.dataLimit ? data.extra.dataLimit : 10000)
                                callback(...args);
                            }}>
                        继续
                    </Button>
                    <Button size="small"
                            type="primary"
                            onClick={() => {
                                notification.close(key);
                                console.info("明智的选择!")
                            }} style={{marginRight: 30}}>
                        取消
                    </Button>
                </div>

            );
            notification.warning({
                message: '警告',
                description: `当前需要导出的数据量为 ${data.extra.total}, 由于数据库性能所限, 违法导出数据不得大于 ${(data.extra.dataLimit ? data.extra.dataLimit : 10000)} 条, 是否导出前 ${(data.extra.dataLimit ? data.extra.dataLimit : 10000)} 条记录?`,
                btn,
                key,
            });
        } else {
            callback(...args);
        }
    }


    /**
     * 创建 Excel
     */
    creatExcel = async (taskId,data, path) => {
        this.props.jobProcess.updateProcessItem(taskId,'creatingExcel',true)
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
                data: jobItem.map(val => val.violationId),
            })
        } catch (e) {
            console.error(e)
        }
    }

    saveAndReset = (jobId) => {
        // 更新当前的任务进度
        this.props.task.updateJob(jobId,'process',toJS(this.props.jobProcess.process[jobId]));

        // 删除当前任务的记录信息
        delete this.state[jobId]

        // 删除进度信息
        this.props.jobProcess.deleteProcess(jobId)

        // 删除任务元数据信息
        deleteMetaData(jobId)

        // 发出任务下载完成通知
        eventBus.emit('job-downloaded',jobId)
    }

    render() {
        return (
            <div/>
        )
    }

}

export default IllegalVehAll