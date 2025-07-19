export default function useApiExpenseCategory() {
    const prefix = '/expenseCategories'
    const api = useApi()

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

    return { selectList, create, update, remove }
}
