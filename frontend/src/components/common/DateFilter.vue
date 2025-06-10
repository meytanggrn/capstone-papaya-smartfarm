<template>
  <div class="date-filter">
    <input
      type="date"
      id="selectedDate"
      v-model="selectedDate"
      @change="emitDate"
      class="date-input"
    />
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';

export default {
  name: 'DateFilter',
  emits: ['date-changed'], 

  setup(props, { emit }) {
    const selectedDate = ref(null);

    onMounted(() => {
      const today = new Date();
      selectedDate.value = today.toISOString().split('T')[0]; // Set tanggal hari ini sebagai default
      emitDate(); 
    });

    const emitDate = () => {
      emit('date-changed', selectedDate.value);
    };

    return {
      selectedDate,
      emitDate,
    };
  },
};
</script>

<style scoped>
.date-filter {
  display: flex;
  align-items: center;
  gap: 10px;
}

.date-input {
  padding: 8px 12px;
  border: 1px solid #ccc;
  border-radius: 5px;
  font-size: 1rem;
  outline: none;
  transition: border-color 0.3s ease;
}

.date-input:focus {
  border-color: #007bff;
  box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
}
</style>