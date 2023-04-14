<script setup lang="ts">

import {computed} from "vue";

interface Props {
    stream: MediaStream | undefined,
}

const props = defineProps<Props>()
const video_only_stream = computed(() => {
    if (props.stream === undefined) {
        return null
    }

    const stream = props.stream!
    const video_track = stream.getVideoTracks().at(0)
    if (video_track === undefined) {
        return null
    }

    const video_stream = new MediaStream()
    video_stream.addTrack(video_track)
    return video_stream
})

</script>

<template>
    <video ref="local_ref" :srcObject="video_only_stream" id="local" autoplay></video>
</template>

<style scoped>
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
