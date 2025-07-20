import type { ErrorObject } from '@vuelidate/core'
import _ from 'lodash'
import Swal, { type SweetAlertCustomClass, type SweetAlertIcon, type SweetAlertOptions } from 'sweetalert2'

//ANCHOR - Constants
const CUSTOM_CLASS = {
    popup: 'rounded-xl shadow-lg !bg-dark text-white',
    actions: 'flex gap-2',
    confirmButton: 'rounded-xl shadow-lg bg-primary border-primary text-white dark:border-primary px-4 py-2 rounded-sm',
    cancelButton: 'rounded-xl shadow-lg bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-sm',
    denyButton: 'rounded-xl shadow-lg bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-sm',
    timerProgressBar: 'bg-primary/50',
} as SweetAlertCustomClass
const SWAL = Swal.mixin({
    cancelButtonText: '취소',
    confirmButtonText: '확인',
    icon: 'info',
    showCancelButton: true,
    reverseButtons: true,
    customClass: CUSTOM_CLASS,

    buttonsStyling: false, // ✅ 반드시 false로 해야 customClass 적용됨
})
const TOAST = SWAL.mixin({
    toast: true,
    position: 'top-right',
    showConfirmButton: false,
    showCancelButton: false,
    timer: 2500,
    timerProgressBar: true,
    didOpen: (toast) => {
        toast.onmouseenter = Swal.stopTimer
        toast.onmouseleave = Swal.resumeTimer
        toast.addEventListener('click', () => Swal.close())
    },
    buttonsStyling: false, // ✅ 반드시 false로 해야 customClass 적용됨
})
const MESSAGE_TYPE_WORD: Record<MessageType, string> = {
    success: '성공',
    save: '저장',
    update: '수정',
    remove: '삭제',
    error: 'Error',
    info: '알림',
}
function getMessage(type: 'QUESTION' | 'NOTIFY', messageType: MessageType) {
    if (type === 'QUESTION') return `${MESSAGE_TYPE_WORD[messageType]} 하시겠습니까?`
    else if (type === 'NOTIFY') {
        let postfix = ' 되었습니다.'
        if (messageType == 'success') postfix = ' 하였습니다.'

        return `${MESSAGE_TYPE_WORD[messageType]}${postfix}`
    } else return ''
}

//ANCHOR - Start
export const useAlert = (options?: SweetAlertOptions) => {
    const swal = options == null ? SWAL : SWAL.mixin(options)
    const toast = options == null ? TOAST : TOAST.mixin(options)
    const Alert = options?.toast ? toast : swal

    function fire(optionsExt: SweetAlertOptionsExt) {
        const MyAlert = optionsExt?.toast ? toast : Alert
        const messageType = optionsExt?.messageType

        const { icon, title } = (() => {
            if (messageType == null) return { icon: optionsExt.icon, title: '' }

            let icon: SweetAlertIcon
            let title = ''
            switch (messageType) {
                case 'save':
                case 'update':
                case 'remove':
                case 'success':
                    icon = 'success'
                    title = getMessage('NOTIFY', messageType)
                    break
                case 'error':
                case 'info':
                    icon = messageType
                    break
            }
            return { icon, title }
        })()

        const ringColor = (() => {
            switch (icon) {
                case 'error':
                    return 'danger'
                default:
                    return icon
            }
        })()
        const popupClass = `ring-4 !ring-${ringColor} !ring-opacity-40`

        return MyAlert.fire({
            title,
            icon,
            customClass: {
                ...CUSTOM_CLASS,
                popup: `${CUSTOM_CLASS.popup} ${popupClass}`,
            },
            showCancelButton: false,
            // warning 문구로 확장 속성은 제외
            ...(_.omit(optionsExt, ['messageType']) as SweetAlertOptions),
        })
    }

    async function confirm(options: SweetAlertOptionsExt) {
        const messageType = options?.messageType ?? 'save'
        const res = await fire({
            toast: false,
            icon: 'question',
            title: options.title ?? getMessage('QUESTION', messageType),
            showConfirmButton: true,
            showCancelButton: true,
            position: 'center',
            timer: undefined,
            ...options,
        })
        return res.isConfirmed
    }

    function getMessages(messages: string[]) {
        const text = messages.map((t) => `<p>${t}</p>`).join('')
        return `<div>${text.toString()}</div>`
    }
    function fireVuelidate($errors: ErrorObject[] = [], options?: SweetAlertOptions) {
        const messages: string[] = []
        for (const error of $errors) {
            const message = _.toString(error.$message)
            messages.push(message)
        }
        // 임시: 하나의 에러 메시지만 표시하자
        return fire({ ...options, messageType: 'error', html: getMessages([messages[0]]) })
    }

    function disable(text: string = '접근할 수 없습니다.', options?: SweetAlertOptions) {
        return swal.fire({
            title: options?.title ?? '',
            text,
            icon: 'error',
            allowOutsideClick: false,
            showCancelButton: false,
            showConfirmButton: false,
            ...options,
        })
    }
    return {
        fire,
        confirm,
        fireVuelidate,
        disable,
    }
}

//ANCHOR - Types
type MessageType = 'save' | 'update' | 'remove' | 'error' | 'info' | 'success'
type SweetAlertOptionsExt = SweetAlertOptions & { messageType?: MessageType }
