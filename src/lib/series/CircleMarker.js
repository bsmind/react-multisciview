import React from "react";
import PropTypes from "prop-types";

import { hexToRGBA, functor } from "../utils";

function Circle(props) {
	const { className, stroke, strokeWidth, opacity, fill, point, r } = props;
	return null;
}

Circle.propTypes = {
    className: PropTypes.string,

	point: PropTypes.shape({
		x: PropTypes.number,
		y: PropTypes.number,
		datum: PropTypes.object,
    }),

	r: PropTypes.oneOfType([
		PropTypes.number,
		PropTypes.func
	]),

	stroke: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.func
    ]),

	fill: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.func
    ]),

	opacity: PropTypes.oneOfType([
        PropTypes.number,
        PropTypes.func
    ]),

	strokeWidth: PropTypes.oneOfType([
        PropTypes.number,
        PropTypes.func
    ]),
};

Circle.defaultProps = {
	stroke: "#4682B4",
	strokeWidth: 1,
	opacity: 0.5,
	fill: "#4682B4",
	className: ""
};

Circle.draw = (ctx, point) => {
    //const { strokeWidth, r } = point.props;
    const { stroke, fill, opacity, radius, strokeWidth } = point;

    //if (stroke == null)
    //    console.log(point)
    //console.log(stroke)
	ctx.strokeStyle = stroke;
	ctx.lineWidth = strokeWidth;

	if (fill !== "none")
		ctx.fillStyle = hexToRGBA(fill, opacity);

	//const radius = functor(r)(point.datum);

	//ctx.moveTo(point.x, point.y);
	ctx.beginPath();
	ctx.arc(point.x, point.y, radius, 0, 2 * Math.PI, false);
	ctx.stroke();
	ctx.fill();
};


export default Circle;
