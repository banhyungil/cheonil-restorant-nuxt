import useApi from './useApi'

export default function useApiPlaceCtg() {
    const api = useApi()
    const prefix = '/placeCategory'

    const selectList = async () => {
        const res = await api.get(prefix)

        return res.data as PlaceCategoryEntity[]
    }

    const create = async (placeCtg: PlaceCategoryEntityCreation) => {
        const res = await api.post(prefix, placeCtg)

        return res.data as PlaceCategoryEntity
    }

    const update = async (placeCtg: PlaceCategoryEntity) => {
        const res = await api.patch(`${prefix}/${placeCtg.seq}`, placeCtg)

        return res.data as PlaceCategoryEntity
    }

    const remove = (seq: number) => {
        return api.delete(`${prefix}/${seq}`)
    }

    return { selectList, create, update, remove }
}
