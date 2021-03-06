/* global map, L */
import 'leaflet-shades'
import store from '../store'
import { setBounds } from '../store/actions/view'
import { getBboxArea } from './region'
import { getDateRange } from './dataGeojson'

const PAN_MAP_RATIO = 0.75

// Store for existing bounds.
const bounds = []
let handlersAdded = false
let shades

// Subscribe to changes in state to affect the behavior of Leaflet.Editable.
store.subscribe(() => {
  const state = store.getState()
  // If bounds are cleared from state, remove current bounds.
  if (!state.view.bounds) removeAllExistingBounds()

  // While data is still being rendered, disable interactivity of bounds
  if (state.loading.isLoading && bounds.length) {
    bounds.forEach(function (bound) {
      setBoundToDisabledAppearance(bound)
    })
  } else if (!state.loading.isLoading && bounds.length) {
    // If data is not being loaded, check if bounds is bigger than map container
    // If so, disable interactivity of bounds, else reenable them
    bounds.forEach(function (bound) {
      if (!compareRegionAndMap(bound)) {
        removeDisabledAppearance(bound)
        bound.editor.enable()
      }
    })
  }

  // If select mode has changed, stop any existing drawing interaction.
  if (state.app.analysisMode !== 'REGION' && typeof map !== 'undefined' && map.editTools) {
    map.editTools.stopDrawing()
    if (shades) map.removeLayer(shades)
  }
})

/**
 * Compares selected region's area to map container area
 * Returns true if selected region's area is bigger than map container area by
 * a certain percentage labeled PAN_OUT_VALUE
 *
 * @param {LatLngBounds} bounds - current bounds of selected region
 */
function compareRegionAndMap (bounds) {
  const regionBounds = bounds.getBounds()
  const northEastPoint = map.latLngToContainerPoint(regionBounds.getNorthEast())
  const southWestPoint = map.latLngToContainerPoint(regionBounds.getSouthWest())
  const bbox = {
    north: northEastPoint.x,
    east: northEastPoint.y,
    south: southWestPoint.x,
    west: southWestPoint.y
  }
  const regionArea = getBboxArea(bbox)
  const mapSize = map.getSize()
  const mapArea = mapSize.x * mapSize.y
  const ratio = regionArea / mapArea
  return ratio > PAN_MAP_RATIO
}

/**
 * Removes an existing bounds.
 *
 * @param {Number} index - remove the bounds at this index in the cache.
 *          Defaults to the earliest bounds (at index 0).
 */
function removeExistingBounds (index = 0) {
  if (bounds[index] && bounds[index].remove) {
    // Manual cleanup on Leaflet
    bounds[index].remove()

    // Remove from memory
    bounds.splice(index, 1)
  }
}

function removeAllExistingBounds () {
  while (bounds.length) {
    bounds[0].remove()
    bounds.shift()
  }
}

/**
 * Re-enables the interactivity of a boundary and
 * removes the appearance of a disabled state.
 *
 * @param {LatLngBounds} bound - boundary object to change.
 */
function removeDisabledAppearance (bound) {
  bound.setStyle({
    weight: 3,
    color: '#3388ff',
    fill: 'transparent',
    dashArray: null
  })
  bound._path.classList.remove('map-bounding-box-disabled')
}

/**
 * Sets the appearance and interactivity of a boundary to be in disabled state.
 *
 * @param {LatLngBounds} bound - boundary object to change.
 */
function setBoundToDisabledAppearance (bound) {
  bound.setStyle({
    weight: 1,
    color: '#aaa',
    fill: '#aaa',
    fillOpacity: 0,
    dashArray: [5, 3]
  })
  bound._path.classList.add('map-bounding-box-disabled')
  bound.editor.disable()
}

function storeBounds (bounds) {
  const precision = 6
  const north = bounds.getNorth().toFixed(precision)
  const south = bounds.getSouth().toFixed(precision)
  const east = bounds.getEast().toFixed(precision)
  const west = bounds.getWest().toFixed(precision)

  // Store it.
  store.dispatch(setBounds({ north, south, east, west }))
}

function onDrawingFinished (event) {
  const region = {
    northEast: event.layer.getBounds().getNorthEast(),
    southWest: event.layer.getBounds().getSouthWest()
  }
  getDateRange(region.northEast, region.southWest)
  // The newly created rectangle is stored at `event.layer`
  bounds.push(event.layer)

  // Remove previous bounds after the new one has been drawn.
  if (bounds.length > 1) {
    removeExistingBounds(0)
  }
}

function onDrawingEdited (event) {
  storeBounds(event.layer.getBounds())
  const bounds = {
    northEast: event.layer.getBounds().getNorthEast(),
    southWest: event.layer.getBounds().getSouthWest()
  }
  getDateRange(bounds.northEast, bounds.southWest)
}

function onMapMoved (event) {
  if (!bounds[0]) return
  if (compareRegionAndMap(bounds[0])) {
    setBoundToDisabledAppearance(bounds[0])
  } else {
    removeDisabledAppearance(bounds[0])
    bounds[0].editor.enable()
  }
}

function addEventListeners () {
  map.on('editable:drawing:commit', onDrawingFinished)
  map.on('editable:vertex:dragend', onDrawingEdited)
  map.on('editable:dragend', onDrawingEdited)
  map.on('moveend', onMapMoved)
}

/**
 * Function for drawing new viewport bounds.
 *
 * @param {Object} event - from onClick handler
 * @param {Function} callback - optional. Callback function to call after the
 *          bounds has finished drawing.
 */
export function startDrawingBounds () {
  if (!handlersAdded) {
    addEventListeners()
    handlersAdded = true
  }

  // Remove the handles on existing bounds, but don't remove yet. It remains
  // as a "ghost" so that it can be referenced when new bounds are drawn over it.
  if (bounds.length) {
    bounds.forEach(setBoundToDisabledAppearance)
  }

  map.editTools.startRectangle()
  shades = new L.LeafletShades()
  shades.addTo(map)
}

export function drawBounds ({ west, south, east, north }) {
  const rect = L.rectangle([
    [north, west],
    [south, east]
  ]).addTo(map)
  rect.enableEdit()
  shades = new L.LeafletShades({bounds: rect.getBounds()})
  shades.addTo(map)

  if (!handlersAdded) {
    addEventListeners()
    handlersAdded = true
  }
  bounds.push(rect)
  storeBounds(rect.getBounds())
  compareRegionAndMap(rect)
}
