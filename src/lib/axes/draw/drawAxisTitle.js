export default (ctx, title, labelStyle, maxWidth=50) => {
	const {
		fontSize,
		fontFamily,
		tickLabelFill,
		textAnchor
	} = labelStyle;

	ctx.font = `${fontSize}px ${fontFamily}`;
	ctx.fillStyle = tickLabelFill;
	ctx.textAlign = textAnchor === "middle" ? "center" : textAnchor;
	ctx.beginPath();

	const lineHeight = 6 + fontSize * 0.4;
	const words = title.label.split('_')
	let line = '';
	let y = title.y;
	for (let n = 0; n < words.length; n++) {
		const testLine = n < words.length-1 
			? line + words[n] + '_': line + words[n];
		const metrics = ctx.measureText(testLine);
		const testWidth = metrics.width;
		if (testWidth > maxWidth && n > 0) {
			ctx.fillText(line, title.x, y);
			line = words[n];
			y += lineHeight;
		}
		else {
			line = testLine;
		}
	}
	ctx.fillText(line, title.x, y);
};

