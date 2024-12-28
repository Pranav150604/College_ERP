// const allowedOrigins = [
//   "https://kollege.onrender.com",
//   "http://localhost:8000",
// ];

// const corsOptions = {
//   origin: (origin, callback) => {
//     if (
//       allowedOrigins.indexOf(origin) !== -1
//       //! remove in production
//       // || !origin
//     ) {
//       callback(null, true);
//     } else {
//       callback(new Error("Not Allowed by CORS"));
//     }
//   },
//   credentials: true,
//   optionsSuccessStatus: 200,
// };

// module.exports = corsOptions;

const corsOptions = {
  origin: "*", // This allows all origins to make requests
  credentials: true, // Allow credentials (cookies, etc.)
  optionsSuccessStatus: 200, // Set success status for preflight OPTIONS requests
};

module.exports = corsOptions;
