// DOM Elements
const waterValueEl = document.getElementById('waterValue');
const waterMeterEl = document.getElementById('waterMeter');
const waterPercentEl = document.getElementById('waterPercent');
const waterCardEl = document.getElementById('waterCard');

const milkValueEl = document.getElementById('milkValue');
const milkMeterEl = document.getElementById('milkMeter');
const milkPercentEl = document.getElementById('milkPercent');
const milkCardEl = document.getElementById('milkCard');

const beansValueEl = document.getElementById('beansValue');
const beansMeterEl = document.getElementById('beansMeter');
const beansPercentEl = document.getElementById('beansPercent');
const beansCardEl = document.getElementById('beansCard');

const quickTopUpAllBtn = document.getElementById('quickTopUpAllBtn');

// Header & Status
const machineStatusEl = document.getElementById('machineStatus');
const machineStatusTextEl = document.getElementById('machineStatusText');
const currentBrewDrinkEl = document.getElementById('currentBrewDrink');
const drinkCatalogEl = document.getElementById('drinkCatalog');
const audioToggleBtn = document.getElementById('audioToggleBtn');
const audioStatusText = document.getElementById('audioStatusText');
const cleanMachineBtn = document.getElementById('cleanMachineBtn');
const openStatsBtn = document.getElementById('openStatsBtn');

// Shot Size Controls & Category Tabs
const singleShotBtn = document.getElementById('singleShotBtn');
const doubleShotBtn = document.getElementById('doubleShotBtn');
const categoryTabs = document.querySelectorAll('.category-tab');

// Sensor Gauges
const gaugeTempValEl = document.getElementById('gaugeTempVal');
const gaugeTempBarEl = document.getElementById('gaugeTempBar');
const tempStatusBadgeEl = document.getElementById('tempStatusBadge');

const gaugePressureValEl = document.getElementById('gaugePressureVal');
const gaugePressureBarEl = document.getElementById('gaugePressureBar');
const pressureStatusBadgeEl = document.getElementById('pressureStatusBadge');

// Pipeline Stage Elements
const stageEls = [
  document.getElementById('stage1'),
  document.getElementById('stage2'),
  document.getElementById('stage3'),
  document.getElementById('stage4')
];
const stageSubs = [
  document.getElementById('stage1Sub'),
  document.getElementById('stage2Sub'),
  document.getElementById('stage3Sub'),
  document.getElementById('stage4Sub')
];
const overallProgressEl = document.getElementById('overallProgress');

// Visual Cup Elements
const cupStageEl = document.querySelector('.cup-stage');
const visualCupEl = document.getElementById('visualCup');
const cupWaterEl = document.getElementById('cupWater');
const cupEspressoEl = document.getElementById('cupEspresso');
const cupMilkEl = document.getElementById('cupMilk');
const cupFoamEl = document.getElementById('cupFoam');
const latteArtBadgeEl = document.getElementById('latteArtBadge');
const liquidStreamEl = document.getElementById('liquidStream');
const cupSteamEl = document.getElementById('cupSteam');
const takeCupBannerEl = document.getElementById('takeCupBanner');
const takeCupBtnEl = document.getElementById('takeCupBtn');

// Terminal Elements
const terminalLogsEl = document.getElementById('terminalLogs');
const clearLogsBtn = document.getElementById('clearLogsBtn');

// Modals
const openRefillBtn = document.getElementById('openRefillBtn');
const refillModal = document.getElementById('refillModal');
const closeRefillBtn = document.getElementById('closeRefillBtn');
const cancelRefillBtn = document.getElementById('cancelRefillBtn');
const refillForm = document.getElementById('refillForm');
const presetSmallRefill = document.getElementById('presetSmallRefill');
const presetMaxRefill = document.getElementById('presetMaxRefill');

