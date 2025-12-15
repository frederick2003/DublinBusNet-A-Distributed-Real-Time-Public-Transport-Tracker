import express from "express";
import cors from "cors";
import morgan from "morgan";
import routes from "./routes";
import authRoutes from "./routes/auth";
import { ensureSeeded } from "./services/busCache";
import userRoutes from "./routes/users";

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.use("/api/auth", authRoutes);

app.use("/api/users", userRoutes);

// When running behind a proxy (nginx / API gateway), trust X-Forwarded-* headers
app.set("trust proxy", true);

// Serve all application routes under /api to match frontend expectations
app.use("/api", routes);

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
app.listen(PORT, () => {
  console.log(`Backend service running on http://localhost:${PORT}`);
});

// Pre-warm cache with seed data so /api/buses/* never returns empty while ingestion is offline.
ensureSeeded().catch((err) =>
  console.error("[bootstrap] failed to seed bus cache", err)
);
