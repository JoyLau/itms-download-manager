/**
 * 过车导出
 */
import React from 'react'
import {inject, observer} from "mobx-react";
import axios from "axios";
import {message,notification} from "antd";
import progress from "request-progress";
import request from "request";
import {eventBus, md5Sign, getCodeName, formatDate, zip,updateNotification,closeNotification,waitMoment} from "../../util/utils";
import Bagpipe from "bagpipe";



const fs = window.require('fs');
const ExcelJS = window.require('exceljs')

@inject('global',"task",'sysCode')
@observer
class PassVeh extends React.Component{

    componentDidMount() {
        eventBus.on('passVeh-select',this.processSelectData)
        eventBus.on('passVeh-all',this.processAllData)
    }


    // 导出选中数据
    processSelectData = async (data) => {
        let that = this;
        console.info("监听到过车导出选择任务...")

        data.id = md5Sign(new Date().getTime().toString())
        console.info(new Date().getTime().toString(),data.id)
        updateNotification(notification,{
            key: data.id,
            message: '资源准备中',
            description:'',
        })

        // setTimeout(function () {
        //     notification.close(data.id)
        // },5000)


        try {
            if (data.extra.sysCode) {
                updateNotification(notification,{
                    key: data.id,
                    message: '资源准备中,请稍等',
                    description:'正在请求服务器字典数据...',
                })
                await this.updateSysCode(data.extra.sysCode)
            }


            updateNotification(notification,{
                key: data.id,
                message: '资源准备中,请稍等',
                description:'正在请求选择记录数据...',
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
                    updateNotification(notification,{
                        key: data.id,
                        message: '资源准备中,请稍等',
                        description:'正在添加任务...',
                    })
                    that.addJob(data, response.data)
                    closeNotification(notification,data.id)
                })
        } catch (e) {
            console.error(e)
            message.error('任务创建失败, 请检查参数及接口是否可用!');
        }
    }

