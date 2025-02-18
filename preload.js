const path = require("path");
const electron = require("electron");
const iconExtractor = require("icon-extractor");

const { uIOhook } = require('uiohook-napi');

// TODO: Start delay, sensitivity (one for when a-90 will count you as having moved and another in advanced for how quickly inputs are cleared) and A-90 size
// TODO: Add a setting to allow non-letter drive programs to be killed (ie, //?/C:/Program......). At the moment this can still happen.
// TODO: Add settings for shutting down + restarting the PC on attack or even blue screening?
const appSettings = {
    a90AttackInterval: 5000,
    a90AttackChance: 40,
    appDetectMouse: true,
    appDetectKeyboard: true,
    appDetectGamepad: false, // TODO: Gamepad isnt supported yet, the library needs a dynamic import & listening to all gamepads is kinda annoying but works
    appCloseWindows: true,
    appCloseForce: true,
    appCloseTargetRoblox: true,
    appCloseAvoidRecording: true,
    appCloseAllowSystemApps: false,
    appCloseAllowSystem32: false,
    appCloseAllowMicrosoft: false,
    appCloseAllowWindows: false,
    appCloseAllowSuicide: false,
};

// Mouse & Keyboard only work once uIOhook is started
const UserInteraction = {
    mouse: false,
    keyboard: false,
    gamepad: false,
}
uIOhook.on("mousemove", () => {
    if (!appSettings.appDetectMouse) return;
    UserInteraction.mouse = true;
});
uIOhook.on("mousedown", () => {
    if (!appSettings.appDetectMouse) return;
    UserInteraction.mouse = true;
});
uIOhook.on("wheel", () => {
    if (!appSettings.appDetectMouse) return;
    UserInteraction.mouse = true;
});
uIOhook.on('keydown', () => {
    if (!appSettings.appDetectKeyboard) return;
    UserInteraction.keyboard = true;
});
setInterval(() => {
    UserInteraction.mouse = false;
    UserInteraction.keyboard = false;
    UserInteraction.gamepad = false;
}, 25);

const xmlEscape = function (unsafe) {
    return unsafe.replace(/[<>&'"]/g, c => {
        switch (c) {
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '&': return '&amp;';
            case '\'': return '&apos;';
            case '"': return '&quot;';
        }
    });
};
const waitForAudioEnd = (audio) => {
    return new Promise((resolve) => {
        audio.onended = resolve;
    });
};

