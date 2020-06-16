import React, {Component} from 'react';
import {ConfigProvider, Layout} from "antd";
import zh_CN from 'antd/lib/locale-provider/zh_CN';
import './App.less';
import './style.less'
import LeftSider from "./module/LeftSider";
import DownloadView from "./module/DownloadView";
import SettingView from "./module/SettingView";

class App extends Component {

    state = {
        menu: 'active',
    }

    onMenuClick(item) {
        this.setState({
            menu: item
        })
    }

    render() {
        return (
            <div>
                <ConfigProvider locale={zh_CN}>
                    <Layout className={'App '}>
                        <LeftSider onMenuClick={(item) => this.onMenuClick(item)}/>
                        {this.state.menu && this.state.menu !== 'setting' ?
                            <DownloadView currentMenu={this.state.menu}/>
                            :
                            <SettingView/>
                        }
                    </Layout>
                </ConfigProvider>
            </div>
        );
    }
}

export default App;