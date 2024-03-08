import { createSelector } from '@reduxjs/toolkit';
import * as moment from 'moment';
import { Layout } from 'plotly.js';
import { selectMapById } from '../../redux/api/mapsApi';
import { selectMapBarWidthDays, selectSelectedMap } from '../../redux/slices/graphSlice';
import { RootState } from '../../store';
import { BarReadings } from '../../types/readings';
import { MeterOrGroup } from '../../types/redux/graph';
import { MapMetadata } from '../../types/redux/map';
import {
	CartesianPoint,
	Dimensions,
	calculateScaleFromEndpoints,
	gpsToUserGrid,
	normalizeImageDimensions
} from '../../utils/calibration';
import getGraphColor from '../../utils/getGraphColor';
import { selectPlotlyBarDeps } from './barChartSelectors';
import { selectNameFromEntity } from './entitySelectors';
import { selectPlotlyMeterDeps } from './plotlyDataSelectors';
import { createAppSelector } from './selectors';

type PlotlyMapDeps = ReturnType<typeof selectPlotlyMeterDeps> & {
	barDuration: moment.Duration,
	mapData: MapMetadata
}

// export const selectMapMetaData = (state: RootState) =>
// 	selectMapById(state, selectSelectedMap(state));

// Will use the id if provided, otherwise will return the selected map from graphslice.
export const selectMapMetaData = (state: RootState, id: number | undefined = undefined): MapMetadata | undefined =>
	id ? selectMapById(state, id) : selectMapById(state, selectSelectedMap(state));

export const selectPlotlyMapDeps = createAppSelector(
	[
		selectPlotlyBarDeps,
		selectMapBarWidthDays,
		selectMapMetaData
	],
	({ barMeterDeps, barGroupDeps }, barDuration, mapData) => {
		const meterDeps = { ...barMeterDeps, barDuration, mapData };
		const groupDeps = { ...barGroupDeps, barDuration, mapData };
		return { meterDeps, groupDeps };
	}
);

export const selectMapImage = createAppSelector(
	[
		(state, id: number | undefined = undefined) => selectMapMetaData(state, id)
	],
	mapData => {
		if (mapData?.mapSource) {
			const img = new Image();
			img.src = mapData.mapSource;
			return img;
		} else {
			return undefined;
		}
	}
);
export const selectMapLayout = createAppSelector(
	[
		selectMapMetaData
	],
	mapData => ({
		// Either the actual map name or text to say it is not available.
		title: {
			text: mapData?.name ?? 'There\'s not an available map'
		},
		width: 1000,
		height: 1000,
		xaxis: {
			visible: false, // changes all visibility settings including showgrid, zeroline, showticklabels and hiding ticks
			range: [0, 500] // range of displayed graph
		},
		yaxis: {
			visible: false,
			range: [0, 500],
			scaleanchor: 'x'
		},
		images: [{
			layer: 'below',
			source: mapData?.mapSource ?? '',
			xref: 'x',
			yref: 'y',
			x: 0,
			y: 0,
			sizex: 500,
			sizey: 500,
			xanchor: 'left',
			yanchor: 'bottom',
			sizing: 'contain',
			opacity: 1
		}]
	} as Partial<Layout>)
);



