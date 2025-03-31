import { Scanner, TokenType } from "../src"
import { tokenDebug } from "../src/debug";

describe('TestScannerScan', () => {
    const scenarios: [string, {error: boolean, print: string}[]][] = [
        ['   ', [{error: false, print: '{whitespace    }'}]],
        ['test 123', [{error: false, print: "{identifier test}"}, {error: false, print: "{whitespace  }"}, {error: false, print: "{number 123}"}]],
		// identifier
		['test', [{error: false, print: `{identifier test}`}]],
		['@test.123', [{error: false, print: `{identifier @test.123}`}]],
		[`_test.123`, [{error: false, print: `{identifier _test.123}`}]],
		[`#test.123:456`, [{error: false, print: `{identifier #test.123:456}`}]],
		[`.test.123`, [{error: true, print: `{unexpected .}`}, {error: false, print: `{identifier test.123}`}]],
		[`:test.123`, [{error: true, print: `{unexpected :}`}, {error: false, print: `{identifier test.123}`}]],
		[`test#@`, [{error: true, print: `{identifier test#@}`}]],
		[`test'`, [{error: false, print: `{identifier test}`}, {error: true, print: `{text '}`}]],
		[`test"d`, [{error: false, print: `{identifier test}`}, {error: true, print: `{text "d}`}]],
		// number
		[`123`, [{error: false, print: `{number 123}`}]],
		[`-123`, [{error: false, print: `{number -123}`}]],
		[`-123.456`, [{error: false, print: `{number -123.456}`}]],
		[`123.456`, [{error: false, print: `{number 123.456}`}]],
		[`.123`, [{error: true, print: `{unexpected .}`}, {error: false, print: `{number 123}`}]],
		[`- 123`, [{error: true, print: `{number -}`}, {error: false, print: `{whitespace  }`}, {error: false, print:`{number 123}`}]],
		[`12-3`, [{error: false, print: `{number 12}`}, {error: false, print: `{number -3}`}]],
		[`123.abc`, [{error: true, print: `{number 123.}`}, {error: false, print: `{identifier abc}`}]],
		// text
		[`""`, [{error: false, print: `{text }`}]],
		[`''`, [{error: false, print: `{text }`}]],
		[`'test'`, [{error: false, print: `{text test}`}]],
		[`'te\\'st'`, [{error: false, print: `{text te'st}`}]],
		[`"te\\"st"`, [{error: false, print: `{text te"st}`}]],
		[`"tes@#,;!@#%^'\\"t"`, [{error: false, print: `{text tes@#,;!@#%^'"t}`}]],
		[`'tes@#,;!@#%^\\'"t'`, [{error: false, print: `{text tes@#,;!@#%^'"t}`}]],
		[`"test`, [{error: true, print: `{text "test}`}]],
		[`'test`, [{error: true, print: `{text 'test}`}]],
		// join types
		[`&&||`, [{error: true, print: `{join &&||}`}]],
		[`&& ||`, [{error: false, print: `{join &&}`}, {error: false, print: `{whitespace  }`}, {error: false, print:  `{join ||}`}]],
		[`'||test&&'&&123`, [{error: false, print: `{text ||test&&}`}, {error: false, print: `{join &&}`}, {error: false, print: `{number 123}`}]],
		// expression signs
		[`=!=`, [{error: true, print: `{sign =!=}`}]],
		[`= != ~ !~ > >= < <= ?= ?!= ?~ ?!~ ?> ?>= ?< ?<=`, [
			{error: false, print: `{sign =}`},
			{error: false, print: `{whitespace  }`},
			{error: false, print: `{sign !=}`},
			{error: false, print: `{whitespace  }`},
			{error: false, print: `{sign ~}`},
			{error: false, print: `{whitespace  }`},
			{error: false, print: `{sign !~}`},
			{error: false, print: `{whitespace  }`},
			{error: false, print: `{sign >}`},
			{error: false, print: `{whitespace  }`},
			{error: false, print: `{sign >=}`},
			{error: false, print: `{whitespace  }`},
			{error: false, print: `{sign <}`},
			{error: false, print: `{whitespace  }`},
			{error: false, print: `{sign <=}`},
			{error: false, print: `{whitespace  }`},
			{error: false, print: `{sign ?=}`},
			{error: false, print: `{whitespace  }`},
			{error: false, print: `{sign ?!=}`},
			{error: false, print: `{whitespace  }`},
			{error: false, print: `{sign ?~}`},
			{error: false, print: `{whitespace  }`},
			{error: false, print: `{sign ?!~}`},
			{error: false, print: `{whitespace  }`},
			{error: false, print: `{sign ?>}`},
			{error: false, print: `{whitespace  }`},
			{error: false, print: `{sign ?>=}`},
			{error: false, print: `{whitespace  }`},
			{error: false, print: `{sign ?<}`},
			{error: false, print: `{whitespace  }`},
			{error: false, print: `{sign ?<=}`},
        ]],
		// groups/parenthesis
		[`a)`, [{error: false, print: `{identifier a}`}, {error: true, print: `{unexpected )}`}]],
		[`(a b c`, [{error: true, print: `{group a b c}`}]],
		[`(a b c)`, [{error: false, print: `{group a b c}`}]],
		[`((a b c))`, [{error: false, print: `{group (a b c)}`}]],
		[`((a )b c))`, [{error: false, print: `{group (a )b c}`}, {error: true, print: `{unexpected )}`}]],
		[`("ab)("c)`, [{error: false, print: `{group "ab)("c}`}]],
		[`("ab)(c)`, [{error: true, print: `{group "ab)(c)}`}]],
		// comments
		[`/ test`, [{error: true, print: `{comment }`}, {error: false, print: `{identifier test}`}]],
		[`/ / test`, [{error: true, print: `{comment }`}, {error: true, print: `{comment }`}, {error: false, print: `{identifier test}`}]],
		[`//`, [{error: false, print: `{comment }`}]],
		[`//test`, [{error: false, print:`{comment test}`}]],
		[`// test`, [{error: false, print: `{comment test}`}]],
		[`//   test1 //test2  `, [{error: false, print: `{comment test1 //test2}`}]],
		[`///test`, [{error: false, print: `{comment /test}`}]],
    ]

    for (const scenario of scenarios) {
        test(`scan ${scenario[0]}`, () => {
            const scanner = new Scanner(scenario[0]);

            for (const item of scenario[1]) {
                const token = scanner.scan()
    
                if (item.error) {
                    expect(token.Error).toBeTruthy()
                } else {
                    expect(token.Error).toBeFalsy()
                }

                expect(tokenDebug(token)).toEqual(item.print);

            }
    
            const lastToken = scanner.scan();
            expect(lastToken.Type).toEqual(TokenType.EOF);
        })
        
    }
})