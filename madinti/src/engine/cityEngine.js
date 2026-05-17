import { BUILDINGS } from '../constants/buildings.js';

const GRID_SIZE = 15;
const TOTAL_CELLS = GRID_SIZE * GRID_SIZE;

const ARABIC_NAMES = [
  'محمد','أحمد','سارة','فاطمة','خالد','نورة','عبدالله','ريم','علي','مريم',
  'يوسف','هند','عمر','لطيفة','صالح','دانة','إبراهيم','شيخة','ماجد','أمل',
  'طارق','سلمى','وليد','غادة','بندر','منى','فيصل','رهف','نواف','لمياء',
];

export const EVENTS = [
  {
    id: 'fire',
    nameAr: 'حريق!',
    emoji: '🔥',
    descriptionAr: 'اشتعل حريق في أحد المباني! ارتفعت تكاليف الصيانة وانخفض رضا السكان.',
    duration: 2,
    satisfactionMod: -15,
    budgetHit: -20000,
    affectsBuildings: true,
    recoveryCost: 15000,
    canPayToResolve: true,
    incomeMultiplier: 1,
  },
  {
    id: 'economic_boom',
    nameAr: 'ازدهار اقتصادي',
    emoji: '📈',
    descriptionAr: 'المدينة تشهد ازدهاراً اقتصادياً! الدخل التجاري تضاعف لمدة شهرين.',
    duration: 2,
    satisfactionMod: 10,
    budgetHit: 0,
    incomeMultiplier: 2.0,
    affectsBuildings: false,
    canPayToResolve: false,
  },
  {
    id: 'storm',
    nameAr: 'عاصفة شديدة',
    emoji: '🌪️',
    descriptionAr: 'عاصفة قوية ضربت المدينة! تضررت بعض المباني وتوقفت الأعمال.',
    duration: 1,
    satisfactionMod: -20,
    budgetHit: -30000,
    incomeMultiplier: 0.5,
    affectsBuildings: false,
    canPayToResolve: false,
  },
  {
    id: 'power_outage',
    nameAr: 'انقطاع الكهرباء',
    emoji: '⚡',
    descriptionAr: 'انقطع التيار الكهربائي! الدخل صفر والرضا منخفض.',
    duration: 2,
    satisfactionMod: -25,
    budgetHit: -10000,
    incomeMultiplier: 0.0,
    affectsBuildings: true,
    canPayToResolve: true,
    recoveryCost: 25000,
  },
  {
    id: 'festival',
    nameAr: 'مهرجان المدينة',
    emoji: '🎉',
    descriptionAr: 'مهرجان شعبي! السكان سعداء والسياحة ترفع الدخل.',
    duration: 1,
    satisfactionMod: 20,
    budgetHit: 15000,
    incomeMultiplier: 1.5,
    affectsBuildings: false,
    canPayToResolve: false,
  },
  {
    id: 'population_wave',
    nameAr: 'موجة سكانية',
    emoji: '👨‍👩‍👧‍👦',
    descriptionAr: 'تدفق كبير من المهاجرين! سكان جدد يبحثون عن مسكن.',
    duration: 1,
    satisfactionMod: 5,
    budgetHit: 0,
    populationBoost: 0.25,
    incomeMultiplier: 1,
    affectsBuildings: false,
    canPayToResolve: false,
  },
  {
    id: 'earthquake',
    nameAr: 'زلزال خفيف',
    emoji: '🌍',
    descriptionAr: 'زلزال خفيف يهز المدينة. بعض المباني تحتاج صيانة طارئة.',
    duration: 1,
    satisfactionMod: -10,
    budgetHit: -40000,
    incomeMultiplier: 1,
    affectsBuildings: false,
    canPayToResolve: false,
  },
  {
    id: 'investment',
    nameAr: 'مستثمر أجنبي',
    emoji: '💼',
    descriptionAr: 'مستثمر أجنبي يضخ أموالاً في اقتصاد مدينتك!',
    duration: 1,
    satisfactionMod: 8,
    budgetHit: 50000,
    incomeMultiplier: 1,
    affectsBuildings: false,
    canPayToResolve: false,
  },
];

