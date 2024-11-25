const mongoClient = require('mongodb').MongoClient;
const ObjectId = require('mongodb').ObjectId;
const crypto = require('crypto');
const cors = require('cors');
const path = require('path');
const express = require('express');
const swaggerUi = require("swagger-ui-express");
const { stringify } = require('querystring');
const swaggerDocument = require("./swagger-output.json");
const app = express();
const uri = "mongodb+srv://albertof02:FiatPanda8@cluster0.dtcyt.mongodb.net/";

app.use(cors());
app.use(express.json());
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

//------------------------------------------------------------------

//chiamata di avvio
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'log.html'));
});

app.use(express.static(__dirname)); //Viene inserito sotto la chiamata di avvio altrimenti reindirizzerebbe ad index.html e non a log.html

function hash(input) {
    return crypto.createHash('md5')
        .update(input)
        .digest('hex');
}


async function addUser(res, user) {
    if (user.name == undefined) {
        res.status(400).send("Missing Name")
        return
    }
    if (user.surname == undefined) {
        res.status(400).send("Missing Surname")
        return
    }
    if (user.email == undefined) {
        res.status(400).send("Missing Email")
        return
    }
    if (user.password == undefined || user.password.length < 3) {
        res.status(400).send("Password is missing or too short")
        return
    }

    user.password = hash(user.password)

    var pwmClient = await new mongoClient(uri).connect()
    try {
        var items = await pwmClient.db("mixmaster").collection('users').insertOne(user)
        res.json(items)

    }
    catch (e) {
        console.log('catch in test');
        if (e.code == 11000) {
            res.status(400).send("Utente già presente")
            return
        }
        res.status(500).send(`Errore generico: ${e}`)

    };


}

app.post("/login", async (req, res) => {
    login = req.body
    
    if (login.email == undefined) {
        res.status(400).send("Missing Email")
        return
    }
    if (login.password == undefined) {
        res.status(400).send("Missing Password")
        return
    }

    login.password = hash(login.password)

    var pwmClient = await new mongoClient(uri).connect()
    var filter = {
        $and: [
            { "email": login.email },
            { "password": login.password }
        ]
    }
    var loggedUser = await pwmClient.db("mixmaster")
        .collection('users')
        .findOne(filter);


    if (loggedUser == null) {
        res.status(401).send("Unauthorized")
        console.log(login.password)
    } else {
        res.json(loggedUser)
    }

}
)

app.get('/users', (req, res) => {
    User.find({}, 'nome cognome', (err, users) => {
        if (err) {
            console.error('Errore nella query:', err);
            res.status(500).send('Errore nella query');
            return;
        }

        res.json(users);
    });
});

app.post("/rec", function (req, res) {
    addUser(res, req.body);
});

app.listen(3100, "0.0.0.0", () => {
    console.log("Server started on port 3100");
});


//----------------------------------------------------------------

async function creaPlaylist(res, playlist) {
    if (playlist.name == undefined) {
      res.status(400).send("Missing Name");
      return;
    }
  
    if (playlist.creatoreID == undefined) {
      res.status(400).send("Missing Creator");
      return;
    }
  
    var pwmClient = await new mongoClient(uri).connect();
    try {
      var items = await pwmClient.db("mixmaster").collection('playlist').insertOne(playlist);
      
      
      var final = await pwmClient.db("mixmaster").collection('playlist').updateOne(
        { _id: new ObjectId(items.insertedId) },
        { $set: { pubblica: false } }
      );
      

      var filter = { "_id": new ObjectId(playlist.creatoreID) };
      var updatedUserToInsert = {
        $push: { "playlist": String(items.insertedId) }
      };
  
      var result = await pwmClient.db("mixmaster").collection('users').updateOne(filter, updatedUserToInsert);
      const users = await pwmClient.db("mixmaster").collection('users').findOne(filter);
      res.send(users)
  
      if (result.modifiedCount === 0) {
        res.status(400).send("Nessun documento utente modificato");
        return;
      }
  
    } catch (e) {
      console.log('catch in test');
      if (e.code == 11000) {
        res.status(400).send("Playlist già presente");
        return;
      }
      res.status(500).send(`Errore generico: ${e}`);
    } finally {
      await pwmClient.close();
    }
}
  

