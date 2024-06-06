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
	EntityType, EntityTypeMap,
	setOneLocalEdit
} from './slices/localEditsSlice';
import { meterEdits, selectLocalOrServerEntityById } from './slices/localEditsSliceV2';

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
export const useLocalEditHandlers = (action: EntityTypeMap) => {
	const dispatch = useAppDispatch();
	const { type, data } = action;
	const handleStringChange = React.useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			dispatch(
				setOneLocalEdit({ type, data: { ...data as any, [e.target.name]: e.target.value.trim() } })
			);
		}, [data]);

	const handleBooleanChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
		dispatch(
			setOneLocalEdit({ type, data: { ...data as any, [e.target.name]: JSON.parse(e.target.value) } })
		);
	}, [data]);

	const handleNumberChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
		dispatch(
			setOneLocalEdit({ type, data: { ...data as any, [e.target.name]: Number(e.target.value) } })
		);
	}, [data]);

	const handleTimeZoneChange = React.useCallback((timeZone: string) => {
		dispatch(
			setOneLocalEdit({ type, data: { ...data as any, timeZone } })
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

// Hook avoids updating redux state too often by primary utilzing react.useState, and debouncing updates to redux.
export const useLocalEditHook = <T extends EntityType>(type: T, id: number) => {
	const dispatch = useAppDispatch();
	const apiData = useAppSelector(state => selectLocalOrServerEntityById(state, { type, id }));
	const localEditData = useAppSelector(state => selectLocalOrServerEntityById(state, { type, id, local: true }));
	const [reactLevelState, setRLevelState] = React.useState(localEditData ? cloneDeep(localEditData) : cloneDeep(apiData));
	const updateLocalEditState = React.useCallback(debounce((action: EntityTypeMap) => {
		const differences = !isEqual(apiData, action.data);
		if (differences) {
			// changes in react state, update reduux to match
			action.type === EntityType.METER && dispatch(meterEdits.actions.setOne(action.data));
		} else if (!differences && localEditData) {
			// states match, and redux is already populated, so delete (states match so no edits)
			action.type === EntityType.METER && dispatch(meterEdits.actions.deleteOne(action.data.id));

		}
	}, 1000, { leading: false, trailing: true }), [apiData, localEditData]);
	React.useEffect(() => {
		updateLocalEditState({ type, data: reactLevelState as any });

	}, [reactLevelState]);
	return [reactLevelState, setRLevelState] as const;
};