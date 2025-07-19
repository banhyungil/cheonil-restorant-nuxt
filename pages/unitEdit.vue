<script setup lang="ts">
import useSwal from '@/composables/useSwal'
import { ref, type Ref } from 'vue'
import { useRouter } from 'vue-router'
import _ from 'lodash'
import { helpers, required } from '@vuelidate/validators'
import { useVuelidate, type ValidationArgs } from '@vuelidate/core'
import type { VDataTable } from 'vuetify/components'
import { PAGE_SIZE_LIST } from '@/composables/usePagination'

const router = useRouter()
const Swal = useSwal()
const apiUnit = useApiUnit()
const apiProduct = useApiProduct()
const products = ref<ProductEntity[]>([])

const unit = reactive({ name: '' } as UnitEntity)
const units = ref<UnitEntity[]>([])

apiUnit.selectList().then((res) => {
    units.value = res
})
apiProduct.selectList({ expands: ['prdInfo'] }).then((res) => {
    products.value = res
})

const cIsUpdate = computed(() => !!unit.seq)

const REQUIRED_KEYS = ['name'] as const
const LBL = {
    name: '단위',
}
const reqRules = REQUIRED_KEYS.reduce((result, key) => {
    result[key] = {
        required: helpers.withMessage(`${LBL[key]}를 입력해주세요.`, required),
    }
    return result
}, {} as any)
const rules = {
    ...reqRules,
} as ValidationArgs<UnitEntity>
const v$ = useVuelidate(rules, unit, { $autoDirty: true })

async function validate(action: 'C' | 'U') {
    if ((await v$.value.$validate()) == false) {
        Swal.fireCustom({ toast: true, messageType: 'error', title: '', text: v$.value.$errors[0].$message.toString() })
        return false
    } else if (
        (action == 'C' && units.value.some((u) => u.name == unit.name)) ||
        (action == 'U' && units.value.some((u) => u.seq != unit.seq && u.name == unit.name))
    ) {
        Swal.fireCustom({ toast: true, messageType: 'error', title: '', text: '이미 등록된 단위 입니다.' })
        return false
    }

    return true
}
async function onCreate() {
    if ((await validate('C')) == false) return

    // 검증
    const nUnit = await apiUnit.create(unit)
    units.value.push(nUnit)

    Swal.fireCustom({ toast: true, messageType: 'save' })
}

async function onUpdateSave() {
    if ((await validate('U')) == false) return

    // 검증
    await apiUnit.update(unit)
    const uUnit = units.value.find((u) => u.seq == unit.seq)
    if (uUnit) Object.assign(uUnit, unit)

    Swal.fireCustom({ toast: true, messageType: 'save' })
}

function onUpdate(seq: number) {
    Object.assign(
        unit,
        units.value.find((unit) => unit.seq == seq)
    )
}

function onCancelUpdate() {
    Object.assign(unit, { seq: null, name: '', isUnitCnt: null })
}

const cUnitTotalCnt = computed(() => units.value.length)
const pageSize = ref<number>(PAGE_SIZE_LIST[0])
const { pageNo, cOffset, cTotalPage } = usePagination(cUnitTotalCnt, pageSize)
watch(pageNo, () => {
    window.scrollTo(0, 0)
})

const headers = ref([
    { title: '순번', key: 'no', sortable: false, align: 'start', width: '60px' },
    { title: '단위', key: 'unit', align: 'center' },
    { title: 'Actions', key: 'actions', align: 'center', sortable: false },
]) as Ref<NonNullable<Mutable<VDataTable['$props']['headers']>>>

const cDtProducts = computed(() =>
    units.value.map((unit, idx) => {
        return {
            ...unit,
            no: cOffset.value + idx + 1,
            unit: (unit.isUnitCnt ? '+' : '') + unit.name,
            actions: unit.seq,
        }
    })
)

async function onRemove(seq: number) {
    if (products.value.some((prd) => prd.unitSeq == seq)) {
        Swal.fireCustom({ messageType: 'error', title: '관련 제품이 존재합니다.', text: _.uniq(products.value.map((prd) => prd.prdInfo.name)).join(', ') })
        return
    }

    if (await Swal.fireCustom({ isConfirm: true, messageType: 'remove' })) {
        await apiUnit.remove(seq)
        _.remove(units.value, (u) => u.seq == seq)

        Swal.fireCustom({ toast: true, messageType: 'remove' })
    }
}
</script>
<template>
    <section class="place-ctg-view">
        <section class="wrapper g-form">
            <section class="top">
                <span>단위관리</span>
                <VBtn density="compact" style="min-width: 0; width: 36px; border-radius: 14px" color="warning" @click="() => router.back()">X</VBtn>
            </section>
            <section class="content">
                <div>
                    <div class="row">
                        <span class="label">{{ LBL.name }}</span>
                        <VTextField v-model="unit.name" type="text" density="compact" :hide-details="true" style="height: 45px"></VTextField>
                    </div>
                    <div class="tw-flex tw-items-center tw-justify-end">
                        <span>단위수량 유무</span>
                        <VCheckbox v-model="unit.isUnitCnt" density="compact" :hide-details="true"></VCheckbox>
                    </div>
                </div>
            </section>
            <section class="btt" style="border-top: 0; border-bottom: 1px solid grey">
                <template v-if="cIsUpdate">
                    <v-btn style="background-color: var(--color-success)" @click="onUpdateSave">수정</v-btn>
                    <v-btn style="width: max-content; background-color: var(--color-danger)" @click="onCancelUpdate">수정취소</v-btn>
                </template>
                <v-btn v-else @click="onCreate">등록</v-btn>
            </section>
            <v-data-table class="order-list scroll" :headers="headers" :items="cDtProducts" item-value="seq" :items-per-page="0" :hide-default-footer="true">
                <template #item.actions="{ value }">
                    <div style="display: flex; justify-content: center; gap: 10px">
                        <button v-tooltip="'수정'" style="color: var(--color-success)" @click="onUpdate(value)">
                            <font-awesome-icon :icon="['fas', 'pen-to-square']" />
                        </button>
                        <button v-tooltip="'삭제'" style="color: var(--color-danger)" @click="onRemove(value)">
                            <font-awesome-icon :icon="['fas', 'trash']" />
                        </button>
                    </div>
                </template>
                <template #bottom>
                    <div class="c-page">
                        <v-pagination v-show="cTotalPage > 0" v-model="pageNo" lass="page" :length="cTotalPage" :total-visible="5"></v-pagination>
                        <div class="tw-flex tw-justify-between">
                            <h3 style="width: max-content">총: {{ cUnitTotalCnt }} 건</h3>
                            <div style="width: 100px">
                                <v-select
                                    v-model="pageSize"
                                    :items="PAGE_SIZE_LIST"
                                    item-value="key"
                                    item-title="title"
                                    density="comfortable"
                                    :hide-details="true"
                                ></v-select>
                            </div>
                        </div>
                    </div>
                </template>
            </v-data-table>
        </section>
    </section>
</template>

<style lang="scss">
.place-ctg-view {
    @include center-view;

    .top {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .plus-btn {
        min-width: 0;
        width: 38px;
    }

    .chips {
        display: flex;
        justify-content: end;
    }

    .order-list {
        max-height: 50vh;
    }
}
</style>
