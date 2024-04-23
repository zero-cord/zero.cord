import { EventEmitter } from 'events'
import websocket from 'ws'

const gatewayURL = "wss://gateway.discord.gg/?v=10&encoding=json";

export default class Client extends EventEmitter {
    private Token: string | null
    private ws: websocket | null

    constructor() {
        super()

        this.Token = ''
        this.ws = null
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

                this.ws?.send(JSON.stringify(payload));
                return
            }

            this.emit('raw', data)
        });

        this.ws.on('close', (code, reason: Buffer) => {
            console.log("WebSocket connection closed:", code, reason.toString());
        });

        this.ws.on('error', (error) => {
            console.error("WebSocket error:", error);
        });
    }

    heartbeat(message: any, interval: number) {
        this.ws?.send(JSON.stringify({
            op: 1,
            d: message.s
        }))

        setInterval(() => {
            this.ws?.send(JSON.stringify({
                op: 1,
                d: message.s
            }))
        }, interval)
    }
}