const path = window.require('path')
const os = window.require('os')

const appConfig = {
    // 协议名称
    PROTOCOL: 'itms-download-manager',
    winTitle: "管控平台文件下载器",
    // 路径分隔符
    sep: path.sep,
    // 换行符
    eol: os.EOL
};

module.exports = appConfig;