const gametypes = [
    {name: "small", size: 9, mines: 10}, 
    {name: "medium", size: 16, mines: 40}, 
    {name: "large", size: 24, mines: 150}
]

const minefield = { // storing the mines on game start
    size: "",
    area: 0,
    mines: 0,
    field: [],
    uncovered: [],
    progress: [0, 0]
}

var movecounter = 0 // did the game start already?
var cells = 0 // this will become an array on game start

function init() {
    this.loadContent();
    this.loadHeader()
    this.loadPlayfield()
    this.loadButtonbar()
    this.loadFooter()
    this.checkExistingGame()
}

function loadContent() {
    const body = document.body;
    const content = document.createElement('div');
    body.appendChild(content);
    content.id = 'content';
}

function loadHeader() {
    const content = document.getElementById('content');
    const header = document.createElement('header');
    content.appendChild(header);
    header.title = 'Source: ZDF Sketch History Staffel 03 Folge 01 "Väter der Granate"';
    const title = document.createElement('div');
    title.classList.add('title-field')
    header.appendChild(title)
    const heading = document.createElement('h1')
    const titlep = document.createElement('p')
    heading.innerHTML = 'Minesweeper'
    titlep.innerHTML = 'by Xenoreaper'
    title.appendChild(heading)
    title.appendChild(titlep)
}

function loadFooter() {
    const content = document.getElementById('content');
    const footer = document.createElement('footer');
    content.appendChild(footer);
    const footercontent = document.createElement('div')
    footercontent.classList.add('footer-field')
    footer.appendChild(footercontent)
    const copyright = document.createElement('a')
    footercontent.appendChild(copyright)
    copyright.addEventListener("click", copyredirect)
    copyright.innerHTML = 'ⓒ 2024 Xenoreaper'
}

function loadPlayfield() {
    const content = document.getElementById('content');
    const playfield = document.createElement('div')
    playfield.id = 'playfield'
    content.appendChild(playfield)
    playfield.addEventListener("contextmenu", event => {event.preventDefault()})
}

function loadButtonbar() {
    const content = document.getElementById('content');
    const buttonbar = document.createElement('div')
    buttonbar.id = 'buttons'
    content.appendChild(buttonbar)
    for(let i = 0; i < gametypes.length; i++) { // not shorter than before, but allows to easily add more sizes
        this.loadButton(gametypes[i].name, i)
    }
}

function loadButton(name, game) {
    const buttonbar = document.getElementById('buttons')
    const button = document.createElement('button')
    button.innerHTML = name
    button.addEventListener("click", (e) => this.loadGame(gametypes[game]))
    buttonbar.appendChild(button)
}

function copyredirect() {
    window.location = 'https://youtu.be/xpiYozkx6xw'; // we ignore this one
}

function loadGame(gametype) {
    minefield.field = []
    movecounter = 0
    cells = document.getElementById('playfield').children // cell array to make access to cells less of a pain
    const playfield = document.getElementById('playfield')
    playfield.innerHTML = ''
    const row = gametype.size

    document.documentElement.style.setProperty('--playfield-size', gametype.size) // adjust css scaling
    
    // save game info into minefield object
    minefield.size = gametype.name
    minefield.area = gametype.size
    minefield.mines = gametype.mines
    minefield.progress[1] = (gametype.size**2)
    minefield.progress[0] = 0

    for (let i = 0; i < row; i++) {
        minefield.field[i] = []
        minefield.uncovered[i] = []
        for (let j = 0; j < row; j++) {
            createCell(j, i, row)
            minefield.field[i][j] = false // create cells and fill minefield with nothing
            minefield.uncovered[i][j] = false
        }
    }
}

function createCell(row, col, max) {
    const playfield = document.getElementById('playfield')
    const cell = document.createElement('div')
    const cellnum = row+1 + col*max
    cell.classList.add('cell')
    cell.classList.add(cellnum)
    playfield.appendChild(cell)

    cell.addEventListener("click", (e) => { // left click to uncover field
        leftClick(row, col)
    })

    cell.addEventListener("contextmenu", (e) => { // right click to mark rat if not uncovered
        rightClick(row, col)
    })

    cell.addEventListener("dblclick", (e) => { // double click to uncover fields around numbers
        doubleClick(row, col)
    })

    var touchstart = 0; // seems to be unnecessary, browsers seem to have this functionality built-in
    var previoustouchstart = 0;
    cell.addEventListener("touchstart", (e) => {
        touchstart = Date.now();
        if(touchstart - previoustouchstart < 200) {
            console.log('doubletap')
            doubleClick(row, col)
        }
    })
    cell.addEventListener("touchend", (e) => {
        const touchduration = Date.now() - touchstart;
        previoustouchstart = touchstart
        if(touchduration > 500) { // adding right click functionality here causes problems
            console.log('long touch')
        } else {
            console.log('short touch')
            leftClick(row, col)
        }
    })
}

