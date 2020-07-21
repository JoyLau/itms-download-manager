import React, {Component} from 'react'
import {Button, Layout, List, Divider, Popconfirm, Modal, Input, message, Dropdown, Menu} from 'antd'

import EmptyContent from "../../componets/EmptyContent";
import WindowControl from "../../componets/WindowControl";
import {inject, observer} from "mobx-react";
import {CaretRightOutlined, DeleteOutlined, PauseOutlined,PlusOutlined,CopyOutlined} from "@ant-design/icons";
import ActiveItem from "./activeItem";
import ProcessItem from "./processItem";
import {eventBus,decryptPassphrase} from "../../util/utils";
import config from "../../util/config";


const {clipboard} = window.require('electron')
const {Header, Content} = Layout;
const {TextArea} = Input;

@inject('task','jobProcess','global')
@observer
class ActiveView extends Component {

    state = {
        selectedItem: null,
        visible: false
    }

    componentDidMount() {
        // 收到任务下载完毕的通知
        eventBus.on('job-downloaded',this.changeMenuState)

        // 收到剪切板新建任务通知
        eventBus.on('clipboard-task',this.clipboardTask)

    }

    // 为了解决 clipboardTask 设置 state 报错异常
    // 报错信息:
    // Warning: Can't perform a React state update on an unmounted component.
    // This is a no-op, but it indicates a memory leak in your application.
    // To fix, cancel all subscriptions and asynchronous tasks in the componentWillUnmount method.
    componentWillUnmount() {
        this.setState = () => false;
    }

    clipboardTask = (clipboardText) => {
        this.setState({
            visible: true,
            passphrase: clipboardText
        })
    }

    onItemClick = item => {
        this.setState({
            selectedItem: item,
        })
    }

    renderItem(item) {
        // 任务可能异常了
        if (!this.props.jobProcess.process[item.id]){
            const process = {
                total: 0,
                finishCount: 0,
                percent: 0,
                finishSize: 0,
                remainingTime: ''
            }
            this.props.jobProcess.updateProcess(item.id,process)
            // 更改任务状态为 error
            this.props.task.updateStateJob(item.id, "error")
        }
        if (item.state === 'active') {
            return (
                <ProcessItem
                    selected={this.state.selectedItem && item.id === this.state.selectedItem.id}
                    onClick={() => this.onItemClick(item)}
                    item={item}
                />
            )
        } else {
            return (
                <ActiveItem
                    selected={this.state.selectedItem && item.id === this.state.selectedItem.id}
                    onClick={() => this.onItemClick(item)}
                    item={item}
                />
            )
        }

    }


    changeMenuState = () => {
        if (this.props.task.getJobs().filter(item => (item.state !== 'complete')).length === 0) {
            this.setState({
                selectedItem: null
            })
        }
    }

    remove = () => {
        eventBus.emit('stop',{taskId:this.state.selectedItem.id})
        this.props.task.deleteJob(this.state.selectedItem.id);
        this.changeMenuState();
    }

    resume = () => {
        // 发出通知
        eventBus.emit('resume',{taskId:this.state.selectedItem.id})
        this.props.task.updateStateJob(this.state.selectedItem.id, 'active')
    }

    pause = () => {
        // 发出通知
        eventBus.emit('pause',{taskId:this.state.selectedItem.id})
        // 保存当前进度
        this.props.task.updateJob(this.state.selectedItem.id,'process',this.props.jobProcess.process[this.state.selectedItem.id])
        // 更新状态
        this.props.task.updateStateJob(this.state.selectedItem.id, 'paused')
    }

    showModal = () => {
        this.setState({
            visible: true
        })
    }

    handleCancel = () => {
        this.setState({
            visible: false,
            passphrase: ''
        })
    }

    handleOk = () => {
        const passphrase = this.state.passphrase;
        if (passphrase && passphrase !== '') {
            const originalText = decryptPassphrase(passphrase);
            console.info("口令解密后的数据:",originalText);
            if (originalText === '' || originalText.indexOf(config.PROTOCOL) < 0) {
                message.error("口令错误!")
                return;
            }
            eventBus.emit('add-task',originalText)
            this.setState({
                visible: false,
                passphrase: ''
            })
        }
    }

    renderAddTaskDialog(){
        return (
            <Modal
                destroyOnClose={true}
                title={'新建下载'}
                wrapClassName="newTaskDialog"
                maskStyle={{backgroundColor: 'transparent'}}
                centered
                maskClosable={false}
                visible={this.state.visible}
                footer={false}
                onOk={this.handleOk}
                onCancel={this.handleCancel}
            >
                <Dropdown overlay={
                    <Menu>
                        <Menu.Item key="1" onClick={() => this.setState({passphrase: clipboard.readText()})}><CopyOutlined /> 粘贴口令</Menu.Item>
                    </Menu>
                } trigger={['contextMenu']}>
                    <TextArea onChange={(e) => this.setState({passphrase: e.target.value})}
                              onPressEnter={this.handleOk}
                              value={this.state.passphrase}
                              placeholder={'将复制的口令粘贴到此处即可开始下载'}
                              autoSize={{minRows: 6, maxRows: 20}}
                    />
                </Dropdown>
                <div className="ant-modal-footer">
                    <Button type="primary" onClick={this.handleOk} size={'small'}>立即下载</Button>
                </div>
            </Modal>
        )
    }

    render() {
        return (
            <Layout>
                <Header className="darg-move-window header-toolbar">
                    <Button type="primary" size={'small'} onClick={this.showModal}><PlusOutlined style={{fontWeight: 700}}/></Button>
                    <Divider type="vertical"/>
                    <div>
                        {
                            this.state.selectedItem && (this.state.selectedItem.state === 'paused' || this.state.selectedItem.state === 'error') ?
                                <Button onClick={this.resume}
                                        disabled={!this.state.selectedItem}
                                        size={'small'} icon={<CaretRightOutlined/>}/> :
                                <Button onClick={this.pause}
                                        disabled={!this.state.selectedItem}
                                        size={'small'} type="dashed" icon={<PauseOutlined/>}/>
                        }
                        <Divider type="vertical"/>
                        {
                            this.state.selectedItem ?
                                <Popconfirm title="你确定要删除这个下载任务吗?"
                                            onConfirm={this.remove}
                                            okText="删除"
                                            cancelText="取消">
                                    <Button disabled={!this.state.selectedItem}
                                            size={'small'}
                                            type="danger">
                                        <DeleteOutlined/>
                                    </Button>
                                </Popconfirm>
                                :
                                <Button disabled={true}
                                        size={'small'}
                                        type="danger">
                                    <DeleteOutlined/>
                                </Button>
                        }
                    </div>
                    <WindowControl/>
                </Header>
                <Content>
                    {
                        this.props.task.getJobs().filter(item => (item.state !== 'complete')).length > 0 ?
                            <List
                                itemLayout="horizontal"
                                dataSource={this.props.task.getJobs().filter(item => item.state !== 'complete')}
                                renderItem={item => this.renderItem(item)}/>
                            :
                            <EmptyContent textType={'active'}/>
                    }
                </Content>
                {this.renderAddTaskDialog()}
            </Layout>
        )
    }

}

export default ActiveView
