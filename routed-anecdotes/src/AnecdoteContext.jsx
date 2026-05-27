/* eslint-disable react-refresh/only-export-components */


import { createContext, useContext, useState, useEffect } from "react"
import anecdoteService from "./services/anecdotes"

const AnecdoteContext = createContext()

export const AnecdoteContextProvider = ( { children } ) => {
    const [anecdotes, setAnecdotes] = useState([])

    useEffect(() => {
        anecdoteService.getAll().then(anecs =>
            setAnecdotes(anecs)
        )
    }, [])

    const addAnecdote = async (anecdote) => {
        const newAnecdote = await anecdoteService.createNew(anecdote)
        setAnecdotes(anecdotes.concat(newAnecdote))
    }

    const deleteAnecdote = async (id) => {
        await anecdoteService.deleteAnecdote(id)
        setAnecdotes(anecdotes.filter(a => a.id !== id))
    }

    return (
        <AnecdoteContext.Provider value={{ anecdotes, addAnecdote, deleteAnecdote }}>
            {children}
        </AnecdoteContext.Provider>
    )
}

export const useAnecdotes = () => {
    return useContext(AnecdoteContext)
}