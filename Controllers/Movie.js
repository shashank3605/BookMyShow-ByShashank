const Movie = require("../Models/Movie");
// const Vanue = require("../Models/Venue");
const ShowTime = require("../Models/ShowTime");
const { uploadImageToCloudinary } = require("../Utility/Utility");

exports.getAllMovie = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    const offset = parseInt(req.query.offset) || 0;

    const { name, description, duration, sort } = req.query;

    const filter = {};
    if (name) filter.title = { $regex: name, $options: "i" };
    if (description)
      filter.description = { $regex: description, $options: "i" };
    if (duration) filter.duration = Number(duration);

    const sortOrder = sort === "desc" ? -1 : 1;

    const totalMovie = await Movie.countDocuments(filter);

    const movies = await Movie.find(filter)
      .sort({ title: sortOrder })
      .skip(offset)
      .limit(limit)
      .lean();

    let nextOffset = offset + limit;
    if (nextOffset >= totalMovie) nextOffset = -1;

    return res.status(200).json({
      success: true,
      movies,
      total_movies: totalMovie,
      next_offset: nextOffset,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "Failed to fetch movies",
      details: error.message,
    });
  }
};

exports.createMovie = async (req, res) => {
  try {
    // Extract data from request body
    const { title, description, duration, poster } = req.body;

    // Inline validation
    if (!title || !description || !duration) {
      return res.status(400).json({ error: " Kindly fill the required data." });
    }

    // Check if the user is an admin
    console.log(req.user);
    if (!req.user || !req.user.isAdmin) {
      return res
        .status(401)
        .json({ error: "Unauthorized, admin access required" });
    }

    // Create and save the movie
    const movie = new Movie({ title, description, duration, poster });
    await movie.save();

    // Respond with the created movie
    res.status(201).json({
      message: "Movie created successfully",
      movie,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getMovieById = async (req, res) => {
  try {
    // Get the movie ID from the request parameters
    const movieId = req.params.id;

    // Find the movie by ID and populate its related venues (assuming you have a "venues" field in your schema)
    const movie = await Movie.findById(movieId)
      .populate("venue")
      .populate("showTime");

    // If no movie is found, return a 404 error
    if (!movie) {
      return res.status(404).json({ error: "Movie not found" });
    }

    // Return the movie data along with its venues
    res.status(200).json({ movie });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// const Movie = require("../Models/Movie");
const Venue = require("../Models/Venue");

exports.addVenuesToMovie = async (req, res) => {
  try {
    const { movieId } = req.params;
    const { venueIds } = req.body;

    console.log("movieId", movieId);

    if (!Array.isArray(venueIds) || venueIds.length === 0) {
      return res
        .status(400)
        .json({ error: "venueIds must be a non-empty array" });
    }
    if (!req.user || !req.user.isAdmin) {
      return res
        .status(401)
        .json({ error: "Unauthorized, admin access required" });
    }

    // update movie side
    const movie = await Movie.findByIdAndUpdate(
      movieId,
      { $addToSet: { venue: { $each: venueIds } } },
      { new: true }
    );

    if (!movie) return res.status(404).json({ error: "Movie not found" });

    // sync venue side too (recommended)
    await Venue.updateMany(
      { _id: { $in: venueIds } },
      { $addToSet: { Movie: movieId } }
    );

    return res.status(200).json({ success: true, movie });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// exports.getVenuesByMovieID = async (req, res) => {
//   try {
//     // Get the movie ID from the request parameters
//     const movieId = req.params.id;
//     console.log(movieId);

//     // Find all showtimes for this movie and populate the associated venue and movie

//     const showTimes = await ShowTime.find({ movie: movieId })
//       .populate("venue")
//       .populate("movie");

//     // If no showtimes are found, return a 404 error
//     if (!showTimes.length) {
//       return res
//         .status(404)
//         .json({ error: "No showtimes found for this movie" });
//     }

//     // Create a map to group venues by their ID and collect showtimes for each venue
//     const venueMap = new Map();

//     showTimes.forEach((showTime) => {
//       const venueId = showTime.venue._id.toString();

//       if (!venueMap.has(venueId)) {
//         // If venue doesn't exist in the map, add it
//         venueMap.set(venueId, {
//           id: showTime.venue._id,
//           name: showTime.venue.name,
//           location: showTime.venue.location,
//           movie_name: showTime.movie.title,
//           show_times: [showTime.timing],
//         });
//       } else {
//         // If venue already exists, just add the new showtime to its show_times array
//         venueMap.get(venueId).show_times.push(showTime.timing);
//       }
//     });

//     // Convert the map values to an array
//     const venues = Array.from(venueMap.values());

//     // Return the list of venues with showtimes
//     res.status(200).json({ venues });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };

exports.uploadMoviePoster = async (req, res) => {
  try {
    // 1. Authorization check (admin only)
    if (!req.user || !req.user.isAdmin) {
      return res.status(401).json({
        error: "Unauthorized, admin access required",
      });
    }

    // 2. Check if file exists
    if (!req.files || !req.files.image) {
      return res.status(400).json({
        error: "No file uploaded under 'poster' key",
      });
    }

    const file = req.files.image;

    // 3. Upload file and get URL
    const uploadResponse = await uploadImageToCloudinary(
      file,
      "BookMyShow/Movie",
      500,
      80
    );

    // 4. Get movie ID from URL params
    const movieId = req.params.id;

    // 5. Find movie
    const movie = await Movie.findById(movieId);
    if (!movie) {
      return res.status(404).json({
        error: "Movie not found",
      });
    }

    // 6. Update poster URL
    movie.poster = uploadResponse.secure_url;
    await movie.save();

    // 7. Send success response
    res.status(200).json({
      success: true,
      imageUrl: uploadResponse.secure_url,
      message: "Movie poster uploaded successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to upload movie poster",
    });
  }
};

// exports.getVenuesByMovieID = async (req, res) => {
//   try {
//     const movieId = req.params.id;

//     const showTimes = await ShowTime.find({ movie: movieId })
//       .populate("venue", "name location")
//       .populate("movie", "title")
//       .select("timing venue movie");

//     if (!showTimes.length) {
//       return res
//         .status(404)
//         .json({ error: "No showtimes found for this movie" });
//     }

//     const venueMap = new Map();

//     showTimes.forEach((showTime) => {
//       if (!showTime.venue || !showTime.movie) return;

//       const venueId = showTime.venue._id.toString();

//       if (!venueMap.has(venueId)) {
//         venueMap.set(venueId, {
//           id: showTime.venue._id,
//           name: showTime.venue.name,
//           location: showTime.venue.location,
//           movie_name: showTime.movie.title,
//           show_times: [showTime.timing],
//         });
//       } else {
//         venueMap.get(venueId).show_times.push(showTime.timing);
//       }
//     });

//     return res.status(200).json({ venues: Array.from(venueMap.values()) });
//   } catch (err) {
//     return res.status(500).json({ error: err.message });
//   }
// };

// Put this at top of the controller file (outside the function)
const venuesByMovieCache = new Map();
// key: movieId -> { exp: number, data: any }

const VENUE_CACHE_TTL_MS = 15 * 1000; // 15 seconds

exports.getVenuesByMovieID = async (req, res) => {
  try {
    const movieId = req.params.id;

    // ✅ 1) Check cache
    const cacheKey = movieId;
    const now = Date.now();
    const cached = venuesByMovieCache.get(cacheKey);

    if (cached && cached.exp > now) {
      // return cached response
      return res.status(200).json({
        venues: cached.data,
        cached: true, // optional
      });
    }

    // ✅ 2) Original DB code (UNCHANGED)
    const showTimes = await ShowTime.find({ movie: movieId })
      .populate("venue", "name location")
      .populate("movie", "title")
      .select("timing venue movie");

    if (!showTimes.length) {
      return res
        .status(404)
        .json({ error: "No showtimes found for this movie" });
    }

    const venueMap = new Map();

    showTimes.forEach((showTime) => {
      if (!showTime.venue || !showTime.movie) return;

      const venueId = showTime.venue._id.toString();

      if (!venueMap.has(venueId)) {
        venueMap.set(venueId, {
          id: showTime.venue._id,
          name: showTime.venue.name,
          location: showTime.venue.location,
          movie_name: showTime.movie.title,
          show_times: [showTime.timing],
        });
      } else {
        venueMap.get(venueId).show_times.push(showTime.timing);
      }
    });

    const venues = Array.from(venueMap.values());

    // ✅ 3) Save to cache
    venuesByMovieCache.set(cacheKey, {
      exp: now + VENUE_CACHE_TTL_MS,
      data: venues,
    });

    return res.status(200).json({
      venues,
      cached: false, // optional
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
