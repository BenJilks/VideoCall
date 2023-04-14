<script lang="ts" setup>
import type { Ref } from 'vue'
import { connect_remote_stream } from '@/peer_connection'
import { reactive, watch } from 'vue'
import { open_signal_server } from '@/signal_server'

interface Props {
    local_stream: Ref<MediaStream | undefined>,
}

const remote_video_map = reactive(new Map<string, MediaStream>())
const props = defineProps<Props>()

watch(props.local_stream, async () => {
    console.log('got')
    const local_stream = props.local_stream.value!
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
</template>

<style scoped>
.page {
    flex-grow: 1;
    width: 100%;
    height: 0;

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
</style>
