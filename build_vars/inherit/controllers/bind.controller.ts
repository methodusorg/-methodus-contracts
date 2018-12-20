import { Method, MessageConfig, MethodResult, MessageHandler } from '@methodus/server';

@MessageConfig('Bind')
export class Bind {
    @MessageHandler('head', 'exchange')
    public async Headers(): Promise<MethodResult> {
        return new MethodResult({});
    }
}
