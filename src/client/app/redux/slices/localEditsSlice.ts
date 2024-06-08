import { createEntityAdapter } from '@reduxjs/toolkit';
import { GroupData } from 'types/redux/groups';
import { MapMetadata } from 'types/redux/map';
import { MeterData } from 'types/redux/meters';
import { UnitData } from 'types/redux/units';
import { selectGroupApiData } from '../../redux/api/groupsApi';
import { selectMapApiData } from '../../redux/api/mapsApi';
import { selectMeterApiData } from '../../redux/api/metersApi';
import { selectUnitApiData } from '../../redux/api/unitsApi';
import { createThunkSlice } from '../../redux/sliceCreators';
import { RootState } from '../../store';
import {
	GroupDataState,
	groupsInitialState,
	MapDataState,
	mapsInitialState,
	MeterDataState,
	metersInitialState,
	UnitDataState,
	unitsInitialState
} from '../entityAdapters';


export enum EntityType { METER, GROUP, UNIT, MAP }
// Mapping of enum to data type
export type EntityTypeMap = {
	[EntityType.METER]: MeterData;
	[EntityType.GROUP]: GroupData;
	[EntityType.UNIT]: UnitData;
	[EntityType.MAP]: MapMetadata;
}
// Generic to be used with EntityTypeEnum to
export type EntityDataType<T extends EntityType = EntityType> = T extends keyof EntityTypeMap ? EntityTypeMap[T] : never;
export type SetOneEditAction<T extends EntityType = EntityType> = { type: T, data: EntityDataType<T> };

export const localEditAdapter = createEntityAdapter<EntityDataType>();
// Equivalent to createEntityAdapter<MeterData | GroupData | UnitData | MapMetadata|...>();
interface LocalEditsState {
	// Define your state properties here
	meters: MeterDataState;
	groups: GroupDataState;
	units: UnitDataState;
	maps: MapDataState;
	idToEdit: number;
	isOpen: boolean;
}
const initialState: LocalEditsState = {
	// Initialize your state properties here
	meters: metersInitialState,
	groups: groupsInitialState,
	units: unitsInitialState,
	maps: mapsInitialState,
	idToEdit: 0,
	isOpen: false
};


// Slice is used to track local admin edits to avoid using useState, and to avoid altering the server response data
export const localEditsSlice = createThunkSlice({
	name: 'localEdits',
	initialState,
	reducers: create => ({
		toggleIsOpen: create.reducer(state => {
			state.isOpen = !state.isOpen;
		}),
		setIdToEdit: create.reducer<number>((state, { payload }) => {
			state.idToEdit = payload;
		}),
		openModalWithID: create.reducer<number>((state, { payload }) => {
			state.idToEdit = payload;
			state.isOpen = true;
		}),
		setOneEdit: create.reducer<SetOneEditAction>((state, { payload: { type, data } }) => {
			const cacheEntry = localEditsSlice.getSelectors().selectEditCacheByType(state, type);
			localEditAdapter.setOne(cacheEntry, data);
		}),
		removeOneEdit: create.reducer<{ type: EntityType, id: number }>((state, { payload: { type, id } }) => {
			const cacheEntry = localEditsSlice.getSelectors().selectEditCacheByType(state, type);
			localEditAdapter.removeOne(cacheEntry, id);

		})
	}),
	selectors: {
		selectIdToEdit: state => state.idToEdit,
		selectIsOpen: state => state.isOpen,
		selectEditCacheByType: (state, type: EntityType) => {
			switch (type) {
				case EntityType.METER:
					return state.meters;
				case EntityType.GROUP:
					return state.groups;
				case EntityType.UNIT:
					return state.units;
				case EntityType.MAP:
					return state.maps;
				default: {
					return type as never;
				}
			}
		}
	}
});

export const { selectEditCacheByType } = localEditsSlice.selectors;
export const {
	toggleIsOpen, setIdToEdit,
	openModalWithID, setOneEdit, removeOneEdit
} = localEditsSlice.actions;
export const { selectIdToEdit, selectIsOpen } = localEditsSlice.selectors;
export const selectApiCacheByType = (state: RootState, type: EntityType) => {
	switch (type) {
		case EntityType.METER:
			return selectMeterApiData(state);
		case EntityType.GROUP:
			return selectGroupApiData(state);
		case EntityType.UNIT:
			return selectUnitApiData(state);
		case EntityType.MAP:
			return selectMapApiData(state);
		default: {
			return type as never;
		}
	}
};

// SelectCache location either from the rtkQueryCache, or localEdits
export const selectCacheByType = (state: RootState, args: { type: EntityType, local?: boolean }) => {
	// When local passed as true uses local edit cache (defaults to false)
	const { type, local = false } = args;
	return (local ? selectEditCacheByType(state, type) : selectApiCacheByType(state, type));
};

const {
	selectById
} = localEditAdapter.getSelectors();
export const selectLocalOrServerEntityById = <T extends EntityType>(state: RootState, args: { type: T, id: number, local?: boolean }) => {
	const { type, id, local = false } = args;
	const entityCache = selectCacheByType(state, { type, local });
	return selectById(entityCache, id) as EntityDataType<T>;
};

export const selectEditById = <T extends EntityType>(state: RootState, args: { type: T, id: number }) => {
	const cache = localEditsSlice.selectors.selectEditCacheByType(state, args.type);
	return selectById(cache, args.id) as EntityDataType<T>;
};
