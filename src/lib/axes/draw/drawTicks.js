import { hexToRGBA } from "../../utils";

export default (ctx, ticks, tickStyle, labelStyle, maxWidth=50) => {

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
		const lineHeight = 6 + fontSize * 0.4
		ctx.font = `${fontSize}px ${fontFamily}`;
		ctx.fillStyle = tickLabelFill;
		ctx.textAlign = textAnchor === "middle" ? "center" : textAnchor;
		ticks.forEach(tick => {
			ctx.beginPath();

			const words = tick.label.split('_');
			let line = ''
			let y = tick.labelY;
			for (let n=0; n < words.length; n++) {
				const testLine = n < words.length-1
					? line + words[n] + "_": line + words[n];
				const metrics = ctx.measureText(testLine);
				const testWidth = metrics.width;
				if (testWidth > maxWidth && n > 0) {
					ctx.fillText(line, tick.labelX, y);
					line = words[n];
					y += lineHeight;
				}
				else {
					line = testLine;
				}
			}
			ctx.fillText(line, tick.labelX, y);
		});
	}
};