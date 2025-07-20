import api from './'

const prefix = '/expenses'

async function selectList() {
    const res = await api.get(prefix)

    return res.data as ExpenseEntity[]
}

async function select(seq: number) {
    const res = await api.get(`${prefix}/${seq}`)

    return res.data as ExpenseEntity
}

async function create(expense: ExpenseEntityCreation) {
    const res = await api.post(prefix, expense)
    return res.data as ExpenseEntity
}

async function update(expense: ExpenseEntity) {
    const res = await api.patch(`${prefix}/${expense.seq}`, expense)
    return res.data as ExpenseEntity
}

function remove(seq: number) {
    return api.delete(`${prefix}/${seq}`)
}

export default {
    selectList,
    select,
    create,
    update,
    remove,
}
