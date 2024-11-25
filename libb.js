// Variabili Globali
const client_id = "0f1231d3090a4b42b5c5b17b285f77e0";
const client_secret = "1963319962b54ac6a6ca9aeaaf3068a5";
const url = "https://accounts.spotify.com/api/token";
let accessToken = "";
var currentTrack;
let currentPodcast;
let currentArtist;
var braniPlay = {}
var pagAtt = 0  

//----------------------------CodificaPassword----------------------------------

function generateMD5Hash(input) {
  const md5Hash = CryptoJS.MD5(input);
  return md5Hash.toString();
}

//---------------------------Navbar------------------------------

const elementiMenu=[]
var index=''

if(localStorage.getItem('user') !== null && localStorage.getItem('user')!== "undefined" ){
  elementiMenu.push({ nome: "Ricerca", link: "ricerca.html" })
  elementiMenu.push({ nome: "Playlist", link: "playlist.html" })

  index = '<a class="navbar-brand" id="nav-index" href="index.html">Mix Master</a>'
} else {
  index = '<a class="navbar-brand" id="nav-index">Mix Master</a>'
}
  
  var menuHTML = "";
  for (let i = 0; i < elementiMenu.length; i++) {
    let item = elementiMenu[i];
    menuHTML += `<li class="nav-item"><a id="nav-${item.nome}" class="nav-link" href="${item.link}">${item.nome}</a></li>`
  }
  
  
  var utente = ''
  if(localStorage.getItem('user') !== null && localStorage.getItem('user')!== "undefined" ){
    var user = JSON.parse(localStorage.getItem('user'))
  
    utente = `<li class="nav-item"><a id="nav-login" class="nav-link" href="user.html">${user.name}</a></li>`
  }else{
    utente = `<li class="nav-item"><a id="nav-login" class="nav-link" href="log.html">Login</a></li>`
  }
  
  
  const navbar = document.getElementById('navbar')
  navbar.innerHTML = `
    <nav class="navbar navbar-expand-sm ">
      <div class="container-fluid">
        ${index}
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNavDropdown" aria-controls="navbarNavDropdown" aria-expanded="false" aria-label="Toggle navigation">
            <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="navbarNavDropdown">
            <ul class="navbar-nav">
                ${menuHTML}
                
                ${utente}

                <li class="nav-item" onclick="logout()"><a class="nav-link" onclick="logout()" href="log.html">Log-out</a></li>
            </ul>
        </div>
      </div>
    </nav> `

//---------------LinekdList Utilizzata in index.html--------------------

class Nodo {
  constructor(data) {
    this.data = data;
    this.next = null;
    this.prec = null;
  }
}

class LinkedList {
  constructor() {
    this.head = null;
    this.tail = null;
  }

  append(data) {
    const newNode = new Nodo(data);

    if (!this.head) {
      this.head = newNode;
      this.tail = newNode;
    } else {
      newNode.prec = this.tail;
      this.tail.next = newNode;
      this.tail = newNode;
    }
  }
}

// Avvio Linked List
const linkedListTrack = new LinkedList();
const linkedListArtisti = new LinkedList();
const linkedListPodcast = new LinkedList();

//--------------Funzione Ottenimento api token-------------------
async function ottieniApi() {
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: "Basic " + btoa(`${client_id}:${client_secret}`),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ grant_type: "client_credentials" }),
    });
    const tokenResponse = await response.json();
    accessToken = tokenResponse.access_token;

    // Autentica l'API di Spotify utilizzando il token di accesso
    window.onSpotifyWebPlaybackSDKReady = function () {
      var player = new Spotify.Player({
        name: 'Web Playback SDK Template',
        getOAuthToken: function (callback) {
          callback(accessToken);
        }
      });
    }
  } catch (error) {
    console.log('Errore nell\'ottenere l\'API:', error);
  }
}

//---------------------------------Funzioni Apertura Pagine------------------------------

function apriCanzone(songId) {
  var url = 'song.html?id=' + encodeURIComponent(songId);
  window.open(url, '_self');
}

//----------------------------------------

function apriAlbum(albumId) {
  var url = 'album.html?id=' + encodeURIComponent(albumId);
  window.open(url, '_self');
}

//----------------------------------------

function apriArtista(artistaId){
  var url = 'artista.html?id=' + encodeURIComponent(artistaId);
  window.open(url, '_self');
}

//----------------------------------------

function apriPodcast(podcastId){
  var url = 'podcast.html?id=' + encodeURIComponent(podcastId);
  window.open(url, '_self');
}

//----------------------------------------

function apriEpisodio(episodeId){
  var url = 'episodi.html?id=' + encodeURIComponent(episodeId);
  window.open(url, '_self');
}

//----------------------------------------

function apriPlay(playId) {
  var url = 'infoPlaylist.html?id=' + encodeURIComponent(playId);
  window.open(url, '_self');
}

//------------------------------------------------------------------------------------

//---------------------------------Funzioni Avvio Pagine------------------------------

async function avvio(){
  await ottieniApi()
  getTracks()
  getArtist()
  getPodcasts()
  changeName()
  changeSurname()
}

//----------------------------------------

async function avvioSong(){
  await ottieniApi()
  getAlbumFromTrack()
}

//----------------------------------------

async function avvioAlbum(){
  await ottieniApi();
  albumDaURL()
}

//----------------------------------------

async function avvioArtista(){
  await ottieniApi()
  artistaDaURL();
}

//----------------------------------------

async function startPodcast(){
  await ottieniApi()
  podcastDaURL()
}

//----------------------------------------

async function avvioEpisodio(){
  await ottieniApi()
  episodioDaURL()
}

//----------------------------------------

async function avviaPlay(){
  await ottieniApi()
  getSongPlay()
}

//------------------------------------------------------------------------------------

//--------------------------------------Funzioni GET----------------------------------

