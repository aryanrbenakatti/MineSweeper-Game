# Minesweeper Game

This is a browser-based implementation of the classic **Minesweeper** game. The objective is to uncover all the safe cells on a 10x10 grid without triggering any mines.

---

## 🕹️ **Gameplay**

### Objective:
- Reveal all non-mine cells while avoiding any mines.

### Features:
1. **Randomized Mines**: 
   - 15 mines are randomly placed on the grid at the start of each game.
2. **Grid Dynamics**:
   - Each cell shows the number of adjacent mines, ranging from 0 to 8.
   - Clicking a cell with no adjacent mines automatically reveals its neighbors recursively.
3. **Flagging**:
   - Players can mark suspected mines with flags for better tracking.
4. **Winning**:
   - Win the game by revealing all non-mine cells.
5. **Losing**:
   - Revealing a mine ends the game, and all mines are displayed.

---

## 🎮 **Controls**

- **Left-click (or Enter/Space)**: Reveal a cell.
- **Right-click (or Context Menu)**: Flag or unflag a cell.
- **Play Again Button**: Starts a new game with a fresh grid and randomized mines.

---

## 🧩 **Game Features**

1. **Recursive Reveal**: Automatically reveals cells with no surrounding mines.
2. **Keyboard Navigation**: Supports keyboard controls for accessibility.
3. **Responsive Design**: Works seamlessly across different devices and screen sizes.
4. **Accessibility**: Uses proper ARIA labels for screen reader compatibility.

---

## 🛠️ **Technology Stack**

- **HTML5**: For structuring the game grid and layout.
- **CSS3**: For styling the game, including cell states (revealed, flagged, or mined).
- **JavaScript**: Core game logic for initializing the grid, placing mines, and handling user interactions.

---

## 🚀 **How to Play**

1. Clone this repository or copy the code files.
2. Open the `index.html` file in any modern web browser.
3. Start clicking cells to reveal safe spots or numbers.
4. Avoid clicking on mines (highlighted in red upon triggering).
5. Flag suspected mines by right-clicking on cells.

---

## 🏆 **Winning Condition**

- The game is won when all safe cells (non-mine cells) are revealed.
- A "You Win!" message will appear upon success.

---

## ❌ **Game Over**

- If you reveal a cell containing a mine, the game ends, and all mines are revealed.
- A "Game Over!" message will appear, and you can click "Play Again" to start over.

---

## 💡 **To Customize**

- **Grid Size**: Change the `gridSize` variable in the JavaScript code.
- **Number of Mines**: Adjust the `numMines` variable in the JavaScript code.

---



