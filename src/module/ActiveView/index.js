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
                onClick={() => this.onItemClick(item)}
                item={item}
            />
        )
    }



    renderDetail(item){
        const gridStyle = {
            width: '33.333333333%',
            textAlign: 'left',
            padding: 5
        };

        const tabListNoTitle = [{
            key: 'info',
            tab: '下载详情',
        }];
        return (
            <Card activeTabKey={'info'}
                  className="download-item-details-card"
                  tabList={item ? tabListNoTitle : []}
                  style={{
                      width: '100%',
                  }}>
                <div style={{
                    overflow:'auto'
                }}>
                    <Card.Grid style={{width: '100%', padding: 5}}>
                        文件名称: {item.fileName}
                    </Card.Grid>
                    <Card.Grid style={gridStyle}>
                        任务状态: {getStatusText(item.fileState)}
                    </Card.Grid>
                    <Card.Grid style={gridStyle}>
                        文件大小: {bytesToSize(item.fileSize)}
                    </Card.Grid>
                    <Card.Grid title={item.savePath} style={gridStyle}>
                        存储目录: {item.savePath}
                    </Card.Grid>
                    <Card.Grid style={gridStyle}>
                        已下载: {bytesToSize(item.file.size.transferred)}
                    </Card.Grid>
                    <Card.Grid style={gridStyle}>
                        当前下载速度: {bytesToSize(item.fileSpeed)}/秒
                    </Card.Grid>
                    <Card.Grid style={gridStyle}>
                        下载进度: {item.filePercent}%
                    </Card.Grid>
                    <Card.Grid style={{width: '100%', padding: 5}}>
                        文件位置: {item.filePath}
                        <a className="device-electron-show server-remote-hide"
                           style={{marginLeft: 5}} title={'在文件管理器中显示'}
                           onClick={()=>shell.showItemInFolder(item.filePath)}>
                            <SearchOutlined />
                        </a>
                    </Card.Grid>
                </div>
            </Card>
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
        const data = this.props.task.jobs.filter(item => (item.state !== 'complete' && item.state !== 'remove'))
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
                        data.length > 0 ?
                            <List
                                itemLayout="horizontal"
                                dataSource={data}
                                renderItem={item => this.renderItem(item)}/>
                                :
                            <EmptyContent textType={'active'}/>
                    }
                </Content>
                {
                    this.state.selectedItem && this.props.task.selectById(this.state.selectedItem.id).process ? this.renderDetail(this.props.task.selectById(this.state.selectedItem.id).process) : null
                }
            </Layout>
        )
    }

}
export default ActiveView
