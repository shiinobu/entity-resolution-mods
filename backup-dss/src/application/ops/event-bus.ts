export type OpsEventHandler<T> = (event: T) => void;

export class OpsEventBus<Events extends object> {
    private readonly handlers = new Map<string, Set<OpsEventHandler<unknown>>>();

    on<K extends keyof Events & string>(
        name: K,
        handler: OpsEventHandler<Events[K]>,
    ): () => void {
        const handlers = this.handlers.get(name) ?? new Set<OpsEventHandler<unknown>>();
        handlers.add(handler as OpsEventHandler<unknown>);
        this.handlers.set(name, handlers);

        return () => {
            handlers.delete(handler as OpsEventHandler<unknown>);
            if (handlers.size === 0) {
                this.handlers.delete(name);
            }
        };
    }

    emit<K extends keyof Events & string>(name: K, event: Events[K]): void {
        const handlers = this.handlers.get(name);
        if (!handlers) {
            return;
        }

        for (const handler of handlers) {
            handler(event);
        }
    }
}
