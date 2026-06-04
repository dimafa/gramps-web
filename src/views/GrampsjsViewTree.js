import {css, html} from 'lit'
import tippy from 'tippy.js'

import '@material/web/tabs/tabs'
import '@material/web/tabs/primary-tab'

import {mdiFamilyTree} from '@mdi/js'
import {GrampsjsView} from './GrampsjsView.js'
import '../components/GrampsjsObjectPreview.js'
import './GrampsjsViewDescendantChart.js'
import './GrampsjsViewTreeChart.js'
import './GrampsjsViewHourglassChart.js'
import './GrampsjsViewFanChart.js'
import './GrampsjsViewRelationshipChart.js'
import {fireEvent} from '../util.js'
import {
  chartFanIconPath,
  hourglassIconPath,
  renderIconSvg,
  relationshipGraphIconPath,
} from '../icons.js'
import {DEFAULT_TREE_VIEW, getTreeViewTabIndex} from '../treeDefaults.js'

// Strip Tippy's default tooltip chrome so the preview card's own surface shows.
let previewThemeInjected = false
function injectPreviewTheme() {
  if (previewThemeInjected) {
    return
  }
  previewThemeInjected = true
  const style = document.createElement('style')
  style.textContent = `
    .tippy-box[data-theme~='grampsjs-preview'] {
      background-color: transparent;
      box-shadow: none;
    }
    .tippy-box[data-theme~='grampsjs-preview'] > .tippy-content {
      padding: 0;
    }
  `
  document.head.appendChild(style)
}

export class GrampsjsViewTree extends GrampsjsView {
  static get styles() {
    return [
      super.styles,
      css`
        .with-margin {
          margin: 25px 40px;
        }

        md-primary-tab {
          opacity: 0.8;
        }

        md-primary-tab[active] {
          opacity: 1;
        }

        #tabs {
          height: 85px;
        }
      `,
    ]
  }

  static get properties() {
    return {
      grampsId: {type: String},
      view: {type: String},
      _history: {type: Array},
      _currentTabId: {type: Number},
    }
  }

  constructor() {
    super()
    this.grampsId = ''
    this.view = 'ancestor'
    this._history = this.grampsId ? [this.grampsId] : []
    this._currentTabId = getTreeViewTabIndex(DEFAULT_TREE_VIEW)
    this._appliedTreeDefaultView = null
    this._previewCard = null
    this._previewTippy = null
    this._previewTarget = null
    this._previewShowTimer = null
    this._previewHideTimer = null
    this._onPersonHovered = this._onPersonHovered.bind(this)
    this._onPersonUnhovered = this._onPersonUnhovered.bind(this)
    this._onPreviewNav = this._onPreviewNav.bind(this)
  }

  shouldUpdate(changed) {
    // Allow one render when active changes so child chart views receive
    // the updated active value — the base class blocks renders when inactive.
    if (changed.has('active')) {
      return true
    }
    return super.shouldUpdate(changed)
  }

  updated(changed) {
    super.updated(changed)
    if (changed.has('_currentTabId')) {
      fireEvent(this, 'edit-mode:off', {})
    }
  }

  renderContent() {
    if (this.grampsId === '') {
      return html`
        <div class="with-margin">
          <p>
            ${this._('No Home Person set.')}
            <a href="/">${this._('Home')}</a>
          </p>
        </div>
      `
    }
    return html`
      <div id="tabs">${this.renderTabs()}</div>
      ${this._currentTabId === 0 ? this._renderPedigree() : ''}
      ${this._currentTabId === 1 ? this._renderDescendantTree() : ''}
      ${this._currentTabId === 2 ? this._renderHourglassTree() : ''}
      ${this._currentTabId === 3 ? this._renderRelationshipChart() : ''}
      ${this._currentTabId === 4 ? this._renderFan() : ''}
    `
  }

  _handleTabChange(e) {
    this._currentTabId = e.target.activeTabIndex
  }

