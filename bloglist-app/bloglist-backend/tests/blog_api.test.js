const { test, beforeEach, after, describe } = require('node:test')
const assert = require('node:assert')
const mongoose = require('mongoose')
const supertest = require('supertest')
const bcrypt = require('bcrypt')

const app = require('../app')
const api = supertest(app)

const Blog = require('../models/blog')
const User = require('../models/user')

const two_blogs = [
  {
    _id: "5a422a851b54a676234d17f7",
    title: "React patterns",
    author: "Michael Chan",
    url: "https://reactpatterns.com/",
    likes: 7,
    __v: 0
  },
  {
    _id: "5a422aa71b54a676234d17f8",
    title: "Go To Statement Considered Harmful",
    author: "Edsger W. Dijkstra",
    url: "http://www.u.arizona.edu/~rubinson/copyright_violations/Go_To_Considered_Harmful.html",
    likes: 5,
    __v: 0
  }
]

beforeEach(async () => {
    await Blog.deleteMany({})
    await User.deleteMany({})

    const pswdHash = await bcrypt.hash('password123', 10)

    const user = new User({ username: 'root', name: 'root user', passwordHash: pswdHash })

    const savedUser = await user.save()

    const blogObjects = two_blogs.map(blog => new Blog({ ...blog, user: savedUser._id }))

    const savedBlogs = await Promise.all(blogObjects.map(b => b.save()))

    savedUser.blogs = savedBlogs.map(b => b._id)
    await savedUser.save()

})

describe('with two initial blogs', () => {
    test('blogs are returned as json', async () => {
        await api
            .get('/api/blogs')
            .expect(200)
            .expect('Content-Type', /application\/json/)
    })

    test('all blogs returned', async () => {
        const response = await api.get('/api/blogs')
        assert.strictEqual(response.body.length, two_blogs.length)
    })

    test('id is correct form', async () => {
        const response = await api.get('/api/blogs')
        const blogs = response.body
        assert.ok(blogs.every(b => 'id' in b))
        assert.ok(blogs.every(b => !('_id' in b)))
    })

})

describe('creating a new blog', () => {
    test('succeeds with valid data and valid token', async () => {
        const newBlog = {
            _id: '5a422aa71b54a676234d17f8',
            title: 'Go To Statement Considered Harmful',
            author: 'Edsger W. Dijkstra',
            url: 'http://www.u.arizona.edu/~rubinson/copyright_violations/Go_To_Considered_Harmful.html',
            likes: 5,
            __v: 0
    }
    const loginResponse = await api
        .post('/api/login')
        .send({ username: 'root', password: 'password123' })
        .expect(200)
        .expect('Content-Type', /application\/json/)

    const token = loginResponse.body.token

    const blogsAtStart = await api.get('/api/blogs')
    const blogsAtStartLength = blogsAtStart.body.length

    await api
        .post('/api/blogs')
        .set('Authorization', `Bearer ${token}`)
        .send(newBlog)
        .expect(201)
        .expect('Content-Type', /application\/json/)

    const blogsAtEnd = await api.get('/api/blogs')
    assert.strictEqual(blogsAtEnd.body.length, blogsAtStartLength + 1)

    const titles = blogsAtEnd.body.map(b => b.title)
    assert(titles.includes(newBlog.title))

    })
    
    test('likes default to 0', async () => {
        const newBlog = {
            _id: "5a422bc61b54a676234d17fc",
            title: "Type wars",
            author: "Robert C. Martin",
            url: "http://blog.cleancoder.com/uncle-bob/2016/05/01/TypeWars.html",
            __v: 0
        }

        const loginResponse = await api
            .post('/api/login')
            .send({ username: 'root', password: 'password123' })
            .expect(200)
            .expect('Content-Type', /application\/json/)

        const token = loginResponse.body.token

        const response = await api
            .post('/api/blogs')
            .set('Authorization', `Bearer ${token}`)
            .send(newBlog)
            .expect(201)
            .expect('Content-Type', /application\/json/)

        assert.strictEqual(response.body.likes, 0)
        })
    
    test('blog without title -> 400 Bad Request', async () => {
        const blogsAtStart = await api.get('/api/blogs')
        const newBlog = {
            _id: "0325039u523759825",
            author: "Robert C. Martin",
            url: "http://blog.cleancoder.com/uncle-bob/2016/05/01/TypeWars.html",
            __v: 0
        }
        const loginResponse = await api
            .post('/api/login')
            .send({ username: 'root', password: 'password123' })
            .expect(200)
            .expect('Content-Type', /application\/json/)

        const token = loginResponse.body.token
        await api
            .post('/api/blogs')
            .set('Authorization', `Bearer ${token}`)
            .send(newBlog)
            .expect(400)

        const blogsAtEnd = await api.get('/api/blogs')
        assert.strictEqual(blogsAtEnd.body.length, blogsAtStart.body.length)
    })

    test('blog without url -> 400 Bad Request', async () => {
        const blogsAtStart = await api.get('/api/blogs')
        const newBlog = {
            _id: "0325039u523759825",
            title: "Type wars",
            author: "Robert C. Martin",
            __v: 0
        }
        const loginResponse = await api
            .post('/api/login')
            .send({ username: 'root', password: 'password123' })
            .expect(200)
            .expect('Content-Type', /application\/json/)

        const token = loginResponse.body.token

        await api
            .post('/api/blogs')
            .set('Authorization', `Bearer ${token}`)
            .send(newBlog)
            .expect(400)

        const blogsAtEnd = await api.get('/api/blogs')
        assert.strictEqual(blogsAtEnd.body.length, blogsAtStart.body.length)
    })

    test('no token -> 401 Unauthorized', async () => {
        const blogsAtStart = await api.get('/api/blogs')

        const newBlog = {
            title: "no token blog",
            author: "Unknown",
            url: "http://no-token-blog.com",
            likes: 3
        }

        await api
            .post('/api/blogs')
            .send(newBlog)
            .expect(401)

        const blogsAtEnd = await api.get('/api/blogs')
        assert.strictEqual(blogsAtEnd.body.length, blogsAtStart.body.length)
    })


})

