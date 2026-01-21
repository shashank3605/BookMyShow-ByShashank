const Venue = require("../Models/Venue"); // Your Venue Mongoose model
const Movie = require("../Models/Movie"); // Your Movie model
const ShowTime = require("../Models/ShowTime"); // Your ShowTime model

exports.getAllVenues = async (req, res) => {
  try {
    // Default limit is 5
    let limit = 5;
    if (req.body.limit) {
      limit = parseInt(req.body.limit, 10) || 5;
    }

    // Default offset is 0
    let offset = 0;
    if (req.body.offset) {
      offset = parseInt(req.body.offset, 10) || 0;
    }

    // Fetch venues with pagination
    const venues = await Venue.find().limit(limit).skip(offset);

    // Count total venues for the next_offset calculation
    const totalVenues = await Venue.countDocuments();

    // Calculate the next offset
    let nextOffset = offset + limit;
    if (nextOffset >= totalVenues) {
      nextOffset = -1; // No more venues to load
    }

    // Send response
    res.status(200).json({
      venues: venues,
      next_offset: nextOffset,
    });
  } catch (error) {
    res.status(500).json({
      error: "Failed to get venues",
    });
  }
};

exports.createVenue = async (req, res) => {
  try {
    // Extract data from the request body
    const { name, location } = req.body;

    // Validate required fields
    if (!name || !location) {
      return res.status(400).json({ error: "Name and location are required" });
    }

    // Authorization check - ensure the user is an admin
    if (!req.user || !req.user.isAdmin) {
      return res
        .status(401)
        .json({ error: "Unauthorized, admin access required" });
    }

    // Create a new venue
    const venue = new Venue({
      name: name,
      location: location,
    });
    // const venue = await Venue.create({ name, location });
    console.log("CREATED VENUE:", venue);

    // Save the venue to the database
    await venue.save();

    // Return the created venue
    return res.status(201).json({
      success: true,
      venue,
    });
  } catch (error) {
    console.error("CREATE VENUE ERROR:", error);
    return res.status(500).json({ error: "Failed to create venue" });
  }
};

exports.addMovieInVenue = async (req, res) => {
  try {
    // Get the venue ID from the URL params
    const venueId = req.params.id;
    console.log("venueid", venueId);

    // Get the list of movie IDs from the request body
    const { movieIds } = req.body;
    console.log("movieId", movieIds);

    // Validate input: check if movieIds is provided and is an array
    if (!Array.isArray(movieIds) || movieIds.length === 0) {
      return res.status(400).json({ error: "Invalid movie IDs" });
    }

    // Authorization check: ensure the user is an admin
    // if (!req.user || !req.user.isAdmin) {
    //   return res
    //     .status(401)
    //     .json({ error: "Unauthorized, admin access required" });
    // }

    // Find the venue by ID
    const venue = await Venue.findById(venueId);
    console.log("venue", venue);
    if (!venue) {
      return res.status(404).json({ error: "Venue not found" });
    }

    // Find all Movie by their IDs
    const movie = await Movie.find({ _id: { $in: movieIds } });
    console.log("Movie", movie);

    //  Add Movie to venue (no duplicates)
    if (movie.length !== movieIds.length) {
      return res.status(404).json({ error: "Some Movie not found" });
    }

    // Add venue to each movie (no duplicates)
    await Venue.findByIdAndUpdate(
      venueId,
      { $addToSet: { Movie: { $each: movieIds } } },
      { new: true }
    );

    // Add venue to each movie (no duplicates)
    await Movie.updateMany(
      { _id: { $in: movieIds } },
      { $addToSet: { venues: venueId } }
    );

    // Add Movie to the venue's Movie array
    // venue.Movie.push(...Movie.map((movie) => movie._id));

    // Save the updated venue
    // await venue.save();

    // Respond with success
    res.status(200).json({ message: "Movie successfully added to venue" });
  } catch (error) {
    res.status(500).json({ error: "Failed to add Movie to venue" });
  }
};

exports.getVenueById = async (req, res) => {
  try {
    // Get the venue ID from the request parameters
    const venueId = req.params.id;

    // Find the venue by ID and populate the associated Movie
    const venue = await Venue.findById(venueId).populate("Movie");

    // If the venue is not found, return a 404 error
    if (!venue) {
      return res.status(404).json({ error: "Venue not found" });
    }

    // Return the venue with its associated Movie
    res.status(200).json({ venue });
  } catch (error) {
    res.status(500).json({ error: "Failed to get venue" });
  }
};

exports.addShowTimings = async (req, res) => {
  try {
    // Extract venue ID from URL params
    const venueId = req.params.id;
    console.log("venue id", venueId);


    // Extract show timings and movie ID from the request body
    const { showTimings, movieId } = req.body;


    // Validate input
    if (!Array.isArray(showTimings) || showTimings.length === 0 || !movieId) {
      return res
        .status(400)
        .json({ error: "Invalid show timings or movie ID" });
    }

    // Authorization check
    // if (!req.user || !req.user.isAdmin) {
    //   return res
    //     .status(401)
    //     .json({ error: "Unauthorized, admin access required" });
    // }

    // Find the venue by ID
    const venue = await Venue.findById(venueId);
    console.log(venue)
    if (!venue) {
      return res.status(404).json({ error: "Venue not found" });
    }

    // For each timing, create a new ShowTime entry
    const showTimeDocs = showTimings.map((timing) => ({
      timing: timing,
      movie: movieId,
      venue: venue._id,
    }));

    // Insert all showtimes into the database
    const createdShowTimes = await ShowTime.insertMany(showTimeDocs);
    const showTimeIds = createdShowTimes.map((st) => st._id);

    // 2️⃣ Add showTimes to Movie
    await Movie.findByIdAndUpdate(movieId, {
      $addToSet: { showTimes: { $each: showTimeIds } },
    });

    // push into Venue as well
    await Venue.findByIdAndUpdate(venueId, {
      $addToSet: { showTime: { $each: showTimeIds } },
    });

    // Respond with success message
    res.status(200).json({ message: "Show timings added successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to add show timings" });
  }
};
