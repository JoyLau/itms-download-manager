/**
 * 过车导出_选择导出
 */
import React,{Component} from 'react'
import {inject, observer} from "mobx-react";
import axios from "axios";
import {message, notification} from "antd";
import progress from "request-progress";
import request from "request";
import {
    eventBus,
    md5Sign,
    formatDate,
    zip,
    updateNotification,
    closeNotification,
    waitMoment,
    formatDate_, basename, filename,
} from "../../../util/utils";
import Bagpipe from "../../Bagpipe/bagpipe";
import config from '../../../util/config'
import {tmpdir} from '../../../util/utils'
import {updateSysCode,getCodeName} from '../common'
import {toJS} from "mobx";
import {saveAllMetaData,deleteMetaData,allMetaData} from '../../../util/dbUtils'


const fs = window.require('fs');
const fse = window.require('fs-extra');
const ExcelJS = window.require('exceljs')

@inject('global', "task",'jobProcess')
@observer
class PassVehSelect extends Component {

    state = {
    }

    componentDidMount() {
        eventBus.on('passVeh-select', this.processSelectData)

        eventBus.on('pause', (info) => this.state[info.taskId] ? this.state[info.taskId].downloadBagpipe.pause() : null)

        eventBus.on('resume', (info) => this.state[info.taskId] ? this.state[info.taskId].downloadBagpipe.resume() : null)

        eventBus.on('stop', (info) => {
            if (this.state[info.taskId]) {
                this.state[info.taskId].downloadBagpipe.stop()
                this.saveAndReset(info.taskId);
            }
        })

        // 激活一个等待的任务
        eventBus.on('passVeh-select-waiting-to-active',(job) => {
            console.info("收到激活等待任务[过车导出-选择任务]信息:",job);
            this.process(job)
        })
    }

    // 导出选中数据
    processSelectData = async (data) => {
        let that = this;
        console.info("监听到 [过车导出] - [选择任务] ...")

        data.id = md5Sign(new Date().getTime().toString())

        updateNotification(notification, {
            key: data.id,
            message: '资源准备中',
            description: '',
        })

        try {
            if (data.extra.sysCode) {
                updateNotification(notification, {
                    key: data.id,
                    message: '资源准备中,请稍等',
                    description: '正在请求服务器字典数据...',
                })
                await updateSysCode(data.extra.sysCode)
            }


            updateNotification(notification, {
                key: data.id,
                message: '资源准备中,请稍等',
                description: '正在请求选择记录数据...',
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
                    console.log("过车导出选择任务的查询数据返回:", response);
                    updateNotification(notification, {
                        key: data.id,
                        message: '资源准备中,请稍等',
                        description: '正在添加任务...',
                    })
                    that.addJob(data, response.data)
                })
        } catch (e) {
            console.error(e)
            message.error('任务创建失败, 请检查参数及接口是否可用!');
        }
    }


    /**
     * 添加任务
     */
    addJob = (protocolData, resultData) => {
        const that = this;

        // 任务名称
        const taskName = "[过车数据_选择导出]"
            + protocolData.extra.searchData.currentUserName
            + "_"
            + formatDate_(new Date().getTime())
            + this.props.global.compressType;

        const process = {
            total: resultData.length,
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
            avatar: '过车/选择',
            url: protocolData.extra.downloadUrl, // 下载地址
            state: this.props.task.getJobs().filter(item => item.state === 'active').length >= this.props.global.maxTasks ? 'waiting' : 'active', // 任务状态, 如果当前有正在下载的任务, 则将任务置为等待中
            process: process,
            isNew: true,
            protocolData: protocolData, // 协议传输数据
        }

        //数据存放
        this.state[job.id] = {
            finishCount: 0,
            finishSize: 0,
            job: {
                item: resultData, // 资源项
            },
            downloadBagpipe: new Bagpipe(this.props.global.maxJobs, {}) // 任务单独分配线程
        }

        updateNotification(notification, {
            key: job.id,
            message: '资源准备中,请稍等',
            description: '数据缓存中...',
        })

        // 在此最好等数据存储完毕在进行下一步操作
        // 否则在此步骤关闭软件将导致不可控的问题
        saveAllMetaData(resultData,job.id,async function () {
            // 等一会,否则太快看不到提示
            await waitMoment(2000)
            closeNotification(notification, protocolData.id)
            // 添加任务
            that.props.task.addJob(job)
            // 开始处理
            await that.process(job)
        })
    }


