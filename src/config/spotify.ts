export const SPOTIFY_CONFIG = {
    CLIENT_ID: '4730332554b7492dabed08d7000979f7',
    CLIENT_SECRET: '9b361703e57f4d429a98489fdc6e0ddf',
    REDIRECT_URI: 'moodify://auth',
    SCOPES: [
      'user-read-private',
      'user-read-email',
      'user-library-read',
      'user-library-modify',
      'playlist-read-private',
      'playlist-modify-public',
      'playlist-modify-private',
      'user-top-read',
      'user-read-recently-played',
      'user-read-playback-state',
      'user-modify-playback-state',
      'user-read-currently-playing',
      'streaming',
      'app-remote-control'
    ].join(' ')
  };