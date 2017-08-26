module.exports = {
    "extends": "airbnb",
    "parser": "babel-eslint",    
    "env": {
        "node": true,
        "es6": true,
        "jasmine": true
    },
    "globals": {},
    "rules": {
        "semi": [0],
        "comma-dangle": [0],
        "global-require": [0],
        "no-alert": [0],
        "no-console": [0],
        "no-param-reassign": [0],
        "max-len": [0],
        "func-names": [0],
        "no-underscore-dangle": [0],
        "no-unused-vars": ["error", {
                "vars": "all",
                "args": "none",
                "ignoreRestSiblings": false
            }
        ],
        "object-shorthand": [1 ],
        "arrow-body-style": [1, "as-needed" ],
        "no-new": [0],
        "strict": [0],
        "spaced-comment": [0],
        "no-empty": [0],
        "no-constant-condition": [0],
        "no-else-return": [0],
        "no-use-before-define": [0],
        "no-unused-expressions": [0],
        "no-class-assign": [0],
        "new-cap": [0],
        "array-callback-return": [0],
        "prefer-template": [0],
        "no-restricted-syntax": [0],
        "no-trailing-spaces": [0],
        "import/no-unresolved": [0],
        "camelcase": [0],
        "consistent-return": [0],
        "guard-for-in": [0],
        "one-var": [0],
    }
}