function checkArea(row, col, pass) { // return check array
    const arr = []
    let count = 0

    if(pass !== true) {
        pass = false // rats will be irrelevant if not specified otherwise
    }
    for(let i = -1; i <= 1; i++) {
        for(let j = -1; j <= 1; j++) {
            let cellnum = row+j + (col+i)*minefield.area
            arr[count] = checkFieldType(row+j, col+i, row, col, pass)
            count++
        }
    }
    return arr
}

function checkFieldType(row, col, crow, ccol, pass) {
    const cellnum = row + col*minefield.area // cell number of cell to verify
    const ccellnum = crow + ccol*minefield.area // clicked cell number
    const totalcells = minefield.area**2

    if(cellnum < 0 || cellnum > totalcells-1 || (((ccellnum+1)%minefield.area == 0 && (cellnum+1)%minefield.area == 1) || (((ccellnum+1)%minefield.area == 1) && (cellnum+1)%minefield.area == 0))) {  //(cellnum%minefield.area === 0 && ccellnum%minefield.area === 1) || (cellnum%minefield.area === 1 && ccellnum%minefield.area === 0)
        return -1 // invalid field
    } else if(pass != true) { // pass to check for mines specifically, ignoring rats and numbers
        for(let i = 1; i <= 9; i++) {
            if(cells[cellnum].classList.contains('cell-sym-' + i)) {
                if(i === 9) {
                    return 2 // rat field
                } else if(i > 0 && i < 9) {
                    return 1 // number field
                }
            }
        }
    } 
    if(minefield.field[row][col] === true) {
        return 3 // mine field
    } else {
        return 0 // else field is empty
    }
}

function checkFieldNumber(row, col) {
    const cellnum = row + col*minefield.area
    
    for(let i = 1; i < 9; i++) {
        if(cells[cellnum].classList.contains('cell-sym-' + i)) {
            return i // return number on field
        }
    }

    return -1 // return -1 incase of error
}

function initMines(row, col) { // initialize mines
    var placemine = [0,0]

    for(let i = 0; i < minefield.mines; i++) {
        placemine[0] = Math.round(Math.random()*(minefield.area-1)) // y location of mine
        placemine[1] = Math.round(Math.random()*(minefield.area-1)) // x location of mine

        if((placemine[0] == col && placemine[1] == row) || minefield.field[placemine[0]][placemine[1]] === true) {
            i-- // count one down to retain correct amount of mines in case of repeat field
        } else if(minefield.field[placemine[0]][placemine[1]] === false) {
            minefield.field[placemine[0]][placemine[1]] = true // place mine into minefield object
        }
    }
}

function uncoverCell(row, col) {
    var minesnearby = 0
    const cellnum = row + col*minefield.area
    const area = checkArea(row, col, true)

    if(minefield.uncovered[col][row] === false) {
        for(let i = 0; i < area.length; i++) {
            if(area[i] == 3) {
                minesnearby++ // count mines in proximity
            }
        }
        if(minesnearby > 0 ) {
            cells[cellnum].classList.add('cell-sym-' + minesnearby) // make number field if mines are nearby
        }
        cells[cellnum].classList.add('uncovered')
        minefield.uncovered[col][row] = true
        minefield.progress[0]++

        if(checkFieldType(row, col) === 0) {
            let arrcount = 0

            for(let i = -1; i < 2; i++) {
                for(let j = -1; j < 2; j++) {
                    if(area[arrcount] != -1 && area[arrcount] != 2) {
                        if(minefield.uncovered[col+i][row+j] === false) {
                            uncoverCell(row+j, col+i)
                        }
                    }
                    arrcount++
                }
            }
        }
    } 

}

function mineHit(row, col) {
    let cellnum = row + col*minefield.area // mark clicked mine
    cells[cellnum].classList.add('cell-sym-0', 'uncovered', 'clicked-mine')
    for(let i = 0; i < minefield.area; i++) {
        for(let j = 0; j < minefield.area; j++) {
            if(minefield.field[i][j] === true) { // find and uncover all mines
                cellnum = i + j*minefield.area
                cells[cellnum].classList.add('cell-sym-0', 'uncovered')
            }
        }
    }
}

function leftClick(row, col) {
    const cellnum = row + col*minefield.area

    switch(cells[cellnum].classList.contains('cell-sym-9') || cells[cellnum].classList.contains('uncovered')) {
        case false:
            if(movecounter == 0) { // if no fields are uncovered initialize mines
                initMines(row, col)
                uncoverCell(row, col)
                writeCookie()
            } else if(minefield.field[row][col] == true) {
                mineHit(row, col) // lose state, mine uncovered
                checkForGameDone(true)
            } else {
                uncoverCell(row, col) // if all went well just uncover cell

                if(checkFieldType(row, col) === 0) { // if uncovered cell is empty uncover cells around it
                    const arr = checkArea(row, col)

                    let arrcount = 0
                    for(let i = -1; i < 2; i++) {
                        for(let j = -1; j < 2; j++) { 
                            if(arr[arrcount] != -1 && arr[arrcount] != 2) {
                                if(arr[arrcount] === 0) {
                                    uncoverCell(row+j, col+i)
                                }
                            }
                            arrcount++
                        }
                    }
                }
                checkForGameDone()
            }
            movecounter++
            break
        }
}