async function getTracks() {
  try {
    const randomOffset = Math.floor(Math.random() * 1000);
    const randomLimit = 5;
    if (!currentTrack) {
      linkedListTrack.append(randomOffset);
      currentTrack = linkedListTrack.head;
    } else {
      linkedListTrack.append(randomOffset);
      currentTrack = currentTrack.next;
    }
    const response = await fetch(`https://api.spotify.com/v1/search?q=track&type=track&limit=${randomLimit}&offset=${randomOffset}`, {
      headers: {
        'Authorization': 'Bearer ' + accessToken
      }
    });
    const data = await response.json();
    const tracks = data.tracks.items;
    mostraCanzoni(tracks);
  } catch (error) {
    console.log('Errore nella richiesta delle tracce:', error);
  }
}

//----------------------------------------

async function getArtist() {
  try {
    const randomOffset = Math.floor(Math.random() * 90);
    if (!currentArtist) {
      linkedListArtisti.append(randomOffset);
      currentArtist = linkedListArtisti.head;
    } else {
      linkedListArtisti.append(randomOffset);
      currentArtist = currentArtist.next;
    }
    const response = await fetch(`https://api.spotify.com/v1/search?q=artist&type=artist&limit=5&offset=${randomOffset}&market=IT`, {
      headers: {
        'Authorization': 'Bearer ' + accessToken
      }
    });
    const data = await response.json();
    const artisti = data.artists.items;
    mostraArtisti(artisti);
  } catch (error) {
    console.log('Errore nella richiesta dei podcast:', error);
  }
}

//----------------------------------------

async function getPodcasts() {
  try {
    const randomOffset = Math.floor(Math.random() * 100);
    if (!currentPodcast) {
      linkedListPodcast.append(randomOffset);
      currentPodcast = linkedListPodcast.head;
    } else {
      linkedListPodcast.append(randomOffset);
      currentPodcast = currentPodcast.next;
    }
    const response = await fetch(`https://api.spotify.com/v1/search?q=all&type=show&limit=5&offset=${randomOffset}&market=IT`, {
      headers: {
        'Authorization': 'Bearer ' + accessToken
      }
    });
    const data = await response.json();
    const podcasts = data.shows.items;
    mostraPodcasts(podcasts);
  } catch (error) {
    console.log('Errore nella richiesta dei podcast:', error);
  }
}

//----------------------------------------

async function getPodcastFromId(id){
  try {
    var url = 'https://api.spotify.com/v1/shows/' + encodeURIComponent(id) + "?market=IT"
    const response = await fetch(url, {
      headers: {
        'Authorization': 'Bearer ' + accessToken
      }
    });
    const data = await response.json();
    mostraInfoPodcast2(data);
    getEpisodes(id)
  } catch (error) {
    console.log('Errore nella richiesta della traccia:', error);
  }
}

//----------------------------------------

async function getEpisodes(id){
  try {
    var url = 'https://api.spotify.com/v1/shows/' + encodeURIComponent(id) + "/episodes?market=IT&limit=5"
    const response = await fetch(url, {
      headers: {
        'Authorization': 'Bearer ' + accessToken
      }
    });
    const data = await response.json();
    mostraEpisodes(data);
  } catch (error) {
    console.log('Errore nella richiesta della traccia:', error);
  }
}

//----------------------------------------

async function getUserPlay() {
  try {
    var id = JSON.parse(localStorage.getItem('user')).playlist;
    var playlists = [];

    for (let idPlay of id) {
      var url = "http://127.0.0.1:3100/getPlayInfo/" + idPlay;

      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await response.json();
      playlists.push(data);
    }

    mostraUserPlay(playlists);
  } catch (error) {
    console.error('Errore durante la richiesta delle playlist:', error);
  }
}

//----------------------------------------

async function getArtistaFromId(id){
  try {
    var url = 'https://api.spotify.com/v1/artists/' + encodeURIComponent(id)
    const response = await fetch(url, {
      headers: {
        'Authorization': 'Bearer ' + accessToken
      }
    });
    const data = await response.json();
    mostraInfoArtista2(data);
  } catch (error) {
    console.log('Errore nella richiesta della traccia:', error);
  }
}

//----------------------------------------

async function cercaAlbum(nome){
  try {
    const response = await fetch(`https://api.spotify.com/v1/search?q=artist:${nome}&type=album&limit=5`, {
      headers: {
        'Authorization': 'Bearer ' + accessToken
      }
    });
    const data = await response.json();
    mostraInfoAlbumDaArtista(data.albums);
  } catch (error) {
    console.log('Errore nella richiesta della traccia:', error);
  }
}

//----------------------------------------

async function getEpisodeFromId(id){
  try {
    var url = 'https://api.spotify.com/v1/episodes/' + encodeURIComponent(id) + '?market=IT'
    const response = await fetch(url, {
      headers: {
        'Authorization': 'Bearer ' + accessToken
      }
    });
    const data = await response.json();
    mostraEpisodio(data);
  } catch (error) {
    console.log('Errore nella richiesta della traccia:', error);
  }
}

//----------------------------------------

async function getEpisode(id){
  try {
    var url = 'https://api.spotify.com/v1/episodes/' + encodeURIComponent(id) + '?market=IT'
    const response = await fetch(url, {
      headers: {
        'Authorization': 'Bearer ' + accessToken
      }
    });
    const data = await response.json();
    return data
  } catch (error) {
    console.log('Errore nella richiesta della traccia:', error);
  }
}

//----------------------------------------

function getPlaylistPubbliche() {
  var url = "http://127.0.0.1:3100/getplaypub/";

  fetch(url, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' }
  })
    .then(response => response.json())
    .then(data => {
      mostraPlaylist2(data)
    })
    .catch(error => {
      console.error('Errore durante la richiesta playlist:', error);
    });
}

//----------------------------------------

async function getSongPlay() {
  var id = playIdDaURL()
   var url = "http://127.0.0.1:3100/getPlayInfo/" + id;
 
   fetch(url, {
     method: 'GET',
     headers: { 'Content-Type': 'application/json' }
   })
     .then(response => response.json())
     .then(data => {
       mostraInfoPlay(data)
       braniPlay = data
       mostraCanzoniPlay(braniPlay)
     })
     .catch(error => {
       console.error('Errore durante la richiesta playlist:', error);
     });
 }

