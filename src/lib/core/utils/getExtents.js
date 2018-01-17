import { 
    functor,
    isArrayOfString 
} from '../../utils';
import {
    extent as d3Extent
} from 'd3-array';

export default (
    data,
    accessor,
    inputExtents
) => {
    let extents, stepEnabled = false;
    if (inputExtents == null) {
        extents = [0, 1];
    }
    else if (typeof inputExtents === 'function')
        extents = inputExtents(data);
    else if (isArrayOfString(inputExtents)) {
        extents = [0, inputExtents.length];
        stepEnabled = true;
    } else 
        extents = d3Extent(inputExtents.map(d => functor(d)).map(each => {
            return each(data, accessor);
        }));

    return {
        extents,
        stepEnabled
    }
}