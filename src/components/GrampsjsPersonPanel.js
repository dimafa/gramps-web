import {LitElement, css, html} from 'lit'

import {
  mdiArrowCollapseHorizontal,
  mdiArrowExpandHorizontal,
  mdiClose,
} from '@mdi/js'

import {GrampsjsAppStateMixin} from '../mixins/GrampsjsAppStateMixin.js'
import {fireEvent} from '../util.js'
import {clampPanelWidth} from './personPanelUtils.js'
import './GrampsjsIcon.js'
import '../views/GrampsjsViewPerson.js'

const STORAGE_KEY = 'personPanelWidth'

export class GrampsjsPersonPanel extends GrampsjsAppStateMixin(LitElement) {
  static get styles() {
    return css`
      #panel {
        position: fixed;
        top: var(--grampsjs-app-bar-height, 64px);
        right: 0;
        bottom: 0;
        z-index: 5;
        display: flex;
        flex-direction: column;
        background-color: var(--md-sys-color-surface);
        box-shadow: -2px 0 12px rgba(0, 0, 0, 0.25);
        overflow: hidden;
      }

      :host(.resizing) #panel {
        user-select: none;
      }

      #resizer {
        position: absolute;
        top: 0;
        bottom: 0;
        left: 0;
        width: 10px;
        cursor: ew-resize;
        touch-action: none;
        z-index: 1;
      }

      #resizer::after {
        content: '';
        position: absolute;
        top: 0;
        bottom: 0;
        left: 4px;
        width: 2px;
        background-color: var(--md-sys-color-outline-variant, #ccc);
        opacity: 0.5;
        transition: opacity 0.15s, background-color 0.15s;
      }

      #resizer:hover::after,
      :host(.resizing) #resizer::after {
        opacity: 1;
        background-color: var(--md-sys-color-primary, #6750a4);
      }

      #header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex: 0 0 auto;
        padding: 6px 6px 6px 20px;
        border-bottom: 1px solid var(--md-sys-color-outline-variant, #e0e0e0);
      }

      #title {
        font-size: 1.1em;
        font-weight: 500;
        color: var(--md-sys-color-on-surface);
      }

      #actions {
        display: inline-flex;
        gap: 2px;
        flex: 0 0 auto;
      }

      #close,
      #expand {
        border: none;
        background: none;
        cursor: pointer;
        padding: 8px;
        border-radius: 50%;
        display: inline-flex;
        color: var(--md-sys-color-on-surface-variant);
      }

      #close:hover,
      #expand:hover {
        background-color: var(--md-sys-color-surface-container-high, #eee);
      }

      #panel.expanded #resizer {
        display: none;
      }

      #body {
        flex: 1 1 auto;
        overflow: auto;
      }

      #body grampsjs-view-person {
        margin: 16px 20px;
        display: block;
      }

      @media (max-width: 768px) {
        #panel {
          top: var(--grampsjs-app-bar-height, 56px);
          width: 100% !important;
        }

        #resizer {
          display: none;
        }
      }
    `
  }

  static get properties() {
    return {
      open: {type: Boolean, reflect: true},
      grampsId: {type: String},
      width: {type: Number},
      _resizing: {type: Boolean, state: true},
      _expanded: {type: Boolean, state: true},
    }
  }

  constructor() {
    super()
    this.open = false
    this.grampsId = ''
    this.width = clampPanelWidth(
      parseInt(window.localStorage.getItem(STORAGE_KEY) ?? '', 10)
    )
    this._resizing = false
    this._expanded = false
    this._expandedForEdit = false
    this._preEditExpanded = false
    this._startX = 0
    this._startWidth = 0
    this._boundPointerMove = this._onPointerMove.bind(this)
    this._boundPointerUp = this._onPointerUp.bind(this)
    this._boundEditOn = this._onEditOn.bind(this)
    this._boundEditOff = this._onEditOff.bind(this)
  }

  connectedCallback() {
    super.connectedCallback()
    // Auto-expand to full width while editing (more room for forms), then
    // restore the previous size when editing ends.
    window.addEventListener('edit-mode:on', this._boundEditOn)
    window.addEventListener('edit-mode:off', this._boundEditOff)
  }

