import { useWebSocket as _useWebSocket } from '@vueuse/core'
import type { OrderCURes } from './useApiOrder'

interface Sync {
    url: URLs
    baseUrl: BaseURLs
    method: Methods
    resBody: any
    routeParams: any
}
const { data } = _useWebSocket(`ws://localhost:8000`, {
    onConnected() {
        console.log('websocket connected')
    },
    autoReconnect: {
        retries: 3,
        delay: 1000,
        onFailed() {
            console.log('websocket connect failed')
        },
    },
})

export default function useWebSocket() {
    const callbackDict = ref({} as CallbackDict)

    function listen(baseUrl: ApiMenu.URL, method: 'POST', callback: (resBody: ApiMenu.Post['resBody']) => void): void
    function listen(baseUrl: ApiMenu.URL, method: 'PATCH', callback: (resBody: ApiMenu.Post['resBody']) => void): void
    function listen(baseUrl: ApiMenu.URL, method: 'DELETE', callback: (seq: number) => void): void
    function listen(baseUrl: ApiMenuCtg.URL, method: 'POST', callback: (resBody: ApiMenuCtg.Post['resBody']) => void): void
    function listen(baseUrl: ApiMenuCtg.URL, method: 'PATCH', callback: (resBody: ApiMenuCtg.Post['resBody']) => void): void
    function listen(baseUrl: ApiMenuCtg.URL, method: 'DELETE', callback: (seq: number) => void): void
    function listen(baseUrl: ApiOrder.URL, method: 'POST', callback: (sync: ApiOrder.Post['orderSync']) => void): void
    function listen(baseUrl: ApiOrder.URL, method: 'PATCH', callback: (sync: ApiOrder.Patch['orderSync']) => void): void
    function listen(baseUrl: ApiOrder.URL, method: 'DELETE', callback: (sync: ApiOrder.Delete['orderSync']) => void): void
    function listen(baseUrl: URLs, method: Methods, callback: Function) {
        if (callbackDict.value[baseUrl] == null) callbackDict.value[baseUrl] = {} as any
        if (callbackDict.value[baseUrl][method] == null) callbackDict.value[baseUrl][method] = []

        callbackDict.value[baseUrl][method].push(callback)
    }

    function isSync(oData: any): oData is Sync {
        const baseUrls = ['/menu', '/menuCategory', '/store', '/storeCategory', '/placeCategory', '/order', '/payment'].map((url) => `/api${url}`)

        return (
            typeof oData == 'object' &&
            'url' in oData &&
            'baseUrl' in oData &&
            baseUrls.includes(oData.baseUrl) &&
            'method' in oData &&
            'resBody' in oData &&
            'routeParams' in oData
        )
    }
    watch(
        data,
        () => {
            const oData = JSON.parse(data.value)
            if (isSync(oData) == false) return

            const { baseUrl, method } = oData
            console.log('websocket data: ', oData)

            callbackDict.value[baseUrl][method].forEach((fn) => fn(oData))
        },
        { deep: true }
    )

    return { listen }
}

type CallbackDict = {
    [U in URLs]: Record<Methods, Function[]>
}

type Methods = 'POST' | 'PATCH' | 'DELETE'
type BaseURLs = `/api${'/menu' | '/menuCategory' | '/store' | '/storeCategory' | '/placeCategory' | '/order' | '/payment'}`
type URLSeqs = `${BaseURLs}/${string}`
type URLs = BaseURLs | URLSeqs

export namespace ApiOrder {
    export type URL = Extract<BaseURLs, '/api/order'>
    export type URLSeq = `${URL}/:seq`
    export interface OrderSync extends Sync {
        url: URL | `${URL}/${string}`
        baseUrl: URL
        method: Methods
    }
    export interface Post {
        reqBody: {
            order: MyOrderEntityCreation
            orderMenues: OrderMenuEntityCreation[]
        }
        resBody: OrderCURes

        orderSync: Override<OrderSync, { resBody: OrderCURes; routeParams: null }>
    }
    export interface Patch {
        reqBody: {
            order: MyOrderEntity
            orderMenues: OrderMenuEntityCreation[]
        }
        resBody: OrderCURes

        orderSync: Override<OrderSync, { resBody: OrderCURes; routeParams: null }>
    }
    export interface Delete {
        reqBody: MenuEntity['seq']
        orderSync: Override<OrderSync, { resBody: null; routeParams: { seq: string } }>
    }
}

export namespace ApiMenu {
    export type URL = Extract<BaseURLs, '/menu'>
    export type URLSeq = `${URL}/:seq`
    export interface Post {
        reqBody: MenuEntityCreation
        resBody: MenuEntity
    }
    export interface Patch {
        reqBody: MenuEntity
        resBody: MenuEntity
    }
    export interface Delete {
        reqBody: MenuEntity['seq']
    }
}

export namespace ApiMenuCtg {
    export type URL = Extract<BaseURLs, '/menuCategory'>
    export type URLSeq = `${URL}/:seq`
    export interface Post {
        reqBody: MenuCategoryEntityCreation
        resBody: MenuCategoryEntity
    }

    export interface Patch {
        URL: `${URL}/:seq`
        reqBody: MenuCategoryEntity
        resBody: MenuCategoryEntity
    }
    export interface Delete {
        URL: `${URL}/:seq`
        reqBody: MenuCategoryEntity['seq']
    }
}
