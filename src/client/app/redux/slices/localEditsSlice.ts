import { createEntityAdapter } from '@reduxjs/toolkit';
import { selectGroupById } from '../../redux/api/groupsApi';
import { selectMapById } from '../../redux/api/mapsApi';
import { selectMeterById } from '../../redux/api/metersApi';
import { selectUnitById } from '../../redux/api/unitsApi';
import { createThunkSlice } from '../../redux/sliceCreators';
import { RootState } from '../../store';
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
import { EntityDataType } from './localEditsSliceV2';


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

export type EntityTypeMap =
	{ type: EntityType.METER; data: MeterData } |
	{ type: EntityType.GROUP; data: GroupData } |
	{ type: EntityType.UNIT; data: UnitData } |
	{ type: EntityType.MAP; data: MapMetadata }

export type EntityTypeMap2 = {
	[EntityType.METER]: MeterData;
	[EntityType.GROUP]: GroupData;
	[EntityType.UNIT]: UnitData;
	[EntityType.MAP]: MapMetadata;

}

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
		setOneLocalEdit: create.reducer<EntityTypeMap>((state, { payload: { type, data } }) => {
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
export const selectApiDataById = <T extends EntityType>(state: RootState, xtra: { type: T, id: number }) => {
	{
		const { type, id } = xtra;
		let x;
		switch (type) {
			case EntityType.METER:
				x = selectMeterById(state, id);
				break;
			case EntityType.GROUP:
				x = selectGroupById(state, id);
				break;
			case EntityType.UNIT:
				x = selectUnitById(state, id);
				break;
			case EntityType.MAP:
				x = selectMapById(state, id);
				break;
			default:
				x = undefined;
		}
		return x as EntityDataType<T>;
	}
};
export const selectLocalEditById = <T extends EntityType>(state: RootState, xtra: { type: T, id: number }) => {
	const { type, id } = xtra;
	let x;
	switch (type) {
		case EntityType.METER:
			x = meterAdapter.getSelectors().selectById(state.localEdits2.meters!.edits, id);
			break;
		case EntityType.GROUP:
			x = groupsAdapter.getSelectors().selectById(state.localEdits2.groups!.edits, id);
			break;
		case EntityType.UNIT:
			x = unitsAdapter.getSelectors().selectById(state.localEdits2.units!.edits, id);
			break;
		case EntityType.MAP:
			x = mapsAdapter.getSelectors().selectById(state.localEdits2.maps!.edits, id);
			break;
		default:
			throw ('Shouldn\'t arrive here');
	}
	return x as EntityDataType<T>;
};

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
} = meterAdapter.getSelectors((state: RootState) => state.localEdits2.meters!.edits);

export const {
	selectAll: selectAllEditedGroups,
	selectById: selectEditedGroupById,
	selectTotal: selectEditedGroupTotal,
	selectIds: selectEditedGroupIds,
	selectEntities: selectEditedGroupDataById
} = groupsAdapter.getSelectors((state: RootState) => state.localEdits2.groups!.edits);

export const {
	selectAll: selectAllEditedUnits,
	selectById: selectEditedUnitById,
	selectTotal: selectEditedUnitTotal,
	selectIds: selectEditedUnitIds,
	selectEntities: selectEditedUnitDataById
} = unitsAdapter.getSelectors((state: RootState) => state.localEdits2.units!.edits);

export const {
	selectAll: selectAllEditedMaps,
	selectById: selectEditedMapById,
	selectTotal: selectEditedMapTotal,
	selectIds: selectEditedMapIds,
	selectEntities: selectEditedMapDataById
} = mapsAdapter.getSelectors((state: RootState) => state.localEdits2.maps!.edits);

