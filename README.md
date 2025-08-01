# Wordle Game - Typescript Implementation

A demo implementation of Wordle using TypeScript, featuring standalone CLI gameplay and client-server implementation.

## Features

-   **Core Wordle Game**

    -   Complete implementation with configurable predefined list
    -   Configurable game settings and session management
    -   Optional validation that restricts guesses to words within the game's word list.
    -   Auto clean up inactive session after a specific time.
    -   Reference: [NY Times](https://www.nytimes.com/games/wordle/index.html)

-   **Client-Server Architecture**
    -   Implement RESTful API with session management
    -   Player does not know the answer until the word is guessed or game is over
    -   Server-side perform input validation

## Game Rules

-   Guess a 5-letter word within predefined number of attempts
-   The color of the tiles will change to show how close your guess was to the word.
    -   🟩 means correct letter in the word and in the correct spot
    -   🟨 means correct letter in the word but in the wrong spot
    -   🟥 means letter not in any spot

#### Examples:

```
P 🟥 O 🟥 I 🟥 N 🟥 T 🟩
T is in the word and in the correct spot.
```

```
G 🟨 U 🟥 E 🟥 S 🟥 S 🟥
G is in the word but in the wrong spot
```

## Game Configuration Options

-   Maximum Attempts: Set number of allowed attempts before running out of moves (default: 6 attempts)
-   Strict Mode: Accept any 5-letter combination or only words within the game's word list
-   Custom Word List: Configure predefined list of words to be used in the game

## Setup Guide

### Server Setup (Standalone CLI Mode)

```
cd server
npm install
npm run cli
```

### Server Setup (Client-Server Mode)

```
cd server
npm install
npm run server
```

### Client Setup

```
cd client
npm install
npm run client
```

## API Endpoints

```
GET     /health                             # health check
POST    /api/v1/wordle                      # create a new game session
GET     /api/v1/wordle/:sessionID           # get selected game status
POST    /api/v1/wordle/:sessionID/guess     # submit a word guess
DELETE  /api/v1/wordle:sessionID            # end game session
```
