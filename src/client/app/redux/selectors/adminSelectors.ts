/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as _ from 'lodash'
import { selectConversionsDetails } from '../../redux/api/conversionsApi'
import { selectAllGroups } from '../../redux/api/groupsApi'
import { selectAllMeters, selectMeterById } from '../../redux/api/metersApi'
import { PreferenceRequestItem } from '../../types/items'
import { ConversionData } from '../../types/redux/conversions'
import { MeterData, MeterTimeSortType } from '../../types/redux/meters'
import { UnitData, UnitType } from '../../types/redux/units'
import { unitsCompatibleWithUnit } from '../../utils/determineCompatibleUnits'
import { AreaUnitType } from '../../utils/getAreaUnitConversion'
import { noUnitTranslated, potentialGraphicUnits } from '../../utils/input'
import translate from '../../utils/translate'
import { selectAllUnits, selectUnitDataById } from '../api/unitsApi'
import { selectAdminState } from '../slices/adminSlice'
import { selectVisibleMetersAndGroups } from './authVisibilitySelectors'
import { createAppSelector } from './selectors'

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

export const selectPossibleGraphicUnits = createAppSelector(
	selectUnitDataById,
	unitDataById => potentialGraphicUnits(unitDataById)
);

/**
 * Calculates the set of all possible meter units for a meter.
 * This is any unit that is of type meter.
 * @returns The set of all possible graphic units for a meter
 */
export const selectPossibleMeterUnits = createAppSelector(
	selectAllUnits,
	unitData => {
		let possibleMeterUnits = new Set<UnitData>();
		// The meter unit can be any unit of type meter.
		unitData.forEach(unit => {
			if (unit.typeOfUnit == UnitType.meter) {
				possibleMeterUnits.add(unit);
			}
		});
		// Put in alphabetical order.
		possibleMeterUnits = new Set(_.sortBy(Array.from(possibleMeterUnits), unit => unit.identifier.toLowerCase(), 'asc'));
		// The default graphic unit can also be no unit/-99 but that is not desired so put last in list.
		return possibleMeterUnits.add(noUnitTranslated());
	}
);

export const selectUnitName = createAppSelector(
	// This is the unit associated with the meter.
	// The first test of length is because the state may not yet be set when loading. This should not be seen
	// since the state should be set and the page redrawn so just use 'no unit'.
	// The second test of -99 is for meters without units.
	// This Selector takes an argument, due to one or more of the selectors accepts an argument (selectUnitWithID selectMeterDataWithID)
	selectUnitDataById,
	selectMeterById,
	(unitDataById, meterData) => {
		const unitName = (Object.keys(unitDataById).length === 0 || !meterData || meterData.unitId === -99) ?
			noUnitTranslated().identifier : unitDataById[meterData.defaultGraphicUnit]?.identifier;
		return unitName;
	}
);

export const selectGraphicName = createAppSelector(
	// This is the default graphic unit associated with the meter. See above for how code works.
	// notice that this selector is written with inline selectors for demonstration purposes
	selectUnitDataById,
	selectMeterById,
	(unitDataById, meterData) => {
		const graphicName = (Object.keys(unitDataById).length === 0 || !meterData || meterData.defaultGraphicUnit === -99) ?
			noUnitTranslated().identifier : unitDataById[meterData.defaultGraphicUnit].identifier;
		return graphicName;
	}
);

export const selectGraphicUnitCompatibility = createAppSelector(
	[
		selectPossibleGraphicUnits,
		selectPossibleMeterUnits,
		(_state, meterDetails: MeterData) => meterDetails.unitId,
		(_state, meterDetails: MeterData) => meterDetails.defaultGraphicUnit
	],
	(possibleGraphicUnits, possibleMeterUnits, unitId, defaultGraphicUnit) => {
		// Graphic units compatible with currently selected unit
		const compatibleGraphicUnits = new Set<UnitData>();
		// Graphic units incompatible with currently selected unit
		const incompatibleGraphicUnits = new Set<UnitData>();
		// If unit is not 'no unit'
		if (unitId != -99) {
			// Find all units compatible with the selected unit
			const unitsCompatibleWithSelectedUnit = unitsCompatibleWithUnit(unitId);
			possibleGraphicUnits.forEach(unit => {
				// If current graphic unit exists in the set of compatible graphic units OR if the current graphic unit is 'no unit'
				if (unitsCompatibleWithSelectedUnit.has(unit.id) || unit.id === -99) {
					compatibleGraphicUnits.add(unit);
				} else {
					incompatibleGraphicUnits.add(unit);
				}
			});
		} else {
			// No unit is selected
			// OED does not allow a default graphic unit if there is no unit so it must be -99.
			defaultGraphicUnit = -99;
			possibleGraphicUnits.forEach(unit => {
				// Only -99 is allowed.
				if (unit.id === -99) {
					compatibleGraphicUnits.add(unit);
				} else {
					incompatibleGraphicUnits.add(unit);
				}
			});
		}

		// Units compatible with currently selected graphic unit
		let compatibleUnits = new Set<UnitData>();
		// Units incompatible with currently selected graphic unit
		const incompatibleUnits = new Set<UnitData>();
		// If a default graphic unit is not 'no unit'
		if (defaultGraphicUnit !== -99) {
			// Find all units compatible with the selected graphic unit
			possibleMeterUnits.forEach(unit => {
				// Graphic units compatible with the current meter unit
				const compatibleGraphicUnits = unitsCompatibleWithUnit(unit.id);
				// If the currently selected default graphic unit exists in the set of graphic units compatible with the current meter unit
				// Also add the 'no unit' unit
				if (compatibleGraphicUnits.has(defaultGraphicUnit) || unit.id === -99) {
					// add the current meter unit to the list of compatible units
					compatibleUnits.add(unit.id === -99 ? noUnitTranslated() : unit);
				} else {
					// add the current meter unit to the list of incompatible units
					incompatibleUnits.add(unit);
				}
			});
		} else {
			// No default graphic unit is selected
			// All units are compatible
			compatibleUnits = new Set(possibleMeterUnits);
		}
		// return compatibility for current selected unit(s)
		return { compatibleGraphicUnits, incompatibleGraphicUnits, compatibleUnits, incompatibleUnits };
	}
);


