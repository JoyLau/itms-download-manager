import React from 'react'
import { Button} from 'antd'
import device from '../../util/device'
import {MinusOutlined,ShrinkOutlined,ArrowsAltOutlined,CloseOutlined } from'@ant-design/icons';
import {inject, observer} from "mobx-react";


const {BrowserWindow} = window.require('electron').remote

const classList = document.body.parentElement.classList

@inject('task')
@observer
class WindowControl extends React.Component{

  state = {
    isFullScreen: classList.contains('device-fullscreen')
  }

  onResizeClick(){
    if (device.electron) {
      const win = BrowserWindow.getFocusedWindow()
      if (win) {
        win.isMaximized() ? win.unmaximize() : win.maximize()
        setTimeout(() => {
          this.setState({
            isFullScreen: win.isMaximized()
          })
        }, 500)
      }
    } else {
      classList.contains('device-fullscreen') ? classList.remove('device-fullscreen') : classList.add('device-fullscreen')
      this.setState({
        isFullScreen: classList.contains('device-fullscreen')
      })
    }
  }

  onCloseClick(){
    const that = this;
    // 删除正在运行的任务和等待
    this.props.task.getJobs().forEach(job => {
      if (job.state !== 'complete') {
        that.props.task.deleteJob(job.id)
      }
    })
    setTimeout(function () {
      const win = BrowserWindow.getFocusedWindow()
      win && win.close()
    },1000)
  }

  onMinimizeClick(){
    const win = BrowserWindow.getFocusedWindow()
    win && win.minimize()
  }

  render(){
    const {isFullScreen} = this.state
    return (
      <div className="window-control">
        <Button onClick={this.onMinimizeClick.bind(this)} className="device-electron-show">
          <MinusOutlined />
        </Button>
        <Button onClick={this.onResizeClick.bind(this)}>
          {isFullScreen ?<ShrinkOutlined />: <ArrowsAltOutlined />}
        </Button>
        <Button onClick={this.onCloseClick.bind(this)} className="device-electron-show">
          <CloseOutlined style={{color:'red'}}/>
        </Button>
      </div>
    )
  }
}
export default WindowControl