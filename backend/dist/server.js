"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const mongoose_1 = __importDefault(require("mongoose"));
const auth_1 = __importDefault(require("./routes/auth"));
const users_1 = __importDefault(require("./routes/users"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config();
mongoose_1.default.connect(process.env.MONGODB_URL ||
    "mongodb://localhost:27017/hotel-booking");
const app = (0, express_1.default)();
app.use((0, cors_1.default)({
    origin: "http://localhost:5174",
    credentials: true,
}));
app.use((0, cookie_parser_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
const PORT = process.env.PORT || 8002;
// Connecting routers to the express server
app.use("/api/users", users_1.default);
app.use("/api/auth", auth_1.default);
app.use(express_1.default.static(path_1.default.join(__dirname, "../../frontend/dist")));
app.get("*", (req, res) => {
    res.sendFile(path_1.default.join(__dirname, "../../frontend/dist/index.html"));
});
app.get("/", (req, res) => {
    res.send("<h1>Welcome to the Barbican! </h1>").status(200);
});
app.listen(PORT, () => {
    console.log(`Server Listening at Port ${PORT}...`);
});