export const selectIsValidConversion = createAppSelector(
	[
		selectUnitDataById,
		selectConversionsDetails,
		(_state, conversionDetails: ConversionData) => conversionDetails.sourceId,
		(_state, conversionDetails: ConversionData) => conversionDetails.destinationId,
		(_state, conversionDetails: ConversionData) => conversionDetails.bidirectional
	],
	(unitDataById, conversions, sourceId, destinationId, bidirectional): [boolean, string] => {
		/* Create Conversion Validation:
					Source equals destination: invalid conversion
					Conversion exists: invalid conversion
					Conversion does not exist:
						Inverse exists:
							Conversion is bidirectional: invalid conversion
					Destination cannot be a meter
					Cannot mix unit represent
					TODO Some of these can go away when we make the menus dynamic.
				*/

		// The destination cannot be a meter unit.
		if (destinationId !== -999 && unitDataById[destinationId].typeOfUnit === UnitType.meter) {
			return [false, translate('conversion.create.destination.meter')];
		}

		// Source or destination not set
		if (sourceId == -999 || destinationId == -999) {
			return [false, translate('conversion.create.source.destination.not')];
		}

		// Conversion already exists
		if ((conversions.findIndex(conversion => ((
			conversion.sourceId === sourceId) &&
			conversion.destinationId === destinationId))) !== -1) {
			return [false, translate('conversion.create.exists')];
		}

		// You cannot have a conversion between units that differ in unit_represent.
		// This means you cannot mix quantity, flow & raw.
		if (unitDataById[sourceId].unitRepresent !== unitDataById[destinationId].unitRepresent) {
			return [false, translate('conversion.create.mixed.represent')];
		}

		// If there is a non bidirectional inverse, then it is a valid conversion
		for (const conversion of Object.values(conversions)) {
			// Loop over conversions and check for existence of inverse of conversion passed in
			const inverseExists = (conversion.sourceId === destinationId) && (conversion.destinationId === sourceId);
			const isBidirectional = conversion.bidirectional || bidirectional;

			// If there exists an inverse that is bidirectional, then there is no point in making a conversion since it is essentially a duplicate.
			if (inverseExists && isBidirectional) {
				return [false, translate('conversion.create.exists.inverse')];
			}
		}
		// The return message is never shown to admin/used so not translated.
		return [true, 'Conversion is Valid'];
	}
);

export const selectVisibleMeterAndGroupData = createAppSelector(
	[
		selectVisibleMetersAndGroups,
		selectAllMeters,
		selectAllGroups
	],
	(visible, meterData, groupData) => {
		const visibleMeters = meterData.filter(meterData => visible.meters.has(meterData.id));
		const visibleGroups = groupData.filter(groupData => visible.groups.has(groupData.id));
		return { visibleMeters, visibleGroups };
	}
);

export const selectDefaultCreateMeterValues = createAppSelector(
	[selectAdminPreferences],
	adminPreferences => {
		const defaultValues = {
			id: -99,
			identifier: '',
			name: '',
			area: 0,
			enabled: false,
			displayable: false,
			meterType: '',
			url: '',
			timeZone: '',
			// String type conflicts with MeterDataType GPSPoint
			gps: '',
			// Defaults of -999 (not to be confused with -99 which is no unit)
			// Purely for allowing the default select to be "select a ..."
			unitId: -99,
			defaultGraphicUnit: -99,
			note: '',
			cumulative: false,
			cumulativeReset: false,
			cumulativeResetStart: '',
			cumulativeResetEnd: '',
			endOnlyTime: false,
			readingGap: adminPreferences.defaultMeterReadingGap,
			readingVariation: 0,
			readingDuplication: 1,
			timeSort: MeterTimeSortType.increasing,
			reading: 0.0,
			startTimestamp: '',
			endTimestamp: '',
			previousEnd: '',
			areaUnit: AreaUnitType.none,
			readingFrequency: adminPreferences.defaultMeterReadingFrequency,
			minVal: adminPreferences.defaultMeterMinimumValue,
			maxVal: adminPreferences.defaultMeterMaximumValue,
			minDate: adminPreferences.defaultMeterMinimumDate,
			maxDate: adminPreferences.defaultMeterMaximumDate,
			maxError: adminPreferences.defaultMeterMaximumErrors,
			disableChecks: adminPreferences.defaultMeterDisableChecks
		};
		return defaultValues;
	}
);

export const selectDefaultCreateConversionValues = createAppSelector(
	[selectAllUnits],
	sortedUnitData => {
		const defaultValues = {
			// Invalid source/destination ids arbitrarily set to -999.
			// Meter Units are not allowed to be a destination.
			sourceId: -999,
			sourceOptions: sortedUnitData,
			destinationId: -999,
			destinationOptions: sortedUnitData.filter(unit => unit.typeOfUnit !== 'meter'),
			bidirectional: true,
			slope: 0,
			intercept: 0,
			note: ''
		};
		return defaultValues;
	}
);