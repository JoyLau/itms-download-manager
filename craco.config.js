const CracoLessPlugin = require('craco-less');

// 不生成 source-map 文件
process.env.GENERATE_SOURCEMAP = "false";

// 禁用启动时打开浏览器
process.env.BROWSER = "none"

module.exports = {
    pluginOptions: {
        electronBuilder: {
            externals: ['better-sqlite3']
        }
    },
    babel: {
        plugins: [
            ["@babel/plugin-proposal-decorators", { legacy: true }]
        ]
    },
    plugins: [
        {
            plugin: CracoLessPlugin,
            options: {
                lessLoaderOptions: {
                    lessOptions: {
                        modifyVars: {'@primary-color': '#1890ff'},
                        javascriptEnabled: true,
                    },
                }
            },
        }
    ],
};