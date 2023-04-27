const express = require("express");
const app = express();
const port = 3000;
const os = require("node:os");
const fs = require("node:fs");
const path = require("path");
app.use(express.static("frontend"));
// Directory /tmp
const home = os.tmpdir();
// busboy upload files
const expressBusboy = require("express-busboy");

// Regex
const regex = /^[0-9a-zA-Z]+$/;
// Port du serveur
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

app.get("/api/drive/*", async (req, res) => {
  const fileName = req.params[0];

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

  if (!regex.test(folderName)) {
    res
      .status(400)
      .send("Le nom de dossier contient des caractères non-alphanumérique");
  } else if (fs.existsSync(folderPath)) {
    res.status(405).send("Le dossier existe déjà");
  } else {
    fs.mkdir(folderPath, { recursive: true }, (err) => {
      if (err) {
        res.status(400).send("Le dossier n'a pas pu être créé", err);
      } else {
        console.log(`Le dossier ${folderName} a été créé avec succès`);
        res.status(201).send("Le dossier a été créé avec succès");
      }
    });
  }
});

// Create folder into folder...
app.post("/api/drive/*", (req, res) => {
  // recup le nom du dossier
  const folderParams = req.params[0];
  // nom de la creation du dossier
  const folderName = req.query.name;
  // chemin du dossier avec le parametres & le nom de la creation
  const folderPath = path.join(home, folderParams, folderName);

  if (!regex.test(folderName)) {
    res
      .status(400)
      .send("Le nom de dossier contient des caractères non-alphanumérique");
  } else if (fs.existsSync(folderPath)) {
    res.status(405).send("Le dossier existe déjà");
  } else {
    fs.mkdir(folderPath, { recursive: true }, (err) => {
      if (err) {
        res.status(400).send("Le dossier n'a pas pu être créé", err);
      } else {
        console.log(`Le dossier ${folderName} a été créé avec succès`);
        res.status(201).send("Le dossier a été créé avec succès");
      }
    });
  }

  // if (fs.existsSync(folderParams)) {
  // }
});

// Delete folder
app.delete("/api/drive/*", async (req, res) => {
  const pathParams = req.params[0];
  const pathUrl = home + "/" + pathParams;

  if (fs.existsSync(pathUrl)) {
    fs.rmSync(home + "/" + pathParams, {
      recursive: true,
      force: true,
    });
    console.log("Dossier supprimé");
    res.status(200).send("Le dossier a été supprimé avec succès");
  } else {
    console.log("Le fichier n'existe pas");
    res.status(404).send("Le fichier n'existe pas");
  }
});

// Upload files

expressBusboy.extend(app, {
  upload: true,
  path: home,
});

app.put("/api/drive", (req, res) => {
  res.header("Content-Type", "multipart/form-data");
  const fileName = req.files.file.filename;
  const fileSrc = req.files.file.file;
  console.log(fileName);

  if (fileName) {
    console.log("Je suis passé ici");
    fs.copyFileSync(fileSrc, home + "/" + fileName);
    res.status(201).send(fileName);
  } else {
    console.log("Pas de fichier");
    res.status(400).send(home);
  }
});

app.put("/api/drive/*", (req, res) => {
  res.header("Content-Type", "multipart/form-data");

  const folderParams = req.params[0];
  const fileName = req.files.file.filename;
  const fileSrc = req.files.file.file;
  console.log(fileName);
  if (fs.existsSync(home + "/" + folderParams)) {
    if (fileName) {
      console.log("Je suis passé ici");
      fs.copyFileSync(fileSrc, home + "/" + folderParams + "/" + fileName);
      res.status(201).send(home + "/" + folderParams);
    } else {
      console.log("Pas de fichier");
      res.status(400).send(home + "/" + folderParams);
    }
  } else {
    console.log("Le dossier n'existe pas");
    res.status(404);
  }
});

// 404
app.all("*", async (req, res) => {
  res.status(404).send("Le dossier n'existe pas !");
});

module.exports = app;
