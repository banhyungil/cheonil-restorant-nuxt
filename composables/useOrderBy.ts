import { computed, ref, type Ref } from 'vue'
import _ from 'lodash'

interface Options<T> {
    items: Ref<T[]>
}
export function useOrderBy<T extends object>(options: Options<T>) {
    const { items } = options
    /** 토글시 나머지 연산 사용을 위해 숫자 사용 */
    const orderDict = ref({}) as Ref<{ [k: string]: 0 | 1 | 2 }>

    const cOrdered = computed(() => order())

    const cOrderDict = computed(() => {
        return Object.keys(orderDict.value).reduce(
            (prev, k) => {
                const order = orderDict.value[k]
                prev[k] = order == 0 ? null : order == 1 ? 'asc' : 'desc'
                return prev
            },
            {} as Record<string, 'asc' | 'desc' | null>
        )
    })

    function toggle(itemKey: string, isMulty = true) {
        if (!isMulty) {
            const keys = Object.keys(orderDict.value)
            // 현재 대상 key 제외하고 모두 초기화
            keys.forEach((key) => {
                if (key == itemKey) return

                orderDict.value[key] = 0
            })
        }

        orderDict.value[itemKey] = (((orderDict.value[itemKey] ?? 0) + 1) % 3) as 0 | 1 | 2

        return cOrderDict.value[itemKey]
    }

    function order() {
        const keys: string[] = []
        const orders: ('asc' | 'desc')[] = []
        _.forEach(cOrderDict.value, (v, k) => {
            if (v == null) return

            keys.push(k)
            orders.push(v)
        })

        return _.orderBy(items.value, keys, orders)
    }

    return { toggle, orderDict, cOrderDict, cOrdered }
}