const customRecipeModal = document.getElementById('customRecipeModal');
const closeCustomModalBtn = document.getElementById('closeCustomModalBtn');
const cancelCustomBtn = document.getElementById('cancelCustomBtn');
const customRecipeForm = document.getElementById('customRecipeForm');
const iconChoices = document.querySelectorAll('.icon-choice');
const customIconInput = document.getElementById('customIconInput');
const customNameInput = document.getElementById('customNameInput');
const customWaterInput = document.getElementById('customWaterInput');
const customMilkInput = document.getElementById('customMilkInput');
const customBeansInput = document.getElementById('customBeansInput');
const previewDrinkIcon = document.getElementById('previewDrinkIcon');
const previewDrinkText = document.getElementById('previewDrinkText');

const statsModal = document.getElementById('statsModal');
const closeStatsBtn = document.getElementById('closeStatsBtn');
const closeStatsBtn2 = document.getElementById('closeStatsBtn2');
const statTotalBrewedEl = document.getElementById('statTotalBrewed');
const statTotalWaterEl = document.getElementById('statTotalWater');
const statTotalMilkEl = document.getElementById('statTotalMilk');
const statTotalBeansEl = document.getElementById('statTotalBeans');
const statCleanCyclesEl = document.getElementById('statCleanCycles');
const statFavoriteDrinkEl = document.getElementById('statFavoriteDrink');
const statLastBrewedEl = document.getElementById('statLastBrewed');

// Application State
let activeCategory = 'all';
let currentTargetTemp = 93.5;
let currentDisplayTemp = 93.5;
let currentTargetPressure = 0.0;
let currentDisplayPressure = 0.0;
let isCupReadyToTake = false;
let lastBrewedSpecs = null;

// Initialize Coffee Machine Core
const machine = new CoffeeMachine({
  onInventoryChange: (stock) => updateInventoryUI(stock),
  onMenuChange: (recipes) => renderMenu(recipes),
  onBrewStatusChange: (isBrewing, drink, size, specs) => handleBrewStatusChange(isBrewing, drink, size, specs),
  onCleanStatusChange: (isCleaning) => handleCleanStatusChange(isCleaning),
  onStepChange: (step, stepName, meta) => handleStepChange(step, stepName, meta),
  onLog: (msg, type) => appendLog(msg, type),
  onStatsChange: (stats) => updateStatsUI(stats)
});

// Real-Time Sensor Gauge Physics Loop
setInterval(() => {
  // Temperature physics
  const tempDelta = (currentTargetTemp - currentDisplayTemp) * 0.15;
  const tempJitter = machine.isBrewing || machine.isCleaning ? (Math.random() * 0.4 - 0.2) : (Math.random() * 0.1 - 0.05);
  currentDisplayTemp = Math.max(20, Math.min(130, currentDisplayTemp + tempDelta + tempJitter));
  
  gaugeTempValEl.textContent = currentDisplayTemp.toFixed(1);
  const tempPercent = Math.min(100, Math.max(0, (currentDisplayTemp / 130) * 100));
  gaugeTempBarEl.style.width = `${tempPercent}%`;

  if (currentDisplayTemp > 110) {
    tempStatusBadgeEl.textContent = 'Steam Mode';
    tempStatusBadgeEl.style.color = '#ff4757';
  } else if (currentDisplayTemp >= 90 && currentDisplayTemp <= 98) {
    tempStatusBadgeEl.textContent = 'Optimal PID';
    tempStatusBadgeEl.style.color = 'var(--status-ready)';
  } else {
    tempStatusBadgeEl.textContent = 'Heating';
    tempStatusBadgeEl.style.color = 'var(--accent-gold)';
  }

  // Pressure physics
  const pressureDelta = (currentTargetPressure - currentDisplayPressure) * 0.2;
  const pressureJitter = (currentTargetPressure > 5) ? (Math.random() * 0.3 - 0.15) : 0;
  currentDisplayPressure = Math.max(0, Math.min(15, currentDisplayPressure + pressureDelta + pressureJitter));

  gaugePressureValEl.textContent = currentDisplayPressure.toFixed(1);
  const pressurePercent = Math.min(100, Math.max(0, (currentDisplayPressure / 12) * 100));
  gaugePressureBarEl.style.width = `${pressurePercent}%`;

  if (currentDisplayPressure >= 8.5) {
    pressureStatusBadgeEl.textContent = '9-Bar Ext.';
    pressureStatusBadgeEl.style.color = 'var(--accent-gold)';
  } else if (currentDisplayPressure > 1) {
    pressureStatusBadgeEl.textContent = 'Pressurizing';
    pressureStatusBadgeEl.style.color = 'var(--water-color)';
  } else {
    pressureStatusBadgeEl.textContent = 'Idle';
    pressureStatusBadgeEl.style.color = 'var(--text-muted)';
  }
}, 100);

