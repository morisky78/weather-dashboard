var schFormEl = document.querySelector('#sch-form');
var schInputEl = document.querySelector('#sch-city');
var currentBoxEl = document.querySelector('#current-box');
var rsltCityEl = document.querySelector('#rslt-city');
var rsltIconEl = document.querySelector('#rslt-icon');
var rsltCurDateEl = document.querySelector('#rslt-curdate');
var rsltCurDetailEl = document.querySelector('#rslt-cur-detail');
var forecastBoxEl = document.querySelector('#forecast-box');
var timeSelectEl = document.querySelector('#time-select');
var cityListUl = document.querySelector('#city-list');
var schHistoryUl = document.querySelector('#sch-history');
var errMsgEl = document.querySelector('#error-msg');

// The variables to search for
var cityName;
var geoCode;

var weatherApiKey = '0f82ed7b5ab49854cbcad819084922f8';
var localStorageKey = 'weatherSchHistory';

var formSubmitHandler = function(event){
    event.preventDefault();

    cityName = schInputEl.value.trim();

    if ( !cityName ) {
        errMsgEl.textContent = 'Please enter a city.';
        currentBoxEl.setAttribute('style','display:none');
        forecastBoxEl.parentElement.setAttribute('style','display:none');
        return;
    }

    // TODO: get Geocoding API
    var apiURL = "http://api.openweathermap.org/geo/1.0/direct?q="+cityName+"&limit=5&appid="+weatherApiKey;
    console.log("**** formsubmitted!!");
    console.log(apiURL);
   


    fetch(apiURL).then(function(response){
        if (response.ok) {
            response.json().then(function (data) {
                console.log("getGEO code: ");
                console.log(data);
                
                removeAllChildNodes(cityListUl);

                 
                if ( data.length === 0 ){
                    errMsgEl.textContent = "Couldn't find the city. Please try again";
                    currentBoxEl.setAttribute('style','display:none');
                    forecastBoxEl.parentElement.setAttribute('style','display:none');
                    return;
                    
                } else if (data.length === 1 ) {
                    // when there is only 1 result from the city search, show the info right away
                    cityName = data[0].name;                       
                    geoCode = {
                        lat : data[0].lat,
                        lon : data[0].lon
                    }
                    
                    getWeatherInfo();

                } else {
                    for (let i = 0; i < data.length; i++) {  

                        var cityDetail = data[i].name;
                        if (data[i].state)  cityDetail += ', '+data[i].state;
                        cityDetail += ', '+data[i].country;    

                        var cityLi = document.createElement('li')
                        cityLi.textContent = cityDetail;
                        
                        cityLi.setAttribute('data-name', data[i].name);
                        cityLi.setAttribute('data-lat', data[i].lat);
                        cityLi.setAttribute('data-lon', data[i].lon);
                        
                        cityLi.addEventListener('click', function(event){

                            cityName = event.target.getAttribute('data-name');                        
                            geoCode = {
                                lat : event.target.getAttribute('data-lat'),
                                lon : event.target.getAttribute('data-lon')
                            }
                            getWeatherInfo();
                        } )
                        
                        cityListUl.append(cityLi);

                    } 
                }



            });
        }
    }).catch( function(error) {
        alert('Unable to connect to OpenWeatherMap.org')
    })


}


function removeAllChildNodes(parent) {
    while (parent.firstChild) {
        parent.removeChild(parent.firstChild);
    }
}

var saveDataToStorage = function(){
    var oldRecordStr = localStorage.getItem(localStorageKey)
    var schArr = [];
    if (oldRecordStr) {
        schArr = JSON.parse(oldRecordStr) ;
    }
    
    var oneSchSet = {
        city: cityName,
        lat: geoCode['lat'],
        lon: geoCode['lon']
    }
    
    // if the new set is already in the history, do not save the data in the local sotrage
    for (let i = 0; i < schArr.length; i++) {
        var obj = schArr[i];
        if ( obj.city == oneSchSet.city && obj.lat == oneSchSet.lat && obj.lon == oneSchSet.lon ) {
            console.log("Already in history storage");
            return;
        }
    }

    schArr.push(oneSchSet);
    var newRecordStr = JSON.stringify(schArr);

    console.log("save Data to storage");
    console.log(newRecordStr);
    
    localStorage.setItem(localStorageKey,newRecordStr );
}

var getWeatherInfo = function() {

    console.log("GET weather INFO : " + cityName);

    errMsgEl.textContent = '';
    removeAllChildNodes(cityListUl);
    saveDataToStorage();

    // current weather
    var apiURL = "https://api.openweathermap.org/data/2.5/weather?lat="+geoCode['lat']+"&lon="+geoCode['lon']+"&units=imperial&appid="+weatherApiKey;

    console.log(apiURL);
  
    fetch(apiURL).then(function(response){
        if (response.ok) {
            response.json().then(function (data) {
                displayResult(data);

            });
        }
    }).catch( function(error) {
        alert('Unable to connect to OpenWeatherMap.org')
    });


}