    process = async job => {
        const that = this;
        if (job.state !== 'active') {
            return;
        }
        const jobId = job.id;
        // 判断元数据是否存在, 如果不存在,则需要从缓存中读取
        // 不存在的原因可能是软件被关闭了,导致任务中断
        if (!this.state[jobId]){
            const process = this.props.jobProcess.getProcess(job.id);
            this.props.jobProcess.updateProcessItem(job.id,'message',"数据读取中...")
            await waitMoment(500);
            // 获取任务的元数据
            const data = await allMetaData(jobId)
            that.state[jobId] = {
                finishCount: process.finishCount,
                finishSize: process.finishSize,
                job: {
                    item: data, // 资源项
                },
                downloadBagpipe: new Bagpipe(that.props.global.maxJobs, {}) // 任务单独分配线程
            }
            this.props.jobProcess.updateProcessItem(job.id,'message',null)
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
                if (val.image_url_path) {
                    val.image_url_path.split(";").forEach(url => {
                        task.push({
                            taskId: activeTask.id,
                            taskName: activeTask.name,
                            plateNum: val.plate_nbr,
                            imgUrl: url,
                            downloadUrl: activeTask.url,
                            device_nbr: val.device_nbr, // 设备编号
                            snap_nbr: val.snap_nbr, // 抓拍编号
                        })
                    })
                } else {
                    task.push({
                        taskId: activeTask.id,
                        taskName: activeTask.name,
                        plateNum: val.plateNbr,
                        imgUrl: 'blank_image_url',
                        downloadUrl: activeTask.url,
                        device_nbr: val.device_nbr, // 设备编号
                        snap_nbr: val.snap_nbr, // 抓拍编号
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
                // 如果发现 state.finishCount !== 0 的话,则任务为断点续传任务, 跳过之前的下载项
                if (index < this.state[activeTask.id].finishCount) return;
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

            const fileName = item.plateNum + "_" + item.device_nbr + "_" + item.snap_nbr + "_" + index + ".jpg";
            const filePath = path + config.sep + fileName;

            fse.ensureDirSync(path)

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
                    // 更改任务状态为 error
                    that.props.task.updateStateJob(taskId, "error")
                })
                .on('end', async function () {
                    that.state[taskId].finishCount++

                    // 当前任务已下载完成的文件数
                    let finishCount = that.state[taskId].finishCount

                    // 本文件大小
                    const fileSize = fs.statSync(filePath).size;

                    //  当前任务已下载的文件大小
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
                    if (total === that.state[taskId].finishCount) {
                        // 生成 excel
                        await that.creatExcel(taskId,that.state[taskId].job.item, path);

                        const zipFullPath = that.props.global.savePath + config.sep + taskName;
                        const newPath = path.replace(basename(path),filename(taskName));
                        // 重命名, 在 Windows 下使用 renameSync 会报错,这里改用 await rename
                        await fse.rename(path, newPath)
                        // 生成压缩包
                        that.props.jobProcess.updateProcessItem(taskId,'message',"正在压缩文件...")
                        await zip(newPath, zipFullPath, true)

                        // 播放下载完成提示音和通知
                        eventBus.emit('start-tips', taskName, zipFullPath)

                        // 更新状态, 等 1 秒
                        await waitMoment(1000)
                        that.props.jobProcess.updateProcessItem(taskId,'message',null)
                        // 保存路径
                        that.props.task.updateJob(taskId, "localPath",zipFullPath);
                        that.props.task.updateStateJob(taskId, "complete")

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
    creatExcel = async (taskId,data, path) => {
        this.props.jobProcess.updateProcessItem(taskId,'message',"正在生成 Excel...")
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('Sheet-1');

        sheet.columns = [
            {header: '号牌', key: 'plate_nbr', width: 20},
            {header: '号牌颜色', key: 'plate_color', width: 20},
            {header: '点位', key: 'siteName', width: 20},
            {header: '方向', key: 'direction_name', width: 20},
            {header: '过车时间', key: 'pass_time', width: 20},
            {header: '车速', key: 'speed', width: 20},
            {header: '车道', key: 'lane', width: 20},
            {header: '车辆类型', key: 'vehicle_type', width: 20},
            {header: '所属机构', key: 'org_code', width: 20},
            {header: '设备编号', key: 'device_sys_nbr', width: 20},
            {header: '车辆品牌', key: 'vehicle_brand', width: 20},
            {header: '车辆子品牌', key: 'vehicle_sub_brand', width: 20},
            {header: '车身颜色', key: 'vehicle_color', width: 20},
            {header: '二次识别', key: 'has_features', width: 20},
            {header: '过车图片链接', key: 'image_url_path', width: 20},
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
                // 好牌颜色转换
                item.plate_color = getCodeName('003', item.plate_color)
                // 过车时间转换
                item.pass_time = formatDate(item.pass_time)
                // 二次识别转化
                item.has_features = item.has_features === '1' ? "已通过" : '未通过'
                // 车辆类型转换
                item.vehicle_type = getCodeName('001', item.vehicle_type)
                // 过车图片链接转换
                item.image_url_path = item.plate_nbr + '|' + item.device_nbr + '|' + item.snap_nbr
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
                if (rowNumber !== 1 && colNumber === 15) {
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

        await workbook.xlsx.writeFile(path + config.sep + "[过车图片_选择导出].xlsx");
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

export default PassVehSelect