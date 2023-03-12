const { ipcRenderer } = require("electron");
const { uIOhook } = require('uiohook-napi')
const psnode = require('ps-node')

const killablePrograms = []
let programsAttempted = false

function ResetKillablePrograms() {
    return new Promise((resolve, reject) => {
        psnode.lookup({
            command: "([A-Za-z]:\\\\)(?!window)"
        }, (err, programs) => {
            if (err) return reject(err)
            killablePrograms.splice(0, killablePrograms.length)
            for (let i = 0; i < programs.length; i++) {
                const program = programs[i]
                const commandCheck = String(program.command).toLowerCase().replace(/\//gi, "\\")
                if (commandCheck.endsWith("electron.exe")) continue // dont kill yourself please
                if (commandCheck.endsWith("a90.exe")) continue // dont kill yourself please
                if (commandCheck.endsWith("node.exe")) continue // dont kill yourself please

                if (commandCheck.includes("system32")) continue // we are evil, not evil enough to kill a system32 process lol!
                if (commandCheck.includes("windowsapps")) continue // idk what this is
                if (commandCheck.includes("systemapps")) continue // idk what this is
                if (commandCheck.includes("microsoft")) continue // idk what this is
                if (commandCheck.includes("java\\java")) continue // idk what this is
                if (commandCheck.includes("steamwebhelper")) continue // idk what this is
                if (commandCheck.substring(0, 12).includes("windows")) continue // idk what this is

                if (commandCheck.includes("obs-studio")) continue // dont close obs so you can record it (because what else would you record with)
                killablePrograms.push(program)
            }
            console.log(killablePrograms)
            resolve(killablePrograms)
        })
    })
}
function KillRandomProgram() {
    const index = Math.round(Math.random() * (killablePrograms.length - 1))
    const program = killablePrograms[index]
    if (!program) return console.log("damn, nothing to kill")
    console.log('DIE', program.command, "!")
    ipcRenderer.invoke("killProgram", String(program.pid)).then(err => {
        if (err) {
            if (!(String(err).includes("Kill process timeout"))) killablePrograms.splice(index, 1)
            return
        }
        killablePrograms.splice(index, 1)
    })
}

window.addEventListener("DOMContentLoaded", () => {
    function WaitForBegin() {
        return new Promise((resolve, reject) => {
            const beginButton = document.getElementById("Begin")
            beginButton.onclick = () => {
                const options = {}
                options.interval = Number(document.getElementById("AttackInterval").value)
                options.chance = Number(document.getElementById("AttackChance").value)
                options.canCloseWindows = String(document.getElementById("CloseRandomWindow").checked) == "true"
                resolve(options)
            }
        })
    }

    const peepoo = setInterval(() => {
        if (programsAttempted) {
            document.getElementById("deeznutslmao!").remove()
            clearInterval(peepoo)
        }
    }, 500)

    const _cacheAudio = new Audio("jumpscare.mp3") // cache audio so it can load faster maybe

    WaitForBegin().then(options => {
        ipcRenderer.invoke("started")
        document.body.innerHTML = ""
        if (options.chance == 0) { // rush
            ipcRenderer.invoke("fullscreen")
            const rush = document.createElement("img")
            rush.style.position = "absolute"
            let size = 15
            rush.style.left = `calc(50% - ${size / 2}%)`
            rush.style.top = `calc(50% - ${(size + (size / 1.5)) / 2}%)`
            rush.style.width = `${size}%`
            rush.style.height = `${size + (size / 1.5)}%`
            rush.src = "RushNormal.webp"
            document.body.append(rush)
            let changeBy = 1
            document.body.style.backgroundColor = "black"
            const audio = new Audio("rush_static.mp3")
            audio.currentTime = 0
            audio.play()
            audio.onended = () => {
                audio.src = "rush_static2.mp3"
                document.body.style.backgroundColor = "rgb(0, 0, 12)"
                audio.currentTime = 0
                audio.play()
                size = 20
                rush.style.left = `calc(50% - ${size / 2}%)`
                rush.style.top = `calc(50% - ${(size + (size / 1.5)) / 2}%)`
                rush.style.width = `${size}%`
                rush.style.height = `${size + (size / 1.5)}%`
                audio.onended = () => {
                    audio.src = "rush_static3.mp3"
                    document.body.style.backgroundColor = "rgb(0, 0, 26)"
                    audio.currentTime = 0
                    audio.play()
                    size = 24
                    rush.style.left = `calc(50% - ${size / 2}%)`
                    rush.style.top = `calc(50% - ${(size + (size / 1.5)) / 2}%)`
                    rush.style.width = `${size}%`
                    rush.style.height = `${size + (size / 1.5)}%`
                    audio.onended = () => {
                        rush.src = "RushAttack.webp"
                        audio.src = "rush_jumpscare.mp3"
                        audio.currentTime = 0
                        audio.play()
                        setInterval(() => {
                            document.body.style.backgroundColor = `rgb(0, ${(Math.random() * 20) + 30}, ${(Math.random() * 80) + 120})`
                            size += changeBy
                            changeBy += 3
                            rush.style.left = `calc((50% - ${size / 2}%) + ${(Math.random() * 16) - 8}px)`
                            rush.style.top = `calc((50% - ${(size + (size / 1.5)) / 2}%) + ${(Math.random() * 16) - 8}px)`
                            rush.style.width = `${size}%`
                            rush.style.height = `${size + (size / 1.5)}%`
                        }, 5)
                        audio.onended = () => {
                            ipcRenderer.invoke("quitApp")
                        }
                    }
                }
            }
            return
        }
        if (options.interval < 0 || options.chance < 0 || options.chance > 100) { // ambush
            ipcRenderer.invoke("fullscreen")
            const audio = new Audio("ambush_jumpscare.mp3")
            audio.play()
            audio.addEventListener("ended", () => {
                ipcRenderer.invoke("quitApp")
            })
            const ambush = document.createElement("img")
            ambush.style.position = "absolute"
            ambush.style.left = "calc(50% - 10%)"
            ambush.style.top = "calc(50% - 20%)"
            ambush.style.width = "20%"
            ambush.style.height = "40%"
            ambush.src = "ambush.webp"
            document.body.append(ambush)
            let size = 20
            let switchedYet = false
            let changeBy = 3
            document.body.style.backgroundColor = "black"
            setInterval(() => {
                if (audio.currentTime < 0.25) {
                    size = 20
                    document.body.style.backgroundColor = "black"
                }
                if (audio.currentTime > 0.25 && audio.currentTime < 0.5) {
                    size = 15
                    document.body.style.backgroundColor = `rgb(0, ${Math.random() * 20}, 0)`
                }
                if (audio.currentTime > 0.5 && audio.currentTime < 0.7) {
                    size = 25
                    document.body.style.backgroundColor = `rgb(0, ${(Math.random() * 60) + 30}, 0)`
                }
                if (audio.currentTime < 0.7) {
                    ambush.style.left = `calc((50% - ${size / 2}%) - ${Math.round(Math.random() * 24)}px)`
                    ambush.style.top = `calc((50% - ${size}%) - ${Math.round(Math.random() * 24)}px)`
                } else {
                    if (switchedYet == false) {
                        size = 15
                        switchedYet = true
                    } else {
                        size += changeBy
                        changeBy += 4
                    }
                    ambush.style.left = `calc(50% - ${size / 2}%)`
                    ambush.style.top = `calc(50% - ${size}%)`
                    document.body.style.backgroundColor = `rgb(0, ${(Math.random() * 80) + 160}, 0)`
                }
                ambush.style.width = `${size}%`
                ambush.style.height = `${size * 2}%`
            }, 10)
            return
        }

        const UserInteraction = {
            mouse: false,
            keyboard: false,
        }
        uIOhook.on("mousemove", () => {
            UserInteraction.mouse = true
        })
        uIOhook.on("mousedown", () => {
            UserInteraction.mouse = true
        })
        uIOhook.on("wheel", () => {
            UserInteraction.mouse = true
        })
        uIOhook.on('keydown', () => {
            UserInteraction.keyboard = true
        })
        setInterval(() => {
            UserInteraction.mouse = false
            UserInteraction.keyboard = false
        }, 20)

        uIOhook.start()

        let canAttackUser = true
        function attackUser() {
            if (!canAttackUser) return
            canAttackUser = false
            const audio = new Audio("jumpscare.mp3")
            audio.play()
            const a90 = document.createElement("img")
            a90.src = "normal.png"
            a90.style.position = "absolute"
            a90.style.width = "15%"
            a90.style.height = "25%"
            a90.style.left = `${(Math.random() * 80) + 10}%`
            a90.style.top = `${(Math.random() * 80) + 10}%`
            document.body.append(a90)
            const a90stop = document.createElement("img")
            a90stop.src = "icon.png"
            a90stop.style.position = "absolute"
            a90stop.style.width = "15%"
            a90stop.style.height = "25%"
            a90stop.style.left = `calc(50% - (15% / 2))`
            a90stop.style.top = `calc(50% - (25% / 2))`
            a90stop.style.display = "none"
            document.body.append(a90stop)
            let moved = false
            let checkDone = false
            let shouldKillProgram = false
            const interval = setInterval(() => {
                if (audio.currentTime > 0.52) {
                    document.body.style.backgroundColor = "black"
                    a90.style.left = `calc(50% - (15% / 2))`
                    a90.style.top = `calc(50% - (25% / 2))`
                }
                if (audio.currentTime > 0.55 && audio.currentTime < 1.125) {
                    document.body.style.backgroundColor = "rgb(20, 0, 0)"
                    a90stop.style.display = ""
                }
                if (audio.currentTime > 0.55 && audio.currentTime < 1.2) {
                    if (UserInteraction.mouse || UserInteraction.keyboard) {
                        moved = true
                    }
                }
                if (audio.currentTime > 1.125) {
                    a90stop.style.display = "none"
                }
                if (audio.currentTime > 1.2 && audio.currentTime < 1.26) {
                    if ((!checkDone) && (!moved)) {
                        document.body.style.backgroundColor = "transparent"
                        audio.pause()
                        a90.remove()
                        a90stop.remove()
                        clearInterval(interval)
                        canAttackUser = true
                        checkDone = true
                        return
                    }
                    if (!checkDone) {
                        if (options.canCloseWindows) {
                            shouldKillProgram = true
                        }
                        checkDone = true
                    }
                }
                if (audio.currentTime > 1.26) {
                    a90.style.width = "35%"
                    a90.style.height = "55%"
                    a90.style.left = `calc((50% - (35% / 2)) + ${Math.round(Math.random() * 3) * 2}px)`
                    a90.style.top = `calc((50% - (55% / 2)) + ${Math.round(Math.random() * 3) * 2}px)`
                    a90.src = "attack.png"
                    document.body.style.backgroundColor = "red"
                }
                if (audio.currentTime > 2.25) {
                    a90.style.display = "none"
                    document.body.style.backgroundColor = "red"
                    if (shouldKillProgram) {
                        if (options.canCloseWindows) {
                            KillRandomProgram()
                        }
                        shouldKillProgram = false
                    }
                }
                if (audio.currentTime > 2.3) {
                    a90.style.display = "none"
                    document.body.style.backgroundColor = "white"
                }
                if (audio.currentTime > 2.35) {
                    a90.style.display = "none"
                    document.body.style.backgroundColor = "transparent"
                }
            }, 5)
            audio.addEventListener("ended", () => {
                clearInterval(interval)
                canAttackUser = true
            })
        }

        setInterval(() => {
            if ((Math.round(Math.random() * 99) + 1) > (100 - options.chance)) {
                attackUser()
            }
        }, options.interval)
    })
})

window.addEventListener("DOMContentLoaded", () => {
    ResetKillablePrograms().then(() => {
        programsAttempted = true
    }).catch(() => {
        programsAttempted = true
    })
})