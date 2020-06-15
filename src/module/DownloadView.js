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
          {/*{this.state.data && this.state.data.length ?<List*/}
          {/*  itemLayout="horizontal"*/}
          {/*  dataSource={this.state.data}*/}
          {/*  renderItem={item => this.renderItem(item)}/> : <EmptyContent textType={this.props.currentMenu}/>}*/}
          <EmptyContent textType={this.props.currentMenu}/>
        </Content>
        {this.renderAddTaskDialog()}
        {this.renderCard(this.state.data && selectedItem ? this.state.data.filter(item => item.gid === selectedItem.gid)[0] : null)}
      </Layout>
    )
  }

  renderItem(item) {
    const selected = this.state.selectedItem && item.gid === this.state.selectedItem.gid;
    item.selected = selected;
    if (selected && this.state.selectedItem) {
      // eslint-disable-next-line
      this.state.selectedItem.status = item.status;
    }
    return (
      <DownloadItem
        selected={selected}
        onClick={() => this.onItemClick(item)} item={item}/>
    )
  }

  renderCard(item){
    if (Array.isArray(item)) item = item[0];
    const tabListNoTitle = [{
      key: 'info',
      tab: '下载详情',
    }];
    if (item && item.bittorrent){
      tabListNoTitle.push({
        key: 'bit',
        tab: '种子信息',
      })
    } else if (this.state.noTitleKey !== 'info') {
      this.setState({
        noTitleKey: 'info'
      })
    }
    return (
      <Card activeTabKey={this.state.noTitleKey}
            className="download-item-details-card"
            tabList={item ? tabListNoTitle : []}
            onTabChange={(key) => { this.onTabChange(key, 'noTitleKey'); }}
            style={{
              width: '100%',
              height: item ? 192 : 0
            }}>
        {item && this.state.noTitleKey === 'info' ?
        <div style={{
          height: item ? 155 : 0,
          overflow:'auto'
        }}>
          <Card.Grid style={{width: '100%', padding: 5}}>
            文件名称: {item.title}
          </Card.Grid>
          <Card.Grid style={gridStyle}>
            任务状态:
          </Card.Grid>
          <Card.Grid style={gridStyle}>
            文件大小:
          </Card.Grid>
          <Card.Grid title={item.dir} style={gridStyle}>
            存储目录: {item.dir}
          </Card.Grid>
          <Card.Grid style={gridStyle}>
            已下载:
          </Card.Grid>
          <Card.Grid style={gridStyle}>
            当前下载速度:
          </Card.Grid>
          <Card.Grid style={gridStyle}>
            下载进度: {item.progress}%
          </Card.Grid>
          <Card.Grid style={gridStyle}>
            分片数: {item.numPieces}
          </Card.Grid>
          <Card.Grid style={gridStyle}>
            分片大小:
          </Card.Grid>
          <Card.Grid style={gridStyle}>
            连接数: {item.connections}
          </Card.Grid>
          {item.files && item.files.length ? item.files.map(file => (
            <Card.Grid title={file.path} style={{width: '100%', padding: 5}} key={file.path}>
              文件位置: {file.path}
              <a className="device-electron-show server-remote-hide"
                 style={{marginLeft: 5}} title={'在文件管理器中显示'}
                 onClick={()=>shell.showItemInFolder(file.path)}>
                <SearchOutlined />
              </a>
            </Card.Grid>
          )) : null}
        </div>
          : null }

        {item && item.bittorrent && this.state.noTitleKey === 'bit' ? <div style={{
          height: item ? 155 : 0,
          overflow:'auto'
        }}>
          <Card.Grid style={{width: '100%', padding: 5}}>
            注释: {item.bittorrent.comment}
          </Card.Grid>
          <Card.Grid style={{width: '100%', padding: 5}}>
            创建时间: {item.bittorrent.creationDate ? (new Date(Number(item.bittorrent.creationDate) * 1000)).toLocaleString() : ''}
          </Card.Grid>
          {/*{item.bittorrent.info ? Object.keys(item.bittorrent.info).map(key => {*/}
            {/*return (*/}
              {/*<Card.Grid style={{padding: 5}} key={key}>*/}
                {/*{key}: {item.bittorrent.info[key]}*/}
              {/*</Card.Grid>*/}
            {/*)*/}
          {/*}) : null}*/}
          {/*{JSON.stringify(item.bittorrent)}*/}
        </div> : null }
        </Card>
    )
  }

  renderAddTaskDialog(){
    const taskType = this.state.taskType;
    return (
      <Modal
        destroyOnClose={true}
        title={'新建' + String(taskType).toUpperCase() + '任务'}
        wrapClassName="newTaskDialog"
        maskStyle={{backgroundColor: 'transparent'}}
        visible={this.state.visible}
        footer={false}
        onOk={this.handleOk}
        onCancel={this.handleCancel}
      >
        <Form>
          {taskType === 'url' ? <TextArea onChange={(e) => this.setState({url: e.target.value})} placeholder={'添加多个下载连接时，请确保每行只有一个连接。'}
                                                     autosize={{minRows: 4, maxRows: 8}}/> : null}
          {taskType === 'magnet' ? <TextArea onChange={(e) => this.setState({url: e.target.value})} placeholder={'添加多个下载连接时，请确保每行只有一个连接。'}
                                                        autosize={{minRows: 4, maxRows: 8}}/> : null}

          {taskType === 'bt' ? <Dragger customRequest={(c)=>{
            if (c.file.size > 1024 * 1024 * 10){
              message.error('种子文件不能大于10MB');
              return
            }
            let reader = new FileReader();
            reader.onload = () => {
              let txt = reader.result;
              this.setState({url: txt.substr(txt.indexOf('base64,') + 7)});
              this.handleOk()
            };
            reader.readAsDataURL(c.file);
            c.onSuccess({"status": "success"}, c.file);
          }} showUploadList={false}>
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className="ant-upload-text">点击或拖动BT文件到这个区域下载</p>
            <p className="ant-upload-hint">请选择正确的BT文件格式，BT文件不得超过10MB。</p>
          </Dragger> : null}
          {/*<Form.Item label={'保存位置'}>
              <Input type={'file'} addonAfter={<a>选择一个目录</a>} placeholder={this.state.config && this.state.config.dir}/>
            </Form.Item>*/}
          {taskType === 'bt' ? null : <div className="ant-modal-footer">
            <Button type="primary" onClick={this.handleOk} size={'small'}>立即下载</Button>
          </div>}
        </Form>
      </Modal>
    )
  }
}
