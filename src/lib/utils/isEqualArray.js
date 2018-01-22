export default (arr1, arr2) => {
    if (arr1.length !== arr2.length) return false;

    const arr1Sorted = arr1.sort();
    const arr2Sorted = arr2.sort();
    return arr1Sorted.every((v1, i) => v1 === arr2Sorted[i]);
}