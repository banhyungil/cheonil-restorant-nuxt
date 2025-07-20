import { unref, watch, type ComputedRef, type MaybeRef, type Ref } from 'vue'

interface Options<T> {
    checkedIds: Ref<T[]>
    checkAll: Ref<boolean | null>
    allIds: MaybeRef<T[]> | ComputedRef<T[]>
}
export default function useCheckAll<T>(options: Options<T>) {
    const { checkedIds, checkAll, allIds } = options

    function onCheck() {
        if (checkedIds.value.length == 0) checkAll.value = false
        else if (checkedIds.value.length == unref(allIds).length) checkAll.value = true
        else checkAll.value = null
    }
    function onCheckAll() {
        if (checkAll.value === true) checkedIds.value = unref(allIds)
        else if (checkAll.value === false) checkedIds.value = []
    }

    watch(
        checkedIds,
        () => {
            onCheck()
        },
        { deep: true }
    )

    return { onCheck, onCheckAll }
}