let canA90AttackUser = true;
const a90Attack = () => {
    if (!canA90AttackUser) return;
    canA90AttackUser = false;

    // reset audio
    const a90JumpscareAudio = new Audio("assets/audio/jumpscare.mp3");
    a90JumpscareAudio.currentTime = 0;
    a90JumpscareAudio.play();

    const a90 = document.createElement("img");
    a90.src = "assets/images/normal.png";
    a90.style.position = "absolute";
    a90.style.width = "15%";
    a90.style.height = "25%";
    a90.style.left = `${(Math.random() * 80) + 10}%`;
    a90.style.top = `${(Math.random() * 80) + 10}%`;
    document.body.append(a90);

    const a90stop = document.createElement("img");
    a90stop.src = "assets/images/stop.png";
    a90stop.style.position = "absolute";
    a90stop.style.width = "15%";
    a90stop.style.height = "25%";
    a90stop.style.left = `calc(50% - (15% / 2))`;
    a90stop.style.top = `calc(50% - (25% / 2))`;
    a90stop.style.display = "none";
    document.body.append(a90stop);

    let moved = false;
    let checkDone = false;
    let shouldKillProgram = false;
    const interval = setInterval(() => {
        if (a90JumpscareAudio.currentTime > 0.52) {
            document.body.style.backgroundColor = "black";
            a90.style.left = `calc(50% - (15% / 2))`;
            a90.style.top = `calc(50% - (25% / 2))`;
        }
        if (a90JumpscareAudio.currentTime > 0.55 && a90JumpscareAudio.currentTime < 1.125) {
            document.body.style.backgroundColor = "rgb(20, 0, 0)";
            a90stop.style.display = "";
        }
        if (a90JumpscareAudio.currentTime > 1.05 && a90JumpscareAudio.currentTime < 1.2) {
            if (UserInteraction.mouse || UserInteraction.keyboard) {
                moved = true;
            }
        }
        if (a90JumpscareAudio.currentTime > 1.125) {
            a90stop.style.display = "none";
        }

        if (a90JumpscareAudio.currentTime > 1.2 && a90JumpscareAudio.currentTime < 1.26) {
            if (!checkDone) {
                if (!moved) {
                    document.body.style.backgroundColor = "transparent";

                    a90.remove();
                    a90stop.remove();
                    a90JumpscareAudio.pause();
                    clearInterval(interval);

                    canA90AttackUser = true;
                    checkDone = true;
                    return;
                } else {
                    if (appSettings.appCloseWindows) {
                        shouldKillProgram = true;
                    }
                    checkDone = true;
                }
            }
        }

        if (a90JumpscareAudio.currentTime > 1.26) {
            a90.style.width = "35%";
            a90.style.height = "55%";
            a90.style.left = `calc((50% - (35% / 2)) + ${Math.round(Math.random() * 3) * 2}px)`;
            a90.style.top = `calc((50% - (55% / 2)) + ${Math.round(Math.random() * 3) * 2}px)`;
            a90.src = "assets/images/attack.png";

            document.body.style.backgroundColor = "red";
        }
        if (a90JumpscareAudio.currentTime > 2.25) {
            a90.style.display = "none";
            document.body.style.backgroundColor = "red";

            if (shouldKillProgram) {
                electron.ipcRenderer.invoke("killProgram", appSettings);
                shouldKillProgram = false;
            }
        }

        if (a90JumpscareAudio.currentTime > 2.3) {
            a90.style.display = "none";
            document.body.style.backgroundColor = "white";
        }
        if (a90JumpscareAudio.currentTime > 2.35) {
            a90.style.display = "none";
            document.body.style.backgroundColor = "transparent";
        }
    }, 5);

    a90JumpscareAudio.onended = () => {
        clearInterval(interval);
        canA90AttackUser = true;
    };
};