  render() {
    if (!this.open) {
      return html``
    }
    // When expanded, fill the main content area: anchor the left edge to the
    // right of the navigation drawer when it is open. The app sets
    // --mdc-top-app-bar-width to calc(100% - drawerWidth) only while the drawer
    // is open and non-modal, so this resolves to the drawer width when the nav
    // is visible and to 0 otherwise (no JS / no toggle tracking needed).
    // Collapsed: an explicit (resizable) width anchored to the right edge.
    const panelStyle = this._expanded
      ? 'left: calc(100% - var(--mdc-top-app-bar-width, 100%)); width: auto;'
      : `width: ${this.width}px;`
    return html`
      <div
        id="panel"
        class=${this._expanded ? 'expanded' : ''}
        style=${panelStyle}
      >
        <div
          id="resizer"
          @pointerdown=${this._onPointerDown}
          title=${this._('Resize panel')}
        ></div>
        <div id="header">
          <span id="title">${this._('Person Details')}</span>
          <span id="actions">
            <button
              id="expand"
              @click=${this._toggleExpand}
              aria-label=${this._expanded
                ? this._('Collapse')
                : this._('Expand')}
              title=${this._expanded ? this._('Collapse') : this._('Expand')}
            >
              <grampsjs-icon
                path=${this._expanded
                  ? mdiArrowCollapseHorizontal
                  : mdiArrowExpandHorizontal}
                height="24"
                width="24"
                color="currentColor"
              ></grampsjs-icon>
            </button>
            <button
              id="close"
              @click=${this._close}
              aria-label=${this._('Close')}
              title=${this._('Close')}
            >
              <grampsjs-icon
                path=${mdiClose}
                height="24"
                width="24"
                color="currentColor"
              ></grampsjs-icon>
            </button>
          </span>
        </div>
        <div id="body">
          <grampsjs-view-person
            .grampsId=${this.grampsId}
            ?active=${this.open}
            ?narrow=${!this._expanded}
            ?hideTreeButton=${true}
            ?hideExternalSearchButton=${true}
            ?inPanel=${true}
            .appState=${this.appState}
          ></grampsjs-view-person>
        </div>
      </div>
    `
  }

  _close() {
    this.open = false
    fireEvent(this, 'person-panel:close', {})
  }

  _toggleExpand() {
    this._expanded = !this._expanded
  }

  _onEditOn() {
    if (!this.open || this._expandedForEdit) {
      return
    }
    this._preEditExpanded = this._expanded
    this._expandedForEdit = true
    this._expanded = true
  }

  _onEditOff() {
    // Only auto-collapse if we were the one that auto-expanded for editing.
    if (!this._expandedForEdit) {
      return
    }
    this._expandedForEdit = false
    this._expanded = this._preEditExpanded
  }

  _onPointerDown(event) {
    event.preventDefault()
    this._resizing = true
    this._startX = event.clientX
    this._startWidth = this.width
    this._resizerEl = event.currentTarget
    this._pointerId = event.pointerId
    // Capture the pointer so drags keep tracking even over the iframe / chart.
    try {
      this._resizerEl.setPointerCapture(this._pointerId)
    } catch (e) {
      // ignore – capture is a best-effort enhancement
    }
    window.addEventListener('pointermove', this._boundPointerMove)
    window.addEventListener('pointerup', this._boundPointerUp)
  }

  _onPointerMove(event) {
    if (!this._resizing) {
      return
    }
    // Handle sits on the left edge: dragging left widens the panel.
    this.width = clampPanelWidth(
      this._startWidth + (this._startX - event.clientX)
    )
  }

  _onPointerUp() {
    if (!this._resizing) {
      return
    }
    this._resizing = false
    this.classList.remove('resizing')
    if (this._resizerEl && this._pointerId != null) {
      try {
        this._resizerEl.releasePointerCapture(this._pointerId)
      } catch (e) {
        // ignore
      }
    }
    window.removeEventListener('pointermove', this._boundPointerMove)
    window.removeEventListener('pointerup', this._boundPointerUp)
    window.localStorage.setItem(STORAGE_KEY, String(this.width))
  }

  disconnectedCallback() {
    window.removeEventListener('pointermove', this._boundPointerMove)
    window.removeEventListener('pointerup', this._boundPointerUp)
    window.removeEventListener('edit-mode:on', this._boundEditOn)
    window.removeEventListener('edit-mode:off', this._boundEditOff)
    super.disconnectedCallback()
  }
}

window.customElements.define('grampsjs-person-panel', GrampsjsPersonPanel)
