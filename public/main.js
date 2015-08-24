'strict';
var bg=$('#bg'),
		fg=$('#fg'),
		tickCount=0,
		animCount=0,
		myGObject=null,
		bgCtx=bg.get(0).getContext('2d'),
		ctx=fg.get(0).getContext('2d'),
		gObjects=[],
		width=0,
		height=0,
		monsterImg=$('#monster-img').get(0),
		humanImg=$('#human-img').get(0),
		building1Img=$('#building-1-img').get(0),
		building2Img=$('#building-2-img').get(0),
		building3Img=$('#building-3-img').get(0),
		countdown=60*1E3/25
		countdownDiv=$('#countdown'),
		pts=0,
		ptsDiv=$('#pts'),
		bgm=$('#bgm').get(0),
		buildingDmgAudio=$('#building-dmg-audio').get(0),
		killHumanAudio=$('#kill-human-audio').get(0),
		buildingExplosionAudio=$('#building-explosion-audio').get(0),
		direction=[false,false,false,false],
		directionValue=[[0,-1],[1,0],[0,1],[-1,0]],
		spriteCanvas=$('#sprite-canvas').get(0),
		spriteCtx=spriteCanvas.getContext('2d'),
		tree1Img=$('#tree-1-img').get(0),
		goal=4E3,
		powerupAudio=$('#powerup-audio').get(0),
		terrain=$('#terrain'),
		terrainCtx=terrain.get(0).getContext('2d')

var d=Math.pow(50,.5)*2

//var humanSpriteData=spriteCtx.getImageData(0,0,28,29)

setTimeout(function(){
	spriteCanvas.width=28
	spriteCanvas.height=29
	spriteCtx.drawImage(humanImg,0,0)
//	humanSpriteData=spriteCtx.getImageData(0,0,28,29)
},1E3)

buildingExplosionAudio.volume=.1
buildingDmgAudio.volume=.1
killHumanAudio.volume=.1
powerupAudio.volume=.1

$(window).keydown(function(e){
	switch(e.keyCode){
		case 87:
		case 38:
			direction[0]=true
			break
		case 68:
		case 39:
			direction[1]=true
			break
		case 83:
		case 40:
			direction[2]=true
			break
		case 65:
		case 37:
			direction[3]=true
			break
	}
})

$(window).keyup(function(e){
	switch(e.keyCode){
		case 87:
		case 38:
			direction[0]=false
			break
		case 68:
		case 39:
			direction[1]=false
			break
		case 83:
		case 40:
			direction[2]=false
			break
		case 65:
		case 37:
			direction[3]=false
			break
	}
})
	
$('#game-over').click(function(){
	restart()
})

function GObject(){}
GObject.prototype={
	x:0,
	y:0,
	rSq:50,
	hp:50,
	get r(){return Math.pow(this.rSq,.5)},
	draw:function(){
		ctx.beginPath()
		ctx.arc(this.x,this.y,this.r,0,Math.PI*2)
		ctx.fill()
	},
	tick:function(){this.rSq=this.hp}
}

function SpeechBubble(){
	var speeches=[
		'AHHHH!',
		'You MONSTER',
		'HELP!!',
		'My arm!',
		'RUN FOR YOUR LIVES!!!',
		'My leg!',
		'Please let me live! I beg you!',
		"Where's my arm?!?",
		'AAaaRaagh',
		"I can't see!!!",
		'RAAAWR!!!',
		'WHyyyyyyyyyyyyyyyyy',
		'Mommy!',
		'Daddy?',
		"Tell my wife I love her!",
		'Cough cough',
		'NoooOOo',
		'WAAAAAH',
		'Let me liiive!',
		'Ouch, my balls!',
		'My butthole',
		'HAHAHAHAHAHAHAHAHAHAHA',
		'Slender Man told me to',
		'Fire!',
		'Atleast I die an exciting death',
		'What did I DO to YOU???',
		'Here take my wallet',
		"Don't touch me there",
		"I thought you were supposed to stay behind the camera",
		"The Lord has forsaken me",
		"Don't hit mommy",
		"In nomine Patris et Filii et Spiritus Sancti"
		]
	this.text=speeches[(speeches.length*Math.pow(Math.random(),2))|0]

}
SpeechBubble.prototype=Object.create(GObject.prototype,{
	text:{value:"",writable:true},
	tick:{value:function(){
		this.hp--
	}},
	draw:{value:function(){
			var x=this.x+Math.random()*2-1,
					y=this.y+Math.random()*2-1
			ctx.fillText(this.text,x,y);
			ctx.strokeText(this.text,x,y);
	}}
})


