(function(){
    'use strict';
    
    var markers = [];
    var labels = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    var labelIndex = 0;
    
    function randomString(length, chars) {
        var result = '';
        for (var i = length; i > 0; --i) result += chars[Math.round(Math.random() * (chars.length - 1))];
        return result;
    }
    
    function adjustMap(places){
        clearMarkers();
        // Adjust Map
        var avgLat = 0, avgLng = 0, currLat = 0, currLng = 0, marker, info;

        for(var i= 0; i < places.length; i++){
            currLat = places[i].location.coordinate.latitude;
            currLng = places[i].location.coordinate.longitude;
            
            addMarkerWithTimeout({lat: currLat, lng: currLng}, 50*i, places[i].rating);
            
            avgLat += currLat;
            avgLng += currLng;
            
        }
        avgLat /= places.length;
        avgLng /= places.length;
        console.log(avgLat +","+avgLng);

        map.panTo({lat: avgLat, lng: avgLng});
        map.setZoom(14);
    }
    
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
    
    function clearMarkers() {
      for (var i = 0; i < markers.length; i++) {
        markers[i].setMap(null);
      }
      markers = [];
    }
    
    function hideMarker(markerRating) {
      for (var i = 0; i < markers.length; i++) {
        if(markerRating > markers[i].rating)
          markers[i].setMap(null);
      }
    }
    function showMarker(markerRating) {
      for (var i = 0; i < markers.length; i++) {
        if(markerRating < markers[i].rating)
          markers[i].setMap(map);
      }
    }
    
    var app = angular.module('App', []);


    app.controller('BusinessCtrl', ['$scope', '$http', 'YelpAPI', 'MyLocation', function($scope, $http, YelpAPI, MyLocation) {
        $scope.businesses = [];
        $scope.minRating = 0;
        $scope.filterRating = function(val){
            $scope.minRating = val;
            hideMarker(val);
            showMarker(val);
            $scope.class = "";
        };
        $scope.labels = labels;
        $scope.searchLocation = "";
        $scope.category = "";
        $scope.search = function(){
            YelpAPI.retrieveYelp($scope.searchLocation, $scope.category, $scope.position, function(data) {
                $scope.businesses = data.businesses;
                
                
                adjustMap($scope.businesses);

            });
        }
        
        MyLocation.getLocation(function(data){
            $scope.position = data;
        });


    }]);
    
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