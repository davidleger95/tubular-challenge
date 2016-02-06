(function(){
    'use strict';
    
    // **********************************************
    //  Map Functions
    // **********************************************
    var markers = [];
    var labels = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    var labelIndex = 0;
    
    function randomString(length, chars) {
        var result = '';
        for (var i = length; i > 0; --i) result += chars[Math.round(Math.random() * (chars.length - 1))];
        return result;
    }
    
    // **********************************************
    //  Angular App
    // **********************************************
    var app = angular.module('App', []);

    app.controller('MainCtrl', ['$scope', '$http', 'YelpAPI', 'MyLocation', 'Map', function($scope, $http, YelpAPI, MyLocation, Map) {
        $scope.businesses = [];
        $scope.minRating = 0;
        $scope.filterRating = function(val){
            $scope.minRating = val;
            Map.hideMarker(val);
            Map.showMarker(val);
        };
        $scope.labels = labels;
        $scope.searchLocation = "";
        $scope.category = "";
        $scope.search = function(){
            YelpAPI.retrieveYelp($scope.searchLocation, $scope.category, $scope.position, function(data) {
                $scope.businesses = data.businesses;
                Map.adjust($scope.businesses);

            });
        }
        
        MyLocation.getLocation(function(data){
            $scope.position = data;
            $scope.search();
        });


    }]);
    
    // **********************************************
    //  App Factories
    // **********************************************
    
    // Gets the current geolocation of the user and marks the location on the map.
    app.factory("MyLocation", function(){
        var geoLoc = {};
        geoLoc.getLocation = function(callback){
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(function (position) {

                    var mylat = position.coords.latitude,
                    mylong = position.coords.longitude,
                    position = {lat: mylat, lng: mylong};
                    map.panTo(position);
                    new google.maps.Marker({
                      position: position,
                        icon: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png',
                      map: map,
                      animation: google.maps.Animation.DROP
                    })
                    callback(position);
                });

            }
        }
        return geoLoc;
    });
    
    // Controls map functionality
    app.factory("Map", function(){
        var mapF = {};
        
         // Repositions map and adds markers after a search
        mapF.adjust = function(places){

            clearMarkers();     // remove all markers currently on the map

            var avgLat = 0, avgLng = 0, currLat = 0, currLng = 0, marker;

            // Adds markers to map and calculates average position for map centering
            for(var i= 0; i < places.length; i++){
                currLat = places[i].location.coordinate.latitude;
                currLng = places[i].location.coordinate.longitude;
                avgLat += currLat;
                avgLng += currLng;
                addMarkerWithTimeout({lat: currLat, lng: currLng}, 50*i, places[i].rating);
            }
            avgLat /= places.length;
            avgLng /= places.length;

            // Reposition map to the average of all search results
            map.panTo({lat: avgLat, lng: avgLng});
            map.setZoom(14);
        }
        
        // Hides markers based on rating filter
        mapF.hideMarker = function(markerRating) {
            for (var i = 0; i < markers.length; i++) {
                if(markerRating > markers[i].rating)
                    markers[i].setMap(null);
            }
        }
    
        // Shows markers based on rating filter
        mapF.showMarker = function(markerRating) {
            for (var i = 0; i < markers.length; i++) {
                if(markerRating < markers[i].rating)
                    markers[i].setMap(map);
            }
        }
        
        return mapF;
    });
    
    // Adds markers to the map with an animation.
    function addMarkerWithTimeout(position, timeout, rating) {
        
        window.setTimeout(function() {
        markers.push(new google.maps.Marker({
          position: position,
            label: labels[labelIndex++ % labels.length],
          map: map,
            rating: rating,
          animation: google.maps.Animation.DROP
        }));
      }, timeout);
    }
    
    // Destroys all markers on the map
    function clearMarkers() {
      for (var i = 0; i < markers.length; i++) {
        markers[i].setMap(null);
      }
      markers = [];
    }

    // Gets data from Yelp's Search API
    app.factory("YelpAPI", function($http) {
        var yelp = {};
            yelp.retrieveYelp = function(loc, cat, geoloc, callback) {
                var method = 'GET';
                var url = 'http://api.yelp.com/v2/search?callback=JSON_CALLBACK';
                var params = {
                        callback: 'JSON_CALLBACK',
                        oauth_consumer_key: 'Gq3nufHNyIwpqk3b_dTwUw', //Consumer Key
                        oauth_token: 'Ncz87lMlADtslIdYj5JPDzS6dxKtSENG', //Token
                        oauth_signature_method: "HMAC-SHA1",
                        oauth_timestamp: new Date().getTime(),
                        oauth_nonce: randomString(32, '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'),
                        term: cat
                    };
                if(loc == ""){
                    params.ll = geoloc.lat + "," + geoloc.lng;
                }else{
                    params.location = loc;
                }
                var consumerSecret = '-laUr0SXjHmu8oa6ndqJiHXEZf0'; //Consumer Secret
                var tokenSecret = 'tyNYjysD6_b-8rFHIWm_Rp4qVO8'; //Token Secret
                var signature = oauthSignature.generate(method, url, params, consumerSecret, tokenSecret, { encodeSignature: false});
                params['oauth_signature'] = signature;
                $http.jsonp(url, {params: params}).success(callback);
            }
        return yelp;
    });
    
})();