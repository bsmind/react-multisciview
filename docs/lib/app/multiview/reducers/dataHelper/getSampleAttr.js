import { SHORT_KEY_MAX_LEN } from "../../constants";

const ATTRS_TO_EXCLUDES = [
	"circular_average.time",
	"linecut_qr.data.time",
	"linecut_qr.time",
	"metadata_extract.data.time",
	"metadata_extract.time"
];

export default function getSampleAttr(state, payload) {

	const attrKinds = {}, attrMinMax = {}, attrTypes = {};

	const allAttrs = Object.keys(payload);
	allAttrs.forEach(attr => {
		if (ATTRS_TO_EXCLUDES.includes(attr)) return;

		const { type, minmax } = payload[attr];
		const tokens = attr.split(".");

		let attrShort = tokens[tokens.length - 1];
		if (tokens.length > 1) {
			let prefix = "";
			for (let i = 0; i < tokens.length - 1; ++i) {
				prefix = (prefix.length)
					? prefix + "." + tokens[i].substr(0, SHORT_KEY_MAX_LEN)
					: tokens[i].substr(0, SHORT_KEY_MAX_LEN);
			}
			attrShort = prefix + "." + attrShort;
		}

		attrKinds[attr] = attrShort; // eslint-disable-line
		attrMinMax[attr] = minmax; // eslint-disable-line
		attrTypes[attr] = type; // eslint-disable-line
	});

	// console.log(attrKinds)

	return { ...state,
		attrKinds,
		attrMinMax,
		attrTypes,
		attrFormat: attrKey => {
			const tokens = attrKey.split(".");
			const name = tokens.length > 1 ? tokens[tokens.length - 1] : tokens[0];
			return name;
		}
	};
}