<script setup lang="ts">
import useApiPlaceCtg from '@/api/useApiPlaceCtg'
import useSwal from '@/composables/useSwal'
import { computed, onMounted, ref, type Ref } from 'vue'
import { useRouter } from 'vue-router'
import _ from 'lodash'
import { useStoreStore } from '@/stores/storeStore'

const Swal = useSwal()
const router = useRouter()

const storeStore = useStoreStore()
const apiPlaceCtg = useApiPlaceCtg()
const list = ref([] as PlaceCategoryEntity[])

interface Props {
    seq?: number
}

const props = defineProps<Props>()

const cIsUpdate = computed(() => (props.seq ? true : false))
const cIsUpdated = computed(
    () =>
        _.isEqual(
            ctg.value,
            list.value.find((ctg) => ctg.seq == props.seq)
        ) == false
)
const cText = computed(() => (cIsUpdate.value ? '수정' : '등록'))
const ctg = ref<PlaceCategoryEntityCreation>({ name: '' })

onMounted(async () => {
    await apiPlaceCtg.selectList().then((res) => {
        list.value = res
    })

    if (props.seq) {
        ctg.value = _.cloneDeep(list.value.find((ctg) => ctg.seq == props.seq))!
    }
})

const inp = ref() as Ref<HTMLInputElement>
async function onSave() {
    // 검증
    if (cIsUpdate.value) {
        await apiPlaceCtg.update(ctg.value as PlaceCategoryEntity)
        Swal.fireCustom({ toast: true, messageType: 'update' })
    } else {
        if (list.value.some((iCtg) => iCtg.name == ctg.value.name)) {
            Swal.fire({ title: '중복된 구역이 존재합니다.', icon: 'warning' })

            inp.value.focus()
        }

        await apiPlaceCtg.create(ctg.value)
        Swal.fireCustom({ toast: true, messageType: 'save' })
    }

    list.value = await apiPlaceCtg.selectList()
    router.back()
}

async function onRemove() {
    if (ctg.value.seq && (await Swal.fireCustom({ isConfirm: true, messageType: 'remove' }))) {
        await apiPlaceCtg.remove(ctg.value.seq)
        // 카테고리 중 해당 구역 설정되어 있는 경우 수정
        // 매장 중 해당 구역 설정되어 있는 경우 수정
        storeStore.categories.forEach((storeCtg) => {
            if (storeCtg.placeCtgSeq == ctg.value.seq) {
                storeCtg.placeCtgSeq = null
            }
        })
        storeStore.items.forEach((store) => {
            if (store.placeCtgSeq == ctg.value.seq) {
                store.placeCtgSeq = null
            }
        })

        _.remove(list.value, (item) => item.seq == ctg.value.seq)

        Swal.fireCustom({ toast: true, messageType: 'remove' })
        router.back()
    }
}
function onCancel() {
    router.back()
}
</script>
<template>
    <section class="place-ctg-view">
        <section class="wrapper g-form">
            <section class="top">{{ `구역 ${cText}` }}</section>
            <section class="content">
                <div class="row">
                    <span class="label">구역</span>
                    <input ref="inp" v-model="ctg.name" class="val" type="text" />
                </div>
                <div class="row">
                    <span class="label">비고</span>
                    <v-textarea v-model="ctg.cmt" class="val" rows="1" auto-grow bg-color="#fff" variant="outlined" style="height: fit-content"></v-textarea>
                </div>
            </section>
            <section class="btt">
                <v-btn :disabled="cIsUpdated == false" @click="onSave">{{ cText }}</v-btn>
                <v-btn v-if="cIsUpdate" @click="onRemove">삭제</v-btn>
                <v-btn @click="onCancel">취소</v-btn>
            </section>
        </section>
    </section>
</template>

<style lang="scss" scoped>
.place-ctg-view {
    @include center-view;
}
</style>
