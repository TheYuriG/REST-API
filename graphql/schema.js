const { buildSchema } = require('graphql');

//? Here we create the Schemas of data that will be sent to the frontend
//? GraphQL requires triple quotes (""") for comments, which is what you see below
module.exports = buildSchema(`
"""
Posts Schema, same as mongoose except GraphQL doesn't understand timestamps,
so instead we pull them as Strings.
"""
    type Post {
        _id: ID!
        title: String!
        content: String!
        imageUrl: String!
        creator: User!
        createdAt: String!
        updatedAt: String!
    }

"""
Users Schema, same as mongoose. 'posts' requires an array of Post datatype,
which we defined previously.
"""
    type User {
        _id: ID!
        name: String!
        email: String!
        password: String
        status: String!
        posts: [Post!]!
    }

"""
Information that is returned once a successful login attempt completes.
"""
type AuthData {
    token: String!
    userId: String!
}

"""
Returns an array with the posts within the pagination limit and the total
number of posts so the pagination can be created
"""
type PostData {
    posts: [Post!]!
    totalPosts: Int!
}

"""
Mutation Schema to create an user in the database, the basic registering.
This data will be sent to us by the front-end and all 3 fields are required.
"""
    input registerData {
        email: String!
        name: String!
        password: String!
    }

"""
Mutation Schema for creating a new post.
This data will be sent to us by the front-end and all 3 fields are required.
"""
    input postData {
        title: String!
        content: String!
        imageUrl: String!
    }

"""
Defined mutations: "createUser" for registering a new user and "createPost"
to store a new post in the database
"""
    type RootMutation {
        createUser(userInput: registerData): User!
        createPost(postInput: postData): Post!
    }

"""
Login query, requesting validation of email and password
"""
type RootQuery {
    authenticate(email: String!, password: String!): AuthData!
    posts(page: Int): PostData!
}

"""
Definition of our queries and mutations
"""
    schema {
        query: RootQuery
        mutation: RootMutation
    }`);
