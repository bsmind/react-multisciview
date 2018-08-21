import { createSelector } from "reselect";
import { colorInterpolators, getColorInterpolator, rgbToDigit, hexToRgb } from "../utils/index";
import { range as d3Range } from 'd3-array';
import { scaleLinear } from 'd3-scale';

export const getSelectedSamples = createSelector(
    [state => state.data.dataBySamples],
    (dataBySamples) => {
        return Object.keys(dataBySamples);
    }
); 

export const getSelectedSamplesCounts = createSelector(
    [
        state => state.data.dataBySamples,
        getSelectedSamples,
    ],
    (dataBySamples, keys) => {
        return keys.map(key => dataBySamples[key].length);
    }
); 


const _update_data_stat = (doc, stat={}) => {
    const fields = Object.keys(doc).filter(f => {
        return (!f.includes("_id") && !f.includes("item") && !f.includes("tiff") && !f.includes("jpg"));
    });

    for (let i=0; i<fields.length; i++) {
        const field = fields[i];
        const value = doc[field];
        const value_type = typeof value;
        if (stat[field]) {
            if (value_type == 'string') {
                if (stat[field].indexOf(value) == -1) stat[field].push(value);
            }
            else {
                stat[field][0] = Math.min(stat[field][0], value);
                stat[field][1] = Math.max(stat[field][1], value);
            } 
        } else {
            if (value_type == 'string') stat[field] = [value];
            else stat[field] = [value, value];
        }
    }
}

export const getDataStat = createSelector(
    [state => state.data.dataBySamples],
    (dataBySamples) => {
        const stat = {};
        Object.keys(dataBySamples).forEach(sampleName => {
            const data = dataBySamples[sampleName];
            data.forEach(doc => _update_data_stat(doc, stat));
        });
        return stat;
    }
);

export const getDataAttr = createSelector(
    [getDataStat],
    (stat) => {
        return Object.keys(stat);
    }
);

export const getDataArray = createSelector(
    [state => state.data.dataBySamples],
    (dataBySamples) => {
        let data = [];
        Object.keys(dataBySamples).forEach(key => {
            const cp = dataBySamples[key].map(d => ({...d}));
            data = data.concat(cp);
        });
        return data;
    }
);

const _update_colorDomain = (minDomain, maxDomain, scheme={}) => {
    let colorDomain = scheme.colorDomain;
    if (colorDomain == null) {
        colorDomain = [minDomain, maxDomain];
    } else {
        let left = colorDomain[0], right = colorDomain[1];
        if (left < minDomain || left > maxDomain) left = minDomain;
        if (right > maxDomain || right < minDomain) right = maxDomain;
        if (left > right) {const temp = left; left = right; right = temp;}
        colorDomain = [left, right];
    }
    scheme['colorDomain'] = colorDomain;
}

export const getScatterColorScheme = createSelector(
    [
        state => state.data.scatterColorSchemes,
        state => state.data.scatterColorOpacity,
        state => state.data.attrz,
        getDataStat,
    ],
    (colorSchemes, opacity, attrz, stat) => {
        const default_scheme = {
            type: 'Viridis',
            minDomain: 0,
            maxDomain: 10,
            colorDomain: [0, 10],
            opacity: 1,
            active: false,
            ordinary: false,
            reverse: false
        };
        const tempExtents = stat[attrz];
        let minDomain = tempExtents && attrz !== 'sample' ? tempExtents[0]: 0;
        let maxDomain = tempExtents && attrz !== 'sample' ? tempExtents[1]: 10;
        const tempScheme = colorSchemes[attrz] ? colorSchemes[attrz]: {};

        // This may happen when all values for the selected attribute are same.
        // If minDomain is equal to maxDomain, it will cause error in compuing
        // scale in d3.
        if (Math.abs(maxDomain - minDomain) < 1e-12) {
            minDomain = minDomain - 1;
            maxDomain = maxDomain + 1;
        }

        _update_colorDomain(minDomain, maxDomain, tempScheme);

        if (tempExtents == null || attrz === 'sample') {
            return {...default_scheme, ...tempScheme, minDomain, maxDomain}
        } 
        return {...default_scheme, ...tempScheme, minDomain, maxDomain, active:true, ordinary:false}
    }
);

