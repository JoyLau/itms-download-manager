import React, {Component} from 'react'
import {
    Button, Dropdown, Layout, List,
    Modal, Input, Divider, Menu, message,
    Form, Upload, Popconfirm, Card
} from 'antd'

import {CaretRightOutlined, PauseOutlined, DeleteOutlined} from '@ant-design/icons';
import {inject, observer} from "mobx-react";

@inject('task')
@observer
class ViewHead extends Component {

    render() {

        const selectedItem = this.props.selectedItem;
        const selectedStatus = selectedItem && selectedItem.state;

        return (
            <div>
                <Button size={'small'} onClick={() => this.onChangeStatus('unpauseAll')}
                        icon={<CaretRightOutlined/>}>全部开始</Button>
                <Button size={'small'} onClick={() => this.onChangeStatus('forcePauseAll')} icon={<PauseOutlined/>}
                        style={{marginLeft: 5}}>全部暂停</Button>
                <Divider type="vertical"/>
                {selectedStatus === 'paused' ?
                    <Button onClick={() => this.onChangeStatus('start')}
                            disabled={!selectedItem}
                            size={'small'} icon={<CaretRightOutlined/>}/> :
                    <Button onClick={() => this.onChangeStatus('pause')}
                            disabled={!selectedItem}
                            size={'small'} type="dashed" icon={<PauseOutlined/>}/>
                }

                {
                    selectedItem ?
                        <Popconfirm title="你确定要删除这个下载任务吗?"
                                    onConfirm={() => this.props.task.updateStateJob(selectedItem.id, 'remove')}
                                    okText="删除"
                                    cancelText="取消">
                            <Button disabled={!selectedItem}
                                    size={'small'} style={{marginLeft: 10}} type="danger"><DeleteOutlined/></Button>
                        </Popconfirm>
                        :
                        <Button disabled={true}
                                size={'small'} style={{marginLeft: 10}} type="danger"><DeleteOutlined/></Button>
                }
            </div>
        )
    }

}

export default ViewHead
