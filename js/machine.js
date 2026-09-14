const STORAGE_KEYS = {
  INVENTORY: 'espressocraft_inventory_v2',
  CUSTOM_RECIPES: 'espressocraft_custom_recipes_v2',
  STATS: 'espressocraft_stats_v2'
};

class CoffeeMachine {
  constructor(listeners = {}) {
    this.isBrewing = false;
    this.isCleaning = false;
    this.drinkSize = 1; // 1 = Single, 2 = Double
    this.currentBrew = null;

    this.listeners = {
      onInventoryChange: listeners.onInventoryChange || (() => {}),
      onMenuChange: listeners.onMenuChange || (() => {}),
      onBrewStatusChange: listeners.onBrewStatusChange || (() => {}),
      onCleanStatusChange: listeners.onCleanStatusChange || (() => {}),
      onStepChange: listeners.onStepChange || (() => {}),
      onLog: listeners.onLog || (() => {}),
      onStatsChange: listeners.onStatsChange || (() => {}),
      ...listeners
    };

    this.stats = this.loadStats();
    this.inventory = this.loadInventory();
    this.recipes = [];

    this.brewer = new BrewingUnit(
      (step, stepName, meta) => this.listeners.onStepChange(step, stepName, meta),
      (msg, type) => this.listeners.onLog(msg, type)
    );

    this.initRecipes();
  }

