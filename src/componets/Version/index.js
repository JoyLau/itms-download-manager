import React, {Component} from 'react';
import {Affix, Badge, Tooltip} from "antd";
import pck from '../../../package.json'

class Version extends Component {

    render() {
        return (
            <div>
                <Affix offsetBottom>
                    <div style={{position: 'absolute', bottom: '5px',left: '15px',float:"left"}}>
                        <span style={{fontSize:'10px',color:'#ffffff'}}>v{pck.version}</span>
                    </div>
                </Affix>
            </div>
        );
    }
}
export default Version;