const eof = String.fromCharCode(0);

/**
 * JoinOp represents a join type operator.
 */
export enum JoinOp {
	And = "&&",
	Or = "||"
}

/**
 * SignOp represents an expression sign operator.
*/
export enum SignOp{
	Eq = "=",
	Neq = "!=",
	Like = "~",
	Nlike = "!~",
	Lt = "<",
	Lte = "<=",
	Gt = ">",
	Gte = ">=",
	// array/any operators
	AnyEq = "?=",
	AnyNeq = "?!=",
	AnyLike = "?~",
	AnyNlike = "?!~",
	AnyLt = "?<",
	AnyLte = "?<=",
	AnyGt = "?>",
	AnyGte = "?>="
}

/**
 * TokenType represents a Token type.
 */
export enum TokenType {
	Unexpected = "unexpected",
	EOF = "eof",
	WS = "whitespace",
	Join = "join",
	Sign = "sign",
	Identifier = "identifier", // variable, column name, placeholder, etc.
	Number = "number",
	Text = "text",  // ' or " quoted string
	Group = "group", // groupped/nested tokens
	Comment = "comment"
}

// Token represents a single scanned literal (one or more combined runes).
export interface Token {
	Type?: TokenType;
	Literal?: string;
	Error?: Error;
}

// Scanner represents a filter and lexical scanner.
export class Scanner {
	private r?: string;
	private index: number;
	get position(): number { return this.index; }

	constructor(r?: string) {
		this.r = r;
		this.index = 0;
	}

	private _lastStart = 0;
	get lastStart(): number { return this._lastStart; }

	/**
	 * scan reads and returns the next available token value from the scanner's buffer.
	 */
	public scan(): Token {
		this._lastStart = this.index;
		const ch = this.read();
		if (isWhitespaceRune(ch)) {
			this.unread();
			return this.scanWhitespace();
		}
		if (isGroupStartRune(ch)) {
			this.unread();
			return this.scanGroup();
		}
		if (isIdentifierStartRune(ch)) {
			this.unread();
			return this.scanIdentifier();
		}
		if (isNumberStartRune(ch)) {
			this.unread();
			return this.scanNumber();
		}
		if (isTextStartRune(ch)) {
			this.unread();
			return this.scanText(false);
		}
		if (isSignStartRune(ch)) {
			this.unread();
			return this.scanSign();
		}
		if (isJoinStartRune(ch)) {
			this.unread();
			return this.scanJoin();
		}
		if (isCommentStartRune(ch)) {
			this.unread();
			return this.scanComment();
		}
		if (ch === eof) {
			return { Type: TokenType.EOF, Literal: "" };
		}
		return { Type: TokenType.Unexpected, Literal: ch, Error: new Error(`unexpected character ${ch} at position ${this.lastStart}`)}
	}

	/**
	 * scanWhitespace consumes all contiguous whitespace runes.
	 * @private
	 */
	private scanWhitespace(): Token {
		let buf = "";

		// Reads every subsequent whitespace character into the buffer.
		// Non-whitespace runes and EOF will cause the loop to exit.
		while (true) {
			const ch = this.read();
			if (ch === eof) {
				break;
			}
			if (!isWhitespaceRune(ch)) {
				this.unread();
				break;
			}

			buf += ch;
		}
		return { Type: TokenType.WS, Literal: buf };
	}

	/**
	 * scanIdentifier consumes all contiguous identifier runes.
	 * @private
	 */
	private scanIdentifier(): Token {
		let buf = "";

		// Read every subsequent identifier rune into the buffer.
		// Non-ident runes and EOF will cause the loop to exit.
		while (true) {
			const ch = this.read();
			if (ch === eof) {
				break;
			}
			if (!isIdentifierStartRune(ch) && !isDigitRune(ch) && ch !== '.' && ch !== ':') {
				this.unread();
				break;
			}

			buf += ch;
		}
		const literal = buf;
		let err: Error | undefined;
		if (!isIdentifier(literal)) {
			err = new Error(`Invalid identifier ${literal} at position ${this.lastStart}`);
		}
		return { Type: TokenType.Identifier, Literal: literal, Error: err };
	}

