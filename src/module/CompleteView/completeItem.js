import React from 'react'
import {Avatar, Badge, Divider, List, Progress,Typography} from 'antd'
import {bytesToSize,formatTime,fileExists} from '../../util/utils'
import {CheckCircleTwoTone,WarningOutlined, DeleteOutlined} from "@ant-design/icons";
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
                <Text>
                    数据大小: {bytesToSize(fs.statSync(item.localPath).size)}
                    <Divider type="vertical"/>
                    下载总数: {item.process.total}
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
                            <Badge dot={item.isNew}>
                                <Avatar className={item.avatar.indexOf('过车') > -1 ? "vehPassStyle" : "illegalPassStyle" } size={48}>{item.avatar}</Avatar>
                            </Badge>
                        }
                        title={<Text disabled = {!exists}>{item.name}</Text>}
                        description={this.renderDesc(exists,item)}
                    />
                    <div className={"content"}>
                        <div style={{width: 170}}>
                            <Progress percent={item.process.percent} showInfo={false} strokeColor={exists ? '#52c41a' : '#F5F5F5'}/>
                            <div className={'progressInfo'}>
                                <span>{''}</span>
                                <Text disabled = {!exists}>{item.process.percent}%</Text>
                            </div>
                        </div>
                        {
                            exists ?
                                <span style={{color:'#52c41a'}}><CheckCircleTwoTone twoToneColor="#52c41a" />  已完成</span>
                                :
                                <Text disabled><DeleteOutlined />  已删除</Text>
                        }
                    </div>
                </List.Item>
            </div>
        )
    }
}

export default CompleteItem