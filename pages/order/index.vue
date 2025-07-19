<script setup lang="ts">
import { useMenuStore } from '@/stores/menuStore'
import { computed, ref, watch } from 'vue'
import _ from 'lodash'
import useApiOrder from '@/api/useApiOrder'
import { useEventListener, useWindowSize } from '@vueuse/core'
import useSwal from '@/composables/useSwal'
import { useRouter } from 'vue-router'
import type MenuTab from '@/components/MenuTab.vue'

const router = useRouter()
const menuStore = useMenuStore()
const selStore = ref<StoreEntity | null>(null)
const apiOrder = useApiOrder()

const Swal = useSwal()
const { width } = useWindowSize()

// tabl localStorage로 저장
type Tab = 'STORE' | 'MENU'
const tab = ref<Tab>('STORE')
// 매장 검색
const storeSrchText = ref('')
// 메뉴 검색
const menuSrchText = ref('')

// 주문 목록 entity는 주문을 할떄 만들어진다
const orderMenues = ref<OrderMenuEntityCreation[]>([])
type PartialOrder = PartialK<MyOrderEntity, 'storeSeq'>
const order = ref({ amount: 0, status: 'READY' } as PartialOrder)
const originOrder = ref<Order>()
const cIsUpdated = computed(() => {
    return selStore.value?.seq != originOrder.value?.store.seq || _.isEqualWith(orderMenues.value, originOrder.value?.orderMenues) == false
})

watch(
    () => router.currentRoute.value.params.seq,

    async () => {
        // 주문 수정 시
        if (router.currentRoute.value.path.includes('/order') && router.currentRoute.value.params.seq) {
            const { seq } = router.currentRoute.value.params
            originOrder.value = await apiOrder.select(+seq)

            if (originOrder.value == null) {
                Swal.fireCustom({ toast: true, text: '잘못된 경로입니다.', icon: 'warning' })
                router.push('/order')
            } else {
                const clone = _.cloneDeep(originOrder.value)
                order.value = clone
                selStore.value = clone.store
                orderMenues.value = clone.orderMenues
            }

            tab.value = 'MENU'
        }
    },
    { immediate: true }
)
const cIsUpdateView = computed(() => router.currentRoute.value.params.seq != null)

watch(
    orderMenues,
    () => {
        const delIdx = orderMenues.value.findIndex((om) => om.cnt === 0)
        if (delIdx >= 0) orderMenues.value.splice(delIdx, 1)
    },
    { deep: true }
)

const cTotalAmount = computed(() => {
    return _.sum(orderMenues.value.map((om) => om.price * om.cnt))
})

function onChoiceStore(store: StoreEntity) {
    selStore.value = store
    order.value.storeSeq = selStore.value.seq

    tab.value = 'MENU'
}

function onChoiceMenu(menu: MenuEntity) {
    // menu 가 존재하면 수량만 증가
    // 없으면 메뉴 추가
    const orderMenu = orderMenues.value?.find((om) => om.menuSeq == menu.seq)
    if (orderMenu) {
        ++orderMenu.cnt
    } else {
        orderMenues.value.push({
            menuSeq: menu.seq,
            cnt: 1,
            price: menu.price,
        })
    }
}

function unSelectStore() {
    tab.value = 'STORE'
    selStore.value = null
    order.value.storeSeq = undefined
}

useEventListener(document, 'keyup', (e) => {
    if (e.key == 'Escape') {
        unSelectStore()
    }
})

function validate(order: PartialOrder): order is MyOrderEntity {
    return order.storeSeq ? true : false
}
async function onComplete() {
    if (validate(order.value) == false) return

    order.value.amount = cTotalAmount.value

    if (router.currentRoute.value.params.seq) {
        // 신규 추가 메뉴는 기존 주문 seq를 삽입
        orderMenues.value.forEach((om) => (om.orderSeq = order.value.seq))

        await apiOrder.update(order.value, orderMenues.value)
        Swal.fireCustom({ toast: true, messageType: 'update' })
        router.back()
    } else {
        await apiOrder.create(order.value, orderMenues.value)
        Swal.fireCustom({ toast: true, messageType: 'save' })
    }
    init()
}

const menuTabComp = ref() as Ref<InstanceType<typeof MenuTab>>
function init() {
    order.value = { amount: 0 } as MyOrderEntity
    orderMenues.value = []
    tab.value = 'STORE'
    selStore.value = null
    menuSrchText.value = ''
    menuTabComp.value.selCtg = null
}

// 매장및 메뉴에 즐겨찾기 등록을하는 경우 순서 지정은...boolean으로 하면 순서지정은안됨.
// 아니면 즐겨찾기가 아니라 order을 만들까그냥..?그럼 setting으로 똑같이?
// 순서는 어떻게 ?? 그냥 리스트 순으로할까... 바꿀수 있게도 할까..
</script>

