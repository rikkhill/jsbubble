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

function randLocation(container, borders) {

    borders = typeof borders !== "undefined" ? borders : false;
    var margin = borders ? 1 : 0;
    

    var x = $(container).width();
    var y = $(container).height();
    return [ randInt(0 + (x * 0.1 * margin), x - (x * 0.1 * margin)), randInt(0 +(y * 0.1 * margin),y - (x * 0.1 * margin))   ];
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


    var colour = [ "#", randInt(0,255).toString(16),randInt(0,255).toString(16),randInt(0,255).toString(16)];
    var colour = colour.join("");
    return colour;

}



function QuadTree(level, dims) {  // Quad-tree for collision detection

    this.max_objects = 10;
    this.max_levels = 4;
    this.level = level;
    // dims
    this.x = dims[0];
    this.y = dims[1];
    this.width = dims[2];
    this.height = dims[3];
    
    this.objects = [];
    this.children = [];

    
    this.clear = function() {
        var i;
        while (i = this.children.shift()) {
            i.clear();
        }
    }
    
    this.split = function() {
    
        var subwidth = Math.ceil(this.width / 2);
        var subheight = Math.ceil(this.height / 2);
        var x = this.x;
        var y = this.y;
        
        this.children.push(new QuadTree(this.level+1, [ x + subwidth, y, subwidth, subheight ]));
        this.children.push(new QuadTree(this.level+1, [ x, y, subwidth, subheight ]));
        this.children.push(new QuadTree(this.level+1, [ x, y + subheight, subwidth, subheight ]));
        this.children.push(new QuadTree(this.level+1, [ x + subwidth, y + subheight, subwidth, subheight]));
    }
    
    this.getIndex = function(obj) {
    
        var x = obj.x;
        var y = obj.y;
        var rad = obj.radius;
        
        var upper, lower, right, left;
        
        var hmid = this.x + (this.width / 2);
        var vmid = this.y + (this.height / 2);
        
        if (y+rad > vmid && y - rad > vmid) {  // Upper 
            upper = true;
        }
        
        if (y+rad < vmid && y - rad < vmid) { //lower
            lower = true;
        }
        
        if (x+rad > hmid && x - rad > hmid) { //lower
	    right = true;
        }
        
        if (x+rad < vmid && x - rad < vmid) { //lower
	    left = true;
        }
        
        if(upper && right) {
            return 0;
        }
        else if(upper && left) {
            return 1;
        }
        else if(lower && left) {
            return 2;
        }
        else if(lower && right) {
            return 3;
        }
        else {
            return -1;
        }
    }
    
    this.insert = function(obj) {
    
        var index;
        var holder = [];
        var i;
        if(this.children.length > 0) {
            index = this.getIndex(obj);
            if (index != -1) {
                this.children[index].insert(obj);
                return true;
            }
        }
        
        this.objects.push(obj);
       
        if (this.objects.length > this.max_objects && level < this.max_levels) {
            if(this.children.length == 0) {
                this.split();
            }
            
            while(i = this.objects.shift()) {
                index = this.getIndex(i);
                if (index != -1) {
                    this.children[index].insert(i);
                }
                else {
                   holder.push(i);
                }
            }
            this.objects = holder;
        }

    }
    
    this.retrieve = function(obj) {
        var index = this.getIndex(obj);
        var ret = []
        
        if (index != -1 && this.children.length > 0) {
            ret.push.apply(ret, this.children[index].retrieve(obj) ); // append to array
        }
        
        ret.push.apply(ret, this.objects);
        
        return ret;
    }
    
    
    

}