	/**
	 * scanNumber consumes all contiguous digit runes.
	 * @private
	 */
	private scanNumber(): Token {
		let buf = "";

		buf += this.read();

		// Read every subsequent digit rune into the buffer.
		// Non-digit runes and EOF will cause the loop to exit.
		while (true) {
			const ch = this.read();
			if (ch === eof) {
				break;
			}
			if (!isDigitRune(ch) && ch !== '.') {
				this.unread();
				break;
			}

			buf += ch;
		}
		const literal = buf;
		let err: Error | undefined;
		if (!isNumber(literal)) {
			err = new Error(`invalid number ${literal} at position ${this.lastStart}`);
		}
		return { Type: TokenType.Number, Literal: literal, Error: err };
	}

	/**
	 * scanText consumes all contiguous quoted text runes.
	 * @private
	 */
	private scanText(preserveQuotes: boolean): Token {
		let start = this.index;

		let buf = "";

		// read the first rune to determine the quotes type
		const firstCh = this.read();
		buf += firstCh;
		let prevCh: string = firstCh;
		let hasMatchingQuotes = false;

		// Read every subsequent text rune into the buffer.
		// EOF and matching unescaped ending quote will cause the loop to exit.
		while (true) {
			const ch = this.read();
			if (ch === eof) {
				break;
			}

			buf += ch;

			// unescaped matching quote, aka. the end
			if (ch === firstCh && prevCh !== '\\') {
				hasMatchingQuotes = true;
				break;
			}
			prevCh = ch;
		}
		let literal = buf;
		let err: Error | undefined;
		if (!hasMatchingQuotes) {
			err = new Error(`invalid quoted text ${literal} at position ${start}`);
		} else if (!preserveQuotes) {
			// unquote
			literal = literal.substring(1, literal.length - 1);
			// remove escaped quotes prefix (aka. \)
			literal = literal.replace(`\\${firstCh}`, firstCh);
		}
		return { Type: TokenType.Text, Literal: literal, Error: err };
	}

	/**
	 * scanSign consumes all contiguous sign operator runes.
	 * @private
	 */
	private scanSign(): Token {
		let buf = "";

		// Read every subsequent sign rune into the buffer.
		// Non-sign runes and EOF will cause the loop to exit.
		while (true) {
			const ch = this.read();
			if (ch === eof) {
				break;
			}
			if (!isSignStartRune(ch)) {
				this.unread();
				break;
			}

			buf += ch;
		}
		const literal = buf;
		let err: Error | undefined;
		if (!isSignOperator(literal)) {
			err = new Error(`invalid sign operator ${literal} at position ${this.lastStart}`);
		}
		return { Type: TokenType.Sign, Literal: literal, Error: err };
	}

	/**
	 * scanJoin consumes all contiguous join operator runes.
	 * @private
	 */
	private scanJoin(): Token {
		let buf = "";

		// Read every subsequent join operator rune into the buffer.
		// Non-join runes and EOF will cause the loop to exit.
		while (true) {
			const ch = this.read();
			if (ch === eof) {
				break;
			}
			if (!isJoinStartRune(ch)) {
				this.unread();
				break;
			}

			buf += ch;
		}
		const literal = buf;
		let err: Error | undefined;
		if (!isJoinOperator(literal)) {
			err = new Error(`invalid join operator ${literal} at position ${this.lastStart}`);
		}
		return { Type: TokenType.Join, Literal: literal, Error: err };
	}

	/**
	 * scanGroup consumes all runes within a group/parenthesis.
	 * @private
	 */
	private scanGroup(): Token {
		let buf = "";

		// read the first group bracket without writing it to the buffer
		const firstChar = this.read();
		let openGroups = 1;

		// Read every subsequent text rune into the buffer.
		// EOF and matching unescaped ending quote will cause the loop to exit.
		while (true) {
			const ch = this.read();
			if (ch === eof) {
				break;
			}
			if (isGroupStartRune(ch)) {
				// nested group
				openGroups++;
				buf += ch;
			} else if (isTextStartRune(ch)) {
				this.unread();
				const t = this.scanText(true); // with quotes to preserve the exact text start/end runes
				if (t.Error) {
					buf += t.Literal;
					return { Type: TokenType.Group, Literal: buf, Error: t.Error };
				}

				// quote the literal to preserve the text start/end runes
				buf += t.Literal;
			} else if (ch === ')') {
				openGroups--;
				if (openGroups <= 0) {
					// main group end
					break;
				} else {
					buf += ch;
				}
			} else {
				buf += ch;
			}
		}
		const literal = buf;
		let err: Error | undefined;
		if (!isGroupStartRune(firstChar) || openGroups > 0) {
			err = new Error(`invalid formatted group - missing ${openGroups} closing bracket(s) at position ${this.lastStart}`);
		}
		return { Type: TokenType.Group, Literal: literal, Error: err };
	}

