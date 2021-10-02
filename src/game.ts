import {Insect, Bee, Ant, GrowerAnt, ThrowerAnt, EaterAnt, ScubaAnt, GuardAnt} from './ants';

/**
 * Controls the insects on a board and environmental control features
 * */
class Place {
  protected ant:Ant;
  protected guard:GuardAnt;
  protected bees:Bee[] = [];

  constructor(readonly name:string,
              protected readonly water = false,
              private exit?:Place, 
              private entrance?:Place) {}

  getExit():Place { return this.exit; }

  setEntrance(place:Place){ this.entrance = place; }

  isWater():boolean { return this.water; }

    /**
     * Returns a guard ant.
     * */
  getAnt():Ant { 
    if(this.guard) 
      return this.guard;
    else 
      return this.ant;
  }

    /**
     * Returns an ant that is being guarded by a guard*/
  getGuardedAnt():Ant {
    return this.ant;
    }

  getBees():Bee[] { return this.bees; }

    /**
     * Determines the closest bee to an ant, if any exist in the current context.
     * @param maxDistance The length of the board
     * @param minDistance Sets the zero value above undefined
     * 
     */
  getClosestBee(maxDistance:number, minDistance:number = 0):Bee {
		let p:Place = this;
		for(let dist = 0; p!==undefined && dist <= maxDistance; dist++) {
			if(dist >= minDistance && p.bees.length > 0) {
				return p.bees[0];
      }
			p = p.entrance;
		}
		return undefined;
  }

    /**
     * Places an ant or guard on the selected location.
     * @param ant 
     * 
     */
  addAnt(ant:Ant):boolean {
    if(ant instanceof GuardAnt) {
      if(this.guard === undefined){
        this.guard = ant;
        this.guard.setPlace(this);
        return true;
      }
    }
    else 
      if(this.ant === undefined) {
        this.ant = ant;
        this.ant.setPlace(this);
        return true;
      }
    return false;
  }

    /**
     * Removes an ant from a selected location .
     * */
  removeAnt():Ant {
    if(this.guard !== undefined){
      let guard = this.guard;
      this.guard = undefined;
      return guard;
    }
    else {
      let ant = this.ant;
      this.ant = undefined;
      return ant;
    }
  }
    /**
     *  Adds Bee to game and the list of total bees at the indicted position.
     * @param bee Creates a new bee
     *
     */
  addBee(bee:Bee):void {
    this.bees.push(bee);
    bee.setPlace(this);
  }
    /**
     * Takes a bee off the board at the specified index so a random bee at the front isnt removed
     * @param bee
     * 
     */
  removeBee(bee:Bee):void {
    var index = this.bees.indexOf(bee);
    if(index >= 0){
      this.bees.splice(index,1);
      bee.setPlace(undefined);
    }
  }

    /**
     * Takes all bees off the board
     */
  removeAllBees():void {
    this.bees.forEach((bee) => bee.setPlace(undefined) );
    this.bees = [];
  }

    /**
     * Removes a bee from the game and closes any more bees from being created
     * @param bee
     * 
     */
  exitBee(bee:Bee):void {
    this.removeBee(bee);
    this.exit.addBee(bee);  
  }

    /**
     * Will remove any insect from the board regardless of type or affiliation.
     * @param insect
     * 
     */
  removeInsect(insect:Insect) {
    if(insect instanceof Ant){
      this.removeAnt();
    }
    else if(insect instanceof Bee){
      this.removeBee(insect);
    }
  }

    /**
     * Removes ants from water tile unless they are a Scuba ant that can exist on the environmental tile.
     */
  act() {
    if(this.water){
      if(this.guard){
        this.removeAnt();
      }
      if(!(this.ant instanceof ScubaAnt)){
        this.removeAnt();
      }
    }
  }
}


/**
 * Controls bees start and attack int othe ant colony*/
class Hive extends Place {
  private waves:{[index:number]:Bee[]} = {}

  constructor(private beeArmor:number, private beeDamage:number){
    super('Hive');
  }

