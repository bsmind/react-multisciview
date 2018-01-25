import { combineReducers } from "redux";
import { dataReducers } from "./dataReducers";
import { visReducers } from "./visReducers";

export default combineReducers({
	data: dataReducers,
	vis: visReducers
});