
export type MessageType = 'offer' | 'answer' | 'ice' | 'join' | 'leave'
export interface Message {
    type: MessageType,
    content: string,
    to: string,
    from: string,
}

export class SignalServer {
    private readonly socket: WebSocket
    private readonly message_queue: Message[]
    private readonly callbacks: ((message: Message) => void)[]

    public constructor(socket: WebSocket) {
        this.message_queue = []
        this.socket = socket
        this.callbacks = []

        this.socket.addEventListener('message', event => {
            const message = JSON.parse(event.data)
            this.handle_message(message)
        })

        this.socket.addEventListener('open', () => {
            for (const message of this.message_queue) {
                this.send(message)
            }
        })

        this.socket.addEventListener('error', error => {
            console.error(error)
        })
    }

    private handle_message(message: Message) {
        console.log(message)
        for (const callback of this.callbacks) {
            callback(message)
        }
    }

    public on(callback: (message: Message) => void): (message: Message) => void {
        this.callbacks.push(callback)
        return callback
    }

    public remove_on(callback: (message: Message) => void) {
        const index = this.callbacks.indexOf(callback)
        if (index != -1) {
            this.callbacks.splice(index)
        }
    }

    public send(message: Message) {
        if (this.socket.readyState != WebSocket.OPEN) {
            this.message_queue.push(message)
        } else {
            this.socket.send(JSON.stringify(message))
        }
    }
}

export function open_signal_server(): SignalServer {
    const address = `ws://${ document.domain }:8080`
    const socket = new WebSocket(address)
    return new SignalServer(socket)
}
