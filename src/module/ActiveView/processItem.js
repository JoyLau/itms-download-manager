import React from 'react'
import {Avatar, Divider, List, Progress} from 'antd'
import {getFileExt, bytesToSize,formatTime} from '../../util/utils'
import {inject, observer} from "mobx-react";



@inject('task','jobProcess')
@observer
class ProcessItem extends React.Component {

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
        return (
            <List.Item style={styles} onClick={() => this.props.onClick()}>
                <List.Item.Meta
                    avatar={<Avatar style={item.avatar.indexOf('过车') > -1 ? vehPassStyle : illegalPassStyle} size={48}>{item.avatar}</Avatar>}
                    title={<span>{item.name}</span>}
                    description={
                        <span>
                            {bytesToSize(this.props.jobProcess.process.finishSize)}
                            <Divider type="vertical"/>
                            当前已下载: {this.props.jobProcess.process.finishCount} / 总计: {this.props.jobProcess.process.total}
                            {
                                this.props.jobProcess.process.creatingExcel ?
                                    <span>
                                        <Divider type="vertical"/>
                                        正在生成 Excel ...
                                    </span>
                                :
                                null
                            }
                        </span>
                    }
                />
                <div style={content}>
                    <div style={{width: 170}}>
                        <Progress percent={this.props.jobProcess.process.percent} showInfo={false} strokeColor={{
                            '0%': '#108ee9',
                            '100%': '#87d068',
                        }}/>
                        <div style={{display: 'flex', justifyContent: 'space-between'}}>
                            <span>{this.props.jobProcess.process.remainingTime !== 0 ? formatTime(this.props.jobProcess.process.remainingTime) : ''}</span>
                            <span>{Number(this.props.jobProcess.process.percent) === 100 ? '100' : this.props.jobProcess.process.percent}%</span>
                        </div>
                    </div>
                    {item.state === 'active' ? <span>{bytesToSize(this.props.jobProcess.process.speed)}/s</span> : null}
                </div>

            </List.Item>
        )
    }
}

export default ProcessItem