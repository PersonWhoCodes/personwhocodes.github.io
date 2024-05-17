const clientId = "45818a98ef3049c091f00a77ad4cf5ee"; // Replace with your client ID
const params = new URLSearchParams(window.location.search);
const code = params.get("code");
const code1 = sessionStorage.getItem("code");
let isPaused = false;

if (!code) {
    redirectToAuthCodeFlow(clientId);
    console.log("Redirect 1")
} else {
    
    if(!code1){
        const accessToken = await getAccessToken(clientId, code);
        sessionStorage.setItem("token", accessToken);
        sessionStorage.setItem("code", code);
        console.log("Redirect 2");
        redirectToAuthCodeFlow(clientId);
    } else {
    console.log('sex');
    console.log(code);
    console.log(code1);

    const accessToken = sessionStorage.getItem("token"); 
    const accessToken1 = await getAccessToken(clientId, code);   

    document.getElementById("next").onclick = function() {next(accessToken1)};
    document.getElementById("play").onclick = function() {togglePlay(accessToken1)};
    document.getElementById("ga").onclick = function() {setStateCupcake(accessToken1)};

    const profile = await fetchProfile(accessToken1);
    let state = await fetchState(accessToken1);

    populateUI(profile, state);
    setState(state, accessToken);

    console.log(profile);
    console.log(state);

    goo(state, accessToken1, accessToken);
    }
}

async function goo(state, token1, token2){
        const newState = await fetchState(token1);

    if(newState.item != state.item){
        state = newState;
        document.getElementById("help").innerText = state.item.name;
        await setState(state, token2);
        console.log("synced");
    } else {
        console.log("no need");
    }
    let tim = setTimeout(goo(state, token1, token2), 10000);
}


export async function redirectToAuthCodeFlow(clientId) {
    const verifier = generateCodeVerifier(128);
    const challenge = await generateCodeChallenge(verifier);

    localStorage.setItem("verifier", verifier);

    const params = new URLSearchParams();
    params.append("client_id", clientId);
    params.append("response_type", "code");
    params.append("redirect_uri", "http://personwhocodes.github.io");
    params.append("scope", "user-read-private user-read-email user-read-currently-playing user-modify-playback-state");
    params.append("code_challenge_method", "S256");
    params.append("code_challenge", challenge);

    document.location = `https://accounts.spotify.com/authorize?${params.toString()}`;
}

function generateCodeVerifier(length) {
    let text = '';
    let possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    for (let i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}

async function generateCodeChallenge(codeVerifier) {
    const data = new TextEncoder().encode(codeVerifier);
    const digest = await window.crypto.subtle.digest('SHA-256', data);
    return btoa(String.fromCharCode.apply(null, [...new Uint8Array(digest)]))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
}


export async function getAccessToken(clientId, code) {
    const verifier = localStorage.getItem("verifier");

    const params = new URLSearchParams();
    params.append("client_id", clientId);
    params.append("grant_type", "authorization_code");
    params.append("code", code);
    params.append("redirect_uri", "http://personwhocodes.github.io");
    params.append("code_verifier", verifier);

    const result = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params
    });

    const { access_token } = await result.json();
    return access_token;
}

async function fetchProfile(token) {
    const result = await fetch("https://api.spotify.com/v1/me", {
        method: "GET", headers: { Authorization: `Bearer ${token}` }
    });

    return await result.json();
}

async function fetchState(token){
    const result = await fetch("https://api.spotify.com/v1/me/player/currently-playing", {
        method: "GET", headers: { Authorization: `Bearer ${token}` }
    });

    try{
        return await result.json();
    } catch(err){
        return 0;
    }
}

async function setState(newState, token){
    const data = {
        "uris": [`spotify:track:${newState.item.id}`]
    }

    const result = await fetch("https://api.spotify.com/v1/me/player/play", {
        method: "PUT",
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    });

}


async function next(token) {
    const result = await fetch("https://api.spotify.com/v1/me/player/next", {
        method: "POST", headers: { Authorization: `Bearer ${token}` }
    })

    console.log(result);
}

async function play(token){

    const data = {
        "position_ms":10000
    };

    const result = await fetch("https://api.spotify.com/v1/me/player/play", {
        method: "PUT", headers: { Authorization: `Bearer ${token}` },
        headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': `application/json`
        },
        body: JSON.stringify(data)
    });

    isPaused = false;

    console.log(result);
}

async function pause(token){
    const result = await fetch("https://api.spotify.com/v1/me/player/pause", {
        method: "PUT", headers: { Authorization: `Bearer ${token}` }
    })

    isPaused = true;

    console.log(result);
}

async function togglePlay(token){
    if(isPaused){
        play(token);
    } else {
        pause(token);
    }
}

function populateUI(profile, state) {
    document.getElementById("displayName").innerText = profile.display_name;
    if (profile.images[0]) {
        const profileImage = new Image(200, 200);
        profileImage.src = profile.images[0].url;
        document.getElementById("avatar").appendChild(profileImage);
        document.getElementById("imgUrl").innerText = profile.images[0].url;
    }
    document.getElementById("id").innerText = profile.id;
    document.getElementById("email").innerText = profile.email;
    document.getElementById("uri").innerText = profile.uri;
    document.getElementById("uri").setAttribute("href", profile.external_urls.spotify);
    document.getElementById("url").innerText = profile.href;
    document.getElementById("url").setAttribute("href", profile.href);

    if(state!=0){
        document.getElementById("help").innerText = state.item.name;
        isPaused = false;
    } else {
        document.getElementById("help").innerText = "Not currently playing anything";
        isPaused = true;
    }
}



