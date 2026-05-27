const { test, beforeEach, after, describe } = require('node:test')
const assert = require('node:assert')
const mongoose = require('mongoose')
const supertest = require('supertest')
const bcrypt = require('bcrypt')

const app = require('../app')
const api = supertest(app)

const User = require('../models/user')

describe('create user', () => {
    beforeEach(async () => {
        await User.deleteMany({})
        const passwordHash = await bcrypt.hash('root_password123', 10)
        const user = new User({ username: 'root', name: 'root user', passwordHash })
        await user.save()
    })

    test('succeeds with a fresh username', async () => {
        const usersAtStart = await api.get('/api/users')

        const newUser = {
            username: 'mishka',
            name: 'Mishka Hagelberg',
            password: 'password123'
        }

        await api
            .post('/api/users')
            .send(newUser)
            .expect(201)
            .expect('Content-Type', /application\/json/)

        const usersAtEnd = await api.get('/api/users')
        assert.strictEqual(usersAtEnd.body.length, usersAtStart.body.length + 1)
        
        const usernames = usersAtEnd.body.map(u => u.username)
        assert.ok(usernames.includes(newUser.username))
    })

    test('fails with correct code and message if username not unique', async () => {
        const usersAtStart = await api.get('/api/users')

        const newUser = {
            username: 'root',
            name: 'best user',
            password: 'password123'
        }

        const result = await api
            .post('/api/users')
            .send(newUser)
            .expect(400)
            .expect('Content-Type', /application\/json/)

        assert.match(result.body.error, /unique/i)

        const usersAtEnd = await api.get('/api/users')
        assert.strictEqual(usersAtEnd.body.length, usersAtStart.body.length)
    })

    test('fails with correct code and message if password too short', async () => {
        const usersAtStart = await api.get('/api/users')

        const newUser = {
            username: 'new_user',
            name: 'New User',
            password: 'pw'
        }

        const result = await api
            .post('/api/users')
            .send(newUser)
            .expect(400)
            .expect('Content-Type', /application\/json/)

        assert.match(result.body.error, /password/i)

        const usersAtEnd = await api.get('/api/users')
        assert.strictEqual(usersAtEnd.body.length, usersAtStart.body.length)
    })

    test('fails with correct code and message if no username', async () => {
        const usersAtStart = await api.get('/api/users')

        const newUser = {
            name: 'No Username',
            password: 'password123'
        }

        const result = await api
            .post('/api/users')
            .send(newUser)
            .expect(400)
            .expect('Content-Type', /application\/json/)

        assert.match(result.body.error, /username/i)
        
        const usersAtEnd = await api.get('/api/users')
        assert.strictEqual(usersAtEnd.body.length, usersAtStart.body.length)
    })

    test('fails with correct code and message if no password', async () => {
        const usersAtStart = await api.get('/api/users')
        
        const newUser = {
            username: 'no_pswd',
            name: 'No Password',
        }

        const result = await api
            .post('/api/users')
            .send(newUser)
            .expect(400)
            .expect('Content-Type', /application\/json/)

        assert.match(result.body.error, /password/i)    

        const usersAtEnd = await api.get('/api/users')
        assert.strictEqual(usersAtEnd.body.length, usersAtStart.body.length)
    })

    test('fails with correct code and message if username too short', async () => {
        const usersAtStart = await api.get('/api/users')

        const newUser = {
            username: 'ro',
            name: 'Short Username',
            password: 'password123'
        }

        const result = await api
            .post('/api/users')
            .send(newUser)
            .expect(400)
            .expect('Content-Type', /application\/json/)

        assert.match(result.body.error, /username/i)
        
        const usersAtEnd = await api.get('/api/users')
        assert.strictEqual(usersAtEnd.body.length, usersAtStart.body.length)
    })
})

after(async () => {
    await mongoose.connection.close()
})