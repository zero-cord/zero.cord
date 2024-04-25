import { EventEmitter } from 'events'
import websocket from 'ws'

const gatewayURL = "wss://gateway.discord.gg/?v=10&encoding=json";

interface ClientOptions {
    debug: boolean
}

export enum EnumEvent {
    Raw = 'RAW',
    Ready = 'READY',
    MessageCreate = 'MESSAGE_CREATE',
    GuildCreate = 'GUILD_CREATE',
} 

export default class Client extends EventEmitter {
    private Token: string | null
    private ws: websocket | null
    private loggedIn: boolean
    private _debug: boolean

    constructor({ debug }: ClientOptions) {
        super()

        this.Token = ''
        this.ws = null
        this.loggedIn = false
        this._debug = debug
    }

    setToken(token: string) {
        this.Token = token
    }

    connect() {
        if (!this.Token) throw new Error("Invalid Token")

        this.ws = new websocket(gatewayURL)

        this.ws.on('open', () => {
            console.log("Connected to Discord Gateway!");
        })

        this.ws.on('message', (message: string) => {
            const data = JSON.parse(message);

            console.log(data.op)

            if (data.op == 0) {
                if (data.t == EnumEvent.Ready) {
                    this.emit(EnumEvent.Ready, data.d)
                }

                if (data.t == EnumEvent.MessageCreate) {
                    this.emit(EnumEvent.MessageCreate, data.d)
                }

                if (data.t == EnumEvent.GuildCreate) {
                    this.emit(EnumEvent.GuildCreate, data.d)
                }
            } 

            if (data.op == 9) {

            }

            if (data.op == 10) return this.heartbeat(data, data.d.heartbeat_interval)

            if (data.op == 11) {
                const payload = {
                    op: 2,
                    d: {
                        intents: 3276799,
                        token: this.Token,
                        properties: {
                            "$os": "linux",
                            "browser": "chrome",
                            "device": "chrome"
                        }
                    }
                };

                if (!this.loggedIn) {
                    this.ws?.send(JSON.stringify(payload));

                    this.loggedIn = true
                }
                return
            }

            this.emit(EnumEvent.Raw, data)
        });

        this.ws.on('close', (code, reason: Buffer) => {
            console.log("WebSocket connection closed:", code, reason.toString());
        });

        this.ws.on('error', (error) => {
            console.error("WebSocket error:", error);
        });
    }

    heartbeat(message: any, interval: number) {
        this.sendHeartbeat(message)

        setInterval(() => this.sendHeartbeat(message), interval)
    }

    sendHeartbeat(message: any) {
        if (this._debug) console.log('[DEBUG] Sending heartbeat...')

        this.ws?.send(JSON.stringify({
            op: 1,
            d: message.s
        }))
    }
}