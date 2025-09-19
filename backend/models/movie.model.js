import { Schema, model } from "mongoose";

//creating schema
const schema = new Schema({
  title: { type: String, required: true, unique: true },
  desc: { type: String, required: true },
  watched: { type: Boolean, default: false },
  rating: { type: Number, min: 1, max: 5, default: 0 },
  genre: { type: String, default: "" }
});

//creating model schema
const Movie = model("Movie", schema);

export default Movie;
