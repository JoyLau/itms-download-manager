import React from 'react'
import {Avatar, Badge, Divider, List, Progress,Typography} from 'antd'
import {bytesToSize, statusText, fileExists, jobTypeClass} from '../../util/utils'
import {CheckCircleTwoTone,WarningOutlined, DeleteOutlined,LikeOutlined,CheckOutlined} from "@ant-design/icons";
import {inject, observer} from "mobx-react";

const fs = window.require('fs');
const { Text } = Typography;

let notExits = []

@inject('task','global')
@observer
class CompleteItem extends React.Component {

    componentDidMount() {
        // 删除文件不存在的任务
        if (this.props.global.delNotExist) {
            notExits.forEach(id => {
                this.props.task.deleteJob(id)
            })
        }
    }

    renderDesc = (exists,item) => {
        if (!exists) {
            notExits.push(item.id)
            return (
                <Text disabled type="danger"><WarningOutlined /> 文件已被移动或删除</Text>
            )
        } else {
            return (
                <Text type="secondary" style={{fontSize: 12}}>
                    <Badge status="warning" />数据大小: {bytesToSize(fs.statSync(item.localPath).size)}
                    <Divider type="vertical"/>
                    <Badge status="success" />总图片: {item.process.total.toLocaleString()}
                    {
                        item.process.blankCount > 0 ? <span><Divider type="vertical"/><Badge status="error" />空图片: {item.process.blankCount.toLocaleString()}</span> : null
                    }
                </Text>
            )
        }
    }


    render() {
        const item = this.props.item;
        //文件是否存在
        const exists = fileExists(item.localPath);

        return (
            <div className={'taskItem'}>
                <List.Item className={"styles"} style={{backgroundColor: this.props.selected ? '#e6f7ff' : ''}} onClick={() => this.props.onClick()}>
                    <List.Item.Meta
                        avatar={
                            <Badge dot={item.isNew} >
                                <Avatar className={jobTypeClass[item.type]} size={48}>{item.avatar}</Avatar>
                            </Badge>
                        }
                        title={<Text strong disabled = {!exists}>{item.name}</Text>}
                        description={this.renderDesc(exists,item)}
                    />
                    <div className={"content"}>
                        <div style={{width: 170}}>
                            <Progress percent={100} showInfo={false} strokeColor={exists ? '#52c41a' : '#F5F5F5'}/>
                            <div className={'progressInfo'}>
                                <span>{''}</span>
                                <Text disabled = {!exists}>100%</Text>
                            </div>
                        </div>
                        {
                            exists ?
                                <span style={{color:'#52c41a'}}><CheckCircleTwoTone twoToneColor="#52c41a" /> {statusText.complete}</span>
                                :
                                <Text disabled><DeleteOutlined /> {statusText.delete}</Text>
                        }
                    </div>
                </List.Item>
            </div>
        )
    }
}

export default CompleteItem