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
let moveCount = 0;

// Variables to track castling rights
let castlingRights = {
  w: { kingSide: true, queenSide: true },
  b: { kingSide: true, queenSide: true }
};

// Variable to track en passant target
let enPassantTarget = null;

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
    square.classList.remove('possible-move', 'selected', 'check');
  });

  if (selectedPiece) {
    const selectedSquare = document.querySelector(`.square[data-row="${selectedPiece.row}"][data-col="${selectedPiece.col}"]`);
    selectedSquare.classList.add('selected');

    possibleMoves.forEach(move => {
      const moveSquare = document.querySelector(`.square[data-row="${move.row}"][data-col="${move.col}"]`);
      moveSquare.classList.add('possible-move');
    });
  }

  // Highlight the king when in check
  const kingPosition = findKing(turn);
  if (kingPosition && isCheck(turn)) {
    const kingSquare = document.querySelector(`.square[data-row="${kingPosition.row}"][data-col="${kingPosition.col}"]`);
    kingSquare.classList.add('check');
  }
}

function makeMove(fromRow, fromCol, toRow, toCol) {
  const movingPiece = boardState[fromRow][fromCol];
  let capturedPiece = boardState[toRow][toCol];
  let isCastlingMove = false;
  let promotion = null;

  // Handle castling move
  if (movingPiece[1] === 'k' && Math.abs(fromCol - toCol) === 2) {
    isCastlingMove = true;
    if (toCol === 6) {
      // King-side castling
      boardState[fromRow][5] = boardState[fromRow][7];
      boardState[fromRow][7] = '';
    } else if (toCol === 2) {
      // Queen-side castling
      boardState[fromRow][3] = boardState[fromRow][0];
      boardState[fromRow][0] = '';
    }
  }

  // En Passant capture
  if (movingPiece[1] === 'p' && enPassantTarget && toRow === enPassantTarget.row && toCol === enPassantTarget.col) {
    capturedPiece = boardState[fromRow][toCol];
    boardState[fromRow][toCol] = '';
  }

  boardState[toRow][toCol] = movingPiece;
  boardState[fromRow][fromCol] = '';

  // Update castling rights
  updateCastlingRights(movingPiece, fromRow, fromCol);

  // Pawn Promotion
  if (movingPiece[1] === 'p' && (toRow === 0 || toRow === 7)) {
    promotion = promotePawn(toRow, toCol, movingPiece[0]);
  }

  // Update en passant target
  enPassantTarget = null;
  if (movingPiece[1] === 'p' && Math.abs(toRow - fromRow) === 2) {
    enPassantTarget = { row: (fromRow + toRow) / 2, col: fromCol };
  }

  // Switch turns
  turn = turn === 'w' ? 'b' : 'w';

  // Check for check or checkmate
  const opponentColor = turn;
  const isOpponentInCheck = isCheck(opponentColor);
  const isOpponentInCheckmate = isCheckmate(opponentColor);
  const isOpponentInStalemate = isStalemate(opponentColor);

  // Store the move in moveHistory with check information
  moveHistory.push({
    piece: movingPiece,
    from: [fromRow, fromCol],
    to: [toRow, toCol],
    captured: capturedPiece,
    isCastling: isCastlingMove,
    promotion: promotion,
    isCheck: isOpponentInCheck,
    isCheckmate: isOpponentInCheckmate
  });

  moveCount++;

  // Handle game end conditions
  if (isOpponentInCheckmate) {
    alert(`${turn === 'w' ? 'Black' : 'White'} wins by checkmate!`);
  } else if (isOpponentInStalemate) {
    alert(`Game over: Stalemate!`);
  }
  // Commented out the alert for checks
  // else if (isOpponentInCheck) {
  //   alert(`${turn === 'w' ? 'White' : 'Black'} is in check!`);
  // }

  createBoard();
  updateMoveHistory();
}

