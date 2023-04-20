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

  if (!fs.existsSync(path.join(home, fileName)))
    return res.status(404).send("Page not found");

  if (fs.lstatSync(path.join(home, fileName)).isDirectory()) {
    const openFolder = await fs.promises.readdir(path.join(home, fileName), {
      encoding: "utf8",
    });
    const file = await Promise.all(
      openFolder.map((files) => {
        const stats = fs.statSync(path.join(home, fileName, files));
        return {
          name: files,
          size: stats.size,
        };
      })
    );
    console.log(file);
    return res.send(file);
  }
  const openFile = await fs.promises.readFile(path.join(home, fileName), {
    encoding: "utf8",
  });
  res.send(openFile);
});

app.post("/api/drive", (req, res) => {
  const folderName = req.query.name;
  const folderPath = path.join(home, folderName);

  fs.mkdir(folderPath, { recursive: true }, (err) => {
    if (err) {
      console.error(err);
      res.status(500).send("Erreur lors de la création du dossier");
    } else {
      console.log(`Le dossier ${folderName} a été créé avec succès`);
      res.status(200).send("Le dossier a été créé avec succès");
    }
  });
});
