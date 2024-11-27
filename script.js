// script.js

const chessboard = document.getElementById('chessboard');

const initialBoard = [
  ['br', 'bn', 'bb', 'bq', 'bk', 'bb', 'bn', 'br'],
  ['bp', 'bp', 'bp', 'bp', 'bp', 'bp', 'bp', 'bp'],
  ['', '', '', '', '', '', '', ''],
  ['', '', '', '', '', '', '', ''],
  ['', '', '', '', '', '', '', ''],
  ['', '', '', '', '', '', '', ''],
  ['wp', 'wp', 'wp', 'wp', 'wp', 'wp', 'wp', 'wp'],
  ['wr', 'wn', 'wb', 'wq', 'wk', 'wb', 'wn', 'wr']
];

let selectedPiece = null;
let boardState = JSON.parse(JSON.stringify(initialBoard));
let turn = 'w'; // 'w' for white's turn, 'b' for black's turn
let possibleMoves = [];
let moveHistory = [];

function createBoard() {
  chessboard.innerHTML = '';
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const square = document.createElement('div');
      square.classList.add('square');
      square.classList.add((row + col) % 2 === 0 ? 'light' : 'dark');
      square.dataset.row = row;
      square.dataset.col = col;

      square.addEventListener('click', () => squareClick(row, col));

      const piece = boardState[row][col];
      if (piece) {
        const pieceDiv = document.createElement('div');
        pieceDiv.classList.add('piece');
        pieceDiv.style.backgroundImage = `url('images/${piece}.png')`;
        pieceDiv.dataset.piece = piece;
        pieceDiv.dataset.row = row;
        pieceDiv.dataset.col = col;
        if (piece[0] === turn) {
          pieceDiv.addEventListener('click', (e) => pieceClick(e, row, col));
        }
        square.appendChild(pieceDiv);
      }

      chessboard.appendChild(square);
    }
  }
  updateHighlights();
  updateGameStatus();
}

function pieceClick(e, row, col) {
  e.stopPropagation();
  const piece = boardState[row][col];
  if (piece[0] !== turn) {
    return;
  }

  if (selectedPiece && selectedPiece.row === row && selectedPiece.col === col) {
    selectedPiece = null;
    possibleMoves = [];
    updateHighlights();
    return;
  }

  selectedPiece = { piece, row, col };
  possibleMoves = getPossibleMoves(row, col);
  updateHighlights();
}

function squareClick(row, col) {
  if (!selectedPiece) return;
  if (possibleMoves.some(move => move.row === row && move.col === col)) {
    makeMove(selectedPiece.row, selectedPiece.col, row, col);
    selectedPiece = null;
    possibleMoves = [];
    updateHighlights();
  } else {
    selectedPiece = null;
    possibleMoves = [];
    updateHighlights();
  }
}

function updateHighlights() {
  const squares = document.querySelectorAll('.square');
  squares.forEach(square => {
    square.classList.remove('possible-move', 'selected');
  });

  if (selectedPiece) {
    const selectedSquare = document.querySelector(`.square[data-row="${selectedPiece.row}"][data-col="${selectedPiece.col}"]`);
    selectedSquare.classList.add('selected');

    possibleMoves.forEach(move => {
      const moveSquare = document.querySelector(`.square[data-row="${move.row}"][data-col="${move.col}"]`);
      moveSquare.classList.add('possible-move');
    });
  }
}

function makeMove(fromRow, fromCol, toRow, toCol) {
  const movingPiece = boardState[fromRow][fromCol];
  const capturedPiece = boardState[toRow][toCol];

  boardState[toRow][toCol] = movingPiece;
  boardState[fromRow][fromCol] = '';

  // Pawn Promotion
  if (movingPiece[1] === 'p' && (toRow === 0 || toRow === 7)) {
    boardState[toRow][toCol] = movingPiece[0] + 'q'; // Promote to Queen
  }

  moveHistory.push({
    piece: movingPiece,
    from: [fromRow, fromCol],
    to: [toRow, toCol],
    captured: capturedPiece
  });

  // Switch turns
  turn = turn === 'w' ? 'b' : 'w';

  // Check for check or checkmate
  if (isCheckmate(turn)) {
    alert(`${turn === 'w' ? 'Black' : 'White'} wins by checkmate!`);
  } else if (isCheck(turn)) {
    alert(`${turn === 'w' ? 'White' : 'Black'} is in check!`);
  }

  createBoard();
}

function getPossibleMoves(row, col) {
  const piece = boardState[row][col];
  const type = piece[1];
  const color = piece[0];
  let moves = [];

  switch (type) {
    case 'p':
      moves = getPawnMoves(row, col, color);
      break;
    case 'r':
      moves = getRookMoves(row, col, color);
      break;
    case 'n':
      moves = getKnightMoves(row, col, color);
      break;
    case 'b':
      moves = getBishopMoves(row, col, color);
      break;
    case 'q':
      moves = getQueenMoves(row, col, color);
      break;
    case 'k':
      moves = getKingMoves(row, col, color);
      break;
  }

  // Filter out moves that would put the king in check
  moves = moves.filter(move => !wouldCauseCheck(row, col, move.row, move.col, color));

  return moves;
}

