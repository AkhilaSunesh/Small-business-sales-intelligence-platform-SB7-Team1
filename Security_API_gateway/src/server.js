const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });
require("dotenv").config();

const app = require("./app");

const PORT = process.env.PORT || 6000;

app.listen(PORT, "0.0.0.0", () => {
    console.log(`🔐 Security API Gateway running on http://0.0.0.0:${PORT}`);
});