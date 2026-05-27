const jwt = require('jsonwebtoken')
const User = require('../models/user')
const logger = require('./logger')

const unknownEndpoint = (request, response) => {
  response.status(404).send({ error: 'unknown endpoint' })
}

const errorHandler = (error, request, response, next) => {
  logger.error(error.message)

  if (error.name === 'CastError') {
    return response.status(400).send({ error: 'malformatted id' })
  } else if (error.name === 'ValidationError') {
    return response.status(400).json({ error: error.message })
  } else if (error.name === 'MongoServerError' && error.code === 11000) {
    return response.status(400).json({ error: 'username must be unique' })
  } else if (error.name === 'JsonWebTokenError') {
    return response.status(401).json({ error: 'invalid token' })
  } else if (error.name === 'TokenExpiredError') {
    return response.status(401).json({ error: 'token expired' })
  }

  next(error)
}

const tokenExtractor = (request, response, next) => {
  const authorization = request.get('authorization')
  if (authorization && authorization.startsWith('Bearer ')) {
    request.token = authorization.replace('Bearer ', '')
  } else {
    request.token = null
  }
  next()
}

const userExtractor = async (request, response, next) => {
  try {
    const token = request.token

    const verifiedToken = jwt.verify(token, process.env.SECRET)

    if (!token || !verifiedToken.id) {
      return response.status(401).json({ error: 'missing or invalid token' })
    }

    const user = await User.findById(verifiedToken.id)

    if (!user) {
      return response.status(400).json({ error: 'invalid token' })
    }

    request.user = user
    next()
  } catch (error) {
    next(error)
  }
}

module.exports = {
  unknownEndpoint,
  errorHandler,
  tokenExtractor,
  userExtractor,
}
