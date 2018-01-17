import { scaleLinear } from 'd3-scale';
import { 
    isArrayOfString
} from '../../utils';

export default (
    {
        dataExtents,
        attribute,
        dataExtentsPrev = {},
    },
    range
) => {
    const tempExtents = dataExtents[attribute];
    const name = tempExtents != null ? attribute: 'unknown';
    const ordinary = tempExtents != null
        ? isArrayOfString(tempExtents)
        : false;

    let extents = tempExtents == null
        ? [0, 1] 
        : ordinary 
            ?  [0, tempExtents.length]
            : tempExtents.slice();
    
    if (dataExtentsPrev && dataExtentsPrev[attribute]) {
        extents = dataExtentsPrev[attribute].slice();
    }

    const scale = scaleLinear()
                    .domain(extents)
                    .range(range);

    const step = ordinary ? Math.abs(scale(0) - scale(1)): 0;

    return {
        name,
        extents,
        ordinary,
        scale,
        step,
        origExtents: tempExtents == null ? [0, 1]: tempExtents.slice()
    }
}