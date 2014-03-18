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

define(['records'], function(records){



function onGeofenceEvent(event) {
     console.log('region event id: ' + event.fid + ' got event with status: ' + event.status) ;
     alert('region event id: ' + event.fid + ' got event with status: ' + event.status) ;
     }


$(document).on(
	'click',
	'.geofence',
         function(){
 	  console.log("register geofence") ;

          var params = { callback: 'onGeofenceEvent', notifyMessage: '%2$s your home!' };
           geofencing.register(params);
         // Kittle yards
           var gfparams = {"fid": 3, "radius": 100, "latitude": 55.935585 , "longitude": -3.179845};


// register the application to get geofencing events in the onGeofenceEvent function

            geofencing.addRegion(
                function() {
                    console.log("region added");
                 },
                 function(e) {
                     alert(e);
                  }, gfparams);

           // Earthy
           var gfparams2 = {"fid": 4, "radius": 100, "latitude": 55.934136 , "longitude": -3.178222};


            geofencing.addRegion(
                function() {
                    console.log("region added");
                 },
                 function(e) {
                     alert(e);
                  }, gfparams2);



	  });

    // example annotate listener
    $(document).on('click', '.annotate-audio-form', function(){
        localStorage.setItem('annotate-form-type', 'audio');
        $.mobile.changePage('annotate.html', {transition: "fade"});
    });
})


