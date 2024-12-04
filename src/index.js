// Import necessary modules
import dotenv from "dotenv"; // To load environment variables from a .env file
import connectDB from "./db/index.js"; // Custom DB connection module
import app from "./app.js"; // The Express app configuration

// Load environment variables from the .env file
dotenv.config({
  path: "./.env", // Path to the .env file (can be omitted if .env is in the root folder)
});

// Connect to the database and start the server upon successful connection
connectDB() // Call the custom function to connect to MongoDB
  .then(() => {
    // Once the DB connection is successful, start the Express app
    app.listen(process.env.PORT || 8000, () => {
      console.log("App listening on port : ", process.env.PORT); // Log the server's listening port
    });
  })
  .catch((error) => {
    // If there is an error connecting to the database, log the error and exit the process
    console.error("ERROR : ", error); // Log any errors that occur during the DB connection
    process.exit(1); // Exit the process with a failure status code
  });

/*
The following commented-out code represents an alternative way to start the server and connect to the database:

(async () => {
  try {
    // Attempt to connect to the database
    await mongoose.connect(`${process.env.MONGO_URL}/${DB_NAME}`);
    
    // Set up error handling for the app
    app.on("error", (error) => {
      console.error("Error in server : ", error);
      throw error; // If the server encounters an error, it will throw and stop execution
    });

    // Once connected to DB, start the Express server
    app.listen(process.env.PORT, () => {
      console.log("App listening on port : ", process.env.PORT); // Log server start
    });
  } catch (error) {
    // If an error occurs, log it and stop the execution
    console.error("ERROR  :", error);
    throw err; // This will throw the error and stop the application from running
  }
})();
*/
