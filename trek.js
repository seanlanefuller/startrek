/*
 * superstartrek.js
 *
 * Javascript Super Star Trek v0.x
 *
 * Port of classic 1970s BASIC computer game.
 * Modifications and html wrapper by Sean Lane Fuller Copyright (C) 2025
 * based onJavascript port Copyright (C) 2009 Roberto Nerici
 * based on C port Copyright (C) 1996 Chris Nystrom
 * 
 * This program is free software; you can redistribute it and/or modify
 * in any way that you wish. _Star Trek_ is a trademark of Paramount
 * I think.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 */

/* Global variables from C version */
var current_stardate;                              // Current Stardate (used as real)
var start_stardate;                             // Start stardate (used as int)
var mission_duration;                             // Allowed time for mission
var is_docked = 0;                         // Docked flag (0 = not docked)
var is_repairing = 0;                         // Damage repair flag
var energy = 0;                          // Current Energy (used as int)
var max_energy = 3000;                      // Starting Energy
var torpedoes = 0;                          // Photon Torpedoes left
var max_torpedoes = 10;                        // Photon Torpedo capacity
var shields = 0;                          // Current shield value
var damage_array = dim_array(9, 0);            // Damage Array (used as array of reals)
var quadrant_x, quadrant_y;                         // Quadrant Position of Enterprise
var r1, r2;                         // Temporary variables (esp Location Corrdinates)
var z1, z2;                         // Temporary Sector Coordinates
var quadrant_klingons = 0;                         // Klingons in Quadrant
var start_klingons = 0;                         // Klingons at start
var total_klingons = 0;                         // Total Klingons left
var klingon_data = dim_matrix(4, 4, 0);        // Klingon Data (for the current quadrant)
var galaxy_grid = dim_matrix(9, 9, 0);        // Galaxy
var galaxy_history = dim_matrix(9, 9, 0);        // Cumulative Record of Galaxy
var z4;                             // Temporary quadrant coordinate (x?)
var z5;                             // Temporary quadrant coordinate (y?)
var quadrant_bases = 0;                         // Starbases in Quadrant
var total_bases = 0;                         // Total Starbases
var sector_x, sector_y;                         // Current Sector Position of Enterprise (used as reals)
var sQ = dim_array(194, " ");       // Visual Display of Quadrant (array, but used as string)
var g5;                             // Quadrant name flag (used as int)
var x, y, x1, x2;                   // Navigational coordinates (used as reals)
var c1;                             // ?
var n;                              // Number of secors to travel
var sG2;                            // Temporary string
var a, c1;                          // Used by Library Computer

var c = dim_matrix(3, 10, 0);       /* modified to match MS BASIC array indicies */
c[1] = [0, 0, -1, -1, -1, 0, 1, 1, 1, 0];
c[2] = [1, 1, 1, 0, -1, -1, -1, 0, 1, 1];

/* New global variables */
var debug_on = 1;                   // enabled extra output
var easy_game = 0;                  // reduces damage
var small_game = 0;                 // game with less klingons
var usercommandhandler;             // function to continue with after receiving user input
var any_key_is_input = false;
var output = "";
var commandstring = "";
var prompt_string = "Command:";

/************************************************************************
** Main
************************************************************************/
function main() {
  intro();
  new_game();
}

/************************************************************************
** Major functions (the bulk of the game in other words)
************************************************************************/
function intro() {
  printf("\n");
  printf(" *************************************\n");
  printf(" *      * * Super Star Trek * *      *\n");
  printf(" *************************************\n\n");

  easy_game = 1;
  small_game = 1;

  printf("\n\n");
  printf("                         ------*------\n");
  printf("         -------------   `---  ------'\n");
  printf("         `-------- --'      / /\n");
  printf("                  \\\\-------  --\n");
  printf("                  '-----------'\n");
  printf("\n       The USS Enterprise --- NCC - 1701\n\n\n");
}

function new_game() {
  var sTemp;

  initialize();

  any_key_is_input = true;
  set_commandhandler(new_game2, " ");
  //printf("Press enter to accept command. ");
}

function new_game2() {
  any_key_is_input = false;
  reset_commandhandler();
  clear_output();
  new_quadrant();
  short_range_scan();
  if (shields + energy <= 10 && (energy < 10 || damage_array[7] < 0)) {
    printf("\n** Fatal Error **   ");
    printf("You've just stranded your ship in space.\n\n");
    printf("You have insufficient maneuvering energy,");
    printf(" and Shield Control is presently\n");
    printf("incapable of cross circuiting to engine room!!\n\n");
    end_of_time();
  }
}

function handle_command(command) {
  printf("\n");
  switch (command) {
    case "nav": {
      course_control();
      break;
    }
    case "srs": {
      printf("Peforming short range scan sir.\n");
      if (window.soundManager) window.soundManager.beep();
      short_range_scan();
      break;
    }
    case "lrs": {
      long_range_scan();
      break;
    }
    case "pha": {
      phaser_control();
      break;
    }
    case "tor": {
      photon_torpedoes();
      break;
    }
    case "she": {
      sheild_control();
      break;
    }
    case "dam": {
      damage_control();
      break;
    }
    case "com": {
      library_computer();
      break;
    }
    case "xxx": {
      resign_commision();
      break;
    }
    case "help": {
      print_help();
      break;
    }
    default: {
      printf("Enter one of the following:\n\n");
      print_help();
      printf("\n");
    }
  }

  display();
}

