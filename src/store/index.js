import global from "./global";
import task from './task';
import jobProcess from "./jobProcess";
import {configure} from "mobx";

// 开启严格模式, 非 @action 无法操作 store
configure({
    enforceActions: 'always'
});

const stores = {
    task,
    global,
    jobProcess
};

export default stores;