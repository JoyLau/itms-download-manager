import React, {Component} from 'react';
import { message, Progress, Tooltip} from "antd";
import pck from '../../../package.json'
import {eventBus,waitMoment} from "../../util/utils";
import semver from 'semver';
import progress from 'request-progress';
import config from '../../util/config'
import './style.css'
import { SoundOutlined} from'@ant-design/icons';

const request = window.require('request')
const fs = window.require('fs');
const os = window.require('os')
const {shell,app} = window.require('electron').remote;

class Version extends Component {

    state = {
        updateInfo: {},
        visible: false,
        percent: null,
    }

    componentDidMount() {
        eventBus.on('update-soft', this.updateSoft)
    }

    updateSoft = (update) => {
        try {
            this.setState({
                updateInfo: update
            })
            const latestVersion = update.latest.version;
            if (semver.satisfies(latestVersion, '>' + pck.version)) {
                this.setState({
                    visible: true
                });
            }
        } catch (e) {
            console.error(e)
        }


    }

    close = () => {
        this.setState({
            visible: false
        })
    }

    update = () => {
        const that = this;

        try {
            that.setState({
                visible: false
            })

            const update = this.state.updateInfo;

            const rootPath = update.rootPath;

            const fileName = update.latest.path;

            const downloadUrl = rootPath + config.sep + fileName;

            console.info("new version package download url:", downloadUrl)

            const _request = request(downloadUrl);

            const savePath = os.tmpdir() + config.sep + fileName;

            console.info("package save path:", savePath)

            progress(_request, {
                // throttle: 2000,                    // Throttle the progress event to 2000ms, defaults to 1000ms
                // delay: 1000,                       // Only start to emit after 1000ms delay, defaults to 0ms
                // lengthHeader: 'x-transfer-length'  // Length header to use, defaults to content-length
            })
                .on('progress', function (state) {
                    // The state is an object that looks like this:
                    // {
                    //     percent: 0.5,               // Overall percent (between 0 to 1)
                    //     speed: 554732,              // The download speed in bytes/sec
                    //     size: {
                    //         total: 90044871,        // The total payload size in bytes
                    //         transferred: 27610959   // The transferred payload size in bytes
                    //     },
                    //     time: {
                    //         elapsed: 36.235,        // The total elapsed seconds since the start (3 decimals)
                    //         remaining: 81.403       // The remaining seconds to finish (3 decimals)
                    //     }
                    // }
                    that.setState({
                        percent: Math.round(state.percent * 100)
                    })
                })
                .on('error', function (err) {
                    message.error('更新失败,请稍后再试.');
                    that.setState({
                        visible: false,
                        percent: null,
                    })
                })
                .on('end', async function () {
                    that.setState({
                        percent: 100,
                    })
                    console.info("package download end!");

                    await waitMoment(5000);

                    shell.openPath(savePath)
                        .then(async () => {
                            await waitMoment(2000);
                            app.quit();
                        })
                        .catch(e => {
                            console.error(e)
                        })
                })
                .pipe(fs.createWriteStream(savePath));
        } catch (e) {
            console.error(e)
        }

    }

    render() {

        return (
            <div className='Version'>
                <div style={{position: 'absolute', bottom: '0',width: '100%',padding:'10px 20px 10px 20px'}}>
                    <div>
                        <Tooltip
                            title={<div><span style={{color: 'red'}}><SoundOutlined/>&nbsp;&nbsp;发现新版本!<a onClick={this.update}>&nbsp;立即更新&nbsp;&nbsp;&nbsp;</a></span></div>}
                            visible = {this.state.visible}
                            placement={'rightTop'}
                            trigger={[]}
                        >
                            <span style={{fontSize: '10px', color: '#ffffff'}} onClick={this.close}>v{pck.version}</span>

                        </Tooltip>
                    </div>
                    {
                        this.state.percent ?
                            <Progress
                                percent={this.state.percent}
                                size="small"
                                status="active"
                                format={(percent, successPercent) => {
                                    if (percent === 100) {
                                        return "请稍等"
                                    } else {
                                        return percent + '%';
                                    }
                                }}
                            />
                            : null
                    }

                </div>
            </div>
        );
    }
}
export default Version;