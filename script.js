var c = document.getElementById("canvas");
var canvas = c.getContext("2d");

canvas.strokeStyle = "#fff";

var use_images = true;

// draw grid
canvas.beginPath();
for(let y=20;y<600;y+=20){
    canvas.moveTo(0, y);
    canvas.lineTo(600, y);
}
for(let x=20;x<600;x+=20){
    canvas.moveTo(x, 0);
    canvas.lineTo(x, 600);
}
canvas.stroke();

var types = ["human","zombie","doctor","immune","dead"];

var counts = {
    "human": 0,
    "doctor": 0,
    "zombie": 0,
    "immune": 0,
    "dead": 0
}

var probabilities = {
    "humanKillZombie": 0.5,
    "humanBecomeDoctor": 0.0015,
    "immuneKillZombie": 0.5,
    "immuneBecomeDoctor": 0.0015,
    "doctorImmunizeHuman": 0.5,
    "doctorImmunizeZombie": 0.1,
    "doctorKillZombie": 0.4,
    "zombieInfectHuman": 0.425,
    "zombieKillImmune": 0.5,
    "zombieKillDoctor": 0.5
};

function reset_probabilities(){
    document.getElementById("doctorImmunizeZombie").value = 0.1;
    document.getElementById("humanKillZombie").value = 0.5;
    document.getElementById("humanBecomeDoctor").value = 0.0015;
    document.getElementById("immuneKillZombie").value = 0.5;
    document.getElementById("immuneBecomeDoctor").value = 0.0015;
    document.getElementById("doctorImmunizeHuman").value = 0.5;
    document.getElementById("doctorImmunizeZombie").value = 0.1;
    document.getElementById("doctorKillZombie").value = 0.4;
    document.getElementById("zombieInfectHuman").value = 0.425;
    document.getElementById("zombieKillImmune").value = 0.5;
    document.getElementById("zombieKillDoctor").value = 0.5;
}

var images = {
    "human":  new Image(),
    "immune": new Image(),
    "doctor": new Image(),
    "zombie": new Image(),
    "dead":   new Image(),
}

for(let key in images){
    images[key].src = "./res/" + key + ".png";
}

class NPC {
    constructor(x,y){
        this.x = x;
        this.y = y;

        let seed = Math.floor(Math.random()*100);
        
        if(seed < 10)
            this.type = "immune";
        else if(seed < 20)
            this.type = "zombie";
        else if(seed < 22)
            this.type = "doctor";
        else
            this.type = "human";

        this.rate = 0.5;

        switch(this.type){
            case "human":
                this.color  = "gray";
                counts["human"]++;
                break;
            case "zombie":
                this.color  = "red";
                counts["zombie"]++;
                break;
            case "doctor":
                this.color  = "blue";
                counts["doctor"]++;
                break;
            case "immune":
                this.color  = "green";
                counts["immune"]++;
                break;
            case "dead":
                this.color  = "black";
                counts["dead"]++;
                break;
            default: // should be impossible
                this.color = "pink";
                break;
        }
    }
    
}

var npcs = new Array(32);
var next_set = new Array(32);

// establish 2d array of characters and grid positions (npc[x][y])
for(let i=0;i<32;++i){
    npcs[i] = new Array(32);
    next_set[i] = new Array(32);
    for(let j=0;j<32;++j){
        npcs[i][j] = new NPC(i*20,j*20);
        next_set[i][j] = npcs[i][j];
    }
}

function reset(){
    for(let i=0;i<32;++i){
        npcs[i] = new Array(32);
        next_set[i] = new Array(32);
        for(let j=0;j<32;++j){
            npcs[i][j] = new NPC(i*20,j*20);
            next_set[i][j] = npcs[i][j];
        }
    }
}

// initial painting of characters to canvas
for(let i=1;i<31;++i){
    for(let j=1;j<32;++j){
        canvas.fillStyle = npcs[i][j].color;
        canvas.fillRect(npcs[i][j].x-18, npcs[i][j].y-18, 16, 16);
    }
}

