import React from 'react'
import {Avatar, Badge, Divider, List, Progress} from 'antd'
import {getFileExt, bytesToSize,formatTime} from '../../util/utils'
import {CheckCircleTwoTone, CheckOutlined} from "@ant-design/icons";


class CompleteItem extends React.Component {

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

        const item = this.props.item;
        return (
            <List.Item style={styles} onClick={() => this.props.onClick()}>
                <List.Item.Meta
                    avatar={
                        <Badge count={item.isNew ? "New" : null}>
                            <Avatar size="large">{getFileExt(item.name)}</Avatar>
                        </Badge>
                        }
                    title={<span>{item.name}</span>}
                    description={
                        <span>
                            数据大小: {bytesToSize(item.process.finishSize)}
                            <Divider type="vertical"/>
                            下载总数: {item.process.total}
                        </span>}
                />
                <div style={content}>
                    <div style={{width: 170}}>
                        <Progress percent={item.process.percent} showInfo={false} status={'success'}/>
                        <div style={{display: 'flex', justifyContent: 'space-between'}}>
                            <span>{item.process.remainingTime !== 0 ? formatTime(item.process.remainingTime) : ''}</span>
                            <span>{Number(item.process.percent) === 100 ? '100' : item.process.percent}%</span>
                        </div>
                    </div>
                    {item.state === 'complete' ? <span style={{color:'#52c41a'}}><CheckCircleTwoTone twoToneColor="#52c41a" />  已完成</span> : null}
                </div>

            </List.Item>
        )
    }
}

export default CompleteItem