function Tree1(){
	this.hp=150*(1+Math.random()*2)
}
Tree1.prototype=Object.create(GObject.prototype,{
	img:{value:$('#tree-1-img').get(0)},
	draw:{value:function(){
		if(animCount%2){
			bgCtx.drawImage(this.img,this.x-this.r,this.y-this.r,this.r*2,this.r*2)
		}
	}}
})

function Tree2(){
	this.hp=150*(1+Math.random()*2)
}
Tree2.prototype=Object.create(GObject.prototype,{
	img:{value:$('#tree-2-img').get(0)},
	draw:{value:function(){
		if(animCount%2){
			bgCtx.drawImage(this.img,this.x-this.r,this.y-this.r,this.r*2,this.r*2)
		}
	}}
})

function Projectile(){}
Projectile.prototype=Object.create(GObject.prototype,{
	angle:{writable:true,value:0},
	tick:{value:function(){
		this.hp--
		this.x+=Math.cos(this.angle)*4
		this.y+=Math.sin(this.angle)*4
	}},
})


function Stone(){}
Stone.prototype=Object.create(Projectile.prototype,{
	rSq:{value:5},
	img:{value:$('#stone-img').get(0)},
	draw:{value:function(){
		ctx.drawImage(this.img,this.x-this.r,this.y-this.r,this.r*2,this.r*2)
	}}
})

function Spear(){}
Spear.prototype=Object.create(Projectile.prototype,{
	hp:{writable:true,value:200},
	rSq:{value:40},
	img:{value:$('#spear-img').get(0)},
	draw:{value:function(){
		ctx.save()
		ctx.translate(this.x-this.r,this.y-this.r)
		ctx.rotate(this.angle)
		ctx.drawImage(this.img,0,0,this.r*2,this.r*2)
		//ctx.drawImage(this.img,this.x-this.r,this.y-this.r,this.r*2,this.r*2)
		ctx.restore()
	}}
})


function Monster(){
	GObject.apply(this,arguments)
}
Monster.prototype=Object.create(GObject.prototype,{
	deadImg:{value:$('#monster-dead-img').get(0)},
	hp:{writable:true,value:300},
	test:{value:150},
	tick:{value:function(){
		if(this.rSq>300)
			this.hp/=1.01
		GObject.prototype.tick.apply(this)
	}},
	draw:{value:function(){
		if(countdown){
			ctx.drawImage(monsterImg,this.x-this.r+Math.random()*2-1,this.y-this.r+Math.random()*2-1,this.r*2,this.r*2)
		}else{
			ctx.drawImage(this.deadImg,this.x-this.r,this.y-this.r,this.r*2,this.r*2)
		}
	}}
})

