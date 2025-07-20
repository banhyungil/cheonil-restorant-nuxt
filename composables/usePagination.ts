import { computed, ref, unref, watch, type MaybeRef } from 'vue'

export const PAGE_SIZE_LIST = [10, 30, 50, 100, 200]
export const PAGE_GRP_SIZE = 5

export default function usePagination(totalCnt: MaybeRef<number>, pageSize: MaybeRef<number>) {
    const pageNo = ref(1)
    const cTotalPage = computed(() => {
        if (unref(pageSize) == null || unref(pageSize) < 1) return 0
        else return Math.ceil(unref(totalCnt) / unref(pageSize))
    })

    watch(
        () => cTotalPage.value,
        () => {
            if (pageNo.value > cTotalPage.value) {
                pageNo.value = cTotalPage.value == 0 ? 1 : cTotalPage.value
            }
        }
    )

    const cOffset = computed(() => {
        if (unref(pageSize) == null || unref(pageSize) < 1) return 0
        else return (pageNo.value - 1) * unref(pageSize)
    })
    return { pageNo, cOffset, cTotalPage }
}
