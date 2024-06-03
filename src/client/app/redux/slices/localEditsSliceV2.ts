import {
	EntityState,
	PayloadAction,
	SliceCaseReducers, ValidateSliceCaseReducers,
	createEntityAdapter,
	createSlice
} from '@reduxjs/toolkit';
import { meterAdapter } from '../../redux/entityAdapters';


export const genericAdapter = createEntityAdapter<any>();
interface localEditsState<T> {
	edits: EntityState<T, number>;
}
const createGenericSlice = <
	T,
	Reducers extends SliceCaseReducers<localEditsState<T>>,
>({
	name = '',
	initialState,
	reducers
}: {
	name: string
	initialState: localEditsState<T>
	reducers: ValidateSliceCaseReducers<localEditsState<T>, Reducers>
}) => {
	return createSlice({
		name,
		initialState,
		reducers: {
			setOne: (state, action: PayloadAction<T>) => {
				// state.data = action.payload
				// state.status = 'finished'
				genericAdapter.setOne(state.edits, action.payload);
			},
			deleteAll: state => {
				genericAdapter.removeAll(state.edits);
			},
			deleteOne: (state, action: PayloadAction<number>) => {
				// state.data = action.payload
				// state.status = 'finished'
				genericAdapter.removeOne(state.edits, action.payload);
			},
			...reducers
		}
	});
};
export const meterEdits = createGenericSlice({
	name: 'localMeterEdits',
	initialState: {
		edits: meterAdapter.getInitialState()
	},
	reducers: {
		// magic: state => {
		// }
	}
});

