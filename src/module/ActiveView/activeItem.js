import React from 'react'
import {Avatar, Divider, List, Progress} from 'antd'
import {bytesToSize,formatTime} from '../../util/utils'
import {inject, observer} from "mobx-react";
import {ExclamationCircleOutlined,ClockCircleOutlined,PauseCircleOutlined} from "@ant-design/icons";


@inject('task','global')
@observer
class ActiveItem extends React.Component {

    render() {
        const item = this.props.item;
        return (
            <div className={'taskItem'}>
                <List.Item className={'styles'} style={{backgroundColor: this.props.selected ? '#e6f7ff' : ''}} onClick={() => this.props.onClick()}>
                    <List.Item.Meta
                        avatar={<Avatar className={item.avatar.indexOf('过车') > -1 ? "vehPassStyle" : "illegalPassStyle"}  size={48}>{item.avatar}</Avatar>}
                        title={<span>{item.name}</span>}
                        description={
                            <span>
                            {bytesToSize(item.process.finishSize)}
                                <Divider type="vertical"/>
                            当前已下载: {item.process.finishCount} / 总计: {item.process.total}
                        </span>}
                    />
                    <div className={"content"}>
                        <div style={{width: 170}}>
                            <Progress percent={item.process.percent} showInfo={false} status={item.state === 'error' ? "exception" : 'normal'}/>
                            <div className={'progressInfo'}>
                                <span>{formatTime(item.process.remainingTime)}</span>
                                <span>{item.process.percent}%</span>
                            </div>
                        </div>
                        {item.state === 'waiting' ? <span style={{color:'orange'}}><ClockCircleOutlined /> 等待中</span> : null}
                        {item.state === 'error' ? <span style={{color:'red'}}><ExclamationCircleOutlined /> 下载出错</span> : null}
                        {item.state === 'paused' ? <span><PauseCircleOutlined /> 暂停中</span> : null}
                    </div>
                </List.Item>
            </div>
        )
    }
}

export default ActiveItem