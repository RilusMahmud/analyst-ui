/* global L */
import React from 'react'
import PropTypes from 'prop-types'
import { Polyline } from 'react-leaflet'

export default class RouteLine extends React.PureComponent {
  static propTypes = {
    positions: PropTypes.array,
    onMouseDown: PropTypes.func
  }

  static defaultProps = {
    positions: [],
    onMouseDown: function () {}
  }

  render () {
    if (!this.props.positions || this.props.positions.length === 0) return null

    return (
      <Polyline
        positions={this.props.positions}
        color="red"
        onMouseDown={this.props.onMouseDown}
        onClick={function (e) { console.log('cancel polyline click'); L.DomEvent.stopPropagation(e) }}
      />
    )
  }
}
