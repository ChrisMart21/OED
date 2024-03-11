import { EntityState, createEntityAdapter } from '@reduxjs/toolkit';
import { MeterData } from '../types/redux/meters';
import { GroupData } from '../types/redux/groups';
import { UnitData } from '../types/redux/units';
import { MapMetadata } from '../types/redux/map';
const sortByIdentifierProperty = (a: any, b: any) => a.identifier?.localeCompare(b.identifier, undefined, { sensitivity: 'accent' });
const sortByNameProperty = (a: any, b: any) => a.name?.localeCompare(b.name, undefined, { sensitivity: 'accent' });

// Adapters re-homed for compatability with localEditsSlice.ts/ prevents circular dependency issues.
// Meters
export const meterAdapter = createEntityAdapter<MeterData>({ sortComparer: sortByIdentifierProperty });
export const metersInitialState = meterAdapter.getInitialState();
export type MeterDataState = EntityState<MeterData, number>;


// Units
export const unitsAdapter = createEntityAdapter<UnitData>({ sortComparer: sortByIdentifierProperty });
export const unitsInitialState = unitsAdapter.getInitialState();
export type UnitDataState = EntityState<UnitData, number>;

// Groups
export const groupsAdapter = createEntityAdapter<GroupData>({ sortComparer: sortByNameProperty });
export const groupsInitialState = groupsAdapter.getInitialState();
export type GroupDataState = EntityState<GroupData, number>;


// Maps
export const mapsAdapter = createEntityAdapter<MapMetadata>({ sortComparer: sortByNameProperty });
export const mapsInitialState = mapsAdapter.getInitialState();
export type MapDataState = EntityState<MapMetadata, number>;

