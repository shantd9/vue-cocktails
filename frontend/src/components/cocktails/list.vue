<template>
  <div>
    <h1>Cocktails List</h1>
    <label for="search">Search:</label>
    <input
      type="text"
      id="search"
      v-model="search"
      placeholder="Try a name, ingredient…"
    />
    <div v-if="loading">Loading...</div>
    <div v-else-if="error">{{ error }}</div>
    <div v-else-if="data.length === 0">No cocktails match your search.</div>
    <ul v-else>
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
</template>

<script>
import { ref, watch, onMounted } from 'vue';

export default {
  name: 'CocktailList',
  setup() {
    const data = ref([]);
    const loading = ref(true);
    const error = ref(null);
    const search = ref('');

    const fetchData = async () => {
      loading.value = true;
      error.value = null;
      try {
        const url = new URL('http://localhost:3000/cocktails');
        if (search.value.trim()) {
          url.searchParams.set('q', search.value.trim());
        }
        const response = await fetch(url);
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

    // Debounce
    let debounceTimer;
    watch(search, () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(fetchData, 300);
    });

    onMounted(fetchData);

    return {
      data,
      loading,
      error,
      search,
    };
  },
};
</script>

<style scoped>
/* Add your styles here */
</style>
