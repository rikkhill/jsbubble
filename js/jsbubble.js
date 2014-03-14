/*

jsbubble.js

requires jQuery

*/

// Debugging functions

function logger(){
    if (DEBUG){
        console.log.apply(console, arguments);
    }
}

function problogger() {   // Log this probabilistically
    if (DEBUG && randInt(1,20) == 1){
        console.log.apply(console, arguments);
    }
}

// Display functions

function screenMapping(obj) { // Return a screen mapping function for the container object

    var x_offset, y_offset, width, height;
    x_offset = $(obj).offset().left;
    y_offset = $(obj).offset().top;
    width = $(obj).width();
    height = $(obj).height();

    var func = function(x, y) {  // Take xy coordinates and plant them on 
        var x_map = x + x_offset;
        var y_map = (height - y) + y_offset;
        return [x_map, y_map];
    }

    return func;
}

// Random number functions

function randomContainerLocation(obj) { // Page location excepting a border of 100px

    var x = randInt( 100, $(obj).width() - 200 );
    var y = randInt( 100, $(obj).height() - 200 );
    return [x, y];
}

function randInt(a,b) {
    return Math.floor( Math.random() * (b - a + 1) + a );
}


// Vector functions


function euc(v1, v2) { // Euclidean distance between two points
    return Math.round( Math.pow( Math.pow(v1[0] - v2[0], 2) + Math.pow(v1[1] - v2[1], 2), 0.5) );
}

function vSum(v1, v2) { // the sum of two vectors
    return [v1[0] + v2[0], v1[1] + v2[1]];
}

function vDiff(v1, v2) { // the difference of two vectors
    return [v1[0] - v2[0], v1[1] - v2[1]];
}

// Colour functions

function rgbFromHex(hex) {  // Convert a hex colour code to an array of RGB values
    var hmatch = hex.match("^#([0-9a-fA-F]{1,2})([0-9a-fA-F]{1,2})([0-9a-fA-F]{1,2})$");
    if (hmatch) {
        return [  parseInt(hmatch[1], 16), parseInt(hmatch[2],16), parseInt(hmatch[3], 16)];
    }
    else {
        return false;
    }
}

function hexFromRgb(rgb) {  // Convert an array of RGB values to a hex colour code
    var i, component, returner = '#';
    for (i in rgb) {
        if(rgb[i] > 255) {
            rgb[i] -= 255;
        }
        component = rgb[i].toString(16);
        if (component.length < 2) {
            component = "0" + component;
        }
        returner += component;
    }
    return returner;

}

function blendCol(a, b) {  // Take the mean average of two colours

   var acol, bcol, blend = [];
   acol = rgbFromHex(a);
   bcol = rgbFromHex(b);
   
   for (i in acol) {
       blend[i] = Math.ceil((acol[i] + bcol[i]) / 2);
   }
   
   return hexFromRgb(blend);
}

