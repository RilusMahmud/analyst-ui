import React, { Component } from 'react'
import { Provider } from 'react-redux'

import MapContainer from './MapContainer'
import Sidebar from './Sidebar'
import DevTools from './DevTools'
import store from '../store'
import config from '../config'

import 'semantic-ui-css/semantic.min.css'
import './App.css'

class App extends Component {
  render() {
    return (
      <Provider store={store}>
        <div className="App">
          <MapContainer />
          <Sidebar className="sidebar-container" />
          <DevTools />
        </div>
      </Provider>
    )
  }
}

export default App
