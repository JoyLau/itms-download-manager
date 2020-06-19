import React, {Component} from 'react'
import {
    Button, Dropdown, Layout, List,
    Modal, Input, Divider, Menu, message,
    Form, Upload, Popconfirm, Card
} from 'antd'

import EmptyContent from "../../componets/EmptyContent";
import WindowControl from "../../componets/WindowControl";
import ViewHead from "../../componets/ViewHead";
import DownloadItem from "../../componets/DownloadItem";
import {getStatusText,bytesToSize} from '../../util/utils'
import SearchOutlined from "@ant-design/icons/lib/icons/SearchOutlined";



const {shell} = window.require('electron').remote;
const {Header, Content} = Layout;

class ActiveView extends Component {

    state = {
        selectedItem: null,
        data: [
            {
                title: "file.exe",
                totalLength: 123334565,
                progress: 30,
                eta: '1:43',
                downloadSpeed: 128,
                status: 'paused'
            }
        ]
    }

    onItemClick = item => {
        item.progress = 100
        this.setState({
            selectedItem: item,
            data: [item]
        })
    }

    renderItem(item) {
        return (
            <DownloadItem
                // selected={selected}
                onClick={() => this.onItemClick(item)}
                item={item}
            />
        )
    }



    renderDetail(item){
        const gridStyle = {
            width: '33.333333333%',
            textAlign: 'left',
            padding: 5
        };

        const tabListNoTitle = [{
            key: 'info',
            tab: '下载详情',
        }];
        return (
            <Card activeTabKey={'info'}
                  className="download-item-details-card"
                  tabList={item ? tabListNoTitle : []}
                  // onTabChange={(key) => { this.onTabChange(key, 'noTitleKey'); }}
                  style={{
                      width: '100%',
                  }}>
                <div style={{
                    overflow:'auto'
                }}>
                    <Card.Grid style={{width: '100%', padding: 5}}>
                        文件名称: {item.title}
                    </Card.Grid>
                    <Card.Grid style={gridStyle}>
                        任务状态: {getStatusText(item.status)}
                    </Card.Grid>
                    <Card.Grid style={gridStyle}>
                        文件大小: {bytesToSize(item.totalLength)}
                    </Card.Grid>
                    <Card.Grid title={item.dir} style={gridStyle}>
                        存储目录: {item.dir}
                    </Card.Grid>
                    <Card.Grid style={gridStyle}>
                        已下载: {bytesToSize(item.completedLength)}
                    </Card.Grid>
                    <Card.Grid style={gridStyle}>
                        当前下载速度: {bytesToSize(item.downloadSpeed)}/秒
                    </Card.Grid>
                    <Card.Grid style={gridStyle}>
                        下载进度: {item.progress}%
                    </Card.Grid>
                    <Card.Grid style={gridStyle}>
                        分片数: {item.numPieces}
                    </Card.Grid>
                    <Card.Grid style={gridStyle}>
                        分片大小: {bytesToSize(item.pieceLength)}
                    </Card.Grid>
                    <Card.Grid style={gridStyle}>
                        连接数: {item.connections}
                    </Card.Grid>
                    <Card.Grid style={{width: '100%', padding: 5}}>
                        文件位置: {"file.path"}
                        <a className="device-electron-show server-remote-hide"
                           style={{marginLeft: 5}} title={'在文件管理器中显示'}
                           onClick={()=>shell.showItemInFolder("file.path")}>
                            <SearchOutlined />
                        </a>
                    </Card.Grid>
                </div>
            </Card>
        )
    }

    render() {
        return (
            <Layout>
                <Header className="darg-move-window header-toolbar">
                    <ViewHead/>
                    <WindowControl/>
                </Header>
                <Content>
                    {/*<EmptyContent textType={'active'}/>*/}

                    <List
                        itemLayout="horizontal"
                        dataSource={this.state.data}
                        renderItem={item => this.renderItem(item)}/>
                </Content>
                {this.state.selectedItem ? this.renderDetail(this.state.selectedItem) : null}
            </Layout>
        )
    }

}
export default ActiveView
