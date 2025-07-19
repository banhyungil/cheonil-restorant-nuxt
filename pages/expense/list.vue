<script setup lang="ts">
const router = useRouter()

function toEditView(seq?: number) {
    const path = seq ? `/${seq}` : ''
    router.push(`/expenseEdit${path}`)
}
</script>

<template>
    <section class="expense-view">
        <ExpenseContainer type="LIST" @to-edit-view="toEditView"></ExpenseContainer>
    </section>
</template>

<style lang="scss" scoped>
.account-view {
    display: flex;
    flex-direction: column;
    height: 100%;
}
</style>
