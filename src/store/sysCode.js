import {observable, action, configure} from 'mobx';
import {getStorage,setStorage} from "../util/utils";
// configure({
//     enforceActions: 'always'
// });

/**
 * 字典配置
 */
class SysCode {

    // 当前显示的左侧菜单项
    @observable
    sysCodes = getStorage('sysCodes') ? getStorage('sysCodes') : {}


    @action
    updateSysCodes(key, value) {
        this.sysCodes[key] = value;
        setStorage("sysCodes",this.sysCodes)

    }
}

export default new SysCode();