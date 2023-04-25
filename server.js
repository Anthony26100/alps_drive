const express = require("express");
const app = express();
const port = 3000;
const os = require("node:os");
const fs = require("node:fs");
const path = require("path");
const busboy = require("busboy");
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
      withFileTypes: true,
    });
    const info = await Promise.all(
      openFolder.map((files) => {
        return {
          name: files.name,
          isFolder: files.isDirectory(),
          size: fs.statSync(path.join(home, fileName, files.name)).size,
        };
      })
    );
    // console.log(info);
    res.send(info);
  } else {
    res.send(fs.readFileSync(path.join(home, fileName)));
  }
});

// Create folder
app.post("/api/drive", (req, res) => {
  // TODO regex for not alphanumeric
  const folderName = req.query.name;
  const folderPath = path.join(home, folderName);

  fs.mkdir(folderPath, { recursive: true }, (err) => {
    if (err) {
      console.error(err);
      res.status(400).send("Erreur lors de la création du dossier");
    } else {
      console.log(`Le dossier ${folderName} a été créé avec succès`);
      res.status(201).send("Le dossier a été créé avec succès");
    }
  });
});

// Create folder into folder
app.post("/api/drive/:folder", (req, res) => {
  // recup le nom du dossier
  const folderParams = req.params.folder;
  // nom de la creation du dossier
  const folderName = req.query.name;

  const folderPath = path.join(home, folderParams, folderName);

  fs.mkdir(folderPath, { recursive: true }, (err) => {
    if (err) {
      console.error(err);
      res.status(400).send("Erreur lors de la création du dossier");
    } else {
      console.log(`Le dossier ${folderPath} a été créé avec succès`);
      res.status(201).send("Le dossier a été créé avec succès");
    }
  });

  // if (fs.existsSync(folderParams)) {
  // }
});

app.delete("/api/drive/:name", async (req, res) => {
  const name = req.params.name;
  const regex = /[^a-zA-Z0-9]/g;
  if (name.match(regex)) {
    const path = home + "/" + name;
    if (fs.existsSync(path)) {
      fs.rmdirSync(path);
      res
        .status(200)
        .json({ message: "Le dossier a été supprimé avec succès" });
    } else {
      res.status(404).json({ error: "Le dossier demandé n'existe pas" });
    }
  } else {
    res.status(400).json({
      error: "Le nom du dossier contient des caractères non-alphanumériques",
    });
  }
});

app.delete("/api/drive/:folder/:name", async (req, res) => {
  const folder = req.params.folder;
  const name = req.params.name;
  if (name.match(/^[a-z0-9]+$/i)) {
    const path = home + "/" + folder + "/" + name;
    console.log(path);
    if (fs.existsSync(path)) {
      fs.rmSync(path, { recursive: true });
      res
        .status(200)
        .json({ message: "Le dossier a été supprimé avec succès" });
    } else {
      res.status(404).json({ error: "Le dossier demandé n'existe pas" });
    }
  } else {
    res.status(400).json({
      error: "Le nom du dossier contient des caractères non-alphanumériques",
    });
  }
});

// Update
app.put("/api/drive", (req, res) => {
  let busboyInstance = new busboy({ headers: req.headers });

  busboyInstance.on("file", (file, filename) => {
    let filepath = dir + "/" + filename;

    file.on("end", () => {
      res.status(200).json({ message: "Le fichier a été créé avec succès" });
    });

    file.pipe(fs.createWriteStream(filepath));
  });

  busboyInstance.on("finish", function () {
    res.status(400).json({ error: "Aucun fichier n'a été envoyé" });
  });

  req.pipe(busboyInstance);
});
