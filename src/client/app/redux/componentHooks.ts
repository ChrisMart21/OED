/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { createIntl, createIntlCache, defineMessages } from 'react-intl';
import localeData, { LocaleDataKey } from '../translations/data';
import { useAppDispatch, useAppSelector } from './reduxHooks';
import { selectInitComplete, selectSelectedLanguage } from './slices/appStateSlice';
import { selectCurrentUserRole, selectIsAdmin } from './slices/currentUserSlice';
import { SetEditAction, setEdits } from './slices/localEditsSlice';

export const useWaitForInit = () => {
	const isAdmin = useAppSelector(selectIsAdmin);
	const userRole = useAppSelector(selectCurrentUserRole);
	const initComplete = useAppSelector(selectInitComplete);
	return { isAdmin, userRole, initComplete };
};

// Overloads to support TS key completions
type TranslateFunction = {
	(messageID: LocaleDataKey): string;
	(messageID: string): string;
}

// usage
// const translate = useTranslate()
// translate('myKey')
export const useTranslate = () => {
	const lang = useAppSelector(selectSelectedLanguage);
	const cache = createIntlCache();
	const messages = localeData[lang];
	const intl = createIntl({ locale: lang, messages }, cache);

	const translate: TranslateFunction = (messageID: LocaleDataKey | string) => {
		return intl.formatMessage(defineMessages({ [messageID]: { id: messageID } })[messageID]);
	};

	return translate;
};


// Form handlers intended for use with local Edits Slice.
export const useLocalEditHandlers = (action: SetEditAction) => {
	const dispatch = useAppDispatch();
	const { type, data } = action;
	const handleStringChange = React.useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			dispatch(
				setEdits({ type, data: { ...data as any, [e.target.name]: e.target.value.trim() } })
			);
		}, [data]);

	const handleBooleanChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
		dispatch(
			setEdits({ type, data: { ...data as any, [e.target.name]: JSON.parse(e.target.value) } })
		);
	}, [data]);

	const handleNumberChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
		dispatch(
			setEdits({ type, data: { ...data as any, [e.target.name]: Number(e.target.value) } })
		);
	}, [data]);

	const handleTimeZoneChange = React.useCallback((timeZone: string) => {
		dispatch(
			setEdits({ type, data: { ...data as any, timeZone } })
		);
	}, [data]);

	const handlers = React.useMemo(() => (
		{
			handleStringChange,
			handleBooleanChange,
			handleNumberChange,
			handleTimeZoneChange
		}
	), [handleNumberChange, handleBooleanChange, handleNumberChange, handleTimeZoneChange]);
	return handlers;
};
