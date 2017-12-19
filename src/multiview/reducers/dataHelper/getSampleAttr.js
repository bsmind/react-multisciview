import forEach from 'lodash.foreach';

import {SHORT_KEY_MAX_LEN} from '../../constants';

export default function getSampleAttr(state, payload) {
    let attrKinds = {}, attrMinMax = {}, attrTypes = {};

    forEach(payload, (value, key) => {
        const path = key;
        const {type, minmax} = value;

        const tokens = path.split('.');
        let attr = tokens[tokens.length - 1];
        if (tokens.length > 1) {
            let prefix = '';
            for (let i=0; i<tokens.length-1; ++i) {
                prefix = (prefix.length)
                    ? prefix + '.' + tokens[i].substr(0, SHORT_KEY_MAX_LEN)
                    : tokens[i].substr(0, SHORT_KEY_MAX_LEN);
            }
            attr = prefix + '.' + attr;
        }

        attrKinds[path] = attr;
        attrMinMax[path] = minmax;
        attrTypes[path] = type; 
    });

    return {...state, attrKinds, attrMinMax, attrTypes}
}