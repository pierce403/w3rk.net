// NextAuth v4 ships CommonJS with an __esModule default; Vite 8 preserves that wrapper.
export function cjsDefault<T>(value:T|{default:T}):T {
  return value!==null&&typeof value==='object'&&'default' in value?value.default:value as T
}
