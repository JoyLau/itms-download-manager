import React from 'react'
import {
    Layout,
    Form,
    Input,
    Radio,
    Slider,
} from 'antd'
import {
    FolderOutlined,
} from '@ant-design/icons';
import WindowControl from "../../componets/WindowControl";
import {inject, observer} from "mobx-react";

import audio1 from'./5809.mp3'
import audio2 from'./6953.mp3'
import audio3 from'./9723.mp3'


const {Header} = Layout;
const {dialog} = window.require('electron').remote;

const os = window.require('os')

@inject('global')
@observer
class SettingView extends React.Component {

    state = {
        audio: null
    }

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
        this.setState({
            audio : e.target.value === "5809.mp3" ? audio1 : e.target.value === "6953.mp3" ? audio2 : audio3
        })
        this.props.global.changeFinishAudio(e.target.value)
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
                        <Form.Item label={'下载线程数:'} style={{marginBottom: 10}}>
                            <Slider
                                min={1}
                                max={os.cpus().length}
                                onChange={(value) => this.props.global.changeMaxJobs(value)}
                                marks={marks}
                                value={typeof this.props.global.maxJobs === 'number' ? this.props.global.maxJobs : 1}
                            />
                        </Form.Item>
                        <Form.Item label={'下载完成提示音:'} onChange={this.changeAudio} style={{marginBottom: 10}}>
                            <audio src={this.state.audio} autoPlay={true} hidden={true}/>
                            <Radio.Group  value={this.props.global.finishAudio}>
                                <Radio value={'5809.mp3'}>提示音 1</Radio>
                                <Radio value={'6953.mp3'}>提示音 2</Radio>
                                <Radio value={'9723.mp3'}>提示音 3</Radio>
                            </Radio.Group>
                        </Form.Item>
                    </Form>
                </div>
            </Layout>
        );
    }

}

export default SettingView
