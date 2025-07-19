<script setup lang="ts">
import useSwal from '@/composables/useSwal'
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import _ from 'lodash'
import { helpers, required } from '@vuelidate/validators'
import { useVuelidate, type ValidationArgs } from '@vuelidate/core'
import { VNumberInput } from 'vuetify/labs/components'
import { VChip } from 'vuetify/components'

const Swal = useSwal()
const router = useRouter()
const apiSupply = useApiSupply()
const apiProductInfo = useApiProductInfo()
const apiUnit = useApiUnit()
const apiProduct = useApiProduct()

const supplies = ref<SupplyEntity[]>([])
const units = ref<UnitEntity[]>([])
const originProduct = ref<ProductInfoEntity>()
const productInfo = ref({} as ProductInfoCreationEntity)

const selUnit = ref<UnitEntity | null>()
const unitCnt = ref<number | null>(1)

const products = ref<ProductCreationEntity[]>([])

const cSelSupl = computed(() => supplies.value.find((supl) => supl.seq == productInfo.value.suplSeq))

interface Props {
    // routerParam
    seq?: string
}
const props = defineProps<Props>()

apiSupply.selectList().then((res) => {
    supplies.value = res
})
apiUnit.selectList().then((res) => {
    units.value = res
})

if (props.seq) {
    apiProductInfo.select(+props.seq).then((res) => {
        originProduct.value = _.cloneDeep(res)
        productInfo.value = res
        products.value = productInfo.value.products!
    })
}

const cIsUpdateView = computed(() => (props.seq ? true : false))
const cIsUpdated = computed(() => _.isEqual(productInfo.value, originProduct.value) == false && _.isEqual(products.value, originProduct.value) == false)
const cText = computed(() => (cIsUpdateView.value ? '수정' : '등록'))
const LBL = {
    suplSeq: '식자재',
    name: '제품명',
    unit: '단위',
    unitCnt: '단위수량',
}
const rules = {
    productInfo: {
        suplSeq: {
            required: helpers.withMessage(`${LBL.suplSeq}를 선택해주세요.`, required),
        },
        name: {
            required: helpers.withMessage(`${LBL.name}를 선택해주세요.`, required),
        },
    },
    products: { required: helpers.withMessage(`${LBL.unit}를 선택해주세요.`, required) },
} as ValidationArgs<{ productInfo: ProductInfoCreationEntity; products: ProductEntity[] }>
const v$ = useVuelidate(
    rules,
    {
        productInfo,
        products,
    },
    { $autoDirty: true }
)

function onSuplChanged(seq: number) {
    const supl = supplies.value.find((sp) => sp.seq == seq)!
    productInfo.value.name = supl.name
}

function assertPrd(val: any): asserts val is ProductInfoEntity {
    if (productInfo.value.seq == null) throw new Error('not possible')
}
async function onSave() {
    if ((await v$.value.$validate()) == false) {
        Swal.fireCustom({ toast: true, icon: 'error', title: '', text: v$.value.$errors[0].$message.toString() })
        return
    }

    if (cIsUpdateView.value) {
        assertPrd(productInfo.value)
        await apiProductInfo.update(productInfo.value)
        // 단위 맵핑 정보가 변경된 경우
        if (_.isEqual(products.value, originProduct.value?.products) == false) {
            products.value.forEach((prd) => (prd.prdInfoSeq = productInfo.value.seq))

            await apiProduct.deleteProductInfo(productInfo.value.seq)
            await apiProduct.createList(products.value as ProductEntity[])
        }

        Swal.fireCustom({ toast: true, messageType: 'update' })
    } else {
        // 제품정보등록
        const nProduct = await apiProductInfo.create(productInfo.value)

        // 제품 등록
        products.value.forEach((prd) => (prd.prdInfoSeq = nProduct.seq))
        await apiProduct.createList(products.value as ProductEntity[])

        Swal.fireCustom({ toast: true, messageType: 'save' })
    }

    router.back()
}

function onCancel() {
    router.back()
}

function onCntChanged() {
    if (unitCnt.value && isNaN(unitCnt.value)) unitCnt.value = null
}
function addUnit() {
    if (selUnit.value == null) {
        Swal.fireCustom({ title: '', text: '단위를 선택해주세요.', messageType: 'error', showCancelButton: false })
        return
    }
    const { isUnitCnt } = selUnit.value
    if (isUnitCnt) {
        if (unitCnt.value == null) {
            Swal.fireCustom({ title: '', text: '단위 수량을 입력해주세요', messageType: 'error', showCancelButton: false })
            return
        } else if (isNaN(unitCnt.value!)) {
            Swal.fireCustom({ title: '', text: '단위 수량을 올바르게 입력해주세요', messageType: 'error', showCancelButton: false })
            return
        }
    }

    // 단위수량이 있다면 단위수량까지 등록되어있어야함
    const tgtPrd = products.value.find((mpu) => mpu.unitSeq == selUnit.value!.seq)
    if ((isUnitCnt && tgtPrd?.unitCntList?.some((cnt) => cnt == unitCnt.value)) || (isUnitCnt == false && tgtPrd)) {
        Swal.fireCustom({ toast: true, icon: 'error', title: '', text: '이미 등록된 단위입니다.' })
        return
    }

    let product: ProductCreationEntity
    // 신규 등록 단위
    if (tgtPrd == null) {
        product = { unitSeq: selUnit.value.seq } as ProductEntity
        if (isUnitCnt) product.unitCntList = []
        products.value.push(product)
    } else {
        // 기존에 등록된 단위 수량이 있는 단위
        product = tgtPrd
    }

    if (isUnitCnt && unitCnt.value) {
        product.unitCntList!.push(unitCnt.value)
    }

    if (selUnit.value.isUnitCnt == false) selUnit.value = null
}

