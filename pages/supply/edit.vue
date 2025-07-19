<script setup lang="ts">
import useSwal from '@/composables/useSwal'
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import _ from 'lodash'
import { helpers, required } from '@vuelidate/validators'
import { useVuelidate, type ValidationArgs } from '@vuelidate/core'
import type UnitEditPop from '@/components/UnitEditPop.vue'

const Swal = useSwal()
const router = useRouter()
const apiSupply = useApiSupply()
const apiUnit = useApiUnit()

const originSupply = ref<SupplyEntity>()
const supply = reactive({} as SupplyEntity)
const supplies = ref<SupplyEntity[]>([])
const units = ref<UnitEntity[]>([])

interface Props {
    // routerParam
    seq?: string
}
const props = defineProps<Props>()

if (props.seq) {
    apiSupply.select(+props.seq).then((res) => {
        originSupply.value = _.cloneDeep(res)
        Object.assign(supply, res)
    })
}

apiUnit.selectList().then((res) => {
    units.value = res
})

apiSupply.selectList().then((res) => {
    supplies.value = res
})

const cIsUpdateView = computed(() => (props.seq ? true : false))
const cIsUpdated = computed(() => _.isEqual(supply, originSupply.value) == false)
const cText = computed(() => (cIsUpdateView.value ? '수정' : '등록'))
const LABEL_INFO = {
    name: '명칭',
}
const rules = {
    name: {
        required: helpers.withMessage(`${LABEL_INFO.name}을 선택해주세요.`, required),
    },
} as ValidationArgs<SupplyEntityCreation>
const v$ = useVuelidate(rules, supply, { $autoDirty: true })

async function validate() {
    if ((await v$.value.$validate()) == false) {
        Swal.fireCustom({ toast: true, messageType: 'error', title: '', text: v$.value.$errors[0].$message.toString() })
        return false
    } else if (cIsUpdateView.value == false && supplies.value.some((supl) => supl.name == supply.name)) {
        Swal.fireCustom({ toast: true, messageType: 'error', title: '', text: '이미 등록된 식자재입니다.' })
        return false
    }

    return true
}

async function onSave() {
    if ((await validate()) == false) return

    if (cIsUpdateView.value) {
        await apiSupply.update(supply)
        Swal.fireCustom({ toast: true, messageType: 'save' })
    } else {
        await apiSupply.create(supply)
        Swal.fireCustom({ toast: true, messageType: 'save' })
    }

    router.back()
}

function onCancel() {
    router.back()
}
</script>
<template>
    <section class="place-ctg-view">
        <section class="wrapper g-form">
            <section class="top">{{ `식자재 ${cText}` }}</section>
            <section class="content">
                <div class="row">
                    <span class="label">{{ LABEL_INFO.name }}</span>
                    <VTextField v-model="supply.name" type="text" density="compact" :hide-details="true" style="height: 45px"></VTextField>
                </div>
            </section>
            <section class="btt">
                <v-btn :disabled="cIsUpdated == false" @click="onSave">{{ cText }}</v-btn>
                <v-btn color="warning" @click="onCancel">취소</v-btn>
            </section>
        </section>
    </section>
</template>

<style lang="scss" scoped>
.place-ctg-view {
    @include center-view;

    .plus-btn {
        min-width: 0;
        width: 38px;
    }

    .chips {
        display: flex;
        justify-content: end;
    }
}
</style>
