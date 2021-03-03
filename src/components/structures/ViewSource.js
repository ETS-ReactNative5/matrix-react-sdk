/*
Copyright 2015, 2016 OpenMarket Ltd
Copyright 2019 Michael Telatynski <7t3chguy@gmail.com>
Copyright 2019 The Matrix.org Foundation C.I.C.

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

import React from 'react';
import PropTypes from 'prop-types';
import SyntaxHighlight from '../views/elements/SyntaxHighlight';
import {_t} from "../../languageHandler";
import * as sdk from "../../index";


export default class ViewSource extends React.Component {
    static propTypes = {
        content: PropTypes.object.isRequired,
        onFinished: PropTypes.func.isRequired,
        roomId: PropTypes.string.isRequired,
        eventId: PropTypes.string.isRequired,
        isEncrypted: PropTypes.bool.isRequired,
        decryptedContent: PropTypes.object,
    };

    render() {
        const BaseDialog = sdk.getComponent('views.dialogs.BaseDialog');

        const DecryptedSection = <>
            <div className="mx_ViewSource_separator" />
            <div className="mx_ViewSource_heading">{_t("Decrypted event source")}</div>
            <SyntaxHighlight className="json">
                { JSON.stringify(this.props.decryptedContent, null, 2) }
            </SyntaxHighlight>
        </>;

        const OriginalSection = <>
            <div className="mx_ViewSource_separator" />
            <div className="mx_ViewSource_heading">{_t("Original event source")}</div>
            <SyntaxHighlight className="json">
                { JSON.stringify(this.props.content, null, 2) }
            </SyntaxHighlight>
        </>;

        return (
            <BaseDialog className="mx_ViewSource" onFinished={this.props.onFinished} title={_t('View Source')}>
                <div className="mx_Dialog_content">
                    <div className="mx_ViewSource_label_left">Room ID: { this.props.roomId }</div>
                    <div className="mx_ViewSource_label_left">Event ID: { this.props.eventId }</div>
                    { this.props.isEncrypted && DecryptedSection }
                    { OriginalSection }
                </div>
            </BaseDialog>
        );
    }
}
