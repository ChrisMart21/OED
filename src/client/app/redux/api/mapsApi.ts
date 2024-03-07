import { EntityState, createEntityAdapter } from '@reduxjs/toolkit';
import { RootState } from 'store';
import { MapMetadata } from '../../types/redux/map';
import { baseApi } from './baseApi';
export const mapsAdapter = createEntityAdapter<MapMetadata>({
	sortComparer: (mapA, mapB) => mapA.name?.localeCompare(mapB.name, undefined, { sensitivity: 'accent' })
});
export const mapsInitialState = mapsAdapter.getInitialState();
export type MapDataState = EntityState<MapMetadata, number>;


export const mapsApi = baseApi.injectEndpoints({
	endpoints: build => ({
		getMapDetails: build.query<MapDataState, void>({
			query: () => 'api/maps/',
			transformResponse: async (response: MapMetadata[]) => {
				// To avoid saving unserializable image(s) in state, extract the image dimensions andn nly store the mapSource (string)
				return mapsAdapter.setAll(mapsInitialState, await mapResponseImgSrcToDimensions(response));
			}
		})
	})
});

export const selectMapDataResult = mapsApi.endpoints.getMapDetails.select();

export const {
	selectAll: selectAllMaps,
	selectById: selectMapById,
	selectIds: selectMapIds,
	selectEntities: selectMapDataById,
	selectTotal: selectTotalMaps
} = mapsAdapter.getSelectors((state: RootState) => selectMapDataResult(state).data ?? mapsInitialState);


// Helper function to extract image dimensions from the mapSource
const mapResponseImgSrcToDimensions = (response: MapMetadata[]) => {
	return Promise.all(
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

};
