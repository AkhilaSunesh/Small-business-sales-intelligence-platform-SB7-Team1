require("dotenv").config();

const app = require("./app");

const PORT = process.env.PORT || 6000;

app.listen(PORT, () => {
    console.log(`🔐 Security API Gateway running on http://localhost:${PORT}`);
});