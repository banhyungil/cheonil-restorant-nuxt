import useApi from './useApi'

export default function useApiMenuCtg() {
    const api = useApi()
    const prefix = '/menuCategory'

    const selectList = async () => {
        const res = await api.get(prefix)

        return res.data as MenuCategoryEntity[]
    }

    const create = async (menuCtg: MenuCategoryEntityCreation) => {
        const res = await api.post(prefix, menuCtg)
        return res.data as MenuCategoryEntity
    }

    const update = async (menuCtg: MenuCategoryEntity) => {
        const res = await api.patch(`${prefix}/${menuCtg.seq}`, menuCtg)
        return res.data as MenuCategoryEntity
    }

    const remove = (seq: number) => {
        return api.delete(`${prefix}/${seq}`)
    }

    return { selectList, create, update, remove }
}
