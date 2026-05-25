import { useEffect, useState } from 'react'
import anecdotesService from '../services/anecdotes'

export const useField = (type) => {  
const [value, setValue] = useState('')

  const onChange = (event) => {
    setValue(event.target.value)
  }

  const reset = () => {
    setValue('')
  }

  return {
    input: {
      type,
      value,
      onChange
    },
    reset
  }
}

export const useAnecdotes = () => {
  const [anecdotes, setAnecdotes] = useState([])
  
  useEffect(() => {
    anecdotesService.getAll().then(anecs => setAnecdotes(anecs))
  }, [])

  const addAnecdote = async (anecdote) => {
    const newAnec = await anecdotesService.createNew(anecdote)
    setAnecdotes(anecdotes.concat(newAnec))
  }
  return {
    anecdotes,
    addAnecdote
  }
}