import useApi from './useApi'

export default function useApiStore() {
    const api = useApi()
    const prefix = '/store'

    const selectList = async () => {
        const res = await api.get(prefix)

        return res.data as StoreEntity[]
    }

    const create = async (store: StoreEntity) => {
        const res = await api.post(prefix, store)

        return res.data as StoreEntity
    }

    const update = async (store: StoreEntity) => {
        const res = await api.patch(`${prefix}/${store.seq}`, store)

        return res.data as StoreEntity
    }

    const remove = (seq: number) => {
        return api.delete(`${prefix}/${seq}`)
    }

    return { selectList, create, update, remove }
}
