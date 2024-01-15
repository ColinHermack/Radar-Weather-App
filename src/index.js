import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import rockyMountain from "./media/RockyMountain.jpg";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons';


class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      latitude: undefined,
      longitude: undefined,
      appleWeatherData: undefined
    };
    this.getLocationPage = this.getLocationPage.bind(this);
  }

  componentDidMount() {
    //Try to get the user's coordinate location
    if (navigator.geolocation){
      navigator.geolocation.getCurrentPosition((position) => {
        this.setState({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        })
      });
    }
  }

  //Get the user's ZIP code if browser blocks coordinate geolocation
  getLocationPage() {
    const getCoordinatesByZip = () => {
      let zip = document.getElementById('enter-zip').value;
      
      const request = new XMLHttpRequest("");
      request.open("GET",`https://www.zipcodeapi.com/rest/${process.env.REACT_APP_ZIP_API_KEY}/info.json/${zip}/degrees`,true);
      request.send();
      request.onload = () => {
        const json = JSON.parse(request.responseText);
        this.setState({
          latitude: json.lat,
          longitude: json.lng
        })
      };
    }

    return (<div id='location-container'>
      <img src={rockyMountain} alt='' id='background-image'></img>
      <div id='background-cover'></div>
      <div id='location-input-box'>
        <p>Enable location access for the most precise weather data.</p>
        <p>Or, look up your location by ZIP code.</p>
        <input id='enter-zip' />
        <button id='submit-zip' onClick={getCoordinatesByZip}><FontAwesomeIcon icon={faMagnifyingGlass}></FontAwesomeIcon></button>
      </div>
    </div>)
  }

  mainPage() {
    const request = new XMLHttpRequest();
    request.open("GET", `https://api.open-meteo.com/v1/gfs?latitude=${this.state.latitude}&longitude=${this.state.longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,rain,showers,snowfall,weather_code,cloud_cover,surface_pressure,wind_speed_10m,wind_direction_10m,wind_gusts_10m&hourly=temperature_2m,relative_humidity_2m,dew_point_2m,apparent_temperature,precipitation_probability,rain,showers,snowfall,weather_code,surface_pressure,cloud_cover,visibility,wind_speed_10m,wind_direction_10m,wind_gusts_10m,uv_index,is_day&daily=weather_code,temperature_2m_max,temperature_2m_min&temperature_unit=fahrenheit&wind_speed_unit=mph&precipitation_unit=inch&timezone=auto`, true);
    request.onload = () => {
      console.log(JSON.parse(request.responseText));
    }
    request.send();

  }

  render() {
    if (this.state.latitude === undefined || this.state.longitude === undefined) {
      return (this.getLocationPage());
    } else {
      return (this.mainPage());
    }
  }
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
