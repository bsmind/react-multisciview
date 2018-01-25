export const SAMPLE_MATERIAL_HINTS = [
	"C67",
	"L74",
	"MB",
];

/**
 * A name of a attribute is defined by a sequence of tokens.
 * For example, it looks like metadata_extract.data.annealing_time where
 * metadata_extract and data are related protocols defined by scientists or
 * generated during database construction, and annealing_time is the actual
 * attribute name. As the attribute name is not unique (i.e. same attributes under
 * different protocols), we keep those prefix with the maximum length defined below.
 */
export const SHORT_KEY_MAX_LEN = 4;