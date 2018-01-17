import { scaleLinear } from 'd3-scale';
import { 
    isArrayOfString
} from '../../utils';

export default (
    {
        dataExtents,
        attribute
    },
    range
) => {
    const name = dataExtents[attribute] ? attribute: 'unknown';
    const extents = dataExtents[attribute] ? dataExtents[attribute]: [0, 1];
    const ordinary = isArrayOfString(extents);
    const domain = ordinary ? [0, extents.length]: extents;
    const scale = scaleLinear()
                    .domain(domain)
                    .range(range);
    const step = ordinary ? Math.abs(scale(0) - scale(1)): 0;
    return {
        name,
        extents,
        ordinary,
        scale,
        step
    }
}