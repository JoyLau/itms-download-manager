import React from 'react'
import {Avatar, Divider, List, Progress} from 'antd'
import {CheckOutlined,CheckCircleTwoTone} from "@ant-design/icons";
import {getFileExt, bytesToSize,formatTime} from '../../util/utils'
import {inject, observer} from "mobx-react";



@inject('task','global')
@observer
class DownloadItem extends React.Component {

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
                    avatar={<Avatar size="large">{getFileExt(item.name)}</Avatar>}
                    title={<span>{item.name}</span>}
                    description={
                        <span>
                            {bytesToSize(item.process.finishSize)}
                            <Divider type="vertical"/>
                            当前下载: {item.process.finishCount} / 总计: {item.process.total}
                        </span>}
                />
                <div style={content}>
                    <div style={{width: 170}}>
                        <Progress percent={item.process.percent} showInfo={false} status={item.status === 'active' ? 'active' : item.status === 'error' ? "exception" : item.status === 'complete' ? "success" : 'normal'}/>
                        <div style={{display: 'flex', justifyContent: 'space-between'}}>
                            <span>{item.process.remainingTime !== 0 ? formatTime(item.process.remainingTime) : ''}</span>
                            <span>{Number(item.process.percent) === 100 ? '100' : item.process.percent}%</span>
                        </div>
                    </div>
                    {item.state === 'waiting' ? <span style={{color:'orange'}}>等待中</span> : null}
                    {item.state === 'error' ? <span style={{color:'red'}}>下载出错</span> : null}
                    {item.state === 'remove' ? <span>已删除</span> : null}
                    {item.state === 'active' ? <span>{bytesToSize(item.process.speed)}/s</span> : null}
                    {item.state === 'paused' ? <span>暂停中</span> : null}
                    {item.state === 'complete' ? <span style={{color:'#52c41a'}}><CheckCircleTwoTone twoToneColor="#52c41a" />  已完成</span> : null}
                </div>

            </List.Item>
        )
    }
}

export default DownloadItem