function initialize() {
  /* InItialize time */
  current_stardate = (get_rand(20) + 20) * 100;
  start_stardate = current_stardate;
  mission_duration = 25 + get_rand(10);           // set allowed time for mission

  /* Initialize Enterprise */
  is_docked = 0;                           // clear docked flag
  energy = max_energy;                           // set current energy to starting value
  torpedoes = max_torpedoes;                           // set current photorp count to max
  shields = 0;                            // set current shield value

  quadrant_x = function_r();                // set position of the Enterprise
  quadrant_y = function_r();
  sector_x = function_r();
  sector_y = function_r();

  for (i = 1; i <= 8; i++)          // clear the damage array
    damage_array[i] = 0.0;

  /* Setup What Exists in Galaxy */
  total_klingons = 0;                           // clear number of klingons
  total_bases = 0;                           // clear number of starbases

  for (i = 1; i <= 8; i++)
    for (j = 1; j <= 8; j++) {
      quadrant_klingons = 0;
      galaxy_history[i][j] = 0;
      r1 = get_rand(100);

      if (small_game) {
        if (r1 > 98)
          quadrant_klingons = 3;
        else if (r1 > 96)
          quadrant_klingons = 2;
        else if (r1 > 85)
          quadrant_klingons = 1;
      }
      else {
        if (r1 > 98)
          quadrant_klingons = 3;
        else if (r1 > 95)
          quadrant_klingons = 2;
        else if (r1 > 80)
          quadrant_klingons = 1;
      }

      total_klingons = total_klingons + quadrant_klingons;
      quadrant_bases = 0;

      if (get_rand(100) > 96)
        quadrant_bases = 1;

      total_bases = total_bases + quadrant_bases;

      galaxy_grid[i][j] = quadrant_klingons * 100 + quadrant_bases * 10 + function_r();
    }

  if (total_klingons > mission_duration)
    mission_duration = total_klingons + 1;

  if (total_bases == 0) {
    if (galaxy_grid[quadrant_x][quadrant_y] < 200) {
      galaxy_grid[quadrant_x][quadrant_y] = galaxy_grid[quadrant_x][quadrant_y] + 100;
      total_klingons++;
    }

    galaxy_grid[quadrant_x][quadrant_y] = galaxy_grid[quadrant_x][quadrant_y] + 10;
    total_bases++;

    quadrant_x = function_r();
    quadrant_y = function_r();
  }

  start_klingons = total_klingons;

  printf("Your orders are as follows:\n\n");
  printf("   Destroy the " + total_klingons + " Klingon warships which have invaded\n");
  printf("   the galaxy before they can attack Federation Headquarters\n");
  printf("   on stardate " + (start_stardate + mission_duration) + ". This gives you " + mission_duration + " days.\n");
  if (total_bases == 1) {
    printf("   There is 1 starbase in the galaxy for resupplying your ship.\n\n");
  }
  else if (total_bases > 1) {
    printf("   There are " + total_bases + " starbases in the galaxy for resupplying your ship.\n\n");
  }
}

function new_quadrant() {
  z4 = quadrant_x;                          // Temporary quadrant coordinates
  z5 = quadrant_y;
  quadrant_klingons = 0;                           // assume no klingons in quadrant for now
  quadrant_bases = 0;                           // assume no starbases in quadrant for now
  quadrant_stars = 0;                           // assume no stars in quadrant for now
  g5 = 0;                           // clear quadrant name flag 
  d4 = get_rand(100) / 100 / 50;    // set damage repair time (odd!)
  galaxy_history[quadrant_x][quadrant_y] = galaxy_grid[quadrant_x][quadrant_y];            // update logged galaxy, we know this quadrant

  if (quadrant_x >= 1 && quadrant_x <= 8 && quadrant_y >= 1 && quadrant_y <= 8) {
    var sG2 = quadrant_name();

    if (start_stardate != current_stardate) {
      printf("Now entering " + sG2 + " quadrant...\n\n");
    }
    else {
      printf("\nYour mission begins with your starship located\n");
      printf("in the galactic quadrant " + sG2 + ".\n\n");
    }
  }

  quadrant_klingons = cint(galaxy_grid[quadrant_x][quadrant_y] * .01);           // how many klingons in this quadrant?
  quadrant_bases = cint(galaxy_grid[quadrant_x][quadrant_y] * .1 - 10 * quadrant_klingons);  // how many starbases in this quadrant?
  quadrant_stars = galaxy_grid[quadrant_x][quadrant_y] - 100 * quadrant_klingons - 10 * quadrant_bases; // how many stars in this quadrant

  if (quadrant_klingons > 0) {
    printf("Combat Area  Condition Red\n");
    if (window.soundManager) window.soundManager.toggleRedAlert(true);

    if (shields <= 200) {
      printf("Shields Dangerously Low\n");
    }
  }
  else {
    printf("Condition Green\n");
    if (window.soundManager) window.soundManager.toggleRedAlert(false);
  }

  for (i = 1; i <= 3; i++) {
    klingon_data[i][1] = 0;
    klingon_data[i][2] = 0;
    klingon_data[i][3] = 0;
  }

  for (i = 0; i <= 192; i++) {
    sQ[i] = ' ';
  }
  sQ[193] = 0;

  /* Position Enterprise, then Klingons, Starbases, and stars */
  z1 = sector_x;
  z2 = sector_y;
  insert_in_quadrant("<*>");

  // Place klingons into empty parts of the quadrant
  if (quadrant_klingons > 0) {
    for (i = 1; i <= quadrant_klingons; i++) {
      find_empty_place();

      z1 = r1;
      z2 = r2;
      insert_in_quadrant("+K+");

      klingon_data[i][1] = r1;
      klingon_data[i][2] = r2;
      klingon_data[i][3] = 100 + get_rand(200);
    }
  }

  // Place starbase into empty part of the quadrant
  if (quadrant_bases > 0) {
    find_empty_place();

    z1 = r1;
    z2 = r2;
    insert_in_quadrant(">!<");

    b4 = r1;
    b5 = r2;
  }

  // Place stars into empty parts of the quadrant
  for (i = 1; i <= quadrant_stars; i++) {
    find_empty_place();

    z1 = r1;
    z2 = r2;
    insert_in_quadrant(" * ");
  }
}

function course_control() {
  printf("\n");
  printf("     4  3  2    \n");
  printf("      \\ | /     \n");
  printf("   5 -- * -- 1  \n");
  printf("      / | \\     \n");
  printf("     6  7  8    \n");
  printf("\n");
  set_commandhandler(course_control2, "Course (0-9)?");
}

