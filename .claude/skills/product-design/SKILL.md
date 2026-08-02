---
name: product-design
description: Product Design Operating Contract — the rules to follow before and while building any user-facing feature (UI, flow, form, page). Use whenever a task involves designing or implementing something a user will see or interact with, not just wiring backend logic.
---

# Product Design Operating Contract

This contract governs how features get designed and built in this project. It applies to any UI, flow, form, or interaction — not just visual polish. Read it before writing the first line of a new feature, and re-check it before calling a feature "done."

## 1. Identify the user need before touching code

- State, in one sentence, who is using this and what they are trying to accomplish. If you can't state it, you don't understand the feature well enough to build it — ask or investigate first.
- Distinguish the user's actual goal from the literal request. A request to "add a delete button" implies a need to safely remove something; that implies confirmation, undo, or both.
- Identify the primary action of the screen/flow before deciding layout. Everything else is secondary and should visually defer to it.
- Prefer the smallest change that fully satisfies the need over the most impressive one. Don't design for hypothetical future requirements that weren't asked for.

## 2. Design and handle every state, not just the happy path

A feature isn't finished until all of these are considered, and the ones that are reachable are implemented:

- **Empty** — nothing to show yet (first use, no data, cleared filters). Never leave a blank void; explain what's missing and what to do next.
- **Loading** — the wait between "requested" and "ready." Use skeletons/spinners that match the eventual layout so nothing jumps. Never leave the user wondering if a click registered.
- **Partial / streaming** — data that arrives incrementally (paginated lists, streamed AI responses). The UI must be usable and legible mid-arrival, not just at the end.
- **Success** — the expected case. Confirm the outcome, don't just silently apply it, when the action is non-trivial.
- **Error** — anything that can fail must show what failed and what to do about it. Never a blank screen, a silent no-op, or a raw stack trace. Distinguish recoverable errors (retry, fix input) from terminal ones.
- **Empty-after-error / retry** — after a failed action, the retry path must be obvious and must not lose the user's input.
- **Disabled / permission-denied** — controls the user can see but can't currently use need a visible reason, not just a greyed-out control with no explanation.
- **Edge quantities** — one item, exactly the limit, one over the limit, extremely long text/names, extremely large numbers. Test the boundaries, not just the middle.

Before marking a feature complete, explicitly enumerate which of these states are reachable for it and confirm each one was actually implemented, not assumed.

## 3. Respect the user's control and time

- Never take a destructive or hard-to-reverse action without confirmation or an undo path (delete, overwrite, send, publish).
- Every async action gives immediate feedback (disable the trigger, show progress) — never let a user double-submit by clicking twice.
- Preserve user input across errors, navigation, and retries. Never make someone retype something because of a validation failure or a network blip.
- Keyboard and screen-reader users get the same functionality as mouse users: focus order follows visual order, interactive elements are reachable and labeled, forms have real `<label>`s, and custom controls expose the correct ARIA role/state.
- Motion and animation are additive, never load-bearing. If an animation fails to fire, is skipped, or is disabled (`prefers-reduced-motion`), the content must still be fully visible and usable.

## 4. Make the interface predictable

- Reuse existing components, patterns, and copy tone from the rest of the app before inventing a new one. Consistency beats novelty.
- Match the number of options/inputs to the actual decision being made — don't expose configuration nobody asked for.
- Error and empty-state copy is specific and actionable ("Le fichier dépasse 10 Mo — choisissez-en un plus petit"), never generic ("Une erreur est survenue").
- Layout must hold up at the actual viewport sizes and content lengths the app will see in practice, not just the design's default demo data.

## 5. Verify like a user, not like a compiler

- A type-check or a successful build proves the code compiles — it does not prove the feature works. Actually exercise the flow (click through it, submit the form, trigger the error) before calling it done.
- Check the states from §2 live, not just the happy path: force an error, force an empty result, force a slow network if the tooling allows it.
- Check responsiveness and, where relevant, dark mode / theming — don't assume desktop-light is representative.
- If live verification isn't possible in the current environment, say so explicitly rather than claiming it was tested.

## When this contract applies

Any task that produces or changes something a user sees or interacts with: new pages, new components, forms, modals, empty/loading/error states, navigation, and copy changes with UX implications. It does not gate purely internal changes (scripts, migrations, backend-only refactors) unless they surface user-visible behavior.