//------------------------------------------------------------------------------------------

app.post("/newplay", function (req, res) {
    creaPlaylist(res, req.body);
});

//-------------------------------------------------------------------------------------------

app.delete("/delete/:id", function (req, res) {
    deleteUser(res, req.params.id)
})

//--------------------------------------------------------------------------------------------

async function deleteUser(res, id) {
    var pwmClient = await new mongoClient(uri).connect();
    try {
  
      const result = await pwmClient.db("mixmaster").collection('users').deleteOne({ _id: new ObjectId(id) });
  
      if (result.deletedCount === 0) {
        res.status(404).send('User not found');
        return;
      }
  
      const users = await pwmClient.db("mixmaster").collection('users').find().toArray();
      res.json(users);
    } catch (error) {
      console.error('Error deleting user:', error);
      res.status(500).send('Internal Server Error');
    }
  }

//---------------------------------------------------------------------------------------------

async function updateUser(res, id, updatedUser) {
  try {
    var pwmClient = await new mongoClient(uri).connect();
    var filter = { "_id": new ObjectId(id) };
    var loggedUser = await pwmClient.db("mixmaster").collection('users').findOne(filter);

    if (!loggedUser) {
      res.status(404).send("User not found");
      return;
    }

    if (updatedUser.password !== loggedUser.password) {
      updatedUser.password = hash(updatedUser.password);
    }

    var updatedUserToInsert = {
      $set: updatedUser
    };

    var item = await pwmClient.db("mixmaster").collection('users').updateOne(filter, updatedUserToInsert);

    loggedUser = await pwmClient.db("mixmaster").collection('users').findOne(filter);

    res.send(loggedUser);
  } catch (e) {
    console.log('catch in test');
    if (e.code === 11000) {
      res.status(400).send("Utente già presente");
      return;
    }
    res.status(500).send(`Errore generico: ${e}`);
  }
}
//-----------------------------------------------------------------------------------

app.put("/users/:id", function (req, res) {
  updateUser(res, req.params.id, req.body)
})

//-----------------------------------------------------------------------------------

app.delete("/delPlayPriv/:id/:userid", function (req, res) {
  deletePlaylistPriv(res, req.params.id, req.params.userid)
})

//-----------------------------------------------------------------------------------

async function deletePlaylistPriv(res, id, userId) {
  var pwmClient = await new mongoClient(uri).connect();
  try {

    const result = await pwmClient.db("mixmaster").collection('playlist').deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      res.status(404).send('Playlist not found');
      return;
    }
    const updateResult = await pwmClient.db("mixmaster").collection('users').updateOne(
      { _id: new ObjectId(userId) }, 
      { $pull: { playlist: String(id) } } 
    );

    var filter = { _id: new ObjectId(userId)}

    loggedUser = await pwmClient.db("mixmaster").collection('users').findOne(filter);
    res.send(loggedUser)

  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).send('Internal Server Error');
  }
}

//----------------------------------------------------------------------------------------------------------------------

app.get("/getplay/:userId", function (req, res) {
  getPlaylist(res, req.params.userId)
})

//--------------------------------------------------------------------------------------------------------------------

async function getPlaylist(res, userId){
  var pwmClient = await new mongoClient(uri).connect();
  try {
    const playlists = await pwmClient.db("mixmaster").collection('playlist').find({ creatoreID: userId }).toArray();
    return res.send(playlists);
  } catch (error) {
    console.error('Error retrieving playlists:', error);
    throw error;
  }
}

//----------------------------------------------------------------------------------------------------------------------

