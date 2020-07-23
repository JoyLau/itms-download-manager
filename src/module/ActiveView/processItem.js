import React from 'react'
import {Avatar, Badge, Divider, List, Progress, Row, Typography} from 'antd'
import {bytesToSize,formatTime} from '../../util/utils'
import {inject, observer} from "mobx-react";
import {ClockCircleOutlined, ExclamationCircleOutlined, PauseCircleOutlined,LoadingOutlined} from "@ant-design/icons";

const { Text } = Typography;

@inject('task','jobProcess')
@observer
class ProcessItem extends React.Component {

    render() {
        const item = this.props.item;
        const process = this.props.jobProcess.getProcess(item.id)
        // 首先每个任务都一定有 jobProcess
        // 如果 process 没有获取到,则可能是 jobProcess 还没初始化完成,
        // 这时不需要显示任何内容, 只需等到 jobProcess 初始完成后通知组件更新即可
        // 没有读到的 jobProcess 的任务, 将其状态改为等待中, 以便后续可以继续下载
        if (!process) {
            this.props.task.updateStateJob(item.id,"waiting")
            return (
                <div/>
            )
        }

        return (
            <div className={'taskItem'}>
                <List.Item className={"styles"} style={{backgroundColor: this.props.selected ? '#e6f7ff' : ''}} onClick={() => this.props.onClick()}>
                    <List.Item.Meta
                        avatar={<Avatar className={item.avatar.indexOf('过车') > -1 ? "vehPassStyle" : "illegalPassStyle"} size={48}>{item.avatar}</Avatar>}
                        title={<span>{item.name}</span>}
                        description={
                            <span style={{fontSize: 12}}>
                                <div>
                                    <Badge status="warning" />{bytesToSize(process.finishSize)}
                                    <Divider type="vertical"/>
                                    <Badge status="processing" />当前: {process.finishCount}
                                    <Divider type="vertical"/>
                                    <Badge status="error" />空图片: {process.blankCount}
                                    <Divider type="vertical"/>
                                    <Badge status="success" />总计: {process.total}
                                </div>
                            </span>
                        }
                    />
                    <div className={"content"}>
                        <div style={{width: 170}}>
                            <Progress percent={process.percent} showInfo={false} strokeColor={{
                                '0%': '#108ee9',
                                '100%': '#87d068',
                            }}/>
                            <div className={'progressInfo'}>
                                {
                                    process.message ?
                                        <span>
                                            <LoadingOutlined style={{ color: '#1890ff',}} /> <Text ellipsis style={{fontSize: 12,width: 100}}>{process.message}</Text>
                                        </span>
                                        :
                                        <span>{formatTime(process.remainingTime)}</span>
                                }
                                <span>{process.percent}%</span>
                            </div>
                        </div>
                        {item.state === 'active' ? <span>{bytesToSize(process.speed)}/s</span> : null}
                        {item.state === 'waiting' ? <span style={{color:'orange'}}><ClockCircleOutlined /> 等待中</span> : null}
                        {item.state === 'error' ? <span style={{color:'red'}}><ExclamationCircleOutlined /> 下载出错</span> : null}
                        {item.state === 'paused' ? <span><PauseCircleOutlined /> 暂停中</span> : null}
                    </div>
                </List.Item>
            </div>
        )
    }
}

export default ProcessItem