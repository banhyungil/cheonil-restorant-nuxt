<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import _ from 'lodash'
import useSwal from '@/composables/useSwal'
import { useMenuStore } from '@/stores/menuStore'
import useApiMenu from '@/api/useApiMenu'
import BInputNumFormat from '@/base-components/BInputNumFormat.vue'
import { useVuelidate, type ValidationArgs } from '@vuelidate/core'
import { required, helpers } from '@vuelidate/validators'
import useApiMenuCtg from '@/api/useApiMenuCtg'

// 주문 화면 다음으로 이동될 화면
// 가게, 카테고리 목록은 store에 저장된 데이터 사용
const menuStore = useMenuStore()
const apiMenuCtg = useApiMenuCtg()
const apiMenu = useApiMenu()
const Swal = useSwal()
const router = useRouter()
const routeQuery = useRoute().query

onMounted(async () => {
    if (menuStore.items.length == 0) {
        menuStore.items = await apiMenu.selectList()
        menuStore.categories = await apiMenuCtg.selectList()
    }

    if (props.seq) {
        origin.value = menuStore.items.find((item) => item.seq == props.seq)

        if (origin.value == null) {
            router.back()
        } else {
            menu.value = _.cloneDeep(origin.value)
        }
    }

    if (routeQuery) {
        if ('ctgSeq' in routeQuery && typeof routeQuery.ctgSeq == 'string') {
            menu.value.ctgSeq = +routeQuery.ctgSeq
        }
    }
})

const ctgs = ref<MenuCategoryEntity[]>([])
apiMenuCtg.selectList().then((res) => {
    ctgs.value = res
})

interface Props {
    seq?: string | number
}

const props = defineProps<Props>()
const cIsUpdate = computed(() => (props.seq ? true : false))
const origin = ref<MenuEntity>()
const cText = computed(() => (cIsUpdate.value ? '수정' : '등록'))
const cDisabled = computed(() => cIsUpdate.value && _.isEqual(origin.value, menu.value))

const menu = ref({ name: '', price: 0 } as MenuEntityCreation)

const oMenuProp: { [k in keyof MenuEntityCreation]: { label: string } } = {
    ctgSeq: { label: '카테고리' },
    name: { label: '메뉴명' },
    abv: { label: '메뉴명(축약)' },
    price: { label: '가격' },
    cmt: { label: '비고' },
}

const rules = {
    ctgSeq: {
        required: helpers.withMessage(`${oMenuProp.ctgSeq.label}를 선택해주세요.`, required),
    },
    name: {
        required: helpers.withMessage(`${oMenuProp.name.label}을 입력해주세요.`, required),
    },
    price: {
        required: helpers.withMessage(`${oMenuProp.price.label}을 입력해주세요.`, required),
    },
} as ValidationArgs<MenuEntityCreation>
const v$ = useVuelidate(rules, menu)

// TODO validate와 input focus를 같이 할 수 있는 방법 찾기
async function validate() {
    if ((await v$.value.$validate()) == false) return false
    if (cIsUpdate.value == false) return menuStore.items.every((item) => item.name != menu.value.name)
    return true
}

async function onSave() {
    if ((await validate()) == false) {
        const message = v$.value.$silentErrors[0]?.$message ?? '동일한 메뉴명이 존재합니다.'
        Swal.fireCustom({ toast: true, title: message, icon: 'warning' })
        return
    }

    // 수정
    if (cIsUpdate.value) {
        const uMenu = await apiMenu.update(menu.value as MenuEntity)
        const tgt = menuStore.items.find((item) => item.seq == uMenu.seq)
        if (tgt) Object.assign(tgt, uMenu)

        Swal.fireCustom({ toast: true, messageType: 'update' })

        // 등록
    } else {
        if (menu.value.abv == null) menu.value.abv = menu.value.name.slice(0, 2)
        const nMenu = await apiMenu.create(menu.value)
        menuStore.items.push(nMenu)

        Swal.fireCustom({ toast: true, messageType: 'save' })
    }

    router.back()
}

async function onRemove() {
    if (props.seq && (await Swal.fireCustom({ isConfirm: true, messageType: 'remove' }))) {
        await apiMenu.remove(+props.seq)
        _.remove(menuStore.items, (item) => item.seq == props.seq)

        Swal.fireCustom({ toast: true, messageType: 'remove' })
        router.back()
    }
}

function onCancel() {
    router.back()
}
</script>

<template>
    <section class="menu-view">
        <section class="wrapper g-form">
            <section class="top">{{ `메뉴 ${cText}` }}</section>
            <section class="content">
                <div class="row">
                    <span class="label required">{{ oMenuProp.ctgSeq.label }}</span>
                    <v-select v-model="menu.ctgSeq" :items="ctgs" item-value="seq" item-title="name" density="comfortable"></v-select>
                </div>
                <div class="row">
                    <span class="label required">{{ oMenuProp.name.label }}</span>
                    <input v-model="menu.name" class="val" type="text" />
                </div>
                <div class="row">
                    <span class="label">{{ oMenuProp.abv!.label }}</span>
                    <input v-model="menu.abv" class="val" type="text" :placeholder="menu.name.slice(0, 2)" />
                </div>
                <div class="row">
                    <span class="label required">{{ oMenuProp.price.label }}</span>
                    <BInputNumFormat v-model="menu.price" class="val"></BInputNumFormat>
                </div>
                <div class="row">
                    <span>{{ oMenuProp.cmt!.label }}</span>
                    <v-textarea v-model="menu.cmt" class="val" rows="1" auto-grow bg-color="#fff" variant="outlined" style="height: fit-content"></v-textarea>
                </div>
            </section>
            <section class="btt">
                <v-btn :disabled="cDisabled" @click="onSave">{{ cText }}</v-btn>
                <v-btn v-if="cIsUpdate" @click="onRemove">삭제</v-btn>
                <v-btn @click="onCancel">취소</v-btn>
            </section>
        </section>
    </section>
</template>

<style lang="scss" scoped>
.menu-view {
    @include center-view;
}
</style>