function updateCastlingRights(piece, row, col) {
  if (piece === 'wk') {
    castlingRights.w.kingSide = false;
    castlingRights.w.queenSide = false;
  } else if (piece === 'bk') {
    castlingRights.b.kingSide = false;
    castlingRights.b.queenSide = false;
  } else if (piece === 'wr' && row === 7 && col === 7) {
    castlingRights.w.kingSide = false;
  } else if (piece === 'wr' && row === 7 && col === 0) {
    castlingRights.w.queenSide = false;
  } else if (piece === 'br' && row === 0 && col === 7) {
    castlingRights.b.kingSide = false;
  } else if (piece === 'br' && row === 0 && col === 0) {
    castlingRights.b.queenSide = false;
  }
}

function promotePawn(row, col, color) {
  let pieceType = prompt('Promote to (q/r/b/n):', 'q');
  const validTypes = ['q', 'r', 'b', 'n'];
  if (!validTypes.includes(pieceType.toLowerCase())) {
    pieceType = 'q';
  } else {
    pieceType = pieceType.toLowerCase();
  }
  boardState[row][col] = color + pieceType;
  return pieceType;
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
    if (row === startRow && boardState[doubleNextRow][col] === '' && boardState[nextRow][col] === '') {
      moves.push({ row: doubleNextRow, col });
    }
  }

  // Capturing moves
  for (let dc of [-1, 1]) {
    const newRow = row + direction;
    const newCol = col + dc;
    if (isInBounds(newRow, newCol)) {
      if (boardState[newRow][newCol] && boardState[newRow][newCol][0] !== color) {
        moves.push({ row: newRow, col: newCol });
      } else if (enPassantTarget && enPassantTarget.row === newRow && enPassantTarget.col === newCol) {
        moves.push({ row: newRow, col: newCol });
      }
    }
  }

  return moves;
}

function getRookMoves(row, col, color) {
  return getSlidingMoves(row, col, color, [[-1, 0], [1, 0], [0, -1], [0, 1]]);
}

function getBishopMoves(row, col, color) {
  return getSlidingMoves(row, col, color, [[-1, -1], [-1, 1], [1, -1], [1, 1]]);
}

function getQueenMoves(row, col, color) {
  return getSlidingMoves(row, col, color, [
    [-1, 0], [1, 0], [0, -1], [0, 1],
    [-1, -1], [-1, 1], [1, -1], [1, 1]
  ]);
}

