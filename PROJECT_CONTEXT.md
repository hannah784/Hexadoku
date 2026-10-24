Act as an expert Frontend Developer and Computer Scientist. Your goal is to write the complete, production-ready codebase for a 16x16 Sudoku (Hexadoku) web application in a single response ("one-shot"). Do not leave placeholders like "// implement logic here"; provide the actual implementation.

### Tech Stack
*   **Framework:** React (Functional components & Hooks)
*   **Build Tool:** Vite
*   **Language:** TypeScript (Strict typing required)
*   **Styling:** CSS Modules or Tailwind CSS (choose one and be consistent)
*   **Persistence:** Browser `localStorage`

### Project Architecture
Use the following file structure. Generate the complete code for every file listed:
src/
 ├── components/
 │    ├── Board.tsx           (Renders the 16x16 grid, handles cell inputs)
 │    ├── Cell.tsx            (Individual input cell, handles focus and validation styling)
 │    ├── ControlPanel.tsx    (Buttons for Check, Reset, Solve, Save/Load)
 │    └── ComplexityPanel.tsx (Displays Time/Space complexity and P vs NP explanation)
 ├── hooks/
 │    └── useSudoku.ts        (Custom hook managing grid state, local storage, and history)
 ├── utils/
 │    ├── sudokuLogic.ts      (Functions for board generation, validation, and solving algorithm)
 │    └── complexityData.ts   (Constants containing the mathematical explanations)
 ├── types/
 │    └── index.ts            (TypeScript interfaces for Board, Cell, GameState)
 ├── App.tsx                  (Main layout container)
 └── main.tsx                 (Entry point)

### Core Features & Requirements

1.  **16x16 Grid UI & UX:**
    *   The board must be a 16x16 grid, visually divided into 16 smaller 4x4 subgrids using thicker borders.
    *   Valid inputs are numbers `1-9` and letters `A-G` (or `0-9` and `A-F`, please define clearly in the UI).
    *   Cells should highlight dynamically: light gray for initial fixed numbers, white for empty, red background for currently invalid placements, and a distinct border for the active/focused cell.

2.  **Game Logic (`sudokuLogic.ts`):**
    *   **Validation:** A function to check if the current grid is valid (no duplicates in any row, column, or 4x4 subgrid).
    *   **Completeness Check:** A function to verify if the board is completely and correctly filled.
    *   **Solver (Backtracking):** Implement an algorithmic solver to evaluate user answers or provide hints.

3.  **State Management & Persistence (`useSudoku.ts`):**
    *   Save the current board state to `localStorage` on every change.
    *   Load the board from `localStorage` on initial render to prevent data loss on refresh.
    *   Maintain the state of "fixed" cells (from the initial puzzle) vs "user-input" cells.

4.  **Computer Science Educational Panel (`ComplexityPanel.tsx`):**
    *   **Time & Space Complexity:** Dynamically display the Time Complexity ($O(b^d)$ or $O(n^m)$) and Space Complexity ($O(n^2)$) of the specific validation and solving algorithms you implemented in `sudokuLogic.ts`. Explain what the variables mean in the context of a 16x16 grid.
    *   **P vs NP Classification:** Provide a clear, technical explanation section detailing why a generalized $n \times n$ Sudoku puzzle is in NP (a proposed solution can be verified in polynomial time) and why it is NP-complete. 

### Output Instructions
1.  Begin with the `types/index.ts` file to establish the data contracts.
2.  Provide the complete algorithmic logic in `utils/sudokuLogic.ts`.
3.  Implement the React hooks and components.
4.  Wrap everything in `App.tsx`.
5.  Ensure all imports map correctly to the specified architecture.
6.  Output the code blocks sequentially with clear file names at the top of each block.

### Advanced Engineering & UX Requirements (MUST IMPLEMENT)

1.  **Performance & Web Workers (`sudokuWorker.ts`):**
    *   Because a 16x16 grid (256 cells) is computationally expensive, the solving algorithm MUST NOT block the main thread.
    *   Implement the solver inside a Web Worker. 
    *   The `ControlPanel` should show a "Solving..." loading state while the Web Worker processes the board, and return the result asynchronously.

