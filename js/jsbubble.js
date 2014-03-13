/*

jsbubble.js

requires jQuery

*/


// Colour functions

function Colour(hex) { //object for colour, instantiated from hex value

    hex = typeof hex !== "undefined" ? hex : "#XXXXXX";

    this.iama = "colour";

    this.red = 0;
    this.green = 0;
    this.blue = 0;

    var hmatch = hex.match("^#([0-9a-fA-F]{1,2})([0-9a-fA-F]{1,2})([0-9a-fA-F]{1,2})$");
    if (!hmatch) { // Random colour if no match
        this.red = randInt(0,255);
        this.green = randInt(0,255);
        this.blue = randInt(0,255);
    }
    else {
        this.red = parseInt(hmatch[1], 16);
        this.green = parseInt(hmatch[2], 16);
        this.blue = parseInt(hmatch[3], 16);
    }

    this.randCol = function() { // Random colour out of nowhere
        var component, returner = "#";
        for (var i in [1,2,3]) {
           component = randInt(0,255).toString(16);
           if (component.length < 2) {
               component = "0" + component;
           }
           returner += component;
        }
        return returner;
    }

    this.hex = function() { // return a hex value for this colour
        var i, component, returner = '#';
        var cols = [this.red, this.green, this.blue];
        for (i in cols) {
            component = cols[i].toString(16);
            if (component.length < 2) {
                component = "0" + component;
            }
            returner += component;
        }
        return returner;
    }

    this.mix = function(mixer) { // Take other colour and average out all values with this one

        mixer = typeof mixer !=="undefined" ? mixer : randCol();

        if(mixer.iama == "colour") {  // if it's not a colour object
            mixer = mixer.hex();
        }

        var hmatch = mixer.match("^#([0-9a-fA-F]{1,2})([0-9a-fA-F]{1,2})([0-9a-fA-F]{1,2})$");
        if(hmatch){
            this.red = (this.red + parseInt(hmatch[1], 16)) / 2; 
            this.green= (this.green + parseInt(hmatch[2], 16)) / 2; 
            this.blue = (this.blue + parseInt(hmatch[3], 16)) / 2; 
        }
        else {
            this.red = (this.red + mixer.red) / 2; 
            this.green= (this.green + mixer.green) / 2; 
            this.blue = (this.blue + mixer.blue) / 2; 
        }
        return this.hex();
    }
}


function randomPageLocation() { // Page location excepting a border of 100px

    var x = randInt( 100, $(window).height() - 100 );
    var y = randInt( 100, $(window).width() - 100 );
    return [x, y];
}

function randInt(a,b) {
    return Math.floor( Math.random() * (b - a + 1) + a );
}

function Bubble() {

    var rloc = randomPageLocation();

    this.x = rloc[0];
    this.y = rloc[1];

    this.size = randInt(10,80);

    this.obj = $('<div>').addClass("bubble").css({
        top	: $(window).height() - (this.x + (this.size/2)),
        left	: this.y -(this.size/2) ,
        height	: this.size,
	width	: this.size
    }).html("&nbsp;");

    $("body").append(this.obj);
    console.log("bubble blown!");
} 





$(document).ready( function() {

    console.log('jsbubble started');


    var b = new Bubble();

});
