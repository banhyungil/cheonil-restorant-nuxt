import axios, { type AxiosResponse } from 'axios'

const api = axios.create({ baseURL: '/api' })
const Swal = useAlert()

api.interceptors.response.use(
    (response) => {
        response.data = convertDates(response.data)
        return response
    },
    (error) => {
        // whatever you want to do with the error
        Swal.fireCustom({
            toast: true,
            icon: 'error',
            title: error?.response?.data?.message ?? error,
            timer: 10000,
        })
    }
)

export const Op: OpTypesCustom = {
    eq: 'eq',
    lt: 'lt',
    lte: 'lte',
    gt: 'gt',
    gte: 'gte',
}
// 날짜 형식을 인식하고 Date 객체로 변환하는 함수
function isISODateString(value: string) {
    // 기본적으로 ISO 8601 형식의 날짜 문자열을 찾기 위해 정규식을 사용합니다.
    return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d*)?Z?$/.test(value)
}

// TODO 타입 설정 임의로 일단 대충 함... 나중에 고치자
function convertDates<T>(data: T): T | Date {
    if (data === null || data === undefined) return data

    if (typeof data === 'string' && isISODateString(data)) {
        return new Date(data)
    }

    if (Array.isArray(data)) {
        return data.map(convertDates) as any
    }

    if (typeof data === 'object') {
        return Object.keys(data).reduce((acc, key) => {
            acc[key as keyof T] = convertDates(data[key as keyof T]) as any
            return acc
        }, {} as T)
    }

    return data
}
