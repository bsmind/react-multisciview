import { getClosestItemIndexes } from "../../utils";

export default function({
	xScale,
	useWholeData,
	clamp,
	pointsPerPxThreshold,
	minPointsPerPxThreshold
}) {
	return dataFilterWrapper(
		useWholeData || (xScale.invert == null),
		clamp,
		pointsPerPxThreshold,
		minPointsPerPxThreshold
	);
}

function dataFilterWrapper(
	useWholeData,
	clamp,
	pointsPerPxThreshold,
	minPointsPerPxThreshold,
) {
	function dataFilter(
		data,
		inputDamain,
		xAccessor,
		initialXScale,
		{
			currentPlotData,
			currentDomain,
			fallbackStart,
			fallbackEnd
		} = {}
	) {
		if (useWholeData) {
			return { plotData: data, domain: inputDamain };
		}

		let left = inputDamain[0],
			right = inputDamain[1],
			clampedDomain = inputDamain,
			fData = getFilteredData(data, left, right, xAccessor);

		if (fData.length === 1 && fallbackStart) {
			console.log("dataFilter::too few data, fall back ??");
			// left = fallbackStart;
			// right = getNewEnd(fallbackEnd, xAccessor, initialXScale, left);
			// cDomain = [left, right];
			// fData = getFilteredResponse(data, left, right, xAccessor);
		}

		if (clamp === "left" || clamp === "both" || clamp === true) {
			cDomain = [
				Math.max(left, xAccessor(data[0])),
				cDomain[1]
			];
		}

		if (clamp === "right" || clamp === "both" || clamp === true) {
			cDomain = [
				cDomain[0],
				Math.min(right, xAccessor(data[data.length - 1]))
			];
		}

		// const newDomain = cDomain;
		// const newScale = initialXScale.copy().domain(newDomain);
		// const width = Math.floor(
		//     xScale(xAccessor(fData[fData.length - 1])) -
		//     xScale(xAccessor(fData[0]));
		// );
		// check.. if..

		return { plotData: fData, domain: clampedDomain };
	}

	return { dataFilter };
}

function getFilteredData(data, left, right, xAccessor) {
	const newLeftIndex = getClosestItemIndexes(data, left, xAccessor).left;
	const newRightIndex = getClosestItemIndexes(data, right, xAccessor).right;
	const fData = data.slice(newLeftIndex, newRightIndex + 1);
	return fData;
}
