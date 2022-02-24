/*
Copyright 2015, 2016 OpenMarket Ltd
Copyright 2017 Vector Creations Ltd
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
import PropTypes from 'prop-types';
import sdk from '../../../index';
import Email from '../../../email';
import Modal from '../../../Modal';
import { _t } from '../../../languageHandler';
import Tchap from "../../../Tchap";
import SdkConfig from '../../../SdkConfig';
// :Tchap:
// import { SAFE_LOCALPART_REGEX } from '../../../Registration';
import withValidation from '../elements/Validation';

const FIELD_EMAIL = 'field_email';
const FIELD_PASSWORD = 'field_password';
const FIELD_PASSWORD_CONFIRM = 'field_password_confirm';

const PASSWORD_MIN_SCORE = 3; // safely unguessable: moderate protection from offline slow-hash scenario.

/**
 * A pure UI component which displays a registration form.
 */
// :TCHAP: Heavy changes
module.exports = React.createClass({
    displayName: 'RegistrationForm',

    propTypes: {
        // Values pre-filled in the input boxes when the component loads
        defaultEmail: PropTypes.string,
        defaultPassword: PropTypes.string,
        minPasswordLength: PropTypes.number,
        onValidationChange: PropTypes.func,
        onRegisterClick: PropTypes.func.isRequired, // onRegisterClick(Object) => ?Promise
        onEditServerDetailsClick: PropTypes.func,
        flows: PropTypes.arrayOf(PropTypes.object).isRequired,
        // This is optional and only set if we used a server name to determine
        // the HS URL via `.well-known` discovery. The server name is used
        // instead of the HS URL when talking about "your account".
        hsName: PropTypes.string,
        hsUrl: PropTypes.string,
        isExtern: PropTypes.bool,
    },

    getDefaultProps: function() {
        return {
            minPasswordLength: 6,
            onValidationChange: console.error,
        };
    },

    getInitialState: function() {
        return {
            // Field error codes by field ID
            fieldErrors: {},
            email: "",
            password: "",
            passwordConfirm: "",
            isExtern: false,
            passwordComplexity: null,
            passwordSafe: false,
        };
    },

    // :Tchap: custom validation
    onSubmit: async function(ev) {
        ev.preventDefault();

        // validate everything, in reverse order so
        // the error that ends up being displayed
        // is the one from the first invalid field.
        // It's not super ideal that this just calls
        // onValidationChange once for each invalid field.
        this.validateField(FIELD_EMAIL, ev.type);
        this.validateField(FIELD_PASSWORD_CONFIRM, ev.type);
        this.validateField(FIELD_PASSWORD, ev.type);

        const self = this;
        if (this.allFieldsValid()) {
            if (this.state.email == '') {
                const QuestionDialog = sdk.getComponent("dialogs.QuestionDialog");
                Modal.createTrackedDialog('If you don\'t specify an email address...', '', QuestionDialog, {
                    title: _t("Warning!"),
                    description:
                        <div>
                            { _t("If you don't specify an email address, you won't be able to reset your password. " +
                                "Are you sure?") }
                        </div>,
                    button: _t("Continue"),
                    onFinished: function(confirmed) {
                        if (confirmed) {
                            self._doSubmit(ev);
                        }
                    },
                });
            } else {
                self._doSubmit(ev);
            }
        }
    },

    _doSubmit: function(ev) {
        let email = this.state.email.trim();
        email = email.toLowerCase();
        const promise = this.props.onRegisterClick({
            password: this.state.password.trim(),
            email: email,
        });

        if (promise) {
            ev.target.disabled = true;
            promise.finally(function() {
                ev.target.disabled = false;
            });
        }
    },

    async verifyFieldsBeforeSubmit() {
        // Blur the active element if any, so we first run its blur validation,
        // which is less strict than the pass we're about to do below for all fields.
        const activeElement = document.activeElement;
        if (activeElement) {
            activeElement.blur();
        }

        const fieldIDsInDisplayOrder = [
            FIELD_EMAIL,
            FIELD_PASSWORD,
            FIELD_PASSWORD_CONFIRM,
        ];

        // Run all fields with stricter validation that no longer allows empty
        // values for required fields.
        for (const fieldID of fieldIDsInDisplayOrder) {
            const field = this[fieldID];
            if (!field) {
                continue;
            }
            // We must wait for these validations to finish before queueing
            // up the setState below so our setState goes in the queue after
            // all the setStates from these validate calls (that's how we
            // know they've finished).
            await field.validate({ allowEmpty: false });
        }

        // Validation and state updates are async, so we need to wait for them to complete
        // first. Queue a `setState` callback and wait for it to resolve.
        await new Promise(resolve => this.setState({}, resolve));

        if (this.allFieldsValid()) {
            return true;
        }

        const invalidField = this.findFirstInvalidField(fieldIDsInDisplayOrder);

        if (!invalidField) {
            return true;
        }

        // Focus the first invalid field and show feedback in the stricter mode
        // that no longer allows empty values for required fields.
        invalidField.focus();
        invalidField.validate({ allowEmpty: false, focused: true });
        return false;
    },

    /**
     * @returns {boolean} true if all fields were valid last time they were validated.
     */
    allFieldsValid: function() {
        const keys = Object.keys(this.state.fieldErrors);
        for (let i = 0; i < keys.length; ++i) {
            if (this.state.fieldErrors[keys[i]]) {
                return false;
            }
        }
        return true;
    },

    // :TCHAP: validation is reworked in latest code, not sure if we can blindly change this
    validateField: function(fieldID, eventType) {
        const pwd1 = this.state.password.trim();
        const pwd2 = this.state.passwordConfirm.trim();
        const allowEmpty = eventType === "blur";

        switch (fieldID) {
            case FIELD_EMAIL: {
                const email = this.state.email;
                const emailValid = email === '' || Email.looksValid(email);
                if (email === '') {
                    this.markFieldValid(fieldID, false, "RegistrationForm.ERR_MISSING_EMAIL");
                } else if (!emailValid) {
                    this.markFieldValid(fieldID, emailValid, "RegistrationForm.ERR_EMAIL_INVALID");
                } else {
                    this.markFieldValid(fieldID, true);
                }
                break;
            }
            case FIELD_PASSWORD:
                if (allowEmpty && pwd1 === "") {
                    this.markFieldValid(fieldID, true);
                } else if (pwd1 == '') {
                    this.markFieldValid(
                        fieldID,
                        false,
                        "RegistrationForm.ERR_PASSWORD_MISSING",
                    );
                } else if (pwd1.length < this.props.minPasswordLength) {
                    this.markFieldValid(
                        fieldID,
                        false,
                        "RegistrationForm.ERR_PASSWORD_LENGTH",
                    );
                } else {
                    this.markFieldValid(fieldID, true);
                }
                break;
            case FIELD_PASSWORD_CONFIRM:
                if (allowEmpty && pwd2 === "") {
                    this.markFieldValid(fieldID, true);
                } else {
                    this.markFieldValid(
                        fieldID, pwd1 == pwd2,
                        "RegistrationForm.ERR_PASSWORD_MISMATCH",
                    );
                }
                break;
        }
        return null;
    },

    markFieldValid: function(fieldID, valid, errorCode) {
        const { fieldErrors } = this.state;
        if (valid) {
            fieldErrors[fieldID] = null;
        } else {
            fieldErrors[fieldID] = errorCode;
        }
        this.setState({
            fieldErrors,
        });
        this.props.onValidationChange(fieldErrors);
    },

    _classForField: function(fieldID, ...baseClasses) {
        let cls = baseClasses.join(' ');
        if (this.state.fieldErrors[fieldID]) {
            if (cls) cls += ' ';
            cls += 'error';
        }
        return cls;
    },

    onEmailBlur(ev) {
        this.setState({
            isExtern: false,
        });
        this.validateField(FIELD_EMAIL, ev.type);
        if (Email.looksValid(ev.target.value)) {
            Tchap.discoverPlatform(ev.target.value).then(e => {
                if (Tchap.isUserExternFromServer(e)) {
                    this.setState({
                        isExtern: true,
                    });
                }
            });
        }
    },

    onEmailChange(ev) {
        this.setState({
            email: ev.target.value,
        });
    },

    async onEmailValidate(fieldState) {
        const result = await this.validateEmailRules(fieldState);
        this.markFieldValid(FIELD_EMAIL, result.valid);
        return result;
    },

    validateEmailRules: withValidation({
        description: () => _t("Use an email address to recover your account"),
        rules: [
            {
                key: "required",
                test: function({ value, allowEmpty }) {
                    return allowEmpty || !this._authStepIsRequired('m.login.email.identity') || !!value;
                },
                invalid: () => _t("Enter email address (required on this homeserver)"),
            },
            {
                key: "email",
                test: ({ value }) => !value || Email.looksValid(value),
                invalid: () => _t("Doesn't look like a valid email address"),
            },
        ],
    }),

    onPasswordChange(ev) {
        this.setState({
            password: ev.target.value,
        });
    },

    onPasswordBlur(ev) {
        this.validateField(FIELD_PASSWORD, ev.type);
    },

    async onPasswordValidate(fieldState) {
        const result = await this.validatePasswordRules(fieldState);
        this.markFieldValid(FIELD_PASSWORD, result.valid);
        return result;
    },

    validatePasswordRules: withValidation({
        description: function() {
            const complexity = this.state.passwordComplexity;
            const score = complexity ? complexity.score : 0;
            return <progress
                className="mx_AuthBody_passwordScore"
                max={PASSWORD_MIN_SCORE}
                value={score}
            />;
        },
        rules: [
            {
                key: "required",
                test: ({ value, allowEmpty }) => allowEmpty || !!value,
                invalid: () => _t("Enter password"),
            },
            {
                key: "complexity",
                test: async function({ value }) {
                    if (!value) {
                        return false;
                    }
                    const { scorePassword } = await import('../../../utils/PasswordScorer');
                    const complexity = scorePassword(value);
                    const safe = complexity.score >= PASSWORD_MIN_SCORE;
                    const allowUnsafe = SdkConfig.get()["dangerously_allow_unsafe_and_insecure_passwords"];
                    this.setState({
                        passwordComplexity: complexity,
                        passwordSafe: safe,
                    });
                    return allowUnsafe || safe;
                },
                valid: function() {
                    // Unsafe passwords that are valid are only possible through a
                    // configuration flag. We'll print some helper text to signal
                    // to the user that their password is allowed, but unsafe.
                    if (!this.state.passwordSafe) {
                        return _t("Password is allowed, but unsafe");
                    }
                    return _t("Nice, strong password!");
                },
                invalid: function() {
                    const complexity = this.state.passwordComplexity;
                    if (!complexity) {
                        return null;
                    }
                    const { feedback } = complexity;
                    return feedback.warning || feedback.suggestions[0] || _t("Keep going...");
                },
            },
        ],
    }),

    onPasswordConfirmBlur(ev) {
        this.validateField(FIELD_PASSWORD_CONFIRM, ev.type);
    },

    onPasswordConfirmChange(ev) {
        this.setState({
            passwordConfirm: ev.target.value,
        });
    },

    render: function() {
        const Field = sdk.getComponent('elements.Field');
        const registerButton = (
            <input className="mx_Login_submit" type="submit" value={_t("Register")} />
        );

        let warnExternMessage;
        if (this.state.isExtern === true) {
            warnExternMessage = (<div className="mx_AuthBody_fieldRow">{
                _t("Information: The domain of your email address is not " +
                    "declared in Tchap. If you have received an invitation, " +
                    "you will be able to create a \"guest\" account, allowing " +
                    "only to participate in private exchanges to which you are invited.")
            }</div>);
        }

        return (
            <div>
                <form onSubmit={this.onSubmit}>
                    <div className="mx_AuthBody_fieldRow">
                        <Field
                            className={this._classForField(FIELD_EMAIL)}
                            id="mx_RegistrationForm_email"
                            type="text"
                            label={_t("Email")}
                            defaultValue={this.props.defaultEmail}
                            value={this.state.email}
                            onBlur={this.onEmailBlur}
                            onChange={this.onEmailChange}
                        />
                    </div>
                    { warnExternMessage }
                    <div className="mx_AuthBody_fieldRow">
                        <Field
                            className={this._classForField(FIELD_PASSWORD)}
                            id="mx_RegistrationForm_password"
                            type="password"
                            label={_t("Password")}
                            defaultValue={this.props.defaultPassword}
                            value={this.state.password}
                            onBlur={this.onPasswordBlur}
                            onChange={this.onPasswordChange}
                        />
                        <Field
                            className={this._classForField(FIELD_PASSWORD_CONFIRM)}
                            id="mx_RegistrationForm_passwordConfirm"
                            type="password"
                            label={_t("Confirm")}
                            defaultValue={this.props.defaultPassword}
                            value={this.state.passwordConfirm}
                            onBlur={this.onPasswordConfirmBlur}
                            onChange={this.onPasswordConfirmChange}
                        />
                        <img className="tc_PasswordHelper" src={require('../../../../res/img/question_mark.svg')}
                             width={25} height={25}
                             title={ _t("Your password must include a lower-case letter, an upper-case letter, a number and a symbol and be at a minimum 8 characters in length.") } alt={""} />
                    </div>
                    { registerButton }
                </form>
            </div>
        );
    },
});
