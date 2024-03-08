/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import * as moment from 'moment';
import { selectOEDVersion } from '../api/versionApi';
import { createAppSelector } from '../selectors/selectors';
import { PreferenceRequestItem } from '../../types/items';
import { AdminState } from '../../types/redux/admin';
import { ChartTypes } from '../../types/redux/graph';
import { LanguageTypes } from '../../types/redux/i18n';
import { durationFormat } from '../../utils/durationFormat';
import { AreaUnitType } from '../../utils/getAreaUnitConversion';
import { preferencesApi } from '../api/preferencesApi';

export const defaultAdminPreferences: AdminState = {
	displayTitle: '',
	defaultChartToRender: ChartTypes.line,
	defaultBarStacking: false,
	defaultTimezone: '',
	defaultLanguage: LanguageTypes.en,
	defaultWarningFileSize: 5,
	defaultFileSizeLimit: 25,
	isUpdatingCikAndDBViews: false,
	defaultAreaNormalization: false,
	defaultAreaUnit: AreaUnitType.none,
	defaultMeterReadingFrequency: '00:15:00',
	defaultMeterMinimumValue: Number.MIN_SAFE_INTEGER,
	defaultMeterMaximumValue: Number.MAX_SAFE_INTEGER,
	defaultMeterMinimumDate: moment(0).utc().format('YYYY-MM-DD HH:mm:ssZ'),
	defaultMeterMaximumDate: moment(0).utc().add(5000, 'years').format('YYYY-MM-DD HH:mm:ssZ'),
	defaultMeterReadingGap: 0,
	defaultMeterMaximumErrors: 75,
	defaultMeterDisableChecks: false,
	defaultHelpUrl: ''
};

export const adminPreference = createSlice({
	name: 'adminPreference',
	initialState: defaultAdminPreferences,
	reducers: {
		updateDisplayTitle: (state, action: PayloadAction<string>) => {
			state.displayTitle = action.payload;
		},
		updateDefaultChartToRender: (state, action: PayloadAction<ChartTypes>) => {
			state.defaultChartToRender = action.payload;
		},
		toggleDefaultBarStacking: state => {
			state.defaultBarStacking = !state.defaultBarStacking;
		},
		toggleDefaultAreaNormalization: state => {
			state.defaultAreaNormalization = !state.defaultAreaNormalization;
		},
		updateDefaultAreaUnit: (state, action: PayloadAction<AreaUnitType>) => {
			state.defaultAreaUnit = action.payload;
		},
		updateDefaultTimezone: (state, action: PayloadAction<string>) => {
			state.defaultTimezone = action.payload;
		},
		updateDefaultLanguage: (state, action: PayloadAction<LanguageTypes>) => {
			state.defaultLanguage = action.payload;
		},
		receivePreferences: (state, action: PayloadAction<PreferenceRequestItem>) => {
			state = {
				...state,
				...action.payload,
				defaultMeterReadingFrequency: durationFormat(action.payload.defaultMeterReadingFrequency)
			};
		},
		updateDefaultWarningFileSize: (state, action: PayloadAction<number>) => {
			state.defaultWarningFileSize = action.payload;
		},
		updateDefaultFileSizeLimit: (state, action: PayloadAction<number>) => {
			state.defaultFileSizeLimit = action.payload;
		},
		toggleWaitForCikAndDB: state => {
			state.isUpdatingCikAndDBViews = !state.isUpdatingCikAndDBViews;
		},
		updateDefaultMeterReadingFrequency: (state, action: PayloadAction<string>) => {
			state.defaultMeterReadingFrequency = action.payload;
		},
		updateDefaultMeterMinimumValue: (state, action: PayloadAction<number>) => {
			state.defaultMeterMinimumValue = action.payload;
		},
		updateDefaultMeterMaximumValue: (state, action: PayloadAction<number>) => {
			state.defaultMeterMaximumValue = action.payload;
		},
		updateDefaultMeterMinimumDate: (state, action: PayloadAction<string>) => {
			state.defaultMeterMinimumDate = action.payload;
		},
		updateDefaultMeterMaximumDate: (state, action: PayloadAction<string>) => {
			state.defaultMeterMaximumDate = action.payload;
		},
		updateDefaultMeterReadingGap: (state, action: PayloadAction<number>) => {
			state.defaultMeterReadingGap = action.payload;
		},
		updateDefaultMeterMaximumErrors: (state, action: PayloadAction<number>) => {
			state.defaultMeterMaximumErrors = action.payload;
		},
		updateDefaultMeterDisableChecks: (state, action: PayloadAction<boolean>) => {
			state.defaultMeterDisableChecks = action.payload;
		},
		updateDefaultHelpUrl: (state, action: PayloadAction<string>) => {
			state.defaultHelpUrl = action.payload;
		}
	},
	extraReducers: builder => {
		builder.addMatcher(
			preferencesApi.endpoints.getPreferences.matchFulfilled,
			(state, action) => {
				adminPreference.caseReducers.receivePreferences(
					state,
					adminPreference.actions.receivePreferences(action.payload)
				);
			}
		);
	},
	selectors: {
		selectAdminState: state => state,
		selectDisplayTitle: state => state.displayTitle,
		selectBaseHelpUrl: state => state.defaultHelpUrl
	}
});

export const {
	updateDisplayTitle,
	updateDefaultChartToRender,
	updateDefaultLanguage,
	updateDefaultTimezone,
	updateDefaultWarningFileSize,
	updateDefaultFileSizeLimit,
	updateDefaultAreaUnit,
	updateDefaultMeterReadingFrequency,
	updateDefaultMeterMinimumValue,
	updateDefaultMeterMaximumValue,
	updateDefaultMeterMinimumDate,
	updateDefaultMeterMaximumDate,
	updateDefaultMeterReadingGap,
	updateDefaultMeterMaximumErrors,
	updateDefaultMeterDisableChecks
} = adminPreference.actions;

export const {
	selectAdminState,
	selectDisplayTitle,
	selectBaseHelpUrl
} = adminPreference.selectors;


export const selectAdminPreferences = createAppSelector(
	[selectAdminState],
	(adminState): PreferenceRequestItem => ({
		displayTitle: adminState.displayTitle,
		defaultChartToRender: adminState.defaultChartToRender,
		defaultBarStacking: adminState.defaultBarStacking,
		defaultLanguage: adminState.defaultLanguage,
		defaultTimezone: adminState.defaultTimezone,
		defaultWarningFileSize: adminState.defaultWarningFileSize,
		defaultFileSizeLimit: adminState.defaultFileSizeLimit,
		defaultAreaNormalization: adminState.defaultAreaNormalization,
		defaultAreaUnit: adminState.defaultAreaUnit,
		defaultMeterReadingFrequency: adminState.defaultMeterReadingFrequency,
		defaultMeterMinimumValue: adminState.defaultMeterMinimumValue,
		defaultMeterMaximumValue: adminState.defaultMeterMaximumValue,
		defaultMeterMinimumDate: adminState.defaultMeterMinimumDate,
		defaultMeterMaximumDate: adminState.defaultMeterMaximumDate,
		defaultMeterReadingGap: adminState.defaultMeterReadingGap,
		defaultMeterMaximumErrors: adminState.defaultMeterMaximumErrors,
		defaultMeterDisableChecks: adminState.defaultMeterDisableChecks,
		defaultHelpUrl: adminState.defaultHelpUrl
	})
);

export const selectHelpUrl = createAppSelector(
	[selectBaseHelpUrl, selectOEDVersion],
	(baseUrl, version) => baseUrl + version
);