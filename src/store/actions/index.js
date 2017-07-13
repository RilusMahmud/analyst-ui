// recenters map when location chosen from MapSearchBar
export function recenterMap (coordinates) {
  return {
    type: 'CHANGE_CENTER',
    coordinates
  }
}

// stores lat and lng of new location from MapSearchBar
export function setLocation (latlng, name) {
  return {
    type: 'SET_LOCATION',
    latlng,
    name
  }
}
