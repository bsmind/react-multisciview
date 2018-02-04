import React from "react";
import PropTypes from "prop-types";
import { SubscriberExt } from "../core";
import { hexToRGBA } from "../utils";

class DataBox extends React.Component {
    drawInfo = (ctx, info, x, y) => {
    	const { hint } = this.props;

    	const fontSize = Math.floor(7);
    	const fontFamily = "Roboto, sans-serif";
    	const lineHeight = Math.floor(fontSize * 2);

    	let textY = y;
    	ctx.font = `${fontSize}px ${fontFamily}`;
    	ctx.fillStyle = hexToRGBA("#000000", 0.8);
    	info.forEach( line => {
    		if (hint.indexOf(line.key) === -1) return;
    		const text = line.key + " : " + line.value;
    		ctx.fillText(text, x, textY);
    		textY += lineHeight;
    	});
    }

    drawImage = (ctx, imgData, x, y) => {
    	if (imgData == null) {
    		return;
    	}

		/*eslint-disable */
		console.log(imgData)
    	const img = new Image; 
    	img.onload = () => {
    		ctx.drawImage(img, x, y, 100, 100);
    	};
		img.src = imgData.url;
		/* eslint-enable */
    }

    draw = (ctx, moreProps) => {
    	if (moreProps.mouseXY == null ||
            moreProps.mouseXY.x == null ||
            moreProps.mouseXY.y == null ||
            moreProps.mouseXY.info == null) {
    		return;
    	}

    	const { x, y, info, id } = moreProps.mouseXY;
    	const { infoSortor } = this.props;
    	const { imgPool, ratio, margin, canvasDim } = this.props.shared;
    	const imgData = imgPool[id];

    	const boxX = (x + margin.left + 5);// * ratio;
    	let boxY;
    	const refY = 120 / ratio;
    	if (y < refY) {
    		boxY = y + (refY - y);
    	} else if (canvasDim.height - y < refY) {
    		boxY = y - (refY - canvasDim.height + y);
    	} else {
    		boxY = y;
    	}
    	this.drawImage(ctx, imgData, boxX, boxY);
    	this.drawInfo(ctx, infoSortor(info), boxX + 110 - margin.left, boxY);
    }

    render() {
    	return (
    		<SubscriberExt
    			canvas={contexts => contexts.mouseCoord}
    			clip={true}
    			edgeClip={false}
    			draw={this.draw}
    			drawOn={["mousemove"]}
    			shared={this.props.shared}
    		/>
    	);
    }
}

DataBox.propTypes = {
	hint: PropTypes.arrayOf(PropTypes.string),
	infoSortor: PropTypes.func,
	shared: PropTypes.shape({
		imgPool: PropTypes.object,
		ratio: PropTypes.number,
		margin: PropTypes.shape({
			left: PropTypes.number,
			right: PropTypes.number,
			top: PropTypes.number,
			bottom: PropTypes.number
		}),
		canvasDim: PropTypes.shape({
			width: PropTypes.number,
			height: PropTypes.number
		})
	})
};

export default DataBox;