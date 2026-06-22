// measures the angle similarity between two vectors, ignoring their length/magnitude.
// cos(a, b) = (a · b) / (‖a‖ · ‖b‖)
// returns a number between roughly -1 and 1, where higher means "more similar in meaning."
export function cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
        throw new Error("vectors must have the same length");
    }
    let dot = 0;
    let magA = 0;
    let magB = 0;
    for (let i = 0; i < a.length; i++) {
        // `a[i]` is `number | undefined` under noUncheckedIndexedAccess, hence `?? 0` for typechecker
        const ai = a[i] ?? 0;
        const bi = b[i] ?? 0;
        dot += ai * bi;
        magA += ai * ai;
        magB += bi * bi;
    }
    const denom = Math.sqrt(magA) * Math.sqrt(magB);
    return denom === 0 ? 0 : dot / denom; // guard against a zero vector → no divide-by-zero
}
