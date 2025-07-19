export default function useApiUnit() {
    const api = useApi()
    const prefix = '/unit'

    async function selectList() {
        const res = await api.get(prefix)

        return res.data as UnitEntity[]
    }

    async function create(unit: UnitEntity) {
        const res = await api.post(prefix, unit)

        return res.data as UnitEntity
    }

    async function update(unit: UnitEntity) {
        const res = await api.patch(`${prefix}/${unit.seq}`, unit)

        return res.data as UnitEntity
    }

    function remove(seq: number) {
        return api.delete(`${prefix}/${seq}`)
    }

    return { selectList, create, update, remove }
}
