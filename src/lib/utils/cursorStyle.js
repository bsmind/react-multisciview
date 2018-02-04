import React from "react";

export default (useCrossHairStyleCursor = true) => {
	const style = `
    .react-multiview-grabbing-cursor {
        pointer-events: all;
        cursor: -moz-grabbing;
        cursor: -webkit-grabbing;
        cursor: grabbing;
    }
    .react-multiview-crosshair-cursor {
        pointer-events: all;
        cursor: crosshair;
    }
    .react-multiview-tooltip-hover {
        pointer-events: all;
        cursor: pointer;
    }`;
	const tooltipStyle = `
    .react-multiview-avoid-interaction {
        pointer-events: none;
    }
    .react-multiview-enable-interaction {
        pointer-events: all;
    }
    .react-multiview-tooltip {
        pointer-events:all;
        cursor: pointer;
    }
    .react-multiview-default-cursor {
        cursor: default;
    }
    .react-multiview-move-cursor {
        cursor: move;
    }
    .react-multiview-pointer-cursor {
        cursor: pointer;
    }
    .react-multiview-ns-resize-cursor {
        cursor: ns-resize;
    }
    .react-multiview-ew-resize-cursor {
        cursor: ew-resize;
    }`;
	return (
        <style type="text/css">
            {useCrossHairStyleCursor ? style + tooltipStyle : tooltipStyle}
        </style>
    );
};
