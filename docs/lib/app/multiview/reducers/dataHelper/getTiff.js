import { scaleLinear } from 'd3-scale';

function raw2gray (raw) {
    const minv = raw.min;
    const maxv = raw.max;
    const {width, height, data} = raw;

    const cvs = document.createElement("canvas");
    const ctx = cvs.getContext("2d");

    cvs.width = width;
    cvs.height = height;

    const imageData = ctx.getImageData(0, 0, width, height);
    const pData = imageData.data;

    //???
    //const imgScale = scaleLinear().domain([minv, maxv]).range([0, 255]);
    const imgScale = scaleLinear().domain([0, Math.log(maxv)]).range([0, 255]);

    for (let i=0; i<pData.length; i += 4) {
        const index = i / 4;
        const row = Math.floor(index / width);
        const col = index - row * width;

        let value = data[row][col];
        if (value < 1) value = 1;
        value = Math.log(value);
        
        pData[i] = pData[i + 1] = pData[i + 2] = imgScale(value);
        pData[i + 3] = 255;
    }

    ctx.putImageData(imageData, 0, 0);
    return cvs.toDataURL();
}


export default (state, payload) => {
    const {id, data} = payload;

    if (state.imgPool[id] == null) {
        const img = {[id]: {
            url: raw2gray(data),
            ...data
        }};
        //console.log(img)
        return {...state, imgPool: {...state.imgPool, ...img}};
    }

    return state;
}