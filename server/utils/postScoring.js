const calculatePostScore = (post) => {
  // Calculate likes score (1 point per like)
  const likesScore = post.likes.length;
  
  // Calculate comments score (3 points per comment/reply)
  const commentsScore = post.replies.length * 3;
  
  // Calculate recency bonus
  // Posts less than 24 hours old get a bonus that decreases with age
  const postDate = new Date(post.createdAt);
  const now = new Date();
  const postAgeHours = (now - postDate) / (1000 * 60 * 60); // Age in hours
  
  // Recency bonus formula: 
  // - Posts less than 24 hours old get a bonus
  // - The bonus decreases linearly from 5 to 0 as the post ages from 0 to 24 hours
  const recencyBonus = postAgeHours <= 24 ? 5 * (1 - postAgeHours / 24) : 0;
  
  // Calculate total score
  const totalScore = likesScore + commentsScore + recencyBonus;
  
  return totalScore;
};

const sortPostsByScore = (posts) => {
  return posts
    .map(post => ({
      ...post.toObject(),
      _score: calculatePostScore(post)
    }))
    .sort((a, b) => b._score - a._score);
};

module.exports = {
  calculatePostScore,
  sortPostsByScore
}; 