// Update Inventory UI
function updateInventoryUI(stock) {
  waterValueEl.textContent = stock.water;
  waterMeterEl.style.width = `${stock.waterPercent}%`;
  waterPercentEl.textContent = `${Math.round(stock.waterPercent)}%`;
  waterCardEl.classList.toggle('low-stock', stock.isWaterLow);

  milkValueEl.textContent = stock.milk;
  milkMeterEl.style.width = `${stock.milkPercent}%`;
  milkPercentEl.textContent = `${Math.round(stock.milkPercent)}%`;
  milkCardEl.classList.toggle('low-stock', stock.isMilkLow);

  beansValueEl.textContent = stock.beans;
  beansMeterEl.style.width = `${stock.beansPercent}%`;
  beansPercentEl.textContent = `${Math.round(stock.beansPercent)}%`;
  beansCardEl.classList.toggle('low-stock', stock.isBeansLow);

  renderMenu(machine.recipes);
}

// Render Menu Cards with Category Filter and Shot Multiplier
function renderMenu(recipes) {
  drinkCatalogEl.innerHTML = '';

  const filtered = recipes.filter(r => {
    if (activeCategory === 'all') return true;
    if (activeCategory === 'black') return r.category === 'black';
    if (activeCategory === 'milk') return r.category === 'milk';
    if (activeCategory === 'custom') return r.isCustom === true;
    return true;
  });

  filtered.forEach(recipe => {
    const specs = machine.getEffectiveSpecs(recipe);
    const hasEnough = machine.canMakeDrink(recipe);
    const card = document.createElement('div');
    card.className = `drink-card ${hasEnough ? '' : 'disabled'}`;

    card.innerHTML = `
      <div>
        <div class="drink-card-top">
          <div class="drink-header">
            <div class="drink-icon-wrapper">${recipe.icon || '☕'}</div>
            <div>
              <div class="drink-name">${recipe.name}</div>
              <div class="drink-category-tag">${recipe.isCustom ? 'Artisanal Custom' : (recipe.category === 'milk' ? 'Milk Specialty' : 'Black Coffee')}</div>
            </div>
          </div>
          ${recipe.isCustom ? `<button class="custom-delete-btn" title="Delete custom recipe" data-id="${recipe.id}">🗑️</button>` : ''}
        </div>
      </div>

      <div class="drink-specs">
        <div class="spec-item">
          <span>💧 Water</span>
          <span class="spec-val">${specs.water} ml</span>
        </div>
        <div class="spec-item">
          <span>🥛 Milk</span>
          <span class="spec-val">${specs.milk} ml</span>
        </div>
        <div class="spec-item">
          <span>🫘 Beans</span>
          <span class="spec-val">${specs.beans} g</span>
        </div>
      </div>

      <button class="brew-btn" ${hasEnough && !machine.isBrewing && !machine.isCleaning ? '' : 'disabled'}>
        ${hasEnough ? `Brew ${machine.drinkSize === 2 ? 'Double' : 'Single'}` : 'Out of Stock'}
      </button>
    `;

    // Brew Button Click
    const brewBtn = card.querySelector('.brew-btn');
    brewBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      sound.playClick();
      if (!machine.isBrewing && !machine.isCleaning && hasEnough) {
        machine.selectDrink(recipe.id);
      } else if (!hasEnough) {
        appendLog(`Cannot brew ${recipe.name}: Insufficient stock. Please refill.`, 'error');
        sound.playError();
      }
    });

    // Delete custom recipe button
    const delBtn = card.querySelector('.custom-delete-btn');
    if (delBtn) {
      delBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        sound.playClick();
        if (confirm(`Remove custom drink "${recipe.name}"?`)) {
          machine.deleteRecipe(recipe.id);
        }
      });
    }

    drinkCatalogEl.appendChild(card);
  });

  // Add Custom Drink Card
  const customCard = document.createElement('div');
  customCard.className = 'custom-recipe-card';
  customCard.innerHTML = `
    <div style="font-size: 2.2rem;">✨</div>
    <div style="font-weight: 700; color: var(--accent-crema); font-size: 1.05rem;">Create Custom Drink</div>
    <div style="font-size: 0.76rem; color: var(--text-dim); line-height: 1.4;">Formulate custom water, milk & bean ratios</div>
  `;
  customCard.addEventListener('click', () => {
    sound.playClick();
    openCustomModal();
  });
  drinkCatalogEl.appendChild(customCard);
}

