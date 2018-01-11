resetChart = (props = this.props) => {
    // *** const state = calculateState(props);
    const dir = xDirection(props.xFlip);
    const dim = dimension(props);

    const {
        extents: xExtents, 
        stepEnabled: xStepEnabled
    } = getExtents(props.data, props.xAccessor, props.xExtents);
    
    const { dataFilter } = evaluator(props.clamp, xStepEnabled);
    const { plotData, domain } = dataFilter(
        props.data,
        xExtents,
        props.xAccessor,
    );

    const xScale = setXRange(props.xScale.copy(), dim.width, props.xPadding, dir);
    xScale.domain(domain);

    const xStep = xStepEnabled ? Math.abs(xScale(0) - xScale(1)): 0;
    
    const chartConfig = getChartConfigWithUpdatedYScale(
        getChartConfig(dim, props.children),
        plotData,
        true
    );

    return {
        plotData,
        xScale,
        xExtents,
        xStep,
        xStepEnabled,
        chartConfig,
        dataFilter
    };		
}