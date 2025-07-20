import type { SweetAlertOptions } from 'sweetalert2'
import Swal from 'sweetalert2'

export const MESSAGE_INFO = {
    create: '등록 되었습니다.',
    update: '수정 되었습니다.',
    remove: '삭제 되었습니다.',
}
export default function useToast(option?: SweetAlertOptions) {
    const Toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true,
        didOpen: (toast) => {
            toast.onmouseenter = Swal.stopTimer
            toast.onmouseleave = Swal.resumeTimer
        },
        ...option,
    })

    const create = () => {
        Toast.fire({ title: MESSAGE_INFO.create, icon: 'success' })
    }
    const update = () => {
        Toast.fire({ title: MESSAGE_INFO.update, icon: 'success' })
    }
    const remove = () => {
        Toast.fire({ title: MESSAGE_INFO.remove, icon: 'success' })
    }

    return Object.assign(Toast, { create, update, remove })
}
