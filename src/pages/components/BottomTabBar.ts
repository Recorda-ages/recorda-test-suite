import type { Locator } from "@playwright/test";

export type BottomTab = "camera" | "feed" | "profile";

/**
 * The bottom navigation rendered by Feed and Profile.
 *
 * Each screen renders its own copy, and on web the native stack keeps previous screens
 * mounted, so after Feed → Profile there are two tab bars in the DOM. Always build this
 * component from the owning screen's root locator, never from `page`.
 */
export class BottomTabBar {
  constructor(private readonly screen: Locator) {}

  tab(name: BottomTab): Locator {
    return this.screen.getByTestId(`tab-bar-${name}`);
  }

  async select(name: BottomTab): Promise<void> {
    await this.tab(name).click();
  }

  // No `expectActive()` yet: react-native-web 0.21 does not map
  // `accessibilityState.selected` to `aria-selected`, so the active tab is not observable.
  // TODO(frontend): use the `aria-selected` prop in BottomTabBar, then assert it here.
}
