/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { createSelector, createSelectorCreator } from '@reduxjs/toolkit';
import { unstable_autotrackMemoize } from 'reselect';
import { RootState } from '../../store';

// Pre-typed selector. Use anywhere what RootState will be the first arg passed to selector
// Input Dependencies must be an array.
export const createAppSelector = createSelector.withTypes<RootState>();
export const createAutoTrackAppSelector = createSelectorCreator({
	memoize: unstable_autotrackMemoize
}).withTypes<RootState>();
export const createAutoTrackSelector = createSelectorCreator({
	memoize: unstable_autotrackMemoize
});