2.  **Advanced Algorithmic Solver:**
    *   Instead of basic brute-force backtracking, implement a highly optimized solver. Prefer Donald Knuth’s **Algorithm X (Dancing Links)** or a backtracking solver with **Minimum Remaining Values (MRV)** heuristic and constraint propagation to handle the 16x16 constraints efficiently.
    *   Update the `ComplexityPanel.tsx` to reflect the specific Time and Space complexity of this optimized algorithm compared to brute force.

3.  **Complex State Management (`useReducer`):**
    *   Do not use multiple `useState` hooks for the board state. Implement `useReducer` in your `useSudoku.ts` hook. 
    *   Define strict action types (e.g., `SET_CELL`, `RESET_BOARD`, `SOLVE_START`, `SOLVE_COMPLETE`, `LOAD_STATE`).

4.  **Accessibility & Keyboard Navigation (A11y):**
    *   The grid must support Arrow Key navigation (Up, Down, Left, Right) so the user can fluidly move between the 256 cells without using the mouse.
    *   When an invalid character is typed, visually shake the cell or provide immediate feedback.

5.  **Board Generation Logic:**
    *   Include a function to generate a valid, solvable 16x16 puzzle with at least 40% of the cells pre-filled (fixed state). Do not just hardcode a single puzzle; write the algorithmic generation logic.


### Extreme Performance & Memory Optimizations (CRITICAL)

To handle a 16x16 grid (256 cells) and deep backtracking recursion at 60FPS without frame drops, you MUST implement the following optimizations:

1.  **Optimal Data Structures (`Uint8Array`):**
    *   Do NOT use a 2D array of JavaScript objects (e.g., `Cell[][]`) to store the board state. This causes massive memory fragmentation and garbage collection pauses.
    *   Store the board as a flat, 1-Dimensional `Uint8Array(256)`. 
    *   Write utility functions to translate `(row, col)` into a 1D index: `index = row * 16 + col`.

2.  **Bitwise Constraint Propagation (Constant Time $O(1)$ Checks):**
    *   Do NOT iterate through arrays to check if a row, column, or 4x4 subgrid contains a number.
    *   Use 16-bit integers as bitmasks to track used numbers. Maintain three arrays: `rowMasks`, `colMasks`, and `boxMasks`.
    *   Validating if a number `n` is allowed should be a simple bitwise operation: `(rowMask[r] & (1 << n)) === 0`. 
    *   The Web Worker solver MUST utilize these bitwise operations.

3.  **Zero-Copy Worker Messaging:**
    *   When sending the board state to the `sudokuWorker`, do not send a standard JavaScript array (which requires heavy structured cloning).
    *   Pass the underlying ArrayBuffer of the `Uint8Array` as a **Transferable Object** (`worker.postMessage(board, [board.buffer])`) to achieve zero-copy, instant thread communication.

4.  **Zero Wasted React Renders:**
    *   A single keystroke must NOT re-render all 256 cells. 
    *   The `Cell.tsx` component MUST be wrapped in `React.memo`.
    *   Write a custom `areEqual` comparison function for `React.memo` that only returns `false` if the specific cell's value


### Token Limit & Continuity Protocol (Handoff State)

Given the extreme detail and length of this project, you may reach your maximum output token limit before completing all files. You must manage this gracefully:

1.  **Monitor Output Length:** If you realize you are nearing your maximum token output limit and cannot finish the current file or the remaining architecture, DO NOT stop abruptly in the middle of a code block.
2.  **Trigger Handoff:** Stop generating code and output a clearly labeled `### CONTINUITY CONTEXT ###` block. 
3.  **Context Requirements:** Inside this block, provide a highly compressed machine-readable summary containing:
    *   `[COMPLETED]`: A list of files fully generated so far.
    *   `[IN_PROGRESS]`: The exact file, function, and line concept you were about to write or were currently writing.
    *   `[PENDING]`: The remaining files and logic yet to be generated.
    *   `[SHARED_STATE]`: Any specific variable names, prop interfaces, or bitmask states established in the completed files that the remaining files rely on.
4.  **Pause:** End your response immediately after the continuity context, prompting me to type "Continue" so the next agent (or next turn) can pick up exactly where you left off without hallucinating different variable names.