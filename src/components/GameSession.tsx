import { API, graphqlOperation } from "aws-amplify";
import React, { useEffect, useState } from "react";
import { debugLog, GameChoice } from "../App";
import { FloatingSymbols } from "./FloatingSymbols";
import { Game } from "./Game";
import { JoinCode } from "./JoinCode";
import MultiplayerGame from "./MultiplayerGame";
import { PickGameBlock } from "./PickGameBlock";
import { updatedGameById } from "../graphql/subscriptions";
// import { ZenObservable } from "zen-observable-ts";
// import { UpdatedGameByIdSubscription } from "../API";
import Observable from "zen-observable-ts";
import { GraphQLGame } from "./graphql-utilities";

interface GameSessionProps {
  gameObj: any;
  dispatch: any;
  createdCode: boolean | null;
  userId: string;
  username: string;
}

export const GameSession: React.FC<GameSessionProps> = (props) => {
  const [gameType, setGameType] = useState<GameChoice>(null);
  const [
    receivedGameState,
    setReceivedGameState,
  ] = useState<GraphQLGame | null>(null);

  useEffect(() => {
    // Not sure why this doesn't have to be marked async
    if (props.createdCode === null) {
      return;
    }
    const subscriptionQuery = API.graphql(
      graphqlOperation(updatedGameById, { roomCode: props.gameObj.roomCode })
    ) as Observable<any>;
    const subscription = subscriptionQuery.subscribe({
      next: ({ value }) => {
        debugLog("======", "Got new item from subscription: ", value);
        if (value?.data?.updatedGameByID?.roomCode !== props.gameObj.roomCode) {
          console.warn("Got update for another room! BAD!");
          return;
        }
        debugLog(
          "Comparing lastUpdateBy to userId: ",
          value?.data?.updatedGameByID?.lastUpdateBy,
          props.userId
        );
        if (value?.data?.updatedGameByID?.lastUpdateBy === props.userId) {
          debugLog("Own update, skipping");
          return;
        } else {
          debugLog("Updating receivedGameState");
          setReceivedGameState(value?.data?.updatedGameByID as GraphQLGame);
        }
      },
      error: ({ errorValue }) => {
        debugLog("error", "Subscription error: ", errorValue);
      },
    });

    return () => {
      if (subscription) subscription.unsubscribe();
    };
  }, [
    props.createdCode,
    props.gameObj?.id,
    props.userId,
    props.gameObj?.roomCode,
  ]);

  return (
    <>
      {gameType === null && !props.gameObj && <FloatingSymbols />}
      {props.createdCode === null ? ( // single player
        gameType === null ? (
          <PickGameBlock setGameType={setGameType} />
        ) : (
          <Game gameType={gameType} />
        )
      ) : props.createdCode ? (
        gameType === null ? (
          <>
            {props.gameObj && (
              <div style={{ textAlign: "center" }}>
                <h2 style={{ fontWeight: "normal" }}>
                  Game room successfully created
                </h2>
                <h1>
                  Now share the code{" "}
                  <span className="roomCode">{props.gameObj.roomCode}</span>{" "}
                  with a friend so they can join in!
                </h1>
              </div>
            )}
            <PickGameBlock setGameType={setGameType} />
          </>
        ) : props.gameObj?.oUsername || receivedGameState?.oUsername ? (
          <>
            <MultiplayerGame
              gameType={gameType}
              gameObj={props.gameObj}
              gameState={receivedGameState}
              userId={props.userId}
              playerIsX={true}
              username={props.username}
            />
          </>
        ) : (
          <div style={{ textAlign: "center" }}>
            <h2 style={{ fontWeight: "normal" }}>
              Game room successfully created.
            </h2>
            Room code:{" "}
            <span className="roomCode">{props.gameObj.roomCode}</span>
            <h3>Waiting on partner to join...</h3>
          </div>
        )
      ) : (
        <>
          {props.gameObj ? (
            props.gameObj.gameType || receivedGameState?.gameType ? (
              <MultiplayerGame
                gameType={props.gameObj.gameType || receivedGameState?.gameType}
                gameObj={props.gameObj}
                gameState={receivedGameState}
                userId={props.userId}
                playerIsX={false}
                username={props.username}
              />
            ) : (
              <div style={{ textAlign: "center" }}>
                <h2 style={{ fontWeight: "normal" }}>
                  Game room successfully joined.
                </h2>
                <h3>Waiting on partner to select game type...</h3>
              </div>
            )
          ) : (
            <div style={{ textAlign: "center", paddingTop: "50px" }}>
              <div style={{ marginBottom: "10px" }}>
                Error joining game. Please try again:
              </div>
              <JoinCode dispatch={props.dispatch} username={props.username} />
            </div>
          )}
        </>
      )}
    </>
  );
};
