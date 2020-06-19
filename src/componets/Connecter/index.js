import React from 'react'
import {inject, observer} from "mobx-react";
const {ipcRenderer} = window.require('electron')

@inject('global')
@observer
class Connecter extends React.Component {

    componentDidMount() {
        // 监听到通过自定义协议打开的操作
        ipcRenderer.on('open-protocol', (event, arg) => {
            this.props.global.changeMainMenu("active")
            console.info(arg)
        })
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

