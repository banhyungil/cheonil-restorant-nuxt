// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs'
import prettierConfig from '@vue/eslint-config-prettier'

export default withNuxt(
    // Your custom configs here
    {
        rules: {
            '@typescript-eslint/no-unused-vars': 'warn',
            '@typescript-eslint/no-explicit-any': 'warn',
        },
    },
    prettierConfig
)
