import api from './'

const prefix = '/expenseCategories'

async function selectList() {
    const res = await api.get(prefix)
    return res.data as ExpenseCategoryEntity[]
}

async function create(expsCtg: ExpenseCategoryEntity) {
    const res = await api.post(prefix, expsCtg)
    return res.data as ExpenseCategoryEntity
}

async function update(expsCtg: ExpenseCategoryEntity) {
    const res = await api.put(prefix, expsCtg)
    return res.data as ExpenseCategoryEntity
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
