<template>
  <div>
    <router-link to="/">Back to cocktails</router-link>
    <p v-if="loading">Loading...</p>
    <p v-else-if="error" role="alert">{{ error }}</p>
    <article v-else>
      <h1>{{ cocktail.title }}</h1>
      <p>{{ cocktail.description }}</p>
      <p>Price: {{ cocktail.price }}€</p>
    </article>
  </div>
</template>

<script>
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';

export default {
  name: 'CocktailDetail',
  setup() {
    const route = useRoute();
    const cocktail = ref({});
    const loading = ref(true);
    const error = ref(null);

    const fetchCocktail = async () => {
      try {
        const response = await fetch(
          `http://localhost:3000/cocktails/${route.params.id}`
        );

        if (!response.ok) {
          throw new Error(
            response.status === 404
              ? 'Cocktail not found.'
              : `Unable to load cocktail (${response.status}).`
          );
        }

        cocktail.value = await response.json();
      } catch (err) {
        error.value = err.message;
      } finally {
        loading.value = false;
      }
    };

    onMounted(fetchCocktail);

    return {
      cocktail,
      loading,
      error,
    };
  },
};
</script>
