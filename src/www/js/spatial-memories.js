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
    var other = this;

    // For Spatial Memories, centre on Macrobert Arts Centre
    map.overrideDefaultLonLat(-3.919802, 56.145737);

    if(typeof(geofencing) !== 'undefined'){
        geofencing.register(params);
    }


    var geofenceRecord =  function(record){

        map.pointToExternal(record.point);

        var gfparams = {"fid": record.name, "radius": 20, "latitude": record.point.lat , "longitude": record.point.lon };
        geofencing.addRegion(
                            function() {
                            console.debug("region added");
                            },
                            function(e) {
                            console.debug("error occurred adding geofence region") ;
                            }, gfparams);


    };



    $.each(records.getSavedRecords(), function(id, annotation){
        var record = annotation.record;
        if(record.editor !== 'track.edtr'){
            geofenceRecord(record);
        }
    });

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

            // disable audio on android
            if(!utils.isIOSApp()){
                $('.audio-button').addClass('ui-disabled');
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

                var gfparams = {"fid": annotation.record.name, "radius": 20, "latitude": position.coords.latitude , "longitude": position.coords.longitude };


                geofencing.addRegion(function() {
                     console.debug("region added");
                     },
                     function(e) {
                     console.debug("error occurred adding geofence region") ;
                     }, gfparams);

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

}); // ends define scope



//in global scope callback from cordova
function onGeofenceEvent(event) {
    require(['records'], function (records){

        var showAnnotation = function (annotation) {

        $('#map-record-popup').off('popupbeforeposition');
        $('#map-record-popup').on({
                                  popupbeforeposition: function() {
                                  var showRecord = function(html){
                                  $('#map-record-popup-text').append(html).trigger('create');
                                  };

                                  $('#map-record-popup h3').text(annotation.record.name);
                                  $('#map-record-popup-text').text('');

                                  $.each(annotation.record.fields, function(i, entry){
                                         var html;
                                         var type = records.typeFromId(entry.id);

                                         if(type === 'image'){
                                         html = '<img src="' + entry.val + '" width=100%"/>';
                                         showRecord(html);
                                         }
                                         else if(type === 'audio'){
                                         require(['audio'], function(audio){
                                                 html = audio.getNode(entry.val, entry.label + ':');
                                                 showRecord(html);
                                                 });
                                         }
                                         else if(entry.id !== 'text0'){ // ignore title element
                                         html = '<p><span>' + entry.label + '</span>: ' +
                                         entry.val + '</p>';
                                         showRecord(html);
                                         }
                                         });
                                  }
                                  });

        $('#map-record-popup').popup('open');
        };


        var lookupRecord = function() {
            $.each(records.getSavedRecords(), function(id, annotation){
                var record = annotation.record;
                if(record.name === event.fid) {
                   showAnnotation(annotation);
                }
            });

        };

        if(event.status.substring(0, 'entered'.length) === 'entered'){
            lookupRecord();
        }
    });
    console.debug('region event id: ' + event.fid + ' got event with status: ' + event.status) ;
    alert('region event id: ' + event.fid + ' got event with status: ' + event.status) ;
}


