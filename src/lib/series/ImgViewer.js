import React from "react";
import PropTypes from "prop-types";
import { scaleLinear } from "d3-scale";

class ImgViewer extends React.Component {
	constructor() {
		super();
		this.state = {
			img: null,
			id: null
		};
	}

	componentDidMount() {
		const { imgPool, id } = this.props;
		if (imgPool && imgPool[id]) {
			this.setState({ id, img: imgPool[id] });
		}
		if (this.props.onImageRequest) {
			this.props.onImageRequest(id, 5);
		}
	}

	componentWillReceiveProps(nextProps) {
		const { imgPool, id, onImageRequest } = nextProps;
		const oldId = this.state.id;
		if (oldId && id === oldId) {
			return;
		}
		if (imgPool && imgPool[id]) {
			this.setState({ id, img: imgPool[id] });
			return;
		}
		if (onImageRequest) {
			onImageRequest(id, 5);
		}
		this.setState({ id: null, img: null });
	}

    getImgSize = (side) => {
    	const { img } = this.state;
    	let width, height;
    	if (img.width >= img.height) {
    		width = side;
    		height = (img.height / img.width) * side;
    	} else {
    		height = side;
    		width = (img.width / img.height) * side;
    	}
    	return { width, height };
    }

    renderImage = () => {
		const { imgRefWidth, imgRefHeight, x, y, id, imageFilter, onImageClick } = this.props;
    	const { backgroundRectRef } = this.props;
    	const imgWidth = imgRefWidth ? imgRefWidth : imgRefHeight;
    	const imgHeight = imgRefHeight ? imgRefHeight : imgRefWidth;
		const imgSide = Math.min(imgWidth, imgHeight);
		const clickCallback = onImageClick ? onImageClick: () => {};

    	if (this.state.img == null || this.state.img.url == null || this.state.id == null) {
			if (backgroundRectRef) {
				return <g> 
					{React.cloneElement(backgroundRectRef, {
					key: `imgViewer-empty-${id}`,
					x: x - imgSide / 2,
					y: y - imgSide / 2,
					width: imgSide,
					height: imgSide,
					onClick: e => clickCallback(id, e)
				})} 
					<line 
						x1={x - imgSide / 2 + 5} 
						y1={y - imgSide / 2 + 5} 
						x2={x + imgSide / 2 - 5} 
						y2={y + imgSide / 2 - 5} 
						stroke={'#000000'}
						strokeWidth={5}
						strokeLinecap={'round'}
					/>
					<line 
						x1={x - imgSide / 2 + 5} 
						y1={y - imgSide / 2 + 5} 
						x2={x + imgSide / 2 - 5} 
						y2={y + imgSide / 2 - 5} 
						stroke={'#ffffff'}
						strokeWidth={2}
						strokeLinecap={'round'}
					/>					
				</g>
			} else {
				return <g><rect 
					x={x - imgSide/2}
					y={y - imgSide/2}
					width={imgSide}
					height={imgSide}
					fill='#000000'
					fillOpacity={0.3}
					onClick={e => clickCallback(id, e)}
				/>
					<line 
						x1={x - imgSide / 2 + 5} 
						y1={y - imgSide / 2 + 5} 
						x2={x + imgSide / 2 - 5} 
						y2={y + imgSide / 2 - 5} 
						stroke={'#000000'}
						strokeWidth={5}
						strokeLinecap={'round'}
					/>
					<line 
						x1={x - imgSide / 2 + 5} 
						y1={y - imgSide / 2 + 5} 
						x2={x + imgSide / 2 - 5} 
						y2={y + imgSide / 2 - 5} 
						stroke={'#ffffff'}
						strokeWidth={2}
						strokeLinecap={'round'}
					/>									
				</g>;
			}
    	}

		//console.log(imageFilter)
    	const { width, height } = this.getImgSize(imgSide);
    	return <g>
			{backgroundRectRef && 
				React.cloneElement(backgroundRectRef, {
					key: `imgViewer-bg-${id}`,
					x: x - width / 2 - 1,
					y: y - height / 2 - 1,
					width: width + 2,
					height: height + 2
    		})}
    		<image
				ref={node => this.node = node}
				filter={`url(#${imageFilter})`}
    			xlinkHref={this.state.img.url}
    			x={x - width / 2}
    			y={y - height / 2}
    			width={width}
    			height={height}
				imageRendering={"pixelated"}
				onClick={e => clickCallback(id, e)}
    		/>
    	</g>;
    }