const DIFFICULTY_CONFIG = {
  easy:   { budget: 200000, targetPop: 200, targetBudget: 500000,  eventChance: 0.15, eventCooldown: 4, buildDiscount: 0.80, incomeMultiplier: 1.2 },
  medium: { budget: 150000, targetPop: 500, targetBudget: 1000000, eventChance: 0.25, eventCooldown: 3, buildDiscount: 1.00, incomeMultiplier: 1.0 },
  hard:   { budget: 100000, targetPop: 800, targetBudget: 2000000, eventChance: 0.40, eventCooldown: 2, buildDiscount: 1.00, incomeMultiplier: 0.85 },
};

let citizenIdCounter = 1;

function chebyshev(r1, c1, r2, c2) {
  return Math.max(Math.abs(r1 - r2), Math.abs(c1 - c2));
}

export function createCity({ cityName = 'مدينتي', difficulty = 'medium' }) {
  const cfg = DIFFICULTY_CONFIG[difficulty];
  const grid = Array.from({ length: TOTAL_CELLS }, (_, i) => ({
    id: i,
    row: Math.floor(i / GRID_SIZE),
    col: i % GRID_SIZE,
    building: null,
  }));
  citizenIdCounter = 1;
  return {
    month: 1,
    autoAdvance: false,
    speed: 5,
    budget: cfg.budget,
    monthlyIncome: 0,
    monthlyExpenses: 0,
    totalEarned: 0,
    cityName,
    difficulty,
    grid,
    buildings: {},
    population: 0,
    maxPopulation: 0,
    citizens: [],
    satisfactionScore: 50,
    satisfactionBreakdown: { base: 50, serviceBonus: 0, commercialBonus: 0, pollutionPenalty: 0, eventModifier: 0, overcrowdingPenalty: 0 },
    activeEvent: null,
    eventHistory: [],
    eventCooldown: 0,
    selectedCellId: null,
    buildMode: false,
    pendingBuildTypeId: null,
    phase: 'playing',
    winCondition: null,
    loseCondition: null,
    targetPopulation: cfg.targetPop,
    targetBudget: cfg.targetBudget,
    eventChance: cfg.eventChance,
    defaultEventCooldown: cfg.eventCooldown,
    buildDiscount: cfg.buildDiscount,
    difficultyIncomeMultiplier: cfg.incomeMultiplier,
    log: [],
    shownStoryIds: [],
    tutorialStep: 0,
    tutorialDone: false,
    pendingMonthReport: null,
  };
}

export function getMarketValue(building, state) {
  const def = BUILDINGS[building.typeId];
  const age = state.month - building.placedMonth;
  const popPremium = 1 + (state.population / 1000) * 0.2;
  const satMultiplier = Math.max(0.3, state.satisfactionScore / 100);
  const depreciation = Math.max(0.5, 1 - age * 0.005);
  return Math.round(def.buildCost * popPremium * satMultiplier * depreciation);
}

export function computeSatisfaction(grid, buildings, population, maxPopulation, activeEvent) {
  const residentialCells = Object.values(buildings).filter(b => BUILDINGS[b.typeId].category === 'residential');
  if (residentialCells.length === 0) return { score: 50, breakdown: { base: 50, serviceBonus: 0, commercialBonus: 0, pollutionPenalty: 0, eventModifier: 0, overcrowdingPenalty: 0 } };

  const allBuildings = Object.values(buildings);

  let totalScore = 0;
  for (const resBuilding of residentialCells) {
    const resCell = grid[resBuilding.cellId];
    let local = 50;
    let serviceBonus = 0;
    let commercialBonus = 0;
    let pollutionPenalty = 0;

    for (const b of allBuildings) {
      if (b.cellId === resBuilding.cellId) continue;
      const def = BUILDINGS[b.typeId];
      const cell = grid[b.cellId];
      const dist = chebyshev(resCell.row, resCell.col, cell.row, cell.col);

      if ((def.category === 'service') && dist <= def.effectRadius) {
        const factor = 1 - (dist / def.effectRadius) * 0.3;
        serviceBonus += def.satisfactionBonus * factor;
      }
      if (def.category === 'commercial' && dist <= def.effectRadius) {
        commercialBonus += def.satisfactionBonus * 0.5;
      }
      if (def.pollutionRadius > 0 && dist <= def.pollutionRadius) {
        const factor = 1 - (dist / def.pollutionRadius) * 0.4;
        pollutionPenalty += def.pollutionPenalty * factor;
      }
    }
    local += serviceBonus + commercialBonus - pollutionPenalty;
    totalScore += local;
  }

  let score = totalScore / residentialCells.length;

  let overcrowdingPenalty = 0;
  if (maxPopulation > 0 && population > maxPopulation * 0.95) {
    overcrowdingPenalty = 10;
    score -= overcrowdingPenalty;
  }

  let eventModifier = activeEvent ? (activeEvent.satisfactionMod || 0) : 0;
  score += eventModifier;

  score = Math.round(Math.max(0, Math.min(100, score)));
  return {
    score,
    breakdown: {
      base: 50,
      serviceBonus: Math.round(totalScore / residentialCells.length - 50),
      commercialBonus: 0,
      pollutionPenalty: 0,
      eventModifier,
      overcrowdingPenalty,
    },
  };
}

