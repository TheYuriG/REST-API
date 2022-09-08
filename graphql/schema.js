const { buildSchema } = require('graphql');

//? Here we create the Schemas of data that will be sent to the frontend
//? GraphQL requires triple quotes (""") for comments, which is what you see below
module.exports = buildSchema(`
"""
Posts Schema, same as MongoDB except GraphQL doesn't understand timestamps or ID,
so instead we convert and send them as Strings.
"""
type Post {
    """
    The ID of this post. It needs to be a string, rather than a MongoDB ID Object.
    """
    _id: ID!
    """
    Name of the post, this is the header.
    """
    title: String!
    """
    Description of the post, extra information that shouldn't be in the title.
    """
    content: String!
    """
    URL for the image on the server. This is handled by the backend after the
    user uploads the image on the frontend.
    """
    imageUrl: String!
    """
    Information about the account that created this post. This inherits the User
    Schema and all of its inner data properties.
    """
    creator: User!
    """
    A timestamp of when this post was created on the database, but converted to
    ISO string before being passed to GraphQL since it wouldn't understand a
    Date Javascript object
    """
    createdAt: String!
    """
    A timestamp of when this post was last updated on the database, but converted
    to ISO string before being passed to GraphQL since it wouldn't understand a
    Date Javascript object
    """
    updatedAt: String!
}

"""
Users Schema, same as mongoose. 'posts' requires an array of Post datatype,
which we defined previously.
"""
type User {
    """
    ID of this user's database entry on MongoDB. GraphQL can't understand
    the ID Object that MongoDB returns, so we need to first convert it to
    a string before sending to GraphQL.
    """
    _id: ID!
    """
    Name of the User being returned. This will be displayed on posts created
    by this user.
    """
    name: String!
    """
    Email of the user. The information used to log in their account.
    """
    email: String!
    """
    Password of this user. This gets encrypted before being stored on the
    database, in case a security breach happens, so the user accounts aren't
    compromised. To complete a login, the attempt password is encrypted and
    then compared against the database password to validate the login.
    """
    password: String
    """
    The status of the user. By default, the initial status upon creating an
    account is "I am new!", but this can be changed at any time after
    being logged in and using the "Your status" box.
    """
    status: String!
    """
    Array of posts created by this user. This is used to define if an user
    can delete or edit a specific post, by checking if said post ID is
    stored in their user database entry.
    """
    posts: [Post!]!
}

"""
Information that is returned once a successful login attempt completes.
"""
type AuthData {
    """
    The token that is sent to be stored in the client side. This is used in
    every following request that requires authentication and it will
    expire within 1 hour after creation, by default.
    """
    token: String!
    """
    The ID of the user that you has logged in. This is used to attach to
    every authenticated request, so we know which user we are going to create,
    edit or delete posts for.
    """
    userId: String!
}

"""
Mutation Schema to create an user in the database, the basic registering.
This data will be sent to us by the front-end and all 3 fields are required.
"""
input registerData {
    """
    Email address used to create the user account. This is both validated on
    the frontend and the backend, before being accepted. This is never displayed
    on the frontend and is only used again in future login attempts.
    """
    email: String!
    """
    Name of the user. This is displayed on every post this user creates.
    """
    name: String!
    """
    The password of this user. Before being saved on the database, this
    gets encrypted so the user account doesn't get compromised in case of
    database breach access. At a new login attempt, the sent password is
    encrypted and compared with this encrypted stored password to check
    for a valid match.
    """
    password: String!
}

"""
Mutation Schema for creating a new post.
This data will be sent to us by the front-end and all 3 fields are required.
"""
input postData {
    """
    Title of the post that will display on the feed.
    """
    title: String!
    """
    Description of the post. This is only displayed when the user clicks
    "View" and goes into single page mode. Does not display on the feed.
    """
    content: String!
    """
    Image within the post. This is only displayed when the user clicks
    "View" and goes into single page mode. Does not display on the feed.
    """
    imageUrl: String!
    }

"""
Mutation schema to update a post created by the same user as the post.
"""
input updatedPostData {
    """
    ID of this post so we can look up if this post exists and can be updated.
    """
    ID: String!
    """
    Title of the post that will display on the feed.
    """
    title: String!
    """
    Description of the post. This is only displayed when the user clicks
    "View" and goes into single page mode. Does not display on the feed.
    """
    content: String!
    """
    Image within the post. This is only displayed when the user clicks
    "View" and goes into single page mode. Does not display on the feed.
    """
    imageUrl: String!
}

"""
Returns an array with the posts within the pagination limit and the total
number of posts so the pagination can be created
"""
type PostData {
    """
    Array of posts to be rendered in the frontend. The length of this array
    is defined by the variable "postLimitPerPage" which is currently hard-coded
    but could be soft created in the future, if a dropdown menu is added to allow
    users to select how many posts per page should be displayed.
    """
    posts: [Post!]!
    """
    The total count of posts stored in the database, returned to the frontend
    so there can be displayed some pagination.
    """
    totalPosts: Int!
}

"""
All defined mutations: "createUser" for registering a new user, "createPost"
to store a new post in the database, "deletePost" to remove a post from
the database, "updatePost" to replace one or more parts of a post created and
"updateStatus" to replace the user status string.
"""
type RootMutation {
    """
    Attempts to create an user in the database. First check if there is
    already an user in the database with the same email. If not, encrypt
    the password and then store the email, encrypted password and the name
    in the database for future login attempts.
    """
    createUser(userInput: registerData): User!
    """
    Creates a post with the provided title, content and image. Image gets
    uploaded by a REST API endpoint (doesn't affect UX) and then the link
    to said image is sourced here to later be provided back when trying to
    load and render those images. GraphQL is unable to deal with any data
    other than JSON, reason why we use a REST endpoint for image uploads.
    """
    createPost(postInput: postData!): Post!
    """
    Deletes a post created by the same user making the request, using its
    post ID identifier. If the post was created by another user than the
    one making the request, the post won't be deleted. If a post gets deleted,
    its corresponding image also gets deleted from the backend storage.
    """
    deletePost(ID: String!): Boolean!
    """
    Updates the data of a post. Images could be replaced or not,
    depending if the user chose to upload a new image. If a new image is
    provided, the previous image gets deleted.
    """
    updatePost(renewPost: updatedPostData!): Post!
    """
    Update the status update string displayed on the feed with a new string.
    """
    updateStatus(newStatus: String!): Boolean!
}

"""
All database queries: "authenticate" will look up if the provided email and
password will match an user stored in the database. "posts" will return an
array of posts within the pagination specification.
"""
type RootQuery {
    """
    Checks if there is an user in the database with the sent email.
    If there is, encrypt the password and then compare with the password
    stored in the database. If there is a match, login the user successfully
    and return them a token they can use to perform authenticated requests.
    """
    authenticate(email: String!, password: String!): AuthData!
    """
    Returns an array of posts within the pagination specification requested
    and the total number of posts so the feed can be properly paginated.
    """
    posts(page: Int): PostData!
    """
    Queries for information of a single post to view in full detail and
    finally render the imageUrl.
    """
    singlePost(ID: String!): Post!
    """
    Get status update for the current logged in user.
    """
    userStatus(userId: String): String!
}

"""
Definition of where the queries and mutations are organized.
"""
schema {
    query: RootQuery
    mutation: RootMutation
}`);
