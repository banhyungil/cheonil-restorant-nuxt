import { getInitials } from '../utils/common'
import { ref, unref, watch, type MaybeRef, type Ref } from 'vue'

export default function useFilterCho<T>(items: MaybeRef<T[]>, srchKeys: (keyof T)[], srchText: Ref<string>) {
    const ftItems = ref<T[]>()

    watch(
        srchText,
        () => {
            if (srchText.value == '') {
                ftItems.value = unref(items)
            } else {
                const srchInitials = getInitials(srchText.value)

                ftItems.value = unref(items).filter((item) => {
                    return srchKeys.some((key) => {
                        const nameInititals = getInitials(item[key] as string)

                        return nameInititals.includes(srchInitials)
                    })
                })
            }
        },
        { immediate: true }
    )

    return { ftItems }
}
