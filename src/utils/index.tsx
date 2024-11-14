export const clipDecimals = (value: string, decimals: number = 2): string => {
    const parts = value.split('.')
    if (parts.length === 1) return value
    return `${parts[0]}.${parts[1].slice(0, decimals)}`
}
