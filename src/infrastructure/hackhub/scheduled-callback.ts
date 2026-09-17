import { Scheduler, type ScheduleDelay } from "@hotbunny/hackhub-content-sdk";

export const createScheduledCallback = <TPayload = undefined>(kind: string) => ({
    register: (handler: (payload: TPayload) => void): void => {
        Scheduler.register<TPayload>(kind, handler);
    },
    schedule: (payload: TPayload, delay: ScheduleDelay): string =>
        Scheduler.schedule<TPayload>(kind, payload, delay),
});