function computePopulation(state) {
  const totalCapacity = Object.values(state.buildings)
    .filter(b => BUILDINGS[b.typeId].category === 'residential')
    .reduce((sum, b) => sum + BUILDINGS[b.typeId].capacity, 0);

  const s = state.satisfactionScore;
  let occupancyRate = s >= 80 ? 0.95 : s >= 60 ? 0.70 : s >= 40 ? 0.45 : s >= 20 ? 0.20 : 0.05;

  // population_wave event
  if (state.activeEvent?.id === 'population_wave') {
    occupancyRate = Math.min(1, occupancyRate + 0.25);
  }

  const target = Math.floor(totalCapacity * occupancyRate);
  const growth = Math.round((target - state.population) * 0.15);
  const newPop = Math.max(0, Math.min(totalCapacity, state.population + growth));
  return { newPop, totalCapacity };
}

function addLog(log, month, type, text) {
  return [...log, { id: Date.now() + Math.random(), month, type, text }].slice(-50);
}

export function buildBuilding(state, cellId, typeId) {
  const cell = state.grid[cellId];
  if (cell.building) return { error: 'الخلية مشغولة' };

  const def = BUILDINGS[typeId];
  const cost = Math.round(def.buildCost * state.buildDiscount);
  if (state.budget < cost) return { error: 'الرصيد غير كافٍ' };

  const building = {
    cellId,
    typeId,
    status: 'owned',
    rentPrice: 0,
    purchasePrice: 0,
    placedMonth: state.month,
    occupants: 0,
    isOnFire: false,
    isPowered: true,
  };

  const newBuildings = { ...state.buildings, [`cell-${cellId}`]: building };
  const newGrid = state.grid.map((c, i) => i === cellId ? { ...c, building } : c);
  const newLog = addLog(state.log, state.month, 'build', `بنيت ${def.nameAr} ${def.emoji}`);

  const { score, breakdown } = computeSatisfaction(newGrid, newBuildings, state.population, state.population, state.activeEvent);

  return {
    ...state,
    budget: state.budget - cost,
    buildings: newBuildings,
    grid: newGrid,
    satisfactionScore: score,
    satisfactionBreakdown: breakdown,
    log: newLog,
    buildMode: false,
    pendingBuildTypeId: null,
    selectedCellId: cellId,
  };
}

export function demolish(state, cellId) {
  const key = `cell-${cellId}`;
  const building = state.buildings[key];
  if (!building) return state;

  const def = BUILDINGS[building.typeId];
  const refund = Math.round(def.buildCost * 0.30);

  const newBuildings = { ...state.buildings };
  delete newBuildings[key];
  const newGrid = state.grid.map((c, i) => i === cellId ? { ...c, building: null } : c);
  const newLog = addLog(state.log, state.month, 'demolish', `هدمت ${def.nameAr} ${def.emoji} (استرجعت ${refund.toLocaleString('ar-SA')} ر.س)`);

  const newCitizens = state.citizens.filter(c => c.cellId !== cellId);
  const newPop = newCitizens.length;

  const { score, breakdown } = computeSatisfaction(newGrid, newBuildings, newPop, newPop, state.activeEvent);

  return {
    ...state,
    budget: state.budget + refund,
    buildings: newBuildings,
    grid: newGrid,
    citizens: newCitizens,
    population: newPop,
    satisfactionScore: score,
    satisfactionBreakdown: breakdown,
    log: newLog,
    selectedCellId: null,
  };
}

