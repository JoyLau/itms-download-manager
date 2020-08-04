import React from 'react'
import {Layout, Input, Radio, Row, Col, Checkbox, Select, Button, Space, message,} from 'antd'
import {FolderOutlined} from '@ant-design/icons';
import WindowControl from "../../componets/WindowControl";
import {inject, observer} from "mobx-react";
import {eventBus, tmpdir, bytesToSize} from "../../util/utils";
import {cleanMetaData} from "../../util/dbUtils";
import {openLogin,listenClipboard,unListenClipboard} from '../../util/settingUtils'
import {toJS} from "mobx";

const {Header} = Layout;
const { Option } = Select;
const {dialog} = window.require('electron').remote;

const os = window.require('os')
const klaw = window.require('klaw')
const fse = window.require('fs-extra');

@inject('global','task')
@observer
class SettingView extends React.Component {

    state = {
        cacheSize: 0,
        disableClearCache: false,
    }

    componentDidMount() {
        this.collectCache();
    }

    collectCache = () => {
        let size = 0;
        klaw(tmpdir)
            .on('data', item => size = size + item.stats.size)
            .on('end', () => this.setState({cacheSize: size < 1024 ? 0 : size}))
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
        this.props.global.changeFinishAudio(e.target.value)
        eventBus.emit('play-audio', {})
    }


    powerOn = (e) => {
        this.props.global.changePowerOn(e.target.checked);
        openLogin(e.target.checked);
    }

    onClipboard = e => {
        const check = e.target.checked
        this.props.global.changeOnClipboard(check)
        if (check) {
            listenClipboard();
        } else {
            unListenClipboard();
        }
    }


    clearCache = () => {
        if (this.state.cacheSize === 0 ) {
            return;
        }
        if (toJS(this.props.task.getJobs().filter(item => item.state !== 'complete').length > 0)) {
            message.warning("当前有尚未下载完毕的任务, 请稍后再试!")
            return;
        }
        this.setState({
            disableClearCache: true,
        })
        fse.emptyDir(tmpdir).then(value => {
            // 清空 meta data 缓存
            cleanMetaData();
            this.setState({
                disableClearCache: false,
            })
            this.collectCache();
        })
    }

