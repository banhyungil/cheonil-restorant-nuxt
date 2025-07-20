import _ from 'lodash'
import { watchArray } from '@vueuse/core'
import { ref, type ComputedRef, type Ref } from 'vue'

/**
 * 사용예제
 * 1. 기본, initFn을 통해 Dictionary의 type 확정한다
 * useDictionary({
        items: nvrs,
        itemKey: 'seq',
        initFn: (_) => ({}) as { isOnline: boolean; status: NvrStatus | null; entries: NvrCamEntryStatus[] },
    })
 * 2. initFn 설정, 기본값을 설정 할 수 있음
 * const { dict: dItemExt } = useDictionary({
 *  items: computed(() => props.items),
 *  itemKey: props.itemKey,
 *  initFn: (_) => ({ selected: false }),
})
 */
interface Options<T extends object, K extends ValuePropKeys<T>, DictVal> {
    items: ComputedRef<T[]> | Ref<T[]>
    itemKey: K
    // initFn이 없으면 null로 초기화
    dict?: Ref<Record<PropertyKey, DictVal>>
    initFn?: (item: T) => DictVal
    onAdded?: (items: T[K][]) => void
    onRemoved?: (items: T[K][]) => void
}
export default function useDictionary<T extends object, K extends ValuePropKeys<T>, DictVal>(options: Options<T, K, DictVal>) {
    const { items, itemKey, dict = ref<Record<PropertyKey, DictVal>>({}), initFn = () => null, onAdded = () => {}, onRemoved = () => {} } = options

    watchArray(
        () => items.value.map((item) => item[itemKey]),
        (_, __, adds, dels) => {
            adds.forEach((keyVal) => {
                const item = items.value.find((item) => item[itemKey] == keyVal)
                if (item) {
                    const result = initFn(item)

                    if (result && typeof result == 'object') {
                        dict.value[keyVal as PropertyKey] = Object.assign(result, dict.value[keyVal as PropertyKey])
                    } else if (result !== null) {
                        dict.value[keyVal as PropertyKey] = result
                    }
                }
            })

            dels?.forEach((keyVal) => {
                const key = keyVal as PropertyKey
                if (key in dict.value) {
                    const { [key]: _, ...rest } = dict.value
                    dict.value = rest
                }
            })

            if (adds.length > 0) onAdded(adds)
            if (dels && dels.length > 0) onRemoved(dels)
        },
        { immediate: true }
    )

    return { dict }
}
