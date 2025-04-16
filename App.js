import { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [ingredients, setIngredients] = useState('');
  const [recipes, setRecipes] = useState([]);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [loading, setLoading] = useState(false);
  const [mealType, setMealType] = useState('');
  const [cuisine, setCuisine] = useState('');
  const [maxReadyTime, setMaxReadyTime] = useState('');
  const [savedRecipes, setSavedRecipes] = useState([]);
  const [showSaved, setShowSaved] = useState(false);

  const API_KEY = process.env.REACT_APP_API_KEY || 'your_api_key_here';

  // Load saved recipes from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('savedRecipes');
    if (saved) {
      setSavedRecipes(JSON.parse(saved));
    }
  }, []);

  const searchRecipes = async () => {
    setLoading(true);
    try {
      const params = {
        query: ingredients,
        apiKey: API_KEY,
        number: 12,
        addRecipeInformation: true,
        ...(mealType && { type: mealType }),
        ...(cuisine && { cuisine }),
        ...(maxReadyTime && { maxReadyTime })
      };

      const response = await axios.get(
        'https://api.spoonacular.com/recipes/complexSearch',
        { params }
      );
      
      setRecipes(response.data.results);
      setShowSaved(false);
    } catch (error) {
      console.error("Error fetching recipes:", error);
    } finally {
      setLoading(false);
    }
  };

  const getRecipeDetails = async (id) => {
    try {
      const response = await axios.get(
        `https://api.spoonacular.com/recipes/${id}/information`,
        { params: { apiKey: API_KEY } }
      );
      setSelectedRecipe(response.data);
    } catch (error) {
      console.error("Error fetching recipe details:", error);
    }
  };

  const saveRecipe = (recipe) => {
    if (!savedRecipes.some(r => r.id === recipe.id)) {
      const updatedSavedRecipes = [...savedRecipes, recipe];
      setSavedRecipes(updatedSavedRecipes);
      localStorage.setItem('savedRecipes', JSON.stringify(updatedSavedRecipes));
    }
  };

  const removeSavedRecipe = (recipeId) => {
    const updatedSavedRecipes = savedRecipes.filter(r => r.id !== recipeId);
    setSavedRecipes(updatedSavedRecipes);
    localStorage.setItem('savedRecipes', JSON.stringify(updatedSavedRecipes));
  };

  const shareRecipe = (recipe) => {
    if (navigator.share) {
      navigator.share({
        title: recipe.title,
        text: `Check out this delicious recipe: ${recipe.title}`,
        url: recipe.sourceUrl || window.location.href,
      })
      .catch(error => console.log('Error sharing:', error));
    } else {
      // Fallback for browsers that don't support the Web Share API
      const shareText = `Check out this recipe: ${recipe.title}\n\n${recipe.sourceUrl || window.location.href}`;
      navigator.clipboard.writeText(shareText)
        .then(() => {
          alert('Recipe link copied to clipboard!');
        })
        .catch(err => {
          console.error('Could not copy text: ', err);
          prompt('Copy this link:', recipe.sourceUrl || window.location.href);
        });
    }
  };

  return (
    <div className="app-container">
      <div className="background-overlay"></div>
      
      <div className="content-wrapper">
        <header className="app-header">
          <h1>Insta<span>Meal</span></h1>
          <p>Discover recipes tailored to your taste</p>
          <button 
            className="saved-recipes-btn"
            onClick={() => setShowSaved(!showSaved)}
          >
            {showSaved ? 'Back to Search' : 'My Saved Recipes'}
          </button>
        </header>

        {!showSaved ? (
          <>
            <div className="search-section">
              <div className="search-box">
                <input
                  type="text"
                  value={ingredients}
                  onChange={(e) => setIngredients(e.target.value)}
                  placeholder="What ingredients do you have?"
                  onKeyPress={(e) => e.key === 'Enter' && searchRecipes()}
                />
                <button onClick={searchRecipes} disabled={loading}>
                  {loading ? (
                    <span className="spinner"></span>
                  ) : (
                    'Find Recipes'
                  )}
                </button>
              </div>

              <div className="filter-row">
                <select value={mealType} onChange={(e) => setMealType(e.target.value)}>
                  <option value="">Any Meal</option>
                  <option value="breakfast">Breakfast</option>
                  <option value="lunch">Lunch</option>
                  <option value="dinner">Dinner</option>
                </select>

                <select value={cuisine} onChange={(e) => setCuisine(e.target.value)}>
                  <option value="">Any Cuisine</option>
                  <option value="indian">Indian</option>
                  <option value="italian">Italian</option>
                  <option value="mexican">Mexican</option>
                  <option value="chinese">Chinese</option>
                </select>

                <select value={maxReadyTime} onChange={(e) => setMaxReadyTime(e.target.value)}>
                  <option value="">Any Time</option>
                  <option value="15">15 mins</option>
                  <option value="30">30 mins</option>
                  <option value="45">45 mins</option>
                  <option value="60">60+ mins</option>
                </select>
              </div>
            </div>

            <div className="recipes-grid">
              {recipes.map((recipe) => (
                <div 
                  key={recipe.id} 
                  className="recipe-card"
                  onClick={() => getRecipeDetails(recipe.id)}
                >
                  <div className="card-image">
                    <img src={recipe.image} alt={recipe.title} />
                    <div className="card-overlay">
                      <h3>{recipe.title}</h3>
                      <div className="card-meta">
                        <span>⏱ {recipe.readyInMinutes} mins</span>
                        <span>🍽 {recipe.servings} servings</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="saved-recipes-section">
            <h2>My Saved Recipes</h2>
            {savedRecipes.length === 0 ? (
              <p className="empty-message">You haven't saved any recipes yet</p>
            ) : (
              <div className="saved-recipes-grid">
                {savedRecipes.map((recipe) => (
                  <div key={recipe.id} className="saved-recipe-card">
                    <img src={recipe.image} alt={recipe.title} />
                    <h3>{recipe.title}</h3>
                    <div className="saved-recipe-actions">
                      <button onClick={() => setSelectedRecipe(recipe)}>
                        View
                      </button>
                      <button 
                        className="remove-btn"
                        onClick={() => removeSavedRecipe(recipe.id)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {selectedRecipe && (
          <div className="recipe-modal">
            <div className="modal-content">
              <button 
                className="close-btn" 
                onClick={() => setSelectedRecipe(null)}
              >
                &times;
              </button>
              
              <button 
                className="share-recipe-btn"
                onClick={() => shareRecipe(selectedRecipe)}
              >
                Share Recipe
              </button>
              
              <button 
                className="save-recipe-btn"
                onClick={() => saveRecipe(selectedRecipe)}
                disabled={savedRecipes.some(r => r.id === selectedRecipe.id)}
              >
                {savedRecipes.some(r => r.id === selectedRecipe.id) 
                  ? '✓ Saved' 
                  : 'Save Recipe'}
              </button>
              
              <div className="modal-header">
                <h2>{selectedRecipe.title}</h2>
                <div className="recipe-stats">
                  <span>⏱ {selectedRecipe.readyInMinutes} mins</span>
                  <span>🍽 {selectedRecipe.servings} servings</span>
                  <span>🔥 {selectedRecipe.healthScore} health score</span>
                </div>
              </div>
              
              <img 
                src={selectedRecipe.image} 
                alt={selectedRecipe.title} 
                className="modal-image"
              />
              
              <div className="modal-body">
                <div className="ingredients-section">
                  <h3>Ingredients</h3>
                  <ul>
                    {selectedRecipe.extendedIngredients?.map((ingredient) => (
                      <li key={ingredient.id}>
                        <span className="ingredient-emoji">
                          {ingredient.name.includes('chicken') ? '🍗' : 
                           ingredient.name.includes('vegetable') ? '🥬' :
                           ingredient.name.includes('spice') ? '🌶' : '🥄'}
                        </span>
                        {ingredient.original}
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className="instructions-section">
                  <h3>Instructions</h3>
                  <div 
                    className="instructions" 
                    dangerouslySetInnerHTML={{ 
                      __html: selectedRecipe.instructions || 
                      "<p>No instructions provided. Check the source website.</p>" 
                    }} 
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;