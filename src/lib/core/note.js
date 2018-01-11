const {
    dimName, 
    dimExtents,
    dimAccessor,
    margin, width, height, ratio} = this.props;
const canvasDim = getCanvasDimension(this.props);

const xScale = scalePoint()
                .domain(dimName)
                .range([0, canvasDim.width])
                .padding(0);

const shared = {
    margin,
    ratio,

    chartWidth: canvasDim.width,
    chartHeight: canvasDim.height,


    subscribe: this.subscribe,
    unsubscribe: this.unsubscribe,
    getCanvasContexts: this.getCanvasContexts
}

//console.log(this.props.dimension)


const yScaleList = {};
const pcpYAxisList = dimName.map(name => {
    const axisExtents = dimAccessor(dimExtents, name);            
    const ordinary = isArrayOfString(axisExtents);

    let yScale, yStep;
    if (ordinary) {
        yScale = scalePoint()
                    .domain(axisExtents)
                    .range([canvasDim.height, 0])
                    .padding(0);

        yStep = yScale.step();//Math.abs(yScale(0) - yScale(1));
    } else {
        yScale = scaleLinear()
                    .domain(axisExtents)
                    .range([canvasDim.height, 0]);
        yStep = 0;
    }
    yScaleList[name] = {yScale, yStep};


    return (
        <PCPYAxis key={`pcp-yaxis-${name}`}
            title={name}
            axisLocation={xScale(name)}
            extents={dimAccessor(dimExtents, name)}
            axisWidth={25}
            height={canvasDim.height}
            orient={'left'}
            ordinary={isArrayOfString(axisExtents)}
            shared={shared}
        />
    );
});

//console.log(yScaleList)

//console.log('PCPCanvas: ', this.props);
return (
    <div
        style={divStyle}
        className={""}
    >
        <CanvasContainer
            ref={node => this.canvasContainerNode = node}
            ratio={this.props.ratio}
            width={width}
            height={height}
            zIndex={1}
        />
        <svg
            className={""}
            width={width}
            height={height}
            style={svgStyle}
        >
            <g transform={`translate(${margin.left},${margin.top})`}>
                {/* <EventHandler /> */}
                <g>
                    {pcpYAxisList}
                    <PCPPolyLineSeries 
                        data={this.props.data}
                        dimName={this.props.dimName}
                        dimExtents={this.props.dimExtents}
                        dimAccessor={this.props.dimAccessor}
                        shared={shared}

                        xScale={xScale}
                        yScaleList={yScaleList}
                        yAccessor={this.props.yAccessor}
                    />
                </g>
            </g>
        </svg>
    </div>
);
}