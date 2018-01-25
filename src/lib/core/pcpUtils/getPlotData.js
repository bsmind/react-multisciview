export default ({
	data,
	dimName,
	dimAccessor,
	colorAccessor
}) => {
	return data.map(d => {
		const flattened = {}; // eslint-disable-line
		dimName.forEach(name => {
			flattened[name] = dimAccessor(d, name); // eslint-disable-line
		});
		flattened.stroke = colorAccessor(d); // eslint-disable-line
		return flattened;
	});
};