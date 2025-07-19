// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
    compatibilityDate: '2025-07-15',
    devtools: { enabled: true },

    modules: ['@nuxt/content', '@nuxt/eslint', '@nuxt/test-utils', '@nuxt/ui', 'nuxt-quasar-ui', '@nuxtjs/tailwindcss'],

    quasar: {
        // Configurable Component Defaults
        components: {
            defaults: {
                QBtn: {
                    dense: true,
                    flat: true,
                },
                QInput: {
                    dense: true,
                },
            },
        },
    },
})
