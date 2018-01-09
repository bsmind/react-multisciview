import React from "react";

export default class Series extends React.Component {
	render() {
        const { children, ...rest } = this.props;
        if (children == null) return null;

		const childrenWithProps = React.Children.map(children, child => {
			if (!React.isValidElement(child)) return undefined;
			return React.cloneElement(child, rest);
		}).filter(d => d != undefined);

		return childrenWithProps;
	}
}
