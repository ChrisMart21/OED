import { RootState } from 'store';
import { createThunkSlice } from '../../redux/sliceCreators';
import { GroupData } from '../../types/redux/groups';
import { MapMetadata } from '../../types/redux/map';
import { MeterData } from '../../types/redux/meters';
import { UnitData } from '../../types/redux/units';
import {
	GroupDataState, MapDataState, MeterDataState, UnitDataState,
	groupsAdapter, groupsInitialState,
	mapsAdapter, mapsInitialState,
	meterAdapter, metersInitialState,
	unitsAdapter, unitsInitialState
} from '../entityAdapters';


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

export enum EntityType {
	METER = 'meters',
	GROUP = 'groups',
	UNIT = 'units',
	MAP = 'maps'
}

export type SetEditAction =
	{ type: EntityType.METER; data: MeterData | MeterData[] } |
	{ type: EntityType.GROUP; data: GroupData | GroupData[] } |
	{ type: EntityType.UNIT; data: UnitData | UnitData[] } |
	{ type: EntityType.MAP; data: MapMetadata | MapMetadata[] }


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
		setEdits: create.reducer<SetEditAction>((state, { payload: { type, data } }) => {
			// TS linter doesn't mind but webpack complains so type assert all here
			switch (type) {
				case EntityType.METER:
					Array.isArray(data) ? meterAdapter.setAll(state.meters, data as MeterData[]) : meterAdapter.setOne(state.meters, data as MeterData);
					break;
				case EntityType.GROUP:
					Array.isArray(data) ? groupsAdapter.setAll(state.groups, data as GroupData[]) : groupsAdapter.setOne(state.groups, data as GroupData);
					break;
				case EntityType.UNIT:
					Array.isArray(data) ? unitsAdapter.setAll(state.units, data as UnitData[]) : unitsAdapter.setOne(state.units, data as UnitData);
					break;
				case EntityType.MAP:
					Array.isArray(data) ? mapsAdapter.setAll(state.maps, data as MapMetadata[]) : mapsAdapter.setOne(state.maps, data as MapMetadata);
					break;
				default:
					throw new Error('Invalid entity type');
			}
		}),
		deleteEdits: create.reducer<{ type: EntityType, id?: number | number[] }>((state, { payload: { type, id } }) => {
			if (typeof id === 'number') {
				type === EntityType.METER && meterAdapter.removeOne(state.meters, id);
				type === EntityType.GROUP && groupsAdapter.removeOne(state.groups, id);
				type === EntityType.UNIT && unitsAdapter.removeOne(state.units, id);
				type === EntityType.MAP && mapsAdapter.removeOne(state.maps, id);
			} else if (Array.isArray(id)) {
				type === EntityType.METER && meterAdapter.removeMany(state.meters, id);
				type === EntityType.GROUP && groupsAdapter.removeMany(state.groups, id);
				type === EntityType.UNIT && unitsAdapter.removeMany(state.units, id);
				type === EntityType.MAP && mapsAdapter.removeMany(state.maps, id);
			} else {
				type === EntityType.METER && meterAdapter.removeAll(state.meters);
				type === EntityType.GROUP && groupsAdapter.removeAll(state.groups);
				type === EntityType.UNIT && unitsAdapter.removeAll(state.units);
				type === EntityType.MAP && mapsAdapter.removeAll(state.maps);
			}
		})
	}),
	selectors: {
		selectIdToEdit: state => state.idToEdit,
		selectIsOpen: state => state.isOpen,
		selectLocalEdits: (state, type: EntityType) => {
			switch (type) {
				case EntityType.METER:
					return state.meters;
				case EntityType.GROUP:
					return state.groups;
				case EntityType.UNIT:
					return state.units;
				case EntityType.MAP:
					return state.maps;
				default:
					throw new Error('Invalid entity type');
			}
		}
	}
});

export const { setEdits, deleteEdits, toggleIsOpen, setIdToEdit, openModalWithID } = localEditsSlice.actions;
export const { selectIdToEdit, selectIsOpen, selectLocalEdits } = localEditsSlice.selectors;
export const {
	selectAll: selectAllEditedMeters,
	selectById: selectEditedMeterById,
	selectTotal: selectEditedMeterTotal,
	selectIds: selectEditedMeterIds,
	selectEntities: selectEditedMeterDataById
} = meterAdapter.getSelectors((state: RootState) => state.localEdits.meters);

export const {
	selectAll: selectAllEditedGroups,
	selectById: selectEditedGroupById,
	selectTotal: selectEditedGroupTotal,
	selectIds: selectEditedGroupIds,
	selectEntities: selectEditedGroupDataById
} = groupsAdapter.getSelectors((state: RootState) => state.localEdits.groups);

export const {
	selectAll: selectAllEditedUnits,
	selectById: selectEditedUnitById,
	selectTotal: selectEditedUnitTotal,
	selectIds: selectEditedUnitIds,
	selectEntities: selectEditedUnitDataById
} = unitsAdapter.getSelectors((state: RootState) => state.localEdits.units);

export const {
	selectAll: selectAllEditedMaps,
	selectById: selectEditedMapById,
	selectTotal: selectEditedMapTotal,
	selectIds: selectEditedMapIds,
	selectEntities: selectEditedMapDataById
} = mapsAdapter.getSelectors((state: RootState) => state.localEdits.maps);