// Category Tabs Handlers
categoryTabs.forEach(tab => {
  tab.addEventListener('click', () => {
    sound.playClick();
    categoryTabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    activeCategory = tab.dataset.cat;
    renderMenu(machine.recipes);
  });
});

// Shot Size Toggle Handlers
singleShotBtn.addEventListener('click', () => {
  sound.playClick();
  singleShotBtn.classList.add('active');
  doubleShotBtn.classList.remove('active');
  machine.setDrinkSize(1);
});

doubleShotBtn.addEventListener('click', () => {
  sound.playClick();
  doubleShotBtn.classList.add('active');
  singleShotBtn.classList.remove('active');
  machine.setDrinkSize(2);
});

// Handle Brewing Status Changes
function handleBrewStatusChange(isBrewing, drink, size, specs) {
  if (isBrewing) {
    machineStatusEl.className = 'machine-status-badge brewing';
    machineStatusTextEl.textContent = `Brewing: ${drink.name}`;
    currentBrewDrinkEl.textContent = `Brewing ${size === 2 ? 'Double ' : ''}${drink.name}`;
    lastBrewedSpecs = specs;
    takeCupBannerEl.classList.remove('visible');
    isCupReadyToTake = false;
    resetCupVisuals();
  } else {
    machineStatusEl.className = 'machine-status-badge';
    machineStatusTextEl.textContent = 'Machine Ready';
    currentBrewDrinkEl.textContent = 'Ready';
    liquidStreamEl.classList.remove('streaming');
    cupStageEl.classList.remove('shaking');
    overallProgressEl.style.width = '100%';
    currentTargetPressure = 0.0;
    currentTargetTemp = 93.5;

    // Show Take Cup Banner
    if (drink) {
      isCupReadyToTake = true;
      takeCupBannerEl.classList.add('visible');
    }

    setTimeout(() => {
      resetStepIndicators();
      overallProgressEl.style.width = '0%';
    }, 4500);
  }
  renderMenu(machine.recipes);
}

// Handle Cleaning Status Changes
function handleCleanStatusChange(isCleaning) {
  if (isCleaning) {
    machineStatusEl.className = 'machine-status-badge cleaning';
    machineStatusTextEl.textContent = 'Cleaning Grouphead';
    currentBrewDrinkEl.textContent = 'Flushing Spout';
    currentTargetTemp = 100.0;
    currentTargetPressure = 4.0;
    liquidStreamEl.className = 'liquid-stream streaming water-stream';
    cupSteamEl.classList.add('active');
  } else {
    machineStatusEl.className = 'machine-status-badge';
    machineStatusTextEl.textContent = 'Machine Ready';
    currentBrewDrinkEl.textContent = 'Ready';
    liquidStreamEl.className = 'liquid-stream';
    cupSteamEl.classList.remove('active');
    currentTargetTemp = 93.5;
    currentTargetPressure = 0.0;
    resetStepIndicators();
  }
  renderMenu(machine.recipes);
}

