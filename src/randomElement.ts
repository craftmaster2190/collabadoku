export function randomElement<T>(array: T[]): T {
    if (!array?.length) {
        throw new Error("Array must not be empty!")
    }

    return array[Math.floor(Math.random() * array.length)];
}