  renderTabs() {
    return html`
      <md-tabs
        .activeTabIndex=${this._currentTabId}
        @change=${this._handleTabChange}
      >
        <md-primary-tab has-icon
          >${this._('Ancestor Tree')}
          <span slot="icon"
            >${renderIconSvg(
              mdiFamilyTree,
              '--md-sys-color-primary',
              -90
            )}</span
          >
        </md-primary-tab>
        <md-primary-tab has-icon>
          ${this._('Descendant Tree')}
          <span slot="icon"
            >${renderIconSvg(mdiFamilyTree, '--md-sys-color-primary', 90)}</span
          >
        </md-primary-tab>
        <md-primary-tab has-icon>
          ${this._('Hourglass Graph')}
          <span slot="icon"
            >${renderIconSvg(hourglassIconPath, '--md-sys-color-primary')}</span
          >
        </md-primary-tab>
        <md-primary-tab has-icon>
          ${this._('Relationship Graph')}
          <span slot="icon"
            >${renderIconSvg(
              relationshipGraphIconPath,
              '--md-sys-color-primary'
            )}</span
          >
        </md-primary-tab>
        <md-primary-tab has-icon>
          ${this._('Fan Chart')}
          <span slot="icon"
            >${renderIconSvg(chartFanIconPath, '--md-sys-color-primary')}</span
          >
        </md-primary-tab>
      </md-tabs>
    `
  }

  _renderFan() {
    return html`
      <grampsjs-view-fan-chart
        @tree:back="${this._prevPerson}"
        @tree:person="${this._goToPerson}"
        @tree:home="${this._backToHomePerson}"
        grampsId=${this.grampsId}
        ?active=${this.active}
        .appState="${this.appState}"
        .settings=${this.settings}
        ?disableBack=${this._history.length < 2}
        ?disableHome=${this.grampsId === this.settings.homePerson}
      >
      </grampsjs-view-fan-chart>
    `
  }

  _renderRelationshipChart() {
    return html`
      <grampsjs-view-relationship-chart
        @tree:back="${this._prevPerson}"
        @tree:person="${this._goToPerson}"
        @tree:home="${this._backToHomePerson}"
        grampsId=${this.grampsId}
        ?active=${this.active}
        .appState="${this.appState}"
        .settings=${this.settings}
        ?disableBack=${this._history.length < 2}
        ?disableHome=${this.grampsId === this.settings.homePerson}
      >
      </grampsjs-view-relationship-chart>
    `
  }

  _renderPedigree() {
    return html`
      <grampsjs-view-tree-chart
        @tree:back="${this._prevPerson}"
        @tree:person="${this._goToPerson}"
        @tree:home="${this._backToHomePerson}"
        grampsId=${this.grampsId}
        ?active=${this.active}
        .appState="${this.appState}"
        .settings=${this.settings}
        ?disableBack=${this._history.length < 2}
        ?disableHome=${this.grampsId === this.settings.homePerson}
      >
      </grampsjs-view-tree-chart>
    `
  }

  _renderDescendantTree() {
    return html`
      <grampsjs-view-descendant-chart
        @tree:back="${this._prevPerson}"
        @tree:person="${this._goToPerson}"
        @tree:home="${this._backToHomePerson}"
        grampsId=${this.grampsId}
        ?active=${this.active}
        .appState="${this.appState}"
        .settings=${this.settings}
        ?disableBack=${this._history.length < 2}
        ?disableHome=${this.grampsId === this.settings.homePerson}
      >
      </grampsjs-view-descendant-chart>
    `
  }

  _renderHourglassTree() {
    return html`
      <grampsjs-view-hourglass-chart
        @tree:back="${this._prevPerson}"
        @tree:person="${this._goToPerson}"
        @tree:home="${this._backToHomePerson}"
        grampsId=${this.grampsId}
        ?active=${this.active}
        .appState="${this.appState}"
        .settings=${this.settings}
        ?disableBack=${this._history.length < 2}
        ?disableHome=${this.grampsId === this.settings.homePerson}
      >
      </grampsjs-view-hourglass-chart>
    `
  }

  _prevPerson() {
    this._history.pop()
    this.grampsId = this._history.pop()
  }

  _backToHomePerson() {
    this.grampsId = this.settings.homePerson
  }

  _goToPerson() {
    fireEvent(this, 'nav', {path: `person/${this.grampsId}`})
  }

  connectedCallback() {
    super.connectedCallback()
    window.addEventListener(
      'pedigree:person-selected',
      this._selectPerson.bind(this)
    )
    window.addEventListener('pedigree:person-hovered', this._onPersonHovered)
    window.addEventListener(
      'pedigree:person-unhovered',
      this._onPersonUnhovered
    )
  }