//----------------------------------------

async function getAlbumFromId2(albumId) {
  try {
    var url = 'https://api.spotify.com/v1/albums/' + encodeURIComponent(albumId)
    const response = await fetch(url, {
      headers: {
        'Authorization': 'Bearer ' + accessToken
      }
    });
    const data = await response.json();
    mostraInfoAlbum2(data);
  } catch (error) {
    console.log('Errore nella richiesta della traccia:', error);
  }
}

//----------------------------------------

async function getAlbumFromTrack(){
  var trackId =  await trackDaURL()
  try{
    var url= 'https://api.spotify.com/v1/tracks/' + encodeURIComponent(trackId)
    const response = await fetch(url, {
      headers: {
        'Authorization': 'Bearer ' + accessToken
      }
    });
    const data = await response.json();
    mostraInfo(data);
  } catch (error) {
    console.log('Errore nella richiesta della traccia:', error);
  }
}

//----------------------------------------

async function getTracksValue(value) {
  try {
    currentTrack=currentTrack.next
    const response = await fetch(`https://api.spotify.com/v1/search?q=track&type=track&limit=5&offset=${value}`, {
      headers: {
        'Authorization': 'Bearer ' + accessToken
      }
    });
    const data = await response.json();
    const tracks = data.tracks.items;
    mostraCanzoni(tracks);
  } catch (error) {
    console.log('Errore nella richiesta delle tracce:', error);
  }
}

//----------------------------------------

async function getPodcastValue(value) {
  try {
    currentPodcast = currentPodcast.next
    const response = await fetch(`https://api.spotify.com/v1/search?q=all&type=show&limit=5&offset=${value}&market=IT`, {
      headers: {
        'Authorization': 'Bearer ' + accessToken
      }
    });
    const data = await response.json();
    const podcasts = data.shows.items;
    mostraPodcasts(podcasts);
  } catch (error) {
    console.log('Errore nella richiesta dei podcast:', error);
  }
}

//----------------------------------------

async function getArtistValue(value) {
  try {
    currentArtist = currentArtist.next
    const response = await fetch(`https://api.spotify.com/v1/search?q=a&type=artist&limit=5&offset=${value}&market=IT`, {
      headers: {
        'Authorization': 'Bearer ' + accessToken
      }
    });
    const data = await response.json();
    const artisti = data.artists.items;
    mostraArtisti(artisti);
  } catch (error) {
    console.log('Errore nella richiesta dei podcast:', error);
  }
}


//----------------------------------------

async function getPodcastValueSX(value) {
  try {
    currentPodcast = currentPodcast.prec
    const response = await fetch(`https://api.spotify.com/v1/search?q=all&type=show&limit=5&offset=${value}&market=IT`, {
      headers: {
        'Authorization': 'Bearer ' + accessToken
      }
    });
    const data = await response.json();
    const podcasts = data.shows.items;
    mostraPodcasts(podcasts);
  } catch (error) {
    console.log('Errore nella richiesta dei podcast:', error);
  }
}

//----------------------------------------

async function getArtistValueSX(value) {
  try {
    currentArtist = currentArtist.prec
    const response = await fetch(`https://api.spotify.com/v1/search?q=a&type=artist&limit=5&offset=${value}&market=IT`, {
      headers: {
        'Authorization': 'Bearer ' + accessToken
      }
    });
    const data = await response.json();
    const artisti = data.artists.items;
    mostraArtisti(artisti);
  } catch (error) {
    console.log('Errore nella richiesta dei podcast:', error);
  }
}

//----------------------------------------

async function getTracksValueSX(value) {
  try {
    currentTrack = currentTrack.prec
    const response = await fetch(`https://api.spotify.com/v1/search?q=track&type=track&limit=5&offset=${value}`, {
      headers: {
        'Authorization': 'Bearer ' + accessToken
      }
    });
    const data = await response.json();
    const tracks = data.tracks.items;
    mostraCanzoni(tracks);
  } catch (error) {
    console.log('Errore nella richiesta delle tracce:', error);
  }
}

//----------------------------------------

async function getAlbumFromId(albumId){
  try {
    var url = 'https://api.spotify.com/v1/albums/' + encodeURIComponent(albumId)
    const response = await fetch(url, {
      headers: {
        'Authorization': 'Bearer ' + accessToken
      }
    });
    const data = await response.json();
    mostraInfoAlbum(data);
  } catch (error) {
    console.log('Errore nella richiesta della traccia:', error);
  }
}

//----------------------------------------

function getPlaylist() {
  var user = JSON.parse(localStorage.getItem('user'));
  var url = "http://127.0.0.1:3100/getplay/" + user._id;

  fetch(url, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' }
  })
    .then(response => response.json())
    .then(data => {
      mostraPlaylist(data)
    })
    .catch(error => {
      console.error('Errore durante la richiesta playlist:', error);
    });
}

//----------------------------------------

async function getCanzone(canzone){
  try {
    var url = 'https://api.spotify.com/v1/tracks/' + encodeURIComponent(canzone)
    const response = await fetch(url, {
      headers: {
        'Authorization': 'Bearer ' + accessToken
      }
    });
    const data = await response.json();
    if (response.ok){
      return data
    } else {
      return {status: 404}
    }
  } catch (error) {
    console.log('Errore nella richiesta della traccia:', error);
  }
}

//------------------------------------------------------------------------------------

//-------------------------Funzioni Mostra (mostrano i risultati delle get)-----------

function mostraCanzoni(tracks) {
  var container = document.getElementById("songRow");
  var card = document.getElementById("cardSong");
  container.innerHTML = ""
  container.append(card)

  tracks.forEach(track => {
    var clone = card.cloneNode(true);

    clone.getElementsByClassName('card-title')[0].innerHTML = track.name;
    clone.getElementsByClassName('card-img-top')[0].src = track.album.images[0].url;
    clone.setAttribute('songId', track.id) 

    clone.classList.remove('d-none');

    container.appendChild(clone);
  });
}

