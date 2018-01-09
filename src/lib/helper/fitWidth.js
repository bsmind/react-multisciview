import React, { Component } from "react";
import ReactDOM from "react-dom";

const getDisplayName = (Series) => {
	return Series.displayName || Series.name || "Series";
};

export default function fitWidth(WrappedComponent, withRef = true, minWidth = 100) {
	class ResponsiveComponent extends Component {
		constructor() {
			super();
			this.state = {
				width: null,
				ratio: null
			};
		}

		componentDidMount() {
			window.addEventListener("resize", this.handleWindowResize);
			const el = this.node;
			const w = el.parentNode.clientWidth;

			this.setState({
				width: Math.max(w, minWidth),
				ratio: this.getRatio()
			});
		}

		componentWillUnmount() {
			window.removeEventListener("resize", this.handleWindowResize);
		}

        handleWindowResize = () => {
        	const el = ReactDOM.findDOMNode(this.node);
        	const w = el.parentNode.clientWidth;

        	if (w > minWidth) this.setState({ width: w });
        }

        setNode = (node) => this.node = node;

        setTestCanvas = (node) => this.testCanvas = node;

        getRatio = () => {
        	if (this.testCanvas) {
        		const context = this.testCanvas.getContext("2d");
        		const devicePixelRatio = window.devicePixelRatio || 1;
        		const backingStoreRatio =
                        context.webkitBackingStorePixelRatio ||
                        context.mozBackingStorePixelRatio ||
                        context.msBackingStorePixelRatio ||
                        context.oBackingStorePixelRatio ||
                        context.BackingStorePixelRatio || 1;
        		const ratio = devicePixelRatio / backingStoreRatio;
        		return ratio;
        	}
        	return 1;
        }

        getWrappedInstance = () => this.node;

        render() {
        	const ref = withRef ? { ref: this.setNode } : {};

        	if (this.state.width) {
        		return <WrappedComponent
        			width={this.state.width}
        			ratio={this.state.ratio}
        			{...this.props}
        			{...ref} />;
        	} else {
        		return <div {...ref}>
        			<canvas ref={this.setTestCanvas} />
        		</div>;
        	}

        }
	}

	ResponsiveComponent.displayName = `fitWidth(${getDisplayName(WrappedComponent)})`;
	return ResponsiveComponent;
}