function Human(){}
Human.prototype=Object.create(GObject.prototype,{
	projectile:{writable:true,value:null},
	projectileCooldown:{writable:true,value:0},
	tick:{value:function(){
		if(myGObject){
			var distSq=Math.pow(myGObject.x-this.x,2)+Math.pow(myGObject.y-this.y,2)-myGObject.rSq
			if(distSq<this.rSq+1E5){ //view range
				var angle=Math.atan2(myGObject.y-this.y,myGObject.x-this.x)
			
				if(this.projectile&&distSq>this.rSq+1E3){
					if(this.projectile==Stone&&distSq>this.rSq+1E4
						||this.projectile==Spear&&distSq>this.rSq+5E4
					){
						this.x+=Math.cos(angle)	
						this.y+=Math.sin(angle)
					}else{
						if(!this.projectileCooldown){
							var projectile=new this.projectile
							projectile.angle=angle
							projectile.x=this.x
							projectile.y=this.y
							gObjects.push(projectile)
							this.projectileCooldown+=100+(Math.random()*100|0)
						}
					}
				}else{
					this.x+=Math.cos(angle+Math.PI)	
					this.y+=Math.sin(angle+Math.PI)
				}
			}
		}
		this.x+=Math.random()*2-1	
		this.y+=Math.random()*2-1	
	
		if(this.projectileCooldown)
			this.projectileCooldown--
	}},
	draw:{value:function(){
		//ctx.putImageData(humanSpriteData,0,0,this.x-this.r,this.y-this.r,this.r*2,this.r*2)
		//ctx.putImageData(humanSpriteData,this.x-this.r,this.y-this.r)
		if(!myGObject||Math.pow(this.x-myGObject.x,2)+Math.pow(this.y-myGObject.y,2)<Math.pow(height/3,2)
		){
			ctx.drawImage(spriteCanvas,this.x-this.r,this.y-this.r,this.r*2,this.r*2)
		}else if(animCount%2){
			bgCtx.drawImage(spriteCanvas,this.x-this.r,this.y-this.r,this.r*2,this.r*2)
		}
		//ctx.drawImage(humanImg,this.x-this.r,this.y-this.r,this.r*2,this.r*2)
	}}
})

function Building(){
	this.humanCount=(this.hp/10)|0
	this.rSq=this.hp*(1+Math.random()*2)
}
Building.prototype=Object.create(GObject.prototype,{
	humanCount:{value:0,writable:true},
	tick:{value:function(){
		if(!(tickCount%50)&&this.humanCount<this.rSq/10)
			this.humanCount++
	}}
})

function Building1(){
	Building.apply(this,arguments)
}
Building1.prototype=Object.create(Building.prototype,{
	hp:{value:1E3},
	draw:{value:function(){
		if(animCount%2)
			bgCtx.drawImage(building1Img,this.x-this.r,this.y-this.r,this.r*2,this.r*2)
	}}
})

function Building2(){
	Building.apply(this,arguments)
}
Building2.prototype=Object.create(Building.prototype,{
	hp:{value:4E3},
	draw:{value:function(){
		if(animCount%2)
			bgCtx.drawImage(building2Img,this.x-this.r,this.y-this.r,this.r*2,this.r*2)
	}}
})

function Building3(){
	Building.apply(this,arguments)
}
Building3.prototype=Object.create(Building.prototype,{
	hp:{value:100},
	draw:{value:function(){
		if(animCount%2)
			bgCtx.drawImage(building3Img,this.x-this.r,this.y-this.r,this.r*2,this.r*2)
	}}
})

function Building4(){
	Building.apply(this,arguments)
}
Building4.prototype=Object.create(Building.prototype,{
	img:{value:$('#building-4-img').get(0)},
	hp:{value:1E3},
	draw:{value:function(){
		if(animCount%2)
			bgCtx.drawImage(this.img,this.x-this.r,this.y-this.r,this.r*2,this.r*2)
	}}
})

function Building5(){
	Building.apply(this,arguments)
}
Building5.prototype=Object.create(Building.prototype,{
	img:{value:$('#building-5-img').get(0)},
	hp:{value:1E3},
	draw:{value:function(){
		if(animCount%2)
			bgCtx.drawImage(this.img,this.x-this.r,this.y-this.r,this.r*2,this.r*2)
	}}
})


function BloodPool(){
	this.hp+=Math.random()*50
}
BloodPool.prototype=Object.create(GObject.prototype,{
	hp:{writable:true,value:5},
	tick:{value:function(){
		this.hp/=1.0001
		GObject.prototype.tick.apply(this)
	}},
	draw:{value:function(){
		if(animCount%2){
			bgCtx.beginPath()
			bgCtx.arc(this.x,this.y,this.r,0,Math.PI*2)
			bgCtx.fill()
		}
	}}
})

function DeadHuman(){
	this.hp+=Math.random()*10
}
DeadHuman.prototype=Object.create(GObject.prototype,{
	hp:{writable:true,value:70},
	tick:{value:function(){
		this.hp/=1.0001
		GObject.prototype.tick.apply(this)
	}},
	draw:{value:function(){
		if(animCount%2){
			bgCtx.save()
			bgCtx.translate(this.x-this.r,this.y-this.r)
			bgCtx.rotate(Math.PI/2)
			bgCtx.drawImage(spriteCanvas,0,0,this.r*2,this.r*2)
			bgCtx.restore()
		}
	}}
})


