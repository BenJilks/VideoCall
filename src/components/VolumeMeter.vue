<script setup lang="ts">
import {computed} from "vue";

interface Props {
    label: string,
    audio: MediaStreamTrack | undefined,
}

const props = defineProps<Props>()
const amount = computed(() => {
    if (props.audio == undefined) {
        return 0
    }

    return props.audio
})
</script>

<template>
    <div id="container">
        <text id="label">{{ label }}</text>
        <div id="meter">
            <div id="value"></div>
            <div id="shadow"></div>
        </div>
    </div>
</template>

<style scoped>
#container {
    display: flex;
    gap: 0.5em;
    align-items: center;
}

#meter {
    position: relative;
    height: 0.8em;
    width: 10em;

    background-color: var(--color-background);
    border-radius: 0.2em;
}

#value {
    position: absolute;
    width: v-bind('`${ amount * 100 }%`');
    height: 100%;

    background-color: var(--color-text);
    border-radius: 0.2em;
}

#shadow {
    position: absolute;
    width: 100%;
    height: 100%;

    box-shadow: inset 0 0 0.5em var(--color-background) ;
    border-radius: 0.2em;
}
</style>