function course_control2(input) {
  if (window.soundManager) window.soundManager.warp();
  c1 = parseFloat(input);
  reset_commandhandler();

  printf("\n");

  if (c1 === 9.0) c1 = 1.0;

  if (c1 < 0 || c1 > 9.0) {
    printf("Lt. Sulu reports:\n");
    printf("  Incorrect course data, sir!\n\n");
    return;
  }

  var max_warp = "9.0";
  if (damage_array[1] < 0.0) max_warp = "0.2";

  set_commandhandler(course_control3, "Warp Factor (0-" + max_warp + ")?");
}

function course_control3(sTemp) {
  w1 = parseFloat(sTemp);
  reset_commandhandler();
  var q4, q5;

  printf("\n\n");

  if (damage_array[1] < 0.0 && w1 > 0.21) {
    printf("Warp Engines are damaged. ");
    printf("Maximum speed = Warp 0.2.\n\n");
    return;
  }

  if (w1 <= 0.0) return;

  if (w1 > 8.1) {
    printf("Chief Engineer Scott reports:\n");
    printf("  The engines won't take warp " + w1 + "!\n\n");
    return;
  }

  n = Math.round(w1 * 8.0);

  if (energy - n < 0) {
    printf("Engineering reports:\n");
    printf("  Insufficient energy available for maneuvering");
    printf("  at warp " + w1 + "!\n\n");

    if (shields >= n && damage_array[7] >= 0.0) {
      printf("Deflector Control Room acknowledges:\n");
      printf("  " + shields + " units of energy presently deployed to shields.\n");
    }

    return;
  }

  klingons_move();

  repair_damage();

  z1 = cint(sector_x);
  z2 = cint(sector_y);
  insert_in_quadrant("   ");

  x1 = c[1][cint(c1)] + (c[1][cint(c1) + 1] - c[1][cint(c1)]) * (c1 - cint(c1));
  x2 = c[2][cint(c1)] + (c[2][cint(c1) + 1] - c[2][cint(c1)]) * (c1 - cint(c1));

  x = sector_x;
  y = sector_y;
  q4 = quadrant_x;
  q5 = quadrant_y;

  for (i = 1; i <= n; i++) {
    sector_x = sector_x + x1;
    sector_y = sector_y + x2;

    z1 = cint(sector_x);
    z2 = cint(sector_y);

    if (z1 < 1 || z1 >= 9 || z2 < 1 || z2 >= 9) {
      exceed_quadrant_limits();
      complete_maneuver();
      return;
    }

    if (string_compare("   ") != 1) /* Sector not empty */ {
      sector_x = sector_x - x1;
      sector_y = sector_y - x2;
      printf("Warp Engines shut down at sector ");
      printf(z1 + ", " + z2 + " due to bad navigation.\n\n");
      i = n + 1;
    }
  }

  complete_maneuver();
}

function complete_maneuver() {
  var t8;           // used as real
  z1 = cint(sector_x);
  z2 = cint(sector_y);
  insert_in_quadrant("<*>");

  maneuver_energy();

  t8 = 1.0;

  if (w1 < 1.0)
    t8 = w1;

  current_stardate = current_stardate + t8;

  if (current_stardate > start_stardate + mission_duration)
    end_of_time();

  short_range_scan();
}


function exceed_quadrant_limits() {
  var x5 = 0;   /* Outside galaxy flag */

  x = (8 * quadrant_x) + x + (n * x1);
  y = (8 * quadrant_y) + y + (n * x2);

  quadrant_x = Math.floor(x / 8.0);
  quadrant_y = Math.floor(y / 8.0);

  sector_x = x - (quadrant_x * 8);
  sector_y = y - (quadrant_y * 8);

  if (Math.floor(sector_x) == 0) {
    quadrant_x = quadrant_x - 1;
    sector_x = sector_x + 8.0;
  }

  if (Math.floor(sector_y) == 0) {
    quadrant_y = quadrant_y - 1;
    sector_y = sector_y + 8.0;
  }

  /* check if outside galaxy */
  if (quadrant_x < 1) {
    x5 = 1;
    quadrant_x = 1;
    sector_x = 1.0;
  }

  if (quadrant_x > 8) {
    x5 = 1;
    quadrant_x = 8;
    sector_x = 8.0;
  }

  if (quadrant_y < 1) {
    x5 = 1;
    quadrant_y = 1;
    sector_y = 1.0;
  }

  if (quadrant_y > 8) {
    x5 = 1;
    quadrant_y = 8;
    sector_y = 8.0;
  }

  if (x5 == 1) {
    printf("LT. Uhura reports:\n");
    printf("  Message from Starfleet Command:\n\n");
    printf("  Permission to attempt crossing of galactic perimeter\n");
    printf("  is hereby *denied*. Shut down your engines.\n\n");
    printf("Chief Engineer Scott reports:\n");
    printf("  Warp Engines shut down at sector ", cint(sector_x) + ", ");
    printf(cint(sector_y) + " of quadrant " + quadrant_x + ", " + quadrant_y + ".\n\n");
  }

  maneuver_energy();

  if (current_stardate > start_stardate + mission_duration)
    end_of_time();

  current_stardate = current_stardate + 1;

  new_quadrant();
}

function maneuver_energy() {
  energy = energy - n - 10;

  if (energy >= 0)
    return;

  printf("Shield Control supplies energy to complete maneuver.\n\n");

  shields = shields + energy;
  energy = 0;

  if (shields <= 0)
    shields = 0;
}

