/*
Copyright 2017 Vector Creations Ltd

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
import { _t } from '../../../languageHandler';

import sdk from '../../../index';
import dis from '../../../dispatcher';

export default React.createClass({
    displayName: 'ExportE2eKeysSuccessDialog',

    propTypes: {
        onFinished: PropTypes.func.isRequired,
    },

    componentWillMount: function() {
        this._unmounted = false;
    },

    componentWillUnmount: function() {
        this._unmounted = true;
    },

    _onCancelClick: function(ev) {
        ev.preventDefault();
        this.props.onFinished(false);
        return false;
    },

    _onLogoutConfirm() {
        this.props.onFinished(true);
        dis.dispatch({action: 'logout'});
    },

    render: function() {
        const BaseDialog = sdk.getComponent('views.dialogs.BaseDialog');

        return (
            <BaseDialog className='mx_exportE2eKeysSuccessDialog'
                onFinished={this.props.onFinished}
                title={_t("Export room keys successful")}
            >
                <div className="mx_Dialog_content">
                    <p>{_t('Your Tchap Keys (encryption keys) have been saved successfully, you can log out')}</p>

                    <p>{_t('Your Tchap Keys are now in a file on your device, protected by your Chat Keys password. ' +
                    'Remember to save this file in a place where you can find it. You can rename it if you wish. ' +
                    'At your next connection, you can import your Tchap Keys using your password to unlock your messages, which will then become readable again. ' +
                    'Warning: Tchap secures your messages by renewing your Tchap Keys often, so remember to back up your keys regularly, or at least before logging out.')}
                    </p>
                    <p>{_t('If you have backed up your Tchap Keys correctly, you can now log out safely.')}</p>
                </div>
                <div className='mx_Dialog_buttons'>
                    <button onClick={this._onCancelClick}>
                        { _t("Cancel") }
                    </button>
                    <button className="mx_Dialog_primary" onClick={this._onLogoutConfirm}>
                        { _t("Sign out") }
                    </button>
                </div>
            </BaseDialog>
        );
    },
});
