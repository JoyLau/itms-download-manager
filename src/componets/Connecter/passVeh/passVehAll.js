/**
 * 过车导出_全部导出
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
    formatDate,
    zip,
    updateNotification,
    closeNotification,
    waitMoment,
    bytesToSize,
    formatTime, unzip,
    formatDate_, basename, filename,
} from "../../../util/utils";
import {allMetaData, deleteMetaData, getCodeName, saveAllMetaData} from '../../../util/dbUtils'
import Bagpipe from "../../Bagpipe/bagpipe";
import config from '../../../util/config'
import {toJS} from "mobx";
import {tmpdir} from '../../../util/utils'
import {updateSysCode} from '../common'
import _ from "lodash";

const fs = window.require('fs');
const fse = window.require('fs-extra');
const ExcelJS = window.require('exceljs')

@inject('global', "task",'jobProcess')
@observer
class PassVehAll extends Component {

    state = {
    }


    componentDidMount() {
        eventBus.on('passVeh-all', this.processAllData)

        eventBus.on('pause', (info) => this.state[info.taskId].downloadBagpipe.pause())

        eventBus.on('resume', (info) => this.state[info.taskId].downloadBagpipe.resume())

        eventBus.on('stop', (info) => {
            if (this.state[info.taskId]) {
                this.state[info.taskId].downloadBagpipe.stop()
                this.saveAndReset(info.taskId);
            }
        })

        // 激活一个等待的任务
        eventBus.on('passVeh-all-waiting-to-active',(job) => {
            console.info("收到激活等待任务[过车导出-全部任务]信息:",job);
            this.process(job)
        })
    }


    // 导出全部数据
    processAllData = (data) => {

        console.info("监听到[过车导出] - [全部任务]...")

        data.id = md5Sign(new Date().getTime().toString())

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
                description: '正在请求记录元数据...',
            })

            // 元数据文件名
            const metaFileName = "metaData.zip"

            // 任务跟目录
            const taskRootPath = tmpdir + config.sep + data.id;

            // 元数据目录
            const metaFilePath = taskRootPath + config.sep + "metaData";

            // 元数据全路径
            const metaFileFullPath = metaFilePath + config.sep + metaFileName;

            //确保路径存在
            fse.ensureDirSync(metaFilePath)

            // 下载数据文件
            progress(request.post(data.url, {form: data.params.inputBean}), {})
                .on('progress', function (state) {
                    updateNotification(notification, {
                        key: data.id,
                        message: '元数据拉取中,请稍等...',
                        description: <span>
                                    花费时间: {formatTime(state.time.elapsed)}
                                    <Divider type="vertical"/>
                                    块大小: {bytesToSize(state.size.transferred)}
                                    </span>,
                    })
                })
                .on('error', function (err) {
                    console.info(err)
                    message.error("元数据拉取失败!")
                })
                .on('end', async function () {
                    updateNotification(notification, {
                        key: data.id,
                        message: '资源准备中,请稍等',
                        description: '解压中...',
                    })

                    await unzip(metaFileFullPath, metaFilePath, true)

                    updateNotification(notification, {
                        key: data.id,
                        message: '资源准备中,请稍等',
                        description: '正在写入缓存...',
                    })

                    // 读取 json 存入 indexedDB
                    const bagpipe = new Bagpipe(1, {});
                    const totalFiles = fs.readdirSync(metaFilePath).length;

                    const allData = []

                    fs.readdirSync(metaFilePath).forEach((fileName, index) => {
                        const filePath = metaFilePath + config.sep + fileName;
                        //总记录数
                        bagpipe.push(that.readJSONFile, index, totalFiles, data, filePath, function (index, itemData) {
                            allData.push(itemData)
                            // 解析完毕
                            if ((index + 1) === totalFiles) {
                                that.bulkProcess(data, allData)
                            }
                        });
                    })


                    // closeNotification(notification, data.id)


                })
                .pipe(fs.createWriteStream(metaFileFullPath));
        } catch (e) {
            console.error(e)
            message.error('任务创建失败, 请检查参数及接口是否可用!');
        }


    }


    readJSONFile = async (index, total, data, filePath, callback) => {
        updateNotification(notification, {
            key: data.id,
            message: '正在写入缓存,请稍等...',
            description: <span>
                        当前: 第 {index + 1} 批
                        <Divider type="vertical"/>
                        共: {total} 批
                        </span>,
        })

        // 记录 ids 的数组
        const ids = fse.readJsonSync(filePath)

        axios({
            method: data.extra.vehPassByIds.method,
            url: data.extra.vehPassByIds.url,
            data: ids,
        })
            .then(async function (response) {
                callback(index, response.data);
            })
    }

    bulkProcess = (data, allData) => {
        let that = this;
        const taskId = data.id;

        updateNotification(notification, {
            key: taskId,
            message: '资源准备中,请稍等',
            description: '正在转换数据...',
        })

        // 任务名称
        const taskName = "[过车数据_全部导出]"
            + data.extra.searchData.currentUserName
            + "_"
            + formatDate_(new Date().getTime())
            + this.props.global.compressType;

        const totalData = allData.flatMap((value,index) => {
            value.forEach(item => {
                item.taskId = taskId;
                item.taskName = taskName;
                item.dirName = index;
                item.downloadUrl = data.extra.downloadUrl;
            })
            return value;
        })

        const process = {
            total: totalData.length,
            finishCount: 0,
            percent: 0,
            finishSize: 0,
            remainingTime: ''
        };

        this.props.jobProcess.updateProcess(taskId,process)

        const job = {
            id: taskId, // id
            name: taskName,
            creatTime: formatDate(new Date().getTime()),
            type: data.extra.name + '-' + data.extra.type,
            avatar: '违法/全部',
            url: data.extra.downloadUrl, // 下载地址
            state: this.props.task.getJobs().filter(item => item.state === 'active').length >= this.props.global.maxTasks ? 'waiting' : 'active', // 任务状态, 如果当前有正在下载的任务, 则将任务置为等待中
            process: process,
            isNew: true,
            // protocolData: data.extra.searchData, // 协议传输数据
        }

        //数据存放
        this.state[job.id] = {
            finishCount: 0,
            finishSize: 0,
            job: {
                item: totalData, // 资源项
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
        saveAllMetaData(totalData,job.id,async function () {
            // 等一会,否则太快看不到提示
            await waitMoment(2000)
            closeNotification(notification, taskId)
            // 添加任务
            that.props.task.addJob(job)
            // 开始处理
            that.process(job)
        })
    }


    process = (job) => {
        const that = this;
        if (job.state !== 'active') {
            return;
        }
        const jobId = job.id;

        if (!this.state[jobId]){
            updateNotification(notification, {
                key: jobId,
                message: '资源准备中,请稍等',
                description: '元数据读取中...',
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


    downloadTask = job => {
        const that = this;
        const nowTime = new Date().getTime();
        const total = job.item.length;

        if (total === 0 ) {
            message.warn("没有资源可供下载!")
            that.props.task.deleteJob(job.id)
            return;
        }
        job.item.forEach((item,index) => {
            this.state[job.id].downloadBagpipe.push(that.download, index, nowTime, item, total, async function (finish) {});
        })
    }

    download = async (index, startTime, item, total, callback) => {
        const that = this;
        const taskId = item.taskId;
        const taskName = item.taskName;
        const parentPathName = item.dirName;

        try {
            const rootPath = tmpdir + config.sep + taskId;

            const parentPath = rootPath + config.sep + parentPathName;

            // 文件目录不存在则创建目录
            fse.ensureDirSync(parentPath);

            const imageUrl = item.image_url_path ? item.image_url_path.split(";")[0] : "blank_image_url";
            const fileName = item.plate_nbr + "_" + item.device_nbr + "_" + item.snap_nbr + "_" + index + ".jpg";

            const fileFullPath = parentPath + config.sep + fileName;

            progress(request(item.downloadUrl + "?imgUrl=" + encodeURIComponent(imageUrl), {})
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
                    let finishCount = that.state[taskId].finishCount;

                    // 本文件大小
                    const fileSize = fs.statSync(fileFullPath).size;

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

                    // 如果下载全部完成
                    if (total === that.state[taskId].finishCount) {
                        const rootPath = tmpdir + config.sep + taskId;

                        // 删除 metaData 临时文件目录
                        fse.removeSync(rootPath + config.sep + "metaData");

                        const bg = new Bagpipe(1, {});

                        // 逐个生成 Excel
                        // 按每 1000 条进行分割
                        const bulkData = _.chunk(that.state[taskId].job.item, 10000);
                        bulkData.forEach((item,index) => {
                            const excelPath = rootPath + config.sep + index;

                            // 生成 excel
                            bg.push(that.creatExcel, taskId,item, excelPath,async function () {
                                // 所有 excel 都生成完毕
                                if (index + 1 === bulkData.length){
                                    const zipFullPath = that.props.global.savePath + config.sep + taskName;

                                    const newPath = rootPath.replace(basename(rootPath),filename(taskName));
                                    // 重命名, 在 Windows 下使用 renameSync 会报错,这里改用 await rename
                                    await fse.rename(rootPath, newPath)
                                    // 生成压缩包
                                    await zip(newPath, zipFullPath, true)

                                    // 播放下载完成提示音和通知
                                    eventBus.emit('start-tips', taskName, zipFullPath)

                                    // 更新状态, 等 1 秒
                                    await waitMoment(1000)
                                    // 保存路径
                                    that.props.task.updateJob(taskId, "localPath",zipFullPath);
                                    that.props.task.updateStateJob(taskId, "complete")

                                    // 记录并且重置所使用的状态
                                    that.saveAndReset(taskId)
                                }
                            })
                        })
                    }

                    // 异步回调
                    callback()
                })
                .pipe(fs.createWriteStream(fileFullPath)));
        } catch (e) {
            console.error(e);
            // 更改任务状态为 error
            that.props.task.updateStateJob(taskId, "error")
        }

    }


    /**
     * 大于10w 的数据进行提示
     */
    bigDataTips = (data, callback, ...args) => {
        if (data.extra && data.extra.total && data.extra.total >= 100000) {
            const key = data.id;
            const btn = (
                <div>
                    <Button size="small"
                            onClick={() => {
                                callback(...args);
                            }} style={{marginRight: 30}}>
                        继续
                    </Button>
                    <Button type="primary" size="small"
                            onClick={() => {
                                notification.close(key);
                                console.info("明智的选择!")
                            }}>
                        取消
                    </Button>
                </div>

            );
            notification.warning({
                message: '警告',
                description: `当前需要导出的数据量为 ${data.extra.total}, 导出超过 10w 的数据量,可能会影响服务器的性能, 是否继续 ?`,
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
    creatExcel = async (taskId,data, path,callback) => {
        this.props.jobProcess.updateProcessItem(taskId,'creatingExcel',true)
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

        await workbook.xlsx.writeFile(path + config.sep + "[过车图片_全部导出].xlsx");
        callback()
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

export default PassVehAll