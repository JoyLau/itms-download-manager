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

import Dexie from 'dexie';
import {getStorage, setStorage} from "./util/utils";


// 全局配置
notification.config({
    duration: null,
    closeIcon: <div/>,
    top: 50,
});


@inject('global')
@observer
class App extends Component {

    componentDidMount() {


        const db = new Dexie("FriendDatabase");
        db.version(111).stores({ friends: 'id,state,process.percent'});

        db.friends.bulkPut(getStorage('jobs'))

        // db.transaction('rw', db.friends, async() => {
        //
        //     // Make sure we have something in DB:
        //     if ((await db.friends.where({name: 'Josephine'}).count()) === 0) {
        //         const id = await db.friends.add({name: "Josephine", age: 21});
        //         alert (`Addded friend with id ${id}`);
        //     }
        //
        //     // Query:
        //     const youngFriends = await db.friends.where("age").below(25).toArray();
        //
        //     // Show result:
        //     alert ("My young friends: " + JSON.stringify(youngFriends));
        //
        // }).catch(e => {
        //     alert(e.stack || e);
        // });
    }

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
                                    // :
                                    // this.props.global.mainMenu === 'remove' ?
                                    //     <RemoveView/>
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