export function rentBuilding(state, cellId, rentPricePerResident) {
  const key = `cell-${cellId}`;
  const building = state.buildings[key];
  if (!building) return { error: 'المبنى غير موجود' };

  const def = BUILDINGS[building.typeId];
  if (def.category !== 'residential') return { error: 'فقط المباني السكنية تُؤجَّر' };

  const maxRent = def.baseRentPerResident * 2;
  if (rentPricePerResident > maxRent) return { error: `الإيجار عالٍ جداً (الحد الأقصى ${maxRent} ر.س)` };

  const newBuildings = {
    ...state.buildings,
    [key]: { ...building, status: 'rented', rentPrice: rentPricePerResident },
  };
  const newLog = addLog(state.log, state.month, 'rent', `أجّرت ${def.nameAr} ${def.emoji} بـ${rentPricePerResident} ر.س/ساكن`);

  return { ...state, buildings: newBuildings, log: newLog };
}

export function stopRent(state, cellId) {
  const key = `cell-${cellId}`;
  const building = state.buildings[key];
  if (!building) return state;
  const newBuildings = { ...state.buildings, [key]: { ...building, status: 'owned', rentPrice: 0 } };
  const def = BUILDINGS[building.typeId];
  const newLog = addLog(state.log, state.month, 'rent', `أوقفت تأجير ${def.nameAr} ${def.emoji}`);
  return { ...state, buildings: newBuildings, log: newLog };
}

export function listForSale(state, cellId, askingPrice) {
  const key = `cell-${cellId}`;
  const building = state.buildings[key];
  if (!building) return { error: 'المبنى غير موجود' };

  const marketVal = getMarketValue(building, state);
  if (askingPrice > marketVal * 1.1) return { error: `السعر مرتفع جداً (الحد الأقصى ${Math.round(marketVal * 1.1).toLocaleString('ar-SA')} ر.س)` };

  const def = BUILDINGS[building.typeId];
  const newBuildings = { ...state.buildings, [key]: { ...building, status: 'for_sale', purchasePrice: askingPrice } };
  const newLog = addLog(state.log, state.month, 'sell', `عرضت ${def.nameAr} ${def.emoji} للبيع بـ${askingPrice.toLocaleString('ar-SA')} ر.س`);
  return { ...state, buildings: newBuildings, log: newLog };
}

export function cancelSale(state, cellId) {
  const key = `cell-${cellId}`;
  const building = state.buildings[key];
  if (!building) return state;
  const newBuildings = { ...state.buildings, [key]: { ...building, status: 'owned', purchasePrice: 0 } };
  return { ...state, buildings: newBuildings };
}

export function payToResolveEvent(state) {
  const ev = state.activeEvent;
  if (!ev || !ev.canPayToResolve) return { error: 'لا يمكن حل هذا الحدث' };
  if (state.budget < ev.recoveryCost) return { error: 'الرصيد غير كافٍ' };

  const newBuildings = {};
  for (const [k, b] of Object.entries(state.buildings)) {
    newBuildings[k] = { ...b, isOnFire: false, isPowered: true };
  }
  const newLog = addLog(state.log, state.month, 'event', `دفعت ${ev.recoveryCost.toLocaleString('ar-SA')} ر.س لحل "${ev.nameAr}"`);

  return {
    ...state,
    budget: state.budget - ev.recoveryCost,
    buildings: newBuildings,
    activeEvent: null,
    log: newLog,
  };
}

