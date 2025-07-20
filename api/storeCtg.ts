import api from './'

const prefix = '/storeCategory'

async function selectList() {
    const res = await api.get(prefix)

    return res.data as StoreCategoryEntity[]
}

async function create(storeCtg: StoreCategoryEntityCreation) {
    const res = await api.post(prefix, storeCtg)

    return res.data as StoreCategoryEntity
}

async function update(storeCtg: StoreCategoryEntity) {
    const res = await api.patch(`${prefix}/${storeCtg.seq}`, storeCtg)

    return res.data as StoreCategoryEntity
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
