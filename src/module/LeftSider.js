import React from 'react'
import {Avatar, Menu, Layout, Dropdown, Badge} from 'antd'
import { UserOutlined,DownOutlined,DownloadOutlined,CheckOutlined,DeleteOutlined,SettingOutlined} from'@ant-design/icons';

const {Sider} = Layout;

class LeftSider extends React.Component {

    render() {
        return (
            <Sider width={160}>
                <div className="userInfo">
                    <Avatar size='large' style={{ backgroundColor: '#87d068' }} icon={<UserOutlined />} />
                    <div className="userName">
                        <spa>JoyLau</spa>
                    </div>
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