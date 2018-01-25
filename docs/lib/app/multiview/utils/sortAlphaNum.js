export default function sortAlphaNum(a, b) {
	const reA = /[^A-Z]/g;
	const reN = /[^0-9]/g;

	const aA = a.toUpperCase().replace(reA, "");
	const bA = b.toUpperCase().replace(reA, "");

	// console.log('aA', aA)
	// console.log('bA', bA)

	if (aA === bA) {
		const aN = parseInt(a.replace(reN, ""), 10);
		const bN = parseInt(b.replace(reN, ""), 10);

		// console.log('aN', aN);
		// console.log('bN', bN);
		return aN === bN ? 0 : aN > bN ? 1 : -1;
	}
	return aA > bA ? 1 : -1;
}
