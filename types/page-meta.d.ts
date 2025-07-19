export {}

// #app은 nuxt3에서 제공하는 가상 모듈
// definePageMeta가 거기에 속한다.
// meging 개념을 이용해 PageMeta정보에 pageType 멤버를 추가한다.
declare module '#app' {
    interface PageMeta {
        pageType?: string
    }
}