// Handle Visual Pipeline Steps & Physical Cup Fill
function handleStepChange(step, stepName, meta) {
  resetStepIndicators();
  overallProgressEl.style.width = `${step * 25}%`;

  for (let i = 0; i < step - 1; i++) {
    stageEls[i].classList.add('completed');
  }

  if (step >= 1 && step <= 4) {
    stageEls[step - 1].classList.add('active');
  }

  // Step 1: Grinding
  if (step === 1) {
    cupStageEl.classList.add('shaking');
    stageSubs[0].textContent = `${meta}g Fine`;
    currentTargetTemp = 93.5;
    currentTargetPressure = 0.0;
  } else {
    cupStageEl.classList.remove('shaking');
    stageSubs[0].textContent = 'Done';
  }

  // Step 2: Heating & Pressurizing
  if (step === 2) {
    stageSubs[1].textContent = '93.8°C / 9 Bar';
    currentTargetTemp = 95.5;
    currentTargetPressure = 4.5;
    cupSteamEl.classList.add('active');
  } else if (step > 2) {
    stageSubs[1].textContent = '93.5°C';
  }

  // Step 3: Steam & Froth Milk
  if (step === 3) {
    if (meta > 0) {
      stageSubs[2].textContent = `${meta}ml Microfoam`;
      currentTargetTemp = 122.0;
      currentTargetPressure = 3.0;
    } else {
      stageSubs[2].textContent = 'Skipped';
    }
  } else if (step > 3) {
    stageSubs[2].textContent = 'Done';
  }

  // Step 4: Dispensing & Extraction
  if (step === 4) {
    stageSubs[3].textContent = 'Extracting...';
    currentTargetTemp = 94.0;
    currentTargetPressure = 9.2;
    cupSteamEl.classList.add('active');

    // Choose stream color
    if (lastBrewedSpecs && lastBrewedSpecs.milk > 0) {
      liquidStreamEl.className = 'liquid-stream streaming milk-stream';
    } else {
      liquidStreamEl.className = 'liquid-stream streaming';
    }

    // Compute proportional cup layers based on actual recipe
    calculateAndFillCup(lastBrewedSpecs);
  }
}

// Proportional Cup Fill Calculator
function calculateAndFillCup(specs) {
  if (!specs) {
    cupEspressoEl.style.height = '40%';
    cupFoamEl.style.height = '15%';
    return;
  }

  const { water, milk, beans } = specs;
  const totalLiquid = water + milk;

  setTimeout(() => {
    if (milk === 0) {
      // Black Coffee / Espresso / Americano
      if (water > 100) {
        // Americano / Long Black
        cupWaterEl.style.height = '45%';
        cupEspressoEl.style.height = '35%';
        cupMilkEl.style.height = '0%';
        cupFoamEl.style.height = '8%'; // Thin Crema
      } else {
        // Pure Espresso / Double Espresso
        cupWaterEl.style.height = '0%';
        cupEspressoEl.style.height = '50%';
        cupMilkEl.style.height = '0%';
        cupFoamEl.style.height = '18%'; // Rich Crema
      }
    } else {
      // Milk Drink (Latte, Cappuccino, Flat White, etc.)
      const espressoPortion = Math.min(45, Math.max(20, (water / totalLiquid) * 75));
      const milkPortion = Math.min(50, Math.max(25, (milk / totalLiquid) * 60));
      const foamPortion = Math.min(22, Math.max(12, 100 - espressoPortion - milkPortion - 15));

      cupWaterEl.style.height = '0%';
      cupEspressoEl.style.height = `${espressoPortion}%`;
      cupMilkEl.style.height = `${milkPortion}%`;
      cupFoamEl.style.height = `${foamPortion}%`;
      cupFoamEl.classList.add('has-art');
    }
  }, 300);
}