describe('deletion of a blog', () => {
    test('blog can be deleted', async () => {
        const loginResponse = await api
            .post('/api/login')
            .send({ username: 'root', password: 'password123' })
            .expect(200)
            .expect('Content-Type', /application\/json/)

        const token = loginResponse.body.token
        const blogsAtStart = await api.get('/api/blogs')
        const blogToDelete = blogsAtStart.body[0]
        
        await api
            .delete(`/api/blogs/${blogToDelete.id}`)
            .set('Authorization', `Bearer ${token}`)
            .expect(204)
        
        const blogsAtEnd = await api.get('/api/blogs')
        assert.strictEqual(blogsAtEnd.body.length, blogsAtStart.body.length - 1)

        const ids = blogsAtEnd.body.map(b => b.id)
        assert.ok(!ids.includes(blogToDelete.id))
    })
})

describe('updating a blog', () => {
    test('blogs likes can be updated', async () => {
        const blogsAtStart = await api.get('/api/blogs')
        const blogToUpdate = blogsAtStart.body[0]
        
        const updatedLikes = blogToUpdate.likes + 10

        const response = await api
            .put(`/api/blogs/${blogToUpdate.id}`)
            .send({ likes: updatedLikes })
            .expect(200)
            .expect('Content-Type', /application\/json/)
        
        assert.strictEqual(response.body.likes, updatedLikes)

        const blogsAtEnd = await api.get('/api/blogs')
        const updatedBlog = blogsAtEnd.body.find(b => b.id === blogToUpdate.id)
        assert.strictEqual(updatedBlog.likes, updatedLikes)
    })

    test('blog can be updated with all fields', async () => {
        const blogsAtStart = await api.get('/api/blogs')
        const blogToUpdate = blogsAtStart.body[0]

        const updatedBlogData = {
            title: "New Title",
            author: "New Author",
            url: "http://newurl.com",
            likes: 10
        }

        const response = await api
            .put(`/api/blogs/${blogToUpdate.id}`)
            .send(updatedBlogData)
            .expect(200)
            .expect('Content-Type', /application\/json/)

        assert.strictEqual(response.body.title, updatedBlogData.title)
        assert.strictEqual(response.body.author, updatedBlogData.author)
        assert.strictEqual(response.body.url, updatedBlogData.url)
        assert.strictEqual(response.body.likes, updatedBlogData.likes)

        const blogsAtEnd = await api.get('/api/blogs')
        const updatedBlog = blogsAtEnd.body.find(b => b.id === blogToUpdate.id)
        assert.strictEqual(updatedBlog.title, updatedBlogData.title)
        assert.strictEqual(updatedBlog.author, updatedBlogData.author)
        assert.strictEqual(updatedBlog.url, updatedBlogData.url)
        assert.strictEqual(updatedBlog.likes, updatedBlogData.likes)
    })

})

after(async () => {
    await mongoose.connection.close()
})