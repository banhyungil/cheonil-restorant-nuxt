import api from './'

const prefix = '/store'

async function selectList() {
    const res = await api.get(prefix)

    return res.data as StoreEntity[]
}

async function create(store: StoreEntity) {
    const res = await api.post(prefix, store)

    return res.data as StoreEntity
}

async function update(store: StoreEntity) {
    const res = await api.patch(`${prefix}/${store.seq}`, store)

    return res.data as StoreEntity
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