function short_range_scan() {
  printf("<*> = YOUR STARSHIP'S POSITION\n");
  printf("+K+ = KLINGON BATTLE CRUISER\n");
  printf(">!< = FEDERATION STARBASE (REFUEL/REPAIR/RE-ARM HERE!)\n");
  printf(" *  = STAR\n\n");

  var sC = "GREEN";

  if (energy < max_energy * .1)
    sC = "YELLOW";

  if (quadrant_klingons > 0)
    sC = "*RED*";

  // Determine if we're docked
  /* need to clear the docked flag here */
  is_docked = 0;

  for (i = Math.floor(sector_x - 1); i <= Math.floor(sector_x + 1); i++)
    for (j = Math.floor(sector_y - 1); j <= Math.floor(sector_y + 1); j++)
      if (i >= 1 && i <= 8 && j >= 1 && j <= 8) {
        z1 = i;
        z2 = j;
        if (string_compare(">!<") == 1) {
          is_docked = 1;
          sC = "DOCKED";
          energy = max_energy;
          torpedoes = max_torpedoes;
          printf("Shields dropped for docking purposes.\n");
          shields = 0;
        }
      }

  if (damage_array[2] < 0.0) {
    printf("\n*** Short Range Sensors are out ***\n");
    return;
  }

  printf("------------------------\n");
  for (i = 0; i < 8; i++) {
    for (j = 0; j < 24; j++) {
      putchar(sQ[i * 24 + j]);
    }

    if (i == 0) printf("    Stardate            " + current_stardate + "\n");
    if (i == 1) printf("    Condition           " + sC + "\n");
    if (i == 2) printf("    Quadrant            " + quadrant_x + "," + quadrant_y + "\n");
    if (i == 3) printf("    Sector              " + sector_x + "," + sector_y + "\n");
    if (i == 4) printf("    Photon Torpedoes    " + torpedoes + "\n");
    if (i == 5) printf("    Total Energy        " + (energy + shields) + "\n");
    if (i == 6) printf("    Shields             " + shields + "\n");
    if (i == 7) printf("    Klingons Remaining  " + total_klingons + "\n");
  }
  printf("------------------------\n\n");

  return;
}

function long_range_scan() {
  printf("\n");
  if (damage_array[3] < 0.0) {
    printf("Long Range Sensors are inoperable.\n");
    return;
  }

  printf("Long Range Scan for Quadrant " + quadrant_x + ", " + quadrant_y + "\n\n");

  for (i = quadrant_x - 1; i <= quadrant_x + 1; i++) {
    printf("--------------------\n:");
    for (j = quadrant_y - 1; j <= quadrant_y + 1; j++)
      if (i > 0 && i <= 8 && j > 0 && j <= 8) {
        galaxy_history[i][j] = galaxy_grid[i][j];
        printf(" " + pad_zero(galaxy_history[i][j], 3) + " :");
        //            printf(" " + "000" + " :");
      }
      else
        printf(" *** :");
    printf("\n");
  }

  printf("--------------------\n\n");
}

function phaser_control() {
  if (damage_array[4] < 0.0) {
    printf("Phasers Inoperative\n\n");
    return;
  }

  if (quadrant_klingons <= 0) {
    printf("Science Officer Spock reports:\n");
    printf("  'Sensors show no enemy ships in this quadrant'\n\n");
    return;
  }

  if (damage_array[8] < 0.0)
    printf("Computer failure hampers accuracy.\n");

  printf("Phasers locked on target;\n");
  if (window.soundManager) window.soundManager.phaser();

  printf("Energy available = " + energy + " units\n\n");

  // Set state and wait for user input
  set_commandhandler(phaser_control2, "Number of units to fire?");
}

function phaser_control2(sTemp) {
  var iEnergy, h1, h;
  reset_commandhandler();
  printf("\n");

  iEnergy = atoi(sTemp);

  if (iEnergy <= 0)
    return;

  if (energy - iEnergy < 0) {
    printf("Not enough energy available.\n\n");
    return;
  }

  energy = energy - iEnergy;

  if (damage_array[8] < 0.0)
    iEnergy = Math.floor(iEnergy * rnd());

  h1 = iEnergy / quadrant_klingons;

  for (i = 1; i <= 3; i++) {
    if (klingon_data[i][3] > 0) {
      h = Math.floor(h1 / function_d(0) * (rnd() + 2));

      if (h <= .15 * klingon_data[i][3]) {
        printf("Sensors show no damage to enemy at " +
          klingon_data[i][1] + ", " + klingon_data[i][2] + "\n\n");
      }
      else {
        klingon_data[i][3] = klingon_data[i][3] - h;
        printf(h + " unit hit on Klingon at sector " +
          klingon_data[i][1] + ", " + klingon_data[i][2] + "\n");
        if (klingon_data[i][3] <= 0) {
          printf("*** Klingon Destroyed ***\n\n");
          quadrant_klingons--;
          total_klingons--;
          z1 = klingon_data[i][1];
          z2 = klingon_data[i][2];
          insert_in_quadrant("   ");
          klingon_data[i][3] = 0;
          galaxy_grid[quadrant_x][quadrant_y] = galaxy_grid[quadrant_x][quadrant_y] - 100;
          galaxy_history[quadrant_x][quadrant_y] = galaxy_grid[quadrant_x][quadrant_y];
          if (total_klingons <= 0)
            won_game();
        }
        else
          printf("   (Sensors show " + klingon_data[i][3] + " units remaining)\n\n");
      }
    }
  }

  klingons_shoot();
}

function photon_torpedoes() {
  if (torpedoes <= 0) {
    printf("All photon torpedoes expended\n");
    return;
  }

  if (damage_array[5] < 0.0) {
    printf("Photon Tubes not operational\n");
    return;
  }

  set_commandhandler(photon_torpedoes2, "Course (0-9)?");
}

function photon_torpedoes2(input) {
  reset_commandhandler();
  printf("\n");

  c1 = parseFloat(input);

  if (c1 == 9.0)
    c1 = 1.0;

  if (c1 < 1.0 || c1 > 9.0) {
    printf("Ensign Chekov roports:\n");
    printf("  Incorrect course data, sir!\n\n");
    return;
  }

  energy = energy - 2;
  torpedoes--;
  if (window.soundManager) window.soundManager.torpedo();

  x1 = c[1][Math.floor(c1)] + (c[1][Math.floor(c1) + 1] - c[1][Math.floor(c1)]) * (c1 - Math.floor(c1));
  x2 = c[2][Math.floor(c1)] + (c[2][Math.floor(c1) + 1] - c[2][Math.floor(c1)]) * (c1 - Math.floor(c1));

  x = sector_x + x1;
  y = sector_y + x2;

  x3 = cint(x);
  y3 = cint(y);

  x5 = 0;

  printf("Torpedo Track:\n");

  while (x3 >= 1 && x3 <= 8 && y3 >= 1 && y3 <= 8) {
    printf("    " + x3 + ", " + y3 + "\n");

    z1 = x3;
    z2 = y3;

    if (string_compare("   ") == 0) {
      torpedo_hit();
      klingons_shoot();
      return;
    }

    x = x + x1;
    y = y + x2;

    x3 = cint(x);
    y3 = cint(y);
  }

  printf("Torpedo Missed\n\n");

  klingons_shoot();
}

