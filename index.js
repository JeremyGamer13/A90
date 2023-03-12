const { app, BrowserWindow, dialog, ipcMain, Tray } = require('electron')
const electron = require('electron')
const path = require('path')
const psnode = require('ps-node')

const IsDeveloperMode = false

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
            devTools: IsDeveloperMode,
            sandbox: false,
            spellcheck: false,
            preload: path.join(__dirname, 'preload.js')
        }
    })

    win.loadFile('index.html')
    win.maximize()
    if (!IsDeveloperMode) win.removeMenu()
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
ipcMain.handle("killProgram", (_, pid) => {
    return new Promise((resolve, reject) => {
        psnode.kill(pid, {
            timeout: 1,
        }, err => {
            resolve(err)
        })
    })
})