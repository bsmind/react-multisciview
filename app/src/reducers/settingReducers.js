const INIT_STATE = {
    fontSize: 11,
    iconSize: 10,
    iconType: 'square',
    pcpFontSize: 11,
    zoomSensitivity: 1,
    imageScale: 1
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