	/**
	 * scanComment consumes all contiguous single line comment runes.
	 * @private
	 */
	private scanComment(): Token {
		let buf = "";

		// Read the first 2 characters without writing them to the buffer.
		if (!isCommentStartRune(this.read()) || !isCommentStartRune(this.read())) {
			return { Type: TokenType.Comment, Literal: "", Error: new Error("invalid comment start at position ${this.lastStart}") };
		}

		// Read every subsequent comment text rune into the buffer.
		// \n and EOF will cause the loop to exit.
		for (let i = 0; ; i++) {
			const ch = this.read();
			if (ch === eof || ch === '\n') {
				break;
			}
			buf += ch;
		}
		const literal = buf.trim();
		return { Type: TokenType.Comment, Literal: literal };
	}


	/**
	 * read reads the next rune from the buffered reader.
	 * Returns the `\x00` if an error or `io.EOF` occurs.
	 * @private
	 */
	private read(): string {
		if (!this.r || this.index >= this.r.length) {
			return eof;
		}
		return this.r[this.index++];
	}

	/**
	 * unread places the previously read rune back on the reader.
	 * @private
	 */
	private unread(): void {
		if(this.index > 0) this.index--;
	}
}

// Lexical helpers:
// -------------------------------------------------------------------

// isWhitespaceRune checks if a rune is a space, tab, or newline.
function isWhitespaceRune(ch: string): boolean { return ch === ' ' || ch === '\t' || ch === '\n'; }

// isLetterRune checks if a rune is a letter.
function isLetterRune(ch: string): boolean {
	return (ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z');
}

// isDigitRune checks if a rune is a digit.
function isDigitRune(ch: string): boolean {
	return (ch >= '0' && ch <= '9');
}

// isIdentifierStartRune checks if a rune is valid identifier's first character.
function isIdentifierStartRune(ch: string): boolean {
	return isLetterRune(ch) || ch === '_' || ch === '@' || ch === '#';
}

// isTextStartRune checks if a rune is a valid quoted text first character
// (aka. single or double quote).
function isTextStartRune(ch: string): boolean {
	return ch === '\'' || ch === '"';
}

// isNumberStartRune checks if a rune is a valid number start character (aka. digit).
function isNumberStartRune(ch: string): boolean {
	return ch === '-' || isDigitRune(ch);
}

// isSignStartRune checks if a rune is a valid sign operator start character.
function isSignStartRune(ch: string): boolean {
	return ch === '=' ||
		ch === '?' ||
		ch === '!' ||
		ch === '>' ||
		ch === '<' ||
		ch === '~';
}

// isJoinStartRune checks if a rune is a valid join type start character.
function isJoinStartRune(ch: string): boolean {
	return ch === '&' || ch === '|';
}

// isGroupStartRune checks if a rune is a valid group/parenthesis start character.
function isGroupStartRune(ch: string): boolean {
	return ch === '(';
}

// isCommentStartRune checks if a rune is a valid comment start character.
function isCommentStartRune(ch: string): boolean {
	return ch === '/';
}

// isSignOperator checks if a literal is a valid sign operator.
function isSignOperator(literal: string): boolean {
	switch (literal as SignOp) {
		case SignOp.Eq:
		case SignOp.Neq:
		case SignOp.Lt:
		case SignOp.Lte:
		case SignOp.Gt:
		case SignOp.Gte:
		case SignOp.Like:
		case SignOp.Nlike:
		case SignOp.AnyEq:
		case SignOp.AnyNeq:
		case SignOp.AnyLike:
		case SignOp.AnyNlike:
		case SignOp.AnyLt:
		case SignOp.AnyLte:
		case SignOp.AnyGt:
		case SignOp.AnyGte:
		return true;
	}
	return false;
}

// isJoinOperator checks if a literal is a valid join type operator.
function isJoinOperator(literal: string): boolean {
	const op = literal as JoinOp;
	return op === JoinOp.And || op === JoinOp.Or;
}

export const numberRegex = /^\-?[0-9]+(e[0-9]+)?(\.[0-9]+)?$/;
// isNumber checks if a literal is numeric.
export function isNumber(literal: string): boolean {
	if (!(numberRegex.test(literal))) {
		return false;
	}
	try {
		const num = parseFloat(literal);
		return !isNaN(num);
	}catch (e){
		return false
	}
}

const identifierRegex = /^[\@\#\_]?[\w\.\:]*\w+$/;

function isIdentifier(literal: string): boolean {
	return identifierRegex.test(literal);
}



