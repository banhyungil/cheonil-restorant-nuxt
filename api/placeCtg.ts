import api from './'

const prefix = '/placeCategory'

async function selectList() {
    const res = await api.get(prefix)

    return res.data as PlaceCategoryEntity[]
}

async function create(placeCtg: PlaceCategoryEntityCreation) {
    const res = await api.post(prefix, placeCtg)

    return res.data as PlaceCategoryEntity
}

async function update(placeCtg: PlaceCategoryEntity) {
    const res = await api.patch(`${prefix}/${placeCtg.seq}`, placeCtg)

    return res.data as PlaceCategoryEntity
}

function remove(seq: number) {
    return api.delete(`${prefix}/${seq}`)
}

export default {
    selectList,
    create,
    update,
    remove,
}
