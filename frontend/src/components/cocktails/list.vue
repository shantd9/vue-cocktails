<template>
  <div>
    <h1>Cocktails List</h1>
    <div v-if="loading">Loading...</div>
    <div v-else-if="error">{{ error }}</div>
    <div v-else>
        <label for="search">Search by description:</label>
       <input type="text" id="search" />
      <ul>
        <li v-for="item in data" :key="item.id">
            <router-link
              :to="{ name: 'CocktailDetail', params: { id: item.id } }"
              style="font-weight: bold"
            >
              {{ item.title }}
            </router-link>
            price: {{ item.price }}€
        </li>
      </ul>
    </div>

  </div>
</template>

<script>
import { ref, onMounted } from 'vue';

export default {
  name: 'CocktailList',
  setup() {
    const data = ref([]);
    const loading = ref(true);
    const error = ref(null);

    const fetchData = async () => {
      try {
        const response = await fetch('http://localhost:3000/cocktails');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const jsonData = await response.json();
        data.value = jsonData;
      } catch (err) {
        error.value = err.message;
      } finally {
        loading.value = false;
      }
    };

    onMounted(fetchData);

    return {
      data,
      loading,
      error,
    };
  },
};
</script>

<style scoped>
/* Add your styles here */
</style>