export const getImageColorInterpolator = createSelector(
	[
		state => state.data.imgColorScheme,
		state => state.data.imgColorMap
	],
	(
		colorScheme,
		colorMap
	 ) => {
		if (colorScheme === 'Custom') {
			const interpolator = colorMap == null
				? getColorInterpolator('Viridis')
				: t => {
					return colorMap(t * 255);
				}
			return interpolator;
		} else {
			return getColorInterpolator(colorScheme);
		}
	}
);

export const getImageColorTable = createSelector(
	[
		state => state.data.imgMinDomain,
		state => state.data.imgMaxDomain,
		state => state.data.imgDomain,
		//state => state.data.imgColorScheme
		getImageColorInterpolator
	],
	(
		minDomain,
		maxDomain,
		domain,
		imageColorInterpolator
	) => {
		const R = d3Range(256), G = d3Range(256), B = d3Range(256);
		if (domain == null) {
			return {
				R: R.map(v => v/255),
				G: G.map(v => v/255),
				B: B.map(v => v/255)
			}
		}
		const imgScale = scaleLinear().domain([minDomain, maxDomain]).range([0, 255]);
		const iDomain = domain.map(v => {
			return Math.floor(imgScale(v));
		});
		const iDomainWidth = iDomain[1] - iDomain[0];
		const interpolator = imageColorInterpolator;//getColorInterpolator(colorScheme);

		for (let i=0; i< 256; ++i) {
			let t;
			if (i < iDomain[0]) t = 0; 
			else if (i > iDomain[1]) t = 1; 
			else t = (i - iDomain[0]) / iDomainWidth;

			const rgb = interpolator(t);
			const rgbDigits = rgbToDigit(rgb);
			if (rgbDigits == null) {
				const rgbFromHex = hexToRgb(rgb);
				R[i] = rgbFromHex.r / 255;
				G[i] = rgbFromHex.g / 255;
				B[i] = rgbFromHex.b / 255;
			} else {
				R[i] = rgbDigits[0] / 255;
				G[i] = rgbDigits[1] / 255;
				B[i] = rgbDigits[2] / 255;	
			}
		}
		return {R, G, B};
	}
);

export const getSelectedSampleColors = createSelector(
    [
        getSelectedSamples,
        state => state.data.sampleColors
    ],
    (selectedSamples, sampleColors) => {
        const selectedSampleColors = {};
        selectedSamples.forEach(samplename => {
            selectedSampleColors[samplename] = sampleColors[samplename]
        });
        return selectedSampleColors;
    }
);

// deprecated (not used for v2)
export const datatab_get_sample_status = createSelector(
    [
        state => state.data.statBySamples,
        getSelectedSamples
    ],
    (statBySamples, sampleSelected) => {
        const sampleKinds = {}, sampleSelectedByIndex = [];
        Object.keys(statBySamples).forEach((key, idx) => {
            const count = statBySamples[key];
            const idxstr = idx.toString();
            sampleKinds[idxstr] = `[${count}]: ${key}`;
            if (sampleSelected.indexOf(key) >= 0)
                sampleSelectedByIndex.push(idxstr)
        });
        return {sampleKinds, sampleSelectedByIndex};
    }
)

export const coordtab_get_dataattr = createSelector(
    [
        getDataAttr,
        state => state.data.attrx,
        state => state.data.attry,
        state => state.data.attrz,
    ],
    (dataAttrState, attrx, attry, attrz) => {
        const dataAttr = {};
        dataAttrState.forEach((attr, index) => dataAttr[index.toString()] = attr);

        const x = dataAttrState.indexOf(attrx).toString();
        const y = dataAttrState.indexOf(attry).toString();
        const z = dataAttrState.indexOf(attrz).toString();
        return {
            dataAttr,
            attr: {x, y, z}
        }
    }
);

export const pcptab_get_dimorder = createSelector(
    [
        state => state.data.pcpSelectedAttrs,
        getDataAttr
    ],
    (selectedAttrs, allAttrs) => {
        const attrs = [];
        selectedAttrs.forEach(attr => {
            if (allAttrs.indexOf(attr) >= 0)
                attrs.push(attr)
        });
        return attrs;
    }
);
