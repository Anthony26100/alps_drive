const express = require("express");
const app = express();
const port = 3000;
const os = require("node:os");
const fs = require("node:fs");
const path = require("path");
app.use(express.static("frontend"));
// Directory /tmp
const home = os.tmpdir();

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

app.get("/api/drive", async (req, res) => {
  const go = await fs.promises.readdir(home, {
    withFileTypes: true,
    encoding: "ascii",
  });

  const test = go.map((paths) => {
    if (paths.isDirectory()) {
      return {
        name: paths.name,
        isFolder: paths.isDirectory(),
      };
    } else {
      // statSync permet d'afficher la size ou autres dans fichier
      // console.log("---->  ", fs.statSync(path.join(home, paths.name)).size);

      return {
        name: paths.name,
        size: fs.statSync(path.join(home, paths.name)).size,
        isFolder: paths.isDirectory(),
      };
    }
  });
  // console.log("----> ", test);
  res.send(test);
});

app.get("/api/drive/:name", async (req, res) => {
  const fileName = req.params.name;

  const openFile = await fs.promises.readFile(path.join(home, fileName), {
    encoding: "utf8",
  });
  console.log("open file ", openFile);
  res.send(openFile);
});
