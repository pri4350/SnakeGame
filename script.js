const board = document.getElementById('board');
const blockHeight = 80;
const blockWidth = 80;

const cols = Math.floor(board.clientWidth / blockWidth);
const rows = Math.floor(board.clientHeight / blockHeight);

const blocks = [];

for (let i = 0; i < rows * cols; i++) {
    const block = document.createElement('div');
    block.classList.add('block');
    board.appendChild(block);
}

for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
        const block = document.createElement('div');
        block.classList.add('block');
        board.appendChild(block);
    }
}

