/* eslint-disable */

function login (username, password) {
  return new Promise((resolve, reject) => {
    nixLoginInternal(username, password, data => resolve(JSON.parse(data)), reject);
  });
}

function validateToken () {
  return new Promise((resolve, reject) => {
    nixValidateTokenInternal(data => resolve(JSON.parse(data)), reject);
  });
}

function createSession (game) {
  return new Promise((resolve, reject) => {
    nixCreateSessionInternal(game, data => resolve(JSON.parse(data).token), reject);
  });
}

function getFriends () {
  return new Promise((resolve, reject) => {
    nixGetFriendsInternal(data => resolve(JSON.parse(data)), reject);
  });
}

function isTokenAvailable () {
  return nixTokenIsAvailableInternal();
}

function getUserId () {
  return nixGetUidInternal();
}

function getUsername () {
  return nixGetUsernameInternal();
}

function getAvatar () {
  return nixGetAvatarInternal();
}
