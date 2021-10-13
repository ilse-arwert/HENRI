// HENRI:
// Heavenly Evolutionary New Recipe Intelligence


let json = {};
let recipes = [];
let allIngredients = []; 
let ingredientsList = []; // with categories, from json
let population = [];
let populationSize = 20; // could be higher!

let recipe_number = 0;
let history = [];


// fitness
const maxCategoryBonus = 20; // half of this is the bonus for 2 items in same cat.
const multipleCatDeduct = 8; // when there are multiples in more than 1 cat.

function preload() {
  json = loadJSON("data/recipes-no-soup.json");
}

function setup() {

  // REMOVE ME
  randomSeed(0);

  createCanvas(400, 800);
  recipes = json.recipes;
  ingredientsList = json.ingredients;
  
  // extract all of the ingredients from the inspiring set
  // TODO: Replace this with our JSON ingredient list?
  for (const r of recipes) {
    for (const i of r.ingredients) {
      allIngredients.push(i);
    }
  }

  // create an initial population
  for (let i = 0; i < populationSize; i++) {
    population.push(random(recipes));
  }

  evaluateRecipes(population);
  population.sort((a, b) => b.fitness - a.fitness);
  
  frameRate(2);
}

function evaluateRecipes(recipes) {
  for (const r of recipes) {
    
    r.fitness = 0;

    // Points for ingredients in same category. 
    // Slight deductions for multiple categories with multiple ingredients.
    const categories = [];
    for (const i of r.ingredients){
      let ingredientListItem = ingredientsList.find(o => o.name === i.ingredient);
      categories.push(ingredientListItem.category);  
    }

    const counts = {};
    let multiples = false;

    for (const cat of categories){
      // if counts[cat] exists, add one, else set to one.
      counts[cat] = counts[cat] ? counts[cat] + 1 : 1;
    }
    for (const key in counts){
      if (counts[key] > 1){
        // exclude 'essentials'
        // TODO: replace with stored list of essentials
        if (key != "flour" && 
            key != "rising" && 
            key != "butter" && 
            key != "sugar" &&
            key != "salt" &&
            key != "liquid" &&
            key != "eggs"){
          
          // not the first category to have multiples
          r.fitness = multiples ? r.fitness - multipleCatDeduct : r.fitness;

          r.fitness += maxCategoryBonus - (( maxCategoryBonus / 2) / ( 2 ** counts[key] ));
          multiples = true;
          
        }
      }
      
    }
    // -----

    // fitness for good ratios of essentials

    // add weight of liquids, flours, rising, sugar, fats, salts
    //weights:
    let flourW = 0;
    let liquidW = 0;
    let risingW = 0;
    let sugarW = 0;
    let fatW = 0;
    let saltW = 0;
    for (const i of r.ingredients){
      let ingredientListItem = ingredientsList.find(o => o.name === i.ingredient);

      if (ingredientListItem.category == "flour"){
        flourW += i.amount;
      }
      if (ingredientListItem.category == "liquid"){
        liquidW += i.amount;
      }
      if (ingredientListItem.category == "rising"){
        risingW += i.amount;
      }
      if (ingredientListItem.category == "sugar"){
        sugarW += i.amount;
      }
      if (ingredientListItem.category == "fat"){
        fatW += i.amount;
      }
      if (ingredientListItem.category == "salt"){
        saltW += i.amount;
      }
    }

    let totalWeight = flourW + liquidW + risingW + sugarW + fatW + saltW;
    // normalize
    flourW = flourW / totalWeight;
    liquidW = liquidW / totalWeight;
    risingW = risingW / totalWeight;
    sugarW = sugarW / totalWeight;
    fatW = fatW / totalWeight;
    saltW = saltW /totalWeight;

    // fitness -= difference * weighing
    r.fitness -= Math.abs(flourW - 0.5) * 50;
    r.fitness -= Math.abs(fatW - 0.33) * 50;
    r.fitness -= Math.abs(sugarW - 0.16) * 50;
    r.fitness -= Math.max(liquidW - 0.05, 0) * 100; // no deduction for low liquid
    r.fitness -= Math.abs(risingW - 0.015) * 500;
    r.fitness -= Math.abs(saltW - 0.015) * 400;

    // -----

    // goeie verhouding basis + extras is glijdende schaal

    // bonuspunten voor aanwezigheid flavor & herbs


  }
}

