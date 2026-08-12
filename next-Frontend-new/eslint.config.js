import qwik from 'eslint-plugin-qwik'

export default [
  {
    plugins: {
      qwik,
    },
    rules: {
      'qwik/valid-lexical-scope': 'error',
      'qwik/no-use-visible-task': 'warn',
      'qwik/jsx-img': 'warn',
      'qwik/jsx-img-alt': 'warn',
      'qwik/jsx-no-construct': 'warn',
      'qwik/no-basic-html-in-component': 'warn',
      'qwik/no-jsx-cast-wrapper': 'warn',
      'qwik/prefer-use-sortable': 'warn',
    },
  },
]
