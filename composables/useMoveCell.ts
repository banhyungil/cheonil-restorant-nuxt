import { limitNum } from '../utils/common'
import { useActiveElement } from '@vueuse/core'
import { computed, unref, watch, type MaybeRefOrGetter, type Ref } from 'vue'

interface Options {
    /** 전체 셀 요소 */
    elts: Ref<HTMLElement[]>
    /** 행 개수 */
    rowCnt: MaybeRefOrGetter
    /** 컬럼 개수 */
    colCnt: MaybeRefOrGetter
}
/**
 *
 * @param options
 * @returns
 */
export default function useMoveCell(options: Options) {
    const { elts, rowCnt, colCnt } = options

    const activeElement = useActiveElement()
    watch(
        () => elts.value.length,
        () => {
            elts.value.forEach((elt) => {
                elt.removeEventListener('keydown', onKeydownCell)
                elt.addEventListener('keydown', onKeydownCell)
            })
        }
    )

    const cCurCellIdx = computed(() => {
        const cellIdx = elts.value.findIndex((elt) => elt == activeElement.value)
        return cellIdx < 0 ? null : cellIdx
    })

    const cFocusCellIdxInfo = computed(() => {
        return getIdxInfo(cCurCellIdx.value ?? 0)
    })

    const cFocusedElt = computed(() => (cCurCellIdx.value == null ? null : elts.value[cCurCellIdx.value]))

    /**
     * 방향키에 따른 행, 컬럼 Index값을 계산하여 해당 셀에 요소를 선택한다
     * cellIdx = rowIdx * colCnt + colIdx
     * @param e
     * @returns
     */
    function onKeydownCell(e: KeyboardEvent) {
        if (!isArrow(e.key) || cCurCellIdx.value == null) return
        e.preventDefault()

        let { rowIdx, colIdx } = getIdxInfo(cCurCellIdx.value)
        console.log('origin index', `${rowIdx}, ${colIdx}`)

        switch (e.key) {
            case 'ArrowDown':
                rowIdx = rowIdx + 1
                break
            case 'ArrowUp':
                rowIdx = rowIdx - 1
                break
            case 'ArrowLeft':
                colIdx = colIdx - 1
                break
            case 'ArrowRight':
                colIdx = colIdx + 1
                break
        }

        rowIdx = limitNum(rowIdx, 0, unref(rowCnt), true)
        colIdx = limitNum(colIdx, 0, unref(colCnt) - 1, true)

        console.log('changed index', `${rowIdx}, ${colIdx}`)
        console.log('cell index', getCellIdx(rowIdx, colIdx))

        elts.value[getCellIdx(rowIdx, colIdx)].focus()
    }

    function getIdxInfo(cellIdx: number) {
        const vColCnt = unref(colCnt)
        const rowIdx = Math.trunc(cellIdx / vColCnt)
        const colIdx = cellIdx - rowIdx * vColCnt

        return { rowIdx, colIdx }
    }

    function getCellIdx(rowIdx: number, colIdx: number) {
        return rowIdx * unref(colCnt) + colIdx
    }

    function isArrow(key: string) {
        return ['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight'].includes(key)
    }

    return { cFocusedElt, cFocusCellIdxInfo, getCellIdx }
}
