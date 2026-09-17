import type {
    QuestDialogDefinition,
    QuestDialogSpeech,
} from "@hotbunny/hackhub-content-sdk";

// EXPERIMENT 2026-09-15: every direct function property on a `Dialog` entry
// (5 syntactic forms tried, all identical failure — see
// docs/bugs.md (entry 1)) stalls the transition into that
// entry, with no exception found. This wraps a fully plain (function-free)
// `Dialog` object in a `Proxy` instead, so the SDK never sees a function
// value anywhere inside the data it reads — the side effect fires from
// OUTSIDE the object, triggered by the property READ itself (`Dialog[branch]
// [index]`), not from a value stored inside it. Untested hypothesis: if the
// engine's per-line stall is caused by something like `structuredClone`
// throwing on a function it finds inside the line object (unlike
// `JSON.stringify`, which silently drops functions), a Proxy trap never
// puts a function inside the cloned data, so cloning should succeed.
//
// Shared across any quest using a phone-call `Dialog` (Q03 first, Q08/Q09/
// Q11-Q16 later per docs/implementation-notes.md) — the workaround is
// identical regardless of which quest's dialogue it wraps.
export const withDialogLineReadTap = (
    dialog: QuestDialogDefinition,
    onLineRead: (branch: string, index: number, entry: QuestDialogSpeech) => void,
): QuestDialogDefinition =>
    new Proxy(dialog, {
        get(target, branchProp, receiver): unknown {
            const branchValue = Reflect.get(target, branchProp, receiver);

            if (!Array.isArray(branchValue) || typeof branchProp !== "string") {
                return branchValue;
            }

            return new Proxy(branchValue, {
                get(arr, indexProp, arrReceiver): unknown {
                    const value = Reflect.get(arr, indexProp, arrReceiver);

                    if (typeof indexProp === "string" && /^\d+$/.test(indexProp)) {
                        onLineRead(branchProp, Number(indexProp), value as QuestDialogSpeech);
                    }

                    return value;
                },
            });
        },
    });
