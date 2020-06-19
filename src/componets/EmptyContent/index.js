import React from 'react'
import { CloudDownloadOutlined,ScheduleOutlined,DeleteOutlined} from'@ant-design/icons';

const textTypes = {
    'active': {icon: <CloudDownloadOutlined />, text: '没有正在下载中的任务'},
    'complete': {icon: <ScheduleOutlined />, text: '没有已完成的任务'},
    'remove': {icon: <DeleteOutlined />, text: '回收站是空的'},
};

export default class EmptyContent extends React.Component {

    static defaultProps = {
        color: '#acacac',
        iconSize: 60,
        icon: '',
        text: '',
        textType: ''
    };

    render() {
        const props = this.props;
        return (
            <div style={{
                display: 'flex',
                flex: 1,
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100%',
                color: props.color
            }}>
                <div style={{fontSize: props.iconSize}}>{props.textType ? textTypes[props.textType].icon : props.icon}</div>
                <div>{props.textType ? textTypes[props.textType].text : props.text}</div>
            </div>
        )
    }
}

