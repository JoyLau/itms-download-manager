import React from 'react'
import {inject, observer} from "mobx-react";
import config from "../../util/config"
import progress from "request-progress";
import request from "request";
import {genFileName,eventBus} from "../../util/utils";
import Bagpipe from "bagpipe";

const fs = window.require('fs')

@inject('global')
@inject('task')
@observer
class DownloadTask extends React.Component {


    componentDidMount() {
        // 监听新任务事件
        eventBus.on('new-task',this.process)
    }

    process = () => {
        let that = this;
        const activeTasks = this.props.task.jobs.filter(item => item.state === 'active')
        console.info("active 任务信息:",activeTasks)

        // 设定最大并发数
        const bagpipe = new Bagpipe(this.props.global.maxJobs,{
            timeout: 1000
        });

        bagpipe.on('full', function (length) {
            console.warn('底层系统处理不能及时完成，排队中，目前队列长度为:' + length);
        });

        activeTasks.forEach(activeTask => {
            bagpipe.push(that.downloadTask,activeTask);
        })



    }

    downloadTask = (activeTask) => {
        try {
            let that = this;
            let task = [];
            activeTask.item.forEach(val => {
                val.imageUrlPath.split(";").forEach(url => {
                    task.push({
                        taskId: activeTask.id,
                        url: url
                    })
                })
            })

            const bagpipe = new Bagpipe(1, {
                timeout: 3000
            });

            task.forEach(item => {
                bagpipe.push(that.download, item.taskId, item.url);
            })
        } catch (e) {
            console.error(e)
        }
    }

    download = (taskId,url) => {
        let that = this;
        // 文件目录不存在则创建目录
        const path = this.props.global.savePath + "/" + taskId;

        const filePath = path + "/" + genFileName(url) + ".jpg"

        if (!fs.existsSync(path)) {
            fs.mkdirSync(path)
        }


        progress(request(url), {
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
                // 下载出错删除文件
                fs.unlinkSync(filePath);

                // 更改任务状态为 error
                that.props.task.updateStateJob(taskId,"error")

                // 更新当前任务
                let job = that.props.task.selectById(taskId);
                job.process = {
                    fileName: genFileName(url) + ".jpg",
                    filePath: filePath,
                    savePath: path,
                    fileState: 'error',
                    fileSize: 0,
                    filePercent: 0,
                    fileSpeed: 0,
                    file: {
                        size: {
                            transferred: 0
                        }
                    }
                }
                that.props.task.updateJob(job)
            })
            .on('end', function () {
                console.info("end")
            })
            .pipe(fs.createWriteStream(filePath));
    }

    render() {
        return (
            <div/>
        )
    }
}

export default DownloadTask

