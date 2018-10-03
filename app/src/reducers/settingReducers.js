const INIT_STATE = {
    fontSize: 7
}

const set_value = (state, payload) => {
    const {name, value} = payload;
    if (state.hasOwnProperty(name))
        return {...state, [name]: value};
    return state;
}

export function settingReducers(state = INIT_STATE, action) {
    const {type, payload} = action;

    let _type = type;
    if (_type.includes('REJECTED'))
        _type = "REJECTED";

    switch (_type) {
        case "SET_VALUE": return set_value(state, payload);

        default:
            return state;
    }
}
