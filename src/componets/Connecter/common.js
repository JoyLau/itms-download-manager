import axios from "axios";
import {updateSysCodes} from '../../util/dbUtils'
/**
 * 需要字典表的数据,更新本地字典
 */
export const updateSysCode = async (data) => {
    await axios({
        method: data.method,
        url: data.url,
        params: {
            codeTypesString: data.params.codeTypesString
        },
    })
        .then(function (response) {
            Object.keys(response.data).forEach(key => {
                updateSysCodes(key, response.data[key])
            })
        })
}