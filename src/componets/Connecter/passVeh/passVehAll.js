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
    getCodeName,
    formatDate,
    zip,
    updateNotification,
    closeNotification,
    waitMoment,
    bytesToSize,
    formatTime, unzip,
    formatDate_, basename, filename,
} from "../../../util/utils";
import Bagpipe from "../../Bagpipe/bagpipe";
import config from '../../../util/config'
import {toJS} from "mobx";
import {tmpdir} from '../../../util/utils'


const fs = window.require('fs');
const fse = window.require('fs-extra');
const ExcelJS = window.require('exceljs')

@inject('global', "task", 'sysCode','jobProcess')
@observer
class PassVehAll extends Component {

    state = {
        finishCount: 0,
        finishSize: 0,
    }

    downloadBagpipe = new Bagpipe(this.props.global.maxJobs, {});

    componentDidMount() {
        eventBus.on('passVeh-all', this.processAllData)

        eventBus.on('pause', () => this.downloadBagpipe.pause())

        eventBus.on('resume', () => this.downloadBagpipe.resume())

        eventBus.on('stop', (info) => {
            this.downloadBagpipe.stop()
            this.saveAndReset(info.taskId);
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
                await this.updateSysCode(data.extra.sysCode)
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
            fse.mkdirpSync(metaFilePath)

            // 下载数据文件
            progress(request.post(data.url, {form: data.params.inputBean}), {})
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
                    updateNotification(notification, {
                        key: data.id,
                        message: '元数据拉取中,请稍等...',
                        description: <span>
                                    花费时间: {formatTime(state.time.elapsed)}
                            <Divider type="vertical"/>
                                    拉取大小: {bytesToSize(state.size.transferred)}
                                    </span>,
                    })
                })
                .on('error', function (err) {
                    console.info(err)
                    message.error("元数据拉取失败!")
                    // 删除文件
                    fse.removeSync(metaFileFullPath)
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

                    await fs.readdirSync(metaFilePath).forEach((fileName, index) => {
                        const filePath = metaFilePath + config.sep + fileName;
                        //总记录数
                        bagpipe.push(that.readJSONFile, index, totalFiles, data, fileName, filePath, async function (index, itemData) {
                            allData.push(itemData)
                            if ((index + 1) === totalFiles) {
                                await that.bulkProcess(data, allData)
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


    readJSONFile = async (index, total, data, fileName, filePath, callback) => {
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
                callback(index, {
                    [fileName.replace(".json", "")]: response.data
                });
            })
    }

    bulkProcess = async (data, allData) => {
        let that = this;
        const taskId = data.id;

        updateNotification(notification, {
            key: data.id,
            message: '资源准备中,请稍等',
            description: '正在转换数据...',
        })

        const totalData = allData.flatMap(value => {
            const iData = value[Object.keys(value)[0]];
            iData.forEach(item => {
                item.taskId = data.id;
                item.dirName = Object.keys(value)[0];
                item.downloadUrl = data.extra.downloadUrl;
            })
            return iData;
        })
        const total = totalData.length

        // 任务名称
        const taskName = "[过车数据_全部导出]"
            + data.extra.searchData.currentUserName
            + "_"
            + formatDate_(new Date().getTime())
            + '.zip';

        const process = {
            total: total,
            finishCount: 0,
            percent: 0,
            finishSize: 0,
            remainingTime: ''
        };

        this.props.jobProcess.process = process;

        const job = {
            id: taskId, // id
            name: taskName,
            avatar: '违法/全部',
            url: data.extra.downloadUrl, // 下载地址
            state: this.props.task.getJobs().filter(item => item.state === 'active').length > 0 ? 'waiting' : 'active', // 任务状态, 如果当前有正在下载的任务, 则将任务置为等待中
            process: process,
            isNew: true,
        }

        // 等一会,否则太快看不到提示
        await waitMoment(2000)
        closeNotification(notification, taskId)

        // 添加任务
        this.props.task.addJob(job)

        const activeTask = toJS(this.props.task.getJobs().filter(item => item.state === 'active')[0])

        console.info("active 任务信息:", activeTask)

        const nowTime = new Date().getTime();
        totalData.forEach((item,index) => {
            this.downloadBagpipe.push(that.allDownload, index, nowTime, job, item, total, async function (finish) {
                // 如果全部完成了
                if (finish) {
                    // 删除 metaData 临时文件目录
                    fse.removeSync(tmpdir + config.sep + taskId + config.sep + "metaData");

                    const bg = new Bagpipe(1, {});

                    const rootPath = tmpdir + config.sep + taskId;

                    allData.forEach((val,index) => {
                        const key = Object.keys(val)[0];
                        const iData = val[key];

                        const excelPath = rootPath + config.sep + key;

                        // 生成 excel
                        bg.push(that.creatExcel, iData, excelPath,async function () {
                            // 所有 excel 都生成完毕
                            if (index + 1 === allData.length){

                                const zipFullPath = that.props.global.savePath + config.sep + taskName;

                                const newPath = rootPath.replace(basename(rootPath),filename(taskName));
                                // 重命名
                                fse.renameSync(rootPath, newPath)
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
            });
        })
    }

    allDownload = async (index, startTime,task, item, total, callback) => {
        let that = this;
        const taskId = item.taskId;
        const taskName = task.name;
        const parentPathName = item.dirName;

        try {
            const rootPath = tmpdir + config.sep + taskId;

            const parentPath = rootPath + config.sep + parentPathName;

            // 文件目录不存在则创建目录
            fse.mkdirpSync(parentPath);

            const imageUrl = item.image_url_path ? item.image_url_path.split(";")[0] : "";
            const fileName = item.plate_nbr + "_" + item.device_nbr + "_" + item.snap_nbr + "_" + index + ".jpg";

            const fileFullPath = parentPath + config.sep + fileName;

            progress(request(item.downloadUrl + "?imgUrl=" + encodeURIComponent(imageUrl), {
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

                    // 当前任务已下载完成的文件数
                    let finishCount = that.state.finishCount + 1;

                    that.state.finishCount = finishCount;

                    // 本文件大小
                    const fileSize = fs.statSync(fileFullPath).size;

                    // 当前任务已下载的文件大小
                    let finishSize = that.state.finishSize + fileSize;

                    that.state.finishSize = finishSize;

                    that.props.jobProcess.process = {
                        total: total,
                        finishCount: finishCount,
                        percent: Math.round(finishCount * 100 / total),
                        finishSize: finishSize,
                        speed: finishSize / (new Date().getTime() - startTime) * 1000,
                        remainingTime: ((new Date().getTime() - startTime) / finishCount) * (total - finishCount) / 1000
                    }


                    // 如果下载完成
                    if (total === finishCount) {
                        //全部完成回调
                        callback(true)
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
                description: `当前需要导出的数据量为 ${data.extra.total}, 导出超过 10w 的数据量,将严重影响服务器的性能, 是否继续 ??`,
                btn,
                key,
            });
        } else {
            callback(...args);
        }
    }


    /**
     * 需要字典表的数据,更新本地字典
     */
    updateSysCode = async (data) => {
        let that = this;
        await axios({
            method: data.method,
            url: data.url,
            params: {
                codeTypesString: data.params.codeTypesString
            },
        })
            .then(function (response) {
                Object.keys(response.data).forEach(key => {
                    that.props.sysCode.updateSysCodes(key, response.data[key])
                })
            })
    }

    /**
     * 创建 Excel
     */
    creatExcel = async (data, path,callback) => {
        this.props.jobProcess.process.creatingExcel = true;
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
        this.props.task.updateJob(jobId,'process',this.props.jobProcess.process);

        this.setState({
            finishCount: 0,
            finishSize: 0
        })

        this.props.jobProcess.process = {}
    }

    render() {
        return (
            <div/>
        )
    }

}

export default PassVehAll