function rightClick(row, col) { // right click to place rat
    const cellnum = row + col*minefield.area

    switch(cells[cellnum].classList.contains('uncovered')) {
        case false:
            cells[cellnum].classList.toggle('cell-sym-9')
            if(minefield.uncovered[col][row] == 'rat') {
                minefield.uncovered[col][row] = false
            } else {
                minefield.uncovered[col][row] = 'rat' // save rat into minefield for persistence
            }
            checkForGameDone()
            break
    }
}

function doubleClick(row, col) { // double click to uncover fields surrounding number fields
    if(checkFieldType(row, col) == 1) {
        const arr = checkArea(row, col)
        let ratsnearby = 0

        // number on number field needs to be present in rats around to uncover nearby fields
        for(let i = 0; i < arr.length; i++) {
            if(arr[i] === 2) {
                ratsnearby++
            }
        }

        if(ratsnearby === checkFieldNumber(row, col)) {
            let arrcount = 0
            for(let i = -1; i < 2; i++) {
                for(let j = -1; j < 2; j++) { // uncover surrounding fields
                    if(arr[arrcount] != -1 && arr[arrcount] != 2) { // if not invalid or rat
                        if(arr[arrcount] === 3) {
                            mineHit(row+j, col+i)
                            checkForGameDone(true)
                        } else {
                            uncoverCell(row+j, col+i)
                        }
                    }
                    arrcount++
                }
            }
            checkForGameDone()
        }
    }
}

function checkForGameDone(hitmine) { // check whether the game is won, if hitmine true game over
    if(minefield.progress[0]+minefield.mines === minefield.progress[1]) {
        writeCookie(true)
        createOverlay('win')
    } else if(hitmine === true) {
        writeCookie(true)
        createOverlay('lose')
    } else {
        writeCookie()
    }
}

function checkExistingGame() {
    
    if(document.cookie != '') {
        const cookie = decodeURIComponent(document.cookie).split(';')
        const size = cookie[0].split('=')
        const field = cookie[1].split('=')[1].split(',')
        const uncovered = cookie[2].split('=')[1].split(',')

        if(size[0].trim() === 'size') {
            for(let i = 0; i < gametypes.length; i++) {
                if(gametypes[i].name == size[1]) {
                    loadGame(gametypes[i])
                    for(let i = 0; i < minefield.field.length; i++) {
                        for(let j = 0; j < minefield.field.length; j++) {
                            if(field[j+i*minefield.area] === 'true') {
                                minefield.field[i][j] = true
                                movecounter = 1
                            }
                        }
                    }
                    for(let i = 0; i < minefield.field.length; i++) {
                        for(let j = 0; j < minefield.field.length; j++) {
                            if(uncovered[j+i*minefield.area] === 'true') {
                                uncoverCell(j, i)
                            } if(uncovered[j+i*minefield.area] === 'rat') {
                                cells[j+i*minefield.area].classList.toggle('cell-sym-9')
                                minefield.uncovered[i][j] = 'rat'
                            }
                        }
                    }
                }
            }
        }
    }
}

function writeCookie(empty) {
    if(empty === true) { // if the cookies should be cleared
        document.cookie = "size=; expires=Thu, 01 Jan 1970 00:00:00 UTC"
        document.cookie = 'field=; expires=Thu, 01 Jan 1970 00:00:00 UTC'
        document.cookie = 'uncovered=; expires=Thu, 01 Jan 1970 00:00:00 UTC'
        minefield.progress[0] = minefield.progress[1]
    } else if(minefield.progress[0] !== minefield.progress[1]) { // as long as the game is not done
        document.cookie = 'size=' + minefield.size
        document.cookie = 'field=' + minefield.field
        document.cookie = 'uncovered=' + minefield.uncovered
    }
}

function createOverlay(state) { // overlay for win/lose situation
    const playfield = document.getElementById('playfield')
    const overlay = document.createElement('div');
    overlay.classList.add('overlay')
    playfield.appendChild(overlay);
    const textfield = document.createElement('p')
    const textsep = document.createElement('br')
    if(state === 'win') {
        var text1 = document.createTextNode("Contratulations!")
        var text2 = document.createTextNode("You've cleared all mines!")
    } else if(state === 'lose') {
        var text1 = document.createTextNode("Oh no!")
        var text2 = document.createTextNode("It seems you've hit a mine!")
    }
    overlay.appendChild(textfield)
    textfield.appendChild(text1)
    textfield.appendChild(textsep)
    textfield.appendChild(text2)
    textfield.classList.add('overlay-box')
}