function World() {

    var self = this;

    this.running = false;

    this.parts = [];  // array of particles  
    this.forces = []; // array of forces
    this.obs = [];    // array of obstacles

    this.tree = new QuadTree(0, [ 0, 0, DIMS.w, DIMS.h]);

    this.timer;
    this.bigtimer;
    this.tick_size = 42;  // Number of ms in a "tick"

    this.absolute_time = 0;  // absolute time

    this.addParticle = function(particle) {  // Add a particle
        this.parts.push(particle);
    }

    this.addForce = function(force) {  // Add a particle
        this.forces.push(force);
    }

    this.addObstacle = function(obstacle) { // Add a constraint / wall
        this.obs.push(obstacle);
    }

    this.tick = function() {  // Execute a unit of time
        var i, j, d, v, treeparts;
        self.tree.clear();
        for (i in self.parts) {  // Insert all objects into the tree
            if(self.parts[i].solid == false) {
                continue;
            }
            self.tree.insert(self.parts[i]);
        }
        
        for (i in self.parts) {    // collision handling
            for (j in self.obs) {  // check for walls
                if (self.obs[j].distanceFrom(self.parts[i]) <= self.parts[i].radius) {
                    self.obs[j].impact(self.parts[i]);
                }
            
            }
            
            treeparts = self.tree.retrieve(self.parts[i]); // get all potential collision objects
            
            for (j in treeparts) {  // check for other particles
                if(self.parts[i].distanceFrom(treeparts[j]) < self.parts[i].radius + treeparts[j].radius && self.parts[i].uid != treeparts[j].uid && treeparts[j].solid) {
                    self.parts[i].collide(treeparts[j]);
                }
            }
        }
        
        for(i in self.parts) {  // exert forces
            for(j in self.forces) {
               self.parts[i].exert(self.forces[j](self.parts[i].x, self.parts[i].y, self.absolute_time));
            }
        }
        

        for(i in self.parts) {  // Move all particles
        
            if(self.parts[i].solid == false) {
	       continue;
            }
            
            v = self.parts[i].pos();
        
            d = $V(self.parts[i].pos()).add( $V(self.parts[i].vel()) );
            self.parts[i].pos( [ d.e(1), d.e(2)  ]);
            self.parts[i].render();
        
        }
        self.absolute_time += self.tick_size;
    }
    
    this.checkspace = function(pos, radius) {
        var j;
        var pos = $V(pos);
        for (j in this.obs) {  // check for walls
            if (this.obs[j].line.distanceFrom(pos) <= radius) {
                return false;
            }
        }
            
        for (j in this.parts) {  // check for other particles
            if($V(this.parts[j].pos()).distanceFrom(pos) < radius + this.parts[j].radius) {
                return false;
            }
        }
        return true;
    }

    this.tidy = function() { // tidy things up a bit
    
        // Get rid of any bubbles outside the boundary    
        var anchor = $V([DIMS.w / 2, DIMS.h / 2 ]).to3D();  // Rough centre of the page
        var i, j, ref, o, pos_p, compare;
        for (i in this.parts) {
        
            if($(this.element).attr("burst")) {
                this.parts[i].dead = true;
            }
        
            if(this.parts[i].dead) {
                this.parts.splice(i,1);
                continue;
            }
        
            pos_p = $V(this.parts[i].pos()).to3D();
            for (j in this.obs) {
                ref = anchor.subtract(this.obs[j].line.pointClosestTo(anchor));
                compare = pos_p.subtract(this.obs[j].line.pointClosestTo(pos_p));
                if (ref.e(1) / compare.e(1) < 0 || ref.e(2) / compare.e(2) < 0) {
                    $(this.parts[i].element).remove();
                    this.parts.splice(i, 1);
                }
            }
        }

    }

    this.start = function() {

        this.timer = setInterval(this.tick, this.tick_size);// interval);
        this.tidy();
        this.running = true;
        
        for (i in this.parts){
            this.parts[i].place();
        }
        
        return true;
    }
    
    this.stop = function() {
        clearInterval(this.timer);
        logger("timer stopped");  
        this.running = false;
        return true;
    }

}


