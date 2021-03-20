let userToken;

const url = 'https://accounts.spotify.com/authorize';
const client_id = 'dac2407fc2c146cda4238cd504dcb58e';
const redirect_uri = 'http://twan_jammming.surge.sh';

const Spotify = {
    getAccessToken() {
        if (userToken !== undefined) {
            return userToken;
        }
        const accessTokenMatch = window.location.href.match(/access_token=([^&]*)/);
        const expiresInMatch = window.location.href.match(/expires_in=([^&]*)/);
        if (accessTokenMatch && expiresInMatch) {
            userToken = accessTokenMatch[1];
            window.setTimeout(() => userToken = '', expiresInMatch[1] * 1000);
            window.history.pushState('Access Token', null, '/');
            return userToken;
        } else {
            window.location = `${url}?client_id=${client_id}&response_type=token&scope=playlist-modify-public&redirect_uri=${redirect_uri}`;
        }
    },
    search(term) {
        const accessToken = this.getAccessToken();
        return fetch(`https://api.spotify.com/v1/search?type=track&q=${term}`, {
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        }).then(response => {
            return response.json();
        }).then(jsonResponse => {
            if (!jsonResponse.tracks) {
                return [];
            } 
            return jsonResponse.tracks.items.map(track => ({
                id: track.id,
                artist: track.artists[0].name,
                album: track.album.name,
                name: track.name,
                uri: track.uri
            }));
        });       
    },
    savePlaylist(playlistName, tracks) {
        if (!playlistName || !tracks) {
            return;
        }
        const accessToken = this.getAccessToken();
        const headers = { Authorization: `Bearer ${accessToken}` };
        let userID;
        return fetch('https://api.spotify.com/v1/me', { headers: headers }
        ).then(response => response.json()
        ).then(jsonResponse => {
            userID = jsonResponse.id;
            return fetch(`https://api.spotify.com/v1/users/${userID}/playlists`,
            {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({ name: playlistName })
            }).then(response => response.json()
            ).then(jsonResponse => {
                const playlistId = jsonResponse.id;
                return fetch(`https://api.spotify.com/v1/users/${userID}/playlists/${playlistId}/tracks`, {
                    method: 'POST',
                    headers: headers,
                    body: JSON.stringify({ uris: tracks })
                });
            });
        });
    }
};

export default Spotify;