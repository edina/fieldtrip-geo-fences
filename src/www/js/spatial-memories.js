/*
Copyright (c) 2014, EDINA.
All rights reserved.

Redistribution and use in source and binary forms, with or without modification,
are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this
   list of conditions and the following disclaimer.
2. Redistributions in binary form must reproduce the above copyright notice, this
   list of conditions and the following disclaimer in the documentation and/or
   other materials provided with the distribution.
3. All advertising materials mentioning features or use of this software must
   display the following acknowledgement: This product includes software
   developed by the EDINA.
4. Neither the name of the EDINA nor the names of its contributors may be used to
   endorse or promote products derived from this software without specific prior
   written permission.

THIS SOFTWARE IS PROVIDED BY EDINA ''AS IS'' AND ANY EXPRESS OR IMPLIED
WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF
MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT
SHALL EDINA BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY,
OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT,
STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY
OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH
DAMAGE.
*/

"use strict";

define(['records', 'utils', 'map', 'ui', '../../gps-tracking/js/tracks'], function(records, utils, map, ui, tracks){
    var params = { callback: 'onGeofenceEvent', notifyMessage: '%2$s your home!' };


    // For Spatial Memories, centre on Macrobert Arts Centre
    map.overrideDefaultLonLat(-3.919802, 56.145737);

    if(typeof(geofencing) !== 'undefined'){
        geofencing.register(params);
    }

    var currentGeofenceAnnotation ;

   var geofencePage = function()
   {
     // listen on geofence activate  button

      $('#geofence-form-ok').click($.proxy(function(event){

 	    console.debug("geofence activate button listener") ;
            $('#geofence-form').submit();
        }, this));


        // form submitted
        $('#geofence-form').submit(function(event){
            if($('#geofence-form-title').val().length === 0){
                $('#geofence-form-title').addClass('ui-focus');
                utils.inform('Required field not populated');
            }
            else{

 	        console.debug("geofence form submit: getCurrentPosition") ;
                navigator.geolocation.getCurrentPosition(
                onSuccess,
                onError,
                {
		   enableHighAccuracy:true,
                   maximumAge:0,
                   timeout:5000
                }) ;
             }
            return false ;

          }) // ends #geo-fence-form submit

    }//ends geofencePage



     var onSuccess = function(position){
 	        console.debug("geofence getCurrentPosition:" + position.coords) ;
                  console.debug("longitude:" + position.coords.longitude ) ;
                  console.debug("latitude:" + position.coords.latitude ) ;

                 var coords = {
                       'lon': position.coords.longitude,
                       'lat': position.coords.latitude
                 } ;



                 currentGeofenceAnnotation = {
                    'record':{
                        'editor': 'geofence.edtr',
                        'name': $('#geofence-form-title').val(),
                        'fields': [
                            {
                                'id': 'fieldcontain-geofence-radius-1',
                                'val': $('#geofence-form-radius').val() ,
                                'label': 'Geofence Radius'
                            },
                            {
                                'id': 'fieldcontain-geofence-duration-1',
                                'val': 180 * 1000,
                                'label': 'Geofence Duration'
                            }
                        ],
                    },
                    'isSynced': false,
                };

               var EXTERNAL_PROJECTION = new OpenLayers.Projection("EPSG:4326") ;
               var INTERNAL_PROJECTION = new OpenLayers.Projection("EPSG:900913") ;
                // map.pointToExternal(coords) ;
               var lonlat = new OpenLayers.LonLat(coords.lon, coords.lat) ;
               var extLonLat = lonlat.clone().transform(EXTERNAL_PROJECTION, INTERNAL_PROJECTION) ;
               console.debug("lonlat:" + lonlat.lon ) ;
               console.debug("extLonLat" + extLonLat.lon ) ;
               console.debug(extLonLat) ;
               coords.lon = extLonLat.lon ;
               coords.lat = extLonLat.lat ;
                var id = records.saveAnnotationWithCoords(
                   currentGeofenceAnnotation,
                   coords);

           var gfparams = {"fid": id, "radius": $('#geofence-form-radius').val(), "latitude": position.coords.latitude , "longitude": position.coords.longitude };
// register the application to get geofencing events in the onGeofenceEvent function

            geofencing.addRegion(
                function() {
                    console.debug("region added");
                 },
                 function(e) {
                     console.debug("error occurred adding geofence region") ;
                  }, gfparams);

                $.mobile.changePage('gps-capture.html');

            };

       var onError = function(error) {
 	        console.debug("GPS Timeout" + error) ;
                $.mobile.changePage('gps-capture.html');
       };

    // map switching
    $(document).on('change', '#settings-mapserver-url', function(){
        if(utils.isMobileDevice()){
            var url = "http://a.tiles.mapbox.com/v3/" +
                $('#settings-mapserver-url option:selected').val() +
                "/${z}/${x}/${y}.png";
            var baseLayer = new OpenLayers.Layer.XYZ(
                "Map Box Layer",
                [url], {
                    sphericalMercator: true,
                    wrapDateLine: true,
                    numZoomLevels: 20
                }
            );

            map.switchBaseLayer(baseLayer);
        }
        else{
            utils.inform("Switching doesn't work on the desktop.");
        }
    });

    // gps tracking
    $(document).on('pageinit', '#gpscapture-page', function(){
        var setupButtons = function(running){
            if(running){
                $('#gpscapture-stop-button').removeClass('ui-disabled');
                $('#gpscapture-play').addClass('ui-disabled');
            }
            else{
                $('#gpscapture-stop-button').addClass('ui-disabled');
                $('#gpscapture-play').removeClass('ui-disabled');
                $('#gpscapture-confirm-popup').popup('close');
            }
        };

        var createAnnotation = function(type, val){
            var annotation = {
                "record": {
                    'editor': type + '.edtr',
                    'fields': [],
                    'name': type + utils.getSimpleDate()
                },
                "isSynced": false
            }

            if(type === 'image' || type === 'audio'){
                annotation.record.fields.push({
                    "id": "fieldcontain-" + type + "-1",
                    "val": val,
                    "label": utils.capitaliseFirstLetter(type)
                });
            }

            // get device location and convert it to mercator
            map.getLocation(function(position){
                map.pointToInternal(position.coords);

                // save record and refresh map
                records.saveAnnotationWithCoords(
                    annotation,
                    position.coords
                );

                map.refreshRecords(annotation);
                $.mobile.changePage('gps-capture.html');
            });
        };

        // save track
        $('#gpscapture-confirm-save').click(function(){
            $('#gpscapture-confirm-popup').popup('close');
            setupButtons(false);
        });

        // start track
        $('#gpscapture-play').click(function(e){
            $.mobile.changePage('annotate-gps.html');
        });

        // discard track
        $('#gpscapture-confirm-discard').click(function(){
            setupButtons(false);
        });

        $('.photo-button').click(function(e){
            records.takePhoto(function(media){
                createAnnotation('image', media);
            });

        });
        $('.audio-button').click(function(e){
            records.takeAudio(function(media){
                createAnnotation('audio', media);
            });

        });
        $('.text-button').click(function(e){
            records.annotateText();
        });

        setupButtons(tracks.gpsTrackRunning());
    });

$(document).on('pageinit','#geofence-page', geofencePage) ;
}); // ends define scope

     function onGeofenceEvent(event) {
       console.debug('region event id: ' + event.fid + ' got event with status: ' + event.status) ;
        alert('region event id: ' + event.fid + ' got event with status: ' + event.status) ;
     }


