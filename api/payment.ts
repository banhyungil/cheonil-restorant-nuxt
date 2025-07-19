import useApi from './useApi'

export default function useApiPayment() {
    const api = useApi()
    const prefix = '/payment'

    async function create(payment: PaymentEntityCreation) {
        const res = await api.post(prefix, payment)

        return res.data as { payment: PaymentEntity; order: MyOrderEntity }
    }

    async function update(payment: PaymentEntity) {
        const res = await api.patch(`${prefix}${payment.seq}`, payment)

        return res.data as PaymentEntity
    }

    async function remove(payemnts: PaymentEntity[]) {
        const res = await api.post(`${prefix}/batch/delete`, payemnts)
        return res.data as { orders: MyOrderEntity[] }
    }

    return { create, update, remove }
}