  disconnectedCallback() {
    window.removeEventListener('pedigree:person-hovered', this._onPersonHovered)
    window.removeEventListener(
      'pedigree:person-unhovered',
      this._onPersonUnhovered
    )
    clearTimeout(this._previewShowTimer)
    clearTimeout(this._previewHideTimer)
    if (this._previewResizeObserver) {
      this._previewResizeObserver.disconnect()
      this._previewResizeObserver = null
    }
    if (this._previewTippy) {
      this._previewTippy.destroy()
      this._previewTippy = null
    }
    super.disconnectedCallback()
  }

  // Lazily create the shared hover-preview popover (a Tippy singleton whose
  // reference rect is repointed to whichever node is currently hovered).
  _ensurePreview() {
    if (this._previewTippy) {
      return
    }
    injectPreviewTheme()
    this._previewCard = document.createElement('grampsjs-object-preview')
    this._previewCard.appState = this.appState
    this._previewCard.addEventListener('mouseenter', () =>
      clearTimeout(this._previewHideTimer)
    )
    this._previewCard.addEventListener('mouseleave', () =>
      this._schedulePreviewHide()
    )
    // The card is portalled into document.body, so nav events fired from the
    // hosted person view never reach the app router. Catch them here and
    // re-fire from inside the app tree.
    this._previewCard.addEventListener('nav', this._onPreviewNav)
    // The person view loads asynchronously and grows the card after it is
    // first positioned; reposition Popper whenever the card resizes so a tall
    // card stays clamped within the viewport.
    this._previewResizeObserver = new ResizeObserver(() => {
      this._previewTippy?.popperInstance?.update()
    })
    this._previewResizeObserver.observe(this._previewCard)
    this._previewTippy = tippy(document.body, {
      content: this._previewCard,
      trigger: 'manual',
      interactive: true,
      interactiveBorder: 16,
      arrow: false,
      placement: 'right',
      offset: [0, 14],
      maxWidth: 'none',
      appendTo: () => document.body,
      theme: 'grampsjs-preview',
      popperOptions: {
        modifiers: [
          {name: 'flip', options: {fallbackPlacements: ['left']}},
          {
            name: 'preventOverflow',
            options: {altAxis: true, tether: false, padding: 12},
          },
        ],
      },
    })
  }

  _onPreviewNav(event) {
    event.stopPropagation()
    this._previewTippy?.hide()
    fireEvent(this, 'nav', event.detail)
  }

  _onPersonHovered(event) {
    const {grampsId, target} = event.detail
    if (!grampsId) {
      return
    }
    clearTimeout(this._previewHideTimer)
    clearTimeout(this._previewShowTimer)
    this._previewTarget = target
    this._previewShowTimer = setTimeout(() => {
      this._ensurePreview()
      this._previewCard.appState = this.appState
      this._previewCard.grampsId = grampsId
      this._previewTippy.setProps({
        getReferenceClientRect: () =>
          this._previewTarget.getBoundingClientRect(),
      })
      this._previewTippy.show()
    }, 350)
  }

  _onPersonUnhovered() {
    clearTimeout(this._previewShowTimer)
    this._schedulePreviewHide()
  }

  _schedulePreviewHide() {
    clearTimeout(this._previewHideTimer)
    this._previewHideTimer = setTimeout(() => {
      this._previewTippy?.hide()
    }, 200)
  }

  update(changed) {
    super.update(changed)
    if (changed.has('grampsId')) {
      this._history.push(this.grampsId)
      // limit history to 100 people
      this._history = this._history.slice(-100)
    }
    if (this.active && (changed.has('active') || changed.has('settings'))) {
      this._applyPreferredTabIfNeeded()
    }
  }

  _applyPreferredTabIfNeeded() {
    const preferredView = this.settings?.treeDefaultView ?? DEFAULT_TREE_VIEW
    if (preferredView === this._appliedTreeDefaultView) {
      return
    }
    const preferredIndex = getTreeViewTabIndex(preferredView)
    this._appliedTreeDefaultView = preferredView
    if (this._currentTabId !== preferredIndex) {
      this._currentTabId = preferredIndex
    }
  }

  async _selectPerson(event) {
    const {grampsId} = event.detail
    this.grampsId = grampsId
  }
}

window.customElements.define('grampsjs-view-tree', GrampsjsViewTree)
