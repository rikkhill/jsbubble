/*

jsbubble.js

requires jQuery, Sylvester

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

// Random functions

function randInt(a,b) {
    return Math.floor( Math.random() * (b - a + 1) + a );
}

function randLocation(container) {
    var x = $(container).width();
    var y = $(container).height();
    return [ randInt(0, x), randInt(0,y)   ];
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
        blend[i] = Math.round((acol[i] + bcol[i]) / 2);
    }
   
    return hexFromRgb(blend);
}

function weightCol(a, b, wa, wb) { // take two colours and return the weighted mean

    var acol, bcol, blend = [];
    acol = rgbFromHex(a);
    bcol = rgbFromHex(b);
    
    for (i in acol) {
        blend[i] = Math.round(  (   ( wa * acol[i]) + (wb * bcol[i])  ) / (wa + wb)   );

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


// Particle Stuff


function World() {

    var self = this;

    this.running = false;

    this.parts = [];  // array of particles  
    this.forces = []; // array of forces
    this.obs = [];    // array of obstacles

    this.timer; 
    this.tick_size = 41;  // Number of ms in a "tick"

    this.absolute_time = 0;  // absolute time

    this.addParticle = function(particle) {  // Add a particle
   
        particle.place();
        this.parts.push(particle);
    }

    this.addForce = function(force) {  // Add a particle
    
        this.forces.push(force);

    }

    this.addObstacle = function(obstacle) { // Add a constraint / wall
        this.obs.push(obstacle);
    }

    this.tick = function() {  // Execute a unit of time
    
        var i, j, d, v;
        
        
        for (i in self.parts) {    // collision handling
            for (j in self.obs) {  // check for walls
                if (self.obs[j].distanceFrom(self.parts[i]) <= self.parts[i].radius) {
                    self.obs[j].impact(self.parts[i]);
                }
            
            }
            
            for (j in self.parts) {  // check for other particles
                if(self.parts[i].distanceFrom(self.parts[j]) <= self.parts[i].radius + self.parts[j].radius) {  // Simple particle collision detection
                    self.parts[i].collide(self.parts[j]);
                }
            }
        }
        
        
        
        for(i in self.parts) {  // Move all particles
            v = self.parts[i].pos();
        
            d = $V(self.parts[i].pos()).add( $V(self.parts[i].vel()) );
            self.parts[i].pos( [ d.e(1), d.e(2)  ]);
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


function Wall(nick, anchor, vector) {

    this.nick = nick;
    this.line = $L(anchor, vector);
    this.friction = 0;
    this.elast = 0;
    
    this.distanceFrom = function(particle) { // return distance from particle
        return this.line.distanceFrom($V([particle.x, particle.y]));
    }
    
    this.impact = function(particle) {  // Adjust a colliding particle's properties appropriately
    
        var pos = $V(particle.pos()).to3D();
        var vel = $V(particle.vel()).to3D();
        var impact_point = this.line.pointClosestTo(pos);
        var norm = pos.subtract(impact_point).toUnitVector();  // Normal unit vector
        
        //  Relocate particle so it's just outside penetration range
        var penetration = 1 + particle.radius - this.line.distanceFrom(pos);
        var newpos = pos.add(norm.x(penetration));
        particle.pos([ newpos.e(1), newpos.e(2)  ]);
        
        // Adjust particle's velocity
        var proj = vel.dot(norm);
        var refl = vel.subtract(  norm.x(proj * 2) );
        particle.vel( [ refl.e(1), refl.e(2) ] );
    }

}


function Particle(d, v_i, v_j, radius) {

    this.x = d[0];
    this.y = d[1];
    this.v_i = v_i;
    this.v_j = v_j;
    this.radius = radius;
    this.trans = 0.6;
    
    this.colour =   blendCol(randCol(),"#FFFFFF");
    
    this.mass = Math.pow(radius, 0.5);
    
    this.friction = 0;
    this.elast = 0;
    
    this.element = $("<div>").css({
        "position"		: "absolute",
        "background-color" 	: this.colour,
        "border-radius"		: (this.radius + 1),
        "width"			: (this.radius + 1) * 2,
        "height"		: (this.radius + 1) * 2,
        "top"			: this.y - this.radius,
        "left"			: this.x - this.radius,
        "box-shadow"		: "0px 0px 20px inset"  // I am going to hell for using this CSS property
    
    });
    
    this.place = function() {  // put the element on the container
    
        $(CONTAINER).append(this.element);
    }
    
    this.render = function() {
        $(this.element).css({
        "width"			: (this.radius + 1) * 2,
        "height"		: (this.radius + 1) * 2,
        "background-color" 	: this.colour,
        "top"			: this.y - (this.radius + 1),
        "left"			: this.x - (this.radius + 1),
        "opacity"		: this.trans
        
        });
    }
    
    this.pos = function(position) { // Get/set position
        if (typeof position !== "undefined") {
	    this.x = position[0];
	    this.y = position[1];
	}
        return [this.x, this.y];
    }
    
    this.vel = function(velocity) { // Get/set velocity
        if (typeof velocity !== "undefined") {
            this.v_i = velocity[0];
            this.v_j = velocity[1];
        }
        
        return [this.v_i, this.v_j];   
    }
    
    this.distanceFrom = function(particle) {
        return $V(this.pos()).distanceFrom($V(particle.pos()));
    }
    
    this.collide = function(particle) {  // Adjust two colliding particles
         var this_d = $V([this.x, this.y]);
         var that_d = $V([ particle.x, particle.y ]);
         
         var this_v = $V([this.v_i, this.v_j]);
         var that_v = $V([ particle.v_i, particle.v_j]);
         
         
         var norm = this_d.subtract(that_d).toUnitVector();
         
         // Push each other apart so they're no longer penetrating
         var penetration = 1 + this.radius + particle.radius - this_d.distanceFrom(that_d);
         var bounce_share = (this.mass * this_v.modulus()) / ((this.mass * this_v.modulus()) + (particle.mass * that_v.modulus()));
         var this_newpos = this_d.add(norm.x(penetration * bounce_share));
         var that_newpos = that_d.subtract(norm.x(penetration * (1 - bounce_share)));
         this.pos([ this_newpos.e(1), this_newpos.e(2)  ]);
         particle.pos([ that_newpos.e(1), that_newpos.e(2)  ]);
         
         // reflect them properly
         
         var this_proj = this_v.dot(norm);
         var that_proj = that_v.dot(norm);
         
         var impulse = ( 2.0 * (this_proj - that_proj) ) / (this.mass + particle.mass);
         if (impulse > 0) {
             impulse = 0;
         }

         var this_scaled_diff = this_v.subtract(norm.x(impulse * particle.mass));
         
         var that_scaled_diff = that_v.subtract(norm.x(-impulse * this.mass));
         
         this.vel([this_scaled_diff.e(1), this_scaled_diff.e(2)]);
         
         particle.vel([that_scaled_diff.e(1), that_scaled_diff.e(2)]);
         
         // Funky colour things
         
         //var col = weightCol(this.colour, particle.colour, this.mass, particle.mass);
         //this.colour = blendCol(randCol(),"#FFFFFF");
         //particle.colour = blendCol(randCol(),"#000000");
         
    }
}




// Globals

DEBUG = true;
CONTAINER = {};
DIMS = {};


$(document).ready( function() {

    CONTAINER = $("#bubblebox").get();
    DIMS.x = $(CONTAINER).offset().x;
    DIMS.y = $(CONTAINER).offset().y;
    DIMS.w = $(CONTAINER).width();
    DIMS.h = $(CONTAINER).height();
    
    console.log(DIMS);
    
    //bubs = new Particle(randLocation(CONTAINER), 0.5, 0.5, 30);
    world = new World();    
    for (var i = 0 ; i < 30 ; i++) {
        world.addParticle( new Particle(randLocation(CONTAINER), Math.random() * randInt(1,5), Math.random() * randInt(1,5), randInt(30,50)) );
    
    }
    
    wall1 = new Wall("lefty", [0,0], [0,1]); // Wall on the y-axis
    wall2 = new Wall("toppy", [0,0], [1,0]);
    
    wall3 = new Wall("righty", [DIMS.w,0], [0,1]);
    wall4 = new Wall("bottomy", [0,DIMS.h], [1,0]);
    wall5 = new Wall("thingy", [0,0], [1,1]);
    

    
    //world.addParticle(bubs);
    world.addObstacle(wall1);
    world.addObstacle(wall2);
    world.addObstacle(wall3);
    world.addObstacle(wall4);
    //world.addObstacle(wall5);
    
    
    world.start();
    




});