// Selector that derives meter data for the bar graphic
export const selectPlotlyMapDataFromResult = createSelector.withTypes<BarReadings>()(
	[
		// Query data
		// Data derivation dependencies. Use ReturnType inference to get type from dependency selector.
		data => data,
		(_data, dependencies: PlotlyMapDeps) => dependencies
	],
	(data, deps) => {
		const {
			areaNormalization, compatibleEntities,
			mapData, meterDataById,
			groupDataById, meterOrGroup,
			barDuration, barUnitLabel
		} = deps;
		const plotlyData: Partial<Plotly.PlotData>[] = Object.entries(data)
			// filter entries for requested groups
			.filter(([id]) => compatibleEntities.includes((Number(id))))
			.map(([id, readings]) => {
				const entityId = Number(id);
				const entity = meterOrGroup === MeterOrGroup.meters ? meterDataById[entityId] : groupDataById[entityId];
				const label = selectNameFromEntity(entity);
				// Holds the hover text for each point for Plotly
				const hoverText: string[] = [];
				// Holds the size of each circle for Plotly.
				const size: number[] = [];
				// Holds the color of each circle for Plotly.
				const colors: string[] = [];
				// If there is no map then use a new, empty image as the map. I believe this avoids errors
				// and gives the blank screen.
				// Arrays to hold the Plotly grid location (x, y) for circles to place on map.
				const x: number[] = [];
				const y: number[] = [];
				// The size of the original map loaded into OED.
				const imageDimensions: Dimensions = {
					width: mapData.imgWidth,
					height: mapData.imgHeight
				};
				// Determine the dimensions so within the Plotly coordinates on the user map.
				const imageDimensionNormalized = normalizeImageDimensions(imageDimensions);
				// This is the origin & opposite from the calibration. It is the lower, left
				// and upper, right corners of the user map.
				const origin = mapData.origin;
				const opposite = mapData.opposite;
				// Get the GPS degrees per unit of Plotly grid for x and y. By knowing the two corners
				// (or really any two distinct points) you can calculate this by the change in GPS over the
				// change in x or y which is the map's width & height in this case.
				const scaleOfMap = calculateScaleFromEndpoints(origin!, opposite!, imageDimensionNormalized, mapData.northAngle);

				readings.forEach(reading => {
					// Get meter id number.
					// Get meter GPS value.
					const gps = entity.gps;
					// filter meters with actual gps coordinates.
					if (gps) {
						// Convert the gps value to the equivalent Plotly grid coordinates on user map.
						// First, convert from GPS to grid units. Since we are doing a GPS calculation, this happens on the true north map.
						// It must be on true north map since only there are the GPS axis parallel to the map axis.
						// To start, calculate the user grid coordinates (Plotly) from the GPS value. This involves calculating
						// it coordinates on the true north map and then rotating/shifting to the user map.
						const meterGPSInUserGrid: CartesianPoint = gpsToUserGrid(imageDimensionNormalized, gps, origin!, scaleOfMap, mapData.northAngle);
						// Only display items within valid info and within map.
						// The x, y value for Plotly to use that are on the user map.
						x.push(meterGPSInUserGrid.x);
						y.push(meterGPSInUserGrid.y);
						// Make sure the bar reading data is available. The timeInterval should be fine (but checked) but the barDuration might have changed
						// and be fetching. The unit could change from that menu so also need to check.
						// Get the bar data to use for the map circle.
						// const readingsData = meterReadings[timeInterval.toString()][barDuration.toISOString()][unitID];
						// This protects against there being no readings or that the data is being updated.
						if (reading !== undefined) {
							// Meter name to include in hover on graph.
							// The usual color for this meter.
							colors.push(getGraphColor(entityId, meterOrGroup));
							// Use the most recent time reading for the circle on the map.
							// This has the limitations of the bar value where the last one can include ranges without
							// data (GitHub issue on this).
							// TODO: It might be better to do this similarly to compare. (See GitHub issue)
							// const readings = orderBy(reading, ['startTimestamp'], ['desc']);
							let timeReading: string;
							let averagedReading = 0;
							if (readings.length === 0) {
								// No data. The next lines causes an issue so set specially.
								// There may be a better overall fix for no data.
								timeReading = 'no data to display';
								size.push(0);
							} else {
								// only display a range of dates for the hover text if there is more than one day in the range
								// Shift to UTC since want database time not local/browser time which is what moment does.
								timeReading = `${moment.utc(reading.startTimestamp).format('ll')}`;
								if (barDuration.asDays() != 1) {
									// subtracting one extra day caused by day ending at midnight of the next day.
									// Going from DB unit timestamp that is UTC so force UTC with moment, as usual.
									timeReading += ` - ${moment.utc(reading.endTimestamp).subtract(1, 'days').format('ll')}`;
								}
								// The value for the circle is the average daily usage.
								averagedReading = reading.reading / barDuration.asDays();
								if (areaNormalization) {
									averagedReading /= entity.area;
								}
								// The size is the reading value. It will be scaled later.
								size.push(averagedReading);
							}
							// The hover text.
							hoverText.push(`<b> ${timeReading} </b> <br> ${label}: ${averagedReading.toPrecision(6)} ${barUnitLabel}`);
						}
					}
				});

				// TODO Using the following seems to have no impact on the code. It has been noticed that this function is called
				// many times for each change. Someone should look at why that is happening and why some have no items in the arrays.
				// if (size.length > 0) {
				// TODO The max circle diameter should come from admin/DB.
				const maxFeatureFraction = mapData.circleSize;
				// Find the smaller of width and height. This is used since it means the circle size will be
				// scaled to that dimension and smaller relative to the other coordinate.
				const minDimension = Math.min(imageDimensionNormalized.width, imageDimensionNormalized.height);
				// The circle size is set to area below. Thus, we need to convert from wanting a max
				// diameter of minDimension * maxFeatureFraction to an area.
				const maxCircleSize = Math.PI * Math.pow(minDimension * maxFeatureFraction / 2, 2);
				// Find the largest circle which is usage.
				const largestCircleSize = Math.max(...size);
				// Scale largest circle to the max size and others will be scaled to be smaller.
				// Not that < 1 => a larger circle.
				const scaling = largestCircleSize / maxCircleSize;

				return {
					x,
					y,
					type: 'scatter',
					mode: 'markers',
					marker: {
						color: colors,
						opacity: 0.5,
						size,
						sizemin: 6,
						sizeref: scaling,
						sizemode: 'area'
					},
					text: hoverText,
					hoverinfo: 'text',
					opacity: 1,
					showlegend: false
				};
			});
		return plotlyData;
	}
);