function openUnitPop() {
    router.push('/unitEdit')
}

type UnitInfo = { name: string; unitCnt?: number; unit: UnitEntity }
function getUnitInfos(mpu: ProductCreationEntity): UnitInfo[] {
    const unit = units.value.find((unit) => unit.seq == mpu.unitSeq)!
    if (unit.isUnitCnt)
        return mpu.unitCntList == null ? [] : mpu.unitCntList?.map((unitCnt) => ({ name: `${unitCnt}${unit.name}`, unitNm: unit.name, unitCnt, unit }))
    else return [{ name: unit.name, unit }]
}

function assertCntList(val: any): asserts val is number[] {
    if (Array.isArray(val) == false) throw new Error('not possible')
}
function onRemoveUnit(unitInfo: UnitInfo, mpu: ProductCreationEntity) {
    // 단위 수량이 없는 경우
    if (unitInfo.name == unitInfo.unit.name) {
        _.remove(products.value, mpu)
    } else {
        assertCntList(mpu.unitCntList)
        _.remove(mpu.unitCntList, (cnt) => cnt == unitInfo.unitCnt)
        if (mpu.unitCntList.length == 0) _.remove(products.value, mpu)
    }
}
</script>
<template>
    <section class="place-ctg-view">
        <section class="wrapper g-form">
            <section class="top">{{ `제품 ${cText}` }}</section>
            <section class="content">
                <div class="row">
                    <span class="label">{{ LBL.suplSeq }}</span>
                    <VSelect
                        v-model="productInfo.suplSeq"
                        :items="supplies"
                        item-title="name"
                        item-value="seq"
                        density="compact"
                        :hide-details="true"
                        @update:model-value="onSuplChanged"
                    >
                    </VSelect>
                </div>
                <div class="row">
                    <span class="label">{{ LBL.name }}</span>
                    <div class="tw-flex tw-w-full tw-items-center">
                        <VTextField v-model="productInfo.name" type="text" density="compact" :hide-details="true" style="height: 45px"></VTextField>
                    </div>
                </div>
                <div class="c-unit">
                    <div class="row">
                        <span class="label">{{ LBL.unit }}</span>
                        <VSelect
                            v-model="selUnit"
                            :disabled="cSelSupl == null"
                            :items="units"
                            item-title="name"
                            item-value="seq"
                            return-object
                            density="compact"
                            :hide-details="true"
                        >
                            <template #append-item>
                                <VBtn color="primary" class="tw-w-full" @click="openUnitPop"
                                    ><span class="tw-mr-2">추가</span><font-awesome-icon :icon="['fas', 'plus']"
                                /></VBtn>
                                <VDivider class="test tw-mt-2 tw-h-4" style="border: 2px solid black"></VDivider>
                            </template>
                        </VSelect>
                        <VNumberInput
                            v-show="selUnit?.isUnitCnt"
                            v-model="unitCnt"
                            control-variant="stacked"
                            :min="1"
                            density="compact"
                            :hide-details="true"
                            style="height: 45px"
                            @update:model-value="onCntChanged"
                        ></VNumberInput>
                    </div>
                    <div>
                        <div class="tw-flex justify-end">
                            <VBtn :disabled="selUnit == null" color="primary" @click="addUnit"><span class="tw-mr">단위 추가</span></VBtn>
                        </div>
                    </div>
                </div>
                <div class="tw-flex tw-flex-wrap tw-gap-3">
                    <template v-for="prd in products" :key="`${prd.prdInfoSeq}-${prd.unitSeq}`">
                        <v-chip
                            v-for="info in getUnitInfos(prd)"
                            :key="info.name"
                            density="compact"
                            closable
                            style="min-width: fit-content; width: fit-content"
                            @click:close="onRemoveUnit(info, prd)"
                        >
                            {{ info.name }}
                        </v-chip>
                    </template>
                </div>
            </section>
            <section class="btt">
                <v-btn :disabled="cIsUpdated == false" @click="onSave">{{ cText }}</v-btn>
                <v-btn @click="onCancel">취소</v-btn>
            </section>
        </section>
    </section>
</template>

<style lang="scss" scoped>
.place-ctg-view {
    @include center-view;

    .c-unit {
        display: flex;
        flex-direction: column;
        gap: 12px;
        border-top: 1px solid grey;
        border-bottom: 1px solid grey;
        padding: 10px 0;
    }
}
</style>
