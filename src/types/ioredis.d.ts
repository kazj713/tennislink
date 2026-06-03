declare module 'ioredis' {
  interface RedisOptions {
    host?: string;
    port?: number;
    password?: string;
    db?: number;
    [key: string]: any;
  }

  class Redis {
    constructor(url: string, options?: RedisOptions);
    constructor(port?: number, host?: string, options?: RedisOptions);
    constructor(options?: RedisOptions);

    get(key: string): Promise<string | null>;
    set(key: string, value: string, ...args: any[]): Promise<string | null>;
    del(...keys: string[]): Promise<number>;
    exists(...keys: string[]): Promise<number>;
    expire(key: string, seconds: number): Promise<number>;
    ttl(key: string): Promise<number>;
    keys(pattern: string): Promise<string[]>;
    hget(key: string, field: string): Promise<string | null>;
    hset(key: string, field: string, value: string): Promise<number>;
    hdel(key: string, ...fields: string[]): Promise<number>;
    hmset(key: string, data: Record<string, string>): Promise<string>;
    hgetall(key: string): Promise<Record<string, string>>;
    incr(key: string): Promise<number>;
    decr(key: string): Promise<number>;
    incrby(key: string, value: number): Promise<number>;
    decrby(key: string, value: number): Promise<number>;
    setex(key: string, seconds: number, value: string): Promise<string>;
    flushdb(): Promise<void>;
    info(section?: string): Promise<string>;
    dbsize(): Promise<number>;

    on(event: string, callback: (...args: any[]) => void): this;
    disconnect(): void;
    quit(): Promise<void>;
  }

  export default Redis;
}
