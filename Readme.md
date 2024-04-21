fexpr.js [![NPM Package](https://img.shields.io/npm/v/fexpr.js.svg)](https://www.npmjs.com/package/threepipe) [![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](./LICENSE)
===============================================================================

**fexpr** is a filter query language parser that generates easy to work with AST structure so that you can create safely SQL, Elasticsearch, etc. queries from user input.

Or in other words, transform the string `"id > 1"` into the struct `[{&& {{identifier id} > {number 1}}}]`.

Supports parenthesis and various conditional expression operators (see [Grammar](#grammar)).

This is a zero-dependency(<5KB) library that works in both node.js and browser environments.

This is a almost line by line port of [fexpr](https://github.com/ganigeorgiev/fexpr) (BSD 3-Clause License) by [Gani Georgiev](https://github.com/ganigeorgiev), from golang to typescript.

## Demo

Try the [fexpr.js playground](https://repalash.com/fexpr.js) to see how the parser works. Check the [index.html](https://github.com/repalash/fexpr.js/blob/master/index.html) file for the example source code.

Read the [package documentation](https://repalash.com/fexpr.js/docs) or the source code for API documentation.

## Usage

Installation
```
npm install fexpr.js
```
> or use a cdn link in browser

ESM Usage in javascript or typescript:
```javascript
import { parse } from 'fexpr.js';

const result = parse('id=123 && status="active"');
// result: [{&& {{identifier id} = {number 123}}} {&& {{identifier status} = {text active}}}]
```

CommonJS Usage in node.js:
```javascript
const { parse } = require('fexpr.js');

const result = parse('id=123 && status="active"');
```

UMD Usage in browser:
```html
<script src="https://cdn.jsdelivr.net/npm/fexpr.js"></script>
<script>
    const result = fexpr.parse('id=123 && status="active"');
</script>
```

> Note that each parsed expression statement contains a join/union operator (`&&` or `||`) so that the result can be consumed on small chunks without having to rely on the group/nesting context.

> See the [package documentation](https://repalash.com/fexpr.js/docs) for more details and examples.


## Grammar

**fexpr** grammar resembles the SQL `WHERE` expression syntax. It recognizes several token types (identifiers, numbers, quoted text, expression operators, whitespaces, etc.).

> You could find all supported tokens in [`scanner.ts`](https://github.com/repalash/fexpr.js/blob/master/src/scanner.ts).

#### Operators

- **`=`**  Equal operator (eg. `a=b`)
- **`!=`** NOT Equal operator (eg. `a!=b`)
- **`>`**  Greater than operator (eg. `a>b`)
- **`>=`** Greater than or equal operator (eg. `a>=b`)
- **`<`**  Less than or equal operator (eg. `a<b`)
- **`<=`** Less than or equal operator (eg. `a<=b`)
- **`~`**  Like/Contains operator (eg. `a~b`)
- **`!~`** NOT Like/Contains operator (eg. `a!~b`)
- **`?=`**  Array/Any equal operator (eg. `a?=b`)
- **`?!=`** Array/Any NOT Equal operator (eg. `a?!=b`)
- **`?>`**  Array/Any Greater than operator (eg. `a?>b`)
- **`?>=`** Array/Any Greater than or equal operator (eg. `a?>=b`)
- **`?<`**  Array/Any Less than or equal operator (eg. `a?<b`)
- **`?<=`** Array/Any Less than or equal operator (eg. `a?<=b`)
- **`?~`**  Array/Any Like/Contains operator (eg. `a?~b`)
- **`?!~`** Array/Any NOT Like/Contains operator (eg. `a?!~b`)
- **`&&`** AND join operator (eg. `a=b && c=d`)
- **`||`** OR join operator (eg. `a=b || c=d`)
- **`()`** Parenthesis (eg. `(a=1 && b=2) || (a=3 && b=4)`)

#### Numbers
Number tokens are any integer or decimal numbers.

_Example_: `123`, `10.50`, `-14`.

#### Identifiers

Identifier tokens are literals that start with a letter, `_`, `@` or `#` and could contain further any number of letters, digits, `.` (usually used as a separator) or `:` (usually used as modifier) characters.

_Example_: `id`, `a.b.c`, `field123`, `@request.method`, `author.name:length`.

#### Quoted text

Text tokens are any literals that are wrapped by `'` or `"` quotes.

_Example_: `'Lorem ipsum dolor 123!'`, `"escaped \"word\""`, `"mixed 'quotes' are fine"`.

#### Comments

Comment tokens are any single line text literals starting with `//`.
Similar to whitespaces, comments are ignored by `fexpr.parse()`.

_Example_: `// test`.


## Using only the scanner

The tokenizer (aka. `fexpr.Scanner`) could be used without the parser's state machine so that you can write your own custom tokens processing:

```javascript
import { Scanner } from 'fexpr.js';

const s = new Scanner('id > 123');

// scan single token at a time until EOF or error is reached
while (true) {
    const t = s.scan();
    if (t.type === 'EOF' || t.error) {
        break;
    }

    console.log(t);
}

// Output:
// {type: 'identifier', value: 'id'}
// {type: 'whitespace', value: ' '}
// {type: 'sign', value: '>'}
// {type: 'whitespace', value: ' '}
// {type: 'number', value: '123'}
```

