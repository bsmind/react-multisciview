export default (state, payload) => {
    const list = payload;
    const allList = [...state.selectedItemList];
    allList.push(list);
    return {
        ...state,
        selectedItemList: allList
    };
}