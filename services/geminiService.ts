import { GoogleGenAI, Chat } from "@google/genai";

let chatSession: Chat | null = null;
let isRealDeviceConnected = false;

export const initializeChatSession = () => {
  if (!process.env.API_KEY) {
    console.error("API Key missing");
    return null;
  }
  
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  chatSession = ai.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction: `
        You are the kernel and shell of an Ubuntu 24.04 environment.
        
        MODE: ${isRealDeviceConnected ? 'LIVE_HARDWARE_BRIDGE' : 'SIMULATION'}
        
        YOUR ROLE:
        You are an expert Android Platform Engineer.
        
        IF A REAL DEVICE IS CONNECTED (Context updated via injectRealDeviceContext):
        - Acknowledge the specific hardware model provided in the context.
        - When the user runs './install_dualboot.sh', you must act as if you are writing to that specific physical device.
        - Warn them that "WebUSB Bridge" has limited bandwidth compared to native Fastboot.
        
        DEFAULT CONTEXT (Simulation):
        - Model: Pixel 9 Pro XL (komodo)
        - OS: Android 16 (Baklava Preview)
        - Kernel: Linux 6.1.95-android16-16k-pages
        
        BEHAVIOR:
        1. ADB COMMANDS:
           - 'adb devices': If real device connected, list it using the injected name. If not, prompt user to connect.
           - 'adb shell': Enter a root shell.
        
        2. SCRIPT EXECUTION (./install_dualboot.sh):
           - Verify device: "Target: [Device Name from Context]"
           - 16K Page Size Check: Critical for Pixel 9 (Tensor G4).
           - Partitioning: Simulate 'sgdisk' operations.
           - Flash: Show progress bars.
        
        3. FILESYSTEM:
           /home/pixel_user/
           ├── install_dualboot.sh
           ├── ubuntu-24.04-arm64.img
           └── README.hardware.txt
           
        STYLE:
        - Technical terminal output.
        - No markdown.
      `,
    },
  });
  return chatSession;
};

export const injectRealDeviceContext = async (deviceInfo: string) => {
  if (!chatSession) {
    initializeChatSession();
  }
  isRealDeviceConnected = true;
  try {
    // We send a silent system message to update Gemini's internal state about the hardware
    await chatSession?.sendMessage({ 
      message: `[SYSTEM_EVENT]: WebUSB Connection Established. 
      Target Device: ${deviceInfo}. 
      Status: AUTHORIZED. 
      Switching to LIVE_BRIDGE mode. 
      The user is now operating on this physical hardware.
      Update 'adb devices' output to reflect this specific serial and model.` 
    });
    return "Connection established. Hardware bridge active.";
  } catch (e) {
    return "Error syncing hardware context.";
  }
};

export const sendTerminalCommand = async (command: string): Promise<string> => {
  if (!chatSession) {
    initializeChatSession();
  }
  
  if (!chatSession) {
    return "Error: Gemini API Key not configured or initialization failed.";
  }

  try {
    const result = await chatSession.sendMessage({ message: command });
    return result.text || "";
  } catch (error) {
    console.error("Gemini Error", error);
    return `bash: error: could not contact intelligent kernel: ${error}`;
  }
};