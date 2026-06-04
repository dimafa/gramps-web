/*
A hover preview of a Gramps object (currently a person). It hosts the full
person view — the same content as the /person/<id> page — in a large,
scrollable popover so the object can be inspected (and scrolled through)
without navigating away or re-centering a chart.

Navigation events fired from inside the view (the "open page" button, links to
related objects) bubble out of this card; because the card is portalled into
document.body by the popover, the hosting view re-fires them from inside the
app tree so routing still works.
*/

import {html, css, LitElement} from 'lit'
import {mdiOpenInNew} from '@mdi/js'

import '@material/web/iconbutton/icon-button.js'

import {GrampsjsAppStateMixin} from '../mixins/GrampsjsAppStateMixin.js'
import {fireEvent} from '../util.js'
import {sharedStyles} from '../SharedStyles.js'
import './GrampsjsIcon.js'
import '../views/GrampsjsViewPerson.js'

export class GrampsjsObjectPreview extends GrampsjsAppStateMixin(LitElement) {
  static get styles() {
    return [
      sharedStyles,
      css`
        :host {
          display: block;
          width: 420px;
          max-width: calc(100vw - 32px);
        }

        .card {
          background-color: var(
            --grampsjs-object-preview-background,
            var(--md-sys-color-surface-container-high, #fff)
          );
          color: var(--grampsjs-body-font-color);
          border-radius: 12px;
          box-shadow: 0 6px 24px var(--grampsjs-body-font-color-30);
          max-height: min(80vh, 720px);
          overflow-y: auto;
          overflow-x: hidden;
          overscroll-behavior: contain;
        }

        /* The hosted view adds its own page margin (GrampsjsView :host) on top
           of any padding here; zero it out so the preview is tightly framed. */
        .card > grampsjs-view-person {
          display: block;
          margin: 0;
          padding: 10px 12px 12px;
        }

        /* Zero-height sticky overlay so the open button floats in the top-right
           corner without pushing the page content down. */
        .toolbar {
          position: sticky;
          top: 0;
          height: 0;
          z-index: 3;
          display: flex;
          justify-content: flex-end;
          pointer-events: none;
        }

        .toolbar md-icon-button {
          pointer-events: auto;
          margin: 2px;
          --md-icon-button-icon-size: 20px;
        }
      `,
    ]
  }

  static get properties() {
    return {
      grampsId: {type: String},
      objectType: {type: String},
    }
  }

  constructor() {
    super()
    this.grampsId = ''
    this.objectType = 'person'
  }

  // Reset the scroll position whenever the previewed person changes, so a new
  // hover always starts at the top of the page.
  updated(changed) {
    if (changed.has('grampsId')) {
      const card = this.renderRoot.querySelector('.card')
      if (card) {
        card.scrollTop = 0
      }
    }
  }

  render() {
    if (!this.grampsId) {
      return html``
    }
    return html`
      <div class="card">
        <div class="toolbar">
          <md-icon-button
            @click="${this._handleOpen}"
            title="${this._('Open')}"
          >
            <grampsjs-icon path="${mdiOpenInNew}"></grampsjs-icon>
          </md-icon-button>
        </div>
        <grampsjs-view-person
          .grampsId="${this.grampsId}"
          .appState="${this.appState}"
          ?active="${true}"
          narrow
          inPanel
          hideFab
          hideTreeButton
          hideExternalSearchButton
        ></grampsjs-view-person>
      </div>
    `
  }

  _handleOpen() {
    fireEvent(this, 'nav', {path: `${this.objectType}/${this.grampsId}`})
  }
}

window.customElements.define('grampsjs-object-preview', GrampsjsObjectPreview)
