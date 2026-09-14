// Direct object-oriented models reflecting main.cpp logic with advanced state tracking

class Recipe {
  constructor(name, waterRequired, milkRequired, beansRequired, icon = '☕', category = 'black', isCustom = false, id = null) {
    this.id = id || `recipe_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    this.name = name;
    this.waterRequired = Number(waterRequired);
    this.milkRequired = Number(milkRequired);
    this.beansRequired = Number(beansRequired);
    this.icon = icon;
    this.category = category || (milkRequired > 0 ? 'milk' : 'black');
    this.isCustom = isCustom;
  }
}

class Inventory {
  constructor(water = 500, milk = 300, beans = 100, maxWater = 1500, maxMilk = 1000, maxBeans = 500) {
    this.water = water;
    this.milk = milk;
    this.beans = beans;
    this.maxWater = maxWater;
    this.maxMilk = maxMilk;
    this.maxBeans = maxBeans;
  }

  refill(addWater, addMilk, addBeans) {
    this.water = Math.min(this.maxWater, Math.max(0, this.water + Number(addWater)));
    this.milk = Math.min(this.maxMilk, Math.max(0, this.milk + Number(addMilk)));
    this.beans = Math.min(this.maxBeans, Math.max(0, this.beans + Number(addBeans)));
  }

  maxOut() {
    this.water = this.maxWater;
    this.milk = this.maxMilk;
    this.beans = this.maxBeans;
  }

  hasEnough(needWater, needMilk, needBeans) {
    return (
      this.water >= needWater &&
      this.milk >= needMilk &&
      this.beans >= needBeans
    );
  }

  consume(useWater, useMilk, useBeans) {
    this.water = Math.max(0, this.water - useWater);
    this.milk = Math.max(0, this.milk - useMilk);
    this.beans = Math.max(0, this.beans - useBeans);
  }

  getStock() {
    return {
      water: this.water,
      milk: this.milk,
      beans: this.beans,
      maxWater: this.maxWater,
      maxMilk: this.maxMilk,
      maxBeans: this.maxBeans,
      waterPercent: (this.water / this.maxWater) * 100,
      milkPercent: (this.milk / this.maxMilk) * 100,
      beansPercent: (this.beans / this.maxBeans) * 100,
      isWaterLow: (this.water / this.maxWater) < 0.2,
      isMilkLow: (this.milk / this.maxMilk) < 0.2,
      isBeansLow: (this.beans / this.maxBeans) < 0.2
    };
  }
}

class BrewingUnit {
  constructor(onStepChange, onLog) {
    this.onStepChange = onStepChange || (() => {});
    this.onLog = onLog || (() => {});
  }

  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async grindBeans(grams) {
    this.onStepChange(1, 'Grinding', grams);
    this.onLog(`[GRINDER] Grinding ${grams}g of fine espresso roast beans...`, 'highlight');
    await this.sleep(1500);
  }

  async heatWater(ml) {
    this.onStepChange(2, 'Heating', ml);
    this.onLog(`[BOILER] Pressurizing & heating ${ml}ml purified water to 93.5°C...`, 'highlight');
    await this.sleep(1500);
  }

  async frothMilk(ml) {
    if (ml > 0) {
      this.onStepChange(3, 'Frothing', ml);
      this.onLog(`[STEAM-WAND] Steaming & micro-foaming ${ml}ml milk with velvety texture...`, 'highlight');
      await this.sleep(1400);
    } else {
      this.onStepChange(3, 'Skipped Frothing (No Milk)', 0);
      await this.sleep(350);
    }
  }

  async dispense(drinkName) {
    this.onStepChange(4, 'Dispensing', drinkName);
    this.onLog(`[GROUPHEAD] Extracting and pouring ${drinkName} into cup...`, 'highlight');
    await this.sleep(1800);
  }

  async cleanFlush() {
    this.onStepChange(2, 'Heating Boiler', 50);
    this.onLog(`[CLEAN] Flushing grouphead with 50ml boiling water & steam...`, 'highlight');
    await this.sleep(1200);
    this.onStepChange(4, 'Flushing Spout', 50);
    await this.sleep(1500);
  }
}