    /**
     * Determines the turn a bee attack starts and the number of bees in the hive.
     * @param attackTurn  The wave bees start attacking
     * @param numBees The number of bees for the board
     * 
     * 
     */
  addWave(attackTurn:number, numBees:number):Hive {
    let wave:Bee[] = [];
    for(let i=0; i<numBees; i++) {
      let bee = new Bee(this.beeArmor, this.beeDamage, this);
      this.addBee(bee);
      wave.push(bee);
    }
    this.waves[attackTurn] = wave;
    return this;
  }

    /**
     * Sets a new board and adds bees to the attacking hive as well as progressing the state of the bees progression. 
     * @param colony   Represents the ant colony and the active board
     * @param currentTurn  The turn the game is on
     * 
     */
  invade(colony:AntColony, currentTurn:number): Bee[]{
    if(this.waves[currentTurn] !== undefined) {
      this.waves[currentTurn].forEach((bee) => {
        this.removeBee(bee);
        let entrances:Place[] = colony.getEntrances();
        let randEntrance:number = Math.floor(Math.random()*entrances.length);
        entrances[randEntrance].addBee(bee);
      });
      return this.waves[currentTurn];
    }
    else{
      return [];
    }    
  }
}

/**
 * This class represents the board and the players game space*/
class AntColony {
  private food:number;
  private places:Place[][] = [];
  private beeEntrances:Place[] = [];
  private queenPlace:Place = new Place('Ant Queen');
  private boosts:{[index:string]:number} = {'FlyingLeaf':1,'StickyLeaf':1,'IcyLeaf':1,'BugSpray':0}

  constructor(startingFood:number, numTunnels:number, tunnelLength:number, moatFrequency=0){
    this.food = startingFood;

    let prev:Place;
		for(let tunnel=0; tunnel < numTunnels; tunnel++)
		{
			let curr:Place = this.queenPlace;
      this.places[tunnel] = [];
			for(let step=0; step < tunnelLength; step++)
			{
        let typeName = 'tunnel';
        if(moatFrequency !== 0 && (step+1)%moatFrequency === 0){
          typeName = 'water';
				}
				
				prev = curr;
        let locationId:string = tunnel+','+step;
        curr = new Place(typeName+'['+locationId+']', typeName=='water', prev);
        prev.setEntrance(curr);
				this.places[tunnel][step] = curr;
			}
			this.beeEntrances.push(curr);
		}
  }

  getFood():number { return this.food; }

  increaseFood(amount:number):void { this.food += amount; }

  getPlaces():Place[][] { return this.places; }

  getEntrances():Place[] { return this.beeEntrances; }

  getQueenPlace():Place { return this.queenPlace; }

  queenHasBees():boolean { return this.queenPlace.getBees().length > 0; }

  getBoosts():{[index:string]:number} { return this.boosts; }

    /**
     * Creates the list and adds a boost 
     * @param boost The total number of boosts from a list
     * 
     */
  addBoost(boost:string){
    if(this.boosts[boost] === undefined){
      this.boosts[boost] = 0;
    }
    this.boosts[boost] = this.boosts[boost]+1;
    console.log('Found a '+boost+'!');
  }

    /**
     * Takes an ant and places it at the specified location based on colony criteria
     * @param ant A new instance of ant
     * @param place A specified location in the colonies lanes
     * 
     * 
     */
  deployAnt(ant:Ant, place:Place):string {
    if(this.food >= ant.getFoodCost()){
      let success = place.addAnt(ant);
      if(success){
        this.food -= ant.getFoodCost();
        return undefined;
      }
      return 'tunnel already occupied';
    }
    return 'not enough food';
  }

  removeAnt(place:Place){
    place.removeAnt();
  }

    /**
     * Adds a boost to an ant at a specified tile
     * @param boost The name of a Boost 
     * @param place The location to apply the boost
     * 
     */
  applyBoost(boost:string, place:Place):string {
    if(this.boosts[boost] === undefined || this.boosts[boost] < 1) {
      return 'no such boost';
    }
    let ant:Ant = place.getAnt();
    if(!ant) {
      return 'no Ant at location' 
    }
    ant.setBoost(boost);
    return undefined;
  }

    /**
     * Ensures ants are guarded every turn*/
  antsAct() {
    this.getAllAnts().forEach((ant) => {
      if(ant instanceof GuardAnt) {
        let guarded = ant.getGuarded();
        if(guarded)
          guarded.act(this);
      }
      ant.act(this);
    });    
  }

