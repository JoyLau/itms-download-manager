import React from 'react'
import {Avatar, Menu, Layout, Dropdown, Badge} from 'antd'
import { UserOutlined,DownOutlined,DownloadOutlined,CheckOutlined,DeleteOutlined,SettingOutlined} from'@ant-design/icons';
import avatarImg from './avatar.png'

const {Sider} = Layout;
const os = window.require('os')

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
                      mode="inline" theme="dark">
                    <Menu.Item key="active">
                        <DownloadOutlined />
                        <span>正在下载</span>
                    </Menu.Item>
                    <Menu.Item key="complete">
                        <CheckOutlined />
                        <span>已完成</span>
                    </Menu.Item>
                    <Menu.Item key="remove">
                        <DeleteOutlined />
                        <span>回收站</span>
                    </Menu.Item>
                    <Menu.Item key="setting">
                        <SettingOutlined />
                        <span>设置</span>
                    </Menu.Item>
                </Menu>
            </Sider>
        )
    }
}
export default LeftSider