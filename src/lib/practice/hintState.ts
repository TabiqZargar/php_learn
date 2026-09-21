/**
 * Pure hint-reveal state for the practice window, kept outside the
 * component so the rules are unit-testable:
 *  - exactly ONE hint is revealed per reveal action,
 *  - previously revealed hints stay visible,
 *  - nothing changes once every hint has been revealed,
 *  - reset returns to the initial zero-revealed state.
 * The window never advances hidden state from an evaluation result; a
 * passing check must not auto-reveal anything.
 */

export interface HintState {
  revealedCount: number;
}

export type HintAction =
  | { type: "reveal"; totalHints: number }
  | { type: "reset" };

export const INITIAL_HINT_STATE: HintState = { revealedCount: 0 };

export function hintReducer(state: HintState, action: HintAction): HintState {
  switch (action.type) {
    case "reveal": {
      if (action.totalHints <= 0 || state.revealedCount >= action.totalHints) {
        return state;
      }
      return { revealedCount: state.revealedCount + 1 };
    }
    case "reset":
      return INITIAL_HINT_STATE;
  }
}