function torpedo_hit() {
  x3 = cint(x);
  y3 = cint(y);

  if (string_compare(" * ") == 1) {
    printf("Star at " + x3 + ", " + y3 + "absorbed torpedo energy.\n\n");
    return;
  }

  if (string_compare("+K+") == 1) {
    printf("*** Klingon Destroyed ***\n\n");
    quadrant_klingons--;
    total_klingons--;

    if (total_klingons <= 0)
      won_game();

    for (i = 0; i <= 3; i++)
      if (x3 == klingon_data[i][1] && y3 == klingon_data[i][2])
        klingon_data[i][3] = 0;
  }

  if (string_compare(">!<") == 1) {
    printf("*** Starbase Destroyed ***\n");
    quadrant_bases--;
    total_bases--;

    if (total_bases <= 0 && total_klingons <= current_stardate - start_stardate - mission_duration) {
      printf("That does it, Captain!!");
      printf("You are hereby relieved of command\n");
      printf("and sentanced to 99 stardates of hard");
      printf("labor on Cygnus 12!!\n");
      resign_commision();
    }

    printf("Starfleet Command reviewing your record to consider\n");
    printf("court martial!\n\n");

    is_docked = 0;    /* Undock */
  }

  z1 = x3;
  z2 = y3;
  insert_in_quadrant("   ");

  galaxy_grid[quadrant_x][quadrant_y] = (quadrant_klingons * 100) + (quadrant_bases * 10) + quadrant_stars;
  galaxy_history[quadrant_x][quadrant_y] = galaxy_grid[quadrant_x][quadrant_y];
}

function damage_control() {
  var d3 = 0.0;

  if (damage_array[6] < 0.0) {
    printf("Damage Control report not available.\n");

    if (is_docked == 0)
      return;

    d3 = 0.0;
    for (i = 1; i <= 8; i++)
      if (damage_array[i] < 0.0)
        d3 = d3 + .1;

    if (d3 == 0.0)
      return;

    d3 = d3 + d4;
    if (d3 >= 1.0)
      d3 = 0.9;

    printf("\nTechnicians standing by to effect repairs to your");
    printf("ship;\nEstimated time to repair: " + d3 + " stardates.\n");
    printf("Will you authorize the repair order (Y/N)? ");

    a1 = "N";

    if (a1 == 'Y' || a1 == 'y') {
      for (i = 1; i <= 8; i++)
        if (damage_array[i] < 0.0)
          damage_array[i] = 0.0;

      current_stardate = current_stardate + d3 + 0.1;
    }
  }

  printf("Device            State of Repair\n");

  for (r1 = 1; r1 <= 8; r1++) {
    var sG2 = get_device_name(r1);
    printf(sG2);
    for (i = 1; i < 25 - parseInt(sG2.length); i++)
      printf(" ");
    printf(damage_array[r1] + "\n");
  }

  printf("\n");
}

function sheild_control() {
  if (damage_array[7] < 0.0) {
    printf("Sheild Control inoperable\n");
    return;
  }

  printf("Energy available = " + (energy + shields) + "\n\n");

  // Set state and wait for user input
  set_commandhandler(sheild_control2, "Input number of units to shields?");
}

function sheild_control2(input) {
  reset_commandhandler();

  printf("\n");

  var i = parseInt(input);

  if (i < 0 || shields == i) {
    printf("<Sheilds Unchanged>\n\n");
    return;
  }

  if (i >= energy + shields) {
    printf("Sheild Control Reports:\n");
    printf("  'This is not the Federation Treasury.'\n");
    printf("<Sheilds Unchanged>\n\n");
    return;
  }

  energy = energy + shields - i;
  shields = i;

  printf("Deflector Control Room report:\n");
  printf("  'Shields now at " + shields + " units per your command.'\n\n");
}

function library_computer() {
  if (damage_array[8] < 0.0) {
    printf("Library Computer inoperable\n");
    return;
  }

  printf("\n");
  printf("   0 = Cumulative Galactic Record\n");
  printf("   1 = Status Report\n");
  printf("   2 = Photon Torpedo Data\n");
  printf("   3 = Starbase Nav Data\n");
  printf("   4 = Direction/Distance Calculator\n");
  printf("   5 = Galaxy 'Region Name' Map\n\n");

  // Set state and return, waiting for more input
  set_commandhandler(library_computer2, "Computer command (0-5)? ");
}

function library_computer2(sTemp) {
  // Clear state as if the input is invalid we abort this command anyway
  reset_commandhandler();
  printf("\n");

  if (sTemp === "0")
    galactic_record();
  else if (sTemp === "1")
    status_report();
  else if (sTemp === "2")
    torpedo_data();
  else if (sTemp === "3")
    nav_data();
  else if (sTemp === "4")
    dirdist_calc();
  else if (sTemp === "5")
    galaxy_map();
  else {
    printf("Bad command\n\n");
  }
}

function galactic_record() {
  printf("\n     Computer Record of Galaxy for Quadrant " + quadrant_x + "," + quadrant_y + "\n\n");
  printf("     1     2     3     4     5     6     7     8\n");

  for (i = 1; i <= 8; i++) {
    printf("   ----- ----- ----- ----- ----- ----- ----- -----\n");

    printf(i);

    for (j = 1; j <= 8; j++) {
      printf("   ");

      if (galaxy_history[i][j] == 0)
        printf("***");
      else
        printf(pad_zero(galaxy_history[i][j], 3));
    }

    printf("\n");
  }

  printf("   ----- ----- ----- ----- ----- ----- ----- -----\n\n");

}