export function advanceMonth(state) {
  if (state.phase !== 'playing') return state;

  let s = { ...state };
  const cfg = DIFFICULTY_CONFIG[s.difficulty];
  let incomeMultiplier = s.difficultyIncomeMultiplier;
  let budgetHitThisMonth = 0;
  let newActiveEvent = s.activeEvent;

  // 1. Resolve active event
  if (newActiveEvent) {
    newActiveEvent = { ...newActiveEvent, monthsRemaining: newActiveEvent.monthsRemaining - 1 };
    if (newActiveEvent.monthsRemaining <= 0) {
      // clear building flags when event ends
      const clearedBuildings = {};
      for (const [k, b] of Object.entries(s.buildings)) {
        clearedBuildings[k] = { ...b, isOnFire: false, isPowered: true };
      }
      s = { ...s, buildings: clearedBuildings };
      newActiveEvent = null;
    } else {
      incomeMultiplier *= (newActiveEvent.incomeMultiplier ?? 1);
    }
  }

  // 2. Roll for new event
  let newEventCooldown = Math.max(0, s.eventCooldown - 1);
  if (!newActiveEvent && newEventCooldown === 0 && Math.random() < s.eventChance) {
    const eventDef = EVENTS[Math.floor(Math.random() * EVENTS.length)];
    newActiveEvent = {
      ...eventDef,
      startMonth: s.month,
      monthsRemaining: eventDef.duration,
      affectedCellId: null,
    };

    if (eventDef.affectsBuildings) {
      const keys = Object.keys(s.buildings);
      if (keys.length > 0) {
        const randomKey = keys[Math.floor(Math.random() * keys.length)];
        const affected = s.buildings[randomKey];
        if (eventDef.id === 'fire') {
          s = { ...s, buildings: { ...s.buildings, [randomKey]: { ...affected, isOnFire: true } } };
        } else if (eventDef.id === 'power_outage') {
          const powered = {};
          for (const [k, b] of Object.entries(s.buildings)) {
            powered[k] = { ...b, isPowered: false };
          }
          s = { ...s, buildings: powered };
        }
        newActiveEvent.affectedCellId = affected.cellId;
      }
    }

    budgetHitThisMonth += eventDef.budgetHit || 0;
    newEventCooldown = cfg.eventCooldown;
    incomeMultiplier *= (newActiveEvent.incomeMultiplier ?? 1);
  }

  // 3. Process sales
  let saleIncome = 0;
  const buildingsAfterSales = { ...s.buildings };
  const gridAfterSales = [...s.grid];
  const soldCellIds = [];
  for (const [k, b] of Object.entries(buildingsAfterSales)) {
    if (b.status === 'for_sale') {
      const mv = getMarketValue(b, s);
      if (b.purchasePrice <= mv) {
        saleIncome += b.purchasePrice;
        soldCellIds.push(b.cellId);
        delete buildingsAfterSales[k];
        gridAfterSales[b.cellId] = { ...gridAfterSales[b.cellId], building: null };
      }
    }
  }
  s = { ...s, buildings: buildingsAfterSales, grid: gridAfterSales };

  // 4. Calculate income
  let commercialIncome = 0;
  let rentIncome = 0;
  let totalMaintenance = 0;

  for (const b of Object.values(s.buildings)) {
    const def = BUILDINGS[b.typeId];
    totalMaintenance += def.maintenancePerMonth * (b.isOnFire ? 2 : 1);

    if (def.incomeType === 'monthly' && b.isPowered !== false) {
      let base = def.monthlyIncome;
      if (def.incomeScaleWithPop) {
        base *= (1 + (def.popIncomeScale || 0) * s.population);
      }
      commercialIncome += base * incomeMultiplier;
    }
    if (def.incomeType === 'rent' && b.status === 'rented') {
      rentIncome += b.occupants * b.rentPrice;
    }
  }

  const totalIncome = Math.round(commercialIncome + rentIncome + saleIncome);
  const totalExpenses = Math.round(totalMaintenance);
  const net = totalIncome - totalExpenses + budgetHitThisMonth;
  const newBudget = s.budget + net;

  // 5. Recompute satisfaction
  const maxCapacity = Object.values(s.buildings)
    .filter(b => BUILDINGS[b.typeId].category === 'residential')
    .reduce((sum, b) => sum + BUILDINGS[b.typeId].capacity, 0);

  const { score: newSat, breakdown } = computeSatisfaction(
    s.grid, s.buildings, s.population, maxCapacity, newActiveEvent
  );

  // 6. Recompute population
  const tempState = { ...s, satisfactionScore: newSat, budget: newBudget, activeEvent: newActiveEvent };
  const { newPop, totalCapacity } = computePopulation(tempState);
  const popDelta = newPop - s.population;

  let newCitizens = [...s.citizens];
  if (popDelta > 0) {
    for (let i = 0; i < popDelta; i++) {
      const name = ARABIC_NAMES[Math.floor(Math.random() * ARABIC_NAMES.length)];
      // assign to a residential building with space
      let targetCellId = null;
      for (const b of Object.values(s.buildings)) {
        if (BUILDINGS[b.typeId].category === 'residential') {
          const current = newCitizens.filter(c => c.cellId === b.cellId).length;
          if (current < BUILDINGS[b.typeId].capacity) {
            targetCellId = b.cellId;
            break;
          }
        }
      }
      newCitizens.push({ id: `c-${citizenIdCounter++}`, name, cellId: targetCellId, arrivedMonth: s.month + 1 });
    }
  } else if (popDelta < 0) {
    newCitizens = newCitizens.slice(0, newPop);
  }

  // Update occupants in buildings
  const finalBuildings = { ...s.buildings };
  for (const b of Object.values(finalBuildings)) {
    if (BUILDINGS[b.typeId].category === 'residential') {
      finalBuildings[`cell-${b.cellId}`] = {
        ...b,
        occupants: newCitizens.filter(c => c.cellId === b.cellId).length,
      };
    }
  }

  // 7. Check win/lose
  let phase = 'playing';
  let winCondition = null;
  let loseCondition = null;
  const newMonth = s.month + 1;

  if (newPop >= s.targetPopulation) {
    phase = 'won';
    winCondition = 'population';
  } else if (newBudget >= s.targetBudget && s.month >= 24) {
    phase = 'won';
    winCondition = 'financial';
  } else if (newBudget < 0) {
    phase = 'lost';
    loseCondition = 'bankrupt';
  } else if (newPop === 0 && s.month > 18 && Object.values(s.buildings).some(b => BUILDINGS[b.typeId].category === 'residential')) {
    phase = 'lost';
    loseCondition = 'abandoned';
  }

  // 8. Log
  let newLog = addLog(s.log, s.month, 'month',
    `الشهر ${s.month}: دخل ${totalIncome.toLocaleString('ar-SA')} - مصاريف ${totalExpenses.toLocaleString('ar-SA')} = ${net >= 0 ? '+' : ''}${net.toLocaleString('ar-SA')} ر.س`
  );
  if (saleIncome > 0) newLog = addLog(newLog, s.month, 'sell', `بيع مبنى: +${saleIncome.toLocaleString('ar-SA')} ر.س`);
  if (newActiveEvent && !s.activeEvent) newLog = addLog(newLog, s.month, 'event', `حدث: ${newActiveEvent.nameAr} ${newActiveEvent.emoji}`);

  const pendingMonthReport = {
    month: s.month,
    commercialIncome: Math.round(commercialIncome),
    rentIncome: Math.round(rentIncome),
    saleIncome: Math.round(saleIncome),
    eventBudget: budgetHitThisMonth,
    totalIncome,
    totalExpenses,
    net,
    budgetAfter: newBudget,
    populationBefore: s.population,
    populationAfter: newPop,
    satisfactionBefore: s.satisfactionScore,
    satisfactionAfter: newSat,
    newEvent: (!s.activeEvent && newActiveEvent) ? newActiveEvent : null,
  };

  return {
    ...s,
    month: newMonth,
    budget: newBudget,
    monthlyIncome: totalIncome,
    monthlyExpenses: totalExpenses,
    totalEarned: s.totalEarned + Math.max(0, net),
    buildings: finalBuildings,
    citizens: newCitizens,
    population: newPop,
    maxPopulation: totalCapacity,
    satisfactionScore: newSat,
    satisfactionBreakdown: breakdown,
    activeEvent: newActiveEvent,
    eventCooldown: newEventCooldown,
    log: newLog,
    phase,
    winCondition,
    loseCondition,
    pendingMonthReport,
  };
}
