/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { cloneDeep, debounce, isEqual } from 'lodash';
import * as React from 'react';
import { createIntl, createIntlCache, defineMessages } from 'react-intl';
import localeData, { LocaleDataKey } from '../translations/data';
import { useAppDispatch, useAppSelector } from './reduxHooks';
import { selectInitComplete, selectSelectedLanguage } from './slices/appStateSlice';
import { selectCurrentUserRole, selectIsAdmin } from './slices/currentUserSlice';
import {
	EntityType,
	removeOneEdit,
	selectLocalOrServerEntityById,
	setOneEdit,
	SetOneEditAction
} from './slices/localEditsSlice';

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


// Reusable for admin pages to update local edit state
// Hook utilzies react.useState then updates redux in after a 1 second pause in updates.
// This helps keep the dispatch count low, especially when typing in input fields
export const useLocalEditHook = <T extends EntityType>(type: T, id: number, debounceTimer: number = 1000) => {
	const dispatch = useAppDispatch();
	const apiData = useAppSelector(state => selectLocalOrServerEntityById(state, { type, id }));
	const localEditData = useAppSelector(state => selectLocalOrServerEntityById(state, { type, id, local: true }));
	// On initial render use the localEdit if it exists, otherwise, use the apiData
	const [data, setData] = React.useState(cloneDeep(localEditData ?? apiData));
	// reset react-state
	const resetData = React.useCallback(() => {
		setData(cloneDeep(apiData));
	}, [apiData]);

	const updateLocalEditState = React.useCallback(debounce(
		(action: SetOneEditAction) => {
			const { type, data } = action;
			// reac
			const differences = !isEqual(apiData, data);
			if (differences) {
				// changes in react state, so update reduux to match
				dispatch(setOneEdit({ type, data }));
			} else if (!differences && localEditData) {
				// states are equivalent, however redux is  populated, so delete (states match so no edits)
				dispatch(removeOneEdit({ type, id: data.id }));

			}
		},
		// debounce timer in milliseconds. defaults to 1 second.
		debounceTimer
	), [apiData, localEditData]);

	React.useEffect(() => {
		// Call invoke the debounced redux dispatch call.
		updateLocalEditState({ type, data: data });
	}, [data]);


	const handleStringChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setData(data => ({ ...data, [e.target.name]: e.target.value }));
	};

	const handleBooleanChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setData(data => ({ ...data, [e.target.name]: JSON.parse(e.target.value) }));
	};

	const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setData(data => ({ ...data, [e.target.name]: Number(e.target.value) }));
	};

	const handleTimeZoneChange = (timeZone: string) => {
		setData(data => ({ ...data as any, timeZone }));
	};

	const handlers = {
		handleStringChange,
		handleBooleanChange,
		handleNumberChange,
		handleTimeZoneChange
	};
	return { handlers, data, setData, resetData };
};
