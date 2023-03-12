const { ipcRenderer } = require("electron");
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
        ipcRenderer.invoke("programsAttempted").then(ye => {
            if (ye) {
                document.getElementById("deeznutslmao!").remove()
                clearInterval(peepoo)
            }
        })
    }, 500)

    WaitForBegin().then(options => {
        ipcRenderer.invoke("started")
        document.body.innerHTML = ""
        if (options.interval < 0 || options.chance < 0 || options.chance > 100) {
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
                        changeBy += 2
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
        function attackUser() {
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
                        checkDone = true
                        return
                    }
                    if (!checkDone) {
                        if (options.canCloseWindows) {
                            ipcRenderer.invoke("killRandomProgram")
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
            })
        }
        const mouseCursor = {
            x: 0,
            y: 0
        }
        setInterval(() => {
            ipcRenderer.invoke("getMousePos").then(val => {
                UserInteraction.mouse = ((val.x != mouseCursor.x) || (val.y != mouseCursor.y))
                mouseCursor.x = val.x
                mouseCursor.y = val.y
            })
            UserInteraction.keyboard = false // not implemented yet lol!
        }, 20)

        setInterval(() => {
            if (Math.round(Math.random() * 100) >= (100 - options.chance)) {
                attackUser()
            }
        }, options.interval)
        if (options.canCloseWindows) {
            setInterval(() => {
                ipcRenderer.invoke("resetKillablePrograms")
            }, 10000);
        }
    })
})