    render() {
        let marks = {};
        os.cpus().forEach((value, index) => {
            marks[index + 1] = index + 1
        })

        const rowGutter = [8, 48]
        const colRowStyle = {
            marginBottom: 20
        }

        return (
            <Layout className={'Setting'}>
                <Header className="darg-move-window header-toolbar">
                    设置
                    <WindowControl/>
                </Header>
                <div style={{padding: 40,overflowY: 'auto'}}>
                    <Row gutter={rowGutter}>
                        <Col span={6}>启动</Col>
                        <Col span={18}>
                            <Row style={colRowStyle}>
                                <Checkbox checked={this.props.global.powerOn} onChange={this.powerOn}>开机启动</Checkbox>
                            </Row>
                            <Row style={colRowStyle}>
                                <Checkbox checked={this.props.global.autoStart} onChange={(e) => {this.props.global.changeAutoStart(e.target.checked)}}>启动后自动开始未完成的任务</Checkbox>
                            </Row>
                            <Row>
                                <Checkbox checked={this.props.global.autoUpdate} onChange={e => this.props.global.changeAutoUpdate(e.target.checked)}>启动后检查更新</Checkbox>
                            </Row>
                        </Col>
                    </Row>
                    <Row gutter={rowGutter}>
                        <Col span={6}>下载目录</Col>
                        <Col span={18}>
                            <Row style={colRowStyle}>
                                <Input prefix={<FolderOutlined style={{color: 'rgba(0,0,0,.25)'}}/>}
                                       addonAfter={<label onClick={() => this.openFileDialog()}
                                                          className={'hand'}>选择目录</label>}
                                       value={this.props.global.savePath}
                                       readOnly="readonly"
                                       style={{ width: '70%' }}
                                       placeholder="默认文件保存路径"/>
                            </Row>
                            <Row>
                                <Checkbox checked={this.props.global.latestPath} onChange={(e) => {this.props.global.changeLatestPath(e.target.checked)}}>自动修改为上次使用的目录</Checkbox>
                            </Row>
                        </Col>
                    </Row>
                    <Row gutter={rowGutter}>
                        <Col span={6}>接管设置</Col>
                        <Col span={18}>
                            <Row>
                                <Checkbox checked={this.props.global.onClipboard} onChange={this.onClipboard}>接管剪切板</Checkbox>
                            </Row>
                        </Col>
                    </Row>
                    <Row gutter={rowGutter}>
                        <Col span={6}>下载设置</Col>
                        <Col span={18}>
                            <Row style={colRowStyle}>
                                <Col span={4}>
                                    最大线程数
                                </Col>
                                <Col span={20}>
                                    <Select value={this.props.global.maxJobs} size={'small'} style={{ width: '20%' }} onChange={(value)=>this.props.global.changeMaxJobs(value)}>
                                        <Option key="auto" value={(Object.values(marks).length / 2).toString()}>智能</Option>
                                        {
                                            Object.values(marks).map(value => {
                                                return <Option key={value} value={value}>{value}</Option>
                                            })
                                        }
                                    </Select>
                                </Col>
                            </Row>
                            <Row>
                                <Col span={4}>
                                    最大任务数
                                </Col>
                                <Col span={20}>
                                    <Select value={this.props.global.maxTasks} size={'small'} style={{ width: '20%' }} onChange={(value)=>this.props.global.changeMaxTasks(value)}>
                                        <Option value={1}>1</Option>
                                        <Option value={2}>2</Option>
                                        <Option value={3}>3</Option>
                                        <Option value={4}>4</Option>
                                        <Option value={5}>5</Option>
                                    </Select>
                                </Col>
                            </Row>
                        </Col>
                    </Row>
                    <Row gutter={rowGutter}>
                        <Col span={6}>任务管理</Col>
                        <Col span={18}>
                            <Row style={colRowStyle}>
                                <Checkbox checked={this.props.global.finishOpen} onChange={(e) => {this.props.global.changeFinishOpen(e.target.checked)}}>下载完成后自动打开</Checkbox>
                            </Row>
                            <Row>
                                <Checkbox checked={this.props.global.delNotExist} onChange={(e) => {this.props.global.changeDelNotExist(e.target.checked)}}>自动删除 "文件不存在" 的任务</Checkbox>
                            </Row>
                        </Col>
                    </Row>
                    <Row gutter={rowGutter}>
                        <Col span={6}>磁盘缓存</Col>
                        <Col span={18}>
                            <Row style={colRowStyle}>
                                <Space><span>{bytesToSize(this.state.cacheSize)}</span> <Button size={'small'} type="primary" onClick={this.clearCache} loading={this.state.disableClearCache}>清除缓存</Button></Space>
                            </Row>
                        </Col>
                    </Row>
                    <Row gutter={rowGutter}>
                        <Col span={6}>提醒</Col>
                        <Col span={18}>
                            <Row style={colRowStyle}>
                                <Checkbox checked={this.props.global.finishTip} onChange={(e) => {this.props.global.changeFinishTip(e.target.checked)}}>下载完成后弹窗提示</Checkbox>
                            </Row>
                            <Row style={colRowStyle}>
                                <Checkbox checked={this.props.global.errorTip} onChange={(e) => {this.props.global.changeErrorTip(e.target.checked)}}>下载失败时弹窗提示</Checkbox>
                            </Row>
                            <Row style={colRowStyle}>
                                <Checkbox checked={this.props.global.playFinishAudio} onChange={(e) => {this.props.global.changePlayFinishAudio(e.target.checked)}}>下载完成后播放提示音</Checkbox>
                            </Row>
                            <Row>
                                <Radio.Group disabled={!this.props.global.playFinishAudio}
                                             value={this.props.global.finishAudio}
                                             onChange={this.changeAudio}
                                >
                                    <Radio value={'5809.mp3'}>提示音 1</Radio>
                                    <Radio value={'6953.mp3'}>提示音 2</Radio>
                                    <Radio value={'9723.mp3'}>提示音 3</Radio>
                                </Radio.Group>
                            </Row>
                        </Col>
                    </Row>
                    {/*<Row gutter={rowGutter}>*/}
                    {/*    <Col span={6}>悬浮窗</Col>*/}
                    {/*    <Col span={18}>*/}
                    {/*        <Row>*/}
                    {/*            <Radio.Group  value={this.props.global.floatWin}*/}
                    {/*                          onChange={(e) => this.props.global.changeFloatWin(e.target.value)}*/}
                    {/*            >*/}
                    {/*                <Radio value={true}>显示悬浮窗</Radio>*/}
                    {/*                <Radio value={false}>隐藏悬浮窗</Radio>*/}
                    {/*            </Radio.Group>*/}
                    {/*        </Row>*/}
                    {/*    </Col>*/}
                    {/*</Row>*/}
                    <Row gutter={rowGutter}>
                        <Col span={6}>压缩设置</Col>
                        <Col span={18}>
                            <Row>
                                <Radio.Group  value={this.props.global.compressType}
                                              onChange={(e) => this.props.global.changeCompressType(e.target.value)}
                                >
                                    <Radio value={'.zip'}>zip</Radio>
                                    <Radio value={'.gzip'}>gzip</Radio>
                                    <Radio value={'.tar'}>tar</Radio>
                                    <Radio value={'.tgz'}>tgz</Radio>
                                </Radio.Group>
                            </Row>
                        </Col>
                    </Row>
                </div>
            </Layout>
        );
    }

}

export default SettingView
