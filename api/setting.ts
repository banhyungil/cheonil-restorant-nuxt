import api from './'

const prefix = '/setting'

async function select() {
    const res = await api.get(prefix)

    return res.data as SettingEntity
}

async function update(setting: SettingEntity) {
    const res = await api.put(`${prefix}/${setting.seq}`, setting)

    return res.data as SettingEntity
}

export default {
    select,
    update,
}
