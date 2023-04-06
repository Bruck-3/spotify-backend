require("dotenv").config();
const axios = require("axios").default;
var randomstring = require("randomstring");
const queryString = require("query-string");
const express = require("express");
const app = express();

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;

app.get("/", (req, res) => {
  const data = {
    name: "John Doe",
    age: 30,
  };
  res.json(data);
});

const stateKey = "spotify_auth_state";

// Get Spotify Authorization
app.get("/login", (req, res) => {
  const state = randomstring.generate();
  res.cookie(stateKey, state);

  const scope = "user-read-private user-read-email user-read-recently-played";
  const queryParams = queryString.stringify({
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: "code",
    state: state,
    scope: scope,
  });
  res.redirect(`https:accounts.spotify.com/authorize?${queryParams}`);
});

app.get("/callback", (req, res) => {
  const code = req.query.code || null;
  const state = req.query.state || null;
  axios({
    method: "post",
    url: "https://accounts.spotify.com/api/token",
    data: queryString.stringify({
      code: code,
      redirect_uri: REDIRECT_URI,
      grant_type: "authorization_code",
    }),
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${new Buffer.from(
        `${CLIENT_ID}:${CLIENT_SECRET}`
      ).toString("base64")}`,
    },
  })
    .then((response) => {
      if (response.status == 200) {
        const { access_token, refresh_token } = response.data;

        const queryparams = queryString.stringify({
          access_token: access_token,
          refresh_token: refresh_token,
        });

        res.redirect(`http://localhost:8080/top-music?${queryparams}`);
      } else {
        res.redirect(
          "/?" +
            queryString.stringify({
              error: "invalid_token",
            })
        );
      }
    })
    .catch((error) => {
      res.send(error);
    });
});
// refresh token if expired
app.get("/refresh_token", (req, res) => {
  const { refresh_token } = req.query;
  axios
    .get("https://api.spotify.com/token", {
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${new Buffer.from(
          `${CLIENT_ID}:${process.env.CLIENT_SECRET}`
        ).toString("base64")}`,
      },
      data: queryString.stringify({
        grant_type: "refresh_token",
        refresh_token: refresh_token,
      }),
    })
    .then((response) => {
      res.send(response.data);
    })
    .catch((error) => {
      res.send(error);
    });
});
const port = 8000;

app.listen(port, () => {
  console.log(`Listening on port http://localhost:${port}`);
});
