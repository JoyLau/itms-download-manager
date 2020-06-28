import React, {Component} from 'react'
import {
    Button, Dropdown, Layout, List,
    Modal, Input, Divider, Menu, message,
    Form, Upload, Popconfirm, Card
} from 'antd'

import EmptyContent from "../../componets/EmptyContent";
import WindowControl from "../../componets/WindowControl";
import DownloadItem from "../../componets/DownloadItem";
import {getStatusText, bytesToSize, eventBus} from '../../util/utils'
import SearchOutlined from "@ant-design/icons/lib/icons/SearchOutlined";
import {inject, observer} from "mobx-react";
import {CaretRightOutlined, DeleteOutlined, PauseOutlined} from "@ant-design/icons";



const {shell} = window.require('electron').remote;
const {Header, Content} = Layout;

@inject('task')
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
        return (
            <DownloadItem
                selected={this.state.selectedItem && item.id === this.state.selectedItem.id}
                onClick={() => this.onItemClick(item)}
                item={item}
            />
        )
    }



    changeMenuState = () => {
        if (this.props.task.jobs.filter(item => (item.state !== 'complete' && item.state !== 'remove')).length === 0) {
            this.setState({
                selectedItem: null
            })
        }
    }

    remove = () => {
        this.props.task.updateStateJob(this.state.selectedItem.id, 'remove');
        this.changeMenuState();

    }

    start = () => {
        this.props.task.updateStateJob(this.state.selectedItem.id,'active')
        eventBus.emit('new-task', {})
    }

    startAll = () => {
        this.props.task.jobs.filter(item => item.state === 'pause' || item.state === 'error').forEach(value => {
            this.props.task.updateStateJob(value.id,'active')
        })
        eventBus.emit('new-task', {})

    }

    pause = () => {
        this.props.task.updateStateJob(this.state.selectedItem.id,'paused')
        eventBus.emit('new-task', {})
    }

    pauseAll = () => {
        this.props.task.jobs.filter(item => item.state === 'active').forEach(value => {
            this.props.task.updateStateJob(value.id,'paused')
        })
        eventBus.emit('new-task', {})
    }

    render() {
        return (
            <Layout>
                <Header className="darg-move-window header-toolbar">
                    <div>
                        <Button size={'small'} onClick={this.startAll}
                                icon={<CaretRightOutlined/>}>全部开始</Button>
                        <Button size={'small'} onClick={this.pauseAll} icon={<PauseOutlined/>}
                                style={{marginLeft: 5}}>全部暂停</Button>
                        <Divider type="vertical"/>
                        {
                            this.state.selectedItem && (this.state.selectedItem.state === 'paused' || this.state.selectedItem.state === 'error') ?
                                <Button onClick={this.start}
                                        disabled={!this.state.selectedItem}
                                        size={'small'} icon={<CaretRightOutlined/>}/> :
                                <Button onClick={this.pause}
                                        disabled={!this.state.selectedItem}
                                        size={'small'} type="dashed" icon={<PauseOutlined/>}/>
                        }

                        {
                            this.state.selectedItem ?
                                <Popconfirm title="你确定要删除这个下载任务吗?"
                                            onConfirm={this.remove}
                                            okText="删除"
                                            cancelText="取消">
                                    <Button disabled={!this.state.selectedItem}
                                            size={'small'} style={{marginLeft: 10}} type="danger"><DeleteOutlined/></Button>
                                </Popconfirm>
                                :
                                <Button disabled={true}
                                        size={'small'} style={{marginLeft: 10}} type="danger"><DeleteOutlined/></Button>
                        }
                    </div>
                    <WindowControl/>
                </Header>
                <Content>
                    {
                        this.props.task.jobs.filter(item => (item.state !== 'complete' && item.state !== 'remove')).length > 0 ?
                            <List
                                itemLayout="horizontal"
                                dataSource={this.props.task.jobs.filter(item => (item.state !== 'complete' && item.state !== 'remove'))}
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
