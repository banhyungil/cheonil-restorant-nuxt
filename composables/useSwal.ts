import Swal, { type SweetAlertIcon, type SweetAlertOptions } from 'sweetalert2'

const MESSAGE_TYPE_WORD: Record<MessageType, string> = {
    save: '저장',
    update: '수정',
    remove: '삭제',
    error: 'Error',
    info: '알림',
}
const MESSAGE = {
    save: '저장 하시겠습니까?',
    update: '수정 하시겠습니까?',
    remove: '삭제 하시겠습니까?',
}
const DEFAULTS = {
    timer: 1500,
}
// Swal theme 적용이 안되서 composable로 대체...
// * 공식 페이지 대로 진행 했으나 실패.
export default function useSwal(options?: SweetAlertOptions) {
    const nSwal = Swal.mixin({
        color: 'white',
        background: '#2d2d2d',
        iconColor: '#bc4f30',
        confirmButtonColor: '#bc4f30',
        denyButtonColor: 'gray',
        cancelButtonColor: 'gray',
        icon: 'info',
        showCancelButton: true,
        ...options,
    })
    const nToast = nSwal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        showCancelButton: false,
        timer: DEFAULTS.timer,
        timerProgressBar: true,
        didOpen: (toast) => {
            toast.onmouseenter = Swal.stopTimer
            toast.onmouseleave = Swal.resumeTimer
            toast.onclick = () => Swal.close()
        },
    })

    function fireCustom(options?: SweetAlertOptionsCustom) {
        const swal = options?.toast ? nToast : nSwal
        const messageType = options?.messageType ?? 'save'

        const { icon, title, timer } = (() => {
            let word: string
            let icon: SweetAlertIcon
            let title: string
            let timer: number | undefined
            switch (messageType) {
                case 'save':
                case 'update':
                case 'remove':
                    word = MESSAGE_TYPE_WORD[messageType]
                    icon = options?.isConfirm ? 'question' : 'success'
                    title = options?.isConfirm ? `${word} 하시겠습니까?` : `${word} 되었습니다`
                    timer = DEFAULTS.timer
                    break
                case 'error':
                case 'info':
                    title = MESSAGE_TYPE_WORD[messageType]
                    icon = messageType
                    timer = 3000
                    break
            }
            return { icon, title, timer }
        })()

        if (options?.isConfirm) {
            return swal
                .fire({
                    title,
                    icon,
                    ...options,
                })
                .then((res) => {
                    return res.isConfirmed
                })
        } else {
            return swal.fire({
                title,
                icon,
                timer: options?.toast ? timer : undefined,
                ...options,
            })
        }
    }

    return Object.assign(nSwal, { fireCustom, MESSAGE })
}

type MessageType = 'save' | 'update' | 'remove' | 'error' | 'info'
export type SweetAlertOptionsCustom = SweetAlertOptions & {
    isConfirm?: boolean
    messageType?: MessageType
}
