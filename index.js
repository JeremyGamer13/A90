const { app, BrowserWindow, dialog, ipcMain, Tray } = require('electron')
const electron = require('electron')
const path = require('path')

const psnode = require('ps-node')
const findProcess = require('find-process')

function createWindow() {
    const win = new BrowserWindow({
        title: "A-90",
        icon: "icon.png",
        width: 1280,
        height: 720,
        center: true,
        movable: false,
        frame: false,
        alwaysOnTop: true,
        transparent: true,
        webPreferences: {
            devTools: false,
            sandbox: false,
            spellcheck: false,
            preload: path.join(__dirname, 'preload.js')
        }
    })

    win.loadFile('index.html')
    win.maximize()
    win.removeMenu()
    return win
}

let window = null

app.whenReady().then(() => {
    window = createWindow()
    app.___createdWindowForUse = window
    app.setName('A-90')
    app.setAppUserModelId('com.jeremygamer13.A90')

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            window = createWindow()
            app.___createdWindowForUse = window
        }
    })
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

ipcMain.handle("fullscreen", (_, __) => {
    window.setFullScreen(true)
})
ipcMain.handle("quitApp", (_, __) => {
    app.quit()
})
ipcMain.handle("started", (_, __) => {
    window.setIgnoreMouseEvents(true)
})
ipcMain.handle("getMousePos", (_, __) => {
    return electron.screen.getCursorScreenPoint()
})

const killablePrograms = []
let programsAttempted = false

function ResetKillablePrograms() {
    return new Promise((resolve, reject) => {
        psnode.lookup('', (err, programs) => {
            if (err) return reject(err)
            killablePrograms.splice(0, killablePrograms.length)
            for (let i = 0; i < programs.length; i++) {
                const program = programs[i]
                if (String(program.command).toLowerCase().endsWith("electron.exe")) continue // dont kill yourself please
                if (String(program.command).toLowerCase().endsWith("a90.exe")) continue // dont kill yourself please
                if (String(program.command).toLowerCase().endsWith("node.exe")) continue // dont kill yourself please

                if (String(program.command).toLowerCase().includes("system32")) continue // we are evil, not evil enough to kill a system32 process lol!
                if (String(program.command).toLowerCase().includes("windowsapps")) continue // idk what this is
                if (String(program.command).toLowerCase().includes("systemapps")) continue // idk what this is
                if (String(program.command).toLowerCase().includes("microsoft")) continue // idk what this is
                if (String(program.command).toLowerCase().includes("java\\java")) continue // idk what this is
                if (String(program.command).toLowerCase().includes("steamwebhelper")) continue // idk what this is
                if (String(program.command).toLowerCase().substring(0, 12).includes("windows")) continue // idk what this is
                if (String(program.command).substring(1, 3) != ":\\") continue // be safe
                killablePrograms.push(program)
            }
            resolve(killablePrograms)
        })
    })
}

app.on("ready", () => {
    ResetKillablePrograms().then(() => {
        programsAttempted = true
    }).catch(() => {
        programsAttempted = true
        dialog.showMessageBox({ message: "A-90 can't grab your open windows! You are safe for now." })
    })
})
ipcMain.handle("killRandomProgram", (_, __) => {
    const index = Math.round(Math.random() * (killablePrograms.length - 1))
    const program = killablePrograms[index]
    if (!program) return console.log("damn, nothing to kill")
    console.log('DIE', program.command, "!")
    psnode.kill(program.pid, (err) => {
        if (err) {
            if (!(String(err).includes("Kill process timeout"))) killablePrograms.splice(index, 1)
            return
        }
        killablePrograms.splice(index, 1)
    })
})
ipcMain.handle("programsAttempted", (_, __) => {
    return programsAttempted
})
ipcMain.handle("resetKillablePrograms", (_, __) => {
    ResetKillablePrograms()
})