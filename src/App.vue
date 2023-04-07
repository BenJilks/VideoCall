<script lang="ts" setup>
import { connect_remote_stream } from '@/peer_connection'
import { onMounted, reactive, ref } from 'vue'
import { open_signal_server } from '@/signal_server'

const local_ref = ref<HTMLVideoElement>()
const remote_video_map = reactive(new Map<string, MediaStream>())

async function open_stream(): Promise<MediaStream> {
    const local_stream = await navigator.mediaDevices.getUserMedia({video: true})
    const signal_server = await open_signal_server()
    signal_server.on(async message => {
        switch (message.type) {
            case 'offer':
            case 'join':
                remote_video_map.set(message.from,
                    await connect_remote_stream(signal_server, local_stream, message))
                break

            case 'leave':
                remote_video_map.delete(message.from)
                break
        }
    })

    return local_stream
}

onMounted(async () => {
    local_ref.value!.srcObject = await open_stream()
})
</script>

<template>
    <div ref="page_ref" class="page">
        <video v-for="(video, id) in remote_video_map.values()"
               :key="id"
               :srcObject="video"
               class="remote"
               autoplay>
        </video>
    </div>
    <video ref="local_ref" id="local" autoplay></video>
</template>

<style scoped>
.page {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;

    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(50vmin, 1fr));
    grid-auto-rows: minmax(0px, 1fr);
    grid-auto-flow: row;
    gap: 0.5em;

    background-color: var(--color-background);
}

.remote {
    width: 100%;
    height: 100%;
    object-fit: contain;
}

#local {
    position: fixed;
    height: 20%;
    width: auto;

    right: 1em;
    bottom: 1em;
    box-shadow:
            0 0.2em 0.5em 0 rgba(0, 0, 0, 0.2),
            0 0.5em 1.5em 0 rgba(0, 0, 0, 0.19);
    border-radius: 1em;
    opacity: 0.9;
}
</style>
