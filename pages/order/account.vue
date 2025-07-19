<script setup lang="ts">
import useApiOrder from '@/api/useApiOrder'
import { today } from '@/utils/common'
import { addDays, format } from 'date-fns'
import { Dropdown } from 'floating-vue'

const apiOrder = useApiOrder()
const orders = ref<Order[]>([])
const totalOrderCnt = ref(0)

type SrchFilter = PaymentEntity['payType'] | 'NOT_PAID' | 'COLLECTION' | null
const srchFilter = ref<SrchFilter>()
const cSrchOrders = computed(() => {
    switch (srchFilter.value) {
        case 'NOT_PAID':
            return orders.value.filter((od) => od.status == 'COOKED')
        case 'CARD':
        case 'CASH':
            return orders.value.filter((od) => od.status == 'PAID' && od.payments.every((pm) => pm.payType == srchFilter.value))
        case 'COLLECTION':
            return cOrdersCollection.value
        default:
            return orders.value
    }
})

function onClickPayType(val: SrchFilter) {
    if (srchFilter.value == val) srchFilter.value = null
    else srchFilter.value = val
}

// 당일 정산
// 당일 결제 + 당일 미수
// 당일 미수 = 당일 주문 + 미결제
const date = ref(today())
watch(
    date,
    () => {
        apiOrder.selectListAccount([date.value, addDays(date.value, 1)]).then((res) => {
            orders.value = res
        })
    },
    { immediate: true }
)

const cOrdersCash = computed(() => orders.value.filter((od) => od.status == 'PAID' && od.payments.every((p) => p.payType == 'CASH')))
const cOrdersCard = computed(() => orders.value.filter((od) => od.status == 'PAID' && od.payments.every((p) => p.payType == 'CARD')))
const cOrdersNotPaid = computed(() => orders.value.filter((od) => od.status == 'COOKED'))
// 회수 주문 목록
const cOrdersCollection = computed(() =>
    orders.value.filter((od) => od.status == 'PAID' && od.payments.some((pay) => format(pay.payAt, 'yyyyMMdd') > format(od.orderAt!, 'yyyyMMdd')))
)
const cTotalAmountNotPaid = computed(() =>
    cOrdersNotPaid.value.reduce((result, od) => {
        result = result + od.amount
        return result
    }, 0)
)

const cTotalAmount = computed(() => {
    return getTotalPayAmount(cOrdersCash.value) + getTotalPayAmount(cOrdersCard.value) + cTotalAmountNotPaid.value - getTotalPayAmount(cOrdersCollection.value)
})

function getPayAmount(payments: PaymentEntity[]) {
    return payments.reduce((result, p) => {
        result = result + p.amount
        return result
    }, 0)
}

function getTotalPayAmount(pOrders: Order[]) {
    return pOrders.reduce((result, od) => {
        result = result + getPayAmount(od.payments)
        return result
    }, 0)
}
</script>

<template>
    <div class="account-view">
        <section class="c-list">
            <OrderList
                v-model="cSrchOrders"
                :total-item-cnt="totalOrderCnt"
                title="주문내역"
                class="list"
                :active-paging="false"
                :active-summary="true"
                :active-filter="false"
            >
                <template #top>
                    <div class="tw-flex tw-flex-col tw-items-center tw-justify-center">
                        <h2 style="margin-bottom: 4px">정산</h2>
                        <div class="tw-flex">
                            <v-btn class="chi" style="min-width: 0; width: 40px; height: 29px" @click="() => (date = addDays(date, -1))">
                                <font-awesome-icon :icon="['fas', 'chevron-left']" />
                            </v-btn>
                            <Dropdown>
                                <template #default="{ shown }">
                                    <button class="chi" style="padding: 2.2px 20px" :color="shown ? 'primary' : ''">
                                        <h3 style="font-size: 1rem"><font-awesome-icon :icon="['fas', 'calendar-days']" /> {{ format(date, 'yy.MM.dd') }}</h3>
                                    </button>
                                </template>
                                <template #popper="{ hide }">
                                    <VueDatePicker
                                        v-model="date"
                                        :format="'yy.MM.dd'"
                                        teleport
                                        :max-date="today()"
                                        :enable-time-picker="false"
                                        auto-apply
                                        locale="ko-KR"
                                        :clearable="false"
                                        inline
                                        @date-update="hide"
                                    />
                                </template>
                            </Dropdown>
                            <v-btn class="chi" style="min-width: 0; width: 40px; height: 29px" @click="() => (date = addDays(date, 1))">
                                <font-awesome-icon :icon="['fas', 'chevron-right']" />
                            </v-btn>
                        </div>
                    </div>
                    <section class="tw-flex tw-flex-col tw-gap-3">
                        <div class="c-btn">
                            <div class="item">
                                <v-btn :base-color="srchFilter == 'CASH' ? 'success' : ''" @click="onClickPayType('CASH')">현금</v-btn>
                                <h3>{{ getTotalPayAmount(cOrdersCash).toLocaleString() }}</h3>
                            </div>
                            <div class="item">
                                <v-btn :base-color="srchFilter == 'CARD' ? 'success' : ''" @click="onClickPayType('CARD')">카드</v-btn>
                                <h3>{{ getTotalPayAmount(cOrdersCard).toLocaleString() }}</h3>
                            </div>
                            <div class="item">
                                <v-btn :base-color="srchFilter == 'NOT_PAID' ? 'success' : ''" @click="onClickPayType('NOT_PAID')">미수</v-btn>
                                <h3>{{ cTotalAmountNotPaid.toLocaleString() }}</h3>
                            </div>
                        </div>
                        <div class="tw-flex tw-items-center tw-justify-end tw-gap-3">
                            <div v-if="cOrdersCollection.length > 0" class="item">
                                <v-btn
                                    v-tooltip="'주문 당일 이후에 결제된 금액'"
                                    :base-color="srchFilter == 'COLLECTION' ? 'success' : ''"
                                    @click="onClickPayType('COLLECTION')"
                                    >회수금</v-btn
                                >
                                <h3>{{ getTotalPayAmount(cOrdersCollection).toLocaleString() }}</h3>
                            </div>
                            <h2
                                v-tooltip="{
                                    content: '회수금 제외',
                                    disabled: cOrdersCollection.length == 0,
                                }"
                                style="color: var(--color-point)"
                                :style="cOrdersCollection.length > 0 ? { cursor: 'help' } : undefined"
                            >
                                당일 매출
                            </h2>
                            <h2>{{ cTotalAmount.toLocaleString() }}</h2>
                        </div>
                    </section>
                </template>
            </OrderList>
        </section>
    </div>
</template>

<style lang="scss">
.account-view {
    display: flex;
    justify-content: center;
    align-items: center;

    h2 {
        font-size: 1.3rem;
    }

    .summary {
        display: flex;
        flex-direction: column;
        justify-content: center;
        gap: 10px;
        width: 200px;
        padding: 10px;

        .row {
            display: flex;
            flex-direction: column;
            row-gap: 6px;

            button {
                width: 100%;
            }
        }
    }

    .c-list {
        width: 100%;
        height: 90vh;
        box-shadow: var(--box-shadow-section);

        .c-btn {
            display: flex;
            justify-content: end;
            gap: 10px;
        }

        .item {
            display: flex;
            align-items: center;
            gap: 6px;

            font-size: 1.1rem;

            & > button {
                width: 80px;
            }
            & > button:hover {
                background-color: var(--color-success);
                color: #fff;
            }
        }
    }
}
</style>
