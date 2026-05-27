import { useNavigate } from 'react-router-dom'
import { useField } from '../hooks'
import { useAnecdotes } from '../AnecdoteContext.jsx'

const CreateNew = () => {
  const { addAnecdote } = useAnecdotes()
  const content = useField('text')
  const author = useField('text')
  const info = useField('text')
  const navigate = useNavigate()

  const handleSubmit = (e) => {
    e.preventDefault()

    addAnecdote({
      content: content.input.value,
      author: author.input.value,
      info: info.input.value,
      votes: 0
    })

    navigate('/')
  }

  const resetHandler = () => {
      content.reset()
      author.reset()
      info.reset()
    }

  return (
    <div>
      <h2>create a new anecdote</h2>
      <form onSubmit={handleSubmit}>
        <div>
          content
          <input {...content.input} />
        </div>
        <div>
          author
          <input {...author.input} />
        </div>
        <div>
          url for more info
          <input {...info.input} />
        </div>
        <button>create</button>
        <button type="button" onClick={resetHandler}>reset</button>
      </form>
    </div>
  )
}

export default CreateNew