//----------------------------------------

function mostraPodcasts(podcasts) {
  var container = document.getElementById("podcastRow");
  var card = document.getElementById("cardPodcast");
  container.innerHTML = ""
  container.append(card)

  podcasts.forEach(podcast => {
    var clone = card.cloneNode(true);

    clone.getElementsByClassName('card-title')[0].innerHTML = podcast.name;
    clone.getElementsByClassName('card-img-top')[0].src = podcast.images[0].url;
    clone.setAttribute('podcastId', podcast.id)

    clone.classList.remove('d-none');

    container.appendChild(clone);
  });
}

//----------------------------------------

function mostraArtisti(artists) {
  var container = document.getElementById("artistRow");
  var card = document.getElementById("cardArtist");
  container.innerHTML = ""
  container.append(card)

  
  artists.forEach(artist => {
    var clone = card.cloneNode(true);
    
    clone.getElementsByClassName('card-title')[0].innerHTML = artist.name;
    clone.getElementsByClassName('card-img-top')[0].src = artist.images[0].url;
    clone.setAttribute('artistaId', artist.id)
    
    clone.classList.remove('d-none');
    container.appendChild(clone);
  }); 
}

//----------------------------------------

function mostraRisultati(risultati){
  var container = document.getElementById("rigaRisultati");
  var riga = document.getElementById("songRow")
  container.innerHTML = ""
  container.append(riga)

  risultati.albums.items.forEach(risultato => {
    var clone = riga.cloneNode(true);

    clone.getElementsByClassName('col-6')[0].innerHTML = "<h4 class=\"text-truncate\">Album: " + risultato.name + "</h4>";
    clone.getElementsByClassName('col-6')[1].innerHTML = "<h4 class=\"text-truncate\">" + risultato.artists[0].name + "</h4>";

    clone.getElementsByClassName('col-6')[0].setAttribute('onclick', `apriAlbum('${risultato.id}')`)
    clone.getElementsByClassName('col-6')[1].setAttribute ('onclick', `apriArtista('${risultato.artists[0].id}')`)

    clone.classList.remove('d-none');
    container.appendChild(clone);
  });

  risultati.tracks.items.forEach(risultato => {
    var clone = riga.cloneNode(true);

    clone.getElementsByClassName('col-6')[0].innerHTML = "<h4 class=\"text-truncate\"> Track: " + risultato.name + "</h4>";
    clone.getElementsByClassName('col-6')[1].innerHTML = "<h4 class=\"text-truncate\">" + risultato.artists[0].name + "</h4>";

    clone.getElementsByClassName('col-6')[0].setAttribute('onclick', `apriCanzone('${risultato.id}')`)
    clone.getElementsByClassName('col-6')[1].setAttribute('onclick', `apriArtista('${risultato.artists[0].id}')`)
    clone.classList.remove('d-none');
    container.appendChild(clone);
  });

  risultati.artists.items.forEach(risultato => {
    var clone = riga.cloneNode(true);

    clone.getElementsByClassName('col-6')[0].innerHTML = "<h4 class=\"text-truncate\">Artista: " + risultato.name + "</h4>";
    clone.getElementsByClassName('col-6')[1].remove

    clone.getElementsByClassName('col-6')[0].setAttribute('onclick', `apriArtista('${risultato.id}')`)

    clone.classList.remove('d-none');
    container.appendChild(clone);
  });

  risultati.shows.items.forEach(risultato => {
    var clone = riga.cloneNode(true);

    clone.getElementsByClassName('col-6')[0].innerHTML = "<h4 class=\"\">Podcast: " + risultato.name + " podcast</h4>";
    clone.getElementsByClassName('col-6')[1].remove

    clone.getElementsByClassName('col-6')[0].setAttribute('onclick', `apriPodcast('${risultato.id}')`)

    clone.classList.remove('d-none');
    container.appendChild(clone);
  });

  risultati.episodes.items.forEach(risultato => {
    var clone = riga.cloneNode(true);

    clone.getElementsByClassName('col-6')[0].innerHTML = "<h4 class=\"\">Episodio: " + risultato.name + " podcast</h4>";
    clone.getElementsByClassName('col-6')[1].remove

    clone.getElementsByClassName('col-6')[0].setAttribute('onclick', `apriEpisodio('${risultato.id}')`)
    clone.classList.remove('d-none');
    container.appendChild(clone);
  });
}

//----------------------------------------

function mostraInfoPodcast2(data){
  var nome = document.getElementById('nome')
  var descrizione = document.getElementById('descrizione')
  var foto = document.getElementById('foto')
  
  nome.innerHTML= "<h3>" + data.name + "</h3>"
  descrizione.innerHTML = data.html_description
  foto.src=data.images[0].url


}

//----------------------------------------

function mostraEpisodes(data){
  var container = document.getElementById("rigaCard");
  var card = document.getElementById("cardEpisode");
  container.innerHTML = ""

  var sx = document.getElementById('SX')
  var dx = document.getElementById('DX')

  sx.setAttribute('linkPrev', data.previous)
  dx.setAttribute('linkNext', data.next)

  data.items.forEach(episodio => {
    var clone = card.cloneNode(true);

    clone.getElementsByClassName('card-title')[0].innerHTML = episodio.name;
    clone.getElementsByClassName('card-img-top')[0].src = episodio.images[0].url;
    clone.setAttribute('episodeId', episodio.id)

    clone.classList.remove('d-none');
    container.appendChild(clone);
  });  
}

//----------------------------------------

function mostraEpisodio(data){

  var foto = document.getElementById("foto")
  var nome = document.getElementById("nomeShow")
  var episodio = document.getElementById("nomeEpisodio")
  var dataUscita = document.getElementById("dataUscita")
  var trama = document.getElementById("containerTrama")

  foto.src=data.images[0].url
  nome.innerHTML="<h3>"+ data.show.name +"</h3>"
  episodio.innerHTML="<h3>"+ data.name +"</h3>"
  dataUscita.innerHTML= "<h3>"+ data.release_date +"</h3>"
  trama.innerHTML=data.html_description

}

