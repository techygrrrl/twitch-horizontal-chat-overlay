# Twitch Horizontal Chat Overlay with pronouns

- [Features and Roadmap](#features-and-roadmap)
- [Usage](#usage)
- [Development](#development)

## Features and Roadmap

- [x] Show chat messages
- [x] Display Twitch emotes inline
- [x] Configure the visibility time of each message with `time_ms=` (minimum 5000 ms / 5 seconds)
- [x] Show badges
  - [x] Show VIP badges
  - [x] Show moderator badges
  - [x] Show broadcaster badges
  - [x] Show subscriber badges
  - [x] Show bits badges
  - [x] Show bit leader badges
  - [x] Show gift leader badges
- [x] Show pronouns

## Usage

You need to pass the following query params in the URL:

| Param            | Example                                 | Description                                                                                                                                               |
| ---------------- | --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `token`          | _generated UUID_                        | **Required**: Get this from the `abstractrrr tokens` command                                                                                              |
| `broadcaster_id` | `123456789`                             | **Required**: Twitch user ID for the streamer user of the Abstractrrr token                                                                               |
| `host`           | `localhost` (default) or `192.168.0.15` | _(optional)_: Host that abstractrrr is running on.                                                                                                        |
| `port`           | `9999` (default)                        | _(optional)_: Port that abstractrrr is running on.                                                                                                        |
| `time_ms`        | `5000` (default)                        | _(optional)_: Time in milliseconds that each chat message should be displayed for                                                                         |
| `debug`          | `1` or `0`                              | _(optional)_: Provides extra logging                                                                                                                      |
| `hide_error`     | `1` or `0` (default: 0)                 | _(optional)_: Hides the error in the event of a networking event. Configuration errors will still display (e.g. if you don't provide required parameters) |
| `connect`        | `sse` or `ws`                           | _(optional)_: Connection mode, one of: `ws` (web sockets), `sse` (server-sent events) (default: `ws`)                                                     |
| `bg`             | `ef15bf`                                | _(optional)_: Adds the provided hex colour code as a background colour (default: transparent/none)                                                        |
| `fg`             | `fff`                                   | _(optional)_: Adds the provided hex colour code as the text colour (default: ffffff)                                                                      |

Here is an example URL with the hosted version if you'd like to use the one I use:

```
http://chat.techygrrrl.stream/?token=MY_ABSTRACTRRR_TOKEN&debug=1&time_ms=10000&host=192.168.0.15&broadcaster_id=123456789
```

Or locally:

```
http://127.0.0.1:5173/?token=MY_ABSTRACTRRR_TOKEN&debug=1&time_ms=10000&host=192.168.0.15&broadcaster_id=123456789
```

## Development

Project built using Vue 3 + TypeScript + Vite

    npm install
    npm run dev
