/*
A compact, read-only preview card for a Gramps object (currently a person),
intended to be shown on hover — e.g. over a node in a chart, a link, a map
marker or a timeline event. It fetches a light profile (not the full object
view) so it stays fast even when sweeping across many nodes, and offers a
single "open full page" affordance for navigation.
*/

import {html, css, LitElement} from 'lit'
import {mdiOpenInNew, mdiAccount} from '@mdi/js'

import '@material/web/iconbutton/icon-button.js'

import {GrampsjsAppStateMixin} from '../mixins/GrampsjsAppStateMixin.js'
import {personDisplayName, fireEvent} from '../util.js'
import {sharedStyles} from '../SharedStyles.js'
import './GrampsjsImg.js'
import './GrampsjsIcon.js'

const genderColor = {
  0: 'var(--color-girl)',
  1: 'var(--color-boy)',
  2: 'var(--color-unknown)',
  3: 'var(--color-other)',
}

export class GrampsjsObjectPreview extends GrampsjsAppStateMixin(LitElement) {
  static get styles() {
    return [
      sharedStyles,
      css`
        :host {
          display: block;
          width: 300px;
        }

        .card {
          background-color: var(
            --grampsjs-object-preview-background,
            var(--md-sys-color-surface-container-high, #fff)
          );
          color: var(--grampsjs-body-font-color);
          border-radius: 12px;
          box-shadow: 0 6px 24px var(--grampsjs-body-font-color-30);
          max-height: 360px;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .header {
          display: flex;
          gap: 14px;
          align-items: center;
          padding: 16px 16px 10px;
          position: relative;
        }

        .photo {
          width: 56px;
          height: 56px;
          flex-shrink: 0;
        }

        .avatar {
          width: 56px;
          height: 56px;
          flex-shrink: 0;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .titles {
          min-width: 0;
          padding-right: 28px;
        }

        .name {
          font-weight: 500;
          font-size: 1.05rem;
          line-height: 1.25;
        }

        .gid {
          font-size: 0.8rem;
          color: var(--grampsjs-body-font-color-60);
          margin-top: 2px;
        }

        .open {
          position: absolute;
          top: 8px;
          right: 8px;
          --md-icon-button-icon-size: 18px;
          --md-icon-button-state-layer-width: 32px;
          --md-icon-button-state-layer-height: 32px;
        }

        .body {
          padding: 0 16px 16px;
          overflow-y: auto;
        }

        .vital {
          font-size: 0.9rem;
          line-height: 1.4;
          color: var(--grampsjs-body-font-color-80);
        }

        .vital .glyph {
          display: inline-block;
          width: 1em;
          font-weight: 600;
          color: var(--grampsjs-body-font-color-60);
        }

        .empty {
          font-size: 0.9rem;
          color: var(--grampsjs-body-font-color-60);
          font-style: italic;
        }

        .skeleton {
          display: inline-block;
          border-radius: 4px;
          background-color: var(--grampsjs-body-font-color-10);
          color: transparent;
        }
      `,
    ]
  }

  static get properties() {
    return {
      grampsId: {type: String},
      objectType: {type: String},
      _data: {type: Object, attribute: false},
      _loading: {type: Boolean, attribute: false},
      _error: {type: Boolean, attribute: false},
    }
  }

  constructor() {
    super()
    this.grampsId = ''
    this.objectType = 'person'
    this._data = null
    this._loading = false
    this._error = false
  }

  willUpdate(changed) {
    if (changed.has('grampsId') && this.grampsId) {
      this._fetchData()
    }
  }

  async _fetchData() {
    const grampsId = this.grampsId
    this._loading = true
    this._error = false
    this._data = null
    const lang = this.appState?.i18n?.lang || ''
    const url = `/api/people/?gramps_id=${grampsId}&profile=self&extend=media_list&locale=${lang}`
    const result = await this.appState.apiGet(url)
    // ignore stale responses if the hovered person changed meanwhile
    if (this.grampsId !== grampsId) {
      return
    }
    if (result.data) {
      this._data = result.data[0] || null
      this._error = this._data === null
    } else {
      this._error = true
    }
    this._loading = false
  }

  render() {
    return html`<div class="card">${this._renderInner()}</div>`
  }

  _renderInner() {
    if (this._loading || (!this._data && !this._error)) {
      return this._renderLoading()
    }
    if (this._error || !this._data) {
      return html`<div class="header">
        <div class="empty">${this._('Error')}</div>
      </div>`
    }
    return html`${this._renderHeader()}${this._renderBody()}`
  }

  _renderLoading() {
    return html`
      <div class="header">
        <span class="avatar skeleton">&nbsp;</span>
        <div class="titles">
          <div class="name skeleton" style="width: 9em;">&nbsp;</div>
          <div class="gid skeleton" style="width: 4em;">&nbsp;</div>
        </div>
      </div>
    `
  }

  _renderHeader() {
    const data = this._data
    return html`
      <div class="header">
        ${this._renderPhoto()}
        <div class="titles">
          <div class="name">${personDisplayName(data)}</div>
          <div class="gid">${data.gramps_id}</div>
        </div>
        <md-icon-button
          class="open"
          @click="${this._handleOpen}"
          title="${this._('Open')}"
        >
          <grampsjs-icon path="${mdiOpenInNew}"></grampsjs-icon>
        </md-icon-button>
      </div>
    `
  }

  _renderPhoto() {
    const mediaObj = this._data?.extended?.media?.[0]
    const mediaRef = this._data?.media_list?.[0]
    if (mediaObj) {
      return html`
        <grampsjs-img
          class="photo"
          handle="${mediaObj.handle}"
          size="200"
          displayHeight="56"
          .rect="${mediaRef?.rect || []}"
          square
          circle
          mime="${mediaObj.mime}"
          checksum="${mediaObj.checksum}"
        ></grampsjs-img>
      `
    }
    const color = genderColor[this._data?.gender] ?? genderColor[2]
    return html`
      <span class="avatar" style="background-color: ${color};">
        <grampsjs-icon
          path="${mdiAccount}"
          color="#fff"
          width="32"
          height="32"
        ></grampsjs-icon>
      </span>
    `
  }

  _renderBody() {
    const profile = this._data?.profile || {}
    const birth = this._renderVital('∗', profile.birth)
    const death = this._renderVital('†', profile.death)
    if (!birth && !death) {
      return html``
    }
    return html`<div class="body">${birth}${death}</div>`
  }

  _renderVital(glyph, event) {
    if (!event?.date && !event?.place && !event?.place_name) {
      return null
    }
    const place = event.place_name || event.place || ''
    const sep = event.date && place ? ', ' : ''
    return html`<div class="vital">
      <span class="glyph">${glyph}</span> ${event.date || ''}${sep}${place}
    </div>`
  }

  _handleOpen() {
    fireEvent(this, 'nav', {path: `${this.objectType}/${this.grampsId}`})
  }
}

window.customElements.define('grampsjs-object-preview', GrampsjsObjectPreview)