//----------------------------------------

function mostraPlaylist(data){
  var container = document.getElementById("containerPlaylist");
  var play = document.getElementById("rigaPlaylist");
  container.innerHTML = ""
  data.forEach(playlist => {
    var clone = play.cloneNode(true);
    clone.getElementsByClassName('col-6')[0].setAttribute("playlistId", playlist._id)
    clone.getElementsByClassName('col-6')[0].innerHTML += "<h4>" + playlist.name + "</h4>";

    clone.getElementsByClassName('btn')[0].setAttribute("playlistId", playlist._id)

    clone.classList.remove('d-none');
    container.appendChild(clone);
  });
}

//----------------------------------------

function mostraPlaylist2(data) {
  var container = document.getElementById("containerPlaylist");
  var play = document.getElementById("rigaPlaylist");
  container.innerHTML = ""
  var counter = 0;
  data.forEach(playlist => {
    var clone = play.cloneNode(true);
    clone.setAttribute("playlistId", playlist._id)
    clone.getElementsByClassName('col-4')[0].id = "nome" + counter
    clone.getElementsByClassName('col-4')[0].innerHTML += "<h4>" + playlist.name + "</h4>";
    clone.getElementsByClassName('btn')[0].setAttribute("onclick", `addPlay(${clone.id}.getAttribute(\"playlistId\"))`)
    clone.getElementsByClassName('btn')[1].setAttribute("onclick", `apriPlay(${clone.id}.getAttribute(\"playlistId\"))`) 
    container.appendChild(clone);
    clone.classList.remove('d-none');
    counter+= 1 
  });
}

//----------------------------------------

async function mostraUserPlay(playId) {
  var container = document.getElementById("rigaPlaylist");
  var nome = document.getElementById("playlistInfo");
  container.innerHTML = ""
  container.append(nome)
  var counter = 0;
  playId.forEach(async playlist => {
    var clone = nome.cloneNode(true);
    clone.getElementsByClassName('col-6')[0].setAttribute("playlistId", playlist._id)
    clone.getElementsByClassName('col-6')[0].setAttribute("id", "nomePlaylist" + counter) 
    clone.getElementsByClassName('col-6')[0].innerHTML += "<h4>" + playlist.name + "</h4>";
    clone.getElementsByClassName('btn')[1].setAttribute("onclick", `deletePlaylistPriv(${clone.getElementsByClassName('col-6')[0].id}.getAttribute(\"playlistId\"))`)
    clone.getElementsByClassName('btn')[0].setAttribute("onclick", `apriPlay(${clone.getElementsByClassName('col-6')[0].id}.getAttribute(\"playlistId\"))`) 
    clone.classList.remove('d-none');
    container.appendChild(clone);
    counter += 1 
  })
}

//----------------------------------------

function mostraInfoArtista2(artist) {
  var nome = document.getElementById('nomeArtista')
  var follower = document.getElementById('follower')
  var genereArtista = document.getElementById('genereArtista')
  var foto = document.getElementById('fotoArtista')
  var generi = ""

  artist.genres.forEach(gen=>{
    generi += gen
  })

  nome.innerHTML= "<h3>" + artist.name + "</h3>"
  follower.innerHTML = "<h3>" + artist.followers.total + "</h3>"
  genereArtista.innerHTML = "<h3>" + generi + "</h3>"
  foto.src=artist.images[0].url

  cercaAlbum(artist.name)
}

//----------------------------------------

function mostraInfoAlbumDaArtista(data){
  var container = document.getElementById("contenitoreCard");
  var card = document.getElementById("cardAlbum");
  container.innerHTML = ""
  container.append(card)
  var sx = document.getElementById('SX')
  var dx = document.getElementById('DX')

  sx.setAttribute('linkPrev', data.previous)
  dx.setAttribute('linkNext', data.next)


  data.items.forEach(album => {
    var clone = card.cloneNode(true);

    clone.getElementsByClassName('card-title')[0].innerHTML = album.name;
    clone.getElementsByClassName('card-img-top')[0].src = album.images[0].url;
    clone.setAttribute('albumId', album.id)

    clone.classList.remove('d-none');
    container.appendChild(clone);
  });
}

//----------------------------------------

async function mostraCanzoniPlay(playData){
  var container = document.getElementById("songRow");
  var card = document.getElementById("cardSong");
  var autId = playData.creatoreID
  var loggedUser = JSON.parse(localStorage.getItem('user'))._id
  container.innerHTML = ""
  container.append(card)

  var startIndex = pagAtt * 5; 
  var endIndex = startIndex + 5; 

  
  if (endIndex > playData.length) {
    endIndex = playData.length;
  }
  
  for ( var i = startIndex; i < endIndex ; i ++){
    var clone = card.cloneNode(true);
    track = await getCanzone(playData.braniID[i])

    if (track.status === 404){
      track = await getEpisode(playData.braniID[i])

      clone.getElementsByClassName('card-title')[0].innerHTML = track.name;
      clone.getElementsByClassName('card-img-top')[0].src = track.images[0].url;
      clone.querySelector('img').setAttribute('songId', track.id)
      clone.querySelector('img').setAttribute('onclick', 'apriEpisodio(this.getAttribute(\'songId\'))')
      clone.getElementsByClassName('btn')[0].setAttribute('songId', track.id)
    } else {

      clone.getElementsByClassName('card-title')[0].innerHTML = track.name;
      clone.getElementsByClassName('card-img-top')[0].src = track.album.images[0].url;
      clone.querySelector('img').setAttribute('songId', track.id)
      clone.getElementsByClassName('btn')[0].setAttribute('songId', track.id)
    }

    if (loggedUser != autId){
      clone.getElementsByClassName('btn')[0].remove()
    }
    clone.classList.remove('d-none');

    container.appendChild(clone);
  }
}