function resetStepIndicators() {
  stageEls.forEach(el => el.classList.remove('active', 'completed'));
  stageSubs[0].textContent = 'Ready';
  stageSubs[1].textContent = '93.5°C';
  stageSubs[2].textContent = 'Auto';
  stageSubs[3].textContent = 'Ready';
}

function resetCupVisuals() {
  cupWaterEl.style.height = '0%';
  cupEspressoEl.style.height = '0%';
  cupMilkEl.style.height = '0%';
  cupFoamEl.style.height = '0%';
  cupFoamEl.classList.remove('has-art');
  cupSteamEl.classList.remove('active');
  liquidStreamEl.className = 'liquid-stream';
}

// Take Cup / Sip Interaction
takeCupBtnEl.addEventListener('click', () => {
  sound.playSip();
  takeCupBannerEl.classList.remove('visible');
  isCupReadyToTake = false;
  appendLog(`✨ Ahhh! You enjoyed your freshly crafted coffee. Delicious!`, 'success');
  
  // Animate cup emptying
  setTimeout(() => {
    resetCupVisuals();
  }, 400);
});

// Clean Machine Button
cleanMachineBtn.addEventListener('click', () => {
  sound.playClick();
  if (confirm('Run automated grouphead & steam wand cleaning flush (50ml hot water)?')) {
    machine.cleanMachine();
  }
});

// Audio Toggle Button
audioToggleBtn.addEventListener('click', () => {
  const isMuted = sound.toggleMute();
  audioToggleBtn.classList.toggle('muted', isMuted);
  audioStatusText.textContent = isMuted ? 'Sound Muted' : 'Sound On';
});

// Quick Top Up All Button
quickTopUpAllBtn.addEventListener('click', () => {
  sound.playClick();
  machine.maxOutIngredients();
});

// Quick Add Chips
document.querySelectorAll('.quick-add-chip').forEach(chip => {
  chip.addEventListener('click', () => {
    sound.playClick();
    const type = chip.dataset.type;
    const amount = Number(chip.dataset.amount) || 0;
    if (type === 'water') machine.refill(amount, 0, 0);
    if (type === 'milk') machine.refill(0, amount, 0);
    if (type === 'beans') machine.refill(0, 0, amount);
  });
});

// Activity Logging
function appendLog(message, type = 'info') {
  const entry = document.createElement('div');
  entry.className = `log-entry ${type}`;
  const time = new Date().toLocaleTimeString();
  entry.textContent = `> [${time}] ${message}`;
  terminalLogsEl.appendChild(entry);
  terminalLogsEl.scrollTop = terminalLogsEl.scrollHeight;
}

clearLogsBtn.addEventListener('click', () => {
  sound.playClick();
  terminalLogsEl.innerHTML = `<div class="log-entry">> [${new Date().toLocaleTimeString()}] Console logs cleared.</div>`;
});

// Refill Station Modal Controls
openRefillBtn.addEventListener('click', () => {
  sound.playClick();
  refillModal.classList.add('open');
});

closeRefillBtn.addEventListener('click', () => {
  sound.playClick();
  refillModal.classList.remove('open');
});

cancelRefillBtn.addEventListener('click', () => {
  sound.playClick();
  refillModal.classList.remove('open');
});

presetSmallRefill.addEventListener('click', () => {
  sound.playClick();
  document.getElementById('refillWaterInput').value = 500;
  document.getElementById('refillMilkInput').value = 300;
  document.getElementById('refillBeansInput').value = 100;
});

presetMaxRefill.addEventListener('click', () => {
  sound.playClick();
  machine.maxOutIngredients();
  refillModal.classList.remove('open');
});

