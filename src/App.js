import React, {Component} from 'react';
import {ConfigProvider, Layout,notification} from "antd";
import zh_CN from 'antd/lib/locale-provider/zh_CN';
import './App.less';
import './style.less'
import LeftSider from "./module/LeftSider";
import SettingView from "./module/SettingView";
import {inject, observer} from "mobx-react";
import Connecter from "./componets/Connecter";
import ActiveView from "./module/ActiveView";
import CompleteView from "./module/CompleteView";


// 全局配置
notification.config({
    duration: null,
    closeIcon: <div/>,
    top: 50,
});


@inject('global')
@observer
class App extends Component {

    render() {
        return (
            <div>
                <ConfigProvider locale={zh_CN}>
                    <Connecter>
                        <Layout className={'App '}>
                            <LeftSider
                                currentMenu={this.props.global.mainMenu}
                                onMenuClick={(item) => this.props.global.changeMainMenu(item)}
                            />
                            {this.props.global.mainMenu === 'active' ?
                                <ActiveView/>
                                :
                                this.props.global.mainMenu === 'complete' ?
                                    <CompleteView/>
                                        :
                                        this.props.global.mainMenu === 'setting' ?
                                            <SettingView/>
                                            :
                                                <div/>
                            }
                        </Layout>
                    </Connecter>
                </ConfigProvider>
            </div>
        );
    }
}

export default App;