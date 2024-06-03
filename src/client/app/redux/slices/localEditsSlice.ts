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
import { createEntityAdapter } from '@reduxjs/toolkit';


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

export type SetOneLocalEditAction =
	{ type: EntityType.METER; data: MeterData } |
	{ type: EntityType.GROUP; data: GroupData } |
	{ type: EntityType.UNIT; data: UnitData } |
	{ type: EntityType.MAP; data: MapMetadata }

export const localEditAdapter = createEntityAdapter<MeterData | GroupData | UnitData | MapMetadata>();

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
		setOneLocalEdit: create.reducer<SetOneLocalEditAction>((state, { payload: { type, data } }) => {
			type === EntityType.METER && localEditAdapter.setOne(state.meters, data);
			type === EntityType.GROUP && localEditAdapter.setOne(state.groups, data);
			type === EntityType.UNIT && localEditAdapter.setOne(state.units, data);
			type === EntityType.MAP && localEditAdapter.setOne(state.maps, data);
		}),
		deleteAllLocalEdits: create.reducer<{ type: EntityType }>((state, { payload: { type } }) => {
			type === EntityType.METER && localEditAdapter.removeAll(state.meters);
			type === EntityType.GROUP && localEditAdapter.removeAll(state.groups);
			type === EntityType.UNIT && localEditAdapter.removeAll(state.units);
			type === EntityType.MAP && localEditAdapter.removeAll(state.maps);
		}),
		deleteOneLocalEdit: create.reducer<{ type: EntityType, id: number }>((state, { payload: { type, id } }) => {
			type === EntityType.METER && localEditAdapter.removeOne(state.meters, id);
			type === EntityType.GROUP && localEditAdapter.removeOne(state.groups, id);
			type === EntityType.UNIT && localEditAdapter.removeOne(state.units, id);
			type === EntityType.MAP && localEditAdapter.removeOne(state.maps, id);
		})
	}),
	selectors: {
		selectIdToEdit: state => state.idToEdit,
		selectIsOpen: state => state.isOpen
	}
});

export const {
	deleteOneLocalEdit, toggleIsOpen, setIdToEdit,
	openModalWithID, setOneLocalEdit, deleteAllLocalEdits
} = localEditsSlice.actions;
export const { selectIdToEdit, selectIsOpen } = localEditsSlice.selectors;
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