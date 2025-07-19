<script setup lang="ts">
import useApiStore from '@/api/useApiStore'
import { useStoreStore } from '@/stores/storeStore'
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import _ from 'lodash'
import useSwal from '@/composables/useSwal'
import { usePlaceCtgStore } from '@/stores/placeCtgStore'
import useApiPlaceCtg from '@/api/useApiPlaceCtg'
import { useVuelidate, type ValidationArgs } from '@vuelidate/core'
import { required, helpers } from '@vuelidate/validators'
import useApiStoreCtg from '@/api/useApiStoreCtg'

// 주문 화면 다음으로 이동될 화면
// 가게, 카테고리 목록은 store에 저장된 데이터 사용
const storeStore = useStoreStore()
const apiStore = useApiStore()
const apiStoreCtg = useApiStoreCtg()
const Swal = useSwal()
const router = useRouter()
const routeQuery = useRoute().query
const apiPlaceCtg = useApiPlaceCtg()
const placeCtgStore = usePlaceCtgStore()
apiPlaceCtg.selectList().then((res) => {
    placeCtgStore.items = res
})

interface Props {
    seq?: string | number
}

const props = defineProps<Props>()
const cIsUpdate = computed(() => (props.seq ? true : false))
const cText = computed(() => (cIsUpdate.value ? '수정' : '등록'))

const store = ref({} as StoreEntity)
const origin = ref<StoreEntity>()
const cUpdateAble = computed(() => cIsUpdate.value && _.isEqual(store.value, origin.value))

onMounted(async () => {
    if (storeStore.items.length == 0) {
        storeStore.items = await apiStore.selectList()
        storeStore.categories = await apiStoreCtg.selectList()
    }

    // 수정 시 원본 매장 찾기
    if (props.seq) {
        origin.value = storeStore.items.find((item) => item.seq == props.seq)

        if (origin.value == null) {
            router.back()
        } else {
            store.value = _.cloneDeep(origin.value)
        }
    }

    // 카테고리 선택 후 진입시 선택 카테고리 설정
    if (routeQuery) {
        if ('ctgSeq' in routeQuery && typeof routeQuery.ctgSeq == 'string') {
            store.value.ctgSeq = +routeQuery.ctgSeq
        }
    }
})

const rules = {
    ctgSeq: {
        required: helpers.withMessage('카테고리를 선택해주세요.', required),
    },
    name: {
        required: helpers.withMessage('이름을 입력해주세요.', required),
    },
} as ValidationArgs
const v$ = useVuelidate(rules, store)
async function validate() {
    if ((await v$.value.$validate()) == false) return false
    if (cIsUpdate.value == false) return storeStore.items.every((item) => item.name != store.value.name)

    return true
}

async function onSave() {
    if ((await validate()) == false) {
        const message = v$.value.$silentErrors[0]?.$message ?? '동일한 매장명이 존재합니다.'
        Swal.fireCustom({ toast: true, title: message, icon: 'warning' })
        return
    }

    // 수정
    if (cIsUpdate.value) {
        const uStore = await apiStore.update(store.value)

        const tgt = storeStore.items.find((item) => item.seq == uStore.seq)
        if (tgt) Object.assign(tgt, uStore)

        Swal.fireCustom({ toast: true, messageType: 'update' })

        // 등록
    } else {
        const nStore = await apiStore.create(store.value)
        storeStore.items.push(nStore)

        Swal.fireCustom({ toast: true, messageType: 'save' })
    }

    router.back()
}

function onAddPlaceCtg() {
    router.push('/placeCtgEdit')
}

function onEditPlaceCtg(seq: number) {
    router.push({ path: `/placeCtgEdit/${seq}` })
}

async function onRemove() {
    if (props.seq && (await Swal.fireCustom({ isConfirm: true, messageType: 'remove' }))) {
        await apiStore.remove(+props.seq)
        _.remove(storeStore.items, (item) => item.seq == props.seq)

        Swal.fireCustom({ toast: true, messageType: 'remove' })
        router.back()
    }
}

function onCancel() {
    router.back()
}
</script>

<template>
    <section class="store-view">
        <section class="wrapper g-form">
            <section class="top">{{ `매장 ${cText}` }}</section>
            <section class="content">
                <div class="row">
                    <span class="label required">카테고리</span>
                    <v-select v-model="store.ctgSeq" :items="storeStore.categories" item-title="name" item-value="seq" density="comfortable"> </v-select>
                </div>
                <div class="row">
                    <span class="label required">매장명</span>
                    <input v-model="store.name" class="val" type="text" />
                </div>
                <div class="row">
                    <span class="label">구역</span>
                    <div class="val" style="display: flex; justify-content: center; align-items: center; height: 56px">
                        <v-select v-model="store.placeCtgSeq" :items="placeCtgStore.items" item-value="seq" item-title="name" density="comfortable">
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
                <div class="row">
                    <span>비고</span>
                    <v-textarea v-model="store.cmt" class="val" rows="1" auto-grow bg-color="#fff" variant="outlined" style="height: fit-content"></v-textarea>
                </div>
            </section>
            <section class="btt">
                <v-btn :disabled="cUpdateAble" @click="onSave">{{ cText }}</v-btn>
                <v-btn v-if="cIsUpdate" @click="onRemove">삭제</v-btn>
                <v-btn @click="onCancel">취소</v-btn>
            </section>
        </section>
    </section>
</template>

<style lang="scss" scoped>
.store-view {
    @include center-view;
}
</style>
