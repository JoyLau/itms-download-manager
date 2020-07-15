import {observable, action, configure} from 'mobx';
import {getSessionStorage,setSessionStorage} from "../util/utils";
// configure({
//     enforceActions: 'always'
// });

/**
 * 字典配置
 */
class SysCode {

    // 当前显示的左侧菜单项
    @observable
    sysCodes = getSessionStorage('sysCodes') ? setSessionStorage('sysCodes') : {}


    @action
    updateSysCodes(key, value) {
        this.sysCodes[key] = value;
        setSessionStorage("sysCodes",this.sysCodes)

    }
}

export default new SysCode();