function galaxy_map() {
  g5 = 1;

  printf("\n                   The Galaxy\n\n");
  printf("    1     2     3     4     5     6     7     8\n");

  for (i = 1; i <= 8; i++) {
    printf("  ----- ----- ----- ----- ----- ----- ----- -----\n");

    printf(" " + i);

    z4 = i;
    z5 = 1;
    var sG2 = quadrant_name();

    var j0 = 11 - (sG2.length / 2);

    for (j = 0; j < j0; j++)
      printf(" ");

    printf(sG2);

    for (j = 0; j < j0; j++)
      printf(" ");

    if (!(sG2.length % 2))
      printf(" ");

    z5 = 5;
    sG2 = quadrant_name();

    j0 = Math.round(12 - (sG2.length / 2));

    for (j = 0; j < j0; j++)
      printf(" ");

    printf(sG2);

    printf("\n");
  }

  printf("  ----- ----- ----- ----- ----- ----- ----- -----\n\n");
}

function status_report() {
  printf("\nStatus Report:\n");

  if (total_klingons > 1)
    printf("    Klingons Left: " + total_klingons + "\n", total_klingons);

  printf("    Mission must be completed in " +
    0.1 * Math.floor(((start_stardate + mission_duration - current_stardate) * 10)) +
    " stardates\n");

  if (total_bases < 1) {
    printf("Your stupidity has left you on your own in the galaxy\n");
    printf(" -- you have no starbases left!\n");
  }
  else {
    if (total_bases == 1) {
      printf("    The Federation is maintaining 1 starbase in the galaxy\n");
    }
    else {
      printf("    The Federation is maintaining " + total_bases + " starbases in the galaxy\n");
    }
  }

  printf("\n");
}

function torpedo_data() {
  printf("\n");

  if (quadrant_klingons <= 0) {
    printf("Science Officer Spock reports:\n");
    printf("  'Sensors show no enemy ships in this quadrant.'\n\n");
    return;
  }

  if (quadrant_klingons > 1)
    printf("From Enterprise to Klingon battlecriusers:\n\n");
  else
    printf("From Enterprise to Klingon battlecriuser:\n\n");

  for (i = 1; i <= 3; i++) {
    if (klingon_data[i][3] > 0) {
      w1 = klingon_data[i][1];
      x = klingon_data[i][2];
      c1 = sector_x;

      a = sector_y;

      compute_vector();
    }
  }
}

function nav_data() {
  printf("\n");

  if (quadrant_bases <= 0) {
    printf("Mr. Spock reports,\n");
    printf("  'Sensors show no starbases in this quadrant.'\n\n");
    return;
  }

  w1 = b4;
  x = b5;
  c1 = sector_x;
  a = sector_y;

  compute_vector();
}

function dirdist_calc() {
  printf("\nDirection/Distance Calculator\n");
  //  printf("You are at quadrant %damage_array,%damage_array sector %damage_array,%damage_array\n\n", quadrant_x, quadrant_y,
  printf("You are at quadrant " + quadrant_x + "," + quadrant_y +
    " sector " + Math.floor(sector_x) + "," + Math.floor(sector_y) + "\n\n");

  //  printf("Please enter initial X coordinate: \n");

  // Set state so that we can continue after user input
  set_commandhandler(dirdist_calc2, "Please enter initial X coordinate?");
}

function dirdist_calc2(input) {
  c1 = parseInt(input);

  //  printf("Please enter initial Y coordinate: \n");

  // Set state so that we can continue after user input
  printf("\n");
  set_commandhandler(dirdist_calc3, "Please enter initial Y coordinate?");
}

function dirdist_calc3(input) {
  a = parseInt(input);

  //  printf("Please enter final X coordinate: \n");

  // Set state so that we can continue after user input
  printf("\n");
  set_commandhandler(dirdist_calc4, "Please enter final X coordinate?");
}

function dirdist_calc4(input) {
  w1 = parseInt(input);

  // Set state so that we can continue after user input
  printf("\n");
  set_commandhandler(dirdist_calc5, "Please enter final Y coordinate?");
}

function dirdist_calc5(input) {
  // Clear state as we've finished with this sequence now (phew!)
  reset_commandhandler();

  x = parseInt(input);
  printf("\n\n");
  compute_vector();
}

function compute_vector() {
  x = x - a;
  a = c1 - w1;

  if (x <= 0.0) {
    if (a > 0.0) {
      c1 = 3.0;
      sub2();
      return;
    }
    else {
      c1 = 5.0;
      sub1();
      return;
    }
  }
  else if (a < 0.0) {
    c1 = 7.0;
    sub2();
    return;
  }
  else {
    c1 = 1.0;
    sub1();
    return;
  }
}

/* Used as part of vector calculator (energy.galaxy_grid. torpedo) functions. */
function sub1() {
  x = Math.abs(x);
  a = Math.abs(a);

  if (a <= x)
    printf("  DIRECTION = " + (c1 + (a / x)) + "\n");
  else
    printf("  DIRECTION = " + (c1 + (((a * 2) - x) / a)) + "\n");

  printf("  DISTANCE = " + ((x > a) ? x : a) + "\n\n");
}

/* Used as part of vector calculator (energy.galaxy_grid. torpedo) functions. */
function sub2() {
  x = Math.abs(x);
  a = Math.abs(a);

  if (a >= x)
    printf("  DIRECTION = " + (c1 + (x / a)) + "\n");
  else
    printf("  DIRECTION = " + (c1 + (((x * 2) - a) / x)) + "\n");

  printf("  DISTANCE = " + ((x > a) ? x : a) + "\n\n");
}

function ship_destroyed() {
  printf("The Enterprise has been destroyed. ");
  printf("The Federation will be conquered.\n\n");

  end_of_time();
}

function end_of_time() {
  printf("It is stardate " + Math.floor(current_stardate) + ".\n");

  resign_commision();
}

function resign_commision() {
  printf("\n");
  printf("There were " + total_klingons + " Klingon Battlecruisers left at the");
  printf(" end of your mission.\n\n");

  end_of_game();
}

function won_game() {
  printf("Congratulations, Captain! The last Klingon Battle Cruiser\n");
  printf("menacing the Federation has been destoyed.\n\n");

  if (current_stardate - start_stardate > 0)
    printf("Your efficiency rating is " + (1000 * pow(start_klingons / (current_stardate - start_stardate), 2)) + "\n");

  end_of_game();
}

