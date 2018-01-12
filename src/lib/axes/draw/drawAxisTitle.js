export default (ctx, title, labelStyle) => {
    const { 
        fontSize, 
        fontFamily, 
        tickLabelFill, 
        textAnchor 
    } = labelStyle;
    
    ctx.font = `${fontSize}px ${fontFamily}`;
    ctx.fillStyle = tickLabelFill;
    ctx.textAlign = textAnchor === 'middle' ? 'center' : textAnchor;
    ctx.beginPath();
    ctx.fillText(title.label, title.x, title.y);
}