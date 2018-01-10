import { getClosestItemIndexes } from "../../utils";

export default function(clamp, stepEnabled) {
	return dataFilterWrapper(clamp, stepEnabled);
}

function dataFilterWrapper(clamp, stepEnabled) {
	function dataFilter(
		data,
		inputDamain,
		xAccessor
	) {
		let left = stepEnabled ? Math.floor( inputDamain[0] ) : inputDamain[0],
			right = stepEnabled ? Math.ceil( inputDamain[1] ) : inputDamain[1];

		if (clamp === 'left' || clamp === 'both' || clamp === true) {
			left = Math.max(left, xAccessor(data[0]));
		}	

		if (clamp === 'right' || clamp === 'both' || clamp === true) {
			const maxRight = xAccessor(data[data.length-1])
				+ (stepEnabled ? 1: 0);
			right = Math.min(right, maxRight);
			if (right <= left) right = left + 1;
		}

		return { 
			plotData: getFilteredData(data, left, right, xAccessor), 
			domain: [left, right] 
		};
	}

	return { dataFilter };
}

function getFilteredData(data, left, right, xAccessor) {
	const newLeftIndex = getClosestItemIndexes(data, left, xAccessor).left;
	const newRightIndex = getClosestItemIndexes(data, right, xAccessor).right;
	const fData = data.slice(newLeftIndex, newRightIndex + 1);
	//console.log(newLeftIndex, newRightIndex, left, right, fData)
	return fData;
}
