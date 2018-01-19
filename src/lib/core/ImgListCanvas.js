import React from 'react';

import {
	dimension as getCanvasDimension,
	clearCanvas
} from './utils';

import {
	cursorStyle,
} from '../utils';

import ImgListCanvasContainer from './ImgListCanvasContainer';


class ImgListCanvas extends React.Component {
    constructor() {
        super();

        this.state = {
            shipImagesByID: {}
        };
        this.subscriptions = [];        
        

    }

    getCanvasContexts = () => {
    	if (this.canvasContainerNode)
    		return this.canvasContainerNode.getCanvas();
    }

    subscribe = (id, rest) => {
    	this.subscriptions = this.subscriptions.concat({
    		id,
    		...rest
    	});
    }

    unsubscribe = (id) => {
    	this.subscriptions = this.subscriptions.filter(each => each.id !== id);
    }
    
    updateSpriteSheetContents = () => {

    }

    updateSpriteSheet = (props = this.props) => {
        const {
            data
        } = props;

        const shipMargin = {
            left: 10,
            right: 10,
            top: 10, 
            bottom: 10
        };
        const shipDimension = getCanvasDimension({
            width: 1024,
            height: 1024,
            margin: shipMargin
        });
        const shipGap = {x: 5, y: 5};
        const shipImageWidth = 100;  // should keep aspect ratio of actual image
        const shipImageHeight = 100; // should keep aspect ratio of actual image

        // collect list info (id, timestamp, index) for all lists in the data
        // for each list... positioning (left-upper corner)        

        // for each list, copy image to the ship
        // if it doens't have yet, add to query list.. mark..
        // ... and fill with something else ?

        
        


       // console.log(data)
    }

    componentDidMount() {
        //console.log('componentDidMount');
        this.updateSpriteSheet();
    }

    componentWillReceiveProps(nextProp) {
        //console.log('componentReceiveProps');
        this.updateSpriteSheet(nextProp);
    }

    shouldComponentUpdate() {
        //console.log('shouldupdate')
        return true;
    }

    render () {
		const { margin } = this.props;
    	const divStyle = {
    		position: "relative",
    		width: this.props.width,
			height: this.props.height,
			//overflow: 'scroll',
    	};
    	const svgStyle = {
    		position: "absolute",
    		zIndex: (this.props.zIndex + 5)
		};
        const canvasDim = getCanvasDimension(this.props);
        const shared = {
            canvasDim,
            margin,
			width: this.props.width,
			height: this.props.height,
			ratio: this.props.ratio,
			subscribe: this.subscribe,
			unsubscribe: this.unsubscribe,
			getCanvasContexts: this.getCanvasContexts,
            ...this.state            
        }

        const cursor = cursorStyle(true);  
        
		const children = [];
		React.Children.forEach(this.props.children, child => {
			if (!React.isValidElement(child)) return;
			children.push(React.cloneElement(child,{shared}));
		});        

        return (
            <div
                style={divStyle}
                className={this.props.className}
            >
                <ImgListCanvasContainer 
                    ref={node => this.canvasContainerNode = node}
					width={this.props.width}
					height={this.props.height}
					ratio={this.props.ratio}
					zIndex={this.props.zIndex}                    
                />
                <svg
                    style={svgStyle}
                    className={this.props.className}
                    width={this.props.width}
                    height={this.props.height}
                >
                    {cursor}
                    <g transform={`translate(${margin.left},${margin.top})`}>
                        {/*ImgListEventHandler*/}
                        <g>
                            {children}
                        </g>
                    </g>
                </svg>
            </div>
        );
    }
}

export default ImgListCanvas;