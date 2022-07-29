export declare class DataCache {
    fetchDate: Date;
    millisecondsToLive: number;
    fetchFunction: any;
    cache: any;
    constructor(fetchFunction: any, minutesToLive?: number);
    isCacheExpired(): boolean;
    getData(): any;
    resetCache(): void;
}
//# sourceMappingURL=utils.d.ts.map