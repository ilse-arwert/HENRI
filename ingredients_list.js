let json = {};
let recipes = [];
let allIngredients = [];


function preload() {
  json = loadJSON("data/recipes-no-soup.json");
}

function setup() {

  recipes = json.recipes;
  
  // extract all of the unique ingredients from the inspiring set and output a JSON with them
  // this helped us create the ingredients array that is in the JSON file with the recipes
  for (const r of recipes) {
    for (const i of r.ingredients) {

      let isUnique = true;
      
      allIngredients.forEach(e => {
        if (e.name == i.ingredient.toLowerCase()){
          isUnique = false;
        }
      });
      if (isUnique){
        allIngredients.push({"name": i.ingredient.toLowerCase(), "category": ""});
      }
      
    }
  }
  saveJSON(allIngredients);

}
