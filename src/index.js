import React, { useRef, useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import rockyMountain from "./media/RockyMountain.jpg";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMagnifyingGlass, faChalkboard, faSun, faMoon, faCloud, faSmog, faCloudRain, faSnowflake, faCloudShowersHeavy, 
  faIcicles, faCloudBolt, faClock, faCalendar, faFire, faWind, faDroplet, faTemperatureHalf, faWater, faTornado, faUser, 
  faEye, faGauge, faHurricane} from '@fortawesome/free-solid-svg-icons';
import * as maptilersdk from '@maptiler/sdk';
import * as maptilerweather from '@maptiler/weather';
import "@maptiler/sdk/dist/maptiler-sdk.css";

const currDate = new Date();

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
      hourlyWeather: [],
      dailyWeather: []
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
      if (code <= 2) {
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
    fetch(`https://api.open-meteo.com/v1/gfs?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,rain,showers,snowfall,weather_code,cloud_cover,surface_pressure,wind_speed_10m,wind_direction_10m,wind_gusts_10m&hourly=temperature_2m,relative_humidity_2m,dew_point_2m,apparent_temperature,precipitation_probability,rain,showers,snowfall,weather_code,surface_pressure,cloud_cover,visibility,wind_speed_10m,wind_direction_10m,wind_gusts_10m,uv_index,is_day&daily=weather_code,precipitation_probability_max,temperature_2m_max,temperature_2m_min,sunrise,sunset,&temperature_unit=fahrenheit&wind_speed_unit=mph&precipitation_unit=inch&timezone=auto&minutely_15=rain,snowfall&forecast_days=14`)
      .then(response => response.json())
      .then(data => {
        console.log(data);  //FIXME DELETE
        //Get current weather
        this.setState({
          currentWeather: {
            temperature: Math.round(data.current.temperature_2m),
            weatherCode: data.current.weather_code,
            summary: getDescriptionFromWeatherCode(data.current.weather_code),
            high: Math.round(data.daily.temperature_2m_max[0]),
            low: Math.round(data.daily.temperature_2m_min[0]),
            isDay: data.current.is_day,
            windSpeed: Math.round(data.current.wind_speed_10m),
            windGusts: Math.round(data.current.wind_gusts_10m),
            windDirection: data.current.wind_direction_10m
          }
        })
        //Get hourly weather for 48 hours

        let hourlyWeather = []
        for (let i = currDate.getHours(); i < currDate.getHours() + 24; i++) {
          let hours = Number(data.hourly.time[i].slice(11, 13));
          let timeString = "";
          if (hours < 12) {
            if (hours === 0) {
              timeString = "12 AM";
            } else {
              timeString = hours + " AM";
            } 
          } else {
            if (hours === 12) {
              timeString = "12 PM";
            } else {
              timeString = hours - 12 + " PM";
            }
          }
          hourlyWeather.push({
            month: data.hourly.time[i].slice(5, 7),
            day: data.hourly.time[i].slice(8, 10),
            time: data.hourly.time[i].slice(11),
            timeString: timeString,
            temperature: Math.round(data.hourly.temperature_2m[i]),
            weatherCode: data.hourly.weather_code[i],
            precipitationProbability: data.hourly.precipitation_probability[i],
            isDay: data.hourly.is_day[i]
          })
        }
        this.setState({
          hourlyWeather: hourlyWeather
        })
        //Get daily weather for a week
        let dailyWeather = []
        for (let i = 0; i < 10; i++) {
          let date = new Date(data.daily.time[i]);
          let day = ""
          switch (date.getDay()) {
            case 0:
              day = "Mon";
              break;
            case 1:
              day = "Tue";
              break;
            case 2:
              day = "Wed";
              break;
            case 3:
              day = "Thu";
              break;
            case 4:
              day = "Fri";
              break;
            case 5:
              day = "Sat";
              break;
            case 6: 
              day = "Sun";
              break;
            default:
              day = "";
          }
          dailyWeather.push({
            day: day,
            date: data.daily.time[i],
            maxTemperature: Math.round(data.daily.temperature_2m_max[i]),
            minTemperature: Math.round(data.daily.temperature_2m_min[i]),
            weatherCode: data.daily.weather_code[i],
            precipitationProbability: data.daily.precipitation_probability_max[i]
          })
        }
        this.setState({
          dailyWeather: dailyWeather
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

    //Get air quality data from OpenMeteo Air Quality API
    fetch (`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${latitude}&longitude=${longitude}&current=us_aqi&hourly=pm10,pm2_5,us_aqi`)
      .then((response) => response.json()) 
      .then((data) => {
        this.setState({
          airQuality: data.current.us_aqi
        })
      })
  }

  mainPage() {
    const LocationsList = () => {
      return (<div id='locations-list'></div>);
    }

    const BackgroundImage = () => {
      return (<div id='background-image-container'><img id='background-image' src={rockyMountain} alt=''/></div>)
    }

    const SmallRadar = () => {
      const Map = () => {
        const mapContainer = useRef(null);
        const map = useRef(null);
        const [zoom] = useState(3);
        let location = {longitude: this.state.longitude, latitude: this.state.latitude};
        maptilersdk.config.apiKey = process.env.REACT_APP_MAP_API_KEY;
        useEffect(() => {
          setTimeout(2000);
          if (map.current) return; // stops map from intializing more than once
        
          map.current = new maptilersdk.Map({
            container: mapContainer.current,
            style: maptilersdk.MapStyle.WINTER,
            center: [location.longitude, location.latitude],
            zoom: zoom,
            navigationControl: false
          });

          map.current.on('load', () => {
            new maptilersdk.Marker({color: "#29a7ba"})
            .setLngLat([location.longitude, location.latitude])
            .addTo(map.current);

            const weatherLayer = new maptilerweather.RadarLayer({
              opacity: 0.8,
            });
            map.current.addLayer(weatherLayer, 'Water');
          })

          
        
        }, [location.longitude, location.latitude, zoom]);

        return (
          <div className="map-wrap">
            <div ref={mapContainer} className="map" />
          </div>
        );
      }
      return (
      <div id='small-radar-viewer' className='weather-details-box'>
        <h1><FontAwesomeIcon icon = {faHurricane} /> RADAR</h1>
        <div className='divider'></div>
        <Map />
      </div>
      )}

      const AirQuality = () => {
        const getAirQualityRating = (airQuality) => {
          if (airQuality <= 50) {
            return ("Good");
          } else if (airQuality <= 100) {
            return ("Moderate");
          } else if (airQuality <= 150) {
            return ("Unhealthy for Sensitive Groups");
          } else if (airQuality <= 200) {
            return("Unhealthy");
          } else if (airQuality <= 300) {
            return("Very Unhealthy");
          } else {
            return ("Hazardous");
          }
        }
        return(<div id='air-quality-chart'>
          <div id='air-quality-index'>{this.state.airQuality}</div>
          <div id='air-quality-rating'>{getAirQualityRating(this.state.airQuality)}</div>
          <div id='air-quality-scale'><div id='air-quality-marker' style={{left: (0.6 * this.state.airQuality - 4 + "px")}}></div></div>
        </div>)
      }

    const GetWeatherIcon = (code, isDay) => {
      if (code <= 2) {  // Clear
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

    const GetSunriseOrSunset = () => {
      if (this.state.currentWeather.isDay === 1) {
        return "SUNSET";
      } else {
        return "SUNRISE";
      }
    }

    const getDirection = ( angle ) => {
      let directions = ["N","NNE","NE","ENE","E",
        "ESE", "SE", "SSE","S",
        "SSW","SW","WSW","W",
        "WNW","NW","NNW" ];
      let section = parseInt( angle/22.5 + 0.5 );
      section = section % 16;
      return directions[ section ];
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
          <div id='hourly-forecast' className='weather-details-box'>
            <h1 className='weather-details-heading'><FontAwesomeIcon icon={faClock} /> HOURLY</h1>
            <div className='divider'></div>
            <div id='hourly-forecast-container'>
              {this.state.hourlyWeather.map((item) => {
                return(<div className='hourly-weather-container' key={item.day + " " + item.time}>
                  <div className='hourly-time'>{item.timeString}</div>
                  <div className='hourly-icon'>{GetWeatherIcon(item.weatherCode, item.isDay)}</div>
                  <div className='hourly-temperature'>{item.temperature}°</div>
                </div>)
              })}
            </div>
          </div>
          <div id='ten-day-forecast' className='weather-details-box'>
            <h1><FontAwesomeIcon icon={faCalendar}/> 10-DAY FORECAST</h1>
            <div id='ten-day-forecast-container'>
              {this.state.dailyWeather.map((item) => {
                let width = item.maxTemperature - item.minTemperature;
                let offset = item.minTemperature;
                if (offset < 0) {
                  offset = 0;
                } else if (offset + width > 100) {
                  offset = 100 - width;
                }
                return(
                <div className='daily-weather-container' key={item.date}> 
                  <div className='daily-day'>{item.day}</div>
                  <div className='daily-icon'>{GetWeatherIcon(item.weatherCode, true)}</div>
                  <div className='daily-low'>{item.minTemperature}°</div>
                  <div className='daily-temp-chart'><div className='daily-temp-marker' style={{width:  (width + "px"), left: (offset + "px")}}></div></div>
                  <div className='daily-high'>{item.maxTemperature}°</div>
                </div>
                )
              })}
            </div>
          </div>
          <div id='air-quality' className='weather-details-box'>
            <h1><FontAwesomeIcon icon={faFire} /> AIR QUALITY</h1>
            <div className='divider'></div>
            <AirQuality/>
          </div>
          <div id='wind' className='weather-details-box'>
            <h1><FontAwesomeIcon icon={faWind} /> WIND</h1>
            <div className='divider'></div>
            <div id='wind-container'>
              <div id='wind-speed'>
                <div id='wind-speed-sustained' className='wind-info-container'>
                  <div className='wind-value'>{this.state.currentWeather.windSpeed}</div>
                  <div className='wind-units'>
                    <div className='wind-unit'>MPH</div>
                    <div className='wind-type'>WIND</div>
                  </div>
                </div>
                <div className='divider'></div>
                <div id='wind-speed-gusts' className='wind-info-container'>
                  <div className='wind-value'>{this.state.currentWeather.windGusts}</div>
                  <div className='wind-units'>
                    <div className='wind-unit'>MPH</div>
                    <div className='wind-type'>GUSTS</div>
                  </div>
                </div>
              </div>
              <div id='wind-direction'>
                  <div id='wind-direction-cardinal'>{getDirection(this.state.currentWeather.windDirection)}</div>
                  <div id='wind-direction-degrees'>{this.state.currentWeather.windDirection}°</div>
                </div>
            </div>
          </div>
          <div id='sunrise-sunset' className='weather-details-box'>
            <h1><FontAwesomeIcon icon={faSun} /> {GetSunriseOrSunset()}</h1>
            <div className='divider'></div>
          </div>
          <div id='precipitation' className='weather-details-box'>
            <h1><FontAwesomeIcon icon={faDroplet} /> PRECIPITATION</h1>
            <div className='divider'></div>
          </div>
          <div id='apparent-temperature' className='weather-details-box'>
            <h1><FontAwesomeIcon icon={faTemperatureHalf} /> FEELS LIKE</h1>
            <div className='divider'></div>
          </div>
          <div id='humidity' className='weather-details-box'>
              <h1><FontAwesomeIcon icon={faWater} /> HUMIDITY</h1>
              <div className='divider'></div>
          </div>
          <div id='severe-weather' className='weather-details-box'>
            <h1><FontAwesomeIcon icon={faTornado} /> SEVERE WEATHER</h1>
            <div className='divider'></div>
          </div>
          <div id='forecast-discussion' className='weather-details-box'>
            <h1><FontAwesomeIcon icon={faUser} /> FORECAST DISCUSSION</h1>
            <div className='divider'></div>
          </div>
          <div id='visibility' className='weather-details-box'>
              <h1><FontAwesomeIcon icon={faEye} /> VISIBILITY</h1>
              <div className='divider'></div>
          </div>
          <div id='pressure' className='weather-details-box'>
              <h1><FontAwesomeIcon icon={faGauge} /> PRESSURE</h1>
              <div className='divider'></div>
          </div>
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