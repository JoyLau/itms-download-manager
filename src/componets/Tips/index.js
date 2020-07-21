import React from 'react'
import {eventBus} from "../../util/utils";
import {inject, observer} from "mobx-react";

const {shell} = window.require('electron').remote;

@inject('global')
@observer
class Tips extends React.Component {

    state = {
        audio: null
    }

    componentDidMount() {
        eventBus.on('start-tips',this.startTips)
        eventBus.on('play-audio',this.playAudio)
    }

    startTips = (taskName,filePath) => {
        this.playAudio()
        this.playNotification(taskName,filePath)
    }

    playAudio = () => {
        if (!this.props.global.playFinishAudio) {
            return;
        }
        let that = this;
        // 播放下载完成铃声
        const mp3 = require('./' + this.props.global.finishAudio)
        this.setState({
            audio: mp3
        },function () {
            setTimeout(function () {
                that.setState({
                    audio: null
                })
            },100)
        })
    }

    playNotification = (taskName,filePath) => {
        // 显示下载完成提示
        if (this.props.global.finishTip){
            new Notification('任务下载完成', {
                body: taskName
            }).onclick = () => {
                // shell.openExternal("itms-download-manager://")
                shell.showItemInFolder(filePath)
            }
        }

        // 下载完成是否自动打开
        if (this.props.global.finishOpen){
            shell.showItemInFolder(filePath)
        }
    }



    render() {
        return (
            <div>
                <audio src={this.state.audio} autoPlay={true} hidden={true}/>
            </div>
        )
    }
}

export default Tips

