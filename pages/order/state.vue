<script setup lang="ts">
import useApiOrder from '@/api/useApiOrder'
import { ref } from 'vue'
import { format, differenceInSeconds, toDate, differenceInMinutes } from 'date-fns'
import { useNow, useStorage } from '@vueuse/core'
import useSwal from '@/composables/useSwal'
import { useRouter } from 'vue-router'
import _ from 'lodash'
import { Dropdown } from 'floating-vue'
import useWebSocket from '@/api/useWebSocket'

const WS = useWebSocket()
const apiOrder = useApiOrder()
const orders = ref<Order[]>([])
const completeOrders = ref<Order[]>([])
const dLoading = ref<Record<string, boolean>>({})
const router = useRouter()
const ELPASED_MINUES_INFO = [
    {
        title: 'caution',
        minute: 15,
    },
    {
        title: 'warning',
        minute: 25,
    },
    {
        title: 'danger',
        minute: 35,
    },
]

apiOrder.selectList({ whereOptions: { status: { eq: 'READY' } } }).then((list) => {
    orders.value = list.orders
})

apiOrder.selectList({ whereOptions: { status: { eq: 'COOKED' }, orderAt: { gte: toDate(new Date().setHours(0, 0, 0, 0)) } }, limit: 10 }).then((res) => {
    completeOrders.value = res.orders
})

WS.listen('/api/order', 'POST', async (sync) => {
    const nOrder = await apiOrder.select(sync.resBody.seq)
    orders.value.push(nOrder)
})

WS.listen('/api/order', 'PATCH', async (sync) => {
    if (sync.resBody.status == 'COOKED') {
        const tgtOrder = _.remove(orders.value, (od) => od.seq == sync.resBody.seq)[0] ?? (await apiOrder.select(sync.resBody.seq))
        Object.assign(tgtOrder, sync.resBody)

        completeOrders.value.splice(0, 0, tgtOrder)
    } else if (sync.resBody.status == 'READY') {
        _.remove(completeOrders.value, (od) => od.seq == sync.resBody.seq)
        _.remove(orders.value, (od) => od.seq == sync.resBody.seq)

        orders.value.push(await apiOrder.select(sync.resBody.seq))
        orders.value = _.orderBy(orders.value, ['orderAt'])
    }
})

WS.listen('/api/order', 'DELETE', (sync) => {
    _.remove(orders.value, (od) => od.seq == +sync.routeParams.seq)
    _.remove(completeOrders.value, (od) => od.seq == +sync.routeParams.seq)
})

const Swal = useSwal()

async function onComplete(order: Order) {
    dLoading.value[order.seq!] = true

    order.status = 'COOKED'
    const data = {
        seq: order.seq,
        status: order.status,
        cookedAt: new Date(),
    } as MyOrderEntity

    await apiOrder.update(data)
    Swal.fireCustom({ toast: true, title: '주문이 처리되었습니다.', icon: 'success' })

    dLoading.value[order.seq!] = false
}

async function onUnComplete(order: Order) {
    dLoading.value[order.seq!] = true

    order.status = 'READY'
    const data = {
        seq: order.seq,
        status: order.status,
        cookedAt: new Date(),
    } as MyOrderEntity

    await apiOrder.update(data)
    _.remove(completeOrders.value, order)

    dLoading.value[order.seq!] = false
}

const now = useNow()
function formatTime(second: number) {
    return `${Math.floor(second / 60)}분${second % 60}초`
}

function onUpdate(orderSeq: number) {
    router.push(`/order/${orderSeq}`)
}

async function onRemove(orderId: number) {
    if (await Swal.fireCustom({ isConfirm: true, messageType: 'remove' })) {
        apiOrder.remove(orderId)

        Swal.fireCustom({ toast: true, messageType: 'remove' })
    }
}

const isDisplaykitchen = useStorage('isDisplaykitchen', false, sessionStorage)

function isDisplayTime(order: Order) {
    return isDisplaykitchen.value == false || differenceInMinutes(now.value, order.orderAt!) > ELPASED_MINUES_INFO[0].minute
}

