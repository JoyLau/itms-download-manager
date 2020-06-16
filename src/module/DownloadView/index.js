import React, {Component} from 'react'
import {
  Button, Dropdown, Layout, List,
  Modal, Input, Divider, Menu, message,
  Form, Upload, Popconfirm, Card
} from 'antd'

import DownloadItem from './DownloadItem'
import EmptyContent from "./EmptyContent";
import WindowControl from "./WindowControl";
import { PlusOutlined, DownOutlined,CaretRightOutlined, PauseOutlined,DeleteOutlined,SearchOutlined,InboxOutlined} from'@ant-design/icons';


const {shell} = window.require('electron').remote;

const {Header, Content} = Layout;
const {TextArea} = Input;
const Dragger = Upload.Dragger;

const gridStyle = {
  width: '33.333333333%',
  textAlign: 'left',
  padding: 5
};

export default class DownloadView extends Component {

  state = {
    selectedItem: null,
  }

  render() {
    const menu = (
      <Menu onClick={this.showModal}>
        <Menu.Item key="url">URL任务</Menu.Item>
        <Menu.Item key="bt">BT任务</Menu.Item>
        {/*<Menu.Item key="magnet">磁力连接</Menu.Item>*/}
      </Menu>
    );

    const selectedItem = this.state.selectedItem;
    const disableToolbar = 'active';
    const selectedStatus = selectedItem && selectedItem.status;

    return (
      <Layout>
        <Header className="darg-move-window header-toolbar">
          <Dropdown disabled={disableToolbar} overlay={menu}>
            <Button type="primary" size={'small'}><PlusOutlined onClick={this.showModal} style={{fontWeight: 700}}/>新建<DownOutlined /></Button>
          </Dropdown>
          <Divider type="vertical"/>
          <Button size={'small'} onClick={() => this.onChangeStatus('unpauseAll')} icon={<CaretRightOutlined />}>全部开始</Button>
          <Button size={'small'} onClick={() => this.onChangeStatus('forcePauseAll')} icon={<PauseOutlined />} style={{marginLeft: 5}}>全部暂停</Button>
          <Divider type="vertical"/>
          {selectedStatus === 'paused' ?
            <Button onClick={() => this.onChangeStatus('start')}
                    disabled={!selectedItem || disableToolbar}
                    size={'small'} icon={<CaretRightOutlined />}/>:
            <Button onClick={() => this.onChangeStatus('pause')}
                    disabled={!selectedItem || disableToolbar}
                    size={'small'} type="dashed" icon={<PauseOutlined />}/>}
          <Popconfirm title="你确定要删除这个下载任务吗?"
                      onConfirm={() => this.onChangeStatus('remove')}
                      okText="删除"
                      cancelText="取消">
            <Button disabled={!selectedItem || disableToolbar}
                    size={'small'} style={{marginLeft: 10}} type="danger"><DeleteOutlined /></Button>
          </Popconfirm>
          <WindowControl/>
        </Header>
        <Content>
          <EmptyContent textType={this.props.currentMenu}/>
        </Content>
      </Layout>
    )
  }

}
