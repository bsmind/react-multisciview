export default (
    dimName,
    initialDimOrder = []
) => {
    dimName.forEach(name => {
        if (initialDimOrder.indexOf(name) === -1)
            initialDimOrder.push(name);
    });

    return initialDimOrder.map(name => {
        if (dimName.indexOf(name) >= 0)
            return name;
    }).filter(each => each != undefined);
}