    // 需要字典表的数据,更新本地字典
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
                    that.props.sysCode.updateSysCodes(key,response.data[key])
                })
            })
    }


    // 导出全部数据
    processAllData = (data) => {
        console.info("监听到过车导出全部任务...")
        console.info(JSON.stringify(data.params.inputBean))
        let that = this;

        // const req = request(data.url,{
        //     method: 'POST',
        //     // json: true,
        //     // headers: {
        //     //     "content-type": "application/x-www-form-urlencoded",
        //     // },
        //     body: data.params.inputBean
        // })


        // 下载数据文件
        progress(request.post(data.url, {form: data.params.inputBean}), {
            // throttle: 2000,                    // Throttle the progress event to 2000ms, defaults to 1000ms
            // delay: 1000,                       // Only start to emit after 1000ms delay, defaults to 0ms
            // lengthHeader: 'x-transfer-length'  // Length header to use, defaults to content-length
        })
            .on('progress', function (state) {
                console.info(state)
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
            })
            .on('end', function () {
                console.info("end")
            })
            .pipe(fs.createWriteStream(this.props.global.savePath + "/dd990.zip"));

    }


    /**
     * 添加任务
     */
    addJob = (protocolData, resultData) => {
        // 任务名称
        const taskName = "[过车数据_" + (protocolData.extra.type === 'select' ? '选择导出' : '全部导出') + "] "
            + protocolData.extra.searchData.currentUserName
            + "_"
            + protocolData.extra.searchData.passTimeStart.split(' ')[0]
            + "_"
            + protocolData.extra.searchData.passTimeEnd.split(' ')[0]
            + '.zip';
        const job = {
            id: protocolData.id, // id
            name: taskName,
            url: protocolData.extra.downloadUrl, // 下载地址
            state: this.props.task.getJobs().filter(item => item.state === 'active').length > 0 ? 'waiting' : 'active', // 任务状态, 如果当前有正在下载的任务, 则将任务置为等待中
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

        // 开始处理
        this.process()

    }


    process = () => {
        const activeTask = this.props.task.getJobs().filter(item => item.state === 'active')[0]
        console.info("active 任务信息:",activeTask)

        this.downloadTask(activeTask)
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
                            downloadUrl: activeTask.url
                        })
                    })
                }
            })

            const bagpipe = new Bagpipe(this.props.global.maxJobs,{});

            const nowTime = new Date().getTime();
            task.forEach((item,index) => {
                bagpipe.push(that.download, index,item,task.length,nowTime,function () {
                });
            })
        } catch (e) {
            console.error(e)
            // 更改任务状态为 error
            that.props.task.updateStateJob(activeTask.id,"error")
        }
    }

    download = (index,item,total,startTime,callback) => {
        let that = this;
        const taskId = item.taskId;
        const taskName = item.taskName;

        // 文件目录不存在则创建目录
        const path = this.props.global.savePath + "/" + taskId;

        const fileName = item.plateNum + "_" + md5Sign(encodeURIComponent(item.imgUrl)) + ".jpg";
        const filePath = path + "/" + fileName;

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

                // 当前任务目录文件数
                let finishCount = fs.readdirSync(path).filter(value => fs.statSync(path + "/" + value).size > 0).length

                // 当前目录大小
                let finishSize = 0;

                fs.readdirSync(path).forEach(value => {
                    finishSize = finishSize + fs.statSync(path + "/" + value).size
                })

                const jobProcess = {
                    total: total,
                    finishCount: finishCount,
                    percent: Math.round(finishCount * 100 / total),
                    finishSize: finishSize,
                    speed: finishSize / (new Date().getTime() - startTime) * 1000,
                    remainingTime: ((new Date().getTime() - startTime) / finishCount) * (total - finishCount) / 1000
                }


                // 更新当前任务
                that.props.task.updateJob(taskId, "process", jobProcess)


                // 如果下载完成
                if (total === finishCount) {
                    // 生成 excel
                    await that.creatExcel(that.props.task.selectValueById(taskId, 'item'), path);

                    // 生成压缩包
                    const zipFullPath = that.props.global.savePath + "/" + taskName.replace(".zip","") + taskId + '.zip';
                    await zip(path,zipFullPath,true)


                    // 播放下载完成提示音和通知
                    eventBus.emit('start-tips', taskName, zipFullPath)

                    // 更新状态, 等 1 秒
                    await waitMoment(1000)
                    that.props.task.updateStateJob(taskId, "complete")
                }

                // 异步回调
                callback()
            })
            .pipe(fs.createWriteStream(filePath));
    }


    /**
     * 创建 Excel
     * @param data
     * @param path
     * @returns {Promise<void>}
     */
    creatExcel = async (data,path) => {
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('Sheet-1');

        sheet.columns = [
            { header: '号牌', key: 'plate_nbr', width: 20},
            { header: '号牌颜色', key: 'plate_color', width: 20 },
            { header: '点位', key: 'siteName', width: 20},
            { header: '方向', key: 'direction_name', width: 20 },
            { header: '过车时间', key: 'pass_time', width: 20 },
            { header: '车速', key: 'speed', width: 20 },
            { header: '车道', key: 'lane', width: 20 },
            { header: '车辆类型', key: 'vehicle_type', width: 20 },
            { header: '所属机构', key: 'org_code', width: 20 },
            { header: '设备编号', key: 'device_sys_nbr', width: 20 },
            { header: '车辆品牌', key: 'vehicle_brand', width: 20 },
            { header: '车辆子品牌', key: 'vehicle_sub_brand', width: 20 },
            { header: '车身颜色', key: 'vehicle_color', width: 20 },
            { header: '二次识别', key: 'has_features', width: 20 },
            { header: '过车图片链接', key: 'image_url_path', width: 20 },
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
                item.vehicle_type = getCodeName('001',item.vehicle_type)
                // 过车图片链接转换
                item.image_url_path = item.plate_nbr + '|' + item.image_url_path
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
                pattern:'solid',
                fgColor:{argb:'FFA500'},
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
                    top: {style:'thin'},
                    left: {style:'thin'},
                    bottom: {style:'thin'},
                    right: {style:'thin'}
                }
                cell.alignment = {
                    vertical: 'middle',
                    horizontal: 'center'
                }

                if (rowNumber !== 1) {
                    cell.fill = {
                        type: 'pattern',
                        pattern:'solid',
                        fgColor:{argb:'FFEBCD'},
                    }
                }

                // 添加超链接
                if (rowNumber !== 1 && colNumber === 15) {
                    const plateNum = cell.value.split('|')[0];
                    const imgName = plateNum + "_" +md5Sign(encodeURIComponent(cell.value.split('|')[1])) + ".jpg"
                    // 适用于图片和 Excel 在同一目录下
                    cell.value = {
                            text: "点击打开:" + plateNum + ".jpg",
                            hyperlink: './'+ imgName,
                            tooltip: plateNum + ".jpg",
                        };
                }
            })
        })

        await workbook.xlsx.writeFile(path + "/[过车图片_选择导出].xlsx");
    }


    render() {
        return (
            <div/>
        )
    }

}

export default PassVeh