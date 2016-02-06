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
            
            info = "";
            
            info += "<div><h1>" + places[i].name + "</h1></div>"
            
            addMarkerWithTimeout({lat: currLat, lng: currLng}, 50*i);
            
            avgLat += currLat;
            avgLng += currLng;
            
        }
        avgLat /= places.length;
        avgLng /= places.length;
        console.log(avgLat +","+avgLng);

        map.panTo({lat: avgLat, lng: avgLng});
    }
    
    function addMarkerWithTimeout(position, timeout) {
        
        window.setTimeout(function() {
        markers.push(new google.maps.Marker({
          position: position,
            label: labels[labelIndex++ % labels.length],
          map: map,
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
    
    var app = angular.module('App', []);


    app.controller('BusinessCtrl', ['$scope', '$http', 'YelpAPI', function($scope, $http, YelpAPI) {
        $scope.businesses = [];
        $scope.searchLocation = "fredericton";
        $scope.category = "food";
        $scope.search = function(){
            YelpAPI.retrieveYelp($scope.searchLocation, $scope.category, function(data) {
                $scope.businesses = data.businesses;
                console.log(data.businesses[0]);
                
                adjustMap($scope.businesses);

            });
        }


    }]);

    app.factory("YelpAPI", function($http) {
        var yelp = {};
            yelp.retrieveYelp = function(loc, cat, callback) {
                var method = 'GET';
                var url = 'http://api.yelp.com/v2/search?callback=JSON_CALLBACK';
                var params = {
                        callback: 'JSON_CALLBACK',
                        location: loc,
                        oauth_consumer_key: 'Gq3nufHNyIwpqk3b_dTwUw', //Consumer Key
                        oauth_token: 'Ncz87lMlADtslIdYj5JPDzS6dxKtSENG', //Token
                        oauth_signature_method: "HMAC-SHA1",
                        oauth_timestamp: new Date().getTime(),
                        oauth_nonce: randomString(32, '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'),
                        term: cat
                    };
                var consumerSecret = '-laUr0SXjHmu8oa6ndqJiHXEZf0'; //Consumer Secret
                var tokenSecret = 'tyNYjysD6_b-8rFHIWm_Rp4qVO8'; //Token Secret
                var signature = oauthSignature.generate(method, url, params, consumerSecret, tokenSecret, { encodeSignature: false});
                params['oauth_signature'] = signature;
                $http.jsonp(url, {params: params}).success(callback);
            }
        return yelp;
    });
    
})();