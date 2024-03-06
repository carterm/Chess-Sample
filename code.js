// @ts-check
const unitcode_empty = 0;
const unitcode_pawn = 1;
const unitcode_rook = 2;
const unitcode_knight = 3;
const unitcode_bishop = 4;
const unitcode_queen = 5;
const unitcode_king = 6;

const css_validmove = "validmove";
const css_selected = "selected";

let turn = 1; //1 or -1

/** @type {number[]} */
let boardData = [
    -2, -3, -4, -5, -6, -4, -3, -2,
    -1, -1, -1, -1, -1, -1, -1, -1,
    0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0,
    1, 1, 1, 1, 1, 1, 1, 1,
    2, 3, 4, 5, 6, 4, 3, 2,
];

/** 
 * @typedef {object} Move
 * @property {number} x
 * @property {number} y
 * @property {number} fromX
 * @property {number} fromY
 * @property {number} points
 */

function load() {
    const gameboard = document.getElementById("gameboard");
    if (gameboard)
        for (let y = 0; y < 8; y++)
            for (let x = 0; x < 8; x++) {
                let cell = document.createElement("div");
                cell.className = (x + y) % 2 ? "black" : "white"; //alternating grid color

                cell.setAttribute("x", x.toString());
                cell.setAttribute("y", y.toString());
                cell.onclick = click;
                gameboard.appendChild(cell);
            }


    render();
}

function render() {
    document.querySelectorAll("#gameboard div")
        .forEach((cell, i) => {
            cell.innerHTML = getunitimage(boardData[i]) || "";
        });
}

/**
 * @param {number} unit_id 
 */
function getunitimage(unit_id) {
    switch (unit_id) {
        case unitcode_pawn:
            return "&#9817;";
        case unitcode_rook:
            return "&#9814;";
        case unitcode_knight:
            return "&#9816;";
        case unitcode_bishop:
            return "&#9815;";
        case unitcode_queen:
            return "&#9813;";
        case unitcode_king:
            return "&#9812";
        case -unitcode_pawn:
            return "&#9823;";
        case -unitcode_rook:
            return "&#9820;";
        case -unitcode_knight:
            return "&#9822;";
        case -unitcode_bishop:
            return "&#9821;";
        case -unitcode_queen:
            return "&#9819;";
        case -unitcode_king:
            return "&#9818;";
        default:
            return null
    }
}

/**
 * 
 * @param {number} x 
 * @param {number} y 
 */
function getBoardValue(x, y) {
    return boardData[8 * y + x];
}

/**
 * 
 * @param {number} x 
 * @param {number} y 
 * @param {number} value
 */
function setBoardValue(x, y, value) {
    boardData[8 * y + x] = value;
}

function click() {
    /** @type {HTMLDivElement} */
    const target = this;

    const targetXY = getXYfromCell(target);

    const data_value = getBoardValue(targetXY.x, targetXY.y);

    const selected_square = document.querySelector(`.${css_selected}`);
    const target_is_valid_move = target.classList.contains(css_validmove);

    //Reset selected square
    document.querySelectorAll(`.${css_selected}`).forEach(e => e.classList.remove(css_selected));
    document.querySelectorAll(`.${css_validmove}`).forEach(e => e.classList.remove(css_validmove));

    if (selected_square && target_is_valid_move) {
        let selected = getXYfromCell(selected_square);

        domove(selected.x, selected.y, targetXY.x, targetXY.y);

        turn = -turn;

        ai();
    } else if (Math.sign(data_value) === turn) {
        //selecting a piece that matches the turn

        target.classList.add(css_selected);

        let valid_moves = getvalidmoves(targetXY.x, targetXY.y);

        valid_moves
            .map(v => document.querySelector(`div[x="${v.x}"][y="${v.y}"]`))
            .forEach(v2 => { if (v2) v2.classList.add(css_validmove) });
    }

    render();
}

function ai() {
    /** @type {Move[]} */
    const moves = [];

    for (let y = 0; y < 8; y++) {
        for (let x = 0; x < 8; x++) {
            let newmoves = getvalidmoves(x, y);
            newmoves.forEach(mv => {
                mv.fromX = x;
                mv.fromY = y;
                moves.push(mv);
            })
        }
    }

    if (moves.length) {
        moves.sort(() => Math.random() - Math.random()); //randomize the moves before scoring them
        moves.sort((a, b) => b.points - a.points); //sort by scoring

        domove(moves[0].fromX, moves[0].fromY, moves[0].x, moves[0].y);
        turn *= -1;
        return;
    }

    alert('no moves for ai');
}

/**
 * 
 * @param {number} fromx 
 * @param {number} fromy 
 * @param {number} tox 
 * @param {number} toy 
 */