// Implements a roulette wheel selection
function selectRecipe(recipes) {
  let sum = recipes.reduce((a, r) => a + r.fitness, 0);
  // choose a random number less than the sum of fitnesses
  let f = int(random(sum));
  // iterate through all items in the recipes
  for (const r of recipes) {
    // if f is less than a recipe's fitness, return it
    if (f < r.fitness) return r;
    // otherwise subtract the recipe's fitness from f
    f -= r.fitness;
  }
  // if no recipe has been returned, return the last one
  return recipes[recipes.length - 1];
}

function generateRecipes(size, population) {
  let R = [];
  while (R.length < size) {
    let r1 = selectRecipe(population);
    let r2 = selectRecipe(population);
    let r = crossoverRecipes(r1, r2);
    mutateRecipe(r);
    normaliseRecipe(r);
    R.push(r);
  }
  evaluateRecipes(R);
  return R;
}

function selectPopulation(P, R) {
  R.sort((a, b) => b.fitness - a.fitness);
  P = P.slice(0, P.length/2).concat(R.slice(0, R.length/2));
  P.sort((a, b) => b.fitness - a.fitness);
  return P;
}

function update() {
  let R = generateRecipes(populationSize, population);
  population = selectPopulation(population, R);
}

function draw() {
  update();
  background(255);
  history.push(population[0].fitness);
  stroke(255, 0, 0);  
  for (let i = 0; i < min(history.length, width); i++) {
    line(width - i, height - history[history.length - 1 - i], width - i, height);
  }
  noStroke();
  text("max. fitness = " + history[history.length - 1], width - 140, 40);
  
  let recipe_text = population[0].name + "\n";
  for (let i of population[0].ingredients) {
    recipe_text += "\n" + i.amount + i.unit + " " + i.ingredient;
  }
  text(recipe_text, 40, 40);

  // REMOVE THIS TO RUN THE THING, added for safety to not overload when printing
  // noLoop();
}

function crossoverRecipes(r1, r2) {
  // choose crossover point in r1
  let p1 = int(random(r1.ingredients.length));
  // choose crossover point in r2
  let p2 = int(random(r2.ingredients.length));
  // get first ingredient sublist from r1
  let r1a = r1.ingredients.slice(0, p1);
  // get second ingredient sublist from r2
  let r2b = r2.ingredients.slice(p2);
  // create a new recipe
  let r = {};
  // add a default name
  r.name = "recipe " + recipe_number++;
  // add ingredients from sublists
  r.ingredients = r1a.concat(r2b);
  return r;
}

function mutateRecipe(r) {
  switch (int(random(4))) {
    case 0:
      // select a random ingredient
      let i = int(random(r.ingredients.length));
      // make a copy of the ingredient
      r.ingredients[i] = Object.assign({}, r.ingredients[i]);
      // change the amount of the ingredient by a small amount
      r.ingredients[i].amount += int(r.ingredients[i].amount * 0.1);
      // check that the amount is at least 1
      r.ingredients[i].amount = max(1, r.ingredients[i].amount);
      break;
    case 1:
      // select a random ingredient
      let j = random(r.ingredients.length);
      // make a copy of the ingredient
      r.ingredients[j] = Object.assign({}, r.ingredients[j]);
      // change the ingredient by selecting from all ingredients
      r.ingredients[j].ingredient = random(allIngredients).ingredient;
      break;
    case 2:
      // add an ingredient from all ingredients
      r.ingredients.push(random(allIngredients));
      break;
    case 3:
          // remove an ingredient
      if (r.ingredients.length > 1) {
        r.ingredients.splice(random(r.ingredients.length), 1);
      }
      break;
  }
}

function normaliseRecipe(r) {
  // before normalising the ingredient amounts
  // reformulate the recipe into unique ingredients
  let uniqueIngredientMap = new Map();
  for (const i of r.ingredients) {
    // if the map already has the ingredient add the amount
    if (uniqueIngredientMap.has(i.ingredient)) {
      let n = uniqueIngredientMap.get(i.ingredient);
      n.amount += i.amount;
    } else { // otherwise add a copy of the ingredient
      uniqueIngredientMap.set(i.ingredient, Object.assign({}, i));
    }
  }
  r.ingredients = Array.from(uniqueIngredientMap.values());
  
  // calculate the sum of all of the ingredient amounts
  let sum = r.ingredients.reduce((a, i) => a + i.amount, 0);
  // calculate the scaling factor to 1L of soup (ingredients)
  let scale = 1000 / sum;
  // rescale all of the ingredient amounts
  for (let i of r.ingredients) {
    i.amount = max(1, int(i.amount * scale));
  }
}