function klingons_move() {
  for (i = 1; i <= 3; i++) {
    if (klingon_data[i][3] > 0) {
      z1 = klingon_data[i][1];
      z2 = klingon_data[i][2];
      insert_in_quadrant("   ");

      find_empty_place();

      klingon_data[i][1] = z1;
      klingon_data[i][2] = z2;
      insert_in_quadrant("+K+");
    }
  }

  klingons_shoot();
}

function klingons_shoot() {
  var h, i;

  if (quadrant_klingons <= 0)
    return;

  if (is_docked != 0) {
    printf("Starbase shields protect the Enterprise\n\n");
    return;
  }

  for (i = 1; i <= 3; i++) {
    if (klingon_data[i][3] > 0) {
      h = Math.floor((klingon_data[i][3] / function_d(i)) * (2 + rnd()));
      shields = shields - h;
      klingon_data[i][3] = Math.floor(klingon_data[i][3] / (3 + rnd()));

      printf(h + " unit hit on Enterprise from sector ");
      printf(klingon_data[i][1] + ", " + klingon_data[i][2] + "\n");

      if (shields <= 0) {
        printf("\n");
        ship_destroyed();
        return;
      }
      else {
        printf("    <Shields down to " + shields + " units>\n\n");

        if (h >= 20) {
          var random_dam_chance = (easy_game) ? 0.2 : 0.6;
          if (rnd() <= random_dam_chance || (h / shields) > 0.2) {
            r1 = function_r();
            damage_array[r1] = damage_array[r1] - (h / shields) - (0.5 * rnd());

            var sG2 = get_device_name(r1);

            printf("Damage Control reports '" + sG2 + "' damaged by hit\n\n");
          }
        }
      }
    }
  }
}

function end_of_game() {
  if (window.soundManager) window.soundManager.stopAll();
  if (total_bases > 0) {
    printf("The Federation is in need of a new starship commander");
    printf(" for a similar mission.\n");
    printf("If there is a volunteer, let him step forward and");
    printf(" enter 'aye':\n\n");

    // Set state and wait for user input
    set_commandhandler(end_of_game2);
  }
}

function end_of_game2(input) {
  printf("\n");

  if (input === "aye") {
    reset_commandhandler();
    new_game();
  }
}

function repair_damage() {
  var d6 = w1;

  if (w1 >= 1.0)
    d6 = w1 / 10;

  for (i = 1; i <= 8; i++) {
    if (damage_array[i] < 0.0) {
      damage_array[i] = damage_array[i] + d6;
      if (damage_array[i] > -0.1 && damage_array[i] < 0)
        damage_array[i] = -0.1;
      else if (damage_array[i] >= 0.0) {
        if (is_repairing != 1)
          is_repairing = 1;

        printf("Damage Control report:\n");
        r1 = i;
        var sG2 = get_device_name(r1);
        printf("    " + sG2 + " repair completed\n\n");
      }
    }
  }

  if (rnd() <= 0.2) {
    r1 = function_r();

    if (rnd() < .6 && !easy_game) {
      damage_array[r1] = damage_array[r1] - (rnd() * 5.0 + 1.0);
      printf("Damage Control report:\n");
      printf("    " + get_device_name(r1) + " damaged\n\n");
    }
    else {
      damage_array[r1] = damage_array[r1] + (rnd() * 3.0 + 1.0);
      printf("Damage Control report:\n");
      printf("    " + get_device_name(r1) + " state of repair improved\n\n");
    }
  }
}

/* Randomly chooses an empty space in the current quadrant (sQ) */
function find_empty_place() {
  do {
    r1 = function_r();
    r2 = function_r();

    z1 = r1;
    z2 = r2;

    // check if three items in sQ starting at r1/r2 are blank
    z1 = Math.floor(z1 + 0.5);
    z2 = Math.floor(z2 + 0.5);
    s8 = ((z2 - 1) * 3) + ((z1 - 1) * 24) + 1;
    if (string_compare("   ") == 1) {
      z3 = 1;
    }

  } while (z3 == 0);

  z3 = 0;
}

/* Puts the enterprise shape in the correct part of sQ */
function insert_in_quadrant(sA) {
  s8 = (Math.floor(z2 - 0.5) * 3) + (Math.floor(z1 - 0.5) * 24) + 1;

  sQ[s8 - 1] = sA[0];
  sQ[s8] = sA[1];
  sQ[s8 + 1] = sA[2];
}

/* Returns the name of the Enterprise device for the supplied device index.*/
function get_device_name(device_index) {
  var device_name = [
    "", "Warp Engines", "Short Range Sensors", "Long Range Sensors",
    "Phaser Control", "Photon Tubes", "Damage Control", "Sheild Control",
    "Library-Computer"];

  if (device_index < 0 || device_index >= device_name.length)
    device_index = 0;

  return device_name[device_index];
}

/* Checks if _display_string_ is in the quadrant display string _sQ_
at the location given by the global variables z1 and z2.
This one is a minor tweak to improve readability just a little.
*/
function string_compare(display_string) {
  z1 = Math.floor(z1 + 0.5);
  z2 = Math.floor(z2 + 0.5);

  var s8 = ((z2 - 1) * 3) + ((z1 - 1) * 24);

  if (sQ[s8] == display_string[0] &&
    sQ[s8 + 1] == display_string[1] &&
    sQ[s8 + 2] == display_string[2]) {
    return 1;     // return that we found it
  }
  else {
    return 0;     // return that we didn'current_stardate find it
  }
}

function quadrant_name() {
  var sG2 = "Mystery";          // the returned quadrant name

  var quad_name = ["", "Antares", "Rigel", "Procyon", "Vega",
    "Canopus", "Altair", "Sagittarius", "Pollux", "Sirius", "Deneb", "Capella",
    "Betelgeuse", "Aldebaran", "Regulus", "Arcturus", "Spica"];

  var sect_name = ["", " I", " II", " III", " IV"];

  if (z4 < 1 || z4 > 8 || z5 < 1 || z5 > 8)
    sG2 = "Unknown";

  if (z5 <= 4)
    sG2 = quad_name[z4];
  else
    sG2 = quad_name[z4 + 8];

  if (g5 != 1) {
    if (z5 > 4)
      z5 = z5 - 4;
    sG2 += sect_name[z5];
  }

  return sG2;
}