    renderGrid = () => {
    	if (!this.props.showGrid || this.state.img == null) return;

    	const { imgRefWidth, imgRefHeight, x, y, svgDim } = this.props;
    	const imgWidth = imgRefWidth ? imgRefWidth : imgRefHeight;
    	const imgHeight = imgRefHeight ? imgRefHeight : imgRefWidth;
    	const imgSide = Math.min(imgWidth, imgHeight);

    	const { width, height } = this.getImgSize(imgSide);
    	const { img, id } = this.state;

    	const xScale = scaleLinear().domain([0, img.width]).range([0, width]);
    	const cx = x;
    	const dx = xScale(1);
    	const sx = cx - width / 2;
    	const ex = cx + width / 2;
    	const boundX = [Math.max(sx, 0), Math.min(ex, svgDim.width)];
    	const start_ix = Math.floor((boundX[0] - sx) / dx);
    	const end_ix = img.width - Math.ceil((ex - boundX[1]) / dx);

    	const yScale = scaleLinear().domain([0, img.height]).range([0, height]);
    	const cy = y;
    	const dy = yScale(1);
    	const sy = cy - height / 2;
    	const ey = cy + height / 2;
    	const boundY = [Math.max(sy, 0), Math.min(ey, svgDim.height)];
    	const start_iy = Math.floor((boundY[0] - sy) / dy);
    	const end_iy = img.height - Math.ceil((ey - boundY[1]) / dy);

    	const lineStyleVertical = {
    		stroke: "#000000",
    		strokeWidth: 1,
    		y1: boundY[0],
    		y2: boundY[1]
    	};
    	const lineStyleHorizontal = {
    		stroke: "#000000",
    		strokeWidth: 1,
    		x1: boundX[0],
    		x2: boundX[1]
    	};
    	const textStyle = {
    		fontFamily: "Roboto, sans-serif",
    		fontSize: Math.min(dx, dy) / 5,
    		textAnchor: "start",
    		fill: "black"
    	};

    	const grids = [];
    	let needToDrawVerticalLine = true;
    	for (let iy = start_iy; iy <= end_iy; ++iy) {
    		const yy = sy + iy * dy;
    		grids.push(<line
    			key={`${id}-h-${iy}`}
    			y1={yy}
    			y2={yy}
    			{...lineStyleHorizontal}
    		/>);

    		for (let ix = start_ix; ix <= end_ix; ++ix) {
    			const xx = sx + ix * dx;

    			if (iy < img.height && ix < img.width) {
    				grids.push(<text
    					key={`${id}-text-${ix}-${iy}`}
    					x={xx + dx / 6}
    					y={yy + dy / 3}
    					{...textStyle}
    				>
    					{img.data[iy][ix]}
    				</text>);
    			}

    			if (needToDrawVerticalLine)
    				grids.push(<line
    					key={`${id}-v-${ix}`}
    					x1={xx}
    					x2={xx}
    					{...lineStyleVertical}
    				/>);
    		}
    		needToDrawVerticalLine = false;
    	}

    	return grids;
    }

    render() {
    	return <g>
    		{this.renderImage()}
    		{this.renderGrid()}
    	</g>;
    }
}

ImgViewer.propTypes = {
	imgPool: PropTypes.object,
	id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
	onImageRequest: PropTypes.func,
	imgRefHeight: PropTypes.number,
	imgRefWidth: PropTypes.number,
	x: PropTypes.number,
	y: PropTypes.number,
	backgroundRectRef: PropTypes.node,
	showGrid: PropTypes.bool,
	svgDim: PropTypes.shape({
		width: PropTypes.number,
		height: PropTypes.number
	})
};

export default ImgViewer;