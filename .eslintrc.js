module.exports = {
  "env": {
    "browser": true,
    "commonjs": true,
    "es6": true,
    "node": true
  },
  "globals": {
    "describe": true,
    "it": true
  },
  "extends": ["eslint:recommended", "plugin:react/recommended"],
  "parserOptions": {
    "ecmaFeatures": {
      "experimentalObjectRestSpread": true,
      "jsx": true
    },
    "sourceType": "module",
    "ecmaVersion": 2017
  },
  "plugins": [
    "react"
  ],
  "rules": {
    "no-unused-vars": [
      1
    ],
    "no-console": [
      0
    ],
    "react/prop-types": [
      0
    ],
    "react/no-danger": [
      1
    ],
    "indent": [
      1,
      2,
      { "SwitchCase": 1 }
    ],
    "linebreak-style": [
      2,
      "unix"
    ],
    "quotes": [
      1,
      "single"
    ],
    "semi": [
      2,
      "always"
    ],
    "require-yield": [0]
  }
};
