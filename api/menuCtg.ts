import api from './'

const prefix = '/menuCategory'

async function selectList() {
    const res = await api.get(prefix)

    return res.data as MenuCategoryEntity[]
}

async function create(menuCtg: MenuCategoryEntityCreation) {
    const res = await api.post(prefix, menuCtg)
    return res.data as MenuCategoryEntity
}

async function update(menuCtg: MenuCategoryEntity) {
    const res = await api.patch(`${prefix}/${menuCtg.seq}`, menuCtg)
    return res.data as MenuCategoryEntity
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
