import axios from "axios";
import {setSessionStorage,getSessionStorage} from '../../util/utils'
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
                // updateSysCodes(key, response.data[key])
                setSessionStorage(key,response.data[key])
            })
        })
}

export const getCodeName = (type, code) => {
    const sysCode = getSessionStorage(type).find(path => path.value === code);
    if (sysCode) {
        return sysCode.text
    }
    return "";
}