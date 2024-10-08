import {Expr, parse, SignOp, TokenType} from '../src';
import {exprGroupArrayDebug} from '../src/debug';

describe('ExprIsZero', () => {
    const scenarios: [Expr, boolean][] = [
        [new Expr(), true],
        [new Expr(undefined, SignOp.AnyEq), false],
        [new Expr({Literal: '123'}), false],
        [new Expr({Type: TokenType.WS}), false],
        [new Expr(undefined, undefined, {Literal: '123'}), false],
        [new Expr(undefined, undefined, {Type: TokenType.WS}), false]
    ]

    scenarios.forEach(([expression, result], index) => {
        test(`scenario${index}`, () => {
            expect(expression.IsZero()).toEqual(result)
        })
    })
    
})

describe('TestParse', () => {
    const scenarios: [string, boolean, string][] = [
        [`> 1`, true, '[]'],
        [`a >`, true, '[]'],
        [`a > >`, true, '[]'],
		[`a > %`, true, '[]'],
		[`a ! 1`, true, '[]'],
		[`a - 1`, true, '[]'],
		[`a + 1`, true, "[]"],
		[`1 - 1`, true, "[]"],
		[`1 + 1`, true, "[]"],
		[`> a 1`, true, "[]"],
		[`a || 1`, true, "[]"],
		[`a && 1`, true, "[]"],
		[`test > 1 &&`, true, `[]`],
		[`|| test = 1`, true, `[]`],
		[`test = 1 && ||`, true, "[]"],
		[`test = 1 && a`, true, "[]"],
		[`test = 1 && a`, true, "[]"],
		[`test = 1 && "a"`, true, "[]"],
		[`test = 1 a`, true, "[]"],
		[`test = 1 a`, true, "[]"],
		[`test = 1 "a"`, true, "[]"],
		[`test = 1@test`, true, "[]"],
		[`test = .@test`, true, "[]"],
		// mismatched text quotes
		[`test = "demo'`, true, "[]"],
		[`test = 'demo"`, true, "[]"],
		[`test = 'demo'"`, true, "[]"],
		[`test = 'demo''`, true, "[]"],
		[`test = "demo"'`, true, "[]"],
		[`test = "demo""`, true, "[]"],
		[`test = ""demo""`, true, "[]"],
		[`test = ''demo''`, true, "[]"],
		["test = `demo`", true, "[]"],
		// comments
		["test = / demo", true, "[]"],
		["test = // demo", true, "[]"],
		["// demo", true, "[]"],
		["test = 123 // demo", false, "[{&& {{identifier test} = {number 123}}}]"],
		["test = // demo\n123", false, "[{&& {{identifier test} = {number 123}}}]"],
		[`
			a = 123 &&
			// demo
			b = 456
		`, false, "[{&& {{identifier a} = {number 123}}} {&& {{identifier b} = {number 456}}}]"],
		// valid simple expression and sign operators check
		[`1=12`, false, `[{&& {{number 1} = {number 12}}}]`],
		[`   1    =    12    `, false, `[{&& {{number 1} = {number 12}}}]`],
		[`"demo" != test`, false, `[{&& {{text demo} != {identifier test}}}]`],
		[`a~1`, false, `[{&& {{identifier a} ~ {number 1}}}]`],
		[`a !~ 1`, false, `[{&& {{identifier a} !~ {number 1}}}]`],
		[`test>12`, false, `[{&& {{identifier test} > {number 12}}}]`],
		[`test > 12`, false, `[{&& {{identifier test} > {number 12}}}]`],
		[`test >="test"`, false, `[{&& {{identifier test} >= {text test}}}]`],
		[`test<@demo.test2`, false, `[{&& {{identifier test} < {identifier @demo.test2}}}]`],
		[`1<="test"`, false, `[{&& {{number 1} <= {text test}}}]`],
		[`1<="te'st"`, false, `[{&& {{number 1} <= {text te'st}}}]`],
		[`demo='te\\'st'`, false, `[{&& {{identifier demo} = {text te'st}}}]`],
		[`demo="te\'st"`, false, `[{&& {{identifier demo} = {text te\'st}}}]`],
		[`demo="te\\"st"`, false, `[{&& {{identifier demo} = {text te"st}}}]`],
		// invalid parenthesis
		[`(a=1`, true, `[]`],
		[`a=1)`, true, `[]`],
		[`((a=1)`, true, `[]`],
		[`{a=1}`, true, `[]`],
		[`[a=1]`, true, `[]`],
		[`((a=1 || a=2) && c=1))`, true, `[]`],
		// valid parenthesis
		[`()`, true, `[]`],
		[`(a=1)`, false, `[{&& [{&& {{identifier a} = {number 1}}}]}]`],
		[`(a="test(")`, false, `[{&& [{&& {{identifier a} = {text test(}}}]}]`],
		[`(a="test)")`, false, `[{&& [{&& {{identifier a} = {text test)}}}]}]`],
		[`((a=1))`, false, `[{&& [{&& [{&& {{identifier a} = {number 1}}}]}]}]`],
		[`a=1 || 2!=3`, false, `[{&& {{identifier a} = {number 1}}} {|| {{number 2} != {number 3}}}]`],
		[`a=1 && 2!=3`, false, `[{&& {{identifier a} = {number 1}}} {&& {{number 2} != {number 3}}}]`],
		[`a=1 && 2!=3 || "b"=a`, false, `[{&& {{identifier a} = {number 1}}} {&& {{number 2} != {number 3}}} {|| {{text b} = {identifier a}}}]`],
		[`(a=1 && 2!=3) || "b"=a`, false, `[{&& [{&& {{identifier a} = {number 1}}} {&& {{number 2} != {number 3}}}]} {|| {{text b} = {identifier a}}}]`],
		[`((a=1 || a=2) && (c=1))`, false, `[{&& [{&& [{&& {{identifier a} = {number 1}}} {|| {{identifier a} = {number 2}}}]} {&& [{&& {{identifier c} = {number 1}}}]}]}]`],
		// https://github.com/pocketbase/pocketbase/issues/5017
		[`(a='"')`, false, `[{&& [{&& {{identifier a} = {text "}}}]}]`],
		[`(a='\\'')`, false, `[{&& [{&& {{identifier a} = {text '}}}]}]`],
		[`(a="'")`, false, `[{&& [{&& {{identifier a} = {text '}}}]}]`],
		[`(a="\\"")`, false, `[{&& [{&& {{identifier a} = {text "}}}]}]`],
    ]

    scenarios.forEach(([input, expectError, output]) => {
        test(`scenario: ${input}`, () => {
            if (expectError) {
                expect(() => parse(input)).toThrow();
            } else {
                const parsed = parse(input)
                expect(exprGroupArrayDebug(parsed)).toEqual(output);
            }
        })
    })

    
})