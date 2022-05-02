/*
Copyright 2017 Vector Creations Ltd
Copyright 2022 DINUM

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
                    <div className="tc_exportE2eKeysSuccessDialog_img">
                        <img src={require('../../../../res/img/tchap/key-saved.svg')} alt="Export logo" width="70" />
                    </div>

                    <strong>{_t('Your Tchap Keys (encryption keys) have been saved successfully.')}</strong>
                    <p>{_t('You can import them the next time you log in to unlock your messages.')}</p>
                    <p>{_t("Messages received after this save cannot be unlocked. So you won't be able to read them.")}</p>
                </div>
                <div className='mx_Dialog_buttons'>
                    <button className="mx_Dialog_primary" onClick={this._onLogoutConfirm}>
                        { _t("Sign out") }
                    </button>
                </div>
            </BaseDialog>
        );
    },
});