/**
 * 경과 시간에 따른 class 목록 반환
 */
function getElapsedClass(order: Order) {
    const elapsedMinute = differenceInMinutes(now.value, order.orderAt!)
    const idx = _.findIndex(ELPASED_MINUES_INFO, (item) => item.minute >= elapsedMinute)

    const result = []
    const info = (() => {
        if (idx == 0) return ELPASED_MINUES_INFO[idx]
        else if (idx > 0) return ELPASED_MINUES_INFO[idx - 1]
        else return _.last(ELPASED_MINUES_INFO)
    })()

    if (info) result.push(info.title)
    if (differenceInSeconds(now.value, order.orderAt!) < 60) result.push('new')

    return result
}

function toggleDisplayKitchen() {
    isDisplaykitchen.value = !isDisplaykitchen.value
}
</script>

<template>
    <div class="order-state-view" :class="{ kitchen: isDisplaykitchen }">
        <div class="tw-flex tw-justify-end">
            <v-btn :color="isDisplaykitchen ? 'primary' : ''" class="kitchen" style="height: 24px" @click="toggleDisplayKitchen"> 주방용 </v-btn>
        </div>
        <div class="react-grid-col ready">
            <TransitionGroup name="slide">
                <div v-for="order in orders" :key="order.seq" class="item c-order" :class="getElapsedClass(order)">
                    <div class="store">
                        <span>{{ order.store.name }}</span>
                        <Dropdown class="c-choice">
                            <button class="choice">
                                <font-awesome-icon :icon="['fas', 'ellipsis-vertical']" />
                            </button>
                            <template #popper>
                                <div class="c-btn">
                                    <button class="update" @click="onUpdate(order.seq!)">수정</button>
                                    <button class="remove" @click="onRemove(order.seq!)">삭제</button>
                                </div>
                            </template>
                        </Dropdown>
                    </div>
                    <div class="menues">
                        <div v-for="(om, idx) in order.orderMenues" :key="om.menuSeq" class="text" style="font-weight: bold; margin: 2px">
                            <span>{{ `${om.menu.abv ?? om.menu.name} ${om.cnt}` }}</span>
                            <span v-if="idx < order.orderMenues.length - 1">,</span>
                        </div>
                    </div>
                    <div v-if="order.cmt">{{ `요청사항: ${order.cmt}` }}</div>
                    <div v-if="isDisplayTime(order)" class="time">
                        <span v-if="isDisplaykitchen == false" v-tooltip="'주문접수시간'" class="order-time">
                            <font-awesome-icon :icon="['fas', 'timer']" />
                            {{ order.orderAt ? format(order.orderAt, 'hh:mm aa') : null }}
                        </span>
                        <span class="elapsed"> {{ `${formatTime(differenceInSeconds(now, order.orderAt!))}` }}</span>
                    </div>
                    <v-btn v-if="isDisplaykitchen == false" class="complete" :loading="dLoading[order.seq!]" @click="onComplete(order)">완료</v-btn>
                </div>
            </TransitionGroup>
        </div>
        <!-- 
      주문처리완료 목록
    -->
        <div v-if="isDisplaykitchen == false" class="c-completed">
            <div class="title">주문완료 목록</div>
            <div class="react-grid-col cooked">
                <TransitionGroup name="slide">
                    <div v-for="order in completeOrders" :key="order.seq" class="item c-order">
                        <div class="store">
                            <span>{{ order.store.name }}</span>
                        </div>
                        <div class="menues">
                            <div v-for="(om, idx) in order.orderMenues" :key="om.menuSeq" class="text">
                                <span>{{ `${om.menu.abv ?? om.menu.name} ${om.cnt}` }}</span>
                                <span v-if="idx < order.orderMenues.length - 1">, </span>
                            </div>
                        </div>
                        <div v-if="order.cmt">{{ `요청사항: ${order.cmt}` }}</div>
                        <div v-tooltip="'완료시간'" class="time">
                            <span class="order-time" style="color: var(--color-point)">
                                <font-awesome-icon :icon="['fas', 'timer']" />
                                {{ order.cookedAt ? format(order.cookedAt, 'hh:mm aa') : null }}
                            </span>
                        </div>
                        <v-btn class="complete" style="background-color: var(--color-danger)" :loading="dLoading[order.seq!]" @click="onUnComplete(order)"
                            >완료 취소</v-btn
                        >
                    </div>
                </TransitionGroup>
            </div>
        </div>
    </div>
