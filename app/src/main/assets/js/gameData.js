/**
 * Ultimate Bike Racing 3D - Game Data & Progression System
 */

const ENVIRONMENTS = {
  CITY: {
    id: 'city',
    name: 'Modern City',
    skyColor: 0x64b5f6,
    fogColor: 0xcfe2f3,
    groundColor: 0x374151,
    roadColor: 0x1f2937,
    ambientLight: 0xffffff,
    dirLight: 0xfffaed,
    type: 'city'
  },
  DESERT: {
    id: 'desert',
    name: 'Desert Highway',
    skyColor: 0xf59e0b,
    fogColor: 0xfde68a,
    groundColor: 0xb45309,
    roadColor: 0x292524,
    ambientLight: 0xffedd5,
    dirLight: 0xffedd5,
    type: 'desert'
  },
  MOUNTAIN: {
    id: 'mountain',
    name: 'Mountain Road',
    skyColor: 0x38bdf8,
    fogColor: 0xbae6fd,
    groundColor: 0x475569,
    roadColor: 0x18181b,
    ambientLight: 0xf0f9ff,
    dirLight: 0xffffff,
    type: 'mountain'
  },
  FOREST: {
    id: 'forest',
    name: 'Green Forest Road',
    skyColor: 0x86efac,
    fogColor: 0xbbf7d0,
    groundColor: 0x166534,
    roadColor: 0x27272a,
    ambientLight: 0xdcfce7,
    dirLight: 0xfef08a,
    type: 'forest'
  },
  NIGHT_CITY: {
    id: 'night_city',
    name: 'Night City',
    skyColor: 0x050814,
    fogColor: 0x0d1527,
    groundColor: 0x0b0f19,
    roadColor: 0x111827,
    ambientLight: 0x4f46e5,
    dirLight: 0x38bdf8,
    type: 'night_city'
  },
  SNOW: {
    id: 'snow',
    name: 'Snow Road',
    skyColor: 0x93c5fd,
    fogColor: 0xe0f2fe,
    groundColor: 0xe2e8f0,
    roadColor: 0x334155,
    ambientLight: 0xf1f5f9,
    dirLight: 0xffffff,
    type: 'snow'
  }
};

const BIKES = [
  {
    id: 'sports_bike',
    name: 'Street Hornet 250',
    category: 'Sports Bike',
    desc: 'Lightweight and agile starter bike with balanced dynamics.',
    price: 0,
    unlocked: true,
    colors: ['#f97316', '#0284c7', '#22c55e', '#ef4444', '#a855f7'],
    baseStats: {
      engine: 1,      // Stage 1-10
      maxSpeed: 160,  // Base km/h
      accel: 28,      // Acceleration rate
      braking: 40,    // Braking power
      handling: 7.5,  // Turning responsiveness
      nitroPower: 35  // Boost speed addition
    }
  },
  {
    id: 'superbike',
    name: 'Apex Ninja 600',
    category: 'Superbike',
    desc: 'Middleweight supersport beast with rapid throttle response.',
    price: 3500,
    unlocked: false,
    colors: ['#22c55e', '#06b6d4', '#eab308', '#ec4899', '#f97316'],
    baseStats: {
      engine: 3,
      maxSpeed: 200,
      accel: 36,
      braking: 48,
      handling: 8.5,
      nitroPower: 45
    }
  },
  {
    id: 'racing_bike',
    name: 'Veloce GP 1000',
    category: 'Racing Bike',
    desc: 'Pure track racing prototype built for extreme speeds and curves.',
    price: 8000,
    unlocked: false,
    colors: ['#ef4444', '#ffffff', '#3b82f6', '#f59e0b', '#10b981'],
    baseStats: {
      engine: 5,
      maxSpeed: 240,
      accel: 44,
      braking: 55,
      handling: 9.2,
      nitroPower: 55
    }
  },
  {
    id: 'heavy_bike',
    name: 'Titan V-Twin 1200',
    category: 'Heavy Bike',
    desc: 'High-torque muscular cruiser with unstoppable straight-line stability.',
    price: 15000,
    unlocked: false,
    colors: ['#1e293b', '#dc2626', '#d97706', '#475569', '#7c3aed'],
    baseStats: {
      engine: 7,
      maxSpeed: 270,
      accel: 48,
      braking: 58,
      handling: 8.0,
      nitroPower: 65
    }
  },
  {
    id: 'premium_superbike',
    name: 'Phantom Hypersport RR',
    category: 'Premium Superbike',
    desc: 'The pinnacle of racing engineering with active aerodynamics and hyperspeed.',
    price: 30000,
    unlocked: false,
    colors: ['#00f0ff', '#ff0055', '#ffe600', '#7928ca', '#ffffff'],
    baseStats: {
      engine: 9,
      maxSpeed: 320,
      accel: 58,
      braking: 68,
      handling: 10.0,
      nitroPower: 80
    }
  }
];