/************************************************************************
** Minor functions from the original version
************************************************************************/

/* Returns an integer from 1 to iSpread */
function get_rand(iSpread) {
  return (Math.floor(Math.random() * iSpread) + 1);
}


function rnd() {
  return Math.random();
}

function function_d(i) {
  j = Math.floor(sqrt(pow((klingon_data[i][1] - sector_x), 2) + pow((klingon_data[i][2] - sector_y), 2)));

  return j;
}

/* Returns an integer from 1 to 8 - used for coordinates */
function function_r() {
  return (get_rand(8));
}


/************************************************************************
** Utility functions written for compatibility with C version.
************************************************************************/

/* Provide a 'printf' function */
function printf(outstring) {
  output += outstring;
  display();
}

/* Provide a 'putchar' function */
function putchar(outstring) {
  printf(outstring);
}

/* Wraps Math.round, just to keep source looking similar */
function cint(real_number) {
  return Math.floor(real_number);
}

/* Implements atoi. If input is invalid it will return zero. */
function atoi(string) {
  parsedValue = parseInt(string);
  if (isNaN(parsedValue)) {
    parsedValue = 0;
  }

  return parsedValue;
}

/* Wraps Math.pow, just to keep source looking similar */
function pow(base, exponent) {
  return Math.pow(base, exponent);
}

/* Wraps Math.sqrt, just to keep source looking similar */
function sqrt(value) {
  return Math.sqrt(value);
}


/************************************************************************
** New functions.
************************************************************************/

/* Write debug output, if debug_on is true */
function debug(arg1) {
  if (debug_on) {
    printf(arg1 + "\n");
  }
}

function dim_array(dimension, initial) {
  var a = [], i;
  for (i = 0; i < dimension; i += 1) {
    a[i] = initial;
  }
  return a;
}

function dim_matrix(m, n, initial) {
  var a, i, j, mat = [];
  for (i = 0; i < m; i += 1) {
    a = [];
    for (j = 0; j < n; j += 1) {
      a[j] = initial;
    }
    mat[i] = a;
  }
  return mat;
}

/* Pad a number with _n_ zeroes. To replace printf('%3.3d') functionality. */
var pad_zero = function (x, n) {
  var zeros = repeat_string("0", n);
  return String(zeros + x).slice(-1 * n)
}

/* Just return a string with _i_ copies of _str_ concatanated */
function repeat_string(str, i) {
  if (isNaN(i) || i <= 0) return "";
  return str + repeat_string(str, i - 1);
}

function debug_sQ() {
  if (debug_on) {
    var index;
    printf("  -1--2--3--4--5--6--7--8-\n");
    for (y = 0; y < 8; y++) {
      printf(y + ":");
      for (x = 0; x < 8; x++) {
        index = y * 24 + x * 3;
        printf(sQ[index]);
        printf(sQ[index + 1]);
        printf(sQ[index + 2]);
      }
      printf(":" + index + "\n");
    }
  }
}

function clear_output() {
  output = "";
  document.getElementById('output_area').innerHTML = "";
}

function set_commandhandler(command_function, new_prompt_string) {
  if (typeof (command_function) === "function") {
    usercommandhandler = command_function;
    if (new_prompt_string) {
      prompt_string = new_prompt_string;
    }
  }
  else {
    printf("Scotty reports internal system malfunction!\n");
    reset_commandhandler();
  }
}

function reset_commandhandler() {
  any_key_is_input = false;
  usercommandhandler = undefined;
  prompt_string = "Command?";
}

function usercommand(input_id) {
  // Get the user input and clear it from the UI
  if (document.getElementById(input_id)) {
    var input = document.getElementById(input_id).value;
    document.getElementById(input_id).value = "";
    printf("<span class='command_history'>" + prompt_string + " " + input + "</span>");
    commandstring = "";
  }

  if (typeof (usercommandhandler) === "function") {
    usercommandhandler(input);
    display();
  }
  else {
    handle_command(input);
    display();
  }
}

function usercommand2(input) {
  printf("<span class='command_history'>" + prompt_string + " " + input + "</span>");
  commandstring = "";

  if (typeof (usercommandhandler) === "function") {
    usercommandhandler(input);
    display();
  }
  else {
    handle_command(input);
    display();
  }
}

function userkeypress(event) {
  if (any_key_is_input) {
    usercommand("");
    display();
  }
  else {
    var keynum = event.which;

    // validate the key
    if ((keynum >= 48 && keynum <= 57) ||       // number
      (keynum >= 97 && keynum <= 122) ||      // lower case letter
      (keynum === 46)) {                      // full stop
      // is alphanumeric so it'shields fine
      var keychar = String.fromCharCode(keynum);
      commandstring += keychar;
    }
    else if (keynum === 8) {
      // Backspace (delete)
      commandstring = commandstring.slice(0, -1);
    }
    else if (keynum === 13) {
      // Enter
      usercommand2(commandstring);
    }
    else if (keynum === 27) {
      // escape key so clear input
      commandstring = "";
    }
    display();
  }
}

function display() {
  var output_div = document.getElementById('output_area');
  output_div.innerHTML =
    "<pre>" +
    output +
    "<span class='command_echo'>" + prompt_string + " " + commandstring + "</span>" +
    "<span class='command_cursor'>_</span>" +
    "</pre>";
  output_div.scrollTop = output_div.scrollHeight;
}

function print_help() {
  printf("  nav - To Set Course\n");
  printf("  srs - Short Range Sensors\n");
  printf("  lrs - Long Range Sensors\n");
  printf("  pha - Phasers\n");
  printf("  tor - Photon Torpedoes\n");
  printf("  she - Sheild Control\n");
  printf("  dam - Damage Control\n");
  printf("  com - Library Computer\n");
  printf("  xxx - Resign Command\n");
  printf("  help - This Help\n");
}

