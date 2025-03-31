import { Expr, ExprGroup } from "./parser";
import { Token } from "./scanner";

export function tokenDebug(token?: Token): string {
    return `{${token?.Type} ${token?.Literal}}`
}

export function exprDebug(expr: Expr): string {
    return `{${tokenDebug(expr.Left)} ${expr.Op} ${tokenDebug(expr.Right)}}`
}

export function exprGroupArrayDebug(arr: ExprGroup[]): string {
    return `[${arr.map(exprGroupDebug).join(' ')}]`
}

export function exprGroupDebug(group: ExprGroup): string {
    if (Array.isArray(group.Item)) {
        return `{${group.Join} ${exprGroupArrayDebug(group.Item)}}`;
    }
    return `{${group.Join} ${group.Item instanceof Expr ? exprDebug(group.Item) : exprGroupDebug(group.Item)}}`;
    
}