async function updateName(res, id, name) {
  try {
    var pwmClient = await new mongoClient(uri).connect();
    var filter = { "_id": new ObjectId(id) };
    var playlist = await pwmClient.db("mixmaster").collection('playlist').findOne(filter);

    if (!playlist) {
      res.status(404).send("Playlist not found");
      return;
    }

    var updatePlay = {
      $set: { name: name }
    };

    await pwmClient.db("mixmaster").collection('playlist').updateOne(filter, updatePlay);

    res.send("Playlist updated successfully");
  } catch (e) {
    console.error('Error updating playlist:', e);
    res.status(500).send("Internal Server Error");
  }
}


//----------------------------------------------------------------------------------------------------------------------------

app.put("/playname/:id/:name", function (req, res) {
  updateName(res, req.params.id, req.params.name)
})

//-----------------------------------------------------------------------------------------------------------------------------

app.put("/playvisibility/:id", function (req, res){
  updateVisibility(res, req.params.id)
})

//-----------------------------------------------------------------------------------------------------------

async function updateVisibility(res, id) {
  try {
    var pwmClient = await new mongoClient(uri).connect();
    var filter = { "_id": new ObjectId(id) };
    var playlist = await pwmClient.db("mixmaster").collection('playlist').findOne(filter);

    if (!playlist) {
      res.status(404).send("Playlist not found");
      return;
    }

    if (!playlist.pubblica){
      var updatePlay = {
        $set: { pubblica: true }
      };
    } else {
      var updatePlay = {
        $set: { pubblica: false }
      };
    }


    await pwmClient.db("mixmaster").collection('playlist').updateOne(filter, updatePlay);

    res.send("Playlist updated successfully");
  } catch (e) {
    console.error('Error updating playlist:', e);
    res.status(500).send("Internal Server Error");
  }
}

//-------------------------------------------------------------------------------------------------------------

app.put ("/addSong/:playId/:songId", function (req, res){
  addSong(res, req.params.playId, req.params.songId)
})

//-----------------------------------------------------------------------------------------------------------

async function addSong(res, playId, songId) {
  try {
    var pwmClient = await new mongoClient(uri).connect();
    var filter = { "_id": new ObjectId(playId) };
    var playlist = await pwmClient.db("mixmaster").collection('playlist').findOne(filter);

    if (!playlist) {
      res.status(404).send("Playlist not found");
      console.log("Playlist non trovata")
      return;
    }

    var updatePlay = {
      $push: { "braniID": String(songId) }
    };

    await pwmClient.db("mixmaster").collection('playlist').updateOne(filter, updatePlay);

    res.send("Playlist updated successfully");
  } catch (e) {
    console.error('Error updating playlist:', e);
    res.status(500).send("Internal Server Error");
  }
}

//---------------------------------------------------------------------------------------

async function getPlayInfo(res, playlistId) {
  try {
    var pwmClient = await mongoClient.connect(uri);
    var filter = { "_id": new ObjectId(playlistId) };
    var playlist = await pwmClient.db("mixmaster").collection('playlist').findOne(filter);

    if (!playlist) {
      res.status(404).send("Playlist not found");
      console.log("Playlist non trovata");
      return;
    }

    res.send(playlist);
  } catch (error) {
    console.error('Errore durante il recupero degli ID dei brani:', error);
    throw error;
  }
}

//---------------------------------------------------------------------------------

app.get("/getPlayInfo/:playId", function (req, res) {
  getPlayInfo(res, req.params.playId)
})

//------------------------------------------------------------------------------------

app.delete("/deleteSong/:playid/:id", function (req, res) {
  deleteSong(res, req.params.playid, req.params.id)
})

//---------------------------------------------------------------

async function deleteSong(res, playid, id){
  var pwmClient = await new mongoClient(uri).connect();
  try {

    const updateResult = await pwmClient.db("mixmaster").collection('playlist').updateOne(
      { _id: new ObjectId(playid) },
      { $pull: { braniID: String(id) } }
    );

    res.send("ELIMINATO")

  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).send('Internal Server Error');
  }
}

//-----------------------------------------------------------------------------------------------------------

app.get("/getplaypub/", function (req, res) {
  getPlaylistPubbliche(res)
})

//---------------------------------------------------------------------------------------------------------

