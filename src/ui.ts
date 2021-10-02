import {AntGame, AntColony, Place, Hive} from './game';
import {Ant, EaterAnt, GuardAnt} from './ants';

import vorpal = require('vorpal');
import chalk = require('chalk');
import _ = require('lodash');

/**
 * The Vorpal library for command-line interaction
 */
const Vorpal = vorpal();

/**
 * Displays the game to the user on the shell
 * @param game The current game state
 */
export function showMapOf(game:AntGame){
  console.log(getMap(game));
}

/**
 * This function creates a game space on the command line.
 * @param game
 */
function getMap(game:AntGame) {
  let places:Place[][] = game.getPlaces();
  let tunnelLength = places[0].length;
  let beeIcon = chalk.bgYellow.black('B');
   
  let map = '';
    //Creates a heading of instructions on the screen
  map += chalk.bold('The Colony is under attack!\n');
  map += `Turn: ${game.getTurn()}, Food: ${game.getFood()}, Boosts available: [${game.getBoostNames()}]\n`;
    map += '     ' + _.range(0, tunnelLength).join('    ') + '      Hive' + '\n';

    //Lays out game tiles on screen
  for(let i=0; i<places.length; i++){
    map += '    '+Array(tunnelLength+1).join('=====');
   
    if(i===0){
      map += '    ';
      let hiveBeeCount = game.getHiveBeesCount();
      if(hiveBeeCount > 0){
        map += beeIcon;
        map += (hiveBeeCount > 1 ? hiveBeeCount : ' ');
      }
    }
    map += '\n';

    map += i+')  ';
      
    for(let j=0; j<places[i].length; j++){ 
      let place:Place = places[i][j];

      map += iconFor(place.getAnt());
      map += ' '; 

        //Gets the bees and creates a hive
      if(place.getBees().length > 0){
        map += beeIcon;
        map += (place.getBees().length > 1 ? place.getBees().length : ' ');
      } else {
        map += '  ';
      }
      map += ' '; 
    }
    map += '\n    ';
    for(let j=0; j<places[i].length; j++){
      let place = places[i][j];
      if(place.isWater()){
        map += chalk.bgCyan('~~~~')+' ';
      } else {
        map += '==== ';
      }
    }
    map += '\n';
  }
  map += '     '+_.range(0,tunnelLength).join('    ')+'\n';

  return map;
}


function iconFor(ant:Ant){
  if(ant === undefined){ return ' ' };
  let icon:string;
  switch(ant.name){
    case "Grower":
      icon = chalk.green('G'); break;
    case "Thrower":
      icon = chalk.red('T'); break;
    case "Eater":
      if((<EaterAnt>ant).isFull())
        icon = chalk.yellow.bgMagenta('E');
      else
        icon = chalk.magenta('E');
      break;
    case "Scuba":
      icon = chalk.cyan('S'); break;
    case "Guard":
      let guarded:Ant = (<GuardAnt>ant).getGuarded();
      if(guarded){
        icon = chalk.underline(iconFor(guarded)); break;
      } else {
        icon = chalk.underline('x'); break;
      }
    default:
      icon = '?';
  }
  return icon;
}

/**
 * This function processes the commands a user inputs to the game
 * @param game The existing game 
 */
export function play(game:AntGame) {
  Vorpal
    .delimiter(chalk.green('AvB $')) // Dispalys a green ants vs bees terminal statement header
    .log(getMap(game)) 
    .show(); //shows the game 
    // This command redisplays the current game board in the current state
  Vorpal
    .command('show', 'Shows the current game board.')
    .action(function(args, callback){
      Vorpal.log(getMap(game));
      callback();
    });
    //This command adds an ant to the colony
  Vorpal
    .command('deploy <antType> <tunnel>', 'Deploys an ant to tunnel (as "row,col" eg. "0,6").')
    .alias('add', 'd') //Alternative names
    .autocomplete(['Grower','Thrower','Eater','Scuba','Guard']) // Tab function to autofill
    .action(function(args, callback) {
      let error = game.deployAnt(args.antType, args.tunnel)
      if(error){
        Vorpal.log(`Invalid deployment: ${error}.`); // lists the an that is being placed in error
      }
      else {
        Vorpal.log(getMap(game));
      }
      callback();
    });
    //This command removes a specified ant from the board
  Vorpal
    .command('remove <tunnel>', 'Removes the ant from the tunnel (as "row,col" eg. "0,6").')
    .alias('rm')
    .action(function(args, callback){
      let error = game.removeAnt(args.tunnel); //remooves an ant
      if(error){
        Vorpal.log(`Invalid removal: ${error}.`);
      }
      else {
        Vorpal.log(getMap(game));
      }
      callback();
    });

    //This command applies a specified boost to an ant on the board
  Vorpal
    .command('boost <boost> <tunnel>', 'Applies a boost to the ant in a tunnel (as "row,col" eg. "0,6")')
    .alias('b')
    .autocomplete({data:() => game.getBoostNames()}) //Auto fill names from current boost list
    .action(function(args, callback){
      let error = game.boostAnt(args.boost, args.tunnel);
      if(error){
        Vorpal.log(`Invalid boost: ${error}`);
      }
      callback();
    })

    //this command updates the game state to the next turn
  Vorpal
    .command('turn', 'Ends the current turn. Ants and bees will act.')
    .alias('end turn', 'take turn','t')
    .action(function(args, callback){
      game.takeTurn();
      Vorpal.log(getMap(game));
      let won:boolean = game.gameIsWon();
      if(won === true){
        Vorpal.log(chalk.green('Yaaaay---\nAll bees are vanquished. You win!\n'));
      }
      else if(won === false){
        Vorpal.log(chalk.yellow('Bzzzzz---\nThe ant queen has perished! Please try again.\n'));
      }
      else {
        callback();
      }
    });
}
