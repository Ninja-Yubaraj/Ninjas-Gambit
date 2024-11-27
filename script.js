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

function createBoard() {
  chessboard.innerHTML = '';
  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      const square = document.createElement('div');
      square.classList.add('square');
      square.classList.add((i + j) % 2 === 0 ? 'light' : 'dark');
      square.dataset.row = i;
      square.dataset.col = j;

      const piece = boardState[i][j];
      if (piece) {
        const pieceDiv = document.createElement('div');
        pieceDiv.classList.add('piece');
        pieceDiv.style.backgroundImage = `url('images/${piece}.png')`;
        pieceDiv.dataset.piece = piece;
        pieceDiv.dataset.row = i;
        pieceDiv.dataset.col = j;
        pieceDiv.addEventListener('click', selectPiece);
        square.appendChild(pieceDiv);
      }
      square.addEventListener('click', movePiece);
      chessboard.appendChild(square);
    }
  }
}

function selectPiece(e) {
  e.stopPropagation();
  const pieceDiv = e.currentTarget;
  if (selectedPiece) {
    selectedPiece.classList.remove('selected');
  }
  selectedPiece = pieceDiv;
  selectedPiece.classList.add('selected');
}

function movePiece(e) {
  if (!selectedPiece) return;
  const targetSquare = e.currentTarget;
  const newRow = parseInt(targetSquare.dataset.row);
  const newCol = parseInt(targetSquare.dataset.col);
  const oldRow = parseInt(selectedPiece.dataset.row);
  const oldCol = parseInt(selectedPiece.dataset.col);

  // Update the board state
  boardState[newRow][newCol] = boardState[oldRow][oldCol];
  boardState[oldRow][oldCol] = '';

  selectedPiece = null;
  createBoard();
}

createBoard();