function domove(fromx, fromy, tox, toy) {
    switch (getBoardValue(tox, toy)) {
        case -unitcode_king:
            alert('Black king is toast');
            break;
        case unitcode_king:
            alert('White king is toast');
            break;
    }

    setBoardValue(tox, toy, getBoardValue(fromx, fromy));
    setBoardValue(fromx, fromy, unitcode_empty);
}


/**
 * 
 * @param {Element} cell 
 */
function getXYfromCell(cell) {
    return {
        x: Number(cell.getAttribute("X")),
        y: Number(cell.getAttribute("Y"))
    };
}


/**
 * 
 * @param {number} x 
 * @param {number} y 
 */
function getvalidmoves(x, y) {
    let selected_unit = getBoardValue(x, y);

    if (Math.sign(selected_unit) !== turn) return [];

    /** @type {Move[]} */
    let valid_moves = [];

    switch (Math.abs(selected_unit)) {
        case unitcode_pawn:
            valid_moves = [
                ...addMovesThisway(x, y, 0, -turn, 1, false)
            ];

            if (valid_moves.length && (turn === -1 && y === 1) || turn === 1 && y === 6) {
                valid_moves = [
                    ...valid_moves,
                    ...addMovesThisway(x, y, 0, -turn * 2, 1, false)
                ]
            }

            valid_moves = [
                ...valid_moves,
                ...addMovesThisway(x, y, 1, -turn, 1, true),
                ...addMovesThisway(x, y, -1, -turn, 1, true)
            ]

            //TODO: En Passant

            break;
        case unitcode_knight:
            valid_moves =
                [
                    ...addMovesThisway(x, y, 1, 2, 1),
                    ...addMovesThisway(x, y, 1, -2, 1),
                    ...addMovesThisway(x, y, -1, 2, 1),
                    ...addMovesThisway(x, y, -1, -2, 1),
                    ...addMovesThisway(x, y, 2, 1, 1),
                    ...addMovesThisway(x, y, 2, -1, 1),
                    ...addMovesThisway(x, y, -2, 1, 1),
                    ...addMovesThisway(x, y, -2, -1, 1)
                ];

            break;
        case unitcode_rook:
            valid_moves = [
                ...addMovesThisway(x, y, 0, 1, 8),
                ...addMovesThisway(x, y, 0, -1, 8),
                ...addMovesThisway(x, y, 1, 0, 8),
                ...addMovesThisway(x, y, -1, 0, 8)
            ];

            break;
        case unitcode_bishop:
            valid_moves = [
                ...addMovesThisway(x, y, 1, -1, 8),
                ...addMovesThisway(x, y, -1, 1, 8),
                ...addMovesThisway(x, y, 1, 1, 8),
                ...addMovesThisway(x, y, -1, -1, 8)
            ];

            break;
        case unitcode_queen:
            valid_moves = [
                ...addMovesThisway(x, y, 0, 1, 8),
                ...addMovesThisway(x, y, 0, -1, 8),
                ...addMovesThisway(x, y, 1, 0, 8),
                ...addMovesThisway(x, y, -1, 0, 8),
                ...addMovesThisway(x, y, 1, -1, 8),
                ...addMovesThisway(x, y, -1, 1, 8),
                ...addMovesThisway(x, y, 1, 1, 8),
                ...addMovesThisway(x, y, -1, -1, 8),
            ];

            break;
        case unitcode_king:
            valid_moves = [
                ...addMovesThisway(x, y, 0, 1, 1),
                ...addMovesThisway(x, y, 0, -1, 1),
                ...addMovesThisway(x, y, 1, 0, 1),
                ...addMovesThisway(x, y, -1, 0, 1),
                ...addMovesThisway(x, y, 1, -1, 1),
                ...addMovesThisway(x, y, -1, 1, 1),
                ...addMovesThisway(x, y, 1, 1, 1),
                ...addMovesThisway(x, y, -1, -1, 1),
            ];

            //TODO: Castling

            break;
    }

    return valid_moves;
}

/**
 * @param {number} fromX
 * @param {number} fromY 
 * @param {number} OffsetX 
 * @param {number} OffsetY 
 * @param {number} MaxDistance 
 * @param {boolean} [takeunit]
 * @returns {Move[]}
 */
function addMovesThisway(fromX, fromY, OffsetX, OffsetY, MaxDistance, takeunit) {
    if (MaxDistance < 1) return [];

    let x = fromX + OffsetX;
    let y = fromY + OffsetY;

    if (x < 0 || x > 7 || y < 0 || y > 7) return [];

    let dataat = getBoardValue(x, y);

    const thismove = /** @type {Move} */ ({ x, y, points: Math.abs(dataat) });

    if (takeunit !== true && dataat === unitcode_empty) {
        //empty spot...keep going
        return [
            ...addMovesThisway(x, y, OffsetX, OffsetY, MaxDistance - 1),
            thismove
        ];
    } else if (takeunit !== false && -Math.sign(dataat) === turn) {
        //opponent

        return [thismove];
    }

    return [];
}