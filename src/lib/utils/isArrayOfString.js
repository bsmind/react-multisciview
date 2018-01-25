export default (arr) => {
	if (Array.isArray(arr) && arr.every(d => typeof d === "string")) {
		return true;
	}
	return false;
};
