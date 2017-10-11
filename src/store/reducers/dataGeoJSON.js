import { SET_DATA_GEOJSON } from '../actions'

const initialState = {
  dataGeoJSON: null
}

const dataAvailability = (state = initialState, action) => {
  switch (action.type) {
    case SET_DATA_GEOJSON:
      return {
        ...state,
        dataGeoJSON: action.geo
      }
    default:
      return state
  }
}

export default dataAvailability
