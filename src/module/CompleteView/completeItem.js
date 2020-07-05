import React from 'react'
import {Avatar, Badge, Divider, List, Progress,Typography} from 'antd'
import {bytesToSize,formatTime,fileExists} from '../../util/utils'
import {CheckCircleTwoTone,WarningOutlined} from "@ant-design/icons";

const fs = window.require('fs');
const { Text } = Typography;

class CompleteItem extends React.Component {

    renderDesc = (exists,item) => {
        if (!exists) {
            return (
                <Text type="danger"><WarningOutlined /> 文件已被移动或删除</Text>
            )
        } else {
            return (
                <span>
                    数据大小: {bytesToSize(fs.statSync(item.localPath).size)}
                    <Divider type="vertical"/>
                    下载总数: {item.process.total}
                </span>
            )
        }
    }


    render() {
        const styles = {
            paddingLeft: 10,
            paddingRight: 10,
            backgroundColor: this.props.selected ? '#e6f7ff' : ''
        };

        const content = {
            justifyContent: 'space-between',
            flex: 'initial',
            width: '260px',
            alignItems: 'center',
            display: 'flex'
        }

        const vehPassStyle = {
            color: '#f56a00',
            backgroundColor: '#fde3cf'
        }

        const illegalPassStyle = {
            color: '#0276f1',
            backgroundColor: '#d7d4fa'
        }

        const item = this.props.item;
        //文件是否存在
        const exists = fileExists(item.localPath);

        return (
            <List.Item style={styles} onClick={() => this.props.onClick()}>
                <List.Item.Meta
                    avatar={
                        <Badge count={item.isNew ? "New" : null}>
                            <Avatar style={item.avatar.indexOf('过车') > -1 ? vehPassStyle : illegalPassStyle } size={48}>{item.avatar}</Avatar>
                        </Badge>
                        }
                    title={<Text delete = {!exists}>{item.name}</Text>}
                    description={this.renderDesc(exists,item)}
                />
                <div style={content}>
                    <div style={{width: 170}}>
                        <Progress percent={item.process.percent} showInfo={false} status={'success'}/>
                        <div style={{display: 'flex', justifyContent: 'space-between'}}>
                            <span>{item.process.remainingTime !== 0 ? formatTime(item.process.remainingTime) : ''}</span>
                            <span>{Number(item.process.percent) === 100 ? '100' : item.process.percent}%</span>
                        </div>
                    </div>
                    <span style={{color:'#52c41a'}}><CheckCircleTwoTone twoToneColor="#52c41a" />  已完成</span>
                </div>

            </List.Item>
        )
    }
}

export default CompleteItem