  loadInventory() {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.INVENTORY);
      if (saved) {
        const data = JSON.parse(saved);
        return new Inventory(data.water, data.milk, data.beans, data.maxWater, data.maxMilk, data.maxBeans);
      }
    } catch (e) {}
    return new Inventory(500, 300, 100);
  }

  saveInventory() {
    try {
      localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(this.inventory.getStock()));
    } catch (e) {}
  }

  loadStats() {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.STATS);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {}
    return {
      totalBrewed: 0,
      totalWaterMl: 0,
      totalMilkMl: 0,
      totalBeansG: 0,
      cleanCycles: 0,
      drinkCounts: {},
      lastBrewed: null
    };
  }

  saveStats() {
    try {
      localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(this.stats));
    } catch (e) {}
    this.listeners.onStatsChange(this.stats);
  }

  initRecipes() {
    // Default 7 recipes from main.cpp
    const defaults = [
      new Recipe('Espresso', 50, 0, 18, '☕', 'black', false, 'rec_espresso'),
      new Recipe('Latte', 50, 150, 18, '🥛', 'milk', false, 'rec_latte'),
      new Recipe('Americano', 150, 0, 18, '🧋', 'black', false, 'rec_americano'),
      new Recipe('Double Espresso', 100, 0, 36, '☕', 'black', false, 'rec_double_espresso'),
      new Recipe('Cappuccino', 50, 100, 18, '☕', 'milk', false, 'rec_cappuccino'),
      new Recipe('Flat White', 60, 120, 18, '☕', 'milk', false, 'rec_flat_white'),
      new Recipe('Macchiato', 40, 30, 18, '☕', 'milk', false, 'rec_macchiato')
    ];

    this.recipes = [...defaults];

    // Load custom recipes
    try {
      const savedCustom = localStorage.getItem(STORAGE_KEYS.CUSTOM_RECIPES);
      if (savedCustom) {
        const customArr = JSON.parse(savedCustom);
        customArr.forEach(c => {
          this.recipes.push(new Recipe(c.name, c.waterRequired, c.milkRequired, c.beansRequired, c.icon, 'custom', true, c.id));
        });
      }
    } catch (e) {}
  }

  saveCustomRecipes() {
    try {
      const customOnly = this.recipes.filter(r => r.isCustom);
      localStorage.setItem(STORAGE_KEYS.CUSTOM_RECIPES, JSON.stringify(customOnly));
    } catch (e) {}
  }

  addRecipe(name, water, milk, beans, icon = '✨') {
    const category = milk > 0 ? 'milk' : 'black';
    const newRecipe = new Recipe(name, water, milk, beans, icon, 'custom', true);
    this.recipes.push(newRecipe);
    this.saveCustomRecipes();
    this.listeners.onMenuChange(this.recipes);
    this.listeners.onLog(`[RECIPE] Created new artisanal drink "${name}" (${water}ml W / ${milk}ml M / ${beans}g B)`, 'info');
    return newRecipe;
  }

  deleteRecipe(id) {
    const idx = this.recipes.findIndex(r => r.id === id && r.isCustom);
    if (idx !== -1) {
      const deleted = this.recipes.splice(idx, 1)[0];
      this.saveCustomRecipes();
      this.listeners.onMenuChange(this.recipes);
      this.listeners.onLog(`[RECIPE] Removed recipe "${deleted.name}" from catalog.`, 'info');
      return true;
    }
    return false;
  }

  setDrinkSize(multiplier) {
    this.drinkSize = multiplier === 2 ? 2 : 1;
    this.listeners.onMenuChange(this.recipes);
  }

  getEffectiveSpecs(recipe) {
    return {
      water: recipe.waterRequired * this.drinkSize,
      milk: recipe.milkRequired * this.drinkSize,
      beans: recipe.beansRequired * this.drinkSize
    };
  }

  refill(water, milk, beans) {
    this.inventory.refill(water, milk, beans);
    this.saveInventory();
    this.listeners.onInventoryChange(this.inventory.getStock());
    this.listeners.onLog(`[STOCK] Refilled ingredients (+${water}ml Water, +${milk}ml Milk, +${beans}g Beans).`, 'success');
  }

  maxOutIngredients() {
    this.inventory.maxOut();
    this.saveInventory();
    this.listeners.onInventoryChange(this.inventory.getStock());
    this.listeners.onLog(`[STOCK] Topped up all tanks to maximum capacity!`, 'success');
  }

  canMakeDrink(recipe) {
    const specs = this.getEffectiveSpecs(recipe);
    return this.inventory.hasEnough(specs.water, specs.milk, specs.beans);
  }

  async selectDrink(recipeIdOrIndex) {
    if (this.isBrewing || this.isCleaning) {
      this.listeners.onLog(`[BUSY] Machine is currently processing another task.`, 'error');
      sound.playError();
      return false;
    }

    let selected = null;
    if (typeof recipeIdOrIndex === 'number') {
      selected = this.recipes[recipeIdOrIndex];
    } else {
      selected = this.recipes.find(r => r.id === recipeIdOrIndex);
    }

    if (!selected) {
      this.listeners.onLog(`[ERROR] Invalid drink selection.`, 'error');
      sound.playError();
      return false;
    }

    const specs = this.getEffectiveSpecs(selected);

    if (!this.inventory.hasEnough(specs.water, specs.milk, specs.beans)) {
      this.listeners.onLog(`[ALERT] Insufficient ingredients to brew ${selected.name} (${this.drinkSize === 2 ? 'Double' : 'Single'}). Please refill stock!`, 'error');
      sound.playError();
      return false;
    }

    this.isBrewing = true;
    this.currentBrew = {
      recipe: selected,
      size: this.drinkSize,
      specs: specs
    };

    this.listeners.onBrewStatusChange(true, selected, this.drinkSize, specs);
    this.listeners.onLog(`[BREW] Initializing ${this.drinkSize === 2 ? 'Double' : 'Single'} ${selected.name}...`, 'highlight');

    // Consume stock immediately
    this.inventory.consume(specs.water, specs.milk, specs.beans);
    this.saveInventory();
    this.listeners.onInventoryChange(this.inventory.getStock());

    try {
      // Step 1: Grind Beans
      sound.playGrind();
      await this.brewer.grindBeans(specs.beans);

      // Step 2: Heat Water & Build Pressure
      sound.playSteam();
      await this.brewer.heatWater(specs.water);

      // Step 3: Froth Milk (if recipe contains milk)
      if (specs.milk > 0) {
        sound.playFroth();
      }
      await this.brewer.frothMilk(specs.milk);

      // Step 4: Dispense Liquid
      sound.playPour();
      await this.brewer.dispense(selected.name);

      // Complete
      sound.playChime();
      this.listeners.onLog(`✨ Handcrafted ${this.drinkSize === 2 ? 'Double ' : ''}${selected.name} is poured and ready!`, 'success');

      // Update Lifetime Stats
      this.stats.totalBrewed += 1;
      this.stats.totalWaterMl += specs.water;
      this.stats.totalMilkMl += specs.milk;
      this.stats.totalBeansG += specs.beans;
      this.stats.lastBrewed = {
        name: selected.name,
        size: this.drinkSize === 2 ? 'Double' : 'Single',
        timestamp: new Date().toLocaleTimeString()
      };
      this.stats.drinkCounts[selected.name] = (this.stats.drinkCounts[selected.name] || 0) + 1;
      this.saveStats();

    } catch (err) {
      this.listeners.onLog(`[ERROR] Brewing interrupted: ${err.message}`, 'error');
      sound.playError();
    } finally {
      this.isBrewing = false;
      this.listeners.onBrewStatusChange(false, selected, this.drinkSize, specs);
    }

    return true;
  }

  async cleanMachine() {
    if (this.isBrewing || this.isCleaning) {
      sound.playError();
      return false;
    }

    if (this.inventory.water < 50) {
      this.listeners.onLog(`[ALERT] Need at least 50ml water to run grouphead clean flush.`, 'error');
      sound.playError();
      return false;
    }

    this.isCleaning = true;
    this.inventory.consume(50, 0, 0);
    this.saveInventory();
    this.listeners.onInventoryChange(this.inventory.getStock());
    this.listeners.onCleanStatusChange(true);

    try {
      sound.playSteam();
      await this.brewer.sleep(400);
      sound.playFlush();
      await this.brewer.cleanFlush();
      sound.playChime();
      this.stats.cleanCycles += 1;
      this.saveStats();
      this.listeners.onLog(`✨ Grouphead & steam wand hygiene flush complete!`, 'success');
    } catch (e) {
      this.listeners.onLog(`[ERROR] Cleaning aborted: ${e.message}`, 'error');
    } finally {
      this.isCleaning = false;
      this.listeners.onCleanStatusChange(false);
    }
    return true;
  }
}
