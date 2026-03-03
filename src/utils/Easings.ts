export function lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
}

export function easeOutQuad(t: number): number {
    return 1 - (1 - t) * (1 - t);
}

export function easeInCubic(t: number): number {
    return t * t * t;
}

export function easeOutBack(t: number): number {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    const u = t - 1;
    return 1 + c3 * u * u * u + c1 * u * u;
}

export function easeOutCubic(p: number): number {
    const u = 1 - p;
    return 1 - u * u * u;
}