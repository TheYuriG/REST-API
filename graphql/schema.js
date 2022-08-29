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
Mutation Schema to create an user in the database, the basic registering.
This data will be sent to us by the front-end and all 3 fields are required.
"""
    input registerData {
        email: String!
        name: String!
        password: String!
    }

"""
The mutation we define to create a new user in the database. It requires an
object with 3 required properties and returns an User upon completion.
"""
    type Register {
        createUser(userInput: registerData): User!
    }

"""
Example query to be used with Graphiql. Doesn't return anything useful
"""
type RootQuery {
    hello: String
}

"""
Definition of our queries and mutations
"""
    schema {
        query: RootQuery
        mutation: Register
    }`);
