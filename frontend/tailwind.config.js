/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                carbon:  'var(--color-carbon)',
                panel:   'var(--color-panel)',
                surface: 'var(--color-surface)',
                border:  { DEFAULT: 'var(--color-border)', bright: 'var(--color-border-bright)' },
                accent:  'var(--color-accent)',
                caution: 'var(--color-caution)',
                success: 'var(--color-success)',
                info:    'var(--color-info)',
                text: {
                    DEFAULT: 'var(--color-text)',
                    dim:     'var(--color-text-dim)',
                    muted:   'var(--color-text-muted)',
                },
            },
            fontFamily: {
                sans:    ['Inter', 'system-ui', 'sans-serif'],
                display: ['Space Grotesk', 'sans-serif'],
                mono:    ['JetBrains Mono', 'ui-monospace', 'monospace'],
            },
        },
    },
    plugins: [],
}
