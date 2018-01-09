import { hexToRGBA } from "../../utils";

export default (ctx, ticks, tickStyle, labelStyle) => {

	const { tickStroke, tickStrokeOpacity, tickStrokeWidth } = tickStyle;

	ctx.strokeStyle = hexToRGBA(tickStroke, tickStrokeOpacity);
	ctx.fillStyle = tickStroke;
	ticks.forEach(tick => {
		ctx.beginPath();
		ctx.moveTo(tick.x1, tick.y1);
		ctx.lineTo(tick.x2, tick.y2);
		ctx.lineWidth = tickStrokeWidth;
		ctx.stroke();
	});

	if (labelStyle) {
		const { fontSize, fontFamily, tickLabelFill, textAnchor } = labelStyle;
		ctx.font = `${fontSize}px ${fontFamily}`;
		ctx.fillStyle = tickLabelFill;
		ctx.textAlign = textAnchor === "middle" ? "center" : textAnchor;
		ticks.forEach(tick => {
			ctx.beginPath();
			ctx.fillText(tick.label, tick.labelX, tick.labelY);
		});
	}
};