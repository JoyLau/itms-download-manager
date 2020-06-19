import React, {Component} from 'react'
import {
    Button, Dropdown, Layout, List,
    Modal, Input, Divider, Menu, message,
    Form, Upload, Popconfirm, Card
} from 'antd'

import {CaretRightOutlined, PauseOutlined, DeleteOutlined} from '@ant-design/icons';


class ViewHead extends Component {

    state = {
        selectedItem: null,
    }

    render() {

        const selectedItem = this.state.selectedItem;
        const disableToolbar = 'active';
        const selectedStatus = selectedItem && selectedItem.status;

        return (
            <div>
                <Divider type="vertical"/>
                <Button size={'small'} onClick={() => this.onChangeStatus('unpauseAll')}
                        icon={<CaretRightOutlined/>}>全部开始</Button>
                <Button size={'small'} onClick={() => this.onChangeStatus('forcePauseAll')} icon={<PauseOutlined/>}
                        style={{marginLeft: 5}}>全部暂停</Button>
                <Divider type="vertical"/>
                {selectedStatus === 'paused' ?
                    <Button onClick={() => this.onChangeStatus('start')}
                            disabled={!selectedItem || disableToolbar}
                            size={'small'} icon={<CaretRightOutlined/>}/> :
                    <Button onClick={() => this.onChangeStatus('pause')}
                            disabled={!selectedItem || disableToolbar}
                            size={'small'} type="dashed" icon={<PauseOutlined/>}/>}
                <Popconfirm title="你确定要删除这个下载任务吗?"
                            onConfirm={() => this.onChangeStatus('remove')}
                            okText="删除"
                            cancelText="取消">
                    <Button disabled={!selectedItem || disableToolbar}
                            size={'small'} style={{marginLeft: 10}} type="danger"><DeleteOutlined/></Button>
                </Popconfirm>
            </div>
        )
    }

}

export default ViewHead
