import React from 'react'
import {Layout, Popconfirm, Form, Input, InputNumber, Switch, Button, message, List, Card, Modal, Col} from 'antd'
import device from '../device'
import {getStorage, setStorage, eventBus} from "../util/utils";
import { FolderOutlined,PlusOutlined,LockOutlined,UnlockOutlined,EditOutlined,DeleteOutlined} from'@ant-design/icons';


const {Header} = Layout;
const {dialog} = window.require('electron').remote;

const dataSource = getStorage('SERVER_LIST') || [];
let enableAria2 = getStorage('enableAria2')

class SettingView extends React.Component {

  render() {
    const addonAfter = device.electron ? <label onClick={() => this.openFileDialog()}>选择目录</label> : null;
    return (
      <Layout className={'Setting'}>
        <Header className="darg-move-window header-toolbar">设置</Header>
        <div style={{padding: 20}}>
          <Form onSubmit={this.handleSubmit} layout={'vertical'}>
            <Form.Item label={'文件保存目录:'} style={{marginBottom: 10}}>
              <Input prefix={<FolderOutlined style={{color: 'rgba(0,0,0,.25)'}}/>}
                     addonAfter={addonAfter}
                     onChange={(e) => this.setState({dir: e.target.value})}
                     defaultValue={'/User/JoyLau/Download'}
                     placeholder="默认文件保存路径"/>
            </Form.Item>
              <Form.Item label={'下载线程数:'} style={{marginBottom: 10}}>
                <InputNumber min={1} max={10} defaultValue={4}  />
              </Form.Item>
          </Form>
        </div>
      </Layout>
    );
  }

}

export default SettingView
