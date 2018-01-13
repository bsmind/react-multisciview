resetChart = (props = this.props) => {
    const {
        dimName,
        dimExtents,
        dimAccessor,
        data,
        colorAccessor,
        axisWidth,
        margin
    } = props;

    const canvasDim = getCanvasDimension(props);
    const xScale = scalePoint()
                    .domain(dimName)
                    .range([0, canvasDim.width])
                    .padding(0);
    
    //console.log(xScale.domain())
    // getDimConfig
    const dimConfig = {}; 
    dimName.forEach(name => {
        let axisExtents = dimAccessor(dimExtents, name);
        if (axisExtents == null) {
            axisExtents = [0, 1];
        //     accessor = d => null;
        }

        const ordinary = isArrayOfString(axisExtents);

        const yScale = scaleLinear();
        const domain = ordinary ? [0, axisExtents.length] : axisExtents;
        yScale.domain(domain)
              .range([canvasDim.height, 0]);

        const yStep = ordinary ? Math.abs(yScale(0) - yScale(1)) : 0;
        dimConfig[name] = {
            title: name,
            extents: axisExtents,
            ordinary,
            scale: yScale,
            step: yStep,
            active: true,
            flip: false,
            position: xScale(name),
            axisWidth,
            accessor: d => d[name],
            nullPositionY: canvasDim.height + margin.bottom/2
        }
    });
    // end of getDimConfig

    // calculateDataFromNewDimConfig
    const plotData = data.map(d => {
        const flattened = {};
        dimName.forEach(name => {
            flattened[name] = dimAccessor(d, name);
        });
        flattened.stroke = colorAccessor(d);
        return flattened;
    });
    // end

    //this.fullData = plotData;
    return {
        xScale,
        dimConfig,
        plotData
    }
}
