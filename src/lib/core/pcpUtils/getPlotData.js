export default ({
    data,
    dimName,
    dimAccessor,
    colorAccessor
}) => {
    return data.map(d => {
        const flattened = {};
        dimName.forEach(name => {
            flattened[name] = dimAccessor(d, name);
        });
        flattened.stroke = colorAccessor(d);
        return flattened;
    });
}