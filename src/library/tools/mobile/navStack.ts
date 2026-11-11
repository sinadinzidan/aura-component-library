/**
 * The state of a tabbed, stacked phone app: each tab has its own stack of screens, a push adds a
 * screen on top of the active tab, a pop removes it, and tapping the active tab again returns to
 * its first screen. Pure, so the back path can be tested without a screen.
 */

export type StackEntry = {
  /** Unique per entry, so the same screen can be pushed twice. */
  id: string;
  /** Which screen to draw: `work-order`, `asset`. */
  screen: string;
  /** The title shown in the app bar and as the label of the back button on the next screen. */
  title: string;
  params?: Readonly<Record<string, string>>;
};

export type NavDirection = 'push' | 'pop' | 'switch' | 'none';

export type NavState = {
  activeTab: string;
  stacks: Readonly<Record<string, readonly StackEntry[]>>;
  /** What the last action did, so the screen can slide the right way. */
  direction: NavDirection;
  nextId: number;
};

export type NavAction =
  | { type: 'push'; screen: string; title: string; params?: Readonly<Record<string, string>> }
  | { type: 'pop' }
  | { type: 'popToRoot' }
  | { type: 'selectTab'; tab: string }
  | { type: 'reset'; tab?: string };

export type NavRoots = Readonly<Record<string, Omit<StackEntry, 'id'>>>;

/** One stack per tab, each holding its root screen. */
export function createNavState(roots: NavRoots, activeTab: string): NavState {
  const stacks: Record<string, readonly StackEntry[]> = {};
  let nextId = 1;
  for (const [tab, root] of Object.entries(roots)) {
    stacks[tab] = [{ ...root, id: `${root.screen}-${nextId}` }];
    nextId += 1;
  }
  return { activeTab, stacks, direction: 'none', nextId };
}

export function stackOf(state: NavState): readonly StackEntry[] {
  return state.stacks[state.activeTab] ?? [];
}

/** The screen on top of the active tab. */
export function currentEntry(state: NavState): StackEntry | undefined {
  const stack = stackOf(state);
  return stack[stack.length - 1];
}

/** The screen under the current one: what Back returns to. */
export function previousEntry(state: NavState): StackEntry | undefined {
  const stack = stackOf(state);
  return stack.length > 1 ? stack[stack.length - 2] : undefined;
}

export function canGoBack(state: NavState): boolean {
  return stackOf(state).length > 1;
}

function withStack(state: NavState, tab: string, stack: readonly StackEntry[], direction: NavDirection, nextId = state.nextId): NavState {
  return { ...state, stacks: { ...state.stacks, [tab]: stack }, direction, nextId };
}

export function navReducer(state: NavState, action: NavAction, roots?: NavRoots): NavState {
  const tab = state.activeTab;
  const stack = stackOf(state);
  switch (action.type) {
    case 'push': {
      const entry: StackEntry = { id: `${action.screen}-${state.nextId}`, screen: action.screen, title: action.title, params: action.params };
      return withStack(state, tab, [...stack, entry], 'push', state.nextId + 1);
    }
    case 'pop':
      return stack.length > 1 ? withStack(state, tab, stack.slice(0, -1), 'pop') : state;
    case 'popToRoot':
      return stack.length > 1 ? withStack(state, tab, stack.slice(0, 1), 'pop') : state;
    case 'selectTab': {
      if (!(action.tab in state.stacks)) return state;
      if (action.tab === tab) return stack.length > 1 ? withStack(state, tab, stack.slice(0, 1), 'pop') : state;
      return { ...state, activeTab: action.tab, direction: 'switch' };
    }
    case 'reset': {
      if (!roots) return state;
      return createNavState(roots, action.tab ?? state.activeTab);
    }
    default:
      return state;
  }
}
