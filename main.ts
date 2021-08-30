let list = 0
let myOnTime = 0
let portAOnTimes = [20, 26, 20, 26, 18, 26, 27, 27] //adjust these
let portBOnTimes = [10, 10, 10, 10, 10, 10, 10, 10] //adjust these

let portATimers = [0, 0, 0, 0, 0, 0, 0, 0]
let portBTimers = [0, 0, 0, 0, 0, 0, 0, 0]
let pauseLength = 0
//let outputBBuffer = 0
let flip = false
let myOnTimer = 0
//let outputABuffer = 0
let outPut = 0
let perxles: neopixel.Strip = null
let midiChannel: midi.MidiController = null
let anOutputIsOn = false
let incrementor = 0
let notes: number[] = []
let chan = 0
let muted = false
let myNote = 0
let bitCheckMask = 0
incrementor = 0
flip = false
pauseLength = 0
serial.redirectToUSB()
myOnTimer = 10

let myPins: number[]
basic.showLeds(`
    . # # # .
    # . . . #
    # . # . #
    # . . . #
    . # # # .
    `)
radio.onReceivedValue(function (name, value) {
    if (!muted) {
        if (name == "Tim") {
            if (value < 16 && value > -1) {
                outPut = value
                handleOutput()
                updateMCP23017()
            }
        } else if (name == "TimP") {
            bitCheckMask = 1
            for (let i = 0; i <= 16 - 1; i++) {
                if (bitCheckMask & value) {
                    outPut = i
                    handleOutput()
                }
                bitCheckMask = bitCheckMask << 1
            }
            updateMCP23017()
        }
    }

    if (name == "m") {
        /*
        Bob 00000001
        Tim 00000010
        Ted 00000100
        Pat 00001000
        Cat 00010000
        Dad 00100000
        Mum 01000000
        Zim 10000000
        */
        if (value & 0b00000010) {
            muted = true
            basic.showIcon(IconNames.No, 1)
        } else if (muted) {
            muted = false
            basic.clearScreen()
        }
    }
})
function handlePinOuts() {
    pins.digitalWritePin(myPins[myNote], 1)
    anOutputIsOn = true
}
function handleNeoPixies() {
    for (let indeks = 0; indeks <= 2; indeks++) {
        perxles.setPixelColor(myNote + indeks, neopixel.colors(NeoPixelColors.Red))
        perxles.show()
    }
}
function sendMidi() {
    midiChannel.noteOn(50 - myNote)
    basic.pause(1)
    led.toggle(0, 0)
    midiChannel.noteOff(50 - myNote)
    basic.pause(1)
}
function handleOutput() {
    if (outPut < 5) {
        led.plot(0, outPut)
        led.plot(1, outPut)
        led.plot(2, outPut)
        led.plot(3, outPut)
        led.plot(4, outPut)
        myOnTimer = input.runningTime() + myOnTime
    } else if (outPut < 10) {
        led.plot(outPut - 5, 0)
        led.plot(outPut - 5, 1)
        led.plot(outPut - 5, 2)
        led.plot(outPut - 5, 3)
        led.plot(outPut - 5, 4)
        myOnTimer = input.runningTime() + myOnTime
    }
    myNote = outPut
    handleMCP23017Out()
}
function makeSomeNoise() {
    notes = [220, 233, 247, 262, 227, 294, 311, 330, 349, 370, 392, 415, 440, 466, 494, 523, 554]
    music.playTone(notes[15 - myNote], music.beat(BeatFraction.Sixteenth))
}
function updateMCP23017() {
    MCP23017.updateOutputAOn(ADDRESS.A20)
    MCP23017.updateOutputBOn(ADDRESS.A20)
}
function handleMCP23017Out() {
    if (myNote < 8) {
        // serial.writeValue("less than 8", myNote)
        MCP23017.setOutputA(myNote)
        portATimers[myNote] = input.runningTime()
    } else {
        // serial.writeValue("more than 8", myNote)
        MCP23017.setOutputB(myNote - 8)
        portBTimers[myNote] = input.runningTime()
    }
}
input.onButtonPressed(Button.A, () => {
    chan += 1
    midiChannel = midi.channel(chan)
})
function handleMCP23017offs() {
    if (outputABuffer > 0) {
        for (let handleMCP23017offsIndexA = 0; handleMCP23017offsIndexA <= 8 - 1; handleMCP23017offsIndexA++) {
            if (input.runningTime() > portATimers[handleMCP23017offsIndexA] + portAOnTimes[handleMCP23017offsIndexA]) {
                MCP23017.clearOutputA(handleMCP23017offsIndexA)
                MCP23017.updateOutputAOn(ADDRESS.A20)
            }
        }
    }
    if (outputBBuffer > 0) {
        for (let handleMCP23017offsIndexB = 0; handleMCP23017offsIndexB <= 8 - 1; handleMCP23017offsIndexB++) {
            if (input.runningTime() > portBTimers[handleMCP23017offsIndexB] + portBOnTimes[handleMCP23017offsIndexB]) {
                MCP23017.clearOutputB(handleMCP23017offsIndexB)
                MCP23017.updateOutputBOn(ADDRESS.A20)
            }
        }
    }
}
function turnOffAllLeds() {
    perxles.clear()
    perxles.show()
}

basic.pause(500)
MCP23017.setPortAsOutput(ADDRESS.A20, SET_PORT.A)
MCP23017.setPortAsOutput(ADDRESS.A20, SET_PORT.B)
myOnTime = 15
myPins = [9, 15, 20, 21, 22, 23]
list = 0
radio.setGroup(83)
music.setTempo(200)
basic.forever(() => {
    if (input.runningTime() > myOnTimer) {
        if (!muted) {
            basic.clearScreen()
        } else {
            basic.showIcon(IconNames.No, 1)
        }
        led.plot(0, 0)
        // turnOffAllLeds()
        for (let offIndex = 0; offIndex <= 6 - 1; offIndex++) {
            pins.digitalWritePin(myPins[offIndex], 0)
        }
        anOutputIsOn = false
    }
})
control.inBackground(() => {
    while (true) {
        handleMCP23017offs()
        basic.pause(1)
    }
})
