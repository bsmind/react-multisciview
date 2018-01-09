export const MOUSEENTER = "mouseenter.interaction";
export const MOUSELEAVE = "mouseleave.interaction";
export const MOUSEMOVE = "mousemove.pan";
export const MOUSEUP = "mouseup.pan";
export const TOUCHMOVE = "touchmove.pan";
export const TOUCHEND = "touchend.pan touchcancel.pan";

export function d3Window(node) {
	return node
        && (
        	(node.ownerDocument && node.ownerDocument.defaultView) ||
            (node.document && node) ||
            (node.defaultView)
        );
}

export function mousePosition(e, defaultRect) {
	const container = e.currentTarget;
	const rect = defaultRect || container.getBoundingClientRect(),
		x = e.clientX - rect.left - container.clientLeft,
		y = e.clientY - rect.top - container.clientTop;
	return [Math.round(x), Math.round(y)];
}

export function touchPosition(e, touch) {
	const container = e.target;
	const rect = container.getBoundingClientRect(),
		x = touch.clientX - rect.left - container.clientLeft,
		y = touch.clientY - rect.top - container.clientTop;
	return [Math.round(x), Math.round(y)];
}

export function getTouchProps(touch) {
	if (!touch) return {};
	return {
		pageX: touch.pageX,
		pageY: touch.pageY,
		clientX: touch.clientX,
		clientY: touch.clientY
	};
}
