handleAxisMove = (axisTitle, moveDist, e) => {
    if (!this.waitingForAxisMoveAnimationFrame) {
        this.waitingForAxisMoveAnimationFrame = true;
        this.__dimConfig = this.__dimConfig || this.state.dimConfig;
        this.__dimOrder = this.__dimOrder || this.state.xScale.domain();
        
        const state = this.axisMoveHelper(moveDist, axisTitle, this.__dimOrder);

        this.__dimConfig = state.dimConfig;
        this.__dimOrder = state.xScale.domain();
        //console.log(__dimOrder)

        this.axisMoveInProgress = true;

        this.triggerEvent('moveaxis', state, e);
        requestAnimationFrame(() => {
            this.waitingForAxisMoveAnimationFrame = false;
            this.clearThreeCanvas();
            this.draw({trigger: 'moveaxis'});
        });
    }
}

axisMoveHelper = (dx, axisToMove, initDimOrder, force = false) => {
    // as axis is moving...
    // 1. x position of axis changes, ok
    // 2. corresponding data changes
    // 3. if needed, swap location..
    const { 
        dimConfig: initDimConfig, 
    } = this.state;

    const newDimOrder = initDimOrder.map(title => {
        const { position } = initDimConfig[title];
        const newPosition = (title === axisToMove)
            ? position + dx
            : position;

        return {
            x: newPosition,
            id: title
        }
    }).sort((a,b) => a.x - b.x);

    const canvasDim = getCanvasDimension(this.props);
    const xScale = scalePoint()
                    .domain(newDimOrder.map(d => d.id))
                    .range([0, canvasDim.width])
                    .padding(0);
    

    const newDimConfig = {};
    newDimOrder.forEach( each => {
        const {x, id} = each;
        const prevConfig = initDimConfig[id];
        const { position } = prevConfig;

        const newPosition = (id === axisToMove && !force)
            ? x
            : xScale(id);

        newDimConfig[id] = {
            ...prevConfig,
            position: newPosition
        }
    });

    return {
        dimConfig: newDimConfig,
        xScale
    }
}


const state = this.axisMoveHelper(moveDist, axisTitle,this.__dimOrder, true);

        this.__dimConfig = null;
        this.__dimOrder = null;
        this.axisMoveInProgress = false;

        const {
            dimConfig,
            xScale
        } = state;
        this.triggerEvent('moveaxis', state, e);

        requestAnimationFrame(() => {
            this.clearAxesAndPCPOnCanvas();
            this.setState({
                dimConfig,
                xScale
            });
        });