// change npc from one type to another (called from interact())
function changeType(x,y,type){
    npcs[x][y].type = type;

    switch(type){
        case "human":
            npcs[x][y].color  = "gray";
            break;
        case "zombie":
            npcs[x][y].color  = "red";
            break;
        case "doctor":
            npcs[x][y].color  = "blue";
            break;
        case "immune":
            npcs[x][y].color  = "green";
            break;
        case "dead":
            npcs[x][y].color  = "black";
            break;
        default: // should be impossible
            npcs[x][y].color = "yellow";
            break;
    }
    
    //console.log(type);
}

function interact(x,y,x2,y2){
    // can't interact with non-existent cells
    if(x2 < 0 || y2 < 0 || x2 > 31 || y2 > 31){
        return 0;
    }

    let roll = Math.random();

    // humans and immune can kill zombies
    if(npcs[x][y].type == "human" && npcs[x2][y2].type == "zombie" && roll <= probabilities["humanKillZombie"]){
        next_set[x2][y2].type = "dead";
    } else if(npcs[x][y].type == "immune" && npcs[x2][y2].type == "zombie" && roll <= probabilities["immuneKillZombie"]){
        next_set[x2][y2].type = "dead";
    } 
    
    // doctors can immunize humans and zombies or kill zombies
    else if(npcs[x][y].type == "doctor" && npcs[x2][y2].type == "human" && roll <= probabilities["doctorImmunizeHuman"]){
        next_set[x2][y2].type = "immune";
    } else if(npcs[x][y].type == "doctor" && npcs[x2][y2].type == "zombie" && roll <= probabilities["doctorImmunizeZombie"]){
        next_set[x2][y2].type = "immune";
    } else if(npcs[x][y].type == "doctor" && npcs[x2][y2].type == "zombie" && roll <= probabilities["doctorKillZombie"]){
        next_set[x2][y2].type = "dead";
    } 
    
    // zombies can infect humans and kill immune/doctor
    else if(npcs[x][y].type == "zombie" && npcs[x2][y2].type == "human" && roll <= probabilities["zombieInfectHuman"]){
        next_set[x2][y2].type = "zombie";
    } else if(npcs[x][y].type == "zombie" && npcs[x2][y2].type == "immune" && roll <= probabilities["zombieKillImmune"]){
        next_set[x2][y2].type = "dead";
    } else if(npcs[x][y].type == "zombie" && npcs[x2][y2].type == "doctor" && roll <= probabilities["zombieKillDoctor"]){
        next_set[x2][y2].type = "dead";
    }

}

var game_loop = setInterval(function(){
    for(let i=0;i<=31;++i){
        for(let j=0;j<=31;++j){
            interact(i,j, i+1,j+1);
            interact(i,j, i+1,j);
            interact(i,j, i,j+1);
            interact(i,j, i-1,j-1);
            interact(i,j, i-1,j);
            interact(i,j, i,j-1);
            interact(i,j, i+1,j-1);
            interact(i,j, i-1,j+1);

            // dead squares randomly turn human
            if(npcs[i][j].type == "dead" && Math.random() < 0.5){
                changeType(i,j,"human");
            }

            // some humans randomly become doctors
            if(npcs[i][j].type == "human" && Math.random() <= probabilities["humanBecomeDoctor"] && counts["doctor"] < 100){
                changeType(i,j,"doctor");
            } else if(npcs[i][j].type == "immune" && Math.random() <= probabilities["immuneBecomeDoctor"] && counts["doctor"] < 100){
                changeType(i,j,"doctor");
            }
        }
    }
    for(let key in counts){
        counts[key] = 0;
    }
    for(let i=0;i<=31;++i){
        for(let j=0;j<=31;++j){
            changeType(i, j, next_set[i][j].type);
            counts[npcs[i][j].type]++;

            canvas.fillStyle = (use_images ? "#fff" : npcs[i][j].color);
            canvas.fillRect(npcs[i][j].x-18, npcs[i][j].y-18, 16, 16);
            if(use_images)
                canvas.drawImage(images[npcs[i][j].type], npcs[i][j].x-19, npcs[i][j].y-19, 18, 18);  
        }
    }

    document.getElementById("humans").innerHTML = counts.human;
    document.getElementById("zombies").innerHTML = counts.zombie;
    document.getElementById("doctors").innerHTML = counts.doctor;
    document.getElementById("immune").innerHTML = counts.immune;
    document.getElementById("dead").innerHTML = counts.dead;

    for(let key in probabilities){
        probabilities[key] = document.getElementById(key).value;
    }

}, 100);