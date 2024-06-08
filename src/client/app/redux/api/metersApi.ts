/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { EntityType, removeOneEdit } from '../../redux/slices/localEditsSlice';
import { TimeInterval } from '../../../../common/TimeInterval';
import { RootState } from '../../store';
import { NamedIDItem } from '../../types/items';
import { RawReadings } from '../../types/readings';
import { MeterData } from '../../types/redux/meters';
import { UnitRepresentType } from '../../types/redux/units';
import { durationFormat } from '../../utils/durationFormat';
import { MeterDataState, meterAdapter, metersInitialState } from '../entityAdapters';
import { baseApi } from './baseApi';
import { conversionsApi } from './conversionsApi';
import { selectUnitById } from './unitsApi';


const formatMeterInfo = (meter: MeterData) => ({
	...meter,
	readingFrequency: durationFormat(meter.readingFrequency)
});
const formatRepsonse = (data: MeterData[]) => data.map(formatMeterInfo);

export const metersApi = baseApi.injectEndpoints({
	endpoints: builder => ({
		getMeters: builder.query<MeterDataState, void>({
			query: () => 'api/meters',
			// Optional endpoint property that can transform incoming api responses if needed
			// Use EntityAdapters from RTK to normalizeData, and generate commonSelectors
			transformResponse: (response: MeterData[]) => meterAdapter.setAll(metersInitialState, formatRepsonse(response)),
			// Tags used for invalidation by mutation requests.
			providesTags: ['MeterData']
		}),
		editMeter: builder.mutation<MeterData, MeterData>({
			query: meterData => ({
				url: 'api/meters/edit',
				method: 'POST',
				body: { ...meterData }
			}),
			onQueryStarted: async (edits, { dispatch, queryFulfilled, getState }) => {
				// First, wait for the query to be fulfilled
				queryFulfilled.then(() => {
					// Then Calculate whether to refresh reading views
					const state = getState() as RootState;
					const current = selectMeterById(state, edits.id);
					const currentUnit = selectUnitById(state, current.unitId);
					const editedUnit = selectUnitById(state, edits.unitId);
					// The reading views need to be refreshed if going to/from no unit or
					// to/from type quantity.
					// The check does it by first seeing if the unit changed and, if so, it
					// sees if either were non unit meaning it crossed since both cannot be no unit
					// or the unit change to/from quantity.
					const shouldRefreshReadingViews = (current.unitId != edits.unitId) &&
						(
							(current.unitId == -99 || edits.unitId == -99)
							|| (currentUnit.unitRepresent == UnitRepresentType.quantity && editedUnit.unitRepresent != UnitRepresentType.quantity)
							|| (currentUnit.unitRepresent != UnitRepresentType.quantity && editedUnit.unitRepresent == UnitRepresentType.quantity)
						);

					// Update reading views if needed. Never redoCik so false.
					dispatch(conversionsApi.endpoints.refresh.initiate({ redoCik: false, refreshReadingViews: shouldRefreshReadingViews }));
					// up
					dispatch(metersApi.util.updateQueryData('getMeters', undefined,
						cacheDraft => {
							meterAdapter.upsertOne(cacheDraft, formatMeterInfo(edits));
						}));
					// Once Successfully edited, delete the edit from localEdits
					dispatch(removeOneEdit({ type: EntityType.METER, id: edits.id }));

				});
			}
			// TODO Verify! Data is locally updated no need to invalidate tags here?
			// , invalidatesTags: ['MeterData']
		}),
		addMeter: builder.mutation<MeterData, MeterData>({
			query: meter => ({
				url: 'api/meters/addMeter',
				method: 'POST',
				body: { ...meter }
			}),
			transformResponse: (data: MeterData) => ({ ...data, readingFrequency: durationFormat(data.readingFrequency) }),
			onQueryStarted: (_arg, { dispatch, queryFulfilled }) => {
				queryFulfilled.then(({ data }) => {
					dispatch(metersApi.util.updateQueryData('getMeters', undefined, cacheDraft => { meterAdapter.addOne(cacheDraft, data); }));
				});
			}
		}),
		lineReadingsCount: builder.query<number, { meterIDs: number[], timeInterval: TimeInterval }>({
			query: ({ meterIDs, timeInterval }) => `api/readings/line/count/meters/${meterIDs.join(',')}?timeInterval=${timeInterval.toString()}`
		}),
		details: builder.query<NamedIDItem[], void>({
			query: () => 'api/meters'
		}),
		rawLineReadings: builder.query<RawReadings[], { meterID: number, timeInterval: TimeInterval }>({
			query: ({ meterID, timeInterval }) => `api/readings/line/raw/meter/${meterID}?timeInterval=${timeInterval.toString()}`
		})
	})
});


export const selectMeterDataResult = metersApi.endpoints.getMeters.select();
export const selectMeterApiData = (state: RootState) => selectMeterDataResult(state).data ?? metersInitialState;
export const {
	selectAll: selectAllMeters,
	selectById: selectMeterById,
	selectTotal: selectMeterTotal,
	selectIds: selectMeterIds,
	selectEntities: selectMeterDataById
} = meterAdapter.getSelectors(selectMeterApiData);


/**
 * Selects the name of the meter associated with a given meter ID from the Redux state.
 * @param state - The current state of the Redux store.
 * @param meterID - The unique identifier for the meter.
 * @returns The name of the specified meter or an empty string if not found.
 * @example
 * const meterName = useAppSelector(state => selectMeterNameById(state, 42))
 */
export const selectMeterNameById = (state: RootState, meterID: number) => {
	const meterInfo = selectMeterById(state, meterID);
	return meterInfo ? meterInfo.name : '';
};

/**
 * Selects the identifier (not the meter ID) of the meter associated with a given meter ID from the Redux state.
 * @param state - The current state of the Redux store.
 * @param meterID - The unique identifier for the meter.
 * @returns The identifier for the specified meter or an empty string if not found.
 * @example
 * const meterIdentifier = useAppSelector(state => selectMeterIdentifierById(state, 42))
 */
export const selectMeterIdentifierById = (state: RootState, meterID: number) => {
	const meterInfo = selectMeterById(state, meterID);
	return meterInfo ? meterInfo.identifier : '';
};
