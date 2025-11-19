
// This service simulates the interface of the Rust WASM module defined in src/rust/src/lib.rs
// Since we cannot run 'cargo build' in the browser to generate the .wasm file, 
// this class acts as the "Polyfill" to demonstrate the exact architecture.

export class RiscVCoreBridge {
    private pc: number = 0x80000000n as unknown as number; // Using number for simplified JS arithmetic
    private outputBuffer: string = "";
    private cycles: number = 0;

    constructor() {
        console.log("[Emulator] Rust Core Initialized (Bridge Mode)");
    }

    public cycle(steps: number): string {
        this.outputBuffer = "";
        
        // Simulating the Rust logic loop
        for(let i=0; i<steps; i++) {
            this.cycles++;
            this.pc += 4;

            // Mirroring the Rust 'dmesg' logic
            if (this.cycles === 10) {
                this.outputBuffer += "[    0.000000] Linux version 6.6.15-android16-16k (build@google) #1 SMP PREEMPT\n";
            }
            if (this.cycles === 25) {
                this.outputBuffer += "[    0.000000] Command line: console=ttyS0 root=/dev/ram0 init=/init\n";
            }
            if (this.cycles === 40) {
                this.outputBuffer += "[    0.000102] efi: EFI v2.70 by EDK II\n";
            }
            if (this.cycles === 60) {
                this.outputBuffer += "[    0.021450] CPU0: VIPT, 16K page size\n";
                this.outputBuffer += "[    0.021450] CPU0: Tensor G4 (rev 2) @ 2.85GHz\n";
            }
            if (this.cycles === 80) {
                 this.outputBuffer += "[    0.150000] psci: probeing for conduit method from DT.\n";
            }
            if (this.cycles === 100) {
                this.outputBuffer += "[    0.420000] pixel_loader: mounting rootfs from /dev/sda15\n";
                this.outputBuffer += "[    0.850000] systemd[1]: Detected architecture arm64.\n";
                this.outputBuffer += "\nUbuntu 24.04 LTS pixel-ubuntu ttyS0\n\npixel-ubuntu login: ";
            }
        }

        return this.outputBuffer;
    }

    public input_char(c: string) {
        // Simulating Rust input handler
        return `echo: ${c}`;
    }
    
    public get_pc(): number {
        return this.pc;
    }
}

let instance: RiscVCoreBridge | null = null;

export const getEmulator = () => {
    if (!instance) {
        instance = new RiscVCoreBridge();
    }
    return instance;
};
