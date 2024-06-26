import { pick } from 'lodash';
import * as moment from 'moment';
import { EntityType, localEditsSlice } from '../../redux/slices/localEditsSlice';
import { RootState } from '../../store';
import { MapData, MapMetadata } from '../../types/redux/map';
import { showErrorNotification, showSuccessNotification } from '../../utils/notifications';
import translate from '../../utils/translate';
import { MapDataState, mapsAdapter, mapsInitialState } from '../entityAdapters';
import { baseApi } from './baseApi';
// import { logToServer } from '../../redux/actions/logs';

// Helper function to extract image dimensions from the mapSource
const mapResponseImgSrcToDimensions = (response: MapMetadata[]) => Promise.all(
	response.map(mapData =>
		new Promise<MapMetadata>(
			(resolve, reject) => {
				const img = new Image();
				img.onload = () => {
					resolve({ ...mapData, imgWidth: img.width, imgHeight: img.height });
				};
				img.onerror = error => {
					reject(error);
				};
				img.src = mapData.mapSource;
			})
	)
);


export const mapsApi = baseApi.injectEndpoints({
	endpoints: build => ({
		getMapDetails: build.query<MapDataState, void>({
			query: () => 'api/maps/',
			transformResponse: async (response: MapMetadata[]) => {
				// To avoid saving unserializable image(s) in state, extract the image dimensions andn nly store the mapSource (string)
				return mapsAdapter.setAll(mapsInitialState, await mapResponseImgSrcToDimensions(response));
			},
			providesTags: ['MapsData']
		}),
		getMapByName: build.query<MapData, string>({
			query: name => ({
				url: 'api/maps/getByName',
				params: { name }
			})
		}),
		createMap: build.mutation<void, MapMetadata>({
			query: map => ({
				url: 'api/maps/create',
				method: 'POST',
				body: {
					//  send only what backend expects.
					...pick(map, ['name', 'note', 'filename', 'mapSource', 'northAngle', 'circleSize']),
					modifiedDate: moment().toISOString(),
					origin: (map.calibrationResult) ? map.calibrationResult.origin : undefined,
					opposite: (map.calibrationResult) ? map.calibrationResult.opposite : undefined
				}
			}),
			onQueryStarted: (map, api) => {
				api.queryFulfilled
					// TODO Serverlogs migrate to rtk Query to drop axios?
					// Requires dispatch so inconvenient
					.then(() => {
						if (map.calibrationResult) {
							// logToServer('info', 'New calibrated map uploaded to database');
							showSuccessNotification(translate('upload.new.map.with.calibration'));
						} else {
							// logToServer('info', 'New map uploaded to database(without calibration)');
							showSuccessNotification(translate('upload.new.map.without.calibration'));
						}
						api.dispatch(localEditsSlice.actions.removeOneEdit({ type: EntityType.MAP, id: map.id }));
					}).catch(() => {
						showErrorNotification(translate('failed.to.edit.map'));
					});
			},
			invalidatesTags: ['MapsData']
		}),
		editMap: build.mutation<MapData, MapMetadata>({
			query: map => ({
				url: 'api/maps/edit',
				method: 'POST',
				body: {
					//  send only what backend expects.
					...pick(map, ['id', 'name', 'displayable', 'note', 'filename', 'mapSource', 'northAngle', 'circleSize']),
					// As in other place, this take the time, in this case the current time, grabs the
					// date and time without timezone and then set it to UTC. This allows the software
					// to recreate it with the same date/time as it is on this web browser when it is
					// displayed later (without the timezone shown).
					// It might be better to use the server time but this is good enough.
					modifiedDate: moment().format('YYYY-MM-DD HH:mm:ss') + '+00:00',
					origin: map.calibrationResult ? map.calibrationResult.origin : map.origin,
					opposite: map.calibrationResult ? map.calibrationResult.opposite : map.opposite
				}
			}),
			onQueryStarted: (map, api) => {
				api.queryFulfilled
					// TODO Serverlogs migrate to rtk Query to drop axios?
					// Requires dispatch so inconvenient
					.then(() => {
						if (map.calibrationResult) {
							// logToServer('info', 'Edited map uploaded to database(newly calibrated)');
							showSuccessNotification(translate('updated.map.with.calibration'));
						} else if (map.origin && map.opposite) {
							// logToServer('info', 'Edited map uploaded to database(calibration not updated)');
							showSuccessNotification(translate('updated.map.without.new.calibration'));
						} else {
							// logToServer('info', 'Edited map uploaded to database(without calibration)');
							showSuccessNotification(translate('updated.map.without.calibration'));
						}
						// Cleanup LocalEditsSLice
						// TODO Centralize localEditCleanup. Should be same as others.
						api.dispatch(localEditsSlice.actions.removeOneEdit({ type: EntityType.MAP, id: map.id }));
					}).catch(() => {
						showErrorNotification(translate('failed.to.edit.map'));
					});
			},
			invalidatesTags: ['MapsData']
		}),
		deleteMap: build.mutation<void, number>({
			query: id => ({
				url: 'api/maps/delete',
				method: 'POST',
				body: { id }
			})
		}),
		getMapById: build.query<MapData, number>({
			query: id => `api/maps/${id}`
		})
	})
});

const selectMapDataResult = mapsApi.endpoints.getMapDetails.select();
export const selectMapApiData = (state: RootState) => selectMapDataResult(state).data ?? mapsInitialState;
export const {
	selectAll: selectAllMaps,
	selectById: selectMapById,
	selectIds: selectMapIds,
	selectEntities: selectMapDataById,
	selectTotal: selectTotalMaps
} = mapsAdapter.getSelectors(selectMapApiData);
