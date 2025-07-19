import useApi from './useApi'

// url
// post
export default function useApiMenu() {
    const api = useApi()
    const prefix = '/menu'

    const selectList = async () => {
        const res = await api.get(prefix, {
            data: '',
        })

        return res.data as MenuEntity[]
    }

    const select = async (seq: number) => {
        const res = await api.get(`${prefix}/${seq}`, {
            data: '',
        })

        return res.data as MenuEntity
    }

    const create = async (menu: MenuEntityCreation) => {
        const res = await api.post(prefix, menu)
        return res.data as MenuEntity
    }

    const update = async (menu: MenuEntity) => {
        const res = await api.patch(`${prefix}/${menu.seq}`, menu)
        return res.data as MenuEntity
    }

    const remove = (seq: number) => {
        return api.delete(`${prefix}/${seq}`)
    }

    return { selectList, select, create, update, remove }
}
