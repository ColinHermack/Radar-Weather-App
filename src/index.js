import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import rockyMountain from "./media/RockyMountain.jpg";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMagnifyingGlass, faChalkboard, faSun, faMoon, faCloud, faSmog, faCloudRain, faSnowflake, faCloudShowersHeavy, faIcicles, faCloudBolt } from '@fortawesome/free-solid-svg-icons';


class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      latitude: undefined,
      longitude: undefined,
      city: "",
      state: "",
      currentWeather: {
        temperature: "--",
        summary: "--",
        high: "--",
        low: "--",
        weatherCode: undefined
      },
      hourlyWeather: []
    };
    this.getLocationPage = this.getLocationPage.bind(this);
    this.populateData = this.populateData.bind(this);
  }

  componentDidMount() {
    //Try to get the user's coordinate location
    if (navigator.geolocation){
      navigator.geolocation.getCurrentPosition((position) => {
        this.populateData(position.coords.latitude, position.coords.longitude);
      });
    }
  }

  //Get the user's ZIP code if browser blocks coordinate geolocation
  getLocationPage() {
    const getCoordinatesByZip = () => {
      fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${document.getElementById('enter-zip').value}&count=10&language=en&format=json`)
        .then(response => response.json())
        .then((data) => {
          this.populateData(data.results[0].latitude, data.results[0].longitude);
        })
        .catch((error) => {console.log(error)})
      }

    return (<div id='location-container'>
      <div id='background-image-container'><img src={rockyMountain} alt='' id='background-image'></img></div>
      <div id='location-input-box'>
        <p>Enable location access for the most precise weather data.</p>
        <p>Or, look up your location by ZIP code.</p>
        <input id='enter-zip' />
        <button id='submit-zip' onClick={getCoordinatesByZip}><FontAwesomeIcon icon={faMagnifyingGlass}></FontAwesomeIcon></button>
      </div>
    </div>)
  }

  populateData(latitude = undefined, longitude = undefined) {
    const getDescriptionFromWeatherCode = (code) => {
      if (code < 2) {
        return ("Clear");
      } else if (code === 3) {
        return ("Cloudy");
      } else if (code >= 4 && code <= 6) {
        return ("Haze");
      } else if ((code >= 7 && code <= 9) || (code >= 30 && code <= 35)) {
        return ("Dust Storm");
      } else if (code === 10) {
        return ("Mist");
      } else if (code === 11 || code === 12) {
        return ("Fog");
      } else if (code === 20 || (code >= 50 && code <= 59)) {
        return ("Drizzle");
      } else if (code === 21) {
        return ("Light Rain");
      } else if (code === 22 || code === 23) {
        return ("Light Snow");
      } else if (code === 24) {
        return ("Freezing Rain");
      } else if (code === 25 || (code >= 60 && code <= 69)) {
        return ("Rain");
      } else if (code === 26 || (code >= 70 && code <= 78)) {
        return ("Snow");
      } else if (code === 27 || code === 79) {
        return ("Hail");
      } else if (code === 28) {
        return ("Fog");
      } else if (code === 29) {
        return ("Thunderstorm")
      } else if (code >= 36 || code <= 39) {
        return ("Blizzard");
      } else if (code >= 40 && code <= 49){
        return ("Fog");
      }
    } 
    if (latitude !== undefined && longitude !== undefined) {
      this.setState({latitude: latitude, longitude: longitude});
    } else {
      latitude = this.state.latitude;
      longitude = this.state.longitude;
    }
    //Get weather data from the OpenMeteo API
    fetch(`https://api.open-meteo.com/v1/gfs?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,rain,showers,snowfall,weather_code,cloud_cover,surface_pressure,wind_speed_10m,wind_direction_10m,wind_gusts_10m&hourly=temperature_2m,relative_humidity_2m,dew_point_2m,apparent_temperature,precipitation_probability,rain,showers,snowfall,weather_code,surface_pressure,cloud_cover,visibility,wind_speed_10m,wind_direction_10m,wind_gusts_10m,uv_index,is_day&daily=weather_code,temperature_2m_max,temperature_2m_min&temperature_unit=fahrenheit&wind_speed_unit=mph&precipitation_unit=inch&timezone=auto&minutely_15=rain,snowfall`)
      .then(response => response.json())
      .then(data => {
        console.log(data);
        this.setState({
          currentWeather: {
            temperature: Math.round(data.current.temperature_2m),
            weatherCode: data.current.weather_code,
            summary: getDescriptionFromWeatherCode(data.current.weather_code),
            high: Math.round(data.daily.temperature_2m_max[0]),
            low: Math.round(data.daily.temperature_2m_min[0])
          }
        })
        let hourlyWeather = []
        for (let i = 0; i < 48; i++) {
          hourlyWeather.push({
            month: data.hourly.time[i].slice(5, 7),
            day: data.hourly.time[i].slice(8, 10),
            time: data.hourly.time[i].slice(11),
            temperature: Math.round(data.hourly.temperature_2m[i]),
            weatherCode: data.hourly.weather_code[i],
            precipitationProbability: data.hourly.precipitation_probability[i],
            isDay: data.hourly.is_day[i]
          })
        }
        this.setState({
          hourlyWeather: hourlyWeather
        })
      })
      .catch((error) => {console.log(error)})

    //Get location data and forecast descriptions from the National Weather Service API
    fetch(`https://api.weather.gov/points/${latitude},${longitude}`)
      .then(response => response.json())
      .then(data => {
        this.setState({
          city: data.properties.relativeLocation.properties.city,
          state: data.properties.relativeLocation.properties.state
        })
        //Get the forecast discussion and parse the HTML to extract the actual text of the forecast discussion
        fetch(`https://forecast.weather.gov/product.php?site=${data.properties.cwa}&issuedby=${data.properties.cwa}&product=AFD&format=ci&version=1&glossary=1`)
          .then((response) => response.text())
          .then((data) => {
            this.setState({
              forecastDiscussion: data
            })
          })
          .catch((error) => {console.log(error)})
        //Get the NWS forecast
        fetch(data.properties.forecast)
          .then((response) => response.json())
          .then((data) => {
            this.setState({
              forecastDescription: data.properties.periods[0].detailedForecast
            })
          })
          .catch((error) => {
            this.setState({forecastDescription: "Not available"})
          })
      })
      .catch((error) => {console.log(error)})

  }

  mainPage() {
    const LocationsList = () => {
      return (<div id='locations-list'></div>);
    }

    const BackgroundImage = () => {
      return (<div id='background-image-container'><img id='background-image' src={rockyMountain} alt=''/></div>)
    }

    const SmallRadar = () => {
      return (<div id='small-radar-viewer' className='weather-details-box'></div>)
    }

    const GetWeatherIcon = (code, isDay) => {
      if (code < 2) {  // Clear
        if (isDay) {
          return <FontAwesomeIcon icon={faSun} />
        } else {
          return <FontAwesomeIcon icon={faMoon} />
        }
      } else if (code === 3) {  // Cloudy
        return <FontAwesomeIcon icon={faCloud} />
      } else if (code >= 4 && code <= 6) {  // Haze
        return <FontAwesomeIcon icon={faSmog} />
      } else if ((code >= 7 && code <= 9) || (code >= 30 && code <= 35)) {  // Dust storm
        return <FontAwesomeIcon icon={faSmog} />
      } else if (code === 10) {  // Mist
        return <FontAwesomeIcon icon={faCloudRain} />
      } else if (code === 11 || code === 12) {  // Fog
        return <FontAwesomeIcon icon={faSmog} />
      } else if (code === 20 || (code >= 50 && code <= 59)) {  // Drizzle
        return <FontAwesomeIcon icon={faCloudRain} />
      } else if (code === 21) { // Light rain
        return <FontAwesomeIcon icon={faCloudRain} />
      } else if (code === 22 || code === 23) {  //Light snow
        return <FontAwesomeIcon icon={faSnowflake} />
      } else if (code === 24) {  //Freezing Rain
        return <FontAwesomeIcon icon={faCloudRain} />
      } else if (code === 25 || (code >= 60 && code <= 69)) {  //Rain
        return <FontAwesomeIcon icon={faCloudShowersHeavy} />
      } else if (code === 26 || (code >= 70 && code <= 78)) {  //Snow
        return <FontAwesomeIcon icon={faSnowflake} />
      } else if (code === 27 || code === 79) {  //Hail
        return <FontAwesomeIcon icon={faIcicles} />
      } else if (code === 28) {  //Fog
        return <FontAwesomeIcon icon={faSmog} />
      } else if (code === 29) {
        return <FontAwesomeIcon icon={faCloudBolt} />
      } else if (code >= 36 || code <= 39) {  //Bizzard
        return <FontAwesomeIcon icon={faSnowflake} />
      } else if (code >= 40 && code <= 49){
        return <FontAwesomeIcon icon={faSmog} />
      }
    }

    return (
    <div id='container'>
      {BackgroundImage()}
      {LocationsList()}
      <div id='current-location-container'>
        <div id='weather-header'>
          <div id='city'>{this.state.city}</div>
          <div id='current-temperature'>{this.state.currentWeather.temperature}°</div>
          <div id='current-conditions'>{this.state.currentWeather.summary}</div>
          <div id='high-low'>H:{this.state.currentWeather.high}° L:{this.state.currentWeather.low}°</div>
        </div>
        <div id='weather-details-container'>
          <div id='forecast-description' className='weather-details-box'>
            <h1 className='weather-details-heading'><FontAwesomeIcon icon={faChalkboard}/> SUMMARY</h1>
            <div className='divider'></div>
            <p>{this.state.forecastDescription}</p>
          </div>
          <div id='hourly-forecast' className='weather-details-box'>{
            this.state.hourlyWeather.map((item) => {
              let date = new Date();
              // eslint-disable-next-line
              if (date.getDate() == item.day && date.getHours() == item.time.slice(0, 2)) {
                return(<div className='hourly-weather-container' key={item.day + " " + item.time} style={{backgroundColor: "rgba(120, 120, 120, 0.5)"}}>
                <div className='hourly-time'>{item.time}</div>
                <div className='hourly-icon'>{GetWeatherIcon(item.weatherCode, item.isDay)}</div>
                <div className='hourly-temperature'>{item.temperature}°</div>
              </div>)
              }
              return(<div className='hourly-weather-container' key={item.day + " " + item.time}>
                <div className='hourly-time'>{item.time}</div>
                <div className='hourly-icon'>{GetWeatherIcon(item.weatherCode, item.isDay)}</div>
                <div className='hourly-temperature'>{item.temperature}°</div>
              </div>)
            })
          }</div>
          <div id='seven-day-forecast' className='weather-details-box'></div>
          <div id='air-quality' className='weather-details-box'></div>
          <div id='wind' className='weather-details-box'></div>
          <div id='sunrise-sunset' className='weather-details-box'></div>
          <div id='precipitation' className='weather-details-box'></div>
          <div id='apparent-temperature' className='weather-details-box'></div>
          <div id='humidity' className='weather-details-box'></div>
          <div id='severe-weather' className='weather-details-box'></div>
          <div id='forecast-discussion' className='weather-details-box'></div>
          <div id='visibility' className='weather-details-box'></div>
          <div id='pressure' className='weather-details-box'></div>
          <SmallRadar/>
        </div>
      </div>
    </div>)

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