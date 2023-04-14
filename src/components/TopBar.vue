<script setup lang="ts">
import VolumeMeter from '@/components/VolumeMeter.vue'
import type { Devices } from '@/App.vue'
import { ref } from 'vue'

interface Props {
    local_audio: MediaStreamTrack | undefined,
    video_devices: MediaDeviceInfo[] | undefined,
    audio_devices: MediaDeviceInfo[] | undefined,
}

const video_select = ref<HTMLSelectElement>()
const audio_select = ref<HTMLSelectElement>()
const props = defineProps<Props>()

function on_video_device_selected() {
    const index = video_select.value?.selectedIndex ?? -1
    const video_device = props.video_devices?.at(index)
    if (!video_device) {
        return
    }

    console.log(video_device.label)
}

function on_audio_device_selected() {
    const index = audio_select.value?.selectedIndex ?? -1
    const audio_device = props.audio_devices?.at(index)
    if (!audio_device) {
        return
    }

    console.log(audio_device.label)
}

</script>

<template>
    <div id="bar">
        <select ref="video_select" @change="on_video_device_selected">
            <option
                    v-for="device in video_devices ?? []"
                    :key="device.deviceId">
                {{ device.label }}
            </option>
        </select>

        <select ref="audio_select" @change="on_audio_device_selected">
            <option
                    v-for="device in audio_devices ?? []"
                    :key="device.deviceId">
                {{ device.label }}
            </option>
        </select>

        <VolumeMeter label="You" :audio="local_audio" />
    </div>
</template>

<style scoped>
#bar {
    display: flex;
    padding: 0.5em 1em;
    gap: 1em;
    align-items: center;

    width: 100%;
    height: 3em;
    background-color: var(--color-background-mute);
}
</style>
