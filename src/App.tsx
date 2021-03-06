import React, { useReducer } from "react";
import "./App.css";
import { makeRoomCode } from "./components/InitialsAndUtilities";
import Amplify, { API, graphqlOperation } from "aws-amplify";
import awsconfig from "./aws-exports";
import { createGame } from "./graphql/mutations";
import { PickMultiplayer } from "./components/PickMultiplayer";
import { GameSession } from "./components/GameSession";
import { UsernameInput } from "./components/UsernameInput";
import Loading from "./components/Loading";
import { FloatingSymbols } from "./components/FloatingSymbols";
import { JoinOrCreate } from "./components/JoinOrCreate";
import { JoinCode } from "./components/JoinCode";
import { getGame } from "./graphql/queries";
import { GetGameQuery } from "./API";
import { GraphQLResult } from "@aws-amplify/api";

Amplify.configure(awsconfig);

export type GameChoice = "ADD" | "MULT" | "ALG" | null;

async function createGameObj(username?: string) {
  // Creator is always player X
  const code = makeRoomCode();
  const game = { id: code, roomCode: code, xUsername: username };
  return await API.graphql(graphqlOperation(createGame, { input: game }));
}

export async function getGameObj(code: string) {
  // const game = { roomCode: { eq: code.trim().toUpperCase() }};
  // return await API.graphql(graphqlOperation(listGames, {filter: game})) as GraphQLResult<ListGamesQuery>;
  return (await API.graphql(
    graphqlOperation(getGame, { id: code.trim().toUpperCase() })
  )) as GraphQLResult<GetGameQuery>;
}

export const UPDATE_GLOBALSTATE_VALUE = "UPDATE_GLOBALSTATE_VALUE";

export const globalActions = {
  CREATE_GAME: "CREATE_GAME",
} as const;

type StateField<T> = {
  [P in keyof T]?: T[P];
};

export const DEBUG = false as boolean;

export function debugLog(type: any, ...messages: any) {
  if (DEBUG === false) {
    return;
  }
  let newType = type;
  let newMessages = messages;
  if (type !== "log" && type !== "error" && type !== "warn") {
    newType = "log";
    newMessages = [type].concat(messages);
  }
  switch (newType) {
    case "log":
      console.log(...newMessages);
      return;
    case "error":
      console.error(...newMessages);
      return;
    case "warn":
      console.warn(...newMessages);
      return;
  }
}

export const globalInitialState = {
  isMultiplayer: null as boolean | null,
  username: "",
  headerText: "Math Four-In-A-Row",
  APIgameObj: null as any,
  isLoading: false,
  currError: "",
  createGameCode: null as boolean | null,
};

function App() {
  const [globalState, globalDispatch] = useReducer(
    globalReducer,
    globalInitialState
  );
  const generatedUserId = makeRoomCode(16);

  interface UpdateAction {
    type: typeof UPDATE_GLOBALSTATE_VALUE;
    payload: StateField<typeof globalInitialState>;
  }

  interface GlobalAction {
    type: typeof globalActions[keyof typeof globalActions];
    payload: any;
  }

  function globalReducer(
    state: typeof globalInitialState,
    action: UpdateAction | GlobalAction
  ): typeof globalInitialState {
    switch (action.type) {
      case UPDATE_GLOBALSTATE_VALUE:
        return {
          ...state,
          ...action.payload,
        };
      case globalActions.CREATE_GAME:
        debugLog(
          "Payload in dispatch create game: ",
          action.payload?.APIgameObj
        );
        return {
          ...state,
          isMultiplayer: action.payload.isMultiplayer,
          APIgameObj: action.payload?.APIgameObj || null,
          isLoading: false,
          currError: "",
        };
      default:
        return state;
    }
  }

  // const encouragingMessages = ["Great!", "Nice choice!", "Amazing!", "That's what I was going to pick!", "You're a real mathematician!", "Now that's some real arithmetic!"];
  const MultiplayerSetup = () => {
    return globalState.createGameCode === null ? (
      <>
        <h1>Ok, now:</h1>
        <JoinOrCreate
          dispatch={globalDispatch}
          createGameObj={createGameObj}
          username={globalState.username}
        />
      </>
    ) : globalState.createGameCode ? (
      globalState.isLoading ? (
        <>
          Creating your remote game
          <Loading dotsOnly={true} />
        </>
      ) : (
        <></>
      )
    ) : globalState.isLoading ? (
      <>
        Joining remote game
        <Loading dotsOnly={true} />
      </>
    ) : (
      <>
        <h1>Enter the code your friend sent you.</h1>
        <JoinCode username={globalState.username} dispatch={globalDispatch} />
      </>
    );
  };

  const isReady =
    globalState.currError === "" &&
    (globalState.isMultiplayer
      ? globalState.APIgameObj
      : globalState.username !== null && globalState.isMultiplayer !== null);

  return (
    <>
      <header className="App-header">
        <a href="/" style={{ color: "white", textDecoration: "none" }}>
          {globalState.headerText}
        </a>
      </header>
      <main>
        <div style={{ textAlign: "center" }}>
          {!globalState.username ? (
            <>
              <h1>Welcome! Enter your username to get started</h1>
              <UsernameInput dispatch={globalDispatch} />
            </>
          ) : globalState.isMultiplayer === null ? (
            <>
              <h1>Great - thanks, {globalState.username}!</h1>
              <PickMultiplayer dispatch={globalDispatch} />
            </>
          ) : globalState.isMultiplayer && !globalState.APIgameObj ? (
            <MultiplayerSetup />
          ) : (
            ""
          )}
        </div>
        {globalState.currError && (
          <div id="moveError" className="active">
            Oh no! There was an error: {globalState.currError}
          </div>
        )}
        {isReady ? (
          <GameSession
            createdCode={globalState.createGameCode}
            userId={generatedUserId}
            gameObj={globalState.APIgameObj}
            dispatch={globalDispatch}
            username={globalState.username}
          />
        ) : (
          <FloatingSymbols />
        )}
      </main>
    </>
  );
}

export default App;
