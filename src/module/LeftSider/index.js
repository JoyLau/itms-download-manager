import React from 'react'
import {Avatar, Menu, Layout, Badge} from 'antd'
import {DownloadOutlined,CheckOutlined,SettingOutlined} from'@ant-design/icons';
import avatarImg from './avatar.png'
import {inject, observer} from "mobx-react";
import Version from "../../componets/Version";

const {Sider} = Layout;
const os = window.require('os')

@inject("task")
@observer
class LeftSider extends React.Component {

    render() {
        return (
            <Sider width={160}>
                <div className="darg-move-window" style={{height:44}}>
                </div>
                <div className="userInfo">
                    <Avatar size={50} src={avatarImg}/>
                </div>
                <div className="userName">
                    <span>{os.userInfo().username}</span>
                </div>
                <Menu onClick={(item) => this.props.onMenuClick(item.key)}
                      defaultSelectedKeys={['active']}
                      selectedKeys={[].concat(this.props.currentMenu)}
                      mode="inline" theme="dark">
                    <Menu.Item key="active">
                        <DownloadOutlined />
                        <span>正在下载</span>
                    </Menu.Item>
                    <Menu.Item key="complete">
                        <Badge count={this.props.task.getJobs().filter(item => (item.state === 'complete' && item.isNew)).length}
                               offset={[10,0]}
                        >
                            <CheckOutlined />
                            <span >已完成</span>
                        </Badge>
                    </Menu.Item>
                    <Menu.Item key="setting">
                        <SettingOutlined />
                        <span>设置</span>
                    </Menu.Item>
                </Menu>
                <Version/>
            </Sider>
        )
    }
}
export default LeftSider