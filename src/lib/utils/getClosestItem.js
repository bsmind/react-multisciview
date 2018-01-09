import getClosestItemIndexes from './getClosestItemIndexes';

export default (
    array,
    value,
    accessor
) => {
    const {left, right} = getClosestItemIndexes(array, value, accessor);

    if (left === right)
        return array[left];

    return (Math.abs(accessor(array[left]) - value) < Math.abs(accessor(array[right]) - value))
        ? array[left]
        : array[right];
}
