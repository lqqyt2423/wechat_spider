Juicer Change History
=====================


0.4.0
-----

* Added `register` and `unregister` methods to manage the customed method.

* Resolved `__escapehtml` global pollution.


0.5.0
-----

* Added `#id` support for tpl parameter.

* Support custom the tags by `juicer.set('tag::someTag', 'yourTag')`.

* Fixed `each … range` bug that ranges are incorrect.

0.5.1
-----

* Fixed `#id` support invalid bug because of `var document`.

* Fixed `lexical analyze` bug (`Issue #3`), for example: `{@if a == b}` will throw b is undefined.

0.5.2
-----

* Fixed `lexical analyze` bug (`Issue #4`), for example: `{@if a == true}` will throw `Unexpected token true`.

* Fixed `lexical analyze` bug (`Issue #5`), for example: `{@else if a == b}` will throw a is undefined.

0.5.3
-----

* Added `arguments support` when using helper function (`Pull #6`).

* Added `Object each operation support`.

0.5.4
-----

* Update `whitelist` for lexicalAnalyze.

0.5.5
-----

* Fixed `window` is not defined warning under expressjs.
* Added `expressjs` wrapper, and demo.

0.5.6
-----

* Fixed `Object each operation` bug.

0.5.7
-----

* Compatible for `avoid re-declare native function` for node.js.

0.5.8
-----

* Fixed `varialble outer each statement environment` bug (`Issue #8`), for example: `{@each array as item}${item}{@/each}${item}`.

0.5.9
-----

* avoid re-declare registered function, if not do this, template `{@if registered_func(name)}` could be throw undefined.

0.6.0
-----

* fixed bug for Firefox 14.0.1 (`issue #9`, https://bugzilla.mozilla.org/show_bug.cgi?id=785822).
* added adapter for expressjs-3.x.

0.6.1
-----

* avoid re-analyze method statement variable.

0.6.2
-----

* fixed bug that variable support in `each .. range` expression (`issue #16`).
* added sub-template support using `{@include sub, data}`.

0.6.3
-----

* update testcase of sub-template support.
* added command line support for node.js, using for precompile the template files, `npm install -g juicer`.

0.6.4
-----

* fixed bug that `if(console)` detection will throw error under some browser (like ie6).

0.6.5
-----

* added `other helper types support`, not only the function type, but also can be object type, etc. fixed `variableAnalyze` for `object[variable]` statement.

0.6.6
-----
* added `include tag compatible for node.js`, now you can use `{@include file://./index.tpl}` to include sub-template files in node.js, `include` tag without the quotes will be passed.

0.6.7
-----
* added `inline helper register`, now you can use `{@helper name} .. {@/helper}` to register helper function both in node.js or browser.

0.6.8
-----
* update `inline helper register` for browser support.

0.6.9
-----
* set `cache` to `false` as default in node.js environment, avoid memory leak.

0.6.10
------
* fixed bug that inline helper register failed with slashes content (`issue #78`).

0.6.12
------
* fixed `__escapehtml` bug that `'` will not be escaped.

0.6.13
------
* added `cachestore` option to support the cache storage custom, e.g. LRUCache.

0.6.14
------
* fixed regular expressions in `variableAnalyze` method.

0.6.15
------
* pass-through `this` to helper function as running context.
