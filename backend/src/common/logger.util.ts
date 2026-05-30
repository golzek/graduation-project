import { Logger } from '@nestjs/common';

const logger = new Logger('FireAndForget');
export function fireAndForget(promise: Promise<unknown>, context?: string): void {
    promise.catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : String(err);
        logger.warn(`[${context ?? 'unknown'}] ${msg}`);
    });
}