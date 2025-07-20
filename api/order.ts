import { format } from 'date-fns'
import api from './'
import qs from 'qs'

export type OrderCURes = Omit<Order, 'payments' | 'store'>
interface Additional {
    payType?: PaymentEntity['payType'][]
    payAt?: PaymentEntity['payAt']
    storeName?: StoreEntity['name']
}

const prefix = '/order'
type OrderWhereInfo = WhereInfo<MyOrderEntity & Additional>

async function selectList(whereInfo: OrderWhereInfo): Promise<{ orders: Order[]; totalCnt: number }>
async function selectList(): Promise<Order[]>
async function selectList(whereInfo?: OrderWhereInfo) {
    const queryStr = qs.stringify(whereInfo)
    const resData = (await api.get(`${prefix}?${queryStr}`)).data as { orders: Order[]; totalCnt: number }

    return whereInfo ? resData : resData.orders
}

/**
 * 정산 목록 조회
 * 당일 결제 + 당일 미수
 */
async function selectListAccount(dateRange: [Date, Date]) {
    const formatted = dateRange.map((date) => format(date, 'yyyy-MM-dd'))
    const resData = (await api.post(`${prefix}/account`, { dateRange: formatted })).data as Order[]

    return resData
}

async function select(seq: number) {
    const res = await api.get(`${prefix}/${seq}`)

    return res.data as Order
}

async function create(order: MyOrderEntityCreation, orderMenues: OrderMenuEntityCreation[]) {
    const res = await api.post(prefix, {
        order,
        orderMenues,
    })
    return res.data as OrderCURes
}

async function update(order: MyOrderEntity, orderMenues: OrderMenuEntityCreation[] = []) {
    const res = await api.patch(`${prefix}/${order.seq!}`, {
        order,
        orderMenues,
    })
    return res.data as OrderCURes
}

async function remove(seq: number) {
    return api.delete(`${prefix}/${seq}`)
}

async function collect(seq: number, payments: PaymentEntityCreation[]) {
    const res = await api.post(`${prefix}/collect/${seq}`, payments)
    return res.data as CollectRes
}

async function collectList(list: CollectListParam[]) {
    const res = await api.post(`${prefix}/collect`, list)
    return res.data as CollectRes[]
}

async function cancelCollect(seq: number) {
    const res = await api.post(`${prefix}/cancelCollect/${seq}`)
    return res.data as CancelCollectRes
}

async function cancelCollectList(seqs: number[]) {
    const res = await api.post(`${prefix}/cancelCollect`, seqs)
    return res.data as CancelCollectRes[]
}

type CollectListParam = { seq: number; payments: PaymentEntityCreation[] }
type CollectRes = { order: MyOrderEntity; payments: PaymentEntity[] }
type CancelCollectRes = { order: MyOrderEntity; paymentSeqs: number[] }

export default {
    selectList,
    selectListAccount,
    select,
    create,
    update,
    remove,
    collect,
    collectList,
    cancelCollect,
    cancelCollectList,
}