function resize(){
	width=window.innerWidth
	height=window.innerHeight
	fg.attr('width',width)
	fg.attr('height',height)
	ctx.fillStyle='#000000'

	bg.attr('width',width)
	bg.attr('height',height)
	ctx.strokeStyle='#BB2200'
	ctx.fillStyle='#000000'
	ctx.font='30px Reenie Beanie'
	ctx.textAlign='center'

	terrain.attr('width',width)
	terrain.attr('height',height)
	terrainCtx.fillStyle='rgba(255,0,0,.3)'
}
$(window).resize(resize)
resize()

function reloadWorld(){
	gObjects=[]

	for(var i=0;i<105;i++){
		var gObject=new Building3
		gObject.x=(Math.random()*width)|0
		gObject.y=(Math.random()*height)|0
		gObjects.push(gObject)
	}

	for(var i=0;i<35;i++){
		var gObject=new Building1
		gObject.x=(Math.random()*width)|0
		gObject.y=(Math.random()*height)|0
		gObjects.push(gObject)
	}

	for(var i=0;i<3;i++){
		var gObject=new Building2
		gObject.x=(Math.random()*width)|0
		gObject.y=(Math.random()*height)|0
		gObjects.push(gObject)
	}
	
	for(var i=0;i<30;i++){
		var gObject=new Tree1 
		gObject.x=(Math.random()*width)|0
		gObject.y=(Math.random()*height)|0
		gObjects.push(gObject)
	}

	for(var i=0;i<10;i++){
		var gObject=new Tree2 
		gObject.x=(Math.random()*width)|0
		gObject.y=(Math.random()*height)|0
		gObjects.push(gObject)
	}

	for(var i=0;i<7;i++){
		var gObject=new Building4
		gObject.x=(Math.random()*width)|0
		gObject.y=(Math.random()*height)|0
		gObjects.push(gObject)
	}

	for(var i=0;i<2;i++){
		var gObject=new Building5
		gObject.x=(Math.random()*width)|0
		gObject.y=(Math.random()*height)|0
		gObjects.push(gObject)
	}



	gObjects.sort(function(a,b){return a.y+a.r-b.y-b.r})
}
reloadWorld()

function restart(e){
	bgm.volume=.5
	reloadWorld()
	$('#game-over').hide()
	pts=0
	goal=4E3
	countdown=60*1E3/25
	myGObject=new Monster
	myGObject.x=width/2
	myGObject.y=height/2
	gObjects.push(myGObject)
}
fg.click(restart)

