export default (arr) => {
    if (Array.isArray(arr) && arr.length === 2) {
        return arr.every(d => typeof d === 'number');
    }
    return false;
}