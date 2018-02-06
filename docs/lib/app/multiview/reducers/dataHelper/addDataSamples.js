import get from "lodash.get";

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

	// console.log('reducer: ', sampleData, sampleList)
	let numQueried = state.numQueried;

	const attrKeys = Object.keys(attrKinds);
	const dataBySamples = {};

	sampleList.forEach( (name, index) => {
		const { indexById, minmax } = calculateDataStatAll(sampleData[index], attrTypes, attrKeys);
		dataBySamples[name] = { // eslint-disable-line
			data: [...sampleData[index]],
			indexById,
			minmax
		};
	});

	numQueried = sampleList.length + numQueried;
	if (numQueried === total)
		numQueried = 0;

	// console.log('so far: ', numQueried, total)

	//console.log(dataBySamples)

	return {
		...state,
		dataBySamples: { ...state.dataBySamples, ...dataBySamples },
		numQueried
	};
};
