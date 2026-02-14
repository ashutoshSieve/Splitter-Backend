const app = require("./app");
const connectDB = require("./db/connect");
const {PORT} = require("./config");

(async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
})();
