import { EntityState, createEntityAdapter } from '@reduxjs/toolkit';
import { createThunkSlice } from '../../redux/sliceCreators';
import { RootState } from '../../store';
import { MeterDataState } from 'redux/api/metersApi';
import { GroupDataState } from 'redux/api/groupsApi';
import { UnitDataState } from 'redux/api/unitsApi';
import { MapDataState } from 'redux/api/mapsApi';

// Generic object with an id property
interface GenericObjectWithId {
	id: number;
}
export const localEditsAdapter = createEntityAdapter<GenericObjectWithId>();
export const localEditsInitialState = localEditsAdapter.getInitialState();
export type LocalEdit = EntityState<GenericObjectWithId, number>;

interface LocalEditsState {
	// Define your state properties here
	meters: LocalEdit;
	groups: LocalEdit;
	units: LocalEdit;
	maps: LocalEdit;
}

const initialState: LocalEditsState = {
	// Initialize your state properties here
	meters: localEditsInitialState,
	groups: localEditsInitialState,
	units: localEditsInitialState,
	maps: localEditsInitialState
};

export enum EntityType {
	METER = 'meters',
	GROUP = 'groups',
	UNIT = 'units',
	MAP = 'maps'

}

// Define your actions and reducers here
export const localEditsSlice = createThunkSlice({
	name: 'localEdits',
	initialState,
	reducers: create => ({
		set: create.reducer<{ type: EntityType, data: GenericObjectWithId | GenericObjectWithId[] }>((state, action) => {
			const localEdits = localEditsSlice.getSelectors().selectLocalEdits(state, action.payload.type);
			Array.isArray(action.payload.data)
				? localEditsAdapter.setAll(localEdits, action.payload.data)
				: localEditsAdapter.setOne(localEdits, action.payload.data);
		}),
		deleteOneOrMany: create.reducer<{ type: EntityType, id: undefined | number | number[] }>((state, action) => {
			const localEdits = localEditsSlice.getSelectors().selectLocalEdits(state, action.payload.type);
			if (typeof action.payload.id === 'number') {
				localEditsAdapter.removeOne(localEdits, action.payload.id);
			} else if (Array.isArray(action.payload.id)) {
				localEditsAdapter.removeMany(localEdits, action.payload.id);
			} else {
				localEditsAdapter.removeAll(localEdits);
			}
		}),
		upsert: create.reducer<{ type: EntityType, data: GenericObjectWithId | GenericObjectWithId[] }>((state, action) => {
			const localEdits = localEditsSlice.getSelectors().selectLocalEdits(state, action.payload.type);
			Array.isArray(action.payload.data)
				? localEditsAdapter.upsertMany(localEdits, action.payload.data)
				: localEditsAdapter.upsertOne(localEdits, action.payload.data);
		})
	}),
	selectors: {
		selectLocalEdits: (state, type: EntityType | undefined = undefined) => {
			switch (type) {
				case EntityType.METER:
					return state.meters as MeterDataState;
				case EntityType.GROUP:
					return state.groups as GroupDataState;
				case EntityType.UNIT:
					return state.units as UnitDataState;
				case EntityType.MAP:
					return state.maps as MapDataState;
				default:
					throw new Error('Invalid Local Edit type');
			}
		}
	}
}
);
export const { set, upsert, deleteOneOrMany } = localEditsSlice.actions;
export const { selectLocalEdits } = localEditsSlice.selectors;
export const {
	selectAll: selectAllEditedMeters,
	selectById: selectEditedMeterById,
	selectTotal: selectEditedMeterTotal,
	selectIds: selectEditedMeterIds,
	selectEntities: selectEditedMeterDataById
} = localEditsAdapter.getSelectors((state: RootState) => state.localEdits.meters);

export const {
	selectAll: selectAllEditedGroups,
	selectById: selectEditedGroupById,
	selectTotal: selectEditedGroupTotal,
	selectIds: selectEditedGroupIds,
	selectEntities: selectEditedGroupDataById
} = localEditsAdapter.getSelectors((state: RootState) => state.localEdits.groups);

export const {
	selectAll: selectAllEditedUnits,
	selectById: selectEditedUnitById,
	selectTotal: selectEditedUnitTotal,
	selectIds: selectEditedUnitIds,
	selectEntities: selectEditedUnitDataById
} = localEditsAdapter.getSelectors((state: RootState) => state.localEdits.units);

export const {
	selectAll: selectAllEditedMaps,
	selectById: selectEditedMapById,
	selectTotal: selectEditedMapTotal,
	selectIds: selectEditedMapIds,
	selectEntities: selectEditedMapDataById
} = localEditsAdapter.getSelectors((state: RootState) => state.localEdits.maps);

