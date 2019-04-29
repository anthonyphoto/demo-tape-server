const express = require("express");
const bodyParser = require('body-parser');
const router = express.Router();
const jsonParser = bodyParser.json();

const SpotifyWebApi = require('spotify-web-api-node');
const twilio = require('twilio');

const { SPOTIFY_ID, SPOTIFY_SECRET, TWILIO_SID, TWILIO_TOKEN } = require('./config');

const spotifyApi = new SpotifyWebApi({
  clientId: SPOTIFY_ID,
  clientSecret: SPOTIFY_SECRET
});

const twilioClient = new twilio(TWILIO_SID, TWILIO_TOKEN);

const textTrack = (client, phone, artistInfo, track) => {
  const body = `${artistInfo.name}'s top track: ${track.name}`;

  return client.api.account.messages.create({
    from: '+12672823945',
    to: phone,
    body: body
  });
};


router.post("/", jsonParser, (req, res) => {
  const { artist, phone } = req.body;  // body parsing 
  let artistInfo, tracks, smsResult;
  
  spotifyApi.clientCredentialsGrant() 
  .then(data => {
    spotifyApi.setAccessToken(data.body['access_token']);
    return spotifyApi.searchArtists(artist)
  })
  .then(data => {
    artistInfo = data.body.artists.items[0];

    // return error if artist is not found
    if (!artistInfo) {
      return Promise.reject({ statusCode: 404, message: "Not Found" });
    }

    // used `searchTracks` instead of `getArtistTopTracks` to get more tracks 
    return spotifyApi.searchTracks(`artist:${artistInfo.name}`, {limit: 50});
  })
  .then(data => {
    tracks = data.body.tracks.items.map(item => ({
      name: item.name,
      album: item.album.name,
      date: item.album.release_date,
      preview: item.preview_url,
      popularity: item.popularity
    })).sort((a, b) => b.popularity - a.popularity);  
    // get tracks up to 50 in popularity order

    if (!tracks.length) { // error handling for no track with valid artist
      return Promise.reject({ statusCode: 404, message: "Not Found" });
    }

    return textTrack(twilioClient, phone, artistInfo, tracks[0]) // topTrack
          .then(data => smsResult = { status: data.status, message: data.body })
          .catch(err => smsResult = { status: err.status, message: err.message });
          // capture SMS error separately in order to non-block Spotify result
  })
  .then(() => res.status(201).json({ artistInfo, tracks, smsResult }))
  .catch(err => {
    if (err.statusCode) {
      return res.status(err.statusCode).json(err);
    } 
    console.error(err);
    res.status(500).json({ message: "Internal Server Error" });
  });

});

module.exports = router;
