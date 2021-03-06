/* tslint:disable */
/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const getGame = /* GraphQL */ `
  query GetGame($id: ID!) {
    getGame(id: $id) {
      id
      roomCode
      currBoard
      activeSquares
      moveCount
      currMoves
      gameType
      playerIDs
      xUsername
      oUsername
      winner
      winSquares
      currPlayer
      lastUpdateBy
      createdAt
      updatedAt
    }
  }
`;
export const listGames = /* GraphQL */ `
  query ListGames(
    $filter: ModelGameFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listGames(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        roomCode
        currBoard
        activeSquares
        moveCount
        currMoves
        gameType
        playerIDs
        xUsername
        oUsername
        winner
        winSquares
        currPlayer
        lastUpdateBy
        createdAt
        updatedAt
      }
      nextToken
    }
  }
`;
