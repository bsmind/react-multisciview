export default (
	array,
	value,
	accessor
) => {
	let lo = 0, hi = array.length - 1;
	while (hi - lo > 1) {
		const mid = Math.round((lo + hi) / 2);
		if (accessor(array[mid]) <= value) {
			lo = mid;
		} else {
			hi = mid;
		}
	}

	if (accessor(array[lo]) < value && accessor(array[hi]) < value) lo = hi;
	if (accessor(array[lo]) > value && accessor(array[hi]) > value) hi = lo;

	return { left: lo, right: hi };
};