<template>
    <div class="order-view">
        <section class="left">
            <StoreTab v-show="tab == 'STORE'" v-model:srch-text="storeSrchText" :focus-srch="tab == 'STORE'" @select-item="onChoiceStore" />
            <MenuTab v-show="tab == 'MENU'" ref="menuTabComp" v-model:srch-text="menuSrchText" :focus-srch="tab == 'MENU'" @select-item="onChoiceMenu" />
        </section>
        <section class="right">
            <section class="top">
                <v-btn class="store-name" :color="selStore ? 'primary' : undefined" @click="unSelectStore">
                    {{ selStore?.name ?? '미지정' }}
                </v-btn>
                <button class="chi tw-absolute tw-right-2 tw-w-10" style="border: 1px solid #bababa" @click="init">
                    <font-awesome-icon :icon="['fas', 'rotate-left']" />
                </button>
            </section>
            <section class="content">
                <ul class="orders">
                    <!-- 주문 목록을 표시, 주문 목록 정보 객체를 만들어야함 -->
                    <li v-for="(om, idx) in orderMenues" :key="idx" class="c-item">
                        <div class="main">
                            <!-- price 반응형 레이아웃 적용 -->
                            <div class="c-title">
                                <span class="name">{{ menuStore.dict[om.menuSeq]?.name }}</span>
                                <span v-if="width < 1024" style="float: right">{{ ` ${om.price.toLocaleString('ko-KR')}` }}</span>
                            </div>
                            <div class="c-cnt-btn">
                                <v-btn class="hover" @click="() => om.cnt++">
                                    <font-awesome-icon :icon="['fas', 'plus']" />
                                </v-btn>
                                <!-- <button @click="onUp(om)">+</button> -->
                                <input v-model="om.cnt" class="box-shadow" type="number" />
                                <v-btn class="hover" @click="() => om.cnt--">
                                    <font-awesome-icon :icon="['fas', 'minus']" />
                                </v-btn>
                            </div>
                        </div>
                        <div v-if="width >= 1024" class="sub">{{ (om.price * om.cnt).toLocaleString('ko-KR') }}</div>
                    </li>
                </ul>
                <div class="c-total">
                    <span>총 금액: {{ cTotalAmount.toLocaleString('ko-KR') }}</span>
                </div>
            </section>
            <section class="btt">
                <v-btn
                    v-if="cIsUpdateView == false"
                    class="complete"
                    :class="{ update: cIsUpdateView }"
                    color="primary"
                    :disabled="order.storeSeq == null || orderMenues.length < 1"
                    @click="onComplete"
                >
                    {{ cIsUpdateView ? '수정완료' : '주문완료' }}
                </v-btn>
                <template v-else>
                    <v-btn
                        class="update"
                        :class="{ update: cIsUpdateView }"
                        color="primary"
                        :disabled="order.storeSeq == null || orderMenues.length < 1 || cIsUpdated == false"
                        @click="onComplete"
                    >
                        {{ cIsUpdateView ? '수정완료' : '주문완료' }}
                    </v-btn>
                    <v-btn class="update" :class="{ update: cIsUpdateView }" color="warning" @click="() => router.back()"> 수정취소 </v-btn>
                </template>
            </section>
        </section>
    </div>
</template>

<style lang="scss">
.order-view {
    display: flex;
    height: 100%;
    column-gap: 10px;

    @include vueSlide(100%);

    .left {
        width: 60vw;
        height: 100%;
        border: 1px solid #000;

        .top {
        }
        .ctgs {
        }
        .grid {
            gap: 20px;
            grid-template-columns: repeat(4, minmax(170px, 1fr));
        }
    }
    .right {
        display: grid;
        grid-template-rows: minmax(60px, 10vh) 1fr minmax(60px, 10vh);
        width: calc(100% - 60vw);
        height: 100%;
        border: 1px solid #000;
        @apply tw-shadow-xl;

        .top {
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;

            button.store-name {
                width: 55%;
                height: 55%;
                font-weight: bold;
            }
        }

        .content {
            display: flex;
            flex-direction: column;
            overflow: hidden;
            padding: 10px;
            margin: 0 10px;
            border-top: 1.7px solid grey;
            border-bottom: 1.7px solid grey;

            .orders {
                display: flex;
                flex-direction: column;
                row-gap: 10px;
                height: 100%;
                overflow-y: auto;
                padding: 0 2px;
                // scrollbar 생길 때 border를 만나면 box가 일그러져 보여 일단 안보이게 처리
                // scrollbar-width: none;

                list-style-type: none;

                .c-item {
                    display: flex;
                    flex-direction: column;
                    row-gap: 6px;
                    border: 1px solid grey;
                    padding: 18px;

                    .main {
                        display: flex;
                        justify-content: space-between;

                        .c-title {
                            width: 100%;
                            display: flex;
                            justify-content: space-around;
                            .name {
                                font-weight: bold;
                            }
                        }

                        .c-cnt-btn {
                            display: flex;
                            column-gap: 12px;
                            justify-content: center;
                            align-items: center;

                            input[type='number'] {
                                width: 40px;
                                height: 32px;
                                text-align: center;
                            }

                            button {
                                width: 40px;
                                height: 32px;
                            }
                        }
                    }
                    .sub {
                        display: flex;
                        justify-content: end;
                    }
                }
            }
            .c-total {
                display: flex;
                justify-content: end;
                font-weight: bold;
            }
        }
        .btt {
            display: flex;
            align-items: center;
            justify-content: center;

            button.complete {
                width: 55%;
                height: 55%;
                padding: 10px;

                font-weight: bold;

                &:hover {
                    background-color: var(--color-point);
                    color: #fff;
                }
            }
            button.update {
                &:hover {
                    background-color: var(--color-success);
                    color: #fff;
                }
            }
        }
    }
}
input {
    background-color: #fff;
}

@media screen and (max-width: 1024px) {
    .order-view {
        .right {
            .content {
                .orders {
                    .c-item {
                        .main {
                            flex-direction: column;
                            align-items: center;
                            row-gap: 10px;
                        }
                    }
                }
            }
        }
    }
}
</style>
