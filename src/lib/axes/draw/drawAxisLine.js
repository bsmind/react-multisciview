import { hexToRGBA } from "../../utils";

export default (ctx, props, range) => {
	const {
		orient,
		outerTickSize,
		stroke,
		strokeWidth,
		opacity
	} = props;

	const sign = orient === "top" || orient === "left" ? -1 : 1;
	const xAxis = orient === "bottom" || orient === "top";

	// console.log(orient, outerTickSize, stroke, strokeWidth, opacity)

	ctx.lineWidth = strokeWidth;
	ctx.strokeStyle = hexToRGBA(stroke, opacity);

	ctx.beginPath();

	if (xAxis) {
		ctx.moveTo(range[0], sign * outerTickSize);
		ctx.lineTo(range[0], 0);
		ctx.lineTo(range[1], 0);
		ctx.lineTo(range[1], sign * outerTickSize);
	} else {
		ctx.moveTo(sign * outerTickSize, range[0]);
		ctx.lineTo(0, range[0]);
		ctx.lineTo(0, range[1]);
		ctx.lineTo(sign * outerTickSize, range[1]);
	}

	ctx.stroke();
};