function getPawnMoves(row, col, color) {
  let moves = [];
  const direction = color === 'w' ? -1 : 1;
  const startRow = color === 'w' ? 6 : 1;

  // Move forward
  const nextRow = row + direction;
  if (isInBounds(nextRow, col) && boardState[nextRow][col] === '') {
    moves.push({ row: nextRow, col });

    // Double move from starting position
    const doubleNextRow = row + 2 * direction;
    if (row === startRow && boardState[doubleNextRow][col] === '') {
      moves.push({ row: doubleNextRow, col });
    }
  }

  // Capturing moves
  for (let dc of [-1, 1]) {
    const newRow = row + direction;
    const newCol = col + dc;
    if (isInBounds(newRow, newCol) && boardState[newRow][newCol] && boardState[newRow][newCol][0] !== color) {
      moves.push({ row: newRow, col: newCol });
    }
  }

  // TODO: Implement En Passant

  return moves;
}

function getRookMoves(row, col, color) {
  return getSlidingMoves(row, col, color, [[-1, 0], [1, 0], [0, -1], [0, 1]]);
}

function getBishopMoves(row, col, color) {
  return getSlidingMoves(row, col, color, [[-1, -1], [-1, 1], [1, -1], [1, 1]]);
}

function getQueenMoves(row, col, color) {
  return getSlidingMoves(row, col, color, [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [-1, 1], [1, -1], [1, 1]]);
}

function getKingMoves(row, col, color) {
  let moves = [];
  const directions = [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [-1, 1], [1, -1], [1, 1]];

  for (let [dr, dc] of directions) {
    const newRow = row + dr;
    const newCol = col + dc;
    if (isInBounds(newRow, newCol)) {
      const targetPiece = boardState[newRow][newCol];
      if (!targetPiece || targetPiece[0] !== color) {
        moves.push({ row: newRow, col: newCol });
      }
    }
  }

  // TODO: Implement Castling

  return moves;
}

function getKnightMoves(row, col, color) {
  let moves = [];
  const jumps = [
    [-2, -1], [-2, 1],
    [-1, -2], [-1, 2],
    [1, -2], [1, 2],
    [2, -1], [2, 1]
  ];

  for (let [dr, dc] of jumps) {
    const newRow = row + dr;
    const newCol = col + dc;
    if (isInBounds(newRow, newCol)) {
      const targetPiece = boardState[newRow][newCol];
      if (!targetPiece || targetPiece[0] !== color) {
        moves.push({ row: newRow, col: newCol });
      }
    }
  }
  return moves;
}

function getSlidingMoves(row, col, color, directions) {
  let moves = [];

  for (let [dr, dc] of directions) {
    let newRow = row + dr;
    let newCol = col + dc;
    while (isInBounds(newRow, newCol)) {
      const targetPiece = boardState[newRow][newCol];
      if (!targetPiece) {
        moves.push({ row: newRow, col: newCol });
      } else {
        if (targetPiece[0] !== color) {
          moves.push({ row: newRow, col: newCol });
        }
        break;
      }
      newRow += dr;
      newCol += dc;
    }
  }
  return moves;
}

function isInBounds(row, col) {
  return row >= 0 && row < 8 && col >= 0 && col < 8;
}

function isCheck(color) {
  const opponentColor = color === 'w' ? 'b' : 'w';
  const kingPosition = findKing(color);
  if (!kingPosition) return false;

  // Check if any opponent piece can move to the king's position
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      if (boardState[row][col] && boardState[row][col][0] === opponentColor) {
        const moves = getPossibleMovesWithoutFilter(row, col);
        if (moves.some(move => move.row === kingPosition.row && move.col === kingPosition.col)) {
          return true;
        }
      }
    }
  }
  return false;
}

function isCheckmate(color) {
  if (!isCheck(color)) return false;
  // Check if any move can get the king out of check
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      if (boardState[row][col] && boardState[row][col][0] === color) {
        const moves = getPossibleMoves(row, col);
        if (moves.length > 0) {
          return false;
        }
      }
    }
  }
  return true;
}

function findKing(color) {
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      if (boardState[row][col] === color + 'k') {
        return { row, col };
      }
    }
  }
  return null;
}

function wouldCauseCheck(fromRow, fromCol, toRow, toCol, color) {
  // Make a temporary copy of the board
  const tempBoard = boardState.map(row => row.slice());

  // Make the move
  const movingPiece = tempBoard[fromRow][fromCol];
  tempBoard[toRow][toCol] = movingPiece;
  tempBoard[fromRow][fromCol] = '';

  // Check if the king is in check after the move
  return isCheckAfterMove(tempBoard, color);
}

