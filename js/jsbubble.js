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

// Super simple particle


function World() {

    var self = this;

    this.running = false;

    this.parts = [];  // array of particles  
    this.forces = []; // array of forces
    this.obs = [];    // array of obstacles

    this.timer; 
    this.tick_size = 33;  // Number of ms in a "tick"

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
    
        logger("particle hit wall " + nick);
    
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
        console.log(norm.inspect());
        var refl = vel.subtract(  norm.x(proj * 2) );
        particle.vel( [ refl.e(1), refl.e(2) ] );
    }

}


function Particle(x, y, v_i, v_j, radius) {

    this.x = x;
    this.y = y;
    this.v_i = v_i;
    this.v_j = v_j;
    this.radius = radius;
    
    this.mass = Math.sqrt(radius);
    
    this.friction = 0;
    this.elast = 0;
    
    this.element = $("<div>").css({
        "position"		: "absolute",
        "background-color" 	: "#9966BB",
        "border-radius"		: this.radius,
        "width"			: this.radius * 2,
        "height"		: this.radius * 2,
        "top"			: this.y - this.radius,
        "left"			: this.x - this.radius
    
    });
    
    this.place = function() {  // put the element on the container
    
        $(CONTAINER).append(this.element);
    }
    
    this.render = function() {
        $(this.element).css({
        "width"			: this.radius * 2,
        "height"		: this.radius * 2,
        "top"			: this.y - this.radius,
        "left"			: this.x - this.radius            
        
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
}




// Globals

DEBUG = true;
CONTAINER = {};
DIMS = {};


$(document).ready( function() {

    CONTAINER = $('#bubblebox').get();
    DIMS.x = $(CONTAINER).offset().x;
    DIMS.y = $(CONTAINER).offset().y;
    DIMS.w = $(CONTAINER).width();
    DIMS.h = $(CONTAINER).height();
    
    bubs = new Particle(200, 200, -4, -1, 15);
    
    wall1 = new Wall("lefty", [0,0], [0,1]); // Wall on the y-axis
    wall2 = new Wall("toppy", [0,0], [1,0]);
    
    wall3 = new Wall("righty", [DIMS.w,0], [0,1]);
    wall4 = new Wall("bottomy", [0,DIMS.h], [1,0]);
    
    world = new World();
    
    world.addParticle(bubs);
    world.addObstacle(wall1);
    world.addObstacle(wall2);
    world.addObstacle(wall3);
    world.addObstacle(wall4);
    
    world.start();
    




});
