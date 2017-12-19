export default function setAttr(state, payload) {
    const {dim, value} = payload;
    switch (dim) {
        case 'x': case 'X': return {...state, attrx: value};
        case 'y': case 'Y': return {...state, attry: value};
        case 'z': case 'Z': return {...state, attrz: value};
        default: return state;
    }
}