<script lang="ts" setup>
import VideoFeed from '@/components/VideoFeed.vue'
import VideoPreview from '@/components/VideoPreview.vue'
import { computed, ref } from 'vue'
import TopBar from '@/components/TopBar.vue'

export interface Devices {
    video: MediaDeviceInfo[]
    audio: MediaDeviceInfo[]
}

const local_stream = ref<MediaStream>()
const local_audio = ref<MediaStreamTrack>()
const devices = ref<Devices>()

async function discover_devices(): Promise<Devices> {
    const devices: Devices = {
        video: [],
        audio: [],
    }

    for (const device of await navigator.mediaDevices.enumerateDevices()) {
        switch (device.kind) {
            case "videoinput":
                devices.video.push(device)
                break
            case "audioinput":
                devices.audio.push(device)
                break
        }
    }

    return devices
}

async function open_local_stream() {
    devices.value = await discover_devices()
    const stream = await navigator.mediaDevices.getUserMedia({
        video: devices.value.audio.length > 0,
        audio: devices.value.audio.length > 0,
    })

    const audio = stream.getAudioTracks().at(0)
    if (audio != undefined) {
        local_audio.value = audio
    }

    local_stream.value = stream
}

open_local_stream()
</script>

<template>
    <div id="content">
        <TopBar
            :local_audio="local_audio"
            :video_devices="devices?.video"
            :audio_devices="devices?.audio" />
        <VideoFeed :local_stream="computed(() => local_stream)" />
    </div>
    <VideoPreview :stream="local_stream" />
</template>

<style scoped>
#content {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;

    display: flex;
    flex-direction: column;
}
</style>
