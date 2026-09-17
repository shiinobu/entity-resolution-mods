export const trace = (scope: string, message: string, ...args: unknown[]): void => {
    console.log(`[${scope} DIAG] ${message}`, ...args);
};