const rushJumpscareResize = (rush, size) => {
    rush.style.left = `calc(50% - ${size / 2}%)`
    rush.style.top = `calc(50% - ${(size + (size / 1.5)) / 2}%)`
    rush.style.width = `${size}%`
    rush.style.height = `${size + (size / 1.5)}%`
};
const rushJumpscare = async () => {
    electron.ipcRenderer.invoke("fullscreen");

    // size 1
    const rush = document.createElement("img");
    rush.src = "assets/images/RushNormal.webp";
    rush.style.position = "absolute";
    document.body.append(rush);
    rushJumpscareResize(rush, 15);

    document.body.style.backgroundColor = "black"

    const audio = new Audio("assets/audio/rush_static.mp3");
    audio.play();

    await waitForAudioEnd(audio);

    // size 2
    document.body.style.backgroundColor = "rgb(0, 0, 12)";
    rushJumpscareResize(rush, 20);

    audio.src = "assets/audio/rush_static2.mp3";
    audio.currentTime = 0;
    audio.play();

    await waitForAudioEnd(audio);

    // size 3
    document.body.style.backgroundColor = "rgb(0, 0, 26)"
    rushJumpscareResize(rush, 24);

    audio.src = "assets/audio/rush_static3.mp3";
    audio.currentTime = 0;
    audio.play();

    await waitForAudioEnd(audio);

    // flash
    let size = 24;
    let changeBy = 1;
    rush.src = "assets/images/RushAttack.webp";

    audio.src = "assets/audio/rush_jumpscare.mp3";
    audio.currentTime = 0;
    audio.play();

    setInterval(() => {
        size += changeBy;
        changeBy += 3;

        document.body.style.backgroundColor = `rgb(0, ${(Math.random() * 20) + 30}, ${(Math.random() * 80) + 120})`;

        rush.style.left = `calc((50% - ${size / 2}%) + ${(Math.random() * 16) - 8}px)`;
        rush.style.top = `calc((50% - ${(size + (size / 1.5)) / 2}%) + ${(Math.random() * 16) - 8}px)`;
        rush.style.width = `${size}%`;
        rush.style.height = `${size + (size / 1.5)}%`;
    }, 5);

    await waitForAudioEnd(audio);
    electron.ipcRenderer.invoke("quitApp");
};
const ambushJumpscare = () => {
    electron.ipcRenderer.invoke("fullscreen");

    const audio = new Audio("assets/audio/ambush_jumpscare.mp3");
    audio.play();

    audio.onended = () => {
        electron.ipcRenderer.invoke("quitApp");
    };

    const ambush = document.createElement("img");
    ambush.style.position = "absolute";
    ambush.style.left = "calc(50% - 10%)";
    ambush.style.top = "calc(50% - 20%)";
    ambush.style.width = "20%";
    ambush.style.height = "40%";
    ambush.src = "assets/images/ambush.webp";
    document.body.append(ambush);

    document.body.style.backgroundColor = "black";

    let size = 20;
    let changeBy = 3;
    let switchedYet = false;
    setInterval(() => {
        if (audio.currentTime < 0.25) {
            size = 20;
            document.body.style.backgroundColor = "black";
        }
        if (audio.currentTime > 0.25 && audio.currentTime < 0.5) {
            size = 15;
            document.body.style.backgroundColor = `rgb(0, ${Math.random() * 20}, 0)`;
        }
        if (audio.currentTime > 0.5 && audio.currentTime < 0.7) {
            size = 25;
            document.body.style.backgroundColor = `rgb(0, ${(Math.random() * 60) + 30}, 0)`;
        }
        if (audio.currentTime < 0.7) {
            ambush.style.left = `calc((50% - ${size / 2}%) - ${Math.round(Math.random() * 24)}px)`;
            ambush.style.top = `calc((50% - ${size}%) - ${Math.round(Math.random() * 24)}px)`;
        } else {
            if (switchedYet == false) {
                size = 15;
                switchedYet = true;
            } else {
                size += changeBy;
                changeBy += 4;
            }
            ambush.style.left = `calc(50% - ${size / 2}%)`;
            ambush.style.top = `calc(50% - ${size}%)`;
            document.body.style.backgroundColor = `rgb(0, ${(Math.random() * 80) + 160}, 0)`;
        }
        ambush.style.width = `${size}%`;
        ambush.style.height = `${size * 2}%`;
    }, 10);
};