async function getPlaylistPubbliche(res) {
  var pwmClient = await new mongoClient(uri).connect();
  try {
    const playlists = await pwmClient.db("mixmaster").collection('playlist').find({ pubblica: true }).toArray();
    return res.send(playlists);
  } catch (error) {
    console.error('Error retrieving playlists:', error);
    throw error;
  }
}

//--------------------------------------------------------------------------

app.put("/playpubadd/:userId/:playId", function (req, res) {
  addPlayPub(res, req.params.userId, req.params.playId)
})

//---------------------------------------------------------------------------

async function addPlayPub(res, userId, playId) {
  try {
    var pwmClient = await new mongoClient(uri).connect();
    var filter = { "_id": new ObjectId(userId) };
    var user = await pwmClient.db("mixmaster").collection('users').findOne(filter);

    if (!user) {
      res.status(404).send("utente not found");
      console.log("utente non trovata")
      return;
    }
    
    var updatePlay = {
      $push: { "playlist": String(playId) }
    };
    
    await pwmClient.db("mixmaster").collection('users').updateOne(filter, updatePlay);
    
    loggedUser = await pwmClient.db("mixmaster").collection('users').findOne(filter);
    res.send(loggedUser)
  } catch (e) {
    console.error('Error updating playlist:', e);
    res.status(500).send("Internal Server Error");
  }
}

//-----------------------------------------------------------------------------------

app.delete("/delPlay/:id/:userid", function (req, res) {
  deletePlaylist(res, req.params.id, req.params.userid)
})

//-----------------------------------------------------------------------------------

async function deletePlaylist(res, id, userId) {
  var pwmClient = await new mongoClient(uri).connect();
  try {

    const result = await pwmClient.db("mixmaster").collection('playlist').findOne({ _id: new ObjectId(id) });
    
    if (!result) {
      res.status(404).send('Playlist not found');
      return;
    }

    if (result.pubblica){
      if(result.creatoreID === String(userId)){
        try {
  
          const result = await pwmClient.db("mixmaster").collection('playlist').deleteOne({ _id: new ObjectId(id) });
      
          if (result.deletedCount === 0) {
            res.status(404).send('Playlist not found');
            return;
          }
          const updateResult = await pwmClient.db("mixmaster").collection('users').updateMany(
            {}, 
            { $pull: { playlist: String(id) } } 
          );
      
          var filter = { _id: new ObjectId(userId)}
      
          loggedUser = await pwmClient.db("mixmaster").collection('users').findOne(filter);
          res.send(loggedUser)
      
        } catch (error) {
          console.error('Error deleting user:', error);
          res.status(500).send('Internal Server Error');
        }
      } else {
        try{
  
          const updateResult = await pwmClient.db("mixmaster").collection('users').updateOne(
            {_id: new ObjectId(userId) }, 
            { $pull: { playlist: String(id) } } 
          );
      
          var filter = { _id: new ObjectId(userId)}
      
          loggedUser = await pwmClient.db("mixmaster").collection('users').findOne(filter);
          res.send(loggedUser)
  
        }
        catch{
          console.error('Error deleting user:', error);
          res.status(500).send('Internal Server Error');
        }
      }
    } else {

      var pwmClient = await new mongoClient(uri).connect();
      try {

      const result = await pwmClient.db("mixmaster").collection('playlist').deleteOne({ _id: new ObjectId(id) });

      if (result.deletedCount === 0) {
        res.status(404).send('Playlist not found');
        return;
      }
      const updateResult = await pwmClient.db("mixmaster").collection('users').updateOne(
        { _id: new ObjectId(userId) }, 
        { $pull: { playlist: String(id) } } 
      );

      var filter = { _id: new ObjectId(userId)}

      loggedUser = await pwmClient.db("mixmaster").collection('users').findOne(filter);
      res.send(loggedUser)

      } catch (error) {
      console.error('Error deleting user:', error);
      res.status(500).send('Internal Server Error');
      }

    }
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).send('Internal Server Error');
  }
}