//----------------------------------------

async function mostraInfoPlay(info){
  var nomePlaylist = document.getElementById("nom");
  var autorePlaylist = document.getElementById("aut");
  var autId = info.creatoreID
  var loggedUser = JSON.parse(localStorage.getItem('user'))._id
  
  if (info.pubblica){
    bottone = document.getElementById('pubblicaButton')
    bottone.innerHTML = "Rendi Privata"
  }

  if (loggedUser != autId){
    bottone = document.getElementById('pubblicaButton')
    rinomina = document.getElementById('aggiorna')
    bottone.remove()
    rinomina.remove()
  }


  nomePlaylist.innerHTML = ""
  autorePlaylist.innerHTML = ""

  nomePlaylist.innerHTML = info.name
  autorePlaylist.innerHTML = info.creatoreName + " " + info.creatoreSurname 
}

//----------------------------------------

function mostraInfoAlbum2(data) {
  var titolo = document.getElementById("nome");
  var autore = document.getElementById("autore")
  var dataUscita = document.getElementById("dataUscita")
  var card = document.getElementById("canzoni")
  container = document.getElementById("canzoniAlbum")
  var immagine = document.getElementById("immagine")
  container.innerHTML = ""
  container.append(card)
  data.artists.forEach(art=>{
    autore.innerHTML += "<h3 onClick=\"apriArtista(this.getAttribute('artistId')) \" artistId=" + art.id + ">" + art.name + "</h3>"
  })

  titolo.innerHTML="<h3>" + data.name + "</h3>"
  dataUscita.innerHTML="<h3>" + data.release_date + "</h3>"
  immagine.src=data.images[0].url;

  data.tracks.items.forEach(track => {
    var clone = card.cloneNode(true);

    clone.innerHTML = "<h4>" + track.name + "</h4>";
    clone.setAttribute('songId', track.id)
    clone.classList.remove('d-none');

    container.appendChild(clone);
  });
}

//----------------------------------------

function mostraInfo(track){
  var titolo = document.getElementById("titoloCanzone");
  var album = document.getElementById("titoloAlbum");
  var artista = document.getElementById("nomeArtista");
  var artisti = "";
  var foto = document.getElementById("copertina")
  album.setAttribute('albumId', track.album.id)
  foto.setAttribute('albumId', track.album.id)
  titolo.innerHTML = "<h3>" + track.name + "</h3>";
  album.innerHTML = "<h3>" + track.album.name + "</h3>";
  track.artists.forEach(art=>{
    artista.innerHTML += "<h3 onClick=\"apriArtista(this.getAttribute('artistId')) \" artistId="+ art.id +">" + art.name + "</h3>"
    artisti = artisti + art.name
  })
  foto.src=track.album.images[0].url;
  getAlbumFromId(track.album.id);
  

}

//----------------------------------------

function mostraInfoAlbum(data){
  var container = document.getElementById("album");
  var card = document.getElementById("canzoniAlbum");
  container.innerHTML = ""
  container.append(card)

  data.tracks.items.forEach(track => {
    var clone = card.cloneNode(true);

    clone.innerHTML = "<h4>"+ track.name +"</h4>";
    clone.setAttribute('songId', track.id) 
    clone.classList.remove('d-none');

    container.appendChild(clone);
  });
}

//----------------------------------------

function mostraInfoUser(){
  var name = document.getElementById("inputNome")
  var surname = document.getElementById("inputCognome")
  var email = document.getElementById('inputEmail')
  var password = document.getElementById('inputPassword')

  name.value = JSON.parse(localStorage.getItem('user')).name
  surname.value = JSON.parse(localStorage.getItem('user')).surname
  email.value = JSON.parse(localStorage.getItem('user')).email
  password.value = JSON.parse(localStorage.getItem('user')).password
}

//------------------------------------------------------------------------------------

//--------------------------Funzioni che prendono dati da URL-------------------------

function trackDaURL() {
  var queryString = window.location.search;

  queryString = queryString.substr(1);

  var parametri = queryString.split('&');

  var id = null;
  parametri.forEach(function (parametro) {
    var coppia = parametro.split('=');
    if (coppia[0] === 'id') {
      id = decodeURIComponent(coppia[1]);
    }
  });

  return id
}

//----------------------------------------

function albumDaURL() {
  var queryString = window.location.search;

  queryString = queryString.substr(1);

  var parametri = queryString.split('&');

  var id = null;
  parametri.forEach(function (parametro) {
    var coppia = parametro.split('=');
    if (coppia[0] === 'id') {
      id = decodeURIComponent(coppia[1]);
    }
  });

  getAlbumFromId2(id);
}

//----------------------------------------

function artistaDaURL() {
  var queryString = window.location.search;

  queryString = queryString.substr(1);

  var parametri = queryString.split('&');

  var id = null;
  parametri.forEach(function (parametro) {
    var coppia = parametro.split('=');
    if (coppia[0] === 'id') {
      id = decodeURIComponent(coppia[1]);
    }
  });

  getArtistaFromId(id);
}

//----------------------------------------

function podcastDaURL() {
  var queryString = window.location.search;

  queryString = queryString.substr(1);

  var parametri = queryString.split('&');

  var id = null;
  parametri.forEach(function (parametro) {
    var coppia = parametro.split('=');
    if (coppia[0] === 'id') {
      id = decodeURIComponent(coppia[1]);
    }
  });

  getPodcastFromId(id);
}

//----------------------------------------

function episodioDaURL() {
  var queryString = window.location.search;

  queryString = queryString.substr(1);

  var parametri = queryString.split('&');

  var id = null;
  parametri.forEach(function (parametro) {
    var coppia = parametro.split('=');
    if (coppia[0] === 'id') {
      id = decodeURIComponent(coppia[1]);
    }
  });
  getEpisodeFromId(id);
}

//----------------------------------------

