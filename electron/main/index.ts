import { app, BrowserWindow, shell, ipcMain } from 'electron'
import { release } from 'node:os'
import { join } from 'node:path'

import { emit_osc } from './modules/osc'

import { NLP } from './modules/nlp'

const nlp = new NLP()

// The built directory structure	
//	
// ├─┬ dist-electron	
// │ ├─┬ main	
// │ │ └── index.js    > Electron-Main	
// │ └─┬ preload	
// │   └── index.js    > Preload-Scripts	
// ├─┬ dist	
// │ └── index.html    > Electron-Renderer	
//	
process.env.DIST_ELECTRON = join(__dirname, '..')	
process.env.DIST = join(process.env.DIST_ELECTRON, '../dist')	
process.env.PUBLIC = process.env.VITE_DEV_SERVER_URL	
  ? join(process.env.DIST_ELECTRON, '../public')	
  : process.env.DIST

// Remove electron security warnings
// This warning only shows in development mode
// Read more on https://www.electronjs.org/docs/latest/tutorial/security
// process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true'

// export const ROOT_PATH = {
//   // /dist
//   dist: join(__dirname, '../..'),
//   // /dist or /public
//   public: join(__dirname, app.isPackaged ? '../..' : '../../../public'),
// }

let win: BrowserWindow | null = null
// Here, you can also use other preload
const preload = join(__dirname, '../preload/index.js')
const url = process.env.VITE_DEV_SERVER_URL	
const indexHtml = join(process.env.DIST, 'index.html')

async function createWindow() {
  win = new BrowserWindow({
    title: 'Main window',
    icon: join(process.env.PUBLIC, 'favicon.ico'),
    webPreferences: {
      preload,
      // Warning: Enable nodeIntegration and disable contextIsolation is not secure in production
      // Consider using contextBridge.exposeInMainWorld
      // Read more on https://www.electronjs.org/docs/latest/tutorial/context-isolation
      nodeIntegration: true,
      contextIsolation: true, // was false
    },
  })

  if (process.env.VITE_DEV_SERVER_URL) {
    win.loadURL(url)
    // Open devTool if the app is not packaged
    win.webContents.openDevTools()
  } else {
    
    win.loadFile(indexHtml)
  }

  // Test actively push message to the Electron-Renderer
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', new Date().toLocaleString())
  })

  // Make all links open with the browser, not with the application
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https:')) shell.openExternal(url)
    return { action: 'deny' }
  })
  // win.webContents.on('will-navigate', (event, url) => { }) #344
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  win = null
  if (process.platform !== 'darwin') app.quit()
})

app.on('second-instance', () => {
  if (win) {
    // Focus on the main window if the user tried to open another
    if (win.isMinimized()) win.restore()
    win.focus()
  }
})

app.on('activate', () => {
  const allWindows = BrowserWindow.getAllWindows()
  if (allWindows.length) {
    allWindows[0].focus()
  } else {
    createWindow()
  }
})

// new window example arg: new windows url
ipcMain.handle('open-win', (_, arg) => {
  const childWindow = new BrowserWindow({
    webPreferences: {
      preload,
      nodeIntegration: true,	
      contextIsolation: false,
    },
  })

  if (process.env.VITE_DEV_SERVER_URL) {	
    childWindow.loadURL(`${url}#${arg}`)	
  } else {	
    childWindow.loadFile(indexHtml, { hash: arg })	
  }
})


/*
 * event listeners that listens to the event emitted by Vue component
 */
// event for text typing indicator
ipcMain.on("typing-text-event", (event, args) => {
  emit_osc(['/chatbox/typing', args])
})

// event for sending text
ipcMain.on("send-text-event", (event, args) => {
  emit_osc(['/chatbox/input', args, true])
})

// event for sending custom osc param
ipcMain.on("send-param-event", (event, args) => {
  emit_osc([args.route, args.value], args.ip, args.port)
})


/*
 * websocket control
 */
const WebSocket = require('ws')
const wss = new WebSocket.Server({ port: 8999 })
wss.on('connection', ws => {
  ws.on('message', message => {
    message = JSON.parse(message)

    console.log(`Received message => ${message.type}`)

    if (message.type === 'command') {
      console.log(`Received command: ${message.data}`)
      switch(message.data) {
        case 'stop':
          win.webContents.send('websocket-connect', false)
          break
        case 'speechstart':
          emit_osc(['/chatbox/typing', true])
          break
        case 'speechend':
          emit_osc(['/chatbox/typing', false])
          break
        default:
          break
      }
    } else if (message.type === 'text') {
      win.webContents.send('receive-text-event', JSON.stringify(message.data))
    }
  })
  ws.send('connected to websocket (^・ω・^)')
  win.webContents.send('websocket-connect', true)
})