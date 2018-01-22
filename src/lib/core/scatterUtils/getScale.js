import { scaleLinear } from 'd3-scale';
import { isArrayOfString } from '../../utils';

/**
 * determine extents of selected attribute
 * 
 * dataExtents: extents of all attributes
 * attribute: selected attribute
 * dataExtentsPrev: previous extents of all attributes
 * 
 * Defulat: 
 * - name: 'unknown'
 * - ordinary: false
 * - scale: scaleLinear().domain(extents).range(range)
 * - step: 0
 * - extents: [0, 1]      - full numeric extents
 * - origExtents: [0, 1]  = full numeric or ordinary extents
 */
export default (
    {
        dataExtents,
        attribute,
        dataExtentsPrev = {},
    },
    range
) => {
    const tempExtents = dataExtents[attribute];
    let name = 'unknown', ordinary = false, extents = [0, 1], origExtents = [0, 1];
    let extentsToUse = [0, 1];
    if (tempExtents) {
        name = attribute;
        ordinary = isArrayOfString(tempExtents);
        extents = ordinary ? [0, tempExtents.length]: tempExtents.slice();
        origExtents = tempExtents.slice();
        extentsToUse = extents.slice();
    }
    
    if (dataExtentsPrev && dataExtentsPrev[attribute]) {
        extentsToUse = dataExtentsPrev[attribute].slice();
    }

    const scale = scaleLinear().domain(extentsToUse).range(range);
    const step = ordinary ? Math.abs(scale(0) - scale(1)): 0;
                    
    return {
        name,     
        scale,        
        ordinary,
        extents,
        // only for ordinary
        step,
        origExtents
    }
}