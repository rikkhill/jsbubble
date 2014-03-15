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

function vNorm(v1) { // Get a unit vector from a vector
    var len = Math.sqrt( Math.pow(v1[0], 2) + Math.pow(v1[1],2));
    if(len === 0) {
        return [0,0];
    }
    return [ v1[0] / len, v1[1] / len  ];
}

function vScale(n, v1) { // Scale a vector by n
    return [ Math.round( n * v1[0] ) , Math.round( n * v1[1] )  ];
}

function vSum(v1, v2) { // the sum of two vectors
    return [v1[0] + v2[0], v1[1] + v2[1]];
}

function vDiff(v1, v2) { // the difference of two vectors
    return [v1[0] - v2[0], v1[1] - v2[1]];
}

function vDot(v1, v2) {  // dot product
    var summer = 0;
    for (i in v1) {
        summer += v1[i] * v2[i];
    }
    return summer;
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
    
    this.running = false;
    
    this.parts = [];
    this.forces = [];
    this.obstacles = [];
    
    this.timer; 
    
    this.tick_size = 41;  // Number of ms in a "tick"
    
    this.absolute_time = 0;  // absolute time
    

    this.addParticle = function(particle) {  // Add a particle
   
        particle.appear();
        this.parts.push(particle);
    }
    
    this.addForce = function(force) {  // Add a particle
    
        this.forces.push(force);

    }
    
    this.addObstacle = function(obstacle) { // Add a constraint / wall
        this.obstacles.push(obstacle);
    }
    
    this.tick = function() {  // apply forces to particles and check for collision
        var x, y, r, t, i, j, point;
        for (i in self.parts) {
            x = self.parts[i].x;
            y = self.parts[i].y;
            r = self.parts[i].radius;
            t = self.absolute_time;
        
            if (self.parts[i].ghost!== false) {
                continue;
            }


            
            // Forces
            
            for (j in self.forces) {
            
            console.log(self.forces[j](x, y, t));


                self.parts[i].exert(self.forces[j](x, y, t));
            }
            
            // Collisions
            
            for (j in self.obstacles) {
                if (self.obstacles[j].distance([x, y]) <= r) {  // Collision with obstacle!
                
                    // reposition the particle at a point along its trajectory
                    // where it's not colliding
                    
                    var vel = self.parts[i].vel() // This is its velocity
                    
                  
                    self.parts[i].reflect(self.obstacles[i].nearpoint([x,y]));
                }
            }


            
        }
        for (i in self.parts) {   // move particles only after everything is calculated
        
            if (self.parts[i].ghost!== false) {
	        continue;
            }
            self.parts[i].pos( vSum( self.parts[i].pos(), self.parts[i].vel() ) );
            console.log(self.parts[i].id, self.parts[i].vel(), self.parts[i].pos());
            self.parts[i].render();
        }
        

        self.absolute_time += self.tick_size;
    }
    
    this.start = function() {
        this.timer = setInterval(this.tick, this.tick_size);// interval);
        logger("timer started");
        this.running = true;
        return true;
    }
    
    this.stop = function() {
        clearInterval(this.timer);
        logger("timer stopped");  
        this.running = false;
        return true;
    }

}

function Wall(id, a, b, c) {  // We define a line in the plane to test collisions off
    
    var self = this;
    
    this.id = id;
    this.a = a;
    this.b = b;
    this.c = c;
    
    this.radius = 0;
    
    
    this.distance = function(vector) { // Distance from this line
        var x0 = vector[0];
        var y0 = vector[1];
        return Math.abs((this.a*x0)+(this.b*y0)+c)/Math.sqrt(Math.pow(this.a,2)+Math.pow(this.b,2));
    }
    
    this.nearpoint = function(vector) { // Nearest point
        var x0 = vector[0];
        var y0 = vector[1];
        var vec = [0,0];
        vec[0] = (this.b * (this.b * x0 - this.a * y0) - this.a*this.c) / (this.a*this.a + this.b*this.b);
        vec[1] = (this.a * (this.a * y0 - this.b * x0) - this.b*this.c) / (this.a*this.a + this.b*this.b);
        return vec;
    }
    
}

function Bubble() {  // A large round colourful particle

    var self = this;

    var rloc = randomContainerLocation(CONTAINER);

    this.radius = randInt(10,35);
    this.mass = Math.pow(this.radius, 0.5); // approximate "mass" relative to size   
    this.ghost = true;
        
    this.id = randInt(10000, 99999);

    this.x = rloc[0];
    this.y = rloc[1];
    
    
    this.v_i = -1;
    this.v_j = -1;

    

    
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

        this.v_i += vector[0] / this.mass;
        this.v_j += vector[1] / this.mass;
    }
    
    this.reflect = function(point) {  // Reflect off a surface
        var nv = vDiff (self.pos(), point);
        
        nv = vNorm(nv); // normal vector
        
       
        var dot_prod = vDot(this.vel(), nv);

        var my_reflection = vDiff( this.vel() , vScale( (dot_prod * 2), nv  ) );
        
        
        this.vel(my_reflection); 

    
    }
    
    this.collide = function(obj) {  // collide off another particle
        var diff = vDiff (self.pos(), obj.pos());
        diff = vNorm(diff); // normal unit vector
        
        var my_projection = vDot(self.vel(), diff) // dot product of velocity vector along the unit vector
        
        
        var their_projection = vDot(obj.vel(), diff)  // For the other dude
        
        var c_o_i = ( 2 * (my_projection - their_projection) ) / (this.mass + obj.mass);// conserved inertia

        var scaled_diff = vScale( (c_o_i * obj.mass) , diff);
        
        
        this.vel( vDiff( this.vel(), scaled_diff ) ); 
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
    
    $(CONTAINER).on('click', function() {
    
        if(world.running) {
            world.stop();
        }
        else
        {
            world.start();
        }
    
    });
    
    for (var i = 0; i < 3; i++) {
        world.addParticle(new Bubble());
    }
    
    force1 = function(x,y,t) { // Forcefields are functions
   
        return [10 * Math.sin(y),10 * Math.sin(x)];
        //return [-100, 0];
    }
    
    wall1 = new Wall("left wall", 1, 0, -1); // Wall at x = 100
    
    container_height = $(CONTAINER).height();
    container_width = $(CONTAINER).width();
    
    wall2 = new Wall("right wall", container_width, 0, (-1 * container_width) );
    wall3 = new Wall("top wall", 0, container_height, (-1 * container_height) );
    wall4 = new Wall("bottom wall", 0, 1, -1);
    
    
    //wall1 = new Wall("right wall", $(CONTAINER).width() - 100, 0, $(CONTAINER).width() - 100); // Wall at x = 100
        
    //world.addForce(force1);
    world.addObstacle(wall1);
    world.addObstacle(wall2);
    world.addObstacle(wall3);
    world.addObstacle(wall4);
    
    world.start();


});
