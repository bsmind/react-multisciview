export function AddDelSamples(action, keys) {
	return {
		type: "ADD_DEL_SAMPLES",
		payload: { action, keys }
	};
}

export function changeSampleColor(key) {
	return {
		type: "CHANGE_SAMPLE_COLOR",
		payload: key
	};
}

export function setAttr(dim, value) {
	return {
		type: "SET_ATTR",
		payload: { dim, value }
	};
}

export function setSwitch(name, value) {
	return {
		type: "SET_SWITCH",
		payload: { name, value }
	};
}

export function setSlider(name, value) {
	return {
		type: "SET_SLIDER",
		payload: { name, value }
	};
}

export function updateAttrSelect(newSelect) {
	return {
		type: "SET_PCP_SELECT_DIM",
		payload: newSelect
	};
}

export function setZColorScheme(attr, newScheme) {
	return {
		type: 'SET_Z_COLOR_SCHEME',
		payload: {attr, newScheme}
	};
}

export function setZColorDomain(attr, newDomain) {
	return {
		type: 'SET_Z_COLOR_DOMAIN',
		payload: {attr, newDomain}
	};
}