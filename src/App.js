import React, {Component} from 'react';
import {ConfigProvider, Layout} from "antd";
import zh_CN from 'antd/lib/locale-provider/zh_CN';
import './App.less';
import './style.less'
import LeftSider from "./module/LeftSider";
import SettingView from "./module/SettingView";
import {inject, observer} from "mobx-react";
import Connecter from "./componets/Connecter";
import ActiveView from "./module/ActiveView";
import CompleteView from "./module/CompleteView";
import RemoveView from "./module/RemoveView";

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
                                    this.props.global.mainMenu === 'remove' ?
                                        <RemoveView/>
                                        :
                                        <SettingView/>
                            }
                        </Layout>
                    </Connecter>
                </ConfigProvider>
            </div>
        );
    }
}

export default App;