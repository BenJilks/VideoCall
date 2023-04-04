import type { Message, SignalServer } from "@/signal_server";

const ICE_SERVERS = [
    "stun:stun1.l.google.com:19302",
    "stun:stun2.l.google.com:19302",
]

export async function connect_remote_stream(signal_server: SignalServer,
                                            local_stream: MediaStream,
                                            offer_message: Message): Promise<MediaStream> {
    const remote_stream = new MediaStream()
    const peer_connection = new RTCPeerConnection({
        iceServers: [{urls: ICE_SERVERS}],
        iceCandidatePoolSize: 10,
    })

    create_signal_handler(peer_connection, signal_server, offer_message)
    send_ice_candidates(peer_connection, signal_server, offer_message)
    add_streams(peer_connection, local_stream, remote_stream)

    if (offer_message.type == 'join') {
        await send_offer(peer_connection, signal_server, offer_message)
    } else {
        await respond_to_offer(peer_connection, signal_server, offer_message)
    }

    return remote_stream
}

function create_signal_handler(peer_connection: RTCPeerConnection,
                               signal_server: SignalServer,
                               offer_message: Message) {
    const on_message = signal_server.on(async message => {
        if  (message.from != offer_message.from) {
            return
        }

        switch (message.type) {
            case "answer":
                await accept_answer(peer_connection, signal_server, message)
                break
            case 'ice':
                await add_ice_candidate(peer_connection, message)
                break
            case 'leave':
                peer_connection.close()
                signal_server.remove_on(on_message)
                break
        }
    })
}

function add_streams(peer_connection: RTCPeerConnection,
                     local_stream: MediaStream,
                     remote_stream: MediaStream) {
    for (const track of local_stream.getTracks()) {
        peer_connection.addTrack(track, local_stream)
    }

    peer_connection.addEventListener("track", event => {
        remote_stream.addTrack(event.track)
    })
}

function send_ice_candidates(peer_connection: RTCPeerConnection,
                             signal_server: SignalServer,
                             message: Message) {
    peer_connection.addEventListener("icecandidate", event => {
        if (!event.candidate) {
            return
        }

        signal_server.send({
            type: 'ice',
            content: JSON.stringify(event.candidate),
            from: message.to,
            to: message.from,
        })
    })
}

async function send_offer(peer_connection: RTCPeerConnection,
                            signal_server: SignalServer,
                            join_message: Message) {
    const offer = await peer_connection.createOffer({
        offerToReceiveVideo: true,
    })

    await peer_connection.setLocalDescription(offer)
    signal_server.send({
        type: 'offer',
        content: offer.sdp ?? '',
        to: join_message.from,
        from: join_message.to,
    })
}

async function respond_to_offer(peer_connection: RTCPeerConnection,
                                signal_server: SignalServer,
                                message: Message) {
    await peer_connection.setRemoteDescription(new RTCSessionDescription({
        sdp: message.content,
        type: 'offer',
    }))

    const answer = await peer_connection.createAnswer()
    await peer_connection.setLocalDescription(answer)
    signal_server.send({
        type: 'answer',
        content: answer.sdp ?? '',
        to: message.from,
        from: message.to,
    })
}

async function add_ice_candidate(peer_connection: RTCPeerConnection, message: Message) {
    const candidate: RTCIceCandidate = JSON.parse(message.content)
    await peer_connection.addIceCandidate(candidate)
}

async function accept_answer(peer_connection: RTCPeerConnection,
                             signal_server: SignalServer,
                             message: Message) {
    await peer_connection.setRemoteDescription(new RTCSessionDescription({
        sdp: message.content,
        type: 'answer',
    }))
}
