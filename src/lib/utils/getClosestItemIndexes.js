export default (
	array,
	value,
	accessor
) => {
	let lo = 0, hi = array.length - 1;
	while (hi - lo > 1) {
		const mid = Math.round((lo + hi) / 2);
		const midValue = accessor(array[mid]);

		if (midValue <= value) {
			lo = mid;
		} else {
			hi = mid;
		}
	}

	// if (accessor(array[lo]) < value && accessor(array[hi]) < value) lo = hi;
	// if (accessor(array[lo]) > value && accessor(array[hi]) > value) hi = lo;

	while (lo >= 1 && accessor(array[lo]) === accessor(array[lo-1])) lo -= 1;
	while (hi <= array.length-2 && accessor(array[hi]) === accessor(array[hi+1])) hi += 1;

	lo = Math.max(lo, 0);
	hi = Math.min(hi, array.length-1);
	return { left: lo, right: hi };
};