function playIdDaURL() {
  var queryString = window.location.search;
  queryString = queryString.substr(1);
  var parametri = queryString.split('&');
  var id = null;
  parametri.forEach(function (parametro) {
    var coppia = parametro.split('=');
    if (coppia[0] === 'id') {
      id = decodeURIComponent(coppia[1]);
    }
  });
  return id;
}

//------------------------------------------------------------------------------------

//-----------------------------Funzioni movimento menù--------------------------------

function destraTrack(){
  if(currentTrack.next === null){
    getTracks();
  } else {
    getTracksValue(currentTrack.next.data)
  }
}

//----------------------------------------

function destraPodcast() {
  if (currentPodcast.next === null) {
    getPodcasts();
  } else {
    getPodcastValue(currentPodcast.next.data)
  }
}

//----------------------------------------

function destraArtista() {
  if (currentArtist.next === null) {
    getArtist();
  } else {
    getArtistValue(currentArtist.next.data)
  }
}

//----------------------------------------

function sinistraTrack() {
  if (currentTrack.prec !== null) {
    getTracksValueSX(currentTrack.prec.data)
  }
}

//----------------------------------------

function sinistraPodcast() {
  if (currentPodcast.prec !== null) {
    getPodcastValueSX(currentPodcast.prec.data)
  }
}

//----------------------------------------

function sinistraArtista() {
  if (currentArtist.prec !== null) {
    getArtistValueSX(currentArtist.prec.data)
  }
}

//----------------------------------------

async function destraAlbumLink(link){
  try {
    const response = await fetch(link, {
      headers: {
        'Authorization': 'Bearer ' + accessToken
      }
    });
    const data = await response.json();
    mostraInfoAlbumDaArtista(data.albums);
  } catch (error) {
    console.log('Errore nella richiesta della traccia:', error);
  }
}

//----------------------------------------

async function sinistraAlbumLink(link) {
  try {
    const response = await fetch(link, {
      headers: {
        'Authorization': 'Bearer ' + accessToken
      }
    });
    const data = await response.json();
    mostraInfoAlbumDaArtista(data.albums);
  } catch (error) {
    console.log('Errore nella richiesta della traccia:', error);
  }
}

//----------------------------------------

async function destraPodcastLink(link){
  try {
    const response = await fetch(link, {
      headers: {
        'Authorization': 'Bearer ' + accessToken
      }
    });
    const data = await response.json();
    mostraEpisodes(data);
  } catch (error) {
    console.log('Errore nella richiesta della traccia:', error);
  }
}

//----------------------------------------

async function sinistraPodcastLink(link) {
  try {
    const response = await fetch(link, {
      headers: {
        'Authorization': 'Bearer ' + accessToken
      }
    });
    const data = await response.json();
    mostraEpisodes(data);
  } catch (error) {
    console.log('Errore nella richiesta della traccia:', error);
  }
}

//----------------------------------------

async function paginaDestra(){
  if (pagAtt < Math.ceil(braniPlay.braniID.length / 5)-1){
    pagAtt ++
    mostraCanzoniPlay(braniPlay) 
  }
}

//----------------------------------------

async function paginaSinistra(){
  if (pagAtt > 0){
    pagAtt --
    await mostraCanzoniPlay(braniPlay) 
  }
}

//------------------------------------------------------------------------------------

//----------------------------Funzione Gestione Playlist------------------------------

function deletePlaylistPriv(id) {
  var user = JSON.parse(localStorage.getItem('user'));
  var url = "http://127.0.0.1:3100/delPlay/" + id + "/" + user._id;

  fetch(url, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' }
  })
    .then(response => response.json())
    .then(logged_user => {
      localStorage.setItem("user", JSON.stringify(logged_user));
      location.reload();
    })
    .catch(error => {
      console.error('Errore durante la cancellazione dell\'account:', error);
    });
}

//----------------------------------------

function creaPlaylist() {
  var name = document.getElementById('nomeNuovaPlaylist').value;
  var creatore = JSON.parse(localStorage.getItem('user'));

  playlist = {
    name: name,
    creatoreID: creatore._id,
    creatoreName: creatore.name,
    creatoreSurname: creatore.surname
  };
  fetch("http://127.0.0.1:3100/newplay", {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(playlist)
  })
    .then(response => response.json())
    .then(logged_user => {
      localStorage.setItem("user", JSON.stringify(logged_user));
      location.reload();
    })
    .catch(error => {
      console.error('Errore durante la creazione della playlist:', error);
    });
}

//----------------------------------------

function addPlay(playId){
  var user = JSON.parse(localStorage.getItem('user'));
  var url = `http://127.0.0.1:3100/playpubadd/${user._id}/${playId}`;

  fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' }
  })
  .then(response => {
    if (response.ok) {
      return response.json();
    } else {
      throw new Error('Errore durante la richiesta add playlist');
    }
  })
  .then(logged_user => {
    localStorage.setItem("user", JSON.stringify(logged_user));
    alert('Playlist aggiunta con successo!');
  })
  .catch(error => {
    console.error('Errore durante la richiesta add playlist:', error);
    alert('Si è verificato un errore durante l\'aggiunta della playlist.');
  });
}

//----------------------------------------

function pubblica(){
  var id = playIdDaURL()
  fetch("http://127.0.0.1:3100/playvisibility/" + id, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
  }).then(function(response) {
    if (response.ok) {
      location.reload();
    } else {
      console.error('Si è verificato un errore durante la richiesta.');
    }
  }).catch(function(error) {
    console.error('Si è verificato un errore di rete.', error);
  });
}

//----------------------------------------

function deleteSong(songId) {
  var id = playIdDaURL()

  var url = "http://127.0.0.1:3100/deleteSong/" + id + "/" + songId;

  fetch(url, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' }
  })
    .then(response => {
      console.log(response)
      response.json()
      location.reload();
    
    })
    .catch(error => {
      console.error('Errore durante la cancellazione dell\'account:', error);
    });
}

//----------------------------------------

