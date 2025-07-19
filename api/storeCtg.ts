import useApi from './useApi'

export default function useApiStoreCtg() {
    const api = useApi()
    const prefix = '/storeCategory'

    const selectList = async () => {
        const res = await api.get(prefix)

        return res.data as StoreCategoryEntity[]
    }

    const create = async (storeCtg: StoreCategoryEntityCreation) => {
        const res = await api.post(prefix, storeCtg)

        return res.data as StoreCategoryEntity
    }

    const update = async (storeCtg: StoreCategoryEntity) => {
        const res = await api.patch(`${prefix}/${storeCtg.seq}`, storeCtg)

        return res.data as StoreCategoryEntity
    }

    const remove = (seq: number) => {
        return api.delete(`${prefix}/${seq}`)
    }

    return { selectList, create, update, remove }
}
