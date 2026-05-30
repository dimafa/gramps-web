import {describe, it, expect} from 'vitest'
import {
  clampPanelWidth,
  MIN_PANEL_WIDTH,
  MAX_PANEL_WIDTH,
  DEFAULT_PANEL_WIDTH,
} from '../../src/components/personPanelUtils.js'

describe('clampPanelWidth', () => {
  it('returns the value unchanged when within bounds', () => {
    expect(clampPanelWidth(500)).toBe(500)
  })

  it('clamps values below the minimum', () => {
    expect(clampPanelWidth(MIN_PANEL_WIDTH - 100)).toBe(MIN_PANEL_WIDTH)
  })

  it('clamps values above the maximum', () => {
    expect(clampPanelWidth(MAX_PANEL_WIDTH + 100)).toBe(MAX_PANEL_WIDTH)
  })

  it('returns the bounds exactly at the edges', () => {
    expect(clampPanelWidth(MIN_PANEL_WIDTH)).toBe(MIN_PANEL_WIDTH)
    expect(clampPanelWidth(MAX_PANEL_WIDTH)).toBe(MAX_PANEL_WIDTH)
  })

  it('falls back to the default for non-finite input', () => {
    expect(clampPanelWidth(NaN)).toBe(DEFAULT_PANEL_WIDTH)
    expect(clampPanelWidth(parseInt('not-a-number', 10))).toBe(
      DEFAULT_PANEL_WIDTH
    )
    expect(clampPanelWidth(Infinity)).toBe(DEFAULT_PANEL_WIDTH)
  })

  it('respects custom bounds', () => {
    expect(clampPanelWidth(50, 100, 200)).toBe(100)
    expect(clampPanelWidth(250, 100, 200)).toBe(200)
    expect(clampPanelWidth(150, 100, 200)).toBe(150)
  })
})
