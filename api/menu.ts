import api from './'

const prefix = '/menu'

async function selectList() {
    const res = await api.get(prefix, {
        data: '',
    })

    return res.data as MenuEntity[]
}

async function select(seq: number) {
    const res = await api.get(`${prefix}/${seq}`, {
        data: '',
    })

    return res.data as MenuEntity
}

async function create(menu: MenuEntityCreation) {
    const res = await api.post(prefix, menu)
    return res.data as MenuEntity
}

async function update(menu: MenuEntity) {
    const res = await api.patch(`${prefix}/${menu.seq}`, menu)
    return res.data as MenuEntity
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
