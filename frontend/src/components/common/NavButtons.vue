<template>
    <div class="nav-buttons">
        <button v-for="nav in navOptions" :key="nav.value" @click="selectNav(nav.value)"
            :class="{ active: selectedNav === nav.value }" class="nav-button">
            {{ nav.label }}
        </button>
    </div>
</template>

<script>
export default {
    name: 'NavButtons',
    data() {
        return {
            selectedNav: 'cahaya', 
            navOptions: [
                { label: 'Intensitas Cahaya', value: 'cahaya' }, 
                { label: 'Suhu', value: 'suhu' },
                { label: 'Kelembaban Udara', value: 'kelembaban' }, 
                { label: 'pH Tanah', value: 'pH' },
                { label: 'Prediksi Panen', value: 'prediksi-panen' },
            ],
        };
    },
    methods: {
        selectNav(navType) {
            this.selectedNav = navType;
            this.$emit('nav-selected', navType);
        },
    },
    mounted() {
        this.$emit('nav-selected', this.selectedNav);
    }
};
</script>

<style scoped>
.nav-buttons {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
}
.nav-button {
    padding: 10px 15px;
    border: 1px solid #FFD180; 
    border-radius: 5px;
    background-color: #fff; 
    color: #A0522D; 
    font-size: 1rem;
    cursor: pointer;
    transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease;
}

.nav-button:hover {
    background-color: #FFF8DC; 
    border-color: #FFA000; 
    color: #A0522D; 
}

.nav-button.active {
    background-color: #FFA000; 
    color: #fff; 
    border-color: #8BC34A; 
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1); 
}

.nav-button:active {
    transform: translateY(1px);
}

</style>