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
        
        // Lucky charm effect
        if (this.upgrades.luckyCharm.owned > 0) {
            const luckChance = this.upgrades.luckyCharm.owned * this.upgrades.luckyCharm.effect;
            if (Math.random() < luckChance) {
                energyGained *= 5; // Lucky click gives 5x energy
                this.showClickEffect(event, energyGained, true);
            } else {
                this.showClickEffect(event, energyGained, false);
            }
        } else {
            this.showClickEffect(event, energyGained, false);
        }

        this.energy += energyGained;
        this.updateDisplay();
        this.saveGame();
    }

    showClickEffect(event, energyGained, isLucky) {
        const effect = this.elements.clickEffect;
        const rect = this.elements.crystal.getBoundingClientRect();
        
        effect.style.left = (event.clientX - rect.left) + 'px';
        effect.style.top = (event.clientY - rect.top) + 'px';
        effect.textContent = isLucky ? `+${Math.floor(energyGained)} ✨` : `+${Math.floor(energyGained)}`;
        effect.style.color = isLucky ? '#ffd700' : '#4ecdc4';
        
        // Reset animation
        effect.style.animation = 'none';
        effect.offsetHeight; // Trigger reflow
        effect.style.animation = 'floatUp 1s ease-out forwards';
    }

    buyUpgrade(upgradeType) {
        const upgrade = this.upgrades[upgradeType];
        
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
            
            upgradeCard.querySelector('.cost').textContent = upgrade.cost.toLocaleString();
            upgradeCard.querySelector('.owned').textContent = upgrade.owned.toLocaleString();
            
            const buyBtn = upgradeCard.querySelector('.buy-btn');
            buyBtn.disabled = this.energy < upgrade.cost;
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