iconExtractor.emitter.on("icon", (event) => {
    const image = `data:image/png;base64,${event.Base64ImageData}`;
    const element = document.querySelector(`img[data-context=${event.Context}]`);
    if (!element) return;

    element.src = image;
});
const createProcessElement = (executablePath) => {
    const label = document.createElement("label");
    label.classList.add("program");
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    label.appendChild(checkbox);
    const image = document.createElement("img");
    image.src = "assets/images/exe.png";
    image.draggable = false;
    label.appendChild(image);
    const div = document.createElement("div");
    label.appendChild(div);
    const spanExecutable = document.createElement("span");
    const spanPath = document.createElement("span");
    spanExecutable.innerHTML = xmlEscape(path.basename(executablePath));
    spanPath.innerHTML = xmlEscape(executablePath);
    div.appendChild(spanExecutable);
    div.appendChild(spanPath);

    const iconEventId = `img${String(executablePath).toLowerCase().replace(/[^a-z]+/gi, "")}`;
    image.dataset.context = iconEventId;
    iconExtractor.getIcon(iconEventId, executablePath);
    
    return [label, checkbox];
};
const buildProcessList = (activeProcesses, excusedProcesses) => {
    const programList = document.getElementById("app-program-list");
    if (!programList) return;
    if (!programList.parentElement) return;

    // empty the program list
    for (let i = 0; i < programList.children.length; i++) {
        const element = programList.children[i];
        if (String(element.dataset.keepreset) === "true") continue;
        if (!programList.parentElement) continue;
        element.remove();
    }

    const activePaths = activeProcesses.map(process => process.path);
    activePaths.sort((a, b) => path.basename(a).localeCompare(path.basename(b)));
    excusedProcesses.sort((a, b) => path.basename(a).localeCompare(path.basename(b)));

    // TODO: These arent being added in the right order after reloading the list even though everything SHOULD be synchronous. Maybe use flex + order in CSS?
    const uniquePaths = [...new Set([].concat(excusedProcesses, activePaths))];
    for (const executablePath of uniquePaths) {
        if (!programList.parentElement) continue;
        const [process, checkbox] = createProcessElement(executablePath);
        programList.appendChild(process);

        if (excusedProcesses.includes(executablePath)) {
            checkbox.checked = true;
        }
        checkbox.onchange = () => {
            electron.ipcRenderer.invoke("updateSavedProcesses", {
                [executablePath]: checkbox.checked,
            });
        };
    }
};
const refreshProgramList = async () => {
    const settingsArea = document.getElementById("app-settings");
    const loadingScreen = document.getElementById("app-loading-processes");

    loadingScreen.style.display = "";
    settingsArea.style = "display:none";

    const activeProcesses = await electron.ipcRenderer.invoke("getActiveProcesses");
    const excusedProcesses = await electron.ipcRenderer.invoke("getSavedProcesses");
    buildProcessList(activeProcesses, excusedProcesses);
    loadingScreen.style = "display:none";
    settingsArea.style.display = "";
};
const handleMainMenu = async () => {
    const notation = document.getElementById("app-main-page");
    if (!notation) return;

    const mainScreen = document.getElementById("app-main-area");
    const settingsArea = document.getElementById("app-settings");
    const appBackground = document.getElementById("app-background");
    const loadingScreen = document.getElementById("app-loading-processes");

    const programListRefresh = document.getElementById("app-program-list-refresh");
    await refreshProgramList();
    programListRefresh.onclick = () => {
        refreshProgramList();
    };

    const inputA90AttackInterval = document.getElementById("a90-attack-interval");
    const inputA90AttackChance = document.getElementById("a90-attack-chance");
    const inputAppDetectMouse = document.getElementById("app-detect-mouse");
    const inputAppDetectKeyboard = document.getElementById("app-detect-keyboard");
    const inputAppDetectGamepad = document.getElementById("app-detect-gamepad");
    const inputAppCloseWindows = document.getElementById("app-close-windows");
    const inputAppCloseForce = document.getElementById("app-close-force");
    const inputAppCloseTargetRoblox = document.getElementById("app-close-target-roblox");
    const inputAppCloseAvoidRecording = document.getElementById("app-close-avoid-recording");
    const inputAppCloseAllowSystemApps = document.getElementById("app-close-allow-systemapps");
    const inputAppCloseAllowSystem32 = document.getElementById("app-close-allow-system32");
    const inputAppCloseAllowMicrosoft = document.getElementById("app-close-allow-microsoft");
    const inputAppCloseAllowWindows = document.getElementById("app-close-allow-windows");
    const inputAppCloseAllowSuicide = document.getElementById("app-close-allow-suicide");

    const beginButton = document.getElementById("app-begin");
    const quitButton = document.getElementById("app-quit");
    quitButton.onclick = () => {
        electron.ipcRenderer.invoke("quitApp");
    };
    beginButton.onclick = () => {
        appSettings.a90AttackInterval = Number(inputA90AttackInterval.value);
        appSettings.a90AttackChance = Number(inputA90AttackChance.value / 100);
        appSettings.appDetectMouse = inputAppDetectMouse.checked;
        appSettings.appDetectKeyboard = inputAppDetectKeyboard.checked;
        appSettings.appDetectGamepad = inputAppDetectGamepad.checked;
        appSettings.appCloseWindows = inputAppCloseWindows.checked;
        appSettings.appCloseForce = inputAppCloseForce.checked;
        appSettings.appCloseTargetRoblox = inputAppCloseTargetRoblox.checked;
        appSettings.appCloseAvoidRecording = inputAppCloseAvoidRecording.checked;
        appSettings.appCloseAllowSystemApps = inputAppCloseAllowSystemApps.checked;
        appSettings.appCloseAllowSystem32 = inputAppCloseAllowSystem32.checked;
        appSettings.appCloseAllowMicrosoft = inputAppCloseAllowMicrosoft.checked;
        appSettings.appCloseAllowWindows = inputAppCloseAllowWindows.checked;
        appSettings.appCloseAllowSuicide = inputAppCloseAllowSuicide.checked;

        mainScreen.remove();
        appBackground.remove();
        electron.ipcRenderer.invoke("started");
        uIOhook.start();

        // easter eggs
        if (appSettings.a90AttackChance === 0) {
            rushJumpscare();
            return;
        }
        if (appSettings.a90AttackInterval < 0 || appSettings.a90AttackChance < 0 || appSettings.a90AttackChance > 100) {
            ambushJumpscare();
            return;
        }

        setInterval(() => {
            // Math.random() can never return 1, so do this to round it so it can be 1 but not 0
            // we dont want 0 since 100% chance will make 0 > 0 and that is false
            const chance = (Math.round(Math.random() * 99) + 1) / 100;
            if (chance > (1 - appSettings.a90AttackChance)) {
                a90Attack()
            }
        }, appSettings.a90AttackInterval);
    };

    inputAppCloseWindows.onchange = () => {
        if (!inputAppCloseWindows.checked) {
            inputAppCloseTargetRoblox.disabled = true
            inputAppCloseAvoidRecording.disabled = true
            inputAppCloseForce.disabled = true
            inputAppCloseAllowSystemApps.disabled = true
            inputAppCloseAllowSystem32.disabled = true
            inputAppCloseAllowMicrosoft.disabled = true
            inputAppCloseAllowWindows.disabled = true
            inputAppCloseAllowSuicide.disabled = true
        } else {
            inputAppCloseTargetRoblox.disabled = false
            inputAppCloseAvoidRecording.disabled = false
            inputAppCloseForce.disabled = false
            inputAppCloseAllowSystemApps.disabled = false
            inputAppCloseAllowSystem32.disabled = false
            inputAppCloseAllowMicrosoft.disabled = false
            inputAppCloseAllowWindows.disabled = false
            inputAppCloseAllowSuicide.disabled = false
        }
    }
    inputAppCloseTargetRoblox.onchange = () => {
        inputAppCloseWindows.checked = true
    }
    inputAppCloseForce.onchange = () => {
        inputAppCloseWindows.checked = true
    }
    inputAppCloseAllowSystemApps.onchange = () => {
        inputAppCloseWindows.checked = true
    }
    inputAppCloseAllowSystem32.onchange = () => {
        inputAppCloseWindows.checked = true
    }
    inputAppCloseAllowMicrosoft.onchange = () => {
        inputAppCloseWindows.checked = true
    }
    inputAppCloseAllowWindows.onchange = () => {
        inputAppCloseWindows.checked = true
    }
    inputAppCloseAllowSuicide.onchange = () => {
        inputAppCloseWindows.checked = true
    }
};
window.addEventListener("DOMContentLoaded", () => {
    const notationMainMenu = document.getElementById("app-main-page");
    if (notationMainMenu) {
        return handleMainMenu();
    }
})