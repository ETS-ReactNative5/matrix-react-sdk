/*
Copyright 2015, 2016 OpenMarket Ltd

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

'use strict';

import React from 'react';
import { _t } from '../../../languageHandler';
import Modal from '../../../Modal';
import MatrixClientPeg from '../../../MatrixClientPeg';

module.exports = React.createClass({
    displayName: 'UnknownBody',

    _onImportE2eKeysClicked: function() {
        Modal.createTrackedDialogAsync('Import E2E Keys', '',
            import('../../../async-components/views/dialogs/ImportE2eKeysDialog'),
            {matrixClient: MatrixClientPeg.get()},
        );
    },

    render: function() {
        let tooltip = _t("Removed or unknown message type");
        if (this.props.mxEvent.isRedacted()) {
            const redactedBecauseUserId = this.props.mxEvent.getUnsigned().redacted_because.sender;
            tooltip = redactedBecauseUserId ?
                _t("Message removed by %(userId)s", { userId: redactedBecauseUserId }) :
                _t("Message removed");
        }

        const event = this.props.mxEvent.getContent();
        let text, text2;
        if (event && event.msgtype && event.msgtype === "m.bad.encrypted") {
            text = _t("Decryption fail: Please open Tchap on an other connected device to allow key sharing.");
            // text += ' ';
            text2 = _t(
                'Or <requestLink>import your keys</requestLink>.',
                {},
                {
                    // requestLink: (sub) => <b><a onClick={this._onImportE2eKeysClicked}>{ sub }</a></b>,
                    // requestLink2: (sub) => <a>toto</a>,
                    requestLink: (sub) => <a className="mx_UnknownBody_importKeys_link" onClick={this._onImportE2eKeysClicked}>{sub}</a>,
                },
            );
            // console.error(text_alt);
            // text = ReactDOMServer.renderToString(text);

        } else {
            text = event.body;
        }

        return (
            <span className="mx_UnknownBody" title={tooltip}>
                { text } {text2}
            </span>
        );
    },
});
