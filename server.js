const express = require("express");
const app = express();
const port = 3000;
const fs = require("fs");
const os = require("os");

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

app.use(express.static("frontend"));

app.get("/api/drive", (req, res) => {
  const temp = os.tmpdir();

  const folder = fs.promises.readdir(temp, { withFileTypes: true });

  folder.then((e) => {
    e.map((data) => {
      if (data.isDirectory()) {
        return {
          name: data.name,
          isFolder: data.isDirectory(),
        };
      } else {
        return data;
      }
    });
  });
  console.log("error :");
  res.send(folder);
});