function getKingMoves(row, col, color) {
  let moves = [];
  const directions = [
    [-1, 0], [1, 0], [0, -1], [0, 1],
    [-1, -1], [-1, 1], [1, -1], [1, 1]
  ];

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

  // Castling
  if (!isCheck(color) && row === (color === 'w' ? 7 : 0) && col === 4) {
    // King-side castling
    if (castlingRights[color].kingSide && boardState[row][5] === '' && boardState[row][6] === '') {
      if (!wouldCauseCheck(row, col, row, 5, color) && !wouldCauseCheck(row, col, row, 6, color)) {
        moves.push({ row: row, col: 6 });
      }
    }
    // Queen-side castling
    if (castlingRights[color].queenSide && boardState[row][3] === '' && boardState[row][2] === '' && boardState[row][1] === '') {
      if (!wouldCauseCheck(row, col, row, 3, color) && !wouldCauseCheck(row, col, row, 2, color)) {
        moves.push({ row: row, col: 2 });
      }
    }
  }

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
        const moves = getPossibleMovesWithoutFilter(row, col, boardState);
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

function isStalemate(color) {
  if (isCheck(color)) return false;
  // Check if the player has any legal moves
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
  const capturedPiece = tempBoard[toRow][toCol];
  tempBoard[toRow][toCol] = movingPiece;
  tempBoard[fromRow][fromCol] = '';

  // Handle en passant capture in temp board
  let tempEnPassantTarget = enPassantTarget;
  if (movingPiece[1] === 'p' && tempEnPassantTarget && toRow === tempEnPassantTarget.row && toCol === tempEnPassantTarget.col) {
    tempBoard[fromRow][toCol] = '';
  }

  // Check if the king is in check after the move
  const inCheck = isCheckAfterMove(tempBoard, color);

  return inCheck;
}

function isCheckAfterMove(tempBoard, color) {
  const opponentColor = color === 'w' ? 'b' : 'w';
  const kingPosition = findKingInBoard(tempBoard, color);
  if (!kingPosition) return true;

  // Check if any opponent piece can move to the king's position
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      if (tempBoard[row][col] && tempBoard[row][col][0] === opponentColor) {
        const moves = getPossibleMovesWithoutFilter(row, col, tempBoard);
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

function getPossibleMovesWithoutFilter(row, col, board) {
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
      moves = getSlidingMovesInBoard(board, row, col, color, [
        [-1, 0], [1, 0], [0, -1], [0, 1],
        [-1, -1], [-1, 1], [1, -1], [1, 1]
      ]);
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

  // Forward move
  const nextRow = row + direction;
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
  const directions = [
    [-1, 0], [1, 0], [0, -1], [0, 1],
    [-1, -1], [-1, 1], [1, -1], [1, 1]
  ];

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

function updateMoveHistory() {
  const historyDiv = document.getElementById('move-history');
  historyDiv.innerHTML = '';

  // Group moves by move number
  const movesByNumber = [];
  for (let i = 0; i < moveHistory.length; i += 2) {
    const whiteMove = moveHistory[i];
    const blackMove = moveHistory[i + 1];
    movesByNumber.push({ whiteMove, blackMove });
  }

  movesByNumber.forEach((movePair, index) => {
    const moveNumber = index + 1;
    const whiteAlgebraic = movePair.whiteMove ? getAlgebraicNotation(movePair.whiteMove) : '';
    const blackAlgebraic = movePair.blackMove ? getAlgebraicNotation(movePair.blackMove) : '';

    const moveText = document.createElement('div');
    moveText.textContent = `${moveNumber}. ${whiteAlgebraic}    ${blackAlgebraic}`;
    historyDiv.appendChild(moveText);
  });
}

function getAlgebraicNotation(move) {
  const piece = move.piece;
  const from = move.from;
  const to = move.to;
  const captured = move.captured;
  const isCastling = move.isCastling;
  const promotion = move.promotion;
  const isCheck = move.isCheck;
  const isCheckmate = move.isCheckmate;

  const pieceType = piece[1];
  const color = piece[0];
  let pieceLetter = '';

  if (pieceType !== 'p') {
    pieceLetter = getPieceLetter(pieceType);
  }

  // Castling
  if (isCastling) {
    if (to[1] === 6) {
      return 'O-O'; // King-side castling
    } else if (to[1] === 2) {
      return 'O-O-O'; // Queen-side castling
    }
  }

  const fromFile = String.fromCharCode(97 + from[1]);
  const fromRank = 8 - from[0];
  const toFile = String.fromCharCode(97 + to[1]);
  const toRank = 8 - to[0];
  const toSquare = `${toFile}${toRank}`;

  let notation = '';

  // Pawn moves
  if (pieceType === 'p') {
    if (captured) {
      notation = `${fromFile}x${toSquare}`;
    } else {
      notation = `${toSquare}`;
    }
  } else {
    notation = `${pieceLetter}`;
    // Disambiguation is omitted for simplicity
    if (captured) {
      notation += `x`;
    }
    notation += `${toSquare}`;
  }

  // Promotion
  if (promotion) {
    notation += `=${getPieceLetter(promotion)}`;
  }

  // Check or Checkmate
  if (isCheckmate) {
    notation += '#';
  } else if (isCheck) {
    notation += '+';
  }

  return notation;
}

function getPieceLetter(type) {
  switch (type) {
    case 'p':
      return '';
    case 'r':
      return 'R';
    case 'n':
      return 'N';
    case 'b':
      return 'B';
    case 'q':
      return 'Q';
    case 'k':
      return 'K';
    default:
      return '';
  }
}

function updateGameStatus() {
  const statusDiv = document.getElementById('game-status');
  statusDiv.textContent = `Turn: ${turn === 'w' ? 'White' : 'Black'}`;
}

createBoard();
updateMoveHistory();
