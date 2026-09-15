# [BUG] QuestDialogSpeech.onEnd / QuestDialogOption.onSelect never fire (Content SDK)

## Environment

- **Game version:** HackHub — Ultimate Hacker Simulator, `1.2.1`
- **Content SDK version:** `@hotbunny/hackhub-content-sdk@0.21.0`
- **Platform:** Windows 11, Steam
- **Mod type:** Custom quest using `Quest.Dialog` + `this.createDialog(branch)` (phone-call dialog)

## Summary

`onEnd` (on `QuestDialogSpeech`) and `onSelect` (on `QuestDialogOption`) are documented callback fields on the phone-call `Dialog` system, but in live testing **neither ever fires, under any circumstance** — not on a line reached by normal sequential auto-advance, and not on a line reached via `switchBranch`. This holds true even for a bare no-op callback (a single `console.log`, no other logic), ruling out anything specific to what the callback does.

This forces mods to decouple any "the call/line has ended" side effect from the `Dialog` object entirely and trigger it independently (e.g. on a fixed timer from whenever `createDialog()` was called), since there is no reliable signal from the SDK for "this dialog line/call actually finished."

## Expected behavior

Per the SDK's own type declarations:

```ts
export interface QuestDialogSpeech {
    speaker: string;
    text: string;
    audio?: string;
    isEnd?: boolean;
    timeout?: number;
    /** Callback fired when this speech line ends. */
    onEnd?: () => void;
    options?: QuestDialogOption[];
}

export interface QuestDialogOption {
    label: string;
    text: string;
    audio?: string;
    switchBranch?: string;
    nextIndex?: number;
    isEnd?: boolean;
    timeout?: number;
    /** Callback fired when this option is selected. */
    onSelect?: () => void;
}
```

`onEnd` should fire when a speech line finishes displaying (whether it auto-advances via `timeout`, is the final `isEnd: true` line of a call, or is reached via `switchBranch`/`nextIndex`). `onSelect` should fire when the player picks that specific option.

## Actual behavior

Neither callback is ever invoked, confirmed across every mechanism the SDK exposes for triggering one:

| Attempt | Where the function property lived | Result |
|---|---|---|
| `isEnd: true` + `onEnd: () => this.createDialog(otherBranch)` (mid-call branch jump) | Speech line | Call advanced correctly through several preceding plain lines, then froze completely at that line — no error, no UI change, nothing in the mod's own logs |
| `switchBranch` on a selected `option`, target branch's line has `onEnd: () => doSomething()` | Speech line (target of the jump) | The option's own `text` echoed correctly as a player line, then froze — target branch's content never appeared |
| `nextIndex` on a selected `option` (same-array jump instead of cross-branch), target index has `onEnd` | Speech line (target index) | Call froze *before* the options screen even appeared, inconsistently across otherwise-identical runs |
| `isEnd: true` + `onSelect: () => doSomething()` directly on the option (no jump target at all) | Option object | Options screen displayed and was selectable; after selecting, the chosen option's text echoed, then froze — call never visibly ended |
| **Isolated no-op test:** `onEnd: () => console.log("FIRED")` on a `switchBranch`-reached target line | Speech line | `console.log` never printed — confirmed via HackHub's own render log |
| **Isolated no-op test:** `onEnd: () => console.log("FIRED")` on a purely linear line (reached by normal `timeout`-based auto-advance, no branching involved at all) | Speech line | `console.log` never printed |

The last two rows are the cleanest evidence: a bare, side-effect-free callback with nothing but a single `console.log` call, placed on a completely ordinary linear line that is definitely reached (confirmed by everything after it in the call still working correctly), never fires. This is not about `switchBranch`/`nextIndex` being broken, not about what the callback does, and not about timing/tap-vs-auto-advance — the callback mechanism itself does not appear to be wired up to fire at all in this build.

## Steps to reproduce

1. Define a quest with a static `Dialog` field containing at least two lines, where a non-final line has an `onEnd` callback:
   ```ts
   override Dialog: QuestDialogDefinition = {
       main: [
           { speaker: "NPC", text: "Line one.", audio: "", timeout: 3000, onEnd: () => console.log("[BUG] onEnd fired") },
           { speaker: "NPC", text: "Line two.", audio: "", isEnd: true },
       ],
   };
   ```
2. Trigger the call with `this.createDialog("main")`.
3. Let the call auto-advance (or tap through) past "Line one." to "Line two."
4. Check the mod's console output / HackHub's render log for `[BUG] onEnd fired`.

**Expected:** the log line appears once "Line one." finishes.
**Actual:** it never appears, at any point, even after the call has fully ended.

## Suspected related finding

The `options`-driven branching (via `switchBranch`) *does* work correctly as long as the target branch's lines contain **no function properties at all** (no `onEnd`, no `onSelect` anywhere in the reachable branch). The moment any entry in the branch — even one not yet reached — carries a function property, dialog advancement stalls somewhere in that branch with no error. This suggests the engine may serialize/snapshot the `Dialog` branch at `createDialog()` time in a way that drops or corrupts function references, and something in that process silently breaks advancement rather than raising an error.

Notably, a separate community-built quest-editor tool for this game ([TheZeis/Hackhub-Quest-Editor](https://github.com/TheZeis/Hackhub-Quest-Editor)) compiles its own phone-call dialogue nodes to raw `Dialog` objects that **never emit `onEnd` or `onSelect` at all** — only `speaker`, `text`, `isEnd`, and `options` (`label`/`text`/`switchBranch`/`isEnd`) — and it calls `createDialog()` fire-and-forget, immediately continuing quest logic without waiting for any completion signal from the dialog. This strongly suggests the wider modding community has already independently converged on avoiding these two callback fields entirely.

**Additional evidence (2026-09-15):** wrapping a fully function-free `Dialog` object in a `Proxy` (so every `Dialog[branch][index]` property read can be logged, without ever storing a function value inside the data itself) confirmed that `createDialog()` reads **every line of every reachable branch — following `switchBranch` transitively across all five branches in our tree, roughly 23 lines total — within the same logged second the call starts**, long before the player has seen anything. This is a full, eager, synchronous traversal of the whole dialog graph at call-setup time, not a lazy per-line read as the call progresses. This strongly supports the `structuredClone`-style theory above: if the engine clones this entire graph up front (as opposed to `JSON.stringify`, which would just silently drop functions instead of throwing), a function anywhere in it would make that clone throw, and whatever internal playback state the clone was meant to populate would come out corrupted — plausibly explaining why display works fine right up until the exact line that carried the function, then silently stalls with no error surfaced to the mod.

## Current workaround

- `Dialog` is built with `switchBranch`/`isEnd` only — no `onEnd`/`onSelect` anywhere.
- Any side effect that should happen "when the call/line ends" is instead triggered directly from the code that calls `createDialog()`, on a fixed `setTimeout` delay long enough to outlast the call's expected duration. This is imprecise (there's no way to know exactly when the player finishes, especially if a step involves waiting on a player-selected option) but is the only mechanism that reliably works.

## Ask

- Confirm whether `onEnd`/`onSelect` are known-broken, or whether there's a supported way to know when a dialog line/call has actually finished that isn't documented.
- If broken, either fix the callback firing, or document that they should not be relied upon and that quest logic must be decoupled from dialog completion (matching what the community tooling already assumes).