// Generate 50 progressive levels
function generate50Levels() {
  const levels = [];
  const envKeys = Object.keys(ENVIRONMENTS);
  const titles = [
    'Beginner Rider', 'City Racer', 'Highway Rider', 'Speed Challenge', 'Pro Racer',
    'Traffic Blitz', 'Desert Drift', 'Mountain Peak', 'Neon Sprint', 'Expert Rider',
    'Highway Rush', 'Asphalt King', 'Forest Glide', 'Tempting Curves', 'Midnight Hustle',
    'Icy Drift', 'Tunnel Vision', 'Apex Predator', 'Sunset Cruise', 'Super Racer',
    'Speed Demon', 'Heavy Traffic', 'Alpine Chase', 'City Skylines', 'Hyper Velocity',
    'Thunder Run', 'Desert Tornado', 'Blizzard Sprint', 'Night Crawler', 'Racing Champion',
    'Ghost Rider', 'Track Master', 'Redline Fury', 'Precision Rider', 'Nitro Addict',
    'Grand Prix Run', 'Canyon Carver', 'Metropolis Dash', 'Frozen Apex', 'Master Rider',
    'Infinite Horizon', 'Overdrive', 'Velocity Vector', 'Storm Chaser', 'Titan Clash',
    'Apex Legend', 'Speed Syndicate', 'Hyperspace', 'Championship Apex', 'Ultimate Legend'
  ];

  for (let i = 1; i <= 50; i++) {
    const envKey = envKeys[(i - 1) % envKeys.length];
    const env = ENVIRONMENTS[envKey];
    const distanceMeters = 800 + (i - 1) * 75; // 800m to 4475m
    const trafficDensity = 0.4 + Math.min(1.8, (i - 1) * 0.04); // Density multiplier
    const trafficMinSpeed = 40 + Math.min(60, i * 1.2);
    const trafficMaxSpeed = 70 + Math.min(90, i * 1.5);
    const rewardCoins = 250 + i * 75; // 325 to 4000 coins
    const rewardXp = 100 + i * 25;
    const targetTimeSec = Math.round(distanceMeters / 35); // Approx target seconds for 3 stars

    levels.push({
      levelNumber: i,
      title: `Level ${i} – ${titles[i - 1]}`,
      shortTitle: titles[i - 1],
      environment: env,
      distance: distanceMeters,
      trafficDensity: trafficDensity,
      trafficSpeed: [trafficMinSpeed, trafficMaxSpeed],
      coinsReward: rewardCoins,
      xpReward: rewardXp,
      targetTime: targetTimeSec,
      mission: getLevelMission(i)
    });
  }
  return levels;
}

function getLevelMission(lvl) {
  const type = lvl % 5;
  if (type === 1) return { desc: `Overtake ${3 + Math.floor(lvl * 0.6)} traffic cars closely`, type: 'overtake', count: 3 + Math.floor(lvl * 0.6) };
  if (type === 2) return { desc: `Collect ${10 + Math.floor(lvl * 1.2)} coins on track`, type: 'coins', count: 10 + Math.floor(lvl * 1.2) };
  if (type === 3) return { desc: `Reach speed of ${130 + Math.min(130, lvl * 3)} KM/H`, type: 'speed', targetSpeed: 130 + Math.min(130, lvl * 3) };
  if (type === 4) return { desc: `Use Nitro Boost for at least 4 seconds`, type: 'nitro', duration: 4 };
  return { desc: `Finish race without crashing`, type: 'no_crash', count: 1 };
}

const GAME_LEVELS = generate50Levels();

// Daily Rewards list
const DAILY_REWARDS = [
  { day: 1, coins: 500, label: '500 Coins' },
  { day: 2, coins: 1000, label: '1,000 Coins' },
  { day: 3, coins: 2000, label: '2,000 Coins' },
  { day: 4, coins: 3500, label: '3,500 Coins' },
  { day: 5, coins: 5000, label: '5,000 Coins' },
  { day: 6, coins: 8000, label: '8,000 Coins' },
  { day: 7, coins: 15000, label: '15,000 Coins + Gold Paint!' }
];

