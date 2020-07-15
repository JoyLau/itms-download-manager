import React, {Component} from 'react'
import {Button, Layout, List, Divider, Popconfirm, Modal, Input, message} from 'antd'

import EmptyContent from "../../componets/EmptyContent";
import WindowControl from "../../componets/WindowControl";
import {inject, observer} from "mobx-react";
import {CaretRightOutlined, DeleteOutlined, PauseOutlined,PlusOutlined} from "@ant-design/icons";
import ActiveItem from "./activeItem";
import ProcessItem from "./processItem";
import {eventBus} from "../../util/utils";
import CryptoJS from 'crypto-js';
import config from "../../util/config";


const {Header, Content} = Layout;
const {TextArea} = Input;

@inject('task','jobProcess')
@observer
class ActiveView extends Component {

    state = {
        selectedItem: null,
        visible: false
    }

    onItemClick = item => {
        this.setState({
            selectedItem: item,
        })
    }

    renderItem(item) {
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
        this.props.task.updateJob(this.state.selectedItem.id,'process',this.props.jobProcess.process)
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
            visible: false
        })
    }

    handleOk = () => {
        const passphrase = this.state.passphrase;
        if (passphrase && passphrase !== '') {
            let originalText = ''
            try {
                originalText = CryptoJS.AES.decrypt(passphrase, '').toString(CryptoJS.enc.Utf8);
            } catch (e) {
                console.error(e);
            }
            console.info("口令解密后的数据:",originalText)
            if (originalText === '' || originalText.indexOf(config.PROTOCOL) < 0) {
                message.error("口令错误!")
                return;
            }
            eventBus.emit('add-task',originalText)
            this.setState({
                visible: false
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
                <TextArea onChange={(e) => this.setState({passphrase: e.target.value})}
                          onPressEnter={this.handleOk}
                          placeholder={'将复制的口令粘贴到此处即可开始下载'}
                          autoSize={{minRows: 6, maxRows: 20}}/>
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
