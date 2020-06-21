import React from 'react'
import {Avatar, List, Progress} from 'antd'
import {getFileExt, bytesToSize} from '../../util/utils'
import request from 'request';
import progress from 'request-progress';
import {inject, observer} from "mobx-react";
import Bagpipe from 'bagpipe';


const fs = window.require('fs')

@inject('task')
@inject('global')
@observer
class DownloadItem extends React.Component {

    render() {
        const styles = {
            paddingLeft: 10,
            paddingRight: 10,
            backgroundColor: this.props.selected ? '#d9ecfe' : ''
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
                    description={bytesToSize(item.size.transferred)}
                />
                <div style={content}>
                    <div style={{width: 170}}>
                        <Progress percent={item.percent} showInfo={false} status="active"/>
                        <div style={{display: 'flex', justifyContent: 'space-between'}}>
                            <span>{item.time.remaining}</span>
                            <span>{item.percent}%</span>
                        </div>
                    </div>
                    {item.state === 'complete' ? <span>已完成</span> : null}
                    {item.state === 'error' ? <span style={{color:'red'}}>下载出错</span> : null}
                    {item.state === 'active' ? <span>{bytesToSize(item.speed)}/s</span> : null}
                    {item.state === 'paused' ? <span>暂停中</span> : null}
                </div>

            </List.Item>
        )
    }
}

export default DownloadItem