const path = require('path')
const express = require('express')
const app = express()
const mongoose = require('mongoose')

const config = require('./utils/config')
const logger = require('./utils/logger')
const middleware = require('./utils/middleware')

const blogsRouter = require('./controllers/blogs')
const userRouter = require('./controllers/users')
const loginRouter = require('./controllers/login')

const testingRouter = require('./controllers/testing')

if (process.env.NODE_ENV === 'test') {
  app.use('/api/testing', testingRouter)
}

mongoose.set('strictQuery', false)

mongoose
  .connect(config.MONGODB_URI)
  .then(() => {
    console.log('connected to MongoDB')
  })
  .catch(error => {
    console.log('error connecting to MongoDB:', error.message)
  })

app.use(express.json())

app.use(middleware.tokenExtractor)

app.use('/api/blogs', blogsRouter)
app.use('/api/users', userRouter)
app.use('/api/login', loginRouter)

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../bloglist-frontend/dist')))

  app.get(/.*/, (request, response) => {
    response.sendFile(
      path.join(__dirname, '../bloglist-frontend/dist/index.html'),
    )
  })
}

app.use(middleware.unknownEndpoint)
app.use(middleware.errorHandler)

module.exports = app