function isCheckAfterMove(tempBoard, color) {
  const opponentColor = color === 'w' ? 'b' : 'w';
  const kingPosition = findKingInBoard(tempBoard, color);
  if (!kingPosition) return true;

  // Check if any opponent piece can move to the king's position
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      if (tempBoard[row][col] && tempBoard[row][col][0] === opponentColor) {
        const moves = getPossibleMovesInBoard(tempBoard, row, col, false);
        if (moves.some(move => move.row === kingPosition.row && move.col === kingPosition.col)) {
          return true;
        }
      }
    }
  }
  return false;
}

function findKingInBoard(board, color) {
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      if (board[row][col] === color + 'k') {
        return { row, col };
      }
    }
  }
  return null;
}

function getPossibleMovesWithoutFilter(row, col) {
  const piece = boardState[row][col];
  const type = piece[1];
  const color = piece[0];
  let moves = [];

  switch (type) {
    case 'p':
      moves = getPawnMoves(row, col, color);
      break;
    case 'r':
      moves = getRookMoves(row, col, color);
      break;
    case 'n':
      moves = getKnightMoves(row, col, color);
      break;
    case 'b':
      moves = getBishopMoves(row, col, color);
      break;
    case 'q':
      moves = getQueenMoves(row, col, color);
      break;
    case 'k':
      moves = getKingMoves(row, col, color);
      break;
  }

  // Do not filter moves that would cause check

  return moves;
}

function getPossibleMovesInBoard(board, row, col) {
  const piece = board[row][col];
  const type = piece[1];
  const color = piece[0];
  let moves = [];

  switch (type) {
    case 'p':
      moves = getPawnMovesInBoard(board, row, col, color);
      break;
    case 'r':
      moves = getSlidingMovesInBoard(board, row, col, color, [[-1, 0], [1, 0], [0, -1], [0, 1]]);
      break;
    case 'n':
      moves = getKnightMovesInBoard(board, row, col, color);
      break;
    case 'b':
      moves = getSlidingMovesInBoard(board, row, col, color, [[-1, -1], [-1, 1], [1, -1], [1, 1]]);
      break;
    case 'q':
      moves = getSlidingMovesInBoard(board, row, col, color, [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [-1, 1], [1, -1], [1, 1]]);
      break;
    case 'k':
      moves = getKingMovesInBoard(board, row, col, color);
      break;
  }

  return moves;
}

function getPawnMovesInBoard(board, row, col, color) {
  let moves = [];
  const direction = color === 'w' ? -1 : 1;
  const nextRow = row + direction;

  // Forward move
  if (isInBounds(nextRow, col) && board[nextRow][col] === '') {
    moves.push({ row: nextRow, col });
  }

  // Capturing moves
  for (let dc of [-1, 1]) {
    const newRow = nextRow;
    const newCol = col + dc;
    if (isInBounds(newRow, newCol) && board[newRow][newCol] && board[newRow][newCol][0] !== color) {
      moves.push({ row: newRow, col: newCol });
    }
  }

  return moves;
}

function getKnightMovesInBoard(board, row, col, color) {
  let moves = [];
  const jumps = [
    [-2, -1], [-2, 1],
    [-1, -2], [-1, 2],
    [1, -2], [1, 2],
    [2, -1], [2, 1]
  ];

  for (let [dr, dc] of jumps) {
    const newRow = row + dr;
    const newCol = col + dc;
    if (isInBounds(newRow, newCol)) {
      const targetPiece = board[newRow][newCol];
      if (!targetPiece || targetPiece[0] !== color) {
        moves.push({ row: newRow, col: newCol });
      }
    }
  }
  return moves;
}

function getSlidingMovesInBoard(board, row, col, color, directions) {
  let moves = [];

  for (let [dr, dc] of directions) {
    let newRow = row + dr;
    let newCol = col + dc;
    while (isInBounds(newRow, newCol)) {
      const targetPiece = board[newRow][newCol];
      if (!targetPiece) {
        moves.push({ row: newRow, col: newCol });
      } else {
        if (targetPiece[0] !== color) {
          moves.push({ row: newRow, col: newCol });
        }
        break;
      }
      newRow += dr;
      newCol += dc;
    }
  }
  return moves;
}

function getKingMovesInBoard(board, row, col, color) {
  let moves = [];
  const directions = [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [-1, 1], [1, -1], [1, 1]];

  for (let [dr, dc] of directions) {
    const newRow = row + dr;
    const newCol = col + dc;
    if (isInBounds(newRow, newCol)) {
      const targetPiece = board[newRow][newCol];
      if (!targetPiece || targetPiece[0] !== color) {
        moves.push({ row: newRow, col: newCol });
      }
    }
  }
  return moves;
}

function updateGameStatus() {
  const statusDiv = document.getElementById('game-status');
  statusDiv.textContent = `Turn: ${turn === 'w' ? 'White' : 'Black'}`;
}

createBoard();
