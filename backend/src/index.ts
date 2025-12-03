import express from "express";
import dotenv from "dotenv";

dotenv.config();

import routes from "./routes";  // <-- IMPORTANT

const app = express();
app.use(express.json());

// mount all routes under /
app.use("/", routes);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () =>
  console.log(`🚀 Backend running on http://localhost:${PORT}`)
);