function updateName(){
  var id = playIdDaURL() 
  var name = document.getElementById("nuovoNome").value
  fetch("http://127.0.0.1:3100/playname/" + id + "/" + name, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
  }).then(function(response) {
    if (response.ok) {
      location.reload();
    } else {
      console.error('Si è verificato un errore durante la richiesta.');
    }
  }).catch(function(error) {
    console.error('Si è verificato un errore di rete.', error);
  });

}

//----------------------------------------

function goToAggiungi() {
  songId=trackDaURL()
  var url = 'aggiuntaAplaylist.html?id=' + encodeURIComponent(songId);
  window.open(url, '_self');
}

//----------------------------------------

function aggiungi(playId) {
  var id = trackDaURL()
  fetch(`http://127.0.0.1:3100/addSong/${playId}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
  }) .then(response => {
    if (response.ok) {
      alert('Canzone aggiunta con successo!');
    } else {
      alert('Si è verificato un errore durante l\'aggiunta della canzone.');
    }
  })
}

//------------------------------------------------------------------------------------

//--------------------------------Funzioni gestione utente----------------------------

async function changeName(){
  if (localStorage.getItem('user') != null) {
    var user = JSON.parse(localStorage.getItem('user'))
  }
  var nome = document.getElementById("name");
  nome.innerHTML=user.name

}

//----------------------------------------

async function changeSurname() {
  if (localStorage.getItem('user') != null) {
    var user = JSON.parse(localStorage.getItem('user'))
  }
  var surname = document.getElementById("surname");
  surname.innerHTML = user.surname

}

//----------------------------------------

function abilitaModifica(inputId) {
  var myInput = document.getElementById(inputId);
  myInput.readOnly = false;
  myInput.classList.remove("readonly");
  myInput.focus();
}

//----------------------------------------

function cancellaAccount() {
  var user = JSON.parse(localStorage.getItem('user'));
  var url = "http://127.0.0.1:3100/delete/" + user._id;

  fetch(url, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(user)
  })
    .then(response => response.json())
    .then(() => {
      localStorage.removeItem('user');
      window.location.href = "index.html";
    })
    .catch(error => {
      console.error('Errore durante la cancellazione dell\'account:', error);
    });
}

//----------------------------------------

function modificaAccount(){
  var name = document.getElementById("inputNome").value
  var surname = document.getElementById("inputCognome").value
  var email = document.getElementById('inputEmail').value.toLowerCase()
  var password = document.getElementById('inputPassword')
  user = {
    name: name,
    surname: surname,
    email: email,
    password: password.value
  }
  fetch("http://127.0.0.1:3100/users/" + JSON.parse(localStorage.getItem('user'))._id, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(user)
  })
    .then(response => response.json())
    .then(logged_user => {
     localStorage.setItem("user", JSON.stringify(logged_user)) 
    } 

    )
}

//----------------------------------------

function verificaPassword(){
  var password = document.getElementById('password')
  var newPassword = document.getElementById('newPassword')
  var rePassword = document.getElementById('rePassword')
  var inputPassword = document.getElementById('inputPassword')

  if (inputPassword.value === generateMD5Hash(password.value) && newPassword.value === rePassword.value){
    inputPassword.value = newPassword.value
  }
}

//------------------------------------------------------------------------------------

//----------------------------------Funzione di registrazione-------------------------

function registrati() {
  var name = document.getElementById("inputName").value
  var surname = document.getElementById("inputSurname").value
  var email = document.getElementById('inputEMail').value.toLowerCase()
  var password = document.getElementById('inputPassword').value
  var rePassword = document.getElementById('inputRePassword').value
  var checkbox = document.getElementById('checkCondizioni').checked

  if (name === ""){
    alert("Inserire il nome")
  } else if (surname === ""){
    alert("Inserire il cognome")
  } else if (email === ""){
    alert("Inserire l'email")
  } else if (password === ""){
    alert("Inserire la password")
  } else if (rePassword === ""){
    alert("Reinserire la password")
  } else{

    user = {
      name: name,
      surname: surname,
      email: email,
      password: password
    }
    if (password === rePassword && checkbox){
      fetch("http://127.0.0.1:3100/rec", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user)
      })
        .then(response => response.json())
        .then(logged_user => {
          localStorage.setItem("user", JSON.stringify(user))
          window.location.href = "index.html"
        }
    
        )
    } else{
      if (!checkbox){
        alert("Accetare i termini e le condizioni")
      } else{
        alert("Le password sono diverse")
      }
    }
  }
}

//------------------------------------------------------------------------------------

//----------------------------------Funzioni di Login---------------------------------

function login() {
  var email = document.getElementById('inputEmail').value.toLowerCase()
  var password = document.getElementById('inputPassword').value


  if (email === ""){
    alert("Inserire la mail")
  } else if (password === ""){
    alert("Inserisci una password")
  } else{
    user = {
      email: email,
      password: password
    }
  }

  fetch("http://127.0.0.1:3100/login", {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(user)
  })
    .then(response => response.json())
    .then(logged_user => {
      localStorage.setItem("user", JSON.stringify(logged_user))
      window.location.href = "index.html"
    }

    )
}

//----------------------------------------

document.getElementById('formLogin').addEventListener("submit", function(event){
  event.preventDefault()
  login()
})

//------------------------------------------------------------------------------------

//----------------------------------Funzione di Ricerca-------------------------------

async function search() {
  var nome = document.getElementById("search").value;

  try {
    const response = await fetch(`https://api.spotify.com/v1/search?q=${nome}&type=album%2Cshow%2Ctrack%2Cepisode%2Cartist&market=IT`, {
      headers: {
        'Authorization': 'Bearer ' + accessToken
      }
    });

    if (response.ok) {
      const risultati = await response.json();

      mostraRisultati(risultati);
    } else {
      console.log('Errore nella richiesta dei risultati:', response.status);
    }
  } catch (error) {
    console.log('Errore nella richiesta dei risultati:', error);
  }
}

//------------------------------------------------------------------------------------

//----------------------------------Funzione di Log-Out-------------------------------

function logout(){
  localStorage.removeItem("user")
}

//------------------------------------------------------------------------------------