function tick(){
	if(myGObject&&countdown){
		if(pts>goal){
			countdown+=10*1E3/25
			goal*=2
			powerupAudio.play()
		}

		if(direction.some(function(d){return d})){
			var totalCoord=direction
						.map(function(a,i){return direction[i]?directionValue[i]:[0,0]})
						.reduce(function(a,b){return [a[0]+b[0],a[1]+b[1]]}),
					directionCount=direction.reduce(function(a,b){return a+b}),
					avgCoord=[totalCoord[0]/directionCount,totalCoord[1]/directionCount],
					angle=Math.atan2(avgCoord[1],avgCoord[0]),
					x=myGObject.x+Math.cos(angle)*3,
					y=myGObject.y+Math.sin(angle)*3
			
			if(!gObjects
					.some(function(o,i){
						if(
							o instanceof Building 
							&&Math.pow(o.x-x,2)
							+Math.pow(o.y-y,2)
							<myGObject.rSq+o.rSq
						){
							if(o.rSq*5>myGObject.rSq){
								if(o.humanCount){
									var human=new Human

									if(Math.random()<.05){
										human.projectile=Stone
									}else if(Math.random()<.05){
										human.projectile=Spear
									}

									human.x=o.x+o.r*Math.random()*2-o.r
									human.y=o.y+o.r*Math.random()
									gObjects.push(human)
									o.humanCount--
								}
								o.x+=Math.random()*2-1
								o.y+=Math.random()*2-1

								myGObject.x+=Math.cos(angle)
								myGObject.y+=Math.sin(angle)
						
								return true
							}else{
								gObjects.splice(i,1)
								buildingExplosionAudio.pause()
								buildingExplosionAudio.currentTime=0.0
								buildingExplosionAudio.play()
							}
						}
					})
				){
				myGObject.x=x
				myGObject.y=y
			}		


		}
		countdown--
		if(!countdown){
			bgm.volume=1
			$('#game-over-score').text(pts)
			$('#game-over').show()
		}
	}

	tickCount++
	gObjects.forEach(function(gObject,i){
		gObject.tick()
		if(myGObject
			&&Math.pow(myGObject.x-gObject.x,2)+Math.pow(myGObject.y-gObject.y,2)<myGObject.rSq
		){
			if(gObject instanceof Human){
				if(Math.random()<.6){
					terrainCtx.save()
					terrainCtx.translate(gObject.x-7,gObject.y-7)
					terrainCtx.rotate(Math.PI/2)
					terrainCtx.drawImage(spriteCanvas,0,0,15,15)
					terrainCtx.restore()

					if(Math.random()<.2){
						speechBubble=new SpeechBubble
						speechBubble.x=gObject.x
						speechBubble.y=gObject.y
						gObjects.push(speechBubble)
					}
				}

				terrainCtx.beginPath()
				terrainCtx.arc(gObject.x,gObject.y,2+Math.random()*10,0,Math.PI*2)
				terrainCtx.fill()

				pts+=gObject.hp
				myGObject.hp+=gObject.hp
				gObjects.splice(i,1)
				killHumanAudio.pause()
				killHumanAudio.currentTime=0.0
				killHumanAudio.play()
			}else if(gObject instanceof Projectile){
				myGObject.hp--
				gObjects.splice(i,1)
				buildingDmgAudio.pause()
				buildingDmgAudio.currentTime=0.0
				buildingDmgAudio.play()
			}
		}
		
		if(gObject.hp<1){
			gObjects.splice(i,1)
		}

	})

	if(!(tickCount%64)&&gObjects.filter(function(o){return o instanceof Human}).length<5E3){
		for(var j=0;j<=Math.pow(gObjects.length,.5);j++){
			var gObject=new Human 

			if(Math.random()<.3){
				gObject.projectile=Stone
			}else if(Math.random()<.1){
				gObject.projectile=Spear
			}
			gObject.x=Math.random()*width
			gObject.y=Math.random()*height
			gObjects.push(gObject)
		}
		if(!(tickCount%256)){
			if(Math.random()<.5){
				var gObject=new Tree1
				gObject.x=(Math.random()*width)|0
				gObject.y=(Math.random()*height)|0
				gObjects.push(gObject)
			}else if(Math.random()<.5){
				var gObject=new Tree2 
				gObject.x=(Math.random()*width)|0
				gObject.y=(Math.random()*height)|0
				gObjects.push(gObject)
			}else if(Math.random()<.5){
				var gObject=new Building3
				gObject.x=(Math.random()*width)|0
				gObject.y=(Math.random()*height)|0
				gObjects.push(gObject)
			}else if(Math.random()<.5){
				var gObject=new Building1
				gObject.x=(Math.random()*width)|0
				gObject.y=(Math.random()*height)|0
				gObjects.push(gObject)
			}else if(Math.random()<.5){
				var gObject=new Building2
				gObject.x=(Math.random()*width)|0
				gObject.y=(Math.random()*height)|0
				gObjects.push(gObject)
			}
		}
	}
}
setInterval(tick,25)

function anim(){
	animCount++

	if(animCount%2){
		bgCtx.clearRect(0,0,width,height)
		countdownDiv.text(Math.round(countdown*25/1E3)+' seconds left')
		ptsDiv.text('Score: '+pts+'pts; Goal: '+goal+'pts (+10 seconds)')
	}
	ctx.clearRect(0,0,width,height)
	gObjects.forEach(function(gObject){
			gObject.draw()
	})

	requestAnimationFrame(anim)
}
anim()
