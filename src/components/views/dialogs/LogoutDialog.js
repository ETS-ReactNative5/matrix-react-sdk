/*
Copyright 2018, 2019 New Vector Ltd

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
import Modal from '../../../Modal';
import sdk from '../../../index';
import dis from '../../../dispatcher';
import { _t } from '../../../languageHandler';
import MatrixClientPeg from '../../../MatrixClientPeg';
import SdkConfig from "../../../SdkConfig";

export default class LogoutDialog extends React.Component {
    defaultProps = {
        onFinished: function() {},
    }

    constructor() {
        super();
        this._onSettingsLinkClick = this._onSettingsLinkClick.bind(this);
        this._onExportE2eKeysClicked = this._onExportE2eKeysClicked.bind(this);
        this._onFinished = this._onFinished.bind(this);
        this._onSetRecoveryMethodClick = this._onSetRecoveryMethodClick.bind(this);
        this._onLogoutConfirm = this._onLogoutConfirm.bind(this);

        const shouldLoadBackupStatus = !MatrixClientPeg.get().getKeyBackupEnabled();

        this.state = {
            loading: shouldLoadBackupStatus,
            backupInfo: null,
            error: null,
        };

        if (shouldLoadBackupStatus) {
            this._loadBackupStatus();
        }
    }

    async _loadBackupStatus() {
        try {
            const backupInfo = await MatrixClientPeg.get().getKeyBackupVersion();
            this.setState({
                loading: false,
                backupInfo,
            });
        } catch (e) {
            console.log("Unable to fetch key backup status", e);
            this.setState({
                loading: false,
                error: e,
            });
        }
    }

    _onSettingsLinkClick() {
        // close dialog
        this.props.onFinished();
    }

    _onExportE2eKeysClicked() {
        Modal.createTrackedDialogAsync('Export E2E Keys', '',
            import('../../../async-components/views/dialogs/ExportE2eKeysDialog'),
            {
                matrixClient: MatrixClientPeg.get(),
                onFinished: this._onFinished,
            },
        );
    }

    _onFinished(confirmed) {
        // :TCHAP:
        if (window.localStorage) {
            window.localStorage.removeItem("tc_validate_encryption_informations");
        }
        if (confirmed) {
            dis.dispatch({action: 'logout'});
        }
        // close dialog
        this.props.onFinished();
    }

    _onSetRecoveryMethodClick() {
        if (this.state.backupInfo) {
            // A key backup exists for this account, but the creating device is not
            // verified, so restore the backup which will give us the keys from it and
            // allow us to trust it (ie. upload keys to it)
            const RestoreKeyBackupDialog = sdk.getComponent('dialogs.keybackup.RestoreKeyBackupDialog');
            Modal.createTrackedDialog('Restore Backup', '', RestoreKeyBackupDialog, {});
        } else {
            Modal.createTrackedDialogAsync("Key Backup", "Key Backup",
                import("../../../async-components/views/dialogs/keybackup/CreateKeyBackupDialog"),
            );
        }

        // close dialog
        this.props.onFinished();
    }

    _onLogoutConfirm() {
        dis.dispatch({action: 'logout'});

        // close dialog
        this.props.onFinished();
    }

    render() {
        // :TCHAP: don't know what happened here
/*        if (!MatrixClientPeg.get().getKeyBackupEnabled()) {
            const BaseDialog = sdk.getComponent('views.dialogs.BaseDialog');

            let dialogContent;
            if (this.state.loading) {
                const Spinner = sdk.getComponent('views.elements.Spinner');

                dialogContent = <Spinner />;
            } else {
                const DialogButtons = sdk.getComponent('views.elements.DialogButtons');
                let setupButtonCaption;
                if (this.state.backupInfo) {
                    setupButtonCaption = _t("Connect this device to Key Backup");
                } else {
                    // if there's an error fetching the backup info, we'll just assume there's
                    // no backup for the purpose of the button caption
                    setupButtonCaption = _t("Start using Key Backup");
                }

                dialogContent = <div>
                    <div className="mx_Dialog_content" id='mx_Dialog_content'>
                        { description }
                    </div>
                    <DialogButtons primaryButton={setupButtonCaption}
                        hasCancel={false}
                        onPrimaryButtonClick={this._onSetRecoveryMethodClick}
                        focus={true}
                    >
                        <button onClick={this._onLogoutConfirm}>
                            {_t("I don't want my encrypted messages")}
                        </button>
                    </DialogButtons>
                    <details>
                        <summary>{_t("Advanced")}</summary>
                        <p><button onClick={this._onExportE2eKeysClicked}>
                            {_t("Manually export keys")}
                        </button></p>
                    </details>
                </div>;
            }
            // Not quite a standard question dialog as the primary button cancels
            // the action and does something else instead, whilst non-default button
            // confirms the action.
            return (<BaseDialog
                title={_t("You'll lose access to your encrypted messages")}
                contentId='mx_Dialog_content'
                hasCancel={true}
                onFinished={this._onFinished}
            >
                {dialogContent}
            </BaseDialog>);
        } else {
            const QuestionDialog = sdk.getComponent('views.dialogs.QuestionDialog');
            return (<QuestionDialog
                hasCancelButton={true}
                title={_t("Sign out")}
                description={_t(
                    "Are you sure you want to sign out?",
                )}
                button={_t("Sign out")}
                onFinished={this._onFinished}
            />);
        }*/
        const BaseDialog = sdk.getComponent('views.dialogs.BaseDialog');

        let dialogContent;
        if (this.state.loading) {
            const Spinner = sdk.getComponent('views.elements.Spinner');

            dialogContent = <Spinner />;
        } else {
            dialogContent = <div>
                <div className="mx_Dialog_content" id='mx_Dialog_content'>
                    <div>
                        <p>{_t('<b>Without your Tchap Keys, you will not be able to read your messages</b> the next time you log in because they will be locked. This is a Tchap security measure.', {}, {
                            b: (sub) => <b>{sub}</b>,
                        })}</p>
                    </div>
                    <div className="tc_TwoColumn_block">
                        <div className="tc_TwoColumn_block_content">
                            <div className="tc_TwoColumn_block_image">
                                <img src={require('../../../../res/img/tchap/multi-device.svg')} alt="Login logo" width="120" />
                            </div>
                            <p>{_t("<b>Can you currently read your messages on another device?</b> You can disconnect. This other device automatically backs up your Tchat Keys and messages.", {}, {
                                b: (sub) => <b>{sub}</b>,
                            })}</p>
                            <button className="danger" onClick={this._onLogoutConfirm}>
                                {_t("Sign out")}
                            </button>
                        </div>
                        <div className="tc_TwoColumn_block_content">
                            <div className="tc_TwoColumn_block_image">
                                <img src={require('../../../../res/img/tchap/export-logo.svg')} alt="Export logo" width="70" />
                            </div>
                            <p>{_t("<b>You don't have another device connected to Tchap?</b> Back up your Tchap Keys. These keys will unlock current messages, but not those received after saving.", {}, {
                                b: (sub) => <b>{sub}</b>,
                            })}</p>
                            <button className="mx_Dialog_primary" onClick={this._onExportE2eKeysClicked}>
                                {_t("Save keys")}
                            </button>
                        </div>
                    </div>
                </div>
            </div>;
        }
        return (<BaseDialog
            title={_t("Before log-out")}
            contentId='mx_Dialog_content'
            hasCancel={true}
            onFinished={this._onFinished}
        >
            {dialogContent}
        </BaseDialog>);
    }
}
