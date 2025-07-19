<script setup lang="ts">
import useApiStoreCtg from '@/api/useApiStoreCtg'
import useSwal from '@/composables/useSwal'
import { useStoreStore } from '@/stores/storeStore'
import { computed, ref, type Ref } from 'vue'
import { useRouter } from 'vue-router'
import _ from 'lodash'
import useApiPlaceCtg from '@/api/useApiPlaceCtg'
import { usePlaceCtgStore } from '@/stores/placeCtgStore'

const storeStore = useStoreStore()
const Swal = useSwal()
const router = useRouter()
const apiStoreCtg = useApiStoreCtg()
const apiPlaceCtg = useApiPlaceCtg()
const placeCtgStore = usePlaceCtgStore()
apiPlaceCtg.selectList().then((res) => {
    placeCtgStore.items = res
})

interface Props {
    seq?: number
}
const props = defineProps<Props>()
const cIsUpdate = computed(() => (props.seq ? true : false))
const cText = computed(() => (cIsUpdate.value ? '수정' : '등록'))
const ctg = ref<StoreCategoryEntityCreation>({ name: '' })
if (props.seq) {
    ctg.value = _.cloneDeep(storeStore.categories.find((ctg) => ctg.seq == props.seq))!
}

const inp = ref() as Ref<HTMLInputElement>
async function onSave() {
    // 검증
    if (!cIsUpdate.value && storeStore.categories.some((iCtg) => iCtg.name == ctg.value.name)) {
        Swal.fire({ title: '중복된 카테고리가 존재합니다.', icon: 'warning' })

        inp.value.focus()
    } else {
        if (cIsUpdate.value) {
            const uCtg = await apiStoreCtg.update(ctg.value as StoreCategoryEntity)
            const tgt = storeStore.categories.find((item) => item.seq == uCtg.seq)
            if (tgt) Object.assign(tgt, uCtg)

            Swal.fireCustom({ toast: true, messageType: 'update' })
        } else {
            const nCtg = await apiStoreCtg.create(ctg.value)
            storeStore.categories.push(nCtg)

            Swal.fireCustom({ toast: true, messageType: 'save' })
        }
        storeStore.categories = await apiStoreCtg.selectList()
        router.back()
    }
}

function onAddPlaceCtg() {
    router.push('/placeCtgEdit')
}

function onEditPlaceCtg(seq: number) {
    router.push(`/placeCtgEdit/${seq}`)
}

async function onRemove() {
    if (await Swal.fireCustom({ isConfirm: true, messageType: 'remove', text: '해당 카테고리 매장도 모두 삭제 됩니다' })) {
        await apiStoreCtg.remove(ctg.value.seq!)
        storeStore.categories = await apiStoreCtg.selectList()

        Swal.fireCustom({ toast: true, messageType: 'remove' })
        router.back()
    }
}
function onCancel() {
    router.back()
}
</script>
<template>
    <section class="store-ctg-view">
        <section class="wrapper g-form">
            <section class="top">{{ `매장 카테고리 ${cText}` }}</section>
            <section class="content">
                <div class="row">
                    <span class="label">카테고리 명</span>
                    <input ref="inp" v-model="ctg.name" class="val" type="text" />
                </div>
                <div class="row">
                    <span class="label">구역 </span>
                    <div class="val" style="display: flex; justify-content: center; align-items: center; height: 56px">
                        <v-select v-model="ctg.placeCtgSeq" :items="placeCtgStore.items" item-value="seq" item-title="name">
                            <template #item="{ props, item }">
                                <v-list-item v-bind="props">
                                    <template #append>
                                        <button @click="onEditPlaceCtg(item.raw.seq)">
                                            <font-awesome-icon :icon="['fas', 'pen']" />
                                        </button>
                                    </template>
                                </v-list-item>
                            </template>
                        </v-select>
                        <button @click="onAddPlaceCtg"><font-awesome-icon :icon="['fas', 'plus']" /></button>
                    </div>
                </div>
            </section>
            <section class="btt">
                <button @click="onSave">{{ cText }}</button>
                <button v-if="cIsUpdate" @click="onRemove">삭제</button>
                <button @click="onCancel">취소</button>
            </section>
        </section>
    </section>
</template>

<style lang="scss" scoped>
.store-ctg-view {
    @include center-view;
}
</style>
