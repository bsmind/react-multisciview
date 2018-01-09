import { getClosestItem } from "../../utils";

export default (
    xScale,
    xAccessor,
    mouseXY,
    plotData
) => {
    let xValue, item;
    if (xScale.invert) {
        xValue = xScale.invert(mouseXY[0]);
        item = getClosestItem(plotData, xValue, xAccessor);
    } else {
        console.log('getCurrentItem::xScale.invert not defined');
        item = null;
    }
    return item;
}
