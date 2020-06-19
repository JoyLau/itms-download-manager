import React, {Component} from 'react'
import {
    Button, Dropdown, Layout, List,
    Modal, Input, Divider, Menu, message,
    Form, Upload, Popconfirm, Card
} from 'antd'

import EmptyContent from "../../componets/EmptyContent";
import WindowControl from "../../componets/WindowControl";
import ViewHead from "../../componets/ViewHead";



const {Header, Content} = Layout;

class RemoveView extends Component {

    render() {
        return (
            <Layout>
                <Header className="darg-move-window header-toolbar">
                    <ViewHead/>
                    <WindowControl/>
                </Header>
                <Content>
                    <EmptyContent textType={'remove'}/>
                </Content>
            </Layout>
        )
    }

}
export default RemoveView
