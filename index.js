const fs = require('fs');
const path = require('path');
const childProcess = require('child_process');

const electron = require('electron');
const csvParser = require('csv-parse/sync');

// Make our config DB work
if (!fs.existsSync("./databases")) fs.mkdirSync("./databases");
const Database = require('./easy-json-database');
const configuration = new Database("./databases/a90-config.json");

const devMode = !electron.app.isPackaged;

// TODO: Make a system tray icon that can be used to close A-90.
let globalWindow = null;
const createWindow = () => {
    const win = new electron.BrowserWindow({
        title: "A-90",
        icon: "assets/icon.png",
        width: 1280,
        height: 720,
        center: true,
        movable: false,
        resizable: false,
        frame: false,
        transparent: true,
        webPreferences: {
            devTools: devMode,
            sandbox: false,
            spellcheck: false,
            preload: path.join(__dirname, 'preload.js')
        }
    });

    win.loadFile('index.html');
    win.maximize();

    if (!devMode) {
        win.removeMenu();
    }

    globalWindow = win;
    return win;
};
const getProcessList = () => {
    // handle this as defined by https://www.pearsonitcertification.com/articles/article.aspx?p=1700427&seqNum=4
    const buffer = childProcess.execSync("wmic process get ProcessID,ExecutablePath /format:csv");
    const formalizedString = buffer.toString().trim().replace(/\r/g, "");

    const parsed = csvParser.parse(formalizedString, { columns: true });
    const processList = parsed
        .filter(program => program.ExecutablePath.trim().length > 0)
        .map(program => ({
            path: program.ExecutablePath.trim().replace(/\\/gi, "/"),
            pid: Number(program.ProcessId)
        }));
    return processList;
};

electron.app.whenReady().then(() => {
    globalWindow = createWindow();
    electron.app.setName('A-90');
    electron.app.setAppUserModelId('com.jeremygamer13.A90');
});
electron.app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        electron.app.quit();
    }
});

electron.ipcMain.handle("quitApp", () => {
    electron.app.quit();
});

electron.ipcMain.handle("started", () => {
    globalWindow.setAlwaysOnTop(true);
    globalWindow.setIgnoreMouseEvents(true);
});
electron.ipcMain.handle("fullscreen", () => {
    globalWindow.setFullScreen(true);
});

// TODO: Allow settings to save, not just excused processes
electron.ipcMain.handle("getActiveProcesses", () => {
    const processes = getProcessList();
    return processes;
});
electron.ipcMain.handle("getSavedProcesses", () => {
    const processes = configuration.get("processList");
    if (!processes) return [];
    if (!Array.isArray(processes)) return [];
    const filtered = processes.filter(execPath => execPath && typeof execPath === "string");
    return filtered;
});
electron.ipcMain.handle("updateSavedProcesses", (_, changedProcesses) => {
    const processes = configuration.get("processList") || [];
    for (const execPath in changedProcesses) {
        const isExcused = String(changedProcesses[execPath]) === "true";
        if (isExcused && processes.includes(execPath)) continue;
        if (!isExcused && !processes.includes(execPath)) continue;

        if (isExcused) {
            processes.push(execPath);
        } else {
            const idx = processes.indexOf(execPath);
            processes.splice(idx, 1);
        }
    }

    configuration.set("processList", processes);
});

electron.ipcMain.handle("killProgram", (_, settings) => {
    const processes = getProcessList();
    const excusedProcesses = configuration.get("processList") || [];
    if (settings.appCloseWindows !== true) return;

    const killable = processes.filter(process => {
        if (excusedProcesses.includes(process.path)) return false;

        // TODO: alot of these checks are dumb, we should probably just use real paths for most, might just be weird since windows can be on any letter drive
        const commandCheck = process.path.toLowerCase();
        if (settings.appCloseAllowSuicide !== true) {
            if (commandCheck.endsWith("electron.exe")) return false;
            if (commandCheck.endsWith("a90.exe")) return false;
            if (commandCheck.endsWith("node.exe")) return false;
        }

        if (settings.appCloseAllowSystem32 !== true) {
            if (commandCheck.includes("system32")) return false;
        }

        if (settings.appCloseAllowWindows !== true) {
            if (commandCheck.includes("windowsapps")) return false;
            if (commandCheck.substring(0, 12).includes("windows")) return false;
        }

        if (settings.appCloseAllowSystemApps !== true) {
            if (commandCheck.includes("systemapps")) return false;
        }

        if (settings.appCloseAllowMicrosoft !== true) {
            if (commandCheck.includes("microsoft")) return false;
        }

        if (settings.appCloseAvoidRecording) {
            if (commandCheck.includes("obs-studio")) return false;
        }
        if (settings.appCloseTargetRoblox) {
            if (!commandCheck.includes("roblox")) return false;
        }

        return true;
    });

    if (killable.length <= 0) return;
    const randomProcess = killable[Math.round(Math.random() * (killable.length - 1))];
    const pid = randomProcess.pid; // getProcessList ensures this is a number

    console.log("Killing process with PID", pid);
    childProcess.execSync(`taskkill /PID ${pid}${settings.appCloseForce ? " /F" : ""}`);
});