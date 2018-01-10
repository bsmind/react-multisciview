import get from 'lodash.get';
import set from 'lodash.set';

const calculateDataStat = (data, types, attrs) => {
    const indexById = {}, minmax = {};

    const firstItem = data[0];
    attrs.forEach( attr => {
        const type = types[attr];
        const value = get(firstItem, attr);
        if (value != undefined) {
            if (type === 'num') {
                minmax[attr] = [value, value];
            } else if (type === 'str') {
                minmax[attr] = [value];
            } else {
                // ignore unknown type
            }
        }
    });

    const validAttrs = Object.keys(minmax);
    data.forEach( (dict, index) => {
        validAttrs.forEach( attr => {
            const type = types[attr];
            const value = get(dict, attr);
            const temp = minmax[attr];
            if (value != undefined) {
                if (type === 'num') {
                    temp[0] = Math.min(temp[0], value);
                    temp[1] = Math.max(temp[1], value);
                } else if (type === 'str') {
                    if (!temp.includes(value))
                       temp.push(value);
                } else {
                    // ignore unknown type
                }
            }
        });
        indexById[dict['_id']] = index;
    });

    //console.log(minmax)

    return {
        indexById,
        minmax
    };
}

export default (state, payload) => {
    const {
        total,
        sampleData,
        sampleList
    } = payload;

    const {
        attrTypes,
        attrKinds
    } = state;

    let numQueried = state.numQueried;

    const attrKeys = Object.keys(attrKinds);
    const dataBySamples = {};

    sampleList.forEach( (name, index) => {
        const {indexById, minmax} = calculateDataStat(sampleData[index], attrTypes, attrKeys);
        dataBySamples[name] = {
            data: sampleData[index],
            indexById,
            minmax
        };
    });

    numQueried = sampleList.length + numQueried;
    if (numQueried === total)
        numQueried = 0;

    //console.log('so far: ', numQueried, total)

    return {
        ...state,
        dataBySamples: {...state.dataBySamples, ...dataBySamples},
        numQueried
    }
}
