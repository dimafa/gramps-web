export const MIN_PANEL_WIDTH = 280
export const MAX_PANEL_WIDTH = 900
export const DEFAULT_PANEL_WIDTH = 420

// Keep a requested panel width within sane bounds, falling back to the
// default for non-finite input (e.g. an empty/garbage localStorage value).
export function clampPanelWidth(
  width,
  min = MIN_PANEL_WIDTH,
  max = MAX_PANEL_WIDTH
) {
  if (!Number.isFinite(width)) {
    return DEFAULT_PANEL_WIDTH
  }
  return Math.min(Math.max(width, min), max)
}