refillForm.addEventListener('submit', (e) => {
  e.preventDefault();
  sound.playClick();
  const water = parseInt(document.getElementById('refillWaterInput').value) || 0;
  const milk = parseInt(document.getElementById('refillMilkInput').value) || 0;
  const beans = parseInt(document.getElementById('refillBeansInput').value) || 0;

  machine.refill(water, milk, beans);
  refillModal.classList.remove('open');
});

// Custom Recipe Modal & Icon Picker
function openCustomModal() {
  updateRecipeLivePreview();
  customRecipeModal.classList.add('open');
}

closeCustomModalBtn.addEventListener('click', () => {
  sound.playClick();
  customRecipeModal.classList.remove('open');
});

cancelCustomBtn.addEventListener('click', () => {
  sound.playClick();
  customRecipeModal.classList.remove('open');
});

iconChoices.forEach(btn => {
  btn.addEventListener('click', () => {
    sound.playClick();
    iconChoices.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    customIconInput.value = btn.dataset.icon;
    updateRecipeLivePreview();
  });
});

[customNameInput, customWaterInput, customMilkInput, customBeansInput].forEach(inp => {
  inp.addEventListener('input', () => updateRecipeLivePreview());
});

function updateRecipeLivePreview() {
  const icon = customIconInput.value || '☕';
  const name = customNameInput.value || 'Custom Drink';
  const w = customWaterInput.value || 0;
  const m = customMilkInput.value || 0;
  const b = customBeansInput.value || 0;

  previewDrinkIcon.textContent = icon;
  previewDrinkText.textContent = `${name}: ${w}ml Water • ${m}ml Milk • ${b}g Beans`;
}

customRecipeForm.addEventListener('submit', (e) => {
  e.preventDefault();
  sound.playClick();
  const name = customNameInput.value.trim();
  const water = parseInt(customWaterInput.value) || 0;
  const milk = parseInt(customMilkInput.value) || 0;
  const beans = parseInt(customBeansInput.value) || 0;
  const icon = customIconInput.value || '☕';

  if (name) {
    machine.addRecipe(name, water, milk, beans, icon);
    customRecipeForm.reset();
    customIconInput.value = '☕';
    iconChoices.forEach((b, i) => b.classList.toggle('active', i === 0));
    customRecipeModal.classList.remove('open');
  }
});

// Stats Modal Controls
openStatsBtn.addEventListener('click', () => {
  sound.playClick();
  updateStatsUI(machine.stats);
  statsModal.classList.add('open');
});

closeStatsBtn.addEventListener('click', () => {
  sound.playClick();
  statsModal.classList.remove('open');
});

closeStatsBtn2.addEventListener('click', () => {
  sound.playClick();
  statsModal.classList.remove('open');
});

function updateStatsUI(stats) {
  statTotalBrewedEl.textContent = stats.totalBrewed;
  statTotalWaterEl.textContent = `${stats.totalWaterMl} ml`;
  statTotalMilkEl.textContent = `${stats.totalMilkMl} ml`;
  statTotalBeansEl.textContent = `${stats.totalBeansG} g`;
  statCleanCyclesEl.textContent = stats.cleanCycles;

  // Favorite drink calculation
  let fav = 'None Yet';
  let maxCount = 0;
  for (const [drink, count] of Object.entries(stats.drinkCounts || {})) {
    if (count > maxCount) {
      maxCount = count;
      fav = `${drink} (${count}x)`;
    }
  }
  statFavoriteDrinkEl.textContent = fav;

  if (stats.lastBrewed) {
    statLastBrewedEl.textContent = `${stats.lastBrewed.size} ${stats.lastBrewed.name} at ${stats.lastBrewed.timestamp}`;
  } else {
    statLastBrewedEl.textContent = 'None yet';
  }
}

// Initial Startup
updateInventoryUI(machine.inventory.getStock());
renderMenu(machine.recipes);
updateStatsUI(machine.stats);