</template>

<style lang="scss" scoped>
.order-state-view {
    display: grid;
    grid-template-rows: max-content 1fr 280px;
    height: calc(100vh - 60px - 40px - 20px);
    font-weight: bold;

    button.kitchen {
        &:hover {
            border: 1px solid var(--color-point);
            color: var(--color-point);
            transition: all 0.1s ease-in-out;
        }
    }

    &.kitchen {
        @apply tw-text-6xl;

        @media screen and (max-height: 1000px) {
            @apply tw-text-lg;
        }

        .c-order {
            .time {
                @apply tw-text-2xl;
            }
        }
    }

    .react-grid-col {
        $item-min-width: 240px;

        display: grid;
        grid-template-columns: repeat(5, 1fr);
        gap: 12px;
        height: 100%;
        padding: 4px;

        overflow-y: auto;
        overflow-x: hidden;

        &::-webkit-scrollbar {
            width: 0;
        }

        &.ready {
            grid-template-rows: repeat(3, 1fr);
        }

        button.complete {
            height: max-content;
            padding: 8px;
        }

        &.cooked {
            max-width: 100%;
            grid-auto-flow: column;
            height: 100%;

            overflow-x: auto;
            &::-webkit-scrollbar {
                width: 0;
            }

            & > .item {
                margin-bottom: 10px;
            }
        }

        @media screen and (max-width: 1024px) {
            grid-template-columns: repeat(3, 1fr);
        }

        @media screen and (max-width: 768px) {
            grid-template-columns: repeat(1, 1fr);
        }

        .c-order {
            display: flex;
            align-items: center;
            flex-direction: column;
            row-gap: 6px;
            box-shadow: var(--box-shadow);
            min-width: $item-min-width;

            & > * {
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .store {
                position: relative;
                display: flex;
                align-items: center;
                justify-content: center;
                width: 100%;
                text-align: center;
                padding: 10px;
                font-weight: bold;
                color: #fff;
                background-color: #646464;

                .c-choice {
                    position: absolute;
                    right: 4px;

                    button.choice {
                        padding: 0 14px;

                        &:hover {
                            color: rgb(81 81 81);
                        }
                    }
                }
            }
            .menues {
                flex-grow: 1;
                display: flex;
                flex-wrap: wrap;
                margin: 10px 0;
            }

            .time {
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                margin: 10px 0;

                .order-time {
                }
                .elapsed {
                    margin-left: 4px;
                    color: var(--color-success);
                }
            }

            button.complete {
                width: 100%;
                text-align: center;
                background-color: var(--color-point);
                color: #fff;
            }

            &.caution {
            }

            &.new {
                .store {
                    background-color: var(--color-success);
                    animation: ani-blink 2s infinite;
                }
            }

            &.warning {
                .store {
                    background-color: var(--color-warning);
                }
            }

            &.danger {
                .store {
                    background-color: var(--color-danger);
                }
            }
        }
    }

    .c-completed {
        display: grid;
        grid-template-rows: max-content 1fr;
        overflow: hidden;

        .title {
            width: 100%;
            min-width: 140px;
            padding: 8px;
            color: #fff;
            background-color: #525252;
            opacity: 0.9;
            margin-bottom: 10px;
            font-size: 1.2em;
            font-weight: bold;
        }
    }

    &.kitchen {
        grid-template-rows: max-content 1fr;
    }
}

.v-popper__popper {
    .c-btn {
        display: flex;
        flex-direction: column;

        button {
            padding: 10px 14px;
            border-bottom: 1px solid grey;
            &:hover {
                color: #fff;
            }
            &.update:hover {
                background-color: var(--color-success);
            }
            &.remove:hover {
                background-color: var(--color-danger);
            }
        }
    }
}
</style>
