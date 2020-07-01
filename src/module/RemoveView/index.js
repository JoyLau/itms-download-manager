import React, {Component} from 'react'
import {Button, Divider, Layout, List, message, Popconfirm} from 'antd'

import EmptyContent from "../../componets/EmptyContent";
import WindowControl from "../../componets/WindowControl";
import {inject, observer} from "mobx-react";
import DownloadItem from "../../componets/DownloadItem";
import {DeleteOutlined, RollbackOutlined} from "@ant-design/icons";
import {eventBus} from "../../util/utils";


const fse = window.require('fs-extra')
const {Header, Content} = Layout;

@inject('task','global')
@observer
class RemoveView extends Component {

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

    empty = () => {
        this.props.task.getJobs().filter(item => item.state === 'remove').forEach(value => {
            // 删除下载的文件
            fse.remove(this.props.global.savePath + "/" + value.taskId,function (err) {
                if (err){
                    console.error(err)
                    message.warn('文件删除失败!');
                }
            })

            this.props.task.deleteJob(value.id)
        })

        this.setState({
            selectedItem: null
        })
    }

    remove = () => {
        this.props.task.deleteJob(this.state.selectedItem.id);
        fse.remove(this.props.global.savePath + "/" + this.state.selectedItem.name.replace(".zip","") + this.state.selectedItem.id + '.zip',function (err) {
            if (err){
                console.error(err)
                message.warn('文件删除失败!');
            }
        })
        this.changeMenuState()
    }

    reDownload = () => {
        if (!this.state.selectedItem) {
            return;
        }
        // 删除目录
        fse.removeSync(this.props.global.savePath + "/" + this.state.selectedItem.name.replace(".zip","") + this.state.selectedItem.id + '.zip')
        this.props.task.updateStateJob(this.state.selectedItem.id, 'active');
        eventBus.emit('new-task', {})
        this.changeMenuState()
    }

    changeMenuState = () => {
        if (this.props.task.getJobs().filter(item => item.state === 'remove').length === 0) {
            this.setState({
                selectedItem: null
            })
        }
    }

    render() {
        const data = this.props.task.getJobs().filter(item => item.state === 'remove')

        return (
            <Layout>
                <Header className="darg-move-window header-toolbar">
                    <div>
                        <Button size={'small'}
                                disabled={!this.state.selectedItem}
                                onClick={this.reDownload}
                                type={this.state.selectedItem ? "primary" : null}
                                icon={<RollbackOutlined />}>重新下载</Button>
                        <Button size={'small'}
                                disabled={!this.state.selectedItem}
                                style={{marginLeft: 5}}
                                onClick={this.empty}
                                danger
                                icon={<DeleteOutlined/>}>清空回收站</Button>
                        <Divider type="vertical"/>

                        {
                            this.state.selectedItem ?
                                <Popconfirm title="任务删除后将不可恢复,并且删除该任务已经下载的文件"
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
                            <EmptyContent textType={'remove'}/>
                    }
                </Content>
            </Layout>
        )
    }

}
export default RemoveView
