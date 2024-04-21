import {
	Scanner,
	Token,
	SignOp,
	JoinOp,
    TokenType,
} from './scanner';

/**
 * Expr represents an individual tokenized expression consisting
 * of left operand, operator and a right operand.
 */
export class Expr {
	Left: Token;
	Op: SignOp | '';
	Right: Token;

	constructor(left?: Token, op?: SignOp, right?: Token) {
		this.Left = left || {Literal: '', Type: TokenType.EOF};
		this.Op = op || '';
		this.Right = right || {Literal: '', Type: TokenType.EOF};
	}

	IsZero(): boolean {
		return !this.Op && !this.Left.Literal && (!this.Right || !this.Right.Literal);
	}
}

/**
 * ExprGroup represents a wrapped expression and its join type.
 *
 * The group's Item could be either an `Expr` instance or `ExprGroup[]` slice (for nested expressions).
 */
export class ExprGroup {
	Join: JoinOp;
	Item: Expr | ExprGroup | ExprGroup[];

	constructor(join: JoinOp, item: Expr | ExprGroup | ExprGroup[]) {
		this.Join = join;
		this.Item = item;
	}
}

/**
 * State machine steps for the parser.
 */
enum ParserSteps {
	BeforeSign = 0,
	Sign = 1,
	AfterSign = 2,
	Join = 3
}

/**
 * Parse parses the provided text and returns its processed AST
 * in the form of `ExprGroup` slice(s).
 *
 * Comments and whitespaces are ignored.
 * @param text The text to parse
 */
export function parse(text: string): ExprGroup[] {
	const result: ExprGroup[] = [];
	const scanner = new Scanner(text);
	let step = ParserSteps.BeforeSign;
	let join = JoinOp.And;
	let expr: Expr|null = null
	while (true) {
		const t = scanner.scan();
		if(t.Type === TokenType.Unexpected) throw t.Error ? t.Error : new Error(`unexpected token ${t.Literal} (${t.Type}) at position ${scanner.lastStart}`);
		if(t.Error) throw t.Error;
		if (t.Type === TokenType.EOF) {
			break;
		}
		if (t.Type === TokenType.WS || t.Type === TokenType.Comment) {
			continue;
		}
		if (t.Type === TokenType.Group) {
			try {
				const groupResult = parse(t.Literal);
				if (groupResult.length > 0) {
					result.push(new ExprGroup(join, groupResult));
				}
			}catch (e) {
				const matchRes = e.message.match(/at position (\d+)$/)
				const match = parseInt(matchRes?.[1]);
				if(match && isFinite(match)) e.message = e.message.slice(0, -(matchRes![1].length)) + (scanner.lastStart + match + 1);
				throw e;
			}
			step = ParserSteps.Join;
			continue;
		}
		switch (step) {
			case ParserSteps.BeforeSign:
				if (t.Type !== TokenType.Identifier && t.Type !== TokenType.Text && t.Type !== TokenType.Number) {
					throw new Error(`expected left operand (identifier, text or number), got ${t.Literal} (${t.Type}) at position ${scanner.lastStart}`);
				}
				expr = new Expr(t);
				step = ParserSteps.Sign;
				break;
			case ParserSteps.Sign:
				if (t.Type !== TokenType.Sign) {
					throw new Error(`expected a sign operator, got ${t.Literal} (${t.Type}) at position ${scanner.lastStart}`);
				}
				if(!expr) throw new Error(`expected left operand (identifier, text or number), got ${t.Literal} (${t.Type}) at position ${scanner.lastStart}`);
				expr.Op = t.Literal as SignOp;
				step = ParserSteps.AfterSign;
				break;
			case ParserSteps.AfterSign:
				if (t.Type !== TokenType.Identifier && t.Type !== TokenType.Text && t.Type !== TokenType.Number) {
					throw new Error(`expected right operand (identifier, text or number), got ${t.Literal} (${t.Type}) at position ${scanner.lastStart}`);
				}
				if(!expr) throw new Error(`expected left operand (identifier, text or number), got ${t.Literal} (${t.Type}) at position ${scanner.lastStart}`);
				expr.Right = t;
				result.push(new ExprGroup(join, expr));
				step = ParserSteps.Join;
				break;
			case ParserSteps.Join:
				if (t.Type !== TokenType.Join) {
					throw new Error(`expected && or ||, got ${t.Literal} (${t.Type}) at position ${scanner.lastStart}`);
				}
				join = JoinOp.And;
				if (t.Literal === JoinOp.Or) {
					join = JoinOp.Or;
				}
				step = ParserSteps.BeforeSign;
				break;
		}
	}
	if (step !== ParserSteps.Join) {
		if (result.length === 0 && (!expr || expr.IsZero())) {
			throw new Error("empty filter expression or invalid syntax");
		}
		throw new Error("invalid or incomplete filter expression");
	}
	return result;
}

