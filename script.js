// Crystal Clicker Game Logic

class CrystalClicker {
    constructor() {
        this.energy = 0;
        this.clickPower = 1;
        this.energyPerSecond = 0;
        this.totalMultiplier = 1;
        
        this.upgrades = {
            powerBoost: {
                cost: 10,
                baseCost: 10,
                owned: 0,
                effect: 1,
                costMultiplier: 1.5
            },
            autoMiner: {
                cost: 50,
                baseCost: 50,
                owned: 0,
                effect: 1,
                costMultiplier: 1.8
            },
            crystalMultiplier: {
                cost: 200,
                baseCost: 200,
                owned: 0,
                effect: 2,
                costMultiplier: 3
            },
            luckyCharm: {
                cost: 500,
                baseCost: 500,
                owned: 0,
                effect: 0.1,
                costMultiplier: 5
            }
        };

        this.init();
        this.loadGame();
        this.startGameLoop();
    }

    init() {
        // Get DOM elements
        this.elements = {
            energy: document.getElementById('energy'),
            perClick: document.getElementById('perClick'),
            perSecond: document.getElementById('perSecond'),
            crystal: document.getElementById('crystal'),
            clickEffect: document.getElementById('clickEffect'),
            saveBtn: document.getElementById('saveGame'),
            resetBtn: document.getElementById('resetGame')
        };

        // Add event listeners
        this.elements.crystal.addEventListener('click', (e) => this.handleClick(e));
        this.elements.saveBtn.addEventListener('click', () => this.saveGame());
        this.elements.resetBtn.addEventListener('click', () => this.resetGame());

        // Add upgrade button listeners
        Object.keys(this.upgrades).forEach(upgradeType => {
            const upgradeCard = document.getElementById(upgradeType);
            const buyBtn = upgradeCard.querySelector('.buy-btn');
            buyBtn.addEventListener('click', () => this.buyUpgrade(upgradeType));
        });

        this.updateDisplay();
    }

    handleClick(event) {
        let energyGained = this.clickPower * this.totalMultiplier;
        let luckLevel = 0;
        
        // Lucky charm effect with stacking multipliers
        if (this.upgrades.luckyCharm.owned > 0) {
            const totalLuckChance = this.upgrades.luckyCharm.owned * this.upgrades.luckyCharm.effect;
            
            // Calculate how many guaranteed 5x multipliers we have (every 100% = 1 guaranteed level)
            const guaranteedLevels = Math.floor(totalLuckChance);
            
            // Calculate remaining chance for the next level
            const remainingChance = totalLuckChance - guaranteedLevels;
            
            // Apply guaranteed levels
            luckLevel = guaranteedLevels;
            
            // Check if we get the next level based on remaining chance
            if (remainingChance > 0 && Math.random() < remainingChance) {
                luckLevel++;
            }
            
            // Apply the luck multiplier (5^luckLevel)
            if (luckLevel > 0) {
                energyGained *= Math.pow(5, luckLevel);
            }
        }

        this.showClickEffect(event, energyGained, luckLevel);
        this.energy += energyGained;
        this.updateDisplay();
        this.saveGame();
    }

    showClickEffect(event, energyGained, luckLevel) {
        const effect = this.elements.clickEffect;
        const rect = this.elements.crystal.getBoundingClientRect();
        
        effect.style.left = (event.clientX - rect.left) + 'px';
        effect.style.top = (event.clientY - rect.top) + 'px';
        
        // Different effects based on luck level
        if (luckLevel === 0) {
            effect.textContent = `+${Math.floor(energyGained)}`;
            effect.style.color = '#4ecdc4';
        } else if (luckLevel === 1) {
            effect.textContent = `+${Math.floor(energyGained)} ✨`;
            effect.style.color = '#ffd700';
        } else if (luckLevel === 2) {
            effect.textContent = `+${Math.floor(energyGained)} ⭐`;
            effect.style.color = '#ff6b6b';
        } else if (luckLevel === 3) {
            effect.textContent = `+${Math.floor(energyGained)} 🔥`;
            effect.style.color = '#ff4757';
        } else if (luckLevel === 4) {
            effect.textContent = `+${Math.floor(energyGained)} 💎`;
            effect.style.color = '#9c88ff';
        } else if (luckLevel >= 5) {
            effect.textContent = `+${Math.floor(energyGained)} 🌟`;
            effect.style.color = '#ff3838';
            effect.style.textShadow = '0 0 10px #ff3838';
        }
        
        // Reset animation
        effect.style.animation = 'none';
        effect.offsetHeight; // Trigger reflow
        effect.style.animation = 'floatUp 1s ease-out forwards';
    }

    buyUpgrade(upgradeType) {
        const upgrade = this.upgrades[upgradeType];
        
        // Check if luckyCharm is at max level (600% = 60 upgrades = level 6 guaranteed multiplier)
        if (upgradeType === 'luckyCharm' && upgrade.owned >= 60) {
            return; // Cannot buy more lucky charms beyond max useful level
        }
        
        if (this.energy >= upgrade.cost) {
            this.energy -= upgrade.cost;
            upgrade.owned++;
            
            // Update upgrade cost
            upgrade.cost = Math.ceil(upgrade.baseCost * Math.pow(upgrade.costMultiplier, upgrade.owned));
            
            // Apply upgrade effects
            this.calculateStats();
            
            // Visual feedback
            const upgradeCard = document.getElementById(upgradeType);
            upgradeCard.classList.add('purchased');
            setTimeout(() => upgradeCard.classList.remove('purchased'), 600);
            
            this.updateDisplay();
            this.saveGame();
        }
    }

