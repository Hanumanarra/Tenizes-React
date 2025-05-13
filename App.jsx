import { nanoid } from "nanoid";
import { useState, useEffect } from "react";
import Die from "/Die";
import Confetti from "react-confetti";
import { useWindowSize } from "react-use";

import { db } from "./firebase";
import { collection, addDoc } from "firebase/firestore";

export default function App() {
    const { width, height } = useWindowSize();
    const [dice, setDice] = useState(generateAllNewDice());
    const [gameWon, setGameWon] = useState(false);
    const [resultSaved, setResultSaved] = useState(false); 
    const [rollCount, setRollCount] = useState(0);
    const winningValue=dice[0]?.value;


    // Generate a new set of 10 dice
    function generateAllNewDice() {
        return Array.from({ length: 10 }, () => ({
            value: Math.ceil(Math.random() * 6),
            isHeld: false,
            id: nanoid()
        }));
    }

    // Roll dice or reset game
    function rollDice() {
        if (gameWon) {
            setDice(generateAllNewDice());
            setGameWon(false);
            setResultSaved(false); 
            setRollCount(0);
        } else {
            setDice(oldDice =>
                oldDice.map(die =>
                    die.isHeld ? die : { ...die, value: Math.ceil(Math.random() * 6) }
                )
            );
            setRollCount(prev=>prev+1);
        }
    }

    // Toggle hold state for a die
    function hold(id) {
        setDice(oldDice =>
            oldDice.map(die =>
                die.id === id ? { ...die, isHeld: !die.isHeld } : die
            )
        );
    }

    // Check if game is won
    useEffect(() => {
        const allHeld = dice.every(die => die.isHeld);
        const allSame = dice.length > 0 && dice.every(die => die.value === dice[0].value);
        if (allHeld && allSame && !gameWon) {
            setGameWon(true);
        }
    }, [dice]);

    // Save game result to Firebase once when game is won
    useEffect(() => {
        if (gameWon && !resultSaved) {
            saveGameResult();
        }
    }, [gameWon]);

    // Firebase write function
    async function saveGameResult() {
        try {
            await addDoc(collection(db, "gameResults"), {
                timestamp: new Date(),
                diceCount: dice.length,
                rollCount:rollCount,
                winningValue:winningValue,
            });
            console.log("Game result saved!");
            setResultSaved(true);
        } catch (error) {
            console.error(" Failed to save game result:", error);
        }
    }

    // Render each die
    const diceElements = dice.map(die => (
        <Die
            key={die.id}
            value={die.value}
            isHeld={die.isHeld}
            hold={() => hold(die.id)}
        />
    ));

    return (
        <main>
            {gameWon && <Confetti width={width} height={height} />}
            <h1 className="title">Tenzies</h1>
            <p className="instruction">
                Roll until all dice are the same. Click a die to freeze its value between rolls.
            </p>
            <div className="dice-container">{diceElements}</div>
            <button className="dice-roll" onClick={rollDice}>
                {gameWon ? "New Game" : "Roll"}
            </button>
        </main>
    );
