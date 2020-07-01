import React from 'react'
import {Layout, Form, Input, Radio, Slider, Switch,} from 'antd'
import {FolderOutlined} from '@ant-design/icons';
import WindowControl from "../../componets/WindowControl";
import {inject, observer} from "mobx-react";
import {eventBus} from "../../util/utils";

const {Header} = Layout;
const {dialog} = window.require('electron').remote;

const os = window.require('os')

@inject('global')
@observer
class SettingView extends React.Component {

    openFileDialog() {
        dialog.showOpenDialog({
            buttonLabel: '选取目录',
            message: '选择一个文件夹来存放下载的文件',
            properties: ['openDirectory', 'createDirectory']
        }).then((promise) => {
            if (!promise.canceled && Array.isArray(promise.filePaths)) {
                this.props.global.changeSavePath(promise.filePaths[0]);
            }
        });

    }

    changeAudio = e => {
        this.props.global.changeFinishAudio(e.target.value)
        eventBus.emit('play-audio', {})
    }



    render() {
        let marks = {};
         os.cpus().forEach((value, index) => {
            marks[index+1] = index + 1
        })
        return (
            <Layout className={'Setting'}>
                <Header className="darg-move-window header-toolbar">
                    设置
                    <WindowControl/>
                </Header>
                <div style={{padding: 20}}>
                    <Form layout={'vertical'}>
                        <Form.Item label={'文件保存目录:'} style={{marginBottom: 10}}>
                            <Input prefix={<FolderOutlined style={{color: 'rgba(0,0,0,.25)'}}/>}
                                   addonAfter={<label onClick={() => this.openFileDialog()}
                                                      className={'hand'}>选择目录</label>}
                                   value={this.props.global.savePath}
                                   readOnly="readonly"
                                   placeholder="默认文件保存路径"/>
                        </Form.Item>
                        <Form.Item label={'下载最大线程数:'} style={{marginBottom: 10}}>
                            <Slider
                                min={1}
                                max={os.cpus().length}
                                onChange={(value) => this.props.global.changeMaxJobs(value)}
                                marks={marks}
                                value={typeof this.props.global.maxJobs === 'number' ? this.props.global.maxJobs : 1}
                            />
                        </Form.Item>
                        <Form.Item label={'下载完成提示音:'} onChange={this.changeAudio} style={{marginBottom: 10}}>
                            <Radio.Group  value={this.props.global.finishAudio}>
                                <Radio value={'5809.mp3'}>提示音 1</Radio>
                                <Radio value={'6953.mp3'}>提示音 2</Radio>
                                <Radio value={'9723.mp3'}>提示音 3</Radio>
                            </Radio.Group>
                        </Form.Item>
                        <Form.Item label={'下载完成弹出通知:'} style={{marginBottom: 10}}>
                            <Switch checked={this.props.global.finishTip} onChange={(checked) => this.props.global.changeFinishTip(checked)} />
                        </Form.Item>
                    </Form>
                </div>
            </Layout>
        );
    }

}

export default SettingView
