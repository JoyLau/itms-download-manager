import React, {Component} from 'react'
import {Button, Layout, List, Popconfirm} from 'antd'

import EmptyContent from "../../componets/EmptyContent";
import WindowControl from "../../componets/WindowControl";
import {DeleteOutlined, FolderOpenOutlined} from "@ant-design/icons";
import DownloadItem from "../../componets/DownloadItem";
import {inject, observer} from "mobx-react";


const {shell} = window.require('electron').remote;
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

    openTaskFile = () => {
        shell.showItemInFolder(this.props.global.savePath + "/" + this.state.selectedItem.id)
    }

    remove = () => {
        this.props.task.updateStateJob(this.state.selectedItem.id, 'remove');
        this.changeMenuState();
    }

    changeMenuState = () => {
        if (this.props.task.jobs.filter(item => item.state === 'complete').length === 0) {
            this.setState({
                selectedItem: null
            })
        }
    }


    render() {
        let data = this.props.task.jobs.filter(item => item.state === 'complete')

        data = data.reverse()


        return (
            <Layout>
                <Header className="darg-move-window header-toolbar">
                    <div>
                        <Button size={'small'}
                                onClick={this.openTaskFile}
                                type={this.state.selectedItem ? "primary" : null}
                                icon={<FolderOpenOutlined />}>打开文件位置</Button>

                        {
                            this.state.selectedItem ?
                                <Popconfirm title="确定删除该任务?"
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
                            <EmptyContent textType={'complete'}/>
                    }
                </Content>
            </Layout>
        )
    }

}
export default CompleteView
