import React from 'react'
import {Layout, Popconfirm, Form, Input, InputNumber, Switch, Button, message, List, Card, Modal, Col} from 'antd'
import device from '../../device'
import {getStorage, setStorage, eventBus} from "../../util/utils";
import { FolderOutlined,PlusOutlined,LockOutlined,UnlockOutlined,EditOutlined,DeleteOutlined} from'@ant-design/icons';
import WindowControl from "../DownloadView/WindowControl";
import {inject, observer} from "mobx-react";


const {Header} = Layout;
const {dialog} = window.require('electron').remote;

const dataSource = getStorage('SERVER_LIST') || [];
let enableAria2 = getStorage('enableAria2')

const os = window.require('os')

@inject('store')
@observer
class SettingView extends React.Component {

    state = {
    };

    openFileDialog() {
        dialog.showOpenDialog({
            buttonLabel: '选取目录',
            message: '选择一个文件夹来存放下载的文件',
            properties: ['openDirectory', 'createDirectory']
        }).then((promise)=>{
            if(!promise.canceled  && Array.isArray(promise.filePaths)) {
                this.props.store.changeSavePath(promise.filePaths[0]);
            }
        });

    }

  render() {
    return (
      <Layout className={'Setting'}>
        <Header className="darg-move-window header-toolbar">
          设置
          <WindowControl/>
        </Header>
        <div style={{padding: 20}}>
          <Form onSubmit={this.handleSubmit} layout={'vertical'}>
            <Form.Item label={'文件保存目录:'} style={{marginBottom: 10}}>
              <Input prefix={<FolderOutlined style={{color: 'rgba(0,0,0,.25)'}}/>}
                     addonAfter={<label onClick={() => this.openFileDialog()} className={'hand'}>选择目录</label>}
                     onChange={(e) => this.setState({dir: e.target.value})}
                     value={this.props.store.savePath}
                     readonly="readonly"
                     placeholder="默认文件保存路径"/>
            </Form.Item>
              <Form.Item label={'下载线程数:'} style={{marginBottom: 10}}>
                <InputNumber min={1} max={10} value={this.props.store.maxJobs}  />
              </Form.Item>
          </Form>
        </div>
      </Layout>
    );
  }

}

export default SettingView
