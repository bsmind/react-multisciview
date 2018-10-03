import { combineReducers } from "redux";
import { dataReducers } from "./dataReducers";
import { settingReducers } from './settingReducers';

export default combineReducers({
    data: dataReducers,
    env: settingReducers
});