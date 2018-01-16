import randomColor from 'randomcolor';

const colorOptions = {
    luminosity: 'dark',
    hue: 'random'
}

export const getRandomColor = () => {
    return randomColor(colorOptions);
}

export const getSampleKinds = (state, sampleKinds) => {
    const sampleColors = {};
    const sampleNames = Object.keys(sampleKinds).map(key => sampleKinds[key]);

    const colors = randomColor({
        ...colorOptions,
        count: sampleNames.length
    });

    sampleNames.forEach((name, index) => {
        sampleColors[name] = colors[index];
    });

    return {
        ...state,
        sampleKinds,
        sampleColors
    };
}

export const handleSampleColorChange = (state, sampleName) => {
    const sampleColors = {...state.sampleColors};

    const prev = sampleColors[sampleName];
    let newColor;
    do {
        newColor = randomColor(colorOptions);
    } while (newColor === prev);

    sampleColors[sampleName] = newColor;

    return {
        ...state,
        sampleColors
    }
}