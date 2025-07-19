<script setup lang="ts">
import useApiOrder from '@/api/useApiOrder'
import type { Filter } from '@/components/OrderList.vue'
import { PAGE_SIZE_LIST } from '@/composables/usePagination'
import { getDayOfEnd, today } from '@/utils/common'

const apiOrder = useApiOrder()
const orders = ref<Order[]>([])
const totalOrderCnt = ref(0)
const pageSize = ref(PAGE_SIZE_LIST.find((size) => (size ?? 0) > 100) ?? PAGE_SIZE_LIST[0])

const filter = ref({
    orderAtRange: [today(), today()],
} as Filter)

const { pageNo, cOffset } = usePagination(totalOrderCnt, pageSize)

async function search() {
    const statusIn = (filter.value.payType == 'UNPAID' ? ['COOKED'] : ['COOKED', 'PAID']) as Order['status'][]
    const { orderAtRange, payAtRange, storeName } = filter.value
    const payTypes = (() => {
        if (filter.value.payType == 'CARD' || filter.value.payType == 'CASH') return [filter.value.payType]
        else return null
    })() as PaymentEntity['payType'][] | undefined

    const res = await apiOrder.selectList({
        whereOptions: {
            status: { in: statusIn },
            orderAt: orderAtRange ? { between: [orderAtRange[0], getDayOfEnd(orderAtRange[1])] } : undefined,
            payAt: payAtRange ? { between: [payAtRange[0], getDayOfEnd(payAtRange[1])] } : undefined,
            payType: payTypes ? { in: payTypes } : undefined,
            storeName: storeName ? { eq: storeName } : undefined,
        },
        limit: pageSize.value ?? undefined,
        offset: cOffset.value,
    })
    orders.value = res.orders
    totalOrderCnt.value = res.totalCnt
}

watch([pageNo, pageSize], search, { immediate: true, deep: true })
</script>

<template>
    <OrderList
        v-model="orders"
        v-model:filter="filter"
        v-model:page-size="pageSize"
        :page-size-list="PAGE_SIZE_LIST"
        :total-item-cnt="totalOrderCnt"
        title="주문내역"
        class="collection-list-view"
        :active-collection="true"
        :active-summary="true"
        @search="search"
    >
    </OrderList>
</template>

<style lang="scss">
.collection-list-view {
    overflow: hidden;
}
</style>
