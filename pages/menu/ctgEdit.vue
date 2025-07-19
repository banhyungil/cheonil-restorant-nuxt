<script setup lang="ts">
import useSwal from '@/composables/useSwal'
import { computed, ref, type Ref } from 'vue'
import { useRouter } from 'vue-router'
import _ from 'lodash'
import { useMenuStore } from '@/stores/menuStore'
import useApiMenuCtg from '@/api/useApiMenuCtg'

const menuStore = useMenuStore()
const apiMenuCtg = useApiMenuCtg()
const Swal = useSwal()
const router = useRouter()

interface Props {
    seq?: number
}
const props = defineProps<Props>()
const cIsUpdate = computed(() => (props.seq ? true : false))
const cIsUpdated = computed(
    () =>
        _.isEqual(
            ctg.value,
            menuStore.categories.find((ctg) => ctg.seq == props.seq)
        ) == false
)
const cText = computed(() => (cIsUpdate.value ? '수정' : '등록'))
const ctg = ref<MenuCategoryEntityCreation>({ name: '' })
if (props.seq) {
    ctg.value = _.cloneDeep(menuStore.categories.find((ctg) => ctg.seq == props.seq))!
}

const inp = ref() as Ref<HTMLInputElement>
async function onSave() {
    // 검증
    if (!cIsUpdate.value && menuStore.categories.some((iCtg) => iCtg.name == ctg.value.name)) {
        Swal.fire({ title: '중복된 카테고리가 존재합니다.', icon: 'warning' })

        inp.value.focus()
    } else {
        if (cIsUpdate.value) {
            const uCtg = await apiMenuCtg.update(ctg.value as MenuCategoryEntity)
            const tgt = menuStore.categories.find((ctg) => ctg.seq == uCtg.seq)
            if (tgt) Object.assign(uCtg)

            Swal.fireCustom({ toast: true, messageType: 'update' })
        } else {
            const nCtg = await apiMenuCtg.create(ctg.value)
            menuStore.categories.push(nCtg)

            Swal.fireCustom({ toast: true, messageType: 'save' })
        }
        menuStore.categories = await apiMenuCtg.selectList()
        router.back()
    }
}

async function onRemove() {
    if (ctg.value.seq && (await Swal.fireCustom({ isConfirm: true, messageType: 'remove', text: '해당 카테고리 메뉴도 모두 삭제 됩니다' }))) {
        await apiMenuCtg.remove(ctg.value.seq)
        menuStore.categories = await apiMenuCtg.selectList()

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
            <section class="top">{{ `메뉴 카테고리 ${cText}` }}</section>
            <section class="content">
                <div class="row">
                    <span class="label">카테고리 명</span>
                    <input ref="inp" v-model="ctg.name" class="val" type="text" />
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
.store-ctg-view {
    @include center-view;
}
</style>
