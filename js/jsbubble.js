/*

jsbubble.js

requires jQuery

*/


function randomPageLocation() {

    var x = Math.floor( Math.random() * $(window).height() );
    var y = Math.floor( Math.random() * $(window).height() );
    return [x, y];
}

function Bubble() {

    var rloc = randomPageLocation();

    this.x = rloc[0];
    this.y = rloc[1];

    this.obj = $('<div>').addClass("bubble").css({
        top	: $(window).height() - this.x,
        left	: this.y
    }).get();

    $("body").append(this);

} 





$(document).ready( function() {

    console.log('jsbubble started');


    var b = new Bubble();

});
