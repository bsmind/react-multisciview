import { SHORT_KEY_MAX_LEN } from "../../constants";
import get from "lodash.get";

// deprecated
const calculateDataStatAll = (data, types, attrs) => {
	const indexById = {}, minmax = {};

	data.forEach( (dict, index) => {
		attrs.forEach( attr => {
			const type = types[attr];
			const value = get(dict, attr);

			if (minmax[attr] == null) {
				if (value != null) {
					if (type === "num") {
						minmax[attr] = [value, value]; // eslint-disable-line
					} else if (type === "str") {
						minmax[attr] = [value]; // eslint-disable-line
					} else {
						// ignore unknown type
					}
				}
			} else {
				const temp = minmax[attr];
				if (value != null) {
					if (type === "num") {
						temp[0] = Math.min(temp[0], value); // eslint-disable-line
						temp[1] = Math.max(temp[1], value); // eslint-disable-line
					} else if (type === "str") {
						if (!temp.includes(value))
							temp.push(value);
					} else {
						// ignore unknown type
					}
				}
			}
		});
		indexById[dict["_id"]] = index; // eslint-disable-line
	});

	return {
		indexById,
		minmax
	};
};

export const calDataStat = (data) => {
	const minmax = {}
	data.forEach( (dict, index) => {
		Object.keys(dict).forEach(function(key) {
			if (!(key.includes('tiff') || key.includes('jpg') || 
				  key.includes('_id') || key.includes('item') || 
				  key.includes('sample'))
				) 
			{
				const value = get(dict, key)
				if (typeof value === 'number') {
					const temp = get(minmax, key, null)
					if (temp == null) {
						minmax[key] = [value, value]
					} else {
						temp[0] = Math.min(temp[0], value)
						temp[1] = Math.max(temp[1], value)
					}
				}
			}
		});
	});
	return minmax
}

export function shortKey(key) {
	const tokens = key.split("/");

	let attrShort = tokens[tokens.length - 1];
	if (tokens.length > 1) {
		let prefix = "";
		for (let i = 0; i < tokens.length - 1; ++i) {
			prefix = (prefix.length)
				? prefix + "/" + tokens[i].substr(0, SHORT_KEY_MAX_LEN)
				: tokens[i].substr(0, SHORT_KEY_MAX_LEN);
		}
		attrShort = prefix + "/" + attrShort;
	}
	return attrShort
}


export default (state, payload) => {
	const {
		total,
		sampleData,
		sampleList
	} = payload;

	console.log(sampleData, sampleList)

	let numQueried = state.numQueried;
	const attrKinds = {...state.attrKinds};

	const dataBySamples = {};
	sampleList.forEach( (name, index) => {
		const minmax = calDataStat(sampleData[index]);
		dataBySamples[name] = {
			data: [...sampleData[index]],
			minmax
		}
		Object.keys(minmax).forEach(key => {
			if (!(key in attrKinds)) {
				attrKinds[key] = key
				//attrKinds[shortKey(key)] = key;
				//attrKinds[key] = shortKey(key)
			}
		})
	});

	numQueried = sampleList.length + numQueried;
	if (numQueried === total)
		numQueried = 0;

	return {
		...state,
		dataBySamples: { ...state.dataBySamples, ...dataBySamples },
		attrKinds,
		numQueried
	};
};
