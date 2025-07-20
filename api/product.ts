import api from './'

const prefix = '/products'

type Expands = 'prdInfo' | 'unit'
async function selectList(query?: { expands: Expands[] }) {
    const res = await api.get(`${prefix}`, { params: { expand: query?.expands.join(',') } })
    return res.data as ProductEntity[]
}

async function createList(mpus: ProductEntity[]) {
    return api.post(`${prefix}/batch-create`, mpus)
}

async function deleteProductInfo(prdInfoSeq: number) {
    return api.delete(`${prefix}/productInfo/${prdInfoSeq}`)
}

export default {
    selectList,
    createList,
    deleteProductInfo,
}
