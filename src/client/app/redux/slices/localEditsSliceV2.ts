import {
	ActionReducerMapBuilder,
	EntityState,
	PayloadAction,
	SliceCaseReducers, SliceSelectors, Update, ValidateSliceCaseReducers,
	combineReducers,
	createEntityAdapter,
	createSlice
} from '@reduxjs/toolkit';
import { RootState } from 'store';
import { GroupData } from 'types/redux/groups';
import { MapMetadata } from 'types/redux/map';
import { MeterData } from 'types/redux/meters';
import { UnitData } from 'types/redux/units';
import { selectGroupById } from '../../redux/api/groupsApi';
import { selectMapById } from '../../redux/api/mapsApi';
import { selectMeterById } from '../../redux/api/metersApi';
import { selectUnitById } from '../../redux/api/unitsApi';
import { groupsAdapter, mapsAdapter, meterAdapter, unitsAdapter } from '../../redux/entityAdapters';
import { createThunkSlice } from '../../redux/sliceCreators';

export const entityAdapter = createEntityAdapter<any>();
interface LocalEdits<T, U> {
	edits: EntityState<T, number>;
	meta: U
}
const createLocalEditSlice = <
	T, E,
	Reducers extends SliceCaseReducers<LocalEdits<T, E>>,
	Selectors extends SliceSelectors<LocalEdits<T, E>>,
	ExtraReducers extends (builder: ActionReducerMapBuilder<LocalEdits<T, E>>) => void
>({
	name = '',
	initialState,
	reducers,
	selectors,
	extraReducers
}: {
	name: string
	initialState: LocalEdits<T, E>
	reducers?: ValidateSliceCaseReducers<LocalEdits<T, E>, Reducers>,
	selectors?: Selectors,
	extraReducers?: ExtraReducers
}) => {
	return createSlice({
		name,
		initialState,
		reducers: {
			setOne: (state, action: PayloadAction<T>) => {
				entityAdapter.setOne(state.edits, action.payload);
			},
			setMany: (state, action: PayloadAction<T[] | Record<number, T>>) => {
				entityAdapter.setMany(state.edits, action.payload);
			},
			deleteAll: state => {
				entityAdapter.removeAll(state.edits);
			},
			deleteOne: (state, action: PayloadAction<number>) => {
				entityAdapter.removeOne(state.edits, action.payload);
			},
			upsertOne: (state, action: PayloadAction<T>) => {
				entityAdapter.upsertOne(state.edits, action.payload);
			},
			upsertMany: (state, action: PayloadAction<T[]>) => {
				entityAdapter.upsertMany(state.edits, action.payload);
			},
			updateOne: (state, action: PayloadAction<Update<T, number>>) => {
				entityAdapter.updateOne(state.edits, action.payload);
			},
			updateMany: (state, action: PayloadAction<Update<T, number>[]>) => {
				entityAdapter.updateMany(state.edits, action.payload);
			},
			...reducers!
		},
		selectors: {
			...selectors!
		},
		extraReducers
	});
};
export const meterEdits = createLocalEditSlice({
	name: 'meterEdits',
	initialState: {
		edits: meterAdapter.getInitialState(),
		meta: {}
	}
});
export const groupEdits = createLocalEditSlice({
	name: 'groupEdits',
	initialState: {
		edits: groupsAdapter.getInitialState(),
		meta: {}
	}
});
export const unitEdits = createLocalEditSlice({
	name: 'unitEdits',
	initialState: {
		edits: unitsAdapter.getInitialState(),
		meta: {}
	}
});
export const mapEdits = createLocalEditSlice({
	name: 'mapEdits',
	initialState: {
		edits: mapsAdapter.getInitialState(),
		meta: {}
	}
});
// export const conversionEdits = createLocalEditSlice({
// 	name: 'conversionEdits',
// 	initialState: {
// 		edits: conversions.getInitialState(),
// 		meta: {}
// 	}
// });

export const localEditModalSlice = createThunkSlice({
	name: 'modal',
	initialState: {
		isOpen: false,
		idToEdit: 0
	},
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
		})
	}),
	selectors: {
		selectIdToEdit: state => state.idToEdit,
		selectIsOpen: state => state.isOpen
	}
});



export const localEdits2 = combineReducers({
	modal: localEditModalSlice.reducer,
	meters: meterEdits.reducer,
	groups: groupEdits.reducer,
	units: unitEdits.reducer,
	maps: mapEdits.reducer
});

export const { toggleIsOpen, setIdToEdit } = localEditModalSlice.actions;
export const { selectIdToEdit, selectIsOpen } = localEditModalSlice.selectors;
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

export enum EntityType {
	METER = 'meters',
	GROUP = 'groups',
	UNIT = 'units',
	MAP = 'maps'
}
export type EntityDataType<T extends EntityType> = T extends EntityType.METER
	? MeterData
	: T extends EntityType.GROUP
		? GroupData
		: T extends EntityType.UNIT
			? UnitData
			: T extends EntityType.MAP
				? MapMetadata
				: never;

export const selectLocalOrServerEntityById = <T extends EntityType>(state: RootState, args: { type: T, id: number, local?: boolean }) => {
	const { type, id, local = false } = args;
	let localOrServer;
	switch (type) {
		case EntityType.METER:
			localOrServer = local ? selectEditedMeterById(state, id) : selectMeterById(state, id);
			break;
		case EntityType.GROUP:
			localOrServer = local ? selectEditedGroupById(state, id) : selectGroupById(state, id);
			break;
		case EntityType.UNIT:
			localOrServer = local ? selectEditedUnitById(state, id) : selectUnitById(state, id);
			break;
		case EntityType.MAP:
			localOrServer = local ? selectEditedMapById(state, id) : selectMapById(state, id);
			break;
		default:
			return localOrServer as never;
	}
	return localOrServer as EntityDataType<T>;
};