    /**
     * Makes bees sting ants on the specified tile*/
  beesAct() {
    this.getAllBees().forEach((bee) => {
      bee.act();
    });
  }
    /**
     * Clears all water tiles of not compatible insects*/
  placesAct() {
    for(let i=0; i<this.places.length; i++) {
      for(let j=0; j<this.places[i].length; j++) {
        this.places[i][j].act(); //All places accross board are checked for environmental effects
      }
    }    
  }

    /**
     * Lists all available ants on the board
     * */
  getAllAnts():Ant[] {
    let ants = [];
    for(let i=0; i<this.places.length; i++) {
      for(let j=0; j<this.places[i].length; j++) { // Second loop to iterate all tiles on both x and y axis
        if(this.places[i][j].getAnt() !== undefined) {
          ants.push(this.places[i][j].getAnt());
        }
      }
    }
    return ants;
  }

    /**
     * Lists all available bees on the board
     * */
  getAllBees():Bee[] {
    var bees = [];
    for(var i=0; i<this.places.length; i++){
      for(var j=0; j<this.places[i].length; j++){ //Second loop to iterate all tiles on both x and y axis
        bees = bees.concat(this.places[i][j].getBees());
      }
    }
    return bees;
  }
}

/**
 * Controls the flow of the game
 * */
class AntGame {
  private turn:number = 0;
  constructor(private colony:AntColony, private hive:Hive){}

    /**
     * Allows all insects to take turns and sets the game stage forward one turn
     * */
  takeTurn() {
    console.log('');
    this.colony.antsAct();
    this.colony.beesAct();
    this.colony.placesAct();
    this.hive.invade(this.colony, this.turn);
    this.turn++;
    console.log('');
  }

  getTurn() { return this.turn; }

    /**
     * Determines win state 
     * */
  gameIsWon():boolean|undefined {
    if(this.colony.queenHasBees()){
      return false;
    }
    else if(this.colony.getAllBees().length + this.hive.getBees().length === 0) {
      return true;
    }   
    return undefined;
  }

    /**
     * Puts desired ant down on the board
     * @param antType      The name of the ant unit
     * @param placeCoordinates  The desired location to place the ant
     * 
     */
  deployAnt(antType:string, placeCoordinates:string):string {
    let ant;
    switch(antType.toLowerCase()) {
      case "grower":
        ant = new GrowerAnt(); break;
      case "thrower":
        ant = new ThrowerAnt(); break;
      case "eater":
        ant = new EaterAnt(); break;
      case "scuba":
        ant = new ScubaAnt(); break;
      case "guard":
        ant = new GuardAnt(); break;
      default:
        return 'unknown ant type';
    }

    try {
      let coords = placeCoordinates.split(',');
      let place:Place = this.colony.getPlaces()[coords[0]][coords[1]];
      return this.colony.deployAnt(ant, place);
    } catch(e) {
      return 'illegal location';
    }
  }
    /**
     * Removes an ant from the board based off location
     * @param placeCoordinates The desired location of an ant
     * 
     */
  removeAnt(placeCoordinates:string):string {
    try {
      let coords = placeCoordinates.split(',');
      let place:Place = this.colony.getPlaces()[coords[0]][coords[1]];
      place.removeAnt();
      return undefined;
    }catch(e){
      return 'illegal location';
    }    
  }

    /**
     * Applys a boost to an ant at a given location
     * @param boostType  The name of the desired boost
     * @param placeCoordinates  The location to apply the boost
     * 
     */
  boostAnt(boostType:string, placeCoordinates:string):string {
    try {
      let coords = placeCoordinates.split(',');
      let place:Place = this.colony.getPlaces()[coords[0]][coords[1]];
      return this.colony.applyBoost(boostType,place);
    }catch(e){
      return 'illegal location';
    }    
  }

  getPlaces():Place[][] { return this.colony.getPlaces(); }
  getFood():number { return this.colony.getFood(); }
    getHiveBeesCount(): number { return this.hive.getBees().length; }
    /**
     * Lists all current available boosts
     * */
  getBoostNames():string[] { 
    let boosts = this.colony.getBoosts();
    return Object.keys(boosts).filter((boost:string) => {
      return boosts[boost] > 0;
    }); 
  }
}

export { AntGame, Place, Hive, AntColony }