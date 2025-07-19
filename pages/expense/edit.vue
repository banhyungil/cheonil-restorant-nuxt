<script setup lang="ts">
import { today } from '@/utils/common'

const router = useRouter()

interface Props {
    seq?: number | string
}
defineProps<Props>()

function backRoute() {
    router.back()
}
</script>
<template>
    <section class="expense-edit">
        <ExpenseContainer type="EDIT" :seq="seq != null ? +seq : undefined" @cancel="backRoute" @create="backRoute" @update="backRoute"></ExpenseContainer>
    </section>
</template>

<style lang="scss" scoped>
.expense-edit {
}
</style>
