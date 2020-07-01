import React, {Component} from 'react'
import {Button, Layout, List, message, Popconfirm} from 'antd'

import EmptyContent from "../../componets/EmptyContent";
import WindowControl from "../../componets/WindowControl";
import {DeleteOutlined, FolderOpenOutlined} from "@ant-design/icons";
import {inject, observer} from "mobx-react";
import config from '../../util/config'
import CompleteItem from "./completeItem";


const {shell} = window.require('electron').remote;
const fse = window.require('fs-extra')
const {Header, Content} = Layout;

@inject('task','global')
@observer
class CompleteView extends Component {
    state = {
        selectedItem: null,
    }

    onItemClick = item => {
        this.setState({
            selectedItem: item,
        })
        this.props.task.updateJob(item.id,'isNew',false);
    }

    renderItem(item) {
        return (
            <CompleteItem
                selected={this.state.selectedItem && item.id === this.state.selectedItem.id}
                onClick={() => this.onItemClick(item)}
                item={item}
            />
        )
    }

    openTaskFile = () => {
        if (!this.state.selectedItem) return;
        shell.showItemInFolder(this.props.global.savePath + config.sep + this.state.selectedItem.name.replace(".zip","") + this.state.selectedItem.id + '.zip' )
    }

    removeTask = () => {
        if (!this.state.selectedItem) return;
        this.props.task.deleteJob(this.state.selectedItem.id);
        this.changeMenuState();
    }

    removeTaskAndFile = () => {
        let that = this;
        if (!this.state.selectedItem) return;
        this.props.task.deleteJob(this.state.selectedItem.id);
        fse.remove(this.props.global.savePath + config.sep + this.state.selectedItem.name.replace(".zip","") + this.state.selectedItem.id + '.zip',function (err) {
            if (err){
                console.error(err)
                message.warn('文件删除失败!');
            }
        })
        that.changeMenuState();
    }

    changeMenuState = () => {
        if (this.props.task.getJobs().filter(item => item.state === 'complete').length === 0) {
            this.setState({
                selectedItem: null
            })
        }
    }


    render() {
        return (
            <Layout>
                <Header className="darg-move-window header-toolbar">
                    <div>
                        <Button size={'small'}
                                disabled={!this.state.selectedItem}
                                onClick={this.openTaskFile}
                                type={this.state.selectedItem ? "primary" : null}
                                icon={<FolderOpenOutlined />}>打开文件位置</Button>

                        {
                            this.state.selectedItem ?
                                <Popconfirm title="是否同时删除文件?"
                                            onConfirm={this.removeTaskAndFile}
                                            onCancel={this.removeTask}
                                            okText="仅删除任务"
                                            cancelText="删除文件">
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
                        this.props.task.getJobs().filter(item => item.state === 'complete').reverse().length > 0 ?
                            <List
                                itemLayout="horizontal"
                                dataSource={this.props.task.getJobs().filter(item => item.state === 'complete').reverse()}
                                renderItem={item => this.renderItem(item)}/>
                            :
                            <EmptyContent textType={'complete'}/>
                    }
                </Content>
            </Layout>
        )
    }

}
export default CompleteView
