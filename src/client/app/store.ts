/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { configureStore } from '@reduxjs/toolkit'
import { rootReducer } from './reducers';
import { baseApi } from './redux/api/baseApi';


export const store = configureStore({
	reducer: rootReducer,
	middleware: getDefaultMiddleware => getDefaultMiddleware({
		// immutableCheck: false,
		serializableCheck: false
	}).concat(baseApi.middleware)
});

// Infer the `RootState` and `AppDispatch` types from the store itself
// https://react-redux.js.org/using-react-redux/usage-with-typescript#define-root-state-and-dispatch-types
export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch