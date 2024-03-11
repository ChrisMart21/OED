import { RootState } from 'store';
import { MapData, MapMetadata } from '../../types/redux/map';
import { baseApi } from './baseApi';
import { MapDataState, mapsAdapter, mapsInitialState } from '../entityAdapters';

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
		createMap: build.mutation<void, MapData>({
			query: mapData => ({
				url: 'api/maps/create',
				method: 'POST',
				body: mapData
			})
		}),
		editMap: build.mutation<MapData, MapData>({
			query: mapData => ({
				url: 'api/maps/edit',
				method: 'POST',
				body: mapData
			})
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

export const selectMapDataResult = mapsApi.endpoints.getMapDetails.select();

export const {
	selectAll: selectAllMaps,
	selectById: selectMapById,
	selectIds: selectMapIds,
	selectEntities: selectMapDataById,
	selectTotal: selectTotalMaps
} = mapsAdapter.getSelectors((state: RootState) => selectMapDataResult(state).data ?? mapsInitialState);
