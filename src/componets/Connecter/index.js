import React from 'react'
import {inject, observer} from "mobx-react";
import config from "../../util/config"
const {ipcRenderer} = window.require('electron')

@inject('global')
@observer
class Connecter extends React.Component {

    componentDidMount() {
        // 监听到通过自定义协议打开的操作
        ipcRenderer.on('open-protocol', (event, arg) => {
            this.props.global.changeMainMenu("active")
            const data  = this.handleArg(arg);
            console.info("收到协议带过来的数据:",data)
        })
    }

    // 协议数据处理
    handleArg = arg => {
        let urlObj = [];
        if (Array.isArray(arg)) {
            urlObj = arg[arg.length - 1].replace(config.PROTOCOL + "://", "").split(config.separator);
        } else {
            urlObj = arg.replace(config.PROTOCOL + "://", "").split(config.separator);
        }
        return {
            url: urlObj[0],
            params: JSON.parse(decodeURIComponent(urlObj[1]))
        }
    }




    render() {
        return (
            <div>
                {this.props.children}
            </div>
        )
    }
}

export default Connecter