function Wall(nick, anchor, vector, frict, elast) {

    this.nick = nick;
    this.line = $L(anchor, vector);
    this.friction = frict;
    this.elasticity = elast;
    
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
        var total_frict = this.friction * particle.friction;
        var total_elasticity = this.elasticity * particle.elasticity;
        
        var perp = $V([norm.e(2), norm.e(1), norm.e(3) ]); // Perpendicular unit vector
        var proj = vel.dot(norm);
        var refl = vel.subtract(  norm.x(proj * 2 * total_elasticity) );
        refl = refl.subtract(perp.x(-total_frict));
        
        particle.vel( [ refl.e(1), refl.e(2) ] );
    }
}

function Particle(d, v_i, v_j, radius) {

    var self = this;
    
    this.uid = randInt(1000,9999);

    this.x = d[0];
    this.y = d[1];
    this.v_i = v_i;
    this.v_j = v_j;
    this.radius = radius;
    this.trans = 0.2;
    this.dead = false;
    this.solid = false;
    
    this.colour =   blendCol(randCol(), '#FFFFFF');
    
    this.mass = Math.pow(radius, 0.5);
    
    this.friction = 0.9;
    this.elasticity = 0.9;
    
    this.element = $("<div>").addClass('particle bubble').css({
        "position"		: "absolute",
        "background-color" 	: this.colour,
        "width"			: (this.radius) * 2,
        "opacity"		: 0,
        "height"		: (this.radius) * 2,
        "top"			: this.y - this.radius,
        "left"			: this.x - this.radius
    
    });
    
    $("<div>").addClass('vector_i').appendTo(this.element);
    $("<div>").addClass('vector_j').appendTo(this.element);
    $("<div>").addClass('info').appendTo(this.element);
    
    this.place = function() {  // put the element on the container
        $(CONTAINER).append(this.element);
        $(this.element).fadeTo(randInt(600, 1000), 0.2, function(){ 
            self.substantiate();
            $(self.element).css('opacity', '');
            
        });
    }
    
    this.render = function() {
    
        var col = "";
        if ($(this.element).hasClass('bubble')) {
            col = this.colour; 
        }
    
        $(this.element).css({
        "background-color" 	: col,
        "top"			: this.y - (this.radius),
        "left"			: this.x - (this.radius)        
        });
        
        if($(this.element).hasClass('tech')) {
            var vec = $V(this.vel());
            var norm = vec.toUnitVector();
        
            var scaleX = "scaleX(" + (norm.e(1)).toFixed(1) + ")";
            var scaleY = "scaleY(" + (norm.e(2)).toFixed(1) + ")";
   
            $(this.element).children(".vector_i").css({
                'transform': scaleX,
                '-ms-transform': scaleX,
                '-webkit-transform': scaleX
            });
        
            $(this.element).children(".vector_j").css({
                'transform': scaleY,
                '-ms-transform': scaleY,
                '-webkit-transform': scaleY
            });
            
            var info = "id: " + this.uid;
            info += "<br />x: " + Math.floor(this.x * 42);
            info += "<br />y: " + Math.floor(this.y * 42);
            info += "<br />v_i: " + Math.floor(this.v_i * 42);
            info += "<br />v_j: " + Math.floor(this.v_j * 42);
            info += "<br />mass:" + this.mass.toFixed(4);
            var speed = Math.sqrt( Math.pow(this.v_j * 42, 2) + Math.pow(this.v_j * 42, 2) );
            
            info += "<br />speed: " + Math.floor(speed);
            info += "<br />KE: " + Math.floor(this.mass * 0.5 * speed * speed);
            info += "<br />colour: " + this.colour;
            
            $(this.element).children('.info').html(info);
        }
    }
    
    this.substantiate = function() {
        this.solid = true;
    }
    
    
    this.exert = function(vector){  // Exert a force vector on this particle
        this.v_i += vector[0] / this.mass;
        this.v_j += vector[1] / this.mass;
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
         
         var total_elasticity = this.elasticity * particle.elasticity;
         
         var this_v = $V([this.v_i, this.v_j]);
         var that_v = $V([ particle.v_i, particle.v_j]);
         var norm = this_d.subtract(that_d).toUnitVector();
         
         // Push each other apart so they're no longer penetrating
         var penetration = 3 + this.radius + particle.radius - this_d.distanceFrom(that_d);

         var bounce_share = (this.mass * this_v.modulus()) / ((this.mass * this_v.modulus()) + (particle.mass * that_v.modulus()));
         
         var this_newpos = this_d.add(norm.x(penetration * bounce_share));
         var that_newpos = that_d.subtract(norm.x(penetration * (1 - bounce_share)));

         this.pos([ this_newpos.e(1), this_newpos.e(2)  ]);
         particle.pos([ that_newpos.e(1), that_newpos.e(2)  ]);
         
         
         // reflect them properly
         
         var this_proj = this_v.dot(norm);
         var that_proj = that_v.dot(norm);
         
         var impulse = ( total_elasticity * 2.0 * (this_proj - that_proj) ) / (this.mass + particle.mass);
         if (impulse > 0) {
             impulse = 0;
         }

         var this_scaled_diff = this_v.subtract(norm.x(impulse * particle.mass));
         
         var that_scaled_diff = that_v.subtract(norm.x(-impulse * this.mass));
         
         this.vel([this_scaled_diff.e(1), this_scaled_diff.e(2)]);
         
         particle.vel([that_scaled_diff.e(1), that_scaled_diff.e(2)]);
         
         
         var col = blendCol(randCol(), '#FFFFFF');
         this.colour = col;
         particle.colour = col;

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
    
    $(CONTAINER).css({ "overflow":  "hidden"});
    
    //bubs = new Particle(randLocation(CONTAINER), 0.5, 0.5, 30);
    world = new World();    
    for (var i = 0 ; i < 25 ; i++) {
        var loc = randLocation(CONTAINER, true);
        var rad = randInt(40,60);
        if (world.checkspace( loc, rad )) {
            world.addParticle( new Particle(loc, Math.random() * 0, Math.random() * 0, rad) );
        }
    }
    
    // Create the "pen
    wall1 = new Wall("left", [0,0], [0,1], 0.9, 0.9);
    wall2 = new Wall("top", [0,0], [1,0], 0.9, 0.9);
    wall3 = new Wall("right", [DIMS.w,0], [0,1], 0.9, 0.9);
    wall4 = new Wall("bottom", [0,DIMS.h], [1,0], 0.9, 0.9);

    force1 = function(x,y,t) { // Forcefields are functions
        return [ 2 * Math.sin(y - (DIMS.h/2)), 2 * Math.sin(x - (DIMS.w/2))];
    }
    
    world.addObstacle(wall1);
    world.addObstacle(wall2);
    world.addObstacle(wall3);
    world.addObstacle(wall4);
    
    world.addForce(force1);

    world.start();
/*    
    // preload vector images
    
    var vi = $("<img/>").attr('src','./img/vector_i.png' )
    var vj = $("<img/>").attr('src','./img/vector_j.png' )
    
    var scaleX, scaleY;
    
    for(i = -10 ; i <= 10; i++) {
        var scaleX = "scaleX(" + i/10 + ")";
        var scaleY = "scaleY(" + i/10 + ")";
        vi.css({
                'transform': scaleX,
                '-ms-transform': scaleX,
                '-webkit-transform': scaleX
            });;
        vj.css({
                'transform': scaleY,
                '-ms-transform': scaleY,
                '-webkit-transform': scaleY
            });;

    }
    
    */
    
    $('#button').on('click', function() {
        if ( $(this).hasClass('bubble') ) {
            $(".bubble").removeClass('bubble').addClass('tech');
        }
        else {
            $(".tech").removeClass('tech').addClass('bubble');
        }
    });

  
});
