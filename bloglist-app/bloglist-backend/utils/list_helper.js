const dummy = (blogs) => {
  return 1
}

const totalLikes = (blogs) => {
  return blogs.reduce((sum, blog) => sum + blog.likes, 0)
}

const favoriteBlog = (blogs) => {
  if (blogs.length === 0) {
    return null
  }
  return blogs.reduce((favorite, newBlog) => {
    return newBlog.likes > favorite.likes ? newBlog : favorite
  })
}

const mostBlogs = (blogs) => {
  if (blogs.length === 0) {
    return null
  }
  const authors = {}
  blogs.forEach(blog => {
    if (authors[blog.author]) {
      authors[blog.author] += 1
    } else {
      authors[blog.author] = 1
    }
  })
  let mostBlogsAuthor = null
  let mostBlogsCount = 0
  for (const author in authors) {
    if (authors[author] > mostBlogsCount) {
      mostBlogsAuthor = author
      mostBlogsCount = authors[author]
    }
  }
  return { author: mostBlogsAuthor, blogs: mostBlogsCount }
}

const mostLikes = (blogs) => {
  if (blogs.length === 0) {
    return null
  }
  const authors = {}
  blogs.forEach(blog => {
    if (authors[blog.author]) {
      authors[blog.author] += blog.likes
    } else {
      authors[blog.author] = blog.likes
    }
  })
  let mostLikesAuthor = null
  let mostLikesCount = 0
  for (const author in authors) {
    if (authors[author] > mostLikesCount) {
      mostLikesAuthor = author
      mostLikesCount = authors[author]
    }
  }
  return { author: mostLikesAuthor, likes: mostLikesCount }
}

module.exports = {
  dummy,
  totalLikes,
  favoriteBlog,
  mostBlogs,
  mostLikes
}