    calculateStats() {
        // Calculate click power
        this.clickPower = 1 + this.upgrades.powerBoost.owned * this.upgrades.powerBoost.effect;
        
        // Calculate energy per second
        this.energyPerSecond = this.upgrades.autoMiner.owned * this.upgrades.autoMiner.effect;
        
        // Calculate total multiplier
        this.totalMultiplier = Math.pow(this.upgrades.crystalMultiplier.effect, this.upgrades.crystalMultiplier.owned);
    }

    updateDisplay() {
        // Update stats
        this.elements.energy.textContent = Math.floor(this.energy).toLocaleString();
        this.elements.perClick.textContent = Math.floor(this.clickPower * this.totalMultiplier).toLocaleString();
        this.elements.perSecond.textContent = Math.floor(this.energyPerSecond * this.totalMultiplier).toLocaleString();

        // Update upgrade cards
        Object.keys(this.upgrades).forEach(upgradeType => {
            const upgrade = this.upgrades[upgradeType];
            const upgradeCard = document.getElementById(upgradeType);
            
            const buyBtn = upgradeCard.querySelector('.buy-btn');
            
            // Check if luckyCharm is at max level
            if (upgradeType === 'luckyCharm' && upgrade.owned >= 60) {
                upgradeCard.querySelector('.cost').textContent = 'MAX LEVEL';
                upgradeCard.querySelector('.owned').textContent = upgrade.owned.toLocaleString();
                buyBtn.disabled = true;
                buyBtn.textContent = 'MAXED';
            } else {
                upgradeCard.querySelector('.cost').textContent = upgrade.cost.toLocaleString();
                upgradeCard.querySelector('.owned').textContent = upgrade.owned.toLocaleString();
                buyBtn.disabled = this.energy < upgrade.cost;
                buyBtn.textContent = 'Buy';
            }
        });
    }

    startGameLoop() {
        setInterval(() => {
            if (this.energyPerSecond > 0) {
                this.energy += (this.energyPerSecond * this.totalMultiplier) / 10; // Update 10 times per second
                this.updateDisplay();
            }
        }, 100);

        // Auto-save every 30 seconds
        setInterval(() => {
            this.saveGame();
        }, 30000);
    }

    saveGame() {
        const saveData = {
            energy: this.energy,
            upgrades: this.upgrades,
            timestamp: Date.now()
        };
        
        localStorage.setItem('crystalClickerSave', JSON.stringify(saveData));
        
        // Show save confirmation
        const saveBtn = this.elements.saveBtn;
        const originalText = saveBtn.textContent;
        saveBtn.textContent = '💾 Saved!';
        saveBtn.style.background = 'rgba(76, 175, 80, 0.3)';
        
        setTimeout(() => {
            saveBtn.textContent = originalText;
            saveBtn.style.background = '';
        }, 1000);
    }

    loadGame() {
        const saveData = localStorage.getItem('crystalClickerSave');
        
        if (saveData) {
            try {
                const data = JSON.parse(saveData);
                
                this.energy = data.energy || 0;
                
                if (data.upgrades) {
                    Object.keys(data.upgrades).forEach(upgradeType => {
                        if (this.upgrades[upgradeType]) {
                            this.upgrades[upgradeType] = { ...this.upgrades[upgradeType], ...data.upgrades[upgradeType] };
                        }
                    });
                }
                
                // Calculate offline progress
                if (data.timestamp) {
                    const timeDiff = (Date.now() - data.timestamp) / 1000; // seconds
                    const offlineEarnings = Math.floor(timeDiff * this.energyPerSecond * this.totalMultiplier);
                    
                    if (offlineEarnings > 0) {
                        this.energy += offlineEarnings;
                        this.showOfflineEarnings(offlineEarnings, Math.floor(timeDiff));
                    }
                }
                
                this.calculateStats();
                
            } catch (error) {
                console.error('Error loading save data:', error);
            }
        }
    }

    showOfflineEarnings(earnings, timeAway) {
        if (earnings > 0) {
            const hours = Math.floor(timeAway / 3600);
            const minutes = Math.floor((timeAway % 3600) / 60);
            
            let timeString = '';
            if (hours > 0) timeString += `${hours}h `;
            if (minutes > 0) timeString += `${minutes}m`;
            if (timeString === '') timeString = '< 1m';
            
            setTimeout(() => {
                alert(`Welcome back! You were away for ${timeString} and earned ${earnings.toLocaleString()} energy!`);
            }, 500);
        }
    }

    resetGame() {
        if (confirm('Are you sure you want to reset your progress? This cannot be undone!')) {
            localStorage.removeItem('crystalClickerSave');
            location.reload();
        }
    }
}

// Start the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new CrystalClicker();
});

// Prevent context menu on crystal button for better mobile experience
document.getElementById('crystal').addEventListener('contextmenu', (e) => {
    e.preventDefault();
});

// Add keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        e.preventDefault();
        document.getElementById('crystal').click();
    }
});
