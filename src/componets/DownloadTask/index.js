import React from 'react'
import {inject, observer} from "mobx-react";
import progress from "request-progress";
import request from "request";
import {genFileName,eventBus} from "../../util/utils";
import Bagpipe from "bagpipe";

const fs = window.require('fs')
const {shell} = window.require('electron').remote;

@inject('global','task')
@observer
class DownloadTask extends React.Component {

    state = {
        audio: null
    }

    componentDidMount() {
        // 监听新任务事件
        eventBus.on('new-task',this.process)
    }

    process = () => {
        const activeTask = this.props.task.jobs.filter(item => item.state === 'active')[0]
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
                            name: activeTask.name,
                            imgUrl: url,
                            downloadUrl: activeTask.url
                        })
                    })
                }
            })

            const bagpipe = new Bagpipe(this.props.global.maxJobs,{
                timeout: 3000 // 单个任务最多等待 3 s
            });

            const nowTime = new Date().getTime();
            task.forEach((item,index) => {
                bagpipe.push(that.download, index,item,task.length,nowTime,function () {
                    console.info(index,":任务完成")
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

        // 文件目录不存在则创建目录
        const path = this.props.global.savePath + "/" + taskId;

        const fileName = genFileName(encodeURIComponent(item.imgUrl)) + ".jpg";
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
                that.props.task.updateStateJob(taskId,"error")

            })
            .on('end', function () {
                // 当前任务
                let job = that.props.task.selectById(taskId);

                // 当前任务目录文件数
                let finishCount = fs.readdirSync(path).filter(value => fs.statSync(path + "/" + value).size > 0).length

                // 当前目录大小
                let finishSize = 0;

                fs.readdirSync(path).forEach(value => {
                    finishSize = finishSize + fs.statSync(path + "/" + value).size
                })

                job.process = {
                    total: total,
                    finishCount: finishCount,
                    percent: Math.round(finishCount * 100 / total),
                    finishSize: finishSize,
                    speed: finishSize / (new Date().getTime() - startTime ) * 1000,
                    remainingTime: ((new Date().getTime() - startTime )  / finishCount) * (total -finishCount) / 1000
                }


                // 更新当前任务
                that.props.task.updateJob(job)


                // 如果下载完成
                if (total === finishCount) {
                    // 播放下载铃声
                    const mp3 = require('../../module/SettingView/' + that.props.global.finishAudio)
                    that.setState({
                        audio: mp3
                    })

                    setTimeout(function () {
                        that.setState({
                            audio: null
                        })
                    },3000)

                    // 显示下载完成提示
                    new Notification('任务下载完成', {
                        body: item.name
                    }).onclick = () => {
                        // shell.openExternal("itms-download-manager://")
                        shell.showItemInFolder(path)
                    }

                    // 更新状态
                    that.props.task.updateStateJob(taskId,"complete")


                    // 异步回调
                    callback()
                }
            })
            .pipe(fs.createWriteStream(filePath));
    }

    render() {
        return (
            <div>
                <audio src={this.state.audio} autoPlay={true} hidden={true}/>
            </div>
        )
    }
}

export default DownloadTask