// Upgrade cost calculation
const UPGRADE_COSTS = [
  0,     // Level 1 (Default)
  300,   // Level 2
  600,   // Level 3
  1000,  // Level 4
  1500,  // Level 5
  2200,  // Level 6
  3100,  // Level 7
  4200,  // Level 8
  5500,  // Level 9
  7200   // Level 10 (MAX)
];

// Storage and Game State Manager
class GameStorage {
  constructor() {
    this.STORAGE_KEY = 'ultimate_bike_racing_3d_save_v1';
    this.data = this.load();
  }

  getDefaultData() {
    return {
      coins: 1000, // Starting bonus coins so player can experience upgrading right away!
      xp: 0,
      playerLevel: 1,
      selectedBikeId: 'sports_bike',
      unlockedBikes: ['sports_bike'],
      bikeColors: {
        sports_bike: '#f97316',
        superbike: '#22c55e',
        racing_bike: '#ef4444',
        heavy_bike: '#1e293b',
        premium_superbike: '#00f0ff'
      },
      upgrades: {
        sports_bike: { engine: 1, maxSpeed: 1, accel: 1, braking: 1, handling: 1, nitroPower: 1 },
        superbike: { engine: 1, maxSpeed: 1, accel: 1, braking: 1, handling: 1, nitroPower: 1 },
        racing_bike: { engine: 1, maxSpeed: 1, accel: 1, braking: 1, handling: 1, nitroPower: 1 },
        heavy_bike: { engine: 1, maxSpeed: 1, accel: 1, braking: 1, handling: 1, nitroPower: 1 },
        premium_superbike: { engine: 1, maxSpeed: 1, accel: 1, braking: 1, handling: 1, nitroPower: 1 }
      },
      unlockedLevel: 1,
      levelStars: {}, // { levelNum: stars (1-3) }
      levelBestTimes: {},
      dailyStreak: 0,
      lastDailyClaim: 0,
      settings: {
        sound: true,
        music: true,
        graphics: 'high', // 'low', 'medium', 'high'
        controls: 'buttons', // 'buttons' or 'tilt'
        haptics: true
      }
    };
  }

  load() {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        // Merge with defaults to ensure schema updates
        return Object.assign(this.getDefaultData(), parsed);
      }
    } catch (e) {
      console.warn("Could not load from localStorage:", e);
    }
    return this.getDefaultData();
  }

  save() {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.data));
    } catch (e) {
      console.warn("Could not save to localStorage:", e);
    }
  }

  addCoins(amount) {
    this.data.coins = Math.max(0, this.data.coins + amount);
    this.save();
    return this.data.coins;
  }

  addXp(amount) {
    this.data.xp += amount;
    // Calculate player level (1000 XP per level)
    const newLvl = 1 + Math.floor(this.data.xp / 1000);
    this.data.playerLevel = newLvl;
    this.save();
  }

  unlockLevel(levelNum) {
    if (levelNum > this.data.unlockedLevel && levelNum <= 50) {
      this.data.unlockedLevel = levelNum;
      this.save();
    }
  }

  setLevelResult(levelNum, stars, timeSec) {
    const prevStars = this.data.levelStars[levelNum] || 0;
    if (stars > prevStars) {
      this.data.levelStars[levelNum] = stars;
    }
    const prevTime = this.data.levelBestTimes[levelNum] || 999999;
    if (timeSec < prevTime) {
      this.data.levelBestTimes[levelNum] = timeSec;
    }
    this.unlockLevel(levelNum + 1);
    this.save();
  }

  getEffectiveBikeStats(bikeId) {
    const bike = BIKES.find(b => b.id === bikeId) || BIKES[0];
    const up = (this.data.upgrades[bikeId]) || { engine: 1, maxSpeed: 1, accel: 1, braking: 1, handling: 1, nitroPower: 1 };

    // Calculate effective gameplay stats based on stage 1-10
    const engineMult = 1 + (up.engine - 1) * 0.08;
    const maxSpeedEffective = (bike.baseStats.maxSpeed + (up.maxSpeed - 1) * 8) * engineMult;
    const accelEffective = (bike.baseStats.accel + (up.accel - 1) * 3) * engineMult;
    const brakingEffective = bike.baseStats.braking + (up.braking - 1) * 4;
    const handlingEffective = bike.baseStats.handling + (up.handling - 1) * 0.4;
    const nitroEffective = bike.baseStats.nitroPower + (up.nitroPower - 1) * 4;

    return {
      maxSpeed: Math.round(maxSpeedEffective),
      accel: accelEffective,
      braking: brakingEffective,
      handling: handlingEffective,
      nitroPower: nitroEffective,
      upgrades: up
    };
  }
}

window.gameStorage = new GameStorage();
