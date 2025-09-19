// Simple recommendation logic: returns movies whose title or desc matches user query (case-insensitive)
export const MovieRecommend = async (req, res) => {
  const { message } = req.body;
  if (!message || typeof message !== "string") {
    return res.status(400).json({ msg: "Missing or invalid message" });
  }
  try {
    // Lowercase message for easier matching
    const msg = message.toLowerCase();
    let filter = {};

    // Genre detection
    const genres = ["action", "comedy", "drama", "thriller", "romance", "sci-fi", "horror", "animation", "adventure", "fantasy", "crime", "mystery", "family"];
    const foundGenre = genres.find(g => msg.includes(g));
    if (foundGenre) filter.genre = new RegExp(foundGenre, "i");

    // Watched/unwatched detection
    if (msg.includes("unwatched") || msg.includes("not watched")) filter.watched = false;
    else if (msg.includes("watched")) filter.watched = true;

    // Rating detection
    const ratingMatch = msg.match(/(\d(\.\d)?)[- ]?star/);
    if (ratingMatch) filter.rating = { $gte: Number(ratingMatch[1]) };
    else if (msg.includes("top rated") || msg.includes("best")) filter.rating = { $gte: 4 };

    // Fallback: keyword search in title/desc
    if (Object.keys(filter).length === 0) {
      const regex = new RegExp(msg.split(/\s+/).join("|"), "i");
      filter.$or = [
        { title: { $regex: regex } },
        { desc: { $regex: regex } }
      ];
    }

    const movies = await Movie.find(filter).sort({ rating: -1 });
    if (movies.length === 0) {
      return res.json({ reply: "Sorry, I couldn't find any matching movies. Try another genre, rating, or keyword!", movies: [] });
    }
    return res.json({
      reply: `Here are some movies you might like${foundGenre ? ` in ${foundGenre}` : ""}:`,
      movies: movies.map(m => ({ title: m.title, desc: m.desc, genre: m.genre, rating: m.rating, watched: m.watched }))
    });
  } catch (error) {
    return res.status(500).json({ msg: error.message });
  }
};
import Movie from "../models/movie.model.js";
//Creating controller to manage file structure and better readablity
export const MovieCreate = async (req, res) => {
  const newMovie = new Movie({
    title: req.body.title,
    desc: req.body.desc,
    watched: req.body.watched ?? false,
    rating: req.body.rating ?? 0,
    genre: req.body.genre ?? ""
  });
  try {
    const movie = await newMovie.save();
    return res.status(201).json(movie);
  } catch (error) {
    return res.status(400).json({ msg: error.message });
  }
};
export const MovieIndex = async (req, res) => {
  try {
    const { search, genre, watched, sort, rating } = req.query;
    let filter = {};
    if (search) {
      const regex = new RegExp(search, "i");
      filter.$or = [
        { title: { $regex: regex } },
        { desc: { $regex: regex } }
      ];
    }
    if (genre) filter.genre = genre;
    if (watched !== undefined) filter.watched = watched === "true";
    if (rating) filter.rating = Number(rating);

    let query = Movie.find(filter);
    if (sort) {
      // sort can be 'title', '-title', 'rating', '-rating', 'watched', '-watched'
      const sortObj = {};
      const fields = sort.split(",");
      fields.forEach(f => {
        if (f.startsWith("-")) sortObj[f.slice(1)] = -1;
        else sortObj[f] = 1;
      });
      query = query.sort(sortObj);
    }
    const movies = await query;
    res.json(movies);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const MovieDetail = async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id);
    movie
      ? res.json(movie)
      : res.status(404).json({ message: "cannot find movie" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
export const MovieUpdate = async (req, res) => {
  try {
    const updateFields = {
      title: req.body.title,
      desc: req.body.desc,
      watched: req.body.watched,
      rating: req.body.rating,
      genre: req.body.genre
    };
    // Remove undefined fields
    Object.keys(updateFields).forEach(key => updateFields[key] === undefined && delete updateFields[key]);
    const result = await Movie.findOneAndUpdate(
      { _id: req.params.id },
      updateFields,
      { new: true }
    );
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Movie stats endpoint
export const MovieStats = async (req, res) => {
  try {
    const total = await Movie.countDocuments();
    const watched = await Movie.countDocuments({ watched: true });
    const unwatched = total - watched;
    res.json({ total, watched, unwatched });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
export const MovieDelete = async (req, res) => {
  const movieId = req.params.id;

  try {
    await Movie.deleteOne({ _id: movieId });
    res.json({ message: "Movie deleted.." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
