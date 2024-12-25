<script>
  let gridSize = 10; // Grid size (10x10)
  let numMines = 15; // Number of mines

  let grid = [];
  let gameOver = false;
  let gameWon = false;

  // Initialize the grid
  function initializeGrid() {
    grid = [];
    for (let i = 0; i < gridSize; i++) {
      let row = [];
      for (let j = 0; j < gridSize; j++) {
        row.push({
          isMine: false,
          isRevealed: false,
          isFlagged: false,
          surroundingMines: 0,
        });
      }
      grid.push(row);
    }
    placeMines();
    calculateSurroundingMines();
  }

  // Place mines randomly on the grid
  function placeMines() {
    let placedMines = 0;
    while (placedMines < numMines) {
      const x = Math.floor(Math.random() * gridSize);
      const y = Math.floor(Math.random() * gridSize);
      if (!grid[x][y].isMine) {
        grid[x][y].isMine = true;
        placedMines++;
      }
    }
  }

  // Calculate surrounding mines for each cell
  function calculateSurroundingMines() {
    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        if (grid[i][j].isMine) continue;
        let count = 0;
        for (let x = -1; x <= 1; x++) {
          for (let y = -1; y <= 1; y++) {
            const nx = i + x;
            const ny = j + y;
            if (nx >= 0 && ny >= 0 && nx < gridSize && ny < gridSize && grid[nx][ny].isMine) {
              count++;
            }
          }
        }
        grid[i][j].surroundingMines = count;
      }
    }
  }

  // Handle cell click
  function revealCell(x, y) {
    if (gameOver || grid[x][y].isRevealed || grid[x][y].isFlagged) return;

    grid[x][y].isRevealed = true;
    
    // If it's a mine, change its background to red
    if (grid[x][y].isMine) {
      grid[x][y].isRevealed = true; // Make sure the mine is revealed
      gameOver = true;
      return;
    }

    // If no surrounding mines, reveal surrounding cells recursively
    if (grid[x][y].surroundingMines === 0) {
      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx >= 0 && ny >= 0 && nx < gridSize && ny < gridSize && !grid[nx][ny].isRevealed) {
            revealCell(nx, ny);
          }
        }
      }
    }

    checkWin();
  }

  // Check if the player has won
  function checkWin() {
    let revealedCount = 0;
    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        if (grid[i][j].isRevealed && !grid[i][j].isMine) {
          revealedCount++;
        }
      }
    }
    if (revealedCount === gridSize * gridSize - numMines) {
      gameWon = true;
      gameOver = true;
    }
  }

  // Start a new game
  function startNewGame() {
    gameOver = false;
    gameWon = false;
    initializeGrid();
  }

  // Toggle flagging a cell
  function toggleFlag(x, y) {
    if (gameOver || grid[x][y].isRevealed) return;
    grid[x][y].isFlagged = !grid[x][y].isFlagged;
  }

  // Initialize the game
  initializeGrid();
</script>

<style>
  .container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100vh;
    margin: 0;
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(10, 30px);
    gap: 2px;
    margin-top: 20px;
  }

  .cell {
    width: 30px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #ddd;
    border: 1px solid #ccc;
    cursor: pointer;
    font-size: 14px;
    font-weight: bold;
  }

  .cell:focus {
    outline: 2px solid #007bff;
  }

  .cell.revealed {
    background-color: #f1f1f1;
  }

  .cell.mine {
    background-color: red;
  }

  .cell.flagged {
    background-color: #ffcc00;
  }

  .cell.zero {
    background-color: #e6e6e6;
  }

  .message {
    margin-top: 10px;
    font-size: 18px;
  }

  button {
    margin-top: 10px;
    padding: 5px 10px;
    font-size: 16px;
  }
</style>

<div class="container">
  <h1>Minesweeper</h1>
  <div class="grid">
    {#each grid as row, i (i)}
      {#each row as cell, j (j)}
        <div
          class="cell {cell.isRevealed ? 'revealed' : ''} {cell.isMine && cell.isRevealed ? 'mine' : ''} {cell.isFlagged ? 'flagged' : ''} {cell.surroundingMines === 0 && cell.isRevealed ? 'zero' : ''}"
          tabindex="0"
          role="button"
          aria-label={`Cell (${i}, ${j}) ${cell.isMine ? 'Mine' : cell.surroundingMines + ' surrounding mines'}`}
          on:click={() => revealCell(i, j)}
          on:keydown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              revealCell(i, j);
            }
          }}
          on:contextmenu|preventDefault={() => toggleFlag(i, j)}
        >
          {#if cell.isRevealed && !cell.isMine}
            {cell.surroundingMines > 0 ? cell.surroundingMines : ''}
          {/if}
        </div>
      {/each}
    {/each}
  </div>

  {#if gameOver}
    <div class="message">
      {#if gameWon}
        🎉 You Win!
      {:else}
        💣 Game Over!
      {/if}
      <button on:click={startNewGame}>Play Again</button>
    </div>
  {/if}
</div>
