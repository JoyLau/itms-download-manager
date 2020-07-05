import React, {Component} from 'react'
import {Button, Layout, List, Divider, Popconfirm} from 'antd'

import EmptyContent from "../../componets/EmptyContent";
import WindowControl from "../../componets/WindowControl";
import {inject, observer} from "mobx-react";
import {CaretRightOutlined, DeleteOutlined, PauseOutlined} from "@ant-design/icons";
import ActiveItem from "./activeItem";
import ProcessItem from "./processItem";
import {eventBus} from "../../util/utils";


const {Header, Content} = Layout;

@inject('task','jobProcess')
@observer
class ActiveView extends Component {

    state = {
        selectedItem: null,
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
        eventBus.emit('stop',{})
        this.props.task.deleteJob(this.state.selectedItem.id);
        this.changeMenuState();
    }

    resume = () => {
        // 发出通知
        eventBus.emit('resume',{})
        this.props.task.updateStateJob(this.state.selectedItem.id, 'active')
    }

    pause = () => {
        // 发出通知
        eventBus.emit('pause',{})
        // 保存当前进度
        this.props.task.updateJob(this.state.selectedItem.id,'process',this.props.jobProcess.process)
        // 更新状态
        this.props.task.updateStateJob(this.state.selectedItem.id, 'paused')
    }

    render() {
        return (
            <Layout>
                <Header className="darg-move-window header-toolbar">
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
            </Layout>
        )
    }

}

export default ActiveView