var displayResult = function(wData) {

    console.log("Display Current Weather: "+cityName);
    console.log(wData);

    
    removeAllChildNodes(rsltIconEl);
    removeAllChildNodes(rsltCurDetailEl);

    rsltCityEl.textContent = wData.name;
    rsltCurDateEl.textContent = moment(moment.unix(wData.dt)).format('M/D/YYYY');

    var iconImg = document.createElement('img');
    iconImg.setAttribute('src', "http://openweathermap.org/img/wn/"+wData.weather[0].icon+"@2x.png")
    rsltIconEl.append(iconImg);

    

    // rsltCurDetailEl.textContent = printWeatherDetail(wData);
    var detailUl = document.createElement('ul');
    var tempLi = document.createElement('li');
    var windLi = document.createElement('li');
    var humidLi = document.createElement('li');
    tempLi.textContent = 'Temp: '+wData.main.temp+"°F";
    windLi.textContent = 'Wind: '+wData.wind.speed+'MPH';
    humidLi.textContent = 'Humidity: '+wData.main.humidity+'%';
    detailUl.append(tempLi);
    detailUl.append(windLi);
    detailUl.append(humidLi);
    rsltCurDetailEl.append(detailUl);

    currentBoxEl.setAttribute('style', "display:block");


    // display forecast
    var apiURL = "https://api.openweathermap.org/data/2.5/forecast?lat="+geoCode['lat']+"&lon="+geoCode['lon']+"&units=imperial&appid="+weatherApiKey;
    console.log(apiURL);

    fetch(apiURL).then(function(response){
        if (response.ok) {
            response.json().then(function (data) {
                displayForecast(data);

            });
        }
    }).catch( function(error) {
        alert('Unable to connect to OpenWeatherMap.org')
    });

    schInputEl.value='';
    displaySearchHistory();

}

var displayForecast = function(wData){
    console.log("Display Forecast: "+cityName);
    console.log(wData);

    forecastBoxEl.parentElement.setAttribute('style', "display:block");
    removeAllChildNodes(forecastBoxEl);

    var dataList = wData.list;


    for (let i = 0; i < dataList.length; i++) {   

        // var thisHour = moment(dataList[i].dt_txt, "YYYY-MM-DD HH:mm:ss").format('H');
        var thisHour = moment(moment.unix(dataList[i].dt)).format('H');
        // var thisDT = moment(moment.unix(dataList[i].dt)).format('YYYY-MM-DD HH:mm:ss');
        // console.log(thisDT);

        if ( thisHour == 14) {
            // console.log(dataList[i].dt_txt + '----'+ thisHour);

            // console.log(moment(moment.unix(dataList[i].dt)).format('YYYY-MM-DD HH:mm:ss'));

            var oneBox = document.createElement('section');
            var dateH4 = document.createElement('h4');
            var detailUl = document.createElement('ul');
            var tempLi = document.createElement('li');
            var windLi = document.createElement('li');
            var humidLi = document.createElement('li');
            var iconIdSpan = document.createElement('img');

            oneBox.setAttribute('class', 'col-12 col-md-6 col-lg-2');
            dateH4.textContent = moment(dataList[i].dt_txt, "YYYY-MM-DD HH:mm:ss").format('MM/DD/YYYY');
            iconIdSpan.setAttribute('src', "http://openweathermap.org/img/wn/"+dataList[i].weather[0].icon+"@2x.png");
            tempLi.textContent = 'Temp: '+dataList[i].main.temp+"°F";
            windLi.textContent = 'Wind: '+dataList[i].wind.speed+'MPH';
            humidLi.textContent = 'Humidity: '+dataList[i].main.humidity+'%';
            detailUl.append(tempLi);
            detailUl.append(windLi);
            detailUl.append(humidLi);
            oneBox.append(dateH4);
            oneBox.append(iconIdSpan);
            oneBox.append(detailUl);
            forecastBoxEl.append(oneBox);

        }
        
    }

}

var displaySearchHistory = function(){
    // display search history
    var historyStr = localStorage.getItem(localStorageKey) ;
    // cleardata
    removeAllChildNodes(schHistoryUl);
    if (historyStr) {
        var historyArr = JSON.parse(historyStr) ;

        for (let i = 0; i < historyArr.length; i++) {
            var oldCity = historyArr[i].city;
            var oldLat = historyArr[i].lat;
            var oldLon = historyArr[i].lon;

        
            var oldLiEl = document.createElement('li');
            oldLiEl.setAttribute('data-name', oldCity);
            oldLiEl.setAttribute('data-lat', oldLat);
            oldLiEl.setAttribute('data-lon', oldLon);
            oldLiEl.textContent = oldCity;

            oldLiEl.addEventListener('click', function(event) {
                cityName = event.target.getAttribute('data-name');                        
                geoCode = {
                    lat : event.target.getAttribute('data-lat'),
                    lon : event.target.getAttribute('data-lon')
                }
                
                getWeatherInfo();
            });
            schHistoryUl.append(oldLiEl);

        }

    }
}



schFormEl.addEventListener('submit', formSubmitHandler);
displaySearchHistory();


    