function randCol() { // Completely random colour
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

function ForceEngine() {  // Applies forces to particles and manages collisions
  
    var self = this;
    
    this.particles = [];
    this.forces = [];
    this.obstacles = [];
    
    this.timer; 
    
    this.tick_size = 42;  // Number of ms in a "tick"
    
    this.absolute_time = 0;  // absolute time
    

    this.addParticle = function(particle) {  // Add a particle
   
        particle.appear();
        this.particles.push(particle);
    }
    
    this.addForce = function(force) {  // Add a particle
    
        this.forces.push(force);

    }
    
    this.addObstacle = function(obstacle) { // Add a constraint / wall
        this.obstacles.push(obstacle);
    }
    
    this.tick = function() {  // apply forces to particles and check for collision
        var x, y, r, t, i, j;
        for (i in self.particles) {
            x = self.particles[i].x;
            y = self.particles[i].y;
            r = self.particles[i].radius;
            t = self.absolute_time;
        
            if (self.particles[i].ghost!== false) {
                continue;
            }

            self.particles[i].x += self.particles[i].v_i;
            self.particles[i].y -= self.particles[i].v_j;
            self.particles[i].render();
            
            // Forces
            
            for (j in self.forces) {

                self.particles[i].exert(self.forces[j](x, y, t));
            }
            
            // Collisions
            
            for (j in self.obstacles) {
                if (self.obstacles[j].distance(x, y) < r) {  // Collision with obstacle!
                    
                }
            }
            
        }

        self.absolute_time += self.tick_size;
    }
    
    this.start = function() {
        this.timer = setInterval(this.tick, this.tick_size);// interval);
        logger("timer started");
        return true;
    }
    
    this.stop = function() {
        clearInterval(this.timer);
        logger("timer stopped");  
        return true;
    }

}

function Wall(id, a, b, c) {  // We define a line in the plane to test collisions off
    
    this.id = id;
    this.a = a;
    this.b = b;
    this.c = c;
    
    this.distance = function(x0, y0) { // Distance from this line
       return Math.abs((this.a*x0)+(this.b*y0)+c)/Math.sqrt(Math.pow(this.a,2)+Math.pow(this.b,2));
    }
}

function Bubble() {  // A large round colourful particle

    var self = this;

    var rloc = randomContainerLocation(CONTAINER);

    this.radius = randInt(10,35);
    this.mass = this.radius * this.radius; // Math.pow(this.radius, 0.5); // approximate "mass" relative to size   
    this.ghost = true;
        
    this.id = randInt(10000, 99999);

    this.x = rloc[0];
    this.y = rloc[1];
    
    
    this.v_i = -2;
    this.v_j = 0;

    

    
    this.trans = 0.5; // How opaque is this particle?
    
    this.colour = blendCol(randCol(), '#AAAA22');
    

    var xy = sm(this.x, this.y);

    this.obj = $('<div>').addClass("bubble").attr("id", toString(this.id)).css({
        'left'		: xy[0] - this.radius,
        'top'		: xy[1] - this.radius,
        'height'	: this.radius * 2,
	'width'		: this.radius * 2,
        'position'	: 'absolute',
        'border-radius' : this.radius,
        'opacity'	: this.trans,
        'background-color': this.colour
    }).html("&nbsp;");
    
    logger("bubble " + this.id + " instantiated");
    
    this.appear = function() { // Fade particle in
        logger("bubble " + this.id + " placed");
        $(this.obj).css('opacity', 0);
        $("body").append(this.obj);
        $(this.obj).fadeTo(randInt(100, 1200), this.trans, function(){ self.substantiate() });
    }
    
    this.render = function() {  // apply css based on properties
    
        var xy = sm(this.x, this.y);
    
        $(this.obj).css({
        'left'		: xy[0] - this.radius,
        'top'		: xy[1] - this.radius,
        'opacity'	: this.trans,
        'background-color': this.colour
        });
    }
    
    this.exert = function(vector){  // Exert a force vector on this particle
        this.v_i += Math.ceil(vector[0] / this.mass);
        this.v_j += Math.ceil(vector[1] / this.mass);
    }
    
    this.reflect = function(vector) { // reflect off given position vector
        var diff = vDiff (vector, self.pos());
        
        this.v_i = this.v_i * (diff[0] / Math.abs(diff[0]) );
        this.v_j = this.v_j * (diff[1] / Math.abs(diff[1]) );

    }
    
    this.substantiate = function() {
        this.ghost = false;
    }
    
    this.pos = function(position) {  // set / return position vector
    
        if (typeof position !== "undefined") {
            this.x = position[0];
            this.y = position[1];
        }
        
        return [this.x, this.y];
    }
    
    this.vel = function(velocity) { // set / return velocity vector
    
        if (typeof velocity !== "undefined") {
            this.v_i = velocity[0];
            this.v_j = velocity[1];
        }
        
        return [this.v_i, this.v_j];   
    }


    

} 

// Globals

DEBUG = true;

CONTAINER = {};

sm = {};

$(document).ready( function() {

    CONTAINER = $('#bubblebox').get();
    sm = screenMapping(CONTAINER);
    console.log(CONTAINER);


    world = new ForceEngine();
    
    for (var i = 0; i < 10; i++) {
        world.addParticle(new Bubble());
    }
    
    force1 = function(x,y,t) { // Forcefields are functions
   
        //return [10 * Math.sin(y),10 * Math.sin(x)];
        return [1, 0];
    }
    
    wall1 = new Wall("left wall", 100, 0, -100); // Wall at x = 100
    
    //wall1 = new Wall("right wall", $(CONTAINER).width() - 100, 0, $(CONTAINER).width() - 100); // Wall at x = 100
        
    //world.addForce(force1);
    world.addObstacle(wall1);
    
    world.start();


});
