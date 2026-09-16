export const DSS_RECON_EVENTS = {
    started: "DSS.Recon.Started",
    sourceStarted: "DSS.Recon.SourceStarted",
    sourceCompleted: "DSS.Recon.SourceCompleted",
    hostDiscovered: "DSS.Recon.HostDiscovered",
    completed: "DSS.Recon.Completed",
    failed: "DSS.Recon.Failed",
} as const;

export const DSS_CAPTURE_EVENTS = {
    started: "DSS.Capture.Started",
    packetCaptured: "DSS.Capture.PacketCaptured",
    completed: "DSS.Capture.Completed",
    failed: "DSS.Capture.Failed",
} as const;

export const DSS_COMMAND_EVENTS = {
    request: "DSS.Command.Request",
    result: "DSS.Command.Result",
} as const;

export const DSS_OPS_EVENTS = {
    recon: DSS_RECON_EVENTS,
    capture: DSS_CAPTURE_EVENTS,
    command: DSS_COMMAND_EVENTS,
} as const;
