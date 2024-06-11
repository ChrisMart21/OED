import { createEntityAdapter } from '@reduxjs/toolkit';
import { GroupData } from 'types/redux/groups';
import { MapMetadata } from 'types/redux/map';
import { MeterData } from 'types/redux/meters';
import { UnitData } from 'types/redux/units';
import { selectGroupApiData } from '../../redux/api/groupsApi';
import { selectMapApiData } from '../../redux/api/mapsApi';
import { selectMeterApiData } from '../../redux/api/metersApi';
import { selectUnitApiData } from '../../redux/api/unitsApi';
import { createAppSelector } from '../../redux/selectors/selectors';
import { createThunkSlice } from '../../redux/sliceCreators';
import { RootState } from '../../store';
import {
	ConversionDataState,
	ConversionDataWithIds,
	conversionsInitialState,
	GroupDataState,
	groupsInitialState,
	MapDataState,
	mapsInitialState,
	MeterDataState,
	metersInitialState,
	UnitDataState,
	unitsInitialState
} from '../entityAdapters';
import { selectConversionApiData } from '../../redux/api/conversionsApi';


// TODO revisit the typing of localEdits (slice,selector, overall approach?) to properly infer arguments and results
// many type assertions are needed which works, but perhaps a better approach could be looked into.
export enum EntityType { METER, GROUP, UNIT, MAP, CONVERSION }
// Mapping of enum to data type
export type EntityTypeMap = {
	[EntityType.METER]: MeterData;
	[EntityType.GROUP]: GroupData;
	[EntityType.UNIT]: UnitData;
	[EntityType.MAP]: MapMetadata;
	[EntityType.CONVERSION]: ConversionDataWithIds;
}
// Generic to be used with EntityTypeEnum to
export type EntityDataType<T extends EntityType = EntityType> = T extends keyof EntityTypeMap ? EntityTypeMap[T] : never;
export type SetOneEditAction<T extends EntityType = EntityType> = { type: T, data: EntityDataType<T> };
export type LocalEditEntity<T extends EntityType = EntityType> = { type: T; id: number };

export const localEditAdapter = createEntityAdapter<EntityDataType>();
const {
	selectById
} = localEditAdapter.getSelectors();
interface LocalEditsState {
	idToEdit: number;
	typeToEdt: EntityType | undefined;
	isOpen: boolean;
	meters: MeterDataState;
	groups: GroupDataState;
	units: UnitDataState;
	maps: MapDataState;
	conversions: ConversionDataState;
}
const initialState: LocalEditsState = {
	typeToEdt: undefined,
	idToEdit: 0,
	isOpen: false,
	meters: metersInitialState,
	groups: groupsInitialState,
	units: unitsInitialState,
	maps: mapsInitialState,
	conversions: conversionsInitialState
};

// Slice is used to track local admin edits to avoid using useState, and to avoid altering the server response data
export const localEditsSlice = createThunkSlice({
	name: 'localEdits',
	initialState,
	reducers: create => ({
		toggleAdminEditModal: create.reducer(state => {
			state.isOpen = !state.isOpen;
		}),
		setIdToEdit: create.reducer<number>((state, { payload }) => {
			state.idToEdit = payload;
		}),
		setTypeToEdit: create.reducer<EntityType>((state, { payload }) => {
			state.typeToEdt = payload;
		}),
		openEditModalWithId: create.reducer<LocalEditEntity>((state, { payload }) => {
			state.idToEdit = payload.id;
			state.typeToEdt = payload.type;
			state.isOpen = true;
		}),
		setOneEdit: create.reducer<SetOneEditAction>((state, { payload: { type, data } }) => {
			const cacheEntry = localEditsSlice.getSelectors().selectEditCacheByType(state, type);
			localEditAdapter.setOne(cacheEntry, data);
		}),
		removeOneEdit: create.reducer<LocalEditEntity>((state, { payload: { type, id } }) => {
			const cacheEntry = localEditsSlice.getSelectors().selectEditCacheByType(state, type);
			localEditAdapter.removeOne(cacheEntry, id);

		})
	}),
	selectors: {
		selectIdToEdit: state => state.idToEdit,
		selectTypeToEdit: state => state.typeToEdt,
		selectEditModalIsOpen: state => state.isOpen,
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
				case EntityType.CONVERSION:
					return state.conversions;
				default: {
					return type as never;
				}
			}
		}
	}
});

export const { selectEditCacheByType } = localEditsSlice.selectors;
export const {
	toggleAdminEditModal, setIdToEdit,
	openEditModalWithId, setOneEdit, removeOneEdit
} = localEditsSlice.actions;
export const { selectIdToEdit, selectEditModalIsOpen, selectTypeToEdit } = localEditsSlice.selectors;


// utilize api selectors to get api cache entries.
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
		case EntityType.CONVERSION:
			return selectConversionApiData(state);
		default: {
			return type as never;
		}
	}
};
export interface LocalOrApiCache<T extends EntityType = EntityType> {
	type: T;
	local?: boolean;
}
export type LocalOrApiEntity<T extends EntityType = EntityType> = LocalOrApiCache<T> & {
	id: number
}
// SelectCache location either from the rtkQueryCache, or localEdits
export const selectCacheByType = (state: RootState, args: LocalOrApiCache) => {
	// When local passed as true uses local edit cache (defaults to false)
	const { type, local = false } = args;
	return (local ? selectEditCacheByType(state, type) : selectApiCacheByType(state, type));
};

// Select the desired loccal or server cache then pass the cache to the adapter to retrieve desired id.
export const selectLocalOrServerEntityById = <T extends EntityType>(state: RootState, args: LocalOrApiEntity<T>) => {
	const { type, id, local = false } = args;
	const entityCache = selectCacheByType(state, { type, local });
	// Type Assertion on return to eliminate EntityType Unions and proper type inference in components.
	return selectById(entityCache, id) as EntityDataType<T>;
};

// If an entry is found in the edits, then there are unsaved changes.
export const selectEntityHasChanges = (state: RootState, args: LocalOrApiEntity) => {
	// if an entry in the local edit cache exits, then unsaved changes.
	return Boolean(selectLocalOrServerEntityById(state, { type: args.type, id: args.id, local: true }));
};

const getEntityDisplayData = createAppSelector(
	// this selector's type inference is too smart for localEdit's type implementation, so it is wrapped with a ts lie ;)
	// the desired return type is of EntityDataType<T>, however TS infers it as meterdata | groupdata| etc... which cuases issues downastream
	// Unsure of how to achieve this so simple solution is to wrap this.
	[
		(state, args: LocalOrApiEntity) => selectLocalOrServerEntityById(state, { type: args.type, id: args.id }),
		(state, args: LocalOrApiEntity) => selectLocalOrServerEntityById(state, { type: args.type, id: args.id, local: true }),
		(state, args: LocalOrApiEntity) => selectEntityHasChanges(state, { type: args.type, id: args.id })
	],
	(apiData, localData, unsavedChanges) => {
		const data = localData ?? apiData;
		return [data, unsavedChanges];
	}
);

// this selector is simply wraps a memoized selector for easy type generic type assertion.
export const selectEntityDisplayData = <T extends EntityType>(state: RootState, args: LocalEditEntity<T>) => {
	return getEntityDisplayData(state, args) as [data: EntityDataType<T>, unsavedChanges: boolean];
};