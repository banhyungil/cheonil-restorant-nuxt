import _ from 'lodash'
import { computed, ref, type Ref } from 'vue'

export function useDirty<T extends readonly Ref<unknown>[]>(refs: T) {
    const origins = refs.map((r) => ref(_.cloneDeep(r.value))) as {
        [K in keyof T]: Ref<T[K] extends Ref<infer U> ? U : never>
    }

    const cIsDirty = computed(() => refs.some((r, i) => !_.isEqual(r.value, origins[i].value)))

    function revert() {
        refs.forEach((r, i) => {
            r.value = _.cloneDeep(origins[i].value)
            console.log(`Reverted ref[${i}]:`, r.value)
        })
    }

    function commit() {
        refs.forEach((r, i) => {
            origins[i].value = _.cloneDeep(r.value)
        })
    }

    return {
        origins,
        cIsDirty,
        commit,
        revert,
    }
}
