class Game2048 {
    constructor() {
        this.size = 4;
        this.grid = [];
        this.score = 0;
        this.best = localStorage.getItem('best2048') || 0;
        this.tiles = new Map();
        this.tileId = 0;
        this.moved = false;
        this.won = false;
        this.over = false;
        
        this.init();
        this.bindEvents();
    }

    gridsEqual(a, b) {
        for (let r = 0; r < this.size; r++) {
            for (let c = 0; c < this.size; c++) {
                if (a[r][c] !== b[r][c]) return false;
            }
        }
        return true;
    }

    getLayoutMetrics() {
        const gameContainer = document.querySelector('.game-container');
        const style = getComputedStyle(gameContainer);
        const cell = parseFloat(style.getPropertyValue('--cell'));
        const gap = parseFloat(style.getPropertyValue('--gap'));

        return {
            cell: Number.isFinite(cell) ? cell : 106,
            gap: Number.isFinite(gap) ? gap : 15,
        };
    }
    
    init() {
        this.grid = Array(this.size).fill().map(() => Array(this.size).fill(0));
        this.score = 0;
        this.won = false;
        this.over = false;
        this.tiles.clear();
        this.tileId = 0;
        
        this.updateScore();
        this.updateBest();
        this.hideMessage();
        this.clearTiles();
        
        this.addRandomTile();
        this.addRandomTile();
        this.updateDisplay();
    }
    
    bindEvents() {
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));
        document.getElementById('restart-button').addEventListener('click', () => this.init());
        document.getElementById('retry-button').addEventListener('click', () => this.init());
        
        let startX, startY;
        
        document.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
        });
        
        document.addEventListener('touchend', (e) => {
            if (!startX || !startY) return;
            
            let endX = e.changedTouches[0].clientX;
            let endY = e.changedTouches[0].clientY;
            
            let diffX = startX - endX;
            let diffY = startY - endY;
            
            if (Math.abs(diffX) > Math.abs(diffY)) {
                if (diffX > 0) {
                    this.move('left');
                } else {
                    this.move('right');
                }
            } else {
                if (diffY > 0) {
                    this.move('up');
                } else {
                    this.move('down');
                }
            }
            
            startX = null;
            startY = null;
        });
    }
    
    handleKeyPress(e) {
        if (this.over || this.won) return;
        
        switch(e.key) {
            case 'ArrowUp':
                e.preventDefault();
                this.move('up');
                break;
            case 'ArrowDown':
                e.preventDefault();
                this.move('down');
                break;
            case 'ArrowLeft':
                e.preventDefault();
                this.move('left');
                break;
            case 'ArrowRight':
                e.preventDefault();
                this.move('right');
                break;
        }
    }
    
    move(direction) {
        if (this.over || this.won) return;
        
        const previousGrid = this.grid.map(row => [...row]);
        
        switch(direction) {
            case 'left':
                this.moveLeft();
                break;
            case 'right':
                this.moveRight();
                break;
            case 'up':
                this.moveUp();
                break;
            case 'down':
                this.moveDown();
                break;
        }

        this.moved = !this.gridsEqual(previousGrid, this.grid);
        
        if (this.moved) {
            this.addRandomTile();
            this.updateDisplay();
            this.updateScore();
            
            if (this.checkWin()) {
                this.won = true;
                this.showMessage('You win!', 'game-won');
            } else if (this.checkGameOver()) {
                this.over = true;
                this.showMessage('Game over!', 'game-over');
            }
        }
    }
    
    moveLeft() {
        for (let row = 0; row < this.size; row++) {
            this.grid[row] = this.slideAndMerge(this.grid[row]);
        }
    }
    
    moveRight() {
        for (let row = 0; row < this.size; row++) {
            this.grid[row] = this.slideAndMerge(this.grid[row].reverse()).reverse();
        }
    }
    
    moveUp() {
        for (let col = 0; col < this.size; col++) {
            const column = this.grid.map(row => row[col]);
            const newColumn = this.slideAndMerge(column);
            for (let row = 0; row < this.size; row++) {
                this.grid[row][col] = newColumn[row];
            }
        }
    }
    
    moveDown() {
        for (let col = 0; col < this.size; col++) {
            const column = this.grid.map(row => row[col]).reverse();
            const newColumn = this.slideAndMerge(column).reverse();
            for (let row = 0; row < this.size; row++) {
                this.grid[row][col] = newColumn[row];
            }
        }
    }
    
    slideAndMerge(row) {
        let newRow = row.filter(cell => cell !== 0);
        
        for (let i = 0; i < newRow.length - 1; i++) {
            if (newRow[i] === newRow[i + 1]) {
                newRow[i] *= 2;
                this.score += newRow[i];
                newRow.splice(i + 1, 1);
            }
        }
        
        while (newRow.length < this.size) {
            newRow.push(0);
        }
        
        return newRow;
    }
    
    addRandomTile() {
        const emptyCells = [];
        for (let row = 0; row < this.size; row++) {
            for (let col = 0; col < this.size; col++) {
                if (this.grid[row][col] === 0) {
                    emptyCells.push({row, col});
                }
            }
        }
        
        if (emptyCells.length > 0) {
            const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
            this.grid[randomCell.row][randomCell.col] = Math.random() < 0.9 ? 2 : 4;
        }
    }
    
    checkWin() {
        for (let row = 0; row < this.size; row++) {
            for (let col = 0; col < this.size; col++) {
                if (this.grid[row][col] === 2048) {
                    return true;
                }
            }
        }
        return false;
    }
    
    checkGameOver() {
        for (let row = 0; row < this.size; row++) {
            for (let col = 0; col < this.size; col++) {
                if (this.grid[row][col] === 0) {
                    return false;
                }
                
                if (col < this.size - 1 && this.grid[row][col] === this.grid[row][col + 1]) {
                    return false;
                }
                
                if (row < this.size - 1 && this.grid[row][col] === this.grid[row + 1][col]) {
                    return false;
                }
            }
        }
        return true;
    }
    
    updateDisplay() {
        const container = document.getElementById('tile-container');
        container.innerHTML = '';
        
        for (let row = 0; row < this.size; row++) {
            for (let col = 0; col < this.size; col++) {
                if (this.grid[row][col] !== 0) {
                    const tile = this.createTile(this.grid[row][col], row, col);
                    container.appendChild(tile);
                }
            }
        }
    }
    
    createTile(value, row, col) {
        const { cell, gap } = this.getLayoutMetrics();
        const step = cell + gap;

        const tile = document.createElement('div');
        tile.className = `tile tile-${value}`;
        tile.textContent = value;
        tile.style.left = `${col * step}px`;
        tile.style.top = `${row * step}px`;
        
        setTimeout(() => {
            tile.classList.add('tile-new');
        }, 10);
        
        return tile;
    }
    
    clearTiles() {
        document.getElementById('tile-container').innerHTML = '';
    }
    
    updateScore() {
        document.getElementById('score').textContent = this.score;
        if (this.score > this.best) {
            this.best = this.score;
            localStorage.setItem('best2048', this.best);
            this.updateBest();
        }
    }
    
    updateBest() {
        document.getElementById('best').textContent = this.best;
    }
    
    showMessage(text, className) {
        const messageEl = document.getElementById('game-message');
        messageEl.querySelector('p').textContent = text;
        messageEl.className = `game-message ${className}`;
        messageEl.style.display = 'block';
    }
    
    hideMessage() {
        document.getElementById('game-message').style.display = 'none';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new Game2048();
});
