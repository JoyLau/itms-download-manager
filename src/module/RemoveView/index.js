import React, {Component} from 'react'
import {Button, Divider, Layout, List, Popconfirm} from 'antd'

import EmptyContent from "../../componets/EmptyContent";
import WindowControl from "../../componets/WindowControl";
import {inject, observer} from "mobx-react";
import DownloadItem from "../../componets/DownloadItem";
import {DeleteOutlined, RollbackOutlined} from "@ant-design/icons";
import {eventBus} from "../../util/utils";



const {Header, Content} = Layout;

@inject('task')
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
                onClick={() => this.onItemClick(item)}
                item={item}
            />
        )
    }

    empty = () => {
        this.props.task.jobs.filter(item => item.state === 'remove').forEach(value => {
            this.props.task.deleteJob(value.id)
        })

        this.setState({
            selectedItem: null
        })
    }

    remove = () => {
        this.props.task.deleteJob(this.state.selectedItem.id);
        this.changeMenuState()
    }

    reDownload = () => {
        if (!this.state.selectedItem) {
            return;
        }
        this.props.task.updateStateJob(this.state.selectedItem.id, 'active');
        eventBus.emit('new-task', this.props.task.selectById(this.state.selectedItem.id))
        this.changeMenuState()
    }

    changeMenuState = () => {
        if (this.props.task.jobs.filter(item => item.state === 'remove').length === 0) {
            this.setState({
                selectedItem: null
            })
        }
    }

    render() {
        const data = this.props.task.jobs.filter(item => item.state === 'remove')

        return (
            <Layout>
                <Header className="darg-move-window header-toolbar">
                    <div>
                        <Button size={'small'}
                                onClick={this.reDownload}
                                type={this.state.selectedItem ? "primary" : null}
                                icon={<RollbackOutlined />}>重新下载</Button>
                        <Button size={'small'}
                                style={{marginLeft: 5}}
                                onClick={this.empty}
                                danger
                                icon={<DeleteOutlined/>}>清空回收站</Button>
                        <Divider type="vertical"/>

                        {
                            this.state.selectedItem ?
                                <Popconfirm title="任务删除后将不可恢复"
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
