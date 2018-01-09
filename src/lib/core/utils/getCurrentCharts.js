export default (chartConfig, mouseXY) => {
    return chartConfig.filter(config => {
        const top = config.origin.y;
        const bottom = top + config.height;
        return (mouseXY[1] > top && mouseXY[1] < bottom);
    }).map(config => config.id);
}
