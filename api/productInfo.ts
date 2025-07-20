import api from './'

export type ProductInfoExt = ProductInfoEntity & { products: ProductEntity & { unit: UnitEntity }[] }

const prefix = '/productInfos'

async function selectList(): Promise<ProductInfoEntity[]>
async function selectList(query: QueryParam): Promise<ProductInfoExt[]>
async function selectList(query?: QueryParam) {
    const res = await api.get(prefix, { params: query })

    return res.data
}

async function select(seq: number) {
    const res = await api.get(`${prefix}/${seq}`)

    return res.data as ProductInfoEntity
}

async function create(productInfo: ProductInfoCreationEntity) {
    const res = await api.post(prefix, productInfo)

    return res.data as ProductInfoEntity
}

async function update(productInfo: ProductInfoEntity) {
    const res = await api.patch(`${prefix}/${productInfo.seq}`, productInfo)

    return res.data as ProductInfoEntity
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
