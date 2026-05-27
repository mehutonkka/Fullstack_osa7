const middleware = require('../utils/middleware')
const jwt = require('jsonwebtoken')
const blogsRouter = require('express').Router()
const { urlencoded } = require('express')

const Blog = require('../models/blog')
const User = require('../models/user')

blogsRouter.get('/', async (request, response) => {
  const blogs = await Blog.find({}).populate('user', { username: 1, name: 1 })

  response.json(blogs)
})

blogsRouter.post(
  '/',
  middleware.userExtractor,
  async (request, response, next) => {
    try {
      const body = request.body
      const user = request.user

      const blog = new Blog({
        title: body.title,
        author: body.author,
        url: body.url,
        likes: body.likes ?? 0,
        user: user.id,
      })

      const savedBlog = await blog.save()

      user.blogs = user.blogs.concat(savedBlog._id)
      await user.save()

      response.status(201).json(savedBlog)
    } catch (error) {
      next(error)
    }
  },
)

blogsRouter.delete(
  '/:id',
  middleware.userExtractor,
  async (request, response, next) => {
    try {
      const user = request.user

      const blog = await Blog.findById(request.params.id)

      if (!blog) {
        return response.status(404).json({ error: 'no blog found' })
      }

      if (blog.user.toString() !== user.id.toString()) {
        return response
          .status(403)
          .json({ error: 'only creator can delete blog' })
      }

      await Blog.findByIdAndDelete(request.params.id)

      response.status(204).end()
    } catch (error) {
      next(error)
    }
  },
)

blogsRouter.put('/:id', async (request, response, next) => {
  try {
    const id = request.params.id
    const body = request.body

    const updates = {
      title: body.title,
      author: body.author,
      url: body.url,
      likes: body.likes,
    }

    const updatedBlog = await Blog.findByIdAndUpdate(id, updates, {
      returnDocument: 'after',
    })
    response.status(200).json(updatedBlog)
  } catch (error) {
    next